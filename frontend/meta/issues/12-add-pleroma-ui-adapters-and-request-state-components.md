# 12 Add Pleroma UI adapters and request-state components

## Summary

Bridge typed Pleroma API responses into stable UI view models and shared loading, empty, error, and retry patterns.

## Dependencies

- 09 Wire Pleroma API client and auth boundaries.

## Requirements

- Add pure adapter functions for converting `PleromaStatus` and related API types into plain TypeScript UI view models consumed by timeline/thread components.
- Preserve Pleroma-specific fields where the UI needs them; do not add Mastodon compatibility abstractions.
- Add reusable request-state UI components for loading, empty, error, retry, and success rendering.
- Normalize `PleromaClientError` display so network, auth, rate-limit, and server failures are distinguishable.
- Use `src/lib/pleroma/fixtures.ts` as the shared source for mocked Pleroma responses unless a test needs a focused local variant.
- Keep adapters independent from Svelte components and side effects.

## Acceptance Criteria

- Adapter tests cover normal statuses, reblogs, long remote handles, content warnings, missing media/avatar values, and Pleroma plain-text content fields.
- A request-state component or pattern renders deterministic loading, empty, retryable error, auth-required, and success states.
- At least one design-system or fixture-backed surface demonstrates adapted Pleroma fixture data.
- Tests prove retry callbacks are invoked and auth errors produce a distinguishable re-auth-required state; route-level redirect behavior belongs to issue 13.
- Request-state UI uses Svelte 5 patterns and avoids legacy `$:`, `createEventDispatcher`, and `<slot>` application code.
- Existing `/mockup` behavior remains unchanged.
- No default test requires Docker or a live Pleroma instance.

## Notes

- This issue should land before broad API wiring so each route does not invent its own mapping and error UI.
