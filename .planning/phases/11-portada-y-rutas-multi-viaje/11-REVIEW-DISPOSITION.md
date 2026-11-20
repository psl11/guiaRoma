---
phase: 11
review: 11-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "The `trip-summary-link` rule can be bypassed, so a nested `<a>` can reach the home-page card"
  - id: WR-02
    severity: warning
    disposition: open
    title: "Block Markdown in `summary` renders block elements inside `<p class=\"trip-index-summary\">`"
  - id: WR-03
    severity: warning
    disposition: open
    title: "A failed query on the home page publishes a blank page with HTTP 200"
  - id: IN-01
    severity: info
    disposition: open
    title: "The schema accepts card data that the card then silently drops"
  - id: IN-02
    severity: info
    disposition: open
    title: "The `multitrip.css` scope guard does not see at-rules that bring in global CSS"
  - id: IN-03
    severity: info
    disposition: open
    title: "A symlinked trip folder bypasses the \"fail-closed\" draft exclusion"
  - id: IN-04
    severity: info
    disposition: open
    title: "Comments still describe the pre-phase-11 routing"
  - id: IN-05
    severity: info
    disposition: open
    title: "The base-URL trailing-slash expression is duplicated four times"
  - id: IN-06
    severity: info
    disposition: open
    title: "Debug `console.log` in the redirect spec, and a build-time dependency in devDependencies"
open: 9
total: 9
recorded: 2026-11-20T20:39:32.550Z
---

# Phase 11: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| WR-03 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |
| IN-06 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
