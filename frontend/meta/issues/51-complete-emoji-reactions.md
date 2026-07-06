# 51 Complete emoji reactions

## Summary

Finish the two deferred edges of the reaction feature: the add-reaction affordance currently renders as a disabled stamp (so a first reaction can never be added from the UI), and `pleroma:emoji_reaction` notifications still render as "unknown notification".

## Requirements

- The V3c add stamp opens the existing emoji picker anchored to the stamp; picking a unicode or custom emoji submits the reaction through the existing reaction mutation.
- Posts without any reactions need a reachable affordance too: add a React action to the post action rows (deviation from the handoff action row, which predates reactions).
- Custom emoji reactions submit the bare shortcode to `PUT /api/v1/pleroma/statuses/:id/reactions/:emoji`.
- Reaction picking is available on authenticated post surfaces (home/local/federated timelines, thread, profile); signed-out surfaces show no picker affordance.
- Adapt `pleroma:emoji_reaction` notifications to a first-class reaction kind: actor name, "reacted" wording with the emoji glyph (or custom emoji image with alt text), status excerpt, and thread navigation like favorites.

## Acceptance Criteria

- Mocked tests cover: opening the picker from the add stamp and from the React action, unicode and custom emoji submission (correct API path), picker dismissal, and no affordance when signed out.
- Mocked reaction notifications render actor, emoji, and excerpt, and navigate to the thread; the old "unknown notification" expectation is replaced.
- Existing reaction, notification, and post action tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Follow-up to issue 39, which deliberately deferred the picker.
- Planned with the user on 2026-07-02.

## Current Status

- Done: the V3c add stamp is enabled and a React action was added to the post and focused-post action rows; both open the shared `EmojiPicker` anchored to the trigger. Picking a unicode or custom emoji routes through `mutateStatusReaction` (optimistic + rollback + server reconcile), submitting the bare shortcode for custom emoji. Available on authenticated home/local/federated/thread/profile posts; signed-out surfaces pass no handler so no affordance renders. Verified live against fediffusion.art (reacted 🐱 on a real post and toggled it back off, confirmed server-side).
- Done: `pleroma:emoji_reaction` notifications are a first-class `reaction` kind — actor name, "reacted with <emoji> to your post" (glyph or custom emoji image with alt text), excerpt, thread navigation, and inclusion in the Favorites filter tab. Genuinely unknown types still fall back to the neutral row.
- Covered by add-reaction picker tests (custom + unicode, correct API path), reaction notification tests (unicode + custom image), a signed-out no-affordance assertion, and updated notification/client fixtures. 278 tests green.
