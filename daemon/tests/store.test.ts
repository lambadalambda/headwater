import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { T } from '@deltachat/jsonrpc-client';
import { createStore } from '../src/store.js';
import { buildBoostText, buildReplyText } from '../src/protocol.js';
import { makeMessage } from './entities.test.js';

let dir: string;
let filePath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'deltanet-store-'));
  filePath = join(dir, 'store.json');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('createStore: mid <-> msgId index', () => {
  it('records a plain message with no markers', () => {
    const store = createStore(filePath);
    const msg = makeMessage({ id: 10, text: 'hello' });
    store.ingestMessage(msg, 'mid-10@example.org');

    expect(store.resolveMid('mid-10@example.org')).toBe(10);
    expect(store.midForMsgId(10)).toBe('mid-10@example.org');
  });

  it('returns null for an unknown mid', () => {
    const store = createStore(filePath);
    expect(store.resolveMid('nope@example.org')).toBeNull();
  });

  it('returns null for an unknown msgId', () => {
    const store = createStore(filePath);
    expect(store.midForMsgId(999)).toBeNull();
  });
});

describe('createStore: reply edges', () => {
  it('records a reply child under the parent mid', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    const replyMsg = makeMessage({ id: 20, text: buildReplyText('a reply', parentRef) });
    store.ingestMessage(replyMsg, 'child-mid@example.org');

    expect(store.replyChildren(parentRef.mid)).toEqual([20]);
    expect(store.childrenCount(parentRef.mid)).toBe(1);
  });

  it('accumulates multiple children in order ingested', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    store.ingestMessage(makeMessage({ id: 21, text: buildReplyText('r1', parentRef) }), 'c1@example.org');
    store.ingestMessage(makeMessage({ id: 22, text: buildReplyText('r2', parentRef) }), 'c2@example.org');

    expect(store.replyChildren(parentRef.mid)).toEqual([21, 22]);
  });

  it('returns an empty array for a mid with no children', () => {
    const store = createStore(filePath);
    expect(store.replyChildren('nothing@example.org')).toEqual([]);
    expect(store.childrenCount('nothing@example.org')).toBe(0);
  });

  it('does not record a reply edge for a plain, non-reply message', () => {
    const store = createStore(filePath);
    store.ingestMessage(makeMessage({ id: 30, text: 'just a post' }), 'mid-30@example.org');
    expect(store.replyChildren('mid-30@example.org')).toEqual([]);
  });
});

describe('createStore: boost edges', () => {
  it('records a booster msgId under the boosted mid', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    const boostMsg = makeMessage({ id: 40, text: buildBoostText(ref) });
    store.ingestMessage(boostMsg, 'boost-mid@example.org');

    expect(store.boostsByMid(ref.mid)).toEqual([40]);
    expect(store.boostCount(ref.mid)).toBe(1);
  });

  it('reports isOwnBoost for a boost message sent from our own account (fromId 1)', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    const boostMsg = makeMessage({ id: 41, text: buildBoostText(ref), fromId: 1 });
    store.ingestMessage(boostMsg, 'boost-mid-2@example.org');

    expect(store.isOwnBoost(ref.mid)).toBe(true);
  });

  it('reports isOwnBoost false when no boost from self is known', () => {
    const store = createStore(filePath);
    expect(store.isOwnBoost('orig-mid@example.org')).toBe(false);
  });

  it('finds our own boost msgId for a given mid (for unreblog)', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    store.ingestMessage(makeMessage({ id: 42, text: buildBoostText(ref), fromId: 1 }), 'b@example.org');
    expect(store.ownBoostMsgId(ref.mid)).toBe(42);
  });

  it('ownBoostMsgId is null when we have not boosted', () => {
    const store = createStore(filePath);
    expect(store.ownBoostMsgId('orig-mid@example.org')).toBeNull();
  });
});

describe('createStore: idempotent ingest', () => {
  it('ingesting the same msgId twice does not duplicate reply/boost edges', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    const replyMsg = makeMessage({ id: 50, text: buildReplyText('a reply', parentRef) });
    store.ingestMessage(replyMsg, 'child-mid@example.org');
    store.ingestMessage(replyMsg, 'child-mid@example.org');

    expect(store.replyChildren(parentRef.mid)).toEqual([50]);
  });

  it('ingesting the same boost msgId twice does not duplicate boost edges', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    const boostMsg = makeMessage({ id: 60, text: buildBoostText(ref) });
    store.ingestMessage(boostMsg, 'boost-mid@example.org');
    store.ingestMessage(boostMsg, 'boost-mid@example.org');

    expect(store.boostsByMid(ref.mid)).toEqual([60]);
  });
});

describe('createStore: persistence', () => {
  it('persists ingested state to the json file and reloads it in a new store instance', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    store.ingestMessage(makeMessage({ id: 70, text: buildReplyText('hi', parentRef) }), 'child-mid@example.org');

    const raw = readFileSync(filePath, 'utf8');
    expect(JSON.parse(raw)).toBeTruthy();

    const reloaded = createStore(filePath);
    expect(reloaded.resolveMid('child-mid@example.org')).toBe(70);
    expect(reloaded.replyChildren(parentRef.mid)).toEqual([70]);
  });

  it('lazily loads: creating a store for a nonexistent file does not throw and starts empty', () => {
    const store = createStore(join(dir, 'does-not-exist-yet.json'));
    expect(store.resolveMid('anything@example.org')).toBeNull();
  });
});

describe('createStore: resolver shape used by entities mapping', () => {
  it('exposes resolveMid, childrenCount, boostCount, isOwnBoost together', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    store.ingestMessage(makeMessage({ id: 80, text: buildReplyText('hi', parentRef) }), 'child-mid@example.org');

    expect(store.resolveMid('child-mid@example.org')).toBe(80);
    expect(store.childrenCount(parentRef.mid)).toBe(1);
    expect(store.childrenCount('child-mid@example.org')).toBe(0);
    expect(store.boostCount('child-mid@example.org')).toBe(0);
    expect(store.isOwnBoost('child-mid@example.org')).toBe(false);
  });
});
