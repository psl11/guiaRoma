# Fase 4: Render de contenido + modos de ritmo - Investigación

**Investigado:** 2026-06-20
**Dominio:** Render data-driven con `<MDC>` (Nuxt Content v3) de fichas/timeline/referencia desde `useTrip`, con paridad por construcción (CSS verbatim, cero CSS nuevo), + cableado de los 3 modos triviales (ritmo/caminar-menos/resumen) sobre un composable reactivo. Fase de migración con paridad.
**Confianza:** HIGH — la mecánica de resolución de componentes de `<MDC>` se verificó leyendo el **código fuente instalado** de `@nuxtjs/mdc@0.22.0` (la fuente más autoritativa de la versión exacta en uso) y se cruzó con los docs oficiales de Content v3 + issues de `nuxt/content`. El markup, el esquema, la lógica de modos y la infraestructura de test se leyeron directamente del repo.

> Esta es una fase de **paridad por construcción**. El stack, el esquema zod, el CSS y los datos están TODOS decididos/migrados por las Fases 1-3. La investigación responde solo a la *mecánica de cómo implementar*, no a selección de librerías. **F4 no instala ningún paquete nuevo.**

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Heredado y BLOQUEADO por fases previas / research (no reabrir):**
- **Esquema zod** `shared/schemas.ts` (F2) es el contrato que el render SIGUE: `timeline` = `discriminatedUnion('kind')` (5 kinds); prosa = `sections: [{heading, body}]` con `body` Markdown-inline; `MonumentSchema` (hero/facts/sorrentino/culture); `FoodSchema` (`group`/`badgeKind`); `ArtistSchema` unifica `artist`/`arquitectura`/`glossary` por `kind`; `ReferenceSchema` = reservas|practica; `TripSchema.sections` lleva eyebrow+intro de gastronomía/arte/arquitectura.
- **Formato YAML `type:'data'` + render de prosa con `<MDC>`** (F2/research). No reabrir el formato.
- **CSS editorial VERBATIM** (F1) ya define TODAS las clases de F4. **Cero CSS nuevo, sin `<style scoped>`** (data-v-* rompería selectores globales): los componentes solo reproducen markup+clases → paridad por construcción.
- **Ancla estable = `slug`** (= `#id` del index.html). Los enlaces internos de la prosa (`[texto](#id)`) y `timeline.ref`/`day.cards[]` resuelven contra ese slug.
- **Controles del #inicio YA montados** como markup estático **SIN handlers** en `app/components/TheHero.vue` (F3): `search-wrap`, `pace-wrap` con sus 3 `pace-btn` (`data-pace="optimistic|neutral|slow"`), `light-toggle` (`#light-toggle`), `resumen-toggle` (`#resumen-toggle`), todos con `aria-pressed="false"`. **F4 los CABLEA; NO los recrea ni reestructura el DOM del #inicio**. El `search-input` lo cablea F6.
- **Claves localStorage existentes**: `roma-pace`, `roma-light` (`'1'`/`'0'`), `roma-resumen` (`'1'`/`'0'`). Preservar literal.
- **Lógica EXACTA de los modos** (de la JS del `index.html`, paridad — el planner la lee, no se reinventa):
  - **Ritmo** (`setPace`, index.html:6505-6535): `optimistic`→muestra todo; `neutral`→oculta `slow-only`; `slow`→oculta `slow-only` **y** `medium`. **Solo `.tl-item[data-pace]` y `.tl-transport[data-pace]` se filtran** — `.tl-food`/`.tl-meta`/`.tl-resv-meta` NO se filtran por ritmo (aunque el esquema lleve `pace` en `food`).
  - **Caminar menos** (`setLightMode`, 6546-6556): `body.light-mode` + al **activar** fuerza `setPace('slow')` y muestra `.dia-ligera`/`.light-banner`; al **desactivar** NO revierte el ritmo. `aria-pressed`.
  - **Resumen** (`setResumen`, 6564-6572): `body.modo-resumen`; el CSS oculta `.day-stats`, `.day-subtitle`, `.dia-ligera`, `.tl-meta`, `.tl-transport`, `.cards-list`. `aria-pressed`.

**Área 1 — Frontera de imágenes/notas (F4 ↔ F7):**
- **D-01 (Imágenes):** hero y detail-photo en F4 = **`<img>` PLANO** con `src`/`alt`/`loading` exactos, **SIN** el wrapper `@error`→SVG. F4 SÍ crea el componente **`DetailPhoto`** (MDC inline, D-02/F2); F7 le añade el fallback por `motif` y el modo hero/detail (UI-05).
- **D-02 (Notas):** F4 **monta el shell** del área de notas (`.notes-area` + `textarea` con `data-note-key`) con markup exacto pero **SIN persistencia**. La persistencia (`roma-note-<id>`) se cablea en F7 (FEAT-04).
- **Principio transversal:** *"montar el shell visual ahora para la paridad de layout, diferir el comportamiento a su fase dueña"* (precedente de F3).

**Área 2 — Mecanismo de los 3 modos:**
- **D-03:** El estado de `pace`/`light`/`resumen` vive en un **composable reactivo** (p.ej. `useTripModes`) — **NO** funciones globales ni manipulación imperativa del DOM cross-componente (anti-patrón; cf. CLAUDE.md §What NOT to Use). El composable conduce las **MISMAS clases CSS verbatim**: `.tl-hidden` en las filas afectadas, `body.light-mode` / `body.modo-resumen`.
- **D-04:** **Init desde localStorage en `onMounted`** (no en SSR): SSR y la hidratación inicial renderizan el estado **default** (ritmo `optimistic`, sin `light`/`resumen`) → **cero mismatch de hidratación**; el estado guardado se aplica **1 frame tras montar** → **PRESERVA el micro-flash** que pide **SC#4**.
- **D-05:** `TheHero` **consume el composable** para cablear sus controles ya montados (binding reactivo de `.active` en los `pace-btn`, `@click`, `aria-pressed` reactivo) **sin tocar el DOM del #inicio**. Las clases en `<body>` se aplican de forma reactiva (watcher sobre `document.body` o `bodyAttrs` — discreción del planner).

**Área 3 — Verificación de paridad (intermedia):**
- **D-06:** Mismo patrón que F3 — specs Playwright **AUTOCONTENIDOS** (build+serve propio, mirror de `subpath.spec`/`shell.spec`) que aseveran **DOM/texto/estructura** del render (no screenshots, para no rebaselinar el golden) + **sign-off humano** visual con imágenes reales cargando.
- **D-07:** **E2E del comportamiento de los 3 modos**: matriz de ritmo exacta, caminar-menos fuerza `slow` + muestra `dia-ligera`, resumen oculta el set correcto, **persistencia** (`roma-pace`/`light`/`resumen`) y el micro-flash.
- **D-08:** El **pixel-diff total** contra el golden de F1 (que **bloquea imágenes** → muestra fallbacks SVG que en F4 aún no existen) se **deja para F8**, tras el fallback de F7. F4 no rebaselina ni captura golden nuevo.

**Área 4 — Granularidad de componentes:**
- **D-09:** `Timeline.vue` itera las filas del día y **despacha a UN COMPONENTE POR KIND**: `TimelineStop` / `TimelineTransport` / `TimelineMeta` / `TimelineFood` / `TimelineReservation` (mapea 1:1 el `discriminatedUnion`).
- **D-10:** El resto, **uno por familia**: `MonumentCard`, `GastroCard` (+ agrupado por `group`), `ArtistCard` (unifica `artist`/`arquitectura`/`glossary` por `kind`), `ReservasSection`, `PracticaSection`. Un contenedor `DaySection` por día. `DetailPhoto` como componente MDC inline.
- **Patrón heredado (F3):** *"un componente por concern, markup+clases verbatim, cero CSS, sin scoped"*.

### Claude's Discretion (planner/research deciden; no requieren al usuario)
- Nombres exactos y ubicación de componentes/composable (`app/components/`, `app/composables/`).
- **Mecánica de registro de componentes MDC** (cómo `<MDC>` resuelve `DetailPhoto`). **→ RESUELTA en esta investigación (§Pattern 1).**
- Forma exacta del estado del composable (`useState` SSR-singleton vs `ref` a nivel módulo) y cómo aplica las clases de `<body>`. **→ RESUELTA (§Pattern 6).**
- Cómo se inyectan las fichas en `cards-list` desde `day.cards[]` resolviendo cada id contra el índice de monumentos de `useTrip`; agrupado de gastronomía desde `food.group`. **→ RESUELTA (§Pattern 4 / §Pattern 5).**
- Markup fino verbatim de variantes (transport `taxi`/`walk`/`train`/`metro`/`metro-b`, `fixed-event`/`reserved-event`, `disabled`, badges, `tl-meta-item` `ok`/`warn`). **→ INVENTARIADO (§Inventario de markup verbatim).**

### Deferred Ideas (OUT OF SCOPE)
None — la discusión se mantuvo dentro del alcance de la Fase 4. (Diferidos ubicados en otras fases: fallback de imagen **UI-05** + notas **FEAT-04** → **F7**; navegación/scroll/scrollspy/intercepción de enlaces **FEAT-05** → **F5**; búsqueda + ruta del día → **F6**; pixel-diff total **PARITY-02** → **F8**.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descripción | Soporte de la investigación |
|----|-------------|------------------------------|
| **UI-02** | Componente de ficha de atracción (hero, italiano, prosa, enlace Maps, notas) idéntico a hoy | §Pattern 2 (MonumentCard) + §Pattern 3 (MDC + DetailPhoto inline) + §Pitfall 1 (`detail-list` sin clase) + §Pitfall 2 (dropcap/`no-dropcap`) + §Inventario de markup |
| **UI-03** | Timeline componentizado (item/transport/food) idéntico, respetando filtrado por ritmo | §Pattern 4 (Timeline dispatch por `kind`) + §Inventario (las 5 kinds + variantes transport) + §Pattern 6 (`isVisible` exacto) |
| **UI-04** | Secciones de referencia (Reservas, Gastronomía, Práctica, Arte, Arquitectura) desde datos e idénticas | §Pattern 5 (ReservasSection/PracticaSection/GastroCard agrupado/ArtistCard unificado) + §Inventario (reservas-table/badges, gastro-card, arq-glosario) |
| **FEAT-06** | Selector de ritmo (optimista/neutral/lento) que muestra/oculta items, persistido | §Pattern 6 (`useTripModes` + `isVisible`) + §Pattern 7 (cableado en TheHero) + §Pitfall 4 (matriz exacta) |
| **FEAT-07** | Modo "caminar menos" que además fuerza ritmo lento | §Pattern 6 (acoplamiento `watch(light → pace='slow')`) + §Pitfall 5 (no revertir al desactivar) |
| **FEAT-08** | Modo resumen (vista índice de hora y lugar) | §Pattern 6 (`body.modo-resumen` por clase reactiva; toda la lógica es CSS) |
</phase_requirements>

## Summary

F4 rellena las **11 secciones vacías** que F3 dejó en `TripView` (`#viernes`…`#martes` + `#reservas`/`#gastronomia`/`#practica`/`#arte`/`#arquitectura`) **desde los datos de `useTrip`**, y cablea los **3 modos triviales** sobre los controles que `TheHero` ya monta. No hay riesgo de selección de librería: todo el stack está instalado, el CSS editorial está verbatim en el repo, las 85 fichas YAML están migradas y validadas, y la mecánica de `<MDC>` se verificó leyendo el código fuente de `@nuxtjs/mdc@0.22.0`.

Cuatro mecánicas dominan, y las cuatro preguntas abiertas de CONTEXT.md quedan **resueltas**:

1. **Registro de componentes MDC (la pregunta de mayor prioridad).** `<MDC :value="body" />` renderiza un string Markdown; cuando encuentra `:detail-photo{...}` invoca `resolveComponent(pascalCase('detail-photo'), false)` = `resolveComponent('DetailPhoto')` contra el **registro de componentes GLOBALES** de la app. En **Content v3 los componentes de `components/content/` ya NO se registran como globales automáticamente** (cambio de ruptura vs v2) — y los auto-imports normales de `app/components/` tampoco son globales. Por tanto **`DetailPhoto` DEBE registrarse como global**: lo más simple y verificado es el sufijo de fichero **`DetailPhoto.global.vue`** (o una entrada `components` en `nuxt.config.ts` con `global: true`). El esquema kebab `:detail-photo` ↔ fichero PascalCase `DetailPhoto` es la conversión nativa.

2. **`unwrap` / inline-vs-párrafo.** El `<MDC>` envuelve por defecto el contenido en `<p>` (vía `ProseP`). En `MonumentCard` la prosa de `sections[].body` es **multi-párrafo y va dentro de `.card-section`** → se quiere `<p>` y se **NO** se usa `unwrap` (al contrario que `TheHero`, que usa `unwrap="p"` en los casos inline `trip.title`/`infoCards.value`). El dropcap depende de que el primer párrafo de cada sección sea un `<p>` real (§Pitfall 2).

3. **Inyección de fichas + agrupado.** `DaySection` renderiza `day.cards[]` (orden = el del dato, ES el orden de la "ruta del día" de F6) resolviendo cada id contra `useTrip().monById`. La gastronomía se agrupa por el campo `food.group` (un `computed` que agrupa preservando el orden de primera aparición de cada grupo).

4. **Modos en un composable reactivo.** `useTripModes()` expone `pace`/`light`/`resumen` + `isVisible(itemPace)`. Conduce `.tl-hidden` en las filas (binding `:class`, no `classList`) y `body.light-mode`/`body.modo-resumen` (vía `useHead({ bodyAttrs })`). Init en `onMounted` (preserva el micro-flash, cero mismatch). `TheHero` consume el composable para cablear sus controles sin tocar el DOM del #inicio.

**Recomendación primaria:** Construir primero las piezas de **bajo riesgo y data puro** (fichas/timeline/referencia con `<MDC>` y `DetailPhoto.global.vue`), validando contra los specs DOM autocontenidos; luego el composable de modos + su cableado en `TheHero`. Los dos tests de mayor valor son: (a) el spec DOM que verifica que `:detail-photo` resuelve a un `.detail-photo > img` real (no a `<p>:detail-photo{...}</p>` sin renderizar), y (b) la matriz E2E de ritmo/light/resumen. **Dos sutilezas de paridad CSS** requieren atención del planner: `.detail-list` (las listas nativas de Markdown NO llevan esa clase) y el dropcap (`no-dropcap` en todas las secciones salvo la primera) — ver Pitfalls 1 y 2.

## Architectural Responsibility Map

| Capacidad | Tier primario | Tier secundario | Razón |
|-----------|---------------|-----------------|-------|
| Render de fichas/timeline/referencia desde datos | Build/SSG (prerender) | Frontend (componentes Vue presentacionales) | `useTrip` resuelve `queryCollection` en prerender (F3 ya lo probó); los componentes son HTML real prerenderizado → paridad + offline. Sin fetch en runtime. |
| Render de prosa Markdown (`<MDC>`) | Build/SSG (parseMarkdown en prerender) | Browser (hidratación) | `<MDC>` parsea el string y renderiza Prose components; en SSG el árbol se prerenderiza. La resolución de `DetailPhoto` ocurre vía el registro global de componentes. |
| Resolución de `day.cards[]`→monumento y agrupado gastro | Frontend (computed puro sobre `useTrip`) | — | Índices `monById` ya construidos por `useTrip`; el agrupado es un `computed` puro sobre `food`. Sin DOM. |
| Estado de los 3 modos (pace/light/resumen) | Browser (estado reactivo cliente + `onMounted`) | Build/SSG (render del estado DEFAULT) | El default (`optimistic`/false/false) se prerenderiza = el HTML inicial; localStorage se aplica en `onMounted` (1 frame post-paint) → micro-flash intencional, cero mismatch. |
| Aplicación de clases de modo (`.tl-hidden`, `body.*`) | Browser (binding reactivo `:class` / `useHead bodyAttrs`) | — | Idiomático Vue; las MISMAS clases CSS verbatim hacen el ocultado. Nunca `classList`/`querySelectorAll` cross-componente. |

## Standard Stack

> **Todos los paquetes ya están instalados** (F1/F2). F4 **NO introduce ninguna dependencia nueva** (runtime ni dev). El stack está completo para esta fase.

### Core (ya presente, consumido por F4)
| Librería | Versión (instalada) | Propósito en F4 | Por qué |
|----------|--------------------|------------------|---------|
| **nuxt** | **4.4.8** | Auto-import de componentes, `useHead({bodyAttrs})`, `onMounted`, SSG vía prerender | Locked por el proyecto `[VERIFIED: package.json]` |
| **@nuxt/content** | **3.14.0** | Provee el componente `<MDC>` (vía su dep `@nuxtjs/mdc`) + los datos de `useTrip` | Capa de datos + render de prosa `[VERIFIED: node_modules]` |
| **@nuxtjs/mdc** | **0.22.0** (transitiva de @nuxt/content) | El componente `<MDC>` real: parsea Markdown-inline y resuelve componentes custom (`:detail-photo`) | `[VERIFIED: node_modules/.pnpm/@nuxtjs+mdc@0.22.0/.../components/MDC.vue + MDCRenderer.vue]` |
| **zod** | **4.4.3** | Fuente de los tipos TS (`Monument`/`Day`/`Food`/`Artist`/`Reference`) que los componentes consumen | Ya es la fuente del esquema `[CITED: shared/schemas.ts]` |

### Supporting (sin instalación nueva)
| Librería | Versión | Propósito | Cuándo |
|----------|---------|-----------|--------|
| **@playwright/test** | 1.61.0 | Specs DOM autocontenidos (D-06) + E2E de modos (D-07) | Verificación de F4 `[VERIFIED: package.json]` |
| **vitest** | 4.1.9 | Tests unitarios puros (matriz `isVisible`, agrupado de food) | Wave 0 si se extraen helpers puros `[VERIFIED: package.json]` |

### Alternativas Consideradas
| En vez de | Se podría usar | Tradeoff |
|-----------|----------------|----------|
| `DetailPhoto.global.vue` (sufijo) | entrada `components: [{ path:'~/components/content', global:true }]` en `nuxt.config.ts` | El sufijo `.global.vue` es la vía más local y autodocumentada (un fichero declara su propia globalidad). La config en `nuxt.config.ts` centraliza pero requiere editar config global. **Ambas funcionan**; el sufijo es la de menor superficie. Discreción del planner. |
| `useHead({ bodyAttrs:{ class } })` para `body.light-mode`/`modo-resumen` | `watch` + `document.body.classList` en `onMounted` | `useHead({bodyAttrs})` es SSR-safe e idiomático (Nuxt gestiona el `<body>` sin tocar el DOM directamente). El `watch`+`classList` funciona pero toca el DOM imperativamente (más cerca del anti-patrón que CLAUDE.md desaconseja, aunque sobre `<body>` es aceptable). **Recomendación: `useHead({bodyAttrs})`.** |
| `.tl-hidden` vía binding `:class="{ 'tl-hidden': !isVisible(row.pace) }"` | `data-pace` + CSS que oculte | El binding reactivo es la traducción directa y testeable; replicar la lógica en CSS (`body[data-pace=slow] .tl-item[data-pace=medium]`) sería **CSS nuevo** (prohibido). **Usar el binding `:class`.** |

**Instalación:** Ninguna. F4 consume el stack existente.

**Verificación de versión:** Las versiones se leyeron del árbol instalado (`package.json` + `node_modules/.pnpm/*/package.json`), por lo que son las versiones exactas fijadas en uso — no registry-latest ni datos de entrenamiento.

## Package Legitimacy Audit

> F4 instala **cero paquetes nuevos** — consume paquetes ya verificados e instalados en F1/F2/F3. slopcheck no se ejecutó porque no hay instalación en esta fase. El componente `<MDC>` proviene de `@nuxtjs/mdc`, dependencia transitiva oficial de `@nuxt/content` (mismo org Nuxt).

| Paquete | Registro | Edad | Repo fuente | Disposición |
|---------|----------|------|-------------|-------------|
| nuxt 4.4.8 | npm | maduro (4.x estable) | github.com/nuxt/nuxt | Aprobado (ya instalado) |
| @nuxt/content 3.14.0 | npm | maduro | github.com/nuxt/content | Aprobado (ejercitado por tests F2) |
| @nuxtjs/mdc 0.22.0 | npm | maduro (transitiva de content) | github.com/nuxt/mdc | Aprobado (dep oficial de @nuxt/content; ya en node_modules) |
| zod 4.4.3 | npm | maduro | github.com/colinhacks/zod | Aprobado (ya instalado) |

**Paquetes removidos por veredicto [SLOP]:** ninguno (no hay instalación en esta fase).
**Paquetes marcados [SUS]:** ninguno.

## Architecture Patterns

### System Architecture Diagram

```
content/trips/roma/{monuments,food,artists,reference,days}/*.yml  (validado por zod en F2)
        │  queryCollection(...).where('trip','=','roma')[.order('order','ASC')]   [RESUELTO EN PRERENDER]
        ▼
   useTrip('roma')  →  { trip, days(ordenado), monuments, food, artists, reference,
        │                monById, foodById, artById, refById }   (refs/computed; F3)
        │  (TripView ya llama a useTrip; F4 PASA estos datos a los nuevos componentes)
        ▼
   TripView  (F3 — POSEEDOR; F4 rellena las 11 <section> vacías)
        ├─ <section id="inicio">  TheHero  ← F3 ya lo monta; F4 CABLEA sus controles a useTripModes
        │
        ├─ <section id="viernes"…"martes">  DaySection (×5)   ← F4
        │     ├─ .light-banner            (CSS-hidden salvo body.light-mode)
        │     ├─ .section-eyebrow + .day-header (day-number + h2 + day-subtitle)
        │     ├─ .day-stats (stats[] por variant walk/train/taxi/metro/ticket)
        │     ├─ .dia-ligera              (CSS-hidden salvo body.light-mode; light.items lg-*)
        │     ├─ Timeline                 ← day.timeline[] (ordenado)
        │     │    └─ <component :is> por row.kind:
        │     │       TimelineStop | TimelineTransport | TimelineMeta | TimelineFood | TimelineReservation
        │     │       · usa useTripModes().isVisible(row.pace) para .tl-hidden (solo stop/transport)
        │     └─ .cards-list              ← day.cards[] (ids ORDENADOS) → monById → MonumentCard (×n)
        │          └─ MonumentCard
        │             ├─ card-header (card-roman + h3 + card-italian + card-badge)
        │             ├─ card-artists/card-arch (Links a #art-*/#arq-*)
        │             ├─ card-hero > img  (PLANO en F4; @error→SVG es F7)
        │             ├─ card-section (×n)  → <MDC :value="section.body" />  (sin unwrap; <p> + dropcap)
        │             │    · :detail-photo{...} → DetailPhoto (componente GLOBAL)
        │             │    · listas Markdown → <ul><li> (⚠ Pitfall 1: sin clase .detail-list)
        │             ├─ facts (facts-row label/value)
        │             ├─ a.maps-link  (Google Maps search; target=_blank rel=noopener)
        │             ├─ sorrentino-box / culture-box (opcionales)
        │             └─ notes-area (label + textarea data-note-key)  ← shell sin persistencia (F7)
        │
        └─ <section id="reservas"…"arquitectura">   ← F4
              ├─ ReservasSection   (section-eyebrow + h2 + gastro-intro + reservas-confirmadas + reservas-table)
              ├─ #gastronomia: section-eyebrow + h2 + gastro-intro(trip.sections.gastronomia)
              │     + por grupo: gastro-section-title + (groupIntro?) + gastro-grid > GastroCard (×n)
              ├─ PracticaSection   (eyebrow + h2 + intro + sections(MDC) + media por category)
              ├─ #arte: section-eyebrow + intro(trip.sections.arte) + ArtistCard(kind='artist') (×n)
              └─ #arquitectura: section-eyebrow + intro(trip.sections.arquitectura)
                    + ArtistCard(kind='arquitectura') (×n) + ArtistCard(kind='glossary') (arq-glosario)

   [MODOS]  useTripModes()  → useState('pace'|'light'|'resumen') + isVisible()
        · onMounted: lee roma-pace/roma-light/roma-resumen (micro-flash intencional, SC#4)
        · watch(light, on => { if (on) pace.value='slow' })   (acoplamiento exacto)
        · body.light-mode / body.modo-resumen vía useHead({ bodyAttrs })
        · consumido por: TheHero (controles) + Timeline (isVisible para .tl-hidden)
```

### Recommended Project Structure (delta para F4)
```
app/
├── components/
│   ├── (existentes F3: Topbar, NavPills, ThemeToggle, BackButton, TripView, TheHero)
│   ├── DetailPhoto.global.vue   # NUEVO — componente MDC inline (:detail-photo). GLOBAL (ver Pattern 1)
│   ├── DaySection.vue           # NUEVO — un día: banner/header/stats/dia-ligera/Timeline/cards-list
│   ├── Timeline.vue             # NUEVO — itera day.timeline; <component :is> por kind
│   ├── TimelineStop.vue         # NUEVO — .tl-item (stop)
│   ├── TimelineTransport.vue    # NUEVO — .tl-transport (variantes taxi/walk/train/metro/metro-b)
│   ├── TimelineMeta.vue         # NUEVO — .tl-meta (items ok/warn/plain)
│   ├── TimelineFood.vue         # NUEVO — .tl-food (header + entries + foot)
│   ├── TimelineReservation.vue  # NUEVO — .tl-resv-meta (banda verde)
│   ├── MonumentCard.vue         # NUEVO — .card completa (UI-02)
│   ├── GastroCard.vue           # NUEVO — .gastro-card (UI-04)
│   ├── ArtistCard.vue           # NUEVO — .artist-card (unifica artist/arquitectura/glossary por kind)
│   ├── ReservasSection.vue      # NUEVO — #reservas (confirmadas + tabla)
│   └── PracticaSection.vue      # NUEVO — #practica (prosa + media)
├── composables/
│   ├── useTrip.ts               # (existente F3 — sin cambios)
│   └── useTripModes.ts          # NUEVO — pace/light/resumen + persistencia + isVisible
└── utils/
    └── pace.ts                  # NUEVO (opcional) — isVisible(itemPace, pace) puro y testeable
```
> **Convención de auto-import (verificar):** Nuxt 4 deriva el nombre del componente de su ruta + nombre de fichero. Con los componentes planos en `app/components/` (como hizo F3), `Timeline.vue` → `<Timeline>`, `MonumentCard.vue` → `<MonumentCard>`. **Mantener planos** (no anidar en subcarpetas de dominio) para que los nombres coincidan sin prefijo, igual que F3. ESLint del proyecto exige nombres multi-palabra salvo excepción (F3 añadió `Topbar` a la allowlist); `Timeline` es una sola palabra → **el planner debe añadir `Timeline` a la allowlist de `eslint.config.mjs`** (igual que F3 hizo con `Topbar`), o nombrarlo `DayTimeline`.

### Pattern 1: Registro de componentes MDC — `DetailPhoto` como componente GLOBAL (LA pregunta de mayor prioridad — RESUELTA)

**Qué:** Cuando `<MDC :value="section.body" />` parsea un `body` que contiene `:detail-photo{src=... alt=... caption=...}`, debe renderizar el componente Vue `DetailPhoto`. Esto solo funciona si `DetailPhoto` está **registrado globalmente**.

**Mecánica VERIFICADA desde el código fuente** (`@nuxtjs/mdc@0.22.0/dist/runtime/components/MDCRenderer.vue`):
- Al renderizar un nodo cuyo `tag` no es HTML nativo ni un Prose component, MDCRenderer llama:
  ```js
  const resolveComponentInstance = (component) => {
    if (typeof component === "string") {
      if (ignoreTag(component)) return component;            // ignoreTag = HTML tags + customElements
      const _component = vueResolveComponent(pascalCase(component), false);  // ← AQUÍ
      ...
    }
  };
  ```
  Es decir: `:detail-photo` → `pascalCase('detail-photo')` = `'DetailPhoto'` → `resolveComponent('DetailPhoto', false)` de Vue. `resolveComponent` busca en el **registro de componentes GLOBALES** de la instancia de la app (con `maybeSelfReference=false`). `ignoreTag('detail-photo')` es **false** (no es un HTML tag conocido), así que SÍ intenta resolver el componente. `[VERIFIED: node_modules/.pnpm/@nuxtjs+mdc@0.22.0/.../MDCRenderer.vue líneas 297-318, 387-393]`

- **El gran caveat de Content v3:** en **v2** los componentes de `components/content/` se registraban como **globales** por defecto; en **v3 ya NO**. Para `<MDC :value>` (render dinámico de un STRING, el caso de F4 — no un fichero `.md`), el componente debe registrarse global explícitamente. `[CITED: nuxt/content#2931, #2256; content.nuxt.com/docs/files/markdown: "Components that are used in Markdown have to be marked as global in your Nuxt app if you don't use the components/content/ directory."]`

- **Los auto-imports normales de `app/components/` tampoco son globales** — son imports locales por template. `resolveComponent('DetailPhoto')` NO los encuentra a menos que se marquen global. `[CITED: nuxt.com/docs/4.x — global components vía sufijo .global.vue o components:[{global:true}]]`

**Solución recomendada (la de menor superficie):** crear el componente como **`app/components/DetailPhoto.global.vue`**. El sufijo `.global.vue` lo registra globalmente (Nuxt crea un chunk async y lo hace resolvible en toda la app), de modo que `resolveComponent('DetailPhoto')` lo encuentra cuando MDC lo busca. Verificación: `[CITED: nuxt.com/docs/4.x/guide/directory-structure/app/components — ".global.vue" suffix registers a component globally]`.

**Alternativa equivalente:** una entrada en `nuxt.config.ts`:
```ts
components: [
  { path: '~/components', pathPrefix: false },          // mantener el auto-import normal
  { path: '~/components/content', global: true, pathPrefix: false },  // los MDC, globales
]
```
y poner `DetailPhoto.vue` en `app/components/content/`. **El sufijo `.global.vue` es más simple** (no toca `nuxt.config.ts` ni la convención de carpetas) — recomendado.

**Sintaxis del componente:** `:detail-photo{...}` (un solo `:`) es un componente **inline/leaf** (sin slot). El componente recibe `src`/`alt`/`caption` como **props** (los `{key=value}` del MDC se pasan como props). F4 lo implementa renderizando el `.detail-photo > img + .detail-photo-caption` verbatim (D-01: `<img>` plano, sin `@error`; F7 añade el fallback):
```vue
<!-- app/components/DetailPhoto.global.vue -->
<script setup lang="ts">
// Componente MDC inline (:detail-photo{...}). GLOBAL para que <MDC> lo resuelva via resolveComponent.
// D-01: <img> PLANO en F4 (src/alt/loading exactos); F7 le añade @error→SVG por motif + modo hero/detail.
// La caption ADMITE Markdown-inline → se renderiza con <MDC :value="caption" unwrap="p" /> (inline).
defineProps<{ src: string, alt: string, caption: string }>()
</script>
<template>
  <div class="detail-photo">
    <img :src="src" :alt="alt" loading="lazy">
    <div class="detail-photo-caption"><MDC :value="caption" unwrap="p" /></div>
  </div>
</template>
```
> **Verificar en implementación:** que la `caption` del dato (puede llevar `—`/`_cursiva_`) se renderice idéntica. Si la caption es texto plano sin markup, un `{{ caption }}` directo basta y evita un `<MDC>` anidado; revisar las 37 captions. La caption de galleria-sciarra es texto plano → `{{ caption }}` sería suficiente, pero `<MDC unwrap="p">` es seguro para cualquiera con markup.

### Pattern 2: `MonumentCard` — `.card` verbatim, prosa por secciones con `<MDC>`

**Qué:** reproduce el `<article class="card" :id="m.slug">` del index.html (2450-2510) data-bound desde un `Monument`.
**Cuándo:** UI-02; renderizado por `DaySection` para cada id de `day.cards[]`.

```vue
<!-- app/components/MonumentCard.vue (boceto — markup VERBATIM, cero CSS) -->
<script setup lang="ts">
import type { Monument } from '~~/shared/schemas'
defineProps<{ monument: Monument }>()
</script>
<template>
  <article class="card" :id="monument.slug">
    <div class="card-header">
      <span class="card-roman">{{ monument.roman }}</span>
      <div class="card-title">
        <h3>{{ monument.name }}</h3>
        <div class="card-italian">{{ monument.italian }}</div>
      </div>
      <span v-if="monument.badge" class="card-badge">{{ monument.badge }}</span>
    </div>

    <!-- card-artists / card-arch (Links a #art-*/#arq-*) — ver Inventario para la combinación exacta -->
    <!-- card-hero: <img> PLANO en F4 (sin onerror; F7 lo envuelve con @error→SVG) -->
    <div class="card-hero"><img :src="monument.hero.src" :alt="monument.hero.alt" loading="lazy"></div>

    <!-- Prosa por secciones: PRIMERA con dropcap, RESTO no-dropcap (Pitfall 2) -->
    <div
      v-for="(s, i) in monument.sections"
      :key="i"
      class="card-section"
      :class="{ 'no-dropcap': i !== 0 }"
    >
      <h4>{{ s.heading }}</h4>
      <MDC :value="s.body" />   <!-- SIN unwrap: se quieren los <p> (dropcap) + :detail-photo + listas -->
    </div>

    <div class="facts">
      <div v-for="(f, i) in monument.facts" :key="i" class="facts-row">
        <span class="label">{{ f.label }}</span><span class="value">{{ f.value }}</span>
      </div>
    </div>
    <a :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(monument.mapsQuery)}`"
       target="_blank" rel="noopener" class="maps-link">Ver en Google Maps</a>

    <div v-if="monument.sorrentino" class="sorrentino-box">
      <span class="label">{{ monument.sorrentino.label }}</span>
      <MDC :value="monument.sorrentino.text" unwrap="p" />
    </div>
    <!-- culture-box (opcional): ver Inventario -->

    <!-- notes-area: SHELL sin persistencia (D-02; F7 cablea roma-note-<slug>) -->
    <div class="notes-area">
      <label :for="`note-${monument.slug}`">Notas in situ</label>
      <textarea class="notes-textarea" :id="`note-${monument.slug}`" :data-note-key="monument.slug"
                placeholder="Lo que quieras recordar de aquí…" />
    </div>
  </article>
</template>
```
> **`maps-link` (verificar):** el index.html tiene la URL ya construida (`...query=Galleria%20Sciarra%20Roma`). El dato tiene `mapsQuery: "Galleria Sciarra Roma"` (texto plano). Reconstruir con `encodeURIComponent` produce `Galleria%20Sciarra%20Roma` (idéntico). **Verificar que `encodeURIComponent` reproduce el escaping EXACTO del original** (espacios→%20, `'`→%27, etc.) en los casos con apóstrofo/acentos, o el `href` divergirá (riesgo de paridad de atributo, no visual). El texto del enlace es estático: "Ver en Google Maps".

### Pattern 3: `<MDC>` `unwrap` — inline (TheHero) vs párrafo (MonumentCard) — RESUELTA

**Qué:** `<MDC>` envuelve por defecto el contenido en `<p>` (vía `ProseP`). El prop `unwrap` (Boolean | String, default `false`) quita los wrappers indicados. `[VERIFIED: MDC.vue props — unwrap: { type:[Boolean,String], default:false }; MDCRenderer flatUnwrap(default(), unwrap.split(' '))]`

**La regla por campo (verificada contra el patrón YA establecido por F3 en TheHero):**

| Campo | Contenido | `unwrap`? | Razón |
|-------|-----------|-----------|-------|
| `trip.title` (en `<h1>`) | inline (`Cinque giorni a _Roma_`) | **`unwrap="p"`** (F3 ya lo hace) | Un `<p>` dentro de `<h1>` rompería el ritmo; se quiere solo el `<em>` |
| `infoCards.value` | inline | **`unwrap="p"`** (F3 ya lo hace) | Va dentro de `.info-card-value` que ya estiliza |
| `trip.howTo[]` | párrafo | **sin unwrap** (F3 ya lo hace, dentro de un `<p v-for>`) | El index.html los tiene como `<p>` |
| **`monument.sections[].body`** | **multi-párrafo** | **SIN unwrap** | El index.html tiene `<p>...</p><p>...</p>` dentro de `.card-section`; el **dropcap** (`.card-section p:first-of-type::first-letter`) NECESITA que sean `<p>` reales (Pitfall 2) |
| `monument.sorrentino.text` | inline (1 párrafo) | **`unwrap="p"`** | El index.html mete el texto directo en `.sorrentino-box` tras el `<span class="label">`, SIN `<p>` (ver index.html:2501-2504) → un `<p>` extra cambiaría el espaciado |
| `tl-note`, `tl-transport-mode-desc`, `tl-meta-item`, footnotes, food-desc | inline | **`unwrap="p"`** | Son fragmentos inline dentro de spans/divs ya estilizados; un `<p>` rompería el flujo |
| `reservas.confirmed[].text`, `reservas.table[].desc` | inline (dentro de `<li>`/`<td>`) | **`unwrap="p"`** | Idéntico razonamiento |
| `gastro-card-desc`, `gastro-plato` | el index.html los tiene como `<p class="gastro-card-desc">` y `<div class="gastro-plato">` | **`unwrap="p"`** y aplicar la clase al contenedor propio | Ver Inventario — el contenedor lleva la clase, MDC va dentro sin `<p>` |

> **Heurística general:** si el dato va dentro de un contenedor que YA aplica estilo de bloque (`.card-italian`, `.sorrentino-box`, `<li>`, `<td>`, `.tl-note`), usar `unwrap="p"`. Si el dato ES el bloque de párrafos (las secciones de prosa de la ficha, `howTo`), dejar el `<p>`. **El planner debe auditar campo por campo contra el golden** (es cuadre CSS/markup, no lógica) — ver Pitfalls 1 y 2 para los dos casos de riesgo real.

### Pattern 4: `Timeline` — dispatch por `kind` con `<component :is>` + filtrado por ritmo

**Qué:** `Timeline` itera `day.timeline[]` (orden explícito) y despacha cada fila a su componente por `kind` (mapea 1:1 el `discriminatedUnion('kind')` de `shared/schemas.ts`). Solo `stop` y `transport` se ocultan por ritmo.

```vue
<!-- app/components/Timeline.vue (boceto) -->
<script setup lang="ts">
import type { Day } from '~~/shared/schemas'
defineProps<{ rows: Day['timeline'] }>()
const { isVisible } = useTripModes()   // auto-importado

// Mapa kind → componente (los 5 kinds del discriminatedUnion)
const COMPONENT_BY_KIND = {
  stop: 'TimelineStop',
  transport: 'TimelineTransport',
  meta: 'TimelineMeta',
  food: 'TimelineFood',
  reservation: 'TimelineReservation',
} as const
</script>
<template>
  <div class="timeline">
    <component
      :is="COMPONENT_BY_KIND[row.kind]"
      v-for="(row, i) in rows"
      :key="i"
      :row="row"
    />
  </div>
</template>
```
> **El filtrado por ritmo (`.tl-hidden`) vive en `TimelineStop`/`TimelineTransport`**, no en `Timeline`: cada uno aplica `:class="{ 'tl-hidden': !isVisible(row.pace) }"` sobre su elemento raíz (`.tl-item`/`.tl-transport`). `TimelineMeta`/`TimelineFood`/`TimelineReservation` **NO** consultan `isVisible` — nunca se filtran por ritmo (Pitfall 4). Esto mapea el `document.querySelectorAll('.tl-item[data-pace], .tl-transport[data-pace]')` del original: solo esas dos clases.
>
> **Importante — `<component :is>` con auto-import:** Nuxt resuelve `<component :is="'TimelineStop'">` por nombre de string si el componente está auto-importado. Funciona porque los 5 son componentes del proyecto. (Confirmado como patrón estándar en ARCHITECTURE.md §Pattern 4.)

**`data-pace` por paridad de DOM (verificar):** el original tiene `data-pace="all|medium|slow-only"` en cada `.tl-item`/`.tl-transport`. F4 puede **conservar `:data-pace="row.pace"`** por paridad de atributo (es barato y el golden lo tiene), aunque la lógica ya no dependa de él. Recomendado conservarlo para que un futuro test que inspeccione `data-pace` no falle.

### Pattern 5: Inyección de fichas + agrupado de gastronomía — RESUELTA

**`day.cards[]` → MonumentCard (orden = el del dato):**
```vue
<!-- dentro de DaySection.vue -->
<script setup lang="ts">
import type { Day } from '~~/shared/schemas'
const props = defineProps<{ day: Day }>()
const { monById } = await useTrip('roma')   // o recibir monById por prop desde TripView (ver nota)
// Resolver cada id de cards[] contra el índice; preservar el ORDEN del array (= orden de ruta del día, F6)
const dayCards = computed(() =>
  props.day.cards.map(slug => monById.value.get(slug)).filter((m): m is NonNullable<typeof m> => !!m))
</script>
<template>
  <div class="cards-list">
    <MonumentCard v-for="m in dayCards" :key="m.slug" :monument="m" />
  </div>
</template>
```
> **Nota de flujo de datos (discreción del planner):** `TripView` ya llama a `useTrip` (F3). Dos opciones: (a) `TripView` pasa `monById`/`days`/etc. a `DaySection` por props (un solo `useTrip`), o (b) cada componente llama a `useTrip('roma')` de nuevo (Nuxt deduplica por la clave de `useAsyncData`, así que NO re-fetcha; el coste es repetir la llamada). **Recomendación: pasar por props desde `TripView`** (un solo origen, más explícito, mismo patrón que F3 con `Topbar :days`). El orden de `day.cards` ES el orden de la ruta del día (DATA-03/F6) — **nunca reordenar**.

**Agrupado de gastronomía por `food.group` (preservando orden de aparición):**
```ts
// computed en el componente de la sección #gastronomia (o un util puro testeable)
const foodGroups = computed(() => {
  const groups = new Map<string, Food[]>()
  for (const f of (food.value ?? [])) {
    if (!groups.has(f.group)) groups.set(f.group, [])
    groups.get(f.group)!.push(f)
  }
  return [...groups.entries()].map(([group, items]) => ({
    group,                            // texto del .gastro-section-title
    groupIntro: items[0]?.groupIntro, // .gastro-intro del grupo (algunos grupos lo llevan)
    items,
  }))
})
```
> El `Map` preserva el orden de **primera inserción**, así que los grupos salen en el orden en que aparecen las fichas en `food` (que `useTrip` devuelve en el orden de `queryCollection('food').all()`). **Verificar que ese orden coincide con el del index.html** (gastro-section-title: "Pasta clásica · trattorias históricas" primero, etc.). Si el orden de `.all()` no es el del DOM original, el planner debe ordenar explícitamente (p.ej. un campo de orden o un array de grupos canónico). **FLAG: el orden de los grupos es un punto de paridad a verificar (Pitfall 6).**

### Pattern 6: `useTripModes` — estado reactivo de los 3 modos (forma exacta — RESUELTA)

**Qué:** un composable que expone `pace`/`light`/`resumen` + `isVisible(itemPace)`, persiste en localStorage (init en `onMounted`), aplica el acoplamiento light→slow, y conduce las clases de `<body>`.

**`useState` (SSR-singleton) vs `ref` a nivel módulo — recomendación: `useState`.** `useState(key, init)` es el mecanismo SSR-friendly de Nuxt para estado compartido por clave entre componentes (lo usan `TheHero` y `Timeline`). Un `ref` a nivel de módulo también comparte estado pero NO es SSR-safe de la misma forma (puede filtrar estado entre requests en SSR; en SSG puro el riesgo es menor, pero `useState` es la vía idiomática y la que ARCHITECTURE.md prescribe). `[CITED: ARCHITECTURE.md §Composables; nuxt.com/docs/4.x state-management]`

```ts
// app/composables/useTripModes.ts (boceto — auto-importado)
export function useTripModes() {
  const pace = useState<'optimistic' | 'neutral' | 'slow'>('pace', () => 'optimistic')  // DEFAULT = HTML prerenderizado
  const light = useState('light', () => false)
  const resumen = useState('resumen', () => false)

  // Acoplamiento EXACTO (index.html:6552): al ACTIVAR light, forzar pace=slow. Al desactivar, NO revertir.
  watch(light, (on) => { if (on) pace.value = 'slow' })

  // Matriz EXACTA (index.html:6521-6534). Solo aplicada a stop/transport por los componentes.
  const isVisible = (itemPace: 'all' | 'medium' | 'slow-only') =>
    pace.value === 'optimistic' ? true
      : pace.value === 'neutral' ? itemPace !== 'slow-only'
        : itemPace === 'all'            // slow: solo 'all' visible (oculta medium Y slow-only)

  // Clases en <body> (idiomático, SSR-safe). bodyAttrs.class reactivo.
  useHead({
    bodyAttrs: {
      class: computed(() => [light.value ? 'light-mode' : '', resumen.value ? 'modo-resumen' : ''].filter(Boolean).join(' ')),
    },
  })

  // Persistencia + restauración: SOLO en cliente, en onMounted (micro-flash intencional, SC#4).
  onMounted(() => {
    // Restaurar (post-paint → el frame de flash que pide SC#4)
    const savedPace = localStorage.getItem('roma-pace')
    if (savedPace === 'optimistic' || savedPace === 'neutral' || savedPace === 'slow') pace.value = savedPace
    if (localStorage.getItem('roma-light') === '1') light.value = true        // dispara el watch → pace='slow'
    if (localStorage.getItem('roma-resumen') === '1') resumen.value = true
    // Persistir en cambios futuros
    watch(pace, v => localStorage.setItem('roma-pace', v))
    watch(light, v => localStorage.setItem('roma-light', v ? '1' : '0'))
    watch(resumen, v => localStorage.setItem('roma-resumen', v ? '1' : '0'))
  })

  return { pace, light, resumen, isVisible }
}
```
> **Sutilezas de paridad CRÍTICAS:**
> - **`aria-pressed`** en `#light-toggle`/`#resumen-toggle` debe enlazarse reactivo (`:aria-pressed="light"`), reproduciendo `btn.setAttribute('aria-pressed', ...)`. Los `pace-btn` NO usan `aria-pressed` en el original (usan `.active`) — no añadirlo.
> - **El watch de persistencia debe ir DENTRO de `onMounted`** (no en setup síncrono) para no escribir localStorage en SSR/prerender y no disparar en la restauración inicial de forma que pierda el valor. Alternativa: VueUse `useStorage` (no instalado; el patrón manual es suficiente y sin dependencia nueva).
> - **Orden de restauración:** restaurar `light` DESPUÉS de `pace`, porque al poner `light=true` el `watch` fuerza `pace='slow'` — y eso es exactamente lo que hace `restoreLightMode()` tras `restorePace()` en el `init()` original (index.html:6650-6652). Replicar ese orden.
> - **El default debe coincidir con el HTML prerenderizado:** `pace='optimistic'` (el `pace-btn` optimistic ya tiene `.active` en el markup de TheHero), `light=false`, `resumen=false`. Cero mismatch de hidratación (Pitfall 3 del proyecto).

**`utils/pace.ts` (opcional pero recomendado):** extraer `isVisible(itemPace, pace)` como **función pura** auto-importada → testeable con Vitest plano sin runtime Nuxt (igual que F3 extrajo `dayLabel`/`buildTripIndexes`). El composable la consume.

### Pattern 7: Cablear `TheHero` al composable SIN tocar el DOM del #inicio (D-05)

**Qué:** `TheHero` (F3) ya monta los `pace-btn`/`light-toggle`/`resumen-toggle` con su markup verbatim SIN handlers. F4 los **cablea** consumiendo `useTripModes` — añade `@click`, `:class`/`:aria-pressed` reactivos, **sin reestructurar el DOM**.

```vue
<!-- delta en TheHero.vue: añadir al <script setup> -->
const { pace, light, resumen } = useTripModes()
```
```html
<!-- pace-btn: añadir :class y @click (el markup/estructura NO cambia) -->
<button class="pace-btn" :class="{ active: pace === 'optimistic' }"
        data-pace="optimistic" @click="pace = 'optimistic'">…</button>
<button class="pace-btn" :class="{ active: pace === 'neutral' }"
        data-pace="neutral" @click="pace = 'neutral'">…</button>
<button class="pace-btn" :class="{ active: pace === 'slow' }"
        data-pace="slow" @click="pace = 'slow'">…</button>

<!-- light-toggle: aria-pressed reactivo + @click toggle (NO revertir pace al desactivar — lo hace el watch) -->
<button id="light-toggle" class="light-toggle" :aria-pressed="light" @click="light = !light">…</button>

<!-- resumen-toggle -->
<button id="resumen-toggle" class="resumen-toggle" :aria-pressed="resumen" @click="resumen = !resumen">…</button>
```
> **NO tocar:** la estructura del `#inicio` (search-wrap, pace-wrap, light-wrap), el orden de los botones, las clases base, ni el `pace-btn active` estático del primer botón (queda como default pre-renderizado — el `:class` reactivo lo confirma en `optimistic`). El `search-input` lo cablea F6. **El binding `:class="{ active: ... }"` sobre un botón que YA tiene `class="pace-btn active"` en el markup F3:** quitar el `active` literal del primer botón y dejar SOLO el binding (si no, Vue mergea y siempre estaría active). El planner debe cambiar `class="pace-btn active"` → `class="pace-btn" :class="{ active: pace==='optimistic' }"` en el primer botón.

### Anti-Patterns to Avoid
- **`<style scoped>` en cualquier componente de F4:** el CSS editorial es global y usa selectores que cruzan componentes (`.card-section p:first-of-type::first-letter`, `.detail-list li::before`, `body.modo-resumen .cards-list`, `.tl-item[data-pace]`). `scoped` añade `data-v-*` que cambia la especificidad y **rompe estos selectores en silencio**. Reproducir markup con las clases existentes; **CERO CSS nuevo**. (PITFALLS proyecto §4; precedente F3.)
- **Raspar/manipular el DOM para los modos:** `document.querySelectorAll('.tl-item').forEach(el => el.classList.toggle('tl-hidden'))` es el anti-patrón del index.html (cf. CLAUDE.md §What NOT to Use). En Vue, `.tl-hidden` se aplica con binding `:class` reactivo desde el componente que posee la fila. Funciones globales (`setPace`/`toggleLightMode`) → un composable reactivo.
- **Leer `localStorage` en `<script setup>` síncrono:** corre en prerender → `ReferenceError`/mismatch. SIEMPRE en `onMounted` (Pitfall 3 del proyecto).
- **`unwrap` indiscriminado en `sections[].body`:** quitaría los `<p>` y mataría el dropcap (Pitfall 2). Las secciones de ficha van CON `<p>`.
- **Reordenar `day.cards` o los grupos de gastro "para que se vea mejor":** el orden ES dato (paridad + ruta del día F6). Preservar literal.
- **Un `<NuxtLink>` a `/trips/*`:** lo prerenderizaría (rompe D-01 de F3). Toda navegación interna sigue siendo `#fragmento`. (Heredado F3.)

## Don't Hand-Roll

| Problema | No construir | Usar en su lugar | Por qué |
|----------|--------------|------------------|---------|
| Render de Markdown-inline (negritas/cursivas/enlaces) de la prosa | un micro-parser propio de `_x_`/`**x**`/`[t](#id)` | `<MDC :value="body" />` | Ya incluido (vía @nuxtjs/mdc), reproduce `<em>`/`<strong>`/`<a>` y resuelve `:detail-photo`. `[VERIFIED: node_modules @nuxtjs/mdc]` |
| Componente custom dentro de Markdown (`:detail-photo`) | concatenar HTML / `v-html` con la foto | componente Vue `DetailPhoto.global.vue` resuelto por MDC | MDC llama `resolveComponent('DetailPhoto')`; un componente global es el mecanismo soportado. `[CITED: content.nuxt.com/docs/files/markdown]` |
| Estado compartido de pace/light/resumen entre TheHero y Timeline | variables globales / event bus | `useTripModes()` sobre `useState` | SSR-safe, compartido por clave, reactivo. `[CITED: ARCHITECTURE.md]` |
| Clase en `<body>` (light-mode/modo-resumen) | `document.body.classList` en un watcher | `useHead({ bodyAttrs: { class } })` | SSR-safe; Nuxt gestiona el `<body>` sin tocar el DOM. `[CITED: nuxt.com useHead]` |
| Quitar el `<p>` envolvente de MDC en casos inline | post-procesar el HTML | prop `unwrap="p"` de `<MDC>` | Soportado nativamente (`flatUnwrap`). `[VERIFIED: MDCRenderer.vue]` |
| Resolver `day.cards[]`/`timeline.ref` a entidades | buscar en arrays con `.find` por render | `useTrip().monById`/`foodById` (Maps O(1), F3) | Ya construidos por `useTrip`; O(1). `[CITED: app/composables/useTrip.ts]` |

**Insight clave:** Casi todo F4 es **markup verbatim + binding declarativo + `<MDC>`**. La única "lógica" nueva es la matriz `isVisible` (3 líneas) y el agrupado de gastro (un `Map`). Todo lo demás ya existe (datos tipados, CSS, MDC, índices).

## Runtime State Inventory

> F4 es una fase de **construcción de componentes + estado reactivo cliente**, no un rename/migración. Crea ficheros nuevos (componentes/composable) y **modifica** `TheHero.vue` (cablear controles) y `TripView.vue` (enchufar render en las 11 secciones). No renombra datos almacenados, config de servicio, estado de SO ni secretos. Registrado por completitud:

| Categoría | Items encontrados | Acción requerida |
|-----------|-------------------|------------------|
| Stored data | **Ninguno renombrado** — `localStorage['roma-pace'|'roma-light'|'roma-resumen']` se *consume* (lee/escribe) con las claves EXACTAS ya existentes; F4 no migra ni renombra ninguna clave. `roma-note-<slug>` NO se toca en F4 (solo el shell del textarea; persistencia = F7). | Ninguna |
| Live service config | Ninguno — sin servicio externo. | Ninguna |
| OS-registered state | Ninguno. | Ninguna |
| Secrets/env vars | `NUXT_APP_BASE_URL=/guiaRoma/` (build, sin cambios). Sin env var nueva. | Ninguna |
| Build artifacts | El dump SQLite de Content se regenera en cada build; `nuxt generate` re-prerenderiza `/` con el nuevo contenido. Los componentes nuevos entran en el bundle `_nuxt/`. **`DetailPhoto.global.vue` crea un chunk async** (efecto de `global:true`) — verificar que el build no rompe y que el componente se resuelve en el HTML generado. | Verificar con `pnpm generate` + spec DOM |

**Nada requiere migración de datos.** La única "modificación" de fuentes es editar `TheHero.vue`/`TripView.vue` (ediciones de código, no estado runtime).

## Common Pitfalls

### Pitfall 1: Las listas de la prosa pierden la clase `.detail-list` (riesgo de paridad de UI-02 / SC#1)
**Qué va mal:** el original tiene `<ul class="detail-list">` con bullets ✦ y bordes (`.detail-list li::before { content:"✦" }`, base.css:799-818). En los datos migrados (F2), la lista "En qué fijarse" se escribió como **lista Markdown nativa** (`- item`) dentro del `body`. `<MDC>` la renderiza como `<ul><li>` vía `ProseUl`/`ProseLi` — **SIN la clase `detail-list`** → los ✦ y bordes NO se aplican, la lista se ve con bullets por defecto del navegador → **divergencia visual**.
**Por qué pasa:** MDC mapea `ul`→`ProseUl` (un `<ul>` desnudo); no hay forma de poner una clase en una lista Markdown nativa sin sintaxis extra.
**Cómo evitarlo (opciones — el planner DEBE elegir y verificar contra el golden):**
1. **`ProseUl.global.vue` / `ProseLi.global.vue` propios** que rendericen `<ul class="detail-list">` — pero eso aplicaría `detail-list` a TODAS las listas de la prosa (puede ser deseable: las únicas listas en la prosa de fichas SON las "En qué fijarse"). Verificar que no hay otras listas que deban verse distinto.
2. **Cambiar el dato a un componente de bloque** `::detail-list` (block component con slot) y crear `DetailList.global.vue` que envuelva `<ul class="detail-list"><slot/></ul>`. Esto toca los 37 YAML (vuelve a tocar datos de F2) — más invasivo.
3. **Una regla CSS que mapee `.card-section ul` → estilo `.detail-list`** — pero eso es **CSS nuevo** (prohibido por la decisión de cero CSS). Descartado salvo que se considere "ajuste de paridad" y se apruebe explícitamente.
**Recomendación:** opción 1 (`ProseUl.global.vue`+`ProseLi.global.vue` que reproduzcan `.detail-list`), porque (a) cero cambio de datos, (b) las listas de la prosa de ficha son siempre "detail-list" en el original. **Verificar con un grep que ninguna otra prosa (practica, artist) use listas que deban verse distinto.**
**Señales de alarma:** la lista "En qué fijarse" sale con `•` en vez de `✦`; sin la línea divisoria entre items; el visual-diff de `#galleria-sciarra` mostraría la lista distinta.

> **NOTA:** el componente `:detail-photo` (single-colon, inline) SÍ está bien resuelto por `DetailPhoto.global.vue` (Pattern 1) — ese no es el problema. El problema es solo las **listas** (`detail-list`).

### Pitfall 2: El dropcap se pierde o se duplica si la prosa no son `<p>` reales en el orden correcto
**Qué va mal:** el original da un **dropcap** (capital decorada) al primer párrafo de la PRIMERA sección de cada ficha: `.card-section p:first-of-type::first-letter`. Las secciones siguientes llevan `.no-dropcap` que lo anula (base.css:784-797). Si F4 (a) usa `unwrap` en `sections[].body` (no habría `<p>` → sin dropcap), o (b) no aplica `no-dropcap` a las secciones 2..n (dropcap en TODAS → divergencia), la paridad se rompe.
**Por qué pasa:** el dropcap depende de la estructura `.card-section > p:first-of-type` y de la clase `no-dropcap` por sección.
**Cómo evitarlo:** (1) render de `sections[].body` con `<MDC>` **SIN unwrap** (Pattern 3) para que cada párrafo sea `<p>`; (2) aplicar `:class="{ 'no-dropcap': i !== 0 }"` al `.card-section` (la primera sección lleva dropcap; el resto no) — verificado contra index.html (galleria-sciarra: "Qué es" = `card-section`; "Historia"/"Anécdotas"/"En qué fijarse" = `card-section no-dropcap`).
**Señales de alarma:** la "Q" de "Qué es" sin la capital decorada; o las secciones Historia/Anécdotas CON dropcap; visual-diff de cualquier ficha desplazado en el primer carácter de cada sección.

> **Caveat MDC + dropcap:** verificar que `ProseP` emite `<p>` directo (sin wrapper extra) para que `p:first-of-type` lo seleccione. Si MDC envuelve los `<p>` en un `<div>` contenedor, `:first-of-type` seguiría funcionando (es relativo al padre `.card-section`), pero si añade un primer nodo no-`<p>` antes (p.ej. el `:detail-photo` de la sección "En qué fijarse" va ANTES de la lista), el `p:first-of-type` de esa sección no aplica (es no-dropcap de todas formas). Solo importa en la PRIMERA sección, que es prosa pura.

### Pitfall 3: Mismatch de hidratación / micro-flash mal reproducido en los modos
**Qué va mal:** si el estado de los modos se inicializa leyendo `localStorage` en setup síncrono, (a) `nuxt generate` peta o (b) el HTML de cliente difiere del prerenderizado → mismatch. Si se "arregla" el micro-flash con un script inline (como el tema), **diverge** del comportamiento actual (SC#4 pide PRESERVAR el flash de 1 frame).
**Por qué pasa:** el prerender no conoce localStorage; el original aplica el estado guardado en `init()` post-paint (de ahí el flash intencional).
**Cómo evitarlo:** default = HTML prerenderizado (`optimistic`/false/false); restaurar en `onMounted` (1 frame post-paint = el micro-flash que pide SC#4). NO añadir script inline para pace/light/resumen (solo el tema lo justifica, y ya lo cubre color-mode en F3).
**Señales de alarma:** consola con `Hydration ... mismatch` sobre `.pace-btn.active`/`body.class`/`.tl-hidden`; el estado guardado NO se restaura; o no hay flash al recargar con `roma-pace=slow` (significa que se aplicó en SSR — divergencia).

> **NOTA D2 (heredada F3):** la build estática emite UN error de consola esperado — *"Hydration completed but contains mismatches."* — propio del SSG de color-mode. Los specs de F4 deben tolerarlo EXPLÍCITAMENTE (igual que `shell.spec`/`theme.spec`) y fallar ante cualquier OTRO. Si F4 introduce un mismatch nuevo (p.ej. por `body.class` en SSR), aparecería como error adicional → el spec lo atraparía.

### Pitfall 4: La matriz de ritmo "simplificada" o aplicada a las filas equivocadas
**Qué va mal:** la matriz es **contraintuitiva**: `slow-only` solo visible en optimista; `medium` oculto solo en slow. Es fácil "corregirla" (p.ej. hacer que `slow-only` sea visible en slow) o aplicar el filtro a `tl-food`/`tl-meta`/`tl-resv-meta` (que NO se filtran por ritmo, aunque `food` lleve `pace` en el esquema).
**Cómo evitarlo:** copiar `isVisible` literal (Pattern 6) y aplicarla SOLO en `TimelineStop`/`TimelineTransport`. `TimelineMeta`/`TimelineFood`/`TimelineReservation` nunca consultan `isVisible`. (index.html:6521 filtra exactamente `.tl-item[data-pace], .tl-transport[data-pace]`.)
**Señales de alarma:** en modo "Pesimista" siguen visibles paradas `medium`; en "Neutra" desaparecen `medium`; un `tl-food`/`tl-meta` se oculta al bajar el ritmo.

### Pitfall 5: "Caminar menos" revierte el ritmo al desactivar (debe NO revertir)
**Qué va mal:** `setLightMode` al ACTIVAR fuerza `pace='slow'`; al DESACTIVAR **no** revierte (el ritmo se queda en slow). Un `watch` mal escrito (`watch(light, on => pace.value = on ? 'slow' : 'optimistic')`) revertiría → divergencia.
**Cómo evitarlo:** `watch(light, on => { if (on) pace.value = 'slow' })` — solo actúa en `on === true`. (index.html:6552: `if (on) setPace('slow')`, sin else.)
**Señales de alarma:** activar y desactivar caminar-menos deja el ritmo en optimista (debería quedarse en pesimista).

### Pitfall 6: El orden de los grupos de gastronomía / el orden de fichas no coincide con el golden
**Qué va mal:** el agrupado por `food.group` con un `Map` preserva el orden de `queryCollection('food').all()`, que puede NO ser el orden del DOM original (gastro-section-title en cierto orden). Igual para `day.cards` si se reordena por accidente.
**Cómo evitarlo:** `day.cards` se renderiza en el orden EXACTO del array (Pattern 5) — nunca ordenar. Para los grupos de gastro, **verificar** que el orden de `food` coincide con el del index.html; si no, ordenar por un criterio explícito (no "a ojo"). El golden de `#gastronomia` (ya capturado) es el oráculo.
**Señales de alarma:** los grupos de gastronomía salen en otro orden; las fichas de un día en otro orden; visual-diff de `#gastronomia`/`#viernes` desplazado en bloques.

## Code Examples

### Resolución verificada de componente custom en MDC
```js
// Source: node_modules/.pnpm/@nuxtjs+mdc@0.22.0/.../components/MDCRenderer.vue (líneas 297-318)
const resolveComponentInstance = (component) => {
  if (typeof component === "string") {
    if (ignoreTag(component)) return component;                  // HTML tags + customElements → no resolver
    const _component = vueResolveComponent(pascalCase(component), false);  // 'detail-photo' → resolveComponent('DetailPhoto')
    // ... si es AsyncComponentWrapper / string / setup → devolver
    return _component;
  }
  return component;
};
// findMappedTag (línea 387): tags[tag] || tags[pascalCase(tag)] || tags[kebabCase(tag)] || tag
// ignoreTag (final): htmlTags.has(tag) → 'detail-photo' NO es HTML → SÍ se intenta resolver como componente
```

### Matriz `isVisible` (pura, testeable — extraíble a utils/pace.ts)
```ts
// Source: portado 1:1 de index.html:6521-6534 (setPace)
export type Pace = 'optimistic' | 'neutral' | 'slow'
export type ItemPace = 'all' | 'medium' | 'slow-only'
export function isVisible(itemPace: ItemPace, pace: Pace): boolean {
  if (pace === 'optimistic') return true
  if (pace === 'neutral') return itemPace !== 'slow-only'
  return itemPace === 'all'   // slow: oculta 'medium' Y 'slow-only'
}
```

### Inventario de markup verbatim (referencias de línea en index.html)
> El planner/implementador lee estas líneas para reproducir el markup EXACTO. Cada componente = transcripción 1:1.

| Componente / variante | index.html | Notas de markup |
|------------------------|-----------|-----------------|
| `.card` (monumento simple) | 2450-2510 | header(card-roman+card-title h3+card-italian+card-badge) · card-hero img · card-section ×n (1ª con dropcap) · facts · maps-link · sorrentino-box · notes-area |
| `.card-artists`/`.card-arch` | 2521 | `<div class="card-artists card-arch">Arquitectura: <a class="art-link" href="#arq-moderna">…</a></div>` (esquema: `monument.artists[]`/`monument.arch[]` como `Link`) |
| `.card` guiada (Vaticano) | ~2920 | igual estructura; `guided`/`concert` NO tienen CSS especial (se renderiza como card normal; el `type` solo afecta al marcador del mapa en F7) |
| `.card` concierto (Auditorium) | ~3381 | idem |
| `culture-box` | (buscar `.culture-box`) | `monument.culture[]` = `{title, text}`; ref-title + prosa |
| `.tl-item` (stop) | 2404, 2406, 2412 | `tl-time` + (`a.tl-title[href=#ref]` o `span.tl-title.disabled`) + (`tl-tag`?) + `tl-note`? |
| `.tl-item.disabled` | 2404, 2406 | `<span class="tl-title disabled">` (llegada/check-in, sin enlace) |
| `.tl-item.reserved-event` | 2432 | `<div class="tl-item reserved-event">` + `tl-tag` "reservado" |
| `.tl-item.fixed-event` | (6× en doc) | variante de evento fijo — buscar el primer `fixed-event` para el markup |
| `.tl-transport.taxi` | 2405 | header + `tl-transport-modes` (modes con `recommended`?, icon, desc+tag, meta) + footnote |
| `.tl-transport.walk` | 2411 | idem variante walk |
| `.tl-transport.train` | (1×) | idem |
| `.tl-transport.metro` / `.metro-b` | (2× / 1×) | idem; variantes de clase |
| `.tl-meta` | 2407, 2410, 2413 | `tl-meta-item` con `.ok`/`.warn`/(plain); puede llevar 1 o 2 items (uno de tiempo, otro "🚶 hasta siguiente") |
| `.tl-food` | 2420-2426, 2434-2444 | `tl-food-header` + `tl-food-list`(`tl-food-item` con `.reserved`?, `a.tl-food-name`, `tl-resv-badge`/`tl-food-time`, `tl-food-desc`) + `tl-food-foot` |
| `.tl-resv-meta` | 2433 | banda verde `<div class="tl-resv-meta">✅ <strong>…</strong> — …</div>` |
| `.day-stats` | 2387-2391 | `day-stats-item` por variant walk/train/taxi/metro/ticket |
| `.dia-ligera` | 2393-2401 | head + `<ul>` con `li.lg-see`/`lg-move`/`lg-skip`/`lg-care`/`lg-rest` |
| `.light-banner` | 2377 | banner verde (CSS-hidden salvo body.light-mode); texto fijo |
| `#reservas` | 5260-5333 | section-eyebrow + h2.section-title + p.gastro-intro + reservas-box(reservas-confirmadas h4+ul×2 · reservas-box-header · reservas-table) |
| `.reservas-table` rows + badges | 5286-5329 | `tr`(+`.is-done`?) > `td`(a + `reservas-badge.badge-urgent`/`.badge-done`/`.badge-rec`) + `td`(desc) |
| `#gastronomia` | 5335-5377+ | section-eyebrow + h2 + gastro-intro + por grupo: `p.gastro-section-title` + `.gastro-grid` > `.gastro-card` |
| `.gastro-card` | 5346-5360 | header(`gastro-card-badge.badge-*` + name + address) + `p.gastro-card-desc` + `.gastro-plato` + footer(span + `gastro-maps-link`; `gastro-itinerary-tag`?) |
| `#arte` | ~5941 | section-eyebrow + intro + `.artist-card` (art-*) |
| `#arquitectura` | ~6104 | section-eyebrow + intro + `.artist-card` (arq-*) + `.arq-glosario` (~6202) |
| `.arq-glosario` | ~6202 | `arch-term` ×10: `<b>término</b><span>def</span>` (esquema `ArtistSchema` kind='glossary' `terms[]`) |

> **El planner DEBE leer cada rango antes de implementar el componente correspondiente.** El esquema `shared/schemas.ts` mapea estos campos 1:1; los datos YA están migrados (verificado: galleria-sciarra.yml usa `:detail-photo{...}` + listas Markdown en `sections[].body`).

## State of the Art

| Antiguo (`index.html`) | Actual (Nuxt 4 / F4) | Por qué |
|------------------------|----------------------|---------|
| Prosa como HTML escrito a mano | `sections[].body` Markdown-inline → `<MDC>` | Datos editables en PR; `<MDC>` reproduce `<em>`/`<strong>`/`<a>` + `:detail-photo` |
| `setPace`/`setLightMode`/`setResumen` globales + `classList.toggle` por `querySelectorAll` | `useTripModes()` reactivo + binding `:class`/`bodyAttrs` | Idiomático Vue, testeable, sin raspar DOM |
| Estado de modos restaurado en `init()` post-DOM | `onMounted` (default = prerender; restaura post-paint) | Mismo micro-flash (SC#4), cero mismatch en SSG |
| `<ul class="detail-list">` literal | lista Markdown nativa en el dato → ProseUl (⚠ necesita override para la clase) | Datos legibles; pero requiere `ProseUl.global` para conservar `.detail-list` (Pitfall 1) |

**Deprecado/a evitar:** importar `z` desde `@nuxt/content` (deprecado; el proyecto usa `zod`). Sin deprecaciones nuevas específicas de F4.

## Assumptions Log

| # | Claim | Sección | Riesgo si es erróneo |
|---|-------|---------|----------------------|
| A1 | `<MDC>` resuelve `:detail-photo` vía `resolveComponent('DetailPhoto')` contra el registro GLOBAL; un `DetailPhoto.global.vue` lo satisface. | Pattern 1 | **VERIFICADO desde el código fuente de @nuxtjs/mdc + docs + issues.** Riesgo bajo. Si el sufijo `.global.vue` no bastara (poco probable), la fallback es la config `components:[{global:true}]` en nuxt.config.ts. El spec DOM (verificar `.detail-photo > img` real) lo atrapa. |
| A2 | Las listas de "En qué fijarse" en TODOS los 37 monumentos están como **listas Markdown nativas** (no como `::detail-list`). Verificado en galleria-sciarra; inferido para el resto por el patrón de migración F2. | Pitfall 1 | Si algunos usan otra sintaxis, el override de ProseUl podría no aplicar uniformemente. **El planner debe grep `content/trips/roma/monuments/*.yml` por la forma de las listas antes de elegir la solución de Pitfall 1.** |
| A3 | El orden de `queryCollection('food').all()` (sin `.order`) coincide con el orden del DOM de `#gastronomia`. | Pattern 5 / Pitfall 6 | Si no coincide, los grupos salen en otro orden. **Verificar contra el golden de `#gastronomia`** y, si difiere, ordenar explícitamente. Riesgo medio. |
| A4 | `encodeURIComponent(mapsQuery)` reproduce el escaping EXACTO de los `href` de `maps-link`/`gastro-maps-link` del original. | Pattern 2 | Si el original usó un escaping distinto (p.ej. `+` en vez de `%20`, o no escapó algún carácter), el `href` divergiría (paridad de atributo). Bajo impacto visual; verificar en fichas con apóstrofo (Sant'Eustachio). |
| A5 | `<component :is="'TimelineStop'">` resuelve por nombre de string para componentes auto-importados de F4. | Pattern 4 | Patrón estándar Nuxt (ARCHITECTURE.md §Pattern 4). Si fallara, usar el componente importado directamente en el mapa (`{ stop: TimelineStop }` con import). Riesgo bajo. |
| A6 | Las captions de `:detail-photo` que llevan markup se renderizan con `<MDC unwrap="p">`; las de texto plano con `{{ caption }}`. | Pattern 1 | Si una caption mezcla, `<MDC unwrap="p">` es seguro para todas. Riesgo bajo. |

**Nota:** la pregunta de mayor prioridad (registro MDC, A1) está **verificada desde fuente**, no asumida — por eso su riesgo es bajo. Los assumptions restantes son detalles de paridad que los specs DOM + golden atrapan.

## Open Questions

1. **`.detail-list` en listas Markdown nativas (LA decisión de implementación clave de las fichas).**
   - Qué sabemos: los datos usan listas Markdown nativas; MDC las renderiza como `<ul>` sin la clase `detail-list`; el CSS `.detail-list` da los ✦ + bordes.
   - Qué falta: confirmar (grep) que todas las listas de prosa de ficha deben ser `.detail-list`, y elegir entre `ProseUl.global.vue` override (recomendado) vs cambiar datos a `::detail-list` block.
   - Recomendación: `ProseUl.global.vue` + `ProseLi.global.vue` que reproduzcan el markup `.detail-list` (cero cambio de datos). Verificar contra el golden de `#galleria-sciarra` + grep de practica/artist por listas que deban verse distinto.

2. **Orden de los grupos de gastronomía.**
   - Qué sabemos: el agrupado por `Map` preserva el orden de `food.all()`.
   - Qué falta: confirmar que ese orden = orden del DOM del index.html.
   - Recomendación: verificar contra el golden de `#gastronomia`; si difiere, introducir un orden explícito (no "a ojo"). Es un cuadre de datos, no de lógica.

3. **Caption de `:detail-photo` — texto plano vs MDC.**
   - Qué sabemos: galleria-sciarra es texto plano; otras pueden llevar markup.
   - Recomendación: usar `<MDC :value="caption" unwrap="p" />` en `DetailPhoto.global.vue` (seguro para cualquiera); o `{{ caption }}` si el grep confirma que todas son texto plano (un `<MDC>` menos). No bloqueante.

## Environment Availability

| Dependencia | Requerida por | Disponible | Versión | Fallback |
|-------------|---------------|-----------|---------|----------|
| Node + pnpm | build/dev/test | ✓ | pnpm 10.32.1 | — |
| nuxt | dev/generate + auto-import | ✓ | 4.4.8 | — |
| @nuxt/content (+ @nuxtjs/mdc) | `<MDC>` + datos | ✓ | 3.14.0 (mdc 0.22.0) | — |
| @playwright/test | specs DOM (D-06) + E2E modos (D-07) | ✓ | 1.61.0 | — |
| vitest | unit puro (isVisible/agrupado) | ✓ | 4.1.9 | — |
| better-sqlite3 | conector Content build-time | ✓ | ^12.11.1 | — |

**Dependencias faltantes sin fallback:** ninguna.
**Dependencias faltantes con fallback:** ninguna — F4 no necesita instalar nada. (VueUse `useStorage` NO se instala; el patrón `onMounted`+`watch` manual cubre la persistencia sin dependencia nueva.)

## Validation Architecture

> Nyquist validation está ENABLED (`workflow.nyquist_validation: true`). Esta sección hace cada criterio de éxito testeable. El workflow aguas abajo busca el encabezado `## Validation Architecture`.

### Test Framework
| Propiedad | Valor |
|-----------|-------|
| Framework (unit) | **Vitest 4.1.9** (instalado) — Node-puro para `isVisible` + agrupado de food |
| Framework (paridad/E2E) | **@playwright/test 1.61.0** (instalado) — aserciones DOM/texto/estructura + comportamiento de modos |
| Config (unit) | `vitest.config.ts` — ya incluye `tests/unit/**/*.spec.ts` (F3 lo extendió); **sin cambios** |
| Config (paridad) | `playwright.config.ts` (existe; F1). Los specs de F4 son **autocontenidos** (build+serve propio), NO usan el webServer (que sirve el index.html VIVO para el golden) |
| Quick run command | `pnpm test:unit` (unit) |
| Full suite command | `pnpm test:data && pnpm test:unit && pnpm test:golden` (+ `pnpm typecheck && pnpm lint`) |

### Phase Requirements → Test Map
| Req / SC | Comportamiento | Tipo | Comando automatizado | ¿Existe? |
|----------|----------------|------|----------------------|----------|
| **SC#1 / UI-02** | `:detail-photo{...}` resuelve a un `.detail-photo > img` real (NO `<p>:detail-photo{...}</p>` sin renderizar); la prosa MDC no añade `<p>` extra donde no toca; dropcap en 1ª sección | E2E DOM (autocontenido) | `pnpm test:golden` (nuevo `tests/parity/render-cards.spec.ts`) | ❌ Wave 0 |
| **SC#1 / UI-02** | `.detail-list` (✦ + bordes) presente en las listas de prosa de ficha | E2E DOM | idem | ❌ Wave 0 |
| **SC#2 / UI-03** | timeline despacha por `kind`: cada `.tl-item`/`.tl-transport`/`.tl-meta`/`.tl-food`/`.tl-resv-meta` presente con su markup; orden = data | E2E DOM | `tests/parity/render-timeline.spec.ts` | ❌ Wave 0 |
| **SC#3 / UI-04** | secciones de referencia (reservas-table con badges, gastro-cards agrupadas, artist-cards, arq-glosario) renderizadas desde datos | E2E DOM | `tests/parity/render-reference.spec.ts` | ❌ Wave 0 |
| **SC#4 / FEAT-06** | matriz de ritmo EXACTA: optimista→todo; neutra→oculta slow-only; pesimista→oculta slow-only+medium; SOLO tl-item/tl-transport se filtran | unit (puro) + E2E | `pnpm test:unit` (isVisible) + `tests/parity/modes.spec.ts` | ❌ Wave 0 |
| **SC#4 / FEAT-07** | caminar-menos: `body.light-mode` + fuerza pace='slow' + muestra `.dia-ligera`/`.light-banner`; al desactivar NO revierte pace; `aria-pressed` | E2E | `tests/parity/modes.spec.ts` | ❌ Wave 0 |
| **SC#4 / FEAT-08** | resumen: `body.modo-resumen` oculta day-stats/day-subtitle/dia-ligera/tl-meta/tl-transport/cards-list; mantiene tl-item/tl-food/tl-resv-meta; `aria-pressed` | E2E | `tests/parity/modes.spec.ts` | ❌ Wave 0 |
| **SC#4 (persistencia)** | recarga con `roma-pace=slow`/`roma-light=1`/`roma-resumen=1` → estado restaurado | E2E | `tests/parity/modes.spec.ts` | ❌ Wave 0 |
| **SC#4 (micro-flash)** | con `roma-pace=slow` preseteado, el primer paint es optimista (default) y cambia a slow 1 frame después (flash intencional) | E2E | `tests/parity/modes.spec.ts` (observar transición, mirror de theme.spec) | ❌ Wave 0 |

### Sampling Rate
- **Por commit de tarea:** `pnpm test:unit` (isVisible/agrupado puros) + `pnpm lint` + `pnpm typecheck` — todo < 30s.
- **Por merge de wave:** `pnpm test:data && pnpm test:unit` + un `pnpm test:golden -g "render|modes"` dirigido.
- **Phase gate:** suite completa verde (data + unit + los specs DOM autocontenidos de render + modos) ANTES de `/gsd:verify-work`. **NO** rebaselinar el golden (D-08).

### Cómo se prueban los criterios concretamente (sin rebaselinar golden)
1. **Render (D-06):** spec **autocontenido** (mirror de `shell.spec.ts`/`theme.spec.ts`): `pnpm generate` una vez → copiar `.output/public` a `<tmp>/guiaRoma/` → servir → aserciones DOM/texto. Ejemplos: `expect(page.locator('#galleria-sciarra .detail-photo img')).toBeVisible()`; `expect(page.locator('#galleria-sciarra .detail-list li')).toHaveCount(5)`; `expect(page.locator('#viernes .timeline .tl-item')).toHaveCount(...)`; `expect(page.locator('#viernes .tl-item.reserved-event')).toBeVisible()`. **Tolerar el único error de hidratación de color-mode** (D2), fallar ante otros.
2. **Modos (D-07):** spec autocontenido o vía `pnpm dev` (como el bloque routing de `shell.spec`): click en `pace-btn[data-pace=slow]` → `expect(.tl-item[data-pace=slow-only])` y `[data-pace=medium]` con `display:none` (clase `.tl-hidden`); `expect(.tl-item[data-pace=all])` visible; `expect(.tl-food)`/`.tl-meta` SIEMPRE visibles. Click light-toggle → `body.light-mode`, `pace` pasa a slow, `.dia-ligera` visible, `aria-pressed=true`; click otra vez → `body` sin `light-mode` pero `pace` SIGUE slow. Resumen → `body.modo-resumen`, set de ocultos correcto. Persistencia: `addInitScript(localStorage.setItem('roma-pace','slow'))` → recarga → estado slow.
3. **Unit (matriz pura):** `isVisible('slow-only','neutral') === false`, `isVisible('medium','slow') === false`, `isVisible('all','slow') === true`, etc. — los 9 casos (3 paces × 3 itemPaces).

### Wave 0 Gaps
- [ ] `tests/unit/pace.spec.ts` — los 9 casos de `isVisible` (matriz exacta). **Vitest puro, sin dep nueva.** (requiere extraer `isVisible` a `app/utils/pace.ts`.)
- [ ] `tests/unit/foodGroups.spec.ts` *(opcional)* — el agrupado por `group` preserva orden de primera aparición. (requiere extraer el agrupado a un util puro.)
- [ ] `tests/parity/render-cards.spec.ts` — DOM de MonumentCard: detail-photo resuelto, detail-list con clase, dropcap, facts, maps-link, sorrentino, notes-area shell. **Playwright autocontenido.**
- [ ] `tests/parity/render-timeline.spec.ts` — los 5 kinds + variantes, orden, en un día representativo (viernes tiene stop/transport/meta/food/reservation + reserved-event).
- [ ] `tests/parity/render-reference.spec.ts` — reservas-table+badges+is-done, gastro-cards agrupadas, artist-cards, arq-glosario.
- [ ] `tests/parity/modes.spec.ts` — matriz de ritmo E2E + light (fuerza slow, no revierte) + resumen (set de ocultos) + persistencia + micro-flash.

*(Los specs de F4 NO tocan `golden.spec.ts` ni sus snapshots — D-08. La paridad pixel total contra el golden de F1 es F8, tras el fallback de imagen de F7.)*

## Security Domain

> `security_enforcement` no está en `.planning/config.json` → tratado como no explícitamente habilitado. F4 es estático, sin backend, sin auth, sin input de usuario (las notas son un `<textarea>` shell sin persistencia ni render). Superficie mínima. Registrado por completitud.

### Applicable ASVS Categories
| ASVS | Aplica | Control estándar |
|------|--------|------------------|
| V2 Authentication | no | Sin auth en 1.0 |
| V3 Session Management | no | Sin sesiones |
| V4 Access Control | no | Sitio estático público |
| V5 Input Validation | mínimo | Sin formularios funcionales en F4; el `<textarea>` de notas es shell (sin lectura/persistencia hasta F7) |
| V6 Cryptography | no | Sin secretos en F4 |

### Known Threat Patterns for {Nuxt SSG + MDC}
| Patrón | STRIDE | Mitigación estándar |
|--------|--------|---------------------|
| `<MDC>` sobre contenido no confiable (XSS) | Tampering/Elevation | F4 renderiza SOLO prosa **versionada en el repo** (confianza), nunca input de usuario. Documentado en PITFALLS proyecto §7. Reevaluar solo si v2 añade contenido de terceros. |
| `target="_blank"` sin `rel="noopener"` (tabnabbing) | — | Conservar `target="_blank" rel="noopener"` VERBATIM en `maps-link`/`gastro-maps-link`/`tl-food-name` (como el original). |
| Notas de usuario renderizadas con `v-html` | Tampering | F4 NO renderiza las notas (solo el shell del `<textarea>`). En F7 las notas van en `<textarea v-model>` (texto plano), NUNCA `v-html`. |

## Sources

### Primary (HIGH — verificado desde fuente instalada / repo)
- `node_modules/.pnpm/@nuxtjs+mdc@0.22.0_magicast@0.5.3/.../components/MDCRenderer.vue` — `resolveComponentInstance` = `resolveComponent(pascalCase(tag), false)`; `findMappedTag`; `ignoreTag` (HTML tags). **Mecánica de resolución de `:detail-photo` (Pattern 1).**
- `node_modules/.pnpm/@nuxtjs+mdc@0.22.0/.../components/MDC.vue` — props `value`/`tag`/`unwrap`(Boolean|String,default false)/`components`/`data`; delega a MDCRenderer.
- `index.html` (raíz) — fuente de paridad: card 2450-2510, timeline 2403-2446 (5 kinds + variantes), reservas 5260-5333, gastronomía 5335+, modos JS 6505-6577, init 6648-6660.
- `app/assets/css/leaflet.css` — `.tl-hidden` 731, `body.light-mode`/`body.modo-resumen` 760-798, `.light-banner` 801-809, `.dia-ligera` 812-833.
- `app/assets/css/base.css` — `.card-section`/dropcap 772-797, `.detail-list` 799-818, `.detail-photo` 820-844.
- `shared/schemas.ts` — el contrato del render (MonumentSchema, TimelineRow discriminado, FoodSchema, ArtistSchema, ReferenceSchema, TripSchema).
- `app/composables/useTrip.ts` — `monById`/`foodById`/`artById`/`refById` (índices O(1)) + `days`/`monuments`/`food`/`artists`/`reference` refs.
- `app/components/TheHero.vue` — controles ya montados (pace-btn/light-toggle/resumen-toggle) + patrón `<MDC unwrap="p">` ya establecido.
- `app/components/TripView.vue` — las 11 `<section>` vacías que F4 rellena.
- `content/trips/roma/monuments/galleria-sciarra.yml` — **prueba de que los datos YA usan `:detail-photo{...}` (MDC inline) + listas Markdown nativas en `sections[].body`.**
- `tests/parity/{shell,theme,golden}.spec.ts` + `playwright.config.ts` + `vitest.config.ts` — infraestructura de test (specs autocontenidos, golden ya capturado, tolerancia D2).

### Secondary (HIGH-MEDIUM — docs oficiales / issues, actuales)
- content.nuxt.com/docs/files/markdown — sintaxis MDC `::block`/`:inline{props}`; "components used in Markdown have to be marked as global if you don't use components/content/"; kebab↔PascalCase.
- nuxt.com/docs/4.x/guide/directory-structure/app/components — sufijo `.global.vue` y `components:[{global:true}]` para registro global.
- github.com/nuxt/content#2931, #2256 — Content v3 ya NO auto-registra `components/content/` como global (cambio vs v2); para `<MDC>` hay que marcar global.

### Project research (HIGH — ya verificado por el equipo)
- `.planning/research/{STACK,FEATURES,PITFALLS,ARCHITECTURE,SUMMARY}.md` — stack/versiones, features 6/7/8 (modos triviales), pitfalls MDC/`<p>`/hidratación, `useTripModes`/`<component :is>`/`isVisible`.
- `.planning/phases/03-*/03-RESEARCH.md` + `03-CONTEXT.md` — patrón "un componente por concern, markup verbatim, cero CSS, sin scoped"; `<MDC unwrap="p">` para inline; specs autocontenidos; tolerancia del error de hidratación de color-mode (D2).
- `.planning/STATE.md` — decisiones F2/F3 (slug como ancla, secciones vacías, groupIntro opcional, artist unificado por kind).

## Metadata

**Confidence breakdown:**
- Registro de componentes MDC (Pattern 1, LA pregunta clave): **HIGH** — verificado desde el código fuente de @nuxtjs/mdc + docs oficiales + issues; no asumido.
- `unwrap` por campo (Pattern 3): **HIGH** — prop verificado en MDC.vue; la regla por campo se ancla en el patrón ya establecido por TheHero (F3) + lectura del index.html.
- Modos (Pattern 6/7): **HIGH** — lógica portada 1:1 del index.html (líneas leídas); patrón `useState`/`bodyAttrs` de ARCHITECTURE.md.
- Inyección/agrupado (Pattern 4/5): **HIGH** en el mecanismo; **MEDIUM** en el orden de grupos de gastro (A3, a verificar contra golden).
- Pitfalls de paridad CSS (1 `.detail-list`, 2 dropcap): **HIGH** — verificados leyendo el CSS + el dato migrado; son los dos puntos de riesgo real que el planner debe resolver.

**Research date:** 2026-06-20
**Valid until:** ~2026-07-20 (estable; versiones fijadas, contrato locked). Re-verificar solo si se actualiza `@nuxt/content`/`@nuxtjs/mdc`/`nuxt`.
