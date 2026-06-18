# Stack Research

**Domain:** Re-plataformado de una guía de viaje estática (`index.html`, 6.665 líneas) a **Nuxt 4** — estática (`nuxt generate`), offline, data-driven, multi-viaje, con **paridad 100%** visual y funcional.
**Researched:** 2026-06-18
**Confidence:** HIGH (versiones verificadas contra el registro npm el 2026-06-18; APIs verificadas contra docs oficiales de Nuxt 4.x y Nuxt Content v3)

> Esta investigación responde al **CÓMO** (la cadena de herramientas Nuxt 4 concreta de 2026), no al QUÉ (framework ya decidido: Nuxt 4). La decisión transversal y de mayor peso —**el formato de contenido**— se resuelve abajo con esquema concreto. Todo lo demás se justifica contra cuatro restricciones innegociables: **paridad**, **offline**, **estático (GitHub Pages)** y **multi-viaje**.

---

## TL;DR — Decisiones prescriptivas

| # | Decisión | Veredicto | Confianza |
|---|----------|-----------|-----------|
| 1 | **Formato de contenido** | **Híbrido sesgado a estructura: un fichero por viaje en Nuxt Content v3 `type: 'data'` (YAML), con la prosa como *campos string Markdown-inline* renderizados con `<MDC>`.** No Markdown-por-ficha. No JSON crudo a mano. | HIGH |
| 2 | **Capa de datos** | **Nuxt Content v3** (`@nuxt/content` 3.14.0) con colecciones `defineCollection({ type: 'data' })` + esquema **zod 4**. No `useState` ni JSON suelto en `/public`. | HIGH |
| 3 | **Generación estática** | `nuxt build --preset github_pages` + `app.baseURL` vía `NUXT_APP_BASE_URL=/guiaRoma/` + `nitro.prerender.crawlLinks: true` + `.nojekyll`. | HIGH |
| 4 | **Mapa** | **Leaflet 1.9.4 crudo** dentro de un **componente `client-only`** propio. **NO** `@vue-leaflet/vue-leaflet` (abandonado desde 2023). Assets self-hosted (CSS + marker images). | HIGH |
| 5 | **CSS / tokens** | **Conservar el CSS escrito a mano tal cual**, como CSS global + `@layer`. **NO** Tailwind/UnoCSS. Las custom properties existentes ya SON el sistema de tokens. | HIGH |
| 6 | **Tooling** | TypeScript (nativo en Nuxt 4) + **`@nuxt/eslint` 1.16.0** (flat config, integra Prettier vía `stylistic`) + **Vitest 4** vía **`@nuxt/test-utils` 4** + Playwright para verificación de paridad. | HIGH |
| 7 | **Búsqueda cliente** | **MiniSearch 7.2.0**, indexando **datos** (no DOM). No fuse.js, no filtro `includes()`. | HIGH |
| 8 | **Tema sin FOUC** | **`@nuxtjs/color-mode` 4.0.1** con `dataValue: 'theme'` → emite `<html data-theme="dark">`, exactamente el selector del CSS actual. Cero reescritura, cero flash. | HIGH |
| 9 | **PWA** | **Fuera de alcance 1.0.** Ruta v2 = **`@vite-pwa/nuxt` 1.1.1**. Solo anotado. | HIGH |

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **nuxt** | **4.4.8** | Framework (Vue 3 + Nitro + Vite) | Versión estable actual de la rama 4.x (4.4.8 es hotfix de 2026-06-08). Decidido por el equipo; Nitro habilita el backend v2 (auth/uploads). SSG de primera clase vía `nitro.prerender`. |
| **vue** | **3.5.x** (transitiva de Nuxt 4) | Capa de UI / componentes | La gestiona Nuxt; no fijar a mano. `<script setup>` + Composition API para los componentes (ficha, timeline, mapa, controles). |
| **@nuxt/content** | **3.14.0** | Capa de datos tipada (git-based) + render de prosa | v3 introduce **colecciones** (`defineCollection`) con esquema **zod**, query SQL-like (`queryCollection`) y prerender automático de todo el contenido a SQLite/estático. Es la pieza que convierte "contenido a mano en HTML" en "datos tipados validados". Multi-viaje = añadir ficheros que casan con el `source` glob. |
| **zod** | **4.4.3** | Esquema/validación del modelo de viaje | Fuente de verdad de los tipos TS de las colecciones. **Importar desde `zod` directamente** (`import { z } from 'zod'`); el re-export `z` de `@nuxt/content` está **deprecado**. zod 4 exporta JSON-Schema nativo (sin `zod-to-json-schema`). |
| **leaflet** | **1.9.4** | Mapa interactivo con marcadores | Misma librería que ya usa el `index.html` (la API `L.map`/`L.divIcon`/`L.tileLayer`/`fitBounds` se porta 1:1). Estable desde 2024. **Usada cruda**, no envuelta. |
| **@nuxtjs/color-mode** | **4.0.1** | Tema claro/oscuro persistente, sin FOUC | Inyecta un **script inline en `<head>`** que aplica el tema **antes del primer paint** (cero flash en SSG). Con `dataValue: 'theme'` produce `<html data-theme="dark">` — el **mismo selector** que el CSS actual: paridad sin tocar estilos. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **minisearch** | **7.2.0** | Búsqueda full-text en cliente sobre datos | Indexar los campos de las fichas (nombre, italiano, prosa, día) en memoria al montar. Sin dependencias, ~aporta typo-tolerance y prefijo. Reemplaza el `cards.filter(c => c.content.includes(q))` actual. |
| **@nuxt/fonts** | **0.14.0** | Auto-hosting de Cormorant Garamond / Lora / JetBrains Mono | *(Opcional pero recomendado para offline)* Descarga y sirve las fuentes desde el propio dominio en build. Hoy dependen de Google Fonts (red). Para uso "paseando por Roma" conviene self-host. Cero-config: detecta `font-family` en el CSS. |
| **@nuxt/image** | **2.0.0** | *(Opcional, evaluar)* optimización de imágenes hero | Solo si se quiere mejorar la carga de imágenes locales. **Ojo:** las imágenes hero hoy son **URLs de terceros (Wikimedia)** con fallback SVG; `@nuxt/image` con provider estático no las procesa en build. Probablemente **NO** en 1.0 (rompería el patrón `onerror` de fallback). Anotado como posible v2. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **@nuxt/eslint** (1.16.0) | Linting con flat config generada por el proyecto | Módulo oficial. `npx nuxi module add eslint`. Genera `eslint.config.mjs` consciente de las reglas de Nuxt. Activar `config.stylistic` para formateo (alternativa integrada a Prettier; ver "Alternatives"). |
| **eslint** (10.5.0) | Motor de lint | Peer de `@nuxt/eslint`. Flat config (`eslint.config.mjs`), no `.eslintrc`. |
| **prettier** (3.8.4) | Formateo (si se prefiere a `stylistic`) | Solo si el equipo ya tiene hábito Prettier. Para evitar la guerra ESLint↔Prettier, usar `eslint-config-prettier` que apaga las reglas de formato de ESLint. |
| **typescript** (5.9.x, transitiva) | Tipado | Nuxt 4 trae TS de serie. `nuxi typecheck` (usa `vue-tsc`). Los tipos del viaje salen **gratis** del esquema zod de las colecciones. |
| **vitest** (4.1.9) | Tests unitarios/componentes | A través de `@nuxt/test-utils`. Para lógica pura: selector de ritmo, "ruta del día" (cap de 10 paradas), construcción del índice de búsqueda, validación de esquema. |
| **@nuxt/test-utils** (4.0.3) | Puente Nuxt↔Vitest/Playwright | Provee `mountSuspended`, `mockNuxtImport`, runtime de test de Nuxt. Imprescindible para testear componentes que usan `queryCollection`/auto-imports. |
| **@playwright/test** (1.x) | **Verificación de PARIDAD** (E2E + visual) | El listón de la 1.0 es "idéntico al `index.html`". Playwright permite **screenshots a pixel** y snapshots de comportamiento (cambiar ritmo, tema, búsqueda, ruta del día). Ver sección "Verificación de paridad". |

## Installation

```bash
# Andamiaje del proyecto (en la rama de release, dejando index.html intacto en main)
npx nuxi@latest init guiaroma-nuxt

# Core de datos + validación
npm install @nuxt/content@^3.14.0 zod@^4.4.3

# Mapa (Leaflet crudo) y sus tipos
npm install leaflet@^1.9.4
npm install -D @types/leaflet

# Tema sin FOUC + búsqueda + fuentes self-host
npm install @nuxtjs/color-mode@^4.0.1 minisearch@^7.2.0
npm install @nuxt/fonts@^0.14.0

# Tooling
npx nuxi module add eslint            # instala y configura @nuxt/eslint + eslint
npm install -D vitest@^4.1.9 @nuxt/test-utils@^4.0.3 @vue/test-utils happy-dom
npm install -D @playwright/test       # verificación de paridad
```

```ts
// nuxt.config.ts — esqueleto prescriptivo
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/color-mode', '@nuxt/fonts', '@nuxt/eslint'],

  // --- Tema: paridad con el CSS [data-theme] actual, sin flash ---
  colorMode: {
    preference: 'system',     // respeta prefers-color-scheme (como hoy)
    fallback: 'light',        // el <html> hoy arranca data-theme="light"
    dataValue: 'theme',       // => <html data-theme="dark"> (mismo selector del CSS)
    storageKey: 'roma-theme', // MISMA clave de localStorage que el index.html actual
    classSuffix: '',          // no añadir clases -mode (usamos solo el data-attribute)
  },

  // --- Estático para GitHub Pages ---
  // baseURL se inyecta por env en CI: NUXT_APP_BASE_URL=/guiaRoma/
  nitro: {
    preset: 'github_pages',
    prerender: {
      crawlLinks: true,       // sigue los <a> y prerenderiza todo
      routes: ['/'],          // semilla
      failOnError: true,      // que el build pete si una ruta falla (parity guard)
      // autoSubfolderIndex: true es el default -> /viernes -> /viernes/index.html
    },
  },

  // --- CSS global escrito a mano (tokens incluidos) ---
  css: ['~/assets/css/tokens.css', '~/assets/css/base.css', '~/assets/css/leaflet.css'],

  content: {
    // ver content.config.ts para las colecciones
  },
})
```

---

## 1. Formato de contenido — DECISIÓN (máxima prioridad)

> **Veredicto:** **Híbrido sesgado a estructura.** Un **fichero de datos por viaje** (`content/trips/roma.yml`) como colección **`type: 'data'`** de Nuxt Content v3, validado con **zod 4**. La **prosa literaria vive dentro de campos string en sintaxis Markdown-inline** y se renderiza con el componente **`<MDC>`** de Nuxt Content. **NO** se elige "Markdown-por-ficha", y **NO** se elige "JSON crudo escrito a mano".

### Por qué, contra las tres opciones planteadas

**Lo que el contenido ES realmente** (verificado leyendo `index.html`): no es "un artículo Markdown". Cada lugar es un **registro fuertemente estructurado** —`id`, número romano, nombre, italiano, `day`, `lat`/`lng`, `type` (`card`/`guided`/`concert`), motivo SVG de fallback, `facts` (pares clave/valor), badges, cajas tipadas (`sorrentino-box`, `culture-box` con sub-ítems), `detail-photo` con caption— **más** varios **bloques de prosa en secciones nombradas** (`Qué es`, `Historia`, `Anécdotas`, `En qué fijarse`). Esa prosa lleva `<em>`/`<strong>` y **densos enlaces cruzados internos** (`#g-fortunata`, `#arte-bernini`, `#arq-moderna`). Hay **tres familias** de ficha con esquemas distintos: monumentos (38), gastronomía (26), artistas. La proporción **estructura/prosa es alta**: el 60-70% de cada ficha son campos, no narrativa libre.

| Opción | Veredicto | Razonamiento para ESTE contenido |
|--------|-----------|----------------------------------|
| **(a) JSON 100% estructurado** | ❌ Rechazada | La parte estructurada encaja perfecta, pero meter párrafos literarios con comillas, `<em>` y enlaces dentro de strings JSON es **horrible de editar en PR**: sin saltos de línea, escapado de comillas, diffs ilegibles. Mata la ergonomía para colaboradores no expertos. |
| **(b) Markdown-por-ficha + JSON aparte** | ❌ Rechazada | Parte un solo registro en **dos artefactos desincronizables** (¿el `.md` y el `.json` del mismo lugar?). "Añadir un viaje = añadir ficheros" se vuelve "añadir ~64 pares de ficheros + mantener IDs cruzados a mano". Markdown brilla con **un cuerpo largo + frontmatter ligero**; aquí es al revés (mucho campo, prosa troceada en N secciones). El frontmatter se volvería gigantesco y el cuerpo, fragmentario. |
| **(c) Híbrido en Nuxt Content `type: 'data'` (YAML) + prosa en campos MDC** | ✅ **Elegida** | Un registro = un bloque YAML cohesionado. **YAML soporta strings multilínea legibles** (bloque `|`) para la prosa, con `_negritas_`/`*cursivas*`/`[enlaces](#id)` Markdown-inline. La estructura (coords, facts, type, motif) son campos YAML naturales y **validados por zod**. Un solo fichero por viaje → multi-viaje trivial. Diffs de PR limpios. Tipos TS gratis. |

**Matiz importante sobre el formato físico del fichero:** Nuxt Content `type: 'data'` acepta **`.json`, `.yml`/`.yaml` y `.csv`** como `source`. **Se recomienda YAML, no JSON**, precisamente por los strings multilínea de prosa: YAML permite escribir un párrafo de tres líneas sin comillas ni `\n`, lo que es la diferencia entre un PR revisable y uno ilegible. El esquema zod es idéntico sea YAML o JSON.

**Por qué un fichero por viaje y no uno por ficha:** con ~64 fichas, un único `roma.yml` (o partido por día: `roma/viernes.yml`…) mantiene los **enlaces cruzados** y el **orden del timeline** en un sitio, hace `git blame`/PR coherentes, y "añadir Florencia" = crear `content/trips/florencia/`. Si el fichero único se hace incómodo de editar, **partir por día** (`content/trips/roma/by-day/viernes.yml`) o por dominio (`monuments.yml`, `food.yml`, `artists.yml`) — el `source` glob los une en la misma colección. Recomendación: **partir por dominio** (3 ficheros: lugares, gastronomía, artistas) + 1 fichero `trip.yml` con metadatos del viaje y el orden de días/timeline.

### Cómo se renderiza la prosa

La prosa en campos string **no se renderiza sola** (no es el cuerpo de una página `type: 'page'`). Se renderiza con el componente **`<MDC :value="ficha.historia" />`** de Nuxt Content, que parsea Markdown-inline (negrita, cursiva, enlaces) en tiempo de cliente/render. Esto reproduce **exactamente** los `<em>`/`<strong>`/`<a>` del HTML actual. Los **enlaces internos** `[Osteria da Fortunata](#g-fortunata)` se interceptan igual que hoy (el JS actual ya enruta `a[href^="#"]` a `navigateToCard`); en Nuxt se hace con un componente Prose-link o un listener delegado.

> Alternativa de render si se quiere evitar `<MDC>` por ficha-campo: una directiva/composable `useInlineMarkdown` que convierta el string a HTML con un micro-parser (negrita/cursiva/enlace). Pero `<MDC>` ya viene incluido y es la vía soportada — **usar `<MDC>`**.

### Esquema concreto (sketch)

```ts
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'   // NO importar z desde @nuxt/content (deprecado)

// --- Sub-esquemas reutilizables ---
const Coords = z.object({ lat: z.number(), lng: z.number() })

const Fact = z.object({          // las filas de la caja .facts
  label: z.string(),
  value: z.string(),
})

const DetailPhoto = z.object({
  src: z.string().url(),
  alt: z.string(),
  caption: z.string(),           // admite Markdown-inline
})

const CultureRef = z.object({    // ítems de .culture-box
  title: z.string(),
  text: z.string(),              // Markdown-inline (prosa)
})

// --- Ficha de monumento (.card) ---
const monument = defineCollection({
  type: 'data',
  source: 'trips/*/monuments.yml',     // multi-viaje por glob
  schema: z.object({
    id: z.string(),                    // 'fontana-trevi'
    roman: z.string(),                 // 'II', '★', '♪'
    name: z.string(),                  // 'Fontana di Trevi'
    italian: z.string(),               // 'Fontana di Trevi · Rione Trevi'
    day: z.string(),                   // 'Viernes' | 'Viernes / Sábado'
    coords: Coords,
    type: z.enum(['card', 'guided', 'concert']),
    motif: z.enum([                    // mapea al SVG fallback (CARD_TO_MOTIF)
      'dome','pantheon','arch','fountain','obelisk','statue','painting',
      'church','fortress','temple','garden','keyhole','mask','monument',
      'rooftops','library','tower','stairs','coffee',
    ]),
    badge: z.string().optional(),      // 'Sorrentino'
    hero: z.object({ src: z.string().url(), alt: z.string() }),
    // --- Prosa por secciones (Markdown-inline en bloque YAML |) ---
    sections: z.object({
      queEs:        z.string(),                 // 'Qué es'
      historia:     z.string(),
      anecdotas:    z.string().optional(),
      enQueFijarse: z.array(z.string()).optional(),  // <li> de .detail-list
    }),
    detailPhoto: DetailPhoto.optional(),
    facts: z.array(Fact),
    mapsQuery: z.string(),             // texto para el enlace Google Maps
    sorrentino: z.string().optional(), // contenido .sorrentino-box (Markdown)
    culture: z.array(CultureRef).optional(),
  }),
})

// --- Ficha de gastronomía (.gastro-card) ---
const food = defineCollection({
  type: 'data',
  source: 'trips/*/food.yml',
  schema: z.object({
    id: z.string(),                    // 'g-roscioli'
    name: z.string(),
    badge: z.string(),                 // 'trattoria' | 'salumeria + cucina'…
    address: z.string(),
    desc: z.string(),                  // prosa Markdown-inline
    plato: z.string(),                 // 'Plato estrella: …'
    price: z.string(),                 // '€40-55/persona'
    schedule: z.string(),              // 'Lun–Sáb'
    mapsQuery: z.string(),
    reserved: z.object({               // si está reservado
      when: z.string(), people: z.number(),
    }).optional(),
  }),
})

// --- Ficha de artista/arquitecto (.artist-card) ---
const artist = defineCollection({
  type: 'data',
  source: 'trips/*/artists.yml',
  schema: z.object({
    id: z.string(),                    // 'art-bernini'
    name: z.string(),
    dates: z.string(),                 // 'Nápoles 1598 – Roma 1680 · escultor'
    epithet: z.string(),
    sections: z.object({
      quienFue: z.string(),
      estilo: z.string(),
      obras: z.array(z.string()),
      porQueImporta: z.string(),
      comoReconocer: z.array(z.string()),
      curiosidades: z.array(z.string()).optional(),
    }),
    seenIn: z.array(z.object({ id: z.string(), label: z.string() })), // enlaces cruzados
  }),
})

// --- Metadatos del viaje + orden de timeline ---
const trip = defineCollection({
  type: 'data',
  source: 'trips/*/trip.yml',
  schema: z.object({
    id: z.string(),                    // 'roma'
    title: z.string(),                 // 'Roma · 19—23 giugno 2026'
    days: z.array(z.object({
      id: z.string(),                  // 'viernes'
      eyebrow: z.string(),             // 'venerdì · 19 giugno'
      title: z.string(),               // 'Centro Storico nocturno'
      subtitle: z.string(),
      stats: z.array(z.string()),
      timeline: z.array(z.any()),      // tl-item/tl-transport/tl-food — modelar en fase de diseño
    })),
    mapCenter: Coords,
    mapZoom: z.number(),
  }),
})

export default defineContentConfig({
  collections: { monument, food, artist, trip },
})
```

```yaml
# content/trips/roma/monuments.yml  (fragmento — prosa multilínea legible)
- id: galleria-sciarra
  roman: 'I'
  name: Galleria Sciarra
  italian: 'Galleria Sciarra · Rione Trevi'
  day: Viernes
  coords: { lat: 41.8999403, lng: 12.4820553 }
  type: card
  motif: arch
  badge: Sorrentino
  hero:
    src: https://turismoroma.it/sites/default/files/Galleria%20Sciarra.jpg
    alt: Galleria Sciarra
  sections:
    queEs: >
      Un patio cubierto de hierro y cristal en pleno centro, escondido entre
      dos calles, completamente decorado con frescos Liberty. Casi nadie sabe
      que existe.
    historia: |
      Lo construyó entre 1885 y 1888 el príncipe Maffeo Sciarra, heredero de
      una de las familias más antiguas de Roma — los Colonna — y mecenas de la
      cultura italiana de su tiempo. Encargó las pinturas a Giuseppe Cellini y
      le pidió la _Glorificación de la Mujer_.
    enQueFijarse:
      - 'El **techo de hierro y cristal**: filtra una luz cenital teatral.'
      - 'Las **cuatro virtudes**: _Pudica, Forte, Umile, Prudente_.'
  facts:
    - { label: Horario crítico, value: 'L-V 9:00-20:00 · cerrada finde' }
    - { label: Acceso, value: Gratuito }
  mapsQuery: Galleria Sciarra Roma
  sorrentino: >
    Aparece en un travelling fugaz hacia el minuto 0:45 de _La Grande Bellezza_.
```

**Esto satisface las cuatro restricciones:** PR-friendly (YAML con prosa legible), type-safe (zod → TS), multi-viaje (glob `trips/*/`), y la prosa renderiza idéntica vía `<MDC>`.

> ⚠️ **Punto a resolver en la fase de diseño (no en research):** el modelado fino del **timeline** (`tl-item`/`tl-transport`/`tl-food`/`tl-meta` con `data-pace`). Es la estructura más rica y anidada del HTML. Recomendación: modelarlo como array discriminado por `kind` (`'stop' | 'transport' | 'food' | 'meta'`) con zod `z.discriminatedUnion`. Marcado como flag de research para esa fase.

---

## 2. Capa de datos — Nuxt Content v3 vs JSON suelto vs useState

| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **Nuxt Content v3** | ✅ **Elegida** | Esquema zod = validación en build + tipos TS. `queryCollection('monument').all()` tipado. Prerender automático del contenido (en SSG, las queries se resuelven a un dump estático/SQLite servido como asset → **funciona offline** sin servidor). Render de prosa con `<MDC>`. Es literalmente "git-based CMS" para PRs. |
| **JSON en `/public` + `useFetch`** | ❌ | Sin validación, sin tipos, sin render de prosa. Habría que reimplementar a mano lo que Content da gratis. |
| **`useState` / composables con datos en `.ts`** | ❌ | Acopla datos a código (rompe "añadir viaje = añadir ficheros, sin tocar código"). Sin validación de esquema. Sin separación contenido/lógica para PRs de no-programadores. |

**Cómo funciona la validación/tipos (zod):** el `schema` de cada `defineCollection` es la **fuente de verdad**. En build, Content valida cada fichero contra el esquema (si falta `coords` o `type` no es del enum, **el build falla** — *parity/quality guard*). De ese esquema se derivan los tipos TS que tipan `queryCollection`. **Importar `z` desde `zod`** (4.4.3), no desde `@nuxt/content` (re-export deprecado). zod 4 trae JSON-Schema nativo (sin dependencia extra).

**Versiones:** `@nuxt/content` **3.14.0** + `zod` **4.4.3** + `nuxt` **4.4.8**. Compatibles (Content 3.14 soporta zod v3 y v4 explícitamente).

---

## 3. Generación estática para GitHub Pages

| Aspecto | Configuración | Notas |
|---------|---------------|-------|
| **Comando** | `nuxt build --preset github_pages` | Genera `.output/public` listo para Pages. (También vale `nuxt generate` + preset, pero el preset explícito es lo documentado oficialmente y es quien añade las piezas de Pages.) |
| **Base URL (subpath del repo)** | `NUXT_APP_BASE_URL=/guiaRoma/` en el step de build de CI | El sitio vive en `usuario.github.io/guiaRoma/`. Nuxt reescribe rutas y assets con ese prefijo. **No** hace falta si se usa dominio propio. Equivale a `app.baseURL` en `nuxt.config`. |
| **Preset Nitro** | `nitro.preset: 'github_pages'` | Variante de `static` específica de Pages. |
| **`.nojekyll`** | Verificar que aparece en `.output/public`; **si no, crearlo** | Necesario para que Pages **no** ignore carpetas que empiezan por `_` (Nuxt genera `_nuxt/`). El preset `github_pages` lo añade con `nuxt build --preset github_pages`; hay **fricción conocida** (issues nuxt#21232 / nuxt#12480) con `nuxt generate`. Mitigación robusta: un `nitro.hooks` o un fichero `public/.nojekyll`. |
| **Trailing slash** | `nitro.prerender.autoSubfolderIndex: true` (default) | `/viernes` → `.output/public/viernes/index.html`. Pages sirve URLs sin barra final correctamente con esta estructura. No tocar salvo problema. |
| **Crawl** | `nitro.prerender.crawlLinks: true` + `routes: ['/']` | Sigue los `<a>` y prerenderiza todas las rutas alcanzables. Si la app es una sola página larga con anclas (como hoy), basta `routes: ['/']`. |
| **Assets** | Automático con `baseURL` | El CSS, fuentes self-hosted (`@nuxt/fonts`), imágenes locales y assets de Leaflet self-hosted se sirven bajo `/guiaRoma/_nuxt/…`. **Evitar rutas absolutas hardcodeadas** (`/img/x.png`); usar imports o `~/assets`. |

```yaml
# .github/workflows/deploy.yml (esqueleto)
- run: npm ci
- run: NUXT_APP_BASE_URL=/guiaRoma/ npx nuxt build --preset github_pages
- uses: actions/upload-pages-artifact@v3
  with: { path: .output/public }
```

> **Riesgo a vigilar (MEDIUM):** el `.nojekyll` con `generate` vs `build --preset`. **Decisión:** usar `nuxt build --preset github_pages` Y añadir `public/.nojekyll` vacío como cinturón-y-tirantes.

---

## 4. Mapa — Leaflet crudo en client-only (NO el wrapper Vue)

**Veredicto: Leaflet 1.9.4 usado directamente dentro de un componente `client-only` propio.** **No** `@vue-leaflet/vue-leaflet`.

| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **`@vue-leaflet/vue-leaflet` 0.10.1** | ❌ Rechazada | **Última publicación 2023-06-16** (~3 años sin mantenimiento, sigue en 0.x). Riesgo de incompatibilidad con Vue 3.5/Nuxt 4 y de quedar huérfano. Además **abstrae** la API que el `index.html` ya usa cruda (`L.divIcon` con HTML custom para los marcadores romanos numerados, `fitBounds`, popups con `onclick`), por lo que el wrapper **complicaría** la paridad en vez de facilitarla. |
| **Leaflet 1.9.4 crudo en `<ClientOnly>`** | ✅ **Elegida** | La lógica del mapa actual se **porta casi literal** a un `onMounted` dentro de un componente `client-only`. Cero capa intermedia, cero dependencia abandonada. `@types/leaflet` da el tipado. |
| `@nuxtjs/leaflet` / `nuxt-leaflet` | ❌ | Módulos comunitarios de terceros; misma objeción (capa innecesaria + mantenimiento incierto) y menos control para la paridad exacta de marcadores. |

**Patrón concreto:**

```vue
<!-- components/TripMap.client.vue  (sufijo .client = solo cliente, sin SSR) -->
<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'          // CSS self-hosted desde node_modules
const props = defineProps<{ places: Place[]; center: [number, number]; zoom: number }>()
const el = ref<HTMLElement>()
onMounted(() => {
  const map = L.map(el.value!, { scrollWheelZoom: false }).setView(props.center, props.zoom)
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })
  let loaded = 0, errored = 0
  tiles.on('tileload', () => loaded++)
  tiles.on('tileerror', () => { errored++; if (errored > 3 && loaded === 0) showOfflineBanner() })
  tiles.addTo(map)
  // ...L.divIcon con el HTML del marcador romano, fitBounds(pad 0.1) — idéntico a hoy
})
</script>
<template><div ref="el" class="leaflet-map" /></template>
```

**Offline — cómo se conserva (CRÍTICO):**
- El `index.html` hoy **inlinea Leaflet CSS+JS** para no depender de CDN. En Nuxt el equivalente es **importar desde `node_modules`** (`import 'leaflet/dist/leaflet.css'` y `import L from 'leaflet'`): Vite los **bundlea y self-hostea** automáticamente bajo `/_nuxt/`. **Nunca** cargar Leaflet desde unpkg/CDN.
- Las **imágenes de marcador por defecto** de Leaflet (`marker-icon.png`, `marker-shadow.png`) tienen rutas problemáticas en bundlers. Como guiaRoma usa **`L.divIcon` (HTML puro, sin imágenes)** para todos los marcadores, **este problema no aplica** — un punto a favor de portar tal cual.
- **Tiles**: siguen siendo de OpenStreetMap (red). El **banner "sin conexión"** (detección `tileerror`) se porta 1:1. Cachear tiles offline real = PWA = **v2** (fuera de alcance).
- Filtro dark del mapa (`[data-theme="dark"] .leaflet-tile { filter: ... }`) se conserva en el CSS global.

**Versiones:** `leaflet` **1.9.4** + `@types/leaflet` (dev).

---

## 5. CSS / design tokens — conservar el CSS a mano (NO Tailwind/UnoCSS)

**Veredicto: trasvasar el CSS escrito a mano tal cual** a `assets/css/`, organizándolo en ficheros y opcionalmente `@layer`. Las **custom properties existentes (`:root` / `[data-theme="dark"]`) YA SON el sistema de tokens** — son mantenibles, semánticas y completas.

| Opción | Veredicto | Razón (sesgo: preservar el look exacto) |
|--------|-----------|------------------------------------------|
| **CSS global a mano + custom properties** | ✅ **Elegida** | El CSS actual (~2.200 líneas) **es** la fuente de verdad del look. Copiarlo verbatim = **paridad garantizada por construcción**. Los tokens (`--accent`, `--ink-soft`, `--gold`, paleta terracota/oro, `--shadow`, light/dark vía `[data-theme]`) ya están bien diseñados. Cero riesgo de drift visual. |
| **Tailwind** | ❌ Rechazada | Reescribir 2.200 líneas a utilidades = **enorme superficie de regresión visual**, justo lo que la 1.0 prohíbe. No aporta nada a una guía editorial con tipografía cuidada. Mapear los tokens a `tailwind.config` y luego reconstruir cada componente es trabajo puro con riesgo puro. |
| **UnoCSS** | ❌ Rechazada | Mismo argumento que Tailwind. La velocidad de UnoCSS es irrelevante aquí; el coste es la reescritura y el riesgo de paridad. |

**Cómo llevarlo a Nuxt manteniendo mantenibilidad:**
1. **`assets/css/tokens.css`** — el bloque `:root { … }` + `[data-theme="dark"] { … }` **verbatim**. Es el contrato de diseño; un solo sitio para tocar la paleta.
2. **`assets/css/base.css`** — reset, tipografía (`body`, `h1`…), utilidades globales.
3. **CSS por componente** — los estilos específicos de `.card`, `.timeline`, `.gastro-card`, etc. viven en `<style scoped>` de cada componente Vue **o** se dejan globales si dependen de selectores que cruzan componentes (p. ej. `.tl-hidden` togglea desde un control). Para parity rápida, empezar **todo global** y modularizar después.
4. **Tema**: como `@nuxtjs/color-mode` emite `<html data-theme="...">` (ver §8), **el CSS `[data-theme="dark"]` funciona sin un solo cambio**.
5. Opcional: envolver en `@layer tokens, base, components` para control de cascada al modularizar.

**Compatibilidad clave:** el CSS usa `color-mix(in srgb, …)` (líneas 802, 857…). Soportado en navegadores modernos; ningún preprocesador necesario. Sin SCSS, sin PostCSS extra (Nuxt/Vite ya hacen autoprefix).

---

## 6. Tooling / estandarización

| Pieza | Elección | Detalle |
|-------|----------|---------|
| **TypeScript** | Nativo Nuxt 4 | `nuxi typecheck`. Tipos del dominio derivados del esquema zod de Content. Componentes en `<script setup lang="ts">`. |
| **Lint** | **`@nuxt/eslint` 1.16.0** | `npx nuxi module add eslint` genera `eslint.config.mjs` (flat config) consciente de Nuxt. Un solo módulo, cero `.eslintrc` legacy. |
| **Formato** | **`@nuxt/eslint` con `config.stylistic`** (recomendado) **o** Prettier 3.8.4 | Lo más simple: activar `eslint({ config: { stylistic: true } })` y formatear con ESLint (una sola herramienta). Si el equipo ya usa Prettier, añadir `eslint-config-prettier` para que no choquen. **No** mezclar reglas de formato de ambos. |
| **Tests unitarios** | **Vitest 4.1.9 + `@nuxt/test-utils` 4.0.3** | Para lógica pura/portada: selector de ritmo (`optimistic/neutral/slow`), "ruta del día" (cap de 10 paradas, muestreo), construcción del índice MiniSearch, **validación del esquema zod** (un test que falle si el contenido no valida). `mountSuspended` para componentes que usan auto-imports/`queryCollection`. |
| **Verificación de PARIDAD** | **Playwright** | Ver abajo. Es la herramienta que defiende el "idéntico al `index.html`". |

### Verificación de paridad (enfoque ligero pero real)

El listón es "exactamente igual". Enfoque recomendado, de menor a mayor coste:
1. **Snapshots visuales con Playwright** (`toHaveScreenshot`): capturar la home, cada sección de día, una ficha de cada tipo, en **light y dark**, a anchos móvil/desktop. Estos screenshots se generan **una vez desde el `index.html` original** (servido estático) como *golden*, y luego se comparan contra el build Nuxt. Diff a pixel = detector de regresión objetivo.
2. **Tests E2E de comportamiento**: cambiar ritmo y verificar visibilidad de `tl-item`; alternar tema y comprobar `data-theme`; buscar y validar resultados; clic en "ruta del día" y verificar la URL de Google Maps generada; notas que persisten en localStorage.
3. **Test de invariantes de datos**: nº de fichas (38 monumentos + 26 gastro), todos los `id` únicos, todos los enlaces cruzados (`#xxx`) resuelven a un `id` existente.

> El visual-diff con golden tomado del HTML real es la forma más barata de **convertir "paridad" en un test que pasa o falla**, en vez de revisión manual subjetiva.

---

## 7. Búsqueda en cliente — MiniSearch (indexar datos, no DOM)

**Veredicto: MiniSearch 7.2.0**, construyendo el índice desde los **datos de las colecciones** al montar la app.

| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **MiniSearch 7.2.0** | ✅ **Elegida** | Ligero, sin dependencias, índice invertido en memoria, soporta **prefijo** + **fuzzy** + **boosting de campos** (p. ej. priorizar `name` sobre `prosa`). En SSG el índice se construye en cliente desde los datos ya cargados → **offline**. Es el reemplazo natural y mejor del `includes()` actual. |
| **Fuse.js 7.4.2** | ⚠️ Alternativa | Mejor *typo-tolerance* pura, pero **más lento** en datasets grandes y sin índice invertido (escaneo fuzzy). Para ~64 fichas da igual el rendimiento; elegir Fuse solo si se prioriza tolerancia a erratas sobre todo lo demás. |
| **Filtro `includes()`** (lo de hoy) | ❌ | Funciona pero es lo mínimo: sin ranking, sin prefijo, sin tolerancia a erratas, y hoy **scrapea el DOM** (anti-patrón en Nuxt). Migrar a índice de datos. |

```ts
// composables/useSearch.ts (boceto)
import MiniSearch from 'minisearch'
const mini = new MiniSearch({
  fields: ['name', 'italian', 'prosa', 'day'],  // qué se indexa
  storeFields: ['id', 'name', 'day'],           // qué se devuelve
  searchOptions: { boost: { name: 3, italian: 2 }, prefix: true, fuzzy: 0.2 },
})
// Alimentar con queryCollection(...).all() aplanando las secciones de prosa a un campo.
```

**Punto fino de paridad:** el buscador actual indexa el **texto completo** de la ficha (`card.textContent`). Para igualarlo, concatenar las secciones de prosa (`queEs + historia + anecdotas + …`) en un campo `prosa` del documento del índice.

---

## 8. Tema sin FOUC — `@nuxtjs/color-mode` con `dataValue: 'theme'`

**Veredicto: `@nuxtjs/color-mode` 4.0.1**, configurado para emitir `data-theme` y usar la misma clave de localStorage que hoy.

| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **`@nuxtjs/color-mode` 4.0.1** | ✅ **Elegida** | Inyecta un **script inline en `<head>`** (`hid: 'nuxt-color-mode-script'`) que lee localStorage / `prefers-color-scheme` y aplica el atributo **antes del primer paint** → **cero FOUC** en SSG. Soporta **`dataValue: 'theme'`** → produce `<html data-theme="dark">`, **exactamente** el selector del CSS actual (`[data-theme="dark"] { … }`). Soporta `storageKey` custom → reutilizar **`roma-theme`** (la clave actual) hace que el tema guardado de la versión viva siga válido. Respeta `prefers-color-scheme` con `preference: 'system'`. |
| **Implementación custom (plugin + script)** | ❌ | Reinventar exactamente lo que el módulo ya hace bien (script anti-flash, SSR-safe, persistencia, reactividad `$colorMode`). Solo tendría sentido si necesitáramos algo que el módulo no cubre — no es el caso. |

**Config exacta** (ya incluida en el `nuxt.config.ts` de arriba): `dataValue: 'theme'`, `storageKey: 'roma-theme'`, `preference: 'system'`, `fallback: 'light'`, `classSuffix: ''`.

**Matiz documentado:** con `preference: 'system'`, si se **renderiza condicionalmente** según el tema en el template, hay flash porque la preferencia del sistema no se conoce en prerender. **Mitigación:** guiaRoma no ramifica el DOM por tema — **solo cambia colores vía CSS `[data-theme]`** —, así que el script inline aplica el atributo y el CSS hace el resto sin flash. Si algún componente necesitara saber el tema en JS, usar `$colorMode.unknown` para placeholder. En la práctica, **no aplica** a este diseño.

> **Detalle de migración:** un commit del repo del módulo ("fix: handle data attribute in script as well") confirma que el script anti-flash **también gestiona el data-attribute**, no solo la clase — es decir, `dataValue: 'theme'` es FOUC-safe, no solo el modo clase.

---

## 9. PWA — fuera de alcance 1.0 (ruta v2 anotada)

**PWA instalable con caché offline real es OUT OF SCOPE de la 1.0** (declarado en PROJECT.md). La 1.0 conserva el offline **actual** (assets self-hosted: Leaflet, CSS, fuentes; fallbacks SVG de imagen; banner de mapa offline) **sin** service worker.

**Ruta v2 (solo anotada, no diseñar ahora):** **`@vite-pwa/nuxt` 1.1.1**. Es el módulo estándar para Nuxt (envuelve `vite-plugin-pwa` + Workbox); añadiría manifest, service worker y precache de tiles/contenido para offline real. **No instalar en 1.0.**

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Nuxt Content `type:'data'` YAML + `<MDC>` | Markdown-por-ficha (`type:'page'`) | Si el contenido fuera **mayoritariamente prosa larga** con poca estructura (un blog editorial). No es el caso: aquí domina la estructura. |
| Leaflet crudo en `client-only` | `@vue-leaflet/vue-leaflet` | Solo si el proyecto fuera 100% declarativo-Vue y la librería retomara mantenimiento activo. Hoy está parada desde 2023. |
| CSS a mano + tokens | Tailwind / UnoCSS | Para un **rediseño** o un producto nuevo sin listón de paridad. Prohibido aquí por el riesgo de regresión visual. |
| `@nuxt/eslint` + stylistic | ESLint + Prettier separados | Si el equipo ya tiene flujo Prettier consolidado; añadir `eslint-config-prettier`. |
| MiniSearch | Fuse.js | Si la **tolerancia a erratas** prima sobre ranking/prefijo/rendimiento. |
| `@nuxtjs/color-mode` | Plugin custom | Solo si se necesitara una lógica de tema que el módulo no soporte (no es el caso). |
| `nuxt build --preset github_pages` | `nuxt generate` + crear `.nojekyll` a mano | Si el preset diera problemas; entonces preset `static` + post-proceso. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **`@vue-leaflet/vue-leaflet`** | Sin publicar desde **2023-06-16**, 0.x, riesgo con Vue 3.5/Nuxt 4; oculta la API cruda que el HTML ya usa | **Leaflet 1.9.4 crudo** en `components/*.client.vue` |
| **Tailwind / UnoCSS** | Reescribir 2.200 líneas de CSS editorial = máxima superficie de regresión visual contra el listón de paridad | **CSS a mano + custom properties** (ya son los tokens) |
| **JSON crudo escrito a mano para la prosa** | Párrafos con comillas/`<em>`/enlaces dentro de strings JSON = PRs ilegibles, escapado infernal | **YAML (`type:'data'`)** con bloques `|`/`>` + Markdown-inline |
| **`z` importado desde `@nuxt/content`** | Re-export **deprecado**, se eliminará | `import { z } from 'zod'` (4.4.3) |
| **Cargar Leaflet/fuentes desde CDN** | Rompe el offline (el objetivo: usarlo paseando con red pobre) | Self-host: `import 'leaflet/dist/leaflet.css'` + `@nuxt/fonts` |
| **`useState`/`.ts` como almacén de contenido** | Acopla datos a código; rompe "añadir viaje = añadir ficheros" | Colecciones de **Nuxt Content** |
| **Buscar scrapeando el DOM** | Anti-patrón en SSR/SSG; sin ranking | **MiniSearch** sobre datos |
| **`@vite-pwa/nuxt` en la 1.0** | Fuera de alcance; *scope creep* | Anotar para **v2** |
| **`@nuxt/image` sobre las heros de Wikimedia** | Son URLs de terceros con fallback `onerror`; el provider estático no las procesa y rompería el patrón de fallback | Dejar `<img onerror>` portado; evaluar `@nuxt/image` solo para imágenes **locales** en v2 |

## Stack Patterns by Variant

**Si el `roma.yml` único se vuelve incómodo de editar:**
- Partir la colección por **dominio**: `trips/roma/monuments.yml`, `food.yml`, `artists.yml`, `trip.yml`.
- Porque mantiene PRs pequeños y el `source` glob (`trips/*/monuments.yml`) los reúne igual.

**Si se añade un segundo viaje (futuro, no 1.0):**
- Crear `content/trips/florencia/` con los mismos ficheros.
- Porque las colecciones ya hacen glob sobre `trips/*/` → cero cambios de código.

**Si el equipo prioriza tolerancia a erratas en la búsqueda:**
- Cambiar MiniSearch por Fuse.js 7.4.2.
- Porque Fuse tiene mejor fuzzy puro (a costa de ranking/velocidad, irrelevante a 64 fichas).

**Si Pages da problemas de `.nojekyll`/rutas:**
- `nuxt build --preset github_pages` + `public/.nojekyll` + verificar `NUXT_APP_BASE_URL`.
- Porque es la combinación con fricción conocida resuelta.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| nuxt@4.4.8 | @nuxt/content@3.14.0 | Content v3 requiere Nuxt 3.16+/4.x. OK. |
| @nuxt/content@3.14.0 | zod@4.4.3 | Content 3.14 soporta zod v3 **y** v4. Importar `z` desde `zod`, no desde Content. |
| nuxt@4.4.8 | @nuxtjs/color-mode@4.0.1 | color-mode v4 = Nuxt 3+/4. `dataValue` soportado. |
| nuxt@4.4.8 | @nuxt/eslint@1.16.0 / eslint@10.5.0 | Flat config. `@nuxt/eslint` 1.x es el módulo para Nuxt 3.x/4.x. |
| vitest@4.1.9 | @nuxt/test-utils@4.0.3 | test-utils 4 alinea con Vitest 4. |
| leaflet@1.9.4 | Vue 3.5 / Nuxt 4 | Usado crudo en `client-only`; sin acoplamiento de versión. `@types/leaflet` para TS. |
| minisearch@7.2.0 | (independiente) | Sin peer deps; corre en cliente. |

## Sources

- `/websites/nuxt_4_x` (Context7, benchmark 82.01) — API de Nuxt 4, SSG/prerender, módulos.
- [Nuxt Content — Define Collections](https://content.nuxt.com/docs/collections/define) — `defineCollection`, esquema zod, `type: 'page'` vs `'data'` — HIGH.
- [Nuxt Content — JSON / data collections](https://content.nuxt.com/docs/files/json) — `type:'data'`, fuentes JSON/YAML — HIGH.
- [Nuxt Content — Schema Validators](https://content.nuxt.com/docs/collections/validators) — zod v3/v4, `z` re-export deprecado, JSON-Schema nativo de zod 4 — HIGH.
- [Nuxt Content — Markdown / MDC / ContentRenderer](https://content.nuxt.com/docs/files/markdown) — render de prosa, `<MDC>`, inline bold/italic/links — HIGH.
- [Nuxt — Deploy to GitHub Pages](https://nuxt.com/deploy/github-pages) — preset `github_pages`, `NUXT_APP_BASE_URL`, artefacto `.output/public` — HIGH.
- [Nitro — Config (prerender)](https://nitro.build/config) — `crawlLinks`, `autoSubfolderIndex`, `failOnError` defaults — HIGH.
- [nuxt/nuxt#21232](https://github.com/nuxt/nuxt/issues/21232) y [#12480](https://github.com/nuxt/nuxt/issues/12480) — fricción `.nojekyll` con `generate` vs preset — MEDIUM.
- [@vue-leaflet/vue-leaflet — npm](https://www.npmjs.com/package/@vue-leaflet/vue-leaflet) — última publicación 2023-06-16 (verificado vía `npm view`, modified 2023-06-16) — HIGH.
- [vue-leaflet/vue-leaflet#208 — Nuxt 3 SSR](https://github.com/vue-leaflet/vue-leaflet/discussions/208) y [nuxt#15989](https://github.com/nuxt/nuxt/discussions/15989) — Leaflet en client-only, `useGlobalLeaflet` — MEDIUM.
- [@nuxtjs/color-mode — módulo](https://nuxt.com/modules/color-mode) + [README](https://github.com/nuxt-modules/color-mode) — script anti-flash en head, opciones — HIGH.
- [color-mode#153 — data-theme y class](https://github.com/nuxt-community/color-mode-module/issues/153) y [commit 30b173e](https://github.com/nuxt-modules/color-mode/commit/30b173e4ffebcd452ecc076e3660290907af196f) — `dataValue: 'theme'` → `data-theme`, el script gestiona el data-attribute — HIGH.
- [MiniSearch vs Fuse.js — npm-compare / Mattermost](https://mattermost.com/blog/best-search-packages-for-javascript/) — comparativa rendimiento/bundle — MEDIUM.
- **npm registry (`npm view <pkg> version`), consultado 2026-06-18** — TODAS las versiones de la tabla (nuxt 4.4.8, @nuxt/content 3.14.0, @nuxtjs/color-mode 4.0.1, @vue-leaflet/vue-leaflet 0.10.1, leaflet 1.9.4, minisearch 7.2.0, fuse.js 7.4.2, zod 4.4.3, @nuxt/eslint 1.16.0, eslint 10.5.0, prettier 3.8.4, @nuxt/test-utils 4.0.3, vitest 4.1.9, @vite-pwa/nuxt 1.1.1, @nuxt/image 2.0.0, @nuxt/fonts 0.14.0) — HIGH.
- **Lectura directa de `/home/vcompanyb/guiaRoma/index.html`** — modelo de contenido real: 38 `.card`, 26 `.gastro-card`, `.artist-card`; array `places`; `SVG_MOTIFS`/`CARD_TO_MOTIF`; tokens CSS `:root`/`[data-theme="dark"]` (líneas 866-898); init de tema (6262-6266); búsqueda DOM (6433-6466); ruta del día (6584-6646) — HIGH.

---
*Stack research for: re-plataformado de guía de viaje estática a Nuxt 4 (estático + offline + data-driven + multi-viaje, paridad 100%)*
*Researched: 2026-06-18*
