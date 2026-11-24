---
phase: 11-portada-y-rutas-multi-viaje
fixed_at: 2026-11-23T01:35:00Z
review_path: .planning/phases/11-portada-y-rutas-multi-viaje/11-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-11-23T01:35:00Z
**Source review:** .planning/phases/11-portada-y-rutas-multi-viaje/11-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (fix_scope `critical_warning`: CR-01, WR-01, WR-02)
- Fixed: 3
- Skipped: 0
- Out of scope, still open in REVIEW.md: IN-01, IN-02, IN-03 (IN-03 is a necessity finding)

**Where verification ran:** in the main checkout (`workflow.use_worktrees: false`, so no worktree was created), on Node 22.20.0. Before each commit, `pnpm test:data` and `pnpm test:unit` passed, and `eslint` was clean on the edited `.ts` files. The final counts were 927/927 for `test:data` (906 before) and 575/575 for `test:unit`. The real trips (roma, campania, forma, prueba) still give 0 violations, and nothing under `content/` changed. Every new form was checked against the installed `@nuxtjs/mdc` 0.22.0 `parseMarkdown` with the scratch probe (`probe.mjs`). For WR-01 and WR-02, the new tests were also run against the pre-fix `trips.ts` to confirm they fail: 5 and 3 failures respectively. The CR-01 tests were GREEN before the fix in the probe. No files changed outside `tests/data/trips.ts`, `tests/data/invariants.spec.ts` and `tests/README.md`.

All three are logic changes to the lexical gate (regexes), so each is marked **fixed: requires human verification**.

## Fixed Issues

### CR-01: Inline MDC components render block elements (and a nested `<a>`) inside the summary `<p>` but pass both summary rules

**Status:** fixed: requires human verification
**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** 65476f1
**Applied fix:** Added a summary-only form to `SUMMARY_BLOCK_FORMS`: `/(?<!:):[A-Za-z][\w-]*(?![\w-]*:)/`, labelled `componente MDC en línea «:x[…]» / «:x{…}»`. It differs from the reviewer's suggestion in one way: the `(?<!:)` lookbehind. In the probe, a mid-line `::x` (`Roma ::div[x]`, `_::div[x]_`, `(::hr)`) renders as a plain `p`. A line-start `::x` is already caught by the existing `::x` form, so without the lookbehind `::nota` would be reported twice. Probe results:
- All reviewer rows now go RED: `Roma :div`, `Roma (:div[x])`, `:ul[x]`, `:hr`, `:h2[Mapa]`, `Diez :section[días]`, `_:div[x]_`, `**:div[x]**`, `:detail-photo{…}`, `Roma :a[x]`, `:nuxt-link[x]`, `Roma :ul.x`, `:hr :sunny:`.
- Every string that stays GREEN is a single `p` in MDC: `:emoji:` forms such as `Roma :sunny: y`, `:div:[x]`, `:hr:` and `:ul:{.x}`; colon followed by a space or a digit; mid-line `::x`.

Added 7 tests (`Roma :div`, `:ul[x]`, `:hr`, `Roma :a[x]`, `:detail-photo{…}`, `_:div[x]_`, `Roma (:div[x])`) and 3 green controls (`Del 19 al 23: 5 días, 10:00-12:00`, `Roma :sunny: y`, `Roma ::div[x]`). Updated the Phase 11 header in `trips.ts`, the `summaryBlockForms` doc comment (evidence plus a new known false red: `Roma:texto`, escaped `\:x`, `:x` inside backticks), the `invariants.spec.ts` header, and `tests/README.md` §5.3.

### WR-01: `\r` line endings bypass the blank-line scan and the setext scan (two paragraphs, `h1` inside the `<p>`)

**Status:** fixed: requires human verification
**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** 4f63ba1
**Applied fix:** Added `normEol = md => md.replace(/\r\n?/g, '\n')`, called at the top of `scanProseLinks` (so it also reaches `hasLink`, `extractAnchors` and the guide-prose `cross-trip-link` scan) and of `summaryBlockForms`. Probe results:
- `Uno.\r\rDos.` and `Uno.\r\n\r\nDos.` (both `p + p`) → `trip-summary-inline`.
- `Diez días\r===` and `Diez días\r\n===` (`h1`) → `trip-summary-link`.
- `Diez días\r---` is now `trip-summary-link` with the correct setext label.
- `Uno.\rDos.` (single `p`) stays green.

Normalizing inside `scanProseLinks` also closed the same gap in guide prose: `::a\r---\rhref: /trips/roma\r---\r…` renders `<a>` in MDC and was a false green for `cross-trip-link`. A test was added for it. Tests added: 2 `INLINE_B`, 2 setext no-double-warning, 2 `cross-trip-link` frontmatter (CR and CRLF), and 1 green control (`Diez días\rpor Campania`). README §5.3 documents the normalization in both the `scanProseLinks` and `trip-summary-inline` paragraphs.

### WR-02: Unicode whitespace next to the blank line hides a paragraph break

**Status:** fixed: requires human verification
**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** 8129e48
**Applied fix:** The blank-line form now anchors on CommonMark "non-blank" instead of `\S`: `/[^ \t\n][ \t]*\n(?:[ \t]*\n)+[ \t]*[^ \t\n]/`. Probe results:
- `Diez \n\nDos`, `Uno.\n\n Dos` and `Uno.　\n\nDos` (all `p + p`) → RED.
- `Uno.\n \nDos.` (a line holding only an NBSP is not blank, so MDC gives a single `p`) stays GREEN and was added as a control.

The review's control `'Uno.\n \nDos.'` only holds with an NBSP. With an ASCII space MDC gives `p + p`, and that case is already a red test (`Diez días.\n  \nPor Campania.`). New known false red, documented in the doc comment and in README §5.3: a paragraph holding only an NBSP next to a blank line (` \n\nDos`, a single `p` in MDC). Added 3 `INLINE_B` tests and 1 control. This commit also re-wraps two over-long doc lines left by the CR-01 edit (doc text only, no behaviour change).

---

_Fixed: 2026-11-23T01:35:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
