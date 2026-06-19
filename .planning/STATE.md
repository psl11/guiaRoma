---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 03-01-PLAN.md
last_updated: "2026-06-19T12:47:31.636Z"
last_activity: 2026-06-19
progress:
  total_phases: 8
  completed_phases: 2
  total_plans: 15
  completed_plans: 11
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** La 1.0 debe ser exactamente igual que la guía de hoy (paridad visual y funcional al 100%), pero construida de forma dinámica, data-driven y mantenible.
**Current focus:** Phase 03 — Capa de página, layout y tema

## Current Position

Phase: 03 (Capa de página, layout y tema) — EXECUTING
Plan: 2 of 5
Status: Ready to execute
Last activity: 2026-06-19

Progress: [███████░░░] 73%

## Performance Metrics

**Velocity:**

- Total plans completed: 11
- Average duration: 9 min
- Total execution time: 0.15 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | - | - |
| 02 | 7 | - | - |

**Recent Trend:**

- Last 5 plans: 01-01 (9 min)
- Trend: —

*Updated after each plan completion*
| Phase 01 P01-02 | 9min | 2 tasks | 11 files |
| Phase 01 P03 | 7min | 2 tasks | 8 files |
| Phase 02 P01 | 12 | 4 tasks | 9 files |
| Phase 02 P02 | 9min | 2 tasks | 2 files |
| Phase 02 P03 | 22min | 3 tasks | 6 files |
| Phase 02 P04 | 27min | 2 tasks | 21 files |
| Phase 02 P05 | 18min | 2 tasks | 17 files |
| Phase 02 P06 | 9min | 2 tasks | 26 files |
| Phase 02 P07 | 14min | 3 tasks | 18 files |
| Phase 03 P01 | 3min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Fases horizontales/ordenadas por dependencia siguiendo el BUILD ORDER del research (andamiaje+golden → datos → página/layout/tema → render+modos → navegación → derivados → isla mapa → verificación)
- [Roadmap]: El golden de Playwright se captura en la Phase 1 desde `main` ANTES de divergir — red de seguridad de toda la paridad
- [Roadmap]: `day.cards: string[]` ordenado (Phase 2) es la pieza más crítica del modelo: de él se deriva la "ruta del día" (hoy depende del orden del DOM)
- [Roadmap]: `useCardNavigation` (Phase 5) se construye antes que mapa/búsqueda/enlaces, sus tres consumidores
- [Roadmap]: Mapa Leaflet + fallback de imagen (Phase 7) van al final por ser lo más sensible a SSR/hidratación
- [Phase ?]: [Fase 1]: A5 fijada — golden bloquea todas las peticiones de imagen (page.route.abort) para forzar el fallback SVG determinista (offline, BUILD-02)
- [Phase ?]: [Fase 1]: A8 fijada — snapshotPathTemplate sin sufijo de plataforma; golden capturado en linux
- [Phase ?]: [Fase 1]: fichas-tipo del golden por id literal (#galleria-sciarra/#vaticano/#auditorium) — no existe clase CSS guided/concert en el index.html
- [Phase ?]: [Fase 1]: Scaffold Nuxt 4 vía B (a mano) en raíz no vacía — preserva index.html/favicons intactos (D-02/Pitfall 1)
- [Phase ?]: [Fase 1]: CSS editorial VERBATIM (tokens/base/leaflet) sin @layer/scoped — paridad por construcción; eliminadas 2 llaves } sobrantes latentes del index.html (no-op visual, PostCSS las rechazaba)
- [Phase ?]: [Fase 1]: better-sqlite3 (dev, build-time) como conector SQLite de @nuxt/content — el sitio desplegado sigue 100% estatico
- [Phase ?]: [Fase 1]: verificación de subpath vía B (autocontenida en subpath.spec.ts: beforeAll genera+copia+spawn serve, afterAll mata+limpia) — sin tocar playwright.config.ts
- [Phase ?]: [Fase 1]: favicons en app/app.vue con useHead+app.baseURL (NO app.head.link): Nuxt no antepone baseURL a app.head.link → /favicon.svg daría 404 bajo /guiaRoma/
- [Phase ?]: [Fase 1]: subpath /guiaRoma/ verificado SOLO en local (0x404 de /_nuxt/* + 0xCDN); D-06 — no se montó CI/deploy, main intacto
- [Phase ?]: [Fase 2]: shared/schemas.ts es la fuente unica del esquema zod, importado por content.config.ts Y por schema.spec.ts (mismo contrato en config y test)
- [Phase ?]: [Fase 2]: DATA-05 se cumple via test Vitest Node-puro (safeParse por fichero), NO con el esquema de Content (no valida data-collections en build, #3351)
- [Phase ?]: [Fase 2]: cross-refs en invariants.spec (no en zod refine); slug (no id reservado) como ancla estable; prosa como sections[{heading,body}] (D-01)
- [Phase ?]: [Fase 2]: Puerta de fidelidad DATA-04 (migration-diff) — texto por multiset de palabras + enlaces por conjunto de href (D-08, no byte-exacto); index.html solo-lectura
- [Phase ?]: [Fase 2]: migration-diff SKIPea ids sin YAML via helper de existencia del harness — spec incremental sin false-red entre los 4 planes de migracion de Wave 3 en paralelo
- [Phase ?]: [Fase 2]: chrome de UI (notes-area, etiqueta boton Maps) excluido del texto pero su href capturado; denylist de claves estructurales en lado YAML; universo = 72 anclas (5 gastro sin id via revision manual)
- [Phase ?]: [Fase 2]: Plan 05 reutilizó verbatim el patrón de monument del Plan 04 sin tocar esquema ni harness; sólo transcripción de datos fieles de lunes/martes
- [Phase ?]: [Fase 2]: Los 38 monumentos quedan migrados (21 Plan 04 + 17 Plan 05); schema.spec conteo 38 y migration-diff de los 38 en verde (DATA-04/DATA-01)
- [Phase ?]: [Fase 2]: Las 26 fichas de gastronomía quedan migradas (17+9, incl. 5 sin id con slug g- generado y verificado a mano); schema.spec conteo food=26 y migration-diff de los 21 con id en verde (DATA-04/DATA-01)
- [Phase ?]: [Fase 2]: groupIntro de food NO se pobla por ficha — los gastro-intro son prosa de nivel grupo/sección fuera del subárbol DOM de cada card; atarlo a una ficha rompería su migration-diff por-card (extraWords). Campo queda optional
- [Phase ?]: [Fase 2]: Plan 07 cierra el corpus — 13 artist-cards (kind artist/arquitectura/glossary), reservas (tabla tipada badge/estado) y practica (prosa+media); pnpm test:data 100% verde con TODOS los cross-refs resueltos
- [Phase ?]: [Fase 2]: avatar de artist-card es estructural en ambos lados del diff (se excluye .artist-avatar de la extracción HTML, igual que STRUCTURAL_KEYS en YAML); seenIn lleva la prosa de cabecera/conector en label/note de los Link
- [Phase ?]: [Fase 2]: reservas.table.badge/badgeKind → optional (fila 'Sin reserva' sin badge); anclas de SECCIÓN de página (#gastronomia/#arte/#arquitectura/#inicio/#mapa) aceptadas en el invariante de anclas inline (landings SPA, no entidades)
- [Phase ?]: [Fase 2]: archLink (arq-barroco → #art-bernini/#art-borromini) INLINE en el body de la prosa, no campo aparte; arq-medieval con 2 secciones fiel al DOM (sin 'Por qué importa')
- [Phase 2]: gap closure — los 8 textos de NIVEL sección/grupo que la migración per-card dejó caer (eyebrows+intros de gastronomía/arte/arquitectura 5337/5340·5943/5945·6106/6108 + gastro-intro de quinto quarto 5501 / ghetto 5541) se capturan verbatim en TripSchema.sections (trip.yml) y food.groupIntro (g-checchino/g-giggetto); migration-diff gana extractSectionMeta/extractGroupIntro + test de nivel sección con fixtures negativos, y groupIntro va a STRUCTURAL_KEYS para no romper el diff per-card. pnpm test:data 295 verde, typecheck+lint limpios. Supersede la decisión de 02-06 de no poblar groupIntro
- [Phase 3]: [Fase 3]: dayLabel guarda split('·')[0] con ?? '' para noUncheckedIndexedAccess (TS2532) conservando la forma prescrita split('·')+toLocaleUpperCase('it'); String.split siempre devuelve >=1 elemento, sin cambio de comportamiento
- [Phase 3]: [Fase 3]: tests/unit y tests/data como runners DISJUNTOS via un solo include + scripts dedicados (test:unit / test:data), no Vitest projects; data sigue 295 verde aislado, unit 7 verde
- [Phase 3]: [Fase 3]: la etiqueta de día se DERIVA (D-04), nunca se almacena — sin campo navLabel en shared/schemas.ts y sin tocar los 5 YAML de día; helper puro en app/utils/ auto-importado como dayLabel

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- [Phase 2]: Bandera de research parcial — las secciones de referencia (`index.html` líneas ~5260-6250) no se leyeron en profundidad; leerlas y afinar el esquema `reference` antes de migrar ese contenido.
- [Phase 4/5]: Validar al implementar el cableado exacto de interceptación de `a[href^="#"]` en `<MDC>` (componente Prose-`a` custom vs listener delegado).

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Backend | BACK-01/02/03 (auth, uploads, API Nitro activa) | v2 | Init |
| PWA | PWA-01/02 (app instalable, caché offline real de tiles) | v2 | Init |
| Multi-viaje | TRIP-01 (segundo viaje con contenido real) | Futuro | Init |

## Session Continuity

Last session: 2026-06-19T12:47:31.629Z
Stopped at: Completed 03-01-PLAN.md
Resume file: None
