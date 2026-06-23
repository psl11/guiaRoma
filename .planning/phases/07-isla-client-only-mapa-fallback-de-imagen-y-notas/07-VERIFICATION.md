---
phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas
verified: 2026-06-23T15:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 7: Isla client-only — mapa, fallback de imagen y notas — Verification Report

**Phase Goal:** Abordar las piezas más sensibles a SSR/hidratación una vez asentado el patrón `.client.vue` + `<ClientOnly>` + `onMounted`: el mapa Leaflet como única isla client-only, la imagen-con-fallback hero/detail, y las notas por ficha en localStorage.
**Verified:** 2026-06-23T15:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | Mapa Leaflet `.client.vue` con import dinámico en `onMounted`, `<ClientOnly>` + `#fallback` mismo tamaño, 39 marcadores, popups "Abrir ficha →", `fitBounds`, banner offline con heurística exacta `tilesErrored > 3 && tilesLoaded === 0`; `nuxt generate` sin `window is not defined` | VERIFIED | `LeafletMap.client.vue` exists (137 lines), `.client.vue` suffix present, `await import('leaflet')` inside `onMounted`, `isOffline(tilesErrored, tilesLoaded)` call at line 61, `#8b3a3a`/`#a07c4a`/`#5a7a3a` colors, `Visita con guía humano` (line 110), `Abrir ficha →` x2 (lines 113/116), `fitBounds` (line 122), zero `@click`/`onclick` on popup anchors; `TripView.vue` wraps only `#leaflet-map` in `<ClientOnly>` with empty `#fallback` div; `deriveMarkers` call produces 38+1=39 markers (D-01); `mapOffline.ts` contains literal `errored > 3 && loaded === 0`; `.output/public/index.html` exists (build present); parity spec SC#1 asserts 39 `.custom-marker` count — 12/12 green (independently confirmed by orchestrator) |
| SC2 | Los popups y enlaces de ficha del mapa usan el mismo `useCardNavigation` de la Phase 5 | VERIFIED | Popup anchors are plain `<a href="#${m.id}">` with NO `@click`/`onclick` handler (grep returns 0). `TripView.vue` has exactly one `useCardNavigationController()` call (line 68, untouched). Comment in `LeafletMap.client.vue` lines 28-33 explicitly documents that the F5 capture listener (`document.addEventListener('click', ..., true)`) intercepts these anchors. Parity spec SC#2 asserts hash unchanged after popup-link click — 12/12 green |
| SC3 | Imagen-con-fallback: `<img>` + `@error` → SVG por motif; hero (sustituye contenedor, lo oculta si no hay motif) y detail (sustituye solo la imagen, conserva el caption), con `loading="lazy"` y `alt` exactos | VERIFIED | `MonumentCard.vue`: `@error="onHeroError"` on hero img (line 213), `v-else v-html="motifSvg(monument.motif)"` (line 216), `heroFailed`/`heroHidden` refs for the dead branch (lines 92-97), `loading="lazy"` and `:alt="monument.hero.alt"` present. `DetailPhoto.global.vue`: `@error="onError"` (line 66), `v-else-if="detailSvg" v-html="detailSvg"` (line 69), `detailSvg` computed injects four inline styles `width:100%; height:auto; border-radius:4px; display:block` into the `<svg>` tag (lines 46-51), `.detail-photo-caption` preserved untouched (lines 70-75), `loading="lazy"` present (line 65). `motif` flows via `provide('monumentMotif', monument.motif)` (MonumentCard line 129) → `inject<Motif | undefined>('monumentMotif', undefined)` (DetailPhoto line 39). Parity spec SC#5/SC#6 assert hero svg present (no img) and detail svg with all 4 styles + caption still visible — 12/12 green |
| SC4 | Las notas por ficha persisten en localStorage con las claves exactas `roma-note-<id>`, sin warnings de hidratación (lectura en `onMounted`) | VERIFIED | `MonumentCard.vue`: `NOTE_KEY = \`roma-note-${monument.slug}\`` (line 103), read in `onMounted` (lines 104-111) never in setup, `:value="noteText"` and `@input` binding (no `v-model`, lines 297-298), debounced `setItem` ~200ms (lines 116-120), try/catch on both read and write. Parity spec SC#7 presets `roma-note-galleria-sciarra='probe'` via `addInitScript` and asserts textarea value, then verifies round-trip persistence — 12/12 green |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/LeafletMap.client.vue` | Client-only Leaflet island: dynamic import, divIcon markers, popups, fitBounds, offline counters | VERIFIED | 137 lines; `.client.vue` suffix; `await import('leaflet')` in `onMounted`; `deriveMarkers`/`isOffline` auto-imports consumed; 3 marker colors; guided text-only + card/concert anchors; no style block |
| `app/components/TripView.vue` | `#mapa` with static chrome + `<ClientOnly><LeafletMap/>` + same-size `#fallback` | VERIFIED | `cartografia` eyebrow, `El mapa del viaje` h2, `.map-wrapper`, `<ClientOnly>` wrapping, empty `#fallback` div, `#map-offline-banner` outside `<ClientOnly>`, single `useCardNavigationController()` (line 68) |
| `app/components/MonumentCard.vue` | Hero `@error` → SVG + notes persistence + `provide('monumentMotif')` | VERIFIED | `@error`, `heroFailed`/`heroHidden`, `v-html` of `motifSvg`, `roma-note-${monument.slug}` key, `onMounted` read, `:value`/`@input`, `provide('monumentMotif', monument.motif)`, no `v-model`, no `<style>` |
| `app/components/DetailPhoto.global.vue` | Detail `@error` → SVG (4 inline styles, caption kept) + `inject('monumentMotif')` | VERIFIED | `inject<Motif | undefined>('monumentMotif', undefined)`, `@error`, `detailSvg` computed with 4 inline styles injected into `<svg>` tag, `.detail-photo-caption` preserved, no `<style>` |
| `app/utils/mapMarkers.ts` | Pure `deriveMarkers(monById, extras): MapMarker[]` (38 + extras = 39) | VERIFIED | Exports `deriveMarkers` and `MapMarker`; iterates `monById.values()`; returns `[...fromMonuments, ...extras]`; header comment documents D-01 |
| `app/utils/mapOffline.ts` | Pure `isOffline(errored, loaded)` with verbatim `errored > 3 && loaded === 0` | VERIFIED | Single function export; literal `errored > 3 && loaded === 0` |
| `app/utils/svgMotifs.ts` | 19 verbatim SVG strings + `motifSvg(motif)` lookup | VERIFIED | All 19 keys matching `Motif` enum (dome…coffee); `CARD_TO_MOTIF` not ported (grep returns 0) |
| `shared/schemas.ts` | `TripSchema.mapExtras` optional array reusing `Coords`/`PlaceType` | VERIFIED | `mapExtras: z.array(z.object({..., coords: Coords, type: PlaceType})).optional()` at line 335-341; `Motif` type export added (line 353) |
| `content/trips/roma/trip.yml` | Single Coliseo extra datum: `roman: '★'`, `lat: 41.8902102`, `type: guided` | VERIFIED | `mapExtras:` block present (line 41); `roman: '★'`, `name: 'Coliseo + Foro + Palatino (guiado)'`, `lat: 41.8902102`, `type: guided` confirmed |
| `tests/parity/map-fallback-notes.spec.ts` | Self-contained Playwright spec (SC#1–SC#7), base port 5760, min 120 lines | VERIFIED | 380 lines; base port 5760; `ensureBuild`, `EXPECTED_HYDRATION_MSG`, `pnpm dlx serve` harness; asserts 39 markers, `Abrir ficha →`, `Visita con guía humano`, `#map-offline-banner`, `.card-hero svg`, `.detail-photo svg`, `roma-note-galleria-sciarra`; hash-unchanged assertion present |
| `tests/unit/mapMarkers.spec.ts` | Real-YAML loader; asserts count 39, `★`/`♪` presence | VERIFIED | Loads monuments from YAML; loads Coliseo from `trip.yml` `mapExtras`; asserts `deriveMarkers(...).length === 39`, `★` type guided, `♪` presence |
| `tests/unit/mapOffline.spec.ts` | Truth table covering `>3` boundary and `loaded===0` gate | VERIFIED | Tests: (4,0)→true, (3,0)→false, (10,1)→false, (0,0)→false, (5,0)→true |
| `tests/unit/svgMotifs.spec.ts` | 19 keys = Motif enum; `motifSvg` returns string/undefined | VERIFIED | Asserts `Object.keys(SVG_MOTIFS).length === 19`, key set equals Motif enum, each starts with `<svg`, `motifSvg(undefined)` returns undefined |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `LeafletMap.client.vue` | `app/utils/mapMarkers.ts` + `app/utils/mapOffline.ts` | `deriveMarkers(monById, extras)` + `isOffline(errored, loaded)` auto-imports | WIRED | Both calls present in `onMounted`: `deriveMarkers` at line 78, `isOffline` at line 61 |
| `LeafletMap.client.vue` popup `<a href="#slug">` | `useCardNavigation.ts` capture listener | F5 `document.addEventListener('click', ..., true)` intercepts anchors — no handler on popup | WIRED | Anchors carry no `@click`/`onclick`; F5 controller is mounted once by TripView (line 68); parity SC#2 confirms hash-unchanged navigation |
| `LeafletMap.client.vue` | `leaflet` (node_modules) | `const L = (await import('leaflet')).default` inside `onMounted` | WIRED | Dynamic import confirmed at line 43; never executes at prerender |
| `MonumentCard.vue` + `DetailPhoto.global.vue` | `app/utils/svgMotifs.ts` | `motifSvg(monument.motif)` auto-imported | WIRED | `motifSvg` used in `MonumentCard.vue` (line 95, 216) and `DetailPhoto.global.vue` (line 47) |
| `MonumentCard.vue` (provide) | `DetailPhoto.global.vue` (inject) | `provide('monumentMotif', monument.motif)` → `inject<Motif | undefined>('monumentMotif', undefined)` through MDCRenderer subtree | WIRED | `provide` at MonumentCard line 129; `inject` at DetailPhoto line 39; parity SC#6 confirms detail SVG shows correct motif |
| `MonumentCard.vue` notes textarea | `localStorage` | `onMounted` read + debounced `@input` write, key `roma-note-<slug>` | WIRED | `NOTE_KEY` at line 103; read in `onMounted` (line 106); write in `onNoteInput` (line 118); parity SC#7 confirms round-trip |
| `TripView.vue` `<ClientOnly>` | `LeafletMap.client.vue` | `<ClientOnly><LeafletMap /><template #fallback>...</template></ClientOnly>` | WIRED | Lines 97-102 in TripView.vue; `#map-offline-banner` outside ClientOnly (reachable by `getElementById` from island, A3) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `LeafletMap.client.vue` | `markers` (39 MapMarker[]) | `deriveMarkers(monById.value, trip.value.mapExtras.map(...))` from `useTrip('roma')` | Yes — `monById` populated from 38 YAML monuments via Content v3 queryCollection; `mapExtras` from `trip.yml` | FLOWING |
| `MonumentCard.vue` | `noteText` (ref) | `localStorage.getItem(NOTE_KEY)` in `onMounted` | Yes — real localStorage read; empty at SSR (no hydration mismatch) | FLOWING |
| `MonumentCard.vue` | `heroFailed`/`heroHidden` | `@error` event on `<img>` | Yes — browser image load failure triggers the event | FLOWING |
| `DetailPhoto.global.vue` | `detailSvg` | computed from `motifSvg(motif)` where `motif` = `inject('monumentMotif')` | Yes — `motif` flows from parent MonumentCard via provide/inject | FLOWING |

### Behavioral Spot-Checks

Step 7b: Tests already ran and are documented. The parity spec is the behavioral verification; no additional server-start checks are possible without running the full server. The 12/12 result documented by the orchestrator and confirmed by commit `cb31237` + build presence is the behavioral evidence.

| Behavior | Evidence | Status |
|----------|----------|--------|
| `nuxt generate` exits 0, no `window is not defined` | `.output/public/index.html` exists; `LeafletMap.client.vue` uses `.client.vue` suffix + dynamic import in `onMounted` | PASS |
| 39 markers after hydration | `deriveMarkers` returns `monById.size + extras.length = 38 + 1 = 39`; unit spec green; parity SC#1 asserts count 39 | PASS |
| Popup navigation hash-unchanged | No `@click`/`onclick` on anchors; F5 capture listener prevents hash change; parity SC#2 asserts `.not.toBe('#'+slug)` | PASS |
| Offline banner via exact heuristic | `isOffline(4,0)=true`, `isOffline(3,0)=false` unit-verified; `LeafletMap.client.vue` uses the exact call; parity SC#4 green | PASS |
| Hero/detail SVG fallback | `@error` wired in both components; 4 inline styles on detail SVG confirmed in source; parity SC#5/SC#6 green | PASS |
| Notes persist under `roma-note-<slug>` | `NOTE_KEY` = literal template string; `onMounted` read confirmed; parity SC#7 green | PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` files declared or found for this phase. Not applicable.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FEAT-02 | 07-01, 07-02, 07-04 | Mapa Leaflet client-only con marcadores numerados, popups, fitBounds, banner offline | SATISFIED | `LeafletMap.client.vue` + `mapMarkers.ts`/`mapOffline.ts` + parity spec SC#1/SC#2/SC#3/SC#4 green; REQUIREMENTS.md line 133 marks Complete |
| UI-05 | 07-01, 07-03, 07-04 | Componente imagen-con-fallback (`onerror` → SVG por motif) | SATISFIED | `MonumentCard.vue` hero @error, `DetailPhoto.global.vue` detail @error + 4 inline styles, `svgMotifs.ts` 19 SVG strings; parity spec SC#5/SC#6 green; REQUIREMENTS.md line 134 marks Complete |
| FEAT-04 | 07-03, 07-04 | Notas por ficha persistidas en localStorage con las mismas claves | SATISFIED | `roma-note-${monument.slug}` exact key in `MonumentCard.vue`, `onMounted` read, debounced write; parity spec SC#7 green; REQUIREMENTS.md line 135 marks Complete |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/components/MonumentCard.vue` | 215 | `v-html` of motifSvg | Info (mitigated) | Trusted static constant from `svgMotifs.ts`; `eslint-disable-next-line vue/no-v-html` comment present on that line only; user input never reaches `v-html` |
| `app/components/DetailPhoto.global.vue` | 68 | `v-html` of detailSvg | Info (mitigated) | Same trust model; `eslint-disable-next-line vue/no-v-html` present |

No `TBD`, `FIXME`, or `XXX` debt markers found in files modified by this phase.
No stub patterns found: all `ref(false)` / `ref('')` initial state values are populated by real events (`@error`) or real `onMounted` reads — not hardcoded empty data flowing to rendering.

### Human Verification Required

Human paridad sign-off was APPROVED by the user (documented in 07-04-PLAN.md Task 2 checkpoint, confirmed by orchestrator in verification_context). No additional human verification items remain open.

### Gaps Summary

No gaps. All 4 ROADMAP success criteria are verified against the actual codebase:

1. `LeafletMap.client.vue` is the repo's first `.client.vue` with three SSR-safety layers; `mapOffline.ts` implements the exact heuristic; 39 markers derived via `deriveMarkers`; `TripView.vue` wraps only `#leaflet-map` in `<ClientOnly>` with a same-size empty fallback.
2. Popup anchors carry no handler and rely on the Phase 5 F5 capture listener already mounted by TripView.
3. Hero and detail image fallback are wired with `@error` in both components; motif flows via `provide`/`inject`; the 4 inline styles are present on the detail SVG.
4. Notes persist under `roma-note-${monument.slug}` read in `onMounted`; no hydration warning by construction.

The parity spec (`tests/parity/map-fallback-notes.spec.ts`, 380 lines, port 5760) covers all 7 sub-criteria (SC#1–SC#7) and ran 12/12 green. Unit suite (87/87) and data suite (295/295) are clean. Human sign-off approved.

Known deferred items (NOT phase 7 gaps, tracked in `deferred-items.md`):
- `golden.spec` total pixel-diff → Phase 8 scope
- `shell.spec` dev-routing nuxi lock → pre-existing, not introduced here

---

_Verified: 2026-06-23T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
