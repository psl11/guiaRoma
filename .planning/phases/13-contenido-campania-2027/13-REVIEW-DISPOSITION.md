---
phase: 13
review: 13-REVIEW.md
titles: json
findings:
  - { id: WR-01, severity: warning, disposition: fixed, title: "Map and card numerals are not in visit order on three days" }
  - { id: WR-02, severity: warning, disposition: fixed, title: "Napoli Sotterranea has a «Con niños» box but is visited after the children leave" }
  - { id: WR-03, severity: warning, disposition: fixed, title: "The Cilento trattoria card contradicts the Thursday timeline" }
  - { id: WR-04, severity: warning, disposition: fixed, title: "PLAIN_KEYS misses several plain-text fields" }
  - { id: WR-05, severity: warning, disposition: fixed, title: "Two Práctica assertions pass on unrelated sections" }
  - { id: WR-06, severity: warning, disposition: deferred, title: "No test covers that published Campania does not fetch sql_dump or WASM" }
  - { id: WR-07, severity: warning, disposition: fixed, title: "The privacy test misses emails, booking codes and common phone formats" }
  - { id: IN-01, severity: info, disposition: fixed, title: "Smaller prose-versus-timeline mismatches" }
  - { id: IN-02, severity: info, disposition: fixed, title: "Named restaurants link to the section rather than their own card" }
  - { id: IN-03, severity: info, disposition: fixed, title: "The island is spelled two ways" }
  - { id: IN-04, severity: info, disposition: fixed, title: "Some times are stated as certain while the event times are unknown" }
  - { id: IN-05, severity: info, disposition: fixed, title: "The D-14 test only inspects the food name field" }
  - { id: IN-06, severity: info, disposition: fixed, title: "Phantom requirement — published-file scan for a sentinel that no longer exists" }
  - { id: IN-07, severity: info, disposition: fixed, title: "Incremental registries that are now final" }
  - { id: IN-08, severity: info, disposition: fixed, title: "Stale tests/README.md labels" }
  - { id: IN-09, severity: info, disposition: fixed, title: "Data and e2e specs sort food files differently" }
open: 0
total: 16
recorded: 2026-11-22T02:30:00.000Z
---

# Phase 13: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | fixed | 0393752 |
| WR-02 | warning | fixed | d28173a (deviation from D-09 recorded: no children on Sun 27) |
| WR-03 | warning | fixed | 2e6fc37 |
| WR-04 | warning | fixed | 9267e20 |
| WR-05 | warning | fixed | e5f2f21 |
| WR-06 | warning | deferred | Phase 14 D-05: built-site spec for no sql_dump/WASM requests on portada, Roma and Campania |
| WR-07 | warning | fixed | 6d9f2ce |
| IN-01 | info | fixed | 04325b9 |
| IN-02 | info | fixed | 3b3023b |
| IN-03 | info | fixed | 133e9dd |
| IN-04 | info | fixed | 4da92e7 |
| IN-05 | info | fixed | 42f4170 |
| IN-06 | info | fixed | aab71ff (orchestrator accepted: the sentinel no longer exists; the source check now covers every Campania YAML; prueba/forma isolation unchanged) |
| IN-07 | info | fixed | 75cf600 (orchestrator accepted) |
| IN-08 | info | fixed | 1adbd76 |
| IN-09 | info | fixed | 0d4a4a1 |

Dispositions: `open`, `fixed`, `skipped`, `deferred`. Fix report: `13-REVIEW-FIX.md`.
