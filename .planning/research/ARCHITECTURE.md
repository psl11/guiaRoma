# Architecture Research

**Domain:** App de contenido editorial *data-driven* multi-viaje en **Nuxt 4** (SSG vía `nuxt generate`, offline, paridad 1:1 con el `index.html` actual). 1.0 = solo Roma; arquitectura preparada para N viajes y para un backend Nitro **dormido**.
**Researched:** 2026-06-18
**Confidence:** HIGH — convención de directorios `app/` de Nuxt 4 verificada contra docs oficiales (`/websites/nuxt_4_x`); API de Nuxt Content v3 (`queryCollection`, `type:'data'`, forma de fichero) verificada contra docs oficiales (`/websites/content_nuxt`); modelo de datos derivado de **lectura directa** del `index.html` (timeline líneas 2403-2446, `places` 6269-6314, `buildDayRoutes` 6584-6646, navegación 6381-6429, búsqueda 6433-6469).

> Este documento construye **encima** de STACK.md (formato de contenido, versiones, módulos ya decididos) y FEATURES.md (descomposición en composables/componentes, riesgos SSR). No los contradice: los **concreta** en una estructura de carpetas, un esquema zod final, un árbol de componentes, contratos de composables, el flujo de datos y un **orden de construcción** que alimenta directamente las fases del roadmap.

---

## Hallazgos que corrigen/afinan el sketch de STACK.md (leer primero)

Tres verificaciones contra las docs oficiales cambian detalles del esquema esbozado en STACK.md. Ninguna invalida las decisiones; las hacen ejecutables.

1. **Nuxt Content v3 `type:'data'`: un fichero = un documento, y su raíz debe ser un OBJETO, no un array.** La doc de Nuxt Content es explícita: *"Each file must contain a single JSON object, not an array."* (idéntico para YAML). Por tanto `content/trips/roma/monuments.yml` **no** puede ser una lista YAML de 38 monumentos validada contra un esquema de monumento individual. Hay dos formas correctas (ver §"Cómo partir un viaje"): **(A) un fichero por entidad** (`monuments/galleria-sciarra.yml`, glob `**`), o **(B) un fichero por dominio con raíz objeto** `{ items: [...] }` y esquema `z.object({ items: z.array(Monument) })`. **Recomendación: (A) un fichero por ficha** — es el patrón nativo, da `git blame`/PR por ficha, y `queryCollection('monument').all()` devuelve el array directamente.

2. **La "ruta del día" hoy NO depende del array `places` ni del timeline: depende de los `a.maps-link` que viven dentro de las fichas (`article.card`) presentes en la `<section>` del día, en orden de aparición en el DOM** (`index.html` 6625-6645, comentario incluido en el código). Es decir: el orden de la ruta = **el orden en que las fichas-monumento están maquetadas dentro de la sección del día**, y el filtro "qué entra" = "tiene `.maps-link`" (solo monumentos; restaurantes y guiados/concierto quedan fuera). Esto es **distinto** del orden del timeline. Para reproducirlo con datos hay que declarar explícitamente, por día, **la lista ordenada de fichas que se renderizan** (que hoy es el orden del DOM) y derivar la ruta de ahí. Es el punto de paridad más sutil de toda la migración.

3. **Convención de directorios Nuxt 4 confirmada:** el `srcDir` por defecto es **`app/`**; dentro van `assets/ components/ composables/ layouts/ middleware/ pages/ plugins/ utils/ app.vue error.vue app.config.ts`. **`server/`, `shared/`, `public/`, `modules/`, `content/`, `nuxt.config.ts` viven en la RAÍZ del proyecto** (hermanos de `app/`, NO dentro). Esto fija dónde va el backend dormido (`/server/`) y el contenido (`/content/`).

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  CONTENIDO (fuente de verdad única, git-based)        /content/        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  content/trips/roma/                                             │  │
│  │    trip.yml            (metadatos: título, días, mapCenter…)     │  │
│  │    days/*.yml          (un fichero por día: timeline ORDENADO +  │  │
│  │                         lista ordenada de fichas del día)        │  │
│  │    monuments/*.yml     (1 ficha = 1 fichero)                     │  │
│  │    food/*.yml          (1 ficha gastro = 1 fichero)              │  │
│  │    artists/*.yml       (1 ficha artista = 1 fichero)             │  │
│  │    reference/*.yml      (Reservas, Práctica…)                    │  │
│  └────────────────────────────────────────────────────────────────┘  │
│       ▲ esquema zod (content.config.ts) valida en build → tipos TS    │
└───────┼────────────────────────────────────────────────────────────────┘
        │ queryCollection(...).all()  (resuelto en PRERENDER → estático)
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA DE PÁGINA            app/pages/  ·  app/layouts/                 │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  pages/index.vue   →  redirige/renderiza el trip 'roma'        │    │
│  │  pages/trips/[slug].vue  →  carga UN viaje por slug            │    │
│  │   · useTrip(slug): agrega trip+days+monuments+food+artists+ref │    │
│  │   · provide(TripKey, trip)  → árbol de componentes lo consume   │    │
│  └──────────────────────────────────────────────────────────────┘    │
└───────┬────────────────────────────────────────────────────────────────┘
        │ props (datos tipados) + provide/inject (viaje activo)
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  COMPONENTES (app/components/)        ·   COMPOSABLES (app/composables)│
│  ┌─────────┐ ┌────────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐ │
│  │ Topbar  │ │ DaySection │ │ Timeline │ │ TripMap   │ │ Reference │ │
│  │ NavPills│ │ Attraction │ │ +Item/   │ │ .client   │ │ Section   │ │
│  │ Controls│ │ Card       │ │  Transp/ │ │ (Leaflet) │ │           │ │
│  └────┬────┘ └─────┬──────┘ │  Food    │ └─────┬─────┘ └───────────┘ │
│       │            │        └────┬─────┘       │                      │
│       │  ┌─────────┴─────────────┴─────────────┴──────────┐           │
│       └──┤  useCardNavigation (TRANSVERSAL) · useTripModes ├──────────┤
│          │  useSearch · useDayRoute · useNotes · useTrip   │ useState  │
│          └─────────────────────────────────────────────────┘  (shared)│
└──────────────────────────────────────────────────────────────────────┘
        │ (DORMIDO en 1.0 — sin ficheros, sin rutas, no activa servidor)
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND NITRO (v2)        /server/  (raíz, hermano de app/)           │
│  server/api/      ← vacío en 1.0 (solo README.md). v2: auth, uploads  │
│  server/utils/    ← vacío en 1.0                                       │
└──────────────────────────────────────────────────────────────────────┘
```

**Principio rector (una sola frase):** el **contenido** (`/content/`) es la única fuente de verdad; la **página** lo agrega y lo entrega por `props`/`provide`; los **componentes** son tontos y declarativos; los **datos derivados** (índice de búsqueda, ruta del día, marcadores del mapa) se calculan en **composables puros** desde ese contenido, **nunca** raspando el DOM (el anti-patrón que domina el `index.html` actual).

### Component Responsibilities

| Componente | Responsabilidad (qué posee) | Implementación típica |
|------------|------------------------------|------------------------|
| `app.vue` | Raíz: `<NuxtLayout>` + `<NuxtPage>` | Mínimo |
| `layouts/default.vue` | Estructura común: `<Topbar>`, `<NavPills>`, `<BackButton>`, slot de página | Layout Nuxt |
| `Topbar` | Cabecera fija; contiene `Search`, `ThemeToggle` | Presentacional + `useSearch`, `useColorMode` |
| `NavPills` | Pastillas de navegación + scrollspy (resalta la sección activa) | `useCardNavigation` (scrollspy) |
| `TripControls` | Caja de controles del viaje: `PaceSelector`, `LightModeToggle`, `ResumenToggle` | Lee/escribe `useTripModes` |
| `TripHero` | Hero de inicio (título, fecha, cita, "datos del viaje", "cómo usar") | Datos de `trip.yml` |
| `TripMap.client` | **Leaflet**: marcadores `divIcon` numerados, popups, `fitBounds`, banner offline | `.client.vue` + `onMounted`; props = marcadores derivados |
| `DaySection` | Una jornada: eyebrow, cabecera, `day-stats` + botón ruta, "versión ligera", `Timeline`, lista de `AttractionCard` | Orquesta; recibe `Day` + fichas del día |
| `Timeline` | Render del array ordenado de items del día; aplica visibilidad por `pace` | `v-for` + `<component :is>` por `kind` |
| `TimelineItem` / `TimelineTransport` / `TimelineFood` / `TimelineMeta` | Cada tipo de fila del timeline (parada / traslado multimodo / bloque comida / meta-tiempos) | Presentacionales puros |
| `AttractionCard` | Ficha rica de monumento (hero+fallback, secciones de prosa MDC, facts, maps-link, sorrentino/culture, notas) | Presentacional + `useNotes`, `<MDC>` |
| `GastroCard` / `ArtistCard` | Variantes de ficha (gastronomía / artista) | Presentacionales + `<MDC>` |
| `ReferenceSection` | Secciones de referencia (Reservas, Gastronomía, Práctica, Arte, Arquitectura) | Presentacional; itera fichas/bloques |
| `ImageWithFallback` | `<img>` con `@error` → SVG por `motif`; variantes hero/detail | `ref(failed)`, registro de SVG |
| `SearchBox` | Input + dropdown de resultados | `useSearch` |
| `ThemeToggle` / `BackButton` / `PaceSelector` / `LightModeToggle` / `ResumenToggle` / `NotesField` | Controles atómicos (un control = un componente) | Enlazan a su composable |

---

## Recommended Project Structure

```
guiaroma-nuxt/                         # raíz del repo (rama de release)
├── app/                               # srcDir por defecto de Nuxt 4
│   ├── app.vue                        # <NuxtLayout><NuxtPage/></NuxtLayout>
│   ├── error.vue                      # página de error (paridad mínima)
│   ├── app.config.ts                  # config reactiva (no secretos): p.ej. defaultTrip
│   ├── assets/
│   │   └── css/
│   │       ├── tokens.css             # :root + [data-theme=dark] VERBATIM (los tokens actuales)
│   │       ├── base.css               # reset, tipografía, layout global
│   │       ├── leaflet.css            # CSS de Leaflet + filtro dark de tiles
│   │       └── components.css         # estilos globales que cruzan componentes (fase parity)
│   ├── components/
│   │   ├── layout/                    # Topbar, NavPills, BackButton, TripControls
│   │   ├── trip/                      # TripHero, DaySection, ReferenceSection
│   │   ├── timeline/                  # Timeline, TimelineItem/Transport/Food/Meta
│   │   ├── cards/                     # AttractionCard, GastroCard, ArtistCard, ImageWithFallback
│   │   ├── controls/                  # ThemeToggle, PaceSelector, LightModeToggle, ResumenToggle, NotesField, SearchBox
│   │   └── map/
│   │       └── TripMap.client.vue     # sufijo .client = sin SSR (Leaflet)
│   ├── composables/
│   │   ├── useTrip.ts                 # agrega el viaje activo desde las colecciones
│   │   ├── useCardNavigation.ts       # scroll-to-card + pila volver + scrollspy (TRANSVERSAL)
│   │   ├── useTripModes.ts            # pace / lightMode / resumen + acoplamiento light→slow
│   │   ├── useSearch.ts               # índice MiniSearch derivado de datos
│   │   ├── useDayRoute.ts             # URL Google Maps direcciones (puro, testeable)
│   │   └── useNotes.ts                # nota por ficha en localStorage
│   ├── layouts/
│   │   └── default.vue                # Topbar + NavPills + BackButton + <slot/>
│   ├── pages/
│   │   ├── index.vue                  # 1.0: renderiza/redirige al trip por defecto ('roma')
│   │   └── trips/
│   │       └── [slug].vue             # multi-viaje: un viaje por slug
│   ├── plugins/
│   │   └── (vacío en 1.0; p.ej. svg-motifs si se registran como plugin)
│   └── utils/
│       ├── pace.ts                    # isVisible(itemPace, pace) — matriz pura
│       ├── route.ts                   # pointFor / capStops / buildDirUrl — puras (portadas 1:1)
│       └── svg-motifs.ts              # registro de SVG de fallback por motif
├── content/                           # RAÍZ (Nuxt Content) — fuente de verdad
│   └── trips/
│       └── roma/
│           ├── trip.yml               # metadatos del viaje + orden de días
│           ├── days/                  # un fichero por día (timeline ordenado + fichas del día)
│           │   ├── viernes.yml
│           │   ├── sabado.yml
│           │   ├── domingo.yml
│           │   ├── lunes.yml
│           │   └── martes.yml
│           ├── monuments/             # 1 ficha = 1 fichero (~38)
│           │   ├── galleria-sciarra.yml
│           │   └── …
│           ├── food/                  # ~26
│           ├── artists/               # ~varios
│           └── reference/             # reservas.yml, practica.yml, arte.yml, arquitectura.yml
├── server/                            # RAÍZ — BACKEND DORMIDO (v2)
│   ├── api/
│   │   └── README.md                  # único contenido en 1.0 (ver §Dormant backend)
│   └── utils/                         # vacío en 1.0
├── shared/                            # tipos/util compartidos app↔server (vacío o tipos de dominio)
├── public/
│   ├── .nojekyll                      # cinturón-y-tirantes para GitHub Pages (_nuxt/)
│   └── (imágenes locales si las hubiera; las hero son URLs de terceros)
├── content.config.ts                  # colecciones + esquemas zod (RAÍZ)
├── nuxt.config.ts                     # módulos, colorMode, nitro/prerender, css
├── eslint.config.mjs                  # flat config (@nuxt/eslint)
├── vitest.config.ts
└── package.json
```

### Structure Rationale

- **`app/components/` por carpeta de dominio** (layout / trip / timeline / cards / controls / map): el `index.html` mezcla todo; agrupar por dominio hace navegable un proyecto que tendrá ~25 componentes. Nuxt auto-importa componentes anidados (el nombre se prefija con la carpeta salvo configuración), así que `TimelineTransport` sigue siendo `<TimelineTransport>`.
- **`content/` en la raíz, partido por dominio + un fichero por entidad:** satisface "añadir viaje = añadir ficheros" (crear `content/trips/florencia/`), mantiene PRs pequeños (un cambio en una ficha = un fichero), y respeta la regla de Nuxt Content (un fichero = un objeto). Los **días** son la excepción deliberada: van como un fichero por día porque el **timeline ordenado** y la **lista ordenada de fichas del día** deben vivir juntos y revisarse como una unidad.
- **`server/` en la raíz, presente pero vacío:** deja el hueco exacto del backend v2 sin activar nada (ver §Dormant backend). No está dentro de `app/` por convención de Nuxt 4.
- **`utils/` para lógica pura portada del JS actual** (`pace`, `route`, `svg-motifs`): son funciones sin estado ni DOM, auto-importadas, y **testeables en aislamiento** con Vitest — clave para defender la paridad de `capStops`/`isVisible`.
- **`shared/`** existe para los **tipos de dominio** (p.ej. `Trip`, `TimelineItem`) si se quieren referir desde `server/` en v2 sin acoplar a `app/`. En 1.0 los tipos salen del esquema zod; `shared/` puede quedar mínimo.

---

## Modelo de datos — esquema FINAL (zod 4)

Cuatro familias de colección (monumentos, gastronomía, artistas, referencia) + **una colección de días** que es el corazón del viaje (metadatos + timeline ordenado + orden de fichas) + **una colección `trip`** de metadatos globales. Todas `type:'data'`, glob sobre `trips/*/…` para multi-viaje.

### Sub-esquemas reutilizables

```ts
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'   // NO desde @nuxt/content (re-export deprecado)

const Coords = z.object({ lat: z.number(), lng: z.number() })
const Fact = z.object({ label: z.string(), value: z.string() })  // filas de .facts
const Markdown = z.string()  // string en Markdown-inline (render con <MDC>)

const Motif = z.enum([
  'dome','pantheon','arch','fountain','obelisk','statue','painting','church',
  'fortress','temple','garden','keyhole','mask','monument','rooftops','library',
  'tower','stairs','coffee',
])  // mapea al SVG fallback (hoy CARD_TO_MOTIF)
```

### 1. Timeline — `z.discriminatedUnion('kind', …)` (LA PIEZA CRÍTICA)

Modelado directo desde la lectura del HTML (líneas 2404-2445). Seis filas distintas. **El array preserva el orden EXPLÍCITO** (lo que hoy es el orden del DOM dentro de `.timeline`). Cada fila lleva su `pace`.

```ts
const Pace = z.enum(['all', 'medium', 'slow-only'])   // por item (data-pace actual)

// modo de traslado (taxi/tren/metro/andando) dentro de un tl-transport
const TransportMode = z.object({
  icon: z.string(),                 // emoji '🚕' '🚆' 'Ⓜ️' '🚶'
  recommended: z.boolean().default(false),
  desc: Markdown,                   // prosa con <strong>/<em>
  tag: z.string().optional(),       // 'recomendado a la llegada'
  meta: z.string().optional(),      // '⏱ 45-55 min · 💶 €55 fijo'
})

const FoodEntry = z.object({
  ref: z.string().optional(),       // id de ficha gastro ('g-roscioli') → enlace interno
  href: z.string().optional(),      // o URL Google Maps si no hay ficha (cafés sueltos)
  name: z.string(),
  reserved: z.boolean().default(false),
  badge: z.string().optional(),     // '✓ reservado 22:30'
  time: z.string().optional(),      // '🚶 3 min'
  desc: Markdown,
})

const TimelineItem = z.discriminatedUnion('kind', [
  // tl-item: una parada (con o sin enlace a ficha)
  z.object({
    kind: z.literal('stop'),
    pace: Pace.default('all'),
    time: z.string(),                          // '~17:00'
    title: z.string(),
    ref: z.string().optional(),                // id de ficha → <a href="#id"> interceptado
    disabled: z.boolean().default(false),      // .tl-title.disabled (llegada/check-in)
    reservedEvent: z.boolean().default(false), // .tl-item.reserved-event (cena)
    tag: z.string().optional(),                // 'Sorrentino' | 'reservado'
    note: Markdown.optional(),                 // .tl-note
  }),
  // tl-transport: traslado con varios modos
  z.object({
    kind: z.literal('transport'),
    pace: Pace.default('all'),
    variant: z.enum(['taxi', 'walk', 'train']).optional(), // clase de la fila
    header: z.string(),                        // 'Fiumicino (FCO) → Roma Termini · ~32 km'
    modes: z.array(TransportMode),
    footnote: Markdown.optional(),
  }),
  // tl-meta: meta-tiempos entre paradas (no se filtra por pace; visible salvo modo-resumen)
  z.object({
    kind: z.literal('meta'),
    items: z.array(z.object({
      level: z.enum(['ok', 'warn', 'plain']).default('plain'), // .tl-meta-item.ok/.warn
      text: Markdown,                          // '⏱ 35 min · …' / '🚶 hasta siguiente: 5 min'
    })),
  }),
  // tl-food: bloque de comida (cabecera + lista de sitios)
  z.object({
    kind: z.literal('food'),
    pace: Pace.default('all'),
    header: z.string(),                        // '🍴 Tu mesa (y alternativas alrededor)'
    entries: z.array(FoodEntry),
    footnote: Markdown.optional(),
  }),
  // tl-resv-meta: confirmación de reserva (banda verde)
  z.object({
    kind: z.literal('reservation'),
    text: Markdown,                            // '✅ Cena reservada · …'
  }),
])
```

> **Nota de paridad sobre `pace`:** la matriz (verificada en `index.html` 6521-6534) es **contraintuitiva** y NO debe "simplificarse": `optimistic` muestra todo; `neutral` oculta `slow-only`; `slow` oculta `slow-only` **y** `medium`. Es decir `slow-only` solo es visible en optimista (paradas de relleno que se quitan en cuanto bajas el ritmo), y `medium` desaparece solo en pesimista. `tl-meta`/`tl-food`/`tl-resv-meta` no llevan `data-pace` hoy → siempre visibles (salvo `modo-resumen`, que es CSS). Vive en `app/utils/pace.ts` como `isVisible(itemPace, pace)`.

### 2. Día — colección que ata timeline + orden de fichas

```ts
const day = defineCollection({
  type: 'data',
  source: 'trips/*/days/*.yml',     // un fichero por día
  schema: z.object({
    id: z.string(),                  // 'viernes'
    trip: z.string(),                // 'roma'  (para filtrar por viaje)
    order: z.number(),               // 1..5 (orden del día en el viaje)
    roman: z.string(),               // 'I' (day-number)
    eyebrow: z.string(),             // 'venerdì · 19 giugno'
    title: z.string(),               // 'Centro Storico nocturno'
    subtitle: z.string(),
    stats: z.array(z.object({        // .day-stats-item walk/train/taxi
      variant: z.enum(['walk', 'train', 'taxi', 'metro']),
      text: Markdown,
    })),
    light: z.object({                // .dia-ligera (Versión ligera)
      title: z.string(),
      items: z.array(z.object({
        kind: z.enum(['see', 'move', 'skip', 'rest']),  // lg-see/lg-move/lg-skip/lg-rest
        text: Markdown,
      })),
    }).optional(),
    timeline: z.array(TimelineItem), // ← ORDEN EXPLÍCITO del día
    cards: z.array(z.string()),      // ← ORDEN EXPLÍCITO de fichas-monumento del día
                                     //   (ids). ESTE es el orden de la "ruta del día".
  }),
})
```

**Por qué `cards: string[]` es obligatorio y resuelve el hallazgo #2:** hoy la ruta del día se deriva del orden en que las `article.card` aparecen en la `<section>`. Al pasar a datos, ese orden debe ser **explícito** y vivir en el día. `DaySection` renderiza las fichas en ese orden (resolviendo cada id contra la colección `monument`), y `useDayRoute` recibe **esa misma lista** → la ruta sale idéntica. El `pantheon` (que es "Viernes / Sábado") puede aparecer en `cards` de un día y no del otro, exactamente como hoy.

### 3. Monumento / Gastronomía / Artista

```ts
const monument = defineCollection({
  type: 'data',
  source: 'trips/*/monuments/*.yml',   // 1 fichero = 1 ficha
  schema: z.object({
    id: z.string(),                    // 'galleria-sciarra'  (= nombre de fichero)
    trip: z.string(),
    roman: z.string(),                 // 'I' | '★' | '♪'  (card-roman y nº de marcador)
    name: z.string(),
    italian: z.string(),               // 'Galleria Sciarra · Rione Trevi'
    day: z.string(),                   // 'Viernes' | 'Viernes / Sábado' (texto del popup)
    coords: Coords,
    type: z.enum(['card', 'guided', 'concert']),   // color de marcador + popup
    motif: Motif,                      // SVG de fallback
    badge: z.string().optional(),      // 'Sorrentino'
    archLink: z.object({ id: z.string(), label: z.string() }).optional(), // card-arch
    hero: z.object({ src: z.string().url(), alt: z.string() }),
    sections: z.object({               // prosa por secciones (Markdown-inline)
      queEs: Markdown,
      historia: Markdown,
      anecdotas: Markdown.optional(),
      enQueFijarse: z.array(Markdown).optional(),   // <li> de .detail-list
    }),
    detailPhoto: z.object({            // .detail-photo (img + caption, fallback distinto)
      src: z.string().url(), alt: z.string(), caption: Markdown,
    }).optional(),
    facts: z.array(Fact),
    mapsQuery: z.string(),             // texto del enlace .maps-link (Google Maps search)
    sorrentino: Markdown.optional(),   // .sorrentino-box
    culture: z.array(z.object({ title: z.string(), text: Markdown })).optional(), // .culture-box
  }),
})

const food = defineCollection({
  type: 'data',
  source: 'trips/*/food/*.yml',
  schema: z.object({
    id: z.string(),                    // 'g-roscioli'
    trip: z.string(),
    name: z.string(),
    badge: z.string(),                 // 'trattoria' | 'salumeria + cucina'
    address: z.string(),
    desc: Markdown,
    plato: z.string().optional(),
    price: z.string().optional(),      // '€40-55/persona'
    schedule: z.string().optional(),
    mapsQuery: z.string(),
    reserved: z.object({ when: z.string(), people: z.number() }).optional(),
  }),
})

const artist = defineCollection({
  type: 'data',
  source: 'trips/*/artists/*.yml',
  schema: z.object({
    id: z.string(),                    // 'art-bernini'
    trip: z.string(),
    name: z.string(),
    dates: z.string(),                 // 'Nápoles 1598 – Roma 1680 · escultor'
    epithet: z.string().optional(),
    sections: z.object({
      quienFue: Markdown,
      estilo: Markdown,
      obras: z.array(Markdown),
      porQueImporta: Markdown,
      comoReconocer: z.array(Markdown),
      curiosidades: z.array(Markdown).optional(),
    }),
    seenIn: z.array(z.object({ id: z.string(), label: z.string() })),  // enlaces cruzados
  }),
})
```

### 4. Referencia + Trip global

```ts
// Secciones de referencia: Reservas, Gastronomía (intro), Práctica, Arte, Arquitectura.
// Estructura flexible: cada fichero es una sección con bloques tipados.
const reference = defineCollection({
  type: 'data',
  source: 'trips/*/reference/*.yml',
  schema: z.object({
    id: z.string(),                    // 'reservas' | 'practica' | 'arte' | 'arquitectura'
    trip: z.string(),
    order: z.number(),
    title: z.string(),
    eyebrow: z.string().optional(),
    blocks: z.array(z.object({         // bloques heterogéneos de la sección
      heading: z.string().optional(),
      body: Markdown.optional(),
      items: z.array(Markdown).optional(),
    })),
  }),
})

const trip = defineCollection({
  type: 'data',
  source: 'trips/*/trip.yml',          // 1 fichero por viaje
  schema: z.object({
    id: z.string(),                    // 'roma'  (= slug de ruta)
    title: z.string(),                 // 'Cinque giorni a Roma'
    dates: z.string(),                 // '19 — 23 giugno 2026 · Hotel Royal Court'
    hero: z.object({
      decoration: z.string(),          // '· ROMA AETERNA ·'
      quote: z.string(), quoteAttr: z.string(),
    }),
    infoCards: z.array(z.object({ label: z.string(), value: Markdown })), // .info-grid
    howTo: z.array(Markdown),          // 'Cómo usar esta guía'
    map: z.object({ center: Coords, zoom: z.number() }),  // setView([41.8989,12.477],14)
  }),
})

export default defineContentConfig({
  collections: { trip, day, monument, food, artist, reference },
})
```

> **Por qué seis colecciones y no una:** cada `defineCollection` tiene **un** esquema; meter monumentos+gastro+artistas+días en una sola colección obligaría a un `discriminatedUnion` gigante por tipo de fichero y perdería el tipado limpio de `queryCollection('monument').all()`. Seis colecciones = seis tipos TS nítidos, seis globs de multi-viaje, y validación de build precisa (si una ficha gastro no valida, el error señala la colección correcta).

### Cómo partir un viaje entre ficheros (ergonomía de PR)

| Estrategia | Veredicto | Razón (sesgo: revisión en PR por un grupo pequeño no-experto) |
|------------|-----------|----------------------------------------------------------------|
| **Un fichero por viaje** (`roma.yml` gigante) | ❌ | 6.665 líneas de HTML → un YAML enorme; diffs de PR ilegibles; conflictos constantes; **y** viola "un fichero = un objeto" si se intenta como listas. |
| **Un fichero por día (todo el día dentro)** | ⚠️ Parcial | Bien para timeline+orden de fichas, pero meter la **prosa completa** de cada ficha dentro del día mezcla "qué se ve" con "el contenido de la ficha" y rompe la reutilización de una ficha entre días (Pantheon). |
| **Un fichero por entidad + días aparte** (ELEGIDA) | ✅ | `monuments/galleria-sciarra.yml` (1 ficha = 1 PR pequeño), `days/viernes.yml` (timeline + `cards: [ids]` ordenado). Multi-viaje = nueva carpeta. `git blame` por ficha. Cumple la regla de Content. |

**Conclusión:** **por dominio, un fichero por entidad**, con los **días** como la unidad que orquesta orden (timeline + `cards`). Esto es lo que escribe el roadmap como "modelo de datos".

---

## Content Collections (Nuxt Content v3) — cómo se consultan

**Confirmado contra docs v3:** `queryCollection('name')` devuelve un *query builder* con `.where(field, op, value)`, `.order(field, 'ASC'|'DESC')`, `.all()`, `.first()`. Se envuelve en `useAsyncData` (clave única). En **SSG** (`nuxt generate`) estas queries se **resuelven en prerender** y el resultado se sirve como **asset estático** → funciona **offline** sin servidor. (En v3, Content prerendea su base de datos y la sirve en cliente; ver "data flow" abajo.)

```ts
// app/composables/useTrip.ts — agrega el viaje activo (UNA fuente de verdad para el árbol)
export async function useTrip(slug: string) {
  const [trip, days, monuments, food, artists, reference] = await Promise.all([
    useAsyncData(`trip-${slug}`,    () => queryCollection('trip').where('id','=',slug).first()),
    useAsyncData(`days-${slug}`,    () => queryCollection('day').where('trip','=',slug).order('order','ASC').all()),
    useAsyncData(`mon-${slug}`,     () => queryCollection('monument').where('trip','=',slug).all()),
    useAsyncData(`food-${slug}`,    () => queryCollection('food').where('trip','=',slug).all()),
    useAsyncData(`art-${slug}`,     () => queryCollection('artist').where('trip','=',slug).all()),
    useAsyncData(`ref-${slug}`,     () => queryCollection('reference').where('trip','=',slug).order('order','ASC').all()),
  ])
  // Índices por id para resolución O(1) de refs cruzadas (timeline.ref, cards[], seenIn…)
  const monById = computed(() => new Map((monuments.data.value ?? []).map(m => [m.id, m])))
  const foodById = computed(() => new Map((food.data.value ?? []).map(f => [f.id, f])))
  return { trip: trip.data, days: days.data, monuments: monuments.data, food: food.data,
           artists: artists.data, reference: reference.data, monById, foodById }
}
```

**Render de prosa:** los campos `Markdown` (`sections.historia`, `desc`, `note`, `footnote`, captions…) se renderizan con **`<MDC :value="…" />`** (incluido en Nuxt Content). Reproduce `<em>`/`<strong>`/`<a>`. Los enlaces internos `[texto](#g-fortunata)` se interceptan con `useCardNavigation` (un listener delegado o un componente Prose-link), igual que hoy `bindCardLinks`.

---

## Routing — 1.0 una página, multi-viaje sin reescritura

**Restricción:** 1.0 renderiza Roma "en `/`" (paridad: la guía actual es una sola página larga con anclas). Pero la estructura debe hacer que "añadir un viaje" sea **datos + 0 código**.

**Diseño (dos rutas, una activa):**

```
app/pages/
├── index.vue            # 1.0: monta el viaje por defecto ('roma') — la home actual
└── trips/[slug].vue     # multi-viaje: misma página, parametrizada por slug
```

- **`pages/trips/[slug].vue`** contiene **toda** la composición (hero, mapa, días, referencia). Hace `const slug = useRoute().params.slug` → `useTrip(slug)` → `provide(TripKey, …)` → render.
- **`pages/index.vue`** en 1.0: **reutiliza** la misma composición con `slug = useAppConfig().defaultTrip` (`'roma'`). Implementación recomendada: extraer la composición a un componente `<TripView :slug>` y que **ambas** páginas lo rendericen. Así `/` y `/trips/roma` pintan lo mismo sin duplicar.
- **Prerender de slugs:** con `nitro.prerender.crawlLinks: true`, basta sembrar `/` y, cuando haya más viajes, listar las rutas o añadir un `<NuxtLink>` a cada viaje desde algún índice; Nitro las descubre y genera `/trips/florencia/index.html`. En 1.0 solo existe Roma → solo se genera `/`.
- **Por qué NO `[slug]` en la raíz (`/[slug].vue`)**: colisiona con `/` y con cualquier futura página (`/about`); `trips/[slug]` es explícito y deja la raíz libre.

> **Anti-sobre-ingeniería:** 1.0 NO necesita un selector de viajes ni una home-índice de viajes (está fuera de alcance). Solo necesita que la **estructura de ruta y la de datos** ya estén parametrizadas por `slug`/`trip`. Añadir Florencia = `content/trips/florencia/` + (opcional) un enlace. Cero cambios en componentes ni composables.

---

## Componentes — árbol y fronteras

```
app.vue
└─ layouts/default.vue
   ├─ Topbar
   │  ├─ SearchBox            → useSearch(trip)
   │  └─ ThemeToggle          → useColorMode() (módulo)
   ├─ NavPills                → useCardNavigation (scrollspy)
   ├─ BackButton              → useCardNavigation (canGoBack/goBack)
   └─ <slot/>  ← TripView (compartido por index.vue y trips/[slug].vue)
      ├─ TripHero             ← trip.yml (hero, infoCards, howTo)
      ├─ TripControls
      │  ├─ PaceSelector      → useTripModes().pace
      │  ├─ LightModeToggle   → useTripModes().lightMode
      │  └─ ResumenToggle     → useTripModes().resumen
      ├─ <ClientOnly>  TripMap.client   ← markers derivados (useMapMarkers/computed)
      │     #fallback: placeholder del tamaño del mapa (evita layout shift)
      ├─ DaySection (×5)      ← day + fichas del día (resueltas por id)
      │  ├─ Timeline          ← day.timeline (ordenado) + useTripModes().pace
      │  │  └─ <component :is> por kind:
      │  │     TimelineItem | TimelineTransport | TimelineMeta | TimelineFood | TimelineReservation
      │  ├─ DayRouteButton    → useDayRoute(day.cards resueltas)
      │  └─ AttractionCard (×n, en orden day.cards)
      │     ├─ ImageWithFallback (hero)   ← motif
      │     ├─ <MDC> (secciones de prosa)
      │     ├─ ImageWithFallback (detail) ← motif (variante detail)
      │     └─ NotesField      → useNotes(id)
      └─ ReferenceSection (×5: reservas, gastronomía, práctica, arte, arquitectura)
         ├─ GastroCard (×n)    (en sección Gastronomía)
         └─ ArtistCard (×n)    (en secciones Arte/Arquitectura)
```

**Fronteras (qué depende de qué):**
- **Presentacionales puros** (no tocan estado global, solo `props`): `TripHero`, `TimelineItem/Transport/Meta/Food/Reservation`, `AttractionCard`/`GastroCard`/`ArtistCard` (salvo su `NotesField`), `ReferenceSection`, `ImageWithFallback`, `DayRouteButton`.
- **Conectados a composables:** `SearchBox`→`useSearch`, controles→`useTripModes`, `NavPills`/`BackButton`/enlaces→`useCardNavigation`, `NotesField`→`useNotes`, `TripMap.client`→markers + estado offline local.
- **`TripMap.client.vue` es la ÚNICA isla client-only** (sufijo `.client` + envuelto en `<ClientOnly>` con `#fallback`). Todo lo demás se prerenderiza con HTML real (clave para paridad y SEO/offline).
- **`<component :is>` en `Timeline`**: un mapa `{ stop: TimelineItem, transport: TimelineTransport, … }` selecciona el componente por `item.kind`. Es el patrón limpio para el `discriminatedUnion`.

---

## Composables — contratos (entradas/salidas + estado compartido)

> Convención: estado **de sesión/preferencias** compartido entre componentes → `useState(key, init)` (SSR-friendly, ver docs Nuxt 4). Estado **derivado** → `computed`. Acceso a `window`/`localStorage`/Leaflet → **`onMounted`** o handlers (nunca en `<script setup>` síncrono, que corre en build).

| Composable | Entrada | Salida | Estado | Cliente-only |
|------------|---------|--------|--------|--------------|
| `useTrip(slug)` | `slug: string` | `{ trip, days, monuments, food, artists, reference, monById, foodById }` (todos `Ref`/`computed`) | `useAsyncData` (cache por clave) | No (prerender) |
| `useCardNavigation()` | — | `{ navStack, canGoBack, activeSection, navigateToCard(id), goBack() }` | `useState('nav-stack', ()=>[])` + `useState('active-section')` | Sí (scroll/offsetTop en `onMounted`/handlers) |
| `useTripModes()` | — | `{ pace, lightMode, resumen, isVisible(itemPace) }` | `useState('pace'|'lightMode'|'resumen')` | Persistencia en `onMounted` |
| `useSearch(docs)` | índice derivado del viaje | `{ query, results }` (`results` ≤ 8, ≥2 chars) | `ref('')` + `computed`/MiniSearch | No (dato puro) |
| `useDayRoute(stops)` | `stops: {id?,lat,lng,query?}[]` (ordenadas) | `{ url, count, total, hasRoute }` (`computed`) | `computed` puro | No (dato puro) |
| `useNotes(key)` | `key: string` (id de ficha) | `{ text }` (`Ref<string>`) | `localStorage('roma-note-'+key)` | Lectura en `onMounted` |

**Contratos clave (portados 1:1 del `index.html`):**

```ts
// useCardNavigation — TRANSVERSAL. Mapa, búsqueda y enlaces del timeline DEBEN usarlo.
export function useCardNavigation() {
  const navStack = useState<number[]>('nav-stack', () => [])         // posiciones scrollY (sesión)
  const activeSection = useState<string>('active-section', () => '') // scrollspy
  const canGoBack = computed(() => navStack.value.length > 0)
  function navigateToCard(id: string, ev?: Event) {
    ev?.preventDefault()
    if (!import.meta.client) return
    navStack.value.push(window.scrollY)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })       // + scroll-padding-top CSS
    // highlight 2500ms vía estado reactivo (activeCardId) o clase temporal — MISMA animación
  }
  function goBack() {
    if (!import.meta.client) return
    const prev = navStack.value.pop()
    if (typeof prev === 'number') window.scrollTo({ top: prev, behavior: 'smooth' })
  }
  // scrollspy en onMounted: listener 'scroll' passive con la fórmula EXACTA scrollY+130 ≥ offsetTop
  return { navStack, canGoBack, activeSection, navigateToCard, goBack }
}

// useTripModes — pace/light/resumen + acoplamiento light→slow (efecto colateral exacto del HTML)
export function useTripModes() {
  const pace = useState<'optimistic'|'neutral'|'slow'>('pace', () => 'optimistic')
  const lightMode = useState('lightMode', () => false)
  const resumen = useState('resumen', () => false)
  watch(lightMode, on => { if (on) pace.value = 'slow' })  // ← al activar caminar-menos, fuerza slow
  const isVisible = (itemPace: 'all'|'medium'|'slow-only') =>
    pace.value === 'optimistic' ? true
    : pace.value === 'neutral'  ? itemPace !== 'slow-only'
    :                             itemPace === 'all'
  // light-mode/resumen como clase en <body> vía useHead({ bodyAttrs }); persistencia en onMounted
  return { pace, lightMode, resumen, isVisible }
}

// useDayRoute — puro y testeable. Lógica de capStops/buildDirUrl portada literal de index.html.
export function useDayRoute(stops: MaybeRef<{ id?: string; lat?: number; lng?: number; query?: string }[]>) {
  const MAX = 10
  const points = computed(() => unref(stops)
    .map(s => (s.lat != null && s.lng != null) ? `${s.lat},${s.lng}` : (s.query ?? null))
    .filter((p): p is string => !!p))
  const url = computed(() => buildDirUrl(capStops(points.value, MAX)))   // app/utils/route.ts
  return { url, count: computed(() => Math.min(points.value.length, MAX)),
           total: computed(() => points.value.length),
           hasRoute: computed(() => points.value.length >= 2) }          // umbral mínimo 2
}
```

> **`useColorMode()` es del módulo** (`@nuxtjs/color-mode`), no propio (STACK.md): el script inline anti-flash es justo lo que un sitio estático no puede hacer de otro modo. No envolver salvo para fijar API.

---

## Data Flow

### Fuente de verdad → derivados

```
content/trips/roma/*  (YAML, validado por zod en build)
        │  queryCollection(...).all()   [resuelto en PRERENDER]
        ▼
   useTrip('roma')  → { trip, days, monuments, food, artists, reference, monById, foodById }
        │  provide(TripKey)
        ▼
   TripView  ──props──> componentes presentacionales
        │
        ├─ DERIVADO 1: marcadores del mapa
        │     monuments → [{ n: roman, name, day, coords, type, id }]  (computed)
        │     → TripMap.client (Leaflet divIcon por type/roman; fitBounds(pad 0.1))
        │
        ├─ DERIVADO 2: índice de búsqueda
        │     monuments+food+artists → docs { id, name, italian, day, prosa(concat) }
        │     → MiniSearch index (computed, en cliente al montar) → useSearch
        │
        └─ DERIVADO 3: ruta del día (por día)
              day.cards (ids ORDENADOS) → resolver a monById → [{id,coords,query}]
              → useDayRoute → url Google Maps (capStops 10 + dir/?api=1&walking)
```

**Tres derivados, un origen.** Esto invierte el `index.html` actual: hoy el mapa lee `places` (un array separado del contenido), la búsqueda **raspa el DOM** (`card.textContent`), y la ruta **raspa `a.maps-link`** del DOM. En Nuxt los tres se calculan desde **las colecciones** con `computed`/composables puros → testeables, sin esperar al render, sin desincronización.

### Por qué funciona offline en SSG

En `nuxt generate`, Nuxt Content **prerenderiza su base de datos** y la entrega como asset; las queries se resuelven contra ese dump en el cliente. Sumado a Leaflet/fuentes/CSS self-hosted (STACK.md), el resultado: HTML real + datos embebidos/estáticos + assets locales → **la guía abre y navega sin red** (los únicos remotos siguen siendo los *tiles* OSM y las imágenes hero de terceros, con su banner y su fallback SVG — idéntico a hoy).

### State Management

```
useState (SSR-friendly, compartido por clave) :  pace · lightMode · resumen · nav-stack · active-section
  ▲ escriben: controles, enlaces, scrollspy        ▼ leen: Timeline, NavPills, BackButton, <body> class
computed (derivado, sin estado propio)         :  isVisible · results · day-route url · map markers
localStorage (persistencia, onMounted)         :  roma-theme · roma-pace · roma-light · roma-resumen · roma-note-<id>
```

**Claves de `localStorage` = EXACTAS las de hoy** (`roma-theme`, `roma-pace`, `roma-light`, `roma-resumen`, `roma-note-<id>`): continuidad de datos para quien ya use la versión viva en el mismo navegador.

---

## Dormant backend (Nitro) — hueco limpio, servidor APAGADO

**Dónde:** `/server/` en la **raíz** (hermano de `app/`, confirmado por la convención Nuxt 4). En v2: `server/api/*.ts` (auth, subida de media), `server/utils/`, `server/middleware/`.

**Cómo dejarlo dormido en 1.0 sin activar render de servidor:**

1. **No crear ningún `server/api/*.ts`.** Una ruta de servidor solo existe si hay un fichero que la define. Sin ficheros → sin endpoints → Nitro no expone API. El único contenido en 1.0 es **`server/api/README.md`** explicando que es el hueco de v2 (auth/uploads). Mantener la carpeta vacía-pero-presente documenta la intención sin código muerto.
2. **`nuxt generate` sigue siendo SSG aunque exista `server/`.** Generar a estático **no** depende de que `server/` esté vacío: `nuxt generate` **prerenderiza** la app (con SSR en build) a HTML. Tener `server/api/` vacío no activa un servidor en producción —GitHub Pages sirve ficheros estáticos; no hay runtime Nitro—. Es decir: el backend está "preparado" (carpeta + convención + tipos en `shared/`) pero **inerte**.
3. **NO poner `ssr: false`.** Importante matiz de paridad: el proyecto **mantiene SSR ON durante el build** para prerenderizar **HTML real** (necesario para paridad y para que el contenido exista sin JS). `ssr: false` produciría un SPA shell vacío. La salida estática se logra con el **preset `github_pages` + prerender**, no apagando SSR. (Activar el servidor en v2 = cambiar el preset de despliegue, p.ej. a `node-server`/edge, y añadir ficheros en `server/api/` — sin tocar `app/`.)
4. **`shared/`** alberga los **tipos de dominio** (`Trip`, `Day`, `Monument`…) para que, en v2, `server/api/` los importe sin acoplarse a `app/`. En 1.0 puede contener solo re-exports de los tipos zod o quedar mínimo.

> **Resumen:** la 1.0 deja `server/` presente, vacío y documentado; el despliegue es estático vía prerender (SSR-en-build ON, sin runtime); activar v2 = añadir ficheros en `server/api/` + cambiar preset, **sin reescribir la app**.

---

## Architectural Patterns

### Pattern 1: Contenido como única fuente de verdad, derivados por composable puro

**Qué:** todo dato visible o computado (marcadores, búsqueda, ruta del día) se origina en las colecciones de Content y se deriva con `computed`/funciones puras. **Cuándo:** siempre en esta app. **Trade-offs:** + testeable, + sin desincronización, + offline; − requiere disciplina de no leer el DOM.

```ts
// Mapa: derivar markers del contenido, no de un array paralelo (places)
const markers = computed(() => (monuments.value ?? []).map(m => ({
  id: m.id, roman: m.roman, name: m.name, day: m.day, coords: m.coords, type: m.type,
})))
```

### Pattern 2: Orden explícito en datos (timeline + `cards`), nunca orden del DOM

**Qué:** el orden de visita (timeline) y el orden de fichas del día (que define la ruta) son **arrays en el YAML del día**, no el orden de maquetado. **Cuándo:** crítico para "ruta del día" y "selector de ritmo". **Trade-offs:** + reproducible y testeable; − hay que mantener `cards` en sincronía con las fichas existentes (un test de invariantes lo cubre: todo id en `cards`/`timeline.ref` existe en `monument`).

### Pattern 3: Isla client-only mínima para APIs de navegador

**Qué:** solo `TripMap.client.vue` es client-only; el resto se prerenderiza. **Cuándo:** Leaflet (toca `window` al importar). **Trade-offs:** + HTML real para el 95% de la página (paridad/offline); − el mapa aparece tras hidratar (placeholder `#fallback` cubre el hueco). Notas/tema/ritmo no necesitan isla: tema lo resuelve el script inline del módulo; notas/ritmo se hidratan en `onMounted` con un repintado de un frame **idéntico al comportamiento actual**.

```vue
<ClientOnly>
  <TripMap :markers="markers" :center="trip.map.center" :zoom="trip.map.zoom" />
  <template #fallback><div class="leaflet-map leaflet-map--placeholder" /></template>
</ClientOnly>
```

### Pattern 4: `discriminatedUnion` + `<component :is>` para el timeline heterogéneo

**Qué:** el timeline es un array de filas de tipos distintos; zod lo valida por `kind` y Vue lo despacha por `kind`. **Cuándo:** estructuras polimórficas ordenadas. **Trade-offs:** + tipado exhaustivo (zod obliga a cubrir cada `kind`); − añadir un tipo nuevo toca esquema + mapa de componentes (coste justo).

---

## Anti-Patterns

### Anti-Pattern 1: Raspar el DOM para derivar datos (lo que hace el `index.html`)

**Qué hace la gente:** `document.querySelectorAll('.card')` para el índice de búsqueda; `a.maps-link` para la ruta; `bindCardLinks` recorriendo `<a href="#">`. **Por qué está mal en Vue/SSG:** el dato ya existe tipado; raspar el DOM acopla lógica a la maqueta, exige que el DOM esté presente (rompe SSR/prerender), y desincroniza. **En su lugar:** derivar de las colecciones (búsqueda, ruta, marcadores) y enlazar navegación **declarativamente** (`@click.prevent="navigateToCard(id)"`).

### Anti-Pattern 2: Importar Leaflet (o tocar `window`/`localStorage`) a nivel de módulo

**Qué hace la gente:** `import L from 'leaflet'` en `<script setup>` síncrono, o leer `localStorage` para inicializar un `ref`. **Por qué está mal:** corre en build (`window is not defined`) o produce hydration mismatch. **En su lugar:** `.client.vue` + `onMounted`/import dinámico para Leaflet; `onMounted` para `localStorage`; default que **coincida** con el HTML prerenderizado.

### Anti-Pattern 3: Acoplar contenido a código (`places`/contenido en `.ts`)

**Qué hace la gente:** dejar el array `places` o la prosa en ficheros `.ts`/`useState`. **Por qué está mal:** rompe "añadir viaje = añadir ficheros", sin validación, PRs de no-programadores imposibles. **En su lugar:** todo en `content/` como colecciones zod.

### Anti-Pattern 4: `ssr: false` para "hacerlo estático"

**Qué hace la gente:** apagar SSR creyendo que así se genera estático. **Por qué está mal:** produce un SPA shell sin HTML → rompe paridad y el contenido no existe sin JS. **En su lugar:** SSR ON + preset `github_pages` + prerender (la app se renderiza en build y se vuelca a HTML).

---

## BUILD ORDER (dependencias → fases del roadmap)

Ordenado por dependencia y riesgo. Cada paso habilita al siguiente. **Esto es lo que el roadmap convierte en fases.**

```
0. ANDAMIAJE  (sin dependencias)
   nuxt init en rama release · módulos (content, color-mode, fonts, eslint) · nitro/github_pages
   · CSS verbatim a assets/css/ · server/ vacío + README · public/.nojekyll
        ▼ habilita todo
1. ESQUEMA + CONTENIDO  (depende de 0)  ← LA BASE: 5 de 6 features derivan de aquí
   content.config.ts (6 colecciones zod) · migrar Roma a content/trips/roma/*
   · test de validación zod (build falla si una ficha no valida)
   · test de invariantes (ids únicos; refs cruzadas resuelven)
        ▼ habilita 2,4,5,6,7,8
2. CAPA DE PÁGINA + LAYOUT  (depende de 1)
   useTrip(slug) · TripView · pages/index.vue + pages/trips/[slug].vue · default.vue · Topbar/NavPills shell
        ▼ habilita render de contenido
3. RENDER DE CONTENIDO + MODOS TRIVIALES  (depende de 2)  ← bajo riesgo, valida el patrón data-driven
   AttractionCard/GastroCard/ArtistCard (+ <MDC>) · ReferenceSection · DaySection
   · Timeline + Timeline{Item,Transport,Meta,Food,Reservation} (discriminatedUnion → <component :is>)
   · useTripModes (pace 6 / lightMode 7 / resumen 8) + utils/pace.ts  (matriz exacta)
        ▼
4. NAVEGACIÓN TRANSVERSAL  (depende de 3)  ← antes que mapa/búsqueda (los tres la consumen)
   useCardNavigation (scroll-to-card, pila volver, scrollspy +130) · BackButton · NavPills activo
   · enlaces internos de <MDC> enrutados a navigateToCard
        ▼ habilita consumidores de navegación
5. DERIVADOS DE DATOS  (depende de 1 + 4)  ← testeables en aislamiento
   useSearch (MiniSearch, índice desde datos) + SearchBox
   · useDayRoute (utils/route.ts: pointFor/capStops/buildDirUrl 1:1) + DayRouteButton (orden = day.cards)
        ▼
6. TEMA  (depende de 0; independiente de datos)  ← fijar anti-flash pronto
   @nuxtjs/color-mode (dataValue:'theme', storageKey:'roma-theme') + ThemeToggle
        ▼
7. ISLA CLIENT-ONLY: MAPA + FALLBACK IMG  (depende de 1; el más sensible a SSR — al final)
   TripMap.client (Leaflet divIcon/popups/fitBounds/banner offline) ← markers derivados
   · ImageWithFallback (hero + detail) + utils/svg-motifs.ts  · useNotes + NotesField
        ▼
8. VERIFICACIÓN DE PARIDAD  (depende de todo)
   Playwright: golden screenshots del index.html original vs build (light/dark, móvil/desktop)
   · E2E de comportamiento (ritmo, tema, búsqueda, ruta del día, notas) · invariantes de datos
```

**Dependencias resumidas (para el grafo de fases):**
- **Esquema/contenido (1) es la raíz**: búsqueda, ruta, mapa, ritmo y fallback derivan de él (coincide con FEATURES.md).
- **Navegación (4) es transversal y va ANTES** que mapa/búsqueda/enlaces-timeline (sus tres consumidores) — evita duplicar lógica de scroll/pila.
- **Modos (6/7/8 de features) comparten `useTripModes`**; light fuerza slow (acoplamiento explícito).
- **Mapa + fallback al final**: máxima sensibilidad SSR/cliente; se abordan cuando el patrón client-only ya está asentado.
- **Tema independiente**: se puede hacer en paralelo desde el paso 0; conviene pronto para fijar el anti-flash en estático.

---

## Scaling Considerations

| Escala | Ajustes de arquitectura |
|--------|--------------------------|
| 1 viaje (Roma, 1.0) | Lo descrito. Una página larga prerenderizada; datos embebidos; cero servidor. |
| N viajes (futuro) | `content/trips/<slug>/` + ruta `trips/[slug]`. Prerender de cada slug. Si crecen mucho, índice de viajes en `/` y *lazy* del mapa por viaje. |
| Backend v2 (auth/uploads) | Activar `server/api/*` + cambiar preset de despliegue (de `github_pages` estático a Node/edge). El contenido editorial puede seguir en Content; lo dinámico (notas en nube, media subida) pasa por Nitro. `shared/` ya tiene los tipos. |

**Primer cuello de botella realista:** no es rendimiento (64 fichas, una ciudad) sino **mantenibilidad del contenido** — por eso el modelo "un fichero por entidad + días orquestando orden" es la decisión de escala más importante.

---

## Integration Points

### External Services

| Servicio | Patrón de integración | Notas |
|----------|------------------------|-------|
| OpenStreetMap (tiles) | `L.tileLayer` en `TripMap.client` (remoto, como hoy) | Banner offline por `tileerror` (heurística `>3 && 0` portada 1:1). Caché real de tiles = PWA = v2. |
| Google Maps (rutas/búsqueda) | URLs generadas (`dir/?api=1&walking`, `search/?api=1&query`) | Sin API key; `useDayRoute`/`mapsQuery`. Cap 10 paradas. |
| Imágenes hero (Wikimedia/terceros) | `<img>` remoto + `@error` → SVG por `motif` | Fallback es requisito offline; NO procesar con `@nuxt/image` (rompería el patrón onerror) — STACK.md. |
| Google Fonts | `@nuxt/fonts` self-host en build | Offline; sin red en runtime. |

### Internal Boundaries

| Frontera | Comunicación | Consideraciones |
|----------|--------------|------------------|
| `content/` ↔ página | `queryCollection` (resuelto en prerender) | Validación zod en build = *quality gate*. |
| página ↔ componentes | `props` + `provide/inject` del viaje | Componentes tontos; sin tocar Content directamente. |
| componentes ↔ estado global | composables sobre `useState` | pace/light/resumen/nav compartidos por clave. |
| `app/` ↔ `server/` (v2) | tipos en `shared/`; fetch a `server/api` | En 1.0 inexistente; hueco preparado. |

---

## Open Questions / flags para fases

- **Secciones de referencia (Reservas/Gastronomía/Práctica/Arte/Arquitectura):** el esquema `reference` propuesto (bloques heterogéneos) es deliberadamente flexible porque NO leí esas 5 secciones completas en detalle (solo inicio, mapa y viernes a fondo). **Flag:** la fase que migre referencia debe leer esas secciones del `index.html` (líneas ~5260-6250) y, si tienen sub-estructura rica (p.ej. tablas de reservas, fichas de artista con campos fijos), afinar el esquema entonces. Confianza del esquema de referencia: MEDIA; el resto (timeline, monumentos, días, mapa, ruta): ALTA (leídos directamente).
- **`tl-meta` y `data-pace`:** confirmado que las filas `tl-meta`/`tl-food`/`tl-resv-meta` NO llevan `data-pace` hoy (solo `tl-item`/`tl-transport`). Modeladas sin `pace` salvo donde el HTML lo tiene. La fase de timeline debe verificar día por día que ningún `tl-meta` quede visible cuando su parada asociada se oculta por ritmo (hoy no se ocultan; mantener ese comportamiento o decidir explícitamente).
- **Render de enlaces internos en `<MDC>`:** verificar en la fase de contenido que `<MDC>` permite interceptar `a[href^="#"]` para enrutar a `navigateToCard` (componente Prose-`a` custom o listener delegado en el contenedor). Confianza: MEDIA-ALTA (es el patrón documentado, pero el cableado fino se valida al implementar).

## Sources

- [Nuxt 4 — `nuxt-config` / `srcDir` & estructura `app/`](https://nuxt.com/docs/4.x/api/configuration/nuxt-config) — estructura de carpetas con `srcDir:'app/'`; `server/ shared/ public/ modules/ layers/` en raíz — HIGH (Context7 `/websites/nuxt_4_x`).
- [Nuxt 4 — Directory Structure (app/ + server/)](https://nuxt.com/docs/4.x/directory-structure) — subdirectorios de `app/`; `server/api` → `/api/*` — HIGH.
- [Nuxt 4 — State Management / `useState`](https://nuxt.com/docs/4.x/getting-started/state-management) — `useState` SSR-friendly, compartido por clave, preservado en hidratación — HIGH.
- [Nuxt 4 — Best Practices: Hydration](https://nuxt.com/docs/4.x/guide/best-practices/hydration) — `<ClientOnly>` + `#fallback`, `useState` para datos consistentes — HIGH.
- [Nuxt 4 — Rendering concepts (prerender / ssr false)](https://nuxt.com/docs/4.x/guide/concepts/rendering) — prerender; matiz de `ssr:false` y fallbacks — HIGH.
- [Nuxt Content v3 — `queryCollection`](https://content.nuxt.com/docs/utils/query-collection) — query builder `.where/.order/.all/.first` + `useAsyncData` — HIGH (Context7 `/websites/content_nuxt`).
- [Nuxt Content v3 — JSON data files](https://content.nuxt.com/docs/files/json) — **"Each file must contain a single JSON object, not an array."** (mismo para YAML) — HIGH (corrige el sketch de STACK.md).
- [Nuxt Content v3 — YAML / CSV data collections](https://content.nuxt.com/docs/files/yaml) — `type:'data'`, glob multi-fichero (cada fichero = un item) — HIGH.
- **STACK.md** (este research) — formato de contenido (YAML `type:'data'` + `<MDC>`), versiones, módulos, mapa Leaflet crudo en `.client`, color-mode, MiniSearch — base no contradicha.
- **FEATURES.md** (este research) — descomposición composables/componentes, riesgos SSR/hydration, orden por dependencia — base no contradicha.
- **Lectura directa de `/home/vcompanyb/guiaRoma/index.html`** — timeline (2403-2446: 6 tipos de fila), `places` (6269-6314), mapa+`divIcon` (6316-6378), navegación+`bindCardLinks` (6381-6429), búsqueda DOM (6433-6469), notas (6471-6483), scrollspy `+130` (6485-6501), pace (6505-6535), light/resumen (6545-6577), **`buildDayRoutes` con `a.maps-link`+`capStops` (6584-6646)**, init (6648-6659), inicio/mapa/controles (2283-2372) — HIGH (fuente primaria de paridad).

---
*Architecture research for: re-plataformado guiaRoma → Nuxt 4 (SSG + offline + data-driven + multi-viaje, paridad 100%)*
*Researched: 2026-06-18*
