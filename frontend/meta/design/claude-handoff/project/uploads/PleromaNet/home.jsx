/* global React, I, VaporBanner, Avatar, PostHead, PostBody, PostMedia, PostActions,
   Card, CardHead, CardFoot, Button, Pill, StatusRow,
   OekakiModal */
const { useState: useStateF } = React;

// ============ Home feed ============
function HomeView({ tweaks, posts, onToggleAction, composer, setComposer, onPost, onOpenThread }) {
  const [tab, setTab] = useStateF('Home');
  return (
    <div className="card">
      <div className="tabs">
        {['Home', 'Local', 'Federated'].map(t => (
          <button key={t} className={"tab " + (tab === t ? 'active' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
        <div className="tab-spacer"></div>
        <button className="tab-action" title="Filters"><I.sliders style={{width: 16, height: 16}}/></button>
      </div>
      <Composer composer={composer} setComposer={setComposer} onPost={onPost}/>
      <div>
        {posts.map(p => <Post key={p.id} post={p} onAction={(k) => onToggleAction(p.id, k)} onOpen={() => onOpenThread && onOpenThread(p.id)}/>)}
      </div>
    </div>
  );
}

function Composer({ composer, setComposer, onPost }) {
  const [oekOpen, setOekOpen] = React.useState(false);
  const remaining = 500 - (composer.text || '').length;
  return (
    <div className="composer">
      <Avatar variant="compose" avBanner="sunset"/>
      <div>
        <textarea
          className="composer-input"
          placeholder="What's on your mind?"
          value={composer.text}
          onChange={e => setComposer({...composer, text: e.target.value})}
        />
        <div className="composer-row">
          <button className="composer-tool" title="Image"><I.image style={{width: 18, height: 18}}/></button>
          <button className="composer-tool" title="Draw (Oekaki)" onClick={() => setOekOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}>
              <path d="M3 21l4-1 11.5-11.5a2.121 2.121 0 00-3-3L4 17l-1 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M14 6l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M5 19l1.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="composer-tool" title="Poll"><I.poll style={{width: 18, height: 18}}/></button>
          <button className="composer-tool" title="Emoji"><I.smile style={{width: 18, height: 18}}/></button>
          <button className="composer-tool cw" title="Content warning">CW</button>
          <button className="composer-tool privacy">
            <I.globe style={{width: 13, height: 13}}/>
            <span>{composer.privacy}</span>
            <I.chevDown style={{width: 12, height: 12}}/>
          </button>
          <span className="composer-spacer"></span>
          <span className="composer-count" style={{color: remaining < 50 ? 'var(--bad)' : 'var(--muted)'}}>{remaining}</span>
          <button className="btn-primary" onClick={onPost} disabled={!composer.text.trim()}>Post</button>
        </div>
      </div>
      <OekakiModal
        open={oekOpen}
        onClose={() => setOekOpen(false)}
        onAttach={(dataURL) => {
          setComposer({
            ...composer,
            text: composer.text + (composer.text ? '\n' : '') + '🖌️ attached an oekaki sketch',
            oekaki: dataURL,
          });
          setOekOpen(false);
        }}
      />
    </div>
  );
}

function Post({ post, onAction, onOpen }) {
  const click = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    onOpen && onOpen();
  };
  const openLightbox = (idx) => {
    if (!post.attachments || !post.attachments.length) return;
    const opener = window.openLightbox;
    if (opener) opener(post.attachments, idx, {
      name: post.name, handle: post.handle,
      avClass: post.avClass, avBanner: post.avBanner,
    });
  };
  return (
    <div className="post" onClick={click} style={{cursor: onOpen ? 'pointer' : 'default'}}>
      <Avatar post={post}/>
      <div style={{minWidth: 0}}>
        <PostHead post={post}/>
        <PostBody body={post.body} addressees={post.addressees}/>
        <QuotedPost quoted={post.quotedPost}/>
        <PostMedia post={post} onOpen={openLightbox}/>
        <PostActions post={post} onAction={onAction}/>
      </div>
    </div>
  );
}

// ============ Attachment components moved to attachments.jsx ============
// PhotoGrid, VideoAttachment, AudioAttachment, CompactAudio, MediaHeroStrip,
// AttachmentLightbox, AttachmentLightboxHost, openLightbox

// ============ Right column cards (Home) ============
function TrendsCard() {
  const trends = [
    { rank: 1, tag: '#fediverse', count: '12.4K' },
    { rank: 2, tag: '#IndieWeb', count: '6,213' },
    { rank: 3, tag: '#pleroma', count: '5,105' },
    { rank: 4, tag: '#vaporwave', count: '3,901' },
    { rank: 5, tag: '#selfhosted', count: '2,844' },
  ];
  return (
    <Card>
      <CardHead title="Trends" icon={I.trend}/>
      <div className="trend-list">
        {trends.map(t => (
          <button key={t.rank} className="trend-item">
            <span className="trend-rank">{t.rank}</span>
            <span>
              <div className="trend-tag">{t.tag}</div>
              <div className="trend-meta">{t.count} posts</div>
            </span>
          </button>
        ))}
      </div>
      <CardFoot>View all trends →</CardFoot>
    </Card>
  );
}

function WhoToFollow({ following, toggleFollow }) {
  const sugg = [
    { id: 'nyan', name: 'nyan.binary', handle: '@nyan@catgirl.cloud', av: 'av-anime' },
    { id: 'datagram', name: 'datagram', handle: '@datagram@retro.social', av: 'av-pixel-pc' },
    { id: 'soft', name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social', av: 'av-grad-3' },
  ];
  return (
    <Card>
      <CardHead title="Who to follow" icon={I.users}/>
      <div style={{padding: '6px 0'}}>
        {sugg.map(s => (
          <div key={s.id} className="suggest">
            <div className={"suggest-av " + s.av}></div>
            <div>
              <div className="suggest-name">{s.name}</div>
              <div className="suggest-handle">{s.handle}</div>
            </div>
            <Button
              variant="follow"
              className={following[s.id] ? 'following' : ''}
              onClick={() => toggleFollow(s.id)}>
              {following[s.id] ? 'Following' : 'Follow'}
            </Button>
          </div>
        ))}
      </div>
      <CardFoot>View more suggestions →</CardFoot>
    </Card>
  );
}

function ShortcutsCard() {
  const shorts = [
    { ico: I.pencil, label: 'Compose new post', key: 'N' },
    { ico: I.msg, label: 'Direct messages', key: 'M' },
    { ico: I.bookmark, label: 'Bookmarks', key: 'B' },
    { ico: I.list, label: 'Lists', key: 'L' },
    { ico: I.gear, label: 'User settings', key: 'S' },
  ];
  return (
    <Card>
      <CardHead title="Shortcuts" icon={I.bolt}/>
      <div style={{padding: '6px 0'}}>
        {shorts.map((s, i) => {
          const Ico = s.ico;
          return (
            <button key={i} className="short">
              <span className="ico"><Ico style={{width: 14, height: 14}}/></span>
              <span>{s.label}</span>
              <span className="key">{s.key}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function InstanceStatus() {
  return (
    <Card>
      <CardHead title="Instance status" icon={I.pulse}/>
      <div>
        <StatusRow label="pleromanet.social" value={<Pill>All systems normal</Pill>}/>
        <StatusRow label="Uptime" value="30d 12h 42m"/>
        <StatusRow label="Users" value="2,487"/>
      </div>
    </Card>
  );
}

Object.assign(window, {
  HomeView, Composer, Post,
  TrendsCard, WhoToFollow, ShortcutsCard, InstanceStatus,
});
