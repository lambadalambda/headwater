# 40 Wire composer media upload and dropzone

## Summary

Add media upload support to the composer, including the drag-and-drop and upload-progress UI from the updated handoff.

## Requirements

- Add typed API client support for Pleroma media attachment upload if missing.
- Port the canonical composer upload/dropzone surface from `meta/design/claude-handoff/project/composer-dropzone.jsx`, `composer-dropzone.css`, and the composer attachment specimens in `design-system.jsx`.
- Support browse-button upload, drag-and-drop over the composer, paste-to-attach where feasible, per-file progress rows, remove-upload controls, and upload failure messages.
- Enforce the handoff limits in the UI copy and validation: photos, audio, and video; max 8 files; 40 MB per file unless instance metadata provides a stricter limit.
- Submit uploaded media IDs with status creation while preserving existing text, visibility, content-warning, poll, and failure behavior.
- Keep oekaki/drawing tools out of scope unless already present as a separate working feature.

## Acceptance Criteria

- Tests mock media upload success, upload failure, rejected oversized file, remove-upload, and create-status submission with uploaded media IDs.
- Drag-over/drop state renders the handoff dropzone affordance without losing the current draft.
- Uploading and uploaded files render deterministic progress/list states for image, audio, and video attachments.
- Existing composer, poll, content-warning, timeline, and `/design-system` tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Source of truth: `meta/design/claude-handoff/project/composer-dropzone.jsx`, `composer-dropzone.css`, `home.jsx`, `styles.css`, and the Composer slab in `design-system.jsx`.
- Status text creation itself is already covered by completed issue 19.

## Current Status

- Done: `client.uploadMedia`, browse/drag-and-drop/paste attach paths on both the main composer and the inline reply composer, per-file progress rows with remove controls and failure messages, type/size/count validation (image/audio/video, 8 files, 40 MB), and `media_ids[]` submission with status creation. Covered by `home-timeline.e2e.ts` and `app-thread.e2e.ts` upload tests.
