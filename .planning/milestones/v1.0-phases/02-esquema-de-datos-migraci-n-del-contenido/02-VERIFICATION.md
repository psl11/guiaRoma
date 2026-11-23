---
phase: 02-esquema-de-datos-migraci-n-del-contenido
verified: 2026-06-19T10:07:14Z
status: passed
score: 8/8 must-haves verified
note: >-
  Verification initially found 1 gap (gaps_found, 7/8); it was closed in-phase
  (commits b7a4a93, fbe8f9c) and re-verified deterministically — all 8 section-level
  texts present verbatim, pnpm test:data 295 passed, typecheck + lint clean, gate
  teeth intact, index.html untouched. Status promoted gaps_found → passed.
overrides_applied: 0
gap_closure:
  resolved: 2026-06-19
  commits: [b7a4a93, fbe8f9c]
  summary: >-
    DATA-04/SC#3 gap (8 section-level editorial texts dropped) RESOLVED. The 6
    section eyebrows/intros now live in TripSchema.sections (trip.yml) and the 2
    group gastro-intros in food.groupIntro (g-checchino, g-giggetto), all verbatim
    1:1. Root cause closed: migration-diff gained extractSectionMeta()/
    extractGroupIntro() + a section-level diff test (with always-on negative
    fixtures) that fails if any of these texts is missing or altered; groupIntro
    added to STRUCTURAL_KEYS so the per-card diff stays correct. pnpm test:data =
    295 passed (281 + 14 section-level). typecheck + lint clean. See
    02-06-SUMMARY.md ▸ "Gap Closure".
gaps:
  - truth: "Migrar TODO el contenido de Roma 1:1 a datos, sin perder ni una palabra ni un enlace (DATA-04 / SC3)"
    status: resolved
    reason: >-
      [RESOLVED via gap closure — commits b7a4a93/fbe8f9c. Original finding kept for audit:]
      5 editorial paragraphs visible in index.html are not captured in any YAML file:
      (1) gastronomia main gastro-intro — "Roma tiene cuatro platos de pasta (cacio e pepe,
      carbonara, amatriciana, gricia)…" (index.html line 5340);
      (2) gastronomia section-eyebrow — "Roma · gastronomía" (line 5337);
      (3) Quinto quarto group gastro-intro — "El «quinto quarto» es lo que queda del animal…"
      (lines 5501-5502);
      (4) Ghetto group gastro-intro — "La cocina del Ghetto tiene 2.000 años de historia…"
      (lines 5541-5542);
      (5) Arte section art-intro — "Roma no se entiende sin las manos que la hicieron…"
      (line 5945);
      (6) Arte section-eyebrow — "Roma · entender lo que ves" (line 5943);
      (7) Arquitectura section art-intro — "Roma es una clase de arquitectura de 2.500 años…"
      (lines 6108-6109);
      (8) Arquitectura section-eyebrow — "Roma · leer los edificios" (line 6106).
      The migration-diff harness (migration-diff.spec.ts) operates per-card (extractFromHtml
      selects article.card / .gastro-card / article.artist-card), so these section-level
      paragraphs — which sit OUTSIDE any card container — are invisible to it. All 281
      tests pass while this prose is absent. The FoodSchema has groupIntro: Md.optional()
      defined precisely for this purpose, but the executor explicitly chose not to populate
      it (02-06-SUMMARY key-decisions). Similarly, TripSchema has no fields for
      gastronomia/arte/arquitectura section-level eyebrows or intros.
    artifacts:
      - path: "content/trips/roma/food/*.yml"
        issue: "groupIntro field (optional in FoodSchema) never populated — Quinto quarto and Ghetto gastro-intro paragraphs dropped"
      - path: "content/trips/roma/trip.yml"
        issue: "No section-level intro/eyebrow fields for gastronomia, arte, or arquitectura sections"
    missing:
      - >-
        Add a `sections` array to TripSchema (or a dedicated top-level field) to hold the
        gastronomia eyebrow + intro, arte eyebrow + intro, and arquitectura eyebrow + intro.
        Suggested home: trip.yml sections field, e.g.:
          sections:
            - id: gastronomia
              eyebrow: "Roma · gastronomía"
              intro: "Roma tiene cuatro platos de pasta…"
            - id: arte
              eyebrow: "Roma · entender lo que ves"
              intro: "Roma no se entiende sin las manos que la hicieron…"
            - id: arquitectura
              eyebrow: "Roma · leer los edificios"
              intro: "Roma es una clase de arquitectura de 2.500 años a cielo abierto…"
      - >-
        Populate groupIntro on the first food card of the Quinto quarto group
        (g-checchino.yml) and the Ghetto group (g-giggetto.yml) with the text of their
        respective gastro-intro paragraphs. This field already exists as optional in
        FoodSchema — only the YAML values are missing.
      - >-
        Extend the migration-diff harness OR add a separate section-level diff test that
        checks the prose of section containers (section#gastronomia > .gastro-intro,
        section#arte > .art-intro, section#arquitectura > .art-intro) against YAML fields,
        so this class of gap cannot regress silently.
---

# Phase 2: Esquema de datos + migración del contenido — Verification Report

**Phase Goal:** Definir el esquema de viaje tipado (la raíz de la que derivan búsqueda, ruta del día, mapa, ritmo y fallback) y migrar TODO el contenido de Roma a datos, sin perder ni una palabra ni un enlace, con la validación zod actuando como puerta de calidad del build.
**Verified:** 2026-06-19T10:07:14Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Las 6 colecciones (trip, day, monument, food, artist, reference) están definidas y nuxt build genera sus tipos sin romper (DATA-01) | VERIFIED | `content.config.ts` imports all 6 schemas from `shared/schemas.ts` with `defineCollection({ type: 'data', source, schema })`; `pnpm typecheck` exits 0 (nuxi typecheck clean). 6 distinct glob patterns confirmed. |
| 2 | El timeline de cada día codifica su order explícito de filas (kind + pace) y cada día declara cards[] con el orden exacto del DOM (DATA-02, DATA-03) | VERIFIED | `days/*.yml` (5 files): `DaySchema` discriminatedUnion by `kind` (stop/transport/meta/food/reservation), `Pace` per-row; `cards: z.array(z.string())` field present. `invariants.spec.ts` verifies `day.cards[] → monument` cross-ref resolves. |
| 3 | Un dato inválido (enum/required/tipo) hace fallar el test de esquema (puerta DATA-05) | VERIFIED | `tests/data/schema.spec.ts` fixture: `MonumentSchema.safeParse({ motif: 'foo' }).success === false`; `MonumentSchema.safeParse({ ...validMonument minus coords }).success === false`. Both run regardless of whether YAML files exist. `pnpm test:data`: 281 passed, 0 failed. |
| 4 | El esquema zod vive en un único módulo importado tanto por content.config.ts como por los tests (fuente única) | VERIFIED | `shared/schemas.ts` exports all 6 schemas. `content.config.ts` imports from `./shared/schemas`. `schema.spec.ts` and `invariants.spec.ts` import from `../../shared/schemas`. No duplicate definitions found. |
| 5 | El test de invariantes detecta ids duplicados y cross-refs que no resuelven (SC#4) | VERIFIED | `invariants.spec.ts` 98 tests: slugs unique (Set === ficheros), basename === slug (84 files), all 6 cross-ref types checked. Negative fixtures: `Set.has('no-existe') === false` demonstrates gate has teeth. `PAGE_SECTIONS` allow-list (`{inicio, mapa, arte, arquitectura, gastronomia}`) narrows scope correctly — bogus slugs like `art-foo-nonexistent` still fail (verified by logic trace). |
| 6 | El corpus de ficheros es el correcto: 38 monuments, 26 food, 13 artists, 5 days, 2 reference, 1 trip (SC#1) | VERIFIED | Filesystem count: monuments=38, food=26, artists=13, days=5, reference=2, trip=1 (trip.yml). `schema.spec.ts` conteo describe asserts expected=38/26/13/5/2/1; 281 tests pass. |
| 7 | La prosa rica se escribe en Markdown-inline lista para MDC, con negritas, enlaces y párrafos preservados (DATA-06) | VERIFIED | `Md = z.string()` throughout schemas; `sections[].body`, `desc`, `plato`, `howTo`, `intro`, `table[].desc` are all Markdown-inline strings. `schema.spec.ts` verifies these parse as strings (not null). Artists, monuments, food, reference files spot-checked: strong/em converted to `**/**` and `_/_`. |
| 8 | TODO el contenido de Roma está migrado 1:1 — sin perder ni una palabra ni un enlace (DATA-04 / SC#3) | FAILED | The 72 per-card IDs checked by migration-diff (38 monuments + 21 gastro with id + 13 artists) pass 0 missing/extra words and links. HOWEVER, section-level editorial prose visible in index.html is absent from all YAML files. 8 text items dropped: gastronomia section eyebrow + gastro-intro paragraph; Quinto quarto group gastro-intro; Ghetto group gastro-intro; arte section eyebrow + art-intro; arquitectura section eyebrow + art-intro. These sit OUTSIDE gastro-card / artist-card containers and are invisible to the per-card migration-diff harness. The `groupIntro: Md.optional()` field in FoodSchema was defined for exactly this purpose but was deliberately left unpopulated (02-06-SUMMARY key-decisions). |

**Score:** 7/8 truths verified

---

### Deferred Items

No items deferred to later phases. The missing section-level prose is not addressed in any later roadmap phase's success criteria. Phase 4 SC3 ("Las secciones de referencia [Reservas, Gastronomía, Práctica, Arte, Arquitectura] se renderizan desde datos e idénticas a hoy") DEPENDS on this data existing — if it is not in YAML by Phase 2, Phase 4 would need to hardcode these paragraphs in templates, violating the "desde datos" contract of UI-04/ARCH-01.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `shared/schemas.ts` | 6 zod schemas + sub-schemas, single source of truth | VERIFIED | Exports MonumentSchema, DaySchema, FoodSchema, ArtistSchema, ReferenceSchema, TripSchema, Motif (19 values), Pace, PlaceType. Imports `z` from `zod`, not `@nuxt/content`. No `.refine()`/`.superRefine()` for cross-refs. |
| `content.config.ts` | 6 defineCollection type data with nested globs | VERIFIED | Imports all 6 schemas from `./shared/schemas`; 6 collections with `trips/*/…` globs; comment explains shared-schema rationale. |
| `tests/data/schema.spec.ts` | Data validation gate (DATA-05) with inline fixtures | VERIFIED | Per-file Schema.safeParse loop; inline fixtures (valid/motif-invalid/missing-coords) always run; conteo describes (38/26/13/5/2/1). |
| `tests/data/invariants.spec.ts` | Unique IDs + cross-ref resolution gate (SC#4) | VERIFIED | 6 cross-ref types checked; basename===slug for 84 files; PAGE_SECTIONS allow-list for 5 navigational anchors; negative fixture set. |
| `tests/data/migration-diff.spec.ts` | Per-card 1:1 fidelity gate (DATA-04) | VERIFIED (with scope gap) | 83 tests (per-card equivalence for 72 HTML IDs); normalizador fixtures always run; negative fixture detects missing links. Gate is structurally blind to section-level prose outside card containers. |
| `scripts/migration-diff.ts` | cheerio harness: extractFromHtml, normalize, diffEntry | VERIFIED | D-08 equivalence by word multiset + href set. CHROME_SELECTOR excludes `.notes-area` and `.artist-avatar` (symmetrical). encodeMapsQuery handles `%27` apostrophe. stripMdcComponents handles `:detail-photo{}` inline MDC. |
| `content/trips/roma/` | 85 YAML files (38+26+13+5+2+1) | VERIFIED (with content gap) | All 85 files present and parseable. Per-card content passes migration-diff. Section-level prose absent (see gap). |
| `content/trips/roma/trip.yml` | Trip document: hero, infoCards, howTo, map | VERIFIED | slug: roma; title; decoration; meta; quote/quoteAttr; infoCards (4 entries); howTo (2 paragraphs); map.center/zoom matching index.html setView(41.8989, 12.477, 14). |
| `vitest.config.ts` | Vitest runner pointing to tests/data, disjoint from Playwright | VERIFIED | test.include targets tests/data; tests/parity remains Playwright. |
| `package.json` (test:data script) | `vitest run tests/data` | VERIFIED | Script present; `pnpm test:data` runs 281 tests clean. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `content.config.ts` | `shared/schemas.ts` | import of 6 schemas | WIRED | Direct named imports, no intermediate abstraction. |
| `tests/data/schema.spec.ts` | `shared/schemas.ts` | import of 6 schemas | WIRED | Same import path as content.config.ts — single source confirmed. |
| `tests/data/invariants.spec.ts` | `shared/schemas.ts` | (implicit via YAML parsing) | WIRED | Loads YAML and checks slug/cross-ref invariants; schema shapes validated independently by schema.spec. |
| `days/*.yml` cards[] | `monuments/*.yml` | slug references | WIRED | invariants.spec `day.cards[] → monument` passes for all 5 days. |
| `artists/*.yml` seenIn[].ref | `monuments/*.yml` | slug references | WIRED | invariants.spec `artist.seenIn[].ref → monument` passes for all 13 artists. |
| `monuments/*.yml` artists[]/arch[] | `artists/*.yml` | slug references | WIRED | invariants.spec `monument.artists[] → artist(kind:artist)` and `monument.arch[] → artist(kind:arquitectura)` pass. |
| `reference/reservas.yml` table[].ref | `food/*.yml` / `monuments/*.yml` | slug references | WIRED | invariants.spec `reservas.table[].ref → monument \| food` passes. |
| Inline `[text](#arq-barroco)` in body fields | `artists/*.yml` slugs | extractAnchors() scan | WIRED | invariants.spec inline anchors test passes; PAGE_SECTIONS allow-list correctly scoped to 5 navigational IDs; entity anchors like `#art-foo` would still fail. |
| `trip.yml` → FoodSchema `groupIntro` | section-level gastro-intro paragraphs | Field not populated | NOT WIRED | `groupIntro: Md.optional()` exists in schema but no YAML file carries this value. Section-level intros are unconnected. |

---

### Data-Flow Trace (Level 4)

Not applicable for Phase 2. This phase produces static YAML data files — no dynamic rendering occurs. Data-flow tracing applies to phases that render components consuming these collections (Phase 3+).

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| pnpm test:data runs 281 tests clean | `pnpm test:data` | 3 files passed, 281 tests passed, 0 failed | PASS |
| pnpm typecheck passes (DATA-01) | `pnpm typecheck` | Exit code 0 | PASS |
| Negative fixture: invalid motif rejected | `MonumentSchema.safeParse({ motif: 'foo' })` | success=false (confirmed by schema.spec) | PASS |
| PAGE_SECTIONS allow-list does not swallow entity slugs | Logic trace: `allSlugs.has('art-foo-nonexistent') \|\| PAGE_SECTIONS.has('art-foo-nonexistent')` | false — would be caught | PASS |
| Section-level gastro-intro present in YAML | `grep -rn "Roma tiene cuatro platos" content/` | No match | FAIL (gap) |
| groupIntro populated in any food file | `grep -rn "^groupIntro:" content/trips/roma/food/` | No match | FAIL (gap) |
| arte/arquitectura intros present in YAML | `grep -rn "Roma no se entiende\|Roma es una clase" content/` | No match | FAIL (gap) |

---

### Probe Execution

No conventional `scripts/*/tests/probe-*.sh` probes declared or found. Phase uses Vitest as the executable gate. `pnpm test:data` serves the equivalent role and was run directly (see Behavioral Spot-Checks).

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|------------|-------------|-------------|--------|----------|
| DATA-01 | 02-01, 02-04..07 | Esquema zod en colecciones Nuxt Content v3 | SATISFIED | 6 collections in content.config.ts; typecheck clean; 85 YAML files validate. |
| DATA-02 | 02-01, 02-03 | Timeline con kind y pace por fila | SATISFIED | DaySchema.timeline is discriminatedUnion; invariants pass; 5 days validated. |
| DATA-03 | 02-01, 02-03 | `cards: string[]` en orden exacto del DOM | SATISFIED | DaySchema.cards present; invariants.spec `day.cards[] → monument` resolves for all days. |
| DATA-04 | 02-02..07 | TODO el contenido migrado 1:1 sin pérdida | BLOCKED | 72 per-card diffs pass (0 missing/extra). 8 section-level prose items absent from all YAML — see gap above. The migration-diff gate cannot see outside card containers. |
| DATA-05 | 02-01 | Validación rompe el build ante dato inválido | SATISFIED | schema.spec inline fixtures prove gate rejects invalid motif/missing required field. 281 tests pass. |
| DATA-06 | 02-01, 02-04..07 | Prosa en Markdown-inline para MDC | SATISFIED | All prose fields (`sections[].body`, `desc`, `plato`, `intro`) are Md = z.string(). Spot-checked: `**`/`_` present in monument and food files. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/migration-diff.ts` | structural | Per-card scope only (article.card / .gastro-card / article.artist-card) | WARNING | Gate is structurally blind to section-level prose. Not a bug in the harness logic — it was designed for card-level diff — but it created a blind spot for the DATA-04 paridad claim. |
| `shared/schemas.ts` | 157 | `groupIntro: Md.optional()` defined but never used | WARNING | Field exists to capture gastro-intro text; no YAML file populates it. Orphaned capability. |
| `content/trips/roma/trip.yml` | — | No section-level eyebrow/intro fields | INFO | TripSchema has no `sections` structure for gastronomia/arte/arquitectura. These fields would need to be added before Phase 4 can render them from data. |

No `TBD`, `FIXME`, or `XXX` debt markers found in phase-modified files.

---

### Gaps Summary

**One gap blocks the DATA-04 / SC#3 contract.**

The migration-diff harness is a per-card tool: `extractFromHtml(id)` selects `article.card[id]`, `.gastro-card[id]`, or `article.artist-card[id]` and extracts text+links from that subtree only. Section-level elements — the `div.gastro-intro` between `gastro-section-title` and `gastro-grid`, and the `p.art-intro` at the top of the `#arte` and `#arquitectura` sections — live OUTSIDE those card containers. The harness produces 72 true-positive diffs and 0 false-positives. It passes while these 8 prose items are absent.

The root cause is a modeling decision made in 02-06-SUMMARY (food migration): "groupIntro NO se pobla en ninguna ficha — los gastro-intro son prosa de NIVEL GRUPO/SECCIÓN, fuera del subárbol DOM de cualquier gastro-card." That is architecturally correct, but the consequence is that the data simply does not contain this content. Similarly, no structure was defined or populated in TripSchema for the gastronomia, arte, or arquitectura section-level eyebrows or intros.

**Impact on downstream phases:** Phase 4 SC3 requires "Las secciones de referencia (Reservas, Gastronomía, Práctica, Arte, Arquitectura) se renderizan desde datos e idénticas a hoy." If the section-level intro prose does not exist in YAML, Phase 4 would need to hardcode it in templates rather than rendering it from data, violating the Core Value ("construida de forma dinámica y mantenible") and ARCH-01/UI-04.

**Remediation (concrete):**

1. Add a `sections` array to TripSchema (or a dedicated top-level field, e.g. `sectionMetadata`):
   ```yaml
   # in trip.yml
   sectionMetadata:
     - id: gastronomia
       eyebrow: "Roma · gastronomía"
       intro: "Roma tiene cuatro platos de pasta (cacio e pepe, carbonara, amatriciana, gricia), un quinto cuarto que la mayoría no conoce, una tradición de cocina giudaico-romana única en el mundo, y la pizza más debatida de Italia. La ciudad aún tiene decenas de trattorias donde comen los romanos de verdad. Los sitios de abajo cuadran con las zonas que vais a recorrer y con lo que merece la pena priorizar."
     - id: arte
       eyebrow: "Roma · entender lo que ves"
       intro: "Roma no se entiende sin las manos que la hicieron. Aquí están los artistas y arquitectos cuyas obras vais a ver durante el viaje: quiénes fueron, cómo reconocer su estilo y por qué siguen importando. Cada ficha enlaza con los lugares del itinerario donde os los vais a encontrar. Leed la del artista antes de cada visita: ver una obra sabiendo qué buscar lo cambia todo."
     - id: arquitectura
       eyebrow: "Roma · leer los edificios"
       intro: "Roma es una clase de arquitectura de 2.500 años a cielo abierto. En estos días vais a pasar de la cúpula del Panteón a una basílica paleocristiana, del Tempietto renacentista a una fachada barroca que ondula. Esta sección os da las **cinco edades** de la arquitectura romana —qué define a cada una, en qué fijarse y dónde la veréis— y, al final, un **glosario** para descifrar lo que tenéis delante. El objetivo: que podáis plantaros ante cualquier edificio y \"leerlo\"."
   ```

2. Populate `groupIntro` on the first food card of groups with a gastro-intro:
   - `g-checchino.yml` (Quinto quarto group): add `groupIntro: "El «quinto quarto» es lo que queda del animal…"`
   - `g-giggetto.yml` (Ghetto group): add `groupIntro: "La cocina del Ghetto tiene 2.000 años de historia…"`

3. Extend the migration-diff harness or add a complementary section-level diff test that compares `section#gastronomia > p.gastro-intro`, `section#arte > p.art-intro`, and `section#arquitectura > p.art-intro` content against the corresponding YAML fields.

---

### Human Verification Required

No automated checks can verify these items:

**None identified.** All outstanding issues are automated-verifiable (YAML field presence vs. index.html text) and are captured as the gap above.

---

_Verified: 2026-06-19T10:07:14Z_
_Verifier: Claude (gsd-verifier)_
