/* global React */
// ============================================================
// <MentionEditor/>
// A contenteditable composer with @-mention autocomplete.
// Drops in as a replacement for a <textarea/>. Exposes
// imperative methods (clear, focus, insertText) via ref so the
// host composer can still drive post-submit + character count.
//
// Props:
//   onChange(text)     — fires with serialized text (mentions
//                        as the federated @user@server form)
//   onSubmit()         — fires on Cmd/Ctrl+Enter
//   placeholder        — placeholder string for the empty state
//   searchAccounts     — async/sync (query: string) → AccountRow[]
//                        Defaults to an in-memory mock; the host
//                        can pass a /api/v1/accounts/search bridge.
//   autoFocus          — whether to focus on mount
//
// Ref methods (forwarded):
//   clear()        — wipe the editor
//   focus()        — focus the editor
//   insertText(s)  — append text at the end (used by oekaki etc.)
//   getText()      — read the current serialized text
// ============================================================
const { useState: useStateME, useRef: useRefME, useCallback: useCBME, forwardRef: fwdME, useImperativeHandle: useImpME } = React;

// Default mock accounts. Hosts override via the searchAccounts prop.
const ME_DEFAULT_ACCOUNTS = [
  { id: '1',  username: 'soft.hertz', acct: 'soft.hertz@kolektiva.social', display_name: 'soft.hertz ✦', avClass: 'av-grad-3'   },
  { id: '2',  username: 'softie',     acct: 'softie@graz.dev',             display_name: 'softie ◌',     avClass: 'av-orb'      },
  { id: '3',  username: 'softwave',   acct: 'softwave@retro.social',       display_name: 'softwave',     avClass: 'av-grad-2'   },
  { id: '5',  username: 'datagram',   acct: 'datagram@retro.social',       display_name: 'datagram',     avClass: 'av-pixel-pc' },
  { id: '6',  username: 'gridwave',   acct: 'gridwave@retro.social',       display_name: 'gridwave',     avClass: 'av-grad-2'   },
  { id: '7',  username: 'orbit',      acct: 'orbit@spacebear.net',         display_name: 'orbit',        avClass: 'av-orb'      },
  { id: '8',  username: 'kestrel.fm', acct: 'kestrel.fm@audio.garden',     display_name: 'kestrel.fm',   avClass: 'av-grad-3'   },
  { id: '9',  username: 'pixelmoth',  acct: 'pixelmoth@graz.dev',          display_name: 'pixelmoth',    avClass: 'av-pixel-pc' },
  { id: '10', username: 'lumen',      acct: 'lumen@spacebear.net',         display_name: 'lumen',        avClass: 'av-grad-1'   },
  { id: '11', username: 'feld',       acct: 'feld@pleroma.social',         display_name: 'feld',         avClass: 'av-orb'      },
  { id: '12', username: 'lain',       acct: 'lain@pleroma.social',         display_name: 'lain',         avClass: 'av-pixel-pc' },
];
function meDefaultSearch(q) {
  if (!q) return ME_DEFAULT_ACCOUNTS.slice(0, 5);
  const lq = q.toLowerCase();
  return ME_DEFAULT_ACCOUNTS
    .filter(a =>
      a.username.toLowerCase().includes(lq) ||
      a.acct.toLowerCase().includes(lq) ||
      a.display_name.toLowerCase().includes(lq)
    )
    .slice(0, 5);
}

// Find an active autocomplete trigger at the caret.
// Returns { type: 'mention' | 'emoji', query, queryRange, ... } or null.
function meGetTriggerContext(editorEl) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!range.collapsed) return null;
  if (!editorEl || !editorEl.contains(range.startContainer)) return null;
  const node = range.startContainer;
  if (node.nodeType !== 3) return null;
  const offset = range.startOffset;
  const text = node.textContent.slice(0, offset);
  // @user@server pattern — must be preceded by start-of-text or whitespace
  let m = text.match(/(^|\s)@([\w.\-]*)$/);
  if (m) {
    const query = m[2];
    const startOffset = offset - (query.length + 1);
    const queryRange = document.createRange();
    queryRange.setStart(node, startOffset);
    queryRange.setEnd(node, offset);
    return { type: 'mention', query, queryRange, node, startOffset, endOffset: offset };
  }
  // :shortcode pattern — same prefix rules. Min 2 chars to avoid noise
  // from common smileys (':-)' / ':)') and emoticons in casual text.
  m = text.match(/(^|\s):([\w+-]{2,})$/);
  if (m) {
    const query = m[2];
    const startOffset = offset - (query.length + 1);
    const queryRange = document.createRange();
    queryRange.setStart(node, startOffset);
    queryRange.setEnd(node, offset);
    return { type: 'emoji', query, queryRange, node, startOffset, endOffset: offset };
  }
  return null;
}

const meKbd = (label) => <span className="me-kbd">{label}</span>;

// ---- Mention rows (existing) ----
function MeMentionPop({ results, selIdx, onPick, query, x, y }) {
  const style = { left: x, top: y };
  if (!results.length) {
    return (
      <div className="me-pop" style={style}>
        <div className="me-pop-l">Suggestions</div>
        <div className="me-pop-empty">No matches for <code>@{query}</code></div>
        <div className="me-pop-foot">{meKbd('Esc')} dismiss</div>
      </div>
    );
  }
  return (
    <div className="me-pop" style={style}>
      <div className="me-pop-l">Suggestions · {results.length} result{results.length === 1 ? '' : 's'}</div>
      <div className="me-pop-list" role="listbox">
        {results.map((a, i) => (
          <button
            key={a.id}
            role="option"
            aria-selected={i === selIdx}
            className={"me-row " + (i === selIdx ? 'sel' : '')}
            onMouseDown={(e) => { e.preventDefault(); onPick(a); }}>
            <span className={"me-row-av " + a.avClass}/>
            <span className="me-row-name">{a.display_name}</span>
            <span className="me-row-acct">@{a.acct}</span>
            {i === selIdx && <span className="me-row-go">{meKbd('Tab')}</span>}
          </button>
        ))}
      </div>
      <div className="me-pop-foot">
        {meKbd('↑↓')} navigate · {meKbd('Tab')} insert · {meKbd('Esc')} dismiss
      </div>
    </div>
  );
}

// ---- Emoji shortcode rows (new) ----
function MeEmojiPop({ results, selIdx, onPick, query, x, y }) {
  const style = { left: x, top: y };
  if (!results.length) {
    return (
      <div className="me-pop" style={style}>
        <div className="me-pop-l">Emoji</div>
        <div className="me-pop-empty">No matches for <code>:{query}:</code></div>
        <div className="me-pop-foot">{meKbd('Esc')} dismiss</div>
      </div>
    );
  }
  return (
    <div className="me-pop" style={style}>
      <div className="me-pop-l">Emoji · {results.length} match{results.length === 1 ? '' : 'es'}</div>
      <div className="me-pop-list" role="listbox">
        {results.map((e, i) => {
          const sw = e.swatch || ('em-cx-' + e.shortcode);
          return (
            <button
              key={e.shortcode}
              role="option"
              aria-selected={i === selIdx}
              className={"me-row " + (i === selIdx ? 'sel' : '')}
              onMouseDown={(ev) => { ev.preventDefault(); onPick(e); }}>
              <span className={"me-row-emoji " + sw}>
                <span className="me-emoji-i">{e.shortcode.slice(0, 2).toUpperCase()}</span>
              </span>
              <span className="me-row-sc">:{e.shortcode}:</span>
              <span className="me-row-pack">{e.pack}</span>
              {i === selIdx && <span className="me-row-go">{meKbd('Tab')}</span>}
            </button>
          );
        })}
      </div>
      <div className="me-pop-foot">
        {meKbd('↑↓')} navigate · {meKbd('Tab')} insert · {meKbd('Esc')} dismiss
      </div>
    </div>
  );
}

// Serialize an editor element to plain text. Atoms become their
// canonical text form:
//   .me-pill  → "@user@server"  (data-acct attribute)
//   .me-emoji → ":shortcode:"   (data-shortcode attribute)
function meSerialize(editorEl) {
  if (!editorEl) return '';
  const out = [];
  const walk = (node) => {
    if (node.nodeType === 3) {
      out.push(node.textContent);
    } else if (node.classList && node.classList.contains('me-pill')) {
      out.push('@' + node.dataset.acct);
    } else if (node.classList && node.classList.contains('me-emoji')) {
      out.push(':' + node.dataset.shortcode + ':');
    } else if (node.tagName === 'BR') {
      out.push('\n');
    } else {
      node.childNodes.forEach(walk);
    }
  };
  editorEl.childNodes.forEach(walk);
  return out.join('').replace(/\u00A0/g, ' ');
}

const MentionEditor = fwdME(function MentionEditor(
  { onChange, onSubmit, placeholder = "What's on your mind?",
    searchAccounts = meDefaultSearch, searchEmoji,
    autoFocus = false, className = '' },
  ref
) {
  const editorRef = useRefME(null);
  // pop = { type: 'mention'|'emoji', results, query, x, y }
  const [pop, setPop] = useStateME(null);
  const [selIdx, setSelIdx] = useStateME(0);

  // Default emoji searcher uses the shared window.searchEmoji from emoji-data.jsx
  const emojiSearcher = searchEmoji || (typeof window !== 'undefined' && window.searchEmoji) || (() => []);

  // ---- imperative API for the host ----
  useImpME(ref, () => ({
    clear: () => {
      if (editorRef.current) editorRef.current.innerHTML = '';
      onChange && onChange('');
    },
    focus: () => editorRef.current?.focus(),
    getText: () => meSerialize(editorRef.current),
    insertText: (s) => {
      if (!editorRef.current) return;
      const tn = document.createTextNode(s);
      editorRef.current.appendChild(tn);
      const sel = window.getSelection();
      sel.removeAllRanges();
      const r = document.createRange();
      r.setStartAfter(tn);
      r.collapse(true);
      sel.addRange(r);
      onChange && onChange(meSerialize(editorRef.current));
    },
    // Insert a custom emoji atom at the current caret position.
    // Used by the standalone EmojiPicker.
    insertEmoji: (emoji) => {
      const el = editorRef.current;
      if (!el) return;
      el.focus();
      let sel = window.getSelection();
      let range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      // If the caret is outside the editor, append at the end.
      if (!range || !el.contains(range.startContainer)) {
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
      }
      const atom = window.makeEmojiAtom
        ? window.makeEmojiAtom(emoji)
        : (function fallback() {
            const s = document.createTextNode(':' + emoji.shortcode + ':');
            return s;
          })();
      range.deleteContents();
      range.insertNode(atom);
      const space = document.createTextNode('\u00A0');
      if (atom.nextSibling) atom.parentNode.insertBefore(space, atom.nextSibling);
      else atom.parentNode.appendChild(space);
      sel.removeAllRanges();
      const after = document.createRange();
      after.setStartAfter(space);
      after.collapse(true);
      sel.addRange(after);
      onChange && onChange(meSerialize(el));
    },
  }), [onChange]);

  // ---- update the popover based on caret position ----
  const updatePop = useCBME(() => {
    const ctx = meGetTriggerContext(editorRef.current);
    if (!ctx) { setPop(null); return; }
    const results = ctx.type === 'mention'
      ? searchAccounts(ctx.query)
      : emojiSearcher(ctx.query);
    const editorRect = editorRef.current.getBoundingClientRect();
    const rect = ctx.queryRange.getBoundingClientRect();
    const x = Math.max(0, rect.left - editorRect.left);
    const y = rect.bottom - editorRect.top + 6;
    setPop({ type: ctx.type, results, query: ctx.query, x, y });
    setSelIdx(prev => Math.min(prev, Math.max(0, results.length - 1)));
  }, [searchAccounts, emojiSearcher]);

  // ---- replace the typed prefix with an atom ----
  const insertAtom = useCBME((item) => {
    const ctx = meGetTriggerContext(editorRef.current);
    if (!ctx) return;
    ctx.queryRange.deleteContents();

    let atom;
    if (ctx.type === 'mention') {
      atom = document.createElement('span');
      atom.className = 'me-pill';
      atom.setAttribute('contenteditable', 'false');
      atom.setAttribute('data-acct', item.acct);
      atom.setAttribute('data-display', item.display_name);
      atom.setAttribute('title', '@' + item.acct);
      const av = document.createElement('span');
      av.className = 'me-pill-av ' + item.avClass;
      atom.appendChild(av);
      const at = document.createElement('span');
      at.className = 'me-pill-at';
      at.textContent = '@';
      atom.appendChild(at);
      const handle = document.createElement('span');
      handle.className = 'me-pill-handle';
      handle.textContent = item.username;
      atom.appendChild(handle);
    } else {
      atom = window.makeEmojiAtom ? window.makeEmojiAtom(item) : document.createTextNode(':' + item.shortcode + ':');
    }

    ctx.queryRange.insertNode(atom);

    const space = document.createTextNode('\u00A0');
    if (atom.nextSibling) atom.parentNode.insertBefore(space, atom.nextSibling);
    else atom.parentNode.appendChild(space);

    const sel = window.getSelection();
    sel.removeAllRanges();
    const r = document.createRange();
    r.setStartAfter(space);
    r.collapse(true);
    sel.addRange(r);

    setPop(null);
    setSelIdx(0);
    onChange && onChange(meSerialize(editorRef.current));
  }, [onChange]);

  const handleInput = () => {
    updatePop();
    onChange && onChange(meSerialize(editorRef.current));
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
        insertAtom(pop.results[selIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setPop(null);
        return;
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleBlur = () => {
    setTimeout(() => setPop(null), 60);
  };

  React.useEffect(() => {
    if (autoFocus) editorRef.current?.focus();
  }, [autoFocus]);

  return (
    <div className={"me-editor-wrap " + className}>
      <div
        ref={editorRef}
        className="me-editor"
        contentEditable
        suppressContentEditableWarning
        spellCheck="false"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        data-placeholder={placeholder}
      />
      {pop && pop.type === 'mention' && (
        <MeMentionPop results={pop.results} selIdx={selIdx} onPick={insertAtom} query={pop.query} x={pop.x} y={pop.y}/>
      )}
      {pop && pop.type === 'emoji' && (
        <MeEmojiPop results={pop.results} selIdx={selIdx} onPick={insertAtom} query={pop.query} x={pop.x} y={pop.y}/>
      )}
    </div>
  );
});

Object.assign(window, { MentionEditor, meDefaultSearch });
