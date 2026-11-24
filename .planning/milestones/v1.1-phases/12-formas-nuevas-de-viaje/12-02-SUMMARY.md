---
phase: 12-formas-nuevas-de-viaje
plan: 02
subsystem: data-gate + timeline UI tests + CSS/build guards
tags: [vitest, playwright, nuxt-content, yaml, css-guard, choice, campania, draft]

requires:
  - phase: 12-01
    provides: "fila choice estricta, TimelineChoice.vue, tripshapes.css último en css[], borrador campania con jueves-24 y CAMPANIA-CENTINELA-12A"
provides:
  - "timelineRowsOf (tests/data/trips.ts): la regla ref mira dentro de las opciones de un choice, con dientes"
  - "jueves-24: ref: raito en la opción A y segundo choice «Para cenar, elige una» (3 opciones) contiguo al A/B; order 4"
  - "Los otros 4 días del esqueleto de Campania (sabado-19, domingo-20, martes-22, viernes-25) sin filas, fichas ni base"
  - "E2E campania: orden/separadores/adyacencia, heading y aria-label, ritmos + «Caminar menos» + resumen (D-03), ficha de la opción (D-05), 375 px, cinco días con su pastilla"
  - "tests/unit/cssSelectors.ts (cssSelectors, NEW_CLASSES, classTokens, tripShapesOffenders, htmlClassTokens) + tripShapesCss.spec.ts"
  - "build-isolation: centinela de campania, trips/campania inexistente y escaneo D-17 de clases nuevas en el HTML publicado"
affects: [12-03, 12-04, 12-05, 12-06, 12-07, 13]

actuals:
  tokens: 10900
  tasks: 3
  commits: 5
plan_head_before: 4b8103db71582659bff634563f01fc5cfdb376fd
plan_head_after: 6be919c27b278682af3a6d40a27a49fde58a1e7b

tech-stack:
  added: []
  patterns:
    - "Helpers de guardianes en un módulo .ts que no es spec (importar un .spec re-registra sus suites)"
    - "Guardián de CSS por allowlist de clases nuevas: cada selector lleva un token de NEW_CLASSES; prohibidos :not/:is/:where/:has, [atributo], :root, html, body"
    - "Escaneo de clases del HTML publicado excluyendo trips/<slug>/ de otros viajes, con control positivo de clases de Roma"
    - "E2E de modos derivados del YAML: visibilidad esperada de cada fila interior = isVisible(row.pace, ritmo) importado de app/utils/pace"

key-files:
  created:
    - content/trips/campania/days/sabado-19.yml
    - content/trips/campania/days/domingo-20.yml
    - content/trips/campania/days/martes-22.yml
    - content/trips/campania/days/viernes-25.yml
    - tests/unit/cssSelectors.ts
    - tests/unit/tripShapesCss.spec.ts
  modified:
    - tests/data/trips.ts
    - tests/data/invariants.spec.ts
    - content/trips/campania/days/jueves-24.yml
    - tests/trips/campania.spec.ts
    - tests/unit/multitripCss.spec.ts
    - tests/data/build-isolation.spec.ts

key-decisions:
  - "La regla ref usa timelineRowsOf (filas de nivel superior que no son choice + filas de cada opción); anchor no cambia porque collectStrings ya recorre todo el dato"
  - "El escaneo D-17 del HTML publicado excluye trips/<slug>/ de viajes distintos de roma, para que publicar Campania en la Fase 13 no rompa el guardián"
  - "Los selectores de atributo también se prohíben en tripshapes.css ([class*=\"car\"] casaría con card de Roma)"

patterns-established:
  - "E2E de formas nuevas sobre campania: lo esperado sale del YAML, nunca de listas escritas a mano"
  - "Comprobación de pastillas por href + section[id], nunca por .active"

requirements-completed: [EXT-01]

coverage:
  - id: D1
    description: "Un ref de parada o de comida roto dentro de una opción de un choice es una violación ref que nombra el fichero del día; un ref válido no da violaciones; un ancla rota en el title de una opción es una violación anchor"
    requirement: EXT-01
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts#ref: un stop con ref roto dentro de una opción de un choice nombra el fichero del día"
        status: pass
      - kind: unit
        ref: "tests/data/invariants.spec.ts#ref: una entrada de food con ref roto dentro de una opción de un choice es una violación"
        status: pass
      - kind: unit
        ref: "tests/data/invariants.spec.ts#anchor: [x](#nope) en el title de una opción de un choice es una violación anchor"
        status: pass
    human_judgment: false
  - id: D2
    description: "Cada choice del jueves 24 tiene sus opciones en orden y opciones−1 separadores «— o bien —»; dos choice seguidos se pintan como dos div.tl-choice hermanos; hay un bloque de 3 opciones"
    requirement: EXT-01
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: cada choice tiene sus opciones en orden y opciones−1 separadores; dos choice seguidos no se funden (EXT-01, D-02)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sin heading el encabezado y el aria-label son «Elige una»; con heading se pinta su texto y el aria-label es inlineMdToPlain(heading)"
    requirement: EXT-01
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: «Elige una» por defecto y el heading del dato cuando lo hay (EXT-01)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Con Optimista, Neutra, Pesimista, «Caminar menos» y resumen, el armazón de las alternativas sigue visible; cada fila interior sigue su pace; con Pesimista la opción B no muestra filas y sí su etiqueta y su título; en resumen se ocultan .tl-transport y .tl-meta de dentro de las opciones"
    requirement: EXT-01
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: las opciones siguen visibles con cualquier ritmo, «Caminar menos» y resumen (D-03)"
        status: pass
    human_judgment: false
  - id: D5
    description: "La ficha raito, citada solo dentro de la opción A, es una ficha normal del día: enlace a.tl-title, entrada en .cards-list, marcador con su numeral y resaltado sin cambiar el hash"
    requirement: EXT-01
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: una ficha citada solo dentro de una opción es una ficha normal del día (D-05)"
        status: pass
    human_judgment: false
  - id: D6
    description: "A 375 px el bloque de 3 opciones parte líneas (el título largo ocupa más de una línea) y la página no desborda en horizontal"
    requirement: EXT-01
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: a 375 px las alternativas parten línea sin desbordar (backstop overflow E1)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Campania tiene 5 días en orden (sabado-19, domingo-20, martes-22, jueves-24, viernes-25) con una pastilla por día, y ningún texto de la trampa de Roma"
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: los cinco días aparecen en orden con su pastilla (D-15)"
        status: pass
      - kind: e2e
        ref: "tests/trips/shape.spec.ts#trampa: campania no muestra ningún texto de Roma"
        status: pass
    human_judgment: false
  - id: D8
    description: "Guardián D-17: cada selector de tripshapes.css lleva una clase de NEW_CLASSES y ninguno usa selectores funcionales, de atributo, :root, html ni body; tripshapes.css es la última entrada de css[]"
    verification:
      - kind: unit
        ref: "tests/unit/tripShapesCss.spec.ts#tripshapes.css real (D-17)"
        status: pass
    human_judgment: false
  - id: D9
    description: "Guardián de build D-16/D-17: el centinela de campania sigue en su trip.yml con draft: true, no existe trips/campania, ningún fichero publicado lleva el centinela y ninguna clase nueva aparece en el HTML de Roma ni de la portada"
    verification:
      - kind: unit
        ref: "tests/data/build-isolation.spec.ts#D-17: ninguna clase de tripshapes.css en el HTML publicado de Roma ni de la portada (Fase 12)"
        status: pass
      - kind: unit
        ref: "tests/data/build-isolation.spec.ts#no existe trips/campania: el borrador no se prerenderiza (D-16, Fase 12)"
        status: pass
    human_judgment: false
  - id: D10
    description: "Roma sin cambios: pnpm verify pasa (110 parity, 56 goldens sin --update-snapshots) y los paths congelados no tienen diff respecto a d0c0ed2"
    verification:
      - kind: automated_ui
        ref: "pnpm verify (329 unit + 515 data + 110 parity passed)"
        status: pass
      - kind: other
        ref: "git diff --exit-code d0c0ed2 -- content/trips/{roma,prueba,forma} app/assets/css/{base,tokens,fonts,leaflet,multitrip}.css tests/parity package.json pnpm-lock.yaml"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-11-21
status: complete
---

# Phase 12 Plan 02: Alternativas en cualquier modo, esqueleto de 5 días y guardianes D-16/D-17 Summary

**La regla `ref` de la puerta de datos mira ahora dentro de las opciones de un `choice` (`timelineRowsOf`). El jueves 24 de Campania tiene dos bloques de alternativas seguidos (A/B, y tres opciones para cenar con encabezado propio) que siguen visibles con cualquier ritmo, con «Caminar menos» y en modo resumen. Hay cinco días de esqueleto. Un guardián estático y otro de build impiden que las reglas de tripshapes.css o el borrador lleguen a Roma.**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-11-21T10:14:53Z
- **Completed:** 2026-11-21T10:24:07Z
- **Tasks:** 3 (1 tracer + 1 auto + 1 auto/tdd)
- **Files modified:** 12

## Accomplishments

- **Pitfall 3 cerrado en la misma tarea que el primer `ref` dentro de una opción.** Cuatro dientes nuevos en invariants.spec.ts:
  - un `stop` con ref roto dentro de una opción da `ref`;
  - una entrada de `food` con ref roto dentro de una opción da `ref`;
  - un `ref` válido dentro de una opción no da violaciones (control);
  - un ancla rota en el `title` de una opción da `anchor`.
  Los dos de `ref` fallaron antes del cambio en trips.ts.
- **jueves-24:** la parada de la opción A lleva `ref: raito` (D-05). Se añade un segundo `choice`, «Para cenar, elige una», contiguo al A/B, con tres opciones:
  - una fila `food`;
  - una parada sin ref;
  - un título de 78 caracteres con una parada con nota.
  El día pasa a `order: 4`.
- **Cuatro días nuevos** (D-15): Sáb 19, Dom 20, Mar 22 y Vie 25. Tienen títulos reales del itinerario y nacen con listas vacías y sin `stay`.
- **Seis E2E nuevos en campania.spec.ts** (8 `campania:` en total). Todos derivan lo esperado del YAML:
  - orden y adyacencia;
  - heading y aria-label;
  - matriz de ritmo con `isVisible`, más «Caminar menos» y resumen;
  - ficha de la opción;
  - 375 px;
  - los cinco días con su pastilla.
- **`tests/unit/cssSelectors.ts`:** recibe `cssSelectors`, movido verbatim desde multitripCss.spec.ts, más `NEW_CLASSES`, `classTokens`, `tripShapesOffenders` y `htmlClassTokens`. `tripShapesCss.spec.ts` tiene 26 casos, con dientes en memoria, y comprueba el tripshapes.css real (no vacuo y último en `css[]`).
- **build-isolation.spec.ts:**
  - centinela de campania + `draft: true`, comprobado fuera del `skipIf`;
  - `trips/campania` inexistente;
  - centinela buscado también en los dumps decodificados;
  - describe D-17 que escanea las clases del HTML publicado (portada + Roma, con control positivo `tl-transport`/`day-stats-item`).

## Task Commits

1. **Task 1 (tracer): dos alternativas seguidas en cualquier modo**
   - `89245cb` test(12-02): la puerta debe mirar dentro de las opciones de un choice (RED, Pitfall 3)
   - `c67deb9` feat(12-02): dos alternativas seguidas que se leen con cualquier ritmo y en resumen
2. **Task 2: los cinco días del esqueleto**
   - `462f829` feat(12-02): los cinco días del esqueleto de Campania en su orden (D-15)
3. **Task 3 (tdd): guardianes D-17 y D-16 + puerta de la ola**
   - `570acb6` test(12-02): guardián de allowlist de tripshapes.css con dientes (RED, D-17)
   - `6be919c` feat(12-02): guardianes D-17 y D-16 — allowlist de tripshapes.css, clases nuevas fuera del HTML de Roma y centinela de Campania

**Plan metadata:** commit docs(12-02) siguiente.

## Files Created/Modified

- `tests/data/trips.ts`: `timelineRowsOf` exportada; la regla `ref` la usa; comentario de cabecera «Fase 12».
- `tests/data/invariants.spec.ts`: JSDoc «Fase 12» y 4 dientes del `choice`.
- `content/trips/campania/days/jueves-24.yml`: `ref: raito`, segundo `choice` y `order: 4`.
- `content/trips/campania/days/{sabado-19,domingo-20,martes-22,viernes-25}.yml`: días de esqueleto (nuevos).
- `tests/trips/campania.spec.ts`: el test de 12-01 se adapta a varios bloques; dos describe nuevos con 6 tests.
- `tests/unit/cssSelectors.ts`: helpers de los guardianes CSS (nuevo, no es spec).
- `tests/unit/tripShapesCss.spec.ts`: guardián de allowlist de tripshapes.css (nuevo).
- `tests/unit/multitripCss.spec.ts`: importa `cssSelectors` del helper. `unscopedSelectors` y sus dientes no cambian.
- `tests/data/build-isolation.spec.ts`: centinela de campania, `trips/campania` y escaneo D-17.

## Verification

- `vitest run tests/data`: 515 passed. `vitest run tests/unit`: 329 passed.
- `eslint` sobre los 7 ficheros de test/puerta tocados: 0 problemas. `nuxi typecheck`: exit 0.
- `pnpm verify`: exit 0. 329 unit + 515 data + **110 parity passed**, sin `--update-snapshots`.
- Tras la build, `vitest run tests/data/build-isolation.spec.ts`: 16 passed. Los 3 tests del describe «D-17: ninguna clase…» pasan (ninguno saltado). `.output/public/trips/` solo contiene `roma`.
- `rm -rf .data .nuxt && pnpm test:trips`: **28 passed**, incluidos los 8 `campania:` y «trampa: campania no muestra ningún texto de Roma» sobre los 5 días.
- Congelados: `git diff --exit-code d0c0ed2 -- content/trips/{roma,prueba,forma} app/assets/css/{base,tokens,fonts,leaflet,multitrip}.css tests/parity package.json pnpm-lock.yaml` sin diff, y `git status` limpio en esos paths.
- Trampa de textos sobre `content/trips/campania`: 0 ficheros.

## Decisions Made

- `timelineRowsOf` aplana un solo nivel (opciones → `rows`). Basta porque el esquema rechaza un `choice` dentro de una opción (12-01). Todo pasa por `asArray`, así que un YAML mal formado no rompe la puerta.
- El escaneo D-17 recorre todo el `*.html` de `.output/public` salvo `trips/<slug>/` con slug distinto de `roma`. Hoy cubre `index.html`, `200.html`, `404.html` y `trips/roma/index.html`.
- En el test de modos, solo las filas `stop`/`transport` siguen la matriz `isVisible`: son las únicas que filtra la guía (TimelineStop/TimelineTransport). Las `food`/`meta` se esperan visibles fuera del modo resumen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El E2E de 12-01 exigía exactamente un `choice` en el jueves 24**
- **Found during:** Task 1 (paso 2, segundo `choice`)
- **Issue:** `campania: el jueves 24 apila las opciones…` (12-01) afirmaba `choices.length === 1` y `.tl-choice` count 1. El segundo `choice` que pide este plan lo habría roto.
- **Fix:** ahora exige ≥ 1 `choice` en el YAML y tantos `.tl-choice` como `choice` tenga el dato, y comprueba el primero (A/B). Los bloques nuevos los cubren los tests de este plan.
- **Files modified:** tests/trips/campania.spec.ts
- **Verification:** test:trips 28/28.
- **Committed in:** c67deb9

**2. [Rule 1 - Bug] Selector de marcadores del E2E de la ficha de la opción**
- **Found during:** Task 1 (paso 3, test D-05)
- **Issue:** el plan pedía `#leaflet-map .custom-marker`, pero en el DOM montado ningún elemento conserva ese id (ya documentado en 12-01).
- **Fix:** se usa `section[id="mapa"] .custom-marker`, con un comentario.
- **Files modified:** tests/trips/campania.spec.ts
- **Committed in:** c67deb9

---

**Total deviations:** 2 auto-fixed (2 Rule 1). **Impact:** solo afectan a tests. No se amplía el alcance, y Roma y los paths congelados no cambian.

## TDD Gate Compliance

- **Task 1 (tracer):** se ejecutó en orden RED → GREEN. Los dos dientes de `ref` dentro de una opción fallaron en aserción (`expected [] to deeply equal ArrayContaining…`) en `89245cb`, antes de `timelineRowsOf` (`c67deb9`).
- **Task 3 (tdd):**
  - **RED (`570acb6`):** el spec nuevo se ejecutó contra un esqueleto `cssSelectors.ts` sin comportamiento. No se usó el «helper inexistente» del plan, porque un fallo de import sería INVALID_RED según tdd.md. Fallaron 20 de 26 casos, todos en aserción.
  - **Evidencia RED:** `.planning/phases/12-formas-nuevas-de-viaje/tdd/12-02-T3-red.json`. El clasificador `check tdd-red-evidence` devolvió `RED_EVIDENCE_OK target_test_failed` para el target «tripshapes.css real (D-17) > existe, tiene reglas…».
  - **Valoración semántica:** el target se ejecutó y falló en su aserción planificada (anti-vacuidad: 0 selectores con el esqueleto).
  - **Por qué se aisló ese target con `-t`:** el TAP de Vitest parte en varias líneas los `expected` de arrays, y el clasificador rechaza como `Malformed TAP` la corrida completa, en la que fallaban los 20 casos.
  - **GREEN (`6be919c`):** helper real. 26/26 y multitripCss 13/13.
  - **REFACTOR:** no hizo falta.

## Issues Encountered

None. La puerta completa y test:trips pasaron a la primera, sin reintentos ni el flaky conocido de navigation.spec.ts.

## Known Stubs

Ninguno bloquea el objetivo. Los cuatro días nuevos nacen vacíos a propósito (D-15): 12-03/04/05/06 los rellenan sin renumerar. El segundo `choice` del jueves 24 es contenido de esqueleto (ver «Flagged assumptions» del plan). La Fase 13 puede reescribirlo, pero debe conservar en algún día un `choice` de 3 opciones y un par contiguo, o mover esos casos del E2E.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 12-03 puede añadir `stays`/`stay` y el bloque EXT-02 de tripshapes.css. `tripShapesOffenders` ya exige `day-stay`/`day-stay-name`, y el escaneo de build ya garantiza que no aparecen en Roma.
- 12-05 y 12-07 añaden reglas a tripshapes.css con el guardián ya activo.

## Self-Check: PASSED

- 12/12 ficheros de key-files presentes.
- Commits 89245cb, c67deb9, 462f829, 570acb6 y 6be919c son ancestros de HEAD; `git rev-list --count 4b8103d..HEAD` = 5.
- Todos los criterios de aceptación de las Tasks 1, 2 y 3 en PASS.

---
*Phase: 12-formas-nuevas-de-viaje*
*Completed: 2026-11-21*
