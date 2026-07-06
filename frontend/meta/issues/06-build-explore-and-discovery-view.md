# 06 Build explore and discovery view

## Summary

Implement the Explore view with search, curated topics, featured communities, discover feed, and contextual right rail.

## Requirements

- Build the Explore hero with decorative comet/planet motifs, title, subtitle, search input, and suggested tags.
- Add curated topic cards with vaporwave thumbnails and post counts.
- Add featured community cards with cover imagery, descriptions, member counts, and Join buttons.
- Add discover feed tabs for Popular, New, and Active.
- Add contextual right rail cards for quick search, who to follow, shortcuts, and extended instance status.
- Stack topics and communities cleanly on mobile.

## Acceptance Criteria

- Playwright tests cover search input rendering, feed tab switching, and Join button state with mocked data.
- The Explore layout matches the design direction at desktop and mobile widths.
- Decorative artwork does not block or reduce accessibility of search and navigation controls.

## Notes

- Real search/trending/community data can be mocked until the Pleroma API boundary is implemented.
