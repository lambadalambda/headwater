import { expect, test, type Page } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};

const authenticate = async (page: Page) => {
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('headwater.session', JSON.stringify(storedSession));
	}, session);
};

test('Explore presents known-content search as its only prominent feature', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'wide');
	await page.goto('/app/explore');

	const content = page.getByTestId('app-content');
	await expect(content.getByRole('heading', { name: 'Find people and posts' })).toBeVisible();
	const searchForm = content.getByRole('search', { name: 'Explore search' });
	const search = searchForm.getByRole('searchbox', { name: 'Search known people and posts' });
	await expect(search).toHaveCSS('font-size', '18px');
	await expect(search).toHaveAttribute('aria-describedby', 'explore-search-hint');
	await expect(content).toContainText('Search people and posts already known to this Headwater node');
	await search.focus();
	await expect(searchForm).toHaveCSS('outline-width', '2px');
	const formBounds = await searchForm.boundingBox();
	expect(formBounds?.width ?? 0).toBeGreaterThanOrEqual(500);
	expect(formBounds?.height ?? 0).toBeGreaterThanOrEqual(64);
	await expect(page.getByTestId('right-rail')).toHaveCount(0);
	await expect(page.getByTestId('explore-topic-card')).toHaveCount(0);
	await expect(page.getByTestId('explore-community-card')).toHaveCount(0);
	await expect(page.getByTestId('explore-feed')).toHaveCount(0);
	await expect(page.getByTestId('explore-artwork')).toHaveCount(0);
	await expectNoHorizontalOverflow(page);
});

test('Explore submits text to full search and feed invites to follow', async ({ page }) => {
	await authenticate(page);
	await setViewport(page, 'desktop');
	await page.route('https://pleroma.example/api/headwater/follow', async (route) => {
		expect(route.request().postDataJSON()).toEqual({ invite: 'https://i.delta.chat/#feed-invite' });
		await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
	});
	await page.goto('/app/explore');

	const content = page.getByTestId('app-content');
	const search = content.getByRole('searchbox', { name: 'Search known people and posts' });
	await search.fill('slow web');
	await content.getByRole('button', { name: 'Search', exact: true }).click();
	await expect(page).toHaveURL(/\/app\/search\?q=slow(?:\+|%20)web$/);

	await page.goto('/app/explore');
	await search.fill('https://i.delta.chat/#feed-invite');
	await expect(content.getByRole('button', { name: 'Follow feed' })).toBeVisible();
	await content.getByRole('button', { name: 'Follow feed' }).click();
	await expect(page.getByText('Followed that feed')).toBeVisible();
	await expect(search).toHaveValue('');
});

test('Explore search remains prominent and contained on mobile', async ({ page }) => {
	await authenticate(page);
	for (const width of [390, 320]) {
		await page.setViewportSize({ width, height: 844 });
		await page.goto('/app/explore');

		const content = page.getByTestId('app-content');
		const searchForm = content.getByRole('search', { name: 'Explore search' });
		const search = searchForm.getByRole('searchbox', { name: 'Search known people and posts' });
		await expect(content.getByRole('heading', { name: 'Find people and posts' })).toBeVisible();
		await expect(search).toHaveCSS('font-size', '16px');
		await expect.poll(async () => searchForm.evaluate((element) => {
			const bounds = element.getBoundingClientRect();
			return bounds.left >= 0 && bounds.right <= window.innerWidth && element.scrollWidth <= element.clientWidth;
		})).toBe(true);
		await expectNoHorizontalOverflow(page);
	}
});
