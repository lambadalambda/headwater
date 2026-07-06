import { expect, test } from '@playwright/test';
import { createPleromaAccountCache, getCachedPleromaAccount, upsertPleromaAccounts } from './account-cache';
import { pleromaFixtures } from './fixtures';
import type { PleromaAccount } from './types';

const account = (overrides: Partial<PleromaAccount> = {}): PleromaAccount => ({
	...pleromaFixtures.account,
	...overrides,
	pleroma: {
		...pleromaFixtures.account.pleroma,
		...overrides.pleroma
	}
});

test('Pleroma account cache indexes accounts by id and normalized handles', () => {
	const cached = upsertPleromaAccounts(createPleromaAccountCache(), [account({ id: 'account-soft', username: 'soft.hertz', acct: 'soft.hertz@kolektiva.social' })]);

	expect(getCachedPleromaAccount(cached, 'account-soft')?.acct).toBe('soft.hertz@kolektiva.social');
	expect(getCachedPleromaAccount(cached, '@SOFT.HERTZ@KOLEKTIVA.SOCIAL')?.id).toBe('account-soft');
	expect(getCachedPleromaAccount(cached, 'soft.hertz')).toBeNull();
});

test('Pleroma account cache indexes bare local acct values without indexing remote usernames', () => {
	const cached = upsertPleromaAccounts(createPleromaAccountCache(), [
		account({ id: 'account-local-alice', username: 'alice', acct: 'alice' }),
		account({ id: 'account-remote-alice', username: 'alice', acct: 'alice@remote.example' })
	]);

	expect(getCachedPleromaAccount(cached, 'alice')?.id).toBe('account-local-alice');
	expect(getCachedPleromaAccount(cached, 'alice@remote.example')?.id).toBe('account-remote-alice');
});

test('Pleroma account cache preserves explicit relationships and removes stale aliases', () => {
	const initial = account({
		id: 'account-soft',
		username: 'soft.hertz',
		acct: 'soft.hertz@kolektiva.social',
		pleroma: { ...pleromaFixtures.account.pleroma, relationship: { ...pleromaFixtures.relationship, id: 'account-soft', following: true } }
	});
	const renamed = account({
		id: 'account-soft',
		username: 'quiet.signal',
		acct: 'quiet.signal@kolektiva.social',
		pleroma: { ...pleromaFixtures.account.pleroma, relationship: { ...pleromaFixtures.relationship, id: 'account-soft', following: false } }
	});

	const cache = upsertPleromaAccounts(createPleromaAccountCache(), [initial], { relationship: 'replace' });
	const unchanged = upsertPleromaAccounts(cache, [initial], { relationship: 'replace' });
	const updated = upsertPleromaAccounts(unchanged, [renamed]);

	expect(unchanged).toBe(cache);
	expect(getCachedPleromaAccount(updated, 'quiet.signal@kolektiva.social')?.pleroma.relationship?.following).toBe(true);
	expect(getCachedPleromaAccount(updated, 'soft.hertz@kolektiva.social')).toBeNull();
});
