/* global React, I, VaporBanner, Avatar, Card, CardHead, CardFoot, Toggle, StatStrip, Button */
const { useState: useStateS } = React;

// ============ Profile / Settings ============
function ProfileSettings({ tab, profile, setProfile }) {
  const [dirty, setDirty] = useStateS(false);
  const update = (k, v) => { setProfile({...profile, [k]: v}); setDirty(true); };
  const reset = () => { setDirty(false); };

  return (
    <div className="card" style={{padding: '24px 32px 28px'}}>
      <div className="crumbs">
        <span>Settings</span>
        <span className="sep">/</span>
        <span className="now">{tab}</span>
      </div>
      <div className="page-title">{tab}</div>
      <div className="page-sub">Manage your profile information and how you appear to others.</div>

      <div className="field">
        <div className="field-label">Avatar</div>
        <div>
          <div className="upload-row">
            <div className="avatar-preview"><VaporBanner variant="sunset"/></div>
            <button className="btn-upload"><span>Change avatar</span><I.upload style={{width: 14, height: 14}}/></button>
          </div>
          <div className="field-help">JPG, PNG or GIF. Max size 2MB.</div>
        </div>
      </div>

      <div className="field">
        <div className="field-label">Banner</div>
        <div>
          <div className="upload-row">
            <div className="banner-preview"><VaporBanner variant="sunset"/></div>
            <button className="btn-upload"><span>Change banner</span></button>
          </div>
          <div className="field-help">Recommended size 1500×500. JPG, PNG or GIF. Max size 5MB.</div>
        </div>
      </div>

      <div className="field">
        <div className="field-label">Display name</div>
        <div>
          <input className="input" value={profile.displayName} onChange={e => update('displayName', e.target.value)}/>
          <div className="field-help">The name shown on your profile.</div>
        </div>
      </div>

      <div className="field">
        <div className="field-label">Username</div>
        <div>
          <div className="split-row">
            <input className="input" value={profile.username} onChange={e => update('username', e.target.value)}/>
            <select className="select" value={profile.instance} onChange={e => update('instance', e.target.value)}>
              <option>@pleromanet.social</option>
              <option>@kolektiva.social</option>
              <option>@retro.social</option>
            </select>
          </div>
          <div className="field-help">Your unique handle on this server.</div>
        </div>
      </div>

      <div className="field">
        <div className="field-label">Bio</div>
        <div>
          <textarea className="textarea" value={profile.bio} onChange={e => update('bio', e.target.value)}/>
          <div className="input-counter">{profile.bio.length} / 160</div>
        </div>
      </div>

      <div className="field" style={{borderBottom: 'none'}}>
        <div className="field-label">Website</div>
        <div className="split-row" style={{gridTemplateColumns: '1fr 1fr'}}>
          <div>
            <input className="input" value={profile.website} onChange={e => update('website', e.target.value)}/>
            <div className="field-help">Your website or personal link.</div>
          </div>
          <div>
            <div style={{fontSize: 13.5, color: 'var(--ink-2)', fontWeight: 500, marginBottom: 6}}>Location</div>
            <input className="input" value={profile.location} onChange={e => update('location', e.target.value)}/>
            <div className="field-help">You can leave this blank.</div>
          </div>
        </div>
      </div>

      <div style={{marginTop: 12}}>
        <ToggleRow
          title="Discoverable" help="Allow others to find you in search and suggestions."
          on={profile.discoverable} onChange={v => update('discoverable', v)}/>
        <ToggleRow
          title="Indexable" help="Allow search engines to index your profile and posts."
          on={profile.indexable} onChange={v => update('indexable', v)}/>
        <ToggleRow
          title="Show follower count" help="Display the number of followers on your profile."
          on={profile.showFollowers} onChange={v => update('showFollowers', v)}/>
      </div>

      <div className="form-foot">
        <button className="btn-primary" onClick={() => setDirty(false)}>Save changes</button>
        <button className="btn-secondary" onClick={reset}>Reset</button>
        <span className="saved">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
      </div>
    </div>
  );
}

function ToggleRow({ title, help, on, onChange }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-title">{title}</div>
        <div className="toggle-help">{help}</div>
      </div>
      <Toggle on={on} onChange={onChange}/>
    </div>
  );
}

// ============ Right column for Profile Settings ============
function ProfilePreviewCard() {
  return (
    <Card style={{overflow: 'hidden'}}>
      <div style={{padding: '14px 16px 8px', borderBottom: '1px solid var(--border)'}}>
        <div style={{fontSize: 13, fontWeight: 600, color: 'var(--ink)'}}>Profile preview</div>
      </div>
      <div style={{position: 'relative'}}>
        <div className="preview-banner">
          <VaporBanner variant="sunset"/>
          <button className="preview-edit">Edit preview <I.ext style={{width: 11, height: 11}}/></button>
        </div>
        <div className="preview-av-wrap">
          <VaporBanner variant="sunset"/>
        </div>
      </div>
      <div style={{padding: '38px 16px 14px'}}>
        <div style={{fontFamily: 'var(--serif)', fontSize: 22, lineHeight: 1, fontWeight: 500}}>dreambyte</div>
        <div style={{color: 'var(--accent-ink)', fontSize: 12.5, marginTop: 4}}>@dreambyte@pleromanet.social</div>
        <div style={{fontSize: 13, color: 'var(--ink-2)', marginTop: 10}}>living in a soft world</div>
        <div style={{marginTop: 14}}>
          <StatStrip items={[
            { label: 'Posts', value: '1,248' },
            { label: 'Following', value: '312' },
            { label: 'Followers', value: '1,921' },
          ]}/>
        </div>
        <div style={{fontSize: 11.5, color: 'var(--muted)', marginTop: 12, textAlign: 'center', paddingTop: 12, borderTop: '1px solid var(--border)'}}>
          This is how your profile appears to other users.
        </div>
      </div>
    </Card>
  );
}

function ProfileTipsCard() {
  const tips = [
    { ico: I.image, text: 'Your avatar will be shown at 96×96px.' },
    { ico: I.users, text: 'The banner helps personalize your profile.' },
    { ico: I.ext, text: 'Link your website to drive traffic.' },
    { ico: I.info, text: 'A good bio helps others find you.' },
  ];
  return (
    <Card>
      <CardHead style={{borderBottom: 'none', paddingBottom: 4}}>
        <span style={{fontSize: 13, fontWeight: 600, color: 'var(--ink)'}}>
          <I.info style={{width: 14, height: 14, marginRight: 6, verticalAlign: 'middle', color: 'var(--muted)'}}/>
          Profile tips
        </span>
      </CardHead>
      <div style={{padding: '4px 0 8px'}}>
        {tips.map((t, i) => {
          const Ico = t.ico;
          return (
            <div key={i} style={{display: 'grid', gridTemplateColumns: '20px 1fr', gap: 10, padding: '8px 16px', alignItems: 'center', fontSize: 12.5, color: 'var(--ink-2)'}}>
              <Ico style={{width: 14, height: 14, color: 'var(--muted)'}}/>
              <span>{t.text}</span>
            </div>
          );
        })}
      </div>
      <CardFoot>Learn more about profiles →</CardFoot>
    </Card>
  );
}

Object.assign(window, { ProfileSettings, ProfilePreviewCard, ProfileTipsCard });
