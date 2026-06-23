---
phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas
reviewed: 2026-06-23T00:00:00Z
depth: deep
files_reviewed: 8
files_reviewed_list:
  - app/components/LeafletMap.client.vue
  - app/components/TripView.vue
  - app/components/MonumentCard.vue
  - app/components/DetailPhoto.global.vue
  - app/utils/mapMarkers.ts
  - app/utils/mapOffline.ts
  - app/utils/svgMotifs.ts
  - shared/schemas.ts
  - eslint.config.mjs
findings:
  critical: 0
  warning: 3
  info: 1
  total: 4
status: resolved
---

# Phase 7: Code Review Report

**Reviewed:** 2026-06-23
**Depth:** deep
**Files Reviewed:** 9 (8 source + eslint config)
**Status:** issues_found

## Summary

Phase 7 ports the Leaflet map island, image-fallback SVG, and localStorage notes from `index.html` to the Nuxt component tree. The XSS surface is correctly contained: `v-html` is only ever fed from the static `SVG_MOTIFS` constant, never from monument data or user input. The provide/inject chain for `monumentMotif` is consistent. The `isOffline` heuristic, `deriveMarkers`, `motifSvg` utils, and the zod schema extension are all correct ports. No hardcoded secrets, no injection vectors.

Three real defects were found. Two involve missing lifecycle cleanup in `LeafletMap.client.vue` that cause breakage on HMR hot-reload (map becomes unusable without a full page reload — this blocks iterative development). The third is a missing `try/catch` around `localStorage.getItem` during the initial `onMounted` read in `MonumentCard`, which can throw uncaught in Private Browsing mode on some browsers.

---

## Warnings

### WR-01: Leaflet map instance never removed — breaks HMR and future navigation

**File:** `app/components/LeafletMap.client.vue:40-128`

**Issue:** `onMounted` initializes a Leaflet map instance but there is no `onUnmounted` hook. On every HMR hot-reload (Vue 3 remounts the component), `L.map(mapEl.value!, ...)` throws `"Map container is already initialized."` because the previous Leaflet instance was never destroyed with `map.remove()`. The `catch` block replaces the container with an error div, making the map permanently broken until a full page reload. Additionally, the `window.addEventListener('load', () => map!.invalidateSize())` listener is never removed, so it accumulates with each HMR cycle, each closure holding a stale reference to a previous map instance.

In production SSG the component mounts exactly once, so this is silent there. But it breaks the dev workflow on every file save that triggers HMR.

**Fix:**

```typescript
// At top of <script setup>, declare a ref for cleanup
let mapInstance: LeafletNS.Map | undefined
let loadHandler: (() => void) | undefined

onMounted(async () => {
  const L = (await import('leaflet')).default
  // ... existing init ...
  map = L.map(mapEl.value!, { scrollWheelZoom: false })
  mapInstance = map           // store for cleanup
  // ...
  loadHandler = () => mapInstance?.invalidateSize()
  window.addEventListener('load', loadHandler)
  setTimeout(() => mapInstance?.invalidateSize(), 300)
})

onUnmounted(() => {
  if (loadHandler) window.removeEventListener('load', loadHandler)
  mapInstance?.remove()
  mapInstance = undefined
})
```

Because `onMounted` is `async`, the `onUnmounted` hook must be registered **synchronously before the first `await`** (same pattern applied in `useCardNavigationController`). Move the `onUnmounted` registration before `await import('leaflet')`:

```typescript
onMounted(async () => { /* existing body */ })
onUnmounted(() => {
  if (loadHandler) window.removeEventListener('load', loadHandler)
  mapInstance?.remove()
})
```

`mapInstance` and `loadHandler` are module-scoped refs initialized to `undefined`, so calling `?.remove()` before init is safe.

---

### WR-02: `localStorage.getItem` in `onMounted` not wrapped in try/catch

**File:** `app/components/MonumentCard.vue:104-111`

**Issue:** The `onMounted` callback reads from `localStorage` but there is no `try/catch`:

```typescript
onMounted(() => {
  try {
    noteText.value = localStorage.getItem(NOTE_KEY) ?? ''
  }
  catch {
    // blocked: stays empty
  }
})
```

Wait — re-reading the file: the `try/catch` IS present at lines 105–111. This finding is retracted after close reading.

*Retracted — the try/catch is present at lines 104–111. No bug.*

---

### WR-02: Debounce timer `noteTimer` not cleared on unmount

**File:** `app/components/MonumentCard.vue:112-124`

**Issue:** `noteTimer` is set in `onNoteInput` with a 200 ms debounce but is never cleared via `onUnmounted`. If the user types in a notes textarea and then the component unmounts (HMR, future SPA navigation) within 200 ms, the timer fires and calls `localStorage.setItem(NOTE_KEY, v)`. There is no DOM access so it cannot throw, and the write is idempotent, but the timer holds a reference to the now-unmounted component's closure.

The original `index.html` also has no cleanup (the page never unmounts), so this is parity-faithful. However, in the Nuxt component tree the component CAN unmount (HMR, future `/trips/[slug]` navigation), making this a real — if low-severity — resource leak that differs from the original's operational context.

**Fix:**

```typescript
onUnmounted(() => {
  clearTimeout(noteTimer)
})
```

---

### WR-03: LeafletMap hardcodes `useTrip('roma')` instead of receiving slug via props

**File:** `app/components/LeafletMap.client.vue:36`

**Issue:**

```typescript
const { trip, monById } = await useTrip('roma')
```

`LeafletMap` is a child of `TripView`, which receives `props.slug` and calls `useTrip(props.slug)`. If a second trip (e.g. `florencia`) is added in v2 and `TripView` is mounted with `slug='florencia'`, `LeafletMap` will still render Roma's map data (38 Roma monuments + Roma Coliseo extra). `useAsyncData` deduplication means the `florencia` data is in a different key than `roma`, so `monById` here would contain Roma monuments regardless of the active trip.

The project notes this is "out of scope 1.0" (single-trip), but the `TripView` already accepts `slug` as a prop, establishing the multi-trip pattern. Hardcoding `'roma'` now creates a silent parity regression when the pattern is extended.

**Fix:** Accept slug as a prop or receive it from `TripView` via `provide/inject`:

```typescript
// In TripView.vue, where <LeafletMap> is used:
// <LeafletMap :slug="slug" />
//
// In LeafletMap.client.vue:
const props = defineProps<{ slug: string }>()
const { trip, monById } = await useTrip(props.slug)
```

---

## Info

### IN-01: `window.addEventListener('load')` in `onMounted` is likely dead code in SSG

**File:** `app/components/LeafletMap.client.vue:126`

**Issue:**

```typescript
window.addEventListener('load', () => map!.invalidateSize())
```

In SSG with Nuxt, `onMounted` runs during client-side hydration, which occurs **after** the browser's `load` event has already fired (the static HTML was fully parsed and assets loaded before Vue hydrated). The listener is added to a `load` event that will never fire again on the same page. The `invalidateSize()` call it is meant to trigger will therefore never execute via this path.

The `setTimeout(300)` immediately above it is the reliable recovery mechanism. The `load` listener is a port artifact from the original `index.html`, where the entire map script runs synchronously during `DOMContentLoaded` (before `load` fires). In the Vue async `onMounted` the timing is reversed.

**Fix:** Remove the `window.addEventListener('load', ...)` line. If the container resize recovery is still needed, only the `setTimeout(300)` is needed. If WR-01 is fixed (adding `onUnmounted`), the listener should also be removed there — the timing reversal makes it additionally safe to drop.

---

_Reviewed: 2026-06-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_

---

## Resolution (2026-06-23, orchestrator)

All three warnings + the info finding were fixed in-phase before completion. Parity spec still 12/12 green; typecheck / lint / unit / `generate` clean afterward.

- **WR-01 + IN-01** — `LeafletMap.client.vue`: setup-scoped `mapInstance` + `onUnmounted(() => mapInstance?.remove())` (registered before the first `await`); removed the dead `window 'load'` listener. Fixes the HMR "Map container is already initialized" breakage + listener leak.
- **WR-02** — `MonumentCard.vue`: `onUnmounted(() => clearTimeout(noteTimer))`.
- **WR-03** — `LeafletMap.client.vue` now takes a `slug` prop (`useTrip(props.slug)`); `TripView` passes `:slug="props.slug"`. Restores the multi-trip core value (add a trip = add data, no code changes).

Commit: `fix(07): resolve code-review warnings (WR-01/02/03, IN-01)`.
