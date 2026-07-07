# Clicking a verified boost embed 500s the thread view (orig-<uuid> ids unresolvable)

## Summary

Live QA (lain's node): clicking bob's boost of carol's post navigates to
`/app/thread/orig-<uuid>` and errors. `GET /api/v1/statuses/orig-<uuid>`
and `.../context` both return **500**: the handlers do
`Number(c.req.param('id'))` → NaN → `transport.message(NaN)` throws.

We CAN render this thread honestly: the recipient holds the boost
message whose envelope embeds the verified original (store
`boostsByMid[<uuid>]` → boost msgIds; on lain's node the failing uuid
maps to msgId 157). Rendering the verified embed as the thread's focal
status is exactly the attested content we already show in the timeline —
no synthesis (0002).

## Requirements

1. `GET /api/v1/statuses/orig-<uuid>`: resolve the uuid via the store's
   boost index (`boostsByMid` post-key) to a held boost message whose
   parsed `boostOrig.uuid` matches; run the SAME verification ladder the
   timeline uses (reuse the mapper — sig + pin + media hash + contact-
   first attribution, nothing reimplemented) and return the verified-
   embed status. If we actually hold the original post itself (uuid
   resolves locally), return the real local status instead. No candidate
   verifies → 404. Never 500.
2. `GET /api/v1/statuses/orig-<uuid>/context`: `ancestors: []`;
   `descendants`: the store's resolvable reply children for that post
   key, mapped exactly like the numeric-id context path (we may hold DM
   reply copies for a post we never received); otherwise empty arrays.
   Never 500.
3. Harden ALL `/statuses/:id...` routes (favourite, reblog, reactions,
   etc.) against non-numeric ids: a malformed or non-actionable id (e.g.
   `orig-*` where the action needs a local message) returns a clean 404
   JSON error, never a crash/500. (Whether interactions on orig-* posts
   should WORK via uuid refs is a separate future issue — out of scope.)
4. Frontend: verify the thread page renders a status whose id is
   `orig-<uuid>` with empty context (it should — ids are treated as
   opaque strings); only fix what's actually broken there, if anything.

## Acceptance Criteria

- Unit (daemon): orig-<uuid> status fetch returns the verified embed
  with contact-first attribution; unknown uuid → 404; context returns
  reply children when the store has them, else empty; non-numeric id on
  an action route → 404 JSON, no 500.
- Live: clicking the boost on lain's node opens the thread showing
  carol's attested post, no error.
- `pnpm test` + `pnpm check` green in daemon/ (and frontend if touched).

## Current Status

DONE (2026-07-07). Implemented in `daemon/src/server.ts` only; frontend
untouched (see DEVLOG "orig-<uuid> thread view").

- `parseStatusId(raw)`: shared helper — a discriminated union
  (`msg` / `orig` / `null`) replacing the scattered `Number(id)` calls, so a
  non-numeric id is a clean 404 across EVERY `/statuses/:id` route, never a 500.
- `resolveOrigStatus(transport, uuid)`: locally-held original
  (`store.resolveKey(uuid)`) → real local status; else walk
  `store.boostsByMid(uuid)` for a held boost whose embedded `orig` verifies via
  the EXISTING mapper (`toStatus`) — its `.reblog` IS the verified embed
  (contact-first attribution comes free); no verifiable candidate → 404. No
  verification reimplemented (0002).
- `GET /statuses/orig-<uuid>` returns that resolved status; `.../context`
  returns `ancestors: []` and descendants = the BFS over the uuid post key
  (DM reply copies we hold render), mapped exactly like the numeric path, else
  empty. Never 500.
- Action routes (reblog/unreblog/favourite/reactions) 404 on any non-numeric
  id (uuid-ref interactions are a separate future issue, per scope).
- Frontend needed NO change: status ids are already opaque strings end to end
  (thread route + `threadHref` `encodeURIComponent` + e2e suite drives
  non-numeric ids with empty context). Frontend suite not run (untouched).
- Tests: `daemon/tests/server.test.ts` +14 (739 total, was 725) — verified
  embed w/ contact-first attribution, locally-held original, unknown uuid 404,
  non-numeric 404 (no 500), orig context empty vs. reply children, action-route
  hardening matrix. `pnpm test` + `pnpm check` green. Integration not run.
