---
phase: 03-capa-de-p-gina-layout-y-tema
plan: 04
subsystem: ui
tags: [vue, nuxt, nuxt-content, mdc, components, ssg, parity]

# Dependency graph
requires:
  - phase: 03-capa-de-p-gina-layout-y-tema (Plan 02)
    provides: useTrip(slug) — punto de entrada tipado a las 6 colecciones (trip/days refs)
  - phase: 03-capa-de-p-gina-layout-y-tema (Plan 03)
    provides: chrome auto-importado (Topbar con prop days, ThemeToggle, NavPills, BackButton)
  - phase: 02 (datos)
    provides: TripSchema + content/trips/roma/trip.yml (decoration/title/meta/quote/quoteAttr/infoCards/howTo)
provides:
  - "TripView.vue — componente que POSEE la página: chrome (Topbar+BackButton+flourish+footer) + las 12 anclas de sección en orden (D-05, ARCH-01/02), reusable para / y /trips/[slug]"
  - "TheHero.vue — el #inicio COMPLETO renderizado desde trip.yml vía MDC (D-06): masthead + placeholders de layout + info-grid + how-to"
  - "Convención de árbol de página confirmada (A3): TripView llama a useTrip; las páginas serán `<TripView :slug>` (Plan 05)"
affects: [Plan 05 (montaje en rutas + parity Playwright), Fase 4 (rellena las 11 secciones placeholder), Fase 7 (isla Leaflet en #mapa)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TripView posee el document tree y el scaffold de 12 anclas (id = slug); rellena solo #inicio, deja 11 <section> vacías como placeholders para F4/F7"
    - "Prosa de trip.yml renderizada con <MDC>: unwrap='p' en los casos inline (title dentro de h1, infoCards value), sin unwrap (mantiene <p>) en howTo"
    - "Placeholders de layout (search-wrap/pace-wrap/light-wrap) reproducidos verbatim SIN manejadores (su comportamiento es F4/F6)"

key-files:
  created:
    - app/components/TheHero.vue
    - app/components/TripView.vue
  modified: []

key-decisions:
  - "TripView es el poseedor de la página (A3 resuelto): llama a await useTrip(props.slug) y monta chrome + 12 anclas; las páginas del Plan 05 serán one-liners `<TripView :slug>`"
  - "Las 11 secciones no-#inicio son <section id> reales y VACÍAS (solo id, sin contenido ni height) — una altura fija desplazaría cada ancla y rompería el scrollspy de F5 (scroll-padding-top:124px); vacías, las reglas section{padding}/section+section{border-top} aplican igual que en el golden"
  - "MDC unwrap (RESEARCH §Open Q1 RESUELTA): unwrap='p' en title + infoCards value (cuadre de ritmo vertical), <p> conservado en howTo; el cuadre a pixel se verifica contra el golden en el Plan 05"
  - "v-if='trip' en <TheHero> estrecha el tipo (TheHero espera Trip no-nulo) desde el Ref<Trip|null> de useTrip; en / (slug roma) y /trips/[slug] válido trip siempre existe (la página [slug] hace guard 404), así que #inicio nunca se oculta — es solo seguridad de tipos"
  - "Día = slugs españoles #viernes/#sabado/#domingo/#lunes/#martes (fuente de verdad: ids de <section> del index.html y nav-pills), no las grafías italianas que aparecían sueltas en una nota del plan"

patterns-established:
  - "Componentes de página/contenido en <script setup lang=ts> con defineProps<{...}>(), markup verbatim del index.html (atributo-por-línea), comentario de cabecera con la justificación de paridad/decisión, CERO CSS y SIN bloque <style>"

requirements-completed: [ARCH-01, ARCH-02, UI-01]

# Metrics
duration: 11min
completed: 2026-06-19
---

# Phase 3 Plan 04: TripView + TheHero (capa de página) Summary

**TripView posee el árbol completo de la página (chrome + 12 anclas slug en orden, vía useTrip) y TheHero renderiza el #inicio íntegro desde trip.yml con MDC (unwrap en los inline); cero CSS nuevo, paridad por construcción.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-06-19T13:05:08Z
- **Completed:** 2026-06-19T13:17:00Z
- **Tasks:** 2
- **Files modified:** 2 (ambos creados)

## Accomplishments
- **TheHero.vue (D-06):** `section#inicio` verbatim del index.html:2283-2358 — masthead (hero-decoration/h1 con `<em>Roma</em>` vía MDC/hero-meta/hero-quote), los placeholders solo-de-layout (search-wrap, pace-wrap con 3 pace-btn + 2 light-wrap) reproducidos sin manejadores, `info-grid` con `v-for` sobre `trip.infoCards`, y `howTo` con `v-for`; las dos `<h4>` ("Datos del viaje" / "Cómo usar esta guía") como texto estático.
- **TripView.vue (D-05, ARCH-01/02):** poseedor del `<body>` — orden de hermanos `Topbar(:days)` → `main` → `BackButton` → `div.flourish` → `footer`, con `main` envolviendo `TheHero` (#inicio) + las 11 secciones vacías (`mapa, viernes, sabado, domingo, lunes, martes, reservas, gastronomia, practica, arte, arquitectura`). Llama a `await useTrip(props.slug)`; footer y flourish verbatim.
- **MDC cableado correctamente:** `unwrap="p"` en los dos casos inline (title, infoCards value), `<p>` conservado en howTo — exactamente la resolución de RESEARCH §Open Q1.
- **Paridad por construcción:** cero CSS nuevo, sin `<style>` en ningún componente, sin enlace de ruta a `/trips/*` (disciplina de prerender D-01).

## Task Commits

Each task was committed atomically:

1. **Task 1: TheHero — full #inicio from trip data via MDC (D-06)** - `11c4514` (feat)
2. **Task 2: TripView — chrome owner + 12-anchor scaffold (D-05, ARCH-01/02)** - `fbae9da` (feat)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `app/components/TheHero.vue` - El #inicio completo desde trip.yml vía MDC: masthead + placeholders de layout + info-grid + how-to; dos h4 estáticas; cero CSS.
- `app/components/TripView.vue` - Poseedor de la página: chrome + 12 anclas slug en orden; llama a useTrip(props.slug); footer/flourish verbatim; cero CSS.

## Decisions Made
- **TripView llama a useTrip (A3 resuelto):** el componente posee chrome + secciones, así las páginas del Plan 05 son one-liners. Consistente con el comentario de `useTrip.ts` (Plan 02) y con lo que seguirá Fase 4.
- **Placeholders = secciones vacías sin altura:** evitan el desplazamiento de anclas que rompería el scrollspy de F5; mantienen el ritmo `padding`/`border-top` del golden.
- **MDC unwrap solo en inline:** `unwrap="p"` en title + infoCards value, `<p>` en howTo (RESEARCH §Open Q1); el cuadre a pixel se valida en el parity Playwright del Plan 05.
- **`v-if="trip"` como guard de tipo:** estrecha `Ref<Trip|null>` → `Trip` para la prop de TheHero sin ocultar nunca #inicio en la práctica (trip siempre presente para roma / slug válido).
- **Slugs de día en español:** `#viernes…#martes` (ids reales del index.html y de nav-pills), no las grafías italianas sueltas de una nota del plan; coincide con los `<acceptance_criteria>` del propio plan y con NavPills (Plan 03).

## Deviations from Plan

None - plan executed exactly as written.

(Nota de hygiene de verificación, no es una desviación de código: se reformularon dos comentarios de cabecera para que no contuvieran los tokens literales `<style scoped>` / `NuxtLink` / `style`, de modo que las aserciones `grep` del propio plan —que buscan la ausencia de esos tokens en todo el fichero— pasen sin falsos positivos. El código siempre fue correcto: ningún `<style>`, ningún `<NuxtLink>`, ningún manejador en los placeholders.)

## Issues Encountered
- **Lint `vue/multiline-html-element-content-newline` en `<h1><MDC .../></h1>`:** la regla stylistic exige saltos de línea cuando el contenido es multilínea. Resuelto poniendo el `<MDC>` en sus propias líneas dentro del `<h1>`. El espacio en blanco resultante dentro del h1 lo colapsa el render (no afecta al `<em>Roma</em>` ni al cuadre de ritmo, que es de espaciado vertical entre bloques). typecheck + lint verde tras el ajuste.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- **Plan 05 (siguiente):** montar `<TripView slug="roma" />` en `app/pages/index.vue` y `<TripView :slug>` en `app/pages/trips/[slug].vue` (con guard 404), `app/app.vue` → `<NuxtLayout><NuxtPage/></NuxtLayout>` o equivalente, y la verificación de paridad Playwright contra el golden (incluido el cuadre del unwrap MDC y el comportamiento de scroll de las 12 anclas).
- **Fase 4:** rellenar las 11 secciones placeholder (timeline/cards por día, food, reference, artists) — los ids ya están en su sitio.
- **Fase 7:** la isla Leaflet entra en `#mapa` (hoy placeholder vacío).
- **Sin bloqueantes.** typecheck (exit 0) y lint de todo el proyecto en verde; paridad visual real (no aserciones de fuente) se prueba en el Plan 05.

## Self-Check: PASSED

- `app/components/TheHero.vue` — FOUND
- `app/components/TripView.vue` — FOUND
- Commit `11c4514` (Task 1) — FOUND
- Commit `fbae9da` (Task 2) — FOUND
- typecheck exit 0; `pnpm lint` (proyecto completo) limpio
- Aserciones grep del plan: TheHero contiene `inicio` + `info-grid`, sin `style`; TripView contiene `useTrip` + `arquitectura`, sin `style`; las 11 secciones placeholder tienen exactamente los ids `mapa..arquitectura`; sin manejadores en placeholders; sin enlace de ruta a `/trips/`

---
*Phase: 03-capa-de-p-gina-layout-y-tema*
*Completed: 2026-06-19*
