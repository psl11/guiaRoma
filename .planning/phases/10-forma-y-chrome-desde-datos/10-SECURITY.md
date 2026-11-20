---
phase: "10"
slug: "forma-y-chrome-desde-datos"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-11-20"
---

# Phase 10 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register consolidated from the `<threat_model>` blocks of 10-01..10-05-PLAN.md plus SUMMARY threat flags
> (10-04: none new — covered by T-10-07/T-10-08; others: none). Verified at ASVS L1 (grep depth) against the code on
> `release/nuxt-4` after 10-05. All threats closed and ASVS = 1, so the auditor subagent was not spawned (workflow short-circuit).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Day YAML → DOM ids/hrefs | Day slugs from `content/trips/<trip>/days/*.yml` become `<section id>` and pill `href="#…"` | Trip content (public) |
| trip.yml → `<head>` and body chrome | Collaborator-written text renders in the tab title, brand, map legend and footer | Trip content (public) |
| `app/` code ↔ one trip's data | A trip literal in code would render in every trip | Trip content (public) |
| Collaborator YAML → prose links | `[t](x)` targets in any trip string end up as `<a href>` | Trip content (public) |
| Dev content → public static build | `content/trips/{prueba,forma}/**` enter the Content DB; only `/` is prerendered | Fictitious dev content |
| Test suite → green decision | A trap test that does not see the page would pass vacuously | — |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-10-01 | Spoofing | `<section :id>` / pills from day slugs | medium | mitigate | `DAY_SLUG_RE` in `shared/schemas.ts`; gate rules `dup-id`, `fixed-anchor`, `day-pill` in `tests/data/trips.ts` (with fixtures); Vue attribute escaping | closed |
| T-10-02 | Denial of Service | `buildTripLayout` with many days | low | accept | Static site, PR-reviewed data; D-04 deliberately sets no day limit (AR-10-01) | closed |
| T-10-03 | Tampering | `.brand`, `p.map-legend`, `footer p`, `<title>` from trip.yml | medium | mitigate | `{{ }}` interpolation in `Topbar.vue:38` / TripView legend, footer per line via `<MDC :tag="false" unwrap="p">`, title via `useHead` (Unhead escapes); no `v-html` added in phase 10 (`git diff f04967a HEAD -- app/` has no `+…v-html`); `brand` typed as `{ before, after }` strings | closed |
| T-10-04 | Information Disclosure | chrome fallback and Roma literals in `app/` | medium | mitigate | D-14 neutral fallback (`pageTitle || plainTitle`, no footer/legend when absent); `tests/unit/romaChromeGuard.spec.ts` (D-17) inside `pnpm verify`; trap test (T-10-09) | closed |
| T-10-05 | Tampering | prose Markdown links (`javascript:`, relative, cross-trip) | medium | mitigate | `cross-trip-link` allow-list in `tests/data/trips.ts:338-359` (only `#id` or `^https?://`), teeth for `/#x`, `/guiaRoma/#x`, `../roma#x`, `/trips/…`, `javascript:` in `invariants.spec.ts` | closed |
| T-10-06 | Spoofing | day slug colliding with section/card anchor | medium | mitigate | `DAY_SLUG_RE`, `dup-id` and `fixed-anchor` include days, presence-based `anchor`, unique `day-pill`; all with fixtures (closes WR-01) | closed |
| T-10-07 | Information Disclosure | dev-only `forma` trip in the static build | medium | mitigate | `nitro.prerender.routes = ['/']` (`nuxt.config.ts:45`), no app links to `/trips/*`; `tests/data/build-isolation.spec.ts` asserts no `.output/public/trips` and no `FORMA-CENTINELA-10A` in `index.html`/`_payload.json` (teeth proven in 10-04) | closed |
| T-10-08 | Information Disclosure | forma/prueba rows in public `sql_dump` (CR-01) | low | accept | Fictitious data, no personal info; transferred to Phase 11 `draft` filter (ROUTE-05), documented in `content/trips/forma/trip.yml:12-15` (AR-10-02) | closed |
| T-10-09 | Information Disclosure | Roma text in prueba/forma guides | medium | mitigate | `tests/trips/romaLeaks.ts` (`ROMA_MARKERS`, Unicode `\p{L}`/`\p{N}` boundaries) + 18 teeth in `tests/unit/romaLeaks.spec.ts`; `trampa:` E2E over every non-Roma trip (title + innerText + textContent); teeth proven with injected «Fellini» | closed |
| T-10-10 | Repudiation | vacuous trap test | low | mitigate | Render precondition (h1 = trip title, ≥ 3 pills, non-empty tab), non-empty trip-list test, positive control on Roma (`shape.spec.ts` `trampa:` block) | closed |
| T-10-SC | Tampering | npm/pip/cargo installs | low | mitigate | No packages installed: `git diff --quiet f04967a HEAD -- package.json pnpm-lock.yaml` exits 0 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-10-01 | T-10-02 | Static site; data arrives by reviewed PR; an unbounded day count is a deliberate product choice (D-04), worst case is a long page | plan-time disposition (10-01), confirmed by secure-phase --auto | 2026-11-20 |
| AR-10-02 | T-10-08 | Same as AR-09-01: dev-only trips' rows appear in compressed public `sql_dump` files; data is fictitious; branch is not deployed; Phase 11 `draft` (ROUTE-05) must also exclude them from the dump. Pending the user's explicit decision in `09-UAT.md` test 1 | plan-time disposition (10-04), confirmed by secure-phase --auto | 2026-11-20 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-20 | 11 | 11 | 0 | secure-phase --auto (orchestrator, ASVS L1 grep-depth short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-20
