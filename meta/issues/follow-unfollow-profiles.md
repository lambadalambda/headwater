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
