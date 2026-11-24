---
phase: 13-contenido-campania-2027
plan: 07
subsystem: content
tags: [nuxt-content, yaml, vitest, playwright, campania, reservas, practica]

requires:
  - phase: 12.1-t-tulos-de-reservas-por-viaje
    provides: optional strict `headings { mesas, visitas, table }` in reservas.yml, RESERVAS_HEADINGS_DEFAULT and the gate rule `reservas-headings`
  - phase: 13-contenido-campania-2027
    provides: 13-06 ten real days and 24 cards (stadio-maradona, napoli-sotterranea, antro-della-sibilla), 13-02 food cards (g-3-il-focolare), the car return on Saturday 26 at Capodichino
provides:
  - Campania reference/reservas.yml with its own three headings, both flights, the Ultimo tickets (Friday 25 + official-calendar note) and a 14-row pending table
  - Campania reference/practica.yml covering ferries, driving/ZTL/island bans, heat, footwear, children, concerts and airport transfer, plus media
  - "#reservas and #practica sections and pills now exist for Campania, so (#reservas)/(#practica) links are valid"
  - CAMP-04/05/06 content-spec blocks (≥ 15 markers) and one e2e test for both sections
affects: [13-08]

actuals:
  tokens: 4690
  tasks: 2
  commits: 2
plan_head_before: 4cd2a0bc74d2ea87b200b56ff8df2165a1d6f219
plan_head_after: bf2dcdee1a6e1017fb19bc94329550d099187a68

tech-stack:
  added: []
  patterns:
    - "A non-Roma reservas.yml declares all three `headings` keys, even when a group could later become empty, so the gate rule and the e2e both stay green"
    - "Keep `**⚠ por confirmar**` on one physical line inside folded YAML blocks so `grep -rho` counts match the parsed count"

key-files:
  created:
    - content/trips/campania/reference/reservas.yml
    - content/trips/campania/reference/practica.yml
  modified:
    - tests/data/campania-content.spec.ts
    - tests/trips/campania.spec.ts

key-decisions:
  - "Reservas headings: «✈️ Vuelos» (mesas), «🎟️ Entradas confirmadas» (visitas), «Alojamientos, ferris, coche y entradas · qué reservar y cuándo» (table)"
  - "Only the Ultimo row is `isDone` / `badgeKind: done`; every lodging, ferry, the car and Pinguini stay pending (urgent or rec) because nothing else is confirmed"
  - "Práctica adds an optional «Del aeropuerto a la ciudad» section and a final «Lecturas y visionados antes del viaje» section (Roma's pattern) before media: La isla de Arturo, La amiga estupenda, El cartero (y Pablo Neruda)"

patterns-established:
  - "The e2e derives the expected Reservas h4s from the YAML groups that have entries (mesas → visitas), so an emptied group changes the expectation explicitly"

requirements-completed: []  # Plan declares [CAMP-04, CAMP-05, CAMP-06]; left unticked because 13-08 still declares them (shared-ID gate)

coverage:
  - id: D1
    description: "Campania Reservas: own headings (never Roma's), flights Sat 19 16:35 and Mon 28 09:55 with airline/booking marked, Ultimo tickets for Friday 25 with the official-calendar note"
    requirement: CAMP-04
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#reservas (CAMP-04, D-16, D-22, D-23)"
        status: pass
      - kind: unit
        ref: "mutation: sed '/^  table: /d' → regla reservas-headings + D-23 test red, file restored"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: Reservas y Práctica llevan sus propios títulos, nunca los de Roma (CAMP-04, CAMP-05, D-23)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Reservas pending table: five lodging rows (Naples 25-27 with same-base question marked), three ferries, hire car Wed 23 16:00 → Sat 26 at Capodichino with signed receipt, both concerts, Napoli Sotterranea, Cuma, Il Focolare; no codes, phones or private addresses"
    requirement: CAMP-04
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#la tabla tiene cada base, tres ferris y el coche; #datos personales (T-13-02); gate rule ref"
        status: pass
    human_judgment: true
    rationale: "Whether the pending list matches what the family has actually booked by now is something only the user can confirm"
  - id: D3
    description: "Campania Práctica covering every D-17 topic with field data marked"
    requirement: CAMP-05
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#práctica y marcador final (CAMP-05, CAMP-06, D-17)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#Reservas y Práctica (Práctica h4s in YAML order)"
        status: pass
    human_judgment: true
    rationale: "Tone (slow, family, second person plural) and usefulness on the ground need a human read in UAT"
  - id: D4
    description: "CAMP-06 final threshold: ≥ 15 markers across Campania (172 now), every MARKER_FILES entry incl. reservas and practica carries one, none in plain fields"
    requirement: CAMP-06
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#marcador ⚠ por confirmar + #la guía lleva al menos 15 marcadores"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 07: Reservas y Práctica de Campania Summary

**Campania now has its own Reservas page. It has three headings of its own: Vuelos, Entradas confirmadas, and a table header covering lodging, ferries, the car and tickets. It lists the flights of the 19th and the 28th, the Ultimo tickets for Friday 25 (with a note on the Thursday-24 calendar), and a 14-row pending table. A new Práctica page covers ferries, ZTL and the island car bans, June heat, footwear, children, the Maradona concerts and the airport transfer. The guide now carries 172 markers, well over the CAMP-06 minimum of 15.**

## Performance

- **Duration:** about 5 min
- **Started:** 2026-11-22T01:03:51Z
- **Completed:** 2026-11-22T01:08:28Z
- **Tasks:** 2
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments

- **Reservas** (`reference/reservas.yml`, order 1):
  - `headings` sets all three keys, each non-blank and different from Roma's.
  - `confirmed`: two flights under `mesas` (airline and booking marked) and the Ultimo tickets under `visitas`. The Ultimo entry links `[Ultimo](#stadio-maradona)`, says Friday 25 and notes that the official calendar said Thursday 24. Start time and gates are marked.
  - `table` (14 rows):
    - Lodging: Naples 19, Procida 20, Ischia 21-22, Salerno 23-24, and Naples 25-27 with «¿La misma base…?» marked.
    - Ferries: Naples → Procida (Caremar, Porta di Massa, 12:15 / 13:30 marked, MyCaremar), Procida → Ischia, and Ischia → Naples.
    - Hire car: pickup Wednesday 23 at 16:00 at Capodichino with Arantxa, return Saturday 26 expected at Capodichino (company, point and time marked), signed receipt.
    - Ultimo (`done`, `isDone`), Pinguini (single source), Napoli Sotterranea, Cuma and Il Focolare, each with its `ref`.
- **Práctica** (`reference/practica.yml`, order 2) has 8 sections:
  - Ferris y puertos
  - Conducir: ZTL, aparcar y por qué no hay coche en las islas
  - Calor y sol de finales de junio
  - Calzado: roca volcánica y escalones
  - Con niños
  - Conciertos en el Maradona
  - Del aeropuerto a la ciudad
  - Lecturas y visionados antes del viaje

  It also has `media` with two books and one film, all real and well known.
- **Tests:**
  - Content spec: CAMP-04 describe (6 tests) and CAMP-05/06 describe (6 tests), with both reference files added to MARKER_FILES.
  - e2e: one test for Reservas and Práctica.

## Task Commits

1. **Task 1: Reservas with own headings, flights, Ultimo tickets and pending table**: `b7d3fc0` (feat)
2. **Task 2: Práctica, final CAMP-06 threshold, Reservas/Práctica e2e**: `bf2dcde` (feat)

## Verification

- `vitest run tests/data tests/unit`: 1315 passed after Task 1 and 1323 after Task 2. The gate rules `reservas-headings` and `ref` (table refs) are green.
- Mutation: deleting the `headings.table` line made `regla reservas-headings` and the D-23 test fail. The file was restored byte for byte, and `git status` was clean.
- `nuxi prepare`, `nuxi typecheck` (exit 0, no errors) and `eslint` on both specs: clean.
- `rm -rf .data .nuxt && pnpm test:trips` on Node 22: **46 passed**. This includes the new «Reservas y Práctica» test and the Roma-leak trap on campania. No dev server was left running (port 5300 free).
- Frozen-path check: empty.
- Acceptance criteria, all PASS:
  - present / present
  - `^headings:` 1, `^  table: ` 1
  - Ferry 3, Alojamiento 5
  - «calendario oficial» 1, «3 comensales» 0
  - «heading: Ferris y puertos» 1, ZTL 3, Piazzale Tecchio 1
  - 172 markers
  - e2e describe present

## Decisions Made

See `key-decisions` above.

## Deviations from Plan

### Auto-fixed / auto-added

**1. [Rule 2 - Missing critical] Práctica gets a «Lecturas y visionados antes del viaje» section before `media`**
- **Found during:** Task 2
- **Issue:** PracticaSection gives the media lists category titles, but the intro heading for the reading block comes from the last data section (Roma's pattern). Without that section, the lists would appear with no heading.
- **Fix:** Added a short final section with that heading. It does not affect the D-17 heading regexes, and the e2e compares every section heading in order.
- **Commit:** bf2dcde

**2. [Rule 1 - Accuracy] Softened unverified details while authoring**
- **Found during:** Task 2
- **Issue:** Draft wording added facts that RESEARCH does not support: taxi queues, the terrain of the Epomeo path, and how much of Il Postino was filmed on Procida.
- **Fix:** Removed the queue claim, used the verified «unos 3 km de subida desde Fontana», and wrote «rodada en parte en Procida, en la Marina Corricella».
- **Commit:** bf2dcde

**Total deviations:** 2 (1 Rule 2, 1 Rule 1). **Impact:** none on scope. The text is stricter about D-14.

## Issues Encountered

None.

## Known Stubs

None. Every `**⚠ por confirmar**` marks real data that is not yet published (D-12), not a stub.

## User Setup Required

None.

## Next Phase Readiness

- Campania's content is complete: ten days, 24 cards, Gastronomía, Reservas and Práctica.
- 13-08 can close the phase.
- CAMP-04/05/06 stay unticked in REQUIREMENTS.md because 13-08 still declares them.

## Self-Check: PASSED

- FOUND: content/trips/campania/reference/reservas.yml, content/trips/campania/reference/practica.yml
- FOUND commits: b7d3fc0, bf2dcde (ancestors of HEAD)
