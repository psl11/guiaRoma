---
phase: 13-contenido-campania-2027
plan: 08
subsystem: content
tags: [nuxt-content, publication, draft, vitest, playwright, campania, github-pages]

requires:
  - phase: 13-contenido-campania-2027
    provides: 13-01..13-07 ten real days, 24 cards, Gastronomía, Reservas and Práctica, campania-content.spec.ts
  - phase: 11-portada-y-rutas
    provides: scripts/tripManifest.mjs (absent `draft` = published → prerender route, no content exclude), portada sorted by startDate
provides:
  - Campania published: trip.yml has no `draft` key and no Phase 12 control mark
  - Static build prerenders /guiaRoma/trips/campania/ (index.html + _payload.json with real content); portada lists Campania first, Roma second
  - Published-state tests: build-isolation, tripManifest, dev portada, campania portada, content-spec «publicación (D-02)»
  - tests/README.md counts and prose for the published Campania (gate 110 / 13, test:trips 46 / 4)
affects: [phase-13-verification, deploy, milestone-v1.1]

actuals:
  tokens: 8425
  tasks: 2
  commits: 2
plan_head_before: c9ef8311914c2e2e177f6bcfe76ddca441544464
plan_head_after: 60beb3735ba761db8373f873e70ce0ff51209b67

tech-stack:
  added: []
  patterns:
    - "Publishing a trip = removing its `draft` key; the flip and every draft-dependent assertion land in one commit so no commit has a red data gate"
    - "A retired control-mark constant stays in the published-file scan as a harmless regression guard; draft isolation stays non-vacuous through the remaining drafts (prueba, forma)"

key-files:
  created: []
  modified:
    - content/trips/campania/trip.yml
    - tests/data/build-isolation.spec.ts
    - tests/unit/tripManifest.spec.ts
    - tests/trips/portada.spec.ts
    - tests/trips/campania.spec.ts
    - tests/data/campania-content.spec.ts
    - tests/README.md

key-decisions:
  - "Campania published at the Phase 13 close (D-02): `draft` key and the Phase 12 control-mark howTo paragraph removed; reversible by restoring one key, the GitHub Pages deploy is a separate act"
  - "CAMPANIA_SENTINEL kept in the build-isolation offenders scan as a regression guard instead of being dropped"

patterns-established:
  - "Dev portada e2e asserts card order explicitly (nth(0) Campania, nth(1) Roma) because sortTrips orders by startDate descending"

requirements-completed: [CAMP-01, CAMP-02, CAMP-03, CAMP-04, CAMP-05, CAMP-06]

coverage:
  - id: D1
    description: "Campania out of draft: no `draft` key, no CAMPANIA-CENTINELA-12A, manifest returns draft:false, prerender routes ['/', '/trips/campania/', '/trips/roma/'], only forma/prueba excluded"
    requirement: CAMP-01
    verification:
      - kind: unit
        ref: "tests/unit/tripManifest.spec.ts#manifiesto real (content/trips)"
        status: pass
      - kind: unit
        ref: "tests/data/build-isolation.spec.ts#campania publicada (D-02, Fase 13)"
        status: pass
      - kind: unit
        ref: "tests/data/campania-content.spec.ts#publicación (D-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Static build: trips/campania/index.html and _payload.json exist with «Baia di Sorgeto»; trip/monument dumps carry Campania; no control mark in any published file; trips/prueba and trips/forma absent"
    requirement: CAMP-02
    verification:
      - kind: integration
        ref: "pnpm verify → tests/data/build-isolation.spec.ts (760/760 data tests, 0 skipped)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Portada lists Campania first and Roma second (dev e2e); published parity portada spec green with no edit"
    requirement: CAMP-01
    verification:
      - kind: e2e
        ref: "tests/trips/portada.spec.ts#portada (dev): lista solo los viajes publicados, Campania y Roma"
        status: pass
      - kind: e2e
        ref: "tests/trips/campania.spec.ts#campania: la portada de dev lista Campania, ya publicada (D-02)"
        status: pass
      - kind: automated_ui
        ref: "tests/parity/portada.spec.ts (read-only, inside pnpm verify, 110/110)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Roma unchanged: parity 110/110 in 13 files, 56 goldens untouched, no frozen path changed in any Phase 13 commit"
    verification:
      - kind: automated_ui
        ref: "pnpm verify (test:parity 110 passed) + frozen-path/golden-count check"
        status: pass
    human_judgment: false
  - id: D5
    description: "Tone, hero subjects and the «⚠ por confirmar» recheck before the trip"
    requirement: CAMP-06
    verification: []
    human_judgment: true
    rationale: "13-VALIDATION.md manual-only items: editorial tone, Wikimedia hero subjects verified by title only, and 2027 timetables not yet published"

duration: 6min
completed: 2026-11-22
status: complete
---

# Phase 13 Plan 08: Publicación de Campania Summary

**Campania is now published. Its trip.yml no longer has a `draft` key or the Phase 12 control mark. The static build prerenders `/guiaRoma/trips/campania/`, and both its `index.html` and its `_payload.json` contain «Baia di Sorgeto». The portada lists Campania first and Roma second. Roma's parity gate stays at 110/110 in 13 files, with the 56 goldens untouched.**

## Performance

- **Duration:** about 6 min (wall clock)
- **Started:** 2026-11-22T01:10:09Z
- **Completed:** 2026-11-22T01:16:12Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- **Publication commit (`ba9cd15`):** this one commit removes `draft: true`, the control-mark howTo paragraph and the draft comment from `trip.yml`. The same commit updates every test that depended on the draft state:
  - `build-isolation.spec.ts`:
    - The always-on check now requires that the control mark and `draft: true` are absent.
    - New build tests: `trips/campania/index.html` and `_payload.json` exist and contain «Baia di Sorgeto».
    - The positive control now also expects `trips/campania/` in the trip dump and «Baia di Sorgeto» in the monument dump.
    - The offenders scan still includes all three constants. The prueba/forma checks and the D-17 HTML scan are unchanged.
  - `tripManifest.spec.ts`: campania now has `draft: false`. The routes are `['/', '/trips/campania/', '/trips/roma/']` and only forma and prueba are excluded.
  - Dev `portada.spec.ts`: expects 2 cards, Campania then Roma.
  - `campania.spec.ts`:
    - The portada test is inverted: Campania appears exactly once, as the first card.
    - The header JSDoc now describes the published guide and the Wikimedia aborts.
  - `campania-content.spec.ts`: new describe «publicación (D-02)».
- **Full gate from clean caches** (`pnpm verify`, Node 22):

  | Step | Result |
  |------|--------|
  | generate | 17 routes prerendered, including `/guiaRoma/trips/campania/` |
  | test:unit | 567/567 |
  | test:data | 760/760, 0 skipped (the build-isolation post-build blocks ran) |
  | test:parity | 110 passed, no flakes, no snapshot written |

  `pnpm typecheck` and `pnpm lint` are clean.
- **`pnpm test:trips`** ran after verify finished, with `.data` and `.nuxt` removed first: 46/46 passed. No dev server was left running.
- **Counts re-measured with `--list`:**
  - Gate: `Total: 110 tests in 13 files` (112 / 13 raw).
  - Trips: `Total: 46 tests in 4 files`.
- **Other checks:**
  - Frozen-path check passes, and there are 56 golden PNGs.
  - `.output/public/trips/prueba` and `.output/public/trips/forma` are absent.
  - `.nojekyll` is present.
- **`tests/README.md` (`60beb37`):**
  - §4: still 110 / 13, re-measured at the Phase 13 close.
  - §5.1: 46 tests in 4 files, with `campania.spec.ts` at 26 and the portada at 2. Campania is no longer listed as a draft.
  - §5.3: describes `campania-content.spec.ts`.
  - §5.5: the build checks are now positive, and the control-mark constant is kept as a regression guard.
  - §5.8: the skeleton is now the real guide.
  - §5.9: the Phase 13 note is closed.

## Task Commits

1. **Task 1: The publication commit (trip.yml out of draft, control mark removed, every dependent test inverted)**: `ba9cd15` (feat)
2. **Task 2: Full gate, trips E2E, frozen paths, counts in tests/README.md**: `60beb37` (docs)

## Files Created/Modified

- `content/trips/campania/trip.yml`: published (no `draft`, no control mark, header comment updated)
- `tests/data/build-isolation.spec.ts`: published-Campania checks; prueba/forma isolation unchanged
- `tests/unit/tripManifest.spec.ts`: real manifest with campania published
- `tests/trips/portada.spec.ts`: dev portada with 2 cards, Campania first
- `tests/trips/campania.spec.ts`: portada test inverted, header prose for the published guide
- `tests/data/campania-content.spec.ts`: «publicación (D-02)» describe
- `tests/README.md`: counts and prose for the published Campania

## D-08: WR-01 e IN-04 mitigados por contenido

- WR-01 (transit with waypoints) and IN-04 (plane days) both stay **open** in `.planning/phases/12-formas-nuevas-de-viaje/12-REVIEW-DISPOSITION.md`. The code fix stays deferred.
- They are mitigated by content:
  - No Campania day uses `route.mode: transit` with more than 2 stops. Martes-22 is the only transit day, with exactly 2 stops (Monte Epomeo and Baia di Sorgeto), and `campania-content.spec.ts` enforces this.
  - `sabado-19`, `domingo-27` and `lunes-28` (the plane days and the farewell day) set `route.enabled: false`.
  - The ferry days (`domingo-20`, `lunes-21`, `miercoles-23`) hide the route automatically.
  - The driving days are `jueves-24`, `viernes-25` and `sabado-26`.

## «⚠ por confirmar»: recheck in spring 2027

The guide carries 172 markers. Groups to recheck before the trip:

- **Ferries:** 2027 summer timetables and piers for Naples → Procida, Procida → Ischia and Ischia → Naples (Caremar and others).
- **Concerts:** Ultimo on Friday 25 (start time, gates; the official calendar once said Thursday 24) and Pinguini Tattici Nucleari on Sunday 27 (single source).
- **Island bans:** the 2027 rules for non-resident cars on Procida and Ischia.
- **ZTL:** the restricted zones in Naples and Salerno, and where the car sleeps on the night of the 25th (garage or car park).
- **Cuma:** opening days and hours of the archaeological park and the Antro della Sibilla.
- **Napoli Sotterranea:** tour times and booking.
- **Accommodation:** every base, including whether Naples 25-27 is the same base as the first night.
- **Car return:** company, return point and time on Saturday 26 at Capodichino. Pickup is Wednesday 23 at 16:00.
- Flights: airline and booking details.

## Manual UAT items (13-VALIDATION.md)

- Read Campania in `pnpm dev` and on a phone to judge the tone, accuracy and usefulness of the prose on the ground (CAMP-01..05).
- Scroll the cards in light and dark themes to check that each Wikimedia hero shows the right subject (CAMP-02; research verified the files by title only).
- Confirm the «⚠ por confirmar» items in spring 2027 (CAMP-06).

## Decisions Made

- Publication applied exactly as D-02 rates it: reversible by restoring one key. Deploying to GitHub Pages is a separate act and is not part of this plan.
- `CAMPANIA_SENTINEL` stays in the offenders scan as a regression guard, so the control mark can never come back into a published file.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Stale prose] One comment in `campania.spec.ts` still mentioned `example.invalid` heroes**
- **Found during:** Task 1
- **Issue:** The comment above `expectHeroFallsBackToMotif` still described the Phase 12 `example.invalid` heroes. The Research test-impact matrix asks for the header and comments to be updated.
- **Fix:** The comment now refers to external (Wikimedia) heroes. It is a comment only, with no behaviour change.
- **Files modified:** tests/trips/campania.spec.ts
- **Committed in:** ba9cd15

---

**Total deviations:** 1 auto-fixed (a comment only).
**Impact on plan:** None. No scope creep.

## Issues Encountered

None. Parity passed on the first run, and neither known flake (navigation scrollspy mobile, legacy-redirect /#pantheon desktop) showed up.

## User Setup Required

None. No external service configuration is required. Deploying the published build to GitHub Pages is a separate, user-initiated step.

## Next Phase Readiness

- Phase 13 is complete. All eight plans have summaries, and CAMP-01..06 are delivered on the published build.
- Ready for `/gsd-verify-work 13` (manual UAT: tone, heroes) and then the deploy decision.

---
*Phase: 13-contenido-campania-2027*
*Completed: 2026-11-22*

## Self-Check: PASSED

- All 7 modified files exist; commits `ba9cd15` and `60beb37` are ancestors of HEAD.
- Acceptance criteria re-run:
  - control-mark count 0, `^draft:` count 0
  - manifest `"draft":false`
  - `'/trips/campania/'` in tripManifest.spec
  - `toHaveCount(2)` in portada.spec
  - `trips', 'campania', 'index.html'` in build-isolation
  - «no lista el borrador» count 0
  - the flip commit touches all 3 key files
  - campania index.html present, payload contains «Baia di Sorgeto», `trips/prueba` absent
  - README contains «46 tests en 4 ficheros» and `campania-content.spec.ts`
  - this SUMMARY records WR-01
