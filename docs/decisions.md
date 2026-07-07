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
