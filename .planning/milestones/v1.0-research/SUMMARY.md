# Project Research Summary

**Project:** guiaRoma — migración a Nuxt 4
**Domain:** Re-plataformado de guía de viaje editorial estática (un `index.html` monolítico de 6.665 líneas) a Nuxt 4 SSG, offline, data-driven, con paridad 100% visual y funcional
**Researched:** 2026-06-18
**Confidence:** HIGH

---

## Resumen ejecutivo

guiaRoma es una guía editorial de alto cuidado (Roma, 5 días, ~64 fichas de monumentos, gastronomía y artistas) que hoy vive como un único `index.html`. La migración a Nuxt 4 no añade ni cambia ninguna funcionalidad de usuario: su único objetivo es extraer el contenido a datos estructurados y tipados, partir la UI en componentes reutilizables y establecer una arquitectura multi-viaje donde añadir un destino futuro sea solo añadir archivos, sin tocar código. El listón de la 1.0 es innegociable: lo que el usuario ve y puede hacer debe ser **idéntico** a la versión viva en `main`.

El enfoque recomendado por la investigación es un híbrido estructurado: contenido en **Nuxt Content v3** (`@nuxt/content` 3.14.0) con colecciones `type:'data'` en YAML validadas con **zod 4** (un fichero por entidad, los días como unidad orquestadora del orden), render de prosa literaria con `<MDC>`, mapa con **Leaflet 1.9.4 crudo** en un componente `.client.vue` (el wrapper Vue está abandonado desde 2023), **CSS escrito a mano conservado verbatim** como sistema de tokens, tema sin FOUC mediante `@nuxtjs/color-mode` 4.0.1 con `dataValue:'theme'`/`storageKey:'roma-theme'`, búsqueda en cliente con **MiniSearch 7.2.0** sobre datos (no DOM), y salida estática vía `nuxt build --preset github_pages` + `NUXT_APP_BASE_URL=/guiaRoma/` + `public/.nojekyll`. Todo probado con **Playwright visual-diff** tomando como golden el `index.html` original.

El riesgo principal de la migración no es técnico sino de paridad: tres features del HTML actual (búsqueda, ruta del día y navegación) raspan el DOM, y re-derivarlas desde datos requiere replicar criterios implícitos en la estructura HTML. El punto más sutil es la **"ruta del día"**: su conjunto de paradas y su orden dependen de qué `article.card` tienen `.maps-link` y en qué secuencia aparecen en el DOM del día (no del array `places`). En Nuxt ese orden debe ser **explícito** en el campo `day.cards: string[]` del YAML del día; es el campo más crítico del modelo de datos para la paridad. Un segundo riesgo estructural es el subpath de GitHub Pages (`/guiaRoma/`): sin `NUXT_APP_BASE_URL` y `.nojekyll`, los assets de `_nuxt/` dan 404 en masa.

---

## Hallazgos clave

### Stack recomendado

La cadena de herramientas está completamente decidida y verificada contra el registro npm (2026-06-18) y la documentación oficial. Nuxt Content v3 aporta: esquema zod = validación en build + tipos TS gratis + queries resueltas en prerender (funciona offline en SSG). La elección de YAML `type:'data'` sobre JSON o Markdown-por-ficha es deliberada: YAML permite prosa multilínea legible en PR con bloques `|`/`>`, mientras que el 60-70% de cada ficha es estructura (campos), no narrativa libre. Nuxt Content v3 exige que **cada fichero sea un único objeto** (no un array en la raíz), de ahí el modelo "un fichero por entidad" (`monuments/galleria-sciarra.yml`).

**Tecnologías principales:**

| Tecnología | Versión | Para qué | Por qué |
|------------|---------|----------|---------|
| **nuxt** | 4.4.8 | Framework (Vue 3 + Nitro + Vite) | Dominio del equipo; Nitro habilita backend v2 (auth/uploads) |
| **@nuxt/content** | 3.14.0 | Capa de datos tipada + render de prosa | Colecciones `type:'data'`, zod, queries offline en SSG |
| **zod** | 4.4.3 | Esquema y validación del modelo de viaje | Importar desde `zod`, NO desde `@nuxt/content` (re-export deprecado) |
| **leaflet** | 1.9.4 | Mapa interactivo | Misma API que el `index.html` actual; portado 1:1 en `.client.vue` |
| **@nuxtjs/color-mode** | 4.0.1 | Tema sin FOUC | Script inline en `<head>` antes del primer paint; `dataValue:'theme'` = mismo selector CSS actual |
| **minisearch** | 7.2.0 | Búsqueda en cliente | Índice desde datos (no DOM); prefijo + fuzzy + ranking por campo |
| **@nuxt/fonts** | 0.14.0 | Auto-hosting de fuentes | Cormorant Garamond / Lora / JetBrains Mono offline (hoy dependen de Google Fonts CDN) |
| **@playwright/test** | 1.x | Verificación de paridad | Visual-diff a pixel contra golden del `index.html` original |

**Qué NO usar:**

- `@vue-leaflet/vue-leaflet` — sin publicar desde 2023-06-16; 0.x; incompatible con Vue 3.5/Nuxt 4
- Tailwind / UnoCSS — reescribir 2.200 líneas de CSS editorial es la mayor superficie de regresión visual posible
- `@nuxt/image` sobre heros — son URLs de terceros con `@error`→SVG; un provider estático no las procesa y rompería el fallback
- `z` desde `@nuxt/content` — re-export deprecado; usar `import { z } from 'zod'`
- `@vite-pwa/nuxt` en la 1.0 — PWA es v2; scope creep explícito en PROJECT.md

### Features: categorización para el roadmap

La investigación clasifica las 10 features del `index.html` por complejidad de re-implementación:

**Triviales en Vue (estado reactivo, bajo riesgo):**
- **Selector de ritmo** — `useTripModes().pace` + función pura `isVisible(itemPace, pace)` en `utils/pace.ts`; la matriz es contraintuitiva (`slow-only` solo visible en optimista) y NO debe "simplificarse"
- **"Caminar menos"** — `useTripModes().lightMode`; el acoplamiento `watch(lightMode, on => { if (on) pace.value = 'slow' })` es exacto, no opcional
- **"Modo resumen"** — `useTripModes().resumen`; toda la lógica es CSS; el JS solo togglea la clase en `<body>` vía `useHead({ bodyAttrs })`

**Needs-care (sensibles a SSR/hidratación):**
- **Tema light/dark** — alto riesgo si se reimplementa a mano (FOUC casi seguro en SSG); bajo riesgo con `@nuxtjs/color-mode` y theming solo por CSS sin `v-if` por tema
- **Navegación** — el offset `+130` del scrollspy es un detalle crítico de paridad; replicar con listener `scroll` exacto (`scrollY+130 >= offsetTop`), no `IntersectionObserver` (cambia sutilmente cuándo conmuta la pill)
- **Notas por ficha** — `useNotes(key)` con `onMounted`; conservar el prefijo exacto `roma-note-<id>` para continuidad de datos de usuarios existentes
- **Hero image con fallback SVG** — `<img>` nativo con `@error` (no `<NuxtImg>`); dos modos distintos: hero (sustituye contenedor, oculta si no hay motif) vs detail (sustituye solo la imagen, conserva caption)

**Anti-patrón a eliminar (re-derivar de datos, no del DOM):**
- **Búsqueda** — hoy raspa `card.textContent`; en Nuxt el campo `haystack` debe concatenar exactamente los mismos textos (prosa de todas las secciones + `card-italian` + facts + caption); la cobertura no puede ser menor que hoy
- **"Ruta del día"** — hoy raspa `a.maps-link` del DOM del día; en Nuxt se re-deriva de `day.cards` (lista ordenada de ids en el YAML del día); el criterio "monumentos sí, restaurantes/guiados/concierto no" debe ser explícito en el dato; el algoritmo `capStops` (muestreo de hasta 10 paradas conservando primera y última) se porta literal desde `index.html` líneas 6602-6613

**Fuera de alcance 1.0 (defer v2+):**
- PWA instalable con caché offline real
- Backend Nitro activo (auth, uploads de media)
- Rediseño visual, i18n, CMS, segundo viaje con contenido real

### Arquitectura

La arquitectura sigue el principio rector: el **contenido** (`/content/`) es la única fuente de verdad; la **página** lo agrega con `useTrip(slug)` y lo entrega por `props`/`provide`; los **componentes** son declarativos y tontos; los **derivados** (índice de búsqueda, ruta del día, marcadores del mapa) se calculan en **composables puros** desde el contenido, nunca raspando el DOM.

Hay tres correcciones importantes respecto al sketch inicial de STACK.md, verificadas contra la documentación oficial:

1. **Nuxt Content `type:'data'` requiere que cada fichero sea un único objeto, no un array en la raíz.** Esto obliga al modelo "un fichero por entidad" (`monuments/galleria-sciarra.yml`), no "un fichero por dominio con lista YAML en la raíz".
2. **El `srcDir` por defecto de Nuxt 4 es `app/`.** `server/`, `content/`, `public/`, `shared/` y `nuxt.config.ts` viven en la raíz (hermanos de `app/`).
3. **El punto de paridad más sutil de todo el proyecto:** la "ruta del día" no depende del timeline ni del array `places`, sino del orden en que las fichas-monumento aparecen en el DOM del día (`section.querySelectorAll('a.maps-link')`, líneas 6625-6645 del `index.html`). Al migrar, ese orden debe ser explícito en `day.cards: string[]`.

**Modelo de datos — 6 colecciones zod:**

```
trip       trips/*/trip.yml             metadatos globales del viaje
day        trips/*/days/*.yml           metadatos + timeline ORDENADO + cards: string[] ORDENADO
monument   trips/*/monuments/*.yml      1 ficha-monumento = 1 fichero (~38)
food       trips/*/food/*.yml           1 ficha gastro = 1 fichero (~26)
artist     trips/*/artists/*.yml        1 ficha artista = 1 fichero
reference  trips/*/reference/*.yml      secciones Reservas/Práctica/Arte/Arquitectura
```

**El campo `day.cards: string[]` es la pieza más crítica del modelo.** Es el array de ids de fichas-monumento en el orden exacto en que se renderizan en la sección del día, y de él se deriva la URL de Google Maps de la "ruta del día". Hoy ese orden está en el DOM; en Nuxt debe estar en el dato.

**Componentes clave:**
- `TripMap.client.vue` — única isla client-only; Leaflet + `divIcon` + popups + `fitBounds` + banner offline
- `DaySection` — orquesta un día; renderiza fichas en el orden de `day.cards`
- `Timeline` + `Timeline{Item,Transport,Meta,Food,Reservation}` — dispatch por `kind` con `<component :is>`
- `AttractionCard` / `GastroCard` / `ArtistCard` — fichas presentacionales; prosa con `<MDC>`
- `ImageWithFallback` — `<img @error="failed=true">` + SVG por `motif`; modos hero y detail
- `useCardNavigation` — transversal; mapa, búsqueda y enlaces del timeline DEBEN usar el mismo composable

**Estructura de carpetas:**

```
guiaroma-nuxt/
├── app/                          # srcDir de Nuxt 4
│   ├── components/layout|trip|timeline|cards|controls|map/
│   ├── composables/useTrip|useCardNavigation|useTripModes|useSearch|useDayRoute|useNotes.ts
│   ├── layouts/default.vue
│   ├── pages/index.vue + trips/[slug].vue
│   └── utils/pace.ts | route.ts | svg-motifs.ts
├── content/trips/roma/
│   ├── trip.yml
│   ├── days/viernes|sabado|domingo|lunes|martes.yml  (timeline + cards ORDENADOS)
│   ├── monuments/*.yml  (~38 ficheros)
│   ├── food/*.yml       (~26 ficheros)
│   ├── artists/*.yml
│   └── reference/*.yml
├── server/api/README.md          # backend dormido (vacío en 1.0)
├── public/.nojekyll              # cinturón-y-tirantes para GitHub Pages
├── content.config.ts
└── nuxt.config.ts
```

### Pitfalls críticos

**1. Leaflet rompe el build de servidor** — `import L from 'leaflet'` a nivel de módulo peta con `window is not defined` en `nuxt generate`. Prevención: componente `TripMap.client.vue` (sufijo `.client`) + `await import('leaflet')` en `onMounted`; `<ClientOnly>` con `#fallback` del mismo tamaño que el mapa; nunca desde CDN (rompe el offline).

**2. FOUC de tema en SSG** — el HTML pre-renderizado no conoce `localStorage` ni `prefers-color-scheme`; sin el script inline del módulo, el usuario con preferencia "dark" ve un flash blanco al cargar. Prevención: `@nuxtjs/color-mode` 4.0.1 con `dataValue:'theme'`, `storageKey:'roma-theme'`, `fallback:'light'`; theming solo por CSS (`[data-theme="dark"]`), sin ningún `v-if` por tema en templates.

**3. Hydration mismatch por leer `localStorage` en el render** — inicializar estado leyendo `localStorage` en `<script setup>` síncrono produce `ReferenceError` en build o mismatch. Prevención: siempre en `onMounted` o con `useStorage` de VueUse; defaults (`pace:'optimistic'`, `lightMode:false`, `resumen:false`) deben coincidir con el HTML pre-renderizado. El micro-flash de un frame para pace/light/resumen ya existe hoy y es paridad, no un defecto.

**4. Regresión visual al scopear el CSS global** — el CSS de 2.200 líneas tiene selectores cruzados (`body.modo-resumen .tl-meta`, `[data-theme="dark"] .leaflet-tile`) que se rompen con `<style scoped>`. Prevención: trasvasar el CSS verbatim a `assets/css/`; importarlo en `nuxt.config.ts`; empezar todo global y modularizar solo estilos verdaderamente locales.

**5. Assets 404 bajo el subpath `/guiaRoma/`** — sin `NUXT_APP_BASE_URL`, los assets de `/_nuxt/` referencian desde la raíz del dominio y dan 404 en masa. Prevención: `NUXT_APP_BASE_URL=/guiaRoma/ npx nuxt build --preset github_pages` + `public/.nojekyll` explícito + `nitro.prerender.failOnError: true` + nunca rutas absolutas hardcodeadas en assets.

**6. Re-derivar búsqueda y ruta del día sin replicar los criterios implícitos del DOM** — el "qué entra" y "en qué orden" están escondidos en la estructura HTML. Prevención: `haystack` con todo el texto de `card.textContent`; `day.cards` con orden explícito; portar `capStops`/`pointFor`/`buildDirUrl` como funciones puras testeables.

**7. No tener golden para verificar paridad** — sin visual-diff, las regresiones se descubren manualmente. Prevención: capturar Playwright golden screenshots del `index.html` original (desde `main`) **antes de que la rama de release diverja**.

---

## Implicaciones para el roadmap

La investigación revela un orden de construcción con dependencias claras que se traslada casi directamente a fases. El esquema de datos es la raíz de la que dependen 5 de las 10 features; la navegación es transversal y debe preceder al mapa y la búsqueda; el mapa y el fallback de imagen son los más sensibles a SSR y van al final.

### BUILD ORDER (del más dependido al más sensible a SSR)

```
0. ANDAMIAJE + GOLDEN
   nuxt init en rama release · módulos · CSS verbatim a assets/css/ · nitro/github_pages
   · server/ vacío + README · public/.nojekyll
   · Playwright golden screenshots del index.html de main ← HACERLO ANTES DE DIVERGIR
        ▼
1. ESQUEMA + CONTENIDO  ← LA BASE: 5 de 10 features dependen de aquí
   content.config.ts (6 colecciones zod) · migrar Roma a content/trips/roma/*
   · day.cards: string[] ORDENADO (LA pieza más crítica — define la ruta del día)
   · tests de validación zod + invariantes (38 monuments, 26 food, ids únicos, refs resuelven)
        ▼
2. CAPA DE PÁGINA + LAYOUT
   useTrip(slug) · TripView · pages/index.vue + pages/trips/[slug].vue · layouts/default.vue
        ▼
3. RENDER DE CONTENIDO + MODOS TRIVIALES  ← bajo riesgo, valida el patrón data-driven
   AttractionCard/GastroCard/ArtistCard + <MDC> · ReferenceSection · DaySection
   · Timeline + TimelineItem/Transport/Meta/Food/Reservation (discriminatedUnion → <component :is>)
   · useTripModes (pace/lightMode/resumen) + utils/pace.ts  (matriz EXACTA, no simplificar)
        ▼
4. NAVEGACIÓN TRANSVERSAL  ← antes que mapa/búsqueda (los tres la consumen)
   useCardNavigation (scrollY+130 exacto, pila volver, scrollspy) · BackButton · NavPills activo
   · interceptar a[href^="#"] de <MDC> → navigateToCard
        ▼
5. DERIVADOS DE DATOS  ← puros y testeables en aislamiento
   useSearch (MiniSearch; haystack = misma cobertura que card.textContent) + SearchBox
   · useDayRoute (capStops/pointFor/buildDirUrl portados literal) + DayRouteButton (orden = day.cards)
        ▼
6. TEMA  ← independiente de datos; fijar anti-flash pronto
   @nuxtjs/color-mode (dataValue:'theme', storageKey:'roma-theme') + ThemeToggle
        ▼
7. ISLA CLIENT-ONLY — MAPA + FALLBACK IMG  ← los más sensibles a SSR, al final
   TripMap.client (Leaflet divIcon/popups/fitBounds/banner offline heurística >3&&0)
   · ImageWithFallback (hero + detail, <img @error> nativo) + utils/svg-motifs.ts
   · useNotes + NotesField (claves roma-note-<id> exactas)
        ▼
8. VERIFICACIÓN DE PARIDAD
   Playwright: visual-diff golden (light/dark, móvil/desktop) · E2E comportamiento
   · invariantes de datos · suite pasa antes de cualquier merge a producción
```

### Fase 0: Andamiaje + captura de golden

**Rationale:** ningún trabajo puede hacerse sin la base del proyecto; el golden Playwright debe capturarse desde `main` antes de cualquier divergencia.
**Entrega:** proyecto Nuxt 4 en rama de release; CI/workflow GitHub Actions; CSS verbatim en `assets/css/`; `public/.nojekyll`; `server/api/README.md`; golden screenshots del `index.html` en light/dark y móvil/desktop.
**Pitfalls que previene:** Pitfall 4 (CSS global desde el inicio), Pitfall 5 (subpath Pages configurado), Pitfall 7 (golden capturado antes de divergir).
**Flag de investigación:** no necesaria.

### Fase 1: Esquema de datos y migración del contenido

**Rationale:** es la raíz de 5 features; sin el campo `day.cards` ordenado no se puede construir la ruta del día con paridad.
**Entrega:** `content.config.ts` con las 6 colecciones zod; contenido de Roma migrado a `content/trips/roma/`; tests de validación + invariantes.
**Punto crítico:** el campo `day.cards: string[]` debe replicar el orden exacto en que los `article.card` aparecían en el DOM del día del `index.html`. El campo `motif` por ficha-monumento (zod `enum`) hace que un motif faltante rompa el build.
**Flag de investigación:** parcial — las secciones de referencia (`reference/*.yml`) no fueron leídas en profundidad; leer `index.html` líneas ~5260-6250 en esta fase y afinar el esquema antes de migrar ese contenido.

### Fase 2: Capa de página y layout

**Rationale:** una vez que los datos están validados, se puede construir la capa que los agrega.
**Entrega:** `useTrip(slug)` con índices `monById`/`foodById`; `pages/index.vue` + `pages/trips/[slug].vue`; `layouts/default.vue` en shell.
**Flag de investigación:** no necesaria.

### Fase 3: Render de contenido y modos triviales

**Rationale:** bajo riesgo de paridad; valida el patrón data-driven antes de las piezas duras.
**Entrega:** fichas presentacionales con `<MDC>`; timeline con `discriminatedUnion` → `<component :is>`; `useTripModes` con la matriz `isVisible` exacta.
**Punto crítico:** verificar in-situ el comportamiento de `mdc-unwrap="p"` por tipo de campo; donde la prosa es inline, quitar el `<p>` envolvente que `<MDC>` añade por defecto.
**Flag de investigación:** no necesaria.

### Fase 4: Navegación transversal

**Rationale:** `useCardNavigation` la consumen mapa, búsqueda y timeline; construirla una vez evita duplicar lógica.
**Entrega:** `useCardNavigation` con `scrollY+130 exacto`; `BackButton`; `NavPills` activo; interceptación de `a[href^="#"]` de `<MDC>`.
**Flag de investigación:** no necesaria; el riesgo es de implementación (el `+130`), no de investigación.

### Fase 5: Derivados de datos

**Rationale:** ambos features dependen del esquema (Fase 1) y la navegación (Fase 4); son composables puros testeables en aislamiento.
**Entrega:** `useSearch` con `haystack` de cobertura completa; `useDayRoute` con `capStops`/`buildDirUrl` portados literal.
**Flag de investigación:** no necesaria; verificar con tests de URL de ruta por día contra los URLs actuales del `index.html`.

### Fase 6: Tema

**Rationale:** independiente de datos; debe fijarse pronto para que el anti-FOUC esté presente desde que el layout existe.
**Entrega:** `@nuxtjs/color-mode` configurado; `ThemeToggle`; verificación del script inline en el HTML generado.
**Flag de investigación:** no necesaria.

### Fase 7: Isla client-only — mapa y fallback de imagen

**Rationale:** máxima sensibilidad a SSR/hidratación; se abordan cuando el patrón `.client.vue` + `<ClientOnly>` + `onMounted` ya está validado.
**Entrega:** `TripMap.client.vue` completo; `ImageWithFallback` (hero + detail); `useNotes`.
**Punto crítico:** el banner offline usa la heurística `tilesErrored > 3 && tilesLoaded === 0` del original; no "mejorarla". Los marcadores usan `L.divIcon` con HTML puro — no hay bug de `marker-icon.png`.
**Flag de investigación:** no necesaria.

### Fase 8: Verificación de paridad

**Rationale:** el listón más importante y el más fácil de eludir sin un test objetivo.
**Entrega:** suite Playwright completa (visual-diff, E2E de comportamiento, invariantes de datos) que pasa antes de cualquier merge a producción.
**Flag de investigación:** no necesaria.

---

### Banderas de investigación

| Fase | Necesita investigación adicional | Motivo |
|------|----------------------------------|--------|
| 0 — Andamiaje | No | Patrones bien documentados |
| 1 — Esquema + contenido | **Sí, parcial** | Secciones de referencia del `index.html` (líneas ~5260-6250) no leídas en profundidad; el esquema `reference` puede necesitar ajuste |
| 2 — Página + layout | No | Patrones estándar de Nuxt 4 |
| 3 — Render + modos | No | Verificar in-situ el comportamiento de `mdc-unwrap`; no requiere investigación previa |
| 4 — Navegación | No | El riesgo es de implementación (el `+130`), no de investigación |
| 5 — Derivados | No | Funciones puras portadas del código original; testeables |
| 6 — Tema | No | Módulo oficial con documentación clara |
| 7 — Mapa + fallback | No | Patrones verificados; complejidad es de implementación |
| 8 — Verificación | No | Playwright golden es el patrón estándar |

---

## Evaluación de confianza

| Área | Confianza | Notas |
|------|-----------|-------|
| Stack | **HIGH** | Versiones verificadas contra npm el 2026-06-18; APIs verificadas contra docs oficiales Nuxt 4.x y Nuxt Content v3 |
| Features | **HIGH** | Cada feature analizada contra el código fuente real del `index.html` (líneas 6251-6663); riesgos SSR verificados contra docs oficiales |
| Arquitectura | **HIGH** | Estructura `app/` verificada contra docs Nuxt 4; regla "fichero = objeto" de `type:'data'` verificada contra docs Content v3; modelo de datos derivado de lectura directa del HTML (timeline 2403-2446, ruta del día 6584-6646) |
| Pitfalls | **HIGH** | Todos los pitfalls citan líneas concretas del `index.html` o issues de `nuxt/nuxt` con números |

**Confianza global:** HIGH

### Preguntas abiertas a resolver durante las fases

- **Secciones de referencia (Fase 1):** el esquema `reference.blocks` propuesto es flexible pero puede ser insuficiente si Reservas/Práctica/Arte/Arquitectura tienen sub-estructura rica (tablas con fechas, fichas de artista con campos fijos). Acción: leer `index.html` líneas ~5260-6250 en la Fase 1 y ajustar el esquema antes de migrar ese contenido.
- **Modelado fino del timeline (Fase 1):** el esquema `TimelineItem` con `z.discriminatedUnion('kind', [...])` está diseñado desde la lectura del HTML (líneas 2403-2446), pero hay variantes de `tl-transport` y `tl-food` que pueden necesitar ajuste al migrar los 5 días.
- **Interceptación de `a[href^="#"]` en `<MDC>` (Fase 3/4):** los enlaces internos de la prosa (`[texto](#g-fortunata)`) deben disparar `navigateToCard`. La solución exacta (componente Prose-`a` custom registrado en `content.config.ts` vs listener delegado en el contenedor) se valida al implementar.
- **Cobertura del `haystack` de búsqueda (Fase 5):** validar con casos de búsqueda reales del equipo contra la versión actual antes de dar por buena la implementación.

---

## Fuentes

### Primarias — HIGH

- **`/home/vcompanyb/guiaRoma/index.html`** — oráculo de paridad; leído directamente (timeline 2403-2446, `places` 6269-6314, mapa 6316-6379, navegación 6381-6429, búsqueda 6433-6469, notas 6471-6483, scrollspy 6485-6501, pace/light/resumen 6504-6577, ruta del día 6584-6646, `loadSvgFallback` 2211-2252)
- Context7 `/websites/nuxt_4_x` — API de Nuxt 4, SSG/prerender, `useState`, `<ClientOnly>`, hydration, `srcDir:'app/'`
- Context7 `/websites/content_nuxt` — `defineCollection`, `type:'data'`, regla "fichero = objeto", `queryCollection`, `<MDC>`, `mdc-unwrap`
- [Nuxt — Deploy to GitHub Pages](https://nuxt.com/deploy/github-pages) — `NUXT_APP_BASE_URL`, preset `github_pages`, artefacto `.output/public`
- [Nuxt Content — Schema Validators](https://content.nuxt.com/docs/collections/validators) — zod v3/v4, re-export `z` deprecado
- [@nuxtjs/color-mode](https://github.com/nuxt-modules/color-mode) — script inline anti-flash, `dataValue:'theme'`, commit `30b173e`
- Registro npm (2026-06-18) — versiones de todos los paquetes verificadas

### Secundarias — MEDIUM

- `nuxt/nuxt` issues #21232, #12480 — fricción `.nojekyll` con `generate` vs preset
- `nuxt/nuxt` issues #31551, #22225, #15091, #12892 — assets 404 bajo subpath con `baseURL`
- [@vue-leaflet/vue-leaflet en npm](https://www.npmjs.com/package/@vue-leaflet/vue-leaflet) — última publicación 2023-06-16
- [MiniSearch vs Fuse.js](https://mattermost.com/blog/best-search-packages-for-javascript/) — comparativa

---

*Investigación completada: 2026-06-18*
*Lista para roadmap: sí*
