# Roadmap: guiaRoma — Migración a Nuxt 4

## Overview

guiaRoma es hoy un único `index.html` (6.665 líneas) con la guía de un viaje de 5 días a Roma. Esta 1.0 lo re-plataforma a Nuxt 4 SSG sin cambiar **nada** de lo que el usuario ve o puede hacer: paridad visual y funcional al 100%. El camino sigue la cadena de dependencias del research — primero el andamiaje del proyecto y el **golden de Playwright capturado desde `main` antes de divergir** (la red de seguridad de todo lo demás); luego el **esquema de datos tipado + la migración del contenido** (la raíz de la que derivan 5 de las features); después la capa de página/layout con el tema sin FOUC; el render de fichas, timeline y modos triviales; la **navegación transversal** (`useCardNavigation`) antes que sus tres consumidores; los **derivados de datos** (búsqueda y ruta del día); la **isla client-only** del mapa Leaflet + fallback de imagen + notas (lo más sensible a SSR, al final); y un cierre con la **suite de verificación de paridad** que debe pasar antes de dar la 1.0 por buena. El backend Nitro queda preparado pero dormido; PWA y un segundo viaje real son v2/futuro.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Andamiaje + Golden de paridad** - Proyecto Nuxt 4 en la rama de release, estático bajo `/guiaRoma/`, CSS verbatim, Nitro dormido, y golden de Playwright capturado desde `main` antes de divergir (completed 2026-06-18)
- [ ] **Phase 2: Esquema de datos + migración del contenido** - 6 colecciones zod en Nuxt Content v3 y todo Roma migrado 1:1 a datos tipados, con `day.cards` ordenado y validación que rompe el build
- [ ] **Phase 3: Capa de página, layout y tema** - `useTrip(slug)` + `TripView` renderizando un viaje desde datos, routing multi-viaje, layout/Topbar/NavPills idénticos y tema claro/oscuro sin parpadeo
- [ ] **Phase 4: Render de contenido + modos de ritmo** - Fichas, timeline y secciones de referencia renderizadas desde datos e idénticas a hoy, con selector de ritmo, "caminar menos" y modo resumen
- [ ] **Phase 5: Navegación transversal** - `useCardNavigation` (scroll-a-ficha, pila volver, scrollspy `+130`) consumida de forma única por enlaces, mapa y búsqueda
- [ ] **Phase 6: Derivados de datos — búsqueda y ruta del día** - Búsqueda en cliente sobre los datos y "ruta del día" derivada de `day.cards`, ambas con la misma cobertura y resultado que hoy
- [ ] **Phase 7: Isla client-only — mapa, fallback de imagen y notas** - Mapa Leaflet client-only con marcadores/popups/banner offline, imagen-con-fallback hero/detail y notas por ficha en localStorage
- [ ] **Phase 8: Verificación de paridad** - Suite Playwright (visual-diff contra el golden, E2E de comportamiento e invariantes de datos) que confirma paridad 100% antes de cualquier merge a producción

## Phase Details

### Phase 1: Andamiaje + Golden de paridad
**Goal**: Dejar el proyecto Nuxt 4 arrancando y compilando a estático bajo el subpath de producción, con el CSS editorial conservado verbatim y el backend Nitro presente pero dormido, y **capturar el golden de Playwright desde el `index.html` de `main` antes de que la rama de release diverja** — la referencia objetiva contra la que se medirá toda la paridad posterior.
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, ARCH-03, BUILD-01, BUILD-02, BUILD-03, PARITY-01
**Success Criteria** (what must be TRUE):
  1. `nuxt dev` arranca y `nuxt generate` compila a estático sin errores, con TypeScript estricto y el comando de lint (`@nuxt/eslint` + Prettier) pasando limpio
  2. El sitio generado se sirve **bajo `/guiaRoma/`** sin ningún 404 de `/_nuxt/*` (baseURL + `public/.nojekyll`), con Leaflet y las tres fuentes (Cormorant Garamond / Lora / JetBrains Mono) self-hosteadas (sin depender de CDN)
  3. El CSS editorial actual (~2.200 líneas) vive como CSS global en `assets/css/` (tokens + base + leaflet) y se carga una sola vez desde `nuxt.config.ts`, sin reescribirse a ningún framework
  4. Existe `server/` con `server/api/README.md` y ningún endpoint activo; el sitio se sigue generando estático (SSR-en-build ON, sin `ssr:false`)
  5. Hay screenshots golden del `index.html` original (home, una sección de día, una ficha de cada tipo) en claro/oscuro y móvil/desktop, guardados como referencia antes de divergir
**Plans**: 3 plans
  - [x] 01-01-PLAN.md — Golden de paridad: capturar el golden del `index.html` (14 vistas × claro/oscuro × móvil/desktop) con Playwright, deterministas y versionados, ANTES de divergir [Wave 1]
  - [x] 01-02-PLAN.md — Scaffold Nuxt 4 en raíz (srcDir=app/, pnpm, TS estricto, @nuxt/eslint+stylistic, módulos, fuentes self-host) + CSS editorial extraído verbatim a tokens/base/leaflet [Wave 2]
  - [x] 01-03-PLAN.md — Subpath `/guiaRoma/` (baseURL + github_pages + .nojekyll) + backend Nitro dormido + verificación local del build (0×404 de /_nuxt/*, 0×CDN) [Wave 3]

### Phase 2: Esquema de datos + migración del contenido
**Goal**: Definir el esquema de viaje tipado (la raíz de la que derivan búsqueda, ruta del día, mapa, ritmo y fallback) y migrar **todo** el contenido de Roma a datos, sin perder ni una palabra ni un enlace, con la validación zod actuando como puerta de calidad en el build.
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. `content.config.ts` define las 6 colecciones zod (`trip`, `day`, `monument`, `food`, `artist`, `reference`) con `type:'data'`, un fichero por entidad y glob `trips/*/…` para multi-viaje
  2. Cada día codifica su `timeline` como array ordenado con el `kind` y el `pace` de cada fila, y declara `cards: string[]` con el **orden exacto** de sus fichas-monumento (el campo del que se reproduce la "ruta del día", que hoy depende del orden del DOM)
  3. Todo el contenido de Roma (≈37 monumentos + gastronomía + artistas + secciones Reservas/Práctica/Arte/Arquitectura) está migrado 1:1, con la prosa en Markdown-inline lista para `<MDC>` y cada monumento con su `motif` (zod `enum`)
  4. La validación de esquema **falla el build** ante cualquier dato inválido; un test de invariantes confirma ids únicos y que toda referencia cruzada (`timeline.ref`, `cards[]`, `seenIn`, `archLink`) resuelve a una ficha existente
**Plans**: 7 plans
  - [x] 02-01-PLAN.md — Contrato de datos: 6 colecciones zod en shared/schemas.ts + content.config.ts + Vitest/yaml/cheerio + tests schema.spec (puerta DATA-05) e invariants.spec (SC4) [Wave 1]
  - [x] 02-02-PLAN.md — Harness de fidelidad 1:1 (D-07/D-08): cheerio extrae texto+enlaces por id del index.html + migration-diff.spec (puerta DATA-04) [Wave 2]
  - [ ] 02-03-PLAN.md — trip.yml + 5 days: timeline discriminado por kind con pace (DATA-02) + cards en orden de DOM (DATA-03) [Wave 2]
  - [ ] 02-04-PLAN.md — 21 monumentos viernes/sabado/domingo migrados 1:1 (motif/type/places, cross-refs card-artists/card-arch, prosa MDC-ready) [Wave 3]  - [ ] 02-05-PLAN.md — 17 monumentos lunes/martes migrados 1:1 (completan los 38) [Wave 3]  - [ ] 02-06-PLAN.md — 26 fichas de gastronomia migradas 1:1 (group/badge; 5 sin id reciben slug g-) [Wave 3]  - [ ] 02-07-PLAN.md — 13 artist-cards (artist/arquitectura/glossary) + reservas + practica migrados 1:1 [Wave 3]
### Phase 3: Capa de página, layout y tema
**Goal**: Construir la capa que agrega un viaje desde sus datos y lo entrega al árbol de componentes, con el shell de layout (Topbar, NavPills, BackButton) visualmente idéntico a hoy y el tema claro/oscuro resuelto sin parpadeo en estático — fijando el anti-FOUC desde que el layout existe.
**Depends on**: Phase 2
**Requirements**: ARCH-01, ARCH-02, UI-01, FEAT-01
**Success Criteria** (what must be TRUE):
  1. `useTrip(slug)` agrega `trip`/`days`/`monuments`/`food`/`artists`/`reference` con índices por id, y un único `TripView` se renderiza tanto en `/` (Roma por defecto) como en `/trips/[slug]` — añadir un viaje sería añadir archivos de contenido, sin tocar código
  2. Layout, Topbar y NavPills están componentizados y se ven idénticos a hoy (misma cabecera fija, mismas pastillas de navegación)
  3. El tema claro/oscuro funciona con `@nuxtjs/color-mode` (`data-theme`, `storageKey:'roma-theme'`, `fallback:'light'`), respeta `prefers-color-scheme` y **no parpadea** al recargar con `roma-theme=dark` (el script inline anti-flash está presente en el `<head>` del HTML generado)
  4. El icono luna/sol se resuelve solo por CSS (`[data-theme]`), sin ningún `v-if` por tema en los templates
**Plans**: TBD
**UI hint**: yes

### Phase 4: Render de contenido + modos de ritmo
**Goal**: Renderizar fichas, timeline y secciones de referencia desde los datos con paridad visual pixel a pixel, y reproducir los tres modos triviales (ritmo, caminar menos, resumen) con su lógica exacta — validando el patrón data-driven con las piezas de bajo riesgo antes de las sensibles a SSR.
**Depends on**: Phase 3
**Requirements**: UI-02, UI-03, UI-04, FEAT-06, FEAT-07, FEAT-08
**Success Criteria** (what must be TRUE):
  1. La ficha de monumento (hero, nombre italiano, prosa por secciones, facts, enlace a Maps) se ve idéntica a hoy, con la prosa renderizada por `<MDC>` sin `<p>` extra donde el original no lo tenía
  2. El timeline se renderiza desde el array ordenado del día despachando por `kind` (`stop`/`transport`/`meta`/`food`/`reservation`) y se ve idéntico a hoy
  3. Las secciones de referencia (Reservas, Gastronomía, Práctica, Arte, Arquitectura) se renderizan desde datos y se ven idénticas a hoy
  4. El selector de ritmo (optimista/neutral/lento) muestra u oculta items del timeline con la matriz **exacta** (`slow-only` solo visible en optimista; `medium` oculto solo en lento) y persiste; el modo "caminar menos" fuerza ritmo lento; el modo resumen togglea la vista índice — los tres con el mismo comportamiento (incluido el micro-flash de un frame que ya existe hoy)
**Plans**: TBD
**UI hint**: yes

### Phase 5: Navegación transversal
**Goal**: Construir `useCardNavigation` una sola vez — antes que el mapa, la búsqueda y los enlaces del timeline, sus tres consumidores — replicando el scroll-a-ficha con resaltado, la pila de "volver" que restaura el scroll, y el scrollspy con el offset crítico `+130`.
**Depends on**: Phase 4
**Requirements**: FEAT-05
**Success Criteria** (what must be TRUE):
  1. Al navegar a una ficha (desde un enlace interno de la prosa o las pastillas) la página hace scroll suave a la ficha y la resalta, y el botón "volver" restaura el scroll a la posición anterior usando la pila
  2. El scrollspy resalta la pastilla de navegación de la sección activa usando la fórmula **exacta** `scrollY + 130 >= offsetTop` (no `IntersectionObserver`), con el mismo punto de conmutación que hoy
  3. Los enlaces internos `a[href^="#"]` que `<MDC>` genera en la prosa (p. ej. `[texto](#g-fortunata)`) se interceptan y disparan `navigateToCard` en vez de recargar o saltar sin animación
**Plans**: TBD
**UI hint**: yes

### Phase 6: Derivados de datos — búsqueda y ruta del día
**Goal**: Re-derivar desde los datos tipados (no del DOM) las dos features que hoy raspan el HTML, como composables puros y testeables: la búsqueda en cliente con la misma cobertura de texto, y la "ruta del día" con el mismo conjunto de paradas, orden y muestreo.
**Depends on**: Phase 2, Phase 5
**Requirements**: FEAT-03, FEAT-09
**Success Criteria** (what must be TRUE):
  1. La búsqueda (MiniSearch sobre un `haystack` que concatena los mismos textos que hoy entraban en `card.textContent`: prosa de todas las secciones + nombre italiano + facts + caption) encuentra **al menos** lo que encontraba hoy, con dropdown a partir de ≥2 caracteres, máximo 8 resultados y "Sin resultados" cuando no hay
  2. Seleccionar un resultado de búsqueda navega a la ficha vía el mismo `useCardNavigation` de la Phase 5
  3. La "ruta del día" se deriva de `day.cards` (orden = el del dato): incluye solo monumentos (no restaurantes ni guiados/concierto), abre Google Maps con `dir/?api=1&...walking`, aplica el cap de 10 paradas con el muestreo literal de `capStops`, y el botón solo aparece con ≥2 paradas mostrando el texto condicional `(N paradas)` / `(10 de N paradas)`
  4. Tests unitarios sobre las funciones puras (`pointFor`/`capStops`/`buildDirUrl`) confirman que la URL generada por día coincide con la del `index.html` actual
**Plans**: TBD
**UI hint**: yes

### Phase 7: Isla client-only — mapa, fallback de imagen y notas
**Goal**: Abordar las piezas más sensibles a SSR/hidratación una vez asentado el patrón `.client.vue` + `<ClientOnly>` + `onMounted`: el mapa Leaflet como única isla client-only, la imagen-con-fallback hero/detail, y las notas por ficha en localStorage.
**Depends on**: Phase 5
**Requirements**: FEAT-02, UI-05, FEAT-04
**Success Criteria** (what must be TRUE):
  1. El mapa Leaflet (componente `.client.vue` con import dinámico en `onMounted`, envuelto en `<ClientOnly>` con `#fallback` del mismo tamaño) muestra marcadores numerados por tipo, popups "Abrir ficha →", `fitBounds` y banner offline con la heurística exacta `tilesErrored > 3 && tilesLoaded === 0`; `nuxt generate` pasa sin `window is not defined`
  2. Los popups y el resto de enlaces a ficha del mapa usan el mismo `useCardNavigation` de la Phase 5
  3. La imagen-con-fallback reproduce el comportamiento actual: `<img>` nativo con `@error` → SVG por `motif`; modo hero (sustituye el contenedor, lo oculta si no hay motif) y modo detail (sustituye solo la imagen, conserva el caption), con `loading="lazy"` y `alt` exactos
  4. Las notas por ficha persisten en localStorage con las claves exactas `roma-note-<id>`, sin warnings de hidratación (lectura en `onMounted`)
**Plans**: TBD
**UI hint**: yes

### Phase 8: Verificación de paridad
**Goal**: Demostrar objetivamente la paridad 100% con una suite Playwright que combina visual-diff contra el golden de la Phase 1, E2E del comportamiento de cada feature e invariantes de datos — la puerta que debe pasar antes de cualquier merge a producción.
**Depends on**: Phase 7
**Requirements**: PARITY-02
**Success Criteria** (what must be TRUE):
  1. El visual-diff a pixel contra el golden del `index.html` pasa para home, cada sección de día y una ficha de cada tipo, en claro/oscuro y móvil/desktop
  2. Los tests E2E confirman el comportamiento de cada feature: matriz de ritmo, conmutación de tema (`data-theme` sin flash), búsqueda (≥2, máx 8, "Sin resultados"), URL de "ruta del día", notas persistentes, pila "volver" desde mapa/búsqueda/timeline y scrollspy con offset `+130`
  3. Los invariantes de datos pasan (nº de fichas esperado, ids únicos, enlaces cruzados que resuelven, `motif` por monumento completo)
  4. La suite completa pasa en verde como condición previa a dar la 1.0 por buena
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Andamiaje + Golden de paridad | 3/3 | Complete   | 2026-06-18 |
| 2. Esquema de datos + migración del contenido | 2/7 | In Progress|  |
| 3. Capa de página, layout y tema | 0/TBD | Not started | - |
| 4. Render de contenido + modos de ritmo | 0/TBD | Not started | - |
| 5. Navegación transversal | 0/TBD | Not started | - |
| 6. Derivados de datos — búsqueda y ruta del día | 0/TBD | Not started | - |
| 7. Isla client-only — mapa, fallback de imagen y notas | 0/TBD | Not started | - |
| 8. Verificación de paridad | 0/TBD | Not started | - |
