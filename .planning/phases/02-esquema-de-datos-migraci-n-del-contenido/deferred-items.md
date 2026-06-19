# Deferred Items — Phase 02

Out-of-scope discoveries logged during plan execution. NOT fixed here; tracked for the
owning plan.

## From Plan 06 (migración gastronomía)

- **invariants.spec: 3 fallos por colección `artists` aún no migrada.**
  - Tests rojos: `monument.artists[].ref → artist(kind:artist)`,
    `monument.arch[].ref → artist(kind:arquitectura)`,
    `cada [texto](#id) de cualquier campo resuelve a un slug existente`.
  - Causa: los monumentos (Planes 04/05) referencian anclas `#art-*` / `#arq-*` que viven
    en `content/trips/roma/artists/` — directorio que todavía no existe (lo crea el plan de
    Wave 3 que migra artists/arquitectura/glosario, 13 fichas).
  - NO causado por el plan 06: ninguna ficha de `food` aparece en los fallos; el test
    `reservas.table[].ref → food` y `timeline[stop|food].ref → … | food` están en VERDE.
  - Resolución esperada: automática al ejecutar el plan de migración de `artists`.
    Re-ejecutar `pnpm exec vitest run tests/data/invariants.spec.ts` tras ese plan.
