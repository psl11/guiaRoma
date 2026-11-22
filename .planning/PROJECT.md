# guiaRoma — Guía de viajes dinámica

## What This Is

guiaRoma es una guía de viaje editorial, cuidada al detalle, que hoy existe como un único `index.html` (6.665 líneas / 734 KB) con la planificación de un viaje de 5 días a Roma. La v1.0 la **migró a Nuxt 4**: el mismo resultado visual y funcional, pero con el contenido extraído a **datos estructurados y tipados**, la UI partida en **componentes reutilizables**, y una arquitectura **multi-viaje** (añadir un viaje futuro = añadir archivos de datos, sin tocar código). Está pensada para consultarse paseando por la ciudad, por lo que debe seguir funcionando con conexión pobre o nula.

## Core Value

La guía se consulta paseando por el destino y debe ser **fiel, editorial y fiable** (también offline). Lo ya publicado no se rompe: Roma sigue **exactamente igual** (paridad verificada) mientras la plataforma crece a varios viajes. Si todo lo demás se simplifica, esto no se negocia.

## Current Milestone: v1.1 Multi-viaje + Campania

**Goal:** Que la guía soporte varios viajes de verdad, data-driven, publicando Campania 2027 como segundo viaje sin que Roma cambie lo más mínimo.

**Target features:**
- Plataforma multi-viaje: días/secciones variables, chrome desde `trip.yml`, mapa multi-ciudad, búsqueda y navegación por viaje
- Persistencia en navegador por viaje (migrando `roma-*` sin pérdida)
- Portada `/` con índice de viajes; Roma en `/trips/roma` con redirección de enlaces antiguos; prerender de todos los viajes
- Contenido del viaje Campania 2027 (Nápoles, Procida, Ischia, Salerno/Cilento, Vesubio, Casertavecchia…) a partir de `.planning/inputs/campania-2027-itinerario-raw.md`
- Roma intacta: suite de paridad verde

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
- ✓ Migración a Nuxt 4 con paridad visual y funcional 100% con el `index.html` (golden 56 PNGs + `pnpm verify` VERDE + sign-off humano) — v1.0
- ✓ Contenido de Roma en datos tipados (Nuxt Content v3 `type:data` YAML + zod, 6 colecciones, 85 ficheros) — v1.0
- ✓ UI componentizada (TripView, fichas, timeline, modos de ritmo, navegación, búsqueda MiniSearch, ruta del día, isla Leaflet, fallback de imagen, notas) — v1.0
- ✓ Base multi-viaje en datos: `useTrip(slug)` + colecciones con glob `trips/*/…` + ruta `/trips/[slug]` (sin prerender) — v1.0
- ✓ Salida estática bajo `/guiaRoma/` con offline conservado (fuentes y Leaflet self-host) — v1.0
- ✓ Estandarización: TS estricto, ESLint stylistic, design tokens CSS verbatim, validación zod — v1.0
- ✓ Backend Nitro preparado pero dormido — v1.0
- ✓ Búsqueda y navegación entre fichas acotadas al viaje que se está viendo (contexto de viaje provide/inject, sin `useTrip('roma')` fijo) — Fase 9
- ✓ Persistencia en navegador separada por viaje; las claves `roma-*` siguen intactas (sin migración destructiva, `tripStorageKey`) — Fase 9
- ✓ Puerta de datos por viaje: cualquier YAML inválido o fichero sin clasificar en `content/trips/` hace fallar `pnpm verify` nombrando el fichero (sin fail-open) — Fase 9

### Active

<!-- Milestone v1.1 — Multi-viaje + Campania 2027. Hipótesis hasta enviarse. -->

- [ ] La UI se adapta a la forma de cada viaje desde sus datos: nº y nombres de días variables, secciones opcionales, chrome (marca, `<title>`, pie, leyenda del mapa) desde `trip.yml`
- [ ] El mapa soporta viajes de varias ciudades (encuadre sobre todos los marcadores del viaje)
- [ ] Portada `/` = índice de viajes; Roma vive en `/trips/roma`; enlaces antiguos (`/#viernes`…) redirigen; todos los viajes se prerenderizan para GitHub Pages
- [ ] Viaje **Campania 2027** (19–28 junio, en familia) publicado con su contenido: días, fichas, gastronomía y práctica, en el tono slow/auténtico del planning del usuario
- [ ] Roma sin regresiones: la suite de paridad (goldens + comportamiento) sigue verde en su nueva URL

### Out of Scope

<!-- Límites explícitos con su razón, para no re-añadirlos. -->

- Backend real, autenticación, subida de imágenes/vídeos — **v2** (Nitro queda preparado; no se activa)
- PWA instalable con caché offline real — **v2** (se conserva el offline actual, no se añade PWA)
- CMS / panel de edición de viajes — **futuro** (los viajes se añaden por PR de ficheros YAML)
- i18n / multidioma — la UI sigue en español fijo; lo específico del viaje sale de sus datos (decidido v1.1)
- Rediseño visual de Roma — Roma se mantiene idéntica; Campania reutiliza el mismo sistema visual

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
| v1.1: `/` = índice de viajes; Roma se mueve a `/trips/roma` con redirección de enlaces antiguos | Escala a N viajes; ningún viaje es «el principal» | — Pending |
| v1.1: UI en español fijo; lo específico del viaje (marca, título, pie, leyenda) en `trip.yml` | Evita i18n; mantiene un único sistema de textos | — Pending |
| v1.1: Campania 2027 entra en el hito con contenido real redactado a partir del planning del usuario | El usuario quiere usarla en el viaje de junio 2027 | — Pending |
| Fase 9: claves de localStorage de Roma intactas; otros viajes con clave prefijada por slug | Quien ya usa Roma no pierde notas ni preferencias; cero migración destructiva | ✓ Fase 9: `tripStorageKey(slug, …)` + guardián `tripCoupling.spec.ts` |
| Fase 9: la puerta de datos es fail-closed sobre `content/trips/` | Content ingiere carpetas ocultas (`dot: true`) y omite `.YML`/ficheros sueltos sin avisar; el autor debe recibir señal | ✓ Fase 9 (09-06 + CR-01): `stray-file`/`trip-slug` nombran el fichero culpable |

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
*Last updated: 2026-11-22 after Phase 9 — plataforma por viaje (búsqueda, navegación, persistencia y puerta de datos acotadas al viaje; Roma intacta).*
