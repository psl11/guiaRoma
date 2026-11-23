# Phase 07: Isla client-only — mapa, fallback de imagen y notas - Pattern Map

**Mapped:** 2026-06-23
**Files analyzed:** 12 (5 new, 5 modified, 2 new test files counted in new) — 6 new + 6 modified
**Analogs found:** 12 / 12 (all have a strong in-repo precedent; `LeafletMap.client.vue` has no `.client.vue` precedent but a clear controller/onMounted-island precedent)

> **This is a PORT phase, not a design phase.** The source of truth for behavior is `index.html` (cited with verified line numbers below). The source of truth for *shape* (how a Nuxt file of each kind is written in THIS repo) is the analog files below. The planner copies BOTH: behavior from `index.html`, structure from the analog. CSS is verbatim/global — **no `<style scoped>` in any file** (a `data-v-*` would break global `.leaflet-*` / `.card-hero` / `.detail-photo` / `.notes-*` selectors and the DOM Leaflet generates at runtime).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/components/LeafletMap.client.vue` (NEW) | component (client-only island) | event-driven (DOM lib init + tile/popup events) | `app/composables/useCardNavigation.ts` (`useCardNavigationController`, the onMounted+dynamic-data island shape) + `app/components/SearchBox.vue` (component hosting a controller once) | role-match (no prior `.client.vue`; island pattern is exact) |
| `app/utils/mapMarkers.ts` (NEW) | utility (pure) | transform (typed data → marker list) | `app/utils/searchIndex.ts` (`createSearchIndex(monuments)`) + `app/utils/cardNav.ts` | exact |
| `app/utils/mapOffline.ts` (NEW) | utility (pure) | transform (predicate over counters) | `app/utils/pace.ts` (`isVisible` boolean predicate) | exact |
| `app/utils/svgMotifs.ts` (NEW) | utility (data + lookup) | transform (motif key → SVG string) | `app/utils/pace.ts` / `app/utils/cardNav.ts` (pure exported fn + typed input) | role-match |
| `app/components/TripView.vue` (MODIFY) | component (page owner) | request-response (renders sections) | itself + the `<ClientOnly>` sketch in RESEARCH §Pattern 1 | n/a (in-place edit) |
| `app/components/MonumentCard.vue` (MODIFY) | component | event-driven (`@error`, `@input` → localStorage) | `app/components/SearchBox.vue` (`:value`/`@input` + onMounted localStorage discipline via `useTripModes`) | exact |
| `app/components/DetailPhoto.global.vue` (MODIFY) | component (MDC global) | event-driven (`@error` → SVG) | `MonumentCard.vue` hero `@error` (same phase) + `provide`/`inject` | role-match |
| `shared/schemas.ts` (MODIFY) | model (zod schema) | n/a (validation) | `TripSchema` `map`/`sections` fields (`:330`, `:334`) + `PlaceType`/`Coords` reuse | exact |
| `content/trips/roma/trip.yml` (MODIFY) | data (YAML) | n/a (content) | itself (`map:` block `:37-39`) | n/a (in-place edit) |
| `tests/unit/mapMarkers.spec.ts` (NEW) | test (unit) | n/a | `tests/unit/dayRoute.spec.ts` (load real YAML in Vitest) | exact |
| `tests/unit/mapOffline.spec.ts` (NEW) | test (unit) | n/a | `tests/unit/pace.spec.ts` (truth-table over a pure predicate) | exact |
| `tests/unit/svgMotifs.spec.ts` (NEW) | test (unit) | n/a | `tests/unit/pace.spec.ts` / `tests/unit/cardNavigation.spec.ts` | exact |
| `tests/parity/map-fallback-notes.spec.ts` (NEW) | test (parity/E2E) | n/a | `tests/parity/modes.spec.ts` (self-contained harness) + `tests/parity/navigation.spec.ts` (popup-nav assertions) | exact |

---

## Pattern Assignments

### `app/components/LeafletMap.client.vue` (NEW — component, client-only island)

**Behavior source (port 1:1):** `index.html` map init `6316-6341`, markers/popups/fitBounds `6343-6378`, Coliseo extra datum `6292`.
**Structure analog:** `app/composables/useCardNavigation.ts` lines 122-178 (`useCardNavigationController` — the canonical "register effects in `onMounted`, then `await useTrip('roma')`" island) and `app/components/SearchBox.vue` lines 40-52 (a component that owns a control and invokes its controller exactly once at top-level setup).

There is **no existing `.client.vue` file** (`DetailPhoto.global.vue` is the only specially-suffixed component). This is the first. The `.client` suffix is the primary anti-`window is not defined` guard; the `<ClientOnly>` wrapper (in TripView, below) is the second; the dynamic `import('leaflet')` inside `onMounted` is the third.

**onMounted + dynamic-data island shape to copy** (`useCardNavigation.ts:159-177`) — note hooks register SYNCHRONOUSLY before any `await`, then data is awaited; this exact ordering is load-bearing (Plan 05-03 A1 bug):
```ts
// app/composables/useCardNavigation.ts:159-177
onMounted(() => {
  document.addEventListener('click', onDelegatedClick, true)
  window.addEventListener('scroll', updateActivePill, { passive: true })
  updateActivePill()
})
onUnmounted(() => {
  document.removeEventListener('click', onDelegatedClick, true)
  window.removeEventListener('scroll', updateActivePill)
})
const { monById } = await useTrip('roma')
monByIdRef.value = monById.value
watch(monById, v => (monByIdRef.value = v))
```

For the island, the Leaflet `import` is itself inside the `onMounted` callback (it can be `async`), so the dynamic import never runs in prerender. Data (`trip.map`, `monById`) comes from `await useTrip('roma')` exactly as every other consumer does (`useCardNavigation.ts:173`, `useSearch.ts:144`).

**Map init + tiles + offline heuristic — VERBATIM port target** (`index.html:6316-6341`); extract the predicate to `mapOffline.ts`, keep counters + `classList.add('show')` in the component:
```js
// index.html:6321-6333
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
// try/catch fallback text "No se ha podido cargar el mapa…" at 6335-6340
```

**Markers + divIcon + popups — VERBATIM port target** (`index.html:6343-6378`). The ONLY change is **dropping** the inline `onclick="navigateToCard('id', event)"` on the two anchors (the F5 capture listener replaces it):
```js
// index.html:6347-6369 — colors by type, popup HTML by type
let bgColor = '#8b3a3a';                       // card
if (p.type === 'guided')  bgColor = '#a07c4a';
if (p.type === 'concert') bgColor = '#5a7a3a';
// divIcon: 32×32 circle, Cormorant Garamond, white border, the roman `p.n` (html string)
// popup:
//   guided  → `<strong>${name}</strong><br><em style="color:#a07c4a">${day}</em><br><span style="color:#5c534a;font-size:.85rem">Visita con guía humano</span>`   (TEXT ONLY, no anchor)
//   concert → `…<a href="#${id}" style="color:#5a7a3a">Abrir ficha →</a>`   (inline onclick DROPPED)
//   card    → `…<a href="#${id}" style="color:#8b3a3a">Abrir ficha →</a>`   (inline onclick DROPPED)
// fitBounds(L.latLngBounds(coords).pad(0.1));  setTimeout(invalidateSize,300); window 'load' → invalidateSize
```

**Popup navigation — THE LANDMINE (resolved, see Shared Patterns §Ficha Navigation):** render `card`/`concert` popups as a **plain `<a href="#slug">` with NO `@click`/`onclick`**. The F5 capture listener (`useCardNavigation.ts:137-145`) intercepts it exactly as it does the timeline `a.tl-title` anchors. Adding a bubble handler reproduces the F6 CR-01 bug.

**CSS import:** do **NOT** add `import 'leaflet/dist/leaflet.css'` — it is already self-hosted at `app/assets/css/leaflet.css` and loaded globally by `nuxt.config.ts`.

---

### `app/utils/mapMarkers.ts` (NEW — pure utility, transform)

**Analog:** `app/utils/searchIndex.ts` (lines 41-107: `import type { Monument }`, a pure factory `createSearchIndex(monuments)` over typed data) and `app/utils/cardNav.ts` (small exported pure fns, type exports). Same "pure logic in `app/utils/`, auto-imported by Nuxt, tested in plain Vitest" pattern as `pace.ts`/`dayRoute.ts`/`tripIndexes.ts`.

**Imports pattern** (`searchIndex.ts:42`):
```ts
import type { Monument, Trip } from '~~/shared/schemas'
```

**Core derivation** — mirror the 39-pin `places` array (38 monuments via `monById` + the 1 Coliseo extra). RESEARCH §Code-Examples sketch:
```ts
// app/utils/mapMarkers.ts (sketch — pure, unit-tested)
export interface MapMarker { id: string; n: string; name: string; day: string; lat: number; lng: number; type: 'card' | 'guided' | 'concert' }
export function deriveMarkers(monById: Map<string, Monument>, extras: MapMarker[]): MapMarker[] {
  const fromMonuments = [...monById.values()].map(m => ({
    id: m.slug, n: m.roman, name: m.name, day: m.day, lat: m.coords.lat, lng: m.coords.lng, type: m.type,
  }))
  return [...fromMonuments, ...extras]   // 38 + 1 Coliseo = 39 (D-01)
}
```
> The header-comment + `?? []` guard conventions for optional arrays come from `searchIndex.ts:51-60` and `tripIndexes.ts`. Marker ORDER is free (fitBounds/markers are order-independent — RESEARCH Open Q 1); assert on COUNT (39) and presence (`★` Coliseo, `♪` auditorium), not order.

---

### `app/utils/mapOffline.ts` (NEW — pure utility, predicate)

**Analog:** `app/utils/pace.ts` (the whole file, 1-37) — a pure boolean predicate ported verbatim from `index.html`, with a header comment explaining the load-bearing logic and a Vitest truth-table.

**Shape to copy** (`pace.ts:32-37`):
```ts
export function isVisible(itemPace: ItemPace, pace: Pace): boolean {
  if (pace === 'optimistic') return true
  if (pace === 'neutral') return itemPace !== 'slow-only'
  return itemPace === 'all'
}
```

**Behavior to port** (`index.html:6330-6331`) — the exact heuristic, SC#1:
```ts
// app/utils/mapOffline.ts
export function isOffline(errored: number, loaded: number): boolean {
  return errored > 3 && loaded === 0   // index.html:6330 — `tilesErrored > 3 && tilesLoaded === 0`
}
```

---

### `app/utils/svgMotifs.ts` (NEW — utility, data + lookup)

**Analog:** `app/utils/pace.ts` (pure exported fn + a typed `Motif` input) and the `Motif` enum in `shared/schemas.ts:31-35` (the lookup's key domain — 19 motifs, **must match exactly**).

**Behavior source:** `SVG_MOTIFS` object (`index.html:2212`, 19 SVG strings) ported **VERBATIM**. **`CARD_TO_MOTIF` (`index.html:2213`) is NOT ported** — it is replaced by the typed `monument.motif` (F2). The 19 keys are: `dome, pantheon, arch, fountain, obelisk, statue, painting, church, fortress, temple, garden, keyhole, mask, monument, rooftops, library, tower, stairs, coffee` (verified against `schemas.ts:31-35` Motif enum AND `index.html:2212`).

**Lookup shape:**
```ts
// app/utils/svgMotifs.ts
import type { Motif } from '~~/shared/schemas'
export const SVG_MOTIFS: Record<string, string> = { /* 19 strings, verbatim from index.html:2212 */ }
export function motifSvg(motif: Motif | undefined): string | undefined {
  return motif ? SVG_MOTIFS[motif] : undefined
}
```
> The SVG strings contain `"` — copy them verbatim (the source uses escaped `\"` inside a JS string literal; in a TS module a single-quoted or template literal avoids the escaping). The unit test asserts all 19 keys present and `motifSvg` returns a string for a known motif / `undefined` for an unknown one.

---

### `app/components/TripView.vue` (MODIFY — fill the empty `#mapa`)

**Current state:** `<section id="mapa" />` is EMPTY at line **75** (between `<TheHero>` at :71-74 and `<section id="viernes">` at :76). TripView already invokes `await useCardNavigationController()` ONCE (line **59**) — this is the single host of the F5 navigation listener that the map popups rely on; **do not add a second controller call**.

**What to add** (RESEARCH §Pattern 1 + Open Q 2): render the static map chrome (eyebrow/h2/intro/`.map-wrapper`/`.map-offline-banner`/legend — verbatim `index.html:2361-2371`) directly in TripView, and wrap **only** `#leaflet-map` in `<ClientOnly>` with a same-size `#fallback` (D-02 — empty box, no "loading" text):
```vue
<section id="mapa">
  <div class="container">
    <div class="section-eyebrow">cartografia</div>
    <h2>El mapa del viaje</h2>
    <p style="…">Numeración por orden cronológico de visita. Toca un marcador para abrir su ficha.</p>
    <div class="map-wrapper" style="position:relative;">
      <ClientOnly>
        <LeafletMap />
        <template #fallback>
          <div id="leaflet-map" />   <!-- same-size empty box (D-02), no text -->
        </template>
      </ClientOnly>
      <div class="map-offline-banner" id="map-offline-banner">Sin conexión · solo marcadores visibles</div>
    </div>
    <p class="map-legend">✦  Rojos · paradas con ficha · Dorados · eventos guiados · Verde · concierto Einaudi ✦</p>
  </div>
</section>
```
> `#map-offline-banner` is reachable by `document.getElementById` from the island regardless of component boundary (RESEARCH A3). Follow TripView's own conventions: NO `<style scoped>`, NO route links, components auto-imported. The exact `index.html:2361-2371` markup is the verbatim source for the chrome text/classes.

---

### `app/components/MonumentCard.vue` (MODIFY — hero `@error` + notes persistence)

**Analog:** `app/components/SearchBox.vue` (the `:value`/`@input` binding at :62-64, and the project's "read localStorage in `onMounted`, never in setup" discipline from `useTripModes.ts:88-104`). This is the same component being extended; preserve its conventions (NO `<style scoped>`, header comment style).

**Current shells to wire:**
- Hero `<img>` PLAIN at lines **150-156** (D-01 frontier of F4):
  ```vue
  <div class="card-hero">
    <img :src="monument.hero.src" :alt="monument.hero.alt" loading="lazy">
  </div>
  ```
- Notes textarea shell at lines **229-237** (`:data-note-key="monument.slug"` already present):
  ```vue
  <div class="notes-area">
    <label :for="'note-' + monument.slug">Notas in situ</label>
    <textarea :id="'note-' + monument.slug" class="notes-textarea" :data-note-key="monument.slug" placeholder="Lo que quieras recordar de aquí…" />
  </div>
  ```

**Hero `@error` → SVG** (port of `index.html:2215-2227` `loadSvgFallback`). Recommended Vue shape = toggle a `failed` flag + `v-html` the trusted static SVG (idiomatic; identical DOM). The hero SVG needs **NO inline styles** (`.card-hero svg, .card-hero img { width:100%;height:100%;object-fit:cover }` already sizes it):
```vue
<div class="card-hero" v-show="!heroHidden">
  <img v-if="!heroFailed" :src="monument.hero.src" :alt="monument.hero.alt" loading="lazy" @error="onHeroError">
  <!-- eslint-disable-next-line vue/no-v-html — TRUSTED static constant (svgMotifs.ts), never user input -->
  <span v-else v-html="motifSvg(monument.motif)" />
</div>
```
```ts
const heroFailed = ref(false)
const heroHidden = ref(false)   // dead branch for monuments (motif always present), ported for fidelity
function onHeroError() {
  if (motifSvg(monument.motif)) heroFailed.value = true
  else heroHidden.value = true  // mirrors img.parentElement.style.display='none' (index.html:2222)
}
```

**Notes persistence** (port of `index.html:6472-6483` `setupNotes`; key `roma-note-<slug>` exact). Use `:value`/`@input` (NOT `v-model`) so the SSR default is empty and the `onMounted` read fills it one frame later (sanctioned micro-flash, same precedent as `useTripModes.ts:88-97`):
```vue
<textarea … :value="noteText" @input="onNoteInput(($event.target as HTMLTextAreaElement).value)" />
```
```ts
const noteText = ref('')
const KEY = `roma-note-${monument.slug}`           // exact key (index.html:6474)
onMounted(() => { try { noteText.value = localStorage.getItem(KEY) ?? '' } catch {} })  // read in onMounted (no hydration warning)
let t: ReturnType<typeof setTimeout> | undefined
function onNoteInput(v: string) {
  noteText.value = v
  clearTimeout(t)
  t = setTimeout(() => { try { localStorage.setItem(KEY, v) } catch {} }, 200)  // innocuous debounce (D-03 allows)
}
```
> `MonumentCard.vue` uses `defineProps<{ monument: Monument }>()` (line 75) — `monument` is directly in scope (no `props.` prefix in this file's style). `motifSvg` is auto-imported from `app/utils/svgMotifs.ts`.

**`provide` the motif for the nested DetailPhoto** (see next file): add `provide('monumentMotif', monument.motif)` in MonumentCard's setup. There is exactly one `<DetailPhoto>` per card, nested under it via MDCRenderer (`MonumentCard.vue:158-176`), so the provide reaches the right one.

---

### `app/components/DetailPhoto.global.vue` (MODIFY — detail `@error` + receive motif)

**Analog:** the hero `@error` pattern above (same `failed`-flag + `v-html` shape) and the `provide`/`inject` Vue API. This is the repo's only `.global.vue` (the suffix is the MDC-resolution mechanism — see its header :5-10).

**Current state:** receives ONLY `src`/`alt`/`caption` (`defineProps` at line **25**); plain `<img>` at lines **30-34** (D-01 frontier). No motif today.

**Get the motif via `inject`** (RESEARCH §Pitfall 5 recommended; A2 — confirm it resolves through MDCRenderer with a spec assertion):
```ts
defineProps<{ src: string, alt: string, caption: string }>()
const motif = inject<Motif | undefined>('monumentMotif', undefined)   // provided by the host MonumentCard
```

**Detail `@error` → SVG** (port of `index.html:2229-2252` `loadSvgFallbackDetail`). Replace ONLY the `<img>` with the SVG, **keep `.detail-photo-caption`**, and apply the **four inline styles verbatim** (`width:100%`/`height:auto`/`border-radius:4px`/`display:block`) — `.detail-photo img` CSS targets the `img`, not the swapped-in `svg`, so the inline styles matter here (unlike hero):
```vue
<div class="detail-photo">
  <img v-if="!failed" :src="src" :alt="alt" loading="lazy" @error="onError">
  <!-- eslint-disable-next-line vue/no-v-html — TRUSTED static constant (svgMotifs.ts) -->
  <span v-else v-html="detailSvg" />
  <div class="detail-photo-caption"><MDC :value="caption" unwrap="p" /></div>
</div>
```
> Behavior verbatim: `index.html:2238-2241` sets exactly those four `svg.style.*` properties before `img.replaceWith(svg)`; if no svg → `img.style.display='none'` (`:2244/2247`). Implement the inline styles either by inlining them into the SVG string or via a wrapper `<span style="…">`. NO `<style scoped>`.

---

### `shared/schemas.ts` (MODIFY — add the Coliseo extra-marker field to TripSchema)

**Analog:** the existing `TripSchema.map` field (`:330`: `map: z.object({ center: Coords, zoom: z.number() })`) and `sections` (`:334-338`) — same "add an optional/required field on TripSchema reusing the shared sub-schemas" move. Reuse `Coords` (`:24`) and `PlaceType` (`:37`, the `'card'|'guided'|'concert'` enum) rather than redefining.

**Hard rules (header :14-20):** `import { z } from 'zod'` (already at :21); NO `.refine()` cross-file; the stable anchor is `slug`, never `id`.

**Field shape** (name is planner's discretion — e.g. `mapExtras` or `places`). The extra marker mirrors a `places[]` row minus `slug` (no ficha). Suggested:
```ts
// add to TripSchema (near :330, alongside `map`)
mapExtras: z.array(z.object({
  roman: z.string(),       // '★'
  name: z.string(),
  day: z.string(),
  coords: Coords,
  type: PlaceType,         // 'guided'
})).optional(),
```
> The data gate is `tests/data/*.spec.ts` (Content v3 does NOT validate `type:'data'` against zod in build — header :5-8), so any new field is enforced there. The type flows free via `z.infer` (`:342`).

---

### `content/trips/roma/trip.yml` (MODIFY — add the Coliseo datum)

**Analog:** itself — the `map:` block at lines **37-39**:
```yaml
map:
  center: { lat: 41.8989, lng: 12.477 }
  zoom: 14
```

**Add the extra** — verbatim from `index.html:6292` (the ONLY pin without a ficha; field name must match the schema choice above):
```yaml
mapExtras:
  - roman: '★'
    name: 'Coliseo + Foro + Palatino (guiado)'
    day: Domingo
    coords: { lat: 41.8902102, lng: 12.4922309 }
    type: guided
```
> Verified against `index.html:6292`: `{ id:'coliseo', n:'★', name:'Coliseo + Foro + Palatino (guiado)', day:'Domingo', lat:41.8902102, lng:12.4922309, type:'guided' }`. Drop `id`/`n` → mapped to schema `roman`/`name`/`day`/`coords`/`type`. YAML block style mirrors the file's existing conventions (`infoCards`, `sections`).

---

### `tests/unit/mapMarkers.spec.ts` (NEW — unit test)

**Analog:** `tests/unit/dayRoute.spec.ts` (lines 1-64) — loads real `content/trips/roma/*.yml` with `node:fs` + `yaml`, builds a minimal typed `monById`, imports the pure util by RELATIVE path (not the `~~` alias — these run outside the Nuxt resolver), asserts exact counts.

**Loader + import pattern to copy** (`dayRoute.spec.ts:1-50`):
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { deriveMarkers } from '../../app/utils/mapMarkers'   // RELATIVE path, not ~~

const ROOT = join(process.cwd(), 'content', 'trips', 'roma')
// build monById from monuments/*.yml (the MON_SLUGS list is in dayRoute.spec.ts:37-43, reusable)
// load the Coliseo extra from trip.yml's mapExtras
```
> Assert: `deriveMarkers(...).length === 39`; the result includes a `★` Coliseo marker and a `♪` auditorium marker (presence, not order — RESEARCH Open Q 1). The 38-slug list and the day-count expectations are already encoded in `dayRoute.spec.ts:37-43,66-72` — reuse them.

---

### `tests/unit/mapOffline.spec.ts` (NEW — unit test)

**Analog:** `tests/unit/pace.spec.ts` — a small truth-table over a pure predicate (`isVisible`'s 9 cells). Same structure: `import { isOffline } from '../../app/utils/mapOffline'`, then `expect(isOffline(4,0)).toBe(true)`, `expect(isOffline(3,0)).toBe(false)`, `expect(isOffline(10,1)).toBe(false)`, etc. (covers the `>3` boundary and the `loaded===0` gate).

---

### `tests/unit/svgMotifs.spec.ts` (NEW — unit test)

**Analog:** `tests/unit/pace.spec.ts` / `tests/unit/cardNavigation.spec.ts`. Assert all 19 motif keys are present (mirror the `Motif` enum from `shared/schemas.ts:31-35`), `motifSvg('church')` returns a non-empty string starting with `<svg`, and `motifSvg(undefined as never)` / an unknown key returns `undefined`. RELATIVE import `../../app/utils/svgMotifs`.

---

### `tests/parity/map-fallback-notes.spec.ts` (NEW — parity/E2E test)

**Analog (harness):** `tests/parity/modes.spec.ts` lines 1-97 — the SELF-CONTAINED build+serve harness (does NOT use playwright.config's webServer). **Analog (popup-nav + hash-unchanged assertions):** `tests/parity/navigation.spec.ts` lines 186-245.

**Harness boilerplate to copy verbatim** (`modes.spec.ts:1-97`): `EXPECTED_HYDRATION_MSG` regex, `OUTPUT_DIR`, `waitForServer`, `killGroup`, `ensureBuild`, and the `beforeAll`/`afterAll` that `pnpm generate` once → `cpSync` to a `guiaRoma/` subdir → `spawn('pnpm', ['dlx','serve',…])` → `waitForServer`. **Use a fresh base port (e.g. 5760)** to avoid colliding with modes(5700)/navigation/search.

```ts
// modes.spec.ts:58-64 — ensureBuild (copy as-is)
function ensureBuild(): void {
  if (!existsSync(join(OUTPUT_DIR, 'index.html'))) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(join(OUTPUT_DIR, 'index.html')), '.output/public/index.html debe existir').toBe(true)
}
```

**Console gate** (`modes.spec.ts:109-113, 159`) — tolerate ONLY the color-mode hydration message, fail on any other error:
```ts
const consoleErrors: string[] = []
page.on('console', (msg) => {
  if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) consoleErrors.push(msg.text())
})
// … expect(consoleErrors, …).toHaveLength(0)
```

**localStorage preset** (`modes.spec.ts:223-233`) — for the notes persistence test (`roma-note-<slug>`):
```ts
const context = await browser.newContext()
await context.addInitScript(() => { try { window.localStorage.setItem('roma-note-galleria-sciarra', 'probe') } catch {} })
// reload, assert the textarea :value reads 'probe'; type into a fresh card, reload, assert persisted under roma-note-<slug>
```

**Popup navigation + hash-unchanged** (`navigation.spec.ts:193-196, 229`) — open a `card`-type marker popup, click its `a[href^="#"]`, assert target gets `.highlight` and the hash did NOT change:
```ts
// pattern: dispatchEvent('click') routes through the F5 CAPTURE listener (navigation.spec.ts:194)
await expect(page.locator(`#${id}`)).toHaveClass(/\bhighlight\b/)
expect(new URL(page.url()).hash, 'D-03: navegar NO cambia el hash').not.toBe('#' + id)
```

**Force offline / image fallback via abort** (RESEARCH §Validation, A5 precedent):
```ts
await context.route('**/*.tile.openstreetmap.org/**', r => r.abort())   // → .map-offline-banner.show after >3 errors
await context.route(/* hero or detail src */,        r => r.abort())   // → .card-hero svg / .detail-photo svg present; caption still present
```
> Also assert: `.leaflet-container` + 39 `.custom-marker` appear client-side; the SSG `#fallback` is an empty `#leaflet-map`; a `guided` popup (Coliseo / vaticano) is TEXT-ONLY with no anchor.

---

## Shared Patterns

### SSR-safe client island (`onMounted` + dynamic import; hooks BEFORE await)
**Source:** `app/composables/useCardNavigation.ts:122-178` (`useCardNavigationController`), `app/composables/useSearch.ts:108-152` (`useSearchController`), `app/composables/useTripModes.ts:68-104`.
**Apply to:** `LeafletMap.client.vue` (and the notes/fallback `onMounted` reads in MonumentCard/DetailPhoto).
**The rule (load-bearing — Plan 05-03 A1):** register `onMounted`/`onUnmounted` SYNCHRONOUSLY, then `await useTrip('roma')`; never read `window`/`document`/`localStorage`/Leaflet in synchronous setup. SSR/prerender emits the default → zero hydration mismatch; `nuxt generate` has no `window is not defined`.
```ts
// useCardNavigation.ts:159-177 (excerpt above) — hooks first, then `const { monById } = await useTrip('roma')`
```

### Ficha navigation (popups → `navigateToCard` via the F5 capture listener)
**Source:** `app/composables/useCardNavigation.ts:137-145` (the `onDelegatedClick` capture-phase listener) + `app/composables/useCardNavigation.ts:65-74` (`navigateToCard`).
**Apply to:** `LeafletMap.client.vue` popups.
**The rule:** render `card`/`concert` popups as a **plain `<a href="#slug">` with NO handler**. The capture listener matches `a[href^="#"]`, gates on `monById.has(id)`, and does `preventDefault()` + `stopPropagation()` + `navigateToCard` for you.
```ts
// useCardNavigation.ts:137-145
function onDelegatedClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest('a[href^="#"]')
  if (!a) return
  const id = a.getAttribute('href')!.slice(1)
  if (!isFichaTarget(id, monByIdRef.value)) return
  e.preventDefault(); e.stopPropagation(); navigateToCard(id, e)
}
```
**Anti-pattern (CR-01 reprise):** attaching `@click`/`onclick` to the popup anchor — the capture listener `stopPropagation`s and the bubble handler never fires. **Inverse of SearchBox** (`SearchBox.vue:71-77`), which deliberately uses `:data-card` + NO `href` *because* it needs a secondary bubble action (clear+close); the map popup has no secondary action → plain anchor is correct.

### localStorage read in `onMounted` (notes), never in setup
**Source:** `app/composables/useTripModes.ts:88-104` (read saved prefs in `onMounted`, persist via `watch` registered inside `onMounted`).
**Apply to:** notes persistence in MonumentCard. Keep SSR default empty; fill in `onMounted`; sanctioned micro-flash. Innocuous debounce of `setItem` allowed (D-03). The notes value is echoed only into `:value` (never `v-html`) — no stored-XSS surface.

### `:value`/`@input` (not `v-model`) for SSR-explicit inputs
**Source:** `app/components/SearchBox.vue:62-64`.
**Apply to:** the notes textarea — keeps the SSR default explicit and parallels the search input.

### `v-html` of a TRUSTED static SVG constant (with eslint-disable + justification)
**Source:** RESEARCH §Pattern 3 / §Pitfall 4 (no prior in-repo use of `v-html` — SearchBox deliberately uses `{{ }}` for data, `SearchBox.vue:8-12`).
**Apply to:** hero + detail SVG fallback ONLY. The SVG comes from `svgMotifs.ts` (trusted static constant). Add `<!-- eslint-disable-next-line vue/no-v-html — TRUSTED static constant … -->` with the justification (the repo's flat config will otherwise flag it). NEVER `v-html` data fields (popup names/notes).

### Pure logic → `app/utils/` + plain Vitest
**Source:** `app/utils/pace.ts` + `tests/unit/pace.spec.ts`; `app/utils/cardNav.ts` + `tests/unit/cardNavigation.spec.ts`; `app/utils/dayRoute.ts` + `tests/unit/dayRoute.spec.ts`.
**Apply to:** `mapMarkers.ts`, `mapOffline.ts`, `svgMotifs.ts` and their three unit specs. Auto-imported by Nuxt in app code; imported by RELATIVE path in Vitest (runs outside the Nuxt resolver).

### Self-contained Playwright parity harness
**Source:** `tests/parity/modes.spec.ts:1-97` (build+serve under `/guiaRoma/`) + `tests/parity/navigation.spec.ts` (popup-nav, `dispatchEvent('click')`, hash-unchanged, console gate).
**Apply to:** `tests/parity/map-fallback-notes.spec.ts`. Mirror the harness verbatim; fresh base port; `context.route().abort()` to force tile/image errors (A5 precedent); `addInitScript` to preset `roma-note-*`.

### CSS verbatim / no `<style scoped>`
**Source:** every component (`MonumentCard.vue:67-70`, `DetailPhoto.global.vue:22-24`, `TripView.vue:42-44`, `SearchBox.vue:37-39`).
**Apply to:** ALL F7 files. A `data-v-*` would break global selectors (`#leaflet-map`, `.map-offline-banner`, `.card-hero svg`, `.detail-photo img`, `.notes-textarea`, `[data-theme="dark"] .leaflet-tile`) and the runtime DOM Leaflet generates (which carries no scope attribute).

---

## No Analog Found

None. Every new file has a strong in-repo precedent. The single nuance: **`LeafletMap.client.vue` is the repo's first `.client.vue`**, so there is no prior file with that exact suffix to copy — but the *island shape* (effects in `onMounted`, dynamic data via `await useTrip`, controller-once hosting) is exactly the `useCardNavigationController`/`SearchBox` precedent, and the `<ClientOnly>`+`#fallback` wiring is sketched in RESEARCH §Pattern 1. Treat the suffix + dynamic `import('leaflet')` as the only genuinely new mechanics; everything else is a copy.

## Metadata

**Analog search scope:** `app/components/`, `app/composables/`, `app/utils/`, `tests/unit/`, `tests/parity/`, `tests/data/`, `shared/schemas.ts`, `content/trips/roma/trip.yml`, plus verified line reads of `index.html` (SVG_MOTIFS 2212, CARD_TO_MOTIF 2213, loadSvgFallback 2215-2227, loadSvgFallbackDetail 2229-2252, Coliseo 6292, setupNotes 6471-6483).
**Files scanned:** 21 read in full or in targeted ranges.
**Pattern extraction date:** 2026-06-23
