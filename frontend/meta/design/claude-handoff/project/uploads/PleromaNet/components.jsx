/* global React, I, VaporBanner */
/* ============================================================
   PleromaNet — shared primitives
   ------------------------------------------------------------
   Single source of truth for the patterns that show up across
   home / thread / notifications / explore. Refactor target — if
   you're writing a new post-shaped surface, reach for these
   instead of recopying the markup.
   ============================================================ */

// ---------- Avatar ----------
// variant: 'post' (40–48) | 'focused' (44–56) | 'notif' (28) | 'compose' (40)
// Accepts a post-shaped object ({avClass, avBanner}) OR raw props.
// `size` overrides the variant default (mainly useful for 'notif').
function Avatar({ post, avClass, avBanner, variant = 'post', size, className = '', children, style, ...rest }) {
  const cls  = (post && post.avClass)  ?? avClass  ?? '';
  const bnr  = (post && post.avBanner) ?? avBanner ?? null;
  const baseClass =
    variant === 'focused' ? 'focused-av' :
    variant === 'notif'   ? 'notif-av'   :
    variant === 'compose' ? 'composer-av' :
    'post-av';
  // Inline size for variants whose base CSS class doesn't specify one,
  // or when a callsite wants to override.
  const variantSize = size ?? (variant === 'notif' ? 28 : undefined);
  const inlineStyle = variantSize != null
    ? { width: variantSize, height: variantSize, ...style }
    : style;
  const cn = `${baseClass} ${cls} ${className}`.trim();
  return (
    <div className={cn} style={inlineStyle} {...rest}>
      {bnr && <VaporBanner variant={bnr}/>}
      {children}
    </div>
  );
}

// ---------- PostHead ----------
function PostHead({ post, name, handle, time }) {
  const n = name ?? post?.name, h = handle ?? post?.handle, t = time ?? post?.time;
  return (
    <div className="post-head">
      <span className="post-name">{n}</span>
      <a className="post-handle">{h}</a>
      <span className="post-time">{t}</span>
    </div>
  );
}

// ---------- pickAttachmentLayout ----------
// Given a list of {kind: 'photo'|'video'|'audio', ...} attachments,
// return one of:
//   { type: 'none' }
//   { type: 'single', attachment }                              // 1 of anything
//   { type: 'photoGrid', photos }                               // 2–4 photos only
//   { type: 'photoAudio', photo, audio }                        // 1 photo + 1 audio
//   { type: 'photosAudio', photos, audio }                      // 2–4 photos + 1 audio
//   { type: 'heroStrip', attachments }                          // anything else
//
// Rules are most-specific-first; the last branch is the fallthrough.
function pickAttachmentLayout(attachments) {
  if (!attachments || attachments.length === 0) return { type: 'none' };
  const photos = attachments.filter(a => a.kind === 'photo');
  const videos = attachments.filter(a => a.kind === 'video');
  const audios = attachments.filter(a => a.kind === 'audio');

  if (attachments.length === 1) {
    return { type: 'single', attachment: attachments[0] };
  }
  if (photos.length === attachments.length && photos.length <= 4) {
    return { type: 'photoGrid', photos };
  }
  if (photos.length === 1 && audios.length === 1 && videos.length === 0) {
    return { type: 'photoAudio', photo: photos[0], audio: audios[0] };
  }
  if (photos.length >= 2 && photos.length <= 4 && audios.length === 1 && videos.length === 0) {
    return { type: 'photosAudio', photos, audio: audios[0] };
  }
  return { type: 'heroStrip', attachments };
}

// Back-compat: posts authored against the legacy `photos | video | audio`
// fields get normalized into a flat attachments array before dispatch.
function normalizeAttachments(post) {
  if (post.attachments) return post.attachments;
  const out = [];
  if (post.photos) post.photos.forEach(p => out.push({ kind: 'photo', ...p }));
  if (post.video)  out.push({ kind: 'video', ...post.video });
  if (post.audio)  out.push({ kind: 'audio', ...post.audio });
  return out;
}

// ---------- PostMedia ----------
// Dispatches based on pickAttachmentLayout. Components are pulled off
// window at render time so load order between components.jsx and
// attachments.jsx is flexible.
function PostMedia({ post, onOpen }) {
  const PG = window.PhotoGrid;
  const VA = window.VideoAttachment;
  const AA = window.AudioAttachment;
  const CA = window.CompactAudio;
  const HS = window.MediaHeroStrip;

  const attachments = normalizeAttachments(post);
  const layout = pickAttachmentLayout(attachments);

  return (
    <React.Fragment>
      {post.media && (
        <div className="post-media">
          <VaporBanner variant={post.media}/>
        </div>
      )}

      {layout.type === 'single' && (() => {
        const a = layout.attachment;
        if (a.kind === 'photo' && PG) return <PG photos={[a]} onOpen={onOpen}/>;
        if (a.kind === 'video' && VA) return <VA video={a}/>;
        if (a.kind === 'audio' && AA) return <AA audio={a}/>;
        return null;
      })()}

      {layout.type === 'photoGrid' && PG && (
        <PG photos={layout.photos} onOpen={onOpen}/>
      )}

      {layout.type === 'photoAudio' && PG && CA && (
        <div className="post-attach-combo">
          <PG photos={[layout.photo]} onOpen={(i) => onOpen && onOpen(i)}/>
          <CA audio={layout.audio} onPlay={() => onOpen && onOpen(1)}/>
        </div>
      )}

      {layout.type === 'photosAudio' && PG && CA && (
        <div className="post-attach-combo">
          <PG photos={layout.photos} onOpen={onOpen}/>
          <CA audio={layout.audio} onPlay={() => onOpen && onOpen(layout.photos.length)}/>
        </div>
      )}

      {layout.type === 'heroStrip' && HS && (
        <HS attachments={layout.attachments} onOpen={onOpen}/>
      )}
    </React.Fragment>
  );
}

// ---------- PostActions ----------
// onAction is called with the action key ('reply' | 'boost' | 'fav').
// In thread contexts where the parent expects (id, key), wrap at the callsite.
function PostActions({ post, onAction }) {
  return (
    <div className="post-actions">
      <button
        className={"post-action reply " + (post.actions.reply ? 'on' : '')}
        onClick={() => onAction('reply')}>
        <I.reply/> {post.replies}
      </button>
      <button
        className={"post-action boost " + (post.actions.boost ? 'on' : '')}
        onClick={() => onAction('boost')}>
        <I.boost/> {post.boosts + (post.actions.boost ? 1 : 0)}
      </button>
      <button
        className={"post-action fav " + (post.actions.fav ? 'on' : '')}
        onClick={() => onAction('fav')}>
        <I.star fill={post.actions.fav ? 'currentColor' : 'none'}/> {post.favs + (post.actions.fav ? 1 : 0)}
      </button>
      <button className="post-more" title="More"><I.more style={{width: 16, height: 16}}/></button>
    </div>
  );
}

// ---------- PostBody ----------
// Renders post.body with inline @-mention links auto-detected, plus an
// optional "PINGED" footer line for the leading address pile-up (the
// recipients that auto-prepend to a fediverse reply). The leading
// addressees are NOT rendered inline — they live in post.addressees and
// show up below the body. Mid-text @mentions stay inline at body size.
//
// Usage:
//   <PostBody body={post.body} addressees={post.addressees}/>
const POSTBODY_MENTION_RE = /@[\w.]+(?:@[\w.]+)?/g;
function renderBodyText(text) {
  if (!text) return text;
  const out = [];
  let lastIdx = 0;
  let match;
  let key = 0;
  POSTBODY_MENTION_RE.lastIndex = 0;
  while ((match = POSTBODY_MENTION_RE.exec(text)) !== null) {
    if (match.index > lastIdx) out.push(text.slice(lastIdx, match.index));
    out.push(<a key={"m" + key++} className="post-mention-inline">{match[0]}</a>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) out.push(text.slice(lastIdx));
  return out;
}
function PostBody({ body, addressees, className = '' }) {
  return (
    <React.Fragment>
      <div className={"post-body " + className}>{renderBodyText(body)}</div>
      {addressees && addressees.length > 0 && (
        <div className="post-pinged">
          <span className="post-pinged-l">Pinged</span>
          <span className="post-pinged-list">
            {addressees.map(a => <a key={a} className="post-pinged-chip">{a}</a>)}
          </span>
        </div>
      )}
    </React.Fragment>
  );
}

// ---------- QuotedPost ----------
// V4 "smart-card" layout — hero media on the left, attribution + body
// on the right. Falls back to an embedded card (V1) when there's no
// media. The whole card is the link to the original post.
//
// Quoted media is shown as a *preview*, never a player — clicking
// opens the original where it can actually play.
function pickQuoteHero(attachments) {
  if (!attachments || !attachments.length) return null;
  const photo = attachments.find(a => a.kind === 'photo');
  return photo || attachments[0];
}

function QuotedHero({ hero, extraCount }) {
  return (
    <div className="quoted-hero">
      {hero.kind === 'photo' && <img src={hero.src} alt={hero.alt || ''}/>}
      {hero.kind === 'video' && (
        <React.Fragment>
          <div className="quoted-hero-video-bg"/>
          <svg viewBox="0 0 24 24" fill="currentColor" className="quoted-hero-play"><path d="M7 5l12 7-12 7V5z"/></svg>
        </React.Fragment>
      )}
      {hero.kind === 'audio' && (
        <div className="quoted-hero-audio">
          {hero.cover && <img src={hero.cover} alt=""/>}
          {!hero.cover && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width: 22, height: 22, color: 'rgba(255,255,255,0.75)'}}>
              <path d="M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      )}
      {extraCount > 0 && <span className="quoted-hero-more">+{extraCount}</span>}
    </div>
  );
}

function QuotedPost({ quoted }) {
  if (!quoted) return null;
  const hero = pickQuoteHero(quoted.attachments);
  const extraCount = (quoted.attachments?.length || 0) - (hero ? 1 : 0);
  const domain = quoted.handle ? quoted.handle.split('@').slice(-1)[0] : '';

  // No media → embedded card fallback
  if (!hero) {
    return (
      <a className="quoted-card quoted-embedded" onClick={(e) => e.stopPropagation()}>
        <div className="quoted-head">
          <Avatar variant="post" size={28} avClass={quoted.avClass} avBanner={quoted.avBanner} className="quoted-av-sm"/>
          <span className="quoted-name">{quoted.name}</span>
          <span className="quoted-handle">{quoted.handle}</span>
          <span className="quoted-time">{quoted.time}</span>
          <span className="quoted-ext">↗</span>
        </div>
        <div className="quoted-text">{renderBodyText(quoted.body)}</div>
        <div className="quoted-foot">
          {quoted.replies != null && <span>↩ {quoted.replies}</span>}
          {quoted.boosts != null  && <span>↻ {quoted.boosts}</span>}
          {quoted.favs != null    && <span>★ {quoted.favs}</span>}
          <span className="quoted-foot-end">view original →</span>
        </div>
      </a>
    );
  }

  // With media → smart-card layout
  return (
    <a className="quoted-card quoted-smart" onClick={(e) => e.stopPropagation()}>
      <QuotedHero hero={hero} extraCount={extraCount}/>
      <div className="quoted-body">
        <div className="quoted-kicker">QUOTE{domain ? ' · ' + domain : ''}</div>
        <div className="quoted-text">{renderBodyText(quoted.body)}</div>
        <div className="quoted-attr">
          <Avatar variant="post" size={22} avClass={quoted.avClass} avBanner={quoted.avBanner}/>
          <span className="quoted-attr-name">{quoted.name}</span>
          <span className="quoted-handle">{quoted.handle}</span>
          <span className="quoted-time">· {quoted.time}</span>
        </div>
      </div>
    </a>
  );
}

// ---------- PostShell ----------
// The right column of any post: head + body + quoted + media + actions.
// Use this alongside an Avatar to compose Post / AncestorPost / ReplyPost.
function PostShell({ post, onAction, children }) {
  return (
    <div style={{minWidth: 0}}>
      <PostHead post={post}/>
      <PostBody body={post.body} addressees={post.addressees}/>
      <QuotedPost quoted={post.quotedPost}/>
      <PostMedia post={post}/>
      <PostActions post={post} onAction={onAction}/>
      {children}
    </div>
  );
}

// ---------- Card / CardHead / CardFoot ----------
function Card({ className = '', children, ...rest }) {
  return <div className={"card " + className} {...rest}>{children}</div>;
}
function CardHead({ title, icon: Icon, action, children, ...rest }) {
  return (
    <div className="card-head" {...rest}>
      {title && <span className="card-title">{title}</span>}
      {children}
      {Icon && <Icon style={{width: 16, height: 16, color: 'var(--muted)'}}/>}
      {action}
    </div>
  );
}
function CardFoot({ children, ...rest }) {
  return <button className="card-foot" {...rest}>{children}</button>;
}

// ---------- Buttons ----------
function Button({ variant = 'primary', className = '', children, ...rest }) {
  const cn =
    variant === 'primary'   ? 'btn-primary'   :
    variant === 'secondary' ? 'btn-secondary' :
    variant === 'follow'    ? 'btn-follow'    :
    variant === 'upload'    ? 'btn-upload'    :
    variant === 'ghost'     ? 'tab-action'    :
    '';
  return <button className={(cn + ' ' + className).trim()} {...rest}>{children}</button>;
}

// ---------- Pills / Tags ----------
function Pill({ children, className = '', ...rest }) {
  return <span className={"pill " + className} {...rest}>{children}</span>;
}
function Tag({ children, className = '', ...rest }) {
  return <a className={"tag " + className} {...rest}>{children}</a>;
}

// ---------- Toggle / Segmented ----------
function Toggle({ on, onChange }) {
  return <div className={"toggle " + (on ? 'on' : '')} onClick={() => onChange(!on)}></div>;
}
function Seg({ options, value, onChange, className = '' }) {
  return (
    <div className={"seg " + className}>
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const label = typeof o === 'string' ? o : o.label;
        return (
          <button key={v} className={value === v ? 'active' : ''} onClick={() => onChange(v)}>{label}</button>
        );
      })}
    </div>
  );
}

// ---------- Stats ----------
function StatBlock({ label, value }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
function StatStrip({ items }) {
  return (
    <div className="stat-row">
      {items.map((it, i) => <StatBlock key={i} label={it.label} value={it.value}/>)}
    </div>
  );
}

// ---------- StatusRow (key + value row inside a card) ----------
function StatusRow({ label, value, valueClass = '' }) {
  return (
    <div className="status-row">
      <span className="l">{label}</span>
      {typeof value === 'string' || typeof value === 'number'
        ? <span className={"r " + valueClass}>{value}</span>
        : value}
    </div>
  );
}

Object.assign(window, {
  Avatar, PostHead, PostBody, PostMedia, PostActions, PostShell,
  QuotedPost,
  Card, CardHead, CardFoot,
  Button, Pill, Tag, Toggle, Seg,
  StatBlock, StatStrip, StatusRow,
  pickAttachmentLayout, normalizeAttachments, pickQuoteHero,
});
