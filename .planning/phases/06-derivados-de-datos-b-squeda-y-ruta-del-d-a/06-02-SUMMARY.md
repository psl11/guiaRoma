---
phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a
plan: 02
subsystem: ui
tags: [minisearch, search, client-search, pure-util, vitest, typescript]

# Dependency graph
requires:
  - phase: 02-modelo-de-datos
    provides: "MonumentSchema / Monument type (slug, name, italian, roman, day, badge, sections, facts, sorrentino, culture, artists, arch) en shared/schemas.ts"
  - phase: 05-navegacion-transversal
    provides: "patrón de util PURO auto-importado (cardNav.ts) testeado en Vitest plano sin @nuxt/test-utils"
provides:
  - "app/utils/searchIndex.ts: buildHaystack(Monument) — haystack SUPERCONJUNTO de card.textContent (SC#1)"
  - "app/utils/searchIndex.ts: createSearchIndex(Monument[]) — fábrica pura → MiniSearch configurado (prefix + soft fuzzy + name/italian boosted, monuments-only)"
  - "cobertura Vitest plana del superconjunto del haystack + query-devuelve-slug + storeFields + prefijo"
affects: [06-04-busqueda-reactiva-cliente, busqueda, search-dropdown]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Búsqueda data-driven: haystack derivado de datos tipados (no DOM-scrape) + índice invertido MiniSearch"
    - "Fábrica pura datos→MiniSearch en app/utils/, testeable en Vitest plano (mismo molde que cardNav.ts/pace.ts/tripIndexes.ts)"

key-files:
  created:
    - app/utils/searchIndex.ts
    - tests/unit/searchIndex.spec.ts
  modified: []

key-decisions:
  - "buildHaystack es DELIBERADAMENTE un SUPERCONJUNTO de card.textContent (name/italian/roman + badge + sections[].heading/body + facts[].label/value + sorrentino.label/text + culture[].title/text + artists[]/arch[].label/note); un subconjunto regresaría SC#1 (Pitfall 1)"
  - "Markdown crudo se concatena sin destripar (el tokenizador SPACE_OR_PUNCTUATION de MiniSearch separa */[]/#/() → 'Tardobarroco'/'Bernini' quedan indexables); no se hace toLowerCase manual (lo hace processTerm)"
  - "createSearchIndex indexa SOLO monumentos (D-02); config: idField 'slug', fields ['name','italian','haystack'], storeFields ['slug','name','day'], searchOptions {prefix:true, fuzzy:0.2 (suave), boost name/italian:3 > haystack:1, combineWith:'OR'} (D-01)"
  - "spec en Vitest PLANO con import relativo (../../app/utils/searchIndex), fixtures cast 'as Monument' (no se valida esquema aquí — eso es tests/data/schema.spec); sin @nuxt/test-utils"

patterns-established:
  - "Haystack-superset: la búsqueda data-driven concatena TODOS los campos de texto visibles del original para garantizar el 'al menos lo de hoy' de SC#1"
  - "Fábrica de índice pura (datos → MiniSearch) separada del estado reactivo/cliente (que llega en 06-04), para unit-testear SC#1 sin runtime Nuxt"

requirements-completed: [FEAT-03]

# Metrics
duration: 3min
completed: 2026-06-21
---

# Phase 6 Plan 02: Búsqueda en cliente (lógica pura) Summary

**`buildHaystack` (superconjunto de `card.textContent`) + `createSearchIndex` (fábrica pura → MiniSearch 7.2.0 con prefijo, fuzzy suave y `name`/`italian` boosteados sobre la prosa), reemplazando el DOM-scrape + `includes()` del index.html, con cobertura Vitest que blinda SC#1.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-21T13:45:56Z
- **Completed:** 2026-06-21T13:49:00Z
- **Tasks:** 2
- **Files modified:** 2 (ambos creados)

## Accomplishments
- `app/utils/searchIndex.ts`: módulo PURO (sin Nuxt/Vue/DOM/useState) con `buildHaystack(Monument)` y `createSearchIndex(Monument[])`.
- `buildHaystack` es un SUPERCONJUNTO verificado del antiguo `card.textContent`: incluye `name`, `italian`, `roman`, `badge`, cada `sections[].heading`+`body`, cada `facts[].label`+`value`, `sorrentino.label`+`text`, cada `culture[].title`+`text` y cada `artists[]`/`arch[].label`+`note` — ninguna palabra que el sitio vivo indexaba se pierde (SC#1 / Pitfall 1).
- `createSearchIndex` devuelve una instancia de MiniSearch configurada (prefijo + fuzzy 0.2 suave + boost `name`/`italian` por encima de `haystack` + `combineWith: 'OR'`), indexando SOLO monumentos (D-02), con `storeFields` `slug`/`name`/`day` para el dropdown de 06-04.
- `tests/unit/searchIndex.spec.ts` (16 casos, Vitest plano): prueba directa de superconjunto del haystack (badge/arch/section/italian/fact/sorrentino/culture), query-devuelve-slug-esperado para palabras de arch/badge/italian/sección, forma de `storeFields` y comportamiento de prefijo.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1: app/utils/searchIndex.ts — buildHaystack + createSearchIndex** - `8e2553c` (feat)
2. **Task 2: tests/unit/searchIndex.spec.ts — superconjunto SC#1 + query→slug** - `de1e3c4` (test)

_Nota: Task 1 es `tdd="true"`; al ser su verificación typecheck+lint (no un test de comportamiento propio), la fase RED/GREEN se materializa con la implementación verificada y el spec de comportamiento de SC#1 es Task 2._

## Files Created/Modified
- `app/utils/searchIndex.ts` - Lógica pura de búsqueda (FEAT-03): `buildHaystack` superconjunto + fábrica `createSearchIndex` → MiniSearch; reemplaza index.html:6435-6442/6447-6466 (DOM-scrape + `includes()`).
- `tests/unit/searchIndex.spec.ts` - Cobertura Vitest plana del superconjunto del haystack (SC#1/Pitfall 1) y de que las queries de name/italian/badge/arch/sección devuelven el monumento esperado con `slug`/`name`/`day`.

## Decisions Made
- **Haystack = SUPERCONJUNTO, no subconjunto.** El `critical_haystack_rule` del plan manda: el original indexaba `card.textContent` entero, así que se concatenan TODOS los campos de texto del `Monument`. Un subconjunto (p. ej. omitir `badge` o `arch.label`) haría que "Sorrentino"/"Caravaggio"/"Tardobarroco" devolvieran 0 → regresión de SC#1.
- **No tocar el Markdown a mano.** Los campos Md se concatenan crudos; el tokenizador por defecto de MiniSearch separa la puntuación Markdown, así que las palabras quedan indexadas. No se hace `toLowerCase()` manual (lo hace `processTerm`).
- **Índice = monumentos (D-02), config D-01.** `idField: 'slug'` (ancla `#id`, no el `id` reservado), `prefix: true` + `fuzzy: 0.2` (suave, no agresivo), `boost` `name`/`italian` (3) > `haystack` (1), `combineWith: 'OR'` (amplio = seguro para el "al menos" de SC#1).
- **Pureza preservada.** Sin estado reactivo, `onMounted` ni `useSearch` aquí — eso es el Plan 06-04. El índice nunca se serializa a `useState`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. `pnpm typecheck`, `pnpm lint` y `pnpm test:unit` (71/71, de los cuales 16 nuevos de `searchIndex`) pasaron limpios a la primera.

## User Setup Required
None - no external service configuration required. MiniSearch 7.2.0 ya estaba instalado (dependencia pre-existente de Fase 1); cero instalaciones de paquetes.

## Self-Check: PASSED

- `app/utils/searchIndex.ts` — FOUND (commit `8e2553c`)
- `tests/unit/searchIndex.spec.ts` — FOUND (commit `de1e3c4`)
- Commit `8e2553c` — FOUND en git log
- Commit `de1e3c4` — FOUND en git log

## Next Phase Readiness
- FEAT-03 (mitad de lógica pura) listo: el Plan 06-04 puede construir el índice en cliente (`onMounted` con `createSearchIndex(monuments)`), cablear el `input#search` reactivo y renderizar el dropdown desde los `storeFields` (`slug`/`name`/`day`), aplicando la regla LOCKED "resultados vía `{{ }}`, nunca `v-html`" (T-V5 / threat T-06-04 transferido a 06-04).
- Sin bloqueos nuevos. El BLOQUEANTE D1 abierto (uniones discriminadas `artist`/`reference` con columnas SQL null) NO afecta a este plan: la búsqueda indexa `monument`, que materializa columnas correctamente.

---
*Phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a*
*Completed: 2026-06-21*
