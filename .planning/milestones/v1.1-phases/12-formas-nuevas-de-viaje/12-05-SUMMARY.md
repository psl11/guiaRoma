---
phase: 12-formas-nuevas-de-viaje
plan: 05
subsystem: data-schema + timeline CSS (tripshapes.css) + Campania content
tags: [zod, css, color-mix, nuxt-content, campania, transport, vitest, playwright]
status: complete

requires:
  - phase: 12-04
    provides: "PlaceType `nature`, Motif `sea`, SVG_MOTIFS y MARKER_STYLE (los recorre enumStyles.spec), E2E data-derivado «cada lugar de naturaleza»"
  - phase: 12-03
    provides: "stays de Campania (napoles, procida) y el E2E data-derivado «cada día dice dónde se duerme»"
  - phase: 12-02
    provides: "cssSelectors/NEW_CLASSES (ferry, car, bus, bike, plane ya en la lista cerrada), días vacíos del esqueleto"
provides:
  - "TransportVariant (taxi, walk, train, ferry, car, bus, bike, plane) y StatVariant (walk, train, taxi, metro, ticket, ferry, car, bus, bike, plane) como enums con nombre en shared/schemas.ts"
  - "Bloque EXT-03 de 12-UI-SPEC copiado tal cual a tripshapes.css: bandas, glifo de cabecera y glifo de stats de las 5 variantes nuevas; sin regla de tren"
  - "tests/unit/enumStyles.spec.ts: cada valor de TransportVariant/StatVariant/Motif/PlaceType tiene regla, glifo, SVG o marcador; PARITY_EXEMPT_TRANSPORT = ['train']"
  - "Campania: tramos plane+bus contiguos y un tramo sin variante (sábado 19), ferry+bike (domingo 20), car (viernes 25); los cinco días con stay"
  - "Fichas spaccanapoli, marina-corricella y pozzo-vecchio (nature/sea)"
affects: [12-06, 12-07, 13]

actuals:
  tokens: 8658
  tasks: 2
  commits: 3
plan_head_before: 078d6bb7ad52470db4f16601e67d1e1c74fcd079
plan_head_after: 76247599fc93cd254745dc891499770ecc8efda8

tech-stack:
  added: []
  patterns:
    - "Enum → estilo: el test recorre `Variant.options` contra los selectores reales de los CSS. Un valor nuevo sin regla pone el test en rojo, y la única exención está fijada a ['train']"
    - "Colores calculados en E2E: `color(srgb …)` y `rgb(…)` se pasan a 0-255 y se comparan con una tolerancia de ±2"

key-files:
  created:
    - tests/unit/enumStyles.spec.ts
    - content/trips/campania/monuments/spaccanapoli.yml
    - content/trips/campania/monuments/marina-corricella.yml
    - content/trips/campania/monuments/pozzo-vecchio.yml
    - .planning/phases/12-formas-nuevas-de-viaje/tdd/12-05-T2-red.json
    - .planning/phases/12-formas-nuevas-de-viaje/tdd/12-05-T2-red-junit.xml
  modified:
    - shared/schemas.ts
    - app/assets/css/tripshapes.css
    - content/trips/campania/days/sabado-19.yml
    - content/trips/campania/days/domingo-20.yml
    - content/trips/campania/days/viernes-25.yml
    - tests/trips/campania.spec.ts

key-decisions:
  - "TransportVariant y StatVariant se declaran junto a Pace/PlaceType, con comentario sobre la exención del tren (Pitfall 1). TransportRow.variant pasa a TransportVariant.optional() y stats[].variant a StatVariant"
  - "El bloque EXT-03 se insertó tal cual, entre la cabecera y EXT-02 (diff contra 12-UI-SPEC vacío). TimelineTransport.vue y DaySection.vue no cambian"
  - "Evidencia RED de la Task 2 con el JUnit de Playwright («los cinco tramos nuevos», data-derivado), porque enumStyles.spec ya pasaba tras el tracer; sus dientes se comprobaron por mutación"
  - "El tema del backstop se fija con localStorage['roma-theme'] en addInitScript para los dos temas (light y dark), no solo para el oscuro, para que no dependa de prefers-color-scheme"

requirements-completed: [EXT-03]

duration: 11min
completed: 2026-11-21
---

# Phase 12 Plan 05: Tramos en ferry, coche, autobús, bici y avión Summary

**Los cinco transportes nuevos tienen cada uno su banda `color-mix` y su glifo, en la cabecera del tramo y en la banda de stats. Se añadieron con dos enums con nombre y el bloque EXT-03 de tripshapes.css, sin tocar componentes. Un test enum → CSS hace fallar `pnpm verify` si un valor queda sin estilo. El tren de Roma sigue sin regla.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-11-21T10:57:30Z
- **Completed:** 2026-11-21T11:08:48Z
- **Tasks:** 2
- **Files modified:** 12 (incluidos 2 ficheros de evidencia RED)

## Accomplishments

- **Enums.** `TransportVariant` y `StatVariant` están en shared/schemas.ts. Los valores de Roma no cambian y Roma valida igual (tests/data 545/545).
- **CSS.** tripshapes.css tiene el bloque EXT-03 copiado de 12-UI-SPEC. Cada variante nueva (ferry, car, bus, bike, plane) tiene su banda (fondo al 10 %, al 8 % en plane, y borde `TONO 75% + --ink`) y sus glifos ⛴️ 🚗 🚌 🚲 ✈️. No hay selector `[data-theme]` ni regla `.tl-transport.train`.
- **Test enum → estilo.** `tests/unit/enumStyles.spec.ts` tiene 52 casos:
  - cada valor de `TransportVariant.options` salvo `train` tiene su regla `.tl-transport.<v>`;
  - las cinco variantes nuevas tienen glifo de cabecera;
  - cada valor de `StatVariant.options` tiene su glifo `::before`;
  - ningún CSS tiene un selector `.tl-transport.train`;
  - cada `Motif` tiene SVG y cada `PlaceType` tiene `MARKER_STYLE`.
- **Campania:**
  - **Sábado 19:** avión y autobús contiguos, un tramo sin variante y la parada «Primer paseo por el centro».
  - **Domingo 20:** Spaccanapoli, ferry Caremar a Procida, bici, Pozzo Vecchio y Marina Corricella.
  - **Viernes 25:** coche por la A3.
  - Los cinco días tienen su `stay` (ROADMAP SC#2 completo).
- **E2E.** Hay cuatro tests nuevos en `campania:`:
  - el ferry y la bici del domingo 20;
  - los cinco tramos (derivado del YAML);
  - un tramo sin variante + avión/autobús contiguos;
  - el backstop de tema, que en claro y oscuro da los bordes de UI-SPEC con ±2.

## Task Commits

1. **Task 1 (tracer): ferry y bici del domingo 20.** `d5da07e` (feat). Gate del tracer en auto: el `<verify>` se volvió a ejecutar de punta a punta (vitest 989/989, typecheck 0, eslint ok, campania 14/14), así que se pasó a la expansión.
2. **Task 2 (TDD): los cinco tramos, el test enum → estilo y la puerta de la ola.**
   - RED: `f6c278c` (test)
   - GREEN: `7624759` (feat)
   - No hubo REFACTOR: no había nada que limpiar.

## Files Created/Modified

- `shared/schemas.ts`: `TransportVariant`, `StatVariant`; `TransportRow.variant` y `stats[].variant` los usan.
- `app/assets/css/tripshapes.css`: bloque EXT-03 (bandas, glifos de cabecera y de stats).
- `tests/unit/enumStyles.spec.ts` (nuevo): enum → CSS/SVG/marcador, con `PARITY_EXEMPT_TRANSPORT = ['train']`.
- `tests/trips/campania.spec.ts`: helpers `toRgb`/`sameRgb`/`borderLeftRgb`/`beforeContent`/`newThemedPage` y 4 tests EXT-03.
- `content/trips/campania/days/{sabado-19,domingo-20,viernes-25}.yml`: tramos, stats y `stay`.
- `content/trips/campania/monuments/{spaccanapoli,marina-corricella,pozzo-vecchio}.yml` (nuevos).

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

- **Task 1** es `type="tracer"`, no TDD.
- **Task 2:**
  - **RED (`f6c278c`):** el target fue el E2E «campania: los cinco tramos nuevos tienen banda y glifo propios (EXT-03, D-09)». Falló en la aserción `las 5 variantes nuevas en tramos de Campania`: esperaba [bike, bus, car, ferry, plane] y recibió [bike, ferry], porque el sábado 19 y el viernes 25 aún no tenían filas.
  - **Evidencia:** `tdd/12-05-T2-red.json` (JUnit de Playwright). El clasificador devolvió `RED_EVIDENCE_OK target_test_failed`.
  - **Valoración semántica:** el target se ejecutó y falló en su aserción planificada. No hubo errores de carga, de servidor ni de sintaxis.
  - **enumStyles.spec en verde desde el principio:** el plan lo preveía, porque el CSS y los enums llegaron con el tracer. Dos mutaciones temporales de tripshapes.css lo pusieron en rojo (2 fallos), y se revirtieron después:
    - añadir `.tl-transport.train { … }`;
    - quitar `.day-stats-item.bus::before`.
  - **GREEN (`7624759`):** campania 17/17. `pnpm verify` y `pnpm test:trips` en verde (ver abajo).

## Issues Encountered

- **`pnpm verify`:** unit 497/497 (445 + 52 de enumStyles) y data 545/545.
  - **Parity:** 109 passed y 1 failed. El fallo fue el flaky conocido `navigation.spec.ts` «SC#2 scrollspy» [mobile], por timeout de 30 s y como único fallo.
  - **Repetición:** se volvió a ejecutar `test:parity`. Un filtro de spec mal formado hizo que corriera la suite completa de la puerta sobre la misma build: 110 passed, 0 failed (2 skipped, los de `--grep-invert`), scrollspy incluido. No se actualizó ningún snapshot.
- **`rm -rf .data .nuxt && pnpm test:trips`:** 37/37.
- **Congelados:** sin diff respecto a `d0c0ed2` en roma/prueba/forma, base/tokens/fonts/leaflet/multitrip.css, tests/parity, package.json y pnpm-lock.yaml.

## Known Stubs

Ninguno que impida el objetivo. Los textos de las fichas y de los días son el esqueleto provisional de D-15, y las heros apuntan a `example.invalid`: la Fase 13 los reescribe. El viernes 25 solo tiene el tramo en coche; sus paradas y fichas llegan en 12-06, como dice el plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 12-06 tiene ya el tramo `ferry` del domingo 20 (ruta oculta) y el `car` del viernes 25 (base de `route.mode: driving`).
- **Revisión humana en /gsd-verify-work 12:** legibilidad de los cinco tonos y glifos en claro y oscuro (supuesto marcado del plan), y el dibujo `sea` de Pozzo Vecchio, que ahora ya se ve en dev.

## Self-Check: PASSED

- Ficheros creados presentes: enumStyles.spec.ts, spaccanapoli.yml, marina-corricella.yml, pozzo-vecchio.yml, 12-05-T2-red.json, 12-05-T2-red-junit.xml.
- Commits en HEAD: d5da07e, f6c278c, 7624759 (`git rev-list --count 078d6bb..HEAD` = 3).
- Criterios de aceptación de las Tasks 1 y 2 en verde:
  - TV=1, SV=1, OPT=1, FERRY=1, PLANE=1, TRAIN=0, VF≥1, STAY=1;
  - PE=5, TVO=3, SVO=1, V5=5, NAT=1, STAYS=5, BT=1;
  - TimelineTransport.vue y base.css sin diff;
  - `pnpm verify` en verde (con la repetición del flaky documentada).
