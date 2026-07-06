# 20 Wire favorite and boost status actions

## Summary

Connect favorite and boost status actions to Pleroma API mutations with optimistic UI and rollback.

## Dependencies

- 16 Wire authenticated home timeline.
- 17 Add cursor-based timeline pagination.

## Requirements

- Wire favorite, unfavorite, boost, and unboost buttons to API methods.
- Favorite and boost actions use optimistic local updates with rollback on API error.
- Reconcile counts and action state with the server response when it is returned.
- Preserve stable status-id targeting across paginated timeline pages.

## Acceptance Criteria

- Favorite/boost action success updates counts and action state immediately and reconciles with the mocked server response.
- Failure restores the prior UI state and shows a scoped error or non-disruptive recovery affordance.
- Actions still target the correct status after pagination merges from issue 17.
- 401/403 responses trigger the global behavior established by issue 11.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Notes

- Reply submission is handled by issue 21 using the status creation boundary from issue 19.
