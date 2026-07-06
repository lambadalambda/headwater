# 52 Bookmarks and share controls

## Summary

The focused post's Save and Share buttons and the post overflow menu are inert. Wire bookmarking, add a bookmarks page, and make Share copy the status link.

## Requirements

- Add typed client support: `bookmarkStatus`, `unbookmarkStatus`, and a paginated `getBookmarksPage` (`GET /api/v1/bookmarks`). Verified live on Pleroma.
- Surface `bookmarked` state on the status view and post model.
- Add a Bookmark toggle to the post overflow menu (all post surfaces) and wire the focused post's Save button; optimistic with rollback and server reconciliation.
- Add a Copy link overflow item and wire the focused post's Share button to copy the status URL.
- Add a routed `/app/bookmarks` page listing bookmarked statuses through the timeline components, with loading/empty/error states and a left-sidebar nav entry.
- Signed-out surfaces show no bookmark/share affordances that mutate.

## Acceptance Criteria

- Mocked tests cover bookmark toggle (menu + focused Save), copy link, and the bookmarks page (list, empty, error).
- Bookmark state reconciles from the server response across surfaces.
- Existing post action, thread, and route tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Planned with the user on 2026-07-02 as part of the post-controls bucket.

## Current Status

- Done: `bookmarkStatus`/`unbookmarkStatus`/`getBookmarksPage` client methods and `bookmarked` on the status view. The post overflow menu (all surfaces) toggles the bookmark and the focused post's Save button mirrors it, with optimistic updates reconciled across home/public/thread/profile/bookmarks lists.
- Done: a Copy link overflow item and the focused post's Share button copy the status URL, with a transient confirmation toast.
- Done: routed `/app/bookmarks` page (loading/empty/error/load-more) with a left-sidebar nav entry; removing the last bookmark collapses to the empty state.
- Verified live against fediffusion.art (bookmarked a post, saw it on the bookmarks page).
- Covered by `app-bookmarks.e2e.ts`, home-timeline bookmark/copy-link tests, and client mutation tests. Full suite 287 green.
