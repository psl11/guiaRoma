---
phase: 09
review: 09-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "Hidden trip folders are loaded by Nuxt Content but skipped by the data gate (fail-open remains)"
  - id: WR-01
    severity: warning
    disposition: open
    title: "Non-YAML files inside a trip folder are still skipped with no violation"
  - id: IN-01
    severity: info
    disposition: open
    title: "A symlinked trip folder gets reported as \"fichero suelto\""
  - id: IN-02
    severity: info
    disposition: open
    title: "The `listTripDirs` docstring says \"No lanza\", but `readdirSync` can throw"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`cross-trip-link` only matches `/trips/`, so root-relative links to Roma (which lives at `/`) get through"
  - id: WR-03
    severity: warning
    disposition: open
    title: "Watchers created after the controllers' internal `await` are never disposed"
  - id: WR-04
    severity: warning
    disposition: open
    title: "`useTripModesController` calls `localStorage` without try/catch, unlike MonumentCard"
  - id: WR-05
    severity: warning
    disposition: open
    title: "The coupling guard only scans three directories, without recursion, so new coupling can slip past it"
  - id: IN-03
    severity: info
    disposition: open
    title: "The `anchor` rule accepts any day slug, but TripView renders only `viernes`…`martes`"
  - id: IN-04
    severity: info
    disposition: open
    title: "Redundant navigation in the PLAT-03 E2E test"
  - id: IN-05
    severity: info
    disposition: open
    title: "The gate ignores stray files outside trip folders and `.YML` with upper-case extensions"
open: 11
total: 11
recorded: 2026-11-22T12:11:27.645Z
---

# Phase 09: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| WR-01 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| WR-02 | warning | open | - (not in the current review) |
| WR-03 | warning | open | - (not in the current review) |
| WR-04 | warning | open | - (not in the current review) |
| WR-05 | warning | open | - (not in the current review) |
| IN-03 | info | open | - (not in the current review) |
| IN-04 | info | open | - (not in the current review) |
| IN-05 | info | open | - (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
