import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, setViewport } from '../test/playwright';

const mockOAuthAppRegistration = async (page: Page, server: string) => {
	let body = '';
	await page.route(`https://${server}/api/v1/apps`, async (route) => {
		body = route.request().postData() ?? '';
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				id: `${server}-app`,
				name: 'PleromaNet',
				website: 'http://localhost:4173',
				redirect_uri: 'http://localhost:4173/auth/callback',
				client_id: `${server}-client`,
				client_secret: `${server}-secret`
			})
		});
	});

	return () => body;
};

test('signed-out landing explains OAuth handoff and avoids passwords', async ({ page }) => {
	await setViewport(page, 'desktop');
	await page.goto('/');

	await expect(page.getByRole('banner')).toContainText('PleromaNet');
	await expect(page.getByRole('link', { name: 'Browse public' })).toHaveAttribute('href', '/public');
	await expect(page.getByRole('link', { name: 'Open public timeline' })).toHaveAttribute('href', '/public');
	await expect(page.getByRole('link', { name: 'Federation log' })).toHaveAttribute('href', '/public');
	await expect(page.getByRole('heading', { name: /A quieter corner of the social web/ })).toBeVisible();
	await expect(page.getByText('no algorithm, no ads, no scraping')).toBeVisible();
	await expect(page.getByText('PleromaNet never sees your password')).toBeVisible();
	await expect(page.locator('input[type="password"]')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: /The federated timeline/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Things we ask of each other.' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});

test('selects recent server, prepares OAuth redirect, and cancels pending auth', async ({ page }) => {
	await setViewport(page, 'desktop');
	const appRegistrationBody = await mockOAuthAppRegistration(page, 'retro.social');
	await page.goto('/');

	await expect(page.getByRole('tab', { name: 'Sign in' })).toHaveAttribute('aria-selected', 'true');
	await page.getByRole('button', { name: 'Recent servers' }).click();
	await page.getByRole('option', { name: /retro.social/ }).click();

	await expect(page.getByRole('textbox', { name: 'Your home server' })).toHaveValue('retro.social');
	await expect(page.getByRole('button', { name: 'Continue to retro.social' })).toBeEnabled();
	await expect(page.getByText('Authorize on retro.social')).toBeVisible();

	await page.getByRole('button', { name: 'Continue to retro.social' }).click();
	await expect(page.getByText('Redirecting to retro.social')).toBeVisible();
	await expect(page.getByText('Your server will ask you to authorize PleromaNet')).toBeVisible();
	const authorizationLink = page.getByRole('link', { name: 'Open retro.social authorization' });
	await expect(authorizationLink).toHaveAttribute('href', /^https:\/\/retro\.social\/oauth\/authorize\?/);
	expect(appRegistrationBody()).toContain('client_name=PleromaNet');
	expect(appRegistrationBody()).toContain('scopes=read+write+follow');

	const pending = await page.evaluate(() =>
		JSON.parse(window.sessionStorage.getItem('pleromanet.oauth.pending') ?? 'null')
	);
	expect(pending).toMatchObject({
		instanceUrl: 'https://retro.social',
		clientId: 'retro.social-client',
		state: expect.any(String)
	});
	const authorizationUrl = new URL((await authorizationLink.getAttribute('href')) ?? '');
	expect(authorizationUrl.searchParams.get('client_id')).toBe('retro.social-client');
	expect(authorizationUrl.searchParams.get('state')).toBe(pending.state);
	await expect(page.evaluate(() => window.localStorage.getItem('pleromanet.oauth.pending'))).resolves.toBeNull();

	await page.getByRole('button', { name: 'Cancel redirect' }).click();
	await expect(page.getByRole('textbox', { name: 'Your home server' })).toHaveValue('retro.social');
	await expect(page.getByText('PleromaNet never sees your password')).toBeVisible();
	await expect(page.evaluate(() => window.sessionStorage.getItem('pleromanet.oauth.pending'))).resolves.toBeNull();
	await expectNoHorizontalOverflow(page);
});

test('cancelled OAuth setup cannot restore pending auth after registration resolves', async ({ page }) => {
	await setViewport(page, 'desktop');
	let releaseRegistration: () => void = () => {};
	let registrationStarted: () => void = () => {};
	const registrationRelease = new Promise<void>((resolve) => {
		releaseRegistration = resolve;
	});
	const registrationSeen = new Promise<void>((resolve) => {
		registrationStarted = resolve;
	});

	await page.route('https://retro.social/api/v1/apps', async (route) => {
		registrationStarted();
		await registrationRelease;
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				id: 'retro.social-app',
				name: 'PleromaNet',
				redirect_uri: 'http://localhost:4173/auth/callback',
				client_id: 'retro.social-client',
				client_secret: 'retro.social-secret'
			})
		});
	});

	await page.goto('/');
	await page.getByRole('button', { name: 'Recent servers' }).click();
	await page.getByRole('option', { name: /retro.social/ }).click();
	await page.getByRole('button', { name: 'Continue to retro.social' }).click();
	await registrationSeen;
	await page.getByRole('button', { name: 'Cancel redirect' }).click();
	releaseRegistration();
	await page.waitForTimeout(50);

	await expect(page.getByRole('link', { name: 'Open retro.social authorization' })).toHaveCount(0);
	await expect(page.evaluate(() => window.sessionStorage.getItem('pleromanet.oauth.pending'))).resolves.toBeNull();
});

test('create account flow gates redirect behind code of conduct agreement', async ({ page }) => {
	await setViewport(page, 'desktop');
	await mockOAuthAppRegistration(page, 'spacebear.net');
	await page.goto('/');

	await page.getByRole('tab', { name: 'Create account' }).click();
	await expect(page.getByRole('tab', { name: 'Create account' })).toHaveAttribute('aria-selected', 'true');
	await expect(page.getByRole('button', { name: 'Continue to pleromanet.social' })).toBeDisabled();

	await page.getByRole('button', { name: /spacebear.net/ }).click();
	await expect(page.getByText("spacebear.net's Code of Conduct")).toBeVisible();
	await expect(page.getByRole('button', { name: 'Continue to spacebear.net' })).toBeDisabled();

	await page.getByRole('checkbox', { name: /I'm 16\+/ }).check();
	await expect(page.getByRole('button', { name: 'Continue to spacebear.net' })).toBeEnabled();
	await page.getByRole('button', { name: 'Continue to spacebear.net' }).click();
	await expect(page.getByText('Redirecting to spacebear.net')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Open spacebear.net authorization' })).toHaveAttribute(
		'href',
		/^https:\/\/spacebear\.net\/oauth\/authorize\?/
	);
});

test('signed-out landing remains usable on mobile', async ({ page }) => {
	await setViewport(page, 'mobile');
	await page.goto('/');

	await expect(page.getByRole('heading', { name: /A quieter corner of the social web/ })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'Sign in' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Continue to pleromanet.social' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Browse public' })).toBeVisible();
	await expectNoHorizontalOverflow(page);
});
