---
phase: 10
review: 10-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "The link allowlist and anchor check (D-05b / D-08) can be bypassed with valid Markdown that MDC renders as links"
  - id: WR-02
    severity: warning
    disposition: open
    title: "`inlineMdToPlain` (the D-14 neutral fallback) garbles ordinary titles"
  - id: WR-03
    severity: warning
    disposition: open
    title: "The `anchor` rule still accepts monuments that are never rendered (D-08 does not hold for them)"
  - id: IN-01
    severity: info
    disposition: open
    title: "Impossible-state guard — `v-if=\"e.day\"` and `v-if=\"refById.get(...)\"` in the layout loop"
  - id: IN-02
    severity: info
    disposition: open
    title: "`day-pill` does not check day labels against the structural pill labels"
  - id: IN-03
    severity: info
    disposition: open
    title: "A duplicated `order` makes `day-order` also flag every later, correct day"
  - id: IN-04
    severity: info
    disposition: open
    title: "Footer lines accept block-level Markdown, which would put a block inside `<p>`"
  - id: IN-05
    severity: info
    disposition: open
    title: "The trap scans only text nodes, not attributes"
  - id: IN-06
    severity: info
    disposition: open
    title: "`dayLabel.ts`'s doc comment contradicts the new `pill` field"
open: 9
total: 9
recorded: 2026-11-20T14:49:31.100Z
---

# Phase 10: Code Review Disposition

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
