# Real-time streaming (Mastodon websocket API)

## Summary

The daemon is internally real-time (IMAP IDLE push + event-driven ingestion)
but the browser polls every 60s. Implement the Mastodon streaming websocket
so the frontend — which already tries to connect and degrades gracefully —
lights up with live updates.

## Requirements

- `GET /api/v1/streaming` (tolerate trailing slash) upgrading to a
  websocket; query params `stream` (`user`, `public`, `public:local`) and
  `access_token` (accept any, consistent with the single-user auth model).
  Match the exact URL/frame shape the frontend uses (read its streaming
  client code — read-only — before implementing).
- Frames: Mastodon text frames
  `{"stream":["user"],"event":"update","payload":"<JSON-encoded status>"}`;
  `update` for new feed statuses (including own posts), `notification` for
  newly derived notifications (user stream only). Payload mapping must reuse
  the same status/notification mapping (resolver/store) as the REST
  endpoints — no divergent JSON shapes.
- Source events from the LIVE ingestion path only (transport event
  subscriptions); startup backfill and timeline-load ingestion must not
  stream historical messages. Dedupe repeated core events per message
  (MsgsChanged fires on state changes) so a status streams at most once.
- Keepalive (ws ping ~30s), connection cleanup on close/error.
- New dependency allowed for the websocket server glue
  (`@hono/node-server/ws` + `ws`).

## Acceptance Criteria

- With the UI open and no manual refresh, a post from the other node
  appears in the home timeline within a few seconds, and a like/reply from
  the other node raises the notification badge live.
- Unit tests: streaming hub (fake connections) — frame format, stream
  filtering (user vs public), dedupe, cleanup.
