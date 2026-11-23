---
phase: 10-forma-y-chrome-desde-datos
plan: 05
subsystem: testing
tags: [playwright, vitest, unicode-regex, multi-trip, trap-test, chrome]
status: complete

requires:
  - phase: 10-02
    provides: per-trip chrome (pageTitle/brand/mapLegend/footer) with neutral fallback; ROMA_CHROME_LITERALS guard
  - phase: 10-04
    provides: dev-only forma trip and tests/trips/shape.spec.ts
provides:
  - tests/trips/romaLeaks.ts (ROMA_MARKERS, findRomaLeaks with Unicode word boundaries)
  - tests/unit/romaLeaks.spec.ts (18 matcher teeth)
  - shape.spec.ts trampa:/chrome:/título: blocks (7 new E2E tests against nuxi dev)
  - tests/README.md §5.1 update and §5.6 «Forma y chrome desde datos (Fase 10)»
affects: [phase 11 draft/ROUTE-05, phase 12-13 Campania (new trips enter the trap automatically)]

actuals:
  tokens: 9700
  tasks: 2
  commits: 3
plan_head_before: 7e87f99a645949db4c960e71c5ebf59a4ec472bc
plan_head_after: 089cf376b4afad47507fac5cecbd98e1bc6267ac

tech-stack:
  added: []
  patterns:
    - "Leak matchers use Unicode lookarounds (?<![\\p{L}\\p{N}]) … (?![\\p{L}\\p{N}]) with flags iu instead of ASCII \\b"
    - "Trap tests are non-vacuous by construction: render precondition + no-vacuity of the trip list + positive control on the source trip"
    - "Trip lists in E2E are derived from content/trips via readdirSync, so a new trip enters the trap without code changes"

key-files:
  created:
    - tests/trips/romaLeaks.ts
    - tests/unit/romaLeaks.spec.ts
    - .planning/phases/10-forma-y-chrome-desde-datos/evidence/10-05-red-romaLeaks.json
    - .planning/phases/10-forma-y-chrome-desde-datos/evidence/10-05-red-romaLeaks.junit.xml
  modified:
    - tests/trips/shape.spec.ts
    - tests/README.md

key-decisions:
  - "Trap scans document.title, body innerText and a script/style/noscript/template-free body clone textContent; the Nuxt payload is not scanned (guiaRoma baseURL is not a leak)"
  - "RED evidence captured with Vitest's JUnit reporter: the classifier rejects Vitest TAP output (unindented multi-line YAML in array diffs)"
  - "Roma URL added to the shape.spec beforeAll warm-up so the positive control does not pay Vite's first-compile reload"

requirements-completed: [SHAPE-03, SHAPE-04, SHAPE-05]

duration: 6min
completed: 2026-11-20
---

# Phase 10 Plan 05: Roma leak trap, per-trip chrome E2E and phase gate Summary

**A Unicode-word-boundary leak matcher (18 Vitest teeth) drives a dev E2E trap that scans every non-Roma trip for Roma text after proving the page rendered, with a positive control on Roma. Per-trip brand, legend, footer and exact tab titles are proven in the browser, including prueba's neutral fallback. The full phase gate is green with no golden re-baseline.**

## Performance

- **Duration:** about 6 min
- **Started:** 2026-11-20T14:32:12Z
- **Completed:** 2026-11-20T14:38Z
- **Tasks:** 2
- **Files modified:** 4 source/test files, plus 2 RED-evidence files

## Accomplishments

- `tests/trips/romaLeaks.ts`: `ROMA_MARKERS` is the D-16 list (`Roma`, `Einaudi`, `giugno`, `MMXXVI`, `Pay`, `Fellini`, `Royal Court`). `findRomaLeaks(text)` returns the markers it finds, in list order and canonical form. Each marker is matched case-insensitively with Unicode letter/number lookarounds, and the space in «Royal Court» matches any whitespace.
- `tests/unit/romaLeaks.spec.ts`, 18 cases:
  - These do not match: «aroma», «Romaña», «romano», «guiaRoma», «payment», «Payaso» and the empty string.
  - These do match: «en Roma.», «ROMA», «ROYAL COURT», «Royal\nCourt», «Hotel Royal Court, Roma» (giving `['Roma','Royal Court']`), «giugno», «Fellini», «Pay», «MMXXVI», «Einaudi».
  - One more case fixes the exact marker list.
- `shape.spec.ts` `trampa:` block (4 tests):
  - The list of non-Roma trips comes from `readdirSync(content/trips)` minus `roma`, and a no-vacuity test checks that it includes prueba and forma.
  - Each non-Roma trip gets one test. It first checks a render precondition: the `[id="inicio"] h1` equals `inlineMdToPlain(trip.yml title)`, there are at least 3 `.nav-pill`, and the tab title is not empty. It then scans three sources for leaks: the title, `innerText`, and the `textContent` of a body clone with scripts and templates removed.
  - A positive control checks that the matcher finds «Roma» and «giugno» on `/guiaRoma/`.
- `shape.spec.ts` `chrome:` and `título:` blocks (3 tests):
  - forma shows the brand «Forma ✦ diez días de ensayo» with one `.brand-dot`, the legend «✦ Rojos · paradas con ficha ✦», and a 3-line footer with 2 `<br>` and «comprobar» in `<em>`.
  - prueba shows «Dos días de Prueba» with no `.brand-dot`, no `footer` and no `p.map-legend`, while `.flourish` is still present.
  - The tab titles match exactly (`Forma · diez días de ensayo` and `Dos días de Prueba`).
- `tests/README.md`: §5.1 now says 17 tests in 2 files, broken down by title prefix. The new §5.6 covers the forma dev trip and its sentinel, `romaChrome.spec.ts`, `tripLayout.spec.ts`, `romaLeaks.spec.ts`, the `romaChromeGuard.spec.ts` D-17 guard, the new gate rules (`day-order`, `day-pill`, `anchor` by presence, `cross-trip-link` allow-list), and the trap list with its golden rule.

## Phase gate results (Node 22, sequential, caches cleared)

| Suite | Result |
|---|---|
| `pnpm verify` → test:unit | 247/247 passed in 16 files (229 baseline + 18 new matcher teeth) |
| `pnpm verify` → test:data | 345/345 passed in 5 files |
| `pnpm verify` → test:parity | 80/80 passed (56 goldens, no `--update-snapshots`) |
| `pnpm test:trips` (after `rm -rf .data .nuxt`) | 17/17 passed (5 isolation + 12 shape) |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| Gate list | `Total: 80 tests in 11 files` (1 match) |
| `git diff --quiet f04967a HEAD -- tests/parity/ app/assets/css/ content/trips/prueba/` | exit 0, and no working-tree changes either |

The known flaky test (scrollspy, mobile) did not fail in this run.

## Task Commits

1. **Task 1 RED: matcher teeth** - `6ee3c82` (test)
2. **Task 1 GREEN: matcher + trap E2E** - `399cb6d` (feat)
3. **Task 2: chrome/title E2E + README** - `089cf37` (test)

## TDD Gate Compliance

- **RED** (`6ee3c82`): `tests/unit/romaLeaks.spec.ts` was committed with a stub `findRomaLeaks` that returns `[]`. The target test «findRomaLeaks — casa la palabra en cualquier caja > «en Roma.» → Roma» failed with `AssertionError: expected [] to deeply equal [ 'Roma' ]` (exit 1, 11 failing and 7 negative cases passing trivially).
  - Classifier verdict: `RED_EVIDENCE_OK`, reason `target_test_failed`. The evidence is in `evidence/10-05-red-romaLeaks.json` and `.junit.xml`.
  - Semantic assessment: the target ran and failed on the planned assertion, with no import, syntax or fixture fault.
- **GREEN** (`399cb6d`): all 18 cases pass.
- **REFACTOR**: none needed.

## Trap teeth demonstrated in the browser

To show the trap catches a real leak, I temporarily changed forma's `quoteAttr` to «— FEDERICO FELLINI». `trampa: forma` went red with «forma · innerText: textos de Roma encontrados → Fellini». I then restored the file byte-for-byte. Nothing was committed and `git status` was clean for `content/`.

## Decisions Made

- The trap does not scan the Nuxt payload or `script` text. The baseURL «guiaRoma» lives there, and the matcher already treats it as a non-match anyway. Hidden DOM text is still covered through the clone's `textContent`.
- The Roma URL was added to the existing `beforeAll` warm-up of `shape.spec.ts`.

## Deviations from Plan

- **[Rule 3 - Blocking] RED evidence reporter.** The TDD classifier rejected Vitest's TAP output as "Malformed TAP", because Vitest prints multi-line array diffs as unindented YAML. As the TDD reference prescribes, I reran the same target with Vitest's JUnit reporter and the classifier accepted it. The two evidence files are committed under the phase `evidence/` folder.
- Otherwise the plan was executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None. The RED stub in `tests/trips/romaLeaks.ts` was replaced by the real implementation in the GREEN commit.

## Next Phase Readiness

- Phase 10 success criteria 3, 4 and 5 are demonstrated, and the phase is ready for orchestrator verification.
- Any trip added later (Campania, phases 12-13) enters the trap automatically, because the list is read from `content/trips`.

## Self-Check: PASSED

- FOUND: tests/trips/romaLeaks.ts, tests/unit/romaLeaks.spec.ts, tests/trips/shape.spec.ts, tests/README.md, evidence/10-05-red-romaLeaks.json, evidence/10-05-red-romaLeaks.junit.xml
- FOUND commits: 6ee3c82, 399cb6d, 089cf37
