# Phase 13: Contenido Campania 2027 - Research

**Researched:** 2026-11-21
**Domain:** YAML content authoring on the Phase 12 trip shapes (Nuxt Content v3 data collections + zod gate), publication of a draft trip, and field-data verification for a June 2027 family trip in Campania
**Confidence:** HIGH for the content contract and the tests that must change; MEDIUM for the field data (2027 timetables and some 2027 dates are not published yet)

## Summary

This phase is content, not code. Every shape Campania needs already exists in `shared/schemas.ts`: `choice`, `stays`, the ferry/car/bus/bike/plane transports, `nature`, `family`, `route`, and the reference/food collections. The data gate `tests/data/trips.ts` has 20 rules. The ones that will bite are `ref` (including refs inside choice options), `stay-ref`, `day-order` (orders must stay contiguous 1..N), `day-pill`, `anchor`/`cross-trip-link`, `trip-summary-link` and `unknown-key`. **The gate also constrains the work order.** Cards (and any food a day cites) must exist before or with the days that reference them. The day orders must stay contiguous 1..N in every intermediate commit, and the skeleton currently uses orders 1–5 on the wrong slugs.

**There is one real content gap, and the schema cannot express the fix.** `app/components/ReservasSection.vue` hard-codes three Roma headings: «✅ Ya reservado · 3 comensales» (line 73), «🎟️ Visitas y entradas reservadas» (line 81) and «Restaurantes · cuándo reservar y con cuánta antelación» (line 91). `confirmed[].group` only allows `mesas | visitas`. Campania's Reservas (flights, ferries, beds, car, concerts) would therefore render under a false «3 comensales» heading and a «Restaurantes» table header. Fixing that needs a small decimal **Phase 12.1 insert**: optional heading fields with Roma's text as the default, so parity is unchanged. Otherwise the user must explicitly accept the wrong chrome. Everything else is expressible.

**Publication (D-02) breaks more tests than CONTEXT lists.** Besides `tests/data/build-isolation.spec.ts`, these change:
- `tests/unit/tripManifest.spec.ts` (3 assertions);
- `tests/trips/portada.spec.ts` (dev portada expects exactly 1 card);
- `tests/trips/campania.spec.ts` («la portada de dev no lista el borrador»).

The real content also collides with skeleton-bound assertions in `tests/trips/campania.spec.ts` (order `[1..5]`, «jueves 24» walking route, and several EXT-01 shape anti-vacuity guards), `tests/unit/timelineRows.spec.ts` (exact Thursday refs) and `tests/unit/searchIndex.spec.ts` (Sorgeto's `family` must contain «escalones» and «linterna»). No `tests/parity` spec needs editing: `tests/parity/portada.spec.ts` derives its list from the manifest, and its 375 px backstop rewrites the first card's texts itself.

**Field data, most important finding:** the **official Ultimo tour calendar lists Naples on Thursday 24 June 2027**, not Friday 25. Only resellers list a 25 June show, and TicketOne has two Maradona event IDs, which suggests a second date. On the 24th the family is in Salerno, so this must be confirmed with the user's tickets.

Other field data:
- The Pinguini Tattici Nucleari show on 27 June 2027 at the Maradona comes from a single source.
- The «Spaccanapoli» race exists. Its 43rd edition was Sunday 21 June 2026, from 08:00 at Piazza Municipio, with 10 km and 5 km routes and traffic closed 08:00–10:30. The 2027 date is not announced yet.
- No 2027 ferry timetables exist yet.
- Alibus does **not** reach the Vomero. It stops at Piazza Garibaldi and the port, so the Vomero needs Metro L1 or a funicular.

**Primary recommendation:**
1. Write the content in the order trip.yml → cards → food → days 19–23 → days 24–28 → reservas/práctica → publish, with every intermediate commit gate-green.
2. Keep the `CAMPANIA-CENTINELA-12A` sentence in `howTo` until the publication plan, which removes it and inverts the tests in the same commit.
3. Raise the Ultimo date and the Reservas-chrome gap as checkpoints early.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Trip/day/card/food/reference content | Content (YAML in `content/trips/campania/**`) | — | D-19: no `app/`, `shared/`, `nuxt.config.ts` changes; shapes exist since Phase 12 |
| Validation of content | Test tier (`tests/data/trips.ts` gate + zod `shared/schemas.ts`) | Build (Nuxt Content does NOT validate `type:'data'`, see schemas.ts:6-8) | The gate is the real validator |
| Publication / prerender list | Build config (`scripts/tripManifest.mjs` reads `draft`) | Static output `.output/public/trips/campania/` | Flipping `draft` is a 1-line content change; manifest drives prerender + Content excludes |
| Hero images | CDN (hotlinked `upload.wikimedia.org`) | Browser fallback to motif SVG on `@error` | D-11; matches Roma; no repo images |
| Map markers | Browser (Leaflet `fitBounds` over all monuments) | Content (`coords`, `type`, `roman`) | `map.center/zoom` is only the initial view (LeafletMap.client.vue:71, :132) |
| Field-data honesty («por confirmar») | Content (Markdown-inline marker) | Test tier (count/absence test) | D-12: no schema field; marker convention only |

## Standard Stack

No new packages. The phase uses the installed stack:

| Tool | Version | Use in this phase |
|------|---------|-------------------|
| `@nuxt/content` | 3.14.0 [VERIFIED: package.json] | `type:'data'` collections the YAML lands in |
| `zod` schemas | `shared/schemas.ts` | The content contract (read-only) |
| `yaml` | ^2.9.0 [VERIFIED: package.json] | The gate's parser (`tests/data/trips.ts:42`) |
| Vitest | 4.1.9 [VERIFIED: package.json] | `test:unit`, `test:data` |
| Playwright | 1.61.0 [VERIFIED: package.json] | `test:trips` (dev, port 5300), `test:parity` |

**Installation:** none.

## Package Legitimacy Audit

No external packages are installed in this phase, so the gate does not apply.

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### User decisions (asked 2026-11-21, before the run)
- **D-01 — The car is returned on Saturday 26 (CAMP-01).** The user chose «El 26 (sábado en coche)».
  - **Pickup:** Wed 23 at 16:00, at Capodichino airport, together with Arantxa.
  - **Thu 24:** car days from Salerno.
  - **Fri 25:** drive Salerno → Vesuvius → Naples. There is **no** car return that day; the raw text's «devolución del coche» on the 25th moves to the 26th.
  - **Sat 26:** day trip by car (Casertavecchia or Campi Flegrei). The car is returned that evening.
  - **Where it is returned:** the raw text does not say. Assume Capodichino (the pickup point) and mark it «por confirmar» in the day and in Reservas.
  - **Parking:** the car spends the night of the 25th in Naples. Práctica says where to leave it (garage or parking near the base), marked «por confirmar», with a ZTL warning.
  - **Route mode:** days 23, 24 (shared rows), 25 and 26 use `route.mode: driving` wherever the route makes sense.
- **D-02 — Publish when Phase 13 closes (ROUTE-05).** The user chose «Al cerrar la fase 13 (Recomendado)».
  - The last plan of the phase flips `content/trips/campania/trip.yml` from `draft: true` to published, but only once all 10 days, the cards, Gastronomía, Reservas and Práctica are written and `pnpm verify` is green.
  - Until that final plan, Campania stays a draft. Intermediate waves are checked with `test:trips` on `nuxi dev`.
  - Doubtful facts are published marked «por confirmar» (D-12).
  - **Consequences the planner must handle:**
    - `tests/data/build-isolation.spec.ts` (D-16 of Phase 12) currently asserts that the `CAMPANIA-CENTINELA-12A` sentinel and `trips/campania` are **absent** from `.output/public`. On publication that assertion is inverted. Campania must be present and prerendered, and must not pull `sql_dump` or WASM, like Roma. The draft-isolation guarantee stays covered by `prueba` and `forma`, which remain drafts.
    - Delete the sentinel from the `howTo` text; it must not reach the published site. If the test needs a marker, use a positive check on real content.
    - The parity spec `tests/parity/portada.spec.ts` reads the manifest, so it should list Campania without edits. **No `tests/parity` spec is edited.** If one fails because of publication, stop and report it; never edit a parity spec or re-baseline a golden.
  - **Reversibility:** reversible. Going back to `draft: true` is one line, and the deploy is a separate act anyway.

### The 10 days (CAMP-01)
- **D-03 — Slugs and order.** Use dated slugs (Phase 10 D-02): `sabado-19`, `domingo-20`, `lunes-21`, `martes-22`, `miercoles-23`, `jueves-24`, `viernes-25`, `sabado-26`, `domingo-27`, `lunes-28`, with `order` 1–10.
  - Rewrite the 5 skeleton days with those slugs; do not keep placeholder text.
  - Eyebrows are in Spanish (`sábado · 19 de junio`), **never** in Italian, because `giugno` trips the Roma-leak trap in `tests/trips/romaLeaks.ts`. That list is never edited.
- **D-04 — Bases (`day.stay`).**

  | Days | Stay |
  |------|------|
  | 19 | `napoles` (the raw text suggests the Vomero) |
  | 20 | `procida` |
  | 21, 22 | `ischia` (Forio or near Via Sorgeto) |
  | 23, 24 | `salerno` |
  | 25, 26, 27 | `napoles` |
  | 28 | no `stay` (departure day) |

  - Specific accommodation is unknown, so each stay's `note`/`area` says the zone and «por confirmar» where needed.
  - Whether the Naples base on 25–27 is the same Vomero area as on the 19th is unknown. Mark it «por confirmar».
- **D-05 — Alternatives (`choice`).**
  - **Thu 24:** «Opción A» = Raito and Albori plus coves on the northern Cilento coast. «Opción B» = Calore river valley near Felitto, with a mountain trattoria.
  - **Sat 26:** «Opción 1» = Casertavecchia, with the Parco del Partenio as an optional extra. «Opción 2» = Campi Flegrei: Lake Averno, the Antro della Sibilla at Cuma and the beach at Miseno.
  - Shared rows sit outside the `choice`. Examples: leaving Salerno or Naples by car, «Noche: regreso y descanso en Nápoles», and returning the car (26).
  - Per Phase 12 D-04, stops inside the options do not count toward the day route.
- **D-06 — Time and logistics per day**, taken from `.planning/inputs/campania-2027-itinerario-raw.md`. That file is the content source. Its year «2026» is a typo; the trip is in **2027**.

  | Day | Logistics |
  |-----|-----------|
  | 19 | Land 16:35 at Capodichino; Alibus |
  | 20 | Spaccanapoli 08:30–10:30; walk to Porta di Massa; Caremar ferry 12:15 or 13:30 |
  | 21 | Procida→Ischia ferry in the afternoon (15:45/17:15 as examples) |
  | 22 | Epomeo in the morning; Sorgeto at night |
  | 23 | Ferry back to Naples; 16:00 Arantxa at Capodichino plus car pickup; drive to Salerno |
  | 25 | Ultimo concert, Stadio Maradona |
  | 27 | 10:00 Arantxa and the children to the airport; Pinguini Tattici Nucleari concert, Stadio Maradona |
  | 28 | 09:55 flight to Palma |

  - Times not yet published for 2027 (ferries, concerts) are written «por confirmar» (D-12).
- **D-07 — Transports.** Use the Phase 12 variants: `plane` (19, 28), `bus` (Alibus), `ferry` (20, 21, 23), `bike` (Procida), `car` (23–26) and `walk`.
  - Never write a `meta` row with a doubled emoji. This was a UI-REVIEW warning in Phase 12: logistics go in `transport` rows with their own variant.
- **D-08 — Day route by content, with no code change (Phase 12 WR-01 / IN-04).**
  - Never use `route.mode: transit` on a day with more than 2 stops (WR-01: Google Maps does not draw it).
  - On plane days (19, 27 if relevant, 28) and on any day where the route would mislead, set `route.enabled: false` explicitly (IN-04).
  - Ferry days hide the route automatically.
  - WR-01 and IN-04 stay open in `12-REVIEW-DISPOSITION.md`, mitigated by content. That is recorded in this phase's SUMMARY.
- **D-09 — Tone.** Slow, authentic, family-oriented, as in the raw planning («lo único e inolvidable»). Second person plural («dormís», «os espera»), as in Roma.
  - The adults are named as in the planning (Arantxa, Víctor). Roma already names people in its content.
  - Children get `family` notes (Phase 12 EXT-07) on the cards where they matter: Sorgeto, Pozzo Vecchio, the Calore, Epomeo, the beaches, the concerts and Napoli Sotterranea.
  - Text never contains a word from the Roma-leak list. Watch out for the real street «Via Roma» in Salerno and Naples: name it differently («el paseo principal», «Via Toledo»).

### Cards (CAMP-02)
- **D-10 — Inventory.** One card per place the itinerary actually visits, grouped by area.

  | Area | Cards |
  |------|-------|
  | Naples | Lungomare Caracciolo; Spaccanapoli; the base district (Vomero); Napoli Sotterranea; Capodimonte (park and Real Bosco); Stadio Diego Armando Maradona (`type: concert`, the two concerts) |
  | Procida | Marina Corricella; Pozzo Vecchio (`nature`); Terra Murata and the lemon groves (if the research justifies them) |
  | Ischia | Monte Epomeo (`nature`); Baia di Sorgeto (`nature`); Forio or the base coves |
  | Salerno | centro storico, Duomo, Castello Arechi |
  | Cilento | Raito and Albori; the northern Cilento coves; Valle del Calore near Felitto (`nature`) |
  | Other | Vesuvius, the Lacryma Christi side (`nature`); Casertavecchia (and Partenio); Lago d'Averno (`nature`); Antro della Sibilla (Cuma); beach at Miseno |

  - Reuse and rewrite the 11 skeleton cards. Delete the ones that do not fit (for example `rione-sanita`, unless the research makes it the «barrio» on the 25th).
  - Every card has an Italian name, prose, a motif, coordinates and `mapsQuery`.
- **D-11 — Images.** Use the same pattern as Roma: Wikimedia Commons URLs (`upload.wikimedia.org`), with the motif SVG as fallback when the image fails.
  - Each URL must be checked during research or execution (HTTP 200, correct licence and subject). An unverified URL is not published; that card falls back to the motif.
  - No images are downloaded into the repo; this matches Roma and keeps the repo light.
  - Motifs come from the 23 existing ones, including Phase 12's `sea`, `thermal`, `river` and `trail`. **No new motifs:** that would be code and would trigger a 12.x insert.

### Field data and «por confirmar» (CAMP-06)
- **D-12 — Visible marking convention, in content only.**
  - Unconfirmed data carries `**⚠ por confirmar**` inline in Markdown, next to the doubtful value. Example: «Ferry Caremar 12:15 o 13:30 **⚠ por confirmar**».
  - Confirmed data may say where it was checked («horario Caremar 2027, consultado …») when that helps.
  - The same marker everywhere, so a test can count it and so it is obvious on the ground.
  - The data gate should **not** fail on «por confirmar» (it is legitimate content), but a test may check that it never appears in Roma.
- **D-13 — The research must verify** (ROADMAP «Research: sí»):
  - Vehicle restrictions on Procida and Ischia in summer 2027: non-resident car ban and dates.
  - Caremar/Medmar and SNAV/Alilauro routes, piers (Porta di Massa, Beverello, Pozzuoli) and the Naples→Procida→Ischia→Naples crossing times.
  - Whether Sorgeto is safe and accessible at night with children: steps, sea state, water temperature, lighting.
  - The 2027 dates of Ultimo and Pinguini Tattici Nucleari at the Maradona.
  - The «Spaccanapoli» popular race on Sunday 20 June 2027: whether it exists and on what date.
  - Alibus (route, fare, stops).
  - ZTL in Naples and Salerno.
  - Typical June heat.
  - Anything not verifiable today (2027 timetables not yet published) gets the D-12 marker. **Never invent** a time, price, phone number or address.
- **D-14 — Real establishments only if verified.** Gastronomía and Reservas name a specific restaurant, pizzeria, dairy or trattoria only if the research confirms it exists (official site or several reliable sources), with its address.
  - Where nothing is verified, the card describes the kind of place, where to look («una pizzería de barrio en el Vomero»), and «a elegir sobre el terreno».
  - Never make up names, as Roma's prose could do with real places it had visited.

### Gastronomía, Reservas, Práctica (CAMP-03/04/05)
- **D-15 — Gastronomía** uses the `food` collection with Roma's shape (`group`, `badge`, `badgeKind`, `desc`, `plato`, `footer`, `itineraryTag`, `mapsQuery`).
  - Planned groups: neighbourhood pizzerias (Naples); mozzarella di bufala and roadside dairies (on the way on the 25th, the Salerno and Paestum plain); island taverns and kitchens (Procida, Ischia: coniglio all'ischitana, lemons); Salerno taverns; Cilento mountain trattorias (Calore).
  - `badgeKind` uses existing enum values. If a new one is needed, that is a schema change, which means a 12.x insert or reusing the closest value.
- **D-16 — Reservas** uses `reference/reservas.yml` with Roma's shape.
  - `confirmed`: only what really is confirmed. As far as we know that is the flights (19, arriving 16:35, and 28 at 09:55 to Palma), all with the D-12 marker if the booking is unconfirmed.
  - The pending list / table: accommodation per base (Naples ×2, Procida, Ischia, Salerno), ferries (20, 21, 23), the car (pickup 23 at Capodichino, return 26, D-01), concerts (25 Ultimo, 27 PTN), Napoli Sotterranea, and restaurants that need booking.
- **D-17 — Práctica** uses `reference/practica.yml` with Roma's shape.
  - Topics: ferries (companies, piers, buying tickets, luggage); driving, ZTL and parking (Naples, Salerno, the Amalfi coast), and why there is no car on the islands; heat and sun in late June; footwear (volcanic rock, steps, Sorgeto); children (water, shade, siesta, Sorgeto at night, stadiums); concerts at the Maradona (getting there by Cumana or metro, getting back late).
- **D-18 — `trip.yml` rewritten** to be publishable:
  - `title`, `heroMeta`, `quote`/`quoteAttr`. The current one, «Ver Nápoles y después morir», may stay with a correct attribution.
  - `infoCards` filled in, as in Roma. `howTo` with real text and **no sentinel**. `mapLegend` coherent with the markers present (red cards, teal nature, concert).
  - `footer`.
  - Portada fields (Phase 11): `startDate: '2027-06-19'`, `endDate: '2027-06-28'`, `destinations`, and a `summary` **without links**.
  - The map center and zoom must keep the bounds: Naples, the islands, Salerno and the Cilento.
  - `sections` and `mapExtras` only if Roma's pattern requires them.

### Process and parity
- **D-19 — Roma does not change** (carried over from Phase 12 D-17/D-18).
  - No golden is re-baselined, and `--update-snapshots` is forbidden.
  - No `tests/parity/` spec is edited.
  - `content/trips/{roma,prueba,forma}` are not touched.
  - `app/assets/css/{base,tokens,fonts,leaflet}.css` stay unchanged.
  - **No code changes**: no `app/`, `shared/schemas.ts` or `nuxt.config.ts`, beyond what D-02 strictly requires in tests. If something forces a code change, stop and propose a 12.x insert.
- **D-20 — Tests.**
  - `tests/trips/campania.spec.ts` (24 skeleton tests) is updated to the real content. Selectors on placeholder text are rewritten; the checks of the 7 EXT shapes are kept.
  - The data gate (`tests/data/trips.ts`) has to pass for all 10 days and every card, including refs inside options and `stay-ref`.
  - Each content wave is checked with `pnpm test:data` and `pnpm test:trips`. The full gate (`pnpm verify`, parity 110/110) runs after publishing.
  - `tests/README.md` updates its counts if they change.
- **D-21 — Process** (Phase 12 D-19).
  - Node 22 (`~/.nvm/versions/node/v22.20.0/bin`).
  - Run `rm -rf .data .nuxt .output` before any generate or after editing YAML.
  - Never run `test:trips` at the same time as generate or verify.
  - Branch `release/nuxt-4`.
  - Sequential execution (`use_worktrees=false`).
  - Commits end with the Co-Authored-By trailer.
  - `.planning/state.json` and `.planning/ui-reviews/` stay untracked.

### Claude's Discretion
- The exact text of each day and card, within the tone of D-09.
- Which places beyond D-10 deserve their own card, and how cards and food are grouped.
- `pace` per row (optimistic/neutral/slow) and what summary mode shows, following Roma's pattern.
- Each card's motif among the 23 existing ones.
- The `infoCards` and the quote.
- How the work is split into plans and waves. Suggested order:
  1. Research results into the field data.
  2. `trip.yml` and stays.
  3. Days 19–23.
  4. Days 24–28.
  5. Cards.
  6. Gastronomía.
  7. Reservas and Práctica.
  8. Publication and the final gate.

### Deferred Ideas (OUT OF SCOPE)
- Stay markers on the map, from Phase 12 D-08 (P2).
- An A/B selector that hides the option not chosen (TRIP-02, future).
- Locally hosted images for real offline use (v2/PWA).
- A real fix for WR-01 (transit with waypoints) and IN-04 (plane days hiding the route). Mitigated by content in D-08.
- An `artists` collection for Campania (art and architecture, like Roma's). It is not in CAMP-01..06.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAMP-01 | La guía de Campania tiene los 10 días (19–28 junio 2027) con su timeline, horarios y logística (vuelos, ferris, coche, conciertos), en el tono slow/auténtico del planning | §Content Contract (DaySchema, TimelineRow, ChoiceRow), §Day-by-day blueprint, §Field Data (ferries, Alibus, concerts, Spaccanapoli), §Test impact |
| CAMP-02 | Cada lugar relevante del itinerario tiene ficha con imagen, nombre italiano, prosa y enlace a Google Maps (Nápoles, Procida, Ischia, Salerno, Cilento, Vesubio, Casertavecchia, Campos Flégreos) | §Card inventory (24 cards, verified image URLs, coordinates), §MonumentSchema contract |
| CAMP-03 | La guía de Campania incluye su sección de gastronomía (pizzerías de barrio, mozzarella di bufala, tabernas, trattorias de monte…) | §FoodSchema contract, §Verified establishments, §groupFood ordering pitfall |
| CAMP-04 | La sección de reservas de Campania recoge alojamientos por base, ferris, coche de alquiler, conciertos y vuelos | §ReservasSchema contract, **§Schema gap G-1 (static Roma chrome)** |
| CAMP-05 | La sección práctica de Campania cubre ferris, conducción/ZTL y restricciones en islas, calor, calzado y consejos con niños | §PracticaSchema contract, §Field Data (island restrictions, ZTL, heat, concerts transport) |
| CAMP-06 | Los datos de campo críticos (horarios de ferry, fechas de conciertos, acceso a Sorgeto de noche, coche en islas) están verificados o marcados como «por confirmar» en la guía | §Field Data verification table, §Marker convention (Md-only fields), §Validation (marker count/absence test) |
| ROUTE-05 (consequence, D-02) | Publicar Campania al cerrar la fase | §Publication test impact (build-isolation, tripManifest.spec, tests/trips/portada.spec, campania.spec) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Stack is Nuxt 4. Static output (`nuxt generate`), deployed to GitHub Pages. There is no server in 1.0. The deploy is out of scope here.
- **Parity:** Roma must stay identical. No golden re-baseline, no `--update-snapshots`, and no edit to any `tests/parity/` spec.
- **Offline:** Leaflet is local, images fall back to the motif, and an offline map banner exists. Hero images are third-party (Wikimedia) with an `onerror` fallback. `@nuxt/image` is **not** used on them.
- **Data:** content is structured, typed YAML (`type:'data'`) with Markdown-inline prose rendered by `<MDC>`. Import `z` from `zod`, never from `@nuxt/content` (relevant only to a 12.x insert).
- **CSS:** hand-written CSS is kept. No Tailwind or UnoCSS.
- **Process:**
  - Work happens on the release branch `release/nuxt-4`; `main` stays untouched.
  - Use the GSD workflow entry points for edits.
- **Memory (user's auto-memory, binding in practice):**
  - Builds need Node 22.
  - Clear `.data .nuxt .output` after any YAML edit before generate or gate.
  - Run sequentially (`use_worktrees=false`).
  - Preview the build under a `guiaRoma/` subdirectory.
  - Pragmatic parity: when a fix is disproportionately costly, surface the cost and benefit and checkpoint early rather than deep-diving alone.
  - The decision-coverage gate matches D-IDs only in `must_haves.truths`, so every D-ID must be cited there.

## Content Contract (Part A: what the YAML must look like)

### A.1 Enum values available (verbatim from source)

The values below were read this session. Copy them exactly.

- **Motif** (23) [VERIFIED: shared/schemas.ts:35-41]:
  `'dome', 'pantheon', 'arch', 'fountain', 'obelisk', 'statue', 'painting', 'church', 'fortress', 'temple', 'garden', 'keyhole', 'mask', 'monument', 'rooftops', 'library', 'tower', 'stairs', 'coffee', 'sea', 'thermal', 'river', 'trail'`
- **Pace** [VERIFIED: shared/schemas.ts:42]: `z.enum(['all', 'medium', 'slow-only'])`.
  - Visibility follows `isVisible` [VERIFIED: app/utils/pace.ts]: `optimistic` shows everything; `neutral` hides `slow-only`; `slow` shows only `all`.
- **PlaceType** [VERIFIED: shared/schemas.ts:46]: `z.enum(['card', 'guided', 'concert', 'nature'])`.
  - Marker colours [VERIFIED: app/utils/mapMarkers.ts:50-55]: `card: { bg: '#8b3a3a' }`, `guided: { bg: '#a07c4a' }`, `concert: { bg: '#5a7a3a' }`, `nature: { bg: '#2f6f73' }`.
- **TransportVariant** [VERIFIED: shared/schemas.ts:57]: `z.enum(['taxi', 'walk', 'train', 'ferry', 'car', 'bus', 'bike', 'plane'])`.
  - It is optional: with no variant the row keeps the base style.
- **StatVariant** [VERIFIED: shared/schemas.ts:58]: `z.enum(['walk', 'train', 'taxi', 'metro', 'ticket', 'ferry', 'car', 'bus', 'bike', 'plane'])`.
- **RouteMode** [VERIFIED: shared/schemas.ts:61]: `z.enum(['walking', 'driving', 'transit'])`.
  - It lives in `route: z.strictObject({ mode: RouteMode.optional(), enabled: z.boolean().optional() })` [VERIFIED: shared/schemas.ts:260-263].
- **Meta item level** [VERIFIED: shared/schemas.ts:143]: `z.enum(['ok', 'warn', 'plain']).default('plain')`.
- **Light item kind** [VERIFIED: shared/schemas.ts:243]: `z.enum(['see', 'move', 'skip', 'care', 'rest'])`.
- **Food badgeKind** [VERIFIED: shared/schemas.ts:278]: `z.enum(['trattoria', 'deli', 'quinto', 'ghetto', 'pizza', 'gelato', 'caffe', 'pasticceria'])`.
  - For Campania use `pizza`, `trattoria`, `deli` (dairy/caseificio, the closest value), and optionally `caffe`, `pasticceria`, `gelato`.
  - `quinto` and `ghetto` are Roman-specific; do not use them.
- **Reservas `confirmed[].group`** [VERIFIED: shared/schemas.ts:364]: `z.enum(['mesas', 'visitas'])`.
- **Reservas `table[].badgeKind`** [VERIFIED: shared/schemas.ts:372]: `z.enum(['urgent', 'done', 'rec']).optional()`.
- **Práctica `media[].category`** [VERIFIED: shared/schemas.ts:386]: `z.enum(['libros', 'peliculas', 'series', 'playlist'])`.
- **Slug regexes:**
  - `DAY_SLUG_RE = /^[a-z0-9-]+$/` [VERIFIED: shared/schemas.ts:195]
  - `STAY_SLUG_RE = /^[a-z0-9-]+$/` [VERIFIED: shared/schemas.ts:211]
  - `TRIP_SLUG_RE = /^[a-z0-9]+$/` [VERIFIED: shared/schemas.ts:443]
  - `pill: z.string().regex(/^\S(?:.*\S)?$/).optional()` [VERIFIED: shared/schemas.ts:231]
- **Choice** [VERIFIED: shared/schemas.ts:176-185]:
  - `ChoiceOption = z.strictObject({ label: z.string().min(1), title: Md.min(1), rows: z.array(BaseTimelineRow).min(1) })`
  - `ChoiceRow = z.strictObject({ kind: z.literal('choice'), heading: Md.min(1).optional(), options: z.array(ChoiceOption).min(2).max(3) })`
  - It is strict: a `pace` on the choice is an error. There is no nesting.

### A.2 Gate rules that apply to every trip (tests/data/trips.ts)

`RULES` [VERIFIED: tests/data/trips.ts:91-95]:
`'yaml-parse', 'yaml-object', 'trip-yml', 'trip-slug', 'trip-field', 'stray-file', 'reserved-key', 'unknown-key', 'basename-slug', 'dup-id', 'fixed-anchor', 'ref', 'anchor', 'cross-trip-link', 'day-order', 'day-pill', 'trip-dates', 'trip-summary-link', 'stay-ref', 'stay-dup'`

What each rule means for Campania:

| Rule | Concrete constraint |
|------|---------------------|
| `stray-file` | Only `trip.yml`, `days/*.yml`, `monuments/*.yml`, `food/*.yml`, `artists/*.yml` and `reference/*.yml` (tests/data/trips.ts:64-71). No other YAML anywhere under `content/trips/campania/`. |
| `trip-field` | Every non-trip file has `trip: campania`. |
| `reserved-key` / `unknown-key` | Top-level keys are checked only against the row schema. Never use `id`, `meta`, `stem`, `extension` or `__hash__` (trips.ts:87). A nested `meta` inside a transport mode is legitimate. |
| `basename-slug` | The file name equals `slug` (e.g. `monuments/baia-di-sorgeto.yml` has `slug: baia-di-sorgeto`). |
| `dup-id` | Slugs are unique across days, monuments, food and artists of the trip. A food slug must not equal a monument slug; use the `g-` prefix as Roma does. |
| `fixed-anchor` | No slug equals `inicio`, `mapa`, `reservas`, `gastronomia`, `practica`, `arte`, `arquitectura`, `leaflet-map`, `map-offline-banner`, `light-toggle`, `resumen-toggle`, `back-btn`, `search`, `search-results` or `nav-pills`, and none starts with `note-` (trips.ts:81-89). |
| `ref` | Every `day.cards[]` entry is a monument slug. Every `stop.ref` and food `entries[].ref`, **including inside choice options** (via `timelineRowsOf`, trips.ts:125-135), is a monument or food slug. Every `reservas.table[].ref` is a monument or food slug (trips.ts:350-354). |
| `day-order` | Orders are unique and contiguous 1..N **at every commit** (trips.ts:363-368). |
| `day-pill` | Pills are unique after NFC, trim and lower-casing (trips.ts:372-388). |
| `trip-dates` | `endDate >= startDate`. |
| `trip-summary-link` | `summary` has no `[t](x)`, no `<scheme:…>` and no bare `http(s)://` or `www.` (trips.ts:211-215). |
| `stay-ref` / `stay-dup` | `day.stay` is exactly a slug of `trip.stays`, and stay slugs are unique. |
| `anchor` | Every `[t](#x)` in **any string of any file** must resolve to an entity slug of this trip or to a section that **exists for this trip's data**. `#reservas` only exists once `reference/reservas.yml` exists, `#gastronomia` only once ≥1 food file exists, and `#practica` only once `reference/practica.yml` exists (trips.ts:419-436). **There is no `#arte` or `#arquitectura`** (no artists). |
| `cross-trip-link` | Link targets are only `#id` or `http(s)://` (trips.ts:437-439). A Google Maps URL in prose is allowed; `/trips/roma` is not. |

`tests/data/schema.spec.ts` validates every file with the strict schemas, so a stray key inside a `choice`/stay/route fails with `Unrecognized key` [VERIFIED: shared/schemas.ts:166-175 comments].

### A.3 Which fields render Markdown and which are plain text (critical for the D-12 marker)

Template reads this session [VERIFIED: app/components/*.vue via grep of `{{ }}` and `<MDC`]:

| Rendered as **Markdown** (`**⚠ por confirmar**` shows as bold) | Rendered as **plain text** (`**` would appear literally) |
|---|---|
| `stop.note`; transport `modes[].desc`, `modes[].meta`, `footnote`; `meta.items[].text`; food `entries[].desc`, food `footnote`; `reservation.text`; choice `heading`, option `title`; `stats[].text`; `light.items[].text`; monument `sections[].body`, **`facts[].value`** (MonumentCard.vue:293), `family`, `culture`/`sorrentino` text; `infoCards[].value`, `howTo[]`; food card `desc`, `plato`; reservas `intro`, `confirmed[].text`, `table[].desc`; práctica `intro`, `sections[].body`, `media[].items[]`; `stays[].name` | `stop.time`, `stop.title`, `stop.tag`; transport `header`, `modes[].icon`, `modes[].tag`; food-row `header`, `entries[].name/badge/time`; choice option `label`; day `eyebrow`, `roman`, `title`, `subtitle`, `light.title`; monument `name`, `italian`, `badge`, `day`; trip `title`*, `decoration`, `heroMeta`, `quote`, `quoteAttr`, `infoCards[].label`; food card `badge`, `name`, **`address`**, **`footer`**, `itineraryTag`; reservas **`when`**, `table[].name`, `table[].badge` |

\* `title` is rendered with MDC in the hero h1 but plain in the tab and brand.

**Rule:** put `**⚠ por confirmar**` only in Markdown fields. A doubtful time goes in `time: '12:15'` with the marker in that row's `note`. A doubtful address goes in `desc` while `address` stays descriptive. **`stays[].area` and `stays[].note` are stored but never rendered** (shared/schemas.ts:207-208, D-08 Phase 12). A «por confirmar» placed only there is invisible, so repeat it in the day's prose or in Reservas.

**Marker string:** use exactly `⚠ por confirmar` (U+26A0 followed by a space), without the emoji variation selector U+FE0F. Roma already contains `por confirmar` twice [VERIFIED: content/trips/roma/food/g-bar-musa.yml:7,10 («(dirección por confirmar)», «_(Dirección por confirmar — …)_»)]. A Roma-absence test must therefore look for the **full marker `⚠ por confirmar`**, never the bare words.

### A.4 Static chrome that content cannot change

Everything else renders from data except these strings:
- **ReservasSection.vue:73** «✅ Ya reservado · 3 comensales»
- **:81** «🎟️ Visitas y entradas reservadas»
- **:91** «Restaurantes · cuándo reservar y con cuánta antelación»
- GastroSection.vue:46 «Dónde comer». This one is generic and fine.
- The pill label «Pratica». This is intentional chrome (tripLayout.ts STRUCTURAL_LABELS).
- The «Caminar menos» banner, which says «cada día muestra una Versión ligera» (DaySection.vue:98).

Because of that banner, add a `light` block to each Campania day so the promise holds. This is optional but coherent; Roma has one per day.

### A.5 Schema gaps (must go to a 12.x insert; do not force the schema here)

| # | Need (from D-16) | Why content cannot express it | Proposal |
|---|------------------|-------------------------------|----------|
| **G-1** | Reservas for a family trip: flights, ferries, beds, car, concerts | The headings are static Roma text: «Ya reservado · **3 comensales**» renders even with no `mesas` entries, and an empty `<ul>` follows it. `group` only allows `mesas`/`visitas`. The table header says «Restaurantes · …» while the rows would be ferries and beds. | **Phase 12.1 (small):** add optional `ReservasSchema` fields (e.g. `confirmedTitle`, `visitsTitle`, `tableTitle`; and/or make `confirmed` groups render only when non-empty) with the **current Roma strings as defaults**, so Roma's DOM is byte-identical. It touches `shared/schemas.ts`, `ReservasSection.vue` and `ReferenceRowSchema`, plus one unit or e2e test. Also add the fields to the `ReferenceRowSchema` superset (shared/schemas.ts:401-429) or Content returns null. **Alternative without code:** put the flights and the car in `visitas` and accept the false «3 comensales» heading. That gives wrong information on the ground, so it is not recommended. **Needs a user decision (checkpoint).** |

Everything else in D-10, D-15 and D-17 fits the existing schema. There are no new motifs, no new `badgeKind` (use `deli` for dairies) and no new transport variants. Two smaller limits are not gaps:
- Food `address` is a required string. For unverified places, write a descriptive address such as «Vomero · a elegir sobre el terreno».
- `media` can be `[]`.

## Skeleton Inventory and Disposition (content/trips/campania/**)

[VERIFIED: find + cat of every file this session]

| File | Today | Disposition |
|------|-------|-------------|
| `trip.yml` | `draft: true`, `infoCards: []`, howTo with `CAMPANIA-CENTINELA-12A`, map center `{lat: 40.7, lng: 14.45}` zoom 9, 4 stays (`napoles`, `procida`, `ischia`, `salerno`), `pageTitle`, `brand`, `mapLegend`, `footer` | Rewrite (D-18). **Keep the sentinel sentence and `draft: true` until the publication plan** (see Pitfall 1). |
| `days/sabado-19.yml` (order 1) | Placeholder; plane→bus→no-variant walk | Rewrite as day 1. Keep the plane-then-bus-then-no-variant shape (tests rely on it). |
| `days/domingo-20.yml` (order 2) | Placeholder; ferry + bike + 3 cards | Rewrite as day 2. Keep exactly one ferry and one bike transport and stat. Add no `route`. |
| `days/martes-22.yml` (order 3) | Placeholder | Rewrite as **order 4**. |
| `days/jueves-24.yml` (order 4) | Placeholder; choice A/B + 3-option choice | Rewrite as **order 6** (see the shape contract below). |
| `days/viernes-25.yml` (order 5) | Placeholder; `route.mode: driving`; cards `vesubio`, `rione-sanita` | Rewrite as **order 7**. |
| New | — | `lunes-21` (3), `miercoles-23` (5), `sabado-26` (8), `domingo-27` (9), `lunes-28` (10) |
| `monuments/*.yml` (11) | `hero.src: https://example.invalid/...`; some coordinates are off | Rewrite all 11 (real images below). The skeleton's **`valle-del-calore` coordinates (40.4723, 15.2465) are about 11 km north of Felitto**; OSM gives Felitto at 40.3735,15.2431 and the Gole del Calore oasis at 40.3668,15.2525. `rione-sanita`: **keep** as the 25th's «barrio» (see the card inventory). |

## Card Inventory (CAMP-02): proposal with verified data

**The images** were all checked this session with `HEAD` → **HTTP 200, `image/jpeg`** (generic User-Agent, 2026-11-21). They use the thumbnail form `upload.wikimedia.org/wikipedia/commons/thumb/<h>/<hh>/<File>/960px-<File>`, which matches Roma, e.g. `…/thumb/0/06/Rome_Pantheon_front.jpg/960px-Rome_Pantheon_front.jpg` in Roma's pantheon.yml. Licences come from the Commons API `extmetadata.LicenseShortName`. **Subject was checked by file title and description only, not visually.** The executor or UAT should eyeball each hero once.

**The coordinates** come from OpenStreetMap Nominatim (2026-11-21) unless marked otherwise.

Romans are suggested in visit order. They must be **unique**: the tests' `markerByRoman` requires exactly one marker per numeral. The stadium takes `♪`, as Roma's concert card does (`auditorium.yml`: `roman: ♪`, `type: concert`, `badge: concierto`, `motif: monument`).

| # | slug | name / italian | type · motif | day(s) | coords (lat,lng) | hero.src (verified 200) | licence |
|---|------|----------------|--------------|--------|------------------|-------------------------|---------|
| I | `lungomare-caracciolo` | Lungomare Caracciolo / Via Francesco Caracciolo · Chiaia | card · sea | Sáb 19 | 40.8320,14.2305 | `https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Panoramica_dal_lungomare_di_Napoli_sul_golfo.jpg/960px-Panoramica_dal_lungomare_di_Napoli_sul_golfo.jpg` | CC BY-SA 4.0 |
| II | `vomero` | El Vomero / Vomero · Napoli | card · fortress (Castel Sant'Elmo) | Sáb 19 | 40.8438,14.2316 (Piazza Vanvitelli) | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Napoli_-_Panorama_dal_Vomero.JPG/960px-Napoli_-_Panorama_dal_Vomero.JPG` | CC BY-SA 4.0 |
| III | `spaccanapoli` (keep slug) | Spaccanapoli / Via Benedetto Croce · Centro storico | card · church | Dom 20 | 40.8480,14.2542 | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Spaccanapoli_verso_Castel_Sant%27Elmo.jpg/960px-Spaccanapoli_verso_Castel_Sant%27Elmo.jpg` | Public domain |
| IV | `marina-corricella` (keep) | Marina Corricella / Marina di Corricella · Procida | card · rooftops | Dom 20 | 40.7616,14.0290 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Procida_Marina_Corricella.jpg/960px-Procida_Marina_Corricella.jpg` | CC BY-SA 4.0 |
| V | `pozzo-vecchio` (keep) | Pozzo Vecchio / Spiaggia del Pozzo Vecchio · Procida | nature · sea | Dom 20 | 40.7627,14.0089 | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Cala_Pozzo_Vecchio_-_Procida.jpg/960px-Cala_Pozzo_Vecchio_-_Procida.jpg` | CC BY 2.0 |
| VI | `terra-murata` | Terra Murata / Terra Murata · Procida | card · fortress | Lun 21 | 40.7608,14.0339 | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Terra_Murata_%28Procida%29%2C_2016.jpg/960px-Terra_Murata_%28Procida%29%2C_2016.jpg` | CC BY-SA 4.0 |
| VII | `forio` | Forio y el Soccorso / Santa Maria del Soccorso · Forio d'Ischia | card · church | Lun 21 / Mié 23 | 40.7371,13.8545 | `https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Chiesa_del_soccorso_forio_d%27ischia.JPG/960px-Chiesa_del_soccorso_forio_d%27ischia.JPG` | Public domain |
| VIII | `monte-epomeo` (keep) | Monte Epomeo / Monte Epomeo · Serrara Fontana | nature · trail | Mar 22 | 40.7302,13.8945 (peak) | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Monte_Epomeo_da_Forio.jpg/960px-Monte_Epomeo_da_Forio.jpg` | Public domain |
| IX | `baia-di-sorgeto` (keep slug, type nature, motif thermal; tests require these) | Baia di Sorgeto / Baia di Sorgeto · Panza · Forio | nature · thermal | Mar 22 | 40.6992,13.8784 (OSM «Sorgente Sorgeto», hot_spring) | `https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Baia_di_sorgeto%2C_sorgente_termale_che_sbuca_direttamente_in_mare.jpg/960px-Baia_di_sorgeto%2C_sorgente_termale_che_sbuca_direttamente_in_mare.jpg` | CC BY 3.0 |
| X | `salerno-centro-storico` | Centro storico de Salerno / Centro storico · Via dei Mercanti | card · arch | Mié 23 | 40.6789,14.7605 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Salerno_-_Veduta_del_centro_storico.jpg/960px-Salerno_-_Veduta_del_centro_storico.jpg` | CC BY-SA 3.0 |
| XI | `duomo-di-salerno` (keep; a CITY_CARDS test needs it) | Duomo di Salerno / Cattedrale di San Matteo · Salerno | card · church | Jue 24 | 40.6802,14.7594 (Piazza Alfano I) | `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Cattedrale_di_Salerno_05.jpg/960px-Cattedrale_di_Salerno_05.jpg` | CC BY 4.0 |
| XII | `raito` (keep; tests need it) | Raito y Albori / Raito · Albori · Vietri sul Mare | card · rooftops | Jue 24 (A) | 40.6669,14.7156 (Raito); Albori 40.6701,14.7090 | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Costiera_amalfitana_-_Albori_%28Vietri_sul_Mare%29_-_2019_by-RaBoe_118.jpg/960px-Costiera_amalfitana_-_Albori_%28Vietri_sul_Mare%29_-_2019_by-RaBoe_118.jpg` (alt: `…/thumb/f/f9/Raito.jpg/960px-Raito.jpg`) | CC BY-SA 3.0 de (alt CC BY-SA 3.0) |
| XIII | `baia-di-trentova` | Baia di Trentova / Spiaggia di Trentova · Agropoli · Cilento | nature · sea | Jue 24 (A) | 40.3437,14.9724 | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Spiaggia_di_Trentova%2C_Agropoli_%28SA%29.jpg/960px-Spiaggia_di_Trentova%2C_Agropoli_%28SA%29.jpg` | CC BY-SA 4.0 |
| XIV | `valle-del-calore` (keep) | Valle del Río Calore / Gole del Calore · Felitto · Cilento | nature · river | Jue 24 (B) | 40.3668,15.2525 (Oasi Gole del Calore); medieval bridge path 40.3780,15.2384 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Le_gole_del_Calore.jpg/960px-Le_gole_del_Calore.jpg` | CC BY-SA 4.0 |
| XV | `castello-arechi` (keep) | Castello di Arechi / Castello di Arechi · Salerno | card · fortress | Jue 24 | 40.6845,14.7547 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Arechi_Castle_%28Salerno%29.jpg/960px-Arechi_Castle_%28Salerno%29.jpg` | CC BY 4.0 |
| XVI | `vesubio` (keep slug; change type to `nature` per D-10) | Viñedos del Vesubio / Vigneti del Lacryma Christi · Boscotrecase | nature · garden | Vie 25 | 40.7743,14.4620 (Boscotrecase) | `https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Boscoreale_-_vigneti_Lacryma_Christi_del_Vesuvio.jpg/960px-Boscoreale_-_vigneti_Lacryma_Christi_del_Vesuvio.jpg` | CC BY 2.0 |
| XVII | `rione-sanita` (keep as the 25th's «barrio») | Rione Sanità / Rione Sanità · Napoli | card · stairs | Vie 25 | 40.8590,14.2497 (skeleton; [ASSUMED]) | `https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Palazzo_dello_Spagnuolo._%286748%29.jpg/960px-Palazzo_dello_Spagnuolo._%286748%29.jpg` (alt `…/thumb/0/08/Rione_sanit%C3%A0_1.jpg/960px-Rione_sanit%C3%A0_1.jpg`) | CC BY-SA 4.0 |
| ♪ | `stadio-maradona` | Stadio Diego Armando Maradona / Piazzale Vincenzo Tecchio · Fuorigrotta | **concert** · monument; `badge: concierto` | Vie 25 / Dom 27 | 40.8280,14.1929 | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Stadio_Maradona_%28Napoli%29%2C_Agosto_2025_%281%29.jpg/960px-Stadio_Maradona_%28Napoli%29%2C_Agosto_2025_%281%29.jpg` | CC0 |
| XVIII | `casertavecchia` | Casertavecchia / Borgo di Casertavecchia · Duomo di San Michele | card · church | Sáb 26 (1) | 41.0973,14.3670 (Duomo) | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Casertavecchia_duomo_ext.jpg/960px-Casertavecchia_duomo_ext.jpg` | CC BY-SA 3.0 |
| XIX | `lago-d-averno` | Lago d'Averno / Lago d'Averno · Pozzuoli | nature · trail | Sáb 26 (2) | 40.8388,14.0764 | `https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Lago_d%27Averno_1.jpg/960px-Lago_d%27Averno_1.jpg` | CC BY-SA 3.0 |
| XX | `antro-della-sibilla` | Antro de la Sibila / Antro della Sibilla · Parco Archeologico di Cuma | card · temple | Sáb 26 (2) | 40.8491,14.0488 | `https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Cuma_-_Antro_della_Sibilla.JPG/960px-Cuma_-_Antro_della_Sibilla.JPG` | CC BY-SA 4.0 |
| XXI | `spiaggia-di-miseno` | Playa de Miseno / Spiaggia di Miliscola · Miseno · Bacoli | nature · sea | Sáb 26 (2) | 40.7868,14.0805 (OSM «Spiaggia di Miseno») | `https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Bacoli_%28NA%29._Lago_Miseno%2C_spiaggia_di_Miliscola_e_Capo_Miseno.jpg/960px-Bacoli_%28NA%29._Lago_Miseno%2C_spiaggia_di_Miliscola_e_Capo_Miseno.jpg` | CC BY-SA 4.0 |
| XXII | `napoli-sotterranea` | Napoli Sotterranea / Napoli Sotterranea · Piazza San Gaetano | card · stairs | Dom 27 | 40.8509,14.2574 (Piazza San Gaetano) | `https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Napoli_Sotterranea_1.jpg/960px-Napoli_Sotterranea_1.jpg` | CC BY 4.0 |
| XXIII | `capodimonte` | Capodimonte / Real Bosco di Capodimonte · Napoli | card · garden | Dom 27 | 40.8743,14.2551 | `https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Viale_Bosco_di_Capodimonte_di_Napoli.jpg/960px-Viale_Bosco_di_Capodimonte_di_Napoli.jpg` | Public domain |

That is 24 cards, 9 of them `nature` (the tests require ≥3), plus 1 concert.

- **Card placement:** each card appears in **exactly one** day's `cards[]`. `MonumentCard` renders `id=slug`, so listing a card in two days duplicates the DOM id and breaks `[id="…"]` count assertions. For the stadium, list it in `viernes-25.cards`; on day 27 use a `stop` with `ref: stadio-maradona`, which links back to it, and set `day: 'Viernes 25 / Domingo 27'`. This follows Roma's pattern, e.g. `pantheon.yml` with `day: Viernes / Sábado`.
- **Card count vs markers:** every monument is a marker. The tests assert `markers == MONUMENTS.length`, so **do not add `mapExtras`**. IN-07 also warns that a `nature` mapExtra renders a broken popup link.
- **Map bounds:** lat 40.3437 (Trentova) to 41.0973 (Casertavecchia); lng 13.8545 (Forio) to 15.2525 (Calore). Recommended `map: { center: { lat: 40.72, lng: 14.55 }, zoom: 9 }`. `fitBounds(...).pad(0.1)` then frames everything (LeafletMap.client.vue:132).
- **Partenio:** no card. Mention it in the Casertavecchia prose (D-05 «optional extra»).
- **Licence note:** Roma hotlinks without credit lines. CC BY and BY-SA formally require attribution; see Open Question 4.

## Day-by-day Blueprint (CAMP-01): structure that satisfies the gate and the kept EXT tests

This is the recommended skeleton. Prose is Claude's discretion (D-09). Doubtful values carry `**⚠ por confirmar**` in a Markdown field.

| order · slug · pill | stay | route | key rows | cards |
|---|---|---|---|---|
| 1 · `sabado-19` · `Sáb 19` | napoles | `{ enabled: false }` (plane day, IN-04) | `transport plane` («Vuelo a Nápoles-Capodichino», llegada 16:35 ⚠ in desc) → **directly followed by** `transport bus` (Alibus aeropuerto → Piazza Garibaldi) → `transport` **without variant** (Metro Línea 1 Garibaldi → Vanvitelli, or the funicular; a natural fit for the "no variant" test) → stops at the Lungomare at sunset and the Vomero | lungomare-caracciolo, vomero |
| 2 · `domingo-20` · `Dom 20` | procida | **none** (the test expects `route` undefined; the ferry hides it) | stop Spaccanapoli race (time `08:30`, note: the 2026 edition was Sunday 21 June 2026 from 08:00; the 2027 date is ⚠) → `transport walk` to Porta di Massa → **exactly one** `transport ferry` (Caremar 12:15 o 13:30 ⚠) → **exactly one** `transport bike` → stops at Pozzo Vecchio and Corricella. Stats: **exactly one** `ferry` and one `bike` stat. | spaccanapoli, marina-corricella, pozzo-vecchio |
| 3 · `lunes-21` · `Lun 21` | ischia | auto (ferry) | morning Terra Murata and the lemon groves → `transport ferry` Procida → Ischia (Caremar; traghetto ~30 min / aliscafo 15–20 min; 15:45/17:15 ⚠; arrival port Ischia Porto or Casamicciola ⚠) → evening in Forio | terra-murata, forio |
| 4 · `martes-22` · `Mar 22` | ischia | `{ mode: transit }` (exactly 2 stops, so WR-01 does not apply) or `{ enabled: false }` | Epomeo from Fontana (EAV bus) → lunch → Sorgeto at dusk/night (the family box carries the safety notes ⚠) | monte-epomeo, baia-di-sorgeto |
| 5 · `miercoles-23` · `Mié 23` | salerno | auto (ferry) | morning swim near Forio (stop `ref: forio`; no new card) → `transport ferry` Ischia → Napoli (⚠) → `transport bus` Alibus from the port to the airport (the Alibus does stop at Beverello and Porta di Massa) → stop 16:00 Arantxa + car pickup (⚠ desk) → `transport car` to Salerno → centro storico at night | salerno-centro-storico |
| 6 · `jueves-24` · `Jue 24` | salerno | `{ mode: driving }` (D-01) | shared stop Duomo (morning) → **choice #1 (no heading)**: «Opción A» / «Opción B» → **immediately followed by choice #2** (`heading: Para cenar, elige una`, **3 options**, one title ≥70 chars) → shared stop Castello di Arechi | duomo-di-salerno, raito, baia-di-trentova, valle-del-calore, castello-arechi |
| 7 · `viernes-25` · `Vie 25` | napoles | `{ mode: driving }` | `transport car` Salerno → Vesuvio → Napoli; stop Vesuvio vineyards; optional mozzarella stop (food row); stop Sanità afternoon (pizza at Concettina); `transport` metro L2 to Campi Flegrei (no variant, or `walk`) → stop concert **Ultimo ⚠ date** (`ref: stadio-maradona`, tag `concierto`) | vesubio, rione-sanita, stadio-maradona |
| 8 · `sabado-26` · `Sáb 26` | napoles | `{ mode: driving }` (the shared cards are <2, so the button hides itself) | shared `transport car` out of Naples → **choice** «Opción 1» Casertavecchia (+Partenio) / «Opción 2» Averno + Cuma + Miseno → shared stop «Devolución del coche · Capodichino ⚠» (`disabled: true`) → shared stop «Noche: regreso y descanso en Nápoles» | casertavecchia, lago-d-averno, antro-della-sibilla, spiaggia-di-miseno |
| 9 · `domingo-27` · `Dom 27` | napoles | `{ enabled: false }` (3 stops across the city; walking would mislead and transit fails, WR-01) | stop 10:00 to the airport with Arantxa and the children (`disabled: true`) → Napoli Sotterranea (booked ⚠) → Capodimonte or bookshops → stop concert **PTN 27 ⚠** (`ref: stadio-maradona`) | napoli-sotterranea, capodimonte |
| 10 · `lunes-28` · `Lun 28` | — | `{ enabled: false }` | `transport plane` 09:55 a Palma (⚠ airline unknown); getting to the airport | — |

### Shape contract that the kept EXT tests impose on real content

Each item below comes from `tests/trips/campania.spec.ts`, read this session. Either satisfy it in content, or rewrite the assertion as the test-change matrix below says.

- **Jueves 24 (EXT-01):**
  - The first `choice` has **no `heading`** and its option labels include exactly `Opción B` (line 246).
  - **Every row of Opción B is hidden at `slow`.** Use only `stop` and `transport` rows with `pace: medium` (or `slow-only`). **No `meta`, `food` or `reservation` row in B**: those have no pace and stay visible (lines 244-257). The Calore trattoria therefore goes in the stop `note`.
  - At least one choice has 3 options with a title of **≥70 characters** (lines 261, 398-402).
  - At least one **contiguous pair** of choices (lines 262-266).
  - At least one choice with a `heading` and one without (lines 306-308).
  - Inside the choices there must be **≥1 `.tl-transport` and ≥1 `.tl-meta`** (resumen test, lines 361-366).
  - **Exactly one `.tl-transport.walk`** inside the Thursday choices. It is the base-colour reference (`BASE_TRANSPORT`, line 662; `toHaveCount(1)`, line 698).
  - `raito` is cited as a `stop.ref` inside the first choice (`a.tl-title[href="#raito"]`, line 380) and listed in `cards`.
  - `valle-del-calore` is in the Thursday `cards` (line 646).
  - Shared cards must be **≥2 and fewer than** all Thursday cards (lines 910-911). Duomo plus Castello as shared stops satisfy this.
  - `stay: salerno` and the stay `name: Salerno` (lines 486-488).
- **Domingo 20:**
  - Exactly 1 `.tl-transport.ferry`, 1 `.tl-transport.bike`, 1 `.day-stats-item.ferry` and 1 `.day-stats-item.bike` (lines 700-711).
  - At least 2 resolved cards; `route` undefined (lines 891-894).
- **Sábado 19:**
  - A top-level transport with no `variant` (line 791).
  - The `plane` transport is immediately followed by a `bus` transport (lines 792-794).
- **Viernes 25:**
  - `route.mode: driving`; at least 2 cards, all of which resolve.
  - The button's point count must equal the card count (line 879), so put **no choice** on this day.
- **All days together:**
  - All 5 new variants (`ferry`, `car`, `bus`, `bike`, `plane`) appear in at least one transport row **and** at least one stat (lines 761-762).
  - The CSS `::before` glyph is prepended, so **never** start a `header` or stat text with the emoji (D-07).
- **Cards:**
  - `baia-di-sorgeto`: `type: nature`, `motif: thermal`, and a `family` note long enough to wrap at 375 px (around three sentences).
  - `spaccanapoli`, `marina-corricella`, `baia-di-sorgeto` and `duomo-di-salerno` must exist (CITY_CARDS, line 997).

## Test Impact Matrix (what changes, when, and how)

| File | Assertion today | Change | When |
|------|-----------------|--------|------|
| `tests/data/build-isolation.spec.ts:107-113` | `trip.yml` contains `CAMPANIA-CENTINELA-12A` **and** `/^draft: true$/m` (outside `skipIf`) | Invert: `trip.yml` has **no** sentinel and **no** `draft: true` (published) | Publication plan |
| `…:145-147` | `.output/public/trips/campania` must NOT exist | Invert: `trips/campania/index.html` exists, contains a real-content marker such as «Baia di Sorgeto», and `trips/campania/_payload.json` exists (prerendered like Roma) | Publication plan |
| `…:165-168` positive control | Roma in the dumps | **Add** `trip` dump contains `trips/campania/` and the `monument` dump contains «Baia di Sorgeto» (Campania is now legitimately public) | Publication plan |
| `…:170-176` offenders scan | Looks for 3 sentinels | Keep the scan (`CAMPANIA_SENTINEL` stays absent; a harmless regression guard) or drop it from the list. Draft isolation stays non-vacuous through prueba and forma: their sentinel `it`s (lines 91-103) and the `no existen trips/prueba ni trips/forma` test (140-143) are unchanged. | Publication plan |
| `…:179-191` D-17 HTML scan | Already excludes `trips/<other>/` HTML | No change needed. It was written anticipating this. The portada `index.html` is still scanned; the Campania portada card uses `trip-index-*` classes, not tripshapes tokens. | — |
| Header comment `…:34-38` | Describes Campania as a draft | Update the prose | Publication plan |
| `tests/unit/tripManifest.spec.ts:51-68` | `{ slug: 'campania', draft: true }`; `prerenderRoutes → ['/', '/trips/roma/']`; `draftExcludes → ['trips/campania/**', 'trips/forma/**', 'trips/prueba/**']` | Becomes `{ slug: 'campania', draft: false }`; `['/', '/trips/campania/', '/trips/roma/']`; `['trips/forma/**', 'trips/prueba/**']` | Publication plan (it is in `test:unit`, part of `verify`) |
| `tests/trips/portada.spec.ts:75-88` (dev, not parity) | `cards toHaveCount(1)`, href roma | 2 cards. `sortTrips` orders by `startDate` descending (app/utils/tripDates.ts:72-), so **campania comes first**, then roma. Hrefs `/guiaRoma/trips/campania/` and `/guiaRoma/trips/roma/`. | Publication plan |
| `tests/trips/campania.spec.ts:188-198` | «la portada de dev no lista el borrador» | Invert: the portada lists the Campania card with href `/guiaRoma/trips/campania/` | Publication plan |
| `tests/trips/campania.spec.ts:435-482` | `order` hard-coded `[1, 2, 3, 4, 5]`; title «los cinco días» | Derive the order from the YAML (contiguous 1..N), then assert N = 10 | The first days plan |
| `tests/trips/campania.spec.ts:906-933` | Thursday route `walking`, title «a pie» | Expect `driving` and «… en coche» (D-01) | The Thursday days plan |
| `tests/trips/campania.spec.ts` header and comments | «borrador … nunca se publica», `example.invalid` | Update the prose. `blockExternal` still aborts Wikimedia, so the motif fallback assertions keep working. | Any plan touching the file |
| `tests/unit/timelineRows.spec.ts:68-86` | Thursday `optionOnlyRefs = {raito, valle-del-calore}`; refs exactly `['duomo-di-salerno', 'raito', 'valle-del-calore', 'castello-arechi']`; Sunday has a ferry and no plane | Update to the real Thursday, e.g. `{baia-di-trentova, raito, valle-del-calore}` and refs `['duomo-di-salerno', 'raito', 'baia-di-trentova', 'valle-del-calore', 'castello-arechi']`. Sunday stays true/false. | The Thursday days plan |
| `tests/unit/searchIndex.spec.ts:211-223` | Sorgeto `family` contains «escalones»; «linterna» appears only in `family` (not in prose, facts or name) | **Content constraint:** keep «escalones» and «linterna» in `family`, and never write «linterna» elsewhere in `baia-di-sorgeto.yml`. Otherwise rewrite the test with other words. | Cards plan |
| `tests/unit/tripStays.spec.ts:61-70` | Every Campania day with a `stay` resolves | No change (generic) | — |
| `tests/data/schema.spec.ts:243-246` | The trip dirs include campania | No change | — |
| `tests/parity/portada.spec.ts` (**read-only**) | Hrefs = the manifest's published trips; Roma card texts; drafts 404 (now prueba and forma); 375 px test rewrites `.first()` card texts; theme bg on `.first()` | Expected to stay **green with no edit**. Campania becomes the first card; the long-text test replaces its texts itself; the bg colour is the same class. **If it fails: stop and report (D-02).** | Verify after publication |
| `tests/parity/shell.spec.ts:212-214` | Roma exists; prueba and forma absent | Unaffected | — |
| `tests/README.md` | §5.1 «44 tests en 4 ficheros … campania.spec.ts, 24»; §5.1 «borradores … `/trips/campania`»; §5.5 the campania sentinel; §5.8 | Update the counts (`campania.spec.ts` total) and the draft/published prose. Gate count stays **110 / 13** unless a parity spec changes (it must not). | Publication plan |

**New Wave-0 test (recommended):** `tests/data/campania-content.spec.ts`, pure Node, reusing `loadTrip('campania')` from `tests/data/trips.ts`. It covers the CAMP-01..06 assertions in the Validation section. It runs in `test:data`, inside `verify`.

## Field Data Verification (Part B, CAMP-06 / D-13)

Every lookup was done on 2026-11-21. «⚠» means the guide must show `**⚠ por confirmar**`.

| Item | Finding | Status | Source |
|------|---------|--------|--------|
| **Ultimo, Maradona** | The official tour calendar (Il Giorno, 6 Jul 2026) lists **Thursday 24 June 2027, Napoli, Stadio Diego Armando Maradona** (tour «Ultimo Stadi 2027 – La favola continua»). Resellers list **25 June 2027 21:00** (Eventworld) and both 24 (19:00) and 25 (21:00) (HelloTickets). TicketOne has **two** Maradona event IDs (21857339, 21920157), consistent with a second date added. No official page confirming the 25th could be read (TicketOne timed out). | **⚠** Conflict with the plan (25). **Ask the user which date their tickets show.** If 24, the Salerno day collides. | [ilgiorno.it](https://www.ilgiorno.it/magazine/ultimo-concerto-san-siro-czb0pdu5), [eventworld](https://www.eventworld.com/ultimo-naples-tickets-25-06-2027/event/430339), [hellotickets](https://www.hellotickets.com/en-en/italy/naples/concerts/ultimo-tickets/585901), [ticketone 21920157](https://www.ticketone.it/en/event/ultimo-stadi-2027-la-favola-continua-stadio-armando-maradona-21920157/) |
| **Pinguini Tattici Nucleari, Maradona** | Tour «Stadi 2027» announced on 10 Mar 2026 (Magellano Concerti), with Naples first listed as TBC. Napolike (4 Jun 2026) reports **27 June 2027 at the Maradona**. No start time. | **⚠** (single source for the Naples date; time unknown) | [napolike](https://www.napolike.it/pinguini-tattici-nucleari-napoli-2027), [lapresse](https://www.lapresse.it/spettacoli/musica/2026/03/10/pinguini-tattici-nucleari-annunciato-il-tour-negli-stadi-per-il-2027/) |
| Maradona works | The city's renovation timeline foresees works opening in January 2027 (tuttomercatoweb, 29 Sep 2026). Effect on summer 2027 concerts is unknown. The concerts are still on sale. | ⚠ (risk note only) | [tuttomercatoweb](https://www.tuttomercatoweb.com/serie-a/napoli-200-maradona-lavori-gennaio-2027-cronoprogramma-2278539) |
| Getting to and from concerts | Metro Linea 2 (Trenitalia) station **Napoli Campi Flegrei**: extra trains for June 2025 Maradona concerts (15 extra runs), extended until about 01:00 for some concerts. **Cumana (EAV) «Mostra»**: extra trains for some concerts and none for others. **Linea 6 «Mostra»** runs on weekdays until about 21:10 (one guide). Taxis at Piazzale Tecchio. 2027 services unknown. | Mechanism verified; 2027 services **⚠** | [trenitalia 2025-05-28](https://www.trenitalia.com/it/chi-siamo/comunicati-stampa/20250528-corse-straordinarie-per-i-concerti-di-giugno-allo-stadio-maradona.html), [napolike Cumana](https://www.napolike.it/concerto-liberato-stadio-maradona-eav-cumana-treni-straordinari), [parkingmycar](https://www.parkingmycar.it/blog/come-arrivare-allo-stadio-maradona/) |
| **«Spaccanapoli» race** | **It exists.** 43rd edition: **Sunday 21 June 2026**, start **08:00 at Piazza Municipio**, organiser **UISP Napoli** (patronage Comune). **10 km** competitive (route includes the lungomare, Via Toledo, Piazza Dante, the Decumani) and **5 km** for families and walkers. Traffic banned on the route **08:00–10:30**. Registration was €20 (2026). Earlier editions were in other months (Oct/Nov 2017, Oct 2021). The 2027 date is not announced. | Race verified; **20 June 2027 ⚠** | [napolike 2026](https://www.napolike.it/spaccanapoli-2026-43-edizione-corsa-centro-storico), [napolitan 2017](https://napolitan.it/2017/10/05/69257/domenica-5-novembre-2017-al-via-la-35esima-edizione-spaccanapoli-la-gara-podistica-20-km) |
| **Ferries, operators and piers** | **Caremar** (official shop): Napoli **Porta di Massa = traghetti** to Procida and Ischia; Napoli **Molo Beverello = aliscafi** to Procida and Ischia. Pozzuoli–Procida/Ischia; Procida–Ischia; «Ischia CS» (Casamicciola) variants exist. Online tickets and the MyCaremar app exist. **Medmar**: Porta di Massa → Ischia direct. **SNAV**: Beverello ↔ Procida and Casamicciola. **Alilauro**: Beverello ↔ Ischia/Forio hydrofoils (~1 h–1 h 15). | Verified (2026 board) | [shop.caremar.it](https://shop.caremar.it/), [traghettilines](https://www.traghettilines.it/it/procida/traghetti-napoli-procida.aspx), [ferryhopper Forio](https://www.ferryhopper.com/it/ferry-routes/direct/naples-forio) |
| Crossing times | Napoli (Porta di Massa) → Ischia Porto by traghetto ~1 h 30 via Procida, so Napoli → Procida is **about 1 h** (consistent with the raw plan). **Procida → Ischia: traghetto ~30 min, aliscafo 15–20 min** (Caremar). Ischia → Porta di Massa ~1 h 25. | Typical durations verified; **every 2027 departure time ⚠** (no summer 2027 timetable published as of 2026-11-21) | [traghetti.com](https://www.traghetti.com/traghetti-ischia/traghetti-procida-ischia), [traghettilines Ischia](https://www.traghettilines.it/it/ischia/traghetti-napoli-ischia.aspx) |
| The 12:15 / 13:30 Caremar and 15:45 / 17:15 Procida→Ischia times | Not verifiable for 2027 | **⚠** | — |
| **Procida, car ban** | Prefettura decree (Comune deliberation 9 Feb 2024 n.33): **ban on vehicles of non-residents**, with exemptions. Seasons: 2025 = 1 Apr – 30 Oct (ANSA, via search). A non-official blog gives 2026 as 30 Mar – 15 Oct. The 2027 ordinance has not been issued. | Rule verified; **2027 dates ⚠** | [prefettura decree](https://prefettura.interno.gov.it/sites/default/files/79/2024-10/decreto_isola_di_procida.pdf), [napolitan 2025](https://napolitan.it/2025/03/26/146494/capri-e-procida-al-via-i-divieti-di-sbarco-per-veicoli-non-residenti) |
| **Ischia, car ban** | Ministerial decree: **3 Apr – 31 Oct 2026**. Sources disagree on the criterion: vehicles of **Campania residents** (2024/2025 decrees) vs «non-residents» (older decrees). The 2027 decree has not been issued. | Season verified (2026); **criterion and 2027 ⚠**. Irrelevant to the plan, which has no car on the islands; Práctica just says «no crucéis con coche». | [prefettura decree Ischia](https://prefettura.interno.gov.it/sites/default/files/79/2024-10/decreto_isola_ischia.pdf), [parkingmycar](https://www.parkingmycar.it/blog/traghetti-per-ischia-tratte-orari) |
| **Baia di Sorgeto** | Access on foot from **Panza (Forio)** down about **250** (Komoot) to about **300** (Thomas Cook) steps. **Water taxi from Sant'Angelo**: €5 one way (Lonely Planet) to €6 (Wanderlog review). Crowded in July and August. Thermal spring water rises into the sea. **No source covers night access, lighting, evening taxi-boat service or child safety.** | Steps and boat verified as ranges; **night, children, lighting, sea state ⚠**. Hot-spot scald risk is general knowledge [ASSUMED]; keep the skeleton's «comprobadla con la mano» advice. | [komoot](https://www.komoot.com/it-it/highlight/6546697), [lonelyplanet](https://www.lonelyplanet.com/italy/attractions/baia-di-sorgeto/a/poi-sig/1029522/1325029), [spiagge.it](https://www.spiagge.it/magazine/baia-di-sorgeto/) |
| **Monte Epomeo** | Classic path **CAI 501 from Fontana**, about 3 km, 1–1.5 h up (Komoot). Partly shaded by oak and chestnut. Summit cross and Eremo di San Nicola, with a restaurant nearby. EAV buses run Ischia Porto/Forio → Serrara Fontana. Avoid the Pietra Martone/Pietra Mosca variant with children (about 6 h, exposed). | Verified (multiple sources) | [napolike](https://www.napolike.it/monte-epomeo-escursione), [booking.ischia.it](https://booking.ischia.it/en/tour-services/excursions/sentiero-del-monte-epomeo) |
| **Alibus** | Airport → **Piazza Garibaldi** (about 20 min) → **Porta di Massa** → **Molo Beverello / Stazione Marittima**. Reverse direction adds Varco Pisacane. **€5** single (ANM; 90-minute validity reported). Every 10–20 min. First and last from the airport 05:30 / 00:25. **It does not go to the Vomero** (raw plan inaccuracy): continue by Metro L1 Garibaldi → Vanvitelli or a funicular [ASSUMED for the L1 detail]. A Metro L1 airport station is «planned for 2027». | Verified; fare **⚠** (anm.it not reachable) | [napolike Alibus](https://www.napolike.it/trasporti-pubblici-a-napoli/alibus), [fanpage](https://www.fanpage.it/napoli/orari-alibus-dall-aeroporto-a-napoli-in-navetta/) |
| **ZTL Napoli** | Six zones with different gates and hours: Centro Antico gates 9:00–17:00 (Autovia 2026) or Mon–Fri 8:00–18:30 (Napolike). Fines about €80 to over €330. Hotels inside a ZTL may register the plate. | Mechanism verified; **exact hours ⚠** | [autovia](https://www.autovia.it/ztl-napoli-guida-completa/), [napolike](https://www.napolike.it/come-ottenere-il-permesso-ztl-a-napoli-per-turisti-guida-passo-passo) |
| **ZTL Salerno** | Centro storico ZTL with ANPR cameras, reported **active 24 h** (sicurauto, 2023). | **⚠** | [sicurauto](https://www.sicurauto.it/news/attualita-e-curiosita/ztl-salerno-permesso-orari-e-mappa/) |
| **Car hire at Capodichino** | Desks are in the airport's «Area Noleggio Auto», first floor / arrivals. Returns at the main centre near Terminal 1 for several brands. Ask for a signed return receipt. GESAC runs the official car parks. | Verified generically; **company, desk and return point ⚠** (D-01) | [discovercars/drivalia](https://www.discovercars.com/it/partners/drivalia-5795), [autovia](https://www.autovia.it/territorio/noleggio-auto-napoli-aeroporto/) |
| Parking in Naples (night of the 25th) | Not researched to a specific garage | **⚠** (D-01: «garaje o parking cerca de la base») | — |
| **June heat** | Naples June mean max **28 °C**, min **18 °C** (1991–2020). Sea **about 22–23 °C**. | Verified | [climieviaggi](https://www.climieviaggi.it/clima/italia/napoli), [dove-e-quando](https://www.dove-e-quando.it/when/europa/italia/napoli/mese/giugno/) |
| **Valle del Calore / Felitto** | Gole del Calore by Felitto (Remolino area): picnic area, restaurant, a natural pool formed by an old dam; heavily used for bathing. A loop path from Felitto; the **medieval single-arch bridge** is reachable, with steeper stretches. CAI route Felitto–gorges–bridge–Tempa Calore about 4 h, 350 m (2009). | Verified (guides); bathing rules and water quality **⚠** | [komoot](https://www.komoot.com/it-it/guide/3806419/gole-nei-dintorni-di-felitto), [quotidiano.net](https://www.quotidiano.net/itinerari/viaggi/campania-ecco-5-fiumi-e-torrenti-dove-fare-il-bagno-hxo9zx9n), [CAI Potenza](https://organizzazione.cai.it/sez-potenza/wp-content/uploads/sites/36/2026/03/20090327_gole_calore.pdf) |
| **Raito / Albori** | Both are **frazioni of Vietri sul Mare** (Amalfi coast), **not Cilento**. Raito has the Museo Provinciale della Ceramica (Villa Guariglia). Albori is in «I Borghi più belli d'Italia». | Verified. **Prose must not place Raito/Albori «en el Cilento»**; Opción A is «Vietri + costa norte del Cilento». | [wikipedia Vietri](https://en.wikipedia.org/wiki/Vietri_sul_Mare), [borghipiubelliditalia](https://borghipiubelliditalia.it/en/?p=10392) |
| **Casertavecchia** | Medieval borgo above Caserta; Duomo (OSM place of worship at 41.0973,14.3670). | Verified (location) | OSM Nominatim |
| **Lago d'Averno** | Flat loop of about 2.8 km, about 45 min, family-friendly; vineyards and wineries (Cantine dell'Averno) on the shore; Cumana station **Lucrino** about 1 km away. | Verified | [komoot](https://www.komoot.com/smarttour/e1070441656/lago-d-averno-loop-tour), [viaggiapiccoli](https://www.viaggiapiccoli.com/lago-d-averno-passeggiata-tra-natura-cultura-e-mito/) |
| **Antro della Sibilla / Parco Archeologico di Cuma** | **Closed on Tuesdays** (so Saturday the 26th is open). Summer 9:00–19:00, last entry 18:00 (Napolike). **Booking compulsory**, entry capped (50 people per 30 min); the Antro allows 25 at a time (official site, via search). Circuito Flegreo ticket €10 / €5, valid 3 days for 4 sites. Refund if closed for **bradisismo**. | Verified (MiC page plus secondary); **2027 hours and price ⚠** | [cultura.gov.it](https://cultura.gov.it/luogo/parco-archeologico-dei-campi-flegrei-parco-archeologico-di-cuma), [napolike Cuma](https://www.napolike.it/cuma-come-visitarla) |
| **Miseno beach** | OSM «Spiaggia di Miseno» (Bacoli) at 40.7868,14.0805; **Spiaggia di Miliscola** lies between Lago Miseno and the sea. | Location verified; services **⚠** | OSM; Commons file title |
| **Napoli Sotterranea** | Entrance **Piazza San Gaetano 68** (Via dei Tribunali). Guided visits only, **booking required**, about 90 min–2 h. A long staircase, so **no pushchairs**. Child fares conflict between sources. | Verified (multiple); **hours and prices ⚠** | [italia.it](https://www.italia.it/it/campania/napoli/musei/napoli-sotterranea), [napolisotterranea.org](https://www.napolisotterranea.org/en/?p=597) |
| Capodimonte (Real Bosco) | Location verified (OSM wood at 40.8743,14.2551) | Opening hours **⚠** | OSM |
| Vehicle-free Procida / bikes | Bike hire at Marina Grande | **⚠** [ASSUMED] | — |

### Verified establishments (D-14): only these may be named

| Group (D-15) | Establishment | Address (verbatim from source) | Evidence | Use |
|---|---|---|---|---|
| Pizzerías de barrio | **Da Concettina ai Tre Santi** | Via Arena della Sanità 7 bis, 80137 Napoli (Michelin: «via Arena alla Sanità 7 bis») | Michelin Guide + Dissapore. Since 1951; 4th generation (Ciro Oliva). Metro Cavour or Museo nearby. | Name it. It fits Viernes 25 in Sanità before the concert. |
| Pizzerías de barrio | Pizzeria Gorizia 1916 (Vomero) | Via Gian Lorenzo Bernini 29/31, 80127 Napoli | Dissapore, 50 Top Pizza, Gambero Rosso. **But Gambero Rosso reported a closure for renovation; reopening not confirmed.** | Name it only with **⚠ por confirmar**, or describe it generically as «una pizzería de barrio en el Vomero». |
| Mozzarella di bufala | **Tenuta Vannulo** | Via Galileo Galilei 101, Contrada Vannulo, 84047 Capaccio Scalo (SA) | Lonely Planet + Frommer's + trip.com; 100 % buffalo milk; tours | Name it on the Piana del Sele (Jueves 24 B route via Capaccio; or detour). Sale hours **⚠**. |
| Island kitchens (Ischia) | **Trattoria Il Focolare** | Via Cretajo al Crocefisso 3, Barano d'Ischia (Fiaiano) | Scatti di Gusto (2021), Petit Futé, ischia.it. **Coniglio all'ischitana in clay pot, by reservation only.** Closed Wednesdays (2024). | Name it; reservation in Reservas; hours **⚠** |
| Island kitchens (Procida) | **Caracalè** | Via Marina Corricella 62, Procida | italia.it (official portal) + Scatti di Gusto + Napolike | Name it |
| Island kitchens (Procida) | **La Lampara** | Via Marina di Corricella 88, Procida | Gambero Rosso | Name it |
| Island kitchens (Procida) | La Gorgonia | Via Marina di Corricella 50, Procida | Napolike only (one of the oldest trattorias; «insalata di limoni») | Single source: generic or **⚠** |
| Tabernas de Salerno | Hostaria Il Brigante | Via Fratelli Linguiti 4, 84121 Salerno | Directories (Foodle, Petit Futé, Wanderlog); closed Monday per user-submitted listings | MEDIUM: name it with hours **⚠** |
| Trattorias de monte (Calore) | — | — | Trattoria Il Remolino and Agriturismo L'Occhiano appear only in directories and reviews | **Generic** («una trattoria familiar junto a las gargantas, a elegir sobre el terreno»). Fusilli felittesi: the town's sagra is in summer (Jul/Aug), dates **⚠**. |
| Casertavecchia | — | — | La Castellana: directories with low ratings. La Torre dei Falchi: italia.it (address not captured) | **Generic** |

Group ordering: Campania's groups are not in `FOOD_GROUP_ORDER` [VERIFIED: app/utils/foodGroups.ts:24-32], so they sort to the end **in order of first appearance**. `useTrip` queries food with no `.order()` (app/composables/useTrip.ts:42), so the order effectively follows the file/id order. **Name the food slugs so that the desired group order is alphabetical**, e.g. prefixes `g-1-…`, or choose names deliberately. Then verify the rendered order in `test:trips` or by eyeballing.

## Architecture Patterns

### System flow (content → page)

```
content/trips/campania/*.yml
   │  (pnpm test:data) ── tests/data/trips.ts loadTrip/checkTrip (20 rules) + schema.spec (zod strict)
   ▼
scripts/tripManifest.mjs reads trip.yml `draft`
   ├─ draft:true  → content.config.ts excludes trips/campania/** (prod) ; nuxi dev keeps it
   └─ draft:false → nuxt.config prerender adds /trips/campania/ ; rows go to public sql_dump
   ▼
nuxt generate → .output/public/trips/campania/index.html (+ _payload.json)
   ▼
Browser: TripView ← useTrip(slug) (prerendered payload)
   ├─ buildTripLayout → pills/sections (#reservas/#gastronomia/#practica exist only if data exists)
   ├─ DaySection(day, monById, stay) → Timeline* rows, choice blocks, «Dormís en», route button
   ├─ MonumentCard → hero <img> (Wikimedia) → @error → motif SVG
   └─ LeafletMap.client → setView(center,zoom) → markers(all monuments) → fitBounds(pad .1)
```

### Recommended file layout

```
content/trips/campania/
├── trip.yml                      # D-18 (+ sections.gastronomia eyebrow/intro, recommended)
├── days/{sabado-19,domingo-20,lunes-21,martes-22,miercoles-23,
│         jueves-24,viernes-25,sabado-26,domingo-27,lunes-28}.yml
├── monuments/<24 slugs>.yml      # table above
├── food/g-*.yml                  # ~8–12 entries, 5 groups
└── reference/{reservas,practica}.yml
```

### Anti-patterns to avoid

- **Italian eyebrows** (`giugno`) or any of `ROMA_MARKERS = ['Roma', 'Einaudi', 'giugno', 'MMXXVI', 'Pay', 'Fellini', 'Royal Court']` [VERIFIED: tests/trips/romaLeaks.ts:21]. Watch for «Via Roma» (Salerno's seafront street), «AS Roma», «Fellini», «Pay», and Roma's legend text «concierto Einaudi».
  - The matcher is case-insensitive whole-word, so a standalone «pay» would also trip it.
  - Search scans `innerText` and `textContent` of the page body, so `alt`/`href` attributes are not scanned. Avoid these words in visible text anyway.
- **A meta row with a leading transport emoji** (🚌/⛴️/🚗), because the CSS glyph doubles it (12-UI-REVIEW). ⏱ and 🚶 in meta rows are fine (Roma does this).
- **Citing an option-only card any other way than `stop.ref`**, for example a Markdown link or a food `ref` inside an option. It leaks into the day route (open WR-02).
- **`route.mode: transit` with more than 2 stops** (WR-01).
- **`mapExtras`.** They break `markers == MONUMENTS.length`, and a nature extra has a broken popup (IN-07).

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Validating the YAML | Ad-hoc scripts | `pnpm test:data` (loadTrip/checkTrip + schema.spec) | 20 rules, including refs inside options and stay refs |
| Checking image URLs | Guessing Commons paths | The thumb URLs in the card table (HEAD 200 verified) or the Commons API (`prop=imageinfo&iiurlwidth=960`) plus `curl -sI` | Thumbnail paths depend on the md5 of the file name |
| Coordinates | Memory | The table above (OSM Nominatim) | The skeleton's Calore coordinates were wrong by about 11 km |
| Food group order | A code change to `FOOD_GROUP_ORDER` | Slug naming (alphabetical order) | D-19 forbids code changes |

## Runtime State Inventory

This is not a rename phase. One runtime change applies: **publication**. After `draft: false`, the public build gains `trips/campania/` and Campania rows in `__nuxt_content/*/sql_dump.txt`.

| Category | Items found | Action |
|---|---|---|
| Stored data | None; content lives in git | — |
| Live service config | None. GitHub Pages deploy is a separate act (out of scope). | — |
| OS-registered state | None | — |
| Secrets / env vars | None | — |
| Build artifacts | `.data/` (Content SQLite cache), `.nuxt/` and `.output/` go stale after any YAML edit or `draft` flip (memory + content.config.ts:574-576) | `rm -rf .data .nuxt .output` before every generate or gate run |

## Common Pitfalls

### Pitfall 1: Removing the sentinel before publication breaks `test:data`
**What goes wrong:** `build-isolation.spec.ts:107-113` runs **outside** `skipIf`. It requires `CAMPANIA-CENTINELA-12A` and `draft: true` in `trip.yml`, so rewriting `howTo` in an early plan turns `pnpm test:data` red.
**Avoid:** keep the sentinel sentence (e.g. a final `howTo` paragraph) until the publication plan, which removes it, flips `draft` and inverts the tests **in one commit**.

### Pitfall 2: `day-order` is broken in intermediate commits
**What goes wrong:** the skeleton has orders 1–5 on `sabado-19`, `domingo-20`, `martes-22`, `jueves-24` and `viernes-25`. Adding `lunes-21` with order 3 duplicates an order.
**Avoid:** each plan leaves 1..N contiguous. Example: the first days plan writes 19–23 as 1–5 and renumbers the skeleton `jueves-24` to 6 and `viernes-25` to 7. Also update the hard-coded `[1,2,3,4,5]` in `campania.spec.ts:440` at the same time, or `test:trips` goes red.

### Pitfall 3: Refs to cards or food that do not exist yet
**What goes wrong:** `ref` and `cards` must resolve at every commit, and `anchor` links like `[…](#reservas)` only resolve once `reservas.yml` exists.
**Avoid:** write cards before or with the days that cite them. Do not add `[…](#gastronomia)`, `[…](#reservas)` or `[…](#practica)` links until those files exist. Do not delete `rione-sanita`, `vesubio` and similar until no day references them.

### Pitfall 4: The marker in a plain-text field
**What goes wrong:** `**⚠ por confirmar**` in `time`, `header`, `title`, `address`, `footer` or `when` renders the asterisks literally.
**Avoid:** see the A.3 table.

### Pitfall 5: Stale Content cache
**What goes wrong:** after a YAML edit or a `draft` flip, generate silently uses old rows.
**Avoid:** `rm -rf .data .nuxt .output` first (memory). `test:trips` also needs `rm -rf .data .nuxt`, and must never run concurrently with generate or verify.

### Pitfall 6: Node 24 default
**What goes wrong:** better-sqlite3 ABI errors.
**Avoid:** `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH"`.

### Pitfall 7: The same card in two days
**What goes wrong:** a duplicate DOM id; `[id="stadio-maradona"]` gives 2. Card navigation highlights the wrong one.
**Avoid:** list the stadium in `viernes-25.cards` only; on 27 use `stop.ref`.

### Pitfall 8: Raw-plan factual slips to correct in prose
- Alibus does not reach the Vomero.
- Raito and Albori are on the Amalfi coast (Vietri), not in the Cilento.
- The car is returned on the 26th, not the 25th (D-01).
- The year is 2027.
- Ultimo's official date is the 24th; see Open Question 1.

### Pitfall 9: Wikimedia rate limiting during verification
**What goes wrong:** bulk `HEAD` requests got HTTP 429 («Too many requests» / robot policy) after about 5 calls.
**Avoid:** space requests 10–12 s apart. Browsers loading one page are not affected.

## Code Examples (YAML patterns; values from the tables above)

### Card with family note and marker
```yaml
# content/trips/campania/monuments/baia-di-sorgeto.yml
slug: baia-di-sorgeto
trip: campania
roman: IX
name: Baia di Sorgeto
italian: 'Baia di Sorgeto · Panza · Forio'
day: Martes 22
coords: { lat: 40.6992, lng: 13.8784 }
type: nature
motif: thermal
hero:
  src: https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Baia_di_sorgeto%2C_sorgente_termale_che_sbuca_direttamente_in_mare.jpg/960px-Baia_di_sorgeto%2C_sorgente_termale_che_sbuca_direttamente_in_mare.jpg
  alt: Baia di Sorgeto, pozas termales junto al mar
sections:
  - heading: Qué es
    body: >-
      …prosa D-09…
facts:
  - label: Acceso
    value: 'A pie desde Panza, unos 250-300 escalones · taxi-barca desde Sant''Angelo de día (5-6 € por trayecto) **⚠ por confirmar**'
mapsQuery: Baia di Sorgeto Forio Ischia
family: >-
  …tres frases, con «escalones» y «linterna» (tests/unit/searchIndex.spec.ts:211-223),
  y las condiciones de noche **⚠ por confirmar**.
```

### Thursday choice block (shape the tests need)
```yaml
  - kind: choice                       # #1: no heading → «Elige una»
    options:
      - label: Opción A
        title: Pueblos de artistas y mar del Cilento
        rows:
          - { kind: stop, pace: all, time: '10:00', title: Raito y Albori, ref: raito, note: '…' }
          - kind: transport
            pace: all
            variant: car
            header: De Vietri a la costa norte del Cilento
            modes: [{ icon: 🚗, recommended: true, desc: '**En coche** por la costa, ≈1 h **⚠ por confirmar**' }]
          - { kind: meta, items: [{ level: plain, text: '⏱ **toda la tarde** de cala con las familias del lugar' }] }
          - { kind: stop, pace: all, time: '15:30', title: Baia di Trentova, ref: baia-di-trentova, note: '…' }
      - label: Opción B                 # ALL rows hidden at «slow»: only stop/transport, pace medium
        title: Ríos, bosques y pozas de agua dulce
        rows:
          - { kind: stop, pace: medium, time: '10:30', title: Gole del Calore, ref: valle-del-calore, note: 'Comida en una trattoria familiar de monte, a elegir sobre el terreno.' }
          - kind: transport
            pace: medium
            variant: walk                # the ONLY .tl-transport.walk inside Thursday's choices
            header: Sendero de las gargantas
            modes: [{ icon: 🚶, recommended: true, desc: '**A pie** junto al río hasta el puente medieval' }]
  - kind: choice                        # #2: contiguous, with heading, 3 options, one title ≥70 chars
    heading: Para cenar, elige una
    options: [ … three options … ]
```

### Publication flip (final plan only)
```yaml
# trip.yml: remove `draft: true` (or set `draft: false`) and remove the sentinel paragraph from howTo
startDate: '2027-06-19'
endDate: '2027-06-28'
destinations: [Nápoles, Procida, Ischia, Salerno, Cilento]
summary: >-
  Diez días de junio entre Nápoles, las islas y el sur: …   # NO links (trip-summary-link)
```

## State of the Art

| Old (skeleton, Phase 12) | Now (Phase 13) | Impact |
|---|---|---|
| `hero.src: https://example.invalid/...` | Verified Wikimedia thumbs | Real heroes; offline still falls back to the motif |
| 5 days, orders 1–5 | 10 dated days, orders 1–10 | Tests and pills change |
| `draft: true` with sentinel | Published | Build-isolation and manifest tests invert |

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Metro Linea 1 runs Garibaldi → Vanvitelli (Vomero) | Field data / Day 19 | Wrong onward-transfer instruction; mark the leg ⚠ if not checked |
| A2 | Metro Linea 2 links Piazza Cavour (by Sanità) to Napoli Campi Flegrei (stadium) | Day 25 blueprint | Wrong concert routing; keep ⚠ |
| A3 | Bike hire exists at Marina Grande, Procida | Day 20 | Wrong logistics; ⚠ |
| A4 | Sorgeto thermal spots can scald (general knowledge) | Sorgeto family note | Safety text tone |
| A5 | Rione Sanità coordinates 40.8590,14.2497 (kept from skeleton) | Card table | Marker slightly off |
| A6 | Hero subjects match their Commons titles (no visual check) | Card table | Wrong photo; executor or UAT eyeballs once |
| A7 | Group ordering of Campania food follows the alphabetical file/id order | Food pitfall | Groups render in an unexpected order; verify visually |
| A8 | `.tl-food` rows inside an option stay visible at `slow` (only stop/transport are pace-filtered in the test helper) | Shape contract | Opción B check fails if a food row is placed in B |
| A9 | Capodichino is the car return point | D-01 | Already ⚠ by decision |

## Open Questions

1. **Ultimo: 24 or 25 June 2027?** (blocking for the day 24/25 content)
   - Known: the official calendar says Thursday 24 at the Maradona. Resellers say 25 (21:00). There are two TicketOne event IDs.
   - Recommendation: a **checkpoint:decision early (plan 1)**: «¿Qué fecha pone en vuestras entradas de Ultimo?». Default if there is no answer: keep the 25th as planned and mark it **⚠ por confirmar**, with a note that the first announced date was the 24th.
2. **Reservas chrome (G-1).** Insert Phase 12.1 (optional headings with Roma defaults) or accept «Ya reservado · 3 comensales» on Campania?
   - Recommendation: insert 12.1 before the Reservas plan (small, parity-safe). It must be decided before that plan.
3. **Pizzeria Gorizia 1916 reopened?** Unknown. Use the generic Vomero pizzeria text, or name it with ⚠.
4. **Attribution for CC BY / BY-SA heroes.** Roma hotlinks without credit (precedent). Options: accept the precedent, or add a single credits line to Práctica/footer. A `media` item or footer line is content-only.
5. **Is the Naples base on 25–27 the same as on the 19th?** Unknown (D-04). Reuse the `napoles` stay; say «⚠ por confirmar» in Reservas.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|---|---|---|---|---|
| Node 22 | generate / Playwright / better-sqlite3 | ✓ (per memory) | v22.20.0 under `~/.nvm` | — (default v24 fails) |
| pnpm | scripts | ✓ (`packageManager: pnpm@10.32.1`) | 10.32.1 | — |
| Network to `upload.wikimedia.org` | image verification | ✓ (HEAD 200 this session) | — | Motif fallback (D-11) |
| Playwright browsers | `test:trips`, `test:parity` | assumed (Phase 12 ran them) | 1.61.0 | — |

## Validation Architecture

### Test framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (`tests/unit`, `tests/data`) + Playwright 1.61.0 (`playwright.gate.config.ts` parity; `playwright.trips.config.ts` on `nuxi dev`, port 5300) |
| Config files | `vitest.config.ts`, `playwright.gate.config.ts`, `playwright.trips.config.ts` |
| Quick run command | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm test:unit && pnpm test:data` |
| Trips (dev E2E) | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && rm -rf .data .nuxt && pnpm test:trips` (never concurrent with generate or verify) |
| Full suite command | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm verify` (it does `rm -rf .data .nuxt .output` and generate, then unit, data and parity, expecting **110/110**) + `pnpm typecheck && pnpm lint` |
| Frozen-files check | `git diff --exit-code 2ee90df -- content/trips/roma content/trips/prueba content/trips/forma app shared nuxt.config.ts tests/parity` (base = HEAD at phase start; widen if a 12.1 insert lands) |

### Phase requirements → test map
| Req | Behaviour | Type | Automated command | Exists? |
|-----|-----------|------|-------------------|---------|
| CAMP-01 | 10 day files; slugs exactly `sabado-19 … lunes-28`; `order` 1..10; Spanish eyebrows (no `giugno`); `jueves-24` and `sabado-26` each contain a `choice`; transports `plane` (19, 28), `bus`, `ferry` (20, 21, 23), `car`, `bike` present; stops citing `stadio-maradona` on 25 and 27 | data | `pnpm exec vitest run tests/data/campania-content.spec.ts` | ❌ Wave 0 |
| CAMP-01 | Days render in order with pills; choices stack; «Dormís en»; transport bands | e2e dev | `pnpm test:trips` (`campania.spec.ts`, updated) | ✅ (to update) |
| CAMP-01 | Gate green for all 10 days, refs inside options, `stay-ref` | data | `pnpm test:data` (`invariants.spec.ts`, `schema.spec.ts`) | ✅ |
| CAMP-02 | The D-10 slug list exists; every monument has `hero.src` starting `https://upload.wikimedia.org/`, non-empty `italian`, `sections`, `mapsQuery`, coordinates inside the bounding box (lat 40.3–41.15, lng 13.8–15.3); **each monument in exactly one day's `cards`** | data | `tests/data/campania-content.spec.ts` | ❌ Wave 0 |
| CAMP-02 | Markers = monuments; nature markers are teal; heroes fall back to the motif offline; the map frames all cities | e2e dev | `pnpm test:trips` | ✅ |
| CAMP-03 | ≥1 food per planned group; `badgeKind` ∈ enum; `#gastronomia` section exists | data + e2e | `campania-content.spec.ts`; `pnpm test:trips` | ❌ / ✅ |
| CAMP-04 | `reference/reservas.yml` exists; `confirmed` contains the 19 and 28 flights; `table` has rows for each base (napoles, procida, ischia, salerno), 3 ferries, the car, 2 concerts and Napoli Sotterranea | data | `campania-content.spec.ts` | ❌ Wave 0 |
| CAMP-05 | `practica.yml` section headings cover: ferries, driving/ZTL/islands, heat, footwear, children, concerts | data | `campania-content.spec.ts` | ❌ Wave 0 |
| CAMP-06 | `⚠ por confirmar` count ≥ N (e.g. ≥15) across Campania strings (`collectStrings`); **0** occurrences in `content/trips/roma/**`; present in the specific files `domingo-20` (ferry), `viernes-25` (Ultimo), `domingo-27` (PTN), `baia-di-sorgeto` (night access), `sabado-26` (car return); never inside a plain-text field (`time`, `header`, `title`, `address`, `footer`, `when`) with `**` | data | `campania-content.spec.ts` | ❌ Wave 0 |
| ROUTE-05 / D-02 | Manifest `campania draft:false`; prerender routes include `/trips/campania/` | unit | `pnpm exec vitest run tests/unit/tripManifest.spec.ts` | ✅ (to update) |
| ROUTE-05 / D-02 | `.output/public/trips/campania/index.html` + `_payload.json` exist with real content; no sentinel anywhere; prueba and forma still absent | data (build) | `pnpm verify` (`build-isolation.spec.ts`) | ✅ (to update) |
| ROUTE-05 / D-02 | Portada lists Campania (dev); parity portada green unedited | e2e dev + parity | `pnpm test:trips` (`portada.spec.ts`); `pnpm test:parity` | ✅ (to update / read-only) |
| D-19 | Roma, prueba, forma, app, shared and parity unchanged | git | frozen-files check | ✅ |

### Sampling rate
- **Per task commit:** the quick run (unit + data), less than 10 s.
- **Per plan (wave):** quick run, then `rm -rf .data .nuxt && pnpm test:trips` (sequential), then the frozen-files check.
- **Publication plan / phase gate:** `pnpm verify` (110/110 parity) + `pnpm typecheck && pnpm lint` + `test:trips`; re-register counts in `tests/README.md`.

### Wave 0 gaps
- [ ] `tests/data/campania-content.spec.ts`: the CAMP-01..06 data assertions above. Write it so pre-publication-safe checks (structure, marker absence in Roma) are active from plan 1, and the count thresholds or the full slug list are tightened as content lands. Alternatively, add assertions plan by plan.
- [ ] Decide on the 12.1 insert (G-1) before the Reservas plan.

## Security Domain

`security_enforcement` is not disabled. The phase adds no code, but content still carries some risk.

| ASVS category | Applies | Control |
|---|---|---|
| V5 Input validation | yes | zod strict schemas + gate rules (`cross-trip-link` whitelist: only `#id` or `http(s)://`) |
| V2/V3/V4/V6 | no | No auth, sessions or crypto (static site) |

| Threat | STRIDE | Mitigation |
|---|---|---|
| Malicious link in prose (`javascript:`) | Tampering | `cross-trip-link` rule (trips.ts:437-439) |
| Hotlinked third-party images (tracking, availability) | Info disclosure / DoS | Accepted precedent (Roma); motif fallback; no personal data in URLs |
| Personal data in published content | Info disclosure | Only first names already in the plan (Arantxa, Víctor, D-09). **Do not publish phone numbers, booking codes or addresses of private lodgings.** Restaurant phones only if verified (D-14). |

## Suggested Plan / Wave Split (D-21 discretion; sequential, `use_worktrees=false`)

This reorders CONTEXT's suggestion because **cards must precede the days that cite them** (`ref`/`cards` gate) and day orders must stay contiguous.

| Plan | Content | Tests touched | Gate at end |
|------|---------|---------------|-------------|
| **13-01** | **Checkpoint:decision**: Ultimo date (Q1) and the G-1 path (Q2). Write `tests/data/campania-content.spec.ts` (Wave 0, pre-publication-safe parts). Rewrite `trip.yml`: title, heroMeta, quote, infoCards, howTo **keeping the sentinel paragraph**, map center/zoom, stays, mapLegend («✦  Rojos · paradas con ficha · Verde agua · naturaleza · Verde · conciertos ✦»), footer, startDate, endDate, destinations, summary, `sections.gastronomia`; **keep `draft: true`**. | new data spec | quick + test:trips |
| **13-02** | All **24 cards** (rewrite 11 and add 13). Keep the slugs the skeleton days still reference. Real heroes and coordinates. `family` notes (Sorgeto with «escalones» and «linterna»). | `searchIndex.spec` (stays green if the words are kept) | quick + test:trips |
| **13-03** | **Gastronomía** (`food/g-*.yml`, verified names only, slug order = group order) | — | quick + test:trips |
| **13-04** | **Days 19–23** (orders 1–5); renumber skeleton `jueves-24` → 6 and `viernes-25` → 7 | `campania.spec` order test derived from the YAML; sabado-19 and domingo-20 shape tests | quick + test:trips |
| **13-05** | **Days 24–28** (orders 6–10; Thursday and Saturday choices per the shape contract); remove orphans | `campania.spec` (Thursday driving route, refs), `timelineRows.spec` | quick + test:trips |
| *(12.1 insert, if chosen)* | Reservas optional headings with Roma defaults | its own tests; parity must stay 110/110 | verify |
| **13-06** | **Reservas + Práctica** (`reference/*.yml`); now add `[…](#reservas)` / `(#practica)` links from days if wanted | — | quick + test:trips |
| **13-07** | **Publication**: remove the sentinel, flip `draft`. Invert `build-isolation.spec`, `tripManifest.spec`, `tests/trips/portada.spec`, `campania.spec` (portada test). Update `tests/README.md` counts and prose. Record WR-01/IN-04 content mitigation in the SUMMARY. | listed | **`pnpm verify` 110/110** + typecheck + lint + test:trips + frozen-files |

## Sources

### Primary (HIGH): read in the repo this session
- `shared/schemas.ts` (lines 24-61, 102-264, 266-286, 355-429, 443-526), `content.config.ts`, `scripts/tripManifest.mjs`
- `tests/data/trips.ts`, `tests/data/build-isolation.spec.ts`, `tests/trips/campania.spec.ts` (full), `tests/trips/portada.spec.ts`, `tests/trips/shape.spec.ts` (trap), `tests/trips/romaLeaks.ts`, `tests/parity/portada.spec.ts`, `tests/unit/{tripManifest,timelineRows,searchIndex,tripStays,searchIsolation}.spec.ts`, `tests/README.md`
- `app/components/{ReservasSection,PracticaSection,GastroSection,GastroCard,MonumentCard,DaySection,Timeline*,TheHero}.vue`, `app/utils/{pace,foodGroups,tripLayout,mapMarkers,tripDates}.ts`, `app/composables/useTrip.ts`, `app/components/LeafletMap.client.vue`
- `content/trips/campania/**` (all), `content/trips/roma/{trip.yml, days/viernes.yml, monuments/galleria-sciarra.yml, monuments/auditorium.yml, food/*.yml, reference/*.yml}`
- Wikimedia Commons API + HEAD checks (24 + 2 URLs, all 200); OpenStreetMap Nominatim geocoding

### Secondary (MEDIUM)
- [shop.caremar.it](https://shop.caremar.it/): routes and piers
- [ilgiorno.it, Ultimo calendar](https://www.ilgiorno.it/magazine/ultimo-concerto-san-siro-czb0pdu5)
- [napolike: Spaccanapoli 2026](https://www.napolike.it/spaccanapoli-2026-43-edizione-corsa-centro-storico), [PTN Napoli 2027](https://www.napolike.it/pinguini-tattici-nucleari-napoli-2027), [Alibus](https://www.napolike.it/trasporti-pubblici-a-napoli/alibus), [Cuma](https://www.napolike.it/cuma-come-visitarla), [Epomeo](https://www.napolike.it/monte-epomeo-escursione)
- [Prefettura di Napoli decrees (Procida, Ischia)](https://prefettura.interno.gov.it/sites/default/files/79/2024-10/decreto_isola_di_procida.pdf)
- [Trenitalia: Linea 2 concert services](https://www.trenitalia.com/it/chi-siamo/comunicati-stampa/20250528-corse-straordinarie-per-i-concerti-di-giugno-allo-stadio-maradona.html)
- [Michelin: Da Concettina ai Tre Santi](https://guide.michelin.com/en/campania/napoli/restaurant/da-concettina-ai-tre-santi), [Gambero Rosso: Procida](https://www.gamberorosso.it/notizie/dove-mangiare-a-procida-i-ristoranti-migliori-per-le-vacanze-estive/), [italia.it: Caracalè](https://www.italia.it/it/campania/procida/dove-mangiare/caracale), [Lonely Planet: Tenuta Vannulo](https://www.lonelyplanet.com/italy/paestum/attractions/tenuta-vannulo/a/poi-sig/1293473/359885)
- [cultura.gov.it: Parco archeologico di Cuma](https://cultura.gov.it/luogo/parco-archeologico-dei-campi-flegrei-parco-archeologico-di-cuma)

### Tertiary (LOW: resellers, directories, single sources; all ⚠ in content)
- Eventworld and HelloTickets (Ultimo 25 June); Komoot, Thomas Cook and Wanderlog (Sorgeto steps and boat); Foodle and Petit Futé (Il Brigante); directories for Felitto and Casertavecchia restaurants; sicurauto (Salerno ZTL, 2023)

## Metadata

**Confidence breakdown:**
- Content contract and test impact: **HIGH**. Every enum, rule and assertion was read from source this session.
- Card inventory (images, coordinates): **HIGH** for URL availability and coordinates; **MEDIUM** for image subject (titles only).
- Field data: **MEDIUM**. Mechanisms and places are verified. The 2027 timetables and the PTN date are unpublished or single-source. The Ultimo date conflicts.
- Gastronomy: **MEDIUM**. Five establishments are well supported; the rest are generic by design (D-14).

**Research date:** 2026-11-21
**Valid until:**
- Content contract: stable until code changes, e.g. a 12.1 insert.
- Field data: about 30 days. Check again around spring 2027, when the summer timetables, the island ordinances and the concert details are published.
