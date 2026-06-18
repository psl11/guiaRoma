<!-- GSD:project-start source:PROJECT.md -->
## Project

**guiaRoma — Guía de viajes dinámica**

guiaRoma es una guía de viaje editorial, cuidada al detalle, que hoy existe como un único `index.html` (6.665 líneas / 734 KB) con la planificación de un viaje de 5 días a Roma. Este proyecto la **migra a Nuxt 4**: el mismo resultado visual y funcional, pero con el contenido extraído a **datos estructurados y tipados**, la UI partida en **componentes reutilizables**, y una arquitectura **multi-viaje** (añadir un viaje futuro = añadir archivos de datos, sin tocar código). Está pensada para consultarse paseando por la ciudad, por lo que debe seguir funcionando con conexión pobre o nula.

**Core Value:** La 1.0 debe ser **exactamente igual que la guía de hoy** (paridad visual y funcional al 100%), pero construida de forma dinámica y mantenible. Si todo lo demás se simplifica, esto no se negocia: lo que el usuario ve y puede hacer no cambia.

### Constraints

- **Tech stack**: Nuxt 4 (Vue 3 + Nitro). Elegido por dominio del equipo y porque habilita el backend futuro mejor que Astro.
- **Paridad**: salida visual y funcional **idéntica** al `index.html` actual — listón innegociable de la 1.0.
- **Deployment**: **salida estática** (`nuxt generate`) desplegable como hoy (GitHub Pages); sin servidor activo en 1.0.
- **Offline**: conservar el funcionamiento con conexión pobre/nula (Leaflet local, *fallbacks* de imagen, banner de mapa offline).
- **Proceso**: todo el trabajo en una **rama de release** dedicada; `main` (la versión viva) permanece intacta; no romper nada.
- **Datos**: contenido en datos estructurados y tipados; el **formato exacto** (JSON estructurado vs Markdown por ficha vs híbrido) se decide en la fase de investigación, en el contexto de Nuxt Content v3.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
# Andamiaje del proyecto (en la rama de release, dejando index.html intacto en main)
# Core de datos + validación
# Mapa (Leaflet crudo) y sus tipos
# Tema sin FOUC + búsqueda + fuentes self-host
# Tooling
## 1. Formato de contenido — DECISIÓN (máxima prioridad)
### Por qué, contra las tres opciones planteadas
| Opción | Veredicto | Razonamiento para ESTE contenido |
|--------|-----------|----------------------------------|
| **(a) JSON 100% estructurado** | ❌ Rechazada | La parte estructurada encaja perfecta, pero meter párrafos literarios con comillas, `<em>` y enlaces dentro de strings JSON es **horrible de editar en PR**: sin saltos de línea, escapado de comillas, diffs ilegibles. Mata la ergonomía para colaboradores no expertos. |
| **(b) Markdown-por-ficha + JSON aparte** | ❌ Rechazada | Parte un solo registro en **dos artefactos desincronizables** (¿el `.md` y el `.json` del mismo lugar?). "Añadir un viaje = añadir ficheros" se vuelve "añadir ~64 pares de ficheros + mantener IDs cruzados a mano". Markdown brilla con **un cuerpo largo + frontmatter ligero**; aquí es al revés (mucho campo, prosa troceada en N secciones). El frontmatter se volvería gigantesco y el cuerpo, fragmentario. |
| **(c) Híbrido en Nuxt Content `type: 'data'` (YAML) + prosa en campos MDC** | ✅ **Elegida** | Un registro = un bloque YAML cohesionado. **YAML soporta strings multilínea legibles** (bloque `|`) para la prosa, con `_negritas_`/`*cursivas*`/`[enlaces](#id)` Markdown-inline. La estructura (coords, facts, type, motif) son campos YAML naturales y **validados por zod**. Un solo fichero por viaje → multi-viaje trivial. Diffs de PR limpios. Tipos TS gratis. |
### Cómo se renderiza la prosa
### Esquema concreto (sketch)
# content/trips/roma/monuments.yml  (fragmento — prosa multilínea legible)
- id: galleria-sciarra
## 2. Capa de datos — Nuxt Content v3 vs JSON suelto vs useState
| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **Nuxt Content v3** | ✅ **Elegida** | Esquema zod = validación en build + tipos TS. `queryCollection('monument').all()` tipado. Prerender automático del contenido (en SSG, las queries se resuelven a un dump estático/SQLite servido como asset → **funciona offline** sin servidor). Render de prosa con `<MDC>`. Es literalmente "git-based CMS" para PRs. |
| **JSON en `/public` + `useFetch`** | ❌ | Sin validación, sin tipos, sin render de prosa. Habría que reimplementar a mano lo que Content da gratis. |
| **`useState` / composables con datos en `.ts`** | ❌ | Acopla datos a código (rompe "añadir viaje = añadir ficheros, sin tocar código"). Sin validación de esquema. Sin separación contenido/lógica para PRs de no-programadores. |
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
# .github/workflows/deploy.yml (esqueleto)
- run: npm ci
- run: NUXT_APP_BASE_URL=/guiaRoma/ npx nuxt build --preset github_pages
- uses: actions/upload-pages-artifact@v3
## 4. Mapa — Leaflet crudo en client-only (NO el wrapper Vue)
| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **`@vue-leaflet/vue-leaflet` 0.10.1** | ❌ Rechazada | **Última publicación 2023-06-16** (~3 años sin mantenimiento, sigue en 0.x). Riesgo de incompatibilidad con Vue 3.5/Nuxt 4 y de quedar huérfano. Además **abstrae** la API que el `index.html` ya usa cruda (`L.divIcon` con HTML custom para los marcadores romanos numerados, `fitBounds`, popups con `onclick`), por lo que el wrapper **complicaría** la paridad en vez de facilitarla. |
| **Leaflet 1.9.4 crudo en `<ClientOnly>`** | ✅ **Elegida** | La lógica del mapa actual se **porta casi literal** a un `onMounted` dentro de un componente `client-only`. Cero capa intermedia, cero dependencia abandonada. `@types/leaflet` da el tipado. |
| `@nuxtjs/leaflet` / `nuxt-leaflet` | ❌ | Módulos comunitarios de terceros; misma objeción (capa innecesaria + mantenimiento incierto) y menos control para la paridad exacta de marcadores. |
- El `index.html` hoy **inlinea Leaflet CSS+JS** para no depender de CDN. En Nuxt el equivalente es **importar desde `node_modules`** (`import 'leaflet/dist/leaflet.css'` y `import L from 'leaflet'`): Vite los **bundlea y self-hostea** automáticamente bajo `/_nuxt/`. **Nunca** cargar Leaflet desde unpkg/CDN.
- Las **imágenes de marcador por defecto** de Leaflet (`marker-icon.png`, `marker-shadow.png`) tienen rutas problemáticas en bundlers. Como guiaRoma usa **`L.divIcon` (HTML puro, sin imágenes)** para todos los marcadores, **este problema no aplica** — un punto a favor de portar tal cual.
- **Tiles**: siguen siendo de OpenStreetMap (red). El **banner "sin conexión"** (detección `tileerror`) se porta 1:1. Cachear tiles offline real = PWA = **v2** (fuera de alcance).
- Filtro dark del mapa (`[data-theme="dark"] .leaflet-tile { filter: ... }`) se conserva en el CSS global.
## 5. CSS / design tokens — conservar el CSS a mano (NO Tailwind/UnoCSS)
| Opción | Veredicto | Razón (sesgo: preservar el look exacto) |
|--------|-----------|------------------------------------------|
| **CSS global a mano + custom properties** | ✅ **Elegida** | El CSS actual (~2.200 líneas) **es** la fuente de verdad del look. Copiarlo verbatim = **paridad garantizada por construcción**. Los tokens (`--accent`, `--ink-soft`, `--gold`, paleta terracota/oro, `--shadow`, light/dark vía `[data-theme]`) ya están bien diseñados. Cero riesgo de drift visual. |
| **Tailwind** | ❌ Rechazada | Reescribir 2.200 líneas a utilidades = **enorme superficie de regresión visual**, justo lo que la 1.0 prohíbe. No aporta nada a una guía editorial con tipografía cuidada. Mapear los tokens a `tailwind.config` y luego reconstruir cada componente es trabajo puro con riesgo puro. |
| **UnoCSS** | ❌ Rechazada | Mismo argumento que Tailwind. La velocidad de UnoCSS es irrelevante aquí; el coste es la reescritura y el riesgo de paridad. |
## 6. Tooling / estandarización
| Pieza | Elección | Detalle |
|-------|----------|---------|
| **TypeScript** | Nativo Nuxt 4 | `nuxi typecheck`. Tipos del dominio derivados del esquema zod de Content. Componentes en `<script setup lang="ts">`. |
| **Lint** | **`@nuxt/eslint` 1.16.0** | `npx nuxi module add eslint` genera `eslint.config.mjs` (flat config) consciente de Nuxt. Un solo módulo, cero `.eslintrc` legacy. |
| **Formato** | **`@nuxt/eslint` con `config.stylistic`** (recomendado) **o** Prettier 3.8.4 | Lo más simple: activar `eslint({ config: { stylistic: true } })` y formatear con ESLint (una sola herramienta). Si el equipo ya usa Prettier, añadir `eslint-config-prettier` para que no choquen. **No** mezclar reglas de formato de ambos. |
| **Tests unitarios** | **Vitest 4.1.9 + `@nuxt/test-utils` 4.0.3** | Para lógica pura/portada: selector de ritmo (`optimistic/neutral/slow`), "ruta del día" (cap de 10 paradas, muestreo), construcción del índice MiniSearch, **validación del esquema zod** (un test que falle si el contenido no valida). `mountSuspended` para componentes que usan auto-imports/`queryCollection`. |
| **Verificación de PARIDAD** | **Playwright** | Ver abajo. Es la herramienta que defiende el "idéntico al `index.html`". |
### Verificación de paridad (enfoque ligero pero real)
## 7. Búsqueda en cliente — MiniSearch (indexar datos, no DOM)
| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **MiniSearch 7.2.0** | ✅ **Elegida** | Ligero, sin dependencias, índice invertido en memoria, soporta **prefijo** + **fuzzy** + **boosting de campos** (p. ej. priorizar `name` sobre `prosa`). En SSG el índice se construye en cliente desde los datos ya cargados → **offline**. Es el reemplazo natural y mejor del `includes()` actual. |
| **Fuse.js 7.4.2** | ⚠️ Alternativa | Mejor *typo-tolerance* pura, pero **más lento** en datasets grandes y sin índice invertido (escaneo fuzzy). Para ~64 fichas da igual el rendimiento; elegir Fuse solo si se prioriza tolerancia a erratas sobre todo lo demás. |
| **Filtro `includes()`** (lo de hoy) | ❌ | Funciona pero es lo mínimo: sin ranking, sin prefijo, sin tolerancia a erratas, y hoy **scrapea el DOM** (anti-patrón en Nuxt). Migrar a índice de datos. |
## 8. Tema sin FOUC — `@nuxtjs/color-mode` con `dataValue: 'theme'`
| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **`@nuxtjs/color-mode` 4.0.1** | ✅ **Elegida** | Inyecta un **script inline en `<head>`** (`hid: 'nuxt-color-mode-script'`) que lee localStorage / `prefers-color-scheme` y aplica el atributo **antes del primer paint** → **cero FOUC** en SSG. Soporta **`dataValue: 'theme'`** → produce `<html data-theme="dark">`, **exactamente** el selector del CSS actual (`[data-theme="dark"] { … }`). Soporta `storageKey` custom → reutilizar **`roma-theme`** (la clave actual) hace que el tema guardado de la versión viva siga válido. Respeta `prefers-color-scheme` con `preference: 'system'`. |
| **Implementación custom (plugin + script)** | ❌ | Reinventar exactamente lo que el módulo ya hace bien (script anti-flash, SSR-safe, persistencia, reactividad `$colorMode`). Solo tendría sentido si necesitáramos algo que el módulo no cubre — no es el caso. |
## 9. PWA — fuera de alcance 1.0 (ruta v2 anotada)
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
- Partir la colección por **dominio**: `trips/roma/monuments.yml`, `food.yml`, `artists.yml`, `trip.yml`.
- Porque mantiene PRs pequeños y el `source` glob (`trips/*/monuments.yml`) los reúne igual.
- Crear `content/trips/florencia/` con los mismos ficheros.
- Porque las colecciones ya hacen glob sobre `trips/*/` → cero cambios de código.
- Cambiar MiniSearch por Fuse.js 7.4.2.
- Porque Fuse tiene mejor fuzzy puro (a costa de ranking/velocidad, irrelevante a 64 fichas).
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
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
