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
