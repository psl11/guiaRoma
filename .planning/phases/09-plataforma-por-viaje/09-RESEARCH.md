# Phase 9: Plataforma por viaje - Research

**Researched:** 2026-11-20
**Domain:** Refactor de estado por viaje en Nuxt 4 (provide/inject + `useState` sufijado + `localStorage` por slug) y generalización de la puerta de datos (Vitest Node-puro) a N viajes
**Confidence:** HIGH (todo el inventario se ha leído en el código de esta rama; el comportamiento de Vue `inject` y las columnas reservadas de Content se han verificado en `node_modules`)

## Summary

El refactor es mecánico y está bien acotado: tres controllers (`useSearch`, `useCardNavigation`, `useTripModes`) y un componente (`MonumentCard`) fijan Roma mediante `useTrip('roma')`, claves `useState` globales, un índice MiniSearch a nivel de módulo y claves `localStorage` literales `roma-*`. Todos sus consumidores (`Topbar→NavPills`, `TheHero→SearchBox`, `DaySection→Timeline*/MonumentCard`, `BackButton`) cuelgan de `TripView`, así que un `provide` en `TripView` llega a todos. La regla `tripStorageKey(slug, name) = \`${slug}-${name}\`` reproduce byte a byte las claves actuales de Roma, de modo que no hace falta migración y los specs de paridad que siembran `roma-pace`/`roma-note-*` siguen verdes sin tocarlos.

Hay **una trampa que la investigación del milestone no menciona y rompería la fase**: en Vue 3.5.38, `inject()` lee `instance.parent.provides`, así que **el componente que hace `provide` no ve su propio valor**. `TripView` publica el slug **e** invoca `useCardNavigationController()`, que a su vez llama a `useCardNavigation()`. Si ese accesor lee el slug con `useTripSlug()`, dentro de `TripView` obtiene `null` y lanza una excepción. Por eso **todos los accesores deben aceptar el slug como argumento opcional** (`useCardNavigation(slug = useTripSlug())`) y los controllers deben pasárselo de forma explícita.

La puerta de datos se generaliza con un módulo auxiliar puro (`tests/data/trips.ts`): carga cada `content/trips/<dir>/`, aplica las invariantes de D-10/D-11 y devuelve una lista de `Violation { file, rule, message }`. Así cada fallo **nombra el fichero culpable**. La prueba de que la puerta tiene dientes se hace con fixtures en memoria y en `tests/data/fixtures/` (nunca en `content/`), sin crear YAML roto en el repositorio. Los conteos y `migration-diff` siguen siendo solo de Roma. El viaje `prueba` **tiene que usar slugs de día de `viernes…martes`**: si no, `TripView` no pinta sus fichas (hallazgo que pasa a la Fase 10).

**Primary recommendation:** crear `useTripContext.ts` (provide/inject) y `utils/tripStorage.ts`; hacer que los tres accesores reciban `slug?` y los controllers lo propaguen; leer `useTripSlug()` siempre antes del primer `await`; generalizar `tests/data` con `describe.each` sobre las carpetas de `content/trips`; añadir el viaje `prueba` con días `viernes`/`sabado`; probar el aislamiento con unit/datos en la puerta más un spec Playwright contra `pnpm dev` **fuera** de `tests/parity/`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Viaje de prueba (segundo viaje para probar el aislamiento)
- **D-01:** Se crea un **viaje ficticio mínimo** en `content/trips/prueba/` (slug `prueba`): 1-2 días y 2-3 fichas inventadas, con contenido suficiente para probar aislamiento (p. ej. que buscar «Pantheon» en `prueba` no devuelva la ficha de Roma, y que un enlace `#ficha` de `prueba` navegue dentro de `prueba`). No se usa Campania como viaje de prueba: los tests deben ser estables aunque Campania cambie hasta la Fase 13.
- **D-02:** Hasta que la Fase 11 introduzca el filtro `draft`, el viaje de prueba es **accesible solo en dev** (`pnpm dev` → `/trips/prueba`). En la build estática no se prerenderiza ni se enlaza (igual que hoy `/trips/*`: `nitro.prerender.routes = ['/']`, sin enlaces). La página de Roma no debe descargar datos de `prueba` (las queries ya filtran por `trip`). El fichero `trip.yml` de prueba debe quedar listo para marcarse `draft: true` cuando exista el campo (Fase 11). — **Reversibility:** reversible
- **D-03:** El viaje de prueba **no** debe introducir campos de esquema nuevos (eso es Fase 10/12): usa solo la forma actual del esquema. Si la forma actual obliga a tener 5 días con slugs `viernes…martes` u otras rarezas de Roma, se documenta como hallazgo para la Fase 10, sin ampliar esquema aquí.

#### Preferencias por viaje
- **D-04:** Ritmo (`pace`), «caminar menos» (`light`), modo resumen (`resumen`) y notas por ficha se guardan **por viaje** con `tripStorageKey(slug, name) = \`${slug}-${name}\``. Para Roma produce exactamente las claves actuales (`roma-pace`, `roma-light`, `roma-resumen`, `roma-note-<ficha>`) → **sin migración** y sin pérdida. Activar algo en un viaje no lo activa en otro. — **Reversibility:** one-way — las claves `${slug}-*` quedan escritas en el `localStorage` de los usuarios; cambiar el esquema de claves más tarde exigiría código de migración.
- **D-05:** El slug de viaje cumple `^[a-z0-9]+$` (sin guiones) y se valida en esquema + invariante, para que el prefijo `${slug}-` sea inequívoco (`campania`, no `campania-2027`). — **Reversibility:** costly — los slugs aparecen en URLs (Fase 11) y en claves de usuario.
- **D-06:** Un viaje nuevo arranca con los **mismos valores por defecto que hoy**: ritmo optimista, «caminar menos» y resumen desactivados. No hay valores por defecto por viaje (no se añade campo al esquema).
- **D-07:** El tema claro/oscuro sigue **global** (`colorMode.storageKey: 'roma-theme'`, sin renombrar) — decisión ya tomada en el milestone; no se toca.
- **D-08:** El estado en memoria (`useState`) de búsqueda, navegación y modos se aísla por viaje (claves sufijadas con el slug) y el índice MiniSearch deja de ser un único índice de módulo (uno por slug). Invisible en el HTML de Roma.

#### Rigor de la validación
- **D-09:** Las comprobaciones de datos son **igual de estrictas para todos los viajes**, borradores incluidos: esquema zod + invariantes bloquean `pnpm verify` en cualquier viaje. «Estar incompleto» (pocos días, pocas fichas) **no** es un error; «estar roto» sí.
- **D-10:** Invariantes nuevos/generalizados por viaje que bloquean: slug de viaje válido (D-05); el campo `trip` de cada fichero == nombre de su carpeta; ids únicos dentro del viaje; ningún id choca con un ancla de sección fija (`inicio`, `mapa`, `reservas`, `gastronomia`, `practica`, `arte`, `arquitectura`…); nombres reservados de Nuxt Content (`id`, `meta`, `stem`, `extension`) no se usan como campos; los mensajes de fallo nombran el fichero culpable.
- **D-11:** Un enlace `[texto](#ficha)` en la prosa que apunta a una ficha que **no existe en ese mismo viaje** es un **error que rompe verify** (fichero + enlace en el mensaje). No se admiten enlaces entre viajes.
- **D-12:** Los checks específicos de Roma (conteos de fichas, `migration-diff` contra `index.html`) siguen siendo **solo de Roma**; esquema e invariantes iteran todos los viajes (`describe.each` sobre `content/trips/*`).

### Claude's Discretion
- Nombre y contenido exacto del viaje ficticio (lugares inventados, textos), siempre que sirva para las pruebas de aislamiento de búsqueda, navegación y notas.
- Mecanismo concreto de contexto de viaje (recomendado por la investigación: `provideTripSlug`/`useTripSlug` con `provide/inject`, leído antes del primer `await`; `useCardNavigationController(slug)` por argumento).
- Cómo se prueba el aislamiento (unit con Vitest y/o Playwright contra `pnpm dev` en `/trips/prueba`), respetando que `tests/parity/` no cambia en esta fase.

### Deferred Ideas (OUT OF SCOPE)
- Enlaces entre viajes (p. ej. de Campania a una ficha de Roma con `/trips/roma#pantheon`) — descartado en v1.1; idea futura si se necesita.
- Valores por defecto de ritmo por viaje (p. ej. Campania con niños empieza en «lento») — descartado por ahora; posible campo opcional futuro en `trip.yml`.
- «Caminar menos» como preferencia global de la persona — descartado; queda por viaje.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-01 | La búsqueda de una guía solo devuelve fichas de ese viaje | §Pattern 3 (índice `Map<slug, MiniSearch>` + `useTrip(slug)` en `useSearchController`); el test de datos `searchIsolation.spec.ts` y el E2E `tests/trips/isolation.spec.ts` (Validation Architecture) |
| PLAT-02 | Enlaces entre fichas, pila «Volver» y scrollspy funcionan en cualquier viaje | §Pattern 2 (`useCardNavigationController(slug)` + accesor con slug explícito: trampa del self-inject); E2E en `/trips/prueba` (highlight, back, `.nav-pill.active`) |
| PLAT-03 | Notas, ritmo, «caminar menos» y resumen por viaje; claves `roma-*` intactas | §Pattern 4 (`tripStorageKey`); `tripStorage.spec.ts` (`'roma-pace'`…); los specs de paridad `modes.spec.ts`/`map-fallback-notes.spec.ts` sin cambios; E2E de no-mezcla entre Roma y prueba |
| PLAT-04 | Validación por viaje (slug, carpeta = slug, ids únicos, sin colisión con anclas, enlaces `#ficha` dentro del viaje); un YAML inválido rompe `pnpm verify` | §Pattern 5 (`tests/data/trips.ts` → `Violation[]` con `file`); `describe.each` sobre carpetas; fixtures negativos en memoria y en `tests/data/fixtures/` |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

| Directiva | Implicación para esta fase |
|-----------|---------------------------|
| Paridad visual y funcional **idéntica** con la guía de hoy (listón innegociable) | Roma en `/` sin cambio visual; `tests/parity/` sin diff; 56 goldens sin re-baseline |
| Salida estática (`nuxt generate`), sin servidor activo | `prueba` no se prerenderiza (`routes: ['/']`) y no se enlaza |
| Offline conservado | Sin dependencias nuevas de red; el índice de búsqueda se construye en el cliente a partir del payload |
| Trabajo en la rama de release; `main` intacta | Rama actual `release/nuxt-4` |
| Contenido en Nuxt Content v3 `type:'data'` YAML + zod 4; `import { z } from 'zod'` (nunca el re-export de Content) | La regex de slug se añade en `shared/schemas.ts` con `z` de `zod` |
| CSS a mano, sin Tailwind; sin bloques `scoped` (rompen selectores globales) | Esta fase no toca CSS ni plantillas visuales |
| Búsqueda sobre **datos** con MiniSearch (no scraping del DOM) | Un índice por slug, construido con `monById` de ese viaje |
| Leaflet crudo en `client-only` | `LeafletMap` ya recibe `:slug` (sin cambios) |
| Flujo GSD; no editar fuera de un comando GSD | La ejecución va por `/gsd-execute-phase` |
| Memoria: ejecutar sin worktrees; `rm -rf .data .nuxt .output` tras editar YAML o esquema | Cada plan que toque `content/` o `shared/schemas.ts` limpia antes de `generate`/`verify` |
| Memoria: un `@click` de burbuja sobre `<a href="#slug">` se lo come el listener de captura (CR-01) | No añadir handlers a los anclajes de ficha en `prueba`; los E2E usan `dispatchEvent('click')` como `navigation.spec.ts` |
| Memoria: paridad pragmática; avisar pronto si un arreglo de píxel cuesta demasiado | Si aparece un diff de paridad, parar y preguntar: nunca re-baseline |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Contexto de viaje (slug) | Frontend Server (SSR/prerender) + Browser (mismo árbol Vue) | — | `provide` en `TripView` durante el setup; se resuelve igual en prerender y en la hidratación |
| Estado en memoria por viaje (`useState`) | Frontend Server → payload → Browser | — | `useState` se serializa en `__NUXT_DATA__`; las claves sufijadas solo cambian strings del payload, no el DOM |
| Índice de búsqueda por viaje | Browser | — | MiniSearch se construye en `onMounted` (nunca en prerender) desde `monById` del payload |
| Persistencia (`localStorage`) por viaje | Browser | — | Lectura en `onMounted`, escritura en `watch`/`@input`; nunca en el setup del servidor |
| Aislamiento de datos (queries) | Database / Storage (SQLite de Content en build) | Frontend Server | `useTrip(slug)` ya filtra las 6 colecciones por `trip`/`slug` |
| Validación de contenido por viaje | Build tooling (Vitest Node-puro en `pnpm verify`) | — | Content v3 no valida `type:'data'` en build (#3351); la puerta real es `tests/data` |

## Inventario verificado (estado actual del código, leído en esta sesión)

| # | Ubicación | Valor actual (verbatim) | Cambio |
|---|-----------|------------------------|--------|
| H6 | `app/composables/useCardNavigation.ts:173` | `const { monById } = await useTrip('roma')` | `await useTrip(slug)` con `slug` como argumento del controller [VERIFIED: useCardNavigation.ts:122,173] |
| H6 | `app/components/TripView.vue:62-68` | `const props = defineProps<{ slug: string }>()` … `const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)` … `await useCardNavigationController()` | `provideTripSlug(props.slug)` como primera sentencia; `await useCardNavigationController(props.slug)` [VERIFIED: TripView.vue:62-68] |
| H7 | `app/composables/useSearch.ts:144` | `const { monById } = await useTrip('roma')` | `await useTrip(slug)` con `slug = useTripSlug()` leído en la primera línea [VERIFIED: useSearch.ts:108-151] |
| H8 | `app/composables/useSearch.ts:52` | `const indexRef = shallowRef<MiniSearch \| null>(null)` | `const indexes = new Map<string, MiniSearch>()` (también de módulo, solo se escribe en cliente) [VERIFIED: useSearch.ts:52,73,134,150] |
| H9 | `app/composables/useSearch.ts:56-58` | `useState<string>('search:query', …)`, `useState<boolean>('search:open', …)`, `useState<SearchResultRow[]>('search:results', …)` | Sufijo `:${slug}` [VERIFIED: useSearch.ts:56-58] |
| H9 | `app/composables/useCardNavigation.ts:53-54` | `useState<number[]>('cardNav:stack', () => [])`, `useState<string>('cardNav:activeSection', () => '')` | Sufijo `:${slug}` [VERIFIED: useCardNavigation.ts:53-54] |
| H9 | `app/composables/useTripModes.ts:46-48` | `useState<…>('pace', () => 'optimistic')`, `useState('light', () => false)`, `useState('resumen', () => false)` | Sufijo `:${slug}` [VERIFIED: useTripModes.ts:46-48] |
| H10 | `app/composables/useTripModes.ts:92-103` | `localStorage.getItem('roma-pace')`, `'roma-light'`, `'roma-resumen'` (lectura) y `localStorage.setItem('roma-pace', v)`, `'roma-light'`, `'roma-resumen'` (escritura) | `tripStorageKey(slug, 'pace'\|'light'\|'resumen')` [VERIFIED: useTripModes.ts:92-103] |
| H11 | `app/components/MonumentCard.vue:123` | ``const NOTE_KEY = `roma-note-${monument.slug}` `` | ``tripStorageKey(useTripSlug(), `note-${monument.slug}`)`` [VERIFIED: MonumentCard.vue:123] |
| — | `app/components/SearchBox.vue:49` | `useSearchController().catch((e) => { … })` (sin `await`) | Sin cambios: el controller lee el slug internamente [VERIFIED: SearchBox.vue:40-51] |
| — | `app/components/TheHero.vue:53-54` | `useTripModesController()` / `const { pace, light, resumen } = useTripModes()` | Sin cambios de llamada (ambos leen el slug por inject) [VERIFIED: TheHero.vue:53-54] |
| — | `app/components/NavPills.vue:26`, `BackButton.vue:15` | `const { activeSection } = useCardNavigation()` / `const { canGoBack, goBack } = useCardNavigation()` | Sin cambios de llamada [VERIFIED: NavPills.vue:26; BackButton.vue:15] |
| — | `app/components/TimelineStop.vue:38`, `TimelineTransport.vue:43` | `const { isVisible } = useTripModes()` | Sin cambios de llamada [CITED: grep de esta sesión] |
| — | `app/components/LeafletMap.client.vue:39,51` | `defineProps<{ slug: string }>()` + `await useTrip(props.slug)` | Ya es por viaje; sin cambios [CITED: grep de esta sesión] |
| H23 | `tests/data/schema.spec.ts:36`, `tests/data/invariants.spec.ts:32` | `const ROOT = join(process.cwd(), 'content', 'trips', 'roma')` | Iterar las carpetas de `content/trips` [VERIFIED: schema.spec.ts:36; invariants.spec.ts:32] |
| — | `tests/data/migration-diff.spec.ts:185`, `scripts/migration-diff.ts:34` | `ROMA_ROOT` / `CONTENT_ROOT = join(process.cwd(), 'content', 'trips', 'roma')` | **No tocar**: ya es solo Roma (D-12) [CITED: grep de esta sesión] |
| — | `shared/schemas.ts:329` | `slug: z.string(), // 'roma'` (dentro de `TripSchema`) | `slug: z.string().regex(/^[a-z0-9]+$/)` [VERIFIED: schemas.ts:328-357] |

**Árbol de consumidores (todos descendientes de `TripView`):** `TripView` → `Topbar` → `NavPills`; `TripView` → `TheHero` → `SearchBox`; `TripView` → `DaySection` → `Timeline` → `TimelineStop`/`TimelineTransport`, y `DaySection` → `MonumentCard`; `TripView` → `BackButton`; `TripView` → `<ClientOnly>` → `LeafletMap`. [VERIFIED: TripView.vue:76-241; Topbar.vue:26 `<NavPills :days="days" />` y TheHero.vue:78 `<SearchBox />` (grep)]. `app/app.vue` solo monta `<NuxtPage />` y no consume controllers [VERIFIED: app.vue].

## Standard Stack

Esta fase **no instala paquetes**. Todo se hace con lo ya fijado en `package.json` [VERIFIED: package.json leído]:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuxt | 4.4.8 | `useState`, auto-imports, `useAsyncData` | Ya en uso |
| vue | 3.5.38 (transitiva) | `provide`/`inject` + `InjectionKey` | `node_modules/.pnpm/@vue+runtime-core@3.5.38` [VERIFIED: ruta en disco] |
| @nuxt/content | 3.14.0 | Colecciones con glob `trips/*/…` | Ya multi-viaje en datos |
| zod | 4.4.3 | `.regex()` del slug, `z.prettifyError` para mensajes de fallo | Verificado en esta sesión: `z.prettifyError` existe y produce `✖ … → at coords.lat` |
| minisearch | 7.2.0 | Un índice por viaje | `createSearchIndex` (pura) sin cambios |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.9 | `describe.each` sobre las carpetas de viaje; unit de `tripStorageKey` | `tests/data`, `tests/unit` |
| yaml | ^2.9.0 | Parseo Node-puro en `tests/data` | Mismo loader que ya se usa |
| @playwright/test | 1.61.0 | E2E de aislamiento contra `pnpm dev` (fuera de `tests/parity/`) | `tests/trips/*.spec.ts` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `provide/inject` | `useState('trip:slug')` global | Reintroduce un singleton que puede quedar rancio entre rutas; descartado en ARCHITECTURE §5.2 |
| `provide/inject` | Pasar `slug` por props a cada componente | Prop-drilling por 4 niveles (TripView→DaySection→Timeline→TimelineStop) y por MDC; más superficie |
| Probar los composables con `@nuxt/test-utils` | Instalar `@nuxt/test-utils` + entorno `nuxt` en Vitest | **No está instalado** (`vitest.config.ts` usa `vitest/config` plano). Instalarlo es una dependencia y una configuración nuevas fuera del alcance de la fase. Se cubre con utils puras, un test-guardián de código fuente y un E2E |
| E2E contra `pnpm dev` | Segunda build estática con `/trips/prueba` prerenderizado (rutas y `output.dir` según env) | Determinista e incluible en `verify`, pero añade ramas condicionales a `nuxt.config.ts` y duplica el tiempo de build. Se puede valorar en la Fase 11, cuando el prerender de viajes sea real |

**Installation:** ninguna.

## Package Legitimacy Audit

No se instala ningún paquete externo en esta fase.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** ninguno
**Packages flagged as suspicious [SUS]:** ninguno

## Architecture Patterns

### System Architecture Diagram

```
 URL ─┬─ "/"              → pages/index.vue  ──(slug="roma")──┐
      └─ "/trips/:slug"   → pages/trips/[slug].vue ──(404 guard: useTrip(slug).trip)──┐
                                                                                       ▼
                                                             TripView(slug)
                                       ┌──────────── provideTripSlug(slug)  [1ª sentencia]
                                       │             useTrip(slug) ──► queryCollection(*).where(trip=slug)
                                       │             useCardNavigationController(slug) ◄─ ARGUMENTO (self-inject imposible)
                                       │                 └─ useCardNavigation(slug) ─► useState(`cardNav:*:${slug}`)
                                       ▼
          ┌───────────────┬──────────────────────┬───────────────────────────┬──────────────┐
       Topbar          TheHero               DaySection                    BackButton   ClientOnly
          │               │  useTripModesController()  │                        │        LeafletMap(:slug)
       NavPills           │   └ useTripSlug() ─► useState(`pace:${slug}`…)      │
   useCardNavigation()    │      onMounted: localStorage[tripStorageKey(slug,'pace')]
   (inject)               │                              │
                       SearchBox                    Timeline* ─ useTripModes() (inject) → isVisible
                   useSearchController()            MonumentCard ─ useTripSlug() → localStorage[`${slug}-note-${ficha}`]
                    └ slug=useTripSlug() [antes del await]
                      onMounted: indexes.set(slug, createSearchIndex(monById))
                      onInput: indexes.get(slug).search(q) ─► navigateToCard (cardNav del MISMO slug)

  Validación (pnpm verify → test:data):
  content/trips/<dir>/**.yml ─► loadTrip(dir) ─► safeParse por fichero (todas las carpetas)
                                              └► checkTrip() ─► Violation{file,rule,message}[] ─► expect([]) con mensaje = ficheros
                                 (solo roma) ─► conteos + migration-diff
```

### Recommended Project Structure (delta)
```
app/
├── composables/
│   ├── useTripContext.ts      # NUEVO: TripSlugKey, provideTripSlug, useTripSlug
│   ├── useSearch.ts           # MOD: slug, Map de índices, claves sufijadas
│   ├── useCardNavigation.ts   # MOD: slug por argumento, claves sufijadas
│   └── useTripModes.ts        # MOD: slug, claves useState + localStorage por viaje
├── utils/
│   └── tripStorage.ts         # NUEVO (puro): tripStorageKey, tripStateKey
└── components/
    ├── TripView.vue           # MOD: provide + controller(slug)
    └── MonumentCard.vue       # MOD: NOTE_KEY por viaje
content/trips/prueba/          # NUEVO: trip.yml, days/{viernes,sabado}.yml, monuments/*.yml
shared/schemas.ts              # MOD: TripSchema.slug con regex (aditivo)
tests/
├── data/
│   ├── trips.ts               # NUEVO (puro): listTripDirs, loadTrip, checkTrip → Violation[]
│   ├── fixtures/trips/…       # NUEVO: carpetas rotas para probar el loader (fuera de content/)
│   ├── schema.spec.ts         # MOD: describe.each(viajes); conteos solo roma
│   └── invariants.spec.ts     # MOD: describe.each(viajes) + checkTrip + fixtures negativos
├── unit/
│   ├── tripStorage.spec.ts    # NUEVO
│   ├── searchIsolation.spec.ts# NUEVO (índice por viaje con datos reales)
│   └── tripCoupling.spec.ts   # NUEVO: guardián de código fuente (sin 'roma' hardcodeado en controllers)
└── trips/                     # NUEVO: E2E de aislamiento contra pnpm dev (NO es tests/parity/)
    └── isolation.spec.ts
playwright.trips.config.ts     # NUEVO: testDir tests/trips, webServer = pnpm dev
```

### Pattern 1: Contexto de viaje con provide/inject (y la trampa del self-inject)

**What:** `TripView` publica el slug y los descendientes lo leen. **Dentro del propio `TripView` no se puede usar `inject`**: el slug se pasa por argumento.

**Evidencia (Vue 3.5.38):** `runtime-core.cjs.js:793`: `let provides = currentApp ? currentApp._context.provides : instance ? instance.parent == null || instance.ce ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides : void 0;` → `inject` mira los provides **del padre**, nunca los del propio componente. [VERIFIED: node_modules/.pnpm/@vue+runtime-core@3.5.38/…/runtime-core.cjs.js:790-804]

**`await` en `<script setup>` frente a `await` dentro de un composable:** en `<script setup>` el compilador envuelve cada `await` de nivel superior en `withAsyncContext`, que restaura la instancia activa (`runtime-core.cjs.js:3643-3668`). Por eso `TripView` puede llamar a composables después de `await useTrip(...)`. **Dentro** de una función `async` normal (los controllers) no hay esa restauración: tras el primer `await` interno no hay instancia, y `inject`/`onMounted` dejan de funcionar sin avisar. Es el bug A1 ya documentado en `useCardNavigation.ts:97-105`. [VERIFIED: runtime-core.cjs.js:3643-3668; useCardNavigation.ts:97-105]

```typescript
// app/composables/useTripContext.ts  (patrón; nombres de ARCHITECTURE §5.2)
import type { InjectionKey } from 'vue'

export const TripSlugKey: InjectionKey<string> = Symbol('tripSlug')

export function provideTripSlug(slug: string) {
  provide(TripSlugKey, slug)
}

export function useTripSlug(): string {
  const slug = inject(TripSlugKey, null)
  if (!slug) {
    throw new Error('useTripSlug() fuera de un descendiente de <TripView> (dentro de TripView, pasa el slug por argumento)')
  }
  return slug
}
```

```vue
<!-- app/components/TripView.vue (solo el delta del script) -->
<script setup lang="ts">
const props = defineProps<{ slug: string }>()
provideTripSlug(props.slug) // 1ª sentencia: antes de cualquier await
const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)
await useCardNavigationController(props.slug) // ARGUMENTO: TripView no puede inyectarse a sí mismo
</script>
```

### Pattern 2: Accesor con `slug` opcional y controller que lo propaga

**What:** cada accesor puro acepta `slug?` y, si falta, lo inyecta. Los controllers lo leen **una vez**, en el tramo síncrono, y lo pasan a todo lo que llaman.

```typescript
// app/composables/useCardNavigation.ts (delta)
export function useCardNavigation(slug: string = useTripSlug()) {
  const navStack = useState<number[]>(tripStateKey(slug, 'cardNav:stack'), () => [])
  const activeSection = useState<string>(tripStateKey(slug, 'cardNav:activeSection'), () => '')
  // … navigateToCard / goBack sin cambios
}

export async function useCardNavigationController(slug: string) {
  const { navigateToCard, activeSection } = useCardNavigation(slug) // NUNCA sin argumento aquí
  const monByIdRef = shallowRef<Map<string, unknown>>(new Map())
  // … onDelegatedClick / updateActivePill / onMounted / onUnmounted sin cambios (SÍNCRONOS)
  const { monById } = await useTrip(slug)
  monByIdRef.value = monById.value
  watch(monById, v => (monByIdRef.value = v))
}
```

```typescript
// app/composables/useTripModes.ts (delta)
export function useTripModes(slug: string = useTripSlug()) {
  const pace = useState<'optimistic' | 'neutral' | 'slow'>(tripStateKey(slug, 'pace'), () => 'optimistic')
  const light = useState(tripStateKey(slug, 'light'), () => false)
  const resumen = useState(tripStateKey(slug, 'resumen'), () => false)
  // …
  return { pace, light, resumen, isVisible }
}

export function useTripModesController() {
  const slug = useTripSlug() // TheHero es hijo de TripView → inject resuelve
  const { pace, light, resumen } = useTripModes(slug)
  // watch(light→slow) + useHead(bodyAttrs) sin cambios
  onMounted(() => {
    const kPace = tripStorageKey(slug, 'pace')
    const kLight = tripStorageKey(slug, 'light')
    const kResumen = tripStorageKey(slug, 'resumen')
    const savedPace = localStorage.getItem(kPace)
    if (savedPace === 'optimistic' || savedPace === 'neutral' || savedPace === 'slow') pace.value = savedPace
    if (localStorage.getItem(kLight) === '1') light.value = true
    if (localStorage.getItem(kResumen) === '1') resumen.value = true
    watch(pace, v => localStorage.setItem(kPace, v))
    watch(light, v => localStorage.setItem(kLight, v ? '1' : '0'))
    watch(resumen, v => localStorage.setItem(kResumen, v ? '1' : '0'))
  })
}
```

**Orden pace → light:** se conserva el orden de restauración actual (`useTripModes.ts:89-97`), porque `light=true` fuerza `pace='slow'`. [VERIFIED: useTripModes.ts:88-104]

### Pattern 3: Un índice MiniSearch por viaje

```typescript
// app/composables/useSearch.ts (delta)
const indexes = new Map<string, MiniSearch>() // módulo, CLIENT-ONLY (solo se escribe en onMounted)

export function useSearch(slug: string = useTripSlug()) {
  const query = useState<string>(tripStateKey(slug, 'search:query'), () => '')
  const isOpen = useState<boolean>(tripStateKey(slug, 'search:open'), () => false)
  const results = useState<SearchResultRow[]>(tripStateKey(slug, 'search:results'), () => [])
  const { navigateToCard } = useCardNavigation(slug)
  function onInput(value: string) {
    // … idéntico, salvo: const matches = indexes.get(slug)?.search(q) ?? []
  }
  // onSelect sin cambios
}

export async function useSearchController() {
  const slug = useTripSlug() // ← PRIMERA línea, antes del await
  const { isOpen } = useSearch(slug)
  const monByIdRef = shallowRef<Map<string, Monument>>(new Map())
  // onDocumentClick igual
  onMounted(() => {
    indexes.set(slug, createSearchIndex([...monByIdRef.value.values()]))
    document.addEventListener('click', onDocumentClick)
  })
  onUnmounted(() => document.removeEventListener('click', onDocumentClick))
  const { monById } = await useTrip(slug)
  monByIdRef.value = monById.value
  watch(monById, (v) => {
    monByIdRef.value = v
    if (indexes.has(slug)) indexes.set(slug, createSearchIndex([...v.values()]))
  })
}
```

**SSR:** el `Map` de módulo se comparte entre peticiones en el servidor, pero solo se escribe en `onMounted`, que no se ejecuta en prerender. Es la misma garantía que tenía `indexRef`. [VERIFIED: useSearch.ts:130-136]

### Pattern 4: Claves de persistencia y de estado (utilidad pura)

```typescript
// app/utils/tripStorage.ts — puro, auto-importado por Nuxt, testeable en Vitest plano
export function tripStorageKey(slug: string, name: string): string {
  return `${slug}-${name}` // D-04: 'roma','pace' → 'roma-pace'; 'roma','note-pantheon' → 'roma-note-pantheon'
}
export function tripStateKey(slug: string, name: string): string {
  return `${name}:${slug}` // 'pace' → 'pace:roma'; 'cardNav:stack' → 'cardNav:stack:roma' (ARCHITECTURE §5.2)
}
```

```typescript
// app/components/MonumentCard.vue (delta; hijo de DaySection → inject resuelve)
const NOTE_KEY = tripStorageKey(useTripSlug(), `note-${monument.slug}`)
```

**Alternativa válida para las notas:** `monument.trip` (dato) en lugar de `useTripSlug()`. Las dos dan lo mismo, porque `useTrip(slug)` filtra por `trip = slug` y la invariante «`trip` == carpeta» lo garantiza. Se recomienda `useTripSlug()` por coherencia con D-04 («la guía que se está viendo»).

### Pattern 5: Puerta de datos por viaje que nombra el fichero culpable

**What:** un módulo puro carga y comprueba; los specs solo afirman que la lista de violaciones está vacía y usan esa lista como mensaje.

```typescript
// tests/data/trips.ts (forma propuesta; Node puro: readdirSync/globSync + yaml)
export const TRIPS_ROOT = join(process.cwd(), 'content', 'trips')
export const TRIP_SLUG_RE = /^[a-z0-9]+$/ // misma regex que TripSchema.slug (D-05)
export const COLLECTIONS = [
  { name: 'trip',      glob: 'trip.yml',        strict: TripSchema,      row: TripSchema },
  { name: 'day',       glob: 'days/*.yml',      strict: DaySchema,       row: DaySchema },
  { name: 'monument',  glob: 'monuments/*.yml', strict: MonumentSchema,  row: MonumentSchema },
  { name: 'food',      glob: 'food/*.yml',      strict: FoodSchema,      row: FoodSchema },
  { name: 'artist',    glob: 'artists/*.yml',   strict: ArtistSchema,    row: ArtistRowSchema },
  { name: 'reference', glob: 'reference/*.yml', strict: ReferenceSchema, row: ReferenceRowSchema },
] as const
export interface Doc { trip: string, collection: string, file: string /* relativo al repo */, slug: string, kind?: string, data: Record<string, unknown> }
export interface LoadedTrip { dir: string, docs: Doc[], strayFiles: string[] /* .yml/.yaml que no casan con ningún glob */ }
export interface Violation { file: string, rule: string, message: string }
export function listTripDirs(root = TRIPS_ROOT): string[] { /* readdirSync({withFileTypes}) → isDirectory() → sort */ }
export function loadTrip(dir: string, root = TRIPS_ROOT): LoadedTrip { /* … */ }
export function checkTrip(t: LoadedTrip): Violation[] { /* reglas de abajo */ }
export const formatViolations = (vs: Violation[]) => vs.map(v => `${v.file}: [${v.rule}] ${v.message}`).join('\n')
```

**Reglas de `checkTrip` (cubren D-05, D-10 y D-11):**

| rule | Comprueba | Mensaje (siempre con `file`) |
|------|-----------|------------------------------|
| `trip-yml` | Existe `<dir>/trip.yml` (Pitfall 8) | `content/trips/<dir>/ sin trip.yml` |
| `trip-slug` | `trip.yml.slug` cumple `^[a-z0-9]+$` **y** `== dir` | `slug "campania-2027" no cumple ^[a-z0-9]+$` / `slug "x" ≠ carpeta "y"` |
| `trip-field` | En los ficheros que no son `trip.yml`, `data.trip == dir` (**`trip.yml` no tiene campo `trip`**: su regla es `trip-slug`) | `trip "roma" ≠ carpeta "prueba"` |
| `stray-file` | Todo `.yml`/`.yaml` bajo `<dir>/` casa con un glob de `COLLECTIONS` (Content ignora el resto sin avisar) | `fichero fuera de las colecciones (Content lo ignoraría)` |
| `reserved-key` | Claves **de nivel superior** del YAML ∩ `{id, meta, stem, extension, __hash__}` = ∅ | `campo reservado de Content "meta"` |
| `unknown-key` *(recomendado)* | Claves de nivel superior ⊆ `Object.keys(row.shape)` (zod quita las desconocidas sin avisar) | `campo desconocido "boxorder"` |
| `basename-slug` | `basename(file) == slug` (todo menos `trip.yml`) | regla existente |
| `dup-id` | Slugs únicos dentro del viaje (lista los ficheros que chocan) | `id "x" duplicado en a.yml, b.yml` |
| `fixed-anchor` | Slugs de monument/food/artist/day ∉ `FIXED_DOM_IDS` (`reference` está exento: `reservas`/`practica` son el singleton de su sección) | `id "mapa" choca con un ancla fija de TripView` |
| `ref` | Referencias estructuradas resueltas **dentro del viaje** (las 6 reglas actuales de `invariants.spec.ts:108-169`) | mensajes actuales |
| `anchor` | Cada `[t](#x)` de cualquier string resuelve a un slug del viaje (monument/food/artist/day/reference) o a una sección fija | `ancla #pantheon no existe en el viaje "prueba"` |

**Por qué solo nivel superior para `reserved-key`:** Roma usa `meta:` **anidado** dentro de `timeline[].modes[]` (`TransportMode.meta`, `shared/schemas.ts:80`), que va en una columna JSON y no choca con nada. Mirar en profundidad daría un falso rojo en `content/trips/roma/days/viernes.yml`, `domingo.yml` y `martes.yml`. [VERIFIED: schemas.ts:75-81; las claves de nivel superior de todo `content/trips` se listaron en esta sesión y no contienen `id`/`meta`/`stem`/`extension`]

**Columnas reservadas de Content (fuente):** `metaStandardSchema` en `@nuxt/content@3.14.0/dist/module.mjs:2117-2153` declara `required: ["id", "stem", "extension", "meta"]`, y la tabla generada añade `"__hash__" TEXT UNIQUE` (visto en `CREATE TABLE IF NOT EXISTS _content_trip (id TEXT PRIMARY KEY, … "extension" VARCHAR, … "meta" TEXT, … "stem" VARCHAR, "__hash__" TEXT UNIQUE)` del `sql_dump` decodificado). [VERIFIED: module.mjs:2117-2153; .output/public/__nuxt_content/trip/sql_dump.txt decodificado]

**`FIXED_DOM_IDS` (ids que emiten los componentes, leídos en esta sesión):**
- Secciones: `inicio` (TheHero.vue:57 `<section id="inicio">`), `mapa` (TripView.vue:84), `reservas` (:150), `gastronomia` (:156), `practica` (:162), `arte` (:168), `arquitectura` (:196). [VERIFIED: TripView.vue:84-196; TheHero.vue:57]
- Chrome: `leaflet-map` (TripView.vue:100), `map-offline-banner` (:104), `light-toggle` (TheHero.vue:117), `resumen-toggle` (TheHero.vue:127), `back-btn` (BackButton.vue:20), `search` / `search-results` (SearchBox.vue:57,66), `nav-pills` (NavPills.vue:31). [VERIFIED: ficheros citados]
- Los días `viernes`…`martes` son hoy ids fijos de `TripView.vue:115-143`, pero ya son slugs de día en los datos: la regla `dup-id` los cubre. No se ponen en la lista fija para no prohibírselos a otros viajes.
- `MonumentCard.vue:319/369` emite `:id="'note-' + monument.slug"`. Una ficha cuyo slug empiece por `note-` podría duplicar un id del DOM; la regla `slug no empieza por "note-"` es opcional y barata. [VERIFIED (grep): MonumentCard.vue:317-321]

**Lista de anclas de sección actual (a sustituir):** `invariants.spec.ts:180`: `const PAGE_SECTIONS = new Set(['inicio', 'mapa', 'arte', 'arquitectura', 'gastronomia'])`. [VERIFIED: invariants.spec.ts:180]

```typescript
// tests/data/invariants.spec.ts (forma)
const trips = listTripDirs()
it('hay al menos el viaje roma (la puerta no es vacía)', () => expect(trips).toContain('roma'))
describe.each(trips)('viaje %s', (dir) => {
  const t = loadTrip(dir)
  it('cumple todas las invariantes (D-05/D-10/D-11)', () => {
    const vs = checkTrip(t)
    expect(vs, formatViolations(vs)).toEqual([])
  })
})
describe('la puerta tiene dientes (fixtures)', () => {
  it('slug con guion', () => expect(checkTrip(fixture({ tripSlug: 'campania-2027' })).map(v => v.rule)).toContain('trip-slug'))
  it('enlace #pantheon en prueba', () => {
    const vs = checkTrip(fixtureWithProse('[x](#pantheon)'))
    expect(vs[0]).toMatchObject({ rule: 'anchor', file: expect.stringContaining('prueba/monuments/') })
  })
  // … una por regla: folder≠slug, dup-id, fixed-anchor ('mapa'), reserved-key ('meta'), stray-file, trip-yml ausente
})
```

```typescript
// tests/data/schema.spec.ts (forma)
describe.each(listTripDirs())('esquema · viaje %s', (dir) => {
  for (const c of COLLECTIONS) {
    for (const f of globSync(join(TRIPS_ROOT, dir, c.glob)).sort()) {
      const rel = relative(process.cwd(), f)
      it(`valida ${rel}`, () => {
        const r = c.strict.safeParse(parseYaml(readFileSync(f, 'utf8')))
        expect(r.success, r.success ? '' : `${rel}\n${z.prettifyError(r.error)}`).toBe(true)
      })
    }
  }
})
describe('conteo por colección (SOLO roma, D-12)', () => { /* expected: 1/5/38/26/13/2 sobre content/trips/roma */ })
```

**Conteos actuales (verbatim, solo Roma):** `schema.spec.ts:42-47`: `trip … expected: 1`, `day … expected: 5`, `monument … expected: 38`, `food … expected: 26`, `artist … expected: 13`, `reference … expected: 2`. [VERIFIED: schema.spec.ts:41-48]

### Pattern 6: El viaje `prueba` mínimo (solo la forma actual del esquema)

**Campos requeridos por el esquema actual** [VERIFIED: shared/schemas.ts:46-72, 131-152, 328-357]:
- `trip.yml` (`TripSchema`): `slug`, `title`, `decoration`, `heroMeta`, `quote`, `quoteAttr`, `infoCards` (array, puede ir vacío), `howTo` (array), `map: { center: { lat, lng }, zoom }`. Opcionales: `mapExtras`, `sections`. **No lleva `trip`.**
- `days/*.yml` (`DaySchema`): `slug`, `trip`, `order`, `roman`, `eyebrow`, `title`, `subtitle`, `stats` (array), `timeline` (array), `cards` (array). `light` opcional.
- `monuments/*.yml` (`MonumentSchema`): `slug`, `trip`, `roman`, `name`, `italian`, `day`, `coords`, `type` (∈ `card`/`guided`/`concert`), `motif` (∈ los 19 de `Motif`, p. ej. `fountain`, `tower`, `stairs`), `hero: { src, alt }`, `sections` (array de `{heading, body}`), `facts`, `mapsQuery`.
- `food/`, `artists/`, `reference/`: **opcionales** (cero ficheros vale). `TripView` ya protege con `v-if` (`refById.get('reservas')`, `trip?.sections?.arte`) y `GastroSection` recibe `food: Food[]` (vacío = sin grupos). [VERIFIED: TripView.vue:150-228; GastroSection.vue:20-25]

**Hallazgo para la Fase 10 (D-03): los slugs de día de `prueba` tienen que estar en `viernes`/`sabado`/`domingo`/`lunes`/`martes`.** `TripView.vue:115-149` solo monta `DaySection` para `dayBySlug('viernes')`…`dayBySlug('martes')`, y las fichas (`MonumentCard`) **solo se pintan dentro de `DaySection`**. Con un día `dia-1`, la pastilla aparecería (porque `NavPills.vue:45-50` hace `v-for` sobre `days`), pero no habría `<section>` ni fichas. El E2E de navegación y notas no tendría a qué apuntar. Además, en `/trips/prueba` (dev) se verán los textos de Roma del chrome: marca de `Topbar`, `<title>`, pie y leyenda del mapa (H2/H4/H12/H13). También es Fase 10 y no se toca aquí. [VERIFIED: TripView.vue:115-149, 110-112, 237-241; NavPills.vue:44-50]

**Contenido recomendado (discreción de Claude):**
- `trip.yml`: `slug: prueba`, títulos inventados, `map.center` con coordenadas cualesquiera válidas y una línea comentada `# draft: true   # ← activar cuando exista el campo (Fase 11)`.
- `days/viernes.yml` (`order: 1`) y `days/sabado.yml` (`order: 2`). Su `timeline` lleva filas `kind: stop` con `ref:` a fichas de prueba, para tener `a.tl-title[href="#…"]` que pulsar, y su `cards:` lista las fichas.
- 3 fichas:
  1. `fontana-pruebas` («Fontana de las Pruebas»): comparte la palabra «Fontana» con Roma (Trevi), así que buscar «Fontana» en prueba debe devolver **solo** esta ficha.
  2. `torre-ensayo`: su prosa enlaza `[la fontana](#fontana-pruebas)` (enlace dentro del viaje, PLAT-02).
  3. `spagna`: **mismo slug que una ficha de Roma** (`content/trips/roma/monuments/spagna.yml`) pero con otro nombre, p. ej. «Escalinata de Ensayo». Prueba que las notas no se mezclan (`prueba-note-spagna` frente a `roma-note-spagna`) y que el `Map` de índices separa resultados con el mismo id. [VERIFIED: existe content/trips/roma/monuments/spagna.yml con `name: Piazza di Spagna`]
- Ningún texto de prueba debe quedar a distancia de edición ≤ 1 de «pantheon» ni empezar por «pante» (MiniSearch usa `prefix: true` y `fuzzy: 0.2`, `searchIndex.ts`). Por ejemplo, **no** usar «Panteón». [VERIFIED: app/utils/searchIndex.ts `searchOptions: { prefix: true, fuzzy: 0.2, … }`]
- `hero.src`: una URL que falle de forma determinista (p. ej. `https://example.invalid/prueba.jpg`) para que salte el SVG de `motif` y no dependa de la red.
- Una cadena centinela única en la prosa (p. ej. `PRUEBA-CENTINELA-9F3`) para el test de «Roma no contiene datos de prueba».

### Anti-Patterns to Avoid
- **Llamar a un accesor sin argumento dentro de `TripView`** (`useCardNavigation()` desde `useCardNavigationController`): el self-inject devuelve `null` y lanza. El controller debe llamar a `useCardNavigation(slug)`.
- **`useTripSlug()` después de un `await` dentro de un composable:** sin instancia activa, `inject` avisa y devuelve el default. Leerlo siempre en la primera línea.
- **Comprobar nombres reservados en profundidad:** da falso rojo con el `meta` anidado de `TransportMode`.
- **Fixtures YAML rotos dentro de `content/`:** Content los ingeriría y la build o la puerta del repo se romperían. Van en `tests/data/fixtures/`.
- **Tocar `tests/parity/`** (incluso para añadir un spec): el conteo «Total: 80 tests in 11 files» de `tests/README.md` §4 es la alarma de la puerta. El E2E nuevo va en `tests/trips/` con su propia config.
- **`for (key in localStorage)` / migración de claves:** prohibido (Pitfall 4). Solo lectura por clave exacta.
- **Enlaces a `/trips/prueba` desde cualquier sitio:** `crawlLinks` lo prerenderizaría y `shell.spec.ts` (sin `trips/`) se pondría en rojo.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contexto de viaje | Singleton de módulo o `useState('trip:slug')` | `provide`/`inject` con `InjectionKey` | Remonta con la página; no queda rancio entre rutas |
| Mensaje legible de error de esquema | Volcado `JSON.stringify(issues)` | `z.prettifyError(r.error)` (zod 4) | Formato `✖ … → at coords.lat`, verificado en esta sesión |
| Lista de columnas reservadas | Adivinarla | La de `metaStandardSchema` (`id`, `stem`, `extension`, `meta`) + `__hash__` | Fuente leída en `module.mjs:2117-2153` |
| Probar composables con un runtime Nuxt falso | `vi.stubGlobal('useState', …)` artesanal | Lógica pura en `utils/` + guardián de código fuente + E2E | Los stubs se desincronizan del runtime real; el E2E prueba el cableado de verdad |
| Arranque y parada del servidor dev en E2E | `spawn` + `killGroup` manual | `webServer` de la config de Playwright | Playwright gestiona el arranque, la espera de URL y la parada |

**Key insight:** el aislamiento real depende del **cableado** (qué slug llega a qué `useState` o índice), no de la lógica pura, que ya está testeada. Por eso hacen falta dos redes: un guardián estático que impide reintroducir `'roma'` o claves sin sufijo, y un E2E que ejerce un segundo viaje de verdad.

## Runtime State Inventory

> Fase de refactor: se responde a las 5 categorías.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `localStorage` de los usuarios: `roma-pace`, `roma-light`, `roma-resumen`, `roma-note-<ficha>` (las escribe el `index.html` vivo de `main` y las lee la build Nuxt). Con `tripStorageKey('roma', …)` las claves resultantes son **idénticas**. | **Ninguna migración.** Solo un cambio de código. `tripStorage.spec.ts` lo fija y los specs de paridad que siembran `roma-*` lo confirman. (El test de upgrade real desde `main` es de la Fase 14.) |
| Live service config | Ninguno: no hay servicios externos con estado (despliegue a Pages diferido, D-08 de v1.0). | Ninguna |
| OS-registered state | Ninguno: no hay tareas, demonios ni registros del sistema. | Ninguna |
| Secrets/env vars | Ninguno. `NUXT_APP_BASE_URL=/guiaRoma/` no cambia. `colorMode.storageKey: 'roma-theme'` (`nuxt.config.ts:33`) **se conserva** (D-07). [VERIFIED: nuxt.config.ts:29-35] | Ninguna |
| Build artifacts | `.data/` (SQLite de Content), `.nuxt/` y `.output/`: guardan contenido y esquema cacheados. Añadir `content/trips/prueba/` y la regex de `TripSchema` cambia los checksums de las colecciones. | `rm -rf .data .nuxt .output` antes de `pnpm generate`/`pnpm verify` (lección de memoria) |

**Efecto en la build de Roma (verificado sobre `.output/public` actual):**
- `index.html` lleva el payload `__NUXT_DATA__` con las claves `useState` en claro: `"$scardNav:stack"`, `"$scardNav:activeSection"`, `"$space"`, `"$slight"`, `"$sresumen"`, `"$ssearch:query"`, `"$ssearch:open"`, `"$ssearch:results"`. Tras D-08 pasarán a `"$space:roma"` y similares. **Cambian bytes del payload, no el DOM ni los píxeles.** Ningún spec de paridad compara bytes del HTML (visual-diff compara capturas; los demás, DOM). [VERIFIED: grep sobre .output/public/index.html; grep de tests/parity sin `__NUXT`/`payload`]
- Los checksums de colección van incrustados en el chunk de entrada (`const ne={trip:"v3.5.0--pSfU…",day:"v3.5.0--MjaN…"…}` en `_nuxt/B5xoPlow.js`, referenciado desde `index.html`). Con prueba, el hash y el nombre del chunk cambian. Es invisible.
- `__nuxt_content/<colección>/sql_dump.txt` (gzip+base64) contiene **todas las filas de todos los viajes**. Con `prueba`, **sus filas quedarán en el `sql_dump` público** aunque no se prerenderice. Roma no lo descarga en su carga prerenderizada. [VERIFIED: dump de `trip` decodificado en esta sesión]
- **Hallazgo para la Fase 11 (filtro `draft`):** el preset `github_pages` emite `404.html`/`200.html` como shell SPA. En Pages, `/guiaRoma/trips/prueba` caería al shell, el cliente consultaría Content por WASM contra ese `sql_dump` y **la guía de prueba se renderizaría en producción**. Hoy no hay despliegue, así que no es un riesgo en la Fase 9. Pero el `draft` de la Fase 11 tendrá que excluir los borradores **del dump** (p. ej. `source.exclude` o el hook de Content) o bloquearlos en `[slug].vue`, no solo de `prerender.routes`. [VERIFIED: existen .output/public/404.html y 200.html; ASSUMED: el mecanismo exacto de exclusión del dump]

## Common Pitfalls

### Pitfall 1: Self-inject en TripView
**What goes wrong:** `useCardNavigationController()` → `useCardNavigation()` → `useTripSlug()` dentro de `TripView` → `inject` devuelve `null` y se lanza la excepción. Roma deja de renderizar.
**Why it happens:** `inject` mira `instance.parent.provides` (Vue 3.5.38).
**How to avoid:** `useCardNavigationController(slug)` con argumento; dentro, `useCardNavigation(slug)`.
**Warning signs:** error `useTripSlug() fuera de…` en `pnpm generate`. El prerender falla con `failOnError: true` (`nuxt.config.ts:46`), así que se detecta pronto.

### Pitfall 2: `inject`/hooks tras un `await` interno
**What goes wrong:** `useSearchController` lee el slug después de `await useTrip(...)` → aviso de Vue, sin slug; la búsqueda muere sin avisar (el `.catch` de `SearchBox.vue:49` se traga el rechazo en producción).
**How to avoid:** `const slug = useTripSlug()` como primera línea de cada controller async.
**Warning signs:** en dev, `[Vue warn]: inject() can only be used inside setup()`; búsqueda vacía en E2E.

### Pitfall 3: Comprobación de reservados demasiado profunda o demasiado superficial
**What goes wrong:** en profundidad → falso rojo con `TransportMode.meta`. Solo sobre el esquema → no detecta un `meta:` puesto a mano en un YAML, porque zod lo **elimina sin avisar** (verificado: `z.object({a}).safeParse({a:'x', meta:1}).data` → `{"a":"x"}`).
**How to avoid:** comprobar las claves **de nivel superior del YAML crudo**, y por separado las claves de `row.shape` de cada esquema de colección (red para las Fases 10 y 12).

### Pitfall 4: El viaje `trip.yml` no tiene campo `trip`
**What goes wrong:** la invariante «campo `trip` == carpeta» aplicada a `trip.yml` falla siempre (o se salta en silencio).
**How to avoid:** para `trip.yml` la regla es `slug == carpeta && slug ~ ^[a-z0-9]+$`. La tabla SQL `_content_trip` no tiene columna `trip`. [VERIFIED: CREATE TABLE de `_content_trip` decodificado; TripSchema sin `trip`]

### Pitfall 5: Contenido rancio de Content tras añadir prueba o cambiar el esquema
**What goes wrong:** `pnpm generate` sirve el SQLite viejo de `.data/` y la puerta compara contra una build que no refleja el cambio.
**How to avoid:** `rm -rf .data .nuxt .output` antes de cada `generate`/`verify` de esta fase. Opcional (discreción): anteponerlo en el script `verify` de `package.json` (Pitfall 9 del milestone lo recomienda; no toca `tests/parity/`).

### Pitfall 6: `pnpm` no está en el PATH del shell no interactivo del agente
**What goes wrong:** `pnpm verify` → `command not found`. Además, el script `verify` invoca `pnpm generate` anidado, y bajo `corepack pnpm` ese `pnpm` interno tampoco resuelve (verificado: `corepack pnpm exec sh -c 'command -v pnpm'` → `NOPNPM`).
**How to avoid:** antes de ejecutar, crear un shim temporal en el scratchpad: `mkdir -p "$S/bin" && printf '#!/bin/sh\nexec corepack pnpm "$@"\n' > "$S/bin/pnpm" && chmod +x "$S/bin/pnpm" && export PATH="$S/bin:$PATH"` (verificado: `pnpm exec sh -c 'pnpm --version'` → `10.32.1`). No modificar el entorno del usuario.

### Pitfall 7: E2E en dev frágil
**What goes wrong:** el lock rancio de `nuxi dev` y la primera compilación lenta dan timeouts. Correr `pnpm dev` a la vez que `pnpm verify` hace que ambos compitan por `.nuxt/` y `.data/`.
**How to avoid:** `webServer` en `playwright.trips.config.ts` con `timeout` de 180 s, un solo proyecto (desktop), `workers: 1`, `reuseExistingServer: false`. No ejecutarlo en paralelo con `verify`. Esperar a la hidratación como hace `navigation.spec.ts` (`.nav-pill.active` con count 1 tras `scrollTo(0,0)`). No afirmar «cero errores de consola» en dev: Vite y Vue emiten avisos de desarrollo.

### Pitfall 8: Probar notas o modos sin aislar el contexto de Playwright
**What goes wrong:** el `localStorage` persiste entre tests del mismo contexto y da falsos verdes o rojos.
**How to avoid:** un `browser.newContext()` por test; `addInitScript` para sembrar `roma-pace=slow` y comprobar que prueba arranca en `optimistic`.

## Code Examples

### Test unitario de claves (PLAT-03)
```typescript
// tests/unit/tripStorage.spec.ts
import { describe, it, expect } from 'vitest'
import { tripStorageKey, tripStateKey } from '../../app/utils/tripStorage'

describe('tripStorageKey (D-04: Roma sin migración)', () => {
  it.each([
    ['pace', 'roma-pace'], ['light', 'roma-light'], ['resumen', 'roma-resumen'],
    ['note-pantheon', 'roma-note-pantheon'], ['note-galleria-sciarra', 'roma-note-galleria-sciarra'],
  ])('roma + %s → %s', (name, key) => expect(tripStorageKey('roma', name)).toBe(key))
  it('otro viaje no colisiona', () => expect(tripStorageKey('prueba', 'note-spagna')).not.toBe(tripStorageKey('roma', 'note-spagna')))
})
describe('tripStateKey (D-08)', () => {
  it('sufija con el slug', () => expect(tripStateKey('roma', 'cardNav:stack')).toBe('cardNav:stack:roma'))
})
```

### Aislamiento de búsqueda a nivel de datos (PLAT-01, en la puerta)
```typescript
// tests/unit/searchIsolation.spec.ts — carga monuments de cada viaje como dayRoute.spec.ts
const roma = createSearchIndex(loadMonuments('roma'))
const prueba = createSearchIndex(loadMonuments('prueba'))
expect(roma.search('Pantheon').map(r => r.slug)).toContain('pantheon')
expect(prueba.search('Pantheon')).toEqual([])
const fontana = prueba.search('Fontana').map(r => r.slug)
expect(fontana).toEqual(['fontana-pruebas']) // ni fontana-trevi ni fontanone de Roma
```

### Guardián de código fuente contra reacoplamientos (Pitfall 2 del milestone)
```typescript
// tests/unit/tripCoupling.spec.ts — Node puro: lee app/composables/*.ts y app/components/*.vue
// Falla si reaparece: useTrip('roma') | 'roma-' / `roma- en código (no en comentarios) |
// useState<…>('literal') sin tripStateKey | shallowRef<MiniSearch
// Excepciones explícitas: app/pages/index.vue (slug="roma", Fase 11) y nuxt.config.ts ('roma-theme', D-07).
```
Conviene quitar los comentarios antes de buscar: los ficheros actuales mencionan `'roma'` y `roma-note-` en comentarios largos. Usar un *strip* simple de `//…` y `/* … */` en `.ts`, y del bloque `<script>` en `.vue`.

### E2E de aislamiento contra dev (PLAT-01/02/03 en un viaje real)
```typescript
// playwright.trips.config.ts
export default defineConfig({
  testDir: './tests/trips',
  workers: 1,
  webServer: {
    command: 'pnpm dev --port 5300',
    url: 'http://localhost:5300/guiaRoma/',
    timeout: 180_000,
    reuseExistingServer: false,
    env: { NUXT_APP_BASE_URL: '/guiaRoma/' },
  },
  use: { baseURL: 'http://localhost:5300' },
  projects: [{ name: 'desktop', use: { viewport: { width: 1280, height: 800 }, browserName: 'chromium' } }],
})
// tests/trips/isolation.spec.ts — casos:
//  1. /guiaRoma/trips/prueba: fill('Pante') → '#search-results .search-result' sin 'Pantheon';
//     fill('Fontana') → solo 'Fontana de las Pruebas'.   /guiaRoma/: fill('Pante') → 'Pantheon'.
//  2. prueba: dispatchEvent('click') en a.tl-title[href="#torre-ensayo"] → #torre-ensayo.highlight,
//     #back-btn.show; click #back-btn → scrollY vuelve al origen; scroll a #viernes → .nav-pill.active[href="#viernes"].
//  3. contexto nuevo con addInitScript(roma-pace=slow, roma-note-spagna='R'):
//     prueba → .pace-btn activo = optimistic, textarea #note-spagna vacío; escribir 'P' → localStorage
//     prueba-note-spagna='P' y roma-note-spagna sigue 'R'; cambiar ritmo → prueba-pace escrito, roma-pace sigue 'slow'.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useTrip('roma')` dentro de los controllers | Slug por `inject`, o por argumento en el dueño | Fase 9 | Cualquier viaje navega y busca contra sus propios datos |
| Índice MiniSearch único de módulo | `Map<slug, MiniSearch>` | Fase 9 | Sin resultados cruzados ni choques de ids iguales (`spagna`) |
| `tests/data` con `ROOT = …/roma` | `describe.each` sobre las carpetas de `content/trips` | Fase 9 | Ningún viaje entra sin validar (Pitfall 8) |
| Mensajes de fallo con ruta absoluta o volcado JSON | `Violation{file,…}` relativo + `z.prettifyError` | Fase 9 | El colaborador de un PR ve qué fichero y qué campo |

**Deprecated/outdated:** `z` importado desde `@nuxt/content` (deprecado; ya se usa `zod` directo).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Añadir `.regex(/^[a-z0-9]+$/)` a `TripSchema.slug` no afecta a la generación de columnas de Content (el `pattern` del JSON-Schema no influye en el tipo SQL) | Pattern 5 / Inventario | Bajo: `generateCollectionTableDefinition` solo mira `sqlType`/`maxLength` (`module.mjs:2554-2565`), y zod 4 emite `{"type":"string","pattern":"^[a-z0-9]+$"}` (verificado). Se confirma con `rm -rf .data .nuxt .output && pnpm generate` |
| A2 | `pnpm dev` con `webServer` de Playwright evita en la práctica la fragilidad del lock rancio documentada en la Fase 5 | Pitfall 7 / Validation | Medio: si falla, el E2E queda como comprobación manual a demanda; la puerta (unit + data + paridad) no depende de él |
| A3 | El mecanismo para excluir borradores del `sql_dump` en la Fase 11 (`source.exclude`, hook, o guard en `[slug].vue`) | Runtime State Inventory | Solo afecta a la Fase 11; aquí es un hallazgo |
| A4 | Las fichas de prueba con `hero.src` en `example.invalid` disparan `@error` → SVG de `motif` también en dev | Pattern 6 | Bajo: es solo estético en dev; el E2E no lo afirma |
| A5 | Ningún texto inventado de prueba casará con «Pante» por prefijo o fuzzy, si se evitan palabras parecidas a «pantheon» | Pattern 6 | Bajo: el test unitario de `searchIsolation` lo detecta enseguida |

## Open Questions

1. **¿El E2E de aislamiento entra en `pnpm verify`?**
   - What we know: los criterios 1-3 piden comportamiento «en cualquier guía», y solo un servidor (dev) sirve `/trips/prueba` en esta fase. El único test dev existente está excluido de la puerta por fragilidad (`tests/README.md` §2).
   - What's unclear: la estabilidad real de `pnpm dev` bajo `webServer`.
   - Recommendation: dejarlo **fuera** de `verify` como `pnpm test:trips` (script nuevo), obligatorio en la verificación de la fase y documentado en `tests/README.md` (sección nueva, sin tocar §4). La puerta cubre PLAT-01/03 con unit/data, y la paridad de Roma cubre el cableado de Roma. En la Fase 11, con prerender por viaje, el E2E puede pasar a la build estática y entrar en la puerta.
2. **¿`verify` empieza con limpieza de cachés?**
   - Recommendation: sí, si el planificador lo acepta (cambio de una línea en `package.json`, fuera de `tests/parity/`). Evita el fallo silencioso de contenido rancio, que esta fase provoca justo al añadir `prueba`.
3. **¿Regla `unknown-key` (campos desconocidos) en esta fase?**
   - What we know: hoy ningún YAML de Roma tiene claves fuera de su `row.shape` (verificado en esta sesión con las 6 colecciones).
   - Recommendation: incluirla. Es barata, encaja con D-09 («estar roto» rompe la puerta) y atrapa erratas que zod tira sin avisar.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | todo | ✓ | v24.19.0 | — |
| pnpm | scripts (`verify`, `dev`) | ✓ vía `corepack pnpm` (**no** en el PATH del shell del agente) | 10.32.1 | Shim en el scratchpad (Pitfall 6) |
| Vitest | `test:unit`, `test:data` | ✓ | 4.1.9 (baseline: 13 ficheros, 382 tests verdes, 0,56 s) | — |
| Playwright + Chromium | paridad y E2E | ✓ | 1.61.0; chromium-1228 instalado (= revisión requerida) | — |
| `@nuxt/test-utils` | (no se usa) | ✗ | — | Utils puras + guardián + E2E |

**Missing dependencies with no fallback:** ninguna.
**Missing dependencies with fallback:** `pnpm` en el PATH → shim de corepack.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (Node puro, `vitest.config.ts` con `include: ['tests/data/**/*.spec.ts', 'tests/unit/**/*.spec.ts']`) + Playwright 1.61.0 |
| Config file | `vitest.config.ts`; `playwright.gate.config.ts` (paridad, **no tocar**); `playwright.trips.config.ts` (NUEVO, Wave 0) |
| Quick run command | `node_modules/.bin/vitest run tests/unit tests/data` (< 2 s) |
| Full suite command | `rm -rf .data .nuxt .output && pnpm verify` (con el shim de pnpm) |
| E2E aislamiento | `pnpm exec playwright test -c playwright.trips.config.ts` (script `test:trips`) |

### Phase Requirements → Test Map
| Req ID / SC | Behavior | Test Type | Automated Command | File Exists? |
|-------------|----------|-----------|-------------------|-------------|
| PLAT-01 / SC1 | Índice por viaje: «Pantheon» en Roma sí y en prueba no; «Fontana» en prueba solo la suya | unit (datos reales) | `vitest run tests/unit/searchIsolation.spec.ts` | ❌ Wave 0 |
| PLAT-01 / SC1 | Cableado real: el dropdown de `/trips/prueba` no muestra fichas de Roma | E2E dev | `pnpm test:trips -g "búsqueda"` | ❌ Wave 0 |
| PLAT-01/02/03 | No reaparece `useTrip('roma')`, `'roma-…'` literal, `useState` sin sufijo ni índice de módulo único | unit (guardián de código fuente) | `vitest run tests/unit/tripCoupling.spec.ts` | ❌ Wave 0 |
| PLAT-02 / SC2 | Enlace a ficha en prueba → `.highlight` + `#back-btn.show`; «Volver» restaura el scroll; `.nav-pill.active` sigue al scroll | E2E dev | `pnpm test:trips -g "navegación"` | ❌ Wave 0 |
| PLAT-02 / SC2 (Roma) | La navegación de Roma sigue igual | paridad (sin cambios) | `pnpm test:parity` (`navigation.spec.ts`, 6 tests) | ✅ |
| PLAT-03 / SC3 | `tripStorageKey('roma', x)` == claves actuales | unit | `vitest run tests/unit/tripStorage.spec.ts` | ❌ Wave 0 |
| PLAT-03 / SC3 (Roma) | `roma-pace`/`roma-light`/`roma-resumen`/`roma-note-*` se leen y escriben | paridad (sin cambios) | `pnpm test:parity` (`modes.spec.ts` 14, `map-fallback-notes.spec.ts` 12) | ✅ |
| PLAT-03 / SC3 | Prueba arranca con los valores por defecto aunque `roma-pace=slow`; `prueba-note-spagna` no toca `roma-note-spagna` | E2E dev | `pnpm test:trips -g "preferencias"` | ❌ Wave 0 |
| PLAT-04 / SC4 | Todos los viajes validan esquema + invariantes; los fallos nombran el fichero | data | `vitest run tests/data` | ⚠️ modificar `schema.spec.ts`/`invariants.spec.ts` + nuevo `tests/data/trips.ts` |
| PLAT-04 / SC4 | La puerta tiene dientes: slug inválido, carpeta≠slug, id duplicado, id=`mapa`, `#pantheon` en prueba, `meta` de nivel superior, fichero suelto, `trip.yml` ausente → violación con `file` | data (fixtures en memoria y en `tests/data/fixtures/trips/`) | `vitest run tests/data/invariants.spec.ts -t "dientes"` | ❌ Wave 0 |
| PLAT-04 / SC4 | Conteos y `migration-diff` solo de Roma | data | `vitest run tests/data/schema.spec.ts -t "conteo"` + `tests/data/migration-diff.spec.ts` | ✅ (conservar) |
| SC5 | Paridad de Roma verde sin tocar `tests/parity/` ni los goldens | paridad + git | `pnpm test:parity` y `git diff --quiet HEAD -- tests/parity/ && ls tests/parity/golden.spec.ts-snapshots/ \| wc -l` (= 56) | ✅ |
| SC5 / D-02 | La build no emite `trips/` y Roma no contiene datos de prueba | paridad + data | `shell.spec.ts` («la build NO emite el directorio trips/»); nuevo `grep -c PRUEBA-CENTINELA-9F3 .output/public/index.html .output/public/_payload.json` = 0 (spec Vitest que lea `.output`, con `skipIf` si no hay build) | ✅ / ❌ Wave 0 |
| — | Conteo de la puerta de paridad intacto | listado | `pnpm exec playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView" --list \| tail -1` → `Total: 80 tests in 11 files` | ✅ |

### Sampling Rate
- **Per task commit:** `node_modules/.bin/vitest run tests/unit tests/data`
- **Per wave merge:** `rm -rf .data .nuxt .output && pnpm verify`
- **Phase gate:** `pnpm verify` verde + `pnpm test:trips` verde + `git diff --quiet HEAD -- tests/parity/` + listado = 80, antes de `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/data/trips.ts`: loader y `checkTrip` puros (base de PLAT-04)
- [ ] `tests/data/fixtures/trips/` (p. ej. `campania-2027/trip.yml`, `otro/trip.yml` con `slug: distinto`, `sin-trip/days/x.yml`): fixtures del loader
- [ ] `tests/unit/tripStorage.spec.ts`, `tests/unit/searchIsolation.spec.ts`, `tests/unit/tripCoupling.spec.ts`
- [ ] `playwright.trips.config.ts` + `tests/trips/isolation.spec.ts` + script `test:trips` en `package.json`
- [ ] `content/trips/prueba/` (fixture de aislamiento; validado por la misma puerta)
- [ ] Spec de «Roma sin centinela de prueba» sobre `.output/public` (con `describe.skipIf(!existsSync(...))`)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (sitio estático sin cuentas) |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | sí | zod (`TripSchema.slug` con regex), invariantes en `tests/data`; slug de URL validado contra la colección (guard 404 en `pages/trips/[slug].vue`) |
| V6 Cryptography | no | — |

### Known Threat Patterns for Nuxt SSG + localStorage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Slug de URL usado como prefijo de claves de `localStorage` | Tampering | Solo se monta `TripView` si el slug existe en la colección `trip` (`[slug].vue` lanza 404 fatal); los slugs cumplen `^[a-z0-9]+$` (D-05) |
| Valor manipulado en `localStorage` (`<slug>-pace`) | Tampering | Se conserva la validación contra los 3 literales antes de asignar (`useTripModes.ts:92-95`) |
| Nota del usuario reflejada en el DOM | XSS almacenado | Se mantiene `:value` (nunca `v-html`) en `MonumentCard` |
| Colisión de claves en el origen compartido `<user>.github.io` | Information disclosure / Tampering | Prefijo por viaje siempre; prohibido enumerar `localStorage` por prefijo |
| Contenido de un borrador público en `sql_dump.txt` | Information disclosure | Fase 11 (filtro `draft` aplicado también al dump); en la Fase 9 no hay despliegue |

## Sources

### Primary (HIGH confidence)
- Código de esta rama leído en la sesión: `app/composables/useSearch.ts`, `useCardNavigation.ts`, `useTripModes.ts`, `useTrip.ts`; `app/components/TripView.vue`, `MonumentCard.vue` (1-200), `SearchBox.vue`, `NavPills.vue`, `BackButton.vue`, `TheHero.vue` (40-60, 112-132), `GastroSection.vue`; `app/pages/index.vue`, `app/pages/trips/[slug].vue`; `app/app.vue`; `shared/schemas.ts`; `content.config.ts`; `nuxt.config.ts`; `package.json`; `vitest.config.ts`; `playwright*.config.ts`; `tests/data/schema.spec.ts`, `invariants.spec.ts`, `migration-diff.spec.ts` (1-80); `tests/parity/shell.spec.ts` (140-300), `navigation.spec.ts` (120-200); `tests/README.md`; `app/utils/searchIndex.ts`
- `node_modules/.pnpm/@vue+runtime-core@3.5.38/.../runtime-core.cjs.js:790-804` (`inject`), `:3643-3668` (`withAsyncContext`)
- `node_modules/.pnpm/@nuxt+content@3.14.0…/dist/module.mjs:2117-2153` (`metaStandardSchema`), `:2554-2565` (definición de tabla)
- `.output/public` actual: `index.html` (claves `$s…` del payload), `_nuxt/B5xoPlow.js` (checksums), `__nuxt_content/*/sql_dump.txt` (decodificado), `404.html`/`200.html`
- Comprobaciones en esta sesión: `vitest run tests/data tests/unit` (382 verdes); zod 4 `toJSONSchema` con `.regex` → `pattern`; `z.prettifyError`; zod elimina claves desconocidas; claves de Roma ⊆ `row.shape`; `corepack pnpm` 10.32.1
- `.planning/research/ARCHITECTURE.md` §2, §5.2, §5.5, §8; `.planning/research/PITFALLS.md` (4, 5, 8, 9)

### Secondary (MEDIUM confidence)
- [Vitest — describe API](https://vitest.dev/api/describe): `describe.each` (compatibilidad Jest) y `describe.skipIf`

### Tertiary (LOW confidence)
- Ninguna afirmación crítica depende solo de fuentes de baja confianza.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (sin paquetes nuevos; versiones leídas de `package.json` y `node_modules`)
- Architecture: HIGH (árbol de consumidores e inyección verificados en el código y en el runtime de Vue)
- Pitfalls: HIGH (self-inject, reservados anidados, `trip.yml` sin `trip`, PATH de pnpm: todo verificado en esta sesión). MEDIUM en la estabilidad del E2E en dev.

**Research date:** 2026-11-20
**Valid until:** 2026-12-20 (código estable; revalidar si se actualizan Nuxt/Content/Vue, PLAT-05)
