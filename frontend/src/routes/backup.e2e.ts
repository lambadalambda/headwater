import { expect, test } from '@playwright/test';

const installDesktop = async (page: import('@playwright/test').Page, save: 'saved' | 'cancelled' = 'saved') => {
	await page.addInitScript(({ save }) => {
		const calls: Array<{ accessToken: string; passphrase: string }> = [];
		let backupRequired = true;
		Object.defineProperty(window, '__headwaterBackupCalls', { value: calls });
		Object.defineProperty(window, 'headwaterDesktop', {
			value: Object.freeze({
				getStatus: async () => ({ state: 'ready', origin: window.location.origin, configured: true, backupRequired }),
				saveBackup: async (input: { accessToken: string; passphrase: string }) => {
					calls.push(input);
					if (save === 'cancelled') return null;
					backupRequired = false;
					return { filename: 'identity.dnbk' };
				}
			})
		});
	}, { save });
};

const seedSession = async (page: import('@playwright/test').Page) => {
	await page.goto('/');
	await page.evaluate(() => localStorage.setItem('headwater.session', JSON.stringify({
		instanceUrl: window.location.origin,
		accessToken: 'a'.repeat(43),
		tokenType: 'Bearer',
		scope: 'read write follow push',
		createdAt: Date.now()
	})));
};

test('required desktop backup confirms the passphrase and enters the app only after native save', async ({ page }) => {
	await installDesktop(page);
	await seedSession(page);
	await page.goto('/backup');

	await expect(page.getByRole('heading', { name: 'Protect your account' })).toBeVisible();
	await expect(page.getByText(/backup file and passphrase/i)).toBeVisible();
	const save = page.getByRole('button', { name: 'Save recovery backup' });
	await expect(save).toBeDisabled();
	await page.getByLabel('Backup passphrase', { exact: true }).fill('correct horse battery staple');
	await page.getByLabel('Confirm backup passphrase').fill('different');
	await expect(save).toBeDisabled();
	await page.getByLabel('Confirm backup passphrase').fill('correct horse battery staple');
	await save.click();

	await expect(page).toHaveURL('/app/home');
	expect(await page.evaluate(() => (window as unknown as { __headwaterBackupCalls: unknown }).__headwaterBackupCalls)).toEqual([{ accessToken: 'a'.repeat(43), passphrase: 'correct horse battery staple' }]);
});

test('cancelling the native save keeps the recovery gate in place', async ({ page }) => {
	await installDesktop(page, 'cancelled');
	await seedSession(page);
	await page.goto('/backup');
	await page.getByLabel('Backup passphrase', { exact: true }).fill('correct horse battery staple');
	await page.getByLabel('Confirm backup passphrase').fill('correct horse battery staple');
	await page.getByRole('button', { name: 'Save recovery backup' }).click();

	await expect(page).toHaveURL('/backup');
	await expect(page.getByText(/choose where to save/i)).toBeVisible();
});

test('direct app routes wait for the desktop backup gate before starting application requests', async ({ page }) => {
	let applicationRequests = 0;
	await page.route('https://pleroma.example/api/**', async (route) => {
		applicationRequests += 1;
		await route.abort();
	});
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('headwater.session', JSON.stringify(storedSession));
		let resolveStatus!: (status: { state: 'ready'; origin: string; configured: true; backupRequired: true }) => void;
		const status = new Promise<{ state: 'ready'; origin: string; configured: true; backupRequired: true }>((resolve) => {
			resolveStatus = resolve;
		});
		Object.defineProperty(window, '__resolveDesktopStatus', { value: () => resolveStatus({ state: 'ready', origin: window.location.origin, configured: true, backupRequired: true }) });
		Object.defineProperty(window, 'headwaterDesktop', { value: Object.freeze({ getStatus: () => status }) });
	}, {
		instanceUrl: 'https://pleroma.example',
		accessToken: 'a'.repeat(43),
		tokenType: 'Bearer',
		scope: 'read write follow push',
		createdAt: Date.now()
	});

	await page.goto('/app/home');
	await page.waitForTimeout(100);
	expect(applicationRequests).toBe(0);
	await page.evaluate(() => (window as unknown as { __resolveDesktopStatus(): void }).__resolveDesktopStatus());
	await expect(page).toHaveURL('/backup');
	expect(applicationRequests).toBe(0);
});

test('direct app routes fail closed when desktop backup status cannot be verified', async ({ page }) => {
	let applicationRequests = 0;
	await page.route('https://pleroma.example/api/**', async (route) => {
		applicationRequests += 1;
		await route.abort();
	});
	await page.addInitScript((storedSession) => {
		window.localStorage.setItem('headwater.session', JSON.stringify(storedSession));
		Object.defineProperty(window, 'headwaterDesktop', {
			value: Object.freeze({ getStatus: async () => { throw new Error('status unavailable'); } })
		});
	}, {
		instanceUrl: 'https://pleroma.example',
		accessToken: 'a'.repeat(43),
		tokenType: 'Bearer',
		scope: 'read write follow push',
		createdAt: Date.now()
	});

	await page.goto('/app/home');
	await expect(page.getByRole('alert')).toContainText('could not verify the recovery backup');
	expect(applicationRequests).toBe(0);
});
