---
phase: 10-forma-y-chrome-desde-datos
fixed_at: 2026-11-22T22:40:00Z
review_path: .planning/phases/10-forma-y-chrome-desde-datos/10-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 10: Code Review Fix Report

**Fixed at:** 2026-11-22T22:40:00Z
**Source review:** .planning/phases/10-forma-y-chrome-desde-datos/10-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (CR-01, CR-02, CR-03, WR-01, WR-02; fix_scope `critical_warning`)
- Fixed: 5
- Skipped: 0
- Out of scope: IN-01 (Info). It is still listed in REVIEW.md.

All fixes are in the data gate: `tests/data/trips.ts`, new tests in `tests/data/invariants.spec.ts`, and docs in `tests/README.md` §5.3. No changes to `content/`, `tests/parity/`, `app/`, `shared/schemas.ts`, `content.config.ts`, `package.json` or `pnpm-lock.yaml`, so the rendered output is unchanged. The real trips (roma, campania, forma, prueba) stay green with no edits.

**Verification (main checkout; `workflow.use_worktrees=false`, so no worktree was used):**
- Each commit was preceded by `pnpm test:data` and `pnpm test:unit` under Node 22. Final counts: 861/861 data tests and 568/568 unit tests.
- Each set of new tests was also run against the previous `trips.ts` (`git show HEAD:tests/data/trips.ts`). They all failed there, so they really catch the bug: CR-01 6, CR-02 4, CR-03 3, WR-01 11, WR-02 4.
- Each new form was checked with the installed `parseMarkdown` from `@nuxtjs/mdc` 0.22.0 to confirm what it actually renders.
- `eslint` on the two gate files and `pnpm typecheck` are both clean.

## Fixed Issues

### CR-01: The reference-definition rejection only catches unindented definitions with simple labels

**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** d208686
**Applied fix:** Replaced the line-anchored regex with `/\[(?:[^[\]\\]|\\[\s\S])+\]:/`, which matches anywhere in the string. It catches definitions inside `>`, `-` and `1.`, labels that span a line break, labels with an escaped `\]`, and footnote definitions `[^1]: …`. Added the 5 strings from the review plus `> [^1]: nota` to the cross-trip-link `it.each`.

### CR-02: The frontmatter-props rejection matches only one way of writing the YAML key

**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** db113ce
**Applied fix:** The gate now rejects the construct itself instead of matching YAML keys: a `::x` line followed by a line of 3 or more dashes. This also covers `::x` lines inside `>`, `-` and `1.` containers. MDC accepts `----` as a delimiter, and it accepts the block inside list items and block quotes. Both were checked with parseMarkdown, so the rule is broader than the review's suggested regex. Added tests for `{href: …}`, `? href`, `"\x68ref"`, and a block inside a list that uses `----`.

### CR-03: `FoodEntry.href` renders as `<a :href>` with no checks

**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** 6ac4a2d
**Applied fix:** In the timeline loop (`timelineRowsOf`, so `choice` options are included), any `entry.href` that does not start with `http(s)://` is now a `cross-trip-link` violation in the day file. Added tests for `/trips/roma`, `#nope` and `javascript:alert(1)`; each one runs both as a plain food row and inside a `choice` option. Added a Google Maps control that must stay green. I chose not to tighten `shared/schemas.ts` (the review marks it optional), so the content build path stays exactly as it is.

### WR-01: Prose can create DOM ids and heading `<a>`s that the gate never sees

**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** c7e36f2
**Status:** fixed: requires human verification (logic change in a lexical scanner)
**Applied fix:** Added four rejected forms, all reported as `cross-trip-link`. Because they count as rejected forms, a summary that uses them also fails `trip-summary-link`:
- ATX headings, including inside `>`, `-` and `1.`. parseMarkdown confirmed that `- ## Mapa` and `> ## Mapa` both produce `h2 id`.
- Setext headings underlined with `===`.
- Setext headings underlined with `---`. The previous line must be non-blank, so a lone `-` value does not trigger it.
- MDC attributes `{#id}`, and also `{id=…}`, which parseMarkdown showed produces an id too. The review's regex missed this case. Quoted values are skipped, so the `#galeria` inside a `::detail-photo` `caption="…"` is not a false red, and the existing control test still passes. A closing `}` is required.

When the frontmatter rule from CR-02 already fires, the setext `---` label is dropped so the frontmatter's closing `---` is not reported twice. Added 9 cross-trip-link tests, 2 summary tests (`## Cinco días`, `Cinco días\n---`), and 2 controls (a list, and a stray `{` before an anchor link).

### WR-02: The raw-HTML rejection matches only `<a`

**Files modified:** `tests/data/trips.ts`, `tests/data/invariants.spec.ts`, `tests/README.md`
**Commit:** 4025613
**Applied fix:** Replaced the `<a` blocklist with an allowlist: `/<(?!br\s*\/?>|<scheme:…>|<a@b>)[a-z]/i`. Only `<br>` is allowed (in any spelling). Autolinks are excluded from this rule because they still go through the destination allowlist, so the `<https://…>` control stays green and `<mailto:…>` / `<javascript:…>` are still reported exactly once. Added tests for `<area href>`, `<form action>`, `<span id>` and `<b id>`, plus a control for `<br/>`, `<BR />`, an HTML comment and an autolink. Updated the comments in `trips.ts` and the spec header to describe the full rejected list.

## Out of Scope

### IN-01: `card-placement` reports duplicate violations when two monument files share a slug

**File:** `tests/data/trips.ts:480-491`
**Reason:** Info severity, so it is outside `fix_scope: critical_warning`. It is still listed in REVIEW.md.

---

_Fixed: 2026-11-22T22:40:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
