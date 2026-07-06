# 16 Wire authenticated home timeline

## Summary

Load the authenticated home timeline from the user's Pleroma server using the stored OAuth session.

## Dependencies

- 11 Add reactive auth state and session lifecycle.
- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Add or complete the real home timeline route in the authenticated app shell.
- Create the Pleroma client from the reactive auth session's `instanceUrl` and access token.
- Fetch the home timeline with `getHomeTimeline`.
- Render loading, empty, error, and retry states consistently with issue 12.
- Use signed-out redirect behavior from route guards instead of rendering an unauthenticated timeline state.

## Acceptance Criteria

- Authenticated tests inject a mocked session and intercept `/api/v1/timelines/home`.
- Signed-out users cannot access the home timeline route and are sent back to the landing/auth flow.
- Home timeline posts render through the Pleroma adapters and existing timeline components.
- 401/403 responses trigger the global behavior established by issue 11.
- The route remains responsive and preserves app shell behavior.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Notes

- This should be the first authenticated API-backed route after public timeline read coverage.
