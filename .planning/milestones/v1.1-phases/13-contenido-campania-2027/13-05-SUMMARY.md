---
phase: 13-contenido-campania-2027
plan: 05
subsystem: content
tags: [nuxt-content, yaml, vitest, playwright, campania, days, monuments, concert, driving-route]

requires:
  - phase: 13-contenido-campania-2027
    provides: 13-01 content contract (registries, ROMANS with ♪/XXII/XXIII reserved), 13-02 food slugs g-1-concettina and g-2-caseificio-carretera, 13-04 days 23-24 and viernes-25 at order 7
provides:
  - Real viernes-25 (order 7): Vesuvius vineyards, Sanità, Ultimo at the Maradona on Friday 25, driving route with 3 cards and no choice
  - New domingo-27 (order 8 for now) and lunes-28 (order 9 for now), with their final pills, numerals IX/X and eyebrows
  - Five real cards: vesubio XVI (nature), rione-sanita XVII, stadio-maradona ♪ (concert), napoli-sotterranea XXII, capodimonte XXIII
  - Content-spec registries and tests for days 25, 27 and 28
affects: [13-06, 13-07, 13-08]

actuals:
  tokens: 7712
  tasks: 2
  commits: 2
plan_head_before: 7308aeaa563f677907e9ffd2ac6a8fdaa3d86b17
plan_head_after: b7e92276e7daf9b009b11e528b11a47073adc2f6

tech-stack:
  added: []
  patterns:
    - "A card that serves two days goes in the first day's `cards` only; the other day cites it through `stop.ref` (stadio-maradona on domingo-27, Pitfall 7)"
    - "A concert stop's `time` is the arrival with margin, and its note says the start time is **⚠ por confirmar**, so no start time ever reads as confirmed"

key-files:
  created:
    - content/trips/campania/days/domingo-27.yml
    - content/trips/campania/days/lunes-28.yml
    - content/trips/campania/monuments/stadio-maradona.yml
    - content/trips/campania/monuments/napoli-sotterranea.yml
    - content/trips/campania/monuments/capodimonte.yml
  modified:
    - content/trips/campania/days/viernes-25.yml
    - content/trips/campania/monuments/vesubio.yml
    - content/trips/campania/monuments/rione-sanita.yml
    - tests/data/campania-content.spec.ts

key-decisions:
  - "Friday 25: the car drives Salerno → Vesuvius → Naples and is parked in a garage or car park near the base (marked) until Saturday. A ZTL warning sits in the footnote, and the base zone for 25-27 is marked there too (D-25). The day never mentions handing the car back (D-01)"
  - "Ultimo stop at 19:30 (arrival with margin), `reservedEvent: true`, with a reservation row «Entradas de Ultimo · viernes 25». The note says the tour calendar announced the 24th but your tickets rule; start time and gates are marked (D-22)"
  - "Sunday 27 order: 10:00 airport goodbye (disabled), an Alibus/taxi transport back to the centre, Napoli Sotterranea at 12:00, a disabled stop for lunch and bookshops (Port'Alba and Piazza Dante area, no shop names), Capodimonte at 16:30 with pace medium, Linea 2, PTN at 19:30. PTN is not `reservedEvent`, because its tickets are marked"
  - "Monday 28: Alibus/taxi to Capodichino (bus), then the plane row with «Despegue a las 09:55» and the airline marked. Stats bus + plane, no stay, `route.enabled: false`, `cards: []`"
  - "rione-sanita takes motif `stairs` (RESEARCH card table) instead of the skeleton's `church`"

patterns-established:
  - "The Monday 28 test checks that `stay` is absent from the raw YAML (`'stay' in day`), not just null, matching the D-04 «no base» contract"

requirements-completed: [CAMP-01, CAMP-02, CAMP-06]

coverage:
  - id: D1
    description: "Real Friday 25 (Vesuvius, Sanità, Ultimo on the 25th, no car return, driving route) and new Sunday 27 and Monday 28 (goodbye, Napoli Sotterranea, PTN by stop.ref, 09:55 flight to Palma, no base)"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#viernes 25: Ultimo el viernes, sin devolución del coche (D-01, D-22)"
        status: pass
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#domingo 27: despedida, Napoli Sotterranea y PTN (D-06, D-08)"
        status: pass
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#lunes 28: vuelo a Palma y sin base (D-04, D-08)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: el viernes 25 abre la ruta del día en coche (EXT-06, D-14)"
        status: pass
      - kind: e2e
        ref: "playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts (38 passed)"
        status: pass
    human_judgment: true
    rationale: "Whether the concert-night logistics with children and the Sunday pacing read well on the ground, and the D-09 tone, need a human eye in UAT"
  - id: D2
    description: "Five real cards (vesubio XVI nature, rione-sanita XVII, stadio-maradona ♪ concert, napoli-sotterranea XXII, capodimonte XXIII) with RESEARCH heroes and coords; family notes on the stadium and Napoli Sotterranea; the stadium listed only in viernes-25 cards"
    requirement: CAMP-02
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#fichas escritas (CAMP-02, D-10, D-11), #nota familiar, #numerales del mapa (D-10)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#cada lugar de naturaleza tiene marcador verde agua y dibujo de reserva (EXT-04, D-05)"
        status: pass
    human_judgment: true
    rationale: "Hero subjects were checked by Commons title only (RESEARCH A6); the visual fit needs UAT"
  - id: D3
    description: "Concert start times and gates, the PTN date, 2027 transport services, the Maradona works, Napoli Sotterranea hours and prices, Capodimonte hours, driving durations, parking, the ZTL hours and the Naples base zone carry **⚠ por confirmar**; the Ultimo date is not marked"
    requirement: CAMP-06
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#marcador ⚠ por confirmar (CAMP-06, D-12) (MARKER_FILES + plain-field ban)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Contiguous day order 1..9 at every commit"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "node_modules/.bin/vitest run tests/data tests/unit (gate rule day-order; 1264 passed after Task 1, 1281 after Task 2)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: los días aparecen en orden con su pastilla (D-03)"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 05: Días 25, 27 y 28 (conciertos y vuelta) Summary

**Friday 25 is now a real day. You drive from Salerno to the Vesuvius vineyards, then on to Naples, where the car stays in a car park near the base (marked) with a ZTL warning, and nothing is handed back. The afternoon is in the Sanità, with an early pizza at Da Concettina, and the night ends with Ultimo at the Maradona with the children: the date comes from your tickets, while time and gates are marked. Sunday 27 starts with the 10:00 airport goodbye. Then come Napoli Sotterranea, the bookshops and Capodimonte, and the Pinguini Tattici Nucleari concert, cited only by `stop.ref`. Monday 28 is the 09:55 flight to Palma. The plan adds five real cards: XVI, XVII, ♪, XXII and XXIII.**

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-22T00:47:48Z
- **Completed:** 2026-11-22T00:54:30Z
- **Tasks:** 2
- **Files modified:** 9 (5 created, 4 modified)

## Accomplishments

- **Friday 25** (`viernes-25`, order 7, `stay: napoles`, `route.mode: driving`, no choice):
  - Stats `car` and `metro`.
  - Car row to the Vesuvius, then the `vesubio` stop at 10:30 and the caseificio food row (pace medium).
  - Car row to Naples. Its footnote holds the base zone, the garage or car park and the ZTL, all marked.
  - `rione-sanita` at 16:30, then dinner at Concettina.
  - Linea 2 row (`variant: train`) from Piazza Cavour, route marked.
  - «Concierto de Ultimo» (`ref: stadio-maradona`, `tag: concierto`, `reservedEvent`), followed by the ticket reservation row and a short ⏱ return meta.
  - The light block is included, and «devoluci» appears nowhere in the file.
- **Sunday 27** (`domingo-27`, order 8 for now, pill «Dom 27», roman IX, `route.enabled: false`):
  - Stats `bus` and `metro`.
  - The disabled 10:00 goodbye stop, then an Alibus/taxi row to the centre.
  - Napoli Sotterranea, then a disabled stop for lunch and bookshops.
  - Capodimonte (pace medium), then the Linea 2 row.
  - The PTN stop by `stop.ref`, with date, time and tickets marked, and a ⏱ meta.
  - `cards: [napoli-sotterranea, capodimonte]`.
- **Monday 28** (`lunes-28`, order 9 for now, pill «Lun 28», roman X):
  - No `stay` and `route.enabled: false`.
  - Bus row to Capodichino, then the plane row «Despegue a las 09:55» with the airline marked.
  - Short light block, and `cards: []`.
- **Cards:**
  - `vesubio` is now `nature`/garden.
  - `rione-sanita` has the stairs motif and the Palazzo dello Spagnuolo hero.
  - `stadio-maradona` is `type: concert`, ♪, `badge: concierto`, `day: Viernes 25 / Domingo 27`. It has «Los dos conciertos» and a «Logística práctica» list (Linea 2, Cumana, the 2025 extra trains, taxis, the works from January 2027, all marked), plus a family note.
  - `napoli-sotterranea`: Piazza San Gaetano 68, guided visits only, a long staircase, family note.
  - `capodimonte`: the Real Bosco, hours marked.
- **Tests:** `campania-content.spec.ts` gets the registries (WRITTEN_DAYS, WRITTEN_MONUMENTS, FAMILY_REQUIRED, MARKER_FILES) and three new tests for Friday 25, Sunday 27 and Monday 28.

## Task Commits

1. **Task 1: Friday 25 + Vesubio, Sanità and Maradona cards**: `f350632` (feat)
2. **Task 2: Sunday 27, Monday 28 + Napoli Sotterranea and Capodimonte**: `b7e9227` (feat)

## Verification

- `vitest run tests/data tests/unit`: 1264 passed after Task 1 and 1281 after Task 2. The gate rule `day-order` is green with orders 1..9.
- `nuxi prepare` and `eslint tests/data/campania-content.spec.ts`: exit 0.
- `playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts` on Node 22, after `rm -rf .data .nuxt`: **38 passed**. This covers:
  - the Friday driving route with 3 points
  - the nature markers, including vesubio
  - the family boxes count
  - the map framing
  - the 375 px overflow backstops
  - the 10-pill and 10-day shape checks
  - the Roma-leak trap

  No dev server was left running.
- Frozen-path check: empty.
- All acceptance criteria of both tasks: PASS.

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Missing critical] MARKER_FILES for every new or rewritten file with doubtful data**
- **Found during:** Tasks 1-2
- **Issue:** The plan listed only `days/viernes-25.yml` and `days/domingo-27.yml` for MARKER_FILES. `lunes-28` and the cards vesubio, stadio-maradona, napoli-sotterranea and capodimonte also carry marked data, and without a registry entry the marker rule would not protect them.
- **Fix:** Added them, following the 13-03 and 13-04 registry pattern. `rione-sanita` has no doubtful data, so it carries no marker and is not registered.
- **Files modified:** tests/data/campania-content.spec.ts
- **Commits:** f350632, b7e9227

**2. [Rule 2 - Missing critical] Sunday 27 gets a bus transport row from the airport to the centre**
- **Found during:** Task 2
- **Issue:** The plan gives Sunday a `bus` stat but no bus row, so the stat would describe a move the timeline never showed.
- **Fix:** Added an Alibus/taxi row after the 10:00 goodbye. It reuses the verified Alibus facts (Piazza Garibaldi, every 10-20 min, ≈20 min) and marks the 5 € fare.
- **Commit:** b7e9227

**Total deviations:** 2 auto-added (Rule 2). **Impact:** no scope change; the marker contract is stricter and the Sunday timeline matches its stats.

## Issues Encountered

- The first vitest run after `rm -rf .data .nuxt` failed to load the suites (`Cannot find module './.nuxt/tsconfig.json'`). Running `nuxi prepare` first fixed it; this was an environment issue, not a test failure.

## Known Stubs

None in this plan's files.

## User Setup Required

None.

## Next Phase Readiness

- 13-06 has three jobs in a single commit (so the gate stays contiguous): add `sabado-26` at order 8, move `domingo-27` to 9 and move `lunes-28` to 10.
- 13-06 writes the Saturday cards XVIII-XXI and the car return on Saturday 26 (D-01).
- The ten-day registry then covers all days.

## Self-Check: PASSED

- FOUND: content/trips/campania/days/domingo-27.yml, days/lunes-28.yml, monuments/stadio-maradona.yml, monuments/napoli-sotterranea.yml, monuments/capodimonte.yml
- FOUND commits: f350632, b7e9227 (ancestors of HEAD)
