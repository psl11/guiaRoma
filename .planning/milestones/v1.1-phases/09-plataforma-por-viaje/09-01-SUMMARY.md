---
phase: 09-plataforma-por-viaje
plan: 01
subsystem: ui
tags: [nuxt4, vue3, provide-inject, useState, localStorage, multi-trip]

requires:
  - phase: 05-navegacion
    provides: useCardNavigation accessor/controller split, capture-phase delegated click (A1)
  - phase: 04-modos
    provides: useTripModes accessor/controller split, roma-* localStorage parity keys
  - phase: 07-mapa-notas
    provides: MonumentCard persistent notes (roma-note-<ficha>)
provides:
  - app/utils/tripStorage.ts — tripStorageKey (D-04 localStorage keys) and tripStateKey (D-08 useState keys)
  - app/composables/useTripContext.ts — TripSlugKey, provideTripSlug, useTripSlug (throws outside TripView)
  - Per-trip navigation state (cardNav:stack:<slug>, cardNav:activeSection:<slug>)
  - Per-trip modes (pace/light/resumen:<slug>) and persistence (<slug>-pace/-light/-resumen, <slug>-note-<ficha>)
affects: [09-03 useSearch per trip, 09-04 isolation E2E, 09-05 build sentinel, any future accessor needing the trip slug]

actuals:
  tokens: 5560
  tasks: 2
  commits: 3
plan_head_before: c0dea5996a15d939608beee83b7dc6ec5490f364
plan_head_after: 9e2c5686d4f9afcda103ac06b932725907be1256

tech-stack:
  added: []
  patterns:
    - "Trip context via provide/inject: TripView provides the slug as its first statement; descendants read useTripSlug()"
    - "Accessor(slug = useTripSlug()) / Controller(slug) — the host that provides cannot inject itself, so it passes the slug by argument"
    - "Async controllers read the slug in the synchronous segment, before the first await"
    - "All per-trip keys go through tripStorageKey/tripStateKey; exact-key getItem/setItem only"

key-files:
  created:
    - app/utils/tripStorage.ts
    - app/composables/useTripContext.ts
    - tests/unit/tripStorage.spec.ts
  modified:
    - app/composables/useCardNavigation.ts
    - app/components/TripView.vue
    - app/composables/useTripModes.ts
    - app/components/MonumentCard.vue

key-decisions:
  - "useTripSlug() throws (never defaults) outside a TripView descendant, so a wrong-trip slug fails the prerender loudly instead of mixing notes between trips"
  - "useCardNavigationController(slug) takes a mandatory slug argument (TripView cannot inject its own provide in Vue 3.5)"
  - "D-04 one-way key template ${slug}-${name} applied; for Rome it is byte-identical to the live keys, so no migration"

patterns-established:
  - "Pattern: accessor with optional slug defaulting to useTripSlug(); controller reads the slug once synchronously and passes it down"
  - "Pattern: per-trip useState keys via tripStateKey(slug, name) → name:slug"

requirements-completed: [PLAT-02, PLAT-03]

coverage:
  - id: D1
    description: "tripStorageKey/tripStateKey: Rome keys identical to the live guide; no collision between trips"
    requirement: PLAT-03
    verification:
      - kind: unit
        ref: "tests/unit/tripStorage.spec.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Trip slug published by TripView and read by inject; per-trip navigation state; Rome navigation, Volver and scrollspy unchanged"
    requirement: PLAT-02
    verification:
      - kind: e2e
        ref: "tests/parity/navigation.spec.ts (playwright.gate.config.ts, 6 passed)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Pace, light, resumen and notes persisted per trip; Rome keeps roma-pace/roma-light/roma-resumen/roma-note-<ficha>"
    requirement: PLAT-03
    verification:
      - kind: e2e
        ref: "tests/parity/modes.spec.ts + tests/parity/map-fallback-notes.spec.ts (26 passed)"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-11-20
status: complete
---

# Phase 9 Plan 01: Trip slug context and per-trip navigation/preferences Summary

**TripView now publishes its slug via provide/inject; navigation state, pace/light/resumen modes and monument notes are keyed per trip through `tripStateKey`/`tripStorageKey`, with Rome's `roma-*` localStorage keys byte-identical and 32/32 parity specs green untouched.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-11-20T10:10:41Z
- **Completed:** 2026-11-20T10:15:52Z
- **Tasks:** 2 (1 tracer + 1 auto)
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- `app/utils/tripStorage.ts`: pure `tripStorageKey(slug, name)` → `${slug}-${name}` (D-04) and `tripStateKey(slug, name)` → `${name}:${slug}` (D-08), pinned by `tests/unit/tripStorage.spec.ts` (11 cases, incl. `roma-note-pantheon`).
- `app/composables/useTripContext.ts`: `TripSlugKey`, `provideTripSlug`, `useTripSlug` (throws outside a TripView descendant), with the self-inject trap and first-await rule documented.
- `useCardNavigation(slug = useTripSlug())` with `cardNav:stack:<slug>` / `cardNav:activeSection:<slug>`; `useCardNavigationController(slug)` takes the slug by argument and queries `useTrip(slug)`; hooks still registered before the await.
- `TripView` calls `provideTripSlug(props.slug)` as its first executable statement and `await useCardNavigationController(props.slug)`.
- `useTripModes(slug = useTripSlug())` with `pace:<slug>`/`light:<slug>`/`resumen:<slug>`; controller reads the slug synchronously and persists to `tripStorageKey(slug, 'pace'|'light'|'resumen')` in the same order and with the same enum validation.
- `MonumentCard` `NOTE_KEY = tripStorageKey(useTripSlug(), \`note-${monument.slug}\`)`.
- Prerender payload confirms the new state keys (`$scardNav:stack:roma`, `$space:roma`, `$slight:roma`, `$sresumen:roma`); search keys stay global until 09-03.

## Task Commits

1. **Task 1 (tracer, TDD RED):** `fd90862` test(09-01): add failing tripStorage key contract (D-04/D-08)
2. **Task 1 (tracer, TDD GREEN):** `42b35fb` feat(09-01): trip slug flows from TripView via provide/inject; per-trip navigation state
3. **Task 2:** `9e2c568` feat(09-01): per-trip pace, light, resumen and notes via tripStorageKey

No REFACTOR commit (nothing to refactor after GREEN).

## TDD Gate Compliance

- RED: `tests/unit/tripStorage.spec.ts` failed (module `app/utils/tripStorage` not found) and was committed alone as `test(09-01)` (`fd90862`).
- GREEN: same spec 11/11 after `feat(09-01)` (`42b35fb`).

## Verification

- `node_modules/.bin/vitest run tests/unit` → 11 files, 98 tests passed.
- `rm -rf .data .nuxt .output && nuxi generate` → no `useTripSlug() fuera de` / `inject() can only be used`.
- Playwright gate: navigation (6) + modes (14) + map-fallback-notes (12) → **32 passed**, run together on the final build.
- `eslint` on all 7 files and `nuxi typecheck` → clean.
- `git diff --quiet 79e57e0 -- tests/parity/ nuxt.config.ts app/components/NavPills.vue app/components/BackButton.vue` → 0 (unchanged; `colorMode.storageKey: 'roma-theme'` kept, D-07).
- Tracer feedback gate (end-of-phase, automated-only verify): re-ran green before Task 2.
- All acceptance criteria of both tasks: PASS.

## Decisions Made

- `useTripSlug()` throws instead of defaulting, so a call outside TripView fails the prerender (`failOnError`) rather than silently writing under the wrong trip.
- D-04 (one-way) applied as already decided by the user in 09-CONTEXT.md; no new checkpoint.

## Deviations from Plan

None to the code. One environment note:

- **Node runtime for builds.** The shell's default `node` is v24.19.0 (nvm `lts/*`), but `better-sqlite3` in `node_modules` is compiled for Node 22, so `nuxi generate` failed with `Module did not self-register`. Builds, Playwright, eslint and typecheck were run with `~/.nvm/versions/node/v22.20.0/bin` first on `PATH`. No packages installed or rebuilt; `package.json` unchanged. Future executors should do the same (or the user can pin Node 22 via `.nvmrc`).
- `nuxi typecheck` fetched `vue-tsc` into the npx cache on its own (vue-tsc is not a devDependency); this is nuxi's built-in behavior, not a project dependency change.

## Issues Encountered

None besides the Node version note above.

## Flagged Assumptions (carried, unresolved)

- A-PLAT-02: a `#id` link that is not a ficha of the trip being viewed falls back to the native anchor jump (no new behavior).
- A-PLAT-03: with blocked or corrupt `localStorage`, each trip starts with defaults (existing try/catch and enum validation); no migration or cleanup.

## Next Phase Readiness

- Ready for 09-02 (schema slug regex + data gate) and 09-03 (`useSearch(slug?)` reusing `tripStateKey` and `useTripSlug`).

## Self-Check: PASSED

- FOUND: app/utils/tripStorage.ts, app/composables/useTripContext.ts, tests/unit/tripStorage.spec.ts
- FOUND commits: fd90862, 42b35fb, 9e2c568 (ancestors of HEAD)
