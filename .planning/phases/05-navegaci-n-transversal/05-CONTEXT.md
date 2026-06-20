# Phase 5: Navegación transversal - Context

**Gathered:** 2026-06-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Construir el composable **`useCardNavigation` una sola vez** (singleton) y **cablear los shells que F3 dejó montados** (`NavPills`, `BackButton`), replicando de `index.html` **al pie de la letra** tres comportamientos de navegación:

1. **Navegación a ficha**: ir a una `.card` desde un enlace interno → scroll suave + **resaltado 2,5 s** + **push** de la posición de scroll a una pila en memoria; el botón "volver" hace **pop** y restaura el scroll suavemente.
2. **Scrollspy de pastillas**: resaltar la `.nav-pill` de la sección activa con la fórmula **EXACTA** `window.scrollY + 130 ≥ section.offsetTop` (gana la última sección que la cumple), vía un listener de `scroll` `{passive:true}` — **NO** `IntersectionObserver`.
3. **Intercepción de enlaces internos**: los `a[href^="#"]` cuyo destino es una **ficha** (los que `<MDC>` genera en la prosa, los `tl-title` del timeline, etc.) se interceptan y disparan `navigateToCard` en vez de saltar sin animación.

Cubre **FEAT-05**. El composable se diseña **para sus 3 consumidores** (la propia F5 = enlaces internos; **F6** = búsqueda; **F7** = mapa), aunque F5 solo cableé el consumidor de enlaces.

**Incluye:**
- `app/composables/useCardNavigation.ts` (NUEVO): `navStack` (array de `scrollY`), `navigateToCard(id, event?)`, `goBack()`, `activeSection` reactivo, `canGoBack`/visibilidad del botón. Singleton (`useState`), init client-only en `onMounted`.
- Un **único listener de click delegado** (en la raíz de la app / `TripView`) que enruta los clics en `a[href^="#ficha"]` a `navigateToCard`.
- El **scrollspy** (listener de `scroll` → `activeSection`) y el binding de `.active` en `NavPills`.
- Cablear `BackButton` (shell F3): `@click="goBack"` + visibilidad reactiva (`.show` cuando la pila no está vacía).

**No incluye** (otras fases — el composable se diseña para ellas, pero NO se cablean aquí):
- **Búsqueda** (MiniSearch sobre datos + dropdown que llama `navigateToCard`) = **FEAT-03 → F6**.
- **Ruta del día** = **FEAT-09 → F6**.
- **Mapa Leaflet** (popups "Abrir ficha →" que llaman `navigateToCard`) = **FEAT-02 → F7**.
- **Fallback de imagen / notas persistidas** = **F7**. **Pixel-diff total** = **F8**.
- **Deep-links / hash compartible a una ficha** = capacidad NUEVA, **diferida** (ver Deferred Ideas) — hoy no existe y F5 mantiene la paridad (la navegación a ficha NO cambia la URL).

</domain>

<decisions>
## Implementation Decisions

### Heredado y BLOQUEADO por fases previas / paridad (no reabrir)
- **Paridad = ley** (Core Value): F5 reproduce el comportamiento de `index.html` **exactamente**. Toda la lógica vive en su JS de app (líneas mapeadas en Canonical References); el planner la porta 1:1, no la reinventa.
- **CSS VERBATIM ya existe** (F1): `.card.highlight` (`base.css:1595` — borde `--accent` + `--shadow-elev`), `.nav-pill.active` (`base.css:989`), `.back-btn.show` (`base.css:1926`), `scroll-padding-top:124px` de la cabecera fija. **Cero CSS nuevo, sin `<style scoped>`** — F5 solo togglea estas clases existentes.
- **`NavPills` (F3)** = pastillas ya montadas (7 estructurales + 5 de día derivadas, orden bloqueado), **sin estado activo**. **`BackButton` (F3)** = shell visible, `onclick` descartado, sin manejador ni clase de visibilidad. **F5 los CABLEA; NO recrea ni reestructura su DOM** (patrón F3→F4). El nombre de 1 palabra ya está en la allowlist de eslint si aplica.
- **Ancla estable = `slug`** (= `#id` del index.html). `useTrip` ya expone `monById` (índice por id de ficha) — es la fuente para saber si un `#destino` es una **ficha** (y por tanto se intercepta) o una sección (salto nativo).
- **Init client-only en `onMounted`** (SSR-safe, patrón tema/modos de F3/F4): SSR/hidratación renderizan el estado default (sin pastilla activa forzada, pila vacía) → **cero mismatch de hidratación**; los listeners (click delegado, scroll) y el cálculo inicial se montan en cliente.

### Área 1 — Intercepción de enlaces internos
- **D-01 (mecanismo = DELEGACIÓN DE EVENTOS):** un **único** listener de `click` en la raíz de la app (o `TripView`) que hace `e.target.closest('a[href^="#"]')`, comprueba contra `monById` (de `useTrip`) si el destino es una **ficha** y, si lo es, `event.preventDefault()` + `navigateToCard(id, event)`. **NO** el `bindCardLinks` DOM-scan del original (`querySelectorAll` + `dataset.bound` por enlace, anti-patrón de raspar el DOM — cf. CLAUDE.md §"Buscar scrapeando el DOM"), **NO** un `ProseA.global.vue` (afectaría TODOS los enlaces de prosa y F4 ya vio que la prosa no es uniforme). Ventaja: un solo listener cubre **a la vez** los enlaces de prosa MDC (SC3), los `tl-title` del timeline y cualquier enlace interno a ficha — robusto y sin re-escaneo.
- **Resultado funcional idéntico al original** (`bindCardLinks`, index.html:6420-6429): solo se interceptan enlaces cuyo destino es una ficha; los enlaces a **secciones** (`#viernes`, `#reservas` de las pastillas) NO se interceptan (siguen siendo saltos de ancla nativos).

### Área 2 — Alcance + comportamiento de la URL
- **D-02 (alcance = solo fichas, paridad):** SOLO los enlaces a **fichas** reciben scroll suave + resaltado + pila "volver". Las pastillas de sección siguen siendo **saltos de ancla nativos** (sin resaltado ni pila). Idéntico a hoy.
- **D-03 (URL = paridad exacta, sin cambio de hash):** `navigateToCard` hace **`event.preventDefault()`** → navegar a una ficha **NO cambia el hash de la URL** (igual que index.html:6391). Las pastillas de sección, al ser nativas, **sí** actualizan el hash. La pila en memoria es el mecanismo de "volver", **no** el historial del navegador. (Deep-links a ficha = idea diferida, NO F5.)

### Área 3 — Scrollspy / listener de scroll
- **D-04 (scrollspy = PORT EXACTO):** `window.addEventListener('scroll', updateActivePill, { passive: true })`; `updateActivePill` calcula `const y = window.scrollY + 130`, itera **todas** las `<section>` y se queda con la **última** cuyo `offsetTop ≤ y`, y hace `toggle('active')` en cada `.nav-pill` por match de `href === '#'+current`. **Sin** `requestAnimationFrame`, **sin** throttle, **sin** `IntersectionObserver` (SC2). El `+130` debe superar el `scroll-padding-top:124px` de la cabecera fija (si no, la conmutación se adelanta ~24px — comentario verbatim en index.html:6489-6491). `activeSection` reactivo conduce el binding `.active` en `NavPills`.

### Área 4 — Forma del composable
- **D-05 (diseñar `useCardNavigation` para los 3 consumidores YA):** API pública estable desde F5 para que F6 (búsqueda) y F7 (mapa) enchufen **sin refactor**:
  - `navigateToCard(id: string, event?: Event)` — push `scrollY`, `scrollIntoView({behavior:'smooth',block:'start'})`, add `.highlight` 2500 ms, actualiza visibilidad del botón.
  - `goBack()` — pop, `window.scrollTo({top, behavior:'smooth'})`, actualiza visibilidad.
  - `activeSection` (ref) — para el `.active` de `NavPills`.
  - `canGoBack` / visibilidad — para el `.show` de `BackButton`.
  - **Singleton** vía `useState` (patrón `useTripModes` de F4) para compartir `navStack`/`activeSection` entre componentes; init de listeners en `onMounted`.

### Claude's Discretion (planner/research deciden; no requieren al usuario)
- Nombre/ubicación exactos del composable y dónde se monta el listener delegado (raíz de la app vs `TripView`) y el de scroll.
- Forma interna del estado (`useState` singleton vs `ref` a nivel módulo — preferir `useState` por el precedente y SSR-safety) y cómo se expone la visibilidad del `BackButton` (computed sobre `navStack.length`).
- Cómo `navigateToCard` resuelve el `scrollIntoView` y el timing exacto del cálculo inicial de `activeSection` (replicar el `init()` de index.html:6649).
- Mecánica fina del binding reactivo de `.active`/`.show` en los shells de F3 sin tocar su DOM.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Código actual (FUENTE DE VERDAD de la paridad)
- `index.html` — el comportamiento a portar 1:1. Mapa de líneas de F5:
  - **Navegación + pila:** `navStack` 6382; `updateBackBtn` 6385-6388 (`.show` si `navStack.length>0`); `navigateToCard(id,event)` 6390-6401 (`preventDefault`, `push(scrollY)`, `scrollIntoView({behavior:'smooth',block:'start'})`, add `.highlight` + `setTimeout(remove, 2500)`); `goBack()` 6403-6409 (`pop` + `scrollTo({top,behavior:'smooth'})`); `highlightCard` (alias legacy) 6412-6417; `bindCardLinks()` 6420-6429 (referencia de la LÓGICA — solo intercepta enlaces cuyo destino es una ficha; F5 lo reemplaza por **delegación**, D-01).
  - **Scrollspy:** `updateActivePill` 6485-6500 (`scrollY+130`, última `<section>` que cumple, `toggle('active')` por href); `addEventListener('scroll', …, {passive:true})` 6501; comentario del `+130` vs `scroll-padding-top:124px` 6489-6491.
  - **Init:** `init()` 6649 (llama a `bindCardLinks()` tras insertar las fichas — F5 lo replica montando el listener delegado en cliente).
  - **Consumidores (contexto para D-05, NO se cablean en F5):** popups del mapa `navigateToCard('id', event)` 6365/6367 (F7); resultados de búsqueda `navigateToCard(a.dataset.card, e)` 6461 (F6).
  - **Markup:** `nav-pills` 2264-2276 (las 12 pastillas con `href="#…"`); `back-btn` 6230 (`onclick="goBack()"`, `aria-label="Volver"`).
- `app/assets/css/base.css` — clases verbatim (cero CSS nuevo): `.card.highlight` (1595), `.nav-pill`/`.nav-pill.active` (976/989), `.back-btn`/`.back-btn.show` (1926), `scroll-padding-top:124px`.
- `app/components/NavPills.vue` — shell F3 (pastillas montadas sin estado activo); F5 cablea `.active` reactivo. **NO reestructurar.**
- `app/components/BackButton.vue` — shell F3 (visible, sin handler); F5 cablea `@click=goBack` + visibilidad. **NO reestructurar.**
- `app/components/TripView.vue` — raíz de la página; candidato para montar el listener delegado de click (y posiblemente el de scroll).
- `app/components/MonumentCard.vue` + `app/components/Timeline*.vue` — renderizan los enlaces internos (`<MDC>` de la prosa, `tl-title`) que la delegación intercepta.
- `app/composables/useTrip.ts` — expone `monById` (índice por id de ficha): la delegación lo usa para distinguir ficha vs sección.
- `app/composables/useTripModes.ts` — **precedente de composable**: singleton `useState` + init en `onMounted` (replicar el patrón para `useCardNavigation`).

### Planificación
- `.planning/ROADMAP.md` §Phase 5 — goal + los **3 success criteria** (SC#1 navegación+resaltado+pila restaura scroll; SC#2 scrollspy `scrollY+130 ≥ offsetTop` exacto, sin IntersectionObserver; SC#3 intercepción de `a[href^="#"]` de la prosa MDC).
- `.planning/REQUIREMENTS.md` — **FEAT-05** (esta fase) y los consumidores aguas abajo: **FEAT-03/FEAT-09** (búsqueda/ruta del día, F6), **FEAT-02** (mapa, F7).
- `.planning/PROJECT.md` — Core Value (**paridad 100%**).
- `.planning/phases/04-render-de-contenido-modos-de-ritmo/04-CONTEXT.md` — en F4 estos enlaces se dejaron como **anclas normales**; la intercepción es F5. Patrón "shell montado en F3, comportamiento cableado en su fase".
- `.planning/phases/03-capa-de-p-gina-layout-y-tema/03-CONTEXT.md` — `NavPills` híbrido + `BackButton` shell; init client-only del tema (precedente de `onMounted`).
- `CLAUDE.md` (raíz) — §"Búsqueda — indexar datos, no DOM" (el anti-patrón de raspar el DOM motiva la **delegación** sobre el `bindCardLinks` original); §"CSS verbatim".

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useTrip().monById`** (F3) — índice por id de ficha; la delegación lo consulta para saber si un `#destino` es una ficha (interceptar) o una sección (salto nativo). Evita el `querySelectorAll('.card')` del original.
- **Patrón de composable singleton** de `useTripModes` (F4) — `useState` compartido + init en `onMounted`; `useCardNavigation` lo replica.
- **Shells de F3** — `NavPills` y `BackButton` ya tienen el markup/clases exactos; F5 solo añade bindings reactivos (`.active`, `.show`, `@click`).
- **CSS verbatim** (F1) — `.card.highlight`, `.nav-pill.active`, `.back-btn.show` ya definidas → **cero CSS nuevo**; F5 solo togglea clases.

### Established Patterns
- **"Shell montado en F3, comportamiento cableado en su fase"** (F3→F4) — F5 lo extiende a `NavPills`/`BackButton`.
- **Estado client-only inicializado en `onMounted`** (tema F3, modos F4) — los listeners (click delegado, scroll) y el estado de navegación se montan en cliente → cero mismatch de hidratación.
- **Un componente/composable por concern, sin `<style scoped>`, cero CSS** (F3/F4).

### Integration Points
- `app/composables/useCardNavigation.ts` — **NUEVO** (singleton).
- `app/components/TripView.vue` — **MODIFICAR**: montar el listener delegado de click (y el de scroll / `activeSection`).
- `app/components/NavPills.vue` — **MODIFICAR**: bind `.active` a `activeSection`.
- `app/components/BackButton.vue` — **MODIFICAR**: `@click=goBack` + visibilidad reactiva.
- **Consumidores aguas abajo (diseñar el API para ellos, NO cablear):** **F6** búsqueda (dropdown → `navigateToCard`) y ruta del día; **F7** mapa (popups → `navigateToCard`).

</code_context>

<specifics>
## Specific Ideas

- **Resaltado exacto:** add `.highlight` (borde `--accent` + `--shadow-elev`) durante **2500 ms** y quitar (index.html:6397-6398). `scrollIntoView({behavior:'smooth', block:'start'})`.
- **"Volver" exacto:** `navStack` = array de `window.scrollY`; `goBack` hace `pop` + `scrollTo({top, behavior:'smooth'})`; el botón muestra `.show` solo si `navStack.length>0` (index.html:6385-6409).
- **Scrollspy exacto:** `scrollY+130`, gana la **última** `<section>` con `offsetTop ≤ y`; `{passive:true}`; el `+130` supera el `scroll-padding-top:124px` de la cabecera fija.
- **Interceptar solo fichas:** la delegación replica que `bindCardLinks` solo enrutaba enlaces cuyo destino es una `.card` (no secciones) — comprobación vía `monById`.
- **Un solo listener** cubre prosa MDC + `tl-title` del timeline + (futuro) búsqueda/mapa — la elegancia de la delegación frente a bindear por enlace.

</specifics>

<deferred>
## Deferred Ideas

- **Deep-links / hash compartible a una ficha** — reflejar la ficha activa en la URL (`#ficha`) para enlaces compartibles. Es una **capacidad nueva** (hoy navegar a ficha hace `preventDefault` y NO toca la URL); rompería la paridad de F5. Candidata a una fase/milestone futuro, NO F5.
- (Los diferidos que pertenecen a otras fases ya están ubicados: búsqueda/ruta del día → **F6**; mapa → **F7**; fallback de imagen/notas → **F7**; pixel-diff total → **F8**.)

</deferred>

---

*Phase: 5-Navegación transversal*
*Context gathered: 2026-06-21*
