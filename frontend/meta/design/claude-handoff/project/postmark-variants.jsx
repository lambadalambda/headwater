/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */

// ============================================================
// Postmark-stamp refinements
// Same reaction set in every variant, dropped into a real
// thread context so we can see how it sits alongside the
// other post components (avatar, head, body, actions).
// ============================================================

const REACTIONS = [
  { kind: 'unicode',  glyph: '❤️',  count: 24, you: true,  name: 'red heart' },
  { kind: 'custom',   shortcode: 'pleromasummer', count: 18, you: false, swatch: 'pm-cx-summer' },
  { kind: 'unicode',  glyph: '🔥',  count: 12, you: false, name: 'fire' },
  { kind: 'custom',   shortcode: 'blobcat',        count: 9,  you: false, swatch: 'pm-cx-blobcat' },
  { kind: 'unicode',  glyph: '😂',  count: 6,  you: false, name: 'face with tears of joy' },
  { kind: 'custom',   shortcode: 'catshrug',       count: 3,  you: false, swatch: 'pm-cx-shrug' },
];

const ROT = [-1.6, 1.2, -0.7, 1.8, -1.3, 0.6];

// ---------- Custom-emoji placeholder ----------
function CustomEmoji({ swatch, shortcode, size = 22 }) {
  return (
    <span className={"pm-cx " + swatch}
      style={{width: size, height: size}}
      title={':' + shortcode + ':'}>
      <span className="pm-cx-i" style={{fontSize: Math.max(7, Math.floor(size * 0.4))}}>
        {shortcode.slice(0, 2)}
      </span>
    </span>
  );
}

const G = {
  reply: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
  boost: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5"/></svg>,
  star:  (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" width="14" height="14" {...p}><path d="M8 2l1.7 3.9 4.3.4-3.2 2.9.9 4.2L8 11.2 4.3 13.4l.9-4.2L2 6.3l4.3-.4L8 2z"/></svg>,
  more:  (p) => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" {...p}><circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12" cy="8" r="1.3"/></svg>,
  plus:  (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="11" height="11" {...p}><path d="M8 3v10M3 8h10"/></svg>,
};

// ============================================================
// Thread context — focused post + one reply
// Reactions slot is provided via `reactions` render prop.
// ============================================================
function ThreadCtx({ children }) {
  return (
    <div className="pm-thread">
      {/* ancestor */}
      <div className="pm-post pm-post-ancestor">
        <div className="pm-line-wrap">
          <div className="pm-av av-grad-2"/>
          <div className="pm-line"/>
        </div>
        <div style={{minWidth: 0}}>
          <header className="pm-head">
            <span className="pm-name">gridwave</span>
            <span className="pm-handle">@gridwave@retro.social</span>
            <span className="pm-time">5h</span>
          </header>
          <div className="pm-body">anyone else feel like the slow web is the only web worth defending? it&apos;s the one place where you can still see the seams.</div>
        </div>
      </div>

      {/* focused */}
      <article className="pm-focused">
        <div className="pm-line-top"/>
        <header className="pm-focused-head">
          <div className="pm-av-focused av-grad-3"/>
          <div style={{minWidth: 0, flex: 1}}>
            <div className="pm-focused-name">soft.hertz</div>
            <div className="pm-focused-handle">@soft.hertz@kolektiva.social</div>
          </div>
          <button className="pm-follow">Following</button>
        </header>
        <div className="pm-focused-body">
          the algorithm doesn&apos;t care about you. the timeline doesn&apos;t either. but the people in it do, and that&apos;s worth keeping.
        </div>
        {children /* reaction row */}
        <footer className="pm-focused-actions">
          <button className="pm-action"><G.reply/><span>8</span></button>
          <button className="pm-action"><G.boost/><span>34</span></button>
          <button className="pm-action on"><G.star/><span>142</span></button>
          <button className="pm-action" style={{marginLeft: 'auto'}}><G.more/></button>
        </footer>
      </article>

      {/* reply */}
      <div className="pm-post pm-post-reply">
        <div className="pm-line-wrap pm-line-wrap-reply">
          <div className="pm-av av-orb"/>
        </div>
        <div style={{minWidth: 0}}>
          <header className="pm-head">
            <span className="pm-name">datagram</span>
            <span className="pm-handle">@datagram@retro.social</span>
            <span className="pm-time">2h</span>
          </header>
          <div className="pm-body">↪ <a className="pm-mention">@soft.hertz</a> qwen 0.5b can handle some limited summary tasks. theres also the JOSIE models which are jailbroken qwens.</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V3a · Tinted paper + count BESIDE stamp (×N notation)
// ============================================================
function V3a() {
  return (
    <div className="pm-reactions pm-v3a">
      {REACTIONS.map((r, i) => (
        <div key={i} className="pm-v3a-cell">
          <button className={"pm-stamp pm-v3a-stamp " + (r.you ? 'you' : '')}
            style={{transform: `rotate(${ROT[i % ROT.length]}deg)`}}
            title={r.kind === 'custom' ? ':' + r.shortcode + ':' : r.name}>
            <span className="pm-stamp-art">
              {r.kind === 'unicode'
                ? <span className="pm-emoji">{r.glyph}</span>
                : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={26}/>}
            </span>
          </button>
          <span className="pm-v3a-count">×{r.count}</span>
        </div>
      ))}
      <button className="pm-stamp pm-v3a-stamp pm-v3a-add" title="Add reaction"
        style={{transform: 'rotate(-0.6deg)'}}>
        <span className="pm-stamp-art"><G.plus/></span>
      </button>
    </div>
  );
}

// ============================================================
// V3b · Cancellation postmark — small dark circular mark over
// the bottom-right corner with the count "stamped" into it
// ============================================================
function V3b() {
  return (
    <div className="pm-reactions pm-v3b">
      {REACTIONS.map((r, i) => (
        <button key={i}
          className={"pm-v3b-stamp " + (r.you ? 'you' : '')}
          style={{transform: `rotate(${ROT[i % ROT.length]}deg)`}}
          title={r.kind === 'custom' ? ':' + r.shortcode + ':' : r.name}>
          <span className="pm-stamp pm-v3b-face">
            <span className="pm-stamp-art">
              {r.kind === 'unicode'
                ? <span className="pm-emoji pm-v3b-emoji">{r.glyph}</span>
                : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={28}/>}
            </span>
          </span>
          <span className="pm-v3b-cancel">
            <span className="pm-v3b-cancel-n">{r.count}</span>
          </span>
        </button>
      ))}
      <button className="pm-v3b-stamp pm-v3b-add" title="Add reaction"
        style={{transform: 'rotate(-0.6deg)'}}>
        <span className="pm-stamp pm-v3b-face">
          <span className="pm-stamp-art"><G.plus/></span>
        </span>
      </button>
    </div>
  );
}

// ============================================================
// V3c · Letterpress card-stock — stronger paper contrast,
// count as a discreet caption BELOW the stamp on its own line
// with breathing room
// ============================================================
function V3c() {
  return (
    <div className="pm-reactions pm-v3c">
      {REACTIONS.map((r, i) => (
        <div key={i} className="pm-v3c-cell">
          <button className={"pm-stamp pm-v3c-stamp " + (r.you ? 'you' : '')}
            style={{transform: `rotate(${ROT[i % ROT.length]}deg)`}}
            title={r.kind === 'custom' ? ':' + r.shortcode + ':' : r.name}>
            <span className="pm-stamp-art">
              {r.kind === 'unicode'
                ? <span className="pm-emoji pm-v3c-emoji">{r.glyph}</span>
                : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={34}/>}
            </span>
          </button>
          <div className={"pm-v3c-count " + (r.you ? 'you' : '')}>{r.count}</div>
        </div>
      ))}
      <div className="pm-v3c-cell">
        <button className="pm-stamp pm-v3c-stamp pm-v3c-add" title="Add reaction"
          style={{transform: 'rotate(-0.6deg)'}}>
          <span className="pm-stamp-art"><G.plus/></span>
        </button>
        <div className="pm-v3c-count pm-v3c-count-add">add</div>
      </div>
    </div>
  );
}

// ============================================================
// V3d · Stamp + perforated tag — count rides on a small ticket
// stub attached to the bottom edge of the stamp by perforation
// ============================================================
function V3d() {
  return (
    <div className="pm-reactions pm-v3d">
      {REACTIONS.map((r, i) => (
        <button key={i}
          className={"pm-v3d-stamp " + (r.you ? 'you' : '')}
          style={{transform: `rotate(${ROT[i % ROT.length]}deg)`}}
          title={r.kind === 'custom' ? ':' + r.shortcode + ':' : r.name}>
          <span className="pm-v3d-head">
            <span className="pm-stamp-art">
              {r.kind === 'unicode'
                ? <span className="pm-emoji pm-v3d-emoji">{r.glyph}</span>
                : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={26}/>}
            </span>
          </span>
          <span className="pm-v3d-stub">{r.count}</span>
        </button>
      ))}
      <button className="pm-v3d-stamp pm-v3d-add" title="Add reaction"
        style={{transform: 'rotate(-0.6deg)'}}>
        <span className="pm-v3d-head">
          <span className="pm-stamp-art"><G.plus/></span>
        </span>
        <span className="pm-v3d-stub pm-v3d-stub-add">add</span>
      </button>
    </div>
  );
}

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="pm-page">
      <header className="pm-page-h">
        <div className="pm-kicker">{kicker}</div>
        <h1 className="pm-h1">{title}</h1>
        <p className="pm-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="pm-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="pm-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="pm-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Postmark stamp · refinements">
      <DCSection
        id="postmark"
        title="Postmark stamps — refining V3"
        subtitle="Four refinements of the V3 stamp idea, each shown inside a real thread context (ancestor + focused + reply). Fixes the original V3 issues: stamp paper now contrasts with the post panel, and the count is treated as its own element — either next to the stamp, on a postmark cancellation, on a caption row, or on a perforated ticket stub.">

        <DCArtboard id="v3a" label="V3a · ×N notation beside" width={680} height={780}>
          <Page
            kicker="V3a"
            title="Tinted paper · count beside (×N)"
            sub="Stamp is rendered on warm-cream paper that contrasts against the post panel. The count moves OUT of the stamp body and sits to its right on the baseline as a mono ×N notation. The stamp itself stays a pure emoji + perforation."
            cheat={{
              Paper: 'warm cream (#f3ead4) · darker than post panel',
              Count: 'outside · baseline-right · mono "×N"',
              Wins: 'cleanest stamp face · count reads naturally',
              Trade: 'wider per-reaction · ~5 fit per row',
            }}>
            <ThreadCtx><V3a/></ThreadCtx>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3b" label="V3b · cancellation postmark" width={680} height={780}>
          <Page
            kicker="V3b · AUTHENTIC"
            title="Cancellation postmark"
            sub="A small dark circular mark sits over the bottom-right of the stamp with the count printed inside — the way a postal cancellation marks a real stamp. Doubles as the count display and as the visual that says 'this stamp has been used.'"
            cheat={{
              Paper: 'warm cream · same as V3a',
              Count: 'inside circular cancellation postmark · bottom-right',
              Wins: 'most narrative · count integrates into the metaphor',
              Trade: 'small numerals · two-digit only',
            }}>
            <ThreadCtx><V3b/></ThreadCtx>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3c" label="V3c · letterpress caption ★" width={680} height={780}>
          <Page
            kicker="V3c · RECOMMENDED"
            title="Letterpress · count on its own line"
            sub="Higher-contrast paper ground (warm cream + soft inset shadow for depth). The count moves out from inside the perforated stamp to a discreet caption row below — small mono numerals, centered, with proper breathing room. Stamp face stays uncluttered."
            cheat={{
              Paper: 'warm cream + inset shadow · letterpress feel',
              Count: 'below stamp · centered mono · own row',
              Wins: 'roomy · stamp face stays pure · numbers legible',
              Trade: 'taller — adds ~14px below each stamp',
            }}>
            <ThreadCtx><V3c/></ThreadCtx>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3d" label="V3d · stamp + ticket stub" width={680} height={780}>
          <Page
            kicker="V3d · NOVEL"
            title="Stamp + perforated ticket stub"
            sub="The stamp face holds only the emoji; the count rides on a small ticket-stub attached to the bottom of the stamp by a row of perforations. Reads like a tear-off coupon or admission ticket. Two-piece composition makes it the most distinctive."
            cheat={{
              Paper: 'warm cream · stamp + darker stub',
              Count: 'on a perforated ticket stub attached below',
              Wins: 'distinctive object · clear count visibility',
              Trade: 'most chrome — only viable on focused post / detail view',
            }}>
            <ThreadCtx><V3d/></ThreadCtx>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v3c-themes"
        title="V3c · across every theme"
        subtitle="The recommended treatment (letterpress paper + count caption row below) rendered in all four PleromaNet themes — default cream, dusk, drive, and simoun — so we can confirm the warm-cream stamp paper still reads against the dark panels and that the count caption inherits the right theme-ink color.">

        <DCArtboard id="v3c-cream" label="V3c · cream (default)" width={680} height={780}>
          <div className="pm-theme-cream" style={{height: '100%'}}>
            <Page
              kicker="THEME · CREAM"
              title="Default · cream"
              sub="Baseline. Cream paper stamps sit on a slightly darker cream panel — gentlest contrast, but the perforation and the dashed inner frame carry the recognition."
              cheat={{Paper: 'warm cream stamp on cream panel'}}>
              <ThreadCtx><V3c/></ThreadCtx>
            </Page>
          </div>
        </DCArtboard>

        <DCArtboard id="v3c-dusk" label="V3c · dusk (purple)" width={680} height={780}>
          <div className="pm-theme-dusk" style={{height: '100%'}}>
            <Page
              kicker="THEME · DUSK"
              title="Dusk · twilight purple"
              sub="Cream paper stamps pop hard against the deep purple panel — exactly the sticky-notes-on-a-cork-board feel. 'You reacted' tints toward the dusk accent (pink) so it's findable without breaking the postal metaphor."
              cheat={{Paper: 'warm cream stamp · dark purple panel', 'You-tint': 'rose blend (theme accent)'}}>
              <ThreadCtx><V3c/></ThreadCtx>
            </Page>
          </div>
        </DCArtboard>

        <DCArtboard id="v3c-drive" label="V3c · drive (deep navy)" width={680} height={780}>
          <div className="pm-theme-drive" style={{height: '100%'}}>
            <Page
              kicker="THEME · DRIVE"
              title="Drive · midnight navy"
              sub="The darkest theme. Cream stamps glow against near-black panels — like physical objects under a desk lamp. Count caption in teal-ink stays subtle but legible. The strongest contrast of the four themes."
              cheat={{Paper: 'warm cream stamp · near-black panel', 'You-tint': 'teal blend (theme accent)'}}>
              <ThreadCtx><V3c/></ThreadCtx>
            </Page>
          </div>
        </DCArtboard>

        <DCArtboard id="v3c-simoun" label="V3c · simoun (orange/navy)" width={680} height={780}>
          <div className="pm-theme-simoun" style={{height: '100%'}}>
            <Page
              kicker="THEME · SIMOUN"
              title="Simoun · sunset orange"
              sub="Warm cream stamps on a navy panel with orange accents — the closest in mood to the cream theme, but with stronger panel contrast. 'You reacted' tints toward the simoun orange accent."
              cheat={{Paper: 'warm cream stamp · navy panel', 'You-tint': 'orange blend (theme accent)'}}>
              <ThreadCtx><V3c/></ThreadCtx>
            </Page>
          </div>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="v3c-themes-duo"
        title="V3c · with duotone overlay"
        subtitle="Same V3c stamps as above, but each one gets the theme's duotone SVG filter applied — the same filter we already run over photo attachments. The stamps stop reading as 'warm cream paper objects' and start reading as part of the theme — toned-down, less prominent. The caption row stays outside the filter so the count text remains crisp.">

        <DCArtboard id="v3c-cream-duo" label="V3c · cream + duotone" width={680} height={780}>
          <div className="pm-theme-cream pm-duo" style={{height: '100%'}}>
            <Page
              kicker="THEME · CREAM · DUOTONE"
              title="Cream · with duotone overlay"
              sub="Cream's duotone tones the stamps to the warm-ink → lilac mood. Already subtle on cream; the duotone makes them feel like part of the same printed sheet rather than separate stickers."
              cheat={{Filter: 'url(#duotoneCream)', Result: 'warm-ink / lilac stamps'}}>
              <ThreadCtx><V3c/></ThreadCtx>
            </Page>
          </div>
        </DCArtboard>

        <DCArtboard id="v3c-dusk-duo" label="V3c · dusk + duotone" width={680} height={780}>
          <div className="pm-theme-dusk pm-duo" style={{height: '100%'}}>
            <Page
              kicker="THEME · DUSK · DUOTONE"
              title="Dusk · with duotone overlay"
              sub="Dusk's duotone takes the cream stamps into deep purple → soft pink. No more 'sticky notes glowing on a corkboard' — instead the stamps recede into the panel mood. Same vocabulary as photos in this theme."
              cheat={{Filter: 'url(#duotoneDusk)', Result: 'purple / pink stamps'}}>
              <ThreadCtx><V3c/></ThreadCtx>
            </Page>
          </div>
        </DCArtboard>

        <DCArtboard id="v3c-drive-duo" label="V3c · drive + duotone" width={680} height={780}>
          <div className="pm-theme-drive pm-duo" style={{height: '100%'}}>
            <Page
              kicker="THEME · DRIVE · DUOTONE"
              title="Drive · with duotone overlay"
              sub="Drive's duotone tones the stamps to deep navy → cyan/teal. The biggest shift — cream paper becomes a cold teal/navy sticker. Pairs with the photo attachments in this theme."
              cheat={{Filter: 'url(#duotoneDrive)', Result: 'navy / teal stamps'}}>
              <ThreadCtx><V3c/></ThreadCtx>
            </Page>
          </div>
        </DCArtboard>

        <DCArtboard id="v3c-simoun-duo" label="V3c · simoun + duotone" width={680} height={780}>
          <div className="pm-theme-simoun pm-duo" style={{height: '100%'}}>
            <Page
              kicker="THEME · SIMOUN · DUOTONE"
              title="Simoun · with duotone overlay"
              sub="Simoun's duotone takes the cream stamps into navy → ember orange. The stamps catch the sunset orange of the theme accent — the 'you' tint stays distinct because it's applied AFTER the duotone."
              cheat={{Filter: 'url(#duotoneSimoun)', Result: 'navy / orange stamps'}}>
              <ThreadCtx><V3c/></ThreadCtx>
            </Page>
          </div>
        </DCArtboard>

      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
