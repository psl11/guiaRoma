---
phase: 7
slug: isla-client-only-mapa-fallback-de-imagen-y-notas
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-23
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `07-RESEARCH.md` → ## Validation Architecture. Per-task rows are finalized by the planner against the real task IDs.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `4.1.9` (pure logic) + Playwright `@playwright/test@1.61.0` (parity/behavioral) |
| **Config file** | `vitest.config.ts` (`tests/unit/**`, `tests/data/**`) ; `playwright.config.ts` (golden harness — the new spec is SELF-CONTAINED and does NOT use its `webServer`) |
| **Quick run command** | `pnpm test:unit` (Vitest, < 5s) |
| **Full suite command** | `pnpm generate && pnpm test:golden` (Playwright; the new self-contained parity spec builds once and serves under `/guiaRoma/`) |
| **Estimated runtime** | unit ~5s · golden ~build + parity run |

---

## Sampling Rate

- **After every task commit:** `pnpm test:unit` + `pnpm typecheck` + `pnpm lint` (fast; covers the extracted pure utils).
- **After every plan wave:** `pnpm generate && pnpm test:golden` (the self-contained parity spec; first run builds).
- **Before `/gsd:verify-work`:** Full suite green. Console gate tolerates ONLY the known `@nuxtjs/color-mode` hydration message (`/Hydration completed but contains mismatches/i`) and fails on any other console error.
- **Max feedback latency:** < 10 seconds for the unit tier.

---

## Per-Requirement Verification Map

> Task IDs (`07-NN-NN`) are assigned by the planner; map each row to the plan/task that delivers it.

| Requirement | Behavior | Test Type | Automated Command | File (Wave 0) |
|-------------|----------|-----------|-------------------|---------------|
| FEAT-02 | Marker list = 39 (38 monuments + Coliseo `★`); color + popup-type per place | unit | `pnpm vitest run tests/unit/mapMarkers.spec.ts` | ❌ W0 |
| FEAT-02 | Offline predicate truth table (`tilesErrored>3 && tilesLoaded===0` ⇒ true; else false) | unit | `pnpm vitest run tests/unit/mapOffline.spec.ts` | ❌ W0 |
| FEAT-02 | `nuxt generate` emits NO `window is not defined`; `.output/public/index.html` exists | build/parity | `pnpm generate` (asserted in spec `beforeAll`) | ❌ W0 (spec) |
| FEAT-02 | Map renders client-side (`.leaflet-container` + custom markers); SSG `#fallback` is an empty `#leaflet-map` | parity | `pnpm test:golden` → `map-fallback-notes.spec.ts` | ❌ W0 |
| FEAT-02 | Popup "Abrir ficha →" navigates (scroll + `.highlight`, hash UNCHANGED) via F5 capture listener | parity | same spec | ❌ W0 |
| FEAT-02 | Offline banner shows when tiles aborted (`tileerror` × >3, 0 loaded) | parity | same spec — `page.route('**/*.tile.openstreetmap.org/**').abort()` | ❌ W0 |
| FEAT-02 | `guided` popup (Coliseo / vaticano) is text-only, NO anchor | parity | same spec | ❌ W0 |
| UI-05 | 19 `SVG_MOTIFS` keys present; `motifSvg(motif)` returns SVG / undefined for unknown | unit | `pnpm vitest run tests/unit/svgMotifs.spec.ts` | ❌ W0 |
| UI-05 | Hero `@error` → `.card-hero` shows inline `<svg>` (img aborted) | parity | same spec (force image abort for a hero src) | ❌ W0 |
| UI-05 | Detail `@error` → `.detail-photo` shows `<svg>` AND keeps `.detail-photo-caption` | parity | same spec | ❌ W0 |
| FEAT-04 | Note saved under `roma-note-<slug>` persists across reload; read in `onMounted` (no hydration error) | parity | same spec (preset via `addInitScript(localStorage.setItem)`) | ❌ W0 |

---

## Wave 0 Requirements

- [ ] `tests/unit/mapMarkers.spec.ts` — FEAT-02 marker derivation (load real `trip.yml` + `monuments/*.yml` via `node:fs`+`yaml`, mirror the consumer chain; pattern from `tests/unit/dayRoute.spec.ts`). Assert COUNT/presence (39 incl. Coliseo), not order.
- [ ] `tests/unit/mapOffline.spec.ts` — FEAT-02 offline predicate truth table.
- [ ] `tests/unit/svgMotifs.spec.ts` — UI-05 SVG lookup (19 keys; mirror `Motif` enum in `shared/schemas.ts:31-35`).
- [ ] `tests/parity/map-fallback-notes.spec.ts` — all behavioral criteria; clone the self-contained harness from `modes.spec.ts`/`navigation.spec.ts` (use a fresh base port, e.g. 5760, to avoid collision with 5700/5720/5740). Forces `tileerror` and image `@error` via `page.route().abort()` (A5 golden precedent); popup-nav and notes-persistence via the `navigation.spec.ts` / `modes.spec.ts` patterns.
- [ ] Framework install: **none** — Playwright + Vitest already configured.

*Extract the genuinely pure pieces (marker-derivation, offline-predicate, SVG-lookup) to `app/utils/*` so Vitest covers them browserless — exactly as `pace.ts`/`cardNav.ts`/`searchIndex.ts` do.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full pixel parity of the map island vs `index.html` | FEAT-02 | Total pixel-diff is **Phase 8** scope, not F7 | Deferred to F8 golden snapshots |

*All other phase behaviors have automated verification (unit + self-contained parity spec).*

---

## Validation Sign-Off

- [ ] All tasks have an `<automated>` verify or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (4 new test files above)
- [ ] No watch-mode flags (`vitest run`, not `vitest`)
- [ ] Feedback latency < 10s for the unit tier
- [ ] `nyquist_compliant: true` set in frontmatter (after planner maps every task)

**Approval:** pending
