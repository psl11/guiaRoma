---
phase: 04-render-de-contenido-modos-de-ritmo
plan: 03
subsystem: ui
tags: [nuxt, vue, timeline, dispatcher, discriminated-union, mdc, pace-filter, pitfall-4, parity]

# Dependency graph
requires:
  - phase: 02-datos-tipados
    provides: "esquema zod Day.timeline = discriminatedUnion('kind') de 5 ramas (stop/transport/meta/food/reservation) + los 5 YAML de día migrados (timeline[] en orden)"
  - phase: 03-pagina-layout-tema
    provides: "patrón de componente (script setup lang=ts + markup verbatim + CERO CSS), NavPills (v-for sobre array tipado), eslint per-file allowlist"
  - phase: 04-render-de-contenido-modos-de-ritmo (Plan 01)
    provides: "useTripModes().isVisible (singleton reactivo, matriz de ritmo), eslint allowlist del nombre Timeline"
  - phase: 04-render-de-contenido-modos-de-ritmo (Plan 02)
    provides: "learning D-04-A: <MDC> inline necesita :tag=false para suprimir el <div> envoltorio de MDCRenderer"
provides:
  - "app/components/Timeline.vue — dispatcher por kind (UI-03): itera day.timeline[] en orden de dato y despacha con <component :is=COMPONENT_BY_KIND[row.kind]> (1:1 con el discriminatedUnion, D-09)"
  - "app/components/TimelineStop.vue — .tl-item; SE FILTRA por ritmo (tl-hidden via isVisible) + :data-pace"
  - "app/components/TimelineTransport.vue — .tl-transport (variante bindeada directo); SE FILTRA por ritmo"
  - "app/components/TimelineMeta.vue — .tl-meta; NO filtra (Pitfall 4)"
  - "app/components/TimelineFood.vue — .tl-food; NO filtra (Pitfall 4, aunque la rama lleve pace)"
  - "app/components/TimelineReservation.vue — .tl-resv-meta; NO filtra (Pitfall 4)"
affects: [04-05-hero-cableado, 05-derivados-navegacion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dispatcher por discriminatedUnion: COMPONENT_BY_KIND (Record kind→nombre) + <component :is> resuelto por STRING (auto-imports planos, A5); orden = dato (nunca reordenar)"
    - "Estrechamiento de la rama por prop: type XRow = Extract<Day['timeline'][number], { kind: 'x' }> (una sola fuente de tipos: el esquema zod)"
    - "Filtrado por ritmo localizado en SOLO 2 de 5 componentes (Pitfall 4): el riesgo de filtrar la fila equivocada queda confinado a TimelineStop/Transport; los otros 3 ni importan el composable"
    - "Variante de clase BINDEADA directa (row.variant) en vez de check hardcodeado → fiel a cualquier variante futura (metro/metro-b) sin tocar el componente"

key-files:
  created:
    - app/components/Timeline.vue
    - app/components/TimelineStop.vue
    - app/components/TimelineTransport.vue
    - app/components/TimelineMeta.vue
    - app/components/TimelineFood.vue
    - app/components/TimelineReservation.vue
  modified:
    - eslint.config.mjs

key-decisions:
  - "Timeline despacha con <component :is=COMPONENT_BY_KIND[row.kind]> (string→auto-import, A5), itera day.timeline[] en orden de dato, NO importa useTripModes (el filtrado vive en las hojas, no en el dispatcher)"
  - "Filtrado por ritmo SOLO en TimelineStop + TimelineTransport (Pitfall 4): :class={'tl-hidden': !isVisible(row.pace)} + :data-pace conservado por paridad de atributo; los otros 3 ni importan el composable"
  - "TimelineReservation renderiza TODO row.text via <MDC> (el ✅ ya viene en el dato F2; NO se añade ✅ literal — eso lo DUPLICARÍA, divergencia de la suposición del plan); Rule 1"
  - "Variante de transporte bindeada directa (:class=[row.variant, {...}]) en vez de enum hardcodeado → soporta metro/metro-b cuando F2 los recupere (deferred D-04-B)"
  - "Tipos de prop por Extract<Day['timeline'][number], {kind}> — sin redefinir shapes; el campo .fixed-event NO se renderiza (la rama stop no lo expresa: solo disabled/reservedEvent)"
  - ":tag=false + unwrap=p en TODOS los <MDC> inline (tl-note, desc/meta/footnote de transporte, tl-meta-item, tl-food-desc/foot, tl-resv-meta) — learning D-04-A de 04-02"

patterns-established:
  - "Componente dispatcher por discriminatedUnion via COMPONENT_BY_KIND + <component :is> (reutilizable para cualquier unión: ArtistCard ramifica distinto, pero el patrón de mapa kind→componente queda sentado)"
  - "Relajación per-file de vue/*-content-newline + max-attributes-per-line para hojas que incrustan <MDC> en contenedores inline whitespace-sensibles (precedente MonumentCard, ampliado a las 5 hojas del timeline)"

requirements-completed: [UI-03, FEAT-06]

# Metrics
duration: 6min
completed: 2026-06-20
---

# Fase 4 Plan 03: Familia Timeline — dispatcher + 5 hojas por kind Summary

**`Timeline.vue` despacha `day.timeline[]` por `kind` con `<component :is=COMPONENT_BY_KIND[row.kind]>` (1:1 con el `discriminatedUnion`, orden = dato) hacia las 5 hojas; `TimelineStop`/`TimelineTransport` reproducen su markup verbatim, conservan `:data-pace` y SE FILTRAN por ritmo vía `isVisible` (singleton del Plan 01), mientras `TimelineMeta`/`Food`/`Reservation` NUNCA consultan la matriz (Pitfall 4 confinado a 2 de 5 componentes); CERO CSS, MDC inline con `:tag=false`, typecheck + lint + tests verdes.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-06-20T10:54Z (carga de plan + lectura de fuentes + greps de variantes/datos)
- **Completed:** 2026-06-20T11:00Z
- **Tasks:** 2 (ambas type=auto)
- **Files modified:** 7 (6 componentes creados + eslint.config.mjs)

## Accomplishments
- **`app/components/Timeline.vue`** — DISPATCHER (UI-03). `defineProps<{ rows: Day['timeline'] }>()` + `COMPONENT_BY_KIND` (mapa `kind`→nombre, `as const`) + `div.timeline` con `<component :is="COMPONENT_BY_KIND[row.kind]" v-for>` en orden de dato. NO importa el composable de modos, NO reordena. Análogo `NavPills.vue`. CERO CSS.
- **`app/components/TimelineStop.vue`** — `.tl-item` (UI-03/FEAT-06). SE FILTRA por ritmo: `:class="{ 'tl-hidden': !isVisible(row.pace), 'reserved-event': row.reservedEvent }"` + `:data-pace` (paridad de atributo). Título condicional `a.tl-title[href="#"+ref]` vs `span.tl-title.disabled` (verbatim index.html:2406/2409); `tl-tag`/`tl-note` opcionales; `tl-note` vía `<MDC unwrap="p" :tag="false">`.
- **`app/components/TimelineTransport.vue`** — `.tl-transport` (UI-03/FEAT-06). SE FILTRA por ritmo. Clase de variante BINDEADA directa (`:class="[row.variant, {...}]"`), `tl-transport-mode` por `row.modes` (`.recommended`), `tl-transport-mode-tag` ANIDADO en el desc (verbatim index.html:2405); `desc`/`meta`/`footnote` vía MDC inline.
- **`app/components/TimelineMeta.vue`** — `.tl-meta` (UI-03, Pitfall 4). NO filtra. `tl-meta-item` por `row.items` con clase del `level` (ok/warn/plain); texto vía MDC inline.
- **`app/components/TimelineFood.vue`** — `.tl-food` (UI-03, Pitfall 4). NO filtra (aunque la rama lleve `pace`). `tl-food-header` + `tl-food-list`(`tl-food-item` `.reserved`, `a.tl-food-name` con `#ref` plano o `href` externo `target/rel` verbatim, `tl-resv-badge`/`tl-food-time`, `span.tl-food-desc`) + `tl-food-foot`; desc/foot vía MDC inline.
- **`app/components/TimelineReservation.vue`** — `.tl-resv-meta` (UI-03, Pitfall 4). NO filtra. Renderiza TODO `row.text` vía `<MDC unwrap="p" :tag="false">` (el ✅ ya está en el dato F2 → NO se duplica).
- **Pitfall 4 confinado:** exactamente 2 de los 6 ficheros (`TimelineStop`, `TimelineTransport`) consultan `isVisible`; los otros 4 (dispatcher + Meta/Food/Reservation) ni importan el composable (greps de verificación verdes).

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1: Timeline dispatcher + filas que filtran por ritmo (UI-03/FEAT-06)** - `4c6d869` (feat) — Timeline.vue + TimelineStop.vue + TimelineTransport.vue + eslint.config.mjs (deviation Rule 3).
2. **Task 2: filas que NO filtran por ritmo (UI-03, Pitfall 4)** - `443abb5` (feat) — TimelineMeta.vue + TimelineFood.vue + TimelineReservation.vue + eslint.config.mjs (ampliación de la relajación).

**Plan metadata:** (commit docs final con SUMMARY/STATE/ROADMAP/REQUIREMENTS).

## Files Created/Modified
- `app/components/Timeline.vue` — dispatcher por kind (`COMPONENT_BY_KIND` + `<component :is>`).
- `app/components/TimelineStop.vue` — `.tl-item`, filtra por ritmo (`isVisible` + `:data-pace`).
- `app/components/TimelineTransport.vue` — `.tl-transport`, filtra por ritmo, variante bindeada directa.
- `app/components/TimelineMeta.vue` — `.tl-meta`, NO filtra.
- `app/components/TimelineFood.vue` — `.tl-food`, NO filtra.
- `app/components/TimelineReservation.vue` — `.tl-resv-meta`, NO filtra (todo el texto vía MDC).
- `eslint.config.mjs` — bloque per-file que relaja `vue/singleline-html-element-content-newline`, `vue/multiline-html-element-content-newline` y `vue/max-attributes-per-line` para las 5 hojas del timeline (MDC en contenedores inline whitespace-sensibles; precedente MonumentCard).

## Decisions Made

- **Dispatch por `kind` con `<component :is>` resuelto por string.** `COMPONENT_BY_KIND` mapea las 5 ramas del `discriminatedUnion('kind')` (`shared/schemas.ts:85-123`) a los nombres de las 5 hojas; `<component :is="COMPONENT_BY_KIND[row.kind]">` resuelve por string contra los auto-imports planos de Nuxt (A5). El dispatcher itera `day.timeline[]` en orden de dato y NUNCA reordena (ese orden es la ruta del día de F6). NO importa el composable de modos: el filtrado vive en las hojas.
- **Pitfall 4 — filtrado SOLO en stop/transport.** `TimelineStop` y `TimelineTransport` consumen `isVisible` del singleton `useTripModes` (Plan 01) y aplican `:class="{ 'tl-hidden': !isVisible(row.pace) }"` + conservan `:data-pace` (mapea index.html:6521, que solo selecciona `.tl-item[data-pace]`/`.tl-transport[data-pace]`). `TimelineMeta`/`Food`/`Reservation` NO importan el composable ni consultan la matriz, aunque la rama `food` lleve `pace` en el esquema (greps de verificación negativos confirman Pitfall 4).
- **Tipos de prop por `Extract` del esquema.** Cada hoja tipa `row` como `Extract<Day['timeline'][number], { kind: 'x' }>` → estrecha la rama desde la única fuente de tipos (el `discriminatedUnion`), sin redefinir shapes. El typecheck valida así el contrato de dispatch (cada hoja recibe su rama correcta).
- **Variante de transporte bindeada directa.** `:class="[row.variant, {...}]"` bindea el string de variante tal cual (no un check hardcodeado de enum) → la fila reproduce el color de borde de CUALQUIER variante, incl. `metro`/`metro-b` cuando F2 los recupere (ver Desviaciones / deferred D-04-B).
- **`.fixed-event` NO se renderiza.** La rama `stop` del esquema solo tiene `disabled` y `reservedEvent` (no un campo para `.fixed-event`), así que esa variante del original no se reproduce — el dato no la expresa (contrato F2). El plan lo previó ("si el dato la lleva").
- **`:tag="false"` en todos los `<MDC>` inline.** Learning D-04-A de 04-02: `<MDC unwrap="p">` deja un `<div class="">` envoltorio; `:tag="false"` lo suprime. Aplicado a `tl-note`, `desc`/`meta`/`footnote` de transporte, `tl-meta-item`, `tl-food-desc`/`tl-food-foot` y `tl-resv-meta`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TimelineReservation: el plan habría DUPLICADO el ✅ (el emoji ya está en el dato F2)**
- **Found during:** Task 2 (lectura de los datos `kind: reservation` de los 5 días)
- **Issue:** El `<action>`/`<acceptance_criteria>` del plan prescribía "el ✅ es literal en el markup + `<MDC>` sobre el resto de `row.text`". Pero la migración F2 codificó el bloque COMPLETO en `text`, INCLUIDO el ✅ inicial (`✅ **Cena reservada · …** — …`, verificado en las 9 reservas). Poner un ✅ literal + MDC del texto entero habría mostrado DOS ✅.
- **Fix:** `TimelineReservation` renderiza TODO `row.text` con un solo `<MDC unwrap="p" :tag="false">` (sin ✅ literal). MDC produce `✅ <strong>…</strong> — …`, idéntico a index.html:2433.
- **Files modified:** app/components/TimelineReservation.vue
- **Verification:** `pnpm typecheck`/`pnpm lint` verdes; grep `tl-resv-meta` presente; el render real (los 5 kinds) lo asevera el Plan 05.
- **Committed in:** `443abb5` (Task 2)

**2. [Rule 3 - Blocking] Reglas de saltos de línea/atributos vs MDC en contenedores inline whitespace-sensibles**
- **Found during:** Task 1 (`pnpm lint` de Stop/Transport) y Task 2 (`pnpm lint` de Food)
- **Issue:** `tl-note`/`tl-transport-mode-desc`/`tl-transport-mode-meta`/`tl-transport-footnote`/`tl-food-foot` incrustan `<MDC>` (2+ atributos) PEGADO a su contenedor para reproducir el original (`<div class="tl-note">texto</div>`, sin nodos de texto en blanco). `vue/multiline-html-element-content-newline` (y `max-attributes-per-line`) exigían saltos de línea que introducirían nodos de texto y romperían la paridad whitespace-sensible.
- **Fix:** Bloque per-file en `eslint.config.mjs` que apaga `vue/singleline-html-element-content-newline`, `vue/multiline-html-element-content-newline` y `vue/max-attributes-per-line` SOLO para las 5 hojas del timeline (mismo precedente que MonumentCard en 04-02). El resto de reglas (incl. CERO CSS y multi-word salvo Timeline) sigue activo.
- **Files modified:** eslint.config.mjs
- **Verification:** `pnpm lint` (repo completo) exit 0.
- **Committed in:** `4c6d869` (Task 1, Stop/Transport), ampliado en `443abb5` (Task 2, Meta/Food/Reservation)

**3. [Rule 3 - Blocking] Las gates negativas de grep matcheaban tokens en los COMENTARIOS de cabecera**
- **Found during:** Task 1 (`! grep <style`) y Task 2 (`! grep isVisible|useTripModes|<style`)
- **Issue:** Los `<automated>` verifican que los ficheros NO contengan `<style` (los 6) ni `isVisible`/`useTripModes` (los 3 de Task 2). El CÓDIGO cumplía (cero CSS; Meta/Food/Reservation no consultan la matriz), pero mis comentarios de cabecera nombraban esos tokens al explicar el anti-patrón (p. ej. "SIN `<style scoped>`", "NO importa useTripModes") → la gate literal fallaba. Mismo patrón que la deviation #2 del Plan 04-01.
- **Fix:** Reformulados los comentarios sin los literales: "sin bloque de estilos con scope" en vez de `<style scoped>`; "NO importa el composable de modos ni consulta la matriz de visibilidad" en vez de `useTripModes`/`isVisible`. Comportamiento sin cambios.
- **Files modified:** Timeline.vue, TimelineStop.vue, TimelineTransport.vue (token `<style`); Meta/Food/Reservation se escribieron ya sin los literales.
- **Verification:** Todas las gates negativas de grep de Task 1 y Task 2 pasan.
- **Committed in:** `4c6d869` (Task 1), `443abb5` (Task 2)

---

**Total deviations:** 3 (1 bug de paridad por desajuste plan↔datos F2 en la reserva, 2 blocking de gate: lint whitespace + gate-en-comentario).
**Impact on plan:** La #1 es necesaria para la paridad (idéntico al index.html) y solo afecta a `TimelineReservation.vue`. La #2 es el precedente locked de 04-02 (relajación per-file, sin tocar CSS ni datos). La #3 son ajustes mecánicos de comentario para pasar las gates del propio plan (cero cambio de comportamiento). Sin scope creep: solo se tocan los 6 componentes del `files_modified` + la relajación per-file de eslint (precedente 04-01/04-02). Los datos de F2 NO se tocaron.

## Issues Encountered
- **Variante metro/metro-b perdida en F2 (deferred D-04-B).** index.html tiene 5 variantes de transporte (`taxi`/`walk`/`train`/`metro`/`metro-b`) pero el enum del esquema solo admite 3 y las 3 filas que el original es `metro`/`metro-b` (domingo Aventino, lunes Laterano, martes Barberini) quedaron en los datos SIN `variant`. Out of scope (Fase 2). Mitigado: `TimelineTransport` bindea `row.variant` directo → correcto en cuanto F2 lo recupere. Registrado en deferred-items.md.
- **`**…**` → `<strong>` vs `<b>` y `<br>` perdido (deferred D-04-C).** Las negritas Markdown emiten `<strong>`, pero `.tl-meta-item.ok/.warn b` apunta a `b` con color semántico → ese color no se aplica; y el `<br>` del meta de transporte se perdió en F2. Transversal a todo MDC (no causado por este plan; el plan prescribe MDC). Registrado en deferred-items.md.

## Known Stubs
None — los 6 componentes están completamente cableados a sus props tipadas (ramas del `discriminatedUnion`). No hay datos hardcodeados vacíos ni placeholders. El render real (instanciación desde `DaySection`/`TripView`) lo cablea el Plan 05.

## Threat Flags
None — componentes presentacionales sobre datos zod-validados del repo. Los `<MDC>` renderizan SOLO prosa versionada (sin v-html sobre input externo); los `href` provienen de `entry.ref` (#id validado) o `entry.href` (dato del repo) con `rel="noopener"` VERBATIM donde el original lo tiene (anti-tabnabbing, T-04-05). Cero superficie nueva fuera del `<threat_model>` del plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- **Plan 04-05 (cableado de TheHero)** cablea los `.pace-btn`/`#light-toggle`/`#resumen-toggle` a `useTripModes` (singleton); como `TimelineStop`/`TimelineTransport` consumen el MISMO singleton, el filtrado del timeline reaccionará automáticamente al cambiar el ritmo (D-03).
- **Plan 05 (derivados/navegación)** instancia `<Timeline :rows="day.timeline" />` por cada día (vía `DaySection`/`TripView`). El dispatcher es presentacional puro (sin estado propio); el modo resumen (que oculta `.tl-meta`/`.tl-transport`/`.cards-list` por CSS) aplica sin tocar estos componentes.
- **Verificación E2E (Plan 05, `tests/parity/render-timeline.spec.ts` + `modes.spec.ts`):** los 5 kinds presentes con su markup + orden = dato (reserved-event/disabled/variantes de transporte) y el filtrado por ritmo (pace=slow oculta `tl-item`/`tl-transport` medium+slow-only pero NUNCA `tl-food`/`tl-meta`/`tl-resv-meta`). Este plan dejó el render preparado; el Plan 05 lo formaliza contra el golden.
- **Carry-forward para el verificador (deferred-items.md):** D-04-B (variante metro/metro-b perdida en F2 + enum), D-04-C (`<strong>` vs `<b>` semántico + `<br>` del meta de transporte). Ambos NACEN de la Fase 2 (datos/encoding Markdown), son VISUALES menores, y los cierra un plan futuro / la E2E del Plan 05.
- **Frontera F5 (interceptación `a[href^="#"]`):** los enlaces `tl-title`/`tl-food-name` con `#ref` son planos; la interceptación SPA es F5 (concern de STATE sigue abierto).

## Self-Check: PASSED

- Ficheros verificados en disco: `app/components/Timeline.vue`, `TimelineStop.vue`, `TimelineTransport.vue`, `TimelineMeta.vue`, `TimelineFood.vue`, `TimelineReservation.vue`, `eslint.config.mjs`, `04-03-SUMMARY.md`, `deferred-items.md`.
- Commits verificados en git: `4c6d869` (Task 1), `443abb5` (Task 2).
- Gates verdes: `pnpm typecheck` (exit 0), `pnpm lint` (repo completo, exit 0), todas las gates de grep de los `<automated>` de Task 1 y Task 2 (COMPONENT_BY_KIND en Timeline; isVisible en stop+transport y AUSENTE en meta/food/reservation; data-pace en stop; tl-meta/tl-food/tl-resv-meta presentes; AUSENCIA de `<style>` en los 6).
- Sin regresiones: `pnpm test:unit` (21/21), `pnpm test:data` (295/295).

---
*Phase: 04-render-de-contenido-modos-de-ritmo*
*Completed: 2026-06-20*
