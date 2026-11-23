---
phase: 14-verificacion-del-milestone
verified: 2026-11-22T03:20:00Z
status: human_needed
score: 3/4 must-haves verified
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
covered_digest: "v4:sha256:c26e753a23380d654189af2c5623bb8e7292f67a33b9d7eb1426a3b81df9c080"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "14-UAT.md items 1-9: portada y vuelta; Roma y Campania en móvil real en claro y oscuro; notas por viaje; ritmo y modos por viaje; «Ver ruta del día» en el modo de Maps correcto; sin conexión en Roma y en Campania con la guía ya abierta (fallback de imágenes + banner «Sin conexión · solo marcadores visibles»); firma con modelo de móvil y navegador"
    expected: "Una persona aprueba Roma y Campania en un móvil real, en tema claro y oscuro, incluido el uso sin conexión (PAR-04)"
    why_human: "Render en dispositivo real y comportamiento sin conexión necesitan a una persona; no se pueden probar con grep ni con Playwright en escritorio. 14-UAT.md tiene los 9 items en estado pending."
---

# Phase 14: Verificación del milestone - Verification Report

**Phase Goal:** Hay evidencia de que v1.1 se puede publicar: Roma idéntica y sin pérdida de datos para quien ya la usa, Campania usable sobre el terreno, todo comprobado desde una build limpia y firmado por una persona en un móvil real
**Verified:** 2026-11-22T03:20:00Z
**Status:** human_needed
**Re-verification:** No (initial verification)

## Goal Achievement

Todo lo automatizable está verificado contra el código y contra ejecuciones propias. Lo único abierto es SC#4 (PAR-04), una firma humana en móvil real que por diseño queda Pending (no es un gap). Hay además un riesgo de estabilidad (WARNING) en un spec de paridad congelado.

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `pnpm verify` pasa completo desde build limpia, 56 goldens sin re-baseline, `base.css` sin diff respecto a `main` | ✓ VERIFIED (con WARNING de flake, ver abajo) | Evidencia de 14-03 (Node 22, cachés limpias): run 1 exit 0 (unit 567, data 774, parity 126/126); runs 2 y 3 fallaron solo en el flake conocido navigation SC#2 [mobile]. Verificado por mí: `git ls-files 'tests/parity/golden.spec.ts-snapshots/*.png'` = 56; `git log v1.0..HEAD -- tests/parity/golden.spec.ts-snapshots` vacío (0 commits); `git diff --quiet v1.0 HEAD -- app/assets/css/{base,tokens,fonts,leaflet}.css` = 0; `tests/data/css-vs-main.spec.ts` ejecutado por mí: 7/7 pasan (compara el CSS de la build con `main:index.html`, con solo las 2 reglas huérfanas de 08-06 en lista blanca). `git diff --stat v1.0 HEAD -- app/assets/css` solo muestra los dos CSS aditivos `multitrip.css` y `tripshapes.css` (no existen en main; los protegen specs unitarios propios). No se ejecutó el `pnpm verify` completo (instrucción del orquestador). |
| 2 | Un usuario de la guía viva que escribió notas y eligió ritmo y modos abre la nueva versión en el mismo origen y en `/trips/roma/` ve notas y preferencias desde la primera carga | ✓ VERIFIED | `tests/parity/upgrade-from-main.spec.ts` (327 líneas, sustantivo): toma `git show main:index.html` a un tmpdir (no versionado: `git ls-files '*.html'` solo lista `index.html` y un fixture preexistente), sirve la guía vieja y luego la build nueva en el mismo puerto con un único contexto, y compara el estado de la primera carga con un oráculo calculado por la propia guía viva (38 notas, ritmo, light, resumen, tema, aria-pressed, almacenamiento byte a byte, nota huérfana, recarga, Campania con por defecto). Ejecutado por mí: 4/4 pasan ([mobile] y [desktop] × 2 tests). Cubre PAR-03. |
| 3 | Portada → Roma → Campania y «Atrás» no mezcla búsqueda, notas ni modos, y ninguna guía descarga `sql_dump` ni WASM | ✓ VERIFIED | `tests/parity/cross-trip.spec.ts` (385 líneas): rastreador de peticiones con `HEAVY_RE` por paso, control positivo (la 404 de un borrador sí pide la base de contenido), recorrido por URL y por clics con Atrás/Adelante, búsqueda/notas/modos aislados por viaje con aserciones de no vacuidad (recuento de textareas). Ejecutado por mí: 12/12 pasan. |
| 4 | Una persona firma Roma y Campania en un móvil real, en claro y oscuro, incluido uso sin conexión | ? UNCERTAIN (human_needed) | `14-UAT.md` existe, en español, con 9 items `result: [pending]` (total 9, pending 9), pasos de preparación para servir en LAN bajo `guiaRoma/`. La firma no se ha producido: es PAR-04, un backstop humano. No es un gap sino la puerta de salida esperada. |

**Score:** 3/4 truths verified (1 pendiente de verificación humana; 0 present-but-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `tests/parity/upgrade-from-main.spec.ts` | Spec de upgrade en mismo origen (PAR-03), contiene `main:index.html` | ✓ VERIFIED | Existe, sustantivo, contiene `git show main:index.html`; se ejecuta dentro de la puerta (`playwright.gate.config.ts`); 4 tests pasan |
| `tests/parity/cross-trip.spec.ts` | Aislamiento entre viajes + cero descargas pesadas (D-05) | ✓ VERIFIED | Existe, sustantivo; 12 tests pasan |
| `tests/data/css-vs-main.spec.ts` | CSS de la build = CSS de main (D-02) | ✓ VERIFIED | Existe, sustantivo (189 líneas, con tests de dientes); 7/7 pasan |
| `tests/README.md` | Recuentos de la puerta re-registrados (126/15, 128/15) y §6 de Fase 14 | ✓ VERIFIED | Registrado por 14-03; coherente con 110 + 4 + 12 = 126 |
| `14-UAT.md` | Checklist de firma en móvil en español | ✓ VERIFIED (artefacto) | 9 items, sin datos personales; la firma en sí queda humana |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| upgrade-from-main.spec.ts | `_pagesServer.ts` | `startPagesServer(oldDir, PORT)` y luego `startPagesServer(OUTPUT_DIR, PORT)` | WIRED | Confirmado en el código; ejecución real pasa |
| upgrade-from-main.spec.ts | MonumentCard / useTripModes / color-mode | claves `roma-note-<slug>`, `roma-pace`, `roma-light`, `roma-resumen`, `roma-theme` restauradas en la primera carga | WIRED | El oráculo de la guía viva coincide con la build nueva (4/4) |
| cross-trip.spec.ts | build publicada | servidor de páginas + rastreador `HEAVY_RE` | WIRED | 12/12; control positivo demuestra que el detector ve las descargas |
| css-vs-main.spec.ts | `main:index.html` | `git show main:index.html` | WIRED | 7/7; `git diff --quiet main -- index.html` = 0 |

### Data-Flow Trace (Level 4)

N/A: la fase solo añade tests y documentación; no hay código de aplicación nuevo (los specs derivan los esperados del contenido y de la guía viva real, no de literales).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| CSS de la build = main | `npx vitest run tests/data/css-vs-main.spec.ts` (Node 22) | 7 passed | ✓ PASS |
| Upgrade + aislamiento entre viajes | `playwright test -c playwright.gate.config.ts tests/parity/upgrade-from-main.spec.ts tests/parity/cross-trip.spec.ts` | 16 passed (27.9 s) | ✓ PASS |
| Flake conocido | `playwright test -c playwright.gate.config.ts tests/parity/navigation.spec.ts --project mobile -g "SC#2"` | 3 passed; SC#2 tardó 28.8 s de 30 s | ✓ PASS (en el límite) |
| Goldens/CSS sin cambios desde v1.0 | `git diff --quiet v1.0 HEAD -- …css…`, `git log v1.0..HEAD -- …snapshots` | 0 diff; 0 commits; 56 PNG | ✓ PASS |

### Probe Execution

SKIPPED: la fase no declara probes `scripts/*/tests/probe-*.sh`.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| PAR-03 | 14-01, 14-02, 14-03 | Un usuario de la guía viva conserva notas y preferencias al actualizar (test de upgrade en el mismo origen) | ✓ SATISFIED | `upgrade-from-main.spec.ts` 4/4 pasan por ejecución propia; REQUIREMENTS.md línea 59 `[x]` y tabla "Complete" |
| PAR-04 | 14-03 | Sign-off humano de Roma y Campania en móvil real, incluido sin conexión | ? NEEDS HUMAN | REQUIREMENTS.md: `[ ]` y "Pending" (correcto: no se debe marcar sin firma). Checklist en 14-UAT.md con 9 items pending |

Sin requisitos huérfanos: REQUIREMENTS.md solo asigna PAR-03 y PAR-04 a la Fase 14 y ambos aparecen en los PLAN (PAR-03 en 14-01; PAR-04 en 14-03).

### Prohibitions

| Statement | Tier | Disposición |
| --------- | ---- | ----------- |
| El upgrade nunca reescribe ni borra un valor guardado por la guía viva | judgment, con enforcement | Respaldada por aserciones byte a byte en `upgrade-from-main.spec.ts` (única reescritura permitida, `roma-pace`→slow, es la misma que hace la guía viva y se comprueba contra el oráculo). Verificada. |
| La build nueva no pide al usuario hacer nada para recuperar datos | judgment | Cubierta por la aserción de «primera carga sin recarga, clic ni migración». Verificada. |
| Copia de `index.html` vivo nunca versionada bajo `tests/` | judgment | `git ls-files '*.html'` = `index.html` (raíz, igual que main) y `tests/data/fixtures/roma-reservas.html` (fixture preexistente). Verificada. |
| Una nota de un viaje no aparece en otro; sin sql_dump/WASM; CSS congelado no editado | judgment/test | Cubiertas por aserciones de `cross-trip.spec.ts` y `css-vs-main.spec.ts`, y por `git diff v1.0 HEAD` sobre el CSS = vacío. Verificadas. |
| La fase no da PAR-04 por firmado con evidencia automática; el gate no se pone verde re-baselineando, saltando specs ni aflojando exclusiones | judgment | PAR-04 sigue Pending; 0 commits sobre los snapshots desde v1.0; sin cambios en specs existentes (`git log` de 3dfdba9..HEAD sobre `tests/parity`, `app`, `content`, `shared`, `scripts` solo toca los dos specs nuevos). Verificada. |

Ninguna prohibición queda marcada como `unverified-prohibition`.

### Anti-Patterns Found

Escaneo de los tres specs nuevos y de la documentación: sin `TBD`/`FIXME`/`XXX`, sin stubs, sin `v-html` ni `<style scoped>` añadidos (la fase no toca `app/`). Sin hallazgos bloqueantes.

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `tests/parity/navigation.spec.ts` (congelado) | 248 | Test SC#2 [mobile] consume ~28.8-29.5 s de un presupuesto de 30 s | WARNING | Falló en 2 de 3 ejecuciones de `pnpm verify` de 14-03 (solo ese test); `pnpm verify` es no determinista en el último tramo de la puerta |

### Risks / Warnings

1. **WARNING: flake de navigation.spec.ts SC#2 [mobile].** Lo confirmé: aislado tarda 28.8 s frente a un presupuesto de 30 s; bajo 12 workers 29.0-29.5 s. Por eso `pnpm verify` falló en 2 de 3 ejecuciones (solo ese test; el resto, incluidos los dos specs nuevos, pasó en las 3). No es un defecto de comportamiento ni un D-06. Es un spec de paridad congelado (D-01/D-09), así que subir su timeout o acortar su bucle de sondeo requiere una decisión del usuario. Antes de publicar conviene decidirlo, porque una puerta que falla al azar debilita la evidencia de «build limpia verde».
2. SC#1 se apoya en una sola ejecución verde completa (run 1) más dos ejecuciones cuyo único fallo es el flake nombrado. Yo no repetí `pnpm verify` completo (instrucción del orquestador); sí reejecuté los specs nuevos y el de CSS.

### Human Verification Required

#### 1. Firma en móvil real (PAR-04), 14-UAT.md items 1-9

**Test:** Seguir `14-UAT.md`: servir la build bajo `guiaRoma/` en la LAN, abrirla en un móvil real y recorrer portada, Roma y Campania en claro y oscuro, notas, ritmo y modos por viaje, «Ver ruta del día» (Roma a pie; Campania jueves 24 y viernes 25 en coche, martes 22 en transporte; sin botón sábado 19, domingo 20, lunes 21, domingo 27, lunes 28) y el uso sin conexión (con la guía ya abierta y modo avión, sin recargar).
**Expected:** Fotos sin cargar muestran su dibujo; el mapa muestra «Sin conexión · solo marcadores visibles»; nada desborda ni parpadea; se anota modelo de móvil y navegador.
**Why human:** Render en dispositivo real y comportamiento sin conexión no son comprobables programáticamente.

### Gaps Summary

No hay gaps. Las SC#1-3 están respaldadas por código sustantivo y cableado, y por ejecuciones propias (7 + 16 tests en verde, 56 goldens y CSS sin diff desde v1.0). SC#4 / PAR-04 es una firma humana pendiente por diseño, de ahí `human_needed`. El único riesgo abierto es el timing de navigation SC#2 [mobile] (WARNING, requiere decisión del usuario sobre un spec congelado).

---

_Verified: 2026-11-22T03:20:00Z_
_Verifier: Claude (gsd-verifier)_
