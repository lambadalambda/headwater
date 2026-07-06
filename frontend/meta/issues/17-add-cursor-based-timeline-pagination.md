# 17 Add cursor-based timeline pagination

## Summary

Support cursor-based timeline pagination and load-more behavior for API-backed timelines.

## Dependencies

- 14 Wire public timeline read slice.
- 16 Wire authenticated home timeline.

## Requirements

- Expose typed response metadata or cursor information from timeline API calls without leaking raw fetch details into Svelte components.
- Parse representative Pleroma pagination `Link` headers or otherwise preserve `max_id` / `min_id` cursors from responses.
- Add a paginated request-state helper or route-local pattern for accumulating timeline pages.
- Add a `Load more` affordance using the next cursor.
- Merge pages without duplicate statuses and preserve stable status ids/data attributes for later actions.

## Acceptance Criteria

- Client or helper tests prove `Link` headers are converted into next/previous cursor data.
- Timeline tests cover loading the next page, deduplicating overlapping results, and load-more error retry.
- Empty, loading-more, and load-more-error states are visible and retryable.
- Pagination keeps stable status-id references so issue 20 actions can target the correct status across page boundaries.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Notes

- New-post polling/indicator behavior is split into issue 18.
