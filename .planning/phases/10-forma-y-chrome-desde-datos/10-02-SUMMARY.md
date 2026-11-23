---
phase: 10-forma-y-chrome-desde-datos
plan: 02
subsystem: ui
tags: [nuxt, nuxt-content, zod, chrome, useHead, mdc, vitest, cheerio, parity]

requires:
  - phase: 10-01
    provides: "app/utils/tripLayout.ts (inlineMdToPlain), TripView/Topbar/NavPills dirigidos por el layout"
provides:
  - "TripSchema.brand/footer/mapLegend/pageTitle opcionales (D-10…D-14)"
  - "Chrome de Roma (pestaña, marca, leyenda, pie) verbatim en content/trips/roma/trip.yml"
  - "TripView pone el <title> por viaje (useHead) y pinta leyenda/pie desde datos; Topbar pinta la marca desde datos con respaldo al título plano"
  - "tests/data/romaChrome.spec.ts (YAML == index.html; chrome en el HTML prerenderizado)"
  - "tests/unit/romaChromeGuard.spec.ts (guardián D-17, ROMA_CHROME_LITERALS, findRomaChrome)"
affects: [10-03, 10-04, 10-05, fase-13-campania]

actuals:
  tokens: 5754
  tasks: 3
  commits: 4
plan_head_before: d14ed4a4382046506b3e0d34113f97f3fcc1f5d1
plan_head_after: 6da96be956a773da92f27d1eef012649588dea37

tech-stack:
  added: []
  patterns:
    - "Chrome de viaje como campos opcionales del trip.yml con respaldo neutro derivado del propio viaje (título plano) o ausencia del bloque; nunca un literal de otro viaje"
    - "Título por página con useHead getter en el componente dueño (TripView); app.vue sin título global"
    - "Pie Markdown-inline línea a línea: <template v-for> con <br v-if> + <MDC :tag=false unwrap=p> dentro de un único <p>"
    - "Guardián estático de literales que escanea el fichero ENTERO (template incluido) sin comentarios HTML/JS"

key-files:
  created:
    - tests/data/romaChrome.spec.ts
    - tests/unit/romaChromeGuard.spec.ts
  modified:
    - shared/schemas.ts
    - tests/data/schema.spec.ts
    - content/trips/roma/trip.yml
    - app/components/TripView.vue
    - app/components/Topbar.vue
    - app/app.vue

key-decisions:
  - "Chrome del viaje en trip.yml: brand {before, after} (texto, D-11), footer string[] Markdown-inline (≥1, D-12), mapLegend texto, pageTitle min(1) (D-13); todos opcionales (D-10)"
  - "Respaldo neutro D-14: sin pageTitle/brand → título del viaje sin Markdown (inlineMdToPlain); sin footer/mapLegend → no se renderizan"
  - "El <title> lo pone TripView con useHead; app.vue conserva lang, los dos theme-color y los favicons"
  - "Los valores de Roma se copiaron programáticamente de index.html (líneas 8, 2259, 2370, 6238) para evitar caracteres parecidos (Pitfall 3)"

patterns-established:
  - "Un campo de chrome nuevo = campo opcional en TripSchema + v-if/?? en la plantilla + valor en el trip.yml del viaje + literal en ROMA_CHROME_LITERALS si es de Roma"

requirements-completed: [SHAPE-03, SHAPE-04, SHAPE-05]

coverage:
  - id: D1
    description: "TripSchema gana brand/footer/mapLegend/pageTitle opcionales; Roma sin ellos valida (D-10, probado antes de tocar el YAML); formas inválidas rechazadas (incl. pageTitle vacío)"
    requirement: SHAPE-04
    verification:
      - kind: unit
        ref: "tests/data/schema.spec.ts#chrome del viaje (D-10…D-14) (8 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "La pestaña de Roma sale del trip.yml vía TripView useHead; el / prerenderizado tiene un solo <title> «Roma · 19—23 giugno 2026»"
    requirement: SHAPE-04
    verification:
      - kind: other
        ref: "grep -o '<title>[^<]*</title>' .output/public/index.html == '<title>Roma · 19—23 giugno 2026</title>'"
        status: pass
      - kind: e2e
        ref: "tests/parity/shell.spec.ts (gate config, 6 tests, toHaveTitle)"
        status: pass
      - kind: unit
        ref: "tests/data/romaChrome.spec.ts#exactamente un <title> y es el pageTitle de Roma"
        status: pass
    human_judgment: false
  - id: D3
    description: "Marca, leyenda y pie de Roma desde trip.yml, verbatim respecto a index.html y presentes en el HTML prerenderizado con el mismo DOM"
    requirement: SHAPE-03
    verification:
      - kind: unit
        ref: "tests/data/romaChrome.spec.ts (8 tests: 4 verbatim contra index.html + 4 post-build)"
        status: pass
      - kind: automated_ui
        ref: "pnpm verify (229 unit + 279 data + 80 parity, 56 goldens, sin --update-snapshots)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Guardián D-17: ningún literal de chrome de Roma en app/**/*.{vue,ts}; dientes positivos y negativos"
    requirement: SHAPE-05
    verification:
      - kind: unit
        ref: "tests/unit/romaChromeGuard.spec.ts (50 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Respaldo neutro D-14 para un viaje sin campos de chrome (marca = título plano sin punto, sin pie, sin leyenda, pestaña = título plano)"
    requirement: SHAPE-03
    human_judgment: true
    rationale: "Implementado en Topbar/TripView y revisado por lectura, pero ningún viaje construido carece hoy de estos campos en una ruta E2E; lo cubre el E2E de forma/trampa de los planes 10-04/10-05"

duration: 7min
completed: 2026-11-20
status: complete
---

# Phase 10 Plan 02: Chrome del viaje desde trip.yml Summary

**Pestaña, marca, leyenda del mapa y pie de Roma movidos verbatim a `content/trips/roma/trip.yml` como campos opcionales de `TripSchema` (respaldo neutro = título plano del viaje o nada), con `<title>` puesto por TripView vía `useHead`, test verbatim contra index.html y la build, y guardián D-17 contra los literales en `app/`.**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-11-20T14:06:56Z
- **Completed:** 2026-11-20T14:14:00Z
- **Tasks:** 3
- **Files modified:** 8 (2 creados, 6 modificados)

## Accomplishments

- `TripSchema` (shared/schemas.ts): `brand: { before, after }`, `footer: string[] (≥1)`, `mapLegend`, `pageTitle` — todos `.optional()`, strings `min(1)`.
- Roma: `pageTitle`, `brand`, `mapLegend` (doble espacio verbatim) y `footer` (`_Pay_`) en su trip.yml, copiados programáticamente de index.html.
- TripView: `plainTitle` (`inlineMdToPlain(trip.title)`), `useHead({ title: () => pageTitle || plainTitle })`, `p.map-legend` con `v-if`, `<footer v-if>` con líneas MDC unidas por `<br>`; Topbar con props `brand`/`fallbackTitle`.
- app.vue sin título global (conserva `lang: 'es'`, los dos `theme-color` y los favicons).
- HTML prerenderizado (sin comentarios): `.brand` = `Roma <span class="brand-dot">✦</span> giugno MMXXVI`; pie byte-idéntico al anterior; un solo `<title>`.

## Task Commits

1. **Task 1 (RED): tests de los campos de chrome** - `ed405d7` (test)
2. **Task 1 (GREEN): esquema aditivo + pageTitle + useHead en TripView** - `5d0eb71` (feat)
3. **Task 2: marca, leyenda y pie desde trip.yml + romaChrome.spec** - `bcbbdb7` (feat)
4. **Task 3: guardián D-17** - `6da96be` (test)

## Orden de trabajo D-10 (registrado)

Tras añadir los cuatro campos opcionales al esquema, `vitest run tests/data` pasó (271/271) con `git diff --quiet -- content/trips/roma` = 0, es decir, el test D-10 (Roma sin campos de chrome valida) estuvo verde ANTES de tocar el YAML. Solo después se añadió `pageTitle` (Task 1) y el resto (Task 2).

## Files Created/Modified

- `shared/schemas.ts` - Cuatro campos de chrome opcionales en `TripSchema`.
- `tests/data/schema.spec.ts` - `describe('chrome del viaje (D-10…D-14)')` (8 tests).
- `content/trips/roma/trip.yml` - Chrome de Roma verbatim.
- `app/app.vue` - Sin título global.
- `app/components/TripView.vue` - `plainTitle`, `useHead`, `footerLines`, leyenda y pie desde datos.
- `app/components/Topbar.vue` - Marca desde `brand` o `fallbackTitle`.
- `tests/data/romaChrome.spec.ts` - Verbatim contra index.html + chrome en el HTML prerenderizado.
- `tests/unit/romaChromeGuard.spec.ts` - `ROMA_CHROME_LITERALS`, `findRomaChrome`, guardián D-17.

## Verification

- `vitest run tests/data` → 279 passed (romaChrome 8/8, post-build no saltado dentro de verify).
- `vitest run tests/unit` → 229 passed (guardián 50/50, incl. 7 dientes).
- `nuxi generate` + `grep <title>` → exactamente `<title>Roma · 19—23 giugno 2026</title>`.
- `playwright … tests/parity/shell.spec.ts` → 6 passed.
- eslint de todos los ficheros tocados → limpio; `nuxi typecheck` → 0 errores.
- `pnpm verify` (final, tras Task 3) → 229 unit + 279 data + 80 parity passed (56 goldens, sin `--update-snapshots`; el flake de scrollspy no apareció).
- `git diff --quiet f04967a -- tests/parity/ app/assets/css/ content/trips/prueba/` → 0.

## TDD Gate Compliance

- Task 1 RED: `ed405d7` — 6 tests de rechazo fallaban (zod descartaba las claves desconocidas y aceptaba las formas inválidas).
- Task 1 GREEN: `5d0eb71` — 8/8 del bloque de chrome en verde.
- Task 3 (test-only, guardián): evidencia RED equivalente — aplicando `findRomaChrome` a las versiones pre-plan (`d14ed4a`) de app.vue, Topbar.vue y TripView.vue se detectan `19—23 giugno 2026`, `giugno MMXXVI` y `concierto Einaudi`/`19—23 giugno 2026`/`dos colegas`; sobre el árbol actual, 0.
- REFACTOR: no necesario.

## Decisions Made

- La marca usa dos `div.brand` alternativos (`v-if`/`v-else`) en lugar de un único div con contenido condicional: el DOM de Roma es idéntico y el respaldo no lleva `.brand-dot`.
- El test D-10 filtra las claves con `Object.fromEntries` en vez de `delete` (regla eslint `no-dynamic-delete`).
- En el HTML prerenderizado la marca ya no lleva espacios iniciales/finales y la leyenda conserva el doble espacio del YAML; ambos son espacios colapsables (ni `.brand` ni `.map-legend` fijan `white-space`), y los 56 goldens lo confirman sin re-baseline.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Criterio de aceptación] Comentarios que rompían los conteos `brand-dot == 1` y `<footer == 1`**
- **Found during:** Task 2
- **Issue:** los comentarios nuevos de Topbar.vue y TripView.vue citaban `<span class="brand-dot">` / `.brand-dot` y `<footer>`, subiendo los conteos a 3 y 2.
- **Fix:** comentarios reformulados («el span del punto», «no se pinta el pie»), mismo significado; sin cambio de código.
- **Files modified:** app/components/Topbar.vue, app/components/TripView.vue
- **Committed in:** `bcbbdb7`

**2. [Rule 3 - Lint] `no-dynamic-delete` en el test D-10**
- **Found during:** Task 1
- **Fix:** copia filtrada con `Object.fromEntries` + aserción de que ya no quedan claves de chrome.
- **Committed in:** `5d0eb71`

---

**Total deviations:** 2 auto-fixed (Rule 1, Rule 3). **Impact on plan:** cosméticos; sin cambio de comportamiento ni de scope.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 10-03 puede seguir con `DaySchema.slug`/`pill` y las reglas de la puerta de datos.
- 10-04/10-05: el viaje `forma` sin campos de chrome ejercitará el respaldo neutro (título plano, sin pie ni leyenda); `ROMA_CHROME_LITERALS` está exportado si el test-trampa quiere reutilizar la lista (sin importar el `.spec.ts`; copiarla o moverla a un módulo).

## Self-Check: PASSED

- FOUND: tests/data/romaChrome.spec.ts, tests/unit/romaChromeGuard.spec.ts, shared/schemas.ts, content/trips/roma/trip.yml, app/components/TripView.vue, app/components/Topbar.vue, app/app.vue, tests/data/schema.spec.ts
- FOUND commits: ed405d7, 5d0eb71, bcbbdb7, 6da96be

---
*Phase: 10-forma-y-chrome-desde-datos*
*Completed: 2026-11-20*
