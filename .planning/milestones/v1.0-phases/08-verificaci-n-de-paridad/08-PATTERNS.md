# Phase 8: Verificación de paridad - Pattern Map

**Mapped:** 2026-06-23
**Files analyzed:** 5 (1 NEW spec, 1 NEW config, 3 MODIFY)
**Analogs found:** 5 / 5 (all exact or role-match; F8 is ~90% reuse of existing green test assets)

> **Orientation for the planner:** F8 builds **no UI**. It adds one net-new visual-diff spec (a 5th clone of the self-contained build+serve pattern), one gate script in `package.json`, one optional gate config, and a back-half assertion to two existing specs. Every pattern below is copy-ready with file paths and line numbers. The single highest-leverage move is cloning `map-fallback-notes.spec.ts`'s scaffold and grafting in `golden.spec.ts`'s `VIEWS`/`settle()`/A5 verbatim.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| **NEW** `tests/parity/visual-diff.spec.ts` (name = planner) | test (visual-regression) | request-response (build→serve→screenshot→compare-frozen) | `tests/parity/map-fallback-notes.spec.ts` (scaffold) + `tests/parity/golden.spec.ts` (`VIEWS`/`settle()`/A5) | exact (composite of two) |
| **MODIFY** `package.json` | config (scripts) | batch (CLI orchestration) | `package.json` itself (existing `scripts` block, lines 6-19) | exact (extend in place) |
| **NEW (recommended)** `playwright.gate.config.ts` | config | — (test selection) | `playwright.config.ts` (lines 1-45) | role-match (extends base) |
| **MODIFY** `tests/parity/map-fallback-notes.spec.ts` | test (E2E) | event-driven (popup→ficha→Volver) | `tests/parity/navigation.spec.ts` SC#1 (lines 198-245) — canonical back-stack | exact |
| **MODIFY** `tests/parity/search-route.spec.ts` | test (E2E) | event-driven (result→ficha→Volver) | `tests/parity/navigation.spec.ts` SC#1 (lines 198-245) — canonical back-stack | exact |

---

## Pattern Assignments

### `tests/parity/visual-diff.spec.ts` — NEW (test, visual-regression) — SC#1

This file is a **graft**: the self-contained build+serve scaffold of `map-fallback-notes.spec.ts` + the determinism harness (`VIEWS` + `settle()` + A5) of `golden.spec.ts`, with only the `goto` target swapped (`/index.html` → the served Nuxt build under `/guiaRoma/`).

#### A. Self-contained build+serve scaffold — copy VERBATIM

**Analog:** `tests/parity/map-fallback-notes.spec.ts` (also identical in `navigation.spec.ts` and `search-route.spec.ts`).

**Imports** (`map-fallback-notes.spec.ts:1-5`):
```typescript
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
```
(`readFileSync` is also imported in map-fallback-notes for the SSG-HTML assertion — the visual-diff does **not** need it.)

**Module constants** (`map-fallback-notes.spec.ts:34, 40-41`):
```typescript
const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i
const ABORTED_REQUEST_MSG = /Failed to load resource: net::ERR_FAILED/i  // needed: A5 aborts images
const OUTPUT_DIR = join(process.cwd(), '.output', 'public')
```

**`waitForServer` / `killGroup` / `ensureBuild` helpers** — copy verbatim (`map-fallback-notes.spec.ts:55-91`):
```typescript
async function waitForServer(url: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.status > 0) return
    }
    catch (err) { lastErr = err }
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`Server no respondió en ${url} tras ${timeoutMs}ms (último error: ${String(lastErr)})`)
}

function killGroup(proc: ChildProcess | undefined): void {
  if (proc?.pid && !proc.killed) {
    try { process.kill(-proc.pid, 'SIGTERM') }
    catch { try { proc.kill('SIGTERM') } catch { /* ya muerto */ } }
  }
}

function ensureBuild(): void {
  if (!existsSync(join(OUTPUT_DIR, 'index.html'))) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(join(OUTPUT_DIR, 'index.html')), '.output/public/index.html debe existir').toBe(true)
}
```

**`beforeAll` / `afterAll` (build → copy to `guiaRoma/` subdir → serve detached → teardown)** — copy verbatim, only changing the `mkdtempSync` prefix and the port (`map-fallback-notes.spec.ts:112-143`):
```typescript
test.describe('visual-diff nuxt↔golden en /guiaRoma/ construido (SC#1)', () => {
  // ⚠️ PORT: base ports already taken — modes=5700, navigation=5720, search-route=5740,
  //    map-fallback-notes=5760. The new spec MUST pick a free base — RESEARCH §Pattern 1 says 5780.
  const STATIC_PORT = 5780 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_ORIGIN = `http://localhost:${STATIC_PORT}`
  const STATIC_URL = `${STATIC_ORIGIN}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()
    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-vdiff-'))   // ← prefix changed
    const subDir = join(previewRoot, 'guiaRoma')
    mkdirSync(subDir, { recursive: true })
    cpSync(OUTPUT_DIR, subDir, { recursive: true })
    server = spawn('pnpm', ['dlx', 'serve', '-l', String(STATIC_PORT), previewRoot], {
      stdio: 'ignore', shell: false, detached: true,
    })
    server.unref()
    await waitForServer(STATIC_URL)
  })

  test.afterAll(() => {
    killGroup(server)
    if (previewRoot && existsSync(previewRoot)) rmSync(previewRoot, { recursive: true, force: true })
  })
  // … tests …
})
```

#### B. Console gate (strict, with `tolerateAborts`) — copy VERBATIM

**Analog:** `map-fallback-notes.spec.ts:100-110`. The visual-diff **always** aborts images (A5), so it always passes `tolerateAborts=true`:
```typescript
function trackConsoleErrors(page: PWPage, tolerateAborts = false): string[] {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (EXPECTED_HYDRATION_MSG.test(text)) return
    if (tolerateAborts && ABORTED_REQUEST_MSG.test(text)) return
    consoleErrors.push(text)
  })
  return consoleErrors
}
// (type alias used by the helper, map-fallback-notes.spec.ts:93)
type PWPage = import('@playwright/test').Page
```

#### C. `VIEWS` array — copy VERBATIM

**Analog:** `golden.spec.ts:17-32`. These are the **exact 14 views the 56 frozen PNGs were captured from** — do not edit:
```typescript
const VIEWS = [
  ['inicio', '#inicio'],
  ['dia-viernes', '#viernes'],
  ['dia-sabado', '#sabado'],
  ['dia-domingo', '#domingo'],
  ['dia-lunes', '#lunes'],
  ['dia-martes', '#martes'],
  ['ref-reservas', '#reservas'],
  ['ref-gastronomia', '#gastronomia'],
  ['ref-practica', '#practica'],
  ['ref-arte', '#arte'],
  ['ref-arquitectura', '#arquitectura'],
  ['card-monumento', '#galleria-sciarra'],
  ['card-guided', '#vaticano'],
  ['card-concert', '#auditorium'],
] as const
```
> **`#mapa` is NOT in `VIEWS`** (D-06): no golden baseline exists (non-deterministic OSM tiles). Do not add it.

#### D. `settle()` — copy VERBATIM

**Analog:** `golden.spec.ts:44-69`. Identical determinism contract under which the golden was captured (eager-load every `<img>`, `networkidle`, await each `<img>.complete`, `document.fonts.ready`, double-rAF):
```typescript
async function settle(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach((img) => { img.loading = 'eager' })
  })
  await page.waitForLoadState('networkidle')
  await page.evaluate(() =>
    Promise.all(Array.from(document.images).map(img =>
      img.complete ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
    )),
  )
  await page.evaluate(() => (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
}
```
> `settle()` uses the `Page` type — add `type Page` to the `@playwright/test` import, or reuse the `PWPage` alias.

#### E. A5 image-block + dark theme + the capture loop — ADAPT (the one real edit)

**Analog:** `golden.spec.ts:71-110`. Everything is verbatim EXCEPT the `goto` target. The golden does `page.goto('/index.html')` (the old-HTML webServer in `playwright.config.ts`); the new spec does `page.goto(STATIC_URL)` against its own served Nuxt build:
```typescript
for (const theme of ['light', 'dark'] as const) {
  test(`nuxt↔golden ${theme}`, async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page, true)   // A5 aborts images → tolerate net::ERR_FAILED

    // A5 — abort ALL image requests → deterministic SVG-fallback (offline) state. BEFORE goto.
    // (verbatim from golden.spec.ts:91-93)
    await page.route('**/*', route =>
      route.request().resourceType() === 'image' ? route.abort() : route.continue())

    // dark theme deterministic (golden.spec.ts:97-99) — script inline reads localStorage roma-theme.
    if (theme === 'dark') {
      await page.addInitScript(() => localStorage.setItem('roma-theme', 'dark'))
    }

    await page.goto(STATIC_URL)          // ← THE ONLY CHANGE vs golden (was '/index.html')
    await settle(page)

    // per-element capture (A6), 1:1 with golden.spec.ts:105-109
    for (const [name, sel] of VIEWS) {
      const locator = page.locator(sel)
      await locator.scrollIntoViewIfNeeded()
      await expect(locator).toHaveScreenshot(`${name}-${theme}.png`)
    }

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })
}
```

#### F. Guard-assert the frozen baseline exists (Pitfall 2) — NEW, small

Add inside `beforeAll` (after `ensureBuild()`), so a `snapshotPathTemplate` misconfiguration fails loudly instead of silently auto-baselining Nuxt-against-itself. RESEARCH §Pitfall 2 mandates this:
```typescript
// One representative frozen PNG must already exist; never run with --update-snapshots.
expect(
  existsSync(join(process.cwd(), 'tests/parity/golden.spec.ts-snapshots', 'inicio-light-desktop.png')),
  'el baseline congelado de F1 (56 PNGs) debe existir — NO rebaselinar (D-01)',
).toBe(true)
```

#### G. Snapshot directory mechanic (D-01) — see Shared Pattern: Frozen-baseline snapshotPathTemplate

This is the only genuinely-new mechanic. It is **not** copied from any spec; it lives in config. See the dedicated shared pattern below. The spec calls `toHaveScreenshot(\`${name}-${theme}.png\`)` and the template resolves `{arg}=inicio-light`, `{projectName}=desktop` → `tests/parity/golden.spec.ts-snapshots/inicio-light-desktop.png`.

---

### `package.json` — MODIFY (config, scripts) — D-03 / SC#4

**Analog:** the existing `scripts` block (`package.json:6-19`). Add the gate scripts; do not remove anything.

**Current shape (verbatim, `package.json:6-19`):**
```jsonc
"scripts": {
  "dev": "nuxi dev",
  "build": "nuxi build",
  "generate": "nuxi generate",
  "preview": "nuxi preview",
  "typecheck": "nuxi typecheck",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "test:golden": "playwright test",                          // ← runs ALL parity specs incl. golden + dev-routing
  "test:golden:update": "playwright test --update-snapshots", // ← FORBIDDEN in F8 (D-01)
  "test:subpath": "playwright test tests/parity/subpath.spec.ts",
  "test:data": "vitest run tests/data",                       // ← SC#3 (F2), already green
  "test:unit": "vitest run tests/unit"                        // ← pure logic (10 specs), already green
}
```

**Additions (illustrative shape — exact names = Claude's discretion, RESEARCH §Code Examples):**
```jsonc
// gate-scoped parity run (excludes golden.spec.ts + dev-routing test — see D-04 mechanics below):
"test:parity": "playwright test -c playwright.gate.config.ts",
// the single gate (D-03): chains the three layers; a clean build at the front so the diff is current code:
"verify": "pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity"
```
> RESEARCH Open-Q#1 recommends a **front-of-gate clean build** (`pnpm generate`) so the parity suite never tests a stale `.output`; the per-spec `ensureBuild` then de-dupes within the run. Planner weighs against build-once perf (Deferred).

---

### `playwright.gate.config.ts` — NEW (recommended) (config) — D-04

**Analog:** `playwright.config.ts` (lines 1-45). The cleanest, rename-proof way to exclude `golden.spec.ts` at the **file** level (Pitfall 4 warns title-greps are brittle). Extend the base config and add `testIgnore` + the pinned `snapshotPathTemplate`.

**Base config to extend (verbatim, `playwright.config.ts:7-45`):**
```typescript
export default defineConfig({
  testDir: './tests/parity',
  webServer: {                                  // ← serves OLD index.html; the self-contained specs ignore it
    command: 'pnpm dlx serve -l 4173 .',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4173' },
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,                  // ← honored by the new spec's toHaveScreenshot
    },
  },
  // A8: NO platform suffix (captured on linux). LINE 35 — the template the new spec must override:
  snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 12'], browserName: 'chromium' } },   // ~390px
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 }, browserName: 'chromium' } },
  ],
})
```

**Recommended gate config (synthesized from base + RESEARCH §Code Examples / §Pattern 3):**
```typescript
import { defineConfig } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  // D-04 exclusion #1: golden.spec.ts re-renders the OLD index.html — redundant once the Nuxt↔golden
  // spec exists; flaky under parallel load (the deferred "4 golden failures"). Excluded at FILE level.
  testIgnore: ['**/golden.spec.ts'],
  // D-01 mechanic: pin the visual-diff baseline to the FROZEN golden dir. {arg}=`name-theme`,
  // {projectName}=mobile|desktop → tests/parity/golden.spec.ts-snapshots/<name>-<theme>-<project>.png.
  snapshotPathTemplate: 'tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}',
})
```
> **D-04 exclusion #2 (the dev-routing test)** is NOT covered by `testIgnore` (it lives in `shell.spec.ts`, which must otherwise stay in the gate for its static assertions). Two valid mechanics (Claude's discretion, Pitfall 4):
> - **CLI title-grep** appended to `test:parity`: `--grep-invert "reutiliza el MISMO TripView"` (stable substring of the title at `shell.spec.ts:224`).
> - **env-flag skip** in the spec (preferred — never spawns `nuxi dev`): wrap that one test in `test.skip(!process.env.RUN_DEV_ROUTING, …)`.
>
> Whichever is chosen, RESEARCH §Pitfall 4 requires **asserting the gate's expected test count** so an accidental over-exclusion is visible, and documenting both exclusions with reasons.

---

### `tests/parity/map-fallback-notes.spec.ts` — MODIFY (test, E2E) — D-05 back-stack gap-fill

**Gap:** SC#2 currently proves popup→ficha→`.highlight` (SC#2, lines 188-225) but NOT popup→ficha→**Volver→scroll-restored**. Add the back-half. **Extend the existing test (or add a sibling); do NOT rewrite.**

**Existing front-half to build on (verbatim, `map-fallback-notes.spec.ts:200-222`):**
```typescript
const cardMarker = page.locator('.custom-marker').filter({ hasText: CARD_ROMAN })
await expect(cardMarker, 'galleria-sciarra es el único marcador con texto exacto "I"').toHaveCount(1)
await cardMarker.dispatchEvent('click')

const popupLink = page.locator('.leaflet-popup-content a[href^="#"]', { hasText: 'Abrir ficha →' }).first()
await expect(popupLink).toBeVisible()
const href = await popupLink.getAttribute('href')
const slug = href!.slice(1)                       // = CARD_SLUG (galleria-sciarra)

await popupLink.dispatchEvent('click')            // map popup → ficha (capture-phase listener, F5)
await expect(page.locator(`#${slug}`)).toHaveClass(/\bhighlight\b/)
expect(new URL(page.url()).hash, 'D-03: …').not.toBe(`#${slug}`)
```

**Back-half to ADD** (mirror `navigation.spec.ts` SC#1, lines 217-242 — the canonical back-stack assertion). Capture `originY` **before** dispatching the popup click; use `dispatchEvent` (not `.click()`) so Playwright does not auto-scroll the source and the stacked `scrollY` stays `originY`:
```typescript
// (capture BEFORE the popup→ficha navigation; the map is at top so originY is stable)
const originY = await page.evaluate(() => window.scrollY)
// … popupLink.dispatchEvent('click') + .highlight assertion (existing front-half) …
await expect(page.locator('#back-btn')).toHaveClass(/\bshow\b/)            // canGoBack → .show
await page.click('#back-btn', { force: true })                            // Volver
await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(originY) // scroll restored
await expect(page.locator('#back-btn')).not.toHaveClass(/\bshow\b/)       // stack emptied
```

---

### `tests/parity/search-route.spec.ts` — MODIFY (test, E2E) — D-05 back-stack gap-fill

**Gap:** the result→navigation test proves result→ficha→`.highlight` (lines 191-228) but NOT →**Volver→scroll-restored**. Add the back-half. **Extend; do NOT rewrite.**

**Existing front-half to build on (verbatim, `search-route.spec.ts:199-218`):**
```typescript
await search.fill('Pante')
await expect(dropdown).toHaveClass(/\bshow\b/)
const firstResult = page.locator('.search-result').first()
await expect(firstResult).toBeVisible()
const slug = await firstResult.getAttribute('data-card')   // slug read from the row
await firstResult.click()                                  // result → ficha (onSelect → navigateToCard)
await expect(page.locator(`#${slug}`)).toHaveClass(/\bhighlight\b/)
expect(new URL(page.url()).hash, 'D-03: …').not.toBe(`#${slug}`)
```

**Back-half to ADD** (mirror `navigation.spec.ts` SC#1, lines 217-242). NOTE: `#search` lives in the masthead `#inicio` (top), so `originY` is naturally near 0; the result `.click()` is fine here (the source is in-viewport, unlike the timeline/popup cases). Still capture `originY` before the click:
```typescript
const originY = await page.evaluate(() => window.scrollY)
// … firstResult.click() + .highlight assertion (existing front-half) …
await expect(page.locator('#back-btn')).toHaveClass(/\bshow\b/)
await page.click('#back-btn', { force: true })
await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(originY)
await expect(page.locator('#back-btn')).not.toHaveClass(/\bshow\b/)
```

---

## Shared Patterns

### Frozen-baseline `snapshotPathTemplate` (D-01 mechanic) — THE one net-new mechanic

**Source:** `playwright.config.ts:35` (A8 template) + RESEARCH §Pattern 3 / §State of the Art.
**Apply to:** the new visual-diff spec (via `playwright.gate.config.ts`).

The default template is keyed on `{testFileName}`, so a new spec file would look in `visual-diff.spec.ts-snapshots/` and **silently create a fresh Nuxt-vs-itself baseline** (Pitfall 2). Fix: pin the directory to the golden dir, decoupling it from the filename. The golden PNG names are `{view}-{theme}-{project}.png` (verified on disk: `inicio-light-desktop.png`, `card-concert-dark-mobile.png`, …, exactly 56 files). With `snapshotPathTemplate: 'tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}'`, a call `toHaveScreenshot(\`inicio-light.png\`)` under project `desktop` resolves to the existing frozen PNG. On mismatch, `*-actual.png`/`*-diff.png` go to `test-results/` (not the snapshots dir) → frozen baseline untouched.
> Array-path form `toHaveScreenshot(['..','golden.spec.ts-snapshots',name])` is **forbidden** — it throws if the path escapes the test file's own `-snapshots` dir (Playwright docs). The config template is the supported escape hatch. Per-project scoping is the isolation alternative if the planner wants the override local (Claude's discretion).

### A5 deterministic image-abort

**Source:** `golden.spec.ts:91-93` (also `map-fallback-notes.spec.ts:294-296`).
**Apply to:** the visual-diff spec (always, before `goto`), so every hero/detail `<img>` `@error→motifSvg` swap fires deterministically — the same offline state the golden was captured in.
```typescript
await page.route('**/*', route =>
  route.request().resourceType() === 'image' ? route.abort() : route.continue())
```

### Strict console gate (color-mode tolerance + `tolerateAborts`)

**Source:** `map-fallback-notes.spec.ts:34, 40, 100-110` (full `tolerateAborts` form); simpler form (no aborts) in `navigation.spec.ts:199-204` / `search-route.spec.ts:121-129`.
**Apply to:** every parity spec in the gate. Tolerates ONLY `Hydration completed but contains mismatches` (color-mode SSG); with `tolerateAborts=true`, also `net::ERR_FAILED` (deliberate `route.abort`). The visual-diff aborts images → always `true`. Every test ends with `expect(consoleErrors, …).toHaveLength(0)`.

### Self-contained build+serve (NEVER the playwright.config webServer)

**Source:** identical across `navigation.spec.ts:144-167`, `search-route.spec.ts:83-106`, `map-fallback-notes.spec.ts:120-143`.
**Apply to:** the visual-diff spec. `beforeAll`: `ensureBuild()` → `mkdtempSync` → copy `.output/public` into `previewRoot/guiaRoma/` → `spawn('pnpm', ['dlx','serve','-l',PORT,previewRoot], {detached:true})` → `waitForServer`. `afterAll`: `killGroup` + `rmSync`. **Never** use the base config's `webServer` (it serves the OLD `index.html`). Pick a free base port (5780).

### `gotoHydrated` hydration gate

**Source:** `search-route.spec.ts:113-117` / `map-fallback-notes.spec.ts:149-153` (pace-btn signal); `navigation.spec.ts:173-184` (back-btn + nav-pill signal).
**Apply to:** behavior specs. The visual-diff does NOT need a hydration-signal gate (it relies on `settle()`'s `networkidle` + `fonts.ready`), but if added, the `pace-btn[data-pace="optimistic"].active` signal is the lightest.

---

## SC#2 → Spec Audit Map (for D-05; the planner's first task)

Every SC#2 item already maps to a passing test EXCEPT the two back-stack back-halves above. (From RESEARCH §Validation Architecture; files verified present.)

| SC#2 item | Spec (file) | Status |
|-----------|-------------|--------|
| theme toggle / no flash | `tests/parity/theme.spec.ts` (F3) | ✅ exists |
| pace matrix + light→slow + resumen | `tests/parity/modes.spec.ts` (F4) | ✅ exists |
| search ≥2 / max 8 / "Sin resultados" / result→nav | `tests/parity/search-route.spec.ts:131-228` (F6) | ✅ exists |
| day-route URL `(N paradas)` + Maps walking href | `tests/parity/search-route.spec.ts:230-253` (F6) | ✅ exists |
| notes `roma-note-<slug>` persistence | `tests/parity/map-fallback-notes.spec.ts:338-379` (F7) | ✅ exists |
| scrollspy `+130` | `tests/parity/navigation.spec.ts:247-303` (F5) | ✅ exists |
| back-stack: timeline → Volver | `tests/parity/navigation.spec.ts:198-245` (F5) | ✅ exists (canonical) |
| back-stack: map popup → Volver | extend `tests/parity/map-fallback-notes.spec.ts` | ❌ GAP-FILL (D-05) |
| back-stack: search result → Volver | extend `tests/parity/search-route.spec.ts` | ❌ GAP-FILL (D-05) |
| map (39+2★, popups, banner, fitBounds) — D-06 behavior-only | `tests/parity/map-fallback-notes.spec.ts:163-262` (F7) | ✅ exists |

**SC#3 (data invariants):** fully covered by `tests/data/{invariants,schema,migration-diff}.spec.ts` (F2) via `pnpm test:data`. Verified present: 3 files.
**Pure logic:** `tests/unit/*` — 10 specs verified present: `cardNavigation, dayLabel, dayRoute, foodGroups, mapMarkers, mapOffline, pace, searchIndex, svgMotifs, tripIndexes`.

---

## No Analog Found

None. All five files have exact or role-match analogs already green in the codebase. F8 introduces **zero** new dependencies and **zero** new architectural patterns — the only genuinely-new code is the pinned `snapshotPathTemplate` config line (covered above).

---

## Anti-Patterns (carried from RESEARCH — the planner must NOT do these)

- **Do NOT repoint `golden.spec.ts` at Nuxt** — it is the F1 capture/provenance tool (D-01). Leave it byte-unchanged.
- **Do NOT run `--update-snapshots` / `test:golden:update`** in F8 — it would rebaseline the golden against Nuxt (D-01, FORBIDDEN).
- **Do NOT pre-apply a font/text mask** — D-02 ("run once, classify"). The font-AA risk is structurally low (RESEARCH §Pitfall 1: same Google source family, byte-identical latin `unicode-range`, 24-byte sfnt delta). Inspect actual `*-diff.png` first, then justify any mask in writing.
- **Do NOT put `#mapa` in the visual-diff** (D-06) — no golden baseline; behavior-only via `map-fallback-notes.spec.ts`.
- **Do NOT exclude gate specs by line number or fragile title substring without asserting the test count** (Pitfall 4) — exclude `golden.spec.ts` at file level; the dev-routing test by stable title-grep or env-flag.
- **Do NOT rewrite the behavior specs** — D-05 is audit + minimal gap-fill (two back-halves), not a rewrite.

---

## Metadata

**Analog search scope:** `tests/parity/` (11 specs), `tests/data/` (3 specs), `tests/unit/` (10 specs), `playwright.config.ts`, `package.json`.
**Files scanned:** 5 read in full (`golden.spec.ts` 111L, `map-fallback-notes.spec.ts` 380L, `navigation.spec.ts` 334L, `search-route.spec.ts` 254L, `playwright.config.ts` 45L, `package.json` 45L); `tests/data`/`tests/unit` listed; `shell.spec.ts` grepped for the dev-routing title (line 224 = `'/trips/roma reutiliza el MISMO TripView…'`).
**Pattern extraction date:** 2026-06-23
**Project skills:** none found (`.claude/skills/`, `.agents/skills/` absent).
