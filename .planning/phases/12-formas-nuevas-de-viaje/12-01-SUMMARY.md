---
phase: 12-formas-nuevas-de-viaje
plan: 01
subsystem: data-schema + timeline UI
tags: [zod, nuxt-content, vue, timeline, choice, campania, draft, playwright]

requires:
  - phase: 11
    provides: "draft: true + draftExcludes (borradores fuera de producción), manifiesto real, multitrip.css último en css[]"
  - phase: 10
    provides: "trampa de textos de Roma (romaLeaks.ts / shape.spec.ts), chrome del viaje desde trip.yml"
provides:
  - "Fila `choice` estricta en day.timeline (BaseTimelineRow, ChoiceOption, ChoiceRow; TimelineRow con 6 kinds)"
  - "TimelineChoice.vue: div.tl-choice[role=group] con «Elige una», opciones apiladas y «— o bien —»"
  - "app/assets/css/tripshapes.css (bloque EXT-01 verbatim de UI-SPEC), última entrada de css[]"
  - "Esqueleto borrador content/trips/campania (trip.yml con CAMPANIA-CENTINELA-12A, jueves-24, 3 fichas)"
  - "tests/trips/campania.spec.ts (E2E en dev) y test D-18 de Roma sin cambios"
affects: [12-02, 12-03, 12-04, 12-05, 12-06, 12-07, 13]

actuals:
  tokens: 10700
  tasks: 2
  commits: 3
plan_head_before: 0af8a7f515713b02d1cd275ae894dda3c39d3152
plan_head_after: 711c4c1ed1909069f8be37379be8594d636775a3

tech-stack:
  added: []
  patterns:
    - "z.strictObject para formas nuevas: zod 4 tira claves desconocidas en silencio; estricto, fallan con Unrecognized key"
    - "Dos uniones (BaseTimelineRow para opciones, TimelineRow para el día) en vez de z.lazy: un nivel por construcción y JSON-Schema plano para Content"
    - "Componente recursivo Timeline ⇄ TimelineChoice vía resolveComponent + auto-import <Timeline>, sin defineAsyncComponent"

key-files:
  created:
    - app/components/TimelineChoice.vue
    - app/assets/css/tripshapes.css
    - content/trips/campania/trip.yml
    - content/trips/campania/days/jueves-24.yml
    - content/trips/campania/monuments/duomo-di-salerno.yml
    - content/trips/campania/monuments/castello-arechi.yml
    - content/trips/campania/monuments/raito.yml
    - tests/trips/campania.spec.ts
  modified:
    - shared/schemas.ts
    - app/components/Timeline.vue
    - nuxt.config.ts
    - tests/data/schema.spec.ts
    - tests/unit/multitripCss.spec.ts
    - tests/unit/tripManifest.spec.ts

key-decisions:
  - "A1 / Pitfall 12 resuelto: la importación circular Timeline ⇄ TimelineChoice rinde en SSR de dev y en typecheck sin el respaldo defineAsyncComponent"
  - "E2E de marcadores: se cuentan con section[id=\"mapa\"] .custom-marker, no con #leaflet-map .custom-marker (en el DOM montado el contenedor ya no tiene ese id)"
  - "El literal CAMPANIA-CENTINELA-12A vive solo en howTo (el comentario de cabecera lo describe sin repetirlo) para cumplir el criterio == 1"

patterns-established:
  - "Bloque de alternativas: raíz div (nunca section), sin h* ni id dentro; label en texto plano, heading/title por <MDC :tag=false unwrap=p>"
  - "E2E de formas nuevas: esperado derivado del YAML del viaje (secuencia de kinds → clases raíz de las filas)"

requirements-completed: [EXT-01]

coverage:
  - id: D1
    description: "El esquema acepta una fila choice estricta (2..3 opciones, filas base con sus defaults) y rechaza 1/4 opciones, rows vacío, choice anidado, pace en el choice, claves desconocidas y opciones sin label/title"
    requirement: EXT-01
    verification:
      - kind: unit
        ref: "tests/data/schema.spec.ts#choice (D-01, D-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Roma valida sin cambios con el esquema ampliado y el JSON-Schema del día sigue plano (D-18)"
    requirement: EXT-01
    verification:
      - kind: unit
        ref: "tests/data/schema.spec.ts#D-18: Roma valida sin cambios con el esquema ampliado (Fase 12)"
        status: pass
    human_judgment: false
  - id: D3
    description: "El jueves 24 de Campania pinta div.tl-choice con «Elige una», opciones A y B en orden, un «— o bien —» entre ellas, entre las paradas comunes; raito en la lista de fichas y marcadores = fichas"
    requirement: EXT-01
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: el jueves 24 apila las opciones con «— o bien —» entre filas comunes (EXT-01, D-02)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Campania es un borrador: manifiesto real con campania, draftExcludes de producción, portada de dev sin tarjeta, trampa de Roma en verde"
    verification:
      - kind: unit
        ref: "tests/unit/tripManifest.spec.ts#manifiesto real (content/trips)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: la portada de dev no lista el borrador (D-16)"
        status: pass
      - kind: e2e
        ref: "tests/trips/shape.spec.ts#trampa: campania no muestra ningún texto de Roma"
        status: pass
    human_judgment: false
  - id: D5
    description: "tripshapes.css cargado el último en css[]; la puerta de paridad de Roma sigue verde (110 tests, 56 goldens sin --update-snapshots)"
    verification:
      - kind: unit
        ref: "tests/unit/multitripCss.spec.ts#nuxt.config.ts carga multitrip.css detrás de los cuatro CSS congelados y tripshapes.css cierra la lista"
        status: pass
      - kind: automated_ui
        ref: "pnpm verify (playwright.gate.config.ts, 110 passed)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Aspecto visual del bloque de alternativas (borde discontinuo, píldora de etiqueta, jerarquía) en claro y oscuro"
    verification: []
    human_judgment: true
    rationale: "Ningún test compara píxeles del borrador de Campania; la fidelidad visual al UI-SPEC necesita una revisión humana o la UI review de la fase"

duration: 10min
completed: 2026-11-21
status: complete
---

# Phase 12 Plan 01: «Elige una» — choice en el timeline y borrador de Campania Summary

**Fila `choice` estricta en el timeline (zod strictObject, 2–3 opciones, un solo nivel) pintada por TimelineChoice.vue como alternativas apiladas con «Elige una» y «— o bien —», probada de punta a punta en el jueves 24 del nuevo borrador de Campania, con Roma idéntica (D-18 + 110 tests de paridad).**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-11-21T10:00:54Z
- **Completed:** 2026-11-21T10:10:37Z
- **Tasks:** 2 (1 tracer + 1 auto/tdd)
- **Files modified:** 14

## Accomplishments

- D-18 primero: un test carga los YAML reales de Roma, los valida, comprueba que no usan `stays`/`stay`/`route`/`family` ni filas `choice`, y que el JSON-Schema del día deja `timeline` como array plano. Verde antes y después de tocar el esquema.
- Esquema: las 5 filas pasan sin cambios a constantes (`StopRow`…`ReservationRow`, `BASE_ROWS`); nuevos `BaseTimelineRow`, `ChoiceOption` y `ChoiceRow` (estrictos); `TimelineRow` con 6 kinds; tipos `BaseTimelineRow` y `ChoiceRow` exportados.
- `TimelineChoice.vue` sigue el contrato de DOM de UI-SPEC: sin section, h* ni id, y sin estilos con scope ni HTML crudo. `Timeline.vue` solo gana `choice: resolveComponent('TimelineChoice')`.
- `tripshapes.css` con la cabecera y el bloque EXT-01 de UI-SPEC copiados tal cual, como última entrada de `css[]`.
- Esqueleto borrador de Campania: trip.yml (chrome completo, centinela), jueves 24 (`order: 1`, choice A/B sin `ref` interiores) y tres fichas de Salerno con heros en example.invalid.
- `tests/trips/campania.spec.ts`: dos E2E en dev, con el resultado esperado derivado del YAML.

## Task Commits

1. **Task 1 (tracer): «Elige una» del YAML al navegador**
   - `97dd36f` test(12-01): D-18 Roma valida sin cambios antes de ampliar el esquema
   - `a59ba31` feat(12-01): esquema choice, borrador de Campania, TimelineChoice, tripshapes.css, E2E
2. **Task 2 (tdd): el esquema rechaza un choice mal formado + puerta de la ola**
   - `711c4c1` test(12-01): dientes del choice en el esquema (D-01, D-03)

**Plan metadata:** commit docs(12-01) siguiente.

## Files Created/Modified

- `shared/schemas.ts`: filas base con nombre, `BaseTimelineRow`, `ChoiceOption`, `ChoiceRow`, `TimelineRow` con choice.
- `app/components/TimelineChoice.vue`: bloque de alternativas (nuevo).
- `app/components/Timeline.vue`: entrada `choice` en `COMPONENT_BY_KIND` y comentarios a 6 kinds.
- `app/assets/css/tripshapes.css`: bloque EXT-01 (nuevo).
- `nuxt.config.ts`: `tripshapes.css` al final de `css[]` y comentario D-17.
- `content/trips/campania/**`: trip.yml, days/jueves-24.yml y tres fichas (nuevos).
- `tests/data/schema.spec.ts`: describe D-18 y describe «choice (D-01, D-03)», con 13 casos.
- `tests/unit/tripManifest.spec.ts`: manifiesto real con campania y su `draftExcludes`.
- `tests/unit/multitripCss.spec.ts`: orden de `css[]` con tripshapes.css al final.
- `tests/trips/campania.spec.ts`: E2E del jueves 24 y de la portada de dev (nuevo).

## Verification

- `vitest run tests/data tests/unit`: 805 passed.
- `nuxi typecheck`: 0 errores. `eslint` sobre los 8 ficheros del plan: 0 problemas.
- `pnpm verify`: exit 0. 303 unit + 502 data + **110 parity passed**, sin `--update-snapshots`.
- `rm -rf .data .nuxt && pnpm test:trips`: **22 passed**, incluidos «trampa: campania no muestra ningún texto de Roma» y los 2 tests `campania:`.
- Congelados: `git diff --exit-code d0c0ed2 -- content/trips/{roma,prueba,forma} app/assets/css/{base,tokens,fonts,leaflet,multitrip}.css tests/parity package.json pnpm-lock.yaml` sin diff.
- `.output/public/trips/` solo contiene `roma`. El CSS de entrada contiene `.tl-choice`.

## Decisions Made

- **A1 / Pitfall 12:** quedó la importación circular directa: `Timeline` resuelve `TimelineChoice` con `resolveComponent` y `TimelineChoice` pinta `<Timeline>` por auto-import. Rinde en SSR de dev y pasa el typecheck, así que **no** hizo falta el respaldo `defineAsyncComponent`.
- En TimelineChoice, `inlineMdToPlain` llega por auto-import, como en TripView.vue, y no por un import explícito.
- `eslint --fix` dejó saltos de línea en el contenido de los div de TimelineChoice. El fichero nuevo no tiene una exención de paridad de espacios como los componentes verbatim. Vue condensa esos espacios, y las aserciones usan `trim`/`toHaveText`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Selector de marcadores del E2E**
- **Found during:** Task 1 (paso 8, E2E en dev)
- **Issue:** El plan pedía contar `#leaflet-map .custom-marker`, pero daba 0 en todos los viajes, Roma incluida (39 `.leaflet-marker-icon` presentes). En el DOM montado ya no hay ningún elemento con `id="leaflet-map"`. Los specs de paridad cuentan `.custom-marker` sin ese prefijo.
- **Fix:** se cuenta `section[id="mapa"] .custom-marker`. Un comentario en el spec explica el motivo.
- **Files modified:** tests/trips/campania.spec.ts
- **Verification:** el E2E pasa con 3 marcadores, uno con el numeral VII de raito.
- **Committed in:** a59ba31

**2. [Rule 1 - Bug] Palabra de la trampa en un comentario y centinela duplicado**
- **Found during:** Task 1 (criterios de aceptación)
- **Issue:** el comentario de cabecera de trip.yml contenía «Roma», así que el grep de la trampa daba 1. También repetía el literal `CAMPANIA-CENTINELA-12A`, así que el criterio `== 1` daba 2.
- **Fix:** se reescribió el comentario sin esas palabras. El literal del centinela solo aparece en howTo.
- **Files modified:** content/trips/campania/trip.yml
- **Committed in:** a59ba31

---

**Total deviations:** 2 auto-fixed (2 Rule 1). **Impact:** ninguno en el alcance; los dos solo corrigen tests o texto para que los criterios del plan se cumplan.

## TDD Gate Compliance

La Task 2 (`tdd="true"`) se escribió después de la Task 1, que era tracer y ya traía el esquema. Por eso sus tests pasaron en verde nada más escribirse, como preveía el plan («Con el esquema de la Task 1 deberían pasar; si alguno falla, se corrige el esquema, nunca el test»). Para comprobar que los tests detectan fallos, se hizo una **prueba de mutación** sin commit: con `ChoiceOption`/`ChoiceRow` como `z.object`, sin `.min(2).max(3)` y con `rows: z.array(z.any())`, fallaron 7 de los 13 casos (defaults, 1/4 opciones, rows vacío, anidado, `pace`, `cards`). Después se restauró el esquema y se volvió a 502/502. El test D-18 (`97dd36f`) sí precedió al cambio de esquema (`a59ba31`). No hay commit `feat` posterior al `test` de la Task 2 porque no hacía falta cambiar código.

## Issues Encountered

- `#leaflet-map` no se conserva en el DOM montado. Pasa en dev en todos los viajes y viene de antes de esta fase. Solo afecta a selectores de tests y no se ha investigado, porque queda fuera del alcance (ver desviación 1).

## Known Stubs

Ninguno que bloquee el objetivo. El esqueleto de Campania es provisional a propósito (D-15): la Fase 13 reescribe el contenido. Las paradas de dentro de las opciones no llevan `ref` hasta 12-02, que añade la regla `ref` recursiva (Pitfall 3).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 12-02 puede añadir `ref: raito` en la opción A junto con la regla `ref` recursiva, el segundo choice, los otros 4 días (jueves-24 pasa a `order: 4`) y el guardián de lista blanca de tripshapes.css.
- `.output/public` no contiene ninguna ruta de campania. El escaneo de los dumps decodificados con el centinela queda para 12-02 (build-isolation.spec.ts).

## Self-Check: PASSED

- 14/14 ficheros de key-files presentes.
- Commits 97dd36f, a59ba31 y 711c4c1 son ancestros de HEAD; `git rev-list --count 0af8a7f..HEAD` = 3.
- Todos los criterios de aceptación de las Tasks 1 y 2 en PASS.

---
*Phase: 12-formas-nuevas-de-viaje*
*Completed: 2026-11-21*
