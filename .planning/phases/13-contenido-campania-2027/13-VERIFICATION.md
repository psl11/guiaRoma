---
phase: 13-contenido-campania-2027
verified: 2026-11-22T02:30:00Z
status: human_needed
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
covered_digest: "v4:sha256:88645a52fa7a739d85d76593b7c50e8f64f58f92c2917cb4b6b01f226f2e6a78"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Read Campania in `pnpm dev` and on a phone (375 px, light and dark) and judge tone, accuracy and usefulness of the prose on the ground"
    expected: "Slow, authentic, second-person-plural tone as in Roma; no text overflow at 375 px in either theme; the A/B and 1/2 alternatives read clearly stacked"
    why_human: "Editorial judgement and real-browser look cannot be established by grep or vitest"
  - test: "Scroll the 24 cards and check that each Wikimedia hero shows the right place"
    expected: "Every hero matches its card (Sorgeto, Epomeo, Corricella, Cuma, Vomero, ...); with the network off, the motif SVG replaces the photo"
    why_human: "All 24 hero URLs return HTTP 200 (checked), but the subject was verified by file title only; whether the picture is the right place is visual"
  - test: "Confirm the «⚠ por confirmar» items in spring 2027 (ferry timetables and piers, island car rules, concert start times and gates, PTN date, Sorgeto at night with children, accommodation, car-return point)"
    expected: "Each marked value replaced with a confirmed one, or left marked"
    why_human: "Depends on 2027 timetables that do not exist yet (today is 2026-11-22)"
---

# Phase 13: Contenido Campania 2027 Verification Report

**Phase Goal:** La familia puede usar la guía de Campania 2027 sobre el terreno: diez días con su logística, una ficha por lugar, dónde comer, qué reservar y cómo moverse, con los datos dudosos señalados
**Verified:** 2026-11-22
**Status:** human_needed
**Re-verification:** No, initial verification

All five roadmap success criteria are met in the code, the content and the build output. Nothing failed. The status is `human_needed` only because the phase's own validation file lists three editorial or field-dependent checks that no automated check can settle.

## Goal Achievement

### Observable Truths

| # | Truth (ROADMAP success criterion) | Status | Evidence |
|---|-----------------------------------|--------|----------|
| 1 | Campania shows the 10 days (Sat 19 to Mon 28 June 2027) with timeline, times and logistics (flights, Alibus, ferries, hire car, Ultimo and PTN), including the Thursday 24 and Saturday 26 alternatives | ✓ VERIFIED | `content/trips/campania/days/` has 10 files; parsed `order` is contiguous 1..10 (`sabado-19`..`lunes-28`), each with 2-10 timeline rows. `jueves-24` and `sabado-26` carry `choice` blocks; built HTML contains «Opción A/B» and «Opción 1/2». `.output/public/trips/campania/index.html` has all ten day ids. Alibus (19 hits), Caremar (9), Ultimo (9), Pinguini (6) and Capodichino (27) appear in the built page. Stay bases follow D-04, `viernes-25`, `sabado-26` and `jueves-24` use `route.mode: driving`, and the plane days use `route.enabled: false`. |
| 2 | Each relevant place has a card with image, Italian name, prose and Google Maps link, and its map marker | ✓ VERIFIED | 24 files in `monuments/`. A script over the parsed YAML found no missing `name`, `italian`, `coords`, `mapsQuery`, `motif`, `roman`, `hero.src` or `sections`; prose is 529-1456 characters per card. All 24 hero URLs on `upload.wikimedia.org` returned HTTP 200 on a live check. All 24 slugs and all 9 food slugs exist as `id=` in the built page, with 36 `google.com/maps` links. Places covered: Naples, Procida, Ischia, Salerno, Cilento (Raito, Trentova, Calore), Vesuvius, Casertavecchia, Campi Flegrei (Averno, Cuma, Miseno). Markers are client-side from the same `coords`; the data gate enforces them. |
| 3 | Gastronomía, Reservas and Práctica are complete for Campania | ✓ VERIFIED | Gastronomía has 9 food cards in 5 ordered groups (neighbourhood pizzerias, mozzarella di bufala, island kitchens, Salerno taverns, Cilento trattoria), and the spec limits named places to a verified allowlist. `reference/reservas.yml` has its own three headings, both flights, the Ultimo tickets and a 14-row table covering 5 lodgings, 3 ferries, the car, both concerts, Napoli Sotterranea, Cuma and Il Focolare. `reference/practica.yml` has sections on ferries, driving/ZTL/island bans, heat, footwear, children, concerts, airport transfer and readings. `#gastronomia`, `#reservas` and `#practica` exist in the built HTML. |
| 4 | Critical field data is verified or visibly marked «por confirmar» | ✓ VERIFIED | 172 `**⚠ por confirmar**` markers in Campania content, 171 rendered in the built page. They cover ferry times and piers, island car rules, Sorgeto at night (card «De noche», facts, family box and day note), concert start times and gates, the PTN date, accommodation and the car return point. The Ultimo date (Fri 25) is deliberately unmarked per D-22 (the user's tickets). `campania-content.spec.ts` enforces the marker per file, the 15+ minimum, and its absence from plain-text fields. |
| 5 | Campania is on the portada and opens at `/guiaRoma/trips/campania/` per ROUTE-05; content validates in `pnpm verify`; the Roma gate stays green | ✓ VERIFIED | `trip.yml` has no `draft` key and no sentinel. `.output/public/trips/campania/{index.html,_payload.json}` exist (186 KB and 264 KB) and the portada `index.html` links `/trips/campania` and `/trips/roma`. `prueba` and `forma` are absent from the portada. I re-ran `vitest run tests/data tests/unit` on Node 22: 31 files, 1327 tests passed (567 unit + 760 data, matching the claimed counts). The `pnpm verify` run (parity 110/110, `test:trips` 46/46) is taken from the plan 13-08 evidence and was not re-run here. |

**Score:** 5/5 truths verified (0 behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `content/trips/campania/days/*.yml` | 10 days | ✓ VERIFIED | 10 files, orders 1..10, slugs match D-03 |
| `content/trips/campania/monuments/*.yml` | 24 cards | ✓ VERIFIED | all fields present, no stubs, no placeholder text |
| `content/trips/campania/food/*.yml` | 9 food cards in 5 groups | ✓ VERIFIED | `g-1`..`g-5` prefixes give the group order |
| `content/trips/campania/reference/reservas.yml`, `practica.yml` | Reservas and Práctica | ✓ VERIFIED | substantive and rendered |
| `content/trips/campania/trip.yml` | publishable, no sentinel | ✓ VERIFIED | portada fields (`startDate`, `endDate`, `destinations`, `summary`), infoCards, howTo, footer with the photo credit line |
| `tests/data/campania-content.spec.ts` | content contract | ✓ VERIFIED | passes with the build-isolation spec (164 tests) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `day.cards` and `stop.ref` | monument slugs | data gate (`tests/data/trips.ts`) | WIRED | no rule failures across 760 data tests; every card appears in the built page |
| Reservas rows `ref` | monument and food slugs | gate rule and e2e | WIRED | `stadio-maradona`, `napoli-sotterranea`, `antro-della-sibilla` and `g-3-il-focolare` resolve |
| `trip.yml` (no `draft`) | prerender routes and portada | `scripts/tripManifest.mjs` | WIRED | `/trips/campania/` is prerendered; the portada lists it |

### Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Real data | Status |
|----------|---------------|--------|-----------|--------|
| `/trips/campania/` page | days, monuments, food, reference | Nuxt Content YAML, prerendered | Yes: 184 KB HTML and a 264 KB payload with real prose | ✓ FLOWING |
| Portada card | trip manifest | `trip.yml` | Yes: `startDate`, destinations, summary | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Content contract and publication isolation | `vitest run tests/data/campania-content.spec.ts tests/data/build-isolation.spec.ts` (Node 22) | 164 passed | ✓ PASS |
| Unit and data gates | `vitest run tests/data tests/unit` (Node 22) | 1327 passed, 31 files | ✓ PASS |
| Hero images exist | HTTP HEAD on 24 `hero.src` URLs | 24 × 200 | ✓ PASS |
| Built page contains real content | grep of `.output/public/trips/campania/index.html` | all 10 days, 24 cards, 9 food, 3 sections, 171 markers, no sentinel, no Roma leaks | ✓ PASS |
| Scope control (D-19) | `git diff 10a55d8..HEAD` over `app/`, `shared/`, `nuxt.config.ts`, `tests/parity/`, `app/assets/css/`, `content/trips/{roma,prueba,forma}` | empty | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED. No `probe-*.sh` is declared by the plans or present in `scripts/`.

### Requirements Coverage

Every ID in the PLAN frontmatter was cross-referenced against `.planning/REQUIREMENTS.md`. No requirement is mapped to Phase 13 without a plan claiming it.

| Requirement | Source plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| CAMP-01 | 13-01, 03, 04, 05, 06, 08 | 10 days with timeline, times and logistics, slow tone | ✓ SATISFIED (tone: human) | truth 1 |
| CAMP-02 | 13-01, 03, 04, 05, 06, 08 | card per place with image, Italian name, prose and Maps link | ✓ SATISFIED (photo subject: human) | truth 2 |
| CAMP-03 | 13-02, 13-08 | gastronomy section | ✓ SATISFIED | truth 3 |
| CAMP-04 | 13-07, 13-08 | Reservas: lodging per base, ferries, car, concerts, flights | ✓ SATISFIED | truth 3 |
| CAMP-05 | 13-07, 13-08 | Práctica: ferries, driving/ZTL, island restrictions, heat, footwear, children | ✓ SATISFIED | truth 3 |
| CAMP-06 | 13-01..08 | critical field data verified or «por confirmar» | ✓ SATISFIED (confirmation itself: spring 2027) | truth 4 |

Orphaned requirements: none. REQUIREMENTS.md marks CAMP-01..06 Complete.

Bookkeeping note: the 13-06 and 13-07 SUMMARYs list `requirements-completed: []`. This is deliberate (the shared-ID gate defers to 13-08, which lists all six) and has no effect on the outcome.

### Anti-Patterns Found

None. `grep -w 'TBD|FIXME|XXX|TODO|HACK'` over the Campania content and the specs changed in this phase returns no markers. There are no stubs, placeholder strings or Roma leaks (no «Via Roma», «giugno» or Roman landmarks in the content or the built page). The sentinel `CAMPANIA-CENTINELA-12A` is absent from `.output`.

### Observations (non-blocking)

- `.output/public` contains `__nuxt_content/*/sql_dump.txt` and `sqlite3` WASM files. These are generic Nuxt Content artifacts, not Phase 13 content. Whether a guide downloads them is Phase 14 SC3, outside this phase.
- `monuments/baia-di-sorgeto.yml` writes «Isquia» once, a valid Spanish form, while the rest of the guide uses «Ischia». Editorial only, for the tone read-through.
- `content/trips/roma/food/g-bar-musa.yml` contains «por confirmar» (two matches). It was not touched in this phase. If a «never in Roma» check is wanted, confirm its case and intent. This does not affect Campania.

### Human Verification Required

#### 1. Tone, accuracy and mobile look

**Test:** Read all of Campania in `pnpm dev` and on a phone, in light and dark, at 375 px.
**Expected:** The tone is slow, authentic and in the second person plural. Nothing overflows. The stacked alternatives on 24 and 26 read clearly.
**Why human:** Editorial judgement and the real-browser rendering.

#### 2. Photo subjects

**Test:** Scroll all 24 cards and check each Wikimedia hero.
**Expected:** Each photo shows the right place. With the network off, each falls back to its motif SVG.
**Why human:** Research verified subjects by file title only. The URLs all resolve (200), but a visual check is still needed.

#### 3. Field data to confirm in spring 2027

**Test:** Revisit the «⚠ por confirmar» items (ferries and piers, island car rules, concert times, PTN date, Sorgeto at night with children, accommodation, car-return point).
**Expected:** Each is confirmed or left visibly marked.
**Why human:** The 2027 information does not exist yet.

### Gaps Summary

No gaps. The phase goal is achieved in the codebase, content and build output. The remaining items are the manual UAT already listed in `13-VALIDATION.md`. Phase 14 owns the real-device sign-off.

---

_Verified: 2026-11-22_
_Verifier: Claude (gsd-verifier)_
