---
phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a
plan: 04
subsystem: ui
tags: [search, minisearch, vue, nuxt, composable, client-only, xss-safe, navigation]

# Dependency graph
requires:
  - phase: 06-02
    provides: "app/utils/searchIndex.ts — createSearchIndex(monuments) (MiniSearch factory, monuments-only) + buildHaystack"
  - phase: 05 (F5)
    provides: "useCardNavigation().navigateToCard(id, event?) — smooth-scroll + .highlight, preventDefault (hash unchanged)"
  - phase: 03 (F3)
    provides: "useTrip('roma').monById (computed Map<slug, Monument>) + TheHero placeholder .search-wrap shell"
provides:
  - "useSearch() singleton accessor: query/isOpen/results (useState) + onInput/onSelect"
  - "useSearchController(): client-only MiniSearch index build (hooks-before-await) + outside-click listener"
  - "SearchBox.vue: verbatim .search-wrap shell + {{ }}-only dropdown (>=2 / max 8 / 'Sin resultados'), click -> navigateToCard"
  - "TheHero.vue renders <SearchBox/> in place of its static placeholder (single #search)"
affects: [06-05, parity-playwright, FEAT-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "singleton accessor (pure, idempotent) + *Controller() (effects once) split — mirrors useCardNavigation/useTripModes (CR-01/Pitfall 4)"
    - "synchronous lifecycle-hook registration BEFORE await in async composable controller (A1 fix, F5 §A1) — monByIdRef shallowRef holder + watch resync"
    - "client-only ephemeral state (MiniSearch index) in a module shallowRef, NEVER useState (only serializable query/isOpen/plain-results are useState)"
    - "XSS-safe dropdown: result fields rendered via Vue {{ }} interpolation only, never v-html (T-V5) — sanctioned improvement over the original innerHTML"

key-files:
  created:
    - app/composables/useSearch.ts
    - app/components/SearchBox.vue
  modified:
    - app/components/TheHero.vue

key-decisions:
  - "Index held in a module-scoped shallowRef<MiniSearch|null> (indexRef) read by onInput; controller builds it in onMounted (client-only) — onInput tolerates null (returns []) until ready"
  - "TheHero placeholder .search-wrap block REPLACED in place by <SearchBox/> (D-04, RESEARCH Open Q3) — single #search, no relocation"
  - "Input uses :value + @input (not v-model) so onSelect's query.value='' clear-on-select is explicit and faithful to the original"

patterns-established:
  - "Search UI wiring: accessor + client-only controller, index built in onMounted from monById, navigation delegated to F5"
  - "Render-safety gate: SearchBox carries zero v-html; name/day printed via {{ }} from MiniSearch storeFields"

requirements-completed: [FEAT-03]

# Metrics
duration: 4min
completed: 2026-06-21
---

# Phase 6 Plan 04: Wire client search (FEAT-03 UI) Summary

**Client search wired end-to-end: a `useSearch` singleton (query/isOpen/results + onInput/onSelect) backed by a client-only MiniSearch index built in a hooks-before-await controller, a `SearchBox.vue` rendering the verbatim `.search-wrap` shell with a `{{ }}`-only dropdown (>=2 chars / max 8 / "Sin resultados"), and `TheHero.vue` swapping its static placeholder for `<SearchBox/>` (single `#search`); selecting a result delegates to F5's `navigateToCard` so the URL hash never changes.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-06-21T13:58:08Z
- **Completed:** 2026-06-21T14:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `useSearch()` pure accessor + `useSearchController()` effects-once split (mirrors F5/F4 doctrine), replacing the original's DOM-scraping `innerHTML` dropdown (index.html:6447-6469) with a typed-index + auto-escaped Vue template.
- MiniSearch index built **client-side in `onMounted`** from `monById` (monuments-only, D-02), held in a module `shallowRef` (never serialized to `useState`); lifecycle hooks registered **synchronously before `await useTrip('roma')`** (A1 fix — a hook after `await` is a silent no-op and the feature would die in SSG).
- `SearchBox.vue` renders the verbatim search shell + dropdown: opens at >=2 chars, max 8 rows, verbatim "Sin resultados" empty state; result click clears input + closes + calls `navigateToCard(slug, $event)` (F5) so the hash does not change; outside-click closes.
- `TheHero.vue` placeholder `.search-wrap` block replaced **in place** by `<SearchBox/>` (D-04) — generated home has exactly one `#search`.
- Render-safety gate satisfied: **zero `v-html`** in SearchBox (`name`/`day` via `{{ }}` only, T-V5); zero new CSS, no scoped `<style>`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useSearch.ts (singleton accessor + client-only controller)** - `f1743ed` (feat)
2. **Task 2: Create SearchBox.vue + render it from TheHero.vue** - `84f1b6a` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `app/composables/useSearch.ts` (created) - `useSearch()` accessor (query/isOpen/results useState + onInput/onSelect) and `useSearchController()` (client-only index build in onMounted, hooks-before-await with monByIdRef shallowRef + watch, outside-click listener). Index in a module shallowRef, never useState.
- `app/components/SearchBox.vue` (created) - Verbatim `.search-wrap` shell wired to `useSearch()`; `{{ }}`-only dropdown (`:class="{ show: isOpen }"`, `v-for` rows, `v-else` "Sin resultados"); invokes `useSearchController()` once; no `v-html`, no `<style>`.
- `app/components/TheHero.vue` (modified) - Replaced the static `#search` placeholder block with `<SearchBox/>` in place; updated the header doc-comment to note F6 now renders `<SearchBox/>` there (single `#search`). pace-wrap/light-wrap controls untouched.

## Decisions Made
- **Index holder = module `shallowRef<MiniSearch|null>`** (`indexRef`), populated by the controller in `onMounted`, read by `onInput`; `onInput` tolerates a null index (returns `[]`) before it is ready. Mirrors how `useCardNavigation` shares `monByIdRef` via closure. Keeps the index client-only and out of `useState`.
- **TheHero placeholder replaced in place** by `<SearchBox/>` (D-04 / RESEARCH Open Q3) — the cleaner option; `#inicio` location already correct, not relocated; exactly one `#search` in the DOM.
- **`:value` + `@input` (not `v-model`)** so the clear-on-select (`query.value = ''` in `onSelect`) is explicit and faithful to the original behavior (index.html:6459-6461).
- **Results mapped to plain `{ slug, name, day }`** from MiniSearch `SearchResult`s so `results` stays serializable in `useState`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added explicit `import type { Monument }` in useSearch.ts**
- **Found during:** Task 1 (useSearch.ts typecheck)
- **Issue:** The controller annotates `monByIdRef` as `shallowRef<Map<string, Monument>>`, but `Monument` is not a Nuxt global type (it lives in `~~/shared/schemas`); `pnpm typecheck` failed with `TS2304: Cannot find name 'Monument'`.
- **Fix:** Added `import type { Monument } from '~~/shared/schemas'` — the same explicit import convention `app/composables/useTrip.ts` and `app/utils/searchIndex.ts` already use for schema types.
- **Files modified:** app/composables/useSearch.ts
- **Verification:** `pnpm typecheck` exits 0; `pnpm lint` exits 0.
- **Committed in:** `f1743ed` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for the file to typecheck; no behavior or scope change (a type-only import matching established convention). No scope creep.

## Issues Encountered
None — both tasks executed as planned. The `pnpm generate` chunk-size WARN ("Some chunks are larger than 500 kB") is a pre-existing Nuxt/Vite advisory unrelated to this plan's changes (out of scope per the scope boundary); `pnpm generate` exits 0.

## Verification Evidence
- `pnpm typecheck` exits 0; `pnpm lint` exits 0; `pnpm generate` exits 0 (10 routes prerendered).
- Render-safety gate: `grep` confirms **no `v-html` directive** in SearchBox.vue (only prose mentions of the prohibition in comments) and **no `<style>` block**.
- Single-`#search` invariant in the generated `.output/public/index.html`: exactly **1** `id="search"`, **1** `.search-wrap`, **1** `#search-results`; verbatim placeholder present; dropdown prerenders **closed** (0 `search-results show`) with the "Sin resultados" empty state and **0** result rows (matches the prerendered default `results=[]`, `isOpen=false` — no hydration mismatch). TheHero has **0** `id="search"` (now owned solely by SearchBox).
- Acceptance greps: `useSearch.ts` exports `useSearch`/`useSearchController`, uses `useState` keys `search:query`/`search:open`/`search:results`, contains `length < 2`, `slice(0, 8)`, `navigateToCard`, `shallowRef`, `createSearchIndex`; `onMounted` (src line 125) precedes `await useTrip` (src line 139); index never wrapped in `useState`.

## Known Stubs
None — `useSearch` is fully wired to `createSearchIndex` (06-02), `useTrip().monById` (F3), and `useCardNavigation().navigateToCard` (F5). No placeholder data, no TODO/FIXME, no empty data sources.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FEAT-03 UI complete and wired through F5. The behavioral parity verification (>=2 opens, max 8, "Sin resultados", click -> `.highlight` + hash unchanged, outside-click closes) is the Wave-3 Playwright spec in **Plan 06-05**.
- Index is monuments-only (D-02) so every result resolves in `monById` — no F5 change was needed.
- Carryover (unchanged by this plan): the F4/F6/F7 blocker D1 (discriminated-union `artist`/`reference` collections return all-null SQL rows) remains open but does NOT affect search — the index is built from `monById` (monuments), which materialize fully.

---
*Phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a*
*Completed: 2026-06-21*
