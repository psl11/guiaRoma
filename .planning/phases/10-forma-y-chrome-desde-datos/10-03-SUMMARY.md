---
phase: 10-forma-y-chrome-desde-datos
plan: 03
subsystem: data-gate
tags: [zod, vitest, nuxt-content, data-gate, shape, anchors, security]
status: complete

requires:
  - phase: 10-01
    provides: "app/utils/tripLayout.ts (STRUCTURAL_SECTION_IDS, dayPillLabel, buildTripLayout)"
  - phase: 10-02
    provides: "TripSchema chrome opcional; tests/data/schema.spec.ts ampliado"
provides:
  - "DAY_SLUG_RE exportada; DaySchema.slug validado (^[a-z0-9-]+$) y DaySchema.pill opcional"
  - "Regla day-pill (etiquetas únicas por viaje, NFC + trim + minúsculas, misma dayPillLabel que la UI)"
  - "Regla day-order (order único y contiguo 1..N)"
  - "Regla anchor según la presencia de buildTripLayout (cierra WR-01 de la Fase 9)"
  - "cross-trip-link como lista blanca #id / http(s):// (cierra WR-02 de la Fase 9)"
  - "SECTION_ANCHORS = STRUCTURAL_SECTION_IDS (una sola lista de ids de sección)"
affects: [10-04, 10-05, fase-13-campania]

actuals:
  tokens: 5145
  tasks: 2
  commits: 4
plan_head_before: 60de5e751b153c70cdda6bb34a16ae7dffcc6280
plan_head_after: 822a937afe9ab802cb06c456fb9b0b2825faebca

tech-stack:
  added: []
  patterns:
    - "La puerta de datos importa las funciones puras de la UI (app/utils/tripLayout.ts, import relativo) en vez de duplicar reglas: layout y pastillas se validan con el mismo código que las pinta"
    - "Enlaces de prosa en lista blanca (solo #id o http(s)://), no en lista negra"

key-files:
  created: []
  modified:
    - shared/schemas.ts
    - tests/data/trips.ts
    - tests/data/invariants.spec.ts
    - tests/data/schema.spec.ts

key-decisions:
  - "DAY_SLUG_RE se declara justo antes de DaySchema (no junto a TRIP_SLUG_RE): DaySchema la usa al evaluarse el módulo y TRIP_SLUG_RE está más abajo"
  - "day-pill compara con pillKey = normalize('NFC').trim().toLocaleLowerCase('es'); el mensaje lista todos los ficheros del grupo"
  - "day-order ordena por order (desempate por fichero); un order no numérico va al final y es violación"
  - "La regla anchor construye el layout con buildTripLayout a partir del YAML (reservas/practica por slug de reference, foodCount, kinds de artista): mismas reglas que la plantilla"

requirements-completed: [SHAPE-01, SHAPE-02]

duration: 3min
completed: 2026-11-20
---

# Phase 10 Plan 03: Puerta de datos de forma Summary

**La puerta `tests/data` ahora valida la forma dinámica del viaje: slug de día `^[a-z0-9-]+$` y `pill` opcional en `DaySchema`, y cuatro reglas en `checkTrip`. `day-pill` usa la misma `dayPillLabel` de la UI y compara en NFC sin distinguir mayúsculas. `day-order` exige un `order` contiguo 1..N. `anchor` solo admite secciones presentes según `buildTripLayout`, y `cross-trip-link` es una lista blanca (`#id` / `http(s)://`). Con esto quedan cerrados WR-01 y WR-02 de la Fase 9.**

## Performance

- **Duration:** ~3 min (reloj de la máquina)
- **Started:** 2026-11-20T14:17:49Z
- **Completed:** 2026-11-20T14:20:51Z
- **Tasks:** 2 (ambas TDD: RED → GREEN)
- **Files modified:** 4

## Accomplishments

- `shared/schemas.ts`: `export const DAY_SLUG_RE = /^[a-z0-9-]+$/`; `DaySchema.slug` usa esa regex. `DaySchema.pill` es un string opcional sin espacios en los extremos. El comentario de rango fijo `1..5` de `order` se ha sustituido por una referencia a la regla `day-order` (D-04).
- `tests/data/trips.ts`: `RULES` pasa de 14 a 16 reglas (`day-order` y `day-pill`). Las anclas válidas son los slugs de entidad más los ids de `buildTripLayout(presencia del YAML)`. `cross-trip-link` pasa a lista blanca. `SECTION_ANCHORS` re-exporta `STRUCTURAL_SECTION_IDS` (D-06: ya no queda otra lista literal).
- Dientes: 4 `day-pill:`, 5 `day-order:`, 5 `anchor:` nuevos (el control `#reservas` de la Fase 9 ahora se espera en rojo, y hay su positivo con `reference/reservas.yml`), `dup-id (D-05a)`, `fixed-anchor (D-05a)` y 5 `cross-trip-link:` (`/#pantheon`, `/guiaRoma/#x`, `../roma#x`, `javascript:alert(1)` en rojo; `https://example.org/x` en verde). También hay 9 casos de `DaySchema` (slug y pill) en schema.spec.ts.
- Roma y prueba pasan todas las reglas sin tocar ningún YAML de `content/`.
- **Punto 5 de `09-UAT.md`:** queda resuelto por esta fase (anclas a secciones ausentes y enlaces fuera de la lista blanca ya rompen la puerta). Si el usuario decide otra cosa en `/gsd-verify-work 9`, se ajusta la regla.

## Task Commits

1. **Task 1 (tracer): DaySchema slug + pill → day-pill**
   - RED: `a02ea45` (test)
   - GREEN: `45dbd60` (feat)
   - Puerta del tracer (modo auto): se volvió a ejecutar `<verify>` de punta a punta (vitest data/unit, generate, eslint y typecheck), todo en verde, así que se continuó con la Task 2.
2. **Task 2: day-order, anchor por presencia, lista blanca de enlaces**
   - RED: `54ecb91` (test)
   - GREEN: `822a937` (feat)

No hizo falta un commit REFACTOR.

## Verification

- `vitest run tests/data`: 312/312 en verde. `vitest run tests/unit`: 229/229 en verde (incluye searchIsolation, que importa `../data/trips`).
- Node 22: `rm -rf .data .nuxt .output && nuxi generate` prerenderiza 10 rutas sin errores con el `DaySchema` nuevo. `eslint` sale limpio en los 4 ficheros y `nuxi typecheck` termina con exit 0.
- `git diff --quiet f04967a -- content/trips/prueba/ content/trips/roma/days/ tests/parity/` devuelve 0. `git status --porcelain -- content/ app/ tests/parity/` sale vacío.
- Se cumplen todos los criterios de aceptación con grep de ambas tareas.

## Decisions Made

- `DAY_SLUG_RE` se declara antes de `DaySchema` y no junto a `TRIP_SLUG_RE`. `DaySchema` se evalúa al cargar el módulo, y como `TRIP_SLUG_RE` está unas 200 líneas más abajo, usarla ahí daría un error TDZ. El comentario lo explica.
- El mensaje de `day-pill` incluye la etiqueta tal como se ve en pantalla («Sábado») y la lista de ficheros del grupo, igual que `dup-id`.
- Para `day-order`, un `order` no numérico se ordena al final (`+Infinity`) y siempre produce violación.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ubicación de `DAY_SLUG_RE`**
- **Found during:** Task 1
- **Issue:** El plan pide exportar `DAY_SLUG_RE` «junto a `TRIP_SLUG_RE`», pero esa constante está declarada después de `DaySchema`. Una `const` usada por `DaySchema` al evaluarse el módulo tiene que declararse antes.
- **Fix:** Se declara justo antes de `DaySchema`, con el comentario D-02 y una nota que explica la ubicación.
- **Files modified:** shared/schemas.ts
- **Commit:** 45dbd60

**2. [Rule 2 - Completitud] Casos de prueba extra**
- Se añadieron `day-order: un order no numérico es violación` y el caso `pill 'Sáb 19 '` (espacio final), para cubrir la parte de la acción que el behavior no listaba («un order no numérico también es violación») y el otro extremo de la regex.
- **Commit:** a02ea45, 54ecb91

## Issues Encountered

Ninguno. Los dientes `dup-id (D-05a)` y `fixed-anchor (D-05a)` pasaron ya en RED, como preveía RESEARCH: esas reglas ya incluían los días y aquí solo hacían falta los fixtures.

## Known Stubs

Ninguno.

## Next Phase Readiness

- 10-04 (viaje `forma`) puede usar slugs con fecha y `pill`. La puerta exige que sus días tengan `order` contiguo y pastillas únicas.
- La Fase 13 (Campania, con dos sábados) necesitará `pill` distintas, o eyebrows que deriven etiquetas distintas.

## Self-Check: PASSED

- FOUND: shared/schemas.ts, tests/data/trips.ts, tests/data/invariants.spec.ts, tests/data/schema.spec.ts
- FOUND commits: a02ea45, 45dbd60, 54ecb91, 822a937
