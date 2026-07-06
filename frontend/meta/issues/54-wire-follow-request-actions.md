# 54 Wire follow request actions

## Summary

Follow-request notifications rendered inert Accept/Decline buttons (and were actually gated behind `!actionable`, so they never showed in-app). Wire them to the Pleroma follow-request authorize/reject endpoints.

## Requirements

- Add typed client support: `getFollowRequests`, `authorizeFollowRequest`, `rejectFollowRequest`. Verified live on Pleroma.
- Follow-request notification rows show working Accept/Decline in the notifications page and the header popover, with pending and resolved states.
- Accepting/declining reconciles the relationship into the account cache and surfaces failures without losing the buttons; 401/403 sign out.

## Acceptance Criteria

- Mocked tests cover accept (authorize), decline (reject), and a failure that keeps the buttons.
- Client mutation coverage includes the follow-request endpoints.
- Existing notification, design-system, and route tests continue to pass.
- `pnpm run check`, affected Playwright tests, and `git diff --check` pass.

## Notes

- Planned with the user on 2026-07-02.

## Current Status

- Done: `getFollowRequests`/`authorizeFollowRequest`/`rejectFollowRequest` client methods; `NotifRow` self-manages Accepting…/Accepted and Declining…/Declined state around async accept/reject handlers, shown only for `follow_req` rows when handlers are provided. The notifications page and header popover both wire the handlers, keyed by the requester account id from the notification target; success flashes a toast and reconciles the relationship, failure reverts the row and toasts.
- Verified live against fediffusion.art end to end: registered a second account (solving the native captcha), locked sophia, sent a follow request from the second account, accepted it through the app UI, and confirmed server-side that the request cleared and the follower relationship was established — then unlocked sophia, unfollowed, and deleted the test account.
- Covered by accept/decline/failure tests in `app-notifications.e2e.ts` and client mutation coverage. Full suite 290 green.
