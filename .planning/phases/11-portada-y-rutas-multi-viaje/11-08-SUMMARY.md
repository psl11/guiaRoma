---
phase: 11-portada-y-rutas-multi-viaje
plan: 08
subsystem: testing
tags: [data-gate, mdc, nuxt-content, prerender, createError, vitest, gap-closure]

requires:
  - phase: 10
    provides: "scanProseLinks / hasLink, trip-summary-link (10-06 + Phase 10 review fixes)"
  - phase: 11
    provides: "TripIndex.vue portada (11-01..11-07), nitro.prerender.failOnError"
provides:
  - "Data-gate rule trip-summary-inline (RULES = 23): block Markdown in trip.yml summary fails pnpm test:data naming trip.yml, one violation per summary, never double-warned with trip-summary-link"
  - "TripIndex.vue turns a failed useAsyncData('trips-index') into createError 500 fatal, so nuxt generate fails instead of publishing a blank portada with 200"
  - "Static guard tests/unit/tripIndexFatal.spec.ts (7 tests) over the portada error wiring"
  - "11-REVIEW-DISPOSITION.md: WR-01..03 fixed, IN-01..06 deferred, open: 0"
affects: [phase-11-verification, trip-authoring, portada]

actuals:
  tokens: 7074
  tasks: 3
  commits: 5

plan_head_before: f91a1f5738517eb6420cbd771999e56ee350baa6
plan_head_after: cf7ceea1d75eab3f61b3debe5fdc7372fffc72e3

tech-stack:
  added: []
  patterns:
    - "Lexical, fail-closed block-Markdown scan (SUMMARY_BLOCK_FORMS) layered after hasLink so no construct is reported twice"
    - "Page-level data error -> createError({ statusCode: 500, fatal: true, cause }) so failOnError catches prerender query failures"
    - "Differential forced-failure and markup comparison builds in a mktemp -d copy with node_modules symlinked (repo tree untouched)"

key-files:
  created:
    - tests/unit/tripIndexFatal.spec.ts
  modified:
    - tests/data/trips.ts
    - tests/data/invariants.spec.ts
    - app/components/TripIndex.vue
    - tests/README.md
    - .planning/phases/11-portada-y-rutas-multi-viaje/11-REVIEW-DISPOSITION.md

key-decisions:
  - "trip-summary-inline only evaluates a summary with no link (!hasLink): headings, raw HTML, [r]:, ::x with frontmatter, {href}, {#id} stay trip-summary-link; no double warning, no label dedup"
  - "WR-02 closed with a lexical fail-closed scan (no parser): @nuxtjs/mdc does not resolve from the root with pnpm and v1.1 admits no new deps; documented false reds accepted, false greens not"
  - "WR-03: portada query error becomes a fatal 500 createError (template byte-identical to 0f7843c); the build fails via nitro.prerender.failOnError"

patterns-established:
  - "Block-form rules on card-rendered Markdown mirror the rendering (<MDC unwrap=p> inside <p> inside <a>)"

requirements-completed: [ROUTE-01, PAR-01, PAR-02]

coverage:
  - id: D1
    description: "A trip.yml summary with block Markdown (list incl. 2027./1), quote, table, code, rule, blank line, ::x) fails the data gate with exactly one trip-summary-inline violation in trip.yml; link-forms stay trip-summary-link only; inline summaries stay green"
    requirement: "ROUTE-01"
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts#G-11-3/WR-02 (41 tests)"
        status: pass
      - kind: unit
        ref: "tests/data/invariants.spec.ts#viaje %s > regla trip-summary-inline (4 real trips)"
        status: pass
      - kind: other
        ref: "vitest run tests/data -> 906 passed (906)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A failed portada query during prerender makes nuxt generate exit non-zero with [500] No se pudo cargar la lista de viajes instead of publishing a blank 200 portada"
    requirement: "ROUTE-01"
    verification:
      - kind: unit
        ref: "tests/unit/tripIndexFatal.spec.ts#G-11-3/WR-03 (7 tests)"
        status: pass
      - kind: integration
        ref: "Task 2 verify #2: forced .select('columnaQueNoExiste') in mktemp copy -> base=0 blank=0 fix=1 with [500], Exiting due to prerender errors, no such column"
        status: pass
    human_judgment: false
  - id: D3
    description: "Normal output unchanged: TripIndex template byte-identical to 0f7843c, portada div.trip-index markup identical (2 cards), 56 goldens and portada.spec.ts green without --update-snapshots"
    requirement: "PAR-01"
    verification:
      - kind: integration
        ref: "Task 2 verify #3: cmp of portada div.trip-index markup 0f7843c vs worktree in mktemp copy"
        status: pass
      - kind: automated_ui
        ref: "pnpm verify -> parity 126 passed (second run; see Issues)"
        status: pass
      - kind: e2e
        ref: "pnpm test:trips -> 46 passed"
        status: pass
    human_judgment: false
  - id: D4
    description: "tests/README.md documents trip-summary-inline (23 rules) and the portada fatal error; 11-REVIEW-DISPOSITION.md records 3 fixed and 6 deferred with open: 0"
    requirement: "PAR-02"
    verification:
      - kind: other
        ref: "Task 3 verify greps (README >=3 trip-summary-inline, tripIndexFatal.spec.ts; disposition per id)"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-11-23
status: complete
---

# Phase 11 Plan 08: Cierre de G-11-3 (WR-02 + WR-03) Summary

**La puerta de datos rechaza con `trip-summary-inline` todo `summary` con Markdown de bloque que MDC metería dentro de `<p>`/`<a>` en la tarjeta de la portada, y un fallo de la consulta de la portada durante el prerender ahora tumba `nuxt generate` con un 500 fatal en vez de publicar una portada en blanco con 200.**

## Performance

- **Duration:** 13 min (wall clock for agent work; the builds ran inside it)
- **Started:** 2026-11-23T00:04:27Z
- **Completed:** 2026-11-23T00:17:35Z
- **Tasks:** 3
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- `tests/data/trips.ts`: `SUMMARY_BLOCK_FORMS` (7 lexical forms) + non-exported `summaryBlockForms()`, which returns `[]` when `hasLink`; new rule `trip-summary-inline` (RULES 22 → 23) pushes one violation per summary listing every form it finds. Real trips (campania, forma, prueba, roma) pass without touching content/.
- `tests/data/invariants.spec.ts`: 41 in-memory teeth: the exact message, 25 block forms, 7 link-forms with no double warning and 8 inline controls (Roma and Campania summaries included).
- `app/components/TripIndex.vue`: only the `<script setup>` changed. It destructures `error` and throws `createError({ statusCode: 500, statusMessage: 'No se pudo cargar la lista de viajes', fatal: true, cause })`, and the header comment gained an «ERRORES» paragraph. The template is byte-identical to 0f7843c.
- `tests/unit/tripIndexFatal.spec.ts`: a static guard (comment-stripped script scan) with 6 synthetic teeth.
- Docs: tests/README.md §5.3/§5.7; 11-REVIEW-DISPOSITION.md: WR-01..03 fixed, IN-01..06 deferred, open: 0.

## Task Commits

1. **Task 1 (tracer): trip-summary-inline**: RED `1c4b01d` (test: 26 failed / 15 passed), GREEN `74e82e7` (fix: 41 passed; tests/data 906)
2. **Task 2: portada fatal error**: RED `fb1e31f` (test: 1 failed / 6 passed; forced build printed `base=0 blank=0 fix=0`), GREEN `7021b8a` (fix: 7 passed; forced build `base=0 blank=0 fix=1` with `[500]`; unit 575)
3. **Task 3: docs + full gate**: `cf7ceea` (docs)

## TDD Gate Compliance

- Task 1: `test(11-08)` 1c4b01d failed as expected (the rule did not exist), then `fix(11-08)` 74e82e7 passed.
- Task 2: `test(11-08)` fb1e31f failed as expected (`[NO_ERROR, NO_GUARD]` on the real component). The differential forced build also showed the RED state: the 0f7843c component and the worktree component both published the blank portada with exit 0. Then `fix(11-08)` 7021b8a passed. No refactor commits were needed.

## Verification Results

- `vitest -t "G-11-3/WR-02"`: 41 passed. `-t "regla trip-summary-inline"`: 4 passed. `vitest run tests/data`: 906 passed (906).
- `vitest run tests/unit/tripIndexFatal.spec.ts`: 7 passed. `vitest run tests/unit`: 575 passed (575).
- Forced failure (mktemp copy): `base=0 blank=0 fix=1`, and the fix log contains `[500] No se pudo cargar la lista de viajes`, `Exiting due to prerender errors` and `no such column`.
- Normal case (mktemp copy): the portada `div.trip-index` markup is byte-identical between 0f7843c and the worktree, with 2 `a.trip-index-card`. The template diff against 0f7843c is empty.
- `pnpm typecheck` exit 0. eslint on the touched files is clean. `pnpm lint` exit 0.
- `pnpm verify` (second run): exit 0, with unit 575, data 906 and parity 126 passed. `pnpm test:trips`: 46 passed.
- Scope guard: content/, tests/parity/, tests/trips/, app/assets/css/, shared/, scripts/ and the config have no diff against 0f7843c. In app/ only TripIndex.vue changed, and `git status --porcelain -- content tests/parity app` is empty.

## Decisions Made

- `trip-summary-inline` is evaluated only for a summary with no link, so nothing is reported twice. A summary with both a link and a list reports the link first. The list shows up on the next pass, and the string stays red the whole time.
- The scan is lexical and fail-closed, with no parser. Three false reds are known and documented: `Texto\n2027. …`, a line that starts with inline code of three backticks, and a continuation line indented 4 spaces.

## Deviations from Plan

### Execution-order note (no code impact)

**1. [Rule 3 - Blocking] Task 2 build verifies #2/#3 re-run after the GREEN commit**
- **Found during:** Task 2 GREEN
- **Issue:** Both verifies end with `test -z "$(git status --porcelain -- app content)"`. That check cannot pass while the TripIndex.vue change is still uncommitted. Before the commit, verify #2 printed `base=0 blank=0 fix=1`, and every build assertion and log grep held. Only the porcelain check failed.
- **Fix:** I ran unit, typecheck and eslint, committed GREEN (7021b8a), then re-ran #2 and #3. Both passed (exit 0).
- **Files modified:** none beyond the plan
- **Commit:** 7021b8a

**Total deviations:** 1 (ordering only). **Impact:** none. All verifies pass as written.

## Issues Encountered

- **Known §6.4 flake on the first `pnpm verify`:** `navigation.spec.ts` «SC#2: el scrollspy conmuta la pastilla en scrollY+130» [mobile] failed once (Expected `#sabado`, received `#viernes`, 30 s timeout). It was the only failure (125 passed, 1 failed). Following the plan's policy, I re-ran it on its own: `playwright test -c playwright.gate.config.ts tests/parity/navigation.spec.ts -g "SC#2" --repeat-each 3` gave 18 passed. I then re-ran `pnpm verify` once, and it passed (126 passed, exit 0). Nothing was excluded, and `--update-snapshots` was never used.

## Known Stubs

None.

## Next Phase Readiness

All 8 plans of Phase 11 now have a SUMMARY, so G-11-3 is closed. The phase is ready for verification and re-UAT of test 3. The deferred items are IN-01..IN-06 and the Reservas `<tbody>` todo, and neither was touched.

## Self-Check: PASSED

- FOUND: tests/unit/tripIndexFatal.spec.ts, tests/data/trips.ts, tests/data/invariants.spec.ts, app/components/TripIndex.vue, tests/README.md, 11-REVIEW-DISPOSITION.md
- FOUND commits: 1c4b01d, 74e82e7, fb1e31f, 7021b8a, cf7ceea
