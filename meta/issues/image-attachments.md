# Image attachments on posts

## Summary

Posting supports text only. The frontend composer already uploads media via
the Mastodon API; the daemon must accept uploads and attach them to posts.

## Requirements

- `POST /api/v1/media` (multipart, field `file`, optional `description`):
  store the file in a temp area, return a media attachment JSON with an `id`.
- `POST /api/v1/statuses` accepts `media_ids[]`; the first id attaches the
  image to the outgoing message (`sendMsg` with `file` + viewtype `Image`;
  DC messages carry at most one file, and instance config already advertises
  `max_media_attachments: 1`).
- A post may be image-only (empty text + media id is valid; keep 422 for
  empty text AND no media).
- Alt text (`description`) round-trips into the attachment JSON where we have
  it (storing it locally per media id is enough for v1).
- Incoming image messages already map to `media_attachments` via
  `/deltanet/blob/:msgId` — verify end to end and keep working.

## Acceptance Criteria

- Uploading an image in the composer and posting shows the image in the
  timeline on both the poster's and a follower's node.
- Unit tests: media upload returns id; statuses with media_ids call the
  transport with the file; image-only post allowed.

## Current Status (2026-07-06)

Implemented in the daemon: `POST /api/v1/media` (multipart, field `file`,
optional `description`) persists uploads via a new `src/media.ts` in-memory
registry over an OS-tmpdir directory, 422s on non-image mime, returns
`{id, type: 'image', url: '', preview_url: '', description}`.
`POST /api/v1/statuses` accepts `media_ids[]`/`media_ids`, allows image-only
posts (empty text + media), still 422s when both are empty, and passes
`{file}` through the extended `Transport.post(text, opts?)`; the deltachat
transport uses `rpc.sendMsg(..., {viewtype: 'Image', file, ...})` in that
case. Alt text round-trips into the immediate post response and into later
timeline/status reads via a msgId-keyed lookup in the same registry. Covered
by `tests/server.test.ts` (media upload, non-image 422, media_ids attaches
file, image-only post, description round-trip) with the fake transport;
`pnpm test`/`pnpm check` pass. Real end-to-end delivery across two chatmail
nodes not exercised here — leaving this issue open per instructions.
