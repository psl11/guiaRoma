---
phase: 11-portada-y-rutas-multi-viaje
plan: 01
subsystem: testing
tags: [playwright, parity-gate, harness, nuxt-generate]

requires:
  - phase: 10
    provides: puerta de paridad de 80 tests / 11 ficheros + 56 goldens congelados (base 6315f26)
provides:
  - "tests/parity/_harness.ts: SITE_BASE, ROMA_URL (valor actual '/guiaRoma/'), OUTPUT_DIR, ROMA_HTML, romaUrlAt(port)"
  - "Los 11 specs de Roma de la puerta toman la URL y el HTML de Roma solo del harness"
affects: [11-03, 11-05, 11-06, 11-07]

actuals:
  tokens: 35800     # chars/4 sobre los 12 ficheros tocados (143295 chars); diff realizado ~5300
  tasks: 3
  commits: 3
plan_head_before: bbc4e2356e26c12033c2400928128f37fdb701b8
plan_head_after: 85bd9744b0fb262493f08bdab2c0372d664af9f5

tech-stack:
  added: []
  patterns:
    - "Harness de paridad: URL/HTML de Roma derivados de una sola constante ROMA_URL; el movimiento de URL es un diff de una línea"

key-files:
  created:
    - tests/parity/_harness.ts
  modified:
    - tests/parity/shell.spec.ts
    - tests/parity/subpath.spec.ts
    - tests/parity/theme.spec.ts
    - tests/parity/render-cards.spec.ts
    - tests/parity/render-timeline.spec.ts
    - tests/parity/render-reference.spec.ts
    - tests/parity/modes.spec.ts
    - tests/parity/navigation.spec.ts
    - tests/parity/search-route.spec.ts
    - tests/parity/map-fallback-notes.spec.ts
    - tests/parity/visual-diff.spec.ts

key-decisions:
  - "D-18 paso 1 entregado en tres commits (uno por tarea); la puerta queda verde tras cada uno con ROMA_URL = '/guiaRoma/', y 11-03 solo cambia esa línea"
  - "romaUrlAt se exporta como `export const` (función flecha), de modo que el criterio grep 'export const romaUrlAt' casa"

patterns-established:
  - "Specs de Roma: import { ROMA_HTML, romaUrlAt | ROMA_URL } from './_harness'; los que tienen STATIC_ORIGIN lo conservan y concatenan ROMA_URL"
  - "ensureBuild comprueba existsSync(ROMA_HTML), no .output/public/index.html"

requirements-completed: [PAR-01, PAR-02]

coverage:
  - id: D1
    description: "tests/parity/_harness.ts con las cinco exportaciones del contrato (SITE_BASE, ROMA_URL, OUTPUT_DIR, ROMA_HTML, romaUrlAt)"
    requirement: PAR-01
    verification:
      - kind: other
        ref: "grep -c export const ROMA_URL/ROMA_HTML/romaUrlAt tests/parity/_harness.ts == 1 cada uno; eslint --no-ignore limpio"
        status: pass
    human_judgment: false
  - id: D2
    description: "Los 11 specs de Roma usan el harness: 0 join(OUTPUT_DIR, 'index.html'), 0 URL de Roma con /guiaRoma/ literal; map-fallback-notes y theme leen readFileSync(ROMA_HTML)"
    requirement: PAR-02
    verification:
      - kind: other
        ref: "grep acceptance criteria Task 3 (11 / 0 / 0 / 2) + lista permitida del diff contra 6315f26 (0 líneas fuera)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Cero cambio de comportamiento: puerta verde con el mismo valor de ROMA_URL, 80 tests en 11 ficheros, 56 goldens sin re-baseline; golden.spec.ts, snapshots y CSS intactos"
    requirement: PAR-01
    verification:
      - kind: e2e
        ref: "pnpm verify (vitest unit 247 + data 345, playwright gate 80 passed, 0 screenshot diffs)"
        status: pass
      - kind: other
        ref: "git diff --quiet 6315f26 -- tests/parity/golden.spec.ts tests/parity/golden.spec.ts-snapshots/ app/assets/css/"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-11-20
status: complete
---

# Phase 11 Plan 01: Harness de paridad de Roma Summary

**`tests/parity/_harness.ts` concentra la URL (`ROMA_URL`, aún `/guiaRoma/`) y el HTML prerenderizado (`ROMA_HTML`) de Roma; los 11 specs de la puerta los consumen, así que el movimiento de URL de 11-03 será un diff de una sola línea, con la puerta verde (80/11, 56 goldens intactos).**

## Performance

- **Duration:** ~4 min (reloj de pared, incluye dos `nuxi generate` y un `pnpm verify` completo)
- **Started:** 2026-11-20T19:04:07Z
- **Completed:** 2026-11-20T19:08:05Z
- **Tasks:** 3
- **Files modified:** 12 (1 creado, 11 modificados)

## Accomplishments

- Harness de paridad con el contrato exacto del plan: `SITE_BASE`, `ROMA_URL`, `OUTPUT_DIR`, `ROMA_HTML` (derivado de `ROMA_URL`) y `romaUrlAt(port)`. La cabecera no repite el valor de `ROMA_URL`.
- Los 11 specs de Roma importan `./_harness`. Ninguno construye la URL de Roma con `/guiaRoma/` literal ni lee `.output/public/index.html` (había 25 apariciones de `join(OUTPUT_DIR, 'index.html')` y quedan 0).
- `map-fallback-notes.spec.ts` (`<div id="leaflet-map"` prerenderizado) y `theme.spec.ts` (script anti-FOUC del `<head>`) leen `ROMA_HTML`. Cuando la raíz pase a ser la portada, seguirán leyendo la página de Roma.
- `pnpm verify` en verde: unit 247, data 345 y puerta Playwright 80 passed, sin diferencias de screenshot y sin `--update-snapshots`.

## Task Commits

1. **Task 1 (tracer): harness + shell/subpath/theme**: `a214628` (test). La puerta del tracer se comprobó de extremo a extremo: generate más 14/14.
2. **Task 2: render-cards/render-timeline/render-reference/modes**: `6174f0d` (test). 34/34.
3. **Task 3: navigation/search-route/map-fallback-notes/visual-diff + puerta completa**: `85bd974` (test). `pnpm verify` en verde.

## Files Created/Modified

- `tests/parity/_harness.ts`: punto único de la URL y del HTML de Roma para la puerta (D-18).
- `tests/parity/{shell,subpath,theme,render-cards,render-timeline,render-reference,modes,navigation,search-route,map-fallback-notes,visual-diff}.spec.ts`: solo cambian el import del harness, la línea `STATIC_URL`/`SUBPATH_URL` y las líneas `ensureBuild`/`readFileSync` que pasan a `ROMA_HTML` (lista permitida D-19, 0 líneas fuera).

## Decisions Made

- Se siguió el orden del plan: tres commits y la puerta verde tras cada uno. Las constantes locales `OUTPUT_DIR` de cada spec se mantienen porque las usan `cpSync` y la comprobación de `.nojekyll`/`trips`.
- El mensaje del `expect` de `ensureBuild` pasa a `'la página de Roma de la build (ROMA_HTML) debe existir'`, como dice el plan. El mensaje `'la build debe existir'` de shell:187 no se toca.

## Deviations from Plan

### Defecto en un comando de criterio (no en la implementación)

**1. El criterio de la Task 2 `grep -c 'STATIC_ORIGIN}${ROMA_URL}' tests/parity/modes.spec.ts` devuelve 0 aunque el fichero es correcto**
- **Found during:** Task 2
- **Issue:** el patrón es una BRE de GNU grep. En ella `${` no casa literalmente con el texto, así que el conteo sale 0 aunque la línea 70 de `modes.spec.ts` es exactamente ``const STATIC_URL = `${STATIC_ORIGIN}${ROMA_URL}` ``.
- **Fix:** ninguno en el código. Se comprobó con cadena fija: `grep -cF 'STATIC_ORIGIN}${ROMA_URL}' tests/parity/modes.spec.ts` da 1. A futuro, este criterio debería usar `grep -F`.
- **Files modified:** ninguno
- **Committed in:** n/a

---

**Total deviations:** 0 auto-fixes de código. Hay 1 defecto en un comando de verificación del plan, documentado arriba.
**Impact on plan:** ninguno. La implementación coincide con el contrato.

## Issues Encountered

Ninguno. La flake conocida de navigation «SC#2 scrollspy» [mobile] no apareció: 80/80 a la primera.

## Known Stubs

Ninguno.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 11-03 puede mover Roma a `/guiaRoma/trips/roma/` cambiando solo la línea `export const ROMA_URL = '/guiaRoma/'` de `tests/parity/_harness.ts`. `ROMA_HTML` pasará solo a `.output/public/trips/roma/index.html`.
- 11-05, 11-06 y 11-07 pueden importar `SITE_BASE`/`OUTPUT_DIR` del harness para las páginas de portada y de redirección.

---
*Phase: 11-portada-y-rutas-multi-viaje*
*Completed: 2026-11-20*

## Self-Check: PASSED
