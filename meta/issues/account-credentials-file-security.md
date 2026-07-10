# Protect persisted account credentials

## Summary

`accounts.local.json` contains chatmail addresses and passwords but is created
with default filesystem permissions and rewritten directly in place. A common
umask can leave a newly created credential file readable by other local users,
and an interrupted rewrite can lose all configured accounts.

## Requirements

- Create credential files with mode `0600` and credential directories with
  mode `0700` where the platform supports POSIX permissions.
- Correct overly broad permissions on an existing credentials file when it is
  safely possible, with a clear diagnostic if it is not.
- Write updates atomically so adding or updating one account cannot truncate
  all stored credentials.
- Preserve existing accounts and file ownership while updating one entry.
- Never log passwords or include them in thrown error messages.

## Acceptance Criteria

- A newly created credentials file is owner-readable/writable only.
- Updating an existing credentials file retains restrictive permissions and all
  unrelated account entries.
- Simulated interrupted writes leave the previous complete credentials file.
- Unit tests cover create, update, permission correction, and failure paths on
  supported platforms.

## Notes

- Current reference: `daemon/src/config.ts:11-18`.
- `.gitignore` prevents accidental commits but does not protect local file
  access or interrupted writes.
