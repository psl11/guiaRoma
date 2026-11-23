---
phase: 12
review: 12-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: deferred
    title: "`route.mode: transit` builds a multi-stop URL that Google Maps cannot route for public transport"
  - id: WR-02
    severity: warning
    disposition: deferred
    title: "D-04 «la ruta nunca mezcla A y B» only checks `stop.ref`, so option-only cards cited any other way leak into the route"
  - id: IN-01
    severity: info
    disposition: deferred
    title: "`MARKER_STYLE[m.type].bg` dropped the tolerant default and throws on an unexpected `type`"
  - id: IN-02
    severity: info
    disposition: deferred
    title: "The divIcon HTML interpolates `m.n` unescaped, while the popup escapes its fields"
  - id: IN-03
    severity: info
    disposition: deferred
    title: "`markerPopupHtml` is not exhaustive and duplicates the `MARKER_STYLE` colours"
  - id: IN-04
    severity: info
    disposition: deferred
    title: "Route auto-hiding covers `ferry` only; a `plane` day with 2 or more stops offers a walking route between cities"
  - id: IN-05
    severity: info
    disposition: deferred
    title: "The `campania` draft sentinel lives only in `trip.yml`, so a leak of its other collections would go undetected"
  - id: IN-06
    severity: info
    disposition: deferred
    title: "`TimelineChoice.vue` redefines `ChoiceRow` instead of importing the exported schema type"
  - id: IN-07
    severity: info
    disposition: deferred
    title: "`mapExtras` now accepts `type: nature`, which renders an `<a href=\"#\">` popup link that jumps to the top of the page"
open: 0
total: 9
recorded: 2026-11-21T11:53:33.311Z
---

# Phase 12: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |
| WR-02 | warning | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |
| IN-01 | info | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |
| IN-02 | info | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |
| IN-03 | info | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |
| IN-04 | info | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |
| IN-05 | info | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |
| IN-06 | info | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |
| IN-07 | info | deferred | UAT 12 test 5 (2026-11-23): diferido por el usuario, sin efecto visible hoy |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
