import { expect, test, type Page, type Route } from '@playwright/test';
import { pleromaFixtures } from '../lib/pleroma/fixtures';
import { expectNoHorizontalOverflow, expectNoMobileFocusZoom, mockRightRailApis, setViewport, viewports } from '../test/playwright';

const session = {
	instanceUrl: 'https://pleroma.example',
	accessToken: 'access-token',
	tokenType: 'Bearer',
	scope: 'read write follow',
	createdAt: 1700000001000,
	account: pleromaFixtures.account
};
const populatedStatus = { ...pleromaFixtures.status, replies_count: 123, reblogs_count: 456, favourites_count: 789 };

const authenticate = async (page: Page) => {
	await mockRightRailApis(page);
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('headwater.session', JSON.stringify(storedSession));
	}, session);
};

const mockHomeTimeline = async (page: Page, statuses = pleromaFixtures.timelines.home) => {
	await page.route('https://pleroma.example/api/v1/timelines/home**', async (route: Route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(statuses)
		});
	});
};

const expectSidebarProfileStatsFit = async (page: Page) => {
	const sidebar = page.getByTestId('left-sidebar');
	const labels = sidebar.locator('.stat-label');
	await expect.poll(async () => sidebar.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(240);
	await expect(labels).toHaveText(['Posts', 'Following', 'Followers']);
	await expect.poll(async () => labels.evaluateAll((elements) => elements.every((label) => {
		const cell = label.parentElement;
		if (!cell) return false;
		const labelBounds = label.getBoundingClientRect();
		const cellBounds = cell.getBoundingClientRect();
		return label.scrollWidth <= label.clientWidth && labelBounds.left >= cellBounds.left - 1 && labelBounds.right <= cellBounds.right + 1;
	}))).toBe(true);
};

const expectPostActionsFit = async (post: ReturnType<Page['locator']>) => {
	const actions = post.locator('.post-actions');
	await expect(actions.locator('.post-action, .post-more')).toHaveCount(5);
	await expect(post.getByRole('button', { name: 'Reply 123', exact: true })).toBeVisible();
	await expect(post.getByRole('button', { name: 'Boost 456', exact: true })).toBeVisible();
	await expect(post.getByRole('button', { name: 'Favorite 789', exact: true })).toBeVisible();
	await expect.poll(async () => post.evaluate((element) => {
		const postBounds = element.getBoundingClientRect();
		const row = element.querySelector<HTMLElement>('.post-actions');
		if (!row || row.scrollWidth > row.clientWidth) return false;
		return [...row.querySelectorAll<HTMLElement>('.post-action, .post-more')].every((action) => {
			const bounds = action.getBoundingClientRect();
			return bounds.left >= postBounds.left - 1 && bounds.right <= postBounds.right + 1;
		});
	})).toBe(true);
};

const expectViewportWidth = async (page: Page, locator: ReturnType<Page['locator']>) => {
	const bounds = await locator.evaluate((element) => {
		const rect = element.getBoundingClientRect();
		return { left: rect.left, right: rect.right };
	});
	expect(Math.abs(bounds.left)).toBeLessThanOrEqual(1);
	expect(Math.abs(bounds.right - (await page.evaluate(() => window.innerWidth)))).toBeLessThanOrEqual(1);
};

test.describe('responsive regression coverage', () => {
	for (const viewportName of Object.keys(viewports) as Array<keyof typeof viewports>) {
		test(`signed-out landing has no horizontal overflow at ${viewportName}`, async ({ page }) => {
			await setViewport(page, viewportName);
			await page.goto('/');

			await expect(page.getByRole('heading', { name: 'Headwater', exact: true })).toBeVisible();
			await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible();
			await expectNoHorizontalOverflow(page);
		});

		test(`design system primitives have no horizontal overflow at ${viewportName}`, async ({ page }) => {
			await setViewport(page, viewportName);
			await page.goto('/design-system');

			await expect(page).toHaveTitle('Headwater · Design System');
			await expect(page.getByRole('heading', { name: 'Foundations' })).toBeVisible();
			await expect(page.getByRole('heading', { name: 'Controls' })).toBeVisible();
			await expectNoHorizontalOverflow(page);
		});
	}

	test('real app shell has no horizontal overflow across breakpoints', async ({ page }) => {
		await authenticate(page);
		await mockHomeTimeline(page);

		await setViewport(page, 'wide');
		await page.goto('/app/home');

		await expect(page.getByTestId('left-sidebar')).toBeVisible();
		await expect(page.getByTestId('right-rail')).toBeVisible();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'desktop');
		await expect(page.getByTestId('left-sidebar')).toBeVisible();
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expectSidebarProfileStatsFit(page);
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'medium');
		await expect(page.getByTestId('left-sidebar')).toBeVisible();
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expectSidebarProfileStatsFit(page);
		await expectNoHorizontalOverflow(page);

		await page.setViewportSize({ width: 881, height: 800 });
		await expectSidebarProfileStatsFit(page);
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'tablet');
		await expect(page.getByTestId('left-sidebar')).toBeHidden();
		await expect(page.getByTestId('right-rail')).toBeHidden();
		await expect(page.getByRole('form', { name: 'Composer' })).toBeVisible();
		await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
		await expectNoHorizontalOverflow(page);

		await setViewport(page, 'mobile');
		await expect(page.getByTestId('left-sidebar')).toBeHidden();
		await expect(page.getByTestId('mobile-bottom-nav')).toHaveCount(0);
		await expectNoMobileFocusZoom(page);
		await page.getByTestId('home-timeline-list').locator('.post').first().getByRole('button', { name: 'Add reaction' }).click();
		await expect(page.getByRole('textbox', { name: 'Search emoji' })).toBeVisible();
		await expectNoMobileFocusZoom(page);
		await page.keyboard.press('Escape');

		await page.getByRole('button', { name: 'Open navigation menu' }).click();
		await expect(page.getByTestId('mobile-drawer')).toBeVisible();
		await page.getByRole('button', { name: 'Close navigation menu' }).last().click();
		await expect(page.getByTestId('mobile-drawer')).toBeHidden();

		await expectNoHorizontalOverflow(page);
	});

	test('mobile Home meets the header and fills the viewport while panel routes stay inset', async ({ page }) => {
		await authenticate(page);
		await mockHomeTimeline(page, [populatedStatus]);
		for (const width of [390, 320]) {
			await page.setViewportSize({ width, height: 844 });
			await page.goto('/app/home');
			await expectViewportWidth(page, page.getByTestId('app-content'));
			const feed = page.locator('.app-feed-card');
			await expectViewportWidth(page, feed);
			const gap = await page.evaluate(() => {
				const header = document.querySelector<HTMLElement>('[data-testid="app-header"]');
				const timeline = document.querySelector<HTMLElement>('.app-feed-card');
				return header && timeline ? timeline.getBoundingClientRect().top - header.getBoundingClientRect().bottom : null;
			});
			expect(gap).not.toBeNull();
			expect(Math.abs(gap ?? 999)).toBeLessThanOrEqual(1);
			await expect(feed).toHaveCSS('border-left-width', '0px');
			await expect(feed).toHaveCSS('border-right-width', '0px');
			await expect(feed).toHaveCSS('border-radius', '0px');
			await expectPostActionsFit(feed.locator('.post').first());
			await expectNoHorizontalOverflow(page);
		}

		await setViewport(page, 'mobile');
		await page.goto('/app/explore');
		const bounds = await page.getByTestId('app-content').evaluate((element) => {
			const rect = element.getBoundingClientRect();
			return { left: rect.left, right: rect.right };
		});
		expect(Math.abs(bounds.left - 14)).toBeLessThanOrEqual(1);
		expect(Math.abs(bounds.right - 376)).toBeLessThanOrEqual(1);
	});

	test('signed-out public profile has no horizontal overflow across breakpoints', async ({ page }) => {
		await page.route('https://pleroma.social/api/v1/accounts/search**', async (route: Route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify([{ ...pleromaFixtures.account, acct: 'quietadmin@pleroma.social', url: 'https://pleroma.social/users/quietadmin' }])
			});
		});
		await page.route('https://pleroma.social/api/v1/accounts/account-1/statuses**', async (route: Route) => {
			const url = new URL(route.request().url());
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(url.searchParams.get('pinned') === 'true' ? [] : [pleromaFixtures.status])
			});
		});

		for (const viewportName of Object.keys(viewports) as Array<keyof typeof viewports>) {
			await setViewport(page, viewportName);
			await page.goto('/app/profiles/quietadmin@pleroma.social');
			await expect(page.getByTestId('public-profile-shell')).toBeVisible();
			await expect(page.getByTestId('profile-view')).toBeVisible();
			await expectNoHorizontalOverflow(page);
		}
	});
});
