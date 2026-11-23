---
phase: 4
slug: render-de-contenido-modos-de-ritmo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-20
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `04-RESEARCH.md` §Validation Architecture. The Per-Task Verification Map
> is populated after planning (each plan task carries an `<automated>` verify); gsd-plan-checker
> reconciles it and flips `nyquist_compliant: true` once sampling continuity is confirmed.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit)** | Vitest 4.1.9 (installed) — Node-pure for `isVisible` (pace matrix) + food grouping; no Nuxt runtime needed |
| **Framework (parity / E2E)** | @playwright/test 1.61.0 (installed) — DOM/text/structure assertions + 3-modes behavior |
| **Component-mount framework** | `@nuxt/test-utils` / `@vue/test-utils` / `happy-dom` — **intentionally NOT added** (no new dep); component render covered by Playwright (mirrors F3) |
| **Config file (unit)** | `vitest.config.ts` — already includes `tests/unit/**/*.spec.ts` (F3 extended it); **no change** |
| **Config file (parity)** | `playwright.config.ts` (exists; F1). F4 specs are **autocontained** (build + serve their own `.output/public`); they do **NOT** use the live-`index.html` webServer that backs the golden |
| **Quick run command** | `pnpm test:unit` (≡ `pnpm vitest run tests/unit`) |
| **Full suite command** | `pnpm test:data && pnpm test:unit && pnpm playwright test tests/parity/` (+ `pnpm typecheck && pnpm lint`) |
| **Estimated runtime** | unit + lint + typecheck < 30s ; full parity (generate + serve + Playwright) ~2–4 min |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test:unit && pnpm typecheck && pnpm lint` (pure `isVisible`/grouping + static gates, < 30s)
- **After every plan wave:** Run `pnpm test:data && pnpm test:unit`, plus a targeted `pnpm playwright test tests/parity -g "render|modes"` once the parity specs exist
- **Before `/gsd:verify-work`:** Full suite green (data + unit + the autocontained render & modes specs) **AND** the human visual sign-off. **Do NOT rebaseline the golden** (D-08 — pixel-diff total is F8, after F7's image fallback)
- **Max feedback latency:** 30 seconds (the unit + lint + typecheck loop)

---

## Per-Task Verification Map

> Populated after planning. Each plan task authored by gsd-planner must carry an `<automated>`
> verify field; gsd-plan-checker (Dimension 8) reconciles the rows below against the plans,
> confirms sampling continuity (no 3 consecutive implementation tasks without an automated
> verify), and flips `nyquist_compliant: true`.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _TBD after planning_ | — | — | UI-02/03/04, FEAT-06/07/08 | — | N/A (static, no input) | unit + e2e | see plan `<automated>` fields | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*
*Threat refs trace to `04-RESEARCH.md` §Security Domain — this is a static, no-server, no-auth, no-user-input render phase; MDC renders only repo-versioned trusted prose. No high-severity threats expected.*

---

## Phase Requirements → Test Map (from RESEARCH §Validation Architecture)

| Req / SC | Behavior | Type | Automated Command | Exists? |
|----------|----------|------|-------------------|---------|
| **SC#1 / UI-02** | `:detail-photo{...}` resolves to a real `.detail-photo > img` (not unrendered text); prose MDC adds no extra `<p>` where the original had none; dropcap on 1st section only | E2E DOM (autocontained) | `tests/parity/render-cards.spec.ts` | ❌ Wave 0 |
| **SC#1 / UI-02** | `.detail-list` (✦ bullets + borders) present on prose lists inside cards | E2E DOM | `tests/parity/render-cards.spec.ts` | ❌ Wave 0 |
| **SC#2 / UI-03** | timeline dispatches by `kind`: each `.tl-item`/`.tl-transport`/`.tl-meta`/`.tl-food`/`.tl-resv-meta` present with its markup; order = data | E2E DOM | `tests/parity/render-timeline.spec.ts` | ❌ Wave 0 |
| **SC#3 / UI-04** | reference sections (reservas-table + badges, gastro-cards grouped, artist-cards, arq-glosario) rendered from data | E2E DOM | `tests/parity/render-reference.spec.ts` | ❌ Wave 0 |
| **SC#4 / FEAT-06** | exact pace matrix: optimista→all; neutral→hide `slow-only`; slow→hide `slow-only`+`medium`; ONLY `tl-item`/`tl-transport` filter | unit (pure) + E2E | `pnpm test:unit` (isVisible) + `tests/parity/modes.spec.ts` | ❌ Wave 0 |
| **SC#4 / FEAT-07** | walk-less: `body.light-mode` + forces `pace='slow'` + shows `.dia-ligera`; disabling does NOT revert pace; `aria-pressed` | E2E | `tests/parity/modes.spec.ts` | ❌ Wave 0 |
| **SC#4 / FEAT-08** | summary: `body.modo-resumen` hides day-stats/day-subtitle/dia-ligera/tl-meta/tl-transport/cards-list; keeps tl-item/tl-food/tl-resv-meta; `aria-pressed` | E2E | `tests/parity/modes.spec.ts` | ❌ Wave 0 |
| **SC#4 (persistence)** | reload with `roma-pace=slow`/`roma-light=1`/`roma-resumen=1` → state restored | E2E | `tests/parity/modes.spec.ts` | ❌ Wave 0 |
| **SC#4 (micro-flash)** | with `roma-pace=slow` preset, first paint is optimista (default), changes to slow 1 frame later (intentional flash) | E2E | `tests/parity/modes.spec.ts` (mirror of `theme.spec`) | ❌ Wave 0 |

---

## Wave 0 Requirements

> No distinct Wave 0 — mirroring F3, the test artifacts are authored by named plan tasks during
> execution; Vitest + Playwright are pre-installed. `wave_0_complete` flips to `true` once the
> first plan lands the `isVisible` extraction + unit runner. There should be zero `MISSING` test
> references; every test file below must be authored by a named plan task.

- [ ] `app/utils/pace.ts` — extract pure `isVisible(itemPace, pace)` so the matrix is unit-testable
- [ ] `tests/unit/pace.spec.ts` — the 9 cases of `isVisible` (3 paces × 3 item-paces), pure Vitest — **no new dep**
- [ ] `tests/unit/foodGroups.spec.ts` *(optional)* — grouping by `food.group` preserves first-appearance order (requires extracting the grouping to a pure util)
- [ ] `tests/parity/render-cards.spec.ts` — MonumentCard DOM: detail-photo resolved, detail-list class, dropcap, facts, maps-link, sorrentino/culture box, notes-area shell
- [ ] `tests/parity/render-timeline.spec.ts` — the 5 kinds + variants (taxi/walk/train/metro-b, fixed/reserved-event, disabled), order, on a representative day (viernes)
- [ ] `tests/parity/render-reference.spec.ts` — reservas-table + badges + is-done, gastro-cards grouped, artist-cards, arq-glosario
- [ ] `tests/parity/modes.spec.ts` — pace matrix E2E + light (forces slow, no revert) + resumen (hidden set) + persistence + micro-flash

*(F4 specs do NOT touch `golden.spec.ts` or its snapshots — D-08. Total pixel-diff vs the F1 golden is F8, after F7's image fallback.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Intermediate editorial sign-off: cards, timeline, reference sections look identical to `index.html` **with real images loading** | UI-02/03/04 / SC#1–3 | The "identical to today" editorial judgment with live Wikimedia images exceeds automated DOM assertions; F4 deliberately defers the image fallback (F7) and the total pixel-diff (F8), so the intermediate parity bar is a human visual check (D-06) | Build (`pnpm generate`), serve, open a representative day + each reference section, compare against the golden/`index.html` with images allowed to load; approve or list deltas |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or a Wave 0 dependency (the one manual task is the deliberate visual sign-off)
- [ ] Sampling continuity: no 3 consecutive implementation tasks without automated verify (to be verified by gsd-plan-checker, Dimension 8)
- [ ] Wave 0 covers all MISSING references (target: none — every test artifact authored by a named plan task)
- [ ] No watch-mode flags (all commands are `vitest run` / `playwright test`)
- [ ] Feedback latency < 30s for the per-commit loop
- [ ] `nyquist_compliant: true` set in frontmatter (after plan-checker approval)

**Approval:** pending
