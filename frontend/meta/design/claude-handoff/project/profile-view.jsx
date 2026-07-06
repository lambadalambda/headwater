/* global React, Avatar, PostShell, I */
// ============================================================
// <ProfileView/> + <ProfileSideRail/>
// Integrated V1 profile page. Drops into the app shell as a
// route between Home and Settings. The profile data + posts
// come from props so the same component can render any user
// (including the current user and remote accounts).
//
// Props (ProfileView):
//   profile   { displayName, acct, avClass, bio, fields[], stats }
//   posts     array of post-shaped objects
//   pinned    array of pinned post-shaped objects (first is shown
//             above the tabs; the rest are shown in the side rail
//             OR inline when the user clicks Show all)
//   replies   array of reply posts (Posts & Replies tab)
//   media     array of {kind, src|title} for the Media grid
//   followState  'stranger' | 'following' | 'mutual' | 'self' |
//                'requested' | 'blocked'
//   onFollow  (newState) => void
//   relations { locked?, bot?, remote? }
// ============================================================
const { useState: usePVState } = React;

function PvGPin(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true" {...props}>
      <path d="M9 2l4 4-1.5 1.5L13 9l-1.5 1.5L9 8l-4 5-1-1 5-4-2.5-2.5L8 4 9 2z"/>
    </svg>
  );
}
function PvGLock(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true" {...props}>
      <rect x="3" y="7" width="10" height="7" rx="1.5"/>
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2"/>
    </svg>
  );
}
function PvGMore(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" aria-hidden="true" {...props}>
      <circle cx="4" cy="8" r="1.3"/><circle cx="8" cy="8" r="1.3"/><circle cx="12" cy="8" r="1.3"/>
    </svg>
  );
}
function PvGBell(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true" {...props}>
      <path d="M3.5 11h9c-.6-.7-1-1.6-1-3V6.5a3.5 3.5 0 10-7 0V8c0 1.4-.4 2.3-1 3z"/>
      <path d="M6.5 13a1.5 1.5 0 003 0"/>
    </svg>
  );
}
function PvGPlay(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11" {...props}>
      <path d="M4.5 3l8 5-8 5V3z"/>
    </svg>
  );
}
function PvGAudio(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="11" height="11" {...props}>
      <path d="M3 6v4M6 4v8M9 5v6M12 7v2"/>
    </svg>
  );
}

// ---- Follow button + action cluster ----
function PvFollowButton({ state, onChange }) {
  if (state === 'self') {
    return (
      <button className="pp-follow-btn is-following">Edit profile</button>
    );
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

function PvHeaderActions({ followState, onFollow }) {
  return (
    <>
      <PvFollowButton state={followState} onChange={onFollow}/>
      {followState !== 'self' && (
        <button className="pp-icon-btn" title="Notifications"><PvGBell/></button>
      )}
      <button className="pp-icon-btn" title="More"><PvGMore/></button>
    </>
  );
}

// ---- The V1 header itself ----
function PvHeader({ profile, followState, onFollow, relations }) {
  const { locked, bot, remote } = relations || {};
  return (
    <header className="pp-feed">
      <div className="pp-v1-banner"/>
      <div className="pp-v1-id">
        <div className="pp-v1-id-top">
          <div className={"pp-v1-av " + (profile.avClass || '')}>
            {profile.avBanner && window.VaporBanner && <window.VaporBanner variant={profile.avBanner}/>}
          </div>
          <div className="pp-v1-actions">
            <PvHeaderActions followState={followState} onFollow={onFollow}/>
          </div>
        </div>
        <div className="pp-v1-name">
          {profile.displayName}
          {locked && <span className="pp-relation-pill locked"><PvGLock width="9" height="9"/> locked</span>}
          {bot && <span className="pp-relation-pill bot">bot</span>}
          {remote && <span className="pp-relation-pill remote">remote</span>}
        </div>
        <div className="pp-v1-handle">{profile.acct}</div>
      </div>
      <div className="pp-v1-bio">{profile.bio}</div>
    </header>
  );
}

// ---- Pinned strip + expand toggle ----
function PvPinnedStrip({ posts, onAction }) {
  const [expanded, setExpanded] = usePVState(false);
  if (!posts || posts.length === 0) return null;
  const visible = expanded ? posts : posts.slice(0, 1);
  const more = posts.length - 1;
  return (
    <div className="pp-pinned-strip">
      <div className="pp-pinned-l">
        <PvGPin/> pinned <span className="pp-pinned-count">· {posts.length}</span>
        {more > 0 && (
          <button className="pp-pinned-toggle" onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Collapse' : `Show all (${posts.length})`}
          </button>
        )}
      </div>
      <div>
        {visible.map(p => <PvPost key={p.id} post={p} onAction={onAction}/>)}
      </div>
    </div>
  );
}

function PvTabs({ tab, setTab, counts }) {
  const tabs = [
    { id: 'posts',   label: 'Posts',          n: counts.posts },
    { id: 'replies', label: 'Posts & Replies', n: counts.replies },
    { id: 'media',   label: 'Media',          n: counts.media },
  ];
  return (
    <div className="pp-tabs">
      {tabs.map(t => (
        <button key={t.id} className={"pp-tab " + (t.id === tab ? 'active' : '')} onClick={() => setTab(t.id)}>
          {t.label}{t.n != null && <span className="pp-tab-count">{t.n}</span>}
        </button>
      ))}
      <span className="pp-tabs-spacer"/>
    </div>
  );
}

function PvPost({ post, onAction }) {
  return (
    <article className="post">
      <Avatar post={post}/>
      <PostShell post={post} onAction={(k) => onAction && onAction(post.id, k)}/>
    </article>
  );
}

function PvMediaCell({ item }) {
  if (item.kind === 'audio') {
    return (
      <div className="pp-media-cell audio">
        <span className="pp-media-title">{item.title}</span>
        <span className="pp-media-kind"><PvGAudio/> AUDIO</span>
      </div>
    );
  }
  if (item.kind === 'video') {
    return (
      <div className="pp-media-cell">
        {item.src && <img src={item.src} alt=""/>}
        <span className="pp-media-kind"><PvGPlay/> VIDEO</span>
      </div>
    );
  }
  return (
    <div className="pp-media-cell">
      <img src={item.src} alt={item.alt || ''}/>
    </div>
  );
}

function PvBody({ tab, posts, replies, media, locked, empty, onAction, profileName }) {
  if (locked) {
    return (
      <div className="pp-locked">
        <div className="pp-locked-icon"><PvGLock/></div>
        <div className="pp-locked-h">This account is locked</div>
        <div className="pp-locked-s">{profileName} approves followers manually. Send a request and they'll let you in (or not).</div>
        <button className="pp-follow-btn">Send follow request</button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="pp-empty">
        <div className="pp-empty-h">Nothing here yet</div>
        <div className="pp-empty-s">{profileName} hasn't posted anything yet. Check back later — or follow to get notified when they do.</div>
      </div>
    );
  }
  if (tab === 'media') {
    return (
      <div className="pp-media-grid">
        {media.map((m, i) => <PvMediaCell key={i} item={m}/>)}
      </div>
    );
  }
  if (tab === 'replies') {
    return (
      <div>
        {replies.map(p => <PvPost key={p.id} post={p} onAction={onAction}/>)}
        {posts.slice(0, 3).map(p => <PvPost key={p.id} post={p} onAction={onAction}/>)}
      </div>
    );
  }
  return (
    <div>
      {posts.map(p => <PvPost key={p.id} post={p} onAction={onAction}/>)}
    </div>
  );
}

// ============================================================
// ProfileView — main center column
// ============================================================
function ProfileView({
  profile,
  posts = [],
  pinned = [],
  replies = [],
  media = [],
  followState = 'stranger',
  onFollow,
  relations,
  onAction,
}) {
  const [tab, setTab] = usePVState('posts');
  const locked = relations?.locked && followState !== 'mutual' && followState !== 'following' && followState !== 'self';
  const empty  = posts.length === 0 && !locked;
  return (
    <div className="pp-page">
      <PvHeader
        profile={profile}
        followState={followState}
        onFollow={onFollow}
        relations={relations}/>
      {/* Inline side-rail mirror — shown ONLY when the responsive layout
          hides the right column (≤1280px). Same content as ProfileSideRail
          on wider screens; CSS in profile-page.css toggles visibility. */}
      <div className="pp-inline-rail">
        <ProfileSideRail profile={profile} pinned={pinned}/>
      </div>
      <div className="pp-feed" style={{marginTop: 14}}>
        {!locked && !empty && pinned.length > 0 && (
          <PvPinnedStrip posts={pinned} onAction={onAction}/>
        )}
        {!locked && (
          <PvTabs
            tab={tab}
            setTab={setTab}
            counts={{
              posts:   profile.stats?.posts   ?? posts.length,
              replies: (profile.stats?.posts ?? posts.length) + replies.length,
              media:   media.length,
            }}/>
        )}
        <PvBody
          tab={tab}
          posts={posts}
          replies={replies}
          media={media}
          locked={locked}
          empty={empty}
          onAction={onAction}
          profileName={profile.displayName}/>
      </div>
    </div>
  );
}

// ============================================================
// ProfileSideRail — right column (Numbers, Details, Also pinned)
// ============================================================
function ProfileSideRail({ profile, pinned = [], onStat }) {
  return (
    <>
      <div className="card">
        <div className="pp-card-h">
          <span className="pp-card-title">Numbers</span>
          <span className="pp-card-meta">STATS</span>
        </div>
        <div className="pp-stats">
          <button className="pp-stat" onClick={() => onStat && onStat('posts')}>
            <span className="pp-stat-v">{(profile.stats?.posts ?? 0).toLocaleString()}</span>
            <span className="pp-stat-k">Posts</span>
          </button>
          <button className="pp-stat" onClick={() => onStat && onStat('following')}>
            <span className="pp-stat-v">{(profile.stats?.following ?? 0).toLocaleString()}</span>
            <span className="pp-stat-k">Following</span>
          </button>
          <button className="pp-stat" onClick={() => onStat && onStat('followers')}>
            <span className="pp-stat-v">{(profile.stats?.followers ?? 0).toLocaleString()}</span>
            <span className="pp-stat-k">Followers</span>
          </button>
        </div>
      </div>
      {profile.fields && profile.fields.length > 0 && (
        <div className="card">
          <div className="pp-card-h">
            <span className="pp-card-title">Details</span>
            <span className="pp-card-meta">FIELDS</span>
          </div>
          <div className="pp-fields">
            {profile.fields.map((f, i) => (
              <div key={i} className="pp-field-row">
                <span className="pp-field-k">{f.k}</span>
                <span className={"pp-field-v " + (f.verified ? 'verified' : '')}>{f.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {pinned.length > 1 && (
        <div className="card">
          <div className="pp-card-h">
            <span className="pp-card-title">Also pinned</span>
            <span className="pp-card-meta">{pinned.length - 1} MORE</span>
          </div>
          <div className="pp-mini-pinned">
            {pinned.slice(1).map(p => (
              <div key={p.id} className="pp-mini-post">
                <div className="pp-mini-post-time">PINNED · {p.time}</div>
                <div className="pp-mini-post-body">{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

Object.assign(window, { ProfileView, ProfileSideRail });
