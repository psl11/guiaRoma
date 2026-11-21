# Phase 13: Contenido Campania 2027 - Context

**Gathered:** 2026-11-21
**Status:** Ready for planning
**Mode:** `--auto`. The user is travelling. They answered two blocking decisions before the run started (D-01, D-02). Every other decision is the recommended default, and the human UAT must confirm it.

<domain>
## Phase Boundary

Write the real Campania 2027 guide (19–28 June 2027) as **YAML content and images only**, on top of the trip shapes built in Phase 12. Phase 12 left a 5-day `draft: true` skeleton that is only a placeholder. Phase 13 replaces it with:
- **The 10 days.** Each has its timeline, times and logistics: flights, Alibus, ferries, the hire car, and the Ultimo and Pinguini Tattici Nucleari concerts. Two days have alternatives: Thursday 24 (A/B) and Saturday 26 (1/2).
- **One card per relevant place**, with an image, Italian name, prose, a Google Maps link and a map marker.
- **Gastronomía, Reservas and Práctica** for Campania.
- **Critical field data** that is either verified or visibly marked «por confirmar».
- **Publication:** Campania is published at the end of the phase. It moves from `draft: true` to published, appears on the portada, and opens at `/guiaRoma/trips/campania/`.

**Out of scope:**
- Any new schema shape, component or CSS. If content needs a shape the schema does not cover, it goes back to a decimal Phase 12.x insert and the schema is not forced here (ROADMAP note).
- The deploy to GitHub Pages and the merge to `main`, which are a separate ship act.
- The milestone sign-off on a real phone, which is Phase 14.
</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Content source
- `.planning/inputs/campania-2027-itinerario-raw.md` — the user's itinerary, verbatim. It is the only content source. Its year «2026» is a typo for 2027. Its open note about the car is resolved by D-01.

### Requirements and roadmap
- `.planning/ROADMAP.md` § Phase 13 — goal, 5 success criteria, research notes, the YAML-only rule.
- `.planning/REQUIREMENTS.md` — CAMP-01..06, ROUTE-05.

### Shapes available (Phase 12)
- `.planning/phases/12-formas-nuevas-de-viaje/12-CONTEXT.md` — D-01..D-19: the shape of `choice`, `stays`/`stay`, transports, `nature`, `family` and `route`.
- `.planning/phases/12-formas-nuevas-de-viaje/12-UI-SPEC.md` — content copy rules, including the ban on Roma words and on doubled glyphs.
- `.planning/phases/12-formas-nuevas-de-viaje/12-REVIEW.md` and `12-REVIEW-DISPOSITION.md` — WR-01 and IN-04, mitigated by content in D-08.
- `.planning/phases/12-formas-nuevas-de-viaje/12-UI-REVIEW.md` — warnings about the `meta` row with 🚌.
- `.planning/phases/12-formas-nuevas-de-viaje/deferred-items.md` — the map is 0 px tall in dev.
- `shared/schemas.ts` — the schemas for trip, day, monument, food and reference. They are the content contract.

### Model to imitate (Roma, read only)
- `content/trips/roma/trip.yml`, `content/trips/roma/days/*.yml`, `content/trips/roma/monuments/*.yml`, `content/trips/roma/food/*.yml`, `content/trips/roma/reference/{reservas,practica}.yml`.

### Gates and tests
- `tests/data/trips.ts` — the per-trip data gate (refs, `stay-ref`, `timelineRowsOf`, `trip-summary-link`, dates).
- `tests/data/build-isolation.spec.ts` — the Campania sentinel, inverted by D-02.
- `tests/trips/campania.spec.ts`, `tests/trips/shape.spec.ts`, `tests/trips/romaLeaks.ts` — Campania E2E and the Roma-leak trap.
- `tests/parity/portada.spec.ts` — reads the manifest (read only).
- `tests/README.md` — gate counts.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- The `content/trips/campania/` skeleton has `trip.yml` with `stays`, 5 days and 11 cards. These are the base to rewrite.
- The Phase 12 shapes are all in the schema and rendered: `choice`, `stay`, the `ferry`/`car`/`bus`/`bike`/`plane` transports, `nature` with its teal marker, the `sea`/`thermal`/`river`/`trail` motifs, `family`, and `route.mode`/`route.enabled`.
- Roma's `food` and `reference` collections: the same shape serves Campania.

### Established Patterns
- **Prose:** Markdown-inline in YAML strings, rendered with `<MDC>`. Cross-card links are `[texto](#slug)` within the same trip only; the gate checks them.
- **Images:** hotlinked Wikimedia with a motif fallback.
- **Draft:** `draft: true` excludes the trip from the 6 collections in production (`content.config.ts`). The portada lists only published trips (manifest from `scripts/tripManifest.mjs`).

### Integration Points
- Portada: the card uses `title`, `startDate`/`endDate`, `destinations` and `summary`.
- `build-isolation.spec.ts` and `campania.spec.ts` are the two tests that change with publication and the real content.
</code_context>

<specifics>
## Specific Ideas

- «Lo único e inolvidable» for each day, from the raw planning, as the emotional centre of each day.
- Sorgeto at night with children is the most delicate moment. It needs a clear `family` box with the verified (or «por confirmar») safety conditions.
- The two concerts at the Maradona are fixed points: getting there, getting back at night, and children only at Ultimo (25), because on the 27th the children have already left.
</specifics>

<deferred>
## Deferred Ideas

- Stay markers on the map, from Phase 12 D-08 (P2).
- An A/B selector that hides the option not chosen (TRIP-02, future).
- Locally hosted images for real offline use (v2/PWA).
- A real fix for WR-01 (transit with waypoints) and IN-04 (plane days hiding the route). Mitigated by content in D-08.
- An `artists` collection for Campania (art and architecture, like Roma's). It is not in CAMP-01..06.
</deferred>

---

*Phase: 13-contenido-campania-2027*
*Context gathered: 2026-11-21*
