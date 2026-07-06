/* global React, I, VaporBanner, Avatar, Card, CardHead, StatBlock, StatStrip */
const { useState: useStateA } = React;

// ============ Vaporwave / pixel placeholder components ============
// Each variant is a self-contained SVG composition. Banners scale via
// preserveAspectRatio="xMidYMid slice" so they crop cleanly at any
// container shape — banner (16:7), avatar (1:1), or cover (3:1).

function VaporBanner({ variant = 'sunset', className = '' }) {
  if (variant === 'pixel-window') {
    return (
      <div className={"pw-banner " + className}>
        <div className="pw-banner-bar">
          <div className="pw-banner-dot"></div>
          <div className="pw-banner-dot y"></div>
          <div className="pw-banner-dot g"></div>
        </div>
        <div className="pw-banner-content">
          <BannerPixelDesktop/>
        </div>
      </div>
    );
  }
  if (variant === 'city') {
    return <BannerCity className={className}/>;
  }
  if (variant === 'space') {
    return <BannerSpace className={className}/>;
  }
  // sunset (default)
  return <BannerSunset className={className}/>;
}

function BannerSunset({ className = '' }) {
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice"
         className={className}
         style={{width: '100%', height: '100%', display: 'block'}}>
      <defs>
        <linearGradient id="sun-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d1840"/>
          <stop offset="35%" stopColor="#3d2d6a"/>
          <stop offset="60%" stopColor="#a8688c"/>
          <stop offset="82%" stopColor="#e7a98a"/>
          <stop offset="100%" stopColor="#f4cfa1"/>
        </linearGradient>
        <radialGradient id="sun-disc" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fff5d4"/>
          <stop offset="45%" stopColor="#ffb877"/>
          <stop offset="100%" stopColor="#e87d6c"/>
        </radialGradient>
        <linearGradient id="sun-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd1a8" stopOpacity="0"/>
          <stop offset="100%" stopColor="#ffd1a8" stopOpacity="0.45"/>
        </linearGradient>
      </defs>
      <rect width="100" height="50" fill="url(#sun-sky)"/>
      {/* Distant stars in the upper sky */}
      <g fill="#fff5d4">
        <circle cx="14" cy="5" r="0.35" opacity="0.9"/>
        <circle cx="32" cy="3" r="0.25" opacity="0.7"/>
        <circle cx="73" cy="4" r="0.3" opacity="0.85"/>
        <circle cx="89" cy="7" r="0.2" opacity="0.6"/>
        <circle cx="55" cy="8" r="0.18" opacity="0.5"/>
      </g>
      {/* Atmospheric haze across the horizon */}
      <rect x="0" y="28" width="100" height="14" fill="url(#sun-glow)"/>
      {/* Sun disc, half-set behind the horizon */}
      <circle cx="50" cy="39" r="13" fill="url(#sun-disc)"/>
      {/* Layered mountain silhouettes — depth without clutter */}
      <path d="M0 50 L0 41 L18 33 L34 38 L52 30 L66 36 L82 32 L100 36 L100 50 Z"
            fill="#1d1840" opacity="0.55"/>
      <path d="M0 50 L0 44 L14 40 L30 43 L44 39 L62 42 L78 39 L100 42 L100 50 Z"
            fill="#1d1840" opacity="0.78"/>
      {/* Reflection slivers below the horizon */}
      <g stroke="#ffd1a8" strokeLinecap="round">
        <line x1="34" y1="45.5" x2="66" y2="45.5" strokeWidth="0.25" opacity="0.5"/>
        <line x1="40" y1="47" x2="60" y2="47" strokeWidth="0.2" opacity="0.35"/>
        <line x1="44" y1="48.4" x2="56" y2="48.4" strokeWidth="0.15" opacity="0.25"/>
      </g>
    </svg>
  );
}

function BannerCity({ className = '' }) {
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice"
         className={className}
         style={{width: '100%', height: '100%', display: 'block'}}>
      <defs>
        <linearGradient id="city-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c0a28"/>
          <stop offset="45%" stopColor="#2a1f4a"/>
          <stop offset="85%" stopColor="#7e5a92"/>
          <stop offset="100%" stopColor="#d889a0"/>
        </linearGradient>
        <linearGradient id="city-buildings" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0f30" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#0a0520"/>
        </linearGradient>
      </defs>
      <rect width="100" height="50" fill="url(#city-sky)"/>
      {/* Stars */}
      <g fill="white">
        <circle cx="10" cy="6" r="0.35" opacity="0.8"/>
        <circle cx="25" cy="3" r="0.25" opacity="0.6"/>
        <circle cx="40" cy="7" r="0.3" opacity="0.7"/>
        <circle cx="58" cy="4" r="0.2" opacity="0.5"/>
        <circle cx="72" cy="9" r="0.3" opacity="0.8"/>
        <circle cx="92" cy="3" r="0.25" opacity="0.6"/>
      </g>
      {/* Crescent moon */}
      <g transform="translate(80 9)">
        <circle r="3" fill="#fff5d4" opacity="0.9"/>
        <circle cx="1.2" r="3" fill="#0c0a28"/>
      </g>
      {/* Skyline silhouette */}
      <path d="M0 50 L0 36 L4 36 L4 30 L9 30 L9 33 L14 33 L14 26 L19 26 L19 32 L24 32 L24 22 L29 22 L29 30 L34 30 L34 27 L39 27 L39 32 L44 32 L44 20 L49 20 L49 28 L54 28 L54 25 L59 25 L59 30 L64 30 L64 22 L69 22 L69 27 L74 27 L74 24 L79 24 L79 31 L84 31 L84 28 L89 28 L89 30 L94 30 L94 26 L100 26 L100 50 Z"
            fill="url(#city-buildings)"/>
      {/* Window lights */}
      <g fill="#ffd1a8" opacity="0.85">
        {[[6,33],[10,32],[15,29],[20,28],[25,25],[30,26],[35,30],[40,29],[45,23],[50,24],[55,27],[60,26],[65,25],[70,24],[75,27],[80,28],[85,30],[90,29],[95,28]].map(([x,y], i) => (
          <rect key={i} x={x-0.4} y={y} width="0.6" height="0.6"/>
        ))}
      </g>
      <g fill="#f78fb3" opacity="0.7">
        {[[7,35],[12,31],[17,28],[27,24],[37,28],[47,26],[57,29],[67,28],[77,30]].map(([x,y], i) => (
          <rect key={i} x={x-0.4} y={y} width="0.6" height="0.6"/>
        ))}
      </g>
    </svg>
  );
}

function BannerSpace({ className = '' }) {
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice"
         className={className}
         style={{width: '100%', height: '100%', display: 'block'}}>
      <defs>
        <radialGradient id="space-bg" cx="30%" cy="35%" r="85%">
          <stop offset="0%" stopColor="#2a1f4a"/>
          <stop offset="45%" stopColor="#15102a"/>
          <stop offset="100%" stopColor="#070414"/>
        </radialGradient>
        <radialGradient id="space-planet" cx="30%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#c2a8e0"/>
          <stop offset="55%" stopColor="#6e4f9e"/>
          <stop offset="100%" stopColor="#2a1f4a"/>
        </radialGradient>
      </defs>
      <rect width="100" height="50" fill="url(#space-bg)"/>
      {/* Scattered starfield */}
      <g fill="white">
        <circle cx="8" cy="6" r="0.4" opacity="0.9"/>
        <circle cx="15" cy="32" r="0.3" opacity="0.6"/>
        <circle cx="22" cy="12" r="0.5" opacity="0.95"/>
        <circle cx="30" cy="42" r="0.25" opacity="0.5"/>
        <circle cx="38" cy="8" r="0.35" opacity="0.8"/>
        <circle cx="45" cy="38" r="0.3" opacity="0.6"/>
        <circle cx="52" cy="4" r="0.45" opacity="0.9"/>
        <circle cx="55" cy="22" r="0.2" opacity="0.5"/>
        <circle cx="63" cy="45" r="0.3" opacity="0.7"/>
        <circle cx="88" cy="10" r="0.35" opacity="0.8"/>
        <circle cx="94" cy="30" r="0.25" opacity="0.55"/>
        <circle cx="82" cy="40" r="0.4" opacity="0.9"/>
        <circle cx="3" cy="22" r="0.2" opacity="0.4"/>
        <circle cx="70" cy="18" r="0.3" opacity="0.7"/>
      </g>
      {/* Twinkle accents */}
      <circle cx="42" cy="22" r="0.6" fill="#fff5d4">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="60" cy="36" r="0.5" fill="#e7a8c9">
        <animate attributeName="opacity" values="1;0.4;1" dur="3.1s" repeatCount="indefinite"/>
      </circle>
      {/* Ringed planet, offset right */}
      <g transform="translate(72 28) rotate(-18)">
        <ellipse rx="18" ry="3" fill="none" stroke="#e7a8c9" strokeWidth="0.6" opacity="0.45"/>
        <ellipse rx="18" ry="3" fill="none" stroke="#a48bd9" strokeWidth="0.3" opacity="0.8" strokeDasharray="30 1"/>
      </g>
      <circle cx="72" cy="28" r="9" fill="url(#space-planet)"/>
      {/* Front portion of the ring crossing the planet */}
      <g transform="translate(72 28) rotate(-18)">
        <path d="M -18 0 A 18 3 0 0 1 18 0" fill="none" stroke="#a48bd9" strokeWidth="0.4" opacity="0.5" strokeDasharray="0 18 30 30"/>
      </g>
    </svg>
  );
}

function BannerPixelDesktop() {
  // Inside the window-chrome — a low-poly dawn landscape (cleaner than a
  // "window inside a window" of vaporwave clutter).
  return (
    <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice"
         style={{width: '100%', height: '100%', display: 'block'}}>
      <defs>
        <linearGradient id="pw-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3d2d6a"/>
          <stop offset="60%" stopColor="#a48bd9"/>
          <stop offset="100%" stopColor="#e7a8c9"/>
        </linearGradient>
      </defs>
      <rect width="100" height="60" fill="url(#pw-sky)"/>
      {/* Sun */}
      <circle cx="72" cy="24" r="6" fill="#fff5d4" opacity="0.95"/>
      <circle cx="72" cy="24" r="10" fill="#fff5d4" opacity="0.18"/>
      {/* Far peaks */}
      <path d="M0 60 L0 42 L18 30 L32 38 L48 28 L62 36 L80 32 L100 38 L100 60 Z"
            fill="#2a1f4a" opacity="0.55"/>
      {/* Near hills */}
      <path d="M0 60 L0 48 L20 42 L40 46 L60 40 L80 44 L100 42 L100 60 Z"
            fill="#3d2d6a" opacity="0.85"/>
      <path d="M0 60 L0 52 L25 50 L50 53 L75 50 L100 52 L100 60 Z"
            fill="#1d1840"/>
      {/* CRT scanlines */}
      <g fill="rgba(255,255,255,0.05)">
        {Array.from({length: 14}).map((_, i) => (
          <rect key={i} x="0" y={i * 4.3 + 1} width="100" height="1"/>
        ))}
      </g>
    </svg>
  );
}

function CityScape() {
  // Legacy export kept for back-compat (no longer used by VaporBanner).
  return <BannerCity/>;
}

// ============ Header ============
function Header({ view, onView, tweaks, onMenu, theme, setTheme, onSignOut }) {
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const navs = [
    { id: 'explore', label: 'Explore' },
    { id: 'about', label: 'About' },
  ];
  React.useEffect(() => {
    if (!userMenuOpen) return;
    const close = (e) => {
      if (!e.target.closest('.user-chip') && !e.target.closest('.user-menu')) setUserMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [userMenuOpen]);
  return (
    <header className="header">
      <div className="shell">
        <div className="header-inner">
          <div className="brand">
            <button className="menu-btn" onClick={onMenu} aria-label="Menu">
              <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
            <div className="brand-mark">
              <I.sparkBig />
            </div>
            <div>
              <div className="brand-name">
                {tweaks.brand || 'PleromaNet'}<sup>™</sup>
              </div>
            </div>
            <div className="brand-tag">A federated<br/>social web</div>
          </div>
          <nav className="nav">
            {navs.map(n => (
              <button
                key={n.id}
                className={"nav-item " + ((view === n.id || (view === 'profile-settings' && n.id === 'home')) ? 'active' : '')}
                onClick={() => onView(n.id)}>
                {n.label}
              </button>
            ))}
          </nav>
          <div className="header-right" style={{position: 'relative'}}>
            <div className="search">
              <I.search style={{width: 14, height: 14, color: 'var(--muted)'}}/>
              <input placeholder="Search..." />
              <span className="kbd">⌘K</span>
            </div>
            <button className="icon-btn" aria-label="Notifications" data-bell onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('toggle-notifs-pop')); }}>
              <I.bell style={{width: 20, height: 20}}/>
              <span className="badge">3</span>
            </button>
            <button className="user-chip" onClick={() => setUserMenuOpen(v => !v)}>
              <div className="av av-grad-1" style={{width: 28, height: 28, borderRadius: '50%', overflow: 'hidden'}}>
                <VaporBanner variant="sunset"/>
              </div>
              <span style={{fontWeight: 500}}>dreambyte</span>
              <I.chevDown style={{width: 14, height: 14, color: 'var(--muted)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s'}}/>
            </button>
            {userMenuOpen && <UserMenu onView={(v) => { onView(v); setUserMenuOpen(false); }} theme={theme} setTheme={setTheme} onSignOut={() => { setUserMenuOpen(false); onSignOut && onSignOut(); }}/>}
          </div>
        </div>
      </div>
    </header>
  );
}

function UserMenu({ onView, theme, setTheme, onSignOut }) {
  const themes = [
    { id: 'cream', label: 'Cream', grad: 'linear-gradient(135deg, #f5f1e8 50%, #a48bd9 50%)' },
    { id: 'dusk', label: 'Dusk', grad: 'linear-gradient(135deg, #2a1f4a 50%, #e7a8c9 50%)' },
    { id: 'drive', label: 'Drive', grad: 'linear-gradient(135deg, #0c0a28 50%, #7dc4be 50%)' },
    { id: 'simoun', label: 'Simoun', grad: 'linear-gradient(135deg, #18203f 50%, #e8763a 50%)' },
  ];
  return (
    <div className="user-menu">
      <div className="user-menu-head">
        <div className="user-menu-av">
          <VaporBanner variant="sunset"/>
        </div>
        <div style={{minWidth: 0, flex: 1}}>
          <div className="user-menu-name">dreambyte</div>
          <div className="user-menu-handle">@dreambyte@pleromanet.social</div>
          {window.NowPlayingLine && <window.NowPlayingLine compact hidePausedLabel/>}
        </div>
      </div>
      <div className="user-menu-stats">
        <div className="user-menu-stat"><div className="user-menu-stat-v">1,248</div><div className="user-menu-stat-l">Posts</div></div>
        <div className="user-menu-stat"><div className="user-menu-stat-v">312</div><div className="user-menu-stat-l">Following</div></div>
        <div className="user-menu-stat"><div className="user-menu-stat-v">1,921</div><div className="user-menu-stat-l">Followers</div></div>
      </div>
      <div className="user-menu-sec">
        <button className="user-menu-item" onClick={() => onView('profile-settings')}>
          <I.users style={{width: 16, height: 16}}/><span>View profile</span>
          <I.arrowR style={{width: 13, height: 13, marginLeft: 'auto', color: 'var(--muted-2)'}}/>
        </button>
        <button className="user-menu-item"><I.bookmark style={{width: 16, height: 16}}/><span>Bookmarks</span></button>
        <button className="user-menu-item"><I.star style={{width: 16, height: 16}}/><span>Favorites</span></button>
        <button className="user-menu-item"><I.list style={{width: 16, height: 16}}/><span>Lists</span></button>
        <button className="user-menu-item">
          <I.lock style={{width: 16, height: 16}}/><span>Drafts &amp; scheduled</span>
          <span className="user-menu-badge">2</span>
        </button>
      </div>
      <div className="user-menu-sec">
        <div className="user-menu-label">Appearance</div>
        <div className="user-menu-themes">
          {themes.map(t => (
            <button
              key={t.id}
              className={"user-menu-theme " + (theme === t.id ? 'active' : '')}
              onClick={() => setTheme(t.id)}
              title={t.label}>
              <span style={{background: t.grad}}></span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="user-menu-sec">
        <button className="user-menu-item" onClick={() => onView('profile-settings')}>
          <I.gear style={{width: 16, height: 16}}/><span>Settings</span><span className="kbd" style={{marginLeft: 'auto'}}>S</span>
        </button>
        <button className="user-menu-item"><I.info style={{width: 16, height: 16}}/><span>Keyboard shortcuts</span><span className="kbd" style={{marginLeft: 'auto'}}>?</span></button>
        <button className="user-menu-item"><I.ext style={{width: 16, height: 16}}/><span>About this instance</span></button>
      </div>
      <div className="user-menu-sec">
        <button className="user-menu-item">
          <svg viewBox="0 0 24 24" fill="none" style={{width: 16, height: 16}}><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M16 7l3 3-3 3M19 10h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Switch account</span>
        </button>
        <button className="user-menu-item user-menu-danger" onClick={onSignOut}>
          <svg viewBox="0 0 24 24" fill="none" style={{width: 16, height: 16}}><path d="M14 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 8l-4 4 4 4M6 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Sign out</span>
        </button>
      </div>
      <div className="user-menu-foot">
        <span>PleromaNet™ 2.4.58</span><span className="user-menu-dot"></span><span>pleromanet.social</span>
      </div>
    </div>
  );
}

// ============ Side nav (left col) ============
function SideNav({ view, onView, settingsTab, onSettingsTab }) {
  const items = [
    { id: 'home', label: 'Home', ico: I.home },
    { id: 'local', label: 'Local', ico: I.users },
    { id: 'federated', label: 'Federated', ico: I.globe },
    { id: 'notifs', label: 'Notifications', ico: I.bell, count: 3 },
    { id: 'msg', label: 'Messages', ico: I.msg },
    { id: 'bookmarks', label: 'Bookmarks', ico: I.bookmark },
    { id: 'lists', label: 'Lists', ico: I.list },
    { id: 'settings', label: 'Settings', ico: I.gear, hasSub: true },
  ];
  const settingsActive = view === 'profile-settings';
  const subNav = ['Profile', 'Appearance', 'Notifications', 'Filters', 'Federation', 'Account', 'Import / Export', 'Development'];
  return (
    <nav className="side-nav">
      {items.map(it => {
        const Ico = it.ico;
        const isActive = (it.id === 'home' && view === 'home') || (it.id === 'settings' && settingsActive) || (it.id === view);
        return (
          <React.Fragment key={it.id}>
            <button
              className={"side-nav-item " + (isActive ? 'active' : '')}
              onClick={() => {
                if (it.id === 'home') onView('home');
                else if (it.id === 'settings') onView('profile-settings');
                else if (it.id === 'federated') onView('federated');
                else if (it.id === 'local') onView('local');
                else if (it.id === 'notifs') onView('notifs');
              }}>
              <span className="ico"><Ico style={{width: 18, height: 18}}/></span>
              <span>{it.label}</span>
              {it.count ? <span className="count">{it.count}</span> : it.id === 'home' && isActive ? <span className="grip"><I.grip style={{width: 14, height: 14}}/></span> : null}
            </button>
            {it.id === 'settings' && settingsActive && (
              <div className="side-sub">
                {subNav.map(s => (
                  <button
                    key={s}
                    className={"side-sub-item " + (settingsTab === s ? 'active' : '')}
                    onClick={() => onSettingsTab(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ============ Profile mini card ============
function ProfileMini() {
  const NP = window.NowPlayingLine;
  return (
    <Card>
      <div className="profile-mini-banner">
        <VaporBanner variant="pixel-window"/>
      </div>
      <div className="profile-mini-info">
        <div className="profile-mini-name">dreambyte</div>
        <div className="profile-mini-handle">@dreambyte@pleroma.social</div>
        <div className="profile-mini-bio">living in a soft world</div>
        {NP && <NP/>}
      </div>
      <StatStrip items={[
        { label: 'Posts', value: '1,248' },
        { label: 'Following', value: '312' },
        { label: 'Followers', value: '1,921' },
      ]}/>
    </Card>
  );
}

// ============ Footer card ============
function FooterCard() {
  return (
    <Card className="footer-card">
      <div><span className="v">PLEROMANET™ 2.4.58</span></div>
      <div style={{marginTop: 4, fontFamily: 'var(--sans)', fontSize: 11.5, letterSpacing: 0}}>© 2024 PleromaNet™ Contributors</div>
      <div className="footer-links">
        <a>Docs</a>
        <span style={{color: 'var(--muted-2)'}}>·</span>
        <a>GitHub</a>
        <span style={{color: 'var(--muted-2)'}}>·</span>
        <a>About</a>
      </div>
    </Card>
  );
}

Object.assign(window, { Header, SideNav, ProfileMini, FooterCard, VaporBanner, CityScape });
