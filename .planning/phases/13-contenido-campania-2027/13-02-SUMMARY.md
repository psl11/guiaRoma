---
phase: 13-contenido-campania-2027
plan: 02
subsystem: content
tags: [nuxt-content, yaml, vitest, playwright, campania, gastronomia]

requires:
  - phase: 13-contenido-campania-2027
    provides: 13-01 content contract (campania-content.spec.ts registries), trip.yml sections.gastronomia
provides:
  - Nine Campania food cards in five D-15 groups (content/trips/campania/food/g-1-…g-5-*.yml)
  - CAMP-03 data contract (FOOD_GROUPS order, D-14 VERIFIED_NAMES allowlist, generic-card rule, named-place marker rule)
  - Gastronomía e2e in tests/trips/campania.spec.ts
  - Valid food slugs for the `food` rows of 13-03..13-06 and valid `#gastronomia` anchors in Campania prose
affects: [13-03, 13-04, 13-05, 13-06, 13-07, 13-08]

actuals:
  tokens: 3600
  tasks: 2
  commits: 2
plan_head_before: bccb25f378d116dbfd3f8cc02787a412b84245ea
plan_head_after: 41a19ab36d204d79248ae8b6d27d3b269164c581

tech-stack:
  added: []
  patterns:
    - "Group order without code: slug prefixes g-1-…g-5- make first appearance (alphabetical file order) equal the planned group order"
    - "D-14 allowlist in the content spec: a food name is a verified establishment or starts with «Una »/«Un » and is chosen «a elegir sobre el terreno»"

key-files:
  created:
    - content/trips/campania/food/g-1-concettina.yml
    - content/trips/campania/food/g-1-pizzeria-vomero.yml
    - content/trips/campania/food/g-2-vannulo.yml
    - content/trips/campania/food/g-2-caseificio-carretera.yml
    - content/trips/campania/food/g-3-caracale.yml
    - content/trips/campania/food/g-3-il-focolare.yml
    - content/trips/campania/food/g-3-la-lampara.yml
    - content/trips/campania/food/g-4-il-brigante.yml
    - content/trips/campania/food/g-5-trattoria-calore.yml
  modified:
    - tests/data/campania-content.spec.ts
    - tests/trips/campania.spec.ts

key-decisions:
  - "Gastronomía order comes from slug prefixes g-1-…g-5- (no change to FOOD_GROUP_ORDER); the e2e derives the expected order from the sorted food YAML"
  - "Every named establishment's desc carries **⚠ por confirmar** for hours/prices/closing day (enforced by the spec); plain footers say «horario y precio a confirmar» in words"
  - "Pizzeria Gorizia 1916 appears only inside the generic Vomero card's desc, marked (reported closed for renovation)"
  - "Food files with doubtful data join MARKER_FILES (8 of 9; the roadside caseificio states no hour or price)"

patterns-established:
  - "FOOD_GROUPS / VERIFIED_NAMES constants in campania-content.spec.ts are the single list Reservas (13-07) can reuse for restaurant bookings"

requirements-completed: [CAMP-03, CAMP-06]

coverage:
  - id: D1
    description: "CAMP-03 data contract: groups, order by slug, D-14 allowlist, generic cards chosen on the ground, named places marked, no Roman badgeKind"
    requirement: CAMP-03
    verification:
      - kind: unit
        ref: "node_modules/.bin/vitest run tests/data tests/unit (1198 passed)"
        status: pass
      - kind: other
        ref: "mutation: name «Caseificio Inventado» on g-2-caseificio-carretera turns campania-content.spec.ts red; file restored"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nine food cards in five groups rendered in the planned order in nuxi dev, with the #gastronomia pill"
    requirement: CAMP-03
    verification:
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: Gastronomía agrupa sus fichas en el orden de los slugs (CAMP-03, D-15)"
        status: pass
      - kind: e2e
        ref: "tests/trips/shape.spec.ts#trampa: campania no muestra ningún texto de Roma"
        status: pass
    human_judgment: true
    rationale: "Tone (D-09) and the editorial quality of the food prose need a human eye in UAT"
  - id: D3
    description: "Unverified hours, prices and closing days marked only in Markdown fields (CAMP-06, D-12)"
    requirement: CAMP-06
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#marcador ⚠ por confirmar (CAMP-06, D-12) and #un establecimiento con nombre marca su horario en la descripción (D-12)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 02: Gastronomía de Campania Summary

**Nine food cards in five slug-ordered groups (Naples pizzerias, buffalo-mozzarella caseifici, Procida and Ischia kitchens, a Salerno taberna, a Cilento mountain trattoria). They name only the six research-verified establishments, with verbatim addresses and every hour or closing day marked. A Vitest allowlist, proven by mutation, guards the names, and a Playwright test checks the rendered group order.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-11-22T00:18:55Z
- **Completed:** 2026-11-22T00:23:52Z
- **Tasks:** 2
- **Files modified:** 11 (9 created, 2 modified)

## Accomplishments

- Group 1, «Pizzerías de barrio · Nápoles»: Da Concettina ai Tre Santi (since 1951, fourth generation with Ciro Oliva, Michelin and Dissapore, Metro Cavour or Museo) and a generic Vomero pizzeria. The Vomero card names Gorizia 1916 only as a marked option.
- Group 2, «Mozzarella di bufala · caseifici»: Tenuta Vannulo (100 % buffalo milk, farm visits, sale and visit hours marked) and a generic roadside caseificio for Friday 25.
- Group 3, «Las islas · cocina de Procida e Ischia»: Caracalè and La Lampara at the Corricella, and Trattoria Il Focolare (coniglio all'ischitana in a clay pot, by reservation only, the 2024 Wednesday closing marked, taxi from Forio).
- Group 4, «Salerno · tabernas del centro storico»: Hostaria Il Brigante, with the Monday closing and hours marked.
- Group 5, «Cilento · trattorias de monte»: a generic trattoria by the Calore, with fusilli felittesi and the sagra dates marked.
- `campania-content.spec.ts` now has a `gastronomía (CAMP-03, D-14, D-15)` block with 8 tests, and MARKER_FILES gains 8 food files.
- `campania.spec.ts` has a new Gastronomía e2e. The header JSDoc no longer calls the trip a skeleton with placeholder heroes.

## Task Commits

1. **Task 1: CAMP-03 data contract + pizzerías and caseifici (groups 1-2)**: `e05d48a` (feat)
2. **Task 2: Island, Salerno and Cilento kitchens (groups 3-5) + Gastronomía e2e**: `41a19ab` (feat)

## Verification

- `vitest run tests/data tests/unit`: 1188 passed after Task 1 and 1198 after Task 2.
- D-14 mutation (`name: Caseificio Inventado`): the spec fails, and the file is restored (the `name` line was checked afterwards).
- `nuxi prepare`, `nuxi typecheck` and `eslint` on both specs: exit 0.
- `playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts` on Node 22, after `rm -rf .data .nuxt`: 38 passed. This includes the new Gastronomía test and the Roma-leak trap over the new text.
- Frozen-path check (git log of 13-0x commits and git status on roma, prueba, forma, app, shared, configs, scripts, parity and the gate files): empty.
- All acceptance criteria of both tasks: PASS (4 then 9 food files, verbatim addresses, ≥3 marker files, FOOD_GROUPS ×5, 5 distinct groups, «gastronomía (CAMP-03» present).

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Missing critical] Named-place marker test and MARKER_FILES growth**
- **Found during:** Task 1
- **Issue:** The plan's truths require that hours and closing days of named establishments are never stated as fact, but the listed tests did not enforce it.
- **Fix:** Added the test «un establecimiento con nombre marca su horario en la descripción (D-12)», which requires `**⚠ por confirmar**` in the `desc` of every VERIFIED_NAMES card. The food files with doubtful data were also added to the existing MARKER_FILES registry, following the 13-01 registry-growth pattern.
- **Files modified:** tests/data/campania-content.spec.ts
- **Commits:** e05d48a, 41a19ab

**Total deviations:** 1 auto-added (Rule 2). **Impact:** stricter D-12 contract; no scope change.

## Issues Encountered

None.

## Known Stubs

None. Generic cards («Una pizzería de barrio en el Vomero», «Un caseificio de carretera», «Una trattoria de monte junto al Calore») are intentional per D-14, not stubs.

## User Setup Required

None.

## Next Phase Readiness

13-03 can reference the food slugs `g-1-*`…`g-5-*` from day `food` rows and link `[…](#gastronomia)`. 13-07 (Reservas) can list Il Focolare's reservation.

## Self-Check: PASSED

- FOUND: all 9 content/trips/campania/food/g-*.yml, tests/data/campania-content.spec.ts, tests/trips/campania.spec.ts
- FOUND commits: e05d48a, 41a19ab (ancestors of HEAD)
