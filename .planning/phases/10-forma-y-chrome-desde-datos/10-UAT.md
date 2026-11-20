---
status: testing
phase: 10-forma-y-chrome-desde-datos
source: [10-VERIFICATION.md]
started: 2026-11-20T15:10:00Z
updated: 2026-11-20T15:10:00Z
---

## Current Test

number: 1
name: Confirmar las decisiones D-01…D-19 tomadas en modo --auto (10-CONTEXT.md / 10-DISCUSSION-LOG.md) mientras el usuario viajaba
expected: |
  El usuario las acepta o las ajusta. Las que más pesan: D-05(b) lista blanca estricta de enlaces en prosa (solo `#id` y `http(s)://`); D-09 etiquetas estructurales («Pratica», «cartografia», «El mapa del viaje») como chrome compartido fijo, no configurable; D-14 respaldo neutro (pestaña y marca = título plano del viaje; sin pie ni leyenda si el viaje no los define); D-07/D-08 orden fijo y presencia por datos sin lista en trip.yml
awaiting: user response

## Tests

### 1. Confirmar las decisiones D-01…D-19 tomadas en modo --auto (10-CONTEXT.md / 10-DISCUSSION-LOG.md) mientras el usuario viajaba
expected: El usuario las acepta o las ajusta. Las que más pesan: D-05(b) lista blanca estricta de enlaces en prosa (solo `#id` y `http(s)://`); D-09 etiquetas estructurales («Pratica», «cartografia», «El mapa del viaje») como chrome compartido fijo, no configurable; D-14 respaldo neutro (pestaña y marca = título plano del viaje; sin pie ni leyenda si el viaje no los define); D-07/D-08 orden fijo y presencia por datos sin lista en trip.yml
result: [pending]

### 2. Decidir el destino de los 3 warnings abiertos de 10-REVIEW.md (WR-01, WR-02, WR-03) y de los 6 info (todos `open` en 10-REVIEW-DISPOSITION.md)
expected: Cada uno queda en fixed / deferred / skipped. WR-01 y WR-03 debilitan la garantía de la puerta de datos (ver Anti-patrones); WR-02 afecta solo a títulos con énfasis anidado o `_` dentro de palabra cuando el viaje no define pageTitle/brand
result: [pending]

### 3. Confirmar que el viaje dev-only `forma` (D-15) puede quedar sin `draft: true` hasta la Fase 11
expected: El usuario acepta que sus filas sigan pudiendo entrar en el `sql_dump` público (CR-01 de la Fase 9, ya diferido a ROUTE-05) o pide mitigarlo antes
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
