/**
 * Derivation pass run over every ingested message: turns deltanet
 * wire-convention markers (see ./protocol.ts) into store side effects —
 * reaction tallies and notifications. Separate from `Store.ingestMessage`
 * (which only maintains the mid/msgId/reply/boost indices) so the
 * notification-producing logic stays independently testable with a plain
 * `Store` + fake messages, no transport required.
 */
import type { T } from '@deltachat/jsonrpc-client';
import {
  buildInviteGrantText,
  parseInviteGrant,
  parseInviteRequest,
  parseMarkers,
  parseReaction,
} from './protocol.js';
import type { Notification, Store } from './store.js';
import type { Transport } from './transport/types.js';

const DC_CONTACT_ID_SELF = 1;
const FAVOURITE_EMOJI = '❤';

/**
 * Given a message that has just been ingested into the mid/msgId index
 * (`mid` is that message's own rfc724 Message-ID), derive any notification
 * and/or reaction-store side effects implied by its wire-convention markers.
 *
 * - incoming (non-SELF) reply targeting an own mid -> mention notification.
 * - incoming (non-SELF) boost targeting an own mid -> reblog notification.
 * - incoming (non-SELF) reaction/unreaction -> apply/retract in the
 *   reaction store; if the reacted-to mid is our own, also notify
 *   (favourite for ❤, pleroma:emoji_reaction otherwise).
 * - SELF messages are ingested for `ownMids` bookkeeping elsewhere
 *   (`Store.ingestMessage`) but never produce notifications or reaction
 *   side effects here — the favourite/react endpoints apply our own
 *   reactions to the store directly instead of relying on ingesting our
 *   own outgoing control DM.
 *
 * Returns the notifications actually created (i.e. not dedupe no-ops) —
 * `Store.addNotification` already reports this per-call via its `| null`
 * return, so this just collects the non-null results. Live ingestion
 * (`main.ts`) uses this to broadcast exactly the newly-derived notifications
 * over the streaming hub without a separate before/after diff against
 * `listNotifications`.
 */
export const deriveOnIngest = (store: Store, msg: T.Message, mid: string): Notification[] => {
  if (msg.fromId === DC_CONTACT_ID_SELF) return [];

  const accountAddr = msg.sender.address;
  const accountContactId = msg.fromId;
  const created: Notification[] = [];

  const reaction = parseReaction(msg.text);
  if (reaction) {
    if (reaction.kind === 'react') {
      store.applyReaction(reaction.mid, accountAddr, reaction.emoji);
    } else {
      store.retractReaction(reaction.mid, accountAddr, reaction.emoji);
    }

    if (reaction.kind === 'react' && store.isOwnMid(reaction.mid)) {
      const statusMsgId = store.resolveMid(reaction.mid) ?? undefined;
      const isFavourite = reaction.emoji === FAVOURITE_EMOJI;
      const notification = store.addNotification({
        type: isFavourite ? 'favourite' : 'pleroma:emoji_reaction',
        accountAddr,
        accountContactId,
        ...(isFavourite ? {} : { emoji: reaction.emoji }),
        ...(statusMsgId !== undefined ? { statusMsgId } : {}),
        dedupeMid: reaction.mid,
        // Fold the emoji into the dedupe key even for favourites (whose
        // stored notification has no `emoji` field) so a ❤ and a distinct
        // emoji reaction from the same reactor on the same mid never
        // dedupe against each other.
        dedupeEmoji: reaction.emoji,
      });
      if (notification) created.push(notification);
    }
    return created;
  }

  const parsed = parseMarkers(msg.text);

  if (parsed.reply && store.isOwnMid(parsed.reply.mid)) {
    const notification = store.addNotification({
      type: 'mention',
      accountAddr,
      accountContactId,
      statusMsgId: msg.id,
      dedupeMid: parsed.reply.mid,
    });
    if (notification) created.push(notification);
  }

  if (parsed.boost && store.isOwnMid(parsed.boost.mid)) {
    const notification = store.addNotification({
      type: 'reblog',
      accountAddr,
      accountContactId,
      statusMsgId: msg.id,
      dedupeMid: parsed.boost.mid,
    });
    if (notification) created.push(notification);
  }

  return created;
};

/**
 * Follow-back actions (see ../meta/issues/follow-back-invite-request.md).
 *
 * Interpreting an invite-request/invite-grant DM requires *async* transport
 * work (replying with our invite, or joining a feed), but `deriveOnIngest`
 * (and the whole store-derivation path) is sync. Rather than force async into
 * it, `deriveFollowbackActions` is a pure, sync function that inspects a
 * message and returns the typed action(s) it implies; the caller (main.ts's
 * ingest hook) executes them against the live `Transport` via
 * `executeFollowbackAction`, and only for *live* (`'combined'`) messages — so
 * a daemon restart replaying old requests never re-answers or re-joins.
 */
export type FollowbackAction =
  /** Reply to `toContactId` with our feed invite (open grant policy v1). */
  | { kind: 'grant-invite'; toContactId: number }
  /** Join `link` (a solicited grant from `fromAddr`) then clear the pending marker. */
  | { kind: 'accept-grant'; link: string; fromAddr: string };

/**
 * Pure: derive the follow-back action(s) implied by a message's marker,
 * gated purely on store/message state (never on transport):
 *
 * - a non-SELF `⇋ invite-request` -> a `grant-invite` reply action.
 * - a non-SELF `⇋ invite <link>` grant -> an `accept-grant` action *only if*
 *   we have a recorded pending request to that sender's address. Unsolicited
 *   grants (no pending entry) return nothing, so they can never trigger a join.
 *
 * SELF-authored copies of either marker are ignored (we never grant to, or
 * accept from, ourselves).
 */
export const deriveFollowbackActions = (store: Store, msg: T.Message): FollowbackAction[] => {
  if (msg.fromId === DC_CONTACT_ID_SELF) return [];
  const text = msg.text;

  if (parseInviteRequest(text)) {
    return [{ kind: 'grant-invite', toContactId: msg.fromId }];
  }

  const link = parseInviteGrant(text);
  if (link) {
    const fromAddr = msg.sender.address;
    if (store.hasPendingFollowRequest(fromAddr)) {
      return [{ kind: 'accept-grant', link, fromAddr }];
    }
  }

  return [];
};

/**
 * Execute a follow-back action against the live transport. Called ONLY for
 * live (`'combined'`) messages by main.ts's ingest hook.
 *
 * - `grant-invite`: fetch our feed invite and DM it back to the requester.
 * - `accept-grant`: securejoin the feed via `follow()` (which also unblocks a
 *   previously-unfollowed feed), then clear the pending marker. The pending
 *   entry is cleared even if `follow()` throws, so a persistently failing
 *   join never loops re-answering the same grant on every restart.
 */
export const executeFollowbackAction = async (
  store: Store,
  transport: Transport,
  action: FollowbackAction,
): Promise<void> => {
  if (action.kind === 'grant-invite') {
    const invite = await transport.feedInvite();
    await transport.sendControlDm(action.toContactId, buildInviteGrantText(invite));
    return;
  }

  // accept-grant: join, then clear pending regardless of join outcome. A
  // failed join is logged, not thrown: we still clear the pending marker so a
  // persistently-failing link never loops re-answering the same grant.
  try {
    await transport.follow(action.link);
  } catch (err) {
    console.error('follow-back join failed (non-fatal):', err);
  } finally {
    store.clearPendingFollowRequest(action.fromAddr);
  }
};

/**
 * Backfill-only side effect for a follow-back action: pending-state cleanup
 * *without* any network action. A grant that arrived while the daemon was
 * down is replayed by the startup backfill sweep; we must not re-join on it
 * (that's `executeFollowbackAction`'s live-only job), but clearing the now-
 * satisfied pending entry is safe and desirable — otherwise `requested`
 * would stick forever for a follow that already completed before shutdown.
 */
export const cleanupFollowbackAction = (store: Store, action: FollowbackAction): void => {
  if (action.kind === 'accept-grant') store.clearPendingFollowRequest(action.fromAddr);
};
