# 36 Port updated boost attribution row

## Summary

Port the latest canonical boosted-post treatment from the handoff. The old side-rail boost layout has been replaced by a full-height green left edge plus a horizontal top attribution row.

## Requirements

- Replace the current `.post-boost-rail` layout in `PostBoost.svelte` with the latest `.post-boost-attr` top-row structure from `meta/design/claude-handoff/project/components.jsx`.
- Update boost styles in `src/app.css` to match the latest `styles.css`: full-height `--good` left edge, top attribution row, mini booster avatar, booster name, handle, and time.
- Preserve boosted post behavior across normal posts, ancestors, replies, content warnings, and media attachments.
- Keep long booster names and handles from overflowing on desktop and mobile.

## Acceptance Criteria

- Boosted posts in the real app and `/design-system` use the top attribution row instead of the old side rail.
- Existing boosted-post Playwright coverage is updated to assert the new row anatomy and long-name behavior.
- Mobile boosted posts stay readable without horizontal overflow.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/components.jsx`, `styles.css`, and `boost-variants.jsx` V4e.
- This supersedes the completed V4d side-rail work from issue 32.
