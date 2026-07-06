# 33 Update reply addressee chips

## Summary

Update reply addressee rendering from the older flat "Pinged" chip row to the canonical parent-plus-cc treatment.

## Requirements

- Add or update a shared `PostPinged` Svelte primitive.
- Label addressee rows as "Replying to" instead of "Pinged".
- Render the first addressee as the parent chip with the reply glyph and filled accent style.
- Render remaining cc addressees as ghost chips after a `also` divider.
- Use the same primitive in normal posts and focused thread posts.

## Acceptance Criteria

- `/design-system` includes separate specimens for body only, parent-only reply, reply plus cc-list, and long cc-chain.
- Parent addressee styling is visually distinct from inherited cc addressees.
- Long addressee chains wrap cleanly on mobile and do not overflow post headers or bodies.
- Existing custom emoji and inline mention rendering continue to work.
- `pnpm run check` and affected Playwright coverage pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/components.jsx` and `.post-pinged*` / `.focused-pinged` styles in `styles.css`.
