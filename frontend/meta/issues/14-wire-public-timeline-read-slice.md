# 14 Wire public timeline read slice

## Summary

Implement the first API-backed read-only vertical slice by loading public Pleroma timelines without requiring authentication.

## Dependencies

- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Add a public browsing route at the path established by issue 13, such as `/public` or `/timeline/public`.
- Use `getLocalTimeline` and/or `getFederatedTimeline` anonymously.
- Update the signed-out landing's public-browse affordance to reach the real public route.
- Use Pleroma UI adapters from issue 12 to render statuses through existing timeline components.
- Add loading, empty, error, and retry states.
- Keep all default tests mocked and independent from a live backend.

## Acceptance Criteria

- Public timeline route renders mocked Pleroma status fixtures through the real API client boundary.
- Tests cover successful local/federated timeline loading, empty timeline, API error with retry, and anonymous access.
- The route does not require an OAuth token.
- The route remains responsive at desktop, tablet, and mobile widths.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Notes

- This issue validates API client to adapter to component flow before authenticated routes depend on it.
