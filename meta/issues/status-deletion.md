# Implement federated status deletion

## Summary

Define durable retraction semantics before exposing delete controls.

## Requirements

- Define deletion for public, private, direct, reply, and boosted copies.
- Persist tombstones/retractions and prevent deleted content from reappearing through backfill.
- Advertise `status_deletion: true` only when the contract is complete.

## Acceptance Criteria

- Relay and restart tests prove deletion reaches intended copies and cannot be resurrected by honest machinery.
