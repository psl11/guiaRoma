---
phase: 02-esquema-de-datos-migraci-n-del-contenido
plan: 07
subsystem: database
tags: [nuxt-content, yaml, zod, artist-card, glossary, reservas, practica, migration-diff, invariants, cross-refs]

# Dependency graph
requires:
  - phase: 02-01
    provides: ArtistSchema (discriminatedUnion artist|arquitectura|glossary) + ReferenceSchema (reservas+practica) en shared/schemas.ts; schema.spec + invariants.spec
  - phase: 02-02
    provides: harness scripts/migration-diff.ts + migration-diff.spec (puerta de fidelidad 1:1 D-08)
  - phase: 02-04
    provides: monuments con artists[]/arch[] (refs a #art-*/#arq-*) que ahora resuelven
  - phase: 02-05
    provides: días con timeline/cards y referencias inline #gastronomia
provides:
  - 13 artist-cards migrados 1:1 (7 art-* kind artist, 5 arq-* kind arquitectura, arq-glosario kind glossary)
  - content/trips/roma/reference/reservas.yml (confirmed mesas/visitas + table tipada con badge/estado)
  - content/trips/roma/reference/practica.yml (prosa por secciones + media curada libros/peliculas/series/playlist)
  - Corpus de contenido COMPLETO: 38 monuments + 26 food + 13 artists + 5 days + 2 reference + 1 trip
  - pnpm test:data 100% verde (schema + migration-diff + invariants) con TODOS los cross-refs resueltos
affects: [03-pagina-layout-tema, 04-render-modos, 05-navegacion, 08-verificacion-paridad]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "seenIn (Link): ref = slug pelado; label/note llevan la prosa del bloque artist-trip (cabecera ✦, separadores, texto conectivo y negritas sin ancla como **Vaticano**) → migration-diff captura texto+enlaces sin perder nada"
    - "archLink INLINE en el body de la prosa (arq-barroco → #art-bernini/#art-borromini); NO campo aparte (invariants escanea las anclas Md)"
    - "Anclas de SECCIÓN de página (#inicio/#mapa/#arte/#arquitectura/#gastronomia) reconocidas como landings navegacionales, no slugs de entidad"

key-files:
  created:
    - content/trips/roma/artists/art-bernini.yml
    - content/trips/roma/artists/art-caravaggio.yml
    - content/trips/roma/artists/art-michelangelo.yml
    - content/trips/roma/artists/art-rafael.yml
    - content/trips/roma/artists/art-borromini.yml
    - content/trips/roma/artists/art-cortona.yml
    - content/trips/roma/artists/art-pozzo.yml
    - content/trips/roma/artists/arq-antigua.yml
    - content/trips/roma/artists/arq-medieval.yml
    - content/trips/roma/artists/arq-renacimiento.yml
    - content/trips/roma/artists/arq-barroco.yml
    - content/trips/roma/artists/arq-moderna.yml
    - content/trips/roma/artists/arq-glosario.yml
    - content/trips/roma/reference/reservas.yml
    - content/trips/roma/reference/practica.yml
  modified:
    - scripts/migration-diff.ts
    - shared/schemas.ts
    - tests/data/invariants.spec.ts

key-decisions:
  - "Avatar de artist-card es estructural en AMBOS lados del diff: se excluye de la extracción HTML (.artist-avatar como chrome) igual que STRUCTURAL_KEYS ya lo excluía en YAML"
  - "El texto de cabecera/conector del bloque seenIn (✦ Lo verás…, 'y, con guía, … Vaticano') vive en label/note de los Link; las negritas sin ancla NO generan link extra"
  - "reservas.table.badge/badgeKind pasan a optional: la fila 'Sin reserva (hacer cola)' del index.html no lleva reservas-badge"
  - "Anclas de sección de página sin entidad de respaldo (#gastronomia, #arte, #arquitectura, #inicio, #mapa) se aceptan en el invariante de anclas inline (Fase 4/5 las renderiza como landings)"

patterns-established:
  - "Discriminador kind unifica art-*/arq-*/glosario en una sola colección artist; arq-medieval con 2 secciones (sin 'Por qué importa') fiel al DOM"
  - "reference: shape bespoke por slug literal (reservas/practica), datos tipados para badges/estado (D-03), prosa por sections + media curada"

requirements-completed: [DATA-04, DATA-06, DATA-01]

# Metrics
duration: 14min
completed: 2026-06-19
---

# Phase 2 Plan 07: Migración de artistas/arquitectura/glosario + reservas/práctica Summary

**13 artist-cards (7 arte + 5 arquitectura + glosario) discriminados por `kind`, más reservas (tabla tipada con badge/estado) y práctica (prosa + listas curadas), cerrando el corpus de contenido con `pnpm test:data` 100% verde y todos los cross-refs resueltos.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-06-19T09:42Z
- **Completed:** 2026-06-19T09:56Z
- **Tasks:** 3
- **Files modified:** 18 (15 YAML creados + 3 TS modificados)

## Accomplishments
- Los 7 artistas de arte (`art-bernini`…`art-pozzo`, kind `artist`) migrados 1:1, con `sections` en orden DOM y `seenIn` conservando todos los enlaces a monumentos.
- Las 5 edades de arquitectura (kind `arquitectura`) y el glosario (kind `glossary`, 10 `terms`); `arq-barroco` mantiene los `archLink` a `#art-bernini`/`#art-borromini` INLINE en el body.
- `reservas.yml` (confirmadas mesas/visitas + tabla "cuándo reservar" tipada) y `practica.yml` (9 secciones + 4 categorías de media) migradas 1:1.
- **FINAL-PLAN GATE**: `pnpm test:data` (schema + migration-diff + invariants) en verde con 281 tests, 0 fallos, 0 skips — el corpus entero (85 ficheros) está migrado y todos los cross-refs resuelven.

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrar los 7 artistas de arte (kind artist)** - `de575b4` (feat)
2. **Task 2: Migrar 5 edades de arquitectura + glosario** - `a84f1ed` (feat)
3. **Task 3: Migrar reservas.yml y practica.yml (reference)** - `1270403` (feat)

**Plan metadata:** (este commit) `docs(02-07)`

## Files Created/Modified
- `content/trips/roma/artists/art-*.yml` (7) - Artistas de arte (kind artist): head, sections heading/body, seenIn a monumentos.
- `content/trips/roma/artists/arq-{antigua,medieval,renacimiento,barroco,moderna}.yml` (5) - Edades de arquitectura (kind arquitectura); arq-barroco con archLink inline.
- `content/trips/roma/artists/arq-glosario.yml` - Glosario (kind glossary): 10 terms term/def, sin seenIn.
- `content/trips/roma/reference/reservas.yml` - Reservas confirmadas + tabla con badge/badgeKind/isDone (datos tipados).
- `content/trips/roma/reference/practica.yml` - Manual de supervivencia (prosa por secciones) + media curada.
- `scripts/migration-diff.ts` - Excluir `.artist-avatar` de la extracción HTML (simetría con avatar estructural).
- `shared/schemas.ts` - `reservas.table.badge`/`badgeKind` → optional.
- `tests/data/invariants.spec.ts` - Allow-list de anclas de sección de página en el invariante de anclas inline.

## Decisions Made
- **Avatar simétrico**: `avatar` ya estaba en `STRUCTURAL_KEYS` (excluido del texto YAML) pero la extracción HTML lo emitía → cada inicial (B/IV/?) aparecía como "texto faltante" en las 13 fichas. Se excluye `.artist-avatar` del lado HTML para que la comparación sea simétrica (es un elemento decorativo/estructural, no prosa).
- **seenIn como portador de prosa**: la cabecera "✦ Lo verás/Dónde la verás en este viaje" y el texto conectivo ("y, con guía, … **Vaticano**") se reparten en `label`/`note` de los `Link`; cada `<a>` produce una entrada con `ref` (slug) + `[texto](#ref)`. Las negritas sin ancla (Vaticano) NO crean link extra.
- **badge/badgeKind optional**: la fila "Sin reserva (hacer cola)" del `index.html` no lleva `reservas-badge`; relajar el esquema es la representación fiel (las demás filas conservan badge+badgeKind).
- **Anclas de sección**: `#gastronomia` (y por extensión `#arte`/`#arquitectura`/`#inicio`/`#mapa`) son landings de `<section>` del SPA, no entidades; se aceptan en el invariante de anclas inline sin perder dientes (una ancla de entidad mal escrita sigue fallando).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Asimetría del avatar en el harness de migration-diff**
- **Found during:** Task 1 (primer artista, art-bernini)
- **Issue:** `avatar` está en `STRUCTURAL_KEYS` (excluido del texto en el lado YAML) pero `extractFromHtml` incluía el texto del `.artist-avatar`; la inicial (p.ej. "b") aparecía como `missingWord` en las 13 artist-cards.
- **Fix:** Añadir `.artist-avatar` al `CHROME_SELECTOR` para que la extracción HTML lo descarte, dejando la comparación simétrica.
- **Files modified:** scripts/migration-diff.ts
- **Verification:** art-bernini pasa migration-diff (de `missingWords:["b"]` a 0); los 71 fixtures del normalizador siguen verdes.
- **Committed in:** `de575b4` (Task 1)

**2. [Rule 2 - Missing Critical] reservas.table.badge/badgeKind no representaban la fila sin badge**
- **Found during:** Task 3 (reservas.yml)
- **Issue:** La fila "Sin reserva (hacer cola)" del `index.html` no tiene `reservas-badge`; el esquema exigía `badge: string` y `badgeKind: enum`, impidiendo migrar la fila 1:1 (DATA-04).
- **Fix:** `badge` y `badgeKind` → `.optional()` en `ReservasSchema`. Las 10 filas con badge no cambian.
- **Files modified:** shared/schemas.ts
- **Verification:** schema.spec verde (incl. el fixture de reservas con table:[]); reservas valida.
- **Committed in:** `1270403` (Task 3)

**3. [Rule 3 - Blocking] Ancla inline #gastronomia rompía el invariante (gate final)**
- **Found during:** Task 3 (al ejecutar el gate completo `pnpm test:data`)
- **Issue:** Con todas las colecciones presentes, el invariante de anclas inline detectó `#gastronomia` en 4 ficheros `days/*.yml` (migrados en planes previos): es una ancla de `<section id="gastronomia">`, no un slug de entidad — bloqueaba el FINAL-PLAN GATE.
- **Fix:** Allow-list `PAGE_SECTIONS = {inicio, mapa, arte, arquitectura, gastronomia}` en el invariante; un `#id` resuelve si es slug O sección de página. Los días/`reservas`/`practica` siguen resolviendo como slugs.
- **Files modified:** tests/data/invariants.spec.ts
- **Verification:** `pnpm test:data` 281/281 verde; el fixture negativo de la puerta sigue detectando anclas de entidad rotas.
- **Committed in:** `1270403` (Task 3)

---

**Total deviations:** 3 auto-fixed (1 bug, 1 missing critical, 1 blocking)
**Impact on plan:** Las 3 correcciones son necesarias para la fidelidad 1:1 (DATA-04) y para cerrar el gate final; ninguna toca el contenido del `index.html` (solo-lectura) ni añade scope. La relajación del esquema y la allow-list de secciones no debilitan los gates (los fixtures negativos siguen con dientes).

## Issues Encountered
- **YAMLParseError "Nested mappings are not allowed in compact mappings"** en 5 ficheros (art-borromini, art-pozzo, arq-barroco, arq-medieval, arq-renacimiento): los `epithet` con `: ` interno (p.ej. «El rival oscuro de Bernini: geometría…») se interpretaban como mapping anidado. Resuelto entrecomillando esos valores. Trabajo planificado (transcripción), no desviación.

## Threat Flags

Ninguna superficie de seguridad nueva. Creación de datos para sitio estático (sin runtime/red/entrada de usuario). El único vector (fidelidad de transcripción + resolución de cross-refs, T-02-21) queda cubierto por migration-diff (texto+enlaces por id) y invariants (seenIn/table.ref/archLink inline), ambos en verde.

## Next Phase Readiness
- **Corpus de contenido COMPLETO y validado**: 85 ficheros (38 monuments + 26 food + 13 artists + 5 days + 2 reference + 1 trip); `pnpm test:data` 100% verde con todos los cross-refs resueltos. Fase 02 cerrada.
- **Listo para Fase 03** (página/layout/tema): los datos tipados y la prosa Markdown-inline (`<MDC>`) están disponibles vía `queryCollection`. La isla de mapa (Fase 7) consumirá `coords`/`map` ya migrados.
- **Para Fase 4/5**: las anclas de sección de página (#arte/#arquitectura/#gastronomia/#inicio/#mapa) deberán renderizarse como landings de `<section>`; el resto de `#id` son slugs de entidad direccionables.

## Self-Check: PASSED

- 15 ficheros de contenido creados — todos presentes en disco.
- 02-07-SUMMARY.md presente.
- 3 commits de tarea (de575b4, a84f1ed, 1270403) verificados en git log.
- `pnpm test:data` 281/281 verde (schema + migration-diff + invariants).

---
*Phase: 02-esquema-de-datos-migraci-n-del-contenido*
*Completed: 2026-06-19*
