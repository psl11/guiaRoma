---
phase: 2
slug: esquema-de-datos-migraci-n-del-contenido
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-19
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derivado de `02-RESEARCH.md` ▸ "Validation Architecture". **Hallazgo clave:** Nuxt Content v3 (3.14.0) **NO** valida las `type:'data'` collections contra el esquema zod en build (issue nuxt/content#3351). Por tanto DATA-05 ("la validación rompe el build") se satisface con un **test Vitest Node-puro** que ejecuta `Schema.safeParse()` sobre cada `.yml` — no con el esquema de Content por sí solo.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (**no instalado** — añadir en Wave 0). El test de validación/invariantes es **Node puro**: NO necesita `@nuxt/test-utils` ni runtime Nuxt/SQLite. |
| **Config file** | `vitest.config.ts` — **no existe**; crear en Wave 0 (incluir `tests/data/**`). |
| **Quick run command** | `pnpm vitest run tests/data` |
| **Full suite command** | `pnpm vitest run` (datos) — la paridad Playwright es Fase 8 |
| **Estimated runtime** | ~3-8 segundos (lectura de ~85 YAML + parse, sin arrancar Nuxt) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/data`
- **After every plan wave:** Run `pnpm vitest run tests/data` + `pnpm exec nuxt build` (confirma que los tipos generan sin romper)
- **Before `/gsd:verify-work`:** Suite de datos en verde + `nuxt build` sin error de tipos
- **Max feedback latency:** ~10 segundos

---

## Per-Task Verification Map

> Los IDs de tarea (`02-NN-MM`) los asigna el planner. Esta tabla fija el **contrato requisito → prueba observable** que cada plan debe cumplir; el planner/`gsd-nyquist-auditor` los reconcilia con los task IDs reales tras planificar.

| Requirement | Wave | Verificación observable | Test Type | Automated Command | File Exists | Status |
|-------------|------|-------------------------|-----------|-------------------|-------------|--------|
| DATA-01 | 0→N | Las 6 colecciones (`trip`,`day`,`monument`,`food`,`artist`,`reference`) existen en `content.config.ts` y `nuxt build` genera tipos sin romper; conteo de ficheros por colección correcto | build + unit | `pnpm exec nuxt build` · `pnpm vitest run tests/data/schema.spec.ts` | ❌ Wave 0 | ⬜ pending |
| DATA-02 | N | Cada `day.timeline` valida contra `z.discriminatedUnion('kind', …)` y cada fila tiene `pace ∈ {all,medium,slow-only}` | unit | `pnpm vitest run tests/data/schema.spec.ts` | ❌ Wave 0 | ⬜ pending |
| DATA-03 | N | Cada `day.cards[]` es `string[]` y resuelve, en orden, a monumentos existentes | unit | `pnpm vitest run tests/data/invariants.spec.ts` | ❌ Wave 0 | ⬜ pending |
| DATA-04 | N | Texto visible + conjunto de `href` de cada ficha del `index.html` == YAML migrado, tras normalizar (espacios/entidades/`<em>`↔`_`) | integration | `pnpm vitest run tests/data/migration-diff.spec.ts` (harness D-07) | ❌ Wave 0 | ⬜ pending |
| DATA-05 | N | Un dato inválido (enum/required/tipo) **falla** `Schema.safeParse` → puerta que rompe CI/pre-commit | unit | `pnpm vitest run tests/data/schema.spec.ts` | ❌ Wave 0 | ⬜ pending |
| DATA-06 | N | Los campos de prosa (`Md`) son strings Markdown-inline parseables (negritas/cursiva/enlaces/párrafos) sin romper | unit | `pnpm vitest run tests/data/schema.spec.ts` (+ opcional `parseMarkdown` sin throw) | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Cobertura de los Success Criteria del ROADMAP:**
- **SC#1** → `schema.spec` cuenta ficheros (≈38 monuments, 26 food, 13 artist-cards, 5 days, 2 reference, 1 trip) y valida `slug` == basename; `nuxt build` genera los 6 tipos.
- **SC#2** → `schema.spec` (discriminatedUnion + `pace` por fila) + `invariants.spec` (`cards[]` resuelve en orden).
- **SC#3** → `migration-diff.spec` (texto+enlaces 1:1) + `schema.spec` (`motif` enum en los 38 monumentos).
- **SC#4** → `schema.spec` (parse falla ante dato inválido) + `invariants.spec` (Set de slugs sin duplicados; `day.cards` / `timeline.ref` / `monument.artists` / `monument.arch` / `artist.seenIn` / `archLink` / `reservas.table.ref` resuelven, incl. escaneo de `[texto](#id)` dentro de campos `Md`).

---

## Wave 0 Requirements

- [ ] `pnpm install` (asegurar `@nuxt/content`/`zod` instalados) + `pnpm add -D vitest@4.1.9 yaml` (y `cheerio` para el harness D-07)
- [ ] `vitest.config.ts` — crear; incluir `tests/data/**`
- [ ] `shared/schemas.ts` — esquemas zod exportados como **fuente única** (los reutilizan `content.config.ts` y los tests)
- [ ] `tests/data/schema.spec.ts` — `Schema.safeParse` por fichero (DATA-05/DATA-02/DATA-06)
- [ ] `tests/data/invariants.spec.ts` — ids únicos + cross-refs resuelven (D-06 capa 2 / SC#4)
- [ ] `scripts/migration-diff.ts` + `tests/data/migration-diff.spec.ts` — harness D-07/D-08 (cheerio + normalizador texto/href)
- [ ] Comando de validación cableado en CI/pre-commit (`pnpm vitest run tests/data`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Revisión de muestra de prosa migrada (legibilidad/encabezados) | DATA-04 | El harness diff garantiza equivalencia texto+enlaces, pero una lectura rápida de 2-3 fichas confirma que los encabezados de sección y el orden se conservaron de forma legible | Abrir 2-3 `monuments/*.yml` y cotejar con la ficha del `index.html` |

*El criterio duro de DATA-04 (texto+enlaces normalizados) está automatizado por `migration-diff.spec.ts`; lo manual es solo una comprobación de legibilidad complementaria, no la puerta.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`vitest`, `yaml`, `cheerio`, `vitest.config.ts`, `shared/schemas.ts`, test files)
- [ ] No watch-mode flags (usar `vitest run`, no `vitest`)
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter (tras reconciliar task IDs con plans)

**Approval:** pending
