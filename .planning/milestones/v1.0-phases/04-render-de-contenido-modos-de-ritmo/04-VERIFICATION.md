---
phase: 04-render-de-contenido-modos-de-ritmo
verified: 2026-06-20T18:47:34Z
status: passed
score: 4/4 criterios de éxito verificados
overrides_applied: 0
re_verification: false
---

# Fase 4: Render de contenido + modos de ritmo — Informe de verificación

**Objetivo de la fase:** Renderizar fichas, timeline y secciones de referencia desde los datos con paridad visual pixel a pixel, y reproducir los tres modos triviales (ritmo, caminar menos, resumen) con su lógica exacta — validando el patrón data-driven con las piezas de bajo riesgo antes de las sensibles a SSR.
**Verificado:** 2026-06-20T18:47:34Z
**Estado:** PASSED
**Re-verificación:** No — verificación inicial

---

## Logro del objetivo

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | SC#1/UI-02 — La ficha de monumento (hero, nombre italiano, prosa por secciones vía `<MDC>` sin `<p>` extra, dropcap, detail-photo, detail-list, facts, maps-link, caja sorrentino/culture, shell de notas) se renderiza desde datos, idéntica al index.html | VERIFICADO | `render-cards.spec.ts` 17 aserciones en `#galleria-sciarra` (detail-photo img presente, detail-list N li, no-dropcap en secciones 2+, facts-row, a.maps-link href google, textarea data-note-key); MonumentCard.vue: `:class="{ 'no-dropcap': i !== 0 }"`, `encodeURIComponent`, `data-note-key`, sin `<style>`, sin onerror |
| 2 | SC#2/UI-03 — El timeline se renderiza desde el array ordenado del día despachando por `kind` (stop/transport/meta/food/reservation), idéntico al index.html | VERIFICADO | `render-timeline.spec.ts`: los 5 kinds presentes en #viernes, `.tl-item.reserved-event` presente, `:data-pace` conservado, orden = dato; Timeline.vue usa `resolveComponent()` para el dispatcher (fix bug latente Plan 05) |
| 3 | SC#3/UI-04 — Las 5 secciones de referencia (Reservas, Gastronomía, Práctica, Arte, Arquitectura) se renderizan desde datos, idénticas al index.html | VERIFICADO | `render-reference.spec.ts`: reservas-table + badges urgent/done/rec + tr.is-done, 7 gastro-section-title en orden canónico + gastro-card, artist-cards en #arte, 5 ArtistCard + glosario de 10 arch-term en #arquitectura; D1/D-04-D resuelto (commit 89ea4ac: superset row schemas para colecciones artist/reference) |
| 4 | SC#4/FEAT-06/07/08 — Matriz de ritmo exacta (solo .tl-item/.tl-transport filtran por .tl-hidden; food/meta/resv nunca filtran); caminar menos fuerza slow + muestra dia-ligera + NO revierte al desactivar; resumen toggle de vista índice; todos persistidos (roma-pace/light/resumen) incluido el micro-flash intencional de 1 frame | VERIFICADO | `modes.spec.ts` 17 aserciones E2E: matriz slow/neutral/optimistic, `body.light-mode` + `aria-pressed=true` al activar, pace sigue slow al desactivar (Pitfall 5), `body.modo-resumen` oculta set exacto, persistencia con `addInitScript(localStorage)`, MutationObserver confirma micro-flash; `useTripModes.ts`: watch `if (on) pace.value = 'slow'` sin else, onMounted restaura pace ANTES de light |

**Puntuación:** 4/4 criterios de éxito verificados

---

### Artefactos requeridos

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `app/utils/pace.ts` | isVisible pura (FEAT-06) | VERIFICADO | Exporta `isVisible`, `Pace`, `ItemPace`; 3 ramas exactas (optimistic/neutral/slow); sin dependencia Nuxt |
| `tests/unit/pace.spec.ts` | 9 casos de la matriz | VERIFICADO | 9 `it()` con los 27 valores, Vitest puro; pasa verde con `pnpm test:unit` |
| `app/composables/useTripModes.ts` | Estado reactivo + persistencia + isVisible (FEAT-06/07/08) | VERIFICADO | Separación accesor/controlador (CR-01 resuelto): `useTripModes()` puro, `useTripModesController()` con side-effects en TheHero; `useState` singleton; watch `if (on) pace='slow'` sin else; `useHead({bodyAttrs})`; onMounted restaura pace→light; claves literales `roma-pace`/`roma-light`/`roma-resumen`; sin classList/querySelector |
| `app/components/DetailPhoto.global.vue` | Componente MDC global `:detail-photo` | VERIFICADO | Sufijo `.global.vue` correcto; `div.detail-photo > img :src :alt loading="lazy"` sin onerror; caption via `<MDC unwrap="p">`; sin bloque `<style>` |
| `app/components/MonumentCard.vue` | `.card` verbatim data-driven (UI-02) | VERIFICADO | `article.card :id="slug"`, card-header, card-hero img plano, `card-section v-for :class no-dropcap`, facts, maps-link encodeURIComponent, sorrentino-box, notes-area textarea; sin `<style>`, sin onerror |
| `app/components/Timeline.vue` | Dispatcher por kind (UI-03) | VERIFICADO | `resolveComponent()` para cada kind (fix bug latente SSG); NO importa useTripModes |
| `app/components/TimelineStop.vue` | .tl-item filtrado por ritmo | VERIFICADO | `const { isVisible } = useTripModes()`; `:class="{ 'tl-hidden': !isVisible(row.pace) }"`; `:data-pace="row.pace"` |
| `app/components/TimelineTransport.vue` | .tl-transport filtrado por ritmo | VERIFICADO | Igual que Stop; variante taxi/walk/train como clase dinámica |
| `app/components/TimelineMeta.vue` | .tl-meta NO filtrado (Pitfall 4) | VERIFICADO | Sin useTripModes ni isVisible; sin `<style>` |
| `app/components/TimelineFood.vue` | .tl-food NO filtrado; guard href (CR-02) | VERIFICADO | Sin useTripModes; `v-else-if="entry.href"` + `<span v-else>` (CR-02 resuelto) |
| `app/components/TimelineReservation.vue` | .tl-resv-meta NO filtrado | VERIFICADO | Sin useTripModes; texto íntegro vía `<MDC unwrap="p" :tag="false">` |
| `app/utils/foodGroups.ts` | Agrupado en orden canónico (Pitfall 6) | VERIFICADO | Array constante de 7 grupos en orden canónico; `groupFood()` pura; sin Nuxt |
| `tests/unit/foodGroups.spec.ts` | Test del orden canónico | VERIFICADO | Entrada alfabética → salida canónica; g-bar-* último; groupIntro propagado; Vitest puro |
| `app/components/GastroSection.vue` | #gastronomia con 7 grupos en orden | VERIFICADO | Consume `groupFood(food)`; `p.gastro-section-title` por grupo; `GastroCard v-for` |
| `app/components/GastroCard.vue` | .gastro-card verbatim | VERIFICADO | badge clase `badge-+badgeKind`, desc/plato vía MDC unwrap, gastro-maps-link encodeURIComponent |
| `app/components/ArtistCard.vue` | artist/arquitectura/glossary unificado | VERIFICADO | `v-if kind==='glossary'` → `arch-glossary` + `arch-term`; `v-else` → artist-card verbatim; un solo componente |
| `app/components/ReservasSection.vue` | #reservas: confirmadas + tabla | VERIFICADO | `reservas-table tr :class is-done`, `reservas-badge :class badge-+badgeKind` |
| `app/components/PracticaSection.vue` | #practica: prosa + media | VERIFICADO | `section-eyebrow`, sections con MDC, media por category |
| `app/components/DaySection.vue` | Contenedor de día completo | VERIFICADO | `dayCards` computed en orden del dato (filter no-nulos), light-banner, dia-ligera v-if, Timeline, cards-list MonumentCard |
| `app/components/TripView.vue` | 11 secciones enchufadas; #mapa vacío (F7) | VERIFICADO | `const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)`; 5 DaySection + reservas/gastronomia/practica/arte/arquitectura con v-if guards (WR-03 resuelto); #mapa vacío |
| `app/components/TheHero.vue` | Controles cableados a useTripModes | VERIFICADO | `useTripModesController()` una sola vez; `useTripModes()` para pace/light/resumen; 3 pace-btn con `:class active` + `@click`; light/resumen `:aria-pressed` + `@click`; sin `active` literal en pace-btn[0] |
| `tests/parity/render-cards.spec.ts` | DOM MonumentCard (SC#1) | VERIFICADO | 9 aserciones; autocontenido (build+serve propio); tolera solo el error de hidratación |
| `tests/parity/render-timeline.spec.ts` | DOM timeline (SC#2) | VERIFICADO | 5 kinds, reserved-event, data-pace, orden; `.tl-food[data-pace]` ausente (WR-04 resuelto) |
| `tests/parity/render-reference.spec.ts` | DOM secciones de referencia (SC#3) | VERIFICADO | 7 grupos canónicos, reservas-table+badges, 10 arch-term |
| `tests/parity/modes.spec.ts` | E2E modos + persistencia + micro-flash (SC#4) | VERIFICADO | 17 aserciones; `addInitScript` para persistencia; MutationObserver para micro-flash |

---

### Verificación de enlaces clave (Level 3 — cableado)

| Desde | Hasta | Vía | Estado | Detalles |
|-------|-------|-----|--------|----------|
| `useTripModes.ts` | `app/utils/pace.ts` | `isVisibleForPace(itemPace, pace.value)` | CABLEADO | Import en línea 1; la matriz no se reimplementa |
| `useTripModes.ts` | `localStorage roma-pace/light/resumen` | `onMounted` read+write | CABLEADO | Lectura con validación; escritura via watch dentro de onMounted |
| `TheHero.vue` | `useTripModesController()` | única invocación | CABLEADO | Línea 48; efectos secundarios registrados exactamente una vez (CR-01) |
| `TimelineStop.vue` | `useTripModes().isVisible` | `:class tl-hidden` | CABLEADO | `const { isVisible } = useTripModes()` |
| `TimelineTransport.vue` | `useTripModes().isVisible` | `:class tl-hidden` | CABLEADO | Igual que Stop |
| `Timeline.vue` | TimelineStop/Transport/Meta/Food/Reservation | `<component :is=resolveComponent(...)>` | CABLEADO | `resolveComponent()` para el dispatcher (fix Plan 05) |
| `DaySection.vue` | `MonumentCard.vue` (vía monById) | `day.cards.map(slug => monById.get(slug))` | CABLEADO | `dayCards` computed; orden = dato; filter de nulos |
| `TripView.vue` | DaySection + 5 secciones de referencia | `11 <section>` con datos por props | CABLEADO | Un solo `useTrip`; v-if guards en todos los mounts |
| `GastroSection.vue` | `app/utils/foodGroups.ts` | `groupFood(food)` | CABLEADO | Auto-importado; 7 grupos en orden canónico |
| `DetailPhoto.global.vue` | `<MDC>` (resolveComponent) | sufijo `.global.vue` | CABLEADO | Confirmado por `render-cards.spec.ts`: `.detail-photo > img` visible en el DOM construido |

---

### Trazado de flujo de datos (Level 4)

| Artefacto | Variable de datos | Fuente | Produce datos reales | Estado |
|-----------|------------------|--------|---------------------|--------|
| `MonumentCard.vue` | `monument` prop | `DaySection` → `monById.get(slug)` → `useTrip.monById` → `queryCollection('monument')` | Sí — 38 fichas confirmadas en render real | FLOWING |
| `GastroSection.vue` | `food` prop | `TripView` → `useTrip.food` → `queryCollection('food')` | Sí — 7 grupos, 26 gastro-cards | FLOWING |
| `ArtistCard.vue` | `artist` prop | `TripView` → `useTrip.artists` → `queryCollection('artist')` (superset D1) | Sí — 13 artist-cards (D1 resuelto commit 89ea4ac) | FLOWING |
| `ReservasSection.vue` | `reservas` prop | `TripView` → `refById.get('reservas')` → `queryCollection('reference')` (superset D1) | Sí — reservas-table con badges (D1 resuelto) | FLOWING |
| `Timeline.vue` | `rows` prop | `DaySection` → `day.timeline` → `useTrip.days` → `queryCollection('day')` | Sí — 5 kinds en #viernes confirmados | FLOWING |

---

### Comprobaciones de comportamiento (Spot-checks)

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| `pnpm test:unit` — 27 tests (isVisible × 9 + foodGroups + dayLabel + tripIndexes) | `pnpm test:unit` | 27 passed (109ms) | PASS |
| `pnpm test:data` — 295 tests (validación de datos zod) | `pnpm test:data` | 295 passed (493ms) | PASS |
| `pnpm typecheck` — TS estricto sobre toda la app | `pnpm typecheck` | exit 0 | PASS |
| `pnpm lint` — ESLint flat config | `pnpm lint` | exit 0 (sin advertencias) | PASS |
| `pnpm generate` — build SSG | `pnpm generate` | exit 0; 10 rutas prerenderizadas | PASS |
| 4 specs Playwright SC#1-SC#4 (34 tests móvil+desktop) | `playwright test render-cards/timeline/reference/modes` | 34 passed (15s) | PASS |

---

### Ejecución de probes

No hay probes declarados (`scripts/*/tests/probe-*.sh`) para esta fase. El rol de probe lo cumplen los 4 specs Playwright autocontenidos (con `ensureBuild()` + serve propio), que se ejecutaron directamente en el Spot-check anterior.

---

### Cobertura de requisitos

| Requisito | Plan fuente | Descripción | Estado | Evidencia |
|-----------|------------|-------------|--------|-----------|
| UI-02 | 04-01, 04-02, 04-05 | Ficha de atracción (hero, prosa, maps) idéntica a hoy | SATISFECHO | MonumentCard + DetailPhoto.global.vue + render-cards.spec 17 aserciones |
| UI-03 | 04-01, 04-03, 04-05 | Timeline componentizado idéntico a hoy, filtrado por ritmo | SATISFECHO | Familia Timeline (5 componentes) + render-timeline.spec |
| UI-04 | 04-04, 04-05 | 5 secciones de referencia desde datos, idénticas | SATISFECHO | GastroSection/ArtistCard/ReservasSection/PracticaSection + render-reference.spec |
| FEAT-06 | 04-01, 04-03, 04-05 | Selector de ritmo con matriz exacta, persistido | SATISFECHO | pace.ts 3 ramas + useTripModes + pace.spec.ts 9 casos + modes.spec |
| FEAT-07 | 04-01, 04-05 | Caminar menos fuerza slow sin revertir | SATISFECHO | `watch(light, on => { if (on) pace='slow' })` sin else + modes.spec Pitfall 5 |
| FEAT-08 | 04-01, 04-05 | Modo resumen toggle vista índice | SATISFECHO | useTripModes.resumen + body.modo-resumen vía useHead + modes.spec |

**Cobertura:** 6/6 requisitos satisfechos. Sin requisitos huérfanos para esta fase.

---

### Anti-patrones detectados

| Fichero | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| (ninguno) | — | — | — | — |

**Notas:**
- La cadena "TODO" en `TimelineReservation.vue:14` es la palabra española "todo" (= "all/whole") dentro de un comentario en prosa, no un marcador de deuda de código. Sin TBD/FIXME/XXX no referenciados.
- "querySelectorAll" en `TimelineStop.vue:9` es una referencia histórica en un comentario al código del `index.html` original; el componente no llama querySelector en ningún momento.
- Ningún componente F4 tiene bloque `<style>` ni referencia a `classList` en código ejecutable.

---

### Items diferidos (Step 9b — cubiertos por fases posteriores)

Hallazgos fuera del alcance de F4, documentados en `deferred-items.md` y confirmados como cubiertos por fases posteriores:

| # | Item | Cubierto en | Evidencia |
|---|------|-------------|-----------|
| 1 | D-04-A: `<MDC unwrap="p">` deja `<div class="">` envoltorio en DetailPhoto/TheHero | Fase 8 | ROADMAP Phase 8 SC: "pixel-diff total contra el golden de F1"; el golden de F3 ya se aprobó con este envoltorio |
| 2 | D-04-B: variante `metro`/`metro-b` perdida en datos F2 del timeline (3 filas sin color de borde) | Fase 2 (corrección de datos) → Fase 8 (pixel-diff) | ROADMAP Phase 8 SC: paridad 100%; fix de esquema+datos F2 no es alcance F4 |
| 3 | D-04-C: `**…**` en Markdown emite `<strong>` pero CSS apunta a `b` (colores semánticos ok/warn) | Fase 2 (datos/CSS) → Fase 8 | ROADMAP Phase 8: mismo vector; corrección de CSS o datos F2 |
| 4 | Fallback `@error`→SVG de imágenes hero/detail | Fase 7 | ROADMAP Phase 7 SC#2: "imagen-con-fallback hero/detail" explícito |
| 5 | Persistencia de notas por ficha (textarea shell presente, sin v-model) | Fase 7 | ROADMAP Phase 7 SC#3: "notas por ficha en localStorage" explícito |
| 6 | WR-05: texto hardcodeado en ReservasSection ("3 comensales") — parity verbatim OK para F4 | Futuro multi-viaje | REQUIREMENTS ARCH-01 multi-viaje es v1; deferred en REVIEW |

---

### Verificación visual humana

El sign-off humano de paridad de render con imágenes reales (D-06, Task 4 del Plan 05) fue **obtenido y aprobado** antes de la verificación, según la instrucción recibida: "A human sign-off on visual parity (D-06) was OBTAINED and APPROVED: the user confirmed the rendered site looks correct — cards, timeline, the 5 reference sections, light+dark, and the 3 modes all behave as today."

No se requieren items adicionales de verificación humana: la verificación automatizada cubre todos los comportamientos programáticos y el visual fue firmado por el humano.

---

### Resumen de hallazgos

Todos los criterios de éxito de la Fase 4 están verificados en el código real:

**SC#1/UI-02** — MonumentCard renderiza las fichas desde datos con la estructura completa (dropcap, `:detail-photo` resuelto a componente real, `.detail-list` con ✦, facts, maps-link, notas shell). Probado en `render-cards.spec.ts` sobre el build real.

**SC#2/UI-03** — La familia Timeline (5 componentes) despacha por `kind`, filtro exacto en stop/transport (Pitfall 4 respetado), `:data-pace` conservado, orden = dato. Fix de `resolveComponent()` aplicado. Probado en `render-timeline.spec.ts`.

**SC#3/UI-04** — Las 5 secciones de referencia salen desde datos (incluido el desbloqueo D1/D-04-D para las colecciones union discriminada en Content v3). Gastronomía en orden canónico (Pitfall 6 resuelto y testeado). `render-reference.spec.ts` confirma DOM completo.

**SC#4/FEAT-06/07/08** — Matriz exacta de ritmo (contraintuición Pitfall 4 preservada), caminar menos fuerza slow sin revertir (Pitfall 5 preservado), resumen oculta el set correcto, persistencia con claves literales, micro-flash intencional de 1 frame. `modes.spec.ts` (17 aserciones E2E) y `pace.spec.ts` (9 casos unitarios) cubren la lógica completa.

Los incidentes de revisión de código (CR-01 registro de side-effects × N instancias, CR-02 href undefined en TimelineFood, WR-03 null-assertions en TripView, WR-04 cobertura de .tl-food[data-pace]) fueron **resueltos antes de la verificación**. Los items WR-05 e informativos fueron diferidos de forma justificada.

---

_Verificado: 2026-06-20T18:47:34Z_
_Verificador: Claude (gsd-verifier)_
