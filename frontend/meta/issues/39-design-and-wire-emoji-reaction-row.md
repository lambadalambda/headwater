# 39 Design and wire emoji reaction row

## Summary

Add Pleroma emoji reactions to post rendering, guided by the newly imported reaction and postmark variant pages.

## Requirements

- Add typed Pleroma adapter support for status emoji reactions, including unicode emoji and custom emoji shortcodes/assets when present.
- Choose a stable canonical reaction-row direction from `reaction-variants.jsx` and `postmark-variants.jsx` before implementation.
- Render reaction rows in shared post surfaces without disrupting reply, boost, favorite, media, content warning, and thread layouts.
- Support viewer-selected reactions distinctly from other reactions.
- Provide an add-reaction affordance shape even if the first pass keeps submission mocked or deferred.

## Acceptance Criteria

- Mocked Pleroma statuses with emoji reactions render a reaction row in home timeline, thread, and design-system specimens.
- Custom emoji reactions can render with accessible names/alt text.
- Existing post action tests continue to pass, and focused tests cover reaction-row layout and selected-state behavior.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/reaction-variants.jsx`, `reaction-variants.css`, `postmark-variants.jsx`, and `postmark-variants.css`.
- The current application only handles emoji reactions as an unknown notification type; status-level reaction rows are not wired yet.

## Current Status

- Done: chose the V3c letterpress direction (marked RECOMMENDED in `postmark-variants.jsx`). `PostReactions.svelte` renders warm-cream perforated stamps with count captions below, viewer-selected accent paper, custom emoji images with `:shortcode:` alt text, and a disabled add-reaction affordance (picker deferred).
- Done: `pleroma.emoji_reactions` is typed and adapted (`adaptStatusReactions`); rows render on home timeline, public timelines, thread focused posts, profile posts, and a design-system specimen in the Posts slab.
- Done beyond first-pass scope: clicking a stamp toggles the reaction through `PUT`/`DELETE /api/v1/pleroma/statuses/:id/reactions/:emoji` with optimistic update, rollback + inline error on failure, and server reconciliation.
- Covered by tests in `home-timeline.e2e.ts`, `app-thread.e2e.ts`, `design-system.e2e.ts`, and `ui.e2e.ts`.
- Deferred: the add-reaction emoji picker popover (affordance renders disabled with a title explaining it is not wired yet).
