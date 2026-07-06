# 26 Wire trends and instance metadata

## Summary

Replace mocked trend and instance metadata panels with Pleroma API-backed data where the server supports it.

## Dependencies

- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Wire trends to `getTrendingTags`.
- Wire instance metadata cards to `getInstance`.
- Handle unavailable, disabled, or empty trend data gracefully.
- Preserve curated/design-specific discovery cards only where no Pleroma endpoint exists.

## Acceptance Criteria

- Tests mock `/api/v1/trends/tags` and `/api/v2/instance`.
- Trend and instance panels cover loading, success, empty, disabled/unavailable, and error states.
- Missing trends or feature-disabled responses degrade to clear UI copy rather than broken panels.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Done: the authenticated app right rail loads trend tags from `getTrendingTags({ limit: 5 })`.
- Done: instance metadata uses `getInstance` for both the rail card and composer status character limit.
- Done: trend and instance metadata panels cover loading, success, empty, unavailable, and error states.

## Notes

- Do not add Mastodon compatibility layers; model Pleroma behavior directly and degrade where needed.
