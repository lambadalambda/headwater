/* global React, ReactDOM */
const { useState, useRef, useEffect, useCallback } = React;

// ============================================================
// Mock account data — shape mirrors /api/v1/accounts/search
// ============================================================
const ACCOUNTS = [
  { id: '1',  username: 'soft.hertz', acct: 'soft.hertz@kolektiva.social', display_name: 'soft.hertz ✦', avClass: 'av-grad-3',   note: 'slow web · cassette decks · taipei' },
  { id: '2',  username: 'softie',     acct: 'softie@graz.dev',             display_name: 'softie ◌',     avClass: 'av-orb',      note: 'synthwave dj · graz' },
  { id: '3',  username: 'softwave',   acct: 'softwave@retro.social',       display_name: 'softwave',     avClass: 'av-grad-2',   note: 'retro pcs · 90s web nostalgia' },
  { id: '4',  username: 'softstack',  acct: 'softstack@hub.dev',           display_name: 'softstack',    avClass: 'av-pixel-pc', note: 'systems · self-host evangelist' },
  { id: '5',  username: 'datagram',   acct: 'datagram@retro.social',       display_name: 'datagram',     avClass: 'av-pixel-pc', note: 'tiny servers, big ideas' },
  { id: '6',  username: 'gridwave',   acct: 'gridwave@retro.social',       display_name: 'gridwave',     avClass: 'av-grad-2',   note: 'electronics blog · pdx' },
  { id: '7',  username: 'orbit',      acct: 'orbit@spacebear.net',         display_name: 'orbit',        avClass: 'av-orb',      note: 'observatory updates · ldn' },
  { id: '8',  username: 'kestrel.fm', acct: 'kestrel.fm@audio.garden',     display_name: 'kestrel.fm',   avClass: 'av-grad-3',   note: 'late-night sets · ambient' },
  { id: '9',  username: 'pixelmoth',  acct: 'pixelmoth@graz.dev',          display_name: 'pixelmoth',    avClass: 'av-pixel-pc', note: 'pixel art every day' },
  { id: '10', username: 'lumen',      acct: 'lumen@spacebear.net',         display_name: 'lumen',        avClass: 'av-grad-1',   note: 'photographer · slow shutter' },
  { id: '11', username: 'feld',       acct: 'feld@pleroma.social',         display_name: 'feld',         avClass: 'av-orb',      note: 'pleroma maintainer' },
  { id: '12', username: 'lain',       acct: 'lain@pleroma.social',         display_name: 'lain',         avClass: 'av-pixel-pc', note: 'wired forever' },
];

// Mock fetch for accounts — pretends to be /api/v1/accounts/search
function searchAccounts(q) {
  if (!q) return ACCOUNTS.slice(0, 5);
  const lq = q.toLowerCase();
  return ACCOUNTS
    .filter(a =>
      a.username.toLowerCase().includes(lq) ||
      a.acct.toLowerCase().includes(lq) ||
      a.display_name.toLowerCase().includes(lq)
    )
    .slice(0, 5);
}

// ============================================================
// Helpers — find an active @-mention context at the caret
// ============================================================
function getMentionContext(editorEl) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return null;
  if (!editorEl || !editorEl.contains(range.startContainer)) return null;
  const node = range.startContainer;
  if (node.nodeType !== 3) return null;
  const offset = range.startOffset;
  const text = node.textContent.slice(0, offset);
  // @ must be preceded by start-of-text or whitespace; word chars + dots/dashes
  const m = text.match(/(^|\s)@([\w.\-]*)$/);
  if (!m) return null;
  const query = m[2];
  const startOffset = offset - (query.length + 1);
  const queryRange = document.createRange();
  queryRange.setStart(node, startOffset);
  queryRange.setEnd(node, offset);
  return { query, queryRange, node, startOffset, endOffset: offset };
}

// ============================================================
// Mention dropdown — V1 slim style + V3 [Tab] hint on selected
// ============================================================
const G = {
  kbd: (label) => <span className="mp-kbd">{label}</span>,
};

function MentionPop({ results, selIdx, onPick, query, x, y }) {
  const style = { left: x, top: y };
  if (!results.length) {
    return (
      <div className="mp-pop" style={style}>
        <div className="mp-pop-l">Suggestions</div>
        <div className="mp-pop-empty">No matches for <code>@{query}</code></div>
        <div className="mp-pop-foot">
          {G.kbd('Esc')} dismiss
        </div>
      </div>
    );
  }
  return (
    <div className="mp-pop" style={style}>
      <div className="mp-pop-l">Suggestions · {results.length} result{results.length === 1 ? '' : 's'}</div>
      <div className="mp-pop-list" role="listbox">
        {results.map((a, i) => (
          <button
            key={a.id}
            role="option"
            aria-selected={i === selIdx}
            className={"mp-row " + (i === selIdx ? 'sel' : '')}
            onMouseDown={(e) => { e.preventDefault(); onPick(a); }}>
            <span className={"mp-row-av " + a.avClass}/>
            <span className="mp-row-name">{a.display_name}</span>
            <span className="mp-row-acct">@{a.acct}</span>
            {i === selIdx && (
              <span className="mp-row-go">{G.kbd('Tab')}</span>
            )}
          </button>
        ))}
      </div>
      <div className="mp-pop-foot">
        {G.kbd('↑↓')} navigate · {G.kbd('Tab')} insert · {G.kbd('Esc')} dismiss
      </div>
    </div>
  );
}

// ============================================================
// The editor itself
// ============================================================
function MentionEditor({ onSubmit }) {
  const editorRef = useRef(null);
  const [pop, setPop] = useState(null); // { results: [], query }
  const [selIdx, setSelIdx] = useState(0);
  const [counter, setCounter] = useState(0);

  // Update dropdown based on current caret position
  const updatePop = useCallback(() => {
    const ctx = getMentionContext(editorRef.current);
    if (!ctx) { setPop(null); return; }
    const results = searchAccounts(ctx.query);
    // Anchor the dropdown to the @ position so it appears next to
    // the caret, not at the bottom of the composer.
    const editorRect = editorRef.current.getBoundingClientRect();
    const rect = ctx.queryRange.getBoundingClientRect();
    const x = Math.max(0, rect.left - editorRect.left);
    const y = rect.bottom - editorRect.top + 6;
    setPop({ results, query: ctx.query, x, y });
    setSelIdx(prev => Math.min(prev, Math.max(0, results.length - 1)));
  }, []);

  // Insert a pill at the current mention context
  const insertPill = useCallback((account) => {
    const ctx = getMentionContext(editorRef.current);
    if (!ctx) return;
    ctx.queryRange.deleteContents();

    const pill = document.createElement('span');
    pill.className = 'mp-pill';
    pill.setAttribute('contenteditable', 'false');
    pill.setAttribute('data-acct', account.acct);
    pill.setAttribute('data-display', account.display_name);
    pill.setAttribute('title', '@' + account.acct);
    // Inner: avatar + @handle text
    const av = document.createElement('span');
    av.className = 'mp-pill-av ' + account.avClass;
    pill.appendChild(av);
    const at = document.createElement('span');
    at.className = 'mp-pill-at';
    at.textContent = '@';
    pill.appendChild(at);
    const handle = document.createElement('span');
    handle.className = 'mp-pill-handle';
    handle.textContent = account.username;
    pill.appendChild(handle);

    ctx.queryRange.insertNode(pill);

    // Insert a normal space so the caret has somewhere to land
    const space = document.createTextNode('\u00A0');
    if (pill.nextSibling) {
      pill.parentNode.insertBefore(space, pill.nextSibling);
    } else {
      pill.parentNode.appendChild(space);
    }

    // Move caret after the space
    const sel = window.getSelection();
    sel.removeAllRanges();
    const r = document.createRange();
    r.setStartAfter(space);
    r.collapse(true);
    sel.addRange(r);

    setPop(null);
    setSelIdx(0);
    // Bump counter — trigger length recount
    setCounter(c => c + 1);
  }, []);

  const handleInput = () => {
    updatePop();
    setCounter(c => c + 1);
  };

  const handleKeyDown = (e) => {
    if (pop && pop.results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelIdx(i => (i + 1) % pop.results.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelIdx(i => (i - 1 + pop.results.length) % pop.results.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertPill(pop.results[selIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setPop(null);
        return;
      }
    }
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const handleBlur = () => {
    // Close dropdown on blur — but defer so click on row registers first.
    // (handled via onMouseDown e.preventDefault on rows)
    setTimeout(() => setPop(null), 60);
  };

  // Serialize the editor to plain text (pills → "@user@server")
  const serializeEditor = () => {
    const out = [];
    const walk = (node) => {
      if (node.nodeType === 3) {
        out.push(node.textContent);
      } else if (node.classList && node.classList.contains('mp-pill')) {
        out.push('@' + node.dataset.acct);
      } else if (node.tagName === 'BR') {
        out.push('\n');
      } else {
        node.childNodes.forEach(walk);
      }
    };
    editorRef.current.childNodes.forEach(walk);
    return out.join('').replace(/\u00A0/g, ' ').trim();
  };

  const submit = () => {
    const text = serializeEditor();
    if (!text) return;
    onSubmit(text);
    editorRef.current.innerHTML = '';
    setPop(null);
    setCounter(0);
  };

  // Compute character count (mirroring serialize)
  const charCount = (() => {
    if (!editorRef.current) return 0;
    return serializeEditor().length;
  })();

  // Suppress unused warning — counter triggers re-render after each input
  void counter;

  return (
    <div className="mp-composer">
      <div className="mp-composer-av av-grad-1"/>
      <div className="mp-composer-right">
        <div
          ref={editorRef}
          className="mp-editor"
          contentEditable
          suppressContentEditableWarning
          spellCheck="false"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          data-placeholder="What's on your mind? Try @soft, @data, or @lain…"
        />
        {pop && <MentionPop results={pop.results} selIdx={selIdx} onPick={insertPill} query={pop.query} x={pop.x} y={pop.y}/>}
        <div className="mp-composer-foot">
          <span className="mp-foot-l">{500 - charCount}</span>
          <span className="mp-foot-mid">
            {G.kbd('@')} to mention · {G.kbd('⌘↵')} to post
          </span>
          <button className="mp-post" onClick={submit} disabled={charCount === 0}>Post</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Rendered post — mentions stay plain colored text (per spec).
// We parse @user@server out of the serialized string.
// ============================================================
const MENTION_RE = /@[\w.\-]+(?:@[\w.\-]+)?/g;

function renderBody(text) {
  const out = [];
  let last = 0;
  let key = 0;
  MENTION_RE.lastIndex = 0;
  let m;
  while ((m = MENTION_RE.exec(text)) !== null) {
    if (m.index > last) out.push(<span key={key++}>{text.slice(last, m.index)}</span>);
    out.push(<a key={key++} className="mp-mention-inline">{m[0]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={key++}>{text.slice(last)}</span>);
  return out;
}

function PostedPost({ body, time }) {
  return (
    <article className="mp-posted">
      <div className="mp-posted-av av-grad-1"/>
      <div style={{minWidth: 0, flex: 1}}>
        <header className="mp-posted-head">
          <span className="mp-posted-name">you</span>
          <span className="mp-posted-handle">@you@pleromanet.social</span>
          <span className="mp-posted-time">{time}</span>
        </header>
        <div className="mp-posted-body">{renderBody(body)}</div>
      </div>
    </article>
  );
}

// ============================================================
// App shell
// ============================================================
function relTime(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.round(s / 60) + 'm';
  return Math.round(s / 3600) + 'h';
}

function App() {
  const [posts, setPosts] = useState([]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mp-shell">
      <header className="mp-head">
        <div className="mp-kicker">PROTOTYPE</div>
        <h1 className="mp-h1">Mention autocomplete · live</h1>
        <p className="mp-sub">
          Type <code>@</code> followed by part of a username — the dropdown opens with matching accounts.
          Press <span className="mp-kbd">↑↓</span> to navigate, <span className="mp-kbd">Tab</span> or <span className="mp-kbd">↵</span> to insert. The selected user
          becomes an inline pill atom inside the editable area; <span className="mp-kbd">Backspace</span> at its right edge deletes the whole mention.
          When you post, the mention serializes back to <code>@user@server</code>.
          Try names like <code>soft</code>, <code>data</code>, <code>retro</code>, or <code>lain</code>.
        </p>
      </header>

      <MentionEditor onSubmit={(text) => {
        setPosts(p => [{ body: text, at: Date.now() }, ...p]);
      }}/>

      <div className="mp-feed">
        {posts.length === 0 && (
          <div className="mp-empty">
            Nothing posted yet. The composer is above — try mentioning someone.
          </div>
        )}
        {posts.map((p, i) => (
          <PostedPost key={p.at} body={p.body} time={relTime(now - p.at) + ' ago'}/>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
