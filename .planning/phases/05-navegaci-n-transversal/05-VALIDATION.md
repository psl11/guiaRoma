---
phase: 5
slug: navegaci-n-transversal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `05-RESEARCH.md` §Validation Architecture. Per-task IDs are assigned by the planner; rows below are keyed by success criterion (SC) until then.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit)** | Vitest 4.1.9 — pure logic, no Nuxt runtime |
| **Framework (behavior)** | Playwright 1.61.0 — self-contained (own build+serve under `/guiaRoma/`) |
| **Config file (unit)** | `vitest.config.ts` (`include: ['tests/data/**', 'tests/unit/**']`) |
| **Config file (behavior)** | `playwright.config.ts` + self-contained `beforeAll` (mirror of `tests/parity/modes.spec.ts`) |
| **Quick run command** | `pnpm test:unit` |
| **Full suite command** | `pnpm test:unit && pnpm test:golden` |
| **Estimated runtime** | unit ~few s; golden includes one `pnpm generate` (mirror of modes.spec) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:unit` (fast — pure composable logic)
- **After every plan wave:** Run `pnpm test:unit && pnpm test:golden`
- **Before `/gsd:verify-work`:** Full suite green + `pnpm typecheck` + `pnpm lint`
- **Max feedback latency:** unit < ~10s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD (planner) | — | — | FEAT-05 / SC#1 | — | N/A | unit | `pnpm test:unit` → `cardNavigation.spec.ts` (navStack push/pop LIFO, `canGoBack` flip) | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | FEAT-05 / SC#1 | — | N/A | behavior | `pnpm test:golden` → `navigation.spec.ts` (click prose → `.card.highlight` 2500ms + scroll moves; "back" → scroll restored, `.back-btn.show` gone) | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | FEAT-05 / SC#2 | — | N/A | unit | `pnpm test:unit` → `computeActiveSection(...)` fixtures (last-wins; +130 vs 124 boundary) | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | FEAT-05 / SC#2 | — | N/A | behavior | `pnpm test:golden` → `navigation.spec.ts` (scroll to offset → correct `.nav-pill.active`; no IntersectionObserver) | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | FEAT-05 / SC#2 | T-05-01 | Only fichas intercepted: `monById.has(id)` predicate gate | unit | `pnpm test:unit` → ficha-vs-section predicate test with mock `Map` | ❌ W0 | ⬜ pending |
| TBD (planner) | — | — | FEAT-05 / SC#3 | T-05-01 | MDC prose `a[href^="#"]` intercepted → `navigateToCard` (not native jump/reload); section links jump natively | behavior | `pnpm test:golden` → `navigation.spec.ts` (prose `#g-...` → highlighted + stack; section `#reservas` → native jump, no highlight) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/cardNavigation.spec.ts` — covers SC#1 (navStack push/pop/`canGoBack`), SC#2 (`computeActiveSection` last-wins + +130 boundary), ficha-vs-section predicate. Requires the composable's pure logic (array push/pop, `computeActiveSection`, `has` predicate) be extracted to DOM-free testable functions — pattern: `app/utils/pace.ts` → `tests/unit/pace.spec.ts`.
- [ ] `tests/parity/navigation.spec.ts` — self-contained (mirror of `tests/parity/modes.spec.ts`: one `pnpm generate`, own server under `/guiaRoma/`, tolerate ONLY the color-mode hydration error). Covers SC#1/SC#2/SC#3 in a real browser (smooth scroll, `.highlight`, `.active`, `.show`, prose interception vs native section jump).
- [ ] Scroll helper in the Playwright spec for SC#2 (`page.evaluate(() => window.scrollTo(0, Y))` then assert active pill) — interaction pattern already exists in `modes.spec.ts`.
- [ ] No new framework install — Vitest and Playwright already present. Do **not** add `@nuxt/test-utils`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| — | — | — | — |

*All phase behaviors have automated verification (unit + Playwright behavior).*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < ~10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
