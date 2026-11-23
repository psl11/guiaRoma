---
phase: 08-verificaci-n-de-paridad
plan: 04
subsystem: parity-gate
tags: [playwright, gate, parity, dev-routing, determinism]
requires:
  - "Plan 03: playwright.gate.config.ts + test:parity grep-invert belt on the dev-routing title"
provides:
  - "Dev-routing shell.spec.ts test + its `pnpm dev` spawn gated behind RUN_DEV_ROUTING (describe-level skip + defensive early-return)"
  - "Deterministic gate guarantee: no nuxi dev server is ever spawned during a gate run"
affects:
  - "tests/parity/shell.spec.ts"
  - "Plan 06 (first real gate run): the gate is now spawn-free and deterministic"
tech-stack:
  added: []
  patterns:
    - "Playwright describe-level test.skip(condition) evaluated BEFORE the block's beforeAll → prevents a spawning hook from running (belt-and-suspenders with a defensive early-return inside the hook)"
    - "Env-flag gating of an expensive/fragile test (RUN_DEV_ROUTING) — skipped by default, runnable on demand"
key-files:
  created: []
  modified:
    - "tests/parity/shell.spec.ts"
decisions:
  - "Describe-level RUN_DEV_ROUTING skip is the 'suspenders' to Plan 03's grep-invert 'belt'; the env-flag is what actually guarantees `pnpm dev` is never spawned (the grep only deselects the test, the skip prevents the hook)"
  - "Kept the {} object-destructuring pattern as the beforeAll first arg (Playwright HARD requirement) + `eslint-disable-next-line no-empty-pattern` instead of a plain identifier (which Playwright rejects at collection time: 'First argument must use the object destructuring pattern')"
  - "Static (non-dev) shell assertions and the dev-routing test body left byte-identical; the test is deselected, never deleted"
metrics:
  duration: ~6 min
  completed: 2026-06-23
  tasks: 1
  files: 1
---

# Phase 8 Plan 04: Gate dev-routing shell test behind RUN_DEV_ROUTING Summary

Gated the `shell.spec.ts` dev-routing test (and its fragile `pnpm dev` spawn) behind a `RUN_DEV_ROUTING` env flag via a describe-level `test.skip` plus a defensive early-return, so the parity gate is deterministic and never launches a Nuxt dev server (D-04 exclusion #2 — the stale-`nuxi dev`-lock fragility that deferred this test in Phase 5).

## What Was Built

**Task 1 — Gate the dev-routing path behind `RUN_DEV_ROUTING` (commit `41988fc`)**

In `tests/parity/shell.spec.ts`, the `routing dinámico /trips/[slug]` describe block now has two gating layers (belt-and-suspenders, as the plan mandated):

1. **Describe-level skip (the primary mechanism):**
   `test.skip(!process.env.RUN_DEV_ROUTING, '…dev-routing excluido del gate (D-04)…')` placed at the **top of the describe body**. Playwright evaluates a describe-level `test.skip` at collection time, **before** that block's `beforeAll` — so when the flag is unset, the `beforeAll` (which `spawn`s `pnpm dev`) never runs, and no dev server is launched.

2. **Defensive early-return in `beforeAll` (the suspenders):**
   `if (!process.env.RUN_DEV_ROUTING) return` as the first statement of the hook, so the `pnpm dev` spawn is a guaranteed no-op even in the hypothetical that the hook were ever reached without the flag.

The static (non-dev) shell assertions (`shell + #inicio + footer`, the D-09 header parity test, the `no-trips-dir` prerender test) and the dev-routing test body itself are **untouched** — the test is deselected, never deleted, and stays runnable on demand via `RUN_DEV_ROUTING=1 pnpm test:parity`.

### Behavior contract (verified at runtime)

| Condition | Result |
|-----------|--------|
| `RUN_DEV_ROUTING` unset (gate default) | dev-routing test **skipped**, `pnpm dev` **never spawned**, port 5200 free |
| `RUN_DEV_ROUTING=1` | describe-gate opens; original desktop-only single-dev-server logic intact (inner `test.skip(project !== 'desktop')` still skips mobile before any spawn) |

This satisfies the T-08-05 mitigation in the plan's threat register: the stale-`nuxi dev`-lock Denial-of-Service vector is removed from the deterministic gate; ARCH-02 stays covered by the static build + `shell.spec.ts`'s static assertions.

## Verification Performed

- **`pnpm lint tests/parity/shell.spec.ts`** → clean (0 errors). Note: `tests/parity/**` is in the eslint ignore list (`eslint.config.mjs:16`), so this command reports clean regardless; the **real lint signal** is `eslint --no-ignore`.
- **`eslint --no-ignore tests/parity/shell.spec.ts`** → **0 errors** (after adding the required `no-empty-pattern` disable for the Playwright-mandated `{}` first arg).
- **`pnpm typecheck`** → exit 0 (no type regressions).
- **Runtime, flag unset** (`env -u RUN_DEV_ROUTING playwright test -c playwright.gate.config.ts --grep "reutiliza el MISMO TripView"`): `2 skipped`, exit 0, **port 5200 free pre- and post-run**, **no `nuxi/nuxt/pnpm dev` processes** → confirms the spawn never happens.
- **Runtime, flag set on mobile** (`RUN_DEV_ROUTING=1 … --project mobile`): `1 skipped` via the **inner** desktop-only gate (not the flag gate), port 5200 free → confirms the describe-gate opens with the flag and the original desktop-only logic is preserved.
- **Gate `--list`**: all three static shell tests (`shell.spec.ts:118/172/186`) remain present in the gate; total 82 tests across 11 files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] `no-empty-pattern` lint error surfaced inside the edited `beforeAll` hook**
- **Found during:** Task 1, when running the real lint signal (`eslint --no-ignore`) on the file I was editing.
- **Issue:** The `beforeAll` signature was `async ({ }, testInfo) =>`. Under `eslint --no-ignore`, the `{ }` empty object pattern raises `no-empty-pattern` (pre-existing in `HEAD`, but located in the exact hook I added the early-return to). My first fix attempt — renaming to a plain identifier `_fixtures` — was **rejected by Playwright at collection time**: `First argument must use the object destructuring pattern: _fixtures`. Playwright mandates the first hook arg be a destructuring pattern.
- **Fix:** Restored the `{}` destructuring pattern (Playwright's hard runtime requirement wins) and added a scoped `// eslint-disable-next-line no-empty-pattern` with an explanatory comment. This is the documented Playwright idiom for "I only need `testInfo`".
- **Files modified:** `tests/parity/shell.spec.ts`
- **Commit:** `41988fc`

## Deferred Issues

**Pre-existing `@stylistic/arrow-parens` errors in `tests/parity/golden.spec.ts`** (lines 56/68/91), surfaced only under `eslint --no-ignore`. **Out of scope** per the SCOPE BOUNDARY rule: they live in a different file, and `golden.spec.ts` is explicitly forbidden to modify (D-01 — it is the byte-frozen Phase 1 capture tool). They do **not** block the gate (the gate's `pnpm lint` ignores `tests/parity/**`; `--no-ignore` is informational for that dir, per Plan 03's recorded decision). Left untouched.

## Known Stubs

None.

## Threat Flags

None — no new security surface. The change only deselects a test and prevents a dev-server spawn (reduces attack/fragility surface).

## Self-Check: PASSED

- **File exists:** `tests/parity/shell.spec.ts` — FOUND (modified)
- **Summary exists:** `.planning/phases/08-verificaci-n-de-paridad/08-04-SUMMARY.md` — FOUND
- **Commit exists:** `41988fc` — FOUND in `git log`
- **Acceptance criteria:**
  - `shell.spec.ts` contains `RUN_DEV_ROUTING` and a describe-level `test.skip` gating the dev-routing path so its `pnpm dev` spawn is skipped when the flag is unset — ✓
  - Gate run WITHOUT `RUN_DEV_ROUTING` does not run the dev-routing test and spawns no `nuxi dev` (verified: `2 skipped`, port 5200 free, no dev processes) — ✓
  - `pnpm lint tests/parity/shell.spec.ts` clean; static shell tests still in the listing — ✓
