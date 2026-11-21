# Phase 12: Formas nuevas de viaje - Pattern Map

**Mapped:** 2026-11-21
**Files analyzed:** 22 (from 12-RESEARCH.md "Recommended Project Structure")
**Analogs found:** 22 / 22. Every file has a tracked analog in the repo.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `shared/schemas.ts` (mod) | model/schema | transform/validation | itself (lines 31-37, 92-130, 155, 165) | exact |
| `app/utils/timelineRows.ts` (NEW) | utility (pure) | transform | `app/utils/dayRoute.ts` | exact |
| `app/utils/tripStays.ts` (NEW) | utility (pure) | transform | `app/utils/dayRoute.ts` / `app/utils/dayLabel.ts` | exact |
| `app/utils/dayRoute.ts` (mod) | utility (pure) | transform | itself | exact |
| `app/utils/mapMarkers.ts` (mod) | utility (pure) | transform | itself + `LeafletMap.client.vue:104-134` | exact |
| `app/utils/svgMotifs.ts` (mod) | utility (data map) | static | itself (`SVG_MOTIFS`, line 30+) | exact |
| `app/components/TimelineChoice.vue` (NEW) | component (leaf) | render | `app/components/TimelineTransport.vue` | exact |
| `app/components/Timeline.vue` (mod) | component (dispatcher) | render | itself | exact |
| `app/components/DaySection.vue` (mod) | component | render | itself (lines 57-72, 110-115) | exact |
| `app/components/TripView.vue` (mod) | component (page shell) | prop passing | itself (`<DaySection` line 167) | exact |
| `app/components/MonumentCard.vue` (mod) | component | render | itself (`card-artists` v-if blocks, 219-230) | exact |
| `app/components/LeafletMap.client.vue` (mod) | component (client-only) | event-driven | itself (lines 104-134) | exact |
| `app/assets/css/tripshapes.css` (NEW) | config/style | static | `app/assets/css/multitrip.css` | exact |
| `nuxt.config.ts` (mod) | config | static | itself (lines 20-32, `css: []`) | exact |
| `content/trips/campania/**` (NEW) | content (YAML draft) | data | `content/trips/forma/**` | exact |
| `tests/unit/timelineRows.spec.ts`, `tripStays.spec.ts`, `enumStyles.spec.ts` (NEW) | test (unit) | — | `tests/unit/dayRoute.spec.ts` | exact |
| `tests/unit/tripShapesCss.spec.ts` (NEW) | test (CSS guard) | file-I/O | `tests/unit/multitripCss.spec.ts` | exact |
| `tests/unit/{dayRoute,mapMarkers,svgMotifs,multitripCss}.spec.ts` (mod) | test | — | themselves | exact |
| `tests/data/{schema,invariants,build-isolation}.spec.ts`, `trips.ts` (mod) | test (data) | file-I/O | themselves (`trips.ts` `checkTrip` line 218, `RESERVED_KEYS` line 80) | exact |
| `tests/trips/campania.spec.ts` (NEW) | test (E2E Playwright, dev) | request-response | `tests/trips/shape.spec.ts` | exact |

## Pattern Assignments

### `app/components/TimelineChoice.vue` (leaf component)
**Analog:** `app/components/TimelineTransport.vue`

Conventions to copy:
- `<script setup lang="ts">`, header comment explaining parity, **no `<style>` block** (all CSS global; scoped data-v-* breaks cross-component selectors).
- Row type narrowed from the schema union:
```ts
import type { Day } from '~~/shared/schemas'
type TransportRow = Extract<Day['timeline'][number], { kind: 'transport' }>
defineProps<{ row: TransportRow }>()
const { isVisible } = useTripModes()
```
  For choice: `type ChoiceRow = Extract<Day['timeline'][number], { kind: 'choice' }>`. ChoiceRow has NO `pace` (D-03), so do not call `isVisible` on the choice itself; inner rows render through the same dispatcher pattern (leaf components filter themselves).
- Inline Markdown fields render with
```vue
<MDC :value="mode.desc" :tag="false" unwrap="p" />
```
  (use for `heading` with fallback «Elige una», `option.title`). Plain-text fields (`label`) use `{{ }}`.
- Inner rows: reuse the `resolveComponent` map from Timeline.vue (see below) restricted to the 5 base kinds; NOT the raw-string `:is` (renders empty in SSG).

### `app/components/Timeline.vue` (dispatcher)
**Analog:** itself, lines 26-54:
```ts
import { resolveComponent } from 'vue'
const COMPONENT_BY_KIND = {
  stop: resolveComponent('TimelineStop'),
  transport: resolveComponent('TimelineTransport'),
  meta: resolveComponent('TimelineMeta'),
  food: resolveComponent('TimelineFood'),
  reservation: resolveComponent('TimelineReservation'),
} as const
```
```vue
<div class="timeline">
  <component :is="COMPONENT_BY_KIND[row.kind]" v-for="(row, i) in rows" :key="i" :row="row" />
</div>
```
Add `choice: resolveComponent('TimelineChoice')`. Keep the order from the data and no filtering here.

### `app/utils/timelineRows.ts`, `app/utils/tripStays.ts` (NEW pure utils)
**Analog:** `app/utils/dayRoute.ts`
- A long JSDoc header with invariants, then **type-only imports**: `import type { Monument } from '~~/shared/schemas'`.
- Named `export function` (Nuxt auto-imports by export name), with no Vue/Nuxt/DOM.
- Tests import them by relative path `../../app/utils/x` (not `~~`).
- Style example (dayRoute.ts:49-51):
```ts
export function pointFor(m: Monument): string {
  return `${m.coords.lat},${m.coords.lng}`
}
```

### `app/utils/dayRoute.ts` (mod: routeStops/routeVisible/routeTitle, `buildDirUrl(points, mode='walking')`)
**Analog:** itself, lines 73-85. The current URL is a hardcoded literal:
```ts
let url = 'https://www.google.com/maps/dir/?api=1&travelmode=walking'
  + '&origin=' + enc(points[0]!)
  + '&destination=' + enc(points[points.length - 1]!)
const waypoints = points.slice(1, -1)
if (waypoints.length) url += '&waypoints=' + waypoints.map(enc).join('|')
```
Parameterize to `travelmode=${mode}` with the default `'walking'` so Roma stays byte-identical. Do NOT touch the `capStops` `Math.round` arithmetic (lines 58-70) or `routeLabel` (lines 92-96).
Consumer: `DaySection.vue:60-72` (`day.cards → monById.get → filter((m): m is Monument => !!m) → map(pointFor)`, `routeHref = computed(() => buildDirUrl(capStops(points.value)))`, button at lines 110-115 `class="day-route-btn" :href="routeHref"` → `{{ routeLabel(points.length) }}`).

### `app/utils/mapMarkers.ts` + `app/components/LeafletMap.client.vue`
**Analog:** `mapMarkers.ts` (MapMarker interface with `type: 'card' | 'guided' | 'concert'` → change to `PlaceType`; `deriveMarkers` maps `type: m.type`).
Extract `MARKER_STYLE` / `markerPopupHtml` from the inline logic in LeafletMap.client.vue:105-133. The output must stay byte-identical for Roma:
```ts
let bgColor = '#8b3a3a' // card (default)
if (m.type === 'guided') bgColor = '#a07c4a'
if (m.type === 'concert') bgColor = '#5a7a3a'
...
if (m.type === 'guided') popupHtml = `<strong>${m.name}</strong><br><em style="color:#a07c4a">${m.day}</em><br><span style="color:#5c534a;font-size:.85rem">Visita con guía humano</span>`
else if (m.type === 'concert') popupHtml = `<strong>${m.name}</strong><br><em style="color:#5a7a3a">${m.day}</em><br><a href="#${m.id}" style="color:#5a7a3a">Abrir ficha →</a>`
else popupHtml = `<strong>${m.name}</strong><br><em style="color:#a07c4a">${m.day}</em><br><a href="#${m.id}" style="color:#8b3a3a">Abrir ficha →</a>`
```
LANDMINE (comment at lines 28-32 and MEMORY CR-01): popup anchors `<a href="#slug">` carry **no handler**. Keep that for `nature`. The divIcon HTML template (lines 110-118) stays unchanged, and only `bgColor` comes from `MARKER_STYLE[type]`.

### `app/utils/svgMotifs.ts` (+ sea, thermal, river, trail)
**Analog:** `SVG_MOTIFS: Record<string,string>` (line 30+). Each entry is a single-line SVG string `viewBox="0 0 800 280" preserveAspectRatio="xMidYMid slice"`, a sky gradient `#f5edd9→#e8d8b5`, and **unique gradient ids per motif** (`sk_d`, `sk_p`, `sk_a` …). New ones need new unique ids (e.g. `sk_se`, `sk_th`). Also add them to the `Motif` enum in schemas.ts:31-35.

### `app/components/MonumentCard.vue` (+ family box)
**Analog:** optional blocks at lines 219-230 (`v-if="monument.artists"` → `class="card-artists"`), placed in DOM order inside the card. Use `v-if="monument.family"` so Roma (without the field) renders identical DOM. No scoped CSS. Style goes in tripshapes.css.

### `app/components/DaySection.vue` / `TripView.vue` (stay)
Pass `:stay="stayFor(day, trip.stays)"` at the `<DaySection` call in TripView.vue:167. DaySection gets an optional prop and a `v-if` line so Roma stays unchanged.

### `app/assets/css/tripshapes.css` + `nuxt.config.ts`
**Analog:** `multitrip.css` + `nuxt.config.ts:26-32`:
```ts
css: [
  '~/assets/css/fonts.css',
  '~/assets/css/tokens.css',
  '~/assets/css/base.css',
  '~/assets/css/leaflet.css',
  '~/assets/css/multitrip.css',
  // + '~/assets/css/tripshapes.css'  (LAST)
],
```
Keep the comment-block convention above `css:` that explains why each file is there. Exact selectors and rules come from 12-UI-SPEC.md. No `:root`/`[data-theme]`/`html`/`body` redefinitions; use the tokens.css variables.

### `tests/unit/tripShapesCss.spec.ts` (CSS scope guard)
**Analog:** `tests/unit/multitripCss.spec.ts`. This is plain Vitest with `node:fs` and `node:path`. It reads `join(process.cwd(),'app','assets','css',…)` and uses the exported `cssSelectors(css)` (comment-stripping parser, line ~37). It asserts each selector is under the allowed roots and that the file is last in `nuxt.config.ts` `css[]`. Test the guard's "teeth" with synthetic in-memory strings. Never mutate real files. Import `cssSelectors` from `./multitripCss.spec` or copy it. `multitripCss.spec.ts` currently asserts multitrip.css is LAST, so that assertion must be updated (listed as "adjusted").

### Unit specs (`timelineRows`, `tripStays`, `enumStyles`, extended `dayRoute`/`mapMarkers`/`svgMotifs`)
**Analog:** `tests/unit/dayRoute.spec.ts` lines 1-5:
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { pointFor, capStops, buildDirUrl, routeLabel, MAX_ROUTE_STOPS } from '../../app/utils/dayRoute'
```
Each spec starts with a long Spanish JSDoc that lists the guarded pitfalls. Fixtures are real `content/trips/...` YAML via `node:fs` and `yaml`, or synthetic. Add a Roma byte-identity check (the default `walking` URL and the 3 popup strings unchanged).

### `tests/data/trips.ts` + schema/invariants/build-isolation specs
**Analog:** `trips.ts`. `TRIPS_ROOT` (line 50), `COLLECTIONS` (57), `RESERVED_KEYS` (80, top-level only, applied at 254-260), `RULES` (84), `loadTripFromFiles` (122), `loadTrip` (160), `collectStrings` (200, which must recurse into `choice.options[].rows` for anchor checks), `checkTrip` (218), `formatViolations` (397). The build-isolation spec already decodes `sql_dump` for draft sentinels (see `FORMA-CENTINELA-10A` in forma/trip.yml). Add a campania sentinel the same way.

### `content/trips/campania/**` (draft skeleton)
**Analog:** `content/trips/forma/` (`trip.yml`, `days/*.yml`, `monuments/*.yml`, `food/*.yml`). It starts with a header comment that explains the purpose, then `draft: true` (content.config.ts excludes drafts from the production build). Then `slug`, `title` (inline MD), `decoration`, `heroMeta`, `quote`, `quoteAttr`, `infoCards`, `howTo`, `map: { center, zoom }`, `pageTitle`. Day file shape (forma/days/sabado-19.yml):
```yaml
slug: sabado-19
trip: forma
order: 1
pill: 'Sáb 19'
roman: I
eyebrow: 'sábado · 19 de septiembre'
title: La llegada al faro
subtitle: ...
stats: []
timeline: []
cards: [faro-del-ensayo]
```
Never use `id`/`meta` keys (RESERVED_KEYS). After editing YAML, run `rm -rf .data .nuxt .output` before generate (MEMORY).

### `tests/trips/campania.spec.ts` (E2E, dev server)
**Analog:** `tests/trips/shape.spec.ts`. It imports `@playwright/test`, `yaml`, `inlineMdToPlain` from `../../app/utils/tripLayout`, and `findRomaLeaks` from `./romaLeaks`. It runs against `nuxi dev` (playwright.trips.config.ts, port 5300, base /guiaRoma/) because drafts are not prerendered. It derives expectations from the YAML data and does not hardcode them. Pitfall 6: short pages do not scroll, so do not rely on the scrollspy `.active` state.

## Shared Patterns

- **Roma parity by construction:** every new field is optional, every new render is behind `v-if`, and enum extensions keep the existing values. Roma's 56 goldens must stay unchanged.
- **No scoped CSS** in any component. Global CSS only, in the new `tripshapes.css` (loaded last).
- **MDC inline rendering:** `<MDC :value :tag="false" unwrap="p" />` for every `Md` field.
- **Pure utils in `app/utils/`:** type-only imports from `~~/shared/schemas`, auto-imported, tested with plain Vitest via relative paths.
- **Popup/anchor rule (CR-01):** nav-only anchors have no `@click`.
- **Schema strictness:** `z.strictObject` for ChoiceRow/ChoiceOption so typos fail loudly. Import `z` from `zod`.
- **Comments in Spanish**, explaining why each choice protects parity.
- **Env:** builds, Playwright and typecheck need Node 22 (`~/.nvm/versions/node/v22.20.0/bin`).

## No Analog Found

None. The `choice` row is new but follows the dispatcher pattern and TimelineTransport's leaf pattern exactly.

## Metadata
**Search scope:** app/components, app/utils, app/assets/css, shared, content/trips, tests/{unit,data,trips}, nuxt.config.ts
**Pattern extraction date:** 2026-11-21
