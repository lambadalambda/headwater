# 44 Stabilize flaky composer mention avatar test

## Summary

`home-timeline.e2e.ts › composer mention avatars fall back when remote avatar images fail` intermittently fails in full-suite runs: after `pressSequentially('@so', { delay: 20 })` the mention suggestions listbox sometimes never opens within the 5s timeout. The test passes reliably in isolation.

## Requirements

- Reproduce or reason out the race (likely the debounced account-search request vs. typing simulation under full-suite load).
- Make the suggestion-open wait deterministic, for example by waiting for the account-search request before asserting the listbox, or making the autocomplete debounce injectable for tests.

## Acceptance Criteria

- The test passes consistently in full-suite runs (several consecutive `pnpm test` runs without this failure).
- No behavior change to the composer autocomplete itself.

## Notes

- Observed on 2026-07-02 during a full-suite run (263 passed, this one failed; passed twice in isolation immediately after).

## Current Status

- Root cause found via in-test diagnostics: the typed `@so` was committed and the editor stayed focused, but the mention popover had been dismissed — the editor's blur handler cleared it unconditionally 80ms after any blur, so a transient blur/refocus under full-suite load killed the suggestions.
- Fixed in `ComposerMentionEditor.svelte`: dismissal now only happens when focus has actually left the editor, and focusing the editor recomputes the popover. Test hardening: home timeline tests now mock `/api/v1/notifications` (previously real DNS lookups to `pleroma.example`), and the test waits on the content-bearing option before the zero-height listbox container.
- Verified: the failure reproduced roughly one in three file-level runs before the fix; after it, three consecutive file runs and two consecutive full-suite runs passed.
