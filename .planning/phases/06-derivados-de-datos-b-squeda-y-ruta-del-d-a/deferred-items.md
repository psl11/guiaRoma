# Deferred Items — Phase 06

Out-of-scope discoveries during execution. NOT fixed here (scope boundary: only auto-fix issues
directly caused by the current task's changes).

## Pre-existing full-suite failures (observed during 06-05 Task 1)

When running the WHOLE `pnpm test:golden` suite (not the new `search-route.spec.ts`, which passes
10/10), 5 failures appear. All are PRE-EXISTING and already acknowledged as deferred in STATE.md
(Fase 5 P03 close). They are NOT caused by `tests/parity/search-route.spec.ts`:

| # | Test | Failure | Disposition |
|---|------|---------|-------------|
| 1-4 | `golden.spec.ts` golden light/dark × mobile/desktop | Pixel-diff against the live `index.html` webServer (received `1264×714` vs expected `1280×1576` — the served `index.html` did not fully render images). | Documented golden-light pixel flake → **Phase 8** (visual-diff total). |
| 5 | `shell.spec.ts:224` `/trips/[slug]` dev-routing (ARCH-02) | `Server no respondió en http://localhost:5200/guiaRoma/` (fetch failed) — blocked by a stale `nuxi dev` lock. | Documented "shell dev test bloqueado por lock de nuxi dev rancio" → carried forward. |

The new `search-route.spec.ts` is self-contained (its own build+serve under `/guiaRoma/`, port
5740) and passes independently (`npx playwright test tests/parity/search-route.spec.ts` → 10 passed).
