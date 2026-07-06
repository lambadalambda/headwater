# 58 Remove the header timeline strip

## Summary

Timeline navigation is tripled on desktop: the header strip (HOME · LOCAL · FEDERATED · EXPLORE), the sidebar nav, and the timeline tabs on the feed card. The header strip is pure duplication — it only renders on desktop where the sidebar is fully visible, and it is already hidden on mobile. Remove it; the sidebar stays canonical and the feed tabs stay because they host the new-posts indicator and filters and are the always-visible switcher on mobile.

## Requirements

- Remove the `app-primary-nav` markup from the app shell and the `primaryNavItems` derived list.
- Remove the associated CSS (base rules and the mobile `display: none` override).
- Update tests that navigated via the header strip to use the sidebar instead.

## Acceptance Criteria

- No `app-primary-nav` / `primaryNavItems` references remain.
- Shell tests assert the strip is gone and cover the sidebar navigation path.
- `pnpm run check`, affected suites, full suite, and `git diff --check` pass.

## Notes

- Decided with the user on 2026-07-06 after reviewing the three nav locations.
- The user notes the Explore section is generally underbaked (some backend features for it don't exist); that's a separate future discussion, not part of this issue.

## Current Status

Done (2026-07-06, commit 07e2b69). Removed the `app-primary-nav` markup and `primaryNavItems` from the app shell, dropped the associated CSS (base rules plus the mobile hide), and tightened the header grid from four columns to three (brand · spacer · right controls). Tests that navigated via the header strip now use the sidebar, and the shell test asserts the strip is gone while covering sidebar links for Home/Local/Federated/Explore. Verified visually against fediffusion.art: brand left, search/bell/avatar right, sidebar and feed tabs unchanged. Full suite 303 passing.
