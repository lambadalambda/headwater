# 49 Link mentions to full federated handles

## Summary

Reply addressee chips ("Replying to") link to the bare nickname from the post text (`/app/profiles/nick`), which cannot resolve remote users — the profile route then searches the viewer's instance for a local `nick`. Post-body mention links have the same problem. The status `mentions` metadata carries the full `acct` (`user@domain`) and should be used for link targets while keeping the short display text.

## Requirements

- Canonicalize reply addressees against the status `mentions` metadata at adapt time, so chips link to `user@domain` for remote accounts while continuing to display the short handle.
- Post-body mention links (timeline, thread, focused, quoted posts) resolve through the same username → acct mapping when metadata is available; unmatched mentions keep current behavior.
- Local accounts (acct without domain) keep their bare handle, which already resolves against the session instance.

## Acceptance Criteria

- A reply with remote mention metadata renders chips whose hrefs point at the full `user@domain` profile path, with unchanged short display text.
- Body mention links use the full handle when metadata provides it.
- Existing addressee, mention, and thread tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Reported by the user on 2026-07-02: chips linked `/app/profiles/<nick>` without the domain, which is not enough to fetch the user.

## Current Status

- Done: `adaptPleromaStatus` builds a `mentionAccts` map (bare `@username` → full `@user@domain`) from the status mentions metadata. Reply addressees are canonicalized through it at adapt time (chips display the short handle but link and title with the full one), and `RichText` resolves mention hrefs through the map in post bodies, focused posts, ancestors, replies, and quoted posts. Local accounts keep bare handles.
- Covered by adapter unit tests (remote canonicalization, local passthrough) and a thread e2e asserting chip and body-mention hrefs point at `/app/profiles/user%40domain` (274 tests green). One older unit test that asserted the bare-handle behavior was updated to the canonical expectation.
