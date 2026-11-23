# Phase 10: Forma y chrome desde datos - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-20
**Phase:** 10-forma-y-chrome-desde-datos
**Areas discussed:** Días desde datos, Secciones opcionales, Chrome desde trip.yml, Test-trampa y viaje de forma
**Modo:** `--auto` (el usuario está de viaje: «podemos ir avanzando con la fase 10 y cuando pueda hacemos los verify»). Todas las elecciones son la opción recomendada, sin preguntar.

---

## Días desde datos

| Option | Description | Selected |
|--------|-------------|----------|
| `v-for` sobre los días + `pill` opcional con respaldo `dayLabel` | Roma idéntica; viajes nuevos desambiguan con `pill` | ✓ |
| Derivar siempre la etiqueta (añadir fecha automáticamente) | Cambiaría el formato y arriesga Roma | |
| Lista de días fija ampliada | No escala | |

**User's choice:** [auto] opción recomendada. Además se pliegan WR-01/WR-02 (recomendación del UAT 09 punto 5).

## Secciones opcionales

| Option | Description | Selected |
|--------|-------------|----------|
| Por presencia de datos, orden fijo, función pura `buildTripLayout` | Sin campo nuevo; Roma 12 pastillas | ✓ |
| Lista explícita `sections:` en `trip.yml` | Más control, más superficie de error | |

**User's choice:** [auto] opción recomendada.

## Chrome desde trip.yml

| Option | Description | Selected |
|--------|-------------|----------|
| Campos opcionales estructurados (`brand`, `footer`, `mapLegend`, `pageTitle`) + respaldo neutro | DOM de Roma idéntico; nada de Roma se cuela | ✓ |
| HTML libre en YAML | Fácil, pero frágil e inseguro | |
| Respaldo a los textos de Roma | Incumple SHAPE-05 | |

**User's choice:** [auto] opción recomendada. Etiquetas estructurales («Pratica», «cartografia») siguen fijas.

## Test-trampa y viaje de forma

| Option | Description | Selected |
|--------|-------------|----------|
| Nuevo viaje ficticio dev-only de 10 días + Playwright contra dev | No toca `prueba` ni sus tests | ✓ |
| Ampliar `prueba` | Rompe la estabilidad de los tests de la Fase 9 | |

**User's choice:** [auto] opción recomendada.

---

## Claude's Discretion

- Formato exacto de `brand`/`footer`, firma de `buildTripLayout`, nombre del viaje de forma, orden de grupos de gastronomía para viajes nuevos.

## Deferred Ideas

- Etiquetas de pastillas configurables por viaje; IN-05 y CR-01 de la Fase 9 (ver CONTEXT).
