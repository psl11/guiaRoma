---
phase: 10-forma-y-chrome-desde-datos
reviewed: 2026-11-20T14:48:19Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - app/app.vue
  - app/components/NavPills.vue
  - app/components/Topbar.vue
  - app/components/TripView.vue
  - app/utils/tripLayout.ts
  - shared/schemas.ts
  - content/trips/roma/trip.yml
  - content/trips/forma/trip.yml
  - tests/data/trips.ts
  - tests/data/invariants.spec.ts
  - tests/data/schema.spec.ts
  - tests/data/build-isolation.spec.ts
  - tests/data/romaChrome.spec.ts
  - tests/trips/romaLeaks.ts
  - tests/trips/shape.spec.ts
  - tests/unit/romaChromeGuard.spec.ts
  - tests/unit/romaLeaks.spec.ts
  - tests/unit/tripLayout.spec.ts
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
  necessity: 1
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-11-20T14:48:19Z
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

I reviewed the Phase 10 diff (`f04967a..HEAD`): `buildTripLayout` as the single list behind both `<main>` and the nav pills, chrome taken from `trip.yml` (brand, footer, map legend, page title), the new `day-order`, `day-pill`, `anchor` and `cross-trip-link` rules in the data gate, the dev-only `forma` trip, and the trap and guard specs.

The runtime side is sound. `TripView` keeps every `<section>` as a direct child of `<main>`, so the `section + section` rule still applies; Vue's fragment comments do not count as siblings. Roma's layout produces the same 12 entries in the same order, the scrollspy reads `section` elements generically, and no CSS targets a specific section id. `vitest run tests/unit tests/data` passes (21 files, 592 tests).

The defects are in the guarantees this phase claims:

1. **The D-05(b) link allowlist can be bypassed.** I checked this against the project's own MDC parser (`@nuxtjs/mdc` 0.22.0). Four valid Markdown forms render real `<a href="/trips/roma">` links, and the gate never sees them.
2. **`inlineMdToPlain`**, the D-14 neutral fallback for the tab title and brand, garbles ordinary titles: nested emphasis, underscores inside words, and escaped characters.
3. **The D-08 anchor gate still accepts anchors to monuments that are never rendered** (monuments not listed in any day's `cards`).

Locked decisions D-01…D-19 were not flagged as defects. The deferred CR-01 issue (`forma` rows in the public `sql_dump`) is acknowledged in the context file and is not re-reported.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The link allowlist and anchor check (D-05b / D-08) can be bypassed with valid Markdown that MDC renders as links

**File:** `tests/data/trips.ts:165-171` (used at `tests/data/trips.ts:352-363`)
**Issue:** `extractLinkTargets` only recognises the form `](target)`, with the target starting immediately after `(` and stopping at whitespace (`/\]\(([^)\s]+)/g`). I ran four other forms through `parseMarkdown` from `@nuxtjs/mdc` 0.22.0 (the parser `<MDC>` uses at runtime). All four produce a real `<a>` element, and the gate does not see any of them:

| Prose in YAML | MDC output | Gate |
|---|---|---|
| `[x]( /trips/roma)` (space after `(`) | `<a href="/trips/roma">` | not captured |
| `[x](\n../roma#x)` (line break after `(`, which is easy to produce with `>`/`|` blocks) | `<a href="../roma#x">` | not captured |
| `[x][r]` plus a definition line `[r]: /guiaRoma/#pantheon` | `<a href="/guiaRoma/#pantheon">` | not captured |
| `<a href="/trips/roma">x</a>` (inline HTML) | `<a href="/trips/roma">` | not captured |

These are exactly the targets D-05(b) says must fail verification by name (`/#x`, `/guiaRoma/#x`, `../roma#x`, `/trips/...`). A `/trips/...` link that gets through is worse than a broken link: `crawlLinks` would follow it and prerender a `/trips/*` route, which breaks the D-01 prerender rule. The same forms also skip the `anchor` check, so `[x]( #missing)` or `<a href="#missing">` passes as well.

**Fix:** Extract link targets from the parsed tree, not with a regex, so the gate sees exactly what the UI renders. In the Node-only gate, `mdast-util-from-markdown` is already in `node_modules`:
```ts
import { fromMarkdown } from 'mdast-util-from-markdown'
import { visit } from 'unist-util-visit'
function extractLinkTargets(md: string): string[] {
  const out: string[] = []
  const tree = fromMarkdown(md)
  visit(tree, ['link', 'definition'], (n: any) => out.push(n.url))
  // raw HTML anchors: reject outright
  visit(tree, 'html', (n: any) => { if (/<a\b/i.test(n.value)) out.push('__raw-html-anchor__') })
  return out
}
```
Then add one fixture per bypass form to the `cross-trip-link` `it.each` in `tests/data/invariants.spec.ts`. If you would rather not add the parser, the minimum fix is a regex that allows optional whitespace after `(` (`/\]\(\s*<?([^)\s>]+)/g`), plus two extra rules: reject any `^\s*\[[^\]]+\]:\s*\S` definition line and any `<a\s` in prose.

### WR-02: `inlineMdToPlain` (the D-14 neutral fallback) garbles ordinary titles

**File:** `app/utils/tripLayout.ts:100-105`
**Issue:** This regex-based helper builds the fallback tab title and brand (`TripView.vue:86-87`, `Topbar.vue` via `fallbackTitle`). The trap test also uses it as its render precondition (`tests/trips/shape.spec.ts:207-210,248-250`). I ran it under Vitest and got these outputs:

- `***Roma***` → `*Roma*`, and `**_Roma_**` → `_Roma_`. The replacement runs only once, so nested emphasis keeps its inner markers.
- `Viaje a la_costa_brava` → `Viaje a lacostabrava`. CommonMark never treats underscores inside a word as emphasis, but the helper deletes them.
- `Tres_dias de _sol_` → `Tresdias de sol_`. The lazy match pairs the wrong underscores.
- `Un \*viaje\*` → `Un \viaje\`. Escapes are not handled.

Any trip that omits `pageTitle`/`brand` and uses one of these shapes in `title` gets a broken tab title and brand. The tab text also no longer matches what MDC renders in the hero `h1`, so the trap test's `h1 === inlineMdToPlain(title)` precondition would fail even though the page is correct.

**Fix:** Reduce the title through the same Markdown grammar, not a hand-written regex. If the helper must stay dependency-free (Vitest without Nuxt), at least:
```ts
export function inlineMdToPlain(md: string): string {
  let s = md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  let prev
  do { // peel nested emphasis until stable
    prev = s
    s = s
      .replace(/(\*\*|\*)(?=\S)(.+?)(?<=\S)\1/g, '$2')
      .replace(/(^|[^\p{L}\p{N}])(__|_)(?=\S)(.+?)(?<=\S)\2(?![\p{L}\p{N}])/gu, '$1$3')
  } while (s !== prev)
  return s.replace(/\\([\\`*_{}[\]()#+\-.!])/g, '$1').trim()
}
```
Add the four cases above to `tests/unit/tripLayout.spec.ts`.

### WR-03: The `anchor` rule still accepts monuments that are never rendered (D-08 does not hold for them)

**File:** `tests/data/trips.ts:351`
**Issue:** D-08's comment says `anchor` "solo resuelve a las secciones que existen" (only resolves to sections that exist), and the phase claims to close WR-01 of Phase 9 with it. However, `anchorable` still includes every entity slug, including every monument. A `MonumentCard` (the element that carries `id="<slug>"`) is rendered only from a day's `cards` list (`app/components/DaySection.vue:143`). Nothing in the gate requires every monument to appear in some day's `cards`.

So `[x](#orphan-monument)` passes the gate, but no element has that id. The click is still intercepted, because `isFichaTarget` checks `monById`, which holds every monument. `navigateToCard` then pushes a scroll position onto `navStack` and shows the back button, but scrolls nowhere (`app/composables/useCardNavigation.ts:73-81`). With 10-day trips like `forma`, where most days have `cards: []`, this situation is now realistic.

The reverse case is also unchecked: a monument listed in two days' `cards` renders two elements with the same `id`.

**Fix:** In `checkTrip`, build `renderedMonuments` from the union of every `days[*].cards`. Use it instead of all monument slugs when building `anchorable`, and also for `artists.seenIn`. Add a rule (for example `card-placement`) that flags a monument in zero or in more than one day's `cards`, so the DOM ids stay unique.

## Info

### IN-01: Impossible-state guard — `v-if="e.day"` and `v-if="refById.get(...)"` in the layout loop

**File:** `app/components/TripView.vue:153-155,163-166,181-184`
**Category:** necessity
**Issue:** `buildTripLayout` (`app/utils/tripLayout.ts:87-90`) adds a `day` entry only together with its `day`. It adds `reservas`/`practica` only when `hasReservas`/`hasPractica` is true, and those flags come from the same `refById.get(...)` call (`TripView.vue:76-77`). So the inner guards and the non-null assertions (`!`) after them can never take the empty branch. The comment admits they exist "solo seguridad de tipos" (only for type safety).
**Fix:** Make `LayoutEntry` a discriminated union (`{ kind: 'day', day: D } | { kind: StructuralSectionId }`) so `e.day` narrows by itself. For reservas/practica, carry the reference object in the entry, or keep the guard but drop the duplicated `!`.

### IN-02: `day-pill` does not check day labels against the structural pill labels

**File:** `tests/data/trips.ts:316-332`
**Issue:** Labels are deduplicated among days only. A day with `pill: Mapa` or `pill: Arte`, or a derived label that matches one (for example an eyebrow `mapa · …`), would show two identical pills that lead to different sections. That is the same ambiguity D-03 exists to prevent.
**Fix:** Seed `byPill` with `pillKey(STRUCTURAL_LABELS[id])` for every structural id that the trip's layout emits, and report any collision.

### IN-03: A duplicated `order` makes `day-order` also flag every later, correct day

**File:** `tests/data/trips.ts:307-312`
**Issue:** With orders `[1, 1, 2, 3]`, the rule flags `1→2`, `2→3` and `3→4`. That is three violations, two of them on correct files. The message points the author at the wrong files.
**Fix:** Report duplicates (`order X repetido en a, b`) and gaps (`falta order N`) separately, and keep the position check only for sets with no duplicates.

### IN-04: Footer lines accept block-level Markdown, which would put a block inside `<p>`

**File:** `shared/schemas.ts:387`, `app/components/TripView.vue:262-277`
**Issue:** Each footer line goes through `<MDC unwrap="p">` inside a single `<p>`. A line such as `1. Fin del viaje`, `- Pay` or `# Roma` parses to `<ol>`, `<ul>` or `<h1>`. `unwrap="p"` does not remove those, so the result is invalid nesting inside `<p>`: the browser re-parents it, and the prerendered markup no longer matches what hydration expects. The schema accepts any non-empty string.
**Fix:** In the data gate, reject footer lines that match `^\s*([-*+]\s|\d+[.)]\s|#{1,6}\s|>)`, or document that footer lines are inline-only and add a fixture.

### IN-05: The trap scans only text nodes, not attributes

**File:** `tests/trips/shape.spec.ts:223-233`
**Issue:** `collectTexts` reads `document.title`, `innerText` and `textContent`. A Roma literal that slips into an attribute (`alt` on the hero image, `title`, `aria-label`, the search box `placeholder`, a Leaflet attribution) passes D-16 unnoticed. Today no component has such a literal (checked with grep), so the gap is in coverage only.
**Fix:** Also gather the values of `[alt],[title],[aria-label],[placeholder]` attributes from the cloned body and run `findRomaLeaks` on them.

### IN-06: `dayLabel.ts`'s doc comment contradicts the new `pill` field

**File:** `app/utils/dayLabel.ts:10-13`
**Issue:** The comment says the label "se DERIVA aquí y nunca se almacena en los YAML de día" (is derived here and never stored in the day YAML). Since D-03, `pill` stores it in the YAML, and `dayPillLabel` in `app/utils/tripLayout.ts:76-78` is now the entry point.
**Fix:** Update the comment to say `dayLabel` is the fallback used by `dayPillLabel` when a day has no `pill`.

---

_Reviewed: 2026-11-20T14:48:19Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
