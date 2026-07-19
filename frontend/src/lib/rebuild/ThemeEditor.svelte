<script lang="ts">
	import { writeClipboardText } from '$lib/clipboard';
	import { BUILT_IN_THEME_PALETTES, THEME_PALETTE_KEYS, deriveThemeTokens, formatThemeShareCode, normalizeHex, parseThemeShareCode, themeContrastChecks, type BuiltInThemeName, type ThemePalette } from '$lib/theme';

	type Props = {
		palette: ThemePalette;
		sourceTheme: BuiltInThemeName;
		onPaletteChange: (palette: ThemePalette) => void;
		onSourceChange: (theme: BuiltInThemeName) => void;
		onSave: () => void;
		onDiscard: () => void;
		onRawEdit?: () => void;
		saveLabel?: string;
		externalChangeMessage?: string | null;
	};
	const fields: Array<{ key: keyof ThemePalette; label: string; description: string }> = [
		{ key: 'bg', label: 'Page background', description: 'The app background behind panels.' },
		{ key: 'panel', label: 'Panel background', description: 'Cards, timelines, and menus.' },
		{ key: 'ink', label: 'Primary text', description: 'Post text, headings, and controls.' },
		{ key: 'muted', label: 'Muted text', description: 'Timestamps, handles, and secondary labels.' },
		{ key: 'accent', label: 'Accent', description: 'Links, primary buttons, and focus rings.' },
		{ key: 'good', label: 'Success', description: 'Confirmations and positive states.' },
		{ key: 'warn', label: 'Warning', description: 'Non-blocking cautions.' },
		{ key: 'bad', label: 'Danger', description: 'Errors and destructive actions.' }
	];

	let { palette, sourceTheme, onPaletteChange, onSourceChange, onSave, onDiscard, onRawEdit, saveLabel = 'Save as active theme', externalChangeMessage = null }: Props = $props();
	let rawValues = $state<Record<keyof ThemePalette, string>>({ ...BUILT_IN_THEME_PALETTES.cream });
	let invalidFields = $state<Partial<Record<keyof ThemePalette, boolean>>>({});
	let importValue = $state('');
	let importError = $state('');
	let importMessage = $state('');
	let copyState = $state('Copy');
	let selectedSource = $state<BuiltInThemeName>('cream');
	let pendingChange: { key: keyof ThemePalette; preserveRaw: boolean; palette: ThemePalette } | null = null;
	let tokens = $derived(deriveThemeTokens(palette));
	let previewStyle = $derived(Object.entries(tokens).map(([name, value]) => `${name}:${value}`).join(';'));
	let shareCode = $derived(formatThemeShareCode(palette));
	let contrastChecks = $derived(themeContrastChecks(palette));

	$effect(() => { selectedSource = sourceTheme; });
	$effect(() => {
		if (pendingChange && THEME_PALETTE_KEYS.every((key) => pendingChange?.palette[key] === palette[key])) {
			if (!pendingChange.preserveRaw) rawValues[pendingChange.key] = palette[pendingChange.key];
			invalidFields[pendingChange.key] = false;
			pendingChange = null;
			return;
		}
		pendingChange = null;
		for (const key of THEME_PALETTE_KEYS) rawValues[key] = palette[key];
		invalidFields = {};
	});
	const setColor = (key: keyof ThemePalette, value: string, normalize = false) => {
		rawValues[key] = value;
		const color = normalizeHex(value);
		invalidFields[key] = color == null;
		if (!color) return;
		const nextPalette = { ...palette, [key]: color };
		pendingChange = { key, preserveRaw: !normalize && value.trim().replace(/^#/, '').length === 3, palette: nextPalette };
		if (normalize) rawValues[key] = color;
		onPaletteChange(nextPalette);
	};
	const importTheme = () => {
		try {
			const imported = parseThemeShareCode(importValue);
			importError = '';
			importMessage = 'Imported 8 colors.';
			onPaletteChange(imported);
		} catch (error) {
			importMessage = '';
			importError = error instanceof Error ? error.message : 'Could not import that theme code.';
		}
	};
	const copyShareCode = async () => {
		try {
			await writeClipboardText(shareCode);
			copyState = 'Copied';
			window.setTimeout(() => (copyState = 'Copy'), 1600);
		} catch { copyState = 'Select code'; }
	};
</script>

<section class="theme-editor" aria-labelledby="custom-theme-heading">
	<div class="theme-editor-head"><div class="crumbs">Settings / Appearance</div><h1 id="custom-theme-heading">Custom theme</h1><p>Build a palette from eight base colors. Preview updates live.</p></div>
	<div class="theme-editor-grid">
		<div class="theme-editor-preview" data-testid="theme-preview" style={previewStyle}>
			<div class="theme-preview-kicker">Live preview</div>
			<div class="theme-preview-card"><div class="theme-preview-post-head"><span class="theme-preview-avatar"></span><span><strong>soft signal</strong><small>@soft@headwater.example · now</small></span></div><p>A quieter palette for the social web, with an <a href="#custom-theme-heading">accent link</a> and readable secondary text.</p><div class="theme-preview-actions"><button type="button">Reply</button><button type="button" class="active">Favorite</button></div></div>
			<div class="theme-preview-composer"><span>What's on your mind?</span><button type="button">Post</button></div>
			<div class="theme-preview-statuses"><span class="good">Saved</span><span class="warn">Warning</span><span class="bad">Error</span></div>
		</div>
		<div class="theme-editor-controls">
			{#if externalChangeMessage}<div class="theme-external-change" role="alert">{externalChangeMessage}</div>{/if}
			<label class="theme-source-label" for="theme-source">Start from</label>
			<select id="theme-source" class="input theme-source" bind:value={selectedSource} onchange={(event) => onSourceChange(event.currentTarget.value as BuiltInThemeName)}>{#each Object.keys(BUILT_IN_THEME_PALETTES) as theme}<option value={theme}>{theme[0].toUpperCase() + theme.slice(1)}</option>{/each}</select>
			<div class="theme-color-list">
				{#each fields as field (field.key)}
					<div class="theme-color-row" role="group" aria-labelledby={`theme-${field.key}-label`}><div class="theme-color-copy"><div id={`theme-${field.key}-label`} class="theme-color-label">{field.label}</div><div class="theme-color-description">{field.description}</div></div><input class="theme-color-picker" type="color" aria-label={`${field.label} color`} value={palette[field.key]} oninput={(event) => { onRawEdit?.(); setColor(field.key, event.currentTarget.value, true); }} /><input class="input theme-hex-input" class:invalid={invalidFields[field.key]} type="text" aria-label={`${field.label} hex`} aria-invalid={invalidFields[field.key] ? 'true' : 'false'} value={rawValues[field.key]} oninput={(event) => { onRawEdit?.(); setColor(field.key, event.currentTarget.value); }} onblur={(event) => setColor(field.key, event.currentTarget.value, true)} onkeydown={(event) => { if (event.key === 'Enter') setColor(field.key, event.currentTarget.value, true); }} /></div>
					{#if invalidFields[field.key]}<div class="theme-field-error">Enter a 3 or 6-digit hex color.</div>{/if}
				{/each}
			</div>
			<section class="theme-contrast" aria-labelledby="theme-contrast-heading"><h2 id="theme-contrast-heading">Contrast checks</h2><div aria-live="polite">{#each contrastChecks as check (check.id)}<div class="theme-contrast-row" class:fail={!check.passes}><span>{check.label}</span><strong>{check.ratio}:1</strong><span>{check.level} {check.passes ? 'pass' : 'fail'}</span></div>{/each}</div></section>
			<details class="theme-derived"><summary>Derived colors (advanced)</summary><div class="theme-derived-grid">{#each Object.entries(tokens) as [name, value]}<div><span class="theme-derived-swatch" style={`background:${value}`}></span><code>{name}</code><span>{value}</span></div>{/each}</div></details>
			<section class="theme-share" aria-labelledby="theme-share-heading"><h2 id="theme-share-heading">Share code</h2><p>A short code that reproduces this palette on any Headwater.</p><div class="theme-share-row"><textarea class="input theme-code" aria-label="Theme share code" readonly value={shareCode}></textarea><button type="button" class="btn-secondary" onclick={copyShareCode}>{copyState}</button></div><label for="theme-import">Paste a code to import</label><div class="theme-share-row"><textarea id="theme-import" class="input theme-code" aria-label="Import theme code" aria-invalid={importError ? 'true' : 'false'} bind:value={importValue} onkeydown={(event) => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); importTheme(); } }}></textarea><button type="button" class="btn-secondary" onclick={importTheme}>Import theme code</button></div>{#if importError}<div class="theme-import-message error" role="alert">{importError}</div>{/if}{#if importMessage}<div class="theme-import-message" role="status">{importMessage}</div>{/if}</section>
			<div class="theme-save-row"><button type="button" class="btn-primary" disabled={Object.values(invalidFields).some(Boolean)} onclick={onSave}>{saveLabel}</button><button type="button" class="btn-secondary" onclick={onDiscard}>Discard changes</button></div>
		</div>
	</div>
</section>
