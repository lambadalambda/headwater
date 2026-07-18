<script lang="ts">
	import { goto } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import {
		buildAuthorizationUrl,
		clearPendingOAuth,
		createOAuthState,
		defaultHeadwaterInstanceUrl,
		fetchHeadwaterStatus,
		HEADWATER_DEFAULT_RELAY,
		HEADWATER_OAUTH_SCOPES,
		normalizeInstanceUrl,
		readPleromaOAuthClient,
		readPleromaSession,
		registerOAuthApp,
		removePleromaOAuthClient,
		restoreHeadwater,
		signupHeadwater,
		storePendingOAuth,
		storePleromaOAuthClient
	} from '$lib/pleroma';
	import type { PendingPleromaOAuth, PleromaOAuthClientRegistration } from '$lib/pleroma';
	import HeadwaterLogo from '$lib/rebuild/HeadwaterLogo.svelte';
	import { onMount } from 'svelte';

	type AuthMode = 'signin' | 'signup';
	type AuthStep = 'enter' | 'signup-success' | 'restore-success' | 'redirect';
	type SignupView = 'create' | 'restore';
	type DesktopClient = Readonly<{ origin: string; clientId: string; clientSecret: string }>;

	const scopes = HEADWATER_OAUTH_SCOPES;
	let environmentReady = $state(false);
	let desktop = $state(false);
	let desktopOrigin = $state('');
	let configured = $state(false);
	let startupError = $state('');
	let mode = $state<AuthMode>('signin');
	let signupView = $state<SignupView>('create');
	let authStep = $state<AuthStep>('enter');
	let instance = $state('');
	let showAdvanced = $state(false);
	let authorizationUrl = $state('');
	let authError = $state('');
	let enrollmentCode = $state('');
	let storageReady = $state(false);
	let reusableClient = $state(false);
	let authAttempt = 0;

	let displayName = $state('');
	let relay = $state(HEADWATER_DEFAULT_RELAY);
	let signupPending = $state(false);
	let signupError = $state('');
	let signupAddress = $state('');

	let restoreFile = $state<File | null>(null);
	let desktopBackupFilename = $state('');
	let restorePassphrase = $state('');
	let restorePending = $state(false);
	let restoreError = $state('');
	let restoredAddress = $state('');

	const selectedInstanceUrl = $derived((() => {
		const trimmed = instance.trim().replace(/\/$/, '');
		return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	})());
	const desktopBridgeAvailable = $derived((() => {
		if (!desktopOrigin) return false;
		try { return normalizeInstanceUrl(selectedInstanceUrl) === desktopOrigin; } catch { return false; }
	})());
	const continueDisabled = $derived(!instance.trim() || (!reusableClient && !enrollmentCode.trim() && !desktopBridgeAvailable));
	const isDefaultRelay = (value: string) => {
		try {
			const url = new URL(value.trim());
			return url.origin === HEADWATER_DEFAULT_RELAY && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
		} catch { return !value.trim(); }
	};
	const customRelaySelected = $derived(!isDefaultRelay(relay));
	const signupDisabled = $derived(!displayName.trim() || signupPending || (!desktop && customRelaySelected && !enrollmentCode.trim()));
	const restoreDisabled = $derived((desktop ? !desktopBackupFilename : !restoreFile) || !restorePassphrase || restorePending);

	const selectMode = (next: AuthMode) => {
		mode = next;
		authStep = 'enter';
		authError = '';
		signupError = '';
		restoreError = '';
		signupView = 'create';
	};
	const selectSignupView = (next: SignupView) => {
		signupView = next;
		signupError = '';
		restoreError = '';
	};
	const cancelRedirect = () => {
		authAttempt += 1;
		authStep = 'enter';
		authError = '';
		authorizationUrl = '';
		clearPendingOAuth(sessionStorage);
	};
	const registerDesktopOAuthClient = async () => {
		if (!desktopBridgeAvailable) return null;
		try { return await window.headwaterDesktop?.registerOAuthClient() ?? null; } catch { return null; }
	};

	const startOAuth = async (providedDesktopClient?: DesktopClient) => {
		if (!instance.trim()) return;
		const attempt = authAttempt + 1;
		authAttempt = attempt;
		authStep = 'redirect';
		authError = '';
		authorizationUrl = '';
		try {
			const instanceUrl = normalizeInstanceUrl(selectedInstanceUrl);
			if (providedDesktopClient && (providedDesktopClient.origin !== instanceUrl || providedDesktopClient.origin !== desktopOrigin)) {
				throw new Error('The desktop client does not match this Headwater installation.');
			}
			const redirectUri = `${window.location.origin}/auth/callback`;
			const code = enrollmentCode.trim();
			let desktopClient = providedDesktopClient;
			let app: PleromaOAuthClientRegistration | null = providedDesktopClient ? {
				instanceUrl,
				clientId: providedDesktopClient.clientId,
				clientSecret: providedDesktopClient.clientSecret,
				redirectUri,
				scopes,
				createdAt: Date.now()
			} : code ? null : readPleromaOAuthClient(localStorage, { instanceUrl, redirectUri, scopes });
			if (!app) {
				const registered = code ? await registerOAuthApp({
					instanceUrl,
					clientName: 'Headwater',
					redirectUri,
					scopes,
					enrollmentCode: code,
					website: window.location.origin,
					fetch: window.fetch.bind(window)
				}) : await registerDesktopOAuthClient();
				if (!registered) throw new Error(desktop ? 'Headwater could not prepare local sign-in. Try again.' : 'Enter the one-time enrollment code.');
				app = { instanceUrl, clientId: registered.clientId, clientSecret: registered.clientSecret, redirectUri, scopes, createdAt: Date.now() };
				if (!code) desktopClient = { origin: instanceUrl, clientId: registered.clientId, clientSecret: registered.clientSecret };
				storePleromaOAuthClient(localStorage, app);
				reusableClient = true;
				enrollmentCode = '';
			}
			if (desktopClient) {
				storePleromaOAuthClient(localStorage, app);
				try { await window.headwaterDesktop?.acknowledgeOAuthClient(desktopClient.clientId); } catch { /* retained by main for retry */ }
			}
			if (attempt !== authAttempt || authStep !== 'redirect') return;
			const state = createOAuthState();
			const pending = { instanceUrl, clientId: app.clientId, clientSecret: app.clientSecret, redirectUri, scopes, state, createdAt: Date.now() } satisfies PendingPleromaOAuth;
			const url = buildAuthorizationUrl({ instanceUrl, clientId: app.clientId, redirectUri, scopes, state });
			storePendingOAuth(sessionStorage, pending);
			authorizationUrl = url;
			if (desktop && instanceUrl === desktopOrigin) window.location.assign(url);
		} catch (error) {
			if (attempt !== authAttempt) return;
			authError = error instanceof Error ? error.message : 'Headwater could not start sign-in.';
		}
	};

	const selectDesktopBackup = async () => {
		restoreError = '';
		try {
			const selected = await window.headwaterDesktop?.selectBackup();
			desktopBackupFilename = selected?.filename ?? '';
		} catch (error) {
			restoreError = error instanceof Error ? error.message : 'Headwater could not open that backup.';
		}
	};

	const submitRestore = async () => {
		if (restoreDisabled) return;
		restorePending = true;
		restoreError = '';
		try {
			const operationOrigin = normalizeInstanceUrl(selectedInstanceUrl);
			let client: DesktopClient | null = null;
			if (desktop) {
				const result = await window.headwaterDesktop!.restoreAccount(restorePassphrase);
				restoredAddress = result.acct;
				client = result.client;
			} else {
				const result = await restoreHeadwater({
					instanceUrl: operationOrigin,
					file: restoreFile as File,
					passphrase: restorePassphrase,
					fetch: window.fetch.bind(window)
				});
				restoredAddress = result.acct;
			}
			instance = operationOrigin;
			removePleromaOAuthClient(localStorage, operationOrigin);
			reusableClient = false;
			enrollmentCode = '';
			restorePending = false;
			if (client) await startOAuth(client);
			else authStep = 'restore-success';
		} catch (error) {
			restorePending = false;
			if (error && typeof error === 'object' && 'kind' in error && 'message' in error && typeof error.message === 'string') restoreError = error.message;
			else restoreError = error instanceof Error ? error.message : 'Headwater could not restore this backup.';
		}
	};

	const submitSignup = async () => {
		if (signupDisabled) return;
		signupPending = true;
		signupError = '';
		try {
			const operationOrigin = normalizeInstanceUrl(selectedInstanceUrl);
			let client: DesktopClient | null = null;
			if (desktop) {
				const result = await window.headwaterDesktop!.createAccount({ displayName: displayName.trim() });
				signupAddress = result.acct;
				client = result.client;
			} else {
				const result = await signupHeadwater({
					instanceUrl: operationOrigin,
					displayName: displayName.trim(),
					relay: relay.trim() || undefined,
					enrollmentCode: customRelaySelected ? enrollmentCode.trim() : undefined,
					fetch: window.fetch.bind(window)
				});
				signupAddress = result.acct;
			}
			configured = true;
			instance = operationOrigin;
			removePleromaOAuthClient(localStorage, operationOrigin);
			reusableClient = false;
			enrollmentCode = '';
			signupPending = false;
			if (client) await startOAuth(client);
			else authStep = 'signup-success';
		} catch (error) {
			signupPending = false;
			if (error && typeof error === 'object' && 'kind' in error) {
				const typed = error as { kind: string; message: string };
				if (typed.kind === 'conflict') { configured = true; mode = 'signin'; authError = typed.message; return; }
				signupError = typed.message;
			} else signupError = error instanceof Error ? error.message : 'Headwater could not create the account.';
		}
	};

	onMount(() => {
		void (async () => {
			instance = defaultHeadwaterInstanceUrl({ windowOrigin: window.location.origin, publicInstanceUrl: env.PUBLIC_PLEROMA_INSTANCE_URL });
			storageReady = true;
			const bridge = window.headwaterDesktop;
			if (bridge) {
				desktop = true;
				try {
					const status = await bridge.getStatus();
					desktopOrigin = status.origin;
					instance = status.origin;
					configured = status.configured;
					mode = status.configured ? 'signin' : 'signup';
					environmentReady = true;
					if (readPleromaSession(localStorage)) await goto(status.backupRequired ? '/backup' : '/app/home');
				} catch (error) {
					startupError = error instanceof Error ? error.message : 'Headwater could not start.';
					environmentReady = true;
				}
				return;
			}
			if (readPleromaSession(localStorage)) { await goto('/app/home'); return; }
			try {
				const status = await fetchHeadwaterStatus({ instanceUrl: instance, fetch: window.fetch.bind(window) });
				configured = status.configured;
				mode = status.configured ? 'signin' : 'signup';
			} catch { configured = true; mode = 'signin'; }
			environmentReady = true;
		})();
	});

	$effect(() => {
		if (!storageReady || !instance.trim()) return;
		try {
			reusableClient = Boolean(readPleromaOAuthClient(localStorage, {
				instanceUrl: selectedInstanceUrl,
				redirectUri: `${window.location.origin}/auth/callback`,
				scopes
			}));
		} catch { reusableClient = false; }
	});
</script>

<svelte:head><title>Headwater · Welcome</title></svelte:head>

<main class="onboarding">
	<div class="onboarding-shell">
		<div class="identity">
			<span class="brand-mark"><HeadwaterLogo /></span>
			<h1>Headwater</h1>
			<p>{desktop ? (configured ? 'Your account is ready on this computer.' : 'Create a new identity or restore an existing one.') : 'Your own social node over encrypted email.'}</p>
		</div>

		<section class="onboarding-card" aria-label="Headwater account setup">
			{#if !environmentReady}
				<div class="status" role="status">Starting Headwater…</div>
			{:else if startupError}
				<h2>Headwater could not start</h2>
				<p class="error" role="alert">{startupError}</p>
			{:else if authStep === 'redirect'}
				<div class="redirect-panel">
					<h2>{desktop ? 'Opening your account…' : `Continue to ${selectedInstanceUrl}`}</h2>
					{#if authorizationUrl && !desktop}<a class="primary link-button" href={authorizationUrl}>Authorize Headwater</a>{/if}
					{#if authError}<p class="error" role="alert">{authError}</p>{/if}
					{#if !authorizationUrl && !authError}<div class="status" role="status">Preparing secure sign-in…</div>{/if}
					<button type="button" class="text-button" onclick={cancelRedirect}>Cancel</button>
				</div>
			{:else if authStep === 'signup-success'}
				<div class="result-panel">
					<h2>Account created</h2>
					<p>Your address is <strong>{signupAddress}</strong>.</p>
					{#if desktop}
						<p class="error">Headwater could not finish local sign-in. Try again.</p>
						<button type="button" class="primary" onclick={() => void startOAuth()}>Try sign-in again</button>
					{:else}
						<label for="signup-code">New enrollment code</label>
						<input id="signup-code" aria-label="One-time enrollment code" value={enrollmentCode} oninput={(event) => (enrollmentCode = event.currentTarget.value)} />
						<button type="button" class="primary" disabled={!enrollmentCode.trim()} onclick={() => void startOAuth()}>Continue to sign in</button>
					{/if}
				</div>
			{:else if authStep === 'restore-success'}
				<div class="result-panel">
					<h2>Account restored</h2>
					<p>Welcome back, <strong>{restoredAddress}</strong>.</p>
					{#if desktop}
						<button type="button" class="primary" onclick={() => void startOAuth()}>Try sign-in again</button>
					{:else}
						<label for="restore-code">New enrollment code</label>
						<input id="restore-code" aria-label="One-time enrollment code" value={enrollmentCode} oninput={(event) => (enrollmentCode = event.currentTarget.value)} />
						<button type="button" class="primary" disabled={!enrollmentCode.trim()} onclick={() => void startOAuth()}>Continue to sign in</button>
					{/if}
				</div>
			{:else}
				{#if desktop && !configured}
					<div class="segments" role="tablist" aria-label="First-run choice">
						<button type="button" role="tab" aria-selected={signupView === 'create'} class:active={signupView === 'create'} onclick={() => selectSignupView('create')}>Create account</button>
						<button type="button" role="tab" aria-selected={signupView === 'restore'} class:active={signupView === 'restore'} onclick={() => selectSignupView('restore')}>Restore backup</button>
					</div>
				{:else if !desktop}
					<div class="segments" role="tablist" aria-label="Authentication mode">
						<button type="button" role="tab" aria-selected={mode === 'signin'} class:active={mode === 'signin'} onclick={() => selectMode('signin')}>Sign in</button>
						<button type="button" role="tab" aria-selected={mode === 'signup'} class:active={mode === 'signup'} onclick={() => selectMode('signup')}>Create account</button>
					</div>
				{/if}

				{#if (desktop && configured) || (!desktop && mode === 'signin')}
					<div class="form-panel">
						<h2>{desktop ? 'Welcome back' : 'Sign in'}</h2>
						<p>{desktop ? 'Open the account stored on this computer.' : 'Authorize this browser with your Headwater node.'}</p>
						{#if authError}<p class="error" role="alert">{authError}</p>{/if}
						{#if !desktop && !reusableClient}
							<label for="enrollment-code">One-time enrollment code</label>
							<input id="enrollment-code" aria-label="One-time enrollment code" autocomplete="one-time-code" value={enrollmentCode} oninput={(event) => (enrollmentCode = event.currentTarget.value)} />
						{:else if !desktop && reusableClient}<p class="hint">This browser will reuse its registered client.</p>{/if}
						{#if !desktop}
							<button type="button" class="text-button advanced" aria-expanded={showAdvanced} onclick={() => (showAdvanced = !showAdvanced)}>Use a different node</button>
							{#if showAdvanced}
								<label for="instance">Your home server</label>
								<input id="instance" aria-label="Your home server" value={instance} oninput={(event) => (instance = event.currentTarget.value)} />
							{/if}
						{/if}
						<button type="button" class="primary" disabled={desktop ? false : continueDisabled} onclick={() => void startOAuth()}>{desktop ? 'Open this account' : 'Continue'}</button>
					</div>
				{:else if signupView === 'restore'}
					<div class="form-panel">
						<h2>Restore backup</h2>
						<p>Use an encrypted <code>.dnbk</code> file and its passphrase.</p>
						{#if restoreError}<p class="error" role="alert">{restoreError}</p>{/if}
						{#if desktop}
							<button type="button" class="file-button" onclick={() => void selectDesktopBackup()}>{desktopBackupFilename ? 'Choose another backup' : 'Choose backup file…'}</button>
							{#if desktopBackupFilename}<p class="file-name">{desktopBackupFilename}</p>{/if}
						{:else}
							<label for="restore-file">Backup file</label>
							<input id="restore-file" type="file" accept=".dnbk" aria-label="Backup file" onchange={(event) => (restoreFile = event.currentTarget.files?.[0] ?? null)} />
						{/if}
						<label for="restore-passphrase">Backup passphrase</label>
						<input id="restore-passphrase" type="password" aria-label="Backup passphrase" value={restorePassphrase} oninput={(event) => (restorePassphrase = event.currentTarget.value)} />
						<button type="button" class="primary" disabled={restoreDisabled} onclick={submitRestore}>{restorePending ? 'Restoring…' : 'Restore account'}</button>
						{#if !desktop}<button type="button" class="text-button" onclick={() => selectSignupView('create')}>Create an account instead</button>{/if}
					</div>
				{:else}
					<div class="form-panel">
						<h2>Create account</h2>
						<p>Your address and identity keys will belong to this installation.</p>
						{#if signupError}<p class="error" role="alert">{signupError}</p>{/if}
						<label for="display-name">Display name</label>
						<input id="display-name" aria-label="Display name" value={displayName} oninput={(event) => (displayName = event.currentTarget.value)} placeholder="Quiet Fox" />
						{#if !desktop}
							<button type="button" class="text-button advanced" aria-expanded={showAdvanced} onclick={() => (showAdvanced = !showAdvanced)}>Relay and server settings</button>
							{#if showAdvanced}
								<label for="relay">Relay</label>
								<input id="relay" aria-label="Relay" value={relay} oninput={(event) => (relay = event.currentTarget.value)} />
								{#if customRelaySelected}
									<label for="relay-code">Custom relay enrollment code</label>
									<input id="relay-code" aria-label="Custom relay enrollment code" value={enrollmentCode} oninput={(event) => (enrollmentCode = event.currentTarget.value)} />
								{/if}
								<label for="signup-instance">Your home server</label>
								<input id="signup-instance" aria-label="Your home server" value={instance} oninput={(event) => (instance = event.currentTarget.value)} />
							{/if}
						{/if}
						<button type="button" class="primary" disabled={signupDisabled} onclick={submitSignup}>{signupPending ? 'Creating…' : 'Create account'}</button>
						<p class="hint">After creation, Headwater will require an encrypted recovery backup.</p>
						{#if !desktop}<button type="button" class="text-button" onclick={() => selectSignupView('restore')}>Restore a backup instead</button>{/if}
					</div>
				{/if}
			{/if}
		</section>
	</div>
</main>

<style>
	.onboarding { min-height: 100vh; background: var(--bg); color: var(--ink); }
	.onboarding-shell { width: min(460px, calc(100vw - 32px)); margin: 0 auto; padding: min(14vh, 120px) 0 64px; }
	.identity { display: grid; justify-items: center; text-align: center; }
	.brand-mark { width: 58px; height: 58px; }
	.identity h1 { margin: 14px 0 0; font-family: var(--serif); font-size: 38px; font-weight: 500; letter-spacing: -0.025em; }
	.identity p { margin: 7px 0 0; color: var(--muted); font-size: 13px; line-height: 1.45; }
	.onboarding-card { overflow: hidden; margin-top: 32px; border: 1px solid var(--border-strong); border-radius: var(--radius-lg); background: var(--panel); box-shadow: 0 24px 60px rgba(28, 32, 70, 0.09), 0 2px 8px rgba(28, 32, 70, 0.04); }
	.segments { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin: 8px; padding: 4px; border-radius: 7px; background: var(--panel-2); }
	.segments button { min-height: 38px; border-radius: 5px; color: var(--muted); font-size: 12.5px; font-weight: 650; }
	.segments button.active { color: var(--accent-ink); background: var(--panel); box-shadow: 0 1px 3px rgba(28, 32, 70, 0.1); }
	.segments button:focus-visible, button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.form-panel, .result-panel, .redirect-panel { padding: 24px; }
	h2 { margin: 0; font-family: var(--serif); font-size: 29px; font-weight: 500; line-height: 1.05; }
	.form-panel > p, .result-panel > p, .redirect-panel > p { margin: 8px 0 20px; color: var(--muted); font-size: 12.5px; line-height: 1.5; }
	label { display: block; margin: 15px 0 6px; font-family: var(--mono); font-size: 9.5px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); }
	input { width: 100%; min-height: 43px; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 4px; outline: 0; background: var(--panel-2); color: var(--ink); font-size: 14px; }
	input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
	.primary, .file-button { display: inline-flex; align-items: center; justify-content: center; width: 100%; min-height: 43px; margin-top: 18px; padding: 10px 15px; border: 1px solid var(--accent-ink); border-radius: 4px; font-weight: 700; }
	.primary { background: var(--accent-ink); color: white; }
	.primary:hover { border-color: var(--ink); background: var(--ink); }
	.primary:disabled { cursor: not-allowed; opacity: 0.6; }
	.file-button { margin-top: 12px; background: var(--panel-2); color: var(--accent-ink); }
	.link-button { text-decoration: none; }
	.text-button { display: block; margin: 14px auto 0; color: var(--muted); font-size: 12px; text-decoration: underline; text-underline-offset: 2px; }
	.advanced { margin-left: 0; }
	.hint, .file-name { margin: 8px 0 0 !important; color: var(--muted); font-size: 11.5px !important; }
	.file-name { font-family: var(--mono); overflow-wrap: anywhere; }
	.error { margin: 12px 0 !important; color: var(--bad) !important; font-size: 12.5px !important; }
	.status { padding: 36px 24px; text-align: center; font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
	code { font-family: var(--mono); font-size: 0.95em; }
	@media (max-width: 520px) {
		.onboarding-shell { width: 100%; padding-top: 34px; }
		.identity { padding: 0 20px; }
		.brand-mark { width: 48px; height: 48px; }
		.identity h1 { font-size: 31px; }
		.onboarding-card { margin-top: 24px; border-right: 0; border-left: 0; border-radius: 0; }
		.form-panel, .result-panel, .redirect-panel { padding: 21px 18px; }
	}
</style>
