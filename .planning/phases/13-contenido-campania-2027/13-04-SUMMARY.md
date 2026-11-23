---
phase: 13-contenido-campania-2027
plan: 04
subsystem: content
tags: [nuxt-content, yaml, vitest, playwright, campania, days, monuments, choice, driving-route]

requires:
  - phase: 13-contenido-campania-2027
    provides: 13-01 content contract (registries, ROMANS), 13-02 food slugs g-4-il-brigante, g-5-trattoria-calore, g-2-vannulo, 13-03 days 19-21 and the forio card
provides:
  - New real day miercoles-23 (order 5): ferry back, Alibus, 16:00 car pickup at Capodichino, drive to Salerno
  - Real jueves-24 (order 6) with the A/B choice, the contiguous three-option dinner choice and `route.mode: driving`
  - Six real cards X-XV (salerno-centro-storico and baia-di-trentova new; duomo-di-salerno, raito, valle-del-calore, castello-arechi rewritten)
  - viernes-25 moved to order 7
  - Thursday unit refs and Thursday route e2e bound to the real content
affects: [13-05, 13-06, 13-07, 13-08]

actuals:
  tokens: 8857
  tasks: 3
  commits: 3
plan_head_before: 41a5c8dea782071888268ba1a50c90e6e0b07fd7
plan_head_after: 4024cad0fa1b2b9ce777d5e9443bc19e3f95f90d

tech-stack:
  added: []
  patterns:
    - "An option-only card is cited only through `stop.ref` inside its option; light items and prose name it without a link (WR-02 route leak)"
    - "A transport row with an unknown duration puts the marker in `desc` or in a short `meta` ('⏱ **⚠ por confirmar**'), never a long meta line (375 px nowrap)"

key-files:
  created:
    - content/trips/campania/days/miercoles-23.yml
    - content/trips/campania/monuments/salerno-centro-storico.yml
    - content/trips/campania/monuments/baia-di-trentova.yml
  modified:
    - content/trips/campania/days/jueves-24.yml
    - content/trips/campania/days/viernes-25.yml (order line only)
    - content/trips/campania/monuments/duomo-di-salerno.yml
    - content/trips/campania/monuments/raito.yml
    - content/trips/campania/monuments/valle-del-calore.yml
    - content/trips/campania/monuments/castello-arechi.yml
    - tests/data/campania-content.spec.ts
    - tests/unit/timelineRows.spec.ts
    - tests/trips/campania.spec.ts

key-decisions:
  - "Wednesday 23 takes order 5, right after martes-22 (order 4), as the plan says. The 13-03 hand-off note «miércoles 23 must take order 4» was a slip: Tuesday 22 comes before Wednesday 23, so only jueves-24 and viernes-25 shift (6, 7)"
  - "Wednesday 23: traghetto Caremar or Medmar Ischia Porto → Porta di Massa (≈1 h 25) recommended, hydrofoil to Molo Beverello as the second mode. The departure time is marked, and the footnote reminds you to be at Capodichino by 16:00. The Alibus goes from either pier to the airport (5 € marked). The 16:00 disabled stop puts the hire desks in the Area Noleggio Auto (first floor, arrivals) and marks the company and desk. The A3 drive has its duration marked and a ZTL footnote (24 h reported, marked: park outside)"
  - "Thursday 24 order: Duomo 09:00 and Castello 10:30 (shared, both with hours marked), then the A/B choice, then the dinner choice. Opción A runs from Raito y Albori 12:00 to Trentova 16:00. Opción B is a car leg, the Calore stop at 13:00 (Vannulo and the trattoria linked in the note) and the walk to the medieval bridge, all pace medium"
  - "Dinner choice: Opción 1 is the Calore trattoria food row, Opción 2 a disabled tavern stop in the centro storico (links Il Brigante), Opción 3 a disabled seafront stop with an 82-character title"
  - "New day and card files with doubtful data join MARKER_FILES: days miercoles-23 and jueves-24, and the cards salerno-centro-storico, duomo-di-salerno, raito, valle-del-calore, castello-arechi and baia-di-trentova"

patterns-established:
  - "The content spec checks the Thursday shape contract in Node (choice labels, B pace, contiguous headed choice, ≥70-char title, routeCards, a single walk), so a content edit fails in vitest before the e2e run"

requirements-completed: [CAMP-01, CAMP-02, CAMP-06]

coverage:
  - id: D1
    description: "Real Wednesday 23 with the D-01 car pickup at 16:00 and Salerno by night; real Thursday 24 with both choices and the driving route"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#miércoles 23: ferry, Alibus, recogida del coche y Salerno (D-01, D-06)"
        status: pass
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#jueves 24: dos alternativas seguidas y ruta en coche con las paradas comunes (D-01, D-05)"
        status: pass
      - kind: unit
        ref: "tests/unit/timelineRows.spec.ts#jueves 24: optionOnlyRefs = {baia-di-trentova, raito, valle-del-calore}"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#la ruta del jueves 24 cuenta solo las paradas comunes (EXT-06, D-04, D-01)"
        status: pass
      - kind: e2e
        ref: "playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts (38 passed)"
        status: pass
    human_judgment: true
    rationale: "Whether the Wednesday timing (ferry, Alibus, 16:00 at the airport) and the Thursday A/B split read well on the ground, and the D-09 tone, need a human eye in UAT"
  - id: D2
    description: "Six real cards X-XV with RESEARCH heroes and coords; Raito in Vietri sul Mare, never in the Cilento; Calore coords corrected; family notes on the Calore and Trentova"
    requirement: CAMP-02
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#fichas escritas (CAMP-02, D-10, D-11), #nota familiar and #Raito y Albori están en Vietri sul Mare, no en el Cilento (D-26)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#cada lugar de naturaleza tiene marcador verde agua y dibujo de reserva (EXT-04, D-05)"
        status: pass
    human_judgment: true
    rationale: "Hero subjects were checked by Commons title only (RESEARCH A6); the visual fit needs UAT"
  - id: D3
    description: "The 2027 ferry time, rental company and desk, Salerno ZTL hours, castle and Duomo hours, driving durations, Calore bathing rules and water quality, and Vannulo's sale hours carry **⚠ por confirmar**"
    requirement: CAMP-06
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#marcador ⚠ por confirmar (CAMP-06, D-12) (MARKER_FILES + plain-field ban)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Contiguous day order 1..7 at every commit"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "node_modules/.bin/vitest run tests/data tests/unit (gate rule day-order; 1235 / 1245 / 1253 passed after each task)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: los días aparecen en orden con su pastilla (D-03)"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 04: Días 23-24 (Salerno) Summary

**Wednesday 23 and Thursday 24 are now real days. On Wednesday you leave the islands: a last swim at Forio, the ferry to Naples, the Alibus to Capodichino, Arantxa and the hire car at 16:00, and the A3 to Salerno for a night walk and dinner at Il Brigante. Thursday is the day of choosing, with the Duomo and the Castello in the morning. Then comes Opción A (Raito y Albori in Vietri, then the Trentova cove) or Opción B (the Calore gorges, all pace medium), and then a three-option dinner choice. The route opens Google Maps in driving mode with the two shared stops. The plan adds six real cards, X to XV.**

## Performance

- **Duration:** about 6 min
- **Started:** 2026-11-22T00:39:55Z
- **Completed:** 2026-11-22T00:45:53Z
- **Tasks:** 3
- **Files modified:** 12 (3 created, 9 modified)

## Accomplishments

- **Wednesday 23** (`miercoles-23`, new, order 5, pill «Mié 23», `stay: salerno`, no `route` key, so the ferry hides the button):
  - Forio swim (`ref: forio`).
  - One ferry row: traghetto ≈1 h 25 to Porta di Massa, or the hydrofoil to Beverello. Times marked.
  - One Alibus row: from either pier to Capodichino, every 10-20 min, 5 € marked.
  - A disabled stop at 16:00 for Arantxa and the car (Area Noleggio Auto; company and desk marked).
  - The car row to Salerno, with a ZTL footnote.
  - The centro storico stop, and the food row with `g-4-il-brigante`.
  - Stats: ferry, bus and car. Light block included.
- **Thursday 24** (`jueves-24`, order 6, `route.mode: driving`):
  - Shared Duomo and Castello stops.
  - A/B choice without a heading. Opción A has the title «Pueblos de ceramistas en Vietri y una cala de la costa del Cilento», with Raito, a car row, a ⏱ meta and Trentova. Opción B has only stop and transport rows, pace medium: car, Calore and the single walk.
  - A contiguous «Para cenar, elige una» choice with three options; the longest title has 82 characters.
  - No concert is mentioned (D-22).
- **Cards:**
  - New: `salerno-centro-storico` (X) and `baia-di-trentova` (XIII, nature/sea, «Con niños»).
  - Rewritten: `duomo-di-salerno` (XI), `raito` (XII, Villa Guariglia and Borghi più belli; «Cilento» never appears in the file), `valle-del-calore` (XIV, coords 40.3668 / 15.2525, family note, bathing marked) and `castello-arechi` (XV).
  - Every card has its verbatim RESEARCH hero URL, a Spanish alt, three sections, facts and a mapsQuery.
- **Orders:** in the Wednesday commit, `jueves-24` moved 5 → 6 and `viernes-25` moved 6 → 7.
- **Tests:**
  - `timelineRows.spec.ts`: the Thursday refs now follow the real YAML.
  - `campania.spec.ts`: the Thursday route is driving, with the «en coche» title.
  - `campania-content.spec.ts`: registries, MARKER_FILES, the Wednesday and Thursday tests, and the D-26 Raito/Calore test.

## Task Commits

1. **Task 1: Wednesday 23 + salerno-centro-storico + order shift**: `6513b73` (feat)
2. **Task 2: Duomo, Raito y Albori, Calore and Castello cards**: `42a0193` (feat)
3. **Task 3: Thursday 24 + baia-di-trentova + the two skeleton-bound tests**: `4024cad` (feat)

## Verification

- `vitest run tests/data tests/unit`: 1235 passed after Task 1, 1245 after Task 2 and 1253 after Task 3 (gate rule `day-order` green at every commit).
- `nuxi prepare`, `nuxi typecheck` and `eslint` on the three specs: exit 0.
- `playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts` on Node 22, after `rm -rf .data .nuxt`: **38 passed**. This covers the Thursday shape, BASE_TRANSPORT (one walk), the slow / «Caminar menos» hiding of Opción B, the driving route with 2 stops, the 375 px overflow backstops and the Roma-leak trap. No dev server was left running.
- Frozen-path check: empty.
- All acceptance criteria of the three tasks: PASS.

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Instruction conflict resolved in favour of the plan

**1. Wednesday's order is 5, not 4**
- **Found during:** Task 1
- **Issue:** The orchestrator passed on the 13-03 hand-off note «miércoles 23 must take order 4, with martes-22 and later days shifting by one». That would put Wednesday 23 before Tuesday 22. The plan, its must_haves (D-03 / D-04) and the dates all give order 5.
- **Fix:** `miercoles-23` is order 5. `martes-22` stays at 4, and only `jueves-24` and `viernes-25` move up by one (6, 7) in the same commit.
- **Commit:** 6513b73

### Auto-added

**2. [Rule 2 - Missing critical] MARKER_FILES for every new day and card with doubtful data**
- **Found during:** Tasks 1-3
- **Issue:** The plan did not list the new files in MARKER_FILES, so the marker rule would not have covered them.
- **Fix:** Added the two days and the six cards. This follows the 13-03 registry pattern. The skeleton comment in the «tramos y ruta» describe (about the Thursday 🚌 meta) is gone too, because that meta no longer exists.
- **Files modified:** tests/data/campania-content.spec.ts
- **Commits:** 6513b73, 42a0193, 4024cad

**Total deviations:** 1 instruction conflict (resolved by the plan and the dates), 1 auto-added (Rule 2). **Impact:** no scope change; the marker contract is stricter.

## Issues Encountered

None.

## Known Stubs

None in this plan's files. The skeleton `viernes-25` and its skeleton cards (`vesubio`, `rione-sanita`) keep provisional prose by design; 13-05 rewrites them.

## User Setup Required

None.

## Next Phase Readiness

13-05 can write Friday 25 (order 7, with Ultimo; the car drive Salerno → Vesuvius → Naples). Any new day after it takes the next order. The XVI and later numerals are reserved in ROMANS.

## Self-Check: PASSED

- FOUND: content/trips/campania/days/miercoles-23.yml, monuments/salerno-centro-storico.yml, monuments/baia-di-trentova.yml
- FOUND commits: 6513b73, 42a0193, 4024cad (ancestors of HEAD)
