---
phase: 09-plataforma-por-viaje
plan: 03
subsystem: search
tags: [nuxt4, minisearch, nuxt-content, multi-trip, useState, fixture]
status: complete

requires:
  - phase: 09-plataforma-por-viaje
    provides: "09-01 useTripSlug/tripStateKey/useCardNavigation(slug); 09-02 per-trip data gate (loadTrip, checkTrip)"
provides:
  - content/trips/prueba/** — fictional dev-only trip (2 days, 3 fichas, sentinel PRUEBA-CENTINELA-9F3)
  - tests/unit/searchIsolation.spec.ts — per-trip search isolation on the real YAML
  - app/composables/useSearch.ts — useSearch(slug = useTripSlug()), Map<string, MiniSearch> per slug, search:*:<slug> state
  - app/utils/searchIndex.ts — haystack indexes link text but not Markdown link destinations
affects: [09-04 isolation E2E (uses prueba fixture), 09-05 build sentinel, Phase 10 day slugs, Phase 11 draft filter]

actuals:
  tokens: 9200
  tasks: 2
  commits: 4
plan_head_before: 0303dc4087f88c1efbbb3976ef5cf1b718348dc3
plan_head_after: 57d5b7b5c7d8255bb66ae1b7ac058bbeedd9a509

tech-stack:
  added: []
  patterns:
    - "Per-trip client-only module state: Map<slug, T> written only in onMounted/watch, never in prerender"
    - "Async controller reads useTripSlug() as its first statement, then passes the slug to the accessor"

key-files:
  created:
    - content/trips/prueba/trip.yml
    - content/trips/prueba/days/viernes.yml
    - content/trips/prueba/days/sabado.yml
    - content/trips/prueba/monuments/fontana-pruebas.yml
    - content/trips/prueba/monuments/torre-ensayo.yml
    - content/trips/prueba/monuments/spagna.yml
    - tests/unit/searchIsolation.spec.ts
  modified:
    - app/composables/useSearch.ts
    - app/components/SearchBox.vue
    - app/utils/searchIndex.ts
    - tests/unit/searchIndex.spec.ts

key-decisions:
  - "Search haystack drops Markdown link destinations ](#x): the link text stays indexed, the hidden href no longer makes a card match (needed so «Fontana» in prueba returns only fontana-pruebas while torre-ensayo keeps its in-trip link)"
  - "One MiniSearch per trip slug in a module-level Map, written only on the client; search state keys are search:query|open|results:<slug>"
  - "Day slugs of a trip must be viernes…martes for now (TripView mounts only those five DaySection): finding for Phase 10"

patterns-established:
  - "Pattern: per-trip client-only cache = module Map keyed by trip slug"

requirements-completed: [PLAT-01, PLAT-04]

coverage:
  - id: D1
    description: "prueba trip (2 days, 3 fichas, current schema only) passes the same schema + invariants gate as Roma"
    requirement: PLAT-04
    verification:
      - kind: unit
        ref: "tests/data (describe «viaje prueba», 21 lines in verbose output)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Per-trip index on real YAML: Pantheon/Pante only in Roma; Fontana in prueba only fontana-pruebas; spagna resolves to its own name per trip"
    requirement: PLAT-01
    verification:
      - kind: unit
        ref: "tests/unit/searchIsolation.spec.ts (13 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "useSearch per trip (index, state and data by slug); Roma search unchanged"
    requirement: PLAT-01
    verification:
      - kind: e2e
        ref: "tests/parity/search-route.spec.ts via playwright.gate.config.ts (10 passed)"
        status: pass
    human_judgment: false
  - id: D4
    description: "prueba is dev-only: no .output/public/trips, no sentinel in Roma index.html, nothing links /trips/prueba"
    requirement: PLAT-01
    verification:
      - kind: other
        ref: "rm -rf .data .nuxt .output && nuxi generate; test ! -e .output/public/trips; grep -c PRUEBA-CENTINELA-9F3 .output/public/index.html == 0"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-20
---

# Phase 9 Plan 03: Fictional trip «prueba» and per-trip search Summary

**A fictional dev-only trip `prueba` (2 days, 3 fichas) now passes the per-trip data gate, and search belongs to its trip: one MiniSearch index per slug, `search:*:<slug>` state and the trip's own data, with Roma's search-route parity at 10/10 untouched.**

## Performance

- **Duration:** about 9 min
- **Started:** 2026-11-20T10:27:02Z
- **Completed:** 2026-11-20T10:35:43Z
- **Tasks:** 2
- **Files modified:** 11 (7 created, 4 modified), plus the RED evidence files

## Accomplishments

- `content/trips/prueba/` uses only the current schema shape (D-03).
  - `trip.yml` has slug `prueba`, the sentinel `PRUEBA-CENTINELA-9F3` in `howTo`, a Madrid map center, the commented `# draft: true` line and the findings for Phases 10 and 11.
  - The days are `viernes` (fontana-pruebas → meta → torre-ensayo) and `sabado` (spagna).
  - `fontana-pruebas` repeats the sentinel. `torre-ensayo` links in its prose to `[el surtidor de las pruebas](#fontana-pruebas)`. `spagna` is «Escalinata de Ensayo», the same slug as Roma's ficha with a different name.
  - Hero images point at `https://example.invalid/…`, so they fail deterministically and fall back to the motif SVG.
- `tests/unit/searchIsolation.spec.ts` builds an index per trip from the real YAML with `loadTrip` and `createSearchIndex`. It asserts every case in `<behavior>` (13 tests).
- `useSearch(slug = useTripSlug())`:
  - State uses `tripStateKey(slug, 'search:query'|'search:open'|'search:results')` and navigation uses `useCardNavigation(slug)`.
  - `onInput` reads `indexes.get(slug)`. The trim, the 2-character guard, `slice(0, 8)` and the `{ slug, name, day }` mapping are unchanged.
- `useSearchController()` reads `useTripSlug()` as its first statement and registers its hooks before `await useTrip(slug)`. Its `onMounted` and `watch` write `indexes.set(slug, …)`.
- The prerendered Roma payload now carries `$ssearch:query:roma`, `$ssearch:open:roma` and `$ssearch:results:roma`.
- Dev smoke on `/guiaRoma/trips/prueba`: the page renders, the payload has `$ssearch:*:prueba` keys, and the HTML contains no «Piazza di Spagna».

## Task Commits

1. **Task 1 (TDD RED):** `97489c4` test(09-03): add failing per-trip search isolation on real YAML (PLAT-01)
2. **Task 1 (GREEN, fix):** `737d796` fix(09-03): search haystack indexes link text, not Markdown link targets
3. **Task 1 (GREEN):** `b366753` feat(09-03): fictional dev-only trip «prueba» passing the per-trip data gate
4. **Task 2:** `57d5b7b` feat(09-03): per-trip search — one MiniSearch index per slug, suffixed state

## TDD Gate Compliance

- **RED:** `tests/unit/searchIsolation.spec.ts` was committed before any prueba content existed. A missing trip folder yields `[]` rather than a load error, so the tests fail on assertions: 3 failed and 10 passed, including the Roma Pantheon/Pante cases. The target was «Fontana» en prueba devuelve solo fontana-pruebas. The classifier returned `RED_EVIDENCE_OK` (`target_test_failed`) on the JUnit evidence in `.planning/phases/09-plataforma-por-viaje/.red/09-03-red.json`. Semantic assessment: the target ran and failed on `toEqual(['fontana-pruebas'])` because the prueba index was empty. There were no import, syntax or fixture faults.
- **GREEN:** `737d796` and `b366753` bring the file to 13/13 passing.
- **REFACTOR:** none needed.

## Findings for Later Phases

- **Phase 10 (D-03):** a trip's day slugs must be `viernes`…`martes`, because `TripView` mounts only those five `DaySection`. A day with any other slug would not render. This is recorded in the `trip.yml` header.
- **Phase 11 (ROUTE-05):** the `draft` filter must also exclude the trip's rows from the public `__nuxt_content/*/sql_dump.txt`, not only from `prerender.routes` (T-09-06, accepted for Phase 9). Once the field exists, uncomment `# draft: true` in `content/trips/prueba/trip.yml`.
- **09-04:** the E2E plan's «Fontana → exactly 1 result» holds only because of the haystack fix described below.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The search haystack indexed Markdown link destinations**
- **Found during:** Task 1 GREEN
- **Issue:** The plan requires both that `torre-ensayo` contain `(#fontana-pruebas)` and that `search('Fontana')` in prueba return exactly `['fontana-pruebas']`; 09-04's E2E expects the same. But `buildHaystack` concatenated raw Markdown, and MiniSearch's tokenizer splits `#fontana-pruebas` into `fontana` + `pruebas`. As a result `torre-ensayo` matched «Fontana» through an href the reader never sees. Rewriting the prose could not fix it, since the link target is mandated.
- **Fix:** `buildHaystack` now replaces `](destination)` with `]`. The link text stays indexed, which is what the original `card.textContent` search indexed; the href was never text. A regression case was added to `tests/unit/searchIndex.spec.ts`.
- **Roma impact (measured before the change):** I ran 27 common queries. Results were identical for Pante, Pantheon, Santa, Fontana, Trevi, Spagna, Navona, Caravaggio, Tardobarroco and the rest. Only 4 queries that matched link slugs changed their top-8 order or membership:
  - «art», which had matched `#art-*`
  - «arq», which had matched `#arq-*`
  - «Bernini»
  - «Rafael», where the order changed but the members did not

  `search-route.spec.ts` passes 10/10 and `tests/parity/` is unchanged. If you prefer byte-identical Roma ranking, the alternative is to relax the «exactly fontana-pruebas» assertion here and in 09-04 to «only prueba fichas, fontana-pruebas first». Revert `737d796` to choose that.
- **Files modified:** app/utils/searchIndex.ts, tests/unit/searchIndex.spec.ts
- **Commit:** 737d796

**2. [Rule 2 - Vocabulary rule] Timeline stop title**
- **Found during:** Task 1
- **Issue:** The plan forbids words starting with «fontan» outside fontana-pruebas.
- **Fix:** The viernes timeline stop is titled «Surtidor de las Pruebas»; its `ref` is still `fontana-pruebas`. Day files are not indexed, so this is about following the rule literally. I also rewrote «antes» in torre-ensayo to stay clear of the «ante» rule.
- **Commit:** b366753

## Verification

- `vitest run tests/unit tests/data`: 15 files, 371 tests passing, including `searchIsolation` and the «viaje prueba» gate lines.
- `rm -rf .data .nuxt .output && nuxi generate`: exit 0, no `.output/public/trips`, sentinel count in `index.html` is 0, no «useTripSlug() fuera de» in the log.
- `playwright test -c playwright.gate.config.ts tests/parity/search-route.spec.ts`: 10 passed.
- `eslint` on the touched files and `nuxi typecheck`: clean.
- All grep and awk acceptance criteria of both tasks pass. `git diff 79e57e0 -- nuxt.config.ts app/pages/ content.config.ts content/trips/roma tests/parity/` is empty.

## Known Stubs

None. The prueba trip is a deliberate test fixture, documented as fictional in its `trip.yml`.

## Self-Check: PASSED

- All 7 created files exist on disk.
- Commits 97489c4, 737d796, b366753 and 57d5b7b are ancestors of HEAD.
