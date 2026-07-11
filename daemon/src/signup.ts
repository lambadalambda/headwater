import { isIP } from 'node:net';

export type NewAccountCredentials = {
  addr: string;
  password: string;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RESPONSE_BYTES = 16 * 1024;

export type RegistrationLimits = {
  timeoutMs?: number;
  maxResponseBytes?: number;
};

export const normalizeRelayUrl = (value: string): string => {
  if (
    value.trim() !== value ||
    !/^https:\/\/[^/?#\\\s]+\/?$/.test(value) ||
    value.slice('https://'.length).split('/')[0]!.includes('@') ||
    value.slice('https://'.length).split('/')[0]!.endsWith(':')
  ) throw new Error('invalid relay URL');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('invalid relay URL');
  }
  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.hostname === '' ||
    (url.pathname !== '' && url.pathname !== '/') ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    throw new Error('invalid relay URL');
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(hostname) === 0) {
    const labels = hostname.split('.');
    if (
      hostname.length > 253 ||
      hostname.endsWith('.') ||
      labels.some((label) =>
        label.length === 0 ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)
      )
    ) throw new Error('invalid relay URL');
  }
  return url.origin;
};

const readBoundedText = async (
  res: Response,
  maxBytes: number,
  setActiveReader: (reader: ReadableStreamDefaultReader<Uint8Array> | null) => void,
): Promise<string> => {
  const declaredLength = Number(res.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await res.body?.cancel().catch(() => undefined);
    throw new Error('registration response is too large');
  }
  if (!res.body) return '';

  const reader = res.body.getReader();
  setActiveReader(reader);
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('registration response is too large');
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    setActiveReader(null);
    reader.releaseLock();
  }
};

const parseCredentials = (text: string): NewAccountCredentials => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error('invalid registration response');
  }
  if (!value || typeof value !== 'object') throw new Error('invalid registration response');
  const { email, password } = value as { email?: unknown; password?: unknown };
  const addressParts = typeof email === 'string' ? email.split('@') : [];
  const local = addressParts[0] ?? '';
  const domain = addressParts[1] ?? '';
  const validLocal = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/i.test(local);
  const validDomain = domain.length <= 255 && domain.split('.').every((label) =>
    label.length > 0 &&
    label.length <= 63 &&
    /^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/i.test(label)
  );
  if (
    typeof email !== 'string' ||
    email.length > 320 ||
    addressParts.length !== 2 ||
    local.length === 0 ||
    local.length > 64 ||
    !validLocal ||
    !validDomain ||
    typeof password !== 'string' ||
    password.length === 0 ||
    password.length > 4096
  ) {
    throw new Error('invalid registration response');
  }
  return { addr: email, password };
};

/**
 * Registers a fresh chatmail account against a relay's `POST /new` endpoint.
 * `fetchImpl` is injectable so unit tests never hit the real network.
 */
export const registerAccount = async (
  relay: string,
  fetchImpl: typeof fetch = fetch,
  limits: RegistrationLimits = {},
): Promise<NewAccountCredentials> => {
  const normalizedRelay = normalizeRelayUrl(relay);
  const timeoutMs = limits.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxResponseBytes = limits.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
  const controller = new AbortController();
  let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      void activeReader?.cancel().catch(() => undefined);
      reject(new Error('registration request timed out'));
    }, timeoutMs);
  });
  const request = (async () => {
    const res = await fetchImpl(`${normalizedRelay}/new`, {
      method: 'POST',
      signal: controller.signal,
      redirect: 'error',
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      throw new Error(`registration failed with status ${res.status}`);
    }
    return parseCredentials(await readBoundedText(res, maxResponseBytes, (reader) => {
      activeReader = reader;
    }));
  })();
  try {
    return await Promise.race([request, timeout]);
  } catch (error) {
    controller.abort();
    if (timedOut) throw new Error('registration request timed out');
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
};
