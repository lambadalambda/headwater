import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  restoreDesktopAccount,
  saveDesktopBackup,
  signupDesktopAccount,
} from '../src/onboarding.js';

const dirs: string[] = [];
const origin = 'http://127.0.0.1:43123';
const bootstrapKey = 'k'.repeat(43);

const captureError = async (promise: Promise<unknown>): Promise<Error> => {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Error) return error;
    throw error;
  }
  throw new Error('expected operation to fail');
};

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('desktop onboarding operations', () => {
  it('creates an account only on the fixed loopback origin with a private signup proof', async () => {
    let request: { url: string; init?: RequestInit } | null = null;
    const account = await signupDesktopAccount({
      origin,
      bootstrapKey,
      displayName: 'Quiet Fox',
      fetch: async (input, init) => {
        request = { url: String(input), init };
        return new Response(JSON.stringify({ account: { acct: 'quiet@nine.testrun.org' } }), { status: 200 });
      },
    });

    const captured = request as { url: string; init?: RequestInit } | null;
    expect(account).toEqual({ acct: 'quiet@nine.testrun.org' });
    expect(captured?.url).toBe(`${origin}/api/headwater/signup`);
    expect(captured?.init?.headers).toMatchObject({ 'content-type': 'application/json' });
    expect((captured?.init?.headers as Record<string, string>)['x-headwater-desktop-proof']).toMatch(/^v1\.signup\./);
    expect(String(captured?.init?.body)).toBe(JSON.stringify({ display_name: 'Quiet Fox' }));
    expect(JSON.stringify(account)).not.toContain(bootstrapKey);
  });

  it('restores a selected backup without returning its native path', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'headwater-desktop-restore-'));
    dirs.push(dir);
    const backupPath = join(dir, 'identity.dnbk');
    writeFileSync(backupPath, 'backup-bytes');
    let uploadedName = '';
    let uploadedPassphrase = '';
    const account = await restoreDesktopAccount({
      origin,
      bootstrapKey,
      backupPath,
      passphrase: 'correct horse battery staple',
      fetch: async (_input, init) => {
        const form = init?.body as FormData;
        uploadedName = (form.get('file') as File).name;
        uploadedPassphrase = String(form.get('passphrase'));
        expect((init?.headers as Record<string, string>)['x-headwater-desktop-proof']).toMatch(/^v1\.restore\./);
        return new Response(JSON.stringify({ account: { acct: 'restored@example.org' } }), { status: 200 });
      },
    });

    expect(uploadedName).toBe(basename(backupPath));
    expect(uploadedPassphrase).toBe('correct horse battery staple');
    expect(account).toEqual({ acct: 'restored@example.org' });
    expect(account).not.toHaveProperty('path');
  });

  it('streams a bearer-authorized backup to its native destination before reporting success', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'headwater-desktop-backup-'));
    dirs.push(dir);
    const destination = join(dir, 'identity.dnbk');
    const bytes = new TextEncoder().encode('encrypted-backup');
    const result = await saveDesktopBackup({
      origin,
      destination,
      accessToken: 't'.repeat(43),
      passphrase: 'correct horse battery staple',
      fetch: async (_input, init) => {
        expect(init?.headers).toMatchObject({
          authorization: `Bearer ${'t'.repeat(43)}`,
          'content-type': 'application/json',
        });
        return new Response(bytes, { status: 200, headers: { 'content-length': String(bytes.byteLength) } });
      },
    });

    expect(result).toEqual({ filename: 'identity.dnbk' });
    expect(readFileSync(destination, 'utf8')).toBe('encrypted-backup');
  });

  it('removes partial output when a streamed backup exceeds its declared bound', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'headwater-desktop-backup-'));
    dirs.push(dir);
    const destination = join(dir, 'identity.dnbk');
    await expect(saveDesktopBackup({
      origin,
      destination,
      accessToken: 't'.repeat(43),
      passphrase: 'passphrase',
      maxBytes: 4,
      fetch: async () => new Response('too-large', { status: 200, headers: { 'content-length': '9' } }),
    })).rejects.toThrow(/backup response/i);
    expect(() => readFileSync(destination)).toThrow();
  });

  it('rejects remote origins and malformed secret-bearing inputs before fetching', async () => {
    await expect(signupDesktopAccount({
      origin: 'https://example.org',
      bootstrapKey,
      displayName: 'Alice',
    })).rejects.toThrow(/origin/i);
    await expect(saveDesktopBackup({
      origin,
      destination: '/tmp/ignored.dnbk',
      accessToken: 'not a token',
      passphrase: 'passphrase',
    })).rejects.toThrow(/token/i);
  });

  it('redacts native paths from restore and backup filesystem errors', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'headwater-desktop-path-errors-'));
    dirs.push(dir);
    const missingBackup = join(dir, 'private-account-name.dnbk');
    const unavailableDestination = join(dir, 'missing-parent', 'private-export-name.dnbk');

    const restoreError = await captureError(restoreDesktopAccount({
      origin,
      bootstrapKey,
      backupPath: missingBackup,
      passphrase: 'passphrase',
    }));
    expect(restoreError.message).toMatch(/backup file/i);
    expect(restoreError.message).not.toContain(missingBackup);

    const bytes = new TextEncoder().encode('encrypted-backup');
    const saveError = await captureError(saveDesktopBackup({
      origin,
      destination: unavailableDestination,
      accessToken: 't'.repeat(43),
      passphrase: 'passphrase',
      fetch: async () => new Response(bytes, { status: 200, headers: { 'content-length': String(bytes.byteLength) } }),
    }));
    expect(saveError.message).toMatch(/save.*backup/i);
    expect(saveError.message).not.toContain(unavailableDestination);
  });

  it('does not forward daemon restore internals to the renderer', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'headwater-desktop-restore-error-'));
    dirs.push(dir);
    const backupPath = join(dir, 'identity.dnbk');
    writeFileSync(backupPath, 'backup-bytes');

    const error = await captureError(restoreDesktopAccount({
      origin,
      bootstrapKey,
      backupPath,
      passphrase: 'wrong passphrase',
      fetch: async () => new Response(JSON.stringify({ error: '/private/data/restore-journal.json failed' }), { status: 422 }),
    }));

    expect(error.message).toBe('The backup file or passphrase could not be restored.');
    expect(error.message).not.toContain('/private/data');
  });
});
