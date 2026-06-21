# Phase 6: Derivados de datos — búsqueda y ruta del día - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Re-derivar **desde los datos tipados (no del DOM)** las dos features que hoy raspan el HTML, como **composables puros y testeables**, con **paridad de comportamiento** respecto al `index.html`:

1. **Búsqueda en cliente** (FEAT-03): índice MiniSearch sobre un `haystack` por monumento (prosa de todas las secciones + nombre italiano + facts + caption); dropdown desde ≥2 caracteres, máx 8 resultados, "Sin resultados" cuando no hay; seleccionar un resultado navega a la ficha vía `useCardNavigation` (F5).
2. **"Ruta del día"** (FEAT-09): derivada de `day.cards` (orden = el del dato), solo monumentos (no restaurantes ni guiados/concierto), abre Google Maps `dir/?api=1&…&travelmode=walking`, con cap de 10 paradas y el muestreo literal de `capStops`; el botón solo aparece con ≥2 paradas y muestra el texto condicional `(N paradas)` / `(10 de N paradas)`.

Cubre **FEAT-03** y **FEAT-09**. Depende de **F2** (datos tipados) y **F5** (`useCardNavigation`).

**Incluye:**
- `useSearch` + lógica pura del índice/haystack (`app/utils/`): construcción del índice MiniSearch desde las colecciones, query, dropdown.
- `useDayRoute` / utils puras `pointFor` · `capStops` · `buildDirUrl` (`app/utils/`).
- **Caja de búsqueda + dropdown** (componente NUEVO — no hay shell de F3) y **botón "ruta del día"** (NUEVO, cableado en la cabecera de cada día), ambos anclados a la posición/markup del original.
- Resultado de búsqueda → `navigateToCard(slug)` (F5).

**No incluye** (otras fases):
- **Mapa Leaflet** (popups "Abrir ficha →") = **FEAT-02 → F7**.
- **Fallback de imagen / notas persistidas** = **F7**. **Pixel-diff total** = **F8**.
- **Ampliar la búsqueda más allá de monumentos** y **atajos/teclado/filas enriquecidas** = descartados por paridad (ver Deferred Ideas).

</domain>

<decisions>
## Implementation Decisions

### Heredado y BLOQUEADO por fases previas / paridad (no reabrir)
- **Paridad = ley** (Core Value): F6 reproduce el comportamiento del `index.html` **exactamente**, con **una única mejora sancionada**: la calidad de coincidencia de la búsqueda (SC#1 exige "al menos lo de hoy", lo que permite mejorar).
- **MiniSearch 7.2.0 sobre DATOS, no DOM** (CLAUDE.md #7): reemplaza el `cards.filter(c => c.content.includes(q))` y el raspado del DOM del original. Es la pieza que motivó elegir MiniSearch (prefijo + typo-tolerance + boosting).
- **Composables puros y testeables** (goal): la lógica pura (`pointFor`/`capStops`/`buildDirUrl`, construcción del haystack/índice) vive en `app/utils/` con tests Vitest; el comportamiento (dropdown, botón, navegación) se verifica con Playwright autocontenido (patrón F2–F5). El planner porta la lógica 1:1, no la reinventa.
- **Navegación de resultados vía `useCardNavigation` (F5)** (SC#2): un resultado invoca `navigateToCard(slug)`. La API se diseñó en F5 para este consumidor.
- **Paridad del haystack** (SC#1): prosa de todas las secciones + nombre italiano + facts + caption (los mismos textos que hoy entraban en `card.textContent`).
- **Paridad de la ruta** (SC#3): solo monumentos desde el orden de `day.cards`; `dir/?api=1…&travelmode=walking` (formato exacto del original); cap de 10 con muestreo **literal** de `capStops`; botón solo con ≥2 paradas; texto condicional `(N paradas)` / `(10 de N paradas)`.
- **Tests de URL** (SC#4): unitarios sobre `pointFor`/`capStops`/`buildDirUrl` que confirman que la URL por día coincide con la del `index.html`.

### Área 1 — Calidad de coincidencia de la búsqueda
- **D-01 (MiniSearch: prefijo + ranking + fuzzy SUAVE):** la búsqueda usa **prefijo**, **ranking por campo** (nombre italiano > prosa) y **tolerancia a erratas suave** — supera el `includes()` de hoy sin traer ruido, ideal para consultarla paseando con tecleo móvil. **NO** fuzzy agresivo (descartado para evitar resultados ruidosos). Sancionado por SC#1 ("al menos lo de hoy") y por la razón por la que CLAUDE.md eligió MiniSearch. (Pesos exactos y umbral fuzzy conservador = research/planner.)

### Área 2 — Alcance del índice + navegación de resultados
- **D-02 (índice = solo monumentos, paridad):** la búsqueda indexa **solo monumentos** — lo que el original buscaba sobre `.card`. Encaja directo con `monById` (F3) y `useCardNavigation` (F5): como todos los resultados están en `monById`, `navigateToCard(slug)` hace scroll suave + resaltado + pila **sin ampliar el índice ni tocar F5**. NO se indexan gastro/artistas/referencia (sería ampliación sobre la paridad — ver Deferred). Research confirma el alcance exacto del índice original.

### Área 3 — UX del dropdown
- **D-03 (dropdown = paridad pura):** replicar el dropdown del original 1:1 — clic en un resultado → navegar; ≥2 chars, máx 8, "Sin resultados". **Sin** navegación por teclado añadida y **sin** filas enriquecidas (día/tipo/resaltado del término). (Mecánica fina —debounce, cierre al clicar fuera— = replicar el original, Claude's Discretion.)

### Área 4 — Ubicación y disparadores
- **D-04 (ubicación/disparo = paridad pura):** la caja de búsqueda y el botón "ruta del día" van **exactamente donde estaban** en el original (research mapea las posiciones del `index.html`), disparo por **clic**. **Sin** atajo de teclado nuevo.

### Claude's Discretion (research/planner deciden; no requieren al usuario)
- Config exacta de MiniSearch: campos indexados, pesos de boost (nombre>prosa), umbral fuzzy conservador, opciones de prefijo/tokenización.
- Forma de los composables (`useSearch` / `useDayRoute`): singleton `useState` vs ref de módulo (preferir el patrón establecido F4/F5), y dónde se montan.
- Cómo se construye el `haystack` por monumento desde las colecciones tipadas (concatenación de prosa multi-sección + italiano + facts + caption).
- Mecánica fina del dropdown (debounce, cierre al clicar fuera, foco) replicando el original.
- Ubicación/markup exactos de la caja de búsqueda y del botón "ruta del día" (research los mapea del `index.html`); si necesitan estilos, portarlos verbatim (cero CSS nuevo si las clases ya existen en `base.css`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Código actual (FUENTE DE VERDAD de la paridad)
- `index.html` — el comportamiento a portar 1:1. Mapa de líneas (de CLAUDE.md §Sources):
  - **Búsqueda:** ~6433-6466 (filtro actual sobre `card.textContent`, dropdown ≥2 chars / máx 8 / "Sin resultados", y `navigateToCard(a.dataset.card, e)` al seleccionar). F6 lo reemplaza por MiniSearch sobre datos (D-01/D-02).
  - **Ruta del día:** ~6584-6646 (`pointFor`/`capStops`/`buildDirUrl`, formato de URL `dir/?api=1…walking`, cap de 10 + muestreo, texto condicional del botón). F6 lo porta 1:1 a utils puras (SC#3/SC#4).
- `app/composables/useTrip.ts` — expone `monById` (índice por slug de monumento: destino de los resultados y base de `pointFor`) y los datos tipados (días con `day.cards`, monumentos con prosa/facts/caption/nombre italiano) que alimentan el haystack y la ruta.
- `app/composables/useCardNavigation.ts` (F5) — `navigateToCard(id, event?)` que los resultados de búsqueda invocan (SC#2).
- `app/utils/cardNav.ts` + `tests/unit/cardNavigation.spec.ts` (F5) y `app/utils/pace.ts` + `tests/unit/pace.spec.ts` — precedente de "lógica pura en utils + Vitest" a replicar para `pointFor`/`capStops`/`buildDirUrl` y el índice de búsqueda.
- `shared/schemas.ts` — `Day.cards` (array ORDENADO de slugs de monumento, DATA-03 — el orden ES la ruta), `PlaceType` (`card`/`guided`/`concert` — la ruta excluye guided/concert), y los campos de monumento (prosa, facts, caption, nombre italiano) del haystack.
- `app/components/Topbar.vue` / `app/components/TheHero.vue` — candidatos para la caja de búsqueda (research mapea dónde vivía en el original).
- `app/components/DaySection.vue` — cabecera de día; candidato para el botón "ruta del día" (`DaySection.vue:10` ya anota que `day.cards` es de donde F6 deriva la ruta).
- `tests/parity/modes.spec.ts` y `tests/parity/navigation.spec.ts` — patrón de spec Playwright autocontenido (build + serve bajo `/guiaRoma/`) a replicar.

### Stack / planificación
- `CLAUDE.md` §7 (MiniSearch 7.2.0, indexar **datos** no DOM; prefijo+fuzzy+boost) y §"Buscar scrapeando el DOM" (anti-patrón que F6 elimina) y §"CSS verbatim".
- `.planning/ROADMAP.md` §Phase 6 — goal + los **4 success criteria**.
- `.planning/REQUIREMENTS.md` — **FEAT-03** (búsqueda) y **FEAT-09** (ruta del día).
- `.planning/phases/05-navegaci-n-transversal/05-CONTEXT.md` — el diseño de `useCardNavigation` para sus 3 consumidores (F6 búsqueda es uno) y `monById` como discriminador ficha-vs-sección.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useTrip().monById`** (F3) — índice slug→monumento: destino de los resultados de búsqueda (todos los resultados están aquí porque el índice es monuments-only) y base de `pointFor` para la ruta.
- **`useCardNavigation().navigateToCard`** (F5) — los resultados de búsqueda lo invocan (SC#2); diseñado en F5 para este consumidor.
- **`day.cards`** (DATA-03) — orden explícito de slugs de monumento = la "ruta del día" (NUNCA reordenar; `Timeline.vue:4` lo recuerda).
- **`cardNav.ts` / `pace.ts`** — precedente de lógica pura en `utils` + Vitest, a replicar para `pointFor`/`capStops`/`buildDirUrl` y la construcción del índice.

### Established Patterns
- **"Lógica pura → `utils` + Vitest; comportamiento → Playwright autocontenido"** (F2–F5).
- **Composable singleton vía `useState` + init client-only en `onMounted`** (F4/F5) — para `useSearch`/`useDayRoute` si llevan estado (índice, query).
- **Caja de búsqueda y botón "ruta del día" son NUEVOS** (no hay shell de F3) — F6 los crea anclados a la posición/markup del original (a diferencia del patrón "shell de F3 cableado en su fase").
- **Cero CSS nuevo** si las clases del original ya existen en `base.css`; si no, portarlas verbatim.

### Integration Points
- `app/utils/searchIndex.ts` (NUEVO, lógica pura del haystack/índice) + `app/composables/useSearch.ts` (NUEVO).
- `app/utils/dayRoute.ts` (NUEVO): `pointFor` · `capStops` · `buildDirUrl` (puras) — y opcional `app/composables/useDayRoute.ts`.
- Componente de **caja de búsqueda + dropdown** (NUEVO) — invoca `navigateToCard`.
- `app/components/DaySection.vue` (MODIFICAR) — botón "ruta del día" que llama a `buildDirUrl` + abre Google Maps.
- `app/composables/useCardNavigation.ts` (F5) — consumido sin cambios.

</code_context>

<specifics>
## Specific Ideas

- **Búsqueda:** MiniSearch con **prefijo + ranking (nombre italiano > prosa) + fuzzy suave**; ≥2 chars, máx 8, "Sin resultados"; `haystack` = prosa multi-sección + nombre italiano + facts + caption (solo monumentos).
- **Ruta del día:** solo monumentos desde `day.cards` (orden del dato), `dir/?api=1…&travelmode=walking` (formato exacto), cap 10 con muestreo **literal** de `capStops`, botón con ≥2 paradas, texto `(N paradas)` / `(10 de N paradas)`.
- **Todo lo visible** (caja, dropdown, botón) = **paridad exacta** con el original, disparo por clic, sin atajos.

</specifics>

<deferred>
## Deferred Ideas

- **Ampliar la búsqueda a gastro / artistas / secciones de referencia** — considerado y descartado para F6 (paridad = monuments-only). Requeriría un índice id→ficha más amplio que `monById` y posiblemente extender `useCardNavigation` (F5). Candidato a mejora futura.
- **Atajo de teclado para enfocar la búsqueda** (`/` o `⌘K`) — considerado y descartado (no estaba en el original; paridad = clic). Mejora de uso futura.
- **Navegación por teclado del dropdown** (↑↓ / enter / esc) y **filas enriquecidas** (día / tipo / resaltado del término) — descartados por paridad; posibles mejoras de a11y/UX futuras.
- (Diferidos que pertenecen a otras fases ya ubicados: mapa → **F7**; fallback de imagen / notas persistidas → **F7**; pixel-diff total → **F8**.)

</deferred>

---

*Phase: 6-Derivados de datos — búsqueda y ruta del día*
*Context gathered: 2026-06-21*
