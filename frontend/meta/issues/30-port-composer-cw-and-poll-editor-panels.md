# 30 Port composer CW and poll editor panels

## Summary

Port the updated composer states for content warnings and poll creation into the Svelte composer surfaces.

## Requirements

- Replace the non-functional CW toolbar button with a toggled content-warning input panel.
- Replace the non-functional poll toolbar button with a toggled poll editor panel.
- Support 2-6 poll choices, add/remove choice controls, per-choice counters, duration selection, single/multiple voting selection, and hide-results-until-ended toggle.
- Keep the composer toolbar active states aligned with the updated handoff.
- Align CW and poll panel spacing with the latest handoff: panels sit flush inside the composer body instead of using the older `78px` left offset.
- Add/use the updated `--warn-ink` theme token for CW labels and folded CW text across light and dark themes.
- Preserve existing status creation behavior and instance character-limit behavior.
- Ensure composer state can produce the data needed by the Pleroma status creation API when backend poll/CW wiring is implemented.

## Acceptance Criteria

- `/design-system` shows the four canonical composer specimens: idle, with CW input, with poll editor, and CW plus poll together.
- The real home composer can toggle CW and poll panels without losing typed status text.
- Poll choices enforce the canonical 2-6 row constraints in UI state.
- Focused Playwright coverage verifies CW and poll panel toggling, add/remove choice behavior, and submit button disabled state remains correct.
- `pnpm run check` and affected Playwright tests pass.

## Current Status

- Partially done: the real home composer has the canonical CW input row wired to status creation; the poll button is still a visual control without an editor panel.
- Partially done: `/design-system` exposes the canonical idle and CW-input composer specimens, but the poll and CW-plus-poll specimens are still missing.
- New handoff delta: latest `styles.css` moves `.composer-cw` and `.composer-poll` margins to `4px 0 ...` and replaces hard-coded warning label color with `--warn-ink`.
- Related: status creation now serializes content warnings, but poll payload preparation remains unwired.

## Notes

- Source of truth: `meta/design/claude-handoff/project/home.jsx`, `meta/design/claude-handoff/project/design-system.jsx`, and `.composer-cw*` / `.composer-poll*` styles in `styles.css`.
- API submission of CW and polls can be completed in a follow-up if the current issue is kept to UI state and payload preparation.
