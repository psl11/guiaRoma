---
phase: 6
slug: derivados-de-datos-b-squeda-y-ruta-del-d-a
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-21
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `06-RESEARCH.md` §Validation Architecture. Per-task IDs finalized at planning.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (unit, pure functions) + Playwright 1.61.0 (behavior/parity) |
| **Config file** | Plain Vitest (no `@nuxt/test-utils` context needed for pure utils, like `pace.spec.ts`); Playwright self-contained (build + serve, no `webServer`) |
| **Quick run command** | `pnpm test:unit` (runs `vitest run tests/unit`) |
| **Full suite command** | `pnpm test:unit && pnpm test:data && pnpm test:golden` |
| **Estimated runtime** | unit ~10s; full suite ~2–4 min (Playwright `pnpm generate` + serve dominates) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:unit` (fast pure-function tests for `dayRoute`/`searchIndex`)
- **After every plan wave:** Run `pnpm test:unit && pnpm test:data`, then the new Playwright spec
- **Before `/gsd:verify-work`:** `pnpm test:golden` (all Playwright incl. new self-contained `search-route.spec.ts`) must be green
- **Max feedback latency:** ~10 seconds (unit) for the per-task loop

---

## Per-Task Verification Map

> Task IDs are placeholders until plans are written; the requirement→test mapping below is the contract the planner must honor.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | dayRoute | — | FEAT-09 | — | route href is fixed `google.com/maps/dir/?…`, `encodeURIComponent` coords, `rel="noopener"` | unit | `pnpm test:unit` → `tests/unit/dayRoute.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | dayRoute | — | FEAT-09 | — | `capStops` literal sampling on synthetic >10 fixture (Pitfall 3) | unit | same file | ❌ W0 | ⬜ pending |
| TBD | dayRoute | — | FEAT-09 | — | route includes ALL `day.cards` (incl. vaticano/auditorium); NO type filter (Pitfall 2) | unit | `dayRoute.spec.ts` (Saturday = 8 stops) | ❌ W0 | ⬜ pending |
| TBD | dayRoute | — | FEAT-09 | — | button hidden <2 stops; label `(N paradas)` / `(10 de N paradas)` (SC#3) | unit + e2e | `dayRoute.spec.ts` + `search-route.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | search | — | FEAT-03 | T-V5 | haystack superset of `card.textContent`; query name/badge/arch/sorrentino/section words returns right monument (SC#1, Pitfall 1) | unit | `pnpm test:unit` → `tests/unit/searchIndex.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | search | — | FEAT-03 | T-V5 | dropdown: ≥2 chars opens, max 8 results, "Sin resultados" empty state (D-03); results rendered with `{{ }}` not `v-html` | e2e | `tests/parity/search-route.spec.ts` | ❌ W0 | ⬜ pending |
| TBD | search | — | FEAT-03 | — | selecting a result calls `navigateToCard` (scroll + `.highlight`) (SC#2) | e2e | `search-route.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/dayRoute.spec.ts` — FEAT-09: SC#4 per-day URL parity + `capStops` synthetic >10 + Pitfall-2 "all cards" assertion + `routeLabel`
- [ ] `tests/unit/searchIndex.spec.ts` — FEAT-03 SC#1: haystack superset + query returns expected slugs (incl. badge/arch/sorrentino words)
- [ ] `tests/parity/search-route.spec.ts` — self-contained Playwright (mirror of `modes.spec.ts`/`navigation.spec.ts`: `pnpm generate` once, serve under `/guiaRoma/` on port `5700 + worker`, tolerate ONLY the color-mode hydration message): dropdown behavior + result→navigation + button visibility/label

*No framework install needed (Vitest + Playwright already present).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Per-day Google Maps URL byte-match against live `index.html` | FEAT-09 (SC#4) | Optional extra-strong parity check; automated test asserts internal consistency + Pitfall-2 stop set | Open one day's "ruta del día" URL from the live `index.html`, compare to the URL produced by the ported `buildDirUrl` for the same day |

*The automated `dayRoute.spec.ts` is the binding gate; this manual check is an optional reinforcement.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s (unit loop)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
