---
phase: "12"
slug: "formas-nuevas-de-viaje"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-11-21"
---

# Phase 12 — Security

> This file is the phase's security contract: the threat register, the risks accepted, and the audit trail.
> - **Source:** the register merges the `<threat_model>` blocks of 12-01..12-07-PLAN.md. No SUMMARY carries a `## Threat Flags` section, so every new surface was already in a plan register.
> - **Check:** each mitigation was verified at ASVS L1 (grep depth) against the code on `release/nuxt-4` after 12-07.
> - **No auditor run:** every threat is closed, the register was written at plan time and the level is ASVS 1, so the workflow skipped the auditor subagent.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Draft trip → public static build | `campania` (`draft: true`) must not reach `.output/public` (pages, payloads, `sql_dump`) | Placeholder Campania content |
| trip YAML → rendered guide | `choice`, `stays`, `family`, `route` and the new enums come from collaborator YAML and render as HTML or as a link | Trip content (PR-reviewed) |
| trip YAML → Leaflet popup HTML | `name`, `day` and `id` are interpolated into a `bindPopup` HTML string | Trip content |
| trip YAML → Google Maps URL | Card coordinates and names become URL parameters | Trip content |
| `tripshapes.css` → Roma DOM | A global stylesheet could restyle Roma | — |
| Test suite → green decision | Guards that pass vacuously, or gate counts that drift | — |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation (evidence) | Status |
|-----------|----------|-----------|----------|-------------|------------------------|--------|
| T-12-01 | Information Disclosure | `campania` draft in the build | medium | mitigate | `content/trips/campania/trip.yml` has `draft: true`, so `draftExcludes` drops it at config time. `.output/public/trips/` contains only `roma` (checked after gate-12w7) | closed |
| T-12-02 | Tampering | misspelled keys in a `choice` silently stripped by zod | low | mitigate | `shared/schemas.ts:176,181`: `ChoiceOption` and `ChoiceRow` are `z.strictObject`. `schema.spec.ts` «rechaza pace en el choice… Unrecognized key» | closed |
| T-12-03 | Tampering | HTML from `choice` fields | low | mitigate | `TimelineChoice.vue` renders `label` by interpolation and `heading`/`title` through `<MDC>` (5 uses). No `v-html` | closed |
| T-12-04 | Tampering | new CSS rule reaching Roma's DOM | medium | mitigate | `tripshapes.css` uses only allowlisted new classes (`tests/unit/tripShapesCss.spec.ts`, `NEW_CLASSES`/`tripShapesOffenders`). The 56 goldens are green with no `--update-snapshots` | closed |
| T-12-05 | Tampering | a `tripshapes.css` selector matching Roma's DOM | medium | mitigate | `tripShapesOffenders`: every selector needs a new class, and functional, attribute, `:root`, `html` and `body` selectors are banned. The build half in `build-isolation.spec.ts` (D-17) scans published HTML classes | closed |
| T-12-06 | Information Disclosure | Campania rows or text in `.output/public` | medium | mitigate | `build-isolation.spec.ts` searches every published file for the `CAMPANIA-CENTINELA-12A` sentinel, with the dumps decoded. A presence `it` sits outside `skipIf`, and the spec asserts `trips/campania` does not exist | closed |
| T-12-07 | Repudiation | guard passing vacuously | low | mitigate | Anti-vacuity checks: at least 8 real selectors, the list of scanned HTML includes Roma and the portada, and a positive control on Roma's classes | closed |
| T-12-08 | Tampering | HTML in `stays[].name` | low | mitigate | `DaySection.vue` renders `span.day-stay-name` through `<MDC>`. The existing `anchor`/`cross-trip-link` gate rules walk every string | closed |
| T-12-09 | Repudiation / Integrity | «Dormís en» naming a stay that does not exist | medium | mitigate | `tests/data/trips.ts:94`: rules `stay-ref` (also fires without `stays`) and `stay-dup`, each with tests that prove they fail. `stayFor` returns `undefined`, so no line renders | closed |
| T-12-10 | Tampering | popup HTML built from data text | medium | mitigate | `app/utils/mapMarkers.ts:66-69`: `markerPopupHtml` escapes `& < > "`. `mapMarkers.spec.ts` has an escape test plus a byte-for-byte test of Roma's 39 markers | closed |
| T-12-11 | Tampering | new SVG inserted as HTML in the card | low | accept | AR-12-01 | closed |
| T-12-12 | Integrity | gradient painted with another motif's `id` | low | mitigate | `svgMotifs.spec.ts:109`, «ids únicos en toda la tabla»: 23 SVGs, 36 ids | closed |
| T-12-13 | Integrity | enum value without a style | low | mitigate | `tests/unit/enumStyles.spec.ts` walks `TransportVariant.options`/`StatVariant.options` against the real selectors. `train` is the only fixed exemption | closed |
| T-12-14 | Tampering | new rule changing Roma's `train` leg | medium | mitigate | `tripshapes.css` has 0 matches for `tl-transport.train`. `enumStyles.spec.ts` asserts it. The goldens are green | closed |
| T-12-15 | Tampering | tab-nabbing from the route button | low | mitigate | `DaySection.vue:143` has `rel="noopener"` together with `target="_blank"` | closed |
| T-12-16 | Integrity | misleading route (mixing A and B, or walking/driving across a ferry) | medium | mitigate | `app/utils/dayRoute.ts:124,137`: `routeCards` excludes cards that appear only inside options, and `routeVisible` hides the button on ferry days. Covered by `dayRoute.spec.ts` and the Campania E2E | closed |
| T-12-17 | Tampering | URL parameters built from data | low | accept | AR-12-02 | closed |
| T-12-18 | Tampering | HTML in `family` | low | mitigate | `MonumentCard.vue` renders `family` through `<MDC>`. Its only `v-html` is still the trusted `motifSvg` constant (`:253`) | closed |
| T-12-19 | Repudiation | gate count drifting unnoticed | low | mitigate | `tests/README.md:158-159`: counts measured with `--list` and the literal `Total: 110 tests in 13 files` line | closed |
| T-12-20 | Information Disclosure | Campania draft in the phase's final build | medium | mitigate | `.output/public/trips/campania` is absent after gate-12w7. The sentinel scan runs inside `pnpm verify` | closed |
| T-12-21 | Integrity | broken `ref` inside an option passing the gate | medium | mitigate | `tests/data/trips.ts:125,326`: the `ref` rule iterates `timelineRowsOf`, with tests that fail for `stop` and `food` inside an option | closed |
| T-12-SC | Tampering | npm/pip/cargo installs | low | accept | AR-12-03. `git diff --quiet 0af8a7f HEAD -- package.json pnpm-lock.yaml` exits 0 | closed |

*Status: open · closed*
*Severity: critical > high > medium > low. Only open threats at or above `workflow.security_block_on` count toward `threats_open`.*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-12-01 | T-12-11 | The 4 new motif SVGs are repo constants, reviewed in PR, never user data. The test bans `<style`, `<text`, `<image` and `xlink:` in them | plan-time disposition (12-04), confirmed by secure-phase --auto | 2026-11-21 |
| AR-12-02 | T-12-17 | Each route point goes through `encodeURIComponent`, as before. Coordinates are schema numbers, and the content is PR-reviewed | plan-time disposition (12-06), confirmed by secure-phase --auto | 2026-11-21 |
| AR-12-03 | T-12-SC | The phase installs no packages. `package.json` and `pnpm-lock.yaml` are unchanged | plan-time disposition (all plans), confirmed by secure-phase --auto | 2026-11-21 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-21 | 22 | 22 | 0 | secure-phase --auto (orchestrator, ASVS L1 grep-depth short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-21
