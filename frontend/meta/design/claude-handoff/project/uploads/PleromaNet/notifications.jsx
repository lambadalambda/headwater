/* global React, I, VaporBanner, Avatar */
const { useState: useStateN, useEffect: useEffectN, useRef: useRefN, useMemo: useMemoN } = React;

// ============ Notification data ============
const NOTIF_KINDS = {
  fav: { label: 'favorited your post', icon: 'star', tint: 'var(--accent)' },
  boost: { label: 'boosted your post', icon: 'repeat', tint: '#7dc4be' },
  reply: { label: 'replied to you', icon: 'reply', tint: 'var(--accent-ink)' },
  mention: { label: 'mentioned you', icon: 'at', tint: 'var(--accent-ink)' },
  follow: { label: 'followed you', icon: 'userPlus', tint: '#a48bd9' },
  follow_req: { label: 'requested to follow you', icon: 'userPlus', tint: '#e0b97a' },
  poll: { label: 'a poll you voted in has ended', icon: 'chart', tint: 'var(--muted)' },
};

function notifIcon(name) {
  const common = { width: 12, height: 12 };
  switch (name) {
    case 'star':
      return <svg viewBox="0 0 24 24" fill="currentColor" style={common}><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4.5L6 21l1.5-7.5L2 9h7l3-7z"/></svg>;
    case 'repeat':
      return <svg viewBox="0 0 24 24" fill="none" style={common}><path d="M4 9V7a2 2 0 012-2h11l-3-3M20 15v2a2 2 0 01-2 2H7l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'reply':
      return <svg viewBox="0 0 24 24" fill="none" style={common}><path d="M10 8L4 12l6 4M4 12h11a5 5 0 015 5v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'at':
      return <svg viewBox="0 0 24 24" fill="none" style={common}><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-4 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
    case 'userPlus':
      return <svg viewBox="0 0 24 24" fill="none" style={common}><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M18 8v6M21 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
    case 'chart':
      return <svg viewBox="0 0 24 24" fill="none" style={common}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
    default: return null;
  }
}

const SAMPLE_NOTIFS = [
  { id: 'n1', kind: 'mention', read: false, time: '4m', t: 1, who: [{ name: 'orbit', handle: '@orbit@spacebear.net', av: 'sunset' }], post: { excerpt: 'hey @dreambyte — does the gradient hold up in dusk? curious what you tried.', tStamp: '4m ago' } },
  { id: 'n2', kind: 'fav', read: false, time: '12m', t: 12, who: [{ name: 'kestrel', av: 'city' }, { name: 'mossy', av: 'sunset' }, { name: 'datagram', av: 'space' }, { name: 'lumen', av: 'sunset' }], post: { excerpt: 'a placeholder is more honest than a guess.', tStamp: '2h ago' } },
  { id: 'n3', kind: 'follow', read: false, time: '22m', t: 22, who: [{ name: 'static.gif', handle: '@staticgif@modem.zone', av: 'space' }], bio: 'chiptune & sleep noise · CC BY 4.0' },
  { id: 'n4', kind: 'reply', read: true, time: '1h', t: 60, who: [{ name: 'datagram', handle: '@datagram@retro.social', av: 'space' }], post: { excerpt: 'around the time the algorithm replaced the timeline.', tStamp: '1h ago' }, on: 'we used to log off. when did that stop being a thing.' },
  { id: 'n5', kind: 'boost', read: true, time: '2h', t: 120, who: [{ name: 'lumen', av: 'sunset' }, { name: 'mossy', av: 'city' }, { name: 'kestrel', av: 'sunset' }], post: { excerpt: 'living in a soft world. quietly federating.', tStamp: '6h ago' } },
  { id: 'n6', kind: 'follow_req', read: true, time: '4h', t: 240, who: [{ name: 'unknown.peer', handle: '@unknown@strange.host', av: 'space' }], bio: 'no bio · 0 posts' },
  { id: 'n7', kind: 'fav', read: true, time: '8h', t: 480, who: [{ name: 'orbit', av: 'sunset' }], post: { excerpt: 'cassette label + vinyl needle = the move?', tStamp: 'yesterday' } },
  { id: 'n8', kind: 'mention', read: true, time: '1d', t: 1440, who: [{ name: 'mossy', handle: '@mossy@garden.cafe', av: 'city' }], post: { excerpt: 'tagging @dreambyte for the soft palette discussion — would love your take', tStamp: 'yesterday' } },
  { id: 'n9', kind: 'poll', read: true, time: '1d', t: 1500, who: [{ name: 'kestrel', av: 'sunset' }], post: { excerpt: 'which side wins? warm cassette · cold terminal · spinning vinyl', tStamp: '2d ago' } },
  { id: 'n10', kind: 'follow', read: true, time: '2d', t: 2880, who: [{ name: 'warm.process', handle: '@warmprocess@drift.fm', av: 'sunset' }], bio: 'ambient process music · slow web' },
  { id: 'n11', kind: 'boost', read: true, time: '3d', t: 4320, who: [{ name: 'datagram', av: 'space' }], post: { excerpt: 'a placeholder is more honest than a guess.', tStamp: '3d ago' } },
  { id: 'n12', kind: 'reply', read: true, time: '4d', t: 5760, who: [{ name: 'lumen', handle: '@lumen@candle.house', av: 'sunset' }], post: { excerpt: 'softer than i expected. in a good way.', tStamp: '4d ago' }, on: 'the dusk theme has been a long time coming.' },
];

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'mention', label: 'Mentions' },
  { id: 'boost', label: 'Boosts' },
  { id: 'fav', label: 'Favorites' },
  { id: 'follow', label: 'Follows' },
];

function filterNotifs(list, tab) {
  if (tab === 'all') return list;
  if (tab === 'follow') return list.filter(n => n.kind === 'follow' || n.kind === 'follow_req');
  return list.filter(n => n.kind === tab);
}

function timeBucket(t) {
  if (t < 60) return 'now';
  if (t < 60 * 6) return 'today';
  if (t < 60 * 24 * 2) return 'yesterday';
  if (t < 60 * 24 * 7) return 'this week';
  return 'earlier';
}
const BUCKETS = ['now', 'today', 'yesterday', 'this week', 'earlier'];
const BUCKET_LABEL = { now: 'New', today: 'Today', yesterday: 'Yesterday', 'this week': 'This week', earlier: 'Earlier' };

// ============ Avatar ============
function NotifAv({ a, size = 28 }) {
  const variant = a.av === 'city' ? 'city' : a.av === 'space' ? 'space' : 'sunset';
  return <Avatar variant="notif" avBanner={variant} size={size}/>;
}

// ============ Single row (shared by popover + page) ============
function NotifRow({ n, dense, onOpen }) {
  const kind = NOTIF_KINDS[n.kind];
  const w = n.who;
  const more = w.length > 4 ? w.length - 4 : 0;
  const isFollow = n.kind === 'follow' || n.kind === 'follow_req';
  return (
    <div className={"notif-row " + (n.read ? '' : 'unread ') + (dense ? 'dense ' : '') + ('k-' + n.kind)}>
      <div className="notif-row-icon" style={{ ['--kind-tint']: kind.tint }}>{notifIcon(kind.icon)}</div>
      <div className="notif-row-body">
        <div className="notif-row-avs">
          {w.slice(0, 4).map((a, i) => <NotifAv key={i} a={a} size={dense ? 22 : 26}/>)}
          {more > 0 && <span className="notif-more">+{more}</span>}
        </div>
        <div className="notif-row-text">
          <span className="notif-names">
            {w.slice(0, 2).map((a, i) => <span key={i}><b>{a.name}</b>{i === 0 && w.length > 1 ? ', ' : ''}</span>)}
            {w.length > 2 && <span className="notif-others"> and {w.length - 2} other{w.length - 2 > 1 ? 's' : ''}</span>}
          </span>
          <span className="notif-action"> {kind.label}</span>
          <span className="notif-time">· {n.time}</span>
        </div>
        {n.on && (
          <div className="notif-row-on">
            <span className="notif-on-l">on</span>
            <span className="notif-on-t">"{n.on}"</span>
          </div>
        )}
        {n.post && (
          <div className="notif-row-quote" onClick={onOpen}>
            <span className="notif-quote-mark">"</span>
            <span className="notif-quote-t">{n.post.excerpt}</span>
          </div>
        )}
        {n.bio && (
          <div className="notif-row-bio">{n.bio}</div>
        )}
        {isFollow && (
          <div className="notif-row-actions">
            {n.kind === 'follow_req' && (
              <>
                <button className="notif-btn primary">Accept</button>
                <button className="notif-btn">Decline</button>
              </>
            )}
            {n.kind === 'follow' && (
              <button className="notif-btn">Follow back</button>
            )}
          </div>
        )}
      </div>
      {!n.read && <span className="notif-unread-dot"/>}
    </div>
  );
}

// ============ Popover (header bell) ============
function NotifsPopover({ onClose, onSeeAll }) {
  const [tab, setTab] = useStateN('all');
  const [list, setList] = useStateN(SAMPLE_NOTIFS);
  const ref = useRefN(null);
  useEffectN(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target) && !e.target.closest('[data-bell]')) onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => document.addEventListener('click', onDoc), 0);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  const visible = filterNotifs(list, tab).slice(0, 8);
  const unreadCount = list.filter(n => !n.read).length;
  const markAll = () => setList(list.map(n => ({ ...n, read: true })));
  return (
    <div className="notif-pop" ref={ref}>
      <div className="notif-pop-head">
        <div className="notif-pop-title">
          <span>Notifications</span>
          {unreadCount > 0 && <span className="notif-pop-count">{unreadCount} new</span>}
        </div>
        <div className="notif-pop-tools">
          <button className="notif-pop-tool" onClick={markAll} title="Mark all read">
            <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14}}><path d="M4 12l4 4 12-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="notif-pop-tool" title="Notification settings">
            <I.gear style={{width: 14, height: 14}}/>
          </button>
        </div>
      </div>
      <div className="notif-pop-tabs">
        {TABS.slice(0, 4).map(t => (
          <button key={t.id} className={"notif-pop-tab " + (tab === t.id ? 'active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="notif-pop-body">
        {visible.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-mark">∅</div>
            <div>No {tab === 'all' ? '' : tab} notifications.</div>
          </div>
        ) : visible.map(n => <NotifRow key={n.id} n={n} dense/>)}
      </div>
      <button className="notif-pop-foot" onClick={onSeeAll}>
        <span>See all notifications</span>
        <I.arrowR style={{width: 13, height: 13}}/>
      </button>
    </div>
  );
}

// ============ Full page ============
function NotifsPage() {
  const [tab, setTab] = useStateN('all');
  const [list, setList] = useStateN(SAMPLE_NOTIFS);
  const [filters, setFilters] = useStateN({ followers_only: false, hide_boosts: false, mute_mentions: false });
  const filtered = useMemoN(() => filterNotifs(list, tab), [list, tab]);
  const grouped = useMemoN(() => {
    const g = {};
    BUCKETS.forEach(b => g[b] = []);
    filtered.forEach(n => { g[timeBucket(n.t)].push(n); });
    return g;
  }, [filtered]);
  const unread = list.filter(n => !n.read).length;
  const markAll = () => setList(list.map(n => ({ ...n, read: true })));

  return (
    <div className="notif-page">
      <div className="notif-page-head">
        <div>
          <div className="notif-page-eye">Inbox</div>
          <h1 className="notif-page-title">Notifications</h1>
          <div className="notif-page-sub">{unread > 0 ? `${unread} unread` : 'All caught up.'} · {list.length} total</div>
        </div>
        <div className="notif-page-tools">
          <button className="notif-tool-btn" onClick={markAll}>
            <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14}}><path d="M4 12l4 4 12-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Mark all read</span>
          </button>
          <button className="notif-tool-btn">
            <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14}}><path d="M3 6h18M6 6v13a1 1 0 001 1h10a1 1 0 001-1V6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Clear all</span>
          </button>
        </div>
      </div>

      <div className="notif-page-tabs">
        {TABS.map(t => {
          const count = filterNotifs(list, t.id).filter(n => !n.read).length;
          return (
            <button key={t.id} className={"notif-page-tab " + (tab === t.id ? 'active' : '')} onClick={() => setTab(t.id)}>
              <span>{t.label}</span>
              {count > 0 && <span className="notif-page-tab-c">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="notif-page-main">
        <div className="notif-page-list">
          {BUCKETS.map(b => grouped[b].length === 0 ? null : (
            <div key={b} className="notif-bucket">
              <div className="notif-bucket-head">
                <span className="notif-bucket-label">{BUCKET_LABEL[b]}</span>
                <span className="notif-bucket-rule"></span>
                <span className="notif-bucket-count">{grouped[b].length}</span>
              </div>
              <div className="notif-bucket-list">
                {grouped[b].map(n => <NotifRow key={n.id} n={n}/>)}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="notif-empty big">
              <div className="notif-empty-mark">∅</div>
              <div className="notif-empty-t">Nothing here yet.</div>
              <div className="notif-empty-s">When someone interacts with you, it'll show up here. Try the filters on the right to broaden the view.</div>
            </div>
          )}
        </div>

        <aside className="notif-page-side">
          <div className="card notif-side-card">
            <div className="notif-side-head">Filters</div>
            <label className="notif-filter">
              <input type="checkbox" checked={filters.followers_only} onChange={(e) => setFilters(f => ({...f, followers_only: e.target.checked}))}/>
              <span className="notif-filter-l">
                <span className="notif-filter-t">From people I follow only</span>
                <span className="notif-filter-d">Hide notifications from accounts you don't follow.</span>
              </span>
            </label>
            <label className="notif-filter">
              <input type="checkbox" checked={filters.hide_boosts} onChange={(e) => setFilters(f => ({...f, hide_boosts: e.target.checked}))}/>
              <span className="notif-filter-l">
                <span className="notif-filter-t">Hide boosts</span>
                <span className="notif-filter-d">Boosts can flood the inbox during a viral moment.</span>
              </span>
            </label>
            <label className="notif-filter">
              <input type="checkbox" checked={filters.mute_mentions} onChange={(e) => setFilters(f => ({...f, mute_mentions: e.target.checked}))}/>
              <span className="notif-filter-l">
                <span className="notif-filter-t">Mute mentions with keywords</span>
                <span className="notif-filter-d">Hide mentions containing words from your filter list.</span>
              </span>
            </label>
            <button className="notif-side-link">Manage filters →</button>
          </div>

          <div className="card notif-side-card">
            <div className="notif-side-head">Delivery</div>
            <div className="notif-side-row">
              <span>Email digest</span>
              <span className="notif-side-v">Weekly</span>
            </div>
            <div className="notif-side-row">
              <span>Browser push</span>
              <span className="notif-side-v on">On</span>
            </div>
            <div className="notif-side-row">
              <span>Quiet hours</span>
              <span className="notif-side-v">22:00 — 08:00</span>
            </div>
            <button className="notif-side-link">Notification settings →</button>
          </div>

          <div className="card notif-side-card notif-side-stats">
            <div className="notif-side-head">This week</div>
            <div className="notif-stat-row">
              <span className="notif-stat-l">★ Favorites</span>
              <span className="notif-stat-bar"><span style={{width: '78%', background: 'var(--accent)'}}/></span>
              <span className="notif-stat-v">42</span>
            </div>
            <div className="notif-stat-row">
              <span className="notif-stat-l">↻ Boosts</span>
              <span className="notif-stat-bar"><span style={{width: '46%', background: '#7dc4be'}}/></span>
              <span className="notif-stat-v">18</span>
            </div>
            <div className="notif-stat-row">
              <span className="notif-stat-l">↩ Replies</span>
              <span className="notif-stat-bar"><span style={{width: '32%', background: 'var(--accent-ink)'}}/></span>
              <span className="notif-stat-v">11</span>
            </div>
            <div className="notif-stat-row">
              <span className="notif-stat-l">@ Mentions</span>
              <span className="notif-stat-bar"><span style={{width: '22%', background: 'var(--accent-ink)'}}/></span>
              <span className="notif-stat-v">7</span>
            </div>
            <div className="notif-stat-row">
              <span className="notif-stat-l">+ Follows</span>
              <span className="notif-stat-bar"><span style={{width: '14%', background: '#a48bd9'}}/></span>
              <span className="notif-stat-v">4</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { NotifsPopover, NotifsPage, NotifRow });
