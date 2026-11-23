# Phase 5: Navegación transversal - Pattern Map

**Mapped:** 2026-06-21
**Files analyzed:** 6 (2 new, 4 modified) + 2 read-only sources
**Analogs found:** 6 / 6 (every file has a strong in-repo analog — this is a parity port, not new design)

> **Read first (load-bearing for every plan):** `index.html` is the **source of truth of parity**. The three behaviors already exist there as 30 lines of tested vanilla JS. Plans port them **1:1** into the established singleton-composable scaffolding; they do **not** reinvent the logic. The only genuinely new friction is Nuxt-specific (Pitfall 1: prose links are `NuxtLink`). See `05-RESEARCH.md` for the full pitfall analysis.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/composables/useCardNavigation.ts` | composable (singleton + controller) | event-driven (click/scroll) | `app/composables/useTripModes.ts` | **exact** (same accessor+controller split, same `useState` singleton, same `onMounted` init) |
| `app/components/TripView.vue` | component (page owner / controller host) | event-driven | itself (already hosts the page; invoke a controller like `TheHero` does) | **exact** (controller-invocation precedent: `TheHero` calls `useTripModesController()` once) |
| `app/components/NavPills.vue` | component (F3 shell) | request-response (reactive class binding) | `app/components/TheHero.vue` pace-btn binding + the shell itself | **exact** (F3→F4 "add reactive `:class` to a mounted shell" pattern) |
| `app/components/BackButton.vue` | component (F3 shell) | request-response (`@click` + reactive class) | `app/components/TheHero.vue` toggle binding + the shell itself | **exact** (F3→F4 add `@click` + `:class` to a mounted shell) |
| `app/utils/cardNav.ts` (pure-logic extraction) | utility | transform (pure functions) | `app/utils/pace.ts` | **exact** (DOM-free pure fn extracted to `app/utils/`, auto-imported, unit-tested) |
| `tests/unit/cardNavigation.spec.ts` | test (unit) | transform | `tests/unit/pace.spec.ts` | **exact** (Vitest plain, imports the pure util directly) |
| `tests/parity/navigation.spec.ts` | test (behavior/E2E) | event-driven | `tests/parity/modes.spec.ts` | **exact** (self-contained build+serve under `/guiaRoma/`) |
| `app/composables/useTrip.ts` | (read-only source) | — | provides `monById` — the ficha-vs-section discriminator | n/a |

**Note on naming/eslint:** `useCardNavigation` is a **composable** (not a component) — `vue/multi-word-component-names` does not apply. The CONTEXT.md aside ("nombre de 1 palabra ya está en la allowlist si aplica") does **not** apply: the eslint allowlist (`eslint.config.mjs:18-39`) only exempts the single-word **components** `Topbar` and `Timeline`; `NavPills`/`BackButton` are explicitly noted there as already-multi-word with the rule active. No eslint change is needed for this phase.

---

## Pattern Assignments

### `app/composables/useCardNavigation.ts` (NEW — singleton accessor + effects controller)

**Analog:** `app/composables/useTripModes.ts` (the exact precedent — read it whole before writing).
**Parity source:** `index.html:6381-6409` (nav+stack), `index.html:6485-6501` (scrollspy), `index.html:6648-6659` (init).

**Two-part split to copy (the load-bearing structure)** — from `useTripModes.ts:45-105`:

```typescript
// ACCESSOR (pure, idempotent, callable from ANY component — NavPills/BackButton/future F6/F7)
export function useTripModes() {
  const pace = useState<'optimistic' | 'neutral' | 'slow'>('pace', () => 'optimistic') // DEFAULT = prerendered
  const light = useState('light', () => false)
  const resumen = useState('resumen', () => false)
  const isVisible = (itemPace: ItemPace) => isVisibleForPace(itemPace, pace.value)
  return { pace, light, resumen, isVisible }
}

// CONTROLLER (side-effects, called ONCE in TheHero — the component that mounts once)
export function useTripModesController() {
  const { pace, light, resumen } = useTripModes()
  watch(light, (on) => { if (on) pace.value = 'slow' })
  useHead({ bodyAttrs: { class: computed(() => /* ... */) } })
  onMounted(() => {
    // restore from localStorage + register persist watches IN onMounted (avoids writing in prerender)
  })
}
```

`useCardNavigation()` (accessor) returns `{ navStack, activeSection, canGoBack, navigateToCard, goBack }`. `useCardNavigationController()` (effects) registers the two global listeners in `onMounted` and cleans up in `onUnmounted`. **Why two parts:** Pitfall 4 — if the controller ran per consumer there would be N click/scroll listeners (the exact bug `useTripModes` fixed; see its header comment `useTripModes.ts:17-26`).

**Default state = prerendered HTML** (copy the discipline from `useTripModes.ts:46` `() => 'optimistic'` and its header `:28-33`):
```typescript
const navStack = useState<number[]>('cardNav:stack', () => [])        // [] = no .show on BackButton
const activeSection = useState<string>('cardNav:activeSection', () => '') // '' = no .active pill
const canGoBack = computed(() => navStack.value.length > 0)           // → BackButton :class="{ show }"
```
`activeSection` must default to `''` and `navStack` to `[]` so the first paint matches the F3 shells' SSR markup (no `.active`, no `.show`) → zero hydration mismatch. The real `updateActivePill()` runs in `onMounted` (client), mirroring `index.html:6655` `init()`.

**Navigation + stack — port VERBATIM from `index.html:6390-6409`** (the source of truth):
```javascript
function navigateToCard(id, event) {
  if (event) event.preventDefault();              // 6391 — D-03: URL does NOT change
  navStack.push(window.scrollY);                  // 6393
  const el = document.getElementById(id);
  if (el) {                                        // 6395 — guard ported verbatim (Pitfall 2)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' }); // 6396 (Pitfall 5: scroll-padding-top covers the fixed header)
    el.classList.add('highlight');                // 6397 — imperative classList.add is CORRECT here (MDC-rendered card, transient 2500ms)
    setTimeout(() => el.classList.remove('highlight'), 2500); // 6398 — 2500ms exact
  }
  updateBackBtn();                                 // 6400 — replaced by reactive canGoBack computed
}
function goBack() {
  const prev = navStack.pop();                     // 6404
  if (typeof prev === 'number') {
    window.scrollTo({ top: prev, behavior: 'smooth' }); // 6406
  }
  updateBackBtn();                                 // 6408 — replaced by reactive canGoBack
}
```
The imperative `updateBackBtn()` (`index.html:6385-6388`) is **replaced** by the reactive `canGoBack` computed — `:class="{ show: canGoBack }"` updates itself when `navStack.length` changes. **Do NOT port `highlightCard` (`index.html:6411-6417`)** — it is a legacy alias for old inline `onclick`s that no longer exist (confirmed dropped in RESEARCH §State of the Art).

**Reactivity note (A2):** `navStack.value.push(...)` on a `useState` array-ref IS reactive in Vue 3 (the ref wraps the array in a reactive proxy that tracks mutations); `canGoBack` recomputes. If a test ever shows `.show` not appearing, fall back to reassignment `navStack.value = [...navStack.value, window.scrollY]`.

---

### `app/composables/useCardNavigation.ts` — the two listeners (controller body)

**Analog for the listener lifecycle:** `useTripModes.ts:88-104` (`onMounted` block). **But** the registration mechanism differs (see Pitfall 1 below): **native `addEventListener`, NOT a Vue `@click`.**

**Delegated click listener — port the discriminator from D-01, NOT the DOM-scan `bindCardLinks`:**
```typescript
function onDelegatedClick(e: MouseEvent) {
  const a = (e.target as HTMLElement).closest('a[href^="#"]')
  if (!a) return
  const id = a.getAttribute('href')!.slice(1)
  if (!monById.value.has(id)) return   // section (e.g. #reservas) → native anchor jump (D-02)
  e.preventDefault()                    // D-03: URL does not change
  navigateToCard(id, e)
}
```
`monById` comes from `useTrip()` (see read-only source below). This replaces `index.html:6420-6429` `bindCardLinks()` (`querySelectorAll('.card')` + `dataset.bound` per link — the DOM-scan anti-pattern D-01 forbids; CLAUDE.md §"Buscar scrapeando el DOM"). One listener covers prose MDC links + `tl-title` + future search/map.

**Scrollspy listener — port VERBATIM from `index.html:6488-6501`:**
```javascript
function updateActivePill() {
  const scrollY = window.scrollY + 130;   // 6492 — +130 > scroll-padding-top:124px (LOAD-BEARING, comment 6489-6491)
  let current = '';
  sections.forEach(s => {                  // 6494 — iterate ALL <section>
    if (scrollY >= s.offsetTop) current = s.id; // 6495 — LAST that satisfies wins
  });
  navPills.forEach(p => {                   // 6497 — replaced by reactive :class in NavPills
    p.classList.toggle('active', p.getAttribute('href') === '#' + current);
  });
}
window.addEventListener('scroll', updateActivePill, { passive: true }); // 6501 — {passive:true} is PARITY, not just perf
```
In the Vue port, `updateActivePill` sets `activeSection.value` (the imperative `classList.toggle` is replaced by NavPills' reactive `:class`). The `+130` must stay literal; rounding to 124 advances the switch ~24px (Pitfall 3).

**Listener lifecycle (native register + cleanup) — Pattern from RESEARCH §Pattern 3:**
```typescript
onMounted(() => {
  document.addEventListener('click', onDelegatedClick)            // Pitfall 1: NATIVE, not Vue @click; document scope (Open Q 1 → document)
  window.addEventListener('scroll', updateActivePill, { passive: true }) // {passive:true} verbatim (6501)
  updateActivePill()                                              // initial calc, mirrors init() index.html:6655
})
onUnmounted(() => {
  document.removeEventListener('click', onDelegatedClick)         // same fn reference
  window.removeEventListener('scroll', updateActivePill)
})
```
`onUnmounted` cleanup is defensive hygiene (HMR/future `/trips/[slug]` nav) — the original never cleans up because the page lives forever (`useTripModes.ts` itself only uses `onMounted`; adding `onUnmounted` here is the one delta).

---

### `app/components/TripView.vue` (MODIFY — invoke the controller ONCE)

**Analog (controller-invocation precedent):** `app/components/TheHero.vue:48-49` — the only place that calls `useTripModesController()`:
```typescript
useTripModesController()                          // TheHero.vue:48 — effects registered exactly once
const { pace, light, resumen } = useTripModes()  // TheHero.vue:49 — accessor for the controls
```
TripView is the **page owner** (`TripView.vue:46-54`: `defineProps<{ slug: string }>()` + `await useTrip(props.slug)`), mounted exactly once → it is the natural host for `useCardNavigationController()`, exactly as TheHero hosts the modes controller. Add the call in `<script setup>`:
```typescript
useCardNavigationController()   // registers delegated click + scroll listeners once (RESEARCH §Component Responsibilities)
```
**Do NOT** add a Vue `@click` wrapper `<div>` around `<main>` for the delegation — the controller registers a native `document` listener (Pitfall 1). `<template>` is unchanged. `monById` is already destructured here (`TripView.vue:48`) and passed to DaySection; the controller reads it via its own `useTrip()` accessor inside the composable.

---

### `app/components/NavPills.vue` (MODIFY — reactive `.active`, do NOT restructure DOM)

**Analog (add reactive `:class` to a mounted F3 shell, F3→F4 pattern):** `app/components/TheHero.vue` pace-btn binding, described in its header `TheHero.vue:33-36` ("solo se añaden bindings reactivos sobre los controles existentes... el 1º pierde su clase estática `active` LITERAL"). NavPills has **no** static `active` class to remove (the shell `NavPills.vue:25-58` is plain `class="nav-pill"`), so this is even simpler — just append `:class`.

**Current shell (`NavPills.vue:24-59`) — markup stays byte-identical, only `:class` is added:**
```vue
<!-- before (F3) -->  <a href="#inicio" class="nav-pill">Inicio</a>
<!-- after  (F5) -->  <a href="#inicio" class="nav-pill" :class="{ active: activeSection === 'inicio' }">Inicio</a>

<!-- day pills (v-for at NavPills.vue:34-38) — compare against d.slug -->
<a v-for="d in props.days" :key="d.slug" :href="`#${d.slug}`" class="nav-pill"
   :class="{ active: activeSection === d.slug }">{{ dayLabel(d.eyebrow) }}</a>
```
Add to `<script setup>` (`NavPills.vue:15-17` currently only imports `Day` + `defineProps`):
```typescript
const { activeSection } = useCardNavigation()   // pure accessor, no effects
```
**Constraints (from `NavPills.vue:11-14` header + D-blocked):** the 7 structural pills (verbatim grafías incl. "Pratica") and 5 day pills, their order, `id="nav-pills"`, and the `href`s are all locked. NO `<style scoped>` (a `data-v-*` would break `.nav-pill.active` at `base.css:90`). The `:class` object merges with the static `class="nav-pill"` — both are kept.

---

### `app/components/BackButton.vue` (MODIFY — `@click="goBack"` + reactive `.show`, do NOT restructure DOM)

**Analog (add `@click` + reactive `:class` to a mounted F3 shell):** `app/components/TheHero.vue` toggle binding (`TheHero.vue:37-40`: `#light-toggle`/`#resumen-toggle` get `@click` that toggles the boolean + reactive `:aria-pressed`).

**Current shell (`BackButton.vue:13-19`) — markup stays identical, add `:class` + `@click`:**
```vue
<!-- before (F3): button with id/class/aria-label only, NO handler -->
<button id="back-btn" class="back-btn" aria-label="Volver">
  <span class="back-btn-arrow">←</span> Volver
</button>
<!-- after (F5) -->
<button id="back-btn" class="back-btn" :class="{ show: canGoBack }" aria-label="Volver" @click="goBack">
  <span class="back-btn-arrow">←</span> Volver
</button>
```
Add to `<script setup>` (BackButton.vue currently has **no** `<script>` block — add one):
```typescript
const { canGoBack, goBack } = useCardNavigation()   // pure accessor
```
**Constraints (from `BackButton.vue:3-11` header):** keep `id="back-btn"` (F5 reveals it via `.show`), the `aria-label="Volver"` verbatim, the literal `←` glyph in `.back-btn-arrow`. NO `<style scoped>` (would break `.back-btn.show` at `base.css:1025`). In repose (no `.show`) the CSS at `base.css:1001-1029` keeps it off-screen/invisible → golden unaffected.

---

### `app/utils/cardNav.ts` (NEW — pure-logic extraction for unit tests)

**Analog:** `app/utils/pace.ts` (the exact precedent — a DOM-free pure function extracted to `app/utils/`, auto-imported by Nuxt AND unit-tested in plain Vitest). Read `pace.ts:1-37` for the structure: JSDoc citing the `index.html` line, exported types, single pure function with the parity matrix.

**`computeActiveSection` — the testable last-wins selector** (RESEARCH §Code Examples, from `index.html:6488-6501`):
```typescript
// Source: index.html:6492-6496 (source of truth). Pure, DOM-free.
export function computeActiveSection(scrollY: number, sections: { id: string, offsetTop: number }[]): string {
  const y = scrollY + 130            // +130 > scroll-padding-top:124px (6489-6491, load-bearing)
  let current = ''
  for (const s of sections) {
    if (y >= s.offsetTop) current = s.id   // LAST that satisfies wins (6494-6496)
  }
  return current
}
```
The controller's `updateActivePill` reads the real DOM and delegates the algorithm here (exactly as `useTripModes.isVisible` delegates to `pace.isVisible` — see `useTripModes.ts:50-51` + comment `:39-42`). Optionally also extract the ficha-vs-section predicate (`(id, monById) => monById.has(id)`) and the navStack push/pop as pure helpers if the planner wants them unit-covered without DOM. **Mirror `pace.ts`'s discipline:** JSDoc cites the `index.html` line range; no I/O, no state, no Nuxt/Vue dependency.

---

### `tests/unit/cardNavigation.spec.ts` (NEW — pure-logic unit test)

**Analog:** `tests/unit/pace.spec.ts` (read it whole — `pace.spec.ts:1-55`). Copy the exact shape:
```typescript
import { describe, it, expect } from 'vitest'
import { computeActiveSection } from '../../app/utils/cardNav'   // direct import, NO Nuxt runtime, NO @nuxt/test-utils

describe('computeActiveSection — scrollspy last-wins (FEAT-05, SC#2)', () => {
  it('...', () => { expect(computeActiveSection(/* scrollY */, [/* fixtures */])).toBe('...') })
})
```
**Coverage to map (RESEARCH §Validation Architecture, Wave 0):** SC#1 navStack push/pop LIFO + `canGoBack` flip; SC#2 `computeActiveSection` last-wins **including the +130 vs 124 boundary case** (a section at `offsetTop` between `scrollY+124` and `scrollY+130` must activate — this is what proves the `+130` is load-bearing); the ficha-vs-section predicate against a mock `Map`. Picked up by `vitest.config.ts` (`include: ['tests/unit/**']`, line 20). Run: `pnpm test:unit` (`package.json:18`).

---

### `tests/parity/navigation.spec.ts` (NEW — behavior/E2E test)

**Analog:** `tests/parity/modes.spec.ts` (the exact self-contained pattern — read `modes.spec.ts:1-107` for the harness scaffolding). Copy verbatim:
- The helpers `waitForServer` / `killGroup` / `ensureBuild` (`modes.spec.ts:28-64`).
- The `beforeAll` that runs `pnpm generate` once, copies `.output/public` → a `guiaRoma/` subdir in a tmpdir, and serves it under `/guiaRoma/` via `pnpm dlx serve` (`modes.spec.ts:74-90`).
- The `afterAll` cleanup (`modes.spec.ts:92-97`).
- The `gotoHydrated` helper (`modes.spec.ts:100-106`) — wait for hydration before interacting; assert a known reactive state to confirm hydration (here: e.g. wait until `.back-btn` exists / a known section becomes active).
- The hydration-error tolerance: `EXPECTED_HYDRATION_MSG` for color-mode (`modes.spec.ts:25, 110-114`) — tolerate ONLY that, fail on any other console error.

**Coverage to map (RESEARCH §Phase Requirements → Test Map):**
- **SC#1** — click a prose `<a href="#g-...">` in a `.card-section` → target `.card` gains `.highlight`, scroll position changes; click "Volver" → scroll returns, `.back-btn.show` disappears. Use `page.evaluate(() => window.scrollTo(0, Y))` + assert (helper pattern already in `modes.spec.ts`).
- **SC#2** — scroll to an offset → correct `.nav-pill.active`; assert switch point matches `scrollY+130` (NOT IntersectionObserver timing).
- **SC#3** — click an `<a href="#g-...">` (ficha) → highlighted + stack; click `#reservas` (section pill) → NO highlight, native anchor jump (URL hash changes — proves only fichas are intercepted, D-02/D-03).

**Note:** `tests/parity/**` is excluded from eslint (`eslint.config.mjs:16`) — it is an independent harness, formatted as in `modes.spec.ts`. Run: `pnpm test:golden` (`package.json:14`). This phase adds **no** new test dependency (do NOT install `@nuxt/test-utils` — RESEARCH §Environment Availability).

---

### `app/composables/useTrip.ts` (READ-ONLY source — provides `monById`)

**No edit.** The delegated listener consults `useTrip().monById` to discriminate ficha vs section. `monById` is a `computed<Map<slug, Monument>>` built by `buildTripIndexes` (`useTrip.ts:59-65`), keyed by **slug** (= `#id` of index.html, = the `href` fragment). The chain is coherent by construction: `<article :id="monument.slug">` (`MonumentCard.vue:111-113`), prose/`tl-title` links use `#${ref}` where `ref === slug` (`TimelineStop.vue:48-52`), and `monById` is keyed by slug. The controller calls `const { monById } = useTrip('roma')` (or the active slug) inside `useCardNavigationController`. **Confirm** the same slug TripView uses is passed (Pitfall 2).

---

## Shared Patterns

### Singleton composable: accessor (pure) + controller (effects)
**Source:** `app/composables/useTripModes.ts:45-105` (the canonical precedent; header rationale `:17-26`).
**Apply to:** `useCardNavigation.ts` — `useCardNavigation()` (pure, called by NavPills/BackButton/F6/F7) + `useCardNavigationController()` (listeners, called once in TripView). State via `useState` (SSR-safe singleton, no module-level mutable ref that would leak across prerender requests).

### Default state = prerendered HTML (zero hydration mismatch)
**Source:** `app/composables/useTripModes.ts:46` (`() => 'optimistic'`) + header `:28-33`; RESEARCH §Pattern 2.
**Apply to:** `useCardNavigation.ts` — `navStack` defaults `[]`, `activeSection` defaults `''`. The F3 shells render with no `.active`/`.show` in SSR; any non-empty default would mark a pill the prerendered HTML doesn't → mismatch. Real values computed in `onMounted`.

### Reactive class/handler binding on a mounted F3 shell (do NOT touch DOM)
**Source:** `app/components/TheHero.vue:33-40` (header) — pace-btn `:class="{ active }"` + `@click`; toggles `@click` + reactive `:aria-pressed`. The F3→F4 "shell mounted in F3, behavior wired in its phase" pattern.
**Apply to:** `NavPills.vue` (`:class="{ active }"`), `BackButton.vue` (`:class="{ show }"` + `@click="goBack"`). Append bindings only; never restructure markup; never add `<style scoped>`.

### CSS is VERBATIM — toggle existing classes, write zero CSS
**Source:** `app/assets/css/base.css` — `scroll-padding-top:124px` (line 3), `.nav-pill.active` (line 90), `.card.highlight` (line 694), `.back-btn.show` (line 1025).
**Apply to:** all four modified/new UI files. F5 only toggles these existing classes. `eslint.config.mjs:16` ignores `app/assets/css/**` to protect the verbatim CSS. A `<style scoped>` anywhere would emit `data-v-*` and break these global selectors.

### Pure logic → `app/utils/` + plain Vitest
**Source:** `app/utils/pace.ts` (pure fn, JSDoc cites `index.html` line, auto-imported) + `tests/unit/pace.spec.ts` (plain Vitest, direct import). Delegation precedent: `useTripModes.ts:50-51`.
**Apply to:** `app/utils/cardNav.ts` (`computeActiveSection` + optional predicate) consumed by the controller; `tests/unit/cardNavigation.spec.ts` covers it without DOM.

### Self-contained Playwright parity spec (build + serve under `/guiaRoma/`)
**Source:** `tests/parity/modes.spec.ts:28-107` (harness) + `:223-239` (preset-via-`addInitScript` pattern, reusable for SC#1 scroll setup).
**Apply to:** `tests/parity/navigation.spec.ts`. Mirror the harness exactly; tolerate only the color-mode hydration message; run via `pnpm test:golden`.

---

## Critical Pitfall (drives the listener mechanism — read before planning the controller)

### Pitfall 1: NuxtLink intercepts the click BEFORE a delegated listener (THE finding of the phase)
**Source:** RESEARCH §Common Pitfalls Pitfall 1 (verified against installed source). Confirmed: project is **history mode** (`nuxt.config.ts:37` "El routing es history (default)").

Prose MDC links render via `ProseA` → `<NuxtLink :href>`. For `href="#g-fortunata"` in history mode, NuxtLink renders a **plain `<a>`** (good — `closest('a[href^="#"]')` finds it) **but attaches its own `onClick`** on that `<a>` that does `preventDefault()` + `el.focus()` (no smooth scroll). A DOM handler on the target `<a>` fires (bubble phase) **before** a native bubble listener on `document`.

**Mechanism F5 must use:** register `document.addEventListener('click', onDelegatedClick)` **natively in `onMounted`** (NOT a Vue `@click`). Both handlers call `preventDefault`, so the browser doesn't jump regardless; what matters is that `navigateToCard` (smooth scroll + highlight + stack) runs. NuxtLink's `el.focus()` is benign (A3). **If a conflicting jump is observed**, the robust fallback is **capture phase**: `addEventListener('click', onDelegatedClick, true)` runs before NuxtLink's bubble handler, allowing `preventDefault()` + `stopPropagation()` to cut NuxtLink off entirely. **The planner verifies empirically** (Playwright SC#3) which of bubble-simple vs capture reproduces parity; capture is the safety net (A1). Warning signs: prose-link click jumps without smooth animation, without `.highlight`, or "Volver" doesn't appear → the F5 listener isn't winning the click.

---

## No Analog Found

None. Every file has a strong in-repo analog — this phase is a parity port onto scaffolding established and proven in F3/F4.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| (none) | — | — | — |

---

## Metadata

**Analog search scope:** `app/composables/`, `app/components/`, `app/utils/`, `tests/unit/`, `tests/parity/`, `app/assets/css/base.css`, `index.html` (lines 6380-6509, 6645-6663), `nuxt.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `package.json`.
**Files scanned:** 14 read in full or targeted ranges (useTripModes, useTrip, NavPills, BackButton, TripView, TheHero, TimelineStop, MonumentCard, pace.ts, pace.spec.ts, modes.spec.ts, vitest.config.ts, eslint.config.mjs, index.html sections).
**Pattern extraction date:** 2026-06-21
**Key cross-checks:** history mode confirmed (`nuxt.config.ts:37`); controller-invocation precedent confirmed (`TheHero.vue:48-49`); verbatim CSS line numbers confirmed (`base.css:3,90,694,1025`); test runners confirmed (`package.json:14,18`); eslint allowlist scope confirmed (only `Topbar`/`Timeline` components exempt; composables unaffected).
