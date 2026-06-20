---
phase: 04-render-de-contenido-modos-de-ritmo
plan: 05
subsystem: ui
tags: [nuxt4, vue3, nuxt-content, mdc, leaflet-na, playwright, useState, resolveComponent, ssg]

# Dependency graph
requires:
  - phase: 04-render-de-contenido-modos-de-ritmo (Planes 01-04)
    provides: "useTripModes (singleton pace/light/resumen + isVisible), pace.ts, DetailPhoto.global, MonumentCard, familia Timeline (5 hojas), GastroCard/GastroSection, ArtistCard, ReservasSection, PracticaSection, foodGroups; D1/D-04-D resuelto (queryCollection artist/reference materializa columnas)"
  - phase: 03-pagina-layout-tema
    provides: "TripView (poseedor de la página + 12 anclas), TheHero (#inicio con controles ya montados sin handlers), useTrip(slug), Topbar/NavPills, specs de paridad autocontenidos (shell/theme/subpath), golden de F1"
provides:
  - "TheHero cableado a useTripModes (FEAT-06/07/08): 3 pace-btn + light/resumen-toggle reactivos sin reestructurar el #inicio"
  - "DaySection: contenedor de día completo (header/stats/dia-ligera/Timeline/cards-list) que resuelve day.cards[]→monById en orden del dato"
  - "TripView con las 11 secciones enchufadas desde un solo useTrip (5 DaySection + reservas/gastronomia/practica/arte/arquitectura); #mapa vacío (F7)"
  - "4 specs Playwright autocontenidos: render-cards/timeline/reference (DOM del / construido, SC#1/2/3) + modes (E2E de los 3 modos, SC#4)"
  - "Fix Timeline.vue: resolveComponent() para el dispatcher por kind (el :is por string crudo no resolvía los auto-imports en SSG)"
affects: [05-navegacion, 06-derivados-busqueda, 07-isla-mapa-fallback, 08-verificacion-paridad]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dispatcher dinámico por kind con resolveComponent(): :is recibe la DEFINICIÓN del componente (no un string crudo) → resuelve auto-imports en SSG"
    - "Cableado de controles ya montados a un composable singleton (CONSUMIR, no reestructurar): :class/@click/:aria-pressed sobre el markup de paridad existente"
    - "Especificación E2E de modos sobre la build estática: interacción + persistencia (addInitScript localStorage) + micro-flash (MutationObserver), mirror de theme.spec.ts"

key-files:
  created:
    - app/components/DaySection.vue
    - tests/parity/render-cards.spec.ts
    - tests/parity/render-timeline.spec.ts
    - tests/parity/render-reference.spec.ts
    - tests/parity/modes.spec.ts
  modified:
    - app/components/TheHero.vue
    - app/components/TripView.vue
    - app/components/Timeline.vue

key-decisions:
  - "TheHero CONSUME useTripModes para cablear sus controles ya montados (D-05): 3 pace-btn con :class active reactivo + @click; light/resumen-toggle con :aria-pressed + @click; el 1er pace-btn pierde el active LITERAL (si no, Vue lo mergea y queda siempre activo). Sin reestructurar el #inicio, sin tocar el search-input (F6), CERO CSS"
  - "DaySection resuelve day.cards[]→monById→MonumentCard en el ORDEN del dato (Pitfall 6, la ruta del día de F6); monta light-banner/eyebrow/day-header/day-stats/dia-ligera(v-if)/Timeline/cards-list verbatim de index.html:2375-2448; CERO CSS"
  - "TripView amplía useTrip (monById/food/artists/refById) y rellena las 11 secciones por props desde un SOLO useTrip (mismo patrón que Topbar :days); #arte/#arquitectura con section-eyebrow + h2.section-title estático + p.art-intro (de trip.sections) FUERA de las cards, ArtistCard filtrado por kind, glosario al final; #mapa sigue vacío (F7)"
  - "[Rule 3] Timeline.vue: <component :is='STRING'> NO resolvía los componentes auto-importados en el SSG (emitía <TimelineStop></TimelineStop> vacíos); resuelto con resolveComponent() por nombre en el setup. El patrón compilaba/lint pero no rendía — bug latente del Plan 04-03 que solo afloraba al montar Timeline en una página real (el propio 04-03 difirió 'el render real lo asevera el Plan 05')"
  - "Los 4 specs son AUTOCONTENIDOS (mirror EXACTO de shell.spec.ts/theme.spec.ts): beforeAll genera+copia .output/public a <tmp>/guiaRoma/ + serve propio, afterAll teardown; toleran SOLO el error de hidratación de color-mode; NO usan el webServer del golden; NO rebaselinan (D-08). Aserciones DOM/texto/conteo, no screenshots"
  - "La aserción de la imagen detail-photo es ESTRUCTURAL (.detail-photo > img con src/alt del dato), NO de visibilidad del píxel: las heros son URLs de terceros (Wikimedia) y su carga real es la barra del checkpoint humano (D-06), no de un spec determinista"

patterns-established:
  - "Dispatcher por discriminatedUnion con resolveComponent: para cualquier :is dinámico sobre auto-imports de Nuxt, resolver el nombre con resolveComponent() en el setup (no pasar el string a :is)"
  - "Specs E2E de estado cliente sobre SSG: build estática + serve propio + interacción real; persistencia con context.addInitScript(localStorage); micro-flash observado con MutationObserver (default prerenderizado → estado restaurado en onMounted)"

requirements-completed: [UI-02, UI-03, UI-04, FEAT-06, FEAT-07, FEAT-08]

# Metrics
duration: 22min
completed: 2026-06-20
---

# Fase 4 Plan 05: Cableado de modos + render data-driven de las 11 secciones + 4 specs de paridad Summary

**TheHero cablea los 3 modos a `useTripModes` sin tocar el #inicio, `DaySection` + `TripView` enchufan el render data-driven en las 11 secciones (incl. arte/arquitectura/reservas/práctica con datos reales tras D1), y 4 specs Playwright autocontenidos prueban el DOM de fichas/timeline/referencia y el comportamiento E2E de ritmo/caminar-menos/resumen con persistencia y micro-flash — el render de la Fase 4 queda visible y verificado, listo para el sign-off humano.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-06-20T14:38:57Z
- **Completed:** 2026-06-20T15:01:47Z
- **Tasks:** 3 de 3 automáticas completas (Task 4 = checkpoint humano, PENDIENTE)
- **Files modified:** 8 (3 modificados + 5 creados)

## Accomplishments

- **TheHero cableado a los 3 modos (FEAT-06/07/08):** los `pace-btn`/`light-toggle`/`resumen-toggle` que la paridad de F3 dejó montados sin handlers ahora consumen `useTripModes` (`:class active` + `@click` en los 3 pace-btn; `:aria-pressed` + `@click` en light/resumen). El #inicio no se reestructura, el search-input (F6) queda intacto, CERO CSS.
- **DaySection (NUEVO) + TripView con las 11 secciones:** `DaySection` resuelve `day.cards[]` contra `monById` en el orden del dato y monta el día completo; `TripView` amplía su `useTrip` y rellena las 5 secciones de día + reservas/gastronomía/práctica/arte/arquitectura por props desde un solo `useTrip`. `#mapa` sigue vacío (F7). Render real confirmado: 38 fichas, timeline completo, 7 grupos de gastro en orden, 13 artist-cards, 10 arch-term.
- **4 specs Playwright autocontenidos verdes (SC#1-SC#4):** `render-cards`/`render-timeline`/`render-reference` aseveran el DOM del `/` construido; `modes` asevera la matriz de ritmo exacta, caminar-menos (fuerza slow sin revertir), resumen (set de ocultos), persistencia y el micro-flash. 48 ejecuciones verdes (mobile + desktop), sin rebaselinar el golden.
- **Fix de un bug latente (Timeline dispatcher):** el `<component :is="STRING">` no resolvía los auto-imports en el SSG (timeline vacío); resuelto con `resolveComponent()`. Esto era exactamente lo que el Plan 04-03 difirió a "el render real lo asevera el Plan 05".

## Task Commits

Cada task se commiteó atómicamente:

1. **Task 1: Cablear TheHero + DaySection + enchufar TripView** - `ed6da66` (feat) — incluye el fix [Rule 3] de Timeline.vue
2. **Task 2: Specs DOM autocontenidos (cards + timeline + reference)** - `2744260` (test)
3. **Task 3: Spec E2E de los 3 modos** - `435265d` (test)

**Task 4 (checkpoint:human-verify):** PENDIENTE — sign-off humano de paridad de render con imágenes reales (D-06). NO auto-aprobado.

**Plan metadata:** (pendiente del commit final de docs)

## Files Created/Modified

- `app/components/TheHero.vue` (modificado) — `const { pace, light, resumen } = useTripModes()`; los 3 pace-btn con `:class="{ active: pace === '…' }"` + `@click`; light/resumen-toggle con `:aria-pressed` + `@click`. Sin reestructurar el #inicio, CERO CSS.
- `app/components/DaySection.vue` (NUEVO) — contenedor de día. `defineProps<{ day: Day, monById: Map }>()`; `dayCards = computed(...)` mapea `day.cards`→`monById` en orden con filtro de no-nulos; markup verbatim de index.html:2375-2448 (light-banner/section-eyebrow/day-header/day-stats/dia-ligera v-if/Timeline/cards-list). CERO CSS.
- `app/components/TripView.vue` (modificado) — `const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)`; las 11 secciones enchufadas; #arte/#arquitectura con eyebrow/section-title/art-intro + ArtistCard por kind (glosario al final); #mapa vacío. CERO CSS.
- `app/components/Timeline.vue` (modificado, [Rule 3]) — `COMPONENT_BY_KIND` ahora mapea cada nombre vía `resolveComponent(...)` para que `:is` reciba la definición real (no un string). Render confirmado.
- `tests/parity/render-cards.spec.ts` (NUEVO) — DOM de MonumentCard sobre el / construido (detail-photo resuelto, detail-list, dropcap, facts, maps-link, notas, card-artists→art-link, 38 fichas).
- `tests/parity/render-timeline.spec.ts` (NUEVO) — DOM del timeline (5 kinds en #viernes, reserved-event, :data-pace conservado, orden = dato).
- `tests/parity/render-reference.spec.ts` (NUEVO) — DOM de las secciones de referencia (reservas-table+badges+is-done, 7 grupos de gastro en orden canónico, artist-cards de #arte, 5 edades + glosario de 10 términos en #arquitectura).
- `tests/parity/modes.spec.ts` (NUEVO) — E2E de los 3 modos: matriz de ritmo, caminar-menos sin revertir, resumen set exacto, persistencia (roma-pace/light/resumen) y micro-flash intencional.

## Decisions Made

- **Orden de clases en el markup renderizado (no es regresión):** Vue antepone el valor de `:class` a la `class` estática (p. ej. `class="active pace-btn"`, `class="walk day-stats-item"`). Es una diferencia de ORDEN DE STRING, no de pertenencia: los selectores CSS (`.pace-btn.active`, `.day-stats-item.walk`) casan por `classList`, no por orden textual → visualmente idéntico. Consistente con cómo rinden los componentes de Wave 2.
- **El wrapper `<div class="">` de D-04-A persiste** en el caption de detail-photo y en algún `<MDC unwrap="p">` sin `:tag="false"` (DetailPhoto.global/TheHero, de planes anteriores). No bloquea ninguna aserción (los `toContainText` cruzan el wrapper) y queda como carry-forward D-04-A para el verificador/plan futuro.
- **Aserción de imagen ESTRUCTURAL, no de píxel:** `render-cards` asevera que `:detail-photo` resolvió a un `.detail-photo > img` con su `src`/`alt` (la prueba de que la directiva MDC se renderizó), NO `toBeVisible()` — la carga real de las heros de Wikimedia es la barra del checkpoint humano (D-06), no de un spec determinista (una imagen sin red tendría tamaño 0 → "hidden" por motivos ajenos al render).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Timeline dispatcher: `<component :is="STRING">` no resolvía los auto-imports en el SSG**
- **Found during:** Task 1 — al verificar el render con `pnpm generate` tras enchufar DaySection en TripView.
- **Issue:** `Timeline.vue` (Plan 04-03) despachaba con `<component :is="COMPONENT_BY_KIND[row.kind]">` donde el valor es un STRING (`'TimelineStop'`…). El auto-import de Nuxt es una transformación en COMPILACIÓN que solo inyecta el import de los componentes referenciados ESTÁTICAMENTE en el template; un nombre que vive en un objeto JS no es referencia estática, así que Vue trataba `:is` como elemento nativo y emitía `<TimelineStop></TimelineStop>` VACÍO. El timeline entero salía sin filas (`tl-` ocurrencias = 0 en el HTML construido). El patrón sí compilaba/lint, pero no rendía — bug latente: Timeline nunca se había montado en una página real (las secciones de TripView estaban vacías hasta este plan), y el propio 04-03 difirió "el render real (los 5 kinds) lo asevera el Plan 05".
- **Fix:** mapear cada nombre de `COMPONENT_BY_KIND` a través de `resolveComponent(...)` en el setup, para que `:is` reciba la DEFINICIÓN del componente. `resolveComponent('TimelineStop')` SÍ es referencia estática → Nuxt inyecta el auto-import. Se conserva el patrón dispatcher (mapa kind→componente, orden = dato).
- **Files modified:** `app/components/Timeline.vue`
- **Verification:** `pnpm typecheck` 0, `pnpm lint` 0, `pnpm generate` 0 sin request-errors; render real: `tl-item`×60, `tl-transport`×345, `tl-meta`×142, `tl-food`×102, `tl-resv-meta`×9, `reserved-event`×9, `<TimelineStop>` vacíos = 0; dev (`/trips/roma`) también rinde el timeline. `render-timeline.spec` + `modes.spec` verdes.
- **Committed in:** `ed6da66` (commit de Task 1)

**2. [Rule 1 - Bug] Comentario de cabecera con el literal que rompía la gate de grep (TheHero)**
- **Found during:** Task 1 — al correr la `<automated>` verify (`! grep -q 'class="pace-btn active"'`).
- **Issue:** Mi comentario de cabecera explicaba el cambio citando textualmente la cadena `class="pace-btn active"` que el botón perdía. El código del template ya NO la tenía (correcto), pero la gate negativa de grep matcheaba el comentario → falso rojo. (Mismo patrón que las deviations de comentarios de los Planes 04-01/04-03.)
- **Fix:** reescribir el comentario para describir el cambio ("pierde su clase estática `active` literal") sin incluir la cadena exacta que la gate busca.
- **Files modified:** `app/components/TheHero.vue`
- **Verification:** la cadena de gates de Task 1 (`lint && grep useTripModes && ! grep 'class="pace-btn active"' && grep DaySection && grep cards-list && ! grep <style`) pasa.
- **Committed in:** `ed6da66` (commit de Task 1)

**3. [Rule 1 - Bug] Aserción de visibilidad del detail-photo img dependía de la red (render-cards)**
- **Found during:** Task 2 — primera ejecución de `render-cards.spec`.
- **Issue:** `expect(detailPhoto.locator('img')).toBeVisible()` fallaba: el `<img>` resolvía con su `src`/`alt` correctos pero `toBeVisible()` daba `hidden` porque la imagen de Wikimedia no carga sin red → tamaño 0. Eso prueba la red, no el render.
- **Fix:** cambiar a aserción ESTRUCTURAL — `toBeAttached()` + `toHaveAttribute('alt'/'src', …)`. Prueba que `:detail-photo` resolvió a un componente real con su `<img>` (el objetivo SC#1), de forma determinista; la carga real de la imagen es la barra del checkpoint humano (D-06).
- **Files modified:** `tests/parity/render-cards.spec.ts`
- **Verification:** `render-cards.spec` 6/6 verde (mobile + desktop).
- **Committed in:** `2744260` (commit de Task 2)

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** El [Rule 3] de Timeline era IMPRESCINDIBLE — sin él la Fase 4 entera no rinde el timeline (el render de UI-03 no sería visible ni verificable). Los otros dos son ajustes menores de gate/determinismo de test. Cero scope creep; todos dentro del alcance del plan (hacer visible y verificar el render). Timeline.vue se añadió a los ficheros del plan por ser la dependencia bloqueante del criterio "DaySection monta Timeline".

## Issues Encountered

- **Falsos rojos en la suite COMPLETA de Playwright (no en mis specs):** `pnpm playwright test` (todas) dio 51 passed / 2 failed. Las 2 son ENTORNO, no regresión: (a) `golden.spec.ts golden light` — flaky de screenshot bajo contención de workers paralelos (PASA en aislamiento, 18.8s; sirve el index.html vivo, ajeno a mi código); (b) `shell.spec.ts routing` — bloqueada por un LOCK de `pnpm dev` zombie de una corrida previa ("Another Nuxt dev is already running"); tras matar el zombie + borrar `.nuxt/nuxt.lock`, PASA (4.2s). Verificado que `pnpm dev` arranca limpio y `/`, `/trips/roma` (200) y `/trips/nope` (404) funcionan, con el timeline rindiendo también en dev. El golden NO se rebaselinó (D-08: `git status` sin cambios en snapshots).
- **Carry-forwards de F4 sin tocar (alcance ajeno):** D-04-A (wrapper `<div class="">` de `<MDC unwrap="p">` en DetailPhoto/TheHero), D-04-B (variantes metro/metro-b perdidas en datos F2 + enum), D-04-C (`**…**`→`<strong>` vs el selector `b` de `.tl-meta-item.ok/.warn`). Son de datos F2 / planes anteriores; el verificador/plan futuro los cierra. No bloquean SC#1-SC#4 ni la paridad estructural.

## User Setup Required

None - no se requiere configuración de servicios externos.

## Next Phase Readiness

- **Render data-driven completo y verificado:** las 5 secciones de día + las 5 de referencia rinden desde datos; los 3 modos funcionan con persistencia. UI-02/03/04 + FEAT-06/07/08 cubiertos por specs verdes.
- **Pendiente Task 4 (checkpoint humano, D-06):** falta el sign-off humano de paridad visual con imágenes reales cargando (un día representativo + cada sección de referencia, claro + oscuro) y la comprobación en vivo de los 3 modos. El render está construido y servible (`pnpm generate` + serve `.output/public` bajo /guiaRoma/).
- **Listo para F5 (navegación):** `useCardNavigation` y sus consumidores (mapa/búsqueda/enlaces) se construyen sobre este render. El `#mapa` vacío espera la isla Leaflet (F7); el fallback de imagen (F7) y el pixel-diff total (F8) son las barras posteriores.

---
*Phase: 04-render-de-contenido-modos-de-ritmo*
*Completed: 2026-06-20*

## Self-Check: PASSED

- Ficheros creados verificados en disco: `app/components/DaySection.vue`, `tests/parity/render-cards.spec.ts`, `render-timeline.spec.ts`, `render-reference.spec.ts`, `modes.spec.ts`, `04-05-SUMMARY.md` — todos FOUND.
- Ficheros modificados verificados: `app/components/TheHero.vue`, `TripView.vue`, `Timeline.vue` — todos FOUND.
- Commits verificados en git: `ed6da66` (Task 1, feat), `2744260` (Task 2, test), `435265d` (Task 3, test) — todos FOUND.
- Gates automáticas: typecheck 0, lint 0, test:unit 27/27, test:data 295/295, los 4 specs nuevos verdes (48 ejecuciones mobile+desktop). Golden NO rebaselinado (D-08).
