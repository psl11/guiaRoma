---
phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a
plan: 03
subsystem: ui
tags: [vue, nuxt, day-route, google-maps, ssg, feat-09]

# Dependency graph
requires:
  - phase: 06-01
    provides: "pure utils pointFor/capStops/buildDirUrl/routeLabel/MAX_ROUTE_STOPS (app/utils/dayRoute.ts), auto-imported"
  - phase: 04 (DaySection)
    provides: "DaySection.vue with the day.cards → monById resolution chain (dayCards computed) and the verbatim .day-stats band"
provides:
  - "FEAT-09 UI complete: each day's .day-stats band renders a reactive .day-route-btn linking to the day's Google Maps walking route, derived from day.cards order"
  - "Reactive SSG-prerendered route button (no DOM mutation, no client-only) replacing the original imperative stats.appendChild"
affects: [06-05 (Playwright parity spec search-route.spec.ts asserts the rendered button), Phase 08 (full pixel parity)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wire behavior into pre-existing verbatim shells via reactive :href/v-if, zero new CSS, no scoped <style> (F3/F4 pattern continued)"
    - "Route stop derivation reuses the dayCards chain (day.cards → monById → defensive filter) + .map(pointFor); NO type filter"

key-files:
  created:
    - .planning/phases/06-derivados-de-datos-b-squeda-y-ruta-del-d-a/06-03-SUMMARY.md
  modified:
    - app/components/DaySection.vue

key-decisions:
  - "Route button derives href reactively from day.cards at SSG prerender (:href=routeHref + v-if=points.length>=2), replacing index.html's imperative stats.appendChild — no DOM, no client-only"
  - "points computed reuses the SAME chain as dayCards (defensive .filter((m): m is Monument => !!m)) then .map(pointFor) — NO PlaceType filter (Pitfall 2): Saturday keeps vaticano+auditorium → 8 stops, verified in generated HTML"
  - "Zero new CSS: .day-route-btn already exists verbatim in base.css:393-413; no scoped <style> (a data-v-* would break the global .day-stats/.day-route-btn selectors)"
  - "Plain external link (target=_blank rel=noopener), NOT internal navigation — navigateToCard intentionally not used"

patterns-established:
  - "Reactive route button: points/routeHref computeds + a single <a v-if=points.length>=2 class=day-route-btn :href=routeHref> appended inside the existing .day-stats band after the stats v-for"

requirements-completed: [FEAT-09]

# Metrics
duration: 2min
completed: 2026-06-21
---

# Phase 6 Plan 3: Ruta del día button (FEAT-09 UI) Summary

**Each day's `.day-stats` band now renders a reactive `.day-route-btn` linking to the day's Google Maps walking route, derived from `day.cards` order at SSG prerender (no DOM mutation), with NO type filter so Saturday keeps its 8 stops (vaticano+auditorium).**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-21T13:53:43Z
- **Completed:** 2026-06-21T13:55:33Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added `points` and `routeHref` computeds to `DaySection.vue`, reusing the existing `dayCards` resolution chain (`day.cards → monById → defensive filter`) then `.map(pointFor)`, with NO `PlaceType` filter (critical override / Pitfall 2).
- Appended a single reactive `<a class="day-route-btn" :href="routeHref" target="_blank" rel="noopener" title="Abre Google Maps con el recorrido del día a pie">{{ routeLabel(points.length) }}</a>` inside the existing `.day-stats` band, guarded by `v-if="points.length >= 2"` (mirrors the original `if (points.length < 2) return`).
- Replaced the original's imperative `stats.appendChild` (index.html:6644) with SSG-prerendered reactive markup — no DOM mutation, no `client-only`, zero new CSS, no scoped `<style>`.
- Verified in the generated static HTML: all 5 days render the button with labels `(6 paradas)`, **`(8 paradas)` (Saturday — vaticano+auditorium kept)**, `(7 paradas)`, `(10 paradas)`, `(7 paradas)`; `href` is a fixed `https://www.google.com/maps/dir/?api=1&travelmode=walking…` Google Maps origin with `rel="noopener"`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the points/routeHref computeds and append the .day-route-btn inside .day-stats** - `3c0afce` (feat)

**Plan metadata:** (this commit — docs: complete plan)

## Files Created/Modified
- `app/components/DaySection.vue` - Added `points`/`routeHref` computeds and the reactive `.day-route-btn` inside the existing `.day-stats` band; extended the doc-comment with the route-button note (DATA-03 order, no type filter, SSG prerender, zero CSS).

## Decisions Made
- **Reactive href at SSG prerender:** the button derives `href` from `day.cards` via `:href="routeHref"` + `v-if`, rendered at prerender time — no `window`/DOM access, no `client-only`. This replaces the original imperative `stats.appendChild` and confirmed clean under `pnpm generate`.
- **No type filter (Pitfall 2 / critical override):** `points` reuses the SAME defensive `.filter((m): m is Monument => !!m)` as `dayCards` (drops only unresolved slugs), then `.map(pointFor)`. No `type ===`/`type !==` anywhere. Saturday keeps `vaticano` (guided) + `auditorium` (concert) → 8 stops, matching the live route (the phase SC#3 prose "exclude guided/concert" is factually wrong about the original and was NOT implemented; 06-01's Saturday=8-stops unit test is the source of truth).
- **Plain external link, not internal nav:** `target="_blank"` + `rel="noopener"`; `navigateToCard` intentionally not used (UI-SPEC §Interaction).
- **Zero new CSS:** `.day-route-btn` (with `::before` 🗺️ glyph, `margin-left:auto`, hover, `<600px width:100%`) already exists verbatim in `base.css:393-413`; no scoped `<style>` block (a `data-v-*` would break the global `.day-stats`/`.day-route-btn` selectors).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- FEAT-09 UI complete: every day renders the route button when ≥2 stops resolve, with the verbatim label/title and `target=_blank rel=noopener`.
- The rendered button's visibility/label/`href` structure is now ready to be asserted by the Wave-3 Playwright spec in Plan 06-05 (`tests/parity/search-route.spec.ts`). The per-day URL correctness is already guarded by Plan 06-01's `tests/unit/dayRoute.spec.ts`.
- No blockers introduced. (The inherited D1 blocker — discriminated-union `artist`/`reference` collections returning all-null SQL rows — is unrelated to this plan; DaySection consumes monuments only.)

## Self-Check: PASSED
- `app/components/DaySection.vue` — FOUND (commit `3c0afce`, +29 lines)
- `.planning/phases/06-derivados-de-datos-b-squeda-y-ruta-del-d-a/06-03-SUMMARY.md` — FOUND
- Commit `3c0afce` — verified in git log
- Generated HTML renders 5 route buttons (Saturday = 8 paradas) — verified via `pnpm generate`
- `pnpm typecheck` exit 0, `pnpm lint` exit 0, `pnpm generate` exit 0 — verified

---
*Phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a*
*Completed: 2026-06-21*
