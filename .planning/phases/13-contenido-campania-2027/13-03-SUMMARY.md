---
phase: 13-contenido-campania-2027
plan: 03
subsystem: content
tags: [nuxt-content, yaml, vitest, playwright, campania, days, monuments]

requires:
  - phase: 13-contenido-campania-2027
    provides: 13-01 content contract (registries, ROMANS), 13-02 food slugs g-1-pizzeria-vomero, g-3-caracale, g-3-la-lampara, g-3-il-focolare
provides:
  - Real days sabado-19 (order 1), domingo-20 (order 2) and the new lunes-21 (order 3)
  - Seven real cards with RESEARCH heroes and coords, numerals I-VII (lungomare-caracciolo, vomero, spaccanapoli, marina-corricella, pozzo-vecchio, terra-murata, forio)
  - martes-22 / jueves-24 / viernes-25 moved to orders 4 / 5 / 6
  - Day-order e2e derived from the YAML (no hard-coded list)
affects: [13-04, 13-05, 13-06, 13-07, 13-08]

actuals:
  tokens: 6550
  tasks: 3
  commits: 3
plan_head_before: d09c45499ba2949608fdd313687de082abcaa125
plan_head_after: 04c32169035d186789533a62a5f41c9d53c30df8

tech-stack:
  added: []
  patterns:
    - "Transport `modes[].meta` stays short (one short phrase plus the marker): `.tl-transport-mode-meta` is `white-space: nowrap`, so a long meta widens the grid and overflows 375 px. Longer doubtful data goes in `desc`"
    - "Order bumps of later days ship in the same commit as the new day, so `day-order` stays contiguous at every commit"

key-files:
  created:
    - content/trips/campania/days/lunes-21.yml
    - content/trips/campania/monuments/lungomare-caracciolo.yml
    - content/trips/campania/monuments/vomero.yml
    - content/trips/campania/monuments/terra-murata.yml
    - content/trips/campania/monuments/forio.yml
  modified:
    - content/trips/campania/days/sabado-19.yml
    - content/trips/campania/days/domingo-20.yml
    - content/trips/campania/days/martes-22.yml (order line only)
    - content/trips/campania/days/jueves-24.yml (order line only)
    - content/trips/campania/days/viernes-25.yml (order line only)
    - content/trips/campania/monuments/spaccanapoli.yml
    - content/trips/campania/monuments/marina-corricella.yml
    - content/trips/campania/monuments/pozzo-vecchio.yml
    - tests/data/campania-content.spec.ts
    - tests/trips/campania.spec.ts

key-decisions:
  - "Saturday 19: plane, then Alibus to Piazza Garibaldi (which does not reach the Vomero, D-26), then a no-variant leg by Metro Línea 1 to Vanvitelli or a funicular. The metro, funicular, fare and accommodation are marked; route.enabled is false"
  - "Sunday 20: the Caremar traghetto from Porta di Massa (12:15 / 13:30, marked) is the recommended mode, and the hydrofoil from Molo Beverello is a second mode in the same single ferry row. The island car ban is that row's footnote (Procida 2025 and Ischia 2026 seasons, 2027 marked)"
  - "Caracalè is offered for a long lunch if you take the first ferry, or for dinner; La Lampara for dinner. Both sit in one `Mesa en la Corricella` food row"
  - "Monday 21: the arrival port (Ischia Porto or Casamicciola) is marked in the ferry row's footnote. The lunch is an unnamed disabled stop «a elegir sobre el terreno»"
  - "Cards with doubtful data join MARKER_FILES: vomero, spaccanapoli, pozzo-vecchio, forio, plus days sabado-19, domingo-20 and lunes-21"

patterns-established:
  - "Each day test in campania-content.spec.ts checks the day's `cards` list exactly, so a card can never be orphaned or listed twice by mistake"

requirements-completed: [CAMP-01, CAMP-02, CAMP-06]

coverage:
  - id: D1
    description: "Real Saturday 19, Sunday 20 and Monday 21 with D-06 logistics, D-07 shapes, D-08 route behaviour and D-26 corrections"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#sábado 19: avión, Alibus y un tramo sin variante hasta el Vomero (D-07, D-08, D-26)"
        status: pass
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#domingo 20: un ferry, una bici, sin ruta (D-07, D-08, D-26)"
        status: pass
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#lunes 21: ferry a Ischia y sin ruta (D-06, D-08)"
        status: pass
      - kind: e2e
        ref: "playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts (38 passed)"
        status: pass
    human_judgment: true
    rationale: "Tone (D-09) and how usable the arrival and island-hopping logistics are on the ground need a human eye in UAT"
  - id: D2
    description: "Seven real cards I-VII with Wikimedia heroes, coords in the trip box, prose, facts and a family note on Pozzo Vecchio"
    requirement: CAMP-02
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#fichas escritas (CAMP-02, D-10, D-11) and #numerales del mapa (D-10)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#cada lugar de naturaleza tiene marcador verde agua y dibujo de reserva (EXT-04, D-05)"
        status: pass
    human_judgment: true
    rationale: "Hero subjects were checked by Commons title only (RESEARCH A6); the visual fit needs UAT"
  - id: D3
    description: "Every unpublished 2027 value (ferry times, Alibus fare, race date, bikes, arrival port, accommodation, island car-ban dates) carries **⚠ por confirmar** in a Markdown field"
    requirement: CAMP-06
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#marcador ⚠ por confirmar (CAMP-06, D-12) (MARKER_FILES + plain-field ban)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Contiguous day order 1..6 at every commit and a derived order e2e"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "node_modules/.bin/vitest run tests/data tests/unit (gate rule day-order; 1207 / 1217 / 1227 passed after each task)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: los días aparecen en orden con su pastilla (D-03)"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 03: Días 19-21 (Nápoles, Procida, Ischia) Summary

**Saturday 19, Sunday 20 and Monday 21 are now real days. Saturday covers the 16:35 landing, the Alibus to Garibaldi and the metro or funicular up to the Vomero, then the Lungomare at sunset. Sunday covers the Spaccanapoli race, Porta di Massa and one Caremar ferry to Procida, then bikes, Pozzo Vecchio and the Corricella. Monday covers Terra Murata, the ferry to Ischia and the Soccorso sunset in Forio. The days come with seven real cards (I-VII), every unpublished 2027 timetable is marked, and orders shift to a contiguous 1..6.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-11-22T00:26:02Z
- **Completed:** 2026-11-22T00:38:07Z
- **Tasks:** 3
- **Files modified:** 15 (5 created, 10 modified)

## Accomplishments

- **Saturday 19** (`sabado-19`, order 1, `stay: napoles`, `route.enabled: false`):
  - Plane, then Alibus (to Piazza Garibaldi, Porta di Massa and Molo Beverello, «no sube al Vomero»), then a no-variant Metro Línea 1 / funicular leg.
  - Stops at the Vomero and the Lungomare at sunset, then a welcome dinner (food row with `g-1-pizzeria-vomero`).
  - Stats: plane, bus and metro. Light block: taxi, a short walk, an early night.
- **Sunday 20** (`domingo-20`, order 2, `stay: procida`, no `route` key):
  - The race stop gives the 2026 edition's data (21 de junio de 2026, Piazza Municipio, UISP Napoli, 10 km and 5 km, traffic closed 08:00-10:30); the 2027 date is marked.
  - A walk to Porta di Massa (traghetti), noting that hydrofoils leave from Molo Beverello.
  - Exactly one ferry row (Caremar 12:15 / 13:30, marked, ≈1 h, plus a hydrofoil mode) with the island-car footnote.
  - Exactly one bike row (Marina Grande hire, marked), then Pozzo Vecchio, the Corricella sunset, and Caracalè and La Lampara.
- **Monday 21** (`lunes-21`, new, order 3, `stay: ischia`, no `route` key):
  - Terra Murata and the lemon groves, then an unnamed lunch.
  - One ferry row: traghetto ≈30 min or hydrofoil 15-20 min. The 15:45 / 17:15 departures and the arrival port are marked.
  - EAV bus or taxi to Forio, the Soccorso at sunset, and Il Focolare.
- **Cards:**
  - New: `lungomare-caracciolo` (I), `vomero` (II), `terra-murata` (VI), `forio` (VII).
  - Rewritten: `spaccanapoli` (III), `marina-corricella` (IV), `pozzo-vecchio` (V, nature/sea with a «Con niños» note).
  - Each card has the verbatim RESEARCH hero URL and coords, three prose sections, facts and a mapsQuery. Each is listed in exactly one day's `cards`.
- **Orders:** `martes-22`, `jueves-24` and `viernes-25` moved 3, 4, 5 → 4, 5, 6 in the same commit as `lunes-21`.
- **Tests:**
  - `campania.spec.ts`: the order test now checks `days.map((_, i) => i + 1)`, renamed «campania: los días aparecen en orden con su pastilla (D-03)».
  - `campania-content.spec.ts`: three new day tests plus the registry growth.

## Task Commits

1. **Task 1: Saturday 19 + Lungomare and Vomero cards**: `2dde1f7` (feat)
2. **Task 2: Sunday 20 race + ferry to Procida + three cards**: `229b35b` (feat)
3. **Task 3: Monday 21 + Terra Murata and Forio + order shift + derived order e2e**: `04c3216` (feat)

## Verification

- `vitest run tests/data tests/unit`: 1207 passed after Task 1, 1217 after Task 2 and 1227 after Task 3 (gate rule `day-order` green at every commit).
- `nuxi prepare`, `nuxi typecheck` and `eslint` on both specs: exit 0.
- `playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts` on Node 22, after `rm -rf .data .nuxt`: 38 passed after Task 2 and after Task 3. This covers the Sunday ferry and bike shape, the Saturday plane → bus → no-variant shape, no route on Sunday, the 375 px overflow backstops and the Roma-leak trap.
- Frozen-path check (git log of 13-0x commits and git status on roma, prueba, forma, app, shared, configs, scripts, parity and the gate files): empty.
- All acceptance criteria of the three tasks: PASS.

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Saturday's Alibus meta overflowed the page at 375 px**
- **Found during:** Task 2 (first campania e2e run)
- **Issue:** The plan asked for the meta row to carry the 5 € fare with the marker. `.tl-transport-mode-meta` is `white-space: nowrap` (base.css), so the long line «⏱ ≈20 min · 💶 billete sencillo de 5 € ⚠ por confirmar» widened the mode grid to 469 px. Two 375 px overflow backstop tests failed.
- **Fix:** The meta is now `⏱ **≈20 min** · 💶 5 € **⚠ por confirmar**`. The fare is still in the meta and still marked. A diagnostic run measured scrollWidth 375.
- **Files modified:** content/trips/campania/days/sabado-19.yml
- **Commit:** 229b35b

### Auto-added

**2. [Rule 2 - Missing critical] MARKER_FILES and exact `cards` checks for the new days and cards**
- **Found during:** Tasks 1-3
- **Issue:** The plan only added `days/domingo-20.yml` to MARKER_FILES. The other new files with doubtful data (vomero, spaccanapoli, pozzo-vecchio, forio, sabado-19, lunes-21) would not have been held to the marker rule.
- **Fix:** Those files were added to MARKER_FILES, and each day test asserts its exact `cards` list. This follows the 13-02 registry-growth pattern.
- **Files modified:** tests/data/campania-content.spec.ts
- **Commits:** 2dde1f7, 229b35b, 04c3216

**Total deviations:** 1 auto-fixed (Rule 1), 1 auto-added (Rule 2). **Impact:** no scope change. The marker contract is stricter and mobile layout parity is kept.

## Issues Encountered

- A diagnostic `nuxi dev --port 5301` that I started for the overflow investigation kept respawning its worker after `pkill`. This blocked one Playwright webServer start («Another Nuxt dev server is already running»). I killed the whole process tree and re-ran the e2e cleanly: 38 passed, and no dev server is left running.

## Known Stubs

None in this plan's files. The skeleton days jueves-24 and viernes-25 and their skeleton cards keep provisional prose by design; plans 13-04 to 13-06 rewrite them.

## User Setup Required

None.

## Next Phase Readiness

13-04 can write the following days (miércoles 23 must take order 4, and martes-22 and later move up by one in the same commit, as here). Forio's `day` field already says «Lunes 21 / Miércoles 23», but the card is listed only in lunes-21's `cards`.

## Self-Check: PASSED

- FOUND: content/trips/campania/days/lunes-21.yml, monuments/lungomare-caracciolo.yml, monuments/vomero.yml, monuments/terra-murata.yml, monuments/forio.yml
- FOUND commits: 2dde1f7, 229b35b, 04c3216 (ancestors of HEAD)
