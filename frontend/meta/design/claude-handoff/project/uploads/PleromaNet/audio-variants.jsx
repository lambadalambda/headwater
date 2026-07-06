/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState, useEffect, useMemo } = React;

// ============================================================
// Audio player variants — scaling down from the current full
// player. All variants render the same clip so you can stack
// them mentally against the baseline.
// ============================================================

const SAMPLE = {
  title: "Encardia '99",
  byline: 'slowerpace · music library · 1999',
  duration: '4:18',
  cover: 'samples/encardia-99.png',
  tags: ['#library', '#ambient', '#demo'],
};

// ============================================================
// Shared helpers
// ============================================================
function parseDur(s) { const [m, sec] = s.split(':').map(Number); return m * 60 + sec; }
function fmtDur(t)  { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }

function useTransport(audio, autostart = false) {
  const [playing, setPlaying] = useState(autostart);
  const [progress, setProgress] = useState(0.32);
  const total = parseDur(audio.duration);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress(p => p >= 1 ? 0 : p + 0.005), 100);
    return () => clearInterval(t);
  }, [playing]);
  return {
    playing, setPlaying,
    progress, setProgress,
    cur: fmtDur(total * progress),
    toggle: () => setPlaying(p => !p),
  };
}

function makeBars(seed, count) {
  return Array.from({length: count}, (_, i) => {
    const v = Math.sin(i * 0.7 + seed) * 0.5
            + Math.sin(i * 0.31 + seed * 0.4) * 0.3
            + Math.cos(i * 1.1) * 0.2;
    return Math.max(0.18, Math.min(1, Math.abs(v) + 0.25));
  });
}

function PlayGlyph(p)  { return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 5l12 7-12 7V5z"/></svg>; }
function PauseGlyph(p) { return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>; }
function AudioGlyph(p) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" strokeLinejoin="round"/></svg>; }

// ============================================================
// Variants
// ============================================================

// V0 — Baseline (matches the current AudioAttachment)
function V0_Baseline() {
  const t = useTransport(SAMPLE);
  const BARS = useMemo(() => makeBars(SAMPLE.title.length, 56), []);
  const playedIdx = Math.floor(t.progress * BARS.length);
  return (
    <div className="av-baseline">
      <div className="av-b-cover">
        {SAMPLE.cover
          ? <img src={SAMPLE.cover} alt="" className="av-b-cover-img"/>
          : <div className="av-b-cover-empty"><AudioGlyph style={{width: 32, height: 32}}/></div>}
        <div className={"av-b-disc " + (t.playing ? 'spin' : '')}>
          <span className="av-b-disc-hole"/>
        </div>
      </div>
      <div className="av-b-body">
        <div className="av-b-meta">
          <div className="av-b-chip"><AudioGlyph style={{width: 10, height: 10}}/><span>AUDIO</span></div>
          <div className="av-b-title">{SAMPLE.title}</div>
          <div className="av-b-byline">{SAMPLE.byline}</div>
        </div>
        <div className="av-b-wf">
          <button className="av-b-play" onClick={t.toggle}>
            {t.playing ? <PauseGlyph style={{width: 16, height: 16}}/> : <PlayGlyph style={{width: 16, height: 16, marginLeft: 2}}/>}
          </button>
          <div className="av-b-bars">
            {BARS.map((h, i) => <span key={i} className={"av-b-bar " + (i <= playedIdx ? 'played' : '')} style={{height: (h * 100) + '%'}}/>)}
          </div>
          <div className="av-b-time">{t.cur} / {SAMPLE.duration}</div>
        </div>
        <div className="av-b-tags">
          {SAMPLE.tags.map((tag, i) => <span key={i} className="av-b-tag">{tag}</span>)}
        </div>
      </div>
    </div>
  );
}

// V1 — Compact horizontal bar
function V1_CompactBar() {
  const t = useTransport(SAMPLE);
  const BARS = useMemo(() => makeBars(SAMPLE.title.length, 36), []);
  return (
    <div className="av-cbar">
      <button className="av-cbar-play" onClick={t.toggle} aria-label={t.playing ? 'Pause' : 'Play'}>
        {SAMPLE.cover && <img src={SAMPLE.cover} alt="" className="av-cbar-play-img"/>}
        <span className="av-cbar-play-icon">
          {t.playing ? <PauseGlyph style={{width: 11, height: 11, color: 'white'}}/> : <PlayGlyph style={{width: 11, height: 11, color: 'white', marginLeft: 1}}/>}
        </span>
      </button>
      <div className="av-cbar-meta">
        <div className="av-cbar-t">{SAMPLE.title}</div>
        <div className="av-cbar-by">{SAMPLE.byline}</div>
      </div>
      <div className="av-cbar-wf">
        {BARS.map((h, i) => <span key={i} style={{height: (h * 100) + '%'}}/>)}
      </div>
      <span className="av-cbar-d">{t.cur} / {SAMPLE.duration}</span>
    </div>
  );
}

// V2 — Minimal pill (single line)
function V2_Pill() {
  const t = useTransport(SAMPLE);
  return (
    <button className="av-pill" onClick={t.toggle}>
      <span className="av-pill-icon">
        {t.playing ? <PauseGlyph style={{width: 11, height: 11}}/> : <PlayGlyph style={{width: 11, height: 11, marginLeft: 1}}/>}
      </span>
      <span className="av-pill-t">{SAMPLE.title}</span>
      <span className="av-pill-sep">·</span>
      <span className="av-pill-by">{SAMPLE.byline.split(' · ')[0]}</span>
      <span className="av-pill-d">{t.cur} / {SAMPLE.duration}</span>
    </button>
  );
}

// V3 — Cardless · waveform-first
function V3_WaveformFirst() {
  const t = useTransport(SAMPLE);
  const BARS = useMemo(() => makeBars(SAMPLE.title.length, 64), []);
  const playedIdx = Math.floor(t.progress * BARS.length);
  return (
    <div className="av-wf">
      <div className="av-wf-bars">
        {BARS.map((h, i) => <span key={i} className={i <= playedIdx ? 'played' : ''} style={{height: (h * 100) + '%'}}/>)}
        <button className="av-wf-play" onClick={t.toggle}>
          {t.playing ? <PauseGlyph style={{width: 14, height: 14}}/> : <PlayGlyph style={{width: 14, height: 14, marginLeft: 1}}/>}
        </button>
      </div>
      <div className="av-wf-meta">
        <div className="av-wf-title">{SAMPLE.title}</div>
        <div className="av-wf-by">{SAMPLE.byline}</div>
        <div className="av-wf-time">{t.cur} / {SAMPLE.duration}</div>
      </div>
    </div>
  );
}

// V3a — Cover IS the play button (album art + play overlaid)
function V3a_CoverPlay() {
  const t = useTransport(SAMPLE);
  const BARS = useMemo(() => makeBars(SAMPLE.title.length, 64), []);
  const playedIdx = Math.floor(t.progress * BARS.length);
  return (
    <div className="av-wf">
      <div className="av-wf-bars">
        {BARS.map((h, i) => <span key={i} className={i <= playedIdx ? 'played' : ''} style={{height: (h * 100) + '%'}}/>)}
        <button className="av-wf-play av-wf-play-cover" onClick={t.toggle}>
          {SAMPLE.cover && <img src={SAMPLE.cover} alt="" className="av-wf-play-img"/>}
          <span className="av-wf-play-icon">
            {t.playing ? <PauseGlyph style={{width: 12, height: 12, color: 'white'}}/> : <PlayGlyph style={{width: 12, height: 12, color: 'white', marginLeft: 1}}/>}
          </span>
        </button>
      </div>
      <div className="av-wf-meta">
        <div className="av-wf-title">{SAMPLE.title}</div>
        <div className="av-wf-by">{SAMPLE.byline}</div>
        <div className="av-wf-time">{t.cur} / {SAMPLE.duration}</div>
      </div>
    </div>
  );
}

// V3b — Cover as left bookend; waveform fills the rest of the row
function V3b_CoverBookend() {
  const t = useTransport(SAMPLE);
  const BARS = useMemo(() => makeBars(SAMPLE.title.length, 56), []);
  const playedIdx = Math.floor(t.progress * BARS.length);
  return (
    <div className="av-wfb">
      <div className="av-wfb-row">
        <button className="av-wfb-cover" onClick={t.toggle}>
          {SAMPLE.cover && <img src={SAMPLE.cover} alt="" className="av-wfb-img"/>}
          <span className="av-wfb-play">
            {t.playing ? <PauseGlyph style={{width: 14, height: 14, color: 'white'}}/> : <PlayGlyph style={{width: 14, height: 14, color: 'white', marginLeft: 1}}/>}
          </span>
        </button>
        <div className="av-wfb-bars">
          {BARS.map((h, i) => <span key={i} className={i <= playedIdx ? 'played' : ''} style={{height: (h * 100) + '%'}}/>)}
        </div>
      </div>
      <div className="av-wfb-meta">
        <div className="av-wfb-title">{SAMPLE.title}</div>
        <div className="av-wfb-by">{SAMPLE.byline}</div>
        <div className="av-wfb-time">{t.cur} / {SAMPLE.duration}</div>
      </div>
    </div>
  );
}

// V3c — Cover image as backdrop of the waveform area
function V3c_CoverBackdrop() {
  const t = useTransport(SAMPLE);
  const BARS = useMemo(() => makeBars(SAMPLE.title.length, 64), []);
  const playedIdx = Math.floor(t.progress * BARS.length);
  return (
    <div className="av-wf">
      <div className="av-wf-bars av-wf-backdrop">
        {SAMPLE.cover && <img src={SAMPLE.cover} alt="" className="av-wf-backdrop-img"/>}
        {BARS.map((h, i) => <span key={i} className={i <= playedIdx ? 'played' : ''} style={{height: (h * 100) + '%'}}/>)}
        <button className="av-wf-play" onClick={t.toggle}>
          {t.playing ? <PauseGlyph style={{width: 14, height: 14}}/> : <PlayGlyph style={{width: 14, height: 14, marginLeft: 1}}/>}
        </button>
      </div>
      <div className="av-wf-meta">
        <div className="av-wf-title">{SAMPLE.title}</div>
        <div className="av-wf-by">{SAMPLE.byline}</div>
        <div className="av-wf-time">{t.cur} / {SAMPLE.duration}</div>
      </div>
    </div>
  );
}

// V3d — Cover inline in the meta line (small square next to title)
function V3d_CoverInTitle() {
  const t = useTransport(SAMPLE);
  const BARS = useMemo(() => makeBars(SAMPLE.title.length, 64), []);
  const playedIdx = Math.floor(t.progress * BARS.length);
  return (
    <div className="av-wf">
      <div className="av-wf-bars">
        {BARS.map((h, i) => <span key={i} className={i <= playedIdx ? 'played' : ''} style={{height: (h * 100) + '%'}}/>)}
        <button className="av-wf-play" onClick={t.toggle}>
          {t.playing ? <PauseGlyph style={{width: 14, height: 14}}/> : <PlayGlyph style={{width: 14, height: 14, marginLeft: 1}}/>}
        </button>
      </div>
      <div className="av-wfd-meta">
        {SAMPLE.cover && <img src={SAMPLE.cover} alt="" className="av-wfd-cover"/>}
        <div className="av-wfd-body">
          <div className="av-wf-title">{SAMPLE.title}</div>
          <div className="av-wf-by">{SAMPLE.byline}</div>
        </div>
        <div className="av-wf-time av-wfd-time">{t.cur} / {SAMPLE.duration}</div>
      </div>
    </div>
  );
}

// V4 — Slim card (drop the big cover + disc, keep card chrome)
function V4_SlimCard() {
  const t = useTransport(SAMPLE);
  const BARS = useMemo(() => makeBars(SAMPLE.title.length, 48), []);
  const playedIdx = Math.floor(t.progress * BARS.length);
  return (
    <div className="av-slim">
      <div className="av-slim-head">
        {SAMPLE.cover && <img src={SAMPLE.cover} alt="" className="av-slim-init"/>}
        <div className="av-slim-meta">
          <div className="av-slim-title">{SAMPLE.title}</div>
          <div className="av-slim-by">{SAMPLE.byline}</div>
        </div>
        <span className="av-slim-d">{SAMPLE.duration}</span>
      </div>
      <div className="av-slim-row">
        <button className="av-slim-play" onClick={t.toggle}>
          {t.playing ? <PauseGlyph style={{width: 12, height: 12}}/> : <PlayGlyph style={{width: 12, height: 12, marginLeft: 1}}/>}
        </button>
        <div className="av-slim-bars">
          {BARS.map((h, i) => <span key={i} className={i <= playedIdx ? 'played' : ''} style={{height: (h * 100) + '%'}}/>)}
        </div>
        <span className="av-slim-cur">{t.cur}</span>
      </div>
    </div>
  );
}

// V5 — Minimal scrub line (no bars, just a thin progress strip)
function V5_LineScrub() {
  const t = useTransport(SAMPLE);
  return (
    <div className="av-line">
      <button className="av-line-play" onClick={t.toggle}>
        {SAMPLE.cover && <img src={SAMPLE.cover} alt="" className="av-line-play-img"/>}
        <span className="av-line-play-icon">
          {t.playing ? <PauseGlyph style={{width: 12, height: 12, color: 'white'}}/> : <PlayGlyph style={{width: 12, height: 12, color: 'white', marginLeft: 1}}/>}
        </span>
      </button>
      <div className="av-line-meta">
        <div className="av-line-row1">
          <span className="av-line-t">{SAMPLE.title}</span>
          <span className="av-line-time">{t.cur} <span>/ {SAMPLE.duration}</span></span>
        </div>
        <div className="av-line-row2">
          <span className="av-line-by">{SAMPLE.byline}</span>
        </div>
        <div className="av-line-track">
          <div className="av-line-fill" style={{width: (t.progress * 100) + '%'}}/>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="av-page">
      <header className="av-page-h">
        <div className="av-kicker">{kicker}</div>
        <h1 className="av-h1">{title}</h1>
        <p className="av-sub">{sub}</p>
      </header>
      <div className="av-stage">{children}</div>
      {cheat && (
        <div className="av-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <div key={k} className="av-cheat-row">
              <span className="av-cheat-k">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Audio attachment variants">
      <DCSection id="audio" title="Audio player — reducing the footprint">
        <DCArtboard id="v0" label="V0 · baseline (current)" width={560} height={500}>
          <Page kicker="V0 · BASELINE" title="Current player" sub="What we have now. Big cover with spinning disc, full-width waveform (56 bars), title + byline + tags row. Roughly 180px tall."
            cheat={{
              Footprint: '~180px tall × full width',
              Pros: 'Maximalist. Cover is a strong visual anchor. Tags surface metadata.',
              Cons: 'Heavy for a feed item. Two audio posts in a row dominates the timeline.',
            }}>
            <V0_Baseline/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v1" label="V1 · compact horizontal bar" width={560} height={400}>
          <Page kicker="V1" title="Compact bar" sub="Single row. Cover shrinks to 32px play button, byline kept, mini-waveform on the right. Already used in combo layouts."
            cheat={{
              Footprint: '~52px tall',
              Pros: 'Same metadata surface as baseline. Familiar (matches the combo layout).',
              Cons: 'Waveform is decorative — too small to read amplitude shapes.',
              'When': 'Default for in-feed audio.',
            }}>
            <V1_CompactBar/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v2" label="V2 · minimal pill" width={560} height={360}>
          <Page kicker="V2" title="Minimal pill" sub="Single line, no waveform, no cover. Looks more like a chip than a player."
            cheat={{
              Footprint: '~36px tall',
              Pros: 'Tiniest possible. Feels like a citation more than a media attachment.',
              Cons: 'No waveform context. Loses the "this is audio" visual cue at a glance.',
              'When': 'Inside quoted posts, reply previews, or compact density preference.',
            }}>
            <V2_Pill/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3" label="V3 · waveform-first (no cover)" width={560} height={420}>
          <Page kicker="V3" title="Waveform-first" sub="The waveform IS the player. No cover — pure content. Anchor for comparison against the cover-integrated variants below."
            cheat={{
              Footprint: '~90px tall',
              'Cover': 'none',
              'When': 'Audio-as-content where artist identity is in the byline, not the cover.',
            }}>
            <V3_WaveformFirst/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3a" label="V3a · cover IS the play button ★" width={560} height={420}>
          <Page kicker="V3a · RECOMMENDED" title="Cover-as-play" sub="The center play button becomes a gradient cover disc with the serif initial behind the play icon. Cover identity surfaces without adding a separate UI element."
            cheat={{
              Footprint: '~90px tall · same as V3',
              'Cover': 'doubles as the play button (36px gradient circle with initial)',
              Pros: 'Zero added chrome. Cover identity visible. Tap target is generous.',
              Cons: 'Cover slightly obscured by the play icon overlay. Initial is small.',
              'When': 'Cover identity matters but you want V3\u2019s minimal footprint.',
            }}>
            <V3a_CoverPlay/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3b" label="V3b · cover bookend (left)" width={560} height={460}>
          <Page kicker="V3b" title="Cover bookend" sub="44px square cover on the left, waveform fills the rest of the horizontal row. Spotify-ish. Cover is its own visual unit."
            cheat={{
              Footprint: '~110px tall (cover row + meta)',
              'Cover': '44px square on the left, doubles as play button',
              Pros: 'Cover unobstructed. Familiar layout. Strong artist identity.',
              Cons: 'Slightly taller than V3. Waveform width is reduced.',
              'When': 'When the cover is the post\u2019s most important visual.',
            }}>
            <V3b_CoverBookend/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3c" label="V3c · cover backdrop" width={560} height={440}>
          <Page kicker="V3c" title="Cover backdrop" sub="Cover gradient becomes the background of the waveform area, at lower opacity. A faint serif initial sits in the corner. Atmospheric."
            cheat={{
              Footprint: '~90px tall · same as V3',
              'Cover': 'low-opacity bg of the waveform area',
              Pros: 'Cover is felt rather than displayed. Most ambient option.',
              Cons: 'Reduced waveform contrast — bars need to compete with the gradient. Initial is decorative, not really legible.',
              'When': 'Tone-led communities (ambient, slow music) where mood > info.',
            }}>
            <V3c_CoverBackdrop/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3d" label="V3d · cover next to title" width={560} height={440}>
          <Page kicker="V3d" title="Cover in title line" sub="Waveform stays cover-free. A 22px square cover sits next to the title in the meta row below. Cleanest separation of concerns."
            cheat={{
              Footprint: '~90px tall · same as V3',
              'Cover': '22px square next to title',
              Pros: 'Waveform stays maximally readable. Cover is visible but doesn\u2019t compete.',
              Cons: 'Cover is small. Reads more like a favicon than artwork.',
              'When': 'When you want both visual signals to stay legible at their own scale.',
            }}>
            <V3d_CoverInTitle/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4" label="V4 · slim card" width={560} height={400}>
          <Page kicker="V4" title="Slim card" sub="Card chrome retained but the big cover is dropped. Small gradient initial as a 28px badge. Two rows: meta on top, transport + waveform below."
            cheat={{
              Footprint: '~80px tall',
              Pros: 'Keeps the cover identity (small) and card boundary. Reads as a discrete unit in a feed.',
              Cons: 'Still more chrome than V3. Cover badge is too small to be very distinctive.',
              'When': 'Default if the cover-art identity matters to your community (label releases, themed weekly mixes).',
            }}>
            <V4_SlimCard/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v5" label="V5 · line scrub (no bars)" width={560} height={380}>
          <Page kicker="V5" title="Line scrub" sub="No waveform at all — just a thin progress line under the meta. Cover is a single 36px gradient circle with the play icon. Most like a system-level audio player."
            cheat={{
              Footprint: '~70px tall',
              Pros: 'Cleanest aesthetic. Pairs well with text-heavy posts. No fake waveforms.',
              Cons: 'No amplitude preview. Harder to know "where the loud part is" before tapping.',
              'When': 'When honesty matters — the waveform was always synthetic anyway; this acknowledges it.',
            }}>
            <V5_LineScrub/>
          </Page>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
