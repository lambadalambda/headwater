# 10 Add responsive and regression test coverage

## Summary

Add deterministic Playwright infrastructure and baseline responsive regression coverage for the current signed-out, design-system, and `/mockup` prototype surfaces.

## Dependencies

- Completed issues 01-09.

## Requirements

- Define the default Playwright organization for deterministic tests, preserving the current colocated `.e2e.ts` route-test pattern unless a smaller change clearly justifies a new shared test directory.
- Add shared Playwright helpers for viewport presets and horizontal-overflow assertions.
- Use explicit responsive fixtures for desktop around `1280px`, medium around `1000px`, tablet around `880px`, and small mobile around `390px`.
- Cover signed-out landing, design-system, and current `/mockup` prototype shell behavior with route-agnostic selectors that can survive later route extraction.
- Add assertions for known layout risks: composer overflow, who-to-follow handle truncation, hidden right rail, mobile drawer, mobile sheet, and bottom tab behavior.
- Keep this issue focused on default test coverage that runs without Docker or a live Pleroma instance.

## Acceptance Criteria

- Default Playwright tests run headlessly and deterministically without Docker.
- Responsive tests cover desktop, medium, tablet, and small mobile breakpoints.
- `mise run test` and `pnpm test` both continue to run only the deterministic default suite.
- Regression assertions document the known layout risks they protect.
- Existing `/mockup` route behavior and tests continue to pass.
- Tests added here avoid coupling to `/mockup` implementation internals where shared components or stable accessible selectors can be used instead.

## Notes

- Dockerized Pleroma integration coverage is split into issue 15.
