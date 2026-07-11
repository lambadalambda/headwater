import {
  closeSync,
  existsSync,
  fsyncSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Envelope } from '../src/envelope.js';
import {
  createStore,
  STORE_SCHEMA_VERSION,
  StoreAccessError,
  StoreConflictError,
  StoreCorruptionError,
} from '../src/store.js';

let dir: string;
let filePath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'deltanet-store-persistence-'));
  filePath = join(dir, 'store.json');
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(dir, { recursive: true, force: true });
});

const json = (path: string): any => JSON.parse(readFileSync(path, 'utf8'));

describe('atomic store persistence', () => {
  it('recovers the newest complete generation when the primary rename fails after recovery rename', () => {
    const seeded = createStore(filePath);
    seeded.pinKey('alice@example.org', 'KEY_A');

    const store = createStore(filePath, {
      fileOperations: {
        rename: (from, to) => {
          if (to === filePath) throw Object.assign(new Error('injected rename failure'), { code: 'EIO' });
          renameSync(from, to);
        },
      },
    });

    expect(() => store.addPendingFollowRequest('bob@example.org', 123)).toThrow(
      'injected rename failure',
    );
    expect(readdirSync(dir).filter((name) => name.includes('.tmp'))).toEqual([]);

    const reloaded = createStore(filePath);
    expect(reloaded.pinnedKey('alice@example.org')).toBe('KEY_A');
    expect(reloaded.hasPendingFollowRequest('bob@example.org')).toBe(true);
    expect(json(filePath)).toEqual(json(`${filePath}.recovery`));
  });

  it('keeps both complete old generations when recovery rename fails', () => {
    const seeded = createStore(filePath);
    seeded.pinKey('alice@example.org', 'KEY_A');
    const before = readFileSync(filePath, 'utf8');
    const store = createStore(filePath, {
      fileOperations: {
        rename: (from, to) => {
          if (to === `${filePath}.recovery`) {
            throw Object.assign(new Error('injected recovery rename failure'), { code: 'EIO' });
          }
          renameSync(from, to);
        },
      },
    });

    expect(() => store.addPendingFollowRequest('bob@example.org', 123)).toThrow(
      'injected recovery rename failure',
    );
    expect(readFileSync(filePath, 'utf8')).toBe(before);
    expect(readFileSync(`${filePath}.recovery`, 'utf8')).toBe(before);
    expect(createStore(filePath).hasPendingFollowRequest('bob@example.org')).toBe(false);
  });

  it('leaves complete new JSON when directory sync fails after the primary rename', () => {
    const seeded = createStore(filePath);
    seeded.pinKey('alice@example.org', 'KEY_A');
    let directoryFd: number | null = null;
    let primaryRenamed = false;
    const store = createStore(filePath, {
      fileOperations: {
        open: (path, flags, mode) => {
          const fd = openSync(path, flags as any, mode);
          if (path === dir) directoryFd = fd;
          else if (fd === directoryFd) directoryFd = null;
          return fd;
        },
        sync: (fd) => {
          if (fd === directoryFd && primaryRenamed) {
            throw Object.assign(new Error('injected directory sync failure'), { code: 'EIO' });
          }
          fsyncSync(fd);
        },
        rename: (from, to) => {
          renameSync(from, to);
          if (to === filePath) primaryRenamed = true;
        },
      },
    });

    expect(() => store.addPendingFollowRequest('bob@example.org', 123)).toThrow(
      'injected directory sync failure',
    );
    expect(json(filePath).pinnedKeys).toEqual({ 'alice@example.org': 'KEY_A' });
    expect(json(filePath).pendingFollowRequests).toEqual({ 'bob@example.org': 123 });
    expect(readdirSync(dir).filter((name) => name.includes('.tmp'))).toEqual([]);
    expect(createStore(filePath).hasPendingFollowRequest('bob@example.org')).toBe(true);
  });

  it('writes every successful newest generation to both primary and recovery', () => {
    const store = createStore(filePath);
    store.pinKey('alice@example.org', 'KEY_A');
    store.addPendingFollowRequest('bob@example.org', 123);

    const primary = json(filePath);
    const recovery = json(`${filePath}.recovery`);
    expect(primary).toEqual(recovery);
    expect(primary.generation).toBe(2);
    expect(recovery.pinnedKeys).toEqual({ 'alice@example.org': 'KEY_A' });
    expect(recovery.pendingFollowRequests).toEqual({ 'bob@example.org': 123 });
  });

  it('selects a higher primary generation and heals an older valid recovery generation', () => {
    const store = createStore(filePath);
    store.pinKey('first@example.org', 'FIRST');
    const old = readFileSync(filePath, 'utf8');
    store.pinKey('newest@example.org', 'NEWEST');
    writeFileSync(`${filePath}.recovery`, old);

    const reloaded = createStore(filePath);
    expect(reloaded.pinnedKey('newest@example.org')).toBe('NEWEST');
    expect(json(`${filePath}.recovery`)).toEqual(json(filePath));
  });

  it('never overwrites a malformed primary when no valid backup exists', () => {
    const malformed = '{"schemaVersion":';
    writeFileSync(filePath, malformed);

    const store = createStore(filePath);
    expect(() => store.pinnedKey('alice@example.org')).toThrow(StoreCorruptionError);
    expect(() => store.pinnedKey('alice@example.org')).toThrow(/no valid store generation/);
    expect(readFileSync(filePath, 'utf8')).toBe(malformed);
    expect(existsSync(`${filePath}.recovery`)).toBe(false);
  });

  it('rejects syntactically valid but incomplete current-schema JSON', () => {
    const incomplete = `{"schemaVersion":${STORE_SCHEMA_VERSION}}\n`;
    writeFileSync(filePath, incomplete);

    expect(() => createStore(filePath).pinnedKey('alice@example.org')).toThrow(
      /no valid store generation/,
    );
    expect(readFileSync(filePath, 'utf8')).toBe(incomplete);
    expect(existsSync(`${filePath}.recovery`)).toBe(false);
  });

  it.each([
    ['empty object', {}],
    ['schema zero', { schemaVersion: 0 }],
    ['sparse known legacy', { schemaVersion: 6, hostedThreads: { root: 7 } }],
  ])('rejects ambiguous legacy data: %s', (_label, value) => {
    writeFileSync(filePath, JSON.stringify(value));
    expect(() => createStore(filePath).pinnedKey('alice@example.org')).toThrow(
      StoreCorruptionError,
    );
  });

  it('strictly migrates a complete versionless pre-v1 store', () => {
    const legacy = {
      midToMsgId: { '<old@example.org>': 7 },
      msgIdToMid: { 7: '<old@example.org>' },
      replyChildren: { '<root@example.org>': [7] },
      boostsByMid: {},
      ownBoosts: {},
      ingestedMsgIds: [7],
      ownMids: ['<old@example.org>'],
      reactions: {},
      notifications: [{
        id: '1',
        type: 'follow',
        createdAt: '2020-01-01T00:00:00.000Z',
        accountAddr: 'alice@example.org',
      }],
      notificationDedupeKeys: ['follow:alice@example.org'],
      nextNotificationId: 2,
      pendingFollowRequests: { 'bob@example.org': 123 },
      pinnedKeys: { 'alice@example.org': 'KEY_A' },
    };
    writeFileSync(filePath, JSON.stringify(legacy));

    const migrated = createStore(filePath);
    expect(migrated.pinnedKey('alice@example.org')).toBe('KEY_A');
    expect(migrated.hasPendingFollowRequest('bob@example.org')).toBe(true);
    expect(migrated.listNotifications({})).toHaveLength(1);
    expect(json(filePath).schemaVersion).toBe(STORE_SCHEMA_VERSION);
    expect(json(filePath).midToMsgId).toEqual({});
  });

  it.each([
    ['negative id', { midToMsgId: { mid: -1 } }],
    ['fractional id', { midToMsgId: { mid: 1.5 } }],
    ['unknown notification type', { notifications: [{ id: '1', type: 'bogus', createdAt: 'x', accountAddr: 'a@b' }] }],
    ['semantically empty held envelope', { heldEnvelopes: { uuid: { env: {}, from: 'p@x', fromContactId: 1, authorAddr: 'a@x', receivedAt: 1 } } }],
  ])('rejects invalid current data: %s', (_label, patch) => {
    const store = createStore(filePath);
    store.pinKey('seed@example.org', 'KEY');
    const raw = json(filePath);
    writeFileSync(filePath, JSON.stringify({ ...raw, ...patch }));
    writeFileSync(`${filePath}.recovery`, JSON.stringify({ ...raw, ...patch }));
    expect(() => createStore(filePath).pinnedKey('seed@example.org')).toThrow(StoreCorruptionError);
  });

  it('fails closed on an unreadable primary instead of treating it as empty', () => {
    writeFileSync(filePath, '{"schemaVersion":9}\n');
    const store = createStore(filePath, {
      fileOperations: {
        read: (path) => {
          if (path === filePath) throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
          return readFileSync(path, 'utf8');
        },
      },
    });

    expect(() => store.pinnedKey('alice@example.org')).toThrow(StoreAccessError);
    expect(readFileSync(filePath, 'utf8')).toBe('{"schemaVersion":9}\n');
    expect(readdirSync(dir).some((name) => name.includes('.corrupt-'))).toBe(false);
  });

  it('fails closed on a recovery I/O error even when the primary is valid', () => {
    const seeded = createStore(filePath);
    seeded.pinKey('alice@example.org', 'KEY_A');
    const primaryBefore = readFileSync(filePath, 'utf8');
    const store = createStore(filePath, {
      fileOperations: {
        read: (path) => {
          if (path === `${filePath}.recovery`) {
            throw Object.assign(new Error('injected recovery I/O error'), { code: 'EIO' });
          }
          return readFileSync(path, 'utf8');
        },
      },
    });

    expect(() => store.pinnedKey('alice@example.org')).toThrow(StoreAccessError);
    expect(readFileSync(filePath, 'utf8')).toBe(primaryBefore);
    expect(readdirSync(dir).some((name) => name.includes('.corrupt-'))).toBe(false);
  });

  it('quarantines a corrupt primary and restores non-derivable state from the valid backup', () => {
    const store = createStore(filePath);
    const heldUuid = '11111111-2222-4333-8444-555555555555';
    const held = {
      dn: 2,
      type: 'post',
      uuid: heldUuid,
      text: 'held body',
    } as Envelope;
    store.pinKey('alice@example.org', 'KEY_A');
    store.addHeldEnvelope(held, 'peer@example.org', 11, 'author@example.org', 100);
    store.addHostedThread('hosted-root', 41);
    store.addThreadSubscription('subscribed-root', 42);
    store.addPendingFollowRequest('pending@example.org', 200);
    store.addPendingThreadRequest('pending-thread', 300);
    store.addNotification({ type: 'follow', accountAddr: 'notifier@example.org' });
    expect(existsSync(`${filePath}.recovery`)).toBe(true);

    writeFileSync(filePath, '{truncated');
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recovered = createStore(filePath);

    expect(recovered.pinnedKey('alice@example.org')).toBe('KEY_A');
    expect(recovered.heldEnvelope(heldUuid)?.authorAddr).toBe('author@example.org');
    expect(recovered.hostedThreadChatId('hosted-root')).toBe(41);
    expect(recovered.threadSubscriptionChatId('subscribed-root')).toBe(42);
    expect(recovered.hasPendingFollowRequest('pending@example.org')).toBe(true);
    expect(recovered.hasPendingThreadRequest('pending-thread')).toBe(true);
    expect(recovered.listNotifications({})).toHaveLength(1);
    expect(diagnostic).toHaveBeenCalledWith(expect.stringMatching(/quarantined.*healed/i));
    expect(readdirSync(dir).some((name) => name.startsWith('store.json.corrupt-'))).toBe(true);
    expect(() => JSON.parse(readFileSync(filePath, 'utf8'))).not.toThrow();
    expect(json(filePath)).toEqual(json(`${filePath}.recovery`));
  });

  it('quarantines and heals a malformed recovery copy when the primary is valid', () => {
    const store = createStore(filePath);
    store.pinKey('alice@example.org', 'KEY_A');
    writeFileSync(`${filePath}.recovery`, '{broken');
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const reloaded = createStore(filePath);
    expect(reloaded.pinnedKey('alice@example.org')).toBe('KEY_A');
    expect(json(`${filePath}.recovery`)).toEqual(json(filePath));
    expect(readdirSync(dir).some((name) => name.startsWith('store.json.recovery.corrupt-'))).toBe(true);
    expect(diagnostic).toHaveBeenCalled();
  });

  it('heals a malformed primary from recovery before committing the next generation', () => {
    const store = createStore(filePath);
    store.pinKey('alice@example.org', 'KEY_A');
    store.addPendingFollowRequest('bob@example.org', 1);
    const malformed = '{"schemaVersion":9,"pinnedKeys":{"alice@example.org":42}}\n';
    writeFileSync(filePath, malformed);

    store.addPendingThreadRequest('thread', 2);
    expect(json(filePath)).toEqual(json(`${filePath}.recovery`));
    expect(createStore(filePath).hasPendingThreadRequest('thread')).toBe(true);
    expect(readdirSync(dir).some((name) => name.startsWith('store.json.corrupt-'))).toBe(true);
  });

  it('leaves the old schema complete when migration rename fails, then migrates and recovers atomically', () => {
    const legacy = {
      schemaVersion: 1,
      midToMsgId: {},
      msgIdToMid: {},
      replyChildren: {},
      boostsByMid: {},
      ownBoosts: {},
      ingestedMsgIds: [],
      ownMids: [],
      reactions: {},
      canonicalByMid: {},
      pinnedKeys: { 'alice@example.org': 'KEY_A' },
      pendingFollowRequests: { 'pending@example.org': 12 },
      notifications: [
        {
          id: '1',
          type: 'follow',
          createdAt: '2020-01-01T00:00:00.000Z',
          accountAddr: 'notifier@example.org',
        },
      ],
      notificationDedupeKeys: [],
      nextNotificationId: 2,
    };
    writeFileSync(filePath, JSON.stringify(legacy));
    const interrupted = createStore(filePath, {
      fileOperations: {
        rename: (from, to) => {
          if (to === filePath) throw Object.assign(new Error('migration interrupted'), { code: 'EIO' });
          renameSync(from, to);
        },
      },
    });

    expect(() => interrupted.pinnedKey('alice@example.org')).toThrow('migration interrupted');
    expect(json(filePath)).toEqual(legacy);
    expect(readdirSync(dir).filter((name) => name.includes('.tmp'))).toEqual([]);

    const migrated = createStore(filePath);
    expect(migrated.pinnedKey('alice@example.org')).toBe('KEY_A');
    expect(migrated.hasPendingFollowRequest('pending@example.org')).toBe(true);
    expect(migrated.listNotifications({})).toHaveLength(1);
    expect(json(filePath).schemaVersion).toBe(STORE_SCHEMA_VERSION);

    writeFileSync(filePath, '{broken-after-migration');
    const recovered = createStore(filePath);
    expect(recovered.pinnedKey('alice@example.org')).toBe('KEY_A');
    expect(recovered.hasPendingFollowRequest('pending@example.org')).toBe(true);
    expect(recovered.listNotifications({})).toHaveLength(1);
    expect(json(filePath).schemaVersion).toBe(STORE_SCHEMA_VERSION);
  });

  it('uses mode 0600 for primary and backup and mode 0700 for a newly-created parent', () => {
    const parent = join(dir, 'private');
    const nestedPath = join(parent, 'store.json');
    createStore(nestedPath).pinKey('alice@example.org', 'KEY_A');

    expect(statSync(nestedPath).mode & 0o777).toBe(0o600);
    expect(statSync(`${nestedPath}.recovery`).mode & 0o777).toBe(0o600);
    expect(statSync(parent).mode & 0o777).toBe(0o700);
  });

  it('removes deterministic abandoned temp files during load', () => {
    writeFileSync(join(dir, '.store.json.tmp-abandoned'), '{partial');
    writeFileSync(join(dir, '.store.json.recovery.tmp-abandoned'), '{partial');

    const store = createStore(filePath);
    expect(store.pinnedKey('nobody@example.org')).toBeNull();
    expect(existsSync(join(dir, '.store.json.tmp-abandoned'))).toBe(false);
    expect(existsSync(join(dir, '.store.json.recovery.tmp-abandoned'))).toBe(false);
  });

  it('returns only a committed complete snapshot and rejects malformed replacement snapshots', () => {
    const store = createStore(filePath);
    store.pinKey('alice@example.org', 'KEY_A');
    writeFileSync(join(dir, '.store.json.tmp-abandoned'), '{partial');

    const snapshot = store.readSnapshot();
    expect(snapshot).not.toBeNull();
    expect(JSON.parse(snapshot!.contents).pinnedKeys).toEqual({ 'alice@example.org': 'KEY_A' });
    expect(snapshot!.generation).toBe(1);
    const primaryBefore = readFileSync(filePath, 'utf8');
    const backupBefore = readFileSync(`${filePath}.recovery`, 'utf8');

    expect(() => store.replaceSnapshot('{malformed')).toThrow(StoreCorruptionError);
    expect(readFileSync(filePath, 'utf8')).toBe(primaryBefore);
    expect(readFileSync(`${filePath}.recovery`, 'utf8')).toBe(backupBefore);
  });

  it('reloads an atomically installed snapshot into the live store', () => {
    const store = createStore(filePath);
    store.pinKey('before@example.org', 'BEFORE');
    const donorPath = join(dir, 'donor.json');
    const donor = createStore(donorPath);
    donor.pinKey('after@example.org', 'AFTER');

    store.replaceSnapshot(donor.readSnapshot()!.contents);
    expect(store.pinnedKey('after@example.org')).toBe('AFTER');
    expect(store.pinnedKey('before@example.org')).toBeNull();
  });

  it('rejects a stale store instance by generation CAS without overwriting newer roots', () => {
    const first = createStore(filePath);
    first.pinKey('first@example.org', 'FIRST');
    const stale = createStore(filePath);
    expect(stale.pinnedKey('first@example.org')).toBe('FIRST');
    first.pinKey('newest@example.org', 'NEWEST');

    expect(() => stale.addPendingFollowRequest('stale@example.org', 1)).toThrow(StoreConflictError);
    const reloaded = createStore(filePath);
    expect(reloaded.pinnedKey('newest@example.org')).toBe('NEWEST');
    expect(reloaded.hasPendingFollowRequest('stale@example.org')).toBe(false);
  });

  it('treats probe EACCES as access failure rather than missing state', () => {
    createStore(filePath).pinKey('a@x', 'A');
    const store = createStore(filePath, {
      fileOperations: {
        probe: (path: string) => {
          if (path === filePath) throw Object.assign(new Error('probe denied'), { code: 'EACCES' });
          try {
            statSync(path);
            return true;
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
            throw error;
          }
        },
      } as any,
    });
    expect(() => store.pinnedKey('a@x')).toThrow(StoreAccessError);
    expect(readdirSync(dir).some((name) => name.includes('.corrupt-'))).toBe(false);
  });

  it('tracks nested external mutations with an idempotent release and barrier revision', () => {
    const store = createStore(filePath) as any;
    const before = store.mutationBarrierSnapshot();
    const releaseOne = store.beginExternalMutation();
    const releaseTwo = store.beginExternalMutation();
    expect(store.mutationBarrierSnapshot().active).toBe(2);
    releaseTwo();
    releaseTwo();
    expect(store.mutationBarrierSnapshot().active).toBe(1);
    releaseOne();
    const after = store.mutationBarrierSnapshot();
    expect(after.active).toBe(0);
    expect(after.revision).toBeGreaterThan(before.revision);
  });

  it('uses unique temp files for separate writes and leaves none behind', () => {
    const openedTemps: string[] = [];
    const store = createStore(filePath, {
      fileOperations: {
        open: (path, flags, mode) => {
          if (path.includes('.tmp-')) openedTemps.push(path);
          return openSync(path, flags as any, mode);
        },
      },
    });
    store.pinKey('one@example.org', 'ONE');
    store.pinKey('two@example.org', 'TWO');

    expect(new Set(openedTemps).size).toBe(openedTemps.length);
    expect(readdirSync(dir).filter((name) => name.includes('.tmp-'))).toEqual([]);
  });

  it('reports a temp close error and retries close for cleanup', () => {
    const fdPaths = new Map<number, string>();
    let injected = false;
    const store = createStore(filePath, {
      fileOperations: {
        open: (path, flags, mode) => {
          const fd = openSync(path, flags as any, mode);
          fdPaths.set(fd, path);
          return fd;
        },
        close: (fd) => {
          const path = fdPaths.get(fd) ?? '';
          if (!injected && path.includes('.recovery.tmp-')) {
            injected = true;
            throw Object.assign(new Error('injected close failure'), { code: 'EIO' });
          }
          closeSync(fd);
          fdPaths.delete(fd);
        },
      },
    });

    expect(() => store.pinKey('a@example.org', 'A')).toThrow('injected close failure');
    expect(readdirSync(dir).filter((name) => name.includes('.tmp-'))).toEqual([]);
  });
});
