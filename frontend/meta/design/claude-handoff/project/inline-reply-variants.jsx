/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState } = React;

// ============================================================
// Inline reply variants
// All six variants render the same thread fragment: one reply post
// (soft.hertz) followed by another (datagram). The user has just
// clicked the "Reply" action on the first one. Each variant shows
// what the resulting reply-composer state looks like.
//
// The thread-top composer is shown collapsed at the top of every
// variant for context (variant V4 promotes it instead of inlining).
// ============================================================

const TARGET = {
  name: 'soft.hertz',
  handle: '@soft.hertz@kolektiva.social',
  avClass: 'av-grad-3',
  time: '22m',
  body: "touched grass too. recommend the slow internet diet. @nyan was saying something similar yesterday.",
};
const NEXT = {
  name: 'datagram',
  handle: '@datagram@retro.social',
  avClass: 'av-pixel-pc',
  time: '34m',
  body: "we used to log off. when did that stop being a thing.",
};

// ============================================================
// Inline glyphs — local to this file, no I import
// ============================================================
const G = {
  reply:    (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
  replyTiny:(p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
  boost:    (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5"/></svg>,
  star:     (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" width="14" height="14" {...p}><path d="M8 2l1.7 3.9 4.3.4-3.2 2.9.9 4.2L8 11.2 4.3 13.4l.9-4.2L2 6.3l4.3-.4L8 2z"/></svg>,
  more:     (p) => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" {...p}><circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12" cy="8" r="1.3"/></svg>,
  image:    (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16" {...p}><rect x="2" y="3" width="12" height="10" rx="1"/><circle cx="5.5" cy="6.5" r="1"/><path d="M2 11l3-3 4 4 2-2 3 3"/></svg>,
  smile:    (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16" {...p}><circle cx="8" cy="8" r="6"/><circle cx="6" cy="7" r="0.7" fill="currentColor"/><circle cx="10" cy="7" r="0.7" fill="currentColor"/><path d="M5.5 10.2c1.2 1.1 3.8 1.1 5 0"/></svg>,
  poll:     (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16" {...p}><rect x="2" y="9" width="3" height="5"/><rect x="6.5" y="5" width="3" height="9"/><rect x="11" y="2" width="3" height="12"/></svg>,
  expand:   (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="14" height="14" {...p}><path d="M9 3h4v4M7 13H3V9M13 3l-5 5M3 13l5-5"/></svg>,
  x:        (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="14" height="14" {...p}><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  send:     (p) => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" {...p}><path d="M2 13l12-5L2 3l2 5-2 5z"/></svg>,
};

// ============================================================
// Shared post & header pieces — used by every variant
// ============================================================
function TopComposer({ state = 'idle', addressee }) {
  const isActive = state === 'active';
  return (
    <div className={"irv-top-composer " + (isActive ? 'active' : 'muted')}>
      <span className={"irv-av av-pixel-pc"} style={{width: 32, height: 32, borderRadius: 3}}/>
      <span className="irv-top-input-fake">
        {isActive
          ? <>What's on your mind?</>
          : <>Reply to this thread…</>}
      </span>
      {isActive && addressee && (
        <span className="irv-top-addr-chip">
          <G.replyTiny/>
          {addressee}
          <span className="irv-top-addr-x">×</span>
        </span>
      )}
    </div>
  );
}

function ReplyPost({ post, highlighted = false, replyOpen = false }) {
  return (
    <article className={"irv-post " + (highlighted ? 'irv-post-target' : '')}>
      <div className={"irv-av " + post.avClass}/>
      <div className="irv-right">
        <header className="irv-head">
          <span className="irv-name">{post.name}</span>
          <span className="irv-handle">{post.handle}</span>
          <span className="irv-time">{post.time}</span>
        </header>
        <div className="irv-body">{post.body}</div>
        <div className="irv-actions">
          <button className={"irv-act " + (replyOpen ? 'on' : '')}>
            <G.reply/>
            <span>0</span>
          </button>
          <button className="irv-act"><G.boost/><span>7</span></button>
          <button className="irv-act"><G.star/><span>31</span></button>
          <button className="irv-act irv-act-end"><G.more/></button>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// V0 · Baseline — nothing happens. The button toggles `actions.reply`
// but no form appears. This is the current state.
// ============================================================
function V0() {
  return (
    <>
      <TopComposer state="idle"/>
      <ReplyPost post={TARGET} highlighted={false} replyOpen={true}/>
      <div className="irv-v0-note">
        ⚠ Reply pressed · button highlights on, but nothing else changes.
        The user must scroll back up to the thread-top composer, where the
        addressing is implicit (it just replies to the focused post).
      </div>
      <ReplyPost post={NEXT}/>
    </>
  );
}

// ============================================================
// V1 · Full inline composer below the post ★
// Click reply → composer slides open directly beneath the targeted
// post. Pre-addressed to that author. Following replies push down.
// ============================================================
function V1() {
  return (
    <>
      <TopComposer state="idle"/>
      <ReplyPost post={TARGET} highlighted={true} replyOpen={true}/>
      <div className="irv-v1-composer">
        <span className="irv-av irv-av-sm" style={{background: 'linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0)'}}/>
        <div>
          <div className="irv-v1-addr">
            <span>Replying to</span>
            <span className="irv-v1-addr-chip">@soft.hertz</span>
          </div>
          <textarea
            className="irv-v1-textarea"
            placeholder="Write your reply…"
            defaultValue="agreed — the slow internet diet has been life-changing."
            rows={3}
          />
          <div className="irv-v1-row">
            <button className="irv-v1-tool"><G.image/></button>
            <button className="irv-v1-tool"><G.smile/></button>
            <button className="irv-v1-tool"><G.poll/></button>
            <button className="irv-v1-cw">CW</button>
            <span className="irv-v1-spacer"/>
            <button className="irv-v1-cancel">Cancel</button>
            <span className="irv-v1-count">447</span>
            <button className="irv-v1-submit">Reply</button>
          </div>
        </div>
      </div>
      <ReplyPost post={NEXT}/>
    </>
  );
}

// ============================================================
// V2 · Compact one-line composer.
// Single rounded input + send button. "Expand" icon grows it into
// the V1 layout if the user needs richer composition.
// ============================================================
function V2() {
  return (
    <>
      <TopComposer state="idle"/>
      <ReplyPost post={TARGET} highlighted={true} replyOpen={true}/>
      <div className="irv-v2-composer">
        <span className="irv-av irv-v2-av" style={{background: 'linear-gradient(135deg, #2a1f4a, #6b4d8e, #d889a0)'}}/>
        <input
          className="irv-v2-input"
          placeholder="Reply to @soft.hertz…"
          defaultValue="agreed — the slow internet diet has been life-changing."
        />
        <span className="irv-v2-hint">⌘↵</span>
        <button className="irv-v2-expand" title="Expand"><G.expand/></button>
        <button className="irv-v2-send" title="Send"><G.send/></button>
      </div>
      <ReplyPost post={NEXT}/>
    </>
  );
}

// ============================================================
// V3 · Composer with quote preview of the post being replied to.
// Composer drops in below the post, but includes a quoted chip
// of the parent post inside it — so even if you scroll while
// writing, the target stays visible inside the form.
// ============================================================
function V3() {
  return (
    <>
      <TopComposer state="idle"/>
      <ReplyPost post={TARGET} highlighted={true} replyOpen={true}/>
      <div className="irv-v3-composer">
        <div className="irv-v3-quote">
          <span className={"irv-av irv-av-xs " + TARGET.avClass}/>
          <div>
            <div className="irv-v3-quote-head">
              <span className="irv-v3-quote-name">{TARGET.name}</span>
              <span className="irv-v3-quote-handle">{TARGET.handle}</span>
              <button className="irv-v3-quote-x">×</button>
            </div>
            <div className="irv-v3-quote-snip">{TARGET.body}</div>
          </div>
        </div>
        <textarea
          className="irv-v1-textarea"
          placeholder="Write your reply…"
          defaultValue="agreed — the slow internet diet has been life-changing."
          rows={3}
        />
        <div className="irv-v1-row">
          <button className="irv-v1-tool"><G.image/></button>
          <button className="irv-v1-tool"><G.smile/></button>
          <button className="irv-v1-cw">CW</button>
          <span className="irv-v1-spacer"/>
          <button className="irv-v1-cancel">Cancel</button>
          <span className="irv-v1-count">447</span>
          <button className="irv-v1-submit">Reply</button>
        </div>
      </div>
      <ReplyPost post={NEXT}/>
    </>
  );
}

// ============================================================
// V4 · Re-route to thread-top composer.
// Click reply → the top composer at the head of the thread gets
// focused, with an addressee chip injected. A small "↑ replying to
// @soft.hertz" indicator appears beneath the targeted post so the
// user can find their way back.
// ============================================================
function V4() {
  return (
    <>
      <TopComposer state="active" addressee="@soft.hertz"/>
      <ReplyPost post={TARGET} highlighted={true} replyOpen={true}/>
      <div className="irv-v4-arrow">
        replying to @soft.hertz · composer is above
      </div>
      <ReplyPost post={NEXT}/>
    </>
  );
}

// ============================================================
// V5 · Bottom sheet / popover (modal).
// Click reply → a sheet rises from the bottom of the thread,
// dimming the rest. Targeted post is referenced in the sheet
// header. Mobile-first; on desktop reads as a focused popover.
// ============================================================
function V5() {
  return (
    <div className="irv-v5-stage">
      <TopComposer state="idle"/>
      <ReplyPost post={TARGET} highlighted={true} replyOpen={true}/>
      <ReplyPost post={NEXT}/>
      <div className="irv-v5-backdrop"/>
      <div className="irv-v5-sheet">
        <div className="irv-v5-grip"/>
        <div className="irv-v5-head">
          <G.replyTiny/>
          <span>Replying to</span>
          <span className="irv-v5-head-target">{TARGET.name} <span style={{color: 'var(--muted)', fontWeight: 400}}>{TARGET.handle}</span></span>
          <button className="irv-v5-x"><G.x/></button>
        </div>
        <textarea
          className="irv-v5-textarea"
          placeholder="Write your reply…"
          defaultValue="agreed — the slow internet diet has been life-changing."
          rows={3}
        />
        <div className="irv-v5-foot">
          <button className="irv-v5-tool"><G.image/></button>
          <button className="irv-v5-tool"><G.smile/></button>
          <button className="irv-v5-tool"><G.poll/></button>
          <span className="irv-v5-spacer"/>
          <span className="irv-v5-count">447</span>
          <button className="irv-v5-submit">Reply</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// V6 · Two-stage: confirmation chip first, then expand.
// Click reply → a tiny "Replying to @X" chip appears below the
// post, with an "Open composer →" button. Click that to expand
// into the full V1 inline composer. Two-click but very low-noise.
// ============================================================
function V6() {
  return (
    <>
      <TopComposer state="idle"/>
      <ReplyPost post={TARGET} highlighted={true} replyOpen={true}/>
      <div className="irv-v6-chip">
        <G.replyTiny style={{color: 'var(--accent)'}}/>
        <span className="irv-v6-chip-l">Replying to</span>
        <span className="irv-v6-chip-handle">@soft.hertz</span>
        <button className="irv-v6-chip-expand">Open composer →</button>
        <button className="irv-v6-chip-x"><G.x/></button>
      </div>
      <ReplyPost post={NEXT}/>
    </>
  );
}

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="irv-page">
      <header className="irv-page-h">
        <div className="irv-kicker">{kicker}</div>
        <h1 className="irv-h1">{title}</h1>
        <p className="irv-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="irv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="irv-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="irv-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Inline reply variants">
      <DCSection
        id="inline-replies"
        title="Inline reply form — what happens when 'Reply' is pressed inside a thread"
        subtitle="Currently the Reply action on per-reply posts has no inline form — users must scroll back to the thread-top composer (which doesn't even know which sub-reply you meant). Six alternatives below. Every artboard shows the same thread fragment (soft.hertz, datagram) with the user mid-reply to soft.hertz.">

        <DCArtboard id="v0" label="V0 · current (the problem)" width={720} height={620}>
          <Page
            kicker="V0 · BASELINE"
            title="Dead button"
            sub="Reply highlights its icon on, but no form appears. The thread-top composer always replies to the focused post, never to a sub-reply — so the action visually fires but doesn't do anything useful in context."
            cheat={{
              State: 'Reply icon → on. No form. No addressee.',
              Problem: 'User has to scroll up + manually @-mention the right person',
            }}>
            <V0/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v1" label="V1 · full inline composer ★" width={720} height={900}>
          <Page
            kicker="V1 · RECOMMENDED"
            title="Full inline composer"
            sub="Composer slides in directly below the targeted post, indented to the same depth, pre-addressed to that author. Full tool rail (image / emoji / CW / poll), char count, Cancel + Reply submit. Following replies push down."
            cheat={{
              Surface: 'Inline · accent-tinted band · 3px left rule',
              Context: 'Lives at the right place spatially · no scrolling',
              Trade: 'Tallest variant · pushes following replies ~150px down',
              Best: 'Desktop · medium-depth threads',
            }}>
            <V1/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v2" label="V2 · compact one-line" width={720} height={660}>
          <Page
            kicker="V2"
            title="Compact one-line"
            sub="A single rounded input + send icon, slotted inline. Expand icon grows it into the V1 layout when the user needs richer composition. Lowest vertical footprint of the inline options."
            cheat={{
              Surface: 'Inline · single line · ⌘↵ to send hint',
              Wins: 'Smallest height · keeps thread scannable while typing',
              Trade: 'No tool rail until expanded · feels chat-y',
              Best: 'Mobile · or quick one-liner culture',
            }}>
            <V2/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3" label="V3 · composer with quote preview" width={720} height={960}>
          <Page
            kicker="V3"
            title="Composer + quote preview"
            sub="V1 layout, but with a quoted-chip of the parent post inserted inside the form. The chip persists while typing, so even if the user scrolls within the form area they don't lose sight of who they're replying to."
            cheat={{
              Surface: 'Inline · accent-tinted band · quote chip inside form',
              Wins: 'Reply target travels with the form · helps when threads are deep',
              Trade: '~40px taller than V1 · slightly redundant if the target is right above',
              Best: 'Deep nested threads',
            }}>
            <V3/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v4" label="V4 · re-route to top composer" width={720} height={620}>
          <Page
            kicker="V4 · LOW-EFFORT"
            title="Promote the top composer"
            sub="No new surface. Click reply → the existing thread-top composer becomes 'active' (background tint, focused) and an addressee chip is injected at its head. A small '↑ replying to @X' indicator appears beneath the targeted post as a breadcrumb back."
            cheat={{
              Surface: 'Existing top composer · injected addressee chip',
              Wins: 'Single composer to maintain · least code · familiar pattern',
              Trade: 'Spatial disconnect — composer is at the top, target is below',
              Best: 'Short threads where scrolling cost is low',
            }}>
            <V4/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v5" label="V5 · bottom sheet" width={720} height={780}>
          <Page
            kicker="V5 · MOBILE-FIRST"
            title="Bottom sheet"
            sub="Rises from the bottom of the thread with a backdrop dim. Targeted post named in the sheet header. Reads as a focused popover on desktop, a native bottom-sheet on mobile."
            cheat={{
              Surface: 'Modal sheet · backdrop dim · rises from bottom',
              Wins: 'Same UX on every screen size · keyboard avoidance free on mobile',
              Trade: 'Modal pattern hides surrounding context behind the dim',
              Best: 'Mobile-first apps · or when reply needs deep focus',
            }}>
            <V5/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v6" label="V6 · two-stage chip → composer" width={720} height={620}>
          <Page
            kicker="V6"
            title="Two-stage: chip first, expand on demand"
            sub="Click reply once → a small 'Replying to @X' chip appears beneath the post (with explicit Open composer + dismiss). Click expand to inflate into a V1 inline composer. Two clicks, lowest noise — good when most reply-presses are accidental or exploratory."
            cheat={{
              Surface: 'Step 1 chip · step 2 inflates to V1 composer',
              Wins: 'Lowest visual noise on the first click · easy undo',
              Trade: 'Two clicks · slower for users who always want to reply',
              Best: 'Touch interfaces · low-stakes threads',
            }}>
            <V6/>
          </Page>
        </DCArtboard>

      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
