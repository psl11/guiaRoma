---
phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas
plan: 01
subsystem: testing
tags: [zod, vitest, leaflet, svg, nuxt-content, pure-utils, tdd]

# Dependency graph
requires:
  - phase: 02-datos-tipados
    provides: "MonumentSchema/TripSchema + 38 monument YAML + Coords/PlaceType/Motif sub-schemas in shared/schemas.ts; tests/data/schema.spec.ts gate"
  - phase: 06-derivados-de-datos
    provides: "app/utils/* pure-logic + plain-Vitest precedent (pace.ts/searchIndex.ts/dayRoute.spec.ts real-YAML loader)"
provides:
  - "deriveMarkers(monById, extras) → 39 MapMarker (38 monuments + 1 Coliseo extra, D-01) in app/utils/mapMarkers.ts"
  - "isOffline(errored, loaded) verbatim offline-banner predicate in app/utils/mapOffline.ts"
  - "SVG_MOTIFS (19 verbatim strings) + motifSvg(motif) lookup in app/utils/svgMotifs.ts"
  - "TripSchema.mapExtras (optional Coliseo extra-marker array) + the Coliseo datum in trip.yml"
  - "Motif type export in shared/schemas.ts (z.infer of the Motif enum)"
affects: [07-02-leaflet-island, 07-03-image-fallback, 08-parity-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure map-marker derivation as app/utils/* (mirrors searchIndex.ts factory), unit-tested with the dayRoute.spec.ts real-YAML loader"
    - "Verbatim SVG asset table generated from index.html (byte-faithful), not hand-transcribed"

key-files:
  created:
    - app/utils/mapMarkers.ts
    - app/utils/mapOffline.ts
    - app/utils/svgMotifs.ts
    - tests/unit/mapMarkers.spec.ts
    - tests/unit/mapOffline.spec.ts
    - tests/unit/svgMotifs.spec.ts
  modified:
    - shared/schemas.ts
    - content/trips/roma/trip.yml

key-decisions:
  - "mapExtras chosen as the schema/YAML field name (planner discretion per D-01); reuses Coords/PlaceType, no slug (no ficha)"
  - "SVG_MOTIFS generated programmatically from index.html:2212 (JSON.parse the literal → single-quoted TS), guaranteeing all 19 strings byte-faithful; no value contains a single quote or backslash so single-quoting is lossless"
  - "Motif type export added to schemas.ts (z.infer<typeof Motif>) — the enum was a value-only export; svgMotifs.ts's `import type { Motif }` contract from the plan needed the type"
  - "Marker unit assertions are on COUNT (39) + presence (★ Coliseo, ♪ auditorium), never order (fitBounds/markers order-independent — RESEARCH Open Q1)"

patterns-established:
  - "Pure logic → app/utils/ + plain Vitest (RELATIVE import, real-YAML loader for data-dependent specs)"
  - "Verbatim asset port via programmatic extraction (round-trip verified) instead of manual copy of long strings"

requirements-completed: [FEAT-02, UI-05]

# Metrics
duration: 8min
completed: 2026-06-23
---

# Phase 7 Plan 01: Mapa/fallback data + pure-logic foundation Summary

**Wave-0 deterministic pieces for the Leaflet island: deriveMarkers (38 monuments + the Coliseo extra = 39, D-01), the verbatim offline-banner predicate, the 19 byte-faithful SVG_MOTIFS + motifSvg lookup, and TripSchema.mapExtras carrying the single Coliseo datum — all covered by browserless Vitest.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-23T12:15Z
- **Completed:** 2026-06-23T12:23Z
- **Tasks:** 3
- **Files modified:** 8 (5 created utils/specs, 3 modified — schemas.ts counted once)

## Accomplishments
- `TripSchema.mapExtras` (optional, reuses `Coords`/`PlaceType`, no `slug`) + the single Coliseo extra-marker datum in `trip.yml` (verbatim `index.html:6292`); the `tests/data/schema.spec.ts` gate validates it (295 tests green).
- `deriveMarkers(monById, extras)` → exactly 39 markers (38 monuments + the Coliseo `★`); blinded by D-01 (never derived from `monById` alone, which would drop the Coliseo to 38).
- `isOffline(errored, loaded)` — verbatim `errored > 3 && loaded === 0` heuristic from `index.html:6330`.
- `SVG_MOTIFS` (19 strings, byte-faithful port of `index.html:2212`) + `motifSvg(motif)` lookup; `CARD_TO_MOTIF` intentionally NOT ported (replaced by the typed `monument.motif`).
- Three browserless Vitest specs (16 assertions across them); full unit suite green at 87 tests / 10 files.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend TripSchema + add the Coliseo datum to trip.yml** — `1225efe` (feat)
2. **Task 2: Pure utils mapOffline + svgMotifs + their Vitest specs (TDD)** — `7b3d9bb` (feat)
3. **Task 3: Pure util mapMarkers (deriveMarkers) + its Vitest spec (TDD)** — `307a787` (feat)

**Plan metadata:** see the docs commit (this SUMMARY + STATE/ROADMAP/REQUIREMENTS).

_TDD tasks 2 & 3 followed RED→GREEN (verified failing before implementing); committed as one feat per task in sequential mode._

## Files Created/Modified
- `app/utils/mapMarkers.ts` — pure `deriveMarkers(monById, extras): MapMarker[]` (38 + extras = 39, D-01) + `MapMarker` interface.
- `app/utils/mapOffline.ts` — pure `isOffline(errored, loaded)` offline-banner predicate (verbatim `index.html:6330`).
- `app/utils/svgMotifs.ts` — 19 verbatim `SVG_MOTIFS` strings + `motifSvg(motif)` lookup (verbatim `index.html:2212`).
- `tests/unit/mapMarkers.spec.ts` — real-YAML loader (mirrors `dayRoute.spec.ts`); asserts count 39 + `★`/`♪` presence + field mapping.
- `tests/unit/mapOffline.spec.ts` — truth table over the `>3` boundary and the `loaded===0` gate.
- `tests/unit/svgMotifs.spec.ts` — 19 keys = `Motif` enum, each value starts with `<svg`, `motifSvg` returns string/undefined.
- `shared/schemas.ts` — added `TripSchema.mapExtras` (reuses `Coords`/`PlaceType`) + a `Motif` type export.
- `content/trips/roma/trip.yml` — added the `mapExtras:` block with the single Coliseo entry.

## Decisions Made
- **`mapExtras` field name** (planner discretion per D-01): one optional array, exactly one element (the Coliseo), reusing `Coords`/`PlaceType`; no `slug`/`id` (it has no ficha).
- **SVG port via programmatic extraction:** `JSON.parse` the `SVG_MOTIFS` object literal from `index.html:2212` and re-emit each value single-quoted; verified all 19 strings round-trip byte-faithfully and none contain a single quote/backslash. Safer than hand-copying 19 long strings.
- **Marker assertions on count + presence, not order:** `fitBounds`/marker painting are order-independent (RESEARCH Open Q1); the spec proves the `★` (Coliseo extra, `guided`, no ficha) and `♪` (auditorium, real `concert` monument) are both present, plus a 38-vs-39 guard.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added a `Motif` type export to shared/schemas.ts**
- **Found during:** Task 2 (svgMotifs.ts implementation)
- **Issue:** The plan's `<interfaces>` block and PATTERNS.md prescribe `import type { Motif } from '~~/shared/schemas'`, but `Motif` was only a **value** export (`export const Motif = z.enum([...])`), not a TS type. Typecheck failed: `TS2749: 'Motif' refers to a value, but is being used as a type here`.
- **Fix:** Added `export type Motif = z.infer<typeof Motif>` alongside the existing `z.infer` type exports (`Monument`/`Trip`/…) — mirrors the established pattern, single source of truth, no new schema surface.
- **Files modified:** `shared/schemas.ts`
- **Verification:** `pnpm typecheck` exit 0; `svgMotifs.ts` `motifSvg(motif: Motif | undefined)` compiles; existing 295 data tests still green (the `Motif` enum value is unchanged).
- **Committed in:** `7b3d9bb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix realizes the plan's own stated import contract; the value enum (the actual validation gate) is untouched. No scope creep.

## Issues Encountered
- `lint` flagged two `@stylistic/quotes` errors (the generated `svgMotifs.ts` import + one spec `it()` title that contained a single quote, written double-quoted). Resolved with `pnpm lint:fix`, then re-verified all 19 SVG strings remained byte-faithful (round-trip check) — `lint` exit 0.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The three pure pieces the Leaflet island (Plan 02) and the image fallback (Plan 03) consume are ready and unit-verified: `deriveMarkers` (Plan 02 passes `trip.mapExtras` mapped to `MapMarker`), `isOffline` (Plan 02 keeps the counters + `classList.add('show')`), and `motifSvg` (Plan 03 hero/detail `@error` → `v-html` of the trusted static SVG).
- Carry-forward blocker (heritage, NOT introduced here): the discriminated-union `artist`/`reference` collections still return all-null SQL rows (D1) — affects `#arte`/`#arquitectura`/`#reservas`/`#practica`, not the map. Unblocked work for Plan 02/03.

## Self-Check: PASSED

- All 6 created files exist on disk (3 utils + 3 specs).
- All 3 task commits exist in git history (`1225efe`, `7b3d9bb`, `307a787`).

---
*Phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas*
*Completed: 2026-06-23*
