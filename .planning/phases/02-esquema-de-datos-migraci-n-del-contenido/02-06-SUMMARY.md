---
phase: 02-esquema-de-datos-migraci-n-del-contenido
plan: 06
subsystem: database
tags: [nuxt-content, yaml, food, gastronomia, migration, data-04, data-06, mdc, fidelity-gate, slugs-generados]

# Dependency graph
requires:
  - phase: 02
    plan: 01
    provides: "FoodSchema (shared/schemas.ts) + schema.spec.ts (validación por fichero, conteo food=26); enum badgeKind, tipo Md"
  - phase: 02
    plan: 02
    provides: "scripts/migration-diff.ts + tests/data/migration-diff.spec.ts (puerta de fidelidad 1:1 index.html ⇄ YAML por id, con SKIP incremental; universo = 21 gastro con id)"
provides:
  - "26 fichas de gastronomía en content/trips/roma/food/*.yml validadas contra FoodSchema (DATA-01) — schema.spec conteo food=26 en VERDE"
  - "Los 21 gastro con id equivalentes 1:1 al index.html (texto + enlaces) por migration-diff (DATA-04, 0 missing/extra)"
  - "Las 5 cards sin id en el HTML (Giolitti, Venchi, Sant'Eustachio, Pompi, Linari) con slug g- estable y referenciable; transcripción verificada a mano (complemento D-08)"
  - "Slugs de food estables y únicos → referenciables por timeline.ref y reservas.table.ref (cross-refs que invariants resolverá)"
affects: [wave-3, plan-fichas-artistas, plan-fichas-dias, verificacion-paridad, fase-4-render, fase-5-navegacion, data-04, data-06, busqueda-minisearch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migración food 1:1: un objeto YAML por gastro-card, basename = slug; group = texto del gastro-section-title contenedor (campo estructural, ORDENA la sección); badge = texto libre del gastro-card-badge; badgeKind = clase badge-* (enum); desc/plato como Markdown-inline (strong→**, em→_) listos para MDC; footer = texto del span horario+precio; itineraryTag = gastro-itinerary-tag; mapsQuery = query del gastro-maps-link"
    - "itineraryTag separado del footer aunque en el HTML va anidado dentro del span del footer: el multiset de palabras del migration-diff cuenta ambos campos como prosa (ninguno es clave estructural), así que la partición no pierde ni añade palabras"
    - "5 cards sin id → slug convención g- + nombre kebab-case (g-giolitti, g-venchi, g-santeustachio-caffe, g-pompi, g-linari); g-santeustachio-caffe no colisiona con el (futuro) monumento santeustachio (colecciones distintas y, además, sufijo -caffe)"
    - "mapsQuery con apóstrofo/è (Sant'Eustachio Il Caffè): se transcribe en claro; encodeMapsQuery del harness reconstruye %27 y encodeURIComponent reconstruye %C3%A8 → href idéntico al del index.html (verificado a mano para las 5 sin id)"

key-files:
  created:
    - content/trips/roma/food/g-felice.yml
    - content/trips/roma/food/g-roscioli.yml
    - content/trips/roma/food/g-fortunata.yml
    - content/trips/roma/food/g-sora-lella.yml
    - content/trips/roma/food/g-mercato-hostaria.yml
    - content/trips/roma/food/g-vecchia-roma.yml
    - content/trips/roma/food/g-armando.yml
    - content/trips/roma/food/g-pollarola.yml
    - content/trips/roma/food/g-matriciana.yml
    - content/trips/roma/food/g-checchino.yml
    - content/trips/roma/food/g-zi-umberto.yml
    - content/trips/roma/food/g-giggetto.yml
    - content/trips/roma/food/g-dar-poeta.yml
    - content/trips/roma/food/g-tonnarello.yml
    - content/trips/roma/food/g-baffetto.yml
    - content/trips/roma/food/g-montecarlo.yml
    - content/trips/roma/food/g-frigidarium.yml
    - content/trips/roma/food/g-fior-di-luna.yml
    - content/trips/roma/food/g-regoli.yml
    - content/trips/roma/food/g-bar-pace.yml
    - content/trips/roma/food/g-bar-musa.yml
    - content/trips/roma/food/g-giolitti.yml
    - content/trips/roma/food/g-venchi.yml
    - content/trips/roma/food/g-santeustachio-caffe.yml
    - content/trips/roma/food/g-pompi.yml
    - content/trips/roma/food/g-linari.yml
  modified: []

key-decisions:
  - "groupIntro NO se pobla en ninguna ficha: los gastro-intro (top-level + quinto quarto + ghetto) son prosa de NIVEL GRUPO/SECCIÓN, fuera del subárbol DOM de cualquier gastro-card. Como el migration-diff es POR CARD (extractFromHtml selecciona el .gastro-card[id]) y groupIntro NO es clave estructural, atarlo a una ficha generaría extraWords y rompería su diff. Decisión fiel al mandato 'fix YAML to match source': el campo queda optional/ausente; el intro de grupo se modelará a nivel de sección gastronómica si una fase futura lo necesita (no hay entidad de sección en este esquema)"
  - "itineraryTag como campo propio (no fundido en footer): en el HTML el gastro-itinerary-tag va dentro del span del footer, pero separarlo es seguro porque el diff compara multiset de palabras de TODA la prosa y ningún campo de los dos es estructural → cero pérdida/adición"
  - "g-bar-musa conserva 'Centro · (dirección por confirmar)' y '(Dirección por confirmar — dime la zona exacta y lo afino.)' VERBATIM del index.html (línea 5810-5813): es texto real de la fuente, exigido por DATA-04 (paridad 1:1), no un stub introducido por la migración"

patterns-established:
  - "Migración food 1:1 verificada por doble puerta: schema.spec (forma/enum/conteo=26) + migration-diff (equivalencia texto/enlaces para los 21 con id). Las 5 sin id, fuera del universo del diff, se cubren con revisión manual (mapsQuery reconstruido 1:1 + name/badge/address contra el DOM)"

requirements-completed: [DATA-04, DATA-06, DATA-01]

# Metrics
duration: 9min
completed: 2026-06-19
---

# Phase 2 Plan 06: Migración 1:1 de las 26 fichas de gastronomía Summary

**Las 26 `gastro-card` de `index.html` (5346-5818) migradas 1:1 a YAML tipado en `content/trips/roma/food/`, una por fichero: prosa (`desc`, `plato`) en Markdown-inline lista para `<MDC>`, cada ficha con su `group` (el `gastro-section-title` que la agrupa y ordena), `badge`/`badgeKind`, `footer` y `mapsQuery`. Los 21 gastro con `id` pasan `migration-diff` con 0 palabras/enlaces faltantes o sobrantes (DATA-04); las 5 sin `id` en el HTML (Giolitti, Venchi, Sant'Eustachio, Pompi, Linari) reciben un slug `g-` estable y se verifican a mano (complemento D-08). Las 26 validan contra `FoodSchema` (DATA-01) y el conteo `food=26` de `schema.spec` pasa a verde.**

## Performance

- **Duration:** ~9 min
- **Completed:** 2026-06-19
- **Tasks:** 2 (autónomas)
- **Files created:** 26 YAML de gastronomía
- **Files modified:** 0

## Accomplishments
- **Task 1 — 17 fichas con id:** pasta clásica (g-felice, g-roscioli, g-fortunata, g-sora-lella, g-mercato-hostaria, g-vecchia-roma, g-armando, g-pollarola, g-matriciana), quinto quarto (g-checchino, g-zi-umberto), ghetto (g-giggetto), pizza (g-dar-poeta, g-tonnarello, g-baffetto, g-montecarlo), gelato (g-frigidarium) — migradas 1:1.
- **Task 2 — 9 fichas restantes:** con id g-fior-di-luna, g-regoli, g-bar-pace, g-bar-musa; **sin id (slug generado)** g-giolitti, g-venchi, g-santeustachio-caffe, g-pompi, g-linari. **Con esto las 26 fichas de gastronomía quedan migradas.**
- **7 grupos (`gastro-section-title`)** asignados como `group` por ficha, verbatim: "Pasta clásica · trattorias históricas", "Quinto quarto · cocina de Testaccio", "Cocina giudaico-romana · Ghetto", "Pizza", "Gelato", "Café · desayuno · pastelería", "Bar · aperitivo · salotto romano".
- **`badge`/`badgeKind`** por ficha: el `badge` lleva el texto libre del `gastro-card-badge` (p. ej. "salumeria + cucina", "trattoria histórica", "caffè storico") y `badgeKind` la clase CSS (`trattoria`/`deli`/`quinto`/`ghetto`/`pizza`/`gelato`/`caffe`/`pasticceria`).
- **Prosa MDC-ready (DATA-06):** `desc` y `plato` con `**…**`/`_…_` (Stanley Tucci en g-armando/g-matriciana; _Bianco, Rosso e Verdone_ en g-sora-lella; _Vacaciones en Roma_ en g-giolitti; la cita de Enric González con comillas «» y **negrita** en g-bar-pace).
- **DATA-04:** los 21 ids con ancla pasan `migration-diff` (0 missing/extra, texto + enlaces). Las 5 sin id verificadas a mano: `mapsQuery` reconstruye el href de Maps idéntico al del HTML (incl. apóstrofo `%27` y `è`→`%C3%A8` en Sant'Eustachio) y `name`/`badge`/`address` casan 1:1 con el DOM.
- **DATA-01/05:** las 26 validan contra `FoodSchema`; `schema.spec` conteo `food=26` en verde. Slugs únicos (26/26) y estables → referenciables por `timeline.ref`/`reservas.table.ref`.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1: 17 fichas gastro con id** — `90e3eb5` (feat)
2. **Task 2: 9 fichas restantes (incl. 5 sin id)** — `48e5e51` (feat)

**Plan metadata:** commit final docs — este SUMMARY + STATE + ROADMAP + REQUIREMENTS + deferred-items.md.

## Files Created/Modified
- `content/trips/roma/food/*.yml` (26 nuevos) — una ficha de gastronomía por fichero (objeto YAML), basename = slug. Cada una: slug/trip/group/badge/badgeKind/name/address/desc/footer/mapsQuery, y opcionalmente plato/itineraryTag.
- Ningún fichero de código modificado (el esquema del Plan 01 y el harness del Plan 02 cubrían food sin ajustes).

## Decisions Made
- **`groupIntro` no se pobla en ninguna ficha.** Los `gastro-intro` (el de cabecera de sección en 5340 + los de quinto quarto 5501 y ghetto 5541) son prosa de nivel grupo/sección, NO contenida en el subárbol DOM de ninguna `gastro-card`. El `migration-diff` es por card (`extractFromHtml` selecciona el `.gastro-card[id]`) y `groupIntro` no está en `STRUCTURAL_KEYS`, así que atarlo a una ficha haría que esas palabras aparecieran como sobrantes (`extraWords`) y rompería el diff de esa ficha. Fiel al mandato "fix YAML to match source", el campo queda `optional`/ausente; un intro de grupo se modelaría a nivel de sección gastronómica en una fase futura (este esquema no tiene entidad de sección gastro).
- **`itineraryTag` como campo propio** aunque en el HTML va anidado dentro del span del footer: separarlo es seguro porque el diff compara multiset de palabras de toda la prosa y ni `footer` ni `itineraryTag` son estructurales → 0 palabras perdidas/añadidas. (En g-zi-umberto el `gastro-itinerary-tag` va dentro del `gastro-plato`, no del footer; el campo lo recoge igual y el multiset cuadra.)
- **g-bar-musa preserva el texto "dirección por confirmar" verbatim** del `index.html`: es contenido real de la fuente (la card original ya tiene la dirección sin confirmar), exigido por DATA-04, no un placeholder introducido aquí.

## Deviations from Plan

None — el plan se ejecutó como estaba escrito. No hubo bugs que arreglar, funcionalidad crítica que añadir ni bloqueos. El esquema `FoodSchema` (Plan 01) y el harness `migration-diff` (Plan 02) cubrían la gastronomía sin tocar código; el trabajo fue transcripción fiel + las decisiones de discreción ya previstas por el plan (slug de las 5 sin id, modelado de group). La no-población de `groupIntro` es una decisión de modelado documentada arriba, no una desviación del alcance.

## Issues Encountered
- Ninguno relevante. El conteo `food: expected 17 to be 26` apareció (esperado) tras escribir sólo los 17 con id en Task 1, y pasó a verde automáticamente al completar los 9 restantes en Task 2 — comportamiento incremental correcto, no un fallo. Por eso la cadena de verify de Task 1 (`schema.spec && migration-diff`) no podía estar 100% verde a mitad (el gate de conteo sólo cierra con las 26); la fidelidad por ficha (migration-diff de los 17) sí estaba verde en Task 1.

## Cross-plan / Out-of-scope notes (no son fallos de este plan)
- **`tests/data/invariants.spec.ts` (3 rojos)**: el spec de invariantes NO es incremental (carga todas las colecciones y exige que TODA cross-ref resuelva). Los 3 rojos son `monument.artists[].ref → artist`, `monument.arch[].ref → artist` y `[texto](#id) → slug`, todos por la colección de **artistas** (`art-*`/`arq-*`) que **aún no existe** (`content/trips/roma/artists/` ausente — otro plan de Wave 3). **Ninguna ficha de `food` aparece en los fallos**; los tests `reservas.table[].ref → food` y `timeline[stop|food].ref → … | food` están en VERDE. Resolverá automáticamente al migrar artists. Registrado en `deferred-items.md`. La verificación de ESTE plan es `schema.spec && migration-diff` (ambos verdes para food), no invariants.
- **Búsqueda MiniSearch / render con `<MDC>`**: con las 26 fichas migradas, los campos `name`/`desc`/`plato`/`group` quedan disponibles para indexar (Fase futura) y la prosa lista para renderizar; el cableado vive en Fase 4/posterior.

## Known Stubs
None introducidos por la migración. Las 26 fichas portan contenido real y completo (texto + enlaces 1:1 con el `index.html`). El texto "dirección por confirmar" de g-bar-musa es de la FUENTE (documentado arriba), no un stub de la migración; se resolverá cuando se confirme la dirección en el contenido original.

## Next Phase Readiness
- **26/26 fichas de gastronomía migradas** (17 Task 1 + 9 Task 2). `schema.spec` conteo `food=26` verde y `migration-diff` cubre los 21 con id con 0 pérdidas/sobrantes; las 5 sin id verificadas a mano.
- Quedan en Wave 3 las colecciones de **artistas** (`art-*`/`arq-*`) y **days** (+ trip ya migrado, reference). Al completarse artists, `invariants.spec` resolverá las cross-refs hoy rojas. Al completarse days, los `timeline.ref`/`reservas.table.ref` que apuntan a mis slugs `g-*` quedarán resueltos, cerrando el conjunto de datos para la Fase 4 (render `<MDC>`) y la Fase 5 (navegación + búsqueda).

## Self-Check: PASSED
- 26/26 ficheros de gastronomía verificados en disco.
- SUMMARY.md presente.
- Commits `90e3eb5` (Task 1) y `48e5e51` (Task 2) verificados en `git log`.
- `schema.spec.ts` (conteo food=26 + 26 validaciones por fichero) y `migration-diff.spec.ts` (21 gastro con id activos, 0 missing/extra) en verde para food. Las 5 sin id verificadas a mano (mapsQuery 1:1 + campos).
---
*Phase: 02-esquema-de-datos-migraci-n-del-contenido*
*Completed: 2026-06-19*
