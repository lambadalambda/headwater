# Wire: signed thread-root ref on replies + DM copy to root author

## Summary

Prerequisite for thread auto-backfill and thread subscriptions (design
sketch #3, revised). Two defects in today's convention:

1. A reply envelope only identifies its PARENT (one hop up). A node
   holding a mid-thread message cannot tell which thread it belongs to or
   who owns it without holding the entire ancestor chain.
2. Reply DM copies go to the parent author only, so the root author does
   NOT accumulate the full thread (third-party replies deep in the thread
   never reach them) — sketch #3's original premise was wrong. A future
   thread host must be complete by construction.

## Requirements

1. **Envelope**: v2 reply envelopes gain `root`: a ref (`{u, addr}`) to
   the thread's root post, INSIDE the signed canonical payload (new
   canonical field; bump `CANONICAL_PAYLOAD_VERSION` to `dn3`). There ARE
   deployed dn2 signatures in the wild (outside nodes federate with us),
   so `verify()` keeps a dn2 FALLBACK: try the dn3 layout first; if the
   envelope carries no `root`, also try the dn2 layout (root-less).
   Downgrade-safe because the version string is inside the signed bytes:
   a dn3 signature can never verify under the dn2 layout or vice versa,
   and a dn2 envelope can never grow a forged `root`. Sign path emits
   dn3 only. `root` is absent for non-replies and for legacy parents
   whose root is unknowable — best-effort, never fabricated.
2. **Send path**: when composing a reply, derive the root: the parent's
   own `root` ref if its envelope carries one, else the parent itself if
   it is not a reply, else walk local ancestors as far as held; if the
   root is genuinely unknown (unresolvable legacy chain), omit.
3. **DM copy to root author**: reply copies go to the parent author (as
   today) AND the root author when known, distinct from the parent
   author and not SELF. Same dedupe/threading behavior as existing DM
   copies (canonical post keys already unify copies). Cold contact is
   expected to work (chatmail serves keys for first-contact encryption —
   the follow-by-address flow relies on this today), but the copy is
   BEST-EFFORT: a send failure to the root author must not fail the
   reply itself (log + skip, parent copy and feed post still go out).
4. **Read side**: `parseWire`/store surface the root ref so thread
   resolution and future backfill can use it. Verification: `root`
   participates in the canonical payload as TWO frames — its token string
   AND its addr, each empty when absent:
   `lp(dn3) lp(type) lp(uuid) lp(addr) lp(ts) lp(text) lp(refToken) lp(rootToken) lp(rootAddr) lp(mediaSha256)`.
   The addr is signed (unlike `ref.addr`, display-only attribution)
   because it is a ROUTING target: it decides who receives the root DM
   copy and whom a subscriber contacts in thread-subscribe — a relayed
   envelope (boost embed, backfill bundle) must not be able to swap it.
   Graft note: an absent root and an EMPTY root key string would frame
   identically (`0:`), so the parser drops any root whose `u` is
   missing/empty/non-string (tolerant-drop, like a malformed `ref`) —
   junk roots never reach verification from the wire, and the dn2
   verify-fallback stays safely gated on root absence. Because NESTED
   envelopes (a boost `orig`, future bundle items) bypass the parser,
   `verify()` itself also rejects a present root failing the same
   predicate (shared `isWellFormedRootRef`) — otherwise the trivial
   graft `{u:'',addr:''}` (frames `0:0:`, identical to absent) would
   verify on a root-less signature.
5. Mixed-era: messages without `root` keep working everywhere (it is an
   optimization/completeness field, not a correctness gate).

## Acceptance Criteria

- Unit: canonical payload includes the root token (and its absence is
  distinct from any present value); sign/verify round-trip with and
  without root; send-path root derivation (parent-with-root,
  parent-is-root, unknown → omitted); DM copy recipient set (parent
  author, root author, dedupe when identical, never SELF).
- Integration (local relay): A posts; B replies; C (met B, in the DM
  path) replies to B's reply → A receives C's reply copy despite C's
  parent being B's message; C's envelope carries `root` = A's post.
- `pnpm test` + `pnpm test:integration` + `pnpm check` green.

## Current Status

Implemented (2026-07-07, see DEVLOG). Envelope `root`, dn3 canonical payload
with dn2 verify-fallback, send-path `deriveRootRef`, root DM copy (via new
`ensureContactIdByAddr`), and read-side `ParsedWire.root` all landed with unit
tests (attest/envelope/wire/server/boost-embed) + an integration test.

Post-review hardening (same day): the root ref's ADDR is now signed as its
own dn3 frame (`rootAddr`, directly after `rootToken`) — it is a routing
target, not display attribution — and `parseEnvelope` drops malformed/
empty-`u` roots so the empty-key-string graft can't ride a signed root-less
envelope. dn2 fallback unchanged.

`pnpm test` (771 unit tests) and `pnpm check` green. Integration
(`tests/integration/thread-root-ref.test.ts`) proves C's deep reply carries the
signed `root` = A's post (uuid + addr) on the wire — the load-bearing property.

**OPEN — cold root DM delivery.** The root DM copy to a NEVER-MET root author
fails at the DC core level (`e2e encryption unavailable`): the substrate's only
key-exchange path is securejoin, and A's key never reaches C. This contradicts
the issue's "chatmail serves keys for first-contact encryption" premise — there
is no cold-first-contact send in the codebase today. Per this issue's
instruction, the topology was NOT weakened; the copy is best-effort (logged +
swallowed) and the reply/feed/parent copy still succeed. A substrate key-fetch/
gossip path is needed to make the cold copy deliver (fold into thread-auto-
backfill). Two-party threads (root == a met contact) are unaffected.

## Dependencies

Blocks: thread-auto-backfill, thread-subscribe.
