---
phase: 08-verificaci-n-de-paridad
reviewed: 2026-06-24T00:00:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - app/assets/css/base.css
  - app/assets/css/fonts.css
  - app/components/DetailPhoto.global.vue
  - app/components/MonumentCard.vue
  - app/components/TheHero.vue
  - content/trips/roma/days/domingo.yml
  - content/trips/roma/days/lunes.yml
  - content/trips/roma/days/martes.yml
  - content/trips/roma/days/sabado.yml
  - content/trips/roma/days/viernes.yml
  - content/trips/roma/monuments/campo-fiori.yml
  - content/trips/roma/monuments/ghetto.yml
  - content/trips/roma/monuments/laterano.yml
  - content/trips/roma/monuments/piazza-navona.yml
  - nuxt.config.ts
  - package.json
  - playwright.gate.config.ts
  - scripts/migration-diff.ts
  - scripts/vendor-fonts.mjs
  - shared/schemas.ts
  - tests/README.md
  - tests/parity/golden.spec.ts
  - tests/parity/map-fallback-notes.spec.ts
  - tests/parity/search-route.spec.ts
  - tests/parity/shell.spec.ts
  - tests/parity/visual-diff.spec.ts
findings:
  critical: 0
  warning: 6
  info: 5
  total: 11
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-06-24
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Reviewed the Phase 08 parity-verification surface: the self-contained Playwright parity
specs, the migration-diff harness, the zod schema layer, the font vendoring script, the
build config, and a representative slice of the migrated content + components. The work is
unusually well-documented, and many patterns that would normally read as smells
(verbatim CSS, per-spec build/serve harness, `v-html` of motif SVGs, deliberate
console-error tolerances) are correct-by-design for this project and were not flagged.

No BLOCKER-class defects were found: there are no injection vectors, no auth surface, no
data-loss paths, and `v-html` is confined to trusted static constants with user text routed
only through `:value`. The findings below are robustness and maintainability concerns. The
most material is a real ordering bug in `vendor-fonts.mjs` that crashes on a clean checkout
(WR-01), undermining the script's stated reproducibility guarantee. The remaining warnings
concern silent-failure surfaces in the vendoring script's regex parsing, a lost-write window
on note persistence, and an under-asserted parity gate that can go green while skipping
coverage.

## Warnings

### WR-01: `vendor-fonts.mjs` reads the fonts dir before creating it — crashes on clean checkout

**File:** `scripts/vendor-fonts.mjs:22-24`
**Issue:** The cleanup loop calls `readdirSync(FONTS_DIR)` **before** `mkdirSync(FONTS_DIR, { recursive: true })`:
```js
for (const f of readdirSync(FONTS_DIR)) if (f.endsWith('.woff2')) unlinkSync(join(FONTS_DIR, f))
mkdirSync(FONTS_DIR, { recursive: true })
```
On any environment where `app/assets/fonts/` does not yet exist (fresh clone, CI without the
vendored assets committed, or after a manual `rm -rf`), `readdirSync` throws `ENOENT` and the
script dies before vendoring anything. The header comment claims the script "reemplaza
app/assets/fonts/* ... de forma reproducible" — this ordering defeats that guarantee for the
exact case (missing dir) where reproducibility matters most.
**Fix:** Create the directory first, then enumerate:
```js
mkdirSync(FONTS_DIR, { recursive: true })
for (const f of readdirSync(FONTS_DIR)) if (f.endsWith('.woff2')) unlinkSync(join(FONTS_DIR, f))
```

### WR-02: `vendor-fonts.mjs` regex parse failures are silent or crash mid-run

**File:** `scripts/vendor-fonts.mjs:38-54`
**Issue:** Every field is extracted with `(face.match(/.../) || [])[1]`, which yields
`undefined` on a miss. Only `family` and `url` are guarded (`if (!family || !url) continue`).
`weight`, `style`, `subsetLabel` and `range` are not:
- If Google's CSS ever omits/renames `unicode-range`, `range` is `undefined` and line 54
  `range.trim()` throws `TypeError`, aborting the whole run after some files were already
  written/deleted — leaving `app/assets/fonts/` and `fonts.css` in an inconsistent state.
- A missing `font-weight`/`font-style` silently produces a filename like
  `lora-undefined-undefined-latin.woff2` and a malformed `@font-face`, which would later
  break parity with no error at vendor time.
Because the script's entire purpose is byte-exact metric parity, a silent malformed face is
a quiet parity regression, not a loud failure.
**Fix:** Validate all required captures before use and fail loudly with the offending block:
```js
if (!family || !url || !weight || !style || !range) {
  console.error('bloque @font-face incompleto, abortando:', face.slice(0, 120))
  process.exit(1)
}
```

### WR-03: Note debounce can silently drop the last keystrokes on unmount

**File:** `app/components/MonumentCard.vue:132-148`
**Issue:** `onNoteInput` schedules the `localStorage.setItem` ~200ms later, and
`onUnmounted(() => clearTimeout(noteTimer))` cancels any pending save. If the component
unmounts within the debounce window after the user's last edit (HMR, or the future SPA
navigation the comment anticipates), that final write is lost — exactly the "lo que quieras
recordar de aquí" data the feature exists to preserve. In the current single-page SSG the
card never unmounts so it does not bite today, but the code explicitly cites "futura
navegación SPA" as the reason for the cleanup, which is precisely the scenario that loses
data.
**Fix:** Flush on unmount instead of (or in addition to) clearing:
```js
onUnmounted(() => {
  clearTimeout(noteTimer)
  try { localStorage.setItem(NOTE_KEY, noteText.value) } catch { /* bloqueado */ }
})
```

### WR-04: Parity gate count is documented but not machine-enforced — can go green while skipping coverage

**File:** `tests/README.md:122-167`, `playwright.gate.config.ts:27-31`
**Issue:** The README's whole §4 argument is that an accidental over-exclusion must be
*detectable* (Pitfall 4), and it records the canonical "80 tests in 11 files". But nothing in
the gate actually asserts that number: the count lives only in prose, recomputed by hand. The
gate config uses a broad `testIgnore: ['**/golden.spec.ts']` glob plus a title-substring
`--grep-invert "reutiliza el MISMO TripView"`. A future spec file added under
`tests/parity/` that happens to match neither will silently change the count, or a renamed
test title will silently neutralize the grep-invert — and `pnpm verify` stays green. The
documented safeguard is real but inert because no test enforces it.
**Fix:** Add a tiny meta-test (Vitest, no browser) that shells `playwright test -c
playwright.gate.config.ts --grep-invert "..." --list` and asserts `Total: 80 tests in 11
files`, so a coverage drift breaks CI instead of relying on a human re-running the snippet.

### WR-05: `--grep-invert` neutralizes the dev-routing test by free-text title substring

**File:** `package.json:19`, `tests/parity/shell.spec.ts:242`
**Issue:** The "cinturón" exclusion matches the test by the substring
`"reutiliza el MISMO TripView"` inside its title. Any innocent edit to that test's title
(typo fix, rewording) silently un-excludes the dev-routing test, which spawns a real
`nuxi dev` server known to be flaky under stale locks — re-introducing the non-determinism
the exclusion exists to prevent, directly inside the green gate. The README itself calls this
the fragile half ("cinturón") relative to the `test.skip` "tirantes", but the brittle coupling
remains in the shipped command. The describe-level `test.skip(!RUN_DEV_ROUTING)` does protect
against the spawn, so impact is bounded, but the grep belt is load-bearing for the *count*
(82→80) asserted in the README.
**Fix:** Tag the test instead of matching prose, e.g. annotate it `@dev-routing` (or move it to
its own file already covered by `testIgnore`) and grep-invert on the stable tag, so a title
edit cannot change selection.

### WR-06: `vendor-fonts.mjs` has no failure handling on either network fetch

**File:** `scripts/vendor-fonts.mjs:20,45`
**Issue:** Both `await fetch(CSS2_URL, ...)` and the per-face `await fetch(url, ...)` assume a
2xx response. A non-200 (Google rate-limit, transient 5xx, captive portal returning HTML) is
not checked: the CSS2 fetch would then split garbage into `blocks` (likely vendoring zero
faces and overwriting `fonts.css` with an essentially empty file), and a failed woff2 fetch
would `writeFileSync` a 0-byte or error-page-body `.woff2`. Either silently corrupts the
metric-parity baseline the script is supposed to guarantee.
**Fix:** Check `res.ok` after each fetch and abort with a clear message + non-zero exit before
writing anything; do not overwrite `fonts.css`/woff2 on a bad response.

## Info

### IN-01: `detailSvg` string-replace assumes the motif SVG has no `style` attribute

**File:** `app/components/DetailPhoto.global.vue:56-61`
**Issue:** `svg.replace('<svg ', '<svg style="..." ')` injects a `style` attribute by literal
string surgery. If any `svgMotifs.ts` entry ever gains its own `style="..."` on the root
`<svg>`, the element would carry two `style` attributes (the browser keeps the first, dropping
the injected sizing → the detail-photo collapse bug this code exists to fix). The source is a
trusted static constant today, so this is latent, not active.
**Fix:** Prefer a parsed/structured injection or assert in `svgMotifs.ts` (or a unit test) that
no motif root carries an inline `style`.

### IN-02: `:key="i"` on the sections loop uses array index

**File:** `app/components/MonumentCard.vue:245-246`
**Issue:** `v-for="(s, i) in monument.sections" :key="i"` keys by index. Sections are static
content that never reorders, so this is harmless in practice, but index keys are a known
footgun if the list ever becomes dynamic (Vue would reuse DOM/state across logically distinct
sections). The `:detail-photo` MDC child + dropcap `:first-of-type` make stale reuse subtly
visual.
**Fix:** Key by a stable field, e.g. `:key="s.heading"` (headings are distinct within a card).

### IN-03: Empty-but-present `culture` array renders an empty `.culture-box`

**File:** `app/components/MonumentCard.vue:329-344, 349-364`
**Issue:** The block is gated by `v-if="monument.culture"` (presence), then reads
`monument.culture[0]?.title`. If a future ficha set `culture: []` (valid per the optional
`z.array` schema), the box would render with an empty label and zero ref-items — a spurious
empty styled box, the same class of parity divergence the `facts.length` guard at line 273
deliberately avoids.
**Fix:** Gate on content, not presence: `v-if="monument.culture?.length"`.

### IN-04: Schema RowSchema duplication is a maintenance hazard

**File:** `shared/schemas.ts:218-241, 282-317`
**Issue:** `ArtistRowSchema` and `ReferenceRowSchema` re-declare, by hand, every field of their
discriminated-union counterparts (the `confirmed`/`table`/`sections`/`media`/`terms` shapes are
copy-pasted verbatim with `.optional()`). The workaround for Content v3's lack of union→SQL
column materialization is well justified, but the duplication means a field added to
`ReservasSchema.table` must be mirrored in `ReferenceRowSchema.table` or the column silently
won't materialize. There is no test asserting the supersets stay in sync.
**Fix:** Derive the row supersets from the branch shapes programmatically (e.g. extract the
inner object schemas to named consts and `.partial()`/merge them) so a drift is impossible, or
add a unit test asserting every union-branch key appears in the corresponding RowSchema.

### IN-05: `golden.spec.ts` and `visual-diff.spec.ts` use divergent `settle()` fallback paths

**File:** `tests/parity/golden.spec.ts:78-93`, `tests/parity/visual-diff.spec.ts:151-187`
**Issue:** The golden capture forces the SVG fallback by manually invoking each `<img>`'s inline
`onerror` handler (78-85), while visual-diff relies on the component's reactive `@error`/onMounted
fallback and only waits for "no img remains" (166-170). Both converge to the same end-state by
design, but the two specs are documented as "VERBATIM" clones of one `settle()` and have in fact
diverged. If the reactive path ever fails to fully swap on the Nuxt side, visual-diff's
`waitForFunction` would time out (loud) — acceptable — but the "verbatim clone" claim in the
comments is now inaccurate and could mislead a future maintainer reconciling them.
**Fix:** Update the comments to describe the *intended* divergence explicitly (golden invokes the
inline handler; Nuxt relies on the reactive fallback) rather than claiming byte-identical clones.

---

_Reviewed: 2026-06-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
