---
phase: "14"
slug: "verificacion-del-milestone"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-23"
validated: "2026-11-23"
---

# Phase 14 — Validation Strategy

> Per-phase validation contract, reconstructed after execution (State B) from 14-01/02/03 PLAN + SUMMARY.
> Phase 14 is itself a verification phase: its deliverables ARE tests (PAR-03) plus a human phone sign-off (PAR-04).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (`tests/unit`, `tests/data`) + Playwright 1.61.0 (`playwright.gate.config.ts` parity on the published build served under `/guiaRoma/`; `playwright.trips.config.ts` on `nuxi dev`) |
| **Config file** | `vitest.config.ts`, `playwright.gate.config.ts`, `playwright.trips.config.ts` |
| **Quick run command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && node_modules/.bin/vitest run tests/data tests/unit` |
| **Phase specs** | `rm -rf .data .nuxt .output && pnpm generate && pnpm exec playwright test -c playwright.gate.config.ts tests/parity/upgrade-from-main.spec.ts tests/parity/cross-trip.spec.ts` |
| **Full suite command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && rm -rf .data .nuxt .output && pnpm verify`, then `pnpm typecheck && pnpm lint`, then (after verify finishes) `rm -rf .data .nuxt && pnpm test:trips` |
| **Prerequisites** | Node 22 (better-sqlite3 ABI); a local `main` branch (upgrade spec and CSS spec read `git show main:index.html`); never run `test:trips` concurrently with generate/verify |
| **Estimated runtime** | quick < 15 s; phase specs ~ 30 s after a ~1–2 min generate; full ~ 6–9 min |

---

## Sampling Rate

- **After every task commit:** the task's own `<automated>` verify (spec + eslint on the spec file).
- **After every plan wave:** quick run, plus the phase specs with `--repeat-each 3` for flake classification (D-01/D-06).
- **Before `/gsd-verify-work`:** full suite from clean caches; goldens and frozen CSS byte-unchanged since `v1.0`.
- **Max feedback latency:** 15 seconds (quick run).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | PAR-03 | — | N/A | parity e2e | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/upgrade-from-main.spec.ts` | ✅ | ✅ green |
| 14-01-02 | 01 | 1 | PAR-03 | — | No stored value silently rewritten/deleted on upgrade | parity e2e | `… upgrade-from-main.spec.ts --repeat-each 3`; `--list` = 4 tests | ✅ | ✅ green |
| 14-02-01 | 02 | 2 | PAR-03 | — | No sql_dump/WASM download on published pages or history steps | parity e2e | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/cross-trip.spec.ts` | ✅ | ✅ green |
| 14-02-02 | 02 | 2 | PAR-03 | — | Notes/modes/search never cross trips | parity e2e | `… cross-trip.spec.ts --repeat-each 3`; `--list` = 12 tests | ✅ | ✅ green |
| 14-02-03 | 02 | 2 | PAR-03 | — | N/A | data | `node_modules/.bin/vitest run tests/data/css-vs-main.spec.ts` | ✅ | ✅ green |
| 14-03-01 | 03 | 3 | PAR-03 | — | N/A | full gate | `rm -rf .data .nuxt .output && pnpm verify`; README §4 `Total:` lines = fresh `--list` | ✅ | ✅ green |
| 14-03-02 | 03 | 3 | PAR-03 | — | Gate never made green by re-baselining goldens | gate + history | `pnpm typecheck && pnpm lint`; `pnpm test:trips`; `git diff --quiet v1.0 HEAD -- tests/parity/golden.spec.ts-snapshots app/assets/css/{base,tokens,fonts,leaflet}.css` | ✅ | ✅ green |
| 14-03-03 | 03 | 3 | PAR-04 | — | Checklist asks for no personal data | doc check | grep-based structure check of `14-UAT.md` (9 tests, no e-mail addresses) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Audit run 2026-11-23 (clean caches, Node 22): `upgrade-from-main.spec.ts` + `cross-trip.spec.ts` → 16 passed (desktop + mobile); `css-vs-main.spec.ts` → 11 passed.

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Roma and Campania signed off on a real phone, light and dark themes, offline with the guide already open (image motif fallback, «Sin conexión · solo marcadores visibles») | PAR-04 | Real device, real airplane mode and human visual judgment; the requirement itself demands a person's sign-off | `14-UAT.md` tests 1–9 — **signed off 2026-11-23: 9/9 pass** (against https://psl11.github.io/guiaRoma/, same code as `release/nuxt-4`) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (none missing)
- [x] No watch-mode flags
- [x] Feedback latency < 15s (quick run)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-11-23
