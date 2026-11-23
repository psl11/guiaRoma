# Phase 10: Forma y chrome desde datos - Pattern Map

**Mapped:** 2026-11-20
**Files analyzed:** 22 (new + modified)
**Analogs found:** 21 / 22 (all analogs git-tracked)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/utils/tripLayout.ts` (NEW) | utility (pure) | transform | `app/utils/dayLabel.ts`, `app/utils/foodGroups.ts` | exact |
| `app/components/TripView.vue` (MOD) | component (page owner) | request-response (SSR render) | itself (current fixed template) | exact |
| `app/components/Topbar.vue` (MOD) | component | props render | itself | exact |
| `app/components/NavPills.vue` (MOD) | component | props render | itself (day `v-for` lines 72-78) | exact |
| `app/app.vue` (MOD) | config/root | head | itself (`useHead` lines 130-137) | exact |
| `shared/schemas.ts` (MOD) | model (zod) | validation | `TripSchema.mapExtras`/`sections` optional fields (348-362) | exact |
| `content/trips/roma/trip.yml` (MOD) | data | content | `content/trips/roma/trip.yml` itself | exact |
| `content/trips/forma/**` (NEW) | data fixture (dev-only) | content | `content/trips/prueba/**` | exact |
| `tests/data/trips.ts` (MOD) | test gate | validation | itself (`checkTrip`, 178-292) | exact |
| `tests/data/invariants.spec.ts` (MOD) | test | validation | itself (memTrip/expectRule fixtures) | exact |
| `tests/data/schema.spec.ts` (MOD) | test | validation | itself (`puerta DATA-05` fixtures block, line 60+) | exact |
| `tests/data/romaChrome.spec.ts` (NEW) | test (Node-pure) | file-I/O | `tests/data/build-isolation.spec.ts` + `scripts/migration-diff.ts` (cheerio) | role-match |
| `tests/data/build-isolation.spec.ts` (MOD) | test | file-I/O | itself (SENTINEL pattern) | exact |
| `tests/unit/tripLayout.spec.ts` (NEW) | test | transform | `tests/unit/dayLabel.spec.ts` | exact |
| `tests/unit/romaChromeGuard.spec.ts` (NEW) | test (static guard) | file-I/O | `tests/unit/tripCoupling.spec.ts` | exact (but scan whole file, not `scriptOf`) |
| `tests/unit/romaLeaks.spec.ts` (NEW) | test (matcher teeth) | transform | `tests/unit/dayLabel.spec.ts` | role-match |
| `tests/trips/romaLeaks.ts` (NEW) | utility (test helper) | transform | none (pure regex helper) | no analog |
| `tests/trips/shape.spec.ts` (NEW) | E2E test | request-response | `tests/trips/isolation.spec.ts` | exact |
| `tests/README.md` (MOD) | docs | — | §5 «Aislamiento por viaje» | exact |

## Pattern Assignments

### `app/utils/tripLayout.ts` (utility, transform)

**Analog:** `app/utils/dayLabel.ts` (pure, no Nuxt imports; lines 99-106):
```ts
const first = (eyebrow.split('·')[0] ?? '').trim()
return first.charAt(0).toLocaleUpperCase('it') + first.slice(1)
```
**Rules:**
- Only relative value imports (`import { dayLabel } from './dayLabel'`) or `import type`. `vitest.config.ts` has NO alias; a value import of `~~/…` breaks `test:data` (which will import this file from `tests/data/trips.ts`).
- Auto-imported in components (Nuxt scans `app/utils/`), e.g. NavPills already calls `dayLabel(...)` without import.
- Structural labels verbatim from `NavPills.vue:62-103`: `Inicio`, `Mapa`, `Reservas`, `Gastronomía`, `Pratica` (Italian!), `Arte`, `Arquitectura`. Ids = `SECTION_ANCHORS` (`tests/data/trips.ts:51`). Export a constant of structural ids and have `SECTION_ANCHORS` derive from / be asserted against it (anti two-lists).
- Sketch to copy: RESEARCH.md §Code Examples «`app/utils/tripLayout.ts`» (`buildTripLayout`, `dayPillLabel = d.pill || dayLabel(d.eyebrow)`, `inlineMdToPlain`).

---

### `app/components/TripView.vue` (component, SSR render)

**Analog:** itself. Keep verbatim:
- Script order (lines 67-76) — `provideTripSlug(props.slug)` FIRST, before any `await` (enforced by `tripCoupling.spec.ts:144-152`):
```ts
const props = defineProps<{ slug: string }>()
provideTripSlug(props.slug)
const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)
await useCardNavigationController(props.slug)
```
  Add `layout` computed + `useHead({ title: () => trip.value?.pageTitle || plainTitle.value })` AFTER the awaits. Remove `dayBySlug` (line 81).
- `#mapa` chrome (lines 92-122) copied verbatim inside `v-else-if="e.kind === 'mapa'"`; only replace lines 118-120 with `<p v-if="trip?.mapLegend" class="map-legend">{{ trip.mapLegend }}</p>`.
- Five fixed day sections (123-157) → one `<section v-else-if="e.kind === 'day'" :id="e.id"><DaySection :day="e.day!" :mon-by-id="monById" /></section>`.
- Reservas/Gastro/Practica/Arte/Arquitectura blocks (158-236) copied verbatim, each as a `v-else-if` branch inside `<template v-for="e in layout" :key="e.id">`. Sections must stay direct children of `<main>` (no wrapper); never `v-if`+`v-for` on same element.
- MDC idiom to reuse for footer lines (lines 191-195):
```vue
<MDC :value="trip.sections.arte.intro" :tag="false" unwrap="p" />
```
- Footer (245-249) → `<footer v-if="footerLines.length"><div class="container"><p><template v-for="(line, i) in footerLines" :key="i"><br v-if="i > 0"><MDC :value="line" :tag="false" unwrap="p" /></template></p></div></footer>` — no whitespace between `<br>`/MDC.
- `.flourish` (241-243) and `<BackButton />` stay as shared chrome.
- Read optionals with `??`/`||` (Content dumps absent fields as `NULL`).
- No `<style scoped>`; no links to `/trips/*`. Update header comment (lines 1-66) to describe dynamic layout.

---

### `app/components/Topbar.vue` (component)

**Analog:** itself (lines 13-27). Change props from `{ days: Day[] }` to `{ layout, brand, fallbackTitle }`; type import pattern `import type { Day } from '~~/shared/schemas'` (line 13) stays valid for `import type`. Brand markup — keep exactly one space each side of the span:
```vue
<div class="brand">
  <template v-if="brand">{{ brand.before }} <span class="brand-dot">✦</span> {{ brand.after }}</template>
  <template v-else>{{ fallbackTitle }}</template>
</div>
```
Pass `<NavPills :layout="layout" />` (line 26).

---

### `app/components/NavPills.vue` (component)

**Analog:** its own day loop (lines 72-78) generalised to ALL entries; delete the 7 literal anchors:
```vue
<a v-for="e in props.layout" :key="e.id" :href="`#${e.id}`" class="nav-pill"
   :class="{ active: activeSection === e.id }">{{ e.label }}</a>
```
Keep `id="nav-pills" class="nav-pills"` (58-61) and `const { activeSection } = useCardNavigation()` (54).

---

### `app/app.vue` (root/head)

**Analog:** itself, lines 130-137. Remove only `title: 'Roma · 19—23 giugno 2026',` (line 132) and fix the comment at 125; keep `htmlAttrs.lang`, both `theme-color` metas and the favicon `useHead` (116-121).

---

### `shared/schemas.ts` (model)

**Analog:** additive optional fields in `TripSchema` (lines 348-362, e.g. `mapExtras: z.array(...).optional()`, `sections: z.object({...}).optional()`); `Md = z.string()` (line 26). Add to `TripSchema` (334-363): `brand: z.object({ before: z.string(), after: z.string() }).optional()`, `footer: z.array(Md).optional()`, `mapLegend: z.string().optional()`, `pageTitle: z.string().optional()`. `DaySchema` (131-134): `slug: z.string().regex(DAY_SLUG_RE)` with `export const DAY_SLUG_RE = /^[a-z0-9-]+$/` (mirror `TRIP_SLUG_RE` at line 331), `pill: z.string().min(1).optional()`, drop the `// 1..5` comment. Import `z` from `'zod'` only.

---

### `content/trips/forma/**` (dev-only fixture)

**Analog:** `content/trips/prueba/trip.yml` (header comment explaining dev-only, commented `# draft: true`, sentinel string like `PRUEBA-CENTINELA-9F3` in `howTo`) and `content/trips/prueba/days/viernes.yml` (minimal day: `slug, trip, order, roman, eyebrow, title, subtitle, stats, timeline, cards`). Monuments copied in shape from `content/trips/prueba/monuments/*.yml` (≥2 with coords, referenced in some `cards`, else Leaflet `fitBounds` throws). Basename must equal slug (`basename-slug` rule). No words from the trap list in any text. Do NOT touch `content/trips/prueba/`.

---

### `tests/data/trips.ts` (validation gate)

**Analog:** itself.
- Rules list (line 61-63): add `'day-order'`, `'day-pill'` to `RULES` — `invariants.spec.ts:44-49` auto-creates `it.each(RULES)` per trip.
- Violation push idiom (line 180): `const push = (file: string, rule: Rule, message: string) => vs.push({ file, rule, message })`.
- Replace lines 278-289 (`anchorable` from `SECTION_ANCHORS` + blacklist `/trips/`) with: `anchorable = entities slugs + buildTripLayout(presence-from-YAML).map(e => e.id)`; `cross-trip-link` whitelist: target must start with `#` or match `/^https?:\/\//i`.
- `fixed-anchor` (230-233) and `dup-id` (218-227) already cover D-05(a); add fixtures only.
- Import `buildTripLayout`/`dayPillLabel` via relative path `../../app/utils/tripLayout`.

### `tests/data/invariants.spec.ts`

**Analog:** itself — `memTrip(dir, extra, tripOver)` (line 111), `expectRule(vs, rule, file)` (121), `validDay` (66-77). Invert the control at 245-250 (`[x](#reservas)` without reference → now expect `anchor`) and add the positive case with `reference/reservas.yml`. New teeth: non-contiguous order, duplicate derived pill (two `sábado · …` eyebrows), monument `lunes` + day `lunes` → `dup-id`, day slug `mapa` → `fixed-anchor`, `[x](/#pantheon)`, `[x](/guiaRoma/#x)`, `[x](../roma#x)` → `cross-trip-link`.

### `tests/data/schema.spec.ts`

**Analog:** its fixture block `describe('puerta DATA-05 (fixtures, siempre corren)'` (line 60+) and per-file `safeParse` loop (44-58). Add: Roma trip.yml unchanged validates (task 1, D-10); invalid `brand` shape / empty `pill` / bad day slug fail.

### `tests/data/romaChrome.spec.ts` (NEW) and `tests/data/build-isolation.spec.ts` (MOD)

**Analog:** `build-isolation.spec.ts` lines 1-30 — Node-pure, `node:fs` + `join(process.cwd(), …)`, header doc comment, `describe.skipIf(!existsSync(INDEX))`. For romaChrome: read `index.html` (repo root) with cheerio (as `scripts/migration-diff.ts` does) and `content/trips/roma/trip.yml` with `yaml.parse`; compare after whitespace normalisation (`<title>`, `.brand`, `.map-legend`, `footer p`). For build-isolation: add a `FORMA-…` SENTINEL constant alongside `SENTINEL = 'PRUEBA-CENTINELA-9F3'` (line 27).

### `tests/unit/tripLayout.spec.ts` / `tests/unit/romaLeaks.spec.ts` (NEW)

**Analog:** `tests/unit/dayLabel.spec.ts` lines 1-20:
```ts
import { describe, it, expect } from 'vitest'
import { dayLabel } from '../../app/utils/dayLabel'
/** doc block explaining the D-ID covered … */
describe('dayLabel (D-04)', () => { it('venerdì · 19 giugno → Venerdì …', () => { … }) })
```
tripLayout cases: Roma presence → 12 labels exactly `['Inicio','Mapa','Venerdì','Sabato','Domenica','Lunedì','Martedì','Reservas','Gastronomía','Pratica','Arte','Arquitectura']` (from `tests/parity/shell.spec.ts:29-33`); absences drop entries; `pill` overrides; `inlineMdToPlain('Cinque giorni a _Roma_')`. romaLeaks teeth: `'aroma'`/`'Romaña'` → none, `'en Roma.'` → Roma, `'ROYAL COURT'` → Royal Court.

### `tests/unit/romaChromeGuard.spec.ts` (NEW)

**Analog:** `tests/unit/tripCoupling.spec.ts` — reuse header doc style (lines 5-32), `ROOT = process.cwd()`, `stripComments` (46-50, exported → importable). DIFFERENCE (Pitfall 8): do NOT use `scriptOf` (52-57, scripts only) and do not limit to `SCANNED_DIRS` (36-40): walk all of `app/**/*.{vue,ts}` incl. `app/app.vue` and `app/pages/`, strip JS comments + `/<!--[\s\S]*?-->/g`. Literals: `giugno MMXXVI`, `concierto Einaudi`, `19—23 giugno 2026`, `dos colegas`. Teeth with synthetic strings, never mutate files.

### `tests/trips/shape.spec.ts` (NEW)

**Analog:** `tests/trips/isolation.spec.ts` lines 1-60 — copy `ORIGIN`, URL constants (`${ORIGIN}/guiaRoma/trips/forma`), `blockExternal`, `newIsolatedPage` (own context per test), header doc block; self-contained (no imports from `tests/parity/`). Runs via `playwright.trips.config.ts` (testDir `./tests/trips`, already picks it up). Use `[id="…"]`/`getElementById`, not `#slug` selectors; assert render before scanning (10 day pills in forma); verify pills by `href` + section existence + `location.hash`, not `.active` on last days.

## Shared Patterns

- **No scoped CSS / verbatim chrome:** all components (`TripView.vue:51-54`, `Topbar.vue:10-12`). Zero new CSS.
- **Markdown-inline:** `<MDC :value :tag="false" unwrap="p" />` (`TripView.vue:191-195`); YAML lines as single-quoted scalars, `_x_` for emphasis.
- **Pure utils + plain Vitest:** relative imports from tests (`tests/unit/dayLabel.spec.ts:2`).
- **Header doc comments in Spanish** citing D-IDs, on every new spec/util.
- **Process:** Node 22 on PATH; `rm -rf .data .nuxt .output` after YAML/schema edits; never modify `tests/parity/` or goldens.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `tests/trips/romaLeaks.ts` | test helper | transform | No shared non-spec helpers exist under `tests/trips/`; use RESEARCH Pitfall 7 regex `(?<![\p{L}\p{N}])(?:…)(?![\p{L}\p{N}])` with `iu` flags |

## Metadata

**Analog search scope:** `app/components`, `app/utils`, `app/app.vue`, `shared/`, `content/trips/`, `tests/{data,unit,trips}`, `playwright.trips.config.ts`, `package.json`
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-20
