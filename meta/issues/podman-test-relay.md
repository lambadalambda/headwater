# Podman-based ephemeral chatmail relay for integration tests

## Summary

Integration tests create throwaway accounts on nine.testrun.org (a
production relay) — rude at scale and non-reproducible. Provide a local,
ephemeral chatmail relay in a podman container that the integration suite
provisions fresh per run.

## Requirements

- A Containerfile building a real chatmail relay (github.com/chatmail/relay
  via cmdeploy — it is container-aware, `is_in_container()`) on a Debian
  base with systemd as PID 1 (`podman run --systemd`), test domain (e.g.
  `chatmail.example`), `tls_cert_mode: self`, ports published to localhost
  (SMTP submission, IMAPS, HTTP for `POST /new`).
- Harness script (`daemon/scripts/testenv` or similar): build-if-missing,
  force-remove any previous instance, start fresh (`--rm`, tmpfs-backed
  state), wait-for-healthy (POST /new succeeds), teardown. Wired into
  vitest globalSetup/teardown for the integration suite.
- Integration tests parameterized by relay: default = local podman relay
  (explicit imapServer/imapPort/smtpServer/smtpPort +
  accept-invalid-certificates via the transport's login params);
  `DELTANET_TEST_RELAY=testrun` opt-in keeps the real-network path.
  Transport needs an optional explicit-server config path for this
  (addTransport with EnteredLoginParam instead of autoconfig).
- All accounts on the single local relay (intra-relay delivery only — no
  cross-relay DNS/MX/DKIM needed).
- Reproducibility: suite runs offline (post image-build), state fully reset
  between runs.

## Acceptance Criteria

- `pnpm test:integration` passes against the local relay with no external
  network, from a cold `podman rm`-ed state, twice in a row.
- Signup path exercised against real chatmail `/new`; sends pass real
  filtermail encryption enforcement.
- testrun.org path still works behind the opt-in env var.
- README documents the setup (podman requirement, first-run build time).

## Current Status (2026-07-07)

IMPLEMENTED. `pnpm test:integration` now provisions a fresh ephemeral chatmail
relay (real `chatmail/relay` via `cmdeploy`, Debian 12 + systemd, podman
`--systemd=always`) per run and passes 7/7 against it offline, twice in a row
including from a cold `podman rm`-ed state; `pnpm test` (580) + `pnpm check`
green. The testrun.org path remains available behind
`DELTANET_TEST_RELAY=testrun`.

Files: `daemon/testenv/{Containerfile,relay.sh,scripts/*}`,
`daemon/src/testenv/relay-config.ts`, transport explicit-server path in
`daemon/src/transport/deltachat.ts` (`buildEnteredLoginParam`,
`openTransport` `transportParams`), `daemon/tests/integration/{relay.ts,
global-setup.ts}` + all four suites parameterized, `vitest.integration.config.ts`,
`daemon/tests/relay-config.test.ts`. README "Testing against a local relay";
DEVLOG 2026-07-07.

One deviation from stock chatmail, documented in DEVLOG: the test relay lowers
dovecot/postfix TLS *floor* from 1.3 to 1.2, because DC core (rustls) can't
complete a TLS 1.3 handshake through podman's port-forwarder on the macOS
podman machine (curl on the same socket works). Confined to the throwaway
relay; real clients still negotiate 1.3.
