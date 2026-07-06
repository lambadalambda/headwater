/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState } = React;

// ============================================================
// Quote post variants
// Same quoter, three quoted-post media states (none, 1 photo,
// 4 mixed). Each variant renders all three so the scaling
// behavior is visible side-by-side within one artboard.
// ============================================================

const MAIN = {
  name: 'orbit', handle: '@orbit@spacebear.net', avClass: 'av-orb',
  time: '8m',
  body: "this perfectly captures my feelings about saturday morning",
};

const KESTREL = {
  name: 'kestrel.fm', handle: '@kestrel@audio.garden', avClass: 'av-grad-3',
  time: '2h',
  body: "the moment between waking up and remembering you have responsibilities is the most peaceful state known to humanity",
  url: 'https://audio.garden/users/kestrel/statuses/116571702560550172',
  replies: 12, boosts: 87, favs: 312,
};

const SCENARIOS = [
  {
    label: 'A · text only',
    quoted: { ...KESTREL, attachments: [] },
  },
  {
    label: 'B · one photo',
    quoted: { ...KESTREL, attachments: [
      { kind: 'photo', src: 'samples/cat-door.webp', alt: 'morning light through a door' },
    ]},
  },
  {
    label: 'C · 4 attachments (2 photos · 1 video · 1 audio)',
    quoted: { ...KESTREL, attachments: [
      { kind: 'photo', src: 'samples/falco.png', alt: '' },
      { kind: 'photo', src: 'samples/dragon.png', alt: '' },
      { kind: 'video', poster: 'sunset', duration: '0:42' },
      { kind: 'audio', title: 'kettle whistle', byline: 'kestrel · field', duration: '2:14',
        coverInitial: 'k', coverGrad: 'linear-gradient(135deg, #6e4f9e, #e7a8c9, #e0b97a)' },
    ]},
  },
];

// ============================================================
// Inline glyphs
// ============================================================
const Glyph = {
  play:  (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 5l12 7-12 7V5z"/></svg>,
  video: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M15 8l5-3v14l-5-3M3 7h12v10H3z" strokeLinejoin="round"/></svg>,
  audio: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" strokeLinejoin="round"/></svg>,
  image: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="8" cy="10" r="1.5"/><path d="M3 17l5-5 4 4 3-3 6 6" strokeLinejoin="round"/></svg>,
};

function KindBadge({ kind, size = 11 }) {
  const G = Glyph[kind === 'photo' ? 'image' : kind];
  if (!G) return null;
  return <span className="qv-kind-badge"><G style={{width: size, height: size}}/></span>;
}

// ============================================================
// MediaStripPreview — thumbnail strip + overflow.
// Used by every variant for multi-attachment quotes.
// max = how many thumbnails to render before collapsing to "+N".
// ============================================================
function MediaStripPreview({ attachments, max = 4, size = 'md' }) {
  if (!attachments?.length) return null;
  const visible = attachments.slice(0, max);
  const overflow = attachments.length - visible.length;
  return (
    <div className={"qv-mstrip qv-mstrip-" + size}>
      {visible.map((a, i) => {
        const isLast = i === visible.length - 1;
        return (
          <div key={i} className={"qv-mstrip-tile qv-mstrip-" + a.kind}>
            {a.kind === 'photo' && <img src={a.src} alt={a.alt || ''}/>}
            {a.kind === 'video' && (
              <React.Fragment>
                <div className="qv-mstrip-video-bg"/>
                <Glyph.play style={{width: 14, height: 14, color: 'white', position: 'relative', zIndex: 1, marginLeft: 1}}/>
              </React.Fragment>
            )}
            {a.kind === 'audio' && (
              <div className="qv-mstrip-audio-bg" style={{background: a.coverGrad}}>
                <span>{a.coverInitial}</span>
              </div>
            )}
            <KindBadge kind={a.kind} size={9}/>
            {isLast && overflow > 0 && (
              <div className="qv-mstrip-overflow">
                <span>+{overflow}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Single-attachment previews (used when attachments.length === 1
// and the variant wants a more prominent treatment than the strip)
// ============================================================
function SinglePhoto({ src, alt, className = '' }) {
  return (
    <div className={"qv-1photo " + className}>
      <img src={src} alt={alt || ''}/>
    </div>
  );
}

function SingleVideo({ video, className = '' }) {
  return (
    <div className={"qv-1video " + className}>
      <div className="qv-1video-bg"/>
      <button className="qv-1video-play"><Glyph.play style={{width: 18, height: 18, marginLeft: 2}}/></button>
      <span className="qv-1video-chip"><Glyph.video style={{width: 9, height: 9}}/> VIDEO</span>
      <span className="qv-1video-dur">{video.duration}</span>
    </div>
  );
}

function SingleAudio({ audio, className = '' }) {
  return (
    <div className={"qv-1audio " + className}>
      <button className="qv-1audio-cover" style={{background: audio.coverGrad}}>
        <Glyph.play style={{width: 11, height: 11, color: 'white', marginLeft: 1}}/>
      </button>
      <div className="qv-1audio-meta">
        <div className="qv-1audio-t">{audio.title}</div>
        <div className="qv-1audio-by">{audio.byline}</div>
      </div>
      <span className="qv-1audio-d">{audio.duration}</span>
    </div>
  );
}

// Media dispatcher used by V1 / V2 / V3 / V5
function QuoteMedia({ attachments, layout = 'card' }) {
  if (!attachments?.length) return null;
  if (attachments.length === 1) {
    const a = attachments[0];
    if (a.kind === 'photo') return <SinglePhoto src={a.src} alt={a.alt} className={"qv-mc-" + layout}/>;
    if (a.kind === 'video') return <SingleVideo video={a} className={"qv-mc-" + layout}/>;
    if (a.kind === 'audio') return <SingleAudio audio={a} className={"qv-mc-" + layout}/>;
    return null;
  }
  // 2+ → strip
  return <MediaStripPreview attachments={attachments} size={layout === 'block' ? 'sm' : 'md'}/>;
}

// ============================================================
// Shared chrome — main post shell, slot for quote
// ============================================================
function MainPost({ children }) {
  return (
    <article className="qv-post">
      <div className={"qv-av " + MAIN.avClass}/>
      <div className="qv-right">
        <header className="qv-head">
          <span className="qv-name">{MAIN.name}</span>
          <span className="qv-handle">{MAIN.handle}</span>
          <span className="qv-time">{MAIN.time}</span>
        </header>
        <div className="qv-body">{MAIN.body}</div>
        {children}
        <footer className="qv-foot">
          <button className="qv-act">↩</button>
          <button className="qv-act">↻ 4</button>
          <button className="qv-act">★ 18</button>
          <button className="qv-act qv-act-end">⋯</button>
        </footer>
      </div>
    </article>
  );
}

// ============================================================
// Variant 0 — Baseline (current Pleroma) — kept single-scenario
// ============================================================
function Variant0_Baseline() {
  const quoted = SCENARIOS[1].quoted;
  return (
    <MainPost>
      <div className="qv0-re">RE: <a>{quoted.url}</a></div>
      <button className="qv0-hide">Hide the quoted status ⌃</button>
      <div className="qv0-nested">
        <header className="qv0-nested-head">
          <div className={"qv-av " + quoted.avClass}/>
          <div>
            <div className="qv-name">{quoted.name}</div>
            <div className="qv-handle">{quoted.handle}</div>
          </div>
          <span className="qv-time">{quoted.time}</span>
        </header>
        <div className="qv-body">{quoted.body}</div>
        <div className="qv0-photo"><img src={quoted.attachments[0].src} alt=""/></div>
        <footer className="qv-foot">
          <button className="qv-act">↩ {quoted.replies}</button>
          <button className="qv-act">↻ {quoted.boosts}</button>
          <button className="qv-act">★ {quoted.favs}</button>
          <button className="qv-act qv-act-end">⋯</button>
        </footer>
      </div>
    </MainPost>
  );
}

// ============================================================
// Variant 1 — Embedded card
// ============================================================
function Variant1_Card({ quoted }) {
  return (
    <MainPost>
      <a className="qv1-card">
        <header className="qv1-head">
          <div className={"qv-av qv-av-sm " + quoted.avClass}/>
          <span className="qv-name">{quoted.name}</span>
          <span className="qv-handle">{quoted.handle}</span>
          <span className="qv-time">{quoted.time}</span>
          <span className="qv1-ext">↗</span>
        </header>
        <div className="qv1-body">{quoted.body}</div>
        <QuoteMedia attachments={quoted.attachments} layout="card"/>
        <footer className="qv1-foot">
          <span>↩ {quoted.replies}</span>
          <span>↻ {quoted.boosts}</span>
          <span>★ {quoted.favs}</span>
          <span className="qv1-foot-end">view original →</span>
        </footer>
      </a>
    </MainPost>
  );
}

// ============================================================
// Variant 2 — Blockquote / editorial
// ============================================================
function Variant2_Blockquote({ quoted }) {
  return (
    <MainPost>
      <blockquote className="qv2-quote">
        <div className="qv2-body">{quoted.body}</div>
        <QuoteMedia attachments={quoted.attachments} layout="block"/>
        <div className="qv2-attr">
          <div className={"qv-av qv-av-xs " + quoted.avClass}/>
          <span className="qv2-attr-name">{quoted.name}</span>
          <span className="qv-handle">{quoted.handle}</span>
          <span className="qv-time">· {quoted.time} ago</span>
          <a className="qv2-link">view original →</a>
        </div>
      </blockquote>
    </MainPost>
  );
}

// ============================================================
// Variant 3 — Compact, expandable
// ============================================================
function Variant3_Compact({ quoted, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const mediaCount = quoted.attachments?.length || 0;
  return (
    <MainPost>
      {!open ? (
        <button className="qv3-bar" onClick={() => setOpen(true)}>
          <div className={"qv-av qv-av-xs " + quoted.avClass}/>
          <span className="qv3-bar-name">{quoted.name}</span>
          <span className="qv3-bar-snip">{quoted.body}</span>
          {mediaCount > 0 && (
            <span className="qv3-bar-media">
              {mediaCount === 1 ? (
                <KindBadge kind={quoted.attachments[0].kind} size={9}/>
              ) : (
                <span className="qv3-bar-media-n">+{mediaCount}</span>
              )}
            </span>
          )}
          <span className="qv3-bar-arr">▾</span>
        </button>
      ) : (
        <div className="qv1-card qv3-open">
          <header className="qv1-head">
            <div className={"qv-av qv-av-sm " + quoted.avClass}/>
            <span className="qv-name">{quoted.name}</span>
            <span className="qv-handle">{quoted.handle}</span>
            <span className="qv-time">{quoted.time}</span>
            <button className="qv1-ext qv3-collapse" onClick={() => setOpen(false)}>▴</button>
          </header>
          <div className="qv1-body">{quoted.body}</div>
          <QuoteMedia attachments={quoted.attachments} layout="card"/>
        </div>
      )}
    </MainPost>
  );
}

// ============================================================
// Variant 4 — Smart-card (unfurled link style)
// Falls back to V1 (Card) when there's no media.
// ============================================================
function Variant4_SmartCard({ quoted }) {
  const photos = (quoted.attachments || []).filter(a => a.kind === 'photo');
  const hero = photos[0] || (quoted.attachments || [])[0];
  if (!hero) {
    // No media → fall back to V1 layout
    return <Variant1_Card quoted={quoted}/>;
  }
  const otherCount = (quoted.attachments?.length || 0) - 1;
  return (
    <MainPost>
      <a className="qv4-card">
        <div className="qv4-photo">
          {hero.kind === 'photo' && <img src={hero.src} alt=""/>}
          {hero.kind === 'video' && (
            <React.Fragment>
              <div className="qv-mstrip-video-bg" style={{position: 'absolute', inset: 0}}/>
              <Glyph.play style={{width: 22, height: 22, color: 'white', position: 'relative', zIndex: 1}}/>
            </React.Fragment>
          )}
          {hero.kind === 'audio' && (
            <div className="qv4-photo-audio" style={{background: hero.coverGrad}}>
              <span>{hero.coverInitial}</span>
            </div>
          )}
          {otherCount > 0 && <span className="qv4-photo-more">+{otherCount}</span>}
        </div>
        <div className="qv4-body">
          <div className="qv4-kicker">QUOTE · audio.garden</div>
          <div className="qv4-text">{quoted.body}</div>
          <div className="qv4-attr">
            <div className={"qv-av qv-av-xs " + quoted.avClass}/>
            <span className="qv4-attr-name">{quoted.name}</span>
            <span className="qv-handle">{quoted.handle}</span>
            <span className="qv-time">· {quoted.time}</span>
          </div>
        </div>
      </a>
    </MainPost>
  );
}

// ============================================================
// Variant 5 — Postcard (PleromaNet flavor)
// ============================================================
function Variant5_Postcard({ quoted }) {
  const first = quoted.attachments?.[0];
  const restCount = (quoted.attachments?.length || 0) - 1;
  return (
    <MainPost>
      <div className="qv5-wrap">
        <div className="qv5-card">
          <span className="qv5-stamp">QUOTE</span>
          <span className="qv5-tape qv5-tape-l"/>
          <span className="qv5-tape qv5-tape-r"/>
          {first && (
            <div className="qv5-photo">
              {first.kind === 'photo' && <img src={first.src} alt=""/>}
              {first.kind === 'video' && (
                <React.Fragment>
                  <div className="qv-mstrip-video-bg" style={{position: 'absolute', inset: 0}}/>
                  <Glyph.play style={{width: 22, height: 22, color: 'white', position: 'relative', zIndex: 1}}/>
                </React.Fragment>
              )}
              {first.kind === 'audio' && (
                <div className="qv5-audio-cover" style={{background: first.coverGrad}}>
                  <span>{first.coverInitial}</span>
                </div>
              )}
              {restCount > 0 && <span className="qv5-photo-more">+{restCount} more</span>}
            </div>
          )}
          <div className="qv5-body">
            <div className="qv5-text">{quoted.body}</div>
            <div className="qv5-attr">
              <span className="qv5-em">—</span>
              <span className="qv5-name">{quoted.name}</span>
              <span className="qv-handle qv5-handle">{quoted.handle}</span>
            </div>
          </div>
        </div>
      </div>
    </MainPost>
  );
}

// ============================================================
// Page wrapper + multi-scenario layout
// ============================================================
function Page({ kicker, title, sub, children, cheat }) {
  return (
    <div className="qv-page">
      <header className="qv-page-h">
        <div className="qv-kicker">{kicker}</div>
        <h1 className="qv-h1">{title}</h1>
        <p className="qv-sub">{sub}</p>
      </header>
      <div className="qv-page-body">
        {children}
      </div>
      {cheat && (
        <div className="qv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <div key={k} className="qv-cheat-row">
              <span className="qv-cheat-k">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScenarioLabel({ label }) {
  return <div className="qv-scen-label">{label}</div>;
}

function MultiScenario({ Quote, extraProps }) {
  return (
    <React.Fragment>
      {SCENARIOS.map(s => (
        <React.Fragment key={s.label}>
          <ScenarioLabel label={s.label}/>
          <Quote quoted={s.quoted} {...(extraProps || {})}/>
        </React.Fragment>
      ))}
    </React.Fragment>
  );
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Quote post variants">
      <DCSection id="quotes" title="Quote post handling — five alternatives + baseline">

        <DCArtboard id="v0" label="V0 · current Pleroma (the problem)" width={620} height={920}>
          <Page kicker="V0 · BASELINE" title="As-is (Pleroma)" sub="What we have now. Big URL, manual hide toggle, fully nested quoted post with its own action bar. Visually competes with the main post. Shown for one media state only — for reference."
            cheat={{
              Model: 'Nested replica with full chrome',
              Pros: 'Lossless — every quote shows full source post.',
              Cons: 'URL is ugly. Hide toggle is awkward. Nested actions confuse "what am I interacting with". Massive vertical footprint.',
            }}>
            <Variant0_Baseline/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v1" label="V1 · embedded card ★" width={620} height={1640}>
          <Page kicker="V1 · RECOMMENDED" title="Embedded card" sub='Bordered card with smaller avatar, no action bar of its own. Single-attachment: inline preview (photo / video poster / audio bar). Multi: small thumbnail strip with "+N" overflow.'
            cheat={{
              Model: '1 attachment → inline preview · 2+ → 4-tile strip + "+N"',
              Pros: 'Universally understood pattern. Scales to any media count. Single players never compete with the host post.',
              Cons: 'Adds chrome. Card-on-card stacking in a thread can feel boxy.',
              'When': 'Default. Works for any quote with any media mix.',
            }}>
            <MultiScenario Quote={Variant1_Card}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v2" label="V2 · blockquote / editorial" width={620} height={1500}>
          <Page kicker="V2" title="Blockquote" sub='Typographic, no card. Single-attachment: small inline image / kind-marked preview. Multi: small thumbnail strip below the body.'
            cheat={{
              Model: 'Borderless · left accent rule · serif body · small inline media',
              Pros: 'Minimal chrome. Reads more like prose. Strip stays subdued.',
              Cons: 'Less visually distinct. Multi-media strip can read as decoration rather than content.',
              'When': 'Text-heavy instances. May not scale to many concurrent quotes in a thread.',
            }}>
            <MultiScenario Quote={Variant2_Blockquote}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3" label="V3 · compact / expandable" width={620} height={920}>
          <Page kicker="V3" title="Compact, expand-on-tap" sub='Bar shows avatar + name + truncated body + a media badge. Tap to expand into the V1 card. Three scenarios shown here as bars; the "1 photo" scenario also expanded.'
            cheat={{
              Model: 'Collapsed bar with kind/count badge · expands to V1 card',
              Pros: 'Tiny footprint. Bar shows there IS media (badge) without rendering it. Reader chooses when to see context.',
              Cons: 'Hides quoted content by default — adds an interaction step.',
              'When': 'Could be a per-user preference, or auto-collapse for older quotes / list view.',
            }}>
            <ScenarioLabel label="A · text only"/>
            <Variant3_Compact quoted={SCENARIOS[0].quoted}/>
            <ScenarioLabel label="B · one photo (expanded)"/>
            <Variant3_Compact quoted={SCENARIOS[1].quoted} defaultOpen/>
            <ScenarioLabel label="C · 4 attachments"/>
            <Variant3_Compact quoted={SCENARIOS[2].quoted}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4" label="V4 · smart-card" width={620} height={1500}>
          <Page kicker="V4" title="Smart-card / unfurl" sub='Photo on left, body on right. With multiple media, the left column shows the first photo with a "+N" badge. Text-only quotes fall back to V1 (no left column).'
            cheat={{
              Model: 'Side-by-side · hero photo + body · "+N" badge for extras · falls back to V1 when no media',
              Pros: 'Compact horizontal layout when media exists. Strong "reference to elsewhere" affordance.',
              Cons: 'Requires fallback for text-only. Hero photo is arbitrary (first found).',
              'When': 'When quoted posts usually have media. Falls back automatically when not.',
            }}>
            <MultiScenario Quote={Variant4_SmartCard}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v5" label="V5 · postcard (PN flavor)" width={620} height={1600}>
          <Page kicker="V5 · WILDCARD" title="Postcard" sub={'Tucked-in postcard with tape, "QUOTE" stamp, serif-italic attribution. First attachment fills the postcard; extras show as "+N more" caption.'}
            cheat={{
              Model: 'Decorated card · first media fills the image plate · "+N more" caption for extras',
              Pros: 'Visually distinct. Reinforces PleromaNet visual language.',
              Cons: 'Heavier chrome. Fragile at small sizes. Twee for some.',
              'When': 'Quotes are rare in this community and you want them to feel special.',
            }}>
            <MultiScenario Quote={Variant5_Postcard}/>
          </Page>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
