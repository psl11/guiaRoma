---
phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a
plan: 05
subsystem: testing
tags: [playwright, parity, ssg, minisearch, leaflet, google-maps, search, route]

# Dependency graph
requires:
  - phase: 06-03
    provides: "DaySection .day-route-btn (Ver ruta del día (N paradas) → Google Maps walking URL derived from day.cards)"
  - phase: 06-04
    provides: "SearchBox.vue wired into TheHero (#search dropdown via MiniSearch, result → navigateToCard)"
provides:
  - "tests/parity/search-route.spec.ts — self-contained Playwright parity spec proving FEAT-03 + FEAT-09 on the real built /guiaRoma/ SSG site"
  - "Human paridad sign-off (APPROVED) of search + route vs the live index.html — closes the last user-visible surface gate of Phase 06"
affects: ["phase-08", "verification", "parity", "visual-diff"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-contained behavioral parity spec (build+serve under /guiaRoma/, port base 5740) — third instance of the modes/navigation.spec pattern; never uses the golden webServer (serves the OLD index.html)"
    - "Route href asserted by STRUCTURE only (prefix match), never fetched (no external request, no SSRF surface)"

key-files:
  created:
    - "tests/parity/search-route.spec.ts"
  modified: []

key-decisions:
  - "Task 2 (checkpoint:human-verify) resolved APPROVED — project owner signed off that client search reaches ≥ parity and the route button is exact-parity vs the live index.html in light/dark × mobile/desktop"
  - "search-route.spec.ts is self-contained (own beforeAll build+serve, port 5740) and asserts behavior on the rendered DOM, not pixels — Phase 8 owns visual-diff"
  - "The 5 PRE-EXISTING full-suite failures (4× golden.spec pixel-diff + 1× shell.spec stale dev-routing) are out-of-scope, documented in deferred-items.md, NOT caused by this phase; the new spec passes independently 10/10"

patterns-established:
  - "Parity spec covers dropdown thresholds (≥2 opens / <2 closed), max-8 cap, 'Sin resultados', result→.highlight + hash-unchanged (SC#2/D-03), and route-btn visibility/label/href (FEAT-09)"
  - "Console-error gate tolerates ONLY the color-mode SSG hydration message and fails on any other console error (verbatim from modes/navigation specs)"

requirements-completed: [FEAT-03, FEAT-09]

# Metrics
duration: ~20min
completed: 2026-06-21
---

# Phase 6 Plan 5: Verificación de paridad (búsqueda + ruta del día) Summary

**Self-contained Playwright parity spec (`search-route.spec.ts`, 10/10 green) proving FEAT-03 dropdown behavior + result→navigation and FEAT-09 route-button visibility/label/href on the real built `/guiaRoma/` SSG site, sealed by an APPROVED human paridad sign-off vs the live `index.html`.**

## Performance

- **Duration:** ~20 min (1 auto task + 1 human-verify checkpoint across two agent runs)
- **Completed:** 2026-06-21
- **Tasks:** 2 (1 auto, 1 checkpoint:human-verify)
- **Files modified:** 1

## Accomplishments

- **`tests/parity/search-route.spec.ts`** — a self-contained Playwright spec (own `beforeAll` `pnpm generate` + `cpSync` into a `guiaRoma/` subdir + `pnpm dlx serve` on port base 5740) that proves, on the real generated static site:
  - **Dropdown threshold (FEAT-03):** <2 chars keeps `#search-results` closed; ≥2 chars matching a real monument opens `.search-results.show` with ≥1 `.search-result` row.
  - **Max 8:** a broad query caps `.search-result` count at ≤ 8.
  - **Empty state:** a no-match query shows the verbatim "Sin resultados" text with 0 rows.
  - **Result → navigation (SC#2 / D-03):** clicking a result adds `.highlight` to the target card AND leaves `page.url()` hash unchanged (navigateToCard `preventDefault`).
  - **Route button (FEAT-09 / SC#3):** a known day's `.day-route-btn` is visible, label matches `/Ver ruta del día \(\d+ paradas\)/`, and `href` matches the fixed `https://www.google.com/maps/dir/?api=1&travelmode=walking` prefix (never fetched).
- **Console-error gate** tolerates ONLY the known color-mode SSG hydration message; fails on any other console error.
- **Human paridad sign-off APPROVED** — the project owner confirmed search reaches at-least-parity and the route button is exact-parity against the live `index.html` in all four theme/width combinations. This closes the last user-visible surface gate of Phase 06.

## Task Commits

1. **Task 1: Write `tests/parity/search-route.spec.ts`** — `210cc8d` (test) — passes 10/10 (5 test cases × mobile + desktop projects).
2. **Task 2: Human paridad sign-off — search + route vs the live `index.html`** — checkpoint:human-verify, **APPROVED** (no file change; subjective parity gate).

**Plan metadata:** see the `docs(06-05): ...` commit below.

## Files Created/Modified

- `tests/parity/search-route.spec.ts` (created) — self-contained behavioral parity spec for FEAT-03 (search dropdown + result→navigation) and FEAT-09 (ruta del día button), mirroring `modes.spec.ts`/`navigation.spec.ts` (build+serve under `/guiaRoma/`, port 5740).

## Decisions Made

- **Task 2 resolved APPROVED.** The project owner reviewed the built `/guiaRoma/` site side-by-side with the live `index.html` and signed off: client search finds at least what the original finds (sanctioned SC#1 improvement allowed), the dropdown opens at ≥2 chars with ≤8 rows and "Sin resultados" on a no-match, result clicks scroll-highlight the ficha with no hash change, and the "Ver ruta del día (N paradas)" button matches the original per day (same N, same ordered stops, Saturday includes Vatican + Auditorium) — verified in light/dark × mobile/desktop, console clean except the known color-mode hydration message.
- **The new spec is self-contained and behavior-only.** It builds and serves its own copy of the SSG output under `/guiaRoma/` (it does NOT use the golden's webServer, which serves the OLD `index.html`), and asserts DOM/text behavior rather than pixels (Phase 8 owns the total visual-diff). It does not rebaseline the golden.

## Deviations from Plan

None — plan executed exactly as written. Task 1 produced the self-contained spec to the acceptance criteria; Task 2 was the human checkpoint and was approved.

## Issues Encountered

**Pre-existing, out-of-scope full-suite failures (documented in `deferred-items.md`, NOT caused by this phase).** When running the WHOLE `pnpm test:golden` suite (as opposed to the new `search-route.spec.ts` in isolation, which passes 10/10), 5 failures appear — all pre-existing and already acknowledged as deferred in STATE.md at the Fase 5 P03 close:

| # | Test | Failure | Disposition |
|---|------|---------|-------------|
| 1-4 | `golden.spec.ts` golden light/dark × mobile/desktop | Pixel-diff against the live `index.html` webServer (received `1264×714` vs expected `1280×1576` — served `index.html` did not fully render images). | Golden pixel flake → **Phase 8** (total visual-diff) per CONTEXT. |
| 5 | `shell.spec.ts:224` `/trips/[slug]` dev-routing (ARCH-02) | `Server no respondió en http://localhost:5200/guiaRoma/` (fetch failed) — blocked by a stale `nuxi dev` lock. | "shell dev test bloqueado por lock de nuxi dev rancio" → carried forward. |

The new `search-route.spec.ts` is self-contained (own build+serve under `/guiaRoma/`, port 5740) and passes independently. The phase unit suite is green (71/71). These deferrals are tracked, not fixed here (scope boundary: only auto-fix issues directly caused by the current task's changes).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Phase 06 user-visible surfaces are complete and parity-verified.** FEAT-03 (client search) and FEAT-09 (ruta del día) are wired, rendered on the built SSG site, covered by a self-contained behavioral parity spec (10/10), and human-approved against the live `index.html`.
- **Phase 06 is the last plan (5 of 5).** Phase 07 (Leaflet map island + image fallback) and Phase 08 (final parity / total visual-diff) are next.
- **Carried-forward concerns (unchanged by this plan):**
  - The 4× `golden.spec.ts` pixel-diff and 1× `shell.spec.ts` stale dev-routing failures are deferred (Phase 8 / carried forward) — see `deferred-items.md`.
  - BLOQUEANTE **D1** remains open (inherited from Phase 4, not Phase 5/6): the discriminated-union `artist`/`reference` collections return all-null SQL rows, so `#arte`/`#arquitectura`/`#reservas`/`#practica` do not render with real data. `pnpm generate` still OK. Resolve before Phase 07/08 depend on those sections.

## Self-Check: PASSED

- FOUND: `tests/parity/search-route.spec.ts` (created Task 1)
- FOUND: `.planning/phases/06-derivados-de-datos-b-squeda-y-ruta-del-d-a/06-05-SUMMARY.md`
- FOUND: commit `210cc8d` (Task 1) in `git log`
- Task 2 (checkpoint:human-verify): APPROVED by project owner — recorded.

---
*Phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a*
*Completed: 2026-06-21*
