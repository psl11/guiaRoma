---
phase: 12-formas-nuevas-de-viaje
verified: 2026-11-21T12:00:00Z
status: human_needed
score: 5/5 must-haves verified
covered_files:
  - ".planning/phases/12-formas-nuevas-de-viaje/12-01-PLAN.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-01-SUMMARY.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-02-PLAN.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-02-SUMMARY.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-03-PLAN.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-03-SUMMARY.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-04-PLAN.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-04-SUMMARY.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-05-PLAN.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-05-SUMMARY.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-06-PLAN.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-06-SUMMARY.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-07-PLAN.md"
  - ".planning/phases/12-formas-nuevas-de-viaje/12-07-SUMMARY.md"
  - "app/assets/css/tripshapes.css"
  - "app/components/DaySection.vue"
  - "app/components/LeafletMap.client.vue"
  - "app/components/MonumentCard.vue"
  - "app/components/TimelineChoice.vue"
  - "app/utils/dayRoute.ts"
  - "app/utils/mapMarkers.ts"
  - "app/utils/svgMotifs.ts"
  - "app/utils/timelineRows.ts"
  - "app/utils/tripStays.ts"
  - "content/trips/campania/trip.yml"
  - "shared/schemas.ts"
covered_digest: "v4:sha256:ba07704de7e095be1b9be530696b0c997be91e49b01d575070da30f6428f0904"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Abrir `pnpm dev` -> /trips/campania en un navegador real, tema claro y oscuro: mirar los 4 motivos SVG nuevos (sea, thermal, river, trail), las bandas y glifos de los 5 transportes (ferry, coche, autobus, bici, avion) y el verde agua del marcador de naturaleza"
    expected: "Cada transporte se distingue a simple vista de los demas y del estilo base; los glifos emoji se ven (el headless no tenia fuente emoji); los dibujos de reserva son legibles y coherentes con la paleta; contraste correcto en claro y oscuro"
    why_human: "Juicio visual; los E2E comprueban colores computados y existencia de reglas, no el aspecto ni la fuente emoji real"
  - test: "En el viernes 25 de Campania pulsar «Ver ruta del dia» en un navegador real"
    expected: "Google Maps abre direcciones en coche (travelmode=driving) con Vesubio como origen y Rione Sanita como destino"
    why_human: "Servicio externo (Google Maps); el test solo comprueba el href"
  - test: "Ver la caja «Con niños» de Baia di Sorgeto en su sitio dentro de la ficha (claro y oscuro) y el bloque «Elige una» del jueves 24 a 375 px"
    expected: "La caja familiar queda donde el diseño la pide, con tono propio y legible; las opciones A/B se leen apiladas con «— o bien —» sin desbordar"
    why_human: "Colocacion y legibilidad percibidas; UI-REVIEW dejo 19/24 con puntos de criterio"
  - test: "Confirmar las decisiones tomadas en modo --auto (D-01..D-19) de 12-CONTEXT.md"
    expected: "El usuario las acepta o pide cambios (p. ej. A/B siempre visibles, motivos SVG nuevos, `stays`/`stay`, `route.mode`)"
    why_human: "Decisiones de producto adoptadas sin interaccion del usuario"
---

# Phase 12: Formas nuevas de viaje - Verification Report

**Phase Goal:** La guia sabe mostrar todo lo que un viaje como Campania necesita y Roma no tenia (dias con alternativas, bases de alojamiento, ferris y coche, lugares de naturaleza, varias ciudades en el mapa), validado con un esqueleto minimo de Campania antes de redactar su contenido.
**Verified:** 2026-11-21
**Status:** human_needed (todo lo automatizable verificado; quedan comprobaciones visuales/externas)
**Re-verification:** No, verificacion inicial

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Un dia con alternativas muestra «Elige una» con A y B apiladas y separadas por «— o bien —», filas comunes antes y despues; ambas visibles con cualquier ritmo y en resumen | VERIFIED | `ChoiceRow` estricto en `shared/schemas.ts` (l.160-187, `z.strictObject`, sin `pace` en el choice). `TimelineChoice.vue` pinta `div.tl-choice[role=group]`, `DEFAULT_HEADING = 'Elige una'`, `div.tl-choice-sep` «— o bien —» solo entre opciones; raiz `div`, no `section`. `Timeline.vue` despacha `choice: resolveComponent('TimelineChoice')`. `jueves-24.yml` tiene stop comun -> choice A/B -> choice de cena (3 opciones, contiguo) -> stop comun. E2E «las opciones siguen visibles con cualquier ritmo, Caminar menos y resumen (D-03)» en verde (test:trips 44/44 re-ejecutado por mi) |
| 2 | Cada dia del esqueleto indica «Dormís en…» y el timeline muestra ferry, coche, autobus, bici y avion con estilo propio | VERIFIED | Los 5 YAML de `content/trips/campania/days/` tienen `stay:` (salerno, napoles, procida, ischia segun dia) y `trip.yml` declara 4 `stays`. `stayFor` + `div.day-stay` en `DaySection.vue` (l.110-114). Dias: sabado-19 plane+bus (+ tramo sin variante), domingo-20 ferry+bike, viernes-25 car. `tripshapes.css` l.5-28: banda, glifo de cabecera y glifo de stats para las 5 variantes. `enumStyles.spec.ts` recorre `TransportVariant`/`StatVariant`/`Motif`/`PlaceType` (con `train` exento). E2E «cada dia dice donde se duerme» y «los cinco tramos nuevos» en verde |
| 3 | Playa/poza/rio/sendero con ficha, marcador propio y dibujo de reserva; una ficha puede mostrar nota para familias con niños | VERIFIED | `PlaceType` incluye `nature`; `MARKER_STYLE.nature = #2f6f73`; `markerPopupHtml` caso `nature`; `Motif` +sea/thermal/river/trail con SVG reales y ids unicos en `svgMotifs.ts` (l.64-67). 4 fichas nature en Campania (`baia-di-sorgeto.yml` con `type: nature`, `motif: thermal`, `hero` roto a proposito -> `heroFailed` -> `v-html motifSvg`). `MonumentSchema.family` + `MonumentCard` `div.culture-box.family-box` «Con niños» (l.322-326); `baia-di-sorgeto.yml` lo usa. E2E nature y family en verde, incluido tema claro/oscuro |
| 4 | El mapa multi-ciudad encuadra todos sus marcadores (Napoles, Procida, Ischia, Salerno), Roma conserva su vista | VERIFIED | `LeafletMap.client.vue` l.132 `fitBounds(latLngBounds(markers).pad(0.1))` para todo viaje (el mismo codigo que Roma; el setView inicial sigue siendo `trip.map`). Fichas de Campania en las 4 ciudades (Duomo/Raito Salerno, Spaccanapoli Napoles, Corricella/Pozzo Vecchio Procida, Sorgeto/Epomeo Ischia). E2E «el mapa encuadra Napoles, Procida, Ischia y Salerno a la vez (EXT-05)» en verde (contencion en `.leaflet-container`). Roma: popups/colores de los 39 marcadores fijados byte a byte en `mapMarkers.spec.ts` |
| 5 | «Ver ruta del dia» abre Google Maps en el modo adecuado y no aparece en dias de ferry; Roma a pie con las mismas paradas; paridad verde | VERIFIED | `RouteMode` + `DaySchema.route` estricto; `buildDirUrl(points, mode?)` con `mode ?? 'walking'` (URL de Roma identica); `routeCards` excluye fichas solo-de-opcion (D-04); `routeVisible` oculta con ferry (tambien dentro de opciones), < 2 paradas, `enabled`. `DaySection.vue` l.139-145 lo usa. Viernes 25 = `route.mode: driving`; domingo 20 (ferry) sin boton: E2E en verde. Frozen diff vs 7288781 (`content/trips/roma`, `base/tokens/fonts/leaflet.css`, `tests/parity`) vacio; orquestador: parity 110/110 sin `--update-snapshots` |

**Score:** 5/5 truths verified (0 present-behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/TimelineChoice.vue` | Bloque de alternativas | VERIFIED | Sustantivo, cableado desde `Timeline.vue`, datos del YAML fluyen |
| `app/assets/css/tripshapes.css` | CSS nuevo, ultima en `css[]` | VERIFIED | Existe, guardian `tripShapesCss.spec.ts` verde |
| `app/utils/timelineRows.ts`, `dayRoute.ts`, `tripStays.ts` | Logica pura | VERIFIED | Importadas por DaySection/TripView; tests unitarios verdes |
| `app/utils/mapMarkers.ts`, `svgMotifs.ts`, `LeafletMap.client.vue` | Marcador/SVG nature | VERIFIED | Tabla leida por el componente; 23 motivos |
| `shared/schemas.ts` | Enums y esquemas estrictos | VERIFIED | `ChoiceRow`, `Stay`, `TransportVariant`, `StatVariant`, `RouteMode`, `family`, `nature` |
| `content/trips/campania/**` | Esqueleto draft | VERIFIED | `trip.yml` + 5 dias + 11 fichas, `draft: true` (excluido de produccion, centinela en build-isolation) |

### Key Link Verification

| From | To | Via | Status |
|------|----|----|--------|
| Timeline.vue | TimelineChoice.vue | `resolveComponent('TimelineChoice')` | WIRED |
| TripView.vue | DaySection.vue | `stayFor(day, trip.stays)` -> prop `stay` | WIRED |
| DaySection.vue | dayRoute.ts | `routeCards/routeVisible/routeTitle/buildDirUrl(…, day.route?.mode)` | WIRED |
| LeafletMap.client.vue | mapMarkers.ts | `MARKER_STYLE[m.type]`, `markerPopupHtml(m)` | WIRED |
| MonumentCard.vue | schema `family` | `v-if="monument.family"` | WIRED |
| searchIndex.ts | family | `buildHaystack` incluye `family` | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Variable | Source | Real Data | Status |
|----------|----------|--------|-----------|--------|
| TimelineChoice | `row.options` | `day.timeline` de Nuxt Content (YAML campania) | Si | FLOWING |
| DaySection (stay) | `stay` | `trip.stays` + `day.stay` | Si | FLOWING |
| LeafletMap | `markers` | `monById` + `mapExtras` | Si | FLOWING |
| MonumentCard | `monument.family` | YAML de la ficha | Si | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit | `pnpm test:unit` | 541/541 | PASS |
| Data gate | `pnpm test:data` | 560/560 | PASS |
| Trips E2E (24 `campania:`) | `rm -rf .data .nuxt .output; pnpm test:trips` | 44 passed | PASS |
| Roma congelada | `git diff 7288781 HEAD -- content/trips/roma base/tokens/fonts/leaflet.css tests/parity` | vacio | PASS |
| Parity 110/110, typecheck, lint | no re-ejecutados por mi | evidencia del orquestador (gate-12w7.log) | ACEPTADO |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| EXT-01 | 12-01, 12-02 | Opciones A/B apiladas con «— o bien —» | SATISFIED | SC1 |
| EXT-02 | 12-03 | «Dormís en…» por dia | SATISFIED | SC2 |
| EXT-03 | 12-05 | Estilo propio de ferry/coche/bus/bici/avion | SATISFIED | SC2 |
| EXT-04 | 12-04 | Naturaleza: ficha, marcador, SVG de reserva | SATISFIED | SC3 |
| EXT-05 | 12-07 | Mapa multi-ciudad encuadra todo | SATISFIED | SC4 |
| EXT-06 | 12-06 | Ruta del dia por modo / oculta en ferry | SATISFIED | SC5 |
| EXT-07 | 12-07 | Nota «Con niños» | SATISFIED | SC3 |

Los 7 IDs aparecen en el `requirements:` de los PLAN (01/02 EXT-01, 03 EXT-02, 04 EXT-04, 05 EXT-03, 06 EXT-06, 07 EXT-07+EXT-05) y todos estan en REQUIREMENTS.md mapeados a la Fase 12. Sin requisitos huerfanos.

### Anti-Patterns Found

Escaneo `TBD|FIXME|XXX` en los ficheros de app/shared/content de la fase: ninguno. Los hero `example.invalid` de las fichas de Campania son intencionales (esqueleto draft; ejercitan el fallback SVG) y la Fase 13 los sustituye.

| File | Item | Severity | Impact |
|------|------|----------|--------|
| `app/utils/dayRoute.ts` | WR-01 (12-REVIEW): `route.mode: transit` con varias paradas genera una URL con waypoints que Google Maps no enruta en transporte publico | Warning | Ningun dia del esqueleto usa `transit`; la Fase 13 debe evitarlo o aceptar una ruta de 2 puntos |
| `app/utils/timelineRows.ts` | WR-02: D-04 solo mira `stop.ref`; una ficha solo-de-opcion citada por otra via se colaria en la ruta | Warning | Latente; no ocurre con los datos actuales |
| varios | IN-01..IN-07 | Info | Abiertos en 12-REVIEW-DISPOSITION.md; sin impacto en los SC |

### Human Verification Required

1. **Aspecto de motivos y transportes (claro/oscuro)**: abrir `/trips/campania` en `pnpm dev` y revisar los 4 SVG nuevos, las 5 bandas/glifos y el marcador verde agua. Esperado: distinguibles, legibles, emoji visibles. Humano: juicio visual; headless sin fuente emoji.
2. **Enlace de ruta en coche del viernes 25**: pulsarlo en un navegador real. Esperado: Google Maps en modo coche, Vesubio -> Rione Sanita.
3. **«Con niños» y «Elige una» a 375 px**: colocacion y legibilidad.
4. **Decisiones --auto D-01..D-19**: confirmar con el usuario.

### Gaps Summary

Sin huecos. Los cinco criterios de exito del ROADMAP estan respaldados por codigo real, cableado y con datos fluyendo, y re-confirmados con la ejecucion de test:unit (541), test:data (560) y test:trips (44, incluidos los 24 E2E `campania:`) hechas en esta verificacion; Roma sigue congelada (diff vacio) y la paridad (110/110) la certifica la evidencia del orquestador. El estado es `human_needed` unicamente por los puntos visuales/externos y de confirmacion de decisiones de arriba; no hay blockers.

---

_Verified: 2026-11-21_
_Verifier: Claude (gsd-verifier)_
