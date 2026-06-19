---
phase: 02-esquema-de-datos-migraci-n-del-contenido
plan: 03
subsystem: content-data
tags: [nuxt-content, yaml, zod, day-schema, timeline, cards, migracion, paridad]

# Dependency graph
requires:
  - phase: 02
    plan: 01
    provides: "shared/schemas.ts (TripSchema/DaySchema + TimelineRow discriminado + Pace) y las puertas schema.spec/invariants.spec contra las que validan estos YAML"
provides:
  - "content/trips/roma/trip.yml: documento trip de Roma (hero, infoCards, howTo, map center/zoom) — Task 1, run previo"
  - "content/trips/roma/days/{viernes,sabado,domingo,lunes,martes}.yml: los 5 dias con timeline discriminado (kind+pace por fila, DATA-02) y cards[] en orden de DOM (DATA-03)"
  - "primera coleccion 'day' completa (5/5) que activa el conteo SC#1 de schema.spec y los loops por-fichero de invariants para dias"
affects: [migracion-roma-wave3, render-mdc, ruta-del-dia, busqueda, mapa, verificacion-paridad]

# Tech tracking
tech-stack:
  added: []
  patterns: ["timeline como array ordenado de TimelineRow discriminado por kind", "cards[] = orden del DOM de la seccion (NO del array places)", "prosa/desc/note/footnote como Markdown-inline (negritas **/_cursivas_/[enlaces](#id))", "transport con variant metro/metro-b omitido (enum solo taxi/walk/train, variant opcional)", "fixed-event y stop-disabled mapeados a stop{disabled:true,tag}"]

key-files:
  created:
    - content/trips/roma/days/viernes.yml
    - content/trips/roma/days/sabado.yml
    - content/trips/roma/days/domingo.yml
    - content/trips/roma/days/lunes.yml
    - content/trips/roma/days/martes.yml
  modified:
    - shared/schemas.ts

key-decisions:
  - "cards[] sigue el ORDEN del DOM de cada seccion (verificado por grep de los <article class=card id=>), NUNCA el array places (numerales con saltos)"
  - "auditorium en sabado.cards y monti en domingo.cards y galleria-borghese en martes.cards: maquetados en su seccion aunque NO aparezcan en el timeline de ese dia (cards = DOM, no timeline)"
  - "lunes.cards: minerva/san-luigi salen por DOM del lunes aunque sus numerales sean XXXV/XXXVI; pantheon NO entra en lunes.cards (su ficha esta en viernes) aunque el timeline del lunes lo referencie via ref"
  - "Stops sin <a> (tl-title disabled span) NO llevan ref (evita cross-ref fantasma): p.ej. Otello/Ristoro/Matriciana/Felice/Vecchia Roma se modelan como stop disabled + reservation, el restaurante va en el tl-food siguiente con su ref"
  - "tl-transport con clase metro/metro-b: variant omitido (enum DaySchema = taxi/walk/train, optional); el icono Ⓜ️ del modo conserva la info de metro"
  - "fixed-event (Coliseo/partido/concierto/vuelo) y eventos sin ancla: stop{disabled:true, tag} — el schema distingue disabled/reservedEvent, no fixed-event; se conserva el estado visible (disabled) + el tag"

requirements-completed: [DATA-02, DATA-03]

# Metrics
duration: 22min
completed: 2026-06-19
---

# Phase 2 Plan 03: Trip + 5 dias (timeline discriminado + cards en orden de DOM) Summary

**Los 5 documentos de dia de Roma migrados 1:1 desde index.html — cada timeline como array ordenado de filas discriminadas por kind (stop/transport/meta/food/reservation) con pace por fila (DATA-02), y cada cards[] en el ORDEN EXACTO del DOM de su seccion (DATA-03), la pieza de la que la Fase 6 deriva la ruta del dia. Todos validan contra DaySchema (schema.spec verde, conteo day=5/5).**

## Performance

- **Duration:** ~22 min (incluye reanudacion tras corte de conexion)
- **Completed:** 2026-06-19
- **Tasks:** 3 (Task 1 trip.yml ya completado por el run previo; este run hizo Tasks 2 y 3)
- **Files modified:** 6 (5 day YAML nuevos + shared/schemas.ts)

## Accomplishments
- **5 documentos de dia** (`content/trips/roma/days/*.yml`) — viernes (22 filas timeline, 6 cards), sabado (30, 8), domingo (33, 7), lunes (43, 10), martes (32, 7). Cada uno un unico objeto YAML (no array raiz) con slug/trip/order/roman/eyebrow/title/subtitle/stats/light/timeline/cards.
- **timeline discriminado (DATA-02)** — cada fila del DOM transcrita a su `kind`: `stop` (tl-item, con ref/tag/note/disabled/reservedEvent), `transport` (tl-transport con variant + modes icon/recommended/desc/tag/meta + footnote), `meta` (tl-meta items con level ok/warn/plain), `food` (tl-food entries ref|href/name/reserved/badge/time/desc + footnote), `reservation` (tl-resv-meta). `data-pace` de cada fila mapeado a `pace` (all/medium/slow-only).
- **cards[] en orden de DOM (DATA-03)** — el orden de aparicion de los `<article class="card">` dentro de cada seccion, extraido por grep de linea (no del array `places`). Casos sutiles resueltos: auditorium (sabado), monti (domingo), galleria-borghese (martes) van en sus cards por estar maquetados en la seccion aunque no esten en el timeline; minerva/san-luigi en lunes por DOM (no por numeral XXXV/XXXVI).
- **dia-ligera (light)** migrado en los 5 dias con items see/move/skip/care/rest (incluye los `lg-care` que motivaron los dos fixes de esquema).
- **Verificacion**: `pnpm exec vitest run tests/data/schema.spec.ts` → 21 passed | 4 skipped (los 5 `it` por-fichero de dia + conteo day=5/5 verdes). `tsc --noEmit` sobre schemas.ts exit 0.

## Task Commits

Each task committed atomically:

1. **Task 1: Migrar trip.yml (hero, info-grid, como usar, mapa)** - `0adcfa1` (feat) — _completado por el run previo (interrumpido por corte de conexion); verificado intacto y valido al reanudar._
2. **Task 2: Migrar viernes, sabado y domingo** - `f27a2e4` (feat)
3. **Task 3: Migrar lunes y martes** - `f16e39f` (feat)

Fix de esquema (deviation Rule 3, ver abajo):
- **'care' kind en DaySchema.light** - `2426cd5` (fix) — _commiteado por el run previo._
- **'ticket' variant en DaySchema.stats** - `5f0db06` (fix) — _este run._

## Files Created/Modified
- `content/trips/roma/days/viernes.yml` (NEW) - Dia I: Centro Storico nocturno. 22 filas timeline, 6 cards.
- `content/trips/roma/days/sabado.yml` (NEW) - Dia II: Vaticano y Trastevere. 30 filas, 8 cards (incl. auditorium por DOM). Usa lg-care.
- `content/trips/roma/days/domingo.yml` (NEW) - Dia III: Aventino/Ghetto/Roma Antigua. 33 filas, 7 cards (incl. monti por DOM). Usa 2x lg-care y stats ticket.
- `content/trips/roma/days/lunes.yml` (NEW) - Dia IV: Tridente y Roma cristiana. 43 filas, 10 cards (minerva/san-luigi por DOM). stats ticket; timeline ref a pantheon.
- `content/trips/roma/days/martes.yml` (NEW) - Dia V: Villa Borghese y despedida. 32 filas, 7 cards (incl. galleria-borghese por DOM, fuera del timeline). stats ticket.
- `shared/schemas.ts` (MOD) - DaySchema.stats[].variant enum: anadido `'ticket'` (deviation Rule 3).

## Decisions Made
- **cards[] = orden del DOM, no de places** (DATA-03, Pitfall 3): los `<article class="card" id=…>` se enumeraron por linea con grep dentro de cada frontera de seccion. El array `places` del JS va por numeral romano con saltos (minerva XXXV y san-luigi XXXVI caen entre los del lunes) — no se uso para el orden.
- **Cards maquetadas fuera del timeline** entran igual en cards[]: auditorium (sabado, linea 3381), monti (domingo, 3937), galleria-borghese (martes, 4809). Su ficha aparece en la seccion del dia aunque la parada no este en el timeline de ese dia (la Borghese ni siquiera se visita — se sustituyo por Barberini). cards refleja el DOM de la seccion; el `day` del monumento (Plan 04, de places) es otra cosa.
- **Stops disabled sin ancla NO llevan ref**: las comidas/eventos maquetados como `<span class="tl-title disabled">` (sin `<a href>`) — Otello, Ristoro, La Matriciana, Felice, La Vecchia Roma, tours fixed-event — se modelan como `stop{disabled:true, tag}`. El restaurante con su ancla (`ref`) va en el bloque `tl-food` siguiente. Asi no se inventa una cross-ref que invariants.spec marcaria rota.
- **tl-transport metro/metro-b**: `variant` se omite (el enum de DaySchema es taxi/walk/train y `variant` es opcional). El modo lleva el icono Ⓜ️, que conserva la semantica de metro para el render.
- **Markdown-inline**: `<strong>`/`<b>` → `**…**`, `<em>`/`<i>` → `_…_`, `<a href="#id">txt</a>` → `[txt](#id)`, `<a href="https…">txt</a>` → `[txt](https…)`. Bloques `|`/`>-` de YAML para la prosa larga (footnotes/notes) — diffs legibles.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Anadir 'ticket' al enum DaySchema.stats[].variant**
- **Found during:** Task 2 (al escribir domingo.yml — su day-stats tiene un item `ticket`)
- **Issue:** `DaySchema.stats[].variant` era `z.enum(['walk','train','taxi','metro'])`. El index.html usa `day-stats-item ticket` 3 veces (domingo/lunes/martes) y tiene una regla CSS dedicada (`.day-stats-item.ticket::before { content: "🎟️"; }`, linea 1289). Sin `'ticket'` en el enum, los 3 dias NO validaban contra DaySchema (safeParse fallaba en el primer stat ticket).
- **Fix:** enum → `['walk','train','taxi','metro','ticket']` en shared/schemas.ts. Transcripcion fiel: el variant existe en el source y la Fase 4 necesita el icono 🎟️ para paridad. Es el mismo tipo de fix que el `'care'` ya commiteado por el run previo (`2426cd5`).
- **Files modified:** shared/schemas.ts
- **Verification:** `tsc --noEmit shared/schemas.ts` exit 0; `pnpm exec vitest run tests/data/schema.spec.ts` → 21 passed (domingo/lunes/martes validan).
- **Committed in:** `5f0db06`

---

**Total deviations:** 1 auto-fixed este run (Rule 3 — enum incompleto en el contrato), analogo al `'care'` del run previo. Sin scope creep: ambos son la transcripcion fiel de variantes que ya existen en index.html con su CSS.
**Impact on plan:** Necesario para que domingo/lunes/martes validen. Cambio de un literal en un enum; sin cambio de runtime. content.config.ts (otro consumidor del esquema) sigue compilando.

## Issues Encountered
- **Estado transitorio del conteo SC#1**: schema.spec espera exactamente 5 ficheros de dia; con 2-3 escritos a mitad de Task 2 el describe de conteo falla (2≠5). Es esperado mientras la wave esta a medias — se resuelve al completar los 5 (conteo day=5/5 verde). La validacion por-fichero (la que importa para la "forma") pasa desde el primer YAML.
- **invariants.spec NO verde aun (esperado, gate de fase)**: 3 fallos por cross-refs — `timeline stop ref` y anclas inline `(#id)` (p.ej. #giardino-aranci, #g-fortunata) que apuntan a monumentos/food aun no migrados (Wave 3, Planes 04/05). El propio plan instruye NO gatear en invariants aqui: `day.cards[]`/refs solo resuelven cuando exista el universo completo de slugs. Es un gate de FASE, no de tarea.

## Known Stubs
None. Los 5 ficheros contienen datos reales transcritos 1:1 de index.html (timeline completo, cards en orden de DOM, stats, dia-ligera). No hay placeholders, arrays vacios de relleno ni texto "coming soon".

## User Setup Required
None — fase de modelado de datos para sitio estatico (sin entrada de usuario, auth, endpoints ni secretos; threat model T-02-09/10/11: integridad de transcripcion, cubierta por schema.spec/invariants.spec/migration-diff).

## Next Phase Readiness
- **Wave 3 (migracion de monumentos/food/artists)** puede empezar: cuando aparezcan los `monuments/*.yml` y `food/*.yml`, las 3 cross-refs pendientes de invariants.spec se resolveran solas (los `day.cards[]` y los `ref`/anclas de los timelines ya estan escritos y esperando su universo de slugs).
- **Las anclas referenciadas por los dias** (para que Wave 3 las cumpla): cards[] de los 5 dias (38 ids de monumento en total) + food refs (g-fortunata, g-roscioli, g-pollarola, g-baffetto, g-frigidarium, g-tonnarello, g-fior-di-luna, g-mercato-hostaria, g-giggetto, g-sora-lella, g-matriciana, g-felice, g-vecchia-roma, g-regoli) + ancla #gastronomia/#tazza-doro.
- **Sin blockers.** schema.spec verde con day=5/5; el contrato DaySchema quedo cubierto end-to-end por datos reales.

---
*Phase: 02-esquema-de-datos-migraci-n-del-contenido*
*Completed: 2026-06-19*

## Self-Check: PASSED

- Created files verified on disk: content/trips/roma/days/{viernes,sabado,domingo,lunes,martes}.yml + trip.yml (Task 1)
- Task commits verified in git log: 0adcfa1 (Task 1), f27a2e4 (Task 2), f16e39f (Task 3); schema fixes 2426cd5 + 5f0db06
- Gates: `pnpm exec vitest run tests/data/schema.spec.ts` → 21 passed | 4 skipped (day=5/5); `tsc --noEmit shared/schemas.ts` exit 0
- invariants.spec: 3 fallos de cross-ref ESPERADOS (monumentos/food de Wave 3 aun no migrados) — gate de fase, no de tarea (per plan critical reminders)
