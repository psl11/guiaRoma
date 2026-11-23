---
phase: 14-verificacion-del-milestone
fixed_at: 2026-11-22T02:37:03Z
review_path: .planning/phases/14-verificacion-del-milestone/14-REVIEW.md
iteration: 1
findings_in_scope: 13
fixed: 13
skipped: 0
skipped_out_of_scope: [WR-08, IN-04, IN-06]
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-11-22T02:37:03Z
**Source review:** .planning/phases/14-verificacion-del-milestone/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 13 (WR-01 to WR-07, WR-09, IN-01, IN-02, IN-03, IN-05, IN-07)
- Fixed: 13
- Skipped by scope decision: 3 (WR-08, IN-04, IN-06). WR-08 still got its requested partial change: an actionable error message plus README documentation.

Files touched, and nothing else: `tests/parity/upgrade-from-main.spec.ts`, `tests/parity/cross-trip.spec.ts`, `tests/data/css-vs-main.spec.ts` and `tests/README.md`. No change to app/**, shared/**, content/**, CSS, config, `package.json`, `_harness.ts`, `_pagesServer.ts` or any other parity spec. No `--update-snapshots`.

**No real defect found (D-06).** Every strengthened check passes on the current build. One new check found a behaviour that is not a defect, and it is documented in WR-02 below.

## Fixed Issues

### WR-01: «sin primer pintado claro» is not proven by a `domcontentloaded` check

**Files modified:** `tests/parity/upgrade-from-main.spec.ts`, `tests/README.md`
**Commit:** fd4f34d
**Applied fix:**
- **New helper:** `paintWithoutAppJs` opens a fresh context seeded with the user's storage (`storageState`) and aborts every `/_nuxt/` request, so only the published HTML and its inline color-mode script run.
- **New step 2b:** it asserts that the portada and Roma both paint `data-theme="dark"`, and that `useNuxtApp` never existed. A non-vacuity check requires at least one `/_nuxt/` request to have been aborted.
- **Control:** with empty storage, the same HTML paints `light`.
- **Teeth:** the prerendered HTML has no `data-theme` attribute, so the dark value can only come from the inline script.

### WR-02: «sin migración, sin recargar» is not enforced

**Files modified:** `tests/parity/upgrade-from-main.spec.ts`, `tests/README.md`
**Commit:** dad33ed
**Applied fix:**
- **Self-reload check:** `countDocumentLoads` counts main-frame navigation requests. Opening Roma from the card must be exactly 1 load, and so must the reload. Both counts are taken after `networkidle`. The upgrade test 2 also checks for exactly 1 load.
- **Extra-key check:** `newKeys` rejects any storage key outside the user's keys and the keys the live guide writes on restore. It runs after the first load, after the reload, after Campania, and in test 2.
- **Finding, not a defect:** the stricter check showed that when the user never touched the theme, @nuxtjs/color-mode persists `roma-theme=system` at boot. This has been the module's behaviour since v1.0. It copies and transforms nothing, and `system` matches what the live guide did when the key was missing. Only that exact key and value pair is accepted, through `COLOR_MODE_DEFAULT`. It is documented in the spec and in README §6.1.

### WR-03: The Campania-defaults check has no restoration anchor

**Files modified:** `tests/parity/upgrade-from-main.spec.ts`, `tests/README.md`
**Commit:** 9a6ec5b
**Applied fix:**
- **Anchor:** before entering Campania, the test seeds `campania-note-baia-di-sorgeto` and adds it to the allowed key set.
- **Order of checks:**
  1. Assert that note is restored (the positive anchor).
  2. `settleHead`: two `requestAnimationFrame`s plus 50 ms, so unhead's deferred `setTimeout(0)` can flush the `bodyAttrs`.
  3. Only then the negative checks: default pace, `aria-pressed="false"` on both toggles, no Roma mode classes on `<body>`, and every other note empty.
- **Teeth check:** I temporarily seeded `campania-resumen=1` and the test failed on «Campania: sin modo resumen». I reverted that change; it was never committed.

### WR-04: The fonts check compares family names only

**Files modified:** `tests/data/css-vs-main.spec.ts`, `tests/README.md`
**Commit:** 0a1c125
**Applied fix:**
- **Parsing main's link:** `googleFontFaces` turns the `ital,wght@…` or `wght@…` tuples of main's css2 `<link>` into 14 `family|style|weight` faces.
- **Parsing `fonts.css`:** `fontFaceRules` and `fontFaceFaces` read each `@font-face` rule.
- **New test:** `fonts.css` must declare exactly those 14 faces, and each face must have a rule with the latin subset (`U+0000-00FF`).
- **Teeth:** a test drops Cormorant Garamond 700 in memory. The family set stays equal but the face comparison fails.

### WR-05: Cascade order differs from main and is neither checked nor documented

**Files modified:** `tests/data/css-vs-main.spec.ts`, `tests/README.md`
**Commit:** aa3b27b
**Applied fix:**
- **Documentation:** the spec header and README §6.3 now describe the order inversion. main loads the Leaflet block before the editorial block; the build loads `fonts → tokens → base → leaflet`, pinned by `multitripCss.spec.ts`.
- **Tripwire:** `cssDeclarations` is a small parser that handles nested braces and top-level splits, walks into `@media`, `@supports`, `@layer` and `@container`, and skips `@font-face` and `@keyframes`. `cascadeConflicts` uses it to flag the same selector with the same property but a different value (or a different `!important`) across `leaflet.css` and `tokens.css` + `base.css`, in any `@media` context. Today the result is empty.
- **Non-vacuity:** declaration counts, and the parser reaching Leaflet's `@media print`.
- **Teeth:** injecting a conflicting rule is detected, and a same-value rule is not.
- `nuxt.config.ts` is unchanged.

### WR-06: Ports come from the unbounded `TEST_WORKER_INDEX`

**Files modified:** `tests/parity/upgrade-from-main.spec.ts`, `tests/parity/cross-trip.spec.ts`, `tests/README.md`
**Commit:** 8c57f92
**Applied fix:** both specs now use `6600 + TEST_PARALLEL_INDEX` and `6700 + TEST_PARALLEL_INDEX`, which always stay in `0..workers-1`. Comments and README §1, §6.1 and §6.2 are updated.

### WR-07: The `ensureBuild` fallback can run `pnpm generate` concurrently

**Files modified:** `tests/parity/upgrade-from-main.spec.ts`, `tests/parity/cross-trip.spec.ts`, `tests/README.md`
**Commit:** d124cc0
**Applied fix:**
- **Change:** `ensureBuild` and its `spawnSync('pnpm', ['generate'])` are replaced by `requireBuild`, a fail-fast check. It names the missing file and the command to run: `rm -rf .data .nuxt .output && pnpm generate` (or `pnpm verify`).
- **Checked:** I moved `.output` away temporarily. Both specs failed at once with that message, and 6 tests did not run. `.output` was then restored.
- **README §6:** documents that the build is a precondition and that the check is existence-only.

### WR-09: cross-trip uses the default 30 s test timeout

**Files modified:** `tests/parity/cross-trip.spec.ts`
**Commit:** c833db6
**Applied fix:** `test.describe.configure({ timeout: 90_000 })`, and the `searchUntil` `toPass` timeout is cut from 30 s to 10 s, so its diagnostic surfaces instead of a silent test timeout.

### IN-01: History steps have no non-vacuity control

**Files modified:** `tests/parity/cross-trip.spec.ts`, `tests/README.md`
**Commit:** a06c325
**Applied fix:**
- All 11 `goBack()`/`goForward()` + `landOn` pairs now go through `historyStep`.
- Before navigating, `historyStep` sets a marker on `window`. After landing it requires the marker to be gone and `performance.getEntriesByType('navigation')[0].type === 'back_forward'`.
- So a bfcache restore can no longer make "zero heavy downloads" pass vacuously.

### IN-02: The orphaned-rule regex matches any closing brace

**Files modified:** `tests/data/css-vs-main.spec.ts`
**Commit:** 56f0a30
**Applied fix:** the patterns now require `}}` (`/\}\}\.tl-meta-item\{[^{}]*\}/g` and the same for `.recommended`), and the match is replaced with `'}'` (`ORPHAN_REPLACEMENT`). Counts are still `[1, 1]`, the equality still holds, and the "without removing orphans" teeth test still fails as intended.

### IN-03: The array returned by `blockOffOrigin` is never used

**Files modified:** `tests/parity/cross-trip.spec.ts`, `tests/parity/upgrade-from-main.spec.ts`, `tests/README.md`
**Commit:** fcf2ef2
**Applied fix:**
- **cross-trip:** both download flows now use the returned list. They assert that no aborted off-origin request goes to `fonts.googleapis.com` or `fonts.gstatic.com`, with a control that the list is not empty (it sees tiles and images).
- **upgrade:** `blockOffOrigin` now returns `void`, because the live guide there does request Google Fonts.

### IN-05: Redundant waits after `goto`/`reload` and after `waitForURL`

**Files modified:** `tests/parity/upgrade-from-main.spec.ts`, `tests/parity/cross-trip.spec.ts`
**Commit:** dc1035b
**Applied fix:** removed the four `waitForLoadState('load')` calls that directly follow `goto`/`reload`, and the final `expect(page.url()).toBe(url)` in `landOn`. A comment explains each removal. This is a necessity finding that removes code, so it **requires human verification**: confirm you agree to drop the belt-and-braces checks. All tests still pass.

### IN-07: The oracle context copies only the viewport

**Files modified:** `tests/parity/upgrade-from-main.spec.ts`, `tests/README.md`
**Commit:** cf80205
**Applied fix:**
- `deviceOptions` builds the context options from the test fixtures: `viewport`, `isMobile`, `hasTouch`, `deviceScaleFactor` and `userAgent`.
- They are used for the oracle and for both no-JS contexts.
- The oracle now returns its `DeviceEnv` (UA, `maxTouchPoints`, DPR), and the test asserts it equals the user page's. Before this fix, that check would have failed on `mobile`.

## Skipped Issues

### WR-08: The git dependency hard-requires a local `main` branch

**File:** `tests/parity/upgrade-from-main.spec.ts:74-88`, `tests/data/css-vs-main.spec.ts:40-50, 128`
**Reason:** scope decision. The `origin/main` fallback and the staleness check are deferred to the ship/deploy act, which is when CI arrives. A partial change was still made, as requested (commit 4880213):
- Both specs now throw `liveGuideError`. It distinguishes "no local `main` branch" from other git failures and gives the command `git fetch origin main && git branch main origin/main`, plus the CI requirement (`fetch-depth: 0` and then that `git branch`).
- README §6 documents the requirement: the CI behaviour, the risk of a stale local `main`, and the deferral.
- Checked with `GIT_DIR` pointing at an empty bare repository: the data spec fails with the new message.

**Original issue:** `git show main:index.html` only resolves a local `main`. `actions/checkout` never creates one, so CI cannot run the gate. Locally, a `main` that lags behind `origin/main` would be compared silently.

### IN-04: `ensureBuild`, `blockOffOrigin` and `hydrated` are cloned into every spec

**File:** `tests/parity/upgrade-from-main.spec.ts:45-71`, `tests/parity/cross-trip.spec.ts:57-84`
**Reason:** scope decision. Extracting the helpers into `_harness.ts` would edit an existing parity file, which the frozen-spec rule forbids. WR-07 has since removed `ensureBuild` from both new specs.
**Original issue:** the helpers are verbatim clones across at least four specs and will drift.

### IN-06: The new parity specs are neither linted nor type-checked by the gate

**File:** `tests/README.md:715-717` (and `eslint.config.mjs`)
**Reason:** scope decision. This needs a lint/typecheck configuration change. The documented manual step `eslint --no-ignore` (README §6.4) stays in place.
**Original issue:** `pnpm lint` ignores `tests/parity/**` and `nuxi typecheck` does not cover the Playwright specs.

## Verification

All checks ran in the **main checkout**, on branch `release/nuxt-4`, with Node 22.20.0. `workflow.use_worktrees` is `false`, so no worktree was created.

| Check | Result |
|-------|--------|
| `eslint --no-ignore` on the 3 specs | clean |
| `vitest run tests/data/css-vs-main.spec.ts` | **11 passed** (was 7: +1 face test, +1 cascade test, +2 teeth tests) |
| `playwright test -c playwright.gate.config.ts upgrade-from-main + cross-trip --repeat-each 3` | **48 passed** (30.2 s, 12 workers), against the existing `.output` build. It was not regenerated: no app or content change since the build |
| Gate `--list` | `Total: 126 tests in 15 files` (grep-invert) and `Total: 128 tests in 15 files` (raw). Unchanged, so README §4 is untouched |
| Ad-hoc `tsc --strict` on the 3 specs | no errors in the changed code (the only errors come from missing `@types/node` in the repo) |
| Servers | none left listening on 66xx or 67xx |

The full `pnpm verify` was not run (the orchestrator runs it). Expect `test:data` to rise from 774 to 778 because of the 4 new css-vs-main tests.

---

_Fixed: 2026-11-22T02:37:03Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
