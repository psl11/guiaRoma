---
phase: 10
review: 10-REVIEW.md
titles: json
findings:
  - id: CR-01
    severity: critical
    disposition: open
    title: "The reference-definition rejection only catches unindented definitions with simple labels, so `[x][r]` still renders cross-trip links"
  - id: CR-02
    severity: critical
    disposition: open
    title: "The frontmatter-props rejection matches only one way of writing the YAML key, so `::a` + `---` + `href` still renders `<a href>`"
  - id: CR-03
    severity: critical
    disposition: open
    title: "`FoodEntry.href` renders as `<a :href>` with no checks; the gate accepts `/trips/roma`, `#nope` and `javascript:`"
  - id: WR-01
    severity: warning
    disposition: open
    title: "Prose can create DOM ids and heading `<a>`s that the gate never sees, which undermines `card-placement` and `trip-summary-link`"
  - id: WR-02
    severity: warning
    disposition: open
    title: "The raw-HTML rejection matches only `<a`; other raw elements that navigate (`<area href>`, `<form action>`) still pass"
  - id: IN-01
    severity: info
    disposition: open
    title: "`card-placement` reports duplicate violations when two monument files share a slug"
  - id: WR-03
    severity: warning
    disposition: fixed
    title: "The `anchor` rule still accepts monuments that are never rendered (D-08 does not hold for them)"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "`day-pill` does not check day labels against the structural pill labels"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "A duplicated `order` makes `day-order` also flag every later, correct day"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "Footer lines accept block-level Markdown, which would put a block inside `<p>`"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "The trap scans only text nodes, not attributes"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "`dayLabel.ts`'s doc comment contradicts the new `pill` field"
open: 6
total: 12
recorded: 2026-11-22T20:20:39.781Z
---

# Phase 10: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| CR-01 | critical | open | - |
| CR-02 | critical | open | - |
| CR-03 | critical | open | - |
| WR-01 | warning | open | - |
| WR-02 | warning | open | - |
| IN-01 | info | open | - |
| WR-03 | warning | fixed | 10-06 (G-10-2) (not in the current review) |
| IN-02 | info | deferred | 10-UAT.md · Deferred Follow-Ups (not in the current review) |
| IN-03 | info | deferred | 10-UAT.md · Deferred Follow-Ups (not in the current review) |
| IN-04 | info | deferred | 10-UAT.md · Deferred Follow-Ups (not in the current review) |
| IN-05 | info | deferred | 10-UAT.md · Deferred Follow-Ups (not in the current review) |
| IN-06 | info | deferred | 10-UAT.md · Deferred Follow-Ups (not in the current review) |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
