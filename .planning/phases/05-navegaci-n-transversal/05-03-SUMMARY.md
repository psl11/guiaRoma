---
phase: 05-navegaci-n-transversal
plan: 03
subsystem: testing
tags: [playwright, parity, e2e, navigation, scrollspy, event-delegation, capture-phase, nuxt, vue, onmounted, FEAT-05]

# Dependency graph
requires:
  - phase: 05-navegaci-n-transversal
    provides: "05-02 app/composables/useCardNavigation.ts — the singleton accessor + effects controller whose real-browser behavior this plan proves (and whose listener-registration bug it surfaced)"
  - phase: 05-navegaci-n-transversal
    provides: "05-01 app/utils/cardNav.ts — computeActiveSection (+130) / isFichaTarget pure logic asserted live by the spec"
  - phase: 04-render-y-modos
    provides: "tests/parity/modes.spec.ts — the EXACT self-contained Playwright harness (generate-once + serve under /guiaRoma/ + color-mode-only error tolerance) mirrored verbatim here"
provides:
  - "tests/parity/navigation.spec.ts — self-contained Playwright behavior spec (generate once, serve under /guiaRoma/) proving SC#1 (highlight + scroll restore + .back-btn.show toggle), SC#2 (scrollspy switch at scrollY+130, not IntersectionObserver), SC#3 (prose-ficha interception with unchanged hash vs #reservas native jump) in a real browser — 6/6 green"
  - "A1 RESOLVED EMPIRICALLY: capture phase (+ stopPropagation) required; recorded in useCardNavigation.ts header JSDoc"
  - "Fixed the real onMounted-after-await bug in useCardNavigation.ts: FEAT-05 was DEAD in the built site (listeners never attached) — now registered synchronously"
  - "Human golden parity sign-off APPROVED — FEAT-05 navigation 100% identical to live index.html in light/dark x mobile/desktop (Core Value)"
affects: [06, busqueda, ruta-del-dia, mapa, F6, F7, navegacion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Self-contained Playwright parity spec (clone of modes.spec): beforeAll generate-once + cpSync into a guiaRoma/ tmp subdir + spawn detached `serve`, afterAll killGroup+rmSync, distinct port base (5720) to avoid worker collision, tolerate ONLY the color-mode hydration message and fail on any other console error"
    - "Playwright as the empirical decider for a runtime-ordering question (bubble vs capture, A1): the spec RED-flagged dead navigation, the fix turned it green — the test is the proof of the chosen mechanism"
    - "SYNCHRONOUS Vue lifecycle-hook registration before any `await` in an async composable/controller: onMounted/onUnmounted MUST run before the first await or Vue drops the active instance and the hook is a silent no-op; async data captured via a shallowRef holder filled after the await + a watch to keep it in sync"

key-files:
  created:
    - "tests/parity/navigation.spec.ts"
  modified:
    - "app/composables/useCardNavigation.ts"

key-decisions:
  - "A1 RESOLVED: CAPTURE phase. The spec proved the 05-02 bubble-phase listener did NOT intercept ficha navigation; the controller now registers `document.addEventListener('click', onDelegatedClick, true)` + `e.stopPropagation()` after `e.preventDefault()` (and the matching `removeEventListener(..., true)`), so the delegated handler beats NuxtLink's onClick / the native anchor jump. Header JSDoc records capture phase was empirically required."
  - "ROOT CAUSE was NOT only bubble-vs-capture: useCardNavigationController was async and registered onMounted AFTER `await useTrip('roma')`. Vue drops the active instance across an await, so the click+scroll listeners NEVER attached — FEAT-05 was dead in the built site (scrollspy marked no pill; ficha links jumped natively). Surfaced only by running the spec against the real generated site (jsdom/generate could not catch it)."
  - "FIX (Rule 1): register onMounted/onUnmounted SYNCHRONOUSLY before the useTrip await; read monById via a `shallowRef` holder (`monByIdRef`) populated after the await and kept current with `watch(monById, ...)`. The handler reads `monByIdRef.value` at click time. Both add/remove use the SAME function reference AND the SAME phase (capture=true) so removeEventListener matches."
  - "Spec is self-contained (mirror of modes.spec, NOT the golden webServer which serves the OLD index.html): generate once via ensureBuild, serve the .output/public copy under /guiaRoma/ on port base 5720; asserts behavior (.highlight via toHaveClass, scrollY deltas, .nav-pill.active, page.url() hash) — no pixel snapshots, no @nuxt/test-utils."
  - "SC#2 asserts the +130 SWITCH POINT in a real browser: scrollTo(offsetTop-130+1) activates the target pill while scrollTo(offsetTop-130-5) still shows the previous — proving the switch keys on scrollY+130, NOT on offsetTop (which is what IntersectionObserver would fire on)."

patterns-established:
  - "Pattern: in an async Nuxt composable, NEVER register onMounted/onUnmounted after an await — register synchronously first, then await data and stash it in a reactive holder. (The async-controller convention from 05-02/useTripModes is safe ONLY because the controller is awaited at the page owner; lifecycle hooks inside it must still precede its own internal awaits.)"
  - "Pattern: a self-contained parity spec is the empirical arbiter for SSR/hydration/runtime-ordering questions that unit tests and `pnpm generate` cannot observe — it caught a dead feature that built cleanly."

requirements-completed: [FEAT-05]

# Metrics
duration: ~20min (autonomous Task 1) + human sign-off (Task 2)
completed: 2026-06-21
---

# Phase 5 Plan 03: Navigation Parity Spec + A1 Resolution + onMounted-after-await Fix Summary

**A self-contained Playwright spec (`tests/parity/navigation.spec.ts`, 6/6 green) proves FEAT-05's SC#1/SC#2/SC#3 in the real generated site and empirically resolved A1 to CAPTURE phase — and in doing so surfaced a real bug: the async controller registered `onMounted` after `await useTrip`, so the click/scroll listeners never attached and FEAT-05 was dead in the built site. Fixed by synchronous hook registration + a `monById` shallowRef holder. Human golden parity sign-off APPROVED across light/dark x mobile/desktop.**

## Performance

- **Duration:** ~20 min autonomous (Task 1: spec + empirical A1 + bug fix) + human golden sign-off (Task 2)
- **Started:** 2026-06-20 (Task 1, autonomous)
- **Completed:** 2026-06-21 (Task 2, human sign-off approved)
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint, both PASSED)
- **Files modified:** 3 (1 spec created, 1 composable fixed, 1 deferred-items.md appended)

## Accomplishments
- Created `tests/parity/navigation.spec.ts` as a verbatim clone of the `modes.spec.ts` harness (generate-once `ensureBuild`, `cpSync` into a `guiaRoma/` tmp subdir, detached `serve`, `killGroup`+`rmSync` cleanup, `EXPECTED_HYDRATION_MSG` color-mode-only tolerance) on a distinct port base (5720) — with three behavior tests covering SC#1/SC#2/SC#3 in a real browser. **6/6 green** (each SC has its own assertions; spec uses `toHaveClass`/`expect.poll` for the smooth-scroll settle).
- **Empirically resolved A1 (bubble vs capture):** the spec RED-flagged that the 05-02 bubble-phase listener did not intercept ficha navigation. The committed answer is **capture phase + `stopPropagation()`**, recorded in the controller's header JSDoc.
- **Surfaced and fixed a real, latent bug** that `pnpm generate` and unit tests could not catch: `useCardNavigationController` was `async` and called `onMounted` **after** `await useTrip('roma')`. Vue drops the active component instance across an await, so the click and scroll listeners **never attached** — FEAT-05 was effectively **dead in the built site** (scrollspy marked no pill; ficha links jumped natively). The bubble-vs-capture question was downstream of this; the spec proved both at once.
- **Fix (Rule 1):** registered `onMounted`/`onUnmounted` **synchronously before** the `useTrip` await; `monById` is read via a `shallowRef` holder (`monByIdRef`) populated after the await and kept in sync with `watch(monById, ...)`; the delegated click handler reads `monByIdRef.value` at click time. Both `addEventListener`/`removeEventListener` use the same function reference and the same `capture=true` phase.
- **Human golden parity sign-off APPROVED:** the user served the built site (correctly under `/guiaRoma/`) and confirmed the navigation is identical to the live `index.html` across light+dark x mobile+desktop — smooth scroll-to-ficha + ~2.5s `.highlight` + back-stack scroll restore (SC#1), `.nav-pill.active` switching at the `+130` point (SC#2), and prose/timeline ficha interception with unchanged hash vs `#reservas` native jump (SC#3). FEAT-05 is behaviorally 100% to spec (Core Value).

## Task Commits

1. **Task 1: Self-contained navigation parity spec + empirical A1 (capture) + onMounted-after-await fix** - `1f88eb0` (fix) — adds `tests/parity/navigation.spec.ts`, fixes `app/composables/useCardNavigation.ts` (sync hook registration + capture phase + `stopPropagation`), and logs two out-of-scope full-suite items to `deferred-items.md`.
2. **Task 2: Human golden parity sign-off (navigation identical to live index.html)** - human checkpoint, **APPROVED** (no code commit; subjective parity gate, F3/F4 close pattern).

**Plan metadata:** see the final `docs(05-03)` commit (this SUMMARY + STATE.md + ROADMAP.md).

## Files Created/Modified
- `tests/parity/navigation.spec.ts` (created) — Self-contained Playwright behavior spec mirroring `modes.spec.ts`: `EXPECTED_HYDRATION_MSG` (color-mode-only tolerance), `OUTPUT_DIR`, `waitForServer`/`killGroup`/`ensureBuild`, a `beforeAll` that generates once + copies `.output/public` into a `guiaRoma/` tmp subdir + serves it detached, `afterAll` cleanup, and a `gotoHydrated` helper. Port base **5720** (distinct from modes.spec's 5700). Three tests — SC#1 (prose `#g-...` click → target `.card` gains `.highlight` + `scrollY` changes; "Volver" restores scroll + drops `.back-btn.show`), SC#2 (scrollspy active pill switches at `scrollY+130`, not at `offsetTop`/IntersectionObserver), SC#3 (prose ficha intercepted with hash unchanged vs `#reservas` section pill native jump, no `.highlight`). No pixel snapshots, no `@nuxt/test-utils`.
- `app/composables/useCardNavigation.ts` (modified) — Registered `onMounted`/`onUnmounted` **synchronously before** `await useTrip('roma')` (the A1/bug fix); `monById` captured via a `shallowRef` holder (`monByIdRef`) filled after the await + `watch(monById, ...)` to stay current. Switched the delegated click listener to **capture phase** (`document.addEventListener('click', onDelegatedClick, true)`) with `e.stopPropagation()` after `e.preventDefault()` (matching `removeEventListener(..., true)`). Header JSDoc updated to record A1 resolved = capture phase and to document why hooks must precede the await. Public API (`navigateToCard`/`goBack`/`activeSection`/`canGoBack`) unchanged.
- `.planning/phases/05-navegaci-n-transversal/deferred-items.md` (appended) — Logged the two out-of-scope full-suite items (see below).

## Decisions Made
- **Capture phase is the committed A1 answer.** The spec proved bubble phase (the 05-02 default) did not intercept; capture + `stopPropagation` is required to beat NuxtLink's `onClick` / the native anchor jump on prose MDC links.
- **The deeper fix was the listener-registration order, not just the phase.** Registering lifecycle hooks before the `useTrip` await is what made FEAT-05 actually run; the capture change alone would not have helped while the listeners were never attached. Both were validated together by the spec going RED→GREEN.
- **The spec is self-contained** (it generates and serves its own `/guiaRoma/` build) rather than reusing the golden `webServer`, because that default server serves the **old** `index.html` and would not exercise the Nuxt navigation code. It tolerates only the known color-mode hydration message and fails on any other console error.
- **Behavioral assertions over pixels:** SC#1/SC#2/SC#3 are asserted via `.highlight` class presence, `scrollY` deltas, `.nav-pill.active`, and `page.url()` hash — the pixel-parity pass is owned by Fase 8, so this spec does not rebaseline the golden.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] onMounted-after-await left FEAT-05 dead in the built site**
- **Found during:** Task 1 (running the new spec against the real generated site — it went RED).
- **Issue:** `useCardNavigationController` (from Plan 05-02) was `async` and called `onMounted(...)` **after** `await useTrip('roma')`. Vue drops the active component instance across an await, so the delegated click listener and the scroll (scrollspy) listener **never attached**. In the built site this meant ficha links jumped natively (no smooth scroll, no `.highlight`, no "Volver") and the scrollspy marked no pill — FEAT-05 was effectively dead, even though `pnpm generate` and the unit tests passed (neither observes runtime listener attachment).
- **Fix:** Registered `onMounted`/`onUnmounted` **synchronously before** the `useTrip` await. `monById` is now read via a `shallowRef` holder (`monByIdRef`) populated after the await, with `watch(monById, v => monByIdRef.value = v)` keeping it current; the click handler reads `monByIdRef.value` at click time. This was discovered/required by the spec — the empirical-A1 task surfaced it as the true root cause beneath the bubble-vs-capture symptom.
- **Files modified:** app/composables/useCardNavigation.ts
- **Verification:** `tests/parity/navigation.spec.ts` 6/6 green; `pnpm typecheck` + `pnpm lint` clean; human golden sign-off APPROVED.
- **Committed in:** `1f88eb0` (Task 1 commit)

**2. [A1 resolution — empirical] Switched the delegated listener from bubble to capture phase**
- **Found during:** Task 1 (the explicit empirical Pitfall-1 / A1 decision in `<action>`).
- **Issue:** With the listeners now attaching (deviation #1), the spec showed the bubble-phase handler still lost the click to NuxtLink's own `onClick` / the native anchor jump on prose MDC links (SC#1/SC#3 interception failing).
- **Fix:** Changed the registration to capture phase — `document.addEventListener('click', onDelegatedClick, true)` — and added `e.stopPropagation()` immediately after `e.preventDefault()` in `onDelegatedClick` (with the matching `removeEventListener('click', onDelegatedClick, true)`). Header JSDoc updated: A1 resolved = capture required. This is the planned, sanctioned one-line tweak from the plan's `<action>` / RESEARCH Pitfall 1 — not scope creep.
- **Files modified:** app/composables/useCardNavigation.ts
- **Verification:** spec green; the controller now contains `addEventListener('click', onDelegatedClick, true)` and `e.stopPropagation()` (exactly the capture-state acceptance criterion).
- **Committed in:** `1f88eb0` (Task 1 commit)

---

**Total deviations:** 2 — 1 Rule-1 bug (the real onMounted-after-await defect, latent from 05-02) and 1 planned empirical A1 resolution (capture phase). Both confined to `useCardNavigation.ts`; the public API and the verbatim `navigateToCard`/`goBack` port are unchanged.
**Impact on plan:** Necessary for correctness — without the Rule-1 fix FEAT-05 did not work in the built site at all. No scope creep; the spec did exactly its intended job (empirical arbiter) and additionally caught a dead feature that built cleanly.

## Issues Encountered

Two specs fail in the **full** `pnpm test:golden` run for reasons **independent of this plan's changes** — both reproduced/explained and logged to `deferred-items.md` (per the executor SCOPE BOUNDARY), NOT fixed here:

1. **`tests/parity/golden.spec.ts:72 — golden light (desktop)` — pixel-snapshot FLAKE.** The golden serves the live `index.html` (not any Nuxt code changed here) and **passes cleanly in isolation** (`pnpm test:golden tests/parity/golden.spec.ts` → 4/4); only `dia-viernes-light-desktop.png` flakes under parallel load (lazy-image swap + font-render nondeterminism). Owned by the **Fase 8** pixel-parity pass. → routed to F8.
2. **`tests/parity/shell.spec.ts:224 — routing dinámico /trips/[slug] (vía dev)` — ENVIRONMENTAL.** The test spawns a fresh `pnpm dev`, which cannot start because **stale `nuxi dev` processes from a prior session** (observed PIDs 40900/59568/85794/86342, started Jun 20) hold Nuxt 4's dev lock (`#acquireDevLock`). Not caused by 05-03; NOT fixed because killing the running dev servers could terminate the user's active session (destructive). Suggested latent hardening (`NUXT_IGNORE_LOCK=1` in that test's spawn env) left for the test owner.

All other parity specs (render-cards, render-timeline, render-reference, modes, theme, shell static, subpath) and the new `navigation.spec.ts` pass; `pnpm test:unit` (43), `pnpm typecheck`, `pnpm lint` are green.

No authentication gates. No packages installed (the phase installs nothing — RESEARCH §Package Legitimacy Audit; the plan's `<threat_model>` T-05-SC confirms zero new packages; `@nuxt/test-utils` deliberately NOT added to the spec).

## Threat Surface
No new security-relevant surface beyond the plan's `<threat_model>`. Switching to capture phase does not move the trust boundary (T-05-01, LOW): the delegated listener still gates on `isFichaTarget(id, monByIdRef.value)` before acting and still `preventDefault`s; `getElementById` is not an injection sink. Capture phase only changes ordering vs NuxtLink's handler. No threat flags raised.

## User Setup Required
None - no external service configuration required. Pure client-side navigation over the static SSG; no network, no persistence (the back-stack is ephemeral in-memory, parity with index.html).

## Next Phase Readiness
- **FEAT-05 is complete and proven live.** The D-05 public API (`navigateToCard`, `goBack`, `activeSection`, `canGoBack`) is stable, and — critically — the listeners now actually attach in the built site (the 05-02 latent defect is fixed). Phase 6 (search dropdown + ruta del día) and Phase 7 (map popups) can call `navigateToCard(id)` with confidence it works in production.
- `tests/parity/navigation.spec.ts` is a reusable behavior harness for the F6/F7 consumers of `useCardNavigation`.
- **Blocker carried forward (unchanged, NOT introduced here):** the F4 D1 issue — discriminated-union collections `artist`/`reference` return all-null SQL rows, so `#arte`/`#arquitectura`/`#reservas`/`#practica` do not render with real data — remains open and is unrelated to F5. `pnpm generate` still succeeds.
- **Deferred to Fase 8:** golden-light pixel flake (re-run in isolation to confirm green); optional `NUXT_IGNORE_LOCK=1` hardening for the dev-server shell test.

## Self-Check: PASSED
- FOUND: tests/parity/navigation.spec.ts
- FOUND: app/composables/useCardNavigation.ts (modified — capture phase + sync hook registration + monByIdRef holder)
- FOUND commit: 1f88eb0 (Task 1, fix)
- Task 2 (human golden parity sign-off): APPROVED by user

---
*Phase: 05-navegaci-n-transversal*
*Completed: 2026-06-21*
