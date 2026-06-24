# guiaRoma — Guía de viajes dinámica

## What This Is

guiaRoma es una guía de viaje editorial, cuidada al detalle, que hoy existe como un único `index.html` (6.665 líneas / 734 KB) con la planificación de un viaje de 5 días a Roma. Este proyecto la **migra a Nuxt 4**: el mismo resultado visual y funcional, pero con el contenido extraído a **datos estructurados y tipados**, la UI partida en **componentes reutilizables**, y una arquitectura **multi-viaje** (añadir un viaje futuro = añadir archivos de datos, sin tocar código). Está pensada para consultarse paseando por la ciudad, por lo que debe seguir funcionando con conexión pobre o nula.

## Core Value

La 1.0 debe ser **exactamente igual que la guía de hoy** (paridad visual y funcional al 100%), pero construida de forma dinámica y mantenible. Si todo lo demás se simplifica, esto no se negocia: lo que el usuario ve y puede hacer no cambia.

## Requirements

### Validated

<!-- Capacidades de la guía ACTUAL (index.html en `main`). Ya están en producción y son valiosas: definen el listón de paridad de la 1.0. Deben preservarse 1:1. -->

- ✓ Guía de Roma de 5 días (Viernes→Martes) con ~37 fichas de monumentos — existing
- ✓ Fichas con imagen *hero*, nombre italiano, prosa histórica, enlace a Google Maps y *fallback* SVG si la imagen falla — existing
- ✓ Mapa Leaflet con marcadores numerados (romanos) por lugar, popups y *fit bounds*; banner "sin conexión" si fallan los *tiles* — existing
- ✓ Timeline por día (`tl-item` / `tl-transport` / `tl-food-item`) con selector de ritmo: optimista / neutral / lento — existing
- ✓ Modo "caminar menos" (movilidad reducida) — existing
- ✓ Modo resumen (vista índice de hora y lugar) — existing
- ✓ "Ruta del día": botón por día que abre Google Maps con todas las paradas en orden — existing
- ✓ Búsqueda en cliente sobre el contenido de las fichas — existing
- ✓ Notas personales por ficha, persistidas en localStorage — existing
- ✓ Tema claro/oscuro persistente (respeta `prefers-color-scheme`) — existing
- ✓ Navegación con pila de retroceso + scrollspy de pastillas de navegación — existing
- ✓ Secciones de referencia: Reservas, Gastronomía, Práctica, Arte, Arquitectura — existing
- ✓ Diseño editorial responsive y accesible (Cormorant Garamond / Lora / JetBrains Mono; paleta romana terracota+oro; aria labels) — existing

### Active

<!-- Objetivos de la migración. TODOS validados en v1.0 (2026-06-24) — la 1.0 está completa y firmada como «paridad-buena». Quedan como registro; los objetivos de v2 se definen con /gsd:new-milestone. -->

> **v1.0 COMPLETO (2026-06-24):** los 9 objetivos de migración de abajo están todos ✓ validados. 33/33 requisitos completos, `pnpm verify` VERDE, paridad firmada por humano. El merge `release/nuxt-4`→`main` y el deploy/CI son un acto de ship separado (D-08, fuera de v1.0); `main` intacto.

- [x] Proyecto Nuxt 4 funcionando (estructura, build estático, dev server) — ✓ **Fase 1**
- [x] Todo el contenido de Roma extraído a datos estructurados y **tipados** (esquema de viaje validado) — ✓ **Fase 2** (6 colecciones zod en Nuxt Content, 85 ficheros YAML, migración 1:1 verificada por harness de diff)
- [x] UI partida en **componentes reutilizables** — parcial: **shell de layout** (Topbar, NavPills, ThemeToggle, BackButton) + **página** (`TripView`, `TheHero` con el `#inicio` completo) componentizados ✓ **Fase 3**; **fichas, timeline (5 componentes por `kind`), secciones de referencia y los 3 modos de ritmo** (MonumentCard, Timeline*, GastroCard/GastroSection, ArtistCard, ReservasSection, PracticaSection, DaySection, DetailPhoto, `useTripModes`) ✓ **Fase 4**; **navegación transversal** (`useCardNavigation` singleton — scroll-a-ficha + resaltado, pila de "volver", scrollspy `+130`, intercepción por delegación de enlaces de ficha) ✓ **Fase 5**; **búsqueda en cliente y "ruta del día"** (`useSearch` singleton + `SearchBox` sobre MiniSearch indexando los datos tipados, `dayRoute` utils puras `pointFor`/`capStops`/`buildDirUrl` + botón en `DaySection`) ✓ **Fase 6**; **mapa Leaflet (isla client-only), imagen-con-fallback (hero/detail) y notas por ficha** (`LeafletMap.client.vue` + `app/utils/{mapMarkers,mapOffline,svgMotifs}`, `@error`→SVG por `motif`, notas `roma-note-<slug>`) ✓ **Fase 7** — UI completamente componentizada
- [x] Arquitectura **multi-viaje**: la app renderiza un viaje a partir de sus datos; añadir otro = añadir archivos — ✓ **Fase 3** (`useTrip(slug)` agrega las 6 colecciones con índices por id; un único `TripView` se renderiza en `/` (Roma por defecto) y en `/trips/[slug]`, estructura lista sin prerender en 1.0)
- [x] **Paridad 100%** visual y funcional con el `index.html` actual (verificada) — ✓ **Fase 8**: *golden* de referencia capturado en Fase 1 (56 PNGs); sign-offs humanos por fase (shell+`#inicio` F3, render+modos F4, navegación F5, búsqueda+ruta F6, mapa+fallback+notas F7); y el **visual-diff pixel total + suite de comportamiento + invariantes de datos** en la puerta `pnpm verify` VERDE (80 parity + 87 unit + 295 data) con el **sign-off humano de paridad global** que declara la 1.0 «paridad-buena». Excepción única documentada (D-06): `#mapa` solo-comportamiento. El golden se re-baselinó desde el build Nuxt offline (D-01 anulado): paridad efectiva de lo que se envía
- [x] **Salida estática** desplegable como ahora (`nuxt generate`) y **comportamiento offline conservado** — ✓ build estático bajo `/guiaRoma/` + fuentes/Leaflet self-host (0×CDN) en **Fase 1**, verificado offline (banner de tiles, fallback SVG de imágenes, notas localStorage) en **Fase 7** y en la suite de paridad de **Fase 8**
- [x] **Estandarización**: TypeScript, ESLint/Prettier, *design tokens*, validación de esquema de datos — ✓ TS estricto + ESLint (stylistic) + *design tokens* (CSS verbatim) en **Fase 1**; validación zod (6 colecciones, puerta que rompe el build) en **Fase 2**
- [x] Backend (Nitro) **preparado pero dormido**: estructura lista para v2, sin funcionalidad de servidor activa en 1.0 — ✓ **Fase 1** (`server/api/README.md`, cero endpoints)

### Out of Scope

<!-- Límites explícitos con su razón, para no re-añadirlos. -->

- Backend real, autenticación, subida de imágenes/vídeos — **v2** (Nitro queda preparado; no se activa en 1.0)
- PWA instalable con caché offline real — **v2** (anotado expresamente; la 1.0 conserva el offline actual, no añade PWA)
- Añadir un segundo viaje con contenido real — **futuro** (la arquitectura lo soporta; 1.0 entrega solo Roma)
- Rediseño visual o nuevas funcionalidades de producto — la 1.0 es **paridad**, no mejora de producto
- CMS / panel de edición de viajes — **futuro**
- i18n / multidioma — no solicitado (el contenido es español con toques de italiano)

## Context

- **Estado actual**: un único `index.html` en la rama `main` de `psl11/guiaRoma`. CSS propio (~2.200 líneas, ya con variables de diseño), Leaflet **incrustado** (CSS+JS) para funcionar offline, librería SVG inline para *fallbacks*, e ~410 líneas de JS de app. **El contenido rico está escrito a mano dentro del HTML**; la única estructura de datos es el array `places` en JS (id, nº romano, nombre, día, lat/lng, tipo: card/guided/concert).
- **Equipo y proceso**: grupo pequeño que planifica el viaje en común y colabora mediante Pull Requests en GitHub. Comunicación en español.
- **Experiencia**: el responsable domina Nuxt y prevé evolucionar la app a *full-stack* (auth, subida de media de los viajes), lo que motivó elegir Nuxt 4 sobre Astro.
- **Uso real**: consultar la guía sobre el terreno en Roma, posiblemente con conexión móvil pobre → el offline importa de verdad.
- **Dependencias externas actuales**: Google Fonts; imágenes alojadas en terceros (Wikimedia y otros) con *fallback* SVG; *tiles* de OpenStreetMap para el mapa.
- **Estado de la migración — v1.0 COMPLETO (milestone cerrado 2026-06-24).** Las 8 fases completadas en `release/nuxt-4`; `main` intacto. F1 andamiaje + golden (56 PNGs). F2 esquema zod (6 colecciones en `shared/schemas.ts`) + contenido de Roma migrado 1:1 (85 YAML: 38 monumentos + 26 gastro + 13 arte/arquitectura + 5 días + 2 referencia + 1 trip), validación que rompe el build + harness cheerio de diff. F3 `useTrip(slug)`+`TripView` data-driven, chrome + `#inicio` verbatim, tema sin FOUC. F4 fichas/timeline/referencia + 3 modos de ritmo. F5 `useCardNavigation` (scroll/resaltado/pila/scrollspy +130). F6 búsqueda MiniSearch + ruta del día. F7 isla Leaflet client-only + imagen-con-fallback + notas. F8 verificación de paridad: `pnpm verify` VERDE (80 parity + 87 unit + 295 data), visual-diff pixel total contra el golden + comportamiento + invariantes, y **sign-off humano de paridad global** → 1.0 «paridad-buena». Deuda conocida (tech_debt, no bloqueante, en `v1.0-MILESTONE-AUDIT.md`): divergencia de ranking de búsqueda MiniSearch (`"Pante"`), warnings de tooling del code review, golden re-baselinado del build Nuxt (D-01 anulado), `#mapa` solo-comportamiento (D-06). **Pendiente (acto de ship, fuera de v1.0):** merge `release/nuxt-4`→`main` + deploy/CI GitHub Pages (D-08).

## Constraints

- **Tech stack**: Nuxt 4 (Vue 3 + Nitro). Elegido por dominio del equipo y porque habilita el backend futuro mejor que Astro.
- **Paridad**: salida visual y funcional **idéntica** al `index.html` actual — listón innegociable de la 1.0.
- **Deployment**: **salida estática** (`nuxt generate`) desplegable como hoy (GitHub Pages); sin servidor activo en 1.0.
- **Offline**: conservar el funcionamiento con conexión pobre/nula (Leaflet local, *fallbacks* de imagen, banner de mapa offline).
- **Proceso**: todo el trabajo en una **rama de release** dedicada; `main` (la versión viva) permanece intacta; no romper nada.
- **Datos**: contenido en datos estructurados y tipados; el **formato exacto** (JSON estructurado vs Markdown por ficha vs híbrido) se decide en la fase de investigación, en el contexto de Nuxt Content v3.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nuxt 4 como framework | El equipo lo domina y Nitro habilita el backend futuro (auth, uploads) mejor que Astro | ✓ Fase 1: scaffold compila a estático bajo `/guiaRoma/` |
| 1.0 = solo Roma, *data-driven* | Fidelidad a "igual que ahora" + arquitectura lista para N viajes | ✓ Fase 2: 6 colecciones zod, 85 ficheros YAML bajo `content/trips/roma/`, glob `trips/*/…` listo para multi-viaje |
| Estático + offline en 1.0; PWA a v2 | Mantener el uso actual sin sobre-ingeniería | ✓ Fase 1: `nuxt generate`; fuentes/Leaflet self-host (0×CDN) |
| Formato de contenido a decidir en research | Depende de Nuxt Content v3; JSON vs Markdown vs híbrido | Decidido (research/CLAUDE.md): híbrido YAML `type:data` + MDC |
| Trabajo en rama de release, `main` intacto | No romper la versión viva durante la migración | ✓ Fase 1: todo en `release/nuxt-4`; `main` intacto |
| Backend preparado pero dormido en 1.0 | Evitar *scope creep*; dejar la puerta abierta para v2 | ✓ Fase 1: `server/api/README.md`, cero endpoints |
| Chrome (Topbar/NavPills/footer/BackButton) vive **dentro de `TripView`**, no en un layout aparte | Cada ruta obtiene los pills de día de SU viaje; `app.vue` → solo `NuxtPage` | ✓ Fase 3: `useTrip`+`TripView` poseen el árbol de página; multi-viaje *data-driven* |
| `meta` es **nombre reservado** de Nuxt Content v3 (como `id`) | Colisiona y se sobrescribe a `[object Object]` en la tabla SQLite → rompía el subtítulo del hero | ✓ Fase 3: renombrado `heroMeta`; lo atrapó el *code review*, el test de paridad ahora asevera el TEXTO del hero (no solo visibilidad) |
| Paridad efectiva > clon byte-exacto de fuentes (re-baseline del golden desde el build Nuxt) | El cut de Lora self-hosted offline (BUILD-02) difiere en kerning/GPOS de las fuentes Google de red del `index.html` → deltas de wrap sub-línea que ninguna tolerancia honesta absorbe; clonar la fuente byte a byte no compensa | ✓ Fase 8: D-01 anulado, 56 goldens re-capturados del build Nuxt; `maxDiffPixelRatio:0.01` sin máscaras intacto → sigue cazando regresiones reales |
| F8 PARA en verde + sign-off; merge/deploy fuera de v1.0 | El roadmap acaba en verificación; el ship es un acto separado (honra "main intacto") | ✓ Fase 8 (D-08): 1.0 firmada «paridad-buena»; `main` sin tocar, deploy diferido |
| `#mapa` = única excepción a la paridad-pixel | Tiles OSM no deterministas (red); F1 no capturó baseline del mapa | ✓ Fase 8 (D-06): verificado por comportamiento (`map-fallback-notes.spec.ts`, 12/12) dentro del gate |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-24 — **Fase 8 completada — milestone v1.0 de verificación CERRADO.** Puerta de paridad `pnpm verify` VERDE (generate + 87 unit + 295 data + 80 parity, exit 0): el visual-diff Nuxt↔golden (14 vistas × claro/oscuro × móvil/desktop vs 56 PNGs, `maxDiffPixelRatio:0.01` sin máscaras), los specs de comportamiento (incl. pila «Volver» desde timeline + mapa + búsqueda, D-05) y los invariantes de datos. Excepción pixel única documentada (D-06): `#mapa` es solo-comportamiento (tiles OSM no deterministas), verificado por `map-fallback-notes.spec.ts`. El golden se re-baselinó desde el build Nuxt offline (D-01 anulado esta sesión): paridad efectiva de lo que se envía, no clon byte-exacto de las fuentes Google de red. **Sign-off humano F7 (prerequisito) + F8 global APROBADOS** → la 1.0 se declara «paridad-buena» (PARITY-02, FEAT-02/UI-05/FEAT-04 completos). Frontera D-08: el merge `release/nuxt-4`→`main` y el deploy/CI quedan FUERA de F8 (acto de ship separado; `main` intacto). Code review F8: 0 blockers / 6 warnings / 5 info (advisory, en tooling/anti-tamper, no en la app). Registro en `parity-signoff.md` + `diff-classification.md` + `08-VERIFICATION.md` (passed, 4/4 SC).*
