---
phase: 10-forma-y-chrome-desde-datos
plan: 01
subsystem: ui
tags: [nuxt, vue, layout, nav-pills, sections, vitest, parity]

requires:
  - phase: 09
    provides: "TripView por slug (provideTripSlug antes del primer await), useTrip por viaje"
provides:
  - "app/utils/tripLayout.ts: buildTripLayout (orden D-07, presencia D-08), dayPillLabel (D-03), STRUCTURAL_SECTION_IDS / STRUCTURAL_LABELS (D-09), inlineMdToPlain"
  - "TripView calcula el layout una vez; <main> es un <template v-for> sobre él y Topbar → NavPills pinta las pastillas con la misma lista"
affects: [10-02, 10-03, 10-04, 10-05, tests/data/trips.ts]

actuals:
  tokens: 9100
  tasks: 2
  commits: 3
plan_head_before: 9d3b65bca1d1b09553c22dcd3bf349c131ddff75
plan_head_after: a14ff437e53368e600bb993530e7720a94511ebc

tech-stack:
  added: []
  patterns:
    - "Layout puro compartido: una función sin imports de Nuxt (solo import relativo ./dayLabel) que consumen plantilla y Vitest plano"
    - "<main> como <template v-for> con cadena v-if/v-else-if por kind; las <section> siguen siendo hijas directas de <main>"

key-files:
  created:
    - app/utils/tripLayout.ts
    - tests/unit/tripLayout.spec.ts
  modified:
    - app/components/NavPills.vue
    - app/components/Topbar.vue
    - app/components/TripView.vue

key-decisions:
  - "buildTripLayout es la única fuente de la forma de la guía (D-06): TripView monta secciones y NavPills pinta pastillas con la misma lista"
  - "La rama de día usa v-if=\"e.day\" en DaySection en lugar de e.day! (seguridad de tipos sin non-null; DOM idéntico)"
  - "dayPillLabel trata pill null/undefined/'' como ausente (Content entrega null para opcionales ausentes)"

patterns-established:
  - "Pastillas y secciones derivadas de una lista ordenada {id, kind, label, day?}; ninguna ancla literal en NavPills ni sección de día fija en TripView"

requirements-completed: [SHAPE-01, SHAPE-02]

coverage:
  - id: D1
    description: "buildTripLayout puro: Roma real → 12 pastillas en orden bloqueado; 0/1/10 días; presencia D-08; pill/dayLabel; inlineMdToPlain"
    requirement: SHAPE-01
    verification:
      - kind: unit
        ref: "tests/unit/tripLayout.spec.ts (14 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pastillas de Roma salen del layout vía TripView → Topbar → NavPills (mismas 12 etiquetas y orden)"
    requirement: SHAPE-01
    verification:
      - kind: e2e
        ref: "tests/parity/shell.spec.ts (gate config, 6 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "<main> recorre el layout: una sección por día y solo secciones con datos; Roma prerenderiza las mismas 12 secciones y la puerta de 80 tests / 56 goldens pasa sin re-baseline"
    requirement: SHAPE-02
    verification:
      - kind: automated_ui
        ref: "pnpm verify (179 unit + 263 data + 80 parity, 56 goldens)"
        status: pass
      - kind: other
        ref: "grep de ids de <section> en .output/public/index.html == inicio mapa viernes sabado domingo lunes martes reservas gastronomia practica arte arquitectura"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-20
status: complete
---

# Phase 10 Plan 01: Forma de la guía desde buildTripLayout Summary

**Función pura `buildTripLayout` (orden fijo D-07, presencia por datos D-08, pastilla de día = `pill` o `dayLabel`) que alimenta a la vez las `<section>` de `<main>` y las pastillas de NavPills; Roma sale idéntica con los 56 goldens verdes sin re-baseline.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-11-20T13:57:00Z
- **Completed:** 2026-11-20T14:04:00Z
- **Tasks:** 2
- **Files modified:** 5 (2 creados, 3 modificados)

## Accomplishments

- `app/utils/tripLayout.ts` (puro, único import de valor `./dayLabel`): `STRUCTURAL_SECTION_IDS`, `STRUCTURAL_LABELS` (incl. «Pratica»), tipos `SectionKind`/`LayoutDayInput`/`TripPresence`/`LayoutEntry`, `dayPillLabel`, `buildTripLayout`, `inlineMdToPlain`.
- `tests/unit/tripLayout.spec.ts`: 14 tests (Roma real desde los YAML, 10 días con dos sábados y `pill`, 0 días, 1 día, presencia por referencia/comida/kinds de artista, `dayPillLabel` con null/undefined/'' y `inlineMdToPlain`).
- NavPills es un único `v-for` sobre `layout` (0 anclas literales); Topbar reenvía `:layout`; TripView calcula el `computed` `layout` tras los dos `await` (con `??` para la ventana de hidratación) y lo usa para `<main>` y para Topbar.
- `<main>` de TripView: `<template v-for="e in layout">` con cadena `v-if/v-else-if` por `kind`; desaparecen las cinco secciones de día fijas y el helper de búsqueda de día por slug.

## Task Commits

1. **Task 1 (RED): tests de buildTripLayout** - `3401007` (test)
2. **Task 1 (GREEN): pastillas desde buildTripLayout (util → TripView → Topbar → NavPills)** - `895aee2` (feat)
3. **Task 2: `<main>` de TripView desde el layout** - `a14ff43` (feat)

## Files Created/Modified

- `app/utils/tripLayout.ts` - Layout puro del viaje (secciones/pastillas) compartido por plantilla y, más adelante, por la puerta de datos.
- `tests/unit/tripLayout.spec.ts` - Tests Vitest planos del layout.
- `app/components/NavPills.vue` - Pastillas = v-for sobre `layout`.
- `app/components/Topbar.vue` - Prop `layout` reenviada a NavPills (la marca `.brand` no cambia; la mueve 10-02).
- `app/components/TripView.vue` - `computed` `layout` y `<main>` dinámico.

## Verification

- `vitest run tests/unit/tripLayout.spec.ts` → 14 passed; `vitest run tests/unit` → 179 passed (tripCoupling intacto).
- `nuxi generate` (Node 22, tras `rm -rf .data .nuxt .output`) → OK; eslint de los 5 ficheros → limpio; `nuxi typecheck` → 0 errores.
- `playwright test -c playwright.gate.config.ts tests/parity/shell.spec.ts` → 6 passed (lista de 12 pastillas).
- `pnpm verify` → 179 unit + 263 data + 80 parity passed (56 goldens, sin `--update-snapshots`; el flake conocido de scrollspy no apareció).
- Ids de `<section>` del HTML prerenderizado: `inicio mapa viernes sabado domingo lunes martes reservas gastronomia practica arte arquitectura`.
- `git diff --quiet f04967a -- tests/parity/ app/assets/css/ content/` → 0. `--list` del gate → «Total: 80 tests in 11 files».

## TDD Gate Compliance

- RED: `3401007` — el spec falla al no existir `app/utils/tripLayout` (fallo de import, «no tests»).
- GREEN: `895aee2` — 14/14 en verde.
- REFACTOR: no necesario.

## Decisions Made

- En la rama `day` se usa `<DaySection v-if="e.day" :day="e.day">` en vez de `e.day!`: el layout garantiza la presencia, el `v-if` solo evita el non-null y el DOM de Roma no cambia.
- `TheHero` va en la rama `v-if="e.kind === 'inicio' && trip"` (sin `<template>` intermedio), para no añadir un nodo de fragmento extra.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Criterio de aceptación] Comentario con `<style` en Topbar.vue**
- **Found during:** Task 1
- **Issue:** el criterio `cat NavPills Topbar TripView | grep -c "<style" == 0` daba 1 por un comentario preexistente en Topbar.vue («NO se añade <style scoped>»); la línea base HEAD=0 del plan era incorrecta (en f04967a ya daba 1). No había ningún bloque de estilos real.
- **Fix:** reformulado el comentario a «NO se añade bloque de estilos scoped», mismo significado.
- **Files modified:** app/components/Topbar.vue
- **Committed in:** `895aee2`

---

**Total deviations:** 1 auto-fixed (Rule 1). **Impact on plan:** cosmético; sin cambio de comportamiento ni de scope.

## Issues Encountered

None.

## Known Stubs

None. (La leyenda del mapa y el pie siguen literales en TripView a propósito: los mueve a datos el plan 10-02.)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10-02 puede usar `inlineMdToPlain` y mover marca/leyenda/pie/título a `trip.yml`.
- 10-03 puede derivar `SECTION_ANCHORS` de `STRUCTURAL_SECTION_IDS` e importar `buildTripLayout`/`dayPillLabel` desde `tests/data/trips.ts` (módulo sin alias, apto para Vitest plano).
- `LayoutDayInput.pill` ya es opcional en el tipo; `DaySchema.pill` lo añade 10-03.

## Self-Check: PASSED

- FOUND: app/utils/tripLayout.ts, tests/unit/tripLayout.spec.ts, app/components/NavPills.vue, app/components/Topbar.vue, app/components/TripView.vue
- FOUND commits: 3401007, 895aee2, a14ff43

---
*Phase: 10-forma-y-chrome-desde-datos*
*Completed: 2026-11-20*
