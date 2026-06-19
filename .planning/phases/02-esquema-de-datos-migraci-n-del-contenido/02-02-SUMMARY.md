---
phase: 02-esquema-de-datos-migraci-n-del-contenido
plan: 02
subsystem: build-test
tags: [cheerio, vitest, migration-diff, fidelity-gate, data-04, d-07, d-08, normalizer]

# Dependency graph
requires:
  - phase: 02
    plan: 01
    provides: "cheerio@1.2.0 + vitest@4.1.9 instalados; vitest.config.ts (runner tests/data); convencion de cabecera en espanol + node: imports; tests/data se lintea como fuente TS"
provides:
  - "scripts/migration-diff.ts: harness cheerio — extractFromHtml(id) (texto visible Markdown + Set de href), normalize(s) (D-08), diffEntry(id, yaml) (multiset de palabras + conjunto de enlaces), hasYaml/resolveYamlPath (SKIP), bootstrapDraft (D-07)"
  - "tests/data/migration-diff.spec.ts: puerta DATA-04 — equivalencia normalizada index.html ⇄ YAML por id; SKIP por id sin YAML (sin false-red entre planes de Wave 3 en paralelo); normalizador + fixture negativo siempre corren"
  - "tercer runner de tests/data en verde (3 files, 40 passed | 79 skipped); la fidelidad 1:1 de cada id migrado en Wave 3 tendra feedback automatico inmediato"
affects: [migracion-roma, wave-3, verificacion-paridad, data-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "harness cheerio que trata index.html como FUENTE inmutable solo-lectura (clone para retirar chrome sin tocar el DOM fuente)"
    - "equivalencia D-08 por MULTISET de palabras (texto, robusto a reordenacion/reparto entre campos) + CONJUNTO de href (enlaces); no byte-exacto"
    - "exclusion de chrome de UI del texto (notes-area, etiqueta del boton Maps) capturando aun su href; denylist de claves estructurales en el lado YAML"
    - "reconstruccion del enlace de Maps desde mapsQuery (MAPS_PREFIX + encodeURIComponent) para casar el href externo del HTML"
    - "SKIP-por-id via helper de existencia del harness: spec incremental que no se hace false-red mientras Wave 3 migra en paralelo"

key-files:
  created: [scripts/migration-diff.ts, tests/data/migration-diff.spec.ts]
  modified: []

key-decisions:
  - "Equivalencia de TEXTO por multiset de palabras normalizadas (no string byte-exacto): D-08 permite cambiar markup y reparto entre campos; lo prohibido es perder/anadir texto. El multiset detecta una frase perdida o sobrante sin false-positive por reordenacion"
  - "Equivalencia de ENLACES por conjunto de href: externos (http) tal cual + anclas internas (#id) de la prosa Markdown + Maps reconstruido desde mapsQuery. Se comparan CONJUNTOS, no posiciones"
  - "Chrome de UI excluido del texto: .notes-area ('Notas in situ' + textarea, Fase 7) y la ETIQUETA del boton Maps ('Ver en Google Maps'/'📍 Google Maps', la genera el componente en Fase 4) NO son prosa migrada — pero el href del boton SI se captura como enlace"
  - "Lado YAML: denylist de claves estructurales (slug/trip/id/ref/href/src/mapsQuery + enums motif/type/kind/variant/level/category/badgeKind/group + lat/lng/zoom/icon/avatar) excluidas del multiset de texto; el resto (incl. alt/caption/name/italian/roman/badge) cuenta como visible. Denylist pequena y estable > allowlist fragil"
  - "Universo del diff = 72 anclas del index.html (38 monumentos + 21 gastro CON id + 13 artist-cards). Los 5 gastro-cards SIN id (Giolitti, Venchi, Sant'Eustachio, Pompi, Linari) no son direccionables por ancla; su fidelidad la cubre la revision manual de D-08 (complementaria)"
  - "Helper de existencia (hasYaml/resolveYamlPath) busca <id>.yml en monuments/food/artists/reference/days; el spec SKIPea el id si no existe → spec incremental sin false-red entre los 4 planes de migracion de Wave 3 en paralelo"

patterns-established:
  - "Puerta de fidelidad analoga en ETHOS al golden de paridad (index.html = fuente de verdad), pero comparando texto+enlaces normalizados (no pixeles); Vitest, no Playwright"
  - "Casos del normalizador + fixture negativo SIEMPRE corren (nunca verde vacuo); el diff por id es lo unico que SKIPea"
  - "index.html SOLO-LECTURA: el harness lo lee una vez y clona los nodos para retirar chrome, garantizando que la fuente nunca se muta"

requirements-completed: [DATA-04]

# Metrics
duration: 9min
completed: 2026-06-19
---

# Phase 2 Plan 02: Harness de fidelidad 1:1 (DATA-04 / D-07-D-08) Summary

**El harness cheerio (scripts/migration-diff.ts) extrae del index.html — por id de ficha — el texto visible (con strong/em/a → Markdown) y el conjunto de href (Maps externos + anclas #id), lo normaliza según D-08 y lo diffea contra el YAML migrado; el spec tests/data/migration-diff.spec.ts es la puerta dura de DATA-04 que detecta texto/enlaces perdidos o sobrantes por id y SKIPea los ids aún no migrados (sin false-red entre los planes de Wave 3 en paralelo) — verde con el normalizador y el fixture negativo antes de migrar un solo YAML.**

## Performance

- **Duration:** ~9 min
- **Tasks:** 2 (ambas TDD)
- **Files created:** 2
- **Files modified:** 0

## Accomplishments

- **scripts/migration-diff.ts** — harness de extracción + normalizador + diff (D-07/D-08):
  - `extractFromHtml(id)` selecciona el contenedor (`article.card` | `.gastro-card` | `article.artist-card`) por id y devuelve `{ text, links }`: texto visible con `<strong>/<b>` → `**…**`, `<em>/<i>` → `_…_`, `<a href>` → `[texto](href)`; y un `Set` de href (externos http + anclas internas `#id`). El texto se extrae recorriendo el DOM con cheerio (NO regex sobre HTML — Pitfall 4 / RESEARCH Don't Hand-Roll).
  - `normalize(s)` aplica las reglas mínimas D-08: strong/em HTML → Markdown (idempotente si ya viene en Markdown), decodifica entidades comunes (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, `&nbsp;` + numéricas), colapsa todo whitespace.
  - `diffEntry(id, yamlObj)` normaliza ambos lados y devuelve `{ missingWords, extraWords, missingLinks, extraLinks }`: texto por MULTISET de palabras, enlaces por CONJUNTO de href. Vacío = equivalencia (D-08). `isEquivalent(d)` resume.
  - `hasYaml(id)` / `resolveYamlPath(id)` — helper de existencia (busca `<id>.yml` en monuments/food/artists/reference/days) para que el spec SKIPee los ids no migrados.
  - `bootstrapDraft(id)` (opcional, D-07) — vuelca un borrador YAML desde el HTML para acelerar la transcripción de Wave 3.
  - index.html se lee SOLO-LECTURA y se CLONA antes de retirar el chrome → la fuente nunca se muta.
- **tests/data/migration-diff.spec.ts** — puerta DATA-04:
  - 5 casos del normalizador (entidades, strong/em, espacios, idempotencia, textMultiset ignora énfasis/enlaces) que SIEMPRE corren.
  - 5 casos de fidelidad/fixture negativo que SIEMPRE corren: YAML fiel ⇒ equivalente; YAML sin `mapsQuery` ⇒ reporta el href de Maps faltante; YAML con una frase de menos ⇒ reporta palabras faltantes; YAML sin la ancla `#arq-moderna` ⇒ reporta el enlace faltante; `yamlLinks` reconstruye el Maps href igual que el del HTML.
  - Diff por id sobre las 72 anclas del index.html: con YAML presente ⇒ aserta cero faltantes/sobrantes (texto + enlaces); sin YAML ⇒ `it.skip` explícito (semántica OBLIGATORIA: sin ella, los 4 planes de migración de Wave 3 en paralelo se harían false-red por los ids que otro plan aún no migró).
  - Nunca verde vacuo: 11 casos corren ahora; los 72 diffs por id están en SKIP hasta que Wave 3 migre.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1: Harness cheerio de extracción + normalizador + diff** — `2393c59` (feat)
2. **Task 2: Spec de diff de migración (puerta DATA-04)** — `06495f3` (test)

_Tareas TDD: Task 1 RED = el módulo `scripts/migration-diff` no resolvía (ERR_MODULE_NOT_FOUND) → GREEN = harness con sus funciones puras verificadas (extracción de las 7 fichas-tipo, normalizador, diff con teeth). Task 2 RED/GREEN = el spec ata esas funciones a la puerta; el normalizador y el fixture negativo prueban el rechazo de pérdidas ANTES de que Wave 3 migre._

## Files Created/Modified

- `scripts/migration-diff.ts` (NEW) — harness cheerio: `extractFromHtml`, `normalize`, `textMultiset`, `collectStrings`/`collectProseStrings`, `yamlLinks`, `yamlText`, `diffEntry`, `isEquivalent`, `hasYaml`/`resolveYamlPath`, `htmlHasId`/`knownHtmlIds`, `bootstrapDraft`. Lee index.html una vez (solo-lectura).
- `tests/data/migration-diff.spec.ts` (NEW) — puerta DATA-04: normalizador (siempre) + fixture negativo (siempre) + diff por id con SKIP por id sin YAML.

## Decisions Made

- **Texto por multiset de palabras, no string byte-exacto.** D-08 permite que cambie el markup y que la prosa se reparta entre otros campos/orden; lo prohibido es perder o añadir texto. Un multiset de palabras normalizadas detecta una frase perdida (palabras faltantes) o sobrante (palabras extra) sin dar false-positive por reordenación o por cómo el YAML reparta la prosa en `sections`/`facts`/`badge`/etc.
- **Enlaces por conjunto de href.** Externos (http) tal cual; anclas internas (`#id`) extraídas de la prosa Markdown de cualquier campo; Maps reconstruido desde `mapsQuery` (`MAPS_PREFIX + encodeURIComponent(q)`, idéntico al href del HTML). Se comparan CONJUNTOS, no posiciones.
- **Chrome de UI fuera del texto.** `.notes-area` (Fase 7) y la ETIQUETA del botón de Maps (la genera el componente en Fase 4) no son prosa migrada y se retiran del texto; el href del botón SÍ se captura como enlace. El `card-roman`, `card-badge`, `h3`, `card-italian` SÍ cuentan (son contenido visible que el YAML guarda en `roman`/`badge`/`name`/`italian`).
- **Denylist de claves estructurales en el lado YAML.** `slug/trip/id/ref/href/src/mapsQuery` + enums (`motif/type/kind/variant/level/category/badgeKind/group`) + numéricos/iconos (`lat/lng/zoom/order/icon/avatar`) se excluyen del multiset de texto (algunas ya participan como enlaces). `alt`/`caption` SÍ cuentan (texto visible). Denylist pequeña y estable > allowlist por-shape frágil.
- **Universo = 72 anclas del index.html.** 38 monumentos + 21 gastro CON id + 13 artist-cards. Los 5 gastro-cards SIN id (Giolitti, Venchi, Sant'Eustachio, Pompi, Linari) no son direccionables por ancla; reciben slug generado en Wave 3 y su fidelidad la cubre la revisión manual de D-08 (02-VALIDATION.md 75-79, complementaria a esta puerta).

## Deviations from Plan

None - el plan se ejecutó exactamente como estaba escrito. `cheerio` y `vitest` ya estaban instalados (Wave 1), así que no hubo instalación de paquetes. El manejo de chrome de UI y la denylist de claves estructurales son parte de implementar correctamente "normalize según D-08" y "comparar conjuntos de enlaces" (refinamientos DENTRO del diseño de la Task 1, verificados antes de commitear), no desviaciones del plan.

## Issues Encountered

- **Falsos positivos de `extraWords` en la verificación inicial.** Al verificar el diff con un fixture ingenuo, `slug`/`mapsQuery` y la duplicación de `name`/`italian` con el cuerpo de prosa generaban "palabras sobrantes". Diagnóstico: el lado YAML contaba strings estructurales como texto visible. Resuelto con la denylist de claves estructurales + la exclusión de chrome del lado HTML (notes-area, etiqueta Maps). Tras el fix, el roundtrip fiel de las 7 fichas-tipo (monumento simple, con cross-refs, artista, glosario, gastro, guiada, concierto) da fidelidad de texto perfecta y el diff conserva los dientes (detecta enlace/frase/ancla faltantes).

## User Setup Required

None - harness de build-time para un sitio estático. Sin runtime, sin red, sin entrada de usuario, sin secretos. El index.html es del propio repo (no contenido remoto) y se lee solo-lectura. Threat model: la única integridad relevante (fidelidad de la transcripción, T-02-05) la garantiza este propio diff; cadena de suministro de cheerio (T-02-06) mitigada en el Plan 01 (lockfile, paquete canónico).

## Next Phase Readiness

- **Wave 3 (migración del contenido) tiene su red de fidelidad lista.** En cuanto un plan de Wave 3 escriba `monuments/<id>.yml` (o food/artists/reference), el `it` correspondiente de migration-diff.spec se ACTIVA y aserta equivalencia de texto+enlaces contra el index.html; mientras tanto los ids no migrados quedan en SKIP. Los 4 planes de migración pueden correr en paralelo sin hacerse false-red entre sí.
- **Junto a schema.spec (DATA-05) e invariants.spec (SC#4), las tres puertas de `tests/data/` cubren forma+enums, cross-refs y fidelidad 1:1.** `pnpm test:data` es la puerta de datos completa.
- **Sin blockers.** El harness expone `bootstrapDraft(id)` por si Wave 3 quiere arrancar los borradores YAML desde el HTML.

---
*Phase: 02-esquema-de-datos-migraci-n-del-contenido*
*Completed: 2026-06-19*

## Self-Check: PASSED

- Ficheros creados verificados en disco: scripts/migration-diff.ts, tests/data/migration-diff.spec.ts, .planning/phases/02-esquema-de-datos-migraci-n-del-contenido/02-02-SUMMARY.md
- Commits de tarea verificados en git log: 2393c59 (feat harness), 06495f3 (test puerta)
- Puertas en verde: `pnpm test:data` → 3 files, 40 passed | 79 skipped; `pnpm typecheck` exit 0; `pnpm exec eslint scripts/migration-diff.ts tests/data/migration-diff.spec.ts` exit 0; index.html sin modificar (solo-lectura).
