# Notifications

## Summary

`/api/v1/notifications` is a stub. Real notifications derive from securejoin
events and ingested wire-convention messages.

## Requirements

- Notification records persist in the daemon store (data dir JSON), fed by:
  - new follower: `SecurejoinInviterProgress` progress 1000 → `type: follow`
  - reply: ingested message/DM with a `↳re` marker resolving to an own
    message → `type: mention` (carries the reply status)
  - boost: ingested feed message with `♻` marker resolving to an own
    message → `type: reblog`
  - reaction control DM on an own message → ❤ → `type: favourite`, other
    emoji → `type: pleroma:emoji_reaction` with `emoji` field
- Dedupe (a reply seen both via DM copy and via followed feed must notify
  once — key on sender+marker).
- `GET /api/v1/notifications`: newest first, Mastodon notification JSON
  (id, type, created_at, account, status where relevant), `limit` +
  `max_id`/`since_id` pagination.
- Frontend polls; no streaming needed for v1.

## Acceptance Criteria

- Follower join, incoming reply, and incoming reaction each produce exactly
  one notification rendering sensibly on the notifications page.
- Unit tests: derivation from a fake event/ingest source; pagination.

## Current Status (2026-07-06)

Implemented. Notification storage/pagination lives in `daemon/src/store.ts`
(`addNotification`/`listNotifications`, append-only, persisted, dedupe key
`type:addr:mid[:emoji]`). Derivation from ingested messages (mention on a
reply targeting an own mid, reblog on a boost targeting an own mid,
favourite/pleroma:emoji_reaction on a reaction targeting an own mid) is a
new pure-ish function `deriveOnIngest` in `daemon/src/ingest.ts`, wired into
both `server.ts`'s timeline/status ingestion path and `main.ts`'s
`IncomingMsg`-driven ingestion — the same call site, right after
`store.ingestMessage`. SELF-authored messages are skipped entirely (no
notification, no reaction side effect) since the favourite/reaction
endpoints apply our own reactions directly rather than round-tripping
through ingesting our own outgoing DM. New-follower notifications are
wired in `main.ts` via a new `Transport.onFollower(handler)` subscription
over the `SecurejoinInviterProgress` core event (finding: per its own
`types.d.ts` doc comment, `progress` on that event is always 1000 — there's
no intermediate-progress inviter-side variant, unlike the joiner-side
event).

`GET /api/v1/notifications` (`daemon/src/server.ts`) replaced the stub,
mapping to real Mastodon notification JSON with `limit`/`max_id`/
`since_id`, newest first.

Known limitation not addressed: repeated follow notifications for the same
contact (e.g. re-joining after an unfollow) aren't deduped — follow
notifications have no natural mid to dedupe against, and the issue's
dedupe requirement was specifically about a reply seen twice (DM + feed
copy), which *is* handled. See `../../DEVLOG.md` for the full write-up.
Tests: `daemon/tests/store.test.ts` (storage/pagination/dedupe),
`daemon/tests/ingest.test.ts` (derivation), `daemon/tests/server.test.ts`
(endpoint mapping).
