import { expect, test } from '@playwright/test';
import {
	BUILT_IN_THEME_PALETTES,
	THEME_PREFERENCES_STORAGE_KEY,
	contrastRatio,
	deriveThemeTokens,
	formatThemeShareCode,
	normalizeHex,
	parseThemeShareCode,
	readStoredThemePreferences,
	themeContrastChecks,
	writeStoredThemePreferences
} from './theme';

test('Headwater theme helpers normalize colors and round-trip HW1 and legacy PN1 share codes', () => {
	expect(normalizeHex('abc')).toBe('#AABBCC');
	expect(normalizeHex('#12abEF')).toBe('#12ABEF');
	expect(normalizeHex('nope')).toBeNull();

	const palette = BUILT_IN_THEME_PALETTES.cream;
	const code = formatThemeShareCode(palette);
	expect(code).toBe('HW1:F5F1E8,FBFAF3,1F2347,7A7C95,A48BD9,A8D5B1,E0B97A,D68B8B');
	expect(parseThemeShareCode(code)).toEqual(palette);
	expect(parseThemeShareCode(code.replace('HW1:', 'PN1:'))).toEqual(palette);
});

test('Headwater theme helpers reject malformed and unsupported share codes atomically', () => {
	expect(() => parseThemeShareCode('HW2:F5F1E8,FBFAF3,1F2347,7A7C95,A48BD9,A8D5B1,E0B97A,D68B8B')).toThrow(/newer format/i);
	expect(() => parseThemeShareCode('HW1:F5F1E8,FBFAF3')).toThrow(/8 hex colors/i);
	expect(() => parseThemeShareCode('HW1:F5F1E8,FBFAF3,1F2347,7A7C95,nothex,A8D5B1,E0B97A,D68B8B')).toThrow(/hex color/i);
});

test('Headwater theme helpers derive complete semantic colors and contrast feedback', () => {
	const palette = BUILT_IN_THEME_PALETTES.drive;
	const tokens = deriveThemeTokens(palette);

	expect(Object.keys(tokens)).toEqual([
		'--bg', '--panel', '--panel-2', '--border', '--border-strong', '--ink', '--ink-2', '--muted', '--muted-2',
		'--accent', '--accent-ink', '--accent-soft', '--accent-soft-2', '--pink', '--teal', '--good', '--good-ink', '--warn', '--warn-ink', '--bad'
	]);
	expect(tokens['--bg']).toBe('#07091A');
	expect(contrastRatio('#FFFFFF', '#000000')).toBe(21);
	expect(themeContrastChecks({ ...palette, accent: palette.panel }).find((check) => check.id === 'accent-panel')?.passes).toBe(false);
	expect(themeContrastChecks({ ...palette, bad: palette.panel }).find((check) => check.id === 'danger-panel')?.passes).toBe(false);
});

test('Headwater theme preferences migrate the current pn-theme key without overwriting future versions', () => {
	const values = new Map<string, string>([['pn-theme', 'drive']]);
	const storage = { getItem: (key: string) => values.get(key) ?? null };
	expect(readStoredThemePreferences(storage, null)).toMatchObject({ version: 1, mode: 'fixed', fixedTheme: 'drive' });
	expect(THEME_PREFERENCES_STORAGE_KEY).toBe('headwater.theme.v1.preferences');

	const future = '{"version":2,"mode":"future"}';
	const futureValues = new Map<string, string>([[THEME_PREFERENCES_STORAGE_KEY, future]]);
	const futureStorage = {
		getItem: (key: string) => futureValues.get(key) ?? null,
		setItem: (key: string, value: string) => futureValues.set(key, value)
	};
	expect(writeStoredThemePreferences(futureStorage, readStoredThemePreferences(futureStorage, null))).toBe(false);
	expect(futureValues.get(THEME_PREFERENCES_STORAGE_KEY)).toBe(future);
});
