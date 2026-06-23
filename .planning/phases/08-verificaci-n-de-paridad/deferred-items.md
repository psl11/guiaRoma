# Deferred items — discovered during 08-06, out of scope for this plan

These were discovered while driving the parity gate but are NOT caused by 08-06's changes and are
outside its scope (the visual-diff/D-02 classification). Logged per the executor scope boundary.

## D-DEF-01 — search-route "Volver restaura el scroll" fails (pre-existing)

- **Test:** `tests/parity/search-route.spec.ts:206` — "FEAT-03 resultado → navegación … 'Volver' restaura el scroll".
- **Symptom:** after searching, clicking a result (a deep card), then "Volver", `expect.poll(...5s).toBe(originY=0)` gets `24` (or similar non-zero). Deterministic (3/3).
- **Proven pre-existing:** fails IDENTICALLY (24) on **pure HEAD `ec7cadc`** with zero working-tree changes (golden reverted, MonumentCard reverted, golden.spec reverted). NOT introduced by the golden re-capture (behavior tests don't read the golden PNGs) nor by the MonumentCard `.facts` fix (verified by reverting it).
- **Root cause:** `goBack()` is a verbatim port (`window.scrollTo({ top: prev, behavior:'smooth' })`). The chosen search result resolves to a DEEP card (`window.scrollY` ~53605 after nav). A `behavior:'smooth'` scroll back from ~53k px does NOT finish within `expect.poll`'s default 5s window, so the assertion samples a mid-flight scrollY. It is a TEST-timing fragility, not an app/parity bug (the app behavior matches index.html).
- **Suggested fix (separate task):** let the smooth scroll settle before asserting (e.g. `settleScroll(page)` after clicking `#back-btn`, or raise the `expect.poll` timeout for this assertion), OR have `goBack` use instant scroll in the test env. Do NOT change `goBack`'s production behavior (it is a faithful port).

## D-DEF-02 — search ranking divergence (Nuxt vs index.html)

- **Symptom:** searching `"Pante"` returns a different FIRST result:
  - index.html (golden source): `fontana-trevi`, then `pantheon`, …
  - Nuxt build: `castel-santangelo` first.
- **Impact:** a real MiniSearch-config parity gap (field boosting / tokenization differs from the
  original index.html search). It does NOT itself fail the visual-diff (which is what 08-06 targets),
  but it is a behavior-parity gap worth a dedicated fix.
- **Suggested fix (separate task):** align the Nuxt MiniSearch options (`boost`, `fields`,
  `searchOptions`, prefix/fuzzy) with index.html's original search config so ranking matches.

## D-DEF-03 — origin/main index.html drift (informational)

- `origin/main`'s `index.html` differs from this release branch's by 8 lines (Coliseo guided tour
  time `15:30` → `15:00`, and the derived "~18:00"/"~17:30" + reservation lines). `main` is the
  living version and has evolved since this branch was cut.
- **Not an action item for this plan:** the golden is correctly captured from THIS branch's
  `index.html` (the frozen D-05 baseline). Pulling main's content into the release branch is an
  unrelated content sync, to be decided separately (it would also require re-capturing the golden
  for the changed Monday/Sunday timeline lines).
