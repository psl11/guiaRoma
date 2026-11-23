---
phase: "13"
slug: "contenido-campania-2027"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-11-22"
---

# Phase 13 — Security

> This file is the phase's security contract: the threat register, the risks accepted, and the audit trail.
> - **Source:** the register merges the `<threat_model>` blocks of 13-01..13-08-PLAN.md. No SUMMARY carries a `## Threat Flags` section.
> - **Check:** mitigations verified at ASVS L1, grep depth, against `release/nuxt-4` after 13-08.
> - **Auditor:** the subagent was not run. Every threat is closed, the register was written at plan time, and the level is ASVS L1.

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Trip YAML (PR author) → published static site | Campania is now public (D-02) | Itinerary, names, field data |
| Campania prose → rendered links | Markdown links in the content | `#id` anchors and external URLs |
| Third-party images → page | Heroes hotlinked from Wikimedia | Image requests |
| Draft trips → production build | `prueba` and `forma` must stay out | Test content |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation (evidence) | Status |
|-----------|----------|-----------|----------|-------------|------------------------|--------|
| T-13-01 | Tampering | Markdown links in prose | medium | mitigate | The gate rules `cross-trip-link` and `anchor` in `tests/data/trips.ts` run over every Campania string inside `pnpm verify` (data 760/760). | closed |
| T-13-02 | Information Disclosure | Personal data in content | medium | mitigate | The only personal data is first names that already appear in the plan. `campania-content.spec.ts:574` («ningún teléfono internacional ni tira de 9 o más cifras») covers all content. | closed |
| T-13-03 | Repudiation | Unverified data shown as fact | high | mitigate | `campania-content.spec.ts:32-33` defines `MARKER` and `BOLD_MARKER`. Per-file presence comes from `MARKER_FILES`, and the spec enforces at least 15 markers (172 present). Markers are never allowed in plain fields. | closed |
| T-13-04 | Denial of Service | Hotlinked Wikimedia heroes | low | accept | AR-13-01 | closed |
| T-13-05 | Tampering | Roma and frozen code paths | high | mitigate | `git diff --quiet 10a55d8 HEAD -- content/trips/{roma,prueba,forma} app shared nuxt.config.ts content.config.ts tests/parity app/assets/css` exits 0. There are 56 golden PNGs. | closed |
| T-13-06 | Spoofing | Food card names | medium | mitigate | The D-14 allowlist in `campania-content.spec.ts` (gastronomía block) is mutation-proven: «Caseificio Inventado» turns it red (13-02). | closed |
| T-13-07 | Information Disclosure | Food address and footer | low | mitigate | The digit-run and phone check covers food files. Addresses are only the RESEARCH-verified ones. | closed |
| T-13-08 | Repudiation | Ferry times, Alibus fare, race date | high | mitigate | Each value carries the marker. The spec requires the marker in domingo-20, lunes-21, sabado-19 and others (13-03). | closed |
| T-13-09 | Spoofing | Roma text leaking into Campania | medium | mitigate | `findRomaLeaks` runs over every Campania string, and the `shape.spec.ts` trap runs in `test:trips` (46/46). | closed |
| T-13-10 | Repudiation | ZTL, rental desk, castle hours, Raito's location | medium | mitigate | These values are marked. The spec places Raito in Vietri and forbids «Cilento» in that card (13-04). | closed |
| T-13-11 | Denial of Service | Misleading day route | medium | mitigate | Routes use `driving` with shared stops only. The spec has a WR-01 guard: a transit day may have at most 2 route cards. An e2e test checks Thursday's 2 stops and `travelmode=driving`. | closed |
| T-13-12 | Repudiation | Concert dates and times | high | mitigate | Per D-22, Ultimo is on Friday 25 with its time marked, and every PTN detail is marked. The spec forbids «devoluci» on Friday and Ultimo on Thursday. | closed |
| T-13-13 | Information Disclosure | Child-safety statements | medium | mitigate | `FAMILY_REQUIRED` in the spec covers stadio-maradona and napoli-sotterranea. Unverified conditions are marked. | closed |
| T-13-14 | Spoofing | Reservas headings inherited from Roma | high | mitigate | Gate rule `reservas-headings` from 12.1. `campania-content.spec.ts:789` rejects the defaults. The e2e check `campania.spec.ts:1172` asserts there is no «3 comensales». | closed |
| T-13-15 | Information Disclosure | Booking codes or phones in Reservas | medium | mitigate | The digit and phone check covers the reference files. Rows describe zones and operators only. | closed |
| T-13-16 | Information Disclosure | Control mark or draft text reaching the site | medium | mitigate | `content/trips/campania/trip.yml` has no `draft` and no control mark. `build-isolation.spec.ts` scans every published file for all three marks. | closed |
| T-13-17 | Elevation of Privilege | Draft trips leaking to production | high | mitigate | `tripManifest.spec` excludes exactly forma and prueba. `build-isolation` checks that `trips/prueba` and `trips/forma` are absent. The parity portada spec returns 404 for drafts. | closed |
| T-13-18 | Tampering | Parity specs or goldens changed to pass | high | mitigate | `tests/parity` has no diff, the 56 PNGs are unchanged, and parity passed 110/110 on the first run without writing snapshots. | closed |
| T-13-19 | Repudiation | Car-return place and time, Cuma hours | medium | mitigate | The spec requires «Capodichino» together with the marker on Saturday's return stop. Cuma's 2027 hours are marked. | closed |
| T-13-20 | Denial of Service | A card listed on two days | medium | mitigate | The spec requires each monument in exactly one day's `cards`. It is mutation-proven in 13-06. | closed |
| T-13-SC | Tampering | npm/pip/cargo installs | high | accept | AR-13-02: `git diff --quiet 10a55d8 HEAD -- package.json pnpm-lock.yaml` exits 0 | closed |

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-13-01 | T-13-04 | Follows Roma's precedent. If a hotlinked hero fails, the motif SVG is shown instead (e2e). No personal data is in the URLs. Local images are deferred to v2/PWA. | plan-time disposition (13-01), confirmed by the orchestrator | 2026-11-22 |
| AR-13-02 | T-13-SC | No packages installed; the lockfile is unchanged | plan-time disposition (all plans), confirmed by the orchestrator | 2026-11-22 |

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-22 | 21 | 21 | 0 | orchestrator (ASVS L1 grep-depth short-circuit) |

## Sign-Off

- [x] All threats have a disposition
- [x] Accepted risks documented
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set

**Approval:** verified 2026-11-22
