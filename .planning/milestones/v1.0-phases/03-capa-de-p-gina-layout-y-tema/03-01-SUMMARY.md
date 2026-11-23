---
phase: 03-capa-de-p-gina-layout-y-tema
plan: 01
subsystem: testing
tags: [vitest, typescript, pure-helper, i18n, nuxt-auto-import]

# Dependency graph
requires:
  - phase: 02-datos
    provides: "shared/schemas.ts DaySchema.eyebrow (z.string) + 5 day YAML files with eyebrow 'venerdì · 19 giugno' etc."
provides:
  - "app/utils/dayLabel(eyebrow) — pure, auto-imported helper deriving the Italian day-pill label (D-04)"
  - "tests/unit/** disjoint Vitest runner (pnpm test:unit) separate from the Fase 2 tests/data gate"
  - "test:unit package script (vitest run tests/unit)"
affects: [03-03-NavPills, 03-02-useTrip, navigation, parity]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure derive-never-store transforms live in app/utils/ for Nuxt auto-import"
    - "Locale-safe single-char capitalization (charAt(0).toLocaleUpperCase('it') + slice(1)) preserves grave accents"
    - "Two logically disjoint Vitest runners in one config (tests/data gate vs tests/unit helpers) via separate scripts"

key-files:
  created:
    - app/utils/dayLabel.ts
    - tests/unit/dayLabel.spec.ts
  modified:
    - vitest.config.ts
    - package.json

key-decisions:
  - "dayLabel guards split('·')[0] with `?? ''` to satisfy noUncheckedIndexedAccess strict TS while keeping the plan-prescribed split('·') + toLocaleUpperCase('it')"
  - "Single tests/unit/** include glob added alongside tests/data/** (not Vitest projects) — disjointness enforced by the dedicated test:unit / test:data scripts, which is sufficient and simplest"
  - "No navLabel field added to schema and no day YAML touched (D-04: derive, never store)"

patterns-established:
  - "Pattern: app/utils/ pure helpers as the home for derive-never-store transforms (auto-imported in components)"
  - "Pattern: accent-safe capitalization via locale-aware first-char uppercase, never a full-string toUpperCase()"

requirements-completed: [UI-01]

# Metrics
duration: 3min
completed: 2026-06-19
---

# Phase 3 Plan 01: dayLabel helper + disjoint unit runner Summary

**Pure, accent-safe `dayLabel` helper deriving all 5 Italian day-pill labels 1:1 (venerdì→Venerdì) plus a dedicated `tests/unit` Vitest runner that leaves the Fase 2 data gate untouched.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-19T12:42:25Z
- **Completed:** 2026-06-19T12:45:14Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `app/utils/dayLabel.ts`: pure `dayLabel(eyebrow: string): string` deriving the day-pill label per D-04 — substring before `·`, trimmed, first char uppercased locale-safely (`toLocaleUpperCase('it')`) so the grave accent `ì` survives (Venerdì/Lunedì/Martedì), never stored. Auto-imported by Nuxt for Plan 03's NavPills.
- `tests/unit/dayLabel.spec.ts`: plain Vitest (no `@nuxt/test-utils`) asserting all 5 day mappings + accent safety + first-char-only behavior (7 assertions, all green).
- `vitest.config.ts`: `include` extended with `tests/unit/**/*.spec.ts` alongside the existing `tests/data/**` gate; the data gate (295 tests) is fully unaffected.
- `package.json`: new `test:unit` script (`vitest run tests/unit`), parallel in style to `test:data`, keeping the two runners logically disjoint.

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure dayLabel helper + unit test (D-04)** — `b3aa15f` (feat)
2. **Task 2: Extend Vitest to a disjoint tests/unit runner + test:unit script** — `09df284` (chore)

_TDD note: Task 1 followed RED (import-missing failure confirmed via a config-less run) → GREEN (7/7 pass). RED and GREEN were committed together as one atomic task commit since the project `include` did not discover `tests/unit/**` until Task 2 wired it._

## Files Created/Modified
- `app/utils/dayLabel.ts` — pure D-04 transform `eyebrow → label`, auto-imported as `dayLabel`.
- `tests/unit/dayLabel.spec.ts` — unit coverage of all 5 labels + grave-accent safety (SC#2/D-04).
- `vitest.config.ts` — added `tests/unit/**/*.spec.ts` to `include`; updated the explanatory comment; `tests/data/**` left intact.
- `package.json` — added `"test:unit": "vitest run tests/unit"`.

## Decisions Made
- **`?? ''` guard on `split('·')[0]`:** The plan prescribed `eyebrow.split('·')[0]`, but the project's strict TS (`noUncheckedIndexedAccess`) types indexed access as `string | undefined` and `pnpm typecheck` rejected the bare index (TS2532). Guarded with `?? ''` — `String.split` always returns ≥1 element at runtime, so this changes no behavior and keeps the required `split('·')` + `toLocaleUpperCase('it')` with no full-string `.toUpperCase()`.
- **Single include glob, not Vitest projects:** RESEARCH suggested *considering* Vitest projects for separation; the simpler `include` array plus the dedicated `test:unit`/`test:data` scripts already enforces full disjointness (verified: `test:data` runs only its 3 data files, `test:unit` only the 1 unit file), so projects were unnecessary.
- **No schema/YAML changes (D-04):** No `navLabel` field added and no day YAML touched — the label is derived, never stored.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Guarded `split('·')[0]` for strict-TS indexed access**
- **Found during:** Task 1 (Pure dayLabel helper)
- **Issue:** `pnpm typecheck` failed with `app/utils/dayLabel.ts(18,17): error TS2532: Object is possibly 'undefined'` — the project's `noUncheckedIndexedAccess` mode types `split('·')[0]` as `string | undefined`. The plan's verification requires typecheck to be clean, so this blocked task completion.
- **Fix:** Wrapped the indexed access as `(eyebrow.split('·')[0] ?? '')`. `String.prototype.split` always yields at least one element (the whole string when the separator is absent), so the fallback is unreachable at runtime — behavior is identical, and the plan-mandated `split('·')` + `toLocaleUpperCase('it')` shape is preserved (no bare full-string `.toUpperCase()`).
- **Files modified:** app/utils/dayLabel.ts
- **Verification:** `pnpm typecheck` exits 0; 7/7 unit tests still pass; `pnpm lint` exits 0.
- **Committed in:** b3aa15f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required to pass the plan's own typecheck verification under the project's strict TS config; it preserves the prescribed implementation shape and behavior exactly. No scope creep.

## Issues Encountered
- During the RED phase, `pnpm vitest run tests/unit/dayLabel.spec.ts` reported "No test files found" because the project `include` (Task 2's target) did not yet cover `tests/unit/**`. Resolved by confirming genuine RED with a config-less run (`--config /dev/null`, which surfaced the real `Cannot find module '.../dayLabel'` failure), then wiring the config in Task 2 so the plan's exact verify command discovers and passes the spec. Expected ordering, not a defect.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `dayLabel` is available as a Nuxt auto-import for Plan 03 (NavPills day pills, D-04).
- `pnpm test:unit` is the home for Plan 02 (useTrip unit test) and future pure-logic specs; the Fase 2 `pnpm test:data` gate remains green and isolated.
- No new dependency added; `shared/schemas.ts` and the 5 day YAML files are untouched. No blockers.

## Self-Check: PASSED

- FOUND: app/utils/dayLabel.ts
- FOUND: tests/unit/dayLabel.spec.ts
- FOUND commit: b3aa15f
- FOUND commit: 09df284

---
*Phase: 03-capa-de-p-gina-layout-y-tema*
*Completed: 2026-06-19*
