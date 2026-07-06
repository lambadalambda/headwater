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
