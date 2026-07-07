# Flaky e2e: public-timeline stale-response test races the reload

## Summary

`public timeline ignores stale responses from a superseded request`
(frontend/src/routes/public-timeline.e2e.ts) failed on CI (run 28882646295,
first-ever occurrence) while green locally on the same commit.

The mock holds request #1 forever and answers request #2. The test assumes
the pre-reload page fires its timeline request before `page.reload()` runs.
On a slow runner the reload can interrupt the first page before that fetch
was issued — then the POST-reload request becomes request #1, is held
forever, and `public-timeline-list` never renders.

## Fix

Deterministically wait for the first request to be in flight before
reloading (`expect.poll(() => requestCount).toBe(1)`), preserving the
test's intent: a stale response from a superseded request must not clobber
state.

## Acceptance Criteria

- The test encodes the ordering it assumes; no timing dependence on runner
  speed. Passes locally and on CI.
