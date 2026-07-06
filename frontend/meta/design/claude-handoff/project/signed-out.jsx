/* global React, VaporBanner, I, Post */

function SignedOutView({ posts, onSignIn }) {
  const [mode, setMode] = React.useState('signin'); // signin | signup
  const [instance, setInstance] = React.useState('pleromanet.social');
  const [showInstancePicker, setShowInstancePicker] = React.useState(false);
  const [agree, setAgree] = React.useState(false);
  const [authStep, setAuthStep] = React.useState('enter'); // enter | redirect

  const RECENTS = [
    { d: 'pleromanet.social', t: 'General · Cream', g: '#a48bd9', last: 'You · 2h ago' },
    { d: 'retro.social', t: 'Vintage tech · Open', g: '#7dc4be', last: 'gridwave · last week' },
    { d: 'kolektiva.social', t: 'Mutual aid · Curated', g: '#e7a8c9' },
    { d: 'spacebear.net', t: 'Astronomy · Friendly', g: '#e0b97a' },
  ];

  const beginAuth = () => {
    setAuthStep('redirect');
    setTimeout(() => onSignIn(), 1600);
  };

  return (
    <div className="signedout">
      <SignedOutHeader/>

      <section className="so-hero">
        <div className="so-shell">
          <div className="so-hero-grid">
            <div className="so-hero-copy">
              <div className="so-eyebrow">
                <span className="so-eyebrow-dot"></span>
                <span>Est. 2017 · Federated network · v2.4.58</span>
              </div>
              <h1 className="so-h1">
                A <em>quieter</em><br/>
                corner of the<br/>
                <span className="so-h1-accent">social web.</span>
              </h1>
              <p className="so-lede">
                PleromaNet™ is a federation of small, human-run servers — no algorithm, no ads, no scraping. You bring your voice. We keep the lights on.
              </p>
              <div className="so-stats">
                <div className="so-stat">
                  <div className="so-stat-v">12,847</div>
                  <div className="so-stat-l">Active accounts</div>
                </div>
                <div className="so-stat">
                  <div className="so-stat-v">94</div>
                  <div className="so-stat-l">Federated instances</div>
                </div>
                <div className="so-stat">
                  <div className="so-stat-v">3.2M</div>
                  <div className="so-stat-l">Posts this month</div>
                </div>
                <div className="so-stat">
                  <div className="so-stat-v">99.94%</div>
                  <div className="so-stat-l">Uptime, 90d</div>
                </div>
              </div>
              <div className="so-scroll-hint">
                <span>Read the manifesto</span>
                <svg viewBox="0 0 24 24" fill="none" style={{width: 12, height: 12}}><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
            </div>

            <div className="so-auth">
              <div className="so-auth-tabs">
                <button className={"so-auth-tab " + (mode === 'signin' ? 'active' : '')} onClick={() => setMode('signin')}>Sign in</button>
                <button className={"so-auth-tab " + (mode === 'signup' ? 'active' : '')} onClick={() => setMode('signup')}>Create account</button>
              </div>

              {authStep === 'enter' && mode === 'signin' && (
                <div className="so-auth-body">
                  <div className="so-oauth-blurb">
                    PleromaNet uses your home server to sign you in. Enter where your account lives — we'll redirect you there to authorize.
                  </div>
                  <div className="so-field">
                    <label className="so-label">Your home server</label>
                    <div className="so-input-wrap so-input-handle">
                      <span className="so-input-prefix">https://</span>
                      <input className="so-input" placeholder="your.instance" value={instance} onChange={e => setInstance(e.target.value)}/>
                      <button className="so-input-suffix" onClick={() => setShowInstancePicker(v => !v)} title="Recent servers">
                        <I.chevDown style={{width: 12, height: 12}}/>
                      </button>
                    </div>
                    {showInstancePicker && (
                      <div className="so-instance-pop">
                        <div className="so-pop-label">Recently used</div>
                        {RECENTS.map(opt => (
                          <button key={opt.d} className={"so-instance-opt " + (instance === opt.d ? 'sel' : '')} onClick={() => { setInstance(opt.d); setShowInstancePicker(false); }}>
                            <span className="so-inst-sw" style={{background: opt.g}}></span>
                            <div style={{flex: 1, minWidth: 0}}>
                              <div className="so-inst-d">{opt.d}</div>
                              <div className="so-inst-t">{opt.last || opt.t}</div>
                            </div>
                            {instance === opt.d && (
                              <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14, color: 'var(--accent-ink)'}}><path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="so-cta" onClick={beginAuth} disabled={!instance.trim()}>
                    <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14}}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>Continue to {instance || 'server'}</span>
                  </button>
                  <div className="so-oauth-chain">
                    <div className="so-chain-step done">
                      <span className="so-chain-dot"></span>
                      <span>Enter server</span>
                    </div>
                    <div className="so-chain-line"></div>
                    <div className="so-chain-step">
                      <span className="so-chain-dot"></span>
                      <span>Authorize on {instance}</span>
                    </div>
                    <div className="so-chain-line"></div>
                    <div className="so-chain-step">
                      <span className="so-chain-dot"></span>
                      <span>Return here</span>
                    </div>
                  </div>
                  <div className="so-footnote">
                    PleromaNet never sees your password. Authorization is granted by your home server via OAuth.
                  </div>
                </div>
              )}

              {authStep === 'enter' && mode === 'signup' && (
                <div className="so-auth-body">
                  <div className="so-oauth-blurb">
                    Choose a server. Each one has its own community, rules, and moderators — you can move later and keep your follows.
                  </div>
                  <div className="so-server-list">
                    {RECENTS.map(opt => (
                      <button key={opt.d} className={"so-server-card " + (instance === opt.d ? 'sel' : '')} onClick={() => setInstance(opt.d)}>
                        <span className="so-inst-sw" style={{background: opt.g, width: 22, height: 22}}></span>
                        <div style={{flex: 1, minWidth: 0, textAlign: 'left'}}>
                          <div className="so-inst-d">{opt.d}</div>
                          <div className="so-inst-t">{opt.t}</div>
                        </div>
                        <span className="so-server-radio" aria-hidden="true"></span>
                      </button>
                    ))}
                  </div>
                  <label className="so-check">
                    <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}/>
                    <span>I'm 16+ and I've read <strong>{instance}</strong>'s <a href="#">Code of Conduct</a>.</span>
                  </label>
                  <button className="so-cta" disabled={!agree} onClick={beginAuth}>
                    <svg viewBox="0 0 24 24" fill="none" style={{width: 14, height: 14}}><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span>Continue to {instance}</span>
                  </button>
                  <div className="so-footnote">
                    New accounts on <strong>{instance}</strong> are reviewed manually — usually within 24 hours.
                  </div>
                </div>
              )}

              {authStep === 'redirect' && (
                <div className="so-auth-body so-redirect">
                  <div className="so-redirect-anim">
                    <div className="so-redirect-card so-r-pn">
                      <div className="brand-mark" style={{width: 36, height: 36}}><I.sparkBig/></div>
                      <div className="so-redirect-l">PleromaNet</div>
                    </div>
                    <div className="so-redirect-arrow">
                      <svg viewBox="0 0 60 12" fill="none"><path d="M2 6h50M48 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <div className="so-redirect-card so-r-inst">
                      <div className="so-r-globe">
                        <svg viewBox="0 0 24 24" fill="none" style={{width: 22, height: 22}}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" stroke="currentColor" strokeWidth="1.4"/></svg>
                      </div>
                      <div className="so-redirect-l">{instance}</div>
                    </div>
                  </div>
                  <div className="so-redirect-title">Redirecting to {instance}…</div>
                  <div className="so-redirect-sub">Your server will ask you to authorize PleromaNet. We'll bring you right back.</div>
                  <div className="so-redirect-bar"><span></span></div>
                  <button className="so-link-sm" onClick={() => setAuthStep('enter')} style={{marginTop: 14}}>← Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="so-band">
        <div className="so-shell so-band-inner">
          <div className="so-band-item">
            <div className="so-band-num">01</div>
            <div className="so-band-t">No ads. No algorithm.</div>
            <div className="so-band-d">A reverse-chronological timeline of the people you follow. That's it.</div>
          </div>
          <div className="so-band-sep"></div>
          <div className="so-band-item">
            <div className="so-band-num">02</div>
            <div className="so-band-t">You own your follows.</div>
            <div className="so-band-d">Move servers and bring your social graph with you. ActivityPub all the way down.</div>
          </div>
          <div className="so-band-sep"></div>
          <div className="so-band-item">
            <div className="so-band-num">03</div>
            <div className="so-band-t">Run by humans.</div>
            <div className="so-band-d">Real moderators with names and faces. Funded by members, not advertisers.</div>
          </div>
        </div>
      </section>

      <section className="so-peek">
        <div className="so-shell so-peek-inner">
          <div className="so-peek-head">
            <div>
              <div className="so-peek-eyebrow">A look inside</div>
              <h2 className="so-h2">The federated timeline,<br/>right now.</h2>
            </div>
            <div className="so-peek-meta">
              <span className="so-live-dot"></span>
              <span>Live · refreshed 12s ago</span>
            </div>
          </div>
          <div className="so-peek-grid">
            <div className="so-peek-feed card">
              {posts.slice(0, 3).map(p => (
                <Post key={p.id} post={p} onAction={() => {}}/>
              ))}
              <div className="so-peek-mask">
                <button className="so-peek-cta" onClick={onSignIn}>
                  <span>Sign in to see more</span>
                  <I.arrowR style={{width: 14, height: 14}}/>
                </button>
              </div>
            </div>
            <div className="so-peek-side">
              <div className="card so-sidecard">
                <div className="so-side-h">What's trending</div>
                {[
                  { t: '#OutsideTime', c: '4,210 posts' },
                  { t: '#smallweb', c: '2,847 posts' },
                  { t: '#FedDevs', c: '1,394 posts' },
                  { t: '#cassette', c: '982 posts' },
                ].map((tr, i) => (
                  <div key={i} className="so-trend">
                    <span className="so-trend-n">{String(i+1).padStart(2,'0')}</span>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div className="so-trend-t">{tr.t}</div>
                      <div className="so-trend-c">{tr.c}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card so-sidecard so-instance-card">
                <div className="so-side-h">This instance</div>
                <div className="so-inst-row">
                  <span className="so-inst-k">Domain</span>
                  <span className="so-inst-v">pleromanet.social</span>
                </div>
                <div className="so-inst-row">
                  <span className="so-inst-k">Operator</span>
                  <span className="so-inst-v">@ada &amp; @felix</span>
                </div>
                <div className="so-inst-row">
                  <span className="so-inst-k">Region</span>
                  <span className="so-inst-v">EU-West, Frankfurt</span>
                </div>
                <div className="so-inst-row">
                  <span className="so-inst-k">Funding</span>
                  <span className="so-inst-v">Members, Patreon</span>
                </div>
                <div className="so-inst-row">
                  <span className="so-inst-k">Open registration</span>
                  <span className="so-inst-v"><span className="so-yes">Yes — reviewed</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="so-rules">
        <div className="so-shell">
          <div className="so-rules-head">
            <div className="so-eyebrow"><span className="so-eyebrow-dot"></span><span>The house rules</span></div>
            <h2 className="so-h2">Things we ask of each other.</h2>
          </div>
          <ol className="so-rules-list">
            <li>
              <span className="so-rules-n">i.</span>
              <div>
                <div className="so-rules-t">Be a person, not a brand.</div>
                <div className="so-rules-d">First-person voice. No engagement farming, no growth hacks.</div>
              </div>
            </li>
            <li>
              <span className="so-rules-n">ii.</span>
              <div>
                <div className="so-rules-t">Use content warnings.</div>
                <div className="so-rules-d">For news, politics, food, body talk. Your timeline is someone's morning coffee.</div>
              </div>
            </li>
            <li>
              <span className="so-rules-n">iii.</span>
              <div>
                <div className="so-rules-t">Alt-text your images.</div>
                <div className="so-rules-d">Everyone deserves to see your dog. The composer reminds you.</div>
              </div>
            </li>
            <li>
              <span className="so-rules-n">iv.</span>
              <div>
                <div className="so-rules-t">Disagree gently.</div>
                <div className="so-rules-d">If you wouldn't say it across a table, don't post it across a network.</div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <footer className="so-footer">
        <div className="so-shell so-footer-inner">
          <div className="so-foot-brand">
            <div className="brand-mark"><I.sparkBig/></div>
            <div>
              <div className="brand-name" style={{fontSize: 20}}>PleromaNet<sup>™</sup></div>
              <div className="so-foot-tag">A federated social web · est. 2017</div>
            </div>
          </div>
          <div className="so-foot-cols">
            <div>
              <div className="so-foot-h">Instance</div>
              <a href="#">About</a>
              <a href="#">Server rules</a>
              <a href="#">Moderators</a>
              <a href="#">Status &amp; uptime</a>
            </div>
            <div>
              <div className="so-foot-h">Network</div>
              <a href="#">Browse instances</a>
              <a href="#">What is ActivityPub?</a>
              <a href="#">Developer API</a>
              <a href="#">Federation log</a>
            </div>
            <div>
              <div className="so-foot-h">Apps</div>
              <a href="#">iOS · TestFlight</a>
              <a href="#">Android · F-Droid</a>
              <a href="#">CLI client</a>
              <a href="#">RSS bridge</a>
            </div>
            <div>
              <div className="so-foot-h">Support</div>
              <a href="#">Member dues</a>
              <a href="#">Patreon</a>
              <a href="#">Donate once</a>
              <a href="#">Merch shop</a>
            </div>
          </div>
        </div>
        <div className="so-shell so-foot-bottom">
          <span>© 2026 PleromaNet™ collective</span>
          <span className="so-foot-dot"></span>
          <span>Made with care in Frankfurt, Lisbon, &amp; Mexico City</span>
          <span className="so-foot-dot"></span>
          <span className="so-foot-mono">v2.4.58 / build 8a1c2f</span>
        </div>
      </footer>
    </div>
  );
}

function SignedOutHeader() {
  return (
    <header className="so-header">
      <div className="so-shell so-header-inner">
        <div className="brand">
          <div className="brand-mark"><I.sparkBig/></div>
          <div>
            <div className="brand-name">PleromaNet<sup>™</sup></div>
          </div>
          <div className="brand-tag">A federated<br/>social web</div>
        </div>
        <nav className="so-nav">
          <a href="#">Manifesto</a>
          <a href="#">Instances</a>
          <a href="#">Apps</a>
          <a href="#">Support</a>
        </nav>
        <div className="so-header-right">
          <a href="#" className="so-link-sm">Browse public</a>
          <button className="so-mini-cta">
            <span>Sign in</span>
            <I.arrowR style={{width: 12, height: 12}}/>
          </button>
        </div>
      </div>
    </header>
  );
}

window.SignedOutView = SignedOutView;
