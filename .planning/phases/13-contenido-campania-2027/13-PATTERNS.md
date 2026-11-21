# Phase 13: Contenido Campania 2027 - Pattern Map

**Mapped:** 2026-11-22
**Files analyzed:** ~52 (1 trip.yml, 10 days, ~24 monuments, ~8-12 food, 2 reference, 1 new test, 7 modified tests/docs)
**Analogs found:** all / all (content phase: every file has a Roma or skeleton analog)

All analogs below are git-tracked source (`content/trips/**`, `tests/**`). Roma, prueba and forma are READ-ONLY (D-19). No `app/`, `shared/`, `nuxt.config.ts`, `tests/parity/**` edits.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `content/trips/campania/trip.yml` (rewrite) | config/content | transform (YAML -> Content) | `content/trips/roma/trip.yml` + current `campania/trip.yml` (stays) | exact |
| `content/trips/campania/days/{sabado-19,domingo-20,martes-22,jueves-24,viernes-25}.yml` (rewrite, new orders 1,2,4,6,7) | content (day) | transform | current skeleton file of same slug + `roma/days/domingo.yml` (meta/reservation/light) | exact |
| `content/trips/campania/days/{lunes-21,miercoles-23,sabado-26,domingo-27,lunes-28}.yml` (new) | content (day) | transform | `campania/days/domingo-20.yml` (ferry), `jueves-24.yml` (choice for sabado-26), `sabado-19.yml` (plane for lunes-28) | exact |
| `content/trips/campania/monuments/*.yml` (11 rewrite + ~13 new) | content (card) | transform | `campania/monuments/baia-di-sorgeto.yml` (nature+family), `roma/monuments/auditorium.yml` (concert -> `stadio-maradona`) | exact |
| `content/trips/campania/food/g-*.yml` (new) | content (food) | transform | `roma/food/g-baffetto.yml` | exact |
| `content/trips/campania/reference/reservas.yml` (new) | content (reference) | transform | `roma/reference/reservas.yml` + 12.1 `headings` | exact |
| `content/trips/campania/reference/practica.yml` (new) | content (reference) | transform | `roma/reference/practica.yml` | exact |
| `tests/data/campania-content.spec.ts` (new) | test (data, Node) | batch read | `tests/data/invariants.spec.ts` (imports from `./trips`) | role-match |
| `tests/data/build-isolation.spec.ts` (modify, publication plan) | test (post-build) | file-I/O | itself, Roma block lines ~116-147 | exact |
| `tests/unit/tripManifest.spec.ts` (modify) | test (unit) | request-response | itself lines 51-68 | exact |
| `tests/trips/portada.spec.ts` (modify) | test (e2e dev) | request-response | itself lines 75-88 | exact |
| `tests/trips/campania.spec.ts` (modify) | test (e2e dev) | request-response | itself lines 188-198, 435-441, 906-933 | exact |
| `tests/unit/timelineRows.spec.ts` (modify) | test (unit) | transform | itself lines 67-79 | exact |
| `tests/unit/searchIndex.spec.ts` (likely unchanged; content constraint) | test (unit) | transform | itself lines 211-223 | exact |
| `tests/README.md` (modify counts/prose) | docs | — | itself §5.1/§5.5/§5.8/§5.9 | exact |

## Pattern Assignments

### `content/trips/campania/trip.yml` (config/content)

**Analog:** current `content/trips/campania/trip.yml` (keep shape) + `content/trips/roma/trip.yml` (infoCards, sections).

Keep top-level shape (draft, slug, title, decoration, heroMeta, quote, quoteAttr, infoCards, howTo, map, pageTitle, brand, mapLegend, footer, stays). Add Phase 11 portada fields `startDate: '2027-06-19'`, `endDate: '2027-06-28'`, `destinations`, `summary` (NO links: `trip-summary-link`).

**infoCards pattern** (roma/trip.yml lines 7-15; `value` is Markdown):
```yaml
infoCards:
  - label: Alojamiento
    value: |
      **Hotel Royal Court**
      Via Marghera 51, Esquilino
```
**sections.gastronomia** (roma/trip.yml lines 49-57) — recommended:
```yaml
sections:
  gastronomia:
    eyebrow: Roma · gastronomía   # Campania: 'Campania · gastronomía'
    intro: >-
      ...
```
**stays** (current campania/trip.yml, bottom) — keep slugs `napoles, procida, ischia, salerno`; `area`/`note` are NOT rendered, so repeat any «⚠ por confirmar» in day prose/Reservas:
```yaml
stays:
  - slug: salerno
    name: Salerno            # campania.spec expects name 'Salerno'
    area: Costa de Amalfi
    coords: { lat: 40.6824, lng: 14.7681 }
    note: ...
```
**Sentinel rule (Pitfall 1):** keep `draft: true` and the `CAMPANIA-CENTINELA-12A` howTo sentence until the publication plan; that plan removes both in the same commit as the build-isolation inversion. Add D-24 credit line («Fotografías: Wikimedia Commons · licencias y autores en cada archivo») to `footer` or `howTo`. Avoid `mapExtras`. Legend: avoid «Einaudi»/«Roma».

---

### Days (`content/trips/campania/days/*.yml`)

**Header pattern** (campania/days/jueves-24.yml lines 1-10):
```yaml
slug: jueves-24
trip: campania
order: 6            # skeleton has 4 -> renumber; orders contiguous 1..N at EVERY commit
pill: 'Jue 24'
roman: VI
eyebrow: 'jueves · 24 de junio'   # Spanish only, never 'giugno'
title: ...
subtitle: ...
stay: salerno
```
**Route** (viernes-25.yml): `route:\n  mode: driving`; plane/city days `route: { enabled: false }`; domingo-20 has NO `route` key (test expects undefined).

**Stats with variant** (sabado-19.yml; text never starts with the emoji — CSS prepends glyph):
```yaml
stats:
  - variant: plane
    text: '**Vuelo** directo a Capodichino · llegada a media tarde'
  - variant: bus
    text: '**Alibus** aeropuerto → centro, ≈20 min'
```
**Transport with variant** (domingo-20.yml; marker goes in `desc`, which is Markdown; `header` is plain text):
```yaml
  - kind: transport
    pace: all
    variant: ferry
    header: De Porta di Massa a Procida
    modes:
      - icon: ⛴️
        recommended: true
        desc: '**Ferry Caremar** desde Porta di Massa · salidas a las 12:15 o a las 13:30 **⚠ por confirmar**'
        tag: recomendado
        meta: '⏱ **≈1 h**'
```
Transport **without variant** (sabado-19.yml third row) must remain on day 19 directly after plane -> bus.

**Stop** (doubtful time: plain `time`, marker in `note`):
```yaml
  - kind: stop
    pace: all
    time: '08:30'
    title: Spaccanapoli
    ref: spaccanapoli
    note: ... **⚠ por confirmar**
```
Non-card stop (car return, airport drop-off): add `disabled: true` (roma/days/domingo.yml line 55).

**Meta row** (roma/days/domingo.yml 87-92; only ⏱/🚶 leading glyphs, never 🚌/⛴️/🚗):
```yaml
  - kind: meta
    items:
      - level: ok
        text: '⏱ **55 min** · ...'
      - level: plain
        text: '🚶 hasta siguiente: **5 min** · ...'
```
**Food row** (roma/days/domingo.yml 136-141; `entries[].ref` must exist as food slug):
```yaml
  - kind: food
    pace: all
    header: 🍴 ...
    entries:
      - ref: g-...
        name: ...
        desc: ...
```
**Reservation row** (roma/days/domingo.yml 207-211): `- kind: reservation\n    text: >-\n      ✅ **...** ...`

**Choice** (campania/days/jueves-24.yml lines 19-79) — strict; no `pace` on choice; 2-3 options; options' rows are base rows:
```yaml
  - kind: choice
    options:                      # first choice: NO heading
      - label: Opción A
        title: ...
        rows:
          - kind: stop
            pace: all
            ref: raito            # option-only cards cited ONLY via stop.ref
      - label: Opción B           # every B row pace: medium (stop/transport only)
        title: ...
        rows:
          - kind: stop
            pace: medium
            ref: valle-del-calore
          - kind: transport
            pace: medium
            variant: walk         # exactly ONE .tl-transport.walk in Thursday choices
  - kind: choice                  # contiguous second choice
    heading: Para cenar, elige una
    options: [3 options, one title >= 70 chars]
```
Thursday must keep: ≥1 transport and ≥1 meta inside choices (meta goes in Opción A, not B), shared Duomo + Castello outside choices. sabado-26 copies the single-choice shape («Opción 1»/«Opción 2»), shared car transport before, shared disabled stops after.

**Light block** (roma/days/sabado.yml 15-29) — add one per day (DaySection banner promises it):
```yaml
light:
  title: 🦶 Versión ligera · sábado
  items:
    - kind: see       # see | move | skip | care | rest
      text: >-
        **Imprescindibles:** ...
```
`cards: [...]` at end; each monument in exactly one day's `cards`.

---

### Monuments (`content/trips/campania/monuments/<slug>.yml`)

**Analog:** campania/monuments/baia-di-sorgeto.yml (full file) — nature + family:
```yaml
slug: baia-di-sorgeto        # = filename
trip: campania
roman: IX                     # unique numeral per marker
name: Baia di Sorgeto
italian: 'Baia di Sorgeto · Panza · Forio'
day: Martes 22
coords:
  lat: 40.6992
  lng: 13.8784
type: nature                  # card | guided | concert | nature
motif: thermal                # one of the 23 existing
hero:
  src: https://upload.wikimedia.org/wikipedia/commons/thumb/.../960px-...   # replace example.invalid
  alt: Baia di Sorgeto
sections:
  - heading: Qué es
    body: >-
      ...
facts:
  - label: Acceso
    value: 'Libre · unos 230 escalones desde Panza'   # facts[].value is Markdown
mapsQuery: Baia di Sorgeto Ischia
family: >-
  ... escalones ... linterna ...   # keep both words; «linterna» ONLY here (searchIndex.spec)
```
**Concert card** (roma/monuments/auditorium.yml lines 1-16) for `stadio-maradona`:
```yaml
roman: ♪
type: concert
motif: monument
badge: concierto
```
plus `facts` (Concierto / Llegada recomendada / Duración) and a «Logística práctica» section with Markdown list body (auditorium.yml «Logística práctica»). Prose must not contain Roma-leak words.

---

### Food (`content/trips/campania/food/g-*.yml`)

**Analog:** roma/food/g-baffetto.yml (full):
```yaml
slug: g-baffetto            # always g- prefix (dup-id vs monuments)
trip: roma                  # -> campania
group: Pizza
badge: pizzeria storica
badgeKind: pizza            # Campania: pizza | trattoria | deli | caffe | pasticceria | gelato (no quinto/ghetto)
name: Pizzeria da Baffetto
address: Via del Governo Vecchio 114 · Navona   # plain text; unverified: 'Vomero · a elegir sobre el terreno'
desc: >-                    # Markdown: marker allowed here
  ...
plato: >-
  **Plato estrella:** ...
footer: Todos los días (cena) · €12-18/persona · sin reservas ·   # plain text: no ** marker
itineraryTag: viernes zona Navona
mapsQuery: Pizzeria da Baffetto Via del Governo Vecchio 114 Roma
```
Only research-verified establishments named (D-14).

---

### `content/trips/campania/reference/reservas.yml`

**Analog:** roma/reference/reservas.yml lines 1-60 + 12.1 `headings` (shared/schemas.ts 369-385):
```yaml
slug: reservas
trip: campania
order: 1
title: Reservas
eyebrow: Campania · organización
intro: >-
  ...
headings:                         # strict; omit a key -> Roma text inherited («3 comensales»!) — set all three
  mesas: ✈️ Vuelos, barcos y coche
  visitas: 🎟️ Conciertos y entradas
  table: Alojamientos, ferris y coche · qué falta por reservar
confirmed:
  - group: mesas                  # enum stays mesas|visitas (1st/2nd block)
    when: Sáb 19 · 16:35          # plain text
    text: 'Vuelo a Nápoles-Capodichino **⚠ por confirmar**'   # Markdown
table:
  - ref: stadio-maradona          # optional; must be monument/food slug if present
    name: Concierto de Ultimo
    badge: semanas antes
    badgeKind: urgent             # urgent | done | rec
    desc: >-
      ...
```
Rows without a card (beds, ferries, car) omit `ref` (Roma has rows without ref). Empty confirmed group now renders nothing (12.1).

---

### `content/trips/campania/reference/practica.yml`

**Analog:** roma/reference/practica.yml lines 1-50, 124:
```yaml
slug: practica
trip: campania
order: 2
title: ...
eyebrow: Campania practica
intro: >-
  ...
sections:
  - heading: Ferris y puertos
    body: |
      - **...**: ...
media: []                 # allowed empty; categories libros|peliculas|series|playlist
```
Headings must cover: ferris, conducción/ZTL/islas, calor, calzado, niños, conciertos (campania-content.spec asserts).

---

### `tests/data/campania-content.spec.ts` (new)

**Analog:** tests/data/invariants.spec.ts lines 1-14 (imports from `./trips`):
```ts
import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { collectStrings, loadTrip, timelineRowsOf, TRIPS_ROOT } from './trips'
```
Available exports (tests/data/trips.ts): `TRIPS_ROOT` (57), `loadTrip(dir)` -> `LoadedTrip { docs: Doc[] }` (187), `timelineRowsOf(timeline)` (125, flattens choice options), `collectStrings(value)` (227), `checkTrip` (245). Assertions per RESEARCH Validation map: 10 slugs/orders 1..10, choices on jueves-24/sabado-26, transport variants, D-10 slugs, `hero.src` prefix `https://upload.wikimedia.org/`, coords bbox lat 40.3-41.15 lng 13.8-15.3, each monument in exactly one day, food groups, reservas rows, practica headings, `⚠ por confirmar` count ≥ N in Campania and **0** in `loadTrip('roma')` (full marker only — Roma has bare «por confirmar» in g-bar-musa.yml), and no `**⚠` in plain fields (`time`, `header`, `title`, `address`, `footer`, `when`).

---

### `tests/data/build-isolation.spec.ts` (publication plan)

Invert lines 107-113 (sentinel + `/^draft: true$/m` present) to absent; replace lines 145-147:
```ts
  it('no existe trips/campania: el borrador no se prerenderiza (D-16, Fase 12)', () => {
    expect(existsSync(join(OUT, 'trips', 'campania')), ...).toBe(false)
  })
```
with a Roma-style positive block copied from lines 116-123:
```ts
  it('existe trips/roma/index.html ...', () => { expect(existsSync(INDEX)).toBe(true) })
  it('... contiene «Galleria Sciarra» ...', () => { expect(html()).toContain('Galleria Sciarra') })
```
-> `trips/campania/index.html` + `_payload.json` exist, contains «Baia di Sorgeto». Keep prueba/forma sentinel tests (91-103, 140-143) unchanged. Update header prose 34-38.

### `tests/unit/tripManifest.spec.ts` lines 51-68
```ts
{ slug: 'campania', draft: false },                       // was true
prerenderRoutes(...) -> ['/', '/trips/campania/', '/trips/roma/']
draftExcludes(..., false) -> ['trips/forma/**', 'trips/prueba/**']
```
### `tests/trips/portada.spec.ts` lines 75-88
`toHaveCount(1)` -> 2; first card href `/guiaRoma/trips/campania/` (sortTrips by startDate desc), second `/guiaRoma/trips/roma/`.

### `tests/trips/campania.spec.ts`
- 188-198 «la portada de dev no lista el borrador»: invert to `expect(hrefs).toContain('/guiaRoma/trips/campania/')`.
- 435-441: replace `toEqual([1, 2, 3, 4, 5])` with derived contiguous check + `days.length === 10`; rename «los cinco días».
- 906-933 Thursday route: `walking`/«a pie» -> `driving`/«… en coche».
- Header prose («borrador … nunca se publica», `example.invalid`).

### `tests/unit/timelineRows.spec.ts` lines 67-79
```ts
expect([...optionOnlyRefs(jueves.timeline)].sort()).toEqual(['baia-di-trentova', 'raito', 'valle-del-calore'])
expect(refs).toEqual(['duomo-di-salerno', 'raito', 'baia-di-trentova', 'valle-del-calore', 'castello-arechi'])
```
(adjust to final Thursday content). domingo-20 ferry true / plane false stays.

### `tests/unit/searchIndex.spec.ts` lines 211-223
No edit if Sorgeto `family` keeps «escalones» and «linterna» and «linterna» appears nowhere else in that file.

## Shared Patterns

### «⚠ por confirmar» marker (D-12)
Exact string `**⚠ por confirmar**` (U+26A0 + space, no U+FE0F), only in Markdown fields: `stop.note`, `modes[].desc/meta`, `meta.items[].text`, `facts[].value`, `family`, `sections[].body`, food `desc/plato`, reservas `intro/confirmed[].text/table[].desc`, `infoCards[].value`, `howTo[]`. Never in `time`, `header`, `title`, `eyebrow`, `address`, `footer`, `when`, `name`, `stays[].area/note` (unrendered).

### Gate constraints (tests/data/trips.ts RULES, line 91)
`trip: campania` on every file; filename = slug; food `g-` prefix; refs (incl. inside choice options) must exist in the same commit; day orders contiguous 1..N every commit; anchors `#reservas/#gastronomia/#practica` only once those files exist; no `#arte/#arquitectura`; no reserved keys (`id`, `meta` top-level).

### Roma-leak trap (tests/trips/romaLeaks.ts:21)
Visible text never contains `Roma, Einaudi, giugno, MMXXVI, Pay, Fellini, Royal Court` (whole-word, case-insensitive) — e.g. Salerno's «Via Roma» -> «el paseo marítimo».

### Process
Node 22 PATH prefix; `rm -rf .data .nuxt .output` after YAML edits; `test:trips` never concurrent with generate/verify; no parity spec or golden edits.

## No Analog Found

None. Every new file mirrors a Roma or Campania-skeleton file.

## Metadata

**Analog search scope:** content/trips/{roma,campania}, tests/{data,unit,trips}, shared/schemas.ts
**Files scanned:** ~20
**Pattern extraction date:** 2026-11-22
