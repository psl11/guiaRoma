# Phase 6: Derivados de datos — búsqueda y ruta del día - Research

**Researched:** 2026-06-21
**Domain:** Client-side search (MiniSearch over typed data) + derived "day route" (Google Maps deep-link) — both as PURE testable utils/composables with 1:1 behavioral parity to `index.html`
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Heredado y BLOQUEADO por fases previas / paridad (no reabrir):**
- **Paridad = ley** (Core Value): F6 reproduce el comportamiento del `index.html` **exactamente**, con **una única mejora sancionada**: la calidad de coincidencia de la búsqueda (SC#1 exige "al menos lo de hoy", lo que permite mejorar).
- **MiniSearch 7.2.0 sobre DATOS, no DOM** (CLAUDE.md #7): reemplaza el `cards.filter(c => c.content.includes(q))` y el raspado del DOM del original.
- **Composables puros y testeables** (goal): la lógica pura (`pointFor`/`capStops`/`buildDirUrl`, construcción del haystack/índice) vive en `app/utils/` con tests Vitest; el comportamiento (dropdown, botón, navegación) se verifica con Playwright autocontenido (patrón F2–F5). El planner porta la lógica 1:1, no la reinventa.
- **Navegación de resultados vía `useCardNavigation` (F5)** (SC#2): un resultado invoca `navigateToCard(slug)`.
- **Paridad del haystack** (SC#1): prosa de todas las secciones + nombre italiano + facts + caption (los mismos textos que hoy entraban en `card.textContent`).
- **Paridad de la ruta** (SC#3): solo monumentos desde el orden de `day.cards`; `dir/?api=1…&travelmode=walking` (formato exacto del original); cap de 10 con muestreo **literal** de `capStops`; botón solo con ≥2 paradas; texto condicional `(N paradas)` / `(10 de N paradas)`.
- **Tests de URL** (SC#4): unitarios sobre `pointFor`/`capStops`/`buildDirUrl` que confirman que la URL por día coincide con la del `index.html`.

- **D-01 (MiniSearch: prefijo + ranking + fuzzy SUAVE):** búsqueda con **prefijo**, **ranking por campo** (nombre italiano > prosa) y **tolerancia a erratas suave**. **NO** fuzzy agresivo. (Pesos exactos y umbral fuzzy conservador = research/planner.)
- **D-02 (índice = solo monumentos, paridad):** la búsqueda indexa **solo monumentos**. Todos los resultados están en `monById` (F3) → `navigateToCard(slug)` funciona sin ampliar el índice ni tocar F5. NO se indexan gastro/artistas/referencia.
- **D-03 (dropdown = paridad pura):** clic en un resultado → navegar; ≥2 chars, máx 8, "Sin resultados". **Sin** navegación por teclado añadida y **sin** filas enriquecidas. (Mecánica fina —debounce, cierre al clicar fuera— = replicar el original.)
- **D-04 (ubicación/disparo = paridad pura):** la caja de búsqueda y el botón "ruta del día" van **exactamente donde estaban** en el original, disparo por **clic**. **Sin** atajo de teclado nuevo.

### Claude's Discretion
- Config exacta de MiniSearch: campos indexados, pesos de boost (nombre>prosa), umbral fuzzy conservador, opciones de prefijo/tokenización.
- Forma de los composables (`useSearch` / `useDayRoute`): singleton `useState` vs ref de módulo (preferir el patrón establecido F4/F5), y dónde se montan.
- Cómo se construye el `haystack` por monumento desde las colecciones tipadas (concatenación de prosa multi-sección + italiano + facts + caption).
- Mecánica fina del dropdown (debounce, cierre al clicar fuera, foco) replicando el original.
- Ubicación/markup exactos de la caja de búsqueda y del botón "ruta del día" (research los mapea); si necesitan estilos, portarlos verbatim (cero CSS nuevo si las clases ya existen en `base.css`).

### Deferred Ideas (OUT OF SCOPE)
- **Ampliar la búsqueda a gastro / artistas / secciones de referencia** — descartado (paridad = monuments-only).
- **Atajo de teclado para enfocar la búsqueda** (`/` o `⌘K`) — descartado (no estaba en el original; paridad = clic).
- **Navegación por teclado del dropdown** (↑↓ / enter / esc) y **filas enriquecidas** (día / tipo / resaltado del término) — descartados por paridad.
- Mapa Leaflet → **F7**. Fallback de imagen / notas persistidas → **F7**. Pixel-diff total → **F8**.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **FEAT-03** | Búsqueda en cliente sobre los DATOS (MiniSearch), cubriendo el mismo texto que hoy, con dropdown que navega a la ficha | §Standard Stack (MiniSearch already installed), §Architecture Pattern 1 (search index + composable), §Pitfall 1 (haystack must be a superset of `card.textContent`), §Pitfall 6 (`#search`/`#search-results` shell already exists in `TheHero.vue`), §Code Examples (haystack builder, MiniSearch config, dropdown wiring) |
| **FEAT-09** | "Ruta del día" derivada de datos: enlace a Google Maps con las paradas del día en orden, con el mismo cap (10 paradas) y muestreo | §Architecture Pattern 2 (`pointFor`/`capStops`/`buildDirUrl` pure utils), §Pitfall 2 (THE critical finding: route = ALL `day.cards`, NOT type-filtered), §Pitfall 3 (`capStops` index math is load-bearing), §Code Examples (verbatim port of the three functions), §Validation Architecture (per-day URL parity tests) |
</phase_requirements>

## Summary

Phase 6 re-derives two features that the live `index.html` implements by scraping the DOM: client search and the per-day Google Maps route. Both must port 1:1 to **pure, unit-tested functions** in `app/utils/` (precedent: `pace.ts`, `cardNav.ts`), with thin composables/components wiring them to the existing UI shells. The phase is **low-risk and well-scaffolded**: MiniSearch 7.2.0 is **already installed** ([VERIFIED: package.json + node_modules]), the search box (`.search-wrap` with `#search` / `#search-results`) **already exists verbatim in `TheHero.vue`** (built as a no-handler placeholder in F3), and the day-stats band (where the route button is appended) **already exists in `DaySection.vue`**. No new package install, no new CSS (every class — `.search-results`, `.search-result`, `.search-result-meta`, `.day-route-btn` — is already in the verbatim global CSS). [VERIFIED: codebase grep]

The single most consequential finding is a **factual error in the CONTEXT/ROADMAP framing of the route**. They say "monuments only — exclude guided/concert." The original `buildDayRoutes` does NOT exclude by type: it scans `section.querySelectorAll('a.maps-link')` in DOM order, and **all 38 cards (including the guided Vaticano and the concert Auditorium) have a `.maps-link`**. The Saturday route in the live site **includes** vaticano and auditorium; `day.cards` for Saturday literally lists both. The only things excluded are restaurants (which use `.tl-food-name`, a different class) and places with no card at all (e.g. Coliseo, which has no `article.card`). [VERIFIED: index.html grep + days/*.yml]. The correct, parity-safe rule is: **the route = every entry in `day.cards`** (which already mirrors exactly the DOM cards that had `.maps-link`). Applying a `type !== 'card'` filter would BREAK parity by dropping vaticano/auditorium from Saturday. This must override the CONTEXT wording.

**Primary recommendation:** Port `pointFor`/`capStops`/`buildDirUrl` verbatim into `app/utils/dayRoute.ts` (Vitest with per-day fixtures asserting byte-identical URLs); `pointFor(monument)` returns `${coords.lat},${coords.lng}` (coords are always present on monuments, so the original's URL-query fallback never fires for them). Build the search haystack in `app/utils/searchIndex.ts` as a **superset** of `card.textContent` (name + italian + roman + badge + all section bodies + facts + sorrentino + culture + artist/arch labels), index monuments-only with MiniSearch (`prefix: true`, `fuzzy: 0.2`, `boost: { name, italian high; prose low }`), and wire a `useSearch` singleton (`useState`, F4/F5 pattern) into the existing `#search` input in `TheHero.vue`, with results invoking `useCardNavigation().navigateToCard(slug)`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Build search haystack from typed data | Pure util (`app/utils/searchIndex.ts`) | — | Pure string concatenation over `Monument[]`; no DOM, no Nuxt → Vitest-testable (precedent: `pace.ts`). SC#1 parity = which text fields enter the haystack. |
| MiniSearch index construction + query | Browser / Client (composable `useSearch`) | Pure util (index factory) | The index lives in memory client-side (offline-safe in SSG). Built once from the already-loaded `monById`. The factory function (data→MiniSearch) can be pure; the reactive query/dropdown state is a `useState` singleton. |
| Search dropdown UI + close-on-outside-click | Browser / Client (new component) | `useCardNavigation` (F5) | Pure parity DOM behavior; selecting a result delegates navigation to F5 (`navigateToCard`). |
| `pointFor` / `capStops` / `buildDirUrl` | Pure util (`app/utils/dayRoute.ts`) | — | Pure functions of `Monument`/coords arrays → string URL. The phase's SC#4 is literally unit tests over these. Zero DOM/Nuxt. |
| "Ruta del día" button (visibility + label + href) | Frontend Server (SSG render in `DaySection.vue`) | Pure util (`dayRoute`) | Derived deterministically from `day.cards` + `monById` at prerender; `:href`/`v-if`/label are reactive bindings over the pure util's output. No client-only needed (unlike F5/F7 which touch `window`). Opening the link is a plain `<a target="_blank">`. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **minisearch** | **7.2.0** | Full-text client search index over typed data | CLAUDE.md #7 mandates it; **already in `package.json` dependencies AND installed in `node_modules`** [VERIFIED: package.json + `node_modules/minisearch/package.json`]. 7.2.0 is the **current latest** on npm [VERIFIED: `npm view minisearch version` → 7.2.0]. Zero peer deps; runs in-memory client-side (offline-safe in SSG). Provides prefix + soft fuzzy + per-field boosting (the exact features D-01 wants). |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| _(none new)_ | — | — | The route feature needs NO library: `encodeURIComponent` + string concatenation only. `useCardNavigation` (F5) and `useTrip` (F3) are existing composables. Vitest 4.1.9 + Playwright 1.61.0 (already installed) cover validation. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MiniSearch | Fuse.js 7.4.2 | CLAUDE.md already rejected Fuse for this project: better pure typo-tolerance but slower, no inverted index, no prefix. Not relevant — MiniSearch is locked and installed. |
| MiniSearch | The original's `String.includes()` | That was the DOM-scraping anti-pattern F6 explicitly removes (CLAUDE.md §"Buscar scrapeando el DOM"). |

**Installation:**
```bash
# NOTHING TO INSTALL — minisearch@7.2.0 is already a dependency and present in node_modules.
# Verify only:
node -e "console.log(require('minisearch/package.json').version)"   # → 7.2.0
```

**Version verification:** [VERIFIED: 2026-06-21] `minisearch@7.2.0` — installed (`node_modules/minisearch/package.json`) and current latest on npm (`npm view minisearch version` = `npm view minisearch dist-tags.latest` = `7.2.0`).

## Package Legitimacy Audit

> No new external packages are installed in this phase. MiniSearch is a pre-existing, already-vetted dependency from Phase 1's scaffold. slopcheck/registry verification is therefore informational only.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| minisearch | npm | mature (7.x line, est. ~6 yrs) | high (widely used) | github.com/lucaong/minisearch | n/a (pre-installed, not added this phase) | Already approved (Phase 1) |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*No `checkpoint:human-verify` gate is needed for package installs — there are none.*

## Architecture Patterns

### System Architecture Diagram

```
                       ┌──────────────────────────────────────────────────┐
                       │  Nuxt Content (SSG prerender) → useTrip('roma')    │
                       │  returns: days[] (with day.cards[]),               │
                       │           monById: Map<slug, Monument>             │
                       └───────────────┬──────────────────┬────────────────┘
                                       │                  │
                  ┌────────────────────┘                  └───────────────────────┐
                  ▼                                                                ▼
   ╔══════════════════════════════╗                          ╔════════════════════════════════╗
   ║  SEARCH (FEAT-03)            ║                          ║  DAY ROUTE (FEAT-09)            ║
   ╠══════════════════════════════╣                          ╠════════════════════════════════╣
   ║ app/utils/searchIndex.ts     ║                          ║ app/utils/dayRoute.ts           ║
   ║  buildHaystack(monument)     ║                          ║  pointFor(monument) → "lat,lng" ║
   ║   → superset of textContent  ║                          ║  capStops(points[]) → ≤10       ║
   ║  createIndex(monuments[])    ║                          ║  buildDirUrl(points[]) → URL    ║
   ║   → MiniSearch instance      ║                          ║  routeLabel(total) → "(N…)"     ║
   ╚══════════════╤═══════════════╝                          ╚═══════════════╤════════════════╝
                  │ (pure, Vitest)                                            │ (pure, Vitest = SC#4)
                  ▼                                                           ▼
   ┌──────────────────────────────┐                          ┌────────────────────────────────┐
   │ useSearch() composable        │                          │ DaySection.vue (existing)        │
   │  useState singleton:          │                          │  computed: points = day.cards    │
   │   query, results, isOpen      │                          │    .map(monById.get).map(pointFor)│
   │  onMounted: build index from  │                          │  v-if points.length >= 2:        │
   │   monById (client-only)       │                          │   <a class="day-route-btn"       │
   └──────────────┬───────────────┘                          │      :href="buildDirUrl(          │
                  ▼                                            │        capStops(points))"        │
   ┌──────────────────────────────┐                          │      target="_blank" rel=noopener>│
   │ SearchBox component (NEW)      │                          │      {{ routeLabel(total) }}      │
   │  wired into #search in         │                          │   </a>  (appended INSIDE         │
   │  TheHero.vue (shell exists)    │                          │         .day-stats)              │
   │  input → query; ≥2 → dropdown  │                          └──────────────────────────────────┘
   │  max 8; "Sin resultados"       │
   │  click result → navigateToCard │──┐
   │  click outside → close         │  │
   └────────────────────────────────┘  │
                                        ▼
                       ┌──────────────────────────────────────────────┐
                       │ useCardNavigation().navigateToCard(slug) (F5)  │
                       │  (scroll-to-card + .highlight + back-stack)    │
                       │  ALL search results resolve in monById (D-02)  │
                       └──────────────────────────────────────────────┘
```

The reader can trace the search use case: typed data → haystack → MiniSearch → query in `useSearch` → dropdown in SearchBox → `navigateToCard`. And the route use case: typed data → `day.cards` order → `pointFor` per monument → `capStops` → `buildDirUrl` → `:href` on the button in `DaySection`.

### Recommended Project Structure
```
app/
├── utils/
│   ├── searchIndex.ts     # NEW — buildHaystack(monument) + createSearchIndex(monuments[])  (pure)
│   └── dayRoute.ts        # NEW — pointFor / capStops / buildDirUrl / routeLabel  (pure)
├── composables/
│   └── useSearch.ts       # NEW — useState singleton (query/results/isOpen) + onMounted index build
├── components/
│   ├── SearchBox.vue      # NEW — wires behavior into the existing #search shell (see Pitfall 6)
│   ├── TheHero.vue        # MODIFY — replace the static .search-wrap placeholder with <SearchBox/> (or wire in place)
│   └── DaySection.vue     # MODIFY — append the .day-route-btn inside .day-stats (computed href + v-if)
tests/
├── unit/
│   ├── dayRoute.spec.ts   # NEW — SC#4: per-day URL parity (pointFor/capStops/buildDirUrl)
│   └── searchIndex.spec.ts# NEW — haystack-coverage + index query (SC#1)
└── parity/
    └── search-route.spec.ts # NEW — self-contained Playwright (build+serve under /guiaRoma/): dropdown behavior + button visibility/label
```

### Pattern 1: Pure index factory + `useState` singleton composable (F4/F5 precedent)
**What:** Search logic splits into (a) pure functions in `app/utils/searchIndex.ts` (haystack builder + `createSearchIndex(monuments)` returning a configured `MiniSearch`), and (b) a `useSearch()` composable that holds reactive state (`query`, `results`, `isOpen`) in `useState` singletons and builds the index in `onMounted` (client-only — the index is ephemeral, never prerendered).
**When to use:** This phase's search. Mirrors `useTripModes`/`useCardNavigation`: pure matrix/logic in `utils`, state in `useState`, effects in `onMounted`.
**Example:**
```typescript
// app/utils/searchIndex.ts — PURE (Vitest-testable, no Nuxt/DOM)
import MiniSearch from 'minisearch'
import type { Monument } from '~~/shared/schemas'

// Build a haystack that is a SUPERSET of the original card.textContent (SC#1 — see Pitfall 1).
export function buildHaystack(m: Monument): string {
  const parts: string[] = [m.name, m.italian, m.roman]
  if (m.badge) parts.push(m.badge)
  for (const s of m.sections) parts.push(s.heading, s.body) // body includes detail-photo caption + detail-list (embedded MDC)
  for (const f of m.facts) parts.push(f.label, f.value)
  if (m.sorrentino) parts.push(m.sorrentino.label, m.sorrentino.text)
  for (const c of m.culture ?? []) parts.push(c.title, c.text)
  for (const a of m.artists ?? []) parts.push(a.label, a.note ?? '')
  for (const a of m.arch ?? []) parts.push(a.label, a.note ?? '')
  return parts.join(' ')
}

export function createSearchIndex(monuments: Monument[]): MiniSearch {
  const mini = new MiniSearch({
    idField: 'slug',
    fields: ['name', 'italian', 'haystack'], // indexed (boosted differently)
    storeFields: ['slug', 'name', 'day'],     // returned in results (dropdown shows name + day)
    searchOptions: {
      prefix: true,            // D-01: prefix
      fuzzy: 0.2,              // D-01: SOFT fuzzy (≤20% of term length; ~1 char in a 5-char term)
      boost: { name: 3, italian: 3, haystack: 1 }, // D-01: italian/name rank above prose
      // combineWith default 'OR' — discretion (see Open Q1)
    },
  })
  mini.addAll(monuments.map(m => ({
    slug: m.slug, name: m.name, italian: m.italian, day: m.day, haystack: buildHaystack(m),
  })))
  return mini
}
```
```typescript
// app/composables/useSearch.ts — singleton state + client-only index build
export function useSearch() {
  const query = useState('search:query', () => '')
  const isOpen = useState('search:open', () => false)
  // index lives in a module-scoped ref or a non-serializable holder built in onMounted (client only).
  // ... see Open Q2 for index-holding mechanics.
}
```

### Pattern 2: Verbatim port of the three route functions + reactive button in DaySection
**What:** `pointFor`/`capStops`/`buildDirUrl` move verbatim into `app/utils/dayRoute.ts`. The only adaptation: `pointFor` takes a `Monument` (not a DOM link) and returns `${coords.lat},${coords.lng}` directly (coords always present). `DaySection.vue` computes the point list from `day.cards` + `monById`, and renders the button with a reactive `:href` and `v-if` — no DOM mutation, no `buildDayRoutes()` imperative re-init.
**When to use:** This phase's route. Renders at SSG prerender time (no `window` needed — unlike F5/F7).
**Example:** see §Code Examples (the verbatim port).

### Pattern 3: Wire behavior into pre-existing shells (do not rebuild markup)
**What:** F3 already rendered the `.search-wrap` (with `#search` input + `#search-results` div) inside `TheHero.vue`, and F2/F4 already render `.day-stats` inside `DaySection.vue`, both verbatim from `index.html`. F6 attaches behavior to these existing elements; it does NOT create parallel markup or new CSS.
**When to use:** Both features. (CONTEXT D-04: "exactly where they were"; the shells are already there.)

### Anti-Patterns to Avoid
- **DOM scraping for the haystack** (`card.textContent`, `querySelectorAll('.card')`): the exact anti-pattern F6 removes (CLAUDE.md §"Buscar scrapeando el DOM"). Build the haystack from typed `Monument` fields.
- **Type-filtering the route** (`day.cards.filter(m => m.type === 'card')`): would BREAK parity — the live Saturday route includes vaticano (guided) and auditorium (concert). See Pitfall 2.
- **Re-deriving the route from a DOM scan of `a.maps-link`**: the new architecture derives it from `day.cards` (the data). Scanning the DOM reintroduces the anti-pattern and couples to render order.
- **"Improving" `capStops`** (even sampling, off-by-one fixes): the index math is load-bearing for SC#4. Port literally. See Pitfall 3.
- **Scoped `<style>` in SearchBox/DaySection**: a `data-v-*` attribute would break the descendant/global selectors (`.search-results.show`, `.day-stats-item.walk`, etc.). Zero new CSS, no scoped blocks (project-wide convention from F3/F4).
- **Prerendering / SSR-ing the MiniSearch index**: the index is client-only ephemeral state (built in `onMounted`); never put it in `useState` serialized payload.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search with prefix + typo tolerance + ranking | A custom `includes()`/regex/scoring loop | MiniSearch 7.2.0 (installed) | Inverted index, prefix tree, Levenshtein fuzzy, per-field boost — all battle-tested. The original's `includes()` is exactly what we're replacing. |
| URL-encoding the Google Maps params | Manual `replace()` escaping | `encodeURIComponent` (as the original does) | The original uses `encodeURIComponent` verbatim; matching it byte-for-byte requires using the same primitive. |
| Card→ficha navigation from a result | A new scroll/highlight implementation | `useCardNavigation().navigateToCard` (F5) | F5 was built specifically for this consumer (SC#2). All results live in `monById` (D-02), so no F5 extension is needed. |
| slug→monument lookup | A new index or array `.find()` | `useTrip().monById` (F3) | Already an O(1) `Map<slug, Monument>` covering all 38 monuments. |
| Day→ordered stops | Re-reading DOM order or the `places` array | `day.cards` (DATA-03) | `day.cards` is the canonical ordered list (= original DOM order); proven to mirror the cards that had `.maps-link`. |

**Key insight:** Almost every "primitive" this phase needs already exists (MiniSearch installed, `monById`, `navigateToCard`, `day.cards`, the CSS, the input shell, the day-stats band). F6 is overwhelmingly *wiring + a verbatim port*, not new construction.

## Common Pitfalls

### Pitfall 1: Haystack narrower than `card.textContent` → SC#1 regression
**What goes wrong:** Building the haystack from only "prose + italian + facts + caption" (the CONTEXT shorthand) omits text that `card.textContent` actually included — `name` (`<h3>`), `roman` (the numeral), `badge` (e.g. "Sorrentino"), the `sorrentino-box`, the `culture-box`, and the `card-artists`/`card-arch` labels (e.g. "Arquitectura: Tardobarroco"). A query like "Tardobarroco" or "Caravaggio" (a badge) matched in the live site via `card.textContent` but would miss if those fields are excluded.
**Why it happens:** `card.textContent` is the *entire visible text* of the `<article>`; the schema splits that across many fields. The CONTEXT enumerates the big ones but isn't exhaustive.
**How to avoid:** Make `buildHaystack` a **superset**: include `name`, `italian`, `roman`, `badge`, every `sections[].heading`+`sections[].body` (the body already embeds detail-photo `caption` and detail-list bullets as MDC), all `facts[].label/value`, `sorrentino.label/text`, every `culture[].title/text`, and `artists[]`/`arch[]` `label`+`note`. SC#1 says "at least what it found today" — a superset is safe; a subset is a regression.
**Warning signs:** A unit test that searches for a badge word ("Sorrentino", "Caravaggio") or an arch-style word ("Tardobarroco") returns 0 results.

### Pitfall 2: Type-filtering the route (THE critical finding) — breaks Saturday parity
**What goes wrong:** Reading CONTEXT/ROADMAP literally ("monuments only — exclude restaurants and guided/concert") and writing `day.cards.filter(slug => monById.get(slug).type === 'card')`. This **drops vaticano (`guided`) and auditorium (`concert`) from Saturday's route** — but the live `index.html` route INCLUDES them.
**Why it happens:** The CONTEXT/ROADMAP wording is **factually wrong** about the original mechanism. The original `buildDayRoutes` selects `section.querySelectorAll('a.maps-link')` in DOM order. **All 38 cards have a `.maps-link`** [VERIFIED: `grep -c 'class="maps-link"'` = 38 = `article.card` count], including vaticano (line 2977) and auditorium (line 3432). The Saturday section contains both cards, so both entered the route. `sabado.cards` literally lists `vaticano … auditorium` (8 stops). [VERIFIED: `content/trips/roma/days/sabado.yml`]
**How to avoid:** Derive the route from **every entry in `day.cards`** — no type filter. `day.cards` already mirrors exactly the DOM cards that carried a `.maps-link` (proven below). The exclusions that DO hold are structural, not type-based:
  - **Restaurants** are excluded because they're `.tl-food-name` links inside `.timeline`, never `article.card` with `.maps-link` — and they're not in `day.cards` at all.
  - **Coliseo** (guided) is excluded because **it has no `article.card`** [VERIFIED: `grep 'article class="card" id="colis'` = none] and is absent from `domingo.cards`.
**Proof of the `day.cards` ↔ DOM mirror** [VERIFIED]:
  - Saturday DOM cards (in order): `vaticano, doria-pamphilj, santeustachio, castel-santangelo, tempietto, smt, fontanone, auditorium` → identical to `sabado.cards`.
  - Sunday DOM cards: `giardino-aranci, buco-serratura, bocca-verita, ghetto, tartarughe, vittoriano, monti` → identical to `domingo.cards` (no coliseo).
**Warning signs:** A per-day URL test for Saturday produces 6 waypoints instead of 8, or omits the Vatican/Auditorium coordinates. This is the most likely way to silently fail SC#3/SC#4.

> **Action for the planner/discuss-phase:** the route task description must say "include all `day.cards`" and explicitly NOT filter by `PlaceType`. The CONTEXT D-02/D-03 wording about "exclude guided/concert" applies only loosely and is contradicted by the live behavior; the URL parity tests (SC#4) are the source of truth.

### Pitfall 3: Rewriting `capStops` sampling — off-by-one breaks the cap URL
**What goes wrong:** "Cleaning up" the sampling loop (e.g. using `Math.floor`, or evenly spacing including endpoints, or `slots`/`middle.length` differently) changes which middle stops survive when a day has >10 stops, producing a different `&waypoints=` and failing SC#4.
**Why it happens:** The original math is non-obvious: it keeps `points[0]` and `points[last]`, then fills `slots = MAX_ROUTE_STOPS - 2 = 8` middle slots from `middle = points.slice(1,-1)` using `idx = slots === 1 ? 0 : Math.round(i * (middle.length - 1) / (slots - 1))`. The `Math.round` and the `slots-1` denominator are load-bearing.
**How to avoid:** Port the function character-for-character (see §Code Examples). Note: with the current Roma data, **no day exceeds 10 cards** (max is Saturday with 8), so `capStops` is effectively a pass-through for the real data — but SC#4 may test it with a synthetic >10 fixture, and parity demands the exact algorithm regardless.
**Warning signs:** A 12-stop synthetic fixture yields a different middle-waypoint set than the original `capStops` would.

### Pitfall 4: `pointFor` using `mapsQuery` instead of coords
**What goes wrong:** Porting `pointFor` to return `encodeURIComponent(monument.mapsQuery)` (the search-query string) instead of `coords`. The original prefers coords: `if (coordById[card.id]) return lat+','+lng;` and only falls back to the URL `query` param if coords are missing.
**Why it happens:** The maps-link href in the DOM uses `?query=Galleria%20Sciarra%20Roma` (the `mapsQuery`), which is tempting to reuse. But `pointFor` ignored that whenever coords existed.
**How to avoid:** `pointFor(monument)` returns `${monument.coords.lat},${monument.coords.lng}`. **Every monument in `places` had `lat`/`lng`** [VERIFIED: all `places[]` entries carry lat/lng], so the original's URL-query fallback **never fired** for route stops. The new schema's `coords` is non-optional on `MonumentSchema`, so the fallback branch is dead code — but you may keep it (returning `mapsQuery`) for defensive parity. The `origin`/`destination` in the live URLs are `lat,lng` pairs, not place names — confirm against a captured live URL.
**Warning signs:** Generated URL has `origin=Galleria%20Sciarra%20Roma` instead of `origin=41.8999403%2C12.4820553`.

### Pitfall 5: Dropdown result row markup/format drift
**What goes wrong:** Enriching the dropdown row (adding type icons, term highlighting, keyboard hints) or changing the "Sin resultados" markup — violating D-03 (pure parity).
**Why it happens:** MiniSearch returns richer result objects; it's tempting to surface more.
**How to avoid:** Replicate the original row exactly: `<a href="#${slug}" class="search-result" data-card="${slug}">${name}<div class="search-result-meta">${day}</div></a>`, the empty state `<div style="padding:.65rem 1rem;color:var(--ink-faint);font-style:italic">Sin resultados</div>` (note the inline style is verbatim), `.slice(0, 8)`, `q.length < 2` guard, and the `.show` class toggling. `name` and `day` come from MiniSearch `storeFields`. [VERIFIED: index.html:6450-6465]
**Warning signs:** Visual-diff (F8) flags the dropdown; or the result `<a>` lacks `data-card`/`class="search-result"`.

### Pitfall 6: Re-creating the search shell instead of wiring the existing one
**What goes wrong:** Building a brand-new `.search-wrap`/`#search` markup in a new component while the one already rendered by `TheHero.vue` still sits in the DOM → two search inputs, or duplicate ids.
**Why it happens:** CONTEXT calls the search box "NUEVO (no hay shell de F3)" — but that's inaccurate: **F3 already rendered the full `.search-wrap` with `#search` + `#search-results` verbatim** in `TheHero.vue:73-85` (as a no-handler placeholder, exactly so the masthead spacing matched the golden). [VERIFIED: `app/components/TheHero.vue`]
**How to avoid:** Either (a) replace the placeholder block in `TheHero.vue` with `<SearchBox/>` that renders the identical markup + behavior, or (b) wire `useSearch` directly into the existing `TheHero.vue` markup. Do NOT add a second `#search`. The `#inicio` location is already correct (D-04). [VERIFIED: original location index.html:2295-2298, inside `#inicio`→`.container`, after `.hero`, before `.pace-wrap` — `TheHero.vue` matches.]
**Warning signs:** Two elements match `#search`; hydration warning about duplicate ids.

## Code Examples

Verified against `index.html` (the source of truth) and the installed MiniSearch types.

### Verbatim port of the route functions (FEAT-09 / SC#3 / SC#4)
```typescript
// app/utils/dayRoute.ts — PURE port of index.html:6582-6623 (Vitest-testable)
// Source: index.html:6582-6623 (buildDayRoutes inner functions)
import type { Monument } from '~~/shared/schemas'

export const MAX_ROUTE_STOPS = 10 // index.html:6582 — Google Maps caps at 10 stops

// Original pointFor(link): coord-by-id first, else the maps-link ?query= param.
// Monuments always have coords, so the fallback never fires for route stops (Pitfall 4).
export function pointFor(m: Monument): string {
  return `${m.coords.lat},${m.coords.lng}` // e.g. "41.8999403,12.4820553"
}

// VERBATIM index.html:6602-6613 — keep first+last, sample the middle. Math is load-bearing (Pitfall 3).
export function capStops(points: string[]): string[] {
  if (points.length <= MAX_ROUTE_STOPS) return points
  const middle = points.slice(1, -1)
  const slots = MAX_ROUTE_STOPS - 2
  const result = [points[0]!]
  for (let i = 0; i < slots; i++) {
    const idx = slots === 1 ? 0 : Math.round((i * (middle.length - 1)) / (slots - 1))
    result.push(middle[idx]!)
  }
  result.push(points[points.length - 1]!)
  return result
}

// VERBATIM index.html:6615-6623 — same param order, same separators, same encodeURIComponent.
export function buildDirUrl(points: string[]): string {
  const enc = encodeURIComponent
  let url = 'https://www.google.com/maps/dir/?api=1&travelmode=walking'
    + '&origin=' + enc(points[0]!)
    + '&destination=' + enc(points[points.length - 1]!)
  const waypoints = points.slice(1, -1)
  if (waypoints.length) url += '&waypoints=' + waypoints.map(enc).join('|')
  return url
}

// VERBATIM index.html:6641-6643 — conditional label.
export function routeLabel(total: number): string {
  return total > MAX_ROUTE_STOPS
    ? `Ver ruta del día (${MAX_ROUTE_STOPS} de ${total} paradas)`
    : `Ver ruta del día (${total} paradas)`
}
```
```vue
<!-- DaySection.vue — append the button inside the EXISTING .day-stats (after the v-for of stats) -->
<!-- Source: button shape index.html:6635-6644; CSS class .day-route-btn already in base.css -->
<script setup lang="ts">
const points = computed(() =>
  props.day.cards
    .map(slug => props.monById.get(slug))
    .filter((m): m is Monument => !!m)        // same defensive filter as dayCards; NO type filter (Pitfall 2)
    .map(pointFor),
)
const routeHref = computed(() => buildDirUrl(capStops(points.value)))
</script>
<template>
  <div class="day-stats">
    <div v-for="(s, i) in day.stats" :key="i" class="day-stats-item" :class="s.variant">
      <MDC :value="s.text" :tag="false" unwrap="p" />
    </div>
    <a
      v-if="points.length >= 2"
      class="day-route-btn"
      :href="routeHref"
      target="_blank"
      rel="noopener"
      title="Abre Google Maps con el recorrido del día a pie"
    >{{ routeLabel(points.length) }}</a>
  </div>
</template>
```

### Search dropdown query + render (FEAT-03 / SC#1 / SC#2 / D-03)
```typescript
// In useSearch() or SearchBox — query handler mirroring index.html:6447-6469
// Source: index.html:6447-6469 (input listener, ≥2 chars, slice(0,8), Sin resultados)
function onInput(value: string) {
  query.value = value
  const q = value.trim()
  if (q.length < 2) { isOpen.value = false; return } // index.html:6449
  results.value = index.search(q).slice(0, 8)          // index.html:6450 — max 8
  isOpen.value = true                                  // index.html:6465 (.show)
}
function onSelect(slug: string, event: Event) {
  isOpen.value = false       // index.html:6459
  query.value = ''           // index.html:6460 (clears the input)
  navigateToCard(slug, event) // index.html:6461 — F5 (SC#2)
}
```
```vue
<!-- Dropdown markup — VERBATIM parity with index.html:6452-6456 (D-03, Pitfall 5) -->
<div id="search-results" class="search-results" :class="{ show: isOpen }">
  <template v-if="results.length">
    <a
      v-for="r in results" :key="r.slug"
      :href="`#${r.slug}`" class="search-result" :data-card="r.slug"
      @click="onSelect(r.slug, $event)"
    >{{ r.name }}<div class="search-result-meta">{{ r.day }}</div></a>
  </template>
  <div v-else style="padding:.65rem 1rem;color:var(--ink-faint);font-style:italic">Sin resultados</div>
</div>
```

### Close-on-outside-click (D-03 fine mechanic)
```typescript
// Mirror index.html:6467-6469. Register in onMounted, clean up in onUnmounted (F5 listener precedent).
// document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) isOpen.value = false })
```

## State of the Art

| Old Approach (index.html) | Current Approach (F6) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `cards.filter(c => c.content.includes(q))` over `card.textContent` | MiniSearch index over typed `Monument` fields | This phase | Prefix + soft fuzzy + ranking; SC#1 "at least what it found today" |
| `querySelectorAll('.card')` + `card.textContent` haystack | `buildHaystack(monument)` from typed fields | This phase | No DOM scrape (CLAUDE.md anti-pattern removed) |
| `buildDayRoutes()` scans `section.querySelectorAll('a.maps-link')` in DOM order | `day.cards.map(monById.get).map(pointFor)` | This phase | Data-driven, deterministic at SSG, no DOM coupling |
| Imperative `stats.appendChild(btn)` + `reinitGuide()` | Reactive `v-if` + `:href` in `DaySection.vue` | This phase | No manual DOM mutation / re-init |

**Deprecated/outdated:**
- The original's `coordById` map built from `places[]` is superseded by `monument.coords` (typed, on every monument).
- The original `pointFor`'s URL-query fallback branch is dead code in the new model (coords always present).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `fuzzy: 0.2` + `boost: { name:3, italian:3, haystack:1 }` is the right "soft fuzzy / italian>prose" tuning for D-01 | §Code Examples, §Pattern 1 | Low — D-01 explicitly delegates exact weights/threshold to research/planner; any conservative values satisfy SC#1 ("at least"). Tunable without parity risk. Final values are Claude's Discretion. |
| A2 | `combineWith` left at MiniSearch default `'OR'` (multi-word query matches any term) | §Code Examples | Low — the original `includes(q)` matched the whole trimmed string as a substring (closer to a phrase match). `'OR'` is broader (safe for SC#1 "at least"); `'AND'` is narrower and could miss. Recommend `'OR'`; flag for the planner. |
| A3 | The live Google Maps URL uses `lat,lng` pairs for `origin`/`destination` (not place names) | §Pitfall 4, §Code Examples | Medium — derived from reading `pointFor` logic (coords-first) + the `places[]` coords, not from a captured runtime URL. The SC#4 test should assert against a URL generated by the SAME `pointFor` logic, so internal consistency holds regardless; but if a human wants byte-match against a manually-opened live URL, confirm the live site emits coords (it does, per the code path). |
| A4 | No day in the Roma data exceeds 10 cards, so `capStops` is a pass-through for real data | §Pitfall 3 | Low — Saturday (8) is the max [VERIFIED from days/*.yml]. `capStops` must still be ported exactly and tested with a synthetic >10 fixture for SC#4 robustness. |

**If this table is empty:** (it is not — 4 low/medium-risk tuning/format assumptions, none affecting the core port).

## Open Questions

1. **MiniSearch `combineWith` and fuzzy threshold (exact values).**
   - What we know: D-01 wants prefix + soft fuzzy + italian>prose ranking. MiniSearch defaults: `combineWith: 'OR'`, `maxFuzzy: 6`, `fuzzy` accepts a 0-1 fraction (edit distance as % of term length). [VERIFIED: index.d.ts:319-355]
   - What's unclear: exact `fuzzy` fraction and per-field boosts (explicitly Claude's Discretion per CONTEXT).
   - Recommendation: `prefix: true`, `fuzzy: 0.2`, `boost: { name: 3, italian: 3, haystack: 1 }`, `combineWith: 'OR'`. Tune during planning/impl; SC#1 only requires "at least" today's coverage, so erring broad is safe.

2. **Where the MiniSearch instance lives (index-holding mechanics).**
   - What we know: `useState` is for *serializable* reactive state (query/isOpen/results-as-plain-objects). A `MiniSearch` instance is NOT serializable and must be built client-side in `onMounted` (the SSG prerender has no need for it).
   - What's unclear: module-scoped `let index` vs a `shallowRef` vs building inside the SearchBox component's `onMounted`.
   - Recommendation: build it once in `onMounted` of the SearchBox (or `useSearchController()` mirroring `useCardNavigationController`), store in a module-scoped `shallowRef<MiniSearch | null>` captured synchronously (avoid the F5 "hooks after await" bug — register `onMounted` before any `await useTrip(...)`). `results` in `useState` holds plain `{slug,name,day}` objects from `storeFields`. This is Claude's Discretion; the F4/F5 controller split is the precedent.

3. **`SearchBox.vue` as a new component vs wiring `TheHero.vue` in place.**
   - What we know: the `.search-wrap` shell already exists in `TheHero.vue` (Pitfall 6).
   - What's unclear: extract to `<SearchBox/>` (cleaner) or add `useSearch` + handlers directly to `TheHero.vue`.
   - Recommendation: a small `SearchBox.vue` keeps `TheHero` focused and isolates the new listener/onMounted; replace the placeholder block 1:1. Either is acceptable (Claude's Discretion, D-04 just fixes location).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| minisearch | FEAT-03 search index | ✓ | 7.2.0 | — (already a dependency) |
| vitest | SC#4 + SC#1 unit tests | ✓ | 4.1.9 | — |
| @playwright/test | dropdown + button parity spec | ✓ | 1.61.0 | — |
| pnpm + `serve` (via `pnpm dlx serve`) | self-contained parity spec (build+serve under /guiaRoma/) | ✓ | (used by existing modes/navigation specs) | — |
| Google Maps (runtime) | the button's href target | n/a (external link, not built/tested against) | — | URL is asserted by structure in tests, never fetched |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

> nyquist_validation is ENABLED (config has no `workflow.nyquist_validation: false`). This section is included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit) + Playwright 1.61.0 (behavior/parity) |
| Config file | `vitest` via `@nuxt/test-utils` context not needed for these pure utils (plain Vitest, like `pace.spec.ts`); Playwright self-contained (no webServer) |
| Quick run command | `pnpm test:unit` (runs `vitest run tests/unit`) |
| Full suite command | `pnpm test:unit && pnpm test:data && pnpm test:golden` (unit + data invariants + Playwright) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-09 | `buildDirUrl(capStops(day.cards.map(pointFor)))` matches the live per-day URL (SC#4) | unit | `pnpm test:unit` → `tests/unit/dayRoute.spec.ts` | ❌ Wave 0 |
| FEAT-09 | `capStops` literal sampling on a synthetic >10 fixture (Pitfall 3) | unit | same file | ❌ Wave 0 |
| FEAT-09 | route includes ALL `day.cards` incl. vaticano/auditorium; NO type filter (Pitfall 2) | unit | `dayRoute.spec.ts` (assert Saturday = 8 stops with vaticano+auditorium coords) | ❌ Wave 0 |
| FEAT-09 | button hidden when <2 stops; label `(N paradas)` / `(10 de N paradas)` (SC#3) | unit + e2e | `dayRoute.spec.ts` (routeLabel) + `tests/parity/search-route.spec.ts` (button visibility on built site) | ❌ Wave 0 |
| FEAT-03 | haystack is a superset of `card.textContent`: querying name/badge/arch/sorrentino/section words returns the right monument (SC#1, Pitfall 1) | unit | `pnpm test:unit` → `tests/unit/searchIndex.spec.ts` | ❌ Wave 0 |
| FEAT-03 | dropdown: ≥2 chars opens, max 8 results, "Sin resultados" empty state (D-03) | e2e | `tests/parity/search-route.spec.ts` | ❌ Wave 0 |
| FEAT-03 | selecting a result calls `navigateToCard` (scroll + `.highlight`) (SC#2) | e2e | `search-route.spec.ts` (assert `.highlight` on the target card + url hash unchanged) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test:unit` (fast pure-function tests for dayRoute/searchIndex).
- **Per wave merge:** `pnpm test:unit && pnpm test:data` (unit + data invariants) then the new Playwright spec.
- **Phase gate:** `pnpm test:golden` (all Playwright incl. the new self-contained `search-route.spec.ts`) green before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `tests/unit/dayRoute.spec.ts` — covers FEAT-09 (SC#4 per-day URL parity + `capStops` synthetic >10 + Pitfall 2 "all cards" assertion + `routeLabel`)
- [ ] `tests/unit/searchIndex.spec.ts` — covers FEAT-03 SC#1 (haystack superset + query returns expected slugs incl. badge/arch/sorrentino words)
- [ ] `tests/parity/search-route.spec.ts` — self-contained Playwright (mirror of `modes.spec.ts`/`navigation.spec.ts`: `pnpm generate` once, serve under `/guiaRoma/` on port `5700 + worker`, tolerate ONLY the color-mode hydration message): dropdown behavior + result→navigation + button visibility/label
- No framework install needed (Vitest + Playwright already present).

**Note on the per-day URL fixtures (SC#4):** the unit test should construct the expected URL by running the SAME ported `pointFor`/`capStops`/`buildDirUrl` over the 5 days' `day.cards` + `monById` coords (read the YAML in the test, like `tests/data/*` already read content), and assert the structure (`dir/?api=1&travelmode=walking&origin=…&destination=…&waypoints=…`) plus exact stop counts per day (Vie/Sab=8/etc.). For an extra-strong parity check, a human can manually open one day's URL from the live `index.html` and compare — but the automated test asserts internal consistency + the Pitfall-2 stop set.

## Security Domain

> `security_enforcement` not set to `false` in config → included. Scope is minimal (client-only, static, no backend, no user data persisted by this phase).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in 1.0 (Nitro dormant). |
| V3 Session Management | no | No sessions. |
| V4 Access Control | no | Static public site. |
| V5 Input Validation | yes (light) | The search input is user-controlled text. It is passed only to `MiniSearch.search()` (in-memory, no eval/SQL) and rendered via Vue template interpolation (auto-escaped). Do NOT render results with `v-html`. The `:href="#${slug}"` uses internal slugs (from typed data, not user input), so no open-redirect/`javascript:` risk. |
| V6 Cryptography | no | None. |

### Known Threat Patterns for {Nuxt SSG client search + external deep-link}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via search results | Tampering / Info disclosure | Render result `name`/`day` with `{{ }}` interpolation (Vue auto-escapes); never `v-html`. (The original used `innerHTML` with `c.title` — F6 improves this by using Vue templates.) |
| Open redirect / `javascript:` in route href | Tampering | `buildDirUrl` only emits a fixed `https://www.google.com/maps/dir/?…` origin with `encodeURIComponent`-escaped coords; `rel="noopener"` on `target="_blank"` (verbatim from original). |
| ReDoS / perf via crafted query | DoS | MiniSearch `maxFuzzy` (default 6) caps fuzzy cost; `fuzzy: 0.2` keeps edit distance small. ~38 docs → negligible. |

## Sources

### Primary (HIGH confidence)
- **`/home/vcompanyb/guiaRoma/index.html`** — the parity source of truth. Verbatim reads: search (6431-6469), route (6579-6646), `places[]` (6269-6298+), card markup (2480-2564), search-box markup (2295-2298), day-stats markup (2387-2390), CSS (`.search-*` 1135-1174, `.day-stats`/`.day-route-btn` 1254-1313).
- **`node_modules/minisearch/dist/es/index.d.ts`** (v7.2.0) — `SearchOptions` (`prefix`/`fuzzy`/`boost`/`weights`/`combineWith`/`maxFuzzy`, lines 270-355), constructor `Options` (`fields`/`storeFields`/`idField`/`searchOptions`/`tokenize`/`processTerm`, lines 262-457), default tokenizer (`SPACE_OR_PUNCTUATION`) + `toLowerCase` processTerm (index.js:1936-1940).
- **`package.json`** — minisearch 7.2.0 in dependencies; vitest 4.1.9, @playwright/test 1.61.0 in devDependencies; scripts (`test:unit`/`test:data`/`test:golden`/`generate`).
- **`shared/schemas.ts`** — `MonumentSchema` (name/italian/roman/badge/coords/type/sections/facts/mapsQuery/sorrentino/culture/artists/arch), `DaySchema.cards`, `PlaceType`.
- **`app/composables/useTrip.ts`, `app/utils/tripIndexes.ts`** — `monById: Map<slug, Monument>` (all 38 monuments, no type filter).
- **`app/composables/useCardNavigation.ts`, `app/utils/cardNav.ts`** — `navigateToCard(slug, event)` (F5, SC#2 consumer); the controller-after-await bug + synchronous-hook fix (relevant to useSearch index build).
- **`app/composables/useTripModes.ts`** — the `useState` singleton + `*Controller()` effect-split pattern to replicate.
- **`app/components/TheHero.vue`** (search-wrap shell exists, lines 73-85), **`app/components/DaySection.vue`** (day-stats band + `day.cards`→`monById` pattern, lines 74-87, 49-51).
- **`tests/unit/pace.spec.ts`, `tests/parity/modes.spec.ts`** — the exact unit + self-contained Playwright precedents.
- **`content/trips/roma/days/sabado.yml` & `domingo.yml`** — `day.cards` content proving the route stop sets (Pitfall 2).

### Secondary (MEDIUM confidence)
- **`npm view minisearch version` / `dist-tags.latest`** (2026-06-21) → `7.2.0` (confirms installed = current latest).
- **`.planning/STATE.md`** — D1 blocker context (artist/reference union null rows); confirmed NOT to affect F6 (monuments are a plain `z.object`, `monById` fully materialized, proven by F5).

### Tertiary (LOW confidence)
- (none — all claims verified against codebase or installed types)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — MiniSearch installed + current latest, verified; no new deps.
- Architecture: HIGH — pure-util + `useState` singleton + controller pattern is the established F4/F5 precedent, read directly; shells already exist.
- Pitfalls: HIGH — the route-inclusion finding (Pitfall 2) is verified by exact grep counts and YAML reads; haystack superset (Pitfall 1) verified against card markup vs schema; `capStops`/`buildDirUrl`/`pointFor` read verbatim.
- Validation: HIGH — mirrors existing `pace.spec.ts` + `modes.spec.ts` infrastructure already green.

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (stable — pinned versions; the only moving part is MiniSearch tuning, which is discretionary)
