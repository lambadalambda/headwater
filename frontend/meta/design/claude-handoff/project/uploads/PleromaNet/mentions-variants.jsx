/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState } = React;

// ============================================================
// Inline mention handling — variants
// ------------------------------------------------------------
// The fediverse problem: every reply replays the recipient list
// as @-mentions inline. After 3 levels of thread, "@feld @lain"
// takes up the first 1.5 lines of every post and the actual
// content gets pushed down. This file sketches a few ways to
// keep the recipient list visible WITHOUT letting it dominate.
// ============================================================

// Reproduces the user's screenshot thread, plus a post with mid-text mentions
// to show that variants only transform the LEADING address pile-up — @-mentions
// inside the body always stay inline.
const POSTS = [
  {
    name: 'dtluna', handle: '@dtluna@pl.kotobank.ch', avClass: 'av-anime',
    time: '5h', replyTo: '@feld',
    addressees: ['@feld', '@lain'],
    body: "Aight, I'm finally getting to setting this up. What are some models you recommend to run with llama.cpp?",
  },
  {
    name: 'Q.U.I.N.N.', handle: '@icedquinn@blob.cat', avClass: 'av-orb',
    time: '5h', replyTo: '@dtluna',
    addressees: ['@dtluna', '@feld', '@lain'],
    body: "qwen 0.5b can handle some limited summary tasks. jan-nano is supposedly designed explicitly to be a research assistant. theres also the JOSIE models which are jailbroken qwens.\n\nthey're all kind of limited use but, well.",
  },
  {
    name: 'dtluna', handle: '@dtluna@pl.kotobank.ch', avClass: 'av-anime',
    time: '5h', replyTo: '@icedquinn',
    addressees: ['@icedquinn', '@feld', '@lain'],
    body: "I have 20 GB of vram on board and I want it to actually write some code. I see people recommend qwen3.5-coder a lot — has @lain tried it for the bot work? curious if @feld has thoughts too",
  },
];

// ============================================================
// Body renderer — turns a body string into JSX, linking any
// @-mentions found inside as inline links. Used by every variant
// for the in-body content (variants only differ in how they
// treat the LEADING addressees array).
// ============================================================
const MENTION_RE = /@[\w.]+(?:@[\w.]+)?/g;
function renderBody(text, mentionClass = 'mv-mention-inline') {
  const out = [];
  let lastIdx = 0;
  let match;
  let key = 0;
  while ((match = MENTION_RE.exec(text)) !== null) {
    if (match.index > lastIdx) out.push(text.slice(lastIdx, match.index));
    out.push(<a key={key++} className={mentionClass}>{match[0]}</a>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) out.push(text.slice(lastIdx));
  return out;
}

// ============================================================
// Variant renderers
// ============================================================

function MentionsBaseline({ addressees, body }) {
  return (
    <div className="mv-body">
      <span className="mv-body-text">
        {addressees.map((m, i) => (
          <React.Fragment key={m}>
            <a className="mv-mention mv-mention-full">{m}</a>{' '}
          </React.Fragment>
        ))}
        {renderBody(body, 'mv-mention-full')}
      </span>
    </div>
  );
}

function MentionsDropped({ addressees, body }) {
  return (
    <div className="mv-body">
      <div className="mv-body-text">{renderBody(body)}</div>
      {addressees.length > 0 && (
        <div className="mv-recipients">
          <span className="mv-recipients-l">pinged</span>
          <span className="mv-recipients-list">
            {addressees.map(m => <a key={m} className="mv-mention-mini">{m}</a>)}
          </span>
        </div>
      )}
    </div>
  );
}

function MentionsDock({ addressees, body }) {
  return (
    <div className="mv-body">
      <div className="mv-dock">
        <span className="mv-dock-l">TO</span>
        <span className="mv-dock-chips">
          {addressees.map(m => <a key={m} className="mv-dock-chip">{m}</a>)}
        </span>
      </div>
      <div className="mv-body-text">{renderBody(body)}</div>
    </div>
  );
}

function MentionsQuiet({ addressees, body }) {
  // Quiet only the leading address pile-up; inline body mentions stay normal
  // because they carry semantic weight ("has @lain tried it?").
  return (
    <div className="mv-body">
      <span className="mv-body-text">
        {addressees.map((m, i) => (
          <React.Fragment key={m}>
            <a className="mv-mention-quiet">{m}</a>{' '}
          </React.Fragment>
        ))}
        {renderBody(body)}
      </span>
    </div>
  );
}

function MentionsCollapsed({ addressees, body }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mv-body">
      <span className="mv-body-text">
        <button className="mv-collapsed" onClick={() => setOpen(!open)}>
          {open
            ? <React.Fragment>{addressees.join(' ')}</React.Fragment>
            : <React.Fragment><span className="mv-collapsed-arr">→</span> to {addressees.length} {addressees.length === 1 ? 'person' : 'people'}</React.Fragment>}
        </button>{' '}
        {renderBody(body)}
      </span>
    </div>
  );
}

function MentionsHybrid({ addressees, body }) {
  const first = addressees[0];
  const rest = addressees.slice(1);
  return (
    <div className="mv-body">
      <span className="mv-body-text">
        <a className="mv-mention-full">{first}</a>
        {rest.length > 0 && (
          <span className="mv-overflow" title={rest.join(' ')}>+{rest.length}</span>
        )}{' '}
        {renderBody(body)}
      </span>
    </div>
  );
}

// ============================================================
// Thread post — shared shell
// ============================================================

function ThreadPost({ post, MentionsRenderer, hideReplyTo }) {
  return (
    <article className="mv-post">
      <div className={"mv-av " + post.avClass}/>
      <div className="mv-right">
        <header className="mv-head">
          <span className="mv-name">{post.name}</span>
          <span className="mv-handle">{post.handle.replace('@', '').replace('@', '@')}</span>
          <span className="mv-time">{post.time}</span>
        </header>
        {!hideReplyTo && (
          <div className="mv-reply-to">
            <svg viewBox="0 0 24 24" fill="none" style={{width: 12, height: 12}}><path d="M9 8H6v3M6 8c0 5 4 8 9 8h4M19 16l-3 3M19 16l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
            <span>Reply to <a>{post.replyTo}</a></span>
          </div>
        )}
        <MentionsRenderer addressees={post.addressees} body={post.body} replyTo={post.replyTo}/>
        <footer className="mv-foot">
          <button className="mv-act">↩ 1</button>
          <button className="mv-act">↻</button>
          <button className="mv-act">★</button>
          <button className="mv-act mv-act-end">⋯</button>
        </footer>
      </div>
    </article>
  );
}

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, MentionsRenderer, hideReplyTo, cheat }) {
  return (
    <div className="mv-page">
      <header className="mv-page-h">
        <div className="mv-kicker">{kicker}</div>
        <h1 className="mv-h1">{title}</h1>
        <p className="mv-sub">{sub}</p>
      </header>
      <div className="mv-thread">
        {POSTS.map((p, i) => (
          <ThreadPost key={i} post={p} MentionsRenderer={MentionsRenderer} hideReplyTo={hideReplyTo}/>
        ))}
      </div>
      {cheat && (
        <div className="mv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <div key={k} className="mv-cheat-row">
              <span className="mv-cheat-k">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Variants
// ============================================================
function Variant0() {
  return <Page kicker="V0 · BASELINE" title="As-is" sub="What we have now. Every recipient is rendered as a full-color link at body text size, at the start of every reply. Compounds across thread depth. The 3rd post also shows what mid-text mentions look like today — same treatment."
    MentionsRenderer={MentionsBaseline}
    cheat={{
      Model: 'All @mentions — leading or mid-text — styled the same way inline',
      Pros: 'No information hidden. Same behavior as Mastodon Web.',
      Cons: 'Address pile-up takes the first 1–2 lines of every reply. Visually noisy after 3+ levels.',
    }}/>;
}

function Variant1() {
  return <Page kicker="V1" title="Recipients line"
    sub='Leading addressees moved out of the body, listed below as a "pinged" footer line. Mid-text mentions (see post 3) stay inline — they carry meaning in context.'
    MentionsRenderer={MentionsDropped}
    cheat={{
      Model: 'Leading addressees → footer line. Mid-text mentions stay inline.',
      Pros: 'Body starts with content. Recipients still visible. Mid-text mentions undisturbed.',
      Cons: 'Recipients are below the body, not above — slightly unusual placement.',
      'When': 'When reading flow matters more than recipient visibility.',
    }}/>;
}

function Variant2() {
  return <Page kicker="V2 · RECOMMENDED" title="Dock above body"
    sub='A dedicated "TO:" row above the body with addressees as compact chips. Mid-text mentions (post 3) stay inline at body size — only the leading address pile-up moves to the dock.'
    MentionsRenderer={MentionsDock}
    cheat={{
      Model: 'Leading addressees → chip dock. Mid-text mentions stay inline.',
      Pros: 'Recipients prominent without competing with content. "TO:" pattern is universal. Mid-text mentions render normally.',
      Cons: 'Adds a row to every reply.',
      'When': 'Default. Good balance of recipient visibility + readability.',
    }}/>;
}

function Variant3() {
  return <Page kicker="V3" title="Quiet leading"
    sub="Leading addressees stay inline but muted (smaller, gray). Mid-text mentions (post 3) stay at full accent color — those are meaningful in context, so they don't get quieted."
    MentionsRenderer={MentionsQuiet}
    cheat={{
      Model: 'Leading addressees: muted inline. Mid-text mentions: normal inline.',
      Pros: 'No layout restructure. Lowest-effort fix. Clear visual hierarchy between address prelude and meaningful in-body mentions.',
      Cons: "Still occupies the same width. Muting reduces noise but not line count.",
      'When': "Conservative option. Good if instances want minimal markup change.",
    }}/>;
}

function Variant4() {
  return <Page kicker="V4" title="Collapsed chip"
    sub='Leading addressees collapse to one tappable chip: "→ to 3 people". Click to expand. Mid-text mentions (post 3) stay inline at full size.'
    MentionsRenderer={MentionsCollapsed}
    cheat={{
      Model: 'Leading addressees → one chip, expand on click. Mid-text mentions stay inline.',
      Pros: 'Densest option. Body content begins immediately. Mid-text mentions undisturbed.',
      Cons: 'Hides recipient list by default — some readers want to know who else is pinged before engaging.',
      'When': 'When thread depth is the priority. Could be a per-user preference.',
    }}/>;
}

function Variant5() {
  return <Page kicker="V5" title="Hybrid — addressee + overflow"
    sub='First addressee inline, the rest collapsed to a "+N" chip. Mid-text mentions (post 3) stay inline. Hover the chip to peek.'
    MentionsRenderer={MentionsHybrid}
    cheat={{
      Model: 'First addressee inline · rest as +N chip · mid-text mentions inline',
      Pros: 'Preserves the addressee (usually the parent author) inline. Reduces line count without hiding much.',
      Cons: 'Assumes first addressee is most relevant — usually true, not always.',
      'When': 'When one primary addressee + courtesy CCs is the norm.',
    }}/>;
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Inline mentions">
      <DCSection id="mentions" title="Inline mention handling — six approaches">
        <DCArtboard id="v0" label="V0 · baseline (current)"   width={580} height={760}><Variant0/></DCArtboard>
        <DCArtboard id="v1" label="V1 · recipients line"      width={580} height={760}><Variant1/></DCArtboard>
        <DCArtboard id="v2" label="V2 · dock above ★"          width={580} height={760}><Variant2/></DCArtboard>
        <DCArtboard id="v3" label="V3 · quiet inline"          width={580} height={760}><Variant3/></DCArtboard>
        <DCArtboard id="v4" label="V4 · collapsed chip"        width={580} height={760}><Variant4/></DCArtboard>
        <DCArtboard id="v5" label="V5 · hybrid"                width={580} height={760}><Variant5/></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
