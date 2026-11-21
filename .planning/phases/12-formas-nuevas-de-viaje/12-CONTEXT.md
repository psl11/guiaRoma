# Phase 12: Formas nuevas de viaje - Context

**Gathered:** 2026-11-21
**Status:** Ready for planning
**Mode:** `--auto`. EXT-01 and EXT-04 were answered by the user before discuss, on 2026-11-21. Every other decision is the recommended default, logged in `12-DISCUSSION-LOG.md`.

<domain>
## Phase Boundary

The guide learns to render the shapes that a trip like Campania needs and Roma never had:
- days with alternatives (A/B);
- where you sleep each night («Dormís en…»);
- new transport legs (ferry, car, bus, bike, plane);
- nature places with their own marker and fallback drawing;
- a family note on a card;
- a map that frames several cities;
- a «ruta del día» that uses the day's travel mode.

All of it is proven with a **minimal Campania skeleton** (`draft: true`), not with real Campania content. Writing the content is Phase 13.

Roma stays byte-identical. The parity gate (110 tests, 56 goldens) stays green with no `--update-snapshots`.
</domain>

<decisions>
## Implementation Decisions

### Days with alternatives (EXT-01) — user decision 2026-11-21: stacked, always visible
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

### Where you sleep (EXT-02)
- **D-06:** Bases are a trip-level list plus a per-day reference.
  - Trip level: `trip.stays?: [{ slug, name: Md-inline, area?, coords?, note? }]`.
  - Day level: `day.stay?: <slug>`.
  - Name it `stays`, not `bases`, so it is never confused with `baseURL`.
  - The data gate fails, naming the file, when `day.stay` points to a slug that does not exist or when stay slugs are duplicated.
- **D-07:** A day with `stay` shows «Dormís en {name}» in its header, using a fixed Spanish UI string, as in the rest of the shared chrome. A day without `stay`, such as a departure day, shows nothing. Roma defines no `stays`, so its DOM is unchanged.
- **D-08:** No stay markers on the map in this phase (deferred, P2). `stays[].coords` is optional and only stored.

### Transport (EXT-03)
- **D-09:** Add `ferry`, `car`, `bus`, `bike` and `plane` to two enums:
  - `TimelineRow(transport).variant`, which today is `taxi|walk|train`;
  - `day.stats[].variant`, which today is `walk|train|taxi|metro|ticket`.
  - Each new value gets its own visual style: a colour band plus a glyph following the `.tl-transport.taxi` pattern, and the equivalent for stats.
  - Colours come from existing tokens or `color-mix`, and must hold in light and dark themes.
  - A unit test fails if any enum value has no CSS rule.
  - Existing values (`metro`, `taxi`…) are not touched.

### Nature places (EXT-04) — user decision 2026-11-21: new SVG drawings
- **D-10:** Add 4 `Motif` values with new SVG drawings in the stroke style of the current `svgMotifs.ts`: `sea` (beach or cove, waves), `thermal` (pool with steam), `river` (river or bridge) and `trail` (mountain path).
  - A test checks that every `Motif` value has an SVG.
  - Other Campania places (volcano, village, lake) use the closest existing or new motif. Extra motifs are only added if Phase 13 needs them.
- **D-11:** Add `nature` to `PlaceType`.
  - Its marker has its own colour and popup, added to the marker style table (`mapMarkers.ts`/`LeafletMap.client.vue`). The current colours of `card`/`guided`/`concert` stay as they are.
  - A nature card is a normal `MonumentCard`: same ficha, motif fallback when the image fails, and a Google Maps link.

### Family note (EXT-07)
- **D-12:** Add `family?: Md` to the card. It renders as a box titled «Con niños», with a style derived from `.culture-box`, new CSS only.
  - Its position inside the card is planner discretion, but it must be consistent.
  - Cards without `family` (all of Roma's) keep an identical DOM.

### Multi-city map (EXT-05)
- **D-13:** Keep the current rule: `setView(trip.map.center, zoom)` and then `fitBounds` over all markers with `.pad(0.1)`.
  - `trip.map` stays required, with no schema change. Campania gives a regional center.
  - A test proves that Naples, Procida, Ischia and Salerno are all inside the visible bounds.
  - Roma keeps exactly its current view.
  - No clustering and no per-day focus (deferred).

### Day route by mode (EXT-06)
- **D-14:** Add `day.route?: { mode?: 'walking'|'driving'|'transit', enabled?: boolean }`. The default is walking and enabled, which is Roma's current behaviour, so Roma's URL stays identical.
  - `mode` maps to Google Maps' `travelmode`.
  - A day with a `transport` row of variant `ferry`, including one inside an option, hides the button automatically.
  - `route.enabled: true` can force the button to show and `false` can hide it on any day.
  - The 10-stop cap (`capStops`) and `routeLabel` stay unchanged.

### Campania skeleton
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

### Parity and CSS
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
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` §«Phase 12: Formas nuevas de viaje» — goal, 5 success criteria, notes (skeleton as draft, enum→CSS/SVG test, `DayOptions` with a `<div>` root).
- `.planning/REQUIREMENTS.md` — EXT-01..07.
- `.planning/inputs/campania-2027-itinerario-raw.md` — the real shapes the skeleton must exercise (days 24 and 26 with alternatives, five bases, ferries, car, beaches, thermal pools, river, trail, children).

### Milestone research
- `.planning/research/FEATURES.md` §2 table (rows 1-9: `choice`, `stays`, transport, motifs, `PlaceType`, `family`, route by mode) and §3 (Campania).
- `.planning/research/ARCHITECTURE.md` — H18 (`MARKER_STYLE`), H25 (scrollspy takes every `<section>`), schema table (~180-197), multi-city map (~338).
- `.planning/research/PITFALLS.md` — closed enums/CSS (~230-240), multi-city map and route mode (~260-277).
- `.planning/research/SUMMARY.md` §Phase 12 (~82-83, 104, 126, 160).

### Earlier phases
- `.planning/phases/10-forma-y-chrome-desde-datos/10-CONTEXT.md` — D-02 (dated day slugs), D-10 (additive schema, Roma first), D-14 (neutral fallback without Roma text).
- `.planning/phases/11-portada-y-rutas-multi-viaje/11-CONTEXT.md` — D-16/D-17 (drafts: excluded in production, loaded in dev), D-21 (`multitrip.css` guard, to be adapted here).
- `.planning/phases/11-portada-y-rutas-multi-viaje/11-REVIEW.md` — WR-01..03, still open, about `summary`. They do not block this phase.

### Key code and tests
- `shared/schemas.ts` (`Motif` ~31, `PlaceType` ~37, `MonumentSchema` ~46, `TimelineRow` ~92, `DaySchema` ~139, `TripSchema` ~363), `content.config.ts`.
- `app/components/Timeline.vue` (`COMPONENT_BY_KIND` dispatcher), `TimelineTransport.vue`, `DaySection.vue` (header, route button), `MonumentCard.vue`, `LeafletMap.client.vue` (~67 setView, ~107-130 colours and popups, ~138 fitBounds).
- `app/utils/dayRoute.ts` (`buildDirUrl`, `travelmode=walking` ~79), `mapMarkers.ts`, `svgMotifs.ts`.
- `app/assets/css/base.css` ~504-628 (`.tl-transport.*`, reference only, not edited), `app/assets/css/multitrip.css`.
- `tests/unit/multitripCss.spec.ts`, `tests/data/trips.ts` + `invariants.spec.ts` + `schema.spec.ts`, `tests/data/build-isolation.spec.ts`, `tests/trips/*`, `tests/README.md`.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Timeline.vue` already dispatches by `kind` through a map to components. `choice` is one more entry, and its component can reuse the dispatcher for the rows of each option.
- `MonumentCard` plus `svgMotifs.ts` already render a motif fallback when the image fails. Nature only adds motifs.
- `dayRoute.ts` (`capStops`, `buildDirUrl`, `routeLabel`) is pure and unit-tested. Route mode and choice exclusion fit in there.
- `buildTripLayout` (Phase 10) and the per-trip data gate (`tests/data/trips.ts`) take new invariants without structural change.

### Established Patterns
- Optional, additive schema fields. Roma validates unchanged.
- Shared chrome is fixed Spanish/Italian text. Trip-specific text lives in `trip.yml`.
- New CSS lives outside `base.css`. Each enum value has a matching CSS class.
- Drafts are tested in `test:trips` on dev (port 5300) and excluded from the build.

### Integration Points
- `DaySection.vue` (header: «Dormís en»; route button: mode and hiding).
- `LeafletMap.client.vue`/`mapMarkers.ts` (`nature` marker; framing unchanged).
- `shared/schemas.ts` + `tests/data/trips.ts` (`stays` references, single-level `choice`, enums).
</code_context>

<specifics>
## Specific Ideas
- Separator text is exactly «— o bien —», with em-dashes. Default heading «Elige una».
- Campania mixes «Opción A/B» (Thu 24) and «Opción 1/2» (Sat 26), which is why `label` is free text.
- Baia di Sorgeto at night with children is the natural case for `family` (≈300 steps, very hot water in places). The real text is Phase 13's job.
</specifics>

<deferred>
## Deferred Ideas
- A/B selector that remembers the choice and hides the other option (TRIP-02, future).
- Stay markers on the map, a «focus this day» button, clustering, ferry polylines (P2/P3).
- Extra motifs beyond the 4 (volcano, village, lake), only if Phase 13 needs them, as a decimal phase.
- Phase 11 WR-01..03 (`summary` on the portada): recommended before Campania stops being a draft (Phase 13). They are decided in `/gsd-verify-work 11`.
</deferred>
