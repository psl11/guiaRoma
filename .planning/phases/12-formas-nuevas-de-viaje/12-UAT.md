---
status: testing
phase: 12-formas-nuevas-de-viaje
source: [12-VERIFICATION.md]
started: 2026-11-21T12:20:00Z
updated: 2026-11-21T12:20:00Z
---

## Current Test

number: 1
name: Ver las formas nuevas de Campania en un navegador real, tema claro y oscuro
expected: |
  `pnpm dev` → /guiaRoma/trips/campania: los 4 dibujos nuevos (sea, thermal, river, trail), las bandas y glifos de ferry/coche/autobús/bici/avión y el verde agua del marcador de naturaleza se distinguen y se leen bien en claro y en oscuro (el headless no tenía fuente emoji; en dev el mapa mide 0 px, defecto previo anotado en deferred-items.md)
awaiting: user response

## Tests

### 1. Ver las formas nuevas de Campania en un navegador real, tema claro y oscuro
expected: `pnpm dev` → /guiaRoma/trips/campania: los 4 dibujos nuevos (sea, thermal, river, trail), las bandas y glifos de ferry/coche/autobús/bici/avión y el verde agua del marcador de naturaleza se distinguen y se leen bien en claro y en oscuro (el headless no tenía fuente emoji; en dev el mapa mide 0 px, defecto previo anotado en deferred-items.md)
result: [pending]

### 2. En el viernes 25 de Campania pulsar «Ver ruta del día» en un navegador real
expected: Google Maps abre direcciones en coche (travelmode=driving) con Vesubio como origen y Rione Sanità como destino
result: [pending]

### 3. Ver la caja «Con niños» de Baia di Sorgeto y el bloque «Elige una» del jueves 24 a 375 px
expected: La caja familiar queda en su sitio, con tono propio y legible en claro y oscuro; las opciones A/B se leen apiladas con «— o bien —» sin desbordar
result: [pending]

### 4. Confirmar las decisiones D-01…D-19 tomadas en modo --auto (12-CONTEXT.md) mientras el usuario viajaba
expected: El usuario las acepta o las ajusta. Las que más pesan: fila `choice` dentro del timeline con 2-3 opciones y etiqueta libre (D-01); la ruta del día ignora las paradas de dentro de las opciones (D-04); `trip.stays` + `day.stay` y «Dormís en {nombre}» (D-06/D-07); sin marcadores de alojamiento en el mapa (D-08); `family` como caja «Con niños» (D-12); ruta oculta automáticamente en días con ferry y `route.mode` walking/driving/transit (D-14); esqueleto `campania` como borrador con contenido provisional (D-15)
result: [pending]

### 5. Decidir el destino de los hallazgos abiertos de 12-REVIEW.md (WR-01, WR-02 + 7 info, todos `open` en 12-REVIEW-DISPOSITION.md) y de los avisos de 12-UI-REVIEW.md
expected: Cada uno queda en fixed / deferred / skipped. WR-01: `route.mode: transit` con varias paradas genera una URL que Google Maps no traza en transporte público (Campania aún no lo usa). WR-02: la exclusión de paradas de opciones solo mira `stop.ref` (latente, no ocurre en los datos actuales). IN-04: un día con avión no oculta la ruta automáticamente. UI-REVIEW: fila `meta` con 🚌 duplicado en jueves-24 (contenido provisional) y bandas de ferry/autobús algo lavadas al 10 %. Recomendado decidir WR-01/IN-04 antes de redactar Campania (Fase 13)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
