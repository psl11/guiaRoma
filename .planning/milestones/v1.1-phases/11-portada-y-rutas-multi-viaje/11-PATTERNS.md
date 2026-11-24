# Phase 11: Portada y rutas multi-viaje - Pattern Map

**Mapped:** 2026-11-20
**Files analyzed:** 27 (10 new, 17 modified)
**Analogs found:** 25 / 27. Every analog path below is git-tracked.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/pages/index.vue` (REWRITE) | page | request-response (prerender payload) | `app/pages/trips/[slug].vue` + `app/app.vue` (base idiom, useHead) | role-match |
| `app/pages/trips/[slug].vue` (+definePageMeta key) | page | request-response | itself | exact |
| `app/components/TripIndex.vue` (NEW) | component | transform (list render) | `app/components/TripView.vue` (footer/MDC, plainTitle) | role-match |
| `app/components/TripView.vue` (footer) | component | render | itself, lines 262-277 | exact |
| `app/utils/tripDates.ts` (NEW) | utility (pure) | transform | `app/utils/dayLabel.ts`, `app/utils/tripLayout.ts:100` | exact |
| `app/assets/css/multitrip.css` (NEW) | config/style | n/a | `app/assets/css/base.css:993-1006` (tokens use); contract in UI-SPEC lines 117-146 | partial |
| `nuxt.config.ts` (css[] + prerender.routes) | config | build | itself | exact |
| `content.config.ts` (source.exclude) | config | build | itself | exact |
| `shared/schemas.ts` (TripSchema +startDate/endDate/destinations/summary/draft) | model | validation | itself, `TripSchema` lines 349-401 | exact |
| `scripts/tripManifest.mjs` + `.d.mts` (NEW) | utility (Node, config time) | file-I/O | `scripts/vendor-fonts.mjs` (Node ESM, node:fs) | role-match |
| `content/trips/roma/trip.yml`, `prueba/trip.yml`, `forma/trip.yml` | data | n/a | existing commented `# draft: true` at prueba:17 / forma:15 | exact |
| `tests/unit/tripDates.spec.ts` (NEW) | test (unit) | transform | `tests/unit/dayLabel.spec.ts` | exact |
| `tests/unit/tripManifest.spec.ts` (NEW) | test (unit) | file-I/O | `tests/unit/romaChromeGuard.spec.ts` (node:fs + vitest) | role-match |
| `tests/unit/multitripCss.spec.ts` (NEW, D-21 scoping) | test (static) | file-I/O | `tests/unit/romaChromeGuard.spec.ts` | exact |
| `tests/unit/tripCoupling.spec.ts` (comment only) | test | — | itself | exact |
| `tests/data/build-isolation.spec.ts` (invert + dump scan) | test (build) | file-I/O | itself | exact |
| `tests/data/romaChrome.spec.ts` (`BUILT`, footer regex) | test (build) | file-I/O | itself (`:41`, `:92-93`) | exact |
| `tests/parity/_harness.ts` (NEW, commit 1) | test helper | config | none (constants extracted from each spec's `STATIC_URL`) | see RESEARCH |
| `tests/parity/_pagesServer.ts` (NEW) | test helper | request-response | none in repo; RESEARCH lines 458-488 | no analog |
| `tests/parity/portada.spec.ts` (NEW) | test (e2e) | request-response | `tests/parity/shell.spec.ts` | exact |
| `tests/parity/legacy-redirect.spec.ts` (NEW) | test (e2e) | request-response | `tests/parity/shell.spec.ts` | role-match |
| 11 existing `tests/parity/*.spec.ts` (ROMA_URL / ROMA_HTML only) | test | — | themselves (inventory table RESEARCH lines 373-407) | exact |
| `tests/parity/shell.spec.ts` (invert no-trips `:186-189`, add `/` vs ROMA test) | test | — | itself | exact |
| `tests/trips/isolation.spec.ts` (`:23`), `tests/trips/shape.spec.ts` (`:39`, `:317`) | test | — | themselves | exact |
| `tests/README.md` | doc | — | itself §2/§4 | exact |

## Pattern Assignments

### `app/pages/index.vue` (page, rewrite)

Today it is a one-liner `<TripView slug="roma" />` with a comment block forbidding `/trips/` links (that comment becomes obsolete; rewrite it). Copy the base idiom and `useHead` style from `app/app.vue` lines 8-16:
```ts
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`
useHead({ link: [ { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }, … ] })
```
Add the legacy redirect via `useHead` with `key: 'legacy-hash-redirect'`, `tagPosition: 'head'`, `tagPriority: 'critical'` (RESEARCH Pattern 3, lines 288-307), `title: 'Guías de viaje'`. Data: `useAsyncData('trips-index', () => queryCollection('trip').select(...).all())`, filter `!t.draft`, then `sortTrips` (RESEARCH Pattern 1, lines 242-257). `const LEGACY_TRIP = 'roma'` stays a code constant. Do not put any `id` in the markup (D-12).

### `app/pages/trips/[slug].vue` (page)

Keep the existing 404 guard as is (lines 17-21):
```ts
const slug = useRoute().params.slug as string
const { trip } = await useTrip(slug)
if (!trip.value) {
  throw createError({ statusCode: 404, statusMessage: 'Trip not found', fatal: true })
}
```
Add `definePageMeta({ key: route => \`trip:${String(route.params.slug)}\` })`. Do not use `fullPath`. The header comment ("NO se prerenderiza en la 1.0 … routes sigue siendo ['/']") is now false. Rewrite it.

### `app/components/TripView.vue` (footer, lines 262-277)

Current code:
```vue
<footer v-if="footerLines.length > 0">
  <div class="container">
    <p>
      <template v-for="(line, i) in footerLines" :key="i">
        <br v-if="i > 0">
        <MDC :value="line" :tag="false" unwrap="p" />
      </template>
    </p>
  </div>
</footer>
```
Change: drop the `v-if` from `<footer>`, move it to `<div class="container">`, and append `<p class="trip-back"><a :href="homeHref">← Todos los viajes</a></p>` as a **direct child of `<footer>` after `.container`** (RESEARCH Pattern 5). `homeHref` comes from `useRuntimeConfig().app.baseURL`. No `@click`, no `NuxtLink`, no new CSS. Update the comment at lines 89-92 ("Sin `footer` no se pinta el pie").

### `app/components/TripIndex.vue` (component, new)

There is no list/card page analog. Reuse these TripView idioms:
- Plain title: `inlineMdToPlain(t.title)` (`app/utils/tripLayout.ts:100-105`, auto-imported). TripView does the same at line 86: `const plainTitle = computed(() => inlineMdToPlain(trip.value?.title ?? ''))`.
- Markdown-inline summary: `<MDC :value="t.summary" :tag="false" unwrap="p" />` (same as the footer above). Note the RESEARCH warning: a link in `summary` produces nested `<a>`. Add a "summary without links" data invariant, or render the summary with `inlineMdToPlain`.
- Header comment style: a long explanatory `//` block at the top of `<script setup lang="ts">` (see ArtistCard.vue lines 1-30).
- DOM and classes are fixed by UI-SPEC: `.trip-index`, `.trip-index-header`, `.trip-index-list`, `a.trip-index-card`, `h2.trip-index-title`, `p.trip-index-meta`, `p.trip-index-summary`, `p.trip-index-empty`. Do not create a separate `TripCard` component. Use no `<style scoped>` and no `v-html`.

### `app/utils/tripDates.ts` (pure utility, new)

**Analog:** `app/utils/dayLabel.ts`. Follow its shape: a JSDoc block that explains the decision and the auto-import, then an exported pure function. Handle `noUncheckedIndexedAccess` with `?? ''`:
```ts
export function dayLabel(eyebrow: string): string {
  const first = (eyebrow.split('·')[0] ?? '').trim()
  return first.charAt(0).toLocaleUpperCase('it') + first.slice(1)
}
```
Export `formatTripDates(start?, end?)` (month table, `split('-')`, no `Intl`/`Date` locale) and `sortTrips()` (sort by `startDate` descending, then by title). The calendar-validity helper can live here or in `shared/schemas.ts` for the zod `refine`.

### `tests/unit/tripDates.spec.ts` (new)

**Analog:** `tests/unit/dayLabel.spec.ts` lines 1-30:
```ts
import { describe, it, expect } from 'vitest'
import { dayLabel } from '../../app/utils/dayLabel'
/** … plain Vitest: direct import, no Nuxt runtime … */
describe('dayLabel (D-04)', () => {
  it('venerdì · 19 giugno → Venerdì (acento grave preservado)', () => {
    expect(dayLabel('venerdì · 19 giugno')).toBe('Venerdì')
  })
```
Cases: same month («19–23 de junio de 2026»), across months, across years, start only, none, and sort ties.

### `scripts/tripManifest.mjs` + `scripts/tripManifest.d.mts` (new)

**Analog:** `scripts/vendor-fonts.mjs` lines 1-8: a Node ESM file with a leading `//` comment block and `import { … } from 'node:fs'`. Copy the code verbatim from RESEARCH Pattern 2 (lines 259-285). It must be `.mjs` plus a `.d.mts`, never a `.ts` file: a `.ts` file that imports `node:fs` breaks `pnpm typecheck` (D-23).

### `nuxt.config.ts` (config)

Current lines 52-59:
```ts
nitro: {
  preset: 'github_pages',
  prerender: { crawlLinks: true, routes: ['/'], failOnError: true },
},
```
Change to `routes: ['/', ...publishedRoutes]` using `readTripManifest()`. Append `'~/assets/css/multitrip.css'` as the **last** entry of `css[]` (current lines 21-26). Keep the explanatory comment style used above each key.

### `content.config.ts` (config)

Current lines 30-37 use `source: 'trips/*/trip.yml'` six times. Replace them with `src(include)` → `{ include, exclude: draftExcludes }`, built with `NODE_ENV === 'development'` fail-closed (RESEARCH Pattern 4). Add an explanatory comment in the same style as the existing header (lines 11-26).

### `shared/schemas.ts` (model)

Add the new fields to `TripSchema` (lines 349-401), following the existing convention of one field per line with an inline `//` comment and `.optional()` (as `mapExtras` at :363 and `sections` at :373 do). `startDate`/`endDate` are `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(validCalendarDate)`. Do not use `z.iso.date()`. `destinations` is `z.array(z.string().min(1))`. `summary` is `Md` (already defined in the file). `draft` is `z.boolean().optional()`. Avoid names reserved by Content (`meta`, `id`; see the comment at :353).

### `tests/unit/multitripCss.spec.ts` (new) and `tests/unit/tripManifest.spec.ts` (new)

**Analog:** `tests/unit/romaChromeGuard.spec.ts` lines 1-40. Copy:
```ts
import { readdirSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { describe, expect, it } from 'vitest'
const ROOT = process.cwd()
```
It also shows the pattern for a static scan with in-memory "teeth" tests: test the guard on synthetic strings and never mutate real files. For `multitripCss`, parse the selectors of `app/assets/css/multitrip.css` and assert that every one starts with `.trip-index` (and that none is `.trip-back`, `:root`, `html`, `body` or `[data-theme`).

### `tests/data/build-isolation.spec.ts` (modify)

The structure to keep (lines 31-47):
```ts
const OUT = join(process.cwd(), '.output', 'public')
const INDEX = join(OUT, 'index.html')            // → trips/roma/index.html
const PAYLOAD = join(OUT, '_payload.json')       // → trips/roma/_payload.json
describe('centinela del viaje forma (D-15)', () => { /* outside skipIf */ })
describe.skipIf(!existsSync(INDEX))('build estática: …', () => { … })
```
Invert lines 69-71 (`no existe .output/public/trips`) to: `trips/roma/index.html` exists, and `trips/prueba` and `trips/forma` do not. Add a recursive walk of `OUT` that decodes each `sql_dump.txt` with `zlib.gunzipSync(Buffer.from(txt,'base64'))` (RESEARCH lines 490-500) and checks both sentinels. Add the prueba sentinel check outside the `skipIf`, mirroring the existing forma one. Update the JSDoc: CR-01 is now closed.

### `tests/parity/_harness.ts` (new, commit 1)

Copy RESEARCH lines 409-416 verbatim (`SITE_BASE`, `ROMA_URL = '/guiaRoma/'`, `OUTPUT_DIR`, `ROMA_HTML`, `romaUrlAt`). In each spec, change only the `STATIC_URL` line, `ensureBuild` and the reads at `theme.spec.ts:103` and `map-fallback-notes.spec.ts:184`. Use the line numbers from the inventory table (RESEARCH lines 377-392).

### `tests/parity/portada.spec.ts`, `legacy-redirect.spec.ts` (new)

**Analog:** `tests/parity/shell.spec.ts`. Copy:
- `killGroup` (lines 57-69) and `ensureBuild` (lines 72-78). Point the latter at `ROMA_HTML`.
- The describe scaffold (lines 83-116): port `NNNN + TEST_WORKER_INDEX`, a `mkdtempSync` preview root, `cpSync(OUTPUT_DIR, <tmp>/guiaRoma)`, a detached server, `waitForServer`, and cleanup in `afterAll`.
- The console-error collector and `EXPECTED_HYDRATION_MSG` filter (lines 118-128).

Differences: serve with `_pagesServer.ts` (301 to the trailing-slash URL, `404.html`) instead of `pnpm dlx serve`. `serve`'s `cleanUrls` hides the 301. Pick unused ports, because the existing specs use 5000-5780. Start each redirect test from a different document (`${base}favicon.svg`) (Pitfall 4). For deep anchors, do not assert `toBeInViewport` (Pitfall 3). For ROUTE-04, record `page.on('request')` and assert that no request contains `sql_dump` or `.wasm`.

### `tests/parity/shell.spec.ts` (allowed edits only)

Invert lines 186-189:
```ts
test('la build NO emite el directorio trips/ (disciplina de prerender D-01)', () => {
  expect(existsSync(join(OUTPUT_DIR, 'trips')), …).toBe(false)
})
```
The new version asserts that `trips/roma/index.html` exists, and adds a test that `/` is the portada while `ROMA_URL` is Roma. The footer assertion at `:158` must stay unchanged.

## Shared Patterns

### Base URL, never a `/guiaRoma/` literal
**Source:** `app/app.vue` lines 8-9. **Apply to:** index.vue, TripIndex.vue, TripView footer link, redirect script.
```ts
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`
```
Trip links are always `${base}trips/${slug}/`, with the trailing slash. Use plain `<a href>`, never `NuxtLink` and never `@click`.

### Markdown-inline rendering
**Source:** `TripView.vue` lines 270-274: `<MDC :value="line" :tag="false" unwrap="p" />`. For plain text use `inlineMdToPlain` (`app/utils/tripLayout.ts:100`).

### Frozen CSS
Leave `base.css`, `tokens.css`, `fonts.css` and `leaflet.css` untouched. The footer link inherits `footer p` from `base.css:993-1006`. The portada CSS goes only in `multitrip.css`, with every selector under `.trip-index` and copied verbatim from UI-SPEC lines 117-146.

### Comment style
Every file opens with a Spanish explanatory comment block that cites the decision IDs (D-xx, ROUTE-xx). Plain Vitest specs carry a JSDoc header that explains what each guard prevents.

### Build/test hygiene
Use Node 22 (`~/.nvm/versions/node/v22.20.0/bin`). Run `rm -rf .data .nuxt .output` before `generate`. Never run `test:trips` at the same time as `generate`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `tests/parity/_pagesServer.ts` | test helper | request-response | All existing specs use `pnpm dlx serve`, whose `cleanUrls` does not mimic Pages. Use RESEARCH lines 458-488. |
| `tests/parity/_harness.ts` | test helper | config | No shared parity helper exists yet. Each spec inlines its constants today. Use RESEARCH lines 409-416. |

## Metadata
**Analog search scope:** `app/`, `scripts/`, `shared/`, `content.config.ts`, `nuxt.config.ts`, `tests/{unit,data,parity}`
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-20
