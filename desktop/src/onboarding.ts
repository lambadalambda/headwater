import { closeSync, createWriteStream, fsyncSync, openAsBlob, openSync, renameSync, statSync, unlinkSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import { basename, dirname, isAbsolute } from 'node:path';
import { createDesktopBootstrapProof } from './bootstrap-proof.js';

const DEFAULT_MAX_BACKUP_BYTES = 256 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 16_384;

const localOrigin = (raw: string): string => {
  const url = new URL(raw);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || !url.port || url.origin !== raw) {
    throw new Error('invalid desktop onboarding origin');
  }
  return raw;
};

const boundedString = (value: unknown, name: string, max: number): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`invalid desktop ${name}`);
  return value;
};

const requestSignal = (signal: AbortSignal | undefined, timeoutMs: number): AbortSignal => {
  const timeout = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
};

const readBoundedText = async (response: Response, maxBytes = MAX_RESPONSE_BYTES): Promise<string> => {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel().catch(() => {});
    throw new Error('invalid desktop onboarding response');
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new Error('invalid desktop onboarding response');
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
};

const responseError = async (response: Response): Promise<Error> => {
  const text = await readBoundedText(response).catch(() => '');
  try {
    const value = JSON.parse(text) as { error?: unknown };
    if (typeof value.error === 'string' && value.error && value.error.length <= 512) return new Error(value.error);
  } catch {
    // Status-only errors avoid retaining arbitrary daemon response bodies.
  }
  return new Error(`desktop onboarding failed (${response.status})`);
};

const accountResponse = async (response: Response): Promise<Readonly<{ acct: string }>> => {
  if (!response.ok) throw await responseError(response);
  const text = await readBoundedText(response);
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('invalid desktop onboarding response'); }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('invalid desktop onboarding response');
  const account = (value as Record<string, unknown>)['account'];
  if (typeof account !== 'object' || account === null || Array.isArray(account)) throw new Error('invalid desktop onboarding response');
  const acct = (account as Record<string, unknown>)['acct'];
  if (typeof acct !== 'string' || !acct || acct.length > 512) throw new Error('invalid desktop onboarding response');
  return Object.freeze({ acct });
};

export const signupDesktopAccount = async (input: Readonly<{
  origin: string;
  bootstrapKey: string;
  displayName: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
}>): Promise<Readonly<{ acct: string }>> => {
  const origin = localOrigin(input.origin);
  const displayName = boundedString(input.displayName, 'display name', 200).trim();
  const response = await (input.fetch ?? globalThis.fetch)(`${origin}/api/headwater/signup`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-headwater-desktop-proof': createDesktopBootstrapProof({ key: input.bootstrapKey, operation: 'signup' }),
    },
    body: JSON.stringify({ display_name: displayName }),
    redirect: 'error',
    signal: requestSignal(input.signal, 120_000),
  });
  return accountResponse(response);
};

export const restoreDesktopAccount = async (input: Readonly<{
  origin: string;
  bootstrapKey: string;
  backupPath: string;
  passphrase: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
  maxBytes?: number;
}>): Promise<Readonly<{ acct: string }>> => {
  const origin = localOrigin(input.origin);
  const passphrase = boundedString(input.passphrase, 'backup passphrase', 1024);
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BACKUP_BYTES;
  if (!isAbsolute(input.backupPath)) throw new Error('invalid desktop backup file');
  let file: Blob;
  try {
    if (statSync(input.backupPath).size > maxBytes) throw new Error('invalid desktop backup file');
    file = await openAsBlob(input.backupPath, { type: 'application/octet-stream' });
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid desktop backup file') throw error;
    throw new Error('Headwater could not open the selected backup file.');
  }
  const form = new FormData();
  form.set('file', file, basename(input.backupPath));
  form.set('passphrase', passphrase);
  const response = await (input.fetch ?? globalThis.fetch)(`${origin}/api/headwater/restore`, {
    method: 'POST',
    headers: { 'x-headwater-desktop-proof': createDesktopBootstrapProof({ key: input.bootstrapKey, operation: 'restore' }) },
    body: form,
    redirect: 'error',
    signal: requestSignal(input.signal, 300_000),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => {});
    throw new Error('The backup file or passphrase could not be restored.');
  }
  return accountResponse(response);
};

export const saveDesktopBackup = async (input: Readonly<{
  origin: string;
  destination: string;
  accessToken: string;
  passphrase: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
  maxBytes?: number;
}>): Promise<Readonly<{ filename: string }>> => {
  const origin = localOrigin(input.origin);
  if (!isAbsolute(input.destination)) throw new Error('invalid desktop backup destination');
  const accessToken = boundedString(input.accessToken, 'access token', 512);
  if (!/^[A-Za-z0-9_-]+$/.test(accessToken)) throw new Error('invalid desktop access token');
  const passphrase = boundedString(input.passphrase, 'backup passphrase', 1024);
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BACKUP_BYTES;
  const response = await (input.fetch ?? globalThis.fetch)(`${origin}/api/headwater/backup/export`, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ passphrase }),
    redirect: 'error',
    signal: requestSignal(input.signal, 300_000),
  });
  if (!response.ok) throw await responseError(response);
  const declared = Number(response.headers.get('content-length'));
  if (!Number.isSafeInteger(declared) || declared < 1 || declared > maxBytes || !response.body) {
    await response.body?.cancel().catch(() => {});
    throw new Error('invalid desktop backup response');
  }
  const temporary = `${input.destination}.partial-${process.pid}-${Date.now()}`;
  let size = 0;
  try {
    const counter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        size += chunk.byteLength;
        callback(size > maxBytes ? new Error('invalid desktop backup response') : null, chunk);
      },
    });
    await pipeline(
      Readable.fromWeb(response.body as unknown as Parameters<typeof Readable.fromWeb>[0]),
      counter,
      createWriteStream(temporary, { flags: 'wx', mode: 0o600 }),
    );
    if (size !== declared) throw new Error('invalid desktop backup response');
    const descriptor = openSync(temporary, 'r');
    try { fsyncSync(descriptor); } finally { closeSync(descriptor); }
    renameSync(temporary, input.destination);
    if (process.platform !== 'win32') {
      const directory = openSync(dirname(input.destination), 'r');
      try { fsyncSync(directory); } finally { closeSync(directory); }
    }
    return Object.freeze({ filename: basename(input.destination) });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code) throw new Error('Headwater could not save the recovery backup.');
    throw error;
  } finally {
    try { unlinkSync(temporary); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('Headwater could not clean up the incomplete recovery backup.');
    }
  }
};
