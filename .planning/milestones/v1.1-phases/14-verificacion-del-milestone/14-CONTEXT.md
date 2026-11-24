# Phase 14: Verificación del milestone - Context

**Gathered:** 2026-11-22
**Status:** Ready for planning
**Mode:** `--auto`. The user asked at 01:00 to «termina todo lo que quede, y mañana ya con todo hecho lo verificamos todo en verdad». Every decision below is the recommended default. The real-phone sign-off (PAR-04) is left to the user as a UAT checklist.

<domain>
## Phase Boundary

Produce the evidence that v1.1 (multi-trip plus Campania) can ship:
1. **Clean-build gate.** The full gate passes from a clean build: `.data`, `.nuxt` and `.output` deleted; `pnpm verify` green; the 56 Roma goldens with no re-baseline beyond the approved ROUTE-06 exception from Phase 11; the CSS equal to what `main` ships.
2. **Same-origin upgrade test (PAR-03).** A user of the live guide (`main`'s `index.html`) who wrote notes and chose pace and modes opens the new build on the same origin. They see their notes and preferences in `/trips/roma/` from the first load.
3. **Cross-trip isolation on the published build.** Going portada → Roma → Campania and back with «Atrás» mixes no search, notes or modes between trips. No guide downloads `sql_dump` or WASM, Campania included.
4. **Human sign-off (PAR-04).** A person signs off Roma and Campania on a real phone, in light and dark themes, including offline use (image fallback and the offline map banner). This is a checklist for the user, not automatable.

**Out of scope:** merging to `main` and the GitHub Pages deploy. Those are a separate ship act (ROADMAP note).
</domain>

<decisions>
## Implementation Decisions

### Gate from a clean build (SC1)
- **D-01:** Run the milestone gate from clean caches: `rm -rf .data .nuxt .output && pnpm verify`, then `pnpm typecheck && pnpm lint`, then `pnpm test:trips`, one after another.
  - The parity suite passes with no `--update-snapshots`, and the 56 goldens are byte-unchanged since v1.0, except the ROUTE-06 footer exception approved in Phase 11.
  - The planner verifies that exception from git history, and lists any other golden changed since the start of v1.1 as a blocker.
  - The two known flakes may be re-run once with `--repeat-each 3`. Recording them is enough; they are not fixed in this phase:
    - `navigation.spec.ts` SC#2 scrollspy [mobile];
    - `legacy-redirect.spec.ts` «/#pantheon» [desktop].
- **D-02:** «`base.css` sin diff respecto a `main`».
  - **The situation:** `main` only has the single-file `index.html`; there is no `app/assets/css/base.css` there.
  - **The criterion means:** the global CSS shipped by the Nuxt build is the CSS of `main`'s `index.html`.
  - **Reuse first:** the planner reuses any v1.0 check that already compares `base.css` with the `<style>` block of `index.html`. If none exists, add a data test that extracts the `<style>` block from `git show main:index.html` and compares it with `app/assets/css/base.css` (+ `tokens.css`/`fonts.css` if v1.0 split them).
  - **Comparison rules:** normalise whitespace only, and document any intentional v1.0 split such as Leaflet CSS.
  - **If an undocumented difference appears:** report it as a finding. Do not "fix" `base.css`, which is frozen.

### Same-origin upgrade test (SC2, PAR-03)
- **D-03:** A new Playwright spec that serves both sides from the same origin:
  - **Old guide:** `main`'s `index.html`, taken with `git show main:index.html` into a temp directory at test time. Never committed as a copy.
  - **New build:** the `.output/public` build under `/guiaRoma/`.
  - **The test drives the old guide like a real user:** writes a note on a card, chooses a non-default pace, and toggles «caminar menos» and the summary mode. That fills its real `localStorage` keys (`roma-*`, `roma-note-<slug>`, the theme key).
  - **Then it opens the new build on the same origin** and asserts that `/guiaRoma/trips/roma/` shows the note, pace and modes on the first load, with no migration step and no data loss.
  - Hosting, path layout and spec location are for the planner to decide. The spec is a **new file**: no existing `tests/parity` spec is edited, and new spec files are allowed. If it joins the gate, `tests/README.md` re-registers the gate total.
  - Reuse `tests/parity/_pagesServer.ts` (read-only import) if it fits; otherwise write a small sibling helper.
- **D-04:** The old guide is legitimately served at `/guiaRoma/`, which today is the portada, and the legacy `/#hash` redirect exists since Phase 11. So the test runs the old guide as it was deployed, at `/guiaRoma/index.html` on the same origin, in its own server instance. It then starts the new build on the **same origin and port** after the old server stops, keeping one browser context (same `localStorage`).
  - The planner may choose another equivalent layout if it keeps the origin identical. `localStorage` is per origin, not per path.

### Cross-trip isolation and no heavy downloads (SC3)
- **D-05:** A new spec on the built site, run by the pages server:
  - It navigates portada → Roma → Campania → «Atrás» → «Atrás».
  - **Search:** a query typed in Roma does not appear in Campania, and results stay per trip.
  - **Notes:** a Roma note does not appear on Campania cards, and the reverse.
  - **Modes:** Roma's pace, caminar menos and resumen do not change Campania's, and the reverse. The keys are namespaced `roma-*` and `campania-*`.
  - **Downloads:** no request matching `__nuxt_content/|sql_dump|\.wasm` happens on any of the three pages, nor after the history navigation.
  - It extends the Phase 11 D-15 assertion, which only covered the portada and Roma, to Campania.
- **D-06:** If SC3 finds that Campania or a back navigation downloads `sql_dump`/WASM (a real defect), the fix is allowed in this phase as a minimal code change. It needs its own plan (or a decimal insert if large). Parity must stay 110/110, and Roma's DOM must stay unchanged. Same for any other real defect the gate reveals: fix minimally, never by weakening a test.

### Human sign-off (SC4, PAR-04)
- **D-07:** Produce a phone sign-off checklist in the phase directory, in Spanish, for the user to follow tomorrow. Its items:
  - Roma and Campania on a real phone (iOS/Android), each in light and dark themes.
  - Offline, in airplane mode after a first visit: image fallback to motifs, and the offline map banner.
  - Notes persist after a reload.
  - Pace and modes per trip.
  - Day routes open Google Maps in the right mode.
  - The portada and the «← Todos los viajes» link.
  - It also points to how to serve the build on the LAN or a preview, from the memory note about serving under `guiaRoma/`.

  The phase verification ends as `human_needed`, with these items persisted in `14-UAT.md`. They join the pending UATs of Phases 9, 10, 11, 12 and 13, which the user will run tomorrow.
- **D-08:** The milestone audit (`/gsd-audit-milestone`) and `complete-milestone` are **not** run in this phase. They follow the user's UAT sign-off.

### Constraints carried forward
- **D-09:** No golden re-baseline beyond ROUTE-06, and no `--update-snapshots`. No edits to existing `tests/parity` specs; new spec files are allowed. `content/trips/**` and the frozen CSS are untouched. No `<style scoped>` and no new `v-html`.
- **D-10:** Process.
  - Node 22 (`~/.nvm/versions/node/v22.20.0/bin`).
  - `rm -rf .data .nuxt .output` before generate.
  - Never run `test:trips` at the same time as generate or verify.
  - Branch `release/nuxt-4`.
  - Sequential execution.
  - Commits end with the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer.
  - `.planning/state.json`, `.planning/config.json` and `.planning/ui-reviews/` stay uncommitted.
  - Personal emails are kept out of files.

### Claude's Discretion
- How the work splits into plans. Suggested:
  1. The upgrade spec (PAR-03).
  2. The isolation and no-heavy-download spec, plus the CSS-vs-main check.
  3. The final clean-build gate, the README counts and the sign-off checklist.
- The spec file names and helpers.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/ROADMAP.md` § Phase 14: goal and the 4 success criteria. The ROUTE-06 exception is described in § Phase 11 (SC4/SC5).
- `.planning/REQUIREMENTS.md`: PAR-03 and PAR-04.
- `.planning/phases/09-plataforma-por-viaje/` (CONTEXT/SUMMARY): per-trip storage keys `${slug}-${key}`, and why Roma's keys are unchanged.
- `.planning/phases/11-*/11-CONTEXT.md`: legacy redirect, portada, D-15 (no sql_dump/WASM), ROUTE-06 footer exception.
- `tests/parity/_harness.ts`, `tests/parity/_pagesServer.ts`, `tests/parity/portada.spec.ts`, `tests/parity/legacy-redirect.spec.ts`: server and harness patterns (read only).
- `tests/trips/isolation.spec.ts`: dev-time isolation precedent.
- `tests/README.md`: gate counts and how to re-register them.
- `git show main:index.html`: the live guide (storage keys, `<style>` block).
- The memory note on serving the built site locally, under a `guiaRoma/` subdir.
</canonical_refs>

<code_context>
## Existing Code Insights

- **Parity gate:** `playwright.gate.config.ts` is 110 tests in 13 files. `_pagesServer.ts` imitates GitHub Pages under `/guiaRoma/` (301 to the trailing slash, a real `404.html`).
- **Persistence:** keys are `${slug}-${key}`, so Roma keeps `roma-pace`, `roma-light`, `roma-resumen` and `roma-note-<slug>`. The theme key is `roma-theme` (color-mode `storageKey`).
- **Campania:** published since 13-08 at `/guiaRoma/trips/campania/`.
</code_context>

<specifics>
- The user will run all the UATs tomorrow: 9, 10, 11, 12 and 13, plus the Phase 14 phone sign-off. Make the checklist concrete and short.
</specifics>

<deferred>
- Deploy to GitHub Pages and the merge to `main` (ship act).
- `/gsd-audit-milestone` and `/gsd-complete-milestone`, after the user's sign-off.
</deferred>

---

*Phase: 14-verificacion-del-milestone*
*Context gathered: 2026-11-22*
