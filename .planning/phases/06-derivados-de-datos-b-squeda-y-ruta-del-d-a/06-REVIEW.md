---
phase: 06-derivados-de-datos-b-squeda-y-ruta-del-d-a
reviewed: 2026-06-21T21:59:52Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - app/utils/dayRoute.ts
  - app/utils/searchIndex.ts
  - app/composables/useSearch.ts
  - app/components/SearchBox.vue
  - app/components/DaySection.vue
  - app/components/TheHero.vue
  - tests/unit/dayRoute.spec.ts
  - tests/unit/searchIndex.spec.ts
  - tests/parity/search-route.spec.ts
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 6: Code Review Report

**Reviewed:** 2026-06-21T21:59:52Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 6 ports two DOM-scraping features (`buildSearchIndex()`/`includes()` filter and `buildDayRoutes()`) of `index.html` to typed-data composables and pure utils: client search via MiniSearch 7.2.0 and the Google Maps "ruta del día" deep-link. The pure logic is high quality and faithfully ported:

- `dayRoute.ts` — `capStops` is a byte-faithful port (formula arithmetically identical to the original; sampled indices `[0,1,3,4,5,6,8,9]` for a 12-stop fixture verified correct, no spurious duplicates; bounds-safe non-null assertions given the call-site `>= 2` guard). `routeLabel` matches the original `>10 ? "(10 de N)" : "(N)"` boundary exactly, and `DaySection` passes the **uncapped** `points.length` to it as the original did. `buildDirUrl` reproduces param order, `encodeURIComponent`, and `|`-joined waypoints verbatim.
- `searchIndex.ts` — `buildHaystack` is a deliberate superset of `card.textContent` (sanctioned by CLAUDE.md / SC#1); MiniSearch config (`idField:'slug'`, boosted `name`/`italian`, `prefix`/`fuzzy:0.2`/`OR`) is sound.
- **XSS frontier is safe**: the dropdown renders rows with `{{ r.name }}` / `{{ r.day }}` (Vue auto-escape) — no `v-html`/`innerHTML` anywhere in the changed templates. The external Maps link carries `rel="noopener"` + `target="_blank"` and `encodeURIComponent`-encoded values (no SSRF surface; the link is never fetched).
- **Hook-registration-before-`await`** in `useSearchController` is correct (both `onMounted`/`onUnmounted` precede `await useTrip('roma')`), matching the proven `useCardNavigationController` A1 contract.

The one serious issue is a **cross-module integration regression**: the Phase-5 capture-phase document click listener swallows the search result's `@click`, so `onSelect` (which clears the input and closes the dropdown on selection) never runs at runtime. Navigation still works, so every test stays green — which is why the regression is invisible to CI. This is a functional-parity break against the non-negotiable parity mandate (CLAUDE.md Core Value), hence BLOCKER.

## Critical Issues

### CR-01: `onSelect` is dead at runtime — selecting a search result never clears the input or closes the dropdown (parity break)

**File:** `app/composables/useSearch.ts:85-89`, `app/components/SearchBox.vue:58`
**Issue:**
The search-result element is `<a :href="`#${r.slug}`" @click="onSelect(r.slug, $event)">` (SearchBox.vue:52-59). Vue attaches `@click` on the element in the **bubble** phase.

Meanwhile `useCardNavigationController()` (Phase 5, mounted once in `TripView`) registers a **capture-phase** delegated listener on `document`:

```js
// app/composables/useCardNavigation.ts:137-145, 160
function onDelegatedClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest('a[href^="#"]')
  if (!a) return
  const id = a.getAttribute('href')!.slice(1)
  if (!isFichaTarget(id, monByIdRef.value)) return
  e.preventDefault()
  e.stopPropagation()      // <-- halts propagation during CAPTURE
  navigateToCard(id, e)
}
document.addEventListener('click', onDelegatedClick, true) // capture
```

Every search result targets a monument slug, and the index is monuments-only (D-02), so `isFichaTarget(id, monById)` is **always true** for result clicks. The capture listener therefore runs first and calls `stopPropagation()`, which prevents the event from ever reaching the anchor's bubble-phase `@click`. Consequence:

- `navigateToCard` runs (scroll + `.highlight`, hash unchanged) — so the parity test's assertions pass.
- `onSelect` never executes, so **`isOpen.value = false` and `query.value = ''` never run**. After selecting a result, the dropdown stays `.show` and the input keeps the typed query.

The original behaved differently: the search-result handler ran in plain bubble phase alongside `bindCardLinks` (which never bound search results, and itself used no `stopPropagation`), so it cleared the input and closed the dropdown before navigating (`index.html:6459-6461`). This is an observable functional-parity divergence — the non-negotiable 1.0 bar ("lo que el usuario ve y puede hacer no cambia").

Note: the same capture+`stopPropagation` also suppresses the bubble-phase outside-click handler (`useSearch.ts:118-122,130`) for that click, so the dropdown does not self-close either; it only closes on a *subsequent* click outside `.search-wrap`.

**Fix:** Make the search-result click self-sufficient so the dropdown state is updated regardless of the capture listener. Easiest is to drive selection from `@mousedown`/`@pointerdown` (which fires before the capture `click`), or close+clear via the controller path rather than relying on the swallowed `@click`. A minimal, parity-true option: keep navigation in `onSelect` and stop the search anchor from being intercepted by giving it its own handler that runs before capture — e.g. handle on `mousedown`:

```vue
<!-- SearchBox.vue -->
<a
  v-for="r in results"
  :key="r.slug"
  :href="`#${r.slug}`"
  class="search-result"
  :data-card="r.slug"
  @mousedown.prevent="onSelect(r.slug, $event)"
>
```

and in `onSelect` perform the close/clear **and** the navigation explicitly (since `navigateToCard` already does `preventDefault` when given the event):

```ts
function onSelect(slug: string, event?: Event) {
  isOpen.value = false   // now actually runs
  query.value = ''       // now actually runs
  navigateToCard(slug, event)
}
```

Alternatively, exclude `.search-result` from the capture interceptor in `useCardNavigation.ts` (`if (a.classList.contains('search-result')) return` before `stopPropagation`), letting the anchor's own `@click` fire. Whichever path is chosen, add an assertion (see WR-01) so the behavior is covered.

## Warnings

### WR-01: Parity test does not assert post-selection state — the CR-01 regression is invisible to CI

**File:** `tests/parity/search-route.spec.ts:191-221`
**Issue:**
The "resultado → navegación" test fills the search box, clicks the first result, and asserts only (a) the target card gets `.highlight` and (b) the URL hash does not change. It never checks that the dropdown closes (`#search-results` loses `.show`) or that the input is cleared after selection — exactly the behavior CR-01 breaks. The test stays green while the user-visible behavior diverges from the original.
**Fix:** After `firstResult.click()`, assert the post-selection state the original guaranteed:

```ts
await expect(dropdown).not.toHaveClass(/\bshow\b/)        // dropdown closes
await expect(search).toHaveValue('')                       // input cleared (index.html:6459-6460)
```

These two lines would have caught CR-01.

### WR-02: `useSearchController()` is invoked without `await` — unhandled promise rejection if data fetch fails

**File:** `app/components/SearchBox.vue:32`
**Issue:**
`useSearchController` is `async` and internally does `await useTrip('roma')` (`useSearch.ts:139`). In `SearchBox` it is called as a bare statement (`useSearchController()`), so the returned promise is never awaited or caught. If `useTrip('roma')` rejects (reactive window where `useAsyncData` errors, HMR, a future non-prerendered path), this becomes an unhandled promise rejection. The proven sibling `useCardNavigationController()` is `await`-ed in `TripView` (`TripView.vue:59`), so this is an inconsistency, not the established pattern. Calling it un-awaited is intentional (keeps `SearchBox` setup synchronous so the hooks bind to the active instance), but the rejection path is unhandled.
**Fix:** Attach a catch so a data-fetch failure degrades gracefully (search simply stays empty) instead of surfacing an unhandled rejection:

```ts
useSearchController().catch((e) => {
  if (import.meta.dev) console.error('[useSearchController]', e)
})
```

(Keep it un-awaited to preserve synchronous hook registration.)

### WR-03: `onDocumentClick` can throw on a non-Element event target

**File:** `app/composables/useSearch.ts:118-122`
**Issue:**
```ts
function onDocumentClick(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.search-wrap')) {
    isOpen.value = false
  }
}
```
The `as HTMLElement` cast is a compile-time assertion only. If `e.target` is ever `null` or a non-Element node, `.closest` is `undefined` and the call throws `TypeError` — and the parity spec's console-error gate (`search-route.spec.ts:121-129`) would fail the run on any thrown error. In practice `e.target` of a `click` is virtually always an `Element`, and the original (`index.html:6467-6469`) had the same unguarded `e.target.closest`, so this is parity-equivalent and low practical risk — but it is a latent null-deref.
**Fix:** Guard for non-Element targets:

```ts
function onDocumentClick(e: MouseEvent) {
  const t = e.target
  if (t instanceof Element && !t.closest('.search-wrap')) {
    isOpen.value = false
  }
}
```

## Info

### IN-01: `buildDirUrl` / `capStops` are unguarded against empty input (call sites guard, exports do not)

**File:** `app/utils/dayRoute.ts:58-69, 77-85`
**Issue:**
`buildDirUrl([])` produces `&origin=undefined&destination=undefined` and `capStops([])` returns `[]`; both rely on non-null assertions (`points[0]!`, `points[points.length-1]!`) that are only valid because `DaySection.vue:109` gates the button on `points.length >= 2` and the unit tests only pass ≥2. As auto-imported pure utilities they could be called elsewhere with fewer points and would silently emit a malformed URL rather than failing. Verbatim-port fidelity is preserved (the original had the same shape), so this is a robustness note, not a parity defect.
**Fix (optional):** Add a defensive early return for hardening, e.g. `if (points.length < 2) return ''` in `buildDirUrl`, or document the ≥2 precondition on the export.

---

_Reviewed: 2026-06-21T21:59:52Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
