# Phase 4: Render de contenido + modos de ritmo - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Rellenar **desde los datos** (`useTrip` + `<MDC>`) las **11 secciones que F3 dejó VACÍAS** en `TripView`, con paridad visual, y **cablear los tres modos triviales** sobre los controles que `TheHero` ya monta. Validar el patrón data-driven con las piezas de **bajo riesgo** (contenido + modos por CSS) **antes** de las sensibles a SSR (mapa/imagen/notas, F7).

Cubre: **UI-02, UI-03, UI-04, FEAT-06, FEAT-07, FEAT-08**.

**Incluye:**
- **Fichas de monumento** (`.card`) en la `.cards-list` de cada día: card-roman, nombre, italiano, badge, hero `<img>`, prosa por secciones (`<MDC>` con `detail-photo`/`detail-list` embebidos), `facts`, enlace Maps, `sorrentino-box`/`culture-box`, y el **shell** del área de notas.
- **Timeline** por día: contenedor del día (header, `day-stats`, `dia-ligera`) + filas despachadas por `kind` (`stop`/`transport`/`meta`/`food`/`reservation`).
- **Secciones de referencia**: Reservas (confirmadas + tabla "cuándo reservar"), Gastronomía (gastro-cards agrupadas por `group`), Práctica (prosa + media), Arte (artist-cards), Arquitectura (arq-cards + glosario). Más el eyebrow/intro de sección (`trip.sections`).
- **Selector de ritmo** (optimista/neutral/lento), **caminar menos** (movilidad reducida) y **modo resumen**, persistidos, cableando los controles ya presentes en `TheHero`.

**No incluye** (otras fases):
- **Fallback de imagen** (`@error`→SVG por motif, modo hero/detail) = **UI-05 → F7**. F4 renderiza `<img>` plano.
- **Notas persistidas** en localStorage = **FEAT-04 → F7**. F4 monta solo el shell visible.
- **Navegación a ficha**: scroll-a-ficha + highlight, pila "volver" (`BackButton`), scrollspy `+130`, `.nav-pill.active`, **intercepción de `a[href^="#"]`** de la prosa/`tl-title` = **FEAT-05 → F5**. En F4 esos enlaces son anclas normales.
- **Búsqueda** y **ruta del día** = **F6** (la búsqueda raspa el render; la ruta del día deriva de `day.cards` y añade el botón a `.day-stats`).
- **Mapa Leaflet** (#mapa) = **F7**.
- **Pixel-diff total** contra el golden = **F8**.

</domain>

<decisions>
## Implementation Decisions

### Heredado y BLOQUEADO por fases previas / research (no reabrir)
- **Esquema zod** `shared/schemas.ts` (F2) es el contrato que el render SIGUE: `timeline` = `discriminatedUnion('kind')` (5 kinds); prosa = `sections: [{heading, body}]` con `body` Markdown-inline; `MonumentSchema` (hero/facts/sorrentino/culture); `FoodSchema` (`group`/`badgeKind`); `ArtistSchema` unifica `artist`/`arquitectura`/`glossary` por `kind`; `ReferenceSchema` = reservas|practica; `TripSchema.sections` lleva eyebrow+intro de gastronomía/arte/arquitectura.
- **Formato YAML `type:'data'` + render de prosa con `<MDC>`** (F2/research). No reabrir el formato.
- **CSS editorial VERBATIM** (F1) ya define TODAS las clases de F4. **Cero CSS nuevo, sin `<style scoped>`** (data-v-* rompería selectores globales): los componentes solo reproducen markup+clases → paridad por construcción.
- **Ancla estable = `slug`** (= `#id` del index.html). Los enlaces internos de la prosa (`[texto](#id)`) y `timeline.ref`/`day.cards[]` resuelven contra ese slug.
- **Controles del #inicio YA montados** como markup estático **SIN handlers** en `app/components/TheHero.vue` (F3): `search-wrap`, `pace-wrap` con sus 3 `pace-btn` (`data-pace="optimistic|neutral|slow"`), `light-toggle` (`#light-toggle`), `resumen-toggle` (`#resumen-toggle`), todos con `aria-pressed="false"`. **F4 los CABLEA; NO los recrea ni reestructura el DOM del #inicio** (la paridad de F3 queda intacta). El `search-input` lo cablea F6.
- **Claves localStorage existentes**: `roma-pace`, `roma-light` (`'1'`/`'0'`), `roma-resumen` (`'1'`/`'0'`). Preservar literal (un usuario que venga de la versión viva mantiene su estado).
- **Lógica EXACTA de los modos** (de la JS del `index.html`, paridad — el planner la lee, no se reinventa):
  - **Ritmo** (`setPace`, index.html:6505-6535): `optimistic`→muestra todo; `neutral`→oculta `slow-only`; `slow`→oculta `slow-only` **y** `medium`. **Solo `.tl-item[data-pace]` y `.tl-transport[data-pace]` se filtran** — `.tl-food`/`.tl-meta`/`.tl-resv-meta` NO se filtran por ritmo (aunque el esquema lleve `pace` en `food`).
  - **Caminar menos** (`setLightMode`, 6546-6556): `body.light-mode` + al **activar** fuerza `setPace('slow')` y muestra `.dia-ligera`; al **desactivar** NO revierte el ritmo. `aria-pressed`.
  - **Resumen** (`setResumen`, 6564-6572): `body.modo-resumen`; el CSS oculta `.day-stats`, `.day-subtitle`, `.dia-ligera`, `.tl-meta`, `.tl-transport`, `.cards-list`. `aria-pressed`.

### Área 1 — Frontera de imágenes/notas (F4 ↔ F7)
- **D-01 (Imágenes):** hero y detail-photo en F4 = **`<img>` PLANO** con `src`/`alt`/`loading` exactos, **SIN** el wrapper `@error`→SVG. F4 SÍ crea el componente **`DetailPhoto`** (MDC inline, D-02/F2) que renderiza `img` + caption; F7 le añade el fallback por `motif` y el modo hero/detail (UI-05). Razón: respeta la frontera del roadmap; con la imagen cargada (uso normal) se ve **idéntico a hoy**; el pixel-diff con imágenes bloqueadas se valida en **F8**, tras F7.
- **D-02 (Notas):** F4 **monta el shell** del área de notas (`.notes-area` + `textarea` con `data-note-key`) con markup exacto pero **SIN persistencia** — igual que F3 montó los controles sin handlers. Mantiene la altura/layout de la ficha idéntico a hoy; la persistencia (`roma-note-<id>` en localStorage) se cablea en F7 (FEAT-04).
- **Principio transversal:** *"montar el shell visual ahora para la paridad de layout, diferir el comportamiento a su fase dueña"* (precedente de F3). Aplica a imágenes (markup ahora / fallback F7) y notas (textarea ahora / persistencia F7).

### Área 2 — Mecanismo de los 3 modos
- **D-03:** El estado de `pace`/`light`/`resumen` vive en un **composable reactivo** (p.ej. `useTripModes`) — **NO** funciones globales ni manipulación imperativa del DOM cross-componente (anti-patrón; cf. CLAUDE.md §What NOT to Use). El composable conduce las **MISMAS clases CSS verbatim**: `.tl-hidden` en las filas afectadas, `body.light-mode` / `body.modo-resumen`. Mismo resultado visible que hoy, idiomático Vue, y **comparte estado** entre los controles (`TheHero`) y el contenido (timeline).
- **D-04:** **Init desde localStorage en `onMounted`** (no en SSR): SSR y la hidratación inicial renderizan el estado **default** (ritmo `optimistic`, sin `light`/`resumen`) → **cero mismatch de hidratación**; el estado guardado se aplica **1 frame tras montar** → **PRESERVA el micro-flash** que pide **SC#4**.
- **D-05:** `TheHero` **consume el composable** para cablear sus controles ya montados (binding reactivo de `.active` en los `pace-btn`, `@click`, `aria-pressed` reactivo) **sin tocar el DOM del #inicio**. Las clases en `<body>` se aplican de forma reactiva (watcher sobre `document.body` o `bodyAttrs` — discreción del planner).

### Área 3 — Verificación de paridad (intermedia)
- **D-06:** Mismo patrón que F3 — specs Playwright **AUTOCONTENIDOS** (build+serve propio, mirror de `subpath.spec`) que aseveran **DOM/texto/estructura** del render (no screenshots, para no rebaselinar el golden) + **sign-off humano** visual con imágenes reales cargando.
- **D-07:** **E2E del comportamiento de los 3 modos**: matriz de ritmo exacta (qué oculta cada nivel), caminar-menos fuerza `slow` + muestra `dia-ligera`, resumen oculta el set correcto, **persistencia** (`roma-pace`/`light`/`resumen`) y el micro-flash.
- **D-08:** El **pixel-diff total** contra el golden de F1 (que **bloquea imágenes** → muestra fallbacks SVG que en F4 aún no existen) se **deja para F8**, tras el fallback de F7. F4 no rebaselina ni captura golden nuevo.

### Área 4 — Granularidad de componentes
- **D-09:** `Timeline.vue` itera las filas del día y **despacha a UN COMPONENTE POR KIND**: `TimelineStop` / `TimelineTransport` / `TimelineMeta` / `TimelineFood` / `TimelineReservation` (mapea 1:1 el `discriminatedUnion`; cada uno pequeño y verbatim; diffs/PRs enfocados).
- **D-10:** El resto, **uno por familia**: `MonumentCard` (la `.card`), `GastroCard` (+ agrupado por `group`), `ArtistCard` (unifica `artist`/`arquitectura`/`glossary` por `kind`, D-04/F2), `ReservasSection` (confirmadas + tabla), `PracticaSection` (prosa + media). Un contenedor `DaySection` (header + `day-stats` + `dia-ligera` + `Timeline` + `cards-list`) por día. `DetailPhoto` como componente MDC inline.
- **Patrón heredado (F3):** *"un componente por concern, markup+clases verbatim, cero CSS, sin scoped"*.

### Claude's Discretion (planner/research deciden; no requieren al usuario)
- Nombres exactos y ubicación de componentes/composable (`app/components/`, `app/composables/`).
- **Mecánica de registro de componentes MDC** (cómo `<MDC>` resuelve `DetailPhoto` y cualquier otro inline — Prose components / `components/content/` / global). **Verificar en research** (Content v3).
- Forma exacta del estado del composable (`useState` SSR-singleton vs `ref` a nivel módulo) y cómo aplica las clases de `<body>` (watcher vs `useHead({ bodyAttrs })`).
- Cómo se inyectan las fichas en `cards-list` desde `day.cards[]` (orden = el del dato) resolviendo cada id contra el índice de monumentos de `useTrip`; cómo se modela el agrupado de gastronomía desde `food.group`.
- Markup fino verbatim: variantes `taxi`/`walk`/`train`/`metro-b` de transport, `fixed-event`/`reserved-event`, `disabled`, badges (`tl-tag`, `reservas-badge` `badge-urgent`/`done`/`rec`, `gastro` `badge-*`), `tl-meta-item` `ok`/`warn`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Investigación del proyecto (decisiones de stack YA tomadas — leer ANTES de planificar)
- `.planning/research/STACK.md` — render de prosa con `<MDC>`, Content v3, CSS a mano conservado. Base del render de F4.
- `.planning/research/FEATURES.md` — mapeo features→datos: ubica **FEAT-06/07/08** (los 3 modos) y deja claro qué es de F5 (navegación), F6 (búsqueda/ruta del día) y F7 (mapa/imagen/notas) para **no invadir**.
- `.planning/research/PITFALLS.md` — MDC, hidratación, prerender de `queryCollection`; el cableado exacto de `a[href^="#"]` queda para **F5** (no F4).
- `.planning/research/ARCHITECTURE.md` — estructura de `components/`/`composables/` (`srcDir=app/`).
- `.planning/research/SUMMARY.md` — síntesis + BUILD ORDER (por qué render+modos triviales van antes de navegación/derivados/mapa).
- `CLAUDE.md` (raíz) — §"Formato de contenido" (MDC), §"CSS / design tokens" (verbatim, no framework), §"Búsqueda — indexar datos no DOM" (anti-patrón de raspar el DOM, aplicable al estilo del composable de modos), §"What NOT to Use".

### Planificación
- `.planning/PROJECT.md` — Core Value (**paridad 100%**), constraints, Key Decisions (incl. `meta`→`heroMeta` reservado de Content).
- `.planning/REQUIREMENTS.md` — **UI-02, UI-03, UI-04, FEAT-06, FEAT-07, FEAT-08** (esta fase) y dependencias aguas abajo: **FEAT-05** (navegación, F5), **FEAT-03/FEAT-09** (búsqueda/ruta del día, F6), **FEAT-02/UI-05/FEAT-04** (mapa/imagen-fallback/notas, F7), **PARITY-02** (F8).
- `.planning/ROADMAP.md` §Phase 4 — goal + los **4 success criteria** (SC#1 ficha de monumento idéntica con prosa MDC sin `<p>` extra; SC#2 timeline despachado por `kind`; SC#3 secciones de referencia desde datos; SC#4 matriz de ritmo exacta + caminar-menos + resumen, **incl. el micro-flash**).
- `.planning/phases/03-capa-de-p-gina-layout-y-tema/03-CONTEXT.md` — `TripView` posee las 12 anclas; **controles del #inicio ya montados** en `TheHero` sin comportamiento; tema/composable client-init; **ancla = slug**.
- `.planning/phases/02-esquema-de-datos-migraci-n-del-contenido/02-CONTEXT.md` — el esquema que el render sigue: **D-01** (prosa = `sections[{heading,body}]`), **D-02** (`detail-photo` como componente MDC inline + listas Markdown nativas), **D-03/D-04** (reference bespoke; artist unifica arquitectura/glosario).
- `.planning/phases/01-andamiaje-golden-de-paridad/01-CONTEXT.md` — **el golden BLOQUEA todas las imágenes** (A5) → fallbacks SVG deterministas; CSS verbatim como fuente del look; claves localStorage (`roma-pace`/`roma-light`/`roma-resumen`/`roma-note-*`).

### Código actual (FUENTE DE VERDAD de la paridad)
- `index.html` — el render a reproducir 1:1. Mapa de líneas de F4:
  - **Controles #inicio:** `search-wrap` 2295-2298; `pace-wrap` 2301-2332 (`pace-btn` 2304/2308/2312, `light-toggle` 2319, `resumen-toggle` 2326).
  - **Día (ej. viernes):** `section#viernes` 2375; `day-stats`/`dia-ligera`/header; **timeline** 2403-2446 (`tl-item` 2404, `tl-transport` 2405, `tl-item.disabled` 2406, `reserved-event` 2432, `tl-meta` 2894, `fixed-event` 3518); `cards-list` 2448.
  - **Ficha-ejemplo completa** `galleria-sciarra` 2450-2510 (card-roman, h3, card-italian, badge, hero `img onerror`, `sections` con `detail-photo` 2479 / `detail-list` 2483, `facts-row`, `maps-link`, `sorrentino-box`, `notes-area`).
  - **Referencia:** reservas 5260 (`reservas-confirmadas` + `reservas-table`), gastronomía 5335 (`gastro-card` desde 5346, `gastro-section-title`), práctica 5825, arte 5941 (`artist-card` `art-*`), arquitectura 6104 (`arq-*` + `arq-glosario` 6202).
  - **JS de modos** (referencia de la LÓGICA exacta a portar): `setPace` 6505-6535, `restorePace` 6538, `setLightMode`/`toggleLightMode` 6546-6556, `setResumen`/`toggleResumen` 6564-6572, `init()` 6649.
- `app/assets/css/base.css` — **clases verbatim** (portadas en F1; grep por clase): `.tl-hidden` (`display:none !important`), `.light-toggle`/`.light-switch` + `body.light-mode …`, `.resumen-toggle`/`.res-switch` + `body.modo-resumen …` (oculta `day-stats`/`day-subtitle`/`dia-ligera`/`tl-meta`/`tl-transport`/`cards-list`), `.pace-btn`(`.active`), `.cards-list`, `.card`*, `.detail-list`, `.detail-photo`, `.facts-row`, `.maps-link`, `.gastro-card`*, `.artist-card`*, `.reservas-*`, `.dia-ligera`/`.lg-*`. (Las mismas reglas viven en `index.html` 700-812 y 1581+.)
- `shared/schemas.ts` — el contrato del render: `MonumentSchema`, `DaySchema` (`timeline` discriminado, `stats`, `light`, `cards`), `FoodSchema`, `ArtistSchema`, `ReferenceSchema`, `TripSchema.sections`.
- `app/composables/useTrip.ts` — agrega el viaje + índices por id (resuelve `day.cards[]`→monument y `timeline.ref`→monument/food).
- `app/components/TheHero.vue` — **controles ya montados sin handlers** (F4 los cablea); **NO reestructurar el DOM**.
- `app/components/TripView.vue` — las **11 secciones vacías** (`#viernes`…`#arquitectura`) donde F4 enchufa el render.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CSS verbatim** (`app/assets/css/base.css` + `tokens.css`) ya define **todas** las clases de F4 (card, timeline*, gastro*, artist*, reservas*, `.tl-hidden`, `body.light-mode`/`body.modo-resumen`, `pace-btn`). Los componentes solo reproducen markup → **cero CSS nuevo**.
- **`useTrip` + índices por id** (F3) — resuelve `day.cards[]` y `timeline.ref` a fichas; los componentes consumen su retorno tipado.
- **`TheHero` controles** (F3) — markup exacto de search/pace/light/resumen ya presente; F4 añade comportamiento vía composable.
- **`TripView` secciones** (F3) — las 11 anclas con `id` ya montadas; F4 rellena su contenido.
- **85 ficheros YAML migrados 1:1** (F2) — la fuente del render, ya validada por harness.

### Established Patterns
- **"Un componente por concern, markup+clases verbatim, sin `<style scoped>`, cero CSS nuevo"** (F3) — F4 lo extiende a fichas/timeline/referencia/modos.
- **Render de prosa con `<MDC>`** — `TheHero` ya lo usa (`unwrap="p"` para inline, `<p>` para párrafos); F4 lo aplica a `sections[].body`, `desc`, `facts`, etc.
- **SSG con `queryCollection` prerenderizado** (offline) — F4 no añade fetch en runtime.
- **Estado client-only inicializado en `onMounted`** para evitar mismatch (patrón del tema en F3) — los **modos** lo siguen, lo que además preserva el micro-flash.

### Integration Points
- `app/components/` — **NUEVOS**: `DaySection`, `Timeline` + `TimelineStop`/`Transport`/`Meta`/`Food`/`Reservation`, `MonumentCard`, `GastroCard` (+ contenedor de sección), `ArtistCard`, `ReservasSection`, `PracticaSection`, `DetailPhoto` (MDC).
- `app/composables/useTripModes.ts` (o similar) — **NUEVO**: estado `pace`/`light`/`resumen` + persistencia + aplicación de clases.
- `app/components/TheHero.vue` — **MODIFICAR**: cablear los controles al composable (sin tocar el DOM del #inicio).
- `app/components/TripView.vue` — **MODIFICAR**: enchufar el render en las 11 secciones vacías.
- **Registro de componentes MDC** (`DetailPhoto`) — mecánica Content v3 a confirmar en research.
- **Consumidores aguas abajo**: **F5** (navegación: enlaces de prosa/`tl-title`, `.nav-pill.active`, `BackButton`), **F6** (búsqueda sobre el render; ruta del día desde `day.cards` añadiendo el botón a `.day-stats`), **F7** (fallback de imagen sobre `DetailPhoto`/hero, persistencia de notas sobre el shell, isla Leaflet del #mapa).

</code_context>

<specifics>
## Specific Ideas

- **Principio de frontera** (Área 1): *"shell visual ahora, comportamiento en su fase"* — imágenes y notas montan **markup** en F4; su lógica (`@error`→SVG, persistencia) en **F7**.
- **Micro-flash de 1 frame INTENCIONAL** (SC#4): se conserva inicializando los modos en `onMounted`, no en SSR.
- **Matriz de ritmo**: **solo `.tl-item` y `.tl-transport`** se filtran por `data-pace` — `.tl-food`/`.tl-meta`/`.tl-resv-meta` **NO** (aunque el esquema lleve `pace` en `food`). Replicar exacto.
- **Caminar menos**: al **activar** fuerza ritmo `'slow'` y muestra `.dia-ligera`; al **desactivar** **NO** revierte el ritmo. Los tres modos son independientes entre sí salvo ese forzado.
- **`ArtistCard` unifica** `artist` + `arquitectura` + `glosario` por `kind` (D-04/F2) — **un solo componente**, no tres.
- **`guided`/`concert` NO tienen CSS especial** (F1): la ficha del Vaticano/Auditorium se renderiza como una `card` normal; el `type` solo afectará al **marcador del mapa** (★/♪, F7).
- **Sin pixel-diff nuevo** en F4: aserciones DOM/texto + comportamiento; el golden no se rebaselina (D-08).

</specifics>

<deferred>
## Deferred Ideas

None — la discusión se mantuvo dentro del alcance de la Fase 4.

(Los diferidos que pertenecen a otras fases ya están **ubicados** explícitamente: fallback de imagen **UI-05** + notas **FEAT-04** → **F7**; navegación/scroll/scrollspy/intercepción de enlaces **FEAT-05** → **F5**; búsqueda + ruta del día → **F6**; pixel-diff total **PARITY-02** → **F8**. Los diferidos de producto — backend/PWA/segundo viaje real — siguen en `.planning/STATE.md` ▸ Deferred Items y `REQUIREMENTS.md` ▸ v2.)

</deferred>

---

*Phase: 4-Render de contenido + modos de ritmo*
*Context gathered: 2026-06-20*
