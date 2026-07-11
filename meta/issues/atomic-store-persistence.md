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

- Persistence implementation: `daemon/src/store.ts` (`createStore`).
- Derived indexes may still be rebuilt from Delta Chat history; trust roots and
  held content cannot be reconstructed that way.
- Working-tree redesign uses schema-v10 monotonic generations. A validated new
  generation is atomically written to mode-0600 `.recovery` first and primary
  second; load validates both, selects the highest generation, and heals the
  other copy. Both successful files therefore carry the newest mutation rather
  than keeping a previous-generation backup.
- A corrupt primary or recovery copy is retained as `.corrupt-<timestamp>` and
  healed only from a valid peer. Parse/shape corruption is distinct from
  transient read/permission/I/O failure (`StoreAccessError`), which fails closed
  without quarantine, healing, or rollback.
- Only explicit known legacy versions with required anchors migrate. Empty,
  schema-zero, sparse ambiguous, unsafe-ID, unknown-notification, and unusable
  held-envelope snapshots are rejected. Migration fixtures now describe the
  schema they claim rather than relying on empty defaults.
- Unique temporary files, immutable ticket-queue process locks, and generation
  CAS prevent concurrent or stale Store instances from overwriting newer roots.
  Production acquires its daemon-lifetime ticket beside the core data directory
  before recovery or transport startup. Dead predecessors are completed without
  deleting a replaceable lock name; live and malformed predecessors fail closed.
  Strict probes treat only `ENOENT` as missing. New parent entries, files,
  renames, ticket completion, and journal removal are synced where supported.
- Backup export compares store generation/content and an external-mutation
  barrier around asynchronous core export. API mutations, background sends,
  ingest/events, and thread create/bind operations hold the barrier across
  core-first work. DNBK1 now authenticates a core-tar SHA-256 inside its GCM
  sidecar while retaining backward reads.
- Restore creates a mode-0600 fsynced journal outside the core data directory
  before import. It covers previous/donor store, signing key, and account-file
  state. Credential replay compare-exchanges only the selected account so other
  daemons sharing the accounts file are preserved. Normal rollback and startup replay are idempotent across donor-install
  and rollback boundaries. Startup recovery runs before credentials, store,
  attestor, or transport are opened, acquires Store's writer lock, and installs
  through generation-safe replacement.
- Restore strictly validates Ed25519 private/public key snapshots before core
  import. It returns an inert uncommitted transport, checks the restored core
  address against authenticated `sidecar.addr`, and only then persists account
  credentials/auth/global transport and commits the journal. IO and ingestion
  start only after publication. Mismatch and every pre-publication setup failure
  close the opened transport and roll sidecars back.
- Delta Chat core import itself is not transactionally rolled back because core
  requires an empty target and exposes no import rollback. Before credential
  commit, a crash can leave an unreferenced imported core directory; the journal
  is explicitly scoped to sidecars plus credential selection, which remain
  consistent.
- Failure-injection coverage is in `daemon/tests/store-persistence.test.ts`,
  `daemon/tests/interprocess-lock.test.ts`, `daemon/tests/restore-journal.test.ts`,
  and `daemon/tests/server.test.ts`.
- Final working-tree verification: 1,412 daemon unit tests, `pnpm check`,
  `git diff --check`, and the real relay backup/restore integration pass.
