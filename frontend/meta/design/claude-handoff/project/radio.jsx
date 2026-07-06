/* global React, I, VaporBanner */

const RADIO_ALBUMS = [
  {
    id: 'modem-hymns',
    title: 'Modem Hymns',
    artist: 'static.gif',
    year: '2024',
    genre: 'Chiptune',
    license: 'CC BY 4.0',
    coverInitial: 'M',
    coverGrad: 'linear-gradient(135deg, #2a6f8a 0%, #7dc4be 55%, #e0b97a 100%)',
    tint: '#7dc4be',
    tracks: [
      { t: '56k handshake', d: '2:14' },
      { t: 'BBS reverie', d: '3:48' },
      { t: 'floppy boot loop', d: '1:52' },
      { t: 'ascii sunrise', d: '4:21' },
      { t: 'sysop\u2019s lullaby', d: '5:06' },
      { t: 'phosphor screen', d: '3:12' },
      { t: 'end of file', d: '2:44' },
    ],
  },
  {
    id: 'plaza-fm',
    title: 'Plaza FM',
    artist: 'Vapor Garden Collective',
    year: '2023',
    genre: 'Vaporwave',
    license: 'CC0 — Public domain',
    coverInitial: 'P',
    coverGrad: 'linear-gradient(135deg, #e7a8c9 0%, #a48bd9 60%, #6e4f9e 100%)',
    tint: '#e7a8c9',
    tracks: [
      { t: 'pink marble', d: '4:12' },
      { t: 'roman bust 2/4', d: '3:55' },
      { t: 'mall dream', d: '6:08' },
      { t: 'cassette tape', d: '4:44' },
      { t: 'slow fountain', d: '5:30' },
      { t: 'palm-court muzak', d: '4:02' },
    ],
  },
  {
    id: 'outer-drive',
    title: 'Outer Drive',
    artist: 'neon.cassette',
    year: '2025',
    genre: 'Retrowave',
    license: 'CC BY-NC 4.0',
    coverInitial: 'O',
    coverGrad: 'linear-gradient(135deg, #1a1538 0%, #6e4f9e 45%, #e7a8c9 100%)',
    tint: '#a48bd9',
    tracks: [
      { t: 'coastline 1986', d: '4:48' },
      { t: 'highway static', d: '3:22' },
      { t: 'pacific hour', d: '5:14' },
      { t: 'rain on glass', d: '4:02' },
      { t: 'slow synth', d: '6:28' },
      { t: 'last exit', d: '3:56' },
    ],
  },
  {
    id: 'garden-hours',
    title: 'Garden Hours',
    artist: 'warm.process',
    year: '2024',
    genre: 'Ambient',
    license: 'CC BY 4.0',
    coverInitial: 'G',
    coverGrad: 'linear-gradient(135deg, #a8d5b1 0%, #e0b97a 50%, #d68b8b 100%)',
    tint: '#a8d5b1',
    tracks: [
      { t: 'first light', d: '7:14' },
      { t: 'tea & modems', d: '5:30' },
      { t: 'patch cable', d: '4:48' },
      { t: 'afternoon drift', d: '8:22' },
      { t: 'garden closed', d: '6:04' },
    ],
  },
];

function parseDuration(s) { const [m, sec] = s.split(':').map(Number); return m * 60 + sec; }
function formatDuration(t) { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }

function Radio({ inline }) {
  const [open, setOpen] = React.useState(false);
  const [visible, setVisible] = React.useState(() => localStorage.getItem('pn-radio-hidden') !== '1');
  const [albumId, setAlbumId] = React.useState('outer-drive');
  const [trackIdx, setTrackIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [volume, setVolume] = React.useState(0.7);
  const [view, setView] = React.useState('now'); // now | albums

  const album = RADIO_ALBUMS.find(a => a.id === albumId) || RADIO_ALBUMS[0];
  const track = album.tracks[trackIdx] || album.tracks[0];
  const totalSec = parseDuration(track.d);

  React.useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress(p => {
        const next = p + 0.4 / totalSec;
        if (next >= 1) {
          // advance track
          setTrackIdx(i => (i + 1) % album.tracks.length);
          return 0;
        }
        return next;
      });
    }, 400);
    return () => clearInterval(t);
  }, [playing, totalSec, album.tracks.length]);

  // reset progress when track changes
  React.useEffect(() => { setProgress(0); }, [trackIdx, albumId]);

  const elapsed = formatDuration(totalSec * progress);
  const togglePlay = () => setPlaying(p => !p);
  const next = () => setTrackIdx(i => (i + 1) % album.tracks.length);
  const prev = () => setTrackIdx(i => (i - 1 + album.tracks.length) % album.tracks.length);

  const pickAlbum = (id) => {
    setAlbumId(id);
    setTrackIdx(0);
    setPlaying(true);
    setView('now');
  };

  React.useEffect(() => {
    document.body.classList.toggle('pn-radio-playing', playing);
    window.dispatchEvent(new CustomEvent('pn-now-playing', {
      detail: {
        playing,
        track: { t: track.t, d: track.d },
        album: {
          title: album.title,
          artist: album.artist,
          year: album.year,
          tint: album.tint,
          genre: album.genre,
        },
      },
    }));
  }, [playing, track.t, track.d, album.title, album.artist, album.year, album.tint, album.genre]);

  if (!visible) {
    return (
      <button className="radio-revive" onClick={() => { setVisible(true); localStorage.removeItem('pn-radio-hidden'); }} title="Show radio">
        <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14}}><path d="M4 11h16v9H4zM7 7l11-3M16 15h.01M9 16a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    );
  }

  return (
    <div className={"radio " + (inline ? 'radio-inline ' : '') + (open ? 'open' : '')} style={{['--tint']: album.tint}}>
      {/* Compact bar */}
      <div className="radio-bar">
        <button className={"radio-cover-sm " + (playing ? 'playing' : '')} style={{background: album.coverGrad}} onClick={() => setOpen(o => !o)} aria-label="Open radio">
          <span className="radio-cover-init">{album.coverInitial}</span>
          {playing && <span className="radio-eq"><span></span><span></span><span></span><span></span></span>}
        </button>
        <div className="radio-bar-body" onClick={() => setOpen(o => !o)}>
          <div className="radio-bar-eyebrow">
            <span className="radio-live-dot"></span>
            <span>PN.fm · {album.genre}</span>
          </div>
          <div className="radio-bar-title">{track.t}</div>
        </div>
        <button className="radio-bar-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 13, height: 13}}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 13, height: 13, marginLeft: 1}}><path d="M7 5l12 7-12 7V5z"/></svg>
          )}
        </button>
        <button className="radio-bar-btn radio-bar-skip" onClick={next} aria-label="Next">
          <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 11, height: 11}}><path d="M5 5l9 7-9 7V5zM16 5h2v14h-2z"/></svg>
        </button>
        <button className="radio-bar-btn radio-bar-chev" onClick={() => setOpen(o => !o)} aria-label="Expand">
          <svg viewBox="0 0 24 24" fill="none" style={{width: 11, height: 11, transform: open ? 'rotate(180deg)' : ''}}><path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="radio-bar-progress"><span style={{width: (progress * 100) + '%'}}></span></div>
      </div>

      {open && (
        <div className="radio-panel">
          <div className="radio-tabs">
            <button className={"radio-tab " + (view === 'now' ? 'active' : '')} onClick={() => setView('now')}>Now playing</button>
            <button className={"radio-tab " + (view === 'albums' ? 'active' : '')} onClick={() => setView('albums')}>Albums <span className="radio-tab-c">{RADIO_ALBUMS.length}</span></button>
            <button className="radio-tab-x" onClick={() => { setVisible(false); localStorage.setItem('pn-radio-hidden', '1'); setOpen(false); }} title="Hide radio">
              <svg viewBox="0 0 24 24" fill="none" style={{width: 13, height: 13}}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>

          {view === 'now' && (
            <div className="radio-now">
              <div className="radio-now-head">
                <div className="radio-cover-lg" style={{background: album.coverGrad}}>
                  <span className="radio-cover-lg-init">{album.coverInitial}</span>
                  <div className={"radio-disc-lg " + (playing ? 'spin' : '')}><span></span></div>
                </div>
                <div className="radio-now-meta">
                  <div className="radio-now-eye">
                    <span className="radio-eye-dot"></span>
                    <span>PN.fm · server radio · {album.genre}</span>
                  </div>
                  <div className="radio-now-track">{track.t}</div>
                  <div className="radio-now-album">{album.title} <span>·</span> {album.artist} <span>·</span> {album.year}</div>
                  <div className="radio-now-license">
                    <svg viewBox="0 0 24 24" fill="none" style={{width: 11, height: 11}}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4"/><path d="M9 10a3 3 0 116 0M9 14a3 3 0 106 0" stroke="currentColor" strokeWidth="1.4"/></svg>
                    <span>{album.license} · free to play, free to share</span>
                  </div>
                </div>
              </div>

              <div className="radio-scrub-row">
                <span className="radio-time">{elapsed}</span>
                <div className="radio-scrub">
                  <div className="radio-scrub-bar"><div className="radio-scrub-fill" style={{width: (progress * 100) + '%'}}></div></div>
                </div>
                <span className="radio-time radio-time-r">{track.d}</span>
              </div>

              <div className="radio-transport">
                <button className="radio-tx" title="Shuffle">
                  <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14}}><path d="M16 3h5v5M21 3l-7 7M16 21h5v-5M21 21l-7-7M3 5l6 6M3 19l6-6 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="radio-tx" onClick={prev}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 14, height: 14}}><path d="M19 5l-9 7 9 7V5zM6 5h2v14H6z"/></svg>
                </button>
                <button className="radio-tx radio-tx-play" onClick={togglePlay}>
                  {playing ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 18, height: 18}}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 18, height: 18, marginLeft: 2}}><path d="M7 5l12 7-12 7V5z"/></svg>
                  )}
                </button>
                <button className="radio-tx" onClick={next}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 14, height: 14}}><path d="M5 5l9 7-9 7V5zM16 5h2v14h-2z"/></svg>
                </button>
                <button className="radio-tx" title="Loop">
                  <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14}}><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>

              <div className="radio-vol-row">
                <svg viewBox="0 0 24 24" fill="none" style={{width: 13, height: 13, color: 'var(--muted)'}}><path d="M11 5L6 9H3v6h3l5 4V5zM15 9a4 4 0 010 6M18 6a8 8 0 010 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="radio-vol"/>
                <span className="radio-vol-l">{Math.round(volume * 100)}</span>
              </div>

              <div className="radio-tracklist">
                <div className="radio-tracklist-h">
                  <span>Album · {album.title}</span>
                  <span className="radio-tracklist-c">{album.tracks.length} tracks</span>
                </div>
                {album.tracks.map((tr, i) => (
                  <button key={i} className={"radio-track " + (i === trackIdx ? 'cur' : '')} onClick={() => { setTrackIdx(i); setPlaying(true); }}>
                    <span className="radio-track-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="radio-track-t">{tr.t}</span>
                    {i === trackIdx && playing ? (
                      <span className="radio-eq sm"><span></span><span></span><span></span></span>
                    ) : null}
                    <span className="radio-track-d">{tr.d}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'albums' && (
            <div className="radio-albums">
              <div className="radio-albums-head">
                Curated by your instance · all tracks licensed for free play
              </div>
              {RADIO_ALBUMS.map(a => (
                <button key={a.id} className={"radio-album " + (a.id === albumId ? 'sel' : '')} onClick={() => pickAlbum(a.id)}>
                  <div className="radio-album-cv" style={{background: a.coverGrad}}>
                    <span>{a.coverInitial}</span>
                  </div>
                  <div className="radio-album-meta">
                    <div className="radio-album-t">{a.title}</div>
                    <div className="radio-album-by">{a.artist} <span>·</span> {a.year}</div>
                    <div className="radio-album-tags">
                      <span className="radio-album-genre" style={{color: a.tint}}>{a.genre}</span>
                      <span className="radio-album-dot"></span>
                      <span className="radio-album-lic">{a.license}</span>
                      <span className="radio-album-dot"></span>
                      <span>{a.tracks.length} tracks</span>
                    </div>
                  </div>
                  <div className="radio-album-play">
                    {a.id === albumId && playing ? (
                      <span className="radio-eq sm"><span></span><span></span><span></span></span>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{width: 14, height: 14, marginLeft: 2}}><path d="M7 5l12 7-12 7V5z"/></svg>
                    )}
                  </div>
                </button>
              ))}
              <div className="radio-albums-foot">
                Tracks are loaded from your instance. <a href="#">Submit one →</a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.Radio = Radio;

// Initial state for subscribers that mount before Radio dispatches
window.__pnNowPlaying = window.__pnNowPlaying || { playing: false };
window.addEventListener('pn-now-playing', (e) => { window.__pnNowPlaying = e.detail; });

window.useNowPlaying = function useNowPlaying() {
  const [np, setNp] = React.useState(window.__pnNowPlaying);
  React.useEffect(() => {
    const h = (e) => setNp(e.detail);
    window.addEventListener('pn-now-playing', h);
    return () => window.removeEventListener('pn-now-playing', h);
  }, []);
  return np;
};

window.NowPlayingLine = function NowPlayingLine({ compact, hidePausedLabel }) {
  const np = window.useNowPlaying();
  if (!np || !np.track) return null;
  const cls = "now-playing-line " + (np.playing ? 'playing' : 'paused') + (compact ? ' compact' : '');
  return (
    <div className={cls} style={np.album && np.album.tint ? { '--np-tint': np.album.tint } : undefined}>
      <span className="np-glyph">
        {np.playing ? (
          <span className="np-eq" aria-hidden="true"><span></span><span></span><span></span></span>
        ) : (
          <svg viewBox="0 0 12 12" style={{width: 9, height: 9}} aria-hidden="true">
            <rect x="3" y="2" width="2" height="8" fill="currentColor"/>
            <rect x="7" y="2" width="2" height="8" fill="currentColor"/>
          </svg>
        )}
      </span>
      <span className="np-text">
        <span className="np-track">{np.track.t || np.track.title}</span>
        <span className="np-sep"> · </span>
        <span className="np-artist">{np.album.artist}</span>
      </span>
      {!np.playing && !hidePausedLabel && <span className="np-state">paused</span>}
    </div>
  );
};
