---
phase: 14-verificacion-del-milestone
plan: 02
subsystem: testing
tags: [playwright, vitest, parity, isolation, sql_dump, wasm, css, d-05, d-02, wr-06]
status: complete

requires:
  - phase: 09-claves-por-viaje
    provides: per-trip storage keys `${slug}-${key}` and one MiniSearch index per trip slug
  - phase: 11-portada-y-rutas
    provides: tests/parity/_pagesServer.ts, _harness.ts, portada cards, footer «← Todos los viajes», D-15 (portada + Roma without sql_dump/WASM)
  - phase: 13-contenido-campania-2027
    provides: Campania published at /guiaRoma/trips/campania/ (24 cards)
  - phase: 14-verificacion-del-milestone (14-01)
    provides: upgrade-from-main.spec.ts (port 6600), gate 114 tests / 14 files
provides:
  - tests/parity/cross-trip.spec.ts — cross-trip isolation and no-heavy-download spec on the published build (D-05), in the parity gate (+12 tests: 6 tests x mobile/desktop)
  - tests/data/css-vs-main.spec.ts — the CSS the build ships equals main's index.html <style> blocks (D-02), in test:data (+7 tests)
  - Closes Phase 13 review finding WR-06 (no sql_dump/WASM on Campania)
affects: [14-03, tests/README.md gate counts, milestone-v1.1]

actuals:
  tokens: 6597
  tasks: 3
  commits: 3
plan_head_before: 83a9707289869611503fbd38ea5d58fc450d773d
plan_head_after: 39b9711a959046e2ea808581ddf0987e97766dbd

tech-stack:
  added: []
  patterns:
    - "Step-labelled request tracker: one listener attached before navigation records heavy requests as `<step>: <url>` and counts /_nuxt/ assets per step, so a failure names the exact page or history step"
    - "landOn(page, url, marker): wait for URL + networkidle + hydration + a unique page marker before any assertion after goto/click/goBack/goForward"
    - "CSS parity by normalised text: strip comments and whitespace only, allowlist exact orphaned rules each matched once, teeth tests in memory"

key-files:
  created:
    - tests/parity/cross-trip.spec.ts
    - tests/data/css-vs-main.spec.ts
  modified: []

key-decisions:
  - "Isolation tests also assert the full textarea count per trip (38 Roma / 24 Campania, from content) so the «only this note» checks cannot pass on an empty page"
  - "The CSS teeth test flips one hex digit of --accent in tokens.css (in memory); the noise test adds spaces, newlines and two comments to base.css and must still pass"

patterns-established:
  - "Cross-trip specs use port base 6700 + TEST_WORKER_INDEX"

requirements-completed: []

coverage:
  - id: D-05
    description: "portada → Roma → Campania → Atrás → Atrás, and the click journey with Atrás/Adelante, make zero sql_dump/WASM/__nuxt_content requests; positive control on a draft 404; search, notes and modes stay per trip"
    requirement: PAR-03
    verification:
      - kind: e2e
        ref: "tests/parity/cross-trip.spec.ts (6 tests x 2 projects)"
        status: pass
  - id: D-02
    description: "leaflet.css, tokens.css + base.css and fonts.css correspond to main:index.html with only the 08-06 allowlist"
    verification:
      - kind: unit
        ref: "tests/data/css-vs-main.spec.ts (7 tests)"
        status: pass

duration: ~10min
completed: 2026-11-22
---

# Phase 14 Plan 02: Cross-trip isolation, no heavy downloads, and CSS equal to main Summary

**A new parity spec proves on the published build that portada, Roma, Campania and every «Atrás»/«Adelante» step between them make zero `sql_dump`/WASM/`__nuxt_content` requests (with a draft-404 positive control proving the detector sees them), and that search, notes and modes never cross between Roma and Campania. A new data spec proves the build's CSS is `main:index.html`'s CSS, with exactly the two 08-06 orphaned rules allow-listed.**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-11-22T01:58:54Z
- **Tasks:** 3/3
- **Files created:** 2

## Accomplishments

- **Task 1 (tracer):** after a fresh `rm -rf .data .nuxt .output && pnpm generate`, the route portada → Roma → Campania → «Atrás» → «Atrás» shows zero HEAVY_RE requests. Every forward step requested `/_nuxt/` assets, and no `/_nuxt/` response was >= 400. The positive control (`/guiaRoma/trips/<first draft>/`, 404) sees the content database requests. 4/4 passed, and 4/4 again on the tracer gate re-run. This extends Phase 11 D-15 to Campania and **closes 13-REVIEW WR-06**: Campania downloads no sql_dump or WASM, on direct load or through history.
- **Task 2:** four more tests.
  - Click journey: portada card → Roma → footer «← Todos los viajes» → Campania card → Atrás → Atrás → Adelante → Adelante. It lands on portada, Roma, portada and Campania in that order, with zero heavy requests.
  - Search: «iglesia» results stay inside each trip's slug set, which is read from the content. «Pantheon» gives «Sin resultados» in Campania, and «Sorgeto» gives «Sin resultados» in Roma, also after «Atrás». Campania opens with an empty `#search` and a closed dropdown.
  - Notes: `roma-note-pantheon` and `campania-note-baia-di-sorgeto` are each restored only on their own trip's card, after Atrás and after Adelante. All 38 and 24 other textareas are empty, and the crossed keys are null.
  - Modes: Roma neutral + resumen and Campania «Caminar menos» (→ slow) never change each other, and the exact storage values are checked.
  - Results: `--repeat-each 3` gave **36 passed**. `--list` gave **Total: 12 tests in 1 file**. `eslint --no-ignore` is clean.
- **Task 3:** `tests/data/css-vs-main.spec.ts`. Main has exactly two `<style>` blocks.
  - leaflet.css equals the `leaflet-inline-css` block.
  - tokens.css + base.css equals the editorial block once the orphaned `}.tl-meta-item{…}` and `}.tl-transport-mode.recommended{…}` are removed. Each is matched exactly once.
  - fonts.css declares exactly the three Google Fonts families of main's single css2 `<link>`.
  - Three teeth tests pass.
  - Results: 7/7 passed, the whole `tests/data` + `tests/unit` suite passed (32 files, 1341 tests), and eslint is clean.
- **Finding (D-02): none.** The CSS comparison shows no undocumented difference, and no CSS file was touched (`git diff --quiet 2c9ba3e -- app/assets/css` = 0).

## Task Commits

1. **Task 1 (tracer): zero sql_dump/WASM portada → Roma → Campania → Atrás → Atrás, plus positive control.** `717903e` (test)
2. **Task 2: click journey with Atrás/Adelante, and search, notes and modes isolated per trip.** `fca23dc` (test)
3. **Task 3: CSS shipped by the build equals main's style blocks.** `39b9711` (test)

## Files Created/Modified

- `tests/parity/cross-trip.spec.ts`: D-05 spec. Cloned helpers: HEAVY_RE, blockOffOrigin, hydrated, ensureBuild (now also requires Campania's index.html), searchUntil. New helpers: track and landOn. Six tests.
- `tests/data/css-vs-main.spec.ts`: D-02 spec. Helpers: styleBlocks, normalizeCss, ORPHANED_RULES, firstDiff, editorialMatches, plus the font-family parsers. Seven tests.

## Decisions Made

- Each notes check also asserts the textarea count equals the trip's number of monument files. This keeps the «only this card has a note» assertion non-vacuous.
- Every isolation test (search, notes, modes) also ends with an empty heavy-request list, so back/forward after user interaction is covered too.

## Deviations from Plan

None. The plan was executed exactly as written. TDD note (Tasks 2 and 3, `tdd="true"`): the deliverables are tests of behaviour that was already implemented (Phase 9 keys, v1.0 CSS). They passed on their first run. Their non-vacuity comes from positive controls, textarea counts, «index ready» probes and in-memory teeth, not from a RED commit.

## Defecto real (D-06)

None. No page or history step downloaded sql_dump/WASM, and no state crossed between trips (36/36 across repeats).

## Issues Encountered

None. No flaky runs.

## Known Stubs

None.

## Threat Flags

None. Only a 127.0.0.1-bound test server (T-14-06 scope) and a read-only `git show main:index.html` were added.

## Next Phase Readiness

- PAR-03 is **not** marked complete here. 14-03 closes it.
- 14-03 must re-register the gate total: 110 → 126 tests (+4 from 14-01, +12 from this plan), and 13 → 15 files. `test:data` gains the new spec file (+7 tests).

## Self-Check: PASSED

- FOUND: tests/parity/cross-trip.spec.ts, tests/data/css-vs-main.spec.ts
- FOUND: 717903e, fca23dc, 39b9711 (ancestors of HEAD)
- `git diff --quiet 2c9ba3e -- tests/parity` (excluding the two new specs) = 0, and `-- app/assets/css` = 0
- `git ls-files '*.html'` = 2 (no committed copy of the live guide)
