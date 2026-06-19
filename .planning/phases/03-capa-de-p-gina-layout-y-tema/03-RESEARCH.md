# Phase 3: Capa de página, layout y tema - Research

**Researched:** 2026-06-19
**Domain:** Nuxt 4 page-aggregation layer (`useTrip` + `queryCollection`/SSG) + layout shell (verbatim editorial CSS) + FOUC-free theme (`@nuxtjs/color-mode`). Migration / parity-by-construction phase.
**Confidence:** HIGH — every load-bearing API was verified by direct inspection of the installed packages in `node_modules` (the most authoritative source for the exact pinned versions), cross-checked against official docs.

<user_constraints>
## User Constraints (from CONTEXT.md)

> This is a **parity-by-construction** phase. The stack, the theme module config, the CSS, and the data are ALL already decided/migrated by Fases 1-2. Research is HOW-TO-IMPLEMENT mechanics, not library selection.

### Locked Decisions

**Inherited & LOCKED by prior phases / research (do not reopen):**
- **Theme already configured** in `nuxt.config.ts` (Fase 1): `colorMode: { preference:'system', fallback:'light', dataValue:'theme', storageKey:'roma-theme', classSuffix:'' }`. The `[data-theme]` contract (on `<html>`) is already the same selector as the verbatim editorial CSS. Do NOT reconfigure the module; consume it.
- **Data migrated 1:1** (Fase 2): 6 zod collections in `shared/schemas.ts` + `content.config.ts`. The stable anchor is **`slug`** (= `#id` in `index.html`, = file basename), **never `id`** (reserved Content field). `useTrip` aggregates over these types.
- **Verbatim editorial CSS** (Fase 1) in `app/assets/css/{tokens,base,leaflet}.css` already defines `.topbar` (sticky), `.topbar-inner`, `.brand`, `.theme-btn` (+ icon rules by `[data-theme]`), `.nav-pills`/`.nav-pill`, `.back-btn` (fixed + `.back-btn.show`), footer. **Parity by construction**: components only reproduce this markup/classes; they write NO new CSS.
- **`index.html` untouched** at repo root = golden source & shell parity reference (do not modify).

**Área 1 — Routing & multi-trip scope (ARCH-01/ARCH-02):**
- **D-01:** The 1.0 **only generates `/`**. `app/pages/index.vue` renders `<TripView slug="roma" />`. ALSO create `app/pages/trips/[slug].vue` reusing the same `TripView` (the "structure `/trips/[slug]` ready" of ARCH-02), but **no `/trips/*` route is prerendered** in 1.0 — `nitro.prerender.routes` stays `['/']` and there are no internal links for `crawlLinks` to follow toward `/trips/*`. Result: zero duplicate content, zero canonical ambiguity, golden (captured at `/`) stays the only real page.
- **D-02:** The default trip for `/` is **`'roma'` hardcoded** in `pages/index.vue` (not "first trip of the collection" nor config). `/` is by design the "Roma home"; a future trip (v2) lives at `/trips/<slug>` without touching the home.

**Área 2 — NavPills: fixed shell vs data-derived (UI-01/ARCH-01):**
- **D-03:** **Hybrid** pill bar. The **structural** pills (Inicio, Mapa, Reservas, Gastronomía, Pratica, Arte, Arquitectura) are **declared in the `NavPills` component** (fixed page structure, not data entities). The **day** pills are **derived from `useTrip().days`** sorted by `day.order`. So adding/removing a day (= adding a `days/*.yml` file) updates the nav **without touching code** — satisfies ARCH-01 where content actually varies.
- **D-04:** The **Italian label** of the day pill (Venerdì/Sabato/Domenica/Lunedì/Martedì) is **derived from the day's `eyebrow`**: first word before the `·`, capitalized (`venerdì · 19 giugno` → `Venerdì`). **Verified 1:1** for all 5 days (zero changes to Fase 2 data). The pill `href` = `'#' + day.slug` (= `#viernes`, parity anchor). **DO NOT** add a `navLabel` field to the schema (prefer deriving over touching `shared/schemas.ts` + the 5 files).
- **Explicit boundary:** `.nav-pill.active` highlight & the `+130` scrollspy are **FEAT-05 → Fase 5**. In F3 pills render **without** that logic (plain `<a href="#…">` anchors).

**Área 3 — F3 content boundary: what `TripView` mounts:**
- **D-05:** `TripView` **owns the page structure**: mounts the shell and **all** page-sections with their `id`/anchors (#inicio, #mapa, #viernes…#martes, #reservas, #gastronomia, #practica, #arte, #arquitectura) so nav, the (future) scrollspy and **layout parity** work. Fills **trip-level** content; leaves **card/timeline (F4)**, **map #mapa (F7)** and **reference sections (F4)** content as **placeholders carrying their `id`**. F4/F7 plug into the existing slots.
- **D-06:** The **full #inicio** is rendered in F3: masthead (decoration, `<h1>` with `<em>`, meta, quote) **+ the info-cards grid (`trip.infoCards`) + the "¿Cómo usar esta guía?" block (`trip.howTo`)**. All trip-level content (lives in `trip.yml`); F4 does NOT claim it.
- **D-07:** The **`BackButton` is created in F3 as a visual shell**, with exact markup (`button.back-btn`, arrow `←`, text "Volver", `aria-label="Volver"`), **mounted but hidden** by default (no `.show` class). Its **behavior** (back-stack + scroll restore, `.show` management) is wired in **Fase 5** (`useCardNavigation`). At rest it is invisible → golden of home unaffected.

**Área 4 — Light/dark theme without FOUC (FEAT-01):**
- **D-08:** The `ThemeToggle` is **2-state** (light↔dark), reproducing `toggleTheme()`/`setTheme()` 1:1: on click, **invert the current RESOLVED theme** (`$colorMode.value`) and set `$colorMode.preference` to `'light'`/`'dark'` — **never write `'system'`**. The **first visit** uses `preference:'system'` + `fallback:'light'`. Keep the `roma-theme` key, so the theme saved by the live version stays valid.
- **D-09:** **Full parity head.** Replicate verbatim: `htmlAttrs.lang='es'`, `<title>Roma · 19—23 giugno 2026</title>` and the **two** `<meta name="theme-color" media="(prefers-color-scheme: …)">` (index.html lines 6-7). These metas are **independent of color-mode**. The color-mode anti-FOUC script is already injected in `<head>` (verify it appears in generated HTML — SC#3).
- **D-10:** (Locked by **SC#4**) `ThemeToggle` markup **verbatim**: `button.theme-btn` with `<span class="moon">☾</span><span class="sun">☀</span>`. The icon is resolved **only by CSS** (`[data-theme="light"] .theme-btn .moon{display:block}` … lines 957-960), with NO `v-if` per theme in the template. The `onclick="toggleTheme()"` becomes `@click` applying D-08.

### Claude's Discretion (research/planner decide; no user input required)
- **Exact return shape of `useTrip`**: how it exposes the "id indexes" (e.g. `Map`/`Record` by id for `monuments`/`food`/`artists`/`reference` + ordered arrays for `days` + the `trip` object), plus access helpers (card by id, day by slug). Hard constraint: satisfy **SC#1** (aggregate the 6 collections + id indexes) and resolve **at build/SSG** (`queryCollection` prerendered; works offline).
- **Component structure**: whether the fixed chrome lives in `app/layouts/default.vue` (with `<NuxtPage/>`) vs `app.vue` vs inside `TripView`; exact component names (`Topbar`/`NavPills`/`BackButton`/`ThemeToggle`/`TheHero`…) and composables. Constraint: **UI-01** (Topbar/NavPills componentized & identical) + the shell reuses verbatim CSS untouched.
- **Look/height of placeholders** for #mapa and day/reference sections (must not break scroll or divert parity layout). Keep them minimal.
- **Exact `eyebrow → label` transform mechanics** (`split('·')[0].trim()` + locale-safe initial capitalization) and where it lives (pure testable helper).
- **How `pages/trips/[slug].vue` is wired** even though it isn't prerendered: validate `slug` against the `trip` collection, behavior for a nonexistent slug (404), and ensure it introduces no prerender routes by accident.
- Content of the current `app.vue` (`#scaffold`, Fase 1): **replaced** by the real page structure (preserving the favicons with baseURL already resolved in `app/app.vue`).

### Deferred Ideas (OUT OF SCOPE)
None — the discussion stayed within the F3 scope. (Product deferrals — backend/auth/uploads, PWA, a second real trip — stay in `.planning/STATE.md` ▸ Deferred Items and `REQUIREMENTS.md` ▸ v2. The **second real trip** is what would truly exercise `pages/trips/[slug].vue`, which in 1.0 stays as ready-structure but with no content of its own.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **ARCH-01** | The page renders a trip from its data via `useTrip(slug)`; adding a new trip = adding content files, no code changes | §`useTrip` aggregation pattern; §Architecture Patterns (Pattern 1, 2); the `queryCollection('x').where('trip','=',slug)` filter + the day-pill derivation (D-03/D-04) are the two places where "data, not code" is actually exercised |
| **ARCH-02** | Routing ready for multi-trip (`/` = Roma default; `/trips/[slug]` structure ready) reusing one `TripView` | §Routing mechanics; `pages/index.vue` (hardcoded `roma`) + `pages/trips/[slug].vue` (param→`useTrip`→404 guard); D-01 prerender-scope rule |
| **UI-01** | Layout / Topbar / NavPills componentized and visually identical to today | §Shell markup contract (verbatim from `index.html` + `base.css`); §Component Responsibilities; "no `<style scoped>` for cross-component selectors" pitfall |
| **FEAT-01** | Light/dark theme with `@nuxtjs/color-mode` (`data-theme`, `storageKey:'roma-theme'`), respects `prefers-color-scheme`, no FOUC in static | §Theme consumption API (verified from installed module source); §Anti-FOUC mechanism & how to assert it (SC#3); D-08/D-10 toggle + CSS-only icon |
</phase_requirements>

## Summary

This phase has **zero library-selection risk**: the stack is locked, every package is already installed (Fase 1/2), the editorial CSS is already in the repo verbatim, and the 6 zod collections are already migrated. The research therefore answers only the *mechanics* the planner needs, and every load-bearing claim was verified by reading the **actual installed package source** in `node_modules` — not training memory.

Three mechanics dominate:
1. **`useTrip(slug)` aggregation.** Use `@nuxt/content` v3 `queryCollection('<name>')` (chainable `.where(field, op, value).order(field,'ASC').all()/.first()`) wrapped in `useAsyncData` with a **unique key per (collection, slug)**. Filter each collection by `.where('trip','=',slug)`; order `day`/`reference` by `order ASC`. Build id-indexed `Map`s (computed) for O(1) cross-ref resolution, keep the `days` array ordered, and return everything as refs/computed. In SSG (`nuxt generate`) these queries resolve **at prerender** against the build-time SQLite dump and are served as static assets → offline-friendly, no server. (Fase 1 already proved this: `better-sqlite3` is the build-time connector and the deployed site is 100% static.)
2. **FOUC-free theme.** Consume `useColorMode()` (auto-imported by the module) → returns `{ preference, value, unknown, forced }`. The toggle (D-08) reads the **resolved** `colorMode.value` and writes `colorMode.preference = value === 'dark' ? 'light' : 'dark'`. The anti-FOUC inline script is injected by the module's **Nitro `render:html` hook**, so it lands in the generated `<head>` during prerender — **SC#3 is asserted by grepping the built `index.html`** for the script that does `setAttribute("data-theme", …)` reading `roma-theme`. The luna/sol icon is CSS-only (SC#4): both spans always render, `[data-theme] .theme-btn .moon/.sun { display }` shows one — never `v-if`.
3. **Layout/page wiring.** Put the fixed chrome (Topbar/NavPills/BackButton/footer) in `app/layouts/default.vue` with `<slot/>`; `app.vue` becomes `<NuxtLayout><NuxtPage/></NuxtLayout>` (keeping its favicon `useHead`). `pages/index.vue` renders `<TripView slug="roma" />`; `pages/trips/[slug].vue` reads the param, calls `useTrip(slug)`, and `throw createError({ statusCode: 404, fatal: true })` if the trip doesn't exist. `prerender.routes` stays `['/']` and in-page `#anchors` use history routing (fragments, not routes) under `app.baseURL='/guiaRoma/'`.

**Primary recommendation:** Build the page layer first (`useTrip` + `TripView` + layout + pages + section scaffold), then the theme (toggle + parity head), keeping every component a verbatim reproduction of the existing markup/classes with no new CSS. The single highest-value test is the SC#3 anti-FOUC assertion against the generated HTML; the second is the pure `eyebrow→label` helper unit test.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Aggregate trip data (`useTrip`) | Build/SSG (prerender) | — | `queryCollection` resolves against the Content SQLite dump at `nuxt generate`; result is embedded/static → offline. No runtime server in 1.0. |
| Routing (`/`, `/trips/[slug]`) | Frontend (Nuxt pages, history routing) | Build/SSG (which routes get prerendered) | `pages/` file routing; only `/` is prerendered (D-01). |
| Fixed chrome (Topbar/NavPills/BackButton) | Frontend (Vue components in a layout) | — | Pure presentational reproduction of verbatim CSS; no data fetch except the derived day pills. |
| Theme resolution before paint (anti-FOUC) | Browser (inline `<head>` script) | Build/SSG (script injected at prerender via Nitro `render:html`) | Static HTML cannot know `localStorage`/`prefers-color-scheme` at build → an inline script must set `data-theme` before first paint. This is exactly why a hand-rolled theme would flash. |
| Theme toggle reactivity (`$colorMode`) | Browser (client plugin / `useState`) | — | `useColorMode()` is reactive client state; `data-theme` is kept in sync via `htmlAttrs`. |
| Day-pill label derivation | Frontend (pure helper, runs in render) | — | Pure string transform on `day.eyebrow`; testable in isolation, no DOM/IO. |

## Standard Stack

> **All packages are already installed** (Fase 1/2). F3 introduces **no new runtime dependency**. The only stack *gap* is component-test tooling (see Validation Architecture ▸ Wave 0).

### Core (already present, consumed by F3)
| Library | Version (installed) | Purpose in F3 | Why standard |
|---------|---------|---------|--------------|
| **nuxt** | **4.4.8** | Pages, layouts, `<NuxtPage>`/`<NuxtLayout>`, `useHead`, `useAsyncData`, `createError`, history routing | Locked by project; SSG via `nitro.prerender` `[CITED: package.json]` |
| **@nuxt/content** | **3.14.0** | `queryCollection(...)` aggregation in `useTrip`; data resolves at prerender | The data layer chosen in CLAUDE.md `[VERIFIED: node_modules client.d.ts]` |
| **@nuxtjs/color-mode** | **4.0.1** | `useColorMode()` consumption + the auto-injected anti-FOUC `<head>` script | FOUC-safe SSG theming with `data-theme` `[VERIFIED: node_modules nitro-plugin.js + script.min.js]` |
| **zod** | **4.4.3** | Source of the TS types (`Trip`, `Day`, …) that `useTrip`'s return is typed against | Already the schema source `[CITED: shared/schemas.ts]` |

### Supporting (no new install for F3)
| Library | Version | Purpose | When used |
|---------|---------|---------|-----------|
| **@nuxt/fonts** | 0.14.0 | Self-hosted Cormorant/Lora/JetBrains Mono (already configured) | Passive — fonts already wired; F3 chrome uses them via existing CSS `[CITED: nuxt.config.ts]` |
| **@types/leaflet** | 1.9.21 | (not used in F3; #mapa is an empty placeholder until F7) | — |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Chrome in `layouts/default.vue` | Chrome inside `TripView` (no layout) | Layout is the idiomatic home for cross-page chrome and gives `/` and `/trips/[slug]` the same shell for free; putting it in `TripView` couples shell to the trip component. **Use a layout.** (Discretion, but layout is the lower-risk choice.) |
| `useColorMode()` directly in `ThemeToggle` | wrap in a `useTheme()` composable | A thin wrapper only helps if you need to pin the API; not required. Either is acceptable; direct use is simplest. |
| `provide/inject` the trip to children | props drilling | For F3 the only data consumers are `NavPills` (day pills) and `#inicio` (trip-level). Props are fine; `provide(TripKey)` becomes valuable when F4 adds many deep consumers. Either works; document the choice so F4 follows it. |

**Installation:** No new packages. (If component testing is added — see Wave 0 — install `@nuxt/test-utils@^4`, `@vue/test-utils`, `happy-dom` as devDependencies; project research already vetted `@nuxt/test-utils@4.0.3` + `vitest@4.1.9`.)

**Version verification:** All versions above were read directly from the installed tree (`package.json` + `node_modules/*/package.json`), so they are the exact pinned versions in use — not registry-latest, not training data.

## Package Legitimacy Audit

> F3 installs **no new external packages** — it consumes packages already vetted and installed in Fase 1/2. The audit below records the F3-relevant subset for completeness. slopcheck was not run because no install occurs in this phase; each package is a long-established, high-download package already present and exercised by passing Fase 1/2 tests.

| Package | Registry | Age | Source Repo | Disposition |
|---------|----------|-----|-------------|-------------|
| nuxt 4.4.8 | npm | mature (4.x stable) | github.com/nuxt/nuxt | Approved (already installed) |
| @nuxt/content 3.14.0 | npm | mature | github.com/nuxt/content | Approved (already installed; exercised by Fase 2 tests) |
| @nuxtjs/color-mode 4.0.1 | npm | mature | github.com/nuxt-modules/color-mode | Approved (already installed) |
| zod 4.4.3 | npm | mature | github.com/colinhacks/zod | Approved (already installed) |

**Packages removed due to slopcheck [SLOP] verdict:** none (no install in this phase).
**Packages flagged as suspicious [SUS]:** none.
**If component-test tooling is added (Wave 0):** `@nuxt/test-utils`, `@vue/test-utils`, `happy-dom` are official Nuxt/Vue testing packages; the planner should still gate the install behind the normal review, but they carry no legitimacy concern.

## Architecture Patterns

### System Architecture Diagram

```
content/trips/roma/*.yml  (6 collections, validated by zod, slug = anchor)
        │  queryCollection('<name>').where('trip','=',slug)[.order('order','ASC')].all()/.first()
        │  wrapped in useAsyncData('<name>-<slug>', …)   [RESOLVED AT PRERENDER → static]
        ▼
   useTrip(slug)  ──► { trip, days(ordered), monuments, food, artists, reference,
        │               monById, foodById, artistById, refById,  (computed Maps)
        │               dayBySlug?, cardById? helpers }                (all refs/computed)
        │
        ├─ pages/index.vue        → <TripView slug="roma" />        (only route prerendered)
        └─ pages/trips/[slug].vue → const slug = route.params.slug
                                     useTrip(slug); if !trip → createError(404)
                                     <TripView :slug="slug" />      (NOT prerendered; D-01)
        ▼
   layouts/default.vue   (FIXED CHROME — wraps every page via <NuxtLayout>)
        │   ┌── Topbar ── brand + <ThemeToggle/>  →  useColorMode()  ──┐
        │   │                                                          │  $colorMode.value (resolved)
        │   ├── NavPills ── [Inicio, Mapa] + days.map(pill) + [Reservas…]   ← useTrip().days (D-03/D-04)
        │   ├── BackButton (mounted, hidden; behavior = F5)            │
        │   └── <slot/>  ── <TripView>                                 │
        ▼                                                              ▼
   TripView   (owns ALL page sections + their #anchors; D-05)    @nuxtjs/color-mode
        ├─ <section id="inicio">  FULL: hero + info-grid + how-to (D-06, from trip.yml via <MDC>)
        ├─ <section id="mapa">         placeholder + id   (F7)
        ├─ <section id="viernes"…"martes">  placeholder + id ×5  (F4)
        └─ <section id="reservas"…"arquitectura">  placeholder + id  (F4)

   [anti-FOUC]  Nitro render:html hook (color-mode) pushes <script> into <head>
                → present in generated .output/public/index.html  (SC#3 assertion target)
                → script reads roma-theme / prefers-color-scheme, setAttribute('data-theme', …) BEFORE paint
```

### Recommended Project Structure (delta for F3)
```
app/
├── app.vue                 # REPLACE #scaffold body → <NuxtLayout><NuxtPage/></NuxtLayout> (keep favicon useHead)
├── layouts/
│   └── default.vue         # NEW — Topbar + NavPills + BackButton + footer + <slot/>
├── pages/
│   ├── index.vue           # NEW — <TripView slug="roma" />
│   └── trips/
│       └── [slug].vue      # NEW — param → useTrip → 404 guard → <TripView :slug>
├── components/             # NEW (names = Claude's Discretion; suggested below)
│   ├── Topbar.vue
│   ├── NavPills.vue
│   ├── ThemeToggle.vue
│   ├── BackButton.vue
│   ├── TripView.vue        # owns the section scaffold (D-05)
│   └── TheHero.vue         # the #inicio block (D-06)  [optional split]
├── composables/
│   └── useTrip.ts          # NEW — aggregates 6 collections + id Maps
└── utils/
    └── dayLabel.ts         # NEW — pure eyebrow→label helper (D-04), auto-imported
```
> NOTE on auto-import naming: Nuxt prefixes nested component dirs into the name (`components/layout/Topbar.vue` → `<LayoutTopbar>`). The dir layout above keeps components flat so names match the markup contract (`<Topbar>`, `<NavPills>`). If you nest by domain (as the project ARCHITECTURE.md sketch does), expect prefixed names — pick one convention and keep it.

### Pattern 1: `useTrip(slug)` — aggregate 6 collections, index by id, resolve at SSG
**What:** one composable returns the whole active trip as typed refs/computed, with id-indexed Maps for O(1) cross-ref resolution.
**When to use:** the single data entry point for `/` and `/trips/[slug]` (and F4-F7 consumers).
**Verified API:** `queryCollection(name)` returns a `CollectionQueryBuilder` (a `ChainablePromise`) exposing `.where(field, operator, value)`, `.order(field, 'ASC'|'DESC')`, terminal `.all()` / `.first()`. `useAsyncData(key, fn)` requires a **unique key**.

```ts
// app/composables/useTrip.ts
// Source: @nuxt/content client.d.ts (queryCollection signature) + content.nuxt.com/docs/utils/query-collection
export async function useTrip(slug: string) {
  const [trip, days, monuments, food, artists, reference] = await Promise.all([
    useAsyncData(`trip-${slug}`,  () => queryCollection('trip').where('slug', '=', slug).first()),
    useAsyncData(`days-${slug}`,  () => queryCollection('day').where('trip', '=', slug).order('order', 'ASC').all()),
    useAsyncData(`mon-${slug}`,   () => queryCollection('monument').where('trip', '=', slug).all()),
    useAsyncData(`food-${slug}`,  () => queryCollection('food').where('trip', '=', slug).all()),
    useAsyncData(`art-${slug}`,   () => queryCollection('artist').where('trip', '=', slug).all()),
    useAsyncData(`ref-${slug}`,   () => queryCollection('reference').where('trip', '=', slug).order('order', 'ASC').all()),
  ])

  // Id indexes for O(1) cross-ref (timeline.ref, day.cards[], seenIn…). Keyed by `slug` (the stable anchor).
  const monById  = computed(() => new Map((monuments.data.value ?? []).map(m => [m.slug, m])))
  const foodById = computed(() => new Map((food.data.value      ?? []).map(f => [f.slug, f])))
  const artById  = computed(() => new Map((artists.data.value   ?? []).map(a => [a.slug, a])))
  const refById  = computed(() => new Map((reference.data.value ?? []).map(r => [r.slug, r])))

  return {
    trip: trip.data, days: days.data,
    monuments: monuments.data, food: food.data, artists: artists.data, reference: reference.data,
    monById, foodById, artById, refById,
  }
}
```
> **Field-name caveat (verify when implementing):** the schemas use **`slug`** as the entity key (`shared/schemas.ts`: `DaySchema.slug`, `TripSchema.slug`, `FoodSchema.slug`). The `where('trip','=',slug)` filter assumes every collection has a `trip` field — confirmed present in `DaySchema` (`trip: z.string()`). Verify `monument`/`food`/`artist`/`reference` schemas also carry `trip` (the ARCHITECTURE.md sketch and Fase 2 decisions say they do; the planner must confirm against `shared/schemas.ts` before writing the query). If a collection lacks `trip`, either add the filter differently or rely on the single-trip reality of 1.0. `[ASSUMED — verify against shared/schemas.ts]`
> **Why id Maps as `computed`, not eager:** `useAsyncData().data` is a ref; the Maps must recompute if data changes (and stay valid through hydration). For SSG they're computed once at prerender.

### Pattern 2: NavPills hybrid render (D-03/D-04)
**What:** structural pills are literal template anchors; day pills are derived from `useTrip().days` (already ordered ASC) and labelled from `eyebrow`.
**When:** UI-01 + the one place ARCH-01 ("data, not code") is actually exercised in F3.
```vue
<!-- app/components/NavPills.vue -->
<script setup lang="ts">
import type { Day } from '~~/shared/schemas'           // ~~ = rootDir (shared/ is at root)
const props = defineProps<{ days: Day[] }>()
// dayLabel is auto-imported from app/utils/dayLabel.ts (pure helper — see Code Examples)
</script>
<template>
  <nav class="nav-pills" id="nav-pills">
    <a href="#inicio" class="nav-pill">Inicio</a>
    <a href="#mapa" class="nav-pill">Mapa</a>
    <a v-for="d in props.days" :key="d.slug" :href="`#${d.slug}`" class="nav-pill">{{ dayLabel(d.eyebrow) }}</a>
    <a href="#reservas" class="nav-pill">Reservas</a>
    <a href="#gastronomia" class="nav-pill">Gastronomía</a>
    <a href="#practica" class="nav-pill">Pratica</a>
    <a href="#arte" class="nav-pill">Arte</a>
    <a href="#arquitectura" class="nav-pill">Arquitectura</a>
  </nav>
</template>
```
> **Order is LOCKED** (UI-SPEC): `[Inicio, Mapa]` + 5 day pills (by `order` 1→5) + `[Reservas, Gastronomía, Pratica, Arte, Arquitectura]` — matches `index.html:2265-2276`. Keep `id="nav-pills"` (F5 scrollspy targets it). No `.active`, no scrollspy in F3.

### Pattern 3: Theme toggle (D-08) + CSS-only icon (D-10/SC#4)
**What:** consume `useColorMode()`; toggle inverts the **resolved** value and writes `preference`; icon is pure CSS.
**Verified API:** `useColorMode()` returns `useState("color-mode").value`, an object `{ preference: string (writable), value: string (readonly, resolved), unknown: boolean, forced: boolean }`.
```vue
<!-- app/components/ThemeToggle.vue -->
<script setup lang="ts">
const colorMode = useColorMode()                      // auto-imported by @nuxtjs/color-mode
function toggle() {
  // invert the RESOLVED theme; set preference to a concrete value — NEVER 'system' (D-08)
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
<template>
  <button class="theme-btn" aria-label="Cambiar tema" @click="toggle">
    <span class="moon">☾</span><span class="sun">☀</span>   <!-- both ALWAYS render; CSS shows one -->
  </button>
</template>
```
> The CSS at `base.css:58-61` (`[data-theme="light"] .theme-btn .moon{display:block}` etc.) does the icon switching. **No `v-if`/`v-show` keyed on theme** (SC#4) — that would reintroduce FOUC and a hydration mismatch.
> **`aria-label` parity:** `index.html:2260` uses `aria-label="Cambiar tema"`. (UI-SPEC copy table also lists this. Use exactly that string.)

### Pattern 4: Pages + 404 guard for `[slug]` without prerendering it (D-01)
```vue
<!-- app/pages/index.vue -->
<template><TripView slug="roma" /></template>      <!-- D-02: 'roma' hardcoded -->
```
```vue
<!-- app/pages/trips/[slug].vue -->
<script setup lang="ts">
const slug = useRoute().params.slug as string
const { trip } = await useTrip(slug)
if (!trip.value) {
  throw createError({ statusCode: 404, statusMessage: 'Trip not found', fatal: true })
}
</script>
<template><TripView :slug="slug" /></template>
```
> **Why this stays out of prerender (D-01):** `nitro.prerender.routes` is `['/']` and `crawlLinks:true` only follows real `<a href>` links. The whole app is in-page `#anchors` (fragments, not routes) → nothing links to `/trips/*` → Nitro never discovers it → only `/` is generated. **Do not add a `<NuxtLink to="/trips/roma">` anywhere**, or `crawlLinks` would pull `/trips/roma` into the prerender and create duplicate content. `[VERIFIED: nuxt.config.ts prerender config + CITED: content.nuxt PITFALLS §5]`
> `createError` usage confirmed `[CITED: nuxt.com/docs/4.x/api/utils/create-error]`. `fatal:true` renders the full error page client-side; on the (non-prerendered) `/trips/[slug]` route the 404 only matters at runtime/dev since the route is never built.

### Pattern 5: Parity head (D-09) — set via `useHead`, preserve favicon pattern
```ts
// In app.vue (alongside the existing favicon useHead) OR in layouts/default.vue
useHead({
  htmlAttrs: { lang: 'es' },                                           // index.html:2
  title: 'Roma · 19—23 giugno 2026',                                   // index.html:8
  meta: [
    { name: 'theme-color', content: '#1a1612', media: '(prefers-color-scheme: dark)' },   // index.html:6
    { name: 'theme-color', content: '#f5f0e8', media: '(prefers-color-scheme: light)' },  // index.html:7
  ],
})
```
> Keep the existing `app/app.vue` favicon `useHead` (`useRuntimeConfig().app.baseURL` → `/guiaRoma/favicon.svg`). **Do NOT** regress to `app.head.link` — Nuxt won't prefix `baseURL` and `/favicon.svg` would 404 under the subpath (a Fase 1 decision; STATE.md). The two `theme-color` metas are independent of color-mode (browser-chrome color per OS scheme).

### Anti-Patterns to Avoid
- **`<style scoped>` on the shell components:** the editorial CSS is global and uses cross-component selectors (`.topbar-inner .theme-btn { grid-column:3 }`, `[data-theme] .theme-btn .moon`). `scoped` adds `data-v-*` attributes that change specificity and **break these selectors silently** → parity drift. Reproduce markup with the existing classes; write NO new CSS. (PITFALLS §4.)
- **`v-if="colorMode.value==='dark'"` for the icon:** reintroduces theme FOUC (system preference unknown at prerender) and hydration mismatch. Icon is CSS-only (SC#4). (PITFALLS §2.)
- **Reading `localStorage`/`window` in `<script setup>` for the theme:** unnecessary — the module's inline script + `$colorMode` handle it. Hand-rolling reintroduces the exact flash this phase must avoid.
- **A `<NuxtLink to="/trips/...">` in 1.0:** pulls `/trips/*` into the prerender via `crawlLinks` → duplicate content, breaks D-01.
- **Giving placeholders a fixed height that diverts scroll:** keep them as real empty `<section id="…">` so `section{padding:3rem 0}` + `section+section{border-top}` apply naturally (UI-SPEC); a tall placeholder shifts every anchor offset and breaks the future scrollspy.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Apply saved theme before first paint (no FOUC) | A custom inline `<head>` script reading `localStorage` | `@nuxtjs/color-mode` (already injects it via Nitro `render:html`) | The module's script handles storage + `matchMedia` + `data-theme` + the forced-mode edge case; a hand-rolled copy is the documented FOUC trap. `[VERIFIED: node_modules nitro-plugin.js + script.min.js]` |
| Reactive theme state across components | `useState('theme')` + manual `setAttribute` + persistence | `useColorMode()` | Returns the shared reactive `{preference,value,…}` and keeps `<html data-theme>` in sync; reimplementing duplicates the module exactly. `[VERIFIED: node_modules composables.js]` |
| Fetch + cache the trip data at build | `fetch('/content/...json')` / `useState` data store | `queryCollection(...)` + `useAsyncData` | Typed, prerendered, offline, dedup-cached by key. `[CITED: content.nuxt.com]` |
| Light/dark icon swap | JS toggling `display` / `v-if` | CSS `[data-theme] .theme-btn .moon/.sun` (already in base.css) | SC#4 mandate; CSS-only = no FOUC, no mismatch. `[CITED: base.css:957-960]` |
| Head/meta management | manual `document.title` / `<head>` mutation | `useHead({...})` | SSR/SSG-safe, dedup; D-09 parity head. `[CITED: nuxt.com]` |

**Key insight:** In a static Nuxt app, the *only* thing that legitimately needs an inline pre-paint script is the theme — and the module already provides it. Everything else in F3 is declarative Vue + the verbatim CSS that already exists.

## Runtime State Inventory

> This is a build-the-page-layer phase, not a rename/migration. It introduces new files (components/composables/pages) and **replaces the `app.vue` `#scaffold` body**. No stored data, live-service config, OS-registered state, or secrets are renamed. Recorded for completeness:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — `localStorage['roma-theme']` is *consumed* (read by the color-mode script) but its key is unchanged and already configured. No data is migrated. | None |
| Live service config | None — no external service touched. | None |
| OS-registered state | None. | None |
| Secrets/env vars | `NUXT_APP_BASE_URL=/guiaRoma/` is used at build (CI), unchanged; no new env var. | None |
| Build artifacts | The Content SQLite dump is regenerated each build; `app.vue` `#scaffold` content is replaced (not an artifact, a source edit). | None — verified by `pnpm dev`/`generate` after the edit |

**Nothing found requiring data migration.** The only "replace" is `app.vue`'s template body, which is a source edit, not runtime state.

## Common Pitfalls

### Pitfall 1: Theme FOUC in the static build (the headline risk for FEAT-01 / SC#3)
**What goes wrong:** if the theme were applied in `onMounted` (post-paint), a user with `roma-theme=dark` would see a white flash before JS switches to dark.
**Why it happens:** `nuxt generate` paints the build snapshot first; any `localStorage`/`matchMedia` read happens after.
**How to avoid:** rely on the already-configured `@nuxtjs/color-mode`. Verify (do not assume) that the **inline script is present in the generated `<head>`** — the module injects it via a Nitro `render:html` hook (`htmlContext.head.push('<script>…</script>')`), which fires during prerender. Add NO custom theme script. Keep the icon CSS-only.
**Warning signs:** flash on reload with `roma-theme=dark`; the generated `index.html` `<head>` lacks the color-mode script; hydration warning on `data-theme`. `[VERIFIED: node_modules]`

### Pitfall 2: Scoping the global editorial CSS breaks the shell (UI-01 parity)
**What goes wrong:** moving shell CSS into `<style scoped>` adds `data-v-*` attributes; cross-component selectors (`.topbar-inner .theme-btn`, `[data-theme] .theme-btn .moon`, `.nav-pill.active`) stop matching → silent visual regression.
**How to avoid:** components reproduce markup with existing classes and write **no CSS**. The CSS already loads globally once via `nuxt.config.ts → css:[...]`. (PITFALLS §4.)
**Warning signs:** `data-v-*` on `.topbar`/`.nav-pill`; theme icon both/neither showing; pills lose hover/active styling.

### Pitfall 3: `useTrip` field-name / `trip` filter mismatch
**What goes wrong:** querying `.where('id','=',slug)` (the reserved Content `id`) instead of `.where('slug','=',slug)`, or filtering `.where('trip','=',slug)` on a collection that has no `trip` field → empty results, blank page, or a query error.
**How to avoid:** the stable key is **`slug`** (Fase 2 decision). Before writing `useTrip`, read `shared/schemas.ts` and confirm each of the 6 schemas' key field (`slug`) and whether it has a `trip` field. `DaySchema`/`TripSchema` are confirmed; verify `monument`/`food`/`artist`/`reference`.
**Warning signs:** `useTrip('roma')` returns empty arrays; `#inicio` renders blank; typecheck error on `where(...)` field name.

### Pitfall 4: A stray internal link pulls `/trips/*` into the prerender (breaks D-01)
**What goes wrong:** adding `<NuxtLink to="/trips/roma">` (e.g. a "switch trip" affordance) makes `crawlLinks` discover and prerender `/trips/roma` → duplicate of `/`, canonical ambiguity, the golden no longer the only page.
**How to avoid:** in 1.0 there is **no** link to any `/trips/*` route. The route exists only to be reachable by URL (ARCH-02 "structure ready"). Keep `prerender.routes:['/']`.
**Warning signs:** `.output/public/trips/roma/index.html` exists after `generate`; build log lists `/trips/roma` as a prerendered route.

### Pitfall 5: `eyebrow → label` not locale-safe (drops the grave accent)
**What goes wrong:** a naïve `s[0].toUpperCase()+s.slice(1)` on `venerdì` is fine, but `.toUpperCase()` on the whole string or a bad split changes `Venerdì` → `Venerdi`/`VENERDÌ`, diverging from the locked labels.
**How to avoid:** `eyebrow.split('·')[0].trim()` then capitalize **only the first character** (`s.charAt(0).toLocaleUpperCase('it') + s.slice(1)`), preserving `ì`. Verified 1:1 against all 5 day files. Keep it a pure helper and unit-test all 5.
**Warning signs:** any day pill label differs by one character from Venerdì/Sabato/Domenica/Lunedì/Martedì.

## Code Examples

### `useColorMode()` consumption — verified return shape
```ts
// Source: node_modules/@nuxtjs/color-mode/dist/runtime/{composables.js, types.d.ts}
const colorMode = useColorMode()
// colorMode: { preference: string /*writable*/, value: string /*readonly, resolved*/, unknown: boolean, forced: boolean }
// D-08 toggle: read resolved .value, write concrete .preference
colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'   // never 'system'
```

### Pure day-label helper (D-04) — testable in isolation
```ts
// app/utils/dayLabel.ts  (auto-imported as dayLabel)
// venerdì · 19 giugno → Venerdì ; sabato → Sabato ; domenica → Domenica ; lunedì → Lunedì ; martedì → Martedì
export function dayLabel(eyebrow: string): string {
  const first = eyebrow.split('·')[0]!.trim()
  return first.charAt(0).toLocaleUpperCase('it') + first.slice(1)
}
```

### `app.vue` after replacing `#scaffold` (keep favicon useHead)
```vue
<script setup lang="ts">
// KEEP the existing favicon block verbatim (useRuntimeConfig().app.baseURL → /guiaRoma/favicon.svg)
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`
useHead({ link: [
  { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` },
  { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.svg` },
] })
</script>
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

### Shell markup contract (verbatim — reproduce exactly)
```html
<!-- Topbar: index.html:2257-2278 ; CSS base.css:24-90 -->
<header class="topbar">
  <div class="topbar-inner">
    <div class="brand">Roma <span class="brand-dot">✦</span> giugno MMXXVI</div>
    <!-- <ThemeToggle/> renders button.theme-btn (grid-column:3) -->
  </div>
  <!-- <NavPills :days="…"/> renders nav.nav-pills#nav-pills -->
</header>

<!-- BackButton (shell only, hidden): index.html:6229-6231 ; CSS base.css:1001-1031 -->
<button class="back-btn" id="back-btn" aria-label="Volver">
  <span class="back-btn-arrow">←</span> Volver
</button>

<!-- Flourish + footer: index.html:6233-6240 ; CSS base.css:987-998 -->
<div class="flourish">·  ·  ·  ✦  ·  ·  ·</div>
<footer>
  <div class="container">
    <p>Itinerario preparado para <em>Pay</em> y dos colegas<br>Roma · 19—23 giugno 2026<br>"Roma no se cuenta, se camina."</p>
  </div>
</footer>
```
> **Parity note on the BackButton:** `index.html:6229` has `onclick="goBack()"`. In F3 the shell has **no `@click`/no behavior** (D-07; wired in F5). Keep `id="back-btn"`. At rest the CSS gives `opacity:0; pointer-events:none; transform:…translateY(120%)` → invisible, golden unaffected.

### `#inicio` content (D-06) — prose fields via `<MDC>`
```html
<!-- index.html:2283-2357 ; render title / infoCards.value / howTo through <MDC> -->
<section id="inicio"><div class="container">
  <div class="hero">
    <div class="hero-decoration">{{ trip.decoration }}</div>      <!-- ·  ROMA AETERNA  · -->
    <h1><MDC :value="trip.title" /></h1>                          <!-- 'Cinque giorni a _Roma_' → <em>Roma</em> -->
    <div class="hero-meta">{{ trip.meta }}</div>
    <div class="hero-quote">{{ trip.quote }}<span class="hero-quote-attr">{{ trip.quoteAttr }}</span></div>
  </div>
  <!-- layout-only placeholders (no id, no behavior in F3): .search-wrap, .pace-wrap, two .light-wrap -->
  <h4>Datos del viaje</h4>                                        <!-- STATIC label (not in data) -->
  <div class="info-grid">
    <div class="info-card" v-for="c in trip.infoCards" :key="c.label">
      <div class="info-card-label">{{ c.label }}</div>
      <div class="info-card-value"><MDC :value="c.value" /></div>
    </div>
  </div>
  <h4>Cómo usar esta guía</h4>                                    <!-- STATIC label (not in data) -->
  <p v-for="(p,i) in trip.howTo" :key="i"><MDC :value="p" /></p>   <!-- verify <p>/unwrap rhythm vs golden -->
</div></section>
```
> **`<MDC>` whitespace caveat (PITFALLS §7):** `<MDC>` wraps inline content in `<p>`. For `trip.title` inside `<h1>` and `infoCards.value` inside `.info-card-value`, you may need `mdc-unwrap="p"` (or the `unwrap` prop) so no extra `<p>` breaks the vertical rhythm. For `howTo` paragraphs the `<p>` is wanted. This is a **layout-parity detail to verify against the golden**, flagged for F3 but it's a CSS/markup cuadre, not new logic. The two `<h4>` labels are STATIC template text (they live in `index.html`, not `trip.yml`).

## State of the Art

| Old (`index.html`) | Current (Nuxt 4) | Why |
|--------------------|------------------|-----|
| Theme via hand-written `<script>` (`setTheme`/`toggleTheme`/init reading `localStorage`+`matchMedia`) | `@nuxtjs/color-mode` (`useColorMode()` + auto-injected anti-FOUC script) | Module reproduces the exact behavior, FOUC-safe in SSG, same `data-theme`/`roma-theme` contract |
| 12 hardcoded nav pills in HTML | Structural pills in `NavPills` + day pills derived from `useTrip().days` | ARCH-01: a new day = a new file, nav updates with no code change |
| One monolithic page | `layouts/default.vue` (chrome) + `pages` + `TripView` (sections) | Componentization (UI-01) + multi-trip routing structure (ARCH-02) |

**Deprecated/outdated (do not use):** importing `z` from `@nuxt/content` (deprecated; the project already imports from `zod`). No F3-specific deprecations beyond what CLAUDE.md "What NOT to Use" already lists.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Every one of the 6 collections (`monument`/`food`/`artist`/`reference` in particular) carries a `trip` field, so `.where('trip','=',slug)` filters them all. `DaySchema`/`TripSchema` are confirmed in `shared/schemas.ts`; the others are inferred from Fase 2 decisions. | useTrip Pattern 1 / Pitfall 3 | If a collection lacks `trip`, that query returns empty / errors. **Planner must read `shared/schemas.ts` for all 6 schemas before writing `useTrip`.** Low risk (single-trip data; even an unfiltered `.all()` returns only Roma in 1.0). |
| A2 | The day-pill label transform is exactly `capitalize-first(eyebrow.split('·')[0].trim())` and all 5 eyebrows begin with the Italian weekday. Verified 1:1 in CONTEXT/UI-SPEC, not re-derived here. | Pattern 2 / Code Examples | A label off by one char fails SC#2 parity. Mitigated by the mandatory unit test over all 5. |
| A3 | `TripView` should receive `slug` and call `useTrip` itself (so `/` and `[slug]` both just render `<TripView :slug>`). Alternative: the page calls `useTrip` and passes data down. Either satisfies SC#1; this is Claude's Discretion. | Routing patterns | Wrong choice = minor refactor, not a parity risk. Planner picks one and is consistent. |
| A4 | SSG resolves `queryCollection` at prerender and serves it statically (offline) for `/`. Verified indirectly (Fase 1 `better-sqlite3` build connector + 100% static deploy; project research HIGH), not re-proven in this session. | useTrip / Responsibility Map | If a query needed a runtime server it would break offline — but Fase 1 already validated static output. Very low risk. |

**If this table looks short:** it is, deliberately — the stack and contract are locked and the load-bearing APIs were verified from source. The assumptions left are the field-shape detail (A1) the planner must confirm against `shared/schemas.ts`, and two discretion choices (A3, A4-confidence).

## Open Questions

1. **`<MDC>` `<p>`-wrapping vs golden rhythm in `#inicio`.**
   - What we know: `<MDC>` wraps inline content in `<p>` (ProseP); `mdc-unwrap="p"`/`unwrap` removes it.
   - What's unclear: exactly which of `trip.title`, `infoCards.value`, `howTo` need unwrapping to match the golden's vertical spacing (a pixel cuadre, resolvable only by running the build).
   - Recommendation: implement with `unwrap` on the inline cases (`title`, `infoCards.value`), keep `<p>` on `howTo`, and verify against the golden screenshot at the end of F3. Not a blocker; it's CSS/markup tuning, no new logic.

2. **Component-test tooling is not installed.** (See Validation Architecture ▸ Wave 0.)
   - What we know: `vitest@4.1.9` is installed; `vitest.config.ts` includes only `tests/data/**`; `@nuxt/test-utils`, `@vue/test-utils`, `happy-dom` are **absent**.
   - What's unclear: whether the planner adds component tests (for `ThemeToggle`/`NavPills`) or relies on Playwright for those behaviors.
   - Recommendation: the **pure helper** (`dayLabel`) and **`useTrip` index shape** are unit-testable with plain Vitest (no Nuxt runtime) — add a `tests/unit/**` include. Component mounting (`mountSuspended`) and the SC#3 anti-FOUC HTML check are best done in Playwright (already installed). See Validation Architecture.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + pnpm | All build/dev | ✓ | pnpm 10.32.1 (package.json) | — |
| nuxt | dev/generate | ✓ | 4.4.8 | — |
| @nuxt/content | useTrip queries | ✓ | 3.14.0 | — |
| @nuxtjs/color-mode | theme | ✓ | 4.0.1 | — |
| better-sqlite3 | Content build-time connector | ✓ | ^12.11.1 (dev) | — |
| @playwright/test | parity + FOUC assertion | ✓ | 1.61.0 | — |
| vitest | unit (data + new unit dir) | ✓ | 4.1.9 | — |
| @nuxt/test-utils / @vue/test-utils / happy-dom | component mounting tests | ✗ | — | Use Playwright for component behavior; plain Vitest for pure helpers (no Nuxt runtime needed) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** component-mount test tooling — fallback is Playwright (installed) for interactive/visual behavior + plain Vitest for pure functions. Installing `@nuxt/test-utils@^4` is optional and only if the planner wants `mountSuspended` component tests.

## Validation Architecture

> Nyquist validation is ENABLED (`workflow.nyquist_validation: true`). This section makes each success criterion testable. The downstream workflow greps for the `## Validation Architecture` heading.

### Test Framework
| Property | Value |
|----------|-------|
| Framework (unit) | **Vitest 4.1.9** (installed) — Node-pure for helpers + `useTrip` index shape |
| Framework (parity/E2E/FOUC) | **@playwright/test 1.61.0** (installed) — generated-HTML assertions + visual/behavior parity |
| Component-mount framework | **`@nuxt/test-utils` + `@vue/test-utils` + `happy-dom`** — **NOT installed** (Wave 0 gap if component-mount tests are wanted) |
| Config file (unit) | `vitest.config.ts` — currently `include:['tests/data/**/*.spec.ts']`; **extend** to add `tests/unit/**` |
| Config file (parity) | `playwright.config.ts` (exists; Fase 1) |
| Quick run command | `pnpm test:data` (data gate) ; `pnpm vitest run tests/unit` (new unit) |
| Full suite command | `pnpm test:data && pnpm vitest run tests/unit && pnpm test:golden` (+ `pnpm typecheck && pnpm lint`) |

### Phase Requirements → Test Map
| Req / SC | Behavior | Test Type | Automated Command | File Exists? |
|----------|----------|-----------|-------------------|-------------|
| **SC#1 / ARCH-01** | `useTrip('roma')` aggregates 6 collections with id indexes (Maps) + ordered `days` | unit (Nuxt runtime) or integration | `pnpm vitest run tests/unit/useTrip.spec.ts` | ❌ Wave 0 (and needs `@nuxt/test-utils` for `queryCollection`, OR test the pure index-building logic by extracting it) |
| **SC#1 / ARCH-02** | `/` renders `<TripView slug="roma">`; `/trips/roma` renders the same; unknown slug → 404 | E2E | `pnpm test:golden` (add `tests/parity/routing.spec.ts`) | ❌ Wave 0 |
| **SC#2 / UI-01** | Topbar/NavPills/footer markup + classes identical to golden (light+dark, mobile+desktop) | visual parity | `pnpm test:golden` (extend existing golden spec to cover `/` shell) | ✅ golden harness exists; assertions for the new shell ❌ |
| **SC#2 / D-04** | `dayLabel(eyebrow)` → Venerdì/Sabato/Domenica/Lunedì/Martedì (all 5, accent preserved) | unit (pure) | `pnpm vitest run tests/unit/dayLabel.spec.ts` | ❌ Wave 0 |
| **SC#3 / FEAT-01** | The color-mode anti-FOUC inline `<script>` is present in generated `<head>` AND resolves `data-theme` before paint | generated-HTML + E2E | Playwright: load built `/` with `localStorage roma-theme=dark`, assert first paint already dark (no transition) + assert `<head>` script | ❌ Wave 0 |
| **SC#4 / D-10** | Theme icon resolved by CSS only — both `.moon`/`.sun` spans exist in DOM, exactly one visible per `[data-theme]`; no `v-if` | E2E | Playwright: toggle theme, assert `data-theme` flips and the correct span is `display:block` while the other is `display:none` | ❌ Wave 0 |
| **D-09** | Parity head: `<html lang="es">`, exact `<title>`, both `theme-color` metas | generated-HTML | Playwright/assert against built `index.html` (or `toHaveTitle` + meta query) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/unit` (pure helper + index shape) + `pnpm lint` + `pnpm typecheck` — all < 30s.
- **Per wave merge:** `pnpm test:data && pnpm vitest run tests/unit` (full unit) and a targeted `pnpm test:golden -g "shell|theme"`.
- **Phase gate:** full suite green (data + unit + golden parity for `/` shell + the SC#3 FOUC assertion) before `/gsd:verify-work`.

### How SC#3 (anti-FOUC) is concretely proven
The color-mode module injects the inline script via a **Nitro `render:html` hook** (`htmlContext.head.push('<script>${script}</script>')`), which runs during `nuxt generate`. So the assertion is:
1. **Static presence:** after `pnpm generate`, the file `.output/public/index.html` `<head>` contains a `<script>` whose body calls `setAttribute("data-theme", …)` and reads `roma-theme` (the templated `storageKey`). A Playwright test (or a Node read of the built file) greps for these markers.
2. **Behavioral (no flash):** Playwright sets `localStorage['roma-theme']='dark'` before navigation, loads `/`, and asserts `document.documentElement.dataset.theme === 'dark'` at first evaluation with **no** observed light→dark transition. `[VERIFIED: node_modules/@nuxtjs/color-mode/dist/runtime/nitro-plugin.js + script.min.js]`

### Wave 0 Gaps
- [ ] `tests/unit/dayLabel.spec.ts` — covers SC#2/D-04 (all 5 labels, accent-safe). **Pure Vitest, no new dep.**
- [ ] `tests/unit/useTrip.spec.ts` — covers SC#1 index shape. Either extract the Map-building into a pure function to test with plain Vitest, OR install `@nuxt/test-utils` for a runtime test of `queryCollection`. **Recommend extracting the pure indexer** to avoid the dependency.
- [ ] `tests/parity/*` additions — shell visual parity for `/` (SC#2), routing + 404 (ARCH-02), anti-FOUC (SC#3), CSS-only icon (SC#4), parity head (D-09). **Playwright (installed).**
- [ ] Extend `vitest.config.ts` `include` to add `tests/unit/**/*.spec.ts` (keep `tests/data/**`). Consider Vitest `projects`/multiple includes so the data gate and unit tests stay logically separate.
- [ ] *(Optional)* install `@nuxt/test-utils@^4 @vue/test-utils happy-dom` only if component-mount tests for `ThemeToggle`/`NavPills` are desired beyond Playwright coverage.

*(The existing `tests/data` (Fase 2) and the Fase 1 golden harness cover data + baseline visual parity; F3 adds the unit helper + the shell/theme parity assertions above.)*

## Security Domain

> `security_enforcement` is not set in `.planning/config.json` → treat as not explicitly enabled. F3 is a static, no-backend, no-auth, no-user-input phase; the attack surface is minimal. Recorded for completeness.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in 1.0 (backend dormant) |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | Static public site |
| V5 Input Validation | minimal | The only "input" is the URL `slug` → validated against the `trip` collection (404 otherwise). No forms in F3. |
| V6 Cryptography | no | No secrets handled in F3 |

### Known Threat Patterns for {static Nuxt SSG}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| `v-html`/`<MDC>` over untrusted content (XSS) | Tampering/Elevation | F3 renders only **repo-versioned** prose via `<MDC>` (trusted). No user input is rendered. Documented in PITFALLS §7; reevaluate only if v2 adds third-party content. |
| Unvalidated route param (`[slug]`) | Tampering | `useTrip(slug)` → `createError(404)` for unknown slug; the param only selects a content collection key, never reaches a query string injection (Content's `.where` is parameterized). |
| External link tabnabbing | — | Not introduced in F3 (the maps/external links are F6/F7). Keep `rel="noopener"` when they arrive. |

## Sources

### Primary (HIGH confidence — verified from installed source)
- `node_modules/@nuxtjs/color-mode/dist/runtime/nitro-plugin.js` — anti-FOUC script injected via Nitro `render:html` hook → lands in generated `<head>` (SC#3 mechanism).
- `node_modules/@nuxtjs/color-mode/dist/script.min.js` — the templated IIFE: reads `getStorageValue('localStorage','roma-theme')`, resolves system/fallback, `setAttribute("data-theme", t)` before paint.
- `node_modules/@nuxtjs/color-mode/dist/runtime/composables.js` + `types.d.ts` — `useColorMode()` returns `{ preference (writable), value (readonly resolved), unknown, forced }`.
- `node_modules/@nuxt/content/dist/runtime/client.d.ts` — `queryCollection(name)` → `CollectionQueryBuilder` with `.where(field, operator, value)`, `.order(field, 'ASC'|'DESC')`, `.all()`/`.first()`.
- `index.html` (root) — shell markup 2257-2278, BackButton/footer 6229-6240, theme JS 6254-6266, head 2/6-8 (parity source of truth).
- `app/assets/css/base.css` — `.topbar` 24-37, `.theme-btn` + icon rules 46-61, `.nav-pills`/`.nav-pill` 63-90, `.back-btn` 1001-1031, footer 987-998, `scroll-padding-top:124px` line 3.
- `shared/schemas.ts` — `DaySchema` (124-145: `slug`, `trip`, `order`, `eyebrow`), `TripSchema` (259-277: `decoration`/`meta`/`quote`/`quoteAttr`/`infoCards`/`howTo`/`sections`).
- `nuxt.config.ts` — `colorMode` block 26-32, `app.baseURL='/guiaRoma/'` 13-15, `nitro.prerender.routes:['/']` 38-45.
- `package.json` + `node_modules/*/package.json` — exact installed versions.

### Secondary (HIGH-MEDIUM — official docs, current)
- content.nuxt.com/docs/utils/query-collection — `queryCollection` + `useAsyncData(uniqueKey, fn)` patterns (`.where().first()`, `.order().all()`).
- nuxt.com/docs/4.x/api/utils/create-error — `throw createError({ statusCode: 404, fatal: true })` in page setup.

### Project research (HIGH — already verified by the team)
- `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`, `FEATURES.md` — stack/versions, Nuxt 4 dir structure, FOUC/baseURL/history-routing pitfalls, feature→data mapping, `useTrip`/`TripView` shape.
- `.planning/STATE.md` — Fase 1 `better-sqlite3` build connector + 100% static deploy; favicon-via-`useHead` decision.

## Metadata

**Confidence breakdown:**
- Standard stack (consumption APIs): **HIGH** — verified from installed package source, not training data.
- Architecture / routing / aggregation: **HIGH** — `queryCollection` + `useAsyncData` + `createError` confirmed; the only open detail is the per-schema `trip` field (A1), to confirm against `shared/schemas.ts`.
- Theme / anti-FOUC: **HIGH** — the injection mechanism and the script payload were read directly; SC#3 has a concrete, greppable assertion.
- Pitfalls: **HIGH** — drawn from the project's own verified PITFALLS.md and the parity source.
- Validation tooling: **HIGH** on what's installed; **MEDIUM** on the recommendation to extract a pure indexer vs install `@nuxt/test-utils` (a judgment call for the planner).

**Research date:** 2026-06-19
**Valid until:** ~2026-07-19 (stable; pinned versions, locked contract). Re-verify only if `@nuxt/content`, `@nuxtjs/color-mode`, or `nuxt` are upgraded.
