---
phase: 08-verificaci-n-de-paridad
plan: 05
subsystem: parity-gate
tags: [docs, parity-gate, playwright, ci-gate, tamper-evidence]
requires:
  - "Plan 03: playwright.gate.config.ts (testIgnore golden + snapshotPathTemplate) + pnpm verify/test:parity scripts + the grep-invert belt"
  - "Plan 04: shell.spec.ts dev-routing test gated behind RUN_DEV_ROUTING (describe-level skip + defensive early-return)"
  - "Phase 1: tests/parity/golden.spec.ts-snapshots/ — the 56 frozen baseline PNGs"
provides:
  - "tests/README.md: the human-readable contract of the SC#4 gate — command + 3 layers, both exclusions with reasons (D-04), the D-01 frozen-baseline invariant, and the RECORDED expected gate test count (Pitfall 4) with recompute commands"
affects:
  - "Plan 06 (first real green gate + D-02 diff classification): the gate is now self-explaining; a future over-exclusion shows up as a count mismatch vs the recorded 80/82"
tech-stack:
  added: []
  patterns:
    - "Tamper-evident gate documentation: record the EMPIRICAL test count (run --list, do not guess) plus the recompute command, so an accidental over-exclusion is a recorded-count mismatch (Pitfall 4)"
    - "Document every gate exclusion WITH its reason and the mechanism layer (file-level testIgnore vs env-flag skip + grep-invert belt) so a silent coverage drop is attributable (D-04)"
key-files:
  created:
    - "tests/README.md — gate command + 3 layers; the 2 exclusions with reasons (golden.spec.ts testIgnore; dev-routing RUN_DEV_ROUTING + grep-invert); D-01 frozen-baseline invariant; recorded count 80 selected / 82 raw + recompute commands"
  modified: []
decisions:
  - "Recorded gate count derived EMPIRICALLY (not from the Plan 03 summary's figure): ran `playwright test -c playwright.gate.config.ts --grep-invert \"reutiliza el MISMO TripView\" --list` → 80 tests / 11 files (the test:parity selection), and the raw gate config --list → 82 / 11 files. README records BOTH plus the exact reproducible commands."
  - "README claim verified against a FRESH --list before commit (key_constraints): fresh test:parity-shape --list = 'Total: 80 tests in 11 files' == README; raw gate --list = 82. Match confirmed."
  - "Documentation-only: did NOT run the full gate to green (that is Plan 06) and did NOT touch the 56 frozen PNGs (D-01). Task verify gate is `pnpm typecheck` (exit 0)."
  - "Documented the 82→80 delta as exactly the 2 dev-routing instances (mobile+desktop) the grep-invert removes; under a real run the Plan 04 RUN_DEV_ROUTING describe-skip leaves them skipped — both mechanisms target the same test (cinturón + tirantes)."
metrics:
  duration_min: 6
  tasks: 1
  files: 1
  completed: 2026-06-23
---

# Phase 8 Plan 05: Document the SC#4 parity gate (tests/README.md) Summary

Wrote `tests/README.md` — the self-explaining, tamper-evident contract of the SC#4 parity gate: the `pnpm verify` command and its three layers, the TWO gate exclusions each with its reason and mechanism (D-04), the D-01 frozen-baseline invariant, and the EMPIRICALLY-measured expected gate test count (80 selected / 82 raw) with recompute commands so a future accidental over-exclusion surfaces as a recorded-count mismatch (Pitfall 4). Documentation only — the first real green gate run and diff classification are Plan 06; the 56 frozen PNGs were not touched.

## What Was Built

**Task 1 — `tests/README.md` (NEW, commit `851d699`)**

Four parts, as the plan mandated:

1. **The gate command + three layers.** `pnpm verify` = `pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity` (D-03, clean build at the front). A table maps each layer to what it verifies and its runner: `test:unit` (pure logic — pace matrix, nav stack, `computeActiveSection` +130, day-route utils, MiniSearch index build), `test:data` (data invariants — zod per file, cross-refs, migration-diff), `test:parity` (gate-scoped Playwright against the build served under `/guiaRoma/`). Records the exact `test:parity` definition (`playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView"`).

2. **The TWO exclusions with reasons (D-04).**
   - **#1 — `golden.spec.ts` at FILE level** (`testIgnore: ['**/golden.spec.ts']`, rename-proof): it re-renders the OLD `index.html`, is redundant now that `visual-diff.spec.ts` exists (Plan 02), and is flaky under parallel load (the 4 deferred pixel-diff failures). Stays alive as the on-demand F1 capture tool (`test:golden` / `test:golden:update`).
   - **#2 — the dev-routing test** (`shell.spec.ts:242`, "reutiliza el MISMO TripView…") via belt-and-suspenders: the `RUN_DEV_ROUTING` describe-level `test.skip` + defensive early-return (Plan 04 — the *tirantes* that GUARANTEE `pnpm dev` is never spawned) plus the `--grep-invert` belt (Plan 03). Reason: it launches a real `nuxi dev`, fragile to a stale lock; ARCH-02 stays covered by the static build + `shell.spec.ts`'s static assertions (which are NOT excluded). Runnable on demand via `RUN_DEV_ROUTING=1 pnpm test:parity`.

3. **The D-01 frozen-baseline invariant.** `pnpm test:golden:update` (`--update-snapshots`) is FORBIDDEN in F8; the 56 PNGs in `tests/parity/golden.spec.ts-snapshots/` are read-only (the gate compares, never writes — mismatches go to `test-results/`); `golden.spec.ts` is the only legitimate on-demand F1 capture tool; `visual-diff.spec.ts` never passes the update flag (it reads the frozen baseline via the gate config's `snapshotPathTemplate`). Includes the two commands to confirm the baseline is intact (`ls … | wc -l` ⇒ 56; `git diff --quiet`).

4. **The recorded expected count + recompute (Pitfall 4).** A table records: **80** tests in **11** files (what `test:parity` selects, with the grep-invert belt) and **82** in 11 files (the raw gate config, `testIgnore` golden only, before the grep-invert), each with the exact reproducible `--list` command. Documents the 82→80 delta as the 2 dev-routing instances. Includes a per-file breakdown of the 80 (sum verified = 80) and the recompute-and-compare command (`… --list | tail -1` ⇒ `Total: 80 tests in 11 files`).

## How the count was derived (empirical, not guessed)

Per `key_constraints`, the count was measured by running the gate `--list` myself, not copied from the Plan 03 summary:

- `pnpm exec playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView" --list` → `Total: 80 tests in 11 files` (the `test:parity` selection). Confirmed identical via the `pnpm test:parity --list` script.
- `pnpm exec playwright test -c playwright.gate.config.ts --list` → `Total: 82 tests in 11 files` (raw gate config).
- `golden.spec.ts` confirmed ABSENT from the gate listing (file-level `testIgnore` proven; 0 matching lines).
- The 2 excluded titles confirmed to be `shell.spec.ts:242` dev-routing on mobile + desktop.

## Verification Performed

- **`pnpm typecheck`** → exit 0 (docs-only change, no type regressions; the `npm warn` lines are pre-existing env noise).
- **Required tokens present** in `tests/README.md`: `golden.spec.ts`, `RUN_DEV_ROUTING`, `D-04`, `D-01`, `test:golden:update`, and the literal `Total: 80 tests in 11 files` — all OK.
- **Line count:** 167 (≥ 25 min).
- **README claim re-checked against a FRESH `--list` before commit** (key_constraints): fresh `test:parity`-shape `--list` = `Total: 80 tests in 11 files` (MATCH); raw gate `--list` = `Total: 82 tests in 11 files` (MATCH).
- **No baseline touched:** the 56 PNGs in `tests/parity/golden.spec.ts-snapshots/` were only listed/read, never written; `--update-snapshots` was never run.
- **Commit hygiene:** only `tests/README.md` staged (individually); no deletions; working tree clean afterward.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — documentation only, no new security surface. This plan satisfies the threat register T-08-06 (Repudiation — undocumented gate exclusions): `tests/README.md` records both exclusions with reasons (D-04) and the expected test count (Pitfall 4), so a silent coverage drop is detectable and attributable. T-08-SC (package installs) — zero packages installed.

## Notes for Future Plans

- **Plan 06** runs the first real green gate (`pnpm verify`) + the D-02 diff classification (inspect actual `*-diff.png` before any mask). If its `--list` no longer reports `Total: 80 tests in 11 files`, an exclusion changed — investigate before updating the README's recorded count.
- The recorded counts were measured 2026-06-23 against this branch's `playwright.gate.config.ts` + `package.json`; re-measure if a parity spec is added/removed or either exclusion changes.

## Self-Check: PASSED
- `tests/README.md` — FOUND
- Commit `851d699` — FOUND (verified in git log)
- `pnpm typecheck` — exit 0
- README claimed count (80 / 11 files) — MATCHES a fresh gate `--list`
