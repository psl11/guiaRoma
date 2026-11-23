# Phase 11: Portada y rutas multi-viaje - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-20
**Phase:** 11-portada-y-rutas-multi-viaje
**Areas discussed:** Volver a la portada (ROUTE-06), Portada, URLs y prerender, Redirección legacy, Borradores, Paridad
**Mode:** `--auto` salvo ROUTE-06 (preguntada al usuario antes de arrancar).

---

## Volver a la portada (ROUTE-06) — pregunta al usuario

| Option | Description | Selected |
|--------|-------------|----------|
| Pie, todas (Recomendado) | «← Todos los viajes» en el pie de todas las guías, Roma incluida; re-captura documentada solo de la golden del pie | ✓ |
| Solo viajes nuevos | Enlace en los viajes nuevos, no en Roma; ninguna golden cambia | |
| Ninguno en v1.1 | ROUTE-06 a Future; ninguna golden cambia | |

**User's choice:** Pie, todas.
**Notes:** El scout descubrió después que ninguna golden captura el pie → la re-captura aprobada no hace falta (D-02).

## Portada

[auto] Portada — Q: «¿Qué muestra cada tarjeta?» → Selected: «título, fechas, destinos, resumen; sin imagen» (recommended; offline-first)
[auto] Portada — Q: «¿De dónde salen fechas/destinos/resumen?» → Selected: «campos opcionales nuevos en trip.yml (`startDate`, `endDate`, `destinations`, `summary`)» (recommended) — alternativa descartada: texto libre de fechas
[auto] Portada — Q: «¿Orden?» → Selected: «`startDate` descendente» (recommended) — alternativa: ascendente
[auto] Portada — Q: «¿Chrome?» → Selected: «"Guías de viaje", sin Topbar/buscador/mapa, estado vacío» (recommended)

## URLs y prerender

[auto] Q: «¿Navegación portada→guía?» → Selected: «`<a href>` de documento completo con baseURL y barra final» (recommended por research) — alternativa: `NuxtLink` SPA
[auto] Q: «¿Rutas de prerender?» → Selected: «derivadas de los trip.yml no draft» (recommended) — alternativa: solo crawl

## Redirección legacy

[auto] Q: «¿Mecanismo?» → Selected: «script inline en head solo en `/`, `^#[a-z0-9-]+$`, `location.replace`» (recommended) — alternativa: lista blanca de anclas generada de los datos

## Borradores

[auto] Q: «¿Qué significa draft?» → Selected: «excluido de Content en producción (ni portada, ni prerender, ni sql_dump); cargado en dev» (recommended; cierra CR-01/AR-10-02) — alternativa: solo filtrar en portada y prerender
[auto] Q: «¿Draft en la portada en dev?» → Selected: «nunca» (recommended)

## Paridad

[auto] Q: «¿Cómo mover Roma de URL?» → Selected: «harness con `ROMA_URL` primero, luego solo cambia la constante; `shell.spec` invertido + test portada vs Roma» (recommended por roadmap)

## Claude's Discretion

Nombres de componentes, utilidad de fechas, maquetación de la portada (UI-SPEC), mecanismo de derivación de rutas, servidor de test tipo Pages.

## Deferred Ideas

Imagen por tarjeta; draft visibles en dev; SPA entre viajes; WR-01..03 de la Fase 10; desbordamiento de pastillas.
