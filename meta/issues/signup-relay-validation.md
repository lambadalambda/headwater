# Validate and constrain signup relay requests

## Summary

The signup API accepts a caller-provided relay string and performs a server-side
POST to `${relay}/new` without URL validation or a timeout. Before a node is
configured, this can be abused as an arbitrary-request/SSRF primitive. Custom
and self-hosted chatmail relays remain a legitimate use case, so the trust policy
must be explicit rather than hard-coding only the default relay.

## Requirements

- Parse relay input as a URL and reject unsupported schemes, credentials,
  malformed hosts, fragments, and ambiguous path construction.
- Treat custom relay selection as a privileged operation protected by the local
  API security boundary.
- Define how private, loopback, and self-signed development relays are enabled
  without making them available to arbitrary unauthenticated callers.
- Apply connection and response timeouts, a bounded response size, and clear
  error handling to registration requests.
- Validate the registration response before persisting or opening an account.

## Acceptance Criteria

- Invalid schemes and malformed relay values fail before any network request.
- Untrusted callers cannot make the daemon contact an arbitrary internal or
  external URL through signup.
- The default public relay, explicitly configured custom relays, and the local
  integration-test relay continue to work.
- Tests cover URL normalization, blocked inputs, timeout, oversized/invalid
  responses, and the explicit development/private-relay path.

## Notes

- Current references: `daemon/src/server.ts:676-684` and
  `daemon/src/signup.ts:10-18`.
