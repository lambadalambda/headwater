/* global React, I, VaporBanner, Post, Avatar, Card, CardHead, CardFoot, Button, Pill, StatusRow */
const { useState: useStateE } = React;

// ============ Explore view ============
function ExploreView({ posts, onToggleAction, following, toggleFollow }) {
  const [feedTab, setFeedTab] = useStateE('Popular');
  return (
    <div className="card" style={{overflow: 'hidden'}}>
      <div className="hero">
        <div className="hero-deco-l">
          <I.comet style={{width: 80, height: 60}}/>
        </div>
        <div className="hero-deco-r">
          <I.planet style={{width: 60, height: 60}}/>
        </div>
        <h1 className="hero-title">Explore the<br/>fediverse</h1>
        <p className="hero-sub">Discover people, communities, and ideas across the fediverse.</p>
        <div className="hero-search">
          <I.search style={{width: 16, height: 16, color: 'var(--muted)', alignSelf: 'center'}}/>
          <input placeholder="Search users, communities, topics..."/>
          <button className="btn-primary">Search</button>
        </div>
        <div className="hero-tags">
          <span className="lab">Try:</span>
          <a className="tag">#linux</a>
          <a className="tag">#photography</a>
          <a className="tag">#music</a>
          <a className="tag">#privacy</a>
          <a className="tag">#art</a>
        </div>
      </div>

      <div className="section-head">
        <span className="section-title">Curated topics</span>
        <a className="see-all">View all</a>
      </div>
      <div className="topic-strip">
        {[
          { tag: '#fediverse', count: '124K posts', img: 'sunset' },
          { tag: '#indieweb', count: '6,213 posts', img: 'space' },
          { tag: '#privacy', count: '18.7K posts', img: 'pixel-window', dark: true },
          { tag: '#open source', count: '25.2K posts', img: 'pixel-window', dark: true },
          { tag: '#art', count: '43.1K posts', img: 'sunset' },
        ].map((t, i) => (
          <button key={i} className="topic-card">
            <div className="topic-img"><VaporBanner variant={t.img}/></div>
            <div style={{minWidth: 0}}>
              <div className="topic-tag">{t.tag}</div>
              <div className="topic-meta">{t.count}</div>
            </div>
          </button>
        ))}
        <button className="topic-arrow"><I.arrowR style={{width: 16, height: 16}}/></button>
      </div>

      <div className="section-head" style={{marginTop: 4}}>
        <span className="section-title">Featured communities</span>
        <a className="see-all">View all</a>
      </div>
      <div className="community-grid">
        {[
          { name: 'spacebear.net', handle: '@spacebear@spacebear.net', bio: 'A cozy corner of the universe for space nerds and dreamers.', members: '12.1K members', cover: 'space' },
          { name: 'kolektiva.social', handle: '@kolektiva@kolektiva.social', bio: 'A community for creative technologists & builders.', members: '6,742 members', cover: 'city' },
          { name: 'retro.place', handle: '@retro@retro.place', bio: 'Celebrating vintage tech, web aesthetics, and more.', members: '4,389 members', cover: 'pixel-window' },
        ].map(c => (
          <div key={c.name} className="community">
            <div className="community-cover"><VaporBanner variant={c.cover}/></div>
            <div className="community-body">
              <div className="community-name">{c.name}</div>
              <div className="community-handle">{c.handle}</div>
              <div className="community-bio">{c.bio}</div>
              <div className="community-foot">
                <span className="community-members">{c.members}</span>
                <Button
                  variant="follow"
                  className={following[c.name] ? 'following' : ''}
                  onClick={() => toggleFollow(c.name)}>
                  {following[c.name] ? 'Joined' : 'Join'}
                </Button>
              </div>
            </div>
          </div>
        ))}
        <button className="topic-arrow" style={{alignSelf: 'center'}}><I.arrowR style={{width: 16, height: 16}}/></button>
      </div>

      <div className="discover-head">
        <span className="section-title" style={{marginRight: 8}}>Discover feed</span>
        <div className="seg">
          {['Popular', 'New', 'Active'].map(t => (
            <button key={t} className={feedTab === t ? 'active' : ''} onClick={() => setFeedTab(t)}>{t}</button>
          ))}
        </div>
        <span style={{flex: 1}}></span>
        <button className="tab-action" title="Filters"><I.sliders style={{width: 16, height: 16}}/></button>
      </div>

      <div style={{borderTop: '1px solid var(--border)'}}>
        {posts.slice(0, 2).map(p => <Post key={p.id} post={p} onAction={(k) => onToggleAction(p.id, k)}/>)}
      </div>
    </div>
  );
}

// ============ Right column for Explore ============
function QuickSearchCard() {
  const items = [
    { ico: I.search, label: 'Search users' },
    { ico: I.users, label: 'Search communities' },
    { ico: I.hash, label: 'Search hashtags' },
  ];
  return (
    <Card>
      <CardHead style={{borderBottom: 'none', paddingBottom: 4}} title="Quick search"/>
      <div style={{padding: '4px 0 12px'}}>
        {items.map((it, i) => {
          const Ico = it.ico;
          return (
            <button key={i} className="qs">
              <Ico style={{width: 14, height: 14}}/>
              <span>{it.label}</span>
              <I.arrowR className="arr" style={{width: 14, height: 14}}/>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function InstanceStatusExtended() {
  return (
    <Card>
      <CardHead title="Instance status" icon={I.pulse}/>
      <div>
        <StatusRow label="pleromanet.social" value={<Pill>All systems normal</Pill>}/>
        <StatusRow label="Uptime"  value="30d 12h 42m"/>
        <StatusRow label="Users"   value="2,487"/>
        <StatusRow label="Statuses" value="98,312"/>
      </div>
      <CardFoot>View more →</CardFoot>
    </Card>
  );
}

Object.assign(window, { ExploreView, QuickSearchCard, InstanceStatusExtended });
