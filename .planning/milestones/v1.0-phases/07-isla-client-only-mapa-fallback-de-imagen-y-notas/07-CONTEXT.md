# Phase 7: Isla client-only — mapa, fallback de imagen y notas - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Abordar las **tres piezas más sensibles a SSR/hidratación** una vez asentado el patrón `.client.vue` + `<ClientOnly>` + `onMounted` (tema F3, modos F4, navegación F5), reproduciendo el comportamiento del `index.html` **al pie de la letra**:

1. **Mapa Leaflet** (FEAT-02): única isla `client-only`. Marcadores numerados (romano) por tipo, popups, `fitBounds`, banner offline con la heurística exacta `tilesErrored > 3 && tilesLoaded === 0`; `nuxt generate` pasa sin `window is not defined`. Los popups a ficha enchufan al `useCardNavigation` de F5.
2. **Imagen-con-fallback** (UI-05): `<img>` nativo con `@error` → SVG por `motif`; modo **hero** (sustituye el contenedor; lo oculta si no hay motif) y modo **detail** (sustituye solo la `<img>`, conserva el caption), con `loading="lazy"` y `alt` exactos.
3. **Notas por ficha** (FEAT-04): persisten en localStorage con la clave exacta `roma-note-<id>`, leídas en `onMounted` (sin warnings de hidratación).

Cubre **FEAT-02**, **UI-05** y **FEAT-04**. Depende de **F5** (`useCardNavigation`).

**Incluye:**
- Componente del mapa (`LeafletMap.client.vue` o equivalente) con import dinámico de Leaflet en `onMounted`, montado en el `#mapa` que `TripView` dejó vacío, envuelto en `<ClientOnly>` con `#fallback` del mismo tamaño.
- El campo de datos del marcador **extra** (Coliseo) en `trip.yml` (el único pin sin ficha).
- Cableado del **fallback de imagen** en `MonumentCard` (hero) y `DetailPhoto.global.vue` (detail), reemplazando el `@error` ausente (frontera D-01 de F4).
- Cableado de la **persistencia de notas** en el shell `.notes-textarea` que `MonumentCard` dejó montado en F4.
- Port verbatim de la librería `SVG_MOTIFS` (19 motifs) a la app Nuxt.

**No incluye** (otras fases / scope-creep — ver Deferred):
- Clustering o búsqueda dentro del mapa; export/sync/markdown de notas; fallback de imagen en imágenes que no sean hero/detail; deep-links / hash compartible a ficha (ya diferido en F5); **caché offline real de tiles** (= PWA = v2).
- **Pixel-diff total** = **F8**.

</domain>

<decisions>
## Implementation Decisions

### Heredado y BLOQUEADO por fases previas / paridad (no reabrir)
- **Paridad = ley** (Core Value): F7 reproduce el comportamiento del `index.html` **exactamente**. El planner porta la lógica 1:1 (mapas de línea en Canonical References), no la reinventa. La 1.0 es paridad, no mejora de producto.
- **Leaflet 1.9.4 CRUDO en `client-only`** (CLAUDE.md §4): import desde `node_modules` (`import L from 'leaflet'` + `import 'leaflet/dist/leaflet.css'`), self-host vía Vite. **NO** `@vue-leaflet/vue-leaflet` (abandonado 2023). **NO** cargar Leaflet desde CDN (rompe offline). Marcadores con `L.divIcon` (HTML puro, sin imágenes → el problema de rutas de `marker-icon.png` no aplica).
- **`useCardNavigation` (F5) es el ÚNICO consumidor** de enlaces a ficha; los popups del mapa enchufan a `navigateToCard(id, event)` (D-05 se diseñó en F5 para este consumidor). **No** se recrea la lógica de navegación.
- **Init client-only en `onMounted`** (patrón tema/modos/nav): el estado/efectos que tocan `window`/`document`/`localStorage`/Leaflet viven en `onMounted`; SSR/prerender emiten el default → cero mismatch de hidratación; `nuxt generate` sin `window is not defined` (SC#1).
- **CSS VERBATIM, cero CSS nuevo, sin `<style scoped>`** (F1/F3/F4): las clases ya existen en `base.css`/`leaflet.css` (`#leaflet-map` 1177, `.map-offline-banner` 1189/1207, responsive `#leaflet-map{height:420px}` 2137, `.notes-area`/`.notes-textarea`, `.detail-photo`/`.card-hero`, filtro dark `[data-theme="dark"] .leaflet-tile`). F7 solo togglea/usa lo existente.
- **Los datos tipados YA soportan el mapa y el fallback** (esquema F2): cada `Monument` lleva `roman` / `name` / `day` / `coords` / `type` (`PlaceType`) / `motif` (`Motif`, **obligatorio**); `trip.map = { center, zoom }`. El `motif` obligatorio significa que la rama "ocultar hero si no hay motif" del original **nunca dispara para monumentos** (pero se porta igual por fidelidad).

### Área 1 — Datos de los marcadores (D-01)
- **D-01:** los marcadores se **DERIVAN de los 38 monumentos** (`monById` → `roman`/`name`/`day`/`coords`/`type`/`slug`) **+ el Coliseo como único `extra` explícito** en `trip.yml`. Verificado: el array `places` original tiene **39** pines, los monumentos son **38**, y la **única** diferencia es `coliseo` (todo monumento tiene pin; ningún monumento falta del mapa). **NUNCA derivar solo de `monById`** → tiraría el Coliseo = regresión de paridad (SC#1 exige los marcadores de hoy).
- **Dato exacto del extra** (verbatim de `index.html:6292`, para el planner): `{ roman:'★', name:'Coliseo + Foro + Palatino (guiado)', day:'Domingo', coords:{ lat:41.8902102, lng:12.4922309 }, type:'guided' }`. La **forma/nombre del campo** en `TripSchema`/`trip.yml` (p. ej. `places: [...]` vs `mapExtras: [...]`) = discreción del planner; debe extender el esquema F2 y validar.
- **Popups por tipo = port verbatim** (`index.html:6361-6369`): `card` → `<a>Abrir ficha →</a>` (color `#8b3a3a`) vía `navigateToCard`; `concert` → `<a>Abrir ficha →</a>` (color `#5a7a3a`) vía `navigateToCard`; `guided` → **solo texto** `Visita con guía humano` (color `#5c534a`), **sin enlace**. Quirk de paridad: `vaticano` es `guided` → su popup **no** lleva enlace aunque SÍ tiene ficha. Colores de marcador `divIcon`: card `#8b3a3a`, guided `#a07c4a`, concert `#5a7a3a` (círculo 32×32, Cormorant Garamond, borde blanco, el romano `p.n`).

### Área 2 — Placeholder del mapa (D-02)
- **D-02:** el `#fallback` de `<ClientOnly>` (lo que el HTML prerenderizado muestra hasta que Leaflet monta en cliente) = **caja vacía del mismo tamaño que `#leaflet-map`** (420px desktop / responsive), sin texto "cargando". Es lo más fiel: el `index.html` sirve un `<div id="leaflet-map">` vacío que Leaflet rellena, sin placeholder textual. **Cero salto de layout, cero elemento nuevo.** (La mecánica exacta del fallback = discreción; el invariante es **igualar dimensiones** para no descuadrar el ritmo vertical contra el golden.)

### Área 3 — Notas y fallback de imagen (D-03, D-04)
- **D-03 (notas):** paridad estricta de comportamiento — clave `roma-note-<slug>` (de `ta.dataset.noteKey`, hoy `data-note-key="monument.slug"`), **leer en `onMounted`**, **guardar en `input`**, **solo monumentos** (el shell ya está en `MonumentCard:229-237`). **+ micro-mejoras internas INVISIBLES permitidas** (p. ej. debounce del `localStorage.setItem`): la nota persiste igual, solo escribe menos. **Condición dura:** cero cambio visible/funcional, **ninguna UI nueva** (sin indicador "guardado", sin preview). El micro-flash empty→saved tras `onMounted` es aceptable (ya existe el precedente de micro-flash en F4).
- **D-04 (fallback de imagen):** `<img @error>` → SVG por `monument.motif`.
  - **HERO** (`loadSvgFallback`, `index.html:2215-2227`): sustituye el **contenido de `.card-hero`** por el SVG del motif; si no hay motif → oculta el contenedor (`display:none`) — **rama muerta** para monumentos (`motif` obligatorio), portada por fidelidad.
  - **DETAIL** (`loadSvgFallbackDetail`, `index.html:2229-2252`): sustituye **solo la `<img>`** por el SVG (estilos inline `width:100%` / `height:auto` / `border-radius:4px` / `display:block`), **conserva el `.detail-photo-caption`**; si no hay svg → oculta la img.
  - `loading="lazy"` y `alt` **exactos** (ya presentes en los shells F4). `SVG_MOTIFS` (19 motifs, `index.html:2212`) se porta **verbatim** a la app. **`CARD_TO_MOTIF` (2213) NO se porta** — lo reemplaza el campo tipado `monument.motif` (F2).

### Claude's Discretion (research/planner deciden; no requieren al usuario)
- Forma/nombre del componente del mapa (`*.client.vue`) y su montaje dentro del `#mapa` de `TripView` (composable vs inline; `useState` solo si hace falta estado compartido).
- **Cómo enchufan los popups del mapa a `navigateToCard` sin disparar el landmine de F5** (ver Code Context): apoyarse en el listener delegado de **captura** con `<a href="#slug">` (que lo intercepta y hace `preventDefault`+`stopPropagation`) **vs** `data-card` + extender el listener. Resolver y **verificar en el spec** que el popup navega (scroll+highlight, sin cambiar el hash) y no se traga el clic.
- **Cómo se le hace llegar el `motif` al `DetailPhoto.global.vue` inline** (hoy solo recibe `src`/`alt`/`caption`): `provide`/`inject` desde `MonumentCard`, prop MDC añadida en los datos (`:detail-photo{... motif=...}`), o lookup por slug en `useTrip`. El hero lo tiene trivial (`MonumentCard` ya conoce `monument.motif`).
- Forma/nombre del campo extra del Coliseo en `TripSchema`/`trip.yml`.
- Dónde viven las 19 cadenas `SVG_MOTIFS` (util/asset/composable) y cómo se inyectan en el `@error`.
- Mecánica del guardado de notas (`v-model` vs listener `input`; debounce inocuo) y de la lectura inicial en `onMounted`.
- Estrategia de verificación: spec Playwright **autocontenido** (espejo de `modes`/`navigation`/`search-route`.spec — build+serve bajo `/guiaRoma/`), forzando `tileerror` y el `onerror` de imagen con `page.route.abort` (precedente del golden F1, decisión A5) para probar el banner offline y el fallback SVG de forma determinista. Pixel total = F8.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Código actual (FUENTE DE VERDAD de la paridad — `index.html`)
- `index.html` — comportamiento a portar 1:1. Mapa de líneas de F7:
  - **Fallback de imagen:** `SVG_MOTIFS` (objeto de 19 SVG) `2212`; `CARD_TO_MOTIF` `2213` (NO portar — reemplazado por `monument.motif`); `loadSvgFallback(img, cardId)` **hero** `2215-2227`; `loadSvgFallbackDetail(img, cardId)` **detail** `2229-2252`. Uso en markup: hero `onerror="loadSvgFallback(this,'slug')"` (ej. `2459`), detail `onerror="loadSvgFallbackDetail(this,'slug')"` (ej. `2480`).
  - **Mapa — markup:** `#mapa` `2361`; `.map-wrapper` `2366`; `#leaflet-map` `2367`; `.map-offline-banner` "Sin conexión · solo marcadores visibles" `2368`.
  - **Mapa — datos:** array `places` (39 pines) `6269-6314`; el Coliseo (único extra) `6292`.
  - **Mapa — init/tiles/offline:** `L.map('leaflet-map',{scrollWheelZoom:false}).setView([41.8989,12.477],14)` `6321`; `L.tileLayer` OSM (`maxZoom:19`, attribution) `6322-6325`; `tileload`/`tileerror` `6326-6333`; **heurística banner `tilesErrored>3 && tilesLoaded===0`** `6330-6331`; `try/catch` con fallback de texto "No se ha podido cargar el mapa…" `6335-6340`.
  - **Mapa — marcadores/popups/fit:** loop `6343-6370` (`L.divIcon` HTML + colores `6347-6356`; `L.marker` `6360`; popups por tipo `6361-6369`); `fitBounds(bounds.pad(0.1))` `6373-6374`; `invalidateSize` 300ms + on load `6377-6378`.
  - **Notas:** `setupNotes()` `6471-6483`; clave `'roma-note-'+ta.dataset.noteKey` `6474`; lectura `6476-6477`; guardado en `input` `6479-6481`. Markup `.notes-area`/`.notes-textarea data-note-key` (ej. `2506-2508`).
  - **`navigateToCard`** (consumido por los popups) `6390-6401`.
- `app/components/TripView.vue` — `<section id="mapa" />` (`:75`, VACÍO) es donde F7 monta la isla Leaflet; `TripView` ya invoca `useCardNavigationController()` una vez.
- `app/components/MonumentCard.vue` — hero `<img>` PLANO (`:150-156`, frontera D-01 de F4) → F7 añade `@error`→SVG con `monument.motif`; **notas shell** `<textarea :data-note-key="monument.slug">` (`:229-237`, frontera D-02 de F4) → F7 cablea persistencia.
- `app/components/DetailPhoto.global.vue` — detail `<img>` PLANO, **solo recibe `src`/`alt`/`caption`** (no `motif`) → F7 añade `@error`→SVG y debe **hacerle llegar el motif** (discreción).
- `app/composables/useCardNavigation.ts` — `navigateToCard(id, event?)` (accesor); el **listener delegado en CAPTURA + `stopPropagation`** (`onDelegatedClick`, `:137-145`, `:159-160`) es el que condiciona cómo enchufan los popups (ver Code Context, landmine).
- `app/composables/useTrip.ts` — `monById` (slug→`Monument`, base de los 38 marcadores), `trip` (incluye `map.center`/`map.zoom`).
- `shared/schemas.ts` — `MonumentSchema` (`roman`/`name`/`day`/`coords`/`type`/`motif`/`hero`, `:46-65`), `Motif` enum (19, `:31-35`), `PlaceType` (`:37`), `TripSchema.map {center,zoom}` (`:330`). El extra del Coliseo extiende `TripSchema`.
- `content/trips/roma/trip.yml` — `map: { center, zoom }` (`:37-39`); F7 añade aquí el extra del Coliseo.
- `app/assets/css/` (base/leaflet) — clases verbatim (cero CSS nuevo): `#leaflet-map`, `.map-offline-banner(.show)`, `.notes-area`/`.notes-textarea`, `.detail-photo`/`.card-hero`, filtro dark de tiles.
- `tests/parity/modes.spec.ts` / `navigation.spec.ts` / `search-route.spec.ts` — patrón de spec Playwright **autocontenido** (build+serve bajo `/guiaRoma/`) a replicar para F7.

### Stack / planificación
- `CLAUDE.md` §4 (**Leaflet crudo en `client-only`**, NO wrapper, NO CDN, `divIcon` sin imágenes, banner offline, filtro dark, tiles OSM = red) y §9 (PWA/caché offline de tiles = **v2**, fuera de alcance) y §"CSS verbatim".
- `.planning/ROADMAP.md` §Phase 7 — goal + los **4 success criteria** (mapa client-only + heurística offline + `nuxt generate` sin `window`; popups vía F5; fallback hero/detail; notas `roma-note-<id>`).
- `.planning/REQUIREMENTS.md` — **FEAT-02** (mapa), **UI-05** (fallback de imagen), **FEAT-04** (notas).
- `.planning/phases/05-navegaci-n-transversal/05-CONTEXT.md` — diseño de `useCardNavigation` para sus 3 consumidores (F7 mapa es el último); D-01 (delegación en captura) que genera el landmine de los popups.
- `.planning/PROJECT.md` — Core Value (**paridad 100%**) y constraint **offline**.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useTrip().monById` + `useTrip().trip.map`** (F3) — los 38 marcadores se derivan de `monById` (roman/name/day/coords/type/slug); `trip.map.center`/`zoom` alimentan `setView`.
- **`useCardNavigation().navigateToCard`** (F5) — los popups del mapa lo invocan (SC#2); API estable diseñada para este consumidor en D-05.
- **`monument.motif`** (F2, obligatorio) — reemplaza el `CARD_TO_MOTIF` del original; alimenta el `@error`→SVG (hero y detail).
- **Shells montados en F4** — `MonumentCard` hero `<img>` y `.notes-textarea` (con `data-note-key`), `DetailPhoto.global.vue` detail `<img>`: F7 solo añade `@error`/persistencia (patrón "shell montado, comportamiento cableado en su fase").
- **CSS verbatim (F1)** — todas las clases del mapa/notas/detail ya existen → cero CSS nuevo.
- **`useTripModes`/`useCardNavigation`** — precedente de composable singleton (`useState` + controller en `onMounted`) por si el mapa necesita estado.

### Established Patterns
- **Isla SSR-safe**: `*.client.vue` + `<ClientOnly>` (con `#fallback`) + import dinámico (`await import('leaflet')`) en `onMounted` → `nuxt generate` sin `window is not defined`.
- **Estado/efectos client-only en `onMounted`** (tema F3, modos F4, nav F5) → cero mismatch de hidratación; lectura de `localStorage` SIEMPRE en `onMounted` (notas).
- **Lógica pura → `utils` + Vitest; comportamiento → Playwright autocontenido** (F2-F6).
- **Cero CSS nuevo, sin `<style scoped>`** (un `data-v-*` rompería selectores globales/cross-componente y los del DOM que genera Leaflet).

### Integration Points
- **`app/components/LeafletMap.client.vue`** (o nombre equivalente, NUEVO) — montado en `TripView` `#mapa`, envuelto en `<ClientOnly>` con `#fallback` (caja del tamaño de `#leaflet-map`).
- **`app/components/TripView.vue`** (MODIFICAR) — rellenar el `<section id="mapa" />` con la isla.
- **`app/components/MonumentCard.vue`** (MODIFICAR) — hero `@error`→SVG + persistencia de notas en `.notes-textarea`.
- **`app/components/DetailPhoto.global.vue`** (MODIFICAR) — detail `@error`→SVG + recibir el `motif`.
- **`shared/schemas.ts` + `content/trips/roma/trip.yml`** (MODIFICAR) — añadir el campo/dato del marcador extra (Coliseo).
- **`app/composables/useCardNavigation.ts`** (F5) — consumido por los popups **sin cambios** (salvo, si se opta por `data-card`, extender `onDelegatedClick`).

### ⚠️ LANDMINE — popups del mapa vs el listener de F5 (memoria + F6 CR-01)
El controller de F5 registra un listener de click NATIVO en `document` en **fase de CAPTURA** que hace `closest('a[href^="#"]')`, y si el destino es ficha → `preventDefault()` + **`stopPropagation()`** + `navigateToCard`. Un consumidor nuevo (popup) que adjunte su propio `@click`/`onclick` en **burbuja** sobre un `<a href="#slug">` se traga silenciosamente (la captura corre antes y corta la burbuja) — **exactamente** el bug CR-01 de F6, que se arregló usando `data-card`. Para F7: **apoyarse en el listener delegado** (popup con `<a href="#slug">` y SIN handler propio → la captura lo intercepta y navega) **o** usar `data-card` y extender el listener; **nunca** `@click` en burbuja sobre `<a href="#slug">`. Resolver + verificar en el spec.

### Nota — D1 (unión discriminada SQL) RESUELTO y FUERA de F7
El blocker D1 heredado (las colecciones `artist`/`reference` devolvían filas SQL todo-null) **ya está resuelto**: `content.config.ts` registra `artist`/`reference` con los supersets planos `ArtistRowSchema`/`ReferenceRowSchema` (`shared/schemas.ts:211-310`). Además **F7 no toca `artist`/`reference`** (mapa = monumentos + Coliseo; fallback = imágenes de monumento; notas = monumentos), así que D1 no afecta a esta fase. La entrada de `STATE.md` que lo lista como abierto está **stale**. (Sigue siendo prerequisito de **F8** que `#arte`/`#arquitectura`/`#reservas`/`#practica` rendericen con datos reales para el pixel-diff total.)

</code_context>

<specifics>
## Specific Ideas

- **Mapa:** `scrollWheelZoom:false`, `setView([41.8989,12.477],14)` (= `trip.map`), tiles OSM `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (`maxZoom:19`), `divIcon` círculo 32×32 con el romano y color por tipo (card `#8b3a3a` / guided `#a07c4a` / concert `#5a7a3a`), `fitBounds(bounds.pad(0.1))`, `invalidateSize` a 300ms + on load. Banner offline con `tilesErrored>3 && tilesLoaded===0`; `try/catch` con fallback de texto si Leaflet falla al iniciar.
- **Marcador extra (Coliseo):** `{ roman:'★', name:'Coliseo + Foro + Palatino (guiado)', day:'Domingo', coords:{ lat:41.8902102, lng:12.4922309 }, type:'guided' }` — único pin sin ficha; popup solo texto.
- **Fallback:** hero sustituye `.card-hero`, detail sustituye solo la `<img>` (estilos inline) conservando caption; `SVG_MOTIFS` (19) verbatim; `motif` desde los datos.
- **Notas:** `roma-note-<slug>`, leer en `onMounted`, guardar en `input` (debounce inocuo OK), solo monumentos, sin UI nueva.
- **Placeholder:** caja vacía del tamaño de `#leaflet-map`, sin texto.

</specifics>

<deferred>
## Deferred Ideas

- **Clustering / búsqueda dentro del mapa** — capacidad nueva, no estaba en el original. Fuera de F7.
- **Export / sync / markdown de notas, indicador "guardado"** — UI/capacidad nueva; rompería la paridad (hoy las notas son texto plano silencioso en localStorage). Candidato a mejora futura.
- **Fallback de imagen en imágenes que no sean hero/detail** — el original solo lo tiene en `.card-hero` y `.detail-photo` (los avatares de artista son letras, no imágenes). Ampliarlo sería salirse de UI-05.
- **Deep-links / hash compartible a ficha** — ya diferido en F5 (navegar a ficha hace `preventDefault`, no toca la URL). No F7.
- **Caché offline real de tiles del mapa** — = PWA = **v2** (CLAUDE.md §9). La 1.0 conserva el banner offline + marcadores; los tiles siguen siendo de red (OSM).

</deferred>

---

*Phase: 7-Isla client-only — mapa, fallback de imagen y notas*
*Context gathered: 2026-06-23*
