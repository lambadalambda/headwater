import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { T } from '@deltachat/jsonrpc-client';
import { parseMarkers } from './protocol.js';

const DC_CONTACT_ID_SELF = 1;

type StoreData = {
  midToMsgId: Record<string, number>;
  msgIdToMid: Record<number, string>;
  replyChildren: Record<string, number[]>;
  boostsByMid: Record<string, number[]>;
  /** msgIds (this account's own boosts) keyed by the mid they boosted. */
  ownBoosts: Record<string, number>;
  /** msgIds already ingested, so re-ingesting the same message is a no-op. */
  ingestedMsgIds: number[];
};

const emptyData = (): StoreData => ({
  midToMsgId: {},
  msgIdToMid: {},
  replyChildren: {},
  boostsByMid: {},
  ownBoosts: {},
  ingestedMsgIds: [],
});

export type Store = {
  ingestMessage(msg: T.Message, mid: string): void;
  resolveMid(mid: string): number | null;
  midForMsgId(msgId: number): string | null;
  replyChildren(mid: string): number[];
  childrenCount(mid: string): number;
  boostsByMid(mid: string): number[];
  boostCount(mid: string): number;
  isOwnBoost(mid: string): boolean;
  ownBoostMsgId(mid: string): number | null;
};

/** A fresh scratch path for callers (tests, `createApp` defaults) that don't need cross-restart persistence. */
export const ephemeralStorePath = (): string =>
  join(tmpdir(), `deltanet-store-${randomUUID()}.json`);

/**
 * Per-account persistent index over the deltanet wire convention: mid <->
 * msgId, reply children, and boost tallies. Loaded lazily from `filePath`
 * (a JSON file whose path is injected — one per account data dir) and
 * saved synchronously on every mutation; the data here is small (indices
 * over message ids/mids), so this stays simple rather than debounced.
 */
export const createStore = (filePath: string): Store => {
  let data: StoreData | null = null;

  const load = (): StoreData => {
    if (data) return data;
    let loaded: StoreData = emptyData();
    if (existsSync(filePath)) {
      try {
        const raw = JSON.parse(readFileSync(filePath, 'utf8'));
        loaded = { ...emptyData(), ...raw };
      } catch {
        loaded = emptyData();
      }
    }
    data = loaded;
    return data;
  };

  const save = (): void => {
    if (!data) return;
    writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  };

  const ingestedSet = (): Set<number> => new Set(load().ingestedMsgIds);

  return {
    ingestMessage: (msg, mid) => {
      const d = load();
      if (ingestedSet().has(msg.id)) return;

      d.midToMsgId[mid] = msg.id;
      d.msgIdToMid[msg.id] = mid;

      const parsed = parseMarkers(msg.text);
      if (parsed.reply) {
        const children = d.replyChildren[parsed.reply.mid] ?? [];
        children.push(msg.id);
        d.replyChildren[parsed.reply.mid] = children;
      }
      if (parsed.boost) {
        const boosters = d.boostsByMid[parsed.boost.mid] ?? [];
        boosters.push(msg.id);
        d.boostsByMid[parsed.boost.mid] = boosters;
        if (msg.fromId === DC_CONTACT_ID_SELF) {
          d.ownBoosts[parsed.boost.mid] = msg.id;
        }
      }

      d.ingestedMsgIds.push(msg.id);
      save();
    },

    resolveMid: (mid) => load().midToMsgId[mid] ?? null,
    midForMsgId: (msgId) => load().msgIdToMid[msgId] ?? null,
    replyChildren: (mid) => load().replyChildren[mid] ?? [],
    childrenCount: (mid) => (load().replyChildren[mid] ?? []).length,
    boostsByMid: (mid) => load().boostsByMid[mid] ?? [],
    boostCount: (mid) => (load().boostsByMid[mid] ?? []).length,
    isOwnBoost: (mid) => load().ownBoosts[mid] !== undefined,
    ownBoostMsgId: (mid) => load().ownBoosts[mid] ?? null,
  };
};
