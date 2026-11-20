# Phase 3: Capa de página, layout y tema - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Construir la **capa de página** que agrega un viaje desde sus datos (`useTrip(slug)`) y lo entrega a un único **`TripView`**, con el **shell de layout** (Topbar, NavPills, BackButton, footer) componentizado y **visualmente idéntico a hoy**, el **routing multi-viaje** preparado (`/` = Roma por defecto; `/trips/[slug]` como estructura lista) y el **tema claro/oscuro sin parpadeo** (FOUC) en estático — fijando el anti-FOUC desde que el layout existe.

Cubre: **ARCH-01, ARCH-02, UI-01, FEAT-01**.

**Incluye:**
- `useTrip(slug)` que agrega `trip`/`days`/`monuments`/`food`/`artists`/`reference` con **índices por id** (SC#1).
- Un único **`TripView`** renderizado en `/` (Roma) y reusable en `/trips/[slug]`.
- **Shell de layout** componentizado verbatim: Topbar (brand + ThemeToggle), NavPills, BackButton (shell), footer.
- El **#inicio completo** (masthead + info-cards + "cómo usar") renderizado desde `trip.yml`.
- El **andamiaje de todas las secciones-página** con sus anclas (#inicio…#arquitectura), con placeholders para el contenido de fases posteriores.
- **Tema** con `@nuxtjs/color-mode` sin FOUC + ThemeToggle (icono por CSS, SC#4).

**No incluye** (otras fases):
- Render de **fichas / timeline / secciones de referencia** y **modos de ritmo** (caminar menos, resumen) → **Fase 4**.
- **Navegación transversal**: scroll-a-ficha, pila "volver" (comportamiento de BackButton), scrollspy `+130`, `.nav-pill.active`, intercepción de `a[href^="#"]` → **Fase 5**.
- **Búsqueda** y **ruta del día** → **Fase 6**.
- **Mapa Leaflet** (isla client-only), **imagen-con-fallback**, **notas** → **Fase 7**.
- Suite de **verificación de paridad** → **Fase 8**.

Aquí solo se monta la capa de página + el shell + el tema; el contenido de las secciones de día/referencia y el mapa llegan como placeholders.

</domain>

<decisions>
## Implementation Decisions

### Heredado y BLOQUEADO por fases previas / research (no reabrir)
- **Tema ya configurado** en `nuxt.config.ts` (Fase 1): `colorMode: { preference:'system', fallback:'light', dataValue:'theme', storageKey:'roma-theme', classSuffix:'' }`. El contrato `[data-theme]` (en `<html>`) ya es **el mismo selector** que el CSS editorial verbatim. No reconfigurar el módulo; usarlo.
- **Datos migrados 1:1** (Fase 2): 6 colecciones zod en `shared/schemas.ts` + `content.config.ts`. El **ancla estable es `slug`** (= `#id` del `index.html`, = basename del fichero), **nunca `id`** (campo reservado de Content). `useTrip` agrega sobre estos tipos.
- **CSS editorial verbatim** (Fase 1) en `app/assets/css/{tokens,base,leaflet}.css` ya define `.topbar` (sticky), `.topbar-inner`, `.brand`, `.theme-btn` (+ reglas de icono por `[data-theme]`), `.nav-pills`/`.nav-pill`, `.back-btn` (fixed + `.back-btn.show`), footer. **Paridad por construcción**: los componentes solo reproducen este markup/clases, no escriben CSS nuevo.
- **`index.html` intacto** en la raíz = fuente del golden y referencia de paridad (no se toca).

### Área 1 — Routing y alcance multi-viaje (ARCH-01/ARCH-02)
- **D-01:** La 1.0 **solo genera `/`**. `app/pages/index.vue` renderiza `<TripView slug="roma" />`. Se crea **también** `app/pages/trips/[slug].vue` reusando el mismo `TripView` (la "estructura `/trips/[slug]` lista" de ARCH-02), pero **ninguna ruta `/trips/*` se prerenderiza** en 1.0 — `nitro.prerender.routes` se queda en `['/']` y no hay enlaces internos que `crawlLinks` pueda seguir hacia `/trips/*`. Resultado: cero contenido duplicado, cero ambigüedad de `canonical`, y el golden (capturado en `/`) sigue siendo la única página real.
- **D-02:** El viaje por defecto de `/` es **`'roma'` hardcodeado** en `pages/index.vue` (no "primer trip de la colección" ni config). `/` es, por diseño, el "home de Roma"; un viaje futuro (v2) vive en `/trips/<slug>` sin tocar el home. "Añadir viaje = añadir ficheros" se preserva donde de verdad importa (la ruta `[slug]` ya consume datos por slug).

### Área 2 — NavPills: shell fijo vs derivado de datos (UI-01/ARCH-01)
- **D-03:** Construcción **híbrida** de la barra de pastillas. Los pills **estructurales** (Inicio, Mapa, Reservas, Gastronomía, Pratica, Arte, Arquitectura) se **declaran en el componente `NavPills`** (son estructura fija de la página, no entidades de datos). Los pills de **día** se **derivan de `useTrip().days`** ordenados por `day.order`. Así, añadir/quitar un día (= añadir un fichero `days/*.yml`) actualiza la nav **sin tocar código** — cumple ARCH-01 donde el contenido realmente varía.
- **D-04:** La **etiqueta italiana** del pill de día (Venerdì/Sabato/Domenica/Lunedì/Martedì) se **deriva del `eyebrow`** del día: primera palabra antes del `·`, capitalizada (`venerdì · 19 giugno` → `Venerdì`). **Verificado 1:1** para los 5 días (cero cambios en los datos de la Fase 2). El `href` del pill = `'#' + day.slug` (= `#viernes`, ancla de paridad). **NO** se añade campo `navLabel` al esquema (se prefiere derivar a tocar `shared/schemas.ts` + los 5 ficheros).
- **Frontera explícita:** el resaltado **`.nav-pill.active`** y el **scrollspy `+130`** son **FEAT-05 → Fase 5**. En F3 los pills se renderizan **sin** esa lógica (son anclas `<a href="#…">` normales).

### Área 3 — Frontera de contenido de F3: qué monta `TripView`
- **D-05:** `TripView` **posee la estructura de página**: monta el shell y **todas** las secciones-página con sus `id`/anclas (#inicio, #mapa, #viernes…#martes, #reservas, #gastronomia, #practica, #arte, #arquitectura) para que la nav, el (futuro) scrollspy y la **paridad de layout** funcionen. Rellena el contenido **nivel-trip**; deja el contenido de **fichas/timeline (F4)**, **mapa #mapa (F7)** y **secciones de referencia (F4)** como **placeholders con su `id`**. F4/F7 enchufan dentro de los slots ya existentes.
- **D-06:** El **#inicio completo** se renderiza en F3: masthead (decoración, `<h1>` con `<em>`, meta, cita) **+ la rejilla de info-cards (`trip.infoCards`) + el bloque "¿Cómo usar esta guía?" (`trip.howTo`)**. Todo es contenido nivel-trip (vive en `trip.yml`) y **F4 no lo reclama** (F4 = fichas, timeline y secciones de referencia). Mantiene #inicio cohesionado en una sola fase y deja una primera pantalla con contenido real y verificable ya en F3.
- **D-07:** El **`BackButton` se crea en F3 como shell visual**, con su markup exacto (`button.back-btn`, flecha `←`, texto "Volver", `aria-label="Volver"`), **montado pero oculto** por defecto (sin clase `.show`). Su **comportamiento** (pila "volver" + restaurar scroll, gestión de `.show`) se cablea en **Fase 5** (`useCardNavigation`). El shell de layout queda completo como pide el goal de F3; en reposo es invisible → **paridad intacta** (el golden de home tampoco lo muestra).

### Área 4 — Tema claro/oscuro sin FOUC (FEAT-01)
- **D-08:** El `ThemeToggle` es de **2 estados** (claro↔oscuro), reproduciendo `toggleTheme()`/`setTheme()` 1:1: al pulsar, **invierte el tema RESUELTO actual** (`$colorMode.value`) y fija `$colorMode.preference` a `'light'`/`'dark'` — **nunca escribe `'system'`**. La **primera visita** usa `preference:'system'` + `fallback:'light'` (≡ original: `roma-theme` guardado → `prefers-color-scheme: dark` → `light`). Se conserva la clave `roma-theme`, así que el tema guardado por la versión viva sigue válido.
- **D-09:** **Head de paridad completo.** Replicar verbatim: `htmlAttrs.lang='es'`, el `<title>Roma · 19—23 giugno 2026</title>` y los **dos** `<meta name="theme-color" media="(prefers-color-scheme: …)">` (index.html líneas 6-7). Estos meta son **independientes de color-mode** (fijan el color del chrome del navegador según el esquema del SO). El script anti-FOUC de color-mode ya se inyecta en el `<head>` (verificar que aparece en el HTML generado — SC#3).
- **D-10:** (Bloqueado por **SC#4**) markup de `ThemeToggle` **verbatim**: `button.theme-btn` con `<span class="moon">☾</span><span class="sun">☀</span>`. El icono se resuelve **solo por CSS** (`[data-theme="light"] .theme-btn .moon{display:block}` … líneas 957-960), **sin ningún `v-if` por tema** en el template. El `onclick="toggleTheme()"` pasa a `@click` que aplica D-08.

### Claude's Discretion (research/planner deciden; no requieren al usuario)
- **Forma exacta de retorno de `useTrip`**: cómo expone los "índices por id" (p.ej. `Map`/`Record` por id para `monuments`/`food`/`artists`/`reference` + arrays ordenados para `days` + el objeto `trip`), y los helpers de acceso (ficha por id, día por slug). Restricción dura: cumplir **SC#1** (agrega las 6 colecciones del viaje + índices por id) y resolver **en build/SSG** (las `queryCollection` se prerenderizan; funciona offline).
- **Estructura de componentes**: si el chrome fijo vive en `app/layouts/default.vue` (con `<NuxtPage/>`) vs en `app.vue` vs dentro de `TripView`; nombres exactos de componentes (`Topbar`/`NavPills`/`BackButton`/`ThemeToggle`/`TheHero`…) y composables. Restricción: **UI-01** (Topbar/NavPills componentizados e idénticos) + el shell debe reusar el CSS verbatim sin tocarlo.
- **Aspecto/altura de los placeholders** de #mapa y de las secciones de día/referencia (que no rompan el scroll ni desvíen el layout de paridad). Mantenerlos mínimos.
- **Mecánica exacta del transform** `eyebrow → label` (`split('·')[0].trim()` + capitalizar la inicial de forma locale-segura) y dónde vive (helper puro testeable).
- **Cómo se cablea `pages/trips/[slug].vue`** aunque no se prerenderice: validación de `slug` contra la colección `trip`, comportamiento ante slug inexistente (404), y que no introduzca rutas en el prerender por accidente.
- Contenido del `app.vue` actual (`#scaffold`, Fase 1): **se sustituye** por la estructura real de página (preservando los favicons con baseURL ya resueltos en `app/app.vue`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Investigación del proyecto (decisiones de stack YA tomadas — leer ANTES de planificar)
- `.planning/research/STACK.md` — stack y versiones verificadas. Para F3: **`@nuxtjs/color-mode` 4.0.1** (`dataValue:'theme'`, `storageKey:'roma-theme'`, script anti-FOUC en `<head>`), Nuxt 4 routing/SSG, CSS a mano conservado. Base del tema y del layout.
- `.planning/research/ARCHITECTURE.md` — estructura de directorios Nuxt 4 (`srcDir=app/`, `pages/`, `layouts/`, `components/`, `composables/`), routing history, dónde encajan `useTrip`/`TripView`.
- `.planning/research/PITFALLS.md` — trampas directas de F3: **FOUC del tema en SSG**, `app.baseURL`/subpath en enlaces, history routing (no hash) con anclas `#id`, prerender de las `queryCollection` para offline.
- `.planning/research/FEATURES.md` — mapeo de features → de qué datos derivan; ubica FEAT-01 (tema) y deja claro qué es de F4-F7 (no invadir).
- `.planning/research/SUMMARY.md` — síntesis + BUILD ORDER (por qué página/layout/tema va tras los datos y antes del render de contenido).
- `CLAUDE.md` (raíz) — §"Tema sin FOUC" (#8), §"Mapa — client-only" (contexto del placeholder #mapa de F7), §"CSS / design tokens" (conservar verbatim), §"What NOT to Use".

### Planificación
- `.planning/PROJECT.md` — visión, **Core Value (paridad 100%)**, constraints, Key Decisions.
- `.planning/REQUIREMENTS.md` — **ARCH-01, ARCH-02, UI-01, FEAT-01** (esta fase) y dependencias aguas abajo (FEAT-05 navegación en F5, UI-02..04/FEAT-06..08 render+ritmo en F4) que consumirán `useTrip`/`TripView`/el shell.
- `.planning/ROADMAP.md` §Phase 3 — objetivo y los **4 success criteria** (SC#1 useTrip+TripView+multi-viaje, SC#2 layout/Topbar/NavPills idénticos, SC#3 tema sin FOUC, SC#4 icono por CSS sin `v-if`).
- `.planning/phases/01-andamiaje-golden-de-paridad/01-CONTEXT.md` — andamiaje, claves localStorage (`roma-theme`…), CSS verbatim como fuente del look, golden de paridad.
- `.planning/phases/02-esquema-de-datos-migraci-n-del-contenido/02-CONTEXT.md` — esquema de datos que `useTrip` agrega; **`slug` como ancla estable**; cross-refs.

### Código actual (FUENTE DE VERDAD de la paridad)
- `index.html` — la guía actual; **fuente del golden y de la paridad del shell**. Líneas clave de F3:
  - `<head>`: `<html lang="es" data-theme="light">` **línea 2**; `<meta name="theme-color" … prefers-color-scheme>` **6-7**; `<title>` **8**; link de fuentes **13**.
  - **Shell**: `header.topbar` **2257**, `.topbar-inner` **2258**, `.brand` **2259**, `button.theme-btn` (spans `.moon`/`.sun`) **2260-2262**, `nav.nav-pills#nav-pills` con los 12 pills **2264-2277**; `<main>` **2280**.
  - **#inicio**: `section#inicio` **2283**, `.hero` (decoración/h1/meta/cita) **2285-2293**; info-grid y "cómo usar" siguen dentro de #inicio.
  - **BackButton**: `button.back-btn#back-btn` **6230-6232**; `.flourish` **6234**; `footer` **6235-6240**.
  - **JS de tema**: `setTheme(t)` **6254-6257** (`setAttribute('data-theme')` + `localStorage['roma-theme']`), `toggleTheme()` **6258-6261** (flip light/dark), **init** **6262-6266** (saved → `prefers-color-scheme: dark` → light).
- `app/assets/css/base.css` — CSS verbatim del shell: `.topbar { position: sticky; top:0; z-index:100 }` **24-25**, `.topbar-inner` **31-37**, `.nav-pills`/`.nav-pill` **63-89**, `.back-btn { position: fixed }` + `.back-btn.show` **1001-1031**; reglas de icono del tema (`.theme-btn .moon/.sun` por `[data-theme]`) **957-960**.
- `app/assets/css/tokens.css` — custom properties `:root` y `[data-theme="dark"]` (el sistema de tokens claro/oscuro).
- `nuxt.config.ts` — bloque `colorMode` (líneas 26-32), `app.baseURL='/guiaRoma/'`, `nitro.prerender.routes:['/']` (D-01 mantiene esto), módulos.
- `shared/schemas.ts` — tipos del viaje que `useTrip` agrega; en especial `TripSchema` (`title`, `decoration`, `meta`, `quote`/`quoteAttr`, `infoCards`, `howTo`, `map`, `sections`) para el #inicio (D-06) y `DaySchema` (`slug`, `order`, `eyebrow`) para los pills de día (D-04).
- `content.config.ts` — las 6 colecciones (fuente de las `queryCollection` de `useTrip`).
- `app/app.vue` — scaffold actual (`#scaffold`) **a sustituir** por la estructura real; conserva el patrón de favicons con `useRuntimeConfig().app.baseURL`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CSS verbatim del shell** (`app/assets/css/base.css` + `tokens.css`): clases `.topbar`/`.topbar-inner`/`.brand`/`.theme-btn`/`.nav-pills`/`.nav-pill`/`.back-btn` + reglas de icono por `[data-theme]` ya existen. Los componentes F3 **solo reproducen el markup** con esas clases; no se escribe CSS nuevo (paridad por construcción).
- **`@nuxtjs/color-mode` ya registrado y configurado** (Fase 1) con el contrato exacto del index.html. F3 lo **consume** (`$colorMode`), no lo configura.
- **Datos del viaje** (85 ficheros YAML, 6 colecciones) listos para `useTrip`. `trip.yml` ya tiene `infoCards`/`howTo`/hero/`sections` (D-06); los 5 `days/*.yml` tienen `order`+`eyebrow` (D-04).
- **`app/app.vue`**: patrón de favicons bajo subpath (`useHead` + `useRuntimeConfig().app.baseURL`) reutilizable/conservable al reescribir el árbol de página.

### Established Patterns
- **Tema vía `[data-theme]` en `<html>`** + `localStorage['roma-theme']` + `prefers-color-scheme` → mapeado 1:1 a `@nuxtjs/color-mode` (D-08). El toggle es 2-estados (light↔dark), nunca 'system'.
- **Ancla = `slug`** (= `#id` del index.html): los pills (`#viernes`…), las secciones (`id="viernes"`) y los enlaces internos de la prosa (F4/F5) dependen de que las anclas existan. F3 monta las secciones con su `id` (D-05).
- **SSG con `queryCollection` prerenderizado**: `useTrip` debe resolverse en build (offline-friendly), no en runtime de servidor (no hay servidor en 1.0).
- **CSS global verbatim, sin scoped/framework**: los componentes nuevos usan las clases existentes; nada de `<style scoped>` que reintroduzca estilos.

### Integration Points
- `app/pages/index.vue` (`/` → `<TripView slug="roma"/>`) y `app/pages/trips/[slug].vue` (estructura ARCH-02, sin prerender) — **nuevos**.
- `app/composables/useTrip.ts` — **nuevo**; agrega las 6 colecciones por trip + índices por id (consumido por F4-F7).
- `app/components/` — **nuevos**: `TripView`, `Topbar`, `NavPills`, `BackButton`, `ThemeToggle`, y el/los componente(s) del #inicio.
- `app/layouts/default.vue` (a decidir) — posible hogar del chrome fijo (Topbar/NavPills/BackButton/footer) con `<NuxtPage/>`.
- `nuxt.config.ts` — `app.head` para D-09 (lang/title/meta theme-color) si no se usa `useHead` en `app.vue`; `prerender.routes` se mantiene en `['/']` (D-01).
- **Consumidores aguas abajo**: F4 (render dentro de los slots de sección y del #mapa/fichas), F5 (cablea BackButton + `.nav-pill.active` + scrollspy), F7 (sustituye el placeholder #mapa por la isla Leaflet client-only).

</code_context>

<specifics>
## Specific Ideas

- **`/` es la única página real de la 1.0** (D-01): el golden se capturó en `/`; mantenerla como única ruta prerenderizada evita divergencias y problemas de canonical.
- **`/` = "home de Roma" por diseño** (D-02): slug `'roma'` literal; el multi-viaje vive en `/trips/<slug>`.
- **Etiqueta de día derivada del `eyebrow`** (D-04), verificado 1:1: `venerdì→Venerdì`, `sabato→Sabato`, `domenica→Domenica`, `lunedì→Lunedì`, `martedì→Martedì`. `href='#'+slug` (anclas españolas `#viernes`…).
- **#inicio íntegro en F3** (D-06): primera pantalla con contenido real y verificable ya en esta fase.
- **BackButton presente pero invisible en F3** (D-07): el comportamiento llega en F5; en reposo no se ve → no afecta al golden.
- **Tema: 2 estados, clave `roma-theme`, `preference:'system'` en 1ª visita** (D-08) — un usuario que venga de la versión viva con `roma-theme=dark` mantiene su tema.
- **Head verbatim** (D-09): no perder los `<meta name="theme-color">` (color del chrome del navegador en móvil).

</specifics>

<deferred>
## Deferred Ideas

None — la discusión se mantuvo dentro del alcance de la Fase 3.

(Los diferidos de producto — backend/auth/uploads, PWA, segundo viaje real — siguen en `.planning/STATE.md` ▸ Deferred Items y `REQUIREMENTS.md` ▸ v2. El **segundo viaje real** es lo que ejercitaría de verdad `pages/trips/[slug].vue`, que en 1.0 queda como estructura lista pero sin contenido propio.)

</deferred>

---

*Phase: 3-Capa de página, layout y tema*
*Context gathered: 2026-06-19*
