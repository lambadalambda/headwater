# Own posts show "Me" in timelines

## Summary

`transport.self()` overrides the SELF contact's placeholder name from config,
but timeline statuses map `message.sender` directly, so your own posts render
as "Me".

## Requirements

- Messages from contact id 1 (SELF) get the configured `displayname` in
  status account mapping, same as `self()` does.
- Keep it in the transport layer so the mapping stays pure.

## Acceptance Criteria

- Home timeline shows the configured display name on own posts (unit test on
  the transport or integration assertion).

## Current Status (2026-07-06)

Implemented in `src/transport/deltachat.ts`: `loadMessages` (used by both
`timeline()` and `message()`) now overrides `sender.displayName` with the
configured `displayname` for messages from DC contact id 1 (SELF), same trick
as `self()`. The config read is cached once per transport instance
(`selfDisplayName()`/`cachedDisplayName`), not per message. This transport
implementation has no dedicated unit test file (only the real-network
integration suite touches `deltachat.ts` directly, which we didn't run here);
the change type-checks (`pnpm check`) against the shared `Transport`
interface and mirrors the existing `self()` pattern exactly. Server-layer
behavior (mapping `msg.sender` into the status account) was already covered
by `tests/server.test.ts`'s fake-transport tests showing non-self senders'
display names pass through — the fake transport doesn't model DC contact id
1 specially since that override now lives entirely in the deltachat
transport, per the issue's "keep it in the transport layer" requirement.
