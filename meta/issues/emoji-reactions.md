# Emoji reactions

## Summary

Same mechanism as likes (reaction control DMs), for arbitrary emoji; ❤ is
reserved for favourites.

## Requirements

- `PUT /api/v1/pleroma/statuses/:id/reactions/:emoji` and `DELETE` variant
  (frontend already calls these) → reaction control DM as in the likes
  issue, with the given emoji.
- Status mapping fills `pleroma.emoji_reactions` (`{name, count, me}`)
  from the store tally, excluding ❤.
- Multiple distinct emoji per user per post are allowed at this layer (it's
  our own convention); keep the store shaped accordingly.

## Acceptance Criteria

- Reacting from the picker shows the reaction chip with `me: true`; the
  author's node shows it too after delivery.
- Unit tests for grouping/mapping and both endpoints.

## Current Status (2026-07-06)

Implemented, sharing the like/favourite mechanism end to end.
`PUT`/`DELETE /api/v1/pleroma/statuses/:id/reactions/:emoji` in
`daemon/src/server.ts` (the `:emoji` route param is `decodeURIComponent`'d)
use the same `reactToStatus` helper as favourite/unfavourite, just with an
arbitrary emoji instead of the fixed ❤. The store
(`daemon/src/store.ts`) shapes reactions as `mid -> reactorAddr -> emoji[]`
so one reactor can apply several distinct emoji to the same post, per the
issue. `pleroma.emoji_reactions` mapping
(`daemon/src/mastodon/entities.ts`) excludes ❤ (favourite-only) and computes
`me` per emoji from the resolver's own address. Incoming emoji reaction DMs
on our own posts become `pleroma:emoji_reaction` notifications (with an
`emoji` field) via `daemon/src/ingest.ts`. See `../../DEVLOG.md` for the
full write-up. Tests: `daemon/tests/protocol.test.ts`, `store.test.ts`,
`ingest.test.ts`, `entities.test.ts`, `server.test.ts`.
