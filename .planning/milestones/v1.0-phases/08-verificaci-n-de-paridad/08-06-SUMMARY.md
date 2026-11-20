---
phase: 08-verificaci-n-de-paridad
plan: 06
subsystem: parity-gate
tags: [parity-gate, playwright, visual-diff, fonts, lora, golden-baseline, ssg]
requires:
  - "Plan 02: visual-diff.spec.ts (Nuxt↔golden over the built /guiaRoma/)"
  - "Plan 03: playwright.gate.config.ts (testIgnore golden + snapshotPathTemplate→frozen dir) + pnpm verify/test:parity"
  - "Plan 05: tests/README.md recorded gate count (80 selected / 82 raw)"
  - "Phase 1: tests/parity/golden.spec.ts-snapshots/ — the 56 baseline PNGs"
provides:
  - "GREEN pnpm verify (SC#4): unit 87/87, data 295/295, parity 80/80 — the objective proof of SC#1+SC#2+SC#3 for the shipped offline build"
  - "diff-classification.md: full D-02 record — VDPROBE method, root-cause of every residual, and the resolution (font re-vendor + golden re-baseline)"
  - "scripts/vendor-fonts.mjs: reproducible self-host of the Google css2 fonts index.html uses"
affects:
  - "Plan 07 (human sign-offs): the gate is green; 07 is the human visual acceptance pass"
tech-stack:
  added: []
  patterns:
    - "VDPROBE diagnostic harness: temporarily wrap each toHaveScreenshot in try/catch to enumerate ALL view pass/fail+deltas in one run, then revert to fail-fast (instrumentation never ships in the gate)"
    - "Font parity is metric+kerning, not just family: self-hosted woff2 must match the golden's cut or near-full lines re-wrap; verify with a probe string under text-rendering:optimizeLegibility"
    - "When offline self-hosted fonts cannot byte-match the network golden, the golden tracks the SHIPPED build (re-baseline), not an un-shippable network render"
key-files:
  created:
    - "scripts/vendor-fonts.mjs — fetch the exact Google css2 index.html uses + self-host woff2 (offline, BUILD-02)"
  modified:
    - "app/assets/fonts/*.woff2 + app/assets/css/fonts.css — re-vendored Lora/Cormorant/JetBrains (metric-match Google for isolated strings; fixed desktop +688px)"
    - "tests/parity/golden.spec.ts-snapshots/*.png — 38 of 56 re-captured from the Nuxt build (golden now tracks the shipped offline render)"
    - "tests/parity/visual-diff.spec.ts — VDPROBE harness added then reverted to fail-fast (net: unchanged behavior)"
key-decisions:
  - "Root cause of the F8 blocker (VDPROBE + localization): the prior self-hosted Lora rendered ~3.7% WIDER than the Google Lora v37 the golden encoded → desktop day-views +289/+688/+378px. REAL diff (D-02 path a), not sub-pixel rasterization as previously recorded. Fixed by re-vendoring."
  - "Residual after the font fix: Nuxt's Lora cut and index.html's Google Lora share base advance widths but differ in KERNING/GPOS (3.9% on long prose under optimizeLegibility) → mobile sub-line re-wrap. Not CSS-width, not SSR comment markers (both ruled out by measurement)."
  - "DEVIATION — D-01 OVERRIDDEN by explicit user decision: byte-exact font parity with index.html's NETWORK Google fonts is not worth the cost; the offline self-hosted fonts (BUILD-02) are a different cut. Per user, goal = effective visual+functional parity of what ships. Re-baselined the 56 goldens from the current Nuxt build via --update-snapshots through the gate config (38 changed)."
  - "No masks / stylePath / per-view maxDiffPixels applied; maxDiffPixelRatio:0.01 unchanged. The re-baseline (not a tolerance) is what closes the gate — dimension mismatches cannot be absorbed by a pixel-ratio tolerance anyway."
  - "golden.spec.ts (index.html capture tool) intentionally no longer matches the goldens; it stays excluded from the gate (testIgnore). Gate parity count = 80, matches tests/README.md (D-04, no over-exclusion)."
patterns-established:
  - "Diagnose-before-decide on parity residuals: enumerate+localize+root-cause (real vs rasterization vs font-cut) before choosing fix vs tolerate vs re-baseline."
requirements-completed: [PARITY-02]
metrics:
  duration_min: 0
  tasks: 1
  files: 41
  completed: 2026-06-24
---

# Phase 8 Plan 06: Run the parity gate to GREEN + classify every diff (D-02) Summary

**`pnpm verify` is GREEN end-to-end (unit 87/87, data 295/295, parity 80/80) — the first pixel-for-pixel pass of the built Nuxt site against the golden, achieved by root-causing the residual to a Lora font-cut mismatch and, per explicit user decision, re-baselining the golden from the shipped offline build rather than chasing byte-exact font parity with index.html's network fonts.**

## What Was Built

The empirical heart of F8. A `VDPROBE` diagnostic harness enumerated every view's pass/fail and delta in one run; standalone Playwright measurements then localized the dominant blocker. Findings, in order:

1. **The recorded "sub-pixel rasterization" conclusion was wrong.** The desktop day-view inflation (`dia-viernes`/`sabado`/`domingo` = +289/+688/+378px) was a **real font-metric diff**: the previously self-hosted Lora rendered ~3.7% wider than the Google Lora v37 the golden encoded (probe string 762px vs 735px). Spread evenly across every prose card; identical text/width/line-height — wider glyphs re-wrapped near-full lines.

2. **Font re-vendor (`scripts/vendor-fonts.mjs`, kept).** Re-fetched the exact Google css2 `index.html` uses and self-hosted it (offline preserved, BUILD-02). All four families' isolated probe widths went to Δ=0; the desktop +688px inflation was fixed (gate-confirmed).

3. **Residual exposed.** With base widths matched, the gate showed mobile views rendering short. Measured to a **kerning/GPOS** difference between Nuxt's Lora cut and index.html's Google Lora (3.9% on long prose under `text-rendering: optimizeLegibility`; base widths and short strings match exactly). Ruled out CSS width (mobile prose widths byte-identical) and Vue SSR fragment comments (no layout effect). The offline self-hosted font is a different *cut* and cannot byte-match the network font.

4. **Resolution — re-baseline (user decision, overrides D-01).** Since the residual manifests as dimension mismatches (which `toHaveScreenshot` hard-fails and no pixel-ratio tolerance can absorb), and byte-exact font parity with network Google fonts is not worth the cost, the 56 goldens were re-captured from the **current Nuxt build** — the real offline, self-hosted-font render that ships — via `--update-snapshots` through the gate config (38 PNGs changed, 18 already matched). No masks; `maxDiffPixelRatio:0.01` unchanged.

## Deviations

- **D-01 (never rebaseline the 56 frozen PNGs) was explicitly overridden** by the user this session. Rationale recorded in `diff-classification.md` (7th update) and above. The goldens now track the shipped Nuxt build, so future visual regressions are still caught — against the real deployed render rather than an un-shippable network-font render.
- The plan also assumed "no font mask needed; fonts are glyph-equivalent (24-byte sfnt delta)." That premise proved false (different Lora cut); the fix was re-vendoring + re-baseline, not a mask.

## Verification

`pnpm verify` → exit 0: build clean, `test:unit` 87/87, `test:data` 295/295, `test:parity` 80/80 (matches the recorded gate count in tests/README.md — D-04, no over-exclusion). `diff-classification.md` carries the per-stage D-02 record.

## Notes for Plan 07

Gate is green; 07 is the human visual sign-off. If the self-hosted font ever reads visibly wrong against the original guide, revisit per the user's "ya lo ajustaremos" — the golden now reflects the shipped build, so a deliberate font change would be a visible, reviewable golden diff.
