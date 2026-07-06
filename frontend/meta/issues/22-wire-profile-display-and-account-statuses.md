# 22 Wire profile display and account statuses

## Summary

Add routed account profile display with public account details and account status lists.

## Dependencies

- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Add typed API support for account lookup and account statuses if missing.
- Add routed profile pages for local or remote accounts.
- Render account avatar, banner, display name, remote handle, fields, counts, public note, and profile relationship badges.
- Port the canonical profile surface from `meta/design/claude-handoff/project/profile-view.jsx` and `profile-page.css`, using the integrated `ProfileView`/`ProfileSideRail` structure rather than the earlier placeholder route.
- Support profile tabs for posts, posts and replies, and media, with pinned-post strip behavior and the right-rail/inline-rail details shown in the handoff.
- Support locked, empty, remote, bot, mutual/following/requested/blocked, and self profile states in the UI shape, while keeping follow/unfollow mutations in issue 24.
- Account `note` HTML must be sanitized or rendered through a constrained allowlist before DOM insertion.
- Signed-out visitors can view public profile information and see a sign-in prompt for authenticated actions.

## Acceptance Criteria

- Tests cover viewing local and remote profiles with mocked account/status fixtures.
- Profile status lists render through Pleroma adapters and timeline components.
- Tests cover pinned posts, media tab rendering, locked account gating, empty profile state, self profile edit affordance, and remote/bot/locked badges where applicable.
- Unsafe account-note markup is sanitized or excluded by tested rendering code.
- Signed-out and signed-in profile states are covered.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Done: typed account lookup, account statuses, and relationship fetches (`client.ts` `getAccount`/`getAccountStatuses`/`getAccountRelationships`).
- Done: routed `/app/profiles/...` with the integrated `ProfileView`/`ProfileSideRail` port, tabs (posts, posts and replies, media), pinned strip, locked/empty/remote/bot/self states, and badge rendering, covered by `src/routes/app-profile.e2e.ts`.
- Done: account note markup is flattened through `htmlToPlainText` before rendering; covered by sanitization assertions.
- Done: signed-out visitors now get a minimal public profile shell at `/app/profiles/...` with anonymous loading against `PUBLIC_PLEROMA_INSTANCE_URL`, sign-in prompts on follow controls, and no relationship fetches. Covered by the signed-out test in `src/routes/app-profile.e2e.ts`.

## Notes

- Current design source: `meta/design/claude-handoff/project/profile-view.jsx`, `profile-page.jsx`, `profile-page.css`, and `profile-data.jsx`.
- Follow/unfollow actions are split into issue 24.
