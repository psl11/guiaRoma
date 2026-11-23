# Feature Research — Re-implementación en Nuxt 4 / Vue 3 (paridad 1:1)

**Domain:** Re-plataformado de una guía de viaje interactiva (un `index.html` monolítico → Nuxt 4 + Vue 3, salida estática).
**Researched:** 2026-06-18
**Confidence:** HIGH (Context7 `/websites/nuxt_4_x`, docs oficiales de `@nuxtjs/color-mode` v4.0.1, fuentes verificadas para Leaflet-en-Nuxt y hydration).

> **Naturaleza de esta investigación.** No se inventan features: el listón está fijado por el `index.html` actual (JS de app en líneas ~6251-6663; array `places` en 6269-6314; `loadSvgFallback*` en 2215-2252). Para CADA una de las 10 features existentes, este documento describe la implementación idiomática en Nuxt 4 / Vue 3, su complejidad, el riesgo de paridad y la descomposición en composables/componentes que implica (esto último alimenta la investigación de Arquitectura).

---

## Contexto técnico que condiciona TODO (leer primero)

Tres hechos del proyecto cambian cómo se evalúa cada feature:

1. **Salida estática (`nuxt generate`), sin servidor en 1.0.** No hay request-time SSR en producción: el HTML se pre-renderiza UNA vez en build. Consecuencia: cualquier estado que dependa de `localStorage` o de `prefers-color-scheme` **no puede conocerse en build** → o se resuelve con un script inline en `<head>` (lo que hace `@nuxtjs/color-mode`), o se hidrata en `onMounted` y se asume un parpadeo de un frame. El cookie (`useCookie`), que es la recomendación genérica de Nuxt para persistir sin parpadeo, **no ayuda aquí** porque en un sitio estático no hay servidor que lea la cookie y pinte el HTML correcto por petición; el primer paint es siempre el snapshot de build. Por eso: **tema → `@nuxtjs/color-mode` (script inline); resto de toggles → `localStorage` + `onMounted`.**

2. **Hydration mismatch es el enemigo principal.** Vue compara el DOM del servidor (build) con el primer render del cliente; si difieren, error de hidratación y posible "salto" visual. Browser APIs (`window`, `document`, `localStorage`, `matchMedia`, Leaflet) **no existen en build** → su uso debe diferirse a `onMounted` / `import.meta.client` / `<ClientOnly>`.

3. **El código actual está lleno de DOM-scraping.** `buildSearchIndex()` lee `.card textContent`, `buildDayRoutes()` lee `a.maps-link` y `link.closest('article.card')`, `bindCardLinks()` recorre todos los `<a href="#">`, los popups del mapa llaman `navigateToCard` por `onclick` inline. **Todo eso es anti-patrón en Vue**: el dato ya existe (o existirá, tras extraer el contenido a datos tipados); se re-deriva de los datos, no del DOM renderizado.

---

## Resumen ejecutivo: categorización de las 10 features

| # | Feature | Categoría | Complejidad | Riesgo de paridad |
|---|---------|-----------|-------------|-------------------|
| 1 | Theme toggle (light/dark, `data-theme`, `prefers-color-scheme`) | **Needs-care** (anti-flash en estático) | Trivial con módulo | Alto si se hace a mano; bajo con `@nuxtjs/color-mode` |
| 2 | Mapa Leaflet (marcadores `divIcon`, popups, fitBounds, offline) | **Needs-care** (client-only obligatorio) | Careful | Medio-alto |
| 3 | Búsqueda en cliente | **Anti-pattern-to-avoid** (re-derivar de datos) | Moderate | Medio (parpadeo de índice) |
| 4 | Notas por ficha (`localStorage`) | **Needs-care** (persistencia client-only) | Trivial | Bajo |
| 5 | Navegación: scroll-to-card + pila "volver" + scrollspy | **Needs-care** (refs/scroll client-only) | Careful | Medio-alto |
| 6 | Selector de ritmo (`data-pace`) | **Trivial-in-Vue** (estado reactivo) | Trivial | Bajo |
| 7 | "Caminar menos" (light-mode, fuerza pace=slow) | **Trivial-in-Vue** (estado + efecto) | Trivial | Bajo |
| 8 | "Modo resumen" (`modo-resumen`) | **Trivial-in-Vue** (estado reactivo) | Trivial | Bajo |
| 9 | "Ruta del día" (URL Google Maps direcciones) | **Anti-pattern-to-avoid** (re-derivar de datos) | Moderate | Medio |
| 10 | Hero image con fallback SVG (`onerror`) | **Needs-care** (gestión de error client) | Trivial-Moderate | Medio |

**Recuento:** 3 Trivial-in-Vue · 5 Needs-care · 2 Anti-pattern-to-avoid (que pasan a "re-derivar de datos").

---

## Detalle por feature

### 1. Theme toggle — **Needs-care**

**Hoy:** `setTheme()` pone `data-theme` en `<html>`, persiste en `localStorage('roma-theme')`; al cargar, si hay guardado lo usa, si no consulta `matchMedia('(prefers-color-scheme: dark)')`. Botón `.theme-btn` con `onclick="toggleTheme()"`; CSS pinta luna/sol según `[data-theme]`.

**Idiomático en Nuxt 4:** **NO reimplementar a mano.** Usar **`@nuxtjs/color-mode` v4.0.1** (compatible Nuxt 3+/4, publicado 2026-06):
- Configurar para escribir `data-theme` en `<html>` en vez de clase: `colorMode: { classSuffix: '', dataValue: 'theme', preference: 'system', fallback: 'light', storageKey: 'roma-theme' }`. La opción `dataValue: 'theme'` hace que el módulo escriba `data-theme="dark"` / `data-theme="light"` exactamente como hoy.
- `preference: 'system'` + `fallback` replica el "respeta `prefers-color-scheme` si no hay guardado".
- El módulo **inyecta un script inline en `<head>`** que lee storage/`matchMedia` y aplica el atributo ANTES del primer paint → **resuelve el parpadeo de tema en estático**, que es justo lo que el `nuxt generate` no puede resolver de otro modo.
- El botón usa `const colorMode = useColorMode()` y alterna `colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'`. El CSS existente `[data-theme="..."]` se conserva intacto (cero cambios de estilos).

**Composable:** preferible el del módulo (`useColorMode()`); envolver en un `useTheme()` propio solo si se quiere fijar la API. **No** hace falta `useState` propio.

**SSR/hydration:** el riesgo (flash dark→light) lo neutraliza el script inline del módulo. Si en algún sitio se renderiza condicionalmente según el tema (p. ej. el icono luna/sol vía `v-if`), hay que guardar con `colorMode.unknown` o, mejor, **resolverlo solo por CSS** (como hoy: `[data-theme] .moon/.sun { display }`), evitando todo `v-if` dependiente del tema → cero mismatch.

**Riesgo de paridad:** **alto si se reimplementa a mano** (parpadeo casi seguro en estático). **Bajo con el módulo.** Recomendación firme: módulo, `dataValue: 'theme'`, theming por CSS, sin `v-if` de tema.

---

### 2. Mapa Leaflet — **Needs-care (client-only obligatorio)**

**Hoy:** `L.map('leaflet-map')`, `L.tileLayer(OSM)`, por cada `places[]` un `L.divIcon` con HTML inline coloreado por `type` (card `#8b3a3a` / guided `#a07c4a` / concert `#5a7a3a`) mostrando el nº romano `p.n`; `bindPopup` con `<a onclick="navigateToCard(...)">Abrir ficha →`; `fitBounds(bounds.pad(0.1))`; `invalidateSize()` a los 300 ms y en `window load`; contador `tileerror`/`tileload` que muestra `#map-offline-banner` si `tilesErrored > 3 && tilesLoaded === 0`.

**Idiomático en Nuxt 4:** Leaflet toca `window`/`document` **al importarse** → jamás debe entrar en el bundle de servidor.
- **Patrón recomendado: componente `components/TripMap.client.vue`** (sufijo `.client` ⇒ Nuxt no lo renderiza ni ejecuta su `<script>` en build). Dentro, **importar Leaflet dinámicamente en `onMounted`**: `const L = await import('leaflet')` (o plugin client-only). NUNCA `import 'leaflet'` a nivel de módulo.
- Envolver su uso en `<ClientOnly>` con `#fallback` que pinte un placeholder del mismo tamaño que `#leaflet-map` (CSS `height: 420px` en móvil) → evita salto de layout y mismatch.
- Reconstruir los `divIcon` con el MISMO HTML/estilos inline (es la paridad visual del marcador). Mapear color por `type` con un objeto, no con cadenas de `if`.
- Los popups **no deben usar `onclick` inline a una función global.** Dos opciones idiomáticas: (a) generar el popup con `<a href="#id">` y dejar que el sistema de navegación (feature 5) intercepte; o (b) `marker.on('popupopen')` y enlazar el click vía JS del componente que llama al composable de navegación. Recomendado (a) por simplicidad y porque sobrevive a re-render.
- `fitBounds`, `invalidateSize()` (timeout + en mount): se conservan dentro de `onMounted`. El `invalidateSize` sigue siendo necesario porque el contenedor puede medir 0 en el primer tick.
- Leaflet CSS/JS hoy van **incrustados** para offline. En Nuxt: instalar `leaflet` como dependencia y que el bundler lo empaquete (sigue siendo local, sin CDN) → mantiene el offline. Los **tiles** OSM siguen siendo remotos (igual que hoy); el banner offline se conserva.
- Banner offline: estado reactivo `const offline = ref(false)`; en los handlers `tileerror`/`tileload` aplicar la MISMA heurística (`>3` errores y `0` cargas) y `offline.value = true`; el `<div class="map-offline-banner" :class="{ show: offline }">` reproduce el CSS actual (`.show { display:block }`).

**Composable/componentes:** `TripMap.client.vue` (orquesta), recibe `places` por props (datos tipados). Un `useMapMarkers(places)` puro (sin Leaflet) puede pre-calcular color/popup-data y dejar el componente fino.

**SSR/hydration:** **todo el mapa es client-only.** El `#fallback` cubre el hueco en el HTML estático. Sin `ClientOnly`/`.client`, build peta con `window is not defined`.

**Riesgo de paridad:** **medio-alto.** Puntos frágiles: (1) los `divIcon` deben replicar el HTML inline exacto; (2) `invalidateSize` mal ubicado ⇒ tiles a medio pintar; (3) la heurística del banner offline (`>3 && 0`) es específica y fácil de "mejorar" rompiendo el comportamiento; (4) los popups que enlazan a fichas deben seguir navegando con scroll suave + pulse (no romper la integración con la feature 5).

---

### 3. Búsqueda en cliente — **Anti-pattern-to-avoid → re-derivar de datos**

**Hoy:** `buildSearchIndex()` recorre `document.querySelectorAll('.card')` y **raspa** `id`, `h3.textContent`, `.card-italian.textContent`, `card.textContent.toLowerCase()`, cruzando con `places` para el día. El input filtra por `content.includes(q)` (q ≥ 2 chars), pinta hasta 8 resultados como `innerHTML`, y al click navega con `navigateToCard`. Cierra el dropdown al click fuera de `.search-wrap`.

**Por qué es anti-patrón en Vue:** raspar el DOM renderizado para construir un índice es exactamente lo que NO se debe hacer cuando el contenido vive en datos. Tras la migración el contenido de cada ficha será **dato tipado** (Nuxt Content v3 o JSON), así que el índice se **deriva del dato fuente**, no del HTML pintado.

**Idiomático en Nuxt 4:**
- `useSearch(trip)` (composable): construye un índice `computed` a partir de los datos del viaje — `{ id, title, italian, day, haystack }` donde `haystack` concatena los campos buscables en minúsculas (equivale al `card.textContent.toLowerCase()` actual, pero desde el dato).
- Estado: `const query = ref('')`; `const results = computed(() => query.value.trim().length < 2 ? [] : index.filter(c => c.haystack.includes(q)).slice(0, 8))`. Misma semántica (≥2 chars, `includes`, máx 8).
- Render del dropdown con `v-for` (no `innerHTML`); abrir/cerrar con un `ref` booleano; cerrar al click-fuera con `@click` en overlay o un `onClickOutside` (VueUse) o un listener en `onMounted`.
- Click en resultado ⇒ llama al composable de navegación (feature 5), limpia `query`.

**SSR/hydration:** el índice es **puro dato**, se puede construir en build sin tocar el DOM → **sin parpadeo del índice** (mejora respecto a hoy, que necesitaba que las fichas estuvieran en el DOM antes de `buildSearchIndex`). El dropdown abierto/cerrado es interacción cliente; su estado inicial cerrado coincide server/cliente → sin mismatch. El listener de click-fuera va en `onMounted`.

**Riesgo de paridad:** **medio.** Hay que asegurar que el `haystack` cubra el MISMO texto que hoy entraba en `card.textContent` (prosa de "Qué es"/"Historia"/"Anécdotas"/"En qué fijarse", `card-italian`, etc.), o la búsqueda encontrará menos cosas que ahora. El "Sin resultados" y el límite 8 deben mantenerse.

---

### 4. Notas por ficha (localStorage) — **Needs-care**

**Hoy:** `setupNotes()` recorre `.notes-textarea`, clave `'roma-note-' + dataset.noteKey`; carga el valor guardado y persiste en cada `input`. Markup: `<textarea class="notes-textarea" data-note-key="galleria-sciarra">` dentro de `<article class="card">`.

**Idiomático en Nuxt 4:**
- `useNote(key)` (composable): `const text = ref('')`; en `onMounted` `text.value = localStorage.getItem('roma-note-'+key) ?? ''`; `watch(text, v => localStorage.setItem('roma-note-'+key, v))`. (Equivalente a VueUse `useStorage('roma-note-'+key, '')`, que ya hace el SSR-guard internamente.)
- En el componente de ficha: `<textarea v-model="text">`. La clave sale del `id`/`noteKey` del dato de la ficha (ya tipado), no de un `data-` raspado.

**SSR/hydration:** `localStorage` no existe en build. **No** inicializar el `ref` leyendo `localStorage` en el `<script setup>` síncrono (eso corre en build) → leer en `onMounted`. El `<textarea>` se renderiza vacío en el HTML estático y se rellena al montar; como un `<textarea>` vacío es válido en ambos lados, no hay mismatch (su contenido no es texto pre-renderizado distinto). VueUse `useStorage` encapsula esto correctamente.

**Riesgo de paridad:** **bajo.** Única sutileza: conservar el **prefijo de clave exacto** `roma-note-<id>` para que las notas ya escritas por usuarios actuales sigan apareciendo tras migrar (continuidad de datos en el mismo dominio/navegador).

---

### 5. Navegación: scroll-to-card + pila "volver" + scrollspy — **Needs-care**

**Hoy:** `navStack[]` guarda `window.scrollY`; `navigateToCard(id)` hace `push(scrollY)`, `el.scrollIntoView({behavior:'smooth'})`, añade `.highlight` 2500 ms, y muestra `#back-btn`; `goBack()` hace `pop()` y `window.scrollTo`. `bindCardLinks()` **recorre todos los `<a href="#cardid">`** y les engancha el handler. Scrollspy: `updateActivePill()` en `scroll` compara `window.scrollY + 130` contra `section.offsetTop` y marca `.nav-pill.active` (el `+130` compensa el `scroll-padding-top` de 124px de la cabecera fija — **detalle de paridad crítico**).

**Idiomático en Nuxt 4:**
- `useCardNavigation()` (composable): `const navStack = ref<number[]>([])`; `const canGoBack = computed(() => navStack.value.length > 0)`; funciones `navigateToCard(id)` y `goBack()`. Todo el acceso a `window`/`document`/`scrollIntoView` va protegido por `import.meta.client` o ejecutado desde handlers de eventos (que solo corren en cliente).
- El "highlight pulse" deja de ser `classList.add('highlight')` global: la ficha activa se marca con estado reactivo (`activeCardId`) y un `:class="{ highlight: isActive }"`; un `setTimeout(2500)` lo limpia. Mantener la MISMA animación CSS `.highlight` (la regla CSS no cambia).
- **`bindCardLinks` desaparece.** En Vue, los enlaces a fichas son componentes/`<a>` con `@click.prevent="navigateToCard(id)"` declarado en la plantilla — no se "descubren" recorriendo el DOM. Esto cubre los enlaces del timeline (`a.tl-title href="#..."`), los popups del mapa y los resultados de búsqueda, todos llamando al mismo composable.
- Botón volver: `<button class="back-btn" :class="{ show: canGoBack }" @click="goBack">` reproduciendo el CSS `.back-btn.show`.
- **Scrollspy:** dos caminos. (a) Réplica literal: listener `scroll` (passive) en `onMounted` con la MISMA fórmula `scrollY + 130 ≥ section.offsetTop` y un `activeSection` reactivo que marca la pill. (b) Idiomático: `IntersectionObserver` (VueUse `useIntersectionObserver`). **Recomendado (a) para 1.0** porque el `+130` y el criterio "última sección cuyo top ya pasó" definen exactamente qué pill se ilumina; un `IntersectionObserver` con otro umbral cambiaría sutilmente cuándo conmuta → riesgo de paridad. Migrar a (b) en v2 si se quiere.

**SSR/hydration:** scroll y `offsetTop` son client-only (`onMounted`). El estado inicial (`navStack` vacío, ninguna pill activa hasta el primer `scroll`) coincide server/cliente. La pila NO debe persistir (es de sesión de navegación, igual que hoy).

**Riesgo de paridad:** **medio-alto.** Frágil: (1) el offset `+130` del scrollspy — replicar **exacto**, está comentado en el código original precisamente porque ya costó cuadrarlo; (2) `scrollIntoView({behavior:'smooth', block:'start'})` vs el `scroll-padding-top` CSS — mantener ambos; (3) la duración 2500 ms del pulse; (4) que TODOS los orígenes de navegación (timeline, mapa, búsqueda) pasen por el mismo composable para que la pila "volver" se comporte igual desde cualquiera.

---

### 6. Selector de ritmo (`data-pace`) — **Trivial-in-Vue**

**Hoy:** `setPace(pace)` persiste `roma-pace`, marca `.pace-btn.active`, y recorre `.tl-item[data-pace], .tl-transport[data-pace]` aplicando `.tl-hidden` según la matriz: `optimistic`→todo visible; `neutral`→oculta `slow-only`; `slow`→oculta `slow-only` y `medium`; items sin `data-pace` o `all` siempre visibles.

**Idiomático en Nuxt 4:** caso de libro de reactividad.
- `usePace()` (composable, compartido): `const pace = useState<'optimistic'|'neutral'|'slow'>('pace', () => 'optimistic')`. Una función pura `isVisible(itemPace, pace)` codifica la matriz.
- Cada item del timeline: `<div class="tl-item" :class="{ 'tl-hidden': !isVisible(item.pace, pace) }">`. El `data-pace` deja de gobernar la lógica; el `item.pace` (dato tipado) lo hace. Se puede seguir emitiendo `:data-pace` por paridad de DOM si algún CSS lo usa (no parece, pero es barato conservarlo).
- Botones: `<button :class="{ active: pace === 'optimistic' }" @click="pace = 'optimistic'">`.

**Persistencia:** `localStorage('roma-pace')` vía `watch(pace, ...)` + lectura en `onMounted`. En estático no se puede pre-pintar el ritmo guardado sin parpadeo (ver Contexto §1); aceptar el repintado de un frame (el `index.html` actual también aplica el ritmo guardado en `init()`, post-paint, así que **la paridad de comportamiento se mantiene**).

**SSR/hydration:** default `'optimistic'` coincide con el estado inicial del HTML actual (botón optimistic ya tiene `.active` en el markup) → server y cliente concuerdan; tras `onMounted` se restaura el guardado. Sin mismatch si el default coincide con lo pre-renderizado.

**Riesgo de paridad:** **bajo.** Solo respetar la matriz exacta (la regla `slow-only` solo visible en optimistic es contraintuitiva — está documentada en el código; no "simplificarla").

---

### 7. "Caminar menos" (light-mode) — **Trivial-in-Vue**

**Hoy:** `setLightMode(on)` togglea `body.light-mode`, pone `aria-pressed`, persiste `roma-light`, y **al activar fuerza `setPace('slow')`**. CSS oculta cosas y reestiliza el toggle bajo `body.light-mode`.

**Idiomático en Nuxt 4:**
- `useLightMode()` (o parte de un `useTripModes()`): `const lightMode = useState('lightMode', () => false)`. La clase `light-mode` se aplica al `<body>` con `useHead({ bodyAttrs: { class: computed(() => lightMode.value ? 'light-mode' : '') } })` (idiomático para clases en `<body>` en Nuxt). `aria-pressed` se enlaza en el botón.
- **El efecto colateral (forzar pace=slow al activar)** se expresa con un `watch(lightMode, on => { if (on) pace.value = 'slow' })`, reutilizando `usePace()`. Misma semántica que hoy.

**Persistencia/SSR:** igual que el ritmo: `localStorage('roma-light')`, restaurar en `onMounted`, default `false` = HTML pre-renderizado. Como `light-mode` oculta secciones con `display:none !important`, si se restaurara tras el paint habría un brevísimo flash de contenido; **es exactamente el comportamiento actual** (`restoreLightMode()` corre en `init()` post-carga) → paridad mantenida. Si molestara, sería el único candidato a script inline adicional, pero NO es necesario para paridad.

**Riesgo de paridad:** **bajo.** Conservar: el acoplamiento con pace=slow y el `aria-pressed` (accesibilidad, está en el listón).

---

### 8. "Modo resumen" (`modo-resumen`) — **Trivial-in-Vue**

**Hoy:** `setResumen(on)` togglea `body.modo-resumen`, `aria-pressed`, persiste `roma-resumen`. CSS oculta `.day-stats`, `.day-subtitle`, `.tl-meta`, `.tl-transport`, `.cards-list`, etc. con `display:none !important` → deja una vista índice de hora+lugar.

**Idiomático en Nuxt 4:** idéntico patrón que la 7, sin el efecto colateral.
- `const resumen = useState('resumen', () => false)`; clase en `<body>` vía `useHead({ bodyAttrs })`; `aria-pressed` en el botón; persistencia `localStorage('roma-resumen')` + `onMounted`.
- **Toda la lógica del "modo resumen" es CSS** (el JS solo togglea la clase). Por tanto la migración es trivial: se conserva el bloque CSS `body.modo-resumen ... { display:none }` tal cual y solo cambia cómo se pone la clase. Cero riesgo de comportamiento.

**SSR/hydration:** default `false`; restaurar en `onMounted`. Misma consideración de "flash de un frame si estaba activo", idéntica al comportamiento actual.

**Riesgo de paridad:** **bajo.** Mantener el set exacto de selectores ocultos (vive en CSS; no tocarlo).

> Nota de arquitectura: features 6+7+8 comparten patrón (toggle + clase/estado + persistencia localStorage). Conviene un único **`useTripModes()`** que exponga `pace`, `lightMode`, `resumen` y centralice la persistencia y el `watch` del acoplamiento light→slow. Esto alimenta la investigación de Arquitectura.

---

### 9. "Ruta del día" (URL Google Maps direcciones) — **Anti-pattern-to-avoid → re-derivar de datos**

**Hoy:** `buildDayRoutes()` recorre `section .day-stats`, encuentra su `<section>`, **raspa** `section.querySelectorAll('a.maps-link')`, y para cada link saca el punto con `pointFor(link)`: primero `link.closest('article.card[id]')` → coord de `coordById` (de `places`), si no `new URL(link.href).searchParams.get('query')`. Cap a `MAX_ROUTE_STOPS=10` conservando primera+última y muestreando el medio; construye `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=...&destination=...&waypoints=a|b|c`. Inyecta un `<a class="day-route-btn">` en `.day-stats`. Texto del botón cambia si hay más de 10 paradas. **Solo** las fichas-monumento tienen `.maps-link` (los restaurantes usan `.tl-food-name`), así que esos quedan fuera "por accidente del DOM".

**Por qué es anti-patrón en Vue:** depende del orden de aparición de `a.maps-link` en el DOM y de `closest('article.card')` para resolver coordenadas — es lógica de negocio escondida en la estructura HTML. El criterio "qué paradas entran en la ruta" (monumentos sí, restaurantes no) está implícito en qué elementos tienen la clase `.maps-link`, no declarado.

**Idiomático en Nuxt 4:**
- `useDayRoute(dayStops)` (composable, **puro y testeable**, sin DOM): recibe la lista ordenada de paradas del día **desde los datos tipados** (cada parada con `{ id, lat, lng, query?, type }`). Funciones puras portadas casi 1:1: `pointFor(stop)` (coord `lat,lng` si existe, si no `query`), `capStops(points, 10)` (mismo muestreo: primera, última, medio uniforme), `buildDirUrl(points)` (misma plantilla `dir/?api=1&travelmode=walking`). Devuelve `{ url, count, total }` como `computed`.
- El "qué paradas cuentan" pasa a ser **explícito en el dato/selector** (p. ej. `stops.filter(s => s.type === 'card')`) en vez de "los que tengan `.maps-link`". Esto **debe replicar el conjunto actual** (monumentos sí; restaurantes y eventos guiados/concierto, según hoy, quedan fuera salvo que tengan `.maps-link`).
- El botón es `<a class="day-route-btn" :href="url" target="_blank" rel="noopener">` con el MISMO texto condicional (`Ver ruta del día (N paradas)` / `(10 de N paradas)`).

**SSR/hydration:** al ser dato puro, la URL se puede calcular en build → el `<a>` puede pre-renderizarse (no necesita cliente). Mejora sobre hoy (que lo construía en `init()` post-DOM). Sin mismatch.

**Riesgo de paridad:** **medio.** Trampas: (1) **el orden** de las paradas debe ser el del timeline del día (primera→última), no el orden del array `places`; hay que garantizar que el dato preserve ese orden por día; (2) reproducir EXACTO qué paradas entran (el filtro implícito de `.maps-link`) — si se incluyen restaurantes que antes no entraban, la ruta cambia; (3) el algoritmo de muestreo `capStops` (la fórmula `Math.round(i*(middle.length-1)/(slots-1))`) debe portarse literal; (4) el umbral mínimo de 2 paradas para mostrar el botón.

---

### 10. Hero image con fallback SVG (`onerror`) — **Needs-care**

**Hoy:** `<img onerror="loadSvgFallback(this, 'galleria-sciarra')">`. `loadSvgFallback` busca `CARD_TO_MOTIF[cardId]` → `SVG_MOTIFS[motif]` y **reemplaza el `innerHTML` del contenedor** por el SVG inline; si no hay motivo, oculta el contenedor. Variante `loadSvgFallbackDetail` reemplaza solo el `<img>` por el SVG (conservando el caption), ajustando estilos inline. Hay un mapa `CARD_TO_MOTIF` (37 entradas) y una librería `SVG_MOTIFS`.

**Idiomático en Nuxt 4:**
- Componente `<CardHero :src :alt :motif>` (o `<DetailPhoto>`): `const failed = ref(false)`; `<img v-if="!failed" :src @error="failed = true">`; `<component :is="..." v-else>` que pinta el SVG del motivo. El `onerror` inline → `@error` declarativo (mismo evento del navegador, dispara en 404/error de red).
- `motif` viene del **dato de la ficha** (el `CARD_TO_MOTIF` actual se vuelve un campo `motif` en el dato tipado de cada lugar) → desaparece el diccionario `id→motif` separado.
- Los SVG (`SVG_MOTIFS`) pasan a ser componentes Vue o un registro de strings; render con `v-html` (contenido propio y de confianza, no externo) reproduciendo la sustitución actual. Dos variantes: hero (sustituye el contenedor) vs detail (sustituye solo el img, conserva caption) → dos props/modos o dos componentes.

**SSR/hydration — el punto delicado:** el evento `error` de `<img>` ocurre **solo en cliente** (en build no se cargan imágenes). El HTML estático pre-renderiza siempre el `<img>` "optimista". Cuando una imagen falla en el navegador, `failed` pasa a `true` y se intercambia por el SVG. Esto es **un cambio post-hidratación legítimo**, no un mismatch (el DOM inicial cliente == server: ambos pintan el `<img>`; el cambio viene después por el evento). **Trampa a evitar:** NO intentar inicializar `failed` en build (no se sabe si la imagen va a fallar). Y si se usa `<NuxtImg>`, verificar que su manejo de errores no interfiera; para paridad estricta, un `<img>` nativo con `@error` es lo más fiel (incluido `loading="lazy"`, que hoy está en todos los hero/detail).

**Riesgo de paridad:** **medio.** Reproducir: (1) la distinción hero (sustituye contenedor / oculta si no hay motivo) vs detail (sustituye img, conserva caption, estilos `width:100%;height:auto;border-radius:4px;display:block`); (2) que el mapa `motif` por ficha sea idéntico (37 entradas) o algunas fichas perderán su fallback; (3) `loading="lazy"` en todas las imágenes; (4) `alt` exactos (accesibilidad, en el listón). Este fallback ES parte del requisito offline (imágenes de terceros que pueden 404), así que su fidelidad importa de verdad.

---

## Dependencias entre features (para ordenar fases)

```
DATOS TIPADOS DEL VIAJE (places + contenido de fichas + timeline ordenado por día)
    ├──requiere──> Búsqueda (3)        [índice derivado del dato]
    ├──requiere──> Ruta del día (9)    [paradas ordenadas + coords + motivo de inclusión]
    ├──requiere──> Mapa (2)            [places con lat/lng/type/n]
    ├──requiere──> Selector de ritmo (6) [item.pace en el dato del timeline]
    └──requiere──> Fallback SVG (10)   [motif por ficha]

useCardNavigation (5)  <──usado por──  Mapa popups (2), Búsqueda (3), enlaces timeline
                                       [los 3 orígenes deben pasar por el MISMO composable]

usePace (6)  <──acoplado──  useLightMode (7)   [light-mode fuerza pace=slow]

@nuxtjs/color-mode  ──independiente──> Theme (1)   [no depende de datos]
```

**Notas de dependencia:**
- **Datos tipados primero.** 5 de 10 features re-derivan de los datos; sin el esquema de datos estable, búsqueda/ruta/mapa/ritmo/fallback no se pueden construir bien. El orden del timeline por día y el `motif`/`pace` por item son campos que el esquema DEBE incluir.
- **Navegación es transversal.** Mapa, búsqueda y timeline la consumen; conviene tenerla (composable `useCardNavigation`) antes que los tres consumidores, o se duplicará lógica de scroll/pila.
- **Modos comparten infraestructura.** 6/7/8 → un `useTripModes()` común; 7 depende de 6.

---

## Descomposición en composables/componentes (alimenta Arquitectura)

| Composable / Componente | Responsabilidad | Client-only | Estado |
|-------------------------|-----------------|-------------|--------|
| `useColorMode()` (del módulo) | Tema light/dark, `data-theme`, anti-flash | No (script inline lo cubre) | Módulo |
| `useTripModes()` → `usePace` / `useLightMode` / `useResumen` | Ritmo + caminar-menos + resumen + persistencia + acoplamiento light→slow | Persistencia en `onMounted` | `useState` |
| `useSearch(trip)` | Índice derivado de datos + filtrado | No (dato puro) | `ref`/`computed` |
| `useCardNavigation()` | scroll-to-card, pulse, pila volver, scrollspy | Sí (`onMounted`) | `ref` (sesión) |
| `useNote(key)` (o VueUse `useStorage`) | Persistir nota por ficha | Lectura en `onMounted` | `localStorage` |
| `useDayRoute(stops)` | URL Google Maps direcciones (puro, testeable) | No (dato puro) | `computed` |
| `TripMap.client.vue` | Leaflet, marcadores, popups, fitBounds, banner offline | **Sí (`.client` + `ClientOnly`)** | local + `ref` offline |
| `CardHero` / `DetailPhoto` | Imagen con fallback SVG por motivo | Error solo en cliente | `ref(failed)` |

---

## MVP / orden recomendado (es migración, no MVP de producto)

Todo es "launch with" (paridad 1:1). Orden sugerido por dependencia y riesgo:

1. **Esquema de datos tipado del viaje** (places + fichas + timeline ordenado, con `pace`, `motif`, `type`, coords). Habilita 5 features.
2. **Componentes de contenido + modos triviales** (6, 7, 8) — bajo riesgo, validan el render data-driven y el patrón de toggles.
3. **`useCardNavigation` (5)** — transversal; necesario antes de mapa/búsqueda.
4. **Búsqueda (3)** y **Ruta del día (9)** — re-derivación de datos; riesgo medio, testeables en aislamiento.
5. **Tema (1)** — `@nuxtjs/color-mode`; independiente, hacerlo pronto para fijar el anti-flash en estático.
6. **Mapa Leaflet (2)** y **Fallback de imagen (10)** — los más sensibles a SSR/cliente; dejarlos cuando el patrón client-only esté asentado.

---

## Hazards de SSR/hydration — tabla de referencia rápida

| Feature | API de navegador implicada | Dónde debe vivir | Síntoma si se hace mal |
|---------|----------------------------|------------------|------------------------|
| 1 Tema | `localStorage`, `matchMedia` | Script inline del módulo | Flash dark↔light en primer paint |
| 2 Mapa | `window`, `document` (Leaflet) | `.client.vue` + `ClientOnly` + import dinámico | `window is not defined` en build; layout shift |
| 3 Búsqueda | (ninguna; dato puro) | Composable normal | — (mejora: sin esperar al DOM) |
| 4 Notas | `localStorage` | `onMounted` / `useStorage` | Mismatch si se lee storage en `<script setup>` síncrono |
| 5 Navegación | `window.scroll*`, `offsetTop`, `scrollIntoView` | `onMounted` + handlers | Errores en build; scrollspy desfasado si cambia el `+130` |
| 6 Ritmo | `localStorage` | `onMounted` (persistencia) | Mismatch si el default ≠ HTML pre-renderizado |
| 7 Light-mode | `localStorage` | `onMounted` | Flash de un frame (igual que hoy; aceptable) |
| 8 Resumen | `localStorage` | `onMounted` | Flash de un frame (igual que hoy; aceptable) |
| 9 Ruta del día | (ninguna; dato puro) | Composable normal | — (mejora: pre-renderizable) |
| 10 Fallback img | evento `error` de `<img>` | Cliente (post-hidratación) | Intentar inicializar `failed` en build (imposible saberlo) |

---

## Sources

- Context7 `/websites/nuxt_4_x` — `useState` (SSR-friendly shared state), `<ClientOnly>` + `#fallback`, `useTemplateRef`, guía de hydration. (HIGH)
- `@nuxtjs/color-mode` — repo oficial nuxt-modules/color-mode: opciones `preference`/`fallback`/`classSuffix`/`dataValue`/`storageKey`, script inline anti-flash, v4.0.1 (2026-06), Nuxt 3+/4. https://github.com/nuxt-modules/color-mode · https://color-mode.nuxtjs.org/ (HIGH)
- Nuxt docs — Best Practices: Hydration (Nuxt 4). https://nuxt.com/docs/4.x/guide/best-practices/hydration (HIGH)
- Leaflet en Nuxt/SSR — patrón client-only / import dinámico (no importar a nivel de módulo): deltener.com "Common Problems With The Nuxt Client-Only Component"; forum.vuejs.org "window not defined ... leaflet"; nuxt-leaflet issue #7. (MEDIUM, múltiples fuentes concordantes)
- localStorage SSR-safe en Nuxt — nuxt/nuxt discussion #25500; LogRocket "Nuxt state management and hydration with useState"; patrón `onMounted`/`useCookie`/`useStorage`. (MEDIUM)
- Implementación actual (parity bar): `index.html` líneas 6251-6663 (app JS), 6269-6314 (`places`), 2215-2252 (`loadSvgFallback*`), 2257-2368 (markup de controles/secciones), CSS 700-1312 (toggles/marcadores/banner). (HIGH — fuente primaria)

---
*Feature research for: re-plataformado guiaRoma → Nuxt 4 (paridad 1:1)*
*Researched: 2026-06-18*
