---
phase: "13"
slug: "contenido-campania-2027"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-22"
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `13-RESEARCH.md` §«Validation Architecture», updated after the Phase 12.1 insert (Reservas `headings`).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (`tests/unit`, `tests/data`) + Playwright 1.61.0 (`playwright.gate.config.ts` parity; `playwright.trips.config.ts` on `nuxi dev`, port 5300) |
| **Config file** | `vitest.config.ts`, `playwright.gate.config.ts`, `playwright.trips.config.ts` |
| **Quick run command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm test:unit && pnpm test:data` |
| **Trips (dev E2E)** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && rm -rf .data .nuxt && pnpm test:trips`. Never run it at the same time as generate or verify. |
| **Full suite command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm verify` (it runs `rm -rf .data .nuxt .output`, generate, unit, data and parity, which must be **110/110**), then `pnpm typecheck && pnpm lint` |
| **Frozen-files check** | `git diff --exit-code <PHASE13_BASE> -- content/trips/roma content/trips/prueba content/trips/forma app shared nuxt.config.ts content.config.ts tests/parity app/assets/css`. PHASE13_BASE is HEAD when Phase 13 execution starts, after Phase 12.1 has closed. |
| **Estimated runtime** | quick < 15 s; trips ~ 1–2 min; full ~ 6–9 min |

---

## Sampling Rate

- **After every task commit:** quick run.
- **After every plan wave:** quick run, then `rm -rf .data .nuxt && pnpm test:trips` (run them one after the other), then the frozen-files check.
- **Publication plan / before `/gsd-verify-work`:** `pnpm verify` (110/110), `pnpm typecheck && pnpm lint`, `test:trips`, and the counts re-registered in `tests/README.md`.
- **Max feedback latency:** 15 seconds (quick run).

---

## Per-Requirement Verification Map

| Req / Decision | Behavior | Test Type | Automated Command | File Exists | Status |
|----------------|----------|-----------|-------------------|-------------|--------|
| CAMP-01 | Days content | data | `pnpm exec vitest run tests/data/campania-content.spec.ts` | ❌ W0 | ⬜ pending |
| CAMP-01 | Days render in order, with pills; choices stack; «Dormís en» lines; transport bands; Thursday 24 route is driving | e2e dev | `pnpm test:trips` (`campania.spec.ts`, updated) | ✅ to update | ⬜ pending |
| CAMP-01 | Data gate green for all 10 days, including refs inside options and `stay-ref` | data | `pnpm test:data` | ✅ | ⬜ pending |
| CAMP-02 | Monument cards | data | `tests/data/campania-content.spec.ts` | ❌ W0 | ⬜ pending |
| CAMP-02 | Markers = monuments; nature markers teal; the motif replaces a hero that fails; the map frames all cities | e2e dev | `pnpm test:trips` | ✅ | ⬜ pending |
| CAMP-03 | At least 1 food card per planned group; `badgeKind` in the enum; the `#gastronomia` section exists | data + e2e | `campania-content.spec.ts`; `pnpm test:trips` | ❌ W0 / ✅ | ⬜ pending |
| CAMP-04 | Reservas file | data | `campania-content.spec.ts` | ❌ W0 | ⬜ pending |
| CAMP-04 | Campania's `#reservas` shows its own headings and never «3 comensales»; an empty group is not rendered | e2e dev | `pnpm test:trips` (`campania.spec.ts`) | ✅ to update | ⬜ pending |
| CAMP-05 | `practica.yml` section headings cover ferries, driving/ZTL/islands, heat, footwear, children and concerts | data | `campania-content.spec.ts` | ❌ W0 | ⬜ pending |
| CAMP-06 | «Por confirmar» markers | data | `campania-content.spec.ts` | ❌ W0 | ⬜ pending |
| D-22 | The Ultimo concert is on Friday 25 (`viernes-25`). The day carries no «⚠ por confirmar» on the date; only the time/gates may have one | data | `campania-content.spec.ts` | ❌ W0 | ⬜ pending |
| ROUTE-05 / D-02 | Manifest has campania `draft:false`; prerender routes include `/trips/campania/` | unit | `pnpm exec vitest run tests/unit/tripManifest.spec.ts` | ✅ to update | ⬜ pending |
| ROUTE-05 / D-02 | Published build | data (build) | `pnpm verify` (`build-isolation.spec.ts`) | ✅ to update | ⬜ pending |
| ROUTE-05 / D-02 | The portada lists Campania (dev); the parity portada stays green without edits | e2e dev + parity | `pnpm test:trips` (`portada.spec.ts`); `pnpm test:parity` | ✅ to update / read-only | ⬜ pending |
| D-19 | Roma, prueba, forma, app, shared, CSS and parity unchanged; the 56 goldens are not re-baselined | git + parity | frozen-files check; `pnpm verify` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

What each row checks in detail:

- **CAMP-01, days content (data):**
  - Exactly 10 day files, with slugs `sabado-19, domingo-20, lunes-21, martes-22, miercoles-23, jueves-24, viernes-25, sabado-26, domingo-27, lunes-28`.
  - `order` runs 1..10.
  - Eyebrows are in Spanish and never contain `giugno`.
  - `jueves-24` and `sabado-26` each contain one `choice`.
  - Transport rows are present: `plane` (19, 28), `bus`, `ferry` (20, 21, 23), `car` (23–26) and `bike`.
- **CAMP-02, monument cards (data):**
  - The D-10 slug list exists.
  - Every monument has a `hero.src` starting `https://upload.wikimedia.org/`, a non-empty `italian`, `sections` and `mapsQuery`.
  - Coordinates fall inside lat 40.3–41.15 and lng 13.8–15.3.
  - Each monument appears in exactly one day's `cards`.
- **CAMP-04, Reservas file (data):**
  - `reference/reservas.yml` exists and declares `headings` (Phase 12.1), so it never falls back to «3 comensales».
  - `confirmed` holds the flights of the 19th and 28th.
  - `table` has rows for every base, 3 ferries, the car (return on the 26th, D-01), 2 concerts and Napoli Sotterranea.
- **CAMP-06, «por confirmar» markers (data):**
  - At least 15 `⚠ por confirmar` across Campania's strings.
  - Exactly 0 in `content/trips/roma/**` (match the full `⚠ por confirmar`; Roma legitimately contains «por confirmar» in g-bar-musa).
  - The marker is present in `domingo-20` (ferry), `domingo-27` (PTN), `baia-di-sorgeto` (night access) and `sabado-26` (car return place).
  - The marker never sits inside a plain-text field with `**`.
- **ROUTE-05 / D-02, published build (data, build):**
  - `.output/public/trips/campania/index.html` and its `_payload.json` exist with real content.
  - The `CAMPANIA-CENTINELA-12A` sentinel appears nowhere.
  - `prueba` and `forma` are still absent from the build (draft isolation stays non-vacuous).

---

## Wave 0 Requirements

- [ ] `tests/data/campania-content.spec.ts` — the CAMP-01..06 data assertions above.
  - Checks that are safe before publication, such as structure and the marker never appearing in Roma, are active from the first content plan.
  - The slug list, counts and thresholds are tightened plan by plan as content lands.
- [ ] Update the skeleton-bound tests as the related content lands:
  - `tests/trips/campania.spec.ts` (orders, the Thursday route mode, the portada);
  - `tests/unit/timelineRows.spec.ts` (Thursday refs);
  - `tests/unit/searchIndex.spec.ts` (keep «escalones»/«linterna» in Sorgeto's family note);
  - `tests/unit/tripManifest.spec.ts`, `tests/trips/portada.spec.ts` and `tests/data/build-isolation.spec.ts` (publication).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tone, accuracy and usefulness of the prose on the ground | CAMP-01..05 | Editorial judgement | Read Campania in `pnpm dev` and on a phone |
| Each Wikimedia hero shows the right subject | CAMP-02 | Research verified files by title only | Scroll the cards in light and dark themes |
| «⚠ por confirmar» items get confirmed before the trip (spring 2027) | CAMP-06 | Depends on 2027 timetables that are not published yet | Revisit the RESEARCH field-data table |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
