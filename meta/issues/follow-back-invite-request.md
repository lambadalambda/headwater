# Follow-back via invite-request convention

## Summary

Following currently requires pasting an invite link. But any known contact
(every follower, anyone who replied/reacted) already shares a verified 1:1
channel with us — extend the wire convention so a daemon can *ask* for a
feed invite and join on the reply. Makes the profile Follow button real and
enables one-click follow-back.

## Requirements

- Wire convention additions (protocol module, pure + round-trip tested):
  - invite request: DM text `⇋ invite-request` (human-readable to vanilla
    DC users; tolerate trailing text on parse)
  - invite grant: DM text `⇋ invite <link>` where link is the feed invite
- Daemon behavior (ingest layer):
  - Incoming `invite-request` DM → auto-reply on the same 1:1 with the
    feed invite (open policy v1: grant to anyone; never reply to SELF;
    idempotent/rate-sane on repeats). A "locked account" deny mode is
    future work.
  - Incoming `invite grant` DM → ONLY if we have a recorded pending
    request to that contact: securejoin the link (reusing follow(), which
    unblocks previously-blocked feeds), clear the pending marker.
    Unsolicited invites are ignored (no auto-join).
  - Pending requests persist in the deltanet store (contact address →
    requested-at) and survive restarts.
- `POST /api/v1/accounts/:id/follow` becomes real: known contact → send
  the invite-request DM, record pending, return relationship
  `{following: false, requested: true}`. Unknown id → 404. Relationships
  endpoint reports `requested` for pending contacts; once the grant
  arrives and the join completes, `following: true` as usual.
- Integration test (real network, fresh accounts + data/int-* dirs per the
  isolation rule): A follows B via invite link; B follows A back via
  invite-request (no link paste); assert A's feed reaches B and both
  relationships end up following:true.

## Acceptance Criteria

- In the UI: on a follower's profile, clicking Follow completes the
  follow-back within seconds without touching an invite link (verified
  live in the browser).
- Unsolicited `⇋ invite` DMs never cause a join.
- Unit tests: protocol round-trips, pending-state gating, follow endpoint
  + relationship states.

## Current Status

Daemon-side implementation complete and green (unit + integration).

- Protocol markers (`buildInviteRequestText`/`parseInviteRequest`,
  `buildInviteGrantText`/`parseInviteGrant`, invite-link validation) —
  round-trip + tolerance tested.
- Store: persisted `pendingFollowRequests` (addr → requested-at) with
  add/clear/has/list accessors.
- Ingest: pure `deriveFollowbackActions` returns typed grant/accept actions;
  `executeFollowbackAction` runs them against the transport. Wired in
  `main.ts`, executed for live (`'combined'`) messages only; backfill does
  pending-state cleanup only (restart-safe — never re-grants/re-joins).
  Accept is store-gated (pending-only) — unsolicited grants are ignored.
- Server: `POST /api/v1/accounts/:id/follow` sends the invite-request, records
  pending, returns `{following:false, requested:true}`; 404 unknown; already-
  following is a no-op. Relationships/lookup/account endpoints report
  `requested` from the store; cleared on join.
- Tests: `pnpm test` (488) + `pnpm check` + `pnpm test:integration` (4,
  incl. a real-network follow-back + unsolicited-grant guard) all green.

Remaining (not in this pass): UI browser verification of the Follow button;
"locked account" deny-mode for grants (documented as future work in DEVLOG).
