<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		buildAuthorizationUrl,
		createOAuthState,
		registerOAuthApp,
		readPleromaSession,
		storePendingOAuth
	} from '$lib/pleroma';
	import type { PendingPleromaOAuth, PleromaScope } from '$lib/pleroma';
	import Icon from '$lib/rebuild/Icon.svelte';
	import { onMount } from 'svelte';

	type AuthMode = 'signin' | 'signup';
	type AuthStep = 'enter' | 'redirect';
	type RecentServer = {
		domain: string;
		description: string;
		swatch: string;
		last?: string;
	};

	const scopes = ['read', 'write', 'follow'] as const satisfies readonly PleromaScope[];
	const recentServers: RecentServer[] = [
		{ domain: 'pleromanet.social', description: 'General · Cream', swatch: '#a48bd9', last: 'You · 2h ago' },
		{ domain: 'retro.social', description: 'Vintage tech · Open', swatch: '#7dc4be', last: 'gridwave · last week' },
		{ domain: 'kolektiva.social', description: 'Mutual aid · Curated', swatch: '#e7a8c9' },
		{ domain: 'spacebear.net', description: 'Astronomy · Friendly', swatch: '#e0b97a' }
	];

	let mode = $state<AuthMode>('signin');
	let authStep = $state<AuthStep>('enter');
	let instance = $state('pleromanet.social');
	let showInstancePicker = $state(false);
	let agreedToServerRules = $state(false);
	let authorizationUrl = $state('');
	let authError = $state('');
	let authAttempt = 0;

	const selectedInstanceUrl = $derived((() => {
		const trimmed = instance.trim().replace(/\/$/, '');
		return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	})());
	const continueDisabled = $derived(!instance.trim() || (mode === 'signup' && !agreedToServerRules));

	const selectMode = (nextMode: AuthMode) => {
		mode = nextMode;
	authStep = 'enter';
		authError = '';
		authorizationUrl = '';
		showInstancePicker = false;
	};
	const selectInstance = (domain: string) => {
		instance = domain;
		showInstancePicker = false;
	};
	const cancelRedirect = () => {
		authAttempt += 1;
		authStep = 'enter';
		authError = '';
		authorizationUrl = '';
		sessionStorage.removeItem('pleromanet.oauth.pending');
	};
	const startOAuth = async () => {
		if (continueDisabled) return;

		const attempt = authAttempt + 1;
		authAttempt = attempt;
		authStep = 'redirect';
		authError = '';
		authorizationUrl = '';

		const redirectUri = `${window.location.origin}/auth/callback`;
		try {
			const app = await registerOAuthApp({
				instanceUrl: selectedInstanceUrl,
				clientName: 'PleromaNet',
				redirectUri,
				scopes,
				website: window.location.origin,
				fetch: window.fetch.bind(window)
			});

			if (attempt !== authAttempt || authStep !== 'redirect') return;

			const state = createOAuthState();
			const pending = {
				instanceUrl: selectedInstanceUrl,
				clientId: app.clientId,
				clientSecret: app.clientSecret,
				redirectUri,
				scopes,
				state,
				createdAt: Date.now()
			} satisfies PendingPleromaOAuth;
			const url = buildAuthorizationUrl({
				instanceUrl: selectedInstanceUrl,
				clientId: app.clientId,
				redirectUri,
				scopes,
				state
			});

			storePendingOAuth(sessionStorage, pending);
			authorizationUrl = url;
		} catch (error) {
			if (attempt !== authAttempt) return;
			authError = error instanceof Error ? error.message : 'Could not start OAuth with this server.';
		}
	};

	onMount(() => {
		if (readPleromaSession(localStorage)) goto('/app/home');
	});
</script>

<svelte:head>
	<title>PleromaNet · Landing</title>
</svelte:head>

<div class="signedout">
	<header class="so-header" aria-label="PleromaNet landing">
		<div class="so-shell so-header-inner">
			<a class="so-brand" href="/" aria-label="PleromaNet home">
				<span class="brand-mark"><Icon name="sparkBig" /></span>
				<span class="brand-name">PleromaNet<sup>TM</sup></span>
			</a>
			<nav class="so-nav" aria-label="Public links">
				<a href="/public">Browse public</a>
				<a href="/public">Federation log</a>
				<a href="/design-system">Design system</a>
			</nav>
			<a class="so-mini-cta" href="/public">Open public timeline</a>
		</div>
	</header>

	<section class="so-hero">
		<div class="so-shell so-hero-grid">
			<div class="so-copy">
				<div class="so-eyebrow"><span></span> Est. 2017 · Federated network · Pleroma first</div>
				<h1>A quieter corner of the social web.</h1>
				<p class="so-lede">PleromaNet is a federation of small, human-run servers with no algorithm, no ads, no scraping. You bring your voice. We keep the lights on.</p>
				<div class="so-stats" aria-label="Network statistics">
					<div><strong>12,847</strong><span>Active accounts</span></div>
					<div><strong>94</strong><span>Federated instances</span></div>
					<div><strong>3.2M</strong><span>Posts this month</span></div>
				</div>
			</div>

			<section id="oauth" class="so-auth" aria-label="Pleroma authorization">
				<div class="so-auth-tabs" role="tablist" aria-label="Authentication mode">
					<button type="button" role="tab" aria-selected={mode === 'signin'} class:active={mode === 'signin'} onclick={() => selectMode('signin')}>Sign in</button>
					<button type="button" role="tab" aria-selected={mode === 'signup'} class:active={mode === 'signup'} onclick={() => selectMode('signup')}>Create account</button>
				</div>

				{#if authStep === 'enter' && mode === 'signin'}
					<div class="so-auth-body">
						<p class="so-blurb">PleromaNet uses your home server to sign you in. Enter where your account lives and we will redirect you there to authorize.</p>
						<div class="so-field">
							<label for="instance">Your home server</label>
							<div class="so-input-wrap">
								<span>https://</span>
								<input id="instance" aria-label="Your home server" value={instance} oninput={(event) => (instance = event.currentTarget.value)} placeholder="your.instance" />
								<button type="button" class="so-picker-btn" aria-expanded={showInstancePicker} onclick={() => (showInstancePicker = !showInstancePicker)}>Recent servers</button>
							</div>
							{#if showInstancePicker}
								<div class="so-instance-pop" role="listbox" aria-label="Recent servers">
									{#each recentServers as server}
										<button type="button" role="option" aria-selected={instance === server.domain} class="so-instance-opt" class:sel={instance === server.domain} onclick={() => selectInstance(server.domain)}>
											<span class="so-swatch" style:background={server.swatch}></span>
											<span><strong>{server.domain}</strong><small>{server.last ?? server.description}</small></span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
						<button type="button" class="so-cta" disabled={continueDisabled} onclick={startOAuth}>Continue to {instance || 'server'}</button>
						<div class="so-chain">Enter server · Authorize on {instance || 'server'} · Return here</div>
						<p class="so-footnote">PleromaNet never sees your password. Authorization is granted by your home server via OAuth.</p>
					</div>
				{:else if authStep === 'enter' && mode === 'signup'}
					<div class="so-auth-body">
						<p class="so-blurb">Choose a server. Each one has its own community, rules, and moderators; you can move later and keep your follows.</p>
						<div class="so-server-list">
							{#each recentServers as server}
								<button type="button" class="so-server-card" class:sel={instance === server.domain} onclick={() => selectInstance(server.domain)}>
									<span class="so-swatch" style:background={server.swatch}></span>
									<span><strong>{server.domain}</strong><small>{server.description}</small></span>
								</button>
							{/each}
						</div>
						<label class="so-check">
							<input type="checkbox" bind:checked={agreedToServerRules} />
							<span>I'm 16+ and I've read <strong>{instance}</strong>'s Code of Conduct.</span>
						</label>
						<button type="button" class="so-cta" disabled={continueDisabled} onclick={startOAuth}>Continue to {instance}</button>
						<p class="so-footnote">New accounts on <strong>{instance}</strong> are reviewed manually, usually within 24 hours.</p>
					</div>
				{:else}
					<div class="so-auth-body so-redirect">
						<div class="so-redirect-mark"><span class="brand-mark"><Icon name="sparkBig" /></span><Icon name="arrow" /><span class="so-globe"><Icon name="globe" /></span></div>
						<h2>Redirecting to {instance}</h2>
						<p>Your server will ask you to authorize PleromaNet. We will bring you right back.</p>
						{#if authorizationUrl}
							<a class="so-cta so-auth-link" href={authorizationUrl}>Open {instance} authorization</a>
						{:else if authError}
							<p class="so-error">{authError}</p>
						{:else}
							<div class="so-chain" role="status">Preparing secure OAuth request...</div>
						{/if}
						<button type="button" class="so-cancel" onclick={cancelRedirect}>Cancel redirect</button>
					</div>
				{/if}
			</section>
		</div>
	</section>

	<section class="so-band" aria-label="Principles">
		<div class="so-shell so-band-inner">
			<div><span>01</span><strong>No ads. No algorithm.</strong><p>A reverse-chronological timeline of the people you follow. That is it.</p></div>
			<div><span>02</span><strong>You own your follows.</strong><p>Move servers and bring your social graph with you. ActivityPub all the way down.</p></div>
			<div><span>03</span><strong>Run by humans.</strong><p>Real moderators with names and faces. Funded by members, not advertisers.</p></div>
		</div>
	</section>

	<section class="so-peek so-shell">
		<div>
			<p class="so-eyebrow">A look inside</p>
			<h2>The federated timeline, right now.</h2>
		</div>
		<a href="/public">View public timeline</a>
	</section>

	<section class="so-rules so-shell">
		<h2>Things we ask of each other.</h2>
		<p>Be generous with context, use content warnings when needed, and remember there are people on the other side of the screen.</p>
	</section>
</div>

<style>
	.signedout { min-height: 100vh; background: var(--bg); color: var(--ink); }
	.so-shell { width: min(1200px, calc(100vw - 48px)); margin: 0 auto; }
	.so-header { position: sticky; top: 0; z-index: 30; border-bottom: 1px solid var(--border); background: color-mix(in srgb, var(--panel) 94%, transparent); backdrop-filter: blur(12px); }
	.so-header-inner { display: flex; align-items: center; gap: 24px; min-height: 68px; }
	.so-brand { display: inline-flex; align-items: center; gap: 12px; }
	.so-nav { display: flex; flex: 1; gap: 20px; }
	.so-nav a, .so-mini-cta { font-size: 13px; color: var(--ink-2); }
	.so-nav a:hover, .so-mini-cta:hover { color: var(--accent-ink); }
	.so-mini-cta { padding: 8px 12px; border: 1px solid var(--border); border-radius: 999px; background: var(--panel); }
	.so-hero { padding: clamp(36px, 7vw, 88px) 0; border-bottom: 1px solid var(--border); }
	.so-hero-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr); gap: clamp(28px, 6vw, 72px); align-items: start; }
	.so-eyebrow { display: inline-flex; align-items: center; gap: 8px; margin: 0 0 14px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
	.so-eyebrow span { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
	h1 { max-width: 680px; margin: 0; font-family: var(--serif); font-size: clamp(48px, 8vw, 88px); font-weight: 400; line-height: 0.96; letter-spacing: -0.04em; }
	.so-lede { max-width: 560px; margin: 24px 0 34px; color: var(--ink-2); font-size: 18px; line-height: 1.55; }
	.so-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--border-strong); border-bottom: 1px solid var(--border-strong); }
	.so-stats div { padding: 16px 14px; border-right: 1px solid var(--border); }
	.so-stats div:last-child { border-right: 0; }
	.so-stats strong { display: block; font-family: var(--serif); font-size: 28px; font-weight: 500; line-height: 1; color: var(--accent-ink); }
	.so-stats span { display: block; margin-top: 6px; font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
	.so-auth { overflow: hidden; border: 1px solid var(--border-strong); border-radius: var(--radius-lg); background: var(--panel); box-shadow: 0 24px 60px rgba(28, 32, 70, 0.08), 0 2px 8px rgba(28, 32, 70, 0.04); }
	.so-auth-tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--border); background: var(--panel-2); }
	.so-auth-tabs button { position: relative; padding: 14px; border-right: 1px solid var(--border); color: var(--muted); font-size: 13px; font-weight: 600; }
	.so-auth-tabs button:last-child { border-right: 0; }
	.so-auth-tabs button.active { background: var(--panel); color: var(--accent-ink); }
	.so-auth-tabs button.active::after { content: ''; position: absolute; right: 0; bottom: -1px; left: 0; height: 2px; background: var(--accent); }
	.so-auth-body { padding: 22px; }
	.so-blurb { margin: 0 0 18px; color: var(--ink-2); font-size: 13px; line-height: 1.55; }
	.so-field { position: relative; margin-bottom: 14px; }
	.so-field label { display: block; margin-bottom: 6px; font-family: var(--mono); font-size: 9.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
	.so-input-wrap { display: flex; align-items: stretch; border: 1px solid var(--border-strong); border-radius: 4px; background: var(--panel-2); }
	.so-input-wrap:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
	.so-input-wrap > span { padding: 11px 4px 11px 12px; color: var(--muted); font-size: 14px; }
	.so-input-wrap input { min-width: 0; flex: 1; padding: 11px 10px 11px 0; border: 0; outline: 0; background: transparent; font-size: 14px; }
	.so-picker-btn { padding: 0 12px; border-left: 1px solid var(--border); background: var(--accent-soft-2); color: var(--accent-ink); font-size: 12px; white-space: nowrap; }
	.so-instance-pop { position: absolute; top: calc(100% + 6px); right: 0; left: 0; z-index: 20; padding: 4px; border: 1px solid var(--border-strong); border-radius: 4px; background: var(--panel); box-shadow: 0 12px 30px rgba(28, 32, 70, 0.1); }
	.so-instance-opt, .so-server-card { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border-radius: 4px; text-align: left; }
	.so-instance-opt:hover, .so-instance-opt.sel, .so-server-card:hover, .so-server-card.sel { background: var(--accent-soft-2); }
	.so-swatch { width: 18px; height: 18px; flex-shrink: 0; border: 1px solid var(--border); border-radius: 50%; }
	.so-instance-opt span:last-child, .so-server-card span:last-child { min-width: 0; }
	.so-instance-opt strong, .so-server-card strong { display: block; color: var(--ink); font-size: 13px; }
	.so-instance-opt small, .so-server-card small { display: block; margin-top: 1px; color: var(--muted); font-size: 11px; }
	.so-cta { display: inline-flex; align-items: center; justify-content: center; width: 100%; min-height: 42px; padding: 11px 16px; border: 1px solid var(--accent-ink); border-radius: 4px; background: var(--accent-ink); color: white; font-weight: 700; }
	.so-cta:hover { background: var(--ink); border-color: var(--ink); }
	.so-cta:disabled { cursor: not-allowed; opacity: 0.55; background: var(--muted-2); border-color: var(--muted-2); }
	.so-auth-link { text-decoration: none; }
	.so-chain { margin-top: 14px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
	.so-footnote { margin: 14px 0 0; color: var(--muted); font-size: 11.5px; line-height: 1.5; }
	.so-server-list { display: grid; gap: 8px; margin-bottom: 14px; }
	.so-check { display: flex; align-items: flex-start; gap: 8px; margin: 8px 0 12px; color: var(--ink-2); font-size: 12.5px; line-height: 1.45; }
	.so-check input { margin-top: 2px; accent-color: var(--accent-ink); }
	.so-redirect { text-align: center; }
	.so-redirect-mark { display: flex; align-items: center; justify-content: center; gap: 18px; margin-bottom: 16px; color: var(--muted); }
	.so-redirect-mark .brand-mark, .so-globe { width: 42px; height: 42px; }
	.so-globe { display: grid; place-items: center; border: 1px solid var(--border); border-radius: 4px; color: var(--accent-ink); background: var(--panel-2); }
	.so-redirect h2 { margin: 0 0 8px; font-family: var(--serif); font-size: 30px; font-weight: 500; line-height: 1; }
	.so-redirect p { margin: 0 auto 16px; max-width: 34ch; color: var(--muted); }
	.so-cancel { margin-top: 14px; color: var(--muted); font-size: 12px; }
	.so-cancel:hover { color: var(--accent-ink); }
	.so-error { color: var(--bad); }
	.so-band { padding: 30px 0; background: var(--ink); color: var(--panel); }
	.so-band-inner { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; }
	.so-band span { display: block; margin-bottom: 8px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; color: rgba(255,255,255,0.5); }
	.so-band strong { display: block; font-family: var(--serif); font-size: 22px; font-weight: 500; line-height: 1.15; }
	.so-band p { margin: 6px 0 0; color: rgba(255,255,255,0.7); font-size: 13px; line-height: 1.5; }
	.so-peek, .so-rules { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding-top: 64px; padding-bottom: 64px; border-bottom: 1px solid var(--border); }
	.so-peek h2, .so-rules h2 { margin: 0; font-family: var(--serif); font-size: clamp(32px, 5vw, 48px); font-weight: 400; line-height: 1.05; }
	.so-peek a { color: var(--accent-ink); }
	.so-rules { display: block; }
	.so-rules p { max-width: 58ch; color: var(--muted); }

	@media (max-width: 880px) {
		.so-shell { width: min(100% - 28px, 1200px); }
		.so-header-inner { gap: 12px; min-height: 58px; }
		.so-nav { display: flex; flex: initial; margin-left: auto; }
		.so-nav a:not(:first-child) { display: none; }
		.so-mini-cta { margin-left: auto; }
		.so-hero-grid { grid-template-columns: minmax(0, 1fr); }
		.so-stats, .so-band-inner { grid-template-columns: minmax(0, 1fr); }
		.so-stats div { border-right: 0; border-bottom: 1px solid var(--border); }
		.so-stats div:last-child { border-bottom: 0; }
	}

	@media (max-width: 560px) {
		.so-header .brand-mark { width: 36px; height: 36px; }
		.so-header .brand-name { font-size: 22px; }
		.so-mini-cta { display: none; }
		.so-hero { padding-top: 28px; }
		.so-auth-body { padding: 18px; }
		.so-input-wrap { flex-wrap: wrap; }
		.so-picker-btn { width: 100%; min-height: 36px; border-top: 1px solid var(--border); border-left: 0; }
		.so-peek { display: block; }
		.so-peek a { display: inline-block; margin-top: 18px; }
	}
</style>
