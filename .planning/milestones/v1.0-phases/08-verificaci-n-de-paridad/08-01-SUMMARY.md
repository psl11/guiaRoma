---
phase: 08-verificaci-n-de-paridad
plan: 01
subsystem: testing
tags: [playwright, parity, e2e, leaflet, back-stack, scroll-restore, navigation]

# Dependency graph
requires:
  - phase: 05-navegaci-n-transversal
    provides: "useCardNavigation singleton (navStack/navigateToCard/goBack) + canonical back-stack assertion in navigation.spec.ts:217-242"
  - phase: 06-b-squeda-y-ruta-del-d-a
    provides: "search-route.spec.ts (result→ficha front-half, port 5740, color-mode console gate)"
  - phase: 07-isla-mapa-y-derivados
    provides: "map-fallback-notes.spec.ts (popup→ficha front-half, port 5760, tolerateAborts console gate)"
provides:
  - "Map-popup entry point proves popup→ficha→Volver→scroll-restored→stack-emptied end-to-end (D-05)"
  - "Search-result entry point proves result→ficha→Volver→scroll-restored→stack-emptied end-to-end (D-05)"
  - "Every SC#2 back-stack item now maps to a passing test (timeline + map + search) — full behavioral coverage for the F8 gate"
affects: [08-02, 08-03, F8-gate, visual-diff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "settleScroll() before goBack: wait for the in-flight navigation smooth-scroll (scrollIntoView) to finish before clicking Volver, so goBack's scrollTo does not race it (non-deterministic otherwise on tall mobile layouts)"

key-files:
  created: []
  modified:
    - "tests/parity/map-fallback-notes.spec.ts — SC#2 extended with the back-stack back-half + settleScroll helper"
    - "tests/parity/search-route.spec.ts — result→nav test extended with the back-stack back-half + settleScroll helper"

key-decisions:
  - "Both specs EXTENDED in place (not rewritten); pre-existing test counts preserved exactly (map 12/12, search 10/10) per D-05"
  - "Back-half mirrors navigation.spec.ts:217-242 verbatim: originY capture → #back-btn.show → click(force:true) → expect.poll(scrollY).toBe(originY) → .show gone"
  - "settleScroll added BEFORE the goBack click (and before originY capture) — the popup/result→ficha scrollIntoView smooth-scroll is in-flight when the test would otherwise click Volver, and goBack's scrollTo racing it left the stack non-deterministic on mobile (scroll never converged to originY, .show persisted)"

patterns-established:
  - "Back-stack back-half: capture originY after settle → navigate → assert .highlight + hash unchanged → settleScroll → goBack(force) → poll scrollY toBe(originY) → assert .show gone"

requirements-completed: [PARITY-02]

# Metrics
duration: 24min
completed: 2026-06-23
---

# Phase 8 Plan 01: Verificación de paridad — back-stack gap-fill Summary

**The "Volver restaura el scroll" back-stack is now proven end-to-end from all three entry points — timeline (pre-existing), map popup, and search result — by extending two green specs with the canonical back-half (originY → #back-btn.show → click → scroll restored → stack emptied).**

## Performance

- **Duration:** ~24 min (most spent root-causing a mobile-only scroll race; the net code change is ~45 lines per spec)
- **Started:** 2026-06-23T19:48:37Z
- **Completed:** 2026-06-23T20:13:00Z (approx)
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- **Task 1 — map popup back-half:** `tests/parity/map-fallback-notes.spec.ts` SC#2 now navigates popup→ficha, then clicks "Volver" and asserts the scroll returns to `originY` and the back button loses `.show` (stack emptied). Pre-existing 12 tests all still pass (12/12 across mobile+desktop, 3 consecutive runs).
- **Task 2 — search result back-half:** `tests/parity/search-route.spec.ts` result→navigation test now does the same back-half from the search-result entry point. Pre-existing 10 tests all still pass (10/10 across mobile+desktop, 3 consecutive runs).
- Both back-halves mirror the canonical timeline assertion at `navigation.spec.ts:217-242` exactly. With these two added, every SC#2 back-stack item maps to a passing test.

## Task Commits

Each task was committed atomically:

1. **Task 1: Back-stack back-half from the MAP popup** - `f16b69c` (test)
2. **Task 2: Back-stack back-half from the SEARCH result** - `556c074` (test)

_TDD tasks: these extend existing green specs; the underlying behavior (the F5 `useCardNavigation` controller) was already proven by `navigation.spec.ts`. Each task's added assertion is the RED→GREEN gate — it failed first on mobile (the scroll race), then passed deterministically after the settleScroll fix._

## Files Created/Modified
- `tests/parity/map-fallback-notes.spec.ts` - Added `settleScroll()` helper; extended SC#2 in place with: `originY` capture after settle, then after the existing `.highlight`/hash-unchanged front-half, `settleScroll()` → `#back-btn` has `.show` → `page.click('#back-btn', { force: true })` → `expect.poll(scrollY).toBe(originY)` → `#back-btn` not `.show`. Shared scaffold (port 5760, `ensureBuild`, `trackConsoleErrors`) byte-unchanged.
- `tests/parity/search-route.spec.ts` - Added `settleScroll()` helper; extended the result→navigation test in place with the same back-half from the search-result entry point. Shared scaffold (port 5740, `ensureBuild`, console gate) unchanged.

## Decisions Made
- **Extend, never rewrite (D-05):** Both specs are self-contained (own build+serve under `/guiaRoma/`, strict console gate). I touched only the one front-half test in each file and added a local `settleScroll` helper; the `beforeAll`/`afterAll`/console-gate/ports are byte-unchanged. Test counts stay exactly 12 and 10.
- **Capture `originY` after a `settleScroll`** so the stacked scroll position is a firm origin (mirror of navigation.spec.ts, which settles before capturing).
- **`settleScroll()` before the goBack click** is the load-bearing addition — see Deviations.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Back-half was non-deterministic on mobile until the in-flight navigation scroll was settled before "Volver"**
- **Found during:** Task 1 (map popup back-half), reproduced deterministically when SC#2 ran inside the full file on the `mobile` project (iPhone 12, ~390px).
- **Issue:** The plan's back-half (mirror of navigation.spec.ts) clicks `#back-btn` immediately after the `.highlight` assertion. On the tall mobile layout, the popup→ficha `scrollIntoView({behavior:'smooth'})` (target `#galleria-sciarra` ≈ y 6271) was **still in flight** when the test clicked "Volver". `goBack()`'s `window.scrollTo({top: originY, behavior:'smooth'})` then competed with that in-flight `scrollIntoView`, so the scroll did not converge to `originY` and `#back-btn` kept `.show` (the canonical `.not.toHaveClass(/\bshow\b/)` timed out). Root-cause confirmed by instrumenting the app's `navStack`: `navigateToCard` fired **exactly once** (single push of `originY`) — there was no double-push and no app bug; the race was purely between two concurrent smooth-scrolls observed by the test harness.
- **Fix:** Added a `settleScroll(page)` helper (verbatim clone of `navigation.spec.ts:93-101`: poll `window.scrollY` until two consecutive reads are equal) and call it (a) after `gotoMapMounted`/`gotoHydrated` before capturing `originY`, and (b) after the `.highlight` assertion, **before** `page.click('#back-btn', …)`. With the navigation scroll fully settled, `goBack` runs against a stable position and the single-entry stack empties in one click.
- **Files modified:** `tests/parity/map-fallback-notes.spec.ts`, `tests/parity/search-route.spec.ts` (applied proactively to Task 2 — the search ficha "Pante"→Pantheon is likewise far down the page, same potential race).
- **Verification:** Full `map-fallback-notes.spec.ts` 12/12 and `search-route.spec.ts` 10/10, each across mobile+desktop, **3 consecutive runs** with zero failures; combined run 22/22. App code (`useCardNavigation.ts`) confirmed byte-identical to its original via `git diff` after all diagnostic instrumentation was removed.
- **Committed in:** `f16b69c` (Task 1) and `556c074` (Task 2) — the helper is part of each task commit.

---

**Total deviations:** 1 auto-fixed (1 bug — test-harness race robustness).
**Impact on plan:** The deviation is confined to the test harness; it makes the plan's exact canonical assertion pass deterministically rather than weakening it. The `expect.poll(scrollY).toBe(originY)` + `.show`-gone shape mandated by the plan is preserved verbatim. No app code changed. No scope creep.

## Issues Encountered
- **Mobile-only Heisenbug during diagnosis:** adding a `console.log` inside the app's `navigateToCard` (to count pushes) perturbed the timing enough to make the race vanish (the spec passed with the log present, failed without). Switched to a near-zero-latency in-page `window.__navLog.push(...)` probe to observe the true behavior without altering timing; that confirmed a single `navigateToCard` call and isolated the cause to the concurrent smooth-scroll, not the controller. All probes and the app-side instrumentation were removed before committing; the final specs contain zero diagnostic tokens (verified via grep).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SC#2 back-stack coverage is complete for all three entry points → the F8 gate (Plans 02/03) can assert full behavioral coverage; the two added assertions close the only `❌ Wave-0 gap-fill` rows in 08-VALIDATION.md's SC#2 map.
- `pnpm typecheck` and `pnpm lint` clean; both specs remain self-contained with their original ports and console gates.
- No blockers introduced. (Pre-existing F4/F6/F7 blocker D1 — discriminated-union SQL collections rendering all-null — is untouched and out of scope for this plan.)

## Self-Check: PASSED
- `tests/parity/map-fallback-notes.spec.ts` — FOUND (modified, contains `originY`, `page.click('#back-btn', { force: true })`, `expect.poll`/`.toBe(originY)`; port `5760` count = 2; `ensureBuild`/`trackConsoleErrors` present)
- `tests/parity/search-route.spec.ts` — FOUND (modified, contains `originY`, `page.click('#back-btn', { force: true })`, `expect.poll`/`.toBe(originY)`; port `5740` count = 2; `ensureBuild` present)
- Commit `f16b69c` — FOUND in git log
- Commit `556c074` — FOUND in git log
- App code `app/composables/useCardNavigation.ts` — clean (no diff vs original)

---
*Phase: 08-verificaci-n-de-paridad*
*Completed: 2026-06-23*
