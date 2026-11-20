# Stack Research — v1.1 «Multi-viaje + Campania»

**Domain:** Ampliar una guía de viaje estática ya migrada (Nuxt 4 + Nuxt Content v3, GitHub Pages bajo `/guiaRoma/`) a N viajes: portada índice, rutas `/trips/<slug>` prerenderizadas, redirección de URLs antiguas con hash, persistencia por viaje y un viaje multi-ciudad (Campania 2027).
**Researched:** 2026-11-20
**Confidence:** HIGH en el veredicto «cero dependencias nuevas» y en los mecanismos de Nuxt/Content/unhead (verificados en el código instalado en `node_modules` y en el build actual de `.output/public`). MEDIUM en el comportamiento exacto de GitHub Pages con barra final, que hay que verificar en la fase.

> **Alcance.** Este documento cubre SOLO lo nuevo de v1.1. El stack base (Nuxt 4.4.8, @nuxt/content 3.14.0 `type:'data'` + zod 4, Leaflet 1.9.4 crudo client-only, @nuxtjs/color-mode, MiniSearch 7.2, fuentes vendorizadas, preset `github_pages`, Playwright + Vitest) está validado en `.planning/milestones/v1.0-research/STACK.md` y en producción de la rama. No se reinvestiga.

---

## TL;DR: veredicto

**v1.1 no necesita ninguna dependencia nueva, ni de runtime ni de desarrollo.** Todo lo que pide el milestone se hace con lo que ya está instalado:

| # | Necesidad nueva | Solución | Dependencia nueva | Confianza |
|---|-----------------|----------|-------------------|-----------|
| 1 | Prerender de N rutas `/trips/<slug>` + portada `/` | `<NuxtLink>` por viaje en la portada (lo recoge `crawlLinks`) **más** enumeración explícita de `content/trips/*/trip.yml` en `nitro.prerender.routes` (en tiempo de config) como garantía determinista | Ninguna (`node:fs`) | HIGH |
| 2 | Redirigir `/guiaRoma/#viernes` → `/guiaRoma/trips/roma#viernes` | **Script inline en `<head>` SOLO en la página índice** (`useHead` + `tagPosition:'head'`, `tagPriority:'critical'`) que hace `location.replace()` cuando hay hash. El hash no llega nunca al servidor, así que tiene que resolverse en el cliente y antes de hidratar | Ninguna (unhead 2.1.15, ya transitiva) | HIGH |
| 3 | Persistencia por viaje + migración de `roma-*` | Esquema de claves **`${slug}-<clave>`**: las claves de Roma (`roma-pace`, `roma-light`, `roma-resumen`, `roma-note-<card>`) **ya cumplen el esquema**, así que la migración es la identidad: no hay que mover nada y no se pierde nada. Un único helper `tripStorageKey(slug, key)` | Ninguna (sin VueUse, sin Pinia) | HIGH |
| 4 | Tema global | **`storageKey: 'roma-theme'` se queda tal cual y global.** El tema es una preferencia del dispositivo, no del viaje; renombrarlo obligaría a migrar antes del script anti-FOUC de color-mode | Ninguna | HIGH |
| 5 | `<title>`/meta por ruta desde datos | `useSeoMeta({ title: () => trip.value?.headTitle, … })` en `TripView` (o en la página); `app.vue` conserva solo `lang`, `theme-color` y favicons. Campo nuevo en `TripSchema` | Ninguna | HIGH |
| 6 | Mapa multi-ciudad | `map.fitBounds(bounds, { padding, maxZoom })` de Leaflet 1.9.4 ya cubre el encuadre regional. Si hace falta, un acceso rápido «por zona» con `flyToBounds` del core. **Sin markercluster** | Ninguna | HIGH |
| 7 | Actualizar versiones (Nuxt 4.6.4, Content 3.17.0…) | **No durante v1.1.** Hay versiones más nuevas, pero ninguna función de v1.1 las necesita y cada salto pone en riesgo los 56 goldens. Va al backlog como chore aislada después de v1.1 | — | HIGH |

---

## Recommended Stack

### Core Technologies (sin cambios: se fijan las versiones instaladas)

| Technology | Version (instalada / fijada) | Latest en npm (2026-11-20) | Uso en v1.1 | Por qué NO subir ahora |
|------------|------------------------------|----------------------------|-------------|-------------------|
| **nuxt** | **4.4.8** | 4.6.4 (2026-11-02) | Rutas `pages/index.vue` + `pages/trips/[slug].vue`, `nitro.prerender`, `useSeoMeta`, `<NuxtLink>` | Todo lo que necesita v1.1 (hook `prerender:routes`, `useSeoMeta` reactivo, payload extraction) ya está en 4.4.8. Subir dos minors en mitad de un milestone cuyo listón es «Roma sin regresiones» es riesgo sin beneficio. |
| **@nuxt/content** | **3.14.0** | 3.17.0 (2026-11-17) | `queryCollection('trip').all()` para la portada; mismas 6 colecciones con glob `trips/*/…` | Los parches de seguridad de 3.15.2, 3.16.1 y 3.16.2 (validación de WHERE, ReDoS) afectan al **endpoint de consultas del servidor**. Este sitio es 100% estático: en producción no hay servidor que los exponga. 3.17 añade soporte de Nuxt 5 y mejoras de carga en cliente que v1.1 no necesita. |
| **leaflet** | **1.9.4** | 1.9.4 (`latest`); 2.0.0-beta.5 (`beta`) | Encuadre multi-ciudad | 1.9.4 sigue siendo el `latest` estable. **No pasar a 2.0** (beta, solo ESM, sin el global `L` y con las factorías `L.marker()` deprecadas): reescribiría la isla del mapa que ya está verificada (12/12). |
| **@nuxtjs/color-mode** | **4.0.1** | 4.1.0 (2026-10-27) | Sin cambios; `storageKey: 'roma-theme'` global | No hay nada en v1.1 que lo toque. |
| **unhead / @unhead/vue** | **2.1.15** (transitiva de Nuxt) | — | `useHead` (script de redirección) y `useSeoMeta` (título por viaje) | Ya instalada; **no añadirla como dependencia directa**. |

### Supporting Libraries

**Ninguna nueva.** Para cada necesidad, el mecanismo que se usa:

| Mecanismo (ya disponible) | Para qué en v1.1 | Cuándo |
|---------------------------|------------------|--------|
| `node:fs` (`readdirSync`) en `nuxt.config.ts` | Enumerar los viajes para `nitro.prerender.routes` | En build, una vez |
| Hook de Nuxt `prerender:routes` (`ctx.routes: Set<string>`) | Alternativa equivalente a calcular `routes` en el config (verificado en `@nuxt/schema@4.4.8`, `index.d.mts:695`) | Solo si se prefiere un hook a un array calculado |
| `useHead({ script: [{ innerHTML, tagPosition:'head', tagPriority:'critical' }] })` | Script de redirección de enlaces antiguos en `/` | Solo en `pages/index.vue` |
| `useSeoMeta` con getters | `<title>`, `description`, `og:*` por viaje | En `TripView` / páginas |
| `provide`/`inject` de Vue con `InjectionKey<string>` | Pasar el `slug` del viaje a `useSearch` y `useCardNavigation`, que hoy hacen `useTrip('roma')` fijo | Al quitar el hardcode |
| `localStorage` nativo + `try/catch` (patrón actual) | Persistencia por viaje | En `onMounted`, como hoy |
| `L.latLngBounds`, `fitBounds({ padding, maxZoom })`, `flyToBounds` (Leaflet core) | Encuadre multi-ciudad y saltos por zona | En `LeafletMap.client.vue` |

### Development Tools

Sin cambios: Playwright 1.61.0, Vitest 4.1.9, `@nuxt/eslint` 1.16.0 (existen Playwright 1.65.1 y Vitest 5.1.1; **no subir** durante v1.1, porque subir Playwright cambia el Chromium que renderiza los goldens).

| Tool | Uso nuevo en v1.1 | Notas |
|------|-------------------|-------|
| Playwright (existente) | (a) re-apuntar la suite de paridad de `/` a `/trips/roma`; (b) tests de redirección `/#viernes` → `/trips/roma#viernes`; (c) test de que navegar de la portada a un viaje **no** pide `sql_dump.txt` ni `sqlite3.wasm`; (d) test de persistencia por viaje | El servidor estático de los tests debe imitar a GitHub Pages en la barra final (ver §7) |
| Vitest `tests/data` (existente) | Validar el `trip.yml` de Campania y los campos nuevos de `TripSchema`; invariante «slug de viaje = nombre de carpeta» y regex del slug | El esquema zod sigue siendo la única puerta de validación (Content v3 no valida `type:'data'` en build, #3351) |
| Vitest `tests/unit` (existente) | `tripStorageKey()`, predicado de redirección `legacyTarget(hash, base)`, cálculo de bounds multi-ciudad | Lógica pura en `app/utils/` |

---

## Integración con el código existente (los puntos de contacto)

### 1. Prerender de N viajes + portada

**Estado actual:** `nitro.prerender.routes: ['/']`, `crawlLinks: true`, `failOnError: true`. `pages/index.vue` renderiza `<TripView slug="roma"/>` y **evita a propósito** cualquier `<NuxtLink>` a `/trips/*` (D-01: no duplicar Roma). `pages/trips/[slug].vue` ya existe con un guard 404 (`createError` fatal).

**Recomendación (las dos cosas, no una u otra):**

1. **La portada `/` pasa a ser el índice** y renderiza un `<NuxtLink :to="`/trips/${t.slug}`">` por viaje (`queryCollection('trip').all()`). `crawlLinks` las descubre solo. `<NuxtLink>` antepone `app.baseURL` (`/guiaRoma/`) automáticamente, así que no hay que tocar las rutas.
2. **Enumeración explícita en build** como red de seguridad, independiente del marcado de la portada (si mañana la portada pagina, filtra o cambia de componente, los viajes siguen prerenderizándose):

```ts
// nuxt.config.ts
import { readdirSync, existsSync } from 'node:fs'

const tripsDir = new URL('./content/trips/', import.meta.url)
const tripSlugs = readdirSync(tripsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(new URL(`${d.name}/trip.yml`, tripsDir)))
  .map(d => d.name)

export default defineNuxtConfig({
  nitro: {
    preset: 'github_pages',
    prerender: {
      crawlLinks: true,
      routes: ['/', ...tripSlugs.map(s => `/trips/${s}`)],
      failOnError: true,
    },
  },
})
```

**Por qué en el config y no consultando Content:** al evaluar `nuxt.config.ts` la base SQLite de Content aún no existe. El sistema de ficheros es la misma fuente de verdad que el glob `trips/*/trip.yml` de `content.config.ts`. **Invariante a testear:** el nombre de la carpeta es igual al `slug` de `trip.yml` (si no coinciden, `[slug].vue` lanza 404 en prerender y, con `failOnError: true`, el build falla, que es lo que queremos).

**Lo que ya garantiza el build actual (verificado en `.output/public`):**
- Content prerenderiza un `__nuxt_content/<colección>/sql_dump.txt` por colección y empaqueta `sqlite3.wasm` (~856 KB) como respaldo para consultas en cliente.
- Hay **payload extraction** (`_payload.json` junto a cada HTML prerenderizado). Al navegar en cliente de `/` a `/trips/campania`, Nuxt lee el `_payload.json` de esa ruta y **no** ejecuta `queryCollection` en el navegador, así que no descarga la WASM. Esto solo vale si la ruta destino está prerenderizada, y es otra razón para el paso 2.
- `404.html` y `200.html` son el shell SPA (2,3 KB). Una ruta no prerenderizada en Pages caería al 404 SPA, que consultaría vía WASM y acabaría en el 404 de `[slug].vue`. Funciona, pero pesa ~1 MB y no va offline. Hay que evitarlo.

**Retirar** el comentario/regla D-01 de `index.vue` y `[slug].vue` («sin NuxtLink a /trips/*»): en v1.1 el enlace es justo lo que se quiere.

### 2. Redirección de URLs antiguas con hash

**Restricción dura:** el fragmento (`#viernes`) **nunca llega al servidor**, y GitHub Pages no admite reglas de redirección. Además, `nuxt generate` no ejecuta middleware de servidor. Cualquier redirección que conserve el hash tiene que ejecutarse **en el navegador**.

| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **Script inline en `<head>` de `/` con `location.replace`** | ✅ **Elegida** | Se ejecuta antes del primer paint y de cargar el bundle: no hay flash de la portada, no hace falta hidratar y funciona aunque el JS de la app falle. `replace` no deja `/` en el historial, así que «atrás» no entra en bucle. Es HTML prerenderizado: cero coste en runtime. |
| `navigateTo()` en `onMounted`/plugin cliente | ❌ | Exige descargar e hidratar toda la app antes de redirigir: se ve la portada un instante y en red pobre la espera es larga. Además vue-router intentaría hacer scroll a `#viernes` en la portada. |
| `routeRules: { '/': { redirect } }` prerenderizado | ❌ | Nitro/h3 escribe un HTML con `<meta http-equiv="refresh">` (verificado: `h3@1.15.11` `sendRedirect`), pero **redirigiría siempre `/`**, que en v1.1 es la portada. No sabe del hash. Solo serviría para alias de **ruta** (p. ej. `/roma` → `/trips/roma`), que no se piden. |
| `<meta http-equiv="refresh">` a mano | ❌ | No puede leer el hash en tiempo de ejecución, y los navegadores no lo conservan de forma fiable en un meta-refresh. |

**Regla de decisión:** «si `/` llega con un hash no vacío, redirigir a Roma». La portada nueva **no tiene anclas propias** (requisito de diseño que hay que respetar), así que cualquier hash es por fuerza un enlace antiguo a Roma. Es más simple y más robusto que una lista de anclas generada desde los datos, y cubre también anclas de fichas (`#galleria-sciarra`) y secciones (`#mapa`, `#gastronomia`).

```ts
// app/pages/index.vue  (setup) — constantes de BUILD, nunca input del usuario
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`
const target = JSON.stringify(`${base}trips/roma`) // LEGACY_TRIP = 'roma', constante de migración
useHead({
  script: [{
    key: 'legacy-hash-redirect',
    tagPosition: 'head',
    tagPriority: 'critical',
    innerHTML: `(function(){var h=location.hash;if(h&&h.length>1){location.replace(${target}+h)}})()`,
  }],
})
```

- `innerHTML` en entradas `script` es la API de unhead v2 (sustituye a `children`). **No se sanitiza**, así que solo se interpolan constantes de build (`baseURL` y el literal `'roma'`) pasadas por `JSON.stringify`. El hash se concatena en el navegador, no en el HTML.
- `LEGACY_TRIP = 'roma'` es una **constante de código**, no un campo de datos: es una migración puntual de URLs, no una propiedad de los viajes. No contradice ARCH-01 (añadir un viaje sigue sin tocar código).
- **SEO:** los buscadores no ven los hashes, así que no hay impacto. Recomendado: `<link rel="canonical">` en cada `/trips/<slug>` vía `useHead`, sin dependencia (sin `@nuxtjs/seo`).
- **Offline:** una pestaña con la versión vieja abierta sigue funcionando hasta que se recarga. Al recargar sin red, la navegación a `/trips/roma` falla igual que fallaría cualquier página sin service worker. No es una regresión: el offline real (PWA) es v2.

### 3. Persistencia por viaje y migración de `roma-*`

**Estado actual (verificado):** `useTripModes.ts` lee y escribe `roma-pace` / `roma-light` / `roma-resumen` literales; `MonumentCard.vue` usa `` `roma-note-${monument.slug}` ``; color-mode usa `roma-theme`.

**Decisión: esquema `${tripSlug}-${key}`, que da migración nula.**

```ts
// app/utils/tripStorage.ts
export const tripStorageKey = (tripSlug: string, key: 'pace' | 'light' | 'resumen' | `note-${string}`) =>
  `${tripSlug}-${key}`
// roma → 'roma-pace', 'roma-note-galleria-sciarra'  (IDÉNTICO a hoy)
// campania → 'campania-pace', 'campania-note-<card>'
```

| Opción | Veredicto | Razón |
|--------|-----------|-------|
| **`${slug}-<clave>`** (prefijo de viaje) | ✅ **Elegida** | Las claves de Roma ya son exactamente `roma-<clave>`: **cero código de migración, cero riesgo de pérdida**, y los tests de paridad que comprueban las claves literales siguen valiendo. Campania nace aislada. |
| Espacio nuevo `guia:<slug>:<clave>` + migración única | ⚠️ Solo si se quiere un namespace «limpio» | Exige un plugin `*.client.ts` con marcador de versión, idempotente y que **copie sin borrar**. La versión viva de `main` y la nueva comparten origen (`<usuario>.github.io`), así que borrar las `roma-*` rompería la vieja si conviven o se hace rollback. Más código y más riesgo para un beneficio estético. |
| VueUse `useLocalStorage` / `useStorage` | ❌ | Dependencia nueva para algo que hoy son 6 líneas con `try/catch` y lectura en `onMounted` (patrón anti-hidratación ya verificado). Además su serializador por defecto cambiaría el formato de los valores (`'1'/'0'`). |
| Pinia + `pinia-plugin-persistedstate` | ❌ | Estado global para preferencias locales de una página: sobreingeniería, y también cambia el formato guardado. |

**Salvaguardas:**
- Endurecer el `slug` del viaje en `TripSchema`: `z.string().regex(/^[a-z][a-z0-9-]*$/)`. Es seguro en URL, en clave de storage y en nombre de carpeta.
- **Sufijo reservado:** ninguna clave por viaje puede llamarse `theme`, porque `roma-theme` es la clave **global** del tema. Si no, el viaje `roma` colisionaría con color-mode.
- Riesgo de colisión por prefijo (p. ej. un viaje `roma-2028` frente a la nota `roma-note-…`): solo pasaría si una ficha de Roma se llamara igual que una clave de otro viaje con prefijo `2028-…`. Es teóricamente posible y despreciable en la práctica. Se puede documentar y añadir un test de datos que lo cubra (los slugs de viaje no deben ser prefijo `x-` de otro slug).

**Tema:** `colorMode.storageKey: 'roma-theme'` **se queda global y con ese nombre.** El script anti-FOUC de color-mode (inyectado en `<head>`, visible en el `404.html` actual) lee esa clave antes de que exista Vue. Renombrarla obligaría a meter **otro** script inline que migre antes del de color-mode, y si no, todos los usuarios perderían su tema. El nombre «roma» es un fósil cosmético; no merece ese riesgo.

### 4. `<title>` y head por ruta

**Estado actual:** `app.vue` fija `title: 'Roma · 19—23 giugno 2026'` (con el guion largo, verificado por paridad) más `lang`, `theme-color` y favicons.

**Recomendación:**
- `app.vue` conserva **solo** lo global: `htmlAttrs.lang`, los dos `theme-color` y los favicons.
- Nuevos campos opcionales en `TripSchema`: `headTitle` (Roma: `'Roma · 19—23 giugno 2026'` literal, para mantener la paridad) y `headDescription`. **No** usar `meta`, `id`, `stem` ni `extension`, que son nombres reservados de Content v3 (el bug CR-01 de v1.0 vino de `meta`).
- En `TripView` (o `[slug].vue`): `useSeoMeta({ title: () => trip.value?.headTitle, description: () => trip.value?.headDescription, ogTitle: …, ogDescription: … })`. Los getters son reactivos en unhead v2 y en el prerender salen ya resueltos en el HTML.
- Portada: `useSeoMeta({ title: 'Guía de viajes' /* o el texto que se decida */ })`.
- **No usar `titleTemplate`**: el título de Roma tiene que salir exacto (lo comprueba la paridad).

### 5. Leaflet multi-ciudad

**Estado actual (verificado en `LeafletMap.client.vue`):** `setView(trip.map.center, trip.map.zoom)` seguido de `fitBounds(latLngBounds(markers).pad(0.1))`. **Ya está guiado por datos y ya encuadra sobre todos los marcadores del viaje.** Para Campania (Ischia/Procida ~13,9°E → Cilento ~15,2°E, ~40,3–40,9°N), `fitBounds` dará un zoom regional (~9) sin cambiar código.

- **Sin librerías.** El problema real del multi-ciudad no es el encuadre, es el **solape de marcadores** en el centro de Nápoles a zoom regional. Con el core se resuelve así:
  - `fitBounds(bounds, { padding: [24, 24], maxZoom: 15 })`: `maxZoom` evita un zoom excesivo cuando un viaje tiene pocas paradas juntas. Roma no cambia si se aplica solo cuando no hay `trip.map` explícito (o si se mantiene el camino actual cuando hay `center`/`zoom`; hay que decidirlo en la fase cuidando la paridad).
  - Opcional: chips «por zona/ciudad» (nuevo campo de datos, p. ej. `zone` en el monumento o `mapZones[]` en `trip.yml`) que llaman a `map.flyToBounds(subset)`. Es todo core de Leaflet 1.9.4.
- **`leaflet.markercluster`: NO.** 1.5.3 es de **2021-10-18**, y la 2.0 está en beta y apunta a Leaflet 2. Agrupar además ocultaría los numerales romanos, que son la seña de identidad del mapa. Con ~40 marcadores por viaje no hace falta.
- `trip.map.center/zoom` puede pasar a **opcional** en `TripSchema`: si falta, se usa solo `fitBounds`. Roma lo mantiene, así que su paridad no cambia.
- Tiles: siguen siendo de OSM (los mismos de hoy). El banner offline se reutiliza tal cual.

### 6. Quitar el `'roma'` fijo de los composables

`useSearch.ts` y `useCardNavigation.ts` hacen `await useTrip('roma')`. Sin dependencia: `TripView` hace `provide(TRIP_SLUG_KEY, slug)` y los composables `inject(TRIP_SLUG_KEY)`. `useAsyncData` ya deduplica por clave (`mon-${slug}`), así que no hay doble consulta. **No añadir Pinia** para esto.

### 7. Barra final en GitHub Pages (riesgo a verificar, sin dependencia)

Con `autoSubfolderIndex: true` (default), `/trips/roma` sale como `trips/roma/index.html`. Según varias fuentes comunitarias (MEDIUM, sin confirmación oficial), GitHub Pages responde a `/guiaRoma/trips/roma` con un **301 a `/guiaRoma/trips/roma/`**. Los navegadores conservan el `#hash` en un 301 cuyo `Location` no lleva fragmento, y vue-router (no estricto) casa `/trips/roma/` con `[slug]`. Debería funcionar, pero añade un salto de red y puede cambiar `route.path` respecto al prerender.
- **Acción en la fase:** que el script de redirección apunte a `${base}trips/roma/` (con barra, sin salto 301) y añadir un test Playwright contra un servidor que imite a Pages (redirección de directorio). El `serve` local de la memoria del proyecto (subcarpeta `guiaRoma/`) puede no imitarlo, así que hay que comprobarlo.
- **Plan B sin dependencias:** `nitro.prerender.autoSubfolderIndex: false` (emite `trips/roma.html`, que Pages sirve en `/trips/roma`) o `<NuxtLink trailing-slash="append">`. **No** el módulo `nuxt-github-pages`.

---

## Installation

```bash
# v1.1 no instala nada.
# (Comprobación: el diff de package.json / pnpm-lock.yaml del milestone debería salir VACÍO.)
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `routes` calculadas con `node:fs` + `crawlLinks` | Solo `crawlLinks` | Si se quiere que un viaje **sin enlazar** desde la portada **no** se publique (borradores). En ese caso, mejor un `draft: true` en `trip.yml` filtrado en ambos sitios. |
| `routes` calculadas en el config | Hook `prerender:routes` (`ctx.routes.add(...)`) | Son equivalentes. El hook es preferible si en el futuro la lista sale de algo asíncrono. |
| Script inline en `<head>` | `navigateTo` en un plugin cliente | Nunca para este caso: flash y espera de hidratación con red pobre. |
| Prefijo `${slug}-` | `guia:<slug>:<key>` + migración copy-not-move | Si el equipo quiere un namespace uniforme ajeno al nombre «roma». Coste: un plugin cliente de migración con marcador de versión y tests. |
| `fitBounds` + `maxZoom` (core) | `leaflet.markercluster` | Solo si un viaje futuro tuviera cientos de puntos. No es el caso. |
| `provide/inject` del slug | Pinia | Si en v2 llega estado global real (auth, uploads). |
| Fijar Nuxt 4.4.8 / Content 3.14.0 | Subir a Nuxt 4.6.4 / Content 3.17.0 | Como **chore aislada después de v1.1** (o en una fase 0 propia), con `pnpm verify` completo y re-baseline consciente si cambia el render. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **`nuxt-github-pages`** (módulo comunitario de barra final) | Dependencia de terceros sin verificar para algo que se resuelve con config o con un test (ver §7, barra final) | Comprobar el comportamiento real de Pages; si hace falta, `<NuxtLink trailing-slash>` o `autoSubfolderIndex` |
| **`@nuxtjs/seo` / `nuxt-seo-utils`** | Megamódulo (sitemap, robots, og-image…) para dos metas por ruta | `useSeoMeta` + `<link rel="canonical">` con `useHead` |
| **VueUse (`useLocalStorage`)** | Dependencia nueva para 6 líneas; cambia la serialización (`'1'/'0'`) y pone en riesgo la compatibilidad con las claves `roma-*` existentes | `localStorage` nativo + `try/catch` en `onMounted` (patrón actual) |
| **Pinia / persistedstate** | Estado global innecesario; formato de almacenamiento distinto | `provide/inject` + helper `tripStorageKey` |
| **`leaflet.markercluster`** | Sin release estable desde 2021; oculta los numerales romanos | `fitBounds({ maxZoom })` / `flyToBounds` del core |
| **Leaflet 2.0 beta** | Beta, solo ESM, API rota respecto a 1.9; reescribiría la isla verificada | Leaflet 1.9.4 |
| **`routeRules` redirect de `/`** | Redirige siempre la portada y no sabe del hash | Script inline condicionado a `location.hash` |
| **Renombrar `roma-theme`** | Pierde el tema de todos los usuarios o exige un script previo al anti-FOUC | Mantenerlo global |
| **Prerender de rutas por consulta a Content en `nuxt.config`** | La base de Content no existe al evaluar el config | `readdirSync` sobre `content/trips/` |
| **Subir Playwright durante v1.1** | Cambia la versión de Chromium y con ella el render de los 56 goldens | Fijar 1.61.0 hasta cerrar v1.1 |

---

## Stack Patterns by Variant

**Si un viaje no debe publicarse todavía (borrador):**
- Añadir `draft: z.boolean().default(false)` a `TripSchema`; excluirlo en la portada **y** en la enumeración de `routes` (leyendo el YAML con el paquete `yaml`, que ya es devDependency, o con una convención de carpeta tipo `_borrador`).
- Así se evita que la red de seguridad publique lo que la portada oculta.

**Si el viaje es multi-ciudad (Campania):**
- Omitir `map.center/zoom` y dejar que `fitBounds` encuadre la región; opcionalmente añadir `mapZones` para saltos con `flyToBounds`.
- Así el mismo componente sirve para Roma (vista fija conservada) y para regiones.

**Si los días son variables (Campania tiene 10, con «opción A/B»):**
- Es un tema de esquema y componentes, no de librerías: `DaySchema` ya ordena por `order`. Los pills de navegación salen de `days`. Las opciones A/B son un modelado de datos, que corresponde a ARCHITECTURE/FEATURES, no al stack.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| nuxt@4.4.8 | hook `prerender:routes` | Verificado en `@nuxt/schema@4.4.8` (`index.d.mts:695`, `ctx: { routes: Set<string> }`). |
| nuxt@4.4.8 | @unhead/vue@2.1.15 | `useSeoMeta` con getters; `script[].innerHTML` + `tagPosition`/`tagPriority` (API v2; `children` eliminado). |
| @nuxt/content@3.14.0 | preset `github_pages` | Prerenderiza `__nuxt_content/<c>/sql_dump.txt` por colección (verificado en `module.mjs` y en `.output/public`). |
| nitropack@2.13.4 / h3@1.15.11 | `routeRules.redirect` + prerender | Genera HTML con meta-refresh (no se usa en v1.1; anotado). |
| leaflet@1.9.4 | @types/leaflet@1.9.21 | `fitBounds(bounds, { padding, maxZoom })` y `flyToBounds` en 1.9. |
| @nuxtjs/color-mode@4.0.1 | `storageKey: 'roma-theme'` | El script anti-FOUC lee la clave antes de hidratar; no cambiarla. |

---

## Sources

- **Código instalado (inspección directa, HIGH):** `node_modules/.pnpm/@nuxt+schema@4.4.8/.../index.d.mts:695` (hook `prerender:routes`); `@nuxt/content@3.14.0/dist/module.mjs:3150-3166` (routeRules de prerender `sql_dump.txt` por colección); `h3@1.15.11/dist/index.mjs:783` (meta-refresh en `sendRedirect`); `@unhead/vue@2.1.15` instalada.
- **Build actual `.output/public` (inspección directa, HIGH):** `_payload.json` (payload extraction activa), `404.html`/`200.html` shell SPA de 2,3 KB, `__nuxt_content/*/sql_dump.txt`, `_nuxt/sqlite3.*.wasm` de 856 KB; el script de color-mode lee `roma-theme`.
- **Código de la app (HIGH):** `nuxt.config.ts`, `content.config.ts`, `app/pages/index.vue`, `app/pages/trips/[slug].vue`, `app/app.vue`, `app/composables/useTrip.ts`, `useTripModes.ts`, `useSearch.ts`, `useCardNavigation.ts`, `app/components/LeafletMap.client.vue`, `MonumentCard.vue`, `shared/schemas.ts`.
- **npm registry (`npm view`, 2026-11-20, HIGH):** nuxt 4.6.4 (4.4.8 instalada), @nuxt/content 3.17.0 (3.14.0 instalada), @nuxtjs/color-mode 4.1.0, leaflet `latest` 1.9.4 / `beta` 2.0.0-beta.5, leaflet.markercluster 1.5.3 (2021-10-18) / 2.0.0-beta.2, zod 4.6.7, vitest 5.1.1, @playwright/test 1.65.1, @nuxt/test-utils 4.4.0, @types/leaflet 1.9.22, minisearch 7.2.0.
- [Nuxt — Lifecycle hooks](https://nuxt.com/docs/4.x/api/advanced/hooks): `prerender:routes`, `nitro:config` (seam: LOW; contrastado con el código instalado, HIGH).
- [Nuxt Content — Static deploy](https://content.nuxt.com/docs/deploy/static) y [Database](https://content.nuxt.com/docs/advanced/database): WASM SQLite en cliente para navegación en cliente (MEDIUM; el detalle del dump está contrastado con el build).
- [Nuxt Content — Releases](https://github.com/nuxt/content/releases): cambios 3.15.0–3.17.0, parches de seguridad del endpoint de consultas, sin cambios incompatibles (MEDIUM).
- [unhead — useHead](https://unhead.unjs.io/docs/head/api/composables/use-head) e [Inner content](https://unhead.unjs.io/docs/head/guides/core-concepts/inner-content): `tagPosition`, `tagPriority`, `innerHTML`/`textContent`, sin sanitización (MEDIUM; API contrastada con la versión instalada).
- [nuxt-github-pages (npm)](https://npmjs.com/package/nuxt-github-pages) y [Hugo discourse — trailing slash en GitHub Pages](https://discourse.gohugo.io/t/how-to-configure-301-trailing-slash-redirect-for-github-gitlab-pages/29604): Pages redirige `/dir` a `/dir/` (LOW/MEDIUM, **verificar en la fase**).

---
*Stack research for: v1.1 Multi-viaje + Campania (guiaRoma, Nuxt 4 estático)*
*Researched: 2026-11-20*
