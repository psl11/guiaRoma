---
phase: 05-navegaci-n-transversal
plan: 01
subsystem: testing
tags: [vitest, tdd, scrollspy, navigation, pure-functions, nuxt-auto-import, FEAT-05]

# Dependency graph
requires:
  - phase: 03-p-gina-layout-y-tema
    provides: "useTrip() + buildTripIndexes (monById index) — source of the Map consumed by isFichaTarget"
  - phase: 04-render-y-modos
    provides: "app/utils/pace.ts + tests/unit/pace.spec.ts — the exact pure-util precedent mirrored here"
provides:
  - "app/utils/cardNav.ts — DOM-free pure logic: computeActiveSection (scrollspy last-wins), pushScroll/popScroll (LIFO back-stack), isFichaTarget (ficha-vs-section discriminator)"
  - "tests/unit/cardNavigation.spec.ts — fast Vitest coverage of SC#1 (stack/canGoBack), SC#2 (last-wins + load-bearing +130 boundary), SC#3/D-02 (ficha predicate)"
affects: [05-02, navegacion, useCardNavigation, busqueda, ruta-del-dia, mapa]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure-util extraction (app/utils/) + plain Vitest unit spec — mirror of pace.ts/foodGroups.ts; no @nuxt/test-utils, no Nuxt runtime, zero imports"
    - "Scrollspy selector expressed as a pure (scrollY, sections[]) -> id function so the Plan 02 composable delegates instead of duplicating DOM logic"

key-files:
  created:
    - "app/utils/cardNav.ts"
    - "tests/unit/cardNavigation.spec.ts"
  modified: []

key-decisions:
  - "computeActiveSection is a verbatim port of index.html:6492-6496: y = scrollY + 130, for-loop last-wins (no early break), default '' — the +130 (not 124) is asserted as load-bearing by a 124-fails/130-passes boundary case (scrollY 874)"
  - "Back-stack exposed as immutable helpers pushScroll/popScroll returning {top, rest}; the Plan 02 controller will mutate its useState ref directly but delegates the shape to these tested helpers"
  - "isFichaTarget = monById.has(id) — D-02 discriminator that REPLACES the original querySelectorAll('.card') DOM-scan (index.html:6420-6429); it is the bounded security gate (T-05-01) consumed by Plan 02"
  - "cardNav.ts is fully DOM-free / Nuxt-free / zero-import (window/document/useState appear ONLY inside JSDoc citing the original) so coverage runs in plain Vitest"

patterns-established:
  - "Pattern: a 124-fails / 130-passes boundary test (scrollY 874 → offsetTop 1000) is the canonical proof that a load-bearing magic offset is correct"

requirements-completed: [FEAT-05]

# Metrics
duration: 3min
completed: 2026-06-20
---

# Phase 5 Plan 01: Card-Navigation Pure Logic Summary

**DOM-free `app/utils/cardNav.ts` (verbatim +130 last-wins scrollspy, LIFO back-stack helpers, `monById.has` ficha discriminator) covered by a plain Vitest spec, including the 124-fails/130-passes boundary that proves the offset is load-bearing.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-20T23:43:08Z
- **Completed:** 2026-06-20T23:46:Z
- **Tasks:** 2 (TDD RED → GREEN)
- **Files modified:** 2 (both created)

## Accomplishments
- Extracted the two clear-contract pieces of FEAT-05 (scrollspy selector + back-stack) into pure functions, mirroring the `pace.ts` → `pace.spec.ts` precedent exactly.
- `computeActiveSection` ports index.html:6492-6496 1:1 (last-wins, no early break) with the literal `+ 130` offset.
- Locked the load-bearing `+130` (vs `124`) with a decisive boundary test: at `scrollY = 874`, `874+124=998 < 1000` would mark the previous pill, but `874+130=1004 >= 1000` correctly activates the target.
- `isFichaTarget(id, monById)` implements the D-02 ficha-vs-section discriminator as a pure `Map.has(id)`, retiring the original `.card` DOM-scan and exposing the bounded gate (T-05-01) for Plan 02.
- All gates green: `pnpm test:unit` (43 tests, 5 files), `pnpm typecheck`, `pnpm lint`; `pnpm test:data` regression suite unaffected.

## Task Commits

Each task was committed atomically (TDD cycle):

1. **Task 1: RED — failing unit spec** - `14f9886` (test)
2. **Task 2: GREEN — implement cardNav.ts** - `802c8f7` (feat; includes the Rule 1 test-expectation fix)

**Plan metadata:** see final `docs(05-01)` commit.

_No REFACTOR commit: the GREEN implementation was a clean verbatim port needing no cleanup._

## Files Created/Modified
- `app/utils/cardNav.ts` - Pure, DOM-free, zero-import logic: `computeActiveSection` (scrollspy last-wins, `+130`), `pushScroll`/`popScroll` (immutable LIFO back-stack returning `{top, rest}`), `isFichaTarget` (`monById.has(id)` discriminator), and the exported `Section` type. Auto-imported by Nuxt.
- `tests/unit/cardNavigation.spec.ts` - Plain Vitest spec (relative import of `../../app/utils/cardNav`, no `@nuxt/test-utils`): SC#2 last-wins + empty-before-first + the `+130` vs `124` boundary, SC#1 push/pop/canGoBack, SC#3/D-02 ficha predicate against a mock `Map`.

## Decisions Made
- **Verbatim port over re-derivation:** `computeActiveSection` keeps the original `for`-loop iterate-and-overwrite shape (last section wins) rather than `findLast`/reverse, to stay byte-faithful to index.html:6492-6496 and preserve the empty-string default.
- **Immutable stack helpers:** `pushScroll`/`popScroll` return new arrays / `{top, rest}` so they are trivially unit-testable; the Plan 02 composable will own the mutable `useState` ref and delegate the LIFO shape here.
- **Discriminator as the security control:** `isFichaTarget` is `monById.has(id)` only — an arbitrary id falls through to a native section jump (T-05-01, LOW); `getElementById` (Plan 02) is not an injection sink.
- **Followed the `pace.ts`/`foodGroups.ts` convention:** zero framework imports so the spec runs in plain Vitest under the existing `tests/unit/**` runner — no new test infra.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the "empty-before-first" test expectation to respect the +130 offset**
- **Found during:** Task 2 (GREEN — running the spec against the verbatim implementation)
- **Issue:** Task 1's spec asserted `computeActiveSection(0, [{id:'x', offsetTop:50}])` returns `''`. But the load-bearing `+130` means the threshold at `scrollY=0` is `130`, and `130 >= 50` is true → the section IS active (`'x'`). The expectation contradicted the very `+130` semantics the rest of the spec proves. The implementation was the faithful port; the test was wrong.
- **Fix:** Raised the section's `offsetTop` to `200` (must exceed the `+130` threshold to be unsatisfied): `computeActiveSection(0, [{id:'x', offsetTop:200}])` → `''`, correctly exercising the default-empty-string path. Added a clarifying comment.
- **Files modified:** tests/unit/cardNavigation.spec.ts
- **Verification:** `pnpm test:unit` → 43 passed (5 files).
- **Committed in:** 802c8f7 (Task 2 commit)

**2. [Rule 3 - Blocking] Applied `eslint --fix` for `@stylistic/member-delimiter-style`**
- **Found during:** Task 2 (GREEN — `pnpm lint` acceptance gate)
- **Issue:** The project's `@nuxt/eslint` stylistic config requires comma (not semicolon) inline member delimiters; the two type literals (`Section` and `popScroll`'s return type) used `;` → 2 lint errors blocking the lint gate.
- **Fix:** Ran `pnpm exec eslint app/utils/cardNav.ts --fix` (the project-sanctioned formatter per CLAUDE.md §Tooling "formatear con ESLint"). Converted `;` → `,` in the two type literals. Pure formatting, no behavior change.
- **Files modified:** app/utils/cardNav.ts
- **Verification:** `pnpm lint` exit 0; `pnpm test:unit` + `pnpm typecheck` still green.
- **Committed in:** 802c8f7 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug in a self-authored test expectation, 1 blocking lint-format).
**Impact on plan:** Both confined to the two planned files; the production logic is the unchanged verbatim port. No scope creep. The Rule 1 fix actually strengthened the spec's internal consistency with the `+130` invariant.

## Issues Encountered
None beyond the two deviations above (both resolved inline within the GREEN task).

## TDD Gate Compliance
Plan `type: tdd`. Gate sequence verified in git log:
- RED — `test(05-01)` `14f9886` (spec failed: `Cannot find module '../../app/utils/cardNav'`)
- GREEN — `feat(05-01)` `802c8f7` (spec passes; 43/43)
- REFACTOR — not required (clean verbatim port)

No fail-fast violation: the RED run failed on the missing module (not an unexpectedly-passing assertion).

## User Setup Required
None - no external service configuration required. Pure in-memory functions; no DOM, network, or persistence.

## Next Phase Readiness
- Plan 02 (`useCardNavigation` controller) can delegate to all four functions: read `window.scrollY` + section `offsetTop`s and call `computeActiveSection`; mutate a `useState` back-stack via the `pushScroll`/`popScroll` shape; gate `a[href^="#"]` interception with `isFichaTarget(id, useTrip().monById)`.
- The bounded ficha gate (T-05-01) is implemented and unit-proven; Plan 02 only needs to wire `getElementById` for the actual scroll, which is not an injection sink.
- No blockers.

## Self-Check: PASSED
- FOUND: app/utils/cardNav.ts
- FOUND: tests/unit/cardNavigation.spec.ts
- FOUND commit: 14f9886 (test RED)
- FOUND commit: 802c8f7 (feat GREEN)

---
*Phase: 05-navegaci-n-transversal*
*Completed: 2026-06-20*
