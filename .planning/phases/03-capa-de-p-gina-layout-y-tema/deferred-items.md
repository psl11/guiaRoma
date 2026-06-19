# Deferred Items — Phase 03

Out-of-scope discoveries logged during execution (per the executor SCOPE BOUNDARY rule).
These are NOT fixed in the plan that found them; they are carried forward for the owning
plan/phase to resolve.

---

## D1 — Runtime `no such column: "trip"` on the `artist` + `reference` (discriminated-union) collections

- **Found during:** Plan 03-05, Task 2 (first `pnpm generate` that actually renders `useTrip`).
- **Owning file (out of scope for 03-05):** `app/composables/useTrip.ts` (authored in Plan 03-02).
- **Symptom:** `pnpm generate` exits 0 but logs 4 unhandled prerender errors:
  `[POST] /__nuxt_content/artist/query … no such column: "trip"` and the same for `reference`.
- **Root cause:** `ArtistSchema` and `ReferenceSchema` are `z.discriminatedUnion`. Content v3
  cannot flatten a discriminated union into SQL columns, so the generated tables are degenerate —
  `_content_artist (id, "extension", "meta", "stem", "__hash__")` (no per-field columns); the
  field data is stuffed into the `"meta"` JSON column. The `z.object` collections
  (`trip`/`day`/`monument`/`food`) get full columns and work. So `useTrip`'s
  `queryCollection('artist'|'reference').where('trip','=',slug)` (and the `.order('order')` on
  `reference`) reference columns that don't exist → SQL error at query time.
  > Plan 03-02's SUMMARY already documented the *TypeScript* half of this same union limitation
  > (Content emits empty item types `{}`; return cast to zod types, `.order` cast to `any`). The
  > *runtime SQL* half was latent because nothing rendered `useTrip` until 03-05.
- **Impact on the 1.0 / F3 parity bar:** NONE. `artist`/`reference` feed only the
  `#arte`/`#arquitectura`/`#reservas`/`#practica` sections, which are intentionally EMPTY
  placeholders in F3 (D-05). `useAsyncData` swallows the failed fetch into `.error`, `.data`
  stays `null`, and `buildTripIndexes`' `?? []` guards yield empty Maps. The home `/` renders at
  100% parity (verified: title, lang, 2 theme-color metas, 12 nav pills in locked order, hero,
  4 info-cards, footer all correct).
- **Must be fixed before:** Phase 4 (when `#arte`/`#arquitectura`/`#reservas`/`#practica` get
  real content from `artists`/`reference`).
- **Candidate fixes for the owning plan (F4):** query these two collections WITHOUT a SQL
  `.where`/`.order` on union-only fields and filter/sort in JS over the `meta`-hydrated objects;
  OR split each union into per-variant `z.object` collections so Content generates real columns;
  OR add a top-level (non-union) `trip`/`order` column to the union schemas. Decision belongs to F4.

---

## D2 — Benign `<html data-theme>` hydration mismatch on the static build (expected color-mode SSG behavior)

- **Found during:** Plan 03-05, Task 2 (probing the served generated `/`).
- **Owning concern:** `@nuxtjs/color-mode` SSG behavior — intrinsic, not a defect in any plan's code.
- **Symptom:** one browser console error on first load of the built `/`:
  `Hydration completed but contains mismatches.`
- **Root cause:** with `colorMode.preference: 'system'`, the prerendered HTML emits
  `<html lang="es">` with **no** `data-theme` (the OS preference is unknowable at build). The
  module's anti-FOUC inline `<head>` script (present and verified — SC#3) runs **before**
  hydration and sets `data-theme` on `<html>`, so Vue's hydration sees an `<html>` attribute that
  wasn't in its SSR vnode → a benign mismatch on the root element's attribute only. This is the
  documented, expected price of FOUC-free theming on static output; the inline script wins before
  paint (no visible flash). It is independent of D1 (the empty placeholder sections render no DOM).
- **Impact on the 1.0 / F3 parity bar:** NONE visually (no FOUC; SC#3 behavioral assertion — dark
  preset paints dark immediately — passes). It is a console-only artifact on the `<html>` element.
- **Handling in 03-05 specs:** the new `tests/parity/{shell,theme}.spec.ts` tolerate exactly this
  one expected color-mode message and fail on any OTHER console error, so a genuine regression is
  still caught. (The Fase 1 `subpath.spec.ts` asserts zero console errors but renders the scaffold,
  with no color-mode consumer mounted, so it is unaffected.)
- **Optional future cleanup (not required for 1.0):** none needed unless the mismatch message is
  considered noise; it cannot be removed without reintroducing FOUC.
