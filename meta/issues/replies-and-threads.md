# Replies and threads via wire convention

## Summary

Experiments (see DEVLOG 2026-07-06) killed the native-quote design: core
rejects cross-chat `quotedMessageId`. Replies instead use the deltanet wire
convention v0: a reply is a post in YOUR OWN feed whose text ends with a
marker line referencing the original's global email Message-ID
(`rfc724Mid`), plus `quotedText` for vanilla-DC rendering, plus a DM copy to
the original author.

## Requirements

- Wire format (protocol module, pure functions to build/parse):
  - reply marker, final line of text: `↳re <rfc724Mid> <authorAddr>`
  - outgoing `quotedText`: `"<authorName>: <excerpt≤120>"`
  - DM copy to the author carries the same text+marker.
- `POST /api/v1/statuses` with `in_reply_to_id`: resolve target message,
  fetch its rfc724Mid (`getMessageInfoObject`), post to own feed with marker
  + quotedText, send DM copy to author (skip DM when replying to self).
- Daemon store (persisted per account in the data dir): mid→msgId index and
  reply-children index, fed by an idempotent ingest step (timeline loads +
  incoming-message events). No reverse-lookup RPC exists — we own the index.
- Status mapping: strip the marker from `content`; `in_reply_to_id` from the
  resolved mid (unresolvable → keep quotedText rendering, no link).
- `GET /api/v1/statuses/:id/context`: ancestors by walking reply refs,
  descendants from the children index. `replies_count` from children index.

## Acceptance Criteria

- Reply from the UI to a followed post → threaded in the thread view;
  a follower of both parties sees the linkage resolve on their node.
- Original author receives the reply (DM copy) even without following the
  replier.
- Unit tests: marker build/parse round-trip, mapping, context assembly.

## Notes

- Markers are visible to vanilla Delta Chat readers by design (readable
  footer); revisit with webxdc/headers later.
