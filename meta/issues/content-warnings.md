# Implement content warnings

## Summary

Carry content-warning summaries durably and across federation before enabling CW controls.

## Requirements

- Include warning text in signed envelopes and map it through status reads, replies, boosts, and backfill.
- Define warning inheritance and size limits.
- Advertise `content_warnings: true` only with complete frontend and daemon tests.

## Acceptance Criteria

- Relay and restart tests prove warning text survives every supported copy and render path.
