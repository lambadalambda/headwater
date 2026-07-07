# Visibility tiers via multiple channels (public + locked)

## Summary

Design sketch #1 (docs/design-sketches.md). One account owns two broadcast
channels: a public one (invite-requests auto-granted, link meant for
publication) and a locked one (grants require approval). The Mastodon
visibility selector maps onto them instead of being decorative.

## Requirements

- Transport/daemon: manage two owned channels (create lazily; persist
  chat ids in config like the current feed). `public` visibility posts →
  public channel; `private` → locked channel. Timeline/stats/statuses
  aggregate both plus followed feeds as today.
- Locked grants: invite-requests scoped to the locked channel queue for
  approval instead of auto-granting (approve/deny via API — map onto
  Mastodon follow_requests endpoints, which the frontend already
  understands). Public channel keeps auto-grant.
- Followers of both channels shouldn't get duplicate copies of public
  posts... decide: post public → public channel only; locked followers
  implicitly follow public too (grant both on locked approval). Document
  the choice.
- Relationship/counters: follower counts aggregate channels; relationship
  `following` true if following either; expose which tier somewhere
  sensible (pleroma extension field is fine).
- Invite endpoints (`/api/deltanet/invite`) gain a channel parameter;
  share-your-feed UI shows the public invite by default.
- Existing single-feed accounts migrate seamlessly: current feed becomes
  the public channel.

## Acceptance Criteria

- Posting with visibility public/private from the composer delivers to
  the right audience (integration: locked follower sees both tiers,
  public-only follower sees only public).
- Locked channel follow-request flow works end to end via the frontend's
  follow-request UI.
- No duplicate timeline entries for dual-tier followers.
