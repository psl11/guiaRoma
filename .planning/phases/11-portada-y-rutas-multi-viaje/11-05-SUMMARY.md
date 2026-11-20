---
phase: 11-portada-y-rutas-multi-viaje
plan: 05
subsystem: ui-home-page
tags: [nuxt, nuxt-content, vue, css, playwright, vitest, home-page]

requires:
  - phase: 11-03
    provides: Roma at /guiaRoma/trips/roma/ (prerender routes from the manifest, harness ROMA_URL)
  - phase: 11-04
    provides: listedTrips, tripMetaLine, sortTrips and Roma's startDate/endDate/destinations/summary
provides:
  - "app/pages/index.vue: the home page at «/» (title «Guías de viaje» + <TripIndex />)"
  - "app/components/TripIndex.vue: one a.trip-index-card per published trip, plus the loaded-and-empty state"
  - "app/assets/css/multitrip.css: UI-SPEC home-page rules, every selector under .trip-index, last entry of css[]"
  - "tests/unit/multitripCss.spec.ts: scope guard (cssSelectors / unscopedSelectors) with teeth"
  - "shell.spec D-18 test: the home page at SITE_BASE vs Roma at ROMA_URL"
  - "tests/trips/portada.spec.ts: dev home page lists no drafts; drafts still open by URL in dev"
affects: [11-06 legacy-hash redirect in index.vue, 11-07 portada parity specs and gate count]

actuals:
  tokens: 5856
  tasks: 3
  commits: 4
plan_head_before: 45112cad235f2b6a05cbb0f2460564400e82fb69
plan_head_after: 529f43f304d5d655392e0452911f24d3d9c692bc

tech-stack:
  added: []
  patterns:
    - "Home page data: useAsyncData('trips-index') over queryCollection('trip').select(...).all(); the rows ride in the prerendered payload"
    - "Empty state only when listedTrips returns [] (v-else-if on cards !== null), never during hydration"
    - "New CSS lives in its own file scoped under one root class, guarded by a static selector parser"

key-files:
  created:
    - app/components/TripIndex.vue
    - app/assets/css/multitrip.css
    - tests/unit/multitripCss.spec.ts
    - tests/trips/portada.spec.ts
    - .planning/phases/11-portada-y-rutas-multi-viaje/.red/11-05-task2-red.json
    - .planning/phases/11-portada-y-rutas-multi-viaje/.red/11-05-task2-red-junit.xml
  modified:
    - app/pages/index.vue
    - nuxt.config.ts
    - tests/parity/shell.spec.ts
    - tests/trips/isolation.spec.ts
    - tests/trips/shape.spec.ts
    - tests/unit/tripCoupling.spec.ts

key-decisions:
  - "TripIndex maps listedTrips(data) into plain card objects ({ slug, href, title, meta, summary }) in one computed; null stays null so the template can tell loading apart from empty"
  - "multitrip.css is extracted byte-for-byte from the UI-SPEC code block (awk), header comment included, so it cannot drift from the contract"
  - "The scope guard's helpers live inside the spec (cssSelectors resets its buffer on { } ;, treats @-preludes as at-rules) and also pins the full css[] order fonts, tokens, base, leaflet, multitrip"

patterns-established:
  - "Home page components never carry ids, <section>, <footer>, style=, v-html, NuxtLink or @click (checked with comments stripped)"

requirements-completed: [ROUTE-01, ROUTE-05, PAR-01, PAR-02]

coverage:
  - id: D1
    description: "/guiaRoma/ prerenders the home page: one a.trip-index-card → /guiaRoma/trips/roma/, h2 «Cinque giorni a Roma», meta «19–23 de junio de 2026 · Roma», Roma's summary; title and h1 «Guías de viaje»; no trip chrome"
    requirement: ROUTE-01
    verification:
      - kind: automated_ui
        ref: "tests/parity/shell.spec.ts#la portada vive en «/» y ROMA_URL sirve Roma (D-18)"
        status: pass
      - kind: command
        ref: "grep of .output/public/index.html: exactly one trip-index-card with href /guiaRoma/trips/roma/, 'Cinque giorni a Roma', no nav-pills"
        status: pass
    human_judgment: false
  - id: D2
    description: "Roma specs cannot pass against the home page: ROMA_URL serves the 12 pills and [id=inicio] with 0 .trip-index; dev specs target /guiaRoma/trips/roma/"
    requirement: PAR-02
    verification:
      - kind: automated_ui
        ref: "tests/parity/shell.spec.ts#la portada vive en «/» y ROMA_URL sirve Roma (D-18)"
        status: pass
      - kind: automated_ui
        ref: "pnpm test:trips (19 passed, isolation + shape against /guiaRoma/trips/roma/)"
        status: pass
    human_judgment: false
  - id: D3
    description: "multitrip.css holds the UI-SPEC rules, every selector under .trip-index, last in css[]; the four frozen stylesheets and 56 goldens unchanged"
    requirement: PAR-01
    verification:
      - kind: unit
        ref: "tests/unit/multitripCss.spec.ts (13 tests)"
        status: pass
      - kind: automated_ui
        ref: "pnpm verify (301 unit, 377 data, 82 parity incl. 56 goldens, no --update-snapshots)"
        status: pass
    human_judgment: false
  - id: D4
    description: "In nuxi dev the home page lists only Roma although prueba and forma are loaded, and both drafts still open by URL"
    requirement: ROUTE-05
    verification:
      - kind: automated_ui
        ref: "tests/trips/portada.spec.ts#portada (dev): lista solo los viajes publicados aunque prueba y forma se cargan (D-16)"
        status: pass
      - kind: automated_ui
        ref: "tests/trips/portada.spec.ts#portada (dev): los borradores siguen abriéndose por URL en dev (D-16)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The home page looks right (card spacing, hover/focus, dark theme from roma-theme, mobile 375px)"
    verification: []
    human_judgment: true
    rationale: "No golden covers the new page yet (11-07 adds portada specs); the visual result of the UI-SPEC rules is a human judgment"

duration: 8min
completed: 2026-11-20
status: complete
---

# Phase 11 Plan 05: Home page (portada) Summary

**`/guiaRoma/` is now a home page titled «Guías de viaje». It shows one full-card `<a>` per published trip, linking to `/guiaRoma/trips/<slug>/`, with the plain title, the meta line «19–23 de junio de 2026 · Roma» and the MDC summary. Its styles live in a new `multitrip.css`, every rule scoped under `.trip-index` and enforced by a static selector guard. Drafts never appear on it, in dev included. A new shell test tells the home page apart from Roma, and the 56 goldens stay green.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-11-20T19:47:30Z
- **Completed:** 2026-11-20T19:55:51Z
- **Tasks:** 3 (tracer, TDD, auto)
- **Files modified:** 10 source/test files, plus 2 RED-evidence files

## Accomplishments
- **D-06 / D-11:** `app/pages/index.vue` was rewritten as the home page. It sets the title with `useHead({ title: 'Guías de viaje' })` and mounts `<TripIndex />`. There is no trip chrome, and the stale «SIN NuxtLink…» comment is gone.
- **D-07 / D-12 / D-04:** `TripIndex.vue` follows the UI-SPEC DOM: `div.trip-index` > `header.trip-index-header` > `h1`, then `main.trip-index-main` > `ul.trip-index-list` > `li` > `a.trip-index-card`, then `div.flourish[aria-hidden]`. The card `href` is built from the runtime baseURL. The page has no `id`, `<section>`, `<footer>`, `style`, `v-html`, NuxtLink or `@click`.
- **D-11 / D-16 empty vs loading:** the template uses `v-if` when there are cards and `v-else-if="cards !== null"` for `p.trip-index-empty`. `listedTrips` returns `null` while data is loading, so the empty message never appears during hydration.
- **D-21:** `multitrip.css` is the exact UI-SPEC block. It is the last entry in `css[]`, and it is in the built `entry.*.css`. The guard parses its selectors, including those inside `@media`, and rejects loose selectors, `.trip-back`, `:root`, `[data-theme`, `html` and `body`.
- **D-18 step 3:** the new test in `shell.spec.ts` checks both sides. The home page has `.trip-index`, h1 «Guías de viaje», 0 pills, 0 `[id="inicio"]`, 0 `section`/`footer`, and one card pointing to Roma. `ROMA_URL` has the 12 pills, `[id="inicio"]` and 0 `.trip-index`.

## Task Commits

1. **Task 1 (tracer): home page end to end.** `80c62f7` (feat). Tracer gate: `pnpm verify`, the build grep, `test:trips` and lint/typecheck/unit were all re-run green before expanding.
2. **Task 2 (TDD): multitrip.css with a scope guard**
   - RED `d2f971d` (test): guard spec and RED evidence
   - GREEN `557ba25` (feat): `multitrip.css` + `css[]` entry
   - No REFACTOR commit was needed.
3. **Task 3: dev home page without drafts.** `529f43f` (test): `portada.spec.ts` + tripCoupling JSDoc.

### TDD RED evidence (Task 2)
- `.red/11-05-task2-red.json` (JUnit), classified as `RED_EVIDENCE_OK` / `target_test_failed` by `gsd-tools check tdd-red-evidence`.
- The target `multitrip.css real (D-21) > existe, tiene las reglas de la portada y todas van bajo .trip-index` failed on `expected false to be true` (the file did not exist). The `css[]` order test also failed on its assertion (4 entries). 11 of 13 passed: these are the synthetic teeth, whose helpers live inside the spec.
- *semanticAssessment:* this is the intended RED. The spec loaded, and the target ran and failed on the planned assertion. There was no load, import or fixture failure, because the file is read inside the test after an `existsSync` assertion.

## Files Created/Modified
- `app/components/TripIndex.vue` (new): data, card mapping, card and empty-state template. Its Spanish header comment cites D-04, D-06, D-07, D-10, D-11, D-12, D-16, D-20 and D-21.
- `app/pages/index.vue`: the home page.
- `app/assets/css/multitrip.css` (new): the UI-SPEC rules.
- `nuxt.config.ts`: `multitrip.css` added as the last `css[]` entry, plus a Phase 11 comment.
- `tests/unit/multitripCss.spec.ts` (new): `cssSelectors`, `unscopedSelectors` and 13 tests.
- `tests/parity/shell.spec.ts`: `SITE_BASE` added to the import, plus one new test. Nothing else changed.
- `tests/trips/isolation.spec.ts`, `tests/trips/shape.spec.ts`: `ROMA_URL` now points to `/guiaRoma/trips/roma/`.
- `tests/trips/portada.spec.ts` (new): two `portada (dev):` tests. It is self-contained and imports nothing from `tests/parity/`.
- `tests/unit/tripCoupling.spec.ts`: only the `app/pages/index.vue` exception line in the JSDoc changed. The assertion is unchanged.

## Decisions Made
- The card list is one `computed` that returns `null` or an array of `{ slug, href, title, meta, summary }`, so the template has no logic beyond `v-if`.
- `multitrip.css` was extracted mechanically from the UI-SPEC code block, so its order, values and header comment match the contract exactly.
- The guard also pins the full `css[]` order (fonts, tokens, base, leaflet, multitrip), not just the last entry.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Header comments duplicated two grep-counted literals**
- **Found during:** Task 1 acceptance gate
- **Issue:** the TripIndex header comment quoted `'trips-index'` and «Todavía no hay viajes publicados.». That made the `== 1` acceptance greps return 2.
- **Fix:** reworded those two comment lines without the literals. Code was unchanged; eslint was re-run.
- **Files modified:** app/components/TripIndex.vue
- **Commit:** 80c62f7 (before the commit)

**Total deviations:** 1 auto-fixed (Rule 1, comment-only). **Impact:** none on behavior.

## Issues Encountered
- None. The known scrollspy flake did not occur in either `pnpm verify` run.

## Known Stubs
None. Every card field comes from the `trip` collection.

## User Setup Required
None.

## Next Phase Readiness
- 11-06 can add `LEGACY_TRIP` and the `legacy-hash-redirect` script to `app/pages/index.vue`'s `useHead`. The page currently has only the title there.
- 11-07 can assert the home page in the build (`.trip-index [id]` = 0, dark-theme card background, 375px overflow). The parity gate is at 82 tests in 11 files.
- Flagged for `/gsd-verify-work 11` (human_judgment D5): the visual result of the home page in light and dark mode, on desktop and mobile.

## Verification
- `pnpm verify` after Task 1: exit 0 (288 unit, 377 data, 82 parity).
- `pnpm verify` after Task 2: exit 0 (301 unit, 377 data, 82 parity, 56 goldens, no `--update-snapshots`).
- `playwright test -c playwright.trips.config.ts` (`rm -rf .data .nuxt` first, never concurrent with verify): 17 passed after Task 1 and 19 passed after Task 3, including both `portada (dev):` tests.
- `.output/public/index.html`: exactly one `trip-index-card` with `href="/guiaRoma/trips/roma/"`, «Cinque giorni a Roma», `<title>Guías de viaje</title>`, no `nav-pills`, no `sql_dump`/`.wasm` reference.
- eslint (all touched files; `--no-ignore` for shell.spec), `nuxi typecheck` and `vitest run tests/unit`: clean.
- `playwright test -c playwright.gate.config.ts --list`: «Total: 82 tests in 11 files».
- `git diff --quiet 6315f26 -- app/assets/css/{base,tokens,fonts,leaflet}.css tests/parity/golden.spec.ts tests/parity/golden.spec.ts-snapshots/ content/trips/roma/days/`: exit 0.

## Self-Check: PASSED
- FOUND: app/components/TripIndex.vue, app/assets/css/multitrip.css, tests/unit/multitripCss.spec.ts, tests/trips/portada.spec.ts, .red/11-05-task2-red.json
- FOUND commits: 80c62f7, d2f971d, 557ba25, 529f43f (all ancestors of HEAD)
