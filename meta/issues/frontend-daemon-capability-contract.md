# Align exposed frontend controls with daemon capabilities

## Summary

The inherited frontend exposes controls for operations such as bookmarks,
status deletion, mute/block, media updates, chats, and polls. Several calls are
tested only against mocked Pleroma responses, while the DeltaNet daemon has no
matching route or returns an empty stub. The UI therefore presents actions that
can fail or imply state the daemon cannot preserve.

## Requirements

- Inventory every API call reachable through the production DeltaNet UI and
  classify it as implemented, intentionally unsupported, or planned.
- Hide or clearly disable unsupported controls and routes. Do not show an
  enabled action that is guaranteed to fail against the bundled daemon.
- For supported controls, define a daemon/frontend contract covering request,
  response, error, persistence, and federation semantics.
- Add tests against the actual daemon contract rather than relying exclusively
  on broad mocked-Pleroma behavior.
- Split implementation of deferred capabilities into focused feature issues;
  this issue is about making the shipped UI honest and internally consistent.

## Acceptance Criteria

- Bookmark, delete, mute/block, media-description update, chat/message, and poll
  surfaces have an explicit implemented/hidden/disabled decision.
- Every enabled production action has a matching daemon route and a contract
  test that would fail if the route or response shape diverged.
- Empty daemon stubs are used only for intentionally empty read-only surfaces,
  not as substitutes for user-visible mutable features.
- The frontend provides clear unavailable-state copy where a useful route is
  retained for a planned capability.

## Notes

- Current references: `frontend/src/routes/app/[...path]/+page.svelte:1151-1264`,
  `frontend/src/routes/app/[...path]/+page.svelte:1669`, and
  `daemon/src/server.ts:2055-2069`.
