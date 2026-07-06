# 47 Fix emoji picker scrolling and unicode sets

## Summary

Two emoji picker problems: long emoji lists cannot be scrolled (the grid is clipped by the picker's `overflow: hidden` because the `1fr` grid row grows to content height instead of being constrained), and the default unicode sets are placeholder dingbats ("Smileys": ☺ ☹ ☻ ♡ ☆ ☾, "Symbols": ✦ ✧ ✶ ※ ◌ ◷) instead of the canonical emoji groups from the handoff's `emoji-data.jsx`.

## Requirements

- Long lists (large custom emoji packs, unicode groups) must scroll inside the picker grid; the picker keeps its 420px design height.
- Keyboard navigation must keep the selected cell visible (scroll it into view) and move by the grid's real column count.
- Replace the placeholder unicode sets with the canonical five groups from `meta/design/claude-handoff/project/emoji-data.jsx`: Smileys & people, Animals & nature, Food & drink, Travel & places, Objects & tech, with their full item lists.
- Update the design-system picker specimen and recents fallbacks to use real emoji instead of dingbats.
- Sidebar entries for unicode groups should be distinguishable (the handoff hardcodes ☺ for every group; use each group's first emoji instead — noted deviation).

## Acceptance Criteria

- A mocked large custom emoji pack renders a scrollable grid (content taller than the viewport area) and the last emoji can be reached and seen via keyboard navigation.
- The picker sidebar lists the five canonical unicode groups; picking an emoji from one inserts it into the composer draft.
- Existing emoji picker, composer, and design-system tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Canonical sources: `meta/design/claude-handoff/project/emoji-data.jsx` (groups/recents) and `emoji-picker.jsx` (behavior).
- Reported by the user on 2026-07-02.

## Current Status

- Done: the picker now has a definite 420px height with `minmax(0, 1fr)` grid rows, so long grids scroll inside `.ep-grid` instead of being clipped; keyboard navigation moves by the grid's real column count and scrolls the selection into view.
- Done: the placeholder dingbat sets were replaced with the canonical five unicode groups from `emoji-data.jsx`; sidebar entries use each group's first emoji as their icon (deviation from the handoff's uniform ☺, for legibility across five groups); recents fallbacks use real emoji.
- Done: custom emoji now group into their real Pleroma packs (from `pack:<name>` tags/category on the manifest, verified against a live instance) instead of one flat "custom" pack, and `visible_in_picker: false` emoji are excluded from composer surfaces.
- Covered by a new scrolling/groups test in `home-timeline.e2e.ts` (60-emoji pack, canonical group labels, End-key reachability, unicode insertion) plus the existing picker suites (268 tests green).
