import type { PleromaAccount, PleromaNotification, PleromaStatus } from './types';

export type PleromaAccountCache = {
	byId: Record<string, PleromaAccount>;
	idByHandle: Record<string, string>;
};

type UpsertOptions = {
	relationship?: 'preserve' | 'replace';
};

export const createPleromaAccountCache = (): PleromaAccountCache => ({ byId: {}, idByHandle: {} });

const normalizedAccountKey = (value: string | null | undefined) => value?.trim().replace(/^@/, '').toLowerCase() ?? '';

const accountKeys = (account: PleromaAccount) => [account.id, account.acct]
	.map(normalizedAccountKey)
	.filter(Boolean);

const definedEntries = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));

const stableStringify = (value: unknown): string => {
	if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
	if (value && typeof value === 'object') {
		return `{${Object.entries(value as Record<string, unknown>)
			.filter(([, entry]) => entry !== undefined)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
			.join(',')}}`;
	}

	return JSON.stringify(value) ?? 'undefined';
};

const mergeAccount = (existing: PleromaAccount | undefined, account: PleromaAccount, options: UpsertOptions): PleromaAccount => {
	if (!existing) return account;
	const relationship = options.relationship === 'replace'
		? account.pleroma.relationship ?? existing.pleroma.relationship
		: existing.pleroma.relationship ?? account.pleroma.relationship;

	return {
		...existing,
		...definedEntries(account as Record<string, unknown>),
		pleroma: {
			...existing.pleroma,
			...definedEntries(account.pleroma),
			relationship
		}
	} as PleromaAccount;
};

const sameAccount = (left: PleromaAccount | undefined, right: PleromaAccount) => {
	if (!left) return false;
	return stableStringify(left) === stableStringify(right);
};

const removeAccountAliases = (idByHandle: Record<string, string>, account: PleromaAccount) => {
	let next = idByHandle;
	for (const key of accountKeys(account)) {
		if (next[key] !== account.id) continue;
		if (next === idByHandle) next = { ...idByHandle };
		delete next[key];
	}
	return next;
};

export const upsertPleromaAccounts = (cache: PleromaAccountCache, accounts: PleromaAccount[], options: UpsertOptions = {}) => {
	if (accounts.length === 0) return cache;

	let byId = cache.byId;
	let idByHandle = cache.idByHandle;
	let changed = false;
	for (const account of accounts) {
		if (!account.id) continue;
		const existing = byId[account.id];
		const merged = mergeAccount(existing, account, options);
		if (!sameAccount(existing, merged)) {
			if (byId === cache.byId) byId = { ...cache.byId };
			if (existing) idByHandle = removeAccountAliases(idByHandle, existing);
			byId[account.id] = merged;
			changed = true;
		}
		for (const key of accountKeys(merged)) {
			if (idByHandle[key] === merged.id) continue;
			if (idByHandle === cache.idByHandle) idByHandle = { ...cache.idByHandle };
			idByHandle[key] = merged.id;
			changed = true;
		}
	}

	return changed ? { byId, idByHandle } : cache;
};

export const getCachedPleromaAccount = (cache: PleromaAccountCache, handleOrId: string | null | undefined) => {
	const key = normalizedAccountKey(handleOrId);
	if (!key) return null;
	return cache.byId[key] ?? cache.byId[cache.idByHandle[key]] ?? null;
};

export const accountsFromPleromaStatus = (status: PleromaStatus | null | undefined) => {
	const accounts: PleromaAccount[] = [];
	const seen = new Set<string>();
	const collect = (current: PleromaStatus | null | undefined) => {
		if (!current) return;
		if (current.account?.id && !seen.has(current.account.id)) {
			seen.add(current.account.id);
			accounts.push(current.account);
		}
		collect(current.reblog);
		collect(current.pleroma.quote);
	};

	collect(status);
	return accounts;
};

export const accountsFromPleromaStatuses = (statuses: PleromaStatus[]) => statuses.flatMap(accountsFromPleromaStatus);

export const accountsFromPleromaNotifications = (notifications: PleromaNotification[]) => notifications.flatMap((notification) => [
	notification.account,
	...accountsFromPleromaStatus(notification.status)
]);
