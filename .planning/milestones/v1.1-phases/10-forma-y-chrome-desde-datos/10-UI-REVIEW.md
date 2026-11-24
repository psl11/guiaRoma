# Phase 10 — UI Review

**Audited:** 2026-11-20
**Baseline:** 10-UI-SPEC.md (conservation contract: Rome pixel-identical, CSS frozen)
**Screenshots:** not captured (code-only audit; no dev server started, 56 parity goldens already green per summaries)
**Interaction captures:** off (workflow.ui_interaction_capture is false); interaction findings are code-derived

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Data-driven chrome with neutral fallbacks, no Rome literals in code; "Pratica" label and hard-coded shared Spanish chrome are not localizable |
| 2. Visuals | 3/4 | DOM contract honoured (sections direct children of main, one pill list); `<nav>` has no accessible name |
| 3. Color | 4/4 | Zero new color, tokens only, no hardcoded hex introduced |
| 4. Typography | 3/4 | No new sizes or weights; inherited 400/500/600 frozen by parity (documented exception) |
| 5. Spacing | 3/4 | No new spacing; inline styles remain in the map chrome (pre-existing, verbatim) |
| 6. Experience Design | 2/4 | Pill-bar overflow clips first pills for long trips (unresolved, known); no runtime guard for empty days |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **WARNING: nav-pill overflow clips "Inicio" for trips with many days** — `base.css:74` uses `justify-content: center` with `overflow-x: auto`, so overflowing pills at the start are unreachable. Rome already suffers at 768 and 1024px, and a 10-day trip (17 pills) clips at 1280px, which will hit Campania in Phase 13. Fix: `justify-content: safe center` (or center only when not overflowing) in a deliberate, user-approved CSS change, with Rome goldens re-checked at 768 and 1024.
2. **WARNING: `<nav id="nav-pills">` has no accessible name** — screen-reader users get an anonymous navigation landmark, and with more pills per trip this matters more. Fix: add `aria-label="Secciones de la guía"` in `app/components/NavPills.vue`. It is a markup-only change, but check whether the parity DOM snapshot tolerates it.
3. **WARNING: structural labels are fixed Spanish/Italian strings** — `STRUCTURAL_LABELS` in `app/utils/tripLayout.ts` hard-codes "Pratica" (no accent) and "Gastronomía" for every trip (D-09 accepted this). A non-Spanish future trip will get mismatched chrome. Fix: allow an optional per-trip override in Phase 12/13, defaulting to the current values.

Minor: the `dayPillLabel` slug-collision guard exists only in the data gate, so a trip with duplicate labels still renders and the user sees two identical pills at runtime.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)
- Rome chrome (`brand`, `mapLegend`, `footer`, `pageTitle`) moved to `trip.yml` and rendered via `{{ }}` or `<MDC :tag="false" unwrap="p">`. The `TripView.vue:87` `useHead` title falls back to `inlineMdToPlain(trip.title)`, never to a Rome literal (D-14).
- `Topbar.vue` brand fallback is `fallbackTitle` without `.brand-dot`, matching the spec.
- Grep for trap words (Roma, Einaudi, giugno, MMXXVI, Fellini) in `app/**` found hits only in comments (TripView, TheHero, GastroSection, PracticaSection, NavPills, MonumentCard), not in rendered strings. No code leak.
- Shared chrome in `TripView.vue` stays hard-coded Spanish: "cartografia", "El mapa del viaje", "Numeración por orden cronológico...", "Sin conexión · solo marcadores visibles". That is accepted as shared chrome (D-09) but is language-bound.
- `STRUCTURAL_LABELS.practica = 'Pratica'` is verbatim parity, not a defect for Rome.

### Pillar 2: Visuals (3/4)
- Sections are direct children of `<main>` through a `<template v-for>` (no wrapper), preserving `section + section` borders. Sibling order Topbar, main, BackButton, `.flourish`, footer is kept.
- Pills and sections come from one `buildTripLayout` list (D-06), so anchors cannot desync from sections.
- `footer` is omitted entirely when absent, which also drops its top border; the flourish stays. This follows the contract.
- Defect: `NavPills.vue` `<nav id="nav-pills">` has no `aria-label`. `ThemeToggle` has one ("Cambiar tema"), so the icon-only button is fine.
- Hero is rendered only for the `inicio` entry and requires `trip`, which is safe during hydration.

### Pillar 3: Color (4/4)
- No CSS or color change in the phase (`git diff` limited to 5 `app/` files, none under `assets/css`). New markup reuses `.nav-pill`, `.brand`, `.map-legend` and `footer p`, so accent use (active pill, hover) is unchanged. No new hex values found in the touched components.

### Pillar 4: Typography (3/4)
- No new font sizes or weights. The weights 400/500/600 and the non-scale 15.2px/19.2px/17px sizes are inherited and frozen per D-18; documented exceptions, not findings for this phase.
- The score is not 4 because three weights and fractional sizes exceed the abstract standard.

### Pillar 5: Spacing (3/4)
- No new spacing values. The brand whitespace rule is implemented exactly: `{{ brand.before }} <span class="brand-dot">✦</span> {{ brand.after }}` (one space each side).
- Pre-existing inline `style=` in the map chrome (`TripView.vue:121,126`) was carried over verbatim; this phase adds none. Also pre-existing: `PracticaSection.vue:116`, `SearchBox.vue:87`.
- Non-multiples of 4 (.35rem, .85rem, .75rem) are frozen exceptions.

### Pillar 6: Experience Design (2/4)
- Loading: optional fields are guarded (`trip?.brand ?? null`, `v-if="trip?.mapLegend"`, `footerLines` default `[]`, `layout` with `??`), so nothing mounts empty or throws during hydration.
- Empty: sections without data are omitted (no section, no pill). No "no data" message, by design (D-08).
- Error: data errors are build-time gates only; no runtime fallback for a day with an empty or duplicate label.
- BLOCKER-class risk for upcoming phases (rated WARNING here because Rome is unaffected): pill-bar overflow clipping with `justify-content: center` makes leading pills unreachable on narrow and many-pill layouts. The spec lists it as unresolved and CSS-prohibited this phase, so it is carried forward; it is the main reason for 2/4.
- Scrollspy `.active` for the final days of short pages is verified only by `href` and hash (backstop), not visually.
- Registry audit: skipped (no `components.json`, no third-party registries).

---

## Files Audited
- `/home/vcompanyb/guiaRoma/app/utils/tripLayout.ts`
- `/home/vcompanyb/guiaRoma/app/components/Topbar.vue`
- `/home/vcompanyb/guiaRoma/app/components/NavPills.vue`
- `/home/vcompanyb/guiaRoma/app/components/TripView.vue`
- `/home/vcompanyb/guiaRoma/app/components/ThemeToggle.vue`
- `/home/vcompanyb/guiaRoma/app/assets/css/base.css` (read-only)
- 10-UI-SPEC.md, 10-01-SUMMARY.md and the other phase 10 summaries (partial)
