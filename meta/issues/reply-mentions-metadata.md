# Replies lack in_reply_to_account_id and mentions

## Summary

Reply statuses carry `in_reply_to_id` but `in_reply_to_account_id` is always
null and `mentions` is always empty — so the frontend can't render the
"REPLYING TO @x" chips on reply posts.

## Requirements

- When a status's reply marker resolves to a known parent message, the
  mapping fills:
  - `in_reply_to_account_id`: the parent sender's contact id (string)
  - `mentions`: a Mastodon Mention entry for the parent's author:
    `{id, username, acct, url}` (same values as the account mapping)
- Unresolvable parents keep null/[] as today.
- At most one extra message resolution per reply status (reuse the existing
  resolveMessage machinery used for reblog embedding).

## Acceptance Criteria

- A reply in the timeline/thread shows the replying-to chip in the UI
  (given the frontend renders from these fields — verify).
- Unit tests: mapping fills both fields for resolvable parents, leaves
  null/[] otherwise.
