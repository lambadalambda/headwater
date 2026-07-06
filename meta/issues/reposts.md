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

## Current Status (2026-07-06)

Implemented. `buildBoostText`/`parseMarkers` in `src/protocol.ts` (boost
marker must be the *entire* text to parse, or it's treated as plain body —
round-trip tested). `POST /api/v1/statuses/:id/reblog` posts the marker +
a 500-char-capped quotedText to the own feed and returns a *new* status
wrapping the original as `reblog` with `reblogged: true` — matching real
Mastodon's asymmetric shapes (reblog returns a new wrapper status;
unreblog returns the original with `reblogged: false`), since the issue
text didn't fully disambiguate this and PleromaNet speaks the Mastodon API.
`unreblog` finds our own boost msgId for the target's mid via
`store.ownBoostMsgId` and deletes it with a new `Transport.deleteMessage`
(`rpc.deleteMessagesForAll`). `messageToStatus` maps a boost marker to
`status.reblog`: resolved mid → the real embedded status (recursively
mapped); unresolved → synthesized from `parseQuotedAuthor(msg.quote?.text)`
+ the marker's addr, with a synthetic id-`"0"` account. `reblogs_count`/
`reblogged` come from the store's boost tallies, keyed by the post's own
mid — "authoritative only for what this node has seen," as noted above.
Covered by `tests/protocol.test.ts`, `tests/entities.test.ts` (resolved +
synthesized reblog mapping), and `tests/server.test.ts` (reblog/unreblog
endpoints + a synthesized-boost-from-a-follower case). See
`../../DEVLOG.md` 2026-07-06 "replies/threads + reposts". Not archiving per
instructions.
