/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState: useSV } = React;

// ============================================================
// Sample dataset — shape mirrors the Pleroma /api/v2/search response
// (accounts[], statuses[]; hashtags ignored per scope). Avatars are
// re-using the .av-* classes from styles.css for visual continuity.
// ============================================================

const QUERY = 'slow web';

const ACCOUNTS = [
  {
    id: '1', display_name: 'soft.hertz ✦', acct: 'soft.hertz@kolektiva.social',
    avClass: 'av-grad-3',
    bio: 'field recordings + slow web · cassette decks · taipei. quiet over loud.',
    followers_count: 1921, following_count: 312, statuses_count: 2148,
    match: 'slow web',
    relation: 'following',
  },
  {
    id: '2', display_name: 'gridwave', acct: 'gridwave@retro.social',
    avClass: 'av-grad-2',
    bio: 'electronics blog · the slow web is the only web worth defending. pdx.',
    followers_count: 412, following_count: 198, statuses_count: 870,
    match: 'slow web',
    relation: 'stranger',
  },
  {
    id: '3', display_name: 'datagram', acct: 'datagram@retro.social',
    avClass: 'av-pixel-pc',
    bio: 'tiny servers, big ideas. into slow protocols, plain text, hand-made HTML.',
    followers_count: 168, following_count: 244, statuses_count: 514,
    match: 'slow',
    relation: 'stranger',
  },
  {
    id: '4', display_name: 'orbit', acct: 'orbit@spacebear.net',
    avClass: 'av-orb',
    bio: "observatory updates. think the 'slow web' covers slow telescopes too.",
    followers_count: 92, following_count: 76, statuses_count: 212,
    match: 'slow web',
    relation: 'mutual',
  },
];

const POSTS = [
  {
    id: 'p1', acct: 'soft.hertz@kolektiva.social', display_name: 'soft.hertz', avClass: 'av-grad-3',
    time: '2h', date: 'Aug 14, 2026',
    snippet: "the algorithm doesn't care about you. the timeline doesn't either. but the <mark>slow web</mark> still does — it's the people in it that keep it.",
    replies: 142, boosts: 312, favs: 891,
  },
  {
    id: 'p2', acct: 'gridwave@retro.social', display_name: 'gridwave', avClass: 'av-grad-2',
    time: '5h', date: 'Aug 14, 2026',
    snippet: "the <mark>slow web</mark> isn't slow because the network is slow. it's slow because the people on it are taking their time on purpose.",
    replies: 38, boosts: 124, favs: 612,
  },
  {
    id: 'p3', acct: 'datagram@retro.social', display_name: 'datagram', avClass: 'av-pixel-pc',
    time: '11h', date: 'Aug 14, 2026',
    snippet: "started a tiny essay on the <mark>slow web</mark> tonight. it's mostly questions. anyway, here's a soundtrack",
    replies: 12, boosts: 28, favs: 142,
  },
  {
    id: 'p4', acct: 'kestrel@audio.garden', display_name: 'kestrel.fm', avClass: 'av-grad-3',
    time: '1d', date: 'Aug 13, 2026',
    snippet: "five years on the fediverse. the <mark>slow web</mark> i found here is still my favorite kind. quiet feeds. real friends.",
    replies: 22, boosts: 89, favs: 412,
  },
  {
    id: 'p5', acct: 'orbit@spacebear.net', display_name: 'orbit', avClass: 'av-orb',
    time: '2d', date: 'Aug 12, 2026',
    snippet: "thinking about how the <mark>slow web</mark> overlaps with slow looking. you can't speed up a sunset either.",
    replies: 8, boosts: 34, favs: 156,
  },
  {
    id: 'p6', acct: 'lumen@spacebear.net', display_name: 'lumen', avClass: 'av-grad-1',
    time: '3d', date: 'Aug 11, 2026',
    snippet: "photographer asks: what does <mark>slow web</mark> photography look like? probably less, longer, on actual film.",
    replies: 14, boosts: 41, favs: 198,
  },
];

const RECENTS = ['cassette decks', 'soft.hertz', 'pleroma 2.7 release', '#slowweb'];

// Icons
const SG = {
  search: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="16" height="16" {...p}><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg>,
  user:   (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" {...p}><circle cx="8" cy="6" r="2.5"/><path d="M3 13c0-2 2-3.5 5-3.5s5 1.5 5 3.5"/></svg>,
  post:   (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" {...p}><rect x="2.5" y="3" width="11" height="9" rx="1.5"/><path d="M4.5 6h7M4.5 9h5"/></svg>,
  clock:  (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" {...p}><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3l2 2"/></svg>,
  x:      (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="11" height="11" {...p}><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  kbd:    (label) => <span className="sv-mockhead-kbd">{label}</span>,
};

function fmt(n) {
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  return String(n);
}

// ============================================================
// HEADER FIELD + DROPDOWN
// ============================================================
function MockHeader({ query, active, children }) {
  return (
    <div className="sv-mockhead">
      <div className="sv-mockhead-brand">PleromaNet</div>
      <div className={"sv-mockhead-field " + (active ? 'active' : '')}>
        <SG.search/>
        {query
          ? <span className="sv-mockhead-q">{query}{active && <span className="sv-mockhead-caret"/>}</span>
          : <span className="sv-mockhead-q sv-mockhead-q-muted">Search PleromaNet…</span>}
        {SG.kbd("⌘")}{SG.kbd("K")}
        {children}
      </div>
    </div>
  );
}

function DropdownEmpty() {
  return (
    <div className="sv-dropdown">
      <div className="sv-dd-section">
        <div className="sv-dd-l">
          <SG.clock width="11" height="11"/> Recent
          <span className="sv-dd-l-count">{RECENTS.length}</span>
          <span className="sv-dd-l-see">Clear all</span>
        </div>
        {RECENTS.map((r, i) => (
          <div key={i} className="sv-recent-row">
            <SG.clock width="13" height="13"/>
            <span className="sv-recent-q">{r}</span>
            <span className="sv-recent-x"><SG.x/></span>
          </div>
        ))}
      </div>
      <div className="sv-dd-foot">
        {SG.kbd("↵")} open · {SG.kbd("Esc")} dismiss
        <span className="sv-dd-foot-r">⌘K from anywhere</span>
      </div>
    </div>
  );
}

function DropdownResults({ q }) {
  const users = ACCOUNTS.slice(0, 3);
  const posts = POSTS.slice(0, 3);
  return (
    <div className="sv-dropdown">
      <div className="sv-dd-section">
        <div className="sv-dd-l">
          <SG.user/> People
          <span className="sv-dd-l-count">{ACCOUNTS.length}</span>
          <span className="sv-dd-l-see">See all →</span>
        </div>
        {users.map((u, i) => (
          <button key={u.id} className={"sv-dd-row " + (i === 0 ? 'sel' : '')}>
            <span className={"sv-dd-av " + u.avClass}/>
            <span className="sv-dd-user">
              <span className="sv-dd-name">{u.display_name}</span>
              <span className="sv-dd-acct">@{u.acct}</span>
            </span>
            <span className="sv-dd-followers">{fmt(u.followers_count)} followers</span>
          </button>
        ))}
      </div>
      <div className="sv-dd-section">
        <div className="sv-dd-l">
          <SG.post/> Posts
          <span className="sv-dd-l-count">{POSTS.length}</span>
          <span className="sv-dd-l-see">See all →</span>
        </div>
        {posts.map(p => (
          <button key={p.id} className="sv-dd-row">
            <span className={"sv-dd-av " + p.avClass}/>
            <span className="sv-dd-snippet" dangerouslySetInnerHTML={{__html: p.snippet.replace(/\n/g, ' ')}}/>
            <span className="sv-dd-snippet-meta">{p.time}</span>
          </button>
        ))}
      </div>
      <div className="sv-dd-foot">
        Showing top results for <span style={{color: 'var(--accent-ink)', fontWeight: 600}}>“{q}”</span>
        <span className="sv-dd-foot-r">{SG.kbd("↵")} view all · {SG.kbd("Esc")} dismiss</span>
      </div>
    </div>
  );
}

// ============================================================
// Result row (shared by every variant)
// ============================================================
function UserRow({ u }) {
  return (
    <div className="sv-row">
      <span className={"sv-row-av " + u.avClass}/>
      <div className="sv-row-main">
        <div className="sv-row-head">
          <span className="sv-row-name">{u.display_name}</span>
          <span className="sv-row-acct">@{u.acct}</span>
          {u.relation === 'mutual' && <span className="sv-row-tag user">Mutual</span>}
          {u.relation === 'following' && <span className="sv-row-tag user">Following</span>}
        </div>
        <div className="sv-row-snippet" dangerouslySetInnerHTML={{__html: u.bio.replace(/slow web/gi, '<mark>$&</mark>')}}/>
        <div className="sv-row-meta">
          <span>{fmt(u.followers_count)} followers</span>
          <span>{fmt(u.statuses_count)} posts</span>
        </div>
      </div>
      <div className="sv-row-action">
        <button className={"sv-follow-btn " + (u.relation === 'stranger' ? '' : 'is-following')}>
          {u.relation === 'stranger' ? 'Follow' : u.relation === 'mutual' ? 'Mutuals' : 'Following'}
        </button>
      </div>
    </div>
  );
}

function PostRow({ p }) {
  return (
    <div className="sv-row">
      <span className={"sv-row-av " + p.avClass}/>
      <div className="sv-row-main">
        <div className="sv-row-head">
          <span className="sv-row-name">{p.display_name}</span>
          <span className="sv-row-acct">@{p.acct}</span>
          <span className="sv-row-time">{p.time}</span>
        </div>
        <div className="sv-row-snippet" dangerouslySetInnerHTML={{__html: p.snippet}}/>
        <div className="sv-row-meta">
          <span>↩ {p.replies}</span>
          <span>↻ {p.boosts}</span>
          <span>★ {p.favs}</span>
          <span style={{marginLeft: 'auto'}}>{p.date}</span>
        </div>
      </div>
    </div>
  );
}

// Interleaved result list (All mode in V1/V2)
function MixedList({ q, take = { users: 2, posts: 4 } }) {
  return (
    <div className="sv-list">
      {ACCOUNTS.slice(0, take.users).map(u => <UserRow key={u.id} u={u}/>)}
      {POSTS.slice(0, take.posts).map(p => <PostRow key={p.id} p={p}/>)}
    </div>
  );
}

// ============================================================
// HYBRID page — V1 chrome by default; V2 sidebar slides out
// when the user clicks "More filters". One canonical layout
// that scales from "I'll take what the API gives me" to
// "let me narrow this aggressively".
// ============================================================
function HybridPage({ q = QUERY, tab = 'all', sidebarOpen = false }) {
  const counts = { all: ACCOUNTS.length + POSTS.length, users: ACCOUNTS.length, posts: POSTS.length };
  const main = (
    <>
      {tab === 'all'   && <MixedList q={q} take={{users: 2, posts: 4}}/>}
      {tab === 'users' && (
        <div className="sv-list">{ACCOUNTS.map(u => <UserRow key={u.id} u={u}/>)}</div>
      )}
      {tab === 'posts' && (
        <div className="sv-list">{POSTS.map(p => <PostRow key={p.id} p={p}/>)}</div>
      )}
    </>
  );
  return (
    <div className="sv-pageframe">
      <div className="sv-bar">
        <SG.search width="18" height="18"/>
        <span className="sv-bar-q">{q}</span>
        <span className="sv-bar-count">{counts.all} results</span>
      </div>
      <div className="sv-tabs">
        <button className={"sv-tab " + (tab === 'all' ? 'active' : '')}>All <span className="sv-tab-count">{counts.all}</span></button>
        <button className={"sv-tab " + (tab === 'users' ? 'active' : '')}>People <span className="sv-tab-count">{counts.users}</span></button>
        <button className={"sv-tab " + (tab === 'posts' ? 'active' : '')}>Posts <span className="sv-tab-count">{counts.posts}</span></button>
        <span className="sv-tabs-spacer"/>
        <button className={"sv-tab-tool " + (sidebarOpen ? 'on' : '')}>
          {sidebarOpen ? 'Hide filters ◂' : 'More filters ▸'}
        </button>
      </div>
      {sidebarOpen ? (
        <div className="sv-v2-cols">
          <aside className="sv-v2-side">
            <div className="sv-v2-side-head">
              <span className="sv-v2-side-h">Filters</span>
              <button className="sv-v2-side-close" title="Close filters">◂</button>
            </div>
            <div className="sv-v2-group">
              <div className="sv-v2-group-l">Source</div>
              <div className="sv-v2-opt on">Federated</div>
              <div className="sv-v2-opt">This instance</div>
              <div className="sv-v2-opt">People you follow</div>
            </div>
            <div className="sv-v2-group">
              <div className="sv-v2-group-l">Date</div>
              <div className="sv-v2-opt">Past 24 hours</div>
              <div className="sv-v2-opt on">Past week</div>
              <div className="sv-v2-opt">Past month</div>
              <div className="sv-v2-opt">All time</div>
            </div>
            <div className="sv-v2-group">
              <div className="sv-v2-group-l">From user</div>
              <input className="sv-v2-input" placeholder="@user@server"/>
            </div>
            <div className="sv-v2-group">
              <div className="sv-v2-group-l">Has media</div>
              <div className="sv-v2-opt">Photos</div>
              <div className="sv-v2-opt">Audio</div>
              <div className="sv-v2-opt">Video</div>
            </div>
            <div className="sv-v2-group">
              <div className="sv-v2-group-l">Sort</div>
              <div className="sv-v2-opt on">Most relevant</div>
              <div className="sv-v2-opt">Newest first</div>
              <div className="sv-v2-opt">Most boosted</div>
            </div>
            <button className="sv-v2-clear">CLEAR ALL</button>
          </aside>
          <div>{main}</div>
        </div>
      ) : main}
    </div>
  );
}

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="sv-page">
      <header className="sv-kicker-bar">
        <div className="sv-kicker">{kicker}</div>
        <h1 className="sv-kicker-h">{title}</h1>
        <p className="sv-kicker-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="sv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="sv-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="sv-body">{children}</div>
    </div>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Search · dropdown + /search page">

      <DCSection
        id="dropdown"
        title="1 · Header dropdown · live results"
        subtitle="Opens beneath the global header search field on focus. Shows top 3 people + top 3 posts as compact rows. Empty input shows recents + suggested scopes. Pressing ↵ navigates to the /search page; ⌘K opens the field from anywhere.">

        <DCArtboard id="dd-empty" label="Empty input · recents" width={760} height={460}>
          <Page kicker="DROPDOWN · IDLE" title="Empty input → recents + suggestions"
            sub="Field is focused with no query yet. Shows recent searches the user can re-run, plus suggested scopes for first-time searches."
            cheat={{Trigger: 'Focus or ⌘K', Shows: 'Recent searches · suggested scopes', Action: '↵ runs / Esc dismisses'}}>
            <MockHeader query="" active={true}><DropdownEmpty/></MockHeader>
            <div style={{height: 30}}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="dd-results" label="Mid-typing · live results" width={760} height={520}>
          <Page kicker="DROPDOWN · TYPING" title="Mid-typing → live results"
            sub="Two sections — People first (top 3 by relevance), then Posts (top 3 by recency × relevance). Selected row gets accent-soft background; arrow keys cycle, Tab inserts handle into the search field for a refined query."
            cheat={{Sections: 'People (3) + Posts (3)', Selected: 'accent-soft · ↵ opens', Footer: 'View-all link → /search page'}}>
            <MockHeader query="slow web" active={true}><DropdownResults q="slow web"/></MockHeader>
            <div style={{height: 30}}/>
          </Page>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="page"
        title="2 · /search page · hybrid V1 + V2"
        subtitle="V1 chrome by default (tabs + a chip row of common scopes). A 'More filters ▸' chip on the right of the scope row opens a V2-style filter rail with the full set of refinements (source · date · from-user · has-media · sort).">

        <DCArtboard id="hybrid-default" label="Default · tabs + chips ★" width={920} height={1040}>
          <Page kicker="HYBRID · DEFAULT" title="Tabs + scope chips"
            sub="What you see right after pressing ↵. Tab strip handles primary filter (All / People / Posts), a row of scope chips below covers common refinements (Federated · From follows · Local · Past week · Sort). The 'More filters ▸' chip on the right opens the deeper panel."
            cheat={{
              Default: 'Tabs + chip row',
              Trigger: '“More filters ▸” chip on the right',
              Best:    'Same shape as the home/profile tabs',
            }}>
            <HybridPage q={QUERY} tab="all" sidebarOpen={false}/>
          </Page>
        </DCArtboard>

        <DCArtboard id="hybrid-open" label="Filters expanded" width={920} height={1040}>
          <Page kicker="HYBRID · DETAILED" title="Filter panel open"
            sub="Same page, More-filters opened. Chip row hides; an aside slides in on the left with Source · Date · From-user · Has-media · Sort. Selecting filters here updates the result list live. The chip row pattern stays for narrow-window mobile use."
            cheat={{
              Mode:     'Filter panel slid open',
              Filters:  'Source · Date · From-user · Has-media · Sort',
              Returns:  'Click ◂ on the panel header or “Less filters” chip',
            }}>
            <HybridPage q={QUERY} tab="all" sidebarOpen={true}/>
          </Page>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="states"
        title="3 · Edge states (using V1 as the canonical page)"
        subtitle="No-results, loading, and the empty before-you-type state.">

        <DCArtboard id="no-results" label="No results" width={920} height={520}>
          <Page kicker="STATE · EMPTY" title="No matches" sub="The query was valid but nothing matched. Offer a couple of suggested next moves so the user isn't dead-ended.">
            <div className="sv-pageframe">
              <div className="sv-bar">
                <SG.search width="18" height="18"/>
                <span className="sv-bar-q">windowsill cassette</span>
                <span className="sv-bar-count">0 results</span>
              </div>
              <div className="sv-empty">
                <div className="sv-empty-h">Nothing matched “windowsill cassette”</div>
                <div className="sv-empty-s">No people or posts on this instance or in the federated cache. Try a shorter query, drop a quoted phrase, or widen the date range.</div>
                <div className="sv-empty-suggest">
                  <span className="sv-empty-q"><SG.search width="11" height="11"/> cassette</span>
                  <span className="sv-empty-q"><SG.search width="11" height="11"/> windowsill</span>
                  <span className="sv-empty-q"><SG.clock width="11" height="11"/> All time</span>
                </div>
              </div>
            </div>
          </Page>
        </DCArtboard>

        <DCArtboard id="loading" label="Loading · skeleton" width={920} height={620}>
          <Page kicker="STATE · LOADING" title="Skeleton rows while the API call lands"
            sub="Debounced (~200ms) before firing the request. While the response is in flight, show 4–6 skeleton rows matching the compact-row geometry. Tabs render with question marks until counts arrive.">
            <div className="sv-pageframe">
              <div className="sv-bar">
                <SG.search width="18" height="18"/>
                <span className="sv-bar-q">slow web</span>
                <span className="sv-bar-count">searching…</span>
              </div>
              <div className="sv-tabs">
                <button className="sv-tab active">All <span className="sv-tab-count">?</span></button>
                <button className="sv-tab">People <span className="sv-tab-count">?</span></button>
                <button className="sv-tab">Posts <span className="sv-tab-count">?</span></button>
              </div>
              <div className="sv-skel">
                {[0,1,2,3].map(i => (
                  <div key={i} className="sv-skel-row">
                    <div className="sv-skel-av"/>
                    <div>
                      <div className="sv-skel-line long"/>
                      <div className="sv-skel-line mid"/>
                      <div className="sv-skel-line short"/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Page>
        </DCArtboard>

      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
