# 29 Port poll attachments from updated handoff

## Summary

Port the updated canonical handoff poll attachment primitive into the Svelte shared post media stack.

## Requirements

- Add a typed `poll` attachment shape alongside photo, video, and audio attachments.
- Update `pickAttachmentLayout()` so polls are separated from media and rendered in a dedicated slot below media.
- Add a Svelte `PollAttachment` component matching `meta/design/claude-handoff/project/attachments.jsx` and the `.post-poll*` styles in `styles.css`.
- Support pre-vote single-choice and multi-choice rows, selected states, disabled vote behavior, result bars, winner state, user vote chip, live metadata, and ended metadata.
- Keep poll rendering independent from a live backend in default tests.

## Acceptance Criteria

- `/design-system` can render poll specimens for single-choice voting, multi-choice voting, voted results, and ended results.
- `PostMedia` renders poll attachments below any media block and does not mix polls into photo/video/audio layouts.
- Poll row clicks do not trigger parent post/thread navigation.
- Focused Playwright coverage proves the four canonical poll states render and remain responsive.
- `pnpm run check` and the affected Playwright suite pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/attachments.jsx` and `meta/design/claude-handoff/project/styles.css`.
- The canonical handoff models polls as `kind: 'poll'` attachments with `choices`, `totalVotes`, `multi`, `myVote`, `expired`, `endsIn`, and `endedAgo` fields.
