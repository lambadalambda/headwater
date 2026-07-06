# 08 Build signed-out OAuth landing

## Summary

Implement the signed-out landing experience and OAuth-first sign-in/sign-up card.

## Requirements

- Add sticky landing header with brand, navigation links, browse public, and sign-in CTA.
- Add hero with eyebrow chip, large serif headline, lede, and stats strip.
- Add OAuth sign-in tab with home-server field, recent servers dropdown, and three-step authorization indicator.
- Add create-account tab with server cards and code-of-conduct checkbox gate.
- Add redirect state animation from PleromaNet to the selected server with cancel control.
- Add manifesto band, public timeline preview with fade CTA, trending and instance metadata side cards, house rules, and footer.
- Avoid password-based sign-in UI; PleromaNet should not collect passwords.

## Acceptance Criteria

- Playwright tests cover switching sign-in/sign-up tabs, selecting a server, checkbox-gated create account CTA, redirect state, and cancel.
- Landing page is responsive at desktop and mobile widths.
- Text clearly communicates OAuth handoff and that passwords are handled by the user's Pleroma server.

## Notes

- This can initially use mocked OAuth flow state. Real OAuth registration and callback handling belong in the API/auth issue.
