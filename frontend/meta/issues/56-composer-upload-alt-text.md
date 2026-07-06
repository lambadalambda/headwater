# 56 Composer upload alt text

## Summary

Uploaded composer attachments have no way to set a description (alt text), even though the API supports it. Add a per-upload alt text field to the main and inline reply composers.

## Requirements

- Add typed client support: `updateMedia` (`PUT /api/v1/media/:id` with `description`).
- Each uploaded row in the main composer and the inline reply composer gets an accessible alt text input; committing the value updates the media description through the API and reconciles the row state.
- Update failures surface via the toast and keep the draft text.
- Posting continues to send the same `media_ids[]`; descriptions live on the media objects.

## Acceptance Criteria

- Mocked tests cover setting alt text on an upload (PUT body asserted) and an update failure.
- Existing upload, composer, and inline reply tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Planned with the user on 2026-07-02.

## Current Status

Done (2026-07-06). `updateMedia` (`PUT /api/v1/media/:id`) added to the client; uploaded rows in the main composer and InlineReplyComposer render an accessible alt text input (only once the upload finishes) that saves on commit (blur/Enter) via `saveUploadAltText`, reconciles `upload.media` from the response, skips no-op saves, toasts on failure, and signs out on 401/403. Tests: PUT body asserted for both composers, failure toast keeps the draft, client endpoint coverage. Live-verified the PUT contract against fediffusion.art (description round-trips). Full suite 295 passing.
