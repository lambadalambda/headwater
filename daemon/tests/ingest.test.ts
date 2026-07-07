import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createStore, type Store } from '../src/store.js';
import {
  buildBoostText,
  buildReactionText,
  buildReplyText,
  buildUnreactionText,
  mintPostUuid,
  refFromToken,
  type RefToken,
} from '../src/protocol.js';
import { deriveOnIngest } from '../src/ingest.js';
import { buildPostEnvelope } from '../src/envelope.js';
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

/** A mid-targeting ref token (these tests target legacy mid-keyed posts). */
const midTok = (mid: string): RefToken => ({ kind: 'mid', mid });

const seedOwnMessage = () => {
  store.ingestMessage(makeMessage({ id: 1, fromId: 1, text: 'my original post' }), OWN_MID);
};

describe('deriveOnIngest: mentions (replies)', () => {
  it('creates a mention notification when an incoming reply targets an own mid', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, 'self@example.org');
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref, mintPostUuid()), sender: { address: BOB } as any });
    store.ingestMessage(msg, 'reply-mid@example.org');

    deriveOnIngest(store, msg, 'reply-mid@example.org');

    const notifications = store.listNotifications({});
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'mention', accountAddr: BOB, statusMsgId: 2 });
  });

  it('does not notify when the reply target is not an own mid', () => {
    const ref = refFromToken({ kind: 'mid', mid: 'someone-elses-mid@example.org' }, 'other@example.org');
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref, mintPostUuid()), sender: { address: BOB } as any });
    deriveOnIngest(store, msg, 'reply-mid@example.org');
    expect(store.listNotifications({})).toHaveLength(0);
  });

  it('dedupes a reply seen twice (DM copy + feed copy) to a single notification', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, 'self@example.org');
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref, mintPostUuid()), sender: { address: BOB } as any });

    deriveOnIngest(store, msg, 'reply-mid@example.org');
    deriveOnIngest(store, msg, 'reply-mid@example.org');

    expect(store.listNotifications({})).toHaveLength(1);
  });
});

describe('deriveOnIngest: reblogs (boosts)', () => {
  it('creates a reblog notification when an incoming boost targets an own mid', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, 'self@example.org');
    const msg = makeMessage({ id: 3, fromId: 11, text: buildBoostText(ref, mintPostUuid()), sender: { address: BOB } as any });

    deriveOnIngest(store, msg, 'boost-mid@example.org');

    const notifications = store.listNotifications({});
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'reblog', accountAddr: BOB, statusMsgId: 3 });
  });

  it('does not notify when the boosted mid is not our own', () => {
    const ref = refFromToken({ kind: 'mid', mid: 'not-ours@example.org' }, 'other@example.org');
    const msg = makeMessage({ id: 3, fromId: 11, text: buildBoostText(ref, mintPostUuid()), sender: { address: BOB } as any });
    deriveOnIngest(store, msg, 'boost-mid@example.org');
    expect(store.listNotifications({})).toHaveLength(0);
  });
});

describe('deriveOnIngest: reactions', () => {
  it('applies a heart reaction and notifies favourite when the mid is our own', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 11, text: buildReactionText('❤', midTok(OWN_MID)), sender: { address: BOB } as any });

    deriveOnIngest(store, msg, 'react-mid@example.org');

    expect(store.reactionTallies(OWN_MID)).toEqual([{ emoji: '❤', count: 1, reactors: [BOB] }]);
    const notifications = store.listNotifications({});
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'favourite', accountAddr: BOB, statusMsgId: 1 });
  });

  it('applies a non-heart reaction and notifies pleroma:emoji_reaction with the emoji field', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 11, text: buildReactionText('🎉', midTok(OWN_MID)), sender: { address: BOB } as any });

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
      text: buildReactionText('❤', midTok('not-ours@example.org')),
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
      text: buildUnreactionText('❤', midTok(OWN_MID)),
      sender: { address: BOB } as any,
    });
    deriveOnIngest(store, msg, 'unreact-mid@example.org');
    expect(store.reactionTallies(OWN_MID)).toEqual([]);
    expect(store.listNotifications({})).toHaveLength(0);
  });

  it('does not double-notify the same reactor+emoji seen twice', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 11, text: buildReactionText('❤', midTok(OWN_MID)), sender: { address: BOB } as any });
    deriveOnIngest(store, msg, 'react-mid@example.org');
    deriveOnIngest(store, msg, 'react-mid@example.org');
    expect(store.listNotifications({})).toHaveLength(1);
  });
});

describe('backfill order-independence (two-pass ingest/derive)', () => {
  /**
   * Regression test for the live notification-loss bug: `backfill()` used to
   * call `store.ingestMessage` + `deriveOnIngest` inline, per message, in
   * chatlist sweep order. `getChatlistEntries` orders by recency, not
   * dependency, so a DM chat holding a reaction control message can be swept
   * *before* the chat holding the own post it reacts to — at which point
   * `store.isOwnMid` isn't populated yet for that mid, and
   * `deriveOnIngest` silently skips the favourite notification (the reaction
   * tally itself still applies via `ingestMessage`, since that isn't gated
   * on `isOwnMid`).
   *
   * The fix (mirrors `main.ts`'s `ingestOnMessage` + `deltachat.ts`'s
   * `backfill()`): run an `'index'` pass — `store.ingestMessage` only — over
   * every backfilled message first, then a `'derive'` pass — `deriveOnIngest`
   * only — over all of them again. This proves that even when the reaction
   * DM is *collected and indexed* before the own post, deriving only after
   * every message has been indexed still yields the favourite notification.
   */
  it('derives a favourite notification for a reaction seen before its target post, when indexed as a full backfill pass first', () => {
    const reactionMid = 'react-mid@example.org';
    const reactionMsg = makeMessage({
      id: 10,
      fromId: 11,
      text: buildReactionText('❤', midTok(OWN_MID)),
      sender: { address: BOB } as any,
    });
    const ownMsg = makeMessage({ id: 1, fromId: 1, text: 'my original post' });

    // Simulate backfill's collection order: the reaction DM's chat was swept
    // before the own-feed chat, so the reaction message is indexed first.
    const backfillOrder = [
      { msg: reactionMsg, mid: reactionMid },
      { msg: ownMsg, mid: OWN_MID },
    ];

    // Pass 1 ('index'): store.ingestMessage only, in sweep order — no
    // derivation yet, so ordering here can't affect notification derivation.
    for (const { msg, mid } of backfillOrder) {
      store.ingestMessage(msg, mid);
    }

    // By now every backfilled message is indexed, regardless of sweep order:
    // ownMids already contains OWN_MID even though the own post was indexed
    // *after* the reaction that targets it.
    expect(store.isOwnMid(OWN_MID)).toBe(true);

    // Pass 2 ('derive'): deriveOnIngest only, same order.
    for (const { msg, mid } of backfillOrder) {
      deriveOnIngest(store, msg, mid);
    }

    expect(store.reactionTallies(OWN_MID)).toEqual([{ emoji: '❤', count: 1, reactors: [BOB] }]);
    const notifications = store.listNotifications({});
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'favourite', accountAddr: BOB, statusMsgId: 1 });
  });

  it('contrast: deriving inline (single combined pass, old behavior) loses the notification in the same order', () => {
    const reactionMid = 'react-mid@example.org';
    const reactionMsg = makeMessage({
      id: 10,
      fromId: 11,
      text: buildReactionText('❤', midTok(OWN_MID)),
      sender: { address: BOB } as any,
    });
    const ownMsg = makeMessage({ id: 1, fromId: 1, text: 'my original post' });

    // Old (pre-fix) behavior: ingest+derive inline, per message, in sweep order.
    store.ingestMessage(reactionMsg, reactionMid);
    deriveOnIngest(store, reactionMsg, reactionMid); // isOwnMid(OWN_MID) is still false here
    store.ingestMessage(ownMsg, OWN_MID);
    deriveOnIngest(store, ownMsg, OWN_MID);

    // The tally still applies (not gated on isOwnMid)...
    expect(store.reactionTallies(OWN_MID)).toEqual([{ emoji: '❤', count: 1, reactors: [BOB] }]);
    // ...but the favourite notification was silently never derived.
    expect(store.listNotifications({})).toHaveLength(0);
  });
});

describe('deriveOnIngest: return value (newly created notifications)', () => {
  it('returns the created notification for a fresh mention', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, 'self@example.org');
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref, mintPostUuid()), sender: { address: BOB } as any });

    const created = deriveOnIngest(store, msg, 'reply-mid@example.org');

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ type: 'mention', accountAddr: BOB, statusMsgId: 2 });
  });

  it('returns an empty array when nothing was derived (no reply/boost/reaction markers)', () => {
    const msg = makeMessage({ id: 2, fromId: 11, text: 'just a plain post', sender: { address: BOB } as any });
    expect(deriveOnIngest(store, msg, 'plain-mid@example.org')).toEqual([]);
  });

  it('returns an empty array when the target mid is not our own', () => {
    const ref = refFromToken({ kind: 'mid', mid: 'not-ours@example.org' }, 'other@example.org');
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref, mintPostUuid()), sender: { address: BOB } as any });
    expect(deriveOnIngest(store, msg, 'reply-mid@example.org')).toEqual([]);
  });

  it('returns an empty array on a dedupe no-op (same reply seen twice)', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, 'self@example.org');
    const msg = makeMessage({ id: 2, fromId: 11, text: buildReplyText('nice!', ref, mintPostUuid()), sender: { address: BOB } as any });

    expect(deriveOnIngest(store, msg, 'reply-mid@example.org')).toHaveLength(1);
    expect(deriveOnIngest(store, msg, 'reply-mid@example.org')).toEqual([]);
  });

  it('returns an empty array for SELF-authored messages', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, 'self@example.org');
    const msg = makeMessage({ id: 2, fromId: 1, text: buildReplyText('nice!', ref, mintPostUuid()) });
    expect(deriveOnIngest(store, msg, 'self-reply-mid@example.org')).toEqual([]);
  });

  it('returns an empty array for a reaction retraction (never notifies)', () => {
    seedOwnMessage();
    store.applyReaction(OWN_MID, BOB, '❤');
    const msg = makeMessage({ id: 5, fromId: 11, text: buildUnreactionText('❤', midTok(OWN_MID)), sender: { address: BOB } as any });
    expect(deriveOnIngest(store, msg, 'unreact-mid@example.org')).toEqual([]);
  });

  it('returns the created favourite notification for a heart reaction', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 11, text: buildReactionText('❤', midTok(OWN_MID)), sender: { address: BOB } as any });
    const created = deriveOnIngest(store, msg, 'react-mid@example.org');
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ type: 'favourite', accountAddr: BOB, statusMsgId: 1 });
  });
});

describe('deriveOnIngest: SELF messages never notify', () => {
  it('ignores a reply-shaped message authored by SELF', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, 'self@example.org');
    const msg = makeMessage({ id: 2, fromId: 1, text: buildReplyText('nice!', ref, mintPostUuid()) });
    deriveOnIngest(store, msg, 'self-reply-mid@example.org');
    expect(store.listNotifications({})).toHaveLength(0);
  });

  it('ignores a reaction-shaped message authored by SELF when no own address is provided', () => {
    seedOwnMessage();
    const msg = makeMessage({ id: 4, fromId: 1, text: buildReactionText('❤', midTok(OWN_MID)) });
    // No ownAddr passed: SELF re-derivation is skipped (nothing applies).
    deriveOnIngest(store, msg, 'self-react-mid@example.org');
    expect(store.reactionTallies(OWN_MID)).toEqual([]);
    expect(store.listNotifications({})).toHaveLength(0);
  });
});

describe('deriveOnIngest: SELF reaction re-derivation (own reactions on re-index)', () => {
  const SELF = 'me@example.org';
  const TARGET = 'bobs-post@example.org';

  it('applies OUR OWN reaction from a SELF react control DM when ownAddr is given', () => {
    // A SELF-authored `⇋ react` control DM (a reaction we made to someone
    // else's post) re-applies our own tally so a re-indexed/migrated store
    // recovers reactions that were previously only applied by the endpoint.
    store.ingestMessage(makeMessage({ id: 1, fromId: 11, text: 'bobs post', sender: { address: 'bob@x' } as any }), TARGET);
    const react = makeMessage({ id: 2, fromId: 1, text: buildReactionText('❤', midTok(TARGET)) });
    deriveOnIngest(store, react, 'self-react@example.org', SELF);

    expect(store.reactionTallies(TARGET)).toEqual([{ emoji: '❤', count: 1, reactors: [SELF] }]);
    // Still no notification for SELF-authored anything.
    expect(store.listNotifications({})).toHaveLength(0);
  });

  it('is idempotent: re-deriving the same SELF reaction does not double-apply (set-add)', () => {
    const react = makeMessage({ id: 2, fromId: 1, text: buildReactionText('🎉', midTok(TARGET)) });
    deriveOnIngest(store, react, 'self-react@example.org', SELF);
    deriveOnIngest(store, react, 'self-react@example.org', SELF);
    expect(store.reactionTallies(TARGET)).toEqual([{ emoji: '🎉', count: 1, reactors: [SELF] }]);
  });

  it('replays a react then a later unreact in chronological order: the retract wins', () => {
    // Within one chat getMessageIds is chronological, so react (earlier) then
    // unreact (later) replay in order and the tally ends empty.
    const react = makeMessage({ id: 2, fromId: 1, text: buildReactionText('❤', midTok(TARGET)) });
    const unreact = makeMessage({ id: 3, fromId: 1, text: buildUnreactionText('❤', midTok(TARGET)) });
    deriveOnIngest(store, react, 'self-react@example.org', SELF);
    deriveOnIngest(store, unreact, 'self-unreact@example.org', SELF);
    expect(store.reactionTallies(TARGET)).toEqual([]);
  });

  it('canonicalizes the reaction target mid (a SELF reaction to a DM copy tallies under the feed mid)', () => {
    const DM = 'dm-copy@example.org';
    const FEED = 'feed-copy@example.org';
    store.aliasMid(DM, FEED);
    const react = makeMessage({ id: 2, fromId: 1, text: buildReactionText('❤', midTok(DM)) });
    deriveOnIngest(store, react, 'self-react@example.org', SELF);
    expect(store.reactionTallies(FEED)).toEqual([{ emoji: '❤', count: 1, reactors: [SELF] }]);
  });

  it('a SELF reply/boost still derives nothing even with ownAddr (only reactions re-derive)', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, SELF);
    const reply = makeMessage({ id: 2, fromId: 1, text: buildReplyText('self reply', ref, mintPostUuid()) });
    expect(deriveOnIngest(store, reply, 'self-reply@example.org', SELF)).toEqual([]);
    expect(store.listNotifications({})).toHaveLength(0);
  });
});

describe('deriveOnIngest: TOFU key pinning', () => {
  const ALICE = 'alice@example.org';
  const UUID = 'aaaa1111-2222-4333-8444-555555555555';

  /** A signed post envelope string authored by `addr` via a scratch attestor. */
  const signedPost = async (addr: string, text: string, keyFile: string) => {
    const { openAttestor } = await import('../src/attest.js');
    const { buildPostObject, serializeEnvelope } = await import('../src/envelope.js');
    const a = openAttestor(join(dir, keyFile));
    const env = buildPostObject(text, UUID);
    const { ts, pubkey, sig } = a.sign(env, addr);
    return { text: serializeEnvelope({ ...env, ts, pubkey, sig }), pubkey };
  };

  it('pins the pubkey of a direct (non-SELF) signed delivery, first-wins', async () => {
    const { text, pubkey } = await signedPost(ALICE, 'hi', 'k1.json');
    const msg = makeMessage({ id: 2, fromId: 11, text, sender: { address: ALICE } as any });
    deriveOnIngest(store, msg, 'mid@x');
    expect(store.pinnedKey(ALICE)).toBe(pubkey);
  });

  it('does not overwrite an existing pin on a later conflicting delivery', async () => {
    const first = await signedPost(ALICE, 'hi', 'k1.json');
    const second = await signedPost(ALICE, 'later', 'k2.json'); // different key
    deriveOnIngest(store, makeMessage({ id: 2, fromId: 11, text: first.text, sender: { address: ALICE } as any }), 'm1@x');
    deriveOnIngest(store, makeMessage({ id: 3, fromId: 11, text: second.text, sender: { address: ALICE } as any }), 'm2@x');
    expect(store.pinnedKey(ALICE)).toBe(first.pubkey);
    expect(second.pubkey).not.toBe(first.pubkey);
  });

  it('never pins from an embedded boost orig (a booster cannot seed a fake pin)', async () => {
    // Booster BOB boosts ALICE's post, embedding ALICE's signed orig. Ingesting
    // BOB's boost pins BOB's key (if signed) but NEVER ALICE's from the orig.
    const { openAttestor } = await import('../src/attest.js');
    const { buildPostObject, buildBoostObject, serializeEnvelope } = await import('../src/envelope.js');
    const aliceA = openAttestor(join(dir, 'alice.json'));
    const aliceEnv = buildPostObject('alice post', UUID);
    const aliceSig = aliceA.sign(aliceEnv, ALICE);
    const orig = { ...aliceEnv, ...aliceSig };

    const BOB = 'bob@example.org';
    const bobA = openAttestor(join(dir, 'bob.json'));
    const boostEnv = buildBoostObject('boost-uuid', { u: UUID, addr: ALICE }, orig);
    const bobSig = bobA.sign(boostEnv, BOB);
    const boostText = serializeEnvelope({ ...boostEnv, ...bobSig });

    const msg = makeMessage({ id: 5, fromId: 22, text: boostText, sender: { address: BOB } as any });
    deriveOnIngest(store, msg, 'boost-mid@x');
    expect(store.pinnedKey(ALICE), 'orig author never pinned from an embed').toBeNull();
    expect(store.pinnedKey(BOB), 'the direct booster IS pinned').toBe(bobA.publicKeyBase64());
  });

  it('does not pin from a SELF message', async () => {
    const { text } = await signedPost('self@x', 'mine', 'self.json');
    const msg = makeMessage({ id: 2, fromId: 1, text, sender: { address: 'self@x' } as any });
    deriveOnIngest(store, msg, 'mid@x', 'self@x');
    expect(store.pinnedKey('self@x')).toBeNull();
  });

  it('does not pin an unsigned/legacy delivery (no pubkey)', () => {
    const msg = makeMessage({ id: 2, fromId: 11, text: 'plain legacy post', sender: { address: ALICE } as any });
    deriveOnIngest(store, msg, 'mid@x');
    expect(store.pinnedKey(ALICE)).toBeNull();
  });
});

describe('deriveOnIngest: body mentions (addressing)', () => {
  const MY_ADDR = 'p6yalimhl@nine.testrun.org';
  const postMsg = (id: number, body: string, uuid = mintPostUuid()) =>
    makeMessage({
      id,
      fromId: 11,
      text: buildPostEnvelope(body, uuid),
      sender: { address: BOB } as any,
    });

  it('notifies when a content message mentions my address', () => {
    const msg = postMsg(2, `hey @${MY_ADDR} look at this`);
    store.ingestMessage(msg, 'post-mid@example.org');
    const created = deriveOnIngest(store, msg, 'post-mid@example.org', MY_ADDR);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ type: 'mention', accountAddr: BOB, statusMsgId: 2 });
  });

  it('dedupes across the feed copy and the mention DM copy (same uuid)', () => {
    const uuid = mintPostUuid();
    const feed = postMsg(2, `hi @${MY_ADDR}`, uuid);
    const dm = postMsg(3, `hi @${MY_ADDR}`, uuid);
    store.ingestMessage(feed, 'copy-a@example.org');
    store.ingestMessage(dm, 'copy-b@example.org', false);
    expect(deriveOnIngest(store, feed, 'copy-a@example.org', MY_ADDR)).toHaveLength(1);
    expect(deriveOnIngest(store, dm, 'copy-b@example.org', MY_ADDR)).toHaveLength(0);
  });

  it('does not double-notify a reply to my post that also mentions me', () => {
    seedOwnMessage();
    const ref = refFromToken({ kind: 'mid', mid: OWN_MID }, 'self@example.org');
    const msg = makeMessage({
      id: 2,
      fromId: 11,
      text: buildReplyText(`right @${MY_ADDR}?`, ref, mintPostUuid()),
      sender: { address: BOB } as any,
    });
    store.ingestMessage(msg, 'reply-mid@example.org');
    const created = deriveOnIngest(store, msg, 'reply-mid@example.org', MY_ADDR);
    expect(created).toHaveLength(1);
    expect(created[0]!.type).toBe('mention');
  });

  it("notifies a mention inside a reply to someone ELSE's post", () => {
    const ref = refFromToken({ kind: 'mid', mid: 'someone-elses@example.org' }, 'carol@x.org');
    const msg = makeMessage({
      id: 2,
      fromId: 11,
      text: buildReplyText(`cc @${MY_ADDR}`, ref, mintPostUuid()),
      sender: { address: BOB } as any,
    });
    store.ingestMessage(msg, 'reply-mid@example.org');
    const created = deriveOnIngest(store, msg, 'reply-mid@example.org', MY_ADDR);
    expect(created).toHaveLength(1);
    expect(created[0]!.type).toBe('mention');
  });

  it('never notifies for my own messages or messages not mentioning me', () => {
    const own = makeMessage({ id: 2, fromId: 1, text: `note to self @${MY_ADDR}` });
    store.ingestMessage(own, 'own2@example.org');
    expect(deriveOnIngest(store, own, 'own2@example.org', MY_ADDR)).toHaveLength(0);

    const other = postMsg(3, 'mentioning @someoneelse@nine.testrun.org only');
    store.ingestMessage(other, 'other@example.org');
    expect(deriveOnIngest(store, other, 'other@example.org', MY_ADDR)).toHaveLength(0);
  });
});
