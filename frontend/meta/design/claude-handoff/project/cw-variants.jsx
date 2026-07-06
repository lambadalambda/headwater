/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState } = React;

// ============================================================
// Content-warning variants.
//
//   A · Composer (author sets the CW)
//     A1 · Inline summary input    ★ recommended
//     A2 · Modal with preset chips
//     A3 · Body sectioning (Summary | Hidden)
//
//   B · Display (CW'd post in feed)
//     B1 · Folded banner           ★ recommended
//     B2 · Folded card
//     B3 · Inline preface + blur
//     B4 · Subject-line / classic
//     B5 · Severity-tinted card    (wildcard)
//     B6 · Revealed state
// ============================================================

const POST = {
  name: 'mossy',
  handle: '@mossy@garden.cafe',
  avClass: 'av-grad-3',
  time: '2h',
};
const HIDDEN_BODY = "every restaurant photo I take ends up looking like a NYT food review somehow. is there a special app for that or is it just learned posture\n\n📍 home cooking · saturday breakfast";
const SUMMARY = "food + plated photos";

// ---------- Inline glyphs ----------
const G = {
  cw:    (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" {...p}><path d="M8 1.5l7 12.5H1L8 1.5z"/><path d="M8 6v4M8 12v.5"/></svg>,
  cwLg:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" {...p}><path d="M12 3l10 18H2L12 3z"/><path d="M12 9v5M12 17v.5"/></svg>,
  image: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16" {...p}><rect x="2" y="3" width="12" height="10" rx="1"/><circle cx="5.5" cy="6.5" r="1"/><path d="M2 11l3-3 4 4 2-2 3 3"/></svg>,
  poll:  (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="14" height="14" {...p}><path d="M3 13V8M8 13V3M13 13v-4"/></svg>,
  smile: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16" {...p}><circle cx="8" cy="8" r="6"/><circle cx="6" cy="7" r="0.7" fill="currentColor"/><circle cx="10" cy="7" r="0.7" fill="currentColor"/><path d="M5.5 10.2c1.2 1.1 3.8 1.1 5 0"/></svg>,
  x:     (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="14" height="14" {...p}><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  eye:   (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="13" height="13" {...p}><path d="M2 8s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z"/><circle cx="8" cy="8" r="1.6"/></svg>,
  reply: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
  boost: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5"/></svg>,
  star:  (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" width="14" height="14" {...p}><path d="M8 2l1.7 3.9 4.3.4-3.2 2.9.9 4.2L8 11.2 4.3 13.4l.9-4.2L2 6.3l4.3-.4L8 2z"/></svg>,
  more:  (p) => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" {...p}><circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12" cy="8" r="1.3"/></svg>,
};

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="cv-page">
      <header className="cv-page-h">
        <div className="cv-kicker">{kicker}</div>
        <h1 className="cv-h1">{title}</h1>
        <p className="cv-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="cv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="cv-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="cv-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// Shared post shell — for B variants
// ============================================================
function PostShell({ children }) {
  return (
    <div className="cv-feed-wrap">
      <article className="cv-post">
        <div className={"cv-post-av " + POST.avClass}/>
        <div className="cv-post-right">
          <header className="cv-post-head">
            <span className="cv-post-name">{POST.name}</span>
            <span className="cv-post-handle">{POST.handle}</span>
            <span className="cv-post-time">{POST.time}</span>
          </header>
          {children}
          <div className="cv-post-actions">
            <button className="cv-post-action"><G.reply/><span>4</span></button>
            <button className="cv-post-action"><G.boost/><span>3</span></button>
            <button className="cv-post-action"><G.star/><span>22</span></button>
            <button className="cv-post-action" style={{marginLeft: 'auto'}}><G.more/></button>
          </div>
        </div>
      </article>
    </div>
  );
}

// ============================================================
// SECTION A — COMPOSER
// ============================================================

function ComposerShell({ hasCW, children, withAttachments = true, cwButtonActive = true }) {
  return (
    <div className={"cv-composer " + (hasCW ? 'has-cw' : '')}>
      <div className="cv-composer-row">
        <div className="cv-composer-av"/>
        <textarea
          className="cv-composer-input"
          defaultValue={HIDDEN_BODY}
          placeholder="What's on your mind?"
          rows={3}
        />
      </div>
      {children}
      {withAttachments && (
        <div className="cv-comp-attach">
          <div className="cv-comp-attach-cell"><img src="samples/cat-bank.webp" alt=""/></div>
          <div className="cv-comp-attach-cell"><img src="samples/cat-door.webp" alt=""/></div>
        </div>
      )}
      <div className="cv-composer-tools">
        <button className="cv-composer-tool"><G.image/></button>
        <button className="cv-composer-tool"><G.poll/></button>
        <button className="cv-composer-tool"><G.smile/></button>
        <button className={"cv-composer-cw-btn " + (cwButtonActive ? 'active' : '')}>CW</button>
        <span className="cv-composer-spacer"/>
        <span className="cv-composer-count">412</span>
        <button className="cv-composer-submit">Post</button>
      </div>
    </div>
  );
}

// ---------- A1 · Inline summary input ★ ----------
function A1() {
  return (
    <ComposerShell hasCW={true}>
      <div className="cv-a1-cw">
        <span className="cv-a1-cw-l"><G.cw/>CW</span>
        <input className="cv-a1-cw-input" defaultValue={SUMMARY} placeholder="One short line · what readers see before opening"/>
        <button className="cv-a1-cw-x" title="Remove CW"><G.x/></button>
      </div>
    </ComposerShell>
  );
}

// ---------- A2 · Modal with preset chips ----------
function A2() {
  const presets = ['food', 'politics', 'eye contact', 'body talk', 'spoilers', 'animals', 'NSFW', 'mh'];
  const [active, setActive] = useState(new Set(['food']));
  const toggle = p => setActive(s => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });
  return (
    <>
      <ComposerShell hasCW={true}>
        <div className="cv-a1-cw">
          <span className="cv-a1-cw-l"><G.cw/>CW</span>
          <input className="cv-a1-cw-input" defaultValue="food, plated photos" readOnly/>
          <button className="cv-a1-cw-x"><G.x/></button>
        </div>
      </ComposerShell>
      <div className="cv-a2-modal">
        <div className="cv-a2-head">
          <G.cwLg/>
          <div>
            <div className="cv-a2-head-title">Content warning</div>
            <div className="cv-a2-head-sub">Hides post body + media until opened</div>
          </div>
          <button className="cv-a2-x"><G.x/></button>
        </div>
        <div className="cv-a2-body">
          <div className="cv-a2-l">Common subjects</div>
          <div className="cv-a2-chips">
            {presets.map(p => (
              <button key={p}
                className={"cv-a2-chip " + (active.has(p) ? 'active' : '')}
                onClick={() => toggle(p)}>
                {p}
              </button>
            ))}
          </div>
          <div className="cv-a2-l">Or write your own</div>
          <input className="cv-a2-input" defaultValue="food, plated photos" placeholder="A short line · keep it factual"/>
          <div className="cv-a2-toggle-row">
            <span className="cv-toggle on"/>
            <span>Also hide attachments (recommended)</span>
          </div>
        </div>
        <div className="cv-a2-foot">
          <span className="cv-a2-foot-hint" style={{flex: 1, fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted)'}}>1 of 1 subject · 50 char limit</span>
          <button className="cv-a2-cancel">Cancel</button>
          <button className="cv-composer-submit">Apply CW</button>
        </div>
      </div>
    </>
  );
}

// ---------- A3 · Body sectioning ----------
function A3() {
  return (
    <div className="cv-composer has-cw">
      <div className="cv-composer-row">
        <div className="cv-composer-av"/>
        <div style={{minWidth: 0, flex: 1}}>
          <div className="cv-a3-twin" style={{margin: '0'}}>
            <div className="cv-a3-summary">
              <div className="cv-a3-summary-l"><G.cw/>Summary · visible before opening</div>
              <input defaultValue={SUMMARY} placeholder="food, plated photos…"/>
            </div>
            <div className="cv-a3-hidden">
              <div className="cv-a3-hidden-l"><G.eye/>Hidden · only shown after Show post</div>
              <textarea defaultValue={HIDDEN_BODY} rows={3}/>
            </div>
          </div>
        </div>
      </div>
      <div className="cv-comp-attach">
        <div className="cv-comp-attach-cell"><img src="samples/cat-bank.webp" alt=""/></div>
        <div className="cv-comp-attach-cell"><img src="samples/cat-door.webp" alt=""/></div>
      </div>
      <div className="cv-composer-tools">
        <button className="cv-composer-tool"><G.image/></button>
        <button className="cv-composer-tool"><G.poll/></button>
        <button className="cv-composer-tool"><G.smile/></button>
        <button className="cv-composer-cw-btn active">CW</button>
        <span className="cv-composer-spacer"/>
        <span className="cv-composer-count">412</span>
        <button className="cv-composer-submit">Post</button>
      </div>
    </div>
  );
}

// ============================================================
// SECTION B — DISPLAY
// ============================================================

// ---------- B1 · Folded banner ★ ----------
function B1() {
  return (
    <PostShell>
      <div className="cv-b1-banner">
        <G.cw/>
        <span className="cv-b1-banner-l">CW</span>
        <span className="cv-b1-banner-summary">{SUMMARY}</span>
        <span className="cv-b1-banner-meta">2 photos</span>
        <button className="cv-b1-banner-show">Show post</button>
      </div>
    </PostShell>
  );
}

// ---------- B2 · Folded card ----------
function B2() {
  return (
    <PostShell>
      <div className="cv-b2-card">
        <div className="cv-b2-head">
          <G.cw/>
          Content warning
        </div>
        <div className="cv-b2-summary">{SUMMARY}</div>
        <div className="cv-b2-meta">
          <span>Hidden:</span>
          <span className="cv-b2-meta-chip"><G.image style={{width: 11, height: 11}}/> 2 photos</span>
          <span className="cv-b2-meta-chip">~24 words</span>
        </div>
        <div className="cv-b2-foot">
          <button className="cv-b2-reveal">Show post</button>
          <button className="cv-b2-link">Always show from @mossy →</button>
        </div>
      </div>
    </PostShell>
  );
}

// ---------- B3 · Inline preface + blur ----------
function B3() {
  const [revealed, setRevealed] = useState(false);
  return (
    <PostShell>
      <div className="cv-b3-preface">
        <G.cw/>
        <span>CW</span>
        <span className="cv-b3-preface-summary">{SUMMARY}</span>
      </div>
      <div className="cv-b3-content">
        <div className={"cv-b3-content-body " + (revealed ? 'revealed' : '')} onClick={() => setRevealed(!revealed)}>
          {HIDDEN_BODY}
        </div>
        <div className="cv-b3-photos">
          <div className={"cv-b3-photos-cell " + (revealed ? 'revealed' : '')} onClick={() => setRevealed(true)}>
            <img src="samples/cat-bank.webp" alt=""/>
          </div>
          <div className={"cv-b3-photos-cell " + (revealed ? 'revealed' : '')} onClick={() => setRevealed(true)}>
            <img src="samples/cat-door.webp" alt=""/>
          </div>
        </div>
      </div>
      <div className="cv-b3-foot">
        <button className="cv-b3-toggle" onClick={() => setRevealed(r => !r)}>
          {revealed ? 'Hide post' : 'Tap to reveal'}
        </button>
      </div>
    </PostShell>
  );
}

// ---------- B4 · Subject-line / classic ----------
function B4() {
  return (
    <PostShell>
      <div className="cv-b4-block">
        <div className="cv-b4-row">
          <span className="cv-b4-summary">— {SUMMARY}</span>
          <button className="cv-b4-show">Show post →</button>
        </div>
        <div className="cv-b4-divider"/>
      </div>
    </PostShell>
  );
}

// ---------- B5 · Severity-tinted card ----------
function B5() {
  return (
    <>
      <PostShell>
        <div className="cv-b5-card">
          <div className="cv-b5-head">
            <G.cw/>
            Content warning
            <span className="cv-b5-tag">nsfw</span>
          </div>
          <div className="cv-b5-summary">nudity, art post</div>
          <div className="cv-b5-foot">
            <button className="cv-b5-reveal">Show post</button>
            <span className="cv-b5-hint">2 photos · ~12 words</span>
          </div>
        </div>
      </PostShell>
      <div style={{height: 12}}/>
      <PostShell>
        <div className="cv-b5-card warn">
          <div className="cv-b5-head">
            <G.cw/>
            Content warning
            <span className="cv-b5-tag">food</span>
          </div>
          <div className="cv-b5-summary">{SUMMARY}</div>
          <div className="cv-b5-foot">
            <button className="cv-b5-reveal">Show post</button>
            <span className="cv-b5-hint">2 photos · ~24 words</span>
          </div>
        </div>
      </PostShell>
      <div style={{height: 12}}/>
      <PostShell>
        <div className="cv-b5-card neutral">
          <div className="cv-b5-head">
            <G.cw/>
            Content warning
            <span className="cv-b5-tag">spoilers</span>
          </div>
          <div className="cv-b5-summary">Severance · S2E10 spoilers · end of season</div>
          <div className="cv-b5-foot">
            <button className="cv-b5-reveal">Show post</button>
            <span className="cv-b5-hint">~80 words</span>
          </div>
        </div>
      </PostShell>
    </>
  );
}

// ---------- B6 · Revealed state ----------
function B6() {
  return (
    <PostShell>
      <div className="cv-b6-summary-row">
        <G.cw/>
        <span className="cv-b6-summary-l">CW</span>
        <span className="cv-b6-summary-text">{SUMMARY}</span>
        <button className="cv-b6-hide">Hide</button>
      </div>
      <div className="cv-post-body">{HIDDEN_BODY}</div>
      <div className="cv-photos">
        <div className="cv-photos-cell"><img src="samples/cat-bank.webp" alt=""/></div>
        <div className="cv-photos-cell"><img src="samples/cat-door.webp" alt=""/></div>
      </div>
    </PostShell>
  );
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Content-warning variants">

      <DCSection
        id="cw-composer"
        title="A · Composer — how the author sets a CW"
        subtitle="The CW button exists on the composer tool rail but does nothing visible. Three alternatives for the input itself. All three flag the post body and ALL attached photos as hidden, and persist on the post.">

        <DCArtboard id="a1" label="A1 · inline summary input ★" width={720} height={700}>
          <Page
            kicker="A1 · RECOMMENDED"
            title="Inline summary input"
            sub="Click the CW button → a yellow-tinted summary input slides in between the textarea and the tool rail. One short line. × dismisses; the button highlights when active. Textarea text goes italic + muted to signal 'this is what's hidden.' Familiar pattern from Mastodon."
            cheat={{
              Surface: 'Inline · single warn-tinted row · 1 input',
              Wins: 'Familiar · zero new chrome · keeps composer compact',
              Trade: 'Less guidance than presets',
              Best: 'Default · matches existing Mastodon mental model',
            }}>
            <A1/>
          </Page>
        </DCArtboard>

        <DCArtboard id="a2" label="A2 · modal with preset chips" width={720} height={1080}>
          <Page
            kicker="A2"
            title="Modal with preset chips"
            sub="Click CW → focused card opens with 8 common-subject chips (food, politics, mh, etc), a freeform input, and an explicit 'hide attachments' toggle. Selected chips concatenate into the summary line. Encourages a small, scannable vocabulary."
            cheat={{
              Surface: 'Modal · preset chips + freeform · attachment toggle',
              Wins: 'Teaches the vocabulary · easier for new users',
              Trade: 'Heavier · two dismiss surfaces · modal weight',
              Best: 'When community standardization matters',
            }}>
            <A2/>
          </Page>
        </DCArtboard>

        <DCArtboard id="a3" label="A3 · body sectioning" width={720} height={740}>
          <Page
            kicker="A3 · WILDCARD"
            title="Body sectioning"
            sub="The composer body splits into two stacked panes: Summary (visible) and Hidden (only after Show post). Makes the visible/hidden split spatial — what you see in the composer mirrors exactly what readers will see at each state."
            cheat={{
              Surface: 'Two-pane composer · summary + hidden',
              Wins: 'Spatial 1:1 mapping to display · novel · clear intent',
              Trade: 'Reshapes the composer · breaks single-textarea muscle memory',
              Best: 'Brand-y · authors who think in two parts',
            }}>
            <A3/>
          </Page>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="cw-display"
        title="B · Display — how a CW'd post renders"
        subtitle="Same post: mossy posts about food with 2 photos and a body. Each variant hides everything until the reader explicitly opens it. Compact options come first; B6 shows what the revealed state looks like.">

        <DCArtboard id="b1" label="B1 · folded banner ★" width={620} height={520}>
          <Page
            kicker="B1 · RECOMMENDED"
            title="Folded banner"
            sub="A single warn-tinted row inside the post, where the body would go. ⚠ icon · CW label · summary · attachment count · Show button. Smallest vertical footprint of any folded variant; reads at-a-glance while scrolling."
            cheat={{
              Surface: 'Single row · ~36px tall · warn-tinted',
              Affordance: 'Inline Show button · also clickable banner',
              Wins: 'Tiniest footprint · scans like a metadata strip',
              Best: 'Default · keeps the feed scannable',
            }}>
            <B1/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b2" label="B2 · folded card" width={620} height={560}>
          <Page
            kicker="B2"
            title="Folded card"
            sub="Slightly taller card: header row, summary, metadata chips (counts attachments + word count), then a button row that includes a per-user 'always show from this author' shortcut. Best when the reader wants more context before opening."
            cheat={{
              Surface: '3-row card · header · summary · meta+actions',
              Wins: 'Word + attachment counts upfront · per-user override link',
              Trade: 'Taller than B1 · more chrome in the feed',
              Best: 'Power users · accessibility-first deployments',
            }}>
            <B2/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b3" label="B3 · inline preface + blur" width={620} height={760}>
          <Page
            kicker="B3"
            title="Inline preface + blur"
            sub="Body and photos stay laid out, but blurred + unselectable. A small inline CW preface labels the warning. Click anything in the content (body or photo) to reveal. Lower commitment than a full fold — readers see the shape of what's hidden."
            cheat={{
              Surface: 'In-place · blurred body + blurred photos · click to clear',
              Wins: 'Shape preserved · partial reveal · feels less censorious',
              Trade: 'Bigger feed footprint than B1/B2 · photo blur is heavy',
              Best: 'Communities where CWs are courtesy not gatekeeping',
            }}>
            <B3/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b4" label="B4 · subject-line / classic" width={620} height={500}>
          <Page
            kicker="B4"
            title="Subject-line / classic"
            sub="The minimalist editorial treatment: italic serif summary on the left, mono 'Show post →' link on the right, a hairline underneath. No card chrome. Closest to early Mastodon."
            cheat={{
              Surface: 'Single line · serif summary + mono action · hairline',
              Wins: 'Lightest visual weight · feels typographic',
              Trade: 'Less obvious it\'s a CW · no warn-tint signal',
              Best: 'Minimal themes · long-form-leaning instances',
            }}>
            <B4/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b5" label="B5 · severity-tinted card" width={620} height={1040}>
          <Page
            kicker="B5 · WILDCARD"
            title="Severity-tinted card"
            sub="B2 card but with three different tints driven by the CW subject: pink (NSFW), warm (food / body / politics), gray (spoilers / neutral). A tiny mono tag in the header echoes the subject. Reader can scan the tint and decide whether it's worth their next breath."
            cheat={{
              Surface: 'B2 card · tint + tag tied to CW subject',
              Tints: 'NSFW → pink · food/body → warm · neutral → gray',
              Wins: 'Faster reader triage · feels like content categorization',
              Trade: 'Needs a subject taxonomy (works with A2)',
            }}>
            <B5/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b6" label="B6 · revealed state" width={620} height={720}>
          <Page
            kicker="B6"
            title="Revealed state"
            sub="What the post looks like AFTER the reader presses Show post. The summary stays as a small left-rule line at the top so the context isn't lost; a quiet Hide link folds it back. Body + photos now render normally."
            cheat={{
              Surface: 'Summary row stays · body + photos un-hidden',
              Affordance: 'Hide link in the summary row · re-folds the post',
              Wins: 'Context never lost · easy to refold',
              Best: 'Companion state to B1/B2/B5 (same summary row geometry)',
            }}>
            <B6/>
          </Page>
        </DCArtboard>

      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
