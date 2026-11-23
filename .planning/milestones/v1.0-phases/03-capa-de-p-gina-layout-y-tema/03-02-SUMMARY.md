---
phase: 03-capa-de-p-gina-layout-y-tema
plan: 02
subsystem: data
tags: [nuxt-content, queryCollection, useAsyncData, composable, ssg, zod, vitest]

# Dependency graph
requires:
  - phase: 02-modelo-de-datos
    provides: "6 zod collections in shared/schemas.ts + content.config.ts (trip/day/monument/food/artist/reference) and the migrated Roma YAML corpus"
  - phase: 03-capa-de-p-gina-layout-y-tema (Plan 01)
    provides: "tests/unit/** Vitest runner include + dayLabel pure-helper precedent"
provides:
  - "useTrip(slug): single typed entry point aggregating the 6 collections at SSG with id-indexed Maps"
  - "buildTripIndexes: pure, framework-free slug-keyed Map builder (monById/foodById/artById/refById)"
  - "Documented F4 data-flow convention (A3): TripView calls useTrip; pages render <TripView :slug>"
affects: [03-04, 03-05, "F4 render+modos", "F5 navegacion", "F6 derivados", "F7 mapa"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useTrip aggregation: 6 useAsyncData(queryCollection) in Promise.all, unique key per (collection, slug), resolves at prerender (offline)"
    - "trip-filter for multi-trip (ARCH-01): .where('trip','=',slug) on the 5 trip-scoped collections; trip itself by .where('slug','=',slug).first()"
    - "Pure-indexer extraction: id-Map building lives in app/utils/ so SC#1 is unit-testable without @nuxt/test-utils"
    - "zod types are the source of truth for the return type where Content v3 cannot expand discriminated-union item types"

key-files:
  created:
    - app/composables/useTrip.ts
    - app/utils/tripIndexes.ts
    - tests/unit/tripIndexes.spec.ts
  modified: []

key-decisions:
  - "artist/reference are zod discriminatedUnions → Content v3 emits empty item types ({}); useTrip's return is typed against the zod schema types (shared/schemas) via as-unknown-as so F4-F7 get real types, not {}"
  - "reference .order('order','ASC') builder cast to any (one localized eslint-disable): .order accepts only keyof and the union's generated key set omits the (real) order column; runtime SQL unchanged"
  - "slug is the only entity key queried; .where('id', …) is never used (id is Content-reserved)"
  - "id Maps built inside computed() so they recompute on async-data resolution and stay valid through hydration"

patterns-established:
  - "useTrip is the data root: pages/components read trip data only through it (A3 — TripView calls useTrip, pages are <TripView :slug> one-liners)"
  - "Pure transforms (dayLabel, buildTripIndexes) live in app/utils/ and are covered by plain Vitest in tests/unit/**, keeping @nuxt/test-utils out of the dep tree"

requirements-completed: [ARCH-01]

# Metrics
duration: 7min
completed: 2026-06-19
---

# Phase 3 Plan 02: useTrip data root Summary

**`useTrip(slug)` aggregates the 6 Nuxt Content collections (trip/days/monuments/food/artists/reference) into typed refs + slug-keyed id Maps via `queryCollection`+`useAsyncData`, resolving at prerender, with the pure `buildTripIndexes` helper unit-tested under plain Vitest (SC#1, ARCH-01).**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-19T12:48:00Z
- **Completed:** 2026-06-19T12:55:00Z
- **Tasks:** 2
- **Files modified:** 3 (all created)

## Accomplishments
- `useTrip(slug)` — the single trip-data entry point: six `useAsyncData(queryCollection(...))` calls in `Promise.all`, each with a unique key per (collection, slug), filtered by `trip` (and trip-by-`slug`), with `day`/`reference` ordered ASC. Resolves at SSG against the build-time SQLite dump (no runtime server — offline path preserved).
- `buildTripIndexes` — a pure, framework-free builder of the four slug-keyed id Maps (`monById`/`foodById`/`artById`/`refById`) with `?? []` guards for the async-data hydration window. Extracted so SC#1's index shape is testable without adding `@nuxt/test-utils`.
- SC#1 index-shape coverage in plain Vitest (5 tests): 4 Maps exist, `.get(slug)` resolves the right entity, `.size` is exact, empty + `null`/`undefined` inputs yield empty Maps.
- Documented the F4 data-flow convention in-file (A3): `TripView` calls `useTrip`; pages render `<TripView :slug>`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure tripIndexes builder + unit test (SC#1 index shape)** - `4449a34` (feat)
2. **Task 2: useTrip composable — aggregate 6 collections, resolve at SSG** - `10ce291` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

_Note: Task 1 was net-new TDD; the RED state was the absent module (the spec failed to import before the helper existed), so the pure helper + its spec landed in one feat commit rather than separate test→feat commits._

## Files Created/Modified
- `app/composables/useTrip.ts` - Single typed trip-data entry point (SC#1/ARCH-01): aggregates the 6 collections + id Maps, resolves at prerender.
- `app/utils/tripIndexes.ts` - Pure slug-keyed id-Map builder (`buildTripIndexes`), extracted for unit-testability.
- `tests/unit/tripIndexes.spec.ts` - SC#1 index-shape coverage via plain Vitest (5 tests).

## Decisions Made
- **Return type from zod, not Content:** `artist` and `reference` are `z.discriminatedUnion` schemas; Content v3 generates their item types as empty interfaces (`extends DataCollectionItemBase {}`) because it can't expand a union from Draft-07 JSON-Schema. To give F4-F7 real types (not `{}`), `useTrip`'s return is typed against the zod-inferred schema types from `shared/schemas` (`Trip`/`Day[]`/…) via `as unknown as Ref<…>`. The runtime is unchanged; only the static type improves.
- **`reference` ordering cast:** `.order()` accepts only `keyof PageCollections[T]` (no `string` escape, unlike `.where()`), and the union's generated key set omits the (real) `order` SQL column. The `reference` query builder is cast to `any` for just the `.order('order','ASC')` chain (one localized `eslint-disable`) to keep the verified ASC ordering without weakening strictness elsewhere.
- **slug-only queries:** `.where('id', …)` is never used (the reserved Content field); `slug` is the stable anchor on every entity, matching the Fase 2 schema header rule.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Strict-TS gaps from Content v3 not expanding discriminated-union collections**
- **Found during:** Task 2 (useTrip composable)
- **Issue:** `pnpm typecheck` failed with 5 errors. Content v3 generates empty item types for the `artist` and `reference` collections (both `z.discriminatedUnion`), so (a) `.order('order','ASC')` on `reference` failed (`order` not a `keyof` the empty type — TS2345) and (b) direct `as Artist[]`/`as Reference[]` casts of the query data failed for lack of type overlap (TS2352).
- **Fix:** Typed `useTrip`'s return against the zod-inferred schema types via `as unknown as Ref<…>` (the zod schema in `shared/schemas` is the same contract that validates the data in `tests/data`), and cast the `reference` `.order(...)` builder to `any` for that single chain with one localized `eslint-disable`. The runtime queries and SQL ordering are exactly the RESEARCH/PATTERNS-verified pattern — only the static types were bridged.
- **Files modified:** app/composables/useTrip.ts
- **Verification:** `pnpm typecheck` exits 0; `pnpm exec eslint app/composables/useTrip.ts app/utils/tripIndexes.ts` exits 0; SC#1 unit test 5/5 green.
- **Committed in:** `10ce291` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The fix was required for the plan's own `pnpm typecheck` verify to pass and is a structural consequence of the Fase 2 data model (two discriminated-union collections) meeting Content v3's type generation. No scope creep; the queries match the verified pattern 1:1.

## Issues Encountered
None beyond the deviation above. The verified `@nuxt/content` API (`.where`/`.order`/`.first`/`.all`) matched the installed `client.d.ts` exactly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `useTrip` is the data root for F4-F7. Plan 03/04 build the chrome (layout/theme/NavPills) and `TripView`, which must call `useTrip` and follow the documented A3 convention (`<TripView :slug>`).
- Behavioral aggregation against the real Roma content is asserted end-to-end in Plan 05 (the `/` build renders `#inicio` from `useTrip('roma')`); a runtime `queryCollection` unit test was intentionally avoided to keep `@nuxt/test-utils` out of the dependency tree (RESEARCH Wave 0).
- Known type caveat for downstream: consumers of `artists`/`reference` get the rich zod union types from `useTrip`'s return (not Content's empty `{}`); narrow via the discriminant (`kind` for artist, `slug` for reference) as designed.

## Self-Check: PASSED

- All 3 created files exist on disk (`app/composables/useTrip.ts`, `app/utils/tripIndexes.ts`, `tests/unit/tripIndexes.spec.ts`).
- Both task commits exist in git history (`4449a34`, `10ce291`).
- Plan verification green: SC#1 unit test 5/5, `pnpm typecheck` exit 0, `pnpm exec eslint` (both files) exit 0.

---
*Phase: 03-capa-de-p-gina-layout-y-tema*
*Completed: 2026-06-19*
