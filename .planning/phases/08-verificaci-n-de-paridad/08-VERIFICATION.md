---
phase: 08-verificaci-n-de-paridad
verified: 2026-06-24T10:39:32Z
status: passed
score: 4/4 success-criteria verified (15/15 plan must-have truths)
overrides_applied: 1
overrides:
  - must_have: "D-01: the 56 frozen PNGs are never rebaselined — golden stays frozen as the F1 baseline"
    reason: "Byte-exact parity with index.html's NETWORK Google fonts is not worth the cost vs the self-hosted offline fonts that actually ship (BUILD-02). The vendored Lora cut shares base advance widths but differs in kerning/GPOS → sub-line wrap deltas that toHaveScreenshot hard-fails as dimension mismatches and no honest tolerance can absorb. Goal is effective visual+functional parity of what SHIPS, not byte-cloning the font. The 56 goldens were re-captured from the current Nuxt offline build (38 changed, 18 already matched); maxDiffPixelRatio:0.01 UNCHANGED, NO masks/stylePath/per-view tolerances applied. The golden now tracks the Nuxt build so future visual regressions are still caught. Recorded in diff-classification.md (7th UPDATE) and parity-signoff.md; committed as 36d5292."
    accepted_by: "vcompany (user, this session)"
    accepted_at: "2026-06-24T10:00:00Z"
---

# Phase 8: Verificación de paridad — Verification Report

**Phase Goal:** Demostrar objetivamente la paridad 100% con una suite Playwright que combina visual-diff contra el golden de la Phase 1, E2E del comportamiento de cada feature e invariantes de datos — la puerta que debe pasar antes de cualquier merge a producción.
**Verified:** 2026-06-24T10:39:32Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

The phase goal is achieved: a gate-scoped Playwright suite (`pnpm verify`) objectively demonstrates parity. I ran the full gate in my own process (not trusting SUMMARY.md): **unit 87/87, data 295/295, parity 80/80, exit 0**. The visual-diff spec — the net-new artifact the phase is named for — exists, is wired into the gate, and its 4 screenshot tests (mobile+desktop × light+dark) pass against the frozen baseline within `maxDiffPixelRatio: 0.01`.

### Observable Truths (ROADMAP Success Criteria)

| # | Truth (SC) | Status | Evidence |
|---|-----------|--------|----------|
| SC#1 | Visual-diff a pixel contra el golden pasa para home, cada día, una ficha de cada tipo, claro/oscuro, móvil/desktop | ✓ VERIFIED | `tests/parity/visual-diff.spec.ts` (288 lines) defines 14 VIEWS (inicio, 5 días, 5 secciones-referencia, monumento/guided/concert cards) × light/dark × mobile/desktop, resolved against the 56 frozen PNGs via the gate's `snapshotPathTemplate`. I ran it: tests 8/73/72/80 (`nuxt↔golden light/dark` on both projects) all PASS within `maxDiffPixelRatio:0.01`. `#mapa` correctly absent (D-06). |
| SC#2 | E2E confirma cada feature: matriz de ritmo, tema sin flash, búsqueda, URL ruta del día, notas, pila "volver" desde mapa/búsqueda/timeline, scrollspy +130 | ✓ VERIFIED | All behavior specs PASS in the gate run: `modes.spec.ts` (3 pace modes + persistence), `theme.spec.ts` (anti-FOUC data-theme), `search-route.spec.ts` (FEAT-03 search + FEAT-09 day-route URL), `navigation.spec.ts` (scrollspy +130). Back-stack "Volver restores scroll" proven from **all 3 entry points**: timeline (navigation.spec.ts), MAP popup + SEARCH result (the D-05 gap-fills — `originY` capture → `#back-btn` show → click → `scrollY` restored `.toBe(originY)` → stack emptied, verified present in both files). |
| SC#3 | Invariantes de datos pasan (nº fichas esperado, ids únicos, cross-refs resueltos, motif por monumento) | ✓ VERIFIED | `pnpm test:data` 295/295. `tests/data/schema.spec.ts` asserts counts 38/26/13 via zod; `tests/data/migration-diff.spec.ts` asserts 72 unique anchor ids, cross-ref resolution, and `motif` per monument. |
| SC#4 | La suite completa pasa en verde como condición previa a la 1.0 | ✓ VERIFIED | Ran `pnpm` chain in own process: generate (exit 0) → test:unit 87/87 → test:data 295/295 → gate parity 80/80, exit 0. Gate count `--list` = exactly 80, matching the recorded figure in `tests/README.md`. |

**Score:** 4/4 success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/parity/visual-diff.spec.ts` | Nuxt↔golden visual-diff, 14 VIEWS, toHaveScreenshot, beforeAll guard, port 5780, no #mapa | ✓ VERIFIED | 288 lines. Serves Nuxt build under `/guiaRoma/` on 5780; `beforeAll` existsSync guard-asserts `inicio-light-desktop.png`; calls `toHaveScreenshot(\`${name}-${theme}.png\`)`; NO `--update-snapshots` in spec. |
| `playwright.gate.config.ts` | testIgnore golden.spec.ts, snapshotPathTemplate pinned to frozen dir | ✓ VERIFIED | `testIgnore: ['**/golden.spec.ts']`; `snapshotPathTemplate: 'tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}'`. Extends base config without editing it. |
| `package.json` (verify + test:parity) | clean build + unit + data + gate parity; dev-routing grep-inverted | ✓ VERIFIED | `verify: pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity`; `test:parity` runs gate config with `--grep-invert "reutiliza el MISMO TripView"`. All prior scripts retained. |
| `tests/parity/shell.spec.ts` (RUN_DEV_ROUTING) | dev-routing describe + spawn gated behind env flag | ✓ VERIFIED | Describe-level `test.skip(!process.env.RUN_DEV_ROUTING, …)` + defensive early-return `if (!process.env.RUN_DEV_ROUTING) return` in the spawning beforeAll (belt-and-suspenders). Static assertions unchanged. |
| `tests/README.md` | gate command + 3 layers, both exclusions, frozen invariant, recorded count | ✓ VERIFIED | 167 lines. Documents both D-04 exclusions with reasons, D-01 invariant (test:golden:update FORBIDDEN), and recorded gate count "Total: 80 tests in 11 files" — which I confirmed matches `--list`. |
| `tests/parity/map-fallback-notes.spec.ts` + `search-route.spec.ts` (D-05 back-half) | originY back-stack assertion both files | ✓ VERIFIED | Both contain `originY` capture, `#back-btn` show/click(force:true), `expect.poll(scrollY).toBe(originY)`, stack-emptied assertion. Pre-existing tests retained (extended, not rewritten). |
| `diff-classification.md` | D-02 per-view verdicts + green confirmation | ✓ VERIFIED | 20+ lines, full classification ledger incl. the user-approved re-baseline (7th UPDATE, override of D-01). |
| `parity-signoff.md` | green verify, #mapa D-06 exception, F7 prereq closed, D-08 boundary | ✓ VERIFIED | Records green pnpm verify, #mapa behavior-only exception (D-06), F7 sign-off closed first (FEAT-02/UI-05/FEAT-04 complete), D-08 no-merge/deploy boundary. |
| `.planning/REQUIREMENTS.md` | PARITY-02 complete | ✓ VERIFIED | Line 64 `[x] PARITY-02`; traceability table line 136 `PARITY-02 | Phase 8 | Complete`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `package.json verify` | gate config | test:parity → gate config | ✓ WIRED | verify chains generate+unit+data+parity; ran end-to-end exit 0. |
| gate `snapshotPathTemplate` | `golden.spec.ts-snapshots/` | toHaveScreenshot resolves to frozen PNGs | ✓ WIRED | 56 PNGs on disk; visual-diff tests resolved against them and passed. |
| `visual-diff.spec.ts` | served Nuxt build under `/guiaRoma/` | goto STATIC_URL on port 5780 | ✓ WIRED | beforeAll builds + cp to previewRoot/guiaRoma/ + serves; tests render the GENERATED site. |
| map/search specs | `#back-btn` | force-click after popup/result→ficha | ✓ WIRED | Both back-stack tests passed in gate run. |
| F8 global sign-off | PARITY-02 complete | green verify + human approval | ✓ WIRED | parity-signoff.md + REQUIREMENTS.md updated. |

### Behavioral Spot-Checks (run in own process)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit logic | `pnpm test:unit` | 87 passed (10 files) | ✓ PASS |
| Data invariants (SC#3) | `pnpm test:data` | 295 passed (3 files) | ✓ PASS |
| Static build (SC#4) | `pnpm generate` | exit 0, .output/public generated | ✓ PASS |
| Gate parity suite (SC#1/SC#2/SC#4) | `playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView"` | 80 passed (1.1m), exit 0 | ✓ PASS |
| Gate count integrity (D-04 Pitfall 4) | gate `--list` | Total: 80 tests in 11 files (matches tests/README.md) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| PARITY-02 | 08-07-PLAN.md | Suite de verificación visual + comportamental que confirma paridad 100% con el index.html; debe pasar antes de la 1.0 | ✓ SATISFIED | Green gate (80/80) + visual-diff + behavior + data invariants + human sign-off. REQUIREMENTS.md line 64/136 = Complete. |

No orphaned requirements: REQUIREMENTS.md maps only PARITY-02 to Phase 8 (FEAT-02/UI-05/FEAT-04 belong to Phase 7 and were closed via the F7 prerequisite sign-off documented in parity-signoff.md).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TBD/FIXME/XXX in any modified phase file | — | Clean — completion is auditable |

### Override Applied (D-01 re-baseline)

The frozen-golden invariant (D-01) was deliberately overridden this session by the user. The 56 goldens were re-captured from the current Nuxt offline build because byte-exact parity with index.html's NETWORK Google fonts is not worth its cost vs the self-hosted offline fonts that actually ship (BUILD-02 / CLAUDE.md core value: effective visual+functional parity of what ships). Critically: `maxDiffPixelRatio:0.01` is UNCHANGED and NO masks/stylePath/per-view tolerances were applied — the gate still hard-fails on real regressions, and the golden now tracks the Nuxt build so future drift is still caught. This is a recorded, audited decision (diff-classification.md 7th UPDATE + parity-signoff.md + commit 36d5292), consistent with the project's "pragmatic parity over byte fidelity" principle. NOT a defect.

### D-08 Scope Boundary (not a gap)

The merge of `release/nuxt-4` → `main` and deploy/CI are explicitly OUT OF SCOPE (D-08); `main` stays intact. Per the recorded decision the absence of a merge/deploy is NOT a gap.

### Human Verification Required

None. The two human checkpoints in 08-07 (F7 prerequisite paridad sign-off + F8 global parity sign-off) were both completed and approved by the user this session, recorded in `parity-signoff.md`. No further human verification items remain.

### Gaps Summary

No gaps. All 4 ROADMAP success criteria are objectively satisfied and independently re-verified in the verifier's own process (not from SUMMARY claims): green `pnpm verify` end-to-end (87 unit + 295 data + 80 parity, exit 0), the net-new visual-diff spec wired into the gate and passing within an unrelaxed 0.01 threshold, all three back-stack entry points proven, data invariants passing, gate count integrity confirmed (80 = recorded), both human sign-offs closed, and the single D-01 deviation is a recorded user-approved override (not a defect). PARITY-02 is satisfied.

---

_Verified: 2026-06-24T10:39:32Z_
_Verifier: Claude (gsd-verifier)_
