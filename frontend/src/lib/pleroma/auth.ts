import { getContext, setContext } from 'svelte';
import { get, writable, type Readable } from 'svelte/store';
import { isPleromaClientError } from './http';
import {
	clearPendingOAuth,
	readPendingOAuth,
	readSplitPleromaAuthState,
	signOutPleroma,
	storePendingOAuth,
	writePleromaSession,
	type PleromaStorage
} from './session';
import type { PendingPleromaOAuth, PleromaAuthState, PleromaSession } from './types';

type PleromaAuthStorage = {
	sessionStorage: PleromaStorage;
	pendingStorage: PleromaStorage;
};

type PleromaAuthOptions = Partial<PleromaAuthStorage> & {
	browser?: boolean;
	now?: () => number;
};

type GuardOptions = {
	redirectTo?: string;
};

export type PleromaAuthGuardResult =
	| { allowed: true; session: PleromaSession }
	| { allowed: false; reason: 'authenticating' | 'unauthenticated'; redirectTo: string };

export type PleromaAuthFailureResult =
	| { handled: true; redirectTo: string; state: PleromaAuthState }
	| { handled: false; state: PleromaAuthState };

export type PleromaAuth = {
	state: Readable<PleromaAuthState>;
	getState: () => PleromaAuthState;
	refresh: () => PleromaAuthState;
	getPendingOAuth: () => PendingPleromaOAuth | null;
	startOAuth: (pending: PendingPleromaOAuth) => PleromaAuthState;
	clearPendingOAuth: () => PleromaAuthState;
	completeOAuth: (session: PleromaSession) => PleromaAuthState;
	signOut: () => PleromaAuthState;
	requireAuthenticated: (options?: GuardOptions) => PleromaAuthGuardResult;
	handleAuthFailure: (error: unknown, options?: GuardOptions) => PleromaAuthFailureResult;
};

const PLEROMA_AUTH_CONTEXT = Symbol('pleroma.auth');
const unauthenticatedState: PleromaAuthState = { status: 'unauthenticated' };

const shouldUseBrowserStorage = (browser?: boolean) => browser ?? typeof window !== 'undefined';

const resolveStorage = (options: PleromaAuthOptions): PleromaAuthStorage | null => {
	if (!shouldUseBrowserStorage(options.browser)) return null;

	let browserSessionStorage: PleromaStorage | undefined;
	let browserPendingStorage: PleromaStorage | undefined;
	try {
		browserSessionStorage = typeof window === 'undefined' ? undefined : window.localStorage;
		browserPendingStorage = typeof window === 'undefined' ? undefined : window.sessionStorage;
	} catch {
		return null;
	}

	const sessionStorage = options.sessionStorage ?? browserSessionStorage;
	const pendingStorage = options.pendingStorage ?? browserPendingStorage;

	if (!sessionStorage || !pendingStorage) return null;

	return { sessionStorage, pendingStorage };
};

const setStoreState = (store: ReturnType<typeof writable<PleromaAuthState>>, next: PleromaAuthState) => {
	store.set(next);
	return next;
};

export const isPleromaAuthFailure = (error: unknown) => {
	if (!isPleromaClientError(error)) return false;
	if (error.kind === 'unauthenticated') return true;

	return error.kind === 'http' && (error.status === 401 || error.status === 403);
};

export const guardPleromaAuthState = (state: PleromaAuthState, { redirectTo = '/' }: GuardOptions = {}): PleromaAuthGuardResult => {
	if (state.status === 'authenticated') return { allowed: true, session: state.session };

	return { allowed: false, reason: state.status, redirectTo };
};

export const createPleromaAuth = (options: PleromaAuthOptions = {}): PleromaAuth => {
	const state = writable<PleromaAuthState>(unauthenticatedState);
	const now = () => options.now?.() ?? Date.now();

	const refresh = () => {
		const storage = resolveStorage(options);
		if (!storage) return setStoreState(state, unauthenticatedState);

		try {
			return setStoreState(
				state,
				readSplitPleromaAuthState({
					sessionStorage: storage.sessionStorage,
					pendingStorage: storage.pendingStorage,
					now: now()
				})
			);
		} catch {
			return setStoreState(state, unauthenticatedState);
		}
	};

	const getPendingOAuth = () => {
		const storage = resolveStorage(options);
		if (!storage) return null;

		try {
			const pending = readPendingOAuth(storage.pendingStorage, now());
			if (!pending && get(state).status === 'authenticating') refresh();

			return pending;
		} catch {
			refresh();
			return null;
		}
	};

	const startOAuth = (pending: PendingPleromaOAuth) => {
		const storage = resolveStorage(options);
		if (!storage) return setStoreState(state, unauthenticatedState);

		try {
			storePendingOAuth(storage.pendingStorage, pending);
			return setStoreState(state, { status: 'authenticating', pending });
		} catch {
			return refresh();
		}
	};

	const clearPendingAuth = () => {
		const storage = resolveStorage(options);
		if (!storage) return setStoreState(state, unauthenticatedState);

		try {
			clearPendingOAuth(storage.pendingStorage);
		} catch {
			return refresh();
		}

		return refresh();
	};

	const completeOAuth = (session: PleromaSession) => {
		const storage = resolveStorage(options);
		if (!storage) return setStoreState(state, unauthenticatedState);

		try {
			writePleromaSession(storage.sessionStorage, session);
		} catch {
			return setStoreState(state, unauthenticatedState);
		}

		try {
			clearPendingOAuth(storage.pendingStorage);
		} catch {
			// The session is already persisted; keep the user signed in even if pending cleanup fails.
		}

		return setStoreState(state, { status: 'authenticated', session });
	};

	const signOut = () => {
		const storage = resolveStorage(options);
		if (!storage) return setStoreState(state, unauthenticatedState);

		try {
			signOutPleroma(storage.sessionStorage);
		} catch {
			// Sign-out state must not depend on storage access being available.
		}

		try {
			clearPendingOAuth(storage.pendingStorage);
		} catch {
			// Sign-out state must not depend on storage access being available.
		}

		return setStoreState(state, unauthenticatedState);
	};

	const getState = () => get(state);

	const auth: PleromaAuth = {
		state: { subscribe: state.subscribe },
		getState,
		refresh,
		getPendingOAuth,
		startOAuth,
		clearPendingOAuth: clearPendingAuth,
		completeOAuth,
		signOut,
		requireAuthenticated: (guardOptions) => guardPleromaAuthState(getState(), guardOptions),
		handleAuthFailure: (error: unknown, { redirectTo = '/' }: GuardOptions = {}) => {
			if (!isPleromaAuthFailure(error)) return { handled: false, state: getState() };

			return { handled: true, redirectTo, state: signOut() };
		}
	};

	if (shouldUseBrowserStorage(options.browser)) refresh();

	return auth;
};

export const setPleromaAuthContext = (auth: PleromaAuth = createPleromaAuth()) => {
	setContext(PLEROMA_AUTH_CONTEXT, auth);
	return auth;
};

export const getPleromaAuthContext = () => {
	const auth = getContext<PleromaAuth | undefined>(PLEROMA_AUTH_CONTEXT);
	if (!auth) throw new Error('Pleroma auth context is not available.');

	return auth;
};
