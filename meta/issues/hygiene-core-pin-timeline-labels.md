# Hygiene: pin core exactly; honest timeline labels

## Summary

Two small items from the substrate audit.

## Requirements

- Pin `@deltachat/stdio-rpc-server` + `@deltachat/jsonrpc-client` to exact
  versions (no `^`) with a comment: broadcast channels are the
  least-stable, spec-less part of core and the wire format changed
  recently — upgrades are deliberate events (re-run integration suite).
- Frontend: the "Federated" tab renders home-timeline data — rename or
  remove; audit "Local" semantics at the same time (own posts?). Copy
  change only, keep tests green.

## Acceptance Criteria

- Lockfile-independent exact pins; note in DEVLOG.
- No timeline tab whose label promises fediverse semantics we don't have.
