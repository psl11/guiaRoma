# Phase 11 — UI Review

**Audited:** 2026-11-20
**Baseline:** 11-UI-SPEC.md (approved)
**Screenshots:** captured (3/3: desktop, mobile, tablet) of `/guiaRoma/` from the built `.output/public`; stored in `.planning/ui-reviews/11-20261120-213151/` (gitignored). `/trips/roma/` and dark theme were not captured; the footer back link is audited from code.
**Interaction captures:** off (workflow.ui_interaction_capture is false). Hover and focus findings are code-derived.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All strings, the date format and the Roma card match the contract exactly |
| 2. Visuals | 3/4 | Clear hierarchy; the entire page is a single card, and the meta line reads small |
| 3. Color | 4/4 | Tokens only, no hex; accent confined to the declared list |
| 4. Typography | 3/4 | 3 sizes and 2 weights as specified; meta/empty-state size depends on the Cormorant optical size |
| 5. Spacing | 4/4 | CSS identical to the contract; screenshots match the scale |
| 6. Experience Design | 3/4 | Empty and loading states handled, full-page navigation, reduced-motion respected; hover-only affordance and no verified dark theme |

**Overall: 21/24**

---

## Top 3 Priority Fixes

1. **Dark theme of the portada was not visually verified** — The contract's AA contrast numbers for the hover title are tight in dark (`--accent` on `--bg-elev` 4.29:1, which is acceptable only as large text). A regression would only show up in dark. Fix: add a dark-theme golden for `/guiaRoma/` (`roma-theme=dark` in localStorage) and a screenshot of hover and focus-visible.
2. **Meta line is visually small** — At 17px, Cormorant Garamond italic has a small x-height, so «19–23 de junio de 2026 · Roma» looks about 14px in the screenshots (desktop and mobile) and is the key datum for choosing a trip. Fix (a deliberate departure from the spec, which says `1em`): `font-size: 1.1em` on `.trip-index-meta` and `.trip-index-empty`, or confirm it as acceptable during `/gsd-verify-work 11`.
3. **The card affordance relies on hover** — On touch devices (the main use case, walking around the city) the only cue that the card is a link is the text and the border. Fix: confirm during verification, or add a quiet trailing glyph (such as `→`) in the meta line. This would need a UI-SPEC amendment, so it is optional.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- `<h1>` «Guías de viaje», title and empty-state copy «Todavía no hay viajes publicados.» match the contract (`TripIndex.vue`, `index.vue`).
- The rendered HTML contains «Cinque giorni a Roma», «19–23 de junio de 2026 · Roma» (EN DASH, middle dot) and `href="/guiaRoma/trips/roma/"`, as required.
- The footer link «← Todos los viajes» is present at `TripView.vue:295-297`.
- No generic labels (Submit/OK/etc.). The whole card is the CTA, as decided.
- No finding that lowers the score.

### Pillar 2: Visuals (3/4)
- Clear focal order: large h1, then a bordered card with title, italic meta and body summary (desktop and mobile screenshots). The flourish closes the page.
- WARNING: with a single trip, the lower 55% of the desktop viewport is empty. Expected today, but the layout has not been seen with 2 or more cards.
- WARNING: the meta line is visually weak (see fix 2).
- There are no icon-only controls, so no aria-label gap. Decorative flourish is `aria-hidden`.

### Pillar 3: Color (4/4)
- `multitrip.css` has no hex or rgb; only `--bg-elev`, `--line-soft`, `--ink`, `--ink-soft`, `--accent` and `--shadow`.
- Accent appears in exactly the 3 declared places in the CSS (card hover border, hover title, focus ring); the 4th (the footer link) comes from the global `a` rule.
- Resting card has no accent; the global `a` color and border are overridden correctly (`color: var(--ink)`, full 1px border). Verified in screenshot.
- Not visually checked in dark; this is handled in fix 1.

### Pillar 4: Typography (3/4)
- Sizes: h1 clamp (global), h2 1.75rem, body/meta 1em. Weights: 400 and 500 only. This matches the contract.
- Visually the meta is small (see fix 2). The h2 at 28px against the 40-64px h1 is a clean step.
- The `p.trip-index-summary` inherits Lora; indent is neutralised (`text-indent: 0`) and the screenshot shows no first-line indent.

### Pillar 5: Spacing (4/4)
- `multitrip.css` equals the contract block (all values multiples of 4; breakpoint 640px; 760px max-width).
- The screenshot shows the 8px internal gap, the 24px padding (mobile) and the 32px padding (desktop) as specified. Mobile side margin is 16px.
- No arbitrary values and no `style=""`.

### Pillar 6: Experience Design (3/4)
- Loading versus empty is handled: `cards === null` renders nothing and `[]` renders the empty message (no hydration flash). Drafts are filtered (`listedTrips`).
- Full-document `<a href>` navigation, with the base URL from runtime config. No `NuxtLink`, no click handlers.
- Focus ring `:focus-visible` with a 2px accent outline and 4px offset; `prefers-reduced-motion` disables transitions.
- Legacy hash redirect uses `location.replace` with `critical` priority, so no visible flash of the portada for old links. Not exercised in a browser in this audit.
- WARNING: no screenshots of hover, focus or dark mode (interaction capture off).
- No error state needed (static prerender), consistent with the contract.

---

## Files Audited
- app/assets/css/multitrip.css
- app/components/TripIndex.vue
- app/components/TripView.vue (footer, lines 270-300)
- app/pages/index.vue
- app/utils/tripDates.ts
- nuxt.config.ts (css order)
- .output/public/index.html (rendered output)
- Screenshots: .planning/ui-reviews/11-20261120-213151/{desktop,mobile,tablet}.png (tablet captured, not read)
