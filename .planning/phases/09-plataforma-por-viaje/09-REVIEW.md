---
phase: 09-plataforma-por-viaje
reviewed: 2026-11-22T12:10:23Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - tests/data/trips.ts
  - tests/data/invariants.spec.ts
  - tests/data/fixtures/trips/raiz.yml
  - tests/data/fixtures/trips/.oculto.yml
  - tests/README.md
findings:
  critical: 1
  warning: 1
  info: 2
  total: 4
  necessity: 0
status: issues_found
---

# Phase 9: Code Review Report (incremental, gap closure 09-06 / G-09-3)

**Reviewed:** 2026-11-22T12:10:23Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

> **Scope note.** This is an incremental review of gap-closure plan 09-06 (UAT gap G-09-3, residual IN-05). It replaces the earlier full-phase 09-REVIEW.md **only for the five files listed above**. The earlier findings, and how each was handled, are in git history (previous revision of this file) and in `09-REVIEW-DISPOSITION.md`.
>
> The configured `diff_base` (`83dcf54`) is 279 commits back and includes unrelated phases 10–14. The review therefore covers the 09-06 commits only (`git diff 68be7a5 HEAD -- <files>`: 2f8f1d9, 7d6f51f, 378c9fc, a152db3, bf45c6b), and reads the full current `tests/data/trips.ts` for context.

## Summary

09-06 makes two changes. `isYaml` now ignores letter case, so `.YML`/`.Yaml` files reach classification and come out as `stray-file`. A new `checkTripsRoot()` reports non-hidden, non-directory entries at the top of `content/trips/` as `stray-file`. Both changes are correct for the cases they test, and `tests/data/invariants.spec.ts` passes (157/157 on Node 22.20).

The gap is not fully closed, though. The new `rootEntries()` helper treats any name that starts with `.` as safe to ignore. `@nuxt/content` 3.14 globs every collection with `dot: true` (`node_modules/@nuxt/content/dist/module.mjs:1783,1801,1957,2024`). I checked this with tinyglobby 0.2.17 and the same options: `trips/*/trip.yml` matches `trips/.oculto/trip.yml`, and `trips/*/monuments/*.yml` matches `trips/.oculto/monuments/a.yml`. So a hidden trip folder is loaded into the site, but the data gate never sees it. A probe against the real `trips.ts` returned `listTripDirs → ['roma']` and `checkTripsRoot → []` for a root that contained `.oculto/`.

That is the same "silently skipped" class of bug G-09-3 was meant to close, now written into a helper that claims to be the single place deciding what is hidden. The README promises that no entry is dropped silently, which this contradicts.

There is a second, smaller gap. Non-YAML files inside a trip folder (`galeria.json`, `galeria.yml~`, `galeria.ym`) are still skipped without any violation.

No necessity findings. Each guard in the diff protects against something that can actually happen in this repo.

## Critical Issues

### CR-01: Hidden trip folders are loaded by Nuxt Content but skipped by the data gate (fail-open remains)

**File:** `tests/data/trips.ts:159-161` (also `:170-175`, `:184-194`; `tests/README.md:324-331`; `tests/data/invariants.spec.ts:172-179`)
**Issue:** `rootEntries()` drops every name that starts with `.`. Both `listTripDirs()` and `checkTripsRoot()` build on it, so a hidden folder is neither a trip folder (never checked by `checkTrip`/`schema.spec.ts`) nor a root violation. Nuxt Content uses `dot: true`, so a folder such as `content/trips/.campania-wip/` with a `trip.yml`, days and monuments **is** loaded into all 6 collections. Its data is never validated against zod, refs, anchors, `trip-slug` or anything else. Consequences in this repo:

- `scripts/tripManifest.mjs:41` also skips hidden folders, so `draftExcludes` never excludes them. A `draft: true` trip in a hidden folder ends up in the public `sql_dump` assets, which bypasses the D-16/CR-01 confidentiality rule.
- `trip.yml` in a hidden folder can declare any `slug` (the `trip-slug` = folder rule never runs). For example, `slug: roma` creates a second `roma` row. `useTrip` (`app/composables/useTrip.ts:39`, `.where('slug','=',slug).first()`) and the portada (`app/components/TripIndex.vue:37`, `queryCollection('trip').all()`) then read whichever row comes back first.
- The new fixture `tests/data/fixtures/trips/.oculto.yml` only covers a hidden **file**. That case is harmless, because no collection glob matches a file at the root. The hidden **directory** case, the one Content actually loads, is not tested, so the passing test makes the gap look closed.

The README text "reparten entre las dos **todas** las entradas no ocultas … sin descartar ninguna en silencio" and the `rootEntries` docstring both describe a contract that Content's `dot: true` breaks.

**Fix:** Ignore only hidden *non-directories* at the root. Treat hidden directories as trip folders, so the existing rules fail them (`trip-slug`: slug ≠ folder, since `TRIP_SLUG_RE` cannot match a leading `.`), or report them as root violations. Do the same in the manifest so the build fails closed, and add a fixture for a hidden directory.

```ts
// tests/data/trips.ts
function rootEntries(root: string): Dirent[] {
  // Content globs with dot:true: a hidden DIRECTORY is ingested, so it must be gated.
  // Only hidden non-directories (.DS_Store, .gitkeep) are inert at the root.
  return readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() || !e.name.startsWith('.'))
}
```
```js
// scripts/tripManifest.mjs:41 — drop the hidden-name filter so TRIP_FOLDER_RE throws
.filter(d => d.isDirectory() && existsSync(join(root, d.name, 'trip.yml')))
```
Then add `tests/data/fixtures/trips/.oculto-dir/trip.yml` and assert that `listTripDirs(FIXTURES)` includes it (or that `checkTripsRoot` reports it), and that `checkTrip(loadTrip('.oculto-dir', FIXTURES))` returns a `trip-slug` violation. Update the README paragraph to match.

## Warnings

### WR-01: Non-YAML files inside a trip folder are still skipped with no violation

**File:** `tests/data/trips.ts:207` (docstring `:196-202`)
**Issue:** `loadTripFromFiles` runs `if (!isYaml(rel)) continue`, so every non-YAML file is dropped without a violation. G-09-3 is about files an author expects Content to load but Content ignores. These cases still get through with zero violations (checked with a probe: `checkTrip(loadTripFromFiles('x', {'trip.yml': …, 'monuments/galeria.json': '{}', 'monuments/galeria.yml~': 'x'}))` returned `[]`):
- `monuments/galeria.json`: Content data collections do accept JSON elsewhere, so an author could reasonably try it.
- Editor and backup leftovers or typos such as `galeria.yml~`, `galeria.yml.bak`, `galeria.ym`, `galeria.yml ` (trailing space).

`find content/trips -type f ! -name '*.yml'` returns nothing today, so there is no real non-YAML content that would have to be exempt.
**Fix:** Report every non-hidden file that is not YAML as `stray-file`, and keep exempting hidden files such as `.DS_Store` and `.gitkeep`:
```ts
const isHidden = (rel: string) => rel.split('/').some(seg => seg.startsWith('.'))
for (const rel of Object.keys(files).sort()) {
  const file = `${base}/${rel}`
  if (!isYaml(rel)) {
    if (!isHidden(rel)) loadViolations.push({ file, rule: 'stray-file', message: 'fichero no YAML en la carpeta del viaje (Content lo ignoraría)' })
    continue
  }
  ...
```
(If hidden *YAML* files inside a trip folder stay loaded, which matches Content's `dot: true`, only apply `isHidden` to the non-YAML branch, as shown.) Add tooth tests for `monuments/galeria.json` and `monuments/galeria.yml~`.

## Info

### IN-01: A symlinked trip folder gets reported as "fichero suelto"

**File:** `tests/data/trips.ts:184-194`
**Issue:** `Dirent.isDirectory()` from `readdirSync({ withFileTypes: true })` does not follow symlinks, so a symlink to a trip folder is reported as `stray-file` with the message "fichero suelto fuera de una carpeta de viaje". tinyglobby follows symlinks by default, so Content would load that folder. Failing here is the safe outcome, and better than before, but the message misleads the author: the entry is not a loose file, and the trip inside is never checked.
**Fix:** Use a message that names the actual situation (for example, check `e.isSymbolicLink()` and write "enlace simbólico en content/trips: usa una carpeta real"). Or decide on purpose to resolve symlinked folders with `statSync` and gate them as trips. Either way, document the choice.

### IN-02: The `listTripDirs` docstring says "No lanza", but `readdirSync` can throw

**File:** `tests/data/trips.ts:166-168`
**Issue:** The new docstring says `listTripDirs` does not throw, so that collection errors cannot hide the real cause. `readdirSync(root)` still throws `ENOENT`/`ENOTDIR` if `content/trips` is missing or is not a folder, and the same applies to `checkTripsRoot`. The intended meaning seems to be "does not throw on stray entries", but as written the comment promises more than the code delivers.
**Fix:** Change it to "no lanza por entradas sueltas (las reporta `checkTripsRoot`); sí lanza si la raíz no existe", or catch `ENOENT` and return `[]` / a `stray-file`-style violation, if a missing root should be reported rather than crash.

---

_Reviewed: 2026-11-22T12:10:23Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
