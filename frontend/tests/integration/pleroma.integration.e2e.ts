import { expect, test } from '@playwright/test';
import { createPleromaClient } from '../../src/lib/pleroma/client';
import type { FetchLike } from '../../src/lib/pleroma/http';

const instanceUrl = process.env.PLEROMANET_INTEGRATION_INSTANCE_URL ?? 'http://127.0.0.1:4400';

const anonymousFetch = (requestedPaths: string[]): FetchLike => async (input, init) => {
	const requestUrl = new URL(String(input));
	const requestHeaders = new Headers(init?.headers);
	requestedPaths.push(`${requestUrl.pathname}${requestUrl.search}`);

	expect(requestHeaders.get('authorization')).toBeNull();

	return fetch(input, init);
};

test('API client reads real instance metadata and public timeline anonymously', async ({ baseURL }) => {
	const requestedPaths: string[] = [];
	const client = createPleromaClient({
		instanceUrl: baseURL ?? instanceUrl,
		fetch: anonymousFetch(requestedPaths)
	});

	const instance = await client.getInstance();
	expect(instance.title).toBeTruthy();
	expect(instance.version).toBeTruthy();
	expect(instance.pleroma.metadata.features).toEqual(expect.any(Array));

	const publicStatuses = await client.getFederatedTimeline({ limit: 1 });
	expect(Array.isArray(publicStatuses)).toBe(true);
	expect(requestedPaths).toEqual(expect.arrayContaining(['/api/v2/instance', '/api/v1/timelines/public?limit=1']));
});
