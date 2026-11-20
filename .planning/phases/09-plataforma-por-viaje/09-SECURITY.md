---
phase: "09"
slug: "plataforma-por-viaje"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-11-20"
---

# Phase 09 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register consolidated from the `<threat_model>` blocks of 09-01..09-05-PLAN.md plus SUMMARY threat flags
> (09-02: none new; 09-03: T-09-06 carried to Phase 11). Verified at ASVS L1 (grep depth) against the code on
> `release/nuxt-4` @ ef59b17. All threats closed and ASVS = 1, so the auditor subagent was not spawned (workflow short-circuit).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| localStorage → app | Saved values (possibly tampered) are read in `onMounted` and drive `<body>` classes and note text | User prefs / free-text notes (low, user-owned) |
| URL → slug → keys | On `/trips/<slug>` the slug (validated against the collection by the 404 guard) prefixes storage keys | Trip slug (public) |
| Collaborator YAML → build | PR-edited content enters the static build; `test:data` is the only real validator (Content does not validate `type:'data'`) | Trip content (public) |
| Trip slug → URLs and user keys | `trip.yml` slug ends up in URLs (Phase 11) and already prefixes `localStorage` keys on the shared `github.io` origin | Trip slug (public) |
| Trip content → client search index | Index built in the browser from the payload of the trip being viewed | Trip content (public) |
| Static build → public | What is prerendered (and `__nuxt_content/*/sql_dump.txt`) is what would be deployed | Trip content incl. unpublished/test trips (low) |
| E2E harness → network / future code → gate | Test browser may hit external resources; later changes may re-couple to Roma | Test infra |
| Local caches (`.data`, `.nuxt`, `.output`) → gate | A stale cache can make the gate validate a build that does not reflect current content | Build artefacts |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-09-01 | Tampering | useTripModes (restore `<slug>-pace`/`-light`/`-resumen`) | low | mitigate | `app/composables/useTripModes.ts:110-115` — pace accepted only if `=== 'optimistic'\|'neutral'\|'slow'`; light/resumen only on strict `=== '1'`; anything else ignored | closed |
| T-09-02 | Information disclosure | localStorage keys on shared `<user>.github.io` origin | medium | mitigate | `app/utils/tripStorage.ts:22` `tripStorageKey(slug,name)`; all reads/writes by exact key (`useTripModes.ts:107-121`, `MonumentCard.vue:127-142`); no enumerate/clear/migrate (guarded by `tests/unit/tripCoupling.spec.ts` "detecta la enumeración o el borrado de localStorage"); slug restricted to `^[a-z0-9]+$` (T-09-05) | closed |
| T-09-03 | Elevation of privilege (stored XSS) | MonumentCard notes | low | mitigate | `app/components/MonumentCard.vue:322-328` textarea bound via `:value="noteText"` + `@input`; no `v-html` on note text (only `v-html` uses are the static trusted `svgMotifs` constants) | closed |
| T-09-04 | Tampering | `tests/data/trips.ts` fail-open gate | medium | mitigate | `loadTrip` reads ALL files recursively (`trips.ts:136-144`); rules `yaml-parse`/`yaml-object`/`stray-file`/`trip-yml` (`trips.ts:62,106-119,192`); `describe.each(listTripDirs())` in `schema.spec.ts:44` and `invariants.spec.ts:45` (drafts included); teeth tests `invariants.spec.ts:141-231` | closed |
| T-09-05 | Tampering | TripSchema.slug / `trip-slug` invariant | medium | mitigate | `shared/schemas.ts:331,335` `TRIP_SLUG_RE = /^[a-z0-9]+$/` + `z.string().regex(...)`; `tests/data/trips.ts:194-195` regex and slug == folder; fixtures `campania-2027` (hyphen) and `otro` mismatch tested | closed |
| T-09-06 | Information disclosure | Test-trip rows in public `sql_dump.txt` | low | accept | No deploy in Phase 9 (v1.0 D-08 deferred deploy); Phase 11 (ROUTE-05) must exclude draft trips from the dump, not only from `prerender.routes` — see Accepted Risks | closed |
| T-09-07 | Information disclosure | Cross-trip search results | medium | mitigate | `app/composables/useSearch.ts:63` module-level `Map<string, MiniSearch>` keyed by slug; state via `tripStateKey` (`search:query:<slug>`); `tests/unit/searchIsolation.spec.ts` (real data: Fontana / spagna per trip); `tripCoupling.spec.ts` "detecta un índice MiniSearch único de módulo" | closed |
| T-09-08 | Denial of service | `nuxi dev` lifecycle in E2E (orphan process, port 5300, races verify) | low | mitigate | `playwright.trips.config.ts:23-32` `workers: 1`, `webServer` with `reuseExistingServer: false`; `rm -rf .data .nuxt` beforehand and "never in parallel with verify" documented in `tests/README.md:213-214` | closed |
| T-09-09 | Tampering | Regression reintroducing a fixed trip or global state in controllers | medium | mitigate | `tests/unit/tripCoupling.spec.ts` in `test:unit` (part of `pnpm verify`), with synthetic "teeth" (`:183-228`) proving each pattern (fixed trip, literal `roma-` key, un-suffixed `useState`, single MiniSearch index, localStorage enumeration) is detected | closed |
| T-09-10 | Information disclosure | Test-trip data in Roma's prerendered page | medium | mitigate | `tests/data/build-isolation.spec.ts` in `test:data` (inside verify): sentinel `PRUEBA-CENTINELA-9F3` absent from `index.html` and `_payload.json`; no `.output/public/trips`; state keys suffixed `:roma` | closed |
| T-09-11 | Tampering | Gate validating against stale Content caches | low | mitigate | `package.json` `verify`: `rm -rf .data .nuxt .output && pnpm generate && ...` | closed |
| T-09-SC | Tampering | npm/pip/cargo installs (all 5 plans) | low | mitigate | `git diff 79e57e0 HEAD -- package.json` changes only `scripts` (`test:trips`, `verify`); `dependencies`/`devDependencies` unchanged | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-09-01 | T-09-06 | Phase 9 has no deployment (v1.0 D-08: deploy deferred), so the `prueba` rows in `__nuxt_content/*/sql_dump.txt` are never published. Low severity (test fixture content, no user data). Follow-up owned by Phase 11 (ROUTE-05): the `draft` filter must also exclude the trip's rows from the public SQL dump, and `# draft: true` must be uncommented in `content/trips/prueba/trip.yml` (09-03-SUMMARY). | Plan-time disposition (09-03-PLAN threat model) | 2026-11-20 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-20 | 12 | 12 | 0 | gsd-secure-phase (orchestrator, ASVS L1 grep verification; auditor short-circuited) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-20
