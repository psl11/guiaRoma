# Phase 12: Formas nuevas de viaje - Research

**Researched:** 2026-11-21
**Domain:** Additive schema extension (Nuxt Content v3 + zod 4), Vue render components, pure route/marker logic, scoped CSS for new variants, inline SVG motifs, Playwright E2E on a draft trip
**Confidence:** HIGH (everything below was verified against the real code this session, except the items in the Assumptions Log)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Days with alternatives (EXT-01) — user decision 2026-11-21: stacked, always visible
- **D-01:** Add one new `TimelineRow` kind, `choice`, inside `day.timeline`. It is not a `day.options` field. Shared rows before and after are ordinary timeline rows, for example «Noche: regreso a Nápoles».
  - Shape: `{ kind: 'choice', heading?: Md, options: [{ label, title: Md, rows: TimelineRow[] }] }`.
  - `label` is short free text such as «Opción A» or «Opción 1». Campania uses both A/B (day 24) and 1/2 (day 26).
  - Between 2 and 3 options.
  - One level only: the schema rejects a `choice` inside an option.
  - No field may be named `meta` or `id`, because both are reserved in Content v3.
  — **Reversibility:** costly — every trip YAML that uses `choice` and the renderer depend on this shape.
- **D-02:** Rendering.
  - Default heading «Elige una».
  - The options are stacked in data order, separated by «— o bien —».
  - Each option shows its label and title, then its rows rendered by the existing `Timeline` dispatcher (rows are reused, not duplicated).
  - The root element of the block is a `<div>`, never a `<section>`, because the scrollspy picks up every `<section>`.
- **D-03:** Both options stay visible at every pace and in summary mode.
  - Rows inside an option keep their own `pace` and summary behaviour, exactly like top-level rows.
  - The `choice` row has no `pace`, and the schema rejects one. The block is always present.
  - If a pace would hide every row of an option, its label and title still show.
- **D-04:** Day route with a `choice`: stops inside options are **excluded** from the day route, so it never mixes A and B. Only shared rows count. If fewer than 2 stops remain, the button does not render.
- **D-05:** Cards referenced inside options are ordinary cards of the day. They keep their map marker and their listing exactly as a top-level card would.

#### Where you sleep (EXT-02)
- **D-06:** Bases are a trip-level list plus a per-day reference.
  - Trip level: `trip.stays?: [{ slug, name: Md-inline, area?, coords?, note? }]`.
  - Day level: `day.stay?: <slug>`.
  - Name it `stays`, not `bases`, so it is never confused with `baseURL`.
  - The data gate fails, naming the file, when `day.stay` points to a slug that does not exist or when stay slugs are duplicated.
- **D-07:** A day with `stay` shows «Dormís en {name}» in its header, using a fixed Spanish UI string, as in the rest of the shared chrome. A day without `stay`, such as a departure day, shows nothing. Roma defines no `stays`, so its DOM is unchanged.
- **D-08:** No stay markers on the map in this phase (deferred, P2). `stays[].coords` is optional and only stored.

#### Transport (EXT-03)
- **D-09:** Add `ferry`, `car`, `bus`, `bike` and `plane` to two enums:
  - `TimelineRow(transport).variant`, which today is `taxi|walk|train`;
  - `day.stats[].variant`, which today is `walk|train|taxi|metro|ticket`.
  - Each new value gets its own visual style: a colour band plus a glyph following the `.tl-transport.taxi` pattern, and the equivalent for stats.
  - Colours come from existing tokens or `color-mix`, and must hold in light and dark themes.
  - A unit test fails if any enum value has no CSS rule.
  - Existing values (`metro`, `taxi`…) are not touched.

#### Nature places (EXT-04) — user decision 2026-11-21: new SVG drawings
- **D-10:** Add 4 `Motif` values with new SVG drawings in the stroke style of the current `svgMotifs.ts`: `sea` (beach or cove, waves), `thermal` (pool with steam), `river` (river or bridge) and `trail` (mountain path).
  - A test checks that every `Motif` value has an SVG.
  - Other Campania places (volcano, village, lake) use the closest existing or new motif. Extra motifs are only added if Phase 13 needs them.
- **D-11:** Add `nature` to `PlaceType`.
  - Its marker has its own colour and popup, added to the marker style table (`mapMarkers.ts`/`LeafletMap.client.vue`). The current colours of `card`/`guided`/`concert` stay as they are.
  - A nature card is a normal `MonumentCard`: same ficha, motif fallback when the image fails, and a Google Maps link.

#### Family note (EXT-07)
- **D-12:** Add `family?: Md` to the card. It renders as a box titled «Con niños», with a style derived from `.culture-box`, new CSS only.
  - Its position inside the card is planner discretion, but it must be consistent.
  - Cards without `family` (all of Roma's) keep an identical DOM.

#### Multi-city map (EXT-05)
- **D-13:** Keep the current rule: `setView(trip.map.center, zoom)` and then `fitBounds` over all markers with `.pad(0.1)`.
  - `trip.map` stays required, with no schema change. Campania gives a regional center.
  - A test proves that Naples, Procida, Ischia and Salerno are all inside the visible bounds.
  - Roma keeps exactly its current view.
  - No clustering and no per-day focus (deferred).

#### Day route by mode (EXT-06)
- **D-14:** Add `day.route?: { mode?: 'walking'|'driving'|'transit', enabled?: boolean }`. The default is walking and enabled, which is Roma's current behaviour, so Roma's URL stays identical.
  - `mode` maps to Google Maps' `travelmode`.
  - A day with a `transport` row of variant `ferry`, including one inside an option, hides the button automatically.
  - `route.enabled: true` can force the button to show and `false` can hide it on any day.
  - The 10-stop cap (`capStops`) and `routeLabel` stay unchanged.

#### Campania skeleton
- **D-15:** Create `content/trips/campania/` with `draft: true` (ROUTE-05).
  - `trip.yml` with `stays` (Naples, Procida, Ischia, Salerno), map, brand, footer, pageTitle and title.
  - At least 3 days:
    - Sun 20, with a ferry to Procida, bike and «Dormís en Procida» (route hidden);
    - Thu 24, with the A/B `choice` and `stay` Salerno;
    - Fri 25, a car day with `route.mode: driving`.
  - At least 4 cards with markers in Naples, Procida, Ischia and Salerno. At least one is `nature` with a new motif and `family`, for example Baia di Sorgeto.
  - Content is a placeholder in Spanish with real names. Phase 13 rewrites and expands it, and the input is `.planning/inputs/campania-2027-itinerario-raw.md`.
  - The day slugs follow the dated convention (Phase 10 D-02: `domingo-20`…).
- **D-16:** Tests and drafts.
  - E2E tests for the new shapes run in `pnpm test:trips` against `nuxi dev`, because drafts only load in development.
  - Pure logic (route mode, choice exclusion, stays reference, enum→style) gets unit tests.
  - The `campania` skeleton passes the full data gate.
  - The decoded-dump scan (`build-isolation.spec.ts`) gets a Campania sentinel, so the draft never reaches `.output/public`.

#### Parity and CSS
- **D-17:** Roma must not change.
  - The 56 goldens are never re-baselined.
  - `tests/parity/` is not edited; new spec files are allowed there only if needed.
  - `app/assets/css/{base,tokens,fonts,leaflet}.css` stay unchanged.
  - No `<style scoped>` and no `v-html`.
  - All new CSS goes outside `base.css`, in `multitrip.css` or a sibling file loaded after it.
  - **Principle:** no new selector may match any element of Roma's rendered DOM.
  - The Phase 11 guard (`multitripCss.spec.ts`: every selector starts with `.trip-index`) must be adapted to that principle. Recommended: an allowlist of new root classes, plus a test that none of them appears in `trips/roma/index.html`.
  — **Reversibility:** reversible.
- **D-18:** Every schema field is new and `.optional()` (strictly additive). The work order mirrors Phase 10 D-10: first a test that Roma's unchanged YAML still validates, then the new shapes.
- **D-19:** Process. Node 22; `rm -rf .data .nuxt .output` before generate; never run `test:trips` at the same time as generate or verify; branch `release/nuxt-4`.

### Claude's Discretion
- Exact glyphs and colours of the new transports and of the nature marker, as long as they are legible in light and dark themes.
- Stroke design of the 4 new SVGs, matching the visual family of the current ones.
- Internal structure of the component that renders `choice` (name `DayOptions`/`TimelineChoice`) and how it reuses `Timeline`.
- Position of the «Dormís en…» line inside `.day-header` and of the «Con niños» box inside the card.
- Whether `bike` and `plane` also get a stats style or only a transport one. Both are recommended.
- Exact placeholder text of the skeleton.

### Deferred Ideas (OUT OF SCOPE)
- A/B selector that remembers the choice and hides the other option (TRIP-02, future).
- Stay markers on the map, a «focus this day» button, clustering, ferry polylines (P2/P3).
- Extra motifs beyond the 4 (volcano, village, lake), only if Phase 13 needs them, as a decimal phase.
- Phase 11 WR-01..03 (`summary` on the portada): recommended before Campania stops being a draft (Phase 13). They are decided in `/gsd-verify-work 11`.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (REQUIREMENTS.md:38-44) | Research Support |
|----|-------------|------------------|
| EXT-01 | Un día puede ofrecer opciones alternativas («Elige una»: A o B), mostradas ambas apiladas con «— o bien —», con filas comunes antes y después | §Schema shape (verified zod probe), §Pattern 1 `TimelineChoice` + nested `<Timeline>`, §Pace/summary analysis (CSS `.tl-hidden` + `body.modo-resumen` list), Pitfalls 2, 3, 5, 14 |
| EXT-02 | Cada día indica dónde se duerme («Dormís en…») a partir de las bases del viaje | §Pattern 4 (`stayFor` + `DaySection` prop), data-gate rules `stay-ref`/`stay-dup`, Pitfall 17 |
| EXT-03 | El timeline distingue con estilo propio los tramos en ferry, coche, autobús, bici y avión | §Pattern 5 (CSS-only: `TimelineTransport`/`DaySection` already bind `variant` as class), enum→CSS test, Pitfall 1 (`train` has no rule) |
| EXT-04 | Lugares de naturaleza con ficha, marcador propio y dibujo de reserva | §Pattern 6 (`MARKER_STYLE` + popup extraction), §Motif pipeline (sizes, palette, unique ids), Pitfalls 7, 8 |
| EXT-05 | El mapa multi-ciudad encuadra todos sus marcadores (Roma conserva su vista) | §Map framing: code path unchanged; E2E containment test via marker/map bounding boxes |
| EXT-06 | La «ruta del día» usa el modo adecuado al día o se oculta (ferry) | §Pattern 3 (`buildDirUrl(points, mode)` default `walking`, `routeStops`, `routeVisible`), Google `travelmode` values [CITED] |
| EXT-07 | Una ficha puede incluir una nota para familias con niños | §Pattern 7 (`family` box, class `culture-box family-box`), position recommendation |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Stack fixed: Nuxt 4.4.8, `@nuxt/content` 3.14.0 `type: 'data'` YAML collections, zod 4.4.3 imported as `import { z } from 'zod'` (never the `@nuxt/content` re-export), Leaflet 1.9.4 raw in a `.client.vue`, hand-written global CSS with custom properties (no Tailwind/UnoCSS), MiniSearch, `@nuxtjs/color-mode` with `data-theme`.
- Parity of Roma is non-negotiable: identical visual/functional output; 56 goldens never re-baselined.
- Static output (`nuxt generate`), GitHub Pages under `/guiaRoma/`; offline must keep working (no CDN, motif fallback when images fail, offline map banner).
- Content stays structured data; "add a trip = add data files, no code change".
- Work only on branch `release/nuxt-4`; `main` untouched.
- GSD workflow enforcement: file changes go through `/gsd-execute-phase`.
- From MEMORY.md (user's operational rules): Node 22 for generate/Playwright/typecheck (`export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH"`); `rm -rf .data .nuxt .output` after editing content YAML before generate/gate; `use_worktrees=false`; preview the build under a `guiaRoma/` subdir; a bubble `@click` on `<a href="#slug">` is swallowed by the capture listener (nav-only anchors must be plain anchors without handlers); pragmatic parity over byte fidelity when a fix is disproportionately costly (surface cost/benefit early); D-IDs must be cited in plan `must_haves.truths` for the decision-coverage gate.

## Summary

Every shape this phase needs fits the existing architecture **additively**, and the most important finding is that the risky part (Content v3 materialization) is a non-issue: Content derives SQL columns **only from top-level schema properties** (`node_modules/@nuxt/content/dist/runtime/internal/schema.js`, `isJSONProperty` / `getPropertyType`), so `timeline` stays one JSON `TEXT` column whatever its inner union looks like. A zod probe run this session confirmed that a non-recursive design — `BaseTimelineRow` (the 5 current kinds) reused inside `ChoiceRow.options[].rows`, and `TimelineRow = discriminatedUnion([...5 kinds, ChoiceRow])` — converts with `z.toJSONSchema(..., { target: 'draft-7' })` (the exact call Content makes) to `timeline.type === 'array'`, emits **no** `$ref`/`definitions`, rejects a nested `choice`, rejects 1 option, and — only if `ChoiceRow` is a `z.strictObject` — rejects a `pace` on the choice. No superset `RowSchema` is needed for `day`.

Most of the UI work is smaller than it looks because the components already bind enum values straight into classes: `TimelineTransport.vue:49` puts `row.variant` in `:class`, and `DaySection.vue:100` puts `s.variant` in `:class`. EXT-03 is therefore **CSS + enum only**. Pace hiding is per-row (`.tl-hidden` applied by `TimelineStop`/`TimelineTransport` themselves) and summary hiding is a fixed CSS list (`body.modo-resumen .day-stats, .day-subtitle, .dia-ligera, .tl-meta, .tl-transport, .cards-list`), so a `choice` block with a new class (`.tl-choice`) is never hidden while its inner rows keep exactly their own behaviour — D-03 falls out for free if option rows go through the existing dispatcher. Map markers are derived from **all monuments of the trip** (`deriveMarkers` maps `monById.values()`), and `n` is the data field `roman`, so D-05 (cards in options keep their marker and number) needs **no** code change. The day route reads `day.cards`, not the timeline, so D-04 needs a new pure function that computes "refs that appear only inside options" and removes them from `day.cards` before `pointFor`.

Three traps would each break the gate if missed: (1) Roma's `martes` has a `.tl-transport.train` row but `base.css` has **no** `.tl-transport.train` rule — the "every enum value has a style" test must exempt `train` explicitly, never add the rule; (2) the data gate's `ref` rule scans only top-level timeline rows (`tests/data/trips.ts:298-299`), so stops inside options would go unchecked unless the gate flattens choices; (3) the Phase 10 Roma-leak trap in `tests/trips/shape.spec.ts` automatically runs on every non-Roma trip folder and flags the word `giugno` — a Campania eyebrow like «domenica · 20 giugno» turns `test:trips` red.

**Primary recommendation:** Hoist the enums (`TransportVariant`, `StatVariant`, `RouteMode`) and split `TimelineRow` into `BaseTimelineRow` + strict `ChoiceRow`; add one pure util module for timeline flattening/route logic; render `choice` with a new `TimelineChoice.vue` whose options reuse `<Timeline :rows>`; put all new CSS in a new sibling `app/assets/css/tripshapes.css` (loaded last) guarded by an allowlist test plus a build test proving none of its classes occur in Roma's HTML.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `choice`/`stays`/`route`/`family`/enum shapes | Content data (YAML) + `shared/schemas.ts` | `tests/data` gate | Schema is the single source of truth; Content does not validate `type:'data'` (#3351), the Vitest gate does |
| Cross-file invariants (`stay-ref`, `stay-dup`, refs inside options) | `tests/data/trips.ts` (`checkTrip`) | — | zod sees one file; refines are forbidden (schemas.ts:16-18) |
| Choice rendering (stacked, separator) | Frontend SSG (Vue component, prerendered) | Browser (pace state via `useTripModes`) | Static markup; visibility of inner rows is reactive per row |
| Pace / summary visibility | Browser (reactive class + global CSS) | — | Existing mechanism, unchanged |
| Day route URL + visibility | Pure util (`app/utils/dayRoute.ts`) consumed by `DaySection` (SSG) | — | Rendered at prerender time, no client-only code |
| Marker colour/popup per `PlaceType` | Pure util table (`app/utils/mapMarkers.ts`) | Browser island `LeafletMap.client.vue` | Testable in Vitest; Leaflet only on client |
| Map framing | Browser island (Leaflet `setView` + `fitBounds`) | — | Unchanged code path |
| Motif fallback drawings | Pure constant table (`app/utils/svgMotifs.ts`) | `MonumentCard` (client `@error`) | Existing pipeline |
| New variant styles | Global CSS (`tripshapes.css`, last in `css[]`) | — | No scoped CSS allowed |
| Draft isolation | Config time (`scripts/tripManifest.mjs` → `content.config.ts` exclude) | `build-isolation.spec.ts` | Existing Phase 11 mechanism; only a sentinel is new |

## Standard Stack

### Core (all already installed — no new dependency in this phase)
| Library | Version (package.json) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.4.3 | `ChoiceRow`, `TransportVariant`, `StatVariant`, `RouteMode`, `stays`, `family` | Project schema SoT [VERIFIED: package.json] |
| @nuxt/content | 3.14.0 | Collections; JSON column for `timeline`, `stays`, `route` | [VERIFIED: node_modules/@nuxt/content/dist/runtime/internal/schema.js] |
| nuxt / vue | 4.4.8 / 3.5 | `TimelineChoice.vue`, `DaySection`, `MonumentCard` changes | [VERIFIED: package.json] |
| leaflet | 1.9.4 | `nature` divIcon colour + popup | [VERIFIED: package.json] |
| vitest | 4.1.9 | unit + data gate | [VERIFIED: package.json; 301 unit + 377 data tests green this session] |
| @playwright/test | 1.61.0 | `test:trips` E2E on dev (port 5300) | [VERIFIED: package.json, playwright.trips.config.ts] |
| cheerio | ^1.2.0 (devDep) | Optional: collect class tokens of the built Roma HTML for the D-17 guard | [VERIFIED: package.json] |
| yaml | ^2.9.0 (devDep) | Node-pure YAML loading in unit tests (existing pattern) | [VERIFIED: package.json] |

**Installation:** none.

## Package Legitimacy Audit

This phase installs **no** external packages. All tooling above is already in `package.json` / `pnpm-lock`.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
content/trips/<slug>/{trip.yml, days/*.yml, monuments/*.yml}
        │  (YAML)                                   ┌──────────────────────────────┐
        ├──────────────► tests/data gate ───────────► schema.safeParse per file    │
        │                (Vitest, Node-pure)        │ checkTrip: ref (flattened),   │
        │                                           │ stay-ref, stay-dup, anchor…   │
        │                                           └──────────────────────────────┘
        ▼
scripts/tripManifest.mjs ──draft?──► content.config.ts exclude (prod) / keep (dev)
        ▼
Nuxt Content SQLite (timeline/stays/route = JSON TEXT columns)
        ▼
useTrip(slug) ─► TripView ─┬─► DaySection(day, monById, stay = stayFor(day, trip.stays))
                           │      ├─ header: «Dormís en {name}» (only if stay)
                           │      ├─ day-stats: .day-stats-item.<variant> (CSS glyph)
                           │      │    └─ route btn: routeStops(day) → capStops → buildDirUrl(points, mode)
                           │      │         hidden if routeVisible(day, n) === false (ferry / enabled:false / n<2)
                           │      ├─ <Timeline rows=day.timeline>
                           │      │     COMPONENT_BY_KIND[kind] ─► Stop/Transport/Meta/Food/Reservation
                           │      │                            └► TimelineChoice (div.tl-choice, always visible)
                           │      │                                   └─ per option: label, title, <Timeline rows=option.rows>
                           │      │                                          (inner rows keep .tl-hidden / modo-resumen rules)
                           │      └─ cards-list: MonumentCard (hero @error → motifSvg; family box if family)
                           └─► <ClientOnly> LeafletMap: deriveMarkers(monById, extras) → MARKER_STYLE[type]
                                         setView(center, zoom) → fitBounds(all markers).pad(0.1)
CSS: fonts → tokens → base → leaflet → multitrip (.trip-index only) → tripshapes (allowlisted new classes only)
```

### Recommended Project Structure (new / changed files)
```
shared/schemas.ts                     # + TransportVariant, StatVariant, RouteMode, BaseTimelineRow, ChoiceRow,
                                      #   StaySchema; Day.stay/route; Trip.stays; Monument.family; Motif +4; PlaceType +nature
app/utils/timelineRows.ts             # NEW pure: flattenRows, optionOnlyRefs, hasTransportVariant
app/utils/dayRoute.ts                 # + routeStops/routeVisible/routeTitle; buildDirUrl(points, mode='walking')
app/utils/tripStays.ts                # NEW pure: stayFor(day, stays)
app/utils/mapMarkers.ts               # + MARKER_STYLE, markerPopupHtml; MapMarker.type = PlaceType
app/utils/svgMotifs.ts                # + sea, thermal, river, trail
app/components/TimelineChoice.vue     # NEW (root <div class="tl-choice">)
app/components/Timeline.vue           # + choice entry in COMPONENT_BY_KIND
app/components/DaySection.vue         # + stay prop/line; route via new utils
app/components/TripView.vue           # passes :stay
app/components/MonumentCard.vue       # + family box
app/components/LeafletMap.client.vue  # uses MARKER_STYLE/markerPopupHtml (Roma output byte-identical)
app/assets/css/tripshapes.css         # NEW, loaded after multitrip.css
nuxt.config.ts                        # css[] + tripshapes.css (last)
content/trips/campania/**             # NEW draft skeleton
tests/unit/{timelineRows,tripStays,enumStyles,tripShapesCss}.spec.ts      # NEW
tests/unit/{dayRoute,mapMarkers,svgMotifs,multitripCss}.spec.ts           # extended/adjusted
tests/data/{schema,invariants,build-isolation}.spec.ts + trips.ts          # extended
tests/trips/campania.spec.ts                                              # NEW E2E (dev)
```

### Pattern 1: Schema — non-recursive `choice` inside the timeline (EXT-01, D-01, D-03)

Verified source values (all read this session):
- `shared/schemas.ts:36-37` — `export const Pace = z.enum(['all', 'medium', 'slow-only'])` / `export const PlaceType = z.enum(['card', 'guided', 'concert'])` [VERIFIED: shared/schemas.ts:36-37]
- `shared/schemas.ts:31-35` — `Motif = z.enum(['dome', 'pantheon', 'arch', 'fountain', 'obelisk', 'statue', 'painting', 'church', 'fortress', 'temple', 'garden', 'keyhole', 'mask', 'monument', 'rooftops', 'library', 'tower', 'stairs', 'coffee'])` [VERIFIED: shared/schemas.ts:31-35]
- `shared/schemas.ts:107` — `variant: z.enum(['taxi', 'walk', 'train']).optional(),` [VERIFIED: shared/schemas.ts:107]
- `shared/schemas.ts:155` — `variant: z.enum(['walk', 'train', 'taxi', 'metro', 'ticket']),` [VERIFIED: shared/schemas.ts:155]
- `shared/schemas.ts:92` — `export const TimelineRow = z.discriminatedUnion('kind', [` with literals `'stop'`, `'transport'`, `'meta'`, `'food'`, `'reservation'` (lines 94, 105, 113, 120, 127) [VERIFIED: shared/schemas.ts:92-130]
- `shared/schemas.ts:165` — `timeline: z.array(TimelineRow), // ORDEN EXPLÍCITO (DATA-02)` [VERIFIED]
- `tests/data/trips.ts:80` — `export const RESERVED_KEYS: ReadonlySet<string> = new Set(['id', 'meta', 'stem', 'extension', '__hash__'])` [VERIFIED] — `reserved-key` applies to **top-level** keys only (trips.ts:254-260), so nested names are technically free, but D-01 forbids `meta`/`id` anyway: the proposed shape uses `heading`, `options`, `label`, `title`, `rows` only.

Recommended shape (the 5 existing row objects are moved, not changed):

```typescript
// shared/schemas.ts — sketch. The 5 object literals are the CURRENT ones (lines 93-129), only extracted to consts.
export const TransportVariant = z.enum(['taxi', 'walk', 'train', 'ferry', 'car', 'bus', 'bike', 'plane'])
export const StatVariant = z.enum(['walk', 'train', 'taxi', 'metro', 'ticket', 'ferry', 'car', 'bus', 'bike', 'plane'])
export const RouteMode = z.enum(['walking', 'driving', 'transit'])

const StopRow = z.object({ kind: z.literal('stop'), /* …unchanged fields… */ })
const TransportRow = z.object({ kind: z.literal('transport'), pace: Pace.default('all'),
  variant: TransportVariant.optional(), /* header, modes, footnote unchanged */ })
const MetaRow = z.object({ kind: z.literal('meta'), /* … */ })
const FoodRow = z.object({ kind: z.literal('food'), /* … */ })
const ReservationRow = z.object({ kind: z.literal('reservation'), /* … */ })

const BASE_ROWS = [StopRow, TransportRow, MetaRow, FoodRow, ReservationRow] as const
export const BaseTimelineRow = z.discriminatedUnion('kind', [...BASE_ROWS])   // rows allowed inside an option

export const ChoiceOption = z.strictObject({            // strict: a typo like `timeline:` or `cards:` fails loudly
  label: z.string().min(1),                             // 'Opción A' | 'Opción 1' (free text)
  title: Md,
  rows: z.array(BaseTimelineRow).min(1),                // no 'choice' here → one level only (D-01)
})
export const ChoiceRow = z.strictObject({               // strict: rejects `pace` (D-03)
  kind: z.literal('choice'),
  heading: Md.optional(),                               // UI default «Elige una»
  options: z.array(ChoiceOption).min(2).max(3),
})
export const TimelineRow = z.discriminatedUnion('kind', [...BASE_ROWS, ChoiceRow])
export type BaseTimelineRow = z.infer<typeof BaseTimelineRow>
export type PlaceType = z.infer<typeof PlaceType>       // new type alias (needed by mapMarkers.ts)
```

Probe run this session (`zod@4.4.3` from the repo's node_modules, same `toJSONSchema(…, { target: 'draft-7', unrepresentable: 'any' })` call as `node_modules/@nuxt/content/dist/chunks/zod4.mjs:6-9`):
```
timeline type: array | route: object | stay: string | has definitions: false | $ref in str: false
valid choice: true {"kind":"stop","pace":"all","time":"1","title":"b"}      ← defaults still applied inside options
nested choice rejected: true
choice with pace rejected (strict): true ✖ Unrecognized key: "pace"
1 option rejected: true
```
[VERIFIED: probe in scratchpad against node_modules/zod]

Why no superset `RowSchema` is needed: Content builds columns from `Object.values(schema.definitions)[0].properties` only, and `isJSONProperty` returns true for `type === 'array'` → `timeline` is one JSON `TEXT` column whatever its items are [VERIFIED: node_modules/@nuxt/content/dist/runtime/internal/schema.js `getOrderedSchemaKeys`, `isJSONProperty`, `describeProperty`]. The `ArtistRowSchema`/`ReferenceRowSchema` workaround (schemas.ts:233-256, 297-332) exists only because those unions are at the **collection root**. New top-level fields map as: `day.stay` → VARCHAR (nullable), `day.route` → JSON TEXT, `trip.stays` → JSON TEXT, `monument.family` → VARCHAR.

**Important zod-4 behaviour:** `z.object` strips unknown keys silently. Without `strictObject`, `pace: medium` on a `choice` would be dropped, not rejected, contradicting D-03. The data gate's `unknown-key` rule only checks top-level keys (trips.ts:254-260), so it would not catch it either. [VERIFIED: probe + trips.ts]

### Pattern 2: Pure timeline helpers (used by the route AND the data gate)

```typescript
// app/utils/timelineRows.ts — pure, auto-imported, Vitest-plain (same convention as pace.ts/dayRoute.ts)
import type { Day, BaseTimelineRow } from '~~/shared/schemas'
type Row = Day['timeline'][number]

/** Top-level rows plus the rows of every option, in data order (choice rows themselves excluded). */
export function flattenRows(rows: Row[]): BaseTimelineRow[] {
  return rows.flatMap(r => (r.kind === 'choice' ? r.options.flatMap(o => o.rows) : [r]))
}
/** Stop refs that appear ONLY inside options (a ref also used in a shared row is not excluded). */
export function optionOnlyRefs(rows: Row[]): Set<string> {
  const shared = new Set<string>(); const inOptions = new Set<string>()
  for (const r of rows) {
    if (r.kind === 'stop' && r.ref) shared.add(r.ref)
    if (r.kind === 'choice') for (const o of r.options) for (const x of o.rows) if (x.kind === 'stop' && x.ref) inOptions.add(x.ref)
  }
  return new Set([...inOptions].filter(ref => !shared.has(ref)))
}
export function hasTransportVariant(rows: Row[], variant: string): boolean {
  return flattenRows(rows).some(r => r.kind === 'transport' && r.variant === variant)
}
```
The data gate (`tests/data/trips.ts:298`) must iterate `flattenRows`-equivalent rows (it already imports from `app/utils/tripLayout`, so importing a pure util is an established pattern) — otherwise a broken `ref` inside an option passes the gate.

### Pattern 3: Day route by mode + exclusion (EXT-06, D-04, D-14)

Current code [VERIFIED: app/utils/dayRoute.ts:77-85, app/components/DaySection.vue:66-72, 108-115]:
- `let url = 'https://www.google.com/maps/dir/?api=1&travelmode=walking'` (dayRoute.ts:79)
- `points = props.day.cards.map(slug => props.monById.get(slug)).filter((m): m is Monument => !!m).map(pointFor)` (DaySection.vue:66-71)
- `<a v-if="points.length >= 2" class="day-route-btn" :href="routeHref" target="_blank" rel="noopener" title="Abre Google Maps con el recorrido del día a pie">{{ routeLabel(points.length) }}</a>` (DaySection.vue:108-115)

Recommendation:
```typescript
// app/utils/dayRoute.ts additions (capStops/routeLabel/pointFor/MAX_ROUTE_STOPS untouched)
export type RouteMode = 'walking' | 'driving' | 'transit'
export function buildDirUrl(points: string[], mode: RouteMode = 'walking'): string {
  const enc = encodeURIComponent
  let url = 'https://www.google.com/maps/dir/?api=1&travelmode=' + mode   // walking → byte-identical to today
    + '&origin=' + enc(points[0]!) + '&destination=' + enc(points[points.length - 1]!)
  const waypoints = points.slice(1, -1)
  if (waypoints.length) url += '&waypoints=' + waypoints.map(enc).join('|')
  return url
}
/** day.cards in data order, minus option-only refs (D-04). Roma has no choice → identical to today. */
export function routeCards(day: Pick<Day, 'cards' | 'timeline'>): string[] {
  const excluded = optionOnlyRefs(day.timeline)
  return day.cards.filter(slug => !excluded.has(slug))
}
/** D-14 precedence: enabled:false hides; enabled:true overrides the ferry auto-hide; never with < 2 stops. */
export function routeVisible(day: Pick<Day, 'timeline' | 'route'>, stopCount: number): boolean {
  if (stopCount < 2) return false
  if (day.route?.enabled === false) return false
  if (day.route?.enabled === true) return true
  return !hasTransportVariant(day.timeline, 'ferry')
}
const TITLE: Record<RouteMode, string> = {
  walking: 'Abre Google Maps con el recorrido del día a pie',             // verbatim DaySection.vue:114
  driving: 'Abre Google Maps con el recorrido del día en coche',
  transit: 'Abre Google Maps con el recorrido del día en transporte público',
}
export const routeTitle = (mode: RouteMode = 'walking') => TITLE[mode]
```
`DaySection` then computes `points = routeCards(day).map(monById.get).filter(...).map(pointFor)`, `v-if="routeVisible(day, points.length)"`, `:href="buildDirUrl(capStops(points), day.route?.mode)"`, `:title="routeTitle(day.route?.mode)"`.

Google Maps URLs `travelmode` accepts `driving`, `walking`, `bicycling`, `two-wheeler`, `transit`; waypoints are `|`-separated, up to 3 on mobile browsers and 9 otherwise, and "Waypoints are not supported on all Google Maps products; in those cases this parameter will be ignored." [CITED: developers.google.com/maps/documentation/urls/get-started]. The `capStops` cap of 10 (8 waypoints) is unchanged per D-14.

### Pattern 4: «Dormís en…» (EXT-02, D-06, D-07)

`DaySection` header today [VERIFIED: DaySection.vue:83-93]: `div.day-header` > `div.day-number` + `<div>` wrapping `<h2>{{ day.title }}</h2>` and `div.day-subtitle`. `TripView` mounts `<DaySection v-if="e.day" :day="e.day" :mon-by-id="monById" />` inside `<section v-else-if="e.kind === 'day'" :id="e.id">` [VERIFIED: TripView.vue:163-171].

Recommendation: pure `stayFor(day, stays)` in `app/utils/tripStays.ts` (returns the stay object or `undefined`); `TripView` passes `:stay="stayFor(e.day, trip?.stays)"`; `DaySection` adds an optional prop and renders, inside the inner header `<div>` **after** `<h2>` and **before** `.day-subtitle`:
```vue
<div v-if="stay" class="day-stay">Dormís en <MDC :value="stay.name" :tag="false" unwrap="p" /></div>
```
Keep it a **separate** class, not part of `.day-subtitle`: `body.modo-resumen .day-subtitle` is hidden [VERIFIED: leaflet.css:794], and "where you sleep" is useful in the summary view. Roma: `stay` undefined → Vue SSR emits only an empty `<!---->` placeholder. No parity spec compares raw HTML (grep for `innerHTML|outerHTML|page.content()` in `tests/parity/*.ts` returned nothing) and comment nodes are not rendered, so goldens are unaffected [VERIFIED: grep this session].

Schema: `StaySchema = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), name: Md, area: z.string().optional(), coords: Coords.optional(), note: Md.optional() })`; `TripSchema.stays: z.array(StaySchema).optional()`; `DaySchema.stay: z.string().optional()`. Gate: add `'stay-ref'` and `'stay-dup'` to `RULES` (trips.ts:84-88); `stay-ref` must also fire when a day has `stay` and the trip has no `stays` at all.

### Pattern 5: New transport/stat variants are CSS-only (EXT-03, D-09)

Verified current rules [VERIFIED: app/assets/css/base.css:386-390, 515-518]:
```
.day-stats-item.walk::before { content: "🚶"; }
.day-stats-item.metro::before { content: "🚇"; }
.day-stats-item.taxi::before { content: "🚕"; }
.day-stats-item.train::before { content: "🚆"; }
.day-stats-item.ticket::before { content: "🎟️"; }
.tl-transport.metro { background: color-mix(in srgb, #d4801a 10%, transparent); border-left-color: #d4801a; }
.tl-transport.metro-b { background: color-mix(in srgb, #2c5aa0 10%, transparent); border-left-color: #2c5aa0; }
.tl-transport.taxi { background: color-mix(in srgb, #5a7a3a 10%, transparent); border-left-color: #5a7a3a; }
.tl-transport.walk { background: color-mix(in srgb, var(--gold) 6%, transparent); border-left-color: var(--gold-soft); }
```
Glyphs for transport rows today come from **data** (`mode.icon`, rendered by `TimelineTransport.vue:62`); the `.tl-transport.<v>` rules are colour band only. Both components already bind the enum value as a class (`TimelineTransport.vue:47-50` `:class="[row.variant, { 'tl-hidden': !isVisible(row.pace) }]"`; `DaySection.vue:96-101` `:class="s.variant"`), so **no component change** is needed for EXT-03.

Recommended `tripshapes.css` (colours: existing hexes already used in base.css or tokens via `color-mix`; the background is a translucent mix, so it adapts to both themes like the existing variants):
```css
.tl-transport.ferry { background: color-mix(in srgb, #2c5aa0 10%, transparent); border-left-color: #2c5aa0; }
.tl-transport.car   { background: color-mix(in srgb, var(--accent) 8%, transparent); border-left-color: var(--accent); }
.tl-transport.bus   { background: color-mix(in srgb, #d4801a 10%, transparent); border-left-color: #d4801a; }
.tl-transport.bike  { background: color-mix(in srgb, #5a7a3a 8%, transparent); border-left-color: color-mix(in srgb, #5a7a3a 70%, var(--gold)); }
.tl-transport.plane { background: color-mix(in srgb, var(--ink) 6%, transparent); border-left-color: var(--ink-faint); }
.tl-transport.ferry .tl-transport-header::before { content: "⛴️ "; }
.tl-transport.car .tl-transport-header::before { content: "🚗 "; }
.tl-transport.bus .tl-transport-header::before { content: "🚌 "; }
.tl-transport.bike .tl-transport-header::before { content: "🚲 "; }
.tl-transport.plane .tl-transport-header::before { content: "✈️ "; }
.day-stats-item.ferry::before { content: "⛴️"; }
.day-stats-item.car::before { content: "🚗"; }
.day-stats-item.bus::before { content: "🚌"; }
.day-stats-item.bike::before { content: "🚲"; }
.day-stats-item.plane::before { content: "✈️"; }
```
(Exact hues/glyphs are Claude's discretion; `ferry` reuses the `metro-b` blue and `bus` the `metro` orange only as suggestions — a distinct palette is fine. `.day-stats-item::before` base sizing already exists at base.css:382-385.) [ASSUMED: aesthetic choice]

### Pattern 6: Marker style table + popup extraction (EXT-04, D-11, H18)

Current code [VERIFIED: LeafletMap.client.vue:105-108, 124-134; mapMarkers.ts:36]:
- `let bgColor = '#8b3a3a' // card (default)` / `if (m.type === 'guided') bgColor = '#a07c4a'` / `if (m.type === 'concert') bgColor = '#5a7a3a'`
- guided: `` `<strong>${m.name}</strong><br><em style="color:#a07c4a">${m.day}</em><br><span style="color:#5c534a;font-size:.85rem">Visita con guía humano</span>` ``
- concert: `` `<strong>${m.name}</strong><br><em style="color:#5a7a3a">${m.day}</em><br><a href="#${m.id}" style="color:#5a7a3a">Abrir ficha →</a>` ``
- card: `` `<strong>${m.name}</strong><br><em style="color:#a07c4a">${m.day}</em><br><a href="#${m.id}" style="color:#8b3a3a">Abrir ficha →</a>` ``
- `MapMarker.type: 'card' | 'guided' | 'concert'` (mapMarkers.ts:36) — **hard-coded union: widening `PlaceType` breaks `nuxi typecheck`** at LeafletMap.client.vue:101 (`type: e.type`) unless this becomes `PlaceType`.

Recommendation: move the colours and the three popup templates verbatim into `app/utils/mapMarkers.ts` as `MARKER_STYLE: Record<PlaceType, { bg: string }>` + `markerPopupHtml(m: MapMarker): string`, add `nature` (e.g. bg `#2f6f73`, popup = card template with its own colour and the plain `<a href="#slug">` anchor — **no click handler**, per the CR-01 landmine documented at LeafletMap.client.vue:28-33), and pin the three Roma strings in `tests/unit/mapMarkers.spec.ts` byte-for-byte. `Record<PlaceType, …>` makes "every PlaceType has a style" a compile-time **and** test-time guarantee. Marker numbering is the data field `roman` (`n: m.roman`, mapMarkers.ts:47) and markers come from **all** monuments (`[...monById.values()]`, mapMarkers.ts:45) — placing a card inside an option changes neither presence nor number (D-05 holds with zero code). [VERIFIED]

Optional hardening (not a locked decision): escape `& < > "` in `name`/`day` before interpolating into popup HTML. Roma's 38 names + the Coliseo extra contain only `'` among HTML-special characters (verified by grep this session: «Campo de' Fiori», «Castel Sant'Angelo · Ponte», …), so escaping only `& < > "` keeps Roma's popup strings byte-identical.

### Pattern 7: «Con niños» box (EXT-07, D-12)

`MonumentCard` order today [VERIFIED: MonumentCard.vue:293-381]: `.maps-link` → `.sorrentino-box` (v-if, :300-310) → then either `notes-area` + `culture-box` (`boxOrder === 'notes-first'`, :319) or `culture-box` + `notes-area`. Recommended single consistent position: **immediately after the `.sorrentino-box` block and before the `<template v-if="monument.boxOrder …">` pair**, so it is not duplicated across the two branches:
```vue
<div v-if="monument.family" class="culture-box family-box">
  <span class="label">Con niños</span>
  <MDC :value="monument.family" :tag="false" unwrap="p" />
</div>
```
Reusing `culture-box` as a base class inherits `.culture-box` / `.culture-box .label` (base.css:929-947) — "derived from `.culture-box`" — and `tripshapes.css` only adds the variant: e.g. `.family-box { background: color-mix(in srgb, #5a7a3a 7%, transparent); border-left-color: #5a7a3a; } .family-box .label { color: color-mix(in srgb, #5a7a3a 75%, var(--ink)); }` (the `var(--ink)` mix keeps the label legible on the dark theme without a `[data-theme]` selector). Search: optionally append `m.family` to `buildHaystack` (searchIndex.ts:54-63) only when present → Roma haystacks unchanged. [VERIFIED code positions; colours ASSUMED/discretion]

### Pattern 8: `TimelineChoice.vue` (EXT-01, D-02, D-03)

Dispatcher today [VERIFIED: Timeline.vue:36-53]:
```
const COMPONENT_BY_KIND = {
  stop: resolveComponent('TimelineStop'),
  transport: resolveComponent('TimelineTransport'),
  meta: resolveComponent('TimelineMeta'),
  food: resolveComponent('TimelineFood'),
  reservation: resolveComponent('TimelineReservation'),
} as const
…
<div class="timeline"><component :is="COMPONENT_BY_KIND[row.kind]" v-for="(row, i) in rows" :key="i" :row="row" /></div>
```
Add `choice: resolveComponent('TimelineChoice')` (must use `resolveComponent`, a raw string in `:is` renders an empty element — Timeline.vue:11-20). `TimelineChoice.vue` sketch:
```vue
<script setup lang="ts">
import type { Day } from '~~/shared/schemas'
type ChoiceRow = Extract<Day['timeline'][number], { kind: 'choice' }>
defineProps<{ row: ChoiceRow }>()
</script>
<template>
  <div class="tl-choice">                                   <!-- div, NEVER section (scrollspy, D-02/H25) -->
    <div class="tl-choice-heading"><MDC v-if="row.heading" :value="row.heading" :tag="false" unwrap="p" /><template v-else>Elige una</template></div>
    <template v-for="(opt, i) in row.options" :key="i">
      <div v-if="i > 0" class="tl-choice-sep">— o bien —</div>
      <div class="tl-choice-option">
        <div class="tl-choice-label">{{ opt.label }}</div>
        <div class="tl-choice-title"><MDC :value="opt.title" :tag="false" unwrap="p" /></div>
        <Timeline :rows="opt.rows" />                       <!-- reuse the dispatcher: inner rows keep pace/summary -->
      </div>
    </template>
  </div>
</template>
```
Why D-03 holds by construction:
- Pace: hiding is per row, inside `TimelineStop`/`TimelineTransport` (`.tl-hidden` → `display: none !important`, leaflet.css:731-733); the dispatcher never filters (Timeline.vue:22-23). The choice block has no `pace` and no `data-pace`, so nothing hides it; labels/titles live outside the inner rows, so they remain when every inner row is hidden.
- Summary: the only summary rules are `body.modo-resumen .day-stats, .day-subtitle, .dia-ligera, .tl-meta, .tl-transport, .cards-list { display: none !important; }` [VERIFIED: leaflet.css:793-798]. `.tl-choice*` is not in the list → always visible; inner `.tl-transport`/`.tl-meta` get hidden exactly like top-level ones.
- Light mode only sets body classes and forces `pace = 'slow'` (useTripModes.ts:88-90) → inner rows obey the pace matrix; labels stay.
- Scrollspy reads `document.querySelectorAll('section')` [VERIFIED: useCardNavigation.ts:164] — a `<div>` root is mandatory.

Nested `<Timeline>` creates an inner `div.timeline`, which gets `padding-left: 1.75rem; margin-top: 2rem` and its own vertical line (`.timeline::before`, base.css:416-423). Tune only under `.tl-choice` in `tripshapes.css` (e.g. `.tl-choice .timeline { margin-top: .75rem; }`). `.tl-item::before` dots are positioned at `left: -1.55rem` relative to each item, so inner dots sit on the inner line — consistent visually.

### Anti-Patterns to Avoid
- **`z.lazy` recursive `TimelineRow`:** unnecessary (one level only) and risks `$ref` output; Content's wrapper keeps only `properties`, and a `toJSONSchema` throw makes Content fall back to an **empty** properties object (zod4.mjs catch branch) — every column of `day` would vanish.
- **`<section>` anywhere in the new markup** (scrollspy).
- **Adding `.tl-transport.train`** "to complete" the enum styles (changes Roma's `martes` golden — see Pitfall 1).
- **Editing `Timeline.vue`'s wrapper or iteration** (DOM/comment markers of all of Roma); only add the map entry.
- **A `[data-theme]` selector in new CSS** — the Phase 11 rule: dark theme only through tokens.
- **Click handlers on popup/option anchors** (CR-01 bubble-click swallow).
- **Putting the route mode in `trip.yml`** — D-14 says per day.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recursion/one-level check | Custom validator for "no choice in option" | Two discriminated unions (`BaseTimelineRow` excludes `choice`) | Rejected by construction; verified probe |
| Rejecting `pace` on choice | Gate rule | `z.strictObject` | Field-level, file-level error message from zod |
| Option-row rendering | Duplicate leaf components | Nested `<Timeline :rows>` | D-02 reuse; inner rows inherit pace/summary behaviour |
| Mode/title strings scattered in template | Inline ternaries in `DaySection` | `routeTitle`/`buildDirUrl` in `dayRoute.ts` | Unit-testable, Roma byte-identity pinned |
| Marker colour if/else chain | More `if (m.type === …)` | `MARKER_STYLE: Record<PlaceType, …>` | Exhaustiveness checked by TS + test |
| CSS selector parsing for guards | New parser | Reuse `cssSelectors()` exported by `tests/unit/multitripCss.spec.ts` (move it to a tiny shared helper, e.g. `tests/unit/cssSelectors.ts`, because importing a `.spec.ts` re-registers its suites — as noted in romaChromeGuard.spec.ts) | Already has teeth tests |
| Class-token extraction from built HTML | Regex soup | `cheerio` (devDep) or the simple `class="…"` split used this session | Robust |

**Key insight:** almost every new behaviour is the existing mechanism fed with new data; the work that is genuinely new is (a) the choice block markup, (b) one pure route/flatten module, (c) 4 SVG drawings, (d) ~25 CSS rules and their guards.

## Runtime State Inventory

Not a rename/refactor phase. One runtime-state item is relevant anyway:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Nuxt Content cache `.data/` (SQLite) and `.nuxt/` hold the old schema/columns; new fields (`stay`, `route`, `stays`, `family`) would come out `null`/stale | `rm -rf .data .nuxt .output` before every generate and before `test:trips` (MEMORY.md rule; `pnpm verify` already does it) |
| Live service config | None — verified (static site, no services) | none |
| OS-registered state | None — verified | none |
| Secrets/env vars | None (`NUXT_APP_BASE_URL` unchanged) | none |
| Build artifacts | `.output/public` from 2026-11-20 exists (used this session read-only to check class collisions) | regenerated by `pnpm verify` |
| Browser state | localStorage keys `roma-pace`/`roma-light`/`roma-resumen`/`roma-note-*`; Campania would use `campania-*` (tripStorageKey) | none (no new keys) |

## Common Pitfalls

### Pitfall 1: `train` transport variant has no CSS rule, and Roma uses it
**What goes wrong:** An "every enum value has a style" test fails for `train`, and the "obvious fix" (adding `.tl-transport.train {…}`) restyles Roma's `martes` transport row → golden diff.
**Why:** base.css defines `.tl-transport.metro/.metro-b/.taxi/.walk` only (515-518); `content/trips/roma/days/martes.yml:299-301` has `kind: transport` / `variant: train`. [VERIFIED]
**How to avoid:** the enum→CSS test uses an explicit, commented `PARITY_EXEMPT_TRANSPORT = ['train']` (Roma renders the base `.tl-transport` style by design) and asserts the exemption list is exactly that. All 5 stats values already have rules.
**Warning signs:** any diff touching `.tl-transport.train`.

### Pitfall 2: zod 4 silently strips unknown keys
**What goes wrong:** `pace: medium` on a `choice`, or `cards:` inside an option, is dropped without error.
**How to avoid:** `z.strictObject` for `ChoiceRow` and `ChoiceOption` (verified rejection message `Unrecognized key: "pace"`). Add schema tests for both.

### Pitfall 3: The data gate does not look inside options
**What goes wrong:** `tests/data/trips.ts:298-299` iterates `asArray(d.data.timeline)` and checks `row.kind === 'stop'`/`'food'` only at top level — a misspelled `ref` inside an option passes. [VERIFIED]
**How to avoid:** flatten choices in the `ref` rule; add a teeth test (`ref` inside option → violation naming the day file). The `anchor` and `cross-trip-link` rules already recurse via `collectStrings` (trips.ts:200-205), so Markdown links in `heading`/`title`/`family`/`stays[].name` are covered automatically.

### Pitfall 4: Roma-leak trap on Campania text (`giugno`, `Pay`…)
**What goes wrong:** `tests/trips/shape.spec.ts:202` builds `NON_ROMA_TRIPS` from `readdirSync(content/trips)`, so Campania is trapped automatically; `ROMA_MARKERS = ['Roma', 'Einaudi', 'giugno', 'MMXXVI', 'Pay', 'Fellini', 'Royal Court']` [VERIFIED: tests/trips/romaLeaks.ts:22]. An Italian eyebrow «domenica · 20 giugno» fails it; the list must never be edited ("NUNCA se quita una palabra de esta lista", romaLeaks.ts:5-8).
**How to avoid:** Spanish eyebrows like forma's (`'sábado · 19 de septiembre'`) — e.g. `'domingo · 20 de junio'`; no «Roma» anywhere (e.g. "como en Roma"). Flag for Phase 13: a June trip in Italian will collide with `giugno` (see Open Questions).

### Pitfall 5: `<section>` in new markup
Scrollspy takes every `<section>` (useCardNavigation.ts:164). Use `<div>` roots everywhere.

### Pitfall 6: Stale Content cache
After schema/YAML edits, new fields render `null` and goldens come out "unchanged" for the wrong reason. Always `rm -rf .data .nuxt .output` (generate) or `rm -rf .data .nuxt` (test:trips).

### Pitfall 7: `MapMarker.type` hard-coded union
`type: 'card' | 'guided' | 'concert'` (mapMarkers.ts:36) breaks typecheck once `PlaceType` gains `nature`. Switch to `PlaceType` (new `export type PlaceType`).

### Pitfall 8: SVG `id` collisions between motifs
Each motif defines gradients with ids (`sk_d`, `st_d`, `sk_p`, `tc_f`, `kmask`, …). Two different motifs on the same page with the same id make the second one paint with the first one's gradient. Existing ids are unique (verified list below). New motifs need new ids (e.g. `sk_se`, `wa_se`, `sk_th`, `sk_rv`, `sk_tr`) and a unit test "all `id="…"` across `SVG_MOTIFS` are unique".

### Pitfall 9: The Phase 11 CSS-order assertion
`tests/unit/multitripCss.spec.ts:114-115` asserts `css[]` is exactly `['fonts.css', 'tokens.css', 'base.css', 'leaflet.css', 'multitrip.css']` [VERIFIED]. Adding `tripshapes.css` requires updating that expectation (unit test, allowed) — keep the `.trip-index` guard for `multitrip.css` unchanged, and add the new guard for the new file.

### Pitfall 10: `day-order` / `day-pill` rules on a partial skeleton
`order` must be contiguous 1..N (trips.ts day-order rule), so the 3 skeleton days are `order: 1, 2, 3` even though their dates are 20/24/25; `pill` must be unique (`'Dom 20'`, `'Jue 24'`, `'Vie 25'`).

### Pitfall 11: `enabled: true` vs `< 2` stops
Forcing the button cannot produce a valid URL with 0/1 stop; keep `< 2 → hidden` above the override (D-04 explicitly says fewer than 2 → no button).

### Pitfall 12: Recursive component import Timeline ⇄ TimelineChoice
`Timeline.vue` resolves `TimelineChoice`, which renders `<Timeline>`. ES-module cycles between SFCs are normally fine (definitions are used at render time, not at module evaluation), but this is unverified in this repo. Verify early with `pnpm typecheck` + a dev render of the Campania choice day; fallback: `defineAsyncComponent(() => import('./Timeline.vue'))` inside `TimelineChoice`. [ASSUMED]

### Pitfall 13: Popup HTML injection
`bindPopup(popupHtml)` interpolates `name`/`day` raw. Campania names are repo-authored (trusted), but a `&`/`<` breaks markup. See Pattern 6 hardening (Roma byte-identical).

### Pitfall 14: Placeholder heroes that do load
To exercise the motif fallback deterministically, use `hero.src: https://example.invalid/campania/<slug>.jpg` (forma's convention) — `test:trips` also aborts every off-origin request (`blockExternal`, shape.spec.ts).

### Pitfall 15: `«Dormís en»` inside `.day-subtitle`
It would vanish in summary mode (leaflet.css:794). Use its own `.day-stay` class.

### Pitfall 16: Never `test:trips` concurrently with generate/verify
Both write `.nuxt/` and `.data/` (playwright.trips.config.ts header). Run sequentially; Node 22 in PATH.

## Code Examples

### Data gate additions (`tests/data/trips.ts`)
```typescript
// RULES: …existing 18…, 'stay-ref', 'stay-dup'
const tripDoc = tripDocs[0]
const stays = asArray(tripDoc?.data.stays)
const staySlugs = new Map<string, number>()
for (const s of stays) staySlugs.set(String(s.slug), (staySlugs.get(String(s.slug)) ?? 0) + 1)
for (const [slug, n] of staySlugs) if (n > 1) push(tripDoc!.file, 'stay-dup', `stay "${slug}" duplicado en stays`)
for (const d of days) {
  if (typeof d.data.stay === 'string' && !staySlugs.has(d.data.stay)) {
    push(d.file, 'stay-ref', `stay "${d.data.stay}" no existe en trip.yml stays`)
  }
}
// ref rule: iterate top-level rows AND choice option rows
const rowsOf = (tl: unknown) => asArray(tl).flatMap(r => r.kind === 'choice'
  ? asArray(r.options).flatMap(o => asArray(o.rows)) : [r])
```

### Enum → style test (`tests/unit/enumStyles.spec.ts`)
```typescript
import { readFileSync } from 'node:fs'
import { TransportVariant, StatVariant, Motif, PlaceType } from '../../shared/schemas'
import { SVG_MOTIFS } from '../../app/utils/svgMotifs'
import { MARKER_STYLE } from '../../app/utils/mapMarkers'
import { cssSelectors } from './cssSelectors'           // helper extracted from multitripCss.spec.ts

const CSS = ['base.css', 'leaflet.css', 'tripshapes.css']
  .flatMap(f => cssSelectors(readFileSync(`app/assets/css/${f}`, 'utf8')))
const PARITY_EXEMPT_TRANSPORT = ['train']               // Roma martes renders base .tl-transport (no rule)

it.each(TransportVariant.options.filter(v => !PARITY_EXEMPT_TRANSPORT.includes(v)))(
  '.tl-transport.%s has a rule', v => expect(CSS).toContain(`.tl-transport.${v}`))
it.each(StatVariant.options)('.day-stats-item.%s::before has a glyph', v =>
  expect(CSS).toContain(`.day-stats-item.${v}::before`))
it.each(Motif.options)('motif %s has an SVG', m => expect(SVG_MOTIFS[m]?.startsWith('<svg')).toBe(true))
it.each(PlaceType.options)('PlaceType %s has a marker style', t => expect(MARKER_STYLE[t]).toBeDefined())
it('the exemption list is exactly [train]', () => expect(PARITY_EXEMPT_TRANSPORT).toEqual(['train']))
```

### D-17 CSS guard (`tests/unit/tripShapesCss.spec.ts` + build half in `tests/data/`)
```typescript
// Every selector of tripshapes.css must contain at least one class from NEW_CLASSES, and must not use
// functional pseudo-classes that could escape the requirement, nor root/theme selectors.
export const NEW_CLASSES = ['tl-choice', 'tl-choice-heading', 'tl-choice-sep', 'tl-choice-option',
  'tl-choice-label', 'tl-choice-title', 'day-stay', 'family-box',
  'ferry', 'car', 'bus', 'bike', 'plane'] as const
const classTokens = (sel: string) => [...sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m => m[1])
export function offending(css: string): string[] {
  return cssSelectors(css).filter(s =>
    !classTokens(s).some(c => (NEW_CLASSES as readonly string[]).includes(c))
    || /:(not|is|where|has)\(/.test(s) || s.includes(':root') || s.includes('[data-theme') || /^(html|body)\b/.test(s))
}
// Build half (skipIf no .output, runs inside `pnpm verify` after generate):
// for every *.html in .output/public (trips/roma/index.html, index.html, 200.html, 404.html) collect class
// tokens from class="…" and assert NEW_CLASSES ∩ tokens = ∅  (+ positive control: 'tl-transport' IS present in Roma).
```
Logic: in a descendant/compound selector every compound must match, so a selector that requires a class Roma never emits can never match Roma's DOM. Checked this session against the existing build: `.output/public/trips/roma/index.html` has 166 class tokens and none of `ferry, car, bus, bike, plane, nature, tl-choice, day-stay, family-box, choice, stay, family, sea, thermal, river, trail` [VERIFIED: node script on .output/public, build of 2026-11-20]. Token matching must be whole-token (`car` vs `card`).

### Map framing E2E (`tests/trips/campania.spec.ts`)
```typescript
// Leaflet keeps out-of-view markers in the DOM but positions them outside the (overflow:hidden) container,
// so "inside the visible bounds" == marker box inside #leaflet-map box. No access to the L.Map instance needed.
await page.locator('[id="mapa"]').scrollIntoViewIfNeeded()
await expect(page.locator('#leaflet-map .custom-marker')).toHaveCount(EXPECTED_MARKERS)
for (const roman of ['I', 'II', 'III', 'IV']) {             // Naples, Procida, Ischia, Salerno cards
  await expect.poll(async () => {                           // waits past setTimeout(invalidateSize, 300)
    const map = (await page.locator('#leaflet-map').boundingBox())!
    const mk = (await page.locator('#leaflet-map .custom-marker').filter({ hasText: new RegExp(`^${roman}$`) }).boundingBox())!
    return mk.x >= map.x && mk.y >= map.y && mk.x + mk.width <= map.x + map.width && mk.y + mk.height <= map.y + map.height
  }).toBe(true)
}
```
Roma's view: code path unchanged (LeafletMap.client.vue:66-67 `setView`, :138 `fitBounds(...).pad(0.1)`); already covered by `tests/parity/map-fallback-notes.spec.ts:194` (`toHaveCount(39)`) and the goldens.

## Motif pipeline and effort (D-10)

[VERIFIED: app/utils/svgMotifs.ts; measured with a node script this session]
- Table: `export const SVG_MOTIFS: Record<string, string> = {` (svgMotifs.ts:30); lookup `motifSvg(motif)` returns `SVG_MOTIFS[motif]` or `undefined`. Consumers: `MonumentCard` hero `@error` → `<span v-else v-html="motifSvg(monument.motif)" />` (MonumentCard.vue:245, the one existing trusted-constant `v-html`, comment T-07-06) and `DetailPhoto.global.vue` via `inject('monumentMotif')`.
- Style is **flat filled shapes, not strokes**: every SVG is `viewBox="0 0 800 280" preserveAspectRatio="xMidYMid slice"`, a vertical sky gradient `#f5edd9 → #e8d8b5`, earth/stone palette `#c4a373 #8b6c43 #5a4226 #a07c4a #d4c4a0 #fbf7f0`, accent `#b85c5c #8b3a3a #5a7a3a`, a `<g opacity=".9">` group; strokes appear only as details (0–5 `stroke=` per motif).
- Sizes: 852–1,481 chars each (library 3,252). Ids: `sk_d,st_d · sk_p,st_p · sk_a · sk_f,tc_f · sk_o,st_o · sk_s,st_s · tc_pa · sk_ch · sk_fo,st_fo,tc_fo · sk_t,st_t · sk_g · sk_k,kmask · sk_m,st_m · sk_mo · sk_r · (library none) · sk_tw · sk_st · sk_co` — all unique.
- Dark theme needs nothing: `[data-theme="dark"] .card-hero { filter: brightness(.7) saturate(.85); }` (base.css:739-741) applies to the SVG too; `.card-hero svg` sizing (base.css:725-731) and `slice` cropping mean the subject must stay roughly within x 200–600.
- Existing test that enumerates motifs: `tests/unit/svgMotifs.spec.ts:23-35` hard-codes 19 keys and `toBe(19)` — must be rewritten to derive from `Motif.options` (23) (unit test; editing allowed).
- Effort estimate: 4 drawings × ~1–1.5 KB each, ~30–60 min each including a visual check in light/dark at 220px and 280px hero heights → **≈2–4 h total**, one plan task. [ASSUMED: estimate]
- Suggested compositions (discretion): `sea` — sky, sea band with 3–4 wave paths, pale cove/pebbles foreground; `thermal` — rock basin ellipse with water, 3 steam curls (light `stroke`), dark rocks; `river` — banks, water band, a stone arch bridge (reuse the `arch` vocabulary); `trail` — layered mountains in `#a07c4a/#8b6c43`, a winding path, a small cairn.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `travelmode=walking` hard-coded | `buildDirUrl(points, mode='walking')` | this phase | Roma URL byte-identical (default) |
| Marker colours in component if/else | `MARKER_STYLE` table in pure util | this phase (H18) | Exhaustive per `PlaceType` |
| Hard-coded motif count test (19) | Derived from `Motif.options` | this phase | No drift when enums grow |

**Deprecated/outdated:** `import { z } from '@nuxt/content'` (still forbidden; schemas.ts:15).

## Campania skeleton (D-15) — concrete shape

- Folder name `campania` matches `TRIP_FOLDER_RE = /^[a-z0-9]+$/` (tripManifest.mjs:23) [VERIFIED]. `draft: true` → excluded from all 6 collections outside `nuxi dev` (`keepDrafts = process.env.NODE_ENV === 'development'`, content.config.ts:37-38) and from prerender routes (`prerenderRoutes`, tripManifest.mjs:76-78) [VERIFIED]. Data gate covers drafts automatically: `describe.each(listTripDirs())` in schema.spec.ts:44 and invariants.spec.ts:59 [VERIFIED]. The parity `portada.spec.ts` 404 check iterates manifest drafts (Campania included automatically); `tests/trips/portada.spec.ts:29` has a hard-coded `DRAFTS = ['prueba', 'forma']` (optional to extend).
- `trip.yml` (required by TripSchema: `slug, title, decoration, heroMeta, quote, quoteAttr, infoCards, howTo, map`) + `draft: true`, `pageTitle`, `brand`, `footer`, optional `mapLegend`, and `stays: [napoles, procida, ischia, salerno]`. Put a sentinel `CAMPANIA-CENTINELA-12A` in `howTo` (mirror of `FORMA-CENTINELA-10A`).
- Days (orders 1..3): `domingo-20` (ferry + bike transport rows, stats `ferry`/`bike`, `stay: procida`, ≥2 cards so that the hide is caused by the ferry rule, not by `< 2`); `jueves-24` (shared rows + `choice` A/B, `stay: salerno`, ≥2 shared cards + 1 card only in option A + 1 only in option B → route shows exactly the shared count, proving D-04); `viernes-25` (`route: { mode: driving }`, car transport row, ≥2 cards).
- Monuments (≥4 markers in 4 cities; suggested 6–7): Naples (e.g. Spaccanapoli, `card`), Procida (Marina Corricella / Pozzo Vecchio, `nature`, `sea`), Ischia (Baia di Sorgeto, `nature`, `thermal`, `family`), Salerno ×2 (shared), Option A village (e.g. Raito, `card`), Option B river (Valle del Calore, `nature`, `river`); optionally one `trail`. `hero.src: https://example.invalid/campania/<slug>.jpg`. Coordinates approximate are fine for the bounds test [ASSUMED: e.g. Napoli ≈ 40.85,14.26; Procida Corricella ≈ 40.76,14.03; Sorgeto ≈ 40.71,13.87; Salerno ≈ 40.68,14.76]. `map.center` ≈ `{ lat: 40.75, lng: 14.3 }`, `zoom: 9` (fitBounds decides the final view anyway).
- Text: Spanish placeholders, no Roma markers (Pitfall 4), no links outside `#slug`/`http(s)://` (cross-trip-link rule).
- build-isolation: add the sentinel constant + an `it` **outside** `skipIf` asserting it is in `content/trips/campania/trip.yml`, add it to the offenders scan, and assert `.output/public/trips/campania` does not exist (same pattern as build-isolation.spec.ts:75-149).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Timeline ⇄ TimelineChoice circular SFC import works in Nuxt 4 SSR/prerender | Pitfall 12 | Low — fallback `defineAsyncComponent`; detect in first dev render/typecheck |
| A2 | Proposed colours/glyphs (ferry blue, bus orange, nature `#2f6f73`, family green) are legible in both themes | Patterns 5-7 | Low — discretion; check in UI review |
| A3 | 4 motifs cost ≈2–4 h | Motif pipeline | Low — scheduling only |
| A4 | Google Maps may ignore waypoints for `transit` on some products | Pattern 3 | Low — docs only say "not supported on all Google Maps products"; behaviour degrades to origin→destination |
| A5 | Approximate Campania coordinates | Skeleton | None for tests (only containment); Phase 13 replaces |
| A6 | Showing «Dormís en» in summary mode is desirable | Pattern 4 | Low — discretion; move into `.day-subtitle`-like hidden list if the UI-SPEC says otherwise |

## Open Questions

1. **`giugno` in Phase 13 Italian eyebrows**
   - What we know: the Roma-leak trap forbids `giugno` on any non-Roma trip and the list must not be edited.
   - What's unclear: Campania is a June trip; real Phase 13 eyebrows in Italian would trip it.
   - Recommendation: Phase 12 uses Spanish eyebrows; raise in Phase 13 discuss (option: make the trap skip the `section-eyebrow` text, or use Spanish dates).
2. **Option-only cards in `day.cards` ordering**
   - What we know: D-05 keeps them as ordinary cards of the day; nothing requires stop refs to be in `day.cards`.
   - Recommendation: in the skeleton list option cards in `day.cards` after the shared ones; no gate rule.
3. **`stays[].slug` regex** — recommend `/^[a-z0-9-]+$/` (same as `DAY_SLUG_RE`); not specified in D-06.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 22 | generate, typecheck, Playwright (better-sqlite3 ABI) | ✓ | v22.20.0 (`~/.nvm/versions/node/v22.20.0/bin`) | — (default node v24 fails) |
| pnpm | scripts | ✓ | 10.32.1 | — |
| Playwright Chromium | parity + test:trips | ✓ | chromium-1228/1234 in `~/.cache/ms-playwright` | — |
| Existing build `.output/public` | read-only collision check | ✓ (2026-11-20) | — | `pnpm verify` regenerates |

**Missing dependencies:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (unit + data, Node-pure); Playwright 1.61.0 (parity gate on built site; `test:trips` on `nuxi dev` :5300) |
| Config files | `vitest` defaults (scripts target `tests/unit`, `tests/data`); `playwright.gate.config.ts`; `playwright.trips.config.ts` |
| Quick run command | `pnpm test:unit && pnpm test:data` (≈1 s each, 301 + 377 tests green at research time) |
| Full suite command | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm verify` then, sequentially, `rm -rf .data .nuxt && pnpm test:trips` |
| Typecheck | `pnpm typecheck` (Node 22) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-18 (all) | Roma YAML unchanged still validates; `content/trips/roma`, frozen CSS and `tests/parity` untouched | data + git | `pnpm test:data`; `git diff --exit-code 7288781 -- content/trips/roma app/assets/css/base.css app/assets/css/tokens.css app/assets/css/fonts.css app/assets/css/leaflet.css tests/parity` | ✅ (schema.spec.ts:44) |
| EXT-01 | choice accepts 2–3 options, rejects 1/4, nested choice, `pace`, unknown keys; JSON-Schema `timeline.type === 'array'` | unit (data) | `pnpm vitest run tests/data/schema.spec.ts` | ❌ extend |
| EXT-01 | `flattenRows`, `optionOnlyRefs` | unit | `pnpm vitest run tests/unit/timelineRows.spec.ts` | ❌ Wave 0 |
| EXT-01 | gate: `ref` inside option is checked | data | `pnpm vitest run tests/data/invariants.spec.ts` | ❌ extend |
| EXT-01 | «Elige una», «— o bien —», both options visible under optimistic/neutral/slow, light mode and summary; label/title visible when all inner rows hidden; root is `div` | E2E (dev) | `pnpm test:trips` (campania.spec.ts) | ❌ Wave 0 |
| EXT-02 | `stayFor`; gate `stay-ref`/`stay-dup` teeth (file named) | unit + data | `pnpm vitest run tests/unit/tripStays.spec.ts tests/data/invariants.spec.ts` | ❌ Wave 0 |
| EXT-02 | «Dormís en Procida»/«Salerno» in day headers; absent on Roma | E2E + parity (existing) | `pnpm test:trips`; `pnpm test:parity` | ❌ / ✅ |
| EXT-03 | every transport/stat enum value has a CSS rule (train exempt), glyph `::before` | unit | `pnpm vitest run tests/unit/enumStyles.spec.ts` | ❌ Wave 0 |
| EXT-03 | computed `border-left-color` of `.tl-transport.ferry` ≠ base gold; stats glyph content present | E2E | `pnpm test:trips` | ❌ |
| EXT-04 | every `Motif` has an SVG (23), unique SVG ids; every `PlaceType` has `MARKER_STYLE`; Roma popup strings byte-identical; nature popup | unit | `pnpm vitest run tests/unit/svgMotifs.spec.ts tests/unit/mapMarkers.spec.ts tests/unit/enumStyles.spec.ts` | ✅ adjust / ❌ |
| EXT-04 | nature card hero fails → motif SVG rendered; nature marker colour | E2E | `pnpm test:trips` | ❌ |
| EXT-05 | Naples/Procida/Ischia/Salerno markers inside `#leaflet-map` box | E2E | `pnpm test:trips` | ❌ |
| EXT-05 | Roma: 39 markers, unchanged view | parity (existing) | `pnpm test:parity` | ✅ |
| EXT-06 | `buildDirUrl(p)` === `buildDirUrl(p,'walking')` === today's string; driving/transit URL; `routeCards` excludes option-only; `routeVisible` precedence (ferry, enabled true/false, <2) ; `routeTitle` | unit | `pnpm vitest run tests/unit/dayRoute.spec.ts` | ✅ extend |
| EXT-06 | Sun 20 no button; Thu 24 label = shared count; Fri 25 href has `travelmode=driving` | E2E | `pnpm test:trips` | ❌ |
| EXT-06 | Roma route URLs unchanged | unit (existing) + parity | `pnpm test:unit`; `pnpm test:parity` (search-route.spec.ts:285-300) | ✅ |
| EXT-07 | «Con niños» box on Sorgeto; no `.family-box` on Roma | E2E + build guard | `pnpm test:trips`; `pnpm test:data` (build half) | ❌ |
| D-17 | tripshapes.css selectors all allowlisted; no allowlisted class in any built HTML; css[] order | unit + data(build) | `pnpm vitest run tests/unit/tripShapesCss.spec.ts tests/unit/multitripCss.spec.ts`; `pnpm verify` | ❌ / ✅ adjust |
| D-16 | Campania sentinel absent from `.output/public` (decoded dumps); `trips/campania` not prerendered | data (build) | `pnpm verify` | ✅ extend build-isolation.spec.ts |

### Sampling Rate
- **Per task commit:** `pnpm test:unit && pnpm test:data` (+ `pnpm typecheck` when touching `.vue`/schema).
- **Per wave merge:** `pnpm verify` (Node 22, clean caches), then `rm -rf .data .nuxt && pnpm test:trips` — never concurrently.
- **Phase gate:** full `pnpm verify` green with no `--update-snapshots`, `test:trips` green, and the `git diff --exit-code` frozen-files check above.

### Wave 0 Gaps
- [ ] `tests/unit/cssSelectors.ts` — extract `cssSelectors` from multitripCss.spec.ts (shared helper; avoid importing a spec)
- [ ] `tests/unit/timelineRows.spec.ts` — EXT-01/EXT-06 pure helpers
- [ ] `tests/unit/tripStays.spec.ts` — EXT-02
- [ ] `tests/unit/enumStyles.spec.ts` — EXT-03/EXT-04 enum→style/SVG/marker
- [ ] `tests/unit/tripShapesCss.spec.ts` — D-17 allowlist guard (+ adjust css[] order in multitripCss.spec.ts)
- [ ] `tests/trips/campania.spec.ts` — E2E for all 7 requirements on the draft (dev :5300), reusing shape.spec.ts helper patterns (cloned, self-contained)
- [ ] build half of the D-17 guard + Campania sentinel in `tests/data/build-isolation.spec.ts` (or a sibling `tests/data/shapes-isolation.spec.ts`)
- Framework install: none.

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | static site |
| V3 Session Management | no | — |
| V4 Access Control | no | drafts excluded at config time (`draftExcludes`) + decoded-dump scan |
| V5 Input Validation | yes | zod schemas (strict choice), data gate (`ref`, `anchor`, `cross-trip-link`, new `stay-*`) |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| HTML injection via popup string interpolation (`bindPopup`) | Tampering | escape `& < > "` in `name`/`day` (Roma byte-identical); content is repo-authored |
| `v-html` of untrusted data | Tampering | none added; only the existing trusted `motifSvg` constant (MonumentCard.vue:244-245); Md fields go through `<MDC>` |
| Draft content leaking into the published site | Information disclosure | `draft: true` + Campania sentinel in the decoded `sql_dump` scan |
| `javascript:`/cross-trip links in new Md fields | Tampering | existing `cross-trip-link` rule recurses all strings (collectStrings) |
| Tab-nabbing from route links | Tampering | keep `target="_blank" rel="noopener"` on `.day-route-btn` |

## Sources

### Primary (HIGH confidence — read this session)
- `shared/schemas.ts` (full), `content.config.ts`, `scripts/tripManifest.mjs`
- `app/components/{Timeline,TimelineTransport,TimelineStop,DaySection,MonumentCard,LeafletMap.client,TripView}.vue`
- `app/utils/{dayRoute,pace,mapMarkers,svgMotifs,searchIndex}.ts`, `app/composables/{useTripModes,useCardNavigation}.ts`
- `app/assets/css/base.css` (325-415, 480-640, 715-745, 920-960), `leaflet.css` (725-800), `multitrip.css`, `tokens.css`
- `tests/unit/{multitripCss,svgMotifs,mapMarkers,dayRoute,romaChromeGuard,tripCoupling,tripManifest}.spec.ts`, `tests/data/{trips.ts,schema.spec.ts,invariants.spec.ts,build-isolation.spec.ts}`, `tests/trips/{shape.spec.ts,romaLeaks.ts}`, `playwright.trips.config.ts`, `playwright.gate.config.ts`, `tests/README.md`
- `node_modules/@nuxt/content/dist/chunks/zod4.mjs` and `dist/runtime/internal/schema.js` (column derivation)
- zod 4.4.3 probe (scratchpad) — choice shape, strictness, JSON-Schema output
- `content/trips/{roma,forma}/**` samples; `.output/public/**/*.html` class-token scan
- `.planning/research/{FEATURES,ARCHITECTURE,PITFALLS}.md` (§2/§5, H18, H25, Pitfalls 9-10)

### Secondary (MEDIUM)
- Google Maps URLs — Directions `travelmode` / `waypoints` [CITED: https://developers.google.com/maps/documentation/urls/get-started] (single-source fetch; classify-confidence for webfetch returned LOW, upgraded to MEDIUM as official vendor documentation)

### Tertiary (LOW)
- None used for decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; versions from package.json.
- Architecture: HIGH — every integration point read; schema behaviour proven by probe; Content column logic read from source.
- Pitfalls: HIGH — each tied to a file:line (train rule absence, gate top-level scan, leak trap list, css order assertion).
- Visual choices (colours, glyphs, motif drawings): LOW/discretion by design.

**Research date:** 2026-11-21
**Valid until:** 2026-12-21 (stable stack; re-check only if `@nuxt/content` or zod are upgraded)
