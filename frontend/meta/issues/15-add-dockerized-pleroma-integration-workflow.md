# 15 Add dockerized Pleroma integration workflow

## Summary

Define the opt-in dockerized integration test workflow for exercising PleromaNet against an ephemeral Pleroma backend.

## Dependencies

- 14 Wire public timeline read slice for a frontend public smoke path, or use a raw API-client smoke if the frontend route is not ready.

## Requirements

- Create a separated integration test location or tag, such as `tests/integration` or `@integration`, compatible with the test organization from issue 10.
- Add a `mise run test:integration` task that is explicitly opt-in.
- Keep dockerized integration tests excluded from `pnpm test`, `pnpm run test:e2e`, and `mise run test`.
- Pin or document the Pleroma backend version used by the integration workflow.
- Provide setup/teardown behavior for an ephemeral backend and test data.
- Include a minimal smoke path that proves the frontend or API client can talk to a real Pleroma API.

## Acceptance Criteria

- `mise run test:integration` launches or connects to the dockerized backend, runs the integration suite, and cleans up after itself.
- Default tests still pass without Docker or a live Pleroma instance.
- Integration tests are clearly separated from deterministic Playwright tests.
- At least one integration smoke test covers instance metadata plus an unauthenticated public API request.
- Documentation explains how to run, debug, and clean up the integration environment.

## Notes

- Keep the first integration workflow small; broaden coverage after real authenticated routes consume the API client.
