---
phase: 09-plataforma-por-viaje
plan: 05
subsystem: testing
tags: [vitest, playwright, nuxt-content, static-build, multi-trip, isolation, gate]
status: complete

requires:
  - phase: 09-plataforma-por-viaje
    provides: "09-01 suffixed state keys (tripStateKey); 09-02 per-trip data gate (checkTrip/RULES); 09-03 fictional trip prueba + sentinel; 09-04 test:trips E2E + coupling guard"
provides:
  - tests/data/build-isolation.spec.ts — build sentinel inside test:data (Roma build has no prueba data, state keys suffixed)
  - package.json verify starts with rm -rf .data .nuxt .output
  - tests/README.md §5 «Aislamiento por viaje (Fase 9) — pnpm test:trips»
  - full phase gate evidence (verify, test:trips, frozen paths, YAML mutation)
affects: [10 (new trip data must pass the per-trip gate), 11 (draft flag must also keep prueba out of the public sql_dump), 12-14]

actuals:
  tokens: 3250
  tasks: 2
  commits: 3
plan_head_before: 27170b1f2d9bfce7313c4502804addc8218d1b21
plan_head_after: 7431fce9fa96cb0bf225dfa5f0254710d6253f10

tech-stack:
  added: []
  patterns:
    - "Build sentinel: a unique string that lives only in a non-published trip, asserted absent from the prerendered page and payload"
    - "Gate starts from clean caches (rm -rf .data .nuxt .output) so Content cannot serve stale rows"

key-files:
  created:
    - tests/data/build-isolation.spec.ts
  modified:
    - package.json
    - tests/README.md

key-decisions:
  - "build-isolation.spec.ts is a regression guard, not new behaviour: the isolation it checks was delivered by 09-01/09-03, so its first run was green. Its teeth were proven by mutating the gitignored build output (sentinel + unsuffixed \"$space\" + trips/ dir → 3 failed; sentinel in _payload.json → 1 failed; restored → 4 passed; no build → 4 skipped)"
  - "The sentinel check on _payload.json is conditional on the file existing; index.html must exist or the describe is skipped"
  - "verify cleans caches itself (Pitfall 5 / Open Q2), so the gate can no longer pass on stale Content data"

patterns-established:
  - "Pattern: per-trip isolation is proven by three in-gate checks (data gate per trip, coupling guard, build sentinel) plus one out-of-gate dev E2E (test:trips)"

requirements-completed: [PLAT-01, PLAT-02, PLAT-03, PLAT-04]

coverage:
  - id: D1
    description: "The static Roma build carries no data from the prueba trip: Galleria Sciarra present, PRUEBA-CENTINELA-9F3 absent from index.html and _payload.json, no .output/public/trips, payload uses $space:roma / $scardNav:stack:roma / $ssearch:query:roma and no unsuffixed $space"
    requirement: PLAT-03
    verification:
      - kind: unit
        ref: "tests/data/build-isolation.spec.ts (4 passed after clean nuxi generate, 0 skipped; inside pnpm verify)"
        status: pass
    human_judgment: false
  - id: D2
    description: "pnpm verify starts from clean caches and passes end to end"
    requirement: PLAT-04
    verification:
      - kind: other
        ref: "pnpm verify (shim, Node 22) → exit 0: unit 164/164 (13 files), data 263/263 (4 files), parity 80 passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "An invalid YAML in a trip other than Roma breaks the gate naming its file and rule"
    requirement: PLAT-04
    verification:
      - kind: other
        ref: "append «meta: roto» to content/trips/prueba/monuments/spagna.yml → vitest run tests/data exit 1, «content/trips/prueba/monuments/spagna.yml: [reserved-key] campo reservado de Content \"meta\"»; restored → 263 passed, git status clean"
        status: pass
    human_judgment: false
  - id: D4
    description: "Per-trip search, navigation and prefs/notes on a second real trip"
    requirement: PLAT-01
    verification:
      - kind: e2e
        ref: "pnpm test:trips (playwright.trips.config.ts) after verify → 5 passed (28.0 s)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Roma parity frozen: no diff vs 79e57e0 in tests/parity, content/trips/roma, nuxt.config.ts, app/assets/css, migration-diff, parity Playwright configs; 56 goldens; gate lists 80 tests in 11 files"
    requirement: PLAT-02
    verification:
      - kind: other
        ref: "git diff --quiet 79e57e0 -- <frozen paths> && playwright test -c playwright.gate.config.ts --grep-invert … --list → Total: 80 tests in 11 files; ls goldens → 56"
        status: pass
    human_judgment: false
  - id: D6
    description: "tests/README.md documents the per-trip isolation checks and test:trips"
    verification:
      - kind: other
        ref: "grep acceptance criteria (pnpm test:trips, verify composition, content/trips/prueba, §4 count line) all ≥1"
        status: pass
    human_judgment: true
    rationale: "Whether the README reads clearly for a future contributor is a judgment call"

duration: 8min
completed: 2026-11-20
---

# Phase 9 Plan 05: Build sentinel, clean-cache verify and the phase gate Summary

**`pnpm verify` now starts by deleting the Content caches. A new build sentinel in `test:data` confirms that the static Roma page carries nothing from the prueba trip and that its state keys are suffixed per trip. The full phase gate is green: unit 164, data 263, parity 80, test:trips 5. Roma parity has no diffs.**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-11-20T10:47Z
- **Completed:** 2026-11-20T10:55Z
- **Tasks:** 2
- **Files:** 1 created, 2 modified

## Accomplishments

- **`tests/data/build-isolation.spec.ts`** uses only Node (`node:fs`, `node:path`) and has one `describe.skipIf(!existsSync(INDEX))` with four `it` blocks:
  - `index.html` contains «Galleria Sciarra», so the spec cannot pass on an empty build.
  - `PRUEBA-CENTINELA-9F3` appears in neither `index.html` nor `_payload.json`.
  - `.output/public/trips` does not exist.
  - The payload contains `"$space:roma"`, `"$scardNav:stack:roma"` and `"$ssearch:query:roma"`, and no `"$space"` with the closing quote right after it.
- **`package.json`**: `verify` is now `rm -rf .data .nuxt .output && pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity`. Nothing else changed, and dependencies are identical to `79e57e0`.
- **`tests/README.md`**:
  - §1 shows the new `verify` composition, with one sentence explaining why the caches are cleaned.
  - The layer table now mentions the coupling guard under `test:unit`, and the per-trip run plus the build sentinel under `test:data`.
  - New section «5. Aislamiento por viaje (Fase 9) — pnpm test:trips» covers:
    - 5.1: `test:trips` with its 5 tests and config. Also why it stays out of `verify` and how to run it: Node 22, `rm -rf .data .nuxt` first, never alongside `verify`, pnpm shim.
    - 5.2: the prueba fixture, its sentinel, and the Phase 11 `draft`/`sql_dump` note.
    - 5.3: the per-trip data gate (`RULES`, messages that name the file, «dientes» block, the checks that stay Roma-only).
    - 5.4: the coupling guard and its exceptions.
    - 5.5: the build sentinel.
  - §2-§4, including the 80/11 count, are unchanged.

## Task Commits

1. **Task 1 (test):** `303a078` test(09-05): build sentinel spec — Roma build carries no prueba data, state keys suffixed
2. **Task 1 (feat):** `a812c12` feat(09-05): pnpm verify starts from clean Content caches
3. **Task 2:** `7431fce` docs(09-05): document per-trip isolation checks in tests/README

## TDD Gate Compliance

- **RED:** the run was unexpectedly green, which was expected here. The spec was written first and run against the existing build: 4 passed. Per the fail-fast rule this was investigated. The behaviour it guards was delivered by 09-01 (suffixed `useState` keys) and 09-03 (prueba not prerendered). The spec is a regression guard on existing behaviour, not a driver of new code. No RED evidence file was fabricated.
- **Teeth (mutation evidence in place of RED):** the gitignored `.output/public` was mutated and then restored byte-for-byte (`cmp` OK):
  - Appending `PRUEBA-CENTINELA-9F3 "$space"` to `index.html` and creating `trips/` gave 3 failed, 1 passed. Only the Galleria Sciarra check still passed.
  - Appending the sentinel to `_payload.json` gave 1 failed, 3 passed.
  - Restoring both files gave 4 passed.
  - Removing `index.html` gave 4 skipped.
- **GREEN:** after `rm -rf .data .nuxt .output && nuxi generate`, the spec gave 4 passed with nothing skipped.
- **REFACTOR:** none.

## Phase Gate (run in the order the plan specifies)

| Step | Result |
|------|--------|
| `pnpm verify` (shim + Node 22, from clean caches) | exit 0. unit **164/164** (13 files), data **263/263** (4 files, which is the earlier 259 plus 4 new), parity **80 passed**, no failed or flaky tests, 0 «window is not defined» |
| `rm -rf .data .nuxt && playwright test -c playwright.trips.config.ts` (after verify) | **5 passed** (28.0 s) |
| `git diff --quiet 79e57e0 -- tests/parity/ content/trips/roma/ nuxt.config.ts app/assets/css/ tests/data/migration-diff.spec.ts scripts/migration-diff.ts playwright.config.ts playwright.gate.config.ts` and no untracked files there | clean |
| Gate `--list` | `Total: 80 tests in 11 files` |
| Goldens | 56 |
| Add `meta: roto` to `content/trips/prueba/monuments/spagna.yml`, then run `vitest run tests/data` | exit 1, 1 failed / 262 passed, message `content/trips/prueba/monuments/spagna.yml: [reserved-key] campo reservado de Content "meta"` |
| Restore that file, run `vitest run tests/data` again | 263 passed, `git status -- content/trips/prueba` clean |

Relative to the base `79e57e0`, the gate's only visible change is the 4 new data tests. The 09-03 change to searchIndex (it now indexes link text) leaves the parity results unchanged at 80/80.

## Deviations from Plan

- **Log paths:** the plan's `<verify>` commands write logs to `/tmp/…` and create a `/tmp/pnpm-shim`. I ran them with the session scratchpad paths and its existing pnpm shim instead, because the environment requires scratchpad use for temporary files. The commands and their assertions were otherwise identical.
- **Node 22:** all build, test, lint and Playwright commands ran with Node 22 on the PATH (`better-sqlite3` does not load on Node 24), as the project notes require.

**Total deviations:** none that change behaviour; only the environment adjustments above. **Impact:** none.

## Issues Encountered

None.

## Findings for Phases 10-11 (carried from 09-03/09-04)

- **Phase 10:** day slugs of any trip must be `viernes`…`martes`, because TripView only mounts those five DaySection components (D-03 finding, recorded in `content/trips/prueba/trip.yml`). New trip data passes through the same per-trip gate (`checkTrip`, 14 rules).
- **Phase 11 (ROUTE-05 `draft`):**
  - Uncomment `draft: true` in `content/trips/prueba/trip.yml`.
  - The filter must also keep prueba rows out of the public `__nuxt_content/*/sql_dump.txt`. Otherwise the `github_pages` 404/200 SPA shell could render `/trips/prueba` in production.
  - `app/pages/index.vue` (`slug="roma"`) is a documented exception to the coupling guard until then.

## Known Stubs

None.

## Next Phase Readiness

This is the last plan of Phase 9, and the phase gate is green. Ready for `/gsd-verify-work 09`.

## Self-Check: PASSED

- FOUND: tests/data/build-isolation.spec.ts, package.json, tests/README.md
- FOUND commits: 303a078, a812c12, 7431fce (ancestors of HEAD)
- Acceptance criteria for Task 1 and Task 2: all PASS (see the gate table above)
