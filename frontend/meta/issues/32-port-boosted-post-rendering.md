# 32 Port boosted post rendering

## Summary

Port the updated boosted-post wrapper and attribution rail into Svelte shared post components.

## Requirements

- Add a Svelte `PostBoost` primitive based on the canonical handoff.
- Render boosted posts when a post exposes `boostedBy` metadata.
- Preserve normal post markup and actions inside the boost wrapper.
- Apply the desktop attribution rail and narrow-viewport horizontal boost header behavior.
- Ensure boosted rendering works for standard posts, ancestor posts, and reply posts.

## Acceptance Criteria

- `/design-system` shows boosted text-post and boosted photo-post specimens.
- Boosted posts display repeater avatar, name, handle or time metadata, boost tag, and accent rail/header.
- Post click/open behavior and media lightbox behavior still work from inside boosted posts.
- Boosted posts remain responsive without horizontal overflow.
- `pnpm run check` and affected Playwright coverage pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/components.jsx`, `meta/design/claude-handoff/project/home.jsx`, and `.post-boost*` styles in `styles.css`.
- This is visual rendering for boosted statuses; API action wiring remains tracked by issue 20.
