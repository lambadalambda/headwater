/* global React */
// ============================================================
// <EmojiPicker/>
// The full emoji picker popover. Opens from the composer's
// emoji button (or anywhere else that wants one). Vertical
// sidebar of packs (custom emoji + Unicode categories + Recent),
// grid on the right, search at top.
//
// Props:
//   open          — whether the picker is shown
//   onClose       — fired when the user clicks outside or hits Esc
//   onPick(item)  — called with either a string (unicode glyph) or
//                   a custom-emoji object ({shortcode, swatch, ...})
//   anchor        — { left, top, bottom } in viewport coords;
//                   we choose top/bottom placement automatically
// ============================================================
const { useState: useStateEP, useEffect: useEffectEP, useRef: useRefEP, useMemo: useMemoEP } = React;

function EpSearchIcon(p) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="14" height="14" {...p}>
      <circle cx="7" cy="7" r="4.5"/>
      <path d="M11 11l3 3"/>
    </svg>
  );
}

function EmojiPicker({ open, onClose, onPick, anchor }) {
  const [tab, setTab] = useStateEP('recent');
  const [search, setSearch] = useStateEP('');
  const ref = useRefEP(null);
  const searchRef = useRefEP(null);

  // Reset search and focus on open
  useEffectEP(() => {
    if (open) {
      setSearch('');
      // micro-delay so the field is mounted
      setTimeout(() => searchRef.current?.focus(), 30);
    }
  }, [open]);

  // Dismiss on outside-click / Esc
  useEffectEP(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        // Ignore clicks on the trigger button (host re-toggles)
        if (e.target.closest('[data-emoji-trigger]')) return;
        onClose && onClose();
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const customEmoji = window.CUSTOM_EMOJI || [];
  const unicodeGroups = window.UNICODE_GROUPS || [];
  const recents = window.EMOJI_RECENTS || [];

  // Distinct custom-emoji packs (preserve insertion order)
  const packs = useMemoEP(() => {
    const seen = new Set();
    const out = [];
    customEmoji.forEach(e => {
      if (!seen.has(e.pack)) { seen.add(e.pack); out.push(e.pack); }
    });
    return out;
  }, [customEmoji]);

  // Resolve sidebar entries → { id, label, kind }
  const sidebar = [
    { id: 'recent', label: 'Recent', kind: 'recent' },
    ...packs.map(p => ({ id: 'custom:' + p, label: p, kind: 'custom', pack: p })),
    ...unicodeGroups.map(g => ({ id: 'uni:' + g.id, label: g.label, kind: 'unicode', group: g })),
  ];

  // Resolve cells for the current tab + search
  const cells = useMemoEP(() => {
    const q = search.trim().toLowerCase();
    // SEARCH mode: union across everything
    if (q) {
      const customHits = customEmoji.filter(e =>
        e.shortcode.toLowerCase().includes(q) ||
        (e.label || '').toLowerCase().includes(q)
      );
      const uniHits = [];
      unicodeGroups.forEach(g => g.items.forEach(u => {
        // crude: include if the group id starts with the query (e.g. 'smi' → smileys)
        if (g.id.includes(q) || g.label.toLowerCase().includes(q)) uniHits.push(u);
      }));
      return [...customHits, ...uniHits];
    }
    if (tab === 'recent') {
      // Recents stored as either a unicode glyph or a custom shortcode
      return recents.map(r => {
        if (typeof r !== 'string') return r;
        if (r.length <= 4) return r; // looks like a unicode glyph
        // try to find a matching custom emoji
        return customEmoji.find(c => c.shortcode === r) || r;
      });
    }
    if (tab.startsWith('custom:')) {
      const p = tab.slice(7);
      return customEmoji.filter(c => c.pack === p);
    }
    if (tab.startsWith('uni:')) {
      const id = tab.slice(4);
      const g = unicodeGroups.find(g => g.id === id);
      return g ? g.items : [];
    }
    return [];
  }, [tab, search, customEmoji, unicodeGroups, recents]);

  const activeEntry = sidebar.find(s => s.id === tab) || sidebar[0];

  if (!open) return null;

  // Position the picker relative to the anchor. Default behavior:
  // prefer opening ABOVE the trigger button (so the trigger and the
  // page below stay visible), but flip to below if there isn't enough
  // headroom above. Host can force placement via anchor.placement.
  const a = anchor || {};
  const pickerStyle = {};
  const pickerHeight = 420 + 16; // max-height + breathing room
  const viewH = (typeof window !== 'undefined') ? window.innerHeight : 800;
  const spaceAbove = a.top != null ? a.top : 0;
  const spaceBelow = a.bottom != null ? viewH - a.bottom : 0;
  let placement = a.placement;
  if (!placement) {
    if (spaceAbove >= pickerHeight)          placement = 'above';
    else if (spaceBelow >= pickerHeight)     placement = 'below';
    else                                     placement = spaceAbove > spaceBelow ? 'above' : 'below';
  }
  if (a.left != null) pickerStyle.left = a.left;
  if (placement === 'below' && a.bottom != null) {
    pickerStyle.top = a.bottom + 8;
  } else if (a.top != null) {
    pickerStyle.top = a.top;
    pickerStyle.transform = 'translateY(-100%) translateY(-8px)';
  }

  return (
    <div ref={ref} className="ep-picker" style={pickerStyle} role="dialog" aria-label="Emoji picker">
      <aside className="ep-side">
        {sidebar.map(s => {
          const isOn = s.id === tab && !search;
          const icon = s.kind === 'recent'
            ? '◷'
            : s.kind === 'custom'
              ? null  // render a custom-emoji swatch
              : '☺';
          return (
            <button key={s.id} className={"ep-side-item " + (isOn ? 'on' : '')}
              onClick={() => { setSearch(''); setTab(s.id); }}>
              <span className="ep-side-i">
                {s.kind === 'custom'
                  ? (() => {
                      const e = customEmoji.find(c => c.pack === s.pack);
                      const sw = e?.swatch || ('em-cx-' + (e?.shortcode || ''));
                      return <span className={"ep-side-swatch " + sw}/>;
                    })()
                  : <span className="ep-side-glyph">{icon}</span>}
              </span>
              <span className="ep-side-t">{s.label}</span>
            </button>
          );
        })}
      </aside>
      <div className="ep-main">
        <div className="ep-search">
          <EpSearchIcon/>
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            spellCheck="false"
          />
        </div>
        <div className="ep-pack-l">
          {search ? '"' + search + '"' : activeEntry.label}
          <span className="ep-pack-count">{cells.length}</span>
        </div>
        <div className="ep-grid">
          {cells.length === 0 && (
            <div className="ep-empty">No matches.</div>
          )}
          {cells.map((c, i) => (
            <button
              key={(typeof c === 'string' ? 'u-' + c : 'c-' + c.shortcode) + '-' + i}
              className="ep-cell"
              title={typeof c === 'string' ? c : ':' + c.shortcode + ':'}
              onClick={() => onPick && onPick(c)}>
              {typeof c === 'string'
                ? <span className="ep-cell-uni">{c}</span>
                : (() => {
                    const sw = c.swatch || ('em-cx-' + c.shortcode);
                    return (
                      <span className={"me-emoji ep-cell-cx " + sw}>
                        <span className="me-emoji-i">{c.shortcode.slice(0, 2).toUpperCase()}</span>
                      </span>
                    );
                  })()}
            </button>
          ))}
        </div>
        <div className="ep-foot">
          <span className="ep-foot-l">{activeEntry.kind === 'custom' ? ':' + activeEntry.label + ':' : activeEntry.label}</span>
          <span className="ep-foot-r">Click to insert</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EmojiPicker });
