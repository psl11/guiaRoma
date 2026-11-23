---
phase: "12"
slug: "formas-nuevas-de-viaje"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: true) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-21"
validated: "2026-11-21"
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `12-RESEARCH.md` §«Validation Architecture».

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (`tests/unit`, `tests/data`) + Playwright 1.61.0 (gate `playwright.gate.config.ts`; `tests/trips` with `playwright.trips.config.ts` on `nuxi dev`, port 5300) |
| **Config file** | `vitest.config.ts`, `playwright.gate.config.ts`, `playwright.trips.config.ts` |
| **Quick run command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm test:unit && pnpm test:data` |
| **Full suite command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm verify` (includes `rm -rf .data .nuxt .output`) + `pnpm typecheck && pnpm lint`; separately and never at the same time: `rm -rf .data .nuxt && pnpm test:trips` |
| **Estimated runtime** | quick < 10 s; full ~ 6-9 min; trips ~ 1-2 min |

---

## Sampling Rate

- **After every task commit:** quick run, plus `pnpm typecheck` when touching `.vue`/schema
- **After every plan wave:** `pnpm verify`, then `rm -rf .data .nuxt && pnpm test:trips` (sequential), then the frozen-files check `git diff --exit-code 7288781 -- content/trips/roma app/assets/css/base.css app/assets/css/tokens.css app/assets/css/fonts.css app/assets/css/leaflet.css tests/parity/golden.spec.ts tests/parity/golden.spec.ts-snapshots`
- **Before `/gsd-verify-work`:** full suite green, `pnpm test:trips` green, gate count re-registered in `tests/README.md`
- **Max feedback latency:** 10 seconds (quick)

---

## Per-Task Verification Map

| Req / Decision | Behavior | Test Type | Automated Command | File Exists | Status |
|----------------|----------|-----------|-------------------|-------------|--------|
| D-18 | Roma's YAML unchanged still validates; Roma, frozen CSS and goldens untouched | data + git | `pnpm test:data` + frozen-files `git diff --exit-code` | ✅ | ✅ green |
| EXT-01 | `choice` accepts 2–3 options; rejects 1/4, nested choice, `pace`, unknown keys; JSON-Schema `timeline.type === 'array'` | data | `pnpm exec vitest run tests/data/schema.spec.ts` | ✅ extended | ✅ green |
| EXT-01 / EXT-06 | `flattenRows`, `optionOnlyRefs` | unit | `pnpm exec vitest run tests/unit/timelineRows.spec.ts` | ✅ W0 | ✅ green |
| EXT-01 | Gate: `ref` inside an option is checked (teeth) | data | `pnpm exec vitest run tests/data/invariants.spec.ts` | ✅ extended | ✅ green |
| EXT-01 | «Elige una», «— o bien —», both options visible at every pace, in light and in summary mode; root `div` | e2e dev | `pnpm test:trips` (`campania.spec.ts`) | ✅ W0 | ✅ green |
| EXT-02 | `stayFor`; gate `stay-ref`/`stay-dup` name the file | unit + data | `pnpm exec vitest run tests/unit/tripStays.spec.ts tests/data/invariants.spec.ts` | ✅ W0 | ✅ green |
| EXT-02 | «Dormís en …» in Campania's headers; absent in Roma | e2e dev + parity | `pnpm test:trips`; `pnpm test:parity` | ✅ | ✅ green |
| EXT-03 | Every transport/stats value has a CSS rule (`train` exempt: Roma has none and adding one would change a golden) | unit | `pnpm exec vitest run tests/unit/enumStyles.spec.ts` | ✅ W0 | ✅ green |
| EXT-03 | `.tl-transport.ferry`/`car`/… with their own computed colour | e2e dev | `pnpm test:trips` | ✅ | ✅ green |
| EXT-04 | Every `Motif` has an SVG; SVG ids unique; every `PlaceType` has a marker style; Roma popups byte-identical | unit | `pnpm exec vitest run tests/unit/svgMotifs.spec.ts tests/unit/mapMarkers.spec.ts tests/unit/enumStyles.spec.ts` | ✅ | ✅ green |
| EXT-04 | Nature card with a broken image → motif SVG; `nature` marker colour | e2e dev | `pnpm test:trips` | ✅ | ✅ green |
| EXT-05 | Naples/Procida/Ischia/Salerno markers inside the map box | e2e dev | `pnpm test:trips` | ✅ | ✅ green |
| EXT-05 | Roma: 39 markers, same view | parity | `pnpm test:parity` | ✅ | ✅ green |
| EXT-06 | `buildDirUrl(p)` identical to today; driving/transit; option exclusion; ferry/`enabled`/<2 precedence | unit | `pnpm exec vitest run tests/unit/dayRoute.spec.ts` | ✅ extended | ✅ green |
| EXT-06 | Sun 20 without button; Thu 24 counts shared stops only; Fri 25 `travelmode=driving` | e2e dev | `pnpm test:trips` | ✅ | ✅ green |
| EXT-07 | «Con niños» box on Sorgeto; no `.family-box` in Roma | e2e dev + build | `pnpm test:trips`; `pnpm verify` | ✅ | ✅ green |
| D-17 | `tripshapes.css` selectors in the allowlist; no allowlisted class in the built HTML; `css[]` order | unit + data (build) | `pnpm exec vitest run tests/unit/tripShapesCss.spec.ts tests/unit/multitripCss.spec.ts`; `pnpm verify` | ✅ | ✅ green |
| D-16 | Campania sentinel absent from `.output/public` (decoded dumps); `trips/campania` not prerendered | data (build) | `pnpm verify` (`build-isolation.spec.ts`) | ✅ extended | ✅ green |
| PAR | 56 goldens with no `--update-snapshots`; 110 gate tests green | e2e (gate) | `pnpm test:parity` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/unit/cssSelectors.ts` — shared selector extractor (taken out of `multitripCss.spec.ts`)
- [x] `tests/unit/timelineRows.spec.ts` — EXT-01/EXT-06
- [x] `tests/unit/tripStays.spec.ts` — EXT-02
- [x] `tests/unit/enumStyles.spec.ts` — EXT-03/EXT-04
- [x] `tests/unit/tripShapesCss.spec.ts` — D-17 (+ adjust `css[]` in `multitripCss.spec.ts`)
- [x] `tests/trips/campania.spec.ts` — E2E of the 7 requirements on the draft (dev :5300)
- [x] Build half of D-17 + Campania sentinel in `tests/data/build-isolation.spec.ts` (or a sibling)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Look of the 4 new drawings and of the transport colours in light/dark themes | EXT-03, EXT-04 | Visual judgement (no golden, the draft is not built) | Open `/trips/campania` in `pnpm dev`, break an image, toggle the theme |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-11-21 (validate-phase --auto, retroactive audit)

**Evidence (orchestrator-run at HEAD after 12-07, Node 22, caches cleared):**
- `pnpm verify` (gate-12w7): unit **541/541**, data **560/560**, parity **110/110** (13 files; 56 goldens, no `--update-snapshots`); EXIT=0.
- `pnpm test:trips`: **44/44** (24 `campania:` E2E covering EXT-01..07 + isolation/shape/portada).
- `pnpm typecheck` exit 0, `pnpm lint` exit 0.
- `git diff 7288781 HEAD -- content/trips/roma app/assets/css/{base,tokens,fonts,leaflet}.css tests/parity/golden.spec.ts tests/parity/golden.spec.ts-snapshots` empty.
- Known flakes seen during waves (each passed on re-run, not Phase 12 regressions): `navigation.spec.ts` SC#2 scrollspy [mobile] ~29s vs 30s timeout (w4); `legacy-redirect.spec.ts` /#pantheon [desktop] 3px vs 2px tolerance (w5, 56/56 with `--repeat-each 4`).

## Validation Audit 2026-11-21

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
