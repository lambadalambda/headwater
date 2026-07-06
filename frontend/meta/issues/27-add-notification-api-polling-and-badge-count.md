# 27 Add notification API polling and badge count

## Summary

Add authenticated notification API support, unread badge state, and a notification route using deterministic conservative polling.

## Dependencies

- 11 Add reactive auth state and session lifecycle.
- 13 Extract authenticated app shell into guarded real routes.
- 21 Wire thread detail and replies.
- 22 Wire profile display and account statuses.

## Requirements

- Add typed API client support, fixtures, and response types for Pleroma notifications.
- Add a real notifications route as the minimum notification surface; shell panels or sheets can link to it.
- Define notification unread semantics using Pleroma-supported fields/endpoints or a local last-seen fallback.
- Show unread notification count in the app shell without hardcoded values.
- Poll notifications every 60 seconds while authenticated, with the interval exposed as a configurable constant for tests.
- Render known notification types and handle unknown Pleroma-specific types gracefully.

## Acceptance Criteria

- Tests mock notification responses for mentions, follows, favorites, boosts/reblogs, and an unknown type.
- Badge count updates from mocked API data and hides or clears at zero.
- Mention and favorite notifications navigate to the source status thread; follow notifications navigate to the follower profile; unknown types stay on the notifications route.
- Polling stops or pauses when signed out.
- Mark-read or last-seen behavior is tested and persists according to the chosen unread model.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Notes

- Streaming notifications can be a later issue after polling behavior is stable.
