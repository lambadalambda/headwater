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
