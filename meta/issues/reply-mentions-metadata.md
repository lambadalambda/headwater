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

## Current Status

Implemented in `daemon/src/mastodon/entities.ts` (`messageToStatus` now
resolves the reply parent via the existing `resolveMessage` callback, same
one used for boost embedding, and fills `in_reply_to_account_id`/`mentions`
from the parent's `sender`) and `daemon/src/mapping.ts` (`toStatus` now
fetches the reply-parent message alongside the boosted message, deduped
through a small `resolvedById` map keyed by msgId so `resolveMessage` serves
both call sites — at most one extra `transport.message` fetch per reply
status, per the requirement).

Added `contactToMention` (mirrors `contactToAccount`'s id/username/acct/url)
and a `MastodonMention` type; `MastodonStatus.mentions` is now typed
`MastodonMention[]` instead of `unknown[]`.

**Self-mention decision:** unlike upstream Mastodon (which omits the
author's own mention from a self-reply's `mentions`), this implementation
*includes* the mention even when the parent author is SELF. Reasoning: the
frontend's chip-rendering code (`frontend/src/lib/pleroma/ui.ts`,
`ui.e2e.ts`) has no special-casing for self-authored mentions, replying to
your own thread should still show the "replying to @you" chip for clarity
in a small/DM-like network, and it keeps the mapping logic simpler (no
extra branch to special-case DC_CONTACT_ID_SELF). Noted here in case this
needs revisiting.

Recursion note: a boost embedding a reply reuses the same `resolveMessage`/
`resolvedById` map in the recursive `messageToStatus` call. If the boosted
message is itself a reply, its parent id is generally not in the map (only
the outer message's boost/reply mids were pre-fetched), so the embedded
reblog's own `in_reply_to_account_id`/`mentions` just falls back to
null/[] — no extra fetch, no unbounded recursion.

Tests: extended `daemon/tests/entities.test.ts` (resolvable parent fills
both fields; mid resolves but parent message doesn't load -> null/[];
mid doesn't resolve at all -> null/[], `resolveMessage` not even called;
self-reply still includes the mention) and `daemon/tests/server.test.ts`
(new test in the `timelines` describe: posts a reply to bob's message via
the fake transport, fetches the home timeline, asserts the reply status's
`in_reply_to_account_id`/`mentions` match bob's contact id/address).

`pnpm test` (403 tests) and `pnpm check` both green. Did not run `pnpm
test:integration` or touch `../frontend` or `data/`, per instructions. Not
archived — leaving open for whoever verifies the frontend chip renders
correctly end-to-end (acceptance criterion "given the frontend renders from
these fields — verify" is UI-side and out of scope for this daemon-only
pass).
