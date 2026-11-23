---
phase: "12"
slug: "formas-nuevas-de-viaje"
audited: "2026-11-21"
baseline: 12-UI-SPEC.md
overall_score: 19
screenshots: .planning/ui-reviews/12-20261121-124545/ (untracked)
interaction_capture: false
---

# Phase 12 — UI Review

> 6-pillar retroactive audit of the new trip shapes, measured against `12-UI-SPEC.md`.
> - **Auditor:** gsd-ui-auditor. The orchestrator transcribed its returned report into this file.
> - **Captures:** taken on `nuxi dev` for the `campania` draft. Drafts are not built for production, so there is no static build. Viewports captured: desktop light, desktop dark, mobile 375, Domingo 20 detail, and the Baia di Sorgeto family box. Tablet was not captured.
> - **Roma:** covered separately by the 56-golden parity gate, so it is not re-audited here.

## Pillar Scores

| Pillar | Score | Key finding |
|--------|-------|-------------|
| Copywriting | 3/4 | All spec copy is implemented («Elige una», «— o bien —», «Opción A/B», «Dormís en», «Con niños»), and the custom `heading` «Para cenar, elige una» works. One content nit: a doubled 🚌 in a `meta` row. |
| Visuals | 3/4 | The `choice` block has a clear hierarchy and its dot sits on the timeline line. The `thermal` motif renders. Emoji glyphs could not be seen in the headless capture. |
| Color | 3/4 | Tokens and the dark theme behave as specified. The ferry and bus bands look washed grey or lavender at 10% `color-mix`, so the 2px left borders carry most of their identity. The `nature` marker could not be checked in dev. |
| Typography | 4/4 | `tripshapes.css` uses only the declared sizes and weights, all inherited from Roma. `.day-stay` renders at 16.8px italic as specified. |
| Spacing | 3/4 | Every value is 4, 8, 16 or 32. At 375 px there is no horizontal scroll (`scrollWidth` 375). Inside an option, the transport band is slightly offset from the option title. |
| Experience Design | 3/4 | The structure is sound: per-row `.tl-hidden`, `role="group"`, and both options always visible. The map could not be checked in dev (known 0 px height quirk). |
| **Overall** | **19/24** | |

## Evidence
- **Jueves 24:** two `.tl-choice` blocks, one with the custom heading. The campania pages also show 5 `.day-stay` lines and 1 `.family-box`. The transport variants present are plane, bus, base, ferry, bike, walk and car. The block matches the spec in both themes and at mobile width.
- **Headless capture:** Chromium had no emoji font, so 🚌 ⛴️ 🚲 🛏️ showed as gaps or tofu. This is a limit of the capture environment, not a defect in the code.
- **Map in dev:** the Leaflet container is 0 px tall there (pre-existing, logged in `deferred-items.md`), so the `#2f6f73` marker and popup were not visible.

## Top Fixes
1. **WARNING (content):** inside the `choice`, option A uses a `meta` row («bus local desde Salerno») that reads heavier than option B's `transport` band. Fix by writing it as a `transport` row with `variant: bus`. A `.tl-choice .tl-meta` rule in `tripshapes.css` would also work, but its selector must include a `NEW_CLASSES` token.
2. **WARNING (content):** remove the leading 🚌 from that `meta` text in `content/trips/campania/days/jueves-24.yml`, following the spec rule against doubling the CSS glyph. This is placeholder content that Phase 13 rewrites.
3. **WARNING (verification gap):** check the glyphs, the `nature` marker and popup, and the 4 new motifs in a real browser at production map height. This belongs in the human UAT.
4. **Minor:** consider 14% instead of 10% for the ferry and bus band tint. That needs a UI-SPEC change, because the spec fixes 10%.
5. **Minor:** capture the 768 px tablet viewport.

## Files Audited
- `app/assets/css/tripshapes.css`
- `app/components/TimelineChoice.vue`
- `app/utils/mapMarkers.ts`
- `app/utils/svgMotifs.ts`
- `content/trips/campania/**`
