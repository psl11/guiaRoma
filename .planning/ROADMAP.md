# Roadmap: guiaRoma — Migración a Nuxt 4

## Milestones

- ✅ **v1.0 Migración a Nuxt 4** — Fases 1-8 (shipped 2026-06-24)

## Phases

<details>
<summary>✅ v1.0 Migración a Nuxt 4 (Fases 1-8) — SHIPPED 2026-06-24</summary>

Re-plataforma el `index.html` único (6.665 líneas) a Nuxt 4 SSG con paridad visual y funcional al 100%: contenido a datos tipados (Nuxt Content v3 + zod), UI componentizada, arquitectura multi-viaje, offline self-hosted, y una suite Playwright de verificación de paridad como puerta de la 1.0. Detalle completo archivado en `milestones/v1.0-ROADMAP.md`.

- [x] Phase 1: Andamiaje + Golden de paridad (3 plans) — completed 2026-06-18
- [x] Phase 2: Esquema de datos + migración del contenido (7 plans) — completed 2026-06-19
- [x] Phase 3: Capa de página, layout y tema (5 plans) — completed 2026-06-19
- [x] Phase 4: Render de contenido + modos de ritmo (5 plans) — completed 2026-06-20
- [x] Phase 5: Navegación transversal (3 plans) — completed 2026-06-21
- [x] Phase 6: Derivados de datos — búsqueda y ruta del día (5 plans) — completed 2026-06-21
- [x] Phase 7: Isla client-only — mapa, fallback de imagen y notas (4 plans) — completed 2026-06-23
- [x] Phase 8: Verificación de paridad (7 plans) — completed 2026-06-24

**Resultado:** `pnpm verify` VERDE (80 parity + 87 unit + 295 data); 33/33 requisitos; paridad firmada por humano (1.0 «paridad-buena»). Merge a `main` + deploy quedan como acto de ship separado (D-08); `main` intacto.

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Andamiaje + Golden de paridad | v1.0 | 3/3 | Complete | 2026-06-18 |
| 2. Esquema de datos + migración | v1.0 | 7/7 | Complete | 2026-06-19 |
| 3. Capa de página, layout y tema | v1.0 | 5/5 | Complete | 2026-06-19 |
| 4. Render de contenido + modos de ritmo | v1.0 | 5/5 | Complete | 2026-06-20 |
| 5. Navegación transversal | v1.0 | 3/3 | Complete | 2026-06-21 |
| 6. Derivados de datos — búsqueda y ruta del día | v1.0 | 5/5 | Complete | 2026-06-21 |
| 7. Isla client-only — mapa, fallback, notas | v1.0 | 4/4 | Complete | 2026-06-23 |
| 8. Verificación de paridad | v1.0 | 7/7 | Complete | 2026-06-24 |

---

*Full v1.0 detail archived in `.planning/milestones/v1.0-ROADMAP.md`. Next milestone: `/gsd:new-milestone`.*
