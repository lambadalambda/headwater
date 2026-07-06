/* global React, ReactDOM, Header, SideNav, ProfileMini, FooterCard,
   HomeView, TrendsCard, WhoToFollow, ShortcutsCard, InstanceStatus,
   ProfileSettings, ProfilePreviewCard, ProfileTipsCard,
   ExploreView, QuickSearchCard, InstanceStatusExtended,
   useTweaks, TweaksPanel, TweakSection, TweakSelect, TweakColor, TweakRadio, TweakToggle */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#a48bd9",
  "density": "comfortable",
  "wordmarkFont": "serif",
  "showTrademark": true,
  "darkComposer": false
}/*EDITMODE-END*/;

const initialPosts = [
  {
    id: 9, name: 'orbit', handle: '@orbit@spacebear.net', time: '14m',
    avClass: 'av-orb',
    body: "this perfectly captures my feelings about saturday morning",
    quotedPost: {
      name: 'kestrel.fm', handle: '@kestrel@audio.garden',
      avClass: 'av-grad-3', time: '2h',
      body: "the moment between waking up and remembering you have responsibilities is the most peaceful state known to humanity",
      url: 'https://audio.garden/users/kestrel/statuses/116571702560550172',
      attachments: [
        { kind: 'photo', src: 'samples/cat-door.webp', alt: 'morning light' },
      ],
      replies: 12, boosts: 87, favs: 312,
    },
    replies: 1, boosts: 4, favs: 18,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 10, name: 'datagram', handle: '@datagram@retro.social', time: '1h',
    avClass: 'av-pixel-pc',
    body: "agreed @soft.hertz — sharing in case anyone missed it the first time.",
    quotedPost: {
      name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social',
      avClass: 'av-grad-3', time: '3h',
      body: "the algorithm doesn't care about you. the timeline doesn't either. but the people in it do, and that's worth keeping.",
      url: 'https://kolektiva.social/@softhertz/116571702560550172',
      attachments: [],
      replies: 8, boosts: 34, favs: 142,
    },
    replies: 2, boosts: 11, favs: 47,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 1, name: 'emi', handle: '@emichan@kolektiva.social', time: '16m',
    avClass: 'av-anime',
    body: "tiny update: fixed some bugs, added a toggle, and touched grass.\n\nthe internet can wait.",
    attachments: [
      { kind: 'photo', src: 'samples/cats-pair.webp', alt: 'two cats sitting on a wall' },
    ],
    replies: 2, boosts: 7, favs: 42,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 7, name: 'lumen', handle: '@lumen@candle.house', time: '20m',
    avClass: 'av-grad-3',
    body: "rain recording from earlier, and the window it came from.",
    attachments: [
      { kind: 'photo', src: 'samples/cat-door.webp', alt: 'window in the rain' },
      { kind: 'audio', title: 'rain on glass', byline: 'lumen · field · 2026',
        duration: '5:12', start: 0.18 },
    ],
    replies: 1, boosts: 8, favs: 33,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 5, name: 'kestrel.fm', handle: '@kestrel@audio.garden', time: '32m',
    avClass: 'av-grad-3',
    body: "demo from last night's basement set. 12 minutes of synths, one take, no edits.",
    attachments: [
      { kind: 'audio', title: 'after the storm (demo)', byline: 'kestrel · live take · 2026',
        duration: '4:18', start: 0.28,
        cover: 'samples/encardia-99.png' },
    ],
    replies: 6, boosts: 19, favs: 84,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 8, name: 'orbit', handle: '@orbit@spacebear.net', time: '48m',
    avClass: 'av-orb',
    body: "field walk yesterday — couple of photos + the kettle clip i mentioned + a short video from the windowsill.",
    attachments: [
      { kind: 'photo', src: 'samples/falco.png',     alt: 'station platform at dusk' },
      { kind: 'photo', src: 'samples/dragon.png',    alt: 'shrine path' },
      { kind: 'photo', src: 'samples/cat-door.webp', alt: 'door with cat' },
      { kind: 'video', poster: 'sunset', duration: '0:42', start: 0.15, cc: true,
        caption: 'A slow pan across a windowsill at dusk; faint kettle whistle.' },
      { kind: 'audio', title: 'kettle whistle', byline: 'orbit · field · 2026',
        duration: '2:14' },
      { kind: 'audio', title: 'evening crickets', byline: 'orbit · field · 2026',
        duration: '3:48' },
    ],
    replies: 7, boosts: 24, favs: 116,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 2, name: 'signal', handle: '@signal@mastodon.online', time: '1h',
    avClass: '', avBanner: 'pixel-window',
    body: "dusk in the city 🌆",
    attachments: [
      { kind: 'photo', src: 'samples/falco.png', alt: 'still from a music video, 1985' },
    ],
    replies: 4, boosts: 15, favs: 120,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 6, name: 'pixelmoth', handle: '@pixelmoth@retro.social', time: '1h',
    avClass: 'av-pixel-pc',
    body: "cassette deck loop i recorded out the kitchen window. don't mind the kettle.",
    attachments: [
      { kind: 'video', poster: 'sunset', duration: '0:42', start: 0.15, cc: true,
        caption: 'A slow pan across a windowsill at dusk; faint kettle whistle.' },
    ],
    replies: 3, boosts: 12, favs: 58,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 3, name: 'orbit', handle: '@orbit@spacebear.net', time: '2h',
    avClass: 'av-orb',
    body: "Reminder: your instance is not the whole network.\nReach out. Follow across. The fediverse is bigger than your feed.",
    attachments: [
      { kind: 'photo', src: 'samples/dragon.png', alt: 'dragon coiled around a temple' },
      { kind: 'photo', src: 'samples/flute-text.png', alt: 'The Magic Flute title card' },
    ],
    replies: 1, boosts: 23, favs: 89,
    actions: { reply: false, boost: false, fav: false },
  },
  {
    id: 4, name: 'sysadmin', handle: '@root@pleroma.social', time: '4h',
    avClass: 'av-pc-old',
    body: "Backup your data. Hug your cat. Update PleromaNet™.",
    attachments: [
      { kind: 'photo', src: 'samples/cat-door.webp', alt: 'cat peeking out a doorway' },
      { kind: 'photo', src: 'samples/cat-bank.webp', alt: 'cat on top of an ATM' },
      { kind: 'photo', src: 'samples/cats-pair.webp', alt: 'two stray cats' },
    ],
    replies: 3, boosts: 11, favs: 76,
    actions: { reply: false, boost: false, fav: false },
  },
];

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useState('home'); // home | profile-settings | explore | local | federated
  const [settingsTab, setSettingsTab] = useState('Profile');
  const [posts, setPosts] = useState(initialPosts);
  const [composer, setComposer] = useState({ text: '', privacy: 'Public' });
  const [following, setFollowing] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const [prevView, setPrevView] = useState('home');
  const [replyDraft, setReplyDraft] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('pn-theme') || 'cream');
  const [signedIn, setSignedIn] = useState(true);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('pn-theme', theme);
  }, [theme]);
  const [profile, setProfile] = useState({
    displayName: 'dreambyte',
    username: 'dreambyte',
    instance: '@pleromanet.social',
    bio: 'living in a soft world',
    website: 'https://dreambyte.dev',
    location: 'somewhere on the internet',
    discoverable: true,
    indexable: true,
    showFollowers: true,
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', tweaks.accent);
    // derive accent-ink and accent-soft from accent
    const hex = tweaks.accent.replace('#', '');
    const r = parseInt(hex.slice(0,2), 16), g = parseInt(hex.slice(2,4), 16), b = parseInt(hex.slice(4,6), 16);
    document.documentElement.style.setProperty('--accent-ink', `rgb(${Math.floor(r*0.65)}, ${Math.floor(g*0.6)}, ${Math.floor(b*0.75)})`);
    document.documentElement.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.18)`);
    document.documentElement.style.setProperty('--accent-soft-2', `rgba(${r}, ${g}, ${b}, 0.08)`);
  }, [tweaks.accent]);

  const onToggleAction = (id, key) => {
    setPosts(ps => ps.map(p => p.id === id ? { ...p, actions: { ...p.actions, [key]: !p.actions[key] } } : p));
  };
  const toggleFollow = (id) => setFollowing(f => ({ ...f, [id]: !f[id] }));

  const openThread = (id) => {
    if (view !== 'thread') setPrevView(view);
    setThreadId(id);
    setView('thread');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeThread = () => { setView(prevView || 'home'); setThreadId(null); };

  // Build a synthetic thread for the given post
  const buildThread = (id) => {
    const focused = posts.find(p => p.id === id) || posts[0];
    const ancestors = [
      {
        id: 'a1', name: 'gridwave', handle: '@gridwave@retro.social', time: '5h',
        avClass: 'av-pixel-pc',
        body: "anyone else feel like the web got a little too loud lately?",
        replies: 18, boosts: 42, favs: 210,
        actions: { reply: false, boost: false, fav: false },
      },
    ];
    const replies = [
      {
        id: 'r1', name: 'nyan.binary', handle: '@nyan@catgirl.cloud', time: '12m',
        avClass: 'av-anime',
        body: "this is the energy i needed today 🌙",
        addressees: ['@' + (focused.handle.split('@')[1] || 'unknown'), '@gridwave'],
        replies: 2, boosts: 3, favs: 18,
        actions: { reply: false, boost: false, fav: false },
        nestedReplies: [
          {
            id: 'r1a', name: 'dreambyte', handle: '@dreambyte@pleromanet.social', time: '8m',
            avClass: '', avBanner: 'sunset',
            body: "🤍",
            addressees: ['@nyan', '@' + (focused.handle.split('@')[1] || 'unknown'), '@gridwave'],
            replies: 0, boosts: 0, favs: 4,
            actions: { reply: false, boost: false, fav: false },
            nestedReplies: [],
          },
        ],
      },
      {
        id: 'r2', name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social', time: '22m',
        avClass: 'av-grad-3',
        body: "touched grass too. recommend the slow internet diet. @nyan was saying something similar yesterday.",
        addressees: ['@' + (focused.handle.split('@')[1] || 'unknown'), '@gridwave'],
        replies: 0, boosts: 7, favs: 31,
        actions: { reply: false, boost: false, fav: false },
        nestedReplies: [],
      },
      {
        id: 'r3', name: 'datagram', handle: '@datagram@retro.social', time: '34m',
        avClass: 'av-pixel-pc',
        body: "we used to log off. when did that stop being a thing.",
        addressees: ['@' + (focused.handle.split('@')[1] || 'unknown'), '@gridwave', '@nyan', '@soft.hertz'],
        replies: 4, boosts: 12, favs: 64,
        actions: { reply: false, boost: false, fav: false },
        nestedReplies: [
          {
            id: 'r3a', name: 'orbit', handle: '@orbit@spacebear.net', time: '20m',
            avClass: 'av-orb',
            body: "around the time the algorithm replaced the timeline. agreed with @datagram — the slow web feels possible again.",
            addressees: ['@datagram', '@' + (focused.handle.split('@')[1] || 'unknown'), '@gridwave', '@nyan', '@soft.hertz'],
            replies: 0, boosts: 5, favs: 22,
            actions: { reply: false, boost: false, fav: false },
            nestedReplies: [],
          },
        ],
      },
    ];
    return {
      ancestors,
      focused: {
        ...focused,
        fullTime: '4:18 PM · May 11, 2026',
        source: 'PleromaNet™ Web',
        views: '12.4K',
        bookmarks: 24,
      },
      replies,
    };
  };

  const onReplySubmit = () => {
    if (!replyDraft.trim()) return;
    setReplyDraft('');
  };

  const onPost = () => {
    if (!composer.text.trim()) return;
    const newPost = {
      id: Date.now(),
      name: 'dreambyte', handle: '@dreambyte@pleromanet.social', time: 'now',
      avClass: '', avBanner: 'sunset',
      body: composer.text,
      replies: 0, boosts: 0, favs: 0,
      actions: { reply: false, boost: false, fav: false },
    };
    setPosts(p => [newPost, ...p]);
    setComposer({ text: '', privacy: composer.privacy });
  };

  const wordmarkClass = tweaks.wordmarkFont === 'mono' ? 'wm-mono' : tweaks.wordmarkFont === 'sans' ? 'wm-sans' : '';

  if (!signedIn) {
    return <SignedOutView posts={posts} onSignIn={() => setSignedIn(true)}/>;
  }

  return (
    <div className="app" data-density={tweaks.density}>
      <style>{`
        ${wordmarkClass === 'wm-mono' ? '.brand-name { font-family: var(--mono); font-size: 22px; letter-spacing: -0.02em; }' : ''}
        ${wordmarkClass === 'wm-sans' ? '.brand-name { font-family: var(--sans); font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }' : ''}
        ${!tweaks.showTrademark ? '.brand-name sup { display: none; }' : ''}
        ${tweaks.density === 'compact' ? '.post { padding: 12px 16px; } .composer { padding: 12px 16px; } .card-body, .card-head { padding-top: 9px; padding-bottom: 9px; }' : ''}
        ${tweaks.darkComposer ? '.composer { background: linear-gradient(180deg, #1a1538 0%, #2a1f4a 100%); color: #e8e2f5; } .composer-input { color: #e8e2f5; } .composer-input::placeholder { color: rgba(232,226,245,0.55); } .composer-tool { color: rgba(232,226,245,0.6); } .composer-tool:hover { background: rgba(255,255,255,0.08); color: white; } .composer-count { color: rgba(232,226,245,0.6); }' : ''}
      `}</style>
      <Header view={view} onView={(v) => { setView(v); setDrawerOpen(false); }} tweaks={tweaks} onMenu={() => setDrawerOpen(true)} theme={theme} setTheme={setTheme} onSignOut={() => setSignedIn(false)}/>
      <NotifsPopHost onSeeAll={() => setView('notifs')}/>
      <div className="shell">
        <div className="main">
          <aside>
            <ProfileMini/>
            <div className="card" style={{padding: '6px 0'}}>
              <SideNav
                view={view}
                onView={setView}
                _placeholder1={null}
                settingsTab={settingsTab}
                onSettingsTab={setSettingsTab}
              />
            </div>
            <FooterCard/>
          </aside>

          <section className="center">
            {view === 'home' && (
              <HomeView
                tweaks={tweaks}
                posts={posts}
                onToggleAction={onToggleAction}
                composer={composer}
                setComposer={setComposer}
                onPost={onPost}
                onOpenThread={openThread}/>
            )}
            {view === 'local' && (
              <HomeView tweaks={tweaks} posts={posts.slice(2)} onToggleAction={onToggleAction} composer={composer} setComposer={setComposer} onPost={onPost} onOpenThread={openThread}/>
            )}
            {view === 'federated' && (
              <HomeView tweaks={tweaks} posts={posts} onToggleAction={onToggleAction} composer={composer} setComposer={setComposer} onPost={onPost} onOpenThread={openThread}/>
            )}
            {view === 'thread' && (
              <ThreadView
                thread={buildThread(threadId)}
                focusedId={threadId}
                onBack={closeThread}
                onAction={onToggleAction}
                onReply={onReplySubmit}
                replyDraft={replyDraft}
                setReplyDraft={setReplyDraft}/>
            )}
            {view === 'profile-settings' && (
              <ProfileSettings tab={settingsTab} profile={profile} setProfile={setProfile}/>
            )}
            {view === 'explore' && (
              <ExploreView posts={posts} onToggleAction={onToggleAction} following={following} toggleFollow={toggleFollow}/>
            )}
            {view === 'notifs' && (
              <NotifsPage/>
            )}
          </section>

          <aside>
            {view === 'home' || view === 'local' || view === 'federated' || view === 'thread' ? (
              <>
                <TrendsCard/>
                <WhoToFollow following={following} toggleFollow={toggleFollow}/>
                <ShortcutsCard/>
                <InstanceStatus/>
              </>
            ) : null}
            {view === 'profile-settings' && (
              <>
                <ProfilePreviewCard/>
                <ProfileTipsCard/>
              </>
            )}
            {view === 'explore' && (
              <>
                <QuickSearchCard/>
                <WhoToFollow following={following} toggleFollow={toggleFollow}/>
                <ShortcutsCard/>
                <InstanceStatusExtended/>
              </>
            )}
          </aside>
        </div>
      </div>

      <TweaksPanel>
        <TweakSection title="Brand">
          <TweakRadio
            label="Wordmark font"
            value={tweaks.wordmarkFont}
            onChange={v => setTweak('wordmarkFont', v)}
            options={[
              { value: 'serif', label: 'Serif' },
              { value: 'sans', label: 'Sans' },
              { value: 'mono', label: 'Mono' },
            ]}/>
          <TweakToggle label="Show ™ trademark" value={tweaks.showTrademark} onChange={v => setTweak('showTrademark', v)}/>
        </TweakSection>
        <TweakSection title="Theme">
          <TweakColor label="Accent color" value={tweaks.accent} onChange={v => setTweak('accent', v)}/>
          <TweakRadio
            label="Density"
            value={tweaks.density}
            onChange={v => setTweak('density', v)}
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
            ]}/>
          <TweakToggle label="Dark composer" value={tweaks.darkComposer} onChange={v => setTweak('darkComposer', v)}/>
        </TweakSection>
      </TweaksPanel>

      {/* Mobile drawer (left sidebar) */}
      <div className={"mobile-drawer-bg " + (drawerOpen ? 'open' : '')} onClick={() => setDrawerOpen(false)}></div>
      <div className={"mobile-drawer " + (drawerOpen ? 'open' : '')}>
        <div className="drawer-head">
          <div className="brand">
            <div className="brand-mark"><I.sparkBig/></div>
            <div className="brand-name">PleromaNet<sup>™</sup></div>
          </div>
          <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <ProfileMini/>
        <div className="card" style={{padding: '6px 0'}}>
          <SideNav
            view={view}
            onView={(v) => { setView(v); setDrawerOpen(false); }}
            _placeholder2={null}
            settingsTab={settingsTab}
            onSettingsTab={(t) => { setSettingsTab(t); setDrawerOpen(false); }}
          />
        </div>
        <FooterCard/>
      </div>

      {/* Mobile sheet (right rail) */}
      <div className={"mobile-sheet-bg " + (sheetOpen ? 'open' : '')} onClick={() => setSheetOpen(false)}></div>
      <div className={"mobile-sheet " + (sheetOpen ? 'open' : '')}>
        <div className="sheet-grip"></div>
        <div className="sheet-head">
          <span className="sheet-title">{view === 'profile-settings' ? 'Profile preview' : view === 'explore' ? 'Discover' : 'Trends & Activity'}</span>
          <button className="drawer-close" onClick={() => setSheetOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        {view === 'home' || view === 'local' || view === 'federated' ? (
          <>
            <TrendsCard/>
            <WhoToFollow following={following} toggleFollow={toggleFollow}/>
            <ShortcutsCard/>
            <InstanceStatus/>
          </>
        ) : null}
        {view === 'profile-settings' && (
          <>
            <ProfilePreviewCard/>
            <ProfileTipsCard/>
          </>
        )}
        {view === 'explore' && (
          <>
            <QuickSearchCard/>
            <WhoToFollow following={following} toggleFollow={toggleFollow}/>
            <ShortcutsCard/>
            <InstanceStatusExtended/>
          </>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-bottom">
        <button className={"mob-tab " + (view === 'home' ? 'active' : '')} onClick={() => setView('home')}>
          <I.home/><span>Home</span>
        </button>
        <button className={"mob-tab " + (view === 'explore' ? 'active' : '')} onClick={() => setView('explore')}>
          <I.search/><span>Explore</span>
        </button>
        <button className={"mob-tab " + (view === 'notifs' ? 'active' : '')} onClick={() => setView('notifs')}>
          <I.bell/><span>Alerts</span>
          <span className="tab-badge">3</span>
        </button>
        <button className={"mob-tab " + (view === 'profile-settings' ? 'active' : '')} onClick={() => setView('profile-settings')}>
          <I.gear/><span>Settings</span>
        </button>
        <button className="mob-tab" onClick={() => setSheetOpen(true)}>
          <I.list/><span>More</span>
        </button>
      </nav>
      <Radio/>
      {window.AttachmentLightboxHost && <window.AttachmentLightboxHost/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);

function NotifsPopHost({ onSeeAll }) {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const h = () => setOpen(o => !o);
    window.addEventListener('toggle-notifs-pop', h);
    return () => window.removeEventListener('toggle-notifs-pop', h);
  }, []);
  if (!open) return null;
  // Anchor: portal-ish — popover renders next to bell via fixed positioning relative to bell rect
  return <NotifsAnchored onClose={() => setOpen(false)} onSeeAll={() => { setOpen(false); onSeeAll(); }}/>;
}

function NotifsAnchored({ onClose, onSeeAll }) {
  const [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    const bell = document.querySelector('[data-bell]');
    if (bell) {
      const r = bell.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
  }, []);
  if (!pos) return null;
  return (
    <div style={{position: 'fixed', top: pos.top, right: pos.right, zIndex: 100}}>
      <NotifsPopover onClose={onClose} onSeeAll={onSeeAll}/>
    </div>
  );
}
