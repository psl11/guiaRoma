---
status: complete
phase: 12-formas-nuevas-de-viaje
source: [12-VERIFICATION.md]
started: 2026-11-21T12:20:00Z
updated: 2026-11-23T17:52:24.267Z
---

## Current Test

[testing complete]

## Tests

### 1. Los dibujos, colores y bandas nuevos de Campania se ven bien en claro y en oscuro
expected: En https://psl11.github.io/guiaRoma/trips/campania/ (la web publicada; en `pnpm dev` el mapa sale sin altura, defecto ya anotado): los dibujos nuevos de las fichas (mar, termas, río, sendero) se distinguen; en el horario de cada día, las franjas de ferry, coche, autobús y avión se leen bien; en el mapa, el marcador verde agua de naturaleza se distingue del resto. Todo legible con el tema claro y con el oscuro.
result: pass

### 2. «Ver ruta del día» del viernes 25 abre la ruta en coche
expected: En el viernes 25 de Campania, al pulsar «Ver ruta del día», Google Maps abre indicaciones EN COCHE del Vesubio al Rione Sanità y al estadio Maradona.
result: pass

### 3. La caja «Con niños» y el bloque «elige una» se ven bien en el móvil
expected: En el móvil (o con la ventana estrecha): la caja «Con niños» de una ficha (p. ej. Baia di Trentova o Valle del Calore) se ve en su sitio, con su propio tono y legible en claro y oscuro; en el jueves 24, las dos alternativas («Opción A» pueblos de ceramistas y cala / «Opción B» ríos y pozas) salen una debajo de otra, separadas por «— o bien —», sin salirse de la pantalla.
result: pass

### 4. Cómo funciona Campania te parece bien
expected: Te vale cómo quedó, ahora que Campania tiene su contenido real: los días con «elige una» ofrecen 2-3 alternativas dentro del horario; la ruta del día no mezcla paradas de alternativas distintas; cada día dice dónde dormís («Dormís en Ischia/Nápoles…»), sin marcar el alojamiento en el mapa; las fichas pueden llevar una caja «Con niños»; en los días con ferry no se ofrece ruta del día, y cada día puede ir a pie, en coche o en transporte público.
result: pass

### 5. Los avisos técnicos menores de la revisión se dejan para más adelante
expected: Aceptas dejar para más adelante los 9 avisos de la revisión de código de esta fase. Ninguno se nota hoy en la guía: el único con efecto real (en transporte público Google Maps no dibuja rutas de más de dos paradas) ya se evitó en el contenido de Campania, y el resto son casos que los datos actuales no provocan. También dos detalles visuales menores: las franjas de ferry y autobús algo pálidas.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

## Deferred Follow-Ups

- test: 5
  idea: "WR-01, WR-02 e IN-01…IN-07 de 12-REVIEW.md (ruta en transporte público con más de 2 paradas — ya evitada en el contenido de Campania; exclusión de paradas de opciones solo por `stop.ref`; robustez de marcadores/popups del mapa; día con avión no oculta la ruta; centinela de borrador solo en `trip.yml`; tipo `ChoiceRow` duplicado; popup de `nature` con `href=\"#\"`) y los avisos de 12-UI-REVIEW.md (franjas de ferry/autobús algo pálidas). Sin efecto visible hoy; aceptado diferirlos."
  deferred_at: 2026-11-23
