# Likes (favourites) via reaction DMs

## Summary

Read-only broadcast members can't use native reactions (DEVLOG 2026-07-06).
Likes are control DMs to the post's author per the wire convention; the ❤
emoji is the favourite.

## Requirements

- Wire format: DM to author, text `❤ ↳ <rfc724Mid>` (+ `quotedText` excerpt
  for vanilla DC); retraction `✖ ↳ <rfc724Mid> ❤`.
- `POST /api/v1/statuses/:id/favourite` / `unfavourite`: resolve mid, send
  the control DM (self-posts: skip DM, update store directly), record own
  reaction in the store, return the updated status.
- Ingest: incoming control DMs update the reaction tally for the referenced
  mid; control DMs never render in timelines (DMs already excluded) and the
  1:1 chats they create are acceptable v1 noise.
- Status mapping: `favourites_count` = ❤ tally from store,
  `favourited` = own ❤ present.
- Documented limitation: counts are only authoritative on your own posts
  (only the author receives everyone's reaction DMs).

## Acceptance Criteria

- Favouriting in the UI fills the star and bumps the count; the author's
  node shows the like on their post and (with notifications issue) notifies.
- Unit tests: control-message build/parse, store tally, endpoints, mapping.
