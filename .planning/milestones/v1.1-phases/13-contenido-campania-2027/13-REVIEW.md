---
phase: 13-contenido-campania-2027
reviewed: 2026-11-22T02:30:00Z
depth: standard
files_reviewed: 53
files_reviewed_list:
  - tests/data/campania-content.spec.ts
  - tests/data/build-isolation.spec.ts
  - tests/trips/campania.spec.ts
  - tests/trips/portada.spec.ts
  - tests/unit/timelineRows.spec.ts
  - tests/unit/tripManifest.spec.ts
  - tests/README.md
  - content/trips/campania/trip.yml
  - content/trips/campania/days/sabado-19.yml
  - content/trips/campania/days/domingo-20.yml
  - content/trips/campania/days/lunes-21.yml
  - content/trips/campania/days/martes-22.yml
  - content/trips/campania/days/miercoles-23.yml
  - content/trips/campania/days/jueves-24.yml
  - content/trips/campania/days/viernes-25.yml
  - content/trips/campania/days/sabado-26.yml
  - content/trips/campania/days/domingo-27.yml
  - content/trips/campania/days/lunes-28.yml
  - content/trips/campania/monuments/antro-della-sibilla.yml
  - content/trips/campania/monuments/baia-di-sorgeto.yml
  - content/trips/campania/monuments/baia-di-trentova.yml
  - content/trips/campania/monuments/capodimonte.yml
  - content/trips/campania/monuments/casertavecchia.yml
  - content/trips/campania/monuments/castello-arechi.yml
  - content/trips/campania/monuments/duomo-di-salerno.yml
  - content/trips/campania/monuments/forio.yml
  - content/trips/campania/monuments/lago-d-averno.yml
  - content/trips/campania/monuments/lungomare-caracciolo.yml
  - content/trips/campania/monuments/marina-corricella.yml
  - content/trips/campania/monuments/monte-epomeo.yml
  - content/trips/campania/monuments/napoli-sotterranea.yml
  - content/trips/campania/monuments/pozzo-vecchio.yml
  - content/trips/campania/monuments/raito.yml
  - content/trips/campania/monuments/rione-sanita.yml
  - content/trips/campania/monuments/salerno-centro-storico.yml
  - content/trips/campania/monuments/spaccanapoli.yml
  - content/trips/campania/monuments/spiaggia-di-miseno.yml
  - content/trips/campania/monuments/stadio-maradona.yml
  - content/trips/campania/monuments/terra-murata.yml
  - content/trips/campania/monuments/valle-del-calore.yml
  - content/trips/campania/monuments/vesubio.yml
  - content/trips/campania/monuments/vomero.yml
  - content/trips/campania/food/g-1-concettina.yml
  - content/trips/campania/food/g-1-pizzeria-vomero.yml
  - content/trips/campania/food/g-2-caseificio-carretera.yml
  - content/trips/campania/food/g-2-vannulo.yml
  - content/trips/campania/food/g-3-caracale.yml
  - content/trips/campania/food/g-3-il-focolare.yml
  - content/trips/campania/food/g-3-la-lampara.yml
  - content/trips/campania/food/g-4-il-brigante.yml
  - content/trips/campania/food/g-5-trattoria-calore.yml
  - content/trips/campania/reference/reservas.yml
  - content/trips/campania/reference/practica.yml
findings:
  critical: 0
  warning: 7
  info: 9
  total: 16
  necessity: 2
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-11-22T02:30:00Z
**Depth:** standard
**Files Reviewed:** 53
**Status:** issues_found

## Summary

I reviewed the diff from `10a55d8`: the six changed or new test files, `tests/README.md`, and every YAML file under `content/trips/campania/`. I checked the content against `13-CONTEXT.md` (D-01..D-26), the RESEARCH field data, the D-14 verified-establishment list and the raw itinerary. `vitest run` passes on `campania-content`, `schema`, `trips`, `timelineRows` and `tripManifest` (518 tests).

What holds up:
- **Logistics.** Flights (19 at 16:35, 28 at 09:55), car pickup (Wed 23, 16:00, Capodichino), car return (Sat 26, Capodichino, ⚠), Ultimo (Fri 25, date unmarked per D-22) and PTN (Sun 27, ⚠) agree across days, `trip.yml` infoCards, Reservas and Práctica.
- **Links and dates.** Every `#slug` link resolves. The 2027 weekdays are correct.
- **D-14.** Only establishments on the verified list are named. Gorizia 1916 is named, but carries ⚠ as RESEARCH allows.
- **Privacy and leaks.** No Roma-leak words, no phone numbers, no booking codes and no emails.
- **Field data.** Ferry, Alibus, Cuma and Sorgeto data match RESEARCH and carry the marker where RESEARCH requires it.

The main defects:
1. **Map numerals.** On three days the numerals are not in visit order, although the guide says the map numbers points by visit order. The test registry hard-codes the wrong order.
2. **Napoli Sotterranea.** It has a children's box and a Práctica «Con niños» entry, but the itinerary visits it after the children have flown home.
3. **Thursday trattoria.** Its food card contradicts the Thursday timeline.
4. **Content test gaps.** Several assertions in the content spec are weaker than their titles claim: the plain-text key list is incomplete, two Práctica checks pass on unrelated sections, and the privacy check has gaps.
5. **No Campania network check.** No test checks D-02's requirement that the published Campania page does not fetch `sql_dump` or WASM.

## Warnings

### WR-01: Map and card numerals are not in visit order on three days, though the guide promises they are (and the test locks in the wrong order)

**File:** `content/trips/campania/trip.yml:42`, `content/trips/campania/monuments/lungomare-caracciolo.yml:3`, `vomero.yml:3`, `marina-corricella.yml:3`, `pozzo-vecchio.yml:3`, `castello-arechi.yml:3`, `days/sabado-19.yml:106`, `days/domingo-20.yml:133`, `days/jueves-24.yml:162`, `tests/data/campania-content.spec.ts:648-678`
**Issue:** `howTo` says «El mapa marca los puntos por orden de visita» (same promise as Roma). `day.cards` renders in data order, so the numerals on the cards read:
- `sabado-19`: II, I. The Vomero (II) is visited at 18:00, before the Lungomare (I) at 20:00.
- `domingo-20`: III, V, IV. Pozzo Vecchio (V) is at 16:30, before Corricella (IV) at 20:00.
- `jueves-24`: XI, XV, XII, XIII, XIV. Castello di Arechi (XV) is the second stop of the day, at 10:30.

Roma's days are monotonic (viernes I..VI, sábado ★ VII..XII ♪, …). The comment on `ROMANS` («por orden de visita») is false, and no test checks that numerals rise within a day. The test therefore makes the defect permanent instead of catching it. Someone following the markers on Thursday would go to the castle last.
**Fix:** Renumber: `vomero: I`, `lungomare-caracciolo: II`, `pozzo-vecchio: IV`, `marina-corricella: V`, `castello-arechi: XII`, `raito: XIII`, `baia-di-trentova: XIV`, `valle-del-calore: XV`. Update `ROMANS` and the `day` order to match. The e2e specs derive numerals from the YAML, so they need no change. Then add a per-day guard:
```ts
it('dentro de cada día, los numerales de las fichas crecen en orden de visita', () => {
  const rank = (r: string) => Object.values(ROMANS).indexOf(r)
  for (const d of docsOf('day')) {
    const rs = ((d.data.cards as string[]) ?? []).map(s => rank(String(monumentOf(s)!.roman)))
    expect(rs, d.file).toEqual([...rs].sort((a, b) => a - b))
  }
})
```

### WR-02: Napoli Sotterranea has a «Con niños» box and Práctica child advice, but it is visited after the children leave

**File:** `content/trips/campania/monuments/napoli-sotterranea.yml:31,43-47`, `content/trips/campania/reference/practica.yml:176`, `tests/data/campania-content.spec.ts:84`
**Issue:** The visit is on Sunday 27 at 12:00 (`days/domingo-27.yml:59-67`). The children fly home at 10:00 that day. The card's own prose says «ya los dos solos después de despedir a Arantxa y a los niños», yet the same file has a `family` box: «Para los niños es una aventura… de la mano de un adulto… tarifas para niños». Práctica «Con niños» also says «Napoli Sotterranea. No se puede bajar con carrito: llevad mochila portabebés». The guide contradicts itself on the ground. D-09 listed Napoli Sotterranea among the family cards before the Sunday plan was fixed. `FAMILY_REQUIRED` enforces that stale assumption.
**Fix:** Turn the `family` text into an access note (long staircase, narrow passages, not for claustrophobics) in a `facts` row or a section. Then remove `napoli-sotterranea` from `FAMILY_REQUIRED`, and drop or reword the Práctica bullet. The other option is to move the visit to a day when the children are there. Either way, record the D-09 deviation in the SUMMARY.

### WR-03: The Cilento trattoria card contradicts the Thursday timeline (morning, lunch and dinner)

**File:** `content/trips/campania/food/g-5-trattoria-calore.yml:9-11`, `content/trips/campania/days/jueves-24.yml:104-114,128-139`
**Issue:**
- The card says «Después de la mañana en las gargantas del Calore, la comida es en una trattoria…». On Thursday, though, the morning is the Duomo (09:00) and the Castello (10:30) in Salerno, and you reach Felitto at 13:00.
- The Opción B stop note puts **lunch** at this trattoria (`#g-5-trattoria-calore`). The second choice's «Opción 1» puts **dinner** at the same place («Cena en las colinas de Felitto»).
- `g-2-vannulo.yml:12-13` says to take the mozzarella «para el picnic junto al río», but lunch is at the trattoria.

This is exactly the kind of internal contradiction the phase brief asks to catch.
**Fix:** Pick one meal and say it the same way everywhere. Suggested: lunch at the trattoria, so the card reads «Al llegar a Felitto, la comida…». Then replace dinner «Opción 1» with something that is not the same trattoria, or reword it as «quedarse a cenar en Felitto antes de volver». Align the Vannulo line too («para la merienda junto al río»).

### WR-04: `PLAIN_KEYS` misses several plain-text fields, so a marker there would render literal `**`

**File:** `tests/data/campania-content.spec.ts:137-141`
**Issue:** The test «ningún marcador en un campo de texto plano» relies on a hand-kept key list. These fields render without MDC and are missing from it:
- `headings.mesas` / `headings.visitas` / `headings.table` (`ReservasSection.vue:91,102,112` use `{{ }}`)
- food `group` (`GastroSection.vue`, `p.gastro-section-title {{ g.group }}`)
- `brand.before` / `brand.after` (Topbar)
- `destinations` (portada)

A `**⚠ por confirmar**` added to any of them would ship with literal asterisks and the test would stay green.
**Fix:** Add `'mesas', 'visitas', 'table', 'group', 'before', 'after', 'destinations'` to `PLAIN_KEYS`. `table` is safe to add: `walkStrings` gives the strings inside rows their own keys (`desc`, `name`…), so only the `headings.table` string is affected. Better still, derive the list from A.3 of RESEARCH in one shared constant.

### WR-05: Two Práctica assertions pass on unrelated sections (vacuous)

**File:** `tests/data/campania-content.spec.ts:849-855`
**Issue:**
- `explica por qué el coche no cruza a Procida ni a Ischia` checks `b.includes('Procida') && b.includes('Ischia')` on any body. The «Ferris y puertos» body (`practica.yml:147`, «Caremar va a Procida e Ischia…») already satisfies it, so deleting the whole driving explanation keeps the test green.
- `da las medias de junio` checks `b.includes('28') && b.includes('18')`. Any body holding those digit pairs passes, for example a date or a time, even if the temperatures change.
**Fix:** Anchor both assertions to the content they claim to check:
```ts
expect(bodies().some(b => /Procida/.test(b) && /Ischia/.test(b) && /no residentes|prohibi/.test(b))).toBe(true)
expect(bodies().some(b => b.includes('**28 °C**') && b.includes('**18 °C**'))).toBe(true)
```

### WR-06: D-02 requires that published Campania does not fetch `sql_dump` or WASM, but no test covers Campania

**File:** `tests/data/build-isolation.spec.ts:150-166`
**Issue:** D-02 says Campania «must be present and prerendered, and must not pull `sql_dump` or WASM, like Roma».
- The only no-heavy-fetch check is `tests/parity/portada.spec.ts:135-172`, which visits the portada and Roma only. Parity specs cannot be edited.
- The build-isolation additions only check that `trips/campania/_payload.json` exists and contains «Baia di Sorgeto». A payload can exist while the page still queries Content at runtime.
- The trip-suffixed state-key check (`"$space:roma"`…) exists only for Roma.

So a regression where Campania falls back to the client-side SQLite path would pass the whole gate.
**Fix:** In `build-isolation.spec.ts`, add a Campania twin of the state-key test, which is a cheap static proxy. Ideally also add a non-parity Playwright check (e.g. in a new `tests/trips/` or build-time spec) that loads `/guiaRoma/trips/campania/` from `.output/public` and asserts no request matches `/__nuxt_content\/|sql_dump|\.wasm/`.
```ts
it('el payload de Campania usa claves de estado sufijadas por viaje', () => {
  const page = readFileSync(CAMPANIA_INDEX, 'utf8')
  for (const key of ['"$space:campania"', '"$scardNav:stack:campania"', '"$ssearch:query:campania"']) expect(page).toContain(key)
})
```

### WR-07: The privacy test (T-13-02) does not check emails or booking codes, and misses common phone formats

**File:** `tests/data/campania-content.spec.ts:573-583`
**Issue:** The brief forbids booking codes, phone numbers and personal emails.
- **Emails.** There is no `@` or email check, so `familia@…` in a note would pass.
- **Booking codes.** There is no check for PNR-style codes (6 uppercase alphanumerics, e.g. `K7XQ2P`).
- **Phones.** The digit-run regex `(?:\d[ .-]?){9,}` misses `(081) 549 4808` and `081 / 5494808`, because `)` and ` / ` break the run.

The content is clean today; the guard is weaker than its title claims.
**Fix:**
```ts
expect(text, `${doc.file}: email`).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/)
expect(text, `${doc.file}: localizador`).not.toMatch(/\b(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6}\b/)
expect(text, `${doc.file}: cifras`).not.toMatch(/(?:\d[\s.\-/()]*){9,}/)
```
Allow-list `CAMPANIA` if needed. `decoration` and `quoteAttr` are all-caps words with no digits, so the lookahead already excludes them.

## Info

### IN-01: Smaller prose-versus-timeline mismatches

**File:**
- `content/trips/campania/monuments/capodimonte.yml:29-30`
- `days/domingo-27.yml:29-30`
- `monuments/raito.yml:30`
- `food/g-3-caracale.yml:10-11` against `days/domingo-20.yml:94-96`
- `days/lunes-21.yml:30-31`

**Issue:**
- Capodimonte mentions «el libro comprado por la mañana», and the domingo light block says «una mañana de librerías». In the timeline, though, the bookshops are at 14:30 and the morning is Napoli Sotterranea.
- Raito is called «La mañana de la Opción A» but the stop is at 12:00, after the Duomo and the Castello.
- The Caracalè card calls itself «el sitio para la comida larga del domingo». The Sunday timeline says «comed algo ligero cerca del puerto» at Marina Grande.
- The lunes light block says to leave Il Focolare «para otra noche». No other island night is free: Tuesday night is Sorgeto, and Wednesday you leave.

**Fix:** Reword each to match the timeline («el libro de la tarde», «el mediodía de la Opción A», «la cena en la Corricella», «dejad Il Focolare»).

### IN-02: Named restaurants link to the section rather than their own card

**File:** `content/trips/campania/monuments/salerno-centro-storico.yml:31`, `content/trips/campania/monuments/rione-sanita.yml:32`
**Issue:** `[Hostaria Il Brigante](#gastronomia)` and `[Da Concettina ai Tre Santi](#gastronomia)` jump to the top of Gastronomía, although their cards (`#g-4-il-brigante`, `#g-1-concettina`) exist. Elsewhere the trip already links food cards directly (`jueves-24.yml:110,112,150`).
**Fix:** Link to `#g-4-il-brigante` and `#g-1-concettina`. Keep `#gastronomia` only for generic places such as «una pizzería de barrio».

### IN-03: The island is spelled two ways

**File:** `content/trips/campania/monuments/monte-epomeo.yml:18`, `baia-di-sorgeto.yml:19`, `pozzo-vecchio.yml:24` (against «Ischia» everywhere else, including `destinations`, stays and pills)
**Issue:** The Spanish exonym «Isquia» and the Italian «Ischia» are mixed. Search for «Isquia» therefore misses most of the guide, and the guide reads inconsistently.
**Fix:** Use «Ischia» throughout, as the stays and portada do.

### IN-04: Some times are stated as certain while the event times are unknown

**File:** `content/trips/campania/monuments/stadio-maradona.yml:54-55`, `days/viernes-25.yml:118`, `days/domingo-27.yml:103`
**Issue:** The stadium family box says «La vuelta será pasada la medianoche» as a fact, but the start time is ⚠. Both concert stops show `time: '19:30'` in a plain field with no hint that it is an arrival suggestion. The notes do carry the marker, so this is minor.
**Fix:** Soften the box to «probablemente pasada la medianoche». Optionally retitle the stops «Llegada al estadio · Ultimo» so 19:30 reads as an arrival time.

### IN-05: The D-14 test only inspects the food `name` field, and its generic-name regex is permissive

**File:** `tests/data/campania-content.spec.ts:519,541-546`
**Issue:**
- `GENERIC_NAME_RE = /^Una? /` accepts any name that starts with «Un » or «Una », so «Una Pizzeria Inventada 1920» would pass.
- Establishment names in day notes, light items and monument prose are never checked against `VERIFIED_NAMES`. For example, `g-1-pizzeria-vomero.yml:14` names Gorizia 1916. That one is legitimate, but nothing would flag an unverified one.

**Fix:** For generic cards, also require `address` to contain «a elegir sobre el terreno»; that check already exists, so tie the two together. Add a light deny-check for capitalised «Trattoria|Pizzeria|Hostaria|Caseificio <Name>» tokens in prose that are not in an allow-list (verified names plus Gorizia with ⚠).

### IN-06: Phantom requirement — the published-file scan still looks for `CAMPANIA-CENTINELA-12A`, which exists nowhere in content

**File:** `tests/data/build-isolation.spec.ts:65,185-190`
**Category:** necessity
**Issue:** The sentinel was deleted from `content/trips/campania/trip.yml`. `grep` finds it only in `tests/README.md` and this spec. The out-of-`skipIf` test already fails if anyone re-adds it to `trip.yml` (`:113-116`). So the build scan for it guards a state the source can no longer produce. The author keeps it on purpose as a «guarda de regresión»; removing it is a scope decision.
**Fix:** Optional. Drop `CAMPANIA_SENTINEL` from the offenders list and keep only the `trip.yml` absence check.

### IN-07: Generality without instantiation — incremental registries that are now final

**File:** `tests/data/campania-content.spec.ts:40,55,83,88,506-507`
**Category:** necessity
**Issue:**
- `FOOD_GROUPS_WRITTEN = FOOD_GROUPS` is an alias with exactly one value for its whole lifetime.
- The `WRITTEN_DAYS` / `WRITTEN_MONUMENTS` / `FAMILY_REQUIRED` / `MARKER_FILES` comments still say «Los planes siguientes añaden…», but the phase is closed: `:716-718` asserts the registry covers all ten days.

**Fix:** Inline `FOOD_GROUPS` and drop the alias. Update the comments to describe the final contract.

### IN-08: Stale `tests/README.md` labels and a silently dropped browser case

**File:** `tests/README.md` (§5.8 bullet «D-15 / D-16: los días aparecen en orden…»; the removed «grupo vacío» note at the end)
**Issue:**
- The days e2e was renamed to `D-03` in `campania.spec.ts:437-439`, but the README still files it under D-15 / D-16.
- The old note promised that the browser check of the empty `confirmed` group would arrive with Campania's `reservas.yml`. Campania fills both groups, so that path is still untested in the browser, and the new note no longer mentions the gap.

**Fix:** Relabel the bullet to D-03. Add one line saying the empty-group render is covered only by the unit/data rule, not by e2e.

### IN-09: The data spec and the e2e spec sort food files with different comparators

**File:** `tests/data/campania-content.spec.ts:531`, `tests/trips/campania.spec.ts:1115`
**Issue:**
- The data spec orders slugs with `localeCompare`. ICU ignores hyphens at primary strength.
- The e2e spec uses `Array.prototype.sort()` (UTF-16 code units).
- Content returns rows in file/id order.

These agree for today's `g-1…g-5` names, but they can diverge (e.g. `g-1-x` against `g-10-y`). The data test could then pass while the rendered order differs.
**Fix:** Use the same code-unit comparison in both: `a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0`.

---

_Reviewed: 2026-11-22T02:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
