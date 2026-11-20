---
phase: 1
slug: andamiaje-golden-de-paridad
status: ready
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-18
---

# Phase 1 — Validation Strategy

> Contrato de validación por fase para el muestreo de feedback durante la ejecución.
> El mapa Req→Test detallado vive en `01-RESEARCH.md` ▸ `## Validation Architecture`. Este fichero es el contrato de muestreo ejecutable.
>
> **Naturaleza de la fase:** andamiaje + captura de golden. No hay TDD unit "rojo→verde" tradicional; la verificación es **build / lint / typecheck / e2e (Playwright)** que nace con el propio scaffold. El "Wave 0" de esta fase es Plan 01-01 (harness Playwright del golden) + Plan 01-02 (lint/typecheck/generate). Nyquist se satisface porque **los 6 tasks tienen `<automated>`**.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright 1.61 (golden + subpath e2e) · Nuxt build/`generate` · `@nuxt/eslint` (lint) · `nuxi typecheck` |
| **Config file** | `playwright.config.ts` (Plan 01-01) · `eslint.config.mjs` (Plan 01-02) · `nuxt.config.ts` (Plan 01-02/03) |
| **Quick run command** | `pnpm lint && pnpm typecheck` |
| **Full suite command** | `pnpm generate && pnpm exec playwright test` |
| **Estimated runtime** | ~60–120 s (lo domina `nuxt generate`) |

---

## Sampling Rate

- **After every task commit:** Wave 2+ → `pnpm lint && pnpm typecheck`; tasks de golden/subpath → `pnpm exec playwright test <spec>`
- **After every plan wave:** `pnpm generate && pnpm exec playwright test`
- **Before `/gsd:verify-work`:** full suite en verde
- **Max feedback latency:** ~120 s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | PARITY-01 | T-01-SC | Solo se instala `@playwright/test@1.61.0` (oficial) tras aprobación humana; `pnpm-lock` commiteado | config + checkpoint humano | `test -f playwright.config.ts && grep -q toHaveScreenshot playwright.config.ts && ! grep -q '{platform}' playwright.config.ts && pnpm exec playwright --version` | ❌ W0 (crea el harness) | ⬜ pending |
| 1-01-02 | 01 | 1 | PARITY-01 | T-01-NET / T-01-GI | Golden determinista sin red de terceros (heros bloqueadas→SVG, A5); PNGs versionables (`.gitignore` no excluye `tests/parity/`) | e2e (golden) | `pnpm exec playwright test` (2ª corrida sin `--update` → exit 0) · `ls tests/parity/golden.spec.ts-snapshots \| grep -c -- '-mobile.png\|-desktop.png'` ≥ 44 | ✅ | ⬜ pending |
| 1-02-01 | 02 | 2 | PLAT-01, PLAT-02, PLAT-05 | T-02-SC / T-02-D02 / T-02-SSR | Stack oficial tras aprobación; raíz intacta (D-02); sin `ssr:false` | config + checkpoint humano | `test -f nuxt.config.ts && test -f eslint.config.mjs && grep -q roma-theme nuxt.config.ts && grep -q 'Cormorant Garamond' nuxt.config.ts && [ $(grep -c 'ssr: *false' nuxt.config.ts) = 0 ] && pnpm exec nuxi --version` | ❌ W0 (establece lint/typecheck/build) | ⬜ pending |
| 1-02-02 | 02 | 2 | PLAT-03, PLAT-04, BUILD-02 | T-02-CDN (fuentes self-host) | CSS verbatim sin `@layer`/`scoped`; build+lint+typecheck verdes | build (lint+typecheck+generate) | `pnpm lint && pnpm typecheck && pnpm generate` · `[ $(cat app/assets/css/*.css \| grep -c '@layer') = 0 ]` | ✅ | ⬜ pending |
| 1-03-01 | 03 | 3 | ARCH-03, BUILD-01, PLAT-05 | T-03-EP / T-03-404 / T-03-SSR | `server/` dormido (0 `*.ts`/`*.js`); sin `ssr:false`; raíz intacta | config | `test -f server/api/README.md && test -f public/.nojekyll && grep -q github_pages nuxt.config.ts && grep -q failOnError nuxt.config.ts && [ $(find server -name '*.ts' -o -name '*.js' \| grep -c .) = 0 ]` | ✅ | ⬜ pending |
| 1-03-02 | 03 | 3 | BUILD-01, BUILD-02, BUILD-03 | T-03-CDN / T-03-404 | 0×404 de `/_nuxt/*` bajo `/guiaRoma/`; 0 requests a CDN (offline) | e2e (subpath) | `pnpm generate && test -f .output/public/.nojekyll && pnpm exec playwright test tests/parity/subpath.spec.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `playwright.config.ts` + `tests/parity/golden.spec.ts` — harness del golden (Plan 01-01; el golden es el **primer** entregable de la fase / wave-0-equivalente, antes de divergir — D-05)
- [ ] `eslint.config.mjs` + `nuxi typecheck` + `nuxt generate` — gate de lint/tipos/build (Plan 01-02)
- [ ] Instalación del stack Phase-1 verificado (pnpm) tras los 2 checkpoints de legitimidad de paquetes

*Nota: no hay stubs de test unit tradicionales — esta es una fase de infraestructura; la verificación es build/lint/e2e inherente al scaffold.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Aprobación de la lista de paquetes (legitimidad de cadena de suministro) | PARITY-01 / PLAT-01..05 | slopcheck no disponible → paquetes [ASSUMED]; convención GSD exige checkpoint humano bloqueante antes de instalar | Tasks 1-01-01 y 1-02-01: revisar que las versiones coinciden con RESEARCH §Package Legitimacy Audit y que son paquetes oficiales (org Nuxt / canónicos); escribir "approved". Cada checkpoint tiene además su `<automated>` que valida el resultado. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies — 6/6 con `<automated>`
- [x] Sampling continuity: no 3 consecutive tasks without automated verify — 0 tasks sin `<automated>`
- [x] Wave 0 covers all MISSING references — harness Playwright (01-01) + lint/build (01-02) son los primeros entregables
- [x] No watch-mode flags — ningún comando usa `--watch`
- [ ] Feedback latency < 120s — confirmar en ejecución (`generate` domina)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending — sign-off de validación tras completar Wave 1 (golden) y confirmar latencia.
