# 48 Render name emoji and media excerpts in secondary surfaces

## Summary

Live testing surfaced two rendering gaps in the notifications popover, with the same classes of bug in other secondary surfaces: custom emoji in display names render as raw `:shortcode:` text, and excerpts of media-only statuses come out empty (a bare quote mark).

## Requirements

- Notification actor names must render custom emoji images (accessible alt text), like post heads already do.
- Notification excerpts for statuses without text must fall back to a media placeholder (image/video/audio/poll aware, with counts) instead of an empty quote; notifications with nothing to excerpt hide the quote block.
- Apply the same media placeholder to search result snippets (dropdown and full page) for media-only statuses.
- Boost attribution rows and the attachment lightbox attribution must render display-name custom emoji.
- Surfaces already using RichText (post heads, quoted posts, search names, user menu, profile, focused posts) stay as they are.

## Acceptance Criteria

- Mocked notification with a custom-emoji display name renders the emoji image in the row names.
- Mocked favourite notification on an image-only status shows a media placeholder excerpt instead of an empty quote.
- Mocked search results and boost attributions cover the same behaviors.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Found on 2026-07-02 from a live screenshot of the notifications popover (raw `:opensuse:` etc. in names; empty quote under "favorited your post").

## Current Status

- Done: notification actors carry their account emojis and `NotifRow` renders names through RichText (covers both the header popover and the notifications page); boost attribution rows and the attachment lightbox attribution do the same.
- Done: `notificationPostRef` and search snippets (dropdown and full page) fall back to `mediaPlaceholderText` — `[image]`, `[2 images]`, `[video]`, `[audio clip]`, `[poll]` — for statuses without text; a notification whose status has nothing to excerpt hides the quote block.
- Audited as already correct: post heads, quoted posts, search result names, user menu/header chip, profile surfaces, focused posts (all use RichText).
- Covered by new tests in `app-notifications.e2e.ts`, `app-search.e2e.ts`, `home-timeline.e2e.ts`, and adapter unit tests in `ui.e2e.ts` (272 tests green).
