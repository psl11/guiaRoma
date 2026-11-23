---
phase: 05-navegaci-n-transversal
plan: 02
subsystem: ui
tags: [nuxt, vue, composable, useState, singleton, scrollspy, event-delegation, navigation, FEAT-05]

# Dependency graph
requires:
  - phase: 05-navegaci-n-transversal
    provides: "05-01 app/utils/cardNav.ts — computeActiveSection / isFichaTarget pure logic delegated to here"
  - phase: 04-render-y-modos
    provides: "app/composables/useTripModes.ts — the exact accessor+controller singleton precedent cloned here; TheHero.vue controller-invocation precedent"
  - phase: 03-p-gina-layout-y-tema
    provides: "useTrip() (monById index), the F3 shells NavPills/BackButton (mounted, unwired) and TripView (page owner)"
provides:
  - "app/composables/useCardNavigation.ts — useState singleton accessor (navStack/activeSection/canGoBack/navigateToCard/goBack) + effects controller (one native document click listener + one passive scroll listener) — the stable D-05 public API for F6 (search) and F7 (map)"
  - "NavPills wired with reactive .active per pill; BackButton wired with .show + @click=goBack; TripView invokes the controller once"
affects: [05-03, busqueda, ruta-del-dia, mapa, F6, F7]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Singleton composable accessor+controller cloned from useTripModes: pure useState accessor (callable anywhere) + effects controller called once in the page owner"
    - "Native document.addEventListener('click') delegation (NOT Vue @click, NOT bindCardLinks DOM-scan, NOT ProseA.global.vue) gated by isFichaTarget — resolves Pitfall 1 (prose links render as NuxtLink with their own onClick)"
    - "Reactive :class binding on an already-mounted F3 shell (F3->F5 'wire, do not restructure') replacing the original imperative classList.toggle"
    - "Default useState = prerendered HTML ([]/'' = no .show/no .active) for zero hydration mismatch"

key-files:
  created:
    - "app/composables/useCardNavigation.ts"
  modified:
    - "app/components/TripView.vue"
    - "app/components/NavPills.vue"
    - "app/components/BackButton.vue"

key-decisions:
  - "useCardNavigation() is the PURE accessor (reads useState 'cardNav:stack'=[] and 'cardNav:activeSection'='', returns canGoBack computed + verbatim navigateToCard/goBack); useCardNavigationController() holds the effects and is invoked exactly once in TripView (Pitfall 4) — same split as useTripModes/useTripModesController"
  - "navigateToCard/goBack are a 1:1 verbatim port of index.html:6390-6409 (preventDefault, push window.scrollY, scrollIntoView smooth block:start, .highlight 2500ms; pop + window.scrollTo smooth); the if(el) and typeof prev==='number' guards are kept; no manual header offset (scroll-padding-top:124px covers it, Pitfall 5); highlightCard NOT ported"
  - "The delegated click listener is a NATIVE document listener registered in onMounted (Pitfall 1), gated by isFichaTarget(id, monById.value) (D-02): non-ficha hrefs fall through to native section jump; ficha hrefs preventDefault (D-03, URL unchanged) + navigateToCard. Bubble phase (default) chosen for now; 05-03 will empirically confirm vs capture phase"
  - "Both the controller and its TripView call site are async/await because useTrip is async — this makes the symbol `export async function useCardNavigationController` (the artifact-contract substring without `async` does not literally match; the exported symbol and behavior are intact). Mirrors the existing `export async function useTrip`"
  - "NavPills/BackButton are WIRED not restructured: NavPills gets :class={ active: activeSection===<id|d.slug> } on each pill (7 literal + 5 day); BackButton gets a new <script setup> + :class={ show: canGoBack } + @click=goBack. Zero new CSS, no <style scoped>, base.css untouched"

patterns-established:
  - "Async singleton controller: when a controller needs async data (useTrip), it is `export async function` and the page owner `await`s it alongside its own top-level await — consistent with useTrip itself"

requirements-completed: [FEAT-05]

# Metrics
duration: 5min
completed: 2026-06-20
---

# Phase 5 Plan 02: useCardNavigation Singleton + Shell Wiring Summary

**`useCardNavigation` — a `useState` singleton (pure accessor + effects controller cloned from `useTripModes`) that ports index.html's nav/back-stack and scrollspy 1:1, intercepts ficha links via a native `document` click listener (resolving the NuxtLink Pitfall 1), and is wired into NavPills (`.active`), BackButton (`.show` + `goBack`) and TripView — zero new CSS, the stable D-05 API ready for F6/F7.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-06-20T23:50:40Z
- **Completed:** 2026-06-20T23:55:36Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- Built `app/composables/useCardNavigation.ts` as the singleton heart of FEAT-05: pure accessor + effects controller, exactly mirroring the `useTripModes`/`useTripModesController` split (Pitfall 4 — listeners registered exactly once).
- Ported `navigateToCard`/`goBack` verbatim from index.html:6390-6409 (preventDefault, `window.scrollY` push, `scrollIntoView({behavior:'smooth',block:'start'})`, `.highlight` for `2500`ms, LIFO pop + `window.scrollTo` smooth) with the original `if (el)` / `typeof prev === 'number'` guards intact and no manual header offset.
- Implemented the D-01 delegated click listener as a **native** `document.addEventListener('click', ...)` (NOT a Vue `@click`, NOT `bindCardLinks`, NOT `ProseA.global.vue`), gated by `isFichaTarget(id, monById.value)` — the documented resolution to Pitfall 1 (prose links are `NuxtLink` with their own `onClick`); section links fall through to native anchor jumps (D-02/D-03).
- Ported the scrollspy as a `{ passive: true }` scroll listener delegating to the pure `computeActiveSection` (verbatim `+130` last-wins from 05-01); initial `updateActivePill()` in `onMounted` mirrors index.html:6655 `init()`. No IntersectionObserver/throttle/rAF.
- Wired the three F3 shells without restructuring: TripView invokes the controller once (page-owner host, mirroring TheHero); NavPills binds `.active` per pill against `activeSection`; BackButton gains a `<script setup>` with `.show` via `canGoBack` and `@click="goBack"`.
- All gates green: `pnpm test:unit` (43 tests), `pnpm typecheck`, `pnpm lint`, and `pnpm generate` (static build with the wired components, SSR/hydration default = empty stack + no active pill). `base.css` untouched, no `<style scoped>` anywhere.

## Task Commits

Each task was committed atomically:

1. **Task 1: useCardNavigation.ts (singleton accessor + effects controller)** - `99d00db` (feat)
2. **Task 2: Wire TripView + NavPills + BackButton** - `ec43fe1` (feat)

**Plan metadata:** see final `docs(05-02)` commit.

_No separate test commit: Task 1's behavior is covered by the pure-logic unit spec authored in Plan 05-01 (the composable delegates to it); the controller/DOM behavior is verified by `pnpm generate` here and by Playwright in Plan 05-03._

## Files Created/Modified
- `app/composables/useCardNavigation.ts` (created) - The FEAT-05 singleton. `useCardNavigation()` is the pure accessor: `useState<number[]>('cardNav:stack', () => [])`, `useState<string>('cardNav:activeSection', () => '')`, `canGoBack = computed(navStack.length > 0)`, and the verbatim `navigateToCard`/`goBack`. `useCardNavigationController()` (async) holds the effects: a native `document` click listener gated by `isFichaTarget`, a passive scroll listener delegating to `computeActiveSection`, registered in `onMounted` and removed in `onUnmounted`.
- `app/components/TripView.vue` (modified) - Added `await useCardNavigationController()` after `await useTrip(props.slug)` — the single controller host (page owner mounted once). No `@click` / wrapper `<div>` on `<main>` (native `document` listener, D-01). Template unchanged.
- `app/components/NavPills.vue` (modified) - Added `const { activeSection } = useCardNavigation()` and a reactive `:class="{ active: ... }"` to each of the 8 pills (7 structural by literal id, the `v-for` day pills by `d.slug`). Markup otherwise byte-identical (`id="nav-pills"`, all `href`s, "Pratica" verbatim).
- `app/components/BackButton.vue` (modified) - Added a `<script setup lang="ts">` block (none before) with `const { canGoBack, goBack } = useCardNavigation()`, plus `:class="{ show: canGoBack }"` and `@click="goBack"` on the button. `id="back-btn"`, `aria-label="Volver"`, the `←` glyph and "Volver" text kept verbatim.

## Decisions Made
- **Accessor/controller split cloned verbatim from `useTripModes`:** the pure `useCardNavigation()` is callable from NavPills/BackButton/future F6/F7 with no effects; the controller (the only place with listeners) is invoked once in TripView — preventing the N-listeners bug (Pitfall 4).
- **Verbatim port, no re-derivation:** `navigateToCard`/`goBack` keep the exact tokens and guards of index.html:6390-6409; `updateBackBtn()` is replaced by the reactive `canGoBack` computed and the imperative `classList.toggle('active')` by NavPills' reactive `:class`.
- **Native `document` listener, bubble phase:** registered as `document.addEventListener('click', onDelegatedClick)` (default bubble). Plan 05-03 will empirically confirm via Playwright whether capture phase is needed against NuxtLink's own `onClick` (A1 in RESEARCH) — bubble is the starting point per the plan.
- **Default state = prerendered HTML:** `navStack=[]` / `activeSection=''` so the F3 shells' SSR markup (no `.show`, no `.active`) matches the first paint — zero hydration mismatch (confirmed by a clean `pnpm generate`).
- **`monById` via the controller's own `useTrip('roma')`:** the controller awaits its own `useTrip('roma')` (same slug TripView passes, Pitfall 2) rather than threading `monById` through props.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Controller (and its call site) are `async`, diverging from the literal `export function` artifact-contract substring**
- **Found during:** Task 1 (writing the controller) and Task 2 (the TripView call site).
- **Issue:** The plan's `<action>` mandates `const { monById } = await useTrip('roma')` inside the controller, but `useTrip` is `export async function useTrip(...)` — so the controller MUST be `async` to `await` it. The frontmatter artifact contract (`contains: "export function useCardNavigationController"`) and one source-assertion bullet expect the substring `export function useCardNavigationController(`, which does not literally match `export async function useCardNavigationController(`. Choosing the non-async form would have made `monById` a Promise and broken the gate. Correctness (and the explicit `await useTrip` requirement) wins.
- **Fix:** Declared `export async function useCardNavigationController()` and called it as `await useCardNavigationController()` in TripView's top-level-await `<script setup>` (consistent with the adjacent `await useTrip(props.slug)` and with `useTrip` itself being `export async function`). The `useCardNavigationController` symbol is exported and the `useCardNavigationController()` call appears exactly once in TripView (the count-1 assertion holds — `await ` is a prefix, not part of the matched substring).
- **Files modified:** app/composables/useCardNavigation.ts, app/components/TripView.vue
- **Verification:** `pnpm typecheck` exit 0, `pnpm generate` exit 0.
- **Committed in:** 99d00db (Task 1), ec43fe1 (Task 2)

**2. [Rule 3 - Blocking] Reworded JSDoc comments to avoid literal `@click` and `<style` tokens that tripped the source-assertion greps**
- **Found during:** Task 1 & Task 2 (running the acceptance source assertions).
- **Issue:** Several explanatory comments contained the literal tokens `@click` (e.g. "NO un `@click` de Vue") and `<style scoped>` (e.g. "NO se añade `<style scoped>`", a phrasing inherited from the original F3 headers). The plan's negative assertions are grep-based — `grep -c "@click"` must be 0 in the composable, and `grep -L "<style"` must list all three modified components — so a comment mention would produce false positives even though no `@click` template handler or `<style>` block exists.
- **Fix:** Reworded the comments to "handler de plantilla Vue" and "bloque scoped" (the latter matching TripView's existing phrasing, which already passed). Behavior unchanged — comments only.
- **Files modified:** app/composables/useCardNavigation.ts, app/components/NavPills.vue, app/components/BackButton.vue
- **Verification:** `grep -c "@click" app/composables/useCardNavigation.ts` = 0; `grep -L "<style"` lists all three components; `pnpm lint` exit 0.
- **Committed in:** 99d00db (Task 1), ec43fe1 (Task 2)

---

**Total deviations:** 2 auto-fixed (1 correctness-driven async signature, 1 comment-token rewording to satisfy grep assertions). No production-behavior changes beyond what the plan specified; no scope creep; the navigation logic is the unchanged verbatim port.

## Issues Encountered
None beyond the two deviations above (both resolved inline within their tasks). No authentication gates. No packages installed (the phase installs nothing — RESEARCH §Package Legitimacy Audit).

## Threat Surface
No new security-relevant surface beyond the plan's `<threat_model>`. The single surface — the delegated click reading `href` and calling `getElementById` + `scrollIntoView` — is implemented exactly as the register specifies: bounded by `isFichaTarget(id, monById.value)` (T-05-01, LOW), with `event.preventDefault()` cancelling default navigation. `getElementById` is not an injection sink. `navStack` is bounded in-memory (T-05-02, accept). No threat flags raised.

## User Setup Required
None - no external service configuration required. Pure client-side behavior over the static SSG; no network, no persistence (the back-stack is ephemeral in-memory, parity with index.html).

## Next Plan Readiness
- The D-05 public API (`navigateToCard`, `goBack`, `activeSection`, `canGoBack`) is stable and live; F6 (search dropdown) and F7 (map popups) can call `navigateToCard(id)` without refactor.
- Plan 05-03 (Playwright parity spec) can now assert real-browser behavior: smooth scroll + `.highlight` on ficha-link click, `.back-btn.show` toggling, `.nav-pill.active` scrollspy switch point (`scrollY+130`), and prose-link interception vs native section jump. It will also empirically decide bubble-vs-capture phase for the delegated listener (A1).
- No blockers introduced. (The pre-existing F4 D1 blocker — discriminated-union collections `artist`/`reference` returning null rows so `#arte`/`#arquitectura`/`#reservas`/`#practica` do not render with real data — is unrelated to F5 and unchanged here; `pnpm generate` still succeeds.)

## Self-Check: PASSED
- FOUND: app/composables/useCardNavigation.ts
- FOUND: app/components/TripView.vue (modified)
- FOUND: app/components/NavPills.vue (modified)
- FOUND: app/components/BackButton.vue (modified)
- FOUND commit: 99d00db (Task 1, feat)
- FOUND commit: ec43fe1 (Task 2, feat)

---
*Phase: 05-navegaci-n-transversal*
*Completed: 2026-06-20*
