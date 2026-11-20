---
phase: 03-capa-de-p-gina-layout-y-tema
plan: 05
subsystem: ui
tags: [vue, nuxt, routing, color-mode, ssg, parity, playwright, anti-fouc]

# Dependency graph
requires:
  - phase: 03-capa-de-p-gina-layout-y-tema (Plan 02)
    provides: useTrip(slug) — usado por la ruta dinámica /trips/[slug] para el guard 404
  - phase: 03-capa-de-p-gina-layout-y-tema (Plan 04)
    provides: TripView — el componente que ambas páginas (/ y /trips/[slug]) renderizan
  - phase: 01 (andamiaje)
    provides: patrón favicon-via-useHead (app.baseURL), tests/parity/subpath.spec.ts (build+serve autocontenido), playwright.config.ts, golden de paridad
provides:
  - "app/app.vue: NuxtPage root + head de paridad VERBATIM (D-09 — lang es, title exacto, ambos theme-color metas) con el bloque favicon useHead preservado intacto"
  - "app/pages/index.vue: la ruta / renderiza <TripView slug=\"roma\"> (D-02), sin enlace a /trips/*"
  - "app/pages/trips/[slug].vue: ruta dinámica multi-viaje que reusa TripView con guard createError 404 fatal; nunca entra en el prerender (D-01/ARCH-02)"
  - "tests/parity/shell.spec.ts: parida del shell del / construido + head + routing/404 + sin-dir-trips (SC#2/ARCH-02/D-09/D-01), autocontenido (generate+serve)"
  - "tests/parity/theme.spec.ts: SC#3 (script anti-FOUC presente + dark-sin-flash) + SC#4 (icono solo-CSS, nunca system), autocontenido"
  - "Sign-off humano de paridad golden APROBADO: el home renderizado es visualmente idéntico al golden de Fase 1 en claro+oscuro, móvil+desktop, sin FOUC — la barra de la 1.0 para F3"
affects: [Fase 4 (rellena las 11 secciones placeholder + corrige D1 unión SQL), Fase 7 (isla Leaflet en #mapa), Fase 8 (suite de verificación de paridad)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "app.vue como NuxtPage root (sin NuxtLayout — TripView posee el chrome, A3) + head de paridad por useHead, conservando el patrón favicon-via-useHead de Fase 1 (no regresar a app.head.link)"
    - "Ruta dinámica multi-viaje: slug param → useTrip → createError 404 fatal en miss; jamás añadida a nitro.prerender.routes ni enlazada (disciplina de prerender D-01)"
    - "Specs de paridad autocontenidos sobre el OUTPUT construido: beforeAll genera+sirve bajo /guiaRoma/, afterAll teardown — mirror de subpath.spec.ts; NO dependen del webServer por defecto (que sirve el index.html viejo)"
    - "Aserción anti-FOUC SC#3 en dos partes (RESEARCH la nombró el test de mayor valor): (a) presencia estática del script inline color-mode en el <head> generado; (b) comportamiento — roma-theme=dark pinta dark en el primer paint sin transición light→dark"

key-files:
  created:
    - app/pages/index.vue
    - app/pages/trips/[slug].vue
    - tests/parity/shell.spec.ts
    - tests/parity/theme.spec.ts
  modified:
    - app/app.vue

key-decisions:
  - "app.vue = NuxtPage root (sin NuxtLayout): TripView ya posee chrome+footer (A3, Plan 04), así app.vue solo aporta el head de paridad + el favicon; cambiar a NuxtLayout duplicaría el chrome"
  - "Head de paridad VERBATIM por useHead (D-09): htmlAttrs lang es, title 'Roma · 19—23 giugno 2026' (em-dash —), dos theme-color metas (dark #1a1612 / light #f5f0e8); el bloque favicon useHead de Fase 1 se conserva intacto (NO regresar a app.head.link, que no antepone baseURL → 404 bajo /guiaRoma/)"
  - "La ruta /trips/[slug] reusa TripView con createError(404, fatal) en slug desconocido y NUNCA se prerenderiza (no se enlaza, no se toca nitro.prerender.routes) — Task 2 asserta que el build no emite dir trips/ (D-01)"
  - "Specs de paridad autocontenidos (build+serve propio, mirror de subpath.spec.ts) porque el webServer por defecto de playwright.config.ts sirve el index.html VIEJO, no el build Nuxt; prefieren aserciones DOM/texto a screenshots nuevos para no rebaselinar el golden"
  - "El 404 dinámico se ejercita vía dev (servidor único, desktop) porque el output estático solo contiene /; el render de shell reusado para /trips/roma sí se verifica sobre el servido"

patterns-established:
  - "Páginas one-liner: index.vue y [slug].vue son <TripView :slug> (confirmando la convención A3 de que TripView es el poseedor de la página); toda página de viaje futura es trivial"
  - "Specs de paridad sobre el build toleran EXACTAMENTE el un mensaje esperado de hidratación de color-mode SSG (D2) y fallan ante cualquier OTRO error de consola — una regresión genuina sigue capturándose"

requirements-completed: [ARCH-01, ARCH-02, UI-01, FEAT-01]

# Metrics
duration: 13min
completed: 2026-06-19
---

# Phase 3 Plan 05: Cableado de rutas + head de paridad + sign-off golden Summary

**El home queda cableado y probado: app.vue es NuxtPage + el head de paridad verbatim (favicon preservado), / y /trips/[slug] renderizan el mismo TripView (con guard 404 y disciplina de prerender), y Playwright asserta shell/head/routing/anti-FOUC/icono-solo-CSS — cerrado con el sign-off humano de paridad golden APROBADO (la barra de la 1.0 de F3).**

## Performance

- **Duration:** ~13 min (cableado + specs); checkpoint humano aparte
- **Started:** 2026-06-19T15:23:45Z (primer commit de tarea, tras cerrar 03-04 a las 15:18:53Z)
- **Completed:** 2026-06-19T15:36:27Z (specs en verde) + sign-off humano posterior
- **Tasks:** 4 (3 de código/test + 1 checkpoint humano)
- **Files modified:** 5 (4 creados, 1 modificado)

## Accomplishments
- **app.vue cableado (D-09, ARCH-02):** el body `#scaffold` pasa a `<NuxtPage/>` (sin `NuxtLayout` — TripView posee el chrome, A3); el bloque favicon `useHead` de Fase 1 se conserva verbatim; se añade el head de paridad por `useHead` — `htmlAttrs` lang es, title exacto `Roma · 19—23 giugno 2026` (em-dash —), y dos metas `theme-color` (dark `#1a1612` / light `#f5f0e8`).
- **Páginas + routing multi-viaje (D-01/D-02/ARCH-02):** `index.vue` renderiza `<TripView slug="roma">` (sin enlace a `/trips/*`); `app/pages/trips/[slug].vue` lee el slug param, llama a `useTrip`, lanza `createError` 404 fatal en slug desconocido y reusa `TripView` — sin añadirse al prerender.
- **Parida del shell construido (SC#2):** `tests/parity/shell.spec.ts` (autocontenido, genera+sirve bajo `/guiaRoma/` como `subpath.spec.ts`) asserta las 12 nav-pills en el orden BLOQUEADO, el masthead `#inicio`, las 4 info-card, la línea de footer `Roma · 19—23 giugno 2026`, el `back-btn` invisible en reposo, el head D-09, el reuso de TripView en `/trips/roma`, el 404 de un slug desconocido, y que el build **no** emite dir `trips/` (D-01).
- **Anti-FOUC + icono solo-CSS (SC#3/SC#4):** `tests/parity/theme.spec.ts` asserta (a) el script inline de color-mode presente en el `<head>` generado leyendo `roma-theme` + `setAttribute` `data-theme`; (b) `roma-theme=dark` pinta dark en el primer paint sin transición light→dark; (c) ambos spans `.moon`/`.sun` siempre presentes, exactamente uno visible por `[data-theme]`, el icono conmuta al togglear, y `data-theme` solo es `light|dark` (nunca `system`).
- **Sign-off humano de paridad golden APROBADO (Task 4):** el usuario confirmó que el home renderizado (shell + `#inicio` completo) es visualmente idéntico al golden de Fase 1 en claro+oscuro y móvil+desktop, con el tema sin FOUC — la barra innegociable de paridad de la 1.0 para F3.

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire app.vue + pages + routing + parity head (ARCH-02, D-01/D-02/D-09)** - `b09dfbc` (feat)
2. **Task 2: Built-/ shell parity + routing/404 + head + no-trips-dir (SC#2, ARCH-02, D-09, D-01)** - `9da2125` (test) — incluye el log de `deferred-items.md` (D1/D2)
3. **Task 3: Anti-FOUC (SC#3) + CSS-only icon (SC#4) Playwright spec** - `6ff7925` (test)
4. **Task 4: Human golden-parity + no-FOUC sign-off** - sin commit (checkpoint humano bloqueante) — **APROBADO** por el usuario ("approved")

**Plan metadata:** (este commit) (docs: complete plan)

_Note: las tareas 2-3 son commits `test(...)` porque su entregable son specs de Playwright (autoría de pruebas, no implementación)._

## Files Created/Modified
- `app/app.vue` (modificado) - body `#scaffold` → `<NuxtPage/>` (sin NuxtLayout); favicon `useHead` preservado verbatim; head de paridad D-09 (lang es, title exacto, dos theme-color metas) por `useHead`.
- `app/pages/index.vue` (creado) - la ruta `/` renderiza `<TripView slug="roma">` (D-02); sin `NuxtLink` a `/trips/*`.
- `app/pages/trips/[slug].vue` (creado) - ruta dinámica: slug param → `useTrip` → `createError` 404 fatal en miss → `TripView` reusado; nunca prerenderizada (D-01/ARCH-02).
- `tests/parity/shell.spec.ts` (creado) - spec autocontenido sobre el build: shell/head/routing/404/sin-dir-trips (SC#2/ARCH-02/D-09/D-01).
- `tests/parity/theme.spec.ts` (creado) - spec autocontenido sobre el build: anti-FOUC (SC#3) + icono solo-CSS, nunca system (SC#4).

## Automated parity results (todos en verde)
- **`tests/parity/shell.spec.ts`:** 7 passed / 1 skipped (móvil + desktop).
- **`tests/parity/theme.spec.ts`:** 6 passed (móvil + desktop).
- **`pnpm test:unit`:** 12 passed (helpers F3 + indexador `useTrip`).
- **`pnpm test:data`:** 295 passed (puerta de datos Fase 2 — sin regresión).
- **`pnpm generate`:** exit 0 (build estático produce solo `/`, sin dir `trips/`).
- **`pnpm typecheck`:** exit 0 (revalidado en esta finalización).

## Decisions Made
- **app.vue = NuxtPage root, sin NuxtLayout:** TripView ya posee chrome+footer (A3, Plan 04); usar NuxtLayout duplicaría el chrome. app.vue solo aporta head de paridad + favicon.
- **Head de paridad VERBATIM por useHead, favicon intacto:** se conserva el patrón favicon-via-useHead de Fase 1 (con `app.baseURL`); NO se regresa a `app.head.link` (no antepone baseURL → `/favicon.svg` daría 404 bajo `/guiaRoma/`).
- **/trips/[slug] reusa TripView, 404 en miss, nunca prerenderizada:** `createError(404, fatal)` para slug desconocido; sin enlace ni entrada en `nitro.prerender.routes`; Task 2 asserta que el build no emite `trips/` (D-01).
- **Specs de paridad autocontenidos (build+serve propio):** el webServer por defecto de `playwright.config.ts` sirve el `index.html` VIEJO, no el build Nuxt; se replica el patrón de `subpath.spec.ts`. Se prefieren aserciones DOM/texto a screenshots nuevos para no rebaselinar el golden de Fase 1.
- **404 dinámico vía dev:** el output estático solo contiene `/`, así que el 404 de slug desconocido se ejercita contra el servidor dev (desktop); el reuso de shell para `/trips/roma` sí se verifica sobre el servido.

## Deviations from Plan

None - plan executed exactly as written.

(Las dos discrepancias OUT-OF-SCOPE descubiertas al renderizar `useTrip` por primera vez se registraron en `deferred-items.md` como D1/D2 — ver sección siguiente — y NO se arreglaron en este plan, conforme a la regla de SCOPE BOUNDARY del executor.)

## Deferred / Out-of-scope items

Registradas en `.planning/phases/03-capa-de-p-gina-layout-y-tema/deferred-items.md` (commit `9da2125`):

- **D1 — `no such column: "trip"` en runtime sobre las colecciones unión (`artist`/`reference`).** `pnpm generate` sale 0 pero loguea 4 errores de prerender porque `ArtistSchema`/`ReferenceSchema` son `z.discriminatedUnion` y Content v3 no las aplana a columnas SQL; `useTrip`'s `.where('trip',…)`/`.order('order')` referencian columnas inexistentes. **Owner:** `app/composables/useTrip.ts` (Plan 03-02). **Impacto en la barra de paridad F3:** NINGUNO — esas dos colecciones solo alimentan `#arte`/`#arquitectura`/`#reservas`/`#practica`, secciones intencionadamente VACÍAS en F3 (D-05); `useAsyncData` traga el fallo y `buildTripIndexes` (`?? []`) rinde Maps vacíos. **Debe arreglarse antes de Fase 4** (cuando esas secciones reciban contenido real).
- **D2 — mensaje benigno de hidratación de `<html data-theme>` en el build estático.** Comportamiento intrínseco de `@nuxtjs/color-mode` en SSG con `preference: 'system'`: el HTML prerenderizado no lleva `data-theme` (la preferencia del SO es desconocible en build), y el script anti-FOUC inline (presente y verificado, SC#3) lo fija antes de hidratar → mismatch benigno solo en el atributo del `<html>`. **Impacto visual:** NINGUNO (sin FOUC; la aserción SC#3 behavioral pasa). Los specs de 03-05 toleran exactamente este un mensaje y fallan ante cualquier otro error de consola.

## Issues Encountered
- **El webServer de Playwright sirve el index.html viejo, no el build Nuxt:** resuelto autocontenido (generate+serve propio en `beforeAll`/`afterAll`, mirror de `subpath.spec.ts`), sin tocar `playwright.config.ts` ni `golden.spec.ts`.
- **404 dinámico no ejercitable sobre output estático (solo `/`):** resuelto verificando el 404 vía dev y el reuso de shell de `/trips/roma` sobre el servido (documentado en el spec).
- (Ver D1/D2 arriba — discrepancias diferidas, no bloqueantes de F3.)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- **F3 COMPLETA (5/5 planes):** la capa de página, layout y tema está cableada, probada y con sign-off humano de paridad golden. ARCH-01/ARCH-02/UI-01/FEAT-01 cubiertos.
- **Fase 4 (siguiente):** rellenar las 11 secciones placeholder (fichas/timeline por día, food, reference, artists) — los ids ya están en su sitio; **debe** además resolver D1 (la unión SQL de `artist`/`reference`) antes de renderizar `#arte`/`#arquitectura`/`#reservas`/`#practica`.
- **Fase 7:** la isla Leaflet entra en `#mapa` (hoy placeholder vacío).
- **Fase 8:** la suite de verificación de paridad (visual-diff contra el golden) — los specs `shell.spec.ts`/`theme.spec.ts` de este plan ya aportan parte de la red comportamental.
- **Sin bloqueantes para F4.** typecheck (exit 0), specs de F3 + data en verde.

## Self-Check: PASSED

- `app/app.vue` — FOUND (modificado: NuxtPage + head de paridad, favicon preservado)
- `app/pages/index.vue` — FOUND
- `app/pages/trips/[slug].vue` — FOUND
- `tests/parity/shell.spec.ts` — FOUND
- `tests/parity/theme.spec.ts` — FOUND
- Commit `b09dfbc` (Task 1, feat) — FOUND
- Commit `9da2125` (Task 2, test) — FOUND
- Commit `6ff7925` (Task 3, test) — FOUND
- Task 4 (checkpoint humano de paridad golden) — APROBADO por el usuario
- `pnpm typecheck` exit 0 (revalidado); grep: `NuxtPage`+`theme-color` en app.vue, `TripView` en index.vue, `createError` en [slug].vue

---
*Phase: 03-capa-de-p-gina-layout-y-tema*
*Completed: 2026-06-19*
