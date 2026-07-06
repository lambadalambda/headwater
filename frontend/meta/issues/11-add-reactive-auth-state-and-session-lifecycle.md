# 11 Add reactive auth state and session lifecycle

## Summary

Create a Svelte 5 auth state boundary that exposes OAuth session state reactively without depending on real app routes that do not exist yet.

## Dependencies

- 09 Wire Pleroma API client and auth boundaries.

## Requirements

- Add a reactive auth context/store for `PleromaAuthState` that initializes from browser storage on the client.
- Keep raw storage helpers in `src/lib/pleroma/session.ts` as low-level utilities; route and component code should consume the reactive boundary.
- Add explicit sign-out behavior that clears session and pending OAuth state.
- Define the global 401/403 policy as a concrete behavior, such as sign-out plus redirect to `/`, or a specific re-authentication affordance.
- Provide guard helper primitives that issue 13 can apply to real routes once they exist.
- Do not redirect authenticated users to a real app route in this issue; issue 13 owns real-route redirects after routes are created.

## Acceptance Criteria

- Auth state exposes `unauthenticated`, `authenticating`, and `authenticated` states reactively to components.
- Default tests mock storage and API boundaries and cover refresh restoration, sign-out, pending OAuth, and the selected 401/403 behavior.
- The auth boundary does not read browser storage during SSR; the SPA/static setup remains compatible with `ssr = false`.
- `/mockup` remains available and unguarded until the real routed app fully replaces it.
- No default test requires Docker or a live Pleroma instance.

## Notes

- Prefer a small rune/context module over ad hoc `localStorage` reads in components.
- Real route guards, landing redirects, and callback success navigation move into issue 13.
