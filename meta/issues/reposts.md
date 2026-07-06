# Reposts (boosts)

## Summary

Boosting = publishing someone's post to your own followers. DC forwards drop
the original sender (by design), so boosts use the quote mechanism instead:
an empty-text post in your feed quoting the original.

## Requirements

- `POST /api/v1/statuses/:id/reblog` → transport posts empty-text message to
  own feed with `quotedMessageId = :id`; returns a status whose `reblog`
  embeds the original.
- Status mapping: empty text + resolvable quote → render as reblog (`reblog`
  set, `content` empty); unresolvable quote → plain status showing quoted
  text.
- `POST /api/v1/statuses/:id/unreblog` deletes your boost message
  (`deleteMessagesForAll` so followers drop it too) — find own feed message
  quoting :id.
- `reblogged` flag + `reblogs_count` where derivable from own/known feeds.

## Acceptance Criteria

- Boost from the timeline UI → follower's node shows "X boosted" with the
  original post content and author when it has the original message.
- Unit tests for reblog mapping and endpoints with fake transport.
