# Backup & identity survival UX

## Summary

The data dir is the identity (private key in dc.db); the relay retains
nothing (20-day bus) and deletes accounts after 90 idle days. Losing the
disk = ceasing to exist. Core has everything needed (encrypted backup
export/import, device-to-device transfer, self-sync messages); the daemon
exposes none of it.

## Requirements

- Daemon endpoints wrapping core imex: export encrypted backup
  (passphrase) to a download; import/restore path documented for a fresh
  node (restore-instead-of-signup during onboarding).
- Frontend: a Backup section in settings (export button + last-backup
  nag), and a restore affordance on the landing/create-account flow.
- Onboarding copy warns about the 90-day inactivity expiry and
  data-dir-is-identity.
- Stretch (may split): second-device pairing via core's backup-transfer
  QR.

## Acceptance Criteria

- Export → wipe test node → restore → identity, follows, and history
  intact (integration-testable with the local relay once available).
- Settings shows backup UI; onboarding shows the warning.
