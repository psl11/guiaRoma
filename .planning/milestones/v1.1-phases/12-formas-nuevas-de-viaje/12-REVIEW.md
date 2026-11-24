---
phase: 12-formas-nuevas-de-viaje
reviewed: 2026-11-21T11:52:19Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - app/assets/css/tripshapes.css
  - app/components/DaySection.vue
  - app/components/LeafletMap.client.vue
  - app/components/MonumentCard.vue
  - app/components/Timeline.vue
  - app/components/TimelineChoice.vue
  - app/components/TripView.vue
  - app/utils/dayRoute.ts
  - app/utils/mapMarkers.ts
  - app/utils/searchIndex.ts
  - app/utils/svgMotifs.ts
  - app/utils/timelineRows.ts
  - app/utils/tripStays.ts
  - content/trips/campania/days/domingo-20.yml
  - content/trips/campania/days/jueves-24.yml
  - content/trips/campania/days/martes-22.yml
  - content/trips/campania/days/sabado-19.yml
  - content/trips/campania/days/viernes-25.yml
  - content/trips/campania/monuments/baia-di-sorgeto.yml
  - content/trips/campania/monuments/castello-arechi.yml
  - content/trips/campania/monuments/duomo-di-salerno.yml
  - content/trips/campania/monuments/marina-corricella.yml
  - content/trips/campania/monuments/monte-epomeo.yml
  - content/trips/campania/monuments/pozzo-vecchio.yml
  - content/trips/campania/monuments/raito.yml
  - content/trips/campania/monuments/rione-sanita.yml
  - content/trips/campania/monuments/spaccanapoli.yml
  - content/trips/campania/monuments/valle-del-calore.yml
  - content/trips/campania/monuments/vesubio.yml
  - content/trips/campania/trip.yml
  - nuxt.config.ts
  - shared/schemas.ts
  - tests/README.md
  - tests/data/build-isolation.spec.ts
  - tests/data/invariants.spec.ts
  - tests/data/schema.spec.ts
  - tests/data/trips.ts
  - tests/trips/campania.spec.ts
  - tests/unit/cssSelectors.ts
  - tests/unit/dayRoute.spec.ts
  - tests/unit/enumStyles.spec.ts
  - tests/unit/mapMarkers.spec.ts
  - tests/unit/multitripCss.spec.ts
  - tests/unit/searchIndex.spec.ts
  - tests/unit/svgMotifs.spec.ts
  - tests/unit/timelineRows.spec.ts
  - tests/unit/tripManifest.spec.ts
  - tests/unit/tripShapesCss.spec.ts
  - tests/unit/tripStays.spec.ts
findings:
  critical: 0
  warning: 2
  info: 7
  total: 9
  necessity: 0
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-11-21T11:52:19Z
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

I reviewed all 49 files changed since `0af8a7f` (diff base), starting with the source: `shared/schemas.ts`, the six components, the six utils, `tripshapes.css` and `nuxt.config.ts`. After that I read the test helpers and gates (`tests/data/trips.ts`, `tests/unit/cssSelectors.ts`, `build-isolation.spec.ts`, `enumStyles.spec.ts`, `tripShapesCss.spec.ts`), skimmed the rest of the specs, and read the `campania` draft content. I checked the code against the locked decisions in `12-CONTEXT.md` (D-01…D-19) and against `12-UI-SPEC.md`.

**Roma parity holds by construction.** I found no path that changes Roma's output:
- Every new schema field is `.optional()`.
- `buildDirUrl`/`routeTitle` fall back to `walking` and to today's title verbatim.
- `markerPopupHtml` keeps the three Roma templates byte for byte. The new escaping cannot change Roma: I grepped Roma's monument `name`/`day` fields and its `mapExtras`, and none contains `& < > "`.
- Every `tripshapes.css` selector requires a class that Roma never emits. The static guard and the build-time guard enforce this together.
- The `choice` block's root is a `<div>`, so the scrollspy (`querySelectorAll('section')`) does not pick it up.
- No new `<style scoped>` and no `v-html`.

I found no blocker. The two warnings are both in the "ruta del día" logic for the new shapes:
- `transit` mode builds a URL with waypoints, which Google Maps cannot honour for public transport.
- The rule that options never mix A and B (D-04) only looks at `stop.ref`.

The Info items are robustness and hardening gaps around the marker table and the draft sentinel, plus one duplicated type.

No necessity findings. I checked every guard against `null`/`undefined` (`stayFor`, `routeVisible`, `buildDirUrl`, `routeTitle`): each one defends against Nuxt Content returning `null` for absent optional columns, which the Phase 10 decision documents. `escapeHtml` sits on a trust boundary (data read from files), so the rubric excludes it.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: `route.mode: transit` builds a multi-stop URL that Google Maps cannot route for public transport

**File:** `app/utils/dayRoute.ts:98-108` (also `shared/schemas.ts` `RouteMode`, `app/components/DaySection.vue` `routeHref`)
**Issue:** `buildDirUrl(points, mode)` only swaps the `travelmode` value. It still adds `&waypoints=` for every intermediate stop, up to 8, because `capStops` allows 10 points. Google Maps does not support multi-stop directions for public transport: "Add stop" is unavailable in transit mode, and waypoints in a transit directions URL are ignored or force another mode. So a `mode: transit` day with 3 or more stops opens a route that silently drops every intermediate stop. Meanwhile the button still says «Ver ruta del día (N paradas)» and the title says «… en transporte público». `RouteMode` accepts `transit` and nothing stops it from being combined with 3 or more stops. No `campania` day uses `transit` yet, so the tests do not catch this. Phase 13 content would hit it.
**Fix:** Pick one of the following and add a unit test for it in `tests/unit/dayRoute.spec.ts`:
- Make `transit` route only origin to destination, and make the label honest about it.
- Reject `transit` with more than 2 route stops in the data gate.
- Drop `transit` from `RouteMode` until it is needed.

Example of the first option:
```ts
export function buildDirUrl(points: string[], mode?: RouteMode | null): string {
  const enc = encodeURIComponent
  const m = mode ?? 'walking'
  let url = 'https://www.google.com/maps/dir/?api=1&travelmode=' + m
    + '&origin=' + enc(points[0]!)
    + '&destination=' + enc(points[points.length - 1]!)
  // Google Maps ignores waypoints for public transport: never emit them for transit.
  const waypoints = m === 'transit' ? [] : points.slice(1, -1)
  if (waypoints.length) url += '&waypoints=' + waypoints.map(enc).join('|')
  return url
}
```

### WR-02: D-04 «la ruta nunca mezcla A y B» only checks `stop.ref`, so option-only cards cited any other way leak into the route

**File:** `app/utils/timelineRows.ts:41-52`, used by `app/utils/dayRoute.ts:124-127`
**Issue:** `optionOnlyRefs` collects only `stop` rows' `ref`. `routeCards` then keeps every `day.cards` slug that is not in that set. The schema lets an option reach a monument card in other ways that this rule does not see:
- A `food` row inside an option whose `entries[].ref` points to a monument. `FoodEntry.ref` resolves against `stopOrFood`, which includes monuments.
- A Markdown link `[x](#slug)` in an option's `title`, or in a row `note`/`desc`.

If that card is also listed in `day.cards`, which D-05 says option cards are, it stays in the route. The route then mixes option A's place with option B's, which is exactly what D-04 forbids, and the stop count in the label is inflated.

There is also the reverse case. A card that is a `stop` in every option (the same place reached either way) is still excluded, even though including it cannot mix alternatives.

The gate (`tests/data/trips.ts`) does not flag either case, so schema-valid data reaches the user with a wrong route.
**Fix:** Derive the excluded set from every reference inside an option, not only stop refs. Keep refs that appear in all options of the same `choice`:
```ts
function refsOfRow(r: BaseTimelineRow): string[] {
  if (r.kind === 'stop') return r.ref ? [r.ref] : []
  if (r.kind === 'food') return r.entries.flatMap(e => (e.ref ? [e.ref] : []))
  return []
}
// shared = refs of top-level rows; for each choice, inAll = intersection of per-option refs
// (add inAll to shared); excluded = (union of option refs) − shared
```
If you keep the narrower rule on purpose, add a gate rule that fails when a `day.cards` slug is reachable only through non-`stop` content inside an option. Either way, add a unit case for each of the three situations.

## Info

### IN-01: `MARKER_STYLE[m.type].bg` dropped the tolerant default and throws on an unexpected `type`

**File:** `app/components/LeafletMap.client.vue:111`
**Issue:** The old code started from `#8b3a3a` and only overrode it for `guided`/`concert`, so any other value still drew a marker. The new lookup throws a `TypeError` if `m.type` is missing or not in the table. When that happens the `forEach` stops partway, later markers are never added and `fitBounds` never runs. Content v3 does not validate `type:'data'` collections at build time (#3351, noted in `content.config.ts`), so only the `tests/data` gate stands between bad YAML and a half-drawn map. `markerPopupHtml` already falls back to the `card` template, so the two lookups are now inconsistent.
**Fix:** `const bgColor = (MARKER_STYLE[m.type] ?? MARKER_STYLE.card).bg`. This keeps Roma's output identical.

### IN-02: The divIcon HTML interpolates `m.n` unescaped, while the popup escapes its fields

**File:** `app/components/LeafletMap.client.vue:119`
**Issue:** Threat T-12-10 is handled by escaping `name`/`day`/`id` in `markerPopupHtml`. But the `roman` field (`m.n`) also goes into HTML that Leaflet parses (`L.divIcon({ html })`), and it is interpolated raw. The data comes from repo YAML, so the risk is low, but the hardening covers only half of it.
**Fix:** Export `escapeHtml` from `app/utils/mapMarkers.ts` (or add a `markerIconHtml(m, bg)` helper there) and escape `m.n`. Roma's numerals (`I`…`XXXVIII`, `★`) contain none of the escaped characters, so its output does not change.

### IN-03: `markerPopupHtml` is not exhaustive and duplicates the `MARKER_STYLE` colours

**File:** `app/utils/mapMarkers.ts:64-69, 83-96`
**Issue:** `Record<PlaceType, …>` makes the compiler require a colour for every type, but the popup `switch` has a `default` branch. A future `PlaceType` value would compile and silently get the `card` popup with the card colour. The `nature` colour `#2f6f73` is also hard-coded in three places (the table and the popup's `em` and `a`). Changing one without the others would make the marker and its popup drift apart.
**Fix:** Change `default:` to `case 'card':`, and add a `const _exhaustive: never = m.type` after the switch. Build the `nature` popup from `MARKER_STYLE.nature.bg`. Keep the Roma templates as literals so they stay byte-stable.

### IN-04: Route auto-hiding covers `ferry` only; a `plane` day with 2 or more stops offers a walking route between cities

**File:** `app/utils/dayRoute.ts:137-145`
**Issue:** The reason given for hiding the route on ferry days is «una ruta a pie o en coche no cruza el mar». The same reasoning applies to `plane`, which this phase adds. A transfer day with a flight and stops in both cities would show a `travelmode=walking` route between them. This follows D-14 literally (only ferry is named), and the `sabado-19` skeleton day has no cards, so the tests never reach it.
**Fix:** Decide before Phase 13 content lands: either treat `plane` like `ferry` in `routeVisible` (`hasTransportVariant(day.timeline, 'ferry') || hasTransportVariant(day.timeline, 'plane')`), or record that authors must set `route.enabled: false` on flight days.

### IN-05: The `campania` draft sentinel lives only in `trip.yml`, so a leak of its other collections would go undetected

**File:** `tests/data/build-isolation.spec.ts:62-63, 170-175`; `content/trips/campania/trip.yml:20-24`
**Issue:** `CAMPANIA-CENTINELA-12A` only appears in `howTo`. The decoded-dump scan therefore only proves that the `trip` collection row is excluded. If the `exclude` were ever dropped from `day`/`monument` in `content.config.ts`, Campania's day and monument rows (real place names) would be published and this test would stay green. The `trips/campania` directory check does not cover the `__nuxt_content/*/sql_dump.txt` files. The `prueba` draft avoids this gap by also carrying its sentinel in a monument file (`content/trips/prueba/monuments/fontana-pruebas.yml`).
**Fix:** Put the sentinel in at least one Campania day and one monument (for example in a `note`), or have the scan also check the decoded dumps for `trips/campania/`.

### IN-06: `TimelineChoice.vue` redefines `ChoiceRow` instead of importing the exported schema type

**File:** `app/components/TimelineChoice.vue:35`
**Issue:** `type ChoiceRow = Extract<Day['timeline'][number], { kind: 'choice' }>` duplicates `export type ChoiceRow` from `shared/schemas.ts`. Both resolve to the same type today. Two definitions of the same contract can drift apart, and the local one shadows the exported name.
**Fix:** `import type { ChoiceRow } from '~~/shared/schemas'` and delete the local alias.

### IN-07: `mapExtras` now accepts `type: nature`, which renders an `<a href="#">` popup link that jumps to the top of the page

**File:** `shared/schemas.ts:474-480`; `app/utils/mapMarkers.ts:83-96`; `app/components/LeafletMap.client.vue:97-105`
**Issue:** Extras are always mapped with `id: ''`. Only the `guided` popup has no anchor; `card`/`concert`/`nature` emit `href="#${id}"`, which becomes `href="#"`. The F5 capture listener gates on `monById.has('')`, which is false, so the browser follows `#`, scrolls to the top and rewrites the hash. This existed before for `card`/`concert` extras, but the phase widens `PlaceType` (and so `mapExtras.type`) to `nature`. A nature landmark without a card (a beach, a viewpoint) is a natural `mapExtras` entry for Phase 13.
**Fix:** In `markerPopupHtml`, emit the «Abrir ficha →» link only when `m.id` is non-empty, and render plain text otherwise, as `guided` does. Alternatively, restrict `mapExtras.type` to `guided`.

---

_Reviewed: 2026-11-21T11:52:19Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
