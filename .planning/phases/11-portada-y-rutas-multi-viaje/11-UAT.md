---
status: testing
phase: 11-portada-y-rutas-multi-viaje
source: [11-VERIFICATION.md]
started: 2026-11-20T21:30:00Z
updated: 2026-11-20T21:30:00Z
---

## Current Test

number: 1
name: Revisar la portada en un móvil real, con tema claro y oscuro
expected: |
  `/guiaRoma/` muestra «Guías de viaje» y la tarjeta de Roma legible y pulsable en móvil, en claro y en oscuro; la línea «19–23 de junio de 2026 · Roma» se lee bien (UI-REVIEW: tamaño de la meta y contraste del hover en oscuro, 4.29:1); el enlace «← Todos los viajes» del pie de Roma vuelve a la portada
awaiting: user response

## Tests

### 1. Revisar la portada en un móvil real, con tema claro y oscuro
expected: `/guiaRoma/` muestra «Guías de viaje» y la tarjeta de Roma legible y pulsable en móvil, en claro y en oscuro; la línea «19–23 de junio de 2026 · Roma» se lee bien (UI-REVIEW: tamaño de la meta y contraste del hover en oscuro, 4.29:1); el enlace «← Todos los viajes» del pie de Roma vuelve a la portada
result: [pending]

### 2. Confirmar las decisiones D-06…D-23 tomadas en modo --auto (11-CONTEXT.md) mientras el usuario viajaba
expected: El usuario las acepta o las ajusta. Las que más pesan: título «Guías de viaje» y tarjeta sin imagen (D-07/D-11); orden por `startDate` descendente (D-10); fechas cruzando mes con ambas completas («30 de junio de 2026 – 2 de julio de 2026», D-09/UI-SPEC); texto del `summary` de Roma (UI-SPEC); `draft` excluido de Content en producción y nunca listado en la portada (D-16); redirección legacy sin lista blanca, solo `^#[a-z0-9-]+$` (D-14); pie presente en todas las guías porque aloja el enlace (D-03, sustituye D-14 de la Fase 10)
result: [pending]

### 3. Decidir el destino de los 3 warnings de 11-REVIEW.md (WR-01, WR-02, WR-03) y de los 6 info (todos `open` en 11-REVIEW-DISPOSITION.md)
expected: Cada uno queda en fixed / deferred / skipped. WR-01 (regla `trip-summary-link` eludible: email, `<a>` crudo, enlace por referencia) y WR-02 (Markdown de bloque en `summary`, p. ej. «2027. …» → `<ol>`) pueden romper la tarjeta cuando Campania tenga `summary`; WR-03: si la consulta de la portada falla en el prerender se publica una portada vacía con 200. Recomendado arreglarlos antes de que Campania deje de ser draft (Fase 13)
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
