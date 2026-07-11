# Implement audio and video uploads

## Summary

Extend the one-file Delta Chat media path beyond the image MIME types currently advertised.

## Requirements

- Define supported audio/video MIME types, previews, hashing, limits, and transport mappings.
- Advertise only MIME types accepted by upload, profile, rendering, and federation paths.

## Acceptance Criteria

- Daemon, frontend, relay, and resource-limit tests cover every advertised MIME type.
