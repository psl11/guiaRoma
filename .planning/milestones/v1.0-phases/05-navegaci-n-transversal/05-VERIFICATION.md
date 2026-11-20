---
phase: 05-navegaci-n-transversal
verified: 2026-06-21T11:50:00Z
status: passed
score: 3/3 must-haves verified
overrides_applied: 0
---

# Phase 5: Navegación transversal — Verification Report

**Phase Goal:** Construir `useCardNavigation` una sola vez — antes que el mapa, la búsqueda y los enlaces del timeline, sus tres consumidores — replicando el scroll-a-ficha con resaltado, la pila de "volver" que restaura el scroll, y el scrollspy con el offset crítico `+130`.
**Verified:** 2026-06-21T11:50:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| #   | Truth                                                                                                                                                                | Status     | Evidence                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SC#1 | Navigate to a ficha → smooth scroll + highlight; "back" button restores scroll via the in-memory stack | ✓ VERIFIED | `navigateToCard` is a verbatim port of index.html:6390-6398 (preventDefault, push window.scrollY, scrollIntoView smooth block:start, classList.add('highlight'), setTimeout 2500ms); `goBack` ports index.html:6403-6409 (LIFO pop, scrollTo smooth with typeof-number guard); both present in `app/composables/useCardNavigation.ts`. BackButton binds `:class="{ show: canGoBack }"` and `@click="goBack"`. Playwright spec SC#1 green (6/6): click on `a.tl-title[href="#doria-pamphilj"]` → `.card#doria-pamphilj` gains `.highlight`, `scrollY` moves; clicking `#back-btn` restores `scrollY` to origin and `.back-btn` drops `.show`. Human golden parity sign-off APPROVED. |
| SC#2 | Scrollspy highlights active nav-pill using exact `scrollY + 130 >= offsetTop` formula (last section wins), NOT IntersectionObserver | ✓ VERIFIED | `computeActiveSection` in `app/utils/cardNav.ts` is a verbatim port of index.html:6492-6496: `y = scrollY + 130`, for-loop iterate-all, `current = s.id` when `y >= s.offsetTop` (last-wins, no break), default `''`. The literal `const y = scrollY + 130` is present. Unit tests in `tests/unit/cardNavigation.spec.ts` include the decisive 874/875 boundary case: `computeActiveSection(874, [{id:'a',offsetTop:0},{id:'target',offsetTop:1000}])` returns `'target'` (874+130=1004 >= 1000), while 869+130=999 < 1000 returns `'a'` — proving +130, not 124. Playwright SC#2 asserts the switch at `offsetTop-130+MARGIN` activates `#sabado` while `offsetTop-130-MARGIN` stays on `#viernes`. No IntersectionObserver anywhere in the codebase. |
| SC#3 | Internal `a[href^="#"]` links to fichas (MDC prose, timeline tl-title) are intercepted → `navigateToCard` instead of native jump/reload | ✓ VERIFIED | Controller registers a native `document.addEventListener('click', onDelegatedClick, true)` (capture phase) with `closest('a[href^="#"]')` + `isFichaTarget(id, monByIdRef.value)` gate (D-02). `isFichaTarget` = `monById.has(id)` — ficha ids in the map are intercepted; section ids fall through to native anchor jump (D-02). `e.stopPropagation()` after `e.preventDefault()` beats NuxtLink's onClick (A1 resolved empirically by the spec). The critical `onMounted`-before-await fix (Plan 05-03) ensures listeners actually attach (the listeners were dead in the built site before this fix). Playwright SC#3 confirms: `#doria-pamphilj` timeline click → `.highlight` present, URL hash does NOT change to `#doria-pamphilj`; `#reservas` nav-pill click → hash becomes `#reservas`, no `.highlight` on `<section id="reservas">`. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | --------- | ------ | ------- |
| `app/utils/cardNav.ts` | Pure DOM-free scrollspy selector + navStack helpers + ficha predicate, auto-imported by Nuxt | ✓ VERIFIED | Exists, 72 lines. Exports `computeActiveSection` (verbatim +130 last-wins), `pushScroll`/`popScroll` (immutable LIFO), `isFichaTarget` (Map.has), and `Section` type. No window/document/useState/Vue/Nuxt in executable code. Commit 802c8f7. |
| `tests/unit/cardNavigation.spec.ts` | Vitest unit coverage of pure logic (SC#1 stack, SC#2 last-wins + +130 boundary, ficha predicate) | ✓ VERIFIED | Exists, 135 lines. Imports via `../../app/utils/cardNav` (relative, no Nuxt runtime). Contains 874/875 boundary case proving 130 not 124. No @nuxt/test-utils in executable code (mention is in JSDoc comment only). Commit 14f9886 (RED) + 802c8f7 (GREEN). |
| `app/composables/useCardNavigation.ts` | Singleton accessor + effects controller for card navigation (D-05 API) | ✓ VERIFIED | Exists, 179 lines. Exports `useCardNavigation` (pure accessor, useState singleton defaults []/'') and `export async function useCardNavigationController` (effects: capture-phase click listener + passive scroll listener). onMounted/onUnmounted registered synchronously before await (the bug fixed in 05-03). monByIdRef holder + watch pattern for async data. Commits 99d00db + 1f88eb0. |
| `app/components/NavPills.vue` | F3 shell wired with reactive .active per pill (markup unchanged) | ✓ VERIFIED | Contains `const { activeSection } = useCardNavigation()` and 9 `:class` bindings (7 structural by literal id + v-for day pills by `d.slug`). No `<style>` block. id="nav-pills", "Pratica" verbatim preserved. Commit ec43fe1. |
| `app/components/BackButton.vue` | F3 shell wired with reactive .show + @click=goBack (markup unchanged) | ✓ VERIFIED | Contains `<script setup lang="ts">` with `const { canGoBack, goBack } = useCardNavigation()`, `:class="{ show: canGoBack }"`, and `@click="goBack"`. id="back-btn", aria-label="Volver", ← glyph preserved verbatim. No `<style>`. Commit ec43fe1. |
| `app/components/TripView.vue` | Page owner invokes useCardNavigationController() exactly once | ✓ VERIFIED | Contains exactly 1 `useCardNavigationController()` call (after `await useTrip(props.slug)`). No `@click` on `<main>`. Template unchanged. Commit ec43fe1. |
| `tests/parity/navigation.spec.ts` | Self-contained Playwright behavior spec covering SC#1/SC#2/SC#3 | ✓ VERIFIED | Exists, 334 lines. Mirrors modes.spec.ts harness verbatim (EXPECTED_HYDRATION_MSG, generate-once ensureBuild, cpSync into guiaRoma/ tmp subdir, detached serve, killGroup+rmSync). Port base 5720 (distinct from modes.spec's 5700). 3 behavior tests covering SC#1/SC#2/SC#3. No @nuxt/test-utils import. Commit 1f88eb0. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `tests/unit/cardNavigation.spec.ts` | `app/utils/cardNav.ts` | Direct relative import `from '../../app/utils/cardNav'` | ✓ WIRED | Import confirmed at line 2 of spec; all 4 functions imported: `computeActiveSection`, `pushScroll`, `popScroll`, `isFichaTarget`. |
| `app/composables/useCardNavigation.ts` | `app/utils/cardNav.ts` | Auto-import `computeActiveSection` (Nuxt auto-import from app/utils/) | ✓ WIRED | `activeSection.value = computeActiveSection(window.scrollY, sections)` at line 155; `isFichaTarget(id, monByIdRef.value)` at line 141. Both called in executable code paths. |
| `app/composables/useCardNavigation.ts` | `app/composables/useTrip.ts` | `await useTrip('roma')` for monById (via shallowRef holder) | ✓ WIRED | Line 173: `const { monById } = await useTrip('roma')` + line 174: `monByIdRef.value = monById.value` + line 177: `watch(monById, v => (monByIdRef.value = v))`. monByIdRef used in onDelegatedClick at line 141. |
| `app/components/TripView.vue` | `app/composables/useCardNavigation.ts` | `await useCardNavigationController()` called once in `<script setup>` | ✓ WIRED | Line 59: `await useCardNavigationController()`. Count = 1 (confirmed by grep -c). |
| `app/components/NavPills.vue` | `app/composables/useCardNavigation.ts` | `useCardNavigation()` accessor for `activeSection` | ✓ WIRED | `const { activeSection } = useCardNavigation()` in script setup; `activeSection` used in 9 `:class` bindings across all pills. |
| `app/components/BackButton.vue` | `app/composables/useCardNavigation.ts` | `useCardNavigation()` accessor for `canGoBack` + `goBack` | ✓ WIRED | `const { canGoBack, goBack } = useCardNavigation()`; both used in template (`:class="{ show: canGoBack }"`, `@click="goBack"`). |
| `tests/parity/navigation.spec.ts` | `.output/public` (pnpm generate) | `ensureBuild()` + `cpSync` + detached static server at `/guiaRoma/` | ✓ WIRED | Pattern `guiaRoma`, `generate`, `EXPECTED_HYDRATION_MSG` all confirmed present. Port 5720 distinct from 5700. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `useCardNavigation.ts` (controller) | `monByIdRef` (Map of monument slugs) | `await useTrip('roma')` → zod-validated YAML content via Nuxt Content v3 queryCollection | Yes — monById is a ComputedRef<Map<slug, Monument>> built from real content (populated in Phase 2/3). watch keeps it in sync post-hydration. | ✓ FLOWING |
| `NavPills.vue` | `activeSection` (string state) | `useState<string>('cardNav:activeSection', () => '')` populated by `computeActiveSection(window.scrollY, sections)` in scroll listener and onMounted | Yes — real DOM section offsetTop values at runtime; not hardcoded. | ✓ FLOWING |
| `BackButton.vue` | `canGoBack` (computed) | `computed(() => navStack.value.length > 0)` where navStack is `useState<number[]>('cardNav:stack', () => [])` mutated by `navigateToCard` | Yes — mutated by real user clicks pushing real `window.scrollY` values. | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| SC#2: `computeActiveSection(874, [{id:'a',offsetTop:0},{id:'target',offsetTop:1000}])` = `'target'` (874+130=1004>=1000) | `node -e "..."` | `'target'` | ✓ PASS |
| SC#2: `computeActiveSection(869, ...)` = `'a'` (869+130=999<1000) | `node -e "..."` | `'a'` | ✓ PASS |
| SC#3: `isFichaTarget('g-fortunata', monById)` = `true` | `node -e "..."` | `true` | ✓ PASS |
| SC#3: `isFichaTarget('reservas', monById)` = `false` (section, not intercepted) | `node -e "..."` | `false` | ✓ PASS |
| SC#1: `pushScroll([],200)→[200]`, `pushScroll([200],450)→[200,450]`, `popScroll([200,450])→{top:450,rest:[200]}`, `popScroll([])→{top:undefined,rest:[]}` | `node -e "..."` | All correct | ✓ PASS |
| Unit test suite: `pnpm test:unit` | 43 tests across 5 files | 43 passed, 0 failed | ✓ PASS |
| `highlight` class manipulation in production bundle | `grep -r "classList.*highlight" .output/public/_nuxt/*.js` | 10 matches | ✓ PASS |
| `scrollIntoView`/`scrollTo` in production bundle | `grep -r "scrollIntoView\|scrollTo" .output/public/_nuxt/*.js` | 2 matches | ✓ PASS |

### Probe Execution

No probe scripts declared for Phase 5. The empirical validation was performed via the self-contained Playwright spec `tests/parity/navigation.spec.ts`. Per 05-03 SUMMARY: 6/6 green (SC#1/SC#2/SC#3, desktop + mobile). Human golden parity sign-off: APPROVED.

Note on full-suite `pnpm test:golden` context: two pre-existing / environmental failures unrelated to Phase 5 changes are documented in `deferred-items.md`:
- `golden.spec.ts:72` — pixel-snapshot flake in the LIVE `index.html` golden (not Nuxt code); passes in isolation; owned by Phase 8.
- `shell.spec.ts:224` — stale nuxi dev processes holding Nuxt 4's dev lock; environmental, not caused by Phase 5.
The navigation spec itself (6/6) is clean.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| FEAT-05 | 05-01, 05-02, 05-03 | Navegación a ficha con resaltado + botón "volver" (pila) que restaura el scroll, y scrollspy de pastillas con el mismo offset | ✓ SATISFIED | Implemented in `app/utils/cardNav.ts` (pure logic), `app/composables/useCardNavigation.ts` (singleton controller), wired into NavPills/BackButton/TripView. Unit tests (43/43) + Playwright SC#1/SC#2/SC#3 (6/6) + human sign-off confirm behavior. REQUIREMENTS.md traceability: `FEAT-05 | Phase 5 | Complete`. |

No orphaned requirements: REQUIREMENTS.md maps FEAT-05 exclusively to Phase 5. All other Phase 5 plan frontmatter `requirements:` fields list FEAT-05 only. No REQUIREMENTS.md entries map additional IDs to Phase 5.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| (none) | — | — | — | — |

No TBD/FIXME/XXX markers found in any Phase 5 modified files. No stub implementations, no hardcoded empty returns in data-flow paths, no return null / return {} in observable behaviors.

Note: The reference to `@nuxt/test-utils` in `tests/unit/cardNavigation.spec.ts` is in a JSDoc comment (line 24), not an import — it is cited as something deliberately avoided, not used.

### Human Verification (completed)

The Task 2 checkpoint in Plan 05-03 was a `type: checkpoint:human-verify` gate with `gate="blocking"`. It has been APPROVED by the developer.

The developer verified (per 05-03 SUMMARY):
1. SC#3 + SC#1 (ficha interception): prose/timeline links glide smoothly to the ficha, the ficha shows the gold `.highlight` border for ~2.5s, the URL hash does NOT change, and the "Volver" button appears bottom-right.
2. SC#1 (back stack): clicking "Volver" glides back to the prior scroll position, and "Volver" disappears.
3. SC#3 (sections jump natively): clicking a SECTION pill results in a native anchor jump, the URL hash becomes `#reservas`, and NO highlight border — proving only fichas are intercepted.
4. SC#2 (scrollspy): the active nav pill switches at the same point as the live `index.html` (the `+130` offset).
5. Verified in BOTH light and dark theme and at mobile + desktop widths.

Sign-off: **APPROVED** (recorded in 05-03-SUMMARY.md and commit 1f88eb0).

### Gaps Summary

No gaps. All 3 success criteria verified, all artifacts present and substantive and wired with real data flow, FEAT-05 requirement fully satisfied, unit tests passing (43/43), Playwright behavior spec green (6/6), human parity sign-off approved.

The critical `onMounted`-before-await bug (listeners never attaching in the built site) was identified and fixed within the phase (Plan 05-03 deviation #1, commit 1f88eb0) before the human sign-off gate. This means the shipped code never had this defect — it was caught and corrected before the phase was declared complete.

The scope note about hardcoded `useTrip('roma')` slug (CR-01) is acknowledged: this is a plan-ratified 1.0 scope decision. The multi-trip `[slug]` route is intentionally deferred to v2. The Roma guide at `/` ships and functions correctly.

---

_Verified: 2026-06-21T11:50:00Z_
_Verifier: Claude (gsd-verifier)_
