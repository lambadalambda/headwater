<script lang="ts">
	import { goto } from '$app/navigation';
	import { readPleromaSession } from '$lib/pleroma';
	import HeadwaterLogo from '$lib/rebuild/HeadwaterLogo.svelte';
	import { onMount } from 'svelte';

	let ready = $state(false);
	let passphrase = $state('');
	let confirmation = $state('');
	let saving = $state(false);
	let error = $state('');
	const canSave = $derived(passphrase.length > 0 && passphrase === confirmation && !saving);

	const save = async () => {
		if (!canSave) return;
		const session = readPleromaSession(localStorage);
		if (!session || !window.headwaterDesktop) { await goto('/'); return; }
		saving = true;
		error = '';
		try {
			const result = await window.headwaterDesktop.saveBackup({ accessToken: session.accessToken, passphrase });
			if (!result) {
				error = 'Choose where to save your recovery backup when you are ready.';
				saving = false;
				return;
			}
			await goto('/app/home');
		} catch (value) {
			error = value instanceof Error ? value.message : 'Headwater could not save the backup.';
			saving = false;
		}
	};

	onMount(() => {
		void (async () => {
			const session = readPleromaSession(localStorage);
			const bridge = window.headwaterDesktop;
			if (!session || !bridge) { await goto('/'); return; }
			try {
				const status = await bridge.getStatus();
				if (!status.backupRequired) { await goto('/app/home'); return; }
				ready = true;
			} catch {
				await goto('/');
			}
		})();
	});
</script>

<svelte:head><title>Headwater · Save recovery backup</title></svelte:head>

<main class="backup-page">
	<div class="backup-shell">
		<div class="brand-mark"><HeadwaterLogo /></div>
		<section class="backup-card">
			{#if !ready}
				<div class="status" role="status">Checking account protection…</div>
			{:else}
				<p class="eyebrow">Required before continuing</p>
				<h1>Protect your account</h1>
				<p class="lede">Your backup file and passphrase are the only way to recover this identity after a clean install or lost computer. Headwater cannot reset the passphrase.</p>
				<label for="backup-passphrase">Backup passphrase</label>
				<input id="backup-passphrase" type="password" autocomplete="new-password" value={passphrase} oninput={(event) => (passphrase = event.currentTarget.value)} />
				<label for="backup-confirmation">Confirm backup passphrase</label>
				<input id="backup-confirmation" type="password" autocomplete="new-password" value={confirmation} oninput={(event) => (confirmation = event.currentTarget.value)} />
				{#if confirmation && passphrase !== confirmation}<p class="field-error">The passphrases do not match.</p>{/if}
				{#if error}<p class="error" role="alert">{error}</p>{/if}
				<button type="button" disabled={!canSave} onclick={save}>{saving ? 'Saving…' : 'Save recovery backup'}</button>
				<p class="hint">Keep a second copy somewhere outside this computer. Both the file and passphrase are required.</p>
			{/if}
		</section>
	</div>
</main>

<style>
	.backup-page { min-height: 100vh; padding: min(12vh, 104px) 16px 56px; background: var(--bg); color: var(--ink); }
	.backup-shell { width: min(460px, 100%); margin: 0 auto; }
	.brand-mark { width: 52px; height: 52px; margin: 0 auto 24px; }
	.backup-card { padding: 26px; border: 1px solid var(--border-strong); border-radius: var(--radius-lg); background: var(--panel); box-shadow: 0 24px 60px rgba(28, 32, 70, 0.09); }
	.eyebrow { margin: 0 0 9px; font-family: var(--mono); font-size: 9.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-ink); }
	h1 { margin: 0; font-family: var(--serif); font-size: 34px; font-weight: 500; letter-spacing: -0.02em; }
	.lede { margin: 11px 0 22px; color: var(--ink-2); font-size: 13px; line-height: 1.55; }
	label { display: block; margin: 15px 0 6px; font-family: var(--mono); font-size: 9.5px; font-weight: 700; letter-spacing: 0.13em; text-transform: uppercase; color: var(--muted); }
	input { width: 100%; min-height: 43px; padding: 10px 12px; border: 1px solid var(--border-strong); border-radius: 4px; outline: 0; background: var(--panel-2); }
	input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
	button { width: 100%; min-height: 44px; margin-top: 20px; border-radius: 4px; background: var(--accent-ink); color: white; font-weight: 700; }
	button:disabled { cursor: not-allowed; opacity: 0.6; }
	.field-error, .error { margin: 8px 0 0; color: var(--bad); font-size: 12px; }
	.hint { margin: 13px 0 0; color: var(--muted); font-size: 11.5px; line-height: 1.45; }
	.status { padding: 28px; text-align: center; font-family: var(--mono); font-size: 10px; text-transform: uppercase; color: var(--muted); }
	@media (max-width: 520px) {
		.backup-page { padding: 32px 0; }
		.backup-card { border-right: 0; border-left: 0; border-radius: 0; }
	}
</style>
