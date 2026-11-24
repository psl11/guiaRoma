---
phase: 11-portada-y-rutas-multi-viaje
plan: 04
subsystem: content-data
tags: [zod, nuxt-content, vitest, data-gate, home-page]

requires:
  - phase: 11-02
    provides: TripSchema.draft and drafts out of the build (listedTrips filters on the same field)
provides:
  - "TripSchema: optional startDate/endDate (IsoDate = string regex + calendar refine), destinations, summary"
  - "Roma trip.yml: startDate 2026-06-19, endDate 2026-06-23, destinations [Roma], UI-SPEC summary"
  - "app/utils/tripDates.ts: formatTripDates, tripMetaLine, sortTrips, listedTrips (pure, auto-imported)"
  - "Data gate rules trip-dates and trip-summary-link (18 rules)"
affects: [11-05 TripIndex home page, 11-07 portada specs, 13 Campania trip data]

actuals:
  tokens: 6621
  tasks: 3
  commits: 6
plan_head_before: ad0502e0fc901dafa1f7e4e79bf1ef56f2c11666
plan_head_after: 2014c22eada9ba428fc2b95d959df38e8d315471

tech-stack:
  added: []
  patterns:
    - "ISO dates as z.string() + regex + calendar refine, never z.iso.date() (Content keeps a text column)"
    - "Date text built from string parts and a month table, without Date/Intl"
    - "null = not loaded, [] = loaded and empty (listedTrips), so the empty state never shows during hydration"

key-files:
  created:
    - app/utils/tripDates.ts
    - tests/unit/tripDates.spec.ts
    - .planning/phases/11-portada-y-rutas-multi-viaje/.red/11-04-task1-red.json
    - .planning/phases/11-portada-y-rutas-multi-viaje/.red/11-04-task2-red.json
    - .planning/phases/11-portada-y-rutas-multi-viaje/.red/11-04-task3-red.json
  modified:
    - shared/schemas.ts
    - content/trips/roma/trip.yml
    - tests/data/trips.ts
    - tests/data/schema.spec.ts
    - tests/data/invariants.spec.ts

key-decisions:
  - "IsoDate is a module-private z.string().regex(...).refine(isCalendarDate) with the error 'fecha inexistente: «<valor>»'; startDate/endDate export as type string with no format in JSON-Schema (D-23, tested with z.toJSONSchema)"
  - "endDate >= startDate is a data-gate rule (trip-dates), not an object refine on TripSchema"
  - "trip-summary-link flags a Markdown [t](x) target, a <scheme:...> autolink, or a bare http(s):// / www. URL in summary (D-07: the card is already an <a>)"
  - "sortTrips compares ISO strings directly; ties and undated trips sort by inlineMdToPlain(title).localeCompare(..., 'es'); listedTrips returns null for null/undefined rows"

patterns-established:
  - "Pure home-page helpers live in app/utils/tripDates.ts with only a relative ./tripLayout import, so plain Vitest loads them"

requirements-completed: [ROUTE-01]

coverage:
  - id: D1
    description: "TripSchema accepts the four optional home-page fields; nonexistent dates, non-ISO dates, empty destinations and empty summary are rejected with the exact copy; startDate/endDate carry no format: date in JSON-Schema"
    requirement: ROUTE-01
    verification:
      - kind: unit
        ref: "tests/data/schema.spec.ts#portada: campos del viaje (D-08, D-23)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Roma's real trip.yml validates and its card meta line is «19–23 de junio de 2026 · Roma»"
    requirement: ROUTE-01
    verification:
      - kind: unit
        ref: "tests/unit/tripDates.spec.ts#trip.yml real de Roma → línea meta de su tarjeta (D-08)"
        status: pass
    human_judgment: false
  - id: D3
    description: "formatTripDates full table (range, day 1, month crossing, year crossing, start only, start = end, no start) and tripMetaLine joins"
    requirement: ROUTE-01
    verification:
      - kind: unit
        ref: "tests/unit/tripDates.spec.ts#formatTripDates (D-09) + tabla completa + tripMetaLine"
        status: pass
    human_judgment: false
  - id: D4
    description: "sortTrips (desc, undated last, Spanish plain-title tie-break, no mutation) and listedTrips (null while loading, drafts out, [] when nothing is published)"
    requirement: ROUTE-01
    verification:
      - kind: unit
        ref: "tests/unit/tripDates.spec.ts#sortTrips (D-10) / listedTrips (D-16, vacío frente a cargando)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Data gate rules trip-dates and trip-summary-link name the offending trip.yml; the three real trips have no violations"
    requirement: ROUTE-01
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts#la puerta tiene dientes (fixtures) > trip-dates / trip-summary-link"
        status: pass
      - kind: unit
        ref: "tests/data/invariants.spec.ts#viaje roma|prueba|forma > regla trip-dates / regla trip-summary-link"
        status: pass
    human_judgment: false
  - id: D6
    description: "Roma's published guide is unchanged: the new fields are not rendered and the full gate passes with the 56 goldens"
    verification:
      - kind: automated_ui
        ref: "pnpm verify (286 unit, 377 data, 80 parity)"
        status: pass
    human_judgment: false
  - id: D7
    description: "The auto-written Roma summary text and the month-crossing date form («30 de junio de 2026 – 2 de julio de 2026») are acceptable to the user"
    verification: []
    human_judgment: true
    rationale: "Both were chosen in --auto mode by the UI-SPEC (flagged assumptions A5 and 'Resumen de Roma'); only the user can accept the wording"

duration: 10min
completed: 2026-11-20
status: complete
---

# Phase 11 Plan 04: Home-page trip card data Summary

**Trips can now declare optional startDate/endDate (ISO strings with a calendar check, never z.iso.date), destinations and summary. Roma has them, and its card meta line is «19–23 de junio de 2026 · Roma». The pure helpers formatTripDates, tripMetaLine, sortTrips and listedTrips cover the date text, meta line, order and published list. The data gate now rejects inverted date ranges and links in the summary.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-11-20T19:33:07Z
- **Completed:** 2026-11-20T19:43:36Z
- **Tasks:** 3 (one tracer, two TDD expansions)
- **Files modified:** 8 source/test files, plus 6 RED-evidence files (3 records and 3 JUnit reports)

## Accomplishments
- **D-08 / D-23:** `TripSchema` gains `startDate`/`endDate` (`IsoDate`), `destinations` and `summary`. All four are optional and the schema is still a flat `z.object`. In Content's manifest, `startDate` is typed `string`, so it gets a text column and dates do not shift with the time zone.
- **Roma `trip.yml`:** gets the UI-SPEC block verbatim, preceded by a `# Portada (Fase 11, D-08)` comment. Nothing else in the file changed.
- **D-09:** `formatTripDates` builds the date text without `Date`/`Intl`. It takes the parts with `split('-')`, looks up the month in a table, and uses an EN DASH. `tripMetaLine` joins the dates and destinations with « · », or returns `null` if there is nothing to show.
- **D-10 / D-16:** `sortTrips` and `listedTrips` match the UI-SPEC contract. 11-05 only has to render.
- **D-07:** the data gate has 18 rules. `trip-dates` and `trip-summary-link` report the exact copy against the offending `trip.yml`.

## Task Commits

1. **Task 1 (tracer): Roma's trip.yml → card meta line**
   - RED `3fc4049` (test): spec plus a signature-only skeleton of `tripDates.ts`
   - GREEN `c2ceceb` (feat): schema, Roma data, `formatTripDates` and `tripMetaLine`
2. **Task 2: data gate teeth**
   - RED `e4872e1` (test): schema.spec portada describe and invariants teeth
   - GREEN `70c2e38` (feat): the `trip-dates` and `trip-summary-link` rules
3. **Task 3: order and published list**
   - RED `40298c6` (test): full date table, `sortTrips` and `listedTrips` cases
   - GREEN `2014c22` (feat): `sortTrips` and `listedTrips`

No REFACTOR commits; there was nothing to clean up.

### TDD RED evidence (all `RED_EVIDENCE_OK` from `gsd-tools check tdd-red-evidence`, JUnit format)
- **Task 1:** `.red/11-04-task1-red.json`. The target `trip.yml real de Roma → … > valida con TripSchema y su línea meta es «19–23 de junio de 2026 · Roma»` failed on `toBe` (got `null`). 6 tests failed and 2 passed; the 2 that passed expect `null`, which the skeleton returns. *semanticAssessment:* this is the intended failure. The skeleton exists only so the file imports, which rules out a load failure (an INVALID_RED under #3770).
- **Task 2:** `.red/11-04-task2-red.json`. The target `trip-dates: endDate 2026-06-18 anterior a startDate 2026-06-19 …` failed on `toEqual` (got `[]`). The other 4 failures were the `trip-summary-link` cases. *semanticAssessment:* intended. The negative controls passed. The schema.spec cases were already green, because the fields landed in Task 1 (expected).
- **Task 3:** `.red/11-04-task3-red.json`. The target `sortTrips (D-10) > un viaje sin startDate va detrás de todos los que la tienen` failed with `sortTrips is not a function`. 10 tests failed and 11 passed. *semanticAssessment:* the target ran and failed because the planned function was missing. The file loaded, and the 8 Task 1 tests plus the 3 full-table cases passed.

## Files Created/Modified
- `shared/schemas.ts`: `isCalendarDate` and `IsoDate` (private), `DESTINATIONS_MSG`, plus the four new `TripSchema` fields with comments for D-08, D-23 and D-07
- `content/trips/roma/trip.yml`: the home-page block (`startDate`, `endDate`, `destinations`, `summary: >-`)
- `app/utils/tripDates.ts` (new): `formatTripDates`, `tripMetaLine`, `sortTrips`, `listedTrips`
- `tests/unit/tripDates.spec.ts` (new): 21 tests, including Roma's real YAML
- `tests/data/trips.ts`: `hasLink`, the two rules in `RULES` and `checkTrip`, header «Fase 11», «18 reglas»
- `tests/data/schema.spec.ts`: `baseTrip` hoisted to module scope (shared by the drafts and home-page describes), plus the `portada: campos del viaje (D-08, D-23)` describe with the `z.toJSONSchema` check
- `tests/data/invariants.spec.ts`: Phase 11 JSDoc, plus `trip-dates` and `trip-summary-link` teeth with negative controls

## Decisions Made
- `IsoDate` stays module-private; the plan said not to export it unless needed. The regex fails with `fecha ISO YYYY-MM-DD` and the refine with `fecha inexistente: «<valor>»`. zod 4 runs both checks, so an input like `19/06/2026` reports both messages, and the regex message is the one the tests assert.
- `trip-summary-link` also flags `www.` URLs and any `<scheme:…>` autolink, not only `http(s)`, because MDC/GFM autolink would turn those into an `<a>` as well.
- `sortTrips` treats `null` and a missing `startDate` the same (`?? ''`). Undated trips sort among themselves by plain title.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Signature-only skeleton in the Task 1 RED commit**
- **Found during:** Task 1 RED
- **Issue:** the plan expected Task 1's RED to fail because the module did not exist. Under tdd.md (#3770), an import failure is INVALID_RED and does not authorize GREEN.
- **Fix:** the RED commit includes `app/utils/tripDates.ts` with the two signatures returning `null`. The spec then loads and fails on its assertions, and the classifier returned `RED_EVIDENCE_OK`. GREEN replaced the skeleton entirely.
- **Files modified:** app/utils/tripDates.ts
- **Commit:** 3fc4049

**2. [Rule 3 - Blocking] `baseTrip` hoisted in schema.spec.ts**
- **Found during:** Task 2 RED
- **Issue:** the plan asked the new describe to reuse the base object from the drafts describe, but that object was a `const` scoped inside that describe.
- **Fix:** moved the same object to module scope, unchanged. The drafts tests still use it and still pass.
- **Files modified:** tests/data/schema.spec.ts
- **Commit:** e4872e1

**Total deviations:** 2 auto-fixed (both Rule 3). **Impact:** none on behavior; both only make the TDD and test structure work.

### Acceptance-criteria note (not a deviation)
- Task 1 includes the criterion `git diff --quiet 6315f26 -- tests/parity/ app/assets/css/ app/components/`, and it exits 1. That diff comes entirely from the allowed edits of plans 11-01 and 11-03 (the harness, `TripView.vue` and the parity specs). This plan touched none of those paths. Against this plan's own base (`ad0502e`) the same command exits 0. Task 3's narrower `tests/parity/ app/assets/css/` check also exits 0 against this plan's base.

## Issues Encountered
- A stray `source` of a Markdown reference file hung a shell while the Task 1 RED record was being written. The record had already been written, so I killed the shell. No repository state was affected.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 11-05 (TripIndex) can render straight from `listedTrips(rows)`, `inlineMdToPlain(t.title)`, `tripMetaLine(t)` and `<MDC :value="t.summary">`, all auto-imported.
- Flagged for `/gsd-verify-work 11` (human_judgment D7): the wording of Roma's summary, and the month-crossing date form with the year written twice. Either change is one line plus its test.

## Verification
- `node_modules/.bin/vitest run tests/unit/tripDates.spec.ts`: 21/21 passed.
- `node_modules/.bin/vitest run tests/data`: 377/377 passed.
- `nuxi generate`, eslint (all touched files) and `nuxi typecheck`: clean under Node 22.
- `pnpm verify`: exit 0 with 286 unit, 377 data and 80 parity tests (56 goldens). The scrollspy flake did not occur.
- `git diff --quiet ad0502e -- tests/parity/ app/assets/css/ app/components/`: exits 0.

## Self-Check: PASSED
- FOUND: app/utils/tripDates.ts, tests/unit/tripDates.spec.ts, .red/11-04-task{1,2,3}-red.json
- FOUND commits: 3fc4049, c2ceceb, e4872e1, 70c2e38, 40298c6, 2014c22 (all ancestors of HEAD)
