import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';

export const viewports = {
	wide: { width: 1440, height: 900 },
	desktop: { width: 1280, height: 900 },
	medium: { width: 1000, height: 800 },
	tablet: { width: 880, height: 760 },
	mobile: { width: 390, height: 844 }
} as const;

export type ViewportName = keyof typeof viewports;

export const setViewport = async (page: Page, name: ViewportName) => {
	await page.setViewportSize(viewports[name]);
};

export const expectNoHorizontalOverflow = async (page: Page) => {
	const hasOverflow = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);

	expect(hasOverflow).toBe(false);
};

export const expectNoMobileFocusZoom = async (page: Page) => {
	const selector = [
		'input:not([type])',
		'input:is([type="text"], [type="search"], [type="email"], [type="url"], [type="tel"], [type="number"], [type="password"])',
		'textarea',
		'select',
		'[contenteditable="true"][role="textbox"]'
	].join(', ');
	const undersized = await page.locator(selector).evaluateAll((elements) => elements
		.filter((element) => {
			const control = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
			const bounds = element.getBoundingClientRect();
			return !control.disabled && bounds.width > 0 && bounds.height > 0 && getComputedStyle(element).visibility !== 'hidden';
		})
		.map((element) => ({
			name: element.getAttribute('aria-label') ?? element.getAttribute('name') ?? element.getAttribute('placeholder') ?? element.tagName.toLowerCase(),
			fontSize: Number.parseFloat(getComputedStyle(element).fontSize)
		}))
		.filter((control) => control.fontSize < 16));

	expect(undersized).toEqual([]);
};

export const expectElementIsTruncatedWithinParent = async (locator: Locator) => {
	const result = await locator.evaluate((element) => {
		const parent = element.parentElement;
		if (!parent) return { fits: false, truncated: false };

		return {
			fits: element.getBoundingClientRect().width <= parent.getBoundingClientRect().width + 1,
			truncated: element.scrollWidth > element.clientWidth
		};
	});

	expect(result.fits).toBe(true);
	expect(result.truncated).toBe(true);
};

export const fulfillJson = async (route: Route, body: unknown, status = 200) => {
	await route.fulfill({
		status,
		contentType: 'application/json',
		body: JSON.stringify(body)
	});
};

export const mockRightRailApis = async (page: Page) => {
	await page.route('https://pleroma.example/api/v1/trends/tags**', async (route) => {
		await fulfillJson(route, pleromaFixtures.trends);
	});
	await page.route('https://pleroma.example/api/v2/instance', async (route) => {
		await fulfillJson(route, pleromaFixtures.instance);
	});
	await page.route('https://pleroma.example/api/v2/suggestions**', async (route) => {
		await fulfillJson(route, []);
	});
};
