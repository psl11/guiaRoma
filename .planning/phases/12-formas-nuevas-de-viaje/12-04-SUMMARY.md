---
phase: 12-formas-nuevas-de-viaje
plan: 04
subsystem: data-schema + map markers + image fallback SVG
tags: [zod, leaflet, svg, nuxt-content, campania, nature, vitest, playwright]

requires:
  - phase: 12-03
    provides: "stays de Campania (ischia) y el E2E data-derivado «cada día dice dónde se duerme»"
  - phase: 12-02
    provides: "martes-22.yml vacío del esqueleto y jueves-24 con la opción B «Valle del Río Calore»"
provides:
  - "PlaceType con `nature` y `export type PlaceType`; Motif con sea, thermal, river y trail (23 motivos)"
  - "app/utils/mapMarkers.ts: MapMarker.type = PlaceType, MARKER_STYLE (Record<PlaceType, { bg }>) y markerPopupHtml con escape de & < > \""
  - "LeafletMap.client.vue lee color y popup de la tabla (divIcon, setView y fitBounds sin cambios)"
  - "4 dibujos de reserva nuevos en SVG_MOTIFS (sea, thermal, river, trail) con ids únicos"
  - "Tres fichas nature de Campania (baia-di-sorgeto, monte-epomeo, valle-del-calore) y martes 22 con stay: ischia"
  - "Popups y colores de los 39 marcadores de Roma fijados byte a byte en tests/unit/mapMarkers.spec.ts"
affects: [12-05, 12-07, 13]

actuals:
  tokens: 13090
  tasks: 3
  commits: 5
plan_head_before: 62c6438c8a19e54707abf66f0a38f0e6680cb47e
plan_head_after: ae2c71549eba381caef5b92175afd82338973bbf

tech-stack:
  added: []
  patterns:
    - "Estilo por enum: `Record<PlaceType, …>` en app/utils hace que un tipo nuevo sin estilo no compile; el componente solo indexa la tabla"
    - "HTML de popup construido en una función pura y testeable que escapa el texto de los datos antes de interpolarlo"
    - "Lista esperada de los tests derivada del enum (`Motif.options`, `PlaceType.options`), nunca un recuento fijo"

key-files:
  created:
    - content/trips/campania/monuments/baia-di-sorgeto.yml
    - content/trips/campania/monuments/monte-epomeo.yml
    - content/trips/campania/monuments/valle-del-calore.yml
    - .planning/phases/12-formas-nuevas-de-viaje/tdd/12-04-T2-red.json
    - .planning/phases/12-formas-nuevas-de-viaje/tdd/12-04-T2-red-junit.xml
    - .planning/phases/12-formas-nuevas-de-viaje/tdd/12-04-T3-red.json
    - .planning/phases/12-formas-nuevas-de-viaje/tdd/12-04-T3-red-junit.xml
  modified:
    - shared/schemas.ts
    - app/utils/svgMotifs.ts
    - app/utils/mapMarkers.ts
    - app/components/LeafletMap.client.vue
    - content/trips/campania/days/martes-22.yml
    - content/trips/campania/days/jueves-24.yml
    - tests/unit/svgMotifs.spec.ts
    - tests/unit/mapMarkers.spec.ts
    - tests/trips/campania.spec.ts

key-decisions:
  - "markerPopupHtml usa un switch con `default` = card (igual que el else del código original); nature es la plantilla de concert con #2f6f73"
  - "El escape solo cubre & < > \" de name, day e id; la comilla simple queda intacta (popups de Roma como «Campo de' Fiori»)"
  - "Los cuatro motivos nuevos van al final de Motif y de SVG_MOTIFS, después de los 19 de Roma"
  - "Evidencia RED de la Task 3 con el JUnit de Playwright (el E2E data-derivado), porque los unitarios de mapMarkers ya pasaban tras el tracer"

patterns-established:
  - "Lugar de naturaleza = ficha `type: nature` normal con `motif` de naturaleza; el tipo solo se ve en el color del marcador (UI-SPEC)"

requirements-completed: [EXT-04]

coverage:
  - id: D1
    description: "Esquema: PlaceType gana nature (con export type) y Motif gana sea, thermal, river y trail; Roma valida igual"
    requirement: EXT-04
    verification:
      - kind: unit
        ref: "tests/unit/svgMotifs.spec.ts#motivos de naturaleza (D-10) > el enum Motif incluye sea, thermal, river y trail"
        status: pass
      - kind: unit
        ref: "vitest run tests/data (542 tests, incluye D-18 Roma con el esquema ampliado)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Cuatro SVG de reserva nuevos (sea, thermal, river, trail): lienzo 800×280, cielo, grupo .9, ids de UI-SPEC, ≤ 1.600 caracteres, sin style/text/image/xlink; 36 ids sin repetir; los 19 de Roma byte a byte iguales"
    requirement: EXT-04
    verification:
      - kind: unit
        ref: "tests/unit/svgMotifs.spec.ts (24/24)"
        status: pass
      - kind: other
        ref: "node -e (19 SVG de Roma contra git show d0c0ed2:app/utils/svgMotifs.ts) → «19 SVG de Roma intactos»"
        status: pass
    human_judgment: false
  - id: D3
    description: "MARKER_STYLE y markerPopupHtml: los 39 marcadores de Roma con popup y color byte a byte; nature #2f6f73 con ancla plana; escape de & < > \" y ' intacta"
    requirement: EXT-04
    verification:
      - kind: unit
        ref: "tests/unit/mapMarkers.spec.ts#markerPopupHtml / MARKER_STYLE — Roma byte a byte (D-11)"
        status: pass
      - kind: unit
        ref: "tests/unit/mapMarkers.spec.ts#markerPopupHtml / MARKER_STYLE — nature y escape (D-11)"
        status: pass
      - kind: automated_ui
        ref: "pnpm verify → tests/parity/map-fallback-notes.spec.ts (39 marcadores y popups de Roma con el LeafletMap refactorizado)"
        status: pass
    human_judgment: false
  - id: D4
    description: "En dev, cada ficha nature de Campania tiene marcador rgb(47, 111, 115), su hero cae al SVG de su motivo y conserva el enlace a Google Maps; el popup de Sorgeto lleva a su ficha"
    requirement: EXT-04
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: Baia di Sorgeto pinta su dibujo de reserva y su marcador de naturaleza (EXT-04, D-10, D-11)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: cada lugar de naturaleza tiene marcador verde agua y dibujo de reserva (EXT-04, D-05)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Contenido: martes 22 con stay: ischia, Monte Epomeo 09:30 y Sorgeto 21:30; valle-del-calore como ref de la opción B del jueves 24 y en sus fichas"
    requirement: EXT-04
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: cada día dice dónde se duerme (EXT-02, D-07)"
        status: pass
      - kind: unit
        ref: "vitest run tests/data (puerta de datos: ref, cards, stay-ref)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Roma intacta: pnpm verify verde (56 goldens sin --update-snapshots) y paths congelados sin diff respecto a d0c0ed2"
    verification:
      - kind: automated_ui
        ref: "pnpm verify (unit 445, data 542, parity 110/110)"
        status: pass
      - kind: other
        ref: "git diff --exit-code d0c0ed2 -- content/trips/{roma,prueba,forma} app/assets/css/{base,tokens,fonts,leaflet,multitrip}.css tests/parity package.json pnpm-lock.yaml"
        status: pass
    human_judgment: false
  - id: D7
    description: "Los cuatro motivos nuevos se leen como de la misma familia que garden/fountain a 220 y 280 px, en claro y oscuro, sin recortar el sujeto en móvil (backstop long-text E5)"
    verification: []
    human_judgment: true
    rationale: "Juicio estético: ningún test compara los dibujos con un golden visual. El ejecutor solo hizo un render de comprobación (6 motivos a 380×220, claro y con el filtro oscuro)"

duration: 12min
completed: 2026-11-21
status: complete
---

# Phase 12 Plan 04: Lugares de naturaleza: ficha, marcador verde agua y dibujo de reserva Summary

**`nature` en `PlaceType`, con color y popup en `MARKER_STYLE`/`markerPopupHtml` (que escapa el texto de los datos). Cuatro SVG de reserva nuevos (sea, thermal, river, trail) y tres fichas de Campania (Sorgeto, Monte Epomeo, Valle del Calore). Los 39 marcadores de Roma quedan fijados byte a byte.**

## Performance

- **Duration:** 12 min (incluye las corridas de verify y test:trips)
- **Started:** 2026-11-21T10:40:21Z
- **Completed:** 2026-11-21T10:52:20Z
- **Tasks:** 3
- **Files modified:** 16 (incluidos 4 ficheros de evidencia RED)

## Accomplishments

- **Esquema (D-10, D-11).** `PlaceType = ['card', 'guided', 'concert', 'nature']` con `export type PlaceType`. `Motif` añade `sea`, `thermal`, `river` y `trail` al final, detrás de los 19 de Roma, y queda en 23 valores.
- **`mapMarkers.ts`.**
  - `MapMarker.type: PlaceType` (Pitfall 7).
  - `MARKER_STYLE: Record<PlaceType, { bg }>`: card `#8b3a3a`, guided `#a07c4a`, concert `#5a7a3a`, nature `#2f6f73`.
  - `markerPopupHtml(m)`: las tres plantillas de Roma movidas verbatim más la de nature. Escapa `& < > "` en `name`, `day` e `id`.
- **`LeafletMap.client.vue`.** Usa `MARKER_STYLE[m.type].bg` y `markerPopupHtml(m)`; se borran las dos cadenas if/else. `divIcon`, `setView` y `fitBounds(...).pad(0.1)` no cambian.
- **Cuatro dibujos de reserva nuevos.** Todos en el lenguaje de los 19 de Roma:

  | Motivo | Ids | Caracteres |
  |---|---|---|
  | thermal | sk_th/wa_th | 1334 |
  | sea | sk_se/wa_se | 1228 |
  | river | sk_rv/wa_rv | 1375 |
  | trail | sk_tr/st_tr | 1145 |

  La tabla tiene ahora 36 ids, ninguno repetido. Los 19 SVG de Roma siguen byte a byte iguales que en `d0c0ed2`.
- **Fichas de Campania.**
  - `baia-di-sorgeto` (V, thermal) y `monte-epomeo` (IV, trail) en el martes 22, que además gana `stay: ischia` y las paradas 09:30 y 21:30.
  - `valle-del-calore` (VIII, river) es la `ref` de la parada de la opción B del jueves 24 y entra en sus fichas detrás de raito.
- **Tests.**
  - `svgMotifs.spec` toma la lista de `Motif.options` y comprueba las reglas de los motivos nuevos y los ids únicos.
  - `mapMarkers.spec` fija byte a byte el popup y el color de los 39 marcadores de Roma, y prueba nature y el escape.
  - Dos E2E nuevos de EXT-04 en `campania.spec.ts`.

## Task Commits

1. **Task 1 (tracer): Baia di Sorgeto de punta a punta**: `bc22ad6` (feat)
2. **Task 2 (tdd): sea, river y trail**
   - RED: `a502980` (test)
   - GREEN: `beda527` (feat)
   - REFACTOR: no hizo falta
3. **Task 3 (tdd): Monte Epomeo, Valle del Calore, Roma byte a byte y puerta de la ola**
   - RED: `eb3da3d` (test)
   - GREEN: `ae2c715` (feat)
   - REFACTOR: no hizo falta

**Plan metadata:** el commit docs(12-04) que acompaña a este SUMMARY

## Files Created/Modified

- `shared/schemas.ts`: `nature` en PlaceType, los 4 motivos en Motif, `export type PlaceType`; comentarios actualizados (los motivos ya no son solo «19»)
- `app/utils/svgMotifs.ts`: SVG `thermal`, `sea`, `river` y `trail`; la cabecera JSDoc explica los dos orígenes de la tabla
- `app/utils/mapMarkers.ts`: `MapMarker.type: PlaceType`, `MARKER_STYLE`, `escapeHtml` (interno) y `markerPopupHtml`, con JSDoc de H18/D-11/CR-01
- `app/components/LeafletMap.client.vue`: color y popup desde la tabla, comentarios ajustados
- `content/trips/campania/monuments/{baia-di-sorgeto,monte-epomeo,valle-del-calore}.yml`: fichas nature (nuevas)
- `content/trips/campania/days/martes-22.yml`: `stay: ischia`, dos paradas y dos fichas
- `content/trips/campania/days/jueves-24.yml`: `ref: valle-del-calore` en la opción B y la ficha en `cards`
- `tests/unit/svgMotifs.spec.ts`: lista esperada desde `Motif.options`; describe «motivos de naturaleza (D-10)»; ids únicos
- `tests/unit/mapMarkers.spec.ts`: describe «Roma byte a byte (D-11)» y «nature y escape (D-11)»
- `tests/trips/campania.spec.ts`: helpers `firstSvgId`, `markerByRoman`, `markerBg` y `expectHeroFallsBackToMotif`, más 2 E2E de EXT-04

## Decisions Made

- `markerPopupHtml` usa un `switch`. Su `default` es la plantilla card, igual que el `else` original, así que un tipo desconocido se comporta como antes.
- El escape no toca la comilla simple. Siete nombres de Roma la llevan («Campo de' Fiori», «Sant'Ignazio di Loyola»…) y ningún atributo del popup va entre comillas simples.
- Los motivos nuevos van al final del enum y de la tabla. Así los 19 de Roma conservan su posición y el comprobador por regex de la Task 2 compara línea a línea.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Selector de marcadores del E2E**
- **Found during:** Task 1 (paso 5)
- **Issue:** el plan pedía `#leaflet-map .custom-marker`. En el DOM montado el contenedor ya no conserva ese id; ya estaba documentado en 12-01, 12-02 y 12-03.
- **Fix:** el helper `markerByRoman` busca bajo `section[id="mapa"]`, con un comentario que lo explica.
- **Files modified:** tests/trips/campania.spec.ts
- **Committed in:** bc22ad6

**2. [Rule 1 - Bug] Criterio `markerPopupHtml(m)` == 1 en LeafletMap**
- **Found during:** Task 1 (criterios de aceptación)
- **Issue:** el comentario de cabecera nuevo citaba `markerPopupHtml(m)` y el recuento daba 2.
- **Fix:** el comentario pasa a decir «de `markerPopupHtml`». Ahora solo la llamada casa.
- **Files modified:** app/components/LeafletMap.client.vue
- **Committed in:** bc22ad6

---

**Total deviations:** 2 auto-fixed (Rule 1). **Impact:** ninguno en el comportamiento. Uno afecta al selector de un test y el otro a un comentario.

## TDD Gate Compliance

- **Task 1** es `type="tracer"`, no TDD. Su `feat` (`bc22ad6`) ya traía `MARKER_STYLE`, `markerPopupHtml` y el SVG `thermal`.
- **Task 2:**
  - **RED (`a502980`):** fallaron 14 de 24 tests de svgMotifs.spec, todos en aserción. Faltaban sea, river y trail, y el recuento de ids daba 30 < 36.
  - **Evidencia:** `tdd/12-04-T2-red.json` (JUnit de Vitest). El clasificador devolvió `RED_EVIDENCE_OK target_test_failed` para «el enum Motif incluye sea, thermal, river y trail».
  - **Valoración semántica:** el target se ejecutó y falló en su aserción (`toContain('sea')`). Los casos de thermal ya pasaban por el tracer. No hubo errores de import ni de carga.
  - **GREEN (`beda527`):** 24/24.
- **Task 3:**
  - **RED (`eb3da3d`):** el target fue el E2E «cada lugar de naturaleza…». Falló en `expect(natures.length).toBeGreaterThanOrEqual(3)`: recibió 1, porque monte-epomeo y valle-del-calore aún no existían.
  - **Evidencia:** `tdd/12-04-T3-red.json` (JUnit de Playwright). El clasificador devolvió `RED_EVIDENCE_OK target_test_failed`.
  - **Unitarios en verde desde el principio:** los describe nuevos de mapMarkers.spec («Roma byte a byte» y «nature y escape») pasaron a la primera, porque el tracer ya había implementado el contrato. El plan lo preveía: «el test fija el contrato».
  - **Dientes de los unitarios:** dos mutaciones temporales, revertidas después, los pusieron en rojo. Cambiar «guía» por «guia» en la plantilla guided dio 2 fallos. Cambiar el color de card dio 36 fallos.
  - **GREEN (`ae2c715`):** E2E 33/33 en test:trips.

## Issues Encountered

- `pnpm verify` salió verde a la primera: unit 445/445, data 542/542 y parity 110/110. Esta vez no saltó el flaky de navigation.spec.
- `pnpm test:trips` con cachés limpias: 33/33.
- Los paths congelados no tienen diff respecto a `d0c0ed2`.

## Revisión humana pendiente (backstop long-text E5, /gsd-verify-work 12)

En `pnpm dev`, en /guiaRoma/trips/campania, hay que bloquear las imágenes (las heros de example.invalid ya fallan solas) y revisar Sorgeto (thermal), Monte Epomeo (trail) y Valle del Calore (river). `sea` llega con pozzo-vecchio en 12-05; hasta entonces solo se ve en el test unitario. Qué mirar:

- **Familia:** a 220 px (móvil) y 280 px (≥ 640 px), en claro y en oscuro, junto a `garden` y `fountain`, deben leerse como la misma familia.
- **Sujeto:** debe quedar entre x 200 y 600 sin recortarse en móvil.
- **Encuadre por motivo:** en `sea` el acantilado entra por la derecha (x > 560), así que en móvil se ve recortado a propósito. En `river`, el agua tapa la base del puente para que parezca que tiene pilares en el río.

El ejecutor hizo un render de comprobación a 380×220 de los seis motivos, en claro y con el filtro oscuro de `.card-hero`. Se leen coherentes, pero eso no sustituye la revisión.

## Known Stubs

Ninguno. Los textos de las fichas son el esqueleto provisional de D-15, que la Fase 13 reescribe.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 12-05 puede añadir `pozzo-vecchio` (`nature`/`sea`) sin tocar código. El E2E «cada lugar de naturaleza» lo recogerá solo.
- 12-07 puede añadir `family` a `baia-di-sorgeto`.

## Self-Check: PASSED

- FOUND: app/utils/mapMarkers.ts, app/utils/svgMotifs.ts, las 3 fichas nature, tdd/12-04-T2-red.json y tdd/12-04-T3-red.json
- FOUND commits: bc22ad6, a502980, beda527, eb3da3d, ae2c715 (evaluation-scope resuelve los 5 en esta rama)
- Criterios de aceptación en verde: Task 1 13/13, Task 2 5/5, Task 3 6/6

---
*Phase: 12-formas-nuevas-de-viaje*
*Completed: 2026-11-21*
