# 04 Build home timelines and composer

## Summary

Implement the home, local, and federated timeline views with the composer, post list, and home right-rail cards.

## Requirements

- Build timeline tabs for Home, Local, and Federated.
- Build the composer with textarea, image, GIF, poll, emoji, content-warning, privacy selector, character count, and Post button.
- Ensure composer controls wrap or compress without overflowing at narrower widths.
- Build post cards with avatar, display name, handle, timestamp, body, optional media, reply, boost, favorite, and more actions.
- Add right rail cards for trends, who to follow, shortcuts, and instance status.
- Use mocked backend data for default tests.

## Acceptance Criteria

- A Playwright test starts with an empty composer, types text, enables the Post button, submits, and sees the new post at the top.
- Reply, boost, and favorite controls update local UI state in mocked tests.
- Suggestion handles truncate instead of overflowing.
- Composer toolbar and Post button remain usable on desktop, tablet, and mobile viewports.

## Notes

- This issue can use local mock data first. Real Pleroma API wiring belongs in the API issue unless needed earlier.
