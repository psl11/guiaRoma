---
phase: 11
review: 11-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: fixed
    title: "Inline MDC components render block elements (and a nested `<a>`) inside the summary `<p>` but pass both summary rules"
  - id: WR-01
    severity: warning
    disposition: fixed
    title: "`\\r` line endings bypass the blank-line scan and the setext scan (two paragraphs, `h1` inside the `<p>`)"
  - id: WR-02
    severity: warning
    disposition: fixed
    title: "Unicode whitespace next to the blank line hides a paragraph break"
  - id: IN-01
    severity: info
    disposition: open
    title: "Undocumented false red: a tab-indented continuation line"
  - id: IN-02
    severity: info
    disposition: open
    title: "The static fatal-guard test does not tie the guard to the `trips-index` result or check where it sits"
  - id: IN-03
    severity: info
    disposition: open
    title: "Impossible-state guard — `cards === null` branch after the fatal guard"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "A failed query on the home page publishes a blank page with HTTP 200"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "Comments still describe the pre-phase-11 routing"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "The base-URL trailing-slash expression is duplicated four times"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "Debug `console.log` in the redirect spec, and a build-time dependency in devDependencies"
open: 3
total: 10
recorded: 2026-11-23T00:35:09.911Z
---

# Phase 11: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | fixed | 11-REVIEW-FIX.md |
| WR-01 | warning | fixed | 11-REVIEW-FIX.md |
| WR-02 | warning | fixed | 11-REVIEW-FIX.md |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| WR-03 | warning | fixed | 11-08 (G-11-3) (not in the current review) |
| IN-04 | info | deferred | 11-UAT.md · Deferred Follow-Ups (not in the current review) |
| IN-05 | info | deferred | 11-UAT.md · Deferred Follow-Ups (not in the current review) |
| IN-06 | info | deferred | 11-UAT.md · Deferred Follow-Ups (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
