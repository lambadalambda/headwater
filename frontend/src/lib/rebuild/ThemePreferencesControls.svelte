<script lang="ts">
	import type { ThemeName, ThemePreferenceMode, ThemePreferences } from '$lib/theme';

	type Props = {
		preferences: ThemePreferences;
		resolvedTheme: ThemeName;
		systemPrefersDark: boolean;
		customAvailable?: boolean;
		onModeChange: (mode: ThemePreferenceMode) => void;
		onFixedThemeChange: (theme: ThemeName) => void;
		onSystemThemeChange: (slot: 'light' | 'dark', theme: ThemeName) => void;
	};

	let { preferences, resolvedTheme, systemPrefersDark, customAvailable = false, onModeChange, onFixedThemeChange, onSystemThemeChange }: Props = $props();
	const themes: Array<{ id: ThemeName; label: string }> = [
		{ id: 'cream', label: 'Cream' },
		{ id: 'dusk', label: 'Dusk' },
		{ id: 'drive', label: 'Drive' },
		{ id: 'simoun', label: 'Simoun' }
	];
	const themeLabel = (theme: ThemeName) => theme === 'custom' ? 'Custom' : themes.find((option) => option.id === theme)?.label ?? theme;
</script>

{#snippet themeOptions()}
	{#each themes as theme}<option value={theme.id}>{theme.label}</option>{/each}
	{#if customAvailable}<option value="custom">Custom</option>{/if}
{/snippet}

<section class="card app-panel theme-preferences-panel" aria-labelledby="theme-preferences-heading">
	<div class="crumbs">Settings / Appearance</div>
	<h1 id="theme-preferences-heading">Theme switching</h1>
	<p>Use one theme all the time, or choose separate themes for your system's light and dark modes.</p>
	<fieldset class="theme-mode-options">
		<legend>Theme mode</legend>
		<label><input type="radio" name="theme-mode" value="fixed" checked={preferences.mode === 'fixed'} onchange={() => onModeChange('fixed')} /><span><strong>Single theme</strong><small>Keep one theme regardless of system settings.</small></span></label>
		<label><input type="radio" name="theme-mode" value="system" checked={preferences.mode === 'system'} onchange={() => onModeChange('system')} /><span><strong>Follow system</strong><small>Switch between your selected light and dark themes automatically.</small></span></label>
	</fieldset>
	{#if preferences.mode === 'fixed'}
		<div class="theme-preference-field"><label for="fixed-theme-selection">Single theme selection</label><select id="fixed-theme-selection" value={preferences.fixedTheme} onchange={(event) => onFixedThemeChange(event.currentTarget.value as ThemeName)}>{@render themeOptions()}</select></div>
	{:else}
		<div class="theme-system-fields">
			<div class="theme-preference-field"><label for="light-theme-selection">Light theme</label><select id="light-theme-selection" value={preferences.lightTheme} onchange={(event) => onSystemThemeChange('light', event.currentTarget.value as ThemeName)}>{@render themeOptions()}</select></div>
			<div class="theme-preference-field"><label for="dark-theme-selection">Dark theme</label><select id="dark-theme-selection" value={preferences.darkTheme} onchange={(event) => onSystemThemeChange('dark', event.currentTarget.value as ThemeName)}>{@render themeOptions()}</select></div>
		</div>
		<div class="theme-system-status" role="status" aria-label="Automatic theme status">System is {systemPrefersDark ? 'dark' : 'light'} · using {themeLabel(resolvedTheme)}</div>
		{#if customAvailable}<p class="theme-custom-note">Custom refers to your one saved custom palette.</p>{/if}
	{/if}
</section>
