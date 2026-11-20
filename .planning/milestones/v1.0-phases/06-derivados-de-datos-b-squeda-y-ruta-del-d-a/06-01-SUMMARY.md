---
phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a
plan: 01
subsystem: testing
tags: [google-maps, day-route, pure-util, vitest, feat-09, parity]

# Dependency graph
requires:
  - phase: 02-datos
    provides: "MonumentSchema con coords no-opcional + day.cards: string[] ordenado (DATA-03), 38 monumentos en content/trips/roma/monuments/*.yml"
  - phase: 04-render-modos
    provides: "DaySection.vue resuelve day.cards[]→monById→MonumentCard en orden del dato (el mismo encadenado que alimenta la ruta)"
provides:
  - "app/utils/dayRoute.ts — pointFor / capStops / buildDirUrl / routeLabel + MAX_ROUTE_STOPS, port verbatim de index.html:6582-6643 (mitad de lógica pura de FEAT-09)"
  - "Cobertura unitaria que blinda SC#4 (URL por día), Pitfall 2 (sábado=8 sin filtro de tipo) y Pitfall 3 (muestreo capStops literal)"
affects: [06-02-busqueda, 06-03-cableado-ruta-del-dia, DaySection, FEAT-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Util pura auto-importada en app/utils/ (precedente F4/F5: pace.ts, cardNav.ts, foodGroups.ts) — import de tipos solamente desde ~~/shared/schemas, sin Nuxt/Vue/DOM"
    - "Derivar la ruta del DATO tipado (day.cards→monById→pointFor) en vez de escanear el DOM (a.maps-link), preservando salida byte-idéntica"

key-files:
  created:
    - app/utils/dayRoute.ts
    - tests/unit/dayRoute.spec.ts
  modified: []

key-decisions:
  - "Ruta = TODAS las day.cards SIN filtro por type (Pitfall 2): el original escanea a.maps-link en DOM, vaticano(★)+auditorium(♪) lo llevan → sábado=8 paradas. Un filtro type!=='card' rompería SC#4. El critical_override del plan prevalece sobre la prosa stale de SC#3/CONTEXT D-02/D-03"
  - "pointFor devuelve `${coords.lat},${coords.lng}`, nunca mapsQuery (Pitfall 4): coords es no-opcional en el esquema, así que la rama de respaldo ?query= del original era código muerto y se omite"
  - "capStops portado verbatim con Math.round((i*(middle.length-1))/(slots-1)) (Pitfall 3): no Math.floor, no 'arreglar' el off-by-one; con datos reales (máx 10 paradas) es paso a través pero se prueba con fixture sintético >10"
  - "El spec corre en Vitest PLANO (import relativo ../../app/utils/dayRoute, sin @nuxt/test-utils) y carga los fixtures content/trips/roma/...yml con node:fs+yaml, igual que invariants.spec.ts — sin runtime Nuxt"

patterns-established:
  - "Test de paridad de URL por día: para cada día, day.cards→monById→filter→pointFor→capStops→buildDirUrl y asertar prefijo de URL + recuento exacto de paradas + waypoints=(paradas-2)"
  - "Guard de regresión de Pitfall: asertar que las coords concretas de las fichas que un filtro erróneo descartaría (vaticano/auditorium) ESTÁN entre las paradas"

requirements-completed: [FEAT-09]

# Metrics
duration: 2min
completed: 2026-06-21
---

# Phase 06 Plan 01: Ruta del día (lógica pura) Summary

**Port verbatim de la "ruta del día" (FEAT-09) a `app/utils/dayRoute.ts` — pointFor/capStops/buildDirUrl/routeLabel derivados de `day.cards` (no del DOM), con salida de URL de Google Maps byte-idéntica al `index.html`, blindado por un spec de paridad por día + guards de Pitfall 2/3.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-21T13:39:20Z
- **Completed:** 2026-06-21T13:42:02Z
- **Tasks:** 2
- **Files modified:** 2 (ambos creados)

## Accomplishments
- `app/utils/dayRoute.ts`: 4 funciones puras + `MAX_ROUTE_STOPS` portadas 1:1 de `index.html:6582-6643`, sin acoplamiento a Nuxt/Vue/DOM, con doc-comment que marca los tres invariantes load-bearing (sin filtro de tipo / coords-first / muestreo literal).
- `tests/unit/dayRoute.spec.ts`: 12 casos en Vitest plano cargando los YAML reales — paridad de URL para los 5 días (SC#4), guard de Pitfall 2 (sábado=8 con vaticano+auditorium), Pitfall 3 (capStops sintético 12→10 con índices `[0,1,3,4,5,6,8,9]`) y el ternario de `routeLabel`.
- `pnpm typecheck`, `pnpm lint` y `pnpm test:unit` (55 tests, 6 ficheros) en verde.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1: Port pointFor/capStops/buildDirUrl/routeLabel into app/utils/dayRoute.ts (verbatim)** — `b75024f` (feat)
2. **Task 2: Write tests/unit/dayRoute.spec.ts — per-day URL parity (SC#4) + Pitfall-2/3 guards** — `5022dc5` (test)

**Plan metadata:** _(este commit)_ (docs: complete plan)

_Nota: la tarea 1 era `tdd="true"`; el ciclo RED/GREEN se reparte entre los dos planes/tareas (precedente F5 cardNav.ts→cardNavigation.spec.ts) — la verify de la tarea 1 es typecheck+lint (sin runner), la tarea 2 aporta el spec que corre bajo `pnpm test:unit`._

## Files Created/Modified
- `app/utils/dayRoute.ts` — Lógica pura de la ruta del día: `pointFor` (coords→`"lat,lng"`), `capStops` (muestreo a 10 paradas máx), `buildDirUrl` (URL de direcciones a pie de Google Maps), `routeLabel` (etiqueta del botón) + `MAX_ROUTE_STOPS = 10`.
- `tests/unit/dayRoute.spec.ts` — Spec de paridad: URL por día para los 5 días, guard de sábado=8 (incl. guiada+concierto), muestreo `capStops` sintético >10 y ternario de `routeLabel`.

## Decisions Made
- **Sin filtro por `type` (Pitfall 2).** El `critical_override` del plan es vinculante: el `buildDayRoutes` original escanea `a.maps-link` en orden de DOM y TODAS las 38 fichas lo llevan, incluidas `vaticano` (guided) y `auditorium` (concert). El sábado tiene por tanto 8 paradas. La prosa de SC#3 / CONTEXT D-02/D-03 ("monumentos solo, excluir guiado/concierto") es FACTUALMENTE incorrecta sobre el `index.html` vivo y NO se implementó; SC#4 (paridad de URL) es la fuente de verdad. Se usa el guard defensivo `.filter((m): m is Monument => !!m)` (gemelo de `DaySection.vue:50`), nunca un filtro de tipo.
- **`pointFor` coords-first (Pitfall 4).** Devuelve `${coords.lat},${coords.lng}`. Como `MonumentSchema.coords` es no-opcional, la rama de respaldo `?query=` del original (URL del enlace) era código muerto y se omitió. `mapsQuery` no se referencia en el código (solo se nombra en el doc-comment para explicar por qué NO se usa).
- **`capStops` verbatim (Pitfall 3).** Aritmética `idx = slots === 1 ? 0 : Math.round((i * (middle.length - 1)) / (slots - 1))` portada exacta — no `Math.floor`, no corrección de off-by-one. Con datos reales ningún día supera 10 paradas (viernes=6, sabado=8, domingo=7, lunes=10, martes=7) → es paso a través, pero se prueba con un fixture sintético de 12 que verifica los índices `[0,1,3,4,5,6,8,9]`.
- **Spec en Vitest plano + fixtures YAML reales.** Import relativo `../../app/utils/dayRoute`, sin `@nuxt/test-utils`; carga `content/trips/roma/...yml` con `node:fs`+`yaml` (patrón de `invariants.spec.ts`). El encadenado del test es idéntico al del consumidor (DaySection): `day.cards → monById → filter → pointFor`.

## Deviations from Plan

None - plan executed exactly as written.

(El `critical_override` del plan ya anticipaba la trampa SC#3-vs-SC#4; honrarlo no es una desviación sino el comportamiento prescrito. No se necesitaron correcciones de Rule 1-3 ni se instalaron paquetes — T-06-SC "accept" confirmado: cero paquetes nuevos.)

## Issues Encountered
None. Los greps de aceptación de `mapsQuery`/`Math.floor` dieron 2 cada uno, pero ambos hits viven SOLO en el doc-comment (explicando qué NO hacer); el código ejecutable usa `coords.lat`/`coords.lng` y `Math.round` — verificado filtrando líneas de comentario.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- **FEAT-09 lógica pura lista.** El cableado en `DaySection` (botón `.day-route-btn` con `href=buildDirUrl(capStops(day.cards.map(pointFor)))` y texto `routeLabel`) corresponde al Plan 06-03; este plan deja las funciones auto-importadas y probadas.
- **Sin bloqueos nuevos.** La ruta del día depende de `monument` (colección normal, no de la unión discriminada `artist`/`reference`), así que el BLOQUEANTE D1 heredado de F4 NO la afecta.
- La búsqueda en cliente (MiniSearch, FEAT-08) del Plan 06-02 es independiente de este util.

## Self-Check: PASSED
- FOUND: `app/utils/dayRoute.ts`
- FOUND: `tests/unit/dayRoute.spec.ts`
- FOUND: commit `b75024f` (Task 1)
- FOUND: commit `5022dc5` (Task 2)

---
*Phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a*
*Completed: 2026-06-21*
