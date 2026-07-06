/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   I, VaporBanner, Avatar, PostBody, PostMedia, PostActions, PostShell, QuotedPost, PostCW,
   PROFILE, PINNED, POSTS, REPLIES, MEDIA */

const { useState: usePP } = React;

// ============================================================
// Glyphs (small inline, kept local so the file is self-contained)
// ============================================================
function GPin(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true" {...props}>
      <path d="M9 2l4 4-1.5 1.5L13 9l-1.5 1.5L9 8l-4 5-1-1 5-4-2.5-2.5L8 4 9 2z"/>
    </svg>
  );
}
function GLock(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true" {...props}>
      <rect x="3" y="7" width="10" height="7" rx="1.5"/>
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2"/>
    </svg>
  );
}
function GMore(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" aria-hidden="true" {...props}>
      <circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12" cy="8" r="1.3"/>
    </svg>
  );
}
function GBell(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true" {...props}>
      <path d="M3.5 11h9c-.6-.7-1-1.6-1-3V6.5a3.5 3.5 0 10-7 0V8c0 1.4-.4 2.3-1 3z"/>
      <path d="M6.5 13a1.5 1.5 0 003 0"/>
    </svg>
  );
}
function GPlay(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11" {...props}>
      <path d="M4.5 3l8 5-8 5V3z"/>
    </svg>
  );
}
function GAudio(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="11" height="11" {...props}>
      <path d="M3 6v4M6 4v8M9 5v6M12 7v2"/>
    </svg>
  );
}

// ============================================================
// Shared cards / row pieces
// ============================================================

function FollowButton({ state, onChange }) {
  // state: 'stranger' | 'following' | 'mutual' | 'self' | 'requested' | 'blocked'
  if (state === 'self') {
    return <button className="pp-follow-btn" style={{background: 'var(--panel)', color: 'var(--ink-2)', border: '1px solid var(--border-strong)'}}>Edit profile</button>;
  }
  if (state === 'following' || state === 'mutual') {
    return (
      <button
        className="pp-follow-btn is-following"
        onClick={() => onChange && onChange('stranger')}>
        <span className="pp-btn-l">{state === 'mutual' ? 'Mutuals' : 'Following'}</span>
        <span className="pp-btn-l-h">Unfollow</span>
      </button>
    );
  }
  if (state === 'requested') {
    return <button className="pp-follow-btn is-following" disabled>Requested</button>;
  }
  if (state === 'blocked') {
    return <button className="pp-follow-btn" style={{background: 'var(--bad)'}}>Blocked</button>;
  }
  return (
    <button className="pp-follow-btn" onClick={() => onChange && onChange('following')}>
      Follow
    </button>
  );
}

function HeaderActions({ followState, onFollow, includeNotify = true }) {
  return (
    <>
      <FollowButton state={followState} onChange={onFollow}/>
      {includeNotify && followState !== 'self' && (
        <button className="pp-icon-btn" title="Notifications"><GBell/></button>
      )}
      <button className="pp-icon-btn" title="More"><GMore/></button>
    </>
  );
}

// ============================================================
// V1 · CLASSIC — big banner + overlapping avatar
// ============================================================
function V1Header({ followState, onFollow, locked = false, bot = false, remote = false }) {
  return (
    <header className="pp-feed">
      <div className="pp-v1-banner"/>
      <div className="pp-v1-id">
        <div className="pp-v1-id-top">
          <div className={"pp-v1-av " + PROFILE.avClass}/>
          <div className="pp-v1-actions">
            <HeaderActions followState={followState} onFollow={onFollow}/>
          </div>
        </div>
        <div className="pp-v1-name">
          {PROFILE.displayName}
          {locked && <span className="pp-relation-pill locked"><GLock width="9" height="9"/> locked</span>}
          {bot && <span className="pp-relation-pill bot">bot</span>}
          {remote && <span className="pp-relation-pill remote">remote</span>}
        </div>
        <div className="pp-v1-handle">{PROFILE.acct}</div>
      </div>
      <div className="pp-v1-bio">{PROFILE.bio}</div>
    </header>
  );
}

// ============================================================
// V2 · MAGAZINE — compact banner + side-by-side identity + field strip
// ============================================================
function V2Header({ followState, onFollow, locked, bot, remote }) {
  return (
    <header className="pp-feed">
      <div className="pp-v2-banner"/>
      <div className="pp-v2-id">
        <div className={"pp-v2-av " + PROFILE.avClass}/>
        <div className="pp-v2-id-text">
          <div className="pp-v2-pretitle">PROFILE · {PROFILE.acct.split('@').pop().toUpperCase()}</div>
          <div className="pp-v2-name">
            {PROFILE.displayName}
            {locked && <span className="pp-relation-pill locked"><GLock width="9" height="9"/> locked</span>}
            {bot && <span className="pp-relation-pill bot">bot</span>}
            {remote && <span className="pp-relation-pill remote">remote</span>}
          </div>
          <div className="pp-v2-handle">{PROFILE.acct}</div>
        </div>
        <div className="pp-v2-actions">
          <HeaderActions followState={followState} onFollow={onFollow}/>
        </div>
      </div>
      <div className="pp-v2-bio">“{PROFILE.bio.split('\n')[0]}”</div>
    </header>
  );
}

// ============================================================
// V3 · TYPE — no banner, slow-web type-forward
// ============================================================
function V3Header({ followState, onFollow, locked, bot, remote }) {
  return (
    <header className="pp-feed">
      <div className="pp-v3">
        <div className="pp-v3-kicker">PROFILE · {PROFILE.acct.split('@').pop().toUpperCase()}</div>
        <div className="pp-v3-id">
          <div className={"pp-v3-av " + PROFILE.avClass}/>
          <div className="pp-v3-id-text">
            <h1 className="pp-v3-name">
              {PROFILE.displayName}
              {locked && <span className="pp-relation-pill locked"><GLock width="9" height="9"/> locked</span>}
              {bot && <span className="pp-relation-pill bot">bot</span>}
              {remote && <span className="pp-relation-pill remote">remote</span>}
            </h1>
            <div className="pp-v3-handle">{PROFILE.acct}</div>
            <p className="pp-v3-bio">{PROFILE.bio.split('\n')[0]}</p>
          </div>
        </div>
        <div className="pp-v3-rule">
          <span className="pp-v3-rule-glyph">❦</span>
        </div>
        <div className="pp-v3-actions">
          <HeaderActions followState={followState} onFollow={onFollow}/>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Pinned strip + tabs + timeline body
// ============================================================
function PinnedStrip({ posts }) {
  const [expanded, setExpanded] = usePP(false);
  if (!posts || posts.length === 0) return null;
  const visible = expanded ? posts : posts.slice(0, 1);
  const more = posts.length - 1;
  return (
    <div className="pp-pinned-strip">
      <div className="pp-pinned-l">
        <GPin/> pinned <span className="pp-pinned-count">· {posts.length}</span>
        {more > 0 && (
          <button className="pp-pinned-toggle" onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Collapse' : `Show all (${posts.length})`}
          </button>
        )}
      </div>
      <div>
        {visible.map(p => <ProfilePost key={p.id} post={p}/>)}
      </div>
    </div>
  );
}

function Tabs({ tab, setTab, counts }) {
  const tabs = [
    { id: 'posts',   label: 'Posts',   n: counts.posts },
    { id: 'replies', label: 'Posts & Replies', n: counts.replies },
    { id: 'media',   label: 'Media',   n: counts.media },
  ];
  return (
    <div className="pp-tabs">
      {tabs.map(t => (
        <button key={t.id} className={"pp-tab " + (t.id === tab ? 'active' : '')} onClick={() => setTab(t.id)}>
          {t.label}{t.n != null && <span className="pp-tab-count">{t.n}</span>}
        </button>
      ))}
      <span className="pp-tabs-spacer"/>
      <button className="pp-tab-tool" title="Filter / sort">FILTER</button>
    </div>
  );
}

// A profile post is just our normal post shape — re-using PostShell.
function ProfilePost({ post }) {
  return (
    <article className="post">
      <Avatar post={post}/>
      <PostShell post={post} onAction={() => {}}/>
    </article>
  );
}

function MediaCell({ item }) {
  if (item.kind === 'audio') {
    return (
      <div className="pp-media-cell audio">
        <span className="pp-media-title">{item.title}</span>
        <span className="pp-media-kind"><GAudio/> AUDIO</span>
      </div>
    );
  }
  if (item.kind === 'video') {
    return (
      <div className="pp-media-cell">
        <img src={item.src} alt=""/>
        <span className="pp-media-kind"><GPlay/> VIDEO</span>
      </div>
    );
  }
  return (
    <div className="pp-media-cell">
      <img src={item.src} alt=""/>
    </div>
  );
}

function ProfileBody({ tab, mode = 'normal' }) {
  if (mode === 'empty') {
    return (
      <div className="pp-empty">
        <div className="pp-empty-h">Nothing here yet</div>
        <div className="pp-empty-s">soft.hertz hasn't posted anything since joining. Check back later — or follow to get notified when they do.</div>
      </div>
    );
  }
  if (mode === 'locked') {
    return (
      <div className="pp-locked">
        <div className="pp-locked-icon"><GLock/></div>
        <div className="pp-locked-h">This account is locked</div>
        <div className="pp-locked-s">soft.hertz approves followers manually. Send a request and they'll let you in (or not).</div>
        <button className="pp-follow-btn">Send follow request</button>
      </div>
    );
  }
  if (tab === 'media') {
    return (
      <div className="pp-media-grid">
        {MEDIA.map((m, i) => <MediaCell key={i} item={m}/>)}
      </div>
    );
  }
  if (tab === 'replies') {
    return (
      <div>
        {REPLIES.map(p => <ProfilePost key={p.id} post={p}/>)}
        {POSTS.slice(0, 3).map(p => <ProfilePost key={p.id} post={p}/>)}
      </div>
    );
  }
  return (
    <div>
      {POSTS.map(p => <ProfilePost key={p.id} post={p}/>)}
    </div>
  );
}

// ============================================================
// Side rail: profile fields + pinned summary
// ============================================================
function SideRail() {
  return (
    <aside className="pp-side">
      <div className="card">
        <div className="pp-card-h">
          <span className="pp-card-title">Numbers</span>
          <span className="pp-card-meta">STATS</span>
        </div>
        <div className="pp-stats">
          <button className="pp-stat">
            <span className="pp-stat-v">{PROFILE.stats.posts.toLocaleString()}</span>
            <span className="pp-stat-k">Posts</span>
          </button>
          <button className="pp-stat">
            <span className="pp-stat-v">{PROFILE.stats.following}</span>
            <span className="pp-stat-k">Following</span>
          </button>
          <button className="pp-stat">
            <span className="pp-stat-v">{PROFILE.stats.followers.toLocaleString()}</span>
            <span className="pp-stat-k">Followers</span>
          </button>
        </div>
      </div>
      <div className="card">
        <div className="pp-card-h">
          <span className="pp-card-title">Details</span>
          <span className="pp-card-meta">FIELDS</span>
        </div>
        <div className="pp-fields">
          {PROFILE.fields.map((f, i) => (
            <div key={i} className="pp-field-row">
              <span className="pp-field-k">{f.k}</span>
              <span className={"pp-field-v " + (f.verified ? 'verified' : '')}>{f.v}</span>
            </div>
          ))}
        </div>
      </div>
      {PINNED.length > 1 && (
        <div className="card">
          <div className="pp-card-h">
            <span className="pp-card-title">Also pinned</span>
            <span className="pp-card-meta">{PINNED.length - 1} MORE</span>
          </div>
          <div className="pp-mini-pinned">
            {PINNED.slice(1).map(p => (
              <div key={p.id} className="pp-mini-post">
                <div className="pp-mini-post-time">PINNED · {p.time}</div>
                <div className="pp-mini-post-body">{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

// ============================================================
// A whole profile page wrapped in its kicker chrome (for a DCArtboard)
// ============================================================
function ProfileVariant({ Header, kicker, title, sub, cheat, mode = 'normal', extras }) {
  const [tab, setTab] = usePP('posts');
  const [followState, setFollowState] = usePP(extras?.followState || 'stranger');
  const locked  = extras?.locked  || false;
  const bot     = extras?.bot     || false;
  const remote  = extras?.remote  || false;
  return (
    <div className="pp-page">
      <div className="pp-kicker-bar">
        <div className="pp-kicker">{kicker}</div>
        <h1 className="pp-kicker-h">{title}</h1>
        <p className="pp-kicker-sub">{sub}</p>
      </div>
      {cheat && (
        <div className="pp-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="pp-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="pp-cols">
        <div>
          <Header followState={followState} onFollow={setFollowState} locked={locked} bot={bot} remote={remote}/>
          {mode === 'normal' && (
            <div className="pp-feed" style={{marginTop: 14}}>
              <PinnedStrip posts={PINNED}/>
              <Tabs tab={tab} setTab={setTab} counts={{posts: POSTS.length, replies: REPLIES.length + 3, media: MEDIA.length}}/>
              <ProfileBody tab={tab} mode="normal"/>
            </div>
          )}
          {mode === 'locked' && (
            <div className="pp-feed" style={{marginTop: 14}}>
              <ProfileBody tab={tab} mode="locked"/>
            </div>
          )}
          {mode === 'empty' && (
            <div className="pp-feed" style={{marginTop: 14}}>
              <Tabs tab={tab} setTab={setTab} counts={{posts: 0, replies: 0, media: 0}}/>
              <ProfileBody tab={tab} mode="empty"/>
            </div>
          )}
        </div>
        <SideRail/>
      </div>
    </div>
  );
}

// ============================================================
// App — design canvas with all three variants + edge-case row
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Profile page · variants">

      <DCSection
        id="layouts"
        title="Three header layouts"
        subtitle="Same profile, same posts — three different ways of greeting the visitor. The right column is identical (Details + Pinned). The feed swaps between Posts, Posts + Replies (with addressee pills) and a 3-col Media grid.">

        <DCArtboard id="v1" label="V1 · Classic banner" width={1180} height={1880}>
          <ProfileVariant
            Header={V1Header}
            kicker="V1 · CLASSIC"
            title="Big banner + overlapping avatar"
            sub="The familiar Twitter/Mastodon shape: tall purple banner, the avatar overlaps the bottom edge in a heavy frame, name + handle next to follow buttons, bio + stats below. Safest, most expected — and the avatar gets the biggest moment."
            cheat={{
              Banner: '192px tall · gradient',
              Avatar: '104px overlapping',
              Stats: 'Inline row · Posts · Following · Followers',
              Best: 'Default; lowest user-learning cost',
            }}
            extras={{followState: 'mutual'}}/>
        </DCArtboard>

        <DCArtboard id="v2" label="V2 · Magazine" width={1180} height={1820}>
          <ProfileVariant
            Header={V2Header}
            kicker="V2 · MAGAZINE"
            title="Compact masthead + field strip"
            sub="Treats the profile like the top of a magazine spread: short banner, side-by-side identity row, italic-serif bio pull-quote, and a 4-column field strip (Pronouns · Location · Joined · Web). Pinned posts and full fields live below; the masthead stays tight."
            cheat={{
              Banner: '96px · narrow',
              Avatar: '88px inline (no overlap)',
              Bio:    'Italic serif pull-quote',
              Fields: 'Inline 4-up strip',
              Best:   'Distinctive · matches PleromaNet brand voice',
            }}
            extras={{followState: 'stranger'}}/>
        </DCArtboard>

        <DCArtboard id="v3" label="V3 · Slow-web type-forward" width={1180} height={1820}>
          <ProfileVariant
            Header={V3Header}
            kicker="V3 · TYPE-FORWARD"
            title="No banner · type does the work"
            sub="Strips the banner entirely. A 42px serif name, italic bio, decorative ❦ flourish, and a horizontal mono meta-line. Most distinct, slowest in feel — leans hard into the slow-web aesthetic. Best for users who want their words to lead."
            cheat={{
              Banner: 'None',
              Avatar: '124px inline',
              Type:   '42px serif name · italic bio',
              Stats:  'Single mono meta-line',
              Best:   'Brand-leaning · text-forward profiles',
            }}
            extras={{followState: 'stranger'}}/>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="states"
        title="Viewer + content states"
        subtitle="Variations on V2 (the magazine treatment) showing locked profiles, empty timelines, mutuals, and remote-instance accounts. Same shape switches based on viewer relationship and account flags.">

        <DCArtboard id="locked" label="Locked account" width={1180} height={900}>
          <ProfileVariant
            Header={V2Header}
            kicker="STATE · LOCKED"
            title="Locked profile · follow-request gate"
            sub="When the account is locked, the timeline body is replaced by a warm-tinted gate explaining the follow request. Pinned posts and fields stay visible in the side rail."
            cheat={{
              State:  'locked · viewer is stranger',
              Body:   'Replaced by follow-request gate',
              Action: 'Send follow request',
            }}
            mode="locked"
            extras={{followState: 'stranger', locked: true}}/>
        </DCArtboard>

        <DCArtboard id="empty" label="Empty timeline" width={1180} height={900}>
          <ProfileVariant
            Header={V2Header}
            kicker="STATE · EMPTY"
            title="New account · no posts yet"
            sub="Tabs render with zero counts; the body shows an empty state with a friendly message. Side rail still works."
            cheat={{
              State: 'Brand new account',
              Body:  'Empty state copy',
              Tabs:  'All counts zero',
            }}
            mode="empty"
            extras={{followState: 'stranger'}}/>
        </DCArtboard>

        <DCArtboard id="remote" label="Remote · federated user" width={1180} height={1820}>
          <ProfileVariant
            Header={V2Header}
            kicker="STATE · REMOTE"
            title="Federated user from another instance"
            sub="A &lsquo;remote&rsquo; pill sits beside the name. Fields work; the timeline pulls from the home instance's cache. Some actions are routed through the remote server."
            cheat={{
              State: 'Federated user',
              Pill:  'remote (next to name)',
              Limit: 'Some actions route to home instance',
            }}
            extras={{followState: 'stranger', remote: true}}/>
        </DCArtboard>

        <DCArtboard id="self" label="Own profile · edit button" width={1180} height={1820}>
          <ProfileVariant
            Header={V2Header}
            kicker="STATE · SELF"
            title="Own profile · edit instead of follow"
            sub="When the viewer owns this profile, the primary action becomes &lsquo;Edit profile&rsquo;. No notification bell; no follow-state pill. Everything else stays the same."
            cheat={{
              State:  'Self',
              Action: 'Edit profile (replaces Follow)',
              Tools:  'No bell · no follow state',
            }}
            extras={{followState: 'self'}}/>
        </DCArtboard>

      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
