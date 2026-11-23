---
phase: 09-plataforma-por-viaje
plan: 02
subsystem: testing
tags: [vitest, zod4, yaml, nuxt-content, data-gate, multi-trip]
status: complete

requires:
  - phase: 02-datos
    provides: shared/schemas.ts strict + row schemas, tests/data schema/invariants gate (Roma only)
provides:
  - shared/schemas.ts — TRIP_SLUG_RE (^[a-z0-9]+$) exported; TripSchema.slug uses it (D-05)
  - tests/data/trips.ts — pure per-trip loader (listTripDirs, loadTrip, loadTripFromFiles) and checkTrip with 14 rules returning { file, rule, message }
  - tests/data/invariants.spec.ts — describe.each over every trip folder, one test per rule, plus the "la puerta tiene dientes" block (20 fixtures)
  - tests/data/schema.spec.ts — per-file strict schema validation of every trip with file + z.prettifyError; Roma-only counts
  - tests/data/fixtures/trips/{campania-2027,suelto} — on-disk negative fixtures (outside content/)
affects: [09-03 prueba trip (must pass this gate), 09-05 build sentinel, Phase 10/12 schema additions (unknown-key net)]

actuals:
  tokens: 11765
  tasks: 2
  commits: 3
plan_head_before: 43f474d829c5042006495c8620443f83e5f99990
plan_head_after: c7947fd18a8a9505a67b16ecd316c81b3c58a240

tech-stack:
  added: []
  patterns:
    - "Pure data gate: a loader + checkTrip module returns Violation[]; specs only assert the list is empty and use formatViolations(list) as the expect message"
    - "No fail-open: every YAML under a trip folder is classified, parsed and object-checked or becomes a violation naming its file"
    - "In-memory fixtures via loadTripFromFiles(dir, { rel: yaml }) for rule teeth; on-disk fixtures only under tests/data/fixtures/"

key-files:
  created:
    - tests/data/trips.ts
    - tests/data/fixtures/trips/campania-2027/trip.yml
    - tests/data/fixtures/trips/suelto/days/viernes.yml
    - tests/data/fixtures/trips/suelto/notas.yml
  modified:
    - shared/schemas.ts
    - tests/data/invariants.spec.ts
    - tests/data/schema.spec.ts

key-decisions:
  - "Anchor extraction widened from [a-z0-9-] to any char except space/paren so Unicode or mixed-case anchors are compared exactly and fail instead of escaping the scan (encoding edge, no fail-open)"
  - "reserved-key and unknown-key inspect only top-level keys; a reserved key reports reserved-key only (not also unknown-key)"
  - "dup-id emits one violation per colliding file, each message listing every colliding file"
  - "Trip slug is excluded from anchorable ids; anchors resolve to entity slugs of the same trip or SECTION_ANCHORS only"

patterns-established:
  - "Pattern: per-trip gate = describe.each(listTripDirs()) + it.each(RULES) so each rule is its own test line per trip"

requirements-completed: [PLAT-04]

coverage:
  - id: D1
    description: "Every trip folder is checked against 14 invariants (yaml-parse ... cross-trip-link); Roma passes all of them with no change to content/trips/roma"
    requirement: PLAT-04
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts#viaje roma"
        status: pass
    human_judgment: false
  - id: D2
    description: "Each rule has a fixture that triggers it and names the expected file (20 tests in 'la puerta tiene dientes')"
    requirement: PLAT-04
    verification:
      - kind: unit
        ref: "node_modules/.bin/vitest run tests/data/invariants.spec.ts -t dientes"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every YAML of every trip validates against its strict schema; a failure shows the file and z.prettifyError; counts 1/5/38/26/13/2 stay Roma-only"
    requirement: PLAT-04
    verification:
      - kind: unit
        ref: "tests/data/schema.spec.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "TripSchema.slug enforces ^[a-z0-9]+$ and Content still generates its tables (clean nuxi generate + typecheck)"
    requirement: PLAT-04
    verification:
      - kind: other
        ref: "rm -rf .data .nuxt .output && nuxi generate && nuxi typecheck"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-20
---

# Phase 9 Plan 02: Per-trip data gate Summary

**The data gate now checks every folder in content/trips, not just Roma. It applies the schema and 14 invariants (slug, folder, ids, anchors, cross-trip links, reserved and unknown keys, stray or broken YAML), and each violation names the offending file, the rule and the detail.**

## Performance

- **Duration:** about 5 min (measured from the plan start marker)
- **Started:** 2026-11-20T10:18:12Z
- **Completed:** 2026-11-20
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- `TRIP_SLUG_RE = /^[a-z0-9]+$/` is exported from `shared/schemas.ts` and `TripSchema.slug` uses it. This is an additive change: Content still generates its tables, and a clean `nuxi generate` prerendered 10 routes.
- `tests/data/trips.ts` is a pure Node module.
  - `loadTrip` reads every file of a trip folder recursively. `loadTripFromFiles` does the same from an in-memory map, for fixtures.
  - `checkTrip` applies the 14 rules and returns violations sorted by file and rule.
  - The 6 existing cross-ref rules moved in unchanged, now limited to the trip being checked.
- `invariants.spec.ts` runs `describe.each(trips)` with `it.each(RULES)`, so every trip gets one test line per rule. It also has 20 "teeth" tests and the 2 `extractAnchors` cases.
- `schema.spec.ts` validates every document of every trip with its strict schema. A failure prints `file` followed by `z.prettifyError`, for example `✖ Invalid string: must match pattern /^[a-z0-9]+$/ → at slug`. The counts stay Roma-only (D-12), and 3 D-05 slug cases were added.
- Roma: 85 docs, 0 violations. `content/trips/roma`, `migration-diff` and `tests/parity/` are unchanged relative to `79e57e0`.

## Task Commits

1. **Task 1 (TDD RED):** `18f31da` test(09-02): add failing per-trip data gate contract (PLAT-04)
2. **Task 1 (TDD GREEN):** `e92ed69` feat(09-02): per-trip data gate naming the offending file (PLAT-04)
3. **Task 2:** `c7947fd` feat(09-02): per-file schema validation for every trip with z.prettifyError

## TDD Gate Compliance

- **RED:** `tests/data/invariants.spec.ts`, first committed with a typed skeleton of `tests/data/trips.ts` whose functions return empty values. The module loaded, so tests failed on their assertions and not on an import error: 21 of 23 failed, and the 2 negative-control tests passed. The target test was "la puerta tiene dientes (fixtures) > trip-slug: slug con guion en disco (campania-2027, D-05)". The classifier returned `RED_EVIDENCE_OK` (reason `target_test_failed`) on JUnit evidence in `.planning/phases/09-plataforma-por-viaje/.red/09-02-red.json`. Semantic assessment: the target ran and failed on `expect(vs).toEqual(arrayContaining(trip-slug …))` because the skeleton `checkTrip` returns `[]`. There were no import, syntax or fixture faults.
- **GREEN:** the real `trips.ts` plus `TRIP_SLUG_RE` brought the file to 37/37 passing.
- **REFACTOR:** none needed.

## Decisions Made

See `key-decisions` in the frontmatter. The main one is widening the anchor regex so that `#Galería` or `#Galeria` are compared exactly and fail, rather than being silently skipped.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Anchor extraction widened (no fail-open on encoding)**
- **Found during:** Task 1
- **Issue:** The plan said to move `extractAnchors` "without changing its logic". But its regex `/\]\(#([a-z0-9-]+)\)/gi` does not capture an anchor that contains non-ASCII characters such as `#galería`. Such a link would be skipped silently, which breaks the plan's no-fail-open prohibition and its "encoding" edge case.
- **Fix:** `extractAnchors` is now built on a general link-target extractor (`\]\(([^)\s]+)`), which `cross-trip-link` also uses. Both existing `extractAnchors` cases still pass, and Roma still has 0 anchor violations. A survey confirmed that every Roma anchor is `[a-z0-9-]`.
- **Files modified:** tests/data/trips.ts
- **Commit:** e92ed69

**2. [Rule 3 - Blocking] RED evidence captured with JUnit, not TAP**
- **Found during:** Task 1 RED
- **Issue:** Vitest's `tap-flat` reporter writes multi-line `expected:` values without indentation, so the classifier rejected the report as `invalid_record` ("Malformed TAP").
- **Fix:** I reran the same tests with `--reporter=junit --outputFile=…` and recorded `reportPath`, `runStartedAt` and `reportModifiedAt`. The classifier then returned `RED_EVIDENCE_OK`.
- **Commit:** none (evidence only)

**3. [Rule 1 - Bug] Unused `FoodSchema` import in schema.spec.ts**
- **Found during:** Task 2 (eslint). The per-collection array was replaced by `COLLECTIONS`, so the import became unused and was removed.
- **Commit:** c7947fd

Two smaller notes:
- The old trivial "Set detects a missing ref" fixture tests in `invariants.spec.ts` were replaced by the real "teeth" block, which runs `checkTrip` against actual fixtures.
- `listTripDirs` skips dot-directories, consistent with Content's `trips/*` glob, which does not match hidden folders.

## Issues Encountered

None beyond the deviations above.

## Threat Flags

None. The change only touches the test-time gate and adds an additive regex to the schema. T-09-04 (fail-open) and T-09-05 (slug overlap) are mitigated as planned.

## Next Phase Readiness

- 09-03 can add `content/trips/prueba/`: `describe.each` will pick it up automatically and apply every rule, including `anchor` (a `[x](#pantheon)` inside `prueba` fails).
- After any content YAML edit, run `rm -rf .data .nuxt .output` before generate.

## Self-Check: PASSED

- FOUND: tests/data/trips.ts, tests/data/fixtures/trips/campania-2027/trip.yml, tests/data/fixtures/trips/suelto/days/viernes.yml, tests/data/fixtures/trips/suelto/notas.yml
- FOUND commits: 18f31da, e92ed69, c7947fd
- `vitest run tests/data` → 3 files, 238 tests passing; `vitest run tests/unit` → 98 passing; eslint clean; `nuxi generate` and `nuxi typecheck` exit 0
