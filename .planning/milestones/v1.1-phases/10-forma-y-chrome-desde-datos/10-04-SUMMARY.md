---
phase: 10-forma-y-chrome-desde-datos
plan: 04
subsystem: testing
tags: [nuxt-content, yaml, playwright, multi-trip, dev-fixture]
status: complete

requires:
  - phase: 10-01
    provides: buildTripLayout (sections + pills from data), dayPillLabel
  - phase: 10-02
    provides: optional trip chrome (pageTitle/brand/mapLegend/footer)
  - phase: 10-03
    provides: DAY_SLUG_RE, DaySchema.pill, day-order/day-pill/anchor/cross-trip-link gate rules
provides:
  - dev-only fictitious trip `forma` (10 days, two Saturdays, no Arte/Arquitectura/Reservas/Práctica, own chrome)
  - tests/trips/shape.spec.ts (5 E2E tests for SHAPE-01/SHAPE-02 against nuxi dev)
  - FORMA-CENTINELA-10A build-isolation guard
affects: [10-05 trap test (SHAPE-05), phase 11 draft/ROUTE-05, phase 12-13 Campania]

actuals:
  tokens: 4269
  tasks: 3
  commits: 3
plan_head_before: fe7688309d245b7d49bf45d423c7d84b3ad9d26c
plan_head_after: 7df40c365bb2b2f29bc7bf28c528303439fb3f48

tech-stack:
  added: []
  patterns:
    - "Dev-only fixture trips carry a unique sentinel string, asserted absent from the static build and present in source (non-vacuous)"
    - "Short-page pill navigation is verified by href + section[id] existence + location.hash, never .active (Pitfall 6)"
    - "Section ids selected with [id=\"…\"] instead of #… in E2E"

key-files:
  created:
    - content/trips/forma/trip.yml
    - content/trips/forma/days/{sabado-19,domingo-20,lunes-21,martes-22,miercoles-23,jueves-24,viernes-25,sabado-26,domingo-27,lunes-28}.yml
    - content/trips/forma/monuments/faro-del-ensayo.yml
    - content/trips/forma/monuments/puente-de-la-forma.yml
    - content/trips/forma/food/g-meson-del-ensayo.yml
    - tests/trips/shape.spec.ts
  modified:
    - tests/data/build-isolation.spec.ts

key-decisions:
  - "shape.spec FORMA_DAYS also carries each day's title so the per-day test asserts the exact h2 (.day-header h2), not just its presence"
  - "Forma sentinel presence check lives in its own always-running describe outside the build skipIf, so the absence assertion is never vacuous"

requirements-completed: [SHAPE-01, SHAPE-02]  # SHAPE-05 (trap test) is delivered by 10-05; this plan provides its base

duration: 4min
completed: 2026-11-20
---

# Phase 10 Plan 04: Forma trip and end-to-end shape proof Summary

**Fictitious dev-only trip `forma` (10 dated days with two Saturdays, no Arte/Arquitectura/Reservas/Práctica, own chrome) proves in the browser that the guide's sections and pills come from data. A build sentinel shows it never reaches the static site.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-11-20T14:24:17Z
- **Completed:** 2026-11-20
- **Tasks:** 3/3
- **Files modified:** 16 (15 created, 1 modified)

## Accomplishments

- `content/trips/forma/`: `trip.yml` with `pageTitle`, `brand`, `mapLegend`, `footer`, sentinel `FORMA-CENTINELA-10A` and a commented `# draft: true` for Phase 11. It also has 10 days with dated slugs (`sabado-19` … `lunes-28`, `order` 1..10, `pill` on `sabado-19`/`sabado-26`/`domingo-27`/`lunes-28`), 2 monuments with coordinates (so the map has markers and `fitBounds` never gets an empty list, Pitfall 10), and 1 food card whose group is not in `FOOD_GROUP_ORDER`. There is no `artists/` or `reference/` folder.
- The data gate (`vitest run tests/data`) is green with forma included: 345 tests, covering the day-order 1..10, day-pill, ref, anchor and cross-trip-link rules.
- `tests/trips/shape.spec.ts` has 5 tests against `nuxi dev`, all green:
  - forma has no Arte/Arquitectura/Reservas/Práctica, guarded against passing vacuously by the `Sáb 19` section and pill plus Gastronomía.
  - `main > section` order is exactly inicio, mapa, the 10 days, gastronomia.
  - Each day shows its eyebrow and h2.
  - There are 13 pills (`Inicio, Mapa, Sáb 19, Domingo, Lunes, Martes, Miércoles, Jueves, Viernes, Sáb 26, Dom 27, Lun 28, Gastronomía`). Each day pill's `href` points to an existing `section[id]`, and after a click `location.hash` is that id.
  - prueba's sections are exactly inicio, mapa, viernes, sabado, with pills `Inicio, Mapa, Venerdì, Sabato`.
- `tests/data/build-isolation.spec.ts` checks that the forma sentinel is absent from `index.html` and `_payload.json`. An always-run check confirms the sentinel is still in the forma trip.yml. I proved the guard catches a leak by appending the sentinel to the built `index.html`: the test went red, then green again after restoring the file.
- Full `test:trips` suite: 10/10 green (5 isolation + 5 shape). Assumption A2 held, so `tests/trips/isolation.spec.ts` is **unchanged**.

## Task Commits

1. **Task 1: forma skeleton with one day + first shape E2E** - `5afa2f4` (feat)
2. **Task 2: remaining 9 days, second monument, full shape assertions** - `54e1d9e` (feat)
3. **Task 3: forma build-isolation sentinel** - `7df40c3` (test)

## Files Created/Modified

- `content/trips/forma/trip.yml` - dev-only trip with its own chrome and the sentinel
- `content/trips/forma/days/*.yml` (10) - dated day slugs, distinct pills
- `content/trips/forma/monuments/faro-del-ensayo.yml`, `puente-de-la-forma.yml` - the two stops with coordinates
- `content/trips/forma/food/g-meson-del-ensayo.yml` - food card in a group outside `FOOD_GROUP_ORDER`
- `tests/trips/shape.spec.ts` - E2E proof of SHAPE-01/SHAPE-02; self-contained, nothing imported from parity or isolation
- `tests/data/build-isolation.spec.ts` - `FORMA_SENTINEL` checks and a header covering D-15 and CR-01

## Decisions Made

- `FORMA_DAYS` entries hold `{ id, eyebrow, title, label }`. The plan listed `{ id, eyebrow, label }`; the extra `title` lets the per-day test assert the exact `.day-header h2` text, which is stronger than checking that an h2 exists.
- Pill navigation is checked with `pill.click()` plus `expect.poll(location.hash)`. Day ids are not monument slugs, so the capture-phase card listener ignores them and the native anchor jump updates the hash.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Invalid YAML in lunes-28 subtitle**
- **Found during:** Task 2
- **Issue:** The plain scalar `Último día del ensayo: maletas…` contains `: `, so the yaml-parse gate rule rejected it.
- **Fix:** Wrapped the value in single quotes.
- **Files modified:** content/trips/forma/days/lunes-28.yml
- **Commit:** 54e1d9e

**Total deviations:** 1 auto-fixed, found and fixed before commit. No change to scope.

## Issues Encountered

None. The known mobile scrollspy flake in `tests/parity/` does not apply here: `test:trips` runs desktop only.

## Flagged Assumptions (carried forward, not resolved here)

- **UI overflow:** forma's 13 pills fit at 1280 px. A trip with 17 pills would clip «Inicio» at that width. Fixing it needs CSS, which is out of scope for this phase; it is deferred to Phase 12/13.
- **CR-01:** forma and prueba rows still ship in the public Nuxt Content `sql_dump`. They are fictitious and contain no personal data. Phase 11 will exclude them via `draft`.

## Threat Flags

None. The only new surface is fictitious dev-only content, already covered by T-10-07 (mitigated by the sentinel) and T-10-08 (accepted).

## Next Phase Readiness

- Plan 10-05 can build the Roma-leak trap test (SHAPE-05) on top of `/trips/forma` and `shape.spec.ts`.
- `content/trips/prueba/` and `tests/parity/` are unchanged (`git diff --quiet f04967a` exit 0).

## Self-Check: PASSED

- All 15 created files exist; `tests/data/build-isolation.spec.ts` modified.
- Commits 5afa2f4, 54e1d9e and 7df40c3 are in HEAD history.
- `.output/public/trips` is absent; the forma sentinel does not appear in `index.html` or `_payload.json`.
