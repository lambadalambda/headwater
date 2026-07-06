/* global React, Avatar, PostShell */
// ============================================================
// <SearchDropdown/> + <SearchPage/>
// Wired versions of the search-variants prototype. Drops into
// the app shell:
//   - <SearchDropdown/> hangs off the header search field
//   - <SearchPage/> is a `view === 'search'` route
//
// Search dataset is mock (matches the shape returned by
// /api/v2/search) — a real implementation would replace
// the MOCK_ACCOUNTS / MOCK_STATUSES / searchMock function
// with a debounced fetch against the live API.
// ============================================================
const { useState: useSE, useRef: useSER, useEffect: useSEE, useCallback: useSEC } = React;

// ---------- Mock dataset (same shape as Pleroma API) ----------
const SE_ACCOUNTS = [
  {
    id: '1', display_name: 'soft.hertz ✦', acct: 'soft.hertz@kolektiva.social',
    avClass: 'av-grad-3',
    note: 'field recordings + slow web · cassette decks · taipei. quiet over loud.',
    followers_count: 1921, following_count: 312, statuses_count: 2148,
    relation: 'following',
  },
  {
    id: '2', display_name: 'gridwave', acct: 'gridwave@retro.social',
    avClass: 'av-grad-2',
    note: 'electronics blog · the slow web is the only web worth defending. pdx.',
    followers_count: 412, following_count: 198, statuses_count: 870,
    relation: 'stranger',
  },
  {
    id: '3', display_name: 'datagram', acct: 'datagram@retro.social',
    avClass: 'av-pixel-pc',
    note: 'tiny servers, big ideas. into slow protocols, plain text, hand-made HTML.',
    followers_count: 168, following_count: 244, statuses_count: 514,
    relation: 'stranger',
  },
  {
    id: '4', display_name: 'orbit', acct: 'orbit@spacebear.net',
    avClass: 'av-orb',
    note: "observatory updates. think the 'slow web' covers slow telescopes too.",
    followers_count: 92, following_count: 76, statuses_count: 212,
    relation: 'mutual',
  },
  {
    id: '5', display_name: 'kestrel.fm', acct: 'kestrel@audio.garden',
    avClass: 'av-grad-3',
    note: 'late-night sets · ambient · slow listening, slow internet.',
    followers_count: 287, following_count: 142, statuses_count: 633,
    relation: 'stranger',
  },
  {
    id: '6', display_name: 'lumen', acct: 'lumen@spacebear.net',
    avClass: 'av-grad-1',
    note: 'photographer · slow shutter, long exposure, the slow web in pictures.',
    followers_count: 521, following_count: 87, statuses_count: 412,
    relation: 'stranger',
  },
];

const SE_STATUSES = [
  {
    id: 's1', acct: 'soft.hertz@kolektiva.social', display_name: 'soft.hertz', avClass: 'av-grad-3',
    time: '2h', date: 'Aug 14, 2026',
    content: "the algorithm doesn't care about you. the timeline doesn't either. but the slow web still does — it's the people in it that keep it.",
    replies_count: 142, reblogs_count: 312, favourites_count: 891,
  },
  {
    id: 's2', acct: 'gridwave@retro.social', display_name: 'gridwave', avClass: 'av-grad-2',
    time: '5h', date: 'Aug 14, 2026',
    content: "the slow web isn't slow because the network is slow. it's slow because the people on it are taking their time on purpose.",
    replies_count: 38, reblogs_count: 124, favourites_count: 612,
  },
  {
    id: 's3', acct: 'datagram@retro.social', display_name: 'datagram', avClass: 'av-pixel-pc',
    time: '11h', date: 'Aug 14, 2026',
    content: "started a tiny essay on the slow web tonight. it's mostly questions. anyway, here's a soundtrack",
    replies_count: 12, reblogs_count: 28, favourites_count: 142,
  },
  {
    id: 's4', acct: 'kestrel@audio.garden', display_name: 'kestrel.fm', avClass: 'av-grad-3',
    time: '1d', date: 'Aug 13, 2026',
    content: "five years on the fediverse. the slow web i found here is still my favorite kind. quiet feeds. real friends.",
    replies_count: 22, reblogs_count: 89, favourites_count: 412,
  },
  {
    id: 's5', acct: 'orbit@spacebear.net', display_name: 'orbit', avClass: 'av-orb',
    time: '2d', date: 'Aug 12, 2026',
    content: "thinking about how the slow web overlaps with slow looking. you can't speed up a sunset either.",
    replies_count: 8, reblogs_count: 34, favourites_count: 156,
  },
  {
    id: 's6', acct: 'lumen@spacebear.net', display_name: 'lumen', avClass: 'av-grad-1',
    time: '3d', date: 'Aug 11, 2026',
    content: "photographer asks: what does slow web photography look like? probably less, longer, on actual film.",
    replies_count: 14, reblogs_count: 41, favourites_count: 198,
  },
];

// Filter + highlight matches. Returns { accounts, statuses } where each
// row has a `.match` string for the dropdown and a `.snippet` HTML
// with <mark> wrapping the matched substring (case-insensitive).
function searchMock(q) {
  const lq = (q || '').trim().toLowerCase();
  if (!lq) return { accounts: [], statuses: [] };
  const re = new RegExp(`(${lq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const accounts = SE_ACCOUNTS
    .filter(a =>
      a.display_name.toLowerCase().includes(lq) ||
      a.acct.toLowerCase().includes(lq) ||
      (a.note || '').toLowerCase().includes(lq)
    )
    .map(a => ({ ...a, bioHl: a.note.replace(re, '<mark>$1</mark>') }));
  const statuses = SE_STATUSES
    .filter(s => s.content.toLowerCase().includes(lq))
    .map(s => ({ ...s, snippet: s.content.replace(re, '<mark>$1</mark>') }));
  return { accounts, statuses };
}

// ---------- helpers ----------
function fmtN(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}
const SeKbd = (label) => <span className="se-kbd">{label}</span>;
function SeIconSearch(p) { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="16" height="16" {...p}><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg>; }
function SeIconUser(p)   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" {...p}><circle cx="8" cy="6" r="2.5"/><path d="M3 13c0-2 2-3.5 5-3.5s5 1.5 5 3.5"/></svg>; }
function SeIconPost(p)   { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" {...p}><rect x="2.5" y="3" width="11" height="9" rx="1.5"/><path d="M4.5 6h7M4.5 9h5"/></svg>; }
function SeIconClock(p)  { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" {...p}><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 2"/></svg>; }
function SeIconX(p)      { return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="11" height="11" {...p}><path d="M4 4l8 8M12 4l-8 8"/></svg>; }

// ============================================================
// <SearchDropdown/>
// ============================================================
function SearchDropdown({ query, results, recents, selIdx, onPickAccount, onPickStatus, onPickRecent, onClearRecent, onClearAllRecents, onSeeAll }) {
  // Empty input → show recents only
  if (!query || !query.trim()) {
    if (!recents || recents.length === 0) {
      return (
        <div className="se-dropdown">
          <div className="se-dd-empty">
            <div className="se-dd-empty-h">Search across PleromaNet</div>
            <div className="se-dd-empty-s">Find people and posts on this instance and across the federation. Hashtags are ignored.</div>
          </div>
          <div className="se-dd-foot">
            {SeKbd('↵')} open · {SeKbd('Esc')} dismiss
            <span className="se-dd-foot-r">⌘K from anywhere</span>
          </div>
        </div>
      );
    }
    return (
      <div className="se-dropdown">
        <div className="se-dd-section">
          <div className="se-dd-l">
            <SeIconClock width="11" height="11"/> Recent
            <span className="se-dd-l-count">{recents.length}</span>
            <button className="se-dd-l-see" onClick={onClearAllRecents}>Clear all</button>
          </div>
          {recents.map((r, i) => (
            <div key={r} className="se-recent-row" onClick={() => onPickRecent && onPickRecent(r)}>
              <SeIconClock width="13" height="13"/>
              <span className="se-recent-q">{r}</span>
              <button className="se-recent-x"
                onClick={(e) => { e.stopPropagation(); onClearRecent && onClearRecent(r); }}
                title="Remove">
                <SeIconX/>
              </button>
            </div>
          ))}
        </div>
        <div className="se-dd-foot">
          {SeKbd('↵')} open · {SeKbd('Esc')} dismiss
          <span className="se-dd-foot-r">⌘K from anywhere</span>
        </div>
      </div>
    );
  }
  // Typing → live results
  const accounts = (results?.accounts || []).slice(0, 3);
  const statuses = (results?.statuses || []).slice(0, 3);
  const totalRows = accounts.length + statuses.length;
  if (totalRows === 0) {
    return (
      <div className="se-dropdown">
        <div className="se-dd-empty">
          <div className="se-dd-empty-h">No matches for “{query}”</div>
          <div className="se-dd-empty-s">Press ↵ to open the full search and try widening the date range or scope.</div>
        </div>
        <div className="se-dd-foot">
          {SeKbd('↵')} open · {SeKbd('Esc')} dismiss
        </div>
      </div>
    );
  }
  return (
    <div className="se-dropdown">
      {accounts.length > 0 && (
        <div className="se-dd-section">
          <div className="se-dd-l">
            <SeIconUser/> People
            <span className="se-dd-l-count">{(results?.accounts || []).length}</span>
            <button className="se-dd-l-see" onClick={() => onSeeAll && onSeeAll('users')}>See all →</button>
          </div>
          {accounts.map((u, i) => (
            <button key={u.id} className={"se-dd-row " + (i === selIdx ? 'sel' : '')}
              onMouseDown={(e) => { e.preventDefault(); onPickAccount && onPickAccount(u); }}>
              <span className={"se-dd-av " + u.avClass}/>
              <span className="se-dd-user">
                <span className="se-dd-name">{u.display_name}</span>
                <span className="se-dd-acct">@{u.acct}</span>
              </span>
              <span className="se-dd-followers">{fmtN(u.followers_count)} followers</span>
            </button>
          ))}
        </div>
      )}
      {statuses.length > 0 && (
        <div className="se-dd-section">
          <div className="se-dd-l">
            <SeIconPost/> Posts
            <span className="se-dd-l-count">{(results?.statuses || []).length}</span>
            <button className="se-dd-l-see" onClick={() => onSeeAll && onSeeAll('posts')}>See all →</button>
          </div>
          {statuses.map(s => (
            <button key={s.id} className="se-dd-row"
              onMouseDown={(e) => { e.preventDefault(); onPickStatus && onPickStatus(s); }}>
              <span className={"se-dd-av " + s.avClass}/>
              <span className="se-dd-snippet" dangerouslySetInnerHTML={{__html: s.snippet}}/>
              <span className="se-dd-snippet-meta">{s.time}</span>
            </button>
          ))}
        </div>
      )}
      <div className="se-dd-foot">
        Showing top results for <span style={{color: 'var(--accent-ink)', fontWeight: 600}}>“{query}”</span>
        <span className="se-dd-foot-r">{SeKbd('↵')} view all · {SeKbd('Esc')} dismiss</span>
      </div>
    </div>
  );
}

// ============================================================
// Row components — used by SearchPage
// ============================================================
function SeUserRow({ u, onOpen }) {
  return (
    <div className="se-row" onClick={() => onOpen && onOpen(u)}>
      <span className={"se-row-av " + u.avClass}/>
      <div className="se-row-main">
        <div className="se-row-head">
          <span className="se-row-name">{u.display_name}</span>
          <span className="se-row-acct">@{u.acct}</span>
          {u.relation === 'mutual'    && <span className="se-row-tag user">Mutual</span>}
          {u.relation === 'following' && <span className="se-row-tag user">Following</span>}
        </div>
        <div className="se-row-snippet" dangerouslySetInnerHTML={{__html: u.bioHl || u.note || ''}}/>
        <div className="se-row-meta">
          <span>{fmtN(u.followers_count)} followers</span>
          <span>{fmtN(u.statuses_count)} posts</span>
        </div>
      </div>
      <div className="se-row-action">
        <button className={"se-follow-btn " + (u.relation === 'stranger' ? '' : 'is-following')}>
          {u.relation === 'stranger' ? 'Follow' : u.relation === 'mutual' ? 'Mutuals' : 'Following'}
        </button>
      </div>
    </div>
  );
}

function SeStatusRow({ s, onOpen }) {
  return (
    <div className="se-row" onClick={() => onOpen && onOpen(s)}>
      <span className={"se-row-av " + s.avClass}/>
      <div className="se-row-main">
        <div className="se-row-head">
          <span className="se-row-name">{s.display_name}</span>
          <span className="se-row-acct">@{s.acct}</span>
          <span className="se-row-time">{s.time}</span>
        </div>
        <div className="se-row-snippet" dangerouslySetInnerHTML={{__html: s.snippet || s.content}}/>
        <div className="se-row-meta">
          <span>↩ {s.replies_count}</span>
          <span>↻ {s.reblogs_count}</span>
          <span>★ {s.favourites_count}</span>
          <span style={{marginLeft: 'auto'}}>{s.date}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// <SearchPage/>
// ============================================================
function SearchPage({ query = '', onChangeQuery, results, tab = 'all', onChangeTab, sidebarOpen = false, onToggleSidebar, onOpenAccount, onOpenStatus, loading }) {
  const accounts = results?.accounts || [];
  const statuses = results?.statuses || [];
  const counts = { all: accounts.length + statuses.length, users: accounts.length, posts: statuses.length };

  const mainBody = (
    <>
      {tab === 'all'   && (
        <div className="se-list">
          {accounts.slice(0, 2).map(u => <SeUserRow key={u.id} u={u} onOpen={onOpenAccount}/>)}
          {statuses.map(s => <SeStatusRow key={s.id} s={s} onOpen={onOpenStatus}/>)}
        </div>
      )}
      {tab === 'users' && (
        <div className="se-list">{accounts.map(u => <SeUserRow key={u.id} u={u} onOpen={onOpenAccount}/>)}</div>
      )}
      {tab === 'posts' && (
        <div className="se-list">{statuses.map(s => <SeStatusRow key={s.id} s={s} onOpen={onOpenStatus}/>)}</div>
      )}
      {counts.all === 0 && !loading && (
        <div className="se-empty">
          <div className="se-empty-h">Nothing matched “{query}”</div>
          <div className="se-empty-s">No people or posts. Try a shorter query, drop a quoted phrase, or open More filters and widen the date range.</div>
        </div>
      )}
    </>
  );

  return (
    <div className="se-pageframe card">
      <div className="se-bar">
        <SeIconSearch width="18" height="18"/>
        <input
          className="se-bar-input"
          value={query}
          onChange={(e) => onChangeQuery && onChangeQuery(e.target.value)}
          placeholder="Search PleromaNet…"
          autoFocus/>
        <span className="se-bar-count">{counts.all} result{counts.all === 1 ? '' : 's'}</span>
      </div>
      <div className="se-tabs">
        <button className={"se-tab " + (tab === 'all' ? 'active' : '')} onClick={() => onChangeTab && onChangeTab('all')}>
          All <span className="se-tab-count">{counts.all}</span>
        </button>
        <button className={"se-tab " + (tab === 'users' ? 'active' : '')} onClick={() => onChangeTab && onChangeTab('users')}>
          People <span className="se-tab-count">{counts.users}</span>
        </button>
        <button className={"se-tab " + (tab === 'posts' ? 'active' : '')} onClick={() => onChangeTab && onChangeTab('posts')}>
          Posts <span className="se-tab-count">{counts.posts}</span>
        </button>
        <span className="se-tabs-spacer"/>
        <button className={"se-tab-tool " + (sidebarOpen ? 'on' : '')} onClick={onToggleSidebar}>
          {sidebarOpen ? 'Hide filters ◂' : 'More filters ▸'}
        </button>
      </div>
      {sidebarOpen ? (
        <div className="se-v2-cols">
          <aside className="se-v2-side">
            <div className="se-v2-side-head">
              <span className="se-v2-side-h">Filters</span>
              <button className="se-v2-side-close" onClick={onToggleSidebar} title="Close filters">◂</button>
            </div>
            <div className="se-v2-group">
              <div className="se-v2-group-l">Source</div>
              <div className="se-v2-opt on">Federated</div>
              <div className="se-v2-opt">This instance</div>
              <div className="se-v2-opt">People you follow</div>
            </div>
            <div className="se-v2-group">
              <div className="se-v2-group-l">Date</div>
              <div className="se-v2-opt">Past 24 hours</div>
              <div className="se-v2-opt on">Past week</div>
              <div className="se-v2-opt">Past month</div>
              <div className="se-v2-opt">All time</div>
            </div>
            <div className="se-v2-group">
              <div className="se-v2-group-l">From user</div>
              <input className="se-v2-input" placeholder="@user@server"/>
            </div>
            <div className="se-v2-group">
              <div className="se-v2-group-l">Has media</div>
              <div className="se-v2-opt">Photos</div>
              <div className="se-v2-opt">Audio</div>
              <div className="se-v2-opt">Video</div>
            </div>
            <div className="se-v2-group">
              <div className="se-v2-group-l">Sort</div>
              <div className="se-v2-opt on">Most relevant</div>
              <div className="se-v2-opt">Newest first</div>
              <div className="se-v2-opt">Most boosted</div>
            </div>
            <button className="se-v2-clear">CLEAR ALL</button>
          </aside>
          <div>{mainBody}</div>
        </div>
      ) : mainBody}
    </div>
  );
}

// ============================================================
// Hook for hosts: tracks query + results, optionally synced
// with localStorage-backed recents. Exposes a stable shape.
// ============================================================
function useSearch(initialQuery = '') {
  const [query, setQuery] = useSE(initialQuery);
  const [tab, setTab] = useSE('all');
  const [sidebarOpen, setSidebarOpen] = useSE(false);
  const [headerOpen, setHeaderOpen] = useSE(false);
  const [recents, setRecents] = useSE(() => {
    try { return JSON.parse(localStorage.getItem('pn-search-recents') || '[]'); }
    catch (e) { return []; }
  });
  useSEE(() => {
    try { localStorage.setItem('pn-search-recents', JSON.stringify(recents)); } catch (e) {}
  }, [recents]);
  const results = searchMock(query);
  const submit = useSEC((q) => {
    const v = (q ?? query).trim();
    if (!v) return;
    setRecents(prev => [v, ...prev.filter(r => r !== v)].slice(0, 8));
  }, [query]);
  const removeRecent = useSEC((r) => setRecents(prev => prev.filter(x => x !== r)), []);
  const clearRecents = useSEC(() => setRecents([]), []);
  return {
    query, setQuery,
    tab, setTab,
    sidebarOpen, setSidebarOpen,
    toggleSidebar: () => setSidebarOpen(s => !s),
    headerOpen, setHeaderOpen,
    recents, removeRecent, clearRecents,
    results,
    submit,
  };
}

Object.assign(window, {
  SearchDropdown, SearchPage, useSearch,
  searchMock,
});
