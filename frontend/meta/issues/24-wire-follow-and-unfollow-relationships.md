# 24 Wire follow and unfollow relationships

## Summary

Connect follow and unfollow controls to Pleroma relationship mutations across profile and discovery surfaces.

## Dependencies

- 11 Add reactive auth state and session lifecycle.
- 20 Wire favorite and boost status actions for the optimistic rollback pattern.
- 22 Wire profile display and account statuses.

## Requirements

- Wire follow and unfollow buttons to typed API methods.
- Use an optimistic update with rollback on failure unless the server response requires a requested/following distinction.
- Represent relationship states such as following, requested, blocked, and unauthenticated clearly.
- Reuse behavior across profile pages and any existing suggestion/discovery cards that expose follow actions.

## Acceptance Criteria

- Tests cover follow success, unfollow success, requested follow state, mutation failure rollback, and unauthenticated sign-in prompt.
- Server-returned relationship state reconciles the UI after optimistic updates.
- 401/403 responses trigger the global behavior established by issue 11.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Done: profile follow buttons call `followAccount`/`unfollowAccount` with an optimistic state (requested for locked accounts), reconcile with the returned relationship, roll back with an inline error on failure, and sign out on 401/403. Search/discovery cards were already wired through `toggleSearchFollow` with server reconciliation.
- Done: relationship states (stranger/following/mutual/requested/blocked/self) are modeled in `PleromaProfileFollowState` and rendered across profile and search surfaces; signed-out visitors see sign-in prompts instead of follow controls.
- Covered by follow/unfollow/requested/rollback/401/signed-out tests in `src/routes/app-profile.e2e.ts`.

## Notes

- Keep relationship modeling Pleroma-specific; do not add broad compatibility abstractions.
