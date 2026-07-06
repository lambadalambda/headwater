# 43 Add central account cache

## Summary

Keep Pleroma account data in a central in-memory cache so profile navigation can resolve known handles without account search and repeated account data can be refreshed consistently.

## Requirements

- Track Pleroma accounts by backend account id inside the authenticated app shell.
- Maintain handle/acct indexes that allow cached account lookup from route handles such as `soft.hertz@kolektiva.social`.
- Upsert accounts from timeline, thread, notification, profile, and profile-search responses where account objects are already available.
- Use the cache before falling back to `accounts/search` when loading `/app/profiles/...`.
- Keep direct profile URLs and unknown mention links working through the existing handle-search fallback.
- Refresh authenticated non-self relationship state before rendering profile follow labels.

## Acceptance Criteria

- Tests cover profile navigation from an already-loaded timeline without calling `accounts/search`.
- Tests cover direct profile route fallback through `accounts/search` when the account is not cached.
- Tests cover cached account updates propagating to already-rendered home timeline posts after newer account data arrives.
- Existing profile, thread, and app route tests continue to pass.

## Notes

- This issue should not introduce persistent storage or a broad global state library unless needed.
- Keep URLs handle-based for shareability; account ids can remain an internal cache detail.
- A later normalization pass can move more post rendering fields to account-id joins if this cache proves useful.
