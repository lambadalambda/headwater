# Likes (favourites) via reactions

## Summary

Map Mastodon favourites onto Delta Chat message reactions with the ❤ emoji.

## Requirements

- `POST /api/v1/statuses/:id/favourite` → `sendReaction(accountId, :id, "❤")`;
  `POST /api/v1/statuses/:id/unfavourite` → clear own reaction (sendReaction
  with empty list per DC semantics).
- Status mapping reads `msg.reactions`: `favourites_count` = ❤ count,
  `favourited` = own ❤ present.
- Reactions in read-only broadcast channels must be verified experimentally;
  if recipients can't react in `InBroadcast` chats, document the limitation
  in DEVLOG and still wire everything up so it works where DC allows it.

## Acceptance Criteria

- Favouriting in the UI updates count + filled state after refetch; the
  author's node sees the reaction on their message where DC supports it.
- Unit tests: reaction→favourite mapping, endpoints call transport correctly.
