# 41 Wire composer mentions and custom emoji

## Summary

Replace the composer text area with the handoff mention editor and wire account mention autocomplete, custom emoji autocomplete, and the full emoji picker.

## Requirements

- Port the canonical mention editor, custom emoji data helpers, and emoji picker behavior from `meta/design/claude-handoff/project/mention-editor.jsx`, `emoji-picker.jsx`, `emoji-data.jsx`, `mention-*.css`, and `emoji-variants.css`.
- Add typed API client support for account autocomplete through `/api/v1/accounts/search` if missing.
- Add typed API client support for `/api/v1/custom_emojis` if missing and cache the manifest for composer and post rendering.
- Typing `@` plus a username prefix opens an accessible autocomplete list; Arrow keys navigate; Tab or Enter inserts an inline mention atom; Escape dismisses.
- Typing `:` plus at least two shortcode characters opens custom emoji autocomplete and inserts an inline custom emoji atom that serializes back to `:shortcode:`.
- The composer emoji button opens the full picker with recent items, custom emoji packs, Unicode categories, search, outside-click dismissal, and Escape dismissal.
- Serialization must submit plain status text using federated `@user@server` mentions and `:shortcode:` custom emoji codes.
- Backspace/delete behavior around inserted mention and emoji atoms must not corrupt the serialized draft.

## Acceptance Criteria

- Tests mock account search and custom emoji APIs and cover mention insertion, custom emoji shortcode insertion, full picker insertion, keyboard navigation, dismissal, and serialized status submission.
- Composer character counts, draft preservation on failure, content warnings, polls, and reply composers continue to work with the contenteditable editor.
- Post body rendering can display known custom emoji shortcodes with accessible labels while leaving unknown shortcodes as text.
- Existing composer and timeline tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/mention-editor.jsx`, `emoji-picker.jsx`, `emoji-data.jsx`, `mention-prototype.jsx`, `mention-variants.jsx`, `emoji-variants.jsx`, and the Composer slab in `design-system.jsx`.
- Emoji reaction rows remain tracked separately in issue 39.

## Current Status

- Done: `ComposerMentionEditor` contenteditable port with mention/emoji atoms, `@` account autocomplete through `client.searchAccounts`, `:shortcode:` custom emoji autocomplete through cached `client.getCustomEmojis`, full `EmojiPicker` with recents/packs/unicode categories/search/keyboard navigation/dismissal, plain-text serialization (`@user@server`, `:shortcode:`), and custom emoji rendering in post bodies via `renderBodyText`. Covered by `home-timeline.e2e.ts`, `mentions.e2e.ts`, and design-system specimens.
