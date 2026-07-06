/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */

// ============================================================
// Mixed-media attachment variants
// One canonical post with 3 photos + 1 video + 2 audio, rendered
// four ways. All share the same lightbox modal on overflow click.
// ============================================================

const POST = {
  name: 'orbit',
  handle: '@orbit@spacebear.net',
  time: '32m',
  avClass: 'av-orb',
  body: "field recordings from yesterday's walk — finally got around to processing them. attaching the two clips i'm happiest with, plus the location photos and a short video.",
  attachments: [
    { kind: 'photo', src: 'samples/falco.png',     alt: 'station platform',   filename: 'IMG_0421.jpg', size: '2.3 MB' },
    { kind: 'photo', src: 'samples/dragon.png',    alt: 'shrine path',        filename: 'IMG_0428.jpg', size: '3.1 MB' },
    { kind: 'photo', src: 'samples/cat-door.webp', alt: 'door + cat',         filename: 'IMG_0431.jpg', size: '1.8 MB' },
    { kind: 'video', poster: 'sunset', duration: '0:42', title: 'windowsill at dusk', filename: 'kettle.webm', size: '12 MB' },
    { kind: 'audio', title: 'kettle whistle',  byline: 'field · 2026',    duration: '2:14', filename: 'kettle.flac',   size: '24 MB',
      cover: 'linear-gradient(135deg, #6e4f9e, #e7a8c9, #e0b97a)', initial: 'k' },
    { kind: 'audio', title: 'evening crickets', byline: 'field · 2026',   duration: '3:48', filename: 'crickets.flac', size: '38 MB',
      cover: 'linear-gradient(135deg, #2a6f8a, #7dc4be, #e0b97a)', initial: 'c' },
  ],
  replies: 4, boosts: 15, favs: 120,
};

// ============================================================
// Icons
// ============================================================
const Ico = {
  play:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 5l12 7-12 7V5z"/></svg>,
  pause:   (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>,
  audio:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" strokeLinejoin="round"/></svg>,
  video:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M15 8l5-3v14l-5-3M3 7h12v10H3z" strokeLinejoin="round"/></svg>,
  photo:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="8" cy="10" r="1.5"/><path d="M3 17l5-5 4 4 3-3 6 6" strokeLinejoin="round"/></svg>,
  reply:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M9 8H6v3M6 8c0 5 4 8 9 8h4M19 16l-3 3M19 16l-3-3" strokeLinejoin="round" strokeLinecap="round"/></svg>,
  boost:   (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 8l3-3 3 3M7 5v9a2 2 0 002 2h7M20 16l-3 3-3-3M17 19v-9a2 2 0 00-2-2H8" strokeLinejoin="round" strokeLinecap="round"/></svg>,
  star:    (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 3l2.6 5.8 6.4.6-4.8 4.4 1.4 6.2L12 16.8 6.4 20l1.4-6.2L3 9.4l6.4-.6L12 3z" strokeLinejoin="round"/></svg>,
  more:    (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>,
  download:(p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 4v12M7 11l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x:       (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/></svg>,
  arrowL:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowR:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  expand:  (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  caption: ({ count, kinds }) => {
    const types = kinds.join(' · ');
    return <>{count} attachments · {types}</>;
  },
};

// ============================================================
// PostShell — shared chrome (avatar / head / body / actions)
// Each variant slots its own attachment block into `children`.
// ============================================================
function PostShell({ children, footerCaption }) {
  return (
    <div className="mm-card">
      <div className="mm-post">
        <div className={"mm-av av-orb"}/>
        <div style={{minWidth: 0}}>
          <div className="mm-head">
            <span className="mm-name">{POST.name}</span>
            <span className="mm-handle">{POST.handle}</span>
            <span className="mm-time">{POST.time}</span>
          </div>
          <div className="mm-body">{POST.body}</div>
          {children}
          <div className="mm-actions">
            <button className="mm-action"><Ico.reply style={{width: 14, height: 14}}/> {POST.replies}</button>
            <button className="mm-action"><Ico.boost style={{width: 14, height: 14}}/> {POST.boosts}</button>
            <button className="mm-action"><Ico.star  style={{width: 14, height: 14}}/> {POST.favs}</button>
            <button className="mm-action mm-action-end"><Ico.more style={{width: 14, height: 14}}/></button>
          </div>
        </div>
      </div>
      {footerCaption}
    </div>
  );
}

// ============================================================
// Variant A — Unified Mosaic
// One PhotoGrid-style grid, but type-aware tiles. 4th tile
// becomes "+N more" if there are 5+ attachments. Click anywhere
// → lightbox.
// ============================================================
function VariantMosaic() {
  const atts = POST.attachments;
  const visible = atts.slice(0, 4);
  const remaining = atts.length - 4;

  return (
    <Page kicker="OPTION A" title="Unified mosaic" sub="Every attachment is a tile in the existing photo-grid layout. Type baked into the tile chrome. 4+ collapses the last tile into a +N overlay that opens the lightbox.">
      <PostShell footerCaption={<Cheatsheet model="One grid for everything, type-tagged tiles." pros="Visually compact. Familiar n1/n2/n3/n4 grid. Works for posts of any media-type mix." cons="Video/audio shown at photo aspect ratio — controls feel cramped. Audio loses its waveform." overflow="4th tile becomes +N overlay → lightbox carousel."/>}>
        <div className="mm-mosaic n4">
          {visible.map((a, i) => {
            const isLast = i === 3;
            const showOverflow = isLast && remaining > 0;
            return (
              <div key={i} className="mm-mosaic-tile">
                <MosaicTileContent att={visible[i]}/>
                {showOverflow && (
                  <div className="mm-mosaic-overflow">
                    <span className="mm-mosaic-overflow-n">+{remaining}</span>
                    <span className="mm-mosaic-overflow-l">View all</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PostShell>
    </Page>
  );
}

function MosaicTileContent({ att }) {
  if (att.kind === 'photo') {
    return (
      <div className="mm-tile mm-tile-photo">
        <img src={att.src} alt={att.alt || ''}/>
      </div>
    );
  }
  if (att.kind === 'video') {
    return (
      <div className="mm-tile mm-tile-video">
        <div className="mm-tile-poster" style={{background: 'linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 75%, #f3c191 100%)'}}/>
        <div className="mm-tile-play"><Ico.play style={{width: 18, height: 18, marginLeft: 2}}/></div>
        <span className="mm-tile-chip mm-chip-tl"><Ico.video style={{width: 9, height: 9}}/> VIDEO</span>
        <span className="mm-tile-chip mm-chip-tr">{att.duration}</span>
      </div>
    );
  }
  // audio
  return (
    <div className="mm-tile mm-tile-audio" style={{background: att.cover}}>
      <span className="mm-tile-audio-init">{att.initial}</span>
      <div className="mm-tile-wave">
        {Array.from({length: 18}).map((_, i) => {
          const v = Math.sin(i * 0.7 + att.title.length) * 0.5 + Math.cos(i * 1.1) * 0.3;
          const h = Math.max(0.2, Math.min(1, Math.abs(v) + 0.3));
          return <span key={i} style={{height: (h * 100) + '%'}}/>;
        })}
      </div>
      <span className="mm-tile-chip mm-chip-tl"><Ico.audio style={{width: 9, height: 9}}/> AUDIO</span>
      <span className="mm-tile-chip mm-chip-tr">{att.duration}</span>
      <div className="mm-tile-audio-title">{att.title}</div>
    </div>
  );
}

// ============================================================
// Variant B — Sectioned (honest)
// Each media type gets its own block with its native treatment.
// Photos in PhotoGrid, video in player, audio in compact list.
// Overflow within each section.
// ============================================================
function VariantSectioned() {
  const photos = POST.attachments.filter(a => a.kind === 'photo');
  const video  = POST.attachments.find(a => a.kind === 'video');
  const audio  = POST.attachments.filter(a => a.kind === 'audio');

  return (
    <Page kicker="OPTION B" title="Sectioned" sub="Photos render as a grid, video as a player, audio as a list. Each type keeps its native treatment. Subtle subheaders separate sections — no nesting cards.">
      <PostShell footerCaption={<Cheatsheet model="One section per media type. Native treatment for each." pros="Audio gets waveform, video gets player, photos get grid. Honest to the difference between media types." cons="Tallest of the variants. More vertical scanning." overflow="Per-section: photos n4+ → +N overlay; audio list collapses after 3 → 'show more'."/>}>
        <div className="mm-sectioned">
          {photos.length > 0 && (
            <div className="mm-section">
              <div className="mm-section-h"><Ico.photo style={{width: 11, height: 11}}/> {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</div>
              <div className={"mm-photos n" + Math.min(photos.length, 4)}>
                {photos.slice(0, 4).map((p, i) => (
                  <div key={i} className="mm-photo-cell">
                    <img src={p.src} alt={p.alt || ''}/>
                  </div>
                ))}
              </div>
            </div>
          )}
          {video && (
            <div className="mm-section">
              <div className="mm-section-h"><Ico.video style={{width: 11, height: 11}}/> 1 video · {video.duration}</div>
              <div className="mm-video">
                <div className="mm-video-frame" style={{background: 'linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 75%, #f3c191 100%)'}}>
                  <button className="mm-video-play"><Ico.play style={{width: 22, height: 22, marginLeft: 2}}/></button>
                  <span className="mm-tile-chip mm-chip-tr">{video.duration}</span>
                </div>
                <div className="mm-video-cap">{video.title}</div>
              </div>
            </div>
          )}
          {audio.length > 0 && (
            <div className="mm-section">
              <div className="mm-section-h"><Ico.audio style={{width: 11, height: 11}}/> {audio.length} audio clips · 6:02 total</div>
              <div className="mm-audio-list">
                {audio.map((a, i) => (
                  <div key={i} className="mm-audio-row">
                    <button className="mm-audio-play" style={{background: a.cover}}>
                      <Ico.play style={{width: 12, height: 12, marginLeft: 1, color: 'white'}}/>
                    </button>
                    <div className="mm-audio-meta">
                      <div className="mm-audio-t">{a.title}</div>
                      <div className="mm-audio-by">{a.byline}</div>
                    </div>
                    <div className="mm-audio-wave">
                      {Array.from({length: 28}).map((_, j) => {
                        const v = Math.sin(j * 0.6 + i + a.title.length) * 0.5 + Math.cos(j * 1.2) * 0.3;
                        const h = Math.max(0.2, Math.min(1, Math.abs(v) + 0.3));
                        return <span key={j} style={{height: (h * 100) + '%'}}/>;
                      })}
                    </div>
                    <div className="mm-audio-d">{a.duration}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PostShell>
    </Page>
  );
}

// ============================================================
// Variant C — Hero + Strip
// First attachment is featured large (with native treatment).
// Below it: horizontal thumbnail strip of everything else.
// Click a thumbnail to promote it to hero.
// ============================================================
function VariantHeroStrip() {
  const [heroIdx, setHeroIdx] = React.useState(0);
  const hero = POST.attachments[heroIdx];
  const atts = POST.attachments;

  return (
    <Page kicker="OPTION C" title="Hero + strip" sub="First attachment gets full size, rest are thumbnails in a strip below. Click a thumbnail to promote it. Always one focus, never cramped.">
      <PostShell footerCaption={<Cheatsheet model="One hero at a time, others as a thumbnail strip below." pros="Hero gets full controls. Strip stays compact at any count. Clicking a thumbnail is instant + lightweight." cons="Has to pick a default 'main' attachment (first one). Strip can get long horizontally — needs to scroll." overflow="Horizontal scroll. No +N overlay needed; lightbox still available via expand button on hero."/>}>
        <div className="mm-hero-wrap">
          <HeroDisplay att={hero}/>
          <div className="mm-strip">
            {atts.map((a, i) => (
              <button
                key={i}
                className={"mm-strip-tile " + (i === heroIdx ? 'sel' : '') + " mm-strip-" + a.kind}
                onClick={() => setHeroIdx(i)}
                title={a.title || a.filename}>
                <StripThumb att={a}/>
                <span className="mm-strip-kind">
                  {a.kind === 'photo' && <Ico.photo style={{width: 10, height: 10}}/>}
                  {a.kind === 'video' && <Ico.video style={{width: 10, height: 10}}/>}
                  {a.kind === 'audio' && <Ico.audio style={{width: 10, height: 10}}/>}
                </span>
              </button>
            ))}
          </div>
        </div>
      </PostShell>
    </Page>
  );
}

function HeroDisplay({ att }) {
  if (att.kind === 'photo') {
    return (
      <div className="mm-hero mm-hero-photo">
        <img src={att.src} alt={att.alt || ''}/>
        <span className="mm-tile-chip mm-chip-tr">{att.size}</span>
        <button className="mm-hero-expand"><Ico.expand style={{width: 14, height: 14}}/></button>
      </div>
    );
  }
  if (att.kind === 'video') {
    return (
      <div className="mm-hero mm-hero-video">
        <div className="mm-tile-poster" style={{background: 'linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 75%, #f3c191 100%)'}}/>
        <div className="mm-tile-play"><Ico.play style={{width: 22, height: 22, marginLeft: 2}}/></div>
        <span className="mm-tile-chip mm-chip-tl"><Ico.video style={{width: 9, height: 9}}/> VIDEO</span>
        <span className="mm-tile-chip mm-chip-tr">{att.duration}</span>
        <div className="mm-hero-vctrl">
          <button><Ico.play style={{width: 12, height: 12}}/></button>
          <span className="mm-hero-time">0:00 / {att.duration}</span>
          <div className="mm-hero-scrub"><span style={{width: '12%'}}/></div>
        </div>
      </div>
    );
  }
  // audio hero — full player look
  return (
    <div className="mm-hero mm-hero-audio">
      <div className="mm-hero-audio-cover" style={{background: att.cover}}>
        <span>{att.initial}</span>
      </div>
      <div className="mm-hero-audio-body">
        <div className="mm-hero-audio-kicker"><Ico.audio style={{width: 10, height: 10}}/> AUDIO</div>
        <div className="mm-hero-audio-title">{att.title}</div>
        <div className="mm-hero-audio-by">{att.byline}</div>
        <div className="mm-hero-audio-wave">
          {Array.from({length: 50}).map((_, j) => {
            const v = Math.sin(j * 0.6 + att.title.length) * 0.5 + Math.cos(j * 1.2) * 0.3;
            const h = Math.max(0.2, Math.min(1, Math.abs(v) + 0.3));
            return <span key={j} style={{height: (h * 100) + '%'}}/>;
          })}
        </div>
        <div className="mm-hero-audio-time">0:00 / {att.duration}</div>
      </div>
    </div>
  );
}

function StripThumb({ att }) {
  if (att.kind === 'photo') return <img src={att.src} alt=""/>;
  if (att.kind === 'video') {
    return (
      <>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 75%, #f3c191 100%)'}}/>
        <Ico.play style={{width: 14, height: 14, color: 'white', position: 'relative', zIndex: 1, marginLeft: 1}}/>
      </>
    );
  }
  return (
    <div style={{position: 'absolute', inset: 0, background: att.cover, display: 'grid', placeItems: 'center'}}>
      <span style={{fontFamily: 'var(--serif)', fontSize: 22, fontStyle: 'italic', color: 'rgba(255,255,255,0.92)', lineHeight: 1}}>{att.initial}</span>
    </div>
  );
}

// ============================================================
// Variant D — Manifest list
// The most fedi-coded: pure list view. Each attachment is one
// monospace-leaning row with type icon, name, size, expand
// button. First N expand inline; rest collapse.
// ============================================================
function VariantManifest() {
  return (
    <Page kicker="OPTION D" title="Attachment manifest" sub="Compact email-style list — type · name · size · expand. The most information-dense option. Click any row to open in lightbox. First attachment expands inline.">
      <PostShell footerCaption={<Cheatsheet model="One row per attachment. Inline preview of first item; rest live in the list." pros="Scales to any count without growing tall. Filenames + sizes visible. Strong 'this is the fediverse' typography." cons="Less visual. Photos lose their grid composition. Best for posts where the media is supporting, not the point." overflow="None needed — list scales linearly. Long lists could collapse to 'Show all 17 →'."/>}>
        <div className="mm-manifest">
          <div className="mm-manifest-h">
            <span>{POST.attachments.length} attachments</span>
            <span className="mm-manifest-types">
              3 photos · 1 video · 2 audio · 81 MB total
            </span>
          </div>
          <div className="mm-manifest-rows">
            {POST.attachments.map((a, i) => (
              <button key={i} className={"mm-manifest-row " + (i === 0 ? 'mm-manifest-row-open' : '')}>
                <span className={"mm-manifest-kind k-" + a.kind}>
                  {a.kind === 'photo' && <Ico.photo style={{width: 11, height: 11}}/>}
                  {a.kind === 'video' && <Ico.video style={{width: 11, height: 11}}/>}
                  {a.kind === 'audio' && <Ico.audio style={{width: 11, height: 11}}/>}
                </span>
                <span className="mm-manifest-name">{a.filename}</span>
                <span className="mm-manifest-meta">
                  {a.kind === 'photo' ? a.alt : a.kind === 'video' ? a.title : a.title}
                </span>
                <span className="mm-manifest-size">{a.size}</span>
                {a.kind !== 'photo' && a.duration && <span className="mm-manifest-d">{a.duration}</span>}
                <span className="mm-manifest-expand">
                  {i === 0 ? '−' : '+'}
                </span>
              </button>
            ))}
          </div>
          {/* Inline preview of first attachment */}
          <div className="mm-manifest-preview">
            <img src={POST.attachments[0].src} alt={POST.attachments[0].alt}/>
          </div>
        </div>
      </PostShell>
    </Page>
  );
}

// ============================================================
// Variant E — Lightbox (the shared overflow target)
// All four variants share the same lightbox modal — this is
// what clicking +N (mosaic), expand (hero), or any row (manifest)
// opens into.
// ============================================================
function VariantLightbox() {
  return (
    <Page kicker="SHARED" title="Lightbox modal" sub="The shared overflow surface. Opens from any variant. Centered media, type-appropriate controls, thumbnail strip below for navigation. ←/→ arrows + Esc.">
      <div className="mm-lightbox-stage">
        <div className="mm-lightbox-bg"/>
        <div className="mm-lightbox">
          <div className="mm-lb-head">
            <div className="mm-lb-attr">
              <div className="mm-lb-av av-orb"/>
              <div>
                <div className="mm-lb-name">{POST.name} <span>{POST.handle}</span></div>
                <div className="mm-lb-count">1 of 6 · station platform</div>
              </div>
            </div>
            <div className="mm-lb-tools">
              <button className="mm-lb-btn"><Ico.download style={{width: 14, height: 14}}/></button>
              <button className="mm-lb-btn"><Ico.more style={{width: 14, height: 14}}/></button>
              <button className="mm-lb-btn mm-lb-close"><Ico.x style={{width: 14, height: 14}}/></button>
            </div>
          </div>
          <div className="mm-lb-body">
            <button className="mm-lb-nav mm-lb-nav-l"><Ico.arrowL style={{width: 16, height: 16}}/></button>
            <div className="mm-lb-viewer">
              <img src="samples/falco.png" alt=""/>
            </div>
            <button className="mm-lb-nav mm-lb-nav-r"><Ico.arrowR style={{width: 16, height: 16}}/></button>
          </div>
          <div className="mm-lb-strip">
            {POST.attachments.map((a, i) => (
              <button key={i} className={"mm-lb-thumb mm-strip-" + a.kind + (i === 0 ? ' sel' : '')}>
                <StripThumb att={a}/>
                <span className="mm-strip-kind">
                  {a.kind === 'photo' && <Ico.photo style={{width: 9, height: 9}}/>}
                  {a.kind === 'video' && <Ico.video style={{width: 9, height: 9}}/>}
                  {a.kind === 'audio' && <Ico.audio style={{width: 9, height: 9}}/>}
                </span>
              </button>
            ))}
          </div>
          <div className="mm-lb-foot">
            <span><kbd>←</kbd> <kbd>→</kbd> navigate</span>
            <span><kbd>Esc</kbd> close</span>
            <span style={{flex: 1}}/>
            <span>IMG_0421.jpg · 2.3 MB · 2400 × 1600</span>
          </div>
        </div>
      </div>
    </Page>
  );
}

// ============================================================
// Shared chrome — Page wrapper + Cheatsheet
// ============================================================
function Page({ kicker, title, sub, children }) {
  return (
    <div className="mm-page">
      <header className="mm-page-h">
        <div className="mm-kicker">{kicker}</div>
        <h1 className="mm-h1">{title}</h1>
        <p className="mm-sub">{sub}</p>
      </header>
      <div className="mm-page-body">
        {children}
      </div>
    </div>
  );
}

function Cheatsheet({ model, pros, cons, overflow }) {
  return (
    <div className="mm-cheat">
      <div className="mm-cheat-row"><span className="mm-cheat-k">Model</span><span>{model}</span></div>
      <div className="mm-cheat-row"><span className="mm-cheat-k">Pros</span><span>{pros}</span></div>
      <div className="mm-cheat-row"><span className="mm-cheat-k">Cons</span><span>{cons}</span></div>
      <div className="mm-cheat-row"><span className="mm-cheat-k">Overflow</span><span>{overflow}</span></div>
    </div>
  );
}

// ============================================================
// Refined direction — Hero+strip as the GENERAL case, with smart
// special-cases for common small combos so we don't force a strip
// when 2 items could just sit together comfortably.
// ============================================================

// Compact audio bar — used when audio is one of N items but isn't
// the "main" focus. Lives below photos in combo layouts.
function CompactAudio({ audio }) {
  return (
    <div className="mm-cap">
      <button className="mm-cap-play" style={{background: audio.cover}}>
        <Ico.play style={{width: 11, height: 11, marginLeft: 1, color: 'white'}}/>
      </button>
      <div className="mm-cap-meta">
        <div className="mm-cap-t">{audio.title}</div>
        <div className="mm-cap-by">{audio.byline}</div>
      </div>
      <div className="mm-cap-wave">
        {Array.from({length: 32}).map((_, i) => {
          const v = Math.sin(i * 0.6 + audio.title.length) * 0.5 + Math.cos(i * 1.2) * 0.3;
          const h = Math.max(0.2, Math.min(1, Math.abs(v) + 0.3));
          return <span key={i} style={{height: (h * 100) + '%'}}/>;
        })}
      </div>
      <span className="mm-cap-d">{audio.duration}</span>
    </div>
  );
}

// Native single-media — what you get when there's exactly one
// attachment (no strip, no chrome, just the media).
function SingleMedia({ att }) {
  if (att.kind === 'photo') {
    return (
      <div className="mm-single mm-single-photo">
        <img src={att.src} alt={att.alt || ''}/>
      </div>
    );
  }
  if (att.kind === 'video') {
    return (
      <div className="mm-single mm-single-video" style={{background: 'linear-gradient(180deg, #1d1840 0%, #533c7a 40%, #d889a0 75%, #f3c191 100%)'}}>
        <button className="mm-tile-play"><Ico.play style={{width: 18, height: 18, marginLeft: 2}}/></button>
        <span className="mm-tile-chip mm-chip-tl"><Ico.video style={{width: 9, height: 9}}/> VIDEO</span>
        <span className="mm-tile-chip mm-chip-tr">{att.duration}</span>
      </div>
    );
  }
  // audio — bigger than the compact bar, full player look
  return (
    <div className="mm-hero mm-hero-audio">
      <div className="mm-hero-audio-cover" style={{background: att.cover}}>
        <span>{att.initial}</span>
      </div>
      <div className="mm-hero-audio-body">
        <div className="mm-hero-audio-kicker"><Ico.audio style={{width: 10, height: 10}}/> AUDIO</div>
        <div className="mm-hero-audio-title">{att.title}</div>
        <div className="mm-hero-audio-by">{att.byline}</div>
        <div className="mm-hero-audio-wave">
          {Array.from({length: 50}).map((_, j) => {
            const v = Math.sin(j * 0.6 + att.title.length) * 0.5 + Math.cos(j * 1.2) * 0.3;
            const h = Math.max(0.2, Math.min(1, Math.abs(v) + 0.3));
            return <span key={j} style={{height: (h * 100) + '%'}}/>;
          })}
        </div>
        <div className="mm-hero-audio-time">0:00 / {att.duration}</div>
      </div>
    </div>
  );
}

// Existing PhotoGrid pattern, isolated for the photos-only case
function PhotoOnlyGrid({ photos }) {
  const n = Math.min(photos.length, 4);
  return (
    <div className={"mm-photos n" + n}>
      {photos.slice(0, 4).map((p, i) => (
        <div key={i} className="mm-photo-cell">
          <img src={p.src} alt={p.alt || ''}/>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Sample posts (one per rule)
// ============================================================
const SAMPLES = {
  onePhoto: {
    name: 'signal', handle: '@signal@mastodon.online', time: '12m',
    body: 'dusk in the city',
    attachments: [{ kind: 'photo', src: 'samples/falco.png', alt: 'sunset over rooftops' }],
  },
  oneVideo: {
    name: 'pixelmoth', handle: '@pixelmoth@retro.social', time: '1h',
    body: "cassette deck loop i recorded out the kitchen window. don't mind the kettle.",
    attachments: [{ kind: 'video', poster: 'sunset', duration: '0:42', title: 'windowsill at dusk' }],
  },
  oneAudio: {
    name: 'kestrel.fm', handle: '@kestrel@audio.garden', time: '32m',
    body: "demo from last night's basement set. 12 minutes of synths, one take, no edits.",
    attachments: [{ kind: 'audio', title: 'after the storm (demo)', byline: 'kestrel · live take · 2026', duration: '4:18',
                   cover: 'linear-gradient(135deg, #6e4f9e 0%, #e7a8c9 60%, #e0b97a 100%)', initial: 'k' }],
  },
  fourPhotos: {
    name: 'sysadmin', handle: '@root@pleroma.social', time: '4h',
    body: 'cat patrol, four locations',
    attachments: [
      { kind: 'photo', src: 'samples/cat-door.webp', alt: '' },
      { kind: 'photo', src: 'samples/cat-bank.webp', alt: '' },
      { kind: 'photo', src: 'samples/cats-pair.webp', alt: '' },
      { kind: 'photo', src: 'samples/falco.png',     alt: '' },
    ],
  },
  audioPlusPhoto: {
    name: 'kestrel.fm', handle: '@kestrel@audio.garden', time: '6m',
    body: "new piece. recorded this morning, the album cover is the kitchen window it was made at.",
    attachments: [
      { kind: 'photo', src: 'samples/dragon.png', alt: 'window at sunrise' },
      { kind: 'audio', title: 'kettle whistle', byline: 'kestrel · field · 2026', duration: '2:14',
        cover: 'linear-gradient(135deg, #6e4f9e, #e7a8c9, #e0b97a)', initial: 'k' },
    ],
  },
  audioPlusPhotos: {
    name: 'orbit', handle: '@orbit@spacebear.net', time: '20m',
    body: "field recordings from the walk + the spots they're from.",
    attachments: [
      { kind: 'photo', src: 'samples/falco.png',     alt: '' },
      { kind: 'photo', src: 'samples/dragon.png',    alt: '' },
      { kind: 'photo', src: 'samples/cat-door.webp', alt: '' },
      { kind: 'audio', title: 'evening crickets', byline: 'orbit · field', duration: '3:48',
        cover: 'linear-gradient(135deg, #2a6f8a, #7dc4be, #e0b97a)', initial: 'c' },
    ],
  },
};

// Lightweight post shell parametrized for the refined section
function MiniPost({ sample, children }) {
  return (
    <div className="mm-mini-post">
      <div className="mm-av av-orb" style={{width: 40, height: 40}}/>
      <div style={{minWidth: 0}}>
        <div className="mm-head">
          <span className="mm-name">{sample.name}</span>
          <span className="mm-handle">{sample.handle}</span>
          <span className="mm-time">{sample.time}</span>
        </div>
        <div className="mm-body">{sample.body}</div>
        {children}
        <div className="mm-actions">
          <button className="mm-action"><Ico.reply style={{width: 14, height: 14}}/> 0</button>
          <button className="mm-action"><Ico.boost style={{width: 14, height: 14}}/> 0</button>
          <button className="mm-action"><Ico.star  style={{width: 14, height: 14}}/> 0</button>
          <button className="mm-action mm-action-end"><Ico.more style={{width: 14, height: 14}}/></button>
        </div>
      </div>
    </div>
  );
}

function SpecimenCard({ rule, sample, children, highlight }) {
  return (
    <div className={"mm-spec-card " + (highlight ? 'mm-spec-hi' : '')}>
      <div className="mm-spec-rule">{rule}</div>
      <div className="mm-spec-stage">
        <MiniPost sample={sample}>{children}</MiniPost>
      </div>
    </div>
  );
}

// ============================================================
// Rule reference — one card that summarizes the decision logic
// ============================================================
function RulesReference() {
  const rules = [
    { input: '1 photo',           wire: <WirePhoto/>,         layout: 'just the photo' },
    { input: '1 video',           wire: <WireVideo/>,         layout: 'just the player' },
    { input: '1 audio',           wire: <WireAudio/>,         layout: 'just the player' },
    { input: '2–4 photos',        wire: <WirePhotos/>,        layout: 'photo grid' },
    { input: '1 photo + 1 audio', wire: <WirePhotoAudio/>,    layout: 'photo + audio bar', highlight: true },
    { input: '2–4 photos + 1 audio', wire: <WirePhotosAudio/>, layout: 'grid + audio bar' },
    { input: 'anything else',     wire: <WireHeroStrip/>,     layout: 'hero + strip' },
  ];
  return (
    <Page kicker="DECISION" title="Layout rules" sub="Hero + strip is the general fallback, but most fediverse posts have ≤4 attachments. These short-circuits keep simple posts simple — no strip when there's nothing to strip.">
      <div className="mm-rules">
        {rules.map((r, i) => (
          <div key={i} className={"mm-rule " + (r.highlight ? 'mm-rule-hi' : '')}>
            <div className="mm-rule-input">{r.input}</div>
            <div className="mm-rule-wire">{r.wire}</div>
            <div className="mm-rule-layout">→ {r.layout}</div>
          </div>
        ))}
      </div>
    </Page>
  );
}

// Wireframe glyphs for the rules table
const WIRE = { fill: '#a48bd9', muted: '#c9c4b3', stroke: '#7a7c95' };
function WireBox({ children, vbW = 80, vbH = 50 }) {
  return <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{width: 80, height: 50, display: 'block'}}>{children}</svg>;
}
function WirePhoto() {
  return <WireBox><rect x="2" y="2" width="76" height="46" rx="2" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/></WireBox>;
}
function WireVideo() {
  return <WireBox>
    <rect x="2" y="2" width="76" height="46" rx="2" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <circle cx="40" cy="25" r="6" fill={WIRE.fill}/>
    <path d="M38 22 L44 25 L38 28 Z" fill="white"/>
  </WireBox>;
}
function WireAudio() {
  return <WireBox>
    <rect x="2" y="14" width="76" height="22" rx="2" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <circle cx="10" cy="25" r="4" fill={WIRE.fill}/>
    <path d="M8.5 23 L12 25 L8.5 27 Z" fill="white"/>
    <g fill={WIRE.fill}>
      {[19,22,25,28,31,34,37,40,43,46,49,52,55,58,61,64,67,70].map((x, i) => {
        const h = 3 + Math.abs(Math.sin(i * 0.7)) * 5;
        return <rect key={x} x={x} y={25 - h/2} width="1.5" height={h} rx="0.5"/>;
      })}
    </g>
  </WireBox>;
}
function WirePhotos() {
  return <WireBox>
    <rect x="2" y="2" width="37" height="22" rx="1" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <rect x="41" y="2" width="37" height="22" rx="1" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <rect x="2" y="26" width="37" height="22" rx="1" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <rect x="41" y="26" width="37" height="22" rx="1" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
  </WireBox>;
}
function WirePhotoAudio() {
  return <WireBox>
    <rect x="2" y="2" width="76" height="32" rx="2" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <rect x="2" y="36" width="76" height="12" rx="1.5" fill="white" stroke={WIRE.fill} strokeWidth="0.7"/>
    <circle cx="9" cy="42" r="3" fill={WIRE.fill}/>
    <path d="M7.5 40.5 L10.5 42 L7.5 43.5 Z" fill="white"/>
    <g fill={WIRE.fill}>
      {[16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56].map((x, i) => {
        const h = 2 + Math.abs(Math.sin(i * 0.7)) * 4;
        return <rect key={x} x={x} y={42 - h/2} width="1" height={h} rx="0.4"/>;
      })}
    </g>
  </WireBox>;
}
function WirePhotosAudio() {
  return <WireBox>
    <rect x="2" y="2" width="37" height="14" rx="1" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <rect x="41" y="2" width="37" height="14" rx="1" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <rect x="2" y="18" width="37" height="14" rx="1" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <rect x="41" y="18" width="37" height="14" rx="1" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <rect x="2" y="34" width="76" height="14" rx="1.5" fill="white" stroke={WIRE.fill} strokeWidth="0.7"/>
    <circle cx="9" cy="41" r="3" fill={WIRE.fill}/>
    <path d="M7.5 39.5 L10.5 41 L7.5 42.5 Z" fill="white"/>
  </WireBox>;
}
function WireHeroStrip() {
  return <WireBox>
    <rect x="2" y="2" width="76" height="30" rx="2" fill={WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.6"/>
    <circle cx="40" cy="17" r="4" fill={WIRE.fill}/>
    <path d="M38 14.5 L42 17 L38 19.5 Z" fill="white"/>
    {[2,12,22,32,42,52,62,72].map((x, i) => (
      <rect key={x} x={x} y="36" width="6" height="10" rx="0.6" fill={i === 0 ? WIRE.fill : WIRE.muted} stroke={WIRE.stroke} strokeWidth="0.4"/>
    ))}
  </WireBox>;
}

// ============================================================
// Refined section App
// ============================================================
function RefinedApp() {
  return (
    <DCSection id="refined" title="Chosen direction — hero+strip with smart short-circuits">
      <DCArtboard id="rules" label="Decision rules" width={1080} height={620}>
        <RulesReference/>
      </DCArtboard>

      <DCArtboard id="one-photo" label="1 photo · just the photo" width={520} height={620}>
        <Page kicker="CASE" title="One photo" sub="No strip, no chrome. Just the image. This is what 70% of posts look like.">
          <SpecimenCard sample={SAMPLES.onePhoto} rule="1 photo → native">
            <SingleMedia att={SAMPLES.onePhoto.attachments[0]}/>
          </SpecimenCard>
        </Page>
      </DCArtboard>

      <DCArtboard id="one-video" label="1 video · just the player" width={520} height={620}>
        <Page kicker="CASE" title="One video" sub="Full player, no strip. Video already has its own transport controls.">
          <SpecimenCard sample={SAMPLES.oneVideo} rule="1 video → native">
            <SingleMedia att={SAMPLES.oneVideo.attachments[0]}/>
          </SpecimenCard>
        </Page>
      </DCArtboard>

      <DCArtboard id="one-audio" label="1 audio · full player" width={520} height={520}>
        <Page kicker="CASE" title="One audio" sub="Full audio player with waveform and metadata.">
          <SpecimenCard sample={SAMPLES.oneAudio} rule="1 audio → native">
            <SingleMedia att={SAMPLES.oneAudio.attachments[0]}/>
          </SpecimenCard>
        </Page>
      </DCArtboard>

      <DCArtboard id="four-photos" label="2–4 photos · existing grid" width={520} height={620}>
        <Page kicker="CASE" title="2–4 photos" sub="Existing photo grid (n2/n3/n4). No need to change this.">
          <SpecimenCard sample={SAMPLES.fourPhotos} rule="≤4 photos → grid">
            <PhotoOnlyGrid photos={SAMPLES.fourPhotos.attachments}/>
          </SpecimenCard>
        </Page>
      </DCArtboard>

      <DCArtboard id="audio-photo" label="★ 1 photo + 1 audio" width={620} height={680}>
        <Page kicker="SPECIAL CASE" title="1 photo + 1 audio" sub="Both visible at once. Photo gets its full frame, audio gets a compact bar below — first-class but not competing for the hero slot.">
          <SpecimenCard sample={SAMPLES.audioPlusPhoto} rule="1 photo + 1 audio → photo + compact audio bar" highlight>
            <div className="mm-combo">
              <div className="mm-combo-photo">
                <img src={SAMPLES.audioPlusPhoto.attachments[0].src} alt=""/>
              </div>
              <CompactAudio audio={SAMPLES.audioPlusPhoto.attachments[1]}/>
            </div>
          </SpecimenCard>
        </Page>
      </DCArtboard>

      <DCArtboard id="audio-photos" label="3 photos + 1 audio" width={620} height={680}>
        <Page kicker="CASE" title="2–4 photos + 1 audio" sub="Same idea as 1+1 — photos in the grid above, audio as a compact bar below. Both audible/visible without paging through a strip.">
          <SpecimenCard sample={SAMPLES.audioPlusPhotos} rule="≤4 photos + 1 audio → grid + compact audio bar">
            <div className="mm-combo">
              <PhotoOnlyGrid photos={SAMPLES.audioPlusPhotos.attachments.filter(a => a.kind === 'photo')}/>
              <CompactAudio audio={SAMPLES.audioPlusPhotos.attachments.find(a => a.kind === 'audio')}/>
            </div>
          </SpecimenCard>
        </Page>
      </DCArtboard>

      <DCArtboard id="general" label="General · 3 + 1 + 2 → hero+strip" width={620} height={960}>
        <VariantHeroStrip/>
      </DCArtboard>
    </DCSection>
  );
}

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Mixed-media attachment variants">
      <RefinedApp/>
      <DCSection id="variants" title="Earlier exploration — four directions">
        <DCArtboard id="mosaic"   label="A · Unified mosaic"       width={620} height={920}><VariantMosaic/></DCArtboard>
        <DCArtboard id="sectioned" label="B · Sectioned (honest)"   width={620} height={1080}><VariantSectioned/></DCArtboard>
        <DCArtboard id="hero"      label="C · Hero + strip"         width={620} height={960}><VariantHeroStrip/></DCArtboard>
        <DCArtboard id="manifest"  label="D · Attachment manifest"  width={620} height={1000}><VariantManifest/></DCArtboard>
        <DCArtboard id="lightbox"  label="✦ Shared lightbox modal" width={820} height={620}><VariantLightbox/></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
