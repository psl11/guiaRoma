---
phase: 3
slug: capa-de-p-gina-layout-y-tema
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `03-RESEARCH.md` §Validation Architecture and the 5 plan `<automated>` verify fields.
> Approved by gsd-plan-checker on 2026-06-19 (every task carries an automated verify; sampling continuity holds; no `MISSING` references).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit)** | Vitest 4.1.9 (installed) — Node-pure for `dayLabel` + the extracted `buildTripIndexes` index shape (no Nuxt runtime needed) |
| **Framework (parity / E2E / FOUC)** | @playwright/test 1.61.0 (installed) — generated-HTML assertions + visual/behavior parity |
| **Component-mount framework** | `@nuxt/test-utils` / `@vue/test-utils` / `happy-dom` — **intentionally NOT added** (no new dep); component behavior covered by Playwright |
| **Config file (unit)** | `vitest.config.ts` — Plan 01 extends `include` to add `tests/unit/**` (keeps `tests/data/**` disjoint) |
| **Config file (parity)** | `playwright.config.ts` (exists; Fase 1) |
| **Quick run command** | `pnpm vitest run tests/unit && pnpm typecheck && pnpm lint` |
| **Full suite command** | `pnpm test:data && pnpm test:unit && pnpm playwright test tests/parity/` |
| **Estimated runtime** | unit + lint + typecheck < 30s ; full parity (generate + serve + Playwright) ~2–4 min |

> `pnpm test:unit` is **added by Plan 01** (current `package.json` only ships `test:data` + `test:golden`); equivalent to `pnpm vitest run tests/unit`.

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/unit && pnpm typecheck && pnpm lint`
- **After every plan wave:** Run `pnpm test:data && pnpm test:unit`, plus a targeted `pnpm playwright test tests/parity -g "shell|theme"` once Wave 4 parity specs exist
- **Before `/gsd:verify-work`:** Full suite must be green (data + unit + parity for `/` shell + the SC#3 FOUC assertion + the human golden sign-off)
- **Max feedback latency:** 30 seconds (the unit + lint + typecheck loop)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | UI-01 (SC#2/D-04) | — | N/A (pure fn) | unit | `pnpm vitest run tests/unit/dayLabel.spec.ts` | ❌ created in-plan | ⬜ pending |
| 03-01-02 | 01 | 1 | UI-01 | — | N/A | unit | `pnpm test:unit && pnpm test:data` | ❌ created in-plan | ⬜ pending |
| 03-02-01 | 02 | 2 | ARCH-01 (SC#1) | — | N/A (pure fn) | unit | `pnpm vitest run tests/unit/tripIndexes.spec.ts` | ❌ created in-plan | ⬜ pending |
| 03-02-02 | 02 | 2 | ARCH-01 | slug→404 (RESEARCH §Sec) | `.where()` parameterized; behavior asserted in 03-05 | static | `pnpm typecheck && pnpm lint app/composables/useTrip.ts` | n/a | ⬜ pending |
| 03-03-01 | 03 | 2 | UI-01, FEAT-01 (D-08/D-10/SC#4) | localStorage `roma-theme` ∈ {light,dark} | no injection sink (constrained values) | static + grep | `pnpm typecheck && pnpm lint app/components/{Topbar,ThemeToggle}.vue` + grep no-`<style>` | n/a | ⬜ pending |
| 03-03-02 | 03 | 2 | UI-01, ARCH-01 (D-03/D-04/D-07) | — | N/A | static + grep | `pnpm typecheck && pnpm lint app/components/{NavPills,BackButton}.vue` + grep `dayLabel` / no-`<style>` | n/a | ⬜ pending |
| 03-04-01 | 04 | 3 | UI-01 (D-06) | MDC over trusted prose | renders repo-versioned content only (no user input) | static + grep | `pnpm typecheck && pnpm lint app/components/TheHero.vue` + grep `info-grid` | n/a | ⬜ pending |
| 03-04-02 | 04 | 3 | ARCH-01, ARCH-02, UI-01 (D-05) | — | N/A | static + grep | `pnpm typecheck && pnpm lint app/components/TripView.vue` + grep `useTrip` / 12 anchors | n/a | ⬜ pending |
| 03-05-01 | 05 | 4 | ARCH-01, ARCH-02, FEAT-01 (D-02/D-09) | — | N/A | static + grep | `pnpm typecheck && pnpm lint app/` + grep head/`NuxtPage` | n/a | ⬜ pending |
| 03-05-02 | 05 | 4 | ARCH-02, UI-01 (SC#2/D-09/D-01) | `[slug]` route param | shell parity + 404 guard + no-trips-dir | e2e | `pnpm playwright test tests/parity/shell.spec.ts` | ❌ created in-plan | ⬜ pending |
| 03-05-03 | 05 | 4 | FEAT-01 (SC#3/SC#4) | — | anti-FOUC + CSS-only icon | e2e | `pnpm playwright test tests/parity/theme.spec.ts` | ❌ created in-plan | ⬜ pending |
| 03-05-04 | 05 | 4 | UI-01 (SC#2 golden) | — | human golden sign-off | manual | `checkpoint:human-verify` (`<human-check>`) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Threat refs trace to `03-RESEARCH.md` §Security Domain (V5 minimal: only "input" is the URL `slug`, validated → 404) and each plan's `<threat_model>` — conclusion: no high-severity threats in this static, no-server, no-auth, no-input phase.*

---

## Wave 0 Requirements

> No distinct Wave 0 in this phase — the unit runner is established inline in **Plan 01 (Wave 1)** and Playwright is pre-installed (Fase 1). `wave_0_complete` flips to `true` once Plan 01 lands the runner during execution. There are zero `MISSING` test references; every test artifact is authored by a named plan task below.

- [ ] `vitest.config.ts` — extend `include` to add `tests/unit/**/*.spec.ts` (keep `tests/data/**` disjoint) — **Plan 01**
- [ ] `package.json` — add `test:unit` script (`vitest run tests/unit`) — **Plan 01**
- [ ] `tests/unit/dayLabel.spec.ts` — SC#2 / D-04 (all 5 day labels, accent-safe), pure Vitest — **Plan 01**
- [ ] `tests/unit/tripIndexes.spec.ts` — SC#1 index shape (pure `buildTripIndexes`), plain Vitest — **Plan 02**
- [ ] `tests/parity/shell.spec.ts` — SC#2 shell parity + ARCH-02 routing/404 + D-09 head + D-01 no-trips-dir, Playwright — **Plan 05**
- [ ] `tests/parity/theme.spec.ts` — SC#3 anti-FOUC + SC#4 CSS-only icon, Playwright — **Plan 05**
- [ ] *(optional, not planned)* `@nuxt/test-utils@^4 @vue/test-utils happy-dom` — only if `mountSuspended` component tests are later wanted beyond Playwright

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pixel-level golden parity of `/` (shell + full `#inicio`, light + dark) vs `index.html` | UI-01 / SC#2 | Final editorial "identical to today" judgment exceeds automated diff tolerance; human sign-off is the 1.0 parity bar | Plan 05 Task 4 (`checkpoint:human-verify`): build (`pnpm generate`), serve, compare `/` against the golden in both themes and both viewports; approve or list deltas |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or a Wave 0 dependency (the one manual task is the deliberate golden checkpoint)
- [x] Sampling continuity: no 3 consecutive implementation tasks without automated verify (verified by gsd-plan-checker, Dimension 8c)
- [x] Wave 0 covers all MISSING references (none — every test artifact is authored by a named plan task)
- [x] No watch-mode flags (all commands are `vitest run` / `playwright test`)
- [x] Feedback latency < 30s for the per-commit loop
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-06-19 (gsd-plan-checker)
