# Emoji reactions

## Summary

Pleroma-style emoji reactions map 1:1 onto DC reactions (minus ❤, which is
reserved for favourites).

## Requirements

- `PUT /api/v1/pleroma/statuses/:id/reactions/:emoji` and
  `DELETE .../reactions/:emoji` (frontend already calls these).
- DC allows one reaction per user per message — replacing an existing
  reaction is acceptable v1 behavior; note it in DEVLOG.
- Status mapping fills `pleroma.emoji_reactions`
  (`{name, count, me}` groups from `msg.reactions`, excluding ❤).

## Acceptance Criteria

- Adding a reaction from the timeline reaction picker shows it on the post
  row; a second account's reaction increments the count where DC delivers it.
- Unit tests for grouping/mapping and both endpoints.
