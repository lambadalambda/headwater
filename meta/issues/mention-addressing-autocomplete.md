# Addressing + display-name autocomplete in the composer

## Summary

Addressing people by their chatmail address is hopeless (random local
parts), and there is no autocomplete. Typing `@` in the composer should
autocomplete over people you know — by their chosen display names — and
inserting one should produce a mention that addresses/notifies them and
renders as the name, not the address.

## Decisions (2026-07-07, picked up)

- **Wire format: mentions are `@local@domain` tokens in the plain body** —
  no envelope change. The body is inside the signed canonical payload, so
  mentions are signed by construction (no dn4 bump, no downgrade paths).
  Both ends parse the same pure token grammar (`parseBodyMentions`).
- **Delivery: mentioned contacts get the VERBATIM signed envelope as a
  control DM** — exactly the reply-DM-copy mechanism, generalized. Send
  side: after posting, resolve each mentioned addr via
  `keyContactIdForAddr` (autocomplete only offers key-contacts, so this
  normally succeeds; unreachable addrs are skipped best-effort) and skip
  the reply parent (it already gets the reply copy). So a mention reaches
  the person even when they don't follow the poster.
- **Notification: the existing `mention` type.** Receive side derives it
  when a fresh content message's body mentions OWN address (skipped when
  the same message already notified as a reply-to-me; deduped by post key
  so the feed copy and the DM copy collapse).
- **Autocomplete: `GET /api/v1/accounts/search`** (which the composer
  already calls — it 404'd into an empty list until now!) over KNOWN
  key-contacts via core's `getContacts(query)`, ranked petname match
  first, then their name, then address.
- **Rendering: mention tokens display as names** — petname wins, else
  their name — with the full address as tooltip; raw random local parts
  never render as labels.

## Notes / open questions (originally filed)

- Candidate pool: contacts we hold (followed feeds + met contacts) via
  the existing search/accounts endpoints; the composer's
  `ComposerMentionEditor` already has an `onMentionQuery` seam and an
  `accounts` list — today it only matches on handles.
- Display: decision needed on how a mention is stored on the wire
  (deltanet wire v2 envelopes are plain text bodies today). Likely a wire
  convention (`@addr` token + render-side name substitution via the
  mentions array, mirroring how the reply footer resolves names), so the
  body stays plain text (decision 0001 allows deltanet-specific
  conventions but content must degrade readably).
- Addressing semantics: does a mention DELIVER to the mentioned person
  (control-DM copy, like reply root-copies) or is it render-only? A
  mention of someone who doesn't follow you can't otherwise see the post
  — delivery via the in-band-introduction machinery is plausible but has
  spam/abuse surface (rate limits, introduction gating) to think through.
- Notifications: mentioned users should get a Mastodon `mention`
  notification (the daemon's notification derivation already handles
  reply notifications; mentions would be a sibling type).

## Acceptance Criteria (draft)

- Typing `@car` in any composer offers "Carol Sparkle"; selecting inserts
  a mention rendering as the name.
- The mentioned user is notified (exact delivery semantics per the
  decisions above).
- Names never silently break when a contact renames; render-side
  resolution follows the current contact name.
