# 45 Wire focused post follow button

## Summary

The thread focused-post header renders a static Follow/Following button (`FocusedPost.svelte`) with no click handler and no real relationship state — it shows "Follow" even on the viewer's own posts. Wire it to the relationship state and mutations now available from issue 24, or hide it until wired.

## Requirements

- Per user decision on 2026-07-02: remove the button entirely — a follow control in the thread header duplicates the profile page's follow flow and reads as noise there.
- Remove the now-unused `following` fields from the focused-post prop shapes.

## Acceptance Criteria

- The thread focused post renders no follow affordance for any author.
- Covered by a mocked assertion in `app-thread.e2e.ts`.

## Notes

- Observed during live testing against fediffusion.art on 2026-07-02: sophia's own thread page showed an inert "Follow" button.
- The canonical `thread.jsx` handoff does include this button; removing it is a deliberate deviation requested by the user. Following happens on profile pages (one click away via the focused post's name/handle).

## Current Status

- Done: the button and the dead `following` prop fields are removed from `FocusedPost.svelte`, the app thread view, and the design-system thread demo types; `app-thread.e2e.ts` asserts no Follow affordance renders on the focused post. The `Button variant="follow"` primitive itself remains in use by suggestion cards and the design-system Controls specimen.
