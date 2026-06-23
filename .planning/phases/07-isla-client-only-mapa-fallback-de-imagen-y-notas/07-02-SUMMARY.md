---
phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas
plan: 02
subsystem: ui
tags: [leaflet, client-only, ssr, hydration, nuxt, map, parity]

# Dependency graph
requires:
  - phase: 07-01
    provides: "deriveMarkers(monById, extras) → 39 MapMarker (38 monuments + Coliseo ★) + isOffline(errored, loaded) in app/utils/; TripSchema.mapExtras + the Coliseo datum in trip.yml"
  - phase: 05
    provides: "useCardNavigation singleton + the F5 capture-phase document click listener (mounted once by TripView) that intercepts a[href^='#'] popup anchors"
  - phase: 03
    provides: "useTrip('roma') (trip.map.center/zoom + trip.mapExtras + monById) and TripView as the page owner with the single useCardNavigationController()"
provides:
  - "app/components/LeafletMap.client.vue — the single client-only Leaflet island (dynamic import in onMounted, divIcon markers, popups, fitBounds, offline counters)"
  - "TripView #mapa filled with the verbatim static map chrome + <ClientOnly><LeafletMap/></ClientOnly> + a same-size empty #fallback box (D-02)"
affects: [07-04-parity-verification, 08-pixel-diff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "First .client.vue in the repo: the suffix is the primary anti-'window is not defined' guard; dynamic import('leaflet') inside the onMounted callback is the SSR-safe data/lib boundary"
    - "ClientOnly with a same-size empty #fallback (no loading text) → zero layout shift between prerender and hydration"

key-files:
  created:
    - app/components/LeafletMap.client.vue
  modified:
    - app/components/TripView.vue

key-decisions:
  - "Tile attribution uses the fuller form '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors' (plan action + UI-SPEC §1b), NOT the index.html's bare '&copy; OpenStreetMap' — the plan/UI-SPEC prescribe the richer attribution string"
  - "Coliseo extra (trip.mapExtras) mapped to MapMarker with id='' — guided popups are text-only (no anchor), so the empty id never reaches a href (correct by construction, D-01)"
  - "tileload handler ported as expression-body arrow `() => tilesLoaded++` (was `() => { tilesLoaded++ }`) to satisfy @stylistic/max-statements-per-line; behavior-identical (Leaflet ignores the callback return)"

patterns-established:
  - "Client-only DOM-library island: .client.vue suffix + <ClientOnly> wrapper + dynamic import() inside onMounted = three anti-window layers; SSR ships an empty same-size fallback"

requirements-completed: [FEAT-02]

# Metrics
duration: 5min
completed: 2026-06-23
---

# Phase 7 Plan 02: Leaflet client-only island Summary

**The single client-only Leaflet island (`LeafletMap.client.vue`, the repo's first `.client.vue`) ported 1:1 from index.html, mounted inside TripView's `#mapa` via `<ClientOnly>` with a same-size empty fallback: `nuxt generate` stays clean (no 'window is not defined'), the SSG ships an empty `#leaflet-map` box (zero layout shift, D-02), and after hydration the map renders 39 divIcon markers with type-colored popups whose card/concert anchors carry no handler (the F5 capture listener navigates).**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-23T12:27:58Z
- **Completed:** 2026-06-23T12:33Z
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- `app/components/LeafletMap.client.vue` (NEW, the repo's first `.client.vue`): three SSR-safety layers — the `.client` suffix, `<ClientOnly>` in TripView, and `const L = (await import('leaflet')).default` inside the `onMounted` callback. Ports the index.html map 1:1: `setView([41.8989,12.477],14)` from `trip.map.center/zoom`, OSM tiles `maxZoom:19`, the `tileload`/`tileerror` counters + the verbatim `isOffline(tilesErrored, tilesLoaded)` heuristic (`>3 && ===0`) driving `#map-offline-banner.show`, try/catch init fallback text, 39 `divIcon` markers (32×32, Cormorant Garamond, white border, colored by type `#8b3a3a`/`#a07c4a`/`#5a7a3a`), type-specific popups, `fitBounds(...pad(0.1))`, and `invalidateSize` at 300ms + on `load`.
- Consumes Plan 01's auto-imported `deriveMarkers` (39 = 38 monuments from `monById` + the Coliseo ★ from `trip.mapExtras`, D-01) and `isOffline`.
- Popup landmine resolved: card/concert popups are plain `<a href="#slug">` with NO `@click`/`onclick` (the F5 capture listener intercepts them); guided popups (Coliseo ★, vaticano) are text-only with no anchor — the inline `onclick` of the original is DROPPED.
- `TripView.vue` (MODIFY): replaced the empty `<section id="mapa" />` with the verbatim static chrome (eyebrow `cartografia`, `<h2>El mapa del viaje</h2>`, intro, `.map-wrapper`, `.map-offline-banner`, `.map-legend` — index.html:2361-2371). Only `#leaflet-map` is wrapped in `<ClientOnly>`; the `#fallback` is an empty `<div id="leaflet-map" />` (same CSS class → same 520px/420px height + hatched bg, no text, D-02 zero layout shift). The `#map-offline-banner` stays in the static `.map-wrapper` (outside `<ClientOnly>`) so it is in the prerendered HTML and reachable by `document.getElementById` from the island (A3). The single `useCardNavigationController()` is untouched (no second controller).

## Task Commits

Each task was committed atomically:

1. **Task 1: LeafletMap.client.vue — the client-only island** — `0a70493` (feat)
2. **Task 2: TripView.vue — fill #mapa with static chrome + ClientOnly island + same-size #fallback** — `9173cb6` (feat)

**Plan metadata:** see the docs commit (this SUMMARY + STATE/ROADMAP/REQUIREMENTS).

## Files Created/Modified
- `app/components/LeafletMap.client.vue` — the single client-only Leaflet island: dynamic `import('leaflet')` in `onMounted`, `setView`/OSM tiles/offline counters, `deriveMarkers` → 39 `divIcon` markers, type-colored popups (card/concert `<a href="#slug">` no-handler; guided text-only), `fitBounds`, `invalidateSize`. No Leaflet CSS import (already global), no style block.
- `app/components/TripView.vue` — `#mapa` filled with the verbatim static chrome + `<ClientOnly><LeafletMap/></ClientOnly>` + a same-size empty `#fallback`; header comment updated to record the F7 wiring (chrome static, only `#leaflet-map` in `<ClientOnly>`, banner outside, single controller).

## Decisions Made
- **Tile attribution = the fuller form** `'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'` (plan `<action>` + UI-SPEC §1b table), not the index.html's bare `'&copy; OpenStreetMap'`. The plan and UI-SPEC both prescribe the richer attribution; followed the plan over the raw source for this one string.
- **Coliseo extra → `id: ''`**: `trip.mapExtras` is mapped to `MapMarker` with an empty `id`. Because guided popups are text-only (no anchor), the empty id never reaches a `href` — correct by construction (D-01).
- **`tileload` as expression-body arrow** `() => tilesLoaded++`: the `() => { tilesLoaded++ }` block form tripped `@stylistic/max-statements-per-line` and is not auto-fixable; the expression body is behavior-identical (Leaflet ignores the handler's return value) and preserves the verbatim counter increment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lint formatting on LeafletMap.client.vue (brace-style + max-statements-per-line)**
- **Found during:** Task 1 (the file's own acceptance criterion is `pnpm lint` exit 0)
- **Issue:** Four `@stylistic` errors blocked the lint gate: three `brace-style` (the `} catch {` and `} else if {` braces wanted the next block on a new line) and one `max-statements-per-line` (`() => { tilesLoaded++ }` counts the block body as a second statement).
- **Fix:** `pnpm lint:fix` resolved the three brace-style errors; the remaining `max-statements-per-line` was fixed by hand — the `tileload` handler became the expression-body arrow `() => tilesLoaded++` (behavior-identical).
- **Files modified:** `app/components/LeafletMap.client.vue`
- **Verification:** `pnpm lint` exit 0; `pnpm typecheck` exit 0; the verbatim counter logic and the offline heuristic are unchanged.
- **Committed in:** `0a70493` (Task 1 commit)

**2. [Rule 3 - Blocking] Reworded explanatory comments to satisfy the grep-based acceptance gates**
- **Found during:** Task 1 + Task 2 (the acceptance criteria are literal greps)
- **Issue:** The plan's acceptance criteria are literal `grep` checks: `grep -c "leaflet/dist/leaflet.css"` == 0, `grep -E '@click|onclick'` == nothing, `grep -c '<style'` == 0 (Task 1), and `grep -c 'useCardNavigationController'` == exactly 1 (Task 2). My header comments mentioned those exact forbidden tokens ("NO `import 'leaflet/dist/leaflet.css'`", "NO llevan `@click`/`onclick`", "SIN `<style scoped>`", "un segundo `useCardNavigationController()`"), which made the literal greps report false positives even though there were zero actual violations (only `import type * as LeafletNS` + the dynamic `import('leaflet')`; exactly one real controller call; one real `<ClientOnly>`/`#fallback`).
- **Fix:** Reworded the comments to describe the constraints without the bare tokens ("este componente NO importa el CSS de Leaflet", "NO llevan ningún manejador de evento de clic", "SIN bloque de estilo scoped", "un segundo controller de navegación F5"). No code changed.
- **Files modified:** `app/components/LeafletMap.client.vue`, `app/components/TripView.vue`
- **Verification:** all four grep gates now pass literally (0/0/0 for Task 1, exactly 1 for Task 2); `pnpm generate` clean; the single `await useCardNavigationController()` call (TripView:68) and the single `<ClientOnly>` block (TripView:97-102) confirmed present.
- **Committed in:** `0a70493` (Task 1) + `9173cb6` (Task 2)

---

**Total deviations:** 2 auto-fixed (2 blocking). Both are cosmetic (lint formatting + comment wording); no behavioral change from the plan. No Rule 4 (architectural) decisions, no auth gates, no package installs.

## Issues Encountered
- None beyond the two auto-fixed lint/comment items above. `pnpm generate` was clean on the first run of each task (no `window is not defined` / `document is not defined`); the `.client.vue` suffix kept Leaflet out of the prerender as designed.

## User Setup Required
None — no external service configuration. OSM tiles load at runtime (offline banner handles failure); no new packages (`leaflet@1.9.4` + `@types/leaflet@1.9.21` were already installed and vetted in an earlier phase).

## Verification Evidence
- `pnpm generate` exit 0; `/tmp/f7gen.log` + `/tmp/f7gen2.log` contain NO `window is not defined` / `document is not defined`; `.output/public/index.html` exists.
- Prerendered HTML: `#leaflet-map` present and EMPTY (no child text → D-02 zero layout shift); `#map-offline-banner` present with exact text `Sin conexión · solo marcadores visibles`; chrome strings (`cartografia`, `El mapa del viaje`, intro, legend) present; **0** `custom-marker` and **0** `leaflet-container` in static HTML → the island is genuinely client-only.
- `grep -c "leaflet/dist/leaflet.css"` = 0; `grep -E '@click|onclick'` = nothing; `grep -c '<style'` = 0 (on `LeafletMap.client.vue`); `grep -c 'useCardNavigationController'` = 1 (on `TripView.vue`).
- Island contains `await import('leaflet')`, `isOffline(`, `deriveMarkers`, the three colors, `Visita con guía humano`, and `Abrir ficha →` ×2.
- `pnpm typecheck` exit 0; `pnpm lint` exit 0; `pnpm test:unit` 10 files / 87 tests passed (Plan 01 utils intact).
- Full behavioral parity (markers render, popup navigates without changing the hash, offline banner, guided text-only, image fallback, notes) is asserted by the Plan 04 parity spec (`tests/parity/map-fallback-notes.spec.ts`).

## Next Phase Readiness
- FEAT-02 map island is complete and `nuxt generate`-clean. Plan 03 (image fallback + notes — `MonumentCard`/`DetailPhoto.global.vue` consuming Plan 01's `svgMotifs`) and Plan 04 (parity verification) are unblocked.
- Carry-forward blocker (heritage, NOT introduced or touched here): the discriminated-union `artist`/`reference` collections still return all-null SQL rows (D1) — affects `#arte`/`#arquitectura`/`#reservas`/`#practica`, not the map.

## Self-Check: PASSED

- `app/components/LeafletMap.client.vue` exists on disk (FOUND).
- `app/components/TripView.vue` modified (FOUND).
- Task commits `0a70493` and `9173cb6` exist in git history (FOUND).

---
*Phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas*
*Completed: 2026-06-23*
