# Implement chat and message APIs

## Summary

Map Delta Chat conversations to the Pleroma chat API before enabling Messages.

## Requirements

- Implement chat listing, thread reads, send, read markers, and message deletion.
- Exclude feed/control/thread-subscription chats and define attachment behavior.
- Advertise `chats: true` only with persistent daemon and frontend contracts.

## Acceptance Criteria

- Integration tests cover conversation lifecycle, unread state, filtering, attachments, and restart behavior.
