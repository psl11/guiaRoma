---
phase: 11-portada-y-rutas-multi-viaje
reviewed: 2026-11-23T00:25:06Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - app/components/TripIndex.vue
  - tests/README.md
  - tests/data/invariants.spec.ts
  - tests/data/trips.ts
  - tests/unit/tripIndexFatal.spec.ts
findings:
  critical: 1
  warning: 2
  info: 3
  total: 6
  necessity: 1
status: issues_found
---

# Phase 11: Code Review Report (incremental, gap closure 11-08 / G-11-3)

**Reviewed:** 2026-11-23T00:25:06Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

This is an incremental review of plan 11-08 (commits 1c4b01d, 74e82e7, fb1e31f, 7021b8a, cf7ceea). It closed WR-02 (block Markdown in the trip `summary`) and WR-03 (a failed portada query published as a blank 200) from the previous 11-REVIEW.md. `trips.ts` and `invariants.spec.ts` were reviewed only where they touch the new `trip-summary-inline` rule. The Phase 10 parts of those files are covered by 10-REVIEW.md.

What checks out:
- **WR-03 is fixed.** The TripIndex `<template>` did not change between `eec76cc` and `HEAD`. The only edits are the `error` destructure and the guard that throws a fatal 500, so the normal-case markup is the same byte for byte. `nitro.prerender.failOnError: true` is set (`nuxt.config.ts:64`), and nothing navigates to `/` on the client (no `NuxtLink`/`navigateTo` to `/`), so the fatal path cannot be hit offline after the page has loaded.
- **No double warning.** `summaryBlockForms` returns `[]` whenever `hasLink(md)` is true, so a summary never gets both `trip-summary-link` and `trip-summary-inline`.
- **Real trips stay green.** `vitest run tests/data`: 906/906 pass. `tests/unit/tripIndexFatal.spec.ts`: 7/7 pass (Node 22.20.0).

What fails:
- **The main goal is not met.** The rule is meant to be fail-closed for every construct MDC renders as a block inside the card's `<p>`, and it is not. I ran `@nuxtjs/mdc` 0.22.0 `parseMarkdown` and `checkTrip` side by side on each string below (scratch probe only, no repo files touched). Inline MDC components with a block tag come out GREEN on both summary rules. They render as top-level `div`/`ul`/`table`/`hr`/`h1`/`section`/`form`/`nav`, or as a `<div>` through the global `DetailPhoto` component. That is exactly the hydration break WR-02 described. `:a[x]` renders an `<a>` inside the card's `<a>`.
- **Lower-impact false greens in the blank-line scan.** They come from `\r` line endings (reachable through YAML double-quoted escapes) and from Unicode whitespace at the edge of a paragraph.

## Critical Issues

### CR-01: Inline MDC components render block elements (and a nested `<a>`) inside the summary `<p>` but pass both summary rules

**File:** `tests/data/trips.ts:399-410` (`SUMMARY_BLOCK_FORMS`), `tests/data/trips.ts:441-444` (`summaryBlockForms`); render site `app/components/TripIndex.vue:91-100`; missing tests in `tests/data/invariants.spec.ts:787-811`
**Issue:** `SUMMARY_BLOCK_FORMS` only knows block *syntax*: list, quote, table, fence/indent, rule, blank line, `::x`. remark-mdc also accepts **inline** components, written `:name`, `:name[text]` or `:name{attrs}`. When the tag is block-level, MDC lifts the element out of the paragraph. `unwrap="p"` then leaves it directly inside `<p class="trip-index-summary">`. The browser closes the `<p>` before the block element, so the DOM no longer matches the SSR tree and hydration fails, the same defect WR-02 described. None of these strings is caught by `hasLink` (no URL, no `href`/`to`, no raw HTML), so all of them are GREEN.

Each row shows the real `parseMarkdown` output and the `checkTrip` result for a `summary`:

| summary | MDC body | gate |
|---|---|---|
| `Roma :div` / `Roma\n:div[x]` / `Roma (:div[x])` | `p + div` | GREEN |
| `:ul[x]`, `:ol[x]`, `:table`, `:hr`, `:pre[x]`, `:blockquote[x]` | `ul` / `ol` / `table` / `hr` / `pre` / `blockquote` | GREEN |
| `:h1[x]`, `:h2[Mapa]`, `:header[x]`, `:nav[x]`, `:form[x]`, `:details[x]`, `:dl`, `:fieldset` | the same tag at top level | GREEN |
| `Diez :section[días]`, `_:div[x]_`, `**:div[x]**` | `p + section` / `p[em] + div[em]` / `p[strong] + div[strong]` | GREEN |
| `Diez días :detail-photo{src="foto.jpg" alt="Nápoles"}` | `p[detail-photo]` → `DetailPhoto.global.vue` renders `<div class="detail-photo"><img>` | GREEN |
| `Roma :a[x]`, `:nuxt-link[x]` | `p[a]` / `nuxt-link` → `<a>` inside `a.trip-index-card` (the HTML parser closes the outer anchor) | GREEN |

The guide's own prose already uses `:detail-photo{…}` (`content/trips/roma/monuments/*.yml`), so a contributor copying that idiom into a summary is a realistic mistake. The `:a` case breaks the D-07 invariant stated in `TripIndex.vue:24-25` ("nunca hay un `<a>` dentro del `<a>`").

The REJECTED_LINK_FORMS list cannot simply ban components, because guide prose legitimately uses them. The fix belongs in the summary-only scan. No real summary needs a component, so rejecting the syntax outright is fail-closed with no cost to the Roma/Campania summaries (their colons are followed by a space).

**Fix:** add a summary-only form. remark-mdc does not start a component after a letter or a `.`, but does after `_`. The pattern below is deliberately broader, and excludes emoji shortcodes (`:sunny:` → plain text):
```ts
// Componente MDC en línea (`:div[x]`, `:ul`, `:detail-photo{…}`, `:a[x]`): MDC saca de `p` los de
// etiqueta de bloque y los deja dentro de `p.trip-index-summary`; `:a` da `<a>` dentro de `<a>`.
// Fail-closed: no mira el carácter previo (falso rojo conocido: `Roma:texto`). Excluye `:emoji:`.
[/:[A-Za-z][\w-]*(?![\w-]*:)/, 'componente MDC en línea «:x[…]» / «:x{…}»'],
```
Then add teeth to the `trip-summary-inline` `it.each` (`invariants.spec.ts:787`): `Roma :div`, `:ul[x]`, `Roma :a[x]`, `Diez días :detail-photo{src="foto.jpg" alt="x"}`, `_:div[x]_`. Add controls that stay green: `Del 19 al 23: 5 días, 10:00-12:00`, `Roma :sunny: y`. Update the doc comment at `trips.ts:420-437`, the `trips.ts:56-60` header and `tests/README.md` §5.3.

## Warnings

### WR-01: `\r` line endings bypass the blank-line scan and the setext scan (two paragraphs, `h1` inside the `<p>`)

**File:** `tests/data/trips.ts:408` (blank-line form); interacts with `tests/data/trips.ts:336` (setext `===` in `REJECTED_LINK_FORMS`, reached through `hasLink`)
**Issue:** micromark treats `\r` and `\r\n` as line endings. The blank-line regex `/\S[ \t]*\n(?:[ \t]*\n)+[ \t]*\S/` and the setext regexes match only a literal `\n`. JS multiline `^`/`$` already accept `\r`, which is why the other line-anchored forms happen to work. The `yaml` parser normalizes raw CRLF files (verified: `summary: |\r\n  Uno.\r\n\r\n  Dos.` → `"Uno.\n\nDos.\n"`), but a double-quoted escape keeps the `\r`. `summary: "Uno.\r\rDos."` gives `"Uno.\r\rDos."`. Verified false greens:
- `"Uno.\r\n\r\nDos."` and `"Uno.\r\rDos."` → MDC `p + p` → GREEN (glued by `flatUnwrap`, the defect `trip-summary-inline` exists to prevent).
- `"Diez días\r==="` → MDC `h1` → GREEN on both summary rules. This puts a heading block, with a generated id, inside `<p>`/`<a>` on the portada, which also violates D-12 (no `id` on the portada).

(`"Diez días\r---"` → `h2` is still red, but only by luck, through the thematic-break form and with the wrong label.)
**Fix:** normalize line endings once, before both scans, so every `\n`-based regex sees what micromark sees:
```ts
const normEol = (md: string) => md.replace(/\r\n?/g, '\n')
function hasLink(md: string): boolean {
  md = normEol(md)
  // …
}
function summaryBlockForms(md: string): string[] {
  md = normEol(md)
  if (hasLink(md)) return []
  // …
}
```
(Or normalize inside `scanProseLinks`, which also fixes the same gap for guide prose.) Add teeth: `'Uno.\r\rDos.'` → INLINE_B, and `'Diez días\r==='` → `trip-summary-link`.

### WR-02: Unicode whitespace next to the blank line hides a paragraph break

**File:** `tests/data/trips.ts:408`
**Issue:** in JS, `\S` excludes all Unicode whitespace, but CommonMark counts only space and tab as blank (`"Uno.\n \nDos."` is a single `p`, which is correct). So when the last character before the blank line, or the first after it, is NBSP, U+3000 or similar, the regex cannot anchor:
- `"Diez \n\nDos"` → MDC `p + p` → GREEN
- `"Uno.\n\n Dos"` → `p + p` → GREEN
- `"Uno.　\n\nDos"` → `p + p` → GREEN

Trailing NBSPs are common in text pasted from Spanish editors. The visible harm is small, because the leftover NBSP happens to supply the space that `flatUnwrap` drops. But the fail-closed claim in the comment ("nunca un falso verde") is false for this form.
**Fix:** anchor on "non-blank" in the CommonMark sense, not on `\S`:
```ts
[/[^ \t\n][ \t]*\n(?:[ \t]*\n)+[ \t]*[^ \t\n]/, 'línea en blanco (dos párrafos)'],
```
Add teeth `'Diez \n\nDos'` and `'Uno.\n\n Dos'` → INLINE_B. Keep `'Uno.\n \nDos.'` as a control: one `p` in MDC, so it must stay green.

## Info

### IN-01: Undocumented false red: a tab-indented continuation line

**File:** `tests/data/trips.ts:405`, `tests/data/trips.ts:432-435`, `tests/README.md` (§5.3, `trip-summary-inline` bullet)
**Issue:** the code-block form `^(?: {4}|[ ]{0,3}\t)` also fires on a lazy continuation line that starts with a tab. `"Diez\n\tmás"` is a single `p` in MDC but is reported as "bloque de código". The documented false reds (T-11-25) list only "una línea de continuación con 4 espacios de sangría".
**Fix:** change the doc text in both places to "con 4 espacios o un tabulador de sangría". You could also add it as a documented-red tooth so the accepted behaviour is pinned.

### IN-02: The static fatal-guard test does not tie the guard to the `trips-index` result or check where it sits

**File:** `tests/unit/tripIndexFatal.spec.ts:43-44`
**Issue:** `DESTRUCTURES_ERROR` and `FATAL_GUARD` are matched independently, anywhere in the script. The test stays green in these cases:
- `const { data, error: e } = await useAsyncData('trips-index', …)`: `\berror\b` matches the key, while `if (error.value)` tests some other binding.
- The guard is inside a function that is never called, or inside a `watch`.
- The guard comes before the `await`.

In the other direction, `[^}]*` makes it a false red if anyone adds a nested object to `createError` (`data: { … }`). The docblock states the static scope ("Es ESTÁTICO… lo dinámico lo probó el fallo forzado diferencial"), so this is a robustness note, not a regression.
**Fix:** match the two pieces as one adjacent sequence, so the guard must follow the `trips-index` call directly:
```ts
const WIRED = /const\s*\{[^}]*\berror\b(?!\s*:)[^}]*\}\s*=\s*await\s+useAsyncData\(\s*'trips-index'[\s\S]*?\)\s*\n\s*if\s*\(\s*error\.value\s*\)/
```
Add a tooth for the `error: e` rename.

### IN-03: Impossible-state guard — `cards === null` branch after the fatal guard

**File:** `app/components/TripIndex.vue:56-57`, `app/components/TripIndex.vue:105`
**Category:** necessity
**Issue:** `listedTrips` returns `null` only when `data.value == null` (`app/utils/tripDates.ts:85-89`). With the top-level `await`, `useAsyncData` has settled before the template renders. Since 7021b8a, an errored fetch throws (`TripIndex.vue:46-53`), so a null `data` should no longer be reachable on SSR, or on hydration from the payload. The `if (trips === null) return null` branch and the `v-else-if="cards !== null"` distinction then defend against a state that cannot occur. The header comment at lines 9-11 still describes it as live. This is judgment rather than proof: it depends on Nuxt's `useAsyncData` semantics, not on a type in this repo.
**Fix:** leave the code as is (removing it would not change the normal-case markup, but it is a scope call). Alternatively, update the comment at lines 9-11 to say the null state is unreachable since G-11-3 and kept only as defense.

---

_Reviewed: 2026-11-23T00:25:06Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
