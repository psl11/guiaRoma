---
phase: 8
slug: verificaci-n-de-paridad
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-23
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Seeded from `08-RESEARCH.md` §Validation Architecture. For F8 the gate command and the
> 56-PNG visual-diff **are** the validation strategy — this contract IS the deliverable's spec.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61.0 (parity visual-diff + behavior E2E) + Vitest 4.1.9 (unit + data) |
| **Config file** | `playwright.config.ts` (exists; line 35 = A8 template, line 27 = `maxDiffPixelRatio:0.01`); a gate-scoped `playwright.gate.config.ts` recommended for D-04 exclusions |
| **Quick run command** | `pnpm test:unit` (pure logic, < 5s) |
| **Full suite command** | `pnpm verify` = `test:unit` + `test:data` + `test:parity` (D-03 single gate) |
| **Estimated runtime** | ~minutes (parity layer = build + serve + visual-diff + behavior) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:unit` (fast) + the specific spec touched (e.g. `playwright test tests/parity/<new-vdiff>.spec.ts`)
- **After every plan wave:** Run `pnpm test:parity` (full Playwright parity suite) + `pnpm test:data`
- **Before `/gsd:verify-work`:** `pnpm verify` must be green (all three layers)
- **Max feedback latency:** < 5s for `test:unit`; minutes for full `pnpm verify`

---

## Per-Task Verification Map

> Task IDs are assigned by the planner. The rows below are the requirement→test map from
> `08-RESEARCH.md`; the planner binds each Wave-0 (`❌`) item to a concrete task ID during planning.

| Requirement / SC | Behavior | Test Type | Automated Command | File Exists |
|------------------|----------|-----------|-------------------|-------------|
| PARITY-02 / SC#1 | Pixel-parity, 14 views × {light,dark} × {mobile,desktop} vs frozen golden | visual-regression | `pnpm test:parity` (NEW visual-diff spec, `toHaveScreenshot`) | ❌ W0 (net-new spec) |
| PARITY-02 / SC#2 theme | `data-theme` toggles, no flash | E2E | `theme.spec.ts` (in `test:parity`) | ✅ F3 |
| PARITY-02 / SC#2 pace | Optimistic/neutral/slow matrix + light→slow + resumen | E2E | `modes.spec.ts` | ✅ F4 |
| PARITY-02 / SC#2 search | ≥2 chars, max 8, "Sin resultados", result→navigate | E2E | `search-route.spec.ts` | ✅ F6 |
| PARITY-02 / SC#2 day-route URL | `(N paradas)` + Google Maps walking href | E2E | `search-route.spec.ts` | ✅ F6 |
| PARITY-02 / SC#2 notes | `roma-note-<slug>` persistence round-trip | E2E | `map-fallback-notes.spec.ts` | ✅ F7 |
| PARITY-02 / SC#2 scrollspy +130 | `.nav-pill.active` switches at `scrollY+130` | E2E | `navigation.spec.ts` | ✅ F5 |
| PARITY-02 / SC#2 back-stack (timeline) | Volver restores scroll from internal link | E2E | `navigation.spec.ts` SC#1 | ✅ F5 |
| PARITY-02 / SC#2 back-stack (map) | Volver restores scroll from map popup | E2E | extend `map-fallback-notes.spec.ts` | ❌ W0 (gap-fill) |
| PARITY-02 / SC#2 back-stack (search) | Volver restores scroll from search result | E2E | extend `search-route.spec.ts` | ❌ W0 (gap-fill) |
| PARITY-02 / SC#3 | Counts (38/26/13/5/2/1), unique ids, cross-refs resolve, motif per monument | data invariants | `pnpm test:data` (`invariants/schema/migration-diff.spec.ts`) | ✅ F2 |
| PARITY-02 / SC#4 | Whole suite green = 1.0 precondition + human sign-off | gate + manual | `pnpm verify` + D-07 sign-off | ❌ W0 (gate script + sign-off) |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/parity/<new-visual-diff>.spec.ts` — PARITY-02/SC#1: the Nuxt↔golden comparison; reuses `VIEWS` + `settle()` + A5 image-block; pins `snapshotPathTemplate` to the frozen golden dir; own base port; `beforeAll` guard-asserts baseline exists; never `--update-snapshots`
- [ ] `package.json` — add `verify` (D-03) and `test:parity` (gate-scoped) scripts
- [ ] `playwright.gate.config.ts` (recommended) — `testIgnore: ['**/golden.spec.ts']`; dev-routing `shell.spec.ts` test excluded via env-flag skip or title grep (D-04); document both exclusions + assert the gate's test count to catch silent over-exclusion
- [ ] Back-stack gap-fill — extend `map-fallback-notes.spec.ts` (popup→ficha→Volver→scroll restored) and `search-route.spec.ts` (result→ficha→Volver→scroll restored) (D-05)
- [ ] Front-of-gate clean build step (`pnpm generate`) so the diff reflects current code, not a stale `.output`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Final global parity sign-off | PARITY-02 / SC#4 (D-07) | A human must review the visual-diff results + green suite and approve the 1.0 as "parity-good" | Run `pnpm verify` green; review any classified diffs; confirm F7 sign-off is closed; record approval |
| `#mapa` parity (behavior-only exception) | PARITY-02 / D-06 | OSM tiles are non-deterministic; the golden has no `#mapa` baseline — pixel-diff impossible | Covered by `map-fallback-notes.spec.ts` (12/12) inside the gate; documented as the single deliberate pixel-parity exception in the sign-off |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s (unit) / documented for full suite
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
