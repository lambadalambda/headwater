# Wire convention v1: logical post UUIDs

## Summary

Message-ID-based refs break for third parties: a reply's two copies have
two mids, and a node holding only one copy (or neither) can't unify or
resolve refs to the other (live case: bob can't resolve lain's reply ref
to carol's DM copy — an unfixable orphan under mid-based refs). Fix at the
protocol level, as proposed by the user: every logical post gets an
author-minted UUID carried in ALL copies; refs target UUIDs.

## Design

1. **UUID marker**: every outgoing status message (feed post, reply,
   boost, AND the DM copy of a reply) carries a marker line with a
   freshly minted UUIDv4; both copies of one logical reply share ONE
   uuid. Pick a glyph consistent with existing markers; tolerant
   final-line(s) parsing like the others. This supersedes the `⚓`
   canonical-mid marker for NEW messages (keep parsing ⚓ for legacy
   data; stop emitting it).
2. **Refs prefer UUIDs**: reply (`↳re`), boost (`♻`), and reaction
   (`↳`) markers target the parent's uuid when the target message
   carries one, else fall back to its mid (legacy targets). Ref tokens
   must be self-describing so parsers know which kind they hold (e.g. a
   `u:` prefix for uuid refs — pick something unambiguous; mids contain
   `@`, uuids don't, which may suffice — document the choice).
3. **Post-key abstraction in the store**: a single logical keyspace —
   `postKey(msg) = uuid ?? canonicalize(mid)`. All derived indices
   (replyChildren keys+values, boostsByMid, ownBoosts, reactions,
   notification dedupe/status refs) key by post key. Resolution:
   uuid→msgId index (prefer the feed copy when both copies are local)
   first, then the existing canonical-mid machinery for legacy refs.
4. Schema v4 re-index (same migration machinery; same data-safety rules:
   no file surgery, Delta Chat databases untouched, nodes heal on
   restart).
5. Vanilla-DC readability: the marker line is one short token line at the
   end, same footprint as existing markers.

## Also fold in (small correctness bug, same file)

`messageToStatus` falls back to `msg.parentId` for `in_reply_to_id`
(entities.ts ~line 303) — Delta Chat sets parentId from email References
to the PREVIOUS MESSAGE IN THE SAME CHAT, which is not authorship-level
reply intent (live case: a reply rendered as replying to an unrelated
post, while its context was empty — inconsistent views). Remove the
fallback: marker/uuid resolution only, null otherwise. The original
replies issue already required this ("stop using parentId"); the fallback
crept back in.

## Acceptance Criteria

- Integration test, third-party topology (fresh accounts): C follows A
  and B; B follows A; A does NOT follow B. A posts; B replies (feed +
  DM copy, one uuid); A replies to B's reply (A holds only B's... A holds
  B's DM copy — A's reply refs B's reply by UUID). On C's node (has only
  feed copies): the full thread renders connected — A's reply resolves to
  B's feed copy via uuid. This is exactly the case mid-refs cannot solve.
- Replies/reactions/boosts between uuid-era and legacy messages still
  work (mixed refs; unit-tested).
- No `parentId`-derived `in_reply_to_id` anywhere (status of a reply
  whose ref is unresolvable is null + empty context, consistently).
- Unit tests: marker round-trip, both-copies-one-uuid, postKey keyspace,
  uuid-first resolution preferring feed copy, mixed legacy refs,
  schema v4 migration.
