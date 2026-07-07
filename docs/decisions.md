# Decisions

## 0001 — Hard cut from vanilla Delta Chat compatibility (2026-07-07)

**Decision (project owner):** deltanet is a distinct system on the chatmail
substrate, not a Delta Chat overlay. Users get new accounts and use deltanet
clients. Basic transport interop remains (it's the same mail), but we do NOT
maintain compatibility hacks so that vanilla Delta Chat clients can render
deltanet content. Greenfield rules apply.

**Consequences:**

- **Wire format v2 is pure structured JSON** as the message body — versioned
  envelope with an explicit `type`, human text as a *field*, refs/uuids/
  extensions as fields. Kills the in-band ambiguity of text markers (user
  content can no longer collide with protocol grammar) and removes the
  one-glyph-per-verb ceiling.
- The v0/v1 text-marker grammar (`↳re`, `♻`, `⚑`, `⚓`, emoji reaction DMs,
  quotedText rendering bubbles) is legacy: kept read-side so existing
  histories still render, never emitted again. Revisit dropping read-side
  parsers once test-era data stops mattering.
- Human-to-human DM content (a future Messages feature) stays plain text —
  that's user content, not protocol. The JSON envelope is for statuses and
  control messages.
- Design sketch #5 (JSON as extension channel beside human-readable text) is
  **superseded** — JSON is now the container, not the sidecar. The
  protected-header endgame remains desirable when upstream RPC allows it.
- The "vanilla Delta Chat users can follow deltanet feeds" property from the
  federation comparison (§4) is retired as a goal. What remains true: the
  substrate is unchanged (E2EE, securejoin, broadcast channels,
  store-and-forward, iroh, webxdc), and deltanet↔anyone mail delivery keeps
  working at the transport level.

## 0002 — No synthesized statuses; rendered content must be verifiable (2026-07-07)

**Decision (project owner):** deltanet never renders synthesized statuses.
Everything shown as "X said Y" must be real and cryptographically
verifiable: either a direct delivery (PGP-verified by core) or a
republished signed envelope whose attestation verifies against X's key.

**Consequences:**

- The v0/v1 `synthesizeStatus`/`synthesizeAccount` paths (boost quotedText
  → fake status with a synthetic id-"0" account) are scheduled for removal
  with wire v2. Unresolvable/unverifiable republished content renders as an
  honest placeholder ("boosted a post that cannot be displayed/verified"),
  never as attributed content.
- Interim ordering: wire v2 may ship before attestations — during that
  window, boosts of posts the recipient doesn't hold render placeholders
  (no synthesis). Attestations (sketch #6) then upgrade placeholders to
  verified embeds. Thread republication (sketch #3) launches only WITH
  attestations — hosts never gain a synthesis privilege.
- Scope: this governs content attribution (statuses/accounts). Reaction
  TALLIES remain trust-by-default with verify-on-demand receipts (0001-era
  discussion) — numbers, not impersonation.
- Legacy note: current shipped code still synthesizes for pre-v2 boosts;
  documented here as behavior slated for removal, not a compatibility
  promise.
