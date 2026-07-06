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
  it('records a reply child under the parent mid (feed message, default)', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    const replyMsg = makeMessage({ id: 20, text: buildReplyText('a reply', parentRef) });
    store.ingestMessage(replyMsg, 'child-mid@example.org', true);

    expect(store.replyChildren(parentRef.mid)).toEqual([20]);
    expect(store.childrenCount(parentRef.mid)).toBe(1);
  });

  it('accumulates multiple children in order ingested', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    store.ingestMessage(makeMessage({ id: 21, text: buildReplyText('r1', parentRef) }), 'c1@example.org', true);
    store.ingestMessage(makeMessage({ id: 22, text: buildReplyText('r2', parentRef) }), 'c2@example.org', true);

    expect(store.replyChildren(parentRef.mid)).toEqual([21, 22]);
  });

  it('returns an empty array for a mid with no children', () => {
    const store = createStore(filePath);
    expect(store.replyChildren('nothing@example.org')).toEqual([]);
    expect(store.childrenCount('nothing@example.org')).toBe(0);
  });

  it('does not record a reply edge for a plain, non-reply message', () => {
    const store = createStore(filePath);
    store.ingestMessage(makeMessage({ id: 30, text: 'just a post' }), 'mid-30@example.org', true);
    expect(store.replyChildren('mid-30@example.org')).toEqual([]);
  });

  it('does not record a reply edge when isFeedMessage is false (DM reply-notify copy)', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    const replyMsg = makeMessage({ id: 23, text: buildReplyText('a DM copy of a reply', parentRef) });
    store.ingestMessage(replyMsg, 'dm-child-mid@example.org', false);

    expect(store.replyChildren(parentRef.mid)).toEqual([]);
    expect(store.childrenCount(parentRef.mid)).toBe(0);
    // But the mid <-> msgId mapping is still recorded for all messages.
    expect(store.resolveMid('dm-child-mid@example.org')).toBe(23);
  });

  it('defaults isFeedMessage to true when the third argument is omitted (backward compatible)', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    const replyMsg = makeMessage({ id: 24, text: buildReplyText('a reply', parentRef) });
    store.ingestMessage(replyMsg, 'default-child-mid@example.org');

    expect(store.replyChildren(parentRef.mid)).toEqual([24]);
  });

  it('a feed reply and its DM copy together register only one child (the fix for the double-count bug)', () => {
    const store = createStore(filePath);
    const parentRef = { mid: 'parent-mid@example.org', addr: 'author@example.org' };
    const replyText = buildReplyText('a reply', parentRef);
    // Same logical reply, delivered twice: once via feed broadcast, once as a DM copy — different rfc724Mids.
    store.ingestMessage(makeMessage({ id: 29, text: replyText }), 'feed-copy-mid@example.org', true);
    store.ingestMessage(makeMessage({ id: 30, text: replyText }), 'dm-copy-mid@example.org', false);

    expect(store.replyChildren(parentRef.mid)).toEqual([29]);
    expect(store.childrenCount(parentRef.mid)).toBe(1);
  });
});

describe('createStore: boost edges', () => {
  it('records a booster msgId under the boosted mid', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    const boostMsg = makeMessage({ id: 40, text: buildBoostText(ref) });
    store.ingestMessage(boostMsg, 'boost-mid@example.org', true);

    expect(store.boostsByMid(ref.mid)).toEqual([40]);
    expect(store.boostCount(ref.mid)).toBe(1);
  });

  it('reports isOwnBoost for a boost message sent from our own account (fromId 1)', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    const boostMsg = makeMessage({ id: 41, text: buildBoostText(ref), fromId: 1 });
    store.ingestMessage(boostMsg, 'boost-mid-2@example.org', true);

    expect(store.isOwnBoost(ref.mid)).toBe(true);
  });

  it('reports isOwnBoost false when no boost from self is known', () => {
    const store = createStore(filePath);
    expect(store.isOwnBoost('orig-mid@example.org')).toBe(false);
  });

  it('finds our own boost msgId for a given mid (for unreblog)', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    store.ingestMessage(makeMessage({ id: 42, text: buildBoostText(ref), fromId: 1 }), 'b@example.org', true);
    expect(store.ownBoostMsgId(ref.mid)).toBe(42);
  });

  it('ownBoostMsgId is null when we have not boosted', () => {
    const store = createStore(filePath);
    expect(store.ownBoostMsgId('orig-mid@example.org')).toBeNull();
  });

  it('does not record a boost edge when isFeedMessage is false (DM boost-notify copy)', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    const boostMsg = makeMessage({ id: 43, text: buildBoostText(ref) });
    store.ingestMessage(boostMsg, 'dm-boost-mid@example.org', false);

    expect(store.boostsByMid(ref.mid)).toEqual([]);
    expect(store.boostCount(ref.mid)).toBe(0);
  });

  it('does not record ownBoosts when isFeedMessage is false, even from self', () => {
    const store = createStore(filePath);
    const ref = { mid: 'orig-mid@example.org', addr: 'author@example.org' };
    const boostMsg = makeMessage({ id: 44, text: buildBoostText(ref), fromId: 1 });
    store.ingestMessage(boostMsg, 'dm-own-boost-mid@example.org', false);

    expect(store.isOwnBoost(ref.mid)).toBe(false);
    expect(store.ownBoostMsgId(ref.mid)).toBeNull();
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

  it('reports freshness: true on first ingest of a msgId, false on re-ingest', () => {
    const store = createStore(filePath);
    const msg = makeMessage({ id: 61, text: 'hello' });
    // One live DM can be delivered via both IncomingMsg and MsgsChanged (and
    // repeat MsgsChanged on state changes); callers gate execute-once side
    // effects (follow-back grant/accept) on this return value.
    expect(store.ingestMessage(msg, 'fresh-mid@example.org')).toBe(true);
    expect(store.ingestMessage(msg, 'fresh-mid@example.org')).toBe(false);
    expect(store.ingestMessage(msg, 'fresh-mid@example.org')).toBe(false);
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

describe('createStore: ownMids', () => {
  it('records a mid as own when ingested with sender = SELF (contact id 1)', () => {
    const store = createStore(filePath);
    store.ingestMessage(makeMessage({ id: 90, fromId: 1, text: 'mine' }), 'own-mid@example.org');
    expect(store.isOwnMid('own-mid@example.org')).toBe(true);
  });

  it('does not record a mid as own when ingested from another contact', () => {
    const store = createStore(filePath);
    store.ingestMessage(makeMessage({ id: 91, fromId: 11, text: 'not mine' }), 'their-mid@example.org');
    expect(store.isOwnMid('their-mid@example.org')).toBe(false);
  });

  it('reports false for an unknown mid', () => {
    const store = createStore(filePath);
    expect(store.isOwnMid('nope@example.org')).toBe(false);
  });
});

describe('createStore: reactions', () => {
  it('applies a reaction and tallies it', () => {
    const store = createStore(filePath);
    store.applyReaction('mid-1@example.org', 'bob@example.org', '❤');
    expect(store.reactionTallies('mid-1@example.org')).toEqual([
      { emoji: '❤', count: 1, reactors: ['bob@example.org'] },
    ]);
  });

  it('groups multiple reactors under the same emoji', () => {
    const store = createStore(filePath);
    store.applyReaction('mid-1@example.org', 'bob@example.org', '❤');
    store.applyReaction('mid-1@example.org', 'carol@example.org', '❤');
    expect(store.reactionTallies('mid-1@example.org')).toEqual([
      { emoji: '❤', count: 2, reactors: ['bob@example.org', 'carol@example.org'] },
    ]);
  });

  it('supports multiple distinct emoji per reactor per mid', () => {
    const store = createStore(filePath);
    store.applyReaction('mid-1@example.org', 'bob@example.org', '❤');
    store.applyReaction('mid-1@example.org', 'bob@example.org', '🎉');
    const tallies = store.reactionTallies('mid-1@example.org');
    expect(tallies).toHaveLength(2);
    expect(tallies.find((t) => t.emoji === '❤')).toEqual({ emoji: '❤', count: 1, reactors: ['bob@example.org'] });
    expect(tallies.find((t) => t.emoji === '🎉')).toEqual({ emoji: '🎉', count: 1, reactors: ['bob@example.org'] });
  });

  it('applying the same reactor+emoji twice does not double count', () => {
    const store = createStore(filePath);
    store.applyReaction('mid-1@example.org', 'bob@example.org', '❤');
    store.applyReaction('mid-1@example.org', 'bob@example.org', '❤');
    expect(store.reactionTallies('mid-1@example.org')).toEqual([
      { emoji: '❤', count: 1, reactors: ['bob@example.org'] },
    ]);
  });

  it('retracts a reaction', () => {
    const store = createStore(filePath);
    store.applyReaction('mid-1@example.org', 'bob@example.org', '❤');
    store.retractReaction('mid-1@example.org', 'bob@example.org', '❤');
    expect(store.reactionTallies('mid-1@example.org')).toEqual([]);
  });

  it('retracting one emoji leaves other reactions from the same reactor intact', () => {
    const store = createStore(filePath);
    store.applyReaction('mid-1@example.org', 'bob@example.org', '❤');
    store.applyReaction('mid-1@example.org', 'bob@example.org', '🎉');
    store.retractReaction('mid-1@example.org', 'bob@example.org', '❤');
    expect(store.reactionTallies('mid-1@example.org')).toEqual([
      { emoji: '🎉', count: 1, reactors: ['bob@example.org'] },
    ]);
  });

  it('retracting a reaction that was never applied is a no-op', () => {
    const store = createStore(filePath);
    store.retractReaction('mid-1@example.org', 'bob@example.org', '❤');
    expect(store.reactionTallies('mid-1@example.org')).toEqual([]);
  });

  it('returns an empty array for a mid with no reactions', () => {
    const store = createStore(filePath);
    expect(store.reactionTallies('nothing@example.org')).toEqual([]);
  });
});

describe('createStore: notifications', () => {
  it('appends a notification with a monotonic string id', () => {
    const store = createStore(filePath);
    const n1 = store.addNotification({ type: 'follow', accountAddr: 'bob@example.org' });
    const n2 = store.addNotification({ type: 'follow', accountAddr: 'carol@example.org' });
    expect(Number(n2!.id)).toBeGreaterThan(Number(n1!.id));
  });

  it('lists notifications newest first', () => {
    const store = createStore(filePath);
    store.addNotification({ type: 'follow', accountAddr: 'bob@example.org' });
    store.addNotification({ type: 'follow', accountAddr: 'carol@example.org' });
    const list = store.listNotifications({});
    expect(list.map((n) => n.accountAddr)).toEqual(['carol@example.org', 'bob@example.org']);
  });

  it('dedupes on type:addr:mid[:emoji]', () => {
    const store = createStore(filePath);
    store.addNotification({
      type: 'mention',
      accountAddr: 'bob@example.org',
      statusMsgId: 5,
      dedupeMid: 'reply-mid@example.org',
    });
    const second = store.addNotification({
      type: 'mention',
      accountAddr: 'bob@example.org',
      statusMsgId: 5,
      dedupeMid: 'reply-mid@example.org',
    });
    expect(second).toBeNull();
    expect(store.listNotifications({})).toHaveLength(1);
  });

  it('does not dedupe distinct emoji reactions from the same reactor on the same mid', () => {
    const store = createStore(filePath);
    store.addNotification({
      type: 'pleroma:emoji_reaction',
      accountAddr: 'bob@example.org',
      dedupeMid: 'mid-1@example.org',
      emoji: '❤',
    });
    store.addNotification({
      type: 'pleroma:emoji_reaction',
      accountAddr: 'bob@example.org',
      dedupeMid: 'mid-1@example.org',
      emoji: '🎉',
    });
    expect(store.listNotifications({})).toHaveLength(2);
  });

  it('a favourite notification omits the emoji field but still dedupes per dedupeEmoji', () => {
    const store = createStore(filePath);
    const n = store.addNotification({
      type: 'favourite',
      accountAddr: 'bob@example.org',
      dedupeMid: 'mid-1@example.org',
      dedupeEmoji: '❤',
    });
    expect(n).not.toHaveProperty('emoji');

    // A distinct emoji reaction from the same reactor on the same mid is not deduped away.
    const other = store.addNotification({
      type: 'pleroma:emoji_reaction',
      accountAddr: 'bob@example.org',
      emoji: '🎉',
      dedupeMid: 'mid-1@example.org',
      dedupeEmoji: '🎉',
    });
    expect(other).not.toBeNull();
    expect(store.listNotifications({})).toHaveLength(2);

    // Re-adding the same favourite is deduped.
    const dupe = store.addNotification({
      type: 'favourite',
      accountAddr: 'bob@example.org',
      dedupeMid: 'mid-1@example.org',
      dedupeEmoji: '❤',
    });
    expect(dupe).toBeNull();
  });

  it('paginates with limit', () => {
    const store = createStore(filePath);
    for (let i = 0; i < 5; i++) {
      store.addNotification({ type: 'follow', accountAddr: `user${i}@example.org` });
    }
    expect(store.listNotifications({ limit: 2 })).toHaveLength(2);
  });

  it('paginates with max_id (strictly older than)', () => {
    const store = createStore(filePath);
    const ids = [0, 1, 2].map(
      (i) => store.addNotification({ type: 'follow', accountAddr: `user${i}@example.org` })!.id,
    );
    const page = store.listNotifications({ maxId: ids[2] });
    expect(page.map((n) => n.id)).toEqual([ids[1], ids[0]]);
  });

  it('paginates with since_id (strictly newer than)', () => {
    const store = createStore(filePath);
    const ids = [0, 1, 2].map(
      (i) => store.addNotification({ type: 'follow', accountAddr: `user${i}@example.org` })!.id,
    );
    const page = store.listNotifications({ sinceId: ids[0] });
    expect(page.map((n) => n.id)).toEqual([ids[2], ids[1]]);
  });

  it('persists notifications across store reloads', () => {
    const store = createStore(filePath);
    store.addNotification({ type: 'follow', accountAddr: 'bob@example.org' });
    const reloaded = createStore(filePath);
    expect(reloaded.listNotifications({})).toHaveLength(1);
  });
});

describe('createStore: pending follow requests', () => {
  const ALICE = 'alice@example.org';
  const BOB = 'bob@example.org';

  it('records a pending follow request with its requested-at timestamp', () => {
    const store = createStore(filePath);
    expect(store.hasPendingFollowRequest(ALICE)).toBe(false);
    store.addPendingFollowRequest(ALICE, 1000);
    expect(store.hasPendingFollowRequest(ALICE)).toBe(true);
    expect(store.pendingFollowRequests()).toEqual({ [ALICE]: 1000 });
  });

  it('clears a pending follow request', () => {
    const store = createStore(filePath);
    store.addPendingFollowRequest(ALICE, 1000);
    store.clearPendingFollowRequest(ALICE);
    expect(store.hasPendingFollowRequest(ALICE)).toBe(false);
    expect(store.pendingFollowRequests()).toEqual({});
  });

  it('clearing an unknown addr is a harmless no-op', () => {
    const store = createStore(filePath);
    expect(() => store.clearPendingFollowRequest(BOB)).not.toThrow();
    expect(store.hasPendingFollowRequest(BOB)).toBe(false);
  });

  it('tracks pending requests to several contacts independently', () => {
    const store = createStore(filePath);
    store.addPendingFollowRequest(ALICE, 1000);
    store.addPendingFollowRequest(BOB, 2000);
    store.clearPendingFollowRequest(ALICE);
    expect(store.hasPendingFollowRequest(ALICE)).toBe(false);
    expect(store.hasPendingFollowRequest(BOB)).toBe(true);
    expect(store.pendingFollowRequests()).toEqual({ [BOB]: 2000 });
  });

  it('persists pending follow requests across store reloads', () => {
    const store = createStore(filePath);
    store.addPendingFollowRequest(ALICE, 1234);
    const reloaded = createStore(filePath);
    expect(reloaded.hasPendingFollowRequest(ALICE)).toBe(true);
    expect(reloaded.pendingFollowRequests()).toEqual({ [ALICE]: 1234 });
  });
});
