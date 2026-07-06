# Replies and threads via quote model

## Summary

Replying must work across feeds even though followers can't post into a
broadcast channel. Model: a reply is a post in YOUR OWN feed that quotes the
original message (Delta Chat quotes work cross-chat — the "reply privately"
feature relies on it — and carry email `References`, so receivers who have
the original get a resolvable link; others see quoted text).

## Requirements

- `POST /api/v1/statuses` with `in_reply_to_id` posts to own feed with
  `quotedMessageId` set (transport.post gains options).
- Status mapping derives `in_reply_to_id` from `msg.quote` (kind
  `WithMessage` → messageId). Stop using `parentId` (it points at securejoin
  system messages sometimes).
- When the quote is unresolvable (`JustText`), render the quoted text via
  `pleroma.quote`-style fallback or prefix — degrade, don't break.
- `GET /api/v1/statuses/:id/context`: ancestors by walking the quote chain;
  descendants by scanning known messages whose quote resolves to :id
  (bounded scan over feed chats is fine for v1).
- `replies_count` on statuses where cheaply derivable (optional).

## Acceptance Criteria

- Reply from the UI to a followed post → appears threaded (context endpoint
  returns the parent as ancestor); on a follower's node that has both
  messages, the linkage resolves.
- Unit tests for mapping (quote → in_reply_to_id) and context assembly with
  a fake transport.

## Notes

- Verify cross-chat `quotedMessageId` behavior experimentally before
  building on it (see experiment findings in DEVLOG once run).
