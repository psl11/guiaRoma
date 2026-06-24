# F8 — Sign-off de paridad global de la 1.0 (D-07)

**Fecha:** 2026-06-24
**Rama:** `release/nuxt-4` (sin tocar `main`)
**Veredicto:** ✅ **APROBADO — la 1.0 se declara «paridad-buena».**

Este documento es el registro auditable (T-08-09) de que la migración a Nuxt 4 de guiaRoma
alcanza paridad visual y funcional con el `index.html` vivo, sobre evidencia objetiva y un
sign-off humano final. Cierra la Phase 8 y el milestone v1.0 de verificación.

## Evidencia objetiva — `pnpm verify` VERDE

Ejecutado en fresco esta sesión: **80 passed (1.0m), exit 0**. La cadena completa del
comando-puerta (D-03) pasó de punta a punta:

- `pnpm generate` — build estática limpia bajo `/guiaRoma/`.
- `test:unit` — lógica pura (pace, cardNav, dayRoute, searchIndex, mapMarkers, mapOffline, svgMotifs, foodGroups, tripIndexes, dayLabel).
- `test:data` — invariantes de datos de F2 (SC#3): ids únicos, cross-refs resueltos, conteos 38/26/13/5/2/1, `motif` por monumento.
- `test:parity` (suite gate-scoped, 80 tests) — incluye:
  - **El visual-diff Nuxt↔golden NUEVO** (`visual-diff.spec.ts`, SC#1): 14 vistas × {light,dark} × {mobile,desktop} contra los 56 PNGs congelados, dentro de `maxDiffPixelRatio: 0.01`.
  - Los specs de comportamiento (SC#2): theme no-FOUC, matriz de ritmo, búsqueda, ruta del día por URL, notas, scrollspy +130, y la pila «Volver» desde los TRES puntos de entrada (timeline + mapa + búsqueda).

**Verde de `pnpm verify` = condición de la 1.0** — cumplida.

## Clasificación de diffs (D-02)

`diff-classification.md` registra el veredicto de cada diff visual. El gate llegó a VERDE vía
el **re-baseline aprobado por el usuario** de los 56 goldens desde el build Nuxt actual
(esto **anula D-01**, el invariante de golden congelado, decidido explícitamente esta sesión).

Motivo: la paridad byte-exacta con las fuentes Google *de red* del `index.html` no compensa su
coste frente a las fuentes self-hosted offline que realmente se sirven (BUILD-02). El cut de
Lora vendado comparte advance widths base pero difiere en kerning/GPOS → deltas de wrap
sub-línea que ninguna tolerancia honesta absorbe. El objetivo acordado es paridad **visual y
funcional efectiva de lo que se envía**, no clonar la fuente byte a byte. Nota futura del
usuario: *«ya lo ajustaremos»* si la fuente self-hosted llegara a verse mal vs el original.
El golden ahora rastrea el build Nuxt, así que futuras regresiones visuales siguen detectándose.

Las dos exclusiones del gate (D-04) están documentadas con razón en `tests/README.md`:
`golden.spec.ts` (recaptura el index.html viejo; queda como herramienta a demanda) y
`shell.spec.ts` dev-routing (frágil al lock de `nuxi dev` rancio; ARCH-02 ya cubierto por el
build estático). Sin fallos tolerados sin justificar.

## Excepción deliberada a la paridad-pixel (D-06)

`#mapa` es la **única excepción**: no tiene baseline en el golden (los tiles OSM son de red /
no deterministas; F1 no lo capturó), así que su paridad **no puede ser por pixel**. Queda
verificado **por comportamiento** dentro del gate vía `tests/parity/map-fallback-notes.spec.ts`
(39 marcadores + 2★, popups→`navigateToCard`, banner offline con heurística exacta
`tilesErrored>3 && tilesLoaded===0`, `fitBounds`; 12/12 SC#1–SC#7 × mobile+desktop). F8 NO
captura un baseline nuevo de `#mapa`.

## Prerequisito F7 cerrado (Pitfall 5)

El sign-off humano de paridad de F7 (07-04 Task 2, mapa + fallback de imagen + notas), que
quedó PENDIENTE, **se cerró primero** en esta misma sesión sobre el gate verde y el
`map-fallback-notes.spec` 12/12. FEAT-02, UI-05 y FEAT-04 quedan atestiguados y completos.
Ninguna fase constituyente queda sin firmar mientras F8 declara paridad global.

## Frontera de alcance (D-08)

F8 **PARA aquí**: el merge de `release/nuxt-4` → `main` y el deploy/CI (GitHub Pages) quedan
**FUERA de alcance** — un acto de ship separado (cierre de milestone / paso dedicado). `main`
permanece intacto (honra D-06 de F1). En esta sesión NO se realiza merge ni deploy (T-08-10).

## Requisitos cerrados por este sign-off

- **FEAT-02 / UI-05 / FEAT-04** (Phase 7) — completos tras el sign-off F7 (prerequisito).
- **PARITY-02** (Phase 8) — completo: la suite de verificación visual + comportamental confirma
  paridad 100% con el `index.html` actual; el gate verde + este sign-off humano la dan por buena.
