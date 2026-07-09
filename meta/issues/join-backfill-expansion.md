# Expanding the new-follower backfill (10 → N)

## Summary

Design sketch #4. A new follower only receives core's ~10 most recent
channel messages (`resend_last_msgs()` / `N_MSGS_TO_NEW_BROADCAST_MEMBER`
in core's constants.rs — it runs on OUR device, not the relay). Older
history is invisible unless thread-backfill happens to chase refs into it.

## Paths (ranked in the sketch)

1. **Upstream a config knob** to core (the feature is recent and the area
   active) — cleanest, no wire changes.
2. **App-layer backfill bundles**: on `SecurejoinInviterProgress` our
   daemon serves older posts to the joiner. Today this machinery EXISTS
   (envelope-bundles + held envelopes + verify-at-render + key pins from
   the self-served-bundle rule) — a "welcome bundle" of the author's own
   recent signed posts would slot into the current held/confirmation
   pipeline almost directly. Needs: a joiner-side policy for admitting
   self-served author posts into the FEED timeline (they're the author's
   own envelopes over a direct channel — stronger than normal held
   content), plus rate-limit-aware chunking (60/min relay budget).
3. Patched core binary — avoid (fork maintenance).

Locked-channel interaction: welcome bundles for the locked channel must
respect visibility (see visibility-leak-prevention) — only send locked
history to LOCKED joiners.

## Acceptance Criteria

- A brand-new follower sees substantially more than 10 posts (configurable
  N) within a bounded time after joining, rate-budget-respecting.
- Served history verifies (signed envelopes; the self-served-bundle rule
  pins the author on the joiner immediately — nice side effect).
