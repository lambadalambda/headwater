import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { T } from '@deltachat/jsonrpc-client';
import { parseMarkers } from './protocol.js';

const DC_CONTACT_ID_SELF = 1;

export type NotificationType =
  | 'follow'
  | 'mention'
  | 'reblog'
  | 'favourite'
  | 'pleroma:emoji_reaction';

export type Notification = {
  id: string;
  type: NotificationType;
  createdAt: string;
  accountAddr: string;
  accountContactId?: number;
  emoji?: string;
  statusMsgId?: number;
};

/** Input to `addNotification`: everything but the id/createdAt, plus an optional dedupe key source. */
export type NotificationInput = {
  type: NotificationType;
  accountAddr: string;
  accountContactId?: number;
  emoji?: string;
  statusMsgId?: number;
  /**
   * The mid this notification is "about" (the replied-to/boosted/reacted-to
   * message), used to build the dedupe key `type:addr:mid[:emoji]`. Optional
   * because follow notifications have no associated mid.
   */
  dedupeMid?: string;
  /**
   * Emoji to fold into the dedupe key, if different from (or absent from)
   * the stored `emoji` field — e.g. a favourite notification stores no
   * `emoji` field but still dedupes per-emoji against
   * `pleroma:emoji_reaction`s on the same mid/reactor. Defaults to `emoji`.
   */
  dedupeEmoji?: string;
};

type StoredReactions = Record<string, Record<string, string[]>>;

type StoreData = {
  midToMsgId: Record<string, number>;
  msgIdToMid: Record<number, string>;
  replyChildren: Record<string, number[]>;
  boostsByMid: Record<string, number[]>;
  /** msgIds (this account's own boosts) keyed by the mid they boosted. */
  ownBoosts: Record<string, number>;
  /** msgIds already ingested, so re-ingesting the same message is a no-op. */
  ingestedMsgIds: number[];
  /** mids authored by SELF (DC contact id 1). */
  ownMids: string[];
  /** mid -> reactor address -> emoji[] (a reactor may use several distinct emoji per mid). */
  reactions: StoredReactions;
  notifications: Notification[];
  /** Dedupe keys already recorded, so re-adding the same notification is a no-op. */
  notificationDedupeKeys: string[];
  nextNotificationId: number;
};

const emptyData = (): StoreData => ({
  midToMsgId: {},
  msgIdToMid: {},
  replyChildren: {},
  boostsByMid: {},
  ownBoosts: {},
  ingestedMsgIds: [],
  ownMids: [],
  reactions: {},
  notifications: [],
  notificationDedupeKeys: [],
  nextNotificationId: 1,
});

export type ReactionTally = { emoji: string; count: number; reactors: string[] };

export type Store = {
  /**
   * `isFeedMessage` (default `true`, for back-compat with existing callers)
   * gates reply/boost edge registration: only messages delivered in a FEED
   * chat (Group/OutBroadcast/InBroadcast) may register `replyChildren` /
   * `boostsByMid` entries. DM copies of the same reply/boost (e.g. the
   * reply-notify control DM to the original author) still get their mid
   * <-> msgId mapping and `ownMids` bookkeeping recorded — just not the
   * edge — so the same logical reply delivered twice (once via feed, once
   * via DM) registers only once. See DEVLOG for the double-count bug this
   * fixes.
   */
  ingestMessage(msg: T.Message, mid: string, isFeedMessage?: boolean): void;
  resolveMid(mid: string): number | null;
  midForMsgId(msgId: number): string | null;
  replyChildren(mid: string): number[];
  childrenCount(mid: string): number;
  boostsByMid(mid: string): number[];
  boostCount(mid: string): number;
  isOwnBoost(mid: string): boolean;
  ownBoostMsgId(mid: string): number | null;
  /** Was this mid authored by SELF (DC contact id 1)? */
  isOwnMid(mid: string): boolean;
  applyReaction(mid: string, addr: string, emoji: string): void;
  retractReaction(mid: string, addr: string, emoji: string): void;
  reactionTallies(mid: string): ReactionTally[];
  /** Returns the stored notification, or null if it was a dedupe no-op. */
  addNotification(input: NotificationInput): Notification | null;
  listNotifications(query: { limit?: number; maxId?: string; sinceId?: string }): Notification[];
};

/** A fresh scratch path for callers (tests, `createApp` defaults) that don't need cross-restart persistence. */
export const ephemeralStorePath = (): string =>
  join(tmpdir(), `deltanet-store-${randomUUID()}.json`);

const dedupeKey = (input: NotificationInput): string | null => {
  if (!input.dedupeMid) return null;
  const parts = [input.type, input.accountAddr, input.dedupeMid];
  const emoji = input.dedupeEmoji ?? input.emoji;
  if (emoji) parts.push(emoji);
  return parts.join(':');
};

/**
 * Per-account persistent index over the deltanet wire convention: mid <->
 * msgId, reply children, boost tallies, reactions, and notifications.
 * Loaded lazily from `filePath` (a JSON file whose path is injected — one
 * per account data dir) and saved synchronously on every mutation; the data
 * here is small (indices over message ids/mids), so this stays simple
 * rather than debounced.
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
    ingestMessage: (msg, mid, isFeedMessage = true) => {
      const d = load();
      if (ingestedSet().has(msg.id)) return;

      d.midToMsgId[mid] = msg.id;
      d.msgIdToMid[msg.id] = mid;

      if (msg.fromId === DC_CONTACT_ID_SELF && !d.ownMids.includes(mid)) {
        d.ownMids.push(mid);
      }

      // Reply/boost edges are only registered from FEED chats (Group/
      // OutBroadcast/InBroadcast). DM copies of the same reply/boost
      // (delivered under a different rfc724Mid) must not also register an
      // edge, or context/reply-count would double-count a single logical
      // reply/boost delivered both ways.
      if (isFeedMessage) {
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
    isOwnMid: (mid) => load().ownMids.includes(mid),

    applyReaction: (mid, addr, emoji) => {
      const d = load();
      const byReactor = d.reactions[mid] ?? {};
      const emojis = byReactor[addr] ?? [];
      if (!emojis.includes(emoji)) emojis.push(emoji);
      byReactor[addr] = emojis;
      d.reactions[mid] = byReactor;
      save();
    },

    retractReaction: (mid, addr, emoji) => {
      const d = load();
      const byReactor = d.reactions[mid];
      if (!byReactor) return;
      const emojis = byReactor[addr];
      if (!emojis) return;
      const idx = emojis.indexOf(emoji);
      if (idx === -1) return;
      emojis.splice(idx, 1);
      if (emojis.length === 0) delete byReactor[addr];
      else byReactor[addr] = emojis;
      save();
    },

    reactionTallies: (mid) => {
      const byReactor = load().reactions[mid] ?? {};
      const tallies = new Map<string, string[]>();
      for (const [addr, emojis] of Object.entries(byReactor)) {
        for (const emoji of emojis) {
          const reactors = tallies.get(emoji) ?? [];
          reactors.push(addr);
          tallies.set(emoji, reactors);
        }
      }
      return [...tallies.entries()].map(([emoji, reactors]) => ({
        emoji,
        count: reactors.length,
        reactors,
      }));
    },

    addNotification: (input) => {
      const d = load();
      const key = dedupeKey(input);
      if (key && d.notificationDedupeKeys.includes(key)) return null;

      const notification: Notification = {
        id: String(d.nextNotificationId++),
        type: input.type,
        createdAt: new Date().toISOString(),
        accountAddr: input.accountAddr,
        ...(input.accountContactId !== undefined ? { accountContactId: input.accountContactId } : {}),
        ...(input.emoji !== undefined ? { emoji: input.emoji } : {}),
        ...(input.statusMsgId !== undefined ? { statusMsgId: input.statusMsgId } : {}),
      };
      d.notifications.push(notification);
      if (key) d.notificationDedupeKeys.push(key);
      save();
      return notification;
    },

    listNotifications: ({ limit, maxId, sinceId }) => {
      const all = load().notifications;
      const maxIdNum = maxId !== undefined ? Number(maxId) : undefined;
      const sinceIdNum = sinceId !== undefined ? Number(sinceId) : undefined;
      const filtered = all.filter((n) => {
        const idNum = Number(n.id);
        if (maxIdNum !== undefined && !(idNum < maxIdNum)) return false;
        if (sinceIdNum !== undefined && !(idNum > sinceIdNum)) return false;
        return true;
      });
      const sorted = filtered.slice().sort((a, b) => Number(b.id) - Number(a.id));
      return limit !== undefined ? sorted.slice(0, limit) : sorted;
    },
  };
};
