---
phase: "14"
slug: "verificacion-del-milestone"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
created: "2026-11-23"
---

# Phase 14 — Security

> This file is the phase's security contract: the threat register, the risks accepted, and the audit trail.
> - **Source:** the register merges the `<threat_model>` blocks of 14-01..14-03-PLAN.md. The three SUMMARY `## Threat Flags` sections report none (they only restate T-14-04 and T-14-12).
> - **Check:** mitigations verified at ASVS L1, grep depth, against `release/nuxt-4` after the 14-UAT sign-off (2026-11-23).
> - **Auditor:** the subagent was not run. Every threat is closed, the register was written at plan time, and the level is ASVS L1.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Live guide (main) → new build, same origin | The user's localStorage crosses the upgrade | Personal notes, preferences (pace, modes, theme) |
| Trip A's guide → trip B's guide (shared localStorage) | Notes and preferences must stay in their own trip | Personal notes, preferences |
| Published static site → phone on poor/no network | No runtime download of the content database | sql_dump / WASM payloads |
| Test process → local HTTP server / internet | Test servers bind 127.0.0.1; off-origin requests aborted | Built files, temp copy of main's index.html |
| main's index.html → frozen CSS | The shipped look must be main's | CSS |
| Release branch gate → ship decision | Gate result and registered counts decide whether v1.1 ships | Test totals |
| Planning docs → repo history | Checklists and README are committed | No personal data allowed |
| Developer machine → LAN (phone test) | Temporary HTTP server for the phone test | The public static build |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-14-01 | Tampering | User notes/preferences across the upgrade (PAR-03) | high | mitigate | `tests/parity/upgrade-from-main.spec.ts`: differential test against the live guide's own restore (`oracleFromLiveGuide`, l.199), orphan note key `roma-note-ficha-retirada` (l.349), reload check; green 2026-11-23 | closed |
| T-14-02 | Repudiation | Weakened/vacuous upgrade test hiding data loss | high | mitigate | Oracle computed by running `main:index.html` (7 refs in the spec), non-default oracle asserted; D-06 stop-and-report recorded in 14-01-SUMMARY; repeat-each 3 in plan verify | closed |
| T-14-03 | Tampering | Copy of main's index.html committed and drifting | medium | mitigate | `mkdtempSync(... 'guiaroma-upgrade-')` (l.334) + `rmSync` in `afterAll` (l.343-344); `git ls-files '*.html'` = 2 (root `index.html`, fixture `roma-reservas.html`) — no copy under tests/parity | closed |
| T-14-04 | Information disclosure | Test HTTP server exposing local files | low | mitigate | `tests/parity/_pagesServer.ts:81` `server.listen(port, '127.0.0.1', …)` | closed |
| T-14-05 | Information disclosure | Notes/preferences crossing Roma ↔ Campania | high | mitigate | `tests/parity/cross-trip.spec.ts` notes/modes tests with exact keys (`roma-note-pantheon`, `campania-note-baia-di-sorgeto`; `roma-note-baia-di-sorgeto` asserted null, l.364); also UAT tests 4–5 passed on a real phone | closed |
| T-14-06 | Denial of service | Campania or a history step pulling sql_dump/WASM | high | mitigate | `HEAVY_RE` (l.38) zero-match on every page and step (l.180, l.225) with draft-404 positive control; 16/16 green 2026-11-23 | closed |
| T-14-07 | Tampering | CSS drift from main hidden by a loose comparison | medium | mitigate | `tests/data/css-vs-main.spec.ts`: exact two-rule orphan allowlist each matched once (l.306), «dientes» teeth tests (l.339); `git diff --quiet v1.0 HEAD` on base/tokens/fonts/leaflet.css exits 0 | closed |
| T-14-08 | Repudiation | A test weakened to pass over a real defect | high | mitigate | D-06 rule in all three plans; no existing parity spec edited (14-03 Task 2 verify guard); goldens unchanged since v1.0 | closed |
| T-14-09 | Tampering | Goldens re-baselined / parity specs edited to turn gate green | high | mitigate | `git diff --quiet v1.0 HEAD -- tests/parity/golden.spec.ts-snapshots` exits 0; 56 PNGs | closed |
| T-14-10 | Repudiation | Gate green while running fewer tests | medium | mitigate | `tests/README.md` §4 registers `Total: 126 tests in 15 files` and raw `Total: 128 tests in 15 files`, per-file rows cross-trip 12 / upgrade 4 | closed |
| T-14-11 | Information disclosure | Personal data in 14-UAT.md or README | medium | mitigate | E-mail pattern count = 0 in `14-UAT.md` and `tests/README.md`; UAT device line records no personal data | closed |
| T-14-12 | Information disclosure | LAN server exposing more than the build | low | accept | See Accepted Risks (AR-14-01). In practice the sign-off used the public Pages site, so no LAN server was opened | closed |
| T-14-13 | Spoofing | PAR-04 marked signed without a person | high | mitigate | PAR-04 stayed `[ ]` / Pending in REQUIREMENTS.md through execution (l.60, l.134); verification ended `human_needed`; a person signed 14-UAT.md 9/9 on 2026-11-23 (commit of `test(14): complete UAT`) | closed |
| T-14-SC | Tampering | npm/pip/cargo installs | high | accept | See Accepted Risks (AR-14-02); `git diff 83a9707 HEAD -- package.json pnpm-lock.yaml` is empty | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-14-01 | T-14-12 | The checklist serves only a copy of `.output/public` under `guiaRoma/` for the session and says to stop the server and remove port forwarding afterwards; the content is the same public site that is deployed | plan 14-03 threat model | 2026-11-22 |
| AR-14-02 | T-14-SC | No package installs in phase 14 (zero new dependencies; package.json and lockfile unchanged since the phase base) | plans 14-01..03 threat model | 2026-11-22 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-23 | 14 | 14 | 0 | secure-phase orchestrator (L1 grep, auditor skipped by short-circuit rule) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-11-23
