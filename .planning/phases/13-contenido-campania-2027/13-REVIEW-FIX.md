---
phase: 13-contenido-campania-2027
fixed_at: 2026-11-22T01:35:06Z
review_path: .planning/phases/13-contenido-campania-2027/13-REVIEW.md
iteration: 1
findings_in_scope: 16
fixed: 15
skipped: 1
status: partial
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-11-22T01:35:06Z
**Source review:** .planning/phases/13-contenido-campania-2027/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 16 (WR-01..WR-07 and IN-01..IN-09, as the orchestrator set them)
- Fixed: 15
- Skipped: 1 (WR-06, deferred to Phase 14)

**Scope:** only `content/trips/campania/**`, `tests/data/campania-content.spec.ts`, `tests/data/build-isolation.spec.ts`, `tests/trips/campania.spec.ts` and `tests/README.md` were edited. Nothing changed in `app/`, `shared/`, Roma, prueba, forma, `tests/parity/` or the CSS. No dependency was added, and no time, price, phone number or address was invented.

## Fixed Issues

### WR-01: Map and card numerals are not in visit order on three days

**Files modified:** `content/trips/campania/monuments/{vomero,lungomare-caracciolo,pozzo-vecchio,marina-corricella,castello-arechi,raito,baia-di-trentova,valle-del-calore}.yml`, `tests/data/campania-content.spec.ts`
**Commit:** 0393752
**Applied fix:** The numerals now follow visit order within each day and from one day to the next:
- Vomero I, Lungomare II.
- Pozzo Vecchio IV, Corricella V.
- Castello XII, Raito XIII, Trentova XIV, Calore XV.

`ROMANS` is updated. Two new guards were added:
- In each day, `cards` follows the order of the timeline stops with `ref`, choices included.
- Across the trip, the numerals form one increasing sequence I..XXIII in day order. The ♪ marker is excluded.

The numerals stay unique, and the e2e still reads them from the YAML.

### WR-02: Napoli Sotterranea has a «Con niños» box but is visited after the children leave

**Files modified:** `content/trips/campania/monuments/napoli-sotterranea.yml`, `content/trips/campania/reference/practica.yml`, `tests/data/campania-content.spec.ts`
**Commit:** d28173a
**Applied fix:**
- The `family` box is now an «Acceso» fact: a long staircase, very narrow passages, not for anyone who struggles in closed spaces.
- The Práctica «Con niños» bullet about Napoli Sotterranea is removed.
- `napoli-sotterranea` is removed from `FAMILY_REQUIRED`. A new `ADULTS_ONLY` guard checks that the card has no `family` and that the Práctica children's section does not name it.
- The stadium's family box stays. It concerns Ultimo on Friday 25, when the children are there.
- **D-09 deviation:** D-09 listed Napoli Sotterranea among the family cards. The Sunday 27 plan takes it out of that list.

### WR-03: The Cilento trattoria card contradicts the Thursday timeline

**Files modified:** `content/trips/campania/food/g-5-trattoria-calore.yml`, `content/trips/campania/food/g-2-vannulo.yml`, `content/trips/campania/days/jueves-24.yml`
**Commit:** 2e6fc37
**Applied fix:** Lunch is at the trattoria on arrival in Felitto, and every text now says so:
- The card reads «Al llegar a Felitto, antes de la tarde en las gargantas…».
- Dinner «Opción 1» no longer sends you back to the same trattoria. It is now «Quedarse a cenar en Felitto antes de volver»: a generic food entry with no `ref`, «a elegir sobre el terreno», and times marked «⚠ por confirmar».
- Vannulo's mozzarella is now «para la merienda junto al río».
- The light block's rest item no longer assumes dinner in Salerno.

### IN-01: Smaller prose-versus-timeline mismatches

**Files modified:** `content/trips/campania/monuments/capodimonte.yml`, `content/trips/campania/days/domingo-27.yml`, `content/trips/campania/monuments/raito.yml`, `content/trips/campania/food/g-3-caracale.yml`, `content/trips/campania/days/lunes-21.yml`
**Commit:** 04325b9
**Applied fix:**
- Capodimonte: «el libro recién comprado».
- Sunday light block: «Adelantar las librerías…».
- Raito: «El mediodía de la Opción A, después del Duomo y el castillo».
- Caracalè: the Sunday dinner after the Corricella sunset, or lunch if you arrive on the first ferry. Its footer now says «mesa en la Corricella».
- Monday light block: «dejad Il Focolare», without the promise of another free night.

### WR-04: `PLAIN_KEYS` misses several plain-text fields

**Files modified:** `tests/data/campania-content.spec.ts`
**Commit:** 9267e20
**Applied fix:** Added these keys:
- `mesas`, `visitas`, `table`: the Reservas `headings`, interpolated in `ReservasSection.vue`.
- `group`: `p.gastro-section-title`.
- `before`, `after`: the Topbar brand.
- `destinations`: the portada.
- `avatar`, `dates`, `epithet`, `term`: the artist card header, interpolated in `ArtistCard.vue`.

A comment explains where each key comes from, and why `table` only catches `headings.table`.

### WR-05: Two Práctica assertions pass on unrelated sections

**Files modified:** `tests/data/campania-content.spec.ts`
**Commit:** e5f2f21
**Applied fix:**
- The island-car check now reads the section whose heading matches «coche en las islas». It must contain Procida, Ischia, `prohibi` and «no residentes».
- The June averages check now reads the «calor» section. It must contain `**28 °C**` and `**18 °C**`.

### WR-07: The privacy test misses emails, booking codes and common phone formats

**Files modified:** `tests/data/campania-content.spec.ts`
**Commit:** 6d9f2ce
**Applied fix:** The guards are now named constants:
- `EMAIL_RE`.
- `BOOKING_CODE_RE`: 6 uppercase letters or digits, with at least one of each.
- A broader `DIGIT_RUN_RE`, `(?:\d[\s.\-/()]*){9,}`, that catches `(081) 549 4808` and `081 / 5494808`.
- The international phone regex, kept as before.

A new anti-vacuity test checks two things:
- Each regex matches its target.
- None of them fires on the years, ISO dates, prices, times or all-caps words already in the content.

### IN-02: Named restaurants link to the section rather than their own card

**Files modified:** `content/trips/campania/monuments/rione-sanita.yml`, `content/trips/campania/monuments/salerno-centro-storico.yml`
**Commit:** 3b3023b
**Applied fix:** `GastroCard.vue` renders `:id="food.slug"`, so the two named restaurants now link to their own cards: `#g-1-concettina` and `#g-4-il-brigante`. Generic places («pizzería de barrio», «cocina de las islas») keep `#gastronomia`.

### IN-03: The island is spelled two ways

**Files modified:** `content/trips/campania/monuments/{pozzo-vecchio,baia-di-sorgeto,monte-epomeo}.yml`, `tests/data/campania-content.spec.ts`
**Commit:** 133e9dd
**Applied fix:** «Isquia» is now «Ischia» everywhere. A content test rejects «Isquia» in any Campania string.

### IN-04: Some times are stated as certain while the event times are unknown

**Files modified:** `content/trips/campania/monuments/stadio-maradona.yml`, `content/trips/campania/days/viernes-25.yml`, `content/trips/campania/days/domingo-27.yml`
**Commit:** 4da92e7
**Applied fix:**
- The family box now says «probablemente pasada la medianoche (la hora de inicio está **⚠ por confirmar**)». `family` is a Markdown field.
- Both concert stops are retitled «Llegada al estadio · concierto de …», so 19:30 reads as an arrival time. The titles still contain «Ultimo» and «Pinguini Tattici Nucleari», as the tests require.
- Ultimo's date (Friday 25) stays unmarked, per D-22.

### IN-05: The D-14 test only inspects the food `name` and its generic regex is permissive

**Files modified:** `tests/data/campania-content.spec.ts`
**Commit:** 42f4170
**Applied fix:**
- `GENERIC_NAME_RE` is now `/^Una? [a-zà-ÿ]/`, so a capital after the article fails.
- An unverified food card must also contain no proper establishment name and have an «a elegir sobre el terreno» address.
- A new scan reads every Campania string with `ESTABLISHMENT_RE`: a capitalised «Trattoria/Pizzeria/Hostaria/Tenuta…» followed by a capitalised name. It allows only `VERIFIED_NAMES` and `Pizzeria Gorizia 1916`. Gorizia must sit in the same string as the marker.
- The anti-vacuity test uses `match`, not `toMatch`, because the regex is global and `toMatch` would carry its `lastIndex` between calls.

### IN-06: Phantom requirement in the build scan (necessity)

**Files modified:** `tests/data/build-isolation.spec.ts`, `tests/README.md`
**Commit:** aab71ff
**Applied fix:**
- `CAMPANIA_SENTINEL` is removed from the published-file offenders scan.
- The always-on check outside `skipIf` was split in two:
  - `trip.yml` has no `draft: true`.
  - No YAML under `content/trips/campania/` contains the sentinel. This is broader than the old `trip.yml`-only check, so nothing is lost.
- The draft-isolation checks for prueba and forma are unchanged: their sentinels outside `skipIf`, the offenders scan for `PRUEBA-…` and `FORMA-…`, and «no existen trips/prueba ni trips/forma».
- README §5.5 is updated. **Requires human verification:** this removes a guard, so it is a scope decision.

### IN-07: Incremental registries that are now final (necessity)

**Files modified:** `tests/data/campania-content.spec.ts`
**Commit:** 75cf600
**Applied fix:**
- `FOOD_GROUPS_WRITTEN` is inlined as `FOOD_GROUPS`.
- The header and the registry comments now describe the final contract instead of «los planes siguientes añaden…».

**Requires human verification:** this removes code, so it is a scope decision.

### IN-08: Stale `tests/README.md` labels and a silently dropped browser case

**Files modified:** `tests/README.md`
**Commit:** 1adbd76
**Applied fix:**
- The §5.8 days bullet is relabelled D-03.
- A «Hueco conocido» note now says that the render of an empty confirmed group is covered only by `reservasHeadings.spec.ts` and the `reservas-headings` data rule. No e2e covers it.

### IN-09: The data and e2e specs sort food files with different comparators

**Files modified:** `tests/data/campania-content.spec.ts`, `tests/trips/campania.spec.ts`
**Commit:** 0d4a4a1
**Applied fix:** Both specs now compare the food file name (`rel` in the data spec, the file name in the e2e) by UTF-16 code units, with an explicit comparator. `localeCompare` is gone.
- **Deviation:** the review suggested comparing slugs. File names were chosen instead because Content returns rows in file order, which is what the e2e already modelled.

## Skipped Issues

### WR-06: No test covers D-02's «Campania must not fetch `sql_dump` or WASM»

**File:** `tests/data/build-isolation.spec.ts:150-166`
**Reason:** Deferred to Phase 14, as the orchestrator instructed. D-05 of `14-CONTEXT.md` adds a built-site spec asserting that the portada, Roma and Campania make no `sql_dump`/WASM request. That spec replaces the static state-key proxy suggested here.
**Original issue:** The only no-heavy-fetch check (`tests/parity/portada.spec.ts`) visits the portada and Roma only. A regression where Campania falls back to client-side SQLite would pass the whole gate.

## Verification

All gates ran **in the main checkout** (`workflow.use_worktrees: false`; no worktree was created), with Node 22.20.0. They are reproducible from this tree.

| Gate | Result |
|------|--------|
| `pnpm test:unit` | 567 / 567 passed (24 files) |
| `pnpm test:data` | 767 / 767 passed (7 files) |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `rm -rf .data .nuxt && pnpm test:trips` | 46 / 46 passed (no dev server left running) |

- `campania-content.spec.ts` went from 149 to 153 tests.
- `test:data` ran its post-build blocks against the `.output` left by an earlier generate, not a fresh one. `pnpm verify` (clean generate plus parity) was not run here; the orchestrator runs it.
- The `tests/README.md` gate counts (110 / 13 parity, 46 / 4 trips) are unchanged.

---

_Fixed: 2026-11-22T01:35:06Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
