export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type PleromaClientError =
	| { kind: 'unauthenticated'; message: string; path?: string }
	| { kind: 'http'; status: number; message: string; path: string; response: unknown }
	| { kind: 'network'; message: string; path: string; cause: unknown };

type QueryScalar = string | number | boolean | null | undefined;
type QueryValue = QueryScalar | readonly QueryScalar[];
type RequestOptions = {
	method?: string;
	path: string;
	query?: Record<string, QueryValue>;
	body?: unknown;
	form?: URLSearchParams;
	multipart?: FormData;
	signal?: AbortSignal;
	auth?: 'required' | 'optional' | 'none';
};

type PleromaHttpResponse<ResponseBody> = {
	body: ResponseBody;
	headers: Headers;
};

type HttpConfig = {
	instanceUrl: string;
	accessToken?: string;
	fetch?: FetchLike;
};

export const normalizeInstanceUrl = (instanceUrl: string) => {
	const trimmed = instanceUrl.trim();
	const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	const url = new URL(withProtocol);
	const isLocalhost =
		url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1' || url.hostname === '[::1]';

	if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost)) {
		throw new Error('Pleroma OAuth requests require an HTTPS instance URL outside localhost.');
	}

	url.username = '';
	url.password = '';

	return url.origin;
};

export const encodePathSegment = (segment: string) => encodeURIComponent(segment);

const appendQuery = (url: URL, query: Record<string, QueryValue> = {}) => {
	for (const [key, value] of Object.entries(query)) {
		if (Array.isArray(value)) {
			for (const item of value) {
				if (item === undefined || item === null || item === '') continue;
				url.searchParams.append(key, String(item));
			}
			continue;
		}
		if (value === undefined || value === null || value === '') continue;
		url.searchParams.set(key, String(value));
	}
};

const readResponsePayload = async (response: Response) => {
	const text = await response.text();
	if (!text) return null;

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return text;
	}
};

const errorMessageFromPayload = (payload: unknown, fallback: string) => {
	if (payload && typeof payload === 'object') {
		const maybeError = 'error' in payload ? payload.error : undefined;
		const maybeDescription = 'error_description' in payload ? payload.error_description : undefined;

		if (typeof maybeError === 'string') return maybeError;
		if (typeof maybeDescription === 'string') return maybeDescription;
	}

	if (typeof payload === 'string' && payload.trim()) return payload;

	return fallback;
};

export const isPleromaClientError = (error: unknown): error is PleromaClientError =>
	Boolean(error && typeof error === 'object' && 'kind' in error);

export const toPleromaClientError = (error: unknown): PleromaClientError => {
	if (isPleromaClientError(error)) return error;

	return {
		kind: 'network',
		path: 'unknown',
		message: error instanceof Error ? error.message : 'Unexpected Pleroma request failure',
		cause: error
	};
};

export const createPleromaHttp = ({ instanceUrl, accessToken, fetch: fetchImpl }: HttpConfig) => {
	const origin = normalizeInstanceUrl(instanceUrl);
	const requestFetch = fetchImpl ?? globalThis.fetch?.bind(globalThis);

	if (!requestFetch) {
		throw new Error('A fetch implementation is required for Pleroma requests.');
	}

	const requestWithHeaders = async <ResponseBody>({
		method = 'GET',
		path,
		query,
		body,
		form,
		multipart,
		signal,
		auth = 'optional'
	}: RequestOptions): Promise<PleromaHttpResponse<ResponseBody>> => {
		if (auth === 'required' && !accessToken) {
			throw {
				kind: 'unauthenticated',
				path,
				message: 'This Pleroma request requires an OAuth access token.'
			} satisfies PleromaClientError;
		}

		const url = new URL(path, origin);
		appendQuery(url, query);

		const headers = new Headers({ accept: 'application/json' });
		if (accessToken && auth !== 'none') headers.set('authorization', `Bearer ${accessToken}`);

		let requestBody: BodyInit | undefined;
		if (multipart) {
			requestBody = multipart;
		} else if (form) {
			requestBody = form;
			headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
		} else if (body !== undefined) {
			requestBody = JSON.stringify(body);
			headers.set('content-type', 'application/json');
		}

		let response: Response;
		try {
			response = await requestFetch(url.toString(), { method, headers, body: requestBody, signal });
		} catch (error) {
			throw {
				kind: 'network',
				path,
				message: error instanceof Error ? error.message : 'Pleroma request failed before a response was received.',
				cause: error
			} satisfies PleromaClientError;
		}

		const payload = response.status === 204 ? null : await readResponsePayload(response);
		if (!response.ok) {
			throw {
				kind: 'http',
				status: response.status,
				path,
				message: errorMessageFromPayload(payload, response.statusText || 'Pleroma request failed.'),
				response: payload
			} satisfies PleromaClientError;
		}

		return { body: payload as ResponseBody, headers: response.headers };
	};
	const request = async <ResponseBody>(options: RequestOptions) => (await requestWithHeaders<ResponseBody>(options)).body;

	return { origin, request, requestWithHeaders };
};
