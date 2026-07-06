/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState, useRef, useEffect } = React;

// ============================================================
// Pictochat variants — three federation models, three aesthetics
// ============================================================

// ---------- Hand-drawn doodle library ----------
// Single-stroke SVG, inherits currentColor. Used to fake "people just
// drew this in the chat" without baking in dummy raster images.
const D = {
  smiley: ({ s = 60 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 6 C50 6 54 26 54 30 C54 48 42 54 30 54 C12 54 6 42 6 30 C6 12 16 6 30 6 Z"/>
      <circle cx="22" cy="25" r="1.6" fill="currentColor" stroke="none"/>
      <circle cx="38" cy="24" r="1.6" fill="currentColor" stroke="none"/>
      <path d="M18 36 Q22 44 30 44 Q38 44 42 36"/>
    </svg>
  ),
  heart: ({ s = 50 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 50 C14 38 11 28 11 21 C11 13 17 11 22 12 C26 13 29 16 30 19 C31 16 34 13 38 12 C43 11 49 13 49 21 C49 28 46 38 30 50 Z"/>
    </svg>
  ),
  sun: ({ s = 50 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="30" cy="30" r="10"/>
      <path d="M30 8 V14 M30 46 V52 M8 30 H14 M46 30 H52 M14 14 L18 18 M42 18 L46 14 M14 46 L18 42 M42 42 L46 46"/>
    </svg>
  ),
  fish: ({ s = 50 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 30 Q22 16 38 30 Q22 44 8 30 Z M38 30 L52 22 L50 30 L52 38 Z"/>
      <circle cx="14" cy="28" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
  star: ({ s = 50 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 7 L37 23 L54 25 L41 36 L45 53 L30 44 L15 53 L19 36 L6 25 L23 23 Z"/>
    </svg>
  ),
  house: ({ s = 56 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 32 L30 12 L52 32 M14 30 V52 H46 V30 M26 52 V42 H34 V52"/>
    </svg>
  ),
  coffee: ({ s = 56 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 26 L12 48 Q12 54 18 54 L36 54 Q42 54 42 48 L42 26 Z"/>
      <path d="M42 32 Q52 32 52 40 Q52 48 42 48"/>
      <path d="M20 18 Q23 12 20 6 M28 18 Q31 12 28 6 M36 18 Q39 12 36 6"/>
    </svg>
  ),
  cat: ({ s = 56 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 20 L10 8 L22 16 M46 20 L50 8 L38 16"/>
      <path d="M14 18 Q8 32 14 44 Q22 54 30 54 Q38 54 46 44 Q52 32 46 18"/>
      <circle cx="23" cy="32" r="1.6" fill="currentColor" stroke="none"/>
      <circle cx="37" cy="32" r="1.6" fill="currentColor" stroke="none"/>
      <path d="M28 40 L30 43 L32 40"/>
      <path d="M22 42 L16 44 M22 44 L18 47 M38 42 L44 44 M38 44 L42 47"/>
    </svg>
  ),
  cloud: ({ s = 56 }) => (
    <svg viewBox="0 0 70 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 42 Q6 42 6 32 Q6 22 18 22 Q20 12 32 12 Q44 12 46 24 Q60 24 60 34 Q60 42 50 42 Z"/>
    </svg>
  ),
  wave: ({ s = 80 }) => (
    <svg viewBox="0 0 80 24" width={s} height={Math.round(s * 24 / 80)} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12 Q11 4 19 12 T35 12 T51 12 T67 12 T83 12"/>
    </svg>
  ),
  arrow: ({ s = 60 }) => (
    <svg viewBox="0 0 60 30" width={s} height={Math.round(s * 30 / 60)} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15 L48 15 M40 8 L48 15 L40 22"/>
    </svg>
  ),
  hi: ({ s = 60 }) => (
    <svg viewBox="0 0 60 40" width={s} height={Math.round(s * 40 / 60)} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 8 V32 M8 20 H22 M22 8 V32"/>
      <path d="M34 8 V32 M30 12 L38 12 M30 28 L38 28"/>
    </svg>
  ),
  bug: ({ s = 56 }) => (
    <svg viewBox="0 0 60 60" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="30" cy="36" rx="14" ry="18"/>
      <path d="M30 22 V18 M26 16 L24 12 M34 16 L36 12"/>
      <path d="M16 30 L8 26 M16 38 L8 38 M16 46 L8 50 M44 30 L52 26 M44 38 L52 38 M44 46 L52 50"/>
      <circle cx="26" cy="26" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="34" cy="26" r="1.2" fill="currentColor" stroke="none"/>
    </svg>
  ),
};

// ============================================================
// Variant 1 — "PN.DS" — DS clamshell homage
// ============================================================
function Variant_DS() {
  return (
    <div style={s1.root}>
      <div style={s1.pageHead}>
        <div style={s1.kicker}>OPTION 01 · LOVE LETTER</div>
        <div style={s1.title}>PN.DS</div>
        <div style={s1.sub}>Four fixed rooms (A · B · C · D), instance-local. Pure PictoChat homage — clamshell device, dual screens, stylus.</div>
      </div>

      <div style={s1.device}>
        {/* Top screen — message log */}
        <div style={s1.screen}>
          <div style={s1.screenBezel}>
            <div style={s1.screenInner}>
              <div style={s1.roomBar}>
                <span style={s1.roomLetter}>A</span>
                <span style={s1.roomMembers}>
                  <span style={s1.dot}/><span style={s1.dot}/><span style={s1.dot}/><span style={s1.dot}/><span style={s1.dot}/>
                  <span style={s1.roomCount}>5/16</span>
                </span>
                <span style={s1.roomInstance}>pleromanet.social</span>
              </div>
              <div style={s1.log}>
                <DSMsg color="#d3493b" nick="emi" text="just opened this room" doodle={<D.smiley s={36}/>}/>
                <DSMsg color="#3b6ed3" nick="kestrel" text="anyone home?" doodle={<D.cat s={40}/>}/>
                <DSMsg color="#3b9d4d" nick="orbit" text="🐟" doodle={<D.fish s={40}/>}/>
                <DSMsg color="#a04dba" nick="mossy" text="morning" doodle={<D.sun s={36}/>} mine={false}/>
                <DSMsg color="#d3493b" nick="emi" text="brb tea" doodle={<D.coffee s={36}/>}/>
              </div>
            </div>
          </div>
        </div>

        {/* Hinge */}
        <div style={s1.hinge}>
          <div style={s1.hingePill}/>
          <div style={s1.hingeLed}><span/></div>
        </div>

        {/* Bottom screen — drawing pad */}
        <div style={s1.screen}>
          <div style={s1.screenBezel}>
            <div style={s1.screenInner}>
              <div style={s1.padHead}>
                <span style={s1.padNick}><span style={{...s1.swatch, background: '#d3493b'}}/> emi</span>
                <span style={s1.padTime}>send ↵</span>
              </div>
              <div style={s1.pad}>
                {/* The user's in-progress doodle */}
                <svg viewBox="0 0 320 130" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
                     style={{display: 'block'}}>
                  {/* Faint grid */}
                  <defs>
                    <pattern id="ds-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                      <path d="M12 0H0V12" fill="none" stroke="#d8d3c0" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="320" height="130" fill="url(#ds-grid)"/>
                  {/* Typed text overlay (PictoChat had this) */}
                  <text x="14" y="28" fontFamily="ui-monospace, Menlo, monospace" fontSize="14" fill="#1a1538">hi everyone</text>
                  {/* Hand-drawn flourish next to the text */}
                  <g transform="translate(140,16)" fill="none" stroke="#d3493b" strokeWidth="2.6" strokeLinecap="round">
                    <path d="M2 12 Q10 2 18 12 T34 12"/>
                    <path d="M40 6 L52 22 M52 6 L40 22"/>
                  </g>
                  {/* Bigger sketch below */}
                  <g transform="translate(20,46) scale(1.4)" fill="none" stroke="#d3493b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="22" cy="22" r="18"/>
                    <circle cx="16" cy="18" r="1.2" fill="#d3493b"/>
                    <circle cx="28" cy="18" r="1.2" fill="#d3493b"/>
                    <path d="M14 28 Q22 36 30 28"/>
                  </g>
                  <g transform="translate(140,46) scale(1.4)" fill="none" stroke="#d3493b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 30 L18 14 L34 30 M6 28 V42 H30 V28 M16 42 V34 H22 V42"/>
                  </g>
                  <g transform="translate(230,52)" fill="none" stroke="#d3493b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 24 Q14 8 24 24 T44 24"/>
                    <path d="M48 14 L56 14 L56 22"/>
                  </g>
                </svg>
              </div>
              <div style={s1.toolRow}>
                <DSTool active>✎</DSTool>
                <DSTool>◯</DSTool>
                <DSTool>▢</DSTool>
                <DSTool>┃</DSTool>
                <DSTool>A</DSTool>
                <DSTool>⌫</DSTool>
                <div style={s1.toolSep}/>
                <div style={s1.weightRow}>
                  <span style={{...s1.weight, width: 3, height: 3}}/>
                  <span style={{...s1.weight, width: 5, height: 5}}/>
                  <span style={{...s1.weight, width: 7, height: 7, background: '#d3493b'}}/>
                  <span style={{...s1.weight, width: 9, height: 9}}/>
                </div>
                <div style={s1.toolSep}/>
                <div style={s1.colorRow}>
                  {['#1a1538','#d3493b','#e0b97a','#3b9d4d','#3b6ed3','#a04dba'].map(c => (
                    <span key={c} style={{...s1.colorChip, background: c, borderColor: c === '#d3493b' ? '#1a1538' : 'transparent'}}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower body chrome — room tabs + speakers + d-pad hints */}
        <div style={s1.lowerBody}>
          <div style={s1.speakerL}/>
          <div style={s1.roomTabs}>
            {['A','B','C','D'].map((r, i) => (
              <button key={r} style={{...s1.roomTab, ...(i === 0 ? s1.roomTabActive : {})}}>{r}</button>
            ))}
          </div>
          <div style={s1.speakerR}/>
        </div>
      </div>

      <div style={s1.captionStrip}>
        <div style={s1.capRow}><span style={s1.capKey}>Model</span><span>4 fixed rooms (A·B·C·D), max 16 per room</span></div>
        <div style={s1.capRow}><span style={s1.capKey}>Federation</span><span>Instance-local. Your <code>pleromanet.social</code> has its own A·B·C·D, separate from <code>kolektiva.social</code>.</span></div>
        <div style={s1.capRow}><span style={s1.capKey}>Ephemerality</span><span>Messages disappear when you leave the room.</span></div>
        <div style={s1.capRow}><span style={s1.capKey}>Best for</span><span>Same-instance hanging out. Strongest sense of place.</span></div>
      </div>
    </div>
  );
}

function DSMsg({ color, nick, text, doodle, mine }) {
  return (
    <div style={{...s1.msg, ...(mine ? s1.msgMine : {})}}>
      <div style={s1.msgHead}>
        <span style={{...s1.msgNick, color}}>{nick}</span>
      </div>
      <div style={s1.msgBubble}>
        <div style={{...s1.msgText, color}}>{text}</div>
        <div style={{...s1.msgDoodle, color}}>{doodle}</div>
      </div>
    </div>
  );
}

function DSTool({ children, active }) {
  return (
    <button style={{...s1.tool, ...(active ? s1.toolActive : {})}}>{children}</button>
  );
}

const s1 = {
  root: { width: 600, padding: 30, background: '#f3ecd9', fontFamily: 'ui-monospace, Menlo, monospace', color: '#1a1538', display: 'flex', flexDirection: 'column', gap: 20 },
  pageHead: { display: 'flex', flexDirection: 'column', gap: 4 },
  kicker: { fontSize: 10, letterSpacing: 0.18 * 16 / 10 + 'em', color: '#a04dba', textTransform: 'uppercase' },
  title: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 38, lineHeight: 1, fontWeight: 500, letterSpacing: -0.02 * 38 + 'px' },
  sub: { fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: '#5a4a3a', maxWidth: 520, lineHeight: 1.5 },
  device: { background: '#2a2418', borderRadius: 14, padding: 14, boxShadow: '0 30px 60px -20px rgba(20,15,5,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' },
  screen: { padding: '0 6px' },
  screenBezel: { background: '#0c0a06', padding: 6, borderRadius: 4 },
  screenInner: { background: '#e8e2cc', color: '#1a1538', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  roomBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: '#d8d0b4', borderBottom: '1px solid #b0a682', fontFamily: '"Press Start 2P", ui-monospace, monospace', fontSize: 10 },
  roomLetter: { fontFamily: '"Cormorant Garamond", serif', fontSize: 18, lineHeight: 1, color: '#a04dba', fontWeight: 600 },
  roomMembers: { display: 'flex', alignItems: 'center', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: '50%', background: '#5a4a3a' },
  roomCount: { fontSize: 9, color: '#5a4a3a', marginLeft: 4 },
  roomInstance: { marginLeft: 'auto', fontSize: 9, color: '#7a6a4a' },
  log: { padding: 8, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 180 },
  msg: { display: 'flex', flexDirection: 'column', gap: 1 },
  msgMine: { alignItems: 'flex-end' },
  msgHead: { fontSize: 9, fontFamily: 'ui-monospace, monospace' },
  msgNick: { fontWeight: 700, letterSpacing: 0.06 + 'em' },
  msgBubble: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid #b0a682', borderRadius: 6, padding: '4px 8px' },
  msgText: { fontSize: 11, fontWeight: 600, fontFamily: 'ui-monospace, monospace' },
  msgDoodle: { lineHeight: 0 },
  hinge: { height: 12, margin: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  hingePill: { width: 60, height: 4, background: '#1a160a', borderRadius: 2, opacity: 0.6 },
  hingeLed: { position: 'absolute', right: 14, display: 'flex', alignItems: 'center', gap: 4 },
  pad: { background: '#fbf6e6', height: 130, borderTop: '1px solid #b0a682', borderBottom: '1px solid #b0a682', overflow: 'hidden' },
  padHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 8px', fontSize: 10 },
  padNick: { display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'ui-monospace, monospace', fontWeight: 700 },
  swatch: { width: 8, height: 8, display: 'inline-block', borderRadius: 1 },
  padTime: { color: '#7a6a4a', fontSize: 9 },
  toolRow: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#d8d0b4' },
  tool: { width: 22, height: 22, display: 'grid', placeItems: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 12, background: '#e8e2cc', border: '1px solid #b0a682', borderRadius: 2, color: '#1a1538' },
  toolActive: { background: '#1a1538', color: '#e8e2cc' },
  toolSep: { width: 1, height: 14, background: '#b0a682' },
  weightRow: { display: 'flex', alignItems: 'center', gap: 5 },
  weight: { display: 'inline-block', borderRadius: '50%', background: '#1a1538' },
  colorRow: { display: 'flex', alignItems: 'center', gap: 3 },
  colorChip: { width: 12, height: 12, border: '1.5px solid transparent', borderRadius: 2 },
  lowerBody: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 12px 4px', gap: 12 },
  speakerL: { width: 30, height: 30, background: 'repeating-linear-gradient(0deg, transparent 0 2px, #0c0a06 2px 3px)', borderRadius: 4, opacity: 0.7 },
  speakerR: { width: 30, height: 30, background: 'repeating-linear-gradient(0deg, transparent 0 2px, #0c0a06 2px 3px)', borderRadius: 4, opacity: 0.7 },
  roomTabs: { display: 'flex', gap: 4 },
  roomTab: { width: 36, height: 28, background: '#1a160a', color: '#7a6a4a', border: '1px solid #3a3220', borderRadius: 4, fontFamily: '"Cormorant Garamond", serif', fontSize: 18, fontWeight: 600 },
  roomTabActive: { background: '#a04dba', color: '#f3ecd9', borderColor: '#a04dba' },
  captionStrip: { padding: 14, background: '#1a1538', color: '#e8e2cc', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11.5, lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 4 },
  capRow: { display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12 },
  capKey: { fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: 0.14 + 'em', textTransform: 'uppercase', color: '#a48bd9' },
};

// ============================================================
// Variant 2 — "PN.chat" — PleromaNet-native federated rooms
// ============================================================
function Variant_PN() {
  return (
    <div style={s2.root}>
      <div style={s2.pageHead}>
        <div style={s2.kicker}>OPTION 02 · NATIVE</div>
        <div style={s2.title}>PN.chat</div>
        <div style={s2.sub}>Hashtag-scoped rooms, federated. Lives inside the existing PleromaNet shell. Doodle-bubbles in a regular feed.</div>
      </div>

      <div style={s2.card}>
        <div style={s2.cardHead}>
          <div style={s2.roomTitleWrap}>
            <div style={s2.roomTitle}>#picto-cafe</div>
            <div style={s2.roomMeta}>
              <span>federated room</span><span style={s2.bullet}>·</span>
              <span>12 / ∞ here</span><span style={s2.bullet}>·</span>
              <span>quiet · 4m last activity</span>
            </div>
          </div>
          <div style={s2.federationDots}>
            <span style={{...s2.fdot, background: '#a48bd9'}} title="pleromanet.social"/>
            <span style={{...s2.fdot, background: '#7dc4be'}} title="kolektiva.social"/>
            <span style={{...s2.fdot, background: '#e0b97a'}} title="retro.social"/>
            <span style={{...s2.fdot, background: '#e7a8c9'}} title="garden.cafe"/>
            <span style={s2.fdotMore}>+3</span>
          </div>
          <button style={s2.leaveBtn}>Leave room</button>
        </div>

        <div style={s2.bubbles}>
          <PNBubble nick="mossy" handle="@mossy@garden.cafe" tint="#7a8c5a" time="6m"
                    text="anyone awake on this side of the federation?"
                    doodle={<D.cat s={64}/>} doodleTint="#7a8c5a"/>

          <PNBubble nick="orbit" handle="@orbit@spacebear.net" tint="#a48bd9" time="5m"
                    text="" doodle={<D.fish s={70}/>} doodleTint="#a48bd9" bigDoodle/>

          <PNBubble nick="emi" handle="@emichan@kolektiva.social" tint="#d3493b" time="5m"
                    text="reporting in ☕" doodle={<D.coffee s={60}/>} doodleTint="#d3493b"/>

          <PNBubble nick="datagram" handle="@datagram@retro.social" tint="#e0b97a" time="3m"
                    text="a tiny bug i drew at the train station →"
                    doodle={<D.bug s={66}/>} doodleTint="#5a4a3a"/>
        </div>

        <div style={s2.composer}>
          <div style={s2.composerAv}>
            <span style={s2.composerAvInit}>d</span>
          </div>
          <div style={s2.composerBody}>
            <div style={s2.composerCanvas}>
              <svg viewBox="0 0 320 80" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{display: 'block'}}>
                <defs>
                  <pattern id="pn-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.6" fill="#c9c4b3"/>
                  </pattern>
                </defs>
                <rect width="320" height="80" fill="url(#pn-grid)"/>
                <g transform="translate(18,12)" fill="none" stroke="#6b52a3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="26" cy="26" r="9"/>
                  <path d="M26 8 V14 M26 38 V44 M8 26 H14 M38 26 H44 M12 12 L16 16 M36 16 L40 12 M12 40 L16 36 M36 36 L40 40"/>
                </g>
                <text x="80" y="32" fontFamily="'Cormorant Garamond', serif" fontStyle="italic" fontSize="20" fill="#1f2347">morning</text>
                <text x="80" y="56" fontFamily="Inter, system-ui, sans-serif" fontSize="13" fill="#3a3f63">a bit early for the rest of the cafe.</text>
              </svg>
            </div>
            <div style={s2.composerTools}>
              <CTool active>✎</CTool>
              <CTool>A</CTool>
              <CTool>◯</CTool>
              <CTool>⌫</CTool>
              <div style={s2.composerColors}>
                {['#1f2347','#a48bd9','#6b52a3','#d68b8b','#7dc4be','#e0b97a'].map((c, i) => (
                  <span key={c} style={{...s2.cChip, background: c, ...(i === 2 ? s2.cChipActive : {})}}/>
                ))}
              </div>
              <span style={{flex: 1}}/>
              <span style={s2.composerHint}>320 × 80 · ↵ send</span>
              <button style={s2.sendBtn}>Send</button>
            </div>
          </div>
        </div>

        <div style={s2.roomSwitch}>
          <span style={s2.roomSwitchLabel}>Rooms you're in</span>
          <div style={s2.roomChips}>
            <span style={{...s2.roomChip, ...s2.roomChipActive}}>#picto-cafe</span>
            <span style={s2.roomChip}>#picto-night</span>
            <span style={s2.roomChip}>#picto-yowls <span style={s2.roomChipBadge}>3</span></span>
            <span style={s2.roomChip}>#picto-garden</span>
            <span style={s2.roomChipNew}>+ join a room</span>
          </div>
        </div>
      </div>

      <div style={s2.captionStrip}>
        <div style={s2.capRow}><span style={s2.capKey}>Model</span><span>Hashtag-scoped rooms. Anyone can start one, anyone can join.</span></div>
        <div style={s2.capRow}><span style={s2.capKey}>Federation</span><span>Federated. The room is "the set of fediverse accounts subscribed to that hashtag."</span></div>
        <div style={s2.capRow}><span style={s2.capKey}>Ephemerality</span><span>Per-room setting. Default 24h scrollback, then auto-prune.</span></div>
        <div style={s2.capRow}><span style={s2.capKey}>Best for</span><span>Cross-instance community. Lives inside the existing app, no new chrome to learn.</span></div>
      </div>
    </div>
  );
}

function PNBubble({ nick, handle, tint, time, text, doodle, doodleTint, bigDoodle }) {
  return (
    <div style={s2.bubble}>
      <div style={{...s2.bubbleAv, background: `linear-gradient(135deg, ${tint} 0%, ${tint}88 100%)`}}>
        <span style={s2.bubbleAvInit}>{nick[0]}</span>
      </div>
      <div style={s2.bubbleBody}>
        <div style={s2.bubbleHead}>
          <span style={{...s2.bubbleNick, color: tint}}>{nick}</span>
          <span style={s2.bubbleHandle}>{handle}</span>
          <span style={s2.bubbleTime}>{time}</span>
        </div>
        <div style={s2.bubbleCard}>
          {text && <div style={s2.bubbleText}>{text}</div>}
          <div style={{...s2.bubbleDoodle, color: doodleTint, marginLeft: text ? 'auto' : 0, ...(bigDoodle ? {marginTop: 4} : {})}}>{doodle}</div>
        </div>
      </div>
    </div>
  );
}

function CTool({ children, active }) {
  return <button style={{...s2.cTool, ...(active ? s2.cToolActive : {})}}>{children}</button>;
}

const s2 = {
  root: { width: 600, padding: 30, background: '#f5f1e8', fontFamily: 'Inter, system-ui, sans-serif', color: '#1f2347', display: 'flex', flexDirection: 'column', gap: 18 },
  pageHead: { display: 'flex', flexDirection: 'column', gap: 4 },
  kicker: { fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#6b52a3', textTransform: 'uppercase' },
  title: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 38, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.02em' },
  sub: { fontSize: 13, color: '#3a3f63', maxWidth: 520, lineHeight: 1.5 },
  card: { background: '#fbfaf3', border: '1px solid #e0dccf', borderRadius: 4, overflow: 'hidden' },
  cardHead: { display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderBottom: '1px solid #e0dccf', background: '#fdfbf6' },
  roomTitleWrap: { flex: 1, minWidth: 0 },
  roomTitle: { fontFamily: '"Cormorant Garamond", serif', fontSize: 22, lineHeight: 1, fontWeight: 500 },
  roomMeta: { fontSize: 11.5, color: '#7a7c95', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 },
  bullet: { color: '#c9c4b3' },
  federationDots: { display: 'flex', alignItems: 'center', gap: 4 },
  fdot: { width: 10, height: 10, borderRadius: '50%', boxShadow: '0 0 0 1.5px #fbfaf3' },
  fdotMore: { fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#7a7c95', marginLeft: 4 },
  leaveBtn: { padding: '5px 10px', fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#7a7c95', border: '1px solid #e0dccf', background: 'transparent', borderRadius: 2 },
  bubbles: { display: 'flex', flexDirection: 'column', padding: '4px 0' },
  bubble: { display: 'grid', gridTemplateColumns: '40px 1fr', gap: 12, padding: '10px 16px', borderBottom: '1px solid #e0dccf' },
  bubbleAv: { width: 40, height: 40, borderRadius: 4, display: 'grid', placeItems: 'center', color: 'white', fontFamily: '"Cormorant Garamond", serif', fontSize: 22, lineHeight: 1, fontStyle: 'italic' },
  bubbleAvInit: { textTransform: 'lowercase' },
  bubbleBody: { minWidth: 0 },
  bubbleHead: { display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 12, marginBottom: 4 },
  bubbleNick: { fontWeight: 600, fontSize: 13 },
  bubbleHandle: { color: '#9b9db1', fontFamily: 'ui-monospace, monospace', fontSize: 10.5 },
  bubbleTime: { marginLeft: 'auto', color: '#9b9db1', fontFamily: 'ui-monospace, monospace', fontSize: 10.5 },
  bubbleCard: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 12px', background: '#f5f1e8', border: '1px solid #e9e4d3', borderRadius: 4 },
  bubbleText: { fontSize: 13.5, lineHeight: 1.45, color: '#1f2347', flex: 1, minWidth: 0 },
  bubbleDoodle: { lineHeight: 0, flexShrink: 0 },
  composer: { display: 'grid', gridTemplateColumns: '40px 1fr', gap: 12, padding: '14px 16px 16px', background: '#fdfbf6', borderTop: '1px solid #e0dccf' },
  composerAv: { width: 40, height: 40, borderRadius: 4, background: 'linear-gradient(135deg, #1d1840, #533c7a, #d889a0)', display: 'grid', placeItems: 'center', color: 'white', fontFamily: '"Cormorant Garamond", serif', fontSize: 22, fontStyle: 'italic' },
  composerAvInit: {},
  composerBody: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 },
  composerCanvas: { background: '#fbfaf3', border: '1px solid #e0dccf', borderRadius: 4, overflow: 'hidden', height: 90 },
  composerTools: { display: 'flex', alignItems: 'center', gap: 5 },
  cTool: { width: 26, height: 26, display: 'grid', placeItems: 'center', fontFamily: 'ui-monospace, monospace', fontSize: 13, background: '#fbfaf3', border: '1px solid #e0dccf', borderRadius: 2, color: '#3a3f63' },
  cToolActive: { background: '#1f2347', color: '#fbfaf3', borderColor: '#1f2347' },
  composerColors: { display: 'flex', alignItems: 'center', gap: 3, marginLeft: 4 },
  cChip: { width: 14, height: 14, borderRadius: 2, border: '1.5px solid transparent' },
  cChipActive: { borderColor: '#1f2347' },
  composerHint: { fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#9b9db1' },
  sendBtn: { padding: '5px 14px', background: '#a48bd9', color: 'white', border: 'none', borderRadius: 2, fontWeight: 600, fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' },
  roomSwitch: { padding: '10px 16px 14px', background: '#fdfbf6', borderTop: '1px solid #e0dccf', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  roomSwitchLabel: { fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9b9db1' },
  roomChips: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  roomChip: { padding: '4px 10px', fontFamily: 'ui-monospace, monospace', fontSize: 11, background: '#f5f1e8', border: '1px solid #e0dccf', borderRadius: 2, color: '#3a3f63', display: 'inline-flex', alignItems: 'center', gap: 4 },
  roomChipActive: { background: '#e9e1f5', color: '#6b52a3', borderColor: '#a48bd9' },
  roomChipBadge: { background: '#a48bd9', color: 'white', borderRadius: 8, padding: '0 5px', fontSize: 9 },
  roomChipNew: { padding: '4px 10px', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#9b9db1', borderRadius: 2, border: '1px dashed #c9c4b3' },
  captionStrip: { padding: 14, background: '#1f2347', color: '#dcd1f0', fontSize: 11.5, lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 4 },
  capRow: { display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12 },
  capKey: { fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a48bd9' },
};

// ============================================================
// Variant 3 — "Atrium" — shared infinite canvas, no rooms
// ============================================================
function Variant_Atrium() {
  // Doodles scattered across a panoramic canvas, each tied to a "tile"
  // owned by an instance. You wander, you find drawings, you leave one.
  const sprites = [
    { x: 50, y: 80, color: '#a04dba', d: D.smiley, s: 56, by: '@orbit', t: 'just now' },
    { x: 200, y: 60, color: '#d3493b', d: D.fish, s: 50, by: '@emi', t: '2m' },
    { x: 340, y: 110, color: '#3b6ed3', d: D.cat, s: 64, by: '@kestrel', t: '4m' },
    { x: 460, y: 50, color: '#e0b97a', d: D.coffee, s: 56, by: '@mossy', t: '6m' },
    { x: 120, y: 220, color: '#3b9d4d', d: D.sun, s: 52, by: '@warm.process', t: '8m' },
    { x: 270, y: 200, color: '#7a8c5a', d: D.house, s: 56, by: '@datagram', t: '12m' },
    { x: 420, y: 230, color: '#a48bd9', d: D.star, s: 48, by: '@lumen', t: '15m' },
    { x: 80, y: 340, color: '#d68b8b', d: D.heart, s: 50, by: '@nyan', t: '22m' },
    { x: 220, y: 320, color: '#5a4a3a', d: D.bug, s: 56, by: '@datagram', t: '32m' },
    { x: 380, y: 360, color: '#3b6ed3', d: D.wave, s: 80, by: '@kestrel', t: '40m' },
    { x: 490, y: 320, color: '#a04dba', d: D.cloud, s: 60, by: '@dreambyte', t: '1h' },
    { x: 30, y: 200, color: '#e0b97a', d: D.hi, s: 56, by: '@signal', t: '1h' },
  ];

  return (
    <div style={s3.root}>
      <div style={s3.pageHead}>
        <div style={s3.kicker}>OPTION 03 · NOVEL</div>
        <div style={s3.title}>Atrium</div>
        <div style={s3.sub}>One shared canvas. No rooms — you wander, you find what people drew, you leave something where you stand.</div>
      </div>

      <div style={s3.canvas}>
        {/* Paper texture grid */}
        <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
          <defs>
            <pattern id="atrium-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="#c9c4b3"/>
            </pattern>
            <pattern id="atrium-major" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M200 0H0V200" fill="none" stroke="#dcd6c5" strokeWidth="0.6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#f3ecd9"/>
          <rect width="100%" height="100%" fill="url(#atrium-grid)"/>
          <rect width="100%" height="100%" fill="url(#atrium-major)"/>
        </svg>

        {/* Other cursors */}
        <div style={{...s3.cursor, left: 180, top: 280}}>
          <CursorGlyph color="#3b6ed3"/>
          <span style={{...s3.cursorLabel, background: '#3b6ed3'}}>kestrel</span>
        </div>
        <div style={{...s3.cursor, left: 410, top: 140}}>
          <CursorGlyph color="#a04dba"/>
          <span style={{...s3.cursorLabel, background: '#a04dba'}}>orbit</span>
        </div>

        {/* Your cursor, drawing in progress */}
        <div style={{...s3.cursor, left: 290, top: 280, zIndex: 5}}>
          <CursorGlyph color="#d3493b" you/>
          <span style={{...s3.cursorLabel, background: '#d3493b'}}>you</span>
        </div>
        <div style={{position: 'absolute', left: 300, top: 240, color: '#d3493b', opacity: 0.75}}>
          <D.smiley s={44}/>
        </div>

        {/* Scattered doodles */}
        {sprites.map((p, i) => {
          const Doodle = p.d;
          return (
            <div key={i} style={{...s3.sprite, left: p.x, top: p.y, color: p.color}}>
              <Doodle s={p.s}/>
              <div style={s3.spriteTag}>
                <span style={{...s3.spriteDot, background: p.color}}/>
                <span style={s3.spriteBy}>{p.by}</span>
                <span style={s3.spriteTime}>· {p.t}</span>
              </div>
            </div>
          );
        })}

        {/* Floating toolbar */}
        <div style={s3.toolbar}>
          <button style={{...s3.tbBtn, ...s3.tbBtnActive}} title="Pen">✎</button>
          <button style={s3.tbBtn} title="Eraser">⌫</button>
          <button style={s3.tbBtn} title="Move">✥</button>
          <div style={s3.tbSep}/>
          <div style={s3.tbColors}>
            {['#1a1538','#d3493b','#e0b97a','#3b9d4d','#3b6ed3','#a04dba'].map((c, i) => (
              <span key={c} style={{...s3.tbColor, background: c, ...(i === 1 ? s3.tbColorActive : {})}}/>
            ))}
          </div>
          <div style={s3.tbSep}/>
          <span style={s3.tbHint}>doodles fade after 24h</span>
        </div>

        {/* Minimap */}
        <div style={s3.minimap}>
          <div style={s3.minimapHead}>
            <span style={s3.minimapInstance}>pleromanet.social</span>
            <span style={s3.minimapNeighbors}>→ kolektiva.social</span>
          </div>
          <div style={s3.minimapBody}>
            <div style={s3.minimapTile}>
              {sprites.map((p, i) => (
                <span key={i} style={{position: 'absolute', left: (p.x / 580) * 100 + '%', top: (p.y / 400) * 100 + '%', width: 3, height: 3, borderRadius: '50%', background: p.color}}/>
              ))}
              <div style={s3.minimapViewport}/>
              <div style={s3.minimapYou}/>
            </div>
            <div style={s3.minimapTile2}><span style={s3.minimapLabel}>retro.social</span></div>
          </div>
          <div style={s3.minimapFoot}>your viewport · 42 doodles nearby</div>
        </div>
      </div>

      <div style={s3.captionStrip}>
        <div style={s3.capRow}><span style={s3.capKey}>Model</span><span>One spatial canvas per instance. No rooms — drawings exist at coordinates you wander to.</span></div>
        <div style={s3.capRow}><span style={s3.capKey}>Federation</span><span>Your instance's canvas tiles next to neighboring instances'. Cross the edge to visit. Each instance moderates its own.</span></div>
        <div style={s3.capRow}><span style={s3.capKey}>Ephemerality</span><span>Doodles fade after 24h. Place is permanent, marks are temporary.</span></div>
        <div style={s3.capRow}><span style={s3.capKey}>Best for</span><span>Discovery, ambient presence. Strongest "world to walk in" feeling. Hardest to scope/moderate.</span></div>
      </div>
    </div>
  );
}

function CursorGlyph({ color, you }) {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} style={{position: 'absolute', left: -2, top: -2, filter: you ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : undefined}}>
      <path d="M2 2 L2 12 L5 9 L7 14 L9 13 L7 8 L11 8 Z" fill={color} stroke="white" strokeWidth="0.8" strokeLinejoin="round"/>
    </svg>
  );
}

const s3 = {
  root: { width: 600, padding: 30, background: '#1a1538', fontFamily: 'Inter, system-ui, sans-serif', color: '#dcd1f0', display: 'flex', flexDirection: 'column', gap: 18 },
  pageHead: { display: 'flex', flexDirection: 'column', gap: 4 },
  kicker: { fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.18em', color: '#e7a8c9', textTransform: 'uppercase' },
  title: { fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 38, lineHeight: 1, fontWeight: 500, letterSpacing: '-0.02em', color: '#f4ebd8' },
  sub: { fontSize: 13, color: '#a48bd9', maxWidth: 520, lineHeight: 1.5 },
  canvas: { position: 'relative', height: 430, background: '#f3ecd9', borderRadius: 4, overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.06), 0 20px 40px -16px rgba(0,0,0,0.5)' },
  sprite: { position: 'absolute', lineHeight: 0 },
  spriteTag: { position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 2, fontFamily: 'ui-monospace, monospace', fontSize: 9, color: '#3a3f63', whiteSpace: 'nowrap' },
  spriteDot: { width: 5, height: 5, borderRadius: '50%' },
  spriteBy: { fontWeight: 600 },
  spriteTime: { color: '#7a7c95' },
  cursor: { position: 'absolute', width: 16, height: 16, zIndex: 4 },
  cursorLabel: { position: 'absolute', left: 14, top: 12, color: 'white', fontFamily: 'ui-monospace, monospace', fontSize: 9, padding: '1px 5px', borderRadius: 2, whiteSpace: 'nowrap' },
  toolbar: { position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#1f2347', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  tbBtn: { width: 26, height: 26, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.06)', color: '#dcd1f0', border: 'none', borderRadius: 2, fontSize: 13 },
  tbBtnActive: { background: '#a48bd9', color: 'white' },
  tbSep: { width: 1, height: 18, background: 'rgba(255,255,255,0.12)' },
  tbColors: { display: 'flex', alignItems: 'center', gap: 3 },
  tbColor: { width: 14, height: 14, borderRadius: 2, border: '1.5px solid transparent' },
  tbColorActive: { borderColor: 'white' },
  tbHint: { fontFamily: 'ui-monospace, monospace', fontSize: 9, color: '#a48bd9', letterSpacing: '0.06em' },
  minimap: { position: 'absolute', top: 14, right: 14, width: 160, padding: 8, background: 'rgba(31,35,71,0.92)', backdropFilter: 'blur(4px)', borderRadius: 4, color: '#dcd1f0' },
  minimapHead: { display: 'flex', justifyContent: 'space-between', fontFamily: 'ui-monospace, monospace', fontSize: 8.5, letterSpacing: '0.06em', marginBottom: 6 },
  minimapInstance: { color: '#f4ebd8' },
  minimapNeighbors: { color: '#a48bd9' },
  minimapBody: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 },
  minimapTile: { position: 'relative', aspectRatio: '3/2', background: '#f3ecd9', borderRadius: 1 },
  minimapTile2: { position: 'relative', aspectRatio: '3/4', background: 'rgba(243,236,217,0.3)', borderRadius: 1, display: 'grid', placeItems: 'center' },
  minimapLabel: { fontFamily: 'ui-monospace, monospace', fontSize: 7, letterSpacing: '0.06em', color: '#a48bd9', writingMode: 'vertical-rl', transform: 'rotate(180deg)' },
  minimapViewport: { position: 'absolute', left: '20%', top: '15%', width: '50%', height: '60%', border: '1.5px solid #d3493b', borderRadius: 1 },
  minimapYou: { position: 'absolute', left: '42%', top: '60%', width: 4, height: 4, background: '#d3493b', borderRadius: '50%', boxShadow: '0 0 0 1.5px white' },
  minimapFoot: { fontFamily: 'ui-monospace, monospace', fontSize: 8.5, color: '#a48bd9', marginTop: 6 },
  captionStrip: { padding: 14, background: '#0c0a1a', color: '#dcd1f0', fontSize: 11.5, lineHeight: 1.55, display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 4 },
  capRow: { display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12 },
  capKey: { fontFamily: 'ui-monospace, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e7a8c9' },
};

// ============================================================
// Mount
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Pictochat variants">
      <DCSection id="pictochat" title="Pictochat-inspired feature — three directions">
        <DCArtboard id="v1-ds" label="PN.DS · DS clamshell homage" width={660} height={1020}>
          <Variant_DS/>
        </DCArtboard>
        <DCArtboard id="v2-pn" label="PN.chat · hashtag-scoped, federated" width={660} height={1020}>
          <Variant_PN/>
        </DCArtboard>
        <DCArtboard id="v3-atrium" label="Atrium · shared spatial canvas" width={660} height={720}>
          <Variant_Atrium/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
