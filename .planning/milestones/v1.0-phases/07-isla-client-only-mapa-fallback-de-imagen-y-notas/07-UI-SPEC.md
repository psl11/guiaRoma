---
phase: 7
slug: isla-client-only-mapa-fallback-de-imagen-y-notas
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-23
parity_port: true
---

# Phase 7 — UI Design Contract

> **Parity port — NOT a new design.** This spec codifies the existing visual and interaction
> contract for the three F7 pieces so the executor can reproduce it faithfully. The design
> system already exists and is frozen: all CSS lives verbatim in `app/assets/css/base.css` and
> `app/assets/css/leaflet.css`. No new CSS, no `<style scoped>`, no new tokens. The source of
> truth for every value below is the live `index.html` and the existing CSS files.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — CSS à la main (verbatim port) |
| Preset | not applicable |
| Component library | none |
| Icon library | none (SVG motifs are static string constants) |
| Font | Cormorant Garamond (markers, popups, offline banner, notes label) · Lora (notes textarea) · JetBrains Mono (facts, not touched in F7) |

**Source:** `CLAUDE.md §5` — "CSS verbatim, NO Tailwind/UnoCSS". Custom properties (`--accent`, `--gold`, `--ink-soft`, `--bg-elev`, `--line`, `--shadow`, `--bg-soft`) are the design tokens; they are already defined in the existing `:root`/`[data-theme="dark"]` blocks. F7 uses them but does not declare new ones.

---

## Spacing Scale

F7 introduces no new spacing. All spacing for the three pieces is already encoded in the global CSS:

| Element | Existing CSS rule | Effective spacing |
|---------|------------------|-------------------|
| `#leaflet-map` top/bottom margin | `base.css:283` `margin: 1rem 0` | 16px top and bottom |
| `.map-offline-banner` top offset | `base.css:292` `top: 12px` | 12px from map top edge |
| `.notes-area` top margin | `base.css:946` `margin-top: 1.5rem` |  24px |
| `.notes-area` top padding | `base.css:947` `padding-top: 1.25rem` | 20px |
| `.notes-textarea` padding | `base.css:964` `.65rem .85rem` | ~10px / ~14px |
| `.detail-photo` margin | `base.css:821` `margin: 1rem auto 1.5rem` | 16px top, 24px bottom |
| `.card-hero` bottom margin | `base.css:710` `margin: 0 -1.5rem 1.5rem` | 24px below hero |

Exceptions: none. The 8-point scale template does not apply — spacing is inherited verbatim from the existing CSS.

---

## Typography

F7 introduces no new typographic declarations. All type rules are already in `base.css`. Listed here for the executor's reference:

| Element | Font family | Size | Weight | Line height | CSS location |
|---------|------------|------|--------|-------------|--------------|
| Marker label (roman numeral) | Cormorant Garamond serif | `.85rem` | `600` | — | inline `divIcon` style (`index.html:6353`) |
| Popup name (`<strong>`) | inherits Leaflet popup | — | bold | — | Leaflet default |
| Popup day (`<em>`) | inherits | — | — | — | Leaflet default |
| Popup link "Abrir ficha →" | inherits | — | — | — | inline color only |
| Popup guided text | inherits | `.85rem` | — | — | inline `font-size:.85rem` (`index.html:6363`) |
| `.map-offline-banner` | Cormorant Garamond serif | `.85rem` | italic | — | `base.css:298-303` |
| `.notes-area label` | Cormorant Garamond serif | `.85rem` | italic | — | `base.css:951-959` |
| `.notes-textarea` | Lora serif | `.95rem` | normal | `1.5` | `base.css:961-974` |
| `.detail-photo-caption` | Cormorant Garamond serif | `.88rem` | italic | `1.4` | `base.css:832-841` |

---

## Color

F7 introduces no new color values. The full color contract is the existing CSS token system. The specific values used by the three F7 pieces:

| Role | Value | F7 usage |
|------|-------|----------|
| Dominant surface (60%) | `var(--bg)` light `#fbf7f0` / dark `#1a1612` | Marker border `#fbf7f0` (hardcoded in `divIcon`, matching light surface); `.leaflet-container` dark bg `#1a1612` (`base.css:310`) |
| Secondary surface (30%) | `var(--bg-elev)` / `var(--bg-soft)` | Offline banner background `var(--bg-elev)`; `#leaflet-map` placeholder background `var(--bg-soft)` |
| Accent — card markers | `#8b3a3a` | `divIcon` background for `type:'card'`; popup link color for `type:'card'` |
| Accent — guided markers | `#a07c4a` | `divIcon` background for `type:'guided'`; popup day `<em>` color for all types |
| Accent — concert markers | `#5a7a3a` | `divIcon` background for `type:'concert'`; popup link color for `type:'concert'` |
| Guided popup text | `#5c534a` | Popup body text for `type:'guided'` ("Visita con guía humano") |
| Map border / shadow | `var(--line)` / `var(--shadow)` | `#leaflet-map` border + box-shadow |
| Offline banner border | `var(--line)` | `.map-offline-banner` border |
| Notes border | `var(--line-soft)` / `var(--accent)` on focus | `.notes-textarea` border; `:focus` border-color |
| Notes background | `var(--bg)` | `.notes-textarea` background |
| Notes text | `var(--ink)` | `.notes-textarea` color |

Accent reserved for: card-type marker backgrounds, concert-type marker backgrounds, notes textarea focus border. (Guided markers use `#a07c4a`, not `--accent`.)

Dark-mode tile filter (already in CSS, no new rule): `base.css:309` — `[data-theme="dark"] .leaflet-tile { filter: brightness(.7) contrast(1.1) saturate(.8); }`.

---

## Component Contracts

### 1. Leaflet Map Island (`LeafletMap.client.vue`)

**Scope:** FEAT-02. Replaces the empty `<section id="mapa" />` in `TripView.vue:75`.

#### 1a. SSR Fallback (`<ClientOnly #fallback>`)

- Element: `<div id="leaflet-map">` — empty, no text, no loading indicator.
- Height: `520px` desktop (matches `base.css:279`); `420px` at `max-width:540px` (matches `base.css:1236`).
- Same CSS class `#leaflet-map` as the live element — the existing background (hatched pattern `var(--gold)` / `var(--accent)`) shows during prerender, matching what the live site shows before Leaflet initializes.
- Acceptance criterion: `#leaflet-map` element present in the prerendered HTML; its computed height equals the map height; no text content inside it.

#### 1b. Map Init

| Parameter | Value | Source |
|-----------|-------|--------|
| Leaflet import | `(await import('leaflet')).default` inside `onMounted` | RESEARCH §Pattern 1 |
| CSS import | **NONE in JS** — CSS is already global via `nuxt.config.ts` | RESEARCH §Pitfall 1; `base.css:leaflet.css` already loaded |
| `scrollWheelZoom` | `false` | `index.html:6321` |
| Initial center | `[41.8989, 12.477]` (= `trip.map.center`) | `index.html:6321` |
| Initial zoom | `14` (= `trip.map.zoom`) | `index.html:6321` |
| Tile URL | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | `index.html:6322` |
| Tile `maxZoom` | `19` | `index.html:6323` |
| Tile attribution | `'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'` | `index.html:6324` |
| `fitBounds` | `L.latLngBounds(allCoords).pad(0.1)` | `index.html:6373-6374` |
| `invalidateSize` | `setTimeout(() => map.invalidateSize(), 300)` + `window.addEventListener('load', () => map.invalidateSize())` | `index.html:6377-6378` |
| Init error fallback | `try/catch` → set `#leaflet-map` innerHTML to italic centered text "No se ha podido cargar el mapa. Comprueba tu conexión." with `color:var(--ink-soft)` | `index.html:6335-6340` |

#### 1c. Offline Banner

- Element: `.map-offline-banner` (already in `.map-wrapper` static chrome in TripView, `id="map-offline-banner"`).
- Text: exactly `Sin conexión · solo marcadores visibles` (no period).
- Trigger: `tilesErrored > 3 && tilesLoaded === 0` — the EXACT heuristic, not `navigator.onLine` or a simpler threshold.
- Mechanism: `document.getElementById('map-offline-banner')?.classList.add('show')`.
- CSS: `.map-offline-banner.show { display: block; }` — already in `base.css:308`.
- Acceptance criterion: `.map-offline-banner` element has class `show` and is visible after 4+ tile errors with 0 successful loads.

#### 1d. Marker Visuals (`L.divIcon`)

Each marker is a 32×32px circle rendered via `divIcon` HTML:

```
<div style="
  width:32px;height:32px;
  background:{bgColor};
  color:#fbf7f0;
  border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-family:'Cormorant Garamond',serif;
  font-weight:600;font-size:.85rem;
  border:2px solid #fbf7f0;
  box-shadow:0 2px 8px rgba(0,0,0,.4);
">{romanNumeral}</div>
```

| `type` | `bgColor` | Example content |
|--------|-----------|----------------|
| `'card'` | `#8b3a3a` | Roman numeral (e.g. `I`, `II`, `V`) |
| `'guided'` | `#a07c4a` | Roman numeral or `★` (Coliseo extra) |
| `'concert'` | `#5a7a3a` | `♪` or roman numeral |

`iconSize: [32, 32]`, `iconAnchor: [16, 16]` (center-anchored).
CSS class: `custom-marker` (used by the parity spec locator).

Source: `index.html:6347-6356`.

#### 1e. Marker Dataset

39 total pins: 38 derived from `monById` (roman / name / day / coords.lat / coords.lng / type / slug) + 1 explicit Coliseo extra.

Coliseo extra (verbatim from `index.html:6292`):

```
{ roman: '★', name: 'Coliseo + Foro + Palatino (guiado)', day: 'Domingo',
  coords: { lat: 41.8902102, lng: 12.4922309 }, type: 'guided' }
```

This extra has NO slug (no ficha) — its popup is text-only. Stored in `trip.yml` (field name at planner's discretion; must extend `TripSchema` with zod validation).

Acceptance criterion: exactly 39 `.custom-marker` elements in the rendered map; one of them contains `★`.

#### 1f. Popup Contract

Popup HTML strings (verbatim port of `index.html:6361-6369`; the `onclick` attribute is **dropped** — F5 capture listener replaces it):

**type `'card'`:**
```html
<strong>{name}</strong><br>
<em style="color:#a07c4a">{day}</em><br>
<a href="#{slug}" style="color:#8b3a3a">Abrir ficha →</a>
```

**type `'concert'`:**
```html
<strong>{name}</strong><br>
<em style="color:#5a7a3a">{day}</em><br>
<a href="#{slug}" style="color:#5a7a3a">Abrir ficha →</a>
```

**type `'guided'`:**
```html
<strong>{name}</strong><br>
<em style="color:#a07c4a">{day}</em><br>
<span style="color:#5c534a;font-size:.85rem">Visita con guía humano</span>
```

**Quirk (paridad obligatoria):** `vaticano` has `type:'guided'` → its popup is text-only ("Visita con guía humano"), **no "Abrir ficha →" link**, even though a ficha exists. The Coliseo extra also has `type:'guided'` → same text-only popup. Do not "fix" this.

**Popup navigation mechanism:** The `<a href="#{slug}">` anchors carry NO `onclick`/`@click` handler. The F5 `useCardNavigation` capture-phase listener (`document.addEventListener('click', …, true)`) intercepts them and calls `navigateToCard(slug)`. This is identical to how `a.tl-title` links work (verified in `navigation.spec.ts:46-49`). Adding any bubble `@click` here would reproduce CR-01 (see MEMORY.md).

Acceptance criterion: clicking an "Abrir ficha →" popup link scrolls to and highlights the target ficha; `location.hash` does NOT change to `#{slug}` after the click.

---

### 2. Image-with-Fallback

**Scope:** UI-05. Two modes: hero (in `MonumentCard.vue`) and detail (in `DetailPhoto.global.vue`).

#### 2a. `SVG_MOTIFS` constant

19 SVG strings, ported verbatim from `index.html:2212`. Stored as a plain object in `app/utils/svgMotifs.ts`. Keys are the 19 `Motif` enum values from `shared/schemas.ts:31-35`. A lookup function `motifSvg(motif: Motif): string | undefined` returns the SVG string or `undefined` for an unknown key.

`CARD_TO_MOTIF` is **NOT ported** — replaced by `monument.motif` (typed field, obligatory for all 38 monuments).

#### 2b. Hero Mode (replaces `.card-hero` content)

Source: `index.html:2215-2227` (`loadSvgFallback`).

- The `<img>` in `MonumentCard.vue:150-156` gains `@error` handler.
- On error: if `motifSvg(monument.motif)` returns a string → inject it via `v-html` inside `.card-hero` (replaces the `<img>`). If no SVG → `display:none` on `.card-hero` container.
- The dead branch (`display:none`) never fires for monuments (`motif` is required/always present) but is ported for fidelity.
- `<img>` attributes remain: `loading="lazy"`, `alt` as already set in the F4 shell.
- SVG inside `.card-hero` inherits `base.css:719` rule: `.card-hero svg { width:100%; height:100%; object-fit:cover; }` — NO inline styles on the SVG itself.
- Accepted `v-html` usage: the SVG is a trusted static constant (never user input). Add ESLint disable comment `<!-- eslint-disable-next-line vue/no-v-html — SVG is a trusted static constant (svgMotifs.ts) -->`.

Acceptance criterion: after hero `<img>` triggers `@error`, `.card-hero` contains an `<svg>` element and no `<img>` element; `.card-hero` is not hidden (`display` is not `none`).

#### 2c. Detail Mode (replaces only the `<img>`, keeps caption)

Source: `index.html:2229-2252` (`loadSvgFallbackDetail`).

- The `<img>` in `DetailPhoto.global.vue` gains `@error` handler.
- On error: if `motifSvg(motif)` returns a string → inject SVG via `v-html` with the EXACT four inline styles: `width:100%; height:auto; border-radius:4px; display:block`.
  - These inline styles are required because `base.css:825` targets `.detail-photo img` (not `svg`), so the swapped SVG would otherwise be unstyled.
- The `.detail-photo-caption` element is PRESERVED (not replaced).
- If no SVG → `display:none` on the `<img>` (not on the caption, not on the container).
- `loading="lazy"`, `alt` unchanged from F4 shell.
- The `motif` value reaches `DetailPhoto.global.vue` via `provide`/`inject`: `MonumentCard` calls `provide('monumentMotif', monument.motif)`; `DetailPhoto.global.vue` calls `inject('monumentMotif', undefined)`.

Acceptance criterion: after detail `<img>` triggers `@error`, `.detail-photo` contains an `<svg>` (with `width:100%`, `height:auto`, `border-radius:4px`, `display:block` inline styles) and a `.detail-photo-caption` element with text content; no `<img>` is visible inside `.detail-photo`.

---

### 3. Per-Card Notes

**Scope:** FEAT-04. Wires persistence into the existing `.notes-textarea` shell in `MonumentCard.vue:229-237`.

#### 3a. Visual Contract

**No new UI.** The full visual presentation already exists:
- `.notes-area` container (top border, spacing) — `base.css:946-949`.
- Label "Notas" — `base.css:951-959` (Cormorant Garamond italic, `.85rem`, `var(--ink-faint)`).
- `.notes-textarea` — `base.css:961-975` (Lora `.95rem`, `var(--bg)` background, `var(--line-soft)` border, `var(--accent)` border on `:focus`, `min-height:60px`, `resize:vertical`).
- Placeholder text: `Lo que quieras recordar de aquí…` (already in F4 shell).

No "saved" indicator, no preview, no export UI. Any such element would be a parity regression.

#### 3b. Behavior Contract

| Aspect | Specification | Source |
|--------|--------------|--------|
| Storage key | `roma-note-{monument.slug}` (exact, no variation) | `index.html:6474` |
| Read timing | `onMounted` only — never during setup/SSR | CONTEXT.md D-03; anti-hydration pattern |
| Write trigger | `input` event on the textarea | `index.html:6479-6481` |
| Write debounce | Debounce of ~200ms on `localStorage.setItem` is allowed (invisible to user) | CONTEXT.md D-03 |
| Error handling | `try/catch` around both read and write (localStorage may be blocked in private browsing) | `index.html:6476-6481` |
| Scope | Monuments only (`MonumentCard.vue`) — no notes on food/artist cards | CONTEXT.md D-03 |
| Initial render | Empty textarea at SSR (avoid hydration mismatch); filled in `onMounted` | CONTEXT.md D-03 / RESEARCH §Pitfall 6 |

The one acceptable visual artifact: a micro-flash (one frame) from empty to saved-value after `onMounted` populates the textarea. This is the same pattern as theme/modes (F3/F4) and is not a bug.

Acceptance criterion: after `localStorage.setItem('roma-note-galleria-sciarra', 'probe')` and page reload, the `.notes-textarea` inside the `#galleria-sciarra` card contains the text `probe`; no console error other than the known `@nuxtjs/color-mode` hydration message appears.

---

## Copywriting Contract

All copy is verbatim from the live `index.html`. No new strings.

| Element | Copy | Source |
|---------|------|--------|
| Offline banner | `Sin conexión · solo marcadores visibles` | `index.html:2368` |
| Guided popup body | `Visita con guía humano` | `index.html:6362-6363` |
| Card/concert popup CTA | `Abrir ficha →` | `index.html:6365, 6367` |
| Map init error | `No se ha podido cargar el mapa. Comprueba tu conexión.` | `index.html:6338-6339` |
| Notes placeholder | `Lo que quieras recordar de aquí…` | `MonumentCard.vue:236` (F4 shell) |
| Notes label | (already rendered by F4 shell — not changed) | `MonumentCard.vue:230-232` |

---

## States and Interactions

### Map States

| State | Trigger | Visual result | Acceptance condition |
|-------|---------|--------------|---------------------|
| Prerender / SSR | `nuxt generate` | Empty `#leaflet-map` box with hatched background (`var(--gold)` / `var(--accent)` CSS pattern), 520px / 420px responsive | `#leaflet-map` in static HTML, correct height, no text |
| Map loaded (tiles OK) | Client `onMounted` | Leaflet map with OSM tiles, 39 markers, bounded to Rome | `.leaflet-container` present; 39 `.custom-marker` elements |
| Offline | `tilesErrored > 3 && tilesLoaded === 0` | `.map-offline-banner` visible (`.show` class), tiles gray/absent | `.map-offline-banner` has class `show`; banner text matches exactly |
| Init failure | Leaflet throws during `L.map(...)` | Fallback text paragraph centered in `#leaflet-map` | `#leaflet-map` contains italic centered fallback text |
| Dark mode | `[data-theme="dark"]` | Tile filter applied (`brightness(.7) contrast(1.1) saturate(.8)`), container bg `#1a1612` | Existing CSS; no new rule needed |

### Image Fallback States

| State | Trigger | Hero result | Detail result |
|-------|---------|------------|--------------|
| Image loads | — | `<img>` displayed normally | `<img>` + `.detail-photo-caption` displayed normally |
| Image error, motif present | `@error`, `motifSvg(motif)` returns string | `.card-hero` contains `<svg>` (no inline styles — CSS handles sizing) | `.detail-photo` contains `<svg>` (with 4 inline styles) + `.detail-photo-caption` |
| Image error, no motif | `@error`, `motifSvg(motif)` returns undefined | `.card-hero` hidden (`display:none`) | `<img>` hidden; caption remains visible |

Note: the "no motif" branch is dead code for the 38 monuments (all have a required `motif`). Ported for fidelity only.

### Notes States

| State | Trigger | Visual result |
|-------|---------|--------------|
| SSR / initial render | — | Textarea empty (default) |
| `onMounted` with saved note | localStorage has `roma-note-{slug}` | Textarea populated with saved text (micro-flash acceptable) |
| `onMounted` without saved note | localStorage empty or blocked | Textarea remains empty |
| User types | `input` event | Textarea value updates; debounced write to localStorage |

---

## Parity Acceptance Criteria (verifiable conditions for Playwright)

These are the conditions the `tests/parity/map-fallback-notes.spec.ts` spec must assert. Pixel-diff is out of scope (F8).

### SC#1 — Map client-only + `nuxt generate`

- [ ] `pnpm generate` exits 0 with no `window is not defined` error in output.
- [ ] `dist/index.html` (or `.output/public/index.html`) contains `<div id="leaflet-map">` with no child text nodes (empty fallback box).
- [ ] After hydration, `.leaflet-container` is present in the DOM.
- [ ] Exactly 39 elements with class `custom-marker` are in the DOM.
- [ ] One `.custom-marker` contains the text `★` (Coliseo).

### SC#2 — Popups navigate via F5

- [ ] Clicking a `card`-type marker opens a popup containing an `a[href^="#"]` with text `Abrir ficha →`.
- [ ] Clicking "Abrir ficha →" causes the target `.card` to receive the `.highlight` class.
- [ ] `location.hash` does NOT equal `#{slug}` after the click (F5 captures and prevents the default jump).

### SC#3 — Guided popup has no link; vaticano quirk honored

- [ ] The Coliseo marker popup (`★`) contains the text `Visita con guía humano` and contains no `<a>` element.
- [ ] The `vaticano` marker popup contains `Visita con guía humano` and contains no `<a>` element.

### SC#4 — Offline banner heuristic

- [ ] After `page.route('**/*.tile.openstreetmap.org/**', r => r.abort())`, eventually `.map-offline-banner` has class `show` and `isVisible()` returns true.
- [ ] Banner text is exactly `Sin conexión · solo marcadores visibles`.

### SC#5 — Hero image fallback

- [ ] After `page.route({hero image URL}, r => r.abort())`, `.card-hero` contains an `<svg>` element.
- [ ] No `<img>` is present inside `.card-hero` after the fallback.

### SC#6 — Detail image fallback

- [ ] After aborting a detail image URL, `.detail-photo` contains an `<svg>` element.
- [ ] The `<svg>` has inline styles `width:100%`, `height:auto`, `border-radius:4px`, `display:block`.
- [ ] `.detail-photo-caption` is still present with text content.
- [ ] No `<img>` is visible inside `.detail-photo`.

### SC#7 — Notes persistence (no hydration warning)

- [ ] `addInitScript(() => localStorage.setItem('roma-note-galleria-sciarra', 'probe'))` → after page load, the `.notes-textarea` inside `#galleria-sciarra` has value `probe`.
- [ ] Typing into a fresh card's textarea, reloading → the typed text is present in the textarea.
- [ ] No console errors other than `/Hydration completed but contains mismatches/i` (the known `@nuxtjs/color-mode` message).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| Third-party | none | not applicable |

No new packages in this phase. `leaflet@1.9.4` and `@types/leaflet@1.9.21` were already installed and vetted in an earlier phase.

---

## Out of Scope (deferred)

The following are explicitly outside F7 and must not appear in the implementation:

- Map clustering or in-map search.
- Notes export, sync, markdown preview, or any "saved" indicator.
- Image fallback for non-hero/non-detail images (avatars etc.).
- Deep-link / shareable hash to ficha.
- Offline tile caching (PWA = v2).
- Total pixel-diff suite (= F8).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
