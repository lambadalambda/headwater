# "Replying to" pill shows the address local part instead of the chosen name

## Summary

Both "Replying to" renderings — the inline reply composer pill and the
reply footer on rendered posts (`PostPinged`) — display the first half of
the email address (e.g. `@zbie604yz`). On the fediverse that's a chosen
nickname; on chatmail it's a random registration string and useless. They
should display the author's chosen display name (e.g. "Carol Sparkle"),
falling back to the handle when no name is known.

## Investigation

- Composer pill (`InlineReplyComposer.svelte`): renders `targetHandle`,
  but `InlineReplyTarget` already carries `name` (the post author's
  display name) and it's already passed as `targetName` — render that.
- Post footer (`PostPinged.svelte` via `PostBody`): driven by
  `addressees: string[]` (handles), built in `ui.ts` from the status's
  `mentions` / `pleroma.in_reply_to_account_acct`. Mastodon mentions carry
  no display name — but the daemon builds the mention from
  `parentMsg.sender` (a full DC contact WITH `displayName`), so it can
  ship one.

## Design

- Daemon: `contactToMention` gains a non-standard additive
  `display_name` field (decision 0001: the API is ours; the field is
  ignored by anything expecting vanilla Mastodon).
- Frontend `ui.ts`: build `addresseeNames: Record<handle, name>` from the
  mentions next to `addressees`; thread it through
  Post/ReplyPost/AncestorPost/FocusedPost → PostBody → PostPinged.
- `PostPinged` renders the name when known (full handle stays as the
  chip's `title`/tooltip); falls back to the short handle (held/legacy
  parents where no contact is known).
- `InlineReplyComposer` pill + placeholder use `targetName`, falling back
  to `targetHandle`.

## Acceptance Criteria

- Replying to a post by "Carol Sparkle" shows "Replying to Carol Sparkle"
  in the composer pill and in the reply's rendered footer; the full
  address remains available as the chip tooltip.
- Unknown-name parents (held envelopes, legacy) still fall back to the
  handle — never an empty chip.
- Daemon unit tests cover the mention `display_name`; Playwright covers
  both pill renderings.
