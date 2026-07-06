# No broken images: default header and avatar

## Summary

Account entities point `header` at `{base}/deltanet/header.png`, but the daemon
has no such route — profiles render a broken-image banner. Avatars have an SVG
fallback but it sits behind `requireTransport` and 401s in odd states.

## Requirements

- `GET /deltanet/header.png` serves a pleasant default banner (generated SVG
  gradient is fine; correct Content-Type).
- Avatar route always returns an image for a valid contact id: contact profile
  image if present, otherwise the generated placeholder — never a 401/404 for
  image requests while configured.
- Placeholder avatar uses the contact's initial and stable per-contact color
  (contacts carry a `color` field) instead of a fixed glyph.

## Acceptance Criteria

- Fresh profile and timeline views show no broken-image icons (banner, avatar).
- Unit tests cover the header route and avatar fallback content types.
