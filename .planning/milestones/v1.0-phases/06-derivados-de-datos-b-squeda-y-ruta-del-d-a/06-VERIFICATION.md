---
phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a
verified: 2026-06-22T16:32:00Z
status: passed
human_signoff: approved (project owner, 2026-06-21 via the 06-05 checkpoint; reaffirmed after the CR-01 fix strengthened parity)
score: 8/8
overrides_applied: 0
human_verification:
  - test: "Open the built /guiaRoma/ site next to the live index.html and verify search + route parity in light/dark × mobile/desktop"
    expected: "Client search finds at least what the original finds (dropdown opens at ≥2 chars, ≤8 rows showing name + day, 'Sin resultados' on no match, click scrolls+highlights the ficha with no hash change). Route button matches the original per day (same stop count, same ordered stops, Saturday includes Vatican + Auditorium)."
    why_human: "Subjective visual/behavioral parity across four theme/width combinations cannot be asserted programmatically. Task 2 of Plan 06-05 was a checkpoint:human-verify gate."
---

# Phase 6: Derivados de datos — búsqueda y ruta del día — Verification Report

**Phase Goal:** Re-derivar desde los datos tipados (no del DOM) las dos features que hoy raspan el HTML, como composables puros y testeables: la búsqueda en cliente con la misma cobertura de texto, y la "ruta del día" con el mismo conjunto de paradas, orden y muestreo.
**Verified:** 2026-06-22T16:32:00Z
**Status:** passed
**Re-verification:** No — initial verification

> **Human parity sign-off:** APPROVED by the project owner during the Plan 06-05 `checkpoint:human-verify` gate (2026-06-21, recorded in 06-05-SUMMARY.md), and reaffirmed in-session: code review subsequently caught CR-01 (search-result select did not clear the query / close the dropdown) and it was fixed (commits `ae38300`/`ef2a489`), so the shipped behavior is *more* parity-faithful than at sign-off time. All 8 must-haves are programmatically VERIFIED; the lone `human_verification` item below is satisfied by this standing approval, so the report status is `passed`.

## Goal Achievement

### Observable Truths (from ROADMAP SC + PLAN frontmatter must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Search haystack is a superset of `card.textContent`: querying badge/arch-style/section-body/italian/fact/sorrentino/culture words returns the right monument | VERIFIED | `app/utils/searchIndex.ts:51-61` — `buildHaystack` concatenates all fields; `tests/unit/searchIndex.spec.ts` asserts each field type (7 individual contains checks + 5 query result checks); `pnpm test:unit` 71/71 |
| 2 | `createSearchIndex` indexes monuments only, keyed by slug, with prefix + soft fuzzy + name/italian boosted above prose | VERIFIED | `searchIndex.ts:88-106` — `idField:'slug'`, `fields:['name','italian','haystack']`, `storeFields:['slug','name','day']`, `searchOptions:{prefix:true,fuzzy:0.2,boost:{name:3,italian:3,haystack:1},combineWith:'OR'}`; no MiniSearch stored in `useState` |
| 3 | Search results carry slug + name + day (dropdown needs name + day) | VERIFIED | `searchIndex.ts:88-106` — `storeFields:['slug','name','day']`; `useSearch.ts:74-78` maps to `{slug,name,day}`; test asserts storeFields shape |
| 4 | The per-day Google Maps URL produced by `buildDirUrl(capStops(day.cards.map(pointFor)))` matches the live index.html structure for all 5 days | VERIFIED | `tests/unit/dayRoute.spec.ts` — SC#4 loop for all 5 days: URL matches `maps/dir/?api=1&travelmode=walking&origin=…&destination=…`, waypoint count = stops − 2; exact stop counts viernes=6, sabado=8, domingo=7, lunes=10, martes=7; `pnpm test:unit` 71/71 |
| 5 | Saturday's route includes ALL 8 day.cards (incl. vaticano guided + auditorium concert) — NO type filter | VERIFIED | `dayRoute.spec.ts:106-120` — Pitfall-2 guard: `dayPoints('sabado').length === 8` + vaticano/auditorium `lat,lng` strings present in points array; `DaySection.vue:66-71` — no `.type` filter anywhere (grepped) |
| 6 | `capStops` keeps first+last and samples middle with literal `Math.round((i*(middle.length-1))/(slots-1))` for >10 stops | VERIFIED | `dayRoute.ts:58-69` — verbatim port; `dayRoute.spec.ts:135-148` — Pitfall-3 synthetic 12-stop fixture: result.length === 10, first/last preserved, middle indices explicitly computed = `[0,1,3,4,5,6,8,9]` |
| 7 | `routeLabel` returns `(N paradas)` for ≤10, `(10 de N paradas)` for >10 | VERIFIED | `dayRoute.ts:92-96`; `dayRoute.spec.ts:157-167` — four cases including boundary (10) and >10 (12) |
| 8 | Each day's `.day-stats` band renders a `.day-route-btn` linking to the day's Google Maps walking route; hidden when <2 stops; button shows correct label; stops include ALL day.cards (no type filter); result→navigateToCard clears+closes; ≥2 chars opens dropdown; max 8; "Sin resultados" | VERIFIED | `DaySection.vue:108-115` — `v-if="points.length >= 2"`, `class="day-route-btn"`, `:href="routeHref"`, `target="_blank"`, `rel="noopener"`, `title="Abre Google Maps…"`, `{{ routeLabel(points.length) }}`; `SearchBox.vue:54-92` — `@click="onSelect(r.slug,$event)"`, no `v-html`, `v-else Sin resultados`; `tests/parity/search-route.spec.ts` 10/10 |

**Score:** 8/8 truths verified

### Deferred Items

None.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/utils/dayRoute.ts` | Pure `pointFor`/`capStops`/`buildDirUrl`/`routeLabel`/`MAX_ROUTE_STOPS`, port verbatim | VERIFIED | File exists; 97 lines; exports all 5; type-only import from `~~/shared/schemas`; no Nuxt/Vue/DOM imports; `Math.round((i*(middle.length-1))/(slots-1))` present verbatim |
| `tests/unit/dayRoute.spec.ts` | Vitest: per-day URL parity (SC#4), Pitfall-2 Saturday=8 guard, Pitfall-3 >10 capStops, routeLabel ternary | VERIFIED | File exists; 168 lines; 4 describe blocks; relative import `../../app/utils/dayRoute`; no `@nuxt/test-utils`; passes in `pnpm test:unit` |
| `app/utils/searchIndex.ts` | Pure `buildHaystack` (superset) + `createSearchIndex` factory | VERIFIED | File exists; 108 lines; exports both; `import MiniSearch from 'minisearch'`; type-only schema import; no Nuxt/Vue/DOM; all haystack fields present (sorrentino/culture/arch/facts/sections/badge/roman confirmed by grep) |
| `tests/unit/searchIndex.spec.ts` | Vitest: haystack superset (Pitfall-1), query returns slugs, storeFields shape, prefix | VERIFIED | File exists; 165 lines; relative import; no `@nuxt/test-utils`; 3 describe blocks covering all required cases; passes |
| `app/composables/useSearch.ts` | `useSearch()` accessor + `useSearchController()` (client-only index, hooks-before-await, shallowRef) | VERIFIED | File exists; 153 lines; exports both; `useState` keys `search:query`/`search:open`/`search:results`; `shallowRef` at module scope; `onMounted`/`onUnmounted` at lines 130/138 before `await useTrip('roma')` at line 144; `slice(0,8)`; `length < 2`; `navigateToCard`; MiniSearch NOT in `useState` |
| `app/components/SearchBox.vue` | `.search-wrap` shell + `{{ }}` dropdown (≥2/max-8/Sin resultados, click→onSelect→navigateToCard); invokes `useSearchController()` once | VERIFIED | File exists; 93 lines; no `v-html`; no `<style` block; `useSearchController().catch(...)` called once; `@click="onSelect(r.slug,$event)"`; `v-else Sin resultados` with verbatim inline style; `:data-card="r.slug"` without `:href="#slug"` (CR-01 fix) |
| `app/components/DaySection.vue` | `points` computed + `routeHref` computed + `.day-route-btn` inside `.day-stats` | VERIFIED | File modified; `points` computed at lines 66-71 (same chain as `dayCards`, no `.type` filter, `.map(pointFor)`); `routeHref` at line 72; `<a v-if="points.length >= 2" class="day-route-btn" :href="routeHref" target="_blank" rel="noopener" title="Abre Google Maps…">` at lines 108-115; no `<style>` block; no `.type` filter confirmed |
| `app/components/TheHero.vue` | Renders `<SearchBox/>` in place of static `.search-wrap` placeholder; single `#search` in DOM | VERIFIED | TheHero.vue line 76: `<SearchBox />`; no `id="search"` in TheHero; SearchBox.vue has exactly 1 `id="search"` |
| `tests/parity/search-route.spec.ts` | Self-contained Playwright spec (build+serve under /guiaRoma/, port 5740) covering dropdown, result→navigation, route-button | VERIFIED | File exists; 255 lines; own `beforeAll` with `pnpm generate` + cpSync + `pnpm dlx serve` port 5740; 5 test cases; console-error gate tolerates only color-mode hydration message; passes 10/10 (`pnpm test:golden -- tests/parity/search-route.spec.ts`) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/utils/dayRoute.ts` | `~~/shared/schemas` (Monument) | type-only import | WIRED | Line 39: `import type { Monument } from '~~/shared/schemas'` |
| `tests/unit/dayRoute.spec.ts` | `app/utils/dayRoute.ts` | relative import | WIRED | Line 5: `from '../../app/utils/dayRoute'` |
| `app/utils/searchIndex.ts` | `minisearch` | default import | WIRED | Line 41: `import MiniSearch from 'minisearch'` |
| `app/utils/searchIndex.ts` | `~~/shared/schemas` (Monument) | type-only import | WIRED | Line 42: `import type { Monument } from '~~/shared/schemas'` |
| `tests/unit/searchIndex.spec.ts` | `app/utils/searchIndex.ts` | relative import | WIRED | Line 2: `from '../../app/utils/searchIndex'` |
| `app/composables/useSearch.ts` | `createSearchIndex` + `monById` + `navigateToCard` | auto-imports | WIRED | `createSearchIndex` called in `onMounted`; `useTrip('roma')` provides `monById`; `navigateToCard` from `useCardNavigation()` line 60 |
| `app/components/SearchBox.vue` | `useSearch()` / `useSearchController()` | composable accessor + controller invoked once | WIRED | Lines 40, 49: both called in `<script setup>` |
| `app/components/TheHero.vue` | `app/components/SearchBox.vue` | replaces placeholder block | WIRED | Line 76: `<SearchBox />` replacing the old inline `.search-wrap` placeholder |
| `app/components/DaySection.vue` | `app/utils/dayRoute.ts` | auto-imported pure utils | WIRED | `buildDirUrl`/`capStops`/`pointFor`/`routeLabel` present in computed/template; no explicit import needed (Nuxt auto-import) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `SearchBox.vue` | `results` | `useSearch().results` ← `indexRef.value.search(q)` ← `createSearchIndex([...monById.value.values()])` built in `onMounted` | Yes — MiniSearch over real Monument data from `useTrip('roma')` | FLOWING |
| `DaySection.vue` | `points` / `routeHref` | `props.day.cards.map(slug=>props.monById.get(slug)).filter(Boolean).map(pointFor)` → `buildDirUrl(capStops(...))` | Yes — derived from typed `day.cards` data resolved against `monById` prop | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit tests (dayRoute + searchIndex) | `pnpm test:unit` | 71/71 passed | PASS |
| E2E behavioral parity (search + route) | `pnpm test:golden -- tests/parity/search-route.spec.ts` | 10/10 search-route tests passed (4 unrelated golden.spec pixel-diff failures are known-deferred to Phase 8) | PASS |

### Probe Execution

No probes declared or applicable for this phase (behavioral parity covered by `tests/parity/search-route.spec.ts`).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| FEAT-03 | 06-02, 06-04, 06-05 | Búsqueda en cliente sobre los DATOS (MiniSearch), cubriendo el mismo texto que hoy, con dropdown que navega a la ficha | SATISFIED | `buildHaystack` superset proven by unit tests; `createSearchIndex` wired through `useSearch`/`SearchBox`/`TheHero`; Playwright spec 10/10 proves dropdown ≥2/max-8/Sin resultados/result→.highlight+hash-unchanged |
| FEAT-09 | 06-01, 06-03, 06-05 | "Ruta del día" derivada de datos: enlace a Google Maps con las paradas del día en orden, con el mismo cap (10 paradas) y muestreo | SATISFIED | `pointFor`/`capStops`/`buildDirUrl`/`routeLabel` ported verbatim; Saturday=8 stops guard; per-day URL parity unit tests; `.day-route-btn` wired in `DaySection.vue`; Playwright spec asserts visibility/label/href |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TBD, FIXME, or XXX markers found in any phase-6 modified file. No `v-html` in template files. No scoped `<style>` blocks in DaySection or SearchBox. No Nuxt/Vue framework imports in pure util modules. No MiniSearch index serialized to `useState`.

### Code Review CR-01 Fix Verification

The critical parity bug identified in 06-REVIEW.md (CR-01) is verified fixed in the codebase:

- `SearchBox.vue:75` — result `<a>` renders `:data-card="r.slug"` WITHOUT `:href="#slug"`. This prevents F5's capture-phase `stopPropagation` (which matches `a[href^="#"]`) from swallowing the bubble-phase `@click`.
- `useSearch.ts:85-89` — `onSelect` clears `query.value = ''` and sets `isOpen.value = false` before calling `navigateToCard`.
- `search-route.spec.ts:224-225` — WR-01 post-selection assertions added: `expect(dropdown).not.toHaveClass(/\bshow\b/)` + `expect(search).toHaveValue('')` — these pass in the 10/10 run.
- `SearchBox.vue:49` — `useSearchController().catch(...)` handles unhandled rejection (WR-02 fix).
- `useSearch.ts:123-126` — `instanceof Element` guard on `onDocumentClick` (WR-03 fix).

### Human Verification Required

The 06-05-SUMMARY.md records that Task 2 (checkpoint:human-verify) was APPROVED by the project owner. However, since this is a goal-backward verification and the PLAN explicitly marks this task as `type="checkpoint:human-verify" gate="blocking"`, it is surfaced here as a human verification item per verification process Step 8 (the automated checks all pass; the subjective parity sign-off is the outstanding human gate).

#### 1. Search + Route Parity Against Live index.html

**Test:** Build and serve the site under the `/guiaRoma/` subpath (`pnpm generate`, then serve `.output/public` under a `guiaRoma/` subdir and open `http://localhost:<port>/guiaRoma/`). Open the live `index.html` side by side. In both:
1. Type a monument name (e.g. "Pantheon"), a prefix (e.g. "Cara" → Caravaggio), a badge word ("Sorrentino"), and a nonsense string.
2. For several days (including Saturday): confirm the "Ver ruta del día (N paradas)" button appears with the same N as the original, and that Saturday shows 8 paradas (including Vatican + Auditorium).

**Expected:** Dropdown opens at 2 chars, ≤8 rows with name + day visible, "Sin resultados" on no match, result click scrolls+highlights ficha with no URL hash change. Route button N matches original per day; Saturday = 8 paradas. Verified in light/dark × mobile/desktop.

**Why human:** Visual and behavioral parity across four theme/width combinations cannot be verified programmatically. The subjective quality of the search experience (feel, ordering, completeness) requires side-by-side human comparison against the live guide.

**Note:** The 06-05-SUMMARY.md records this gate was APPROVED by the project owner on 2026-06-21. If that approval stands, status can be upgraded to `passed`.

### Gaps Summary

No gaps found. All 8 must-have truths are VERIFIED with direct codebase evidence. All code review findings (CR-01, WR-01, WR-02, WR-03) are fixed and confirmed in the implementation. The 4 pre-existing `golden.spec.ts` pixel-diff failures are correctly deferred to Phase 8 (PARITY-02) — they are not phase-6 gaps.

The only outstanding item is the human parity sign-off (Task 2 of Plan 06-05), which per the PLAN is a blocking `checkpoint:human-verify` gate. The SUMMARY records it as APPROVED by the project owner on 2026-06-21.

---

_Verified: 2026-06-22T16:32:00Z_
_Verifier: Claude (gsd-verifier)_
