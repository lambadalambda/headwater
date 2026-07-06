# 28 Retire mockup prototype

## Summary

Remove the `/mockup` prototype once the corresponding real routes have deterministic coverage and the mockup no longer provides unique implementation value.

## Dependencies

- 13 Extract authenticated app shell into guarded real routes.
- 16 Wire authenticated home timeline.
- 21 Wire thread detail and replies.
- 23 Wire profile settings save.
- 25 Wire explore search.
- 27 Add notification API polling and badge count.

## Requirements

- Audit existing `/mockup` behavior against real routed app behavior.
- Move any still-useful mock data, fixtures, or component examples into stable design-system or test fixture locations.
- Delete the `/mockup` route only after equivalent real routes have deterministic mocked tests.
- Update or remove tests that targeted only `/mockup` internals.
- Keep the design-system route as the long-term visual reference for reusable primitives.

## Acceptance Criteria

- `/mockup` route and mockup-only tests are removed or replaced by real-route/design-system coverage.
- No navigation, docs, or tests link to `/mockup` after removal.
- Real routes cover shell, timeline, thread, explore, settings, profile, and notification flows with mocked default tests.
- `pnpm test` and `pnpm check` pass after removal.
- The repository no longer has duplicated mockup-only state management for app surfaces.

## Current Status

- Done: the `/mockup` route was already removed; the five skipped legacy e2e files (`explore`, `settings`, `shell`, `thread`, `timeline`) are now deleted, and no `src/`, `docs/`, or README references to `/mockup` remain.
- Done: real routes cover shell, timeline, thread, explore, settings, profile, search, and notification flows with deterministic mocked tests (`pnpm test`: 264 passed, 0 skipped) and `pnpm check` passes.
- Done: the README status section now describes the real Pleroma-backed app surface; `/design-system` remains the long-term visual reference.

## Notes

- Do not start this issue until real routes are stable enough that `/mockup` is maintenance drag rather than useful reference.
