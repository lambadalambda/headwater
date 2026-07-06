import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createStore, type Store } from '../src/store.js';
import { buildBoostText, buildReactionText, buildReplyText, buildUnreactionText } from '../src/protocol.js';
import { deriveOnIngest } from '../src/ingest.js';
import { makeMessage } from './entities.test.js';

let dir: string;
let filePath: string;
let store: Store;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'deltanet-ingest-'));
  filePath = join(dir, 'store.json');
  store = createStore(filePath);
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const OWN_MID = 'own-mid@example.org';
const BOB = 'bob@example.org';

const seedOwnMessage = () => {
  store.ingestMessage(makeMessage({ id: 1, fromId: 1, text: 'my original post' }), OWN_MID);
};

describe('deriveOnIngest: mentions (replies)', () => {
  it('creates a mention notification when an incoming reply targets an own mid', () => {
    seedOwnMessage();
    const ref = { mid: OWN_MID, addr: 'self@example.org' };
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref), sender: { address: BOB } as any });
    store.ingestMessage(msg, 'reply-mid@example.org');

    deriveOnIngest(store, msg, 'reply-mid@example.org');

    const notifications = store.listNotifications({});
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'mention', accountAddr: BOB, statusMsgId: 2 });
  });

  it('does not notify when the reply target is not an own mid', () => {
    const ref = { mid: 'someone-elses-mid@example.org', addr: 'other@example.org' };
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref), sender: { address: BOB } as any });
    deriveOnIngest(store, msg, 'reply-mid@example.org');
    expect(store.listNotifications({})).toHaveLength(0);
  });

  it('dedupes a reply seen twice (DM copy + feed copy) to a single notification', () => {
    seedOwnMessage();
    const ref = { mid: OWN_MID, addr: 'self@example.org' };
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref), sender: { address: BOB } as any });

    deriveOnIngest(store, msg, 'reply-mid@example.org');
    deriveOnIngest(store, msg, 'reply-mid@example.org');

    expect(store.listNotifications({})).toHaveLength(1);
  });
});

describe('deriveOnIngest: reblogs (boosts)', () => {
  it('creates a reblog notification when an incoming boost targets an own mid', () => {
    seedOwnMessage();
    const ref = { mid: OWN_MID, addr: 'self@example.org' };
    const msg = makeMessage({ id: 3, fromId: 11, text: buildBoostText(ref), sender: { address: BOB } as any });

    deriveOnIngest(store, msg, 'boost-mid@example.org');

    const notifications = store.listNotifications({});
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'reblog', accountAddr: BOB, statusMsgId: 3 });
  });

  it('does not notify when the boosted mid is not our own', () => {
    const ref = { mid: 'not-ours@example.org', addr: 'other@example.org' };
    const msg = makeMessage({ id: 3, fromId: 11, text: buildBoostText(ref), sender: { address: BOB } as any });
    deriveOnIngest(store, msg, 'boost-mid@example.org');
    expect(store.listNotifications({})).toHaveLength(0);
  });
});

describe('deriveOnIngest: reactions', () => {
  it('applies a heart reaction and notifies favourite when the mid is our own', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 11, text: buildReactionText('❤', OWN_MID), sender: { address: BOB } as any });

    deriveOnIngest(store, msg, 'react-mid@example.org');

    expect(store.reactionTallies(OWN_MID)).toEqual([{ emoji: '❤', count: 1, reactors: [BOB] }]);
    const notifications = store.listNotifications({});
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'favourite', accountAddr: BOB, statusMsgId: 1 });
  });

  it('applies a non-heart reaction and notifies pleroma:emoji_reaction with the emoji field', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 11, text: buildReactionText('🎉', OWN_MID), sender: { address: BOB } as any });

    deriveOnIngest(store, msg, 'react-mid@example.org');

    expect(store.reactionTallies(OWN_MID)).toEqual([{ emoji: '🎉', count: 1, reactors: [BOB] }]);
    const notifications = store.listNotifications({});
    expect(notifications[0]).toMatchObject({
      type: 'pleroma:emoji_reaction',
      accountAddr: BOB,
      emoji: '🎉',
      statusMsgId: 1,
    });
  });

  it('applies a reaction to a mid we do not own without notifying', () => {
    const msg = makeMessage({
      id: 4,
      fromId: 11,
      text: buildReactionText('❤', 'not-ours@example.org'),
      sender: { address: BOB } as any,
    });
    deriveOnIngest(store, msg, 'react-mid@example.org');
    expect(store.reactionTallies('not-ours@example.org')).toEqual([{ emoji: '❤', count: 1, reactors: [BOB] }]);
    expect(store.listNotifications({})).toHaveLength(0);
  });

  it('retracts a reaction without notifying', () => {
    seedOwnMessage();
    store.applyReaction(OWN_MID, BOB, '❤');
    const msg = makeMessage({
      id: 5,
      fromId: 11,
      text: buildUnreactionText('❤', OWN_MID),
      sender: { address: BOB } as any,
    });
    deriveOnIngest(store, msg, 'unreact-mid@example.org');
    expect(store.reactionTallies(OWN_MID)).toEqual([]);
    expect(store.listNotifications({})).toHaveLength(0);
  });

  it('does not double-notify the same reactor+emoji seen twice', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 11, text: buildReactionText('❤', OWN_MID), sender: { address: BOB } as any });
    deriveOnIngest(store, msg, 'react-mid@example.org');
    deriveOnIngest(store, msg, 'react-mid@example.org');
    expect(store.listNotifications({})).toHaveLength(1);
  });
});

describe('deriveOnIngest: SELF messages never notify', () => {
  it('ignores a reply-shaped message authored by SELF', () => {
    seedOwnMessage();
    const ref = { mid: OWN_MID, addr: 'self@example.org' };
    const msg = makeMessage({ id: 2, fromId: 1, text: buildReplyText('nice!', ref) });
    deriveOnIngest(store, msg, 'self-reply-mid@example.org');
    expect(store.listNotifications({})).toHaveLength(0);
  });

  it('ignores a reaction-shaped message authored by SELF (does not apply or notify)', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 1, text: buildReactionText('❤', OWN_MID) });
    deriveOnIngest(store, msg, 'self-react-mid@example.org');
    expect(store.reactionTallies(OWN_MID)).toEqual([]);
    expect(store.listNotifications({})).toHaveLength(0);
  });
});
