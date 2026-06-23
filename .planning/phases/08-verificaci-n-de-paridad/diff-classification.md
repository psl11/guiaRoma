# F8 / Plan 08-06 — Visual-diff classification (D-02)

> ## UPDATE (4th decision — corrective golden re-capture): major corrections + remaining sub-pixel residual
>
> **Status:** `pnpm verify` STILL NOT green, but the picture changed substantially after the
> authorized corrective re-capture and a corrected font root-cause. Summary of what this session
> established and fixed (commits 90874d3, 31216e9, 9f47f75):
>
> 1. **Blocker A (leaked hero photos) — FIXED by corrective re-capture.** CONFIRMED REAL: the F1
>    golden had real Trevi/Campo-de'-Fiori/etc. photos baked into the multi-card views (cropped
>    `dia-viernes-light-desktop.png` and SAW the marble Trevi fountain, not the SVG). Root cause: an
>    `onerror` race where some `<img>` loaded the photo before A5's abort fired. FIX: `golden.spec.ts`
>    `settle()` now deterministically invokes each remaining hero/detail `<img>`'s OWN inline
>    `onerror` (the index.html `loadSvgFallback*` — the live site's code) and waits until no `<img>`
>    remains in `.card-hero`/`.detail-photo`. Re-captured from **index.html** (base config webServer),
>    golden.spec.ts ONLY, never `visual-diff.spec.ts` (not circular). 33/56 PNGs changed = exactly the
>    leaked-photo views; heights unchanged (photo→SVG, same box); 23 already-correct views byte-identical.
>
> 2. **Blocker B root cause — CORRECTED (the prior analysis below had the font backwards).** GROUND
>    TRUTH (measured in the Playwright Chromium that captures the golden): index.html loads Google's
>    **VARIABLE** Lora woff2 (normal-latin 37792 B, italic 40648 B, v37) and renders the probe string at
>    **388px**. The "static fontsource" fix (recorded below) served a **different, ~3.6% NARROWER** Lora
>    (374px). BOTH premises in the original record were false: `@fontsource/lora` is NOT byte-identical
>    to Google's Lora (different bytes 21148 vs 21128 AND different advance widths 374 vs 388), and the
>    variable Lora is what the golden actually uses (not "too wide"). The narrower font made
>    italic/upright-mixed paragraphs wrap one fewer line → #inicio mobile 2174 vs golden 2200. FIX:
>    **vendored the EXACT Google woff2** (latin + latin-ext) into `app/assets/fonts/` +
>    `app/assets/css/fonts.css`, self-hosted by Vite (offline preserved, 0 runtime CDN refs);
>    `@nuxt/fonts` families → `provider:'none'` (no wrong font, no injected "X Fallback:" metric faces).
>    Also fixed two MDC-wrapper bugs: `TheHero` howTo now uses `<MDCRenderer :tag="false" unwrap="p">`
>    (was nesting `<p>` in a `<div class="">`), and `DetailPhoto`'s v-html SVG span is `display:block`
>    (an inline span collapsed the SVG `width:100%`). **#inicio now matches the golden EXACTLY**
>    (mobile 2200=2200; desktop identical wrap, only uniform sub-pixel AA at ratio 0.02).
>
> 3. **Blocker C (#vaticano empty `.facts`) — FIXED.** `v-if="monument.facts.length"` (commit 90874d3).
>
> **REMAINING (the genuine blocker, returned for human/architectural decision):** after all the above,
> `pnpm verify` still fails on **sub-pixel / AA-class DIMENSION deltas** on the tallest views:
> - mobile: dia-lunes (54950 vs 54949 = 1px), dia-martes (4px), ref-arquitectura (20px),
>   ref-gastronomia (9px), ref-arte (4px), ref-reservas (1px); ref-practica = same-dims AA (ratio 0.02).
> - desktop: inicio = same-dims AA (ratio 0.02, content provably identical — cropped & compared);
>   dia-viernes (21390 vs 21679 ≈ 289px), dia-sabado (≈688px), dia-domingo, dia-lunes, dia-martes.
> The desktop day-view deltas localize to cumulative line-height rounding + detail-photo SVG
> sub-pixel height across long prose (not a single fixable element; live index.html vs live Nuxt
> measure IDENTICAL line counts for the same sections, so the residual is sub-pixel rasterization /
> capture-timing, not a content/markup difference). These manifest as **dimension mismatches**, which
> `toHaveScreenshot` hard-fails regardless of `maxDiffPixelRatio`, and which the plan's guard
> explicitly forbids working around ("never a dimension workaround"). Accepting a narrow per-view
> dimension tolerance would change the parity gate's contract → an architectural/human decision
> (Rule 4), hence returned as a CHECKPOINT, not silently masked.
>
> **Also surfaced (out of scope — pre-existing, not introduced here):**
> - `search-route.spec.ts` "Volver restaura el scroll" FAILS identically (scrollY 24 vs 0) on **pure
>   HEAD (ec7cadc)** with zero changes — a pre-existing smooth-scroll-from-deep timing issue in the
>   test (the `expect.poll` 5s window is too short for a `behavior:'smooth'` scroll back from a deep
>   card). Independent of the golden/font work. Logged to deferred-items.md.
> - Search ranking divergence: index.html "Pante" → fontana-trevi first; Nuxt → castel-santangelo
>   first. A real MiniSearch-config parity gap, but separate from the visual-diff plan. Logged.
> - `origin/main` index.html has drifted from this release branch (Coliseo tour 15:30→15:00, 8 lines)
>   — main is the living version; the golden is correctly captured from THIS branch's index.html.
>
> --- original record (the static-font analysis; **superseded by point 2 above for the font direction**) ---

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
