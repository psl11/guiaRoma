---
phase: 08-verificaci-n-de-paridad
plan: 03
subsystem: parity-gate
tags: [playwright, ci-gate, visual-regression, config]
requires:
  - "tests/parity/visual-diff.spec.ts (Plan 02): its toHaveScreenshot resolves through this gate config's snapshotPathTemplate"
  - "tests/parity/golden.spec.ts-snapshots/ (Phase 1): the 56 frozen PNGs the template pins to"
  - "playwright.config.ts (Phase 1): the base config this gate extends"
provides:
  - "playwright.gate.config.ts: gate-scoped Playwright config — testIgnore golden.spec.ts (D-04 #1) + snapshotPathTemplate pinned to the frozen golden dir (D-01)"
  - "pnpm verify: the single SC#4 gate command (clean generate + test:unit + test:data + test:parity)"
  - "pnpm test:parity: gate-scoped parity run with the dev-routing test grep-inverted"
affects:
  - "Plan 04: adds the dev-routing env-flag skip + records the gate's expected test count + documents both exclusions"
  - "Plan 05/06: the first real green gate run + diff classification (D-02)"
tech-stack:
  added: []
  patterns:
    - "Gate-scoped Playwright config that spreads the base config and overrides testIgnore + snapshotPathTemplate (no edit to the base)"
    - "Frozen-baseline snapshotPathTemplate pinned to a fixed dir, decoupling the snapshot dir from {testFileName} so a sibling spec reads an existing baseline instead of auto-creating one"
    - "Two-layer gate exclusion: golden.spec.ts at FILE level (testIgnore, rename-proof); dev-routing test by stable title grep-invert (belt to the Plan 04 env flag)"
key-files:
  created:
    - "playwright.gate.config.ts — extends base, testIgnore '**/golden.spec.ts', snapshotPathTemplate 'tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}'"
  modified:
    - "package.json — added test:parity + verify scripts (all 12 pre-existing scripts retained)"
decisions:
  - "D-01 mechanic: snapshotPathTemplate pinned to tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext} so visual-diff.spec.ts's toHaveScreenshot(`<view>-<theme>.png`) resolves to the frozen PNG (e.g. inicio-light + desktop → inicio-light-desktop.png). Array-path form forbidden; the config template is the supported escape hatch."
  - "D-04 #1: golden.spec.ts excluded at FILE level via testIgnore (stable across renames), NOT by title/line; it re-renders the OLD index.html and is flaky under parallel load. golden.spec.ts + test:golden/test:golden:update stay intact as the on-demand F1 capture tool."
  - "D-04 #2: the dev-routing test (shell.spec.ts, 'reutiliza el MISMO TripView…') is NOT testIgnored (shell.spec.ts stays in the gate for its static assertions); neutralized by a --grep-invert belt in test:parity on its stable title substring (belt to the env flag added in Plan 04 — both target the SAME test)."
  - "D-03: pnpm verify chains a clean build at the FRONT (pnpm generate, per RESEARCH Open-Q#1) then test:unit + test:data + test:parity, so the diff reflects current code, not a stale .output."
  - "Full gate NOT forced green here (per plan constraints): the first real green run is Plan 06. typecheck-only verify gate this plan."
metrics:
  duration_min: 2
  tasks: 1
  files: 2
  completed: 2026-06-23
---

# Phase 8 Plan 3: Gate-scoped Playwright config + single verify command Summary

Stood up `playwright.gate.config.ts` (the SC#4 gate skeleton) and the single `pnpm verify` command: the gate config extends the base config, pins `snapshotPathTemplate` to the frozen golden dir so Plan 02's `visual-diff.spec.ts` reads the 56 existing PNGs (D-01, the one net-new mechanic), and `testIgnore`s `golden.spec.ts` at the file level (D-04 #1); `package.json` gains `verify` (clean `generate` + unit + data + gate-scoped parity, D-03) and `test:parity` (the gate config, with the dev-routing test grep-inverted as a belt to Plan 04's env flag).

## What Was Built

### `playwright.gate.config.ts` (NEW)
- Imports `defineConfig` from `@playwright/test` and the base config from `./playwright.config`, spreads `...base`, and overrides exactly two keys:
  - `testIgnore: ['**/golden.spec.ts']` — D-04 exclusion #1 at the FILE level.
  - `snapshotPathTemplate: 'tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}'` — D-01 frozen-baseline pin, decoupled from `{testFileName}`.
- Top-of-file comment block documents the D-04 #1 file-level exclusion (golden re-renders the OLD index.html, redundant once Plan 02's spec exists, flaky under parallel load), the D-04 #2 dev-routing belt (neutralized by the test:parity grep-invert, not here), and the D-01 frozen-baseline invariant (`{arg}` = `<view>-<theme>`, `{projectName}` = mobile|desktop; never `--update-snapshots`; array-path form forbidden).

### `package.json` (MODIFIED)
- Added `test:parity`: `playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView"` — gate config + the dev-routing belt on the stable title substring (`shell.spec.ts:224`, verified).
- Added `verify`: `pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity` — D-03 with a clean build at the front (Open-Q#1).
- All 12 pre-existing scripts retained verbatim (`test:golden`, `test:golden:update`, `test:subpath`, `test:data`, `test:unit`, `generate`, etc.).

## How the mechanic resolves (D-01)
Plan 02's `visual-diff.spec.ts:244` calls `toHaveScreenshot(\`${name}-${theme}.png\`)`. Under the gate config, `{arg}` = `${name}-${theme}` (e.g. `inicio-light`) and `{projectName}` = `desktop`|`mobile`, so the template resolves to `tests/parity/golden.spec.ts-snapshots/inicio-light-desktop.png` — an existing frozen PNG. On mismatch, `*-actual.png`/`*-diff.png` go to `test-results/`, leaving the baseline read-only.

## Verification Performed
- `pnpm typecheck` → exit 0 (clean; the `npm warn` lines are pre-existing env noise).
- `git diff --quiet playwright.config.ts` → exit 0 (base config byte-unchanged).
- Gate listing `playwright test -c playwright.gate.config.ts --list` → `golden.spec.ts`'s tests ABSENT (file-level testIgnore proven); `visual-diff.spec.ts` present. Raw `--list` Total: 82 (dev-routing still listed — its env-flag skip is Plan 04; the grep-invert removes it at run time).
- Gate listing WITH the run-time `--grep-invert "reutiliza el MISMO TripView"` (the `test:parity` shape) → Total: 80 (the 2 dev-routing instances mobile+desktop dropped; both excluded titles return empty on grep). The belt works.
- All scripts enumerated present; none removed.

## Deviations from Plan

None - plan executed exactly as written.

## Notes for Future Plans
- **Plan 04** must: add the dev-routing env-flag skip (`test.skip(!process.env.RUN_DEV_ROUTING, …)`) in `shell.spec.ts`, record the gate's expected test count (Pitfall 4 — so an accidental over-exclusion is visible), and document both exclusions (a `tests/README.md` note). The grep-invert belt added here stays as the redundant cinturón.
- **Plan 05/06** runs the first real green gate + the D-02 diff classification (inspect actual `*-diff.png` before any mask). The full gate was intentionally NOT forced green this plan (constraints).
- The threat register is satisfied by construction: T-08-03 (frozen baseline tampering) — the gate never passes `--update-snapshots` and pins the snapshot dir read-only; T-08-04 (silent over-exclusion) — `golden.spec.ts` excluded at file level (stable) and the dev-routing belt uses a stable title; Plan 04 records the count.

## Self-Check: PASSED
- `playwright.gate.config.ts` — FOUND
- `package.json` (test:parity + verify present) — FOUND
- Commit `229c289` — FOUND (verified in git log)
