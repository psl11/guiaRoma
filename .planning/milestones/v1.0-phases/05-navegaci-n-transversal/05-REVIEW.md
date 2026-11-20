---
phase: 05-navegaci-n-transversal
reviewed: 2026-06-21T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - app/utils/cardNav.ts
  - app/composables/useCardNavigation.ts
  - app/components/NavPills.vue
  - app/components/BackButton.vue
  - app/components/TripView.vue
  - tests/unit/cardNavigation.spec.ts
  - tests/parity/navigation.spec.ts
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-06-21
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the FEAT-05 cross-cutting navigation slice: the pure logic (`cardNav.ts`), the singleton accessor + effects controller (`useCardNavigation.ts`), the two wired shells (`NavPills.vue`, `BackButton.vue`), the page owner (`TripView.vue`), and both test suites.

The deliberate parity decisions called out in the phase context are sound and were NOT flagged: the `+130` scrollspy offset, the `2500`ms highlight, `scrollIntoView({behavior:'smooth',block:'start'})`, the native `document.addEventListener` in capture phase with `preventDefault()`/`stopPropagation()`, the singleton-via-`useState` pattern, and the synchronous-hook-registration-before-`await` fix. I traced these against `index.html:6380-6505` and they port 1:1. The capture-phase `stopPropagation` was specifically checked against `BackButton` (a `<button>`, not an `<a href="#...">`): `closest('a[href^="#"]')` returns null for it, so the handler early-returns and never cuts the BackButton's `@click` — correct.

One genuine BLOCKER remains: the controller hardcodes the trip slug `'roma'` while `TripView` is slug-parametric and is mounted by `/trips/[slug]` with arbitrary slugs. On any non-Roma trip the ficha discriminator is built from the wrong index, so ficha interception silently dies for that trip. Three WARNINGs and three INFO items follow.

## Critical Issues

### CR-01: Controller hardcodes `'roma'`; ficha interception is dead on every non-Roma `/trips/[slug]`

**File:** `app/composables/useCardNavigation.ts:173` (also `app/components/TripView.vue:53,59`)

**Issue:** `TripView` is slug-parametric (`defineProps<{ slug: string }>()`, line 53) and is mounted by both `app/pages/index.vue` (`slug="roma"`) **and** `app/pages/trips/[slug].vue` (`<TripView :slug="slug" />`, where `slug` is the route param). But the navigation controller ignores that prop and unconditionally fetches Roma:

```ts
const { monById } = await useTrip('roma')   // line 173 — hardcoded
monByIdRef.value = monById.value
```

`monByIdRef` is the *only* thing `isFichaTarget` checks. So when the page is `/trips/florencia`, `TripView` renders Florencia's data while the click handler decides "is this a ficha?" against **Roma's** `monById`. Every Florencia ficha anchor (`#<florencia-slug>`) returns `false` from `isFichaTarget`, so `e.preventDefault()`/`stopPropagation()`/`navigateToCard()` never run: the smooth scroll, `.highlight`, and the back-stack are all silently lost, and the link falls through to a native hash jump. The back button and scrollspy still work (they don't depend on `monById`), which makes the failure partial and easy to miss.

Secondary effect: even on `/` this fires a redundant second resolution path semantically tied to a literal rather than the prop. `useAsyncData` dedupes the Roma keys with `TripView`'s own `useTrip('roma')`, so on `/` it is merely redundant — but on a non-Roma route it pulls an *extra* unrelated trip ("roma") into the page's data graph alongside the real trip.

The `[slug].vue` route is documented (ARCH-02) as "estructura lista" and intentionally unprerendered in 1.0, so this does not break the shipped `/` output today. But it is a latent correctness bug that defeats the entire stated purpose of the multi-trip route the moment a second trip is added — exactly the "añadir un viaje = añadir ficheros, sin tocar código" guarantee.

**Fix:** Thread the slug from the caller instead of hardcoding. Accept it as a parameter and have `TripView` pass `props.slug`:

```ts
// useCardNavigation.ts
export async function useCardNavigationController(slug: string) {
  const { navigateToCard, activeSection } = useCardNavigation()
  // ...
  const { monById } = await useTrip(slug)   // not 'roma'
  monByIdRef.value = monById.value
  watch(monById, v => (monByIdRef.value = v))
}
```

```vue
<!-- TripView.vue:59 -->
await useCardNavigationController(props.slug)
```

This also removes the redundant Roma fetch on `/` (the slug is already `'roma'` there) and reuses `TripView`'s already-resolved `monById` index.

## Warnings

### WR-01: `watch(monById, …)` is registered AFTER `await` — same lifecycle-context loss the code just fixed for hooks, and it is not cleaned up

**File:** `app/composables/useCardNavigation.ts:173-177`

**Issue:** The controller's entire premise (lines 97-105) is that lifecycle registrations after an `await` in async setup lose the active instance and misbehave — which is why `onMounted`/`onUnmounted` are registered synchronously before the `await`. But `watch(monById, …)` at line 177 runs **after** `await useTrip('roma')` (line 173):

```ts
const { monById } = await useTrip('roma')   // line 173 — instance context lost past here
monByIdRef.value = monById.value
watch(monById, v => (monByIdRef.value = v)) // line 177 — registered with no active scope
```

A `watch()` created without an active component effect scope is not bound to the component, so it is **not auto-disposed on unmount**, and `onUnmounted` (lines 165-168) only removes the two event listeners — it never stops this watcher. On HMR or a future `/trips/[slug]` ↔ `/` navigation (the very scenarios the file cites as the reason `onUnmounted` exists) the watcher leaks. Depending on the Vue/Nuxt async-context state at that point, this can also emit the dev warning *"watch() ... was created outside of a component or effect scope"*. That matters here: `tests/parity/navigation.spec.ts` (lines 199-204, 244) fails on **any** console error except the color-mode hydration message, so a stray Vue warning would turn the parity suite red.

**Fix:** Capture the watch-stop synchronously, or stop it in `onUnmounted`. Simplest is to drive `monByIdRef` from a synchronously-registered `watch` on a ref that the await fills, or register the watch before the await against the eventual source. A minimal robust form:

```ts
const stop = watch(monById, v => (monByIdRef.value = v)) // after await
onScopeDispose(stop) // or store and call in onUnmounted
```

Better: move the data resolution so the `watch` is registered in the same synchronous window as the hooks (e.g. resolve `useTrip` once in `TripView` and pass `monById` into the controller), eliminating the post-await reactive registration entirely.

### WR-02: Empty-fragment anchors (`href="#"`) are mis-discriminated and the non-null assertion masks it

**File:** `app/composables/useCardNavigation.ts:138-141`

**Issue:**

```ts
const a = (e.target as HTMLElement).closest('a[href^="#"]')
if (!a) return
const id = a.getAttribute('href')!.slice(1)   // href === "#" → id === ""
if (!isFichaTarget(id, monByIdRef.value)) return
```

A bare `href="#"` (a common "do nothing / scroll-to-top" idiom, and exactly what could appear in MDC prose or a placeholder link) matches the `a[href^="#"]` selector. `"#".slice(1)` yields `""`, and `monById.has("")` is `false`, so it falls through to the native jump — which for `"#"` scrolls to the top of the page. That is probably acceptable behavior, but it is *accidental*: the non-null assertion (`!`) and the lack of an explicit guard hide the fact that `id` can legitimately be empty. If a future change ever stored an entry under `""` (or used `id ||` defaulting), this becomes a silent mis-route. The original `bindCardLinks` had the same blind spot, so this is not a parity regression, but it is fragile.

**Fix:** Guard the empty fragment explicitly and drop the assertion:

```ts
const href = a.getAttribute('href')
if (!href || href === '#') return
const id = href.slice(1)
```

### WR-03: `preventDefault()` responsibility is duplicated across the handler and `navigateToCard`

**File:** `app/composables/useCardNavigation.ts:142-144` and `:66`

**Issue:** `onDelegatedClick` calls `e.preventDefault()` (line 142) and then immediately calls `navigateToCard(id, e)`, which calls `event.preventDefault()` again (line 66). Calling `preventDefault` twice is harmless, but the same cancellation is now owned by two functions. The risk is divergence: `navigateToCard` is documented as a public API for F6 (search) and F7 (map popups), which will call it **without** going through `onDelegatedClick`. Those call sites must remember that `navigateToCard` cancels the event itself — but the handler's own duplicate `preventDefault` obscures that contract and invites a future "I'll just preventDefault at the call site" pattern that double-cancels or, worse, a refactor that removes the wrong one. The capture-phase `stopPropagation()` (line 143) is correctly the handler's sole responsibility (it is DOM-delegation-specific and must not live in the reusable `navigateToCard`).

**Fix:** Pick one owner. Since `navigateToCard` already calls `preventDefault` (and must, for its other consumers), drop the redundant `e.preventDefault()` at line 142 and keep only `e.stopPropagation()` in the handler:

```ts
if (!isFichaTarget(id, monByIdRef.value)) return
e.stopPropagation()      // delegation-specific: cut NuxtLink onClick + native jump
navigateToCard(id, e)    // owns preventDefault (its public-API contract)
```

## Info

### IN-01: `pushScroll`/`popScroll` are exported and unit-tested but never used by the shipped composable

**File:** `app/utils/cardNav.ts:51-62`; consumed only in `tests/unit/cardNavigation.spec.ts:86-98`

**Issue:** The composable mutates the `useState` array directly — `navStack.value.push(window.scrollY)` (`useCardNavigation.ts:67`) and `navStack.value.pop()` (`:79`) — and never calls `pushScroll`/`popScroll`. The pure helpers exist solely to be unit-tested. The header comment (`cardNav.ts:14-16`) frames them as helpers "para el test unitario y la delegación", but no delegation actually occurs: the shipped back-stack logic is the imperative mutation, not these functions. So the unit tests verify code paths that production does not execute. I verified the two are semantically equivalent today (`popScroll(stack).top === stack.pop()` for non-empty stacks, both no-op-safe on empty), so there is no behavioral divergence right now — hence INFO, not WARNING. But the tested logic is not the shipped logic, which means a future change to `goBack`/`navigateToCard` could regress without any unit test catching it.

**Fix:** Either delegate the real composable to these helpers (`const { top, rest } = popScroll(navStack.value); navStack.value = rest; ...`) so the tests cover the shipped path, or delete the unused exports and test the back-stack behavior through the composable/parity layer. Delegation is preferable — it matches the stated `pace.ts`/`isVisible` precedent the file invokes.

### IN-02: Three "tests" assert JavaScript's built-in `Array.length`, not project code

**File:** `tests/unit/cardNavigation.spec.ts:101-114`

**Issue:** The `canGoBack` describe block asserts `[].length > 0` → `false`, `[200].length > 0` → `true`, `[200, 450].length > 0` → `true`. These test the `Array.prototype.length` getter and the `>` operator, not anything in `cardNav.ts` or the composable. `canGoBack` is actually a `computed` in `useCardNavigation.ts:58`; it is never imported or exercised here. The block provides zero coverage of the real derivation and gives false confidence.

**Fix:** Drop the tautological block, or move `canGoBack` coverage to a Nuxt-runtime/component test (`@nuxt/test-utils`) that mounts `BackButton` and asserts `.show` toggles with the stack — which is where the actual reactive derivation lives.

### IN-03: `computeActiveSection` never breaks early on an empty `sections` array — fine, but the "vacío-antes-de-la-primera" contract depends on `#inicio` having `offsetTop: 0`

**File:** `app/utils/cardNav.ts:38-45`; consumer `app/composables/useCardNavigation.ts:150-156`

**Issue:** Not a bug — a note on a load-bearing assumption. `computeActiveSection` returns `''` when no section satisfies `scrollY + 130 >= offsetTop`. In the live DOM the first `<section>` is `#inicio` (rendered by `TheHero`, verified at `TheHero.vue:53`) with `offsetTop` 0, so at the top of the page `y = 130 >= 0` → `'inicio'`, and `activeSection` is never `''` in practice. That means `NavPills`'s `:class="{ active: activeSection === 'inicio' }"` lights up immediately on mount. This is correct and matches the original, but the empty-string default and the unit test at `cardNavigation.spec.ts:61-65` only hold because every real section starts at or below the 130px threshold. If a future layout ever pushed `#inicio` below `offsetTop 130` (e.g. a tall pre-hero banner), the first paint after `updateActivePill()` would show **no** active pill until the user scrolls — a silent divergence from the original. Worth a comment pinning the "`#inicio` is the first section and sits at the top" invariant.

**Fix:** No code change required. Optionally document the invariant at `updateActivePill` (`useCardNavigation.ts:150`) or, defensively, fall back to the first section id when `computeActiveSection` returns `''` and the page is at/near the top — only if a future layout breaks the assumption.

---

_Reviewed: 2026-06-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
