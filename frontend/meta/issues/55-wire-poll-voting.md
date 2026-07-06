# 55 Wire poll voting

## Summary

Poll attachments render fully (choices, results, expiry) and the Vote button exists, but no surface passes an `onVote` handler, so voting is disabled everywhere. Wire it to the Pleroma poll vote API.

## Requirements

- Add typed client support: `getPoll` and `votePoll` (`POST /api/v1/polls/:id/votes` with `choices[]` indices).
- Thread an `onVote` handler through post components (timeline, thread focused/ancestor/reply, profile) on authenticated surfaces; signed-out surfaces keep the disabled state.
- Submitting a vote updates the poll attachment from the server response across all visible lists (results view, own-vote markers, totals).
- Failures surface via the toast; 401/403 sign out.

## Acceptance Criteria

- Mocked tests cover voting on a single-choice poll (results + "you voted" render from the response) and a vote failure.
- Client coverage includes the poll endpoints.
- Existing poll rendering and composer poll tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Planned with the user on 2026-07-02.

## Current Status

Done (2026-07-06, commit ee747bc). `getPoll`/`votePoll` added to the client with `choices[]` index encoding; `adaptPleromaPoll` exported from ui.ts; `onVote` threaded through PostMedia → Post/FocusedPost/AncestorPost/ReplyPost (incl. recursion)/ProfileView and wired at home, local/federated, thread, profile, and bookmarks render sites. `votePollForPost` swaps the poll attachment from the server response via `applyStatusActionUpdate` (which now also reconciles `bookmarksState`); failures toast, 401/403 sign out. Tests: vote success (results + "you voted" + totals + `choices[]` body), vote failure toast, client endpoint coverage; the old "voting unavailable" assertion updated to expect an enabled Vote button. Full suite 292 passing.
