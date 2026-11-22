---
phase: 13-contenido-campania-2027
plan: 06
subsystem: content
tags: [nuxt-content, yaml, vitest, playwright, campania, days, monuments, choice, car-return]

requires:
  - phase: 13-contenido-campania-2027
    provides: 13-01 content contract (registries, ROMANS with XVIII-XXI reserved), 13-04 choice shape (jueves-24), 13-05 viernes-25 car rows and domingo-27 / lunes-28 at orders 8 / 9
provides:
  - Real sabado-26 (order 8): shared car departure, choice Opción 1 (Casertavecchia) / Opción 2 (Averno, Cuma, Miseno), car return at Capodichino outside the choice, Alibus back, night stop
  - Four real cards: casertavecchia XVIII, lago-d-averno XIX (nature), antro-della-sibilla XX, spiaggia-di-miseno XXI (nature, family note)
  - domingo-27 at order 9 and lunes-28 at order 10 (contiguous 1..10)
  - The complete ten-day / 24-card contract in campania-content.spec.ts (mutation-proven for a card on two days) and the ten-day e2e assertion
affects: [13-07, 13-08]

actuals:
  tokens: 4833
  tasks: 2
  commits: 2
plan_head_before: f58fac1ca1ae81f1c748b92644059db403e10988
plan_head_after: a9c4b71fc361de3144dafa50ec5d5c5873eef755

tech-stack:
  added: []
  patterns:
    - "A day whose cards all sit inside a choice keeps `route.mode: driving` and lets `routeVisible` hide the button by itself (no shared card, routeCards = [])"
    - "A car return is a `disabled: true` stop outside the choice: `time` is a planning slot, while the note marks place and time and asks for a signed receipt"

key-files:
  created:
    - content/trips/campania/days/sabado-26.yml
    - content/trips/campania/monuments/casertavecchia.yml
    - content/trips/campania/monuments/lago-d-averno.yml
    - content/trips/campania/monuments/antro-della-sibilla.yml
    - content/trips/campania/monuments/spiaggia-di-miseno.yml
  modified:
    - content/trips/campania/days/domingo-27.yml
    - content/trips/campania/days/lunes-28.yml
    - tests/data/campania-content.spec.ts
    - tests/trips/campania.spec.ts

key-decisions:
  - "Saturday 26 timeline: shared car departure from the Friday garage → choice «Excursión de día, elige una» (Opción 1: car row + Casertavecchia 10:30 + ⏱ homemade lunch meta; Opción 2: car row to Pozzuoli + Averno 10:00 + Cuma 12:00 + Miseno 15:00, all pace all) → disabled «Devolución del coche · Capodichino» at 18:30 (place and time marked, signed receipt) → Alibus/taxi back → disabled «Noche: regreso y descanso en Nápoles» at 20:30"
  - "Cuma facts: closed on Tuesdays, Saturday open, compulsory booking with turns, the Antro 25 people at a time and the bradisismo refund are stated plainly; the 9:00-19:00 summer hours and the Circuito Flegreo €10 / €5 ticket carry the 2027 marker"
  - "The Casertavecchia lunch and the Averno wineries stay generic («a elegir sobre el terreno»); the Parco del Partenio is an optional extra in prose only (D-05, D-14)"

patterns-established:
  - "The ten-day describe derives route visibility from `routeVisible(day, routeCards(day).length)` over all days, so a future day that grows a shared card or loses one changes the expected list explicitly"

requirements-completed: []

coverage:
  - id: D1
    description: "Real Saturday 26: car day trip with Opción 1 (Casertavecchia + Partenio in prose) and Opción 2 (Averno, Cuma, Miseno), the D-01 car return at Capodichino outside the choice, no route button"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#sábado 26: dos opciones en coche y devolución en Capodichino (D-01, D-05)"
        status: pass
      - kind: e2e
        ref: "pnpm test:trips (45 passed)"
        status: pass
    human_judgment: true
    rationale: "Whether the Saturday reads well as a slow family day and whether the return slot leaves enough margin need a human eye in UAT"
  - id: D2
    description: "Four real cards XVIII-XXI with RESEARCH heroes and coords; family note on Miseno; each in exactly one day's cards"
    requirement: CAMP-02
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#fichas escritas, #nota familiar, #numerales del mapa, #las fichas son exactamente las 24 de ROMANS"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#el mapa encuadra Nápoles, Procida, Ischia y Salerno a la vez (EXT-05, D-13); nature markers"
        status: pass
    human_judgment: true
    rationale: "Hero subjects were checked by Commons title only (RESEARCH A6); the visual fit needs UAT"
  - id: D3
    description: "Cuma 2027 hours and price, driving durations, Miseno services, parking at Casertavecchia and Averno, the car-return place and time and the Alibus fare carry **⚠ por confirmar**; the verified Cuma rules and the Averno loop are plain"
    requirement: CAMP-06
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#marcador ⚠ por confirmar (MARKER_FILES + plain-field ban)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Full ten-day / 24-card contract (slugs, orders 1..10, pills, eyebrows, stays, transports, route visibility, route.enabled false on 19/27/28, choices on 24 and 26 only, monuments == ROMANS, Wikimedia heroes, one day per card, stadium on 27 only as stop.ref)"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#los diez días y las 24 fichas (CAMP-01, CAMP-02, D-03, D-04, D-07, D-08)"
        status: pass
      - kind: unit
        ref: "mutation: stadio-maradona appended to domingo-27 cards → 3 tests red, file restored"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: los diez días aparecen en orden con su pastilla (D-03)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 06: Sábado 26 y el contrato de los diez días Summary

**Saturday 26 is now a real car day trip. You pick one of two options: the stone borgo of Casertavecchia, with the Partenio as an optional walk, or the Campi Flegrei (the Averno crater lake, the Sibyl's cave at Cuma and the volcanic beach at Miseno). After the choice, the car goes back at Capodichino. The place and time are marked, and the stop asks for a signed receipt. Four real cards (XVIII-XXI) bring the itinerary to ten days and 24 cards, and the content spec now pins that whole shape.**

## Performance

- **Duration:** about 10 min
- **Completed:** 2026-11-22T01:01Z
- **Tasks:** 2
- **Files modified:** 9 (5 created, 4 modified)

## Accomplishments

- **Saturday 26** (`sabado-26`, order 8, pill «Sáb 26», roman VIII, `stay: napoles`, `route.mode: driving`):
  - Stats: `car` (excursion plus the return) and `bus` (Alibus back).
  - Shared car departure → one choice with «Opción 1» (Casertavecchia) and «Opción 2» (Averno, Cuma, Miseno).
  - Then the disabled car-return stop at Capodichino, the Alibus/taxi row and the disabled night stop.
  - `routeCards` is `[]`, so the route button hides itself. The day has a light block.
- **Cards:**
  - `casertavecchia` (church): the borgo, the Duomo and the lanes, with the Partenio in prose and a generic lunch.
  - `lago-d-averno` (nature/trail): the Aeneid's gate to the underworld, the 2.8 km / 45 min loop and Lucrino 1 km away.
  - `antro-della-sibilla` (temple): every verified Cuma rule, with the 2027 hours and price marked.
  - `spiaggia-di-miseno` (nature/sea): Miliscola between the lake and the sea, with a family note and services marked.
- **Order bump:** `domingo-27` moves to 9 and `lunes-28` to 10, in the same commit as Saturday.
- **Tests:**
  - New Saturday 26 test.
  - New describe «los diez días y las 24 fichas» with 8 tests.
  - The e2e day-order test now asserts exactly 10 days and was renamed.

## Task Commits

1. **Task 1: Saturday 26, four cards, order bump**: `c70c28b` (feat)
2. **Task 2: ten-day / 24-card contract and ten-day e2e**: `a9c4b71` (test)

## Verification

- `vitest run tests/data tests/unit`: 1299 passed after Task 1 and 1307 after Task 2. The gate `day-order` rule (1..10) and the `ref` rule inside the options are green.
- Mutation: appending `stadio-maradona` to `domingo-27` cards turned 3 tests red (including «cada ficha está en las fichas de un solo día»). The file was restored, and `git status` is clean.
- `nuxi prepare`, `nuxi typecheck` and `eslint` on both specs: exit 0.
- `rm -rf .data .nuxt && pnpm test:trips` on Node 22: **45 passed**. This covers:
  - multi-city map framing with all 24 markers
  - nature markers and family boxes
  - the Thursday and Friday routes
  - 375 px overflow
  - the ten-day order test
  - the Roma-leak trap
- No dev server was left running.
- Frozen-path check: empty.
- Every acceptance criterion of both tasks passes: 10 days, 24 monuments, 0 `example.invalid`, `toHaveLength(10)`, 8 ROMANS references, «las 24 fichas».

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed / auto-added

**1. [Rule 1 - Bug] Removed the stale «Orden provisional» comments in domingo-27 and lunes-28**
- **Found during:** Task 1
- **Issue:** Both files had a comment saying their order was provisional until 13-06. Once the orders became final, those comments were wrong.
- **Fix:** Deleted the two comment lines together with the `order:` change. No data changed.
- **Commit:** c70c28b

**2. [Rule 2 - Missing critical] Saturday gets a `bus` stat and an Alibus/taxi row after the car return**
- **Found during:** Task 1
- **Issue:** The plan asks for «a way back to the base (Alibus or taxi)» but lists only a `car` stat.
- **Fix:** Added a bus transport row (the verified Alibus facts reused from domingo-27, with the fare marked) and a matching `bus` stat, following the 13-05 pattern.
- **Commit:** c70c28b

**3. [Rule 2 - Missing critical] MARKER_FILES also registers the four new cards**
- **Found during:** Task 1
- **Issue:** The plan registers only `days/sabado-26.yml`, but all four cards carry marked data.
- **Fix:** Registered them as well, as in 13-03 to 13-05.
- **Commit:** c70c28b

**Total deviations:** 3 (1 Rule 1, 2 Rule 2). **Impact:** no scope change. The timeline matches its stats, and the marker contract is stricter.

## Issues Encountered

None. `.nuxt` was still in place when the first vitest ran.

## Known Stubs

None in this plan's files.

## User Setup Required

None.

## Next Phase Readiness

- All ten days and 24 cards are real.
- 13-07 writes Reservas and Práctica, including the car return, now marked on Saturday 26. After that, `(#reservas)` and `(#practica)` links become valid.
- CAMP-* stay unticked in REQUIREMENTS.md because 13-07 and 13-08 still declare them.

## Self-Check: PASSED

- FOUND: content/trips/campania/days/sabado-26.yml, monuments/casertavecchia.yml, monuments/lago-d-averno.yml, monuments/antro-della-sibilla.yml, monuments/spiaggia-di-miseno.yml
- FOUND commits: c70c28b, a9c4b71 (ancestors of HEAD)
