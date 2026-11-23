# Phase 7: Isla client-only — mapa, fallback de imagen y notas - Research

**Researched:** 2026-06-23
**Domain:** Leaflet-in-Nuxt-4 SSR-safe island; `<img @error>` → SVG fallback in Vue/MDC; localStorage notes persistence; zod schema extension
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Paridad = ley** (Core Value): F7 reproduce el comportamiento del `index.html` **exactamente**. Port 1:1 (mapas de línea en Canonical References), no reinventar. La 1.0 es paridad, no mejora de producto.
- **Leaflet 1.9.4 CRUDO en `client-only`** (CLAUDE.md §4): import desde `node_modules` (`import L from 'leaflet'` + `import 'leaflet/dist/leaflet.css'`), self-host vía Vite. **NO** `@vue-leaflet/vue-leaflet`. **NO** CDN. Marcadores con `L.divIcon` (HTML puro, sin imágenes).
- **`useCardNavigation` (F5) es el ÚNICO consumidor** de enlaces a ficha; los popups del mapa enchufan a `navigateToCard(id, event)`. **No** se recrea la lógica de navegación.
- **Init client-only en `onMounted`**: estado/efectos que tocan `window`/`document`/`localStorage`/Leaflet viven en `onMounted`; SSR/prerender emiten el default → cero mismatch; `nuxt generate` sin `window is not defined` (SC#1).
- **CSS VERBATIM, cero CSS nuevo, sin `<style scoped>`**: todas las clases ya existen (`#leaflet-map`, `.map-offline-banner(.show)`, `.notes-area`/`.notes-textarea`, `.detail-photo`/`.card-hero`, filtro dark `[data-theme="dark"] .leaflet-tile`).
- **Los datos tipados YA soportan el mapa y el fallback**: cada `Monument` lleva `roman`/`name`/`day`/`coords`/`type`/`motif` (obligatorio); `trip.map = { center, zoom }`. `motif` obligatorio ⇒ la rama "ocultar hero si no hay motif" **nunca dispara para monumentos** (se porta igual por fidelidad).
- **D-01 (marcadores):** se **DERIVAN de los 38 monumentos** (`monById` → `roman`/`name`/`day`/`coords`/`type`/`slug`) **+ el Coliseo como único `extra` explícito** en `trip.yml`. `places` original = 39 pines; monumentos = 38; la única diferencia es `coliseo`. **NUNCA derivar solo de `monById`** (tiraría el Coliseo = regresión).
- **Dato exacto del extra (Coliseo)** verbatim de `index.html:6292`: `{ roman:'★', name:'Coliseo + Foro + Palatino (guiado)', day:'Domingo', coords:{ lat:41.8902102, lng:12.4922309 }, type:'guided' }`.
- **Popups por tipo = port verbatim** (`index.html:6361-6369`): `card` → `<a>Abrir ficha →</a>` (color `#8b3a3a`) vía `navigateToCard`; `concert` → `<a>Abrir ficha →</a>` (color `#5a7a3a`) vía `navigateToCard`; `guided` → **solo texto** `Visita con guía humano` (color `#5c534a`), **sin enlace**. Quirk: `vaticano` es `guided` → su popup **no** lleva enlace aunque SÍ tiene ficha. Colores `divIcon`: card `#8b3a3a`, guided `#a07c4a`, concert `#5a7a3a` (círculo 32×32, Cormorant Garamond, borde blanco, el romano `p.n`).
- **D-02 (placeholder):** el `#fallback` de `<ClientOnly>` = **caja vacía del mismo tamaño que `#leaflet-map`** (520px desktop / 420px responsive), sin texto "cargando". Cero salto de layout, cero elemento nuevo.
- **D-03 (notas):** clave `roma-note-<slug>` (de `ta.dataset.noteKey`), **leer en `onMounted`**, **guardar en `input`**, **solo monumentos**. Debounce inocuo del `setItem` permitido. **Cero cambio visible, ninguna UI nueva.** Micro-flash empty→saved aceptable.
- **D-04 (fallback de imagen):** `<img @error>` → SVG por `monument.motif`. HERO (`loadSvgFallback`, `2215-2227`): sustituye el contenido de `.card-hero` por el SVG; si no hay motif → oculta el contenedor (rama muerta). DETAIL (`loadSvgFallbackDetail`, `2229-2252`): sustituye solo la `<img>` (estilos inline `width:100%`/`height:auto`/`border-radius:4px`/`display:block`), conserva el `.detail-photo-caption`. `loading="lazy"` y `alt` exactos. `SVG_MOTIFS` (19) verbatim. **`CARD_TO_MOTIF` NO se porta** (lo reemplaza `monument.motif`).

### Claude's Discretion
- Forma/nombre del componente del mapa (`*.client.vue`) y su montaje dentro del `#mapa` de `TripView`.
- **Cómo enchufan los popups a `navigateToCard` sin disparar el landmine de F5**: `<a href="#slug">` + listener de captura **vs** `data-card` + extender el listener. Resolver y **verificar en el spec**.
- **Cómo llega el `motif` al `DetailPhoto.global.vue`** (hoy solo recibe `src`/`alt`/`caption`): `provide`/`inject`, prop MDC, o lookup por slug.
- Forma/nombre del campo extra del Coliseo en `TripSchema`/`trip.yml`.
- Dónde viven las 19 cadenas `SVG_MOTIFS` (util/asset/composable) y cómo se inyectan.
- Mecánica del guardado de notas (`v-model` vs listener `input`; debounce inocuo) y lectura inicial en `onMounted`.
- Estrategia de verificación: spec Playwright **autocontenido** (build+serve bajo `/guiaRoma/`), forzando `tileerror` y el `onerror` de imagen con `page.route.abort`.

### Deferred Ideas (OUT OF SCOPE)
- Clustering / búsqueda dentro del mapa.
- Export / sync / markdown de notas, indicador "guardado".
- Fallback de imagen en imágenes que no sean hero/detail.
- Deep-links / hash compartible a ficha.
- **Caché offline real de tiles del mapa** = PWA = v2.
- **Pixel-diff total = F8.**
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEAT-02 | Mapa Leaflet (componente client-only) con marcadores numerados por tipo, popups "Abrir ficha →", `fitBounds` y banner offline — idéntico a hoy | §Standard Stack (Leaflet ya instalado), §Pattern 1 (isla SSR-safe), §Pattern 2 (markers/popups port), §Pitfall 1-3, §Code Examples 1-3, §Validation (force tileerror) |
| UI-05 | Componente imagen-con-fallback que reproduce el `onerror` → SVG por ficha/motif | §Pattern 3 (`@error` → SVG), §Pitfall 4 (`v-html` SVG), §Pitfall 5 (motif a DetailPhoto), §Code Examples 4-5, §Validation (force image error) |
| FEAT-04 | Notas por ficha persistidas en localStorage, con las mismas claves y comportamiento | §Pattern 4 (notas onMounted), §Pitfall 6 (hidratación), §Code Examples 6, §Validation (notes persist) |
</phase_requirements>

## Summary

This phase ports three `index.html` behaviors 1:1 into the existing Nuxt 4 app. The good news, confirmed by reading every relevant file: **the project's architecture already contains a working precedent for each of the three pieces**, and **no new packages are needed** — `leaflet@1.9.4` and `@types/leaflet@1.9.21` are already in `package.json`, and the full Leaflet 1.9.4 stylesheet is already self-hosted at `app/assets/css/leaflet.css` and loaded globally via `nuxt.config.ts`. The phase is almost entirely a port-with-fidelity exercise against a mature, internally-consistent codebase.

The single highest-risk item — how the Leaflet popup "Abrir ficha →" link integrates with the F5 capture-phase navigation listener — resolves cleanly once you understand two facts I verified directly: (1) Leaflet's `popupPane` is created inside the map's root container, which is inside `document`, so the F5 `document.addEventListener('click', …, true)` capture listener **does** see clicks originating in a popup; and (2) the F5 listener matches `a[href^="#"]` and gates on `monById.has(id)`. Therefore a popup rendered as a plain `<a href="#slug">` (no Vue/JS handler) is intercepted by the F5 capture listener exactly like the timeline `a.tl-title` links already are in `navigation.spec.ts`. This is the inverse of the SearchBox CR-01 situation (which used `data-card`-no-href *because* it needed its own bubble `@click` to also clear the input — the map popup has no such secondary action).

The image-fallback and notes pieces are straightforward Vue ports: `@error` handlers replacing `onerror`, `localStorage` read moved into `onMounted` (the established anti-hydration-warning pattern used by `useTripModes`, `useCardNavigation`, and `useSearch`). The Coliseo extra-marker is a one-field zod schema extension validated by the existing Vitest data-gate. All three are testable with the established self-contained Playwright parity-spec pattern (`pnpm generate` once → copy to `guiaRoma/` subdir → `serve`), plus pure-logic Vitest for marker derivation, the offline-heuristic predicate, and SVG lookup.

**Primary recommendation:** Build one `LeafletMap.client.vue` mounted in `TripView`'s empty `<section id="mapa">`, wrapped in `<ClientOnly>` with a same-size `#fallback`. Do `const L = (await import('leaflet')).default` in `onMounted` (do NOT add a JS-side `import 'leaflet/dist/leaflet.css'` — the CSS is already global). Render popups as plain `<a href="#slug">` and rely on the existing F5 capture listener (verify in spec). Extract marker-derivation, the offline-heuristic predicate, and the SVG-motif lookup into pure `app/utils/*.ts` modules tested in Vitest; verify map/banner/fallback/notes behavior in a self-contained Playwright spec that forces `tileerror` and image `@error` via `page.route().abort()`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Leaflet map render + tiles + markers | Browser / Client | — | DOM-dependent (`L.map` needs `window`/a live element). Must be a client-only island; SSG prerenders only the `#fallback` box. |
| Marker data derivation (monById + Coliseo) | Build / Data (pure) | Browser | Pure function over typed data → testable in Vitest; consumed by the client island at mount. |
| Offline banner heuristic (`tilesErrored>3 && tilesLoaded===0`) | Browser / Client | Build (pure predicate) | Counters live at runtime in the browser; the *predicate* is a pure function (unit-testable). |
| Popup → ficha navigation | Browser / Client | — | Reuses F5 `useCardNavigation` controller (already client-only, mounted once in TripView). No new tier. |
| Image `@error` → SVG fallback | Browser / Client | Build / Data (motif) | The error event is a browser event; the `motif` and the SVG strings are static data. |
| Notes persistence | Browser / Client | — | `localStorage` is browser-only; read in `onMounted` to avoid hydration mismatch. |
| Coliseo extra-marker datum | Build / Data | — | zod schema + YAML; validated at the Vitest data gate. |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `leaflet` | `1.9.4` | Interactive map, divIcon markers, popups, tile layer, fitBounds | **Already installed** (`package.json` dependency). Same library the live `index.html` inlines; API ports 1:1. Used raw per CLAUDE.md §4. `[VERIFIED: node_modules/leaflet/package.json = 1.9.4]` |
| `@types/leaflet` | `1.9.21` | TS types for the dynamically-imported `L` | **Already installed** (`package.json` devDependency). `[VERIFIED: node_modules/@types/leaflet/package.json = 1.9.21]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nuxt/content` (`queryCollection`) | `3.14.0` | Already supplies `trip.map` + `monById` via `useTrip()` | Map reads `trip.map.center/zoom` for `setView`; markers derive from `monById`. No new query needed. |
| `yaml` | `^2.9.0` | Node-pure YAML parse in Vitest (load real `*.yml` in the marker-derivation unit test) | devDependency, already present; pattern from `dayRoute.spec.ts`/`invariants.spec.ts`. |

**No new packages required for this phase.** Every dependency the three features need is already in `package.json`.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw Leaflet in `.client.vue` | `@vue-leaflet/vue-leaflet` | REJECTED by CLAUDE.md §4 (abandoned 2023-06-16; hides the raw `L.divIcon`/`fitBounds`/popup-HTML API the port needs). |
| `const L = await import('leaflet')` in `onMounted` | Top-level `import L from 'leaflet'` in a `.client.vue` | Dynamic import is the conservative, documented anti-`window is not defined` pattern. (See Pitfall 1 — a top-level static import in a `.client.vue` is *also* tree-shaken from SSR, but dynamic import is the lowest-risk choice and matches community guidance.) |
| Plain `<a href="#slug">` popup + F5 capture listener | `data-card` + extend `onDelegatedClick` | Both work; the plain anchor requires ZERO change to F5 and matches the existing `a.tl-title` precedent. See §Pattern 2 / §Pitfall 2 for the full analysis and the verification step. |

**Installation:**
```bash
# Nothing to install — leaflet@1.9.4 and @types/leaflet@1.9.21 are already in package.json.
```

**Version verification:**
```
[VERIFIED] node_modules/leaflet/package.json        → "version": "1.9.4"
[VERIFIED] node_modules/@types/leaflet/package.json → "version": "1.9.21"
[VERIFIED] package.json dependencies                → leaflet: "1.9.4"
[VERIFIED] package.json devDependencies             → @types/leaflet: "1.9.21"
```

## Package Legitimacy Audit

**Not applicable — this phase installs no external packages.** `leaflet@1.9.4` and `@types/leaflet@1.9.21` were vetted and installed in an earlier phase (they appear in the committed `package.json` and `node_modules`). Both are first-party, multi-year-established packages with massive download counts; no new package surface is introduced by Phase 7.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PRERENDER (nuxt generate) — NO window/document/Leaflet                   │
│                                                                           │
│  TripView  ──renders──▶  <section id="mapa">                              │
│                              └─ <ClientOnly>                              │
│                                   #fallback ──▶ empty box (#leaflet-map   │
│                                                 dims, 520/420px)          │  ← what SSG ships
│                                   (default slot NOT rendered server-side) │
│  MonumentCard ─▶ <img src=remote loading=lazy>  (no error yet at SSR)     │
│  DetailPhoto  ─▶ <img src=remote loading=lazy>  (no error yet at SSR)     │
│  notes <textarea> ─▶ empty (no localStorage at SSR)                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │  hydrate in browser
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CLIENT (onMounted)                                                       │
│                                                                           │
│  LeafletMap.client.vue                                                    │
│    onMounted ─▶ const L = (await import('leaflet')).default               │
│      │                                                                    │
│      ├─▶ deriveMarkers(monById, trip)  [pure util]                        │
│      │     = 38 monuments + 1 Coliseo extra  → 39 markers                 │
│      │                                                                    │
│      ├─▶ L.map(el,{scrollWheelZoom:false}).setView([center],zoom)         │
│      ├─▶ L.tileLayer(OSM)                                                 │
│      │     ├─ on tileload  → tilesLoaded++                                │
│      │     └─ on tileerror → tilesErrored++ ; if offlinePredicate(...)    │
│      │                          → banner.classList.add('show')   [pure]   │
│      ├─▶ per marker: L.divIcon(html, color-by-type) + bindPopup(html)     │
│      │     popup card/concert ─▶ <a href="#slug">Abrir ficha →</a>        │
│      │     popup guided       ─▶ plain text "Visita con guía humano"      │
│      ├─▶ fitBounds(L.latLngBounds(coords).pad(0.1))                       │
│      └─▶ setTimeout(invalidateSize,300) + on load invalidateSize          │
│                                                                           │
│  popup <a href="#slug"> click ──bubbles to document──▶                    │
│        F5 capture listener (already mounted by TripView)                  │
│        closest('a[href^="#"]') → isFichaTarget(slug) → navigateToCard     │
│        (scroll-smooth + .highlight 2500ms, hash unchanged)                │
│                                                                           │
│  MonumentCard hero <img @error> ─▶ onHeroError(motif)                     │
│        → replace .card-hero innards with SVG_MOTIFS[motif] (v-html toggle)│
│  DetailPhoto <img @error> ─▶ onDetailError(motif)                         │
│        → replace only the <img> with SVG, keep caption                    │
│                                                                           │
│  notes <textarea> onMounted ─▶ value = localStorage['roma-note-'+slug]    │
│        @input ─▶ (debounced) localStorage.setItem('roma-note-'+slug, val) │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
app/
├── components/
│   ├── LeafletMap.client.vue   # NEW — the single client-only island; mounted in TripView #mapa
│   ├── TripView.vue            # MODIFY — fill <section id="mapa"> with <ClientOnly><LeafletMap/></ClientOnly>
│   ├── MonumentCard.vue        # MODIFY — hero <img @error> + notes persistence on .notes-textarea
│   └── DetailPhoto.global.vue  # MODIFY — detail <img @error> + receive `motif`
├── utils/
│   ├── mapMarkers.ts           # NEW (pure) — deriveMarkers(monById, trip) → 38 + Coliseo; tested in Vitest
│   ├── mapOffline.ts           # NEW (pure) — isOffline(errored, loaded) predicate; tested in Vitest
│   └── svgMotifs.ts            # NEW — the 19 SVG_MOTIFS strings (verbatim) + motifSvg(motif) lookup
├── composables/
│   └── useNotes.ts             # OPTIONAL (pure-ish) — read/write helper if MonumentCard logic grows; else inline
shared/
└── schemas.ts                  # MODIFY — extend TripSchema with the Coliseo extra marker field
content/trips/roma/
└── trip.yml                    # MODIFY — add the Coliseo extra marker datum
tests/
├── unit/
│   ├── mapMarkers.spec.ts      # NEW — derivation = 39, includes coliseo, colors/popup-type per place
│   ├── mapOffline.spec.ts      # NEW — predicate truth table
│   └── svgMotifs.spec.ts       # NEW — 19 keys present, lookup returns string / undefined
└── parity/
    └── map-fallback-notes.spec.ts  # NEW — self-contained (build+serve /guiaRoma/); map renders,
                                     #   popup navigates, offline banner via aborted tiles, hero+detail
                                     #   SVG fallback via aborted images, notes persist
```

### Pattern 1: SSR-safe Leaflet island (`*.client.vue` + `<ClientOnly>` + dynamic import in `onMounted`)
**What:** A `.client.vue` component (Nuxt renders it only client-side; SSR emits nothing for it) that dynamically imports Leaflet inside `onMounted` and builds the map imperatively. Wrap the usage site in `<ClientOnly>` with a `#fallback` so the prerendered HTML ships a same-size empty box (D-02).
**When to use:** Any DOM/`window`-dependent library in an SSG/SSR Nuxt app — this is the canonical anti-`window is not defined` shape, and the project already uses the "client-only effects in onMounted" discipline everywhere (`useTripModes`, `useCardNavigation`, `useSearch`).
**Belt-and-suspenders:** The `.client.vue` suffix alone guarantees the component never runs during `nuxt generate`. Wrapping in `<ClientOnly>` additionally lets you supply the same-size `#fallback` box for layout stability. Doing the Leaflet `import()` inside `onMounted` (not at module top-level) is the third layer of safety and the community-recommended placement. `[CITED: forum.vuejs.org/t/window-not-defined-error-on-my-nuxt-js-app-using-leaflet/112209]` `[CITED: codingeasypeasy.com — When to Use <ClientOnly> in Nuxt 3]`
**Example:**
```vue
<!-- app/components/LeafletMap.client.vue (sketch — planner ports the exact index.html logic) -->
<script setup lang="ts">
import type * as LeafletNS from 'leaflet'   // types only; erased at build (no runtime import)
const { trip, monById } = await useTrip('roma')
const mapEl = ref<HTMLElement | null>(null)
onMounted(async () => {
  const L = (await import('leaflet')).default   // [ASSUMED] default export shape — verify; @types/leaflet 1.9.21 default-exports the namespace
  // ... L.map(mapEl.value!, { scrollWheelZoom: false }).setView([c.lat,c.lng], zoom) ...
})
</script>
<template>
  <div ref="mapEl" id="leaflet-map"></div>
  <!-- the .map-offline-banner + legend etc. live in the parent #mapa markup, verbatim -->
</template>
```
```vue
<!-- TripView.vue — fill the empty <section id="mapa" /> (currently TripView.vue:75) -->
<section id="mapa">
  <div class="container">
    <div class="section-eyebrow">cartografia</div>
    <h2>El mapa del viaje</h2>
    <p style="font-style: italic; color: var(--ink-soft); margin-bottom: 1.5rem;">Numeración por orden cronológico de visita. Toca un marcador para abrir su ficha.</p>
    <div class="map-wrapper" style="position:relative;">
      <ClientOnly>
        <LeafletMap />
        <template #fallback>
          <div id="leaflet-map"></div>   <!-- same-size empty box (D-02), no "loading" text -->
        </template>
      </ClientOnly>
      <div class="map-offline-banner" id="map-offline-banner">Sin conexión · solo marcadores visibles</div>
    </div>
    <p class="map-legend">✦  Rojos · paradas con ficha · Dorados · eventos guiados · Verde · concierto Einaudi ✦</p>
  </div>
</section>
```
> NOTE for planner: the eyebrow/h2/intro/legend/`.map-wrapper`/`.map-offline-banner` are STATIC chrome (verbatim `index.html:2361-2371`) and can live in TripView's static markup; only `#leaflet-map` needs to be inside `<ClientOnly>` (or render `#leaflet-map` in both the default-slot component and the `#fallback`). Decide placement so the offline-banner `#map-offline-banner` is reachable by `document.getElementById` from the client island (it is, anywhere in the DOM). `[VERIFIED: index.html:2361-2371]`

### Pattern 2: Markers, divIcons, popups, fitBounds — verbatim port
**What:** Inside `onMounted`, after `L` is imported: derive the marker list (pure util), loop to build `L.divIcon` (HTML circle, color-by-type) + `L.marker(...).bindPopup(html)`, then `fitBounds(L.latLngBounds(coords).pad(0.1))`, then `setTimeout(invalidateSize, 300)` + `window.addEventListener('load', invalidateSize)`.
**When to use:** This is the literal port of `index.html:6343-6378`.
**Popup-navigation decision (the landmine — RESOLVED):** Render the `card`/`concert` popups as a **plain `<a href="#slug">Abrir ficha →</a>` with NO Vue/JS click handler**, and rely on the existing F5 capture-phase listener to intercept it. Evidence:
- Leaflet attaches popup DOM to `popupPane`, which `_initPanes` creates via `this.createPane('popupPane')` whose container defaults to `this._mapPane`, itself created inside `this._container` = the `<div id="leaflet-map">`. So the popup `<a>` is a normal descendant of the map container, inside `document`. `[VERIFIED: node_modules/leaflet/dist/leaflet-src.js:4239-4275, 4255 (mapPane in _container), 4275 (popupPane)]`
- The F5 controller registers `document.addEventListener('click', onDelegatedClick, true)` (CAPTURE) that does `closest('a[href^="#"]')`, gates on `isFichaTarget(id) === monById.has(id)`, then `preventDefault()` + `stopPropagation()` + `navigateToCard`. A capture listener on `document` fires for ANY click in the document subtree — including inside a Leaflet popup. `[VERIFIED: app/composables/useCardNavigation.ts:137-145, 159-160, 165-168]`
- The existing `navigation.spec.ts` proves a plain `<a href="#doria-pamphilj" class="tl-title">` (NO Vue handler) is intercepted by this exact listener (scroll-smooth + `.highlight`, hash unchanged). The popup anchor is the same shape. `[VERIFIED: tests/parity/navigation.spec.ts:46-49, 193-196]`
- This is the INVERSE of the SearchBox CR-01 case: SearchBox used `data-card`-no-href *because* its result link needed its own bubble `@click` to ALSO clear+close the dropdown, and the F5 capture `stopPropagation` was eating that bubble handler. The map popup has NO secondary action — it only needs to navigate — so it WANTS the capture listener to handle it, and a plain `<a href="#slug">` is exactly right. Do NOT attach an `onclick`/`@click` to the popup anchor (that would reproduce CR-01). `[VERIFIED: app/components/SearchBox.vue:26-35]`
- The original `index.html` popup uses `onclick="navigateToCard('id', event)"` on the anchor (`index.html:6365/6367`); in the Nuxt port that inline handler is DROPPED — the F5 capture listener replaces it. (Dropping it is necessary: an inline `onclick` calling a global `navigateToCard` would not exist as a global in Nuxt, and even a bound handler would be the CR-01 trap.)

**`guided` popup quirk (paridad):** `guided` markers (including `vaticano`, which DOES have a ficha) render popup body as **plain text** `Visita con guía humano` with **no anchor** (`index.html:6362-6363`). The Coliseo extra is also `guided` → text-only popup. Port verbatim; do not "fix" the vaticano-has-a-ficha-but-no-link quirk.

**Anti-Patterns to Avoid**
- **Attaching `@click`/`onclick` to the popup `<a href="#slug">`** — reproduces CR-01: the F5 capture listener `stopPropagation`s and the bubble handler never fires. Rely on the capture listener instead (plain anchor, no handler).
- **`import 'leaflet/dist/leaflet.css'` in the component `<script>`** — unnecessary and a potential SSG footgun. The full Leaflet 1.9.4 CSS is ALREADY self-hosted at `app/assets/css/leaflet.css` and loaded globally by `nuxt.config.ts`. Adding a JS-side CSS import would double-load it. `[VERIFIED: nuxt.config.ts css array; app/assets/css/leaflet.css = 849 lines = full Leaflet stylesheet, byte-identical head to node_modules/leaflet/dist/leaflet.css]`
- **Deriving markers from `monById` only** — drops the Coliseo (D-01 regression). Always append the explicit extra.
- **A `<style scoped>` block in `LeafletMap.client.vue`** — a `data-v-*` attribute would break the global `.leaflet-*`, `#leaflet-map`, `.map-offline-banner` and `[data-theme="dark"] .leaflet-tile` selectors AND the DOM Leaflet generates at runtime (which carries no scope attribute). CSS is verbatim/global.

### Pattern 3: Image `@error` → SVG fallback (hero + detail)
**What:** Replace the native `onerror="loadSvgFallback(this,'slug')"` with a Vue `@error` handler that, on image load failure, swaps in the motif SVG. Hero mode replaces the `.card-hero` contents (or hides the container if no motif — dead branch for monuments). Detail mode replaces only the `<img>` with the SVG (inline styles `width:100%`/`height:auto`/`border-radius:4px`/`display:block`), preserving `.detail-photo-caption`.
**When to use:** Port of `index.html:2215-2252`, wired to the F4-mounted shells (`MonumentCard.vue:150-156` hero; `DetailPhoto.global.vue:30-34` detail).
**Recommended Vue approach (toggle `v-html`, not DOM mutation):** Hold a reactive `failed` flag per image; on `@error` set `failed = true`; render the SVG via `v-html` when failed, the `<img>` when not. This is more idiomatic than the original's imperative `wrap.innerHTML = ...`/`img.replaceWith(svg)` and yields identical DOM. The CSS already sizes `.card-hero svg` (`base.css:719` — `.card-hero svg, .card-hero img { width:100%;height:100%;object-fit:cover }`) so the hero SVG needs NO inline styles; the detail SVG keeps the original inline styles for exact parity (`base.css:825 .detail-photo img` styles the `<img>`, not the `<svg>`, so the inline `width:100%` etc. on the swapped-in SVG matter). `[VERIFIED: base.css:719-724, 820-844]`
**Hero example (MonumentCard):**
```vue
<!-- MonumentCard.vue — replaces the plain hero <img> at lines 150-156 -->
<div class="card-hero" v-show="!heroHidden">
  <img v-if="!heroFailed" :src="monument.hero.src" :alt="monument.hero.alt" loading="lazy" @error="onHeroError">
  <!-- eslint-disable-next-line vue/no-v-html — SVG is a TRUSTED static constant (svgMotifs.ts), never user input -->
  <span v-else v-html="motifSvg(monument.motif)"></span>
</div>
<script setup>
const heroFailed = ref(false)
const heroHidden = ref(false)   // dead branch for monuments (motif always present), ported for fidelity
function onHeroError() {
  const svg = motifSvg(monument.motif)
  if (svg) heroFailed.value = true
  else heroHidden.value = true   // mirrors `img.parentElement.style.display='none'` (index.html:2222)
}
</script>
```
**Detail example (DetailPhoto.global.vue):** same flag pattern; when failed, render the SVG with the four inline styles verbatim. See §Pitfall 5 for how `motif` reaches this component.

### Pattern 4: Notes persistence (`localStorage`, read in `onMounted`)
**What:** Bind the F4-mounted `.notes-textarea` (which already has `:data-note-key="monument.slug"`) to `localStorage['roma-note-'+slug]`: read in `onMounted`, write on `input` (debounce OK). Monuments only. No new UI.
**When to use:** Port of `index.html:6471-6483` (`setupNotes`), wired into `MonumentCard.vue:229-237`.
**Recommended binding:** Use `:value` + `@input` (NOT `v-model`) so the initial empty render matches SSR and the `onMounted` read fills it one frame later (the sanctioned micro-flash, same precedent as modes). A reactive `noteText = ref('')` filled in `onMounted` from localStorage, bound `:value="noteText"`, `@input` updates `noteText` and (debounced) writes. `v-model` would also work but `:value`/`@input` keeps the SSR default explicit and parallels SearchBox's deliberate `:value`/`@input` choice. `[VERIFIED: index.html:6474-6481; MonumentCard.vue:229-237; SearchBox.vue:62-64]`
```vue
<!-- MonumentCard.vue — the .notes-textarea shell (lines 229-237), wired -->
<textarea
  :id="'note-' + monument.slug"
  class="notes-textarea"
  :data-note-key="monument.slug"
  placeholder="Lo que quieras recordar de aquí…"
  :value="noteText"
  @input="onNoteInput(($event.target as HTMLTextAreaElement).value)"
/>
<script setup>
const noteText = ref('')
const KEY = `roma-note-${monument.slug}`     // exact key (index.html:6474)
onMounted(() => { try { noteText.value = localStorage.getItem(KEY) ?? '' } catch {} })  // read in onMounted (no hydration warning)
let t: ReturnType<typeof setTimeout> | undefined
function onNoteInput(v: string) {
  noteText.value = v
  clearTimeout(t)
  t = setTimeout(() => { try { localStorage.setItem(KEY, v) } catch {} }, 200)  // innocuous debounce (D-03 allows)
}
</script>
```

### Anti-Patterns to Avoid
- **Reading `localStorage` outside `onMounted`** (e.g., in `setup`, or as a `ref` initializer) → hydration mismatch warning, because SSR can't read it and renders empty while the client renders the saved value. ALWAYS read in `onMounted`.
- **`v-model` on the notes textarea with a localStorage-backed initializer that runs during setup** — same hydration trap. Keep the initial value empty at SSR; fill in `onMounted`.
- **`v-html` of anything user-controlled** — here the SVG comes from a trusted static constant (`svgMotifs.ts`), so `v-html` is safe and is the idiomatic way to inject raw SVG markup; add the `eslint-disable vue/no-v-html` comment with a justification (the repo's eslint flat config will otherwise flag it). The notes/popup name fields must NEVER use `v-html` (popup names come from data and are interpolated, not raw-injected).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map rendering, markers, popups, tile loading, fitBounds | A custom canvas/SVG map | `leaflet@1.9.4` (already installed, used raw) | The whole point of CLAUDE.md §4; the API ports 1:1 from the live site. |
| Ficha navigation from popups | A second `navigateToCard` / popup-specific click logic | `useCardNavigation()` (F5) via plain `<a href="#slug">` + the existing capture listener | D-05 designed F5 for exactly this consumer; recreating it = drift + the CR-01 trap. |
| Map data (center/zoom, marker fields) | A new fetch / a hardcoded `places` array | `useTrip('roma')` → `trip.map` + `monById` (already typed, prerendered, offline) | Markers derive from the typed `Monument`s; only the Coliseo extra is new data. |
| SSR-safe client island | `process.client` guards scattered through a normal component | `.client.vue` + `<ClientOnly>` + dynamic import in `onMounted` | Established pattern; the suffix alone removes the component from `nuxt generate`. |
| Offline detection | A `navigator.onLine` listener / fetch probe | The verbatim `tileerror`/`tileload` counter heuristic (pure predicate) | Paridad: the original's heuristic is `tilesErrored>3 && tilesLoaded===0`; reproduce it exactly. |

**Key insight:** This phase is a *port*, not a design. Every "how should I…" question has a verbatim answer in `index.html` and a structural precedent already in the repo. The only genuinely new artifacts are: one `.client.vue`, three tiny pure utils, one schema field, one YAML datum, and one parity spec.

## Runtime State Inventory

> This is a port/wiring phase (not a rename), but it touches `localStorage`. Inventory included for the one stateful surface.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **`localStorage['roma-note-<slug>']`** — per-monument notes. The KEY SCHEME is identical to the live `index.html` (`'roma-note-' + ta.dataset.noteKey`, where `dataset.noteKey = slug`). Any note a user saved on the live site under `roma-note-galleria-sciarra` etc. is read back unchanged by the Nuxt port (same key, same origin once deployed under `/guiaRoma/`). | **Code edit only** — no data migration. Reproduce the exact key. `[VERIFIED: index.html:6474; MonumentCard.vue:234 data-note-key="monument.slug"]` |
| Live service config | None — the map tiles come from public OSM at runtime; no service config embeds any renamed string. | None — verified by reading the map init (`index.html:6322`). |
| OS-registered state | None. | None — pure web app. |
| Secrets/env vars | None — no secret or env var is referenced by map/fallback/notes. | None. |
| Build artifacts | None new — `leaflet`/`@types/leaflet` already installed; no codegen. | None. |

**Theme-key compatibility note:** `roma-theme` (FEAT-01) and `roma-pace`/`roma-light`/`roma-resumen` (F4) are unchanged by this phase; only `roma-note-*` is added, and it matches the live key, so saved notes survive the migration.

## Common Pitfalls

### Pitfall 1: `nuxt generate` crashes with `window is not defined`
**What goes wrong:** Leaflet touches `window`/`document` at import time and at `L.map(...)`. If any of that runs during prerender, `nuxt generate` throws `window is not defined`.
**Why it happens:** A normal (non-`.client`) component, or a top-level `import L from 'leaflet'` evaluated server-side, or map init outside `onMounted`.
**How to avoid:** Three layers — (1) name the file `LeafletMap.client.vue`; (2) wrap usage in `<ClientOnly>`; (3) `const L = (await import('leaflet')).default` *inside* `onMounted`, and do `L.map(...)` only there. `[CITED: forum.vuejs.org/.../112209]` `[CITED: codingeasypeasy.com]`
**Warning signs:** `pnpm generate` exits non-zero with `window is not defined` or `document is not defined` in the Nitro prerender step. SC#1 requires a clean `pnpm generate`.

### Pitfall 2: The popup link is silently swallowed (CR-01 reprise)
**What goes wrong:** If you attach `@click="navigateToCard(...)"` (bubble) to the popup `<a href="#slug">`, the F5 capture listener fires first, `stopPropagation`s, and your bubble handler never runs — OR (if you use a plain anchor with no F5 interception) the hash jumps natively.
**Why it happens:** F5's `document` listener is in CAPTURE phase with `stopPropagation` (resolved empirically in Plan 05-03). Capture beats bubble.
**How to avoid:** Render the popup anchor as a **plain `<a href="#slug">` with NO handler**. The capture listener matches `a[href^="#"]`, sees `monById.has(slug) === true`, and does `preventDefault`+`stopPropagation`+`navigateToCard` for you — exactly as it already does for `a.tl-title`. **Do NOT** add `@click`/`onclick`. **Verify in the spec** (see §Validation): clicking the popup link scrolls+highlights the ficha and does NOT change the hash.
**Warning signs in spec:** popup click changes `location.hash` to `#slug` (native jump — interception failed), or nothing happens (handler eaten). Either is a red test.

### Pitfall 3: Map has zero size / tiles render in the wrong place
**What goes wrong:** Leaflet computes container size at init; if the container was `display:none` or zero-height (e.g., still in a `<ClientOnly>` fallback transition, or inside a section that reflows after lazy images load), tiles misalign.
**Why it happens:** Same reason the original calls `invalidateSize`.
**How to avoid:** Port the verbatim `setTimeout(() => map.invalidateSize(), 300)` and `window.addEventListener('load', () => map.invalidateSize())` (`index.html:6377-6378`). The `#leaflet-map` has a fixed height in CSS (520/420px) so the container is sized even before tiles load. `[VERIFIED: base.css:1178 height:520px; index.html:2137 height:420px]`
**Warning signs:** gray tiles, markers offset from their real positions, a half-rendered map until a resize.

### Pitfall 4: SVG fallback renders as escaped text or breaks layout
**What goes wrong:** Interpolating the SVG string with `{{ }}` shows the raw `<svg>...` markup as text; or injecting it without the right wrapper changes layout.
**Why it happens:** `{{ }}` escapes HTML by design.
**How to avoid:** Use `v-html` with the trusted static SVG constant. For HERO, the swapped SVG inherits `.card-hero svg { width:100%;height:100%;object-fit:cover }` (no inline styles needed). For DETAIL, apply the four inline styles verbatim (`width:100%`/`height:auto`/`border-radius:4px`/`display:block`) on the SVG, because `.detail-photo img` CSS targets `img`, not the swapped-in `svg`. `[VERIFIED: base.css:719-724, 825-831; index.html:2238-2241]`
**Warning signs:** literal `<svg viewBox=...>` text on the page; or a detail SVG that's full-bleed/unrounded (missing inline styles).

### Pitfall 5: `motif` doesn't reach `DetailPhoto.global.vue`
**What goes wrong:** `DetailPhoto.global.vue` is an MDC inline component (`:detail-photo{src alt caption}`) that today receives only `src`/`alt`/`caption` — it has no `motif`, so its `@error` handler can't pick the SVG.
**Why it happens:** The detail photo is embedded inside a monument's `sections[].body` Markdown, rendered by `<MDC>`; the component is resolved globally and gets only the props written in the Markdown.
**How to avoid — recommended: `provide`/`inject`.** `MonumentCard` already knows `monument.motif`; have it `provide('monumentMotif', monument.motif)` (or provide the whole monument), and `DetailPhoto.global.vue` `inject('monumentMotif', undefined)`. This needs ZERO data changes and ZERO MDC-prop plumbing through the YAML.
  - Evidence it's clean: there is exactly one `<DetailPhoto>` per monument card, always nested under that card's `MonumentCard` (the detail photo lives in `sections[].body`). So a `provide` on `MonumentCard` reaches exactly the right `DetailPhoto`. `[VERIFIED: MonumentCard.vue:158-176 renders sections via MDCRenderer; DetailPhoto is the global component for :detail-photo{} inside those bodies — index.html:2479-2482]`
**Alternatives (rejected as heavier):**
  - *Add `motif=` to the MDC tag in the YAML* (`:detail-photo{... motif="church"}`) — touches every monument's content file, duplicates the `motif` already on the typed `Monument`, and risks divergence from `monument.motif`. Rejected.
  - *Slug lookup in `useTrip`* — `DetailPhoto` would have to know its host slug (it doesn't) and re-query. Over-engineered. Rejected.
**Warning signs:** detail fallback always hides the image (no motif found) instead of showing the SVG.

### Pitfall 6: Hydration warning from notes / fallback initial state
**What goes wrong:** A hydration mismatch console error appears, failing the parity spec's console gate.
**Why it happens:** Reading `localStorage` (notes) or deciding image-failed state during SSR/setup makes the server HTML differ from the first client render.
**How to avoid:** Keep SSR defaults: notes empty, image not-failed (the `<img>` is rendered, error fires only in the browser if the network fails). Read localStorage and set `failed` only in browser events/`onMounted`. The parity specs tolerate EXACTLY ONE known message (`/Hydration completed but contains mismatches/i` from `@nuxtjs/color-mode`) and fail on any other console error. `[VERIFIED: modes.spec.ts:25, 110-113; navigation.spec.ts:43, 200-204]`
**Warning signs:** any console error other than the known color-mode hydration message in the new parity spec.

## Code Examples

Verified patterns from the live source and existing repo files.

### Map init + tiles + offline heuristic (verbatim port target)
```js
// Source: index.html:6316-6341 — port into onMounted of LeafletMap.client.vue
let map; let tilesLoaded = 0; let tilesErrored = 0;
try {
  map = L.map('leaflet-map', { scrollWheelZoom: false }).setView([41.8989, 12.477], 14); // = trip.map.center/zoom
  const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 19,
  });
  tileLayer.on('tileload', () => { tilesLoaded++; });
  tileLayer.on('tileerror', () => {
    tilesErrored++;
    if (tilesErrored > 3 && tilesLoaded === 0) {                 // <- the exact heuristic (SC#1)
      document.getElementById('map-offline-banner')?.classList.add('show');
    }
  });
  tileLayer.addTo(map);
} catch (e) {
  console.error('Error inicializando mapa:', e);
  const mapEl = document.getElementById('leaflet-map');
  if (mapEl) mapEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:2rem;text-align:center;font-style:italic;color:var(--ink-soft)">No se ha podido cargar el mapa. Comprueba tu conexión.</div>';
}
```
> Recommendation: extract `tilesErrored > 3 && tilesLoaded === 0` into `app/utils/mapOffline.ts` as `isOffline(errored, loaded)` so it's unit-testable; the counters and `classList.add('show')` stay in the component. `[VERIFIED: index.html:6316-6341]`

### Markers + divIcon + popup (verbatim port target)
```js
// Source: index.html:6343-6374 — derive the marker list (38 monuments + Coliseo) then:
places.forEach(p => {
  let bgColor = '#8b3a3a';                     // card
  if (p.type === 'guided') bgColor = '#a07c4a';
  if (p.type === 'concert') bgColor = '#5a7a3a';
  const icon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:32px;height:32px;background:${bgColor};color:#fbf7f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-weight:600;font-size:.85rem;border:2px solid #fbf7f0;box-shadow:0 2px 8px rgba(0,0,0,.4);">${p.n}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16],
  });
  const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
  let popupHtml;
  if (p.type === 'guided') {
    popupHtml = `<strong>${p.name}</strong><br><em style="color:#a07c4a">${p.day}</em><br><span style="color:#5c534a;font-size:.85rem">Visita con guía humano</span>`;
  } else if (p.type === 'concert') {
    popupHtml = `<strong>${p.name}</strong><br><em style="color:#5a7a3a">${p.day}</em><br><a href="#${p.id}" style="color:#5a7a3a">Abrir ficha →</a>`; // NOTE: inline onclick DROPPED — F5 capture listener handles it
  } else {
    popupHtml = `<strong>${p.name}</strong><br><em style="color:#a07c4a">${p.day}</em><br><a href="#${p.id}" style="color:#8b3a3a">Abrir ficha →</a>`; // NOTE: inline onclick DROPPED
  }
  m.bindPopup(popupHtml);
});
const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]));
map.fitBounds(bounds.pad(0.1));
setTimeout(() => map.invalidateSize(), 300);
window.addEventListener('load', () => map.invalidateSize());
```
> The ONLY change from the original is dropping the `onclick="navigateToCard(...)"` attribute from the two anchors (the F5 capture listener replaces it). `p.id` = `monument.slug`; `p.n` = `monument.roman`; `p.name`/`p.day`/`p.type`/`p.lat`/`p.lng` map to the typed `Monument` fields + the Coliseo extra. `[VERIFIED: index.html:6343-6378, 6365, 6367]`

### Marker derivation (the pure util to build)
```ts
// app/utils/mapMarkers.ts (sketch) — pure, unit-tested. Mirrors the 39-pin `places` array.
import type { Monument, Trip } from '~~/shared/schemas'
export interface MapMarker { id: string; n: string; name: string; day: string; lat: number; lng: number; type: 'card' | 'guided' | 'concert' }
export function deriveMarkers(monById: Map<string, Monument>, extras: MapMarker[]): MapMarker[] {
  const fromMonuments = [...monById.values()].map(m => ({
    id: m.slug, n: m.roman, name: m.name, day: m.day, lat: m.coords.lat, lng: m.coords.lng, type: m.type,
  }))
  return [...fromMonuments, ...extras]   // 38 + 1 Coliseo = 39 (D-01)
}
```
> Planner decides the marker ORDER if it matters for `fitBounds` (it doesn't — bounds are order-independent) or for any deterministic test assertion. The original `places` array is in chronological order; `monById` insertion order follows `queryCollection('monument').all()` (filename order). Since `fitBounds`/markers don't depend on order and there's no z-ordering requirement in the original, derivation order is free. `[VERIFIED: index.html:6373 fitBounds is order-independent]`

### Hero `@error` → SVG (port of loadSvgFallback)
```js
// Source: index.html:2215-2227 (hero). Vue port = toggle a `failed` flag + v-html the motif SVG.
function loadSvgFallback(img, cardId) {
  try {
    const motif = CARD_TO_MOTIF[cardId];          // -> Nuxt: monument.motif (typed)
    if (motif && SVG_MOTIFS[motif]) { img.parentElement.innerHTML = SVG_MOTIFS[motif]; }
    else { img.parentElement.style.display = 'none'; }   // dead branch for monuments
  } catch (e) { img.parentElement.style.display = 'none'; }
}
```
### Detail `@error` → SVG (port of loadSvgFallbackDetail)
```js
// Source: index.html:2229-2252 (detail). Keep the four inline styles on the swapped SVG; keep the caption.
function loadSvgFallbackDetail(img, cardId) {
  try {
    const motif = CARD_TO_MOTIF[cardId];          // -> Nuxt: motif via provide/inject (Pitfall 5)
    if (motif && SVG_MOTIFS[motif]) {
      /* svg.style.width='100%'; height='auto'; borderRadius='4px'; display='block'; img.replaceWith(svg) */
    } else { img.style.display = 'none'; }
  } catch (e) { img.style.display = 'none'; }
}
```
### Notes (port of setupNotes)
```js
// Source: index.html:6471-6483. Key = 'roma-note-' + slug; read once; save on input.
function setupNotes() {
  document.querySelectorAll('.notes-textarea').forEach(ta => {
    const key = 'roma-note-' + ta.dataset.noteKey;            // dataset.noteKey = slug
    try { const saved = localStorage.getItem(key); if (saved) ta.value = saved; } catch (e) {}
    ta.addEventListener('input', () => { try { localStorage.setItem(key, ta.value); } catch (e) {} });
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline Leaflet CSS+JS in `<head>` (live `index.html`) | Self-host via Vite: `leaflet` bundled from `node_modules`, CSS already in `app/assets/css/leaflet.css` loaded globally | Phase 1 (scaffold) | The CSS question is settled — do NOT re-import the CSS in JS. |
| Global `navigateToCard` + inline `onclick` on popup anchors | `useCardNavigation()` capture-phase delegated listener; popups are plain `<a href="#slug">` | Phase 5 | Drop the inline `onclick`; rely on the listener. |
| `CARD_TO_MOTIF` JS map | Typed `monument.motif` (zod enum, obligatorio) | Phase 2 | Do NOT port `CARD_TO_MOTIF`; read `monument.motif`. |
| `places` array (39 pins) in JS | `monById` (38) + 1 explicit Coliseo extra in `trip.yml` | Phase 7 (this) | Derive markers; add the one extra field. |

**Deprecated/outdated:**
- `@vue-leaflet/vue-leaflet`: abandoned 2023-06-16; explicitly rejected (CLAUDE.md §4). Not used.
- `bindCardLinks` (DOM-scan, `index.html:6420-6429`): replaced by the F5 delegated listener; not ported.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `(await import('leaflet')).default` yields the `L` namespace (default export). `@types/leaflet` types the default export as the namespace. | §Pattern 1, Code Examples | LOW — if the build prefers `import * as L`, swap the access (`const L = await import('leaflet')` then use `L.map`). Trivial to adjust; verify at first `pnpm generate`/typecheck. The CONTEXT and CLAUDE.md both write `import L from 'leaflet'`, supporting the default-export shape. |
| A2 | `provide`/`inject` from `MonumentCard` to the nested global `DetailPhoto` resolves correctly through the `<MDC>`/`<MDCRenderer>` render tree. | §Pitfall 5 | MEDIUM — `provide`/`inject` follows the *component* tree, and MDCRenderer renders the detail-photo as a descendant of MonumentCard, so it should work; but MDC's internal wrapping is worth a quick render check. Fallback: pass `motif` as an MDC prop (heavier, but certain). The planner should add a tiny assertion that the detail SVG fallback shows the correct motif. |
| A3 | The `#map-offline-banner` element, rendered in TripView's static `.map-wrapper` markup, is reachable by `document.getElementById('map-offline-banner')` from the client island. | §Pattern 1-2, Code Examples | LOW — `getElementById` is document-global; as long as the banner is in the DOM (it is, in `.map-wrapper`), it's reachable regardless of component boundaries. Verified by the original's own cross-scope `getElementById` usage. |

**Note:** All version/path/line-number claims are `[VERIFIED]` against files read this session. The three assumptions above are implementation-shape details the planner can confirm cheaply during execution; none changes the phase's scope or decisions.

## Open Questions

1. **Marker render order for any deterministic spec assertion**
   - What we know: `fitBounds` and marker placement are order-independent; the original `places` array is chronological; `monById` is filename-ordered.
   - What's unclear: whether any parity assertion needs a specific marker DOM order (the original has no z-ordering or ordered-list semantics for markers).
   - Recommendation: don't assert on marker order; assert on marker COUNT (39) and on presence of specific markers (e.g., a `★` Coliseo marker, a `♪` Auditorium marker). Order is free.

2. **Where the static map chrome lives (TripView vs the island)**
   - What we know: eyebrow/h2/intro/`.map-wrapper`/banner/legend are static (`index.html:2361-2371`); only `#leaflet-map` must be client-only.
   - What's unclear: whether to render `#leaflet-map` inside the island component AND in the `#fallback`, or render the chrome in TripView and only the bare `#leaflet-map` div in the island.
   - Recommendation: render the static chrome (eyebrow/h2/intro/wrapper/banner/legend) in TripView verbatim; put only `#leaflet-map` inside `<ClientOnly>` (default slot = the island that builds the map; `#fallback` = an empty same-size `#leaflet-map` div). This keeps the prerendered HTML maximally close to the golden and the banner statically present.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `leaflet` (npm) | Map island | ✓ | 1.9.4 | — |
| `@types/leaflet` (npm) | TS types for `L` | ✓ | 1.9.21 | — |
| `pnpm` | build/test commands | ✓ | 10.32.1 (packageManager) | — |
| `@playwright/test` + chromium | parity spec | ✓ | 1.61.0 | — |
| `vitest` | unit specs | ✓ | 4.1.9 | — |
| `serve` (via `pnpm dlx`) | self-contained parity harness | ✓ (used by existing specs) | — | — |
| OSM tile network | live tile rendering | ✗ at test time (deliberately aborted) | — | the offline-banner heuristic IS the fallback; spec forces it via `page.route().abort()` |

**Missing dependencies with no fallback:** none — every build/test dependency is present.
**Missing dependencies with fallback:** OSM tiles are intentionally unavailable in the parity spec (aborted) to test the offline banner; this is by design, not a gap.

## Validation Architecture

> nyquist_validation is enabled (no `workflow.nyquist_validation: false` found in `.planning/config.json`).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright `@playwright/test@1.61.0` (parity/behavioral) + Vitest `4.1.9` (pure logic) |
| Config file | `playwright.config.ts` (golden harness; new spec is SELF-CONTAINED and does NOT use its `webServer`) ; `vitest.config.ts` (`include: tests/unit/**`, `tests/data/**`) |
| Quick run command | `pnpm test:unit` (Vitest, < 5s) |
| Full suite command | `pnpm generate && pnpm test:golden` (Playwright; the new spec builds once and serves under `/guiaRoma/`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-02 | Marker list = 39 (38 monuments + Coliseo); includes `★` Coliseo & `♪` Auditorium; color/popup-type per place | unit | `pnpm vitest run tests/unit/mapMarkers.spec.ts` | ❌ Wave 0 |
| FEAT-02 | Offline predicate truth table (`>3 errored & 0 loaded` ⇒ true; else false) | unit | `pnpm vitest run tests/unit/mapOffline.spec.ts` | ❌ Wave 0 |
| FEAT-02 | `nuxt generate` emits NO `window is not defined`; `.output/public/index.html` exists | build/parity | `pnpm generate` (asserted in spec `beforeAll`) | ✅ (ensureBuild pattern) / spec ❌ Wave 0 |
| FEAT-02 | Map renders client-side (a `.leaflet-container` / 39 `.custom-marker` icons appear); SSG `#fallback` is an empty `#leaflet-map` | parity | `pnpm test:golden` → `map-fallback-notes.spec.ts` | ❌ Wave 0 |
| FEAT-02 | Popup "Abrir ficha →" navigates (scroll+`.highlight`, hash UNCHANGED) via F5 capture listener | parity | same spec | ❌ Wave 0 |
| FEAT-02 | Offline banner shows when tiles are aborted (`tileerror` × >3, 0 loaded) | parity | same spec (forces `page.route('**/tile.openstreetmap.org/**').abort()`) | ❌ Wave 0 |
| FEAT-02 | `guided` popup (Coliseo / vaticano) is text-only, NO anchor | parity | same spec | ❌ Wave 0 |
| UI-05 | 19 `SVG_MOTIFS` keys present; `motifSvg(motif)` returns the SVG string / undefined for unknown | unit | `pnpm vitest run tests/unit/svgMotifs.spec.ts` | ❌ Wave 0 |
| UI-05 | Hero `@error` → `.card-hero` shows an inline `<svg>` (img aborted) | parity | same spec (forces image abort for a hero src) | ❌ Wave 0 |
| UI-05 | Detail `@error` → `.detail-photo` shows `<svg>` AND keeps `.detail-photo-caption` | parity | same spec | ❌ Wave 0 |
| FEAT-04 | Note saved under `roma-note-<slug>` persists across reload; read in onMounted (no hydration error) | parity | same spec (preset via `addInitScript(localStorage.setItem)`, like modes.spec) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test:unit` + `pnpm typecheck` + `pnpm lint` (fast; covers the pure utils).
- **Per wave merge:** `pnpm generate && pnpm test:golden` (the self-contained parity spec; first run builds).
- **Phase gate:** Full suite green before `/gsd:verify-work`. Console gate tolerates ONLY the known `@nuxtjs/color-mode` hydration message (`/Hydration completed but contains mismatches/i`) and fails on any other console error.

### Wave 0 Gaps
- [ ] `tests/unit/mapMarkers.spec.ts` — covers FEAT-02 derivation (load real `trip.yml` + `monuments/*.yml` with `node:fs`+`yaml`, mirror the consumer chain; pattern from `dayRoute.spec.ts:1-64`).
- [ ] `tests/unit/mapOffline.spec.ts` — covers FEAT-02 offline predicate.
- [ ] `tests/unit/svgMotifs.spec.ts` — covers UI-05 SVG lookup (19 keys; mirror `monument.motif` enum from `shared/schemas.ts:31-35`).
- [ ] `tests/parity/map-fallback-notes.spec.ts` — covers all behavioral criteria; clone the self-contained harness from `modes.spec.ts`/`navigation.spec.ts` (base port e.g. 5760 to avoid collision with 5700/5720/5740). Key techniques:
  - **Force offline banner:** `await context.route('**/*.tile.openstreetmap.org/**', r => r.abort())` (or `page.route` before `goto`) — precedent A5 (golden aborts all images). Then assert `.map-offline-banner.show` becomes visible after >3 tile errors. `[VERIFIED: STATE.md A5 decision; modes.spec.ts addInitScript pattern]`
  - **Force image fallback:** `await context.route(...hero-or-detail src..., r => r.abort())` then assert `.card-hero svg` / `.detail-photo svg` present and `.detail-photo-caption` still present. (A5 already aborts all image requests for the golden, proving the abort approach works for these very images.)
  - **Popup navigation:** open a popup (`page.locator('.custom-marker').first().click()` then click the popup `a[href^="#"]`), assert the target ficha gets `.highlight` and `location.hash` did NOT change to `#slug` (mirror `navigation.spec.ts:193-196, 318-320`). Use a `card`-type marker with a known slug (e.g. a monument present in `monById`).
  - **Notes persistence:** `addInitScript(() => localStorage.setItem('roma-note-galleria-sciarra','probe'))`, reload, assert the textarea `:value` reads `probe`; then type into a fresh card's textarea, reload, assert it persisted under `roma-note-<that-slug>` (mirror `modes.spec.ts:223-239` preset pattern).
  - **Framework install:** none — Playwright + Vitest already configured.

*(Note: marker-derivation, offline-predicate, and SVG-lookup are the genuinely pure pieces — extract them to `app/utils/*` so Vitest covers them without a browser, exactly as `pace.ts`/`cardNav.ts`/`searchIndex.ts` do.)*

## Security Domain

> `security_enforcement` not found as `false` in config; included for completeness. This phase is a static, no-backend, no-auth client app.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in 1.0 (Nitro dormant). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | Public static site. |
| V5 Input Validation / Output Encoding | yes | Popup `name`/`day` are interpolated into `bindPopup` HTML strings — they come from TRUSTED typed data (`trip.yml`, zod-validated), not user input, so XSS risk is nil; still, prefer `{{ }}`/text where the popup were a Vue template (it isn't — Leaflet popups take an HTML string). The SVG fallback uses `v-html` of a TRUSTED static constant (never user input). Notes are stored/echoed only into the user's own `value` (textarea `:value`), never `v-html` — no stored-XSS surface. |
| V6 Cryptography | no | No secrets, no crypto. |

### Known Threat Patterns for {Leaflet popup HTML + v-html SVG + localStorage}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via notes (`localStorage` → DOM) | Tampering / Elevation | Notes are written back ONLY to the textarea `value` (not `v-html`, not `innerHTML`); no reflection into HTML. Safe by construction. |
| HTML injection via popup name | Tampering | `name`/`day` come from zod-validated `trip.yml` (trusted authoring), not user input; identical trust model to the live site. Add the `eslint-disable vue/no-v-html` ONLY on the SVG-fallback line (trusted constant), never on data fields. |
| Tabnabbing on external links | — | Not in scope here (the Maps link with `rel="noopener"` is F4); popup ficha links are in-page anchors. |

## Sources

### Primary (HIGH confidence)
- `/home/vcompanyb/guiaRoma/index.html` — the FUENTE DE VERDAD. Read: `SVG_MOTIFS`/`CARD_TO_MOTIF`/`loadSvgFallback`/`loadSvgFallbackDetail` (2211-2252); map markup (2361-2371); hero/detail markup (2459/2479-2482); notes shell (2506-2509); `places` array (6269-6314, Coliseo 6292); map init/tiles/offline (6316-6341); markers/popups/fitBounds (6343-6378); `navigateToCard` (6390-6401); `setupNotes` (6471-6483).
- `/home/vcompanyb/guiaRoma/app/composables/useCardNavigation.ts` — the F5 capture-phase delegated listener (137-145, 159-168) — the landmine resolution.
- `/home/vcompanyb/guiaRoma/app/components/SearchBox.vue` — CR-01 (data-card-no-href) — the INVERSE case proving the popup should use a plain anchor (26-35, 62-64).
- `/home/vcompanyb/guiaRoma/app/components/MonumentCard.vue` — hero `<img>` shell (150-156), notes-textarea shell (229-237), MDC section render (158-176).
- `/home/vcompanyb/guiaRoma/app/components/DetailPhoto.global.vue` — detail `<img>` shell + props (25, 28-42); the motif-plumbing target.
- `/home/vcompanyb/guiaRoma/app/components/TripView.vue` — empty `<section id="mapa" />` (75); single `useCardNavigationController()` host (59).
- `/home/vcompanyb/guiaRoma/shared/schemas.ts` — `Motif` enum (31-35), `PlaceType` (37), `MonumentSchema` (46-65), `TripSchema.map` (330), `TripSchema` (321-339).
- `/home/vcompanyb/guiaRoma/content/trips/roma/trip.yml` — `map.center/zoom` (37-39); extension point for the Coliseo extra.
- `/home/vcompanyb/guiaRoma/nuxt.config.ts` — leaflet.css in global `css` array; colorMode/nitro/prerender config.
- `/home/vcompanyb/guiaRoma/app/assets/css/base.css` — `#leaflet-map` (1178, 520px), `.map-offline-banner` (1189-1209), `.card-hero` + `.card-hero svg,img` (709-735), `.detail-photo`/`img`/`caption` (820-844).
- `/home/vcompanyb/guiaRoma/app/assets/css/leaflet.css` — 849 lines = full Leaflet 1.9.4 stylesheet (head byte-identical to node_modules dist).
- `/home/vcompanyb/guiaRoma/tests/parity/modes.spec.ts` + `navigation.spec.ts` — the self-contained harness + console-gate + localStorage-preset + dispatchEvent navigation patterns to mirror.
- `/home/vcompanyb/guiaRoma/tests/unit/dayRoute.spec.ts` — the load-real-YAML-in-Vitest pure-logic pattern (1-64).
- `/home/vcompanyb/guiaRoma/package.json` — leaflet 1.9.4 + @types/leaflet 1.9.21 already present.
- `node_modules/leaflet/dist/leaflet-src.js` (1.9.4) — popup pane DOM placement (`_initPanes` 4239-4275: `mapPane` in `_container` 4255, `popupPane` 4275) — proves the capture listener sees popup clicks.
- `CLAUDE.md` §4 (raw Leaflet in client-only), §5 (CSS verbatim), §9 (PWA = v2).

### Secondary (MEDIUM confidence)
- [forum.vuejs.org — window not defined error on Nuxt + Leaflet](https://forum.vuejs.org/t/window-not-defined-error-on-my-nuxt-js-app-using-leaflet/112209) — confirms `<ClientOnly>` + dynamic import in `onMounted` as the standard fix.
- [codingeasypeasy.com — When to Use `<ClientOnly>` in Nuxt 3](https://www.codingeasypeasy.com/blog/when-to-use-lessclientonlygreater-component-in-nuxt-3-a-comprehensive-guide) — `<ClientOnly>` scoping guidance (isolate only the client-required component).

### Tertiary (LOW confidence)
- None — every load-bearing claim was verified against repo files or official Leaflet source this session.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — both packages already installed and version-verified; no new surface.
- Architecture (island/ClientOnly/dynamic-import): HIGH — established repo pattern + official guidance; only A1 (default-export shape) is a trivial implementation detail.
- Popup-navigation resolution: HIGH — verified Leaflet popup DOM placement + the F5 capture listener + the existing `navigation.spec.ts` precedent.
- Image fallback / motif plumbing: MEDIUM-HIGH — Vue `@error`+`v-html` is straightforward; the `provide`/`inject` to the MDC-rendered DetailPhoto is the one shape to confirm at execution (A2).
- Notes: HIGH — direct port of `setupNotes` into the established `onMounted` pattern; key scheme verified identical.
- Pitfalls / Validation: HIGH — each pitfall is grounded in a verified file/line; the test harness is a clone of three already-green specs.

**Research date:** 2026-06-23
**Valid until:** 2026-07-23 (stable stack; Leaflet 1.9.4 unchanged since 2024, Nuxt 4 patch-level only)

## RESEARCH COMPLETE

**Phase:** 7 - Isla client-only — mapa, fallback de imagen y notas
**Confidence:** HIGH

### Key Findings
- **No new packages.** `leaflet@1.9.4` + `@types/leaflet@1.9.21` are already installed, and the full Leaflet 1.9.4 CSS is already self-hosted (`app/assets/css/leaflet.css`) and loaded globally — so **do NOT re-import the CSS in JS**, and the "top-level CSS import breaks generate" question is moot.
- **Popup landmine RESOLVED with evidence:** Leaflet popups attach to `popupPane` inside the map container (inside `document`); the F5 `document` CAPTURE listener therefore sees popup clicks. Render popups as a **plain `<a href="#slug">` with NO handler** (drop the original inline `onclick`) — the F5 listener intercepts it exactly as it already does for `a.tl-title` (proven by `navigation.spec.ts`). This is the INVERSE of SearchBox CR-01 (which needed `data-card` precisely because it had a secondary bubble action). Adding `@click` here would reproduce CR-01.
- **`motif` → DetailPhoto:** recommend `provide`/`inject` from MonumentCard (one DetailPhoto per card, nested under it) — zero data/MDC-prop changes. (A2: confirm the inject resolves through MDCRenderer at execution.)
- **All three pieces have an established repo precedent** (`.client.vue`/ClientOnly/onMounted island shape; localStorage-in-onMounted; pure-util + Vitest; self-contained Playwright spec). The phase is a port, not a design.
- **Validation is concrete:** 3 pure-logic Vitest specs (marker derivation = 39 incl. Coliseo, offline predicate, SVG lookup) + 1 self-contained Playwright spec that forces `tileerror` (abort tile requests) and image `@error` (abort image requests) via `page.route().abort()` — A5 precedent proves both aborts work.

### File Created
`/home/vcompanyb/guiaRoma/.planning/phases/07-isla-client-only-mapa-fallback-de-imagen-y-notas/07-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | Both packages installed + version-verified; CSS already global. |
| Architecture | HIGH | Established repo pattern + official guidance; A1 trivial. |
| Popup navigation | HIGH | Leaflet popup DOM placement + F5 listener + existing spec precedent all verified. |
| Image fallback | MEDIUM-HIGH | `@error`+`v-html` clear; `provide`/`inject` to MDC DetailPhoto is the one execution-time check (A2). |
| Notes | HIGH | Direct port; key scheme verified identical. |
| Pitfalls/Validation | HIGH | Each grounded in a verified file/line; harness clones three green specs. |

### Open Questions
- Marker render order is free (fitBounds/markers are order-independent) — assert on COUNT/presence, not order.
- Static map chrome placement (TripView vs island): recommend chrome in TripView, only `#leaflet-map` in `<ClientOnly>`.
- A2 (provide/inject through MDCRenderer) — confirm with a tiny assertion during execution; fallback is an MDC prop.

### Ready for Planning
Research complete. The planner can write airtight tasks: 1 `.client.vue` + TripView wiring; hero/detail `@error` in MonumentCard/DetailPhoto; notes persistence in MonumentCard; one schema field + one YAML datum for the Coliseo; 3 Vitest unit specs + 1 self-contained Playwright parity spec.
