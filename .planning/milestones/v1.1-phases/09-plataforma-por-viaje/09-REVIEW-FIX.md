---
phase: 09-plataforma-por-viaje
fixed_at: 2026-11-22T13:20:00Z
review_path: /home/vcompanyb/guiaRoma/.planning/phases/09-plataforma-por-viaje/09-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 9: Code Review Fix Report

**Fixed at:** 2026-11-22T13:20:00Z
**Source review:** /home/vcompanyb/guiaRoma/.planning/phases/09-plataforma-por-viaje/09-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (CR-01, WR-01; fix_scope = critical_warning)
- Fixed: 2
- Skipped: 0
- Out of scope (left in REVIEW.md): IN-01 (symlink message), IN-02 (`listTripDirs` "No lanza" docstring)

## Fixed Issues

### CR-01: Hidden trip folders are loaded by Nuxt Content but skipped by the data gate (fail-open remains)

**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/data/fixtures/trips/.oculto-dir/trip.yml` (new fixture), `scripts/tripManifest.mjs`, `tests/unit/tripManifest.spec.ts`, `tests/README.md`
**Commit:** 6473be8
**Applied fix:**
- `rootEntries()` now ignores only hidden **non-directories** at the root (`.DS_Store`, `.gitkeep`). A hidden directory is returned by `listTripDirs()` as a trip folder, so `schema.spec.ts` / `invariants.spec.ts` run it through `checkTrip`. It fails with `trip-slug` (`TRIP_SLUG_RE` cannot match a leading `.`, and the slug cannot equal the folder) or with `trip-yml` if it has no `trip.yml`. Either way the violation names its path. Docstrings and the file header now describe this contract.
- `readTripManifest()` no longer filters out hidden names. A hidden folder with `trip.yml` now reaches the existing `TRIP_FOLDER_RE` check and throws at config time, so the build fails closed. Before, a `draft: true` trip in a hidden folder could skip `draftExcludes`. Real trips are unaffected: the manifest's real-tree tests still pass, and `content.config.ts` is untouched.
- New on-disk fixture `tests/data/fixtures/trips/.oculto-dir/trip.yml`: a valid trip with `slug: oculto`. New tests check that `listTripDirs(FIXTURES)` returns `['.oculto-dir', 'campania-2027', 'suelto']` and that `checkTrip(loadTrip('.oculto-dir', FIXTURES))` reports `trip-slug` on its `trip.yml`. The existing hidden-file fixture `.oculto.yml` is still ignored by `checkTripsRoot`.
- In `tripManifest.spec.ts`, the old test "ignora ... carpetas ocultas" became two tests. A hidden folder with no `trip.yml` is still ignored. A hidden folder **with** `trip.yml` throws an error naming `content/trips/.x:`.
- The `tests/README.md` §5.3 paragraph now matches the code: hidden files are ignored, hidden folders are gated, and the manifest throws on them.

### WR-01: Non-YAML files inside a trip folder are still skipped with no violation

**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** 39d33fd
**Applied fix:**
- `loadTripFromFiles()` now reports every non-YAML file in a trip folder as `stray-file`, with the message "fichero no YAML en la carpeta del viaje (Content lo ignoraría)". The only exception is hidden files: a new `isHidden(rel)` helper checks whether any path segment starts with `.`. Hidden YAML files are still classified, which matches Content's `dot: true`. The docstring and header are updated.
- New tests use strict `toEqual`, so the file is reported and never loaded. They cover `monuments/galeria.json`, `galeria.yml~`, `galeria.yml.bak`, `galeria.ym`, `galeria.yml ` (with a trailing space) and `notas.md`. A separate test checks that `.DS_Store`, `monuments/.gitkeep` and `.cache/notas.txt` produce no violations.
- `content/trips` still contains no non-YAML files (`find content/trips -type f ! -name '*.yml'` prints nothing), and the real-tree gate stays green.

## Verification

Gates ran in the **main checkout** (`workflow.use_worktrees: false`, so no worktree was created). The results can be reproduced from the current tree on Node v22.20.0:

- `pnpm test:data`: 8 files, 794/794 passed (was 787; +1 CR-01 test, +7 WR-01 tests)
- `pnpm test:unit`: 24 files, 568/568 passed (includes `tests/unit/tripManifest.spec.ts`, 17/17)
- `pnpm lint`: exit 0

Not touched: `content/trips/roma/`, `tests/parity/` (goldens), `app/assets/css/`, `content.config.ts`.

---

_Fixed: 2026-11-22T13:20:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
