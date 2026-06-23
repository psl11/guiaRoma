# F8 / Plan 08-06 — Visual-diff classification (D-02)

**Status:** `pnpm verify` NOT green. The static-font fix (the third human decision, "serve static
fonts") was implemented and **succeeded at its stated goal** — but it exposed that the remaining
residual is NOT a font-metric problem. Three font-independent blockers remain; two require a human
decision (they cannot be resolved without rebaselining or masking, both forbidden by D-01/D-02).
This file records the full empirical classification.

**Method:** ran the gate-scoped visual-diff once per build, inspected `test-results/*-actual.png` /
`*-diff.png`, and where the diff was ambiguous reconstructed sub-element heights and per-line wrap by
serving BOTH the golden `index.html` (real Google fonts, network) and the generated Nuxt build under
`/guiaRoma/` on iPhone-12 / 1280×800 with the golden's A5 image-abort + `settle()` harness, then
compared computed styles, font woff2 bytes, and per-line text. Frozen baseline + `golden.spec.ts`
byte-unchanged throughout (`git diff --quiet` = 0 on both).

---

## Root cause (corrected) — variable vs static Lora, and the RESEARCH §Pitfall-1 error

RESEARCH §Pitfall 1 / §Summary claimed the Nuxt `@nuxt/fonts` fonts were **"byte-identical latin
unicode-range; 24-byte totalSfntSize delta"** vs the golden's Google fonts, and concluded font-AA was
"structurally low risk." **That claim was WRONG for Lora.** It measured Cormorant's latin slice, not
the family that actually diverged. Measured reality (this plan):

| Font file | golden (Google, index.html) | Nuxt `provider:'google'` (BEFORE) |
|-----------|-----------------------------|-----------------------------------|
| Lora 400 latin | **STATIC** — 21148 B, sfnt 47652, 16 tables, no `fvar` | **VARIABLE** — 37792 B, sfnt 76160, 18 tables, has `fvar`/`gvar`/`HVAR` |

Google's `css2?family=Lora:...&display=swap` (the golden's `<link>`, index.html:13) serves **static
per-weight** instances; `@nuxt/fonts` 0.14's `google` provider (via unifont) served the **variable**
Lora. The variable Lora renders ~3.8% wider at the same weight/size → cumulative line-wrap → every
tall day view +289..+738px **taller** than the frozen golden. `toHaveScreenshot` **hard-fails on
image-dimension mismatch** — `maxDiffPixelRatio` only governs per-pixel diff within equal dimensions,
so this is unabsorbable. This is a genuine font-file difference reaching real users (woff2 served,
`font-display:swap`, loaded by networkidle in `settle()`), not a capture artifact.

## The fix implemented — `provider: 'fontsource'` (static), offline preserved

- Switched `@nuxt/fonts` to `provider: 'fontsource'` for all three families with **discrete weights**.
  unifont's fontsource provider only emits a variable (`:vf`) face when the input weight is a *range*
  (`prepareWeights`: `variable = weight.includes(' ')`); discrete weights (400/500/600) resolve the
  **static** branch `fontDetail.variants[weight][style][subset].url`.
- **Verified byte-identical to the golden's Google static fonts:** downloaded
  `fonts.gstatic.com/s/lora/v37/...latin 400 normal` and `...latin 400 italic` and `cmp`'d against the
  installed `@fontsource/lora` files → **IDENTICAL** (normal 21148 B / sfnt 47652; italic 22756 B /
  sfnt 48992). All 32 served woff2 now have `numTables=16` (zero variable tables).
- **Offline preserved (BUILD-02 / CLAUDE.md #6):** build-time fetch is from `cdn.jsdelivr.net/fontsource`
  (not gstatic); `@nuxt/fonts` then self-hosts under `/guiaRoma/_fonts/`. Built output has **0**
  references to `fonts.googleapis.com` / `fonts.gstatic.com` / `cdn.jsdelivr.net` / `api.fontsource.org`.
  `@fontsource/{lora,cormorant-garamond,jetbrains-mono}` added as devDeps (anchor static versions;
  legitimacy verified on npm: fontsource.org homepages, maintainer `jwr1`).
- **Effect (measured, element screenshots vs frozen golden):** the font fix WORKED. On **desktop**,
  text is now pixel-exact: `inicio-desktop` PASSES; 13/16 desktop views are **Δh = 0px** (inicio,
  dia-viernes, dia-domingo, ref-practica, ref-arte, ref-arquitectura, card-monumento, card-concert,
  light+dark). `test:unit` 87/87 and `test:data` 295/295 stay green.

## Per-view verdict table (after the static-font fix)

| View | Theme | Project | Real / Artifact | Δh | Verdict / action |
|------|-------|---------|-----------------|----|------------------|
| inicio | light/dark | desktop | — | 0 | PASS (font fix) |
| dia-viernes | light/dark | desktop | REAL (golden photo) | 0 | 2 hero photos baked into golden (Trevi, Campo Fiori) vs Nuxt SVG → ratio 0.02. Heights match. **Blocker A** |
| dia-domingo | light/dark | desktop | REAL (golden photo) | 0 | hero-photo bands; heights match. **Blocker A** |
| ref-arte / ref-arquitectura / ref-practica | light/dark | desktop | REAL (golden photo) | 0 | hero/detail photo bands; heights match. **Blocker A** |
| card-monumento / card-concert | light/dark | desktop | REAL (golden photo) | 0 | detail-photo bands; heights match. **Blocker A** |
| ref-gastronomia | light/dark | desktop | REAL (golden photo) | -273 | photo bands + height; **Blocker A** |
| dia-sabado / card-guided | light/dark | desktop | REAL (component) | +49/+50 | **Blocker C**: Nuxt #vaticano renders an EXTRA `.facts` block (+32px) absent from golden at that position; fixable in MonumentCard (D-02 path a) |
| ALL mobile views | light/dark | mobile | sub-pixel wrap | -26..-1491 | **Blocker B**: scales with line count |
| dia-martes | light/dark | desktop | sub-pixel | -5 | borderline AA/wrap |

## Remaining blockers — why they are NOT this plan's font decision, and NOT maskable

**Blocker A — golden baseline has REAL hero photos baked in (non-determinism in the FROZEN baseline).**
The golden was captured with A5 (`route('**/*', img→abort)`), which should force the SVG-motif
fallback for every hero. But the frozen PNGs show the **real Trevi photo** (dia-viernes y≈6162) and
**real Campo de' Fiori photo** (y≈18233) — directly confirmed by cropping `*-expected.png`. The Nuxt
build deterministically shows the SVG fallback for ALL heroes (hardened in commit dd8ab72). So the
golden's image-abort did NOT fully take effect at capture time (cache race / inline `onerror` timing);
the baseline is internally inconsistent (some heroes photo, some SVG). The Nuxt render is arguably
*more* correct. Resolving this requires either re-capturing the golden (FORBIDDEN, D-01) or masking the
hero regions (a content mask on a region A5 was specifically designed to neutralize — needs written
human sign-off, not an executor decision). **Heights match where this occurs**, so it is not a
dimension workaround either way.

**Blocker B — mobile sub-pixel wrap drift at italic/upright boundaries (NOT a font-metric mismatch).**
With the static fonts, the body font is **byte-identical** to the golden, the font stack, `font-size`
(16px on mobile via the shared `@media (max-width:540px){body{font-size:16px}}`), `line-height`
(26.4px), container width (350px), and the `<em>` width ("in situ" = 46px in BOTH) are all identical.
Pure-upright lines wrap **identically** (lines 0–1 of the howTo `<p>` match the golden exactly). The
divergence begins on the first line that MIXES italic and upright text: the golden wraps that
paragraph to 10 lines, Nuxt to 9 (Nuxt fits one extra word, "cualquier"), then every subsequent line
shifts → the paragraph is 26px shorter, accumulating across the page (inicio-mobile −26px → lunes-mobile
−1491px). This is a sub-pixel difference in how the engine positions upright text after an italic run,
with **identical fonts and identical computed CSS** — there is nothing in the Nuxt component or CSS to
change (it already matches the golden byte-for-byte). It is a dimension delta, so it is explicitly
**not** maskable per the guard ("never a dimension workaround").

**Blocker C — Nuxt #vaticano renders an extra `.facts` block (+32px).** REAL component diff (D-02 path
a), fixable in `MonumentCard.vue`. By itself does not unblock the gate (A and B remain), but is logged
for the fix pass. (Sub-element compare: golden #vaticano blocks = …`A.maps-link`→`notes-area`; Nuxt =
…`DIV.facts`→`A.maps-link`→`notes-area`.)

## Prior corrections carried into this record (from earlier 08-06 commits, standing)

- **Phase-1 "no-op visual" correction (timeline CSS, commit cc74f79):** two orphaned timeline CSS rules
  were neutralized to match the golden; timeline now matches golden 0px. Correct — keep.
- **Dropped `<br>` data (commit fd0bb6a):** 50 transport-meta `<br>` restored to match golden data
  fidelity. Correct — keep.
- **Fix #2 — per-card culture/notes box order (commit 0235e43):** 4 cards
  (piazza-navona/campo-fiori/ghetto/laterano) use notes-THEN-culture in the live index.html; MonumentCard
  was hardcoded culture-THEN-notes. Schema field added + ordering fixed to match golden. Correct — keep.
- **Image-fallback hardening (commit dd8ab72):** SVG fallback applied on pre-hydration image error +
  `settle()` hardened. Correct — but note it makes the Nuxt SVG-fallback state *fully deterministic*,
  which is what surfaces Blocker A against the partially-photo golden.

## Threshold/mask ledger

**None applied.** No per-view `maxDiffPixels`, no `mask`, no `stylePath`, no `--update-snapshots`.
`maxDiffPixelRatio: 0.01` is unchanged and not relaxed. Per D-02/the guard, no diff is tolerated
without written justification, and the two dominant residuals (A photo-artifact, B sub-pixel dimension)
cannot be honestly resolved by a threshold/mask without a human decision — hence this is returned as a
CHECKPOINT, not silently masked or rebaselined.
