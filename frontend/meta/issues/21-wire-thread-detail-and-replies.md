# 21 Wire thread detail and replies

## Summary

Load thread detail views from Pleroma status and context endpoints and integrate replies through the shared status creation boundary.

## Dependencies

- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.
- 19 Wire status creation and composer.

## Requirements

- Add a real route for status/thread deep links.
- Fetch the focused status with `getStatus` and context with `getStatusContext`.
- Render ancestors, focused status metadata, and descendants through Pleroma adapters.
- Build any required reply tree or grouping from flat context descendants.
- Thread reply composer invokes the shared status creation boundary from issue 19 with the focused status id as `in_reply_to_id`.

## Acceptance Criteria

- Tests mock `/api/v1/statuses/:id` and `/api/v1/statuses/:id/context`.
- Thread route handles loading, empty-descendant, error, retry, and missing-status states.
- Deep links render without needing prior timeline state.
- Reply submission includes the correct parent status id and updates the thread UI on success.
- When no browser history/referrer is available, back navigation routes to the home timeline.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Completed: the real thread route loads focused status and context from Pleroma and renders ancestors, focused status metadata, and descendant replies.
- Completed: inline reply submission sends `in_reply_to_id`, updates reply counts, inserts returned replies into the visible thread tree, and handles nested replies.
- Completed: direct thread deep links, missing status id, API error/retry, stale response, mobile layout, action failure paths, and empty-descendant behavior have route coverage.

## Notes

- The Pleroma context endpoint returns flat ancestor/descendant arrays; any tree-building should be a tested pure function.
