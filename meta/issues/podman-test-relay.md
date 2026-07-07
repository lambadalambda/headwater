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
