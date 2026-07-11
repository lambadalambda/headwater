# Implement extended profile fields

## Summary

Persist website, location, discoverability, and follower-count preferences before exposing those settings.

## Requirements

- Define local and federated semantics for profile fields and privacy preferences.
- Return saved values accurately from account endpoints.
- Advertise `extended_profile: true` only with persistence and frontend contracts.

## Acceptance Criteria

- Update, restart, and remote-observation tests cover every enabled field and preference.
