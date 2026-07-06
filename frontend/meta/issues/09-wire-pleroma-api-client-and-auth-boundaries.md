# 09 Wire Pleroma API client and auth boundaries

## Summary

Create typed Pleroma-only API and OAuth boundaries that can replace mocked data incrementally.

## Requirements

- Target Pleroma directly and assume Pleroma-specific features are present.
- Add a typed API client layer for timelines, statuses, context/thread data, account profile, follow actions, favorites, boosts, trends/search where supported, and instance metadata.
- Add OAuth app registration, authorization URL generation, callback parsing, token storage, and sign-out boundaries suitable for an SPA/static app.
- Keep API-facing tests independent from a live backend by default.
- Add request/response fixtures for mocked Playwright tests.
- Keep any live Pleroma tests behind dockerized integration mise tasks.

## Acceptance Criteria

- API client functions are typed and isolated from Svelte components.
- Default tests mock network behavior and pass without Docker or a live Pleroma instance.
- Authentication state is represented without exposing passwords to PleromaNet.
- Errors, loading states, and unauthenticated states have test coverage.

## Notes

- API documentation: https://api.pleroma.social/
- Do not add Mastodon-compatibility abstractions unless they serve a concrete PleromaNet need.
