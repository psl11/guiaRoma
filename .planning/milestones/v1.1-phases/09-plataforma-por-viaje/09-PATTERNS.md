# Phase 9: Plataforma por viaje - Pattern Map

**Mapped:** 2026-11-20
**Files analyzed:** 22 (8 modified, 14 new incl. prueba content)
**Analogs found:** 21 / 22

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/composables/useTripContext.ts` (NEW) | provider/composable | event-driven (provide/inject) | none in repo; RESEARCH Pattern 1 | no analog |
| `app/utils/tripStorage.ts` (NEW) | utility (pure) | transform | `app/utils/pace.ts` | exact (pure util, auto-imported, Vitest-plain) |
| `app/composables/useSearch.ts` (MOD) | composable/controller | request-response (client index) | self (lines 52-58, 106-151) | self |
| `app/composables/useCardNavigation.ts` (MOD) | composable/controller | event-driven | self (51-54, 122-127, 173-178) | self |
| `app/composables/useTripModes.ts` (MOD) | composable/controller | file-I/O (localStorage) | self (45-54, 67-104) | self |
| `app/components/TripView.vue` (MOD) | component (page owner) | request-response | self (62-68) | self |
| `app/components/MonumentCard.vue` (MOD) | component | file-I/O (localStorage) | self (119-130) | self |
| `shared/schemas.ts` (MOD) | model (zod) | validation | self `TripSchema` (328-329) | self |
| `content/trips/prueba/trip.yml` (NEW) | config/data | — | `content/trips/roma/trip.yml` | exact |
| `content/trips/prueba/days/{viernes,sabado}.yml` (NEW) | data | — | `content/trips/roma/days/sabado.yml` | exact |
| `content/trips/prueba/monuments/{fontana-pruebas,torre-ensayo,spagna}.yml` (NEW) | data | — | `content/trips/roma/monuments/spagna.yml` | exact |
| `tests/data/trips.ts` (NEW) | utility (test helper, Node-pure) | batch / file-I/O | `tests/data/invariants.spec.ts` lines 32-53 (loader) | role-match (extract) |
| `tests/data/fixtures/trips/**` (NEW) | test fixture | — | in-line fixtures in `invariants.spec.ts` | partial |
| `tests/data/schema.spec.ts` (MOD) | test | batch | self (36-48) | self |
| `tests/data/invariants.spec.ts` (MOD) | test | batch | self (32-53, 108-180) | self |
| `tests/unit/tripStorage.spec.ts` (NEW) | test | — | `tests/unit/pace.spec.ts` | exact |
| `tests/unit/searchIsolation.spec.ts` (NEW) | test | — | `tests/unit/searchIndex.spec.ts` | exact |
| `tests/unit/tripCoupling.spec.ts` (NEW) | test (source guardian) | file-I/O | `tests/data/*.spec.ts` (readFileSync Node-pure) | partial |
| `tests/trips/isolation.spec.ts` (NEW) | test E2E | request-response | `tests/parity/navigation.spec.ts` (173-195), `tests/parity/modes.spec.ts` (225-245) | role-match |
| `playwright.trips.config.ts` (NEW) | config | — | `playwright.config.ts` / `playwright.gate.config.ts` | exact |
| `package.json` (MOD, optional `test:trips` script) | config | — | existing scripts lines 14-20 | exact |

## Pattern Assignments

### `app/utils/tripStorage.ts` (utility, pure)
**Analog:** `app/utils/pace.ts` — header JSDoc explaining "extraída a `app/utils/` para auto-import + Vitest plano, sin runtime Nuxt"; named exports with explicit types. Body per RESEARCH Pattern 4:
```ts
export function tripStorageKey(slug: string, name: string): string { return `${slug}-${name}` }
export function tripStateKey(slug: string, name: string): string { return `${name}:${slug}` }
```

### `app/composables/useTripContext.ts` (provider)
No analog (first provide/inject in repo). Use RESEARCH Pattern 1 verbatim (`TripSlugKey: InjectionKey<string>`, `provideTripSlug`, `useTripSlug` throwing with explanatory message). Comment style: follow long Spanish header comments as in `useTripModes.ts:40-44`.

### `app/composables/useTripModes.ts` (MOD)
**Current accessor** (lines 45-54):
```ts
export function useTripModes() {
  const pace = useState<'optimistic' | 'neutral' | 'slow'>('pace', () => 'optimistic')
  const light = useState('light', () => false)
  const resumen = useState('resumen', () => false)
```
→ `useTripModes(slug: string = useTripSlug())` and keys `tripStateKey(slug,'pace')` etc.
**Current persistence** (lines 88-103) — keep ORDER pace→light→resumen and enum validation; only replace literals:
```ts
const savedPace = localStorage.getItem('roma-pace')
if (savedPace === 'optimistic' || savedPace === 'neutral' || savedPace === 'slow') { pace.value = savedPace }
if (localStorage.getItem('roma-light') === '1') light.value = true
...
watch(pace, v => localStorage.setItem('roma-pace', v))
```
Controller: `const slug = useTripSlug()` first line, then `useTripModes(slug)`; `watch(light)` and `useHead({ bodyAttrs })` unchanged.

### `app/composables/useCardNavigation.ts` (MOD)
Lines 51-54: `useState<number[]>('cardNav:stack', ...)`, `useState<string>('cardNav:activeSection', ...)` → `useCardNavigation(slug = useTripSlug())` + `tripStateKey`.
Lines 122-127: `export async function useCardNavigationController() { const { navigateToCard, activeSection } = useCardNavigation()` → takes `slug: string` REQUIRED and calls `useCardNavigation(slug)` (self-inject trap: TripView can't inject its own provide).
Line 173: `const { monById } = await useTrip('roma')` → `useTrip(slug)`. Keep hooks registered BEFORE the await (comment at 97-105 documents bug A1).

### `app/composables/useSearch.ts` (MOD)
Line 52 `const indexRef = shallowRef<MiniSearch | null>(null)` → `const indexes = new Map<string, MiniSearch>()` (module, client-only writes).
Lines 54-60: `useState('search:query'|'search:open'|'search:results')` + `useCardNavigation()` → slug param, `tripStateKey`, `useCardNavigation(slug)`.
Lines 108-151 controller: insert `const slug = useTripSlug()` as first line; `onMounted` → `indexes.set(slug, createSearchIndex([...]))`; line 144 `useTrip('roma')` → `useTrip(slug)`; watch → `if (indexes.has(slug)) indexes.set(...)`. `onInput` reads `indexes.get(slug)?.search(q) ?? []`. Keep `instanceof Element` guard (WR-03).

### `app/components/TripView.vue` (MOD, lines 62-68)
```ts
const props = defineProps<{ slug: string }>()
const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)
await useCardNavigationController()
```
→ insert `provideTripSlug(props.slug)` right after `defineProps` (before any await); `await useCardNavigationController(props.slug)`. Update stale comment at ~66 ("propio `await useTrip('roma')`").

### `app/components/MonumentCard.vue` (MOD, line 123)
```ts
const NOTE_KEY = `roma-note-${monument.slug}`
```
→ `const NOTE_KEY = tripStorageKey(useTripSlug(), \`note-${monument.slug}\`)`. Keep onMounted read + try/catch (lines 124-130) untouched. Update comment at 119 ("Clave EXACTA `roma-note-<slug>`").

### `shared/schemas.ts` (MOD, line 329)
`slug: z.string(), // 'roma'` → `slug: z.string().regex(/^[a-z0-9]+$/), // D-05`. Keep `import { z } from 'zod'`. Note comment at 332 on reserved `meta` — reuse that rationale.

### `content/trips/prueba/**` (NEW data)
**Analogs:** `content/trips/roma/monuments/spagna.yml` (fields: slug, trip, roman, name, italian, day, coords{lat,lng}, type, motif, hero{src,alt}, sections[{heading, body: >-}], facts, mapsQuery), `content/trips/roma/days/sabado.yml` (slug, trip, order, roman, eyebrow, title, subtitle, stats[{variant,text}], timeline, cards), `content/trips/roma/trip.yml`. Day slugs MUST be `viernes`/`sabado` (TripView.vue:115-149 hardcodes). Avoid any word near "pantheon"/"pante"; sentinel `PRUEBA-CENTINELA-9F3`; hero src `https://example.invalid/prueba.jpg`; `# draft: true` commented line in trip.yml. After editing: `rm -rf .data .nuxt .output`.

### `tests/data/trips.ts` (NEW) — extract from `tests/data/invariants.spec.ts`
Loader to generalize (lines 32-53):
```ts
const ROOT = join(process.cwd(), 'content', 'trips', 'roma')
const glob = (sub: string) => globSync(join(ROOT, sub)).sort()
interface Doc { slug: string, file: string, kind?: string, data: Record<string, unknown> }
function load(sub: string): Doc[] {
  return glob(sub).map((file) => {
    const data = parseYaml(readFileSync(file, 'utf8')) as Record<string, unknown>
    return { slug: String(data?.slug ?? ''), file, kind: data?.kind as string | undefined, data }
  })
}
```
Imports pattern: `node:fs` (`globSync, readFileSync`, add `readdirSync`), `node:path`, `yaml`, `../../shared/schemas`. Move ref rules (invariants.spec.ts:108-169) and anchor extractor + `PAGE_SECTIONS` (line 180) into `checkTrip` returning `Violation{file,rule,message}`; replace PAGE_SECTIONS with FIXED_DOM_IDS list from RESEARCH.

### `tests/data/schema.spec.ts` (MOD)
Current lines 36-48 (`ROOT` roma + `collections` with `expected` counts 1/5/38/26/13/2). Split: `describe.each(listTripDirs())` per-file safeParse with `z.prettifyError` message; keep count `describe` Roma-only (D-12). Keep the existing in-line fixture cases (DATA-05).

### `tests/data/invariants.spec.ts` (MOD)
Becomes thin: `expect(trips).toContain('roma')`; `describe.each(trips)` → `expect(vs, formatViolations(vs)).toEqual([])`; a "la puerta tiene dientes" block with one fixture per rule (RESEARCH Pattern 5 code). Keep existing in-line fixture style.

### `tests/unit/tripStorage.spec.ts` / `searchIsolation.spec.ts` (NEW)
**Analogs:** `tests/unit/pace.spec.ts` lines 1-30 (`import { describe, it, expect } from 'vitest'`, relative import `../../app/utils/pace`, long Spanish JSDoc stating "Vitest plano, sin @nuxt/test-utils", one `it` per case); `tests/unit/searchIndex.spec.ts` lines 1-40 (`createSearchIndex` + `as Monument` fixtures). searchIsolation may load real YAML via `tests/data/trips.ts` loader and build one index per trip; assert "Pantheon" hits roma only, "Fontana" in prueba hits only `fontana-pruebas`.

### `tests/unit/tripCoupling.spec.ts` (NEW, source guardian)
Read `app/composables/use{Search,CardNavigation,TripModes}.ts` + `MonumentCard.vue` with `readFileSync`; assert no `'roma'` literal / no `useState('pace'` un-suffixed / no `roma-note-`. Pattern: Node-pure readFileSync like `tests/data/schema.spec.ts` imports (lines 1-4).

### `tests/trips/isolation.spec.ts` (NEW E2E, NOT in tests/parity/)
**Analogs:** `tests/parity/navigation.spec.ts:173-195`:
```ts
async function gotoHydrated(page) {
  await page.goto(STATIC_URL); await page.waitForLoadState('networkidle')
  await expect(page.locator('#back-btn')).toHaveCount(1)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('.nav-pill.active')).toHaveCount(1)
}
async function navigateToCard(page, href, id) {
  await page.locator(`a.tl-title[href="${href}"]`).first().dispatchEvent('click') // CR-01: never .click()
  await expect(page.locator(`#${id}`)).toHaveClass(/\bhighlight\b/)
}
```
localStorage seeding: `tests/parity/modes.spec.ts:225-227` (`context.addInitScript(() => window.localStorage.setItem('roma-pace','slow'))`). Assert no cross-trip leakage (`prueba-note-spagna` vs `roma-note-spagna`).

### `playwright.trips.config.ts` (NEW)
**Analog:** `playwright.config.ts` (testDir, `webServer {command,url,reuseExistingServer: !process.env.CI}`, `use.baseURL`, projects) — copy shape with `testDir: './tests/trips'`, `webServer.command: 'pnpm dev'`, dev URL. Do NOT extend/modify gate config; `tests/README.md` count "80 tests in 11 files" must stay.

## Shared Patterns

- **Hooks before await** (`useCardNavigation.ts:97-105`, `useSearch.ts:108-140`): read `useTripSlug()` and register `onMounted/onUnmounted` in the sync section; only then `await useTrip(slug)`. Apply to all controllers.
- **Client-only persistence** (`useTripModes.ts:88-103`, `MonumentCard.vue:123-130`): read localStorage in `onMounted`, watches registered inside `onMounted`, try/catch in notes. Exact-key reads only, no iteration/migration.
- **Pure logic in `app/utils/` + Vitest plain** (`pace.ts`, `searchIndex.ts`, `tripIndexes.ts`): no `@nuxt/test-utils` installed.
- **zod import** from `'zod'` only; reserved Content fields (`id`, `meta`, `stem`, `extension`) — top-level only check.
- **Spanish long-form header comments** citing decisions (D-xx) are the codebase convention.

## No Analog Found

| File | Role | Reason |
|---|---|---|
| `app/composables/useTripContext.ts` | provider | No provide/inject in codebase yet; use RESEARCH Pattern 1 |

## Metadata
**Analog search scope:** app/composables, app/components, app/utils, shared, content/trips/roma, tests/{data,unit,parity}, playwright configs
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-20
