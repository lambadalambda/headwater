// WebGL halftone-duotone media treatment ported from the canonical
// handoff shader (meta/design/claude-handoff/project/halftone-shader.jsx).
// All renders share a single offscreen WebGL2 canvas because browsers cap
// live WebGL contexts; each consumer draws the shared canvas into its own
// 2D canvas. Every path degrades to `false` so callers can keep the plain
// <img> fallback.

const HT_VERT = `#version 300 es
precision mediump float;
in vec2 a_pos;
uniform float u_imageAspectRatio;
uniform vec2 u_resolution;
out vec2 v_imageUV;
void main() {
  vec2 uv = (a_pos + 1.0) * 0.5;
  float canvasAR = u_resolution.x / u_resolution.y;
  vec2 c = vec2(0.5);
  vec2 scaled;
  if (canvasAR > u_imageAspectRatio) {
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

export type HalftoneGrid = 'square' | 'hex';
export type HalftoneDotStyle = 'classic' | 'gooey' | 'holes' | 'soft';

export type HalftoneOptions = {
	cellSize: number;
	grid: HalftoneGrid;
	dotStyle: HalftoneDotStyle;
	fg: string;
	bg: string;
	contrast: number;
	invert: boolean;
	useOriginal: boolean;
	radius: number;
	grainMix: number;
	grainSize: number;
	grainOverlay: number;
};

export type HalftoneThemePalette = { fg: string; bg: string };

export const HALFTONE_THEME_PALETTES: Record<string, HalftoneThemePalette> = {
	cream: { fg: '#1a1538', bg: '#f3ead4' },
	dusk: { fg: '#e7a8c9', bg: '#1a142e' },
	drive: { fg: '#7dc4be', bg: '#07091a' },
	simoun: { fg: '#e8763a', bg: '#141b36' }
};

export const halftonePaletteForTheme = (theme: string | undefined | null): HalftoneThemePalette =>
	HALFTONE_THEME_PALETTES[theme ?? 'cream'] ?? HALFTONE_THEME_PALETTES.cream;

// Recommended default preset from the handoff "System recommendation":
// classic hex grid, 9px cells, contrast 6, light grain.
export const defaultHalftoneOptions = (palette: HalftoneThemePalette = HALFTONE_THEME_PALETTES.cream): HalftoneOptions => ({
	cellSize: 9,
	grid: 'hex',
	dotStyle: 'classic',
	fg: palette.fg,
	bg: palette.bg,
	contrast: 6,
	invert: false,
	useOriginal: false,
	radius: 0.7,
	grainMix: 0.35,
	grainSize: 2.5,
	grainOverlay: 0.1
});

const parseColor = (color: string): [number, number, number, number] => {
	const value = color.trim();
	if (value.startsWith('#')) {
		let hex = value.slice(1);
		if (hex.length === 3) hex = hex.split('').map((part) => part + part).join('');
		const r = parseInt(hex.slice(0, 2), 16) / 255;
		const g = parseInt(hex.slice(2, 4), 16) / 255;
		const b = parseInt(hex.slice(4, 6), 16) / 255;
		const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
		return [r, g, b, a];
	}
	if (value.startsWith('rgb')) {
		const parts = value.match(/-?\d+\.?\d*/g);
		if (parts) return [+parts[0] / 255, +parts[1] / 255, +parts[2] / 255, parts[3] != null ? +parts[3] : 1];
	}
	return [0, 0, 0, 1];
};

type SharedImage = { img: HTMLImageElement; tex: WebGLTexture };
type SharedRenderer = {
	gl: WebGL2RenderingContext;
	canvas: HTMLCanvasElement;
	program: WebGLProgram;
	locations: Record<string, WebGLUniformLocation | number | null>;
	images: Map<string, Promise<SharedImage>>;
};

let sharedRendererInitialized = false;
let sharedRenderer: SharedRenderer | null = null;

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
	return shader;
};

const createSharedRenderer = (): SharedRenderer | null => {
	const canvas = document.createElement('canvas');
	canvas.width = 256;
	canvas.height = 256;
	const gl = canvas.getContext('webgl2', { premultipliedAlpha: false, alpha: true, preserveDrawingBuffer: true });
	if (!gl) return null;

	const vertex = compileShader(gl, gl.VERTEX_SHADER, HT_VERT);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, HT_FRAG);
	if (!vertex || !fragment) return null;
	const program = gl.createProgram();
	if (!program) return null;
	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

	const vbo = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

	const locations = {
		a_pos: gl.getAttribLocation(program, 'a_pos'),
		u_image: gl.getUniformLocation(program, 'u_image'),
		u_resolution: gl.getUniformLocation(program, 'u_resolution'),
		u_imageAspectRatio: gl.getUniformLocation(program, 'u_imageAspectRatio'),
		u_colorFront: gl.getUniformLocation(program, 'u_colorFront'),
		u_colorBack: gl.getUniformLocation(program, 'u_colorBack'),
		u_size: gl.getUniformLocation(program, 'u_size'),
		u_radius: gl.getUniformLocation(program, 'u_radius'),
		u_contrast: gl.getUniformLocation(program, 'u_contrast'),
		u_grid: gl.getUniformLocation(program, 'u_grid'),
		u_type: gl.getUniformLocation(program, 'u_type'),
		u_inverted: gl.getUniformLocation(program, 'u_inverted'),
		u_originalColors: gl.getUniformLocation(program, 'u_originalColors'),
		u_grainMixer: gl.getUniformLocation(program, 'u_grainMixer'),
		u_grainSize: gl.getUniformLocation(program, 'u_grainSize'),
		u_grainOverlay: gl.getUniformLocation(program, 'u_grainOverlay')
	};

	return { gl, canvas, program, locations, images: new Map() };
};

const getSharedRenderer = () => {
	if (!sharedRendererInitialized) {
		sharedRendererInitialized = true;
		try {
			sharedRenderer = createSharedRenderer();
		} catch {
			sharedRenderer = null;
		}
	}
	return sharedRenderer;
};

export const isHalftoneSupported = () => getSharedRenderer() !== null;

const loadSharedImage = (renderer: SharedRenderer, src: string): Promise<SharedImage> => {
	const existing = renderer.images.get(src);
	if (existing) return existing;

	const promise = new Promise<SharedImage>((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const { gl } = renderer;
			const tex = gl.createTexture();
			if (!tex) {
				reject(new Error('halftone texture allocation failed'));
				return;
			}
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			resolve({ img, tex });
		};
		img.onerror = () => {
			renderer.images.delete(src);
			reject(new Error(`halftone image load failed: ${src}`));
		};
		img.src = src;
	});
	renderer.images.set(src, promise);
	return promise;
};

// Draw the halftone treatment for `src` into `target`. Resolves false when
// WebGL2, shader compilation, or image loading is unavailable so callers can
// keep their fallback rendering.
export const renderHalftone = async (target: HTMLCanvasElement, src: string, options: HalftoneOptions): Promise<boolean> => {
	const renderer = getSharedRenderer();
	if (!renderer) return false;

	let image: SharedImage;
	try {
		image = await loadSharedImage(renderer, src);
	} catch {
		return false;
	}

	const { gl, canvas, program, locations } = renderer;
	const width = Math.max(1, target.width);
	const height = Math.max(1, target.height);
	if (canvas.width !== width || canvas.height !== height) {
		canvas.width = width;
		canvas.height = height;
	}

	// Map cellSize px to the shader's 0..1 u_size:
	// cellsPerSide = mix(300, 7, pow(u_size, 0.7)) solved backwards.
	const cellsPerSide = height / Math.max(options.cellSize, 1);
	const ratio = Math.max(0, Math.min(1, (300 - cellsPerSide) / 293));
	const uSize = Math.pow(ratio, 1 / 0.7);
	const uContrast = Math.max(0, Math.min(1, options.contrast / 15));
	const typeIndex = { classic: 0, gooey: 1, holes: 2, soft: 3 }[options.dotStyle] ?? 0;

	gl.viewport(0, 0, width, height);
	gl.useProgram(program);
	gl.enableVertexAttribArray(locations.a_pos as number);
	gl.vertexAttribPointer(locations.a_pos as number, 2, gl.FLOAT, false, 0, 0);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, image.tex);
	gl.uniform1i(locations.u_image as WebGLUniformLocation, 0);
	gl.uniform2f(locations.u_resolution as WebGLUniformLocation, width, height);
	gl.uniform1f(locations.u_imageAspectRatio as WebGLUniformLocation, image.img.width / image.img.height);
	gl.uniform4fv(locations.u_colorFront as WebGLUniformLocation, parseColor(options.fg));
	gl.uniform4fv(locations.u_colorBack as WebGLUniformLocation, parseColor(options.bg));
	gl.uniform1f(locations.u_size as WebGLUniformLocation, uSize);
	gl.uniform1f(locations.u_radius as WebGLUniformLocation, options.radius);
	gl.uniform1f(locations.u_contrast as WebGLUniformLocation, uContrast);
	gl.uniform1f(locations.u_grid as WebGLUniformLocation, options.grid === 'hex' ? 1 : 0);
	gl.uniform1f(locations.u_type as WebGLUniformLocation, typeIndex);
	gl.uniform1i(locations.u_inverted as WebGLUniformLocation, options.invert ? 1 : 0);
	gl.uniform1i(locations.u_originalColors as WebGLUniformLocation, options.useOriginal ? 1 : 0);
	gl.uniform1f(locations.u_grainMixer as WebGLUniformLocation, options.grainMix);
	gl.uniform1f(locations.u_grainSize as WebGLUniformLocation, options.grainSize);
	gl.uniform1f(locations.u_grainOverlay as WebGLUniformLocation, options.grainOverlay);
	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
	gl.clearColor(0, 0, 0, 0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	const context = target.getContext('2d');
	if (!context) return false;
	context.clearRect(0, 0, width, height);
	context.drawImage(canvas, 0, 0, width, height);
	return true;
};
