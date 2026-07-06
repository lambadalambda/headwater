/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState } = React;

// ============================================================
// Mock data — mix of unicode + custom-emoji "PNGs"
// Real custom-emoji would carry { shortcode, url, static_url,
// category } per /api/v1/custom_emojis. Here a CSS swatch
// class stands in for the image.
// ============================================================
const CUSTOM_EMOJI = [
  // "stolen" / personal pack
  { sc: 'sad',         pack: 'stolen', swatch: 'em-cx-sad',      label: 'sad face yellow' },
  { sc: 'same',        pack: 'stolen', swatch: 'em-cx-same',     label: 'SAME bold green' },
  { sc: 'sadcat',      pack: 'stolen', swatch: 'em-cx-sadcat',   label: 'crying cat photo' },
  { sc: 'sadday',      pack: 'stolen', swatch: 'em-cx-sadday',   label: 'green hair anime' },
  { sc: 'sakura',      pack: 'stolen', swatch: 'em-cx-sakura',   label: 'pink hair anime' },
  { sc: 'blobcat',     pack: 'blobs',  swatch: 'em-cx-blobcat',  label: 'blobcat smile' },
  { sc: 'blobcatlove', pack: 'blobs',  swatch: 'em-cx-blobl',    label: 'blobcat hearts' },
  { sc: 'blobthumbsup',pack: 'blobs',  swatch: 'em-cx-blobtu',   label: 'blobcat thumbs up' },
  { sc: 'partyparrot', pack: 'party',  swatch: 'em-cx-party',    label: 'animated parrot' },
  { sc: 'pleromasummer', pack: 'pl',  swatch: 'em-cx-summer',    label: 'pleroma sunset' },
  { sc: 'fediverse',   pack: 'pl',     swatch: 'em-cx-fedi',     label: 'fediverse logo' },
  { sc: 'thinking',    pack: 'misc',   swatch: 'em-cx-think',    label: 'thinking face' },
  { sc: 'crt',         pack: 'misc',   swatch: 'em-cx-crt',      label: 'CRT pixel' },
  { sc: 'cassette',    pack: 'misc',   swatch: 'em-cx-cass',     label: 'tape cassette' },
  { sc: 'pcmaster',    pack: 'misc',   swatch: 'em-cx-pc',       label: 'beige PC' },
  { sc: 'catshrug',    pack: 'blobs',  swatch: 'em-cx-shrug',    label: 'cat shrug' },
];

const UNICODE = {
  Smileys: ['😀','😁','😂','🤣','😅','😊','😉','😍','😘','😎','🤔','😴','😭','😡','🥺','🤗','🙃','😏','😌','😪'],
  Animals: ['🐱','🐶','🦊','🐰','🐻','🐼','🦁','🐯','🐮','🐷','🐸','🐵','🦄','🐝','🦋','🐢','🐍','🦖'],
  Food:    ['🍕','🍔','🍟','🌭','🍿','🥯','🍞','🥐','🥨','🥞','🧀','🍳','🥚','🥓','🍣','🍙','🍡','🍩'],
  Travel:  ['🚗','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍','🛺','🚲','🛴'],
  Objects: ['⌚','📱','💻','⌨','🖥','🖨','🖱','🖲','🕹','🗜','💾','💿','📀','📼','📷','📹','🎥','📽'],
};

const RECENTS = ['🔥','❤️','😂','sad','blobcat','✨','partyparrot','sakura'];

// Mock partial-text search across both unicode + custom.
function searchEmoji(q) {
  if (!q) return CUSTOM_EMOJI.slice(0, 5);
  const lq = q.toLowerCase();
  return CUSTOM_EMOJI
    .filter(e => e.sc.toLowerCase().includes(lq) || e.label.toLowerCase().includes(lq))
    .slice(0, 6);
}

// ============================================================
// Helpers — render either a unicode glyph or a swatch
// ============================================================
function EmojiVis({ e, size = 22 }) {
  if (typeof e === 'string') {
    // unicode glyph
    return <span className="em-uni" style={{fontSize: Math.round(size * 0.9)}}>{e}</span>;
  }
  const sw = e.swatch || ('em-cx-' + e.sc);
  return (
    <span className={"em-cx " + sw}
      style={{width: size, height: size}}
      title={':' + e.sc + ':'}>
      <span className="em-cx-i" style={{fontSize: Math.max(7, Math.floor(size * 0.36))}}>
        {(e.sc || '').slice(0, 2).toUpperCase()}
      </span>
    </span>
  );
}

const G = {
  kbd: (label) => <span className="em-kbd">{label}</span>,
  search: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="14" height="14" {...p}><circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3"/></svg>,
  pin:    (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13" {...p}><path d="M8 2l3 4-2 1v4l-1 3-1-3V7L5 6l3-4z"/></svg>,
  smile:  (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><circle cx="8" cy="8" r="6"/><path d="M5.5 10c.7.8 1.5 1.2 2.5 1.2s1.8-.4 2.5-1.2"/><circle cx="6" cy="6.8" r=".6" fill="currentColor" stroke="none"/><circle cx="10" cy="6.8" r=".6" fill="currentColor" stroke="none"/></svg>,
};

// ============================================================
// Composer shell (mimics the real composer)
// ============================================================
function ComposerShell({ typed, caret = true, children, dropdown }) {
  return (
    <div className="em-composer">
      <div className="em-composer-av av-grad-1"/>
      <div className="em-composer-right">
        <div className="em-editor">
          {typed}
          {caret && <span className="em-caret"/>}
        </div>
        <div className="em-foot">
          <button className="em-tool" title="Emoji"><G.smile/></button>
          <span className="em-foot-mid">{G.kbd('@')} mention · {G.kbd(':')} emoji</span>
          <button className="em-post" disabled>Post</button>
        </div>
        {dropdown}
        {children}
      </div>
    </div>
  );
}

// Result post — shows what the picked emoji renders as inline
function ResultPost({ children }) {
  return (
    <div className="em-result">
      <div className="em-result-av av-orb"/>
      <div style={{minWidth: 0, flex: 1}}>
        <header className="em-result-head">
          <span className="em-result-name">you</span>
          <span className="em-result-handle">@you@pleromanet.social</span>
        </header>
        <div className="em-result-body">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, cheat, children }) {
  return (
    <div className="em-page">
      <header className="em-page-h">
        <div className="em-kicker">{kicker}</div>
        <h1 className="em-h1">{title}</h1>
        <p className="em-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="em-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="em-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="em-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// SHORTCODE AUTOCOMPLETE — 4 variants
// ============================================================
const SA_TYPED = (q) => (
  <>
    <span className="em-typed">have been a </span>
    <span className="em-typed-shortcode">:{q}</span>
  </>
);
const SA_QUERY = 'sa';
const SA_RESULTS = searchEmoji(SA_QUERY);

// ---- SC-A · Reuse mention-style slim row ----
function SCA() {
  return (
    <ComposerShell typed={SA_TYPED(SA_QUERY)} dropdown={
      <div className="em-pop em-pop-anchor-1" style={{left: 64, top: 38}}>
        <div className="em-pop-l">Emoji · {SA_RESULTS.length} matches</div>
        {SA_RESULTS.map((e, i) => (
          <button key={e.sc} className={"em-sca-row " + (i === 0 ? 'sel' : '')}>
            <EmojiVis e={e} size={22}/>
            <span className="em-sca-sc">:{e.sc}:</span>
            <span className="em-sca-pack">{e.pack}</span>
            {i === 0 && <span className="em-sca-go">{G.kbd('Tab')}</span>}
          </button>
        ))}
        <div className="em-pop-foot">
          {G.kbd('↑↓')} navigate · {G.kbd('Tab')} insert
        </div>
      </div>
    }/>
  );
}

// ---- SC-B · Lain-style larger preview rows ----
function SCB() {
  return (
    <ComposerShell typed={SA_TYPED(SA_QUERY)} dropdown={
      <div className="em-pop em-pop-anchor-1 em-scb-pop" style={{left: 64, top: 38}}>
        {SA_RESULTS.map((e, i) => (
          <button key={e.sc} className={"em-scb-row " + (i === 0 ? 'sel' : '')}>
            <EmojiVis e={e} size={36}/>
            <span className="em-scb-sc">{e.sc}</span>
          </button>
        ))}
      </div>
    }/>
  );
}

// ---- SC-C · Compact tile grid ----
function SCC() {
  return (
    <ComposerShell typed={SA_TYPED(SA_QUERY)} dropdown={
      <div className="em-pop em-pop-anchor-1 em-scc-pop" style={{left: 64, top: 38}}>
        <div className="em-pop-l">:{SA_QUERY} · {SA_RESULTS.length} matches</div>
        <div className="em-scc-grid">
          {SA_RESULTS.map((e, i) => (
            <button key={e.sc} className={"em-scc-tile " + (i === 0 ? 'sel' : '')} title={':' + e.sc + ':'}>
              <EmojiVis e={e} size={28}/>
              <span className="em-scc-sc">{e.sc}</span>
            </button>
          ))}
        </div>
        <div className="em-pop-foot">{G.kbd('Tab')} or click to insert</div>
      </div>
    }/>
  );
}

// ---- SC-D · Mixed unicode + custom ----
function SCD() {
  // Pretend 'sa' matches 'satellite', 'sailboat', etc.
  const uniMatches = ['😢','😭','🥹'];
  return (
    <ComposerShell typed={SA_TYPED(SA_QUERY)} dropdown={
      <div className="em-pop em-pop-anchor-1 em-scd-pop" style={{left: 64, top: 38}}>
        <div className="em-pop-l">:{SA_QUERY} · {uniMatches.length} unicode · {SA_RESULTS.length} custom</div>
        <div className="em-scd-section">
          <div className="em-scd-section-l">UNICODE</div>
          <div className="em-scd-uni-row">
            {uniMatches.map((u, i) => (
              <button key={u} className={"em-scd-tile " + (i === 0 ? 'sel' : '')}>
                <EmojiVis e={u} size={22}/>
              </button>
            ))}
          </div>
        </div>
        <div className="em-scd-section">
          <div className="em-scd-section-l">CUSTOM</div>
          {SA_RESULTS.map((e) => (
            <button key={e.sc} className="em-sca-row">
              <EmojiVis e={e} size={22}/>
              <span className="em-sca-sc">:{e.sc}:</span>
              <span className="em-sca-pack">{e.pack}</span>
            </button>
          ))}
        </div>
        <div className="em-pop-foot">{G.kbd('Tab')} insert · {G.kbd('Esc')} dismiss</div>
      </div>
    }/>
  );
}

// ============================================================
// FULL EMOJI PICKER — 4 variants
// ============================================================

// ---- Picker B · tabbed packs (lain-style, refined) ----
function PickerB() {
  const [tab, setTab] = useState('stolen');
  const packs = ['stolen', 'blobs', 'party', 'pl', 'misc'];
  return (
    <div className="em-picker em-picker-b">
      <div className="em-picker-search">
        <G.search/>
        <input placeholder="Search emoji · type :sc to filter" readOnly/>
      </div>
      <div className="em-picker-tabs">
        {packs.map(p => (
          <button key={p} className={"em-picker-tab " + (p === tab ? 'on' : '')} onClick={() => setTab(p)} title={p}>
            <EmojiVis e={CUSTOM_EMOJI.find(c => c.pack === p)} size={18}/>
          </button>
        ))}
        <span className="em-picker-tabs-sep"/>
        <button className="em-picker-tab em-picker-tab-uni" title="Unicode">😊</button>
      </div>
      <div className="em-picker-pack-l">{tab}</div>
      <div className="em-picker-grid">
        {CUSTOM_EMOJI.filter(c => c.pack === tab).map(c => (
          <button key={c.sc} className="em-picker-cell" title={':' + c.sc + ':'}>
            <EmojiVis e={c} size={24}/>
          </button>
        ))}
      </div>
      <div className="em-picker-foot">
        <label><input type="checkbox"/> <span>Keep open</span></label>
      </div>
    </div>
  );
}

// ---- Picker C · vertical sidebar of packs ----
function PickerC() {
  const [tab, setTab] = useState('stolen');
  const packs = [
    {id: 'recent', label: 'Recent', icon: 'clock'},
    {id: 'stolen', label: 'stolen'},
    {id: 'blobs',  label: 'blobs'},
    {id: 'party',  label: 'party'},
    {id: 'pl',     label: 'pleroma'},
    {id: 'misc',   label: 'misc'},
    {id: 'unicode', label: 'Unicode'},
  ];
  const cells = tab === 'recent'
    ? RECENTS.map(r => typeof r === 'string' && r.length < 5 ? r : CUSTOM_EMOJI.find(c => c.sc === r) || r)
    : tab === 'unicode'
      ? UNICODE.Smileys
      : CUSTOM_EMOJI.filter(c => c.pack === tab);
  return (
    <div className="em-picker em-picker-c">
      <aside className="em-picker-side">
        {packs.map(p => (
          <button key={p.id} className={"em-picker-side-item " + (p.id === tab ? 'on' : '')} onClick={() => setTab(p.id)}>
            <span className="em-picker-side-i">
              {p.id === 'recent' ? '◷' :
               p.id === 'unicode' ? '☺' :
               <EmojiVis e={CUSTOM_EMOJI.find(c => c.pack === p.id)} size={16}/>}
            </span>
            <span className="em-picker-side-t">{p.label}</span>
          </button>
        ))}
      </aside>
      <div className="em-picker-main">
        <div className="em-picker-search em-picker-search-thin">
          <G.search/>
          <input placeholder="Search…" readOnly/>
        </div>
        <div className="em-picker-grid em-picker-grid-c">
          {cells.map((c, i) => (
            <button key={i} className="em-picker-cell" title={typeof c === 'string' ? c : ':' + c.sc + ':'}>
              <EmojiVis e={c} size={22}/>
            </button>
          ))}
        </div>
        <div className="em-picker-foot">
          <span className="em-picker-foot-name">: {tab} :</span>
          <label><input type="checkbox"/> Keep open</label>
        </div>
      </div>
    </div>
  );
}

// ---- Picker D · single scroll with sticky pack headers ----
function PickerD() {
  const groups = [
    { id: 'recent', label: 'Recent', items: ['🔥','❤️',CUSTOM_EMOJI.find(c=>c.sc==='sad'),'✨',CUSTOM_EMOJI.find(c=>c.sc==='blobcat'),CUSTOM_EMOJI.find(c=>c.sc==='partyparrot')] },
    { id: 'stolen', label: 'stolen · 6 emoji', items: CUSTOM_EMOJI.filter(c=>c.pack==='stolen') },
    { id: 'blobs',  label: 'blobs · 4 emoji',  items: CUSTOM_EMOJI.filter(c=>c.pack==='blobs') },
    { id: 'misc',   label: 'misc · 4 emoji',   items: CUSTOM_EMOJI.filter(c=>c.pack==='misc') },
    { id: 'smileys', label: 'Smileys & people', items: UNICODE.Smileys.slice(0,10) },
    { id: 'animals', label: 'Animals & nature', items: UNICODE.Animals.slice(0,10) },
  ];
  return (
    <div className="em-picker em-picker-d">
      <div className="em-picker-search">
        <G.search/>
        <input placeholder="Search emoji · :shortcode or name" readOnly/>
      </div>
      <div className="em-picker-stream">
        {groups.map(g => (
          <section key={g.id}>
            <h3 className="em-picker-stream-h">{g.label}</h3>
            <div className="em-picker-grid">
              {g.items.map((c, i) => (
                <button key={i} className="em-picker-cell" title={typeof c === 'string' ? c : c ? ':'+c.sc+':' : ''}>
                  <EmojiVis e={c} size={22}/>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// ---- Picker E · search-first minimal ----
function PickerE() {
  return (
    <div className="em-picker em-picker-e">
      <div className="em-picker-search em-picker-search-hero">
        <G.search/>
        <input placeholder="Type to find an emoji…" autoFocus readOnly/>
      </div>
      <div className="em-picker-recent-l">RECENT</div>
      <div className="em-picker-recent">
        {RECENTS.slice(0, 8).map((r, i) => {
          const obj = typeof r === 'string' && r.length < 5 ? r : CUSTOM_EMOJI.find(c => c.sc === r) || r;
          return (
            <button key={i} className="em-picker-cell" title={typeof obj === 'string' ? obj : ':'+obj.sc+':'}>
              <EmojiVis e={obj} size={22}/>
            </button>
          );
        })}
      </div>
      <div className="em-picker-stream em-picker-stream-quiet">
        <details>
          <summary>stolen · 6 emoji</summary>
          <div className="em-picker-grid">
            {CUSTOM_EMOJI.filter(c=>c.pack==='stolen').map(c => (
              <button key={c.sc} className="em-picker-cell" title={':'+c.sc+':'}><EmojiVis e={c} size={22}/></button>
            ))}
          </div>
        </details>
        <details>
          <summary>blobs · 4 emoji</summary>
          <div className="em-picker-grid">
            {CUSTOM_EMOJI.filter(c=>c.pack==='blobs').map(c => (
              <button key={c.sc} className="em-picker-cell" title={':'+c.sc+':'}><EmojiVis e={c} size={22}/></button>
            ))}
          </div>
        </details>
        <details>
          <summary>Smileys & people · 20</summary>
          <div className="em-picker-grid">
            {UNICODE.Smileys.map((c,i) => (
              <button key={i} className="em-picker-cell" title={c}><EmojiVis e={c} size={22}/></button>
            ))}
          </div>
        </details>
        <details>
          <summary>Animals · 18</summary>
          <div className="em-picker-grid">
            {UNICODE.Animals.map((c,i) => (
              <button key={i} className="em-picker-cell" title={c}><EmojiVis e={c} size={22}/></button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}

// Picker rendered "in context" — composer above, picker hanging off the smile button
function PickerInContext({ children }) {
  return (
    <div className="em-pic-ctx">
      <ComposerShell typed={<span className="em-typed">drafting…</span>}/>
      <div className="em-pic-anchor">{children}</div>
    </div>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Emoji · :shortcode autocomplete + picker">

      <DCSection
        id="shortcode"
        title=":shortcode: autocomplete · while typing"
        subtitle="When the composer detects a fresh ':' followed by 2+ characters, a popover opens with matching emoji. On insert, custom emoji become inline image atoms (using the same pill-style behavior as @mentions); unicode emoji become normal characters. Same dataset in every variant — 6 custom emoji starting with 'sa'.">

        <DCArtboard id="sc-a" label="SC-A · slim rows (reuse mention)" width={680} height={460}>
          <Page
            kicker="SC-A · RECOMMENDED"
            title="Slim rows · reuse the mention pattern"
            sub="The same drawer shape we use for @mentions — slim text rows, mini preview on the left, shortcode + pack on the right, [Tab] hint on the selected row. Greatest visual consistency with the existing system."
            cheat={{
              Row: '22px preview · :shortcode: · pack tag',
              Wins: 'Same vocabulary as mentions · familiar',
              Trade: 'Preview is small — hard to scan visually-similar emoji',
            }}>
            <SCA/>
          </Page>
        </DCArtboard>

        <DCArtboard id="sc-b" label="SC-B · big preview (lain-style)" width={680} height={460}>
          <Page
            kicker="SC-B"
            title="Big preview rows"
            sub="Closer to the Pleroma reference: 36px preview, just the bare shortcode beside it. No pack info, no kbd hints. Best when picking visually — useful for image-heavy custom packs."
            cheat={{
              Row: '36px preview · shortcode only',
              Wins: 'Image-forward · easy to pick visually',
              Trade: 'Less density · pack source not visible',
            }}>
            <SCB/>
          </Page>
        </DCArtboard>

        <DCArtboard id="sc-c" label="SC-C · compact tile grid" width={680} height={460}>
          <Page
            kicker="SC-C"
            title="Compact tile grid"
            sub="Tiles instead of rows — 4 across, name below each preview. Highest density and lets you spot-check 8-12 matches at once instead of scrolling. Good when prefix queries return lots of hits."
            cheat={{
              Row: '4-col grid · 28px preview + name below',
              Wins: 'High density · scannable at a glance',
              Trade: 'Less obvious how to navigate with arrow keys',
            }}>
            <SCC/>
          </Page>
        </DCArtboard>

        <DCArtboard id="sc-d" label="SC-D · unicode + custom split" width={680} height={520}>
          <DCArtboardSub/>
          <Page
            kicker="SC-D · COMPLETE"
            title="Unicode + custom split"
            sub="Two sections: matching unicode emoji on top (as a horizontal row of glyphs), then matching custom emoji below (slim rows). Catches both ‘:sa’ → 😢🥹 AND ‘:sa’ → :sad:, :sadcat:, etc."
            cheat={{
              Sections: 'UNICODE row + CUSTOM list',
              Wins: 'Catches both kinds in one popover · most complete',
              Trade: 'Heaviest popover · two-zone navigation',
            }}>
            <SCD/>
          </Page>
        </DCArtboard>

      </DCSection>

      <DCSection
        id="picker"
        title="Full emoji picker · opened from the 😀 button"
        subtitle="Same dataset across variants: 16 custom emoji across 5 packs (stolen / blobs / party / pleroma / misc) + several unicode categories (Smileys, Animals, etc.) + a Recents row. Each artboard shows the picker hanging off the composer's emoji button.">

        <DCArtboard id="pick-b" label="Picker B · tabbed packs (lain-refined)" width={760} height={620}>
          <Page
            kicker="PICKER B"
            title="Tabbed packs · refined lain"
            sub="Mirrors the Pleroma reference: a horizontal strip of pack tabs at the top, a single search field, and the active pack's grid below. Refined chrome — proper border tokens, sectioning, and a [Keep open] toggle in the foot."
            cheat={{
              Shape: 'Top tabs · single grid · 7-col cells',
              Wins: 'Familiar (matches Pleroma reference) · compact',
              Trade: 'Tabs scroll horizontally when many packs · pack labels hidden behind icon-only tabs',
            }}>
            <PickerInContext><PickerB/></PickerInContext>
          </Page>
        </DCArtboard>

        <DCArtboard id="pick-c" label="Picker C · vertical sidebar" width={780} height={620}>
          <Page
            kicker="PICKER C · RECOMMENDED"
            title="Vertical pack sidebar"
            sub="Packs become a labeled column on the left, grid on the right. Each pack name is visible — no guessing what an icon-tab means. Recent appears as a first-class entry; Unicode as a final entry. Smooth scale to N packs."
            cheat={{
              Shape: 'Left sidebar of pack names · right column grid',
              Wins: 'Pack labels visible · scales to many packs · keeps search compact',
              Trade: 'Wider than tab-style · 760px+ recommended',
            }}>
            <PickerInContext><PickerC/></PickerInContext>
          </Page>
        </DCArtboard>

        <DCArtboard id="pick-d" label="Picker D · scrolling list with sticky headers" width={760} height={620}>
          <Page
            kicker="PICKER D"
            title="Single scroll · sticky pack headers"
            sub="No tabs at all. All packs flow as sections with sticky headers as you scroll. Top search filters across everything. Closest model to a system emoji picker (Slack, Discord)."
            cheat={{
              Shape: 'One vertical scroll · sticky section headers',
              Wins: 'No mode-switch · search + scroll only · most familiar to non-Fediverse users',
              Trade: 'Long packs push smaller ones off-screen',
            }}>
            <PickerInContext><PickerD/></PickerInContext>
          </Page>
        </DCArtboard>

        <DCArtboard id="pick-e" label="Picker E · search-first minimal" width={760} height={620}>
          <Page
            kicker="PICKER E · QUIET"
            title="Search-first minimal"
            sub="A hero search bar gets focus by default; Recent is the only thing showing without typing. Below, packs are collapsed accordion sections (closed by default — open as needed). Quietest treatment — leans on the search index."
            cheat={{
              Shape: 'Hero search + Recent row + collapsed pack accordions',
              Wins: 'Minimal visual clutter · search-driven · feels lightweight',
              Trade: 'Heavy reliance on the user knowing what to search for',
            }}>
            <PickerInContext><PickerE/></PickerInContext>
          </Page>
        </DCArtboard>

      </DCSection>

    </DesignCanvas>
  );
}

// (Helper subcomponent to silence unused-var warnings)
function DCArtboardSub() { return null; }

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
