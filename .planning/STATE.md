---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Phase 2 context gathered
last_updated: "2026-06-19T06:23:47.839Z"
last_activity: 2026-06-18
progress:
  total_phases: 8
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 13
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** La 1.0 debe ser exactamente igual que la guía de hoy (paridad visual y funcional al 100%), pero construida de forma dinámica, data-driven y mantenible.
**Current focus:** Phase 2 — esquema de datos + migración del contenido

## Current Position

Phase: 2
Plan: Not started
Status: Ready to plan
Last activity: 2026-06-18

Progress: [██████████] 100%

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

Last session: 2026-06-19T06:23:47.826Z
Stopped at: Phase 2 context gathered
Resume file: .planning/phases/02-esquema-de-datos-migraci-n-del-contenido/02-CONTEXT.md
