/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */

// ============================================================
// Mention autocomplete + pill variants
// Each variant shows two states:
//   1. Composer mid-type with the autocomplete dropdown open
//   2. A finished post showing how the chosen mention renders
// Mock data follows the shape returned by /api/v1/accounts/search.
// ============================================================

const ACCOUNTS = [
  {
    id: '1', username: 'soft.hertz', acct: 'soft.hertz@kolektiva.social',
    display_name: 'soft.hertz ✦',
    avClass: 'av-grad-3',
    note: 'slow web · cassette decks · taipei',
    selected: true,
  },
  {
    id: '2', username: 'softie', acct: 'softie@graz.dev',
    display_name: 'softie ◌',
    avClass: 'av-orb',
    note: 'synthwave dj · graz',
    selected: false,
  },
  {
    id: '3', username: 'softwave', acct: 'softwave@retro.social',
    display_name: 'softwave',
    avClass: 'av-grad-2',
    note: 'retro pcs · 90s web nostalgia',
    selected: false,
  },
  {
    id: '4', username: 'softstack', acct: 'softstack@hub.dev',
    display_name: 'softstack',
    avClass: 'av-pixel-pc',
    note: 'systems · self-host evangelist',
    selected: false,
  },
];

const G = {
  reply: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M6 4L2 8l4 4"/><path d="M2 8h7a4 4 0 014 4v1"/></svg>,
  boost: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" {...p}><path d="M3 6l2-2 2 2M5 4v6a1.5 1.5 0 001.5 1.5h5M13 10l-2 2-2-2M11 12V6a1.5 1.5 0 00-1.5-1.5h-5"/></svg>,
  star:  (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" width="14" height="14" {...p}><path d="M8 2l1.7 3.9 4.3.4-3.2 2.9.9 4.2L8 11.2 4.3 13.4l.9-4.2L2 6.3l4.3-.4L8 2z"/></svg>,
  kbd: (label, p) => <span className="mv-kbd" {...p}>{label}</span>,
};

// ============================================================
// Composer shell — left = avatar, right = textarea + autocomplete
// ============================================================
function ComposerShell({ children, dropdownChildren, typedText = '@sof', focused = true }) {
  return (
    <div className="mv-composer">
      <div className="mv-composer-av av-grad-1"/>
      <div className="mv-composer-right">
        <div className={"mv-textarea " + (focused ? 'focused' : '')}>
          <span className="mv-typed-prefix">thanks for the recs! </span>
          <span className="mv-typed-mention">{typedText}</span>
          <span className="mv-caret"/>
        </div>
        {children}
        <div className="mv-composer-foot">
          <span className="mv-foot-l">412</span>
          <span className="mv-foot-r">
            {G.kbd('Tab')} or {G.kbd('↵')} to insert
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Result post — shows the mention in its rendered pill form,
// inside a body, with action bar. Mirrors PleromaNet shapes.
// ============================================================
function ResultPost({ children }) {
  return (
    <div className="mv-result">
      <div className="mv-result-l">RENDERED</div>
      <article className="mv-post">
        <div className="mv-post-av av-orb"/>
        <div style={{minWidth: 0}}>
          <header className="mv-post-head">
            <span className="mv-post-name">datagram</span>
            <span className="mv-post-handle">@datagram@retro.social</span>
            <span className="mv-post-time">just now</span>
          </header>
          <div className="mv-post-body">
            {children}
          </div>
          <footer className="mv-post-actions">
            <span><G.reply/></span>
            <span><G.boost/></span>
            <span><G.star/></span>
          </footer>
        </div>
      </article>
    </div>
  );
}

// ============================================================
// V1 · Text-style mention (current refined)
// ============================================================
function V1Dropdown() {
  return (
    <div className="mv-pop mv-v1-pop">
      <div className="mv-pop-l">Suggestions</div>
      {ACCOUNTS.map(a => (
        <button key={a.id} className={"mv-v1-row " + (a.selected ? 'sel' : '')}>
          <span className={"mv-av-22 " + a.avClass}/>
          <span className="mv-v1-name">{a.display_name}</span>
          <span className="mv-v1-acct">@{a.acct}</span>
        </button>
      ))}
      <div className="mv-pop-foot">
        4 matches · {G.kbd('↑↓')} navigate · {G.kbd('Esc')} dismiss
      </div>
    </div>
  );
}
function V1Pill() {
  return <a className="mv-v1-mention">@soft.hertz</a>;
}

// ============================================================
// V2 · Mono pill (text-pill hybrid)
// ============================================================
function V2Dropdown() {
  return (
    <div className="mv-pop mv-v2-pop">
      <div className="mv-pop-l">Mention · 4 results</div>
      {ACCOUNTS.map(a => (
        <button key={a.id} className={"mv-v2-row " + (a.selected ? 'sel' : '')}>
          <span className={"mv-av-22 " + a.avClass}/>
          <span className="mv-v2-name">{a.display_name}</span>
          <span className="mv-v2-acct">@{a.acct}</span>
        </button>
      ))}
    </div>
  );
}
function V2Pill() {
  return (
    <a className="mv-v2-mention">
      <span className="mv-v2-at">@</span>
      <span className="mv-v2-handle">soft.hertz</span>
    </a>
  );
}

// ============================================================
// V3 · Avatar pill (recommended)
// ============================================================
function V3Dropdown() {
  return (
    <div className="mv-pop mv-v3-pop">
      <div className="mv-pop-head">
        <span className="mv-pop-l">Mention</span>
        <span className="mv-pop-l-r">4 results</span>
      </div>
      {ACCOUNTS.map(a => (
        <button key={a.id} className={"mv-v3-row " + (a.selected ? 'sel' : '')}>
          <span className={"mv-av-30 " + a.avClass}/>
          <div className="mv-v3-rowtext">
            <div className="mv-v3-name">{a.display_name}</div>
            <div className="mv-v3-acct">@{a.acct}</div>
          </div>
          {a.selected && <span className="mv-v3-go">{G.kbd('Tab')}</span>}
        </button>
      ))}
    </div>
  );
}
function V3Pill() {
  return (
    <span className="mv-v3-mention">
      <span className="mv-av-14 av-grad-3"/>
      <span className="mv-v3-handle">@soft.hertz</span>
    </span>
  );
}

// ============================================================
// V4 · Display-name pill with bio in dropdown
// ============================================================
function V4Dropdown() {
  return (
    <div className="mv-pop mv-v4-pop">
      <div className="mv-pop-head">
        <span className="mv-pop-l">Mention</span>
        <span className="mv-pop-l-r">"sof"</span>
      </div>
      {ACCOUNTS.map(a => (
        <button key={a.id} className={"mv-v4-row " + (a.selected ? 'sel' : '')}>
          <span className={"mv-av-36 " + a.avClass}/>
          <div className="mv-v4-rowtext">
            <div className="mv-v4-name">{a.display_name}</div>
            <div className="mv-v4-acct">@{a.acct}</div>
            <div className="mv-v4-note">{a.note}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
function V4Pill() {
  return (
    <span className="mv-v4-mention" title="@soft.hertz@kolektiva.social">
      <span className="mv-av-16 av-grad-3"/>
      <span className="mv-v4-name">soft.hertz</span>
    </span>
  );
}

// ============================================================
// V5 · Inline ghost completion (no dropdown)
// ============================================================
function V5Ghost() {
  return (
    <div className="mv-textarea focused mv-v5-textarea">
      <span className="mv-typed-prefix">thanks for the recs! </span>
      <span className="mv-typed-mention">@sof</span>
      <span className="mv-v5-ghost">t.hertz@kolektiva.social</span>
      <span className="mv-caret"/>
    </div>
  );
}
function V5Pill() {
  // Use V3-style pill as the canonical rendered form
  return V3Pill();
}

// ============================================================
// Composer "after accept" — same shell but the mention is now
// an inline pill atom inside the editable area, caret after it.
// ============================================================
function ComposerWithPill({ pill }) {
  return (
    <div className="mv-composer">
      <div className="mv-composer-av av-grad-1"/>
      <div className="mv-composer-right">
        <div className="mv-textarea focused">
          <span className="mv-typed-prefix">thanks for the recs! </span>
          {pill}
          <span className="mv-caret"/>
          <span className="mv-typed-prefix"> — going to try qwen 0.5b first and then jan-nano if it doesn&apos;t cut it.</span>
        </div>
        <div className="mv-composer-foot">
          <span className="mv-foot-l">358</span>
          <span className="mv-foot-r">
            <span className="mv-pill-hint">↩ Backspace at right edge deletes the mention</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, cheat, composer, dropdown, pill, replaceComposer, ghostExtra }) {
  return (
    <div className="mv-page">
      <header className="mv-page-h">
        <div className="mv-kicker">{kicker}</div>
        <h1 className="mv-h1">{title}</h1>
        <p className="mv-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="mv-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="mv-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="mv-page-body">
        <div className="mv-state-l">1 · WHILE TYPING</div>
        {replaceComposer ? replaceComposer : (
          <ComposerShell dropdownChildren={dropdown}>
            {dropdown}
          </ComposerShell>
        )}
        {ghostExtra}
        <div className="mv-state-l" style={{marginTop: 18}}>2 · AFTER ACCEPT · STILL EDITABLE</div>
        <ComposerWithPill pill={pill}/>
        <div className="mv-state-l" style={{marginTop: 18}}>3 · AFTER POST</div>
        <ResultPost>
          <>
            thanks for the recs! {pill} — going to try qwen 0.5b first and then jan-nano if it doesn&apos;t cut it.
          </>
        </ResultPost>
      </div>
    </div>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Mention · autocomplete + pill">
      <DCSection
        id="mentions"
        title="@mention autocomplete + rendered pill"
        subtitle="Pleroma's accounts API returns the federated form (@user@instance). In the composer that's noisy to type and ugly to read after — these four directions show a dropdown for selecting a match, plus how the chosen mention then renders inside the finished post body. Mock data follows the shape returned by /api/v1/accounts/search.">

        <DCArtboard id="v1" label="V1 · text mention (current)" width={680} height={920}>
          <Page
            kicker="V1 · TEXT"
            title="Plain text mention"
            sub="The autocomplete is a slim one-line list. After insert, the mention stays plain text — just colored accent-ink. No chip, no avatar. Closest to today's PostBody rendering — the @handle is a link, nothing more."
            cheat={{
              Dropdown: 'Slim · one line · 22px avatar + name + @handle',
              Pill: 'No pill · accent-ink @handle text · underline on hover',
              Wins: 'Lowest visual weight · easy to copy-paste',
              Trade: 'Server domain shown raw in finished post',
            }}
            dropdown={<V1Dropdown/>}
            pill={<V1Pill/>}
          />
        </DCArtboard>

        <DCArtboard id="v2" label="V2 · mono pill" width={680} height={920}>
          <Page
            kicker="V2 · MONO PILL"
            title="Mono pill, no avatar"
            sub="Compact rounded pill in mono — the @ is split visually from the handle so the structure is obvious. Server is hidden from the pill but still in the underlying value. Slightly more structured than V1 without adding an image."
            cheat={{
              Dropdown: 'Compact · 22px avatar · accent name + mono @handle',
              Pill: 'Mono · accent-soft fill · accent-ink text · 18px tall',
              Wins: 'Structured atom · no images to load',
              Trade: 'Still no visual identity for the user',
            }}
            dropdown={<V2Dropdown/>}
            pill={<V2Pill/>}
          />
        </DCArtboard>

        <DCArtboard id="v3" label="V3 · avatar pill ★" width={680} height={920}>
          <Page
            kicker="V3 · RECOMMENDED"
            title="Avatar pill"
            sub="A 14px avatar leads the pill, then the @handle in mono. The pill is a single inline atom: backspace at the right edge deletes the whole mention. Hovering the pill (or the dropdown row) shows the full federated @handle@server in a tooltip."
            cheat={{
              Dropdown: 'Rich · 30px avatar · two-line · current row highlighted with Tab hint',
              Pill: '14px avatar + mono @handle · accent-soft fill',
              Wins: 'Friendly · clearly a user atom · scannable',
              Trade: 'Avatar lookup needed; needs fallback if image fails',
            }}
            dropdown={<V3Dropdown/>}
            pill={<V3Pill/>}
          />
        </DCArtboard>

        <DCArtboard id="v4" label="V4 · display-name pill + bio dropdown" width={680} height={960}>
          <Page
            kicker="V4 · DISPLAY NAME"
            title="Display-name pill"
            sub="Goes furthest from raw markup: the pill shows the user's display name (with the unicode glyphs they chose) plus a small avatar. The @handle@server is recoverable via tooltip / focused-post but doesn't clutter inline reading. Dropdown includes the user's bio snippet so you can pick the right ‘soft.hertz’."
            cheat={{
              Dropdown: 'Rich · 36px avatar · display name + @handle + bio snippet',
              Pill: '16px avatar + display name · sans-serif · accent-soft fill',
              Wins: 'Most readable in body copy · disambiguates similar handles',
              Trade: 'Display name is editable by user · risk of impersonation',
            }}
            dropdown={<V4Dropdown/>}
            pill={<V4Pill/>}
          />
        </DCArtboard>

        <DCArtboard id="v5" label="V5 · inline ghost completion" width={680} height={920}>
          <Page
            kicker="V5 · GHOST"
            title="Inline ghost completion"
            sub="No dropdown at all. As you type, the matched user's remaining characters ghost in inline (muted text). Tab to accept; the result becomes a pill (using V3 as the canonical form). Quietest interaction — feels like terminal tab-completion."
            cheat={{
              Dropdown: 'None · inline ghost text shows the top match',
              Pill: 'Same as V3 after accept',
              Wins: 'Zero panel chrome · fastest for one-handed typing · feels like a CLI',
              Trade: 'No way to see other matches · poor for ambiguous prefixes',
              Combine: 'Ghost completion + dropdown is a real option (best of both)',
            }}
            replaceComposer={
              <div className="mv-composer">
                <div className="mv-composer-av av-grad-1"/>
                <div className="mv-composer-right">
                  <V5Ghost/>
                  <div className="mv-composer-foot">
                    <span className="mv-foot-l">412</span>
                    <span className="mv-foot-r">
                      {G.kbd('Tab')} to accept ghost match
                    </span>
                  </div>
                </div>
              </div>
            }
            pill={<V5Pill/>}
          />
        </DCArtboard>

      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
