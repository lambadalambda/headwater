# 03 Build authenticated app shell and responsive navigation

## Summary

Build the signed-in application shell with the header, left navigation, contextual right rail, user menu, theme switcher, and responsive mobile navigation.

## Requirements

- Add a top header with brand mark, PleromaNet wordmark, primary navigation, search, notifications, and user chip.
- Add a left sidebar with profile mini card, navigation items, settings sub-navigation, and footer card.
- Add a right rail that changes by view and hides when the layout becomes too tight.
- Add a user dropdown with profile summary, stats, personal navigation, theme swatches, settings links, switch account, and sign out.
- Add mobile behavior: hamburger drawer for left nav, bottom sheet for contextual right rail content, and bottom tab bar for primary mobile navigation.
- Keep the right rail hidden below the tablet/medium breakpoint so composer content has enough room.

## Acceptance Criteria

- App shell renders correctly at wide desktop, medium desktop, tablet, and small mobile widths.
- Header, drawer, bottom sheet, bottom tabs, user dropdown, and theme switching are covered by Playwright tests with mocked state.
- Keyboard and pointer interactions close overlays predictably.
- No horizontal overflow occurs in the app shell at supported viewport widths.

## Notes

- Prototype breakpoints to consider: right rail hidden below about 1180px, mobile layout below about 880px, compact mobile refinements below about 480px.
