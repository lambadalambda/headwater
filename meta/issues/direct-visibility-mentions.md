# "Direct" visibility: mentioned-people-only delivery

## Summary

Noted during visibility part 1. The composer's fourth visibility,
`direct`, still posts publicly. With mention delivery built, direct maps
naturally: NO channel post at all — sign the envelope and DM-copy it to
each mentioned key-contact only (the existing deliverMentionCopies path),
render it as visibility 'direct' locally.

## Requirements

- Until direct delivery is implemented end to end, the daemon must reject
  `visibility: 'direct'` and the frontend must hide or clearly disable the
  option. It must never silently fall through to the public channel.
- Once implemented, direct posts must be delivered only to explicitly
  mentioned key-contacts and must not enter a feed channel.

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

- At every intermediate state, selecting or submitting `direct` cannot
  publish the post to the public or locked feed channel.
- Direct post reaches exactly the mentioned key-contacts, appears in no
  feed, renders visibility 'direct', notifies recipients, and is refused
  by serve/boost guards.
