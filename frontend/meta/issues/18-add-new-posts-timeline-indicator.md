# 18 Add new-posts timeline indicator

## Summary

Add a low-noise indicator for newer timeline posts without disrupting scroll position.

## Dependencies

- 16 Wire authenticated home timeline.
- 17 Add cursor-based timeline pagination.

## Requirements

- Add a configurable new-post check interval or injectable trigger for deterministic tests.
- Detect newer posts using `since_id`, `min_id`, or equivalent Pleroma-supported cursor behavior.
- Show a `New posts available` indicator rather than inserting posts immediately.
- Prepend new posts when the user activates the indicator.
- Merge newer posts without duplicates and without jumping the user's scroll position.

## Acceptance Criteria

- Tests cover showing the new-posts indicator, activating it, prepending new posts, deduping overlap, and preserving scroll position.
- Default tests override or inject the polling/check trigger without relying on real timers.
- New-post fetch errors do not break the existing timeline and are retryable or silently recoverable with documented behavior.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Notes

- Streaming can be a later issue after polling/check behavior is stable.
