# Chatmail federation vs the fediverse

An extended exploration: where email-substrate federation matches
ActivityPub-style federation, where it clashes, what UX has to change, and
what becomes possible that the fediverse can't do. Written after building
and QA-ing deltanet v0 (2026-07-06); hard facts in
[substrate-audit.md](substrate-audit.md). Nothing here is a work order —
it's the map.

## 1. The one-sentence difference

The fediverse federates **documents between servers** (fetchable objects,
server-held identity, public by default); chatmail federates **messages
between people** (store-and-forward deliveries, key-held identity, private
by default). Everything below is a consequence of that inversion.

## 2. Where the models match (better than expected)

- **Follow/post/reply/boost/like semantics map cleanly.** We implemented
  the full Mastodon interaction vocabulary; a stock Pleroma frontend can't
  tell the difference. Follows-as-securejoin even improves on AP follows:
  they're mutual key verifications, so every follow edge doubles as an
  authenticated channel (which our reply-DMs and reaction-DMs then reuse).
- **Store-and-forward beats inbox-POST-with-retries.** An AP server must be
  up to receive; a deltanet node can be a laptop. The relay holds 20 days of
  undelivered mail. Push via IMAP IDLE gives ~seconds end-to-end latency —
  our streaming UI measures ~6s post-to-render across nodes.
- **Deletion and edits are *stronger* than fediverse practice.**
  `Chat-Delete`/`Chat-Edit` propagate to all recipients and compliant
  clients honor them (we verified cross-node unboost deletion live). AP
  `Delete` activities are famously best-effort against caches and forks of
  the data; here there are no server caches to go stale.
- **Fan-out economics are fine at human scale.** One post = one body
  encryption (symmetric channel secret) + envelope chunks of ≤999
  recipients, under a 60/min send budget. A 10k-follower feed costs ~11
  submissions per post. The ceiling is real but far away; the fediverse's
  equivalent ceiling (instance-to-instance delivery queues) is also real
  and arrives in the same order of magnitude.
- **Spam posture is arguably better.** Chatmail relays do zero content
  filtering and rely on mandatory encryption + strict DKIM; you can only be
  spammed by someone you gave a channel to (followed, or DM'd). The
  fediverse's open inboxes accept anything and moderate after the fact.

## 3. Where they clash (the honest list)

### 3.1 There is no public

The deepest clash. Outbound cleartext is **impossible** on chatmail relays
(hard 523) — so there is no publicly-fetchable post, no anonymous web view,
no crawlers, no link-preview embeds, no "look at this thread" URL you can
hand a non-user. "Public" in deltanet means *anyone may subscribe without
approval* — subscription-scoped visibility, not world-readable documents.
Our early idea of a plaintext mailing-list + public-inbox web archive
cannot run on chatmail infrastructure; it would need a classic mail host
(where core caps recipients at 50/transaction) or a dedicated
archive-subscriber node that republishes to the web — a design worth its
own document if we ever want web presence.

**UX consequences:** the "Federated" tab is a fiction (we render it as
home); logged-out timelines can only show your own node's view; "share
post" can only mean share-into-the-network, never share-to-the-web.

### 3.2 Discovery doesn't exist

No WebFinger, no instance directories, no hashtag federation, no full-text
search across the network, no trending. Identity resolution requires either
an invite link (capability, not name) or an address you can already mail.
The fediverse's serendipity machine — hashtags, federated timelines, boosts
of strangers you can then browse — has no substrate equivalent. Boosts help
(they embed the original SSB-style, and our invite-request convention lets
you follow the boosted author) but the *browse a stranger's history*
affordance is capped at the 10-message join backfill.

**UX consequences:** invite links are the real handles — they belong in
bios, QR codes, directories; search must be reframed as "resolve" (address
or invite in, profile out); profile pages of remote users are inherently
sparse until you've followed them a while. A community-run directory (a
deltanet node that aggregates opt-in profile cards and serves them as a
feed) is the natural, substrate-compatible answer.

### 3.3 Interaction visibility is point-to-point

Reactions and reply-notifications travel as DMs to the author. Counts are
authoritative **only on the author's node**; a follower sees a post's true
reply count only for replies that also traveled the feed. The fediverse has
a soft version of this problem (remote counts are routinely wrong) but
deltanet has it structurally. Fixable-by-convention: the author's node
could periodically gossip tally digests into the feed ("reaction gossip"),
trading a little feed noise for eventually-consistent counts.

### 3.4 The relay is a bus, not an archive

20-day retention, 500 MB quota, oldest-first eviction. All durable state is
client-side (the DC SQLite db is the source of truth — and it holds your
private key, so the data dir *is* the identity). Fediverse instances are
archives; a deltanet node that loses its disk without a backup is gone
*as an identity*, not just as data. And a node that merely sleeps 90 days
loses its relay account entirely.

**UX consequences we should eventually own:** first-class backup (core has
encrypted export + device-to-device transfer — we expose none of it);
"your account expires if unused for 90 days" belongs in onboarding; a
second device is also a live backup (self-sync messages exist in core).

### 3.5 Identity is a key, and keys are sharp

Fingerprint = identity. Key rotation = new contact on every peer (we
watched contact ids shift). Address without key = a *different* contact
row. There's no password-reset equivalent; there's also no
server-confiscates-your-account equivalent — both facts are the same fact.
Our API currently exposes ephemeral contact rowids as account ids — works
single-node, but the stable external identifier should be the fingerprint
(with address as display). Design debt worth paying before anything
multi-client.

### 3.6 Moderation has no admin layer

No instances → no instance admins, no defederation, no shared blocklists,
no report-to-admin. Everything is personal: block, unfollow, don't grant
invites (locked-account mode). This is coherent — the network is
subscription-scoped, so the blast radius of a bad actor is people who
opted in — but tooling like shareable personal blocklists ("I trust
carol's blocklist" as a subscribable feed!) would be the native shape of
collective moderation here.

### 3.7 Our conventions vs their spec

Chatmail has a real spec (spec.md) with header-based conventions —
reactions are RFC 9078, edits/deletes are Chat-* headers, all inside
protected headers. Our wire convention (text markers: `↳re`, `♻`, `⚑`
uuids, reaction DMs) is body-level and deltanet-private, chosen because
read-only channels block members' native reactions and JSON-RPC doesn't
let us set custom headers. If deltanet's convention should ever be a spec
others implement, the idiomatic move is Chat-*-style protected headers —
which needs core cooperation (an RPC for custom headers), worth an
upstream conversation. Also worth adopting where possible today:
formatting our reaction DMs per RFC 9078 so vanilla clients render them
as reactions, and setting In-Reply-To on replies so vanilla DC threads
them.

### 3.8 Version coupling

Broadcast channels went experimental→official *recently*; the wire format
changed and old channels broke. Our feed primitive is the least-stable
part of core, and there's no spec for it yet. Pin core versions
deliberately; expect migrations.

## 4. What deltanet can do that the fediverse can't

- **E2EE social by default.** Followers-only means *cryptographically*
  followers-only. No instance admin reads your posts; a subpoena to the
  relay yields ciphertext plus envelope metadata. The fediverse cannot
  offer this without becoming something else.
- **Offline-first nodes.** Laptop-as-instance is a real deployment. Posts
  queue at the relay; the node catches up on wake (our backfill handles
  ingestion). No fediverse software survives its server sleeping.
- **Messenger interop.** Every deltanet feed is *readable today* by ~any
  Delta Chat user as a channel; replies land as chats. The social network
  and the messenger are one substrate — the DM tab isn't a bolted-on
  feature, it's literally the same transport as everything else. Nothing
  in the fediverse bridges to a messenger this natively.
- **Posts that are programs (webxdc).** A sandboxed HTML app as a post,
  with synced state (100 KB updates, full replay for late joiners) and an
  optional sub-second P2P realtime channel (iroh, 128 KB msgs, no server).
  Concretely: real polls (not Mastodon's fake-consistency polls),
  collaborative posts, embedded games, live blogs, presence. This is the
  single biggest capability gap *in deltanet's favor* — nothing in
  ActivityPub is even shaped like it. Caveat: webxdc doesn't ride the
  join backfill, so app-posts are invisible to brand-new followers until
  they receive an update.
- **Live layer without servers.** The iroh realtime channel is a
  peer-to-peer transport we get for free — typing indicators, live
  reaction bursts during events, ephemeral presence — none of it touching
  the relay or persisting anywhere.
- **Location as a native type.** Streaming location share and POI
  messages exist in core with KML wire format — "I'm here" posts and live
  meetup maps are substrate-native, not an app-layer hack.
- **Cheap, disposable, unlinkable identities.** Instant no-question
  signup on any relay; identities cost nothing and don't cross-link.
  (The fediverse's account creation is gatekept by instance policy and
  identity is permanently instance-branded.)
- **Verified edges everywhere.** Every follow is a securejoin — mutual
  fingerprint verification. The fediverse has no notion of a verified
  follow at all.

## 5. UX changes deltanet should make (someday list, in rough priority)

1. **Backup & second-device onboarding** — the data-dir-is-identity fact
   demands it (core support exists; we expose nothing). Include the
   90-day-expiry warning.
2. **Reframe discovery UI** — invite-link-first sharing surfaces, a
   "resolve" box instead of search, and an opt-in directory story.
3. **Honest timeline labels** — drop or repurpose "Federated"; consider
   "Channels you follow" language over instance-speak.
4. **Reaction gossip** — author-published tally digests so followers see
   counts; also fixes the "reactions look broken to third parties"
   perception from QA.
5. **Stable account ids** — fingerprint-keyed identities in the API.
6. **Interop touches** — RFC 9078-formatted reaction DMs, In-Reply-To on
   replies, so vanilla Delta Chat renders our interactions natively.
7. **Locked-account mode** — deny-list/approve flow for invite-request
   auto-grants (hook exists).
8. **Web presence bridge (big, separate design)** — an archive-subscriber
   node republishing opted-in public feeds to the web, restoring
   link-shareability without touching the E2EE path.

## 6. Open questions we're parking

- Should the wire convention move to protected headers (needs upstream
  RPC support), and should we propose it as a chatmail extension spec?
- Group/community primitive: symmetric group chats exist and are
  encrypted — a "forum" mapping (Lemmy-shape) is unexplored.
- Multi-relay identity: same key on two relays as relay-failure
  insurance — does securejoin re-verification make this viable?
- Webxdc-native posting: is the right post format eventually *an app*
  (with its own comment state, backfill via update replay) rather than
  text + markers? The update-replay property is strictly better than the
  10-message backfill.
