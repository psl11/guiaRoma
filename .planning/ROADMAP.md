# Roadmap: guiaRoma

## Milestones

- ✅ **v1.0 Migración a Nuxt 4** — Fases 1-8 (shipped 2026-06-24)
- ✅ **v1.1 Multi-viaje + Campania** — Fases 9-14 (shipped 2026-11-24)

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

**Resultado:** `pnpm verify` VERDE (80 parity + 87 unit + 295 data); 33/33 requisitos; paridad firmada por humano (1.0 «paridad-buena»).

</details>

<details>
<summary>✅ v1.1 Multi-viaje + Campania (Fases 9-14) — SHIPPED 2026-11-24</summary>

La guía pasa a ser multi-viaje de verdad, *data-driven*, y publica Campania 2027 como segundo viaje sin que Roma cambie (56 goldens intactos, sin pérdida de datos para quien ya la usaba). Detalle completo archivado en `milestones/v1.1-ROADMAP.md`; auditoría en `milestones/v1.1-MILESTONE-AUDIT.md`.

- [x] Phase 9: Plataforma por viaje (6 plans) — completed 2026-11-22
- [x] Phase 10: Forma y chrome desde datos (6 plans) — completed 2026-11-22
- [x] Phase 11: Portada y rutas multi-viaje (8 plans) — completed 2026-11-23
- [x] Phase 12: Formas nuevas de viaje (7 plans) — completed 2026-11-23
- [x] Phase 12.1: Títulos de Reservas por viaje (1 plan, INSERTED) — completed 2026-11-22
- [x] Phase 13: Contenido Campania 2027 (8 plans) — completed 2026-11-23
- [x] Phase 14: Verificación del milestone (3 plans) — completed 2026-11-23

**Resultado:** `pnpm verify` desde build limpia VERDE (unit 567 + data 774 + parity 126); 32/32 requisitos; Roma y Campania firmadas en móvil real (UAT 9/9); publicado en GitHub Pages junto con v1.0.

</details>

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 Migración a Nuxt 4 | 1-8 | 39 | Complete | 2026-06-24 |
| v1.1 Multi-viaje + Campania | 9-14 (+12.1) | 39 | Complete | 2026-11-24 |

---

*Próximo milestone: sin definir — `/gsd-new-milestone`.*
