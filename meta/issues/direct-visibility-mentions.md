# "Direct" visibility: mentioned-people-only delivery

## Summary

Noted during visibility part 1. The composer's fourth visibility,
`direct`, still posts publicly. With mention delivery built, direct maps
naturally: NO channel post at all — sign the envelope and DM-copy it to
each mentioned key-contact only (the existing deliverMentionCopies path),
render it as visibility 'direct' locally.

Decisions to make:
- No mentions + direct → 422 (nothing addressable) or self-note?
- Recipient side: a direct post arrives as a content DM — it must NOT
  enter the home feed timeline (DM chat, already excluded) but should be
  reachable: thread view + notifications (the mention notification
  already fires). Probably also Mastodon's direct timeline / chats
  surface — decide how it renders.
- Leak guards: direct posts join lockedPostUuids-style guards (never
  served, never boostable) — strictest tier.

## Acceptance Criteria

- Direct post reaches exactly the mentioned key-contacts, appears in no
  feed, renders visibility 'direct', notifies recipients, and is refused
  by serve/boost guards.
