/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState } = React;

// ============================================================
// Boost / repeated post variants
// All variants render the same boosted post: FiestaBun shares
// "the algorithm doesn't care about you" — the canonical retweet
// of the slow-web feed. V3 also stacks multiple repeaters.
// ============================================================

const BOOSTED = {
  name: 'soft.hertz',
  handle: '@soft.hertz@kolektiva.social',
  avClass: 'av-grad-3',
  time: '3h',
  body: "the algorithm doesn't care about you. the timeline doesn't either. but the people in it do, and that's worth keeping.",
  attachments: [],
  replies: 8, boosts: 34, favs: 142,
};

const REPEATER = {
  name: 'FiestaBun',
  handle: '@FiestaBun@decayable.ink',
  avClass: 'av-pixel-pc',
  time: '35m',
};

const MULTI_REPEATERS = [
  { name: 'FiestaBun', handle: '@FiestaBun@decayable.ink', avClass: 'av-pixel-pc' },
  { name: 'orbit',     handle: '@orbit@spacebear.net',     avClass: 'av-orb' },
  { name: 'datagram',  handle: '@datagram@retro.social',   avClass: 'av-pixel-pc' },
  { name: 'kestrel',   handle: '@kestrel@audio.garden',    avClass: 'av-grad-3' },
];

// ---------- Inline glyphs ----------
const G = {
  boost:   (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" {...p}><path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5"/></svg>,
  boostSm: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" {...p}><path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5"/></svg>,
  boostTiny:(p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="9" height="9" {...p}><path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5"/></svg>,
  reply:   (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
  star:    (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" width="14" height="14" {...p}><path d="M8 2l1.7 3.9 4.3.4-3.2 2.9.9 4.2L8 11.2 4.3 13.4l.9-4.2L2 6.3l4.3-.4L8 2z"/></svg>,
  more:    (p) => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" {...p}><circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12" cy="8" r="1.3"/></svg>,
};

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="bv-page">
      <header className="bv-page-h">
        <div className="bv-kicker">{kicker}</div>
        <h1 className="bv-h1">{title}</h1>
        <p className="bv-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="bv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="bv-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="bv-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// Shared post body — the actual boosted post
// ============================================================
function BoostedPostBody() {
  return (
    <article className="bv-post">
      <div className={"bv-post-av " + BOOSTED.avClass}/>
      <div className="bv-post-right">
        <header className="bv-post-head">
          <span className="bv-post-name">{BOOSTED.name}</span>
          <span className="bv-post-handle">{BOOSTED.handle}</span>
          <span className="bv-post-time">{BOOSTED.time}</span>
        </header>
        <div className="bv-post-body">{BOOSTED.body}</div>
        <div className="bv-post-actions">
          <button className="bv-post-action"><G.reply/><span>{BOOSTED.replies}</span></button>
          <button className="bv-post-action boost on"><G.boost/><span>{BOOSTED.boosts + 1}</span></button>
          <button className="bv-post-action"><G.star/><span>{BOOSTED.favs}</span></button>
          <button className="bv-post-action" style={{marginLeft: 'auto'}}><G.more/></button>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// V0 · Current Pleroma
// ============================================================
function V0() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v0-header">
        <div className={"bv-v0-av " + REPEATER.avClass}/>
        <div className="bv-v0-text">
          <span className="bv-v0-name">{REPEATER.name}</span>
          <span className="bv-v0-handle">{REPEATER.handle}</span>
          <span className="bv-v0-arrow"><G.boostSm/></span>
          <span className="bv-v0-label">repeated</span>
        </div>
      </div>
      <BoostedPostBody/>
    </div>
  );
}

// ============================================================
// V1 · Compact attribution chip ★
// ============================================================
function V1() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v1-chip">
        <G.boostTiny/>
        <span className="bv-v1-chip-by">{REPEATER.name}</span>
        <span className="bv-v1-chip-handle">{REPEATER.handle}</span>
        <span className="bv-v1-chip-label">boosted · 35min</span>
      </div>
      <BoostedPostBody/>
    </div>
  );
}

// ============================================================
// V2 · Avatar-inline attribution
// ============================================================
function V2() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v2-attr">
        <G.boostSm/>
        <span className={"bv-mini-av " + REPEATER.avClass}/>
        <span className="bv-v2-attr-name">{REPEATER.name}</span>
        <span className="bv-v2-attr-handle">{REPEATER.handle}</span>
        <span className="bv-v2-attr-label">boosted</span>
        <span className="bv-v2-attr-time">35min</span>
      </div>
      <BoostedPostBody/>
    </div>
  );
}

// ============================================================
// V3 · Multi-boost avatar stack
// ============================================================
function V3() {
  const visible = MULTI_REPEATERS.slice(0, 3);
  const overflow = MULTI_REPEATERS.length - 1;
  return (
    <div className="bv-postwrap">
      <div className="bv-v3-row">
        <G.boostSm/>
        <span className="bv-v3-avstack">
          {visible.map((r, i) => (
            <span key={i} className={"bv-mini-av " + r.avClass}/>
          ))}
        </span>
        <span className="bv-v3-name">{MULTI_REPEATERS[0].name}</span>
        <span className="bv-v3-and">and</span>
        <button className="bv-v3-count">+{overflow} others</button>
        <span className="bv-v3-label">boosted</span>
        <span className="bv-v3-time">35min</span>
      </div>
      <BoostedPostBody/>
    </div>
  );
}

// ============================================================
// V4 · Left-rail attribution
// ============================================================
function V4() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v4-grid">
        <div className="bv-v4-rail">
          <div className="bv-v4-rail-line"/>
          <div className="bv-v4-rail-avwrap">
            <div className={"bv-v4-rail-av " + REPEATER.avClass}/>
            <div className="bv-v4-rail-icon"><G.boostTiny/></div>
          </div>
          <div className="bv-v4-rail-meta">
            <span className="bv-v4-rail-name">{REPEATER.name}</span>
            boosted · 35m
          </div>
        </div>
        <div className="bv-v4-postcol">
          <BoostedPostBody/>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V4a · Tinted rail — soft-green column, no line
// ============================================================
function V4a() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v4-grid-wide">
        <div className="bv-v4a-rail">
          <div className="bv-v4a-icon"><G.boostSm/></div>
          <div className={"bv-v4a-av " + REPEATER.avClass}/>
          <div className="bv-v4a-name">{REPEATER.name}</div>
          <div className="bv-v4a-time">35m</div>
        </div>
        <div className="bv-v4-postcol-wide">
          <BoostedPostBody/>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V4b · No-line minimal — avatar + corner badge + caption only
// ============================================================
function V4b() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v4-grid-wide">
        <div className="bv-v4b-rail">
          <div className="bv-v4b-avwrap">
            <div className={"bv-v4b-av " + REPEATER.avClass}/>
            <div className="bv-v4b-badge"><G.boostTiny/></div>
          </div>
          <div className="bv-v4b-meta">
            <span className="bv-v4b-name">{REPEATER.name}</span>
            boosted · 35m
          </div>
        </div>
        <div className="bv-v4-postcol-wide">
          <BoostedPostBody/>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V4c · Vertical rotated label — thin rail
// ============================================================
function V4c() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v4-grid-thin">
        <div className="bv-v4c-rail">
          <div className={"bv-v4c-av " + REPEATER.avClass}/>
          <div className="bv-v4c-label">
            boosted by <b>{REPEATER.name}</b> · 35m
          </div>
        </div>
        <div className="bv-v4-postcol-thin">
          <BoostedPostBody/>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V4d · Quote-bar — accent-green left edge, tag pill on top
// ============================================================
function V4d() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v4d-grid">
        <div className="bv-v4d-rail">
          <span className="bv-v4d-tag"><G.boostTiny/>boost</span>
          <div className={"bv-v4d-av " + REPEATER.avClass}/>
          <div className="bv-v4d-name">{REPEATER.name}</div>
          <div className="bv-v4d-time">35m</div>
        </div>
        <div className="bv-v4d-postcol">
          <BoostedPostBody/>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V4e · Quote-bar TOP — accent left edge + attribution row on top
// Same green left edge as V4d, but the attribution moves to a
// horizontal row at the top of the post (full width for long names).
// ============================================================
function V4e({ repeater = REPEATER }) {
  return (
    <div className="bv-postwrap">
      <div className="bv-v4e">
        <div className="bv-v4e-attr">
          <span className="bv-v4e-tag"><G.boostTiny/>boost</span>
          <span className={"bv-mini-av " + repeater.avClass}/>
          <span className="bv-v4e-name">{repeater.name}</span>
          <span className="bv-v4e-handle">{repeater.handle}</span>
          <span className="bv-v4e-time">35m</span>
        </div>
        <div className="bv-v4e-postcol">
          <BoostedPostBody/>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V4f · Tinted top banner — full-width green-tinted bar,
// tag pill + avatar + name + handle + time. No left edge.
// ============================================================
function V4f({ repeater = REPEATER }) {
  return (
    <div className="bv-postwrap">
      <div className="bv-v4f-banner">
        <span className="bv-v4f-tag"><G.boostTiny/>boost</span>
        <span className={"bv-mini-av " + repeater.avClass}/>
        <span className="bv-v4f-name">{repeater.name}</span>
        <span className="bv-v4f-handle">{repeater.handle}</span>
        <span className="bv-v4f-time">35m</span>
      </div>
      <BoostedPostBody/>
    </div>
  );
}

// ============================================================
// V4g · Corner-tab marker — a green tab sticks out of the
// top-left like a bookmark/folder tab, with a thin attribution
// row beneath. Distinctive without consuming a full rail.
// ============================================================
function V4g({ repeater = REPEATER }) {
  return (
    <div className="bv-postwrap bv-v4g-wrap">
      <div className="bv-v4g-tab">
        <G.boostTiny/>
        <span>BOOST</span>
      </div>
      <div className="bv-v4g-attr">
        <span className={"bv-mini-av " + repeater.avClass}/>
        <span className="bv-v4g-name">{repeater.name}</span>
        <span className="bv-v4g-handle">{repeater.handle}</span>
        <span className="bv-v4g-time">35m</span>
      </div>
      <BoostedPostBody/>
    </div>
  );
}

// ============================================================
// V4h · Top quote-bar — green stripe runs across the top
// instead of down the side (mirror of V4d). Tag pill anchored
// at top-left, attribution row below.
// ============================================================
function V4h({ repeater = REPEATER }) {
  return (
    <div className="bv-postwrap bv-v4h-wrap">
      <div className="bv-v4h-stripe">
        <span className="bv-v4h-tag"><G.boostTiny/>boost</span>
      </div>
      <div className="bv-v4h-attr">
        <span className={"bv-mini-av " + repeater.avClass}/>
        <span className="bv-v4h-name">{repeater.name}</span>
        <span className="bv-v4h-handle">{repeater.handle}</span>
        <span className="bv-v4h-time">35m</span>
      </div>
      <BoostedPostBody/>
    </div>
  );
}

// ============================================================
// V5 · Boost-as-quote-card (wildcard)
// The repeater is the outer post author; the boosted post is
// embedded as a smart-card. Allows the booster to add commentary.
// ============================================================
function V5() {
  return (
    <div className="bv-postwrap">
      <div className="bv-v5-outer">
        <div className={"bv-post-av " + REPEATER.avClass}/>
        <div className="bv-post-right">
          <header className="bv-v5-head">
            <span className="bv-v5-name">{REPEATER.name}</span>
            <span className="bv-v5-handle">{REPEATER.handle}</span>
            <span className="bv-v5-time">{REPEATER.time}</span>
          </header>
          <div className="bv-v5-verb">
            <G.boostTiny/> boosted
          </div>
          <div className="bv-v5-comment">
            <em>worth re-reading once a week.</em>
          </div>
          <a className="bv-v5-card">
            <div className="bv-v5-body" style={{gridColumn: '1 / -1'}}>
              <div className="bv-v5-kicker">QUOTE · kolektiva.social</div>
              <div className="bv-v5-text">{BOOSTED.body}</div>
              <div className="bv-v5-attr">
                <span className={"bv-v5-attr-av " + BOOSTED.avClass}/>
                <span className="bv-v5-attr-name">{BOOSTED.name}</span>
                <span className="bv-post-handle">{BOOSTED.handle}</span>
                <span style={{marginLeft: 'auto'}}>· {BOOSTED.time}</span>
              </div>
              <div className="bv-v5-engagement">
                <span>↩ {BOOSTED.replies}</span>
                <span>↻ {BOOSTED.boosts}</span>
                <span>★ {BOOSTED.favs}</span>
                <span style={{marginLeft: 'auto', color: 'var(--accent-ink)'}}>view original →</span>
              </div>
            </div>
          </a>
          <div className="bv-post-actions">
            <button className="bv-post-action"><G.reply/><span>1</span></button>
            <button className="bv-post-action"><G.boost/><span>3</span></button>
            <button className="bv-post-action"><G.star/><span>12</span></button>
            <button className="bv-post-action" style={{marginLeft: 'auto'}}><G.more/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Boost / repeated post variants">
      <DCSection
        id="boosts"
        title="Boosts — how repeated posts surface in the feed"
        subtitle="Same boosted post in every artboard (soft.hertz on the slow web). V0 is the current Pleroma treatment. V3 demonstrates the multi-booster case the current pattern doesn't handle. V5 lets the booster add commentary, treating the boost as a quote.">

        <DCArtboard id="v0" label="V0 · current (the problem)" width={680} height={420}>
          <Page
            kicker="V0 · BASELINE"
            title="Current Pleroma"
            sub="Small avatar floats above the post on its own line, name + handle + green arrow + 'repeated'. The avatar is offset oddly from the post's avatar column, and the only attribution copy ('repeated') doesn't tell you when or by how many."
            cheat={{
              Shape: 'Offset 28px avatar · own row · arrow + verb',
              'Multi-boost': 'Not handled — would stack one above the other',
              Issues: 'Avatar alignment · no time · no count',
            }}>
            <V0/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v1" label="V1 · compact attribution ★" width={680} height={460}>
          <Page
            kicker="V1 · RECOMMENDED"
            title="Compact attribution chip"
            sub="A single mono-typed line above the post, indented to the body column. No avatar — just glyph + name + handle + verb + time. Matches the visual weight of a thread breadcrumb. Easy to scan past when reading; clear when you stop on it."
            cheat={{
              Shape: 'Single line · indented to body column · mono caption',
              Wins: 'No avatar alignment issues · scans fast · matches breadcrumb visual weight',
              Best: 'Default · most familiar pattern · least chrome',
            }}>
            <V1/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v2" label="V2 · avatar-inline attribution" width={680} height={440}>
          <Page
            kicker="V2"
            title="Avatar-inline attribution"
            sub="Same single line as V1, but adds a small (18px) avatar between the boost glyph and the name. Identifies the repeater visually without taking a new row. Time floats to the right."
            cheat={{
              Shape: 'Single line · 18px avatar inline · time on right',
              Wins: 'Visual identifier · same height as V1',
              Trade: 'Two tiny avatars on screen (booster + booted)',
            }}>
            <V2/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3" label="V3 · multi-boost stack" width={680} height={460}>
          <Page
            kicker="V3 · NEW CASE"
            title="Multi-boost · avatar stack"
            sub="When N people boost the same post, stack their mini-avatars (up to 3) followed by the first name, 'and', and a tappable '+N others' chip. Solves a case the current pattern can't: today, N boosts means N separate copies of the same post in your feed."
            cheat={{
              Shape: 'Stacked 20px avatars (up to 3) · first name · +N chip',
              Wins: 'Collapses duplicate posts · clear social proof',
              Trade: 'Requires server-side aggregation across boosts',
              'Pairs with': 'V1 (single-boost) — share the same row geometry',
            }}>
            <V3/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4" label="V4 · left-rail attribution" width={720} height={460}>
          <Page
            kicker="V4 · WILDCARD"
            title="Left-rail attribution"
            sub="The repeater's avatar moves to its own thin column on the left, linked by a faint stem-line to a small 'boosted' label. Mirrors the thread-line treatment used in replies — boosts feel like a sibling pattern, not a header."
            cheat={{
              Shape: '36px left column · stem-line · avatar + glyph + label',
              Wins: 'Visual cousin of the thread-line pattern · spatial separation',
              Trade: 'Narrows the post body · only fits in wider columns',
            }}>
            <V4/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v5" label="V5 · boost-as-quote (with comment)" width={680} height={620}>
          <Page
            kicker="V5 · QUOTE-BOOST"
            title="Boost-as-quote"
            sub="The repeater becomes the outer post author and can add commentary; the original is embedded as a smart-card (same primitive as quoted posts). Provides a place for the booster to say WHY they're boosting — the missing affordance in plain boosts."
            cheat={{
              Shape: 'Outer post (repeater) · embedded card (original)',
              Wins: 'Adds a comment slot · re-uses QuotedPost primitive',
              Trade: 'Heaviest treatment · taller · changes boost semantics',
              Best: 'When commentary matters (the "quote-tweet" case)',
            }}>
            <V5/>
          </Page>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="side-rail-explorations"
        title="V4 · side-rail explorations — avoiding the thread-line look"
        subtitle="The original V4 used a faint vertical stem-line that reads too much like the thread-connection line. Four alternate treatments that keep the side-column idea but differentiate it visually. Same boosted post throughout.">

        <DCArtboard id="v4a" label="V4a · tinted column" width={720} height={460}>
          <Page
            kicker="V4a"
            title="Tinted column"
            sub="Soft-green gradient fills the rail. Boost icon sits at the top, avatar + name + time stack below. No stem-line — the tint does the visual work. Reads as a 'lane' rather than a thread."
            cheat={{
              Shape: '96px tinted rail · gradient fill · no line',
              Wins: 'Clearly distinct from thread-line · uses color to signal',
              Trade: 'Adds a green column to the feed visual rhythm',
            }}>
            <V4a/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4b" label="V4b · minimal · avatar + badge" width={720} height={460}>
          <Page
            kicker="V4b · MINIMAL"
            title="No-line minimal"
            sub="Just the avatar with a corner boost-badge, name, and a small caption. No fill, no line. The column separator alone does the work. Quietest of the side-rail treatments."
            cheat={{
              Shape: '96px rail · avatar+badge + caption · no decoration',
              Wins: 'Lowest visual weight · cleanest in a busy feed',
              Trade: 'Easiest to scan past — could be too subtle',
            }}>
            <V4b/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4c" label="V4c · vertical rotated label" width={720} height={460}>
          <Page
            kicker="V4c · WILDCARD"
            title="Vertical rotated label"
            sub="Thin 42px rail with a rotated mono caption running up the side: 'BOOSTED BY FIESTABUN · 35M'. Small avatar at the top. Very distinct, reads like a printed-magazine sidebar — and impossible to confuse with the thread-line."
            cheat={{
              Shape: '42px thin rail · rotated mono label',
              Wins: 'Visually striking · zero confusion with threads',
              Trade: 'Novel pattern · vertical text harder to scan',
              Best: 'Brand-leaning · matches the typographic vaporwave aesthetic',
            }}>
            <V4c/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4d" label="V4d · quote-bar" width={720} height={460}>
          <Page
            kicker="V4d"
            title="Accent quote-bar"
            sub="A thick accent-green left edge on the rail, with a small 'boost' tag pill at the top. Avatar + name + time below. Borrows the blockquote / margin-note pattern. Clear semantic signal: 'this is a boosted post.'"
            cheat={{
              Shape: '72px rail · 4px good-color left edge · tag pill',
              Wins: 'Familiar blockquote pattern · strong semantic signal',
              Trade: 'Bold left edge consumes more visual weight',
            }}>
            <V4d/>
          </Page>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="top-attribution"
        title="V4d · top-attribution explorations — same green strip, more name room"
        subtitle="V4d's side rail is tight when names run long. These four keep the green-strip visual distinction (the part that makes V4d feel different from a thread) but move attribution to a horizontal row, so any-length name fits comfortably. Each artboard shows the SHORT name first, then the same variant with a long handle (BernadetteFromMontréal@too.many.subdomains.dev) so you can see how each holds up.">

        <DCArtboard id="v4e" label="V4e · left edge + top attribution row" width={720} height={520}>
          <Page
            kicker="V4e · RECOMMENDED"
            title="Left edge + top attribution row"
            sub="Keeps V4d's accent-green left edge running the full height (the visual hook), but the attribution becomes a single horizontal row at the top. Tag pill anchors the left, then mini-avatar, name, handle, time. Name has the whole row to breathe."
            cheat={{
              Shape: '4px good-color left edge · top attribution row · pill + name + handle + time',
              Wins: 'Keeps green-strip distinction · room for any name length · less chrome than V4d',
              Trade: 'No avatar prominence — the booster is a label, not a column',
            }}>
            <V4e/>
            <div style={{height: 12}}/>
            <V4e repeater={{ name: 'BernadetteFromMontréal', handle: '@bernadette@too.many.subdomains.dev', avClass: 'av-pixel-pc' }}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4f" label="V4f · tinted top banner" width={720} height={520}>
          <Page
            kicker="V4f"
            title="Tinted top banner"
            sub="A full-width green-tinted strip sits above the post. Tag pill + mini avatar + name + handle + time, left-aligned. The tint replaces the left edge as the green-strip visual signal. Cleanest top-attribution treatment."
            cheat={{
              Shape: 'Full-width green-tinted top banner · pill + avatar + name + handle + time',
              Wins: 'Maximum name room · clear horizontal reading order',
              Trade: 'Heavier than V4e (full bar of green tint vs. 4px edge)',
            }}>
            <V4f/>
            <div style={{height: 12}}/>
            <V4f repeater={{ name: 'BernadetteFromMontréal', handle: '@bernadette@too.many.subdomains.dev', avClass: 'av-pixel-pc' }}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4g" label="V4g · corner-tab marker" width={720} height={520}>
          <Page
            kicker="V4g · DISTINCTIVE"
            title="Corner-tab marker"
            sub="A small green 'BOOST' tab sticks out of the top-left corner like a magazine bookmark or folder index tab. Attribution row below uses the panel background — no banner, no left edge. The tab alone does the green-strip job."
            cheat={{
              Shape: 'Top-left green tab · attribution row · no rail, no banner',
              Wins: 'Least chrome that still has the green-strip signal · clearly novel',
              Trade: 'Tab overhangs the card top — needs the right margin in dense feeds',
            }}>
            <V4g/>
            <div style={{height: 12}}/>
            <V4g repeater={{ name: 'BernadetteFromMontréal', handle: '@bernadette@too.many.subdomains.dev', avClass: 'av-pixel-pc' }}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4h" label="V4h · top quote-bar (mirrored V4d)" width={720} height={520}>
          <Page
            kicker="V4h"
            title="Top quote-bar (mirrored V4d)"
            sub="Literally V4d rotated 90°: the 4px accent-green edge runs across the TOP of the post instead of down the side. Tag pill hangs off the stripe, attribution row below. Closest sibling to V4d — same vocabulary, different axis."
            cheat={{
              Shape: '4px good-color top edge · tag pill on stripe · attribution row below',
              Wins: 'Strongest visual continuity with V4d · room for any name length',
              Trade: 'Adds a stripe to the top of every boost — could read busy stacked in a feed',
            }}>
            <V4h/>
            <div style={{height: 12}}/>
            <V4h repeater={{ name: 'BernadetteFromMontréal', handle: '@bernadette@too.many.subdomains.dev', avClass: 'av-pixel-pc' }}/>
          </Page>
        </DCArtboard>

      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
