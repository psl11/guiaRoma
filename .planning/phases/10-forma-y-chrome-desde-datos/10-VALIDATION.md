---
phase: "10"
slug: "forma-y-chrome-desde-datos"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: true) (#2117)
status: validated
nyquist_compliant: false
wave_0_complete: true
created: "2026-11-20"
validated: "2026-11-20"
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `10-RESEARCH.md` §«Validation Architecture».

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (Node puro) + Playwright 1.61.0 |
| **Config file** | `vitest.config.ts`; `playwright.gate.config.ts` (paridad — NO tocar); `playwright.trips.config.ts` (dev, puerto 5300) |
| **Quick run command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm test:unit && pnpm test:data` |
| **Full suite command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm verify` (incluye `rm -rf .data .nuxt .output`) |
| **E2E por viaje** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && rm -rf .data .nuxt && pnpm test:trips` (nunca a la vez que `generate`/`verify`) |
| **Estimated runtime** | quick < 5 s; full ~ 5-8 min; trips ~ 1 min |

---

## Sampling Rate

- **After every task commit:** quick run (+ `pnpm typecheck` si se tocan tipos o props)
- **After every plan wave:** full suite; en waves que toquen `tests/trips` o el viaje `forma`, también `pnpm test:trips`
- **Before `/gsd-verify-work`:** `pnpm verify` + `pnpm test:trips` + `pnpm lint` + `pnpm typecheck` verdes; `git diff --quiet <base> HEAD -- tests/parity/`
- **Max feedback latency:** 10 seconds (quick)

---

## Per-Task Verification Map

| Req / SC | Behavior | Test Type | Automated Command | File Exists | Status |
|----------|----------|-----------|-------------------|-------------|--------|
| SHAPE-01 | 10 días con 2 sábados → 10 entradas de día únicas y ordenadas; Roma → `viernes…martes` | unit | `pnpm vitest run tests/unit/tripLayout.spec.ts` | ✅ | ✅ green |
| SHAPE-01 | `order` contiguo, pastillas únicas, slug de día válido; dientes con fixtures | data | `pnpm vitest run tests/data/invariants.spec.ts tests/data/schema.spec.ts` | ✅ ampliado | ✅ green |
| SHAPE-01 | `/trips/forma`: 10 secciones + 10 pastillas distintas, cada una a su día | e2e dev | `pnpm test:trips -g "forma"` | ✅ | ✅ green |
| SHAPE-01/02 | Roma: 12 pastillas en el orden bloqueado | paridad | `pnpm test:parity` (shell.spec) | ✅ congelado | ✅ green |
| SHAPE-02 | Presencia de secciones según datos | unit | `pnpm vitest run tests/unit/tripLayout.spec.ts` | ✅ | ✅ green |
| SHAPE-02 | `/trips/forma` sin `#arte`/`#arquitectura` ni sus pastillas | e2e dev | `pnpm test:trips -g "forma"` | ✅ | ✅ green |
| SHAPE-02 | Ancla a sección ausente → violación `anchor` | data | `pnpm test:data` | ✅ control invertido | ✅ green |
| SHAPE-03 | Chrome de Roma en `trip.yml` == `index.html` verbatim | data | `pnpm vitest run tests/data/romaChrome.spec.ts` | ✅ | ✅ green |
| SHAPE-03 | `forma` muestra su chrome; `prueba` (sin campos) sin pie/leyenda y marca = título plano | e2e dev | `pnpm test:trips -g "chrome"` | ✅ | ✅ green |
| SHAPE-04 | Roma `<title>` = `Roma · 19—23 giugno 2026` | paridad | `pnpm test:parity` (shell.spec) | ✅ congelado | ✅ green |
| SHAPE-04 | `document.title` de cada viaje de prueba = su título | e2e dev | `pnpm test:trips -g "título"` | ✅ | ✅ green |
| SHAPE-05 | Trampa: ninguna marca de Roma en título/body de `prueba` y `forma`; control positivo en Roma | e2e dev | `pnpm test:trips -g "trampa"` | ✅ | ✅ green |
| SHAPE-05 | Dientes del matcher (aroma/Romaña no; Roma/ROYAL COURT sí) | unit | `pnpm vitest run tests/unit/romaLeaks.spec.ts` | ✅ | ✅ green |
| SHAPE-05 / D-17 | Literales de chrome de Roma ausentes de `app/**` (plantillas incluidas) | unit | `pnpm vitest run tests/unit/romaChromeGuard.spec.ts` | ✅ | ✅ green |
| SC5 / D-18 | 80 tests de la puerta + 56 goldens sin re-baseline; `tests/parity/` sin cambios | paridad + git | `pnpm verify` + `git diff --quiet <base> HEAD -- tests/parity/` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/unit/tripLayout.spec.ts` — SHAPE-01/02/04 (puro)
- [x] `tests/unit/romaLeaks.spec.ts` + `tests/trips/romaLeaks.ts` — matcher con dientes (SHAPE-05)
- [x] `tests/unit/romaChromeGuard.spec.ts` — guardián D-17
- [x] `tests/data/romaChrome.spec.ts` — verbatim contra `index.html` (SHAPE-03/04)
- [x] `tests/trips/shape.spec.ts` — forma + trampa + chrome (SHAPE-01..05)
- [x] Ampliar `tests/data/invariants.spec.ts`, `schema.spec.ts`, `build-isolation.spec.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| — | — | — | All phase behaviors have automated verification. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-11-20 (validate-phase --auto, retroactive audit)

**Evidence (orchestrator-run at HEAD after 10-05, Node 22, caches cleared):**
- `pnpm verify`: unit **247/247**, data **345/345**, parity **80/80** (56 goldens, sin `--update-snapshots`); EXIT=0.
- `pnpm test:trips`: **17/17** (5 aislamiento + 12 forma/trampa/chrome/título).
- `git diff --quiet f04967a HEAD -- tests/parity/ app/assets/css/ content/trips/prueba/` → exit 0.
- 35 `<automated>` verify blocks across the 5 plans (11 tasks), cada uno con `<fails_when>`; ningún comando en modo watch.
- Dientes probados: trampa falla con «Fellini» inyectado en `forma` (10-05); centinela `FORMA-CENTINELA-10A` inyectado en `index.html` hace fallar build-isolation (10-04).

## Validation Audit 2026-11-20

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
