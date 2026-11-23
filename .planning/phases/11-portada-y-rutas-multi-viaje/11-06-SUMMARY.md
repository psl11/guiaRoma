---
phase: 11-portada-y-rutas-multi-viaje
plan: 06
subsystem: routing-legacy-redirect
tags: [nuxt, unhead, playwright, github-pages, redirect, routing]
status: complete

requires:
  - phase: 11-05
    provides: "app/pages/index.vue as the home page (title «Guías de viaje» + <TripIndex />)"
  - phase: 11-03
    provides: "Roma at /guiaRoma/trips/roma/ and the harness ROMA_URL/ROMA_HTML/OUTPUT_DIR"
provides:
  - "app/pages/index.vue: LEGACY_TRIP = 'roma' migration constant + inline head script legacy-hash-redirect (critical, before the first stylesheet) that location.replace()s ^#[a-z0-9-]+$ hashes to base + 'trips/roma/' + hash"
  - "tests/parity/_pagesServer.ts: startPagesServer(outDir, port, base?) — in-process node:http server that behaves like GitHub Pages (301 to trailing slash, …/index.html 200, 404.html, contained inside outDir)"
  - "tests/parity/legacy-redirect.spec.ts: 7 redirect tests × 2 projects in the gate (port 5850 + TEST_WORKER_INDEX)"
affects: [11-07 portada parity specs (can reuse startPagesServer) and the gate count re-registration in tests/README.md]

actuals:
  tokens: 4545
  tasks: 2
  commits: 2
plan_head_before: 31db2d622436e5bf42624253c11b966b3004740d
plan_head_after: 1cb93b54693bfdf7b8dfb79c46022c05c89d1fcf

tech-stack:
  added: []
  patterns:
    - "Pre-paint inline script via useHead script[] with tagPosition 'head' + tagPriority 'critical' and a destination serialized at build time with JSON.stringify (no runtime string building from input)"
    - "Redirect tests start from another document (favicon.svg) so the script runs on a document load; Back is checked with history.length + waitForURL"
    - "Anchor-position tests hold image requests pending (no abort, no fulfill) so no fallback swap reflows content above the anchor"

key-files:
  created:
    - tests/parity/_pagesServer.ts
    - tests/parity/legacy-redirect.spec.ts
  modified:
    - app/pages/index.vue

key-decisions:
  - "Anchor-position tests leave image requests pending instead of aborting them: with aborted images mobile #gastronomia lands at 3694/3799/3904/4009 px even between two direct loads (105 px steps, lazy-image fallbacks racing the anchor scroll); with pending images redirect and direct load match on every run (124 px for #viernes/#pantheon/#gastronomia, both projects)"
  - "settledTop waits for Nuxt hydration (useNuxtApp().isHydrating === false) and 20 stable frames of scrollY + scrollHeight, because Roma smooth-scrolls to the hash after mount and scrollY stays 0 until then"
  - "The Back check asserts history.length grows by exactly one entry (favicon → Roma) and then waits for the favicon URL: page.goBack() can resolve on an intermediate same-document navigation of Roma's router"
  - "_pagesServer binds 127.0.0.1 and redirects with the encoded url.pathname (writeHead rejects decoded non-ASCII Location values); decodeURIComponent failures answer 404"

patterns-established:
  - "New Pages-like specs use startPagesServer(OUTPUT_DIR, port) in beforeAll and server.close() in afterAll; no temp copy, no child process"

requirements-completed: [ROUTE-03]

duration: ~45min
completed: 2026-11-20
---

# Phase 11 Plan 06: Legacy anchor redirect Summary

**Old shared links `/guiaRoma/#viernes`, `/guiaRoma/#pantheon` and `/guiaRoma/index.html#gastronomia` now land on the same anchor in `/guiaRoma/trips/roma/` with no history entry. A critical inline head script on the home page does this, and 7 gate tests check it against a server that behaves like GitHub Pages.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-11-20
- **Tasks:** 2 / 2
- **Files modified:** 3 (1 modified, 2 created)

## Accomplishments

- `app/pages/index.vue` declares `LEGACY_TRIP = 'roma'` and, in the same `useHead` as the title, the script `key: 'legacy-hash-redirect'`, `tagPosition: 'head'`, `tagPriority: 'critical'`. The built portada emits `<script data-hid="legacy-hash-redirect">(function(){var h=location.hash;if(/^#[a-z0-9-]+$/.test(h)){location.replace("/guiaRoma/trips/roma/"+h)}})()</script>` at head offset 175, before the first stylesheet at 320. `trips/roma/index.html` does not contain the script. The base comes from `useRuntimeConfig().app.baseURL`, so no literal `/guiaRoma/` appears in code.
- `tests/parity/_pagesServer.ts` serves `.output/public` under `/guiaRoma/` the way Pages does: `/guiaRoma` and `/guiaRoma/trips/roma` get a 301 to the trailing-slash form, `index.html` is served inside directories, unknown paths get a 404 with the build's `404.html`, and every path is contained inside `outDir`.
- `tests/parity/legacy-redirect.spec.ts` has 7 tests, each passing on mobile and desktop:
  1. `/#viernes` lands on `/trips/roma/#viernes`, in the viewport, at the same `top` as a direct load. History grows by one entry, and one Back press returns to the favicon.
  2. The static check finds the script in the head before the CSS, with `location.replace`, the pattern and the destination `JSON.stringify(ROMA_URL)`. Roma's page does not contain it.
  3. `/#pantheon` lands where a direct load does (±2 px) and gets no `.highlight`.
  4. `/index.html#gastronomia` lands where a direct load does (±2 px) and gets no `.highlight`.
  5. `/guiaRoma/` without a hash stays on the portada.
  6. `#Bad_Hash`, `#a/b` and `#%3Cscript%3E` stay on the portada with the hash intact and no `nav.nav-pills`.
  7. `/guiaRoma` returns 301 with `location: /guiaRoma/`, and `/guiaRoma/trips/roma#viernes` ends at `/guiaRoma/trips/roma/#viernes` with 12 `.nav-pill`.
- Measured `top` of `#viernes` after the redirect: **123.94 px (mobile) / 123.91 px (desktop)**, identical to a direct load. The research measured 124 px. With pending images, `#pantheon` measures 123.7 px and `#gastronomia` 124.4–124.5 px, also identical to a direct load in every run.

## Task Commits

1. **Task 1 (tracer): the home-page script, the build, the Pages-like server and the browser test for `/#viernes`, including Back** - `d9c19b6` (feat)
2. **Task 2: deep anchors, index.html, no hash, invalid hashes and the Pages 301, plus the full gate** - `1cb93b5` (test)

**Plan metadata:** the docs commit follows this SUMMARY.

## Files Created/Modified

- `app/pages/index.vue` - adds `LEGACY_TRIP` and the `legacy-hash-redirect` inline head script, with a header comment explaining why it sits in the head with critical priority, why it uses `location.replace`, why there is no whitelist, and that `index.html` is the same page.
- `tests/parity/_pagesServer.ts` - `startPagesServer(outDir, port, base = '/guiaRoma/')`, the in-process server that behaves like GitHub Pages.
- `tests/parity/legacy-redirect.spec.ts` - the 7 ROUTE-03 redirect tests.

## Verification

- Head-order probe after a clean `nuxi generate`: exit 0 (s=175 < c=320, Roma has no script).
- `playwright test -c playwright.gate.config.ts tests/parity/legacy-redirect.spec.ts`: 14/14 passed. With `--repeat-each 4` in parallel: 56/56 passed, and every position matched exactly.
- `eslint app/pages/index.vue`, `eslint --no-ignore` on both new test files, `nuxi typecheck` and `vitest run tests/unit` (301/301): all clean or green.
- `pnpm verify`: exit 0. Results: unit 301/301, data 377/377, parity **96 passed (1.1m)**, 56 goldens with no `--update-snapshots`. The known mobile scrollspy flake passed at 29.6 s.
- `playwright test --list` on the gate prints `Total: 96 tests in 12 files`.
- `playwright.trips.config.ts` (run after verify, never at the same time): 19/19 passed.
- Acceptance greps: all match. `git diff --quiet 6315f26 -- … app/assets/css/` exits 1 only because of `app/assets/css/multitrip.css`, which plan 11-05 added (allowed). `base`, `tokens`, `fonts` and `leaflet.css` are unchanged. Against this plan's start commit (`31db2d6`) the same diff exits 0, and golden.spec.ts, its snapshots and tests/README.md are untouched.

## Decisions Made

See `key-decisions` in the frontmatter. The main one is that position tests hold image requests pending instead of aborting them, so the landing position is deterministic.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Back assertion resolved on an intermediate navigation**
- **Found during:** Task 1
- **Issue:** `page.goBack()` resolved while the URL was still `/trips/roma/#viernes`. Roma's router performs an intermediate same-document navigation, and a probe confirmed the page reaches `favicon.svg` a moment later from the same single Back press.
- **Fix:** after `goBack()`, `waitForURL(favicon)`. The test also asserts `history.length === before + 1`, which is stronger evidence that `location.replace` leaves no extra entry.
- **Files modified:** tests/parity/legacy-redirect.spec.ts
- **Commit:** d9c19b6

**2. [Rule 1 - Bug] Anchor positions were not deterministic with aborted images (test design)**
- **Found during:** Task 1 (`#viernes` on mobile: 123.9 vs 128.9 px) and Task 2 (`#gastronomia` on mobile under `--repeat-each`)
- **Issue:** the research said to measure after `networkidle`, `fonts.ready` and two rAF with images aborted. That design gave varying positions. Roma smooth-scrolls to the hash after hydration, so the first measurement caught it mid-scroll. Worse, with aborted images, lazy-image SVG fallbacks change the layout above the anchor before or after the scroll at random. Mobile `#gastronomia` varied in 105 px steps (3694 to 4009 px) **even between two direct loads**, so no ±2 px comparison could be stable.
- **Fix:** position tests use `holdImages`, which leaves image requests pending: no `onerror`, no swap, no reflow. `settledTop` waits for DOMContentLoaded, `useNuxtApp().isHydrating === false`, `fonts.ready`, two rAF and 20 stable frames of scrollY and scrollHeight. Result: redirect and direct load are identical in every run on both projects. The ±2 px tolerance is unchanged, and `toBeInViewport` is still asserted only for `#viernes`. Tests 4–6 keep the abort-based `isolate()`.
- **Files modified:** tests/parity/legacy-redirect.spec.ts
- **Commits:** d9c19b6, 1cb93b5

**3. [Rule 2 - Hardening] Pages-like server**
- The server binds to 127.0.0.1, which the threat model requires (T-11-17), so the spec origin is `http://127.0.0.1:<port>`.
- It redirects with the encoded `url.pathname`, because `writeHead` throws on non-ASCII Location values.
- A malformed `decodeURIComponent` input answers 404.
- Containment is checked with `resolve()` plus a prefix check against `outDir + sep`.
- **Commit:** d9c19b6

**Total deviations:** 3, all in test infrastructure. Application behavior follows D-14 exactly: no whitelist and no `hashchange` listener.

## Issues Encountered

None beyond the deviations above.

## Threat Flags

None. The new server listens only on 127.0.0.1 during the suite. The redirect has a fixed same-origin destination and a validated hash suffix (T-11-15/T-11-16), and the invalid-hash test covers `#a/b`, `#%3Cscript%3E` and `#Bad_Hash`.

## Known Stubs

None.

## Next Phase Readiness

- 11-07 can reuse `startPagesServer` for `portada.spec.ts`. It should re-register the gate count in tests/README.md: 96 / 12 now, 110 / 13 after 11-07.

## Self-Check: PASSED

- FOUND: app/pages/index.vue, tests/parity/_pagesServer.ts, tests/parity/legacy-redirect.spec.ts
- FOUND: d9c19b6, 1cb93b5 (ancestors of HEAD)
