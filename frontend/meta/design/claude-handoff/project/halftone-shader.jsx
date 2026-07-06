/* global React */
// ============================================================
// <Halftone/> · React + WebGL halftone-duotone shader
// Implements the algorithm in halftone-duotone-algorithm.md:
//   1. UV → grid-space coords
//   2. sigmoid contrast → luminance per cell
//   3. dot shape (classic / gooey / holes / soft) sized by luma
//   4. sub-cell sampling for smooth styles
//   5. duotone blend OR original-color tint
//   6. value-noise grain mixer + grain overlay
//   7. image-boundary smoothstep mask
//
// All instances share a SINGLE offscreen WebGL canvas (browsers
// cap WebGL contexts at ~16; otherwise the GPU process crashes
// with the "Aw, Snap" / dead-tab icon when many <Halftone/>s
// mount). Each instance gets a tiny 2D canvas and we `drawImage`
// the shared GL canvas into it.
// ============================================================
const { useRef: useRefHT, useEffect: useEffectHT, useState: useStateHT } = React;

const HT_VERT = `#version 300 es
precision mediump float;
in vec2 a_pos;
uniform float u_imageAspectRatio;
uniform vec2 u_resolution;
out vec2 v_imageUV;
void main() {
  vec2 uv = (a_pos + 1.0) * 0.5;
  // Cover-style fit: scale UV so the image fills the canvas without
  // distortion. Trims overflow on the longer axis.
  float canvasAR = u_resolution.x / u_resolution.y;
  vec2 c = vec2(0.5);
  vec2 scaled;
  if (canvasAR > u_imageAspectRatio) {
    // canvas wider than image — image height fills, crop vertically
    float k = u_imageAspectRatio / canvasAR;
    scaled = vec2(uv.x, c.y + (uv.y - c.y) * k);
  } else {
    float k = canvasAR / u_imageAspectRatio;
    scaled = vec2(c.x + (uv.x - c.x) * k, uv.y);
  }
  v_imageUV = scaled;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const HT_FRAG = `#version 300 es
precision mediump float;

uniform vec4 u_colorFront;
uniform vec4 u_colorBack;
uniform float u_radius;
uniform float u_contrast;
uniform sampler2D u_image;
uniform float u_imageAspectRatio;
uniform float u_size;
uniform float u_grainMixer;
uniform float u_grainOverlay;
uniform float u_grainSize;
uniform float u_grid;
uniform bool u_originalColors;
uniform bool u_inverted;
uniform float u_type;

in vec2 v_imageUV;
out vec4 fragColor;

#define PI 3.14159265359
mat2 rotate(float a){ float c = cos(a), s = sin(a); return mat2(c,-s,s,c); }
vec2 rotate(vec2 v, float a){ return rotate(a) * v; }
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 78.233);
  return fract(p.x * p.y);
}

float valueNoise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

float lst(float edge0, float edge1, float x){ return clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0); }
float sst(float edge0, float edge1, float x){ return smoothstep(edge0, edge1, x); }

float getCircle(vec2 uv, float r, float baseR){
  r = mix(.25 * baseR, 0., r);
  float d = length(uv - .5);
  float aa = fwidth(d);
  return 1. - smoothstep(r - aa, r + aa, d);
}
float getCell(vec2 uv){
  float insideX = step(0.0, uv.x) * (1.0 - step(1.0, uv.x));
  float insideY = step(0.0, uv.y) * (1.0 - step(1.0, uv.y));
  return insideX * insideY;
}
float getCircleWithHole(vec2 uv, float r, float baseR){
  float cell = getCell(uv);
  r = mix(.75 * baseR, 0., r);
  float rMod = mod(r, .5);
  float d = length(uv - .5);
  float aa = fwidth(d);
  float circle = 1. - smoothstep(rMod - aa, rMod + aa, d);
  if (r < .5) { return circle; } else { return cell - circle; }
}
float getGooeyBall(vec2 uv, float r, float baseR){
  float d = length(uv - .5);
  float sizeRadius = .3;
  if (u_grid == 1.) sizeRadius = .42;
  sizeRadius = mix(sizeRadius * baseR, 0., r);
  d = 1. - sst(0., sizeRadius, d);
  d = pow(d, 2. + baseR);
  return d;
}
float getSoftBall(vec2 uv, float r, float baseR){
  float d = length(uv - .5);
  float sizeRadius = clamp(baseR, 0., 1.);
  sizeRadius = mix(.5 * sizeRadius, 0., r);
  d = 1. - lst(0., sizeRadius, d);
  float powRadius = 1. - lst(0., 2., baseR);
  d = pow(d, 4. + 3. * powRadius);
  return d;
}
float getUvFrame(vec2 uv, vec2 pad){
  float aa = 0.0001;
  float left = smoothstep(-pad.x, -pad.x + aa, uv.x);
  float right = smoothstep(1.0 + pad.x, 1.0 + pad.x - aa, uv.x);
  float bottom = smoothstep(-pad.y, -pad.y + aa, uv.y);
  float top = smoothstep(1.0 + pad.y, 1.0 + pad.y - aa, uv.y);
  return left * right * bottom * top;
}
float sigmoid(float x, float k){ return 1.0 / (1.0 + exp(-k * (x - 0.5))); }
float getLumAtPx(vec2 uv, float contrast){
  vec4 tex = texture(u_image, uv);
  vec3 color = vec3(sigmoid(tex.r, contrast), sigmoid(tex.g, contrast), sigmoid(tex.b, contrast));
  float lum = dot(vec3(0.2126, 0.7152, 0.0722), color);
  lum = mix(1., lum, tex.a);
  lum = u_inverted ? (1. - lum) : lum;
  return lum;
}
float getLumBall(vec2 p, vec2 pad, vec2 inCellOffset, float contrast, float baseR, float stepSize, out vec4 ballColor){
  p += inCellOffset;
  vec2 uv_i = floor(p);
  vec2 uv_f = fract(p);
  vec2 samplingUV = (uv_i + .5 - inCellOffset) * pad + vec2(.5);
  float outOfFrame = getUvFrame(samplingUV, pad * stepSize);
  float lum = getLumAtPx(samplingUV, contrast);
  ballColor = texture(u_image, samplingUV);
  ballColor.rgb *= ballColor.a;
  ballColor *= outOfFrame;
  float ball = 0.;
  if (u_type == 0.)      ball = getCircle(uv_f, lum, baseR);
  else if (u_type == 1.) ball = getGooeyBall(uv_f, lum, baseR);
  else if (u_type == 2.) ball = getCircleWithHole(uv_f, lum, baseR);
  else if (u_type == 3.) ball = getSoftBall(uv_f, lum, baseR);
  return ball * outOfFrame;
}

void main() {
  float stepMultiplier = 1.;
  if (u_type == 0.) stepMultiplier = 2.;
  else if (u_type == 1. || u_type == 3.) stepMultiplier = 6.;

  float cellsPerSide = mix(300., 7., pow(u_size, .7));
  cellsPerSide /= stepMultiplier;

  float cellSizeY = 1. / cellsPerSide;
  vec2 pad = cellSizeY * vec2(1. / u_imageAspectRatio, 1.);
  if (u_type == 1. && u_grid == 1.) pad *= .7;

  vec2 uv = v_imageUV;
  uv -= vec2(.5);
  uv /= pad;

  float contrast = mix(0., 15., pow(u_contrast, 1.5));
  float baseRadius = u_radius;
  if (u_originalColors == true) {
    contrast = mix(.1, 4., pow(u_contrast, 2.));
    baseRadius = 2. * pow(.5 * u_radius, .3);
  }

  float totalShape = 0.;
  vec3 totalColor = vec3(0.);
  float totalOpacity = 0.;
  vec4 ballColor;
  float shape;
  float stepSize = 1. / stepMultiplier;

  for (float x = -0.5; x < 0.5; x += stepSize) {
    for (float y = -0.5; y < 0.5; y += stepSize) {
      vec2 offset = vec2(x, y);
      if (u_grid == 1.) {
        float rowIndex = floor((y + .5) / stepSize);
        float colIndex = floor((x + .5) / stepSize);
        if (stepSize == 1.) {
          rowIndex = floor(uv.y + y + 1.);
          if (u_type == 1.) colIndex = floor(uv.x + x + 1.);
        }
        if (u_type == 1.) {
          if (mod(rowIndex + colIndex, 2.) == 1.) continue;
        } else {
          if (mod(rowIndex, 2.) == 1.) offset.x += .5 * stepSize;
        }
      }
      shape = getLumBall(uv, pad, offset, contrast, baseRadius, stepSize, ballColor);
      totalColor += ballColor.rgb * shape;
      totalShape += shape;
      totalOpacity += shape;
    }
  }
  const float eps = 1e-4;
  totalColor /= max(totalShape, eps);
  totalOpacity /= max(totalShape, eps);

  float finalShape = 0.;
  if (u_type == 0.)      finalShape = min(1., totalShape);
  else if (u_type == 1.) { float aa = fwidth(totalShape); finalShape = smoothstep(.5 - aa, .5 + aa, totalShape); }
  else if (u_type == 2.) finalShape = min(1., totalShape);
  else                   finalShape = totalShape;

  vec2 grainSize = mix(vec2(2000.), vec2(200.), u_grainSize) * vec2(1., 1. / u_imageAspectRatio);
  vec2 grainUV = v_imageUV - .5;
  grainUV *= grainSize;
  grainUV += .5;
  float grain = valueNoise(grainUV);
  grain = smoothstep(.55, .7 + .2 * u_grainMixer, grain);
  grain *= u_grainMixer;
  finalShape = mix(finalShape, 0., grain);

  vec3 color = vec3(0.);
  float opacity = 0.;
  if (u_originalColors == true) {
    color = totalColor * finalShape;
    opacity = totalOpacity * finalShape;
    vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
    color = color + bgColor * (1. - opacity);
    opacity = opacity + u_colorBack.a * (1. - opacity);
  } else {
    vec3 fgColor = u_colorFront.rgb * u_colorFront.a;
    float fgOpacity = u_colorFront.a;
    vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
    float bgOpacity = u_colorBack.a;
    color = fgColor * finalShape;
    opacity = fgOpacity * finalShape;
    color += bgColor * (1. - opacity);
    opacity += bgOpacity * (1. - opacity);
  }

  float grainOverlay = valueNoise(rotate(grainUV, 1.) + vec2(3.));
  grainOverlay = mix(grainOverlay, valueNoise(rotate(grainUV, 2.) + vec2(-1.)), .5);
  grainOverlay = pow(grainOverlay, 1.3);
  float grainOverlayV = grainOverlay * 2. - 1.;
  vec3 grainOverlayColor = vec3(step(0., grainOverlayV));
  float grainOverlayStrength = u_grainOverlay * abs(grainOverlayV);
  grainOverlayStrength = pow(grainOverlayStrength, .8);
  color = mix(color, grainOverlayColor, .5 * grainOverlayStrength);
  opacity += .5 * grainOverlayStrength;
  opacity = clamp(opacity, 0., 1.);
  fragColor = vec4(color, opacity);
}
`;

function htParseColor(c) {
  if (Array.isArray(c)) return [c[0]/255, c[1]/255, c[2]/255, c[3] ?? 1];
  if (typeof c === 'object' && c.r != null) return [c.r/255, c.g/255, c.b/255, c.a ?? 1];
  if (typeof c !== 'string') return [0, 0, 0, 1];
  const s = c.trim();
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }
  if (s.startsWith('rgb')) {
    const m = s.match(/-?\d+\.?\d*/g);
    if (m) return [+m[0]/255, +m[1]/255, +m[2]/255, m[3] != null ? +m[3] : 1];
  }
  return [0, 0, 0, 1];
}

function htCompile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('Halftone shader compile error:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}
function htProgram(gl) {
  const v = htCompile(gl, gl.VERTEX_SHADER, HT_VERT);
  const f = htCompile(gl, gl.FRAGMENT_SHADER, HT_FRAG);
  if (!v || !f) return null;
  const p = gl.createProgram();
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error('Halftone shader link error:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

// ============================================================
// SHARED RENDERER — a single hidden GL canvas + program + cache,
// reused across every <Halftone/> instance.
// ============================================================
const HT_SHARED = (() => {
  let initialized = false;
  let canvas, gl, program, vbo, locs;
  // image cache: src URL → { img, tex, loaded, listeners[] }
  const cache = new Map();

  function init() {
    if (initialized) return !!gl;
    initialized = true;
    canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true, preserveDrawingBuffer: true });
    if (!gl) {
      console.error('Halftone: WebGL2 not supported');
      return false;
    }
    program = htProgram(gl);
    if (!program) return false;
    vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1, -1, 1,
      -1,  1,  1, -1,  1, 1,
    ]), gl.STATIC_DRAW);
    locs = {
      a_pos:               gl.getAttribLocation(program, 'a_pos'),
      u_image:             gl.getUniformLocation(program, 'u_image'),
      u_resolution:        gl.getUniformLocation(program, 'u_resolution'),
      u_imageAspectRatio:  gl.getUniformLocation(program, 'u_imageAspectRatio'),
      u_colorFront:        gl.getUniformLocation(program, 'u_colorFront'),
      u_colorBack:         gl.getUniformLocation(program, 'u_colorBack'),
      u_size:              gl.getUniformLocation(program, 'u_size'),
      u_radius:            gl.getUniformLocation(program, 'u_radius'),
      u_contrast:          gl.getUniformLocation(program, 'u_contrast'),
      u_grid:              gl.getUniformLocation(program, 'u_grid'),
      u_type:              gl.getUniformLocation(program, 'u_type'),
      u_inverted:          gl.getUniformLocation(program, 'u_inverted'),
      u_originalColors:    gl.getUniformLocation(program, 'u_originalColors'),
      u_grainMixer:        gl.getUniformLocation(program, 'u_grainMixer'),
      u_grainSize:         gl.getUniformLocation(program, 'u_grainSize'),
      u_grainOverlay:      gl.getUniformLocation(program, 'u_grainOverlay'),
    };
    return true;
  }

  function loadImage(src, cb) {
    if (!init()) return;
    let entry = cache.get(src);
    if (entry && entry.loaded) { cb(entry); return; }
    if (entry) { entry.listeners.push(cb); return; }
    entry = { img: null, tex: null, loaded: false, listeners: [cb] };
    cache.set(src, entry);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      entry.img = img;
      entry.tex = tex;
      entry.loaded = true;
      entry.listeners.forEach(fn => fn(entry));
      entry.listeners = [];
    };
    img.onerror = () => {
      console.error('Halftone: failed to load image', src);
      cache.delete(src);
    };
    img.src = src;
  }

  // Render into the shared canvas at the given pixel size, then
  // pass control back to the caller (which `drawImage`'s the result
  // into its own 2D canvas). The shared canvas is RESIZED for the
  // duration of the draw.
  function render(entry, w, h, params) {
    if (!entry || !entry.loaded) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.enableVertexAttribArray(locs.a_pos);
    gl.vertexAttribPointer(locs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, entry.tex);
    gl.uniform1i(locs.u_image, 0);
    gl.uniform2f(locs.u_resolution, w, h);
    gl.uniform1f(locs.u_imageAspectRatio, entry.img.width / entry.img.height);
    gl.uniform4fv(locs.u_colorFront, htParseColor(params.fg));
    gl.uniform4fv(locs.u_colorBack, htParseColor(params.bg));
    gl.uniform1f(locs.u_size, params.size);
    gl.uniform1f(locs.u_radius, params.radius);
    gl.uniform1f(locs.u_contrast, params.contrast);
    gl.uniform1f(locs.u_grid, params.grid === 'hex' ? 1 : 0);
    const typeIdx = { classic: 0, gooey: 1, holes: 2, soft: 3 }[params.dotStyle] ?? 0;
    gl.uniform1f(locs.u_type, typeIdx);
    gl.uniform1i(locs.u_inverted, params.invert ? 1 : 0);
    gl.uniform1i(locs.u_originalColors, params.useOriginal ? 1 : 0);
    gl.uniform1f(locs.u_grainMixer, params.grainMix);
    gl.uniform1f(locs.u_grainSize, params.grainSize);
    gl.uniform1f(locs.u_grainOverlay, params.grainOverlay);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  return { loadImage, render, getCanvas: () => canvas, init };
})();

// ---- React component ----
function Halftone({
  src,
  width = 320,
  height = 320,
  cellSize = 9,
  grid = 'hex',
  dotStyle = 'classic',
  fg = '#1a1538',
  bg = '#f3ead4',
  contrast = 6,
  invert = false,
  useOriginal = false,
  radius = 0.7,
  grainMix = 0,
  grainSize = 0.5,
  grainOverlay = 0,
  className = '',
  canvasStyle,
}) {
  const canvasRef = useRefHT(null);
  const [, force] = useStateHT(0);

  // Image load — bump local state when ready to trigger redraw
  useEffectHT(() => {
    if (!src) return;
    HT_SHARED.loadImage(src, () => force(n => n + 1));
  }, [src]);

  // Draw on any prop change. Schedule via rAF so multiple instances
  // mounting in the same tick batch into one frame.
  useEffectHT(() => {
    const dst = canvasRef.current;
    if (!dst || !src) return;
    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(width * dpr);
      const h = Math.round(height * dpr);
      if (dst.width !== w || dst.height !== h) {
        dst.width = w;
        dst.height = h;
      }
      // Pull the shared entry — render only fires once the texture is uploaded
      HT_SHARED.loadImage(src, (entry) => {
        if (cancelled) return;
        // Map our cellSize prop (px) to paper-design's u_size (0..1).
        // Their formula: cellsPerSide = mix(300, 7, pow(u_size, 0.7))
        // We solve back: u_size = ((300 - cellsPerSide) / 293) ^ (1/0.7)
        const cellsPerSide = h / Math.max(cellSize * dpr, 1);
        const ratio = Math.max(0, Math.min(1, (300 - cellsPerSide) / 293));
        const u_size = Math.pow(ratio, 1 / 0.7);
        // Map our old contrast prop (0..15 sigmoid steepness) → 0..1.
        const u_contrast = Math.max(0, Math.min(1, contrast / 15));
        // Old radius API didn't exist; paper-design defaults small radius (0).
        HT_SHARED.render(entry, w, h, {
          size: u_size,
          grid,
          dotStyle,
          fg, bg,
          contrast: u_contrast,
          invert,
          useOriginal,
          radius,
          grainMix,
          grainSize,
          grainOverlay,
        });
        const ctx2d = dst.getContext('2d');
        ctx2d.clearRect(0, 0, w, h);
        ctx2d.drawImage(HT_SHARED.getCanvas(), 0, 0, w, h);
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [src, width, height, cellSize, grid, dotStyle, fg, bg, contrast, invert, useOriginal, radius, grainMix, grainSize, grainOverlay]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height, display: 'block', ...(canvasStyle || {}) }}
    />
  );
}

Object.assign(window, { Halftone });
