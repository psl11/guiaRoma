# Architecture Research — v1.1 Multi-viaje + Campania

**Domain:** Guía de viaje editorial estática (Nuxt 4 SSG + Nuxt Content v3), de un viaje a N viajes
**Researched:** 2026-11-20
**Confidence:** HIGH en los puntos de integración (lectura directa del código), HIGH en el orden de construcción, MEDIUM en el comportamiento de Nuxt Content al navegar en cliente (docs + fuentes comunitarias)

> Alcance: cómo encaja el soporte multi-viaje en la arquitectura v1.0 ya enviada. No es un diseño desde cero: los cimientos de la v1.0 (colecciones con glob `trips/*/…`, `useTrip(slug)` filtrando por `trip`, `TripView` dueño de la página, ruta `/trips/[slug]`) ya son multi-viaje en **datos**. Lo que no es multi-viaje son la **presentación**, el **estado** y el **enrutado/prerender**. Este documento lista cada acoplamiento a Roma con su `file:line`, dice qué se modifica y qué se crea, y propone un orden de fases que mantiene `pnpm verify` en verde **en cada paso**.

---

## 1. Diagnóstico: qué es ya multi-viaje y qué no

| Capa | Estado v1.0 | Veredicto |
|------|-------------|-----------|
| Colecciones Content (`content.config.ts:25-32`) | glob `trips/*/…` en las 6 | ✅ Ya multi-viaje. Sin cambios. |
| `useTrip(slug)` (`app/composables/useTrip.ts:37-82`) | filtra todo por `trip`/`slug`, claves `useAsyncData` por slug | ✅ Ya multi-viaje. Sin cambios funcionales. |
| Utils puras (`dayRoute`, `searchIndex`, `cardNav`, `mapMarkers`, `tripIndexes`, `pace`, `svgMotifs`) | Sin referencias a Roma | ✅ Reutilizables tal cual (salvo `foodGroups`). |
| `TripView.vue` | 5 días fijos, 5 secciones de referencia fijas, leyenda y pie de Roma | ❌ Acoplado a la *forma* de Roma |
| Chrome (`Topbar`, `NavPills`, `app.vue`) | marca, `<title>` y pastillas literales | ❌ Acoplado |
| Controllers singleton (`useSearch`, `useCardNavigation`, `useTripModes`) | `useTrip('roma')` fijo, `useState` con claves globales, índice MiniSearch a nivel de módulo | ❌ Acoplado (y con fuga de estado entre viajes en navegación SPA) |
| Persistencia (`useTripModes`, `MonumentCard`) | claves `roma-*` literales | ❌ Acoplado |
| Enrutado/prerender (`pages/index.vue`, `nuxt.config.ts:45`, `shell.spec.ts:186`) | `/` = Roma; solo se prerenderiza `/`; un test **exige** que no exista `trips/` | ❌ Hay que invertirlo |
| Esquema (`shared/schemas.ts`) | enums cerrados a lo que Roma usa (transportes, badges, tipos de marcador) | ⚠️ Evolución aditiva necesaria |
| Tests de datos (`tests/data/*`, `tests/unit/dayRoute|mapMarkers`) | `ROOT = content/trips/roma` | ⚠️ Generalizar a `trips/*` |
| Arnés de paridad (11 specs) | cada spec define `STATIC_URL = …/guiaRoma/` | ⚠️ Mover a `/guiaRoma/trips/roma/` |

---

## 2. Inventario de acoplamientos a Roma (verificado con file:line)

Los marcados **[nuevo]** no estaban en la lista de partida del milestone.

| # | Fichero:línea | Acoplamiento | Tratamiento |
|---|---------------|--------------|-------------|
| H1 | `app/components/TripView.vue:115-149` | 5 `<section id="viernes|…|martes">` literales con `dayBySlug('…')` | `v-for` sobre `days` (ya ordenados por `order` en `useTrip.ts:40`) |
| H2 | `app/components/TripView.vue:111` | leyenda del mapa «…concierto Einaudi» | `trip.map.legend` (Md) |
| H3 | `app/components/TripView.vue:86-91` | eyebrow «cartografia», h2 y párrafo del mapa | se quedan como UI fija en español (decisión v1.1: UI fija) — opcionalmente `trip.map.intro?` |
| H4 | `app/components/TripView.vue:239` | pie «Itinerario preparado para *Pay*… Roma · 19—23 giugno 2026…» | `trip.footer: Md[]` (líneas unidas con `<br>`) |
| H5 | `app/components/TripView.vue:150-228` | 5 secciones de referencia en orden fijo; h2 «Arte»/«Arquitectura» literales (177, 205) | lista de secciones derivada (`buildTripLayout`, §5.3); títulos UI fijos, presencia por datos |
| H6 | `app/components/TripView.vue:68` + `app/composables/useCardNavigation.ts:173` | el controller de navegación hace `await useTrip('roma')` | recibe el slug: `useCardNavigationController(slug)` |
| H7 | `app/composables/useSearch.ts:144` | `useSearchController` hace `await useTrip('roma')` | slug por `inject` del contexto de viaje |
| H8 **[nuevo]** | `app/composables/useSearch.ts:52` | `indexRef` **a nivel de módulo**: un único índice MiniSearch para toda la app | `Map<slug, MiniSearch>` o índice dentro del contexto del viaje |
| H9 **[nuevo]** | `useSearch.ts:56-58`, `useCardNavigation.ts:53-54`, `useTripModes.ts:46-48` | claves `useState` globales (`search:*`, `cardNav:*`, `pace`/`light`/`resumen`) | sufijar con el slug (`pace:${slug}`) — invisible para el render |
| H10 | `app/composables/useTripModes.ts:92-103` | `roma-pace`/`roma-light`/`roma-resumen` | `tripStorageKey(slug, 'pace')` → `${slug}-pace` (§5.5) |
| H11 | `app/components/MonumentCard.vue:123` | `roma-note-${slug}` | `tripStorageKey(trip, 'note-' + slug)` |
| H12 | `app/components/Topbar.vue:22` | «Roma ✦ giugno MMXXVI» | `trip.brand: { lead, tail }` (el `✦` con `.brand-dot` se queda en plantilla) |
| H13 | `app/app.vue:27` (`useHead({ title })`) | `<title>` fijo «Roma · 19—23 giugno 2026» | `trip.headTitle` vía `useHead` en `TripView`; `app.vue` conserva `lang` + `theme-color` |
| H14 | `app/components/NavPills.vue:35-75` | 7 pastillas estructurales literales (incl. «Pratica») | generadas de la misma lista de secciones que H5 → pastillas y secciones no pueden divergir |
| H15 **[nuevo]** | `app/utils/foodGroups.ts:27` | `FOOD_GROUP_ORDER` = los 7 grupos gastronómicos **de Roma** en código | `trip.sections.gastronomia.groupOrder?: string[]`; `groupFood(items, order?)` |
| H16 **[nuevo]** | `app/components/ReservasSection.vue:73,81,91` | «✅ Ya reservado · 3 comensales», «🎟️ Visitas y entradas reservadas», «Restaurantes · cuándo reservar…» | campos opcionales en `ReservasSchema` (`confirmedTitle`, `visitsTitle`, `tableTitle`); Roma los rellena verbatim |
| H17 **[nuevo]** | `app/components/GastroSection.vue:46` | h2 «Dónde comer» | UI fija (vale para cualquier viaje); `title?` opcional en `SectionMeta` si se quiere |
| H18 **[nuevo]** | `app/components/LeafletMap.client.vue:106-108,126` | colores y popups por `type` (`card/guided/concert`) en código | tabla `MARKER_STYLE` en `app/utils/mapMarkers.ts`, extendida de forma aditiva (`nature`, `base`) |
| H19 | `app/pages/index.vue:11` | `/` = `<TripView slug="roma"/>` | `/` = portada índice; Roma a `/trips/roma` |
| H20 | `nuxt.config.ts:45` | `prerender.routes: ['/']` | rutas derivadas de `content/trips/*` + `crawlLinks` |
| H21 | `nuxt.config.ts:33` | `colorMode.storageKey: 'roma-theme'` | **Conservar**: el tema es preferencia global del dispositivo; renombrar perdería la preferencia guardada |
| H22 **[nuevo]** | `tests/parity/shell.spec.ts:186-188` | test que **exige** que `.output/public/trips` NO exista; `:158` asevera el pie de Roma en `/` | invertir (debe existir `trips/roma/index.html`) y mover a la nueva URL |
| H23 **[nuevo]** | `tests/data/schema.spec.ts:36`, `invariants.spec.ts:32`, `tests/unit/dayRoute.spec.ts:34`, `mapMarkers.spec.ts:32` | `ROOT = content/trips/roma` | invariantes y esquema iteran `trips/*`; `migration-diff` sigue siendo solo Roma (compara contra `index.html`) |
| H24 **[nuevo]** | `app/components/PracticaSection.vue:69` | `MEDIA_TITLES` (Libros / Películas… / «Y para escuchar de fondo mientras preparáis maletas») | genérico; se queda. `category` sigue siendo enum cerrado |
| H25 **[nuevo]** | `app/components/TripView.vue:84` + `useCardNavigation.ts` (`querySelectorAll('section')`) | el scrollspy toma **todos** los `<section>` del documento | cualquier bloque nuevo (opciones A/B, bases) debe ser `<div>`, nunca `<section>` |

**No son acoplamientos** (se verificó): `DaySection.vue` (textos de «Caminar menos» genéricos), `TheHero.vue` (todo sale de `trip`; los textos del selector de ritmo son genéricos), `dayLabel.ts` (capitaliza el eyebrow en italiano; vale para Campania), `LeafletMap` ya hace `fitBounds` sobre **todos** los marcadores (`:138`) → el mapa multi-ciudad funciona sin cambiar el algoritmo.

---

## 3. Arquitectura objetivo

### System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ RUTAS (prerender estático, cada una es un documento HTML independiente)      │
│  /  → pages/index.vue ─ TripIndex  (+ script de redirección de hash legado)  │
│  /trips/[slug]/ → pages/trips/[slug].vue ─ guard 404 ─ TripView :slug        │
├──────────────────────────────────────────────────────────────────────────────┤
│ TripView (dueño de la página)                                                 │
│  useTrip(slug) ─► provide(TripContextKey, { slug, data… })                    │
│  useHead({ title: trip.headTitle })                                           │
│  layout = buildTripLayout(trip, days, refById, food, artists)  (util pura)    │
│  ┌────────┐ ┌────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐    │
│  │ Topbar │ │TheHero │ │ #mapa         │ │ v-for days    │ │ v-for layout │    │
│  │ brand  │ │SearchBox│ │ LeafletMap    │ │ DaySection    │ │ .sections    │    │
│  │NavPills│ │ modos  │ │ legend (data) │ │ (+DayOptions) │ │ Reservas/…   │    │
│  └────────┘ └────────┘ └──────────────┘ └───────────────┘ └──────────────┘    │
├──────────────────────────────────────────────────────────────────────────────┤
│ CONTROLLERS (efectos, montados una vez por página) — todos keyed por slug    │
│  useCardNavigationController(slug)   useSearchController() ← inject slug     │
│  useTripModesController() ← inject slug ─► tripStorageKey(slug, 'pace')      │
├──────────────────────────────────────────────────────────────────────────────┤
│ DATOS: Nuxt Content v3 (type:data YAML + zod), glob trips/*/…                 │
│  content/trips/roma/…   content/trips/campania/…                              │
│  shared/schemas.ts (evolución SOLO aditiva; Roma valida sin tocar su shape)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (nuevo vs modificado)

| Componente / módulo | Estado | Responsabilidad en v1.1 |
|---------------------|--------|-------------------------|
| `app/pages/index.vue` | **MODIFICADO (reescrito)** | Portada: renderiza `<TripIndex>`; `useHead` con título de portada + script inline de redirección de hash legado |
| `app/components/TripIndex.vue` | **NUEVO** | Lista de viajes (`queryCollection('trip').all()` ordenada por `startDate`), tarjetas con enlace `<a href>` de documento completo a `/trips/<slug>/` |
| `app/pages/trips/[slug].vue` | sin cambios funcionales | Guard 404 + `<TripView :slug>` (ya existe). Ahora SÍ se prerenderiza |
| `app/components/TripView.vue` | **MODIFICADO (mayor)** | `provide` del contexto; días por `v-for`; secciones por `layout`; leyenda/pie/título desde `trip` |
| `app/composables/useTripContext.ts` | **NUEVO** | `TripContextKey` + `provideTripContext(slug)` + `useTripSlug()` (inject con error explícito si falta) |
| `app/utils/tripLayout.ts` | **NUEVO** (puro) | `buildTripLayout(...)` → `{ sections: SectionDef[], pills: Pill[] }`; única fuente de orden/presencia de secciones y pastillas |
| `app/utils/tripStorage.ts` | **NUEVO** (puro) | `tripStorageKey(slug, name)` → `${slug}-${name}`; garantiza `roma-pace` byte-idéntico |
| `app/components/Topbar.vue` | **MODIFICADO** | prop `brand` (o `trip`) en vez de literal |
| `app/components/NavPills.vue` | **MODIFICADO** | prop `pills` (de `buildTripLayout`) en vez de 7 literales |
| `app/components/DaySection.vue` | **MODIFICADO (aditivo)** | monta `<DayOptions>` solo si `day.options` existe |
| `app/components/DayOptions.vue` | **NUEVO** | bloques «Opción A / B» (cada uno con timeline + fichas + ruta propia); raíz `<div>`, nunca `<section>` |
| `app/components/ReservasSection.vue` | **MODIFICADO** | títulos desde datos con `v-if` (Roma los aporta verbatim) |
| `app/components/GastroSection.vue` | **MODIFICADO (mínimo)** | pasa `section.groupOrder` a `groupFood` |
| `app/utils/foodGroups.ts` | **MODIFICADO** | `groupFood(items, order = [])`; se elimina `FOOD_GROUP_ORDER` del código (pasa a `roma/trip.yml`) |
| `app/utils/mapMarkers.ts` | **MODIFICADO (aditivo)** | `MARKER_STYLE` por tipo (colores + texto de popup); `PlaceType` ampliado |
| `app/components/LeafletMap.client.vue` | **MODIFICADO (mínimo)** | consume `MARKER_STYLE`; nada más (ya hace `fitBounds` global) |
| `app/composables/useSearch.ts` | **MODIFICADO** | slug inyectado; índice por slug; claves `useState` por slug |
| `app/composables/useCardNavigation.ts` | **MODIFICADO** | `useCardNavigationController(slug)`; claves `useState` por slug |
| `app/composables/useTripModes.ts` | **MODIFICADO** | claves `useState` y `localStorage` derivadas del slug |
| `app/components/MonumentCard.vue` | **MODIFICADO (1 línea)** | `NOTE_KEY = tripStorageKey(monument.trip, \`note-${slug}\`)` (usa el campo `trip` que el monumento ya trae; sin inject) |
| `app/app.vue` | **MODIFICADO** | quita `title` (lo pone cada página); conserva favicons, `lang`, `theme-color` |
| `app/assets/css/multitrip.css` | **NUEVO** | SOLO reglas nuevas (portada, `.day-option`, `.tl-transport.car|ferry|bus`, `.day-stats-item.car|ferry|bus`, `.badge-*` nuevos). Se carga **después** de `base.css`; no redefine ningún selector existente |
| `nuxt.config.ts` | **MODIFICADO** | `prerender.routes` derivado de `content/trips/*`; `css` + `multitrip.css` |
| `shared/schemas.ts` | **MODIFICADO (aditivo)** | §5.1 |
| `content/trips/roma/trip.yml` (+ `reference/reservas.yml`) | **MODIFICADO (aditivo)** | recibe verbatim los textos que salen del código (marca, título, pie, leyenda, orden de grupos, títulos de reservas, fechas ISO) |
| `content/trips/campania/**` | **NUEVO** | segundo viaje |
| `tests/parity/_harness.ts` | **NUEVO** | URL de Roma, arranque de servidor estático y `waitForServer` compartidos (hoy duplicados en 11 specs) |

---

## 4. Estructura de proyecto recomendada (delta)

```
app/
├── pages/
│   ├── index.vue                 # MOD: portada (TripIndex) + redirección de hash legado
│   └── trips/[slug].vue          # =   (ahora prerenderizada)
├── components/
│   ├── TripIndex.vue             # NEW
│   ├── DayOptions.vue            # NEW (Campania: días con opción A/B)
│   ├── TripView.vue              # MOD
│   ├── Topbar.vue NavPills.vue   # MOD
│   ├── DaySection.vue ReservasSection.vue GastroSection.vue LeafletMap.client.vue MonumentCard.vue  # MOD (pequeño)
├── composables/
│   ├── useTripContext.ts         # NEW
│   ├── useSearch.ts useCardNavigation.ts useTripModes.ts   # MOD (keyed por slug)
├── utils/
│   ├── tripLayout.ts             # NEW (puro, Vitest)
│   ├── tripStorage.ts            # NEW (puro, Vitest)
│   ├── foodGroups.ts mapMarkers.ts   # MOD
└── assets/css/multitrip.css      # NEW (solo aditivo)
content/trips/
├── roma/…                        # MOD aditivo (trip.yml, reference/reservas.yml)
└── campania/{trip.yml,days/,monuments/,food/,reference/}   # NEW (artists/ opcional)
tests/
├── parity/_harness.ts            # NEW
├── parity/index-redirect.spec.ts # NEW (portada + hash legado + sin sql_dump)
├── parity/campania-smoke.spec.ts # NEW (render + mapa + búsqueda acotada)
├── unit/tripLayout.spec.ts tripStorage.spec.ts   # NEW
└── data/*                        # MOD: iterar trips/*
```

### Structure Rationale

- **`utils/tripLayout.ts` puro:** el proyecto no tiene `@nuxt/test-utils` instalado (ver `package.json`); toda la lógica testeable vive en utils puras que Vitest carga sin runtime Nuxt (patrón ya consolidado en `cardNav.ts`, `dayRoute.ts`…). La forma de cada viaje (qué secciones, en qué orden, qué pastillas) se convierte en una función pura con test, y `TripView`/`NavPills` solo la pintan.
- **`multitrip.css` separado:** el CSS verbatim (`base.css`) es la garantía de paridad por construcción. Añadir reglas en un fichero aparte hace auditable que **ningún selector existente cambia** (un `git diff app/assets/css/base.css` vacío es la prueba).
- **`_harness.ts`:** hoy cada spec de paridad repite `STATIC_URL`, `ensureBuild`, `serve`, `waitForServer`. Mover Roma de URL es un cambio de **una constante** si antes se factoriza; si no, son 11 ediciones con riesgo de olvidar una.

---

## 5. Patrones arquitectónicos

### 5.1 Evolución del esquema: estrictamente aditiva

**Regla:** todo campo nuevo es `.optional()` (o `.default()` sin efecto en el render de Roma), todo enum se **amplía** (nunca se renombra un valor). Un YAML de Roma de la v1.0 debe seguir validando **sin modificarse**; luego, en una fase separada, Roma recibe los campos nuevos con valores verbatim.

| Esquema | Campo nuevo | Uso | Roma |
|---------|-------------|-----|------|
| `TripSchema` | `brand?: { lead: string, tail: string }` | Topbar (`lead ✦ tail`) | `Roma` / `giugno MMXXVI` |
| `TripSchema` | `headTitle?: string` | `<title>` | `Roma · 19—23 giugno 2026` (em-dash) |
| `TripSchema` | `footer?: Md[]` | líneas del pie unidas con `<br>` | 3 líneas verbatim (`_Pay_`) |
| `TripSchema` | `map.legend?: Md` | leyenda del mapa | texto Einaudi verbatim |
| `TripSchema` | `startDate?`, `endDate?` (ISO `YYYY-MM-DD`), `summary?: Md`, `cover?: {src, alt}` | portada (orden + tarjeta) | `2026-06-19` / `2026-06-23` |
| `TripSchema` | `sections.gastronomia.groupOrder?: string[]` | orden de grupos gastro | los 7 de `FOOD_GROUP_ORDER` |
| `TripSchema` | `sectionOrder?: SectionId[]` | orden de secciones de referencia | omitido (default = orden de Roma) |
| `TripSchema` | `bases?: Array<{ name, from, to, coords, address? }>` | varias bases (Nápoles / Ischia / Salerno) → info-grid + marcador `base` | omitido |
| `TripSchema` | `mapExtras[].type` | admite `base`/`nature` | sin cambio |
| `ReservasSchema` (+ `ReferenceRowSchema`) | `confirmedTitle?`, `visitsTitle?`, `tableTitle?` | cabeceras de reservas | verbatim |
| `DaySchema` | `options?: Array<{ key: string, label: string, title: string, intro?: Md, timeline: TimelineRow[], cards: string[] }>` | días opción A/B | omitido |
| `DaySchema` | `base?: string` | a qué base pertenece el día | omitido |
| `DaySchema.stats[].variant` | + `car`, `ferry`, `bus`, `bike`, `swim`… | iconos de estadística | sin cambio |
| `TimelineRow(transport).variant` | + `car`, `ferry`, `bus` (+ `metro` ya existe en CSS:515 pero no en el enum) | color de banda de transporte | sin cambio |
| `PlaceType` | + `nature`, `base` | marcadores (y sus colores) | sin cambio |
| `FoodSchema.badgeKind` | + los que pida Campania (p. ej. `mozzarella`, `agriturismo`, `friggitoria`) | clase `.badge-*` | sin cambio |
| `Motif` | + motivos naturales (`beach`, `volcano`, `boat`, `village`…) con su SVG en `svgMotifs.ts` | fallback de imagen | sin cambio |

**Restricciones heredadas que siguen mandando** (de `shared/schemas.ts` y decisiones v1.0):
- Nada de `.refine()` para cross-refs: las invariantes entre ficheros viven en `tests/data/invariants.spec.ts`.
- `meta` e `id` son nombres reservados de Content v3 → no usarlos en campos nuevos (p. ej. **no** llamar `meta` a nada de `bases` ni de `options`).
- Las colecciones que son `discriminatedUnion` (`artist`, `reference`) se registran con su superset plano (`ArtistRowSchema`, `ReferenceRowSchema`); **todo campo nuevo de `ReservasSchema` debe añadirse también a `ReferenceRowSchema`**, o Content no genera la columna y llega `null` (bug ya sufrido en v1.0, D-04-D).
- `DaySchema.options` es un array de objetos anidado dentro de una colección `z.object` normal → se serializa como JSON en una columna; no requiere superset.

**Por qué opciones A/B como campo anidado y no como días separados:** mantener la invariante «un día = una `<section>` = una pastilla». Dos días «jueves-a»/«jueves-b» duplicarían pastillas, romperían el conteo del scrollspy y obligarían a la portada a explicar qué es un día. Las opciones son *sub-bloques* del día.

### 5.2 Contexto de viaje: `provide/inject` + slug explícito donde ya hay acceso

**Qué:** `TripView` es el único sitio que conoce el slug con certeza. Lo publica una vez; los controllers montados en descendientes lo leen; los que se invocan dentro del propio `TripView` lo reciben como argumento.

```typescript
// app/composables/useTripContext.ts
import type { InjectionKey } from 'vue'
export const TripSlugKey: InjectionKey<string> = Symbol('tripSlug')
export function provideTripSlug(slug: string) { provide(TripSlugKey, slug) }
export function useTripSlug(): string {
  const slug = inject(TripSlugKey, null)
  if (!slug) throw new Error('useTripSlug() fuera de <TripView>')
  return slug
}

// TripView.vue (setup)
provideTripSlug(props.slug)
const { trip, days, … } = await useTrip(props.slug)
await useCardNavigationController(props.slug)   // H6: argumento, no inject (mismo componente)

// useSearch.ts
export async function useSearchController() {
  const slug = useTripSlug()                   // ← ANTES del primer await (regla de inject)
  …
  const { monById } = await useTrip(slug)
}
```

**Trampa clave:** `inject()` solo funciona en el tramo **síncrono** del `setup`, antes del primer `await`. Los tres controllers actuales ya registran sus hooks antes de su `await useTrip(…)` (patrón documentado en `useSearch.ts`/`useCardNavigation.ts`); el `useTripSlug()` debe ir en ese mismo tramo. Alternativa descartada: `useState('trip:slug')` global — reintroduce un singleton que puede quedar rancio entre rutas.

**Claves de `useState` por viaje:** `useState(\`pace:${slug}\`)`, `useState(\`search:query:${slug}\`)`, `useState(\`cardNav:stack:${slug}\`)`. El accesor puro (`useTripModes()`, `useSearch()`, `useCardNavigation()`) obtiene el slug con `useTripSlug()`; todos sus consumidores (`TimelineStop`, `TimelineTransport`, `NavPills`, `BackButton`, `SearchBox`, `TheHero`) son descendientes de `TripView`, así que el inject resuelve. El cambio de clave no altera el HTML (las claves solo viven en el payload).

**Índice de búsqueda (H8):** sustituir el `shallowRef` de módulo por `const indexes = new Map<string, MiniSearch>()` (también a nivel de módulo, sigue sin serializarse) y leer `indexes.get(slug)` en `onInput`.

### 5.3 Forma del viaje como función pura (`buildTripLayout`)

```typescript
// app/utils/tripLayout.ts
export type SectionId = 'reservas' | 'gastronomia' | 'practica' | 'arte' | 'arquitectura'
export const DEFAULT_SECTION_ORDER: SectionId[] = ['reservas', 'gastronomia', 'practica', 'arte', 'arquitectura']
export const SECTION_PILL: Record<SectionId, string> =
  { reservas: 'Reservas', gastronomia: 'Gastronomía', practica: 'Pratica', arte: 'Arte', arquitectura: 'Arquitectura' }

export function buildTripLayout(input: {
  order?: SectionId[], days: { slug: string, eyebrow: string }[],
  has: Record<SectionId, boolean>,         // presencia derivada de los datos
}) {
  const sections = (input.order ?? DEFAULT_SECTION_ORDER).filter(id => input.has[id])
  const pills = [
    { id: 'inicio', label: 'Inicio' }, { id: 'mapa', label: 'Mapa' },
    ...input.days.map(d => ({ id: d.slug, label: dayLabel(d.eyebrow) })),
    ...sections.map(id => ({ id, label: SECTION_PILL[id] })),
  ]
  return { sections, pills }
}
```

Presencia por datos: `reservas` ⇔ `refById.has('reservas')`; `gastronomia` ⇔ `food.length > 0`; `practica` ⇔ `refById.has('practica')`; `arte` ⇔ hay `kind:'artist'`; `arquitectura` ⇔ hay `kind:'arquitectura'|'glossary'`. Test unitario obligatorio: **con los datos reales de Roma devuelve exactamente las 12 pastillas actuales en el orden actual** (es el test que protege H5/H14 sin depender de Playwright).

Nota de paridad sobre «Pratica» (italiano en la pastilla, «Práctica» en otros sitios): es grafía verbatim del `index.html`; se mantiene como etiqueta UI fija. Campania la heredará; si se quiere cambiar, es una decisión de producto que **rompería Roma** → fuera de alcance.

### 5.4 Enrutado: documentos independientes, no SPA entre viajes

**Qué:** la portada enlaza a cada viaje con `<a href="/guiaRoma/trips/<slug>/">` (o `<NuxtLink external>`), es decir **navegación de documento completo**, no navegación en cliente.

**Por qué:**
1. **Aislamiento de estado gratis.** Cada viaje arranca con `useState`, listeners de `document`, `bodyAttrs` (`light-mode`, `modo-resumen`) e índice MiniSearch limpios. Las claves por slug (§5.2) son defensa en profundidad, no la única barrera.
2. **Mismo camino de hidratación que Roma en v1.0.** Roma hoy siempre se carga como documento con su payload prerenderizado. Con navegación en cliente, cualquier `queryCollection` cuyo resultado no esté en el payload hace que Nuxt Content descargue el volcado SQLite completo (`/__nuxt_content/<colección>/sql_dump.txt`) e inicialice SQLite en WASM en el navegador — peso extra y un punto de fallo offline. (MEDIUM: documentado en content.nuxt.com/docs/advanced/database y reportes comunitarios.)
3. **Roma no gana enlaces nuevos.** Un «← Todos los viajes» en el chrome de Roma movería píxeles del `#inicio`/Topbar (goldens). No se añade en v1.1 salvo decisión explícita con re-baseline controlado.

`crawlLinks: true` sigue esos `<a href>` desde `/`, pero no se confía solo en eso: `prerender.routes` se deriva en `nuxt.config.ts` leyendo `content/trips/*/trip.yml` con `node:fs` (tiempo de configuración, sin runtime). Así un viaje que no esté enlazado (borrador) se puede excluir explícitamente con un flag `draft: true` en `trip.yml` (opcional).

URL canónica **con barra final** (`/trips/roma/`): con `autoSubfolderIndex` la salida es `trips/roma/index.html`; GitHub Pages redirige `/trips/roma` → `/trips/roma/` (301, el hash se conserva). Enlaces y tests deben usar ya la forma con barra para no depender de esa redirección.

### 5.5 Persistencia por viaje sin migración: prefijo = slug

`tripStorageKey(slug, name) = \`${slug}-${name}\``. Para Roma produce **exactamente** `roma-pace`, `roma-light`, `roma-resumen`, `roma-note-<ficha>` → las preferencias y notas guardadas hoy siguen funcionando sin escribir código de migración, y `modes.spec.ts` (que siembra `roma-pace` con `addInitScript`) sigue verde sin tocarse. Campania obtiene `campania-*`.

- Requisito para que el prefijo sea inequívoco: **slug de viaje sin guiones** (`^[a-z0-9]+$`), validado en `TripSchema` (regex aditiva; `roma` cumple) e invariante en `tests/data`. Así `roma-note-x` nunca colisiona con un viaje llamado `roma-note`. Por eso el slug recomendado es `campania`, no `campania-2027` (el año va en `title`/`startDate`).
- Descartado: espacio de nombres nuevo (`guia:v1:<slug>:pace`) + migración de `roma-*`. Más código, una ventana de pérdida de datos si falla a medias, y obliga a reescribir los tests de persistencia — todo para un beneficio cosmético.
- `roma-theme` (color-mode) se conserva global (H21).

### 5.6 Redirección de enlaces legados `/#ancla`

Los enlaces compartidos a la guía viva son `…/guiaRoma/#viernes`, `…/guiaRoma/#pantheon`. El hash no llega al servidor, así que la redirección es en cliente y **antes del primer pintado**:

```typescript
// pages/index.vue
const base = useRuntimeConfig().app.baseURL   // '/guiaRoma/'
useHead({ script: [{
  tagPosition: 'head',
  innerHTML: `(function(h){if(h&&h.length>1)location.replace(${JSON.stringify(base)}+'trips/roma/'+h)})(location.hash)`,
}] })
```

- Regla simple: **cualquier hash en la portada → Roma**, porque la portada no tiene anclas propias (requisito de diseño de `TripIndex`: sin `id` enlazables). Evita mantener una lista blanca de ~100 anclas.
- `location.replace` (no `assign`) para no dejar la portada en el historial.
- Sin hash, `/guiaRoma/` muestra la portada (decisión de milestone).
- Test nuevo (`index-redirect.spec.ts`): `goto('/guiaRoma/#pantheon')` → URL final `/guiaRoma/trips/roma/#pantheon` y la ficha visible.

---

## 6. Flujo de datos

### Antes (v1.0)

```
/ ─► index.vue ─► TripView('roma') ─► useTrip('roma') ─┬─► props a secciones
                                                      ├─► useCardNavigationController ─► useTrip('roma')  (fijo)
TheHero ─► useTripModesController ─► localStorage 'roma-*' (fijo)
SearchBox ─► useSearchController ─► useTrip('roma') (fijo) ─► indexRef (módulo, único)
MonumentCard ─► localStorage 'roma-note-*' (fijo)
```

### Después (v1.1)

```
/                ─► index.vue ─► TripIndex ─► queryCollection('trip').all()  (payload prerender)
/trips/:slug/    ─► [slug].vue (404 guard) ─► TripView(slug)
                    ├─ provideTripSlug(slug)
                    ├─ useTrip(slug)  ─► useAsyncData keys `*-${slug}` (dedup con todos los consumidores)
                    ├─ useHead(title = trip.headTitle)
                    ├─ buildTripLayout(...) ─► Topbar/NavPills(pills) + v-for sections
                    ├─ useCardNavigationController(slug) ─► useState `cardNav:*:${slug}`
                    ├─ TheHero ─► useTripModesController() ─► useTripSlug() ─► tripStorageKey(slug,…)
                    ├─ SearchBox ─► useSearchController() ─► useTripSlug() ─► indexes.get(slug)
                    ├─ LeafletMap(slug) ─► deriveMarkers + MARKER_STYLE ─► fitBounds(todos)
                    └─ MonumentCard ─► tripStorageKey(monument.trip, 'note-'+slug)
```

### Key Data Flows

1. **Carga de un viaje:** documento estático `/trips/<slug>/index.html` + `_payload.json` → hidratación sin consultas SQL en cliente (todas las `useAsyncData` resueltas en prerender). Igual que Roma en v1.0.
2. **Forma de la página:** datos → `buildTripLayout` → lista ordenada de secciones y pastillas; el `v-for` de días usa `days` (ordenados por `order`). Una sola fuente para secciones y pastillas.
3. **Persistencia:** slug → `tripStorageKey` → `localStorage`; Roma conserva sus claves byte a byte.
4. **Mapa multi-ciudad:** `setView(trip.map.center, zoom)` inicial (anti-salto) → `fitBounds` sobre monumentos + `mapExtras` + `bases`. Para Campania (Nápoles–Cilento, ~150 km) el `fitBounds` da el encuadre regional; el `center/zoom` del YAML debe ser regional para que el primer frame no salte.

---

## 7. Anti-patrones a evitar

### AP1: Defaults con valores de Roma en el código
**Qué:** `brand ?? 'Roma ✦ giugno MMXXVI'`, `confirmedTitle ?? '✅ Ya reservado · 3 comensales'`.
**Por qué es malo:** Campania heredaría silenciosamente «3 comensales» o la marca de Roma; el acoplamiento sigue ahí, solo escondido.
**En su lugar:** el texto se mueve al YAML de Roma; el componente hace `v-if` sobre el campo. Lo único que se queda en código son textos de UI genuinamente genéricos (H3, H17, H24, selector de ritmo).

### AP2: Cambiar código y arnés de tests en la misma fase
**Por qué es malo:** si los goldens fallan no se sabe si es el código o el arnés.
**En su lugar:** fases 9–10 tocan código con el arnés intacto (Roma sigue en `/`); la fase 11 mueve la URL sin tocar componentes. Ver §8.

### AP3: Re-baselinar goldens para «arreglar» un fallo
**Por qué es malo:** destruye la referencia de paridad (`tests/README.md` §3).
**En su lugar:** los 56 PNG no se escriben en todo el milestone. Si un fallo de píxel aparece, se arregla el código. Excepción solo por decisión explícita del usuario (memoria: «paridad pragmática»: exponer coste/beneficio y parar a preguntar).

### AP4: `<section>` en bloques nuevos
**Por qué es malo:** el scrollspy (`useCardNavigation.ts`, `querySelectorAll('section')`) los convertiría en candidatos a pastilla activa (H25).
**En su lugar:** `<div class="day-option">` etc.

### AP5: Un día por opción A/B
Ver §5.1. Duplica pastillas y rompe «día = sección».

### AP6: Prerender solo vía `crawlLinks`
Un viaje no enlazado o un enlace mal formado = viaje ausente del deploy sin error. `prerender.routes` explícito + `failOnError: true` (ya activo).

### AP7: Editar `base.css` para variantes nuevas
Cualquier edición del CSS verbatim es riesgo de paridad no detectable a simple vista. Todo selector nuevo va a `multitrip.css`.

---

## 8. Orden de construcción (fases) — Roma en verde en cada paso

Numeración continuando la v1.0 (fases 1-8). Cada fase termina con `rm -rf .data .nuxt .output && pnpm verify` en verde (memoria del proyecto: la caché de Content rinde contenido rancio si no se limpia).

### Fase 9 — Contexto de viaje y desacople de singletons (refactor invisible, Roma sigue en `/`)
- **Crea:** `useTripContext.ts`, `utils/tripStorage.ts` (+ `tests/unit/tripStorage.spec.ts`: `tripStorageKey('roma','pace') === 'roma-pace'`).
- **Modifica:** `useSearch.ts` (H7, H8, H9), `useCardNavigation.ts` (H6, H9), `useTripModes.ts` (H9, H10), `MonumentCard.vue:123` (H11), `TripView.vue:64-68` (provide + slug al controller).
- **Tests de datos:** generalizar `schema.spec`/`invariants.spec` a `trips/*` (H23) + invariante «slug de viaje sin guiones» + «`trip` de cada fichero == nombre de su carpeta» + «ids DOM únicos dentro de un viaje» (días, monumentos, food, artistas, secciones fijas `inicio`/`mapa`/…).
- **Puerta:** `pnpm verify` sin tocar ningún spec de paridad. Riesgo bajo. Dependencias: ninguna.

### Fase 10 — Forma y chrome desde datos (Roma sigue en `/`)
- **Esquema (aditivo):** `brand`, `headTitle`, `footer`, `map.legend`, `sections.gastronomia.groupOrder`, `sectionOrder?`, `startDate/endDate/summary/cover`, títulos de `ReservasSchema` (+ `ReferenceRowSchema`).
- **Primero** el esquema y se comprueba que el YAML de Roma **sin cambios** valida; **después** se añaden los valores verbatim a `roma/trip.yml` y `roma/reference/reservas.yml`.
- **Crea:** `utils/tripLayout.ts` (+ test con datos reales de Roma = 12 pastillas actuales).
- **Modifica:** `TripView.vue` (H1, H2, H4, H5, H13 vía `useHead`), `Topbar.vue` (H12), `NavPills.vue` (H14), `app.vue` (H13), `ReservasSection.vue` (H16), `foodGroups.ts` + `GastroSection.vue` (H15; actualizar `tests/unit/foodGroups.spec.ts` para pasar el orden), `mapMarkers.ts` + `LeafletMap.client.vue` (H18, sin tipos nuevos todavía).
- **Puerta:** goldens intactos. Puntos de mayor riesgo de píxel: el pie (`<br>` + MDC + espacios en blanco de la plantilla) y la marca (`brand-dot`). Comprobar con `render-*.spec`/`shell.spec:158` y el visual-diff. Revisar que `tests/data/migration-diff.spec.ts` no cuente como «texto nuevo» lo que ahora vive en `trip.yml`.
- **Dependencias:** Fase 9 (TripView ya provee contexto).

### Fase 11 — Rutas multi-viaje: portada, Roma a `/trips/roma/`, redirección, prerender
- **Arnés primero (commit propio):** extraer `tests/parity/_harness.ts` con `ROMA_URL`, sin cambiar aún su valor; ejecutar la puerta (debe dar los mismos 80 tests en verde).
- **Después:** `pages/index.vue` (portada + script de hash), `TripIndex.vue`, `multitrip.css` (solo estilos de portada), `nuxt.config.ts` (`prerender.routes` desde `content/trips/*`, `css`), `ROMA_URL = /guiaRoma/trips/roma/`, invertir `shell.spec.ts:186` (debe existir `trips/roma/index.html`), retirar la exclusión #2 de dev-routing si el estático ya cubre `/trips/roma` (o mantenerla y documentarlo), nuevo `index-redirect.spec.ts` (portada lista viajes; `/#pantheon` → `/trips/roma/#pantheon`; ninguna petición a `sql_dump` ni `.wasm` al cargar portada y Roma).
- **Puerta:** los **mismos 56 PNG**, sin re-baseline, ahora capturados en `/guiaRoma/trips/roma/` → esta es la prueba de «Roma idéntica en su nueva URL». Actualizar el registro de conteo de `tests/README.md` §4 (los nuevos tests cambian el total; documentarlo es la defensa contra sobre-exclusión).
- **Dependencias:** Fase 10 (`<title>` y portada necesitan `headTitle`/`startDate`). Riesgo medio (infra de tests), pero aislado: cero cambios en componentes de Roma.

### Fase 12 — Extensiones de esquema y UI para la forma de Campania (con un esqueleto mínimo)
- **Esquema (aditivo):** `DaySchema.options`, `DaySchema.base`, `TripSchema.bases`, variantes `car/ferry/bus` (transporte y stats), `PlaceType` + `nature`/`base`, `badgeKind` y `Motif` nuevos (con sus SVG en `svgMotifs.ts`).
- **Crea:** `DayOptions.vue`; reglas nuevas en `multitrip.css`; entradas nuevas en `MARKER_STYLE`.
- **Contenido:** `content/trips/campania/` con un **esqueleto** (trip.yml + 2-3 días, uno con opciones A/B, varias bases, 3-4 fichas incluida una `nature`) para ejercitar cada forma nueva. Si se quiere publicar solo al final, `draft: true` lo excluye de `prerender.routes` y de la portada.
- **Tests:** `campania-smoke.spec.ts` (render de días/opciones, mapa con N marcadores y `fitBounds`, búsqueda que **no** devuelve fichas de Roma, notas con clave `campania-note-*`, modo «Caminar menos» independiente de Roma).
- **Puerta:** Roma intacta + smoke de Campania. Dependencias: Fase 11 (ruta prerenderizada).

### Fase 13 — Contenido de Campania 2027
- Redacción de días, fichas, gastronomía, práctica y reservas a partir de `.planning/inputs/campania-2027-itinerario-raw.md`. **Bloqueante:** el input tiene huecos declarados (días 20-23 sin encabezado, «Opción 2» del día con coche ausente, días 25-28 sin contenido, orden de Procida/Ischia/Salerno sin confirmar) → hace falta una ronda con el usuario antes o al inicio de la fase.
- Solo YAML + imágenes/motivos; no debería tocar componentes. Si aparece una forma no prevista, vuelve a Fase 12 (no se parchea en la fase de contenido).
- Puerta: `test:data` (esquema + invariantes por viaje) + smoke. Opcional al final: capturar goldens **propios de Campania** (en un directorio de snapshots separado, nunca mezclado con los 56 de Roma) como red de regresión futura.

### Fase 14 — Verificación del milestone
- `pnpm verify` completo, conteo de tests registrado, revisión de `git diff main -- app/assets/css/base.css` (vacío), sign-off humano de Roma en `/trips/roma/` y de Campania en móvil real (offline: cargar, cortar red, navegar).
- El merge a `main` + deploy de Pages sigue siendo acto de ship separado (heredado de D-08 v1.0). Atención: al desplegar, `/guiaRoma/` pasa a ser la portada — la redirección de hash es lo que salva los enlaces compartidos.

**Razonamiento del orden:**
- 9 → 10 → 11: primero se hace el código independiente del viaje **mientras Roma sigue en la URL que los tests conocen**; luego se mueve la URL **sin tocar código**. Cada fallo de paridad tiene un único sospechoso.
- 11 antes que 12: un segundo viaje solo se puede ver y probar si ya hay rutas prerenderizadas por viaje.
- 12 antes que 13: la forma (esquema + componentes) se estabiliza con un esqueleto antes de redactar ~decenas de ficheros que dependen de ella; el contenido no debe esperar a decisiones de esquema ni forzarlas.
- Las fases 9-11 no dependen del contenido de Campania → pueden avanzar mientras el usuario completa el itinerario.

---

## 9. Escalabilidad (en términos de este producto)

| Aspecto | 2 viajes | ~10 viajes | Observación |
|---------|----------|------------|-------------|
| Build | segundos extra | lineal en ficheros | prerender por ruta; nada que hacer |
| Volcado SQLite en cliente | no se descarga (navegación de documento + payload) | igual | si algún día se pasa a navegación SPA, el volcado incluye **todos** los viajes: revisar entonces |
| Pastillas de navegación | Campania ~10 días + 7 = 17 pastillas | igual por viaje | `.nav-pills` ya hace scroll horizontal; validar en móvil en Fase 12 |
| Marcadores del mapa | decenas, región amplia | igual por viaje | sin clustering (dependencia extra innecesaria); revisar solo si se solapan en exceso |
| Portada | lista simple | lista ordenada por fecha | sin filtros/búsqueda global en v1.1 |

---

## 10. Integraciones y puntos de verificación

| Punto | Cómo verificar | Fase |
|-------|----------------|------|
| `tripStorageKey('roma', …)` == claves v1.0 | unit test + `modes.spec.ts` sin cambios | 9 |
| Pastillas de Roma idénticas | `tripLayout.spec.ts` con datos reales + `navigation.spec.ts` | 10 |
| `<title>` de Roma idéntico | `shell.spec.ts:172` (cabecera D-09) | 10-11 |
| Roma pixel-idéntica en nueva URL | `visual-diff.spec.ts` con los 56 PNG congelados | 11 |
| `.output/public/trips/<slug>/index.html` existe por viaje | `shell.spec.ts` invertido | 11 |
| Hash legado redirige | `index-redirect.spec.ts` | 11 |
| Sin descarga de `sql_dump`/WASM | listener de `request` en Playwright | 11 |
| CSS verbatim intacto | `git diff -- app/assets/css/base.css tokens.css leaflet.css` vacío | todas |
| Aislamiento de búsqueda/notas/modos entre viajes | `campania-smoke.spec.ts` | 12 |

---

## Sources

- Lectura directa del código (HIGH): `app/components/TripView.vue`, `Topbar.vue`, `NavPills.vue`, `TheHero.vue`, `DaySection.vue`, `LeafletMap.client.vue`, `SearchBox.vue`, `BackButton.vue`, `MonumentCard.vue`, `GastroSection.vue`, `ReservasSection.vue`, `PracticaSection.vue`, `TimelineStop.vue`, `TimelineTransport.vue`; `app/composables/useTrip.ts`, `useSearch.ts`, `useCardNavigation.ts`, `useTripModes.ts`; `app/utils/*.ts`; `app/pages/index.vue`, `app/pages/trips/[slug].vue`, `app/app.vue`; `shared/schemas.ts`; `content.config.ts`; `nuxt.config.ts`; `tests/README.md`, `tests/parity/*.spec.ts`, `tests/data/*.spec.ts`, `playwright*.config.ts`; `content/trips/roma/trip.yml`, `days/viernes.yml`; `app/assets/css/base.css` (selectores `.badge-*`, `.tl-transport.*`, `.day-stats-item.*`).
- `.planning/PROJECT.md` (requisitos activos v1.1 y decisiones) y `.planning/inputs/campania-2027-itinerario-raw.md` (formas nuevas: opciones A/B, naturaleza, varias bases, coche/ferry) — HIGH.
- [Nuxt Content — Database (volcado SQLite y WASM en cliente)](https://content.nuxt.com/docs/advanced/database) — MEDIUM.
- [Nuxt Content — Static deploy](https://content.nuxt.com/docs/deploy/static) — MEDIUM.
- [Nuxt Content v3 announcement](https://content.nuxt.com/blog/v3) — MEDIUM.
- [Two megabytes for four lines (dev.to)](https://dev.to/mstrauch/two-megabytes-for-four-lines-131p) y [nuxt content db and size](https://damieng.com/blog/2024/nuxt-content-db-and-size/) — coste del volcado en cliente — LOW/MEDIUM (comunidad).
- [nuxt/content#3607](https://github.com/nuxt/content/issues/3607) — volcados bajo `app.baseURL` personalizado — MEDIUM.
