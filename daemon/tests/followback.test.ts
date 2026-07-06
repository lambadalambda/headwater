import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore, type Store } from '../src/store.js';
import {
  buildInviteGrantText,
  buildInviteRequestText,
} from '../src/protocol.js';
import { deriveFollowbackActions, executeFollowbackAction } from '../src/ingest.js';
import type { Transport } from '../src/transport/types.js';
import { makeMessage } from './entities.test.js';

let dir: string;
let store: Store;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'deltanet-followback-'));
  store = createStore(join(dir, 'store.json'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const ALICE = 'alice@example.org';
const INVITE = 'https://i.delta.chat/#ALICEFEED';

const inviteRequestMsg = (over = {}) =>
  makeMessage({ id: 2, fromId: 11, text: buildInviteRequestText(), sender: { address: ALICE } as any, ...over });

const inviteGrantMsg = (link = INVITE, over = {}) =>
  makeMessage({ id: 3, fromId: 11, text: buildInviteGrantText(link), sender: { address: ALICE } as any, ...over });

describe('deriveFollowbackActions: invite-request', () => {
  it('returns a grant-invite action for a non-SELF invite-request', () => {
    const actions = deriveFollowbackActions(store, inviteRequestMsg());
    expect(actions).toEqual([{ kind: 'grant-invite', toContactId: 11 }]);
  });

  it('ignores an invite-request from SELF (never grant to ourselves)', () => {
    const msg = inviteRequestMsg({ fromId: 1 });
    expect(deriveFollowbackActions(store, msg)).toEqual([]);
  });

  it('ignores an ordinary message', () => {
    const msg = makeMessage({ id: 2, fromId: 11, text: 'just chatting', sender: { address: ALICE } as any });
    expect(deriveFollowbackActions(store, msg)).toEqual([]);
  });
});

describe('deriveFollowbackActions: invite grant', () => {
  it('returns an accept-grant action only when a pending request exists for the sender', () => {
    store.addPendingFollowRequest(ALICE, 1000);
    const actions = deriveFollowbackActions(store, inviteGrantMsg());
    expect(actions).toEqual([{ kind: 'accept-grant', link: INVITE, fromAddr: ALICE }]);
  });

  it('ignores an unsolicited grant (no pending request for the sender)', () => {
    expect(deriveFollowbackActions(store, inviteGrantMsg())).toEqual([]);
  });

  it('ignores a grant from SELF', () => {
    store.addPendingFollowRequest(ALICE, 1000);
    expect(deriveFollowbackActions(store, inviteGrantMsg(INVITE, { fromId: 1 }))).toEqual([]);
  });

  it('ignores a grant whose link is not a valid invite', () => {
    store.addPendingFollowRequest(ALICE, 1000);
    const msg = makeMessage({
      id: 3,
      fromId: 11,
      text: '⇋ invite https://evil.example.org/phish',
      sender: { address: ALICE } as any,
    });
    expect(deriveFollowbackActions(store, msg)).toEqual([]);
  });
});

const makeFakeTransport = () => {
  const dms: Array<{ contactId: number; text: string }> = [];
  const followed: string[] = [];
  const transport = {
    feedInvite: async () => INVITE,
    sendControlDm: async (contactId: number, text: string) => {
      dms.push({ contactId, text });
    },
    follow: async (link: string) => {
      followed.push(link);
      return 42;
    },
  } as unknown as Transport;
  return { transport, dms, followed };
};

describe('executeFollowbackAction: grant-invite', () => {
  it('replies to the requester with our feed invite', async () => {
    const { transport, dms } = makeFakeTransport();
    await executeFollowbackAction(store, transport, { kind: 'grant-invite', toContactId: 11 });
    expect(dms).toEqual([{ contactId: 11, text: buildInviteGrantText(INVITE) }]);
  });
});

describe('executeFollowbackAction: accept-grant', () => {
  it('joins the feed via follow() and clears the pending entry', async () => {
    store.addPendingFollowRequest(ALICE, 1000);
    const { transport, followed } = makeFakeTransport();
    await executeFollowbackAction(store, transport, { kind: 'accept-grant', link: INVITE, fromAddr: ALICE });
    expect(followed).toEqual([INVITE]);
    expect(store.hasPendingFollowRequest(ALICE)).toBe(false);
  });

  it('clears the pending entry even if follow() throws (never re-joins in a loop)', async () => {
    store.addPendingFollowRequest(ALICE, 1000);
    const transport = {
      follow: vi.fn(async () => {
        throw new Error('join failed');
      }),
    } as unknown as Transport;
    await executeFollowbackAction(store, transport, { kind: 'accept-grant', link: INVITE, fromAddr: ALICE });
    expect(store.hasPendingFollowRequest(ALICE)).toBe(false);
  });
});

describe('followback control DMs do not register edges or notifications', () => {
  it('deriveOnIngest never notifies on an invite-request or grant', async () => {
    const { deriveOnIngest } = await import('../src/ingest.js');
    store.addPendingFollowRequest(ALICE, 1000);
    expect(deriveOnIngest(store, inviteRequestMsg(), 'req-mid@example.org')).toEqual([]);
    expect(deriveOnIngest(store, inviteGrantMsg(), 'grant-mid@example.org')).toEqual([]);
    expect(store.listNotifications({})).toHaveLength(0);
  });
});
