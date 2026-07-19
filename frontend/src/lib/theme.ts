export type BuiltInThemeName = 'cream' | 'dusk' | 'drive' | 'simoun';
export type ThemeName = BuiltInThemeName | 'custom';
export type ThemePreferenceMode = 'fixed' | 'system';
export type ThemePreferences = {
	version: 1;
	mode: ThemePreferenceMode;
	fixedTheme: ThemeName;
	lightTheme: ThemeName;
	darkTheme: ThemeName;
};

export type ThemePalette = {
	bg: string;
	panel: string;
	ink: string;
	muted: string;
	accent: string;
	good: string;
	warn: string;
	bad: string;
};

export type ThemeTokenName =
	| '--bg' | '--panel' | '--panel-2' | '--border' | '--border-strong'
	| '--ink' | '--ink-2' | '--muted' | '--muted-2'
	| '--accent' | '--accent-ink' | '--accent-soft' | '--accent-soft-2'
	| '--pink' | '--teal' | '--good' | '--good-ink' | '--warn' | '--warn-ink' | '--bad';

export type ThemeTokens = Record<ThemeTokenName, string>;
export type ThemeContrastCheck = { id: string; label: string; ratio: number; passes: boolean; level: 'AAA' | 'AA' | 'Fail' };

export const THEME_STORAGE_KEY = 'headwater.theme.v1.resolved';
export const THEME_PREFERENCES_STORAGE_KEY = 'headwater.theme.v1.preferences';
export const CUSTOM_THEME_STORAGE_KEY = 'headwater.theme.v1.custom';
export const CUSTOM_THEME_DRAFT_STORAGE_KEY = 'headwater.theme.v1.custom-draft';
export const CUSTOM_THEME_SOURCE_STORAGE_KEY = 'headwater.theme.v1.custom-source';
export const THEME_CHANGE_EVENT = 'headwater:theme-change:v1';
export const LEGACY_THEME_STORAGE_KEY = 'pn-theme';

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = {
	version: 1,
	mode: 'fixed',
	fixedTheme: 'cream',
	lightTheme: 'cream',
	darkTheme: 'dusk'
};

export const THEME_PALETTE_KEYS = ['bg', 'panel', 'ink', 'muted', 'accent', 'good', 'warn', 'bad'] as const satisfies readonly (keyof ThemePalette)[];

export const BUILT_IN_THEME_PALETTES: Record<BuiltInThemeName, ThemePalette> = {
	cream: { bg: '#F5F1E8', panel: '#FBFAF3', ink: '#1F2347', muted: '#7A7C95', accent: '#A48BD9', good: '#A8D5B1', warn: '#E0B97A', bad: '#D68B8B' },
	dusk: { bg: '#1A142E', panel: '#221A3A', ink: '#F4EEF8', muted: '#8B7EAA', accent: '#E7A8C9', good: '#88D89B', warn: '#E0B97A', bad: '#D68B8B' },
	drive: { bg: '#07091A', panel: '#0E1228', ink: '#E8EFFF', muted: '#7A85A8', accent: '#7DC4BE', good: '#78D891', warn: '#E0B97A', bad: '#D68B8B' },
	simoun: { bg: '#141B36', panel: '#1C2547', ink: '#F4EBD8', muted: '#8A96BD', accent: '#E8763A', good: '#93DC9E', warn: '#E0B97A', bad: '#D68B8B' }
};

type RGB = { r: number; g: number; b: number };

export const normalizeHex = (value: string): string | null => {
	const raw = value.trim().replace(/^#/, '');
	if (/^[0-9a-f]{3}$/i.test(raw)) return `#${raw.split('').map((part) => part + part).join('').toUpperCase()}`;
	if (/^[0-9a-f]{6}$/i.test(raw)) return `#${raw.toUpperCase()}`;
	return null;
};

const rgbFromHex = (value: string): RGB => {
	const hex = normalizeHex(value) ?? '#000000';
	return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
};

const hexFromRgb = ({ r, g, b }: RGB) => `#${[r, g, b].map((part) => Math.round(Math.max(0, Math.min(255, part))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;

const mixHex = (from: string, to: string, amount: number) => {
	const a = rgbFromHex(from);
	const b = rgbFromHex(to);
	return hexFromRgb({ r: a.r + (b.r - a.r) * amount, g: a.g + (b.g - a.g) * amount, b: a.b + (b.b - a.b) * amount });
};

const channelLuminance = (channel: number) => {
	const value = channel / 255;
	return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (color: string) => {
	const { r, g, b } = rgbFromHex(color);
	return channelLuminance(r) * 0.2126 + channelLuminance(g) * 0.7152 + channelLuminance(b) * 0.0722;
};

export const contrastRatio = (foreground: string, background: string) => {
	const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
	const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
	return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
};

const ensureContrast = (color: string, surface: string, target = 4.5) => {
	if (contrastRatio(color, surface) >= target) return normalizeHex(color) ?? color;
	const destination = contrastRatio('#000000', surface) >= contrastRatio('#FFFFFF', surface) ? '#000000' : '#FFFFFF';
	for (let step = 1; step <= 20; step += 1) {
		const candidate = mixHex(color, destination, step / 20);
		if (contrastRatio(candidate, surface) >= target) return candidate;
	}
	return destination;
};

export const deriveThemeTokens = (palette: ThemePalette): ThemeTokens => {
	const normalized = Object.fromEntries(THEME_PALETTE_KEYS.map((key) => [key, normalizeHex(palette[key]) ?? '#000000'])) as ThemePalette;
	const panel2 = mixHex(normalized.panel, '#FFFFFF', relativeLuminance(normalized.panel) > 0.5 ? 0.04 : 0.07);
	return {
		'--bg': normalized.bg,
		'--panel': normalized.panel,
		'--panel-2': panel2,
		'--border': mixHex(normalized.panel, normalized.ink, 0.12),
		'--border-strong': mixHex(normalized.panel, normalized.ink, 0.24),
		'--ink': normalized.ink,
		'--ink-2': mixHex(normalized.ink, normalized.panel, 0.2),
		'--muted': normalized.muted,
		'--muted-2': mixHex(normalized.muted, normalized.panel, 0.24),
		'--accent': normalized.accent,
		'--accent-ink': ensureContrast(normalized.accent, normalized.panel),
		'--accent-soft': mixHex(normalized.panel, normalized.accent, 0.22),
		'--accent-soft-2': mixHex(normalized.panel, normalized.accent, 0.1),
		'--pink': mixHex(normalized.accent, normalized.bad, 0.42),
		'--teal': mixHex(normalized.accent, normalized.good, 0.46),
		'--good': normalized.good,
		'--good-ink': ensureContrast(normalized.good, normalized.panel),
		'--warn': normalized.warn,
		'--warn-ink': ensureContrast(normalized.warn, normalized.panel),
		'--bad': normalized.bad
	};
};

export const formatThemeShareCode = (palette: ThemePalette) => `HW1:${THEME_PALETTE_KEYS.map((key) => (normalizeHex(palette[key]) ?? '#000000').slice(1)).join(',')}`;

export const parseThemeShareCode = (value: string): ThemePalette => {
	const compact = value.trim();
	const prefix = compact.match(/^([a-z0-9]+):/i)?.[1]?.toUpperCase();
	if (prefix && prefix !== 'HW1' && prefix !== 'PN1') throw new Error(`This code uses a newer format (${prefix}). Update Headwater to import it.`);
	if (prefix !== 'HW1' && prefix !== 'PN1') throw new Error('That code is missing the HW1 format prefix.');
	const parts = compact.slice(compact.indexOf(':') + 1).split(',').map((part) => part.trim());
	if (parts.length !== THEME_PALETTE_KEYS.length) throw new Error('Expected HW1 followed by 8 hex colors.');
	const colors = parts.map(normalizeHex);
	if (colors.some((color) => color == null)) throw new Error('Every HW1 value must be a valid hex color.');
	return Object.fromEntries(THEME_PALETTE_KEYS.map((key, index) => [key, colors[index]])) as ThemePalette;
};

const contrastLevel = (ratio: number): ThemeContrastCheck['level'] => ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail';

export const themeContrastChecks = (palette: ThemePalette): ThemeContrastCheck[] => [
	{ id: 'primary-page', label: 'Primary text on page', foreground: palette.ink, background: palette.bg },
	{ id: 'primary-panel', label: 'Primary text on panel', foreground: palette.ink, background: palette.panel },
	{ id: 'muted-panel', label: 'Muted text on panel', foreground: palette.muted, background: palette.panel },
	{ id: 'accent-panel', label: 'Accent on panel', foreground: palette.accent, background: palette.panel },
	{ id: 'danger-panel', label: 'Danger on panel', foreground: palette.bad, background: palette.panel }
].map((check) => {
	const ratio = contrastRatio(check.foreground, check.background);
	return { id: check.id, label: check.label, ratio, passes: ratio >= 4.5, level: contrastLevel(ratio) };
});

const isThemePalette = (value: unknown): value is ThemePalette => {
	if (!value || typeof value !== 'object') return false;
	return THEME_PALETTE_KEYS.every((key) => typeof (value as Record<string, unknown>)[key] === 'string' && normalizeHex((value as Record<string, string>)[key]) != null);
};

const isThemeName = (value: unknown): value is ThemeName => value === 'cream' || value === 'dusk' || value === 'drive' || value === 'simoun' || value === 'custom';
const availableTheme = (value: unknown, fallback: ThemeName, customPalette: ThemePalette | null) => isThemeName(value) && (value !== 'custom' || customPalette) ? value : fallback;

export const readStoredThemePreferences = (storage: Pick<Storage, 'getItem'>, customPalette: ThemePalette | null): ThemePreferences => {
	try {
		const value = JSON.parse(storage.getItem(THEME_PREFERENCES_STORAGE_KEY) ?? 'null') as Record<string, unknown> | null;
		if (value?.version === 1 && (value.mode === 'fixed' || value.mode === 'system')) {
			return {
				version: 1,
				mode: value.mode,
				fixedTheme: availableTheme(value.fixedTheme, 'cream', customPalette),
				lightTheme: availableTheme(value.lightTheme, 'cream', customPalette),
				darkTheme: availableTheme(value.darkTheme, 'dusk', customPalette)
			};
		}
	} catch {
		// Fall through to the previous single-theme preference.
	}
	const previousTheme = storage.getItem(THEME_STORAGE_KEY) ?? storage.getItem(LEGACY_THEME_STORAGE_KEY);
	return { ...DEFAULT_THEME_PREFERENCES, fixedTheme: availableTheme(previousTheme, 'cream', customPalette) };
};

export const hasUnsupportedStoredThemePreferences = (storage: Pick<Storage, 'getItem'>) => {
	const stored = storage.getItem(THEME_PREFERENCES_STORAGE_KEY);
	if (!stored) return false;
	try {
		const value = JSON.parse(stored) as Record<string, unknown> | null;
		return Boolean(value && typeof value === 'object' && 'version' in value && value.version !== 1);
	} catch {
		return false;
	}
};

export const writeStoredThemePreferences = (storage: Pick<Storage, 'getItem' | 'setItem'>, preferences: ThemePreferences) => {
	if (hasUnsupportedStoredThemePreferences(storage)) return false;
	storage.setItem(THEME_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
	return true;
};

export const resolveThemePreferences = (preferences: ThemePreferences, systemPrefersDark: boolean, customPalette: ThemePalette | null): ThemeName => {
	const selected = preferences.mode === 'fixed' ? preferences.fixedTheme : systemPrefersDark ? preferences.darkTheme : preferences.lightTheme;
	if (selected === 'custom' && !customPalette) return systemPrefersDark && preferences.mode === 'system' ? 'dusk' : 'cream';
	return selected;
};

export const readStoredThemePalette = (storage: Pick<Storage, 'getItem'>, key = CUSTOM_THEME_STORAGE_KEY): ThemePalette | null => {
	try {
		const value = JSON.parse(storage.getItem(key) ?? 'null') as unknown;
		if (!isThemePalette(value)) return null;
		return Object.fromEntries(THEME_PALETTE_KEYS.map((name) => [name, normalizeHex(value[name])])) as ThemePalette;
	} catch {
		return null;
	}
};

export const writeStoredThemePalette = (storage: Pick<Storage, 'setItem'>, palette: ThemePalette, key = CUSTOM_THEME_STORAGE_KEY) => {
	storage.setItem(key, JSON.stringify(Object.fromEntries(THEME_PALETTE_KEYS.map((name) => [name, normalizeHex(palette[name])]))));
};

const rgbTableValue = (color: string, channel: keyof RGB) => (rgbFromHex(color)[channel] / 255).toFixed(3);
const updateCustomDuotoneFilter = (document: Document, palette: ThemePalette) => {
	for (const channel of ['r', 'g', 'b'] as const) {
		document.querySelector(`#duotoneCustom feFunc${channel.toUpperCase()}`)?.setAttribute('tableValues', `${rgbTableValue(palette.ink, channel)} ${rgbTableValue(palette.accent, channel)}`);
	}
};

export const applyThemeToDocument = (document: Document, theme: ThemeName, palette?: ThemePalette) => {
	const root = document.documentElement;
	for (const property of Object.keys(deriveThemeTokens(BUILT_IN_THEME_PALETTES.cream)) as ThemeTokenName[]) root.style.removeProperty(property);
	root.style.removeProperty('--photo-filter');
	if (theme === 'custom' && palette) {
		for (const [property, value] of Object.entries(deriveThemeTokens(palette))) root.style.setProperty(property, value);
		root.style.setProperty('--photo-filter', 'url(#duotoneCustom)');
		updateCustomDuotoneFilter(document, palette);
	}
	root.dataset.theme = theme;
	document.body.dataset.theme = theme;
	document.defaultView?.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme, palette } }));
};
