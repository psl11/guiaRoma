# Phase 3: Capa de página, layout y tema - Pattern Map

**Mapped:** 2026-06-19
**Files analyzed:** 10 new + 1 modified
**Analogs found:** 11 / 11 (every file maps to a concrete in-repo source — but the dominant analog is `index.html` markup + verbatim CSS, NOT prior Nuxt components, because F3 creates the first components/composables/pages in the repo)

> **Parity-by-construction phase.** The authoritative analog for every shell/`#inicio` component is `index.html` (the live guide at repo root) + the verbatim CSS already in `app/assets/css/{tokens,base}.css`. The mandate is **reproduce verbatim, do not invent**: any deviation from the `index.html` markup/classes is a parity regression (the golden screenshot suite, Fase 1/8, will catch it). Components write **NO new CSS** and **NO `<style scoped>`** (scoped `data-v-*` attributes silently break the global cross-component selectors like `.topbar-inner .theme-btn` and `[data-theme] .theme-btn .moon`).
>
> **Net-new directory reality:** `app/components/`, `app/composables/`, `app/pages/`, `app/layouts/`, `app/utils/` do **not exist yet** — F3 creates them. There is therefore no prior Nuxt component to copy structure from; the only in-repo SFC is `app/app.vue` (the favicon/`useHead`/baseURL pattern). For `useTrip`, the analog is the data contract it aggregates (`shared/schemas.ts` + `content.config.ts`) plus the RESEARCH-verified `queryCollection`/`useAsyncData` API.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/composables/useTrip.ts` | composable | request-response (build-time query → refs) | `shared/schemas.ts` + `content.config.ts` (the 6 collections it aggregates) + RESEARCH Pattern 1 | role-match (net-new; no prior composable) |
| `app/utils/dayLabel.ts` | utility | transform (pure string) | `content/trips/roma/days/*.yml` `eyebrow` field + RESEARCH Code Examples | role-match (net-new pure helper) |
| `app/pages/index.vue` | page (route) | request-response | `app/app.vue` (SFC `<script setup lang="ts">` + `useHead`) | role-match |
| `app/pages/trips/[slug].vue` | page (dynamic route) | request-response (param → query → 404) | `app/app.vue` + RESEARCH Pattern 4 (`createError` 404 guard) | role-match |
| `app/layouts/default.vue` | layout (chrome host) | request-response (renders `<slot/>`) | `index.html` shell markup (2257-2278, 6230-6240) + `app/app.vue` | exact (markup verbatim) |
| `app/components/Topbar.vue` | component | event-driven (presentational) | `index.html:2257-2263` + `base.css:24-44` | exact (verbatim) |
| `app/components/ThemeToggle.vue` | component | event-driven (click → color-mode) | `index.html:2260-2262` + `base.css:46-61` + RESEARCH Pattern 3 | exact (verbatim) |
| `app/components/NavPills.vue` | component | request-response (props `days` → render) | `index.html:2264-2277` + `base.css:63-90` + RESEARCH Pattern 2 | exact (verbatim + derived day pills) |
| `app/components/BackButton.vue` | component | event-driven (shell only in F3, no behavior) | `index.html:6230-6232` + `base.css:1001-1034` | exact (verbatim, resting-invisible) |
| `app/components/TripView.vue` | component | request-response (calls `useTrip`, owns section scaffold) | `index.html:2280-6228` section structure (the `<section id="…">` skeleton) | role-match (owns layout; content placeholders) |
| `app/components/TheHero.vue` *(optional split of `#inicio`)* | component | request-response (renders `trip` fields via `<MDC>`) | `index.html:2283-2358` + `trip.yml` | exact (verbatim markup, data-bound) |
| `app/app.vue` *(MODIFIED)* | app root | request-response | itself (current `#scaffold` body → `<NuxtLayout><NuxtPage/></NuxtLayout>`; keep favicon block) | exact (self — preserve favicon `useHead`) |

> **Naming/structure are Claude's Discretion** (RESEARCH §Architecture; A3): the chrome may live in `layouts/default.vue` (recommended) vs `app.vue` vs `TripView`; `#inicio` may be inline in `TripView` or split into `TheHero`. Keep components **flat** in `app/components/` so auto-import names match the markup contract (`<Topbar>`, `<NavPills>`) — nesting (`components/layout/Topbar.vue`) yields prefixed names (`<LayoutTopbar>`). Pick one convention and document it for F4.

---

## Pattern Assignments

### `app/composables/useTrip.ts` (composable, request-response)

**Analog:** `shared/schemas.ts` (the typed contract) + `content.config.ts` (the 6 registered collections) + RESEARCH §Pattern 1. **No prior composable exists in the repo** — this is net-new; copy the *type contract* and the *verified API*, not a prior file.

**Confirmed field contract** (resolves RESEARCH assumption A1 / Pitfall 3 — verified by reading all 6 schemas in `shared/schemas.ts`): **every collection carries both `slug` (the stable anchor) and `trip` (the filter key)**:
- `TripSchema.slug` (line 260), no `trip` field (the trip *is* the slug) — query by `slug`.
- `DaySchema.slug` (124), `DaySchema.trip` (126), `DaySchema.order` (127) — order ASC.
- `MonumentSchema.slug` (47), `.trip` (48).
- `FoodSchema.slug` (154), `.trip` (155).
- `ArtistSchema` (discriminated union by `kind`): each variant has `.slug` (179/189/201) + `.trip` (180/190/203).
- `ReferenceSchema` (discriminated union by `slug`): `ReservasSchema.slug` literal + `.trip` + `.order` (212-215); `PracticaSchema` likewise (233-236) — order ASC.

So `.where('trip','=',slug)` is valid on `day`/`monument`/`food`/`artist`/`reference`; `trip` is queried by `.where('slug','=',slug).first()`. **Never `.where('id',…)`** — `id` is a reserved Content field (schema header note, lines 19-20).

**Import pattern** (mirror `content.config.ts:1-9` and the `~~`=rootDir alias for `shared/`):
```ts
import type { Trip, Day, Monument, Food, Artist, Reference } from '~~/shared/schemas'
// queryCollection, useAsyncData, computed are auto-imported (Nuxt)
```

**Core aggregation pattern** (RESEARCH §Pattern 1 — verified against `@nuxt/content` `client.d.ts`: `queryCollection(name).where(field,op,value).order(field,'ASC'|'DESC').all()/.first()`; `useAsyncData(uniqueKey, fn)`):
```ts
export async function useTrip(slug: string) {
  const [trip, days, monuments, food, artists, reference] = await Promise.all([
    useAsyncData(`trip-${slug}`, () => queryCollection('trip').where('slug', '=', slug).first()),
    useAsyncData(`days-${slug}`, () => queryCollection('day').where('trip', '=', slug).order('order', 'ASC').all()),
    useAsyncData(`mon-${slug}`,  () => queryCollection('monument').where('trip', '=', slug).all()),
    useAsyncData(`food-${slug}`, () => queryCollection('food').where('trip', '=', slug).all()),
    useAsyncData(`art-${slug}`,  () => queryCollection('artist').where('trip', '=', slug).all()),
    useAsyncData(`ref-${slug}`,  () => queryCollection('reference').where('trip', '=', slug).order('order', 'ASC').all()),
  ])
  // Id indexes keyed by `slug` (O(1) cross-ref for F4-F7: timeline.ref, day.cards[], seenIn…)
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

**SSG/offline constraint (SC#1):** these `queryCollection` calls **resolve at prerender** against the build-time SQLite dump and are served as static assets (Fase 1 proved 100% static deploy via `better-sqlite3` build connector). No runtime server. Use a **unique `useAsyncData` key per (collection, slug)** as above.

**Testability note (Wave 0):** the id-index Map-building is pure — RESEARCH recommends extracting it into a plain function so `tests/unit/useTrip.spec.ts` can cover SC#1 without installing `@nuxt/test-utils`.

---

### `app/utils/dayLabel.ts` (utility, transform — pure)

**Analog:** the 5 `content/trips/roma/days/*.yml` `eyebrow` fields + RESEARCH §Code Examples / §Pitfall 5.

**Core pattern** (locale-safe — preserve the grave accent `ì`; verified 1:1 against all 5 days):
```ts
// app/utils/dayLabel.ts  (auto-imported as dayLabel)
// venerdì · 19 giugno → Venerdì ; sabato → Sabato ; domenica → Domenica ; lunedì → Lunedì ; martedì → Martedì
export function dayLabel(eyebrow: string): string {
  const first = eyebrow.split('·')[0]!.trim()
  return first.charAt(0).toLocaleUpperCase('it') + first.slice(1)
}
```
> **DO NOT** `.toUpperCase()` the whole string (would yield `VENERDÌ`) and **DO NOT** add a `navLabel` field to the schema (D-04 — derive, don't touch `shared/schemas.ts` + the 5 files). Unit-test all 5 labels (SC#2/D-04).

---

### `app/pages/index.vue` (page, request-response)

**Analog:** `app/app.vue` (the only existing SFC — `<script setup lang="ts">` convention) + RESEARCH §Pattern 4.

**Core pattern** (D-02: `'roma'` hardcoded — `/` is the "Roma home"):
```vue
<template><TripView slug="roma" /></template>
```
> No `<NuxtLink to="/trips/...">` anywhere (would pull `/trips/*` into the prerender via `crawlLinks` → breaks D-01). The whole app navigates via in-page `#anchors` (fragments, not routes).

---

### `app/pages/trips/[slug].vue` (page, request-response — param → query → 404)

**Analog:** `app/app.vue` SFC pattern + RESEARCH §Pattern 4 (`createError` confirmed from `nuxt.com/docs/4.x/api/utils/create-error`).

**Core pattern** (validate slug against the `trip` collection; 404 on miss; introduces **no** prerender route — D-01):
```vue
<script setup lang="ts">
const slug = useRoute().params.slug as string
const { trip } = await useTrip(slug)
if (!trip.value) {
  throw createError({ statusCode: 404, statusMessage: 'Trip not found', fatal: true })
}
</script>
<template><TripView :slug="slug" /></template>
```
> `nitro.prerender.routes` stays `['/']` (`nuxt.config.ts:42`). This route exists only to be reachable by URL (ARCH-02 "structure ready"); it is never prerendered in 1.0 because nothing links to it.

---

### `app/layouts/default.vue` (layout, chrome host)

**Analog:** `index.html` shell skeleton (header 2257-2278; back-btn/flourish/footer 6230-6240) — the layout reproduces the **outer chrome** verbatim and renders the page in `<slot/>`. Net-new; no prior layout.

**Core pattern** (recommended home for the fixed chrome per RESEARCH §Alternatives — gives `/` and `/trips/[slug]` the same shell for free):
```vue
<template>
  <Topbar />
  <main>
    <slot />            <!-- <TripView> lands here -->
  </main>
  <BackButton />        <!-- mounted, hidden at rest (D-07) -->
  <div class="flourish">·  ·  ·  ✦  ·  ·  ·</div>
  <footer>
    <div class="container">
      <p>Itinerario preparado para <em>Pay</em> y dos colegas<br>Roma · 19—23 giugno 2026<br>"Roma no se cuenta, se camina."</p>
    </div>
  </footer>
</template>
```
> `<main>` wraps the page content exactly as `index.html:2280`. `.flourish` / `footer` verbatim from `index.html:6234-6240` (CSS `base.css:978-998`). `NavPills` may render inside `Topbar` (it lives inside `<header>` in the source) — see Topbar mapping. **Whether the parity head (`useHead`, D-09) lives here or in `app.vue` is Claude's Discretion** — see Shared Patterns ▸ Parity Head.

---

### `app/components/Topbar.vue` (component, presentational) — VERBATIM

**Analog:** `index.html:2257-2263` (header + topbar-inner + brand + theme-btn) and the `<nav>` at 2264-2277. CSS `base.css:24-44`.

**Markup to reproduce EXACTLY** (`index.html:2257-2263`):
```html
<header class="topbar">
  <div class="topbar-inner">
    <div class="brand">Roma <span class="brand-dot">✦</span> giugno MMXXVI</div>
    <ThemeToggle />   <!-- renders button.theme-btn; CSS gives it grid-column:3 -->
  </div>
  <NavPills :days="days" />   <!-- renders nav.nav-pills#nav-pills inside the <header> -->
</header>
```
**CSS contract that MANDATES this structure** (`base.css:24-37` — DO NOT add `<style scoped>`, it breaks these descendant selectors):
```css
.topbar { position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px) saturate(1.2); border-bottom: 1px solid var(--line-soft); }
.topbar-inner { max-width: 760px; margin: 0 auto; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: .75rem 1.25rem; }
.topbar-inner .brand { grid-column: 2; text-align: center; }
.topbar-inner .theme-btn { grid-column: 3; justify-self: end; }   /* ← requires .theme-btn to be a DESCENDANT of .topbar-inner */
```
> Keep `<header class="topbar">` as the outer element (sticky + border + blur). `NavPills` sits inside `<header>` **below** `.topbar-inner` (the nav is a sibling of `.topbar-inner`, both children of `<header>`), exactly as `index.html:2264` — not inside `.topbar-inner`. The brand-dot `✦` is a literal glyph (CSS `base.css:45`).

---

### `app/components/ThemeToggle.vue` (component, event-driven) — VERBATIM markup + CSS-only icon (SC#4)

**Analog:** `index.html:2260-2262` + `base.css:46-61` + RESEARCH §Pattern 3 (`useColorMode()` shape verified from `node_modules/@nuxtjs/color-mode`).

**Markup to reproduce EXACTLY** (`onclick="toggleTheme()"` → `@click="toggle"`; `aria-label` verbatim):
```html
<button class="theme-btn" aria-label="Cambiar tema" @click="toggle">
  <span class="moon">☾</span><span class="sun">☀</span>
</button>
```
**Toggle behavior (D-08 — mirrors `toggleTheme()` 1:1: invert the RESOLVED theme, write a concrete preference, NEVER `'system'`):**
```ts
const colorMode = useColorMode()   // auto-imported; returns { preference (writable), value (readonly, resolved), unknown, forced }
function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
```
**CSS that switches the icon — the SC#4 contract (`base.css:58-61`); BOTH spans always render, NO `v-if`/`v-show` per theme:**
```css
[data-theme="light"] .theme-btn .moon { display: block; }
[data-theme="light"] .theme-btn .sun  { display: none; }
[data-theme="dark"]  .theme-btn .moon { display: none; }
[data-theme="dark"]  .theme-btn .sun  { display: block; }
```
> A `v-if="colorMode.value==='dark'"` for the icon would reintroduce theme FOUC (system preference unknown at prerender) **and** a hydration mismatch. The icon is CSS-only. The two spans must be written **adjacent with no whitespace** as in the source (`<span class="moon">☾</span><span class="sun">☀</span>`). `aria-label` is exactly `"Cambiar tema"` (`index.html:2260`).

---

### `app/components/NavPills.vue` (component, request-response) — VERBATIM shell + derived day pills (D-03/D-04)

**Analog:** `index.html:2264-2277` + `base.css:63-90` + RESEARCH §Pattern 2.

**Markup (hybrid: structural pills literal; day pills derived from `useTrip().days`, ordered 1→5, labelled via `dayLabel`):**
```vue
<script setup lang="ts">
import type { Day } from '~~/shared/schemas'
const props = defineProps<{ days: Day[] }>()
// dayLabel auto-imported from app/utils/dayLabel.ts
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
**ORDER IS LOCKED** to `index.html:2265-2276` exactly: `Inicio, Mapa`, then 5 day pills (`#viernes` Venerdì · `#sabado` Sabato · `#domingo` Domenica · `#lunes` Lunedì · `#martes` Martedì) interleaved between Mapa and Reservas, then `Reservas, Gastronomía, Pratica, Arte, Arquitectura`. The day `href` = `'#' + day.slug` (Spanish anchors `#viernes`…). `Pratica`/`Gastronomía` spellings verbatim.
> Keep `id="nav-pills"` (F5 scrollspy targets it). **No `.nav-pill.active`, no scrollspy** in F3 — plain anchors. (The `.nav-pill.active` rule exists at `base.css:90` but is wired in F5.) No `<style scoped>` (would add `data-v-*` and break `.nav-pill:hover`/`.nav-pill.active`).

---

### `app/components/BackButton.vue` (component, shell only) — VERBATIM, resting-invisible (D-07)

**Analog:** `index.html:6230-6232` + `base.css:1001-1034`.

**Markup (`onclick="goBack()"` is DROPPED in F3 — NO `@click`, NO behavior; wired in F5):**
```html
<button class="back-btn" id="back-btn" aria-label="Volver">
  <span class="back-btn-arrow">←</span> Volver
</button>
```
**CSS resting state — why it's invisible at rest (golden unaffected) (`base.css:1001-1029`):**
```css
.back-btn { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%) translateY(120%); opacity: 0; pointer-events: none; z-index: 200; /* …+ accent bg, #fbf7f0 text, Cormorant italic… */ }
.back-btn.show { transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto; }
```
> Mounted but with **no `.show` class** → `opacity:0; pointer-events:none; translateY(120%)` = off-screen + invisible. Keep `id="back-btn"` (F5 toggles `.show`). The arrow `←` is a literal glyph in `.back-btn-arrow`. `aria-label="Volver"` verbatim.

---

### `app/components/TripView.vue` (component, request-response) — owns the section scaffold (D-05)

**Analog:** the `<section id="…">` skeleton of `index.html` (`<main>` at 2280; `#inicio` 2283, `#mapa` 2360, then the 5 day sections + reference sections through 6226). TripView reproduces the **section anchors in order**; F3 fills only `#inicio`, the rest are minimal empty `<section id="…">` placeholders.

**Core pattern (12 anchors = exactly the 12 nav pills; `id` = slug, never `id`-reserved):**
```vue
<script setup lang="ts">
const props = defineProps<{ slug: string }>()
const { trip, days /* …id maps for F4-F7… */ } = await useTrip(props.slug)
</script>
<template>
  <section id="inicio"><!-- FULL content (D-06) — hero + info-grid + how-to; see TheHero --></section>
  <section id="mapa"><!-- F7 Leaflet island --></section>
  <section id="viernes"></section>   <!-- F4 timeline+cards ×5 (viernes/sabado/domingo/lunes/martes) -->
  <section id="sabado"></section>
  <section id="domingo"></section>
  <section id="lunes"></section>
  <section id="martes"></section>
  <section id="reservas"></section>    <!-- F4 reference -->
  <section id="gastronomia"></section> <!-- F4 food grid -->
  <section id="practica"></section>    <!-- F4 reference -->
  <section id="arte"></section>        <!-- F4 artists -->
  <section id="arquitectura"></section><!-- F4 arquitectura/glossary -->
</template>
```
> **Placeholder rule (RESEARCH §Anti-Patterns):** keep placeholders as **real empty `<section id="…">`** so `section { padding: 3rem 0 }` (`base.css:93`) + `section + section { border-top: 1px solid var(--line-soft) }` (`base.css:94`) apply naturally. **Do NOT give them a fixed height** — a tall placeholder shifts every anchor offset and breaks the future scrollspy (`scroll-padding-top:124px`, `base.css:3`). NavPills receives `days` from here (or from the layout, depending on where the chrome lives — keep the data source consistent).
> **Who calls `useTrip` is Claude's Discretion (A3):** either `TripView` calls it (so pages are 1-liners) OR the page calls it and passes data down. Pick one and be consistent (F4 follows it). RESEARCH leans `TripView` calls it.

---

### `app/components/TheHero.vue` *(optional — the `#inicio` block, D-06)* — VERBATIM markup, data-bound via `<MDC>`

**Analog:** `index.html:2283-2358` (verbatim DOM) + `content/trips/roma/trip.yml` (the data) + `shared/schemas.ts` `TripSchema` (259-277: `decoration`/`title`/`meta`/`quote`/`quoteAttr`/`infoCards`/`howTo`).

**Markup (the two `<h4>` are STATIC labels — they live in `index.html`, NOT in `trip.yml`):**
```html
<section id="inicio"><div class="container">
  <div class="hero">
    <div class="hero-decoration">{{ trip.decoration }}</div>          <!-- ·  ROMA AETERNA  · -->
    <h1><MDC :value="trip.title" /></h1>                              <!-- 'Cinque giorni a _Roma_' → <em>Roma</em> -->
    <div class="hero-meta">{{ trip.meta }}</div>
    <div class="hero-quote">{{ trip.quote }}<span class="hero-quote-attr">{{ trip.quoteAttr }}</span></div>
  </div>
  <!-- LAYOUT-ONLY placeholders (NO id, NO behavior in F3): .search-wrap, .pace-wrap, two .light-wrap -->
  <!-- These exist in index.html:2295-2332 so the masthead→info-grid spacing/border rhythm matches the golden. Their handlers are F4/F6. -->
  <h4>Datos del viaje</h4>                                            <!-- STATIC (index.html:2334) -->
  <div class="info-grid">
    <div class="info-card" v-for="c in trip.infoCards" :key="c.label">
      <div class="info-card-label">{{ c.label }}</div>
      <div class="info-card-value"><MDC :value="c.value" /></div>
    </div>
  </div>
  <h4>Cómo usar esta guía</h4>                                       <!-- STATIC (index.html:2354) -->
  <p v-for="(p,i) in trip.howTo" :key="i"><MDC :value="p" /></p>
</div></section>
```
**Verbatim data mapping (`trip.yml` → DOM, confirmed against `index.html:2283-2356`):**
- `trip.decoration` = `·  ROMA AETERNA  ·` (`trip.yml:3`).
- `trip.title` = `Cinque giorni a _Roma_` → `<MDC>` renders `<em>Roma</em>` (`h1 em` is accent italic, `base.css:123`).
- `trip.infoCards[]` = 4 cards (Alojamiento / Estación más cercana / Llegada / Salida); each `value` is a multiline Markdown block whose leading `**…**` becomes `info-card-value strong { display:block }` (`base.css:233`).
- `trip.howTo[]` = 2 paragraphs (`trip.yml:26-36`).

> **`<MDC>` whitespace caveat (RESEARCH §Open Q 1 / Pitfall 7):** `<MDC>` wraps inline content in `<p>` (ProseP). For `trip.title` inside `<h1>` and `infoCards.value` inside `.info-card-value`, you likely need `unwrap="p"` (or `mdc-unwrap="p"`) so no extra `<p>` breaks vertical rhythm; for `howTo` the `<p>` is wanted. This is a CSS/markup cuadre to verify against the golden screenshot, **not new logic**.

---

### `app/app.vue` (MODIFIED — replace `#scaffold` body, PRESERVE favicon block)

**Analog:** itself (current state, lines 1-23). The favicon `useHead` + `useRuntimeConfig().app.baseURL` block is a **Fase 1 decision that MUST be preserved verbatim** — Nuxt does NOT prefix `app.baseURL` to `app.head.link` hrefs, so a static `/favicon.svg` would 404 under `/guiaRoma/`.

**Pattern to PRESERVE (current `app/app.vue:8-16` — do not regress to `app.head.link`):**
```ts
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`
useHead({
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` },
    { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.svg` },
  ],
})
```
**Only change — the template body** (`#scaffold` → real page tree):
```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

---

## Shared Patterns

### Verbatim CSS reuse — NO new CSS, NO `<style scoped>` (applies to ALL components)
**Source:** `app/assets/css/{tokens,base}.css`, already loaded once globally via `nuxt.config.ts:18-22` (`css: ['~/assets/css/tokens.css', '~/assets/css/base.css', '~/assets/css/leaflet.css']`).
**Apply to:** every F3 component.
```css
/* The shell relies on GLOBAL cross-component descendant selectors that scoping would break: */
.topbar-inner .theme-btn { grid-column: 3; justify-self: end; }   /* base.css:37 */
[data-theme="light"] .theme-btn .moon { display: block; }         /* base.css:58 */
.nav-pill.active { … }                                            /* base.css:90 (F5) */
.back-btn.show { … }                                              /* base.css:1025 (F5) */
```
> Components reproduce the existing class markup and write **zero CSS**. A `<style scoped>` block adds `data-v-*` attributes that change specificity and silently break these selectors → parity drift. (RESEARCH Pitfall 2 / Anti-Patterns.)

### Theme consumption (FEAT-01) — consume `@nuxtjs/color-mode`, never hand-roll
**Source:** `nuxt.config.ts:26-32` (`colorMode: { preference:'system', fallback:'light', dataValue:'theme', storageKey:'roma-theme', classSuffix:'' }` — already configured, Fase 1) + `useColorMode()` (auto-imported).
**Apply to:** `ThemeToggle` (the only consumer in F3).
```ts
const colorMode = useColorMode()                                  // { preference (writable), value (readonly resolved), unknown, forced }
colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'   // D-08: invert resolved, write concrete, NEVER 'system'
```
> The anti-FOUC inline script is injected by the module's Nitro `render:html` hook → lands in the generated `<head>` at prerender (SC#3). **Add NO custom theme script.** Do NOT read `localStorage`/`window`/`matchMedia` in `<script setup>` (that reintroduces the exact flash this phase prevents). `[VERIFIED in RESEARCH from node_modules]`

### Parity head (D-09) — set via `useHead`, independent of color-mode
**Source:** `index.html:2,6-8` (verbatim) + RESEARCH §Pattern 5.
**Apply to:** one place only — `app.vue` (alongside the favicon block) OR `layouts/default.vue` (Claude's Discretion; do NOT duplicate).
```ts
useHead({
  htmlAttrs: { lang: 'es' },                                                              // index.html:2
  title: 'Roma · 19—23 giugno 2026',                                                      // index.html:8
  meta: [
    { name: 'theme-color', content: '#1a1612', media: '(prefers-color-scheme: dark)' },   // index.html:6
    { name: 'theme-color', content: '#f5f0e8', media: '(prefers-color-scheme: light)' },  // index.html:7
  ],
})
```
> The two `theme-color` metas set the browser-chrome color per OS scheme (mobile parity) — keep BOTH; they are independent of color-mode. The em-dash in the title is `—` (verbatim).

### Prerender discipline (D-01) — keep `/trips/*` out of the build
**Source:** `nuxt.config.ts:38-45` (`nitro.prerender.routes: ['/']`, `crawlLinks: true`).
**Apply to:** all pages/components.
> **Never add a `<NuxtLink to="/trips/...">`** — `crawlLinks` would discover and prerender `/trips/roma` → duplicate of `/`, canonical ambiguity, golden no longer the only page. All navigation is in-page `#anchors` (fragments, not routes). Verify after `generate` that `.output/public/trips/` does NOT exist.

### Auth / Validation / Error handling
- **Auth/guards:** none — static public site, no backend in 1.0 (RESEARCH §Security Domain).
- **Validation:** the only "input" is the URL `slug`, validated against the `trip` collection in `pages/trips/[slug].vue` → `createError({ statusCode: 404, fatal: true })`. Content's `.where` is parameterized (no injection).
- **Error handling:** the 404 guard above is the only error path; no custom error-state visual is specced in F3 (`/trips/*` is never prerendered anyway).

---

## No Analog Found

No file is left without a concrete source. The "weakest" analogs are the **net-new** abstractions whose closest in-repo reference is a data/type contract rather than a prior implementation:

| File | Role | Data Flow | Note |
|------|------|-----------|------|
| `app/composables/useTrip.ts` | composable | request-response | No prior Nuxt composable / `queryCollection` usage in the repo (only a comment in `tests/data/schema.spec.ts:23`). Analog = the typed contract it aggregates (`shared/schemas.ts`) + RESEARCH §Pattern 1 (API verified from `node_modules/@nuxt/content`). |
| `app/utils/dayLabel.ts` | utility | transform | Net-new pure helper; analog = the `eyebrow` data it transforms + RESEARCH Code Examples. |

> These are **not** "use RESEARCH instead of the codebase" cases — the codebase supplies the exact data shapes (`shared/schemas.ts`) and config (`content.config.ts`, `nuxt.config.ts`) they consume; only the *implementation* is new, and RESEARCH provides the verified API to copy.

## Metadata

**Analog search scope:** `app/` (app.vue, assets/css/*), `shared/schemas.ts`, `content.config.ts`, `nuxt.config.ts`, `content/trips/roma/trip.yml`, `index.html` (head + shell + back/footer ranges), `tests/`.
**Files scanned:** ~12 (plus directory existence checks for components/composables/pages/layouts/utils — all confirmed net-new).
**Project skills:** none found (no `.claude/skills/`, `.agents/skills/`, etc.).
**Pattern extraction date:** 2026-06-19
