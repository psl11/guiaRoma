---
phase: 08-verificaci-n-de-paridad
plan: 02
subsystem: testing
tags: [playwright, visual-regression, toHaveScreenshot, ssg, parity, golden, nuxt]

# Dependency graph
requires:
  - phase: 01-andamiaje-y-golden
    provides: "golden.spec.ts (F1 capture tool) + 56 frozen golden PNGs (tests/parity/golden.spec.ts-snapshots/) as the read-only pixel baseline; A5/A8/maxDiffPixelRatio:0.01 capture contract"
  - phase: 07-isla-mapa-leaflet
    provides: "map-fallback-notes.spec.ts — the self-contained build+serve scaffold cloned here (ensureBuild/waitForServer/killGroup, beforeAll/afterAll, trackConsoleErrors+tolerateAborts)"
  - phase: 08-verificaci-n-de-paridad (Plan 01)
    provides: "back-stack gap-fill in map/search specs (D-05) — sibling Wave-1 work, independent of this spec"
provides:
  - "tests/parity/visual-diff.spec.ts — the NET-NEW Nuxt↔golden visual-diff spec (SC#1): builds+serves the Nuxt site under /guiaRoma/ and screenshots the 14 golden VIEWS × {light,dark} to compare against the 56 FROZEN PNGs"
  - "A beforeAll guard-assert that the frozen F1 baseline exists (loud-fail-not-auto-baseline, Pitfall 2)"
  - "Base port 5780 reserved for the visual-diff spec (modes=5700, navigation=5720, search-route=5740, map-fallback-notes=5760, visual-diff=5780)"
affects: [08-03 gate-config-snapshotPathTemplate, 08-06 first-run-and-diff-classification, parity-sign-off]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "5th clone of the self-contained build+serve Playwright spec (generate → cp to previewRoot/guiaRoma/ → detached pnpm dlx serve → waitForServer); the ONLY goto-target change vs golden is the served Nuxt build, not /index.html"
    - "Verbatim graft of the golden determinism harness (VIEWS + settle() + A5 image-abort) into a new spec so the visual-diff is apples-to-apples"
    - "Frozen-baseline-as-read-only by construction: guard-assert + never-pass-the-update-flag; snapshot directory resolution is delegated to the gate config (Plan 03), not hardcoded in the spec"

key-files:
  created:
    - "tests/parity/visual-diff.spec.ts"
  modified: []

key-decisions:
  - "The visual-diff spec calls toHaveScreenshot(`${name}-${theme}.png`) and leaves the snapshot-directory resolution to Plan 03's gate config (snapshotPathTemplate); it does NOT hardcode an array path (forbidden — escapes the file's own -snapshots dir) nor a snapshotPathTemplate workaround"
  - "A5/settle()/VIEWS are copied VERBATIM from golden.spec.ts (the only functional change is goto → served /guiaRoma/ build); the two redundant single-arg arrow-parens from the verbatim settle() were trimmed to satisfy @stylistic/arrow-parens under forced lint (zero behavioral change)"
  - "The two D-06/D-01 documentation comments were worded WITHOUT the literal tokens `#mapa`/`update-snapshots` so the acceptance-criteria grep (file must NOT contain those tokens) is satisfied literally while the invariants stay documented"

patterns-established:
  - "Pattern: a NEW visual-regression spec reuses a frozen baseline by delegating the snapshot dir to a gate-level snapshotPathTemplate + a beforeAll existsSync guard-assert, never --update-snapshots"

requirements-completed: [PARITY-02]

# Metrics
duration: 5min
completed: 2026-06-23
---

# Phase 8 Plan 02: Verificación de paridad — visual-diff Nuxt↔golden Summary

**The net-new Playwright spec that screenshots the built Nuxt site under `/guiaRoma/` (14 views × light/dark) against the 56 frozen golden PNGs — the objective pixel-parity proof of SC#1, with the F1 golden left byte-unchanged.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-06-23T22:14Z (after 08-01 doc commit)
- **Completed:** 2026-06-23T22:19Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments
- Created `tests/parity/visual-diff.spec.ts` (250 lines), the single net-new spec of F8: a 5th clone of the self-contained build+serve scaffold that grafts `golden.spec.ts`'s `VIEWS` + `settle()` + A5 image-abort VERBATIM and swaps the only functional line — `goto` now targets the served Nuxt build under `/guiaRoma/` (base port 5780), not `/index.html`.
- Captures each of the 14 golden views per theme with `toHaveScreenshot(\`${name}-${theme}.png\`)`; the snapshot directory resolution is intentionally left to Plan 03's gate config (`snapshotPathTemplate`), so the spec stays free of array-path hacks.
- Added the Pitfall-2 `beforeAll` guard-assert (`existsSync` of `tests/parity/golden.spec.ts-snapshots/inicio-light-desktop.png`) so a misconfigured snapshot template fails loudly instead of silently auto-baselining Nuxt-against-itself; the spec never passes the baseline-update flag (D-01).
- `golden.spec.ts` left byte-unchanged (`git diff --quiet` exits 0); `#mapa` absent from VIEWS (D-06); no mask/stylePath/maxDiffPixels override (D-02 — diff classification is Plan 06).

## Task Commits

Each task was committed atomically:

1. **Task 1: visual-diff.spec.ts — Nuxt-vs-golden visual-diff over the 14 views (SC#1/D-01)** — `d9480bb` (test)

**Plan metadata:** (this commit) `docs(08-02): complete visual-diff spec plan`

_Note: this is a TDD-typed plan, but the plan's automated gate is structural correctness + lint (not a green visual-diff). The diff cannot resolve baselines until Plan 03 supplies the gate `snapshotPathTemplate`, and the first real run + classification is Plan 06. There is therefore a single `test(...)` commit; the GREEN gate (a passing visual-diff) is deferred to Plan 06 by plan design._

## Files Created/Modified
- `tests/parity/visual-diff.spec.ts` — Self-contained build+serve visual-diff spec. `beforeAll`: `ensureBuild()` → guard-assert frozen baseline exists → `mkdtempSync` → `cpSync` `.output/public` into `previewRoot/guiaRoma/` → detached `pnpm dlx serve -l 5780` → `waitForServer`. Per theme (`light`/`dark`): register A5 image-abort before goto, dark via `addInitScript(localStorage roma-theme=dark)`, `goto(STATIC_URL)`, `settle(page)`, then per-VIEW `scrollIntoViewIfNeeded()` + `toHaveScreenshot`. Console gate `tolerateAborts=true` (A5 aborts images → expected `net::ERR_FAILED`); each test ends with `consoleErrors` length 0.

## Decisions Made
- **Snapshot-dir delegation:** the spec calls `toHaveScreenshot(\`${name}-${theme}.png\`)` and relies on Plan 03's gate config to point `{arg}-{projectName}` at the frozen golden dir. The array-path form (`['..','golden.spec.ts-snapshots',name]`) is forbidden (throws when escaping the file's own `-snapshots` dir), and inventing a `snapshotPathTemplate` here would bypass the gate config — so neither was used (per plan key-constraints).
- **Verbatim graft + minimal stylistic trim:** `VIEWS`/`settle()`/A5 are byte-copied from `golden.spec.ts`. `golden.spec.ts` lives under the ESLint-ignored `tests/parity/**` glob, so its two single-arg arrow-parens (`.map((img) =>`, `new Promise((r) =>`) never had to satisfy `@stylistic/arrow-parens`. To make the new spec clean even under forced linting (`eslint --no-ignore`), those two parens were trimmed to `img =>` / `r =>` — a pure formatting change with no behavioral effect on the determinism harness.
- **Token-safe documentation comments:** the acceptance criteria require the file to NOT contain the literal tokens `#mapa` or `update-snapshots`. The D-06 and D-01 invariants are still documented, but phrased as "la isla del mapa" and "el flag de actualización de baseline" so a literal grep is clean.

## Deviations from Plan

None — plan executed exactly as written. The two arrow-parens trims and the two comment rewordings are not scope changes: they bring the verbatim-copied harness into compliance with the project's stylistic ESLint config and the literal acceptance-criteria grep, fully within the plan's "structurally-correct, lint-clean spec" mandate (and explicitly within Claude's discretion per the plan's verification notes).

## Issues Encountered
- **ESLint ignores `tests/parity/**`.** `eslint.config.mjs:16` deliberately ignores the whole Playwright harness dir, so `pnpm lint tests/parity/visual-diff.spec.ts` exits 0 regardless of content (it emits only a "File ignored" warning). To obtain a real lint signal I ran `eslint --no-ignore` on the file: it surfaced two `@stylistic/arrow-parens` errors inherited from the verbatim `settle()`. After trimming the redundant parens, both forced-lint (`--no-ignore`, exit 0) and the project gate (`pnpm lint`, exit 0) are clean. The project gate the plan specifies passes; the forced lint confirms the file is genuinely clean, not merely skipped.

## User Setup Required
None - no external service configuration required. (No new dependencies; `serve` is fetched transiently via `pnpm dlx serve`, already in use F1–F7.)

## Next Phase Readiness
- The visual-diff spec exists and is structurally correct + lint-clean. It is NOT yet expected to pass the pixel comparison: it needs **Plan 03** to supply the gate's `snapshotPathTemplate` (resolving `{arg}-{projectName}` to the frozen golden dir) and to exclude `golden.spec.ts` + the dev-routing test from the gate. The **first real run + diff classification (D-02)** is **Plan 06**.
- The frozen 56-PNG baseline remains pristine (read-only by construction: guard-assert + no update flag). `golden.spec.ts` is byte-unchanged.

## Self-Check: PASSED

- FOUND: `tests/parity/visual-diff.spec.ts`
- FOUND: `.planning/phases/08-verificaci-n-de-paridad/08-02-SUMMARY.md`
- FOUND commit: `d9480bb`

---
*Phase: 08-verificaci-n-de-paridad*
*Completed: 2026-06-23*
