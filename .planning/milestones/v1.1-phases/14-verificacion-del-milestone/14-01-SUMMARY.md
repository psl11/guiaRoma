---
phase: 14-verificacion-del-milestone
plan: 01
subsystem: testing
tags: [playwright, parity, localStorage, upgrade, par-03, same-origin]
status: complete

requires:
  - phase: 09-claves-por-viaje
    provides: per-trip storage keys `${slug}-${key}` (Roma keys equal the live guide's), theme kept global in `roma-theme`
  - phase: 11-portada-y-rutas
    provides: tests/parity/_pagesServer.ts (startPagesServer), _harness.ts (SITE_BASE, ROMA_URL, OUTPUT_DIR, ROMA_HTML), portada with `a.trip-index-card`
  - phase: 13-contenido-campania-2027
    provides: Campania published (24 cards with `.notes-textarea`), gate 110 / 13 files
provides:
  - tests/parity/upgrade-from-main.spec.ts — same-origin upgrade test from main's index.html to the new build (PAR-03), inside the parity gate (+4 tests: 2 tests x mobile/desktop)
  - Evidence: the new build's first load of /guiaRoma/trips/roma/ equals the live guide's own restore for 38 notes, pace, modes, toggles and theme, with no stored value lost
affects: [14-02, 14-03, tests/README.md gate counts, milestone-v1.1]

actuals:
  tokens: 4207
  tasks: 2
  commits: 2
plan_head_before: 1712475353f235d6d23f68b55e9a63dc9c7b2b93
plan_head_after: 64bd5905a649da8b6071ac2fb3d36a79a2dbefdf

tech-stack:
  added: []
  patterns:
    - "Differential oracle: the expected UI state is computed by running main's index.html in a fresh browser context seeded with the user's storage snapshot, never hand-written"
    - "Same-origin server swap: close the old server (closeAllConnections first) and start the new build on the same 127.0.0.1 port, keeping one browser context so localStorage carries over"
    - "Live guide taken with `git show main:index.html` into an os.tmpdir() mkdtemp dir at test time, deleted in afterAll (never committed)"

key-files:
  created:
    - tests/parity/upgrade-from-main.spec.ts
  modified: []

key-decisions:
  - "The oracle also returns the live guide's storage after its own restore, so the one allowed rewrite (roma-pace forced to slow by light mode) is asserted against main's real behaviour, not a comment"
  - "Portada storage check runs after hydration (stronger than at domcontentloaded): the portada writes nothing even once Nuxt is live"
  - "Campania non-vacuity: the spec asserts Campania has notes textareas (24) before asserting they are all empty"

patterns-established:
  - "Upgrade specs use port base 6600 + TEST_WORKER_INDEX (14-02 uses 6700)"

requirements-completed: []

coverage:
  - id: D-03
    description: "Live guide driven like a real user (notes, pace, light, resumen, theme) fills roma-note-<slug>, roma-pace, roma-light, roma-resumen, roma-theme; first load of the new build equals the oracle"
    requirement: PAR-03
    verification:
      - kind: e2e
        ref: "tests/parity/upgrade-from-main.spec.ts#upgrade: las notas de las 38 fichas..."
        status: pass
      - kind: e2e
        ref: "tests/parity/upgrade-from-main.spec.ts#upgrade: «caminar menos» guardado con otro ritmo..."
        status: pass
  - id: D-04
    description: "Old guide and new build served on the same 127.0.0.1:PORT by two startPagesServer instances, one browser context throughout"
    requirement: PAR-03
    verification:
      - kind: e2e
        ref: "tests/parity/upgrade-from-main.spec.ts (both tests)"
        status: pass

duration: ~15min
completed: 2026-11-22
---

# Phase 14 Plan 01: Same-origin upgrade from main's live guide Summary

**A new parity spec runs the real `main:index.html` and the real `.output/public` build on the same 127.0.0.1 port in one browser context, and proves that 38 notes, pace, «Caminar menos», modo resumen and the dark theme reach `/guiaRoma/trips/roma/` on the first load exactly as the live guide itself restores them, with every stored key byte-identical (orphan note included).**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-11-22T01:53:15Z
- **Tasks:** 2/2
- **Files modified:** 1 (new)

## Accomplishments

- **Tracer (Task 1):** one note on the Pantheon card plus pace «Neutra» written in the live guide appear in the new build's Roma page on the first navigation after a same-port server swap. 2/2 passed, and 2/2 again on the tracer gate re-run.
- **Test A:** dark theme, 38 distinct notes (Spanish «comillas», "dobles", an accent, €, a newline), pace neutral, modo resumen, plus an orphan key `roma-note-ficha-retirada`. The oracle is non-default. The portada (old bookmark) is dark at domcontentloaded and writes nothing. Roma, reached from the portada card, is dark at domcontentloaded and equals the oracle. Every S0 key keeps its value in both the new build and the live guide's restore. No textarea shows the orphan note. A reload equals the oracle again. Campania is dark (the theme is global) but stays on optimistic pace, with no light/resumen and 24 empty notes, and the roma-* keys are untouched.
- **Test B:** the stored edge `roma-pace=neutral` + `roma-light=1` (+ resumen + one note). Both guides show «Pesimista» with light and resumen on. `roma-pace` is rewritten to `slow` by the new build, and the oracle proves the live guide does the same rewrite on its own restore. Every other key is intact.
- `--repeat-each 3`: **12 passed** (2 tests × 2 projects × 3). `--list`: **Total: 4 tests in 1 file**. `eslint --no-ignore`: clean.

## Task Commits

1. **Task 1 (tracer): one note and one pace from the live guide reach /trips/roma/** — `261be69` (test)
2. **Task 2: full differential upgrade (38 notes, pace, resumen, theme, caminar menos, orphan key, reload, Campania)** — `64bd590` (test)

## Files Created/Modified

- `tests/parity/upgrade-from-main.spec.ts`: new PAR-03 upgrade spec. Helpers are cloned from portada.spec.ts (ensureBuild, blockOffOrigin, hydrated). Also adds readLiveGuide, stopServer, captureState, storageSnapshot, oracleFromLiveGuide and noteFor, plus two tests.

## Decisions Made

- The oracle returns `{ state, storage }`. The live guide's own post-restore storage is the reference for the "only allowed rewrite" (roma-pace → slow under light mode), and in Test A for the "no rewrite at all" case.
- The portada storage equality is checked after hydration rather than only at domcontentloaded. This is stronger, and it is what an old bookmark exercises.
- The note-key set is derived from `content/trips/roma/monuments/*.yml` (38). It is never a literal.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ESLint errors in the tracer draft**
- **Found during:** Task 1 (eslint --no-ignore)
- **Issue:** `preserve-caught-error`: the rethrown Error in readLiveGuide had no `cause`. `no-unused-vars`: captureState was defined in Task 1 but used only in Task 2.
- **Fix:** passed `{ cause: err }`. The tracer now uses captureState to assert that the new build exposes the same 38 note keys as the content.
- **Files modified:** tests/parity/upgrade-from-main.spec.ts
- **Commit:** 261be69

Otherwise the plan was executed as written. TDD note (Task 2, `tdd="true"`): the deliverable is the test itself, run against already-implemented behaviour (Phase 9 keys). It passed on its first run, and its non-vacuity is enforced by assertions on the oracle, not by a RED commit.

## Defecto real (D-06)

None. The new build matched the live guide's oracle in every field, 12/12 across repeats.

## Issues Encountered

None. No flaky runs were observed.

## Known Stubs

None.

## Threat Flags

None. The spec only adds 127.0.0.1-bound test servers (T-14-04, already in the threat model). The temp dir is removed in afterAll: after the runs, no `guiaroma-upgrade-*` was left in /tmp.

## Next Phase Readiness

- PAR-03 is **not** marked complete here. 14-02 (cross-trip isolation) and 14-03 (clean-gate rerun) also declare it.
- 14-03 must re-register the gate total: 110 → 114 tests, 13 → 14 files, before 14-02's additions.

## Self-Check: PASSED

- FOUND: tests/parity/upgrade-from-main.spec.ts
- FOUND: 261be69, 64bd590 (ancestors of HEAD)
- `git ls-files '*.html'` = 2 (no committed copy of the live guide)
- `git diff --quiet 2c9ba3e -- tests/parity` (excluding the new specs) = 0 (no existing parity file changed)
