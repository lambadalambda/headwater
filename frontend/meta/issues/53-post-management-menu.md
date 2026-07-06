# 53 Post management menu: delete, mute, block

## Summary

The post overflow menu only offers "Copy post JSON". Add real management actions: delete your own post, and mute or block another author.

## Requirements

- Add typed client support: `deleteStatus`, `muteAccount`, `unmuteAccount`, `blockAccount`, `unblockAccount`. Verified live on Pleroma.
- Thread author identity (account id, handle) and ownership (is the viewer the author) into the post components.
- Overflow menu shows Delete (own posts only, behind a confirm step) and Mute author / Block author (other authors only); signed-out surfaces show neither.
- Deleting removes the post from the current surface; mute/block reconcile the relationship and surface a brief confirmation.
- Errors and 401/403 follow the established global behavior.

## Acceptance Criteria

- Mocked tests cover delete-own-post (with confirm) removing the post, mute author, and block author, plus the absence of destructive items on other/own mismatches.
- Existing post action, thread, profile, and route tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Planned with the user on 2026-07-02 as part of the post-controls bucket.

## Current Status

- Done: `deleteStatus`/`muteAccount`/`unmuteAccount`/`blockAccount`/`unblockAccount` client methods; author id/handle and ownership threaded into the post components via `own`/`authorId`/`authorHandle`.
- Done: overflow menu shows Delete (own posts only, behind a Confirm step) or Mute/Block author (other authors); signed-out surfaces gate all of it behind `canManage`. Delete removes the post (and navigates home if the focused thread post is deleted); mute/block reconcile the relationship into the cache and drop that author's posts from the current view, with a confirmation toast. 401/403 sign out.
- Verified live against fediffusion.art (deleted an own post through the menu; server returned 404 afterwards).
- Covered by home-timeline delete/mute tests and client mutation coverage. Full suite 287 green.
