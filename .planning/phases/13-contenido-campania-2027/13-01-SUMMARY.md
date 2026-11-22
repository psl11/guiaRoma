---
phase: 13-contenido-campania-2027
plan: 01
subsystem: content
tags: [nuxt-content, yaml, vitest, campania, content-contract]

requires:
  - phase: 12-formas-nuevas-de-viaje
    provides: Campania skeleton (days, cards, stays, route, family box, nature motifs)
  - phase: 12.1-t-tulos-de-reservas-por-viaje
    provides: reservas-headings gate rule (21 rules)
provides:
  - tests/data/campania-content.spec.ts, the Wave-0 content contract with registries that later plans extend (WRITTEN_DAYS, WRITTEN_MONUMENTS, FAMILY_REQUIRED, MARKER_FILES, ROMANS)
  - Real martes-22 (Ischia) with real Monte Epomeo and Baia di Sorgeto cards
  - Publishable campania trip.yml (still draft, control mark kept)
  - Final visit-order numerals for the 11 existing cards (24-card numbering pinned)
affects: [13-02, 13-03, 13-04, 13-05, 13-06, 13-07, 13-08]

actuals:
  tokens: 9400
  tasks: 3
  commits: 3
plan_head_before: 10a55d80af7e9be674d1ca329b63fde428909fdf
plan_head_after: 2aca1bcbedd9d3464531c352f8e42147faa1b634

tech-stack:
  added: []
  patterns:
    - "Content contract spec with in-file registries: each later plan appends its slugs instead of adding new spec files"
    - "Key-aware string walk (arrays inherit the parent key) to forbid the D-12 marker in plain-text fields"

key-files:
  created:
    - tests/data/campania-content.spec.ts
  modified:
    - content/trips/campania/days/martes-22.yml
    - content/trips/campania/monuments/monte-epomeo.yml
    - content/trips/campania/monuments/baia-di-sorgeto.yml
    - content/trips/campania/trip.yml
    - content/trips/campania/monuments/{spaccanapoli,marina-corricella,pozzo-vecchio,duomo-di-salerno,raito,valle-del-calore,castello-arechi,vesubio,rione-sanita}.yml (numeral line only)

key-decisions:
  - "Martes 22 has two bus transport rows (EAV to Fontana by day, to Panza at night), each with a taxi alternative; every timetable and price is marked **⚠ por confirmar**"
  - "The lunch is a disabled stop described as a rustic tavern «a elegir sobre el terreno»; the only named place is the Eremo di San Nicola (a hermitage, not an establishment)"
  - "Sorgeto night conditions (access, lighting, sea state, evening boats) are marked in the card's «De noche» section, facts, family box and the day note, so the guide never presents the night bath as safe for children"
  - "trip.yml infoCards: Bases, Llegada, Coche de alquiler, Conciertos, Salida. Ultimo's Friday 25 is not marked (D-22); PTN's date, both start times, the accommodation and the car return point are"

patterns-established:
  - "Registry growth: WRITTEN_DAYS / WRITTEN_MONUMENTS / FAMILY_REQUIRED / MARKER_FILES are extended by 13-02..13-06"
  - "ROMANS reserves the numerals of cards that do not exist yet, so no intermediate commit can duplicate a numeral"

requirements-completed: [CAMP-01, CAMP-02, CAMP-06]

coverage:
  - id: D1
    description: "Wave-0 content spec (marker, Roma leaks, eyebrows, transport glyphs, WR-01, written days/cards, personal data, trip.yml, numerals) with proven teeth"
    requirement: CAMP-06
    verification:
      - kind: unit
        ref: "node_modules/.bin/vitest run tests/data/campania-content.spec.ts"
        status: pass
      - kind: other
        ref: "mutation: marker appended to baia-di-sorgeto mapsQuery turns the spec red (exit 0 of the plan's mutation command)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Real martes 22 with Monte Epomeo and Baia di Sorgeto rendered in nuxi dev, heroes falling back to motif SVGs offline"
    requirement: CAMP-01
    verification:
      - kind: e2e
        ref: "playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts (37 passed)"
        status: pass
      - kind: unit
        ref: "node_modules/.bin/vitest run tests/data tests/unit (1173 passed)"
        status: pass
    human_judgment: true
    rationale: "Tone (D-09) and hero subjects (RESEARCH A6: checked by Commons title only) need a human eye in UAT"
  - id: D3
    description: "Publishable trip.yml (still draft with control mark)"
    requirement: CAMP-02
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#trip.yml (D-18, D-04, D-24); tests/data/build-isolation.spec.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "Final unique visit-order numerals for the 11 existing cards"
    requirement: CAMP-02
    verification:
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#numerales del mapa (D-10)"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts markerByRoman (37 passed)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 01: Tracer martes 22 + content contract Summary

**The real Tuesday 22 in Ischia (EAV bus, Epomeo by CAI 501, tavern lunch, Sorgeto at night) with two real Wikimedia-backed nature cards, a publishable draft trip.yml, final map numerals, and a Vitest content contract whose plain-field marker check is mutation-proven.**

## Performance

- **Duration:** about 8 min
- **Started:** 2026-11-22T00:09:14Z
- **Completed:** 2026-11-22T00:17:02Z
- **Tasks:** 3
- **Files modified:** 14 (1 created, 13 modified)

## Accomplishments

- `tests/data/campania-content.spec.ts`: 9 describe blocks, 25 tests. It checks that the full marker never appears in Roma, that every Campania marker is bold with no U+FE0F, that no marker sits in a plain key or in `stays[].area`/`note`, and that MARKER_FILES carry one. It also checks Roma-leak words and Spanish eyebrows, transport glyphs on written days, WR-01 on every transit day, written days and cards, the Sorgeto family box, phone and long-digit patterns, trip.yml, and the 24-card numerals.
- `martes-22`: `stay: ischia`, `route: { mode: transit }` with exactly 2 route cards, walk and bus stats, a `light` block (see, skip, care, rest), two `bus` transport rows, the Epomeo stop, a disabled tavern lunch stop, a siesta meta row, and the Sorgeto evening stop that points to the «Con niños» box.
- `monte-epomeo` (VIII) and `baia-di-sorgeto` (IX): RESEARCH hero URLs and coordinates, three prose sections each, facts, mapsQuery and family notes. Sorgeto's steps (250-300) and water taxi (5-6 €) are ranges with the marker, and «linterna» appears only in `family`.
- `trip.yml`: real heroMeta, «— DICHO POPULAR NAPOLITANO», 5 infoCards, 3 howTo paragraphs plus the unchanged control-mark paragraph, map {40.72, 14.55} zoom 9, a legend with nature and concerts, and a footer with the D-24 credit line. It also has the portada fields, `sections.gastronomia` and the four stays, with no `mapExtras` and `draft: true` kept.
- The numerals of the 11 existing cards are renumbered in one commit, one line per file.

## Task Commits

1. **Task 1: End-to-end martes 22 (tracer)** - `ba539c8` (feat)
2. **Task 2: trip.yml publishable (still draft)** - `2b8be0f` (feat)
3. **Task 3: Map numerals in visit order** - `2aca1bc` (feat)

## Verification

- `vitest run tests/data tests/unit`: 1173 passed after Task 3 (1150 before the plan).
- Mutation (marker appended to Sorgeto `mapsQuery`): the spec turns red, and the file is restored (verified by grep).
- `nuxi typecheck`: exit 0. `eslint tests/data/campania-content.spec.ts`: exit 0 after each task.
- `playwright -c playwright.trips.config.ts tests/trips/campania.spec.ts tests/trips/shape.spec.ts` on Node 22, after `rm -rf .data .nuxt`: 37 passed after Task 1 and again after Task 3. This includes the Sorgeto offline hero-to-motif fallback, `markerByRoman` and the Roma-leak trap on the rendered page.
- Frozen-path check (git log of 13-0x commits plus git status on roma, prueba, forma, app, shared, configs, scripts, parity and the gate files): empty.
- Tracer gate: `human_verify_mode` end-of-phase, automated-only verify, re-run green, so no checkpoint.

## Decisions Made

See `key-decisions` above. WR-01 is mitigated by content: martes-22 uses transit with exactly 2 stops, and the spec now fails any transit day with more than 2 route cards.

## Deviations from Plan

None. The plan was executed as written.

## Issues Encountered

None.

## Known Stubs

None in this plan's files. The other 9 skeleton cards and the skeleton days keep provisional prose by design; plans 13-03 to 13-06 rewrite them.

## User Setup Required

None.

## Next Phase Readiness

13-02 (Gastronomía) can start. Later plans extend the spec registries. `martes-22` keeps `order: 3` until 13-03 moves it to 4.

## Self-Check: PASSED

- FOUND: tests/data/campania-content.spec.ts, content/trips/campania/days/martes-22.yml, monuments/monte-epomeo.yml, monuments/baia-di-sorgeto.yml, trip.yml
- FOUND commits: ba539c8, 2b8be0f, 2aca1bc (ancestors of HEAD)
