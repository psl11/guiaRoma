---
phase: "9"
slug: "plataforma-por-viaje"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-20"
validated: "2026-11-22"
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
| PLAT-01 / SC1 | Índice por viaje: «Pantheon» en Roma sí, en prueba no; «Fontana» en prueba solo la suya | unit (YAML real) | `vitest run tests/unit/searchIsolation.spec.ts` | ✅ | ✅ green |
| PLAT-01 / SC1 | El dropdown de `/trips/prueba` no muestra fichas de Roma | E2E dev | `pnpm test:trips -g "búsqueda"` | ✅ `tests/trips/isolation.spec.ts` | ✅ green |
| PLAT-01/02/03 | Guardián: no reaparece `useTrip('roma')`, `'roma-…'` literal, `useState` sin sufijo, índice de módulo único | unit (source scan) | `vitest run tests/unit/tripCoupling.spec.ts` | ✅ | ✅ green |
| PLAT-02 / SC2 | Enlace a ficha en prueba → resaltado + «Volver» restaura scroll + pastilla activa sigue al scroll | E2E dev | `pnpm test:trips -g "navegación"` | ✅ `tests/trips/isolation.spec.ts` | ✅ green |
| PLAT-02 / SC2 (Roma) | Navegación de Roma igual | paridad (sin cambios) | `pnpm test:parity` (`navigation.spec.ts`) | ✅ | ✅ green |
| PLAT-03 / SC3 | `tripStorageKey('roma', x)` == claves actuales | unit | `vitest run tests/unit/tripStorage.spec.ts` | ✅ | ✅ green |
| PLAT-03 / SC3 (Roma) | `roma-pace/light/resumen/note-*` se leen y escriben | paridad (sin cambios) | `pnpm test:parity` (`modes.spec.ts`, `map-fallback-notes.spec.ts`) | ✅ | ✅ green |
| PLAT-03 / SC3 | Prueba arranca por defecto aunque `roma-pace=slow`; `prueba-note-spagna` ≠ `roma-note-spagna` | E2E dev | `pnpm test:trips -g "preferencias"` | ✅ `tests/trips/isolation.spec.ts` | ✅ green |
| PLAT-04 / SC4 | Todos los viajes validan esquema + invariantes; fallos nombran el fichero | data | `vitest run tests/data` | ✅ (`schema.spec.ts`, `invariants.spec.ts` por viaje vía `tests/data/trips.ts`) | ✅ green |
| PLAT-04 / SC4 | Dientes: slug inválido, carpeta≠slug, id duplicado, id=`mapa`, `#pantheon` en prueba, `meta` de nivel superior → violación con `file` | data (fixtures) | `vitest run tests/data/invariants.spec.ts -t "dientes"` | ✅ | ✅ green |
| PLAT-04 / SC4 | Conteos y `migration-diff` solo Roma | data | `vitest run tests/data/schema.spec.ts tests/data/migration-diff.spec.ts` | ✅ | ✅ green |
| PLAT-04 / G-09-3 (09-06) | Sin fail-open: `.YML`/`.Yaml` dentro de un viaje y cualquier fichero suelto en `content/trips/` producen `stray-file` nombrando el fichero (IN-05) | data (en memoria + fixtures `raiz.yml`/`.oculto.yml` + árbol real) | `vitest run tests/data/invariants.spec.ts -t "Content no ingiere|checkTripsRoot|listTripDirs"` | ✅ | ✅ green |
| SC5 | Paridad de Roma verde sin tocar `tests/parity/` ni goldens (56) | paridad + git | `pnpm test:parity` + `git diff --quiet HEAD -- tests/parity/` | ✅ | ✅ green |
| SC5 / D-02 | La build no emite `trips/`; Roma sin centinela de prueba | data sobre `.output` | `vitest run tests/data/build-isolation.spec.ts` (`skipIf` sin build; dentro de `pnpm verify` tras `nuxi generate`) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/data/trips.ts` — loader + `checkTrip` puros (base PLAT-04)
- [x] `tests/data/fixtures/trips/` — fixtures negativos del loader (nunca bajo `content/`): `campania-2027/`, `suelto/`
- [x] `tests/unit/tripStorage.spec.ts`, `tests/unit/searchIsolation.spec.ts`, `tests/unit/tripCoupling.spec.ts`
- [x] `playwright.trips.config.ts` + `tests/trips/isolation.spec.ts` + script `test:trips` en `package.json`
- [x] `content/trips/prueba/` (fixture de aislamiento validado por la misma puerta)
- [x] Spec «Roma sin centinela de prueba» sobre `.output/public` → `tests/data/build-isolation.spec.ts`

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

**Approval:** approved 2026-11-20 (validate-phase, retroactive audit)

**Evidence:**
- Quick suite `node_modules/.bin/vitest run tests/unit tests/data` at HEAD `ef59b17`: 17 files, **427 passed** (unit 164 + data 263); `build-isolation.spec.ts` 4/4 ran against the existing `.output` (not skipped).
- `pnpm verify` from clean caches at HEAD (orchestrator run): exit 0 — unit 164/164, data 263/263, parity **80/80**.
- `pnpm test:trips` (`playwright.trips.config.ts`, dev): **5/5** passed (09-04: 31.2 s; 09-05 after verify: 28.0 s).
- `git diff --quiet HEAD -- tests/parity/` → clean (last change to `tests/parity/` is phase 08-06); gate `--list` = 80 tests in 11 files; 56 goldens.
- Data gate teeth proven by mutation in 09-05 (`meta: roto` on `content/trips/prueba/monuments/spagna.yml` → exit 1 naming the file; restored → 263 passed).
- All 10 plan tasks carry `<automated>` verify blocks (33 in total); no watch-mode commands.

- Gap closure 09-06 (G-09-3) at HEAD `92d52fc`: `pnpm test:data` **786 passed** (8 new teeth), `pnpm test:unit` 567 passed; both disk mutations (`zzmayus.YML`, `content/trips/zzsuelto.yml`) turn the gate red naming the file.

**Known non-phase flake:** `tests/parity/navigation.spec.ts` «SC#2 scrollspy» (mobile) runs ~29.3 s against a 30 s timeout and can time out under CPU load; passes 6/6 serially. Pre-existing, not a phase 9 regression.

## Validation Audit 2026-11-20

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
