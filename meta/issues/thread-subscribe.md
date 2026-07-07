# Subscribe to thread: per-thread channel hosted by the root author

## Summary

Design sketch #3 (revised), layers 2–3. Auto-backfill heals history you
can reach through your peers; it cannot deliver the FUTURE of a thread
once no followee is active in it, nor branches none of your peers
touched. Explicit subscription covers both: a "Subscribe to thread"
action in the thread view keeps a user updated on a thread regardless of
who participates.

AMENDED (2026-07-07) for the substrate findings from the two predecessor
issues: (1) there is no cold 1:1 send — securejoin (or a received
message) is the only key path, and sends must target MESSAGE-DERIVED
key-contact ids, never addr lookups; (2) the grant DM can carry the
thread-so-far bundle directly, because a requester is by definition
1:1-reachable (their request DM just arrived); (3) republication reuses
the envelope-bundle + held-envelope machinery from thread-auto-backfill
rather than inventing a second relay format.

## Requirements

1. **Subscribe request**: scoped v2 invite-request
   (`{"type":"invite-request","scope":{"thread":"u:<root-uuid>"}}`) as a
   control DM to the root author, identified via the SIGNED `root` ref
   (or the root post's own uuid+author when the root post itself is
   held/local). Reachability gate: send via an existing key-contact
   (message-derived id — e.g. the held root post's provenance chain or
   any prior 1:1) — if the subscriber has NO key path to the root
   author, the endpoint fails with a clean, distinguishable error the UI
   can show ("can't reach the thread author yet"). NO cold-send
   attempts. (In-band introduction so total strangers can subscribe is a
   SEPARATE follow-up issue — see below.)
2. **Thread channel (host side)**: the root author's daemon lazily
   creates a broadcast channel per hosted thread on first granted
   subscriber (transport gains a create-broadcast + invite-link seam,
   mirroring how the feed broadcast works). Auto-grant by default
   (public-thread semantics; locked interaction is visibility-channels
   territory, out of scope). Grant = ONE DM carrying a scoped v2
   invite-grant (`{"type":"invite-grant","scope":{"thread":...},"link":...}`)
   followed by the thread-so-far envelope-bundle DM(s) (same format +
   chunking as backfill; only SIGNED envelopes, verbatim, never
   fabricated — 0002). The 10-message core join backfill is NOT relied
   upon.
3. **Republication (host side)**: on ingesting a reply whose signed
   `root` names a hosted thread (root DM copies arrive by construction
   after wire-thread-root-ref), republish the reply's SIGNED envelope
   verbatim into the thread channel wrapped as an envelope-bundle
   message. The host can OMIT (reply control = moderation), never alter
   or fabricate. Dedupe: never republish the same uuid twice; never
   republish into a channel the reply's author... (self-echo: the
   subscriber who authored a reply will also see it via the channel —
   held-envelope ingest already refuses to overwrite a local resolution,
   so this is naturally idempotent; assert it).
4. **Subscriber ingest**: the subscriber joins the channel via securejoin
   on the granted link (like `follow()`, but persisted as a THREAD
   subscription, not a followed feed — it must NOT surface in following
   lists or home timeline). Envelope-bundle messages arriving on a
   subscribed thread channel (feed-type messages from that chat) are
   processed through the EXISTING bundle ingest (held envelopes,
   render-time verification, no TOFU pins) — extend the bundle handler's
   DM-only gate to also accept bundles from subscribed thread channels
   (still NEVER serve requests from channels). Suppression rules stay:
   no notifications, no home-timeline entries; the thread view (context
   endpoint) is where subscribed content appears. Streaming a thread
   update to an open thread view is a nice-to-have — pick minimal,
   note the decision.
5. **Store (schema bump)**: `hostedThreads` (rootUuid → chatId) and
   `threadSubscriptions` (rootUuid → chatId) — non-derivable roots that
   survive migrate, like pins/held envelopes.
6. **API + UI**: `POST/DELETE /api/v1/pleroma/statuses/:id/subscribe`
   (mirroring Pleroma's status-subscription naming; :id may be numeric
   or orig-<uuid>). Status entities gain
   `pleroma.deltanet.thread_subscribed: boolean` on thread roots the
   user is subscribed to. Frontend: Subscribe/Unsubscribe action on the
   thread view's root status; state survives reload; clean error toast
   for the unreachable-author case. Playwright coverage.
7. **Unsubscribe**: leave/block the channel chat + drop the subscription
   entry. Host prunes dead channels opportunistically (best-effort; no
   hard requirement).

## Follow-up issue to file (NOT in scope): in-band introduction

Total strangers (no key path to the root author) cannot subscribe yet.
Sound design sketch, verified against securejoin semantics: contact
invite links are self-authenticating (they carry the fingerprint; a
forged link either fails the handshake or yields a contact whose addr
mismatches the expected author → reject post-join). So invites can be
distributed UNSIGNED (bundle sidecar or a control message) as long as
the joiner verifies the resulting contact's addr equals the expected
author addr. File as `in-band-introduction` when this issue lands.

## Acceptance Criteria

- Unit: scoped invite-request/grant round-trip; reachability gate
  (no key path → clean error, no cold send); host lazy channel creation
  + auto-grant + bundle-on-grant; republication (verbatim, dedupe,
  omission honored, self-echo idempotent); subscriber channel-bundle
  ingest → held envelopes in context; store round-trip + migration;
  endpoint + entity flag; suppression (no notifications, no home
  timeline, no following-list pollution).
- Integration (local relay): A and B mutual-follow and thread; C follows
  B only. C backfills the thread (existing machinery), subscribes via
  the root ref — C CAN reach A here only if a key path exists, so the
  test first establishes one honestly (e.g. C follows A's feed briefly,
  or A replied to C earlier — pick the cheapest honest path and document
  it; do NOT fake reachability) — receives grant + thread-so-far, joins
  the channel, then B posts a NEW deep reply and C's thread view gains
  it via the channel without following anyone new. Unsubscribe stops
  further updates.
- Frontend: `mise exec -- pnpm test` (Playwright) green with the new
  button covered; daemon `pnpm test` + `pnpm test:integration` +
  `pnpm check` green.

## Dependencies

Blocked by: wire-thread-root-ref (DONE), thread-auto-backfill (DONE).
Files follow-up: in-band-introduction.

## Current Status

Implemented (2026-07-07, see DEVLOG). Full pipeline:

- **Protocol**: `invite-request`/`invite-grant` extended with an OPTIONAL
  `scope:{thread:'u:<root-uuid>'}` (`envelope.ts`); ABSENT = the existing FEED
  follow-back flow, UNCHANGED (regression tests assert the unscoped parsers still
  fire and that an old node degrades a scoped envelope to a feed follow-back).
  Tolerant scope parse. Republication + thread-so-far REUSE the
  `envelope-bundle` + held-envelope machinery (no second relay format; verbatim
  signed envelopes only — 0002).
- **Host** (`thread-subscribe.ts`): a scoped invite-request for a thread whose
  ROOT we hold → lazily `createBroadcast` a per-thread channel (once) + auto-grant
  a scoped invite-grant + DM the thread-so-far bundle(s) (`collectThreadUuids` +
  `buildServeBundles`). A fresh FEED reply whose SIGNED `root` ∈ hostedThreads →
  republished VERBATIM into the channel (signed-only, dedupe per uuid, omission =
  moderation). Auto-grant by default (public-thread semantics).
- **Subscriber**: a SOLICITED scoped grant (gated on `pendingThreadRequests`) →
  `follow()` + recorded as a THREAD subscription (NOT a followed feed). Bundles on
  a registered thread-subscription chat → the EXISTING held-envelope ingest
  (render-time verify, no TOFU pins). Suppressed: no notifications/streaming, held
  content never in home/public timelines — thread view (context) only.
- **Store (schema v6 → v7)**: `hostedThreads`, `threadSubscriptions`,
  `pendingThreadRequests`, `republishedUuids` — non-derivable roots that survive
  `migrate` like pins/held envelopes.
- **Exclusion**: `following()` + home/public timeline exclude thread-channel chats
  via the store's `threadSubscriptions` chatId set (server-layer `followedFeeds`/
  `excludeThreadSubscriptionMessages`), not a transport hack (a thread channel is
  an InBroadcast like any feed; the only honest discriminator is the store).
- **Reachability**: transport `keyContactIdForAddr` probes core's `e2eeAvail` and
  returns an id ONLY for a KEY-contact we can actually encrypt to → endpoint 422s
  `unreachable_author` with no cold send. `own_thread` 422 for our own thread.
- **API + UI**: `POST/DELETE /api/v1/pleroma/statuses/:id/subscribe`;
  `pleroma.deltanet.thread_subscribed` on subscribed roots; frontend
  Subscribe/Unsubscribe on the thread view's root status (optimistic + clean error
  toast + Playwright coverage).

**STREAMING DECISION (nice-to-have, minimal):** live-push of a thread update to an
open thread view is DEFERRED — channel content is suppressed like backfill and the
thread view refetches context on navigation; a per-thread streaming channel is out
of scope.

**INTEGRATION reachability (honest):** A follows C's FEED (not the reverse).
Securejoin exchanges keys both ways, so C — the INVITER — gets a KEY-contact for A
and can encrypt the scoped request, WITHOUT joining A's feed. So A's NEW deep reply
reaches C ONLY through A's thread channel (proven: `resolveKey(reply)` null on C,
only `heldEnvelope(reply)` set) — not a feed follow. Since A is root+host, A
republishes its OWN reply too: a self-authored feed post never re-arrives via the
ingest hook, so republication is ALSO triggered at reply-post time (idempotent with
the received-reply path via the per-uuid dedupe).

`pnpm test` (1028 unit), `pnpm check`, `pnpm test:integration` (9 files / 11 tests
green over the podman relay; `thread-subscribe.test.ts` ~52s), frontend
`pnpm test` (317 Playwright) + `pnpm check` all green.
