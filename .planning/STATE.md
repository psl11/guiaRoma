---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 2 context gathered
last_updated: "2026-06-19T09:31:51.639Z"
last_activity: 2026-06-19
progress:
  total_phases: 8
  completed_phases: 1
  total_plans: 10
  completed_plans: 8
  percent: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** La 1.0 debe ser exactamente igual que la guía de hoy (paridad visual y funcional al 100%), pero construida de forma dinámica, data-driven y mantenible.
**Current focus:** Phase 02 — esquema-de-datos-migraci-n-del-contenido

## Current Position

Phase: 02 (esquema-de-datos-migraci-n-del-contenido) — EXECUTING
Plan: 6 of 7
Status: Ready to execute
Last activity: 2026-06-19

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**

- Total plans completed: 4
- Average duration: 9 min
- Total execution time: 0.15 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | - | - |

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

Last session: 2026-06-19T09:31:29.632Z
Stopped at: Phase 2 context gathered
Resume file: None
