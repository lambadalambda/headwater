# Implement unlisted visibility

## Summary

Define a transport-level audience for posts that are public by link but absent from public timelines.

## Requirements

- Prevent unlisted posts from entering public feed projections without weakening reply or backfill behavior.
- Persist and federate the visibility marker with fail-closed audience handling.
- Advertise `unlisted_visibility: true` only after daemon and frontend contracts exist.

## Acceptance Criteria

- Relay tests prove unlisted posts remain link-readable where intended and absent from public timelines.
