---
phase: 09-plataforma-por-viaje
plan: 04
subsystem: testing
tags: [playwright, vitest, nuxi-dev, multi-trip, isolation, static-guard]
status: complete

requires:
  - phase: 09-plataforma-por-viaje
    provides: "09-01 tripStorageKey/tripStateKey + useTripSlug; 09-03 fictional trip prueba + per-slug MiniSearch Map"
provides:
  - playwright.trips.config.ts — isolation E2E config against nuxi dev on port 5300, outside verify and the parity gate
  - tests/trips/isolation.spec.ts — 5 E2E tests for per-trip navigation (PLAT-02), search (PLAT-01) and prefs/notes (PLAT-03) on /trips/prueba
  - package.json script test:trips (not chained into verify)
  - tests/unit/tripCoupling.spec.ts — static coupling guard inside test:unit (and so inside pnpm verify)
affects: [09-05 README «Aislamiento por viaje» documents test:trips, Phase 10/11 any new composable/component is scanned by the guard]

actuals:
  tokens: 14452
  tasks: 2
  commits: 3
plan_head_before: d7c04084d39f7406369908670706606819c249ce
plan_head_after: 1ffdbe4d9e3eddc8aa1c1f38666742009332aa88

tech-stack:
  added: []
  patterns:
    - "Out-of-gate E2E against nuxi dev: its own Playwright config, webServer started and stopped by Playwright, 1 worker, external requests aborted"
    - "Static source guard: strip comments, then regex/structural scan of app/ code in a plain Vitest unit"

key-files:
  created:
    - playwright.trips.config.ts
    - tests/trips/isolation.spec.ts
    - tests/unit/tripCoupling.spec.ts
    - .planning/phases/09-plataforma-por-viaje/.red/09-04-red.json
    - .planning/phases/09-plataforma-por-viaje/.red/09-04-red-junit.xml
  modified:
    - package.json

key-decisions:
  - "The search E2E probes for a ready index (Escalinata returns 1 result) before asserting «Pantheon → Sin resultados»; without the probe an empty, not-yet-built index would pass the assertion vacuously"
  - "The coupling guard flags useTrip with ANY literal slug, not only 'roma': a fixed trip is a fixed trip"
  - "useState first-argument check skips a balanced generic <…> so useState<'a' | 'b'>('pace') is caught and useState<number[]>(tripStateKey(…)) is not"

patterns-established:
  - "Pattern: per-trip behaviour proven on a second real trip in dev (tests/trips), Roma parity stays in the gate"

requirements-completed: [PLAT-01, PLAT-02, PLAT-03]

coverage:
  - id: D1
    description: "Navigation in /trips/prueba: timeline and prose ficha links highlight inside prueba without changing the hash, «Volver» restores the scroll origin, the active pill follows #viernes → #sabado"
    requirement: PLAT-02
    verification:
      - kind: e2e
        ref: "tests/trips/isolation.spec.ts#navegación en /trips/prueba (PLAT-02) (2 tests, via playwright.trips.config.ts)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Search is per trip: Pantheon has no results in prueba, Fontana/Escalinata return only prueba fichas and selecting one highlights it; in Roma Pantheon finds pantheon and Fontana brings no prueba ficha"
    requirement: PLAT-01
    verification:
      - kind: e2e
        ref: "tests/trips/isolation.spec.ts#búsqueda aislada por viaje (PLAT-01) (2 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Prefs and notes are per trip: with roma-* seeded, prueba starts at defaults; writing in prueba writes prueba-* only; Roma and prueba each keep their own values"
    requirement: PLAT-03
    verification:
      - kind: e2e
        ref: "tests/trips/isolation.spec.ts#preferencias y notas por viaje (PLAT-03) (1 test)"
        status: pass
    human_judgment: false
  - id: D4
    description: "test:trips stays outside pnpm verify and the gate; gate still lists 80 tests in 11 files; no dependency changes"
    requirement: PLAT-01
    verification:
      - kind: other
        ref: "playwright test -c playwright.trips.config.ts --list → Total: 5 tests in 1 file; playwright.gate.config.ts --list → Total: 80 tests in 11 files; deps identical to 79e57e0"
        status: pass
    human_judgment: false
  - id: D5
    description: "Coupling guard in test:unit scans app/composables, app/components and app/utils and fails on any reintroduced fixed trip, roma- literal, global useState, module-wide MiniSearch, literal storage key or localStorage enumeration; structural wiring of TripView/controllers asserted"
    requirement: PLAT-03
    verification:
      - kind: unit
        ref: "tests/unit/tripCoupling.spec.ts (52 tests, incl. 9 «dientes del guardián»)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-20
---

# Phase 9 Plan 04: Per-trip isolation E2E and coupling guard Summary

**On `/trips/prueba` in dev, search, card navigation, prefs and notes now provably belong to their own trip while Roma keeps its own (5/5 E2E passing). A static guard inside `test:unit` fails if `app/` code is re-coupled to Roma or to global state.**

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-20T10:39:14Z
- **Completed:** 2026-11-20T10:46:00Z
- **Tasks:** 2
- **Files:** 4 created/modified, plus the RED evidence files

## Accomplishments

- **`playwright.trips.config.ts`** is self-contained and does not import the parity configs.
  - Settings: `testDir: './tests/trips'`, `workers: 1`, `retries: 0`, 120 s per test, 15 s for each expect, one `desktop` project (1280×800, chromium).
  - `webServer` runs `node_modules/.bin/nuxi dev --port 5300` with `NUXT_APP_BASE_URL=/guiaRoma/` and `reuseExistingServer: false`, so Playwright starts and stops the server.
  - The header documents that the run uses Node 22 from the shell's PATH (with Node 24, `better-sqlite3` does not load), that it must never run alongside `generate`/`verify`, and that `rm -rf .data .nuxt` should run first.
- **`tests/trips/isolation.spec.ts`** has 5 tests in 3 describes.
  - Helpers are cloned from `navigation.spec.ts`, and nothing is imported from `tests/parity/`.
  - `blockExternal` aborts every request outside the dev server.
  - A `beforeAll` warms up both URLs, and each test gets its own `browser.newContext()`.
  - The prefs test seeds the `roma-*` keys once with `page.evaluate`. It does not use `addInitScript`, so the check that Roma's keys are not overwritten is real.
- **`package.json`** gains only `"test:trips": "playwright test -c playwright.trips.config.ts"`. It is not chained into `verify`, and dependencies are identical to `79e57e0`.
- **`tests/unit/tripCoupling.spec.ts`** exports `stripComments`, `scriptOf` and `scanSource`.
  - It scans 39 files: 5 composables, 22 components and 12 utils. All of them come back clean.
  - Structural checks: TripView calls `provideTripSlug(props.slug)` before its first `await` and calls `useCardNavigationController(props.slug)`. `useCardNavigationController(slug: string)` passes the slug to `useCardNavigation(slug)`. `useSearchController` reads `useTripSlug()` before its first `await` and keeps a `new Map<string, MiniSearch>`. `useTripModesController` reads `useTripSlug()` and calls `useTripModes(slug)`.
  - Documented exceptions that are not scanned: `app/pages/index.vue` and `nuxt.config.ts`.

## Task Commits

1. **Task 1:** `41790e7` test(09-04): per-trip isolation E2E on /trips/prueba against nuxi dev (test:trips)
2. **Task 2 (TDD RED):** `088c429` test(09-04): add failing trip-coupling guard teeth (scanSource stub)
3. **Task 2 (GREEN):** `1ffdbe4` feat(09-04): trip-coupling guard in test:unit blocks Roma re-coupling (D-04, D-08)

## TDD Gate Compliance

- **RED** (`088c429`): the spec was committed with `scanSource` stubbed to return `[]`.
  - Result: 52 tests, 6 failing (the six detection teeth) and 46 passing (the real-file scan and the structural checks).
  - The classifier returned `RED_EVIDENCE_OK` (`target_test_failed`) on the JUnit evidence in `.planning/phases/09-plataforma-por-viaje/.red/09-04-red.json`.
  - The target was «dientes del guardián > detecta un viaje fijo en useTrip».
  - Semantic assessment: the target ran and failed on its `toContain` assertion because the scanner detected nothing. There were no import, syntax or fixture faults.
- **GREEN** (`1ffdbe4`): with the real `scanSource`, all 52 tests pass. `tests/unit` as a whole passes 164/164 across 13 files.
- **REFACTOR:** none needed.

## Verification

| Check | Result |
|-------|--------|
| `rm -rf .data .nuxt && playwright test -c playwright.trips.config.ts` | 5 passed (31.2 s) |
| `playwright test -c playwright.trips.config.ts --list` | Total: 5 tests in 1 file |
| Gate `--list` (grep-invert dev-routing) | Total: 80 tests in 11 files |
| dependencies/devDependencies vs `79e57e0` | identical |
| `eslint` on the 3 new files | clean |
| `vitest run tests/unit/tripCoupling.spec.ts --reporter=verbose` | 52 passed, including 9 under «dientes del guardián» |
| `vitest run tests/unit` | 164 passed (13 files) |
| `git diff --quiet 79e57e0 -- tests/parity/ playwright.config.ts playwright.gate.config.ts` | exit 0 |
| Port 5300 after the run | free, no stray nuxi/playwright process |

All acceptance-criteria greps returned the expected counts:

- `testDir` 1, `nuxi dev --port 5300` 1, the `test:trips` script 1, `verify` containing `test:trips` 0.
- `dispatchEvent('click')` 3, `prueba-note-spagna` 1, `addInitScript` 0.
- `export function scanSource` 1, `dientes del guardián` 1, `app/pages/index.vue` 2.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Readiness probes in the search E2E**
- **Found during:** Task 1
- **Issue:** In dev, the MiniSearch index is built in `onMounted` after the data loads. Typing before that point yields «Sin resultados», so the plan's first assertion (Pantheon → no results in prueba) could pass against an empty index and prove nothing. Typing too early also never re-evaluates later.
- **Fix:** A `searchUntil` helper refills the input until an assertion passes, using `toPass` with a 30 s budget. The prueba test first waits for «Escalinata» to return 1 result and then asserts Pantheon/Fontana/Escalinata in the plan's order. The Roma test waits for `pantheon` before checking «Fontana».
- **Files modified:** tests/trips/isolation.spec.ts
- **Commit:** 41790e7

**2. [Minor] The fixed-trip pattern is broader than the plan sketch**
- `scanSource` flags `useTrip(` followed by any string literal, not only `'roma'`. It still detects the plan's `useTrip('roma')` case. This is stricter, and no real file is affected.

**Total deviations:** 1 auto-fixed (Rule 2) and 1 minor broadening. **Impact:** both make the plan's checks stricter, with no scope change.

## Issues Encountered

None. The dev E2E passed on its first run with no flakiness observed.

## Known Stubs

None. The RED stub of `scanSource` was replaced in the GREEN commit.

## Next Phase Readiness

Ready for 09-05. Its README should document `pnpm test:trips`: use Node 22, run `rm -rf .data .nuxt` first, never run it alongside `verify`, and it stays outside the gate.

## Self-Check: PASSED

- FOUND: playwright.trips.config.ts, tests/trips/isolation.spec.ts, tests/unit/tripCoupling.spec.ts, .planning/phases/09-plataforma-por-viaje/.red/09-04-red.json
- FOUND commits: 41790e7, 088c429, 1ffdbe4 (ancestors of HEAD)
