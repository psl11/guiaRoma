# Phase 6: Derivados de datos — búsqueda y ruta del día - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 8 (5 new, 1 modified, + 2 wiring touchpoints)
**Analogs found:** 8 / 8 (every new file has an exact in-repo analog)

> This phase is **wiring + a verbatim port**, not new construction. Every pattern below already
> exists in the repo. The planner should point the executor at the exact analog + line range for
> each file; the goal is a 1:1, idiomatic port. **The original `index.html` is the source of truth
> for parity** — both feature blocks are reproduced below verbatim.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/utils/searchIndex.ts` | utility (pure) | transform (data → haystack → MiniSearch) | `app/utils/cardNav.ts` + `app/utils/pace.ts` | exact (role + flow) |
| `app/utils/dayRoute.ts` | utility (pure) | transform (Monument[] → URL string) | `app/utils/pace.ts` + `app/utils/cardNav.ts` | exact (role + flow) |
| `app/composables/useSearch.ts` | composable (state + controller) | event-driven (input → query → results) | `app/composables/useCardNavigation.ts` (F5) + `useTripModes.ts` (F4) | exact (singleton+controller) |
| `app/components/SearchBox.vue` *(or wire `TheHero.vue` in place)* | component | request-response (input → dropdown → navigate) | `app/components/TheHero.vue` (shell already exists) | exact (shell present) |
| `app/components/DaySection.vue` *(MODIFY)* | component | transform (day.cards → href) | itself (existing `dayCards` computed pattern) | exact (in-file precedent) |
| `tests/unit/dayRoute.spec.ts` | test (unit) | n/a | `tests/unit/cardNavigation.spec.ts` + `tests/unit/pace.spec.ts` | exact |
| `tests/unit/searchIndex.spec.ts` | test (unit) | n/a | `tests/unit/cardNavigation.spec.ts` | exact |
| `tests/parity/search-route.spec.ts` | test (e2e parity) | n/a | `tests/parity/navigation.spec.ts` + `tests/parity/modes.spec.ts` | exact (self-contained Playwright) |

**Wiring touchpoints (read, not modified by the file count):**
- `app/components/TripView.vue` — where `useCardNavigationController()` is invoked (`TripView.vue:59`); the mirror site if `useSearch` adopts a controller.
- `shared/schemas.ts` — `MonumentSchema` (haystack fields) + `DaySchema.cards` (route order) + `PlaceType`.

---

## Pattern Assignments

### `app/utils/dayRoute.ts` (utility, pure transform) — FEAT-09 / SC#3 / SC#4

**Analog:** `app/utils/pace.ts` (file shape, doc style, type import) + the original `buildDayRoutes` inner functions.
**Source of truth:** `index.html:6582-6643` — port **character-for-character** (Pitfall 3: the `capStops` index math is load-bearing).

**Original verbatim** (`index.html:6601-6643`):
```javascript
const MAX_ROUTE_STOPS = 10; // Google Maps admite como máximo 10 paradas por ruta.
// ...
function capStops(points) {
  if (points.length <= MAX_ROUTE_STOPS) return points;
  const middle = points.slice(1, -1);
  const slots = MAX_ROUTE_STOPS - 2;
  const result = [points[0]];
  for (let i = 0; i < slots; i++) {
    const idx = slots === 1 ? 0 : Math.round(i * (middle.length - 1) / (slots - 1));
    result.push(middle[idx]);
  }
  result.push(points[points.length - 1]);
  return result;
}
function buildDirUrl(points) {
  const enc = encodeURIComponent;
  let url = 'https://www.google.com/maps/dir/?api=1&travelmode=walking'
    + '&origin=' + enc(points[0])
    + '&destination=' + enc(points[points.length - 1]);
  const waypoints = points.slice(1, -1);
  if (waypoints.length) url += '&waypoints=' + waypoints.map(enc).join('|');
  return url;
}
btn.textContent = total > MAX_ROUTE_STOPS
  ? 'Ver ruta del día (' + MAX_ROUTE_STOPS + ' de ' + total + ' paradas)'
  : 'Ver ruta del día (' + total + ' paradas)';
```

**Imports pattern** (copy from `app/utils/pace.ts:1` / `cardNav.ts:30` — type-only import from the schema alias):
```typescript
import type { Monument } from '~~/shared/schemas'
```
> Note the alias is `~~/shared/schemas` (double-tilde, repo root), as in `useTrip.ts:1`, `DaySection.vue:43`, `TheHero.vue:43`. Pure utils in `app/utils/` are auto-imported by Nuxt by their export name (precedent doc: `pace.ts:18`, `cardNav.ts:24`).

**Doc-comment style** (copy the verbatim-port + LOAD-BEARING framing from `cardNav.ts:1-28` / `pace.ts:1-20`): cite the `index.html` line numbers, mark the math as "port verbatim, do not 'correct'", reference the Pitfall.

**`pointFor` adaptation** (Pitfall 4): takes a `Monument`, returns `` `${m.coords.lat},${m.coords.lng}` `` — coords are non-optional on `MonumentSchema` (`schemas.ts:53`), so the original's URL-`query` fallback (`index.html:6594-6597`) is dead code. Do **not** return `mapsQuery`.

**Route stop derivation** (Pitfall 2 — THE critical finding): the route = **every** entry in `day.cards`, with **NO `type` filter**. The live Saturday route includes `vaticano` (guided) and `auditorium` (concert). `sabado.cards` = `[vaticano, doria-pamphilj, santeustachio, castel-santangelo, tempietto, smt, fontanone, auditorium]` (8 stops) [VERIFIED: `content/trips/roma/days/sabado.yml:326-334`]. Use the **same defensive `.filter((m): m is Monument => !!m)`** as `DaySection.vue:50` — NOT a `type !== 'card'` filter.

---

### `app/utils/searchIndex.ts` (utility, pure transform) — FEAT-03 / SC#1

**Analog:** `app/utils/cardNav.ts` (pure functions, schema type import, doc style) + `app/utils/tripIndexes.ts` (builds an index from typed collections; defensive `?? []` guards).
**Source of truth for the haystack:** the original indexed `card.textContent` (entire visible text) — `index.html:6435-6442`. The new haystack must be a **superset** (Pitfall 1).

**Original verbatim** (`index.html:6435-6442` — what F6 replaces):
```javascript
document.querySelectorAll('.card').forEach(card => {
  const id = card.id;
  const title = card.querySelector('h3')?.textContent || '';
  const italian = card.querySelector('.card-italian')?.textContent || '';
  const content = card.textContent.toLowerCase();   // ← entire visible text = the haystack
  const place = places.find(p => p.id === id);
  cards.push({ id, title, italian, content, day: place?.day || '' });
});
```

**Haystack builder — superset of `card.textContent`** (Pitfall 1). The `MonumentSchema` fields that together reconstruct the visible text [VERIFIED: `schemas.ts:46-65`]:
```typescript
import MiniSearch from 'minisearch'
import type { Monument } from '~~/shared/schemas'

export function buildHaystack(m: Monument): string {
  const parts: string[] = [m.name, m.italian, m.roman]   // <h3>, .card-italian, .card-roman
  if (m.badge) parts.push(m.badge)                        // .card-badge ('Sorrentino' | 'Caravaggio' | …)
  for (const s of m.sections) parts.push(s.heading, s.body) // body embeds detail-photo caption + detail-list
  for (const f of m.facts) parts.push(f.label, f.value)   // .facts
  if (m.sorrentino) parts.push(m.sorrentino.label, m.sorrentino.text) // .sorrentino-box
  for (const c of m.culture ?? []) parts.push(c.title, c.text)        // .culture-box
  for (const a of m.artists ?? []) parts.push(a.label, a.note ?? '')  // .card-artists → #art-*
  for (const a of m.arch ?? []) parts.push(a.label, a.note ?? '')     // .card-arch → #arq-*
  return parts.join(' ')
}
```
> The exact schema field names to read: `name`, `italian`, `roman`, `badge?`, `sections[].heading`/`sections[].body`, `facts[]` (shape `Fact`), `sorrentino?.{label,text}`, `culture?[].{title,text}`, `artists?[]`/`arch?[]` (shape `Link`, has `label` + `note?`). Confirm `Fact`/`Link` field names in `schemas.ts` before writing (the executor must read those two small types).

**Index factory** (MiniSearch config — Claude's Discretion values, RESEARCH §Open Q1 recommendation):
```typescript
export function createSearchIndex(monuments: Monument[]): MiniSearch {
  const mini = new MiniSearch({
    idField: 'slug',
    fields: ['name', 'italian', 'haystack'],   // indexed
    storeFields: ['slug', 'name', 'day'],       // returned (dropdown shows name + day)
    searchOptions: {
      prefix: true,                              // D-01: prefix
      fuzzy: 0.2,                                // D-01: SOFT fuzzy
      boost: { name: 3, italian: 3, haystack: 1 }, // D-01: italian/name > prose
      combineWith: 'OR',                         // RESEARCH A2 (broad = safe for SC#1 "at least")
    },
  })
  mini.addAll(monuments.map(m => ({
    slug: m.slug, name: m.name, italian: m.italian, day: m.day, haystack: buildHaystack(m),
  })))
  return mini
}
```
> `idField: 'slug'` (NOT `id` — the repo convention; `slug` is the `#anchor`, `tripIndexes.ts:33`). `MiniSearch` is a default import from `'minisearch'` (installed 7.2.0). The factory is pure (Vitest-testable); the instance is built **client-side** (see `useSearch.ts` below) — never put a `MiniSearch` in `useState` (not serializable; Pitfall "Prerendering the index").

---

### `app/composables/useSearch.ts` (composable, singleton + controller) — FEAT-03 / SC#2 / D-03

**Analog:** `app/composables/useCardNavigation.ts` (F5) — the **canonical singleton-accessor + `*Controller()` effect-split** with the synchronous-hooks-before-`await` fix. Secondary: `app/composables/useTripModes.ts` (F4) — the original split + `useState` keys + `onMounted` client-only restore.

**`useState` key convention** (copy from `useCardNavigation.ts:53-54` / `useTripModes.ts:46-48`): namespaced `'feature:field'` literal keys, default = the prerendered value.
```typescript
export function useSearch() {
  const query = useState('search:query', () => '')         // cf. cardNav:stack, cardNav:activeSection
  const isOpen = useState('search:open', () => false)
  const results = useState<Array<{ slug: string, name: string, day: string }>>('search:results', () => [])
  // ... query handler + onSelect (see below)
  return { query, isOpen, results, onInput, onSelect }
}
```

**Accessor / Controller split** (copy the doctrine + shape from `useCardNavigation.ts:51-86` accessor and `useCardNavigation.ts:122-178` controller). The accessor returns reactive state + handlers and is callable from any consumer; **effects (build index, outside-click listener) live in a `useSearchController()` invoked once**.

**CRITICAL — synchronous hooks before `await`** (the F5 bug, `useCardNavigation.ts:97-105` + `159-163`). If the controller is `async` and awaits `useTrip('roma')` before registering `onMounted`, the hook becomes a **silent no-op** (Vue loses the active instance after `await`). Register `onMounted`/`onUnmounted` **synchronously first**, hold the index in a `shallowRef` captured before the await, populate after:
```typescript
// MIRROR of useCardNavigation.ts:122-178 (the controller-after-await fix).
export async function useSearchController() {
  const { query, isOpen, results } = useSearch()
  const indexRef = shallowRef<MiniSearch | null>(null)   // captured SYNCHRONOUSLY (cf. monByIdRef)

  function onOutsideClick(e: MouseEvent) {               // index.html:6467-6469 verbatim
    if (!(e.target as HTMLElement).closest('.search-wrap')) isOpen.value = false
  }

  onMounted(() => {                                       // SYNC — before any await (F5 §A1)
    document.addEventListener('click', onOutsideClick)    // close-on-outside-click
  })
  onUnmounted(() => {
    document.removeEventListener('click', onOutsideClick) // same ref (cf. cardNav:165-168)
  })

  const { monById } = await useTrip('roma')               // dedup'd with TripView's useTrip (cf. cardNav:173)
  indexRef.value = createSearchIndex([...monById.value.values()]) // monuments-only (D-02)
  // optionally: watch(monById, v => indexRef.value = createSearchIndex([...v.values()]))  // cf. cardNav:177
}
```
> `useState`/`computed`/`onMounted`/`onUnmounted`/`shallowRef`/`useTrip` are auto-imported by Nuxt; `createSearchIndex` auto-imports from `app/utils/searchIndex.ts`. `useTrip` returns `monById` as a `computed<Map<slug, Monument>>` (`useTrip.ts:65,77`) — **monuments only**, so all results resolve in `monById` and `navigateToCard(slug)` needs no F5 change (D-02).

**Query handler** (mirror `index.html:6447-6465`):
```typescript
function onInput(value: string) {
  query.value = value
  const q = value.trim()
  if (q.length < 2) { isOpen.value = false; return }            // index.html:6449 (≥2 chars)
  results.value = (indexRef.value?.search(q) ?? []).slice(0, 8)  // index.html:6450 (max 8)
  isOpen.value = true                                            // index.html:6465 (.show)
}
function onSelect(slug: string, event: Event) {
  isOpen.value = false        // index.html:6459
  query.value = ''            // index.html:6460 (clears input)
  navigateToCard(slug, event) // index.html:6461 — F5 (SC#2)
}
```
> `navigateToCard` comes from `useCardNavigation()` (the accessor — `useCardNavigation.ts:65`), consumed **without changes** (it's `(id: string, event?: Event)`, designed in F5 for this consumer).

**Where the controller is invoked** (mirror `TripView.vue:59` `await useCardNavigationController()`): the search controller is invoked **once**, in the component that owns the search box — i.e. `TheHero.vue` (which already owns `useTripModesController()` at `TheHero.vue:48`) or `SearchBox.vue`. **NOT** from `useSearch()` consumers. Claude's Discretion (RESEARCH §Open Q2/Q3); the `TheHero`-owns-controls precedent (`TheHero.vue:25-32,48`) is the cleanest match.

---

### `app/components/SearchBox.vue` (component) — or wire `TheHero.vue` in place — FEAT-03 / D-03 / D-04

**Analog:** `app/components/TheHero.vue` — **the `.search-wrap` shell already exists, rendered verbatim** at `TheHero.vue:73-85` (a no-handler placeholder built in F3 so masthead spacing matched the golden):
```vue
<div class="search-wrap">
  <input id="search" type="search" class="search-input"
         placeholder="Buscar lugar, día, anécdota…" autocomplete="off">
  <div id="search-results" class="search-results" />
</div>
```
**Pitfall 6:** do NOT create a second `#search`. Either (a) replace this block in `TheHero.vue` with `<SearchBox/>` rendering the identical markup + behavior, or (b) wire `useSearch` + handlers directly onto the existing `TheHero.vue` markup. Location `#inicio` is already correct (D-04).

**Dropdown markup — VERBATIM parity** (`index.html:6452-6456`, Pitfall 5):
```vue
<div id="search-results" class="search-results" :class="{ show: isOpen }">
  <template v-if="results.length">
    <a v-for="r in results" :key="r.slug"
       :href="`#${r.slug}`" class="search-result" :data-card="r.slug"
       @click="onSelect(r.slug, $event)"
    >{{ r.name }}<div class="search-result-meta">{{ r.day }}</div></a>
  </template>
  <div v-else style="padding:.65rem 1rem;color:var(--ink-faint);font-style:italic">Sin resultados</div>
</div>
```
> The empty-state **inline style is verbatim** from the original (`index.html:6452`) — keep it. Render `name`/`day` with `{{ }}` interpolation (Vue auto-escapes), **never `v-html`** (Security §V5 — improves on the original's `innerHTML`).

**Zero new CSS, zero scoped `<style>`** (project convention, `TheHero.vue:20-23`, `DaySection.vue:38-41`): every class is already in `app/assets/css/base.css` — `.search-wrap` (:236), `.search-input` (:240), `.search-results` (:255), `.search-results.show` (:265), `.search-result` (:266), `.search-result-meta` (:275). A `data-v-*` from a scoped block would break the `.search-results.show` descendant selector.

---

### `app/components/DaySection.vue` (MODIFY, component) — FEAT-09 / SC#3

**Analog:** itself — the existing `dayCards` computed (`DaySection.vue:49-51`) is the exact pattern to reuse for the route points:
```typescript
const dayCards = computed(() =>
  props.day.cards.map(slug => props.monById.get(slug)).filter((m): m is Monument => !!m),
)
```
**Add** (reuse the same `day.cards → monById → filter` chain, then `pointFor`; NO type filter — Pitfall 2):
```typescript
const points = computed(() =>
  props.day.cards
    .map(slug => props.monById.get(slug))
    .filter((m): m is Monument => !!m)   // same defensive filter as dayCards; NO type filter
    .map(pointFor),
)
const routeHref = computed(() => buildDirUrl(capStops(points.value)))
```
`pointFor`/`capStops`/`buildDirUrl`/`routeLabel` auto-import from `app/utils/dayRoute.ts`. `props` already exist (`DaySection.vue:45`: `{ day: Day, monById: Map<string, Monument> }`).

**Button — append INSIDE the existing `.day-stats`** (after the `v-for`, `DaySection.vue:74-87`). Reactive `v-if` + `:href` (no DOM mutation; renders at SSG prerender — no `window`, unlike F5/F7):
```vue
<div class="day-stats">
  <div v-for="(s, i) in day.stats" :key="i" class="day-stats-item" :class="s.variant">
    <MDC :value="s.text" :tag="false" unwrap="p" />
  </div>
  <a v-if="points.length >= 2" class="day-route-btn" :href="routeHref"
     target="_blank" rel="noopener"
     title="Abre Google Maps con el recorrido del día a pie"
  >{{ routeLabel(points.length) }}</a>
</div>
```
> Button shape verbatim from `index.html:6635-6644` (same `target`/`rel`/`title`). `.day-route-btn` CSS exists in `base.css:393-413` (zero new CSS). `v-if="points.length >= 2"` mirrors `index.html:6633` (`if (points.length < 2) return`). Label text comes from `routeLabel` (Pitfall: keep `(N paradas)` / `(10 de N paradas)` exact).

---

### `tests/unit/dayRoute.spec.ts` (unit) — FEAT-09 / SC#4

**Analog:** `tests/unit/cardNavigation.spec.ts` + `tests/unit/pace.spec.ts` — **plain Vitest, no `@nuxt/test-utils`**, direct relative import from `app/utils/`. Reading YAML fixtures follows `tests/data/invariants.spec.ts`.

**Bootstrap** (copy `cardNavigation.spec.ts:1-2` / `pace.spec.ts:1-2`):
```typescript
import { describe, it, expect } from 'vitest'
import { pointFor, capStops, buildDirUrl, routeLabel, MAX_ROUTE_STOPS } from '../../app/utils/dayRoute'
```
> Relative path `../../app/utils/dayRoute` (NOT the `~~` alias — these specs run in plain Vitest outside the Nuxt resolver, exactly like `pace.spec.ts:2` and `cardNavigation.spec.ts:2`).

**Reading `day.cards` + monument coords for per-day URL parity** (copy the `readFileSync` + `parse` loader from `tests/data/invariants.spec.ts:1-4,32-42`):
```typescript
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
const ROOT = join(process.cwd(), 'content', 'trips', 'roma')
// load monuments → Map<slug, {coords}>, load each day → day.cards, then run the SAME
// pointFor/capStops/buildDirUrl over them and assert the URL structure + exact stop counts.
```
> `yaml` is already a test dependency (used by `invariants.spec.ts:4`).

**Required cases** (from RESEARCH §Validation):
- SC#4 per-day URL parity: build expected URL with the SAME ported functions over the 5 days' `day.cards` + coords; assert `dir/?api=1&travelmode=walking&origin=…&destination=…&waypoints=…` structure + exact stop count per day.
- **Pitfall 2 assertion**: Saturday = **8 stops** including `vaticano` + `auditorium` coordinates (the regression guard against a type filter).
- **Pitfall 3**: `capStops` on a **synthetic >10 fixture** matches the literal sampling (no real day exceeds 10 — Saturday's 8 is the max — so this needs a constructed array).
- `routeLabel`: `(N paradas)` for ≤10, `(10 de N paradas)` for >10.

**Style** (copy `cardNavigation.spec.ts:33-66`): one `describe` per function, one `it` per case, doc comment citing `index.html` line numbers + the Pitfall.

---

### `tests/unit/searchIndex.spec.ts` (unit) — FEAT-03 / SC#1

**Analog:** `tests/unit/cardNavigation.spec.ts` (plain Vitest, fixture Maps). Same bootstrap as `dayRoute.spec.ts` above.
```typescript
import { describe, it, expect } from 'vitest'
import { buildHaystack, createSearchIndex } from '../../app/utils/searchIndex'
```

**Required cases** (Pitfall 1 — haystack is a **superset** of `card.textContent`):
- Searching a **badge** word ("Sorrentino", "Caravaggio"), an **arch-style** word ("Tardobarroco"), a **section-body** word, an **italian-name** word, and a **fact** value each returns the expected monument slug. A subset would regress SC#1.
- `createSearchIndex(...).search('…')` respects `idField: 'slug'` (results carry `slug`/`name`/`day` from `storeFields`).
- Build a small `Monument[]` fixture inline (or read one real `monuments/*.yml` via the `invariants.spec.ts` loader); a plain object literal matching the indexed fields is enough for the haystack-coverage tests.

---

### `tests/parity/search-route.spec.ts` (e2e parity) — FEAT-03 / FEAT-09

**Analog:** `tests/parity/navigation.spec.ts` + `tests/parity/modes.spec.ts` — **self-contained Playwright** (`pnpm generate` once, copy `.output/public` into a `guiaRoma/` subdir, serve under `/guiaRoma/`). Copy the **entire bootstrap block verbatim** (`modes.spec.ts:1-97` / `navigation.spec.ts:1-167`): the imports, `EXPECTED_HYDRATION_MSG`, `OUTPUT_DIR`, `waitForServer`, `killGroup`, `ensureBuild`, the `beforeAll`/`afterAll` (mkdtemp → cpSync → `pnpm dlx serve` → `waitForServer`).

**Port (collision-free)** (`modes.spec.ts:67` uses 5700, `navigation.spec.ts:137` uses 5720 — pick a **new base**, e.g. `5740`):
```typescript
const STATIC_PORT = 5740 + Number(process.env.TEST_WORKER_INDEX ?? 0)
const STATIC_URL = `http://localhost:${STATIC_PORT}/guiaRoma/`
```

**Console-error gate** (verbatim from `navigation.spec.ts:43,200-203`): tolerate **only** the color-mode hydration message, fail on any other:
```typescript
const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i
page.on('console', (msg) => {
  if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) consoleErrors.push(msg.text())
})
```

**`gotoHydrated` helper** (adapt `navigation.spec.ts:173-184` / `modes.spec.ts:100-106`): `page.goto(STATIC_URL)` → `waitForLoadState('networkidle')` → assert a hydrated signal (e.g. `.pace-btn[data-pace="optimistic"]` has `.active`, or type into `#search` and expect `.search-results.show`).

**Search → navigate assertion** (mirror the `navigateToCard` helper + `.highlight` check from `navigation.spec.ts:193-196,221-229`): fill `#search` with ≥2 chars, expect `.search-results.show` with ≤8 `.search-result`, click a result, then assert the target card gets `.highlight` AND the URL hash did **not** change (D-03 — `navigateToCard` does `preventDefault`):
```typescript
await expect(page.locator(`#${slug}`)).toHaveClass(/\bhighlight\b/)
expect(new URL(page.url()).hash).not.toBe(`#${slug}`)  // cf. navigation.spec.ts:229
```
> Use `.click()` (the result `<a>` is in the viewport, unlike the far-down timeline link); `navigation.spec.ts` used `dispatchEvent('click')` only to avoid Playwright auto-scrolling the *origin*, which is not a concern for the dropdown.

**Required cases** (RESEARCH §Test Map):
- Dropdown: <2 chars closed; ≥2 chars opens (`.search-results.show`); max 8 rows; empty query → "Sin resultados".
- Result click → `.highlight` on target card + hash unchanged (SC#2).
- Route button: hidden where applicable, visible with ≥2 stops, label `(N paradas)` / `(10 de N paradas)`; `:href` is a `https://www.google.com/maps/dir/?api=1&travelmode=walking…` URL (asserted by structure, never fetched — Security).

---

## Shared Patterns

### Pattern: Pure logic in `app/utils/` + plain-Vitest spec (F2–F5 doctrine)
**Source:** `app/utils/pace.ts` (+ `tests/unit/pace.spec.ts`), `app/utils/cardNav.ts` (+ `tests/unit/cardNavigation.spec.ts`).
**Apply to:** `app/utils/searchIndex.ts`, `app/utils/dayRoute.ts`, and their specs.
- Type-only import from `~~/shared/schemas` (`pace.ts:1`, `cardNav.ts:30`).
- No Nuxt/Vue/DOM in the util (auto-imported by export name).
- Doc comment cites `index.html` line numbers and marks load-bearing math "do not correct" (`cardNav.ts:1-28`, `pace.ts:1-20`).
- Spec imports via **relative path** `../../app/utils/X` (NOT `~~`), `import { describe, it, expect } from 'vitest'`, one `it` per case.

### Pattern: `useState` singleton accessor + `*Controller()` effect-split (F4/F5)
**Source:** `app/composables/useCardNavigation.ts:51-178` (canonical, incl. the async-controller fix), `app/composables/useTripModes.ts:45-105`.
**Apply to:** `app/composables/useSearch.ts`.
- Accessor (`useSearch()`) returns reactive `useState` refs + handlers, idempotent, callable anywhere.
- Effects (build index, outside-click listener) live in `useSearchController()`, invoked **once** at the owner component (mirror `TripView.vue:59` / `TheHero.vue:48`).
- `useState` keys are namespaced literals (`'search:query'`, cf. `'cardNav:stack'`).
- Defaults = prerendered values (empty query / closed dropdown / `[]` results) so SSG first paint matches.

### Pattern: Synchronous lifecycle hooks BEFORE any `await` in an async controller
**Source:** `app/composables/useCardNavigation.ts:97-105,159-163` (the F5 §A1 bug + fix); `navigation.spec.ts:31-37` is the spec that decided it.
**Apply to:** `useSearchController()` (it `await`s `useTrip('roma')` for `monById`).
- Register `onMounted`/`onUnmounted` synchronously first; hold the not-yet-ready value (the MiniSearch index) in a `shallowRef` captured before the await (mirror `monByIdRef`, `cardNav.ts:128`); populate after the await; optionally `watch(monById, …)` to resync (`cardNav.ts:177`).
- A hook registered **after** `await` is a silent no-op (lost active instance) → the feature dies in SSG.

### Pattern: Wire behavior into pre-existing verbatim shells; zero new CSS; no scoped `<style>`
**Source:** `TheHero.vue:73-85` (search shell), `DaySection.vue:74-87` (day-stats band), project-wide `base.css`.
**Apply to:** `SearchBox.vue`/`TheHero.vue` wiring and `DaySection.vue` button.
- Reuse existing markup + classes; do not create parallel `#search` (Pitfall 6) or new CSS.
- **No scoped `<style>`** — a `data-v-*` attribute breaks descendant/global selectors (`.search-results.show`, `.day-stats-item.walk`). All needed classes confirmed present: search at `base.css:236-275`, route button at `base.css:393-413`.

### Pattern: Self-contained Playwright parity spec (build + serve under `/guiaRoma/`)
**Source:** `tests/parity/navigation.spec.ts:1-167` and `tests/parity/modes.spec.ts:1-97` (identical bootstrap).
**Apply to:** `tests/parity/search-route.spec.ts`.
- Copy the bootstrap verbatim (`waitForServer`/`killGroup`/`ensureBuild`/`beforeAll` mkdtemp→cpSync→`pnpm dlx serve`→`waitForServer`).
- Pick a fresh `STATIC_PORT` base (5700/5720 taken → use 5740+).
- Tolerate **only** `EXPECTED_HYDRATION_MSG`, fail on any other console error.
- Memory note (project): run via sequential execution (`use_worktrees=false`); serve under a `guiaRoma/` subdir, open `/guiaRoma/` (serving `.output/public` at root = blank page).

---

## No Analog Found

None. Every new file maps to an exact in-repo analog:

| File | Has analog? | Analog |
|------|-------------|--------|
| `app/utils/searchIndex.ts` | yes | `app/utils/cardNav.ts`, `app/utils/tripIndexes.ts` |
| `app/utils/dayRoute.ts` | yes | `app/utils/pace.ts`, `app/utils/cardNav.ts` |
| `app/composables/useSearch.ts` | yes | `app/composables/useCardNavigation.ts`, `useTripModes.ts` |
| `app/components/SearchBox.vue` | yes | `app/components/TheHero.vue` (shell exists) |
| `app/components/DaySection.vue` (mod) | yes | itself (`dayCards` computed) |
| `tests/unit/dayRoute.spec.ts` | yes | `tests/unit/cardNavigation.spec.ts`, `pace.spec.ts` |
| `tests/unit/searchIndex.spec.ts` | yes | `tests/unit/cardNavigation.spec.ts` |
| `tests/parity/search-route.spec.ts` | yes | `tests/parity/navigation.spec.ts`, `modes.spec.ts` |

---

## Metadata

**Analog search scope:** `app/utils/`, `app/composables/`, `app/components/`, `tests/unit/`, `tests/parity/`, `tests/data/`, `shared/schemas.ts`, `content/trips/roma/days/`, and `index.html` (parity source of truth, lines 6431-6469 search + 6579-6646 route).
**Files scanned:** ~22 (read in full or targeted ranges).
**Environment confirmed:** `minisearch@7.2.0` installed; CSS classes present (`base.css`); scripts `test:unit` / `test:data` / `test:golden` / `generate` present.
**Pattern extraction date:** 2026-06-21
