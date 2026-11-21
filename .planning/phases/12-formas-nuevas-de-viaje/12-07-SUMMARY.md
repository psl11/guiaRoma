---
phase: 12-formas-nuevas-de-viaje
plan: 07
subsystem: data-schema + MonumentCard + tripshapes.css + búsqueda + E2E de Campania + documentación de la puerta
tags: [zod, nuxt-content, mdc, css, minisearch, leaflet, playwright, vitest, campania]
status: complete

requires:
  - phase: 12-06
    provides: "ruta del día por modo; campania.spec.ts con helpers de color (toRgb/sameRgb/newThemedPage) y markerByRoman"
  - phase: 12-02
    provides: "guardián tripShapesCss.spec.ts + NEW_CLASSES con family-box; escaneo D-17 de clases del HTML publicado"
provides:
  - "MonumentSchema.family = Md.min(1).optional() (EXT-07, D-12)"
  - "MonumentCard: div.culture-box.family-box con span.label «Con niños», posición única fuera de las ramas de boxOrder"
  - "tripshapes.css completo = bloque de 12-UI-SPEC (bloque EXT-07 añadido al final)"
  - "buildHaystack incluye family (la nota familiar se encuentra con el buscador)"
  - "E2E: caja «Con niños», su color en claro/oscuro, encuadre multi-ciudad de Campania (EXT-05) y backstop 375 px"
  - "tests/README.md: conteos re-medidos (Total: 110 tests in 13 files; test:trips 44 en 4) y §5.8 Formas nuevas de viaje"
affects: [13]

actuals:
  tokens: 8660
  tasks: 3
  commits: 4
plan_head_before: 6ba5c60e214780a8de2476f794308915be356ac2
plan_head_after: f897ffffa94aa17d05a95e007def72825a9960ce

tech-stack:
  added: []
  patterns:
    - "Caja derivada de .culture-box por clase extra (`.culture-box.family-box`): solo el tono cambia, la especificidad 0,2,0/0,3,0 vence sin depender del orden de carga"
    - "Encuadre del mapa medido como contención de cajas (marcador dentro de .leaflet-container) + reparto mínimo, con expect.poll por el invalidateSize de 300 ms"

key-files:
  created:
    - .planning/phases/12-formas-nuevas-de-viaje/deferred-items.md
  modified:
    - shared/schemas.ts
    - app/components/MonumentCard.vue
    - app/assets/css/tripshapes.css
    - app/utils/searchIndex.ts
    - content/trips/campania/monuments/baia-di-sorgeto.yml
    - tests/trips/campania.spec.ts
    - tests/unit/searchIndex.spec.ts
    - tests/data/schema.spec.ts
    - tests/README.md

key-decisions:
  - "D-12: `family` es Markdown-inline opcional (vacío rechazado) pintado con <MDC :tag=false unwrap=p> en una caja culture-box.family-box tras .maps-link/.sorrentino-box y antes de la pareja culture/notes, fuera de las ramas de boxOrder; Roma sin family → DOM idéntico salvo el comentario vacío del v-if"
  - "La nota familiar entra en el haystack de búsqueda (invariante de superconjunto de la Fase 6); Roma sin family da el mismo haystack"
  - "EXT-05 sin cambio de código del mapa: setView(trip.map) + fitBounds(...).pad(0.1); el test E2E comprueba la contención de los marcadores de las cuatro ciudades y que no se amontonan"
  - "El test de encuadre en dev devuelve al contenedor los 520 px de base.css, porque en nuxi dev el contenedor montado pierde id=leaflet-map (problema previo, solo dev, anotado en deferred-items.md)"

requirements-completed: [EXT-07, EXT-05]

coverage:
  - id: D1
    description: "Una ficha con `family` muestra la caja «Con niños» en su sitio (Baia di Sorgeto), y solo las fichas con family la tienen"
    requirement: EXT-07
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: Baia di Sorgeto muestra la caja «Con niños» en su sitio (EXT-07, D-12)"
        status: pass
      - kind: unit
        ref: "tests/data/schema.spec.ts#family (D-12)"
        status: pass
      - kind: unit
        ref: "tests/unit/tripShapesCss.spec.ts (guardián de allowlist, pnpm verify)"
        status: pass
    human_judgment: false
  - id: D2
    description: "La etiqueta «Con niños» tiene el verde oliva de UI-SPEC en claro y en oscuro"
    requirement: EXT-07
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: la etiqueta «Con niños» se lee en claro y en oscuro (backstop theme E6)"
        status: pass
    human_judgment: false
  - id: D3
    description: "La nota familiar se puede buscar; el haystack de Roma no cambia"
    requirement: EXT-07
    verification:
      - kind: unit
        ref: "tests/unit/searchIndex.spec.ts#nota familiar en el haystack (D-12)"
        status: pass
    human_judgment: false
  - id: D4
    description: "El mapa de Campania encuadra Nápoles, Procida, Ischia y Salerno a la vez; Roma conserva su vista"
    requirement: EXT-05
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: el mapa encuadra Nápoles, Procida, Ischia y Salerno a la vez (EXT-05, D-13)"
        status: pass
      - kind: e2e
        ref: "pnpm verify (tests/parity, 110 passed, 56 goldens sin --update-snapshots)"
        status: pass
    human_judgment: false
  - id: D5
    description: "A 375 px las formas nuevas parten línea sin desbordar"
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: a 375 px las formas nuevas parten línea sin desbordar (backstop overflow E1/E2/E6)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Cierre de fase: puerta completa desde cachés limpias, conteos re-registrados, congelados sin diff"
    verification:
      - kind: other
        ref: "pnpm verify (unit 541, data 560, parity 110 passed); pnpm test:trips (44 passed); pnpm lint; pnpm typecheck"
        status: pass
    human_judgment: false
  - id: D7
    description: "Que la caja «Con niños» se lea bien y quede en un sitio natural dentro de la ficha"
    verification: []
    human_judgment: true
    rationale: "La posición se marcó [auto, UI-SPEC] y se confirma en /gsd-verify-work 12; la calidad editorial y visual solo se juzga mirándola"

duration: 12min
completed: 2026-11-21
---

# Phase 12 Plan 07: «Con niños», mapa multi-ciudad y cierre de la fase Summary

**Las fichas aceptan una nota `family` que se pinta como caja «Con niños» en verde oliva (derivada de `.culture-box`) y que el buscador encuentra. El mapa de Campania muestra a la vez Nápoles, Procida, Ischia y Salerno sin cambiar el código del encuadre. La fase cierra con la puerta de Roma en verde desde cachés limpias (110 tests, 56 goldens sin re-baseline) y los conteos re-medidos en tests/README.md.**

## Performance

- **Duration:** ~12 min de reloj, más las puertas `pnpm verify` y `pnpm test:trips`
- **Started:** 2026-11-21T11:26:11Z
- **Completed:** 2026-11-21T11:38:39Z
- **Tasks:** 3
- **Files modified:** 9 (más deferred-items.md)

## Accomplishments

- **Esquema (D-12).** `MonumentSchema.family = Md.min(1).optional()`. Una cadena vacía no valida; Roma no lo usa (el test D-18 ya lo vigilaba).
- **MonumentCard.** `<div v-if="monument.family" class="culture-box family-box"><span class="label">Con niños</span> <MDC … unwrap="p" /></div>` justo después de `.sorrentino-box` y antes de `<template v-if="monument.boxOrder === 'notes-first'">`. Sin estilos nuevos en el componente. Sigue habiendo un único `v-html` (el del motivo).
- **tripshapes.css.** Bloque EXT-07 de UI-SPEC copiado tal cual al final. El fichero entero, con los espacios normalizados, es igual al bloque de UI-SPEC (comprobación del `<verify>` de la Task 2).
- **Contenido.** `baia-di-sorgeto.yml` tiene `family` con tres frases de esqueleto: escalones de bajada, agua muy caliente en algunas pozas, linterna y calzado de noche.
- **Búsqueda.** `buildHaystack` añade `family` después de `sorrentino`, y la JSDoc lo explica.
- **E2E (4 nuevos en campania.spec.ts, que pasa de 20 a 24):**
  - caja «Con niños» (una sola, entre `.maps-link` y `.notes-area`, tantas como fichas con `family`);
  - color de la etiqueta en claro y en oscuro (±2);
  - encuadre multi-ciudad (los cuatro marcadores dentro de la caja del mapa y repartidos);
  - backstop a 375 px (nombre de «Dormís en» alargado a 63 caracteres y caja «Con niños»: ambos parten línea y no hay desbordamiento horizontal).
- **Cierre.**
  - `pnpm verify` desde cachés limpias: unit 541, data 560, parity 110 passed, sin flakies.
  - Después, `pnpm test:trips` (44 passed), `pnpm lint` y `pnpm typecheck` en verde.
  - Congelados sin diff respecto a `d0c0ed2`; `.output/public/trips/campania` no existe.
  - tests/README.md actualizado (§4, §5.1, §5.5 y §5.8 nueva).

## Task Commits

1. **Task 1 (tracer): «Con niños» en Baia di Sorgeto.** `f773eae` (feat). Gate del tracer en modo auto: se volvió a ejecutar el `<verify>` completo (vitest 1094/1094, typecheck 0, eslint 0, campania 22/22) y se pasó a la expansión.
2. **Task 2 (TDD): la nota se busca, encuadre y UI-SPEC.**
   - RED: `882cdce` (test).
   - GREEN: `02b131c` (feat).
   - No hizo falta REFACTOR.
3. **Task 3: cierre de fase.** `f897fff` (docs).

## Files Created/Modified

- `shared/schemas.ts`: `family`.
- `app/components/MonumentCard.vue`: la caja y la cabecera JSDoc.
- `app/assets/css/tripshapes.css`: bloque EXT-07.
- `app/utils/searchIndex.ts`: `family` en el haystack y en la JSDoc.
- `content/trips/campania/monuments/baia-di-sorgeto.yml`: `family`.
- `tests/trips/campania.spec.ts`: 4 tests EXT-07/EXT-05/overflow.
- `tests/unit/searchIndex.spec.ts`: describe «nota familiar en el haystack (D-12)».
- `tests/data/schema.spec.ts`: `describe('family (D-12)')`.
- `tests/README.md`: conteos y §5.8.
- `.planning/phases/12-formas-nuevas-de-viaje/deferred-items.md` (nuevo).

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] El mapa en dev mide 0 px de alto; el test de encuadre le devuelve su altura**
- **Found during:** Task 2 (E2E EXT-05).
- **Issue:** en `nuxi dev` la `.leaflet-container` montada pierde `id="leaflet-map"` y con él el `height: 520px` de base.css. Pasa en todos los viajes, también en Roma. Con 720×0 px, `fitBounds` encuadra a zoom mínimo, todos los marcadores caen en el mismo píxel y ninguno queda dentro de la caja. La build publicada no tiene el problema (`map-fallback-notes.spec` exige el contenedor visible).
- **Fix:** el test inyecta con `addInitScript`, antes de que monte el mapa, `section[id="mapa"] .map-wrapper > .leaflet-container { height: 520px }` y espera a que el mapa tenga alto. No cambia ningún código del mapa. La caja de referencia es `.leaflet-container` (bajo `section[id="mapa"]`) y no `#leaflet-map`, que en dev no existe. La causa raíz queda en `deferred-items.md`, porque arreglarla tocaría TripView/LeafletMap y pondría en riesgo la paridad.
- **Files modified:** tests/trips/campania.spec.ts
- **Commit:** 02b131c

**2. [Rule 2 - Calidad del test] Dientes para la búsqueda y el encuadre**
- **Issue:**
  - «escalones» ya está en un fact de Sorgeto («unos 230 escalones desde Panza»), así que el test del plan pasaría aunque el haystack no incluyera `family`.
  - Con `setView(center, 9)`, los cuatro marcadores ya están dentro de la caja aunque no haya `fitBounds`. Se comprobó con una mutación temporal, ya revertida: los dos dan zoom 9 y un reparto de 503×186 px.
- **Fix:**
  - Búsqueda: se mantiene «escalones» y se añade «linterna», que solo aparece en `family`. Además se comprueba que el haystack sin `family` no la contiene. El RED falló justo ahí.
  - Encuadre: el test exige que los marcadores ocupen más del 60 % del ancho o del alto del mapa, lo que protege contra el amontonamiento a zoom bajo. Se aplica a todos los marcadores (hoy 70 %).
- **Commits:** 882cdce, 02b131c

**3. [Contenido] 230 escalones, no ≈300**
- El contexto del plan pedía «≈300 escalones», pero el fact de la misma ficha dice «unos 230 escalones desde Panza». Se usó 230 para que la ficha no se contradiga. El texto es de esqueleto y la Fase 13 lo reescribe.
- **Commit:** f773eae

**Total deviations:** 3 (1 bloqueante resuelta en el test, 1 de dientes, 1 de contenido). **Impact:** ningún cambio de comportamiento fuera del plan; el código del mapa queda intacto (guardia de diff de setView/fitBounds/invalidateSize = 0).

## TDD Gate Compliance

- **Task 2 (`tdd="true"`).**
  - **RED (`882cdce`).** `vitest run tests/unit/searchIndex.spec.ts tests/data/schema.spec.ts --reporter=junit`: exit 1, 2 fallos de 319 tests.
    - Target: `nota familiar en el haystack (D-12) > buildHaystack de una ficha con family contiene su texto`. Falló en `toContain(FAMILY)`.
    - Segundo fallo: la búsqueda de «linterna». Misma causa.
    - `gsd-tools check tdd-red-evidence` → `RED_EVIDENCE_OK` (`target_test_failed`, formato junit).
    - Valoración semántica: el target se ejecutó y falló en la aserción planeada porque el haystack aún no incluía `family`. No hubo errores de carga ni de sintaxis. Los tests de esquema pasaron en verde porque `family` llegó con el tracer (Task 1), como estaba previsto.
  - **GREEN (`02b131c`).** `if (m.family) parts.push(m.family)`: 319/319.
  - **REFACTOR.** No hizo falta.

## Issues Encountered

- `pnpm verify` (desde cachés limpias): unit 541/541, data 560/560, parity 110 passed. Ningún flaky y ninguna actualización de snapshots.
- `rm -rf .data .nuxt && pnpm test:trips`: 44/44.
- `pnpm lint` y `pnpm typecheck`: exit 0.
- Conteos medidos con `--list`:
  - puerta con grep-invert: `Total: 110 tests in 13 files`;
  - puerta en crudo: `Total: 112 tests in 13 files`;
  - trips: `Total: 44 tests in 4 files`.
- Congelados: `git diff --exit-code d0c0ed2` limpio en `content/trips/{roma,prueba,forma}`, `base/tokens/fonts/leaflet/multitrip.css`, `tests/parity`, `package.json` y `pnpm-lock.yaml`.
- Ningún código nuevo de la fase toca `localStorage`.

## Known Stubs

Ninguno que impida el objetivo. El texto de `family` de Sorgeto es de esqueleto (D-15) y la Fase 13 lo reescribe.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Fase 12 completa (7/7). Pasa a `/gsd-verify-work 12`.
- Revisión humana pendiente:
  - posición y legibilidad de «Con niños» (marcada [auto]);
  - enlace en coche del viernes 25 (12-06).
- Diferido: la pérdida de `id="leaflet-map"` en dev (`deferred-items.md`).

## Self-Check: PASSED

- Ficheros presentes: deferred-items.md, schemas.ts, MonumentCard.vue, tripshapes.css, searchIndex.ts, baia-di-sorgeto.yml, campania.spec.ts, searchIndex.spec.ts, schema.spec.ts, README.md.
- Commits en HEAD: f773eae, 882cdce, 02b131c, f897fff.
- Criterios de aceptación de las tres tasks re-ejecutados: todos PASS.
