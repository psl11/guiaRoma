---
phase: "11"
slug: "portada-y-rutas-multi-viaje"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-11-20"
---

# Phase 11 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Register consolidated from the `<threat_model>` blocks of 11-01..11-07-PLAN.md plus SUMMARY threat flags
> (all «None» — every new surface was already in the plan registers). Verified at ASVS L1 (grep depth) against the
> code on `release/nuxt-4` after 11-07. All threats closed and ASVS = 1, so the auditor subagent was not spawned
> (workflow short-circuit).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| URL hash → portada head script | `location.hash` of a legacy link decides whether to redirect | Untrusted URL fragment |
| `content/trips/*/trip.yml` → build config | `draft` flags and folder names decide what Content ingests and which routes prerender | Trip content (PR-reviewed) |
| Dev/draft content → public static build | `prueba`/`forma` must not reach `.output/public` (pages, payloads, `sql_dump`) | Fictitious dev content |
| trip.yml `title`/`summary` → portada card | Collaborator text renders on the home page | Trip content (public) |
| `multitrip.css` → Roma DOM | A global stylesheet could restyle Roma | — |
| Test suite → green decision | Specs that hit the wrong page or skip silently would pass vacuously | — |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation (evidence) | Status |
|-----------|----------|-----------|----------|-------------|------------------------|--------|
| T-11-01 | Repudiation | Roma specs reading the built HTML after the URL move | medium | mitigate | `tests/parity/_harness.ts` `ROMA_HTML` derived from `ROMA_URL`; no Roma spec reads `join(OUTPUT_DIR, 'index.html')` (the one hit, `legacy-redirect.spec.ts:178`, reads the portada on purpose) | closed |
| T-11-02 | Tampering | weakening specs / re-baselining goldens | high | mitigate | `git diff --quiet 6315f26 HEAD -- tests/parity/golden.spec.ts tests/parity/golden.spec.ts-snapshots/` exits 0; existing-spec edits limited to D-18 (audited in 11-01/11-03 SUMMARYs); gate 110/13 re-registered | closed |
| T-11-03 | Information Disclosure | draft rows in public `sql_dump` (CR-01, AR-10-02) | high | mitigate | `content.config.ts:37-39` `source: { include, exclude }` fail-closed (`NODE_ENV === 'development'` only keeps drafts); `tests/data/build-isolation.spec.ts` scans `.output/public` with dumps decoded (`gunzip`) + positive Roma control | closed |
| T-11-04 | Tampering | non-boolean `draft` / invalid folder slug | medium | mitigate | `scripts/tripManifest.mjs:23,45,51` `TRIP_FOLDER_RE` + throws naming the file; `shared/schemas.ts:411` `draft: z.boolean().optional()`; `tests/unit/tripManifest.spec.ts` | closed |
| T-11-05 | Denial of Service | YAML read at config time | low | accept | AR-11-01 | closed |
| T-11-06 | Spoofing | `/trips/<slug>/` from folder names | low | mitigate | `^[a-z0-9]+$` in manifest + data gate folder = slug; `app/pages/trips/[slug].vue:27` 404 guard kept | closed |
| T-11-07 | Tampering | footer link with literal base / SPA navigation | low | mitigate | `TripView.vue:295` `p.trip-back` `<a :href="baseURL">` from runtime config; no NuxtLink/`@click` (11-03 grep gates) | closed |
| T-11-08 | Repudiation | isolation/romaChrome specs skipping silently | medium | mitigate | explicit existence `it` for `trips/roma/index.html`; `shell.spec.ts` asserts it in the gate | closed |
| T-11-09 | Tampering | HTML in trip `title`/`summary` | medium | mitigate | 0 `v-html` added under `app/` since 6315f26; title via `inlineMdToPlain` interpolation, summary via `<MDC>` | closed |
| T-11-10 | Tampering | link inside `summary` (nested `<a>`) | low | mitigate | `trip-summary-link` rule in `tests/data/trips.ts` with teeth in `invariants.spec.ts` | closed |
| T-11-11 | Tampering | timezone-shifted dates | low | mitigate | `shared/schemas.ts:357` `IsoDate` string + regex + calendar refine; `app/utils/tripDates.ts` has no `Date`/`Intl` (only mentioned in a comment) | closed |
| T-11-12 | Information Disclosure | portada listing a draft | medium | mitigate | `listedTrips` filters `draft !== true` (`tripDates.ts:90`) + unit tests; dev E2E `tests/trips/portada.spec.ts`; build E2E `tests/parity/portada.spec.ts` | closed |
| T-11-13 | Tampering | `multitrip.css` rule reaching Roma | medium | mitigate | `tests/unit/multitripCss.spec.ts` (13 tests: `.trip-index` root, no `.trip-back`/`:root`/`[data-theme`/`html`/`body`); 56 goldens green | closed |
| T-11-14 | Tampering | HTML from YAML in the card | medium | mitigate | `TripIndex.vue`: 0 `v-html`; interpolation + `<MDC>` | closed |
| T-11-15 | Spoofing | open redirect through legacy hash | high | mitigate | `app/pages/index.vue:29-38` fixed same-origin destination `JSON.stringify(base+'trips/'+LEGACY_TRIP+'/')`, hash only as suffix after `^#[a-z0-9-]+$`; `legacy-redirect.spec.ts` covers `#a/b`, `#%3Cscript%3E`, `#Bad_Hash` | closed |
| T-11-16 | Tampering | HTML/JS injection from the hash | high | mitigate | hash never written to DOM/HTML; script built at build time from constants; pattern rejects `<`, `%`, `/`, uppercase, `_` | closed |
| T-11-17 | Information Disclosure | path traversal in the test server | low | mitigate | `tests/parity/_pagesServer.ts:39-63` normalized path + containment in `outDir`; binds 127.0.0.1 | closed |
| T-11-18 | Denial of Service | portada/guide downloading `sql_dump`/WASM | medium | mitigate | `portada.spec.ts` request interception on portada + Roma with non-vacuity control (≥ 1 `/_nuxt/`) | closed |
| T-11-19 | Repudiation | E2E passing against the wrong page / empty lists | medium | mitigate | expectations from `readTripManifest()`, non-empty draft list, document markers; gate count 110/13 | closed |
| T-11-20 | Information Disclosure | draft URL published | medium | mitigate | 404 for every draft on the Pages-like server (`portada.spec.ts`) + decoded-dump scan | closed |
| T-11-SC | Tampering | npm/pip/cargo installs | low | mitigate | No packages installed: `git diff --quiet 6315f26 HEAD -- package.json pnpm-lock.yaml` exits 0 | closed |

*Status: open · closed*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-11-01 | T-11-05 | Config-time YAML read over three PR-reviewed trips; a broken YAML fails the build loudly, which is the desired behaviour | plan-time disposition (11-02), confirmed by secure-phase --auto | 2026-11-20 |

**Closed from earlier phases:** AR-09-01 / AR-10-02 (dev-only trip rows in the public `sql_dump`) are now mitigated by T-11-03 — the decoded-dump scan proves no `prueba`/`forma` row reaches `.output/public`.

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-20 | 21 | 21 | 0 | secure-phase --auto (orchestrator, ASVS L1 grep-depth short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-20
