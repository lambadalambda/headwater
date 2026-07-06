# 38 Fix thread rail continuity

## Summary

Port the latest thread rail geometry from the handoff so ancestor rails visually connect into the focused post without the current gap.

## Requirements

- Add the latest `.thread-line::after` bridge behavior to continue the rail across ancestor spacing.
- Align `.thread-line-top` with the bridged ancestor rail using the updated left offset.
- Verify the change across threads with one ancestor, multiple ancestors, content warnings, media attachments, and mobile layouts.
- Preserve current ancestor reply support and inline composer placement.

## Acceptance Criteria

- The rail between ancestors and the focused post has no visible break in the real thread route.
- Thread route visual/DOM tests cover the bridged rail and remain green on mobile.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/styles.css` thread section.
- The latest handoff also shifts `.thread-line-top` from `left: 44px` to `left: 39px`.
