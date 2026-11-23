# Deferred / Out-of-Scope Items — Phase 05

Items discovered during execution that are NOT caused by this phase's changes and are out of
scope per the executor SCOPE BOUNDARY rule. Logged, not fixed.

## From Plan 05-03 (full `pnpm test:golden` run)

Two specs fail in the FULL suite due to pre-existing / environmental conditions, independent of
the 05-03 changes (`tests/parity/navigation.spec.ts` + the capture-phase fix in
`app/composables/useCardNavigation.ts`). Both were reproduced/explained:

1. **`tests/parity/golden.spec.ts:72 — golden light` (desktop) — FLAKE (pixel snapshot)**
   - The golden serves the LIVE `index.html` (`page.goto('/index.html')` via the config webServer),
     so it does not exercise any Nuxt code changed in 05-03.
   - **Passes cleanly in isolation** (`pnpm test:golden tests/parity/golden.spec.ts` → 4/4). Only
     `dia-viernes-light-desktop.png` flakes, and only under parallel load (lazy-image swap + font
     rendering nondeterminism). `[mobile] golden light` and both `golden dark` pass in the same run.
   - Action: none. Pre-existing snapshot flakiness; the Fase 8 pixel-parity pass owns golden
     stability. Re-run in isolation to confirm green.

2. **`tests/parity/shell.spec.ts:224 — routing dinámico /trips/[slug] (vía dev)` — ENVIRONMENTAL**
   - The test spawns a fresh `pnpm dev` (Nuxt dev server) on port 5200 and waits 120s.
   - It fails because **stale `nuxi dev` processes from a prior session are already running**
     (observed PIDs 40900 / 59568 / 85794 / 86342, started Jun 20) and hold Nuxt 4's dev lock
     (`#acquireDevLock` → "Another Nuxt dev server is already running"). A second `nuxi dev` cannot
     start, so `waitForServer` times out.
   - Not caused by 05-03 (which only changes client runtime behavior + adds a test). NOT fixed:
     killing the running dev servers could terminate the user's active session (destructive).
   - Suggested latent hardening (future, optional): pass `NUXT_IGNORE_LOCK=1` in that test's
     `spawn(... env)` so it is robust to a co-running dev server. Left for the test owner.

All other parity specs (render-cards, render-timeline, render-reference, modes, theme, shell static,
subpath) and the new `navigation.spec.ts` pass. `pnpm test:unit` (43), `pnpm typecheck`, `pnpm lint`
are green.
