---
phase: 10-forma-y-chrome-desde-datos
plan: 06
subsystem: testing
tags: [data-gate, mdc, vitest, invariants, gap-closure]

requires:
  - phase: 10-forma-y-chrome-desde-datos
    provides: "puerta de datos por viaje (checkTrip, RULES, anchor/cross-trip-link D-05b/D-08)"
provides:
  - "scanProseLinks: destinos de toda forma de enlace que MDC pinta como <a> + formas rechazadas"
  - "regla card-placement (RULES 21 -> 22) y renderedMonuments en anchor/seenIn/ref"
  - "29 pruebas de dientes G-10-2 (22 WR-01 + 7 WR-03) y 2 del advisory de frontmatter MDC"
  - "disposición de los 9 hallazgos de 10-REVIEW registrada (2 fixed, 7 deferred)"
affects: [data-gate, content-authoring, campania, verify]

actuals:
  tokens: 8009
  tasks: 3
  commits: 5
plan_head_before: 01f64cf630687707fa81cd863a0551689e3db107
plan_head_after: d248f0e5e4f0c31ed9a88f565dec6862a4340c74

tech-stack:
  added: []
  patterns:
    - "Escaneo léxico fail-closed de enlaces de prosa (regex con nombre + lista de formas rechazadas [regex, etiqueta])"
    - "renderedMonuments como espejo de DaySection → MonumentCard para todo lo que resuelve a una ficha"

key-files:
  created: []
  modified:
    - tests/data/trips.ts
    - tests/data/invariants.spec.ts
    - tests/README.md
    - .planning/phases/10-forma-y-chrome-desde-datos/10-REVIEW-DISPOSITION.md

key-decisions:
  - "G-10-2: escáner léxico por regex en vez de parser (sin dependencias nuevas, v1.1); fail-closed: falso rojo posible, falso verde no"
  - "G-10-2 advisory: un bloque MDC con props en frontmatter YAML (::a / --- / href: … / ---) SÍ pinta <a href> (también to:), así que se rechaza con cross-trip-link"
  - "G-10-2: card-placement exige cada ficha exactamente una vez en la unión de days[*].cards; anchor, seenIn y ref de timeline/reservas solo resuelven a fichas pintadas"

patterns-established:
  - "Toda forma de enlace que MDC pinta pasa por la lista blanca D-05b o se rechaza con su fichero"

requirements-completed: [SHAPE-01, SHAPE-02]

coverage:
  - id: D1
    description: "La puerta de datos ve toda forma de enlace que MDC pinta como <a> (espacio/salto tras '(', <…>, autoenlaces, emails) y rechaza definiciones de referencia, <a> crudo y atributos/props MDC href/to"
    requirement: SHAPE-01
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts -t \"G-10-2/WR-01\" (22 passed)"
        status: pass
      - kind: unit
        ref: "tests/data/invariants.spec.ts -t \"G-10-2 (advisory)\" (2 passed)"
        status: pass
      - kind: integration
        ref: "mutación en disco content/trips/prueba/monuments/zzenlace.yml → vitest sale ≠ 0 con 'zzenlace.yml: [cross-trip-link]'; fichero borrado, git status -- content vacío"
        status: pass
    human_judgment: false
  - id: D2
    description: "Regla card-placement (cada ficha exactamente una vez en days[*].cards) y anchor/seenIn/ref solo a fichas pintadas (renderedMonuments)"
    requirement: SHAPE-02
    verification:
      - kind: unit
        ref: "tests/data/invariants.spec.ts -t \"G-10-2/WR-03\" (7 passed)"
        status: pass
      - kind: unit
        ref: "tests/data/invariants.spec.ts -t \"regla card-placement\" (campania, forma, prueba, roma: 4 passed)"
        status: pass
      - kind: integration
        ref: "mutación en disco content/trips/prueba/monuments/zzhuerfano.yml → vitest sale ≠ 0 con 'zzhuerfano.yml: [card-placement]'; fichero borrado, git status -- content vacío"
        status: pass
    human_judgment: false
  - id: D3
    description: "Viajes reales siguen verdes sin tocar content/; puerta de datos, unitaria y lint en verde; guarda de alcance limpia"
    verification:
      - kind: unit
        ref: "pnpm test:data (829 passed)"
        status: pass
      - kind: unit
        ref: "pnpm test:unit (568 passed)"
        status: pass
      - kind: other
        ref: "pnpm lint (exit 0)"
        status: pass
      - kind: other
        ref: "git diff --quiet 22802e8 -- content content.config.ts scripts shared app nuxt.config.ts package.json pnpm-lock.yaml tests/parity tests/unit tests/trips"
        status: pass
    human_judgment: false
  - id: D4
    description: "tests/README.md §5.3 documenta las formas de enlace y card-placement; 10-REVIEW-DISPOSITION.md registra WR-01/WR-03 fixed y WR-02, IN-01…IN-06 deferred (open: 0)"
    verification:
      - kind: other
        ref: "grep -c card-placement tests/README.md ≥ 2; grep de disposiciones por id en 10-REVIEW-DISPOSITION.md"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-22
status: complete
---

# Phase 10 Plan 06: Cierre de G-10-2 (WR-01, WR-03) en la puerta de datos

**La puerta de datos ahora ve cada forma de enlace que MDC pinta como `<a>`. `scanProseLinks` pasa por la lista blanca D-05b los destinos con espacio o salto tras `(`, los `<…>`, los autoenlaces y los emails, y rechaza las definiciones `[r]:`, el `<a>` crudo y los atributos/props MDC `href`/`to`. La regla nueva `card-placement` exige que cada ficha se pinte exactamente una vez y que las anclas, `seenIn` y `ref` solo resuelvan a fichas pintadas.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-11-22T20:04:16Z
- **Completed:** 2026-11-22T20:10:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- **WR-01:** `scanProseLinks` sustituye a la regex `/\]\(([^)\s]+)/g`. Ve `[x]( /trips/roma)`, `[x](\n../roma#x)`, `[x](<#id>)`, `<scheme:…>`, `<a@b>` y los emails sueltos. Rechaza con `cross-trip-link` las definiciones de referencia, el `<a>` crudo, `{href=…}`/`{to=…}` y las props `href:`/`to:` en frontmatter MDC. `hasLink` (trip-summary-link) y `extractAnchors` usan el mismo escáner.
- **WR-03:** regla `card-placement` (RULES = 22). `renderedMonuments` (la unión de `days[*].cards`) sustituye a todos los slugs de ficha en `anchorable`, en `seenIn` y en los `ref` de timeline y reservas.
- Viajes reales: el escáner ve los mismos 157 destinos que la regex de antes (campania 31, prueba 1, roma 126, forma 0), con 0 diferencias y 0 formas rechazadas. Ninguna ficha queda sin día ni repetida, y no se ha tocado `content/`.
- §5.3 de tests/README.md y 10-REVIEW-DISPOSITION.md quedan actualizados (2 fixed, 7 deferred, open: 0).

## Task Commits

1. **Task 1 (tracer): formas de enlace MDC → lista blanca/ancla**: `3f262ff` (test, RED) y `4fe1172` (fix, GREEN)
2. **Task 2: card-placement + renderedMonuments**: `a30e505` (test, RED) y `b872915` (fix, GREEN)
3. **Task 3: README §5.3 + disposición de 10-REVIEW**: `d248f0e` (docs)

No hizo falta ningún commit de REFACTOR.

## TDD Gate Compliance

- **Task 1 RED** (`3f262ff`): con el filtro `G-10-2/WR-01` dio 17 failed / 5 passed, exactamente lo previsto. Ya pasaban `</guiaRoma/#pantheon>` (la regex se llevaba el `<` y caía en cross-trip-link por accidente) y 4 de los 5 controles. Los 2 casos del advisory también fallaban. Evidencia JUnit (`--reporter=junit`) → `gsd-tools check tdd-red-evidence`: **RED_EVIDENCE_OK** (`target_test_failed`, objetivo «G-10-2/WR-01 anchor: la forma "Ver [esto]( #nope)."»). semanticAssessment: el objetivo se ejecutó y falló en la aserción prevista (`expected [] to deeply equal [ObjectContaining{rule: anchor, #nope}]`), porque la regex no veía el destino con espacio. No hubo errores de carga, sintaxis ni fixture. (El reporter TAP de vitest genera un YAML de diagnóstico multilínea sin indentar que el clasificador rechaza como `invalid_record`, así que se usó JUnit.)
- **Task 1 GREEN** (`4fe1172`): 22/22 con el filtro, 2/2 en el advisory, tests/data 818 en verde.
- **Task 2 RED** (`a30e505`): con el filtro `G-10-2/WR-03` dio 6 failed / 1 passed (el control (j) ya pasaba), con el resto del spec en verde. Evidencia JUnit → **RED_EVIDENCE_OK** (objetivo «G-10-2/WR-03 card-placement: una ficha que no está en el cards de ningún día…»). semanticAssessment: falla en la aserción (`expected [] to deeply equal [{…card-placement}]`) porque la regla no existe. Es la causa prevista.
- **Task 2 GREEN** (`b872915`): 7/7 con el filtro, `regla card-placement` en verde en los 4 viajes reales, tests/data 829 en verde.

## Files Created/Modified

- `tests/data/trips.ts`: `scanProseLinks` (regex con nombre más `REJECTED_LINK_FORMS`), `hasLink`/`extractAnchors` sobre el escáner, regla `card-placement`, `renderedMonuments` en `stopOrFood`/`seenIn`/`anchorable`, y la cabecera de contrato «Cierre G-10-2».
- `tests/data/invariants.spec.ts`: helpers `onDay`, `galeriaWith` y `artistSeeing`; 22 tests WR-01, 2 del advisory y 7 WR-03. Los 4 fixtures existentes (anchor reservas, anchor arquitectura, https, stop en opción) colocan `galeria` en un día y siguen afirmando `toEqual([])`.
- `tests/README.md`: §5.3 con `card-placement` en RULES y una viñeta sobre las formas de enlace vistas/rechazadas y card-placement.
- `.planning/phases/10-forma-y-chrome-desde-datos/10-REVIEW-DISPOSITION.md`: WR-01/WR-03 fixed (10-06 (G-10-2)); WR-02 e IN-01…IN-06 deferred (10-UAT.md · Deferred Follow-Ups); open: 0.

## Decisions Made

- **Advisory del plan-checker (bloque MDC con props en frontmatter YAML):** se comprobó con `parseMarkdown` de `@nuxtjs/mdc` 0.22.0 (importado por ruta absoluta del store, solo para investigar). `::a\n---\nhref: /trips/roma\n---\nesto\n::` → `a {href: "/trips/roma"}`, y `to:` → `a {to: "/trips/roma"}`. **Sí pinta `<a href>`**, así que se rechaza con `cross-trip-link` (cuarta forma rechazada, etiqueta «props MDC «href:» / «to:» en frontmatter»). Queda anotado en tests/README.md §5.3.
- Lo demás sigue el plan: regex más reglas de rechazo, sin parser ni dependencias nuevas.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Rechazo de las props MDC `href:`/`to:` en frontmatter (advisory del plan-checker)**
- **Found during:** Task 1
- **Issue:** `REJECTED_LINK_FORMS` según el plan no veía `::a` + frontmatter `href: /trips/roma`, que MDC sí pinta como `<a href>`. Era un fail-open frente a D-05b.
- **Fix:** una cuarta entrada en `REJECTED_LINK_FORMS` (bloque `::nombre` seguido de `---` y una línea `href:`/`to:`) y un `it.each` aparte de 2 casos, «G-10-2 (advisory) cross-trip-link: …». Va con un título distinto para que los filtros `-t "G-10-2/WR-01"` (22) y `-t "G-10-2/WR-03"` (7) del plan sigan dando sus cifras exactas.
- **Files modified:** tests/data/trips.ts, tests/data/invariants.spec.ts
- **Verification:** RED 2 failed y GREEN 2 passed. Los viajes reales siguen con 0 formas rechazadas.
- **Committed in:** `3f262ff` (RED) y `4fe1172` (GREEN)
- **Efecto en los conteos:** tests/data da **818** tras el Task 1 (el plan esperaba 816) y **829** al final (el plan esperaba 827), es decir +2 por el advisory. Los `<verify>` con `Tests +816 passed` / `Tests +827 passed` literales darían esa diferencia de +2; todo lo demás se cumple tal cual.

---

**Total deviations:** 1 auto-fixed (Rule 2), pedido explícitamente por el orquestador vía el advisory.
**Impact on plan:** cierra una forma más del mismo hueco WR-01, sin ampliar el alcance. Los conteos totales suben en 2.

## Issues Encountered

- El reporter TAP de vitest saca bloques `expected:` multilínea sin indentar y `gsd-tools check tdd-red-evidence` lo rechaza (`invalid_record: Malformed TAP`). Se resolvió capturando la evidencia RED con `--reporter=junit` (adaptador JUnit XML), que dio RED_EVIDENCE_OK en los dos tasks.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- G-10-2 cerrado: con 10-06 completo, la Fase 10 queda lista para re-verificar (UAT test 2).
- Sin blockers. WR-02 e IN-01…IN-06 siguen diferidos por decisión del usuario (10-UAT.md · Deferred Follow-Ups).

---
*Phase: 10-forma-y-chrome-desde-datos*
*Completed: 2026-11-22*

## Self-Check: PASSED

- FOUND: tests/data/trips.ts, tests/data/invariants.spec.ts, tests/README.md, 10-REVIEW-DISPOSITION.md
- FOUND commits: 3f262ff, 4fe1172, a30e505, b872915, d248f0e (ancestros de HEAD)
- Acceptance re-run: filtro WR-01 22 passed; filtro WR-03 7 passed; las dos mutaciones en disco fallan con su regla y content/ queda limpio; `function scanProseLinks(` ≥ 1; `'card-placement'` = 3; `renderedMonuments` ≥ 4; eslint 0; test:data 829, test:unit 568, lint 0; guarda de alcance OK.
