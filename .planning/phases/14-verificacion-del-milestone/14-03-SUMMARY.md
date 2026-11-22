---
phase: 14-verificacion-del-milestone
plan: 03
subsystem: testing
tags: [gate, verify, parity, goldens, css, uat, par-03, par-04, d-01, d-02, d-07, d-08]
status: complete

requires:
  - phase: 14-verificacion-del-milestone (14-01)
    provides: tests/parity/upgrade-from-main.spec.ts (+4 gate tests, port 6600)
  - phase: 14-verificacion-del-milestone (14-02)
    provides: tests/parity/cross-trip.spec.ts (+12 gate tests, port 6700) and tests/data/css-vs-main.spec.ts (+7 data tests)
  - phase: 13-contenido-campania-2027
    provides: Campania published; gate registered at 110 / 13
provides:
  - Clean-cache gate evidence for the v1.1 milestone (verify, typecheck, lint, test:trips)
  - tests/README.md §4 gate counts re-registered (126 / 15 selected, 128 / 15 raw), §1 ports note, new §6 «Verificación del milestone (Fase 14)»
  - .planning/phases/14-verificacion-del-milestone/14-UAT.md, the Spanish phone sign-off checklist for PAR-04
affects: [milestone-v1.1, /gsd-verify-work 14, /gsd-audit-milestone, /gsd-complete-milestone]

actuals:
  tokens: 4279
  tasks: 3
  commits: 3
plan_head_before: ac0b791d460718cecc318b42888b60007f32265f
plan_head_after: 5dd74f0128364c459568ba64a7e8025c968678c7

tech-stack:
  added: []
  patterns:
    - "Gate counts registered verbatim from a fresh `--list`, so the plan's automated check can grep the exact `Total:` line"

key-files:
  created:
    - .planning/phases/14-verificacion-del-milestone/14-UAT.md
  modified:
    - tests/README.md

key-decisions:
  - "Gate total measured, not computed: 126 tests in 15 files (grep-invert) and 128 in 15 (raw) = 110 + 16, so no unexplained difference"
  - "navigation.spec.ts SC#2 [mobile] failing alone in verify runs 2 and 3 is classified as the D-01 known flake (3/3 in isolation, about 28.9 s against a 30 s budget). It is not a D-06 defect, and no more verify retries were made beyond the one the policy allows"
  - "PAR-03 marked complete (last plan that declares it, re-verified inside the clean gate). PAR-04 left Pending for the human sign-off in 14-UAT.md"

requirements-completed: [PAR-03]

coverage:
  - id: D-01
    description: "pnpm verify from clean caches with both new parity specs and the CSS data test inside"
    requirement: PAR-03
    verification:
      - kind: command
        ref: "rm -rf .data .nuxt .output && pnpm verify (run 1: unit 567, data 774, parity 126 passed, exit 0)"
        status: pass
      - kind: command
        ref: "git diff --quiet v1.0 HEAD -- tests/parity/golden.spec.ts-snapshots (0); git log v1.0..HEAD on it empty; 56 PNGs"
        status: pass
    human_judgment: false
  - id: D-02
    description: "Frozen CSS unchanged since v1.0, and the build's CSS equals main's"
    verification:
      - kind: command
        ref: "git diff --quiet v1.0 HEAD -- app/assets/css/{base,tokens,fonts,leaflet}.css (0)"
        status: pass
      - kind: unit
        ref: "tests/data/css-vs-main.spec.ts (inside verify, 774/774 data tests passed)"
        status: pass
    human_judgment: false
  - id: gate-counts
    description: "tests/README.md §4 registers the fresh --list totals and per-file rows; §1 and §6 document the Phase 14 specs"
    verification:
      - kind: command
        ref: "grep -qF \"$(playwright --list | tail -1)\" tests/README.md (selected and raw)"
        status: pass
    human_judgment: false
  - id: PAR-04
    description: "Roma and Campania signed off on a real phone, light and dark, offline with the guide open"
    requirement: PAR-04
    human_judgment: true
    rationale: "Real-device rendering and offline behaviour need a person (D-07). The checklist is 14-UAT.md, with 9 pending items"

duration: 10min
completed: 2026-11-22
---

# Phase 14 Plan 03: Milestone gate from clean caches, re-registered counts and phone checklist Summary

**`pnpm verify` passes from clean caches with the two new parity specs (126 tests) and the CSS-vs-main data test inside. Goldens and frozen CSS are byte-unchanged since `v1.0`. tests/README.md registers 126 / 15 and documents Phase 14 in a new §6, and 14-UAT.md gives the user a 9-item Spanish phone checklist to sign PAR-04.**

## Performance

- **Duration:** about 10 min (2026-11-22T02:00:40Z to 02:12Z)
- **Tasks:** 3/3
- **Files:** 1 created, 1 modified

## Gate evidence (D-01)

| Run | Command | Result |
|-----|---------|--------|
| verify 1 (Task 1) | `rm -rf .data .nuxt .output && pnpm verify` | **exit 0**: unit 24 files / 567 passed. data 8 files / 774 passed (css-vs-main and build-isolation inside, 0 skipped). parity **126 passed** (1.2 min) |
| verify 2 (tracer gate re-run) | same | exit 1: 125 passed, 1 failed, and that one is only `navigation.spec.ts:248` «SC#2» [mobile] (29.0 s, timeout; `#viernes` instead of `#sabado`) |
| known-flake rerun | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/navigation.spec.ts --project mobile -g "SC#2" --repeat-each 3` | **9 passed** (the grep also matches the describe title, so SC#1/SC#2/SC#3 × 3). SC#2 [mobile] 3/3 at 28.9 s each |
| verify 3 (D-01 «run verify once more») | same | exit 1: 125 passed, 1 failed, again only «SC#2» [mobile] (29.0 s) |
| typecheck / lint | `pnpm typecheck && pnpm lint` + `eslint --no-ignore` on the two new parity specs | all exit 0, no errors |
| test:trips (after verify) | `rm -rf .data .nuxt && pnpm test:trips` | **46 passed**; `--list` = `Total: 46 tests in 4 files` (already registered in §5.1, so no change) |

**Flake reading.** Only the D-01 known flake failed, and it failed alone. In isolation it passes 3/3, but even then it takes about 28.9 s of its 30 s budget. In verify run 1 it passed at 29.5 s. It is a timing-budget problem of a frozen parity spec, not a behaviour change: the two new specs and every other test passed in all three runs. Per D-01 it is not fixed in this phase (existing parity specs are frozen), and I made no extra verify retries beyond the one allowed. `legacy-redirect` «/#pantheon» [desktop] did not fail in any run.

## History evidence (D-01, D-02)

- `git diff --quiet v1.0 HEAD -- tests/parity/golden.spec.ts-snapshots` → **0**.
- `git log --format=%h v1.0..HEAD -- tests/parity/golden.spec.ts-snapshots` → **empty**. The last commit to touch it is 36d5292 (2026-06-24, before the v1.0 tag).
- `git ls-files 'tests/parity/golden.spec.ts-snapshots/*.png' | wc -l` → **56**. After every verify run the working tree under that path was clean versus v1.0, with no untracked files.
- **No golden changed since v1.0, so there is no BLOCKER.** The ROUTE-06 golden exception approved in Phase 11 was **never used**: no golden captures the footer (11-CONTEXT D-02).
- `git diff --quiet v1.0 HEAD -- app/assets/css/base.css app/assets/css/tokens.css app/assets/css/fonts.css app/assets/css/leaflet.css` → **0**. Combined with `tests/data/css-vs-main.spec.ts` passing in these verify runs, this shows the CSS the build ships equals main's.
- **Phase-wide frozen paths (D-09):** `git log -E --grep='^[a-z]+\(14-0[1-9]\)' 3dfdba9..HEAD` over content/trips, app, shared, nuxt.config.ts, content.config.ts, scripts and tests/parity (minus the two new specs) is **empty**, and `git status --porcelain` on those paths is empty. So no `<style scoped>` or new `v-html` entered app/**, and no existing parity spec or golden was edited. Phase 14 touched only tests/parity/upgrade-from-main.spec.ts, tests/parity/cross-trip.spec.ts, tests/data/css-vs-main.spec.ts, tests/README.md and planning docs.

## Gate counts (Pitfall 4)

- Selected (grep-invert): `Total: 126 tests in 15 files`. Raw: `Total: 128 tests in 15 files`.
- 126 = 110 + 16 (upgrade-from-main 4 + cross-trip 12), as expected. No other parity spec landed, so there is no unexplained difference.
- Per-file measured: portada 14, modes 14, legacy-redirect 14, map-fallback-notes 12, **cross-trip 12**, search-route 10, shell 8, render-reference 8, theme 6, render-timeline 6, render-cards 6, navigation 6, visual-diff 4, **upgrade-from-main 4**, subpath 2.

## Accomplishments

- **Task 1 (tracer):** clean-cache `pnpm verify` green on the first run. tests/README.md §4 re-registered: both table values, the 128 → 126 grep-invert note, the Phase 14 history line, the per-file rows, the «suma = 126» heading, the expected `Total:` of the recompute snippet and a dated measurement note. Both automated `--list` greps pass.
- **Task 2:** typecheck and lint are clean, the new parity specs lint clean with `--no-ignore`, and test:trips passed 46/46 after verify. The history evidence above was collected. README §1 now names the two Phase 14 specs and their ports, and the new §6 has 6.1 upgrade-from-main, 6.2 cross-trip, 6.3 css-vs-main and 6.4 «Cierre del hito» (gate order, known flakes, goldens, pointer to 14-UAT.md).
- **Task 3:** `14-UAT.md` uses the UAT template and is in Spanish. It has a LAN-serving preparation section (copy into `guiaRoma/`, `python3 -m http.server 5090 --bind 0.0.0.0`, open `/guiaRoma/`, never serve `.output/public` at the root, WSL2 mirrored/portproxy note, stop the server afterwards) and 9 pending checks: portada and «← Todos los viajes»; Roma light/dark; Campania light/dark; notes per trip; pace and modes per trip; Maps route modes (Roma walking; Campania jueves 24 / viernes 25 driving, martes 22 transit; no button on sábado 19, domingo 20, lunes 21, domingo 27, lunes 28); offline in Roma and in Campania with the guide already open (image fallback, «Sin conexión · solo marcadores visibles», no full offline reload in 1.x); sign-off with phone model and browser. Its closing notes say PAR-03 is automated, list UATs 09-13 as pending, and add the D-08 note.

## Task Commits

1. **Task 1 (tracer): register gate counts 126/15 and 128/15 after a clean-cache verify.** `004b9ae` (docs)
2. **Task 2: document the Phase 14 milestone specs in tests/README.md §1 and §6.** `df1610c` (docs)
3. **Task 3: Spanish phone sign-off checklist for PAR-04.** `5dd74f0` (docs)

## Files Created/Modified

- `tests/README.md`: §1 ports note, §4 counts, new §6.
- `.planning/phases/14-verificacion-del-milestone/14-UAT.md`: new phone checklist (PAR-04).

## Decisions Made

- I classified the repeated SC#2 [mobile] failure as the D-01 known flake rather than a D-06 defect. It is the only failure, it is on the named list, it passes in isolation, and it fails on the 30 s timeout rather than on a wrong-state assertion that reproduces at rest.
- PAR-03 is marked complete. PAR-04 stays Pending (backstop truth: only the user can sign it).
- Per D-08, neither `/gsd-audit-milestone` nor `/gsd-complete-milestone` was run.

## Deviations from Plan

None in the deliverables. In the gate: after the D-01 known-flake rerun (3/3 green), the extra verify the policy calls for (verify 3) was not green, because the same known flake failed alone again. The plan's done criterion «pnpm verify green from clean caches» is met by verify 1, which passed fully. All three runs and the flake rerun are recorded above. No snapshot update, no skip, no exclusion change.

**Total deviations:** 0 auto-fixed. **Impact:** none on the deliverables. The flake's frequency is a risk worth noting (see Issues).

## Defecto real (D-06)

None. The only failures were the named known flake, and every other test (the two new specs included) passed in all three verify runs.

## Issues Encountered

- **navigation.spec.ts «SC#2 scrollspy» [mobile] is now at its timeout edge:** about 28.9 s isolated, 29.0-29.5 s under 12 workers, against a 30 s budget. It failed in 2 of the 3 verify runs here. It is a pre-existing frozen parity spec, so it is not fixed in Phase 14 (D-01/D-09). A later plan could give that one test a larger timeout or shorten its poll loop, but that needs a decision because existing parity specs are frozen.

## Known Stubs

None.

## Threat Flags

None. Documentation only. The LAN server in 14-UAT.md is the accepted T-14-12.

## User Setup Required

None for the automation. For PAR-04, the user follows 14-UAT.md on a real phone.

## Next Phase Readiness

- Phase 14 plans are all complete. The phase verification should end **human_needed** with the 9 items of 14-UAT.md (PAR-04).
- After the user's sign-off: `/gsd-verify-work 14`, then `/gsd-audit-milestone` and `/gsd-complete-milestone` (D-08). Deploy and merge to main are a separate ship act.

## Self-Check: PASSED

- FOUND: tests/README.md, .planning/phases/14-verificacion-del-milestone/14-UAT.md
- FOUND: 004b9ae, df1610c, 5dd74f0 (ancestors of HEAD)
- Acceptance re-run: README rows `upgrade-from-main.spec.ts` | 4 and `cross-trip.spec.ts` | 12 present; «Fase 14» present; `## 6.` present; 56 PNGs; golden working tree clean versus v1.0; 14-UAT.md has 9 `### N.` items with `result: [pending]`, `total: 9`, `pending: 9`, no email; `[x] **PAR-04**` count in REQUIREMENTS.md = 0
