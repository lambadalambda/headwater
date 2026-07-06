# Notifications

## Summary

`/api/v1/notifications` is a stub. Derive real notifications from Delta Chat
events and message data.

## Requirements

- Daemon keeps a notification store (in-memory + JSON file in the data dir
  so restarts don't lose it), fed by DC core events:
  - new follower: securejoin inviter success → `type: follow`
  - reply: incoming message whose quote resolves to an own message →
    `type: mention` (closest Mastodon analog; carries the status)
  - boost of your post: incoming empty-text message quoting an own message →
    `type: reblog`
  - reaction on your message: `IncomingReaction`-style event → ❤ becomes
    `type: favourite`, others `pleroma:emoji_reaction` with `emoji` field
- `GET /api/v1/notifications` returns them newest-first with Mastodon
  notification JSON (id, type, created_at, account, status where relevant);
  supports `limit` and `max_id`/`since_id` pagination minimally.
- Frontend polls this already; no streaming needed for v1.

## Acceptance Criteria

- After a follower joins, a reply arrives, and a reaction lands, the
  notifications page shows all three with sensible rendering.
- Unit tests: event → notification derivation with a fake event source;
  endpoint pagination.
