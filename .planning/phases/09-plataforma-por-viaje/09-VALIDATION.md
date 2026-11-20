---
phase: "9"
slug: "plataforma-por-viaje"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-20"
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `09-RESEARCH.md` §«Validation Architecture».

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (Node puro) + Playwright 1.61.0 |
| **Config file** | `vitest.config.ts`; `playwright.gate.config.ts` (paridad — NO tocar); `playwright.trips.config.ts` (NUEVO, Wave 0) |
| **Quick run command** | `node_modules/.bin/vitest run tests/unit tests/data` |
| **Full suite command** | `rm -rf .data .nuxt .output && pnpm verify` (si `pnpm` no está en PATH: shim `exec corepack pnpm "$@"` primero en PATH) |
| **E2E aislamiento** | `pnpm test:trips` (`playwright.trips.config.ts`, contra `pnpm dev`) |
| **Estimated runtime** | quick < 5 s; full ~ 5-8 min |

---

## Sampling Rate

- **After every task commit:** Run `node_modules/.bin/vitest run tests/unit tests/data`
- **After every plan wave:** Run `rm -rf .data .nuxt .output && pnpm verify`
- **Before `/gsd-verify-work`:** `pnpm verify` verde + `pnpm test:trips` verde + `git diff --quiet HEAD -- tests/parity/` + listado de la puerta = 80 tests
- **Max feedback latency:** 10 seconds (quick)

---

## Per-Task Verification Map

| Req / SC | Behavior | Test Type | Automated Command | File Exists | Status |
|----------|----------|-----------|-------------------|-------------|--------|
| PLAT-01 / SC1 | Índice por viaje: «Pantheon» en Roma sí, en prueba no; «Fontana» en prueba solo la suya | unit (YAML real) | `vitest run tests/unit/searchIsolation.spec.ts` | ❌ W0 | ⬜ pending |
| PLAT-01 / SC1 | El dropdown de `/trips/prueba` no muestra fichas de Roma | E2E dev | `pnpm test:trips -g "búsqueda"` | ❌ W0 | ⬜ pending |
| PLAT-01/02/03 | Guardián: no reaparece `useTrip('roma')`, `'roma-…'` literal, `useState` sin sufijo, índice de módulo único | unit (source scan) | `vitest run tests/unit/tripCoupling.spec.ts` | ❌ W0 | ⬜ pending |
| PLAT-02 / SC2 | Enlace a ficha en prueba → resaltado + «Volver» restaura scroll + pastilla activa sigue al scroll | E2E dev | `pnpm test:trips -g "navegación"` | ❌ W0 | ⬜ pending |
| PLAT-02 / SC2 (Roma) | Navegación de Roma igual | paridad (sin cambios) | `pnpm test:parity` (`navigation.spec.ts`) | ✅ | ⬜ pending |
| PLAT-03 / SC3 | `tripStorageKey('roma', x)` == claves actuales | unit | `vitest run tests/unit/tripStorage.spec.ts` | ❌ W0 | ⬜ pending |
| PLAT-03 / SC3 (Roma) | `roma-pace/light/resumen/note-*` se leen y escriben | paridad (sin cambios) | `pnpm test:parity` (`modes.spec.ts`, `map-fallback-notes.spec.ts`) | ✅ | ⬜ pending |
| PLAT-03 / SC3 | Prueba arranca por defecto aunque `roma-pace=slow`; `prueba-note-spagna` ≠ `roma-note-spagna` | E2E dev | `pnpm test:trips -g "preferencias"` | ❌ W0 | ⬜ pending |
| PLAT-04 / SC4 | Todos los viajes validan esquema + invariantes; fallos nombran el fichero | data | `vitest run tests/data` | ⚠️ modificar | ⬜ pending |
| PLAT-04 / SC4 | Dientes: slug inválido, carpeta≠slug, id duplicado, id=`mapa`, `#pantheon` en prueba, `meta` de nivel superior → violación con `file` | data (fixtures) | `vitest run tests/data/invariants.spec.ts -t "dientes"` | ❌ W0 | ⬜ pending |
| PLAT-04 / SC4 | Conteos y `migration-diff` solo Roma | data | `vitest run tests/data/schema.spec.ts tests/data/migration-diff.spec.ts` | ✅ | ⬜ pending |
| SC5 | Paridad de Roma verde sin tocar `tests/parity/` ni goldens (56) | paridad + git | `pnpm test:parity` + `git diff --quiet HEAD -- tests/parity/` | ✅ | ⬜ pending |
| SC5 / D-02 | La build no emite `trips/`; Roma sin centinela de prueba | data sobre `.output` | spec Vitest con `skipIf` sin build: `grep` centinela en `index.html`/`_payload.json` = 0 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/data/trips.ts` — loader + `checkTrip` puros (base PLAT-04)
- [ ] `tests/data/fixtures/trips/` — fixtures negativos del loader (nunca bajo `content/`)
- [ ] `tests/unit/tripStorage.spec.ts`, `tests/unit/searchIsolation.spec.ts`, `tests/unit/tripCoupling.spec.ts`
- [ ] `playwright.trips.config.ts` + `tests/trips/isolation.spec.ts` + script `test:trips` en `package.json`
- [ ] `content/trips/prueba/` (fixture de aislamiento validado por la misma puerta)
- [ ] Spec «Roma sin centinela de prueba» sobre `.output/public`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| — | — | — | All phase behaviors have automated verification. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
