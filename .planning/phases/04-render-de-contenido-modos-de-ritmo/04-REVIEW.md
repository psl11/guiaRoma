---
phase: 04-render-de-contenido-modos-de-ritmo
reviewed: 2026-06-20T10:00:00Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - app/components/MonumentCard.vue
  - app/components/DaySection.vue
  - app/components/Timeline.vue
  - app/components/TimelineStop.vue
  - app/components/TimelineTransport.vue
  - app/components/TimelineMeta.vue
  - app/components/TimelineFood.vue
  - app/components/TimelineReservation.vue
  - app/components/GastroCard.vue
  - app/components/GastroSection.vue
  - app/components/ArtistCard.vue
  - app/components/ReservasSection.vue
  - app/components/PracticaSection.vue
  - app/components/DetailPhoto.global.vue
  - app/components/TheHero.vue
  - app/components/TripView.vue
  - app/composables/useTripModes.ts
  - app/utils/pace.ts
  - app/utils/foodGroups.ts
  - shared/schemas.ts
  - content.config.ts
  - tests/parity/render-cards.spec.ts
  - tests/parity/render-timeline.spec.ts
  - tests/parity/render-reference.spec.ts
  - tests/parity/modes.spec.ts
  - tests/unit/pace.spec.ts
  - tests/unit/foodGroups.spec.ts
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-06-20T10:00:00Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

Phase 4 delivers the full render pipeline: MonumentCard, DaySection, Timeline (5-kind dispatcher), all timeline leaf components, GastroCard/Section, ArtistCard, ReservasSection, PracticaSection, DetailPhoto.global.vue, TheHero with mode wiring, TripView as page owner, the `useTripModes` composable, and the `isVisible`/`groupFood` pure utilities. The architecture is sound and the parity rationale is well documented throughout.

Two critical issues were found. The more serious is a watch/onMounted registration leak in `useTripModes`: because the composable is called in every `TimelineStop` and `TimelineTransport` instance (not just once), each component instance independently registers the `watch(light, ...)` handler and an `onMounted` that registers three additional `localStorage` watch calls. With ~65 timeline items across 5 days, this results in ~65 redundant localStorage reads on mount and ~195 redundant `localStorage.setItem` calls per state change. The second critical issue is an uncovered null-href path in `TimelineFood` where a food entry with neither `ref` nor `href` renders `<a href="undefined">`.

Five warnings cover: the `aria-pressed` boolean-vs-string WAI-ARIA spec deviation, an incomplete test assertion (tl-food data-pace not asserted), the `useHead({ bodyAttrs })` being registered N times from multiple component instances, the hardcoded trip-specific text in ReservasSection blocking multi-trip reuse, and a TripView runtime crash risk from non-null assertions on data that `useTrip` can return null.

## Critical Issues

### CR-01: `useTripModes` called per timeline-item instance — watch accumulation causes N×localStorage writes per state change

**File:** `app/composables/useTripModes.ts:48,66-81`
**Issue:** `useTripModes()` is invoked in the `setup()` of every `TimelineStop` and `TimelineTransport` instance (verified: `TimelineStop.vue:38`, `TimelineTransport.vue:43`). The composable is not idempotent: each call unconditionally registers `watch(light, on => { if (on) pace.value = 'slow' })` (line 48) and an `onMounted` callback (line 66) that registers three more `watch` calls for localStorage persistence. With 9 stops + 4 transports per day across 5 days (~65 instances), every state change to `pace`/`light`/`resumen` fires ~65 handler invocations, and each `pace` change triggers ~65 `localStorage.setItem` calls. The `useState` singletons guarantee correct final state (all handlers write the same value), but it is not a benign redundancy: the `watch(light, ...)` at line 48 — the one that forces `pace = 'slow'` — is registered 65 times. A single `light = true` click fires 65 synchronous `pace.value = 'slow'` assignments in the same tick. Because Vue batches reactive writes, the visual result is correct, but this is an unintended consequence of the composable design: `useTripModes` was designed as a singleton (comment line 12: "estado reactivo ÚNICO"), but its side effects run once per consumer component instance.

Additionally, the three `watch(pace/light/resumen, ...)` calls inside `onMounted` accumulate across 65 component instances without cleanup. Nuxt/Vue scopes `onMounted` effects to the component's lifecycle, so the watches are torn down when each component unmounts. On a single static page that never unmounts (SPA-style scroll guide), these watches persist for the entire session multiplied by N.

**Fix:** Move all side effects out of the per-instance call. The canonical pattern for a shared composable with global side effects is to guard the one-time setup with a flag or to extract the side-effects into a dedicated singleton composable called once at the app/page level:

```typescript
// Option A — guard with a global once-flag (simplest)
let _modesInitialized = false

export function useTripModes() {
  const pace = useState<'optimistic' | 'neutral' | 'slow'>('pace', () => 'optimistic')
  const light = useState('light', () => false)
  const resumen = useState('resumen', () => false)

  if (!_modesInitialized) {
    _modesInitialized = true

    watch(light, (on) => {
      if (on) pace.value = 'slow'
    })

    useHead({
      bodyAttrs: {
        class: computed(() =>
          [light.value ? 'light-mode' : '', resumen.value ? 'modo-resumen' : '']
            .filter(Boolean)
            .join(' '),
        ),
      },
    })

    onMounted(() => {
      const savedPace = localStorage.getItem('roma-pace')
      if (savedPace === 'optimistic' || savedPace === 'neutral' || savedPace === 'slow') {
        pace.value = savedPace
      }
      if (localStorage.getItem('roma-light') === '1') light.value = true
      if (localStorage.getItem('roma-resumen') === '1') resumen.value = true

      watch(pace, v => localStorage.setItem('roma-pace', v))
      watch(light, v => localStorage.setItem('roma-light', v ? '1' : '0'))
      watch(resumen, v => localStorage.setItem('roma-resumen', v ? '1' : '0'))
    })
  }

  const isVisible = (itemPace: ItemPace) => isVisibleForPace(itemPace, pace.value)
  return { pace, light, resumen, isVisible }
}
```

Alternatively (cleaner): call `useTripModes()` only in `TheHero.vue` (which already does so for the controls) and pass `isVisible` as a prop or via `provide/inject` to TimelineStop/TimelineTransport, keeping the singleton contract.

---

### CR-02: `TimelineFood` renders `<a href="undefined">` when `entry.ref` and `entry.href` are both absent

**File:** `app/components/TimelineFood.vue:52-63`
**Issue:** `FoodEntry` in `shared/schemas.ts` defines both `ref` and `href` as `z.string().optional()`. The template uses `v-if="entry.ref"` to pick between a `#ref` anchor and an external `entry.href` link, but does not guard against the case where both are absent. When `entry.ref` is falsy and `entry.href` is `undefined`, the `v-else` branch renders `<a href="undefined">` — a broken anchor that navigates to the literal string "undefined" in the browser.

```html
<!-- Current — v-else fires even when entry.href is undefined -->
<a
  v-if="entry.ref"
  :href="`#${entry.ref}`"
  class="tl-food-name"
>{{ entry.name }}</a>
<a
  v-else
  :href="entry.href"   <!-- undefined when both ref and href absent -->
  target="_blank"
  rel="noopener"
  class="tl-food-name"
>{{ entry.name }}</a>
```

The schema permits entries with neither field (no `.refine()` enforcing exactly-one-of). While the F2 data may avoid this in practice, a schema-valid document can produce it.

**Fix:** Add a guard on `entry.href` presence, and render a `<span>` fallback when neither field is set:

```html
<a
  v-if="entry.ref"
  :href="`#${entry.ref}`"
  class="tl-food-name"
>{{ entry.name }}</a>
<a
  v-else-if="entry.href"
  :href="entry.href"
  target="_blank"
  rel="noopener"
  class="tl-food-name"
>{{ entry.name }}</a>
<span
  v-else
  class="tl-food-name"
>{{ entry.name }}</span>
```

Alternatively, add a `.refine()` to `FoodEntry` in `shared/schemas.ts` enforcing that at least one of `ref`/`href` is present (and catch it in `tests/data`), so the render branch can stay as is.

---

## Warnings

### WR-01: `useHead({ bodyAttrs })` registered once per component instance calling `useTripModes`

**File:** `app/composables/useTripModes.ts:56-64`
**Issue:** `useHead({ bodyAttrs: { class: computed(...) } })` is called inside `useTripModes()`. Because three different component types call this composable (`TheHero`, `TimelineStop`, `TimelineTransport`), Nuxt's `useHead` receives multiple independent `bodyAttrs.class` entries — one per component instance. Nuxt merges head entries using `@unhead/vue`'s stack: the last registered entry wins for non-array attributes, or they are concatenated depending on the `tagDuplicateStrategy`. In practice, having ~65 competing `class` entries on `bodyAttrs` is undefined behavior from the Nuxt head composable perspective and may produce duplicate class names in the rendered `<body>` tag (`class="light-mode light-mode light-mode ..."`).

The visual result may be correct in current versions (Vue/Unhead deduplicate identical computed values), but it is fragile and tied to implementation details of `@unhead/vue`. This is a direct consequence of CR-01 and is resolved by the same fix.

**Fix:** Move `useHead` to a single call site (see CR-01 fix). The `useHead` with `bodyAttrs` should only be registered once — either guarded by a once-flag or moved to the app/page level.

---

### WR-02: `aria-pressed` bound to a Vue `boolean` — WAI-ARIA spec requires string `"true"` / `"false"`

**File:** `app/components/TheHero.vue:119,131`
**Issue:** `:aria-pressed="light"` and `:aria-pressed="resumen"` bind Vue boolean refs directly. The WAI-ARIA 1.1 spec defines `aria-pressed` as a string enumeration (`"true"`, `"false"`, `"mixed"`, `"undefined"`). Vue renders a JavaScript `false` as the string `"false"` for boolean HTML attributes in general, but for ARIA attributes the behavior depends on the renderer version. In Vue 3 with Nuxt 4's SSR rendering, a boolean `false` is serialized as the string `"false"` on the attribute (correct), but `true` becomes the string `"true"` only if Vue treats it as a non-boolean attribute. ARIA attributes are not in Vue's boolean-attribute allowlist, so this works at runtime — but it is fragile if the renderer changes, and assistive technology should see the string form explicitly.

**Fix:**

```html
<button
  id="light-toggle"
  class="light-toggle"
  :aria-pressed="String(light)"
  @click="light = !light"
>
```

Same for `#resumen-toggle`: `:aria-pressed="String(resumen)"`.

---

### WR-03: `TripView.vue` uses non-null assertions on data that `useTrip` can return null — runtime crash on missing day/reference

**File:** `app/components/TripView.vue:58-96`
**Issue:** All five `DaySection` mounts and both reference mounts use non-null assertion (`!`) on `days.find(...)` and `refById.get(...)`:

```html
:day="days.find(d => d.slug === 'viernes')!"
:reservas="refById.get('reservas')!"
```

The comment in the file acknowledges this and states the F2 data always provides these entries. However, `days` is typed `Ref<Day[]>` which is initialized from `useAsyncData` whose `.data` starts as `null` before the async resolves. During SSR hydration, if the `computed(() => ...)` that builds `refById`/`monById` resolves before `reference.data.value` is populated, `refById.get('reservas')` returns `undefined`. The `!` silences TypeScript but does not prevent the runtime `undefined` from propagating into the prop, which expects a non-null `Reference`. Vue will pass `undefined` to `ReservasSection`'s `reservas` prop, and since `PracticaSchema`/`ReservasSchema` are required, the component's template accesses like `reservas.eyebrow` will throw at runtime.

The `await useTrip(props.slug)` at line 44 means TripView itself is async and waits for `Promise.all` to settle before the template renders — so on first render `days`/`refById` should be populated. But `useAsyncData` returns a `Ref` (reactive), and subsequent reactive updates or HMR can briefly set `.data.value` to null. In SSG this is a lower-risk window, but it is still fragile.

**Fix:** Replace the non-null assertions with conditional rendering or provide explicit fallbacks:

```html
<!-- For DaySection: -->
<template v-if="days.find(d => d.slug === 'viernes') as day">
  <DaySection :day="day" :mon-by-id="monById" />
</template>

<!-- For reference sections: -->
<ReservasSection
  v-if="refById.get('reservas')"
  :reservas="refById.get('reservas')!"
/>
```

---

### WR-04: Test `render-timeline.spec.ts` does not assert `.tl-food[data-pace]` absence — incomplete coverage of Pitfall 4

**File:** `tests/parity/render-timeline.spec.ts:155-157`
**Issue:** The test at line 155 asserts that `.tl-meta[data-pace]` and `.tl-resv-meta[data-pace]` are absent (count 0), correctly verifying Pitfall 4. However, it does NOT assert the same for `.tl-food[data-pace]`. The `food` kind has a `pace` field in the schema (visible in `shared/schemas.ts` line 113: `pace: Pace.default('all')`), but `TimelineFood` intentionally does not render `data-pace` (as documented in the component). This omission in the test means a future regression that accidentally adds `data-pace` to `.tl-food` would not be caught.

**Fix:** Add the missing assertion to the data-pace coverage test:

```typescript
// .tl-meta/.tl-food/.tl-resv-meta NO llevan data-pace (no se filtran por ritmo — Pitfall 4).
await expect(tl.locator('.tl-meta[data-pace]')).toHaveCount(0)
await expect(tl.locator('.tl-food[data-pace]')).toHaveCount(0)  // add this line
await expect(tl.locator('.tl-resv-meta[data-pace]')).toHaveCount(0)
```

---

### WR-05: `ReservasSection` hardcodes trip-specific text ("3 comensales", static h4s) — breaks multi-trip architecture

**File:** `app/components/ReservasSection.vue:73,80,90-91`
**Issue:** Three strings are hardcoded directly in the template instead of coming from the data:
- Line 73: `"✅ Ya reservado · 3 comensales"` — "3 comensales" is specific to the Roma trip.
- Line 80: `"🎟️ Visitas y entradas reservadas"` — a heading not in the `ReservasSchema`.
- Lines 90-91: `"Restaurantes · cuándo reservar y con cuánta antelación"` — a heading not in the data.

The project's core constraint (CLAUDE.md "ARCH-01: añadir un viaje = añadir ficheros, sin tocar código") is violated: a second trip with different group names or a different party size would require modifying this component. The `ReservasSchema` already has `title`/`eyebrow`/`intro` fields but not these sub-headings.

This is lower severity than a functional bug (the current Roma trip renders correctly), but it is a clear architecture violation against stated constraints.

**Fix:** Add the sub-headings to `ReservasSchema` in `shared/schemas.ts` as optional fields (to avoid breaking trips that don't have them), e.g.:

```typescript
// In ReservasSchema:
confirmedHeadMesas: z.string().optional(),   // "✅ Ya reservado · 3 comensales"
confirmedHeadVisitas: z.string().optional(), // "🎟️ Visitas y entradas reservadas"
tableHeader: z.string().optional(),          // "Restaurantes · cuándo reservar…"
```

And bind them in the template with fallback to the current strings. Alternatively, move the full text into the Roma `reservas.yml` data file.

---

## Info

### IN-01: Parity test helper functions (`waitForServer`, `killGroup`, `ensureBuild`) duplicated verbatim across all 4 parity specs

**File:** `tests/parity/render-cards.spec.ts:28-66`, `tests/parity/render-timeline.spec.ts:27-63`, `tests/parity/render-reference.spec.ts:40-76`, `tests/parity/modes.spec.ts:28-64`
**Issue:** The three helpers (`waitForServer`, `killGroup`, `ensureBuild`) and their imports (`spawn`, `spawnSync`, `cpSync`, `existsSync`, `mkdtempSync`, `mkdirSync`, `rmSync`, `tmpdir`, `join`) are copy-pasted verbatim across all four parity spec files. A fix to any of these (e.g. the `EXPECTED_HYDRATION_MSG` pattern, the server startup logic, cleanup) must be made in 4 places.

**Fix:** Extract to a shared helper module, e.g. `tests/parity/_server.ts`:

```typescript
// tests/parity/_server.ts
export function waitForServer(...) { ... }
export function killGroup(...) { ... }
export function ensureBuild() { ... }
```

Import in each spec: `import { waitForServer, killGroup, ensureBuild } from './_server'`.

---

### IN-02: Port allocation formula (`BASE + workerIndex`) does not prevent collisions when Playwright runs all 4 specs in parallel with multiple workers

**File:** `tests/parity/render-cards.spec.ts:69`, `render-timeline.spec.ts:66`, `render-reference.spec.ts:79`, `modes.spec.ts:67`
**Issue:** The port formula `BASE + Number(process.env.TEST_WORKER_INDEX ?? 0)` offsets each spec file's base by 100 (5400, 5500, 5600, 5700). This avoids inter-spec collisions only when each spec file runs on a single worker. If Playwright's `workers` setting is > 1 and the same spec file is distributed across multiple workers (unusual for the Playwright file-level worker model, but possible with shard/retry), `TEST_WORKER_INDEX` values from different workers within the same spec could collide. The current `playwright.config.ts` does not set `workers`, defaulting to half the available CPU cores. With 4 CPU cores (2 workers default), worker indices 0 and 1 per spec are safe given the 100-unit gaps. This is informational: the current defaults are safe, but the formula's safety depends on the worker count staying below 100.

**Fix:** Document the worker-count dependency explicitly, or use ephemeral OS-assigned ports:

```typescript
// Use 0 for OS ephemeral port assignment, retrieve actual port after server starts
// (requires reading the serve process stdout for the bound port)
```

---

### IN-03: `ArtistCard.vue` renders `seenIn[0].label` as an MDC link in the body of `.artist-trip` even though the semantic role of `seenIn[0]` is to provide the heading text — the heading shows `note` while label is also rendered

**File:** `app/components/ArtistCard.vue:122-125`
**Issue:** The `artist-trip-head` is populated from `artist.seenIn[0]?.note` (the first item's `note` field, which is optional and carries the heading text "✦ Lo verás en este viaje"). The loop then iterates ALL items `i in artist.seenIn`, rendering `seenIn[0].label` as an MDC link at `i=0` (since the `v-if="i !== 0"` guard only suppresses the separator, not the label itself). So `seenIn[0]` contributes both: its `note` as the heading AND its `label` as the first link in the body. This is intentional per the documented data convention (F2 comment lines 40-48), but the visual result depends entirely on the data consistently encoding `seenIn[0].note` as the heading and `seenIn[0].label` as the first navigable link.

The subtle risk: if any artist's `seenIn[0].note` is absent (it is `optional` in the `Link` schema), the `artist-trip-head` renders empty (`{{ undefined }}`), while the link from `seenIn[0].label` still appears in the body — producing an empty heading div above the links. The `?.` guard at line 123 silently swallows this.

This is not a bug given the verified F2 data, but it is a fragile data convention with no schema-level enforcement (the heading-as-note pattern is not expressed in zod, only in documentation).

**Fix (low priority):** Either document the convention as a data invariant in `tests/data/invariants.spec.ts` (e.g., assert `seenIn.length > 0 && seenIn[0].note !== undefined` for all `artist`/`arquitectura` records), or restructure the schema to separate the heading from the link array:

```typescript
// More explicit schema for artist-trip section:
seenIn: z.object({
  head: z.string(),          // "✦ Lo verás en este viaje"
  links: z.array(Link),      // the navigable links
})
```

---

_Reviewed: 2026-06-20T10:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
