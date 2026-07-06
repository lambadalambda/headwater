import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

export default defineConfig({
	webServer: { command: `pnpm run build && pnpm exec vite preview --port ${port} --strictPort`, port, timeout: 180_000 },
	use: { baseURL: `http://localhost:${port}` },
	testMatch: '**/*.e2e.{ts,js}',
	testIgnore: ['**/tests/integration/**', '**/*.integration.e2e.{ts,js}']
});
