# Reposts (boosts)

## Summary

Native forwards drop the sender and cross-chat quotes are rejected (DEVLOG
2026-07-06), so boosts embed the original SSB-style via the wire convention:
a post in your own feed whose text is a boost marker and whose `quotedText`
carries the original content.

## Requirements

- Wire format: text = `♻ <rfc724Mid> <authorAddr>`, `quotedText` =
  `"<authorName>: <original text, capped ~500>"`.
- `POST /api/v1/statuses/:id/reblog`: build from the target message, post to
  own feed; return a status with `reblog` embedding the original.
- Status mapping: boost marker → `reblog` status. Resolvable mid → embed the
  real message's status; unresolvable → synthesize from quotedText +
  authorAddr (account with that acct, no id links).
- `POST /api/v1/statuses/:id/unreblog`: find own boost message for that mid,
  `deleteMessagesForAll`.
- `reblogged` + `reblogs_count` from the store's boost tracking (count of
  known boosts per mid; authoritative only for what this node has seen).

## Acceptance Criteria

- Boost from the timeline → follower sees "X boosted" with original content
  and author; works even when the follower doesn't have the original.
- Unboost removes it from followers' timelines.
- Unit tests: marker round-trip, reblog mapping (resolved + synthesized),
  endpoints with fake transport.
