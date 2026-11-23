---
phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas
plan: 04
subsystem: testing
tags: [playwright, parity, leaflet, ssg, hydration, image-fallback, notes, offline]

# Dependency graph
requires:
  - phase: 07-02
    provides: "LeafletMap.client.vue — the client-only island: 39 divIcon markers (.custom-marker), type-colored popups (card/concert <a href='#slug'> no-handler; guided text-only), offline banner via isOffline heuristic; TripView #mapa chrome + same-size empty #fallback (D-02)"
  - phase: 07-03
    provides: "MonumentCard hero @error → motifSvg via v-html + per-monument notes (roma-note-<slug>, onMounted read); DetailPhoto.global.vue detail @error → motif SVG (4 inline styles, caption kept) via provide/inject"
  - phase: 05
    provides: "useCardNavigation F5 capture-phase document click listener — intercepts a[href^='#'] popup anchors (preventDefault, hash unchanged)"
  - phase: 06
    provides: "the self-contained parity harness (modes/navigation/search-route.spec) — build once, serve .output/public under /guiaRoma/ on a per-spec base port, console gate tolerating only the color-mode message"
provides:
  - "tests/parity/map-fallback-notes.spec.ts — the Nyquist Wave-0 behavioral verification of FEAT-02 / UI-05 / FEAT-04 (SC#1–SC#7 of 07-UI-SPEC) against the BUILT /guiaRoma/ site"
affects: [08-pixel-diff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Leaflet marker popups opened via dispatchEvent('click') on the exact .custom-marker element (NOT .click() / force) — markers overlap physically in the fitBounds view, so a coordinate-based click (even forced) hits whichever marker is topmost at that pixel; the synthetic event fires Leaflet's own DOM 'click' popup handler on the resolved element with no hit-testing"
    - "Console gate with a tolerateAborts flag: tests that route.abort() resources (tiles in SC#4, images in SC#5/SC#6) tolerate the deliberate net::ERR_FAILED (the signal that drives the offline banner / SVG fallback) in addition to the color-mode hydration message"
    - "A5 image abort by resourceType: context.route('**/' + '*', r => r.request().resourceType()==='image' ? r.abort() : r.continue()) forces every <img> @error regardless of host (golden.spec precedent)"

key-files:
  created:
    - tests/parity/map-fallback-notes.spec.ts
  modified: []

key-decisions:
  - "Markers opened with dispatchEvent('click') (not .click({force:true})): a forced coordinate click still resolved the WRONG popup (doria-pamphilj VII overlapping galleria-sciarra I) because Leaflet hit-tests the topmost marker at the pixel; the synthetic DOM click on the resolved element fires that exact marker's popup handler"
  - "SC#3 asserts the SET of open guided popups (both ★ popups can stay open at once because the synthetic marker click bypasses the map click-flow that would auto-close the previous popup): 0 anchors total across open popups + the open set covers both 'Vaticano' and 'Coliseo' — honoring the vaticano-has-a-ficha-but-no-link quirk by count/presence, not order"
  - "SC#5 and SC#6 share one image-aborting context (resourceType abort hits hero AND detail) — galleria-sciarra is the single fixture (card type, has both a hero and a :detail-photo), keeping the spec cohesive with SC#2/SC#7"
  - "Slug read from the popup anchor href (not assumed blind), mirroring search-route.spec's data-card discipline; the I marker deterministically resolves to galleria-sciarra (the only monument with exact roman 'I')"
  - "Requirements FEAT-02/UI-05/FEAT-04 NOT marked complete in REQUIREMENTS.md yet — the phase-closing human paridad sign-off (Task 2 checkpoint) is the gate; marking them complete before sign-off would contradict the pending verification"

patterns-established:
  - "Leaflet behavioral parity in Playwright: dispatchEvent('click') on the resolved .custom-marker (overlap-proof), read the popup anchor's href to discover the slug, dispatchEvent('click') the anchor to route through the F5 capture listener (hash unchanged)"

requirements-completed: []

# Metrics
duration: 10min
completed: 2026-06-23
---

# Phase 7 Plan 04: Map + image-fallback + notes parity spec Summary

**The 4th clone of the self-contained parity harness (`tests/parity/map-fallback-notes.spec.ts`, base port 5760) proves all three F7 behaviors against the BUILT `/guiaRoma/` site — `nuxt generate` clean, the SSG `#leaflet-map` empty, 39 markers + 2 ★ after hydration, card popups navigating via the F5 capture listener (hash unchanged), both guided popups text-only (vaticano quirk honored), the offline banner on tile abort, hero+detail SVG fallback on image abort (caption kept), and notes round-tripping under `roma-note-<slug>` — 12/12 green (SC#1–SC#7 × mobile + desktop). Task 2 (the phase-closing human paridad sign-off) is the pending checkpoint.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-23T12:53:30Z
- **Completed:** 2026-06-23T13:04Z (Task 1; Task 2 awaiting human sign-off)
- **Tasks:** 2 (1 auto complete + 1 checkpoint:human-verify pending)
- **Files modified:** 1 (1 created)

## Accomplishments

- `tests/parity/map-fallback-notes.spec.ts` (NEW, 380 lines): the self-contained Playwright spec — clones the `modes.spec.ts` harness VERBATIM (the `EXPECTED_HYDRATION_MSG`, `OUTPUT_DIR`, `waitForServer`, `killGroup`, `ensureBuild`, the `beforeAll` build+`cpSync('guiaRoma')`+`spawn('pnpm',['dlx','serve',…],{detached:true})`+`waitForServer`, the `afterAll` `killGroup`+`rmSync`, the `gotoHydrated` hydration signal), changing only the base port to `5760` (distinct from 5700/5720/5740), the `mkdtemp` prefix (`guiaroma-mapfb-`), and the describe text. Every test attaches the console gate and ends with `expect(consoleErrors).toHaveLength(0)`.
- **SC#1** — map client-only + generate: reads `.output/public/index.html` and asserts it contains `<div id="leaflet-map"` with NO `leaflet-container`/`custom-marker` baked (the island is genuinely client-only, D-02 empty fallback); after hydration `.leaflet-container` is visible, `.custom-marker` count is exactly `39`, and exactly `2` markers contain `★` (vaticano + Coliseo).
- **SC#2** — popup navigates via F5: opens galleria-sciarra's marker (the only one whose text is exactly `I`), reads the `Abrir ficha →` anchor's href → slug, `dispatchEvent('click')` on the anchor, asserts `#galleria-sciarra` gains `.highlight` and `new URL(page.url()).hash` is NOT `#galleria-sciarra` (D-03 preventDefault).
- **SC#3** — guided text-only quirk: opens both `★` markers, asserts every open popup contains `Visita con guía humano`, the total anchor count across open guided popups is `0`, and the open set covers both `Vaticano` and `Coliseo` (the vaticano-has-a-ficha-but-no-link quirk honored).
- **SC#4** — offline banner: own context aborting `**/` + `*.tile.openstreetmap.org/**`, asserts `#map-offline-banner` gains `.show`, is visible, and has the exact text `Sin conexión · solo marcadores visibles`.
- **SC#5 + SC#6** — image fallback: own context aborting every image by `resourceType` (A5 golden precedent), asserts `#galleria-sciarra .card-hero svg` present with no `<img>`, and `.detail-photo svg` present carrying the four inline styles `width:100%`/`height:auto`/`border-radius:4px`/`display:block`, with `.detail-photo-caption` still present and non-empty and no `<img>` left.
- **SC#7** — notes persistence: `addInitScript` presets `roma-note-galleria-sciarra='probe'`, asserts the textarea reads `probe`; then types into pantheon's textarea, polls until `roma-note-pantheon` is written, reloads, and asserts it persisted. The clean console gate proves the `onMounted` read produces no hydration warning.
- Quality gates: `pnpm generate` exit 0 (no `window is not defined`); `pnpm test:golden tests/parity/map-fallback-notes.spec.ts` 12/12 green; `pnpm test:unit` 10 files / 87 tests green (Plan 01 utils unaffected).

## Task Commits

1. **Task 1: tests/parity/map-fallback-notes.spec.ts — self-contained parity spec (SC#1–SC#7)** — `cb31237` (test)
2. **Task 2: Human paridad sign-off (map + image fallback + notes)** — `checkpoint:human-verify` (PENDING — returned to orchestrator, not self-approved)

**Plan metadata:** see the docs commit (this SUMMARY + STATE/ROADMAP).

## Files Created/Modified

- `tests/parity/map-fallback-notes.spec.ts` — the self-contained F7 parity spec: harness cloned from `modes.spec.ts` (port 5760), 7 tests (SC#1 markers/SSG, SC#2 popup-nav, SC#3 guided text-only, SC#4 offline banner, SC#5+6 hero/detail fallback, SC#7 notes), console gate with `tolerateAborts`, A5 tile/image abort, F5 popup-nav via `dispatchEvent`.

## Decisions Made

- **Markers opened with `dispatchEvent('click')`, not `.click({force:true})`**: Leaflet markers overlap physically in the Rome `fitBounds` view; a coordinate-based click — even forced — opens whichever marker is topmost at that pixel (observed: clicking `I`/galleria-sciarra opened `VII`/doria-pamphilj's popup). The synthetic DOM click on the resolved element fires that exact marker's Leaflet popup handler with no hit-testing → the correct popup.
- **SC#3 asserts the set of open guided popups**: the synthetic marker click bypasses the map click-flow that would auto-close the previous popup, so both `★` popups stay open; asserting `0` anchors across the open set plus coverage of both `Vaticano` and `Coliseo` honors the quirk by count/presence, not order (per the plan's marker guidance).
- **Console gate `tolerateAborts` flag**: `route.abort()` makes the browser log `Failed to load resource: net::ERR_FAILED` per aborted request — the deliberate offline/broken-image signal, not a runtime error. SC#4/SC#5/SC#6 tolerate it (plus the color-mode message); the non-aborting tests do not, keeping T-07-07 (the regression guard) sharp.
- **Requirements left unmarked**: FEAT-02/UI-05/FEAT-04 are behaviorally proven green, but the phase-closing human paridad sign-off (Task 2) is the gate; they will be marked complete after the human approves.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Block-comment `*/` token in a glob literal broke the parse**
- **Found during:** Task 1 (first spec run — `SyntaxError: Unexpected token (23:8)`)
- **Issue:** The header JSDoc described the tile glob `**` + `/*.tile.openstreetmap.org/**`; the `*/` inside `/*.tile` prematurely closed the block comment, so the file failed to parse and Playwright reported "No tests found".
- **Fix:** Reworded the header comment to reference the host `tile.openstreetmap.org` and point to the `context.route` in SC#4 instead of inlining the glob (the glob in the actual `context.route(...)` string literal is unaffected — it is code, not a comment).
- **Files modified:** `tests/parity/map-fallback-notes.spec.ts`
- **Verification:** the file parses; the spec runs.
- **Committed in:** `cb31237`

**2. [Rule 1 - Bug] Console gate failed on the deliberate `net::ERR_FAILED` of aborted requests**
- **Found during:** Task 1 (SC#4/SC#5/SC#6 red — `Received length: 13/18` console errors, all `Failed to load resource: net::ERR_FAILED`)
- **Issue:** The console gate tolerated only the color-mode message, but aborting tiles/images (the whole point of those tests) makes the browser log a console error per abort. The golden A5 precedent aborts images too but asserts no console gate, so the conflict only surfaced here.
- **Fix:** Added an `ABORTED_REQUEST_MSG` pattern and a `tolerateAborts` flag to `trackConsoleErrors`; SC#4 and SC#5+6 pass `tolerateAborts=true`. The non-aborting tests (SC#1/SC#2/SC#3/SC#7) keep the strict gate.
- **Files modified:** `tests/parity/map-fallback-notes.spec.ts`
- **Verification:** SC#4/SC#5/SC#6 green on both projects; the strict gate still fires for any other error.
- **Committed in:** `cb31237`

**3. [Rule 1 - Bug] Marker click hit the wrong overlapping popup; Escape did not close popups**
- **Found during:** Task 1 (SC#2 timed out on `.click()` with `<div>VII</div> intercepts pointer events`; after `force:true`, SC#2 read `#doria-pamphilj` instead of `#galleria-sciarra`; SC#3's `Escape`-to-close left the popup open)
- **Issue:** Leaflet markers overlap physically, so coordinate clicks (even forced) resolve the topmost marker at the pixel, not the intended one; and Leaflet does not close popups on Escape by default.
- **Fix:** Switched marker activation to `dispatchEvent('click')` on the resolved `.custom-marker` element (synthetic event → that marker's own popup handler, no hit-testing); dropped the Escape step and reworked SC#3 to assert the set of open guided popups.
- **Files modified:** `tests/parity/map-fallback-notes.spec.ts`
- **Verification:** SC#2 reads `galleria-sciarra` and navigates with hash unchanged; SC#3 green; full spec 12/12.
- **Committed in:** `cb31237`

---

**Total deviations:** 3 auto-fixed (3 blocking/bug) — all within the new test file, all surfaced and resolved during the spec's own bring-up; no app code touched, no scope creep, no Rule 4 (architectural) decisions, no auth gates, no package installs.

## Issues Encountered

- The three deviations above were the entirety of the bring-up friction; each was a property of how Playwright interacts with Leaflet (marker overlap, no Escape-close) or with aborted requests (`net::ERR_FAILED` console noise), resolved without touching the F7 implementation. The app behavior under test was correct from the start — the spec needed to drive Leaflet the right way.

## Deferred Issues

- The 4–5 pre-existing full-suite failures (golden.spec pixel-diff → Phase 8; shell.spec dev-routing nuxi lock) are out of scope and tracked in `deferred-items.md` — NOT touched here (the plan's verification note forbids it).
- Carry-forward blocker (heritage, NOT introduced or touched here): the discriminated-union `artist`/`reference` collections still return all-null SQL rows (D1) — affects `#arte`/`#arquitectura`/`#reservas`/`#practica`, not the map/fallback/notes surface this spec verifies.

## User Setup Required

None — no external service configuration, no new packages (Playwright + Vitest already configured; `leaflet`/`@types/leaflet` vetted in earlier phases).

## Verification Evidence

- `pnpm generate` exit 0 (`/tmp/f7p4-generate.log`): no `window is not defined` / `document is not defined`; 10 routes prerendered; `.output/public/index.html` exists.
- `pnpm test:golden tests/parity/map-fallback-notes.spec.ts`: **12 passed** (SC#1–SC#7 × mobile + desktop). The plan's exact verify (`pnpm generate >/dev/null 2>&1 && pnpm test:golden …`) also exits 0.
- `pnpm test:unit`: 10 files / 87 tests passed (Plan 01 utils intact).
- Acceptance greps: `5760` ×2 (the STATIC_PORT + the comment), `dlx` ×1, `ensureBuild`/`EXPECTED_HYDRATION_MSG` present, behavior tokens (39 / Abrir ficha / Visita con guía humano / map-offline-banner / card-hero / detail-photo / roma-note-galleria-sciarra) ×25, the `new URL(page.url()).hash … .not.toBe` assertion present; 380 lines (≥120). No `STATIC_PORT` collision with 5700/5720/5740.

## Next Phase Readiness

- FEAT-02 / UI-05 / FEAT-04 behavioral parity is proven by one green self-contained spec (the Nyquist Wave-0 dependency). The phase's remaining gate is **Task 2 — the human paridad sign-off** (returned as a checkpoint). After approval, requirements FEAT-02/UI-05/FEAT-04 should be marked complete and the phase closed; Phase 8 owns the total pixel-diff (F8).

## Self-Check: PASSED

- `tests/parity/map-fallback-notes.spec.ts` exists on disk (FOUND).
- Task 1 commit `cb31237` exists in git history (FOUND).
- `pnpm test:golden tests/parity/map-fallback-notes.spec.ts` 12/12 green; `pnpm generate` clean; `pnpm test:unit` 87/87 green.

---
*Phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas*
*Completed: 2026-06-23 (Task 1; Task 2 awaiting human paridad sign-off)*
