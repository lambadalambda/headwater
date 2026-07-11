import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AccountConflictError,
  compareExchangeAccount,
  readAccounts,
  writeAccount,
} from '../src/config.js';

describe('readAccounts', () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('returns an empty object when the file does not exist', () => {
    dir = mkdtempSync(join(tmpdir(), 'deltanet-config-'));
    expect(readAccounts(join(dir, 'nope.json'))).toEqual({});
  });

  it('reads existing credentials', () => {
    dir = mkdtempSync(join(tmpdir(), 'deltanet-config-'));
    const path = join(dir, 'accounts.local.json');
    writeAccount(path, 'main', { addr: 'a@b.org', password: 'p', displayName: 'alice' });
    expect(readAccounts(path)).toEqual({
      main: { addr: 'a@b.org', password: 'p', displayName: 'alice' },
    });
  });
});

describe('writeAccount', () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('creates the file and adds the named account', () => {
    dir = mkdtempSync(join(tmpdir(), 'deltanet-config-'));
    const path = join(dir, 'accounts.local.json');
    writeAccount(path, 'main', { addr: 'a@b.org', password: 'p', displayName: 'alice' });
    const written = JSON.parse(readFileSync(path, 'utf8'));
    expect(written).toEqual({ main: { addr: 'a@b.org', password: 'p', displayName: 'alice' } });
  });

  it('preserves existing accounts when adding another', () => {
    dir = mkdtempSync(join(tmpdir(), 'deltanet-config-'));
    const path = join(dir, 'accounts.local.json');
    writeAccount(path, 'main', { addr: 'a@b.org', password: 'p', displayName: 'alice' });
    writeAccount(path, 'peer', { addr: 'c@d.org', password: 'q', displayName: 'bob' });
    expect(readAccounts(path)).toEqual({
      main: { addr: 'a@b.org', password: 'p', displayName: 'alice' },
      peer: { addr: 'c@d.org', password: 'q', displayName: 'bob' },
    });
  });

  it('compare-exchanges one account without replacing unrelated entries', () => {
    dir = mkdtempSync(join(tmpdir(), 'deltanet-config-'));
    const path = join(dir, 'accounts.local.json');
    const before = { addr: 'a@b.org', password: 'p', displayName: 'alice' };
    const after = { addr: 'new@b.org', password: 'new', displayName: 'alice' };
    writeAccount(path, 'main', before);
    writeAccount(path, 'peer', { addr: 'c@d.org', password: 'q', displayName: 'bob' });

    compareExchangeAccount(path, 'main', before, after);

    expect(readAccounts(path)).toEqual({
      main: after,
      peer: { addr: 'c@d.org', password: 'q', displayName: 'bob' },
    });
  });

  it('fails closed when the selected account changed concurrently', () => {
    dir = mkdtempSync(join(tmpdir(), 'deltanet-config-'));
    const path = join(dir, 'accounts.local.json');
    writeAccount(path, 'main', { addr: 'current@b.org', password: 'p', displayName: 'alice' });

    expect(() => compareExchangeAccount(
      path,
      'main',
      { addr: 'stale@b.org', password: 'old', displayName: 'alice' },
      { addr: 'new@b.org', password: 'new', displayName: 'alice' },
    )).toThrow(AccountConflictError);
    expect(readAccounts(path).main?.addr).toBe('current@b.org');
  });
});
