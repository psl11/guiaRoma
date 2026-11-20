---
phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas
plan: 03
subsystem: ui
tags: [vue, nuxt, localStorage, svg-fallback, provide-inject, mdc, v-html]

# Dependency graph
requires:
  - phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas (Plan 01)
    provides: "motifSvg(motif) + SVG_MOTIFS (19 verbatim strings) in app/utils/svgMotifs.ts; Motif type in shared/schemas.ts"
  - phase: 04-render-de-contenido-y-modos
    provides: "MonumentCard.vue (hero + notes shells, D-01/D-02 frontiers) and DetailPhoto.global.vue (plain img, D-01 frontier) + the :value/@input + onMounted-localStorage discipline"
provides:
  - "Hero <img> @error → motifSvg(monument.motif) via v-html (port of loadSvgFallback, index.html:2215-2227); heroHidden dead branch ported for fidelity"
  - "Detail <img> @error → motif SVG with the 4 verbatim inline styles, caption kept (port of loadSvgFallbackDetail, index.html:2229-2252)"
  - "Per-monument notes persisted under the exact key roma-note-<slug>, read in onMounted, debounced @input save (port of setupNotes, index.html:6471-6483)"
  - "provide('monumentMotif')/inject pipe: MonumentCard → DetailPhoto.global.vue through the MDCRenderer subtree"
affects: [08-parity-verification]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "v-html of a TRUSTED static SVG constant (single-line eslint-disable vue/no-v-html on the directive line only; never on data fields)"
    - "provide/inject across the MDCRenderer subtree to pass a parent datum (motif) to an MDC-resolved global component that only receives string props"
    - "Detail SVG carries inline styles by string-injecting them into the <svg ...> open tag (CSS targets img, not the swapped svg)"

key-files:
  created:
    - .planning/phases/07-isla-client-only-mapa-fallback-de-imagen-y-notas/07-03-SUMMARY.md
  modified:
    - app/components/MonumentCard.vue
    - app/components/DetailPhoto.global.vue
    - eslint.config.mjs

key-decisions:
  - "defineProps destructured to `const { monument } = defineProps<…>()` so the new setup logic (onHeroError/onNoteInput/provide) reads `monument` exactly like the template's existing `monument.*` style — Vue 3.5 reactive props destructure, no `props.` prefix introduced"
  - "Detail SVG inline styles injected by replacing `<svg ` with `<svg style=\"width:100%; height:auto; border-radius:4px; display:block\" ` in a computed (byte-faithful to the original's svg.style.* before img.replaceWith); the four styles land on the <svg> itself because base.css:825 targets `.detail-photo img`, not svg"
  - "No-motif detail branch handled with `v-else-if=\"detailSvg\"` on the span: when failed && detailSvg===undefined, neither img nor span renders, only the caption survives — exact mirror of the original's `img.style.display='none'`"
  - "eslint.config.mjs: relaxed ONLY vue/max-attributes-per-line for DetailPhoto.global.vue (same scoped-override precedent as MonumentCard/Timeline/reference sections) so the whitespace-sensitive single-line `<span v-else-if v-html>` keeps its eslint-disable adjacent; CERO-CSS and all other rules stay active"

patterns-established:
  - "Image-with-fallback in Vue: failed-flag ref + v-html of the trusted SVG; hero needs no inline styles (.card-hero svg sizes it), detail needs the 4 inline styles on the svg"
  - "Notes persistence: :value/@input (not v-model), key read in onMounted (empty at SSR → no hydration mismatch), debounced setItem in try/catch"

requirements-completed: [UI-05, FEAT-04]

# Metrics
duration: 14min
completed: 2026-06-23
---

# Phase 7 Plan 03: Image-fallback + notes wiring Summary

**The two F4-mounted shells wired 1:1 to index.html: hero & detail `<img>` `@error` now swap in the trusted `motifSvg(monument.motif)` (hero CSS-sized, detail with the four verbatim inline styles + caption kept), per-monument notes persist under the exact `roma-note-<slug>` key (read in `onMounted`, debounced `@input` save), and the `motif` reaches `DetailPhoto.global.vue` via `provide`/`inject` through the MDCRenderer subtree.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-06-23T14:36Z
- **Completed:** 2026-06-23T14:50Z
- **Tasks:** 2
- **Files modified:** 3 (2 components + eslint.config.mjs)

## Accomplishments
- **UI-05 hero** (`MonumentCard.vue`): on `@error` the `.card-hero` `<img>` is replaced by `motifSvg(monument.motif)` via `v-html` (trusted static constant); `heroHidden` dead branch (motif absent → hide `.card-hero`) ported verbatim for fidelity though monuments always have a motif. No inline styles on the hero SVG — `.card-hero svg` (base.css:719) already sizes it.
- **UI-05 detail** (`DetailPhoto.global.vue`): on `@error` ONLY the `<img>` is swapped for the motif SVG carrying the four verbatim inline styles `width:100%; height:auto; border-radius:4px; display:block` (injected into the `<svg>` tag because `.detail-photo img` CSS targets `img`, not `svg`); `.detail-photo-caption` is preserved; no-motif branch hides only the img.
- **FEAT-04 notes** (`MonumentCard.vue`): per-monument notes persisted under the exact key `roma-note-<slug>`, read in `onMounted` (empty at SSR → no hydration warning), saved on `@input` with a ~200ms debounce, all in `try/catch`; bound with `:value`/`@input` (not `v-model`); monuments-only.
- **provide/inject motif**: `MonumentCard` does `provide('monumentMotif', monument.motif)`; `DetailPhoto.global.vue` does `inject<Motif | undefined>('monumentMotif', undefined)` — resolves through the single nested DetailPhoto in the MDCRenderer subtree (A2 confirmed at runtime via `pnpm generate`; the prerendered HTML shows the wiring is hydration-safe).
- Quality gates: `pnpm typecheck` + `pnpm lint` exit 0 (no warnings), `pnpm test:unit` 87/87 green, `pnpm generate` exit 0 with zero `window is not defined` / hydration-mismatch errors; prerendered notes textarea is empty and hero `<img>` renders (no SVG baked into SSR).

## Task Commits

Each task was committed atomically:

1. **Task 1: MonumentCard.vue — hero @error → SVG + notes persistence + provide('monumentMotif')** — `e0b8c5a` (feat)
2. **Task 2: DetailPhoto.global.vue — detail @error → SVG (4 inline styles, keep caption) + inject motif** — `1b70ae7` (feat)

**Plan metadata:** see the docs commit (this SUMMARY + STATE/ROADMAP/REQUIREMENTS).

## Files Created/Modified
- `app/components/MonumentCard.vue` — hero `@error` → `v-html` toggle (`heroFailed`/`heroHidden` + `onHeroError`); notes `:value`/`@input` with `NOTE_KEY = roma-note-<slug>`, `onMounted` read + debounced `onNoteInput`; `provide('monumentMotif', monument.motif)`; `defineProps` destructured; culture `v-for` var renamed `ref`→`cultureRef` (template-shadow of the imported `ref`). No `<style>` block.
- `app/components/DetailPhoto.global.vue` — `inject<Motif | undefined>('monumentMotif', undefined)`; detail `@error` → `v-html` of `detailSvg` (computed that injects the 4 inline styles into the `<svg>` tag); `v-else-if="detailSvg"` for the no-motif "hide only the img" branch; `.detail-photo-caption` untouched. No `<style>` block.
- `eslint.config.mjs` — added a scoped override relaxing ONLY `vue/max-attributes-per-line` for `DetailPhoto.global.vue` (same precedent as MonumentCard/Timeline/reference sections; the inline `<span v-else-if v-html>` lives in the whitespace-sensitive `.detail-photo`).

## Decisions Made
- **Destructured `defineProps`** (`const { monument } = defineProps<…>()`): the new setup functions reference `monument` directly, matching the template's existing `monument.*` style (the file never used `props.`). Vue 3.5 reactive-props destructure keeps reactivity; verified by typecheck + the prerendered output.
- **Detail inline styles via string-injection into `<svg>`**: `detailSvg` computed replaces `<svg ` with `<svg style="width:100%; height:auto; border-radius:4px; display:block" `. Byte-faithful to `loadSvgFallbackDetail` which set `svg.style.*` before `img.replaceWith(svg)`; required because `.detail-photo img` (base.css:825) does not match the swapped `<svg>`.
- **No-motif detail branch via `v-else-if="detailSvg"`**: when the image fails and there is no motif SVG, the img is hidden (`v-if="!failed"`) and the span does not render, so only the caption remains — exact mirror of the original's `img.style.display='none'` (index.html:2247).
- **eslint override scoped to one rule/one file** for `DetailPhoto.global.vue`: keeps the `eslint-disable-next-line vue/no-v-html` adjacent to the single-line `<span v-else-if v-html>` (mandatory for the disable to land on the directive). CERO-CSS and every other rule remain active.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Renamed culture `v-for` variable `ref` → `cultureRef`**
- **Found during:** Task 1 (MonumentCard.vue)
- **Issue:** Adding `import { … ref … } from 'vue'` to the setup made the pre-existing template `v-for="ref in monument.culture.slice(1)"` shadow the imported `ref` — `vue/no-template-shadow` ESLint error (276:16). Directly caused by this task's `ref` import.
- **Fix:** Renamed the loop variable to `cultureRef` (and its three uses: `:key`, `ref-title`, `:value`). Pure rename, no behavior change.
- **Files modified:** `app/components/MonumentCard.vue`
- **Verification:** `pnpm lint` exit 0; `pnpm typecheck` exit 0; the culture-box renders identically (verified in `pnpm generate` output).
- **Committed in:** `e0b8c5a` (Task 1 commit)

**2. [Rule 3 - Blocking] Documented the two empty `catch {}` blocks to satisfy `no-empty`**
- **Found during:** Task 1 (MonumentCard.vue)
- **Issue:** The verbatim port of `setupNotes` uses empty `catch(e){}` to swallow localStorage-blocked errors; ESLint flagged the two empty blocks (`no-empty`, 107/117).
- **Fix:** Added an explanatory one-line comment inside each `catch` (no behavior change — still swallows, exactly as the original).
- **Files modified:** `app/components/MonumentCard.vue`
- **Verification:** `pnpm lint` exit 0.
- **Committed in:** `e0b8c5a` (Task 1 commit)

**3. [Rule 3 - Blocking] Scoped eslint override for `DetailPhoto.global.vue` (`max-attributes-per-line`)**
- **Found during:** Task 2 (DetailPhoto.global.vue)
- **Issue:** Unlike MonumentCard (already in the override list), `DetailPhoto.global.vue` is governed by the active `vue/max-attributes-per-line` rule, which flagged the whitespace-sensitive single-line `<span v-else-if="detailSvg" v-html="detailSvg" />` (2 directives). Splitting it across lines would break the required adjacency of the `eslint-disable-next-line vue/no-v-html` comment to the directive.
- **Fix:** Added a scoped override relaxing ONLY `vue/max-attributes-per-line` for `DetailPhoto.global.vue`, mirroring the established precedent (MonumentCard/Timeline/reference sections all have inline `<MDC>`/`<span>` in whitespace-sensitive containers). All other rules — including CERO-CSS — stay active.
- **Files modified:** `eslint.config.mjs`
- **Verification:** `pnpm lint` exit 0 (no warnings); the only `v-html` per file remains the trusted SVG with exactly one `eslint-disable`.
- **Committed in:** `1b70ae7` (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All three are blocking-fix housekeeping directly caused by this plan's own imports/markup (the `ref` import, the verbatim empty catches, and the new inline `<span v-html>`). No behavior change, no scope creep — the plan's prescribed wiring is realized exactly, CSS stays verbatim.

## Issues Encountered
- The `eslint-disable-next-line vue/no-v-html` placement was finicky: the comment must sit on the line immediately before the `v-html` directive. In MonumentCard a single-line `<span v-else v-html=… />` worked under the existing override; in DetailPhoto the rule was active, so the fix was the scoped `max-attributes-per-line` override (deviation 3) plus a single-line span — not splitting the span (which would have moved `v-html` away from the comment).
- Initial grep ambiguity on the `<style`/`v-model` acceptance checks: both literal strings appeared only inside header comments (documenting their *absence*). Reworded the comments so `grep -c '<style'` and `grep -c 'v-model'` both return 0 — no functional change; there is genuinely no `<style>` block and no `v-model` usage.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The two shells are fully behavior-wired; the phase's remaining work is Plan 04 (parity verification wave), which will assert the full behavioral parity at the browser level: hero SVG on image abort, detail SVG + caption on detail-img abort, and the notes round-trip under `roma-note-<slug>`. The `provide`/`inject` motif path (A2) is confirmed hydration-safe by `pnpm generate`; Plan 04's parity spec is the authoritative assertion that the detail SVG shows the right motif.
- Carry-forward blocker (heritage, NOT introduced here): the discriminated-union `artist`/`reference` collections still return all-null SQL rows (D1) — affects `#arte`/`#arquitectura`/`#reservas`/`#practica`, not monuments. Monuments (the only cards with hero/detail/notes) render fully, so this plan's surface is unaffected.

## Self-Check: PASSED

- All 3 files exist on disk (`MonumentCard.vue`, `DetailPhoto.global.vue`, `eslint.config.mjs`).
- Both task commits exist in git history (`e0b8c5a`, `1b70ae7`).
- `pnpm typecheck` + `pnpm lint` exit 0; `pnpm test:unit` 87/87 green; `pnpm generate` exit 0 (no `window is not defined`, no hydration mismatch beyond the known color-mode message).

---
*Phase: 07-isla-client-only-mapa-fallback-de-imagen-y-notas*
*Completed: 2026-06-23*
