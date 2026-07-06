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
