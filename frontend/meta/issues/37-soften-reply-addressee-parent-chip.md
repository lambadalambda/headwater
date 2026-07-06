# 37 Soften reply addressee parent chip

## Summary

Update reply addressee chips to the latest canonical treatment. The parent addressee should no longer use a filled accent chip; it should use the same ghost fill as cc chips, with the reply glyph marking parent status.

## Requirements

- Update `PostPinged.svelte` and `.post-pinged-chip-parent` styles to match the latest handoff.
- Keep the first addressee visually identifiable as the direct parent via the glyph and ordering, not a bright filled chip.
- Update `/design-system` copy and specimens for parent-only, cc-list, and long cc-chain examples.
- Preserve full-handle titles and shortened visible handles.

## Acceptance Criteria

- Parent addressee chips use ghost styling with `var(--accent-ink)` text and `var(--accent-soft-2)` background.
- Parent and cc chips wrap cleanly on narrow screens.
- Focused Playwright coverage verifies the parent chip no longer uses the previous filled/accent/high-weight treatment.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/pinged-variants.jsx`, `pinged-variants.css`, `design-system.jsx`, and `styles.css`.
- This is a new handoff revision after issue 33 was completed.
