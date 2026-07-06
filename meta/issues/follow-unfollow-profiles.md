# Follow/unfollow from profiles + relationships

## Summary

Following works only via pasted invite links. Profiles need working
follow/unfollow buttons and truthful relationship state.

## Requirements

- Track which contact each followed feed (InBroadcast chat) belongs to;
  expose `transport.following(): {contactId, chatId, name}[]`.
- `GET /api/v1/accounts/relationships?id[]=…` returns real `following` state
  (id is a contact id).
- `POST /api/v1/accounts/:id/unfollow` → leave/delete that feed chat
  (blockChat or deleteChat — pick what actually stops delivery; note choice).
- `POST /api/v1/accounts/:id/follow`: without a known invite for that contact
  we cannot join — return 422 with a clear error pointing at invite links
  for v1 (the auto-invite-request convention is future work).
- `GET /api/v1/accounts/:id/statuses` returns that contact's messages from
  feed chats (real implementation replacing the `[]` stub).
- Account entities include `pleroma.relationship` where the frontend expects
  it.

## Acceptance Criteria

- Profile of a followed account shows "Following"; unfollow works and their
  posts stop appearing in new timeline fetches; profile shows their posts.
- Unit tests for relationships, unfollow, and profile statuses.

## Current Status (2026-07-06)

Implemented. `Transport.following()` (`daemon/src/transport/deltachat.ts`)
lists InBroadcast chats and resolves each one's owner contact; `unfollow()`
uses `blockChat` rather than `deleteChat`, deliberately — see the DEVLOG
entry below for why (`deleteChat`'s own doc comment says it doesn't block
the contact, so it wouldn't actually stop delivery/resurrection; there is
no broadcast "leave" RPC, only `leaveGroup` for `Group` chats).
`GET /api/v1/accounts/relationships`, `POST .../unfollow` (real),
`POST .../follow` (422, points at invite links), and a real
`GET /api/v1/accounts/:id/statuses` (backed by a new
`Transport.timelineFrom(contactId, query)`, special-cased for our own
contact id to read our own feed) are all in `daemon/src/server.ts`.
`contactToAccount` gained an optional `relationship` param
(`daemon/src/mastodon/entities.ts`) folded into `pleroma.relationship`.

**Open finding, not integration-tested** (per this task's scope,
`pnpm test:integration` was off-limits): the assumption that an InBroadcast
chat's `getFullChatById(...).contactIds` contains exactly the feed owner as
the only non-SELF contact is reasoned from RPC semantics/doc comments, not
verified against a real joined broadcast. Worth confirming with
`tests/integration/federation.test.ts` before relying on this in
production. See `../../DEVLOG.md` for the full write-up. Tests:
`daemon/tests/server.test.ts` (relationships, unfollow, follow-422, account
statuses); transport itself has no unit tests per project convention
(network-bound, covered by integration tests only).
