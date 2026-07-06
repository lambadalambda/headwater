/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState } = React;

// ============================================================
// Reply-indicator variants
// All five variants render the same post: orbit replied directly to
// gridwave inside a thread that also addressed @datagram and @nyan.
// The body itself contains an inline @-mention (@soft.hertz) which
// is independent of the address pile-up at the top of a fediverse reply.
// ============================================================

const POST = {
  name: 'orbit',
  handle: '@orbit@spacebear.net',
  avClass: 'av-orb',
  time: '20m',
  body: "around the time the algorithm replaced the timeline. agreed with @datagram — the slow web feels possible again. tagging @soft.hertz too, this was your point yesterday.",
  // The first addressee is, by fediverse convention, the post being directly
  // replied to. The rest are inherited from the thread.
  parent: { handle: '@gridwave', name: 'gridwave', avClass: 'av-pixel-pc' },
  cc: [
    { handle: '@datagram', name: 'datagram' },
    { handle: '@nyan',     name: 'nyan.binary' },
    { handle: '@soft.hertz', name: 'soft.hertz' },
  ],
};

// ============================================================
// Inline glyphs (kept local — no Icons import in variant files)
// ============================================================
const Glyph = {
  reply: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
  replyTiny: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="9" height="9" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
};

// ============================================================
// Body renderer — parses @-mentions inline (mirrors PostBody)
// ============================================================
const MENTION_RE = /@[\w.]+/g;
function renderBody(text) {
  const out = [];
  let last = 0, m, k = 0;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<a key={"m" + k++} style={{color: 'var(--accent-ink)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: '13px'}}>{m[0]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// ============================================================
// Shared shell — everything that's the same across all variants
// children = the reply-indicator treatment for this variant
// position = 'aboveBody' | 'belowBody' (default)
// ============================================================
function Shell({ children, position = 'belowBody' }) {
  return (
    <article className="rv-post">
      <div className={"rv-av " + POST.avClass}/>
      <div className="rv-right">
        <header className="rv-head">
          <span className="rv-name">{POST.name}</span>
          <span className="rv-handle">{POST.handle}</span>
          <span className="rv-time">{POST.time}</span>
        </header>
        {position === 'aboveBody' && children}
        <div className="rv-body">{renderBody(POST.body)}</div>
        {position === 'belowBody' && children}
        <footer className="rv-foot">
          <button className="rv-act">↩ 0</button>
          <button className="rv-act">↻ 5</button>
          <button className="rv-act">★ 22</button>
          <button className="rv-act rv-act-end">⋯</button>
        </footer>
      </div>
    </article>
  );
}

// ============================================================
// V0 · Baseline — current PleromaNet post-pinged pattern.
// All addressees rendered as identical chips. No reply signal.
// ============================================================
function V0() {
  const all = [POST.parent, ...POST.cc];
  return (
    <Shell>
      <div className="rv-v0-pinged">
        <span className="rv-v0-l">Pinged</span>
        {all.map(a => <a key={a.handle} className="rv-v0-chip">{a.handle}</a>)}
      </div>
    </Shell>
  );
}

// ============================================================
// V1 · Direct-reply chip prominence (single row, parent filled).
// One row, "Replying to" → filled accent chip with ↪ glyph for
// the parent, then "also" → ghost chips for the rest.
// ============================================================
function V1() {
  return (
    <Shell>
      <div className="rv-v1-row">
        <span className="rv-v1-l">Replying to</span>
        <a className="rv-v1-chip-parent">
          <Glyph.reply/>
          {POST.parent.handle}
        </a>
        <span className="rv-v1-also">· also</span>
        {POST.cc.map(a => <a key={a.handle} className="rv-v1-chip">{a.handle}</a>)}
      </div>
    </Shell>
  );
}

// ============================================================
// V2 · Twitter-style header — small italic line above body.
// Parent only; the rest live in a "+N more" expander.
// Most familiar pattern, minimal vertical footprint.
// ============================================================
function V2() {
  return (
    <Shell position="aboveBody">
      <div className="rv-v2-header">
        <Glyph.replyTiny/>
        <span className="rv-v2-header-l">Replying to</span>
        <a>{POST.parent.handle}</a>
        <span className="rv-v2-header-more">+ {POST.cc.length} others</span>
      </div>
    </Shell>
  );
}

// ============================================================
// V3 · Stacked two-line — "Replying to" / "Also pinged".
// Vertically separates the direct parent from the cc-list. Most
// explicit / accessible, but takes the most space.
// ============================================================
function V3() {
  return (
    <Shell>
      <div className="rv-v3-block">
        <div className="rv-v3-line">
          <span className="rv-v3-l primary">Replying to</span>
          <a className="rv-v3-chip-parent">
            <Glyph.replyTiny/>
            {POST.parent.handle}
          </a>
        </div>
        <div className="rv-v3-line">
          <span className="rv-v3-l cc">Also pinged</span>
          {POST.cc.map(a => <a key={a.handle} className="rv-v3-chip">{a.handle}</a>)}
        </div>
      </div>
    </Shell>
  );
}

// ============================================================
// V4 · Avatar context strip — compact tinted bar above body.
// Includes parent avatar, name + handle, and "+N others" pill.
// Reads as a single sentence; brand-y.
// ============================================================
function V4() {
  return (
    <Shell position="aboveBody">
      <div className="rv-v4-strip">
        <Glyph.replyTiny style={{color: 'var(--accent-ink)'}}/>
        <span className="rv-v4-l">in reply to</span>
        <span className={"rv-av-xs " + POST.parent.avClass} style={{display: 'inline-block'}}/>
        <span className="rv-v4-name">{POST.parent.name}</span>
        <span className="rv-v4-handle">{POST.parent.handle}</span>
        <span className="rv-v4-sep">·</span>
        <button className="rv-v4-more">+{POST.cc.length} others</button>
      </div>
    </Shell>
  );
}

// ============================================================
// V5 · Reordered single row — parent first, accented inline.
// Minimal-change variant: same "Pinged" row, but parent is
// re-ordered to the front with an outlined accent chip + glyph.
// Easiest to ship, lowest disruption.
// ============================================================
function V5() {
  return (
    <Shell>
      <div className="rv-v5-row">
        <span className="rv-v5-l">Pinged</span>
        <a className="rv-v5-chip-parent">
          <Glyph.replyTiny/>
          {POST.parent.handle}
        </a>
        {POST.cc.map(a => <a key={a.handle} className="rv-v5-chip">{a.handle}</a>)}
      </div>
    </Shell>
  );
}

// ============================================================
// Page wrapper
// ============================================================
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
      <div className="rv-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Reply-indicator variants">
      <DCSection
        id="replies"
        title="Reply indicators — five alternatives + baseline"
        subtitle="The fediverse reply pattern auto-prepends addressees to a post. Right now PleromaNet shows them as a uniform Pinged chip row, with no signal which one is the post being directly answered. Each variant below addresses that. Same post body across all six; only the indicator changes.">

        <DCArtboard id="v0" label="V0 · current (the problem)" width={640} height={520}>
          <Page
            kicker="V0 · BASELINE"
            title="Uniform chip row"
            sub="Where we are. All addressees flatten into a single Pinged row of identical chips. The direct parent is indistinguishable from the cc-list, so the reader has no fast way to know which post this is actually answering."
            cheat={{
              Model: 'One row · all chips identical',
              'Reply signal': 'None — must scroll up the thread',
              Risk: 'Reads as a hashtag salad on long threads',
            }}>
            <V0/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v1" label="V1 · parent filled · same row ★" width={640} height={520}>
          <Page
            kicker="V1 · RECOMMENDED"
            title="Parent chip prominence"
            sub="Same single row, but the parent becomes a filled accent chip with a small ↪ glyph and the label flips from 'Pinged' to 'Replying to'. The cc-list follows under a quieter 'also' divider. One row, clear hierarchy."
            cheat={{
              Model: 'Single row · filled parent chip + ghost cc-chips',
              'Reply signal': 'Color contrast + ↪ glyph + label change',
              Wins: 'No new height · keeps existing layout',
            }}>
            <V1/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v2" label="V2 · twitter-style header" width={640} height={520}>
          <Page
            kicker="V2"
            title="Header line above body"
            sub="Drops a small italic 'Replying to @parent · +N others' line above the post body. Mirrors the Twitter/X convention readers already know. Most compact vertically — the parent gets a whole line to itself, the cc-list collapses to one expander."
            cheat={{
              Model: 'Header line above body · parent + "+N others"',
              'Reply signal': 'Position (above body) + label',
              'Trade-off': 'CC list is hidden behind an expander',
            }}>
            <V2/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3" label="V3 · stacked · two lines" width={640} height={560}>
          <Page
            kicker="V3"
            title="Stacked: Replying to / Also pinged"
            sub="Two clearly labelled lines below the body. Parent on top, in a filled outlined chip; cc on the bottom, as muted outlined chips. Most explicit and most scannable — but also the tallest of the variants."
            cheat={{
              Model: 'Two-row block · label column + chip row each',
              'Reply signal': 'Spatial separation + label change + style',
              Trade: 'Adds ~24px height per reply',
            }}>
            <V3/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4" label="V4 · avatar context strip" width={640} height={540}>
          <Page
            kicker="V4 · WILDCARD"
            title="Avatar strip"
            sub="A small tinted bar above the body that reads as a sentence: 'in reply to <parent avatar> name @handle · +N others'. Brings the parent's identity (not just their handle) into the post itself, which on long threads is the actual question the reader has."
            cheat={{
              Model: 'Bar above body · avatar + name + handle + "+N"',
              'Reply signal': 'Surface treatment + parent avatar inline',
              'Trade-off': 'Highest visual weight · pulls eye from body',
            }}>
            <V4/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v5" label="V5 · minimal-change reorder" width={640} height={520}>
          <Page
            kicker="V5 · LOW-RISK"
            title="Parent first · accented inline"
            sub="Keeps the existing 'Pinged' row label and structure. Just reorders the parent to the front, gives it an outlined accent chip + ↪ glyph, leaves the rest as today. Two-line CSS change, ships tomorrow."
            cheat={{
              Model: 'Single row · parent first · outlined accent chip',
              'Reply signal': 'Order + border + glyph',
              Wins: 'Smallest patch · backward-readable to existing users',
            }}>
            <V5/>
          </Page>
        </DCArtboard>

      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
