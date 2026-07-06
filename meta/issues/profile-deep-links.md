# Profile deep links fail outside in-app navigation

## Summary

Typing a profile URL directly (e.g. `/app/profiles/12` or
`/app/profiles/@user@relay`) shows "Record not found"; profiles only load
via in-app links (which percent-encode the handle). Found during follow-back
verification. Likely the route-param decode/lookup path in the frontend
differs from what the daemon's lookup endpoint expects for hand-typed forms.

## Acceptance Criteria

- `/app/profiles/<contact-id>` and `/app/profiles/@user@relay` (typed into
  the address bar) both render the profile.
