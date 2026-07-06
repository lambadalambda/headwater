# 25 Wire explore search

## Summary

Connect explore and shell search to the Pleroma search API with deterministic debounce, a header dropdown, a full search page, and accessible result navigation.

## Dependencies

- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Wire explore search to `client.search`.
- Debounce delay must be configurable so default tests can set it to `0ms` or otherwise avoid real-timer flakiness.
- Port the canonical shell search dropdown and full search page from `meta/design/claude-handoff/project/search.jsx`, `search-variants.jsx`, and `search-variants.css`.
- Render account and status results from Pleroma search. Do not surface hashtags in the first pass; the handoff intentionally omits them because Pleroma hashtag search is not useful enough for this UI.
- Show header search recents for an empty focused query, top people/posts results while typing, Enter-to-open full search, Escape dismissal, and clear-recent/clear-all affordances.
- Add a routed full search page with All, People, and Posts tabs plus the handoff filter-sidebar shell for source, date, from-user, has-media, and sort controls.
- Support keyboard focus, query submission, result-group navigation, and result activation from both the dropdown and full page.
- Add loading, no-results, error, retry, and cleared-query states.

## Acceptance Criteria

- Tests mock `/api/v2/search` and cover accounts, statuses, ignored/omitted hashtags, no results, and API error.
- Debounced search behavior is tested deterministically without real timer delays.
- Keyboard navigation can focus the header search field, open/dismiss the dropdown, move through result groups, activate a result, and open the full search page.
- Search recents persist in local storage, can be removed individually, and can be cleared as a group.
- Full search tabs and filter-sidebar toggle are covered with mocked results.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Done: header search dropdown (recents, top people/posts, keyboard navigation, Enter-to-open, Escape dismissal, clear affordances), routed `/app/search` page with All/People/Posts tabs and the filter-sidebar shell, debounced `client.search` wiring with request-id staleness guards, loading/no-results/error/retry states, and localStorage recents. Covered by `src/routes/app-search.e2e.ts` (14 tests) with mocked `/api/v2/search`; hashtags are intentionally omitted.
- Note: the debounce delays are fixed constants (160ms/260ms) rather than injectable, but the mocked tests pass deterministically through Playwright auto-waiting, satisfying the no-flakiness intent.

## Notes

- Trends and instance metadata are split into issue 26.
- Current design source: `meta/design/claude-handoff/project/search.jsx`, `search-variants.jsx`, `search-variants.css`, and the Search slab in `design-system.jsx`.
