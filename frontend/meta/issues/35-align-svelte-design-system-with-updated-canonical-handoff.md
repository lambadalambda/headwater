# 35 Align Svelte design system with updated canonical handoff

## Summary

Bring `/design-system` back into parity with the updated canonical handoff after the component-level ports are complete.

## Dependencies

- 29 Port poll attachments from updated handoff.
- 30 Port composer CW and poll editor panels.
- 31 Port post content warning wrapper.
- 32 Port boosted post rendering.
- 33 Update reply addressee chips.
- 34 Port inline thread reply composer.

## Requirements

- Update `/design-system` section content to match `meta/design/claude-handoff/project/design-system.jsx` v2.4.58.
- Add the new Polls, Content warnings, Boosts, expanded Composer, expanded Reply addressees, and updated Thread specimens.
- Re-audit `/design-system` against the latest imported handoff from `~/Downloads/PleromaNet/`, now copied into `meta/design/claude-handoff/project/`.
- Reflect new canonical copy/specimens for reply addressee ghost chips and top-row boost attribution.
- Decide how to expose the newly imported `Pinged variants`, `Reaction variants`, and `Postmark variants` pages in Svelte, if at all.
- Replace hardcoded stale specimen labels and notes with the updated canonical labels and copy.
- Fix the sidebar shared-primitive count so it is not permanently `0 shared primitives`.
- Decide whether the new variant pages should remain only as canonical handoff references or be exposed through Svelte design-system specimens.

## Acceptance Criteria

- The Svelte `/design-system` section order and specimen set match the canonical handoff for stable shared primitives.
- Focused Playwright coverage asserts the newly added canonical specimen groups are present.
- Mobile `/design-system` coverage remains green with no horizontal overflow.
- `pnpm run check`, the design-system Playwright suite, and `pnpm test` pass.

## Current Status

- Completed: `/design-system` section order and stable specimen groups have been audited against `design-system.jsx` v2.4.58.
- Completed: the sidebar shared-primitive count is no longer hardcoded to `0 shared primitives`.
- Completed: composer, poll, content warning, boost, reply addressee, and thread copy/specimen notes match the latest canonical handoff for stable shared primitives.
- Completed: new `pinged-variants`, `reaction-variants`, and `postmark-variants` pages remain canonical references until a stable reaction/postmark direction is chosen.

## Notes

- Follow the project rule to port `/design-system` section by section from the JSX handoff and stop after each section for visual confirmation when doing substantial visual work.
- Source of truth: `meta/design/claude-handoff/project/design-system.jsx` and `meta/design/claude-handoff/project/design-system.css`.
- Decision: keep `pinged-variants`, `reaction-variants`, and `postmark-variants` as canonical handoff references for now. The stable reply addressee treatment is represented in `/design-system`; reactions remain deferred to issue 39.
