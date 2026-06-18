# Pitfalls Research

**Domain:** Re-plataformado de una guía de viaje estática (`index.html`, 6.665 líneas) → **Nuxt 4** estático (`nuxt generate` / preset `github_pages`), offline, data-driven, con **paridad 100%** visual y funcional contra la versión viva.
**Researched:** 2026-06-18
**Confidence:** HIGH (patrones SSR/hydration/baseURL verificados contra docs oficiales de Nuxt 4.x vía Context7 `/websites/nuxt_4_x`; gotchas de GitHub Pages subpath verificados contra issues abiertos de `nuxt/nuxt`; comportamiento actual leído línea a línea en `index.html`)

> **Naturaleza de estos pitfalls.** No son consejos genéricos: cada uno cita el código o comportamiento concreto de `index.html` que se rompería, y se ata a la fase del roadmap que debe prevenirlo. El listón es **paridad** — por tanto la pregunta repetida es "¿este cambio altera lo que el usuario ve o puede hacer?". Donde el comportamiento de hoy ya tiene un defecto leve (p. ej. un flash de un frame), **replicarlo es paridad**; "arreglarlo" es scope creep y, peor, una regresión contra el listón.

---

## Critical Pitfalls

### Pitfall 1: Leaflet rompe el build de servidor / mismatch del mapa

**What goes wrong:**
`import L from 'leaflet'` a nivel de módulo (o `import 'leaflet/dist/leaflet.css'` mal ubicado) ejecuta código que toca `window`/`document` **durante `nuxt generate`** (prerender en Node) → el build peta con `window is not defined` / `ReferenceError: document`. Variante más sutil: el mapa se intenta renderizar en SSR/prerender, el HTML estático contiene un contenedor de mapa vacío y el cliente lo re-monta distinto → **hydration mismatch** y posible "salto" visual o doble inicialización.

**Why it happens:**
Leaflet es una librería de navegador puro con efectos secundarios en import. El `index.html` actual la **inlinea** (CSS+JS en `<head>`) y la inicializa con `L.map('leaflet-map', …)` (línea 6321) en un `<script>` que solo corre en el navegador — no hay servidor, así que el problema nunca aparece hoy. En Nuxt SÍ hay una pasada en Node (el prerender), y ahí Leaflet no puede ejecutarse.

**How to avoid:**
Patrón confirmado en la doc oficial de Nuxt 4 (guía de hydration, "Third-party Libraries with Side Effects"):
1. Componente con sufijo **`.client.vue`** (`components/TripMap.client.vue`) → Nuxt no lo renderiza ni ejecuta su `<script>` en prerender.
2. **Importar Leaflet dinámicamente dentro de `onMounted`**, NO a nivel de módulo:
   ```ts
   onMounted(async () => {
     const { default: L } = await import('leaflet')
     await import('leaflet/dist/leaflet.css')  // o en css[] del config (ver Pitfall 4)
     map = L.map(el.value!, { scrollWheelZoom: false }).setView([41.8989, 12.477], 14)
     // …divIcon, tileLayer, fitBounds(bounds.pad(0.1)), invalidateSize() — portados 1:1
   })
   ```
   (La doc desaconseja incluso `if (import.meta.client) { await import(...) }` en `<script setup>` síncrono; el sitio correcto es `onMounted`.)
3. Envolver el uso en `<ClientOnly>` con `#fallback` que pinte un placeholder **del mismo tamaño** que el mapa (CSS de hoy: contenedor con altura fija) → evita layout-shift y mismatch de atributos. La doc de upgrade de Nuxt 4 lo dice explícitamente: si dependías de un `<div>` placeholder con estilos, ahora va en `<ClientOnly><template #fallback>`.
4. **NUNCA cargar Leaflet desde CDN** (unpkg): rompería el offline. Importarlo de `node_modules` hace que Vite lo self-hostee bajo `/_nuxt/` (equivalente al inline de hoy).
5. Conservar `setTimeout(() => map.invalidateSize(), 300)` y el `invalidateSize` en `load` (líneas 6377-6378): el contenedor puede medir 0px en el primer tick y los tiles salen a medias si se omite.
6. Marcadores con **`L.divIcon`** (HTML puro, líneas 6350-6359): guiaRoma no usa las imágenes de marcador por defecto de Leaflet, así que el clásico bug de rutas `marker-icon.png` en bundlers **no aplica** — punto a favor de portar tal cual.

**Warning signs:**
- El build (`nuxt build/generate`) falla con `window is not defined`, `document is not defined`, o `navigator is not defined`.
- En dev aparece `Hydration node mismatch` apuntando al contenedor del mapa.
- El mapa parpadea, se inicializa dos veces, o los tiles quedan recortados al cargar.

**Phase to address:**
Fase del **mapa** (la más sensible a SSR/cliente; dejarla cuando el patrón `.client` + `<ClientOnly>` ya esté asentado por otras piezas). Verificación: un test que ejecute `nuxt generate` en CI y falle si peta; snapshot Playwright del mapa montado.

---

### Pitfall 2: FOUC de tema en la página estática (flash claro↔oscuro)

**What goes wrong:**
En salida estática, el HTML pre-renderizado en build **no puede conocer** `localStorage('roma-theme')` ni `prefers-color-scheme` del visitante. Si el tema se aplicara en `onMounted` (post-paint), un usuario con preferencia "dark" vería un **flash blanco** antes de que el JS conmute a oscuro. Reimplementar el tema a mano reproduce exactamente este defecto.

**Why it happens:**
`nuxt generate` pinta UNA vez en build. El primer paint del navegador es siempre ese snapshot; cualquier lectura de storage/`matchMedia` ocurre después. Es justo el motivo por el que la cookie (`useCookie`, recomendación genérica de Nuxt) **no sirve aquí**: sin servidor que lea la cookie por petición, no hay forma de pre-pintar el tema correcto desde el HTML.

**Confirmación de que `@nuxtjs/color-mode` lo resuelve en `generate`:**
El módulo (4.0.1, decidido en STACK.md) **inyecta un script inline en `<head>`** (`hid: nuxt-color-mode-script`) que lee storage/`matchMedia` y escribe el atributo **antes del primer paint**. Con `dataValue: 'theme'` produce `<html data-theme="dark">` — el **mismo selector** que el CSS actual (`[data-theme="dark"] { … }`, línea 1208 y bloque de tokens). Verificado: el commit `30b173e` del repo del módulo ("handle data attribute in script as well") confirma que el script anti-flash gestiona el **data-attribute**, no solo la clase → `dataValue: 'theme'` es FOUC-safe en SSG, no solo el modo clase.

**Matiz que SÍ puede reintroducir flash (verificado en docs):** con `preference: 'system'`, **renderizar condicionalmente según el tema en el template** (p. ej. `v-if="colorMode.value === 'dark'"` para el icono luna/sol) reintroduce flash, porque la preferencia del sistema no se conoce en prerender. La doc del módulo manda guardar con `$colorMode.unknown` o usar `<ColorScheme>`.

**How to avoid:**
1. Usar `@nuxtjs/color-mode` con la config exacta de STACK.md: `{ preference: 'system', fallback: 'light', dataValue: 'theme', storageKey: 'roma-theme', classSuffix: '' }`.
2. `fallback: 'light'` coincide con el `<html data-theme="light">` con que arranca el `index.html` actual (línea 2) → el snapshot estático es claro, idéntico a hoy.
3. **NO ramificar el DOM por tema en el template.** Igual que hoy, el icono luna/sol se resuelve **solo por CSS** (`[data-theme] .moon/.sun { display }`), evitando todo `v-if` dependiente del tema → cero mismatch y cero flash.
4. Reutilizar `storageKey: 'roma-theme'` para que el tema ya guardado en navegadores del equipo siga válido tras migrar.

**Warning signs:**
- Flash blanco/oscuro de ~1 frame al recargar con el tema no-default activo.
- En el HTML generado (`.output/public/index.html`), **ausencia** del `<script>` inline de color-mode en `<head>` → el anti-flash no está activo.
- Warning de hydration sobre `data-theme` o sobre el icono del botón de tema.

**Phase to address:**
Fase de **tema** (independiente de datos; hacerla pronto para fijar el anti-flash en estático antes que el resto de toggles). Verificación: inspeccionar el `<head>` del HTML generado; test Playwright que cargue con `localStorage roma-theme=dark` y compruebe que el primer paint ya es oscuro (sin transición visible).

---

### Pitfall 3: Mismatch de hidratación por leer localStorage en el render (notas / pace / light / resumen)

**What goes wrong:**
Inicializar estado leyendo `localStorage` en el `<script setup>` síncrono (que **también corre en prerender**) provoca `ReferenceError` en build o, peor, un DOM de servidor distinto del de cliente → **hydration mismatch**. Afecta a las 4 persistencias de hoy: `roma-note-<id>` (textareas, líneas 6472-6483), `roma-pace` (6507), `roma-light` (6550), `roma-resumen` (6568).

**Why it happens:**
Doc oficial de Nuxt 4 marca esto como el anti-patrón #1 de hidratación: `const x = localStorage.getItem(...)` en `<script setup>` "causa hydration mismatch — localStorage no existe en el servidor". El `index.html` actual no sufre esto porque todo su JS es client-only y corre en `init()` **después** del paint.

**Qué es seguro vs qué parpadea (y si ya parpadea hoy → paridad):**

| Estado | ¿Seguro? | ¿Parpadeo hoy? | Veredicto de paridad |
|--------|----------|----------------|----------------------|
| **Notas** (`<textarea>`) | Seguro | No | Un `<textarea>` vacío es válido en server y cliente; rellenarlo en `onMounted` **no** es mismatch (el contenido no es texto pre-renderizado distinto). Cero parpadeo, igual que hoy. |
| **Pace** | Seguro si el default coincide | Sí, leve | Hoy `restorePace()` corre en `init()` post-paint: si había `roma-pace=slow` guardado, hay un repintado de un frame (items que se ocultan). Default `'optimistic'` = botón con `.active` pre-renderizado. **Replicar ese frame ES paridad.** |
| **Light-mode** | Seguro si default `false` | Sí, leve | `light-mode` oculta secciones con `display:none !important`; `restoreLightMode()` corre post-paint → breve flash de contenido que luego se oculta. **Ese flash ya existe hoy** → mantenerlo es paridad. |
| **Resumen** | Seguro si default `false` | Sí, leve | Idéntico a light-mode (`modo-resumen` togglea clase + CSS oculta). Flash de un frame ya presente hoy. |

**How to avoid:**
1. **Nunca** leer `localStorage` en `<script setup>` síncrono. Leer en `onMounted` o usar VueUse `useStorage('roma-...', default)` (hace el guard SSR internamente).
2. El **valor inicial del `ref`/`useState` debe coincidir con el HTML pre-renderizado**: `pace = 'optimistic'`, `lightMode = false`, `resumen = false`, nota `''`. Tras `onMounted` se restaura el guardado → mismo comportamiento (y mismo micro-flash) que hoy.
3. Conservar los **prefijos de clave exactos** (`roma-note-<id>`, `roma-pace`, `roma-light`, `roma-resumen`) para continuidad de datos de usuarios actuales en el mismo navegador.
4. No intentar eliminar el flash de pace/light/resumen con un script inline extra: NO es necesario para paridad y **diverge** del comportamiento actual (riesgo de regresión, además de scope creep). El único toggle que justifica script inline es el tema (Pitfall 2), y ese ya lo cubre el módulo.

**Warning signs:**
- Build falla con `localStorage is not defined`.
- Warning `Hydration text content mismatch` / `Hydration class mismatch` en consola de dev.
- El estado guardado NO se restaura al recargar (señal de que se inicializó mal o el watch de persistencia no corre).

**Phase to address:**
Fase de **modos/persistencia** (toggles pace/light/resumen + notas; bajo riesgo, validan el patrón `onMounted`/`useStorage` antes de las piezas duras). Verificación: tests Playwright que recargan con cada clave seteada y comprueban estado restaurado; revisar consola sin warnings de hydration.

---

### Pitfall 4: Regresión visual al "scopear" el CSS global escrito a mano (~2.200 líneas)

**What goes wrong:**
El CSS actual es **global** y se apoya en cascada, selectores que cruzan elementos (`body.light-mode .x`, `body.modo-resumen .tl-meta`, `[data-theme="dark"] .leaflet-tile`, `.tl-item[data-pace]`) y especificidad concreta. Si al migrar se trocea en `<style scoped>` por componente, Vue añade atributos `data-v-xxx` que **cambian la especificidad y rompen los selectores cruzados** → estilos que dejan de aplicarse, toggles que no ocultan nada, dark-mode del mapa que no tiñe, fuentes que cargan en otro orden. Resultado: rotura silenciosa del listón de paridad.

**Why it happens:**
`scoped` es el reflejo por defecto en Vue, pero está pensado para componentes aislados, no para un CSS editorial diseñado como hoja global. Selectores como `body.modo-resumen .day-stats { display:none }` dependen de que `.day-stats` y el `body` no estén "scopeados" a componentes distintos.

**How to avoid:**
Decidido en STACK.md §5 — **conservar el CSS global tal cual**:
1. Trasvasar verbatim a `assets/css/`: `tokens.css` (el bloque `:root` + `[data-theme="dark"]`), `base.css` (reset/tipografía) y `leaflet.css` (el CSS de Leaflet inline de hoy, líneas 14-…). Importarlo **una sola vez** en `nuxt.config.ts → css: ['~/assets/css/tokens.css', '~/assets/css/base.css', '~/assets/css/leaflet.css']`.
2. Para parity rápida, **empezar todo global** (sin `scoped`). Modularizar a `<style scoped>` solo estilos verdaderamente locales y **nunca** los que cruzan componentes (toggles, dark-tiles, `data-pace`). Opcional: `@layer tokens, base, components` para controlar cascada al modularizar.
3. **Fuentes:** hoy llegan de Google Fonts (`<link>` línea 13). En Nuxt, `@nuxt/fonts` las auto-hostea detectando `font-family` en el CSS. Cuidado con el **orden de carga / FOUT**: verificar que las tres familias (Cormorant Garamond, Lora, JetBrains Mono) con sus pesos/itálicas exactos se sirven y que `font-display` no introduce un salto tipográfico distinto al de hoy (ver también Pitfall 6 sobre offline de fuentes).
4. El CSS usa `color-mix(in srgb, …)`: soportado nativamente, sin preprocesador. No introducir SCSS/PostCSS extra.

**Warning signs:**
- Un toggle (resumen/caminar-menos) deja de ocultar lo que ocultaba.
- El filtro oscuro de los tiles del mapa (`[data-theme="dark"] .leaflet-tile`) no se aplica.
- Atributos `data-v-xxxxxxx` en elementos que antes no los tenían + selectores que ya no "pegan".
- Texto que "baila" al cargar (FOUT) de forma distinta a hoy.

**Phase to address:**
Fase de **fundamentos / setup de estilos** (importación global del CSS + fuentes), antes de construir componentes. Verificación: **visual-diff Playwright contra `index.html` golden** (ver Pitfall 11) en light y dark, móvil y desktop — es el detector objetivo de cualquier drift de cascada.

---

### Pitfall 5: El build estático rompe servido desde el subpath `/guiaRoma/` (assets/links 404)

**What goes wrong:**
GitHub Pages sirve el sitio en `usuario.github.io/guiaRoma/`. Si no se fija `baseURL`, los assets generados referencian `/_nuxt/…` desde la **raíz del dominio** y **404 en masa** (CSS, JS, fuentes self-hosted, imágenes locales). Issues abiertos de `nuxt/nuxt` confirman el patrón exacto (#31551 "app.baseURL en subfolder no funciona", #22225 "MIME/404 con app.baseURL", #15091, #12892). Además: si Pages aplica **Jekyll**, ignora la carpeta `_nuxt/` (empieza por `_`) y el sitio queda sin assets aunque las rutas sean correctas.

**Why it happens:**
El `index.html` actual es un único fichero con rutas relativas / CDN, así que "simplemente funciona" en cualquier ruta. Nuxt genera una estructura `_nuxt/` con rutas que dependen de `app.baseURL`; ese prefijo hay que declararlo explícitamente y propagarlo a CI.

**How to avoid:**
Decidido en STACK.md §3:
1. Build con `NUXT_APP_BASE_URL=/guiaRoma/ npx nuxt build --preset github_pages` (la doc oficial de Nuxt confirma esta env var para repos sin dominio propio). Equivale a `app.baseURL` en `nuxt.config`.
2. **`.nojekyll`**: el preset `github_pages` debería añadirlo, pero hay **fricción conocida** (`nuxt/nuxt` #21232 / #12480). Cinturón-y-tirantes: crear `public/.nojekyll` vacío en el repo → siempre acaba en `.output/public`.
3. **Nunca hardcodear rutas absolutas** de assets (`/img/x.png`, `/favicon.svg`). Usar imports, `~/assets`, o construir con `useRuntimeConfig().app.baseURL` cuando una URL se arma a mano. Ojo con el favicon/apple-touch-icon (hoy `href="favicon.svg"`, relativo — verificar que siga resolviendo bajo el subpath).
4. **Hash vs history routing:** mantener **history** (default de Nuxt). El sitio actual es una sola página con anclas `#id` (no rutas), así que `routes: ['/']` + `crawlLinks: true` basta; no introducir hash-mode (cambiaría las URLs y rompería los anclas profundos). Las anclas `#galleria-sciarra` siguen siendo fragmentos, no rutas.
5. **Trailing slash / `autoSubfolderIndex: true`** (default): deja `/x/index.html`; no tocar salvo problema.
6. `nitro.prerender.failOnError: true` para que un enlace roto **rompa el build** en vez de desplegar un 404 silencioso.

**Warning signs:**
- En local con `npx serve .output/public` desde una subcarpeta, o tras desplegar, la página carga **sin estilos** y la consola muestra 404 de `/_nuxt/*` o errores MIME (`text/html` en vez de `text/css`/`application/javascript`).
- Imágenes locales / favicon 404.
- El sitio funciona en `localhost:3000` (raíz) pero no en `usuario.github.io/guiaRoma/`.

**Phase to address:**
Fase de **build/deploy estático** (configurar preset + baseURL + workflow). Verificación: servir `.output/public` bajo un subpath simulado y/o un deploy de prueba a Pages antes de cualquier release; confirmar `.nojekyll` presente y cero 404 en consola.

---

### Pitfall 6: Sobre-prometer "offline" más allá de lo que hace hoy

**What goes wrong:**
"Conservar el offline" se interpreta como "todo funciona sin red" y se acaba intentando cachear tiles, construir PWA, o tratar las imágenes remotas como si fueran locales. Eso es **scope creep** (PWA está fuera de alcance, PROJECT.md) y además puede **romper** comportamientos que hoy degradan con elegancia.

**Why it happens:**
"Offline" es ambiguo. La guía de hoy NO es offline-completo; es **offline-tolerante** con tres capas distintas. Confundirlas lleva a sobre-ingeniería o a regresiones.

**Qué significa "paridad offline" exactamente (estado REAL de hoy, leído en el código):**

| Recurso | Estado hoy | Qué hacer en la migración | Qué NO hacer |
|---------|-----------|----------------------------|--------------|
| **Leaflet (CSS+JS)** | **Inlineado** en el HTML → funciona sin red | Importar de `node_modules` → Vite lo self-hostea bajo `/_nuxt/` (equivalente). **Offline preservado.** | Cargarlo desde unpkg/CDN (rompería offline). |
| **Fuentes** (Cormorant/Lora/JetBrains Mono) | Cargan de **Google Fonts CDN** (`<link>` línea 13) → **HOY dependen de red**; sin conexión caen a las fuentes de fallback de la pila (`'Garamond','Times New Roman',serif`…) | `@nuxt/fonts` las auto-hostea → **mejora** el offline respecto a hoy, sin cambiar el look. Recomendado para uso "paseando por Roma". | Asumir que self-hostear fuentes es un requisito de paridad: hoy NO lo es (hoy van por CDN). Es una mejora alineada con offline, no una obligación. |
| **Imágenes hero/detail** | URLs de **terceros** (Wikimedia, turismoroma) con `onerror` → SVG fallback inline | Replicar `@error` → SVG (Pitfall 9). **Sin red, las imágenes 404 y caen al SVG — exactamente como hoy.** | Tratar de empaquetar/optimizar las heros con `@nuxt/image` (provider estático no procesa URLs de terceros y **rompería** el patrón de fallback). |
| **Tiles del mapa (OSM)** | Remotos; si fallan, **banner "Sin conexión · solo marcadores visibles"** (heurística `tilesErrored > 3 && tilesLoaded === 0`, líneas 6327-6333) | Portar la heurística **1:1** a estado reactivo `offline`. Sin red: mapa gris + marcadores `divIcon` (que son HTML, no tiles) + banner. **Igual que hoy.** | "Mejorar" cacheando tiles offline = PWA = **v2**. |

**How to avoid:**
1. Definir "offline parity" en el roadmap como: **assets de app self-hosted (Leaflet, CSS, JS, y fuentes vía `@nuxt/fonts` como mejora) + imágenes de terceros que degradan a SVG + tiles remotos con banner**. Ni más, ni menos.
2. Portar la heurística del banner **literal** (`> 3 errores && 0 cargas`): es específica y fácil de "optimizar" rompiéndola (Pitfall transversal con el mapa).
3. PWA / service worker / precache de tiles: **anotado para v2, no tocar en 1.0**.

**Warning signs:**
- Aparece `@vite-pwa/nuxt`, un `sw.js`, o lógica de cache de tiles en un PR de la 1.0 → scope creep.
- El banner offline deja de salir, o sale con otra condición (regresión de comportamiento).
- Se intenta pasar las heros de Wikimedia por `<NuxtImg>` con provider estático.

**Phase to address:**
Transversal: **fuentes** en la fase de fundamentos/estilos; **banner + tiles** en la fase del mapa; **fallback de imagen** en la fase de contenido. La *no-acción* (no PWA) se vigila en revisión de alcance de cada PR.

---

### Pitfall 7: La prosa de las fichas renderizada con `<MDC>` rompe tipografía/espaciado (y postura XSS de `v-html`)

**What goes wrong:**
La prosa literaria de cada ficha (campos string Markdown-inline, decidido en STACK.md §1) se renderiza con `<MDC>`. Dos trampas de paridad:
1. **`<MDC>` envuelve el contenido en `<p>`** (usa componentes Prose: `ProseP`). Si el HTML de hoy mete ese texto directamente dentro de un contenedor con su propio `margin`/`line-height`, el `<p>` extra añade márgenes/espaciado que **rompen el ritmo vertical** → no es pixel-idéntico.
2. **Escapado / whitespace:** comillas tipográficas, guiones largos (`—`), `<em>`/`<strong>` y los **enlaces internos** `[texto](#g-fortunata)` deben renderizar exactamente como los `<em>`/`<strong>`/`<a>` actuales. Un parseo Markdown-inline que "normalice" espacios o escape de más cambia el texto visible.

Para los **SVG de fallback** y cualquier HTML de confianza incrustado, se usará `v-html` — que es un vector XSS si el contenido fuera externo.

**Why it happens:**
El `index.html` tiene la prosa como **HTML escrito a mano**, con su markup exacto y sin wrappers extra inesperados. Markdown introduce su propio modelo de bloque (párrafos), y un renderer añade elementos que el original no tenía.

**How to avoid:**
1. Donde la prosa sea **inline** (una frase dentro de un contenedor que ya da estilo), usar `unwrap`/`mdc-unwrap="p"` para **quitar el `<p>` envolvente** (confirmado en docs de Nuxt Content: `mdc-unwrap` "remove one or multiple wrapping elements"; `ContentRenderer` acepta prop `unwrap`). Donde la prosa sea **multi-párrafo** (Historia, Anécdotas), dejar los `<p>` y **ajustar el CSS** para que el margen entre párrafos iguale al de hoy.
2. Auditar, sección por sección, qué markup genera `<MDC>` vs el HTML original y cuadrar el CSS (es trabajo de cascada, no de lógica).
3. Mantener los **enlaces internos** `#id` interceptados por el composable de navegación (igual que hoy `bindCardLinks`), no por navegación de router.
4. **XSS / `v-html`:** los SVG (`SVG_MOTIFS`) y la prosa son **contenido propio y de confianza** versionado en el repo (no input de usuario) → `v-html` es aceptable aquí, **igual que hoy** (el `index.html` inyecta los SVG con `innerHTML`, líneas 2220/2235). Documentar explícitamente que `v-html` solo se usa sobre contenido del repo; **nunca** sobre las notas del usuario (que van en `<textarea v-model>`, texto plano, sin render). Si en v2 entrara contenido de terceros, reevaluar.

**Warning signs:**
- El visual-diff muestra el texto de las fichas desplazado verticalmente (márgenes de `<p>` extra).
- Comillas/guiones/cursivas que renderizan distinto del original.
- Un enlace interno `#g-fortunata` recarga la página o no hace el scroll+pulse de hoy.

**Phase to address:**
Fase de **modelado de contenido + render de prosa** (esquema de datos + `<MDC>`). Verificación: visual-diff por ficha-tipo; un test que compruebe que `[texto](#id)` produce un `<a href="#id">` que dispara la navegación.

---

### Pitfall 8: Re-derivar búsqueda y "ruta del día" desde datos pierde lo que el DOM-scrape incluía

**What goes wrong:**
Hoy **búsqueda** y **ruta del día** raspan el DOM (anti-patrón a eliminar), y su comportamiento exacto **depende de detalles implícitos del HTML**. Al re-derivar desde datos tipados es muy fácil cambiar sutilmente qué entra:

1. **Búsqueda** (líneas 6433-6442): indexa `card.textContent.toLowerCase()` — es decir, **todo el texto visible de la ficha** (Qué es + Historia + Anécdotas + En qué fijarse + `card-italian` + facts + caption…). Si el índice nuevo solo concatena algunos campos, **encontrará menos cosas que hoy** (regresión silenciosa: una búsqueda que antes daba resultado deja de darlo). Filtro: `q.length >= 2`, `content.includes(q)`, **máx 8** resultados, "Sin resultados" si 0.

2. **Ruta del día** (líneas 6584-6645): el conjunto de paradas está definido por **qué elementos tienen `.maps-link`** — y SOLO las fichas de monumento lo tienen; los restaurantes usan `.tl-food-name` (confirmado: líneas 2423/2437-2441 usan `.tl-food-name`, línea 2498 usa `.maps-link`). Por tanto **restaurantes y eventos guiados/concierto quedan fuera "por accidente del DOM"**. Además:
   - El **orden** es el de aparición en el DOM del día (orden del timeline), no el del array `places`.
   - `pointFor` resuelve coords vía `closest('article.card[id]')` → `coordById`, y si no, el `query` del enlace.
   - **Cap a 10 paradas** con muestreo del medio: `Math.round(i * (middle.length-1) / (slots-1))`, conservando primera y última (líneas 6602-6613).
   - Mínimo **2 paradas** para mostrar el botón; texto condicional `(N paradas)` vs `(10 de N paradas)`.

**Why it happens:**
La lógica de negocio ("qué cuenta como parada", "en qué orden") está **escondida en la estructura HTML**, no declarada. Re-derivar desde datos obliga a hacer explícito ese criterio, y si se hace "a ojo" se desvía del original.

**How to avoid:**
1. **Búsqueda:** construir un campo `haystack` que concatene **exactamente los mismos textos** que entraban en `card.textContent` (todas las secciones de prosa + italiano + facts + caption). Mantener `>=2`, `includes` (o equivalente con MiniSearch que no reduzca cobertura), **8** resultados, "Sin resultados". (MiniSearch aporta ranking/prefijo, pero el conjunto de coincidencias **no debe ser menor** que el `includes` de hoy — verificar con casos reales.)
2. **Ruta del día:** hacer el criterio **explícito en el dato**: marcar qué paradas entran replicando "monumentos sí, gastronomía/guiado/concierto no" (= los que hoy tienen `.maps-link`). Garantizar que el dato preserve el **orden del timeline por día**. Portar `pointFor`, `capStops` (la fórmula de muestreo **literal**) y `buildDirUrl` como funciones puras testeables. Conservar umbral 2 y el texto condicional.
3. Tests unitarios sobre estas funciones puras: dado el set de paradas de cada día, la URL generada debe coincidir con la de hoy (incluido el cap y el muestreo).

**Warning signs:**
- Una búsqueda que antes encontraba una ficha por una palabra de su prosa ya no la encuentra → `haystack` incompleto.
- La URL de "ruta del día" incluye restaurantes, o cambia el orden, o cambia las paradas elegidas al capar → criterio/orden/muestreo desviado.
- El botón aparece en días con <2 paradas, o el texto `(10 de N)` no cuadra.

**Phase to address:**
Fase de **datos tipados** (define el orden por día y el flag de inclusión) + fase de **búsqueda/ruta** (re-derivación). Verificación: tests de invariante (nº de fichas indexadas, cobertura de `haystack`) + tests de URL de ruta por día contra golden.

---

### Pitfall 9: El fallback de imagen hero/detail no se replica con fidelidad (motif, hero vs detail, lazy)

**What goes wrong:**
El `<img onerror="loadSvgFallback(this, 'id')">` de hoy tiene comportamiento específico que un `<NuxtImg>` o un `@error` mal hecho rompe:
- **Hero** (`loadSvgFallback`, líneas 2215-2227): reemplaza el `innerHTML` del **contenedor** `.card-hero` por el SVG; si no hay motif, **oculta el contenedor**.
- **Detail** (`loadSvgFallbackDetail`, líneas 2229-2252): reemplaza **solo el `<img>`** por el SVG (estilos `width:100%;height:auto;border-radius:4px;display:block`), **conservando el caption**.
- El motif sale de **`CARD_TO_MOTIF`** (37 entradas, línea 2213). Si una ficha pierde su entrada, **pierde su fallback**.
- Todas las imágenes llevan **`loading="lazy"`** y `alt` exactos.

**Why it happens:**
El evento `error` de `<img>` ocurre **solo en cliente** (en prerender no se cargan imágenes). El HTML estático pinta siempre el `<img>` "optimista"; el cambio a SVG es **post-hidratación legítimo** (no mismatch: el DOM inicial cliente == server). Pero `<NuxtImg>` puede envolver el `<img>`, reescribir `src` o manejar el error de otra forma, divergiendo del patrón.

**How to avoid:**
1. Usar **`<img>` nativo con `@error`** (no `<NuxtImg>`) para máxima fidelidad: `<img v-if="!failed" :src :alt loading="lazy" @error="failed = true">` + `<component v-else>`/`v-html` con el SVG del motif. `<NuxtImg>` queda descartado para heros también porque son **URLs de terceros** (Pitfall 6) que el provider estático no procesa.
2. **NO inicializar `failed` en build** (es imposible saber si la imagen fallará) — dejar siempre el `<img>` en el render inicial.
3. Llevar el `CARD_TO_MOTIF` a un **campo `motif` por ficha** en el dato tipado (las 37 entradas → un campo cada una; validar con zod `enum` para que falte ninguna = build rota).
4. Implementar **dos modos** o dos componentes: hero (sustituye contenedor / oculta si no hay motif) y detail (sustituye img, conserva caption, mismos estilos inline).
5. Conservar `loading="lazy"` y `alt` exactos (accesibilidad, está en el listón).

**Warning signs:**
- Una imagen que falla deja un hueco roto en vez del SVG (motif perdido o `@error` no enganchado).
- En detail, al fallar la imagen **desaparece también el caption** (se usó el modo hero por error).
- El SVG de detail no respeta `border-radius`/`width:100%` → estilo divergente.
- Falta `loading="lazy"` → cambio de comportamiento de carga.

**Phase to address:**
Fase de **componentes de contenido** (ficha/hero/detail), apoyada en el **dato tipado** que aporta `motif`. Verificación: test que fuerce un `src` roto y compruebe el cambio a SVG por motif; visual-diff de una ficha con imagen forzada a fallar.

---

### Pitfall 10: Scope creep — activar Nitro, construir PWA o sobre-componentizar en la 1.0

**What goes wrong:**
El listón es **paridad**. Es tentador "ya que estamos" activar endpoints Nitro, añadir PWA/service worker, o partir la UI en una jerarquía de 40 componentes con abstracciones especulativas. Cada uno aleja del objetivo, añade superficie de regresión, y contradice PROJECT.md (backend "preparado pero dormido"; PWA y segundo viaje en v2/futuro).

**Why it happens:**
El responsable domina Nuxt y prevé un futuro full-stack → sesgo natural a construir para ese futuro ahora. Pero la 1.0 es una **migración con paridad verificable**, no un producto nuevo.

**How to avoid:**
1. **Nitro dormido:** dejar la estructura `server/` lista pero **sin rutas activas**; en SSG no hay servidor en producción de todos modos. Cualquier `defineEventHandler` con lógica real → fuera de la 1.0.
2. **PWA:** anotada para v2 (Pitfall 6). Cero `@vite-pwa/nuxt`, manifest instalable, o service worker en la 1.0.
3. **Componentización:** componentizar lo que la paridad necesita (ficha, timeline, mapa, controles, secciones, layout — los de FEATURES.md/ARCHITECTURE.md), **no** crear abstracciones para el "segundo viaje" más allá del glob de datos `trips/*/` que ya lo soporta sin código. Regla: si un componente/composable no sirve a una feature existente, no entra en la 1.0.
4. **i18n / rediseño / CMS:** explícitamente fuera (PROJECT.md).

**Warning signs:**
- PRs que tocan `server/` con lógica, añaden dependencias de PWA, o introducen capas "por si acaso".
- Componentes/props que no mapean a ninguna de las 10 features del listón.
- Discusiones de "ya que migramos, mejoremos X" sobre el look o las funciones.

**Phase to address:**
Transversal: revisión de alcance en **cada PR** contra la lista de requisitos Validated de PROJECT.md. La fase final de **verificación de paridad** (Pitfall 11) actúa como red: si algo no aporta a la paridad, sobra.

---

### Pitfall 11: No tener forma objetiva de probar "idéntico" (gap de verificación de paridad)

**What goes wrong:**
"Paridad 100%" sin un test objetivo se convierte en revisión manual subjetiva: se da por bueno "se ve igual", y regresiones sutiles (un margen, un color de token, un toggle que oculta un selector de menos, el offset `+130` del scrollspy) se cuelan hasta producción. Sin golden, no hay forma de **demostrar** que el listón se cumple.

**Why it happens:**
La paridad es el requisito más importante y el más fácil de "verificar a ojo". El `index.html` original es el **oráculo** disponible (está en `main`), pero si no se captura como golden, se pierde la referencia conforme se trabaja en la rama de release.

**How to avoid:**
Decidido en STACK.md §6 — verificación con **Playwright**:
1. **Visual-diff con golden tomado del `index.html` real:** servir el `index.html` original (estático) y capturar screenshots de la home, cada sección de día, una ficha de cada tipo (monumento/gastro/artista), en **light y dark**, a anchos **móvil y desktop**. Esos golden se comparan a pixel contra el build Nuxt (`toHaveScreenshot`). Es lo que convierte "paridad" en un test que pasa/falla.
2. **E2E de comportamiento:** cambiar ritmo y verificar visibilidad de `tl-item`/`tl-transport` (matriz exacta: `slow-only` solo en optimistic; `medium` oculto en slow); alternar tema y comprobar `data-theme`; buscar y validar resultados (≥2, máx 8, "Sin resultados"); clic en "ruta del día" y verificar la **URL de Google Maps** generada; notas que persisten en localStorage; pila "volver" desde mapa/búsqueda/timeline; scrollspy con el offset `+130`.
3. **Invariantes de datos:** nº de fichas (38 monumentos + 26 gastro), IDs únicos, todos los enlaces cruzados `#xxx` resuelven a un `id` existente, `CARD_TO_MOTIF` completo (Pitfall 9).
4. Capturar los golden **al inicio** del proyecto (desde `main`), antes de que la rama de release diverja.

**Warning signs:**
- El plan de verificación dice "revisar manualmente que se ve igual" → no es objetivo.
- No hay screenshots golden del `index.html` original guardados.
- Diferencias de paridad se descubren por feedback humano, no por un test que falla.

**Phase to address:**
Fase de **fundamentos** (capturar golden desde `main` cuanto antes) + fase final de **verificación/release** (la suite completa debe pasar antes de cualquier merge a producción). Verificación: el propio suite Playwright es la verificación.

---

## Technical Debt Patterns

Atajos que parecen razonables pero crean problemas en esta migración.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `<style scoped>` por todo desde el inicio | "Componentes limpios" | Rompe selectores cruzados (toggles, dark-tiles) → drift de paridad difícil de rastrear | **Nunca** para selectores que cruzan componentes; sí para estilos puramente locales tras tener paridad |
| Indexar solo `name`+`italian` en búsqueda | Índice pequeño y rápido | Pierde coincidencias que hoy daba `card.textContent` → regresión silenciosa | **Nunca**: el `haystack` debe cubrir el mismo texto que hoy |
| Filtrar paradas de la ruta "a ojo" | Rápido de codear | Diverge del conjunto implícito de `.maps-link` (incluye/excluye mal) | **Nunca**: replicar el criterio exacto y testearlo |
| Inicializar `failed=true`/leer `localStorage` en `<script setup>` | Menos código | Hydration mismatch / build roto | **Nunca**: usar `onMounted`/`useStorage` |
| `<NuxtImg>` para las heros | Optimización "gratis" | No procesa URLs de terceros y rompe el `@error`→SVG | **Nunca** en 1.0 para heros remotas; evaluar `@nuxt/image` solo para imágenes **locales** en v2 |
| Saltarse el visual-diff golden | Avanzar más rápido al principio | Sin oráculo, la paridad no es demostrable y las regresiones se cuelan | **Nunca**: capturar golden desde `main` antes de divergir |
| `IntersectionObserver` para el scrollspy en 1.0 | Más idiomático | Cambia sutilmente cuándo conmuta la pill vs el `+130` actual | Solo en **v2**; en 1.0 replicar la fórmula `scrollY+130 >= offsetTop` |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Leaflet** | `import 'leaflet'` a nivel de módulo / cargarlo de CDN | `.client.vue` + `await import('leaflet')` en `onMounted`; self-host desde `node_modules` |
| **Google Fonts** | Mantener el `<link>` a `fonts.googleapis.com` (dependencia de red) | `@nuxt/fonts` auto-hostea las 3 familias (mejora de offline; verificar pesos/itálicas y FOUT) |
| **OpenStreetMap tiles** | Intentar cachearlos para "offline real" en 1.0 | Tiles remotos + banner `>3 errores && 0 cargas` portado literal; caché de tiles = PWA = v2 |
| **GitHub Pages** | No fijar `baseURL`; confiar en que `.nojekyll` aparezca solo | `NUXT_APP_BASE_URL=/guiaRoma/` + `public/.nojekyll` explícito + `failOnError` |
| **Imágenes Wikimedia/turismoroma** | Empaquetarlas/optimizarlas en build | Dejarlas como `<img>` remotas con `@error`→SVG fallback (degradan offline como hoy) |
| **`@nuxtjs/color-mode`** | `preference:'system'` + `v-if` por tema en template | Theming solo por CSS `[data-theme]`; sin `v-if` de tema (o guardar con `$colorMode.unknown`) |

## Performance Traps

Escala esperada: una guía de ~64 fichas, una sola página larga, consultada por un grupo pequeño. La escala NO es el problema; la **fidelidad** sí. Igualmente:

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reconstruir el índice de búsqueda en cada tecla | Input laggea al escribir | Construir el índice una vez (computed sobre datos); filtrar en cada tecla es barato a 64 docs | Irrelevante a este tamaño, pero no raspar DOM por tecla |
| `invalidateSize()` omitido o mal ubicado | Tiles del mapa recortados/grises al cargar | Conservar el `setTimeout(...,300)` + en `load` como hoy | En el primer montaje, siempre |
| Cargar el SVG library completo siempre | Bundle algo mayor | Aceptable: hoy ya van inline; son fallbacks que rara vez se usan | No crítico a este tamaño |
| Fuentes sin self-host con red pobre | Texto en fallback hasta que cargan (FOUT) | `@nuxt/fonts` (offline) — mejora sobre hoy | Con conexión móvil pobre en Roma (caso de uso real) |

## Security Mistakes

Sitio estático, sin backend, sin auth en 1.0. La superficie es mínima; lo único relevante es el render de HTML de confianza.

| Mistake | Risk | Prevention |
|---------|------|------------|
| `v-html` sobre contenido que en v2 podría venir de terceros/usuarios | XSS | Documentar que `v-html` es **solo** para SVG/prosa del repo (confianza); notas de usuario van en `<textarea>` texto plano, nunca renderizadas con `v-html` |
| Enlaces externos sin `rel="noopener"` | Tabnabbing | Conservar `target="_blank" rel="noopener"` de hoy en `maps-link`, ruta del día, `tl-food-name` |
| Confiar en `localStorage` para datos sensibles | (n/a aquí) | Las notas son personales y locales; sin dato sensible. Mantener el `try/catch` de hoy por si `localStorage` está bloqueado |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Flash de tema en primer paint | Parpadeo molesto al abrir (caso "dark") | Script inline de `@nuxtjs/color-mode` (Pitfall 2) |
| Layout-shift del mapa al hidratar | Salto de contenido al cargar | `<ClientOnly>` con `#fallback` del tamaño del mapa |
| "Mejorar" el scrollspy y desincronizar la pill | La pastilla activa no coincide con la sección visible | Replicar `scrollY+130` exacto (Pitfall 11) |
| Búsqueda que encuentra menos que antes | Usuario no halla algo que la guía vieja sí mostraba | `haystack` con el texto completo (Pitfall 8) |
| Quitar el micro-flash de pace/light/resumen "para pulir" | Comportamiento distinto al de hoy | Replicar el comportamiento actual (el flash de un frame ya existe) |

## "Looks Done But Isn't" Checklist

- [ ] **Mapa:** monta en cliente, pero ¿pasa `nuxt generate` sin `window is not defined`? ¿el `#fallback` evita layout-shift? ¿`invalidateSize` está? ¿el banner offline usa la heurística `>3 && 0`?
- [ ] **Tema:** conmuta con el botón, pero ¿el `<head>` del HTML **generado** contiene el script inline de color-mode? ¿hay flash al recargar con `roma-theme=dark`?
- [ ] **Build estático:** corre en `localhost`, pero ¿carga **bajo `/guiaRoma/`** sin 404 de `/_nuxt/*`? ¿existe `.nojekyll` en `.output/public`? ¿favicon resuelve?
- [ ] **Búsqueda:** devuelve resultados, pero ¿el `haystack` cubre prosa+italiano+facts+caption (lo que `card.textContent` incluía)? ¿máx 8 y "Sin resultados"?
- [ ] **Ruta del día:** genera URL, pero ¿excluye restaurantes (como hoy)? ¿respeta el orden del timeline? ¿el cap a 10 usa el muestreo exacto? ¿umbral de 2 paradas?
- [ ] **Fallback de imagen:** se ve la foto, pero ¿al fallar el `src` aparece el **SVG del motif correcto**? ¿detail conserva el caption? ¿`loading="lazy"` y `alt` exactos?
- [ ] **Prosa `<MDC>`:** renderiza, pero ¿sin `<p>` extra donde el original no lo tenía? ¿enlaces `#id` disparan la navegación con scroll+pulse?
- [ ] **Persistencia:** funciona, pero ¿con las claves exactas (`roma-note-<id>`, `roma-pace`, `roma-light`, `roma-resumen`)? ¿sin warnings de hydration?
- [ ] **Offline:** ¿Leaflet y fuentes self-hosted (no CDN)? ¿imágenes degradan a SVG sin red? ¿sin PWA colada?
- [ ] **Paridad:** ¿hay suite Playwright con golden del `index.html` original que pasa en light/dark y móvil/desktop?

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Leaflet rompe el build | LOW | Mover el import a `onMounted` + sufijo `.client.vue` + `<ClientOnly>` |
| FOUC de tema | LOW | Confirmar config `dataValue:'theme'` y que el script inline está en `<head>`; quitar cualquier `v-if` por tema |
| Assets 404 bajo subpath | LOW-MEDIUM | Fijar `NUXT_APP_BASE_URL`, añadir `public/.nojekyll`, eliminar rutas absolutas hardcodeadas, re-deploy |
| CSS scopeado roto | MEDIUM | Revertir a CSS global los selectores cruzados; re-correr visual-diff |
| Búsqueda/ruta divergente | MEDIUM | Comparar contra golden/tests de URL; ampliar `haystack` / corregir filtro de paradas y muestreo |
| Fallback de imagen incorrecto | LOW | Verificar campo `motif` por ficha (zod enum) y separar modos hero/detail |
| Drift de paridad detectado tarde | HIGH si no hay golden | Capturar golden desde `main` (sigue intacto) y comparar; por eso el golden debe existir desde el inicio |

## Pitfall-to-Phase Mapping

> Nombres de fase **indicativos** (el roadmap los fija). Lo vinculante es la relación pitfall→momento.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 · Leaflet SSR / mismatch | Fase Mapa | `nuxt generate` pasa en CI; snapshot del mapa montado |
| 2 · FOUC de tema | Fase Tema (temprana) | Script inline presente en HTML generado; test de primer paint con `roma-theme=dark` |
| 3 · localStorage hydration | Fase Modos/Persistencia | Recarga con cada clave → estado restaurado; consola sin warnings |
| 4 · CSS scopeado | Fase Fundamentos/Estilos | Visual-diff Playwright light+dark, móvil+desktop |
| 5 · Subpath GitHub Pages | Fase Build/Deploy | Servir bajo subpath simulado + deploy de prueba; `.nojekyll` y cero 404 |
| 6 · Sobre-promesa offline | Transversal (Fundamentos + Mapa + Contenido) | Sin PWA en PRs; banner offline con heurística exacta; fuentes/Leaflet self-hosted |
| 7 · `<MDC>` prosa / `v-html` | Fase Contenido/Render | Visual-diff por ficha; test de enlace `#id`→navegación |
| 8 · Re-derivar búsqueda/ruta | Fase Datos + Fase Búsqueda/Ruta | Invariantes de datos; tests de URL de ruta vs golden; cobertura de `haystack` |
| 9 · Fallback de imagen | Fase Componentes de Contenido | Forzar `src` roto → SVG por motif; caption en detail |
| 10 · Scope creep | Transversal (revisión por PR) | Cada cambio mapea a un requisito Validated de PROJECT.md |
| 11 · Gap de verificación | Fase Fundamentos (golden) + Fase Release | La suite Playwright (visual + comportamiento + invariantes) pasa antes de merge a producción |

## Sources

- **Nuxt 4 — Best Practices: Hydration** (Context7 `/websites/nuxt_4_x`, https://nuxt.com/docs/4.x/guide/best-practices/hydration) — `ClientOnly` + `#fallback`; `localStorage` en `<script setup>` = mismatch; librerías de navegador con side-effects → `onMounted(async () => await import(...))`. HIGH (oráculo directo de los patrones de prevención de Pitfalls 1, 3).
- **Nuxt 4 — Upgrade guide** (Context7 `/websites/nuxt_4_x`, https://nuxt.com/docs/4.x/getting-started/upgrade) — migrar `<div>` placeholder a `<ClientOnly><template #fallback>`. HIGH (Pitfall 1 layout-shift).
- **Nuxt 4 — useRuntimeConfig / app.baseURL** (Context7 `/websites/nuxt_4_x`, https://nuxt.com/docs/4.x/api/composables/use-runtime-config) — acceso a `app.baseURL` para construir rutas. HIGH (Pitfall 5).
- **Nuxt — Deploy to GitHub Pages** (https://nuxt.com/deploy/github-pages) — `NUXT_APP_BASE_URL=/<repository>/` para repos sin dominio propio; preset `github_pages`; artefacto `.output/public`. HIGH (Pitfall 5).
- **Issues de `nuxt/nuxt` sobre subpath/baseURL:** [#31551](https://github.com/nuxt/nuxt/issues/31551), [#22225](https://github.com/nuxt/nuxt/issues/22225), [#15091](https://github.com/nuxt/nuxt/issues/15091), [#12892](https://github.com/nuxt/nuxt/issues/12892) — assets referencian `/_nuxt/` y 404 bajo subpath; doble-anidado; MIME errors. MEDIUM (confirman el modo de fallo de Pitfall 5).
- **`.nojekyll` con `generate` vs preset:** `nuxt/nuxt` [#21232](https://github.com/nuxt/nuxt/issues/21232), [#12480](https://github.com/nuxt/nuxt/issues/12480). MEDIUM.
- **`@nuxtjs/color-mode`** — repo nuxt-modules/color-mode + docs: script inline anti-flash en `<head>`, opción `dataValue`, caveat `preference:'system'` + render condicional → flash (guardar con `$colorMode.unknown`); commit [`30b173e`](https://github.com/nuxt-modules/color-mode/commit/30b173e4ffebcd452ecc076e3660290907af196f) "handle data attribute in script as well" e issue [#153](https://github.com/nuxt-community/color-mode-module/issues/153). HIGH (Pitfall 2).
- **Nuxt Content — MDC / ContentRenderer / Slot unwrap** (Context7 `/websites/content_nuxt`, https://content.nuxt.com/docs/components/slot · /components/content-renderer · /files/markdown) — `<MDC>` envuelve en `<p>` (Prose); `mdc-unwrap="p"` / prop `unwrap` para quitar el wrapper. HIGH (Pitfall 7).
- **Leaflet en Nuxt — "window is not defined":** [forum.vuejs.org/t/112209](https://forum.vuejs.org/t/window-not-defined-error-on-my-nuxt-js-app-using-leaflet/112209), [schlunsen/nuxt-leaflet#7](https://github.com/schlunsen/nuxt-leaflet/issues/7) — confirman el fallo y la solución client-only/no-ssr. MEDIUM (Pitfall 1).
- **Lectura directa de `/home/vcompanyb/guiaRoma/index.html`** (fuente primaria — oráculo de paridad): theme init post-paint (6252-6266); `places` (6269-6314); Leaflet inline + `divIcon` + banner offline `>3 && 0` (6316-6379); navegación + `bindCardLinks` (6381-6429); búsqueda DOM-scrape `card.textContent`, ≥2, máx 8 (6431-6469); notas `roma-note-` (6471-6483); scrollspy `+130` con comentario (6485-6501); pace/light/resumen (6504-6577); ruta del día `.maps-link`/`capStops`/`buildDirUrl` (6579-6646); `loadSvgFallback`/`loadSvgFallbackDetail` + `CARD_TO_MOTIF` (2211-2252); fuentes Google CDN (línea 13); `scroll-padding-top:124px` (902); `[data-theme=dark] .leaflet-tile` (1208); markup hero `onerror`/detail/`.maps-link`/`.tl-food-name`/`notes-textarea` (2459-2543). HIGH.

---
*Pitfalls research for: re-plataformado guiaRoma → Nuxt 4 (estático + offline + data-driven, paridad 100%)*
*Researched: 2026-06-18*
