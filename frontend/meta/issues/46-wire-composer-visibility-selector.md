# 46 Wire composer visibility selector

## Summary

The main composer's privacy control is a static "Public" button; every post is hardcoded to `visibility: 'public'`. Make it a working selector for Pleroma's four visibility levels and submit the chosen scope with status creation.

## Requirements

- Turn the composer privacy button into a dropdown menu with the four Pleroma scopes: public, unlisted, private (followers), and direct.
- Keep the handoff's button anatomy (icon + current label + chevron, label hidden on small screens) and reuse the app's existing dropdown-menu visual language.
- Selecting a scope updates the button label/icon and is submitted as `visibility` on `createStatus`.
- The menu must be keyboard-accessible (menuitemradio semantics, Escape dismissal) and close on outside click and selection.
- The selection stays sticky after a successful post rather than resetting to public.
- Inline reply composers keep inheriting the replied-to status's visibility; adding a selector there is out of scope.

## Acceptance Criteria

- Tests mock `/api/v1/statuses` and assert the selected scope is sent as `visibility` (at least the `private` case), plus default public behavior.
- Tests cover menu open, selection updating the button, Escape dismissal, and outside-click dismissal.
- Existing composer, poll, content-warning, and upload tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- The handoff (`home.jsx`, `styles.css`) only designs the closed button (`composer-tool privacy`); the menu itself follows the app's user-menu pattern.
- Requested by the user on 2026-07-02 after the handoff issues were completed.

## Current Status

- Done: the privacy button opens a menu with all four scopes (icon + label + description), menuitemradio semantics with aria-checked, Escape dismissal with focus restore, outside-click dismissal, and selection updating the button. `createStatus` submits the selected scope, sticky across posts; inline replies still inherit the parent's visibility.
- Covered by the visibility-selector test in `src/routes/home-timeline.e2e.ts` asserting `visibility=private` on the wire for both a first and a subsequent post.
