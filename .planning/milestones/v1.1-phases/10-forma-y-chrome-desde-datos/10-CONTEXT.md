# Phase 10: Forma y chrome desde datos - Context

**Gathered:** 2026-11-20
**Status:** Ready for planning
**Modo:** `--auto` — el usuario está de viaje y pidió avanzar; cada decisión es la opción recomendada, elegida por Claude y pendiente de revisión del usuario (ver `10-DISCUSSION-LOG.md`). Ninguna es `one-way`.

<domain>
## Phase Boundary

La forma de cada guía (cuántos días, qué secciones y pastillas) y su chrome de marca (cabecera, pie, leyenda del mapa, título de la pestaña) salen de los datos de su viaje. Roma mueve sus textos **verbatim** a su `trip.yml` y se ve idéntica (56 goldens sin re-baseline, `tests/parity/` intacto).

Fuera de esta fase: portada y rutas (`/trips/roma/`, `draft`, Fase 11), formas nuevas de día (A/B, «Dormís en…», ferris, naturaleza, multi-ciudad, Fase 12), contenido de Campania (Fase 13).

</domain>

<decisions>
## Implementation Decisions

### Días desde datos (SHAPE-01)
- **D-01:** `TripView` deja de tener las 5 `<section id="viernes">…` fijas: monta una `<section :id="day.slug">` + `DaySection` por cada día del viaje, en orden de `order`. Roma conserva sus slugs `viernes…martes` (mismo DOM, mismo orden de hermanos entre `#mapa` y `#reservas`).
- **D-02:** Viajes nuevos usan slugs de día con fecha (`sabado-19`, `sabado-26`): así dos sábados nunca chocan. El esquema de día acepta `^[a-z0-9-]+$` (no se impone el formato con fecha; es convención documentada).
- **D-03:** Etiqueta de la pastilla de día: campo nuevo opcional `pill` en el YAML del día; si falta, se sigue derivando con `dayLabel(eyebrow)` (Roma no añade `pill` → «Venerdì»… idénticas). La puerta de datos exige **etiquetas de pastilla únicas dentro de un viaje** (ya derivadas o explícitas), para que «dos sábados» obliguen a desambiguar (p. ej. «Sáb 19» / «Sáb 26»).
- **D-04:** `order` único y contiguo `1..N` por viaje (invariante nuevo; se elimina el comentario «1..5»). Sin límite de número de días.
- **D-05:** Se cierran aquí WR-01 y WR-02 de la revisión de la Fase 9 (era la recomendación del UAT 09 punto 5): (a) los slugs de día de un viaje se tratan como anclas reservadas — ningún id de ficha/comida/artista puede coincidir con un slug de día del mismo viaje, ni un slug de día con un ancla de sección fija (`SECTION_ANCHORS`/`FIXED_DOM_IDS`); (b) `cross-trip-link` pasa a lista blanca: en la prosa solo se admiten enlaces internos con la forma exacta `#id` (o URLs absolutas `http(s)://` externas); `/#x`, `/guiaRoma/#x`, `../roma#x`, `/trips/...` rompen verify nombrando el fichero. Si el usuario decide otra cosa en `/gsd-verify-work 9`, se ajusta.

### Secciones y pastillas según datos (SHAPE-02)
- **D-06:** Una función **pura** `buildTripLayout(...)` (en `app/utils/`, con test Vitest) devuelve la lista ordenada de secciones/pastillas del viaje; `TripView` y `NavPills` consumen esa misma lista (una sola fuente de verdad, no dos plantillas que puedan divergir).
- **D-07:** Orden fijo para todos los viajes: Inicio, Mapa, días…, Reservas, Gastronomía, Práctica, Arte, Arquitectura. No hay campo para reordenar.
- **D-08:** Se decide por **presencia de datos**, sin lista explícita en `trip.yml`: Inicio y Mapa siempre; Reservas si existe la referencia `reservas`; Gastronomía si hay fichas de comida; Práctica si existe la referencia `practica`; Arte si hay artistas `kind: artist`; Arquitectura si hay `arquitectura` o `glossary`. Si una sección no se muestra, tampoco su pastilla ni su `<section>`. Roma tiene todo → 12 pastillas en el mismo orden.
- **D-09:** Las etiquetas de las pastillas estructurales y los títulos fijos de sección (incluidas las grafías italianas «Pratica», «cartografia», «El mapa del viaje», intro del mapa) siguen siendo **chrome compartido fijo**, no configurable en esta fase: no son textos propios de Roma (Campania también es Italia) y moverlos multiplica el riesgo de píxel sin beneficio.

### Chrome desde `trip.yml` (SHAPE-03, SHAPE-04)
- **D-10:** Campos nuevos, todos `.optional()` (esquema estrictamente aditivo): `brand` (cabecera), `footer` (pie), `mapLegend` (leyenda del mapa) y `pageTitle` (pestaña). Orden de trabajo obligatorio: primero un test que demuestre que el YAML de Roma **sin cambios** sigue validando con el esquema ampliado; después se añaden los valores de Roma verbatim.
- **D-11:** `brand` conserva el DOM exacto de la cabecera (`.brand` con `<span class="brand-dot">✦</span>` en medio): forma estructurada de dos textos alrededor del punto (p. ej. `brand: { before: 'Roma', after: 'giugno MMXXVI' }`), no HTML libre. El formato exacto es discreción del planner siempre que el DOM de Roma salga byte-idéntico.
- **D-12:** `footer` = lista de líneas Markdown-inline (la primera lleva `*Pay*` → `<em>`), unidas con `<br>` como hoy dentro del mismo `<p>`. Vigilar el espacio en blanco del render MDC (regresión de píxel en el pie, nota del roadmap).
- **D-13:** `pageTitle` sustituye al `<title>` fijo de `app.vue`: el título lo pone la página del viaje (`useHead` en `TripView` o la página). Roma: `Roma · 19—23 giugno 2026` (con EM-DASH). `app.vue` conserva `lang` y los dos `theme-color`.
- **D-14:** Si un viaje no define un campo de chrome, se usa un **respaldo neutro sin ningún texto de Roma**: pestaña y marca = el `title` del viaje sin Markdown; pie y leyenda = no se renderizan. Nunca se cae a un literal de Roma.

### Test-trampa y viaje de forma (SHAPE-05)
- **D-15:** Se añade un **segundo viaje ficticio dev-only** (`content/trips/forma/` o nombre equivalente que cumpla `TRIP_SLUG_RE`) con 10 días mínimos que repiten día de la semana (dos sábados con slugs con fecha y `pill` distintas), **sin** Arte ni Arquitectura (y sin alguna otra sección opcional) y con su propio `brand`/`footer`/`mapLegend`/`pageTitle`. El viaje `prueba` de la Fase 9 **no se toca**, para que sus tests de aislamiento sigan estables.
- **D-16:** El test-trampa se ejecuta en Playwright contra `pnpm dev` (suite `test:trips`, porque la build no emite viajes de prueba): en la guía de cada viaje no-Roma, ni el texto visible del `body` ni `document.title` contienen ninguna marca de Roma (lista mínima: «Roma», «Einaudi», «giugno», «MMXXVI», «Pay», «Fellini», «Royal Court»; comparación por palabra, sin falsos positivos tipo «aroma»). Además un test que compruebe 10 secciones de día + 10 pastillas distintas y la ausencia de `#arte`/`#arquitectura` en el viaje de forma.
- **D-17:** Un guardián de código (estilo `tripCoupling.spec.ts`) falla si reaparecen en `app/` los literales de chrome de Roma movidos a datos («giugno MMXXVI», «concierto Einaudi», «19—23 giugno 2026», «dos colegas»).

### Paridad y proceso
- **D-18:** La puerta de paridad de Roma en `/` sigue verde con `tests/parity/` sin cambios y los 56 goldens sin `--update-snapshots`. Cualquier diferencia de píxel se arregla en el código/datos, nunca en los goldens.
- **D-19:** Builds, Playwright y typecheck con Node 22 (`~/.nvm/versions/node/v22.20.0/bin` delante en `PATH`); `rm -rf .data .nuxt .output` antes de cada `generate`/puerta tras tocar YAML.

### Claude's Discretion
- Forma exacta de `brand`/`footer` en YAML y la firma de `buildTripLayout`, siempre que el DOM de Roma salga idéntico.
- Orden de agrupación de la gastronomía para viajes nuevos: `FOOD_GROUP_ORDER` es de Roma; un grupo que no esté en esa lista debe salir después, en orden de primera aparición, sin romper (comprobar el comportamiento actual de `groupFood`; un campo opcional de orden por viaje solo si hace falta).
- Nombre y contenido inventado del viaje de forma.
- Si `pill` de día se valida también contra longitud/espacios (estético).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Alcance y requisitos
- `.planning/ROADMAP.md` §«Phase 10: Forma y chrome desde datos» — goal, 5 criterios de éxito, notas (esquema aditivo, regresiones de píxel en pie/marca/«Pratica», slugs con fecha)
- `.planning/REQUIREMENTS.md` — SHAPE-01…SHAPE-05
- `.planning/PROJECT.md` — listón de paridad de Roma, rama `release/nuxt-4`, `main` intacta

### Fase 9 (base sobre la que se construye)
- `.planning/phases/09-plataforma-por-viaje/09-CONTEXT.md` — D-01…D-12 (viaje `prueba` dev-only, claves por viaje, rigor de validación)
- `.planning/phases/09-plataforma-por-viaje/09-REVIEW.md` — WR-01 / WR-02 (se cierran aquí, D-05)
- `.planning/phases/09-plataforma-por-viaje/09-UAT.md` — punto 5 (destino de WR-01/WR-02), aún pendiente de respuesta del usuario
- `tests/README.md` §5 «Aislamiento por viaje» — cómo corren `test:trips` y la puerta

### Código afectado
- `app/components/TripView.vue` — secciones de día fijas, leyenda «Einaudi», pie
- `app/components/Topbar.vue` — marca fija
- `app/components/NavPills.vue` — pastillas estructurales + de día
- `app/app.vue` — `<title>` fijo
- `shared/schemas.ts` — `TripSchema`, `DaySchema`
- `tests/data/trips.ts` — `checkTrip`, `SECTION_ANCHORS`, `FIXED_DOM_IDS`, regla `cross-trip-link`
- `app/utils/dayLabel.ts`, `app/utils/foodGroups.ts`
- `content/trips/roma/trip.yml`, `content/trips/prueba/`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dayLabel(eyebrow)`: respaldo de la etiqueta de pastilla de día (D-03).
- `useTrip(slug)`: ya devuelve `trip`, `days` (ordenados), `food`, `artists`, `refById` — todo lo que `buildTripLayout` necesita para decidir presencia.
- `tests/data/trips.ts` (`loadTrip`, `checkTrip`, fixtures «dientes» en `tests/data/fixtures/trips/`): donde van los invariantes nuevos (orden contiguo, pastillas únicas, slugs de día reservados, lista blanca de enlaces).
- `playwright.trips.config.ts` + `tests/trips/isolation.spec.ts`: base para el test-trampa (D-16).
- `tests/unit/tripCoupling.spec.ts`: base del guardián de literales (D-17).

### Established Patterns
- CSS global verbatim, sin `<style scoped>` (los `data-v-*` rompen selectores globales).
- Chrome verbatim del `index.html`; Markdown-inline con `<MDC :tag="false" unwrap="p">`.
- Funciones puras en `app/utils/` sin imports de Nuxt para testear en Vitest plano.
- Prohibido enlazar `/trips/*` desde la app (crawlLinks lo prerenderizaría) hasta la Fase 11.
- Scrollspy (`useCardNavigation`) ya lee las `<section>` del DOM: se adapta solo a secciones dinámicas.

### Integration Points
- `TripView` → `Topbar :days` → `NavPills`: pasar el layout en vez de (o además de) `days`.
- `LeafletMap`/`mapMarkers`: no cambian en esta fase (multi-ciudad es Fase 12).

</code_context>

<specifics>
## Specific Ideas

- Textos de Roma a mover verbatim: marca `Roma <span class="brand-dot">✦</span> giugno MMXXVI`; leyenda `✦  Rojos · paradas con ficha · Dorados · eventos guiados · Verde · concierto Einaudi ✦` (con dobles espacios); pie `Itinerario preparado para <em>Pay</em> y dos colegas<br>Roma · 19—23 giugno 2026<br>"Roma no se cuenta, se camina."`; título `Roma · 19—23 giugno 2026` (EM-DASH).

</specifics>

<deferred>
## Deferred Ideas

- Etiquetas de pastillas/títulos de sección configurables por viaje (D-09) — solo si Campania lo pide en la Fase 13.
- IN-05 de la Fase 9 (YAML suelto en `content/trips/`, `.YML` en mayúsculas) — pendiente de la decisión del usuario en `/gsd-verify-work 9`.
- CR-01 de la Fase 9 (filas de viajes de prueba en `sql_dump` público) — se resuelve con `draft` en la Fase 11; el nuevo viaje de forma (D-15) queda en el mismo caso y debe marcarse `draft` también.

</deferred>

---

*Phase: 10-forma-y-chrome-desde-datos*
*Context gathered: 2026-11-20*
