/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState } = React;

// ============================================================
// Poll variants — two surfaces, several variants each.
//
//   Section A — Poll creator (inside composer)
//     A1 · Inline panel under textarea         (★ recommended)
//     A2 · Modal poll builder
//     A3 · Right-rail sidebar editor
//
//   Section B — Poll display (inside feed posts)
//     B1 · Voting state (radio rows)            — single choice
//     B2 · Voting state (check rows)            — multi-choice
//     B3 · Results — overlay bars               (★ recommended)
//     B4 · Results — horizontal bar chart
//     B5 · Results — vertical bar chart         (wildcard)
//     B6 · Ended / expired state
// ============================================================

// ---------- Inline glyphs ----------
const G = {
  poll: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="14" height="14" {...p}><path d="M3 13V8M8 13V3M13 13v-4"/></svg>,
  image: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16" {...p}><rect x="2" y="3" width="12" height="10" rx="1"/><circle cx="5.5" cy="6.5" r="1"/><path d="M2 11l3-3 4 4 2-2 3 3"/></svg>,
  smile: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16" {...p}><circle cx="8" cy="8" r="6"/><circle cx="6" cy="7" r="0.7" fill="currentColor"/><circle cx="10" cy="7" r="0.7" fill="currentColor"/><path d="M5.5 10.2c1.2 1.1 3.8 1.1 5 0"/></svg>,
  x: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="14" height="14" {...p}><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  plus: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" width="14" height="14" {...p}><path d="M8 3v10M3 8h10"/></svg>,
  grip: (p) => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12" {...p}><circle cx="6" cy="4" r="1"/><circle cx="10" cy="4" r="1"/><circle cx="6" cy="8" r="1"/><circle cx="10" cy="8" r="1"/><circle cx="6" cy="12" r="1"/><circle cx="10" cy="12" r="1"/></svg>,
  check: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M3 8l3 3 7-7"/></svg>,
  reply: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
  boost: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5"/></svg>,
  star: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" width="14" height="14" {...p}><path d="M8 2l1.7 3.9 4.3.4-3.2 2.9.9 4.2L8 11.2 4.3 13.4l.9-4.2L2 6.3l4.3-.4L8 2z"/></svg>,
  more: (p) => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" {...p}><circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12" cy="8" r="1.3"/></svg>,
};

// ============================================================
// Page wrapper + cheat-strip
// ============================================================
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="pv-page">
      <header className="pv-page-h">
        <div className="pv-kicker">{kicker}</div>
        <h1 className="pv-h1">{title}</h1>
        <p className="pv-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="pv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="pv-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="pv-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// SECTION A — POLL CREATOR
// ============================================================

// Sample state shared by all creator variants
function useCreator() {
  const [opts, setOpts] = useState(['warm cassette', 'cold terminal', 'spinning vinyl', '']);
  const [duration, setDuration] = useState('24h');
  const [multi, setMulti] = useState(false);
  const [hideUntil, setHideUntil] = useState(true);
  return { opts, setOpts, duration, setDuration, multi, setMulti, hideUntil, setHideUntil };
}

function OptionRow({ value, onChange, onRemove, removable, placeholder, idx }) {
  const overflow = (value || '').length > 25;
  return (
    <div className="pv-opt-row">
      <span className="pv-opt-handle"><G.grip/></span>
      <input
        className="pv-opt-input"
        value={value}
        placeholder={placeholder || `Choice ${idx + 1}`}
        onChange={e => onChange(e.target.value)}
        maxLength={50}
      />
      <span className={"pv-opt-counter " + (overflow ? 'over' : '')}>{(value || '').length}/50</span>
      <button className={"pv-opt-x " + (removable ? '' : 'disabled')} onClick={onRemove}>
        <G.x/>
      </button>
    </div>
  );
}

function PollSettings({ duration, setDuration, multi, setMulti, hideUntil, setHideUntil }) {
  return (
    <div className="pv-poll-settings">
      <div className="pv-setting">
        <label className="pv-setting-l">Duration</label>
        <select className="pv-select" value={duration} onChange={e => setDuration(e.target.value)}>
          <option value="5m">5 minutes</option>
          <option value="1h">1 hour</option>
          <option value="6h">6 hours</option>
          <option value="24h">24 hours</option>
          <option value="3d">3 days</option>
          <option value="7d">7 days</option>
        </select>
      </div>
      <div className="pv-setting">
        <label className="pv-setting-l">Voting</label>
        <select className="pv-select" value={multi ? 'multi' : 'single'} onChange={e => setMulti(e.target.value === 'multi')}>
          <option value="single">Single choice</option>
          <option value="multi">Multiple choices</option>
        </select>
      </div>
      <label className="pv-setting-toggle" style={{gridColumn: '1 / -1'}}>
        <span className={"pv-toggle " + (hideUntil ? 'on' : '')} onClick={e => { e.preventDefault(); setHideUntil(!hideUntil); }}/>
        <span>Hide totals until poll ends</span>
      </label>
    </div>
  );
}

function Composer({ children, panelOpen }) {
  return (
    <div className="pv-composer">
      <div className="pv-composer-row">
        <div className="pv-composer-av"/>
        <textarea
          className="pv-composer-input"
          rows={2}
          defaultValue="which side wins?"
          placeholder="What's on your mind?"
        />
      </div>
      {children}
      <div className="pv-composer-tools">
        <button className="pv-composer-tool" title="Image"><G.image/></button>
        <button className={"pv-composer-tool " + (panelOpen ? 'active' : '')} title="Poll"><G.poll/></button>
        <button className="pv-composer-tool" title="Emoji"><G.smile/></button>
        <span className="pv-composer-spacer"/>
        <span className="pv-composer-count">487</span>
        <button className="pv-composer-submit">Post</button>
      </div>
    </div>
  );
}

// ---------- A1 · Inline panel under textarea ★ ----------
function A1() {
  const c = useCreator();
  const setOpt = (i, v) => c.setOpts(arr => arr.map((x, j) => j === i ? v : x));
  const removeOpt = (i) => c.setOpts(arr => arr.filter((_, j) => j !== i));
  const addOpt = () => c.setOpts(arr => arr.length < 6 ? [...arr, ''] : arr);
  const removable = c.opts.length > 2;
  return (
    <Composer panelOpen={true}>
      <div className="pv-a1-panel">
        <div className="pv-a1-head">
          <G.poll/> Poll · 2–6 choices
          <button className="pv-a1-x"><G.x/></button>
        </div>
        {c.opts.map((o, i) => (
          <OptionRow
            key={i}
            idx={i}
            value={o}
            onChange={v => setOpt(i, v)}
            onRemove={() => removeOpt(i)}
            removable={removable}
          />
        ))}
        <button className={"pv-add-opt " + (c.opts.length >= 6 ? 'disabled' : '')} onClick={addOpt}>
          <G.plus/> Add choice
        </button>
        <PollSettings {...c}/>
      </div>
    </Composer>
  );
}

// ---------- A2 · Modal builder ----------
function A2() {
  const c = useCreator();
  const setOpt = (i, v) => c.setOpts(arr => arr.map((x, j) => j === i ? v : x));
  const removeOpt = (i) => c.setOpts(arr => arr.filter((_, j) => j !== i));
  const addOpt = () => c.setOpts(arr => arr.length < 6 ? [...arr, ''] : arr);
  const removable = c.opts.length > 2;
  return (
    <>
      <Composer panelOpen={true}/>
      <div className="pv-a2-modal">
        <div className="pv-a2-head">
          <div>
            <div className="pv-a2-head-title">Create a poll</div>
            <div className="pv-a2-head-sub">attaches to your post</div>
          </div>
          <button className="pv-a2-x"><G.x/></button>
        </div>
        <div className="pv-a2-body">
          <div className="pv-a2-field">
            <span className="pv-a2-field-l">Choices</span>
            <div>
              {c.opts.map((o, i) => (
                <OptionRow
                  key={i}
                  idx={i}
                  value={o}
                  onChange={v => setOpt(i, v)}
                  onRemove={() => removeOpt(i)}
                  removable={removable}
                />
              ))}
              <button className={"pv-add-opt " + (c.opts.length >= 6 ? 'disabled' : '')}>
                <G.plus/> Add choice
              </button>
            </div>
          </div>
          <div className="pv-a2-field">
            <span className="pv-a2-field-l">Settings</span>
            <PollSettings {...c}/>
          </div>
        </div>
        <div className="pv-a2-foot">
          <span className="pv-a2-foot-hint">Choices · 2–6 · 50 chars each</span>
          <button className="pv-a2-cancel">Cancel</button>
          <button className="pv-composer-submit">Attach poll →</button>
        </div>
      </div>
    </>
  );
}

// ---------- A3 · Sidebar editor ----------
function A3() {
  const c = useCreator();
  const setOpt = (i, v) => c.setOpts(arr => arr.map((x, j) => j === i ? v : x));
  const removeOpt = (i) => c.setOpts(arr => arr.filter((_, j) => j !== i));
  const addOpt = () => c.setOpts(arr => arr.length < 6 ? [...arr, ''] : arr);
  const removable = c.opts.length > 2;
  const filled = c.opts.filter(o => o.trim()).length;
  return (
    <div className="pv-a3-split">
      <Composer panelOpen={true}/>
      <aside className="pv-a3-side">
        <div className="pv-a3-side-h">
          <G.poll/> Poll attached
        </div>
        <div className="pv-a3-stack">
          {c.opts.map((o, i) => (
            <OptionRow
              key={i}
              idx={i}
              value={o}
              onChange={v => setOpt(i, v)}
              onRemove={() => removeOpt(i)}
              removable={removable}
            />
          ))}
          <button className={"pv-add-opt " + (c.opts.length >= 6 ? 'disabled' : '')}>
            <G.plus/> Add choice
          </button>
        </div>
        <PollSettings {...c}/>
        <div className="pv-a3-preview">
          {filled}/{c.opts.length} choices · ends in {c.duration} · {c.multi ? 'multiple' : 'single'} · totals {c.hideUntil ? 'hidden' : 'visible'} until end
        </div>
      </aside>
    </div>
  );
}

// ============================================================
// SECTION B — POLL DISPLAY (in feed)
// ============================================================

const POLL_POST = {
  name: 'kestrel.fm',
  handle: '@kestrel@audio.garden',
  avClass: 'av-grad-3',
  time: '4h',
  body: "which side wins?",
};
const RESULTS = [
  { id: 'warm', label: 'warm cassette',  votes: 142, winner: false, me: true  },
  { id: 'cold', label: 'cold terminal',  votes: 38,  winner: false, me: false },
  { id: 'vinyl',label: 'spinning vinyl', votes: 214, winner: true,  me: false },
];
const TOTAL_VOTES = RESULTS.reduce((s, r) => s + r.votes, 0);
const pct = r => Math.round((r.votes / TOTAL_VOTES) * 100);

function PostShell({ children, meta }) {
  return (
    <div className="pv-feed">
      <article className="pv-post">
        <div className={"pv-post-av " + POLL_POST.avClass}/>
        <div className="pv-post-right">
          <header className="pv-post-head">
            <span className="pv-post-name">{POLL_POST.name}</span>
            <span className="pv-post-handle">{POLL_POST.handle}</span>
            <span className="pv-post-time">{POLL_POST.time}</span>
          </header>
          <div className="pv-post-body">{POLL_POST.body}</div>
          {children}
          {meta}
          <div className="pv-post-actions">
            <button className="pv-post-action"><G.reply/><span>{TOTAL_VOTES > 0 ? 24 : 0}</span></button>
            <button className="pv-post-action"><G.boost/><span>12</span></button>
            <button className="pv-post-action"><G.star/><span>48</span></button>
            <button className="pv-post-action" style={{marginLeft: 'auto'}}><G.more/></button>
          </div>
        </div>
      </article>
    </div>
  );
}

function PollMeta({ live = true, ended = '', totalVotes = TOTAL_VOTES, voted = false }) {
  return (
    <div className="pv-poll-meta">
      <span className="pv-ended-pill" {...(live ? {className: 'pv-ended-pill live'} : {})}>
        <span className="pv-dot"/>
        {live ? `Ends in ${ended || '6h 12m'}` : `Ended ${ended || '2d ago'}`}
      </span>
      <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
      {voted && <><span className="dot">·</span><span>you voted</span></>}
    </div>
  );
}

// ---------- B1 · Voting state (single choice, radio) ----------
function B1() {
  const [picked, setPicked] = useState(null);
  return (
    <PostShell meta={<PollMeta voted={false}/>}>
      <div className="pv-poll">
        {RESULTS.map(r => (
          <button
            key={r.id}
            className={"pv-poll-opt " + (picked === r.id ? 'selected' : '')}
            onClick={() => setPicked(r.id)}>
            <span className="pv-radio"/>
            <span className="pv-poll-opt-text">{r.label}</span>
          </button>
        ))}
      </div>
      <div className="pv-poll-foot">
        <button className="pv-poll-vote" disabled={!picked}>Vote</button>
        <button className="pv-poll-results-link">View results →</button>
      </div>
    </PostShell>
  );
}

// ---------- B2 · Voting state (multi-choice, checkboxes) ----------
function B2() {
  const [picked, setPicked] = useState(new Set(['warm']));
  const toggle = id => setPicked(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  return (
    <PostShell meta={<PollMeta voted={false}/>}>
      <div className="pv-poll">
        {RESULTS.map(r => (
          <button
            key={r.id}
            className={"pv-poll-opt " + (picked.has(r.id) ? 'selected' : '')}
            onClick={() => toggle(r.id)}>
            <span className="pv-check"/>
            <span className="pv-poll-opt-text">{r.label}</span>
          </button>
        ))}
      </div>
      <div className="pv-poll-foot">
        <button className="pv-poll-vote" disabled={picked.size === 0}>Vote · {picked.size} selected</button>
        <button className="pv-poll-results-link">View results →</button>
      </div>
    </PostShell>
  );
}

// ---------- B3 · Results — overlay bars ★ ----------
function B3() {
  return (
    <PostShell meta={<PollMeta voted={true}/>}>
      <div className="pv-poll">
        {RESULTS.map(r => (
          <div key={r.id} className={"pv-result " + (r.winner ? 'winner ' : '') + (r.me ? 'me ' : '')}>
            <span className="pv-result-bar" style={{width: pct(r) + '%'}}/>
            <span className="pv-result-tick">{r.me ? <G.check/> : null}</span>
            <span className="pv-result-text">
              {r.label}
              {r.me && <span className="pv-you">Your vote</span>}
            </span>
            <span className="pv-result-pct">{pct(r)}%</span>
          </div>
        ))}
      </div>
    </PostShell>
  );
}

// ---------- B4 · Horizontal bar chart ----------
function B4() {
  return (
    <PostShell meta={<PollMeta voted={true}/>}>
      <div className="pv-b3" style={{border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel-2)', margin: '10px 0 4px'}}>
        {RESULTS.map(r => (
          <div key={r.id} className={"pv-b3-row " + (r.winner ? 'winner ' : '') + (r.me ? 'me ' : '')}>
            <div>
              <div className="pv-b3-label">
                {r.label}
                {r.me && <span className="pv-you">You</span>}
              </div>
              <div className="pv-b3-track">
                <div className="pv-b3-fill" style={{width: pct(r) + '%'}}/>
              </div>
            </div>
            <div>
              <div className="pv-b3-pct">{pct(r)}%</div>
              <div className="pv-b3-num">{r.votes}</div>
            </div>
          </div>
        ))}
      </div>
    </PostShell>
  );
}

// ---------- B5 · Vertical bar chart (wildcard) ----------
function B5() {
  const max = Math.max(...RESULTS.map(r => r.votes));
  return (
    <PostShell meta={<PollMeta voted={true}/>}>
      <div className="pv-b4" style={{border: '1px solid var(--border)', borderRadius: 4, background: 'var(--panel-2)', margin: '10px 0 4px'}}>
        <div className="pv-b4-question">votes · 394 total</div>
        <div className="pv-b4-chart">
          {RESULTS.map(r => (
            <div key={r.id} className={"pv-b4-col " + (r.winner ? 'winner ' : '') + (r.me ? 'me ' : '')}>
              <div className="pv-b4-bar" style={{height: `${(r.votes / max) * 100}%`}}>
                <span className="pv-b4-bar-pct">{pct(r)}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pv-b4-labels">
          {RESULTS.map(r => (
            <div key={r.id} className="pv-b4-label">
              <span title={r.label}>{r.label}</span>
              {r.me && <span className="pv-you">You</span>}
            </div>
          ))}
        </div>
      </div>
    </PostShell>
  );
}

// ---------- B6 · Ended / expired state ----------
function B6() {
  return (
    <PostShell meta={<PollMeta live={false} ended="2d ago" voted={true}/>}>
      <div className="pv-poll">
        {RESULTS.map(r => (
          <div key={r.id} className={"pv-result " + (r.winner ? 'winner ' : '') + (r.me ? 'me ' : '')}>
            <span className="pv-result-bar" style={{width: pct(r) + '%'}}/>
            <span className="pv-result-tick">{r.me ? <G.check/> : null}</span>
            <span className="pv-result-text">
              {r.label}
              {r.me && <span className="pv-you">Your vote</span>}
              {r.winner && <span className="pv-you" style={{background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)'}}>Winner</span>}
            </span>
            <span className="pv-result-pct">{pct(r)}%</span>
          </div>
        ))}
      </div>
    </PostShell>
  );
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Poll variants">

      <DCSection
        id="poll-creator"
        title="A · Poll creator — inside the composer"
        subtitle="The composer already has a poll button but no UI behind it. Three patterns for the editor itself: an inline panel that grows the composer (low-friction), a modal builder (focused), and a right-rail sidebar (always-visible). All three share the same option rows, settings and constraints (2–6 choices, 50 chars each, 5 min–7 days duration, single/multi, hide-until-end).">

        <DCArtboard id="a1" label="A1 · inline panel ★" width={680} height={920}>
          <Page
            kicker="A1 · RECOMMENDED"
            title="Inline panel"
            sub="Click the poll button → an accent-tinted panel slides in below the textarea, indented to align with the composer body. Drag-handles, per-option char counters, remove × per row (disabled when there are only 2). Settings live at the bottom: duration, voting mode, hide-totals."
            cheat={{
              Surface: 'In-composer · accent-tinted panel · inline',
              Choices: '2–6 · 50 char each · drag-reorder · per-row counter',
              Settings: 'Duration · single/multi · hide totals · all collapsed',
              Best: 'Default · keeps composer flow intact',
            }}>
            <A1/>
          </Page>
        </DCArtboard>

        <DCArtboard id="a2" label="A2 · modal builder" width={680} height={1100}>
          <Page
            kicker="A2"
            title="Modal builder"
            sub="Click the poll button → a focused card opens with its own header, fields and submit. Attaches the poll to the in-progress post. More room for fields, but takes the user out of the composer flow."
            cheat={{
              Surface: 'Modal · own header + foot · attach-back to post',
              Wins: 'Roomy · clearer 2-column field layout',
              Trade: 'Takes user out of post flow · 2 dismiss surfaces',
              Best: 'When poll creation is rare / heavy-weight',
            }}>
            <A2/>
          </Page>
        </DCArtboard>

        <DCArtboard id="a3" label="A3 · sidebar editor" width={920} height={780}>
          <Page
            kicker="A3 · WILDCARD"
            title="Right-rail sidebar"
            sub="Composer keeps its full width; the poll editor lives in a 320px right rail panel. Always-visible while typing — the user can flip between editing copy and editing the poll without losing either. Wider compose surface."
            cheat={{
              Surface: 'Side-by-side · 320px right rail · permanent',
              Wins: 'Copy + poll editable at once · live preview footer',
              Trade: 'Wider · doesn\'t fit narrow viewports · novel pattern',
              Best: 'Desktop-heavy · power users · polls common',
            }}>
            <A3/>
          </Page>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="poll-display"
        title="B · Poll display — inside feed posts"
        subtitle='Same poll content rendered six ways: single-choice voting, multi-choice voting, three result treatments (overlay bars · horizontal chart · vertical chart), and the ended/expired state. Each plugs into the existing post shell as an attachment-style block, so the surrounding chrome (avatar, head, actions) is unchanged.'>

        <DCArtboard id="b1" label="B1 · voting · single choice" width={620} height={580}>
          <Page
            kicker="B1"
            title="Voting · single choice"
            sub="Radio rows. Hover tints the row. Vote button stays disabled until a choice is made. View-results link lets curious users skip ahead without voting."
            cheat={{
              State: 'Live · not voted · single choice',
              Affordance: 'Radio row · disabled vote until pick',
              Companion: 'B3 results · same row geometry',
            }}>
            <B1/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b2" label="B2 · voting · multi" width={620} height={580}>
          <Page
            kicker="B2"
            title="Voting · multiple choices"
            sub="Same row geometry, but checkmarks. Vote button shows the count of selections. The first checkbox is pre-picked here to show the on-state."
            cheat={{
              State: 'Live · not voted · multi-choice',
              Affordance: 'Check row · vote shows count',
              Companion: 'B3 results · same row geometry',
            }}>
            <B2/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b3" label="B3 · results · overlay bars ★" width={620} height={560}>
          <Page
            kicker="B3 · RECOMMENDED"
            title="Results · overlay bars"
            sub="Same row geometry as the voting state — but the row background fills proportionally and percentage is shown on the right. The user's vote gets a check mark and a small 'Your vote' chip; the winner uses the stronger accent fill. No layout shift between voting and results."
            cheat={{
              Style: 'Bar-as-background · same row geometry as voting',
              Wins: 'No layout shift · winning row reads at-a-glance',
              Highlights: 'Your vote (check + chip) · Winner (stronger fill)',
              Best: 'Default · the cleanest map of voting → results',
            }}>
            <B3/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b4" label="B4 · results · horizontal chart" width={620} height={620}>
          <Page
            kicker="B4"
            title="Results · horizontal bar chart"
            sub="Each row gets its own track + fill + percentage + raw vote count. Reads more like an analytics card. Better when raw vote counts matter; the chart visual is more chart, less list."
            cheat={{
              Style: 'Two-column · label + count · track + fill',
              Wins: 'Raw vote counts visible alongside percent',
              Trade: 'Different geometry than voting state · slight layout shift',
              Best: 'High-engagement polls where vote count matters',
            }}>
            <B4/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b5" label="B5 · results · vertical chart" width={620} height={680}>
          <Page
            kicker="B5 · WILDCARD"
            title="Results · vertical bars"
            sub="Polls as little column charts. Percentage floats above each bar; labels under. Reads more like a Twitter-poll-evolved · works best for 2–4 short-label options. Falls apart with 6 long labels."
            cheat={{
              Style: 'Vertical bars · percentage above · label under',
              Wins: 'Visually distinct · feels editorial · scans quickly',
              Trade: 'Long labels squeeze · works to ~4 choices',
              Best: '2–4 option polls · audio / image-style decisions',
            }}>
            <B5/>
          </Page>
        </DCArtboard>

        <DCArtboard id="b6" label="B6 · ended state" width={620} height={580}>
          <Page
            kicker="B6"
            title="Ended / expired"
            sub="B3 results, but the live pill flips to a muted Ended pill, vote button is gone, and the winner gets a small filled 'Winner' chip alongside the user's 'Your vote' chip. Same row geometry to keep it consistent."
            cheat={{
              State: 'Ended · voted',
              Changes: 'Live pill → ended pill · Winner chip · no voting affordance',
              Geometry: 'Same as B3 · no layout shift',
            }}>
            <B6/>
          </Page>
        </DCArtboard>

      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
