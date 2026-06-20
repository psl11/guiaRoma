---
phase: 03-capa-de-p-gina-layout-y-tema
verified: 2026-06-19T19:55:00Z
status: passed
human_signoff: confirmed 2026-06-20 — golden parity re-confirmed by user AFTER the CR-01 hero-meta fix (earlier sign-off was on the pre-fix render)
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Full visual golden-parity check (light + dark, mobile + desktop)"
    expected: "The built / renders visually identical to the Fase 1 golden screenshots in both light and dark themes, on both mobile and desktop viewports"
    why_human: "The automated Playwright specs assert DOM structure, text content, and CSS computed values — but pixel-level visual identity against the golden requires the checkpoint that was already executed and APPROVED during Plan 05 Task 4. This item is flagged human_needed per the verifier protocol because Plan 05 Task 4 was a blocking human checkpoint — the user confirmed 'approved', but this cannot be re-run programmatically in verification without rebuilding the full Playwright session."
deferred:
  - truth: "artist/reference queryCollection queries resolve without SQL errors"
    addressed_in: "Phase 4"
    evidence: "Phase 4 goal: 'Renderizar fichas, timeline y secciones de referencia desde los datos'. deferred-items.md D1: 'Must be fixed before Phase 4'. Phase 4 requirements include UI-04 (reference sections from data)."
---

# Phase 3: Capa de pagina, layout y tema — Verification Report

**Phase Goal:** Construir la capa que agrega un viaje desde sus datos y lo entrega al arbol de componentes, con el shell de layout (Topbar, NavPills, BackButton) visualmente identico a hoy y el tema claro/oscuro resuelto sin parpadeo en estatico — fijando el anti-FOUC desde que el layout existe.
**Verified:** 2026-06-19T19:55:00Z
**Status:** passed (human golden-parity sign-off confirmed 2026-06-20, after the CR-01 hero-meta fix was applied and the parity test hardened to assert hero text)
**Re-verification:** No — initial verification

## Goal Achievement

The phase goal is achieved in the codebase. All four roadmap success criteria are satisfied by the actual code and the generated static output. One human verification item is retained because Plan 05 Task 4 was a blocking human checkpoint (golden-parity sign-off "approved" by the user) — this cannot be replicated programmatically.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `useTrip(slug)` aggregates all 6 collections with id indexes; `TripView` renders at `/` (slug 'roma') and at `/trips/[slug]`; adding a trip = adding content files (ARCH-01/ARCH-02) | VERIFIED | `app/composables/useTrip.ts`: 6 `useAsyncData` calls with unique keys `trip-${slug}`, `days-${slug}`, `mon-${slug}`, `food-${slug}`, `art-${slug}`, `ref-${slug}`; `buildTripIndexes` returns all 4 Maps. `app/pages/index.vue` renders `<TripView slug="roma">`. `app/pages/trips/[slug].vue` calls `useTrip(slug)` + `createError(404, fatal)` on miss. Generated `.output/public/` has only `/`, no `trips/` directory. |
| 2 | Layout/Topbar/NavPills componentized, visually identical to today (UI-01) | VERIFIED | `Topbar.vue` reproduces `header.topbar > div.topbar-inner > div.brand + ThemeToggle; NavPills` as sibling of `.topbar-inner`. `NavPills.vue` has exactly 12 nav-pills in locked order (verified in generated HTML). `BackButton.vue` is mounted-invisible shell (opacity 0, pointer-events none at rest). Zero `<style>` blocks in any of the 6 shell components. |
| 3 | Theme via `@nuxtjs/color-mode`, no FOUC — anti-flash inline script present in generated `<head>`; dark reload paints dark immediately (SC#3) | VERIFIED | Generated `index.html` `<head>` contains `<script>` with `getStorageValue("localStorage","roma-theme")`, `setAttribute("data-"`, and `"theme"` dataValue. Hero-meta renders `19 — 23 giugno 2026 · Hotel Royal Court` (not `[object Object]` — CR-01 fix confirmed). `tests/parity/theme.spec.ts` asserts anti-FOUC presence + behavioral dark-no-flash. |
| 4 | Moon/sun icon resolved only by CSS `[data-theme]`, no `v-if` per theme (SC#4) | VERIFIED | `ThemeToggle.vue`: both `<span class="moon">` and `<span class="sun">` always rendered (no `v-if`/`v-show`). Toggle function: `colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'` — reads resolved value, writes concrete preference, never writes string `'system'`. `tests/parity/theme.spec.ts` asserts both spans in DOM, one visible per `[data-theme]`, icon swaps on toggle, data-theme only ever `light|dark`. |

**Score:** 4/4 truths verified

### Deferred Items

Items not yet met but addressed in later phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | `artist`/`reference` queryCollection queries produce runtime SQL errors (`no such column: "trip"`) | Phase 4 | Phase 4 goal covers `secciones de referencia` rendering from data. `deferred-items.md` D1 explicitly states "Must be fixed before Phase 4". Impact in Phase 3: NONE (those sections are empty placeholders D-05; `useAsyncData` swallows to null; `buildTripIndexes` `?? []` guards yield empty Maps; home renders at 100% parity). |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/utils/dayLabel.ts` | Pure eyebrow→label transform (D-04) | VERIFIED | Exports `dayLabel(eyebrow: string): string`. Uses `split('·')[0] ?? ''`, `.trim()`, `.charAt(0).toLocaleUpperCase('it') + .slice(1)`. All 5 Italian day labels derived correctly with accent preservation. No `toUpperCase()` on whole string. |
| `tests/unit/dayLabel.spec.ts` | Unit coverage of all 5 day labels | VERIFIED | 7 assertions (5 label mappings + accent safety + first-char-only). Plain Vitest, no `@nuxt/test-utils`. |
| `vitest.config.ts` | `tests/unit/**` added alongside `tests/data/**` | VERIFIED | `include: ['tests/data/**/*.spec.ts', 'tests/unit/**/*.spec.ts']`. Both suites run independently. `pnpm test:unit` passes 12 tests; `pnpm test:data` passes 295 tests. |
| `package.json` | `test:unit` script added | VERIFIED | `"test:unit": "vitest run tests/unit"` present alongside existing `"test:data"`. |
| `app/composables/useTrip.ts` | Aggregates 6 collections, id Maps, resolves at SSG | VERIFIED | 6 `queryCollection` calls: `'trip'`/`'day'`/`'monument'`/`'food'`/`'artist'`/`'reference'`. Trip queried with `.where('slug','=',slug).first()`; others with `.where('trip','=',slug)`. Days and reference ordered ASC. No `.where('id',...)`. `buildTripIndexes` called in `computed()`. Returns all 10 keys. Framework-free type-only import from shared schemas. |
| `app/utils/tripIndexes.ts` | Pure id-Map builder unit-testable | VERIFIED | Exports `buildTripIndexes`. Pure function — only `import type` from shared schemas, no Nuxt/content imports. Guards inputs with `?? []`. Returns 4 typed Maps. |
| `tests/unit/tripIndexes.spec.ts` | SC#1 index-shape coverage | VERIFIED | Asserts 4 Maps exist, `.get(slug)` resolves correct entity, `.size` correct, empty input yields empty Maps. Plain Vitest. |
| `app/components/Topbar.vue` | Sticky header chrome (UI-01) | VERIFIED | `header.topbar > div.topbar-inner > div.brand + ThemeToggle`, with `NavPills` as sibling of `.topbar-inner` inside header. `defineProps<{ days: Day[] }>()`. No `<style>` block. |
| `app/components/ThemeToggle.vue` | 2-state theme toggle, CSS-only icon | VERIFIED | `useColorMode()` consumed. Toggle inverts `colorMode.value` to set concrete `colorMode.preference`. No `v-if`/`v-show` on icon spans. No `'system'` string. Adjacent `<span class="moon">` + `<span class="sun">` with no whitespace between. No `<style>` block. |
| `app/components/NavPills.vue` | Hybrid nav: 7 structural + 5 derived day pills | VERIFIED | `nav.nav-pills#nav-pills`. Locked order: Inicio, Mapa, [v-for days], Reservas, Gastronomia, Pratica, Arte, Arquitectura. `dayLabel(d.eyebrow)` called. No `active` class logic. No scroll listener. No `<style>` block. |
| `app/components/BackButton.vue` | Resting-invisible back button shell (D-07) | VERIFIED | `button#back-btn.back-btn[aria-label="Volver"]` with `span.back-btn-arrow` and text "Volver". No `@click` handler. No `.show` class. No `<style>` block. |
| `app/components/TripView.vue` | Page owner: chrome + 12-anchor scaffold (D-05) | VERIFIED | Calls `await useTrip(props.slug)`. Template order: `Topbar(:days)` → `main(TheHero + 11 empty sections)` → `BackButton` → `div.flourish` → `footer`. All 12 section IDs present in generated HTML in correct order. No `<style>` block. No `NuxtLink` to `/trips/*`. |
| `app/components/TheHero.vue` | Full #inicio block from trip data via MDC (D-06) | VERIFIED | `section#inicio > div.container`. Renders: `div.hero` (decoration/h1-MDC/`trip.heroMeta`/quote+attr), layout placeholders (search-wrap/pace-wrap/2×light-wrap, no handlers), static `h4` labels, `div.info-grid` v-for infoCards (MDC unwrap="p"), howTo v-for paragraphs (MDC). `trip.heroMeta` renders `19 — 23 giugno 2026 · Hotel Royal Court` in generated HTML (CR-01 fix verified). No `<style>` block. |
| `app/app.vue` | NuxtPage root + parity head (D-09), favicon preserved | VERIFIED | Template: `<NuxtPage />` (no NuxtLayout). `useHead` sets `htmlAttrs.lang: 'es'`, `title: 'Roma · 19—23 giugno 2026'`, two `theme-color` metas. Favicon `useHead` block preserved from Phase 1 using `useRuntimeConfig().app.baseURL`. |
| `app/pages/index.vue` | `/` route rendering TripView slug roma (D-02) | VERIFIED | Single-line template: `<TripView slug="roma" />`. No `NuxtLink` to `/trips/*`. |
| `app/pages/trips/[slug].vue` | Dynamic trips route + 404 guard, not prerendered | VERIFIED | Reads `useRoute().params.slug`. Calls `await useTrip(slug)`. Throws `createError({ statusCode: 404, statusMessage: 'Trip not found', fatal: true })` on missing trip. Renders `<TripView :slug="slug" />`. |
| `tests/parity/shell.spec.ts` | Built-/ shell parity + routing/404 + head + no-trips-dir | VERIFIED | Self-contained: `beforeAll` generates + serves. Asserts 12 nav-pills in locked order (with exact Italian day labels), `#inicio` masthead text (`giugno 2026`, `Hotel Royal Court`, not `[object Object]`), 4 info-cards, footer line, `back-btn` invisible at rest. Asserts D-09 head verbatim. Asserts no `trips/` dir in build output. Asserts `/trips/roma` reuses TripView shell; unknown slug 404s (via dev). |
| `tests/parity/theme.spec.ts` | Anti-FOUC (SC#3) + CSS-only icon toggle (SC#4) | VERIFIED | Asserts generated head has inline script with `getStorageValue("localStorage","roma-theme")` and `setAttribute("data-"`. Asserts `roma-theme=dark` preset paints dark immediately (no light-to-dark transition). Asserts both `.moon`/`.sun` in DOM; one visible per `[data-theme]`; icon swaps on toggle; `data-theme` only `light|dark`. |
| `shared/schemas.ts` | `heroMeta` field (CR-01 fix) | VERIFIED | `heroMeta: z.string()` with comment warning about reserved `meta` name. No top-level `meta` field on TripSchema. |
| `content/trips/roma/trip.yml` | `heroMeta` field (CR-01 fix) | VERIFIED | `heroMeta: 19 — 23 giugno 2026 · Hotel Royal Court` in YAML. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/pages/index.vue` | `app/components/TripView.vue` | `<TripView slug="roma">` | WIRED | Confirmed in file and in generated HTML |
| `app/pages/trips/[slug].vue` | `app/composables/useTrip.ts` + `createError` | `await useTrip(slug)` + `createError(404)` | WIRED | Both calls present in file |
| `app/components/TripView.vue` | `app/composables/useTrip.ts` | `await useTrip(props.slug)` | WIRED | `const { trip, days } = await useTrip(props.slug)` at line 30 |
| `app/components/TripView.vue` | `Topbar` / `BackButton` / `TheHero` | Auto-imported child components | WIRED | All three referenced in template; Topbar receives `:days`, TheHero receives `:trip` |
| `app/components/Topbar.vue` | `ThemeToggle` + `NavPills` | Auto-imported in template | WIRED | `<ThemeToggle />` inside `.topbar-inner`; `<NavPills :days="days" />` as sibling |
| `app/components/NavPills.vue` | `app/utils/dayLabel.ts` | `dayLabel(d.eyebrow)` in `v-for` | WIRED | `dayLabel` auto-imported; called in template v-for. Generated HTML shows `Venerdì`/`Sabato`/`Domenica`/`Lunedì`/`Martedì` |
| `app/components/ThemeToggle.vue` | `useColorMode` | `const colorMode = useColorMode()` | WIRED | Auto-imported; preference set in toggle function |
| `app/composables/useTrip.ts` | `app/utils/tripIndexes.ts` | `buildTripIndexes` in `computed()` | WIRED | `buildTripIndexes` auto-imported; called at line 59 inside computed |
| `app/composables/useTrip.ts` | `queryCollection` (6 collections) | 6 `useAsyncData` + `queryCollection` calls | WIRED | All 6 calls confirmed: trip/day/monument/food/artist/reference |
| `tests/parity/shell.spec.ts` | Generated `.output/public/index.html` | `beforeAll` generate + serve | WIRED | Self-contained build+serve pattern verified in file |
| `tests/parity/theme.spec.ts` | Generated `<head>` color-mode script | File read + behavioral assertion | WIRED | Reads generated `index.html` and asserts `roma-theme` + `setAttribute("data-"` |
| `app/components/TheHero.vue` | `trip.heroMeta` | `{{ trip.heroMeta }}` | WIRED | Field renamed from `meta` (CR-01 fix); generated HTML shows correct text |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/components/TheHero.vue` | `trip.heroMeta`, `trip.infoCards`, `trip.howTo` | `useTrip('roma')` → `queryCollection('trip').where('slug','=','roma').first()` → Nuxt Content SSG SQLite dump | Yes — generated HTML contains `19 — 23 giugno 2026 · Hotel Royal Court`, 4 info-cards with real content, howTo paragraphs | FLOWING |
| `app/components/NavPills.vue` | `days` prop (from `useTrip`) | `queryCollection('day').where('trip','=','roma').order('order','ASC').all()` | Yes — generated HTML shows 5 Italian day labels (Venerdì/Sabato/Domenica/Lunedì/Martedì) derived from real `eyebrow` fields | FLOWING |
| `app/components/TripView.vue` | `trip`, `days` (from `useTrip`) | All 6 `queryCollection` calls in `useTrip.ts`, resolved at prerender | Yes — `trip` flows to `TheHero`; `days` flows to `Topbar`/`NavPills`; verified in generated HTML | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `dayLabel` derives all 5 Italian day labels with accent preservation | `node -e` (inline implementation test) | `Venerdì`, `Sabato`, `Domenica`, `Lunedì`, `Martedì` all correct | PASS |
| Generated HTML hero-meta renders real text (not `[object Object]`) | `grep -n "hero-meta"` on `.output/public/index.html` | `<div class="hero-meta">19 — 23 giugno 2026 · Hotel Royal Court</div>` | PASS |
| 12 nav pills in locked order in generated HTML | `python3` regex on generated HTML | `['Inicio','Mapa','Venerdì','Sabato','Domenica','Lunedì','Martedì','Reservas','Gastronomía','Pratica','Arte','Arquitectura']` — exact match | PASS |
| 12 section IDs present in generated HTML | `python3` regex on generated HTML | `['inicio','mapa','viernes','sabado','domingo','lunes','martes','reservas','gastronomia','practica','arte','arquitectura']` — exact match | PASS |
| Anti-FOUC inline script in generated `<head>` | `python3` string checks on generated HTML | All pass: `roma-theme`, `getStorageValue("localStorage","roma-theme")`, `setAttribute("data-"`, `"theme"` dataValue, inline `<script>` | PASS |
| No `trips/` directory in build output | `ls .output/public/` | Only `200.html`, `404.html`, `__nuxt_content`, `_fonts`, `_nuxt`, `_payload.json`, `apple-touch-icon.svg`, `favicon.svg`, `index.html` | PASS |
| `pnpm test:unit` passes all 12 tests | `pnpm test:unit` | 2 test files, 12 tests — all passed | PASS |
| `pnpm test:data` passes all 295 tests (Phase 2 gate regression) | `pnpm test:data` | 3 test files, 295 tests — all passed | PASS |
| `pnpm typecheck` exits 0 | `pnpm typecheck` | Exit code 0 | PASS |
| `pnpm lint` exits 0 | `pnpm lint` | Exit code 0 | PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes defined for this phase. Behavioral checks run via spot-checks above.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ARCH-01 | Plans 03-02, 03-03, 03-04, 03-05 | Page renders a trip from `useTrip(slug)`; adding a trip = adding content files, no code change | SATISFIED | `useTrip.ts` aggregates 6 collections filtered by `slug`; any future trip YAML in `content/trips/<slug>/` triggers automatically via glob. `TripView` renders full page from data. |
| ARCH-02 | Plans 03-04, 03-05 | Routing ready for multi-trip (`/` = Roma; `/trips/[slug]` structure) reusing single `TripView` | SATISFIED | `app/pages/index.vue` renders `<TripView slug="roma">`. `app/pages/trips/[slug].vue` reuses `TripView` with 404 guard. Dynamic route exists but never prerendered (D-01 discipline). |
| UI-01 | Plans 03-03, 03-04, 03-05 | Layout/Topbar/NavPills componentized and visually identical to today | SATISFIED | All 6 shell components (Topbar, ThemeToggle, NavPills, BackButton, TripView, TheHero) reproduce verbatim index.html markup with no `<style>` blocks. CSS descendant selectors work. Parity head verbatim. |
| FEAT-01 | Plans 03-03, 03-05 | Light/dark theme with `@nuxtjs/color-mode` (`data-theme`, `storageKey:'roma-theme'`), respects `prefers-color-scheme`, no flash on static | SATISFIED | `nuxt.config.ts` configures `colorMode: { dataValue: 'theme', storageKey: 'roma-theme' }`. Anti-FOUC inline script present in generated HTML. `ThemeToggle.vue` uses `useColorMode()`. CSS-only icon toggle (no `v-if`). |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/composables/useTrip.ts` | 51 | `// eslint-disable-next-line @typescript-eslint/no-explicit-any` + `.order(...) as any` | Info | Necessary workaround: Content v3 cannot type `.order()` on discriminated union collections; the `as any` is scoped to one chain and documented. Not a blocker. |
| `app/composables/useTrip.ts` | 60-63 | `as unknown as` casts applied to all 6 collections (WR-03 from code review) | Warning (deferred) | Over-broad casts reduce TypeScript leverage. Deferred to Phase 4 per `deferred-items.md` D3 alongside the D1 union fix. Harmless in Phase 3 — the discriminated union collections (artist/reference) legitimately need them; the `z.object` ones do not. |
| `app/composables/useTrip.ts` | 38-53 | `.error` channel from 6 `useAsyncData` calls discarded (WR-02 from code review) | Warning (deferred) | Silent error swallowing is the mechanism that hides D1 at build time. Deferred to Phase 4 per `deferred-items.md` D3. Harmless in Phase 3 (affected sections are empty placeholders D-05). |

No `TBD`, `FIXME`, or `XXX` debt markers found in any Phase 3 file.

### Human Verification Required

#### 1. Full Visual Golden-Parity Confirmation (Light + Dark, Mobile + Desktop)

**Test:** Load the built site at `/guiaRoma/` (served from `.output/public`). Compare the rendered home against the Phase 1 golden screenshots (`tests/parity/golden.spec.ts-snapshots`): topbar, brand text, 12 nav pills with Italian day labels, `#inicio` masthead, info-grid (4 cards), footer. Repeat in light and dark themes. Toggle the theme button. Reload with `localStorage['roma-theme'] = 'dark'` preset and confirm no white flash.

**Expected:** Visual output is pixel-identical to the Phase 1 golden in both themes and both viewports (mobile/desktop). Theme toggle works without FOUC. Dark reload paints dark immediately.

**Why human:** The automated Playwright specs in `tests/parity/shell.spec.ts` and `tests/parity/theme.spec.ts` cover DOM/text/CSS assertions and behavioral FOUC checks. Pixel-level visual identity against the golden screenshots is the Plan 05 Task 4 blocking checkpoint that was already executed and approved by the user during execution ("approved" signal received). This is flagged here per the verifier protocol — the approval is documented in `03-05-SUMMARY.md` but cannot be programmatically replicated during verification without re-running the full Playwright session with a human watching.

**Note:** This item was already completed during phase execution (Plan 05, Task 4 — the human golden-parity + no-FOUC sign-off gate). The `03-05-SUMMARY.md` records: "Sign-off humano de paridad golden APROBADO: el usuario confirmo que el home renderizado es visualmente identico al golden de Fase 1 en claro+oscuro y movil+desktop, con el tema sin FOUC". This verification item is carried as `human_needed` per the decision tree — not as a new gap to resolve.

### Gaps Summary

No gaps. All 4 must-have truths are VERIFIED. All artifacts exist, are substantive, and are wired. All key links are confirmed. Data flows from queryCollection through useTrip through TripView to TheHero and renders correctly in the generated static HTML.

The CR-01 parity blocker (hero-meta `[object Object]` from reserved Content v3 field name `meta`) was found during code review and FIXED in commit `bc38f2e` by renaming to `heroMeta` across schema, YAML, and component. The fix is verified in the generated HTML.

Two code-quality warnings (WR-02 silent error swallowing, WR-03 over-broad casts) are correctly deferred to Phase 4 alongside D1 (discriminated-union SQL fix). They have zero impact on Phase 3 parity.

---

_Verified: 2026-06-19T19:55:00Z_
_Verifier: Claude (gsd-verifier)_
