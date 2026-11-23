# Phase 12: Formas nuevas de viaje - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-21
**Phase:** 12-formas-nuevas-de-viaje
**Mode:** --auto (user travelling); EXT-01/EXT-04 asked to the user beforehand (roadmap ⚠ pre-planning decisions)
**Areas discussed:** Opciones A/B, Dibujos de naturaleza, Bases, Transporte, Nota familiar, Mapa multi-ciudad, Ruta por modo, Esqueleto Campania, Paridad/CSS

---

## Asked to the user (2026-11-21)

| Question | Options | Selected |
|----------|---------|----------|
| EXT-01: ¿cómo mostrar un día con dos alternativas? | Apiladas, siempre visibles (Recomendado) / Selector que oculta la otra | **Apiladas, siempre visibles** |
| EXT-04: ¿dibujos de reserva de naturaleza? | Dibujos SVG nuevos (Recomendado) / Reutilizar provisionalmente | **Dibujos SVG nuevos** |

## Auto-selected (recommended defaults)

- [auto] Opciones A/B — Q: "¿`choice` en timeline o `day.options`?" → Selected: "fila `choice` en `timeline`" (research SUMMARY recomienda; permite filas comunes antes/después)
- [auto] Opciones A/B — Q: "¿Ruta del día con opciones?" → Selected: "excluir paradas dentro de opciones" (alt: ruta por opción — scope creep)
- [auto] Opciones A/B — Q: "¿Etiqueta de opción?" → Selected: "texto libre corto" (Campania usa A/B y 1/2)
- [auto] Bases — Q: "¿Nombre del campo?" → Selected: "`trip.stays[]` + `day.stay`" (alt: `bases`, confunde con baseURL)
- [auto] Bases — Q: "¿Marcadores de alojamiento?" → Selected: "diferidos (P2)"
- [auto] Transporte — Q: "¿Valores?" → Selected: "ferry, car, bus, bike, plane en transport y stats, con test enum→CSS"
- [auto] Naturaleza — Q: "¿Qué motifs?" → Selected: "sea, thermal, river, trail" (los 4 propuestos al usuario)
- [auto] Nota familiar — Q: "¿Forma?" → Selected: "`family?: Md` en ficha, caja «Con niños»" (alt: `{text, level}`)
- [auto] Mapa — Q: "¿`trip.map` opcional?" → Selected: "sigue obligatorio, fitBounds actual" (sin cambio de esquema; Roma intacta)
- [auto] Ruta — Q: "¿Ocultar en días de ferry automático o por dato?" → Selected: "automático por fila ferry + override `route.enabled`"
- [auto] Esqueleto — Q: "¿Viaje nuevo o ampliar `forma`?" → Selected: "`content/trips/campania/` draft" (lo pide el roadmap)
- [auto] CSS — Q: "¿Guardián `.trip-index` de multitrip.css?" → Selected: "adaptar a lista blanca de clases nuevas + ninguna aparece en el HTML de Roma"

## Claude's Discretion
- Glifos/colores, diseño de los SVG, estructura del componente `choice`, posición de «Dormís en…» y «Con niños», texto del esqueleto.

## Deferred Ideas
- Selector A/B con memoria (TRIP-02); marcadores de bases, enfocar día, clustering, polilíneas; motifs extra; WR-01..03 de la Fase 11.
