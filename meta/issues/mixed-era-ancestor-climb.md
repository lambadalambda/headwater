# Context ancestors stop at the uuid→mid era boundary

## Summary

Live QA: /app/thread/177 shows only two messages while /app/thread/151
(same thread, one level up) shows all. Diagnosed: the context endpoint's
unified uuid ancestor climb (server.ts, added with thread-auto-backfill)
does `if (!uuid && p.reply) break` when a climbed message's reply ref is
a LEGACY MID ref — it stops instead of continuing the legacy local-only
climb from that point. The target's own path handles a mid-ref parent
via the fallback branch, which is why /151 shows its parent but /177
loses it.

## Requirements

1. When the uuid climb reaches a message whose reply ref is a mid ref,
   CONTINUE climbing with the legacy local resolution (resolveKey(mid) →
   message → keep walking, same bounded loop) instead of breaking —
   unify the two loops or chain them; either way one thread renders the
   same ancestors regardless of which message you enter from.
2. Depth stays bounded by MAX_CONTEXT_ANCESTORS across the WHOLE climb.

## Acceptance Criteria

- Unit: a chain legacy-root ← legacy-reply(mid ref) ← v2-reply(uuid ref)
  ← v2-reply renders ALL ancestors from the deepest entry point; entering
  from each level yields consistent ancestor sets.
- Live (manual, coordinator): /app/thread/177 shows the full thread.
- `pnpm test` + `pnpm check` green.

## Current Status

DONE (2026-07-07, main-loop implementation — delegation suspended by user).
Replaced the split uuid-loop + legacy-fallback with ONE bounded climb by post
key (uuid or mid) crossing local ↔ held ↔ legacy freely. Live-verified:
/app/thread/177 now renders the full ancestor chain (143 → 151), identical to
entering from /app/thread/151. Unit: mixed-era chain consistent from every
entry point.
