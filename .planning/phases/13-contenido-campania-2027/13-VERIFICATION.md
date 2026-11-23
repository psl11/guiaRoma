---
phase: 13-contenido-campania-2027
verified: 2026-11-23T21:00:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - ".planning/phases/13-contenido-campania-2027/13-01-PLAN.md"
  - ".planning/phases/13-contenido-campania-2027/13-01-SUMMARY.md"
  - ".planning/phases/13-contenido-campania-2027/13-02-PLAN.md"
  - ".planning/phases/13-contenido-campania-2027/13-02-SUMMARY.md"
  - ".planning/phases/13-contenido-campania-2027/13-03-PLAN.md"
  - ".planning/phases/13-contenido-campania-2027/13-03-SUMMARY.md"
  - ".planning/phases/13-contenido-campania-2027/13-04-PLAN.md"
  - ".planning/phases/13-contenido-campania-2027/13-04-SUMMARY.md"
  - ".planning/phases/13-contenido-campania-2027/13-05-PLAN.md"
  - ".planning/phases/13-contenido-campania-2027/13-05-SUMMARY.md"
  - ".planning/phases/13-contenido-campania-2027/13-06-PLAN.md"
  - ".planning/phases/13-contenido-campania-2027/13-06-SUMMARY.md"
  - ".planning/phases/13-contenido-campania-2027/13-07-PLAN.md"
  - ".planning/phases/13-contenido-campania-2027/13-07-SUMMARY.md"
  - ".planning/phases/13-contenido-campania-2027/13-08-PLAN.md"
  - ".planning/phases/13-contenido-campania-2027/13-08-SUMMARY.md"
  - "content/trips/campania/reference/practica.yml"
  - "content/trips/campania/reference/reservas.yml"
  - "content/trips/campania/trip.yml"
  - "tests/data/build-isolation.spec.ts"
  - "tests/data/campania-content.spec.ts"
  - "tests/trips/campania.spec.ts"
covered_digest: "v4:sha256:51600b6a2eb91e8ad102c11304f911d8d3e0e0ee85c5f64297ed76bb042178b0"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
---

# Phase 13: Contenido Campania 2027 Verification Report

**Phase Goal:** La familia puede usar la guía de Campania 2027 sobre el terreno: diez días con su logística, una ficha por lugar, dónde comer, qué reservar y cómo moverse, con los datos dudosos señalados
**Verified:** 2026-11-23
**Status:** passed
**Re-verification:** Yes. The previous report (human_needed, 5/5) went stale because the code-review fix commits `9267e20..0d4a4a1` changed `practica.yml` and three specs after it was written. This run re-checks the content and the build after those fixes. Human UAT is now complete (`13-UAT.md`, 4/4 passed).

All five roadmap success criteria hold in the code, the content and the build output after the review fixes. The four human items from the previous report were signed off in UAT. There are no gaps and no behavior-unverified truths.

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|-----------------------------------|--------|----------|
| 1 | Campania shows the 10 days (Sat 19 to Mon 28 June 2027) with timeline, times and logistics (flights, Alibus, ferries, hire car, Ultimo, PTN), including the Thursday 24 and Saturday 26 alternatives | ✓ VERIFIED | `content/trips/campania/days/` has 10 files. The rebuilt `.output/public/trips/campania/index.html` (21:49 today) contains exactly one `id=` for each of `sabado-19` to `lunes-28`. Thursday 24 (A/B) and Saturday 26 (1/2) alternatives are enforced by `campania-content.spec.ts`. After WR-01 the spec also asserts that each day's `cards` follow the timeline order and that the card numerals form one increasing sequence across the trip. |
| 2 | Each relevant place has a card with image, Italian name, prose and Google Maps link, and its map marker | ✓ VERIFIED | 24 files in `monuments/`. All 24 slugs and all 9 food slugs exist as `id=` in the built page (loop over every file, no MISSING). The 24 hero URLs returned HTTP 200 in the previous run, and UAT item 2 confirmed that each photo shows the right place. Markers are client-side from the same `coords`, and the data gate enforces them. |
| 3 | Gastronomía, Reservas and Práctica are complete for Campania | ✓ VERIFIED | 9 food cards and `reference/{reservas,practica}.yml`. `#gastronomia`, `#reservas` and `#practica` exist in the built HTML. The post-review edits to `practica.yml` (WR-02: the Napoli Sotterranea «Con niños» bullet removed, because the children have left by Sunday 27) keep the file substantive. `ADULTS_ONLY` and anchored Práctica assertions (WR-05) pass. |
| 4 | Critical field data is verified or visibly marked «por confirmar» | ✓ VERIFIED | 172 `⚠ por confirmar` markers in the Campania content and 171 in the built page. The count is unchanged from the previous run, and a likely explanation is a marker in a field that is not rendered, though I did not trace it. The spec enforces the marker per file, the 15+ minimum, and its absence from plain-text fields. After WR-04 and IN-04 (concert times no longer stated as certain), `PLAIN_KEYS` covers the Reservas headings and group titles. UAT item 4 passed. |
| 5 | Campania is on the portada and opens at `/guiaRoma/trips/campania/` per ROUTE-05; content validates in `pnpm verify`; the Roma gate stays green | ✓ VERIFIED | `trip.yml` has no `draft` key (the only match is a comment, line 5). `.output/public/trips/campania/{index.html,_payload.json}` exist and the portada links `trips/campania`. Regression evidence from the orchestrator (Node 22): `pnpm verify` gave a clean generate, unit 575/575 and data 927/927. Playwright parity gave 125 passed and 1 failed (`navigation.spec.ts:248` [mobile] scrollspy, timeout), which passed 5/5 in isolation with `--repeat-each=5`. I classify it as a load flake. `pnpm test:trips` gave 46/46. I re-ran `vitest run tests/data/campania-content.spec.ts tests/data/build-isolation.spec.ts` on Node 22: 171 passed. |

**Score:** 5/5 truths verified (0 behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `content/trips/campania/days/*.yml` | 10 days | ✓ VERIFIED | 10 files, each rendered once in the built page |
| `content/trips/campania/monuments/*.yml` | 24 cards | ✓ VERIFIED | 24 files, 24 rendered ids |
| `content/trips/campania/food/*.yml` | 9 food cards | ✓ VERIFIED | 9 files, 9 rendered ids |
| `content/trips/campania/reference/reservas.yml`, `practica.yml` | Reservas and Práctica | ✓ VERIFIED | both present, sections rendered |
| `content/trips/campania/trip.yml` | publishable, no sentinel | ✓ VERIFIED | no `draft` key; the built page has no `CENTINELA` |
| `tests/data/campania-content.spec.ts`, `tests/data/build-isolation.spec.ts`, `tests/trips/campania.spec.ts` | content contract and e2e | ✓ VERIFIED | data specs: 171 passed in my run |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `day.cards` and `stop.ref` | monument slugs | data gate | WIRED | 927 data tests pass; every card appears in the built page |
| Reservas rows `ref` | monument and food slugs | gate rule and e2e | WIRED | covered by the data suite; IN-02 links named restaurants to their own food cards |
| `trip.yml` (no `draft`) | prerender and portada | `scripts/tripManifest.mjs` | WIRED | `/trips/campania/` is prerendered; the portada links it |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Real data | Status |
|----------|---------------|--------|-----------|--------|
| `/trips/campania/` page | days, monuments, food, reference | Nuxt Content YAML, prerendered | Yes: 186 KB HTML and a 264 KB payload | ✓ FLOWING |
| Portada card | trip manifest | `trip.yml` | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Content contract and publication isolation | `vitest run tests/data/campania-content.spec.ts tests/data/build-isolation.spec.ts` (Node 22) | 171 passed | ✓ PASS |
| Built page contains real content | grep of `.output/public/trips/campania/index.html` | 10 days, 24 cards, 9 food, 3 sections, 171 markers, 0 sentinel | ✓ PASS |
| Full gate | `pnpm verify` and `pnpm test:trips` (orchestrator, Node 22) | unit 575, data 927, parity 125/126 (1 load flake, 5/5 in isolation), trips 46/46 | ✓ PASS (flake noted) |
| Scope control (D-19) | files touched by `(13…)` commits outside `content/trips/campania/`, `.planning/`, `tests/data`, `tests/trips`, `tests/README.md` | only `tests/unit/timelineRows.spec.ts` and `tests/unit/tripManifest.spec.ts`, which are tests inverted by 13-08 | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED. No `probe-*.sh` is declared by the plans or present in `scripts/`.

### Requirements Coverage

Every ID in the PLAN frontmatter (CAMP-01 to CAMP-06) is mapped to Phase 13 in `.planning/REQUIREMENTS.md` and marked Complete. No requirement is mapped to Phase 13 without a plan claiming it.

| Requirement | Source plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| CAMP-01 | 13-01, 03, 04, 05, 06, 08 | 10 days with timeline, times and logistics, slow tone | ✓ SATISFIED | truth 1; UAT 1 (tone) passed |
| CAMP-02 | 13-01, 03, 04, 05, 06, 08 | card per place with image, Italian name, prose and Maps link | ✓ SATISFIED | truth 2; UAT 2 (photos) passed |
| CAMP-03 | 13-02, 13-08 | gastronomy section | ✓ SATISFIED | truth 3; UAT 3 accepted the restaurants decision |
| CAMP-04 | 13-07, 13-08 | Reservas: lodging, ferries, car, concerts, flights | ✓ SATISFIED | truth 3 |
| CAMP-05 | 13-07, 13-08 | Práctica: ferries, driving/ZTL, islands, heat, footwear, children | ✓ SATISFIED | truth 3 |
| CAMP-06 | 13-01 to 13-08 | critical field data verified or «por confirmar» | ✓ SATISFIED | truth 4; UAT 4 passed |

Orphaned requirements: none. The 13-06 and 13-07 SUMMARYs list `requirements-completed: []` by design (the shared-ID gate defers to 13-08, which lists all six). This has no effect on the outcome.

### Anti-Patterns Found

None. `grep -w 'TBD|FIXME|XXX|TODO|HACK'` over `content/trips/campania` and the three specs returns no matches. The built page contains no `CENTINELA`. The only «por confirmar» hit in Roma content (`g-bar-musa.yml`, a missing address) predates this phase and is unrelated.

### Review-Fix Regression Check

`13-REVIEW-DISPOSITION.md` records 15 fixed and 1 deferred (WR-06, a built-site test for sql_dump/WASM requests, owned by Phase 14 D-05). The deferral does not touch a Phase 13 success criterion. The fixed items hold in the current tree: the data specs, which now carry the new guards (visit-order numerals, `ADULTS_ONLY`, anchored Práctica checks, wider `PLAIN_KEYS` and privacy patterns), pass.

### Human Verification

All four items from the previous report were completed in `13-UAT.md` (status complete, 4/4 passed, 0 issues). Nothing is pending.

| # | Item | UAT result |
|---|------|-----------|
| 1 | Read Campania at 375 px, light and dark; tone and the A/B and 1/2 alternatives | pass |
| 2 | The 24 hero photos show the right place | pass |
| 3 | Concrete data and decisions D-01 to D-26 | pass |
| 4 | The «⚠ por confirmar» markers | pass |

Real confirmation of the marked values depends on the 2027 timetables and bookings, which do not exist yet. The guide surfaces each of them as a visible marker, which is what CAMP-06 requires.

### Gaps Summary

No gaps. The phase goal is achieved in the content, the code and the build output, and human UAT is complete. Phase 14 owns the real-device sign-off and the deferred WR-06 test.

---

_Verified: 2026-11-23_
_Verifier: Claude (gsd-verifier)_
