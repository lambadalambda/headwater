# 34 Port inline thread reply composer

## Summary

Port the updated targeted inline reply composer for thread replies and reconcile the thread design-system specimen with the canonical handoff.

## Requirements

- Add a Svelte inline reply composer that opens below the targeted reply when the reply action is pressed.
- Pre-address the composer to the target author using the canonical "Replying to" chip treatment.
- Include image, emoji, poll, CW, cancel, remaining count, and reply submit controls matching the handoff.
- Keep inline reply state isolated by target post and close it on cancel or successful submit.
- Remove the old terminal thread reply composer from the design-system thread specimen.

## Acceptance Criteria

- `/design-system` thread specimen matches the updated canonical thread structure and no longer shows a terminal reply composer under the focused post.
- Pressing Reply on a reply opens exactly one targeted inline composer beneath that reply.
- Opening a different reply target moves or replaces the inline composer without leaking draft state unexpectedly.
- The composer remains usable on mobile and does not break nested reply layout.
- `pnpm run check` and focused thread/design-system Playwright coverage pass.

## Current Status

- Completed: the real app has targeted inline reply composers for home timeline posts, focused thread posts, top-level replies, and expanded nested replies.
- Completed: the composer pre-addresses the target, shows the target avatar, toggles closed when the same Reply button is pressed, moves between targets without leaking drafts, submits through Pleroma, and stays usable on mobile.
- Completed: the `/design-system` thread specimen no longer uses the old terminal `.thread-reply-composer` and now demonstrates targeted inline reply behavior below selected replies.

## Notes

- Source of truth: `meta/design/claude-handoff/project/thread.jsx`, `meta/design/claude-handoff/project/inline-reply-variants.jsx`, and `.thread-inline-reply*` styles in `styles.css`.
- The real terminal thread reply form was intentionally removed previously; this issue should implement the new targeted design, not restore the old terminal form.
