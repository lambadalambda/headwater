# Implement account mute and block

## Summary

Add persisted local moderation semantics before exposing mute/block controls.

## Requirements

- Define the distinct effects of mute and block on timelines, notifications, follows, direct delivery, and backfill.
- Persist moderation state and return accurate relationships.
- Advertise `account_moderation: true` only with complete filtering tests.

## Acceptance Criteria

- Daemon and frontend tests cover mute/block, undo, restart, and all affected projections.
