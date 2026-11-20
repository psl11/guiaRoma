---
phase: 11-portada-y-rutas-multi-viaje
reviewed: 2026-11-20T00:00:00Z
depth: standard
files_reviewed: 41
files_reviewed_list:
  - app/assets/css/multitrip.css
  - app/components/TripIndex.vue
  - app/components/TripView.vue
  - app/pages/index.vue
  - app/pages/trips/[slug].vue
  - app/utils/tripDates.ts
  - content.config.ts
  - nuxt.config.ts
  - scripts/tripManifest.d.mts
  - scripts/tripManifest.mjs
  - shared/schemas.ts
  - content/trips/roma/trip.yml
  - content/trips/forma/trip.yml
  - content/trips/prueba/trip.yml
  - tests/data/build-isolation.spec.ts
  - tests/data/invariants.spec.ts
  - tests/data/romaChrome.spec.ts
  - tests/data/schema.spec.ts
  - tests/data/trips.ts
  - tests/parity/_harness.ts
  - tests/parity/_pagesServer.ts
  - tests/parity/legacy-redirect.spec.ts
  - tests/parity/portada.spec.ts
  - tests/parity/shell.spec.ts
  - tests/parity/map-fallback-notes.spec.ts
  - tests/parity/modes.spec.ts
  - tests/parity/navigation.spec.ts
  - tests/parity/render-cards.spec.ts
  - tests/parity/render-reference.spec.ts
  - tests/parity/render-timeline.spec.ts
  - tests/parity/search-route.spec.ts
  - tests/parity/subpath.spec.ts
  - tests/parity/theme.spec.ts
  - tests/parity/visual-diff.spec.ts
  - tests/trips/isolation.spec.ts
  - tests/trips/portada.spec.ts
  - tests/trips/shape.spec.ts
  - tests/unit/multitripCss.spec.ts
  - tests/unit/tripCoupling.spec.ts
  - tests/unit/tripDates.spec.ts
  - tests/unit/tripManifest.spec.ts
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
  necessity: 0
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-11-20T00:00:00Z
**Depth:** standard
**Files Reviewed:** 41
**Status:** issues_found

## Summary

I reviewed the phase-11 diff against `bbc4e23`: the home page (`TripIndex.vue`, `pages/index.vue` with the
legacy-hash redirect), the `/trips/[slug]/` route and its page key, the draft exclusion and prerender routes
read at config time (`scripts/tripManifest.mjs`, `content.config.ts`, `nuxt.config.ts`), the new optional
`TripSchema` fields, the pure helpers in `tripDates.ts`, the footer back link in `TripView.vue`,
`multitrip.css`, and the new and updated specs. I checked the 11 Roma parity specs only for the mechanical
`_harness.ts` change, which is limited to `ROMA_URL`/`ROMA_HTML` as D-18 requires.

The core mechanics hold up. The draft exclusion fails closed: nuxi forces `NODE_ENV=production` for
build/generate (`@nuxt/cli` `overrideEnv`), and a non-boolean `draft` or an invalid folder name throws. The
redirect has a fixed, same-origin destination, and its hash is validated with a regex. Every Roma `id` in the
built `trips/roma/index.html` matches `^[a-z0-9-]+$`, so no legacy anchor misses the redirect. The page key
by slug is correct. ESLint is clean on the lintable files.

The main risk is in the new data contract for the home-page card. The `summary` field goes through MDC
(which turns on `remark-gfm` and `rehype-raw`) and is rendered inside `<p>` inside `<a>`. The gate that
protects that position can be bypassed, and nothing checks for block Markdown. I confirmed both against the
real MDC parser (`@nuxtjs/mdc@0.22.0` `parseMarkdown`). A failed query on the home page also renders a blank
page that the prerender reports as 200.

No BLOCKERs: today's data (Roma's `summary`) is clean, so none of the findings cause a visible bug in the
current build. They are holes in the guarantees that the phase says it provides.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: The `trip-summary-link` rule can be bypassed, so a nested `<a>` can reach the home-page card

**File:** `tests/data/trips.ts:174-188`
**Issue:** `hasLink` only detects `](dest)` with no space after `(`, `<scheme:…>` autolinks, and
`http(s)://` / `www.`. MDC's parser has `remark-gfm` and `rehype-raw` turned on
(`@nuxtjs/mdc/dist/runtime/parser/options.js`), and it turns all of the following into `<a>`. I checked each
one with `parseMarkdown`, and `hasLink` returns `false` for all four:
- `Escríbenos a hola@ejemplo.com` → `<a href="mailto:hola@ejemplo.com">` (GFM email autolink literal)
- `Ver <a href="#x">aquí</a>` → `<a href="#x">` (raw HTML via rehype-raw)
- `[t][r]\n\n[r]: #inicio` → `<a href="#inicio">` (reference link; a `|`-style YAML block allows it)
- `[t]( #inicio )` → `<a href="#inicio">` (CommonMark allows spaces around the destination; the regex
  `\]\(([^)\s]+)` requires a non-space right after `(`)

Any of these in `summary` puts an `<a>` inside `a.trip-index-card` (`TripIndex.vue:69-88`). The HTML parser
closes the outer anchor, the server DOM no longer matches the vnode tree, and hydration breaks. This is
exactly the failure D-07 and the rule's own comment (`trips.ts:29-32`) say the rule prevents. The same
weakness affects `cross-trip-link` and `anchor`, which share `extractLinkTargets`.
**Fix:** Check the parsed output instead of pattern-matching the source. Parse `summary` with the same parser
the app uses and reject any `a` element:
```ts
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
const hasA = (n: any): boolean => n?.tag === 'a' || (n?.children ?? []).some(hasA)
// in checkTrip (make it async or pre-parse):
if (typeof summary === 'string' && hasA((await parseMarkdown(summary)).body))
  push(d.file, 'trip-summary-link', '…')
```
If the gate has to stay synchronous, at least add `/<a[\s>]/i`, an email regex
(`/[\w.+-]+@[\w-]+\.[\w.]+/`), `/^\s*\[[^\]]+\]:/m`, and relax the destination regex to `\]\(\s*<?([^)\s>]+)`.
Add one fixture per bypass to `invariants.spec.ts`.

### WR-02: Block Markdown in `summary` renders block elements inside `<p class="trip-index-summary">`

**File:** `app/components/TripIndex.vue:78-87`, `shared/schemas.ts:424`
**Issue:** `summary` is only `Md.min(1)` (any string). The card renders it as
`<p class="trip-index-summary"><MDC :tag="false" unwrap="p" /></p>`. `unwrap="p"` only removes paragraph
wrappers. Any block construct produces a block element inside the `<p>` (and inside the `<a>`): a list,
heading, blockquote, table, or a sentence that starts with a year. I confirmed that
`2027. Diez días por Campania` parses to `<ol start="2027"><li>…</li></ol>`, because a number of up to 9
digits followed by `. ` starts a CommonMark ordered list. That is a very natural opening for a trip
summary. The browser closes `<p>` before `<ol>`, the DOM no longer matches the vnode tree (hydration
mismatch), and the card layout breaks. No schema or gate rule covers this.
**Fix:** Add a gate rule (for example `trip-summary-inline`) that rejects a `summary` whose parsed body
contains anything other than one `p` with inline children:
```ts
const body = (await parseMarkdown(summary)).body.children.filter(n => n.type === 'element')
if (body.length !== 1 || body[0].tag !== 'p') push(d.file, 'trip-summary-inline', 'summary debe ser Markdown-inline (una sola frase/párrafo)')
```
You could also render into a `<div class="trip-index-summary">` instead of a `<p>`, but the gate is the
real protection.

### WR-03: A failed query on the home page publishes a blank page with HTTP 200

**File:** `app/components/TripIndex.vue:36-52`, `app/components/TripIndex.vue:61-96`
**Issue:** `useAsyncData('trips-index', …)` takes only `data`. If `queryCollection('trip')` throws during
prerender (a schema/column drift after adding a field, a broken Content DB, or a typo in `.select`), Nuxt
stores the error in `error.value` and leaves `data.value` as `undefined`. `listedTrips` returns `null`, so the
template renders an empty `<main>`: no cards, no empty state, no message. The page still prerenders with
status 200, so `nitro.prerender.failOnError` does not catch it, and `nuxt generate` publishes a blank home
page. Only `tests/parity/portada.spec.ts` would notice, and only if the parity gate runs before deploy.

The rationale given for the `null` state ("nunca durante la hidratación", lines 9-13) does not apply here:
with a top-level `await useAsyncData`, data is resolved before SSR render and comes from the payload during
hydration. So the `null` branch is only reached on this error path.
**Fix:** Turn a query failure into a fatal error so the prerender fails:
```ts
const { data, error } = await useAsyncData('trips-index', () => queryCollection('trip').select(…).all())
if (error.value) {
  throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar la lista de viajes', fatal: true })
}
```

## Info

### IN-01: The schema accepts card data that the card then silently drops

**File:** `shared/schemas.ts:418-424`, `app/utils/tripDates.ts:51-52`, `tests/data/trips.ts:241`, `tests/data/invariants.spec.ts:427`
**Issue:** Three inputs pass validation but are silently dropped or render as nothing on the card:
- `endDate` without `startDate` is explicitly accepted ("solo endDate → sin violación"), but
  `formatTripDates` returns `null` and `sortTrips` puts the trip last. The author's date disappears with no
  signal.
- `summary: ' '` passes `Md.min(1)`. `c.summary` is truthy, so the card renders an empty
  `p.trip-index-summary`.
- `destinations: [' ']` passes `z.string().min(1)` and produces a meta line ending in ` · `.

**Fix:** Have `trip-dates` reject `endDate` without `startDate`. Use `.trim().min(1)` (or
`.regex(/\S/)`) for `summary` and the `destinations` items.

### IN-02: The `multitrip.css` scope guard does not see at-rules that bring in global CSS

**File:** `tests/unit/multitripCss.spec.ts:38-71`
**Issue:** `cssSelectors` only looks at the prelude before `{`. An `@import url(other.css);` ends in `;`, so
it is dropped without a check: a global stylesheet pulled in from `multitrip.css` would reach Roma's DOM and
the guard would stay green. Splitting on every `,` also cuts selectors such as
`.trip-index :is(h2, p)` into `.trip-index :is(h2` and `p)`, which gives a false positive.
**Fix:** Reject any `@import` (and `@layer` statements) in `multitrip.css`. Split selector lists only on
commas at parenthesis depth 0.

### IN-03: A symlinked trip folder bypasses the "fail-closed" draft exclusion

**File:** `scripts/tripManifest.mjs:42`
**Issue:** `readdirSync(..., { withFileTypes: true })` returns `isDirectory() === false` for a symlink to a
directory, so the manifest skips a symlinked trip folder. Nuxt Content's `trips/*/…` globs will still pick it
up if they follow symlinks. A symlinked folder with `draft: true` would then get no `exclude` entry, and its
rows would ship in the public `sql_dump`. That contradicts the "FAIL-CLOSED" claim in `content.config.ts:32`.
Whether Content follows the symlink is unverified, so this is judgment-level.
**Fix:** Accept symlinks (`d.isDirectory() || (d.isSymbolicLink() && statSync(join(root, d.name)).isDirectory())`),
or throw on any symlink under `content/trips`.

### IN-04: Comments still describe the pre-phase-11 routing

**File:** `app/app.vue:39-41`, `tests/parity/shell.spec.ts:21`, `tests/parity/shell.spec.ts:219-220`, `tests/data/build-isolation.spec.ts:11`
**Issue:** `app.vue` still says both pages are `<TripView :slug>` one-liners (`index.vue` is now the home
page). `shell.spec.ts` still says "la salida estática SOLO emite «/» (D-01)", but it now also emits
`trips/roma/`. `build-isolation.spec.ts` says "«/» pasará a ser la portada" in the future tense. The headers
of the Roma parity specs also still say "sobre el «/» CONSTRUIDO".
**Fix:** Update `app.vue` and `build-isolation.spec.ts`. D-19 limits edits to the parity specs, so record the
outdated headers in `tests/README.md` or fix them in a later phase where that is allowed.

### IN-05: The base-URL trailing-slash expression is duplicated four times

**File:** `app/app.vue:9`, `app/pages/index.vue:25`, `app/components/TripIndex.vue:34`, `app/components/TripView.vue:67`
**Issue:** `app.baseURL.endsWith('/') ? app.baseURL : \`${app.baseURL}/\`` now appears in four places. Two of
them (the redirect destination and the back link) are routing contracts tested elsewhere. If one copy drifts,
links can quietly differ.
**Fix:** Move it into a single `app/utils/baseHref.ts` (`export const withSlash = (b: string) => …`) or a
`useBaseHref()` composable.

### IN-06: Debug `console.log` in the redirect spec, and a build-time dependency in devDependencies

**File:** `tests/parity/legacy-redirect.spec.ts:133`, `tests/parity/legacy-redirect.spec.ts:163`, `scripts/tripManifest.mjs:13`
**Issue:** Two `console.log` calls print measurements on every gate run. Separately, `yaml` is now loaded
while the Nuxt and Content configs are evaluated (it is imported by `tripManifest.mjs`), but it is only a
`devDependency`. A `--prod` install would make `nuxi generate` fail at config load. That does not matter for
today's static build, but the dependency is mis-declared.
**Fix:** Remove the logs, or attach the values with `testInfo.annotations`. Move `yaml` to `dependencies`, or
add a comment that the build requires devDependencies.

---

_Reviewed: 2026-11-20T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
