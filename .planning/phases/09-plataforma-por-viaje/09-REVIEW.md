---
phase: 09-plataforma-por-viaje
reviewed: 2026-11-20T11:12:00Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - app/components/MonumentCard.vue
  - app/components/SearchBox.vue
  - app/components/TripView.vue
  - app/composables/useCardNavigation.ts
  - app/composables/useSearch.ts
  - app/composables/useTripContext.ts
  - app/composables/useTripModes.ts
  - app/utils/searchIndex.ts
  - app/utils/tripStorage.ts
  - content/trips/prueba/days/sabado.yml
  - content/trips/prueba/days/viernes.yml
  - content/trips/prueba/monuments/fontana-pruebas.yml
  - content/trips/prueba/monuments/spagna.yml
  - content/trips/prueba/monuments/torre-ensayo.yml
  - content/trips/prueba/trip.yml
  - package.json
  - playwright.trips.config.ts
  - shared/schemas.ts
  - tests/README.md
  - tests/data/build-isolation.spec.ts
  - tests/data/fixtures/trips/campania-2027/trip.yml
  - tests/data/fixtures/trips/suelto/days/viernes.yml
  - tests/data/fixtures/trips/suelto/notas.yml
  - tests/data/invariants.spec.ts
  - tests/data/schema.spec.ts
  - tests/data/trips.ts
  - tests/trips/isolation.spec.ts
  - tests/unit/searchIndex.spec.ts
  - tests/unit/searchIsolation.spec.ts
  - tests/unit/tripCoupling.spec.ts
  - tests/unit/tripStorage.spec.ts
findings:
  critical: 1
  warning: 5
  info: 5
  total: 11
  necessity: 0
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-11-20T11:12:00Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

I reviewed every file in `git diff 79e57e0..HEAD`, excluding `.planning`. That covers the per-trip context (`provideTripSlug`/`useTripSlug`), the per-trip `useState` and `localStorage` keys, the per-slug MiniSearch indexes, the per-trip data gate (`tests/data/trips.ts` with `checkTrip`), the fictional `prueba` trip, the build sentinel, the coupling guard and the dev-server E2E.

The runtime wiring is mostly correct:
- Every caller that uses the default `useTripSlug()` is a descendant of `TripView`.
- TripView gets around the self-inject trap by passing the slug explicitly.
- For `roma`, the `localStorage` keys are byte-identical to the live keys.
- The `${slug}-` prefix is collision-free because `TRIP_SLUG_RE` forbids hyphens.

`vitest run tests/unit tests/data` passes: 17 files, 427 tests.

The main problem is in what the phase promises about isolation. The "dev-only" `prueba` trip ships in the public static build's Content SQL dumps. It can be rendered on GitHub Pages through the SPA `404.html` fallback, and the build sentinel cannot see this (CR-01).

The data gate has two verified false negatives:
- It does not reserve the day section ids that TripView hardcodes (WR-01).
- Its cross-trip-link rule misses root-relative links back to Roma's home at `/` (WR-02).

I checked both with an in-memory `checkTrip` probe, which returned `[]` for each.

Both controllers create watchers after their internal `await`. Those watchers are never disposed, which matters now that phase 9 is meant to support moving between trips (WR-03).

I found no necessity findings. Every guard or abstraction I checked protects against a state that can actually occur, or sits at a trust boundary.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: The fictional `prueba` trip ships in the public static build and can be rendered on GitHub Pages; the build sentinel cannot detect it

**File:** `content/trips/prueba/trip.yml:17`, `tests/data/build-isolation.spec.ts:37-45`
**Issue:** D-02 says the `prueba` trip must be reachable only in dev until Phase 11. The current static output breaks that:
- `content.config.ts` globs `trips/*/…` with no exclusion. So `nuxt generate` writes `prueba` rows into the public Content dumps. I decompressed the base64 gzip `.output/public/__nuxt_content/{trip,monument}/sql_dump.txt`:
  - `trip`: 3 occurrences of `prueba`, and `PRUEBA-CENTINELA-9F3` is present.
  - `monument`: 23 occurrences, and the sentinel is present.
- The `github_pages` preset emits `.output/public/404.html` as a client-only SPA shell: `"serverRendered":2`, with no SSR markup. The client entry (`_nuxt/7qbXQxbJ.js`) fetches `__nuxt_content/<collection>/sql_dump.txt`.
- On Pages, a request to `/guiaRoma/trips/prueba` is answered with `404.html`. The app then boots, `pages/trips/[slug].vue` runs `useTrip('prueba')` against the client-side dump, the trip is found, and the fictional guide renders publicly (with HTTP status 404). I inferred this last step from the artifacts above and did not run it in a browser.

`build-isolation.spec.ts` claims "Roma build carries no prueba data". It only greps `index.html` and `_payload.json`. The dumps are gzip+base64, so even a grep of `__nuxt_content/` would never match the sentinel. The test gives false assurance. The comment in `trip.yml` (lines 14-16) says the dump problem will be handled in Phase 11, but nothing in phase 9 stops this branch's build from shipping it.
**Fix:** Keep `prueba` out of production sources now, and make the sentinel decompress the dumps:
```ts
// content.config.ts — Content v3 source include/exclude
const devOnly = process.env.NODE_ENV === 'production' ? ['trips/prueba/**'] : []
trip: defineCollection({ type: 'data', source: { include: 'trips/*/trip.yml', exclude: devOnly }, schema: TripSchema }),
// …same `exclude` on day/monument/food/artist/reference
```
```ts
// tests/data/build-isolation.spec.ts
import { gunzipSync } from 'node:zlib'
it('no Content dump carries prueba rows', () => {
  const dir = join(OUT, '__nuxt_content')
  for (const col of readdirSync(dir)) {
    const raw = readFileSync(join(dir, col, 'sql_dump.txt'), 'utf8')
    const sql = gunzipSync(Buffer.from(raw, 'base64')).toString('utf8')
    expect(sql, `${col} dump`).not.toContain(SENTINEL)
    expect(sql, `${col} dump`).not.toMatch(/'prueba'/)
  }
})
```

## Warnings

### WR-01: `fixed-anchor` does not reserve the five day section ids that TripView always renders

**File:** `tests/data/trips.ts:51-55` (`SECTION_ANCHORS` / `FIXED_DOM_IDS`); collides with `app/components/TripView.vue:123,130,137,144,151`
**Issue:** TripView renders `<section id="viernes|sabado|domingo|lunes|martes">` unconditionally. Only the inner `DaySection` has a `v-if`. `FIXED_DOM_IDS` leaves these five ids out.

In a trip that has no `lunes` day, a monument, food or artist with slug `lunes` passes every rule. `dup-id` only fires when a day with that slug exists. I checked this with `checkTrip(loadTripFromFiles('p', {'trip.yml': …, 'monuments/lunes.yml': …}))`, which returned `[]`.

At runtime the page then has duplicate ids. `document.getElementById('lunes')` returns the empty `<section>`, which comes first in the DOM. So `navigateToCard`, a search result or a map popup scrolls to and highlights the empty section instead of the card. The `prueba` trip already uses only `viernes`/`sabado`, so this situation exists today.
**Fix:** Add the hardcoded day ids to the fixed set until Phase 10 makes the days data-driven:
```ts
/** Section ids that TripView renders ALWAYS (TripView.vue:123-151), even without a matching day. */
export const DAY_SECTION_IDS = ['viernes', 'sabado', 'domingo', 'lunes', 'martes'] as const
export const FIXED_DOM_IDS = new Set<string>([...SECTION_ANCHORS, ...CHROME_IDS, ...DAY_SECTION_IDS])
```
Exempt `day` docs from this check, because a day's own slug is meant to match its section. Add a fixture test for `monuments/lunes.yml`.

### WR-02: `cross-trip-link` only matches `/trips/`, so root-relative links to Roma (which lives at `/`) get through

**File:** `tests/data/trips.ts:282-287`
**Issue:** D-11 forbids links between trips. Until Phase 11, Roma's guide is served at `/` and not at `/trips/roma`. All of these pass the gate:
- `[x](/#pantheon)`
- `[x](/guiaRoma/#pantheon)`
- `[x](../roma#x)`

I ran all three through `checkTrip` and it returned `[]`. Such links take the reader out of the current trip into Roma, which is exactly what the rule exists to stop. The `anchor` rule does not catch them either, because they don't start with `#`.
**Fix:** Allow-list instead of block-list. Inside a trip, the only acceptable targets are `#id` anchors and absolute external URLs:
```ts
else if (!target.startsWith('#') && !/^(https?:|mailto:|tel:)/i.test(target)) {
  push(d.file, 'cross-trip-link', `enlace relativo/raíz no admitido (D-11): "${target}"`)
}
```

### WR-03: Watchers created after the controllers' internal `await` are never disposed

**File:** `app/composables/useCardNavigation.ts:186-190`, `app/composables/useSearch.ts:157-164`
**Issue:** Both controllers call `watch(monById, …)` after `await useTrip(slug)`. These are plain async composables, not `<script setup>`, so there is no `withAsyncContext`. When the code resumes after the await, there is no active component instance or effect scope. The watcher is therefore not tied to TripView or SearchBox and is never stopped on unmount.

Every trip mount leaks one watcher per controller. Each leaked watcher holds the closure: `monByIdRef`, plus `indexes` and `slug` for the search one. The search watcher can also rebuild `indexes` for a trip that is no longer mounted.

The same happens on the server. After the await, `isInSSRComponentSetup` is false, so `watch` is really created during each prerender. The file comments claim cleanup "for future navigation between `/trips/[slug]`", which is the case phase 9 enables, but only the DOM listeners are cleaned up. The pattern existed before this phase, but phase 9 rewrote these lines.
**Fix:** Capture the scope synchronously and create the watcher inside it:
```ts
const scope = getCurrentScope() // before the await
const { monById } = await useTrip(slug)
monByIdRef.value = monById.value
scope?.run(() => watch(monById, v => (monByIdRef.value = v)))
```
An alternative is to register the watch synchronously on a holder: `const src = shallowRef<Ref<Map<…>> | null>(null); watch(() => src.value?.value, …)`, then set `src.value = monById` after the await.

### WR-04: `useTripModesController` calls `localStorage` without try/catch, unlike MonumentCard

**File:** `app/composables/useTripModes.ts:110-121`
**Issue:** The restore code (`getItem` ×3) and the three persistence `watch` callbacks (`setItem`) use `localStorage` with no guard. MonumentCard deliberately wraps the same API (`MonumentCard.vue:129-134, 141-146`) because storage can be blocked.

When cookies or storage are disabled, or in some private modes, `localStorage` access throws `SecurityError`. In that case:
- `onMounted` throws before the watchers are registered.
- Pace, light and resumen stop working consistently.
- The error goes to Vue's error handler.

Each later `setItem` inside a watcher would also throw on every toggle. The behaviour predates this phase, but these lines were rewritten here.
**Fix:**
```ts
const read = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* blocked */ } }
// …use read()/write() in onMounted and in the three watchers
```

### WR-05: The coupling guard only scans three directories, without recursion, so new coupling can slip past it

**File:** `tests/unit/tripCoupling.spec.ts:36-40, 120-125`
**Issue:** `FILES` comes from a non-recursive `readdirSync` of `app/composables`, `app/components` and `app/utils`. Several places can call `useState`/`useTrip`/`localStorage` and are not scanned:
- Nested component folders, such as `app/components/trip/Foo.vue`. Nuxt auto-imports these.
- `app/pages/trips/[slug].vue` and `app/app.vue`.
- Any future `app/plugins/` or `app/middleware/`.

A `useState('pace', …)` or a `localStorage.getItem('roma-x')` added in any of these passes the guard. `tests/README.md` §5.4 presents the guard as the safeguard against reintroducing global state.
**Fix:** Scan `app/**` recursively (`readdirSync(join(ROOT, 'app'), { recursive: true })`, filtered to `.ts`/`.vue`). Keep `app/pages/index.vue` as the only explicit, documented exclusion.

## Info

### IN-01: The link-target regexes break on Markdown link titles and on URLs containing parentheses

**File:** `app/utils/searchIndex.ts:45`, `tests/data/trips.ts:150`
**Issue:** `MD_LINK_TARGET = /\]\([^)\s]*\)/g` requires `)` right after a target with no spaces. For `[x](#a "título")` nothing is stripped, so `#a` stays in the search haystack. For a URL like `…/Foo_(bar)` the match stops at the first `)`, and the leftover `bar)` gets indexed. No current content uses either form (I checked with a grep), so this is latent.
**Fix:** Use a shared, slightly more tolerant pattern in both places, for example `/\]\((?:[^()\s]|\([^()]*\))*(?:\s+"[^"]*")?\)/g`.

### IN-02: The build sentinel's global-key check is narrow, and it can run against a stale build

**File:** `tests/data/build-isolation.spec.ts:30, 48-54`
**Issue:** The negative check only looks for `"$space"`. An unsuffixed `"$scardNav:stack"`, `"$slight"` or `"$ssearch:query"` would not be caught. The `skipIf(!existsSync(INDEX))` also means that running `pnpm test:data` on its own checks whatever `.output` is left over, possibly built from older content. That is fine inside `verify`, but misleading outside it.
**Fix:** Assert that no `"$s<name>"` key from the known list appears without the `:<slug>` suffix. Also consider comparing the mtime of `.output/public/index.html` with the content files.

### IN-03: The `anchor` rule accepts any day slug, but TripView renders only `viernes`…`martes`

**File:** `tests/data/trips.ts:278`
**Issue:** `anchorable` includes every day slug. A trip with a day `miercoles` and a link `[x](#miercoles)` passes the gate, but TripView emits no `#miercoles` section (see the D-03 note in `content/trips/prueba/trip.yml:10-12`). This is deferred to Phase 10, but the gate should not report it as resolvable meanwhile.
**Fix:** Until Phase 10, only count day slugs in `DAY_SECTION_IDS` (see WR-01) as anchorable, or add a `day-slug` rule that rejects unknown day slugs.

### IN-04: Redundant navigation in the PLAT-03 E2E test

**File:** `tests/trips/isolation.spec.ts:226-227`
**Issue:** `page.reload()` is followed straight away by `gotoHydrated(page, PRUEBA_URL)`, which navigates to the same URL again. The reload does nothing useful and adds time and flakiness on the fragile dev server.
**Fix:** Drop `page.reload()`.

### IN-05: The gate ignores stray files outside trip folders and `.YML` with upper-case extensions

**File:** `tests/data/trips.ts:80, 87-92`
**Issue:** `listTripDirs` keeps only directories, so a YAML file placed directly in `content/trips/` (for example `content/trips/notas.yml`) is never reported. `isYaml` is case-sensitive, so `monuments/x.YML` is skipped instead of being flagged as `stray-file`. Content also ignores both silently, which is the "fail-open" this gate was meant to close.
**Fix:** Report non-directory entries in `content/trips/`, and use `/\.ya?ml$/i` in `isYaml`.

---

_Reviewed: 2026-11-20T11:12:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
