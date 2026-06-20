# Phase 5: Navegación transversal - Research

**Researched:** 2026-06-21
**Domain:** Vue 3.5 / Nuxt 4 SSG — singleton composable + client-only event delegation, scroll listener, reactive class binding (parity port of vanilla JS navigation)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Heredado y BLOQUEADO por fases previas / paridad (no reabrir):**
- **Paridad = ley** (Core Value): F5 reproduce el comportamiento de `index.html` **exactamente**. El planner porta la lógica 1:1, no la reinventa.
- **CSS VERBATIM ya existe** (F1): `.card.highlight`, `.nav-pill.active`, `.back-btn.show`, `scroll-padding-top:124px`. **Cero CSS nuevo, sin `<style scoped>`** — F5 solo togglea estas clases existentes.
- **`NavPills` (F3)** = pastillas ya montadas sin estado activo. **`BackButton` (F3)** = shell visible, sin manejador ni clase de visibilidad. **F5 los CABLEA; NO recrea ni reestructura su DOM** (patrón F3→F4).
- **Ancla estable = `slug`** (= `#id` del index.html). `useTrip` ya expone `monById` — fuente para saber si un `#destino` es **ficha** (se intercepta) o sección (salto nativo).
- **Init client-only en `onMounted`** (SSR-safe, patrón tema/modos F3/F4): SSR/hidratación renderizan el estado default (sin pastilla activa forzada, pila vacía) → **cero mismatch de hidratación**.

**D-01 (mecanismo = DELEGACIÓN DE EVENTOS):** un **único** listener de `click` en la raíz de la app (o `TripView`) que hace `e.target.closest('a[href^="#"]')`, comprueba contra `monById` si el destino es una **ficha**, y si lo es → `event.preventDefault()` + `navigateToCard(id, event)`. **NO** el `bindCardLinks` DOM-scan del original, **NO** un `ProseA.global.vue`.

**D-02 (alcance = solo fichas, paridad):** SOLO los enlaces a **fichas** reciben scroll suave + resaltado + pila "volver". Las pastillas de sección siguen siendo **saltos de ancla nativos**.

**D-03 (URL = paridad exacta, sin cambio de hash):** `navigateToCard` hace **`event.preventDefault()`** → navegar a una ficha **NO cambia el hash de la URL** (igual que index.html:6391). Las pastillas de sección, al ser nativas, **sí** actualizan el hash. La pila en memoria es el mecanismo de "volver", **no** el historial del navegador.

**D-04 (scrollspy = PORT EXACTO):** `window.addEventListener('scroll', updateActivePill, { passive: true })`; `updateActivePill` calcula `const y = window.scrollY + 130`, itera **todas** las `<section>` y se queda con la **última** cuyo `offsetTop ≤ y`, y hace `toggle('active')` en cada `.nav-pill` por match de `href === '#'+current`. **Sin** `requestAnimationFrame`, **sin** throttle, **sin** `IntersectionObserver`. El `+130` debe superar el `scroll-padding-top:124px`.

**D-05 (diseñar `useCardNavigation` para los 3 consumidores YA):** API pública estable desde F5 para que F6 (búsqueda) y F7 (mapa) enchufen **sin refactor**:
- `navigateToCard(id: string, event?: Event)` — push `scrollY`, `scrollIntoView({behavior:'smooth',block:'start'})`, add `.highlight` 2500 ms, actualiza visibilidad del botón.
- `goBack()` — pop, `window.scrollTo({top, behavior:'smooth'})`, actualiza visibilidad.
- `activeSection` (ref) — para el `.active` de `NavPills`.
- `canGoBack` / visibilidad — para el `.show` de `BackButton`.
- **Singleton** vía `useState` (patrón `useTripModes`); init de listeners en `onMounted`.

### Claude's Discretion (planner/research deciden; no requieren al usuario)
- Nombre/ubicación exactos del composable y dónde se monta el listener delegado (raíz de la app vs `TripView`) y el de scroll.
- Forma interna del estado (`useState` singleton vs `ref` a nivel módulo — **preferir `useState`** por el precedente y SSR-safety) y cómo se expone la visibilidad del `BackButton` (computed sobre `navStack.length`).
- Cómo `navigateToCard` resuelve el `scrollIntoView` y el timing exacto del cálculo inicial de `activeSection` (replicar el `init()` de index.html:6649).
- Mecánica fina del binding reactivo de `.active`/`.show` en los shells de F3 sin tocar su DOM.

### Deferred Ideas (OUT OF SCOPE)
- **Deep-links / hash compartible a una ficha** — reflejar la ficha activa en la URL (`#ficha`) para enlaces compartibles. Es una **capacidad nueva** (hoy navegar a ficha hace `preventDefault` y NO toca la URL); rompería la paridad de F5. NO F5.
- Búsqueda/ruta del día → **F6**; mapa → **F7**; fallback de imagen/notas → **F7**; pixel-diff total → **F8**.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEAT-05 | Navegación a ficha con resaltado + botón "volver" (pila) que restaura el scroll, y scrollspy de pastillas con el mismo offset | `useCardNavigation` singleton (§Standard Stack, §Code Examples) porta `navigateToCard`/`goBack`/`navStack` (index.html:6382-6409) y `updateActivePill` (6488-6501). La intercepción de enlaces internos se resuelve con un listener delegado en la raíz que sobrevive al `onClick` propio de `NuxtLink` (§Common Pitfalls — Pitfall 1, el hallazgo crítico de la fase). El binding reactivo de `.active`/`.show`/`@click` cablea los shells F3 sin tocar su DOM (§Architecture Patterns). |
</phase_requirements>

## Summary

Esta es una **migración de paridad**, no diseño nuevo: los tres comportamientos ya existen en `index.html` como JS de app (navegación con pila 6382-6409, scrollspy 6488-6501, intercepción de enlaces 6420-6429) y CONTEXT.md ya bloqueó toda la arquitectura (D-01..D-05). La investigación no re-decide nada; surfacea el **conocimiento de implementación** que el planner necesita para portar correctamente a Vue 3.5 / Nuxt 4 SSG. El patrón de andamiaje ya está establecido y probado en el repo: `useTripModes` (F4) es el precedente exacto de un composable singleton `useState` con accesor puro + controller de efectos en `onMounted`; `useCardNavigation` lo replica.

**El hallazgo crítico** — verificado leyendo el código fuente instalado, no docs — es la interacción entre la delegación de eventos (D-01) y cómo Nuxt Content renderiza los enlaces de prosa. La prosa MDC genera enlaces vía `ProseA`, que renderiza un `<NuxtLink>`. Para un `href="#g-fortunata"` (hash puro, modo history que es el default del proyecto), `NuxtLink` **renderiza un `<a>` plano** (no un `RouterLink`) — bien, porque `closest('a[href^="#"]')` lo encontrará — **pero adjunta su propio `onClick` que llama `event.preventDefault()` y hace `el.focus()` sin scroll suave**. Como los handlers `@click` de Vue se adjuntan a un raíz delegado por Vue y el handler de `NuxtLink` está en el propio `<a>`, el orden de burbujeo del DOM hace que **el handler de `NuxtLink` (en el `<a>`) se ejecute ANTES que un listener delegado nativo en un ancestro**. Esto es load-bearing y dicta cómo montar el listener de F5 (ver Pitfall 1).

**Primary recommendation:** Crear `app/composables/useCardNavigation.ts` como singleton `useState` (accesor puro `useCardNavigation()` + `useCardNavigationController()` para los efectos, calcado de `useTripModes`); montar el listener de click delegado y el de scroll **con `addEventListener` nativo en `onMounted`** dentro del controller (NO con `@click` de Vue en un wrapper), porque un listener nativo en `document`/raíz captura los clics de los `<a>` de NuxtLink de forma fiable y permite el patrón verbatim `closest()` de D-01; en `goBack`/`navigateToCard` portar literalmente el `scrollIntoView`/`scrollTo` del original; cablear `.active`/`.show`/`@click` en los shells F3 por props/binding reactivo sin tocar su markup.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Estado de navegación (`navStack`, `activeSection`) | Browser / Client (composable singleton `useState`) | — | Estado de UI puramente cliente; el prerender SSG emite el default (pila vacía, sin sección activa) y el cliente lo hidrata sin mismatch |
| Listener de click delegado (intercepción de enlaces a ficha) | Browser / Client (`onMounted`) | — | Requiere `document`/DOM real y `window.scrollY`; no existe en SSR. Es un efecto secundario, va en el controller que se monta una vez |
| Listener de `scroll` (scrollspy) | Browser / Client (`onMounted`) | — | `window.scroll` + `offsetTop` son APIs de navegador; cero relación con datos o servidor |
| Scroll suave + resaltado (`scrollIntoView`, `.highlight`) | Browser / Client | — | Manipulación de DOM/scroll nativa, replicada 1:1 del original |
| Binding `.active`/`.show`/`@click` | Frontend (componente Vue, reactivo) | Browser / Client (estado del composable) | Los shells F3 (`NavPills`/`BackButton`) son SSR-renderizados; las clases reactivas se derivan del estado cliente del composable y se aplican declarativamente |
| Discriminación ficha-vs-sección (`monById`) | Frontend (datos de `useTrip`) | — | El índice ya está construido en prerender por `useTrip` (F3); el listener lo consulta en cliente |

**Nota:** NINGUNA capacidad de esta fase pertenece al servidor/API ni a CDN/storage. Es 100% comportamiento de cliente sobre un sitio estático. Esto confirma la disciplina `client-only`/`onMounted` de D-01 y el patrón heredado de F3/F4.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuxt (auto-imports: `useState`, `onMounted`, `onUnmounted`, `computed`, `watch`) | 4.4.8 (instalado) | Composable singleton + ciclo de vida client-only | Mismo runtime que usa `useTripModes` (F4). `useState` da un singleton por clave SSR-safe sin filtración entre requests. `[VERIFIED: node_modules/nuxt/package.json]` |
| vue (Composition API, `<script setup>`) | 3.5.x (transitiva de Nuxt 4) | Reactividad (`ref`/`computed`) y binding declarativo de clases | La gestiona Nuxt; no fijar a mano. `[CITED: CLAUDE.md Recommended Stack]` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useTrip().monById` (F3, existente) | n/a (código del repo) | Índice `Map<slug, Monument>` — discrimina ficha vs sección | El listener delegado lo consulta: `monById.value.has(id)` → es ficha → interceptar. Reemplaza el `querySelectorAll('.card')` del original (anti-patrón DOM-scan, CLAUDE.md §"Buscar scrapeando el DOM") |
| vitest | 4.1.9 (instalado, devDep) | Tests unitarios de la lógica pura del composable | Para `navStack` push/pop, el selector `scrollY+130 ≥ offsetTop` last-wins, y la discriminación ficha-vs-sección — extraídos como funciones puras `[VERIFIED: package.json]` |
| @playwright/test | 1.61.0 (instalado, devDep) | Tests de comportamiento/integración (intercepción de click, binding `.active`/`.show`) | Patrón autocontenido de `tests/parity` (build+serve propio bajo `/guiaRoma/`) `[VERIFIED: package.json]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Listener `addEventListener('click')` nativo en `onMounted` (raíz/document) | `@click` de Vue en un `<div>` wrapper en `TripView` | **Rechazado por D-01 + Pitfall 1.** Un `@click` de Vue delegado por el framework se enreda con el `onClick` propio que `NuxtLink` adjunta al `<a>`; un listener nativo en `document` (fase de burbuja) ofrece el patrón `e.target.closest('a[href^="#"]')` verbatim del análisis de CONTEXT.md y se ordena de forma predecible respecto al handler de NuxtLink |
| Singleton vía `useState` | `ref` a nivel de módulo | **Preferir `useState`** (Claude's Discretion lo dice explícitamente): precedente `useTripModes`, SSR-safe, sin riesgo de filtración de estado entre requests de prerender. Un `ref` de módulo es un singleton mutable global que en SSR se compartiría entre peticiones |
| `@nuxt/test-utils` + `mountSuspended` para componentes | Playwright autocontenido (patrón `tests/parity`) | CLAUDE.md menciona `@nuxt/test-utils`, pero **NO está instalado** y F3/F4 establecieron el patrón de validar componentes/integración con Playwright autocontenido en su lugar (STATE.md decisiones F3/F4). Mantener ese patrón evita añadir una dependencia y un runtime de test nuevos a mitad de proyecto. Ver §Validation Architecture |

**Installation:**
```bash
# NINGUNA dependencia nueva. Esta fase usa solo el runtime de Nuxt 4 ya instalado
# (auto-imports useState/onMounted/computed/watch), Vitest 4.1.9 y Playwright 1.61.0,
# todos presentes en package.json. NO se instala @nuxt/test-utils (ver §Standard Stack).
```

**Version verification:** Verificado contra `node_modules` instalado, no contra training data:
- `nuxt@4.4.8` — `[VERIFIED: node_modules/nuxt/package.json]`
- `@nuxt/content@3.14.0` — `[VERIFIED: node_modules/@nuxt/content/package.json]`
- `@nuxtjs/mdc@0.22.0` (transitiva de @nuxt/content; provee `ProseA`) — `[VERIFIED: node_modules/.pnpm/@nuxtjs+mdc@0.22.0]`
- `vitest@4.1.9`, `@playwright/test@1.61.0` — `[VERIFIED: package.json]`

## Package Legitimacy Audit

> Esta fase **NO instala ningún paquete externo**. Es código de aplicación puro sobre dependencias ya presentes y auditadas en fases anteriores. No aplica slopcheck.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| (ninguno) | — | — | — | — | — | N/A — sin instalación |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

Todas las dependencias usadas (nuxt, @nuxt/content/@nuxtjs/mdc, vitest, @playwright/test) ya fueron instaladas y verificadas en F1/F2 y figuran en `package.json` con versiones fijadas.

## Architecture Patterns

### System Architecture Diagram

```
                          ┌─────────────────────────────────────────────┐
                          │  app/composables/useCardNavigation.ts        │
                          │  (singleton via useState — SSR-safe)         │
                          │                                              │
                          │   navStack: number[]   (scrollY positions)  │
                          │   activeSection: Ref<string>                │
                          │   canGoBack = computed(navStack.length > 0)  │
                          │                                              │
                          │   navigateToCard(id, event?)  ◄──────────┐  │
                          │   goBack()                               │  │
                          └──────┬───────────────────────┬──────────┼──┘
                                 │ reads                  │ reads    │ called by
                                 │ activeSection          │ canGoBack│ 3 consumers
                 ┌───────────────▼──────┐   ┌─────────────▼───────┐  │
                 │ NavPills.vue (F3)    │   │ BackButton.vue (F3) │  │
                 │  :class active per   │   │  :class show        │  │
                 │  href===#activeSec   │   │  @click goBack      │  │
                 └──────────────────────┘   └─────────────────────┘  │
                                                                      │
   ┌──────────────────────────────────────────────────────────┐     │
   │  useCardNavigationController()  (called ONCE in TripView)  │     │
   │  onMounted:                                               │     │
   │                                                          │     │
   │   1. document/root.addEventListener('click', delegate)──────────┤ CONSUMER 1 (F5):
   │        e.target.closest('a[href^="#"]')                   │     │   prose MDC links
   │        → id = href.slice(1)                               │     │   (<a> from ProseA)
   │        → if monById.has(id): preventDefault + navigate ───┘     │   + tl-title links
   │                                                                 │
   │   2. window.addEventListener('scroll', updateActivePill,        │   CONSUMER 2 (F6):
   │        { passive: true })                                       │   search dropdown
   │        → y = scrollY + 130; last <section> w/ offsetTop≤y       │   (→ navigateToCard)
   │        → activeSection.value = current                          │
   │                                                                 │   CONSUMER 3 (F7):
   │   3. updateActivePill()  (initial calc, mirrors init())         │   map popups
   │                                                                 │   (→ navigateToCard)
   │  onUnmounted: removeEventListener (cleanup)                     │
   └────────────────────────────────────────────────────────────────┘

   DATA FLOW for a prose-link click on "[Fortunata](#g-fortunata)":
   user click → <a href="#g-fortunata"> (NuxtLink renders plain <a> for hash, history mode)
     → [Pitfall 1] NuxtLink's own onClick fires on the <a>: preventDefault + el.focus()
     → event bubbles to document → delegate listener fires
     → closest('a[href^="#"]') = the <a>; id="g-fortunata"
     → monById.has("g-fortunata") === true → it's a ficha
     → navigateToCard("g-fortunata", event):
         navStack.push(window.scrollY)
         el = document.getElementById("g-fortunata")   (= <article id> from MonumentCard)
         el.scrollIntoView({behavior:'smooth', block:'start'})
         el.classList.add('highlight'); setTimeout(remove, 2500)
         (canGoBack flips true → BackButton .show appears)
```

El diagrama muestra el flujo de un clic de prosa de extremo a extremo. El mapeo fichero→implementación está en la tabla de Component Responsibilities abajo.

### Component Responsibilities

| File | Action | Responsibility |
|------|--------|----------------|
| `app/composables/useCardNavigation.ts` | **NUEVO** | Accesor puro `useCardNavigation()` (lee `useState`, devuelve `navStack`/`activeSection`/`canGoBack`/`navigateToCard`/`goBack`) + `useCardNavigationController()` (registra listeners en `onMounted`, cleanup en `onUnmounted`). Calcado de `useTripModes.ts` |
| `app/components/TripView.vue` | **MODIFICAR** | Invoca `useCardNavigationController()` UNA vez (es el dueño de la página, ya montado una vez). Es el host natural del listener delegado y de scroll |
| `app/components/NavPills.vue` | **MODIFICAR** | Bind `:class="{ active: pill.href === '#'+activeSection }"` a cada `.nav-pill`. NO reestructura el markup |
| `app/components/BackButton.vue` | **MODIFICAR** | `:class="{ show: canGoBack }"` + `@click="goBack"`. NO reestructura el markup |
| `app/composables/useTrip.ts` | leer (existente) | Provee `monById` que el listener consulta para discriminar ficha/sección |
| `app/components/MonumentCard.vue` | leer (existente) | Renderiza `<article :id="monument.slug" class="card">` (el target del scroll) y la prosa MDC cuyos `<a>` se interceptan |
| `app/components/TimelineStop.vue` | leer (existente) | Renderiza `<a :href="'#'+row.ref" class="tl-title">` (otro enlace interceptado por la misma delegación) |

### Recommended Project Structure
```
app/
├── composables/
│   ├── useTrip.ts              # existente — provee monById
│   ├── useTripModes.ts         # existente — PRECEDENTE a copiar
│   └── useCardNavigation.ts    # NUEVO — singleton + controller
├── components/
│   ├── TripView.vue            # MODIFICAR — invoca el controller
│   ├── NavPills.vue            # MODIFICAR — :class active
│   └── BackButton.vue          # MODIFICAR — :class show + @click
tests/
├── unit/
│   └── cardNavigation.spec.ts  # NUEVO — lógica pura (navStack, scrollspy selector, discriminador)
└── parity/
    └── navigation.spec.ts      # NUEVO — comportamiento (intercepción, .active, .show, restaura scroll)
```

### Pattern 1: Composable singleton — accesor puro + controller de efectos
**What:** Separar el estado (singleton `useState`, idempotente, llamable desde cualquier componente) de los efectos secundarios (listeners, `onMounted`/`onUnmounted`), que se registran UNA sola vez desde el componente que se monta una vez.
**When to use:** Siempre que un composable singleton tenga listeners de eventos o suscripciones — para no registrarlos N veces (una por instancia consumidora).
**Example:**
```typescript
// Source: app/composables/useTripModes.ts (repo, F4) — PRECEDENTE EXACTO
export function useTripModes() {                       // ACCESOR PURO
  const pace = useState<...>('pace', () => 'optimistic')
  // ... solo lee useState y devuelve refs/métodos puros
  return { pace, light, resumen, isVisible }
}
export function useTripModesController() {              // EFECTOS, llamado 1 vez (TheHero)
  const { pace, light, resumen } = useTripModes()
  watch(light, on => { if (on) pace.value = 'slow' })
  useHead({ bodyAttrs: { class: computed(() => ...) } })
  onMounted(() => { /* restore localStorage + register watches */ })
}
```
`useCardNavigation` replica esta estructura: `useCardNavigation()` (puro, lo llaman `NavPills`/`BackButton`/futuros F6/F7) + `useCardNavigationController()` (los listeners de click/scroll, llamado solo en `TripView`).

### Pattern 2: Default = HTML prerenderizado (cero mismatch de hidratación)
**What:** El estado inicial del `useState` debe ser EXACTAMENTE lo que el prerender SSG emite: `navStack = []` (botón oculto, sin `.show`) y `activeSection = ''` (ninguna pastilla `.active`). El cálculo real (`updateActivePill()` inicial) corre en `onMounted`, en cliente.
**When to use:** Todo estado de UI client-only en SSG. Es la disciplina de F3 (tema) y F4 (modos).
**Why:** El markup SSR de `NavPills`/`BackButton` ya es "sin `.active`/sin `.show`" (los shells F3 se renderizan así). Si `activeSection` tuviera un valor por defecto no-vacío, el primer paint marcaría una pastilla que el HTML prerenderizado no marca → mismatch. Mantener el default vacío = paridad de hidratación por construcción.

### Pattern 3: Listener nativo en `onMounted`, cleanup en `onUnmounted`
**What:** Registrar `document.addEventListener('click', ...)` y `window.addEventListener('scroll', ..., { passive: true })` dentro de `onMounted`; guardar las referencias y removerlas en `onUnmounted`.
**When to use:** Listeners globales sobre `window`/`document` en un componente Nuxt.
**Example:**
```typescript
// Patrón estándar Vue 3 / Nuxt para listeners globales con limpieza
onMounted(() => {
  document.addEventListener('click', onDelegatedClick)
  window.addEventListener('scroll', updateActivePill, { passive: true })
  updateActivePill()   // cálculo inicial (mirror de init() index.html:6655)
})
onUnmounted(() => {
  document.removeEventListener('click', onDelegatedClick)
  window.removeEventListener('scroll', updateActivePill)   // misma referencia de función
})
```
**Nota:** el original (index.html) NUNCA limpia los listeners (la página vive para siempre). En Nuxt, `TripView` se monta una vez por sesión SSG y técnicamente tampoco se desmonta en la navegación por anclas, pero `onUnmounted` es **higiene defensiva** barata (HMR en dev, futura navegación entre `/trips/[slug]`) — incluirlo. El `{ passive: true }` del scroll es PARIDAD EXACTA con index.html:6501 (no es solo rendimiento, es el contrato verbatim).

### Anti-Patterns to Avoid
- **DOM-scan `bindCardLinks` (querySelectorAll + dataset.bound):** lo que hace el original (index.html:6420-6429). D-01 lo PROHÍBE explícitamente: raspar el DOM es anti-patrón en SSR/SSG (CLAUDE.md §"Buscar scrapeando el DOM") y hay que re-escanear tras cada cambio reactivo. La delegación con `closest()` + `monById` lo reemplaza con un solo listener que cubre prosa MDC + `tl-title` + (futuro) búsqueda/mapa.
- **`ProseA.global.vue` para interceptar:** afectaría TODOS los enlaces de prosa (incluidos los que NO son fichas, p. ej. enlaces a secciones dentro de la prosa) y F4 ya documentó que la prosa MDC no es uniforme (Pitfall 1 de F4: un override global rompió la paridad de los 13 artistas). D-01 lo descarta.
- **`@click` de Vue en un wrapper para la delegación:** ver Pitfall 1 — el `onClick` propio de `NuxtLink` (en el `<a>`) interfiere; usar `addEventListener` nativo.
- **`IntersectionObserver` para el scrollspy:** D-04 lo PROHÍBE (SC#2). El punto de conmutación de `IntersectionObserver` NO coincide con `scrollY+130 ≥ offsetTop`; cambiaría la pastilla activa en un scroll distinto → rompe la paridad.
- **Tocar/reestructurar el DOM de `NavPills`/`BackButton`:** D-bloqueado — F5 solo añade bindings reactivos. Cambiar el markup arriesga la paridad visual (golden de F1) y rompe el patrón F3→F4.
- **`<style scoped>` en cualquier componente modificado:** prohibido en todo el proyecto (un `data-v-*` rompería selectores globales como `.nav-pill.active`, `.card.highlight`). Cero CSS nuevo.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Compartir estado de navegación entre componentes | Un bus de eventos custom o props drilling de `navStack` por todo el árbol | `useState('cardNav', ...)` singleton (patrón `useTripModes`) | Nuxt da el singleton SSR-safe gratis; un `ref` de módulo se filtraría entre requests de prerender |
| Discriminar ficha vs sección | Re-`querySelectorAll('.card')` (lo del original) | `useTrip().monById.value.has(id)` | El índice ya está construido en prerender por F3; consultar un `Map` es O(1) y no toca el DOM (CLAUDE.md §"no DOM") |
| Scroll suave a un elemento | Cálculo manual de `offsetTop` + `requestAnimationFrame` de interpolación | `el.scrollIntoView({behavior:'smooth', block:'start'})` (verbatim del original) y `window.scrollTo({top, behavior:'smooth'})` para volver | API nativa del navegador, ya usada por el original 1:1; reimplementarla es regresión de paridad asegurada |
| Reactividad de las clases CSS | `el.classList.toggle('active')` imperativo (lo del original) sobre los nodos de NavPills | `:class="{ active: ... }"` declarativo bindeado a `activeSection` | El original es imperativo porque era vanilla JS; en Vue el binding declarativo es la vía correcta y mantiene el DOM como función del estado. (El `.highlight` de la ficha SÍ es imperativo `classList.add/remove` porque la ficha es contenido renderizado por MDC fuera del control directo de un `:class`, y el timing de 2500ms es transitorio — ver Code Examples) |

**Key insight:** Casi todo el "trabajo" de esta fase ya existe como 30 líneas de JS probado en `index.html`. El valor de la migración NO es reescribir la lógica (es idéntica) sino (1) envolverla en el patrón de composable singleton correcto y (2) resolver la única fricción nueva que introduce Nuxt: que los enlaces de prosa son `NuxtLink` con su propio `onClick` (Pitfall 1). No inventar abstracciones; portar la lógica verbatim dentro del andamiaje establecido.

## Runtime State Inventory

> Aplica parcialmente: F5 no renombra ni migra datos, pero introduce un nuevo `localStorage`/estado de runtime potencial y reusa claves. Se documenta para descartar sorpresas.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **Ninguno.** F5 NO persiste nada. `navStack` es estado **en memoria** (se pierde al recargar — paridad exacta con index.html:6382 `const navStack = []`). NO usa localStorage. | Ninguna |
| Live service config | **Ninguno** — sitio estático, sin servicios externos. | Ninguna |
| OS-registered state | **Ninguno.** | Ninguna |
| Secrets/env vars | **Ninguno.** F5 no lee env vars. | Ninguna |
| Build artifacts | **Ninguno nuevo.** El composable se compila como cualquier otro auto-import; no genera artefactos especiales. | Ninguna |

**Confirmación explícita:** F5 es puramente código de cliente sobre estado efímero en memoria. NO hay deep-link/hash en URL (D-03: `preventDefault` — la URL no cambia al navegar a ficha), por lo que **no hay estado de URL** que migrar ni que sincronizar. La pila vive y muere con la sesión de la página, idéntico a hoy.

## Common Pitfalls

### Pitfall 1: NuxtLink intercepta el clic ANTES que el listener delegado (EL hallazgo crítico de la fase)
**What goes wrong:** La prosa MDC genera sus enlaces vía `ProseA`, que renderiza un `<NuxtLink>` (verificado: `node_modules/.pnpm/@nuxtjs+mdc@0.22.0/.../ProseA.vue` es literalmente `<NuxtLink :href><slot/></NuxtLink>`). Para un `href="#g-fortunata"` en modo history (el default del proyecto — `nuxt.config.ts` no activa hash mode), `NuxtLink`:
1. Renderiza un **`<a>` plano** (no un `RouterLink`): la condición de NuxtLink es `isHashLinkWithoutHashMode = !hashMode && link.startsWith("#")` → cae a la rama `h("a", {...})` (verificado en `nuxt/dist/app/components/nuxt-link.js:32,283,358`). **Bien:** `e.target.closest('a[href^="#"]')` SÍ lo encontrará.
2. **PERO** ese `<a>` lleva un `onClick` propio (línea 364) que hace `event.preventDefault()` (368), `router.push(encodedHref)` (371) y, en el `finally`, `document.getElementById(hash)?.focus()` (380-381) — **enfoca el elemento sin scroll suave**.

Si F5 monta su intercepción como un `@click` de Vue en un wrapper, compite de forma frágil con el `onClick` del `<a>`. Peor: si NO se intercepta correctamente, el resultado es el comportamiento de NuxtLink (focus sin scroll suave, sin `.highlight`, sin pila) en lugar del comportamiento de paridad.

**Why it happens:** Los handlers `@click` de plantilla en Vue 3 se delegan a un nodo raíz por el runtime de Vue; el `onClick` que NuxtLink pone va directo en el `<a>`. En el modelo de eventos del DOM, un handler en el elemento objetivo (`<a>`) se ejecuta en la fase de burbuja ANTES de llegar a un listener nativo de burbuja en un ancestro (`document`).

**How to avoid:** Montar el listener de F5 como `document.addEventListener('click', onDelegatedClick)` **nativo** (no `@click` de Vue), en `onMounted`. En `onDelegatedClick`:
```typescript
function onDelegatedClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest('a[href^="#"]')
  if (!a) return
  const id = a.getAttribute('href')!.slice(1)
  if (!monById.value.has(id)) return        // sección → salto nativo (D-02)
  e.preventDefault()                         // D-03: la URL no cambia
  navigateToCard(id, e)
}
```
El `e.preventDefault()` del listener de F5 cancela la navegación por defecto. Respecto al `onClick` de NuxtLink: como ambos hacen `preventDefault`, **el navegador no salta de todas formas**; lo que importa es que `navigateToCard` (scroll suave + highlight + pila) se ejecute. El `el.focus()` de NuxtLink es inocuo (enfocar el `<article>` no mueve el scroll de forma conflictiva tras un `scrollIntoView` smooth) pero si se observa un salto, usar `e.stopImmediatePropagation()` en el handler de F5 NO ayuda (el handler de NuxtLink ya corrió en el `<a>` antes de llegar a `document`). La opción robusta si hubiera conflicto observable: registrar el listener de F5 en **fase de captura** (`addEventListener('click', onDelegatedClick, true)`) — captura corre ANTES que el `onClick` de burbuja de NuxtLink, permitiendo `e.preventDefault()` + `e.stopPropagation()` para cortar el handler de NuxtLink por completo. **El planner debe verificar empíricamente** cuál de las dos (burbuja simple vs captura) reproduce la paridad exacta; la captura es el seguro.

**Warning signs:** Al hacer clic en un enlace de prosa: la página enfoca/salta a la ficha pero (a) sin animación suave, (b) sin el borde `.highlight`, o (c) el botón "volver" no aparece. Cualquiera de los tres = el listener de F5 no está ganando el clic.

### Pitfall 2: `getElementById(id)` debe resolver al `<article>` de la ficha, no a un nodo de NuxtLink
**What goes wrong:** `navigateToCard` hace `document.getElementById(id)`. El `id` proviene del `href` (`#g-fortunata`). El elemento con ese id es `<article :id="monument.slug" class="card">` (MonumentCard.vue:112). Confirmar que el `slug` del dato == el `id` del `href` del enlace.
**Why it happens:** El ancla estable es `slug` (D-bloqueado). `useTrip().monById` está keyed por `slug`, los `<article>` llevan `:id="monument.slug"`, y los enlaces de prosa/`tl-title` usan `#${ref}` donde `ref` == slug. La cadena es coherente por construcción de F2/F3/F4, pero un slug mal escrito en un dato rompería silenciosamente la navegación (el `if (el)` del original simplemente no haría nada).
**How to avoid:** El `if (el)` guard del original (index.html:6395) se porta verbatim — si el id no resuelve, no-op (sin error). Los tests de datos de F2 (cross-refs en `invariants.spec`) ya garantizan que todo `ref` de timeline/prosa apunta a un slug existente, así que en la práctica siempre resuelve. No añadir lógica nueva; portar el guard.
**Warning signs:** Un enlace de prosa específico no navega mientras los demás sí → slug del dato no coincide con ningún `<article id>`.

### Pitfall 3: `<section>` vacías y el orden de `offsetTop` para el scrollspy
**What goes wrong:** El scrollspy itera `document.querySelectorAll('section')` y elige la última con `offsetTop ≤ scrollY+130`. F3 dejó las 11 secciones no-`#inicio` como `<section id>` reales (algunas vacías, p. ej. `#mapa`). Si una sección tuviera altura cero o un `offsetTop` inesperado, la conmutación de pastilla se desviaría.
**Why it happens:** STATE.md (decisión F3) documenta que las secciones vacías se dejaron SIN altura fija a propósito, precisamente para no desplazar los `offsetTop` y no romper este scrollspy. El `scroll-padding-top:124px` + el `+130` están calibrados a esa geometría.
**How to avoid:** NO tocar la geometría de las secciones. Portar `updateActivePill` literal (iterar TODAS las `<section>`, last-wins). El `+130 > 124` es load-bearing (comentario verbatim index.html:6489-6491): si alguien lo "redondea" a 124, la conmutación se adelanta ~24px y marca la pastilla anterior.
**Warning signs:** Al hacer scroll, la pastilla activa cambia ~24px antes o después de lo que hace el `index.html` original (comparar contra el golden / la versión viva).

### Pitfall 4: Registrar los listeners más de una vez
**What goes wrong:** Si `useCardNavigationController()` (o el registro de listeners) se llamara desde cada componente consumidor en vez de una sola vez, habría N listeners de click y N de scroll → `navigateToCard` se dispararía varias veces, la pila se corrompería, el scrollspy haría trabajo redundante.
**Why it happens:** Es exactamente el bug que `useTripModes` resolvió separando accesor puro de controller (STATE.md F4: "~65 watches del acoplamiento... ~65 onMounted"). `useCardNavigation()` (puro) lo pueden llamar `NavPills`, `BackButton` y los futuros F6/F7 sin efectos; `useCardNavigationController()` (los listeners) se llama SOLO en `TripView`.
**How to avoid:** Replicar la separación de `useTripModes`/`useTripModesController` al pie de la letra. El controller solo en `TripView` (que se monta una vez).
**Warning signs:** Tras navegar a una ficha y volver, la pila tiene más entradas de las esperadas; o `goBack` salta dos posiciones.

### Pitfall 5: `block: 'start'` + cabecera fija — el scroll-padding ya lo cubre
**What goes wrong:** `scrollIntoView({block:'start'})` alinea el top del elemento con el top del viewport, lo que normalmente lo metería bajo la cabecera fija. El original confía en `html { scroll-padding-top: 124px }` (base.css:3) para compensar.
**Why it happens:** `scroll-padding-top` SÍ afecta a `scrollIntoView` (no solo a la navegación por anclas nativa). El original ya depende de esto y funciona.
**How to avoid:** Portar `scrollIntoView({behavior:'smooth', block:'start'})` verbatim (index.html:6396). El CSS `scroll-padding-top:124px` ya está en `base.css` (F1, verbatim). NO añadir offsets manuales — duplicaría la compensación.
**Warning signs:** La ficha aparece 124px demasiado abajo (doble compensación) o bajo la cabecera (sin compensación) tras navegar.

## Code Examples

Patrones verificados — el original es la fuente de verdad de la paridad.

### Lógica de navegación + pila (port verbatim de index.html:6382-6409)
```typescript
// Source: index.html:6382-6409 (FUENTE DE VERDAD), envuelto en el patrón singleton
// app/composables/useCardNavigation.ts (sketch — el planner detalla)
export function useCardNavigation() {
  const navStack = useState<number[]>('cardNav:stack', () => [])          // [] = default prerenderizado
  const activeSection = useState<string>('cardNav:activeSection', () => '')
  const canGoBack = computed(() => navStack.value.length > 0)             // → BackButton .show

  function navigateToCard(id: string, event?: Event) {
    if (event) event.preventDefault()                                    // D-03: la URL no cambia (6391)
    navStack.value.push(window.scrollY)                                  // 6393
    const el = document.getElementById(id)
    if (el) {                                                            // guard verbatim (6395)
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })          // 6396
      el.classList.add('highlight')                                      // 6397
      setTimeout(() => el.classList.remove('highlight'), 2500)           // 6398 — 2500ms exacto
    }
  }

  function goBack() {
    const prev = navStack.value.pop()                                    // 6404
    if (typeof prev === 'number') {
      window.scrollTo({ top: prev, behavior: 'smooth' })                 // 6406
    }
  }

  return { navStack, activeSection, canGoBack, navigateToCard, goBack }
}
```
Nota: `canGoBack` reactivo reemplaza el `updateBackBtn()` imperativo del original (6385-6388) — el binding `:class="{ show: canGoBack }"` en `BackButton` se actualiza solo cuando `navStack.length` cambia. **Detalle de reactividad Vue:** `navStack.value.push(...)` muta el array; con `useState` (que es un `ref`), `.push` ES reactivo en Vue 3 para arrays (el ref envuelve el array y Vue rastrea la mutación a través del proxy reactivo). El `computed(canGoBack)` se recalcula. Verificar en el test que `.show` aparece tras el primer `navigateToCard`.

### Scrollspy (port verbatim de index.html:6488-6501)
```typescript
// Source: index.html:6488-6501 (FUENTE DE VERDAD). Lógica pura extraíble para test unitario.
function computeActiveSection(scrollY: number, sections: { id: string, offsetTop: number }[]): string {
  const y = scrollY + 130                          // +130 > scroll-padding-top:124px (6489-6491, load-bearing)
  let current = ''
  for (const s of sections) {
    if (y >= s.offsetTop) current = s.id           // LAST que cumple gana (6494-6496)
  }
  return current
}
// En el controller (onMounted), conectado al DOM real:
function updateActivePill() {
  const sections = Array.from(document.querySelectorAll('section'))
    .map(s => ({ id: s.id, offsetTop: (s as HTMLElement).offsetTop }))
  activeSection.value = computeActiveSection(window.scrollY, sections)
}
window.addEventListener('scroll', updateActivePill, { passive: true })   // 6501 — {passive:true} verbatim
```
La separación `computeActiveSection` (pura) / `updateActivePill` (DOM) permite testear el algoritmo last-wins en Vitest plano sin navegador (ver §Validation Architecture). El binding `.active` en `NavPills`: `:class="{ active: ('#'+activeSection) === pillHref }"`.

### Binding reactivo en los shells F3 (sin tocar su DOM)
```vue
<!-- NavPills.vue (MODIFICAR) — añadir SOLO el :class, markup intacto -->
<!-- antes (F3):  <a href="#inicio" class="nav-pill">Inicio</a> -->
<!-- después (F5): -->
<a href="#inicio" class="nav-pill" :class="{ active: activeSection === 'inicio' }">Inicio</a>
<!-- para las pastillas de día (v-for), comparar contra d.slug -->
<a v-for="d in props.days" :key="d.slug" :href="`#${d.slug}`" class="nav-pill"
   :class="{ active: activeSection === d.slug }">{{ dayLabel(d.eyebrow) }}</a>
```
```vue
<!-- BackButton.vue (MODIFICAR) — añadir :class + @click, markup intacto -->
<button id="back-btn" class="back-btn" :class="{ show: canGoBack }" aria-label="Volver" @click="goBack">
  <span class="back-btn-arrow">←</span> Volver
</button>
```
El `activeSection`/`canGoBack`/`goBack` vienen de `const { activeSection, canGoBack, goBack } = useCardNavigation()` en el `<script setup>` de cada componente (accesor puro, sin efectos).

## State of the Art

| Old Approach (index.html) | Current Approach (Nuxt 4) | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `bindCardLinks()` con `querySelectorAll('.card')` + `dataset.bound` por enlace | Listener delegado único + `monById` (D-01) | F5 (esta fase) | Un solo listener cubre prosa MDC + timeline + futuros; sin re-escaneo del DOM tras renders reactivos |
| `updateBackBtn()` imperativo (`classList.add/remove('show')`) | `canGoBack` computed + `:class` reactivo | F5 | El DOM es función del estado; sin sincronización manual |
| `classList.toggle('active')` sobre nodos NavPills | `:class="{ active }"` declarativo sobre `activeSection` | F5 | Idem — declarativo |
| Enlaces de prosa = `<a>` plano del HTML | Enlaces de prosa = `<NuxtLink>` (vía `ProseA`) que renderiza `<a>` con `onClick` propio | F4 (MDC) → F5 lidia con ello | **Pitfall 1** — la delegación debe ganar el clic frente al `onClick` de NuxtLink |
| Funciones globales (`navigateToCard`, `goBack` en `window`) llamadas por `onclick="..."` inline | Composable singleton; consumidores importan `useCardNavigation()` | F5 | F6 (búsqueda) y F7 (mapa) enchufan vía el API en vez de funciones globales (D-05) |

**Deprecated/outdated:**
- El `highlightCard` alias legacy (index.html:6412-6417) NO se porta — era para `onclick` inline antiguos que ya no existen en la versión data-driven. CONTEXT.md lo lista como "alias legacy"; omitirlo.
- DOM-scan para buscar/discriminar fichas — reemplazado por `monById` (índice de datos), alineado con CLAUDE.md §"indexar datos, no DOM".

## Assumptions Log

> Claims tagged `[ASSUMED]` que necesitan confirmación. La mayoría de esta fase está VERIFICADA contra el código fuente instalado (la fuente más fuerte para un port de paridad).

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | El orden burbuja-simple del listener delegado vs el `onClick` de NuxtLink basta para la paridad; la captura es el seguro si hay conflicto observable | Pitfall 1 | BAJO — el planner debe verificar empíricamente cuál reproduce la paridad; ambas opciones están documentadas, solo falta confirmar cuál (test de Playwright lo decide). NO es un riesgo de diseño, es una decisión de implementación a validar |
| A2 | `navStack.value.push()` sobre un `useState`-ref de array dispara la reactividad de `canGoBack` en Vue 3 | Code Examples | BAJO — comportamiento estándar de refs de array en Vue 3 (el ref envuelve el array en un proxy reactivo que rastrea mutaciones). El test de `.show` lo confirma. Si fallara, usar `navStack.value = [...navStack.value, scrollY]` (reasignación) |
| A3 | El `el.focus()` que NuxtLink hace tras `router.push` en hash links es inocuo tras un `scrollIntoView` smooth de F5 | Pitfall 1 | BAJO — enfocar un `<article>` no fuerza scroll si ya está (o está a punto de estar) en viewport; la opción de captura lo elimina por completo si molesta |

**Todo lo demás está VERIFIED (código instalado) o CITED (index.html/repo).** La lógica de navegación, scrollspy, las clases CSS, los slugs y el patrón de composable están todos confirmados leyendo los ficheros reales.

## Open Questions

1. **¿Dónde montar exactamente el listener delegado: `document` o el root de `TripView`?**
   - What we know: `TripView` es el dueño de la página y se monta una vez; CONTEXT.md lo nombra candidato. `document` garantiza capturar TODOS los clics de enlace.
   - What's unclear: Si montar en `document` (más amplio, captura cualquier `<a href="#">`) vs en el elemento raíz de `TripView` (más acotado). Ambos funcionan; `document` es más simple y robusto para cubrir prosa + timeline + futuros popups de mapa (que se montan en un portal de Leaflet, posiblemente fuera del subárbol de `TripView`).
   - Recommendation: Montar en `document` (vía `onMounted`/`onUnmounted` en `useCardNavigationController`). Es lo más cercano al `document.querySelectorAll` global del original y a prueba de los popups de Leaflet de F7 (que inyectan HTML fuera del flujo Vue). El planner lo confirma.

2. **¿Necesita `navigateToCard` esperar (`nextTick`) antes de `getElementById` cuando lo llamen F6/F7?**
   - What we know: En F5 los enlaces de prosa ya existen en el DOM al hacer clic, así que `getElementById` resuelve inmediato (igual que el original). F6 (búsqueda) y F7 (mapa) también navegan a fichas YA renderizadas (todas las fichas están en el DOM en SSG).
   - What's unclear: Nada bloqueante para F5. Solo una nota de diseño para D-05.
   - Recommendation: NO añadir `nextTick` — todas las fichas están renderizadas en el SSG estático (no hay carga diferida). El guard `if (el)` cubre el caso degenerado. Mantener el port verbatim.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| nuxt (runtime + auto-imports) | composable, ciclo de vida | ✓ | 4.4.8 | — |
| @nuxt/content / @nuxtjs/mdc | ProseA (enlaces de prosa interceptados) | ✓ | 3.14.0 / 0.22.0 | — |
| vitest | tests unitarios de lógica pura | ✓ | 4.1.9 | — |
| @playwright/test | tests de comportamiento/integración | ✓ | 1.61.0 | — |
| @nuxt/test-utils (`mountSuspended`) | tests de componente aislado (CLAUDE.md lo menciona) | ✗ | — | **Playwright autocontenido** (patrón establecido en F3/F4) — ver §Validation Architecture |

**Missing dependencies with no fallback:** ninguna.
**Missing dependencies with fallback:**
- `@nuxt/test-utils` NO está instalado. CLAUDE.md lo cita como herramienta de test de componente, pero F3/F4 NO lo añadieron y validaron componentes con Playwright autocontenido. **Recomendación: NO instalarlo en F5** — mantener el patrón establecido evita introducir un runtime de test nuevo y una dependencia a mitad de proyecto, y la naturaleza de F5 (comportamiento de DOM/scroll real: scroll suave, intercepción de clic, clases reactivas tras hidratación) se valida MEJOR en un navegador real (Playwright) que en un mount aislado (jsdom no implementa scroll suave ni `scrollIntoView` de forma realista).

## Validation Architecture

> Nyquist validation ENABLED. Cada uno de los 3 success criteria mapea a tests automatizados. El proyecto separa **lógica pura → Vitest (`tests/unit`)** y **comportamiento/integración → Playwright autocontenido (`tests/parity`)** (patrón establecido F2/F3/F4).

### Test Framework
| Property | Value |
|----------|-------|
| Framework (unit) | Vitest 4.1.9 — Node-puro, sin runtime Nuxt (`[VERIFIED: package.json]`) |
| Framework (behavior) | Playwright 1.61.0 — autocontenido (build+serve propio bajo `/guiaRoma/`) (`[VERIFIED: package.json]`) |
| Config file (unit) | `vitest.config.ts` (`include: ['tests/data/**', 'tests/unit/**']`) |
| Config file (behavior) | `playwright.config.ts` + patrón `beforeAll` autocontenido (mirror de `tests/parity/modes.spec.ts`) |
| Quick run command | `pnpm test:unit` (Vitest, `tests/unit`) |
| Full suite command | `pnpm test:unit && pnpm test:golden` (unit + Playwright) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEAT-05 / SC#1 | `navStack` push al navegar; `goBack` pop + restaura scroll | unit | `pnpm test:unit` → `cardNavigation.spec.ts` (push/pop, orden LIFO, `canGoBack` flip) | ❌ Wave 0 |
| FEAT-05 / SC#1 | Navegar a ficha hace scroll suave + `.highlight` 2500ms; "volver" restaura scroll y oculta el botón | behavior | `pnpm test:golden` → `tests/parity/navigation.spec.ts` (click prosa → `.card.highlight` presente, scroll cambia; click "volver" → scroll vuelve, `.back-btn.show` desaparece) | ❌ Wave 0 |
| FEAT-05 / SC#2 | Selector scrollspy `scrollY+130 ≥ offsetTop`, last-section-wins | unit | `pnpm test:unit` → `computeActiveSection(...)` con fixtures de secciones (incl. el caso de borde +130 vs 124) | ❌ Wave 0 |
| FEAT-05 / SC#2 | La pastilla activa conmuta en el mismo punto que hoy; NO usa IntersectionObserver | behavior | `pnpm test:golden` → `navigation.spec.ts` (scroll a un offset → `.nav-pill.active` correcta; assert que el binding es por `scrollY+130`) | ❌ Wave 0 |
| FEAT-05 / SC#2 | Discriminación ficha-vs-sección (interceptar solo fichas) | unit | `pnpm test:unit` → test puro del predicado `monById.has(id)` con un `Map` mock | ❌ Wave 0 |
| FEAT-05 / SC#3 | Enlaces `a[href^="#"]` de prosa MDC se interceptan → `navigateToCard` (no salto nativo, no recarga) | behavior | `pnpm test:golden` → `navigation.spec.ts` (click en un `<a href="#g-...">` de `.card-section` → ficha resaltada + pila; enlace a sección `#reservas` → NO resaltado, salto nativo) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test:unit` (Vitest, rápido — la lógica pura del composable)
- **Per wave merge:** `pnpm test:unit && pnpm test:golden` (incluye el Playwright de comportamiento)
- **Phase gate:** suite completa verde + `pnpm typecheck` + `pnpm lint` antes de `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/cardNavigation.spec.ts` — cubre SC#1 (navStack push/pop/canGoBack), SC#2 (computeActiveSection last-wins + borde +130), discriminador ficha-vs-sección. Requiere extraer la lógica pura del composable (push/pop sobre array, `computeActiveSection`, predicado `has`) a funciones testeables sin DOM — patrón `app/utils/pace.ts` → `tests/unit/pace.spec.ts`.
- [ ] `tests/parity/navigation.spec.ts` — autocontenido (mirror de `tests/parity/modes.spec.ts`: `pnpm generate` una vez, server propio bajo `/guiaRoma/`, tolera SOLO el error de hidratación de color-mode). Cubre SC#1/SC#2/SC#3 en navegador real (scroll suave, `.highlight`, `.active`, `.show`, intercepción de prosa vs salto nativo de sección).
- [ ] Helper de scroll en el spec de Playwright: para SC#2 hay que hacer `page.evaluate(() => window.scrollTo(0, Y))` y luego assert de la pastilla activa — el patrón de interacción ya existe en `modes.spec.ts`.
- No hace falta instalar framework nuevo (Vitest y Playwright ya presentes). NO añadir `@nuxt/test-utils`.

## Security Domain

> ASVS L1 enforcement ON. Severidad esperada: **BAJA** — sitio estático, sin servidor, sin auth, sin input de usuario persistido en esta fase.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Sin auth en 1.0 (Nitro dormido) |
| V3 Session Management | no | Sin sesiones; `navStack` es memoria efímera, no se persiste |
| V4 Access Control | no | Sitio público estático |
| V5 Input Validation | **yes (menor)** | El listener delegado lee `href` de anclas generadas por MDC/prosa. El `href` viene de datos de contenido validados por zod en F2, no de input de usuario en runtime. La validación efectiva es `monById.has(id)`: solo se actúa sobre ids que corresponden a una ficha conocida |
| V6 Cryptography | no | Sin cripto en esta fase |

### Known Threat Patterns for {Vue 3 / Nuxt SSG, client-side navigation}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| El listener delegado lee `href` de un `<a>` y hace `getElementById(href.slice(1))` | Tampering (teórico) | **Mitigado por construcción:** (1) el `href` solo se procesa si `monById.has(id)` — un id arbitrario inyectado en el DOM que NO sea una ficha conocida se ignora (cae a salto nativo, D-02); (2) `getElementById` con un string solo busca un elemento por id, NO es un sink de inyección (no es `innerHTML`, no es `eval`, no es un selector CSS arbitrario); (3) `e.preventDefault()` evita cualquier navegación. El contenido de prosa proviene de los YAML de F2, validados por zod, no de input de usuario en runtime |
| `scrollIntoView`/`scrollTo` sobre un elemento derivado de `href` | DoS (teórico, despreciable) | El peor caso es hacer scroll a una ficha que no es la esperada — sin impacto de seguridad en un sitio estático de solo lectura. `navStack` es un array en memoria acotado por la interacción del usuario (no crece sin límite en uso normal; un usuario tendría que pulsar enlaces miles de veces) |
| Enlaces externos en prosa (si los hubiera) abriendo nuevas pestañas | Reverse tabnabbing | Fuera del alcance de F5 (F5 solo intercepta `a[href^="#"]` internos). Los enlaces externos de prosa los maneja NuxtLink/ProseA con su `rel` por defecto; los enlaces a Google Maps de las fichas ya llevan `rel="noopener"` verbatim (MonumentCard.vue:195, F4). No regresión en F5 |

**Conclusión de seguridad:** La superficie es mínima y ya está acotada por el diseño bloqueado (D-01/D-02/D-03). El predicado `monById.has(id)` + `preventDefault` + el hecho de que `getElementById` no es un sink de inyección hacen que no haya vector explotable. NO se requieren controles nuevos; documentar la postura es suficiente para ASVS L1 en un sitio estático.

## Sources

### Primary (HIGH confidence)
- `node_modules/.pnpm/@nuxtjs+mdc@0.22.0/.../runtime/components/prose/ProseA.vue` — **fuente de verdad** de cómo se renderizan los enlaces de prosa: `<NuxtLink :href><slot/></NuxtLink>`. `[VERIFIED]`
- `node_modules/.pnpm/nuxt@4.4.8/.../dist/app/components/nuxt-link.js` (líneas 32, 55-69, 283, 358-385) — **fuente de verdad** de cómo NuxtLink trata un hash-only href en modo history: `isHashLinkWithoutHashMode` → renderiza `<a>` plano con `onClick` que hace `preventDefault` + `el.focus()`. `[VERIFIED]`
- `index.html` (líneas 6382-6429 navegación+pila+bindCardLinks; 6488-6501 scrollspy; 6649-6659 init) — **fuente de verdad de la paridad**. `[CITED]`
- `app/composables/useTripModes.ts` — precedente exacto del patrón singleton accesor+controller. `[CITED]`
- `app/composables/useTrip.ts` — provee `monById`. `[CITED]`
- `app/components/{NavPills,BackButton,TripView,MonumentCard,TimelineStop}.vue` — shells y enlaces a cablear/interceptar. `[CITED]`
- `app/assets/css/base.css` (1,77-90,694-696,1001-1031) — clases verbatim `.card.highlight`, `.nav-pill.active`, `.back-btn.show`, `scroll-padding-top:124px`. `[VERIFIED]`
- `package.json`, `nuxt.config.ts`, `vitest.config.ts` — versiones instaladas, modo history (sin hash mode), patrón de runners de test. `[VERIFIED]`
- `tests/unit/pace.spec.ts`, `tests/parity/modes.spec.ts` — patrones de test establecidos (lógica pura vs Playwright autocontenido). `[VERIFIED]`

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` (decisiones F3/F4) — confirma el patrón "shell montado en F3, cableado en su fase", la disciplina de hidratación, la decisión de NO usar `@nuxt/test-utils`, y la geometría de secciones vacías que sostiene el scrollspy. `[CITED]`

### Tertiary (LOW confidence)
- Semántica de burbuja de eventos del DOM (handler en el `<a>` corre antes que listener nativo de burbuja en `document`; captura corre antes que burbuja) — conocimiento estándar del modelo de eventos del DOM, confirmado por la lógica observable de NuxtLink. WebSearch no estaba disponible para una cita externa, pero es comportamiento especificado y no controvertido; el planner lo valida empíricamente vía Playwright (A1).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — sin dependencias nuevas; todo verificado contra `node_modules` instalado
- Architecture: HIGH — arquitectura bloqueada en CONTEXT.md (D-01..D-05) + precedente `useTripModes` leído directamente
- Pitfalls: HIGH — el pitfall crítico (NuxtLink/ProseA) verificado leyendo el código fuente instalado, no docs; los demás derivados del original y del repo
- Validation: HIGH — patrón de test establecido en F2/F3/F4, mapeo SC→test directo
- Security: HIGH — superficie mínima, acotada por el diseño bloqueado

**Research date:** 2026-06-21
**Valid until:** 2026-07-21 (estable — versiones fijadas, sin dependencias nuevas; el único riesgo de deriva sería un bump de Nuxt/Content que cambie el render de ProseA o NuxtLink, improbable en parche)
