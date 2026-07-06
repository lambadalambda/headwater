/* global React, ReactDOM, I, VaporBanner,
   Avatar, PostHead, PostMedia, PostActions, Card, CardHead, CardFoot,
   Button, Pill, Tag, Toggle, Seg, StatBlock, StatStrip, StatusRow,
   Post, PhotoGrid, VideoAttachment, AudioAttachment, CompactAudio,
   MediaHeroStrip, MediaStripThumb, MediaStripKindBadge,
   AttachmentLightbox, AttachmentLightboxHost, openLightbox,
   AncestorPost, FocusedPost, ReplyPost,
   TrendsCard, WhoToFollow, ShortcutsCard, InstanceStatus,
   QuickSearchCard, InstanceStatusExtended,
   ProfileMini, FooterCard, ProfilePreviewCard, ProfileTipsCard,
   NotifsPopover, Radio, NowPlayingLine, OekakiModal */
const { useState, useEffect } = React;

/* ============================================================
   PleromaNet — Design System overview
   ------------------------------------------------------------
   A flat browsable reference of every reusable piece in the app.
   Each section is a Slab. Each example is a Specimen with a mono
   caption explaining what it is and where it lives.
   ============================================================ */

const THEMES = [
  { id: 'cream',  label: 'Cream',  bg: '#f5f1e8', panel: '#fbfaf3', ink: '#1f2347', accent: '#a48bd9' },
  { id: 'dusk',   label: 'Dusk',   bg: '#1a1538', panel: '#2a1f4a', ink: '#e8e2f5', accent: '#e7a8c9' },
  { id: 'drive',  label: 'Drive',  bg: '#070719', panel: '#0c0c2a', ink: '#e0e6f0', accent: '#7dc4be' },
  { id: 'simoun', label: 'Simoun', bg: '#141b36', panel: '#1c2547', ink: '#f4ebd8', accent: '#e8763a' },
];

// ============ Layout ============
function Slab({ id, kicker, title, sub, children, mobile }) {
  return (
    <section id={id} className={"ds-slab " + (mobile ? 'ds-slab-mobile' : '')}>
      <header className="ds-slab-head">
        <div className="ds-kicker">{kicker}</div>
        <h2 className="ds-h2">{title}</h2>
        {sub && <p className="ds-sub">{sub}</p>}
      </header>
      <div className="ds-slab-body">{children}</div>
    </section>
  );
}

function Specimen({ label, note, span = 1, children, padded = true, dark = false, surface = false }) {
  return (
    <div className={"ds-spec ds-spec-span-" + span + (dark ? ' ds-spec-dark' : '') + (surface ? ' ds-spec-surface' : '')}>
      <div className={"ds-spec-stage " + (padded ? 'padded' : '')}>
        {children}
      </div>
      <div className="ds-spec-foot">
        <span className="ds-spec-label">{label}</span>
        {note && <span className="ds-spec-note">{note}</span>}
      </div>
    </div>
  );
}

function Grid({ cols = 2, children }) {
  return <div className={"ds-grid ds-grid-" + cols}>{children}</div>;
}

// ============ Sample data ============
const SAMPLE_POST = {
  id: 1, name: 'emi', handle: '@emichan@kolektiva.social', time: '16m',
  avClass: 'av-anime',
  body: "tiny update: fixed some bugs, added a toggle, and touched grass.\n\nthe internet can wait.",
  replies: 2, boosts: 7, favs: 42,
  actions: { reply: false, boost: false, fav: false },
};
const PHOTO_POST = {
  ...SAMPLE_POST, id: 2, body: "dusk in the city 🌆",
  photos: [{ src: 'samples/falco.png', alt: 'still 1985' }],
};
const PHOTOS3_POST = {
  ...SAMPLE_POST, id: 3, name: 'sysadmin', handle: '@root@pleroma.social',
  avClass: 'av-pc-old',
  body: "Backup your data. Hug your cat. Update PleromaNet™.",
  photos: [
    { src: 'samples/cat-door.webp', alt: '' },
    { src: 'samples/cat-bank.webp', alt: '' },
    { src: 'samples/cats-pair.webp', alt: '' },
  ],
};
const VIDEO_POST = {
  ...SAMPLE_POST, id: 4, name: 'pixelmoth', handle: '@pixelmoth@retro.social',
  avClass: 'av-pixel-pc',
  body: "cassette deck loop i recorded out the kitchen window.",
  video: { poster: 'sunset', duration: '0:42', start: 0.15, cc: true, caption: 'A slow pan across a windowsill at dusk.' },
};
const AUDIO_POST = {
  ...SAMPLE_POST, id: 5, name: 'kestrel.fm', handle: '@kestrel@audio.garden',
  avClass: 'av-grad-3',
  body: "demo from last night's basement set.",
  audio: {
    title: 'after the storm (demo)', byline: 'kestrel · live take · 2026',
    duration: '4:18', start: 0.28,
    cover: 'samples/encardia-99.png',
  },
};
const BANNER_POST = {
  ...SAMPLE_POST, id: 6, name: 'dreambyte', handle: '@dreambyte@pleromanet.social',
  avClass: '', avBanner: 'sunset',
  body: "🤍",
};

const SAMPLE_NOTIF = {
  id: 'demo', kind: 'mention', read: false, time: '4m',
  who: [{ name: 'orbit', handle: '@orbit@spacebear.net', av: 'sunset' }],
  post: { excerpt: 'hey @dreambyte — does the gradient hold up in dusk?', tStamp: '4m ago' },
};

// ============ Theme picker ============
function ThemePicker({ theme, setTheme }) {
  return (
    <div className="ds-theme-picker">
      {THEMES.map(t => (
        <button
          key={t.id}
          className={"ds-theme-chip " + (theme === t.id ? 'active' : '')}
          onClick={() => setTheme(t.id)}>
          <span className="ds-theme-swatch" style={{background: t.bg, borderColor: t.panel}}>
            <span style={{background: t.accent}}/>
            <span style={{background: t.ink}}/>
          </span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============ Color token row ============
function ColorTok({ name, value, ink = false }) {
  return (
    <div className="ds-tok">
      <div className="ds-tok-swatch" style={{background: `var(${name})`, color: ink ? `var(${name})` : undefined}}>
        {ink && <span>Aa</span>}
      </div>
      <div className="ds-tok-meta">
        <div className="ds-tok-name">{name}</div>
        <div className="ds-tok-val">{value}</div>
      </div>
    </div>
  );
}

// ============ Type specimen ============
function TypeRow({ family, sample, meta }) {
  return (
    <div className="ds-type-row">
      <div className="ds-type-sample" style={{fontFamily: family}}>{sample}</div>
      <div className="ds-type-meta">{meta}</div>
    </div>
  );
}

// ============ Icon gallery ============
function IconGallery() {
  const names = ['spark','sparkBig','search','bell','home','users','globe','msg','bookmark','list','gear','bolt','plus','reply','boost','star','more','image','poll','smile','upload','trend','pulse','sliders','hash','arrow','arrowL','arrowR','ext','info','grip','pencil','lock','spaceman','planet','comet','chevDown'];
  return (
    <div className="ds-icon-grid">
      {names.map(n => {
        const Ico = I[n];
        if (!Ico) return null;
        return (
          <div key={n} className="ds-icon-cell">
            <div className="ds-icon-box"><Ico style={{width: 20, height: 20}}/></div>
            <div className="ds-icon-name">I.{n}</div>
          </div>
        );
      })}
    </div>
  );
}

// ============ Avatar gallery ============
function AvatarGallery() {
  const variants = [
    { lbl: 'av-anime',    cls: 'av-anime' },
    { lbl: 'av-pixel-pc', cls: 'av-pixel-pc' },
    { lbl: 'av-orb',      cls: 'av-orb' },
    { lbl: 'av-pc-old',   cls: 'av-pc-old' },
    { lbl: 'av-grad-1',   cls: 'av-grad-1' },
    { lbl: 'av-grad-3',   cls: 'av-grad-3' },
  ];
  const banners = ['sunset', 'pixel-window', 'city', 'space'];
  return (
    <div className="ds-av-gallery">
      <div className="ds-av-section">
        <div className="ds-av-section-label">CSS variants</div>
        <div className="ds-av-row">
          {variants.map(v => (
            <div key={v.lbl} className="ds-av-cell">
              <Avatar post={{avClass: v.cls}}/>
              <div className="ds-av-name">.{v.lbl}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="ds-av-section">
        <div className="ds-av-section-label">VaporBanner variants <span style={{opacity: 0.6}}>· shown at banner size, with avatar crop inset</span></div>
        <div className="ds-banner-row">
          {banners.map(b => (
            <div key={b} className="ds-banner-cell">
              <div className="ds-banner-tile">
                <VaporBanner variant={b}/>
              </div>
              <div className="ds-banner-meta">
                <div className="ds-banner-crop">
                  <VaporBanner variant={b}/>
                </div>
                <div className="ds-banner-text">
                  <div className="ds-av-name">{b}</div>
                  <div className="ds-banner-note">as avatar →</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="ds-av-section">
        <div className="ds-av-section-label">Sizes &amp; shapes <span style={{opacity: 0.6}}>· each variant has its own size and shape rules</span></div>
        <div className="ds-size-row">
          <SizeCell variant="notif"   size={28} shape="circle" role="Notification rows · stackable, ring-on-panel"/>
          <SizeCell variant="compose" size={40} shape="rect"   role="Composer · 4px radius"/>
          <SizeCell variant="post"    size={48} shape="rect"   role="Feed post · 4px radius"/>
          <SizeCell variant="focused" size={56} shape="rect"   role="Focused thread post · 4px radius"/>
        </div>
      </div>
    </div>
  );
}

// ============ Mobile frame ============
function PhoneFrame({ children, label }) {
  return (
    <div className="ds-phone-wrap">
      <div className="ds-phone">
        <div className="ds-phone-notch"></div>
        <div className="ds-phone-screen">{children}</div>
      </div>
      <div className="ds-phone-label">{label}</div>
    </div>
  );
}

// Stub mobile home screen using existing classes
function MobileHomePreview() {
  return (
    <div className="ds-mobile-app">
      <div className="ds-mobile-statusbar">
        <span>9:41</span>
        <span className="ds-mobile-sbr">
          <span style={{width: 16, height: 8, border: '1px solid currentColor', borderRadius: 2, opacity: 0.8}}></span>
        </span>
      </div>
      <div className="ds-mobile-header">
        <button className="menu-btn" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
        <div className="brand-name" style={{fontSize: 20}}>PleromaNet<sup>™</sup></div>
        <button className="icon-btn" aria-label="Notifications">
          <I.bell style={{width: 18, height: 18}}/>
          <span className="badge">3</span>
        </button>
      </div>
      <div className="ds-mobile-feed">
        <Post post={SAMPLE_POST} onAction={()=>{}}/>
        <Post post={BANNER_POST} onAction={()=>{}}/>
      </div>
      <nav className="ds-mobile-bottom">
        <button className="mob-tab active"><I.home/><span>Home</span></button>
        <button className="mob-tab"><I.search/><span>Explore</span></button>
        <button className="mob-tab"><I.bell/><span>Alerts</span><span className="tab-badge">3</span></button>
        <button className="mob-tab"><I.gear/><span>Settings</span></button>
        <button className="mob-tab"><I.list/><span>More</span></button>
      </nav>
    </div>
  );
}

function MobileDrawerPreview() {
  return (
    <div className="ds-mobile-app">
      <div className="ds-mobile-statusbar">
        <span>9:41</span>
      </div>
      <div className="ds-mobile-drawer-inner">
        <div className="drawer-head" style={{padding: '12px 14px'}}>
          <div className="brand" style={{gap: 10}}>
            <div className="brand-mark" style={{width: 36, height: 36}}><I.sparkBig style={{width: 22, height: 22}}/></div>
            <div className="brand-name" style={{fontSize: 22}}>PleromaNet<sup>™</sup></div>
          </div>
          <button className="drawer-close">
            <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{padding: '0 10px 10px'}}>
          <Card>
            <div style={{padding: '10px 12px'}}>
              <div style={{fontFamily: 'var(--serif)', fontSize: 18}}>dreambyte</div>
              <div style={{fontSize: 11, color: 'var(--muted)'}}>@dreambyte@pleroma.social</div>
            </div>
          </Card>
          <Card style={{marginTop: 10, padding: '4px 0'}}>
            {[['home', 'Home', I.home, true], ['users', 'Local', I.users], ['globe', 'Federated', I.globe], ['bell', 'Notifications', I.bell, false, 3], ['gear', 'Settings', I.gear]].map(([id, label, Ico, active, count]) => (
              <button key={id} className={"side-nav-item " + (active ? 'active' : '')}>
                <span className="ico"><Ico style={{width: 16, height: 16}}/></span>
                <span>{label}</span>
                {count ? <span className="count">{count}</span> : null}
              </button>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MobileThreadPreview() {
  const t = {
    ancestors: [{
      id: 'a1', name: 'gridwave', handle: '@gridwave@retro.social', time: '5h',
      avClass: 'av-pixel-pc',
      body: "anyone else feel like the web got a little too loud lately?",
      replies: 18, boosts: 42, favs: 210,
      actions: { reply: false, boost: false, fav: false },
    }],
    focused: {
      ...SAMPLE_POST,
      fullTime: '4:18 PM · May 11, 2026',
      source: 'PleromaNet™ Web', views: '12.4K', bookmarks: 24,
    },
    replies: [{
      id: 'r1', name: 'nyan.binary', handle: '@nyan@catgirl.cloud', time: '12m',
      avClass: 'av-anime', body: "this is the energy i needed today 🌙",
      replies: 2, boosts: 3, favs: 18,
      actions: { reply: false, boost: false, fav: false },
      nestedReplies: [],
    }],
  };
  return (
    <div className="ds-mobile-app">
      <div className="ds-mobile-statusbar"><span>9:41</span></div>
      <div className="ds-mobile-thread">
        <Card className="thread">
          <div className="thread-head">
            <button className="thread-back"><I.arrowL style={{width: 16, height: 16}}/></button>
            <div className="thread-head-title">Thread</div>
            <button className="tab-action"><I.more style={{width: 14, height: 14}}/></button>
          </div>
          <AncestorPost post={t.ancestors[0]} onAction={()=>{}}/>
          <FocusedPost post={t.focused} onAction={()=>{}} continuesAbove={true}/>
        </Card>
      </div>
    </div>
  );
}

// ============ The page ============
function DesignSystem() {
  const [theme, setTheme] = useState(() => localStorage.getItem('pn-theme') || 'cream');
  const [section, setSection] = useState('foundations');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('pn-theme', theme);
  }, [theme]);

  const SECTIONS = [
    { id: 'foundations', label: 'Foundations' },
    { id: 'iconography', label: 'Iconography' },
    { id: 'controls',    label: 'Controls' },
    { id: 'forms',       label: 'Forms' },
    { id: 'avatars',     label: 'Avatars' },
    { id: 'attachments', label: 'Attachments' },
    { id: 'composer',    label: 'Composer' },
    { id: 'posts',       label: 'Posts' },
    { id: 'thread',      label: 'Thread' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'radio',       label: 'Radio' },
    { id: 'oekaki',      label: 'Oekaki' },
    { id: 'surfaces',    label: 'Surfaces' },
    { id: 'navigation',  label: 'Navigation' },
    { id: 'mobile',      label: 'Mobile' },
  ];

  return (
    <div className="ds-page">
      <header className="ds-header">
        <div className="ds-header-l">
          <div className="brand">
            <div className="brand-mark"><I.sparkBig/></div>
            <div>
              <div className="brand-name" style={{fontSize: 26}}>PleromaNet<sup>™</sup></div>
              <div style={{fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2}}>Design system · v2.4.58</div>
            </div>
          </div>
        </div>
        <div className="ds-header-r">
          <ThemePicker theme={theme} setTheme={setTheme}/>
          <a className="ds-app-link" href="PleromaNet.html">Open app →</a>
        </div>
      </header>

      <div className="ds-body">
        <aside className="ds-nav">
          <div className="ds-nav-label">Contents</div>
          {SECTIONS.map(s => (
            <a key={s.id} href={"#" + s.id}
               className={"ds-nav-item " + (section === s.id ? 'active' : '')}
               onClick={() => setSection(s.id)}>
              {s.label}
            </a>
          ))}
          <div className="ds-nav-foot">
            <div>{Object.keys(window).filter(k => /^(Avatar|Post|Card|Button|Pill|Toggle|Seg|Stat)/.test(k)).length} shared primitives</div>
            <div>4 themes</div>
          </div>
        </aside>

        <main className="ds-main">
          {/* ============ Foundations ============ */}
          <Slab id="foundations" kicker="01" title="Foundations" sub="Tokens, palette and type. Everything else is composed from these.">
            <div className="ds-sub-h">Color tokens</div>
            <div className="ds-tok-grid">
              <ColorTok name="--bg" value="page"/>
              <ColorTok name="--panel" value="cards"/>
              <ColorTok name="--panel-2" value="raised"/>
              <ColorTok name="--border" value="default"/>
              <ColorTok name="--border-strong" value="emphasis"/>
              <ColorTok name="--ink" value="primary text" ink/>
              <ColorTok name="--ink-2" value="secondary text" ink/>
              <ColorTok name="--muted" value="captions" ink/>
              <ColorTok name="--muted-2" value="weakest" ink/>
              <ColorTok name="--accent" value="brand"/>
              <ColorTok name="--accent-ink" value="brand-text" ink/>
              <ColorTok name="--accent-soft" value="hover/sel"/>
              <ColorTok name="--accent-soft-2" value="softest"/>
            </div>

            <div className="ds-sub-h">Type</div>
            <div className="ds-type-stack">
              <TypeRow family="var(--serif)" sample="Soft hertz, slow web" meta="--serif · Cormorant Garamond · headings, brand wordmark"/>
              <TypeRow family="var(--sans)" sample="The quick brown fox jumps over the lazy dog." meta="--sans · Inter · body, UI"/>
              <TypeRow family="var(--mono)" sample="PLEROMANET / v2.4.58 / @dreambyte@pleromanet.social" meta="--mono · JetBrains Mono · captions, eyebrows, technical"/>
            </div>

            <div className="ds-sub-h">Themes</div>
            <Grid cols={4}>
              {THEMES.map(t => (
                <div key={t.id} className="ds-theme-card" style={{background: t.bg, color: t.ink, borderColor: t.panel}}>
                  <div style={{background: t.panel, padding: '10px 12px', borderBottom: `1px solid ${t.accent}33`}}>
                    <div style={{fontFamily: 'var(--serif)', fontSize: 20, lineHeight: 1}}>{t.label}</div>
                    <div style={{fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.accent, marginTop: 4}}>theme · {t.id}</div>
                  </div>
                  <div style={{padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4}}>
                    <span style={{height: 28, background: t.bg, border: `1px solid ${t.accent}33`}}/>
                    <span style={{height: 28, background: t.panel}}/>
                    <span style={{height: 28, background: t.ink}}/>
                    <span style={{height: 28, background: t.accent}}/>
                  </div>
                </div>
              ))}
            </Grid>
          </Slab>

          {/* ============ Iconography ============ */}
          <Slab id="iconography" kicker="02" title="Iconography" sub="One stroke weight (1.5–1.6), one corner style, currentColor on stroke. Imported from icons.jsx as the `I` namespace.">
            <IconGallery/>
          </Slab>

          {/* ============ Controls ============ */}
          <Slab id="controls" kicker="03" title="Controls" sub="Buttons, pills, tabs and segmented switches.">
            <Grid cols={3}>
              <Specimen label="Button · primary" note="btn-primary">
                <div className="ds-row"><Button variant="primary">Post</Button><Button variant="primary" disabled>Disabled</Button></div>
              </Specimen>
              <Specimen label="Button · secondary" note="btn-secondary">
                <Button variant="secondary">Reset</Button>
              </Specimen>
              <Specimen label="Button · follow" note="btn-follow · btn-follow.following">
                <div className="ds-row"><Button variant="follow">Follow</Button><Button variant="follow" className="following">Following</Button></div>
              </Specimen>
              <Specimen label="Button · upload" note="btn-upload">
                <Button variant="upload"><span>Change avatar</span><I.upload style={{width: 14, height: 14}}/></Button>
              </Specimen>
              <Specimen label="Pill" note="pill">
                <div className="ds-row"><Pill>All systems normal</Pill><Pill>3 new</Pill></div>
              </Specimen>
              <Specimen label="Tag" note="tag">
                <div className="ds-row"><Tag>#fediverse</Tag><Tag>#privacy</Tag><Tag>#vaporwave</Tag></div>
              </Specimen>
              <Specimen label="Tabs" note=".tabs > .tab · .tabs > .tab.active">
                <div className="tabs" style={{borderRadius: 4, overflow: 'hidden'}}>
                  <button className="tab active">Home</button>
                  <button className="tab">Local</button>
                  <button className="tab">Federated</button>
                  <div className="tab-spacer"></div>
                  <button className="tab-action"><I.sliders style={{width: 14, height: 14}}/></button>
                </div>
              </Specimen>
              <Specimen label="Segmented" note=".seg">
                <DemoSeg/>
              </Specimen>
              <Specimen label="Toggle" note=".toggle · .toggle.on">
                <DemoToggle/>
              </Specimen>
            </Grid>
          </Slab>

          {/* ============ Forms ============ */}
          <Slab id="forms" kicker="04" title="Forms" sub="Inputs, textareas, selects, and the toggle row pattern.">
            <Grid cols={2}>
              <Specimen label="Input" note=".input">
                <input className="input" defaultValue="dreambyte"/>
              </Specimen>
              <Specimen label="Select" note=".select">
                <select className="select" defaultValue="@pleromanet.social">
                  <option>@pleromanet.social</option>
                  <option>@kolektiva.social</option>
                </select>
              </Specimen>
              <Specimen label="Split row" note=".split-row" span={2}>
                <div className="split-row">
                  <input className="input" defaultValue="dreambyte"/>
                  <select className="select"><option>@pleromanet.social</option></select>
                </div>
              </Specimen>
              <Specimen label="Textarea" note=".textarea" span={2}>
                <textarea className="textarea" defaultValue="living in a soft world"/>
              </Specimen>
              <Specimen label="Toggle row" note=".toggle-row — used in settings" span={2}>
                <DemoToggleRow/>
              </Specimen>
            </Grid>
          </Slab>

          {/* ============ Avatars ============ */}
          <Slab id="avatars" kicker="05" title="Avatars" sub={'<Avatar/> wraps four base CSS classes (.post-av / .focused-av / .notif-av / .composer-av) around either an .av-* CSS class or a VaporBanner. Pass a post-shaped object and the variant figures itself out.'}>
            <AvatarGallery/>
          </Slab>

          {/* ============ Attachments ============ */}
          <Slab id="attachments" kicker="06" title="Attachments" sub="Each post can carry any mix of media. A pure function — pickAttachmentLayout(attachments) — decides which layout pattern renders. The Post component never calls a media component directly.">
            <div className="ds-sub-h">Layout rules</div>
            <p className="ds-sub" style={{marginBottom: 14}}>Most-specific-first. The last branch is the fallthrough.</p>
            <AttachmentRules/>

            <div className="ds-sub-h">Single media (1 attachment of any kind)</div>
            <Grid cols={3}>
              <Specimen label="1 photo" note="pickAttachmentLayout → 'single' → PhotoGrid n1" padded={false}>
                <DemoPost attachments={[{kind: 'photo', src: 'samples/falco.png', alt: 'still 1985'}]}/>
              </Specimen>
              <Specimen label="1 video" note="'single' → VideoAttachment" padded={false}>
                <DemoPost attachments={[{kind: 'video', poster: 'sunset', duration: '0:42', cc: true, caption: 'A pan across a windowsill.'}]}/>
              </Specimen>
              <Specimen label="1 audio" note="'single' → AudioAttachment" padded={false}>
                <DemoPost attachments={[{kind: 'audio', title: 'after the storm (demo)', byline: 'kestrel · 2026', duration: '4:18', cover: 'samples/encardia-99.png'}]}/>
              </Specimen>
            </Grid>

            <div className="ds-sub-h">Photo grids (2–4 photos)</div>
            <Grid cols={3}>
              <Specimen label="2 photos" note="photoGrid · n2" padded={false}>
                <DemoPost attachments={[
                  {kind: 'photo', src: 'samples/dragon.png'},
                  {kind: 'photo', src: 'samples/flute-text.png'},
                ]}/>
              </Specimen>
              <Specimen label="3 photos" note="photoGrid · n3" padded={false}>
                <DemoPost attachments={[
                  {kind: 'photo', src: 'samples/cat-door.webp'},
                  {kind: 'photo', src: 'samples/cat-bank.webp'},
                  {kind: 'photo', src: 'samples/cats-pair.webp'},
                ]}/>
              </Specimen>
              <Specimen label="4 photos" note="photoGrid · n4" padded={false}>
                <DemoPost attachments={[
                  {kind: 'photo', src: 'samples/cat-door.webp'},
                  {kind: 'photo', src: 'samples/cat-bank.webp'},
                  {kind: 'photo', src: 'samples/cats-pair.webp'},
                  {kind: 'photo', src: 'samples/falco.png'},
                ]}/>
              </Specimen>
            </Grid>

            <div className="ds-sub-h">Combos (photo(s) + 1 audio)</div>
            <Grid cols={2}>
              <Specimen label="★ 1 photo + 1 audio" note="photoAudio · photo + compact audio bar" padded={false}>
                <DemoPost attachments={[
                  {kind: 'photo', src: 'samples/cat-door.webp', alt: 'window in the rain'},
                  {kind: 'audio', title: 'rain on glass', byline: 'lumen · field · 2026', duration: '5:12'},
                ]}/>
              </Specimen>
              <Specimen label="3 photos + 1 audio" note="photosAudio · grid + compact audio bar" padded={false}>
                <DemoPost attachments={[
                  {kind: 'photo', src: 'samples/falco.png'},
                  {kind: 'photo', src: 'samples/dragon.png'},
                  {kind: 'photo', src: 'samples/cat-door.webp'},
                  {kind: 'audio', title: 'evening crickets', byline: 'orbit · field', duration: '3:48'},
                ]}/>
              </Specimen>
            </Grid>

            <div className="ds-sub-h">General (anything else) — hero + strip</div>
            <Specimen label="3 photos + 1 video + 2 audio" note="heroStrip · click strip thumbs to promote" padded={false}>
              <DemoPost attachments={[
                {kind: 'photo', src: 'samples/falco.png',     alt: 'station platform at dusk'},
                {kind: 'photo', src: 'samples/dragon.png',    alt: 'shrine path'},
                {kind: 'photo', src: 'samples/cat-door.webp', alt: 'door with cat'},
                {kind: 'video', poster: 'sunset', duration: '0:42', cc: true, caption: 'A pan across a windowsill at dusk.'},
                {kind: 'audio', title: 'kettle whistle', byline: 'orbit · field · 2026', duration: '2:14'},
                {kind: 'audio', title: 'evening crickets', byline: 'orbit · field · 2026', duration: '3:48'},
              ]}/>
            </Specimen>

            <div className="ds-sub-h">Primitives in isolation</div>
            <Grid cols={2}>
              <Specimen label="CompactAudio" note="window.CompactAudio · used in combos + lightbox" padded={false}>
                <div style={{padding: 14}}>
                  {window.CompactAudio && (
                    <window.CompactAudio audio={{
                      title: 'kettle whistle', byline: 'orbit · field · 2026', duration: '2:14',
                    }}/>
                  )}
                </div>
              </Specimen>
              <Specimen label="MediaStripThumb" note="thumbnails by kind">
                <div style={{display: 'flex', gap: 8}}>
                  <div style={{position: 'relative', width: 56, height: 56, borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)'}}>
                    {window.MediaStripThumb && <window.MediaStripThumb att={{kind: 'photo', src: 'samples/falco.png'}}/>}
                    {window.MediaStripKindBadge && <window.MediaStripKindBadge kind="photo"/>}
                  </div>
                  <div style={{position: 'relative', width: 56, height: 56, borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)'}}>
                    {window.MediaStripThumb && <window.MediaStripThumb att={{kind: 'video'}}/>}
                    {window.MediaStripKindBadge && <window.MediaStripKindBadge kind="video"/>}
                  </div>
                  <div style={{position: 'relative', width: 56, height: 56, borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border)'}}>
                    {window.MediaStripThumb && <window.MediaStripThumb att={{kind: 'audio', cover: 'samples/encardia-99.png'}}/>}
                    {window.MediaStripKindBadge && <window.MediaStripKindBadge kind="audio"/>}
                  </div>
                </div>
              </Specimen>
            </Grid>

            <div className="ds-sub-h">Lightbox</div>
            <p className="ds-sub" style={{marginBottom: 14}}>Triggered by clicking any photo or strip thumbnail. Mounted once at the app root as <code style={{fontFamily: 'var(--mono)', fontSize: 11}}>{'<AttachmentLightboxHost/>'}</code>, dispatched globally via <code style={{fontFamily: 'var(--mono)', fontSize: 11}}>openLightbox(attachments, idx, attribution)</code>.</p>
            <Specimen label="Try it" note="click any photo above, or this button to open with the full sample set" padded={false}>
              <div style={{padding: 18, textAlign: 'center'}}>
                <Button variant="primary" onClick={() => {
                  const opener = window.openLightbox;
                  if (opener) opener([
                    {kind: 'photo', src: 'samples/falco.png',     alt: 'station platform at dusk'},
                    {kind: 'photo', src: 'samples/dragon.png',    alt: 'shrine path'},
                    {kind: 'photo', src: 'samples/cat-door.webp', alt: 'door with cat'},
                    {kind: 'video', poster: 'sunset', duration: '0:42', cc: true},
                    {kind: 'audio', title: 'kettle whistle', byline: 'orbit · field', duration: '2:14'},
                  ], 0, {name: 'orbit', handle: '@orbit@spacebear.net', avClass: 'av-orb'});
                }}>Open lightbox →</Button>
              </div>
            </Specimen>
          </Slab>

          {/* ============ Composer ============ */}
          <Slab id="composer" kicker="07" title="Composer" sub="The post composer. Lives at the top of the feed and inside threads (as a reply composer).">
            <Specimen label="Composer · feed" note=".composer" padded={false}>
              <DemoComposer/>
            </Specimen>
          </Slab>

          {/* ============ Posts ============ */}
          <Slab id="posts" kicker="08" title="Posts" sub="The canonical post composes Avatar + PostHead + body + PostMedia + PostActions. Every post-shaped surface uses the same atoms.">
            <div className="ds-sub-h">Post anatomy</div>
            <div className="ds-anatomy">
              <div className="ds-anatomy-fig ds-post-anatomy" style={{maxWidth: 620}}>
                <Post post={PHOTO_POST} onAction={()=>{}}/>
                <div className="ds-anatomy-marker ds-mk-1">1</div>
                <div className="ds-anatomy-marker ds-mk-2">2</div>
                <div className="ds-anatomy-marker ds-mk-3">3</div>
                <div className="ds-anatomy-marker ds-mk-4">4</div>
                <div className="ds-anatomy-marker ds-mk-5">5</div>
              </div>
              <ul className="ds-anatomy-list">
                <li><span className="m">1</span> <b>Avatar</b> · post variant, 40–48px</li>
                <li><span className="m">2</span> <b>PostHead</b> · name, handle, relative time</li>
                <li><span className="m">3</span> <b>PostBody</b> · body + inline @mentions + optional pinged footer</li>
                <li><span className="m">4</span> <b>PostMedia</b> · dispatches to PhotoGrid / Video / Audio</li>
                <li><span className="m">5</span> <b>PostActions</b> · reply / boost / fav + overflow</li>
              </ul>
            </div>

            <div className="ds-sub-h">Body &amp; mentions</div>
            <p className="ds-sub" style={{marginBottom: 14}}>The <code style={{fontFamily: 'var(--mono)', fontSize: 11}}>{'<PostBody/>'}</code> primitive auto-parses <code style={{fontFamily: 'var(--mono)', fontSize: 11}}>@handle</code> patterns in the body string and renders them as inline links. A separate <code style={{fontFamily: 'var(--mono)', fontSize: 11}}>addressees</code> array (the leading recipient pile-up from a fediverse reply) renders as a compact "PINGED" footer below the body, so the first line of a reply stays content, not a recipient list.</p>
            <Grid cols={2}>
              <Specimen label="Body only" note="no addressees · just inline mention parsing" padded={false}>
                <DemoPost
                  body="thanks for the recs @datagram — going to try qwen 0.5b first and then jan-nano if it doesn't cut it. @feld did you end up testing josie?"
                  attachments={[]}/>
              </Specimen>
              <Specimen label="Body + addressees" note="leading addressees → footer chip row" padded={false}>
                <DemoPost
                  body="qwen 0.5b can handle some limited summary tasks. theres also the JOSIE models which are jailbroken qwens."
                  addressees={['@dtluna', '@feld', '@lain']}
                  attachments={[]}/>
              </Specimen>
              <Specimen label="Long addressee chain" note="scales horizontally · wraps if needed" padded={false} span={2}>
                <DemoPost
                  body="agreed with @datagram — the slow web feels possible again. tagging @soft.hertz too, this was your point yesterday"
                  addressees={['@datagram', '@gridwave', '@nyan', '@soft.hertz', '@orbit', '@lumen', '@kestrel.fm']}
                  attachments={[]}/>
              </Specimen>
            </Grid>

            <div className="ds-sub-h">Quoted posts</div>
            <p className="ds-sub" style={{marginBottom: 14}}>The <code style={{fontFamily: 'var(--mono)', fontSize: 11}}>{'<QuotedPost/>'}</code> primitive embeds a referenced post inside any other. With media, it renders a horizontal smart-card (hero on the left, body on the right). Without media, it falls back to a vertical embedded card with the engagement footer. Quoted media is always a preview — videos and audio never play inline, since the original is one click away.</p>
            <Grid cols={2}>
              <Specimen label="With 1 photo" note="smart-card · hero photo · body + attribution" padded={false}>
                <DemoPost
                  body="this perfectly captures my feelings about saturday morning"
                  attachments={[]}
                  quotedPost={{
                    name: 'kestrel.fm', handle: '@kestrel@audio.garden',
                    avClass: 'av-grad-3', time: '2h',
                    body: "the moment between waking up and remembering you have responsibilities is the most peaceful state known to humanity",
                    attachments: [{ kind: 'photo', src: 'samples/cat-door.webp' }],
                    replies: 12, boosts: 87, favs: 312,
                  }}/>
              </Specimen>
              <Specimen label="Text only (fallback)" note="no media → embedded card · header + body + footer" padded={false}>
                <DemoPost
                  body="agreed @soft.hertz — sharing in case anyone missed it the first time."
                  attachments={[]}
                  quotedPost={{
                    name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social',
                    avClass: 'av-grad-3', time: '3h',
                    body: "the algorithm doesn't care about you. the timeline doesn't either. but the people in it do, and that's worth keeping.",
                    attachments: [],
                    replies: 8, boosts: 34, favs: 142,
                  }}/>
              </Specimen>
              <Specimen label="With multiple media" note='smart-card · hero photo + "+N" overflow badge' padded={false}>
                <DemoPost
                  body="this whole walk was great. photos + the kettle audio."
                  attachments={[]}
                  quotedPost={{
                    name: 'orbit', handle: '@orbit@spacebear.net',
                    avClass: 'av-orb', time: '5h',
                    body: "field walk yesterday — a couple of photos and the kettle clip i mentioned.",
                    attachments: [
                      { kind: 'photo', src: 'samples/falco.png' },
                      { kind: 'photo', src: 'samples/dragon.png' },
                      { kind: 'video', poster: 'sunset', duration: '0:42' },
                      { kind: 'audio', title: 'kettle whistle', duration: '2:14' },
                    ],
                    replies: 7, boosts: 24, favs: 116,
                  }}/>
              </Specimen>
              <Specimen label="With video hero" note="smart-card · poster + play badge · no inline player" padded={false}>
                <DemoPost
                  body="the cinematography here, especially the kettle scene."
                  attachments={[]}
                  quotedPost={{
                    name: 'pixelmoth', handle: '@pixelmoth@retro.social',
                    avClass: 'av-pixel-pc', time: '6h',
                    body: "cassette deck loop i recorded out the kitchen window.",
                    attachments: [
                      { kind: 'video', poster: 'sunset', duration: '0:42', cc: true },
                    ],
                    replies: 3, boosts: 12, favs: 58,
                  }}/>
              </Specimen>
              <Specimen label="With audio hero" note="smart-card · gradient cover with serif initial" padded={false} span={2}>
                <DemoPost
                  body="have not stopped listening to this all week."
                  attachments={[]}
                  quotedPost={{
                    name: 'kestrel.fm', handle: '@kestrel@audio.garden',
                    avClass: 'av-grad-3', time: '3d',
                    body: "demo from last night's basement set. 12 minutes of synths, one take, no edits.",
                    attachments: [
                      { kind: 'audio', title: 'after the storm (demo)', byline: 'kestrel · 2026', duration: '4:18', cover: 'samples/encardia-99.png' },
                    ],
                    replies: 6, boosts: 19, favs: 84,
                  }}/>
              </Specimen>
            </Grid>

            <div className="ds-sub-h">Variants</div>
            <Grid cols={2}>
              <Specimen label="Text only" note="no media" padded={false}>
                <Post post={SAMPLE_POST} onAction={()=>{}}/>
              </Specimen>
              <Specimen label="With banner avatar" note="avBanner='sunset'" padded={false}>
                <Post post={BANNER_POST} onAction={()=>{}}/>
              </Specimen>
              <Specimen label="With one photo" note="post.photos.length === 1" padded={false}>
                <Post post={PHOTO_POST} onAction={()=>{}}/>
              </Specimen>
              <Specimen label="With multiple photos" note="post-photos.n3" padded={false}>
                <Post post={PHOTOS3_POST} onAction={()=>{}}/>
              </Specimen>
              <Specimen label="With video" note="post.video" padded={false} span={2}>
                <Post post={VIDEO_POST} onAction={()=>{}}/>
              </Specimen>
              <Specimen label="With audio" note="post.audio" padded={false} span={2}>
                <Post post={AUDIO_POST} onAction={()=>{}}/>
              </Specimen>
            </Grid>
          </Slab>

          {/* ============ Thread ============ */}
          <Slab id="thread" kicker="09" title="Thread" sub="The thread view stacks three post shapes — Ancestor (collapsed), Focused (expanded with meta), Reply (with branching line).">
            <Specimen label="Full thread" note="AncestorPost → FocusedPost → ReplyPost" padded={false}>
              <DemoThread/>
            </Specimen>
          </Slab>

          {/* ============ Notifications ============ */}
          <Slab id="notifications" kicker="10" title="Notifications" sub="Six kinds — mention, fav, boost, reply, follow, follow_req, poll. Each kind has a tint and an icon.">
            <Grid cols={2}>
              <Specimen label="Mention · unread" note="NotifRow k-mention unread" padded={false}>
                <NotifPreview kind="mention"/>
              </Specimen>
              <Specimen label="Favorite · grouped" note="NotifRow k-fav · 4 actors" padded={false}>
                <NotifPreview kind="fav"/>
              </Specimen>
              <Specimen label="Boost" note="NotifRow k-boost" padded={false}>
                <NotifPreview kind="boost"/>
              </Specimen>
              <Specimen label="Reply" note="NotifRow k-reply" padded={false}>
                <NotifPreview kind="reply"/>
              </Specimen>
              <Specimen label="Follow" note="NotifRow k-follow · Follow back" padded={false}>
                <NotifPreview kind="follow"/>
              </Specimen>
              <Specimen label="Follow request" note="NotifRow k-follow_req · Accept / Decline" padded={false}>
                <NotifPreview kind="follow_req"/>
              </Specimen>
            </Grid>
            <div className="ds-sub-h" style={{marginTop: 18}}>Popover (header bell)</div>
            <Specimen label="NotifsPopover" note="header bell · 8 rows · See all →" padded={false}>
              <div style={{padding: 16, background: 'var(--bg)', display: 'flex', justifyContent: 'center'}}>
                <div style={{position: 'relative', display: 'inline-block'}}>
                  <NotifsPopover onClose={()=>{}} onSeeAll={()=>{}}/>
                </div>
              </div>
            </Specimen>
          </Slab>

          {/* ============ Radio ============ */}
          <Slab id="radio" kicker="11" title="Radio · PN.fm" sub="A persistent server-radio dock. Floats bottom-left in the live app. Two states (compact bar, expanded panel), four sample albums.">
            <div className="ds-sub-h">Now playing line</div>
            <Specimen label="NowPlayingLine" note="shown in user menu &amp; profile mini">
              <div style={{display: 'flex', flexDirection: 'column', gap: 14, minWidth: 280}}>
                <DemoNPLine state="playing"/>
                <DemoNPLine state="paused"/>
              </div>
            </Specimen>

            <div className="ds-sub-h">Compact bar (collapsed)</div>
            <Specimen label="Radio · bar" note=".radio · default state" padded={false}>
              <div className="ds-radio-stage">
                <RadioInline forceOpen={false}/>
              </div>
            </Specimen>

            <div className="ds-sub-h">Expanded panel</div>
            <Specimen label="Radio · Now playing tab" note=".radio.open · panel + tracklist" padded={false}>
              <div className="ds-radio-stage tall">
                <RadioInline forceOpen={true} forceView="now"/>
              </div>
            </Specimen>
            <Specimen label="Radio · Albums tab" note=".radio.open · view=albums" padded={false}>
              <div className="ds-radio-stage tall">
                <RadioInline forceOpen={true} forceView="albums"/>
              </div>
            </Specimen>
          </Slab>

          {/* ============ Oekaki ============ */}
          <Slab id="oekaki" kicker="12" title="Oekaki" sub="In-composer drawing tool. Fullscreen modal triggered from the composer pencil button. Tool rail, canvas, side panel (color / brush / layers).">
            <div className="ds-sub-h">Anatomy</div>
            <div className="ds-anatomy">
              <div className="ds-anatomy-fig ds-oekaki-anatomy">
                <div className="ds-oekaki-scale">
                  <FrozenOekaki/>
                </div>
                <div className="ds-anatomy-marker ds-omk-1">1</div>
                <div className="ds-anatomy-marker ds-omk-2">2</div>
                <div className="ds-anatomy-marker ds-omk-3">3</div>
                <div className="ds-anatomy-marker ds-omk-4">4</div>
                <DemoOekakiLauncher/>
              </div>
              <ul className="ds-anatomy-list">
                <li><span className="m">1</span> <b>Tool rail</b> · 9 tools (brush, pen, eraser, fill, eyedrop, rect, circle, line, text)</li>
                <li><span className="m">2</span> <b>Canvas</b> · 800×600 native, zoom + cursor readout</li>
                <li><span className="m">3</span> <b>Side panel</b> · Color swatches + free picker, brush size/opacity/flow, layer stack</li>
                <li><span className="m">4</span> <b>Footer</b> · Clear / Save draft / Attach to post</li>
              </ul>
            </div>
          </Slab>

          {/* ============ Surfaces ============ */}
          <Slab id="surfaces" kicker="13" title="Surfaces" sub="Cards and the right-rail card library. Each card is title + content + optional foot link.">
            <Grid cols={3}>
              <Specimen label="TrendsCard" note="trend-list" padded={false}><TrendsCard/></Specimen>
              <Specimen label="WhoToFollow" note="suggest" padded={false}><WhoToFollow following={{}} toggleFollow={()=>{}}/></Specimen>
              <Specimen label="ShortcutsCard" note="short" padded={false}><ShortcutsCard/></Specimen>
              <Specimen label="InstanceStatus" note="status-row" padded={false}><InstanceStatus/></Specimen>
              <Specimen label="QuickSearchCard" note="explore right rail" padded={false}><QuickSearchCard/></Specimen>
              <Specimen label="FooterCard" note="footer-card" padded={false}><FooterCard/></Specimen>
              <Specimen label="ProfilePreviewCard" note="settings right rail" padded={false} span={2}><ProfilePreviewCard/></Specimen>
              <Specimen label="ProfileTipsCard" note="settings right rail"   padded={false}><ProfileTipsCard/></Specimen>
            </Grid>
          </Slab>

          {/* ============ Navigation ============ */}
          <Slab id="navigation" kicker="14" title="Navigation" sub="Header, side nav, profile mini. The shell-level chrome.">
            <Specimen label="ProfileMini" note="left column · top of stack" padded={false}>
              <div style={{maxWidth: 320}}><ProfileMini/></div>
            </Specimen>
            <Specimen label="SideNav (placeholder)" note=".side-nav inside a card" padded={false}>
              <div style={{maxWidth: 320}}>
                <Card style={{padding: '6px 0'}}>
                  {[
                    ['Home', I.home, true],
                    ['Local', I.users],
                    ['Federated', I.globe],
                    ['Notifications', I.bell, false, 3],
                    ['Messages', I.msg],
                    ['Bookmarks', I.bookmark],
                    ['Lists', I.list],
                    ['Settings', I.gear],
                  ].map(([lbl, Ico, active, count]) => (
                    <button key={lbl} className={"side-nav-item " + (active ? 'active' : '')}>
                      <span className="ico"><Ico style={{width: 18, height: 18}}/></span>
                      <span>{lbl}</span>
                      {count ? <span className="count">{count}</span> : null}
                    </button>
                  ))}
                </Card>
              </div>
            </Specimen>
          </Slab>

          {/* ============ Mobile ============ */}
          <Slab id="mobile" kicker="15" title="Mobile" sub="The same components, scaled into a 375-wide viewport. Bottom tab bar, drawer (left), sheet (right) replace the rails.">
            <div className="ds-phone-row">
              <PhoneFrame label="Home · feed + bottom tab bar"><MobileHomePreview/></PhoneFrame>
              <PhoneFrame label="Drawer · left side menu"><MobileDrawerPreview/></PhoneFrame>
              <PhoneFrame label="Thread · ancestor + focused"><MobileThreadPreview/></PhoneFrame>
            </div>
          </Slab>

          <footer className="ds-foot">
            <div>End of system · everything else is composed from what's above.</div>
            <div>PleromaNet™ Design System · v2.4.58 · {new Date().getFullYear()}</div>
          </footer>
        </main>
      </div>
      {window.AttachmentLightboxHost && <window.AttachmentLightboxHost/>}
    </div>
  );
}

// ============ Small demo helpers ============
function DemoNPLine({ state }) {
  // Render the NowPlayingLine markup directly with isolated state,
  // bypassing the global pn-now-playing subscription (which would
  // make both specimens show the same value).
  const playing = state === 'playing';
  return (
    <div className="ds-nps-wrap">
      <div className="ds-nps-label">{state}</div>
      <div className={"now-playing-line " + (playing ? 'playing' : 'paused')}
           style={{'--np-tint': '#a48bd9'}}>
        <span className="np-glyph">
          {playing ? (
            <span className="np-eq" aria-hidden="true"><span></span><span></span><span></span></span>
          ) : (
            <svg viewBox="0 0 12 12" style={{width: 9, height: 9}} aria-hidden="true">
              <rect x="3" y="2" width="2" height="8" fill="currentColor"/>
              <rect x="7" y="2" width="2" height="8" fill="currentColor"/>
            </svg>
          )}
        </span>
        <span className="np-text">
          <span className="np-track">pacific hour</span>
          <span className="np-sep"> · </span>
          <span className="np-artist">neon.cassette</span>
        </span>
        {!playing && <span className="np-state">paused</span>}
      </div>
    </div>
  );
}

// Radio rendered in a contained stage rather than fixed to viewport.
function RadioInline({ forceOpen, forceView }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    // After Radio mounts, click chevron to force open if requested.
    if (forceOpen) {
      const chev = ref.current.querySelector('.radio-bar-chev');
      if (chev && !ref.current.querySelector('.radio.open')) {
        // Already might be open; check class
      }
    }
  }, [forceOpen]);
  // We render Radio normally, then post-process via DOM to open / switch tabs.
  // The component owns its open state, so use a small mount-effect.
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isOpen = !!el.querySelector('.radio.open');
    if (forceOpen && !isOpen) {
      const chev = el.querySelector('.radio-bar-chev');
      if (chev) chev.click();
    }
    if (forceOpen && forceView === 'albums') {
      // wait a frame for panel to mount
      requestAnimationFrame(() => {
        const albumsTab = [...el.querySelectorAll('.radio-tab')].find(b => b.textContent.startsWith('Albums'));
        if (albumsTab && !albumsTab.classList.contains('active')) albumsTab.click();
      });
    }
  });
  return (
    <div className="ds-radio-host" ref={ref}>
      <Radio inline/>
    </div>
  );
}

// Render OekakiModal in a static (non-portal) way for the preview specimen.
// We mount it with open=true but inside a contained scaled wrapper.
function FrozenOekaki() {
  return <OekakiModal open={true} onClose={() => {}} onAttach={() => {}}/>;
}

function DemoOekakiLauncher() {
  const [open, setOpen] = React.useState(false);
  return (
    <React.Fragment>
      <button className="ds-oekaki-launch" onClick={() => setOpen(true)}>Launch fullscreen →</button>
      {open && <OekakiModal open={true} onClose={() => setOpen(false)} onAttach={() => setOpen(false)}/>}
    </React.Fragment>
  );
}

// ============ Attachment demo helpers ============
function DemoPost({ attachments, body, addressees, quotedPost }) {
  const sample = {
    id: 'ds-demo',
    name: 'orbit', handle: '@orbit@spacebear.net', time: '8m',
    avClass: 'av-orb',
    body: body !== undefined ? body : '',
    addressees,
    quotedPost,
    attachments,
    replies: 0, boosts: 0, favs: 0,
    actions: { reply: false, boost: false, fav: false },
  };
  if (!Post) return null;
  return <Post post={sample} onAction={() => {}}/>;
}

function AttachmentRules() {
  const rules = [
    { input: '1 attachment of any kind',     layout: 'single',      wire: <WireSingle/> },
    { input: '2–4 photos only',              layout: 'photoGrid',   wire: <WirePhotos/> },
    { input: '1 photo + 1 audio',            layout: 'photoAudio',  wire: <WirePhotoAudio/>, highlight: true },
    { input: '2–4 photos + 1 audio',         layout: 'photosAudio', wire: <WirePhotosAudio/> },
    { input: 'anything else',                layout: 'heroStrip',   wire: <WireHeroStrip/> },
  ];
  return (
    <div className="ds-att-rules">
      {rules.map((r, i) => (
        <div key={i} className={"ds-att-rule " + (r.highlight ? 'ds-att-rule-hi' : '')}>
          <div className="ds-att-rule-wire">{r.wire}</div>
          <div className="ds-att-rule-input">{r.input}</div>
          <div className="ds-att-rule-arrow">→</div>
          <div className="ds-att-rule-layout">{r.layout}</div>
        </div>
      ))}
    </div>
  );
}

function AttWireBox({ children }) {
  return <svg viewBox="0 0 80 50" style={{width: 80, height: 50, display: 'block'}}>{children}</svg>;
}
function WireSingle() {
  return <AttWireBox><rect x="2" y="2" width="76" height="46" rx="2" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.8"/></AttWireBox>;
}
function WirePhotos() {
  return <AttWireBox>
    <rect x="2" y="2" width="37" height="22" rx="1" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.7"/>
    <rect x="41" y="2" width="37" height="22" rx="1" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.7"/>
    <rect x="2" y="26" width="37" height="22" rx="1" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.7"/>
    <rect x="41" y="26" width="37" height="22" rx="1" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.7"/>
  </AttWireBox>;
}
function WirePhotoAudio() {
  return <AttWireBox>
    <rect x="2" y="2" width="76" height="32" rx="2" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.8"/>
    <rect x="2" y="36" width="76" height="12" rx="1.5" fill="var(--panel)" stroke="var(--accent)" strokeWidth="0.8"/>
    <circle cx="9" cy="42" r="3" fill="var(--accent)"/>
    <path d="M7.5 40.5 L10.5 42 L7.5 43.5 Z" fill="white"/>
  </AttWireBox>;
}
function WirePhotosAudio() {
  return <AttWireBox>
    <rect x="2" y="2" width="37" height="14" rx="1" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.6"/>
    <rect x="41" y="2" width="37" height="14" rx="1" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.6"/>
    <rect x="2" y="18" width="37" height="14" rx="1" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.6"/>
    <rect x="41" y="18" width="37" height="14" rx="1" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.6"/>
    <rect x="2" y="34" width="76" height="14" rx="1.5" fill="var(--panel)" stroke="var(--accent)" strokeWidth="0.7"/>
    <circle cx="9" cy="41" r="3" fill="var(--accent)"/>
    <path d="M7.5 39.5 L10.5 41 L7.5 42.5 Z" fill="white"/>
  </AttWireBox>;
}
function WireHeroStrip() {
  return <AttWireBox>
    <rect x="2" y="2" width="76" height="30" rx="2" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="0.8"/>
    <circle cx="40" cy="17" r="4" fill="var(--accent)"/>
    <path d="M38 14.5 L42 17 L38 19.5 Z" fill="white"/>
    {[2,12,22,32,42,52,62,72].map((x, i) => (
      <rect key={x} x={x} y="36" width="6" height="10" rx="0.6" fill={i === 0 ? 'var(--accent)' : 'var(--border-strong)'} stroke="var(--muted-2)" strokeWidth="0.4"/>
    ))}
  </AttWireBox>;
}

function SizeCell({ variant, size, shape, role }) {
  return (
    <div className="ds-size-cell">
      <div className="ds-size-stage">
        <Avatar post={{avBanner: 'sunset'}} variant={variant} size={size}/>
      </div>
      <div className="ds-size-meta">
        <div className="ds-size-name">
          <span className="ds-size-variant">.{variant === 'compose' ? 'composer-av' : variant + '-av'}</span>
          <span className="ds-size-dim">{size}×{size}</span>
          <span className={"ds-size-shape ds-size-shape-" + shape}>{shape}</span>
        </div>
        <div className="ds-size-role">{role}</div>
      </div>
    </div>
  );
}

function DemoSeg() {
  const [v, setV] = useState('Popular');
  return <Seg options={['Popular', 'New', 'Active']} value={v} onChange={setV}/>;
}
function DemoToggle() {
  const [on, setOn] = useState(true);
  return (
    <div className="ds-row" style={{alignItems: 'center'}}>
      <Toggle on={on} onChange={setOn}/>
      <span style={{fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)'}}>{on ? 'ON' : 'OFF'}</span>
    </div>
  );
}
function DemoToggleRow() {
  const [on, setOn] = useState(true);
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-title">Discoverable</div>
        <div className="toggle-help">Allow others to find you in search and suggestions.</div>
      </div>
      <Toggle on={on} onChange={setOn}/>
    </div>
  );
}

function DemoComposer() {
  const [c, setC] = useState({ text: "drafting in the design system", privacy: 'Public' });
  return (
    <div className="composer">
      <Avatar variant="compose" avBanner="sunset"/>
      <div>
        <textarea
          className="composer-input"
          placeholder="What's on your mind?"
          value={c.text}
          onChange={e => setC({...c, text: e.target.value})}
        />
        <div className="composer-row">
          <button className="composer-tool" title="Image"><I.image style={{width: 18, height: 18}}/></button>
          <button className="composer-tool" title="Draw">
            <svg viewBox="0 0 24 24" fill="none" style={{width: 18, height: 18}}><path d="M3 21l4-1 11.5-11.5a2.121 2.121 0 00-3-3L4 17l-1 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 6l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
          <button className="composer-tool" title="Poll"><I.poll style={{width: 18, height: 18}}/></button>
          <button className="composer-tool" title="Emoji"><I.smile style={{width: 18, height: 18}}/></button>
          <button className="composer-tool cw">CW</button>
          <button className="composer-tool privacy"><I.globe style={{width: 13, height: 13}}/><span>{c.privacy}</span><I.chevDown style={{width: 12, height: 12}}/></button>
          <span className="composer-spacer"></span>
          <span className="composer-count">{500 - c.text.length}</span>
          <Button variant="primary" disabled={!c.text.trim()}>Post</Button>
        </div>
      </div>
    </div>
  );
}

function DemoThread() {
  const t = {
    ancestors: [{
      id: 'a1', name: 'gridwave', handle: '@gridwave@retro.social', time: '5h',
      avClass: 'av-pixel-pc',
      body: "anyone else feel like the web got a little too loud lately?",
      replies: 18, boosts: 42, favs: 210,
      actions: { reply: false, boost: false, fav: false },
    }],
    focused: {
      ...SAMPLE_POST,
      fullTime: '4:18 PM · May 11, 2026', source: 'PleromaNet™ Web',
      views: '12.4K', bookmarks: 24,
    },
    replies: [
      {
        id: 'r1', name: 'nyan.binary', handle: '@nyan@catgirl.cloud', time: '12m',
        avClass: 'av-anime', body: "this is the energy i needed today 🌙",
        replies: 2, boosts: 3, favs: 18,
        actions: { reply: false, boost: false, fav: false },
        nestedReplies: [],
      },
      {
        id: 'r2', name: 'soft.hertz', handle: '@soft.hertz@kolektiva.social', time: '22m',
        avClass: 'av-grad-3', body: "touched grass too. recommend the slow internet diet.",
        replies: 0, boosts: 7, favs: 31,
        actions: { reply: false, boost: false, fav: false },
        nestedReplies: [],
      },
    ],
  };
  return (
    <Card className="thread">
      <div className="thread-head">
        <button className="thread-back"><I.arrowL style={{width: 18, height: 18}}/></button>
        <div className="thread-head-title">Thread</div>
        <button className="tab-action"><I.more style={{width: 16, height: 16}}/></button>
      </div>
      <AncestorPost post={t.ancestors[0]} onAction={()=>{}}/>
      <FocusedPost post={t.focused} onAction={()=>{}} continuesAbove={true}/>
      <div className="thread-reply-head">
        <div className="thread-reply-count"><I.reply style={{width: 13, height: 13, color: 'var(--muted)'}}/><span>2 replies</span></div>
      </div>
      <div className="thread-replies">
        {t.replies.map((r, i) => (
          <ReplyPost key={r.id} post={r} onAction={()=>{}} isLast={i === t.replies.length - 1} nestedReplies={[]}/>
        ))}
      </div>
    </Card>
  );
}

function NotifPreview({ kind }) {
  const samples = {
    mention: {
      id: 'p1', kind: 'mention', read: false, time: '4m',
      who: [{ name: 'orbit', handle: '@orbit@spacebear.net', av: 'sunset' }],
      post: { excerpt: 'hey @dreambyte — does the gradient hold up in dusk?', tStamp: '4m ago' },
    },
    fav: {
      id: 'p2', kind: 'fav', read: false, time: '12m',
      who: [{ name: 'kestrel', av: 'city' }, { name: 'mossy', av: 'sunset' }, { name: 'datagram', av: 'space' }, { name: 'lumen', av: 'sunset' }],
      post: { excerpt: 'a placeholder is more honest than a guess.', tStamp: '2h ago' },
    },
    boost: {
      id: 'p3', kind: 'boost', read: true, time: '2h',
      who: [{ name: 'lumen', av: 'sunset' }, { name: 'mossy', av: 'city' }, { name: 'kestrel', av: 'sunset' }],
      post: { excerpt: 'living in a soft world. quietly federating.', tStamp: '6h ago' },
    },
    reply: {
      id: 'p4', kind: 'reply', read: true, time: '1h',
      who: [{ name: 'datagram', handle: '@datagram@retro.social', av: 'space' }],
      post: { excerpt: 'around the time the algorithm replaced the timeline.', tStamp: '1h ago' },
      on: 'we used to log off. when did that stop being a thing.',
    },
    follow: {
      id: 'p5', kind: 'follow', read: false, time: '22m',
      who: [{ name: 'static.gif', handle: '@staticgif@modem.zone', av: 'space' }],
      bio: 'chiptune & sleep noise · CC BY 4.0',
    },
    follow_req: {
      id: 'p6', kind: 'follow_req', read: true, time: '4h',
      who: [{ name: 'unknown.peer', handle: '@unknown@strange.host', av: 'space' }],
      bio: 'no bio · 0 posts',
    },
  };
  // Render directly using the same structure NotifRow uses but isolated to a single row.
  // (We pull NotifRow off the page by re-rendering the popover with one entry would be heavy —
  // simpler: read it off window if exported, else inline.)
  const Row = window.NotifRow;
  return (
    <div style={{background: 'var(--panel)', padding: '4px 0'}}>
      {Row ? <Row n={samples[kind]} dense={false}/> : <div style={{padding: 12, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)'}}>NotifRow not exposed</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DesignSystem/>);
