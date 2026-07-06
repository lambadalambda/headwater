/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard, Halftone */
const { useState: useStateH } = React;

// ============================================================
// Halftone-duotone shader variants
// Each artboard fixes a different combination of:
//   image · cell size · grid · dot style · contrast · grain
// And uses a theme palette { fg, bg } so we can see how it
// reads inside the existing color system.
// ============================================================

const PALETTES = {
  cream:  { fg: '#1a1538', bg: '#f3ead4', name: 'cream',  ink: '#1f2347' },
  dusk:   { fg: '#e7a8c9', bg: '#1a142e', name: 'dusk',   ink: '#f4eef8' },
  drive:  { fg: '#7dc4be', bg: '#07091a', name: 'drive',  ink: '#e8efff' },
  simoun: { fg: '#e8763a', bg: '#141b36', name: 'simoun', ink: '#f4ebd8' },
};

const SAMPLES = {
  cat:    { src: 'samples/cats-pair.webp', label: 'two cats' },
  bank:   { src: 'samples/cat-bank.webp',  label: 'cat by bank' },
  door:   { src: 'samples/cat-door.webp',  label: 'cat by door' },
  falco:  { src: 'samples/falco.png',      label: 'falco' },
  enc:    { src: 'samples/encardia-99.png', label: 'encardia' },
};

// ============================================================
// Card — original / SVG-duotone / halftone side by side
// ============================================================
function Specimen({ sample, palette, label, sub, halftoneProps, duotoneFilter }) {
  const w = 260;
  const h = 260;
  return (
    <div className="hv-spec">
      <div className="hv-spec-l">
        <span className="hv-spec-tag">{label}</span>
        {sub && <span className="hv-spec-sub">{sub}</span>}
      </div>
      <div className="hv-row">
        <div className="hv-cell">
          <div className="hv-cell-l">ORIGINAL</div>
          <img src={sample.src} alt={sample.label} style={{width: w, height: h, objectFit: 'cover'}}/>
        </div>
        <div className="hv-cell">
          <div className="hv-cell-l">SVG DUOTONE (current)</div>
          <img src={sample.src} alt={sample.label}
            style={{width: w, height: h, objectFit: 'cover', filter: `url(#${duotoneFilter})`}}/>
        </div>
        <div className="hv-cell">
          <div className="hv-cell-l">HALFTONE</div>
          <Halftone
            src={sample.src}
            width={w}
            height={h}
            fg={palette.fg}
            bg={palette.bg}
            {...halftoneProps}
          />
        </div>
      </div>
    </div>
  );
}

// Cheat sheet table
function Cheat({ rows }) {
  return (
    <div className="hv-cheat">
      {Object.entries(rows).map(([k, v]) => (
        <React.Fragment key={k}>
          <span className="hv-cheat-k">{k}</span>
          <span>{v}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

// Page wrapper
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="hv-page">
      <header className="hv-page-h">
        <div className="hv-kicker">{kicker}</div>
        <h1 className="hv-h1">{title}</h1>
        <p className="hv-sub">{sub}</p>
      </header>
      {cheat && <Cheat rows={cheat}/>}
      <div className="hv-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// Interactive playground (one artboard) — knobs panel + preview
// ============================================================
function Playground() {
  const [sample, setSample]       = useStateH('cat');
  const [palette, setPalette]     = useStateH('cream');
  const [cellSize, setCellSize]   = useStateH(9);
  const [grid, setGrid]           = useStateH('hex');
  const [dotStyle, setDotStyle] = useStateH('classic');
  const [contrast, setContrast]   = useStateH(6);
  const [invert, setInvert]       = useStateH(false);
  const [useOriginal, setOrig]    = useStateH(false);
  const [grainMix, setMix]        = useStateH(0);
  const [grainSize, setGrainSize] = useStateH(2.5);
  const [grainOver, setGrainOver] = useStateH(0);

  const p = PALETTES[palette];
  const s = SAMPLES[sample];

  return (
    <div className="hv-play">
      <aside className="hv-knobs">
        <KnobGroup label="Source">
          <SegRadio value={sample} onChange={setSample} options={Object.keys(SAMPLES).map(k => ({value: k, label: SAMPLES[k].label}))}/>
        </KnobGroup>
        <KnobGroup label="Palette">
          <SegRadio value={palette} onChange={setPalette} options={Object.keys(PALETTES).map(k => ({value: k, label: k}))}/>
        </KnobGroup>
        <KnobGroup label="Grid">
          <SegRadio value={grid} onChange={setGrid} options={[{value:'square', label:'square'}, {value:'hex', label:'hex'}]}/>
        </KnobGroup>
        <KnobGroup label="Dot style">
          <SegRadio value={dotStyle} onChange={setDotStyle} options={[
            {value:'classic',label:'classic'},
            {value:'gooey',  label:'gooey'},
            {value:'holes',  label:'holes'},
            {value:'soft',   label:'soft'},
          ]}/>
        </KnobGroup>
        <KnobGroup label={'Cell size · ' + cellSize + 'px'}>
          <input type="range" min={4} max={28} step={1} value={cellSize} onChange={e => setCellSize(+e.target.value)}/>
        </KnobGroup>
        <KnobGroup label={'Contrast · ' + contrast.toFixed(1)}>
          <input type="range" min={0.5} max={14} step={0.1} value={contrast} onChange={e => setContrast(+e.target.value)}/>
        </KnobGroup>
        <KnobGroup label="Toggles">
          <label className="hv-chk"><input type="checkbox" checked={invert} onChange={e => setInvert(e.target.checked)}/><span>Invert luma</span></label>
          <label className="hv-chk"><input type="checkbox" checked={useOriginal} onChange={e => setOrig(e.target.checked)}/><span>Original colors</span></label>
        </KnobGroup>
        <KnobGroup label={'Grain mix · ' + grainMix.toFixed(2)}>
          <input type="range" min={0} max={1} step={0.02} value={grainMix} onChange={e => setMix(+e.target.value)}/>
        </KnobGroup>
        <KnobGroup label={'Grain cell · ' + grainSize.toFixed(1) + 'px'}>
          <input type="range" min={1} max={20} step={0.1} value={grainSize} onChange={e => setGrainSize(+e.target.value)}/>
        </KnobGroup>
        <KnobGroup label={'Grain overlay · ' + grainOver.toFixed(2)}>
          <input type="range" min={0} max={0.5} step={0.01} value={grainOver} onChange={e => setGrainOver(+e.target.value)}/>
        </KnobGroup>
      </aside>
      <div className="hv-play-stage">
        <div className="hv-play-frame" style={{background: p.bg, color: p.ink}}>
          <Halftone
            src={s.src}
            width={520}
            height={520}
            fg={p.fg}
            bg={p.bg}
            cellSize={cellSize}
            grid={grid}
            dotStyle={dotStyle}
            contrast={contrast}
            invert={invert}
            useOriginal={useOriginal}
            grainMix={grainMix}
            grainSize={grainSize}
            grainOverlay={grainOver}
          />
        </div>
        <div className="hv-play-meta">
          <div className="hv-play-meta-l">PRESET</div>
          <code className="hv-play-meta-code">{JSON.stringify({grid, dotStyle, cellSize, contrast: +contrast.toFixed(1), invert, useOriginal, grainMix: +grainMix.toFixed(2), grainSize: +grainSize.toFixed(1), grainOverlay: +grainOver.toFixed(2)}, null, 2)}</code>
        </div>
      </div>
    </div>
  );
}

function KnobGroup({ label, children }) {
  return (
    <div className="hv-knob">
      <div className="hv-knob-l">{label}</div>
      <div className="hv-knob-body">{children}</div>
    </div>
  );
}
function SegRadio({ value, options, onChange }) {
  return (
    <div className="hv-seg">
      {options.map(o => (
        <button key={o.value}
          className={"hv-seg-b " + (value === o.value ? 'on' : '')}
          onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Halftone-duotone shader · variants">

      <DCSection id="playground" title="1 · Playground" subtitle="Interactive — turn every knob the shader exposes and see the result against any theme palette. The PRESET block is the JSON you'd paste into a Halftone instance.">
        <DCArtboard id="play" label="Playground" width={1100} height={760}>
          <Page kicker="PLAYGROUND" title="Tune it" sub="Pick a source, palette, grid type, dot style, and grain. The right side rerenders live.">
            <Playground/>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection id="styles" title="2 · Dot styles" subtitle="Four shape modes — same source, same palette, same cell size, varying only the style parameter. Classic is the canonical print-halftone look; gooey lets dots merge; holes is the inverse; soft is the watercolor variant.">
        <DCArtboard id="classic" label="Classic · hard circle" width={920} height={350}>
          <Page kicker="STYLE · CLASSIC" title="Classic — hard anti-aliased circles" sub="Best for crisp, recognizable halftone (newspaper / risograph feel)."
            cheat={{ Style: 'classic', Cell: '9px', Grid: 'hex', Contrast: '6' }}>
            <Specimen sample={SAMPLES.cat} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · classic"
              halftoneProps={{cellSize: 9, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="gooey" label="Gooey · merging blobs" width={920} height={350}>
          <Page kicker="STYLE · GOOEY" title="Gooey — neighbor cells merge" sub="Sub-cell sampling lets adjacent blobs flow together. Best at larger cell sizes."
            cheat={{ Style: 'gooey', Cell: '14px', Grid: 'hex', Contrast: '6' }}>
            <Specimen sample={SAMPLES.cat} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · gooey"
              halftoneProps={{cellSize: 14, grid: 'hex', dotStyle: 'gooey', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="holes" label="Holes · inverse halftone" width={920} height={350}>
          <Page kicker="STYLE · HOLES" title="Holes — invert the dot logic" sub="Dark regions become donut-holes in a filled foreground. Great for photo negatives."
            cheat={{ Style: 'holes', Cell: '10px', Grid: 'hex', Contrast: '6' }}>
            <Specimen sample={SAMPLES.cat} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · holes"
              halftoneProps={{cellSize: 10, grid: 'hex', dotStyle: 'holes', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="soft" label="Soft · gradient ball" width={920} height={350}>
          <Page kicker="STYLE · SOFT" title="Soft — radial fade" sub="No hard edges. Reads as a watercolor or airbrush wash; quietest treatment."
            cheat={{ Style: 'soft', Cell: '10px', Grid: 'hex', Contrast: '6' }}>
            <Specimen sample={SAMPLES.cat} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · soft"
              halftoneProps={{cellSize: 10, grid: 'hex', dotStyle: 'soft', contrast: 6}}/>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection id="cells" title="3 · Cell size sweep" subtitle="Classic style, cream palette, the same source — only the cell size varies. Smaller cells = more dot density = closer to the original photo's resolution. Larger cells = more abstract / graphic.">
        <DCArtboard id="c6" label="cell 6 px" width={920} height={350}>
          <Page kicker="CELL · 6PX" title="Dense" sub="High density — reads almost like a screen print." cheat={{ Cell: '6px' }}>
            <Specimen sample={SAMPLES.bank} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · 6px"
              halftoneProps={{cellSize: 6, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="c10" label="cell 10 px" width={920} height={350}>
          <Page kicker="CELL · 10PX" title="Middle" sub="Recognizable halftone — the recommended default for feed photos." cheat={{ Cell: '10px' }}>
            <Specimen sample={SAMPLES.bank} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · 10px"
              halftoneProps={{cellSize: 10, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="c18" label="cell 18 px" width={920} height={350}>
          <Page kicker="CELL · 18PX" title="Graphic" sub="Sparse dots — abstracted to a poster look." cheat={{ Cell: '18px' }}>
            <Specimen sample={SAMPLES.bank} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · 18px"
              halftoneProps={{cellSize: 18, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection id="themes" title="4 · Across themes" subtitle="Classic style, cell size 9, hex grid. The same source rendered into each of the four PleromaNet theme palettes side by side. Shows how the FG/BG choice changes the mood completely without changing any other parameter.">
        <DCArtboard id="th-cream" label="cream theme" width={920} height={350}>
          <Page kicker="THEME · CREAM" title="Default cream" sub="Dark ink dots on a warm-cream ground."
            cheat={{ fg: '#1a1538', bg: '#f3ead4' }}>
            <Specimen sample={SAMPLES.cat} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream"
              halftoneProps={{cellSize: 9, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="th-dusk" label="dusk theme" width={920} height={350}>
          <Page kicker="THEME · DUSK" title="Dusk · twilight purple" sub="Pink dots on a deep-purple ground — softer, glowing."
            cheat={{ fg: '#e7a8c9', bg: '#1a142e' }}>
            <Specimen sample={SAMPLES.cat} palette={PALETTES.dusk} duotoneFilter="duotoneDusk" label="dusk"
              halftoneProps={{cellSize: 9, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="th-drive" label="drive theme" width={920} height={350}>
          <Page kicker="THEME · DRIVE" title="Drive · cold navy" sub="Teal dots on near-black — most CRT-like."
            cheat={{ fg: '#7dc4be', bg: '#07091a' }}>
            <Specimen sample={SAMPLES.cat} palette={PALETTES.drive} duotoneFilter="duotoneDrive" label="drive"
              halftoneProps={{cellSize: 9, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="th-simoun" label="simoun theme" width={920} height={350}>
          <Page kicker="THEME · SIMOUN" title="Simoun · ember orange" sub="Orange dots on navy — warmest of the dark themes."
            cheat={{ fg: '#e8763a', bg: '#141b36' }}>
            <Specimen sample={SAMPLES.cat} palette={PALETTES.simoun} duotoneFilter="duotoneSimoun" label="simoun"
              halftoneProps={{cellSize: 9, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection id="grain" title="5 · Grain" subtitle="Same image, same palette, same dot grid — adding the two grain layers progressively. Grain mixer distorts dot edges; grain overlay adds speckle on top of the whole image (positive = white noise, negative = black).">
        <DCArtboard id="g-clean" label="no grain" width={920} height={350}>
          <Page kicker="GRAIN · OFF" title="Clean" sub="Just the halftone. Looks digital — the dot edges are mathematically clean.">
            <Specimen sample={SAMPLES.falco} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · no grain"
              halftoneProps={{cellSize: 8, grid: 'hex', dotStyle: 'classic', contrast: 6}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="g-mix" label="mixer only" width={920} height={350}>
          <Page kicker="GRAIN · MIXER" title="Grain mixer · 0.45" sub="Distorts dot edges with value-noise — the dots stop being mathematically perfect and gain a hand-printed quality.">
            <Specimen sample={SAMPLES.falco} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · mixer 0.45"
              halftoneProps={{cellSize: 8, grid: 'hex', dotStyle: 'classic', contrast: 6, grainMix: 0.45, grainSize: 2.5}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="g-overlay" label="overlay only" width={920} height={350}>
          <Page kicker="GRAIN · OVERLAY" title="Grain overlay · 0.18" sub="A pure-noise speckle on top — adds paper texture without touching the dots.">
            <Specimen sample={SAMPLES.falco} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · overlay 0.18"
              halftoneProps={{cellSize: 8, grid: 'hex', dotStyle: 'classic', contrast: 6, grainOverlay: 0.18}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="g-both" label="mixer + overlay" width={920} height={350}>
          <Page kicker="GRAIN · BOTH" title="Mixer + overlay" sub="Full print-look — mixer 0.4 + overlay 0.12. My pick for the system default — close to the slow-web, riso-print aesthetic.">
            <Specimen sample={SAMPLES.falco} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · mixer 0.4 · overlay 0.12"
              halftoneProps={{cellSize: 8, grid: 'hex', dotStyle: 'classic', contrast: 6, grainMix: 0.4, grainSize: 2.5, grainOverlay: 0.12}}/>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection id="orig" title="6 · Original-color mode" subtitle="Instead of replacing dots with the FG color, tint each dot with the actual sampled image pixel. Keeps the photo's hues while still applying the halftone structure. Useful for editorial / hero shots where color matters.">
        <DCArtboard id="orig-cream" label="cream + original" width={920} height={350}>
          <Page kicker="MODE · ORIGINAL" title="Original colors on cream" sub="Dots take their hue from the source image; cream ground fills the rest.">
            <Specimen sample={SAMPLES.enc} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · useOriginal"
              halftoneProps={{cellSize: 8, grid: 'hex', dotStyle: 'classic', contrast: 5, useOriginal: true}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="orig-dusk" label="dusk + original" width={920} height={350}>
          <Page kicker="MODE · ORIGINAL" title="Original colors on dusk" sub="Same idea on a dark theme — source hues pop hard against the purple ground.">
            <Specimen sample={SAMPLES.enc} palette={PALETTES.dusk} duotoneFilter="duotoneDusk" label="dusk · useOriginal"
              halftoneProps={{cellSize: 8, grid: 'hex', dotStyle: 'classic', contrast: 5, useOriginal: true}}/>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection id="recos" title="7 · System recommendation"
        subtitle="My picks for the system defaults, expressed as full presets. Pasting these into <Halftone/> matches the screenshots above.">
        <DCArtboard id="reco-cream" label="cream default" width={920} height={350}>
          <Page kicker="RECO · CREAM" title="Recommended default — cream" sub="Classic hex grid, 9px cells, contrast 6, light grain. Mid-density, print-feel, scans well at small sizes."
            cheat={{
              cellSize: '9px', grid: 'hex', dotStyle: 'classic', contrast: '6',
              grainMix: '0.35', grainSize: '2.5', grainOverlay: '0.10'
            }}>
            <Specimen sample={SAMPLES.bank} palette={PALETTES.cream} duotoneFilter="duotoneCream" label="cream · default"
              halftoneProps={{cellSize: 9, grid: 'hex', dotStyle: 'classic', contrast: 6, grainMix: 0.35, grainSize: 2.5, grainOverlay: 0.10}}/>
          </Page>
        </DCArtboard>
        <DCArtboard id="reco-dusk" label="dusk default" width={920} height={350}>
          <Page kicker="RECO · DUSK" title="Recommended default — dusk" sub="Same settings as cream — only the theme tokens swap."
            cheat={{
              cellSize: '9px', grid: 'hex', dotStyle: 'classic', contrast: '6',
              grainMix: '0.35', grainSize: '2.5', grainOverlay: '0.10'
            }}>
            <Specimen sample={SAMPLES.bank} palette={PALETTES.dusk} duotoneFilter="duotoneDusk" label="dusk · default"
              halftoneProps={{cellSize: 9, grid: 'hex', dotStyle: 'classic', contrast: 6, grainMix: 0.35, grainSize: 2.5, grainOverlay: 0.10}}/>
          </Page>
        </DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
