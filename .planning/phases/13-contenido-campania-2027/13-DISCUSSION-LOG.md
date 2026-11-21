# Phase 13: Contenido Campania 2027 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-21
**Phase:** 13-contenido-campania-2027
**Mode:** `--auto`. The user is travelling. Two blocking decisions were asked before the run, and the rest are recommended defaults.
**Areas discussed:** car return date, Campania publication, the 10 days, cards and images, field data and «por confirmar», Gastronomía/Reservas/Práctica, process and parity

---

## Car return date (CAMP-01) — asked of the user

| Option | Description | Selected |
|--------|-------------|----------|
| The 26th (Saturday by car) | The car is returned on Saturday 26 in the evening; both day trips on the 26th go by car | ✓ |
| The 25th (Saturday without a car) | Saturday 26 by train (Cumana/Circumflegrea, train to Caserta) and bus | |
| Not decided yet | Written with the car and marked «por confirmar» | |

**User's choice:** The 26th (Saturday by car).

## Campania publication (ROUTE-05) — asked of the user

| Option | Description | Selected |
|--------|-------------|----------|
| When Phase 13 closes (Recommended) | Remove `draft` once everything is written and passes the gate; doubtful data marked «por confirmar» | ✓ |
| After your review | Stays a draft until the UAT of Phase 13 | |
| Now, with provisional days | Published as soon as something useful exists | |

**User's choice:** When Phase 13 closes.

## Areas resolved with `--auto`

```
[auto] Días — Q: "¿Slugs?" → Selected: "con fecha, 10 días, cejas en español" (recommended default)
[auto] Días — Q: "¿Bases?" → Selected: "napoles/procida/ischia/salerno según el planning; 28 sin stay" (recommended default)
[auto] Días — Q: "¿Ruta en días de avión / transit (WR-01/IN-04)?" → Selected: "mitigar por contenido con route.enabled/mode, sin código" (recommended default)
[auto] Fichas — Q: "¿Imágenes?" → Selected: "Wikimedia enlazada y verificada + motif de reserva, sin motifs nuevos" (recommended default)
[auto] Datos de campo — Q: "¿Cómo marcar lo dudoso?" → Selected: "**⚠ por confirmar** en línea, sin campo de esquema" (recommended default)
[auto] Gastronomía — Q: "¿Locales concretos?" → Selected: "solo si la investigación los verifica; si no, tipo de sitio y «a elegir sobre el terreno»" (recommended default)
[auto] Publicación — Q: "¿Centinela de build-isolation?" → Selected: "invertir la aserción de campania; el aislamiento de borradores sigue con prueba/forma" (recommended default)
[auto] Proceso — Q: "¿Cambios de código?" → Selected: "ninguno; si hiciera falta forma nueva → inserción 12.x" (recommended default)
```

## Claude's Discretion

- The text of each day and card, `pace` per row, motifs, `infoCards`, the quote, and the split into plans.

## Deferred Ideas

- Stay markers on the map; an A/B selector; local images and offline (PWA).
- A real fix for WR-01/IN-04 in code.
- An `artists` collection for Campania.
