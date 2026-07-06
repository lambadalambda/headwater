# 19 Wire status creation and composer

## Summary

Connect composer status creation to the Pleroma API with server-confirmed insertion and draft-preserving failures.

## Dependencies

- 11 Add reactive auth state and session lifecycle.
- 12 Add Pleroma UI adapters and request-state components.
- 16 Wire authenticated home timeline.

## Requirements

- Add typed API client support for `POST /api/v1/statuses` with text, visibility, content warning, and optional reply parent.
- Wire timeline composer submission to status creation.
- Status creation uses server confirmation before inserting the returned status because the server assigns the canonical id and response fields.
- Preserve drafts on submission failure.
- Keep media upload, polls, and custom emoji out of scope.

## Acceptance Criteria

- Playwright tests mock status creation success and failure.
- On success, the server-returned status appears in the timeline.
- On failure, composer text is preserved and an inline error is displayed.
- Visibility and content warning values serialize correctly.
- Reply-parent API support is tested at the client/boundary level; thread-route reply integration belongs to issue 21.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Completed: `createStatus` serializes status text, visibility, content warning text, and `in_reply_to_id`.
- Completed: the home composer submits through Pleroma, inserts the server-returned status on success, and preserves draft text with an inline error on failure.
- Completed: reply-parent creation is covered by client tests and inline reply route tests.

## Notes

- Favorite and boost mutations are split into issue 20.
