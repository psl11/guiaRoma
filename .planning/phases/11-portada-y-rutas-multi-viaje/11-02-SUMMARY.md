---
phase: 11-portada-y-rutas-multi-viaje
plan: 02
subsystem: content-build
tags: [nuxt-content, drafts, prerender, sql_dump, zod, vitest]

requires:
  - phase: 11-01
    provides: parity harness (ROMA_URL/ROMA_HTML) — untouched here
provides:
  - "scripts/tripManifest.mjs + .d.mts: TRIP_FOLDER_RE, readTripManifest(root?), draftExcludes(entries, keepDrafts), prerenderRoutes(entries)"
  - "TripSchema.draft (optional boolean)"
  - "content.config.ts: 6 collections with source { include, exclude } excluding drafts outside nuxi dev"
  - "prueba and forma marked draft: true; production sql_dumps carry none of their rows"
  - "build-isolation scan of .output/public with decoded sql_dumps + positive control"
affects: [11-03 nuxt.config prerender routes, 11-05 portada, 11-07 publication specs]

actuals:
  tokens: 12100
  tasks: 2
  commits: 4
plan_head_before: bddb253fcc40432c4d1cb42c15f34e232d859e4e
plan_head_after: 9bedfe2b3b1a187a04a6a84a65336af1e479625c

tech-stack:
  added: []
  patterns:
    - "Config-time manifest as Node ESM .mjs + .d.mts (no @types/node, typecheck-safe)"
    - "Fail-closed env gate: only NODE_ENV=development keeps drafts"
    - "Decode base64+gzip sql_dump before scanning published output"

key-files:
  created:
    - scripts/tripManifest.mjs
    - scripts/tripManifest.d.mts
    - tests/unit/tripManifest.spec.ts
    - .planning/phases/11-portada-y-rutas-multi-viaje/.red/11-02-task1-red.json
    - .planning/phases/11-portada-y-rutas-multi-viaje/.red/11-02-task2-red.json
  modified:
    - content.config.ts
    - shared/schemas.ts
    - content/trips/prueba/trip.yml
    - content/trips/forma/trip.yml
    - tests/data/build-isolation.spec.ts
    - tests/data/schema.spec.ts

key-decisions:
  - "D-16 implemented as Nuxt Content source.exclude (trips/<slug>/**) computed at config load from scripts/tripManifest.mjs; only NODE_ENV=development keeps drafts (fail-closed)"
  - "readTripManifest is fail-closed: a non-boolean draft or a folder outside ^[a-z0-9]+$ throws naming the file/folder; draft null/absent = false"
  - "prerenderRoutes sorts by slug itself (ASCII compare) so route order never depends on input order or locale"
  - "Draft-scan assertion collects an offenders list (file + sentinel) instead of one expect per file, so a failure names the culprit without dumping the decoded SQL"

patterns-established:
  - "Config-time data reads live in scripts/*.mjs with a sibling .d.mts (D-23)"
  - "Published-output scans decode __nuxt_content/<col>/sql_dump.txt and carry a positive control"

requirements-completed: [ROUTE-05, ROUTE-02]

coverage:
  - id: D1
    description: "Draft trips (prueba, forma) are excluded from the production build: no row or sentinel of theirs in any file of .output/public, decoded sql_dumps included"
    requirement: ROUTE-05
    verification:
      - kind: integration
        ref: "tests/data/build-isolation.spec.ts#build estática: ningún fichero publicado lleva datos de un borrador (D-16, D-17)"
        status: pass
      - kind: other
        ref: "node decoded-dump probe over the 6 sql_dump.txt (verify block, Task 1)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Drafts still load in nuxi dev (/trips/prueba, /trips/forma reachable)"
    requirement: ROUTE-05
    verification:
      - kind: e2e
        ref: "playwright test -c playwright.trips.config.ts (17 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "prerenderRoutes derives ['/', '/trips/<slug>/'] from data; ['/'] with 0 trips or only drafts; ['/', '/trips/roma/'] with the real manifest"
    requirement: ROUTE-02
    verification:
      - kind: unit
        ref: "tests/unit/tripManifest.spec.ts (16 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Manifest and schema are fail-closed: draft 'yes' rejected by TripSchema and throws in readTripManifest; invalid folder slug throws naming the folder"
    requirement: ROUTE-05
    verification:
      - kind: unit
        ref: "tests/unit/tripManifest.spec.ts#readTripManifest con fixtures temporales (fail-closed)"
        status: pass
      - kind: unit
        ref: "tests/data/schema.spec.ts#borradores (D-16)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Roma unchanged: pnpm verify green without --update-snapshots (80 parity tests, goldens untouched)"
    verification:
      - kind: automated_ui
        ref: "pnpm verify (unit 263, data 353, parity 80)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-20
status: complete
---

# Phase 11 Plan 02: Borradores fuera de la build y rutas desde el manifiesto Summary

**`draft: true` en un trip.yml saca el viaje de las 6 colecciones de Nuxt Content fuera de `nuxi dev` (manifiesto `scripts/tripManifest.mjs` leído en tiempo de config), prueba y forma ya no dejan ni una fila en los `sql_dump` públicos (verificado decodificándolos), y `prerenderRoutes` deriva `['/', '/trips/roma/']` de los datos para 11-03.**

## Performance

- **Duration:** 10 min (measured wall clock)
- **Started:** 2026-11-20T19:09:36Z
- **Completed:** 2026-11-20T19:20:18Z
- **Tasks:** 2
- **Files modified:** 13 (incl. 4 RED-evidence files)

## Accomplishments
- CR-01 (Fase 9) / AR-10-02 (Fase 10) closed: the production build carries no row or sentinel of the `prueba` and `forma` trips in any file of `.output/public`. Before the fix, the decoded `trip` and `monument` dumps carried them.
- `scripts/tripManifest.mjs` + `.d.mts` is now the single source for draft excludes (content.config.ts) and prerender routes (nuxt.config.ts in 11-03). It is fail-closed: a non-boolean `draft` or an invalid folder slug throws.
- `TripSchema.draft` is an optional strict boolean. In `content/trips/prueba/trip.yml` only the `draft: true` line changed. Forma's header now describes the current behavior.
- Dev behavior is preserved (`test:trips` 17/17), and Roma's parity is unchanged (`pnpm verify` green twice, no snapshot updates).

## Task Commits

1. **Task 1 (tracer): a draft never reaches the build**
   - RED `264c46c` (test): scans every published file, with the sql_dumps decoded
   - GREEN `ce67998` (feat): adds the schema field, sets the drafts, adds the manifest and the Content exclude
2. **Task 2: routes from the manifest, fail-closed manifest**
   - RED `a55dc08` (test): adds tripManifest.spec and the schema `draft` cases
   - GREEN `9bedfe2` (feat): adds prerenderRoutes and the validation

## TDD Gate Compliance

- **Task 1 RED:** `.red/11-02-task1-red.json` (JUnit). The classifier returned `RED_EVIDENCE_OK`. The target `ningún fichero de .output/public contiene PRUEBA-CENTINELA-9F3 ni FORMA-CENTINELA-10A` failed on `offenders == []` with these offenders: `monument` and `trip` dumps contain `PRUEBA-CENTINELA-9F3`, and `trip` contains `FORMA-CENTINELA-10A`. *semanticAssessment:* this is the intended failure. The positive controls passed, so the scan is not vacuous.
- **Task 2 RED:** `.red/11-02-task2-red.json` (JUnit). The classifier returned `RED_EVIDENCE_OK`. The target `draft no booleano ("yes")` failed on `toThrow`. Seven other failures belonged to the same pending feature (6 × `prerenderRoutes is not a function`, plus the invalid folder that did not throw). *semanticAssessment:* the target executed and failed on its planned assertion. The schema `draft` cases already passed, because the field landed in Task 1 (expected).
- **GREEN:** both tasks passed their target suites after the feat commits. There were no REFACTOR commits because no cleanup was needed.

## Files Created/Modified
- `scripts/tripManifest.mjs`: config-time trip manifest (`TRIP_FOLDER_RE`, `readTripManifest`, `draftExcludes`, `prerenderRoutes`)
- `scripts/tripManifest.d.mts`: types (`TripManifestEntry` + 4 declarations)
- `content.config.ts`: adds `keepDrafts`, `exclude` and `src(include)`. The 6 collections use `source: src('trips/*/…')`.
- `shared/schemas.ts`: adds `TripSchema.draft: z.boolean().optional()`
- `content/trips/prueba/trip.yml`: `# draft: true` → `draft: true` (only change)
- `content/trips/forma/trip.yml`: `draft: true` plus an updated header comment
- `tests/data/build-isolation.spec.ts`: adds `decodeDump` and the recursive `publishedTexts`, plus the prueba sentinel check outside the skipIf and a new block with 3 tests. The JSDoc now records that CR-01 is closed.
- `tests/unit/tripManifest.spec.ts`: 16 tests covering the real manifest and temporary fixtures
- `tests/data/schema.spec.ts`: adds a `borradores (D-16)` describe with 4 cases

## Decisions Made
See key-decisions in the frontmatter. The two that go beyond the plan text:
- `prerenderRoutes` sorts its own output, so route order does not depend on input order.
- The draft-scan assertion collects an offenders list, which keeps failure output readable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unreadable failure output in the draft scan**
- **Found during:** Task 1 RED
- **Issue:** the planned `expect(text, file).not.toContain(...)` printed the whole decoded SQL dump on failure (236 KB of output).
- **Fix:** collect `file lleva SENTINEL` offenders and assert `toEqual([])`. The failure still names each culprit file, as the plan requires.
- **Files modified:** tests/data/build-isolation.spec.ts
- **Committed in:** 264c46c

**2. [Rule 3 - Blocking] Lint error in the RED test commit**
- **Found during:** Task 2 RED
- **Issue:** `@stylistic/quote-props` flagged a fixture object that mixed quoted and unquoted keys. The commit had already gone through because my command chain did not stop on the eslint failure.
- **Fix:** quoted all keys on that line and amended the local, unpushed RED commit (now `a55dc08`).
- **Verification:** eslint is clean on all files changed by the plan.

### Note on an acceptance criterion
- The Task 1 criterion `git diff --quiet 6315f26 -- package.json pnpm-lock.yaml tests/parity/ app/assets/css/` exits 1. The diff comes entirely from plan 11-01's harness commits in `tests/parity/`, which landed after 6315f26 in the same wave. Measured against this plan's own base (`bddb253`) the same diff is empty. `package.json`, `pnpm-lock.yaml` and `app/assets/css/` are unchanged since 6315f26.

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking). **Impact:** test ergonomics only. No scope change.

## Issues Encountered
- The GSD RED classifier rejected vitest's `tap-flat` output (multi-line YAML diagnostics, "Malformed TAP"). Both REDs switched to the JUnit reporter, matching Phase 9's `.red/` convention, and used the qualified `suite > test` target name.

## Known Stubs
None.

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- 11-03 can `import { prerenderRoutes, readTripManifest } from './scripts/tripManifest.mjs'` in nuxt.config.ts; the `.d.mts` already declares `prerenderRoutes`.
- In production, the content of drafts is not in Content at all. A draft URL will serve the 404 shell (accepted per RESEARCH).
- The `prueba` trip.yml header comment is stale on purpose ("routes sigue siendo ['/']", "descomentar…"). D-16 allows only the `draft` line to change in that file.

## Self-Check: PASSED
- FOUND: scripts/tripManifest.mjs, scripts/tripManifest.d.mts, tests/unit/tripManifest.spec.ts, .red/11-02-task1-red.json, .red/11-02-task2-red.json
- FOUND commits: 264c46c, ce67998, a55dc08, 9bedfe2 (all ancestors of HEAD)
- Plan verification: `vitest run tests/unit tests/data` green (616); `pnpm verify` green (unit 263, data 353, parity 80); `test:trips` green (17), run alone; the decoded-dump probe finds no sentinel; eslint and `nuxi typecheck` 0 errors.
