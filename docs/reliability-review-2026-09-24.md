# My Day Harbor reliability and scaling review

Reviewed: 24 September 2026. Baseline: published Explore & Grow release (d20b763).

## Verdict
The build and existing functional suites pass. This is not a certification of security or scale readiness. The issues below should be addressed before growth. This review did not modify or republish application code.

## Findings, in priority order

1. **P1 — Silent log truncation can produce incomplete nutrition results.** `app/api/wellness/route.ts` caps results at 1,000 records and `app/api/fitness/route.ts` at 1,500. Neither returns an overflow warning or cursor. Once an individual date window exceeds the cap, history and recommendations use an incomplete dataset without telling the person. Add pagination or complete server-side aggregates, plus an explicit incomplete-result state and a boundary test.
2. **P2 — Homepage refresh and saved interests regressed.** `app/explore-preview/preview.tsx` only refreshes after a button click. The previous homepage in `app/design-preview/preview.tsx` refreshed every five minutes while visible and persisted topic preferences. The new homepage does neither. Restore these behaviors with cleanup and overlapping-request protection.
3. **P2 — Simultaneous profile updates can lose data.** `app/api/fitness/route.ts` reads a JSON profile, edits it in memory, then replaces the stored profile. Two devices saving concurrently can overwrite a new review or profile edit. Add an optimistic version check, return a conflict, and let the user reload/reconcile.
4. **P2 — Request limits are enforced too late or depend on a header.** Account requests only check Content-Length; fitness and wellness read the whole request before checking its length. A missing length header bypasses the account route check. Add bounded streaming reads and reject oversized bodies before JSON parsing. This finding concerns these route-level checks; upstream limits were not verified.
5. **P2 — News cache is local to a running worker instance.** `lib/news.ts` and `lib/tech-leaders.ts` deduplicate requests locally, but new instances can each fetch upstream feeds. The server-rendered homepage calls the feed function directly. Public API cache headers alone do not establish a shared homepage cache. Add a supported shared cache and bounded stale fallback; verify it under parallel requests. The news cold-start all-failed path also does not retain an empty result/backoff, allowing repeated retries during an outage.
6. **P2 — No automated repository check workflow found.** No `.github` workflow directory is present. Existing tests need CI enforcement with build/type checks and a small set of critical UI tests before release.

## Passed checks
- Production build and TypeScript no-emit check.
- Account tests: password validation/hashing, verification, username login, cookies, origin rejection, password recovery, one-use reset tokens and session revocation.
- Fitness tests: calculation gates, diet/allergen exclusions, scheduling, recovery rules, local D1 persistence, cross-user isolation and settings preservation.
- Nutrition tests: portion scaling, missing versus zero values, biotin, logged-day denominator and input validation.
- Tech Leaders: person matching, source links, labels, caching, outages and source isolation.
- Device dates: timezone boundaries, DST, historical dates and stable server rendering.
- Disabled Google integration tests: callback/state/PKCE, linking and ownership protection. Passing these tests does not enable Google login.

## Limits and follow-up
- No production load or stress test was performed; no visitor-capacity number can be justified yet.
- Dependency vulnerability audit could not run: the available runtime has Node but no npm executable. This is NOT a clean dependency-security result.
- Hosted database quota, email quota, backups, restore process, alerts and actual production trusted-IP propagation have not been verified. Local auth tests warn about missing client IP; that alone does not establish a production problem.
- Third-party feed and image availability cannot be guaranteed.
- Test a staged load ramp in an isolated environment; measure p95 response time, errors, worker CPU, database reads/writes and upstream requests. Define capacity only against the measured workload and actual hosting limits.
- Recommended order: fix correctness and homepage regressions; add bounded requests and concurrency handling; establish CI; then shared caching, operational checks and staged load testing.

## Remediation completed in follow-up
- Restored five-minute refresh on visible homepage tabs with overlap protection; saved the selected topic and verified it survives reload.
- Added atomic version checks for fitness profile/review updates. Stale and concurrent saves return a conflict instead of overwriting.
- Added bounded byte-stream reads for account, profile and journal requests, plus news feed body limits.
- Oversized histories now fail explicitly rather than returning misleading partial totals. Pagination for these unusually large per-user windows remains a future enhancement.
- Added location-shared Cloudflare Cache API caching for public feed data, with stale fallback and cold-outage caching. This cache is regional, not a global lock; simultaneous cold misses across locations can still fetch upstream independently.
- Added GitHub Actions for type checks, functional/security regressions, build and production dependency audit. The remote workflow result must be checked; adding it does not prove it has passed.
- Added isolated tests for conflicting saves, stale versions, oversized history, bounded streams, byte counts, cancellation, fifty concurrent feed requests, cross-instance cache reuse and outage fallback.
- Production-scale load testing, verified hosting quotas and backup/restore drills remain outstanding. No paid infrastructure added.
