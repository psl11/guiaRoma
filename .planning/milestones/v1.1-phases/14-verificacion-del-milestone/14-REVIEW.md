---
phase: 14-verificacion-del-milestone
reviewed: 2026-11-22T02:20:30Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - tests/parity/upgrade-from-main.spec.ts
  - tests/parity/cross-trip.spec.ts
  - tests/data/css-vs-main.spec.ts
  - tests/README.md
findings:
  critical: 0
  warning: 9
  info: 7
  total: 16
  necessity: 1
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-11-22T02:20:30Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

I reviewed the three Phase 14 milestone specs and the README changes (diff vs `1712475`). I checked them against the app code they exercise (`useTripModes.ts`, `useSearch.ts`, `MonumentCard.vue`, `nuxt.config.ts`), the helpers they import (`_pagesServer.ts`, `_harness.ts`), `main:index.html` and the installed `playwright-core@1.61.0`.

Overall the specs are careful. They use an oracle instead of hand-written expected values, positive controls for the zero-download assertions, and teeth tests for the CSS comparison. Temp-dir cleanup is correct even when `beforeAll` throws, because `oldDir` is assigned before `readLiveGuide()` runs. The only leak is a hard worker kill. No finding is a blocker.

Several assertions are weaker than the PAR-03 / D-02 claims they support, so they would still pass if the guarded behaviour broke:
- the "no light first paint" check;
- the "no migration / no reload" claim;
- the Campania-defaults check in the upgrade spec;
- font weights and cascade order in the CSS-vs-main comparison.

Robustness gaps:
- Ports come from the unbounded `TEST_WORKER_INDEX`.
- The fallback `pnpm generate` can run concurrently from several workers.
- Both git-backed specs hard-require a local `main` branch, which never exists in an `actions/checkout` environment.

README §4 counts are internally consistent: the per-file table sums to 126, and 128 − 2 = 126.

## Warnings

### WR-01: «sin primer pintado claro» is not proven by a `domcontentloaded` check

**File:** `tests/parity/upgrade-from-main.spec.ts:243-251`
**Issue:** The test reads `data-theme` once `domcontentloaded` has fired, on both the portada and Roma. Nuxt's entry is a `<script type="module">`, and deferred module scripts run *before* `DOMContentLoaded`. So `dark` at DCL cannot tell apart two cases:
- color-mode's inline `<head>` script set the theme before first paint (the PAR-03 claim);
- app JS set it after the browser had already painted the light page.

If the anti-FOUC inline script were removed or broken, and the color-mode client plugin applied the theme during app boot, the assertion could still pass.

**Fix:** Prove that the inline script alone is enough. Load the page with the app bundles aborted:
```ts
await page.route('**/_nuxt/**', r => r.abort())
await page.goto(`${ORIGIN}${ROMA_URL}`, { waitUntil: 'domcontentloaded' })
expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark')
await page.unroute('**/_nuxt/**')
```
Alternatively, record `data-theme` from an `addInitScript` `MutationObserver` at the first `requestAnimationFrame`.

### WR-02: «sin migración, sin recargar» is not enforced: extra keys and self-reloads go undetected

**File:** `tests/parity/upgrade-from-main.spec.ts:255-261, 279-280, 316-325`
**Issue:**
- **Extra keys.** Every storage check iterates only over `Object.entries(s0)`, so it proves `s0 ⊆ after` but never `after ⊆ s0 ∪ oracle.storage`. A migration that copies notes or prefs to *new* keys (e.g. `roma-v2-*` or a `migrated` flag) passes every assertion. The only strict check is the portada `toEqual(s0)` at line 246, and it runs once right after hydration.
- **Self-reload.** The build could run a one-time `location.reload()` as a migration. The test would not notice: `waitForURL` and `hydrated` both succeed again on the same URL. The README (§6.1) and the spec header nonetheless promise "sin recargar".

**Fix:**
```ts
let mainNavs = 0
page.on('framenavigated', f => { if (f === page.mainFrame()) mainNavs++ })
// … click the Roma card, wait for the poll to pass …
expect(mainNavs, 'una sola navegación de documento (sin recarga de migración)').toBe(1)
const allowed = new Set([...Object.keys(s0), ...Object.keys(oracle.storage)])
expect(Object.keys(after).filter(k => !allowed.has(k)), 'sin claves nuevas').toEqual([])
```
Repeat the extra-key check after the reload (step 5) and after Campania (step 6).

### WR-03: The Campania-defaults check in the upgrade spec has no restoration anchor

**File:** `tests/parity/upgrade-from-main.spec.ts:270-278`
**Issue:**
- **When restore happens.** Campania restores its saved prefs and notes in `onMounted` (`useTripModes.ts:103-115`, `MonumentCard.vue:136-138`).
- **How the body classes land.** `light-mode` / `modo-resumen` reach `<body>` through `useHead({ bodyAttrs })`, which unhead flushes asynchronously.
- **Why the checks prove nothing.** All the step-6 checks are negative: default pace, no body class, all notes `''`. They run immediately after `hydrated()`, so each passes on the prerendered defaults before restoration has finished. Suppose Campania read `roma-*` keys (exactly the leak step 6 guards against). The `light-mode|modo-resumen` check can still pass before unhead applies the restored classes, and nothing later in the test looks again.

`cross-trip.spec.ts` (notes test, line 312) already uses the right pattern: assert a positively restored value before checking for absences.

In `cross-trip.spec.ts:353-355` the first Campania visit has the same gap, but there it is mitigated: the «Adelante» step at line 373 checks again behind a positive anchor.

**Fix:** Before step 6, seed one Campania-only key, e.g. `campania-note-baia-di-sorgeto`. First assert that note shows (restoration ran), then assert the defaults and that the other notes are empty. For the body class, check it after a positive anchor or after a `requestAnimationFrame` + timeout flush.

### WR-04: The fonts check compares family names only; weights and styles are unchecked

**File:** `tests/data/css-vs-main.spec.ts:115-126, 159-165`
**Issue:** Main's `<link>` (main:index.html:13) asks for 14 specific faces:
- Cormorant Garamond: `0,400;0,500;0,600;0,700;1,400;1,500;1,600`
- Lora: `0,400;0,500;0,600;1,400;1,500`
- JetBrains Mono: `400;500`

The test only compares the set of three family names. If `fonts.css` dropped, say, Cormorant 700 or Lora italic 500, the test would stay green while the browser synthesises faux bold or italic, a visual parity break. Today `fonts.css` does contain all 14 faces (28 `@font-face`, two subsets each), but nothing pins that.

**Fix:** Parse `ital,wght@…` from each `family=` parameter into `family|style|weight` tuples. Compare them with the set of `(font-family, font-style, font-weight)` read from the `@font-face` rules in `fonts.css`.

### WR-05: Cascade order differs from main and the spec neither checks nor documents it

**File:** `tests/data/css-vs-main.spec.ts:6-26, 147-157` (and `nuxt.config.ts:30-37`)
**Issue:** The header says this spec proves "EL CSS QUE PUBLICA LA BUILD ES EL CSS DE `main`", but it only compares each partition separately. In main, `<style id="leaflet-inline-css">` (lines 14-864) comes *before* the editorial `<style>` (865-2210). The build loads `fonts → tokens → base → leaflet`, so leaflet.css now comes *after* base.css, and `tests/unit/multitripCss.spec.ts:88` pins that inverted order.

This matters because leaflet.css also contains app rules (`.light-banner`, `.dia-ligera`, `.tl-hidden`, …). Any equal-specificity conflict between a leaflet.css rule and a base.css rule now resolves the opposite way from main. I found no *identical* selector with overlapping properties across the two files today. But the spec would not catch a future conflict, and D-02 requires every intentional difference from main to be documented. This one is not.

**Fix:** Add the order inversion to the documented partitions in the header and in README §6.3. Also add an assertion: either no selector in leaflet.css can match an element that a base.css rule of equal specificity also styles with the same property, or, at minimum, an identical-selector/overlapping-property check (empty today) as a tripwire.

### WR-06: Ports come from the unbounded `TEST_WORKER_INDEX`

**File:** `tests/parity/upgrade-from-main.spec.ts:180`, `tests/parity/cross-trip.spec.ts:121`
**Issue:** `TEST_WORKER_INDEX` is unique per worker *process*, and Playwright starts a new process, with a higher index, after every failure. It is not bounded by the worker count. Two consequences:
- **Collision between the two specs.** `6600 + n` and `6700 + m` meet when `n − m = 100`. In a long failing run, or with the README's recommended `--repeat-each 3` re-runs, the indexes keep growing, so the spacing is no guarantee. A collision gives `EADDRINUSE` in `beforeAll`/`startPagesServer`.
- **The upgrade spec relies on rebinding its port.** It closes and reopens the same port inside one test, so a squatter appearing in between would fail that test.

**Fix:** Use `TEST_PARALLEL_INDEX`, which is always in `0..workers-1`, or `test.info().parallelIndex`:
```ts
const PORT = 6600 + test.info().parallelIndex // inside a hook/test
```
Or `Number(process.env.TEST_PARALLEL_INDEX ?? 0)` at describe scope.

### WR-07: The `ensureBuild` fallback can run `pnpm generate` concurrently and inside a short hook timeout

**File:** `tests/parity/upgrade-from-main.spec.ts:45-51`, `tests/parity/cross-trip.spec.ts:57-64`
**Issue:** When `.output` is missing, every worker that runs these `beforeAll` hooks calls `spawnSync('pnpm', ['generate'])`. That includes the mobile and desktop workers of each spec, plus the other cloned `ensureBuild`s in `portada.spec.ts` etc. They write `.nuxt/`, `.data/` and `.output/` concurrently, which README §5.1 itself forbids ("compiten por `.nuxt/` y `.data/`").

Other problems with the fallback:
- **Timeouts.** In cross-trip, the hook runs under the default 30 s timeout, far below a real generate. In upgrade, it runs under 120 s.
- **Windows.** `spawnSync('pnpm', …, { shell: false })` fails with ENOENT because the binary is `pnpm.cmd`. The assertion then reports "debe salir 0" and hides `gen.error`.
- **Stale builds.** The check is existence-only, so a build left over from older content passes silently (the stale-cache failure mode in project memory).

**Fix:** Make the build a precondition and drop the in-test generate. Fail fast with a clear message instead:
```ts
expect(existsSync(ROMA_HTML), 'falta la build: ejecuta `pnpm generate` (o `pnpm verify`) antes').toBe(true)
```
Or move the build into a Playwright `globalSetup` that runs exactly once. If you keep the spawn, include `gen.error` in the message.

### WR-08: The git dependency hard-requires a local `main` branch, with no remote fallback and no staleness check

**File:** `tests/parity/upgrade-from-main.spec.ts:74-88`, `tests/data/css-vs-main.spec.ts:40-50, 128`
**Issue:** `git show main:index.html` resolves only a ref literally named `main`.
- **CI can never run the gate.** `actions/checkout`, even with `fetch-depth: 0`, creates `refs/remotes/origin/main` but never a local `refs/heads/main`. Both specs therefore always fail there. Because css-vs-main runs `git` at module load, the whole `test:data` collection errors and `pnpm verify` can never pass in the GitHub Pages pipeline that CLAUDE.md plans.
- **Locally, the test may compare against the wrong guide.** The deployed "guía viva" is `origin/main`. If a developer's local `main` lags behind it, the test silently validates against an outdated guide (today both are `d17e80f`).

Failing loudly is the intended design (D-03), but the failure is avoidable and the result can be wrong.

**Fix:** Try `main`, then `origin/main`, and warn or fail if both exist and differ:
```ts
const refs = ['main', 'origin/main'].filter(r => spawnSync('git', ['rev-parse', '--verify', '-q', r]).status === 0)
if (refs.length === 0) throw new Error('… necesita main u origin/main …')
// optionally: assert rev-parse main === rev-parse origin/main when both exist
```
Document the CI requirement (`fetch-depth: 0`) in README §6.

### WR-09: cross-trip uses the default 30 s test timeout for long navigation chains, and an inner `toPass` timeout as long as the test timeout

**File:** `tests/parity/cross-trip.spec.ts:120, 186-227, 254-260`
**Issue:**
- **Click-flow test.** It chains 8 `landOn` calls. Each waits for `load`, then `networkidle` (at least 500 ms quiet), hydration and a locator, under the 30 s default in `playwright.config.ts`, with no `describe.configure`. The gate runs in parallel, and README §6.4 already lists a mobile spec that "roza el timeout de 30 s". This test has the same profile.
- **Search test.** `searchUntil` uses `toPass({ timeout: 30_000 })`, equal to the entire test budget, and is called three times. If index readiness is slow, the test times out without the `toPass` diagnostic, so the inner timeout is meaningless.

**Fix:** Add `test.describe.configure({ timeout: 90_000 })`, as the upgrade spec does with 120 s, and reduce `searchUntil`'s `toPass` timeout to about 10 s so its failure message surfaces.

## Info

### IN-01: History steps have no non-vacuity control; they rely on Playwright disabling bfcache

**File:** `tests/parity/cross-trip.spec.ts:157-169, 206-226`
**Issue:** The `/_nuxt/` request-count control covers only the forward `goto`/click steps. If a «Atrás»/«Adelante» step were a bfcache restore, with no new document and no JS re-run, "zero heavy downloads" would hold trivially, and `landOn` (URL + `isHydrating === false` + marker) would still pass. Today this is safe only because `playwright-core@1.61.0` launches Chromium with `--disable-back-forward-cache` (verified in `lib/coreBundle.js`). That premise is not asserted anywhere.
**Fix:** In `landOn` for history steps, assert that a fresh document loaded. For example, set `window.__prevDoc = true` before `goBack()` and check it is `undefined` after, or check that `performance.getEntriesByType('navigation')[0].type === 'back_forward'`.

### IN-02: The orphaned-rule regex matches any closing brace, not specifically the stray one

**File:** `tests/data/css-vs-main.spec.ts:76-79`
**Issue:** `/\}\.tl-meta-item\{[^{}]*\}/` matches the normal `}` that closes whatever rule precedes it. Main's actual shape, after normalization, is `}}.tl-meta-item{…}` and `}}.tl-transport-mode.recommended{…}` (main:index.html:1385-1386 and 1528). The `[1,1]` count plus the equality check make a false pass unlikely, but the comment's claim ("el `}` sobrante seguido de la regla") is not what the regex enforces.
**Fix:** Use `/\}\}\.tl-meta-item\{[^{}]*\}/g` and replace the match with `'}'`; do the same for `.recommended`.

### IN-03: The array returned by `blockOffOrigin` is never used

**File:** `tests/parity/upgrade-from-main.spec.ts:54-63`, `tests/parity/cross-trip.spec.ts:67-76`
**Issue:** The function collects aborted off-origin URLs and returns them, but every call site discards the result. This is dead code, or a missing assertion: for example, that nothing off-origin was required for the flows to work.
**Fix:** Either return `void`, or assert on it (e.g. no Google Fonts requests from the new build).

### IN-04: `ensureBuild`, `blockOffOrigin` and `hydrated` are cloned into every spec

**File:** `tests/parity/upgrade-from-main.spec.ts:45-71`, `tests/parity/cross-trip.spec.ts:57-84`
**Issue:** These are verbatim clones of `portada.spec.ts`, now in at least four files. They will drift: WR-07, for example, would need fixing in each copy. The constraint "no existing spec edited" does not stop adding helpers to the non-spec `_harness.ts`.
**Fix:** Export the three helpers from `tests/parity/_harness.ts` (or a new `_helpers.ts`) and import them in the two new specs.

### IN-05: Already-defended-elsewhere — redundant waits after `goto`/`reload` and after `waitForURL`

**File:** `tests/parity/upgrade-from-main.spec.ts:158-159, 164-165, 209-210, 289-290`; `tests/parity/cross-trip.spec.ts:113, 117`
**Category:** necessity
**Issue:** `page.goto()` and `page.reload()` already default to `waitUntil: 'load'`, so the following `waitForLoadState('load')` can never wait. In `landOn`, `page.waitForURL(url)` with a string already guarantees `page.url() === url`, so `expect(page.url()).toBe(url)` re-checks a state that cannot differ. Both are provable from the Playwright API contract.
**Fix:** Drop the redundant `waitForLoadState('load')` calls and the final `expect(page.url())` in `landOn`, or keep the latter with a comment if it is deliberate belt-and-braces.

### IN-06: The new parity specs are neither linted nor type-checked by the gate

**File:** `tests/README.md:715-717` (and `eslint.config.mjs` `ignores: ['tests/parity/**']`)
**Issue:** `pnpm lint` ignores `tests/parity/**`, and `nuxi typecheck` does not cover Playwright specs (Playwright only transpiles). The README makes "`eslint --no-ignore` sobre los dos specs nuevos" a manual step, so it is easy to skip and is not part of `pnpm verify`.
**Fix:** Add a `lint:parity` script (`eslint --no-ignore tests/parity/upgrade-from-main.spec.ts tests/parity/cross-trip.spec.ts`) and a `tsc --noEmit -p tests/parity` step, and chain them into the gate.

### IN-07: The oracle context copies only the viewport, not the mobile device descriptor

**File:** `tests/parity/upgrade-from-main.spec.ts:148-155, 226`
**Issue:** For the `mobile` project (iPhone 12: `isMobile`, `hasTouch`, `deviceScaleFactor`, userAgent), the oracle opens `browser.newContext({ viewport })` without the rest of the device. If main's restore path ever depended on touch or UA (e.g. via `matchMedia('(hover: none)')`), the oracle would diverge from the user's context. That is unlikely today, which is why this is a judgment call.
**Fix:** Pass the project's device options: `browser.newContext({ ...test.info().project.use, viewport })`, or at least `isMobile`, `hasTouch` and `userAgent`.

---

_Reviewed: 2026-11-22T02:20:30Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
