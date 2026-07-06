# 63 Reconcile streamed notification status into rendered posts

## Summary

Favourite counts and emoji reactions on rendered posts don't update in real time. The backend daemon streams Mastodon websocket `notification` events when someone favourites/reacts/replies/boosts (the notification badge already updates live via `applyStreamedNotification`), and each streamed notification carries an embedded `status` object with fresh counts (`favourites_count`, `reblogs_count`, `replies_count`) and fresh `pleroma.emoji_reactions` for the affected post. The frontend currently never reconciles that embedded status into already-rendered timeline/thread posts — counts only change on a full refetch.

## Requirements

- When a streamed notification arrives with an embedded `status`, merge that status's volatile fields into every rendered copy of the same post: home timeline, public timelines, thread view (including nested replies), and profile posts.
- Fields to merge: favourites_count/favourited, reblogs_count/reblogged, replies_count, and `pleroma.emoji_reactions`.
- Do NOT touch content/author fields, and do not clobber local optimistic state that's mid-flight for the same status (an in-progress favourite/boost/reaction toggle via `mutateStatusAction`/`mutateStatusReaction`).
- Reuse the existing `applyStatusActionUpdate(scope, targetId, ...)` reconciliation mechanism (already used to reconcile server responses after favourite/boost REST calls) rather than inventing a parallel mechanism.
- Apply on both streaming entry points that call `applyStreamedNotification`: the home-route timeline stream (`connectHomeTimelineStreaming`) and the notification stream used on other routes (`connectNotificationStreaming`).

## Acceptance Criteria

- Playwright coverage: mock a timeline with a post, then emit a streamed `notification` frame carrying the same post id with a higher `favourites_count` and an emoji reaction, and assert the rendered counts/reactions update without a refetch. Cover both the home-timeline stream and the notifications-page stream.
- `mise exec -- pnpm test` (full suite) and `mise exec -- pnpm check` pass.

## Notes

- Investigated the "REPLYING TO @x" chip rendering (`PostPinged.svelte`, driven by `addressees`, computed in `src/lib/pleroma/ui.ts`'s `extractLeadingReplyAddressees`). It already supports `in_reply_to_account_id` + `mentions`-array-by-id matching (the `directReplyAccountHandle` fallback, preferring `pleroma.in_reply_to_account_acct` when present). Unit coverage exists (`ui.e2e.ts` "use mention metadata... without visible parents"), but no Playwright coverage existed for the pure `in_reply_to_account_id` + `mentions` case without `pleroma.in_reply_to_account_acct`. Added Playwright coverage for that case; no new UI needed since the chip component already handles it.

## Current Status

Done (2026-07-06). Added `reconcileStreamedNotificationStatus` in `src/routes/app/[...path]/+page.svelte`, called from `applyStreamedNotification` (shared by both `connectHomeTimelineStreaming` and `connectNotificationStreaming`, so both the home-route and other-route streams get it). It reuses `applyStatusActionUpdate('all', targetId, ...)` plus the existing `setStatusViewAction`/`setRebuildPostAction` helpers to merge favourites/boosts/replies/reactions from the notification's embedded status into every rendered copy (home timeline, public timelines, thread incl. nested replies, profile posts). It guards against clobbering in-flight optimistic state by checking `statusActionPending` per target+key (`fav`, `boost`, and any `reaction:*` key) before overwriting those specific fields; `replies_count` is always taken fresh since there's no competing optimistic toggle for it. Added `adaptStatusReactions` to the existing `ui.ts` import in +page.svelte.

Playwright coverage added: `src/routes/home-timeline.e2e.ts` ("home timeline reconciles favourite counts and reactions from a streamed notification without refetching") for the home-timeline stream, and `src/routes/app-notifications.e2e.ts` ("notification stream reconciles favourite counts and reactions on a rendered thread post") for the notifications-page stream on a non-home route (thread view). Also added `src/routes/home-timeline.e2e.ts` ("home timeline shows reply pill from in_reply_to_account_id and mentions alone, without in_reply_to_account_acct") — this passed immediately since the chip mechanism already supported it; no UI changes were needed for that part.

Full suite: `mise exec -- pnpm test` — 314 passed (one unrelated pixel-geometry flake in `app-thread.e2e.ts` "bridges multiple ancestor rails with warnings and media" reproduced once under parallel load and passed cleanly on isolated re-run and on a second full-suite run; not caused by this change). `mise exec -- pnpm check` — 398 files, 0 errors, 0 warnings.
