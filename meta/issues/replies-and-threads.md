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

## Current Status (2026-07-06)

Implemented. `src/protocol.ts` (buildReplyText/parseMarkers, TDD, round-trip
tested) + `src/store.ts` (mid⇄msgId index, reply children, idempotent
ingest, JSON-file persisted, unit tested including a reload-from-disk case).
Transport gained `messageMid` (cached `getMessageInfoObject().rfc724Mid`),
`sendControlDm`, and an `onMessage` ingestion hook on `openTransport` (feeds
from both timeline loads and a live `IncomingMsg` subscription, so DM
copies land in the store even without a timeline render).
`POST /api/v1/statuses` with `in_reply_to_id` resolves the target, posts the
marker + quotedText to the own feed, and DMs the author (skipped for
self-replies). `messageToStatus` takes an optional `StatusResolver` to strip
the marker from content and resolve `in_reply_to_id`/`replies_count`;
defaults to no-ops so old call sites are unaffected.
`GET /api/v1/statuses/:id/context` walks ancestors via the reply-marker
chain (cap 20) and descendants breadth-first via the store's children index
(cap 100). All acceptance criteria covered by `tests/protocol.test.ts`,
`tests/store.test.ts`, `tests/entities.test.ts`, and new describe blocks in
`tests/server.test.ts` (reply posting + DM, mapping, context assembly). See
`../../DEVLOG.md` 2026-07-06 "replies/threads + reposts" for the full
writeup. Not archiving per instructions — leaving status here for review.
