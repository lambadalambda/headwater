# Make persistent store writes atomic and corruption-safe

## Summary

`deltanet-store.json` contains both rebuildable indexes and non-derivable state,
including key pins, held envelopes, pending requests, notifications, and thread
bindings. The store is currently rewritten in place after every mutation, and
a parse/read failure silently replaces the in-memory state with an empty store.
A crash or partial write can therefore erase trust and recovery state.

## Requirements

- Persist store updates with an atomic same-directory temporary-file write and
  rename, including appropriate file and directory syncing where supported.
- Preserve safe file permissions and clean up abandoned temporary files.
- Never interpret an unreadable or malformed existing store as a fresh empty
  store. Fail closed or quarantine the corrupt file with a clear diagnostic.
- Keep a recoverable last-known-good copy, or document and implement an
  equivalent deterministic recovery mechanism for non-derivable fields.
- Ensure backup export cannot capture a partial store write.

## Acceptance Criteria

- An interrupted write leaves either the complete previous store or the
  complete new store, never truncated JSON.
- Loading malformed/truncated JSON reports a clear startup error and does not
  overwrite it with empty state on the next mutation.
- Recovery preserves key pins and the other non-derivable fields.
- Unit tests cover interrupted writes, malformed JSON, migration persistence,
  file permissions, temporary-file cleanup, and successful recovery.

## Notes

- Current references: `daemon/src/store.ts:625-650`.
- Derived indexes may still be rebuilt from Delta Chat history; trust roots and
  held content cannot be reconstructed that way.
