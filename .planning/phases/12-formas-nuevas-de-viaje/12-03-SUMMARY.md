---
phase: 12-formas-nuevas-de-viaje
plan: 03
subsystem: data-schema + day header UI + data gate
tags: [zod, nuxt-content, vue, mdc, campania, stays, vitest, playwright]

requires:
  - phase: 12-02
    provides: "los cinco días del esqueleto de Campania, guardián de allowlist de tripshapes.css (NEW_CLASSES con day-stay/day-stay-name), escaneo D-17 del HTML publicado"
  - phase: 12-01
    provides: "tripshapes.css (bloque EXT-01), borrador campania, tests/trips/campania.spec.ts"
provides:
  - "StaySchema estricto + STAY_SLUG_RE, TripSchema.stays (no vacía, opcional), DaySchema.stay (opcional), tipo Stay"
  - "app/utils/tripStays.ts: stayFor(day, stays) puro, auto-importado"
  - "Línea «Dormís en <nombre>» (div.day-stay + span.day-stay-name) en la cabecera del día, visible en resumen"
  - "Bloque EXT-02 de tripshapes.css (verbatim de UI-SPEC, antes de EXT-01)"
  - "Reglas stay-ref y stay-dup de la puerta de datos (20 reglas)"
  - "trip.yml de Campania con las cuatro bases; jueves 24 → salerno"
affects: [12-04, 12-05, 12-07, 13]

actuals:
  tokens: 21282
  tasks: 2
  commits: 3
plan_head_before: d9fb3f9e5dbedfc1a02047128b8e2247beac6dc4
plan_head_after: e306c1a8a8769d8b57214b906420f620ccd2b08c

tech-stack:
  added: []
  patterns:
    - "Referencia entre ficheros (día → base del viaje) como slug exacto validado por la puerta tests/data, nunca por refine de zod"
    - "Resolución pura en app/utils (stayFor) llamada desde TripView y pasada como prop opcional al componente de presentación"

key-files:
  created:
    - app/utils/tripStays.ts
    - tests/unit/tripStays.spec.ts
    - .planning/phases/12-formas-nuevas-de-viaje/tdd/12-03-T2-red.json
    - .planning/phases/12-formas-nuevas-de-viaje/tdd/12-03-T2-red-junit.xml
  modified:
    - shared/schemas.ts
    - content/trips/campania/trip.yml
    - content/trips/campania/days/jueves-24.yml
    - app/components/TripView.vue
    - app/components/DaySection.vue
    - app/assets/css/tripshapes.css
    - tests/trips/campania.spec.ts
    - tests/data/trips.ts
    - tests/data/invariants.spec.ts
    - tests/data/schema.spec.ts

key-decisions:
  - "stay-dup emite UNA violación por slug repetido (no una por aparición), en trip.yml"
  - "stay-ref solo mira los `stay` de tipo string; un tipo erróneo lo rechaza zod en schema.spec"
  - "Evidencia RED con el reporter JUnit de Vitest: el TAP parte en varias líneas el expected de arrays y el clasificador lo rechaza como Malformed TAP"

patterns-established:
  - "Bases del viaje: `stays` (nunca `bases`) en trip.yml + `stay: <slug>` por día; area/coords/note se guardan pero no se pintan (D-08)"

requirements-completed: [EXT-02]

coverage:
  - id: D1
    description: "Esquema aditivo: TripSchema.stays (lista no vacía de bases estrictas) y DaySchema.stay (slug exacto); Roma valida igual"
    requirement: EXT-02
    verification:
      - kind: unit
        ref: "tests/data/schema.spec.ts#stays / stay (D-06)"
        status: pass
      - kind: unit
        ref: "tests/data/schema.spec.ts#D-18: Roma valida sin cambios con el esquema ampliado (Fase 12)"
        status: pass
    human_judgment: false
  - id: D2
    description: "stayFor resuelve la base del día por slug exacto; null/ausente/desconocido → undefined; Campania real resuelve y Roma no tiene base"
    requirement: EXT-02
    verification:
      - kind: unit
        ref: "tests/unit/tripStays.spec.ts#stayFor (D-06/D-07)"
        status: pass
      - kind: unit
        ref: "tests/unit/tripStays.spec.ts#stayFor con los viajes reales"
        status: pass
    human_judgment: false
  - id: D3
    description: "El jueves 24 muestra «Dormís en Salerno» entre el h2 y .day-subtitle, visible en modo resumen; cada día con stay la pinta, los demás no; forma no pinta ninguna; los marcadores no cambian (D-08)"
    requirement: EXT-02
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: el jueves 24 dice «Dormís en Salerno» entre el título y el subtítulo, también en resumen (EXT-02, D-07)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: cada día dice dónde se duerme (EXT-02, D-07)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: un viaje sin stays no pinta «Dormís en» (EXT-02 empty)"
        status: pass
    human_judgment: false
  - id: D4
    description: "La puerta de datos falla nombrando el fichero con stay-ref (también sin stays) y stay-dup; los viajes reales siguen sin violaciones"
    requirement: EXT-02
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts#la puerta tiene dientes (fixtures) > stay-ref / stay-dup"
        status: pass
      - kind: unit
        ref: "tests/data/invariants.spec.ts#viaje %s > regla stay-ref / regla stay-dup"
        status: pass
    human_judgment: false
  - id: D5
    description: "Roma intacta: pnpm verify verde (56 goldens sin --update-snapshots) y paths congelados sin diff respecto a d0c0ed2"
    verification:
      - kind: automated_ui
        ref: "pnpm verify (unit 342, data 539, parity 110 con el flaky conocido de navigation.spec re-ejecutado 6/6)"
        status: pass
      - kind: other
        ref: "git diff --exit-code d0c0ed2 -- content/trips/{roma,prueba,forma} app/assets/css/{base,tokens,fonts,leaflet,multitrip}.css tests/parity package.json pnpm-lock.yaml"
        status: pass
    human_judgment: false
  - id: D6
    description: "Aspecto visual de la línea «Dormís en» (glifo 🛏️, cursiva, contraste) en claro y oscuro"
    verification: []
    human_judgment: true
    rationale: "Ningún test compara la línea con un golden visual: el E2E comprueba texto, posición y visibilidad, no el resultado estético"

duration: 8min
completed: 2026-11-21
status: complete
---

# Phase 12 Plan 03: «Dormís en…» — bases del viaje y base de cada día Summary

**`trip.stays` + `day.stay` (zod estricto, slug exacto) resueltos por `stayFor` y pintados como «Dormís en Salerno» en la cabecera del jueves 24, visibles en modo resumen, con las reglas `stay-ref`/`stay-dup` de la puerta nombrando el fichero culpable.**

## Performance

- **Duration:** 8 min (reloj de pared; las corridas de verify/test:trips van incluidas)
- **Started:** 2026-11-21T10:27:53Z
- **Completed:** 2026-11-21T10:36:12Z
- **Tasks:** 2
- **Files modified:** 14 (incluidos los 2 ficheros de evidencia RED)

## Accomplishments

- Esquema D-06: `STAY_SLUG_RE`, `StaySchema = z.strictObject({ slug, name, area?, coords?, note? })`, `TripSchema.stays` (`.min(1).optional()`), `DaySchema.stay` y el tipo `Stay`. Es aditivo: Roma valida igual (D-18 en verde).
- `stayFor(day, stays)` puro en `app/utils/tripStays.ts`, con el null de Content tratado como ausente y comparación exacta.
- `TripView` pasa `:stay="stayFor(e.day, trip?.stays)"`. `DaySection` pinta `div.day-stay` («Dormís en » + `span.day-stay-name` por `<MDC>`) entre el `h2` y `.day-subtitle`, solo con `v-if="stay"`.
- Bloque EXT-02 de `tripshapes.css`, copiado tal cual de UI-SPEC y colocado antes de EXT-01. El guardián de allowlist de 12-02 lo acepta.
- La puerta de datos tiene 20 reglas. `stay-ref` se dispara en el fichero del día, también cuando el viaje no tiene `stays`; `stay-dup` se dispara en trip.yml.
- Campania declara sus cuatro bases (napoles, procida, ischia, salerno). El jueves 24 duerme en Salerno.

## Task Commits

1. **Task 1 (tracer): «Dormís en Salerno» de punta a punta**: `a2f71bb` (feat)
2. **Task 2 (tdd): puerta stay-ref/stay-dup + stayFor probado**
   - RED: `cf0be67` (test)
   - GREEN: `e306c1a` (feat)
   - REFACTOR: no hizo falta

**Plan metadata:** el commit docs(12-03) que acompaña a este SUMMARY

## Files Created/Modified

- `shared/schemas.ts`: STAY_SLUG_RE, StaySchema, TripSchema.stays, DaySchema.stay y el tipo Stay
- `app/utils/tripStays.ts`: `stayFor` (nuevo)
- `app/components/TripView.vue`: prop `:stay` en `<DaySection>`
- `app/components/DaySection.vue`: prop opcional `stay` y línea `div.day-stay`, con JSDoc D-07
- `app/assets/css/tripshapes.css`: bloque EXT-02
- `content/trips/campania/trip.yml`: `stays` con 4 bases (area en todas, coords en todas, note en salerno)
- `content/trips/campania/days/jueves-24.yml`: `stay: salerno`
- `tests/trips/campania.spec.ts`: 3 E2E de EXT-02 (jueves 24, por día derivado del dato, forma vacío)
- `tests/data/trips.ts`: reglas `stay-ref` y `stay-dup`, comentario «20 reglas» y cabecera de la Fase 12
- `tests/data/invariants.spec.ts`: 5 dientes de stays y cabecera de la Fase 12
- `tests/data/schema.spec.ts`: describe «stays / stay (D-06)»
- `tests/unit/tripStays.spec.ts`: stayFor con casos sintéticos y con los YAML reales (nuevo)

## Decisions Made

- `stay-dup` da una violación por slug repetido (aunque aparezca 3 veces), con el copy exacto de UI-SPEC.
- La comparación es exacta en las dos capas. zod rechaza `Salerno` y `'salerno '`; la puerta y `stayFor` no normalizan.
- Coordenadas reales aproximadas en las cuatro bases, para que la Fase 13 tenga un punto de partida. No se pintan (D-08).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Selector de marcadores del E2E (D-08)**
- **Found during:** Task 1 (paso 6)
- **Issue:** el plan pedía contar `#leaflet-map .custom-marker`, pero en el DOM montado ningún elemento conserva ese id (ya documentado en 12-01 y 12-02).
- **Fix:** se cuenta `section[id="mapa"] .custom-marker`, con un comentario.
- **Files modified:** tests/trips/campania.spec.ts
- **Committed in:** a2f71bb

**2. [Rule 3 - Blocking] eslint reordenó el marcado de la línea**
- **Found during:** Task 1 (verify)
- **Issue:** `vue/multiline-html-element-content-newline` rechazaba el `<div class="day-stay">` en una sola línea.
- **Fix:** `eslint --fix` lo partió en varias líneas, como ya preveía el plan. El textContent queda con espacios en los extremos y el E2E lo normaliza: el texto sigue siendo exactamente «Dormís en Salerno».
- **Files modified:** app/components/DaySection.vue
- **Committed in:** a2f71bb

---

**Total deviations:** 2 auto-fixed (1 Rule 1, 1 Rule 3). **Impact:** solo afectan a tests y al formato del marcado. El alcance no crece, y Roma y los paths congelados no cambian.

## TDD Gate Compliance

- **Task 1** es `type="tracer"`, no TDD. Su `feat` (`a2f71bb`) llegó antes del RED de Task 2. Por eso los casos de esquema (`schema.spec`) y de `stayFor` (`tripStays.spec`) ya estaban en verde cuando se escribieron. El plan lo preveía: «Fallan los de la puerta».
- **RED (`cf0be67`):** fallaron en aserción los 4 dientes de la puerta: 3 de `stay-ref` y 1 de `stay-dup`.
- **Evidencia RED:** `.planning/phases/12-formas-nuevas-de-viaje/tdd/12-03-T2-red.json` (reporte JUnit `12-03-T2-red-junit.xml`). El clasificador devolvió `RED_EVIDENCE_OK target_test_failed` para el target «stay-dup: dos bases con slug "procida"».
- **Valoración semántica:** el target se ejecutó y falló en la aserción planificada (`expected [] to deeply equal [ {stay-dup en trip.yml} ]`). La regla aún no existía. No hubo errores de import ni de carga.
- **Por qué JUnit:** con TAP (tap-flat), el clasificador rechazaba la corrida como `Malformed TAP`, porque el TAP de Vitest parte en varias líneas el `expected` de arrays (mismo problema que en 12-02).
- **GREEN (`e306c1a`):** 550/550 en `tests/data` + `tests/unit/tripStays.spec.ts`.
- **REFACTOR:** no hizo falta.

## Issues Encountered

- En `pnpm verify` falló solo el flaky conocido `navigation.spec.ts` «SC#2 scrollspy» [mobile], por timeout de 30 s; quedaron 109/110. Al re-ejecutar el spec pasó 6/6. Unit 342/342 y data 539/539.
- `pnpm test:trips` con cachés limpias: 31/31.
- Los paths congelados no tienen diff respecto a `d0c0ed2`.

## Known Stubs

Ninguno bloquea el objetivo. Tres de las cuatro bases (napoles, procida, ischia) todavía no las usa ningún día, a propósito (tabla «Base de cada día» del plan): 12-04 da `ischia` al martes 22, y 12-05 da `napoles`/`procida` a sábado 19, domingo 20 y viernes 25. El test «cada día dice dónde se duerme» se deriva del dato y los irá cubriendo según lleguen.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 12-04 puede añadir `stay: ischia` al martes 22 sin tocar código. El E2E derivado del dato lo comprobará solo.
- 12-05 completa la SC#2 del ROADMAP («Cada día del esqueleto de Campania indica «Dormís en…»»).

## Self-Check: PASSED

- FOUND: app/utils/tripStays.ts, tests/unit/tripStays.spec.ts, tdd/12-03-T2-red.json
- FOUND commits: a2f71bb, cf0be67, e306c1a (evaluation-scope resuelve los 3 en esta rama)
- Criterios de aceptación de Task 1 (11/11) y Task 2 (8/8) en verde

---
*Phase: 12-formas-nuevas-de-viaje*
*Completed: 2026-11-21*
