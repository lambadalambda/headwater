# 31 Port post content warning wrapper

## Summary

Port the updated post-level content warning wrapper so status bodies, quoted posts, media, and polls can be folded behind a warning summary.

## Requirements

- Add a Svelte `PostCW` primitive based on the canonical `PostCW` handoff component.
- Wrap post body, quoted post, and media in `Post`, `AncestorPost`, `FocusedPost`, and `ReplyPost` when `post.cw` is present.
- Render the folded warning card with summary, hidden-content metadata chips, reveal action, and always-show link affordance.
- Render the revealed summary strip with a Hide action after content is opened.
- Count hidden photos, videos, audio attachments, polls, and approximate words for the folded metadata row.

## Acceptance Criteria

- `/design-system` shows the canonical CW specimens: folded with media, folded text only, and folded with poll.
- Folded posts do not render hidden body text, quoted post content, media, or polls until revealed.
- Revealed posts can be hidden again without changing post action state.
- The behavior works for timeline posts, ancestor posts, focused thread posts, replies, and nested replies.
- `pnpm run check` and focused Playwright coverage pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/components.jsx`, `meta/design/claude-handoff/project/thread.jsx`, and `.post-cw*` styles in `styles.css`.
- `PhotoGrid` already has per-photo CW handling; this issue is for post-level CW folding.
