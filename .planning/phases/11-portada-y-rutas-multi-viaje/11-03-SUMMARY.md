---
phase: 11-portada-y-rutas-multi-viaje
plan: 03
subsystem: routing-prerender
tags: [nuxt, nitro-prerender, parity, playwright, footer, page-key]

requires:
  - phase: 11-01
    provides: parity harness (ROMA_URL / ROMA_HTML), the single point of Roma's URL
  - phase: 11-02
    provides: scripts/tripManifest.mjs + .d.mts (readTripManifest, prerenderRoutes); drafts excluded from Content in production
provides:
  - "nuxt.config.ts: nitro.prerender.routes = prerenderRoutes(readTripManifest()) → '/' + '/trips/roma/'"
  - "Roma published as a static page at /guiaRoma/trips/roma/ (trips/roma/index.html + _payload.json); no trips/prueba, no trips/forma"
  - "ROMA_URL = '/guiaRoma/trips/roma/': all 11 Roma parity specs and the 56 goldens run at the new URL"
  - "TripView: <footer> in every guide, p.trip-back «← Todos los viajes» → runtime baseURL"
  - "app/pages/trips/[slug].vue: definePageMeta key by slug (no remount on hash navigation)"
affects: [11-05 portada at '/', 11-06 legacy redirect, 11-07 portada/no-remount specs and tests/README count]

actuals:
  tokens: 5200
  tasks: 2
  commits: 2
plan_head_before: 331790496de21b655e84a41c17d5dd4e5b01148a
plan_head_after: 895888bd443748cb62a52a3b6d63e1038112a0c5

tech-stack:
  added: []
  patterns:
    - "Prerender routes from data: nitro.prerender.routes computed at config load from the trip manifest"
    - "Data specs skip only when there is no build at all (.output/public/index.html), then assert the Roma page exists, so a build without Roma fails instead of skipping"
    - "Back link = plain full-document <a :href> built from useRuntimeConfig().app.baseURL with a guaranteed trailing slash (same idiom as app.vue)"

key-files:
  created: []
  modified:
    - nuxt.config.ts
    - tests/parity/_harness.ts
    - tests/parity/shell.spec.ts
    - tests/data/build-isolation.spec.ts
    - tests/data/romaChrome.spec.ts
    - app/components/TripView.vue
    - app/pages/trips/[slug].vue
    - tests/trips/shape.spec.ts

key-decisions:
  - "The URL move (prerender routes + ROMA_URL flip + shell/build-isolation/romaChrome inversions) landed as ONE commit (23ec79f) with the gate green; in tests/parity only the ROMA_URL value line and shell.spec's trips/ test (+ its two describing comment lines) changed"
  - "build-isolation and romaChrome now skip on the absence of ANY build (.output/public/index.html), not on the absence of Roma's page: a build missing trips/roma/index.html fails (D-17 vacuity)"
  - "The back link sits outside footer .container as a direct child of <footer>, so the strict locator footer .container p still resolves to one element in Roma; zero new CSS"
  - "Page key is `trip:<slug>`, never the full route (the full route includes the hash and would remount TripView on every pill)"

patterns-established:
  - "Footer contract: trip.footer lines (optional) in div.container, then p.trip-back as the last child of <footer>"

requirements-completed: [ROUTE-02, ROUTE-04, ROUTE-06, PAR-01, PAR-02]

coverage:
  - id: D1
    description: "Roma is prerendered at /guiaRoma/trips/roma/ from the trip manifest; drafts are not emitted"
    requirement: ROUTE-02
    verification:
      - kind: integration
        ref: "nuxi generate from clean caches + test -f .output/public/trips/roma/{index.html,_payload.json} + test ! -e trips/prueba, trips/forma"
        status: pass
      - kind: e2e
        ref: "tests/parity/shell.spec.ts#la build emite la guía de Roma en trips/roma/ y ningún borrador (D-13/D-17)"
        status: pass
      - kind: integration
        ref: "tests/data/build-isolation.spec.ts#existe trips/roma/index.html: Roma se prerenderiza en su URL (D-13)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Roma unchanged at the new URL: 56 goldens + the full behavior suite pass with no re-baseline (80 tests in 11 files)"
    requirement: PAR-01
    verification:
      - kind: automated_ui
        ref: "pnpm verify after Task 1 (unit 263, data 354, parity 80) and after Task 2 (unit 263, data 355, parity 80)"
        status: pass
      - kind: other
        ref: "git diff --quiet 6315f26 -- tests/parity/golden.spec.ts tests/parity/golden.spec.ts-snapshots/ app/assets/css/"
        status: pass
    human_judgment: false
  - id: D3
    description: "Only D-18 edits in the existing parity specs: the ROMA_URL value line + the inverted shell.spec trips/ test"
    requirement: PAR-02
    verification:
      - kind: other
        ref: "pre-commit diff guard: changed files in tests/parity = _harness.ts + shell.spec.ts; _harness.ts = 2 changed lines"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every guide's footer ends with «← Todos los viajes» → /guiaRoma/; Roma keeps its footer lines byte-identical; prueba's footer holds only the link"
    requirement: ROUTE-06
    verification:
      - kind: integration
        ref: "tests/data/romaChrome.spec.ts#el pie termina con el enlace de vuelta a la portada (D-01/D-03)"
        status: pass
      - kind: integration
        ref: "tests/data/romaChrome.spec.ts#el pie prerenderizado es el de siempre (mismo HTML que la build anterior)"
        status: pass
      - kind: e2e
        ref: "tests/trips/shape.spec.ts#chrome: prueba sin campos de chrome usa el respaldo neutro (D-14)"
        status: pass
      - kind: e2e
        ref: "tests/parity/shell.spec.ts (footer .container p strict locator, line 158)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Page key by slug in trips/[slug].vue (no remount on hash navigation); the E2E proof arrives in 11-07"
    requirement: ROUTE-04
    verification:
      - kind: other
        ref: "grep: definePageMeta with key trip:${String(route.params.slug)}; no fullPath in code; nuxi typecheck 0 errors"
        status: pass
    human_judgment: true
    rationale: "No test in this plan proves the no-remount behavior end to end; 11-07 adds that test (planned)"
  - id: D6
    description: "The back link's look (Cormorant italic footer p, global link colour, centred) with no new CSS"
    requirement: ROUTE-06
    verification:
      - kind: other
        ref: "git diff app/assets/css/ empty; TripView has no style block or new style attribute (grep guard)"
        status: pass
    human_judgment: true
    rationale: "No golden captures the footer (D-02), so the visual rendering of the link is judged by eye"

duration: 6min
completed: 2026-11-20
status: complete
---

# Phase 11 Plan 03: Roma en /trips/roma/ y enlace «← Todos los viajes» Summary

**Roma is now prerendered at `/guiaRoma/trips/roma/` from the trip manifest (`prerenderRoutes(readTripManifest())`). The 56 goldens and all 80 parity tests pass at the new URL; in the Roma specs only the `ROMA_URL` value changed. Every guide's footer now ends with a full-document «← Todos los viajes» link built from the runtime `baseURL`, with zero new CSS. `trips/[slug].vue` is keyed by slug.**

## Performance

- **Duration:** about 6 min of agent wall clock, measured from plan start to the last task commit (the two full `pnpm verify` runs were most of it)
- **Started:** 2026-11-20T19:24:34Z
- **Completed:** 2026-11-20T19:31:02Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- **ROUTE-02 / D-13:** `nuxt.config.ts` imports `{ prerenderRoutes, readTripManifest }` from `./scripts/tripManifest.mjs` and prerenders `['/', '/trips/roma/']`. `crawlLinks: true` and `failOnError: true` are unchanged. The output has `trips/roma/index.html` and `trips/roma/_payload.json`, and no `trips/prueba` or `trips/forma`.
- **D-18 move commit (23ec79f):** this one commit contains the routes, the `ROMA_URL` flip and the three inversions: shell.spec (`trips/roma/` emitted, no drafts), build-isolation (Roma read from `trips/roma/`, explicit existence `it`, drafts absent) and romaChrome (reads `trips/roma/index.html`). The gate was green before the commit.
- **PAR-01 / PAR-02:** `pnpm verify` passed from clean caches after each task: parity 80/80 in 11 files with no `--update-snapshots`, and `golden.spec.ts`, its snapshots and `app/assets/css/` are unchanged since 6315f26.
- **ROUTE-06 / D-01, D-03, D-04, D-05:** `<footer>` is always rendered. The `v-if` moved to `div.container`. `p.trip-back > a[href=baseURL]` follows `.container` as a direct child of `<footer>`. Roma's prerendered footer ends with exactly `<p class="trip-back"><a href="/guiaRoma/">← Todos los viajes</a></p></footer>`. Prueba's footer holds only the link, and forma keeps its `footer .container p`.
- **D-13 page key:** `definePageMeta({ key: route => \`trip:${String(route.params.slug)}\` })`. The 404 guard is unchanged.
- **D-20:** nothing reads, writes or migrates localStorage (grep guard). The `roma-*` and `roma-theme` keys don't depend on the route, so existing notes and preferences carry over.

## Task Commits

1. **Task 1 (tracer): Roma moves to /trips/roma/ from the data (D-18 move commit)**: `23ec79f` (feat)
2. **Task 2: back link in every guide footer + per-trip page key**: `895888b` (feat)

**Tracer gate:** the Task 1 `<verify>` (clean generate, gate, diff guard, lint/typecheck) ran end to end on exactly the committed tree and passed, then Task 2 continued. Auto mode is off and `<verify>` is automated-only, so there was no checkpoint.

## Files Created/Modified
- `nuxt.config.ts`: manifest import, `routes: prerenderRoutes(readTripManifest())` and a D-13 comment
- `tests/parity/_harness.ts`: `ROMA_URL = '/guiaRoma/trips/roma/'`, the only line changed
- `tests/parity/shell.spec.ts`: inverted trips/ test plus its two describing comment lines
- `tests/data/build-isolation.spec.ts`: `INDEX`/`PAYLOAD` point to `trips/roma/`, `skipIf` uses `BUILD_INDEX`, new existence `it`, the drafts-absent `it` replaces the "no trips/ at all" one, JSDoc updated
- `tests/data/romaChrome.spec.ts`: `BUILT` points to `trips/roma/index.html` and the skip uses `BUILD_INDEX` (Task 1). The footer regex no longer requires `</footer>`, and a new `it` checks the exact back-link markup and a single `footer .container p` (Task 2).
- `app/components/TripView.vue`: footer always rendered, `homeHref` (after `provideTripSlug`), comments rewritten per D-03/D-04
- `app/pages/trips/[slug].vue`: `definePageMeta` key by slug and a rewritten header comment
- `tests/trips/shape.spec.ts`: prueba footer assertions (count 1, `.container` 0, link text and href) and the chrome block comment (D-03 replaces D-14's "no footer")

## Decisions Made
See key-decisions in the frontmatter. All of them follow the plan, CONTEXT and RESEARCH Patterns 2, 5 and 6. I made no new architectural choices.

## Deviations from Plan

None. The plan executed exactly as written.

Notes (not deviations):
- **Tooling artifact:** the shell's `grep` is an ugrep wrapper that treats a mid-pattern `$` as an anchor. The acceptance check `grep -c 'trip:${String(route.params.slug)}'` returned 0 with the wrapper and 1 with GNU `/usr/bin/grep` (and with `grep -F`). The file has exactly one such line. The 11-02 SUMMARY already flagged this.
- **First-pass fix:** my first TripView comment repeated «← Todos los viajes», so the `== 1` count criterion returned 2. I reworded the comment to "el enlace a la portada" before the Task 2 commit. The change is comment-only, so the gate run in progress was unaffected, and eslint was re-run afterwards.
- **Stale comment kept on purpose:** the shell.spec.ts header still says "la salida estática SOLO emite «/» (D-01)" (lines 20-21). D-18 allows only the two comment lines that describe the inverted test, so it stays as is. 11-05 edits shell.spec anyway.
- **Flake watch:** the known `navigation.spec.ts «SC#2 scrollspy» [mobile]` flake did not appear. Both gate runs were 80/80 on the first try.

**Total deviations:** 0. **Impact:** none.

## Issues Encountered
None.

## Known Stubs
None.

## Threat Flags
None. The only new surface is a same-origin document link to the site root (T-11-07 in the plan's register, mitigated by the runtime `baseURL` and the grep guards).

## User Setup Required
None. No external service configuration is required.

## Next Phase Readiness
- **Intermediate branch state (planned, never deployed):** `/` still renders Roma and `/trips/roma/` exists too. On `/`, Roma's back link points to itself. 11-05 turns `/` into the portada.
- No Roma parity spec depends on `/` any more, so 11-05 can replace `app/pages/index.vue` freely. It still has to flip `tests/trips/{isolation,shape}.spec.ts`'s dev `ROMA_URL` (`/guiaRoma/` today) to `/guiaRoma/trips/roma/`.
- 11-07 should add the E2E no-remount test for the slug page key (RESEARCH Pitfall 1).

## Self-Check: PASSED
- FOUND: all 8 modified files exist; `.output/public/trips/roma/index.html` and `_payload.json` exist
- FOUND commits: 23ec79f, 895888b (both ancestors of HEAD; `git rev-list --count 3317904..HEAD` = 2)
- Plan verification: `pnpm verify` green twice (unit 263, data 354 → 355, parity 80, 56 goldens untouched); `playwright test -c playwright.trips.config.ts` 17/17, run alone after `rm -rf .data .nuxt`; `trips/prueba` and `trips/forma` absent; `git diff --quiet 6315f26 -- golden.spec.ts, golden snapshots, app/assets/css/` exits 0; eslint and `nuxi typecheck` clean; `vitest run tests/unit` 263/263
- All Task 1 and Task 2 acceptance criteria re-run: PASS (the page-key grep with GNU grep, as noted above)
