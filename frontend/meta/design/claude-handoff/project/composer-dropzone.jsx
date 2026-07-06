/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard */
const { useState: usDZ } = React;

// ============================================================
// Glyphs (kept local — file is self-contained)
// ============================================================
const Gd = {
  upload: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>,
  image: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.5"/><path d="M3 16l5-4 5 4 3-2 5 3"/></svg>,
  draw: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><path d="M3 21l4-1 11.5-11.5a2 2 0 00-3-3L4 17l-1 4z"/><path d="M14 6l3 3"/></svg>,
  poll: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="18" height="18" {...p}><path d="M5 10v9M12 5v14M19 13v6"/></svg>,
  smile: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...p}><circle cx="12" cy="12" r="8"/><path d="M9 14c1 1 2 1.5 3 1.5s2-.5 3-1.5"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/></svg>,
  x: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="12" height="12" {...p}><path d="M4 4l8 8M12 4l-8 8"/></svg>,
  plus: (p) => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width="14" height="14" {...p}><path d="M8 3v10M3 8h10"/></svg>,
};

// ============================================================
// Composer shell — used by every variant
// ============================================================
function ComposerShell({ active = false, overlayMode, kids, footExtra, slot, error }) {
  return (
    <div className={"dz-composer " + (active && overlayMode === 'v1' ? 'v1-active' : '')}>
      <div className="dz-composer-av"/>
      <div className="dz-composer-right">
        <div className={"dz-editor " + (kids ? '' : 'empty')}>{kids}</div>
        {slot}
        {error && <div className="dz-error">{error}</div>}
        <div className="dz-foot">
          <button className="dz-tool" title="Add image"><Gd.image/></button>
          <button className="dz-tool" title="Draw"><Gd.draw/></button>
          <button className="dz-tool" title="Poll"><Gd.poll/></button>
          <button className="dz-tool" title="Emoji"><Gd.smile/></button>
          {footExtra}
          <span className="dz-spacer"/>
          <span className="dz-count">412</span>
          <button className="dz-post">Post</button>
        </div>
      </div>
      {overlayMode === 'v1' && active && (
        <div className="dz-v1-overlay">
          <div className="dz-v1-card">
            <Gd.upload/>
            <div className="dz-v1-card-h">Drop to attach</div>
            <div className="dz-v1-card-s">photos · audio · video</div>
            <div className="dz-supports">Max 8 files · 40 MB each</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Reused upload-row component
// ============================================================
function UploadRow({ kind = 'photo', name, pct, removable = true }) {
  return (
    <div className="dz-upload-row">
      <div className={"dz-upload-thumb " + kind}>{kind === 'audio' ? 'WAV' : kind === 'video' ? 'MP4' : 'JPG'}</div>
      <div className="dz-upload-meta">
        <div className="dz-upload-name">{name}</div>
        <div className="dz-upload-prog-row">
          <div className="dz-upload-bar"><span style={{width: pct + '%'}}/></div>
          <span className="dz-upload-pct">{pct}%</span>
        </div>
      </div>
      {removable && <button className="dz-upload-rm" title="Remove"><Gd.x/></button>}
    </div>
  );
}

// ============================================================
// V1 · OVERLAY (idle / drag-over / uploading)
// ============================================================
function V1Idle() {
  return <ComposerShell kids={null} overlayMode="v1"/>;
}
function V1DragOver() {
  return <ComposerShell kids="rain on glass · 11 minutes, two takes" active overlayMode="v1"/>;
}
function V1Uploading() {
  return (
    <ComposerShell
      kids="rain on glass · 11 minutes, two takes"
      overlayMode="v1"
      slot={
        <div className="dz-uploads">
          <UploadRow kind="audio" name="rain-on-glass-take2.wav" pct={100}/>
          <UploadRow kind="photo" name="windowsill-dusk.jpg" pct={62}/>
          <UploadRow kind="photo" name="kettle-take1.jpg" pct={14}/>
        </div>
      }/>
  );
}

// ============================================================
// V2 · IN-PLACE slot
// ============================================================
function V2Slot({ active = false }) {
  return (
    <div className={"dz-v2-slot " + (active ? 'active' : '')}>
      <Gd.upload className="dz-v2-glyph" width="18" height="18"/>
      <div className="dz-v2-slot-l">
        {active
          ? <><b>Drop to add 3 files</b> <span>· photos · audio · video</span></>
          : <><b>Drag &amp; drop</b> <span>files to attach</span><span> · or </span><span style={{color: 'var(--accent-ink)'}}>browse</span></>}
      </div>
      {!active && <span className="dz-v2-slot-kbd">⌘V to paste</span>}
    </div>
  );
}
function V2Idle() {
  return <ComposerShell kids={null} slot={<V2Slot/>}/>;
}
function V2DragOver() {
  return <ComposerShell kids="rain on glass · 11 minutes, two takes" slot={<V2Slot active/>}/>;
}
function V2Uploading() {
  return (
    <ComposerShell
      kids="rain on glass · 11 minutes, two takes"
      slot={
        <div className="dz-uploads">
          <UploadRow kind="audio" name="rain-on-glass-take2.wav" pct={100}/>
          <UploadRow kind="photo" name="windowsill-dusk.jpg" pct={62}/>
        </div>
      }
      footExtra={
        <button className="dz-tool" title="Add another"><Gd.plus/></button>
      }/>
  );
}

// ============================================================
// V3 · FULL-WINDOW NET
// ============================================================
function V3Idle() {
  return (
    <div className="dz-body v3">
      <ComposerShell kids={null}/>
    </div>
  );
}
function V3DragOver() {
  return (
    <div className="dz-body v3">
      <ComposerShell kids="rain on glass · 11 minutes, two takes"/>
      <div className="dz-v3-net">
        <div className="dz-v3-card">
          <div className="dz-v3-glyph"><Gd.upload/></div>
          <div className="dz-v3-card-h">Drop anywhere to attach</div>
          <div className="dz-v3-card-s">Photos, audio, and video are added to your current draft. Hashtags ignored.</div>
          <div className="dz-supports">Max 8 files · 40 MB each</div>
        </div>
      </div>
    </div>
  );
}
function V3RejectedFile() {
  return (
    <div className="dz-body v3">
      <ComposerShell
        kids="rain on glass · 11 minutes, two takes"
        slot={
          <div className="dz-uploads">
            <UploadRow kind="audio" name="rain-on-glass-take2.wav" pct={100}/>
          </div>
        }
        error="Couldn't attach “raw-master-48bit.flac” (62 MB) · 40 MB limit per file."/>
    </div>
  );
}

// ============================================================
// Page wrapper
// ============================================================
function Page({ kicker, title, sub, cheat, children, v3 = false }) {
  return (
    <div className="dz-page">
      <header className="dz-kicker-bar">
        <div className="dz-kicker">{kicker}</div>
        <h1 className="dz-kicker-h">{title}</h1>
        <p className="dz-kicker-sub">{sub}</p>
      </header>
      {cheat && (
        <div className="dz-cheat">
          {Object.entries(cheat).map(([k, v]) => (
            <React.Fragment key={k}>
              <span className="dz-cheat-k">{k}</span>
              <span>{v}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className={"dz-body " + (v3 ? 'v3' : '')}>{children}</div>
    </div>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  return (
    <DesignCanvas docTitle="Composer · drag-and-drop attachments">

      <DCSection
        id="v1"
        title="V1 · Overlay dropzone (inside the composer)"
        subtitle="When a drag enters the composer's bounds, the whole composer borders accent-purple, and a tinted overlay fades in over the input with a single 'Drop to attach' message. Cleanest when the composer is in view; the overlay sits ON TOP of any existing draft so the user knows the file replaces the focus, not the text.">

        <DCArtboard id="v1-idle" label="Idle" width={920} height={460}>
          <Page kicker="V1 · IDLE" title="Idle composer · no drag" sub="Baseline. No visible dropzone — the user discovers drop via the existing image button or by trying it." cheat={{Trigger: 'Drag enters composer bounds', Hint: 'None when idle (uses existing tool rail)'}}>
            <V1Idle/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v1-over" label="Drag-over" width={920} height={460}>
          <Page kicker="V1 · DRAG-OVER" title="File dragged over the composer" sub="Border + glow on the composer; a centered card explains the drop. The current draft stays underneath so the user knows it's preserved." cheat={{Trigger: 'dragenter on .composer', Shows: 'Centered card · supports list · file-size limit'}}>
            <V1DragOver/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v1-uploading" label="Uploading" width={920} height={620}>
          <Page kicker="V1 · UPLOADING" title="Files dropped · uploads in progress" sub="A compact row per file appears under the editor. Progress bar in the brand accent; the row stays until done and is removable from a small ✕ on the right." cheat={{Layout: '36px thumb · name · progress bar · pct · ✕', Removable: 'Until upload starts (then becomes a cancel)'}}>
            <V1Uploading/>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v2"
        title="V2 · In-place dropzone (always visible) ★"
        subtitle="A persistent dashed-line slot sits below the text input — invites a drop AT ALL TIMES, even before the user knows about the feature. Doubles as a click-to-browse target and as an explicit visual home for queued uploads.">

        <DCArtboard id="v2-idle" label="Idle" width={920} height={500}>
          <Page kicker="V2 · IDLE · RECOMMENDED" title="Persistent slot below the input" sub="A small dashed tile lives below the editor: 'Drag & drop files to attach · or browse'. Always visible — makes the affordance discoverable without ever needing to drag. Click to open the file picker. Disappears once files are queued; the upload rows take its place." cheat={{Visible: 'Always, until uploads queued', Click: 'Opens system file picker', Kbd: '⌘V to paste from clipboard'}}>
            <V2Idle/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v2-over" label="Drag-over" width={920} height={500}>
          <Page kicker="V2 · DRAG-OVER" title="Slot becomes the active target" sub="Border switches to solid accent; background fills with accent-soft; copy flips to 'Drop to add N files · photos · audio · video'. The composer outline doesn't change — the dropzone is in one place, you know exactly where the file lands." cheat={{Trigger: 'dragenter on .dz-v2-slot', Shows: 'File count from dataTransfer.items'}}>
            <V2DragOver/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v2-uploading" label="Uploading" width={920} height={620}>
          <Page kicker="V2 · UPLOADING" title="Slot replaced by upload rows" sub="Once files are queued, the dashed slot is removed and upload rows replace it. A small ✚ in the tool rail lets you queue more without hunting." cheat={{Shape: 'Upload rows · same component as V1', 'Add more': '✚ tool in the rail (replaces the slot)'}}>
            <V2Uploading/>
          </Page>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="v3"
        title="V3 · Full-window net"
        subtitle="When a drag enters the WINDOW (not just the composer), a viewport-wide overlay fades in with one big target. The user doesn't have to aim at the composer — anywhere on the page works. Inspired by Slack and Discord; biggest visual moment, but eats the whole UI.">

        <DCArtboard id="v3-idle" label="Idle" width={920} height={520}>
          <Page v3 kicker="V3 · IDLE" title="Composer · no drag" sub="Just the composer. Identical to V1 idle." cheat={{Trigger: 'dragenter on window'}}>
            <V3Idle/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3-over" label="Drag-over · full window" width={920} height={520}>
          <Page v3 kicker="V3 · DRAG-OVER" title="Window-wide drop net" sub="A semi-transparent net covers the whole viewport with a centered card. Anywhere is a drop target. The composer chrome is visible behind it so users keep their bearings; the net is dismissible by Esc." cheat={{Trigger: 'dragenter on window', Card: 'Centered · accent-soft circle · supports list', Dismiss: 'Drop anywhere · Esc · dragleave window'}}>
            <V3DragOver/>
          </Page>
        </DCArtboard>

        <DCArtboard id="v3-rejected" label="Edge · rejected file" width={920} height={560}>
          <Page v3 kicker="EDGE · REJECTED" title="File rejected (too large)" sub="When a file fails validation (size, type, or count), the partial drop still keeps the OK files and an error row appears above the tool rail. Hover the row for a 'Why?' tooltip explaining the rule." cheat={{Style: 'red left-rule + mono error text', Shows: 'Filename · failed reason · keeps successful drops'}}>
            <V3RejectedFile/>
          </Page>
        </DCArtboard>
      </DCSection>

    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
