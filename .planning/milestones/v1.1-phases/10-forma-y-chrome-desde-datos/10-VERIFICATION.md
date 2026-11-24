---
phase: 10-forma-y-chrome-desde-datos
verified: 2026-11-22T22:30:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .planning/phases/10-forma-y-chrome-desde-datos/10-01-PLAN.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-01-SUMMARY.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-02-PLAN.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-02-SUMMARY.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-03-PLAN.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-03-SUMMARY.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-04-PLAN.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-04-SUMMARY.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-05-PLAN.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-05-SUMMARY.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-06-PLAN.md
  - .planning/phases/10-forma-y-chrome-desde-datos/10-06-SUMMARY.md
  - app/app.vue
  - app/components/NavPills.vue
  - app/components/Topbar.vue
  - app/components/TripView.vue
  - app/utils/tripLayout.ts
  - content/trips/forma/trip.yml
  - content/trips/roma/trip.yml
  - shared/schemas.ts
  - tests/data/invariants.spec.ts
  - tests/data/trips.ts
  - tests/trips/romaLeaks.ts
  - tests/trips/shape.spec.ts
covered_digest: "v4:sha256:719b5ec7b2b79a153c53f9d25953f41aac0e0a77bb1e090f42917596ab7989a5"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed:
    - "G-10-2 (UAT test 2): la puerta de datos ve toda forma de enlace que MDC pinta como <a> y exige cada ficha pintada exactamente una vez (10-06)"
    - "Decisiones D-01…D-19 aceptadas por el usuario (UAT test 1)"
    - "Viaje forma sin draft (UAT test 3): superado por la Fase 11, que le puso draft: true"
  gaps_remaining: []
  regressions: []
---

# Phase 10: Forma y chrome desde datos — Informe de verificación

**Objetivo de la fase:** La forma de cada guía (cuántos días, qué secciones y pastillas, qué textos de marca) la deciden los datos de su viaje, y Roma —con sus textos movidos verbatim a su `trip.yml`— se ve idéntica.
**Verificado:** 2026-11-22 (regenerado contra el código ACTUAL, tras las Fases 11–14 parciales, el plan de cierre 10-06 y los arreglos de revisión)
**Estado:** passed
**Re-verificación:** Sí — el informe anterior (2026-11-20, `human_needed`) estaba obsoleto: sus tres ítems humanos ya están resueltos en `10-UAT.md` y 10-06 cerró G-10-2.

## Evidencia ejecutada en esta verificación

| Comprobación | Resultado |
|---|---|
| `npx vitest run tests/unit tests/data` (Node 22.20) | 32 ficheros, **1429/1429** (unit 568 + data 861) |
| `vitest run tests/data/invariants.spec.ts -t "G-10-2"` | 59 pasan (dientes de 10-06: WR-01, WR-03 y advisory MDC) |
| `pnpm verify` del orquestador a HEAD (cachés limpias) | exit 0: unit 568, data 861, paridad **126/126** (56 goldens, sin `--update-snapshots`) |
| Build `.output/public/trips/roma/index.html` (generada 23:21 de hoy) inspeccionada por mí | `<title>Roma · 19—23 giugno 2026</title>`; 12 pastillas en orden; 12 `<section>` (`inicio, mapa, viernes, sabado, domingo, lunes, martes, reservas, gastronomia, practica, arte, arquitectura`); `.brand` = `Roma <span class="brand-dot">✦</span> giugno MMXXVI`; `p.map-legend` con doble espacio; pie con 2 `<br>` y `<em>Pay</em>` |
| `grep FORMA-CENTINELA` en `.output/public` | ningún resultado; solo `trips/campania` y `trips/roma` publicados (forma y prueba no se generan) |
| `git diff f04967a HEAD` sobre `app/assets/css/` | solo 2 ficheros NUEVOS aditivos (`multitrip.css`, `tripshapes.css`, de las Fases 11–12); ningún CSS previo modificado; ningún PNG de golden modificado |
| `verify.artifacts` / `verify.key-links` de los 6 planes | todos `all_passed: true` / `all_verified: true` (5/5·4/4, 6/6·4/4, 4/4·3/3, 4/4·3/3, 4/4·3/3, 4/4·4/4) |
| Marcadores de deuda `TBD`/`FIXME`/`XXX` en los ficheros cubiertos | ninguno |
| `pnpm test:trips` (Playwright sobre dev) | no re-ejecutado (opcional); la evidencia de forma por viaje la cubren el HTML prerenderizado de Roma, `tests/data` y la última pasada completa del informe anterior (17/17) |

## Cumplimiento de los criterios de éxito del ROADMAP

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | Viaje de 10 días con dos sábados: 10 secciones con nombre y fecha, 10 pastillas distintas que llevan a su día; Roma con sus 5 días `#viernes…#martes` | ✓ VERIFIED | `buildTripLayout` (`app/utils/tripLayout.ts:84-93`) emite una entrada `kind: 'day'` por día recibido, con `id = slug` y etiqueta `pill` o `dayLabel(eyebrow)` (`dayPillLabel`, l.78). `TripView.vue:81-88` calcula el layout una vez y `v-for="e in layout"` monta las `<section>`; el mismo `layout` va a `Topbar → NavPills`. `content/trips/forma/days/` aporta los 10 días (`sabado-19`/`sabado-26`, etc.); `tests/trips/shape.spec.ts` (l.124-170) asevera 10 secciones en orden y 10 pastillas distintas con navegación. Roma: 5 días `viernes…martes` en el HTML prerenderizado |
| 2 | Sin datos para sección opcional → ni sección ni pastilla; Roma con 12 pastillas en el mismo orden | ✓ VERIFIED | Presencia por datos en `buildTripLayout` (Reservas/Gastronomía/Práctica/Arte/Arquitectura solo si hay datos); `TripView` pasa `hasReservas`, `hasPractica`, `foodCount`, `artistKinds` desde `useTrip`. `shape.spec.ts:103` (forma sin Arte/Arquitectura/Reservas/Práctica) y `:172` (prueba solo Inicio, Mapa y 2 días). Roma: las 12 pastillas del HTML prerenderizado coinciden con el orden verbatim |
| 3 | Marca, pie y leyenda salen de `trip.yml`; pestaña con título propio; Roma = textos actuales | ✓ VERIFIED | `content/trips/roma/trip.yml:79-92` (`pageTitle`, `brand`, `mapLegend`, `footer`, comentadas con las líneas de `index.html`); esquema aditivo opcional en `shared/schemas.ts:521-528`. `TripView.vue:94` `useHead({ title })`, `:156` `trip.mapLegend`, `:277-299` pie desde `trip.footer`; `Topbar.vue:35-42` marca desde `brand` con respaldo `fallbackTitle`; `app/app.vue:20,42` ya no fija `<title>`. Build inspeccionada: textos idénticos a los de `index.html`. Superseded-not-regression: el `<footer>` de Roma ahora lleva además `p.trip-back` «← Todos los viajes» (Fase 11, ROUTE-06, aprobado) fuera de `.container`, sin tocar el `p` original |
| 4 | En la guía de un viaje de prueba no aparece texto propio de Roma; test-trampa | ✓ VERIFIED | `tests/trips/romaLeaks.ts` + `shape.spec.ts:235-284` (todos los viajes no-Roma descubiertos por directorio, con control positivo en Roma); guardián estático D-17 sobre `app/**`. Respaldo neutro D-14: sin `brand` la marca es `plainTitle`, sin `mapLegend`/`footer` no se renderizan (`v-if`). El HTML de `trips/campania` publicado es otro viaje real; el viaje `forma` (draft) ya no sale de la build |
| 5 | Paridad verde en `/` con los 56 goldens sin re-baseline | ✓ VERIFIED (superseded en URL) | Roma pasó a `/trips/roma/` en la Fase 11 (ROUTE-01, aprobado); los 56 goldens siguen sin tocar (ningún PNG cambia desde `f04967a`) y `pnpm verify` del orquestador da paridad 126/126 sin `--update-snapshots`. El espíritu del criterio —Roma idéntica tras mover los textos a datos— se mantiene en la URL actual |

**Score:** 5/5 verdades verificadas, 0 PRESENT_BEHAVIOR_UNVERIFIED.

### Verdades de los planes y cierre de G-10-2 (10-06)

- `scanProseLinks` (`tests/data/trips.ts:366`) ve las formas de enlace que MDC pinta como `<a>` (espacio/salto tras `(`, destino `<…>`, autoenlaces, emails) y rechaza las formas prohibidas (definiciones de referencia, `<a>` crudo, props/atributos MDC `href`/`to`); `hasLink` y `extractAnchors` pasan por él. Los arreglos de revisión posteriores (CR-01/02/03, WR-01/02: `d208686`, `db113ce`, `6ac4a2d`, `c7e36f2`, `4025613`) solo tocan `tests/data/trips.ts`, `invariants.spec.ts` y `tests/README.md`.
- Regla `card-placement` (`trips.ts:487-516`): `renderedMonuments` = unión de `days[*].cards`; cada ficha exactamente una vez, y `anchor`/`seenIn`/`ref` solo a fichas pintadas. El 10-06-SUMMARY lo corrobora con mutaciones en disco; yo he re-ejecutado los 59 tests `G-10-2` en verde y los 861 de la puerta de datos.
- Orden D-07, presencia D-08, `DAY_SLUG_RE`/`pill`, campos de chrome `.optional()` y `pageTitle` con `min(1)`: sin cambios respecto a la verificación previa y siguen cubiertos por `tests/unit` y `tests/data` en verde.

### Prohibiciones (tier `judgment`)

| Prohibición | Estado | Evidencia |
|---|---|---|
| No tocar `tests/parity/` ni `app/assets/css/` existentes, no `--update-snapshots`, no CSS/`<style scoped>` nuevo en la fase | ✓ respetada | Los cambios posteriores en `tests/parity/` y los dos CSS aditivos son de las Fases 11–12 (aprobadas); ningún golden ni CSS previo se modifica; sin `<style` en TripView/NavPills/Topbar |
| La app no enlaza `/trips/*` desde la prosa de datos | ✓ respetada | lista blanca D-05b ahora sin fail-open (10-06 + fixes); el enlace a la portada del pie lo añade la UI, no los datos |
| Ningún viaje muestra texto de Roma por defecto | ✓ respetada | respaldo = `inlineMdToPlain(trip.title)` o no renderizar |
| La puerta de datos no se relaja ni se edita el YAML para acomodarla | ✓ respetada | 10-06 endurece la puerta sin tocar `content/` |

### Cobertura de requisitos

| Requisito | Planes | Estado | Evidencia |
|---|---|---|---|
| SHAPE-01 | 10-01, 10-03, 10-04, 10-06 | ✓ SATISFIED | criterio 1 |
| SHAPE-02 | 10-01, 10-03, 10-04, 10-06 | ✓ SATISFIED | criterio 2 |
| SHAPE-03 | 10-02, 10-05 | ✓ SATISFIED | criterio 3 |
| SHAPE-04 | 10-02, 10-05 | ✓ SATISFIED | criterio 3 (título por viaje vía `useHead`) |
| SHAPE-05 | 10-02, 10-04, 10-05 | ✓ SATISFIED | criterio 4 |

Los 5 IDs de REQUIREMENTS.md (`[x]` / Complete) aparecen en el frontmatter de algún PLAN. Sin requisitos huérfanos.

### Flujo de datos (nivel 4)

`useTrip(slug)` → `days/food/artists/refById/trip` → `buildTripLayout` → `<main>` y `NavPills`; `trip.brand/footer/mapLegend/pageTitle` → `Topbar`/`TripView`/`useHead`. El HTML prerenderizado de Roma ya contiene los valores reales. FLOWING.

### Anti-patrones y revisión de código

`10-REVIEW-DISPOSITION.md`: CR-01..03, WR-01..03 `fixed`; IN-02..IN-06 `deferred` por decisión del usuario en `10-UAT.md · Deferred Follow-Ups`; **IN-01** (`card-placement` duplica violaciones cuando dos ficheros comparten slug) sigue `open`: es informativo, solo afecta al número de líneas de un mensaje de error de la puerta, no incumple ninguna verdad y no es bloqueante. WR-02 original (`inlineMdToPlain` con énfasis anidado) está diferido y es latente (todos los viajes reales definen `pageTitle`/`brand`). Sin `TBD/FIXME/XXX`, sin stubs.

### Verificación humana

Ninguna pendiente. Los tres ítems del informe anterior están resueltos en `10-UAT.md` (tests 1 y 3 `pass`; test 2 convertido en G-10-2 y cerrado por 10-06). La validación visual final de Roma/Campania en móvil real pertenece a la Fase 14.

## Resumen

El objetivo se cumple en el código actual: la forma (días, secciones, pastillas) y el chrome (marca, leyenda, pie, pestaña) salen de los datos de cada viaje por una función pura compartida; Roma se renderiza con sus textos verbatim (comprobado en la build de hoy), los 56 goldens siguen intactos y la puerta de datos (1429 tests unit+data, paridad 126/126 según `pnpm verify`) está verde, ya sin los huecos fail-open de enlaces y colocación de fichas (G-10-2). Las diferencias respecto al plan original (Roma en `/trips/roma/`, `p.trip-back` en el pie, `forma` con `draft: true`) son evolución legítima de la Fase 11 y no regresiones. No hay gaps ni ítems humanos.

---

_Verificado: 2026-11-22_
_Verificador: Claude (gsd-verifier)_
