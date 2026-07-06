/* global React, I, VaporBanner, Avatar */

// ============================================================
// Attachments
// ------------------------------------------------------------
// All post-attachment layouts live here. The dispatcher in
// components.jsx → PostMedia picks one of these shapes via
// pickAttachmentLayout(attachments).
//
//   single     → PhotoGrid n=1 / VideoAttachment / AudioAttachment
//   photoGrid  → PhotoGrid n=2..4
//   photoAudio → photo + CompactAudio (combo)
//   photosAudio→ photo grid + CompactAudio (combo)
//   heroStrip  → MediaHeroStrip (general fallback)
//
// Clicking a photo (or the strip's "expand" affordance) opens
// AttachmentLightbox via the `pn-open-lightbox` event. Listen
// for it by mounting <AttachmentLightboxHost/> once at the app
// root, or call the openLightbox() helper from anywhere.
// ============================================================

// ---------- Helpers ----------
function parseDur(s) { const [m, sec] = s.split(':').map(Number); return m * 60 + sec; }
function fmtDur(t)  { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }

// Local SVG glyphs (no icon needed in icons.jsx)
function VideoGlyph(p)  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M15 8l5-3v14l-5-3M3 7h12v10H3z" strokeLinejoin="round"/></svg>; }
function AudioGlyph(p)  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z" strokeLinejoin="round"/></svg>; }
function PlayGlyph(p)   { return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M7 5l12 7-12 7V5z"/></svg>; }
function PauseGlyph(p)  { return <svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>; }

// ============================================================
// PhotoGrid — 1 to 4 photos. Click opens lightbox at that index.
// ============================================================
function PhotoGrid({ photos, onOpen }) {
  const n = Math.min(photos.length, 4);
  const [revealed, setRevealed] = React.useState({});
  const reveal = (i) => setRevealed(r => ({ ...r, [i]: true }));
  const handleClick = (i, p) => {
    if (p.cw && !revealed[i]) { reveal(i); return; }
    onOpen && onOpen(i);
  };
  return (
    <div className={"post-photos n" + n} onClick={e => e.stopPropagation()}>
      {photos.slice(0, 4).map((p, i) => (
        <div key={i} className={"ph" + (p.cw && !revealed[i] ? ' cw' : '')} onClick={() => handleClick(i, p)}>
          <img src={p.src} alt={p.alt || ''} loading="lazy"/>
          <span className="ph-tag"><em>duotone</em> · hover for raw</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// VideoAttachment — full video player with poster, transport, scrub
// ============================================================
function VideoAttachment({ video }) {
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const [progress, setProgress] = React.useState(video.start || 0.18);
  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress(p => p >= 1 ? 0 : p + 0.008), 80);
    return () => clearInterval(t);
  }, [playing]);

  const dur = video.duration || '2:14';
  const total = parseDur(dur);
  const cur = fmtDur(total * progress);

  return (
    <div className="post-video" onClick={e => e.stopPropagation()}>
      <div className="pv-frame">
        <VaporBanner variant={video.poster || 'sunset'}/>
        <div className={"pv-scrim " + (playing ? 'on' : '')}></div>
        {!playing && (
          <button className="pv-play" onClick={() => setPlaying(true)} aria-label="Play">
            <PlayGlyph style={{width: 28, height: 28, marginLeft: 3}}/>
          </button>
        )}
        <div className="pv-chip pv-chip-tl"><VideoGlyph style={{width: 11, height: 11}}/><span>VIDEO</span></div>
        <div className="pv-chip pv-chip-tr">{dur}</div>
        {video.cc && <div className="pv-chip pv-chip-bl">CC</div>}
        <div className="pv-controls">
          <button className="pv-ctrl" onClick={() => setPlaying(p => !p)}>
            {playing ? <PauseGlyph style={{width: 12, height: 12}}/> : <PlayGlyph style={{width: 12, height: 12}}/>}
          </button>
          <div className="pv-time">{cur} <span>/ {dur}</span></div>
          <div className="pv-scrub">
            <div className="pv-scrub-bar"><div className="pv-scrub-fill" style={{width: (progress * 100) + '%'}}></div></div>
          </div>
          <button className="pv-ctrl" onClick={() => setMuted(m => !m)} title={muted ? 'Unmute' : 'Mute'}>
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" style={{width: 13, height: 13}}><path d="M11 5L6 9H3v6h3l5 4V5zM16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" style={{width: 13, height: 13}}><path d="M11 5L6 9H3v6h3l5 4V5zM15 9a4 4 0 010 6M18 6a8 8 0 010 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
          <button className="pv-ctrl" title="Fullscreen">
            <svg viewBox="0 0 24 24" fill="none" style={{width: 12, height: 12}}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
      {video.caption && <div className="pv-caption">{video.caption}</div>}
    </div>
  );
}

// ============================================================
// AudioAttachment — V3b layout: 44px album cover (doubles as play
// button) + waveform on the same row, meta below. If no cover image
// is provided, falls back to a neutral ink-colored play surface.
// ============================================================
function AudioAttachment({ audio }) {
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(audio.start || 0.32);
  const barsRef = React.useRef(null);
  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setProgress(p => p >= 1 ? 0 : p + 0.005), 100);
    return () => clearInterval(t);
  }, [playing]);

  const dur = audio.duration || '3:42';
  const total = parseDur(dur);
  const cur = fmtDur(total * progress);

  const BARS = React.useMemo(() => {
    const seed = (audio.title || 'a').length;
    return Array.from({length: 56}, (_, i) => {
      const v = Math.sin(i * 0.7 + seed) * 0.5 + Math.sin(i * 0.31 + seed * 0.4) * 0.3 + Math.cos(i * 1.1) * 0.2;
      return Math.max(0.18, Math.min(1, Math.abs(v) + 0.25));
    });
  }, [audio.title]);

  const playedIdx = Math.floor(progress * BARS.length);

  const seek = (e) => {
    if (!barsRef.current) return;
    const r = barsRef.current.getBoundingClientRect();
    const p = (e.clientX - r.left) / r.width;
    setProgress(Math.max(0, Math.min(1, p)));
  };

  return (
    <div className="post-audio" onClick={e => e.stopPropagation()}>
      <button className="pa-cover" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pause' : 'Play'}>
        {audio.cover && <img src={audio.cover} alt="" className="pa-cover-img"/>}
        <span className="pa-cover-icon">
          {playing ? <PauseGlyph style={{width: 14, height: 14}}/> : <PlayGlyph style={{width: 14, height: 14, marginLeft: 1}}/>}
        </span>
      </button>
      <div className="pa-bars" ref={barsRef} onClick={seek}>
        {BARS.map((h, i) => <span key={i} className={"pa-bar " + (i <= playedIdx ? 'played' : '')} style={{height: (h * 100) + '%'}}/>)}
      </div>
      <div className="pa-meta">
        <div className="pa-text">
          <span className="pa-title">{audio.title}</span>
          {audio.byline && <span className="pa-by"> · {audio.byline}</span>}
        </div>
        <span className="pa-time">{cur} / {dur}</span>
      </div>
    </div>
  );
}

// ============================================================
// CompactAudio — single-row audio bar used in combo layouts
// and inside the lightbox when audio is selected. Same cover-as-play
// pattern as AudioAttachment, just denser.
// ============================================================
function CompactAudio({ audio, onPlay }) {
  const [playing, setPlaying] = React.useState(false);
  const toggle = (e) => { e.stopPropagation(); setPlaying(p => !p); onPlay && onPlay(); };
  const BARS = React.useMemo(() => {
    const seed = (audio.title || 'a').length;
    return Array.from({length: 38}, (_, i) => {
      const v = Math.sin(i * 0.7 + seed) * 0.5 + Math.cos(i * 1.1) * 0.3;
      return Math.max(0.2, Math.min(1, Math.abs(v) + 0.3));
    });
  }, [audio.title]);
  return (
    <div className="compact-audio" onClick={e => e.stopPropagation()}>
      <button className="cap-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {audio.cover && <img src={audio.cover} alt="" className="cap-play-img"/>}
        <span className="cap-play-icon">
          {playing ? <PauseGlyph style={{width: 11, height: 11}}/> : <PlayGlyph style={{width: 11, height: 11, marginLeft: 1}}/>}
        </span>
      </button>
      <div className="cap-meta">
        <div className="cap-t">{audio.title}</div>
        <div className="cap-by">{audio.byline}</div>
      </div>
      <div className="cap-wave">
        {BARS.map((h, i) => <span key={i} style={{height: (h * 100) + '%'}}/>)}
      </div>
      <span className="cap-d">{audio.duration}</span>
    </div>
  );
}

// ============================================================
// MediaStripThumb — small thumbnail for the strip + lightbox
// ============================================================
function MediaStripThumb({ att }) {
  if (att.kind === 'photo') {
    return <img src={att.src} alt=""/>;
  }
  if (att.kind === 'video') {
    return (
      <React.Fragment>
        <div className="mst-video-bg"/>
        <PlayGlyph style={{width: 14, height: 14, color: 'white', position: 'relative', zIndex: 1, marginLeft: 1}}/>
      </React.Fragment>
    );
  }
  if (att.kind === 'audio') {
    return (
      <div className="mst-audio-bg">
        {att.cover && <img src={att.cover} alt=""/>}
        {!att.cover && <AudioGlyph style={{width: 16, height: 16, color: 'rgba(255,255,255,0.7)'}}/>}
      </div>
    );
  }
  return null;
}

function MediaStripKindBadge({ kind }) {
  return (
    <span className="media-strip-kind">
      {kind === 'photo' && <I.image style={{width: 9, height: 9}}/>}
      {kind === 'video' && <VideoGlyph style={{width: 9, height: 9}}/>}
      {kind === 'audio' && <AudioGlyph style={{width: 9, height: 9}}/>}
    </span>
  );
}

// ============================================================
// MediaHeroStrip — general "anything else" layout.
// One large media at the top, horizontal thumbnail strip below.
// Click a thumbnail to promote it. Hero's expand button opens
// the lightbox; the strip itself is local-only.
// ============================================================
function MediaHeroStrip({ attachments, onOpen }) {
  const [heroIdx, setHeroIdx] = React.useState(0);
  const hero = attachments[heroIdx];
  return (
    <div className="media-hero-wrap" onClick={e => e.stopPropagation()}>
      <div className="media-hero">
        {hero.kind === 'photo' && (
          <button className="media-hero-photo" onClick={() => onOpen && onOpen(heroIdx)} title="Open">
            <img src={hero.src} alt={hero.alt || ''}/>
            <span className="media-hero-expand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width: 12, height: 12}}><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </button>
        )}
        {hero.kind === 'video' && <VideoAttachment video={hero}/>}
        {hero.kind === 'audio' && <AudioAttachment audio={hero}/>}
      </div>
      <div className="media-strip">
        {attachments.map((a, i) => (
          <button
            key={i}
            className={"media-strip-tile " + (i === heroIdx ? 'sel' : '') + " mst-" + a.kind}
            onClick={() => setHeroIdx(i)}
            title={a.title || a.filename || a.alt || a.kind}>
            <MediaStripThumb att={a}/>
            <MediaStripKindBadge kind={a.kind}/>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// AttachmentLightbox — fullscreen modal for any attachment.
// Triggered by the `pn-open-lightbox` event; mount the host
// component once at the app root.
// ============================================================
function AttachmentLightbox({ attachments, startIdx, attribution, onClose, onIdx }) {
  const att = attachments[startIdx];
  const total = attachments.length;
  const prev = () => onIdx(Math.max(0, startIdx - 1));
  const next = () => onIdx(Math.min(total - 1, startIdx + 1));
  return (
    <div className="lightbox-bg" onClick={onClose}>
      <div className="lightbox" onClick={e => e.stopPropagation()}>
        <div className="lightbox-head">
          <div className="lightbox-attr">
            {attribution && (
              <React.Fragment>
                <Avatar variant="post" avClass={attribution.avClass} avBanner={attribution.avBanner} size={36}/>
                <div>
                  <div className="lightbox-name">{attribution.name} <span>{attribution.handle}</span></div>
                  <div className="lightbox-count">
                    {startIdx + 1} of {total} ·{' '}
                    {att.kind === 'photo' && (att.alt || 'photo')}
                    {att.kind === 'video' && (att.title || 'video')}
                    {att.kind === 'audio' && (att.title || 'audio')}
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
          <div className="lightbox-tools">
            <button className="lightbox-btn lightbox-close" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{width: 14, height: 14}}><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
        <div className="lightbox-body">
          {startIdx > 0 && (
            <button className="lightbox-nav lightbox-nav-l" onClick={prev} aria-label="Previous">
              <I.arrowL style={{width: 16, height: 16}}/>
            </button>
          )}
          <div className="lightbox-viewer" key={startIdx}>
            <LightboxViewer att={att}/>
          </div>
          {startIdx < total - 1 && (
            <button className="lightbox-nav lightbox-nav-r" onClick={next} aria-label="Next">
              <I.arrowR style={{width: 16, height: 16}}/>
            </button>
          )}
        </div>
        {total > 1 && (
          <div className="lightbox-strip">
            {attachments.map((a, i) => (
              <button key={i} className={"lightbox-thumb mst-" + a.kind + (i === startIdx ? ' sel' : '')} onClick={() => onIdx(i)} title={a.title || a.alt || a.kind}>
                <MediaStripThumb att={a}/>
                <MediaStripKindBadge kind={a.kind}/>
              </button>
            ))}
          </div>
        )}
        <div className="lightbox-foot">
          <span><kbd>←</kbd> <kbd>→</kbd> navigate</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

function LightboxViewer({ att }) {
  if (att.kind === 'photo') {
    return <img className="lightbox-photo" src={att.src} alt={att.alt || ''}/>;
  }
  if (att.kind === 'video') {
    return <div className="lightbox-video"><VideoAttachment video={att}/></div>;
  }
  if (att.kind === 'audio') {
    return <div className="lightbox-audio"><AudioAttachment audio={att}/></div>;
  }
  return null;
}

// ============================================================
// AttachmentLightboxHost — global mount-once listener
// ============================================================
function AttachmentLightboxHost() {
  const [state, setState] = React.useState(null);
  React.useEffect(() => {
    const onOpen = (e) => setState({...e.detail});
    window.addEventListener('pn-open-lightbox', onOpen);
    return () => window.removeEventListener('pn-open-lightbox', onOpen);
  }, []);
  React.useEffect(() => {
    if (!state) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setState(null);
      else if (e.key === 'ArrowLeft')  setState(s => s ? {...s, startIdx: Math.max(0, s.startIdx - 1)} : null);
      else if (e.key === 'ArrowRight') setState(s => s ? {...s, startIdx: Math.min(s.attachments.length - 1, s.startIdx + 1)} : null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state]);
  if (!state) return null;
  return (
    <AttachmentLightbox
      {...state}
      onClose={() => setState(null)}
      onIdx={(i) => setState(s => ({...s, startIdx: i}))}
    />
  );
}

// ============================================================
// Convenience opener
// ============================================================
function openLightbox(attachments, startIdx = 0, attribution = null) {
  window.dispatchEvent(new CustomEvent('pn-open-lightbox', { detail: { attachments, startIdx, attribution } }));
}

// ============================================================
// PollAttachment — single-choice / multi-choice polls.
// Renders in three states:
//   - voting: hasn't voted yet, options are click-to-pick + Vote button
//   - results: has voted (or poll expired): horizontal bar chart
// Pure UI — vote state is owned by the host (post.attachments[i]).
// Click the option row to select; Vote button commits via onVote(pollId, choiceIds).
// ============================================================
function PollAttachment({ poll, onVote }) {
  const [picked, setPicked] = React.useState(new Set());
  const expired = poll.expired;
  const showResults = poll.myVote != null || expired;
  const total = poll.totalVotes || 0;

  if (showResults) {
    const winnerIdx = poll.choices.reduce((best, c, i) =>
      c.votes > poll.choices[best].votes ? i : best, 0);
    return (
      <div className="post-poll" onClick={e => e.stopPropagation()}>
        {poll.choices.map((c, i) => {
          const pct = total > 0 ? Math.round((c.votes / total) * 100) : 0;
          const isMe = poll.multi
            ? (poll.myVote || []).includes(c.id)
            : poll.myVote === c.id;
          const isWinner = i === winnerIdx && c.votes > 0;
          return (
            <div key={c.id} className={"post-poll-row " + (isWinner ? 'winner ' : '') + (isMe ? 'me ' : '')}>
              <div>
                <div className="post-poll-label">
                  {c.label}
                  {isMe && <span className="post-poll-you">You</span>}
                </div>
                <div className="post-poll-track">
                  <div className="post-poll-fill" style={{width: pct + '%'}}/>
                </div>
              </div>
              <div>
                <div className="post-poll-pct">{pct}%</div>
                <div className="post-poll-num">{c.votes}</div>
              </div>
            </div>
          );
        })}
        <div className="post-poll-meta">
          <span className={"post-poll-pill " + (expired ? '' : 'live')}>
            <span className="pp-dot"/>
            {expired ? `Ended ${poll.endedAgo || ''}` : `Ends in ${poll.endsIn || ''}`}
          </span>
          <span>{total} {total === 1 ? 'vote' : 'votes'}</span>
          {poll.myVote != null && <><span className="dot">·</span><span>you voted</span></>}
        </div>
      </div>
    );
  }

  // Voting state
  const toggle = (id) => {
    setPicked(s => {
      const n = new Set(s);
      if (poll.multi) {
        n.has(id) ? n.delete(id) : n.add(id);
      } else {
        n.clear();
        n.add(id);
      }
      return n;
    });
  };
  const submit = () => {
    if (picked.size === 0) return;
    const choice = poll.multi ? [...picked] : [...picked][0];
    onVote && onVote(poll.id, choice);
  };
  return (
    <div className="post-poll" onClick={e => e.stopPropagation()}>
      {poll.choices.map(c => (
        <button
          key={c.id}
          className={"post-poll-vote-row " + (picked.has(c.id) ? 'selected' : '')}
          onClick={() => toggle(c.id)}>
          <span className={poll.multi ? 'post-poll-check' : 'post-poll-radio'}/>
          <span style={{fontSize: 14, color: 'var(--ink)', flex: 1, textAlign: 'left'}}>{c.label}</span>
        </button>
      ))}
      <div className="post-poll-foot">
        <button className="post-poll-vote-btn" disabled={picked.size === 0} onClick={submit}>
          {poll.multi && picked.size > 1 ? `Vote · ${picked.size} selected` : 'Vote'}
        </button>
        <button className="post-poll-results-link">View results →</button>
        <span style={{marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--muted)'}}>
          {poll.endsIn ? `${poll.endsIn} left` : ''} · {total} {total === 1 ? 'vote' : 'votes'}
        </span>
      </div>
    </div>
  );
}

Object.assign(window, {
  PhotoGrid, VideoAttachment, AudioAttachment,
  CompactAudio, MediaHeroStrip, MediaStripThumb, MediaStripKindBadge,
  AttachmentLightbox, AttachmentLightboxHost,
  openLightbox,
  PollAttachment,
  parseDur, fmtDur,
});
