---
phase: 12-formas-nuevas-de-viaje
plan: 06
subsystem: data-schema + ruta del día (dayRoute/timelineRows/DaySection) + Campania content
tags: [zod, google-maps, nuxt-content, campania, route, vitest, playwright]
status: complete

requires:
  - phase: 12-05
    provides: "tramo `ferry` del domingo 20 (ruta oculta) y tramo `car` del viernes 25 (base de route.mode driving); TransportVariant"
  - phase: 12-01
    provides: "ChoiceRow/ChoiceOption/BaseTimelineRow y el choice A/B del jueves 24 (raito / valle-del-calore solo dentro de opciones)"
provides:
  - "RouteMode (walking, driving, transit) y DaySchema.route = z.strictObject({ mode?, enabled? }).optional()"
  - "app/utils/timelineRows.ts: flattenRows, optionOnlyRefs, hasTransportVariant (puros, auto-importados, Vitest plano)"
  - "app/utils/dayRoute.ts: buildDirUrl(points, mode?) con walking por defecto (null/undefined = walking), routeCards, routeVisible, routeTitle"
  - "DaySection: botón «Ver ruta del día» por modo y con visibilidad (ferry, enabled, < 2 paradas)"
  - "Campania viernes 25: día de coche (`route.mode: driving`) con las fichas vesubio (X) y rione-sanita (XI)"
affects: [12-07, 13]

actuals:
  tokens: 9527
  tasks: 2
  commits: 2
plan_head_before: 4df7924d57b9fda9bd937df0f76cddcf4c06b0dd
plan_head_after: a5615b84281ed8551d2178aad49d8aef90107790

tech-stack:
  added: []
  patterns:
    - "Fila-aplanado: los helpers de timeline miran dentro de las opciones de un `choice` con `flattenRows`, así un ferry o una ref dentro de una opción cuentan igual que en el nivel superior"
    - "Roma byte a byte frente a una plantilla escrita a mano en el test, no frente al propio util"

key-files:
  created:
    - app/utils/timelineRows.ts
    - content/trips/campania/monuments/vesubio.yml
    - content/trips/campania/monuments/rione-sanita.yml
    - tests/unit/timelineRows.spec.ts
  modified:
    - shared/schemas.ts
    - app/utils/dayRoute.ts
    - app/components/DaySection.vue
    - content/trips/campania/days/viernes-25.yml
    - tests/trips/campania.spec.ts
    - tests/unit/dayRoute.spec.ts
    - tests/data/schema.spec.ts

key-decisions:
  - "D-14: el modo de la ruta va por día en `DaySchema.route` (estricto: `modo:` falla con Unrecognized key); sin `route` (o `null` desde Nuxt Content) el modo es walking y la URL de Roma es byte a byte la de hoy"
  - "Precedencia de routeVisible: < 2 paradas nunca (también con enabled: true, Pitfall 11) → enabled: false oculta → enabled: true fuerza → sin enabled, un ferry en el día (también dentro de una opción) oculta"
  - "routeVisible acepta `route` null además de undefined (Nuxt Content entrega null para campos ausentes); el contrato de tipos es compatible con Pick<Day, 'timeline' | 'route'>"
  - "dayRoute.spec.ts solo recibe añadidos: las funciones nuevas se importan con `import * as dayRoute` en una línea nueva para no reescribir el import existente (criterio sin líneas «-»)"
  - "Task 2 (tdd) sin RED real: el comportamiento lo entrega el tracer (Task 1) por diseño del plan; los dientes se comprobaron con 7 mutaciones temporales, todas en rojo y revertidas"

requirements-completed: [EXT-06]

coverage:
  - deliverable: "Ruta del día por modo (driving/transit) con walking por defecto byte a byte para Roma"
    human_judgment: false
    verification:
      - kind: unit
        ref: "tests/unit/dayRoute.spec.ts#ruta del día — Roma byte a byte con route/routeCards (D-14)"
        status: pass
      - kind: unit
        ref: "tests/unit/dayRoute.spec.ts#ruta del día — modos (D-14)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: el viernes 25 abre la ruta del día en coche (EXT-06, D-14)"
        status: pass
      - kind: e2e
        ref: "pnpm verify (tests/parity search-route.spec, 110 passed)"
        status: pass
  - deliverable: "Ruta oculta en días de ferry y forzado/ocultación con route.enabled"
    human_judgment: false
    verification:
      - kind: unit
        ref: "tests/unit/dayRoute.spec.ts#ruta del día — precedencia de visibilidad (D-04, D-14, Pitfall 11)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: el domingo 20, día de ferry, no ofrece ruta (EXT-06, D-14)"
        status: pass
  - deliverable: "La ruta excluye las fichas de solo-opción (nunca mezcla A y B)"
    human_judgment: false
    verification:
      - kind: unit
        ref: "tests/unit/timelineRows.spec.ts#timelineRows — Campania real (D-04, D-14)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: la ruta del jueves 24 cuenta solo las paradas comunes (EXT-06, D-04)"
        status: pass
  - deliverable: "Esquema de route estricto"
    human_judgment: false
    verification:
      - kind: unit
        ref: "tests/data/schema.spec.ts#route (D-14)"
        status: pass
  - deliverable: "Google Maps abre de verdad el recorrido en coche con las paradas del viernes 25"
    human_judgment: true
    rationale: "Los tests fijan la URL; que Google Maps la interprete bien (y el supuesto A4 de transit sin waypoints) solo se ve abriéndola"

duration: 8min
completed: 2026-11-21
---

# Phase 12 Plan 06: Ruta del día por modo, sin ferry y sin mezclar opciones Summary

**«Ver ruta del día» abre Google Maps en el modo del día (`day.route.mode`: a pie, en coche o en transporte público), desaparece en los días de ferry salvo que `route.enabled: true` lo fuerce, y no cuenta las fichas que solo están dentro de una opción. En Roma la URL, el título y el texto de sus cinco botones son byte a byte los de antes.**

## Performance

- **Duration:** ~8 min (más las puertas `pnpm verify` y `pnpm test:trips`)
- **Started:** 2026-11-21T11:14:12Z
- **Completed:** 2026-11-21T11:22:42Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- **Esquema (D-14).** `RouteMode = z.enum(['walking', 'driving', 'transit'])` y `DaySchema.route = z.strictObject({ mode: RouteMode.optional(), enabled: z.boolean().optional() }).optional()`. Roma no lo usa y valida igual (test D-18).
- **`app/utils/timelineRows.ts` (nuevo).** `flattenRows` (filas comunes + filas de cada opción, en orden), `optionOnlyRefs` (refs que solo aparecen dentro de opciones) y `hasTransportVariant`.
- **`app/utils/dayRoute.ts`.**
  - `buildDirUrl(points, mode?)`: `travelmode=` + (`mode ?? 'walking'`).
  - `routeCards(day)`: `day.cards` menos las fichas de solo-opción.
  - `routeVisible(day, n)`: < 2 → no; `enabled: false` → no; `enabled: true` → sí; si no, un ferry oculta.
  - `routeTitle(mode)`: los tres textos de 12-UI-SPEC.
  - `MAX_ROUTE_STOPS`, `pointFor`, `capStops` y `routeLabel` no cambian.
- **DaySection.** Puntos desde `routeCards(day)`, `v-if="routeVisible(day, points.length)"`, `href` por modo y `:title="routeTitle(day.route?.mode)"`. El texto, el glifo, `target="_blank"` y `rel="noopener"` no cambian. No hay CSS nuevo.
- **Campania.** El viernes 25 tiene `route: { mode: driving }`, el tramo `car` de 12-05 y dos paradas con ficha: Viñedos del Vesubio (X, `garden`) y Rione Sanità (XI, `church`).
- **E2E (3 nuevos).** Viernes 25 en coche (href `…travelmode=driving`, título «… en coche», 2 puntos, `routeLabel(2)`). Domingo 20 sin botón (con anti-vacuidad: ≥ 2 fichas y un ferry en el YAML). Jueves 24 con «Ver ruta del día (2 paradas)», con N calculado en el test desde el YAML y 2 puntos en el href.

## Task Commits

1. **Task 1 (tracer): el viernes 25 en coche y el domingo 20 sin ruta.** `9d413b6` (feat). Gate del tracer en auto: el `<verify>` se volvió a ejecutar entero (vitest 1046/1046, typecheck 0, eslint ok, campania 20/20), así que se pasó a la expansión.
2. **Task 2 (TDD): Roma byte a byte, modos, precedencia y esquema.** `a5615b8` (test). No hubo commit GREEN ni REFACTOR: el comportamiento ya estaba en el tracer.

## Files Created/Modified

- `shared/schemas.ts`: `RouteMode`, `DaySchema.route`, tipo `RouteMode`.
- `app/utils/timelineRows.ts` (nuevo): helpers puros sobre filas con `choice`.
- `app/utils/dayRoute.ts`: modo, `routeCards`, `routeVisible`, `routeTitle`; JSDoc de la Fase 12.
- `app/components/DaySection.vue`: botón por modo y visibilidad; cabecera JSDoc ampliada.
- `content/trips/campania/days/viernes-25.yml`: `route`, dos paradas y `cards`.
- `content/trips/campania/monuments/{vesubio,rione-sanita}.yml` (nuevos).
- `tests/trips/campania.spec.ts`: helpers `hrefPointCount`/`sharedCards` y 3 tests EXT-06.
- `tests/unit/timelineRows.spec.ts` (nuevo), `tests/unit/dayRoute.spec.ts` (solo añadidos), `tests/data/schema.spec.ts` (`describe('route (D-14)')`).

## Decisions Made

Ver `key-decisions` en el frontmatter.

## Deviations from Plan

**1. [Rule 1 - Bug] Comentarios que rompían dos criterios grep**
- **Found during:** Task 1
- **Issue:** La cabecera JSDoc nueva de DaySection citaba literalmente `routeVisible(day, points.length)` y `rel="noopener"`. El primer criterio quedaba en 2 en vez de 1. El segundo dejaba sin efecto la guardia de mutación de `rel="noopener"`, porque al quitarlo del botón el comentario seguía contando.
- **Fix:** Se reformuló el comentario sin esas cadenas literales. Ahora salen RV=1 y NO=1.
- **Files modified:** app/components/DaySection.vue
- **Commit:** 9d413b6 (antes del commit)

**Total deviations:** 1 auto-fixed (Rule 1). **Impact:** solo comentarios; ningún cambio de comportamiento.

## TDD Gate Compliance

- **Task 1** es `type="tracer"`, no TDD.
- **Task 2 (`tdd="true"`):** no hubo RED válido, y fue por diseño del plan. La Task 1 (tracer) entrega `routeCards`/`routeVisible`/`routeTitle`/`buildDirUrl(…, mode)` y el esquema, y la Task 2 solo añade tests. A diferencia de 12-05, no quedaba contenido ni código pendiente con el que hacer fallar un target. No se generó evidencia RED artificial.
  - **Tests en verde desde el principio:** 345/345 en los tres specs.
  - **Dientes comprobados por mutación.** Se aplicaron siete mutaciones temporales, cada una revertida con `git checkout -- <file>`. Todas pusieron tests en rojo:
    - M1: modo por defecto `driving` → 11 fallos (Roma byte a byte, modos, títulos).
    - M2: sin ocultación por ferry → 2 fallos.
    - M3: `optionOnlyRefs` sin restar las refs comunes → 3 fallos.
    - M4: `enabled: true` evaluado antes de `< 2` → 1 fallo (Pitfall 11).
    - M5: `route` con `z.object` en vez de `z.strictObject` → 2 fallos.
    - M6: `flattenRows` ignora las opciones → 4 fallos.
    - M7: título walking alterado → 6 fallos.

## Issues Encountered

- **`pnpm verify`:** unit 537/537, data 557/557 y parity 110 passed. Ningún flaky y ninguna actualización de snapshots. `search-route.spec` de paridad sigue verde con los botones de Roma.
- **`rm -rf .data .nuxt && pnpm test:trips`:** 40/40.
- **Congelados:** sin diff respecto a `d0c0ed2` en `content/trips/{roma,prueba,forma}`, `base/tokens/fonts/leaflet/multitrip.css`, `tests/parity`, `package.json` y `pnpm-lock.yaml`. `git status` limpio en esas rutas.

## Known Stubs

Ninguno que impida el objetivo. Los textos de las dos fichas nuevas y de las paradas del viernes 25 son el esqueleto provisional de D-15, y las heros apuntan a `example.invalid`: la Fase 13 los reescribe.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 12-07 (nota familiar «Con niños»).
- **Revisión humana en /gsd-verify-work 12:**
  - abrir el enlace del viernes 25 en Google Maps (recorrido en coche con 2 paradas);
  - el supuesto marcado A4: `transit` puede ignorar los waypoints. Ningún día del esqueleto usa `transit`.

## Self-Check: PASSED

- Ficheros creados presentes: timelineRows.ts, vesubio.yml, rione-sanita.yml, timelineRows.spec.ts.
- Commits en HEAD: 9d413b6, a5615b8 (`git rev-list --count 4df7924..HEAD` = 2).
- Criterios de aceptación:
  - **Task 1:** RM=1, RS=1, TR=3, DR=3, IMP=1, TITLE0=0, PL=0, RV=1, NO=1, MD=1.
  - **Task 2:** RBB=2, RV=10, OOR=13, RD=1, y `dayRoute.spec.ts` sin líneas «-» respecto a d0c0ed2.
  - `pnpm verify` exit 0.
