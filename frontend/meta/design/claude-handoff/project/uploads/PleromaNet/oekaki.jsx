/* global React */

const TOOLS = [
  { id: 'brush', label: 'Brush',
    svg: <path d="M3 21l4-1 11.5-11.5a2.121 2.121 0 00-3-3L4 17l-1 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/> },
  { id: 'pen', label: 'Pen',
    svg: <path d="M15 4l5 5L9 20l-5 1 1-5L16 5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/> },
  { id: 'eraser', label: 'Eraser',
    svg: <g fill="none"><path d="M3 18l8-8 5 5-3 5H8l-5-2zM11 10l7-7 3 3-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></g> },
  { id: 'fill', label: 'Fill',
    svg: <path d="M4 12l8-8 8 8-8 8-8-8zM20 18c0 1.1-.9 2-2 2s-2-.9-2-2 2-4 2-4 2 2.9 2 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/> },
  { id: 'eyedrop', label: 'Eyedropper',
    svg: <path d="M14 4l6 6-3 3-1-1-8 8-4 1 1-4 8-8-1-1 2-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none"/> },
  { id: 'rect', label: 'Rectangle',
    svg: <rect x="4" y="6" width="16" height="12" stroke="currentColor" strokeWidth="1.6" fill="none"/> },
  { id: 'circle', label: 'Ellipse',
    svg: <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" fill="none"/> },
  { id: 'line', label: 'Line',
    svg: <path d="M4 20L20 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/> },
  { id: 'text', label: 'Text',
    svg: <path d="M5 5h14M12 5v14M8 19h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/> },
];

const SWATCHES = [
  '#18203f', '#2a2520', '#7a7c95', '#f4ebd8',
  '#e8763a', '#d68b8b', '#e0b97a', '#a8d5b1',
  '#7dc4be', '#a48bd9', '#6b52a3', '#e7a8c9',
  '#5a4a3a', '#fbfaf3',
];

function OekakiModal({ open, onClose, onAttach }) {
  const canvasRef = React.useRef(null);
  const [tool, setTool] = React.useState('brush');
  const [color, setColor] = React.useState('#18203f');
  const [size, setSize] = React.useState(14);
  const [opacity, setOpacity] = React.useState(0.85);
  const [zoom, setZoom] = React.useState(100);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const drawingRef = React.useRef(false);
  const lastRef = React.useRef(null);
  const [layers, setLayers] = React.useState([
    { id: 1, name: 'Background', visible: true },
    { id: 2, name: 'Layer 2', visible: true },
  ]);
  const [activeLayer, setActiveLayer] = React.useState(2);

  // Set up canvas with checkerboard "transparent" pattern in CSS, then start blank for drawing
  React.useEffect(() => {
    if (!open) return;
    const c = canvasRef.current;
    if (!c) return;
    c.width = 800; c.height = 600;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [open]);

  if (!open) return null;

  const getPos = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width;
    const sy = c.height / r.height;
    return {
      x: (e.clientX - r.left) * sx,
      y: (e.clientY - r.top) * sy,
    };
  };

  const start = (e) => {
    drawingRef.current = true;
    const p = getPos(e);
    lastRef.current = p;
    if (tool === 'fill') {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      drawingRef.current = false;
    }
  };
  const move = (e) => {
    const p = getPos(e);
    setPos({ x: Math.round(p.x), y: Math.round(p.y) });
    if (!drawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.globalAlpha = opacity;
    ctx.lineWidth = size;
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastRef.current = p;
  };
  const end = () => {
    drawingRef.current = false;
    lastRef.current = null;
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
  };

  return (
    <div className="oek-backdrop" onClick={onClose}>
      <div className="oek-window" onClick={e => e.stopPropagation()}>
        <div className="oek-titlebar">
          <span className="oek-dot"></span>
          <span className="oek-title-l">oekaki</span>
          <span className="oek-title-c">~/draft/untitled.png — 800×600 — {layers.length} layers</span>
          <div className="oek-title-tools">
            <button className="oek-title-btn" title="Minimize">−</button>
            <button className="oek-title-btn" title="Maximize">□</button>
            <button className="oek-title-btn oek-close" onClick={onClose} title="Close">×</button>
          </div>
        </div>
        <div className="oek-body">
          <div className="oek-rail">
            {TOOLS.map((t, i) => (
              <React.Fragment key={t.id}>
                <button
                  className={"oek-rail-btn " + (tool === t.id ? 'sel' : '')}
                  title={t.label}
                  onClick={() => setTool(t.id)}>
                  <svg viewBox="0 0 24 24" style={{width: 16, height: 16}}>{t.svg}</svg>
                </button>
                {i === 4 && <div className="oek-rail-sep"></div>}
              </React.Fragment>
            ))}
          </div>

          <div className="oek-canvas-wrap">
            <div className="oek-canvas-pad">
              <canvas
                ref={canvasRef}
                className="oek-canvas"
                onMouseDown={start}
                onMouseMove={move}
                onMouseUp={end}
                onMouseLeave={end}
                style={{cursor: tool === 'eyedrop' ? 'crosshair' : tool === 'fill' ? 'cell' : 'crosshair'}}
              />
            </div>
            <div className="oek-zoom">
              <button onClick={() => setZoom(z => Math.max(25, z - 25))}>−</button>
              <span>{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(400, z + 25))}>+</button>
            </div>
            <div className="oek-pos">x:{pos.x} y:{pos.y}</div>
          </div>

          <div className="oek-side">
            <div className="oek-side-sec">
              <div className="oek-side-head">Color <span className="oek-side-head-r">{color.toUpperCase()}</span></div>
              <div className="oek-swatches">
                {SWATCHES.map(c => (
                  <button
                    key={c}
                    className={"oek-swatch " + (color === c ? 'sel' : '')}
                    style={{background: c, borderColor: c === '#fbfaf3' ? '#c9c4b3' : 'rgba(0,0,0,0.08)'}}
                    onClick={() => setColor(c)}
                    aria-label={c}
                  />
                ))}
              </div>
              <input
                type="color"
                className="oek-color-picker"
                value={color}
                onChange={e => setColor(e.target.value)}
              />
            </div>
            <div className="oek-side-sec">
              <div className="oek-side-head">Brush</div>
              <SliderRow label="Size" value={size} max={64} min={1} onChange={setSize}/>
              <SliderRow label="Opacity" value={Math.round(opacity * 100)} max={100} min={1} onChange={(v) => setOpacity(v / 100)}/>
              <SliderRow label="Flow" value={60} max={100} min={1} onChange={() => {}}/>
            </div>
            <div className="oek-side-sec oek-side-grow">
              <div className="oek-side-head">Layers <span className="oek-side-head-r">{layers.length} / 8</span></div>
              <div className="oek-layers">
                {[...layers].reverse().map(l => (
                  <button
                    key={l.id}
                    className={"oek-layer " + (activeLayer === l.id ? 'sel' : '')}
                    onClick={() => setActiveLayer(l.id)}>
                    <svg className="oek-layer-eye" viewBox="0 0 24 24" fill="none" style={{opacity: l.visible ? 0.7 : 0.2}}>
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.6"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                    </svg>
                    <span className="oek-layer-th" style={{background: l.id === 1 ? 'var(--border)' : '#18203f'}}></span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>
              <div className="oek-layer-tools">
                <button title="New layer" onClick={() => {
                  const nid = Math.max(...layers.map(l => l.id)) + 1;
                  setLayers([...layers, { id: nid, name: 'Layer ' + nid, visible: true }]);
                  setActiveLayer(nid);
                }}>
                  <svg viewBox="0 0 24 24" fill="none" style={{width: 13, height: 13}}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </button>
                <button title="Duplicate">
                  <svg viewBox="0 0 24 24" fill="none" style={{width: 13, height: 13}}><rect x="8" y="8" width="12" height="12" stroke="currentColor" strokeWidth="1.6"/><path d="M4 16V4h12" stroke="currentColor" strokeWidth="1.6"/></svg>
                </button>
                <button title="Delete" onClick={() => {
                  if (layers.length <= 1) return;
                  setLayers(layers.filter(l => l.id !== activeLayer));
                }}>
                  <svg viewBox="0 0 24 24" fill="none" style={{width: 13, height: 13}}><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="oek-foot">
          <span className="oek-foot-info">PNG · 800×600 · {tool} · ⌘Z undo</span>
          <button className="oek-foot-clear" onClick={clearCanvas}>Clear</button>
          <div className="oek-foot-r">
            <button className="oek-btn">Save draft</button>
            <button className="oek-btn primary" onClick={() => {
              const dataURL = canvasRef.current.toDataURL('image/png');
              onAttach && onAttach(dataURL);
            }}>Attach to post</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, onChange }) {
  return (
    <div className="oek-slider-row">
      <label>{label}</label>
      <input
        type="range"
        className="oek-slider-input"
        min={min} max={max} value={value}
        onChange={e => onChange(parseInt(e.target.value, 10))}
      />
      <span className="oek-slider-v">{value}</span>
    </div>
  );
}

window.OekakiModal = OekakiModal;
