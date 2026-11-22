---
status: testing
phase: 13-contenido-campania-2027
source: [13-VERIFICATION.md]
started: 2026-11-22T02:40:00Z
updated: 2026-11-22T02:40:00Z
---

## Current Test

number: 1
name: Leer Campania en el navegador y en el móvil (375 px, claro y oscuro)
expected: |
  `pnpm dev` → /guiaRoma/trips/campania (o la build servida bajo guiaRoma/): tono slow, auténtico y en vosotros como Roma; nada se desborda a 375 px en ningún tema; las alternativas A/B (jueves 24) y 1/2 (sábado 26) se leen apiladas con claridad
awaiting: user response

## Tests

### 1. Leer Campania en el navegador y en el móvil (375 px, claro y oscuro)
expected: Tono slow, auténtico y en vosotros como Roma; nada se desborda a 375 px en ningún tema; las alternativas A/B (jueves 24) y 1/2 (sábado 26) se leen apiladas con claridad
result: [pending]

### 2. Revisar que cada foto de las 24 fichas muestra el lugar correcto
expected: Cada imagen corresponde a su ficha (Sorgeto, Epomeo, Corricella, Cuma, Vomero…); con la red cortada se ve el dibujo (motif) en su lugar. Las 24 URLs responden 200, pero el tema solo se comprobó por el título del archivo
result: [pending]

### 3. Revisar los datos concretos y las decisiones tomadas mientras dormías/viajabas
expected: |
  Los datos coinciden con lo que sabéis del viaje: vuelos (sáb 19 aterrizaje 16:35, lun 28 09:55 a Palma), coche (recogida mié 23 16:00 y devolución sáb 26 en Capodichino), Ultimo vie 25 y PTN dom 27, alojamientos por base. Decisiones a aceptar o ajustar (13-CONTEXT.md D-01…D-26): restaurantes solo los verificados (Da Concettina ai Tre Santi, Tenuta Vannulo, Caracalè, La Lampara, Il Focolare, Hostaria Il Brigante) y el resto «a elegir sobre el terreno»; Napoli Sotterranea sin nota «Con niños» porque el domingo 27 ya no están; línea de créditos de fotos en el pie
result: [pending]

### 4. Confirmar en primavera de 2027 los «⚠ por confirmar»
expected: Cada valor marcado (horarios y muelles de ferry, restricciones de coche en Procida/Ischia, hora y accesos de los conciertos, fecha de PTN, Sorgeto de noche con niños, alojamientos, punto de devolución del coche) se sustituye por el confirmado o queda marcado. Hay 172 marcas; la lista agrupada está en 13-08-SUMMARY.md
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
