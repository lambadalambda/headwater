# Key-derived identity badge (color/glyph) next to names

## Summary

Ambient anti-impersonation: a small visual badge derived from a contact's
key, shown beside their display name. A name-cloning account instantly
looks wrong because its badge differs. Pairs with petnames
([[petnames]] / issues/petnames.md) — the badge is the ambient signal,
the petname is the assurance.

## Design

- **Derive from the TOFU-pinned ed25519 attestation pubkey**
  (`store.pinnedKey(addr)`, or the envelope's own `pubkey` for verified
  embeds/held content where no DC contact exists yet) — NOT DC's
  `contact.color`, which is decorative and not key material. The pinned
  key is what post verification checks, so the badge reads as "the key
  your node verifies this person's posts against".
- Visual: hash the pubkey → color + small shape glyph (~8 bits visible).
  Deterministic, stable, same on every node that has seen the same key.
- **No key seen → no badge** (honest blank), never a placeholder that
  could be confused for a real one.
- Where: beside names in post headers, boost lines, profile, reply pill.

## Honesty / limits (document in UI copy or docs)

- ~8 bits is a MISMATCH DETECTOR, not proof: an attacker can grind
  keypairs until the badge matches. Do not present it as verification.
  The pinned-key verify() machinery + petnames carry the real trust.
- A key rotation (restore from lost key, reinstall) changes the badge —
  which is correct and should be visible.

## Acceptance Criteria

- Two accounts with identical display names + avatars render different
  badges; the same account renders the same badge everywhere, including
  on verified embed-only content from strangers.
- Contacts with no pinned/observed key render no badge.
- Unit tests for the derivation (stable, well-distributed over the
  palette); Playwright coverage for rendering.
