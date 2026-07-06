/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */

// ============================================================
// Emoji-reaction variants
// Same set of 6 reactions in every variant — mix of unicode
// emoji and custom-emoji PNGs (mocked here as small gradient
// sticker placeholders, since the real ones would be 24px PNGs
// pulled from the instance's emoji manifest).
// ============================================================

// ---------- Reaction dataset ----------
const REACTIONS = [
  { kind: 'unicode',  glyph: '❤️',  count: 24, you: true,  name: 'red heart' },
  { kind: 'custom',   shortcode: 'pleromasummer', count: 18, you: false, swatch: 'cx-summer' },
  { kind: 'unicode',  glyph: '🔥',  count: 12, you: false, name: 'fire' },
  { kind: 'custom',   shortcode: 'blobcat',        count: 9,  you: false, swatch: 'cx-blobcat' },
  { kind: 'unicode',  glyph: '😂',  count: 6,  you: false, name: 'face with tears of joy' },
  { kind: 'custom',   shortcode: 'catshrug',       count: 3,  you: false, swatch: 'cx-shrug' },
];

// ---------- Custom-emoji placeholder ----------
// Stands in for a 24×24 PNG. The real component would receive
// {src, alt, shortcode} from the instance's emoji manifest.
function CustomEmoji({ swatch, shortcode, size = 18 }) {
  return (
    <span
      className={"rv-cx " + swatch}
      style={{width: size, height: size}}
      title={':' + shortcode + ':'}>
      <span className="rv-cx-i" style={{fontSize: Math.max(7, Math.floor(size * 0.4))}}>
        {shortcode.slice(0, 2)}
      </span>
    </span>
  );
}

// ---------- Glyph helpers ----------
const G = {
  plus: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="11" height="11" {...p}><path d="M8 3v10M3 8h10"/></svg>,
  smile: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" {...p}><circle cx="8" cy="8" r="6"/><path d="M5.5 10c.7.8 1.5 1.2 2.5 1.2s1.8-.4 2.5-1.2"/><circle cx="6" cy="6.8" r=".6" fill="currentColor" stroke="none"/><circle cx="10" cy="6.8" r=".6" fill="currentColor" stroke="none"/></svg>,
};

// ---------- Page wrapper ----------
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="rv-page">
      <header className="rv-page-h">
        <div className="rv-kicker">{kicker}</div>
        <h1 className="rv-h1">{title}</h1>
        <p className="rv-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="rv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="rv-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="rv-page-body">
        <div className="rv-postwrap">
          <div className="rv-post-body">
            anyone else feel like the slow web is the only web worth defending? it&apos;s the one place where you can still see the seams.
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Renders a small "post action bar" stub under the reactions so the row
// has visual context (otherwise it floats untethered).
function PostActionsStub() {
  return (
    <div className="rv-actionbar">
      <span>↩ 4</span>
      <span>↻ 7</span>
      <span>★ 5</span>
    </div>
  );
}

// ============================================================
// V0 · Baseline (current Pleroma)
// ============================================================
function V0() {
  return (
    <>
      <div className="rv-v0 rv-reactions">
        {REACTIONS.map((r, i) => (
          <button key={i} className={"rv-v0-chip " + (r.you ? 'you' : '')}>
            {r.kind === 'unicode'
              ? <span className="rv-emoji">{r.glyph}</span>
              : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={20}/>}
            <span className="rv-v0-count">{r.count}</span>
          </button>
        ))}
        <button className="rv-v0-add" title="Add reaction">+</button>
      </div>
      <PostActionsStub/>
    </>
  );
}

// ============================================================
// V1 · Mono rail — PleromaNet-refined baseline
// ============================================================
function V1() {
  return (
    <>
      <div className="rv-v1 rv-reactions">
        {REACTIONS.map((r, i) => (
          <button key={i} className={"rv-v1-chip " + (r.you ? 'you' : '')}>
            {r.kind === 'unicode'
              ? <span className="rv-emoji">{r.glyph}</span>
              : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={18}/>}
            <span className="rv-v1-count">{r.count}</span>
          </button>
        ))}
        <button className="rv-v1-add" title="Add reaction"><G.plus/></button>
      </div>
      <PostActionsStub/>
    </>
  );
}

// ============================================================
// V2 · Stacked count — emoji-forward, count tucked in corner
// ============================================================
function V2() {
  return (
    <>
      <div className="rv-v2 rv-reactions">
        {REACTIONS.map((r, i) => (
          <button key={i} className={"rv-v2-tile " + (r.you ? 'you' : '')}>
            {r.kind === 'unicode'
              ? <span className="rv-emoji rv-v2-emoji">{r.glyph}</span>
              : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={26}/>}
            <span className="rv-v2-count">{r.count}</span>
          </button>
        ))}
        <button className="rv-v2-add" title="Add reaction"><G.smile/></button>
      </div>
      <PostActionsStub/>
    </>
  );
}

// ============================================================
// V3 · Postmark stamps — perforated edge + caption + jitter
// ============================================================
function V3() {
  const rot = [-1.6, 1.2, -0.7, 1.8, -1.3, 0.6];
  return (
    <>
      <div className="rv-v3 rv-reactions">
        {REACTIONS.map((r, i) => (
          <button key={i}
            className={"rv-v3-stamp " + (r.you ? 'you' : '')}
            style={{transform: `rotate(${rot[i % rot.length]}deg)`}}
            title={r.kind === 'custom' ? ':' + r.shortcode + ':' : r.name}>
            <span className="rv-v3-perf"/>
            <span className="rv-v3-art">
              {r.kind === 'unicode'
                ? <span className="rv-emoji rv-v3-emoji">{r.glyph}</span>
                : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={26}/>}
            </span>
            <span className="rv-v3-count">×{r.count}</span>
          </button>
        ))}
        <button className="rv-v3-add" title="Add reaction">
          <span className="rv-v3-perf"/>
          <span className="rv-v3-art"><G.plus/></span>
          <span className="rv-v3-count">add</span>
        </button>
      </div>
      <PostActionsStub/>
    </>
  );
}

// ============================================================
// V4 · Margin notes — typographic, no chips
// ============================================================
function V4() {
  return (
    <>
      <div className="rv-v4 rv-reactions">
        <span className="rv-v4-prefix">reactions</span>
        {REACTIONS.map((r, i) => (
          <button key={i} className={"rv-v4-item " + (r.you ? 'you' : '')}>
            {r.kind === 'unicode'
              ? <span className="rv-emoji">{r.glyph}</span>
              : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={16}/>}
            <span className="rv-v4-count">{r.count}</span>
          </button>
        ))}
        <button className="rv-v4-add" title="Add reaction">
          <G.plus/><span>add</span>
        </button>
      </div>
      <PostActionsStub/>
    </>
  );
}

// ============================================================
// V5 · Avatar overlay — reactions show who reacted
// ============================================================
const REACTOR_AVS = [
  // {avClass: '…', name: '…'} stand-ins, just the av-classes
  'av-grad-1', 'av-grad-2', 'av-orb', 'av-pixel-pc', 'av-grad-3',
];
function V5() {
  return (
    <>
      <div className="rv-v5 rv-reactions">
        {REACTIONS.map((r, i) => {
          // pick a slice of avatar swatches for this reaction
          const avs = REACTOR_AVS.slice(0, Math.min(3, r.count));
          return (
            <button key={i} className={"rv-v5-chip " + (r.you ? 'you' : '')}>
              <span className="rv-v5-glyph">
                {r.kind === 'unicode'
                  ? <span className="rv-emoji">{r.glyph}</span>
                  : <CustomEmoji swatch={r.swatch} shortcode={r.shortcode} size={20}/>}
              </span>
              <span className="rv-v5-avstack">
                {avs.map((a, j) => (
                  <span key={j} className={"rv-v5-av " + a}/>
                ))}
                {r.count > avs.length && (
                  <span className="rv-v5-more">+{r.count - avs.length}</span>
                )}
              </span>
            </button>
          );
        })}
        <button className="rv-v5-add" title="Add reaction"><G.plus/></button>
      </div>
      <PostActionsStub/>
    </>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Emoji reactions — directions">
      <DCSection
        id="reactions"
        title="Emoji reactions — chips, stamps, marginalia"
        subtitle="Pleroma posts can carry unicode emoji + per-instance custom emoji (small PNGs from the server's emoji manifest). The current chips are functional but generic — six directions for how to render the row, all with the same 6-reaction test set. ❤ is the viewer's reaction in every variant; the three custom emoji are mocked as gradient stickers (think small PNGs).">

        <DCArtboard id="v0" label="V0 · baseline (today)" width={700} height={440}>
          <Page
            kicker="V0 · BASELINE"
            title="Current Pleroma"
            sub="Plain light-grey pill, ~36px tall, emoji on the left and the count on the right. Functional but visually identical to every other Mastodon-flavored client; the custom emoji feel cropped into a uniform grey container."
            cheat={{
              Shape: 'Light grey pill · emoji + count',
              'You-reacted': 'Same chip, no state',
              Issues: 'Generic · custom emoji boxed-in · no character',
            }}>
            <V0/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v1" label="V1 · mono rail (PleromaNet-refined)" width={700} height={440}>
          <Page
            kicker="V1 · SAFE"
            title="Mono rail · PleromaNet baseline"
            sub="Same compact pill, dressed in PleromaNet tokens: panel-2 background, hair-line border, mono tabular count, accent-soft fill + accent-ink stroke for the chip you reacted to. The ✚ add-reaction button is a dashed ghost pill at the end."
            cheat={{
              Shape: '24px pill · mono count · ghost border',
              You: 'accent-soft fill · accent border · accent-ink count',
              Add: 'Dashed ghost ✚ at end',
              Best: 'Lowest risk; matches the existing action bar',
            }}>
            <V1/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v2" label="V2 · stacked count" width={700} height={440}>
          <Page
            kicker="V2 · EMOJI-FORWARD"
            title="Stacked count"
            sub="The emoji becomes the visual anchor at 26px — count tucks into the bottom-right corner as a tiny mono badge. The chip is essentially a 32px-square cell. Best for posts with lots of reactions because each one is visually distinct at scan distance."
            cheat={{
              Shape: '32px square cell · 26px emoji · count in corner',
              You: 'Accent ring around the tile',
              Add: '😊 face button',
              Best: 'Dense reaction rows (8+ reactions)',
            }}>
            <V2/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3" label="V3 · postmark stamps ★" width={700} height={500}>
          <Page
            kicker="V3 · DISTINCTIVE"
            title="Postmark stamps"
            sub="Each reaction is treated like a small postage stamp: dashed perforated edge, slight rotation jitter (±2°), emoji centered, the count as ×N typeset beneath. The custom-emoji shortcode shows on hover. Leans hard into the PleromaNet postcard / slow-web aesthetic — a reaction feels like a thing someone placed on the post."
            cheat={{
              Shape: '34×42px stamp · dashed perimeter · slight rotation',
              You: 'Filled accent ground · ink count',
              Custom: 'Shortcode (e.g. :blobcat:) on hover',
              Best: 'Brand-defining; turns reactions into objects',
              Trade: 'Tallest of the variants · max ~8 fit per row',
            }}>
            <V3/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4" label="V4 · margin notes" width={700} height={440}>
          <Page
            kicker="V4 · QUIET"
            title="Margin notes"
            sub="No chip chrome at all — just the emoji followed by a small mono count, separated by gentle ·-dots, prefixed by a faded 'reactions' label. Reads as marginalia / annotation rather than UI. The lightest possible treatment, almost decorative."
            cheat={{
              Shape: 'No chip · emoji + mono count · ·-separated',
              You: 'accent-ink count + underline',
              Add: 'Inline ✚ add button',
              Best: 'Quiet feeds; posts with 1–4 reactions',
              Trade: 'Less tappable; can get visually cluttered past 6',
            }}>
            <V4/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v5" label="V5 · avatar overlay" width={780} height={460}>
          <Page
            kicker="V5 · SOCIAL PROOF"
            title="Avatar-overlay reactions"
            sub="Each reaction chip shows the emoji and a stack of the first ~3 reactor avatars, with a +N tail if there are more. You see who reacted at a glance — the closest thing to a 'seen by' affordance. Most info-dense; widest chips."
            cheat={{
              Shape: 'Pill · emoji + 3-avatar stack + +N tail',
              You: 'accent-soft fill · accent border',
              Wins: 'Tells you WHO reacted, not just how many',
              Trade: 'Wider · maxes out around 4–5 reactions per row',
              'API need': 'Each reaction needs first-N reactor handles',
            }}>
            <V5/>
          </Page>
        </DCArtboard>

      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
