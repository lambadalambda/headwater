import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: './tests/integration',
	testMatch: '**/*.integration.e2e.ts',
	timeout: 60_000,
	use: {
		baseURL: process.env.PLEROMANET_INTEGRATION_INSTANCE_URL ?? 'http://127.0.0.1:4400'
	}
});
