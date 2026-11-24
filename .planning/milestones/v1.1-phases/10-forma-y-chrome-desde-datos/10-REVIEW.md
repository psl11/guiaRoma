---
phase: 10-forma-y-chrome-desde-datos
reviewed: 2026-11-22T20:19:22Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - tests/README.md
  - tests/data/invariants.spec.ts
  - tests/data/trips.ts
findings:
  critical: 3
  warning: 2
  info: 1
  total: 6
  necessity: 0
status: issues_found
---

# Phase 10: Code Review Report (incremental, gap closure 10-06 / G-10-2)

**Reviewed:** 2026-11-22T20:19:22Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Scope: the 10-06 change (`3f262ff^..HEAD`, inside `f436b0f..HEAD`) to `tests/data/trips.ts`, `tests/data/invariants.spec.ts` and `tests/README.md`. It replaces `extractLinkTargets` with `scanProseLinks`, adds the `card-placement` rule, and adds `renderedMonuments` (anchors, `seenIn`, timeline and reservas `ref`s).

Both sides of every claim below were checked against the real tools:
- **What renders:** `parseMarkdown` from the installed `@nuxtjs/mdc` 0.22.0 parser (`node_modules/.pnpm/@nuxtjs+mdc@0.22.0_magicast@0.5.3/.../dist/runtime/parser/index.js`), with the same remark-gfm, remark-mdc and rehype-raw defaults `<MDC>` uses.
- **What the gate says:** the real `loadTripFromFiles` + `checkTrip` from `tests/data/trips.ts`, loaded through jiti, using fixtures with the same shape as `galeriaWith()` in the spec.

`vitest run tests/data/invariants.spec.ts` passes (200 tests) and the real trips stay green.

**WR-03 is fixed correctly.** `renderedMonuments` matches `DaySection.vue:78-80` exactly (`day.cards → monById → MonumentCard :id="monument.slug"`, `MonumentCard.vue:202`). No other component renders a monument id. Food (`GastroSection` via `groupFood`, which keeps every group) and artists (`TripView.vue:225-262`, glossary included under arquitectura) really do render their ids whenever they exist, so keeping non-monument entities in `anchorable` is correct.

**WR-01 is only partly fixed.** The new scanner lists link syntaxes one by one instead of checking what the renderer actually produces. Several valid forms still produce a real `<a href="/trips/roma">` while the gate reports **zero violations**. That directly contradicts the "fail-closed … nunca un falso verde" guarantee written in `trips.ts:336-337` and `tests/README.md:354-355`. A structured `href` field that renders verbatim is never checked at all. Prose can also create DOM ids and heading `<a>`s, which undermines the unique-id guarantee `card-placement` was added to provide.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: The reference-definition rejection only catches unindented definitions with simple labels, so `[x][r]` still renders cross-trip links

**File:** `tests/data/trips.ts:303`
**Issue:** The rejection is `/^[ \t]*\[[^\]\n]+\]:/m`. In CommonMark, link reference definitions are global to the document, and they are also valid in these places, which the regex does not match:
- inside a block quote (`> [r]: …`)
- inside a list item (`- [r]: …`, `1. [r]: …`)
- with a label that spans a line break (`[r\ns]`, matched by `[x][r s]`)
- with a label containing an escaped `]` (`[a\]b]`)

YAML block scalars (`|`/`>`) make multi-line strings routine. Results from MDC and from the gate:

| Prose string | `parseMarkdown` (MDC 0.22.0) | `checkTrip` |
|---|---|---|
| `> [r]: /trips/roma\n\nVer [x][r].` | `a {"href":"/trips/roma"}` | **GREEN** |
| `- [r]: /trips/roma\n\nVer [x][r].` | `a {"href":"/trips/roma"}` | **GREEN** |
| `1. [r]: /trips/roma\n\nVer [x][r].` | `a {"href":"/trips/roma"}` | **GREEN** |
| `Ver [x][r s].\n\n[r\ns]: /trips/roma` | `a {"href":"/trips/roma"}` | **GREEN** |
| `Ver [x][a\]b].\n\n[a\]b]: /trips/roma` | `a {"href":"/trips/roma"}` | **GREEN** |

These are exactly the D-05(b) / D-11 targets the gate must stop. A `/trips/…` href that gets through is also picked up by `crawlLinks`. The same forms with `#nope` skip the D-08 anchor check too. A footnote definition inside a block quote (`> [^1]: …`) gets past the same regex.
**Fix:** Reject any `]:` that follows a bracketed label, wherever it appears. Allow line breaks and escapes in the label, and do not anchor to the line start. This is still fail-closed, and no file in `content/trips` contains `]:` today:
```ts
// Definición de referencia (también dentro de >, -, 1. y con etiqueta multilínea o con \]).
[/\[(?:[^\[\]\\]|\\[\s\S])+\]:/, 'definición de referencia «[r]: …»'],
```
Add the five strings above (plus `> [^1]: nota`) to the `it.each` at `tests/data/invariants.spec.ts:530-548`.

### CR-02: The frontmatter-props rejection matches only one way of writing the YAML key, so `::a` + `---` + `href` still renders `<a href>`

**File:** `tests/data/trips.ts:311`
**Issue:** The regex requires a line that starts with an optionally quoted, literal `href`/`to` followed by `:`. remark-mdc parses the frontmatter as full YAML, so other spellings of the same key produce the same prop:

| Prose string | MDC | `checkTrip` |
|---|---|---|
| `::a\n---\n{href: /trips/roma}\n---\nesto\n::` (flow mapping) | `a {"href":"/trips/roma"}` | **GREEN** |
| `::a\n---\n? href\n: /trips/roma\n---\nesto\n::` (explicit key) | `a {"href":"/trips/roma"}` | **GREEN** |
| `::a\n---\n"\x68ref": /trips/roma\n---\nesto\n::` (escaped key) | `a {"href":"/trips/roma"}` | **GREEN** |

YAML aliases and merge keys (`<<: *x`) open more variants. Matching YAML keys lexically cannot be made complete.
**Fix:** Reject the construct itself, not its keys. A block component that opens a `---` frontmatter is never used by the guide: no file in `content/trips` contains a `---` line or `::`.
```ts
[/^[ \t]*:{2,}[A-Za-z][\w-]*[^\n]*\n[ \t]*---[ \t]*$/m, 'bloque MDC con frontmatter «::x / ---»'],
```
Add the three strings above as teeth next to `tests/data/invariants.spec.ts:586-594`.

### CR-03: `FoodEntry.href` renders as `<a :href>` with no checks; the gate accepts `/trips/roma`, `#nope` and `javascript:`

**File:** `tests/data/trips.ts:499-514` (`ref` loop) and `tests/data/trips.ts:637-653` (link scan); rendered by `app/components/TimelineFood.vue:60-66`; schema `shared/schemas.ts:112`
**Issue:** `TimelineFood.vue` renders `<a v-else-if="entry.href" :href="entry.href" target="_blank">`. Vue does not sanitise `href`, and the schema field is a bare `z.string()`.
- The `ref` loop checks only `e.ref`.
- The anchor/allowlist scan passes `href` through `scanProseLinks`, which sees only Markdown syntax. A bare string such as `/trips/roma` is not a "form", so it is never a target.

Checked with `checkTrip` on a day containing `timeline: [{kind: food, entries: [{name, href}]}]`:
- `href: /trips/roma` → **GREEN**
- `href: '#nope'` → **GREEN**
- `href: 'javascript:alert(1)'` → **GREEN**

Each one renders a real `<a>`. `javascript:` is literally in the D-05(b) must-fail list (`invariants.spec.ts:500`), and `/trips/…` is the D-11 cross-trip case. The gate's goal is that every `<a>` either matches the allowlist or resolves as an anchor; this one bypasses both.
**Fix:** In the timeline loop, run every `entry.href` (choice options included, via `timelineRowsOf`) through the same allowlist. Every real use today is `https://www.google.com/maps/...`, so the trips stay green.
```ts
if (row.kind === 'food') {
  for (const e of asArray(row.entries)) {
    if (typeof e.ref === 'string' && !stopOrFood.has(e.ref)) push(d.file, 'ref', `timeline food ref "${e.ref}" no resuelve`)
    if (typeof e.href === 'string' && !/^https?:\/\//i.test(e.href))
      push(d.file, 'cross-trip-link', `timeline food href "${e.href}" no admitido (D-05): solo http(s)://`)
  }
}
```
Better still, also tighten `FoodEntry.href` in `shared/schemas.ts` to `z.string().regex(/^https?:\/\//)`. Add teeth for all three values, including one inside a `choice` option.

## Warnings

### WR-01: Prose can create DOM ids and heading `<a>`s that the gate never sees, which undermines `card-placement` and `trip-summary-link`

**File:** `tests/data/trips.ts:342-352`, `tests/data/trips.ts:479-492`, `tests/data/trips.ts:359-362`
**Issue:** `card-placement` exists so that `#<slug>` is a unique DOM id. MDC can create ids from prose without any link syntax:
- **Headings:** `## Mapa` → `h2 {"id":"mapa"}`, and setext `Texto\n---` too. With the `@nuxt/content` renderer defaults (`anchorLinks: { h2, h3, h4 }`, passed to `public.mdc.headings`), `ProseH2` also wraps the heading in `<a href="#mapa">`, so this is an `<a>` the scanner does not see.
- **Inline attributes:** `**aquí**{#galeria}` → `strong {"id":"galeria"}`.
- **Raw HTML:** `<span id="galeria">` → `span {"id":"galeria"}`.

I gave the `otra` card the prose `## Mapa\n\nTexto **aquí**{#galeria}. Ver [la galería](#galeria).` and placed both cards in a day. `checkTrip` reported **GREEN**. In the DOM that string produces:
- a second `id="mapa"`, which conflicts with the fixed section the pills scroll to;
- a second `id="galeria"` earlier in the page, so `[la galería](#galeria)` may jump to the `<strong>` and not to the card.

In `trip.yml`, `summary: "## Cinco días"` (or `"Cinco días\n---"`) passes `trip-summary-link` (**GREEN**). `TripIndex.vue:78-87` then renders `<p><h2><a href="#cinco-días">` inside the `<a class="trip-index-card">`. That is the nested `<a>` and broken hydration D-07 was written to prevent.
**Fix:** Add rejected forms for prose-created ids. The guide uses none of them:
```ts
[/^[ \t]{0,3}#{1,6}[ \t]/m, 'encabezado Markdown «# …» (MDC le pone id y <a href="#…">)'],
[/^[ \t]{0,3}(?:=+|-+)[ \t]*$/m, 'encabezado setext «Texto / ---»'],
[/\{[^{}]*#[\w-]/, 'atributo MDC «{#id}»'],
[/<[A-Za-z][^>]*\sid\s*=/i, 'HTML crudo con id'],
```
Check the setext pattern against `---` table/hr use before adopting it; no real trip has a `---` line. As an alternative, set `content.renderer.anchorLinks: false` and keep only the id rejections. Add a summary tooth for `## …` next to `invariants.spec.ts:572-582`.

### WR-02: The raw-HTML rejection matches only `<a`; other raw elements that navigate (`<area href>`, `<form action>`) still pass

**File:** `tests/data/trips.ts:304`
**Issue:** rehype-raw renders all raw HTML (`allowDangerousHtml: true` in the MDC defaults). `<map name="m"><area href="/trips/roma" shape="default"></map>` parses to `area {"href":"/trips/roma"}`, a clickable cross-trip link, and `checkTrip` reports **GREEN**. The comment block at `trips.ts:314-341` and the README describe the gate as complete for "toda forma … que pinta un enlace". Listing tags one at a time has the same weakness as CR-01 and CR-02.
**Fix:** Allowlist raw HTML instead of blocklisting it. The only raw tag in `content/trips` is `<br>` (51 uses; `<name`/`<slug` appear only in YAML comments):
```ts
[/<(?!br\s*\/?>)[A-Za-z]/i, 'HTML crudo (solo se admite <br>)'],
```
This also closes WR-01's raw `id=` case.

## Info

### IN-01: `card-placement` reports duplicate violations when two monument files share a slug

**File:** `tests/data/trips.ts:480-491`
**Issue:** The loop runs once per monument doc. With two docs sharing a slug (one of them already a `basename-slug` / `dup-id` violation) and that slug placed in two days, each doc pushes the same per-day violation, so every day file gets the same message twice.
**Fix:** Loop over the distinct slugs (`new Set(monuments.map(d => d.slug))`) for the "more than once" branch, and keep the per-doc loop only for the "no day" branch.

---

_Reviewed: 2026-11-22T20:19:22Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
