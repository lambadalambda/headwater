# Attachment posts sometimes render/ingest as naked JSON (core's transient text suffix)

## Summary

Live QA: an incoming image post sometimes renders as its raw envelope
JSON followed by ` [Image – 137.37 KiB]` (DC core's file-placeholder
summary). Root cause (diagnosed): at the moment our IncomingMsg hook
fires, core's `msg.text` can carry that placeholder appended to the real
text while the attachment is still downloading; the persisted text is
clean afterwards. The trailing junk breaks `parseEnvelope` (JSON.parse
fails), so:

1. The live-streamed status frame shows raw JSON (render symptom).
2. WORSE, persisted: `parseWireUuid` fails at ingest, so the store
   indexes the message under its canonical MID key instead of its uuid
   (live example: carol's msgIdToKey[122] = `<mid>@localhost` for a v2
   post that carries a uuid). Downstream, reactions tally under the uuid
   key (send path re-parses the now-clean text) while the render reads
   the stale mid key → favourites/reactions on such posts never update
   locally, though the author receives them fine.

## Requirements

1. `parseEnvelope` becomes tolerant of TRAILING JUNK: extract the leading
   balanced JSON object (brace scan respecting strings/escapes — cheap,
   pure) and parse that; text after the object is ignored. Doc comment
   names the DC transient-download suffix as the motivation. Leading junk
   still fails (envelopes start at `{`). This fixes render AND ingest.
2. Schema bump + re-index heals existing damage: the version-triggered
   re-index re-derives msgIdToKey/uuid indexes from the (now clean)
   stored texts with the tolerant parser, re-keying mis-indexed messages
   organically. Verify reactions previously tallied under the uuid key
   become visible on the re-keyed status.
3. Regression tests: envelope + ` [Image – 137.37 KiB]`-style suffixes
   (and arbitrary trailing junk, junk containing braces/quotes) parse to
   the envelope; plain chat text starting with `{` but not an envelope
   still degrades; signing/verification unaffected (the canonical
   payload never touched raw text).

## Acceptance Criteria

- Unit: tolerant-parse matrix; re-index re-keys a mid-keyed v2 message to
  its uuid and reaction tallies line up.
- Live (manual, coordinator): carol's /app/thread/122 favourite updates
  after restart; new incoming image posts never render raw JSON.
- `pnpm test` + `pnpm check` green.

## Current Status

DONE (2026-07-07, main-loop implementation — delegation suspended by user).
Tolerant leading-object parse in `parseEnvelope` (string/escape-aware brace
scan; leading junk still fails); store schema v8 forces the re-index that
re-keys mis-indexed messages. Live-verified: carol's mid-keyed image post
re-keyed to its uuid on boot and her stranded favourite rendered (count 1,
favourited true). Unit: tolerant-parse matrix + ingest keying regression.
