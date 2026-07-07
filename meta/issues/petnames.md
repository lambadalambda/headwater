# Petnames: locally-assigned names, shown as a pill after the chosen name

## Summary

Display names are self-chosen, so impersonation ("Carol Sparkle" #2) is
trivial. Petnames are the real fix: a name *I* assign to a contact, bound
to their key identity, rendered as a visually distinct pill after their
self-chosen name — "Carol Sparkle ⟦carol⟧". A fake Carol has no pill.

## Substrate findings

DC core already implements the data layer:

- `Contact.authName` = the name they chose; `Contact.name` = my local
  override; `displayName = name || authName`. `changeContactName(accountId,
  contactId, name)` sets the override. The contact row is a KEY-contact, so
  the petname binds to the cryptographic identity, not the string.
- Because the whole UI (and the daemon's mention `display_name`) renders
  `displayName`, a petname set via core already propagates everywhere —
  timelines, notifications, the reply pill. What's missing is setting it,
  and rendering BOTH names instead of silently substituting.

## Design

- Daemon: ship both names on account entities (e.g.
  `pleroma.deltanet: { auth_name, petname }` where petname is present only
  when `name !== authName`), and mirror onto mention entries so the reply
  pill can render the petname pill too. Endpoint to set/clear:
  `POST /api/deltanet/contacts/:id/petname { petname }` (empty clears →
  core falls back to authName). Cache invalidation: the transport caches
  self display name only; contact reads are live — verify.
- Frontend: name row renders `authName` first, petname as a distinct pill
  (chip chrome: background + tag icon — NOT plain text, so a display name
  containing pill-lookalike glyphs doesn't pass). "Set petname" affordance
  on the profile page.
- Scope note: petnames attach to DC contact rows; embed-only strangers
  (verified embeds, held envelopes — no contact yet) can't carry one until
  introduced. Render only the key badge (see
  [[key-identity-badge]] / issues/key-identity-badge.md) for those.
- Synergy: the autocomplete issue
  (issues/mention-addressing-autocomplete.md) should match + rank petnames
  first.

## Acceptance Criteria

- Setting a petname on Carol's profile shows "Carol Sparkle ⟦carol⟧"
  everywhere her name renders (timeline header, boost line, notifications,
  reply pill, profile), live, without restart.
- A different account with the same self-chosen name shows NO pill.
- Clearing the petname reverts to authName-only.
- Petnames survive backup/restore (they live in dc.db → already in the
  core backup; assert in the restore integration test).
