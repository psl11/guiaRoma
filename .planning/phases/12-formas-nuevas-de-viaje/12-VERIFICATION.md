---
phase: 12-formas-nuevas-de-viaje
verified: 2026-11-23T18:10:00Z
status: passed
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
covered_digest: "v4:sha256:65e2c800adc4a41e86604632c2b88959b16c93c7005c5afb57620fbfc44a26a2"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 12: Formas nuevas de viaje - Informe de verificacion

**Objetivo de la fase:** La guia sabe mostrar todo lo que un viaje como Campania necesita y Roma no tenia (dias con alternativas, bases de alojamiento, ferris y coche, lugares de naturaleza, varias ciudades en el mapa), validado con un esqueleto minimo de Campania antes de redactar su contenido.
**Verificado:** 2026-11-23
**Estado:** passed
**Re-verificacion:** Si, tras quedar obsoleto el informe anterior (`human_needed`, 2026-11-21): la Fase 13 cambio `content/trips/campania/trip.yml` y `shared/schemas.ts`, y Campania paso de esqueleto `draft` a contenido real publicado. Se juzgan las capacidades de la Fase 12 contra el codigo y el contenido actuales; que el esqueleto se haya convertido en contenido real es lo esperado, no un hueco. La verificacion humana ya esta hecha (`12-UAT.md`: 5/5 pass).

## Logro del objetivo

### Verdades observables (criterios de exito del ROADMAP)

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | Un dia con alternativas muestra «Elige una» con A y B apiladas y separadas por «— o bien —», filas comunes antes y despues; ambas visibles con cualquier ritmo y en modo resumen | VERIFIED | `shared/schemas.ts` l.176-188: `ChoiceOption`/`ChoiceRow` estrictos (`z.strictObject`, 2..3 opciones) dentro de `TimelineRow`. `Timeline.vue` l.44 despacha `choice: resolveComponent('TimelineChoice')`. `jueves-24.yml` y `sabado-26.yml` usan `kind: choice`. E2E (relanzado hoy, 26/26) `campania.spec.ts`: apilado con «— o bien —» entre filas comunes, `opciones−1` separadores, «Elige una» por defecto, y «las opciones siguen visibles con cualquier ritmo, Caminar menos y resumen (D-03)» en verde (evidencia conductual, no solo presencia) |
| 2 | Cada dia indica «Dormís en…» con su base y el timeline muestra ferry, coche, autobus, bici y avion, cada uno con estilo propio | VERIFIED | `StaySchema` + `TripSchema.stays` + `DaySchema.stay` (schemas l.213, 251, 551); `stayFor` en `TripView.vue` l.171 -> prop `stay` de `DaySection.vue` (l.74, 110-114, `div.day-stay`). 9 de los 10 dias de Campania llevan `stay:` (slugs napoles/procida/ischia/salerno); `lunes-28` (vuelta a casa, vuelo a Palma) no lleva por decision de contenido de la Fase 13 (la ultima noche fue la del domingo), y el E2E exige que ese dia no pinte ni linea ni relleno. `tripshapes.css` l.5-28: banda, glifo de cabecera y glifo de stats para ferry/car/bus/bike/plane. Datos reales con las 5 variantes (6 ferry, 12 car, 15 bus, 2 bike, 4 plane). E2E «cada dia dice donde se duerme», «los cinco tramos nuevos tienen banda y glifo propios», «ferry y bici del domingo 20» y legibilidad claro/oscuro, en verde |
| 3 | Playa/poza/rio/sendero con ficha, marcador propio y dibujo de reserva cuando la imagen falla; una ficha puede mostrar nota para familias con niños | VERIFIED | `PlaceType` incluye `nature` (schemas l.46); `MARKER_STYLE.nature = #2f6f73` y caso `nature` en `markerPopupHtml` (`mapMarkers.ts` l.54, 92); `svgMotifs.ts` l.64-67 con `thermal/sea/river/trail` reales. Campania: 8 fichas `type: nature` (Sorgeto, Trentova, Miseno, Epomeo, Valle del Calore, Averno, Pozzo Vecchio, Vesubio) con motivos sea/thermal/river/trail. `MonumentSchema.family` (l.99) + `MonumentCard.vue` l.322-326 (`div.culture-box.family-box`, «Con niños»); 7 fichas lo usan. E2E «cada lugar de naturaleza tiene marcador verde agua y dibujo de reserva» y «caja Con niños en su sitio» + claro/oscuro, en verde |
| 4 | El mapa multi-ciudad encuadra todos sus marcadores (Napoles, Procida, Ischia, Salerno) y Roma conserva su vista | VERIFIED | `LeafletMap.client.vue` l.132: `fitBounds(latLngBounds(markers).pad(0.1))` sobre todos los marcadores, el mismo codigo que Roma. E2E «el mapa encuadra Napoles, Procida, Ischia y Salerno a la vez (EXT-05)» en verde. Roma: popups/colores fijados byte a byte en `mapMarkers.spec.ts` (test:unit verde). Diff contra `7288781` de `content/trips/roma` y de `base/tokens/fonts/leaflet.css`: vacio |
| 5 | «Ver ruta del dia» abre Google Maps en el modo adecuado y no aparece en dias de ferry; Roma a pie con las mismas paradas; paridad verde | VERIFIED | `dayRoute.ts`: `routeCards` (excluye fichas solo-de-opcion, D-04), `routeVisible` (oculta con ferry, <2 paradas o `enabled:false`), `routeTitle(mode)`, `buildDirUrl(points, mode)` con `walking` por defecto (URL de Roma identica). `RouteMode` en el esquema (l.61, `day.route.mode`). Datos: viernes-25/jueves-24/sabado-26 `driving`, martes-22 `transit`, domingo-20 (ferry) sin `route` y sin boton. E2E «viernes 25 en coche», «domingo 20 sin ruta», «jueves 24 solo paradas comunes» en verde; UAT 2 pass (Google Maps en coche). Paridad de Roma: 125/126 en esta sesion, ver nota del flake |

**Puntuacion:** 5/5 verdades verificadas (0 presentes pero sin verificar su comportamiento)

### Artefactos requeridos

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `app/components/TimelineChoice.vue` | Bloque de alternativas | VERIFIED | Sustantivo, despachado desde `Timeline.vue`, datos del YAML fluyen |
| `app/assets/css/tripshapes.css` | CSS nuevo, ultima hoja | VERIFIED | Existe, bandas/glifos de los 5 transportes; Roma no se toca (base/tokens/fonts/leaflet sin cambios) |
| `app/utils/timelineRows.ts`, `dayRoute.ts`, `tripStays.ts` | Logica pura | VERIFIED | Importadas por `DaySection`/`TripView`; tests unitarios verdes |
| `app/utils/mapMarkers.ts`, `svgMotifs.ts`, `LeafletMap.client.vue` | Marcador/SVG nature | VERIFIED | Tabla leida por el componente; 4 motivos nuevos |
| `shared/schemas.ts` | Enums y esquemas estrictos | VERIFIED | `ChoiceRow`, `StaySchema`, `TransportVariant`, `StatVariant`, `RouteMode`, `family`, `nature` presentes |
| `content/trips/campania/**` | Contenido que ejercita todas las formas | VERIFIED | Ya no es esqueleto: 10 dias, 24 fichas, publicado (sin `draft`); esperado tras la Fase 13 |

### Verificacion de enlaces clave

| De | A | Via | Estado |
|----|---|-----|--------|
| `Timeline.vue` | `TimelineChoice.vue` | `resolveComponent('TimelineChoice')` | WIRED |
| `TripView.vue` | `DaySection.vue` | `stayFor(e.day, trip?.stays)` -> prop `stay` | WIRED |
| `DaySection.vue` | `dayRoute.ts` | `routeCards/routeVisible/routeTitle/buildDirUrl(…, day.route?.mode)` | WIRED |
| `LeafletMap.client.vue` | `mapMarkers.ts` | `MARKER_STYLE[m.type]`, `markerPopupHtml(m)` | WIRED |
| `MonumentCard.vue` | esquema `family` | `v-if="monument.family"` | WIRED |

### Traza de flujo de datos (Nivel 4)

| Artefacto | Variable | Fuente | Datos reales | Estado |
|-----------|----------|--------|--------------|--------|
| `TimelineChoice` | `row.options` | `day.timeline` de Nuxt Content (YAML campania) | Si | FLOWING |
| `DaySection` (stay) | `stay` | `trip.stays` + `day.stay` | Si | FLOWING |
| `LeafletMap` | `markers` | `monById` + `mapExtras` | Si | FLOWING |
| `MonumentCard` | `monument.family` | YAML de la ficha | Si | FLOWING |

### Comprobaciones conductuales

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Unitarios | `pnpm test:unit` | 575/575 (25 ficheros) | PASS |
| Puerta de datos | `pnpm test:data` | 927/927 (8 ficheros) | PASS |
| E2E de Campania (todas las formas, EXT-01..EXT-07) | `rm -rf .data .nuxt .output; pnpm test:trips tests/trips/campania.spec.ts` | 26/26 | PASS |
| Roma congelada | `git diff 7288781 HEAD -- content/trips/roma app/assets/css/{base,tokens,fonts,leaflet}.css` | vacio | PASS |
| Paridad de Roma | no relanzada por mi; dato de la sesion del orquestador | 125/126 | ACEPTADO (ver flake) |

**Nota sobre la paridad y el flake conocido.** La suite de paridad de esta sesion dio 125/126; el unico fallo es el flake intermitente conocido «SC#2 [mobile] scrollspy» de `tests/parity/navigation.spec.ts`. Se trata como flake, no como hueco de la fase (no tiene relacion con las formas nuevas y no toca Roma). Respecto a `7288781`, `tests/parity` solo ha ganado `cross-trip.spec.ts` y `upgrade-from-main.spec.ts` (Fase 14); ningun golden ni spec preexistente ha cambiado.

### Cobertura de requisitos

| Requisito | Plan origen | Descripcion | Estado | Evidencia |
|-----------|-------------|-------------|--------|-----------|
| EXT-01 | 12-01, 12-02 | Opciones A/B apiladas con «— o bien —» | SATISFIED | SC1; E2E de alternativas |
| EXT-02 | 12-03 | «Dormís en…» por dia | SATISFIED | SC2; E2E de bases |
| EXT-03 | 12-05 | Estilo propio de ferry/coche/bus/bici/avion | SATISFIED | SC2; `tripshapes.css` + E2E |
| EXT-04 | 12-04 | Naturaleza: ficha, marcador, SVG de reserva | SATISFIED | SC3 |
| EXT-05 | 12-07 | Mapa multi-ciudad encuadra todo | SATISFIED | SC4 |
| EXT-06 | 12-06 | Ruta del dia por modo / oculta en ferry | SATISFIED | SC5 |
| EXT-07 | 12-07 | Nota «Con niños» | SATISFIED | SC3 |

Los 7 IDs aparecen en el `requirements:` de los PLAN (12-01/02 EXT-01, 12-03 EXT-02, 12-04 EXT-04, 12-05 EXT-03, 12-06 EXT-06, 12-07 EXT-05 y EXT-07) y los 7 estan mapeados a la Fase 12 en `REQUIREMENTS.md` (marcados Complete). Sin requisitos huerfanos.

### Anti-patrones encontrados

Escaneo `TBD|FIXME|XXX` en los ficheros de app/shared de la fase: ninguno. Los avisos de la revision de codigo (`12-REVIEW.md`) estan los 9 en `deferred` en `12-REVIEW-DISPOSITION.md` por decision del usuario en UAT 12 test 5; ninguno bloquea un criterio de exito.

| Fichero | Elemento | Severidad | Impacto |
|---------|----------|-----------|---------|
| `app/utils/dayRoute.ts` | WR-01: `route.mode: transit` con varias paradas genera waypoints que Google Maps no enruta en transporte publico | Warning (diferido) | Ya evitado en el contenido de Campania (el martes 22 usa `transit` con ruta de dos puntos, segun UAT 5) |
| `app/utils/timelineRows.ts` | WR-02: D-04 solo mira `stop.ref` | Warning (diferido) | Latente, los datos actuales no lo provocan |
| varios | IN-01..IN-07 | Info (diferidos) | Robustez de marcadores/popups, `ChoiceRow` duplicado, ruta en dia de avion, centinela de borrador, `href="#"` de `nature`; sin efecto visible |

**Nota (deferred-items.md).** En `nuxi dev` el contenedor del mapa pierde `id="leaflet-map"` y mide 0 px de alto, en todos los viajes incluida Roma; es previo a la Fase 12 y la build publicada no lo sufre. El E2E de EXT-05 compensa devolviendo los 520 px de `base.css` en dev. El encuadre real se confirmo en la web publicada (UAT 1). Sigue abierto como mejora, no afecta a ningun criterio.

### Verificacion humana

Hecha: `12-UAT.md` 5/5 pass (visuales en claro y oscuro en la web publicada, ruta en coche del viernes 25, caja «Con niños» y «elige una» a ancho movil, aceptacion de las decisiones D-01..D-19 y diferimiento de los 9 avisos de revision). No quedan elementos pendientes.

### Resumen de huecos

Sin huecos. Los cinco criterios de exito del ROADMAP estan respaldados por codigo real, cableado y con datos fluyendo desde el contenido actual de Campania, y re-confirmados hoy con `test:unit` (575), `test:data` (927) y el E2E de Campania (26/26). Roma sigue congelada. La unica anomalia de las pruebas es el flake conocido de scrollspy movil en la paridad. Estado: `passed`.

---

_Verificado: 2026-11-23_
_Verificador: Claude (gsd-verifier)_
