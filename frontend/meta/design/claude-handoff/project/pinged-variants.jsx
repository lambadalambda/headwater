/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */

// ============================================================
// Pinged-parent variants
// The "Replying to" line currently uses a filled accent-purple
// chip for the parent addressee — too eye-catching. Four
// less-prominent treatments, all using the existing markup.
// ============================================================

function ReplyToGlyph(props) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="10" height="10" aria-hidden="true" {...props}>
      <path d="M9 4L5 8l4 4"/>
      <path d="M5 8h6a3 3 0 013 3v1"/>
    </svg>
  );
}

// Single addressee row — pretends to be inside a post body.
function PingedRow({ variantClass, marker = null, parent = '@pixelmoth', also = ['@dust', '@kestrel'] }) {
  return (
    <div className={"post-pinged " + (variantClass || '')}>
      <span className="post-pinged-l">Replying to</span>
      <span className="post-pinged-list">
        {marker}
        <a className="post-pinged-chip-parent">
          {variantClass === 'pv-c' ? null : <ReplyToGlyph/>}
          {parent}
        </a>
        {also.length > 0 && <span className="post-pinged-also">· also</span>}
        {also.map(a => <a key={a} className="post-pinged-chip">{a}</a>)}
      </span>
    </div>
  );
}

function Card({ tag, title, note, children }) {
  return (
    <div className="pv-card">
      <div className="pv-card-h">
        <span>{tag}</span>
        <b>{title}</b>
        <em>{note}</em>
      </div>
      <div className="pv-body">a quick reply to the thread — nothing fancy, just continuing the conversation.</div>
      {children}
    </div>
  );
}

function Page({ kicker, title, sub, children }) {
  return (
    <div className="pv-page">
      <header className="pv-page-h">
        <div className="pv-kicker">{kicker}</div>
        <h1 className="pv-h1">{title}</h1>
        <p className="pv-sub">{sub}</p>
      </header>
      <div className="pv-page-body">{children}</div>
    </div>
  );
}

// ============================================================
// Variants — each in its own page with a small spec
// ============================================================
function V0() {
  return (
    <Page kicker="V0 · BASELINE" title="Current treatment" sub="Filled accent-purple chip, white text, bold weight, ↪ glyph. Same height as cc chips but loud — the bright fill demands attention even when the cc chips are quieter.">
      <Card tag="Current" title="Filled accent chip" note="bright · bold · ↪ inside">
        <PingedRow/>
      </Card>
    </Page>
  );
}
function VA() {
  return (
    <Page kicker="VARIANT A · RECOMMENDED" title="Ghost chip + ↪ glyph" sub="Parent chip uses the same ghost styling as the cc chips (accent-soft-2 background, accent-ink text). The ↪ glyph is what marks it as the parent, not the color. Same role hint, fraction of the visual weight.">
      <Card tag="Variant A" title="Ghost chip + ↪ glyph" note="same fill as cc · glyph = role marker">
        <PingedRow variantClass="pv-a"/>
      </Card>
    </Page>
  );
}
function VB() {
  return (
    <Page kicker="VARIANT B" title="Plain link + ↪ glyph (no chip)" sub="Parent renders as a plain accent-ink link with the ↪ glyph in front. No pill, no border. The cc chips keep their pills, so the parent reads as 'the one without the pill' — opposite of today.">
      <Card tag="Variant B" title="No chip, glyph prefix" note="parent is text · cc are pills">
        <PingedRow variantClass="pv-b"/>
      </Card>
    </Page>
  );
}
function VC() {
  return (
    <Page kicker="VARIANT C" title="↪ marker outside chip; all chips ghost" sub="Pull the ↪ out of the chip entirely and put it next to 'Replying to' as a single small marker. All addressee chips look identical (ghost). Quietest of the four — only the position of the parent tells you which one it is.">
      <Card tag="Variant C" title="Single ↪ marker · all chips identical" note="marker absorbs the role; chips don't differ">
        <PingedRow variantClass="pv-c" marker={<span className="pv-pinged-marker"><ReplyToGlyph/></span>}/>
      </Card>
    </Page>
  );
}
function VD() {
  return (
    <Page kicker="VARIANT D" title="Muted fill, same chip shape" sub="Keeps the filled-pill shape so the parent still 'pops', but swaps the bright accent for accent-soft + accent-ink text. Half the contrast of today; same affordance.">
      <Card tag="Variant D" title="Muted accent fill" note="same shape · softer fill · accent-ink text">
        <PingedRow variantClass="pv-d"/>
      </Card>
    </Page>
  );
}

function App() {
  return (
    <DesignCanvas docTitle="Pinged-parent chip · less-prominent variants">
      <DCSection
        id="pinged"
        title="Replying-to · less prominent parent chip"
        subtitle="The current treatment (V0) makes the parent chip too eye-catching: bright purple fill, white text, bold weight. Four ways to dial it down — same line, same addressees (@pixelmoth replying with also @dust @kestrel). Recommended: Variant A.">

        <DCArtboard id="v0" label="V0 · current (too prominent)" width={620} height={280}>
          <V0/>
        </DCArtboard>
        <DCArtboard id="va" label="A · ghost chip + ↪ glyph ★" width={620} height={300}>
          <VA/>
        </DCArtboard>
        <DCArtboard id="vb" label="B · plain link + ↪ glyph" width={620} height={300}>
          <VB/>
        </DCArtboard>
        <DCArtboard id="vc" label="C · ↪ marker outside, chips identical" width={620} height={300}>
          <VC/>
        </DCArtboard>
        <DCArtboard id="vd" label="D · muted fill, same shape" width={620} height={300}>
          <VD/>
        </DCArtboard>

      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
