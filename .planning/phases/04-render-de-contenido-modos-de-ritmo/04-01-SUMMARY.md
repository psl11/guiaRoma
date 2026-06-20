---
phase: 04-render-de-contenido-modos-de-ritmo
plan: 01
subsystem: ui
tags: [nuxt, vue, composable, useState, useHead, mdc, pace-matrix, vitest, eslint]

# Dependency graph
requires:
  - phase: 02-datos-tipados
    provides: "esquema zod (Pace 'all'|'medium'|'slow-only', sections[].body Markdown) + 85 YAML migrados"
  - phase: 03-pagina-layout-tema
    provides: "useTrip/TripView (raíz de datos), patrón <MDC unwrap=p>, CSS verbatim global, convención de composable/util puro auto-importado, eslint allowlist Topbar"
provides:
  - "app/utils/pace.ts — isVisible(itemPace, pace) pura: matriz EXACTA de ritmo (FEAT-06)"
  - "app/composables/useTripModes.ts — estado reactivo único pace/light/resumen + persistencia onMounted + clases de body (FEAT-06/07/08)"
  - "app/components/DetailPhoto.global.vue — primer .global.vue del repo; <MDC> resuelve :detail-photo{...} (UI-02)"
  - "eslint.config.mjs — allowlist de Timeline (lo consume el Plan 04-03)"
  - "Decisión Pitfall 1 RESUELTA (opción b): NO hay ProseUl/ProseLi globales — las listas de prosa NO son uniformes (monumentos+practica=detail-list, artistas=plain)"
affects: [04-02-monument-card, 04-03-timeline, 04-04-secciones-referencia, 04-05-hero-cableado, 07-mapa-fallback-imagen]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Util puro auto-importado para lógica testeable en Vitest plano (analogía dayLabel.ts)"
    - "Composable de modos con useState (SSR-singleton), useHead({bodyAttrs}) y restauración en onMounted (micro-flash intencional)"
    - "Componente .global.vue como mecanismo de registro global para inline components de <MDC>"

key-files:
  created:
    - app/utils/pace.ts
    - tests/unit/pace.spec.ts
    - app/composables/useTripModes.ts
    - app/components/DetailPhoto.global.vue
  modified:
    - eslint.config.mjs

key-decisions:
  - "Pitfall 1 (opción b): NO crear ProseUl/ProseLi globales — un override global plano rompería la paridad (artistas usan <ul> sin .detail-list); decisión justificada por grep, sin tocar YAML de F2"
  - "isVisible del composable delega en la función pura de utils/pace.ts (importada como isVisibleForPace para evitar auto-sombra con el método expuesto); la matriz vive en un solo sitio"
  - "DetailPhoto img PLANO (sin manejador de error, frontera D-01); el fallback SVG es de la Fase 7"
  - "Restauración de localStorage SOLO en onMounted, pace antes que light (el watch fuerza slow); persistencia (watch) también dentro de onMounted para no escribir en prerender"

patterns-established:
  - "Estado cliente inicializado en onMounted: default = HTML prerenderizado (cero mismatch), restore en cliente = micro-flash de 1 frame (SC#4) — opuesto al tema (anti-FOUC)"
  - "Acoplamiento light->slow con watch SIN else (Pitfall 5): activar fuerza el ritmo, desactivar no lo revierte"
  - "Componentes MDC con sufijo .global.vue para ser resolubles por resolveComponent en <MDC>"

requirements-completed: [FEAT-06, FEAT-07, FEAT-08, UI-02]

# Metrics
duration: 12min
completed: 2026-06-20
---

# Fase 4 Plan 01: Cimientos data-driven y modos de ritmo Summary

**Matriz de ritmo pura `isVisible` (9 casos en verde), composable reactivo único `useTripModes` (pace/light/resumen con persistencia y clases de body sin DOM imperativo) y el primer componente `.global.vue` del repo (`DetailPhoto`) para que `<MDC>` resuelva `:detail-photo{...}`; la decisión de paridad de Pitfall 1 queda resuelta por grep.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-20T10:11Z (carga de plan + lectura de fuentes + grep gate)
- **Completed:** 2026-06-20T10:17Z
- **Tasks:** 3 (Task 1 con ciclo TDD: RED + GREEN)
- **Files modified:** 5 (4 creados + 1 modificado)

## Accomplishments
- **`app/utils/pace.ts`** — `isVisible(itemPace, pace)` PURA con la matriz EXACTA de 3 ramas portada 1:1 de `index.html:6525-6531` (Pitfall 4 preservado: `slow` oculta `slow-only` Y `medium`); exporta los tipos `Pace`/`ItemPace`. Cubierta por 9 tests en Vitest plano (TDD: test rojo → implementación verde).
- **`app/composables/useTripModes.ts`** — fuente de verdad única y reactiva de los tres modos: `useState` (singleton compartido TheHero↔Timeline, D-03), acoplamiento `light→slow` sin else (Pitfall 5), clases `body.light-mode`/`modo-resumen` vía `useHead({bodyAttrs})` (cero `classList`/`querySelectorAll`), restauración + persistencia SOLO en `onMounted` con las claves literales `roma-*` (micro-flash SC#4), y `isVisible` delegando en la función pura.
- **`app/components/DetailPhoto.global.vue`** — PRIMER `.global.vue` del repo; reproduce `.detail-photo > img` (plano) + `.detail-photo-caption` (vía `<MDC :value="caption" unwrap="p">`) verbatim de `index.html:2479-2482`, sin CSS nuevo.
- **`eslint.config.mjs`** — bloque gemelo de `Topbar` que permite el nombre de una palabra `Timeline` (lo crea el Plan 04-03).
- **Pitfall 1 RESUELTO por grep** — confirmado que las listas de prosa NO son uniformes: un override global de `ProseUl` rompería la paridad de artistas. Decisión documentada, datos de F2 intactos.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1 (RED): test de la matriz isVisible** - `a1fb86c` (test)
2. **Task 1 (GREEN): implementación de isVisible (FEAT-06)** - `c02c78c` (feat)
3. **Task 2: composable useTripModes (FEAT-06/07/08)** - `b719769` (feat)
4. **Task 3: DetailPhoto.global.vue + eslint Timeline (UI-02)** - `5d7eb7b` (feat)

**Plan metadata:** (commit docs final con SUMMARY/STATE/ROADMAP)

_Nota: Task 1 era `tdd="true"` → ciclo RED (test) → GREEN (feat); sin REFACTOR (la función de 3 ramas ya es mínima)._

## Files Created/Modified
- `app/utils/pace.ts` — función pura `isVisible(itemPace, pace)` + tipos `Pace`/`ItemPace`; matriz de ritmo (3 ramas exactas).
- `tests/unit/pace.spec.ts` — los 9 casos (3 paces × 3 itemPaces) en Vitest plano, import directo de `../../app/utils/pace`.
- `app/composables/useTripModes.ts` — estado reactivo `pace`/`light`/`resumen` + persistencia `onMounted` + clases de body vía `useHead`; expone `{ pace, light, resumen, isVisible }`.
- `app/components/DetailPhoto.global.vue` — componente MDC inline global `:detail-photo` (img plano + caption MDC).
- `eslint.config.mjs` — añadido bloque `files:['app/components/Timeline.vue']` con `vue/multi-word-component-names:'off'`.

## Decisions Made

- **Pitfall 1 — decisión (b), NO se crean `ProseUl`/`ProseLi` globales.** El grep obligatorio sobre `content/trips/roma/**/*.yml` confirmó que las listas de prosa NO se pueden uniformar con un override global plano (ver "Hallazgo del grep de Pitfall 1" abajo). Crear un `ProseUl` que ponga `class="detail-list"` a TODA lista de `<MDC>` rompería la paridad de las 13 fichas de artista (que en el `index.html` usan `<ul>` SIN `.detail-list`). Datos de F2 intactos; el conflicto se resuelve en los planes consumidores (ver "Next Phase Readiness").
- **Delegación de `isVisible` con alias.** El composable expone un método `isVisible(itemPace)` y a la vez la función pura `isVisible` de `app/utils/pace.ts` es auto-importada por Nuxt → para evitar la auto-sombra/recursión, se importa explícitamente como `isVisibleForPace` desde `~/utils/pace`. La matriz sigue viviendo en un solo sitio (key_link cumplido).
- **`DetailPhoto` con `img` plano (frontera D-01).** Sin manejador de error de imagen; el fallback SVG (`loadSvgFallbackDetail`) es alcance de la Fase 7. Solo `loading="lazy"` (ya estaba en el original).
- **Orden de restauración pace→light en `onMounted`.** `pace` se restaura ANTES que `light`, porque activar `light` dispara el watch que fuerza `pace='slow'` (orden de `index.html:6650-6652`).

### Hallazgo del grep de Pitfall 1 (obligatorio antes de implementar)

| Origen de la prosa | Sintaxis en el dato migrado (F2) | En el `index.html` | ¿`.detail-list`? |
|--------------------|----------------------------------|--------------------|------------------|
| 38 monumentos (`sections[].body`, "En qué fijarse"…) | listas Markdown nativas (`- item`) | `<ul class="detail-list">` (✦ + bordes, `base.css:799-818`) | **SÍ** |
| `practica` (`sections[].body`, "Cómo pedir un café"…) | listas Markdown nativas (`- item`) | `<ul class="detail-list">` | **SÍ** |
| 13 fichas de artista/arquitectura (`sections[].body`, "Obras maestras"/"Curiosidades"…) | listas Markdown nativas (`- item`) — **misma sintaxis** | `.artist-section <ul>` SIN clase (bullets por defecto, `padding-left:1.1rem`, fuente `.9rem`, `base.css:1270-1271`) | **NO** |

**Conclusión:** monumentos y `practica` deben verse como `.detail-list`, pero las de artista NO. Como las tres se renderizan por el MISMO `<MDC>` con sintaxis idéntica, un override `ProseUl` global plano no puede distinguirlas → aplicaría ✦+bordes también a las 13 fichas de artista (divergencia). De ahí la opción (b). Evidencia: `index.html:5959-6091` (artist-section `<ul>` sin clase), `content/trips/roma/artists/art-bernini.yml:24-29,36-58`, `content/trips/roma/monuments/galleria-sciarra.yml:54-74`, `content/trips/roma/reference/practica.yml:28-42`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comillas de las descripciones de `it()` en `pace.spec.ts` violaban `@stylistic/quotes`**
- **Found during:** Task 1 (verify lint)
- **Issue:** Las descripciones `it("...")` usaban comilla doble (porque contenían `'all'`/`'medium'` con comilla simple dentro); `@stylistic/quotes` exige comilla simple → 9 errores de lint.
- **Fix:** Reescritas las descripciones a comilla simple, quitando las comillas internas (p. ej. `optimistic: all visible`). Aserciones intactas.
- **Files modified:** tests/unit/pace.spec.ts
- **Verification:** `pnpm lint app/utils/pace.ts tests/unit/pace.spec.ts` exit 0; los 9 casos siguen verdes.
- **Committed in:** c02c78c (commit GREEN de Task 1)

**2. [Rule 3 - Blocking] La gate negativa de grep matcheaba un token en un COMENTARIO (useTripModes y DetailPhoto)**
- **Found during:** Task 2 (`! grep classList/querySelectorAll`) y Task 3 (`! grep onerror/@error`)
- **Issue:** Los `<automated>` verifican que el fichero NO contenga `classList`/`querySelectorAll` (Task 2) ni `onerror`/`@error` (Task 3). El CÓDIGO cumplía (cero DOM imperativo; `img` plano), pero mis comentarios de cabecera nombraban esos tokens al explicar el anti-patrón → la gate literal fallaba.
- **Fix:** Reformulados los dos comentarios para describir el anti-patrón sin los literales (p. ej. "nada de manipular clases del DOM a mano ni de escanear el árbol"; "sin ningún manejador de error de imagen"). Comportamiento sin cambios.
- **Files modified:** app/composables/useTripModes.ts, app/components/DetailPhoto.global.vue
- **Verification:** Las cuatro gates de Task 2 y las tres de Task 3 pasan; typecheck + lint verdes.
- **Committed in:** b719769 (Task 2), 5d7eb7b (Task 3)

**3. [Plan deviation - Pitfall 1 opción b] `ProseUl.global.vue` y `ProseLi.global.vue` NO se crearon**
- **Found during:** Task 3 (grep gate obligatorio de Pitfall 1)
- **Issue:** El `files_modified` del plan listaba `ProseUl.global.vue`/`ProseLi.global.vue`, pero el propio `<action>` de Task 3 ordena: si las listas de artista difieren, NO crearlos y documentar el conflicto (opción b). El grep confirmó que difieren.
- **Fix:** No se crean esos dos ficheros; el conflicto queda documentado (tabla arriba) para que lo resuelva el plan consumidor sin tocar los YAML de F2. Esto NO es scope creep: es la rama (b) explícitamente prevista por el plan.
- **Files modified:** (ninguno — decisión de no-creación)
- **Verification:** Decisión justificada por grep; `pnpm test:unit`/typecheck/lint verdes con los ficheros que SÍ se crearon.
- **Committed in:** 5d7eb7b (Task 3, con nota en el mensaje de commit)

---

**Total deviations:** 3 (1 bug de lint, 1 blocking de gate-en-comentario, 1 rama (b) prevista por el plan)
**Impact on plan:** Las dos primeras son ajustes mecánicos para pasar las gates del propio plan (cero cambio de comportamiento). La tercera es la rama de decisión que el plan dejó abierta y que el grep resolvió; preserva la paridad y NO toca datos. Sin scope creep.

## Issues Encountered
- **Auto-sombra de `isVisible`:** al ser `app/utils/pace.ts` auto-importado, un `const isVisible` local en el composable sombrearía la función pura e impediría delegar. Resuelto importando explícitamente `isVisible as isVisibleForPace` desde `~/utils/pace` (alias `~/*` → `app/*` verificado en `.nuxt/tsconfig.json`).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

Los tres contratos de cimientos están listos para los planes consumidores de la Fase 4:

- **Plan 04-02 (MonumentCard)** consume `DetailPhoto` (resuelto por `<MDC>`) y renderiza las `sections[].body` con `<MDC>`. **Atención Pitfall 1:** las listas de prosa de monumento deben verse como `.detail-list` (✦+bordes), pero NO existe `ProseUl` global. El plan consumidor debe resolverlo SIN romper las listas de artista — opciones: (i) un `<MDC>` con `:components`/override LOCAL de `ul` solo dentro de `MonumentCard`/`practica`, (ii) envolver `.detail-list` por contexto en el componente, o (iii) un bloque `::detail-list` por dato (tocaría YAML de F2). Decisión pendiente para el planner de 04-02/04-04.
- **Plan 04-03 (Timeline)** consume `useTripModes().isVisible` en `TimelineStop`/`TimelineTransport` (solo esos dos filtran por ritmo — Pitfall 4). El nombre `Timeline` ya está permitido en eslint.
- **Plan 04-05 (cableado de TheHero)** consume `useTripModes()` para los `.pace-btn`/`#light-toggle`/`#resumen-toggle`; el estado es singleton, así que el filtrado del timeline reacciona automáticamente.
- El render visible (DetailPhoto resuelto, isVisible filtrando, clases de body) se asevera end-to-end con Playwright en el Plan 04-05.

**Blocker/concern carry-forward:** El concern de STATE "[Phase 4/5]: cableado exacto de interceptación de `a[href^=\"#\"]` en `<MDC>`" sigue abierto (frontera F5, no toca este plan).

## Self-Check: PASSED

- Ficheros verificados en disco: `app/utils/pace.ts`, `tests/unit/pace.spec.ts`, `app/composables/useTripModes.ts`, `app/components/DetailPhoto.global.vue`, `eslint.config.mjs`, `04-01-SUMMARY.md`.
- Commits verificados en git: `a1fb86c` (test RED), `c02c78c` (feat GREEN), `b719769` (useTripModes), `5d7eb7b` (DetailPhoto + eslint).
- Gates verdes: `pnpm test:unit` (21/21), `pnpm typecheck` (exit 0), `pnpm lint` (repo completo, exit 0); todas las gates de grep de los `<automated>` de Tasks 2 y 3.

---
*Phase: 04-render-de-contenido-modos-de-ritmo*
*Completed: 2026-06-20*
