# Phase 2: Esquema de datos + migración del contenido - Pattern Map

**Mapped:** 2026-06-19
**Files analyzed:** ~95 (6 config/schema/harness files + ~85 YAML data files + 3 Vitest specs)
**Analogs found:** strong analogs for the config + schema + test files; YAML data files map 1:1 to `index.html` source shapes; the cheerio harness + `vitest.config.ts` have **no in-repo analog** (noted explicitly).

> **Key framing for the planner:** This phase is almost entirely *new files*. The single most important analog is the **`index.html` itself** — it is the verbatim data source the YAML files transcribe, and its line map (CONTEXT §canonical_refs, lines 82-88) is the per-entity transcription key. For the config/test scaffolding, the **Phase-1 root config files** and the **Phase-1 Playwright specs** are the convention analogs (even though Phase-2 tests run on Vitest, not Playwright — only the *conventions* transfer, see §Framework caveat).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `content.config.ts` (MODIFY) | config (data-collection registry) | transform (schema→types/SQL) | `content.config.ts` (the Phase-1 stub itself) | exact (same file, fill the `collections: {}`) |
| `shared/schemas.ts` (NEW) | model (zod single source of truth) | transform (validation/typing) | RESEARCH §Code Examples (282-491); no in-repo zod module yet | research-pattern (no code analog) |
| `content/trips/roma/trip.yml` (NEW) | data (YAML document) | file-I/O (git-based content) | `index.html` 2283-2357 (hero/info-grid/cómo-usar) | source-shape (1:1 transcription) |
| `content/trips/roma/days/<dia>.yml` ×5 (NEW) | data (YAML document) | file-I/O | `index.html` timeline (viernes 2403-2446) + `places` 6269-6314 (order/coords) | source-shape |
| `content/trips/roma/monuments/<id>.yml` ×38 (NEW) | data (YAML document) | file-I/O | `index.html` card 2450-2576 + `CARD_TO_MOTIF` 2213 + `places` 6269-6314 | source-shape |
| `content/trips/roma/food/<id>.yml` ×26 (NEW) | data (YAML document) | file-I/O | `index.html` gastro-card 5346-5818 | source-shape |
| `content/trips/roma/artists/<id>.yml` ×13 (NEW) | data (YAML document) | file-I/O | `index.html` artist-card 5948-6099 (art) / 6111-6221 (arq+glosario) | source-shape |
| `content/trips/roma/reference/{reservas,practica}.yml` ×2 (NEW) | data (YAML document) | file-I/O | `index.html` reservas 5260-5333 / practica 5825-5938 | source-shape |
| `tests/data/schema.spec.ts` (NEW) | test (validation gate) | batch (read YAML → parse) | `tests/parity/subpath.spec.ts` (Node-fs + spec conventions) | role-match (framework differs) |
| `tests/data/invariants.spec.ts` (NEW) | test (cross-ref gate) | batch (load all → resolve refs) | `tests/parity/subpath.spec.ts` | role-match (framework differs) |
| `tests/data/migration-diff.spec.ts` (NEW) | test (fidelity gate, drives harness) | batch (HTML ⇄ YAML diff) | `tests/parity/golden.spec.ts` (golden-vs-source ethos) | role-match (framework differs) |
| `scripts/migration-diff.ts` (NEW) | utility (cheerio extract+diff harness) | transform (HTML→normalized text/links) | **NONE** (see §No Analog Found) | none |
| `vitest.config.ts` (NEW) | config (test runner) | — | `playwright.config.ts` (sibling test-config conventions) | weak (different runner; conventions only) |
| `package.json` (MODIFY) | config | — | `package.json` (itself) | exact |
| `eslint.config.mjs` (MODIFY, likely) | config | — | `eslint.config.mjs` (itself; `ignores` extension pattern) | exact |

---

## Framework caveat (read before the test sections)

Phase-1's only specs are **Playwright** (`tests/parity/**`). Phase-2's specs are **Vitest** (per RESEARCH §Validation Architecture 570-617: pure Node, no Nuxt runtime, no SQLite). So the Phase-1 specs are **not** API analogs — you do **not** copy `import { test, expect } from '@playwright/test'`. What transfers is the **project's test conventions** observed across both specs:

- **Spanish doc-comment header** explaining *what requirement* the spec proves and *why this approach* (every Phase-1 spec opens with one — golden.spec.ts 3-15, subpath.spec.ts 7-23). Replicate this.
- **`node:fs` / `node:path` usage style** (subpath.spec.ts 1-4 imports `node:` prefixed builtins). Replicate.
- **Requirement-ID call-outs in comments** (`PARITY-01`, `BUILD-01/03`). Phase-2 maps to `DATA-01..06` — cite them the same way (the Req→Test map is in RESEARCH 579-586).
- **ESLint exclusion of test harnesses** — `tests/parity/**` is in `eslint.config.mjs` `ignores`. Decide whether `tests/data/**` should be linted (it is *source* TS, not a verbatim harness — likely **lint it**, unlike `tests/parity/**`).

The canonical *Vitest spec body* to copy is in RESEARCH 596-616, **not** from any existing repo file.

---

## Pattern Assignments

### `content.config.ts` (config, transform) — MODIFY

**Analog:** the file itself (Phase-1 stub). The stub IS the analog — keep the import + `defineContentConfig` wrapper, replace the empty `collections`.

**Current state** (`content.config.ts` 1-8):
```ts
import { defineContentConfig } from '@nuxt/content'
// Stub de Fase 1: ... el esquema zod real ... se define en Fase 2.
export default defineContentConfig({
  collections: {},
})
```

**What to replicate:** the `import { defineContentConfig } from '@nuxt/content'` + `export default defineContentConfig({...})` shell; the Spanish explanatory comment style.

**What to change:** add `defineCollection` to the import; import the 6 schemas from `./shared/schemas`; fill `collections` with the 6 `type:'data'` collections + nested globs. Target shape is RESEARCH 495-513:
```ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { MonumentSchema, DaySchema, FoodSchema, ArtistSchema, ReferenceSchema, TripSchema } from './shared/schemas'
export default defineContentConfig({
  collections: {
    trip:      defineCollection({ type: 'data', source: 'trips/*/trip.yml',        schema: TripSchema }),
    day:       defineCollection({ type: 'data', source: 'trips/*/days/*.yml',      schema: DaySchema }),
    monument:  defineCollection({ type: 'data', source: 'trips/*/monuments/*.yml', schema: MonumentSchema }),
    food:      defineCollection({ type: 'data', source: 'trips/*/food/*.yml',      schema: FoodSchema }),
    artist:    defineCollection({ type: 'data', source: 'trips/*/artists/*.yml',   schema: ArtistSchema }),
    reference: defineCollection({ type: 'data', source: 'trips/*/reference/*.yml', schema: ReferenceSchema }),
  },
})
```
**Critical (RESEARCH Pitfall 1, 240-244):** Content does **not** validate values at build → this file alone does **not** satisfy DATA-05. The schemas must be importable by `tests/data/schema.spec.ts` too — hence `shared/schemas.ts`, not inline schemas here.

---

### `shared/schemas.ts` (model, transform) — NEW

**Analog:** **No in-repo zod module exists.** Use RESEARCH §Code Examples (282-491) as the literal blueprint — it derives every field 1:1 from `index.html`. Directory `shared/` does not exist yet (verified) → create it. `shared/` is a Nuxt 4 auto-import root, but here it is imported by path (`./shared/schemas`) from both `content.config.ts` and the test, so it is framework-agnostic.

**Import convention (BLOCKED, CLAUDE.md §What NOT to Use + RESEARCH 284):**
```ts
import { z } from 'zod'   // NEVER `import { z } from '@nuxt/content'` (deprecated re-export)
```

**Core pattern — reusable sub-schemas** (RESEARCH 286-298), then per-collection schemas:
- `Coords`, `Fact`, `Md = z.string()`, `Link = { ref, label, note? }`
- `Motif = z.enum([...19 motifs...])` — the 19 values come **verbatim** from `CARD_TO_MOTIF` (`index.html` line 2213; full map in §Shared Patterns below). A misspelled motif must make `schema.spec` red.
- `Pace = z.enum(['all','medium','slow-only'])`, `PlaceType = z.enum(['card','guided','concert'])`
- `MonumentSchema` (305-327) — **must** include `artists: z.array(Link).optional()` AND `arch: z.array(Link).optional()` (RESEARCH Pitfall 2, 246-250 — both are multi-link; see proof in §Shared Patterns).
- `DaySchema` with `timeline: z.array(z.discriminatedUnion('kind', [...]))` (349-396) and `cards: z.array(z.string())`.
- `FoodSchema` (402-415), `ArtistSchema = z.discriminatedUnion('kind', [artist | arquitectura | glossary])` (419-446), `ReservasSchema`/`PracticaSchema` + `ReferenceSchema` (450-479), `TripSchema` (482-491).

**What to replicate:** the field names, enums, and `z.infer`-friendly structure exactly as RESEARCH spells them (they were read line-by-line from the HTML).

**What the planner decides (CONTEXT "Claude's Discretion" 53-58):** final field names, discriminator keys, gastro `group` modeling, where eyebrows/intros live, glossary as 3rd `kind`. RESEARCH recommends specific answers (e.g. glossary = `kind:'glossary'`, line 186; `archLink` left inline in `body` + invariants scans `(#…)`, lines 673-676).

**Anti-patterns to avoid** (RESEARCH 219-224, 270-274): no fixed per-section fields (headings vary → use `sections: [{heading, body}]`); no `id` field (reserved by Content → use `slug`); no `.refine()` for cross-refs (lost in JSON-Schema conversion → cross-refs go in the invariants test).

---

### `content/trips/roma/monuments/<id>.yml` ×38 (data, file-I/O) — NEW

**Analog:** `index.html` 2450-2576 (the two fully-read example cards) + the YAML target in RESEARCH 516-550.

**Source shape — `galleria-sciarra` card** (`index.html` 2450-2510, abridged to the load-bearing structure):
```html
<article class="card" id="galleria-sciarra">          <!-- id == slug -->
  <span class="card-roman">I</span>                  <!-- roman; or ★/♪ from places[].n -->
  <h3>Galleria Sciarra</h3>                           <!-- name -->
  <div class="card-italian">Galleria Sciarra · Rione Trevi</div>   <!-- italian -->
  <span class="card-badge">Sorrentino</span>          <!-- badge? -->
  <div class="card-hero"><img src="https://turismoroma.it/...jpg" alt="Galleria Sciarra" onerror="loadSvgFallback(this,'galleria-sciarra')"></div>  <!-- hero {src,alt} -->
  <div class="card-section"><h4>Qué es</h4><p>…</p></div>          <!-- sections[].{heading,body} -->
  <div class="card-section no-dropcap"><h4>En qué fijarse</h4>
    <div class="detail-photo"><img …><div class="detail-photo-caption">…</div></div>  <!-- :detail-photo INLINE, BEFORE list -->
    <ul class="detail-list"><li>El <strong>techo…</strong>…</li>…</ul>               <!-- Markdown '- …' -->
  </div>
  <div class="facts"><div class="facts-row"><span class="label">…</span><span class="value">…</span></div>…</div>  <!-- facts[] -->
  <a href="https://www.google.com/maps/search/?api=1&query=Galleria%20Sciarra%20Roma" class="maps-link">…</a>      <!-- mapsQuery -->
  <div class="sorrentino-box"><span class="label">La Grande Bellezza</span> …texto…</div>  <!-- sorrentino? -->
  <div class="notes-area"><textarea … data-note-key="galleria-sciarra"></textarea></div>   <!-- note key = slug (NOT migrated; Fase 7) -->
</article>
```

**Cross-ref blocks** (NOT on the first card; on `fontana-trevi`/`santignazio`, `index.html` 2521 & 2587-2588):
```html
<div class="card-artists card-arch">Arquitectura: <a class="art-link" href="#arq-moderna">Tardobarroco</a></div>
<div class="card-artists">Artistas: <a class="art-link" href="#art-pozzo">Andrea Pozzo</a></div>
<div class="card-artists card-arch">Arquitectura: <a class="art-link" href="#arq-barroco">Barroco</a></div>
```
→ `artists: [{ref:'art-pozzo', label:'Andrea Pozzo'}]` and `arch: [{ref:'arq-barroco', label:'Barroco'}]`. **Do not drop these** (DATA-04). Note `fontana-trevi` uses a `culture-box` (2564-2570) instead of `sorrentino-box` → model as `culture: [{title, text}]` (RESEARCH 326).

**Fields NOT in the HTML card — pull from `places[]`** (`index.html` 6269-6314): `roman` (`.n`), `coords` (`.lat/.lng`), `type` (`card`|`guided`|`concert`), `day` (`.day` — e.g. `pantheon` = `'Viernes / Sábado'`, appears in two days). `motif` comes from `CARD_TO_MOTIF` (2213).

**Target YAML** (RESEARCH 516-550) — one object per file, NEVER a top-level array (RESEARCH Pitfall, 221); prose in YAML block scalars (`>` folded / `|` literal) with Markdown-inline + `:detail-photo{...}` placed at its exact position.

**Write via the Write tool** — never heredoc. (~38 files; the harness in `scripts/migration-diff.ts` may bootstrap drafts per D-07, then the diff verifies them.)

---

### `content/trips/roma/days/<dia>.yml` ×5 (data, file-I/O) — NEW

**Analog:** `index.html` timeline `<div class="timeline">` (viernes fully read, 2403-2446) + `places[]` for `cards` order verification.

**Source shape — the 5 timeline row `kind`s** (`index.html` 2403-2446):
```html
<div class="tl-item" data-pace="all"><span class="tl-time">~17:00</span><span class="tl-title disabled">Llegada…</span><div class="tl-note">…</div></div>           <!-- kind:'stop' (disabled = no ref) -->
<div class="tl-item" data-pace="slow-only"><span class="tl-time">19:30</span><a href="#galleria-sciarra" class="tl-title">Galleria Sciarra</a><span class="tl-tag">Sorrentino</span>…</div>  <!-- kind:'stop' + ref + tag + pace -->
<div class="tl-item reserved-event" data-pace="all">…<a href="#g-fortunata">Cena…</a><span class="tl-tag">reservado</span>…</div>   <!-- kind:'stop' reservedEvent -->
<div class="tl-transport taxi" data-pace="all"><div class="tl-transport-header">…</div><div class="tl-transport-modes"><div class="tl-transport-mode recommended">…</div>…</div><div class="tl-transport-footnote">…</div></div>  <!-- kind:'transport' variant=taxi -->
<div class="tl-meta"><span class="tl-meta-item ok">⏱ <b>60 min</b> · …</span></div>   <!-- kind:'meta' items[].level=ok -->
<div class="tl-food"><div class="tl-food-header">…</div><div class="tl-food-list"><div class="tl-food-item reserved"><a class="tl-food-name" href="#g-fortunata">…</a><span class="tl-resv-badge">✓ reservado 22:30</span>…</div>…</div><div class="tl-food-foot">…</div></div>  <!-- kind:'food' entries[] -->
<div class="tl-resv-meta">✅ <strong>Cena reservada…</strong></div>   <!-- kind:'reservation' -->
```
Maps 1:1 to `TimelineRow = z.discriminatedUnion('kind', [...])` (RESEARCH 349-376). `data-pace` (`all`|`medium`|`slow-only`) → `pace` per row; `.tl-transport-mode.recommended` → `recommended:true`; transport icons 🚕/🚆/Ⓜ️/🚶 → `modes[].icon`.

**`cards: string[]` — CRITICAL (RESEARCH Pitfall 3, 252-256):** order is the **DOM order of `<article class="card">` within the day's `<section>`**, NOT `places[]` order (which is roman-numeral order with jumps — `minerva`=XXXV, `san-luigi`=XXXVI sit among Monday's). Read each day's section in `index.html` (viernes §2375, sábado §2840, domingo §3445, lunes §4002, martes §4736) to get the visual order.

**What to replicate:** the discriminated row structure + per-row `pace`. **What to change:** HTML→YAML; `<strong>`/`<em>` → `**`/`_`.

---

### `content/trips/roma/food/<id>.yml` ×26 (data, file-I/O) — NEW

**Analog:** `index.html` gastro-card (5346-5818; `g-felice` read at 5346-5360).

**Source shape** (`index.html` 5346-5360):
```html
<div class="gastro-card" id="g-felice">
  <span class="gastro-card-badge badge-trattoria">trattoria</span>      <!-- badge text + badgeKind from badge-* class -->
  <div class="gastro-card-name">Felice a Testaccio</div>                <!-- name -->
  <div class="gastro-card-address">Via Mastro Giorgio 29 · Testaccio</div>  <!-- address -->
  <p class="gastro-card-desc">Desde 1936. …</p>                         <!-- desc (Md) -->
  <div class="gastro-plato"><strong>Plato estrella:</strong> tonnarelli…</div>  <!-- plato? (Md) -->
  <div class="gastro-card-footer">
    <span>Lun–Sáb · precio medio €35-45/persona</span>                  <!-- footer -->
    <a class="gastro-maps-link" href="https://…query=Felice%20a%20Testaccio…">📍 Google Maps</a>  <!-- mapsQuery -->
  </div>
</div>
```
→ `FoodSchema` (RESEARCH 402-415). `group` comes from the enclosing `gastro-section-title` (e.g. "Pasta clásica · trattorias históricas") and **orders the section** (Claude's discretion: field per food vs ordered sections). 5 cards have **no `id`** (Giolitti, Venchi, Sant'Eustachio, Pompi, Linari, RESEARCH A5) → assign a stable `slug` convention (planner decides).

---

### `content/trips/roma/artists/<id>.yml` ×13 (data, file-I/O) — NEW

**Analog:** `index.html` artist-card (`art-bernini` read at 5948-5967) + arquitectura `arq-*` (6111-6199) + glosario `arq-glosario` (6202-6221).

**Source shape — `art-bernini`** (`index.html` 5948-5967):
```html
<article class="artist-card" id="art-bernini">                  <!-- slug; kind:'artist' -->
  <div class="artist-avatar">B</div>                            <!-- avatar -->
  <h3>Gian Lorenzo Bernini</h3>                                 <!-- name -->
  <div class="artist-dates">Nápoles 1598 – Roma 1680 · escultor · arquitecto</div>  <!-- dates -->
  <div class="artist-epithet">«El hombre que esculpió el Barroco…»</div>   <!-- epithet -->
  <div class="artist-section"><h4>Quién fue</h4><p>…</p></div>   <!-- sections[].{heading,body} (orden DOM) -->
  <div class="artist-section"><h4>Obras maestras</h4><ul><li>…</li></ul></div>  <!-- body may contain a '- …' list -->
  <div class="artist-trip"><div class="artist-trip-head">✦ Lo verás en este viaje</div>
    <a href="#santa-teresa">Éxtasis…</a> · <a href="#piazza-navona">…</a> · …<strong>Vaticano</strong>.</div>  <!-- seenIn: [{ref,label}] (MANY, ·-separated) -->
</article>
```
→ `ArtistSchema` discriminated on `kind` (RESEARCH 419-446): `kind:'artist'` (7 `art-*`), `kind:'arquitectura'` (5 `arq-*` ages, adds `archLink`/`seenIn` to monuments), `kind:'glossary'` (1 `arq-glosario`, `terms:[{term,def}]` instead of `seenIn`). **`seenIn` `href`s are cross-refs** the invariants test resolves → monument.

**Note (D-04 + RESEARCH 186):** arquitectura unifies with artist via the discriminator; the glossary is the 3rd `kind` value. `archLink` (Barroco→`#art-bernini`/`#art-borromini`) lives **inline in the `body`** prose (RESEARCH Open Q 673-676), so the invariants test must scan `(#…)` inside `Md` fields, not just `ref` fields.

---

### `content/trips/roma/reference/{reservas,practica}.yml` ×2 (data, file-I/O) — NEW

**Analog:** `index.html` reservas (5260-5333) + practica (5825-5938). (Not re-read in full — line map from CONTEXT 87; shapes spelled out in RESEARCH 450-479.)

**What to replicate:** `ReservasSchema` = `confirmed:[{group, when, text}]` + `table:[{ref?, name, badge, badgeKind, isDone, desc}]` (bespoke tabular data, D-03 — the booking table is one of the two "data not prose" inflection points). `PracticaSchema` = `sections:[{heading, body}]` prose + `media:[{category, items[]}]` (libros/películas/series/playlist). `reservas.table[].ref` resolves to food/monument (invariants test). `slug` is `z.literal('reservas')` / `z.literal('practica')`.

---

### `tests/data/schema.spec.ts` (test, batch) — NEW

**Analog:** `tests/parity/subpath.spec.ts` (Node-builtin + project spec conventions) — **conventions only**, framework differs (see §Framework caveat). The Vitest *body* blueprint is RESEARCH 596-612.

**`node:` import + header conventions to replicate** (`tests/parity/subpath.spec.ts` 1-23):
```ts
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'   // ← Phase-2 uses: import { describe, it, expect } from 'vitest'
/**
 * Verificación local del subpath ... (BUILD-01/02/03, D-06).   ← replicate this header style, cite DATA-05/02/06
 */
```

**Core pattern (DATA-05 gate — RESEARCH 596-612):** glob every YAML per collection, `parseYaml(readFileSync(f,'utf8'))`, run `Schema.safeParse(data)`, assert `r.success` with `r.error.issues` in the message:
```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, globSync } from 'node:fs'        // node:fs style as in subpath.spec.ts
import { parse as parseYaml } from 'yaml'
import { MonumentSchema /* … */ } from '../../shared/schemas'   // same shared schema as content.config.ts
const files = globSync('content/trips/roma/monuments/*.yml')
describe('monument schema', () => {
  for (const f of files) {
    it(`valida ${f}`, () => {
      const r = MonumentSchema.safeParse(parseYaml(readFileSync(f, 'utf8')))
      expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
    })
  }
})
```
**Why pure Node, not `queryCollection`** (RESEARCH 617): Content silently "cleans" invalid data (defaults/meta) → querying would hide the very failures DATA-05 must catch. Also covers DATA-02 (timeline validates) and DATA-06 (`Md` fields are strings; optionally `parseMarkdown` without throw).

**What to replicate:** Spanish header w/ DATA-id; `node:fs` imports; one `it` per file (clear failure locus). **What to change:** Vitest imports (not Playwright); no webServer/spawn (this is a pure read test).

---

### `tests/data/invariants.spec.ts` (test, batch) — NEW

**Analog:** same as schema.spec — `tests/parity/subpath.spec.ts` conventions; blueprint RESEARCH 613-616.

**Core pattern (D-06 layer 2 / SC#4):** load ALL collections, build `Set<slug>`, assert no duplicate slugs, then for every cross-ref assert `allSlugs.has(ref)`:
- `day.cards[]` → monument
- `timeline[kind∈{stop,food}].ref` → monument|food
- `monument.artists[].ref` → artist(kind:artist) · `monument.arch[].ref` → artist(kind:arquitectura)  *(the two refs RESEARCH Pitfall 2 says not to drop)*
- `artist.seenIn[].ref` → monument · `reservas.table[].ref` → monument|food
- **plus** every `(#…)` found inside `Md` prose fields (covers inline `archLink` and any `[texto](#id)`, RESEARCH 676)
- **plus** `basename(stem) === slug` (RESEARCH 200-201) so the `#id` anchors keep resolving.

**What to replicate:** conventions as above. **What to change:** Vitest; cross-file resolution lives here (NOT in zod `.refine`, RESEARCH Pitfall 6, 270-274).

---

### `tests/data/migration-diff.spec.ts` (test, batch) — NEW

**Analog:** `tests/parity/golden.spec.ts` — the *ethos* of "assert migrated artifact == source-of-truth", and its **image-blocking / normalization discipline** (golden blocks all images to force a deterministic state; the diff likewise normalizes whitespace/entities/`<em>`↔`*` before comparing, D-08).

**Convention from golden.spec.ts** (3-15) to replicate — the header tying the spec to the source-of-truth and the requirement:
```ts
// === Golden de paridad del index.html ACTUAL (PARITY-01) ===
// ... Es la linea base inmutable contra la que la Fase 8 medira la paridad 100%.
```
Phase-2 equivalent: this spec is the **text+links fidelity gate (DATA-04/D-08)** against the same `index.html`.

**Core pattern:** import the harness from `scripts/migration-diff.ts`, run extract-by-id over `index.html`, compare normalized visible-text + `href` sets against the migrated YAML, assert zero missing/extra per id.

**What to replicate:** golden's "compare against the live `index.html`" framing + normalization-before-compare rigor. **What to change:** Vitest, not Playwright; text/link diff, not pixel diff.

---

### `scripts/migration-diff.ts` (utility, transform) — NEW

**Analog:** **NONE — stated explicitly.** No HTML-parsing / cheerio / extraction utility exists in the repo (`scripts/` directory does not exist yet, verified). The closest *philosophical* sibling is `tests/parity/golden.spec.ts` (both treat `index.html` as immutable source-of-truth), but it is Playwright-in-browser, not a Node DOM-parsing harness — **not** a code analog.

**Guidance for the planner (no analog → use RESEARCH §Don't Hand-Roll, 226-236):**
- Use **`cheerio`** (jQuery-like Node HTML parser) to extract visible text + `href`s per `#id` — do **not** regex HTML (nesting of `<em>`/`<strong>`/`<a>` inside `<p>` makes regex fragile).
- Keep the normalizer **minimal & testable**: `<strong>`↔`**`, `<em>`↔`*`/`_`, collapse whitespace, decode entities. D-08 is *normalized text+link equivalence*, not perfect Markdown conversion.
- May also **bootstrap** drafts (`index.html`→YAML), then the diff verifies them (D-07).
- `cheerio` is **not installed** (RESEARCH 637) → planner adds it (Wave 0). Convention for `node:`-builtin imports: follow `tests/parity/subpath.spec.ts` 1-4.

**Placement (`scripts/` vs `tests/`):** Claude's discretion (CONTEXT 57). RESEARCH structure (181-182) puts the harness in `scripts/` and the spec that drives it in `tests/data/`.

---

### `vitest.config.ts` (config) — NEW

**Analog:** `playwright.config.ts` — **weak** (sibling test-runner config; conventions only, the API is entirely different). No Vitest config exists yet.

**Convention to replicate from `playwright.config.ts`** (1-9): `defineConfig` default export + a Spanish header comment stating the harness's purpose and which requirement it serves:
```ts
import { defineConfig, devices } from '@playwright/test'
// Harness del golden de paridad (PARITY-01). ...
export default defineConfig({ testDir: './tests/parity', ... })
```
**What to change (this is the bulk of the work — no copyable body):** use `vitest`'s `defineConfig` (or `@nuxt/test-utils`' `defineVitestConfig` — RESEARCH 91 says the **pure** test needs only plain `vitest`, no Nuxt runtime), set `test.include` to `tests/data/**`. Do **not** point it at `tests/parity/**` (that stays on Playwright — see §Test-runner separation).

---

### `package.json` (config) — MODIFY

**Analog:** itself. **Replicate** the existing `scripts` block style (`tests/parity` is driven by `test:golden`, `test:subpath`, package.json 14-16) → add a `test:data` (e.g. `"test:data": "vitest run tests/data"`, matching RESEARCH 575). **Add devDeps** `vitest@4.1.9` + `yaml` (+ `cheerio` for the harness), per RESEARCH 99-104 / 619-621. Note: `@nuxt/content` & `zod` are already dependencies (lines 25 & 33); `better-sqlite3` already a devDep (line 21).

---

## Shared Patterns

### The `motif` enum — verbatim from `CARD_TO_MOTIF`
**Source:** `index.html` line 2213 (read in full). **Apply to:** `Motif` enum in `shared/schemas.ts` + every `monuments/<id>.yml`.
The 19 motif keys (zod enum values) and the per-monument assignment are this exact map (38 ids):
```js
const CARD_TO_MOTIF = {"vaticano":"church","galleria-sciarra":"arch","fontana-trevi":"fountain","santignazio":"dome","pantheon":"pantheon","piazza-navona":"obelisk","campo-fiori":"statue","doria-pamphilj":"painting","santeustachio":"church","castel-santangelo":"fortress","tempietto":"temple","smt":"church","fontanone":"fountain","giardino-aranci":"garden","buco-serratura":"keyhole","bocca-verita":"mask","ghetto":"arch","tartarughe":"fountain","vittoriano":"monument","monti":"rooftops","casanatense":"library","minerva":"church","san-luigi":"painting","torre-scimmia":"tower","popolo":"obelisk","spagna":"stairs","tazza-doro":"coffee","auditorium":"monument","laterano":"church","san-clemente":"church","san-pietro-vincoli":"statue","galleria-borghese":"statue","palazzo-barberini":"painting","cappuccini":"church","smm":"church","palazzo-massimo":"statue","angeli":"church","santa-teresa":"statue"};
```
Distinct values → enum: `dome, pantheon, arch, fountain, obelisk, statue, painting, church, fortress, temple, garden, keyhole, mask, monument, rooftops, library, tower, stairs, coffee` (19). `SVG_MOTIFS` (line 2212) is the render side (Fase 7) — not migrated as data, but the `motif` key links a monument to its fallback SVG.

### `places[]` is the ONLY source of `roman` / `coords` / `type` / `day`
**Source:** `index.html` 6269-6314 (read in full, 38 entries). **Apply to:** every `monuments/<id>.yml`.
These four fields are **not** in the `<article class="card">` markup — they live only in the JS `places` array: `n`→`roman` (incl. `★` guided, `♪` concert), `lat`/`lng`→`coords`, `type`→`type` (`card`/`guided`/`concert`), `day`→`day` (text; `pantheon` = `'Viernes / Sábado'`). `day.cards[]` order, however, does **NOT** come from `places` (Pitfall 3) — it comes from DOM order in each day's section.

### Cross-ref blocks `card-artists` / `card-arch` (the easy-to-miss links)
**Source:** `index.html` 2521, 2587-2588 (read). **Apply to:** `MonumentSchema.artists[]` + `.arch[]` and the invariants test.
Both are **arrays** of `{ref, label}` (multiple links per monument), sit just under `card-header`, and are **absent from the first example card** — so they are easy to overlook (RESEARCH Pitfall 2). Grep `index.html` for `card-artists` (~10) / `card-arch` (~9) to enumerate; each must round-trip to YAML (DATA-04) and resolve in invariants.

### `slug` (not `id`) is the stable anchor
**Source:** RESEARCH Pattern 1 (188-203) + 564. **Apply to:** every collection schema + every YAML file + the invariants test.
Content's auto `id` is the path (`monument/roma/monuments/galleria-sciarra.yml`) and `id` is **reserved** → declare a `slug` field = the `index.html` anchor (`galleria-sciarra`). Convention: filename === `slug`; invariants assert `basename(stem) === slug`. This is what keeps `[texto](#galleria-sciarra)` prose links and `localStorage['roma-note-<id>']` keys (Fase 7) resolving.

### zod import + Markdown-inline prose
**Source:** CLAUDE.md §What NOT to Use + RESEARCH 284. **Apply to:** `shared/schemas.ts`.
`import { z } from 'zod'` — never the deprecated `@nuxt/content` re-export. Prose fields are `Md = z.string()` (plain string) holding Markdown-inline (`**bold**`, `_italic_`, `[t](#id)`) + `:detail-photo{...}` MDC components inline. Render is Fase 4; Fase 2 only writes MDC-ready strings (DATA-06).

### Test-runner separation (Playwright vs Vitest)
**Source:** `playwright.config.ts` 7-8 (`testDir: './tests/parity'`) + `eslint.config.mjs` 13 (`ignores: ['tests/parity/**']`). **Apply to:** `vitest.config.ts` + `eslint.config.mjs`.
Phase-1 owns `tests/parity/**` (Playwright). Phase-2 adds `tests/data/**` (Vitest). Keep them disjoint: Vitest's `include` = `tests/data/**`; Playwright's `testDir` stays `tests/parity`. Decide ESLint coverage for `tests/data/**` (likely lint it — it is source TS, unlike the verbatim-protected `tests/parity/**`).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/migration-diff.ts` | utility (cheerio harness) | transform | No HTML-parsing/extraction utility or `scripts/` dir exists. RESEARCH §Don't Hand-Roll (226-236) prescribes cheerio + a minimal normalizer; `cheerio` not installed. Use RESEARCH as the spec, not a code analog. |
| `vitest.config.ts` | config | — | No Vitest config exists. `playwright.config.ts` shares only the `defineConfig`+header *convention*; the API/body is entirely different (different runner). Body comes from `vitest`/`@nuxt/test-utils` docs, not the repo. |
| `shared/schemas.ts` | model | transform | No zod module exists in-repo; `shared/` dir doesn't exist. The blueprint is RESEARCH §Code Examples (282-491), derived 1:1 from `index.html`. |

(YAML data files are listed under Pattern Assignments rather than here: they *do* have a strong analog — the `index.html` source shapes — even though no `.yml` exists yet.)

---

## Metadata

**Analog search scope:** repo root config files (`content.config.ts`, `nuxt.config.ts`, `playwright.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `package.json`, `.gitignore`); `tests/` (both Phase-1 specs read in full); `app/`, `server/`, `public/`, `shared/`, `scripts/` (existence checked); `index.html` data-source sections (monument cards 2450-2576, day timeline 2403-2446, `places[]` 6269-6314, `CARD_TO_MOTIF`/`SVG_MOTIFS` 2212-2213, gastro-card 5346-5360, artist-card 5948-5967).
**Files scanned:** ~14 (6 root config + 2 Phase-1 specs + 6 `index.html` excerpts); directory existence verified for `shared/`, `scripts/`, `server/`, `public/`, `app/`.
**Pattern extraction date:** 2026-06-19
