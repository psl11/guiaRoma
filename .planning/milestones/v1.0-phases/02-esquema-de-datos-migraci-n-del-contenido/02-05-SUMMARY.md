---
phase: 02-esquema-de-datos-migraci-n-del-contenido
plan: 05
subsystem: database
tags: [nuxt-content, yaml, monuments, migration, data-04, data-06, mdc, cross-refs, fidelity-gate, lunes, martes]

# Dependency graph
requires:
  - phase: 02
    plan: 01
    provides: "MonumentSchema (shared/schemas.ts) + schema.spec.ts (validación por fichero); enum Motif/PlaceType, Link {ref,label,note}"
  - phase: 02
    plan: 02
    provides: "scripts/migration-diff.ts + tests/data/migration-diff.spec.ts (puerta de fidelidad 1:1 index.html ⇄ YAML por id, con SKIP incremental de ids no migrados)"
  - phase: 02
    plan: 04
    provides: "Patrón de migración de monument ya establecido y harness endurecido para fichas reales (cross-refs como Link arrays, detail-photo MDC inline, culture-box item-cabecera, %27 en mapsQuery, <img alt> simétrico)"
provides:
  - "17 fichas de monumento (lunes/martes) en content/trips/roma/monuments/*.yml validadas contra MonumentSchema y equivalentes 1:1 al index.html (texto + enlaces) por migration-diff"
  - "Los 38 monumentos del viaje quedan migrados (21 en Plan 04 + 17 aquí): schema.spec conteo 38 en VERDE y migration-diff cubre los 38 ids con 0 pérdidas/sobrantes"
affects: [wave-3, plan-fichas-artistas, plan-fichas-gastronomia, verificacion-paridad, fase-4-render, fase-5-navegacion, data-03, data-04, data-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Reutilización 1:1 del patrón de monument del Plan 04 (sin redefinir esquema ni tocar el harness): slug=ancla=basename; sections [{heading,body}] en orden de DOM; body Markdown-inline; detail-photo :detail-photo{src alt caption} MDC inline en su posición exacta; facts/hero/mapsQuery; culture-box como item-cabecera {title,text:''}; coords/day/type/roman desde places; motif desde CARD_TO_MOTIF"
    - "Multi-enlace card-artists/card-arch: el primer Link lleva el prefijo visible (Artistas:/Arquitectura:) + [texto](#ref); cada <a> adicional es un Link sucesivo con sólo [texto](#ref) (minerva 2 artistas, popolo 2, palazzo-barberini 4)"
    - "detail-photo NO siempre en 'En qué fijarse': en tazza-doro vive dentro de 'Anécdotas' (prosa → detail-photo MDC → detail-list → más prosa), reproducido en el orden exacto del DOM dentro del mismo body"
    - "Sección extra sin clase especial: galleria-borghese tiene un card-section '¿Sin entradas? Cómo conseguirlas y Plan B' (prosa + dos detail-list) migrado como una sección heading/body más"
    - "alt de detail-photo transcrito VERBATIM aunque el index.html lo trunque a media palabra (popolo '…se v', spagna '…del Pap') — simetría exacta con el <img alt> que el harness emite del lado HTML"

key-files:
  created:
    - content/trips/roma/monuments/minerva.yml
    - content/trips/roma/monuments/san-luigi.yml
    - content/trips/roma/monuments/casanatense.yml
    - content/trips/roma/monuments/torre-scimmia.yml
    - content/trips/roma/monuments/popolo.yml
    - content/trips/roma/monuments/spagna.yml
    - content/trips/roma/monuments/tazza-doro.yml
    - content/trips/roma/monuments/laterano.yml
    - content/trips/roma/monuments/san-clemente.yml
    - content/trips/roma/monuments/san-pietro-vincoli.yml
    - content/trips/roma/monuments/galleria-borghese.yml
    - content/trips/roma/monuments/palazzo-barberini.yml
    - content/trips/roma/monuments/cappuccini.yml
    - content/trips/roma/monuments/smm.yml
    - content/trips/roma/monuments/santa-teresa.yml
    - content/trips/roma/monuments/palazzo-massimo.yml
    - content/trips/roma/monuments/angeli.yml
  modified: []

key-decisions:
  - "Cero deviaciones de esquema/harness: el patrón y el endurecimiento de scripts/migration-diff.ts del Plan 04 cubren todas las casuísticas de lunes/martes; no hubo que modificar nada de código, sólo transcribir datos fieles"
  - "Inline-anchor del card-artists dentro de facts (san-luigi: 'Caravaggio · ver [ficha en Arte](#art-caravaggio)') transcrito como Markdown en el value para que migration-diff cuente el enlace #art-caravaggio (value NO es clave estructural)"
  - "tazza-doro: 'En qué fijarse' es SÓLO una detail-list (no hay detail-photo ahí); el detail-photo de la ficha está embebido dentro de 'Anécdotas' — respetado el lugar real del DOM, no forzado a la sección de cierre"

patterns-established:
  - "Migración monument 1:1 verificada por doble puerta (schema.spec forma/enum + migration-diff equivalencia texto/enlaces). Con Plan 04 + 05 los 38 monumentos están migrados y ambas puertas verdes para ellos"

requirements-completed: [DATA-04, DATA-06, DATA-01]

# Metrics
duration: 18min
completed: 2026-06-19
---

# Phase 2 Plan 05: Migración 1:1 de 17 fichas de monumento (lunes/martes) Summary

**Las 17 fichas de monumento de lunes y martes (minerva..san-pietro-vincoli + galleria-borghese..angeli) migradas 1:1 a YAML tipado en `content/trips/roma/monuments/` — reutilizando verbatim el patrón del Plan 04: prosa por secciones en Markdown-inline lista para MDC, `detail-photo` como componente inline en su posición exacta del DOM, cross-refs `card-artists`/`card-arch` como arrays de Link (incl. los 4 artistas de Palazzo Barberini), y cada ficha validada contra `MonumentSchema` (DATA-01) y verificada equivalente al `index.html` (texto + enlaces, 0 pérdidas/sobrantes) por `migration-diff` (DATA-04). Con esto, los 38 monumentos del viaje quedan migrados y el conteo de `schema.spec` pasa a verde.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-06-19T09:12Z (approx)
- **Completed:** 2026-06-19T09:30Z
- **Tasks:** 2 (autónomas)
- **Files created:** 17 YAML de monumento
- **Files modified:** 0

## Accomplishments
- **Task 1 — 10 fichas lunes:** minerva, san-luigi, casanatense, torre-scimmia, popolo, spagna, tazza-doro, laterano, san-clemente, san-pietro-vincoli — migradas 1:1.
- **Task 2 — 7 fichas martes:** galleria-borghese, palazzo-barberini, cappuccini, smm, santa-teresa, palazzo-massimo, angeli — migradas 1:1. **Con esto los 38 monumentos quedan migrados.**
- Cada ficha: `type card`, `motif` en el enum (minerva/laterano/san-clemente/cappuccini/smm/angeli church, san-luigi/palazzo-barberini painting, casanatense library, torre-scimmia tower, popolo obelisk, spagna stairs, tazza-doro coffee, san-pietro-vincoli/galleria-borghese/santa-teresa/palazzo-massimo statue), `coords/day/roman` desde `places`.
- **Cross-refs conservados completos** como arrays de Link: minerva (Michelangelo+Bernini / Gótico), san-luigi (Caravaggio), popolo (Caravaggio+Rafael / Neoclásico), spagna (Tardobarroco), laterano (Paleocristiano), san-clemente (Medieval), san-pietro-vincoli (Michelangelo); palazzo-barberini (**Caravaggio+Rafael+Cortona+Borromini** / Barroco), santa-teresa (Bernini / Barroco), smm (Paleocristiano).
- `detail-photo` como `:detail-photo{src alt caption}` MDC inline en su posición exacta — incl. el caso especial de **tazza-doro** (embebido dentro de "Anécdotas", entre prosa y una detail-list) y la sección extra **"¿Sin entradas? Plan B"** de galleria-borghese.
- `culture-box` conservado (spagna, tazza-doro, laterano, galleria-borghese, cappuccini, santa-teresa) como `culture[]` con item-cabecera `{title:'<etiqueta>', text:''}`; `badge` de san-luigi (Caravaggio).
- **DATA-04:** los 17 ids pasan `migration-diff` con 0 palabras/enlaces faltantes o sobrantes. **DATA-01/05:** los 17 validan contra `MonumentSchema` y el conteo agregado (38) está en verde.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1: Migrar lunes (10 monumentos)** — `047c1fa` (feat)
2. **Task 2: Migrar martes (7 monumentos)** — `f1bdc60` (feat)

**Plan metadata:** (commit final docs — este SUMMARY + STATE + ROADMAP + REQUIREMENTS)

## Files Created/Modified
- `content/trips/roma/monuments/*.yml` (17 nuevos) — una ficha de monumento por fichero (objeto YAML), slug = ancla `#id` = basename. Cada una: slug/trip/roman/name/italian/day/coords/type/motif, hero {src,alt}, sections [{heading, body}] en orden de DOM, facts [{label,value}], mapsQuery, y opcionalmente badge/artists[]/arch[]/culture[].
- Ningún fichero de código modificado (el harness del Plan 04 ya estaba endurecido para fichas reales).

## Decisions Made
- **Reutilización verbatim del patrón del Plan 04.** No se redefinió `MonumentSchema` (Plan 01) ni se tocó `scripts/migration-diff.ts` (Plan 02/04): las casuísticas de lunes/martes (multi-artista, culture-box, alt truncado, mapsQuery con apóstrofo) ya estaban cubiertas. El trabajo fue transcripción fiel.
- **Anchor inline dentro de `facts`.** En san-luigi la fila `Artista` contiene `Caravaggio · ver <a href="#art-caravaggio">ficha en Arte</a>`; se transcribe el enlace como Markdown en el `value` (`[ficha en Arte](#art-caravaggio)`) porque `value` no es clave estructural y migration-diff debe contar ese `#art-caravaggio`.
- **`detail-photo` en su posición real del DOM, no forzada.** En tazza-doro el `detail-photo` está dentro de "Anécdotas" (no en "En qué fijarse", que ahí es sólo una lista); se respetó el orden exacto del DOM dentro del body de "Anécdotas" (prosa → :detail-photo → detail-list → prosa).

## Deviations from Plan

None — el plan se ejecutó exactamente como estaba escrito. No hubo que arreglar bugs, añadir funcionalidad crítica ni desbloquear nada: el esquema (Plan 01) y el harness endurecido (Plan 02/04) cubrían todas las casuísticas, y la transcripción de datos fieles pasó ambas puertas sin ajustes de código.

## Issues Encountered
- Ninguno relevante. El conteo `monument: expected 31 to be 38` apareció (esperado) tras escribir sólo el lunes en Task 1, y pasó a verde automáticamente al completar los 7 del martes en Task 2 — comportamiento incremental correcto, no un fallo.

## Cross-plan / Out-of-scope notes (no son fallos de este plan)
- **`tests/data/invariants.spec.ts` (4 rojos)**: el spec de invariantes NO es incremental (carga todas las colecciones y exige que TODA cross-ref resuelva). Sigue rojo porque las colecciones de **artistas** (`art-*`) y **arquitectura** (`arq-*`) y **gastronomía** (`g-*`) aún no existen (otros planes de Wave 3). **Verificado que las 9 anclas distintas que referencian mis 17 fichas (art-bernini/borromini/caravaggio/cortona/michelangelo/rafael, arq-barroco/medieval/moderna) son anclas reales del `index.html`** (`grep id="…"`) → resolverán en verde cuando lleguen las fichas de artistas/arquitectura. La verificación de ESTE plan es `schema.spec && migration-diff.spec` (ambos verdes para los 17/38 ids), no invariants.
- **`day.cards[]` (DATA-03, Fase derivados/render)**: con los 38 monumentos migrados, la "ruta del día" tendrá los 38 ids disponibles; el cableado del orden de cards vive en otra fase.

## Known Stubs
None — las 17 fichas tienen contenido real y completo (texto + enlaces 1:1 con el `index.html`). No hay valores placeholder que lleguen a la UI; el `text: ''` del item-cabecera de `culture-box` es intencional (sólo porta la etiqueta del box en `title`, patrón heredado del Plan 04) y queda documentado.

## Next Phase Readiness
- **38/38 monumentos migrados** (21 Plan 04 + 17 Plan 05). El conteo de `schema.spec` y la cobertura de `migration-diff` para monumentos quedan verdes.
- Quedan en Wave 3 las colecciones de artistas (`art-*`/`arq-*`), gastronomía (`g-*`), reference y days; al completarse, `invariants.spec` resolverá todas las cross-refs (incl. las que apuntan a mis fichas) y el conjunto de datos quedará cerrado para la Fase 4 (render con `<MDC>`) y Fase 5 (navegación).

## Self-Check: PASSED
- 17/17 ficheros de monumento verificados en disco (lunes + martes).
- SUMMARY.md presente.
- Commits `047c1fa` (Task 1) y `f1bdc60` (Task 2) verificados en `git log`.
- `schema.spec.ts` (conteo 38 + 38 validaciones por fichero) y `migration-diff.spec.ts` (49 activos, 0 missing/extra) en verde para los 38 monumentos.
---
*Phase: 02-esquema-de-datos-migraci-n-del-contenido*
*Completed: 2026-06-19*
