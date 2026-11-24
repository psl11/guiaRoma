---
phase: 09-plataforma-por-viaje
plan: 06
subsystem: testing
tags: [data-gate, vitest, nuxt-content, yaml, gap-closure]

requires:
  - phase: 09-plataforma-por-viaje
    provides: "Per-trip data gate (tests/data/trips.ts: loadTrip/checkTrip/listTripDirs, RULES with stray-file)"
provides:
  - "isYaml detects YAML extensions case-insensitively: .YML/.Yml/.YAML/.Yaml inside a trip folder become stray-file"
  - "checkTripsRoot(root = TRIPS_ROOT): every non-hidden non-directory entry under content/trips/ is a stray-file violation with its repo path"
  - "Private rootEntries(root): the single definition of hidden entries shared by listTripDirs and checkTripsRoot"
  - "Real-tree assertion 'content/trips solo contiene carpetas de viaje' inside pnpm test:data / pnpm verify"
affects: [data-gate, content-authoring, pnpm-verify, multi-trip]

actuals:
  tokens: 2700
  tasks: 3
  commits: 5
plan_head_before: 68be7a54331610c1225b68c4e522a549667f6e8c
plan_head_after: bf45c6bfc3c9df4f68b8fad294beb5a418eb2de0

tech-stack:
  added: []
  patterns:
    - "Partition invariant: listTripDirs + checkTripsRoot together account for every non-hidden root entry (trip folder or violation, never silently dropped)"
    - "Case-insensitive detection, case-sensitive classification: isYaml uses /i, COLLECTIONS[].match does not (mirror of content.config.ts *.yml globs)"

key-files:
  created:
    - tests/data/fixtures/trips/raiz.yml
    - tests/data/fixtures/trips/.oculto.yml
  modified:
    - tests/data/trips.ts
    - tests/data/invariants.spec.ts
    - tests/README.md

key-decisions:
  - "G-09-3: reuse the existing stray-file rule for loose root entries and upper-case YAML (RULES stays at 21), so the per-trip it.each(RULES) does not gain a rule no trip can trigger"
  - "G-09-3: COLLECTIONS[].match stays case-sensitive; only isYaml gets the /i flag, otherwise a .YML would load as a document and pass the gate while Content ignores it"
  - "G-09-3: checkTripsRoot is a root check, not part of checkTrip; listTripDirs still never throws (describe.each collection must not hide the culprit)"

patterns-established:
  - "Root partition: rootEntries() decides hidden once; listTripDirs takes directories, checkTripsRoot reports everything else"

requirements-completed: [PLAT-04]

coverage:
  - id: D1
    description: "A YAML file with any upper/mixed-case extension (.YML, .Yml, .YAML, .Yaml) inside a trip folder produces exactly one stray-file violation naming the file and is not loaded as a document"
    requirement: "PLAT-04"
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts#stray-file: %s es un YAML que Content no ingiere (sin distinguir mayúsculas)"
        status: pass
      - kind: integration
        ref: "cp content/trips/prueba/monuments/spagna.yml .../zzmayus.YML; vitest run tests/data -> exit 1 with 'content/trips/prueba/monuments/zzmayus.YML: [stray-file]'; file removed, content/trips clean"
        status: pass
    human_judgment: false
  - id: D2
    description: "Any non-hidden non-directory entry directly under content/trips/ is a stray-file violation with its repo path; hidden entries are ignored; listTripDirs(FIXTURES) unchanged"
    requirement: "PLAT-04"
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts#checkTripsRoot: fichero suelto en la raíz → stray-file; carpetas y ocultos no (fixtures en disco)"
        status: pass
      - kind: unit
        ref: "tests/data/invariants.spec.ts#listTripDirs lista solo carpetas, ordenadas (fixtures en disco)"
        status: pass
      - kind: integration
        ref: "printf 'slug: suelto' > content/trips/zzsuelto.yml; vitest run tests/data/invariants.spec.ts -> exit 1 with 'content/trips/zzsuelto.yml: [stray-file]'; file removed, content/trips clean"
        status: pass
    human_judgment: false
  - id: D3
    description: "The real content/trips tree (campania, forma, prueba, roma) has no root violations and the full data/unit/lint battery stays green with no diff in content/, content.config.ts, scripts/, shared/, app/, tests/parity/, tests/unit/"
    requirement: "PLAT-04"
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts#content/trips solo contiene carpetas de viaje: checkTripsRoot() sin violaciones"
        status: pass
      - kind: other
        ref: "pnpm test:data (786 passed) && pnpm test:unit (567 passed) && pnpm lint (exit 0)"
        status: pass
      - kind: other
        ref: "git diff --quiet f8241db -- content content.config.ts scripts shared app nuxt.config.ts package.json tests/parity tests/unit"
        status: pass
    human_judgment: false
  - id: D4
    description: "tests/README.md §5.3 documents checkTripsRoot() and case-insensitive YAML detection"
    verification:
      - kind: other
        ref: "grep -c checkTripsRoot tests/README.md >= 1"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-11-22
status: complete
---

# Phase 9 Plan 06: Data-gate fail-open closure (G-09-3) Summary

**The per-trip data gate no longer drops files silently: upper-case YAML extensions inside a trip and loose entries in the content/trips root now each produce a stray-file violation naming the file, and `pnpm test:data` fails on them.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-11-22T12:00:23Z
- **Completed:** 2026-11-22T12:02:41Z
- **Tasks:** 3 (1 tracer + 2 auto)
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- `isYaml` in `tests/data/trips.ts` now uses `/\.ya?ml$/i`. A `.YML`/`.Yaml` file reaches classification, matches no case-sensitive `COLLECTIONS[].match`, and becomes `stray-file`. Before, `loadTripFromFiles` hit `continue` for these files before the stray-file branch.
- New `checkTripsRoot(root = TRIPS_ROOT)` reports every non-hidden non-directory entry under the trips root (files, symlinks, anything else) as `stray-file` with its repo path. It is built on the private `rootEntries()` helper, which `listTripDirs` now also uses, so between them the two functions account for every non-hidden root entry.
- New tests: 6 in-memory extension cases, 1 on-disk fixtures case (`raiz.yml` reported, `.oculto.yml` and the folders not), and 1 real-tree assertion. `pnpm test:data` went from 778 to 786 tests.
- `tests/README.md` §5.3 documents the root partition and the case-insensitive YAML detection.

## Task Commits

1. **Task 1 (tracer): an upper-case .YML inside a trip is stray-file end to end**
   - `2f8f1d9` (test, RED): failing teeth for upper-case YAML extensions
   - `7d6f51f` (fix, GREEN): detect YAML extensions case-insensitively
2. **Task 2: loose entries in the content/trips root are stray-file**
   - `378c9fc` (test, RED): failing teeth for loose files in the trips root
   - `a152db3` (fix, GREEN): `checkTripsRoot` + `rootEntries`, `listTripDirs` rebuilt on top
3. **Task 3: document in tests/README.md §5.3 + full battery:** `bf45c6b` (docs)

Plan metadata: committed separately as `docs(09-06): complete ...`.

## TDD Gate Compliance

- **Task 1 RED:** the 6-case `it.each` ran with 5 failed and 1 passed. The lower-case `.yaml` control passed, which the plan expected. Each failure was the planned assertion: `expected [] to deeply equal [ { stray-file … } ]`, because the file was skipped. Machine evidence was produced with the JUnit reporter on the target `stray-file: monuments/galeria.YML …`, and `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK (target_test_failed)`. Semantic assessment: the target ran and failed on the planned behavioural assertion, not on a load or syntax fault.
  - Vitest's TAP reporters gave `invalid_record` (Non-TAP data / Malformed TAP) because Vitest prints the multi-line `expected` diagnostic with too little indentation. I reran the same target with `--reporter=junit` and did not edit the report.
- **Task 2 RED:** the target `checkTripsRoot: fichero suelto en la raíz …` failed with `TypeError: checkTripsRoot is not a function`, which is the failure the plan specified ("falla porque checkTripsRoot no existe"). JUnit evidence returned `RED_EVIDENCE_OK (target_test_failed)`. Semantic assessment: the failure happens inside the target test body (the named import resolves to `undefined` at runtime), not during collection, and the existing `listTripDirs` test stayed green in the same run.
- **GREEN commits use `fix(09-06)` instead of `feat(09-06)`.** The plan prescribed these exact commit messages, and this is a gap-closure bug fix (fail-open). Each GREEN commit directly follows its RED commit.
- There was no refactor commit; nothing needed cleaning up.

## Files Created/Modified

- `tests/data/trips.ts`: `isYaml` with `/i`, the `rootEntries` helper, `listTripDirs` rebuilt on it, exported `checkTripsRoot`, and JSDoc plus the contract-header bullet «Cierre G-09-3 (IN-05)».
- `tests/data/invariants.spec.ts`: the `checkTripsRoot` import, the real-tree assertion, the 6-case extension `it.each`, the on-disk root fixtures test, and a header line for G-09-3.
- `tests/data/fixtures/trips/raiz.yml` (new): a loose root file that must be reported as stray-file.
- `tests/data/fixtures/trips/.oculto.yml` (new): a hidden root entry that must be ignored. Confirmed not gitignored.
- `tests/README.md`: the new §5.3 bullet.

## Decisions Made

- Reused `stray-file` and did not add a new rule. `RULES` stays at 21.
- Added the `/i` flag only to `isYaml`. `COLLECTIONS[].match` still distinguishes case.
- `checkTripsRoot` is separate from `checkTrip`, and `listTripDirs` never throws.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Vitest's TAP reporter output is rejected by the RED-evidence classifier when a failure has multi-line diagnostics. I used the JUnit reporter instead, as described above. This did not affect the deliverable.

## Verification Results

- Task 1 verifies: 6 passed with the filter; the `zzmayus.YML` disk mutation made the gate fail and name the file; the `/\.ya?ml$/i.test(rel)` grep count is 1; eslint is clean. All PASS.
- Task 2 verifies: 3 passed with the `checkTripsRoot|listTripDirs` filter; the `content/trips/zzsuelto.yml` mutation made the gate fail and name the file; the export exists and both fixtures exist and are not ignored; eslint is clean. All PASS.
- Task 3 verifies: the README grep passes. `pnpm test:data` 786 passed, `pnpm test:unit` 567 passed, `pnpm lint` exit 0. The preservation gate shows no diff in content/, content.config.ts, scripts/, shared/, app/, nuxt.config.ts, package.json, tests/parity/ or tests/unit/ since f8241db, and `git status` for content/tests/parity/app is clean. All PASS.
- Both prohibitions hold. A loose root file, an upper-case YAML extension, a missing trip.yml, and empty or broken YAML each produce a violation naming the file. No file under content/, tests/parity/, app/assets/css/ or content.config.ts changed. Both disk mutations were removed within their own command.

## Next Phase Readiness

G-09-3 is closed and prohibition 09-02 has no remaining residual. Ready for `/gsd-verify-work 09` to reconcile 09-UAT.md (left untouched, as instructed).

## Self-Check: PASSED

- FOUND: tests/data/trips.ts, tests/data/invariants.spec.ts, tests/data/fixtures/trips/raiz.yml, tests/data/fixtures/trips/.oculto.yml, tests/README.md
- FOUND commits: 2f8f1d9, 7d6f51f, 378c9fc, a152db3, bf45c6b
