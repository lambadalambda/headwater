# 13 Extract authenticated app shell into guarded real routes

## Summary

Extract the authenticated shell from the monolithic `/mockup` prototype into reusable real routes and apply the auth boundary from issue 11.

## Dependencies

- 10 Add responsive and regression test coverage.
- 11 Add reactive auth state and session lifecycle.
- 12 Add Pleroma UI adapters and request-state components.

## Requirements

- Create a real authenticated route group or equivalent structure for app routes.
- Extract shared app shell chrome: header, left navigation, right rail slot/region, mobile drawer, mobile sheet, and bottom navigation.
- Add real paths for home timeline, public timeline, local/federated timeline selection, explore, settings, thread detail, profiles, and notifications, even if some initially render placeholders or fixture-backed content.
- Route navigation should use SvelteKit paths rather than local `activeView` toggles.
- Apply route guards using the auth boundary from issue 11.
- Redirect authenticated users away from `/` to the first real app route and update OAuth callback success navigation to that route.
- Keep `/mockup` intact during the transition so existing prototype tests and visual reference remain available.

## Acceptance Criteria

- Browser back/forward navigation works between extracted routes.
- Deep links to extracted routes render the app shell and correct placeholder or fixture-backed content without full page reload.
- Signed-out users are redirected away from authenticated routes according to the policy from issue 11.
- Every extracted real route has deterministic mocked Playwright coverage that does not require Docker or a live Pleroma instance.
- Desktop, medium, tablet, and mobile shell layouts have deterministic tests.
- Existing `/mockup` tests continue to pass.
- No horizontal overflow is introduced by the extracted layout.

## Notes

- Keep this issue focused on routing, shell extraction, and route guards, not full API data wiring.
