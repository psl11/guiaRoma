---
phase: 11-portada-y-rutas-multi-viaje
plan: 07
subsystem: parity-gate-portada
tags: [playwright, github-pages, nuxt-content, routing, parity, e2e]
status: complete

requires:
  - phase: 11-03
    provides: "Roma at /guiaRoma/trips/roma/, footer «← Todos los viajes», page key per slug"
  - phase: 11-06
    provides: "tests/parity/_pagesServer.ts (startPagesServer) and the hydration-wait pattern"
  - phase: 11-02
    provides: "scripts/tripManifest.mjs readTripManifest() and draft exclusion from the build"
  - phase: 11-05
    provides: "home page TripIndex with a.trip-index-card and multitrip.css"
provides:
  - "tests/parity/portada.spec.ts: 7 gate tests × mobile + desktop (port 5800 + TEST_WORKER_INDEX) for ROUTE-01/04/05/06, D-13 and the two UI-SPEC backstops"
  - "tests/README.md: gate count re-registered at 110 tests / 13 files (112 raw) with per-file breakdown; §1 harness + Pages-like server; §5.1/5.2/5.5 updated; new §5.7"
affects: [phase 11 verification (/gsd-verify-work 11), future trips (portada.spec expects hrefs from the manifest, so a new published trip needs no test edits)]

actuals:
  tokens: 8558
  tasks: 3
  commits: 3
plan_head_before: ca4efed77ccc5cec91b5c3900b08e3e445c3df23
plan_head_after: 1034bd845865960b4a38b927d417f3b44b3ebde2

tech-stack:
  added: []
  patterns:
    - "Expected home-page cards and draft 404s are derived from readTripManifest(), never hard-coded; the draft list must be non-empty"
    - "Full-document navigation is proven with a window marker that disappears after the click; no-remount is proven with a JS property on [id=\"inicio\"] that survives"
    - "Network-absence assertions carry a non-vacuity control (≥ 1 /_nuxt/ request seen on each page)"

key-files:
  created:
    - tests/parity/portada.spec.ts
  modified:
    - tests/README.md

key-decisions:
  - "ROUTE-04 regex /__nuxt_content\\/|sql_dump|\\.wasm(\\?|$)/ was given teeth with a throwaway probe: on the draft 404 page it matches the sqlite3 WASM and all 6 sql_dump requests, so a zero on the home page and Roma is meaningful"
  - "Off-origin requests are aborted at context level and counted; the home page must make zero of them, Roma's (tiles, Wikimedia) are aborted but not counted"
  - "Theme backstop uses a fresh context per theme with the current project's viewport and an addInitScript that seeds roma-theme; background is asserted with toHaveCSS (retrying) to ride out theme transitions"
  - "Nav pills are clicked with a real click() (not dispatchEvent); stable under --repeat-each 5 on mobile and desktop"

patterns-established:
  - "Phase 11 Pages-like specs: startPagesServer(OUTPUT_DIR, base + TEST_WORKER_INDEX) in beforeAll, server.close() in afterAll, origin http://127.0.0.1:<port>"

requirements-completed: [ROUTE-01, ROUTE-04, ROUTE-05, ROUTE-06, PAR-01, PAR-02]

coverage:
  - deliverable: "Home page lists exactly the published trips with UI-SPEC texts and opens Roma as a new document (ROUTE-01)"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/parity/portada.spec.ts#portada: una tarjeta por viaje publicado…"
        status: pass
  - deliverable: "Neither the home page nor Roma downloads __nuxt_content / sql_dump / WASM (ROUTE-04, D-15)"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/parity/portada.spec.ts#portada: ni la portada ni Roma piden sql_dump ni WASM…"
        status: pass
  - deliverable: "Roma footer «← Todos los viajes» returns to the home page (ROUTE-06)"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/parity/portada.spec.ts#portada: el pie de Roma lleva «← Todos los viajes» a la portada"
        status: pass
  - deliverable: "Nav pills on /trips/roma/ do not remount TripView (D-13)"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/parity/portada.spec.ts#portada: pulsar pastillas en /trips/roma/ no remonta la guía"
        status: pass
  - deliverable: "Every draft trip answers 404 (ROUTE-05)"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/parity/portada.spec.ts#portada: los borradores no se publican — dan 404"
        status: pass
  - deliverable: "Backstops: saved theme honoured with no new localStorage keys; long texts wrap at 375 px"
    human_judgment: false
    verification:
      - kind: e2e
        ref: "tests/parity/portada.spec.ts#portada: respeta el tema guardado… / textos largos parten línea…"
        status: pass
  - deliverable: "Phase gate: pnpm verify (56 goldens, 110 parity), test:trips, lint, typecheck, frozen paths and D-16/D-18 audit"
    human_judgment: false
    verification:
      - kind: command
        ref: "pnpm verify; playwright test -c playwright.trips.config.ts; pnpm lint; pnpm typecheck; git diff --quiet 6315f26 -- <frozen paths>"
        status: pass
  - deliverable: "Home page look on a real phone"
    human_judgment: true
    rationale: "Visual judgment without a golden (11-VALIDATION Manual-Only); review in /gsd-verify-work 11"

duration: ~7min (wall clock, measured)
completed: 2026-11-20
---

# Phase 11 Plan 07: Home page end to end in the gate Summary

**`tests/parity/portada.spec.ts` adds 7 gate tests (14 runs, mobile + desktop) against the static build served the way GitHub Pages serves it. They prove that `/guiaRoma/` lists exactly the manifest's published trips and opens Roma as a new document, that neither page downloads Nuxt Content's `sql_dump` or WASM, that drafts answer 404, that «← Todos los viajes» returns to the home page, and that nav pills do not remount the guide. The README now records the gate at 110 tests in 13 files, and the full phase gate passes from clean caches.**

## Performance

- **Duration:** ~7 min wall clock (measured from start/end epochs)
- **Started:** 2026-11-20T20:19:40Z
- **Completed:** 2026-11-20T20:26:36Z
- **Tasks:** 3 / 3
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- **Task 1 (tracer):** `portada.spec.ts` with a Pages-like server (`startPagesServer(OUTPUT_DIR, 5800 + worker)`) and expectations taken from `readTripManifest()`.
  - Test 1 (ROUTE-01): title and `h1` «Guías de viaje»; card hrefs equal `/guiaRoma/trips/<slug>/` for the published trips (today only `/guiaRoma/trips/roma/`); Roma's card shows «Cinque giorni a Roma», «19–23 de junio de 2026 · Roma» and the summary (spaces normalized); `.trip-index [id]` counts 0; no card points to a draft. Clicking the card reaches `/guiaRoma/trips/roma/` with 12 `.nav-pill`, and the `window.__portadaDoc` marker is gone, which proves a full-document navigation.
  - Test 2 (ROUTE-04): no request matches `__nuxt_content/`, `sql_dump` or `.wasm` on the home page or on Roma. At least one `/_nuxt/` request is seen on each page. On the home page: 0 `/_nuxt/` responses ≥ 400, 0 off-origin requests, 0 console errors (only the color-mode hydration message is tolerated).
  - Tracer gate: `<verify>` re-run green (4/4, then `--repeat-each 3` 12/12) before expansion.
- **Task 2:** five more tests in the same describe.
  - ROUTE-06: `footer .trip-back a` reads «← Todos los viajes», its href is `/guiaRoma/`, and `footer .container p` still counts 1. The click is a full-document navigation to the visible `.trip-index`.
  - D-13: a JS property set on `[id="inicio"]` survives clicks on the `#reservas`, `#gastronomia` and `#viernes` pills, each waited for with `expect.poll` on the hash. Exactly one `[id="inicio"]` remains.
  - ROUTE-05: the manifest's drafts include `prueba` and `forma`, and each returns 404 from `/guiaRoma/trips/<slug>/`.
  - Theme backstop: with `roma-theme` set to `dark`, the page gets `data-theme="dark"` and the card background is `rgb(34, 29, 24)`. With `light`, the card is `rgb(251, 247, 240)`. In both cases localStorage holds no key other than `roma-theme`.
  - Long-text backstop: at 375 px, an 80-character title, 6 destinations and a 3-sentence summary wrap without overflow. The h2 is taller than 1.5 line-heights, has no horizontal scroll and no ellipsis, the card does not overflow, and the document's `scrollWidth` stays ≤ `innerWidth`.
  - Stability: `--repeat-each 5` → 70/70.
- **Task 3:** `tests/README.md`:
  - §4 re-registers **110 / 13** (112 / 13 raw), measured with `--list`, with a per-file breakdown that sums to 110 and the 80 → 110 history.
  - §1 documents `ROMA_URL` in `_harness.ts` and `_pagesServer.ts`.
  - §2 updates the shell.spec line refs.
  - §5.1 records 19 trips tests in 3 files, with Roma in dev at `/guiaRoma/trips/roma/`.
  - §5.2 documents the `draft: true` mechanism.
  - §5.5 documents `trips/roma/`, that `trips/prueba` and `trips/forma` are absent, and the decoded-dump scan (CR-01 closed).
  - New **§5.7 Portada y rutas multi-viaje (Fase 11)**.

## Phase gate (from clean caches, sequential, Node 22, release/nuxt-4)

| Step | Result |
|------|--------|
| `pnpm verify` (rm caches → generate → unit → data → parity) | exit 0 — unit **301** passed (19 files), data **377** passed (5 files), parity **110** passed, 56 goldens compared without `--update-snapshots`; the known `SC#2 scrollspy` mobile flake did not trigger |
| `rm -rf .data .nuxt` → `playwright test -c playwright.trips.config.ts` | **19** passed (3 files) |
| `nuxi prepare` → `pnpm lint` → `pnpm typecheck` | all exit 0, no error lines |
| `--list` gate count | `Total: 110 tests in 13 files` (grep-invert) / `Total: 112 tests in 13 files` (raw) |
| Frozen paths vs 6315f26 (golden.spec.ts + 56 PNG, base/tokens/fonts/leaflet.css, package.json, pnpm-lock.yaml) | unchanged |
| D-16 audit: prueba diff | exactly `-# draft: true` / `+draft: true` |
| D-18 audit: 10 Roma specs | only harness import / URL / ROMA_HTML lines; `_harness.ts` ROMA_URL = `'/guiaRoma/trips/roma/'` |
| `#viernes` top after legacy redirect (verify run) | **123.94 px** (mobile) / **123.91 px** (desktop), identical to a direct load |

## Task Commits

1. **Task 1: home page end to end (tracer)**: `d970f0a` (test)
2. **Task 2: back link, drafts 404, no remount, backstops**: `6170c38` (test)
3. **Task 3: README gate count + phase docs**: `1034bd8` (docs)

## Files Created/Modified

- `tests/parity/portada.spec.ts`: created; 7 tests (`portada:` prefix), Pages-like server on port 5800 + worker
- `tests/README.md`: gate count 110/13, Phase 11 documentation (§1, §2 line refs, §4, §5.1, §5.2, §5.4, §5.5, §5.6, §5.7)

## Decisions Made

See `key-decisions` in the frontmatter. The most important one: the ROUTE-04 matcher was checked against a page that does download the content DB (the draft 404 page loads `sqlite3.*.wasm` and the 6 `sql_dump.txt`), so the zero on the home page and Roma is not vacuous. The probe spec was temporary and was deleted without being committed.

## Deviations from Plan

### Minor adjustments

**1. [Rule 2 - Hardening] Extra card-overflow assertion in the long-text backstop**
- **Found during:** Task 2
- **Issue:** the plan's assertions (document scrollWidth, h2 wraps, h2 not clipped, no ellipsis) would not catch a meta line or summary overflowing inside the card.
- **Fix:** the test also asserts the card's `scrollWidth <= clientWidth`.
- **Files modified:** tests/parity/portada.spec.ts
- **Commit:** 6170c38

**2. [Doc accuracy] README §2 line references and §5.4/§5.6 notes**
- **Found during:** Task 3
- **Issue:** §2 cited `shell.spec.ts:242/204/220` (now 268/230/246 after 11-03/11-05). §5.4 still described `app/pages/index.vue` as `<TripView slug="roma" />`. §5.6 said forma "se marcará draft".
- **Fix:** updated these to the current state, matching the comment in `tests/unit/tripCoupling.spec.ts`.
- **Files modified:** tests/README.md
- **Commit:** 1034bd8

**Total deviations:** 2 minor (1 test hardening, 1 doc accuracy). **Impact:** none on application code. No existing spec, frozen path or content file was touched.

## Issues Encountered

- eslint `@stylistic/max-statements-per-line` on a one-line `page.evaluate(() => { … = true })`. Fixed before the Task 1 commit by expanding the arrow body.

## Known Stubs

None.

## Threat Flags

None. The test-only server binds 127.0.0.1 during the suite (T-11-17, from 11-06). T-11-18/19/20 are mitigated as planned: request interception with a non-vacuity control, expectations from the manifest with a non-empty draft list, and a 404 for each draft.

## Next Phase Readiness

- Phase 11 is complete: 7/7 plans, and the phase gate is green from clean caches.
- Ready for `/gsd-verify-work 11`. One item needs manual review: how the home page looks on a real phone (no golden for it).

## Self-Check: PASSED

- FOUND: tests/parity/portada.spec.ts, tests/README.md
- FOUND: d970f0a, 6170c38, 1034bd8 (ancestors of HEAD)
- Acceptance criteria re-run: Task 1 (5800=1, startPagesServer≥1, readTripManifest≥1, sql_dump≥1, 2→7 tests, golden unchanged), Task 2 (7 tests, trip-back≥1, roma-theme≥1, rgb(34, 29, 24)=1, 375≥1, 110/13), Task 3 (README 110/13 present, 80/11 absent, portada/legacy-redirect/_harness/_pagesServer mentioned, one `### 5.7`, 112/13 raw, ROMA_URL line, verify exit 0): all PASS
