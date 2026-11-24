---
phase: 14-verificacion-del-milestone
verified: 2026-11-23T23:40:00Z
status: passed
score: 4/4 must-haves verified
covered_files:
  - ".planning/phases/14-verificacion-del-milestone/14-01-PLAN.md"
  - ".planning/phases/14-verificacion-del-milestone/14-01-SUMMARY.md"
  - ".planning/phases/14-verificacion-del-milestone/14-02-PLAN.md"
  - ".planning/phases/14-verificacion-del-milestone/14-02-SUMMARY.md"
  - ".planning/phases/14-verificacion-del-milestone/14-03-PLAN.md"
  - ".planning/phases/14-verificacion-del-milestone/14-03-SUMMARY.md"
  - "tests/README.md"
  - "tests/data/css-vs-main.spec.ts"
  - "tests/parity/cross-trip.spec.ts"
  - "tests/parity/upgrade-from-main.spec.ts"
covered_digest: "v4:sha256:b3df2d896f550f941c017a37ee35cfba14a097432e14bbe31ee89ca4ee979ad7"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 3/4
  gaps_closed:
    - "SC#4 / PAR-04: firma humana en móvil real (14-UAT.md complete, 9/9 pass)"
  gaps_remaining: []
  regressions: []
---

# Phase 14: Verificación del milestone - Verification Report

**Phase Goal:** Hay evidencia de que v1.1 se puede publicar: Roma idéntica y sin pérdida de datos para quien ya la usa, Campania usable sobre el terreno, todo comprobado desde una build limpia y firmado por una persona en un móvil real
**Verified:** 2026-11-23T23:40:00Z
**Status:** passed
**Re-verification:** Yes. El informe anterior (human_needed, 3/4) quedó obsoleto: se escribió antes de los arreglos de la revisión de código (dc1035b, fcf2ef2, a06c325 y otros) y antes de la firma en móvil.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `pnpm verify` pasa completo desde build limpia, 56 goldens sin re-baseline, `base.css` sin diff respecto a `main` | ✓ VERIFIED | Log del orquestador (`verify.log`, Node 22, cachés limpias): unit 25 ficheros / 575 tests, data 8 ficheros / 927 tests, parity `126 passed (1.3m)`. Comprobado por mí: `git ls-files 'tests/parity/golden.spec.ts-snapshots/*.png'` = 56; `git log v1.0..HEAD -- tests/parity/golden.spec.ts-snapshots` = 0 commits; `git diff --quiet v1.0 HEAD -- app/assets/css/{base,tokens,fonts,leaflet}.css` sale 0; `git diff --quiet main -- index.html` sale 0; `tests/data/css-vs-main.spec.ts` ejecutado por mí: 11/11 pasan (7 en el informe anterior; la revisión añadió tests de dientes). Los dos specs nuevos ejecutados por mí contra la `.output` existente: 16/16 pasan (28.2 s). No repetí el `pnpm verify` completo. |
| 2 | Un usuario de la guía viva con notas, ritmo y modos abre la nueva versión en el mismo origen y en `/trips/roma/` los ve desde la primera carga | ✓ VERIFIED | `tests/parity/upgrade-from-main.spec.ts`: sirve `git show main:index.html` (tmpdir, no versionado: `git ls-files '*.html'` = `index.html` raíz + fixture preexistente) y la build nueva en el mismo puerto y contexto, con oráculo calculado por la propia guía viva. 4/4 pasan por ejecución propia ([mobile] y [desktop]), tras los arreglos de revisión. Cubre PAR-03. |
| 3 | Portada → Roma → Campania → «Atrás» no mezcla búsqueda, notas ni modos, y ninguna guía descarga `sql_dump` ni WASM | ✓ VERIFIED | `tests/parity/cross-trip.spec.ts`: rastreador `HEAVY_RE` con control positivo, recorrido por URL y por clics con Atrás/Adelante, aislamiento de búsqueda/notas/modos. 12/12 pasan por ejecución propia. |
| 4 | Una persona firma Roma y Campania en un móvil real, en claro y oscuro, incluido uso sin conexión | ✓ VERIFIED (human sign-off) | `14-UAT.md` `status: complete`, 9/9 `pass`, 0 issues, 0 pending (commit 198c427 «test(14): complete UAT - 9 passed, 0 issues»). Cubre portada, Roma y Campania en claro/oscuro, notas y ritmo/modos por viaje, «Ver ruta del día» por modo, offline en ambas guías y firma. Probado contra `https://psl11.github.io/guiaRoma/`; comprobé que sirve el mismo código que `release/nuxt-4`: `git diff --stat origin/main HEAD -- . ':!.planning'` solo muestra `docs/DEPLOY.md`. |

**Score:** 4/4 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `tests/parity/upgrade-from-main.spec.ts` | Upgrade en mismo origen (PAR-03) | ✓ VERIFIED | Existe, sustantivo, dentro de la puerta; 4/4 |
| `tests/parity/cross-trip.spec.ts` | Aislamiento + cero descargas pesadas | ✓ VERIFIED | 12/12 |
| `tests/data/css-vs-main.spec.ts` | CSS de la build = CSS de main | ✓ VERIFIED | 11/11 |
| `tests/README.md` | Conteos 126/15 (crudo 128/15) y §6 Fase 14 | ✓ VERIFIED | Líneas 162-163, 184-215 coherentes con `126 passed` del log |
| `14-UAT.md` | Checklist firmado | ✓ VERIFIED | complete, 9/9 pass |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| upgrade-from-main.spec.ts | `_pagesServer.ts` | dos `startPagesServer` en el mismo puerto | WIRED | Ejecución real 4/4 |
| upgrade-from-main.spec.ts | claves `roma-note-*`, `roma-pace`, `roma-light`, `roma-resumen`, `roma-theme` | oráculo de la guía viva | WIRED | Coincide con la build nueva |
| cross-trip.spec.ts | build publicada | servidor + rastreador `HEAVY_RE` | WIRED | 12/12 |
| css-vs-main.spec.ts | `main:index.html` | `git show main:index.html` | WIRED | 11/11 |

### Data-Flow Trace (Level 4)

N/A: la fase solo añade tests y documentación; no hay código de aplicación nuevo.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| CSS build = main | `vitest run tests/data/css-vs-main.spec.ts` (Node 22) | 11 passed | ✓ PASS |
| Upgrade + aislamiento | `playwright test -c playwright.gate.config.ts tests/parity/upgrade-from-main.spec.ts tests/parity/cross-trip.spec.ts` | 16 passed | ✓ PASS |
| Goldens/CSS sin cambios desde v1.0 | `git diff --quiet v1.0 HEAD -- …css…`; `git log v1.0..HEAD -- …snapshots` | 0 diff; 0 commits; 56 PNG | ✓ PASS |
| Puerta completa | log de `pnpm verify` del orquestador | 575 + 927 + 126 en verde | ✓ PASS (evidencia del orquestador, contrastada en el log) |

### Probe Execution

SKIPPED: la fase no declara probes `scripts/*/tests/probe-*.sh`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| PAR-03 | 14-01, 14-02, 14-03 | Usuario de la guía viva conserva notas y preferencias al actualizar (test en el mismo origen) | ✓ SATISFIED | `upgrade-from-main.spec.ts` 4/4; REQUIREMENTS.md ya lo marca `[x]` / Complete |
| PAR-04 | 14-03 | Sign-off humano de Roma y Campania en móvil real, incluido offline | ✓ SATISFIED | `14-UAT.md` complete 9/9. REQUIREMENTS.md aún dice `[ ]` / Pending (línea 60 y 134): lo actualiza el orquestador, no el verificador |

Sin requisitos huérfanos: REQUIREMENTS.md solo asigna PAR-03 y PAR-04 a la Fase 14 y ambos están en los PLAN.

### Prohibitions

| Statement | Tier | Disposición |
| --------- | ---- | ----------- |
| El upgrade nunca reescribe ni borra un valor guardado (salvo la reescritura de `roma-pace` que hace la propia guía viva) | judgment, con enforcement | Aserciones byte a byte en el spec; verificado |
| Copia de `index.html` vivo nunca versionada | judgment | `git ls-files '*.html'` = `index.html` + fixture preexistente |
| Notas/búsqueda no cruzan viajes; sin sql_dump/WASM; CSS congelado intacto | test | `cross-trip.spec.ts`, `css-vs-main.spec.ts`, diff v1.0 = 0 |
| PAR-04 no se da por firmado con evidencia automática | backstop | Firma humana real registrada en `14-UAT.md` |
| El gate no se pone verde re-baselineando ni aflojando specs | judgment | 0 commits sobre snapshots desde v1.0 |

Ninguna prohibición queda como `unverified-prohibition`.

### Anti-Patterns Found

Sin `TBD`/`FIXME`/`XXX` en los tres specs, `tests/README.md` ni `14-UAT.md`. Sin stubs. La fase no toca `app/`. `14-UAT.md` sin datos personales.

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `tests/parity/navigation.spec.ts` (congelado) | 248 | SC#2 [mobile] tardó 29.7 s en el run limpio de hoy, con presupuesto de 30 s | ⚠️ Warning (advisory) | Flake conocido y documentado; esta vez pasó. Un `pnpm verify` futuro puede fallar al azar en ese test. No bloquea la fase; arreglarlo requiere decisión del usuario sobre un spec congelado |

### Notas y limitaciones (no bloqueantes)

1. La firma se hizo sobre el sitio publicado (`psl11.github.io/guiaRoma/`), no sobre la build local de `14-UAT.md` pasos previos. Es equivalente en código a `release/nuxt-4` (solo difiere `docs/DEPLOY.md`), así que la evidencia es válida y refleja lo que realmente se publica.
2. El usuario no indicó modelo de móvil ni navegador; `14-UAT.md` lo deja registrado en `device`. El ítem 9 pedía anotarlos, pero el criterio PAR-04 («móvil real») se cumple por declaración del usuario. Registrado como limitación, no como gap.
3. WR-08 de la revisión (fallback a `origin/main` si no hay rama `main` local) sigue diferido al acto de ship/deploy; está documentado en `14-REVIEW-DISPOSITION.md` y en el README, con error claro. No afecta a esta fase.
4. Las UAT de las fases 9-13 ya constan completas en el historial (commits 7b0093f, cb61620, 06e5bdd), de modo que el pendiente que mencionaba `14-UAT.md` está desfasado; es solo texto de notas.

### Gaps Summary

No hay gaps. Las cuatro SC están respaldadas por código sustantivo y cableado, por ejecuciones propias (11 + 16 tests en verde, 56 goldens y CSS sin diff desde v1.0, `pnpm verify` completo en verde en el log del orquestador) y, para SC#4/PAR-04, por la firma humana real en móvil (9/9). Queda al orquestador marcar PAR-04 en REQUIREMENTS.md y hacer la transición de fase.

---

_Verified: 2026-11-23T23:40:00Z_
_Verifier: Claude (gsd-verifier)_
