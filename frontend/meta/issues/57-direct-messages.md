# 57 Direct messages (Pleroma chats)

## Summary

The app has no direct messages. Pleroma's chats API (verified live against fediffusion.art on 2026-07-06) provides 1:1 conversations: chat list, per-chat messages, send, mark-read, delete. Build a Messages section consistent with the app's design language — there is no dedicated handoff design for DMs (only the "Mailbox" concept note in chat1.md), so the UI follows the existing feed/notification row idioms.

## API (all verified live)

- `GET /api/v2/pleroma/chats` — paginated chat list `{id, account, last_message, unread, updated_at, pinned}`
- `POST /api/v1/pleroma/chats/by-account-id/:account_id` — get-or-create chat (works with self)
- `GET /api/v1/pleroma/chats/:id/messages` — `{id, content, attachment, emojis, created_at, chat_id, account_id, unread}`, newest first, `max_id`/`min_id` cursors
- `POST /api/v1/pleroma/chats/:id/messages` — send `{content, media_id?}`
- `POST /api/v1/pleroma/chats/:id/read` — `{last_read_id}` → returns chat with updated unread
- `DELETE /api/v1/pleroma/chats/:id/messages/:message_id`

## Requirements

- Typed client support for the six endpoints above.
- UI adapters: chat row view (partner account with name emoji, last-message excerpt, unread count, relative time) and chat message view (own/other, HTML content with custom emoji, attachment, time).
- `/app/messages` route: chat list; opening a chat shows the conversation (oldest→newest, own messages right-aligned) with a message composer; sending appends from the server response; opening marks read.
- "Messages" nav item (icon: mail-ish) with total unread count across chats.
- `pleroma:chat_mention` notifications don't break the notifications list.
- Message delete available on own messages.
- Failures surface via existing error/toast patterns; 401/403 signs out.

## Acceptance Criteria

- Mocked tests: chat list renders, opening a chat loads messages + marks read, sending posts the right body and appends, delete removes, unread badge on nav.
- Client endpoint coverage in client.e2e.ts.
- Mobile layout works (chat list and conversation at 375px without horizontal overflow).
- Live-tested against fediffusion.art (chat-with-self loop).
- `pnpm run check`, affected suites, full suite, and `git diff --check` pass.

## Notes

- Approved by the user on 2026-07-02 as the feature after alt text and poll voting.
- Streaming (`pleroma:chat_update`) is out of scope for the first cut; refresh on open is fine.

## Current Status

Done (2026-07-06, commit 2868f6a). Client gained `getChats` (v2), `getOrCreateChat`, `getChatMessages`, `sendChatMessage`, `markChatRead`, `deleteChatMessage`; ui.ts gained `adaptPleromaChat(s)`/`adaptPleromaChatMessage(s)` with own-message detection via the session account id. New components: `ChatRow` (list row with unread badge, last-message excerpt, relative time) and `ChatThread` (bubbles with custom emoji + attachments, Enter-to-send composer, per-own-message delete, auto-scroll). `/app/messages` lists chats, `/app/messages/:id` shows the conversation, opening marks read and reconciles the unread badge; a "Messages" nav item shows the summed unread count on desktop and mobile. Send failures surface inline and keep the draft; delete failures toast; 401/403 signs out. Tests: 8 route tests (list, empty, open+mark-read+alignment, send, send-failure, delete, API error, mobile overflow) plus client endpoint coverage. Live-tested the full loop against fediffusion.art via a chat-with-self (send from UI, delete from UI, server state verified; test messages cleaned up). Full suite 303 passing.

Out of scope for this cut, as planned: streaming chat updates (`pleroma:chat_update`), media uploads in the chat composer, and a "Message" entry point on profiles (chats are currently entered from the list).

Side fix: the Playwright preview port is now configurable via `PLAYWRIGHT_PORT` (an unrelated local process was squatting 4173), and the webServer command passes the port to `vite preview` correctly.
