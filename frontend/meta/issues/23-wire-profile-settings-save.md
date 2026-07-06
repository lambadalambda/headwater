# 23 Wire profile settings save

## Summary

Connect the profile settings form to the Pleroma account update API and reconcile the authenticated account state.

## Dependencies

- 11 Add reactive auth state and session lifecycle.
- 12 Add Pleroma UI adapters and request-state components.
- 13 Extract authenticated app shell into guarded real routes.

## Requirements

- Populate account/profile settings from the authenticated session or verified account request.
- Save profile settings through `updateAccountProfile`.
- Reconcile the returned account with reactive auth/session state where appropriate.
- Preserve dirty-state, reset, loading, success, and error behavior.
- Keep profile avatar and header upload rows visual-only placeholders; media upload API wiring is out of scope.

## Acceptance Criteria

- Tests cover initial form population, edit dirty-state, save success, save failure, reset behavior, and session/account reconciliation.
- Profile field payload shape is asserted against the typed API boundary.
- Avatar and header upload controls render as disabled or no-op placeholders.
- 401/403 responses trigger the global behavior established by issue 11.
- Existing `/mockup` route behavior and tests continue to pass.
- No default test requires Docker or a live Pleroma instance.

## Current Status

- Done: the form populates from the session account through `profileSettingsFromAccount` (preferring raw `source` note/fields), saves through `updateAccountProfile` with `profileUpdateFromSettings`, and reconciles the returned account into the session, account cache, and shell identity.
- Done: dirty/reset/loading/success states preserved; failures keep the draft and show an error banner; 401/403 saves sign out and redirect to the landing page.
- Done: avatar/header rows remain visual-only placeholders; bio became editable; the username input is disabled (Pleroma cannot change usernames) and the unsupported search-indexing toggle was removed. Show-follower-count maps to Pleroma `hide_followers_count`.
- Covered by `src/routes/app-settings.e2e.ts` (population, payload shape, reconciliation, failure, 401, mobile) and adapter unit tests in `src/lib/pleroma/ui.e2e.ts`.

## Notes

- This issue should not add media upload support.
