---
phase: 11-portada-y-rutas-multi-viaje
verified: 2026-11-23T11:00:00Z
status: passed
score: 6/6 must-haves verified
covered_files:
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-01-PLAN.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-01-SUMMARY.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-02-PLAN.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-02-SUMMARY.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-03-PLAN.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-03-SUMMARY.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-04-PLAN.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-04-SUMMARY.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-05-PLAN.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-05-SUMMARY.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-06-PLAN.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-06-SUMMARY.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-07-PLAN.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-07-SUMMARY.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-08-PLAN.md"
  - ".planning/phases/11-portada-y-rutas-multi-viaje/11-08-SUMMARY.md"
  - "app/assets/css/multitrip.css"
  - "app/components/TripIndex.vue"
  - "app/components/TripView.vue"
  - "app/pages/index.vue"
  - "app/pages/trips/[slug].vue"
  - "app/utils/tripDates.ts"
  - "content.config.ts"
  - "content/trips/roma/trip.yml"
  - "nuxt.config.ts"
  - "scripts/tripManifest.mjs"
  - "shared/schemas.ts"
  - "tests/data/invariants.spec.ts"
  - "tests/data/trips.ts"
  - "tests/parity/_harness.ts"
  - "tests/parity/legacy-redirect.spec.ts"
  - "tests/parity/portada.spec.ts"
  - "tests/parity/shell.spec.ts"
  - "tests/unit/tripIndexFatal.spec.ts"
covered_digest: "v4:sha256:7b4de19eab04a3bea0e514b523746fce677a19cf8708696d15f0dadcf007d5d2"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed:
    - "G-11-3 (UAT test 3): un summary con Markdown de bloque rompe la tarjeta y un fallo de la consulta de la portada publica una portada vacía con 200 (WR-02 + WR-03 del primer 11-REVIEW)"
    - "Los 3 elementos de verificación humana del informe anterior (aspecto en móvil, decisiones --auto, disposición de WR-01..03): UAT tests 1 y 2 aprobados por el usuario, test 3 resuelto por 11-08"
  gaps_remaining: []
  regressions: []
---

# Phase 11: Portada y rutas multi-viaje Verification Report

**Phase Goal:** El usuario entra por una portada que lista los viajes publicados y llega a cada guía en su propia URL estática; los enlaces antiguos de Roma siguen funcionando y Roma, en su nueva URL, pasa la puerta de paridad sin re-baseline
**Verified:** 2026-11-23T11:00:00Z
**Status:** passed
**Re-verification:** Sí — tras el cierre de G-11-3 (plan 11-08) y las correcciones de la revisión de código (CR-01, WR-01, WR-02)

## Goal Achievement

Los cinco criterios de éxito del ROADMAP y la verdad añadida por el gap 11-08 están respaldados por código real y por pruebas que ejercitan el comportamiento. El informe anterior (`human_needed`) quedó pendiente de tres decisiones humanas; las tres están resueltas en `11-UAT.md`: tests 1 y 2 aprobados por el usuario (2026-11-22 y 2026-11-23) y test 3 dio el gap G-11-3, ahora cerrado. Ya no queda ningún elemento humano abierto.

### Observable Truths

| # | Truth (ROADMAP SC / gap 11-08) | Status | Evidencia |
|---|--------------------------------|--------|-----------|
| 1 | `/guiaRoma/` muestra una portada con una tarjeta por viaje publicado (título, fechas, destinos, resumen) que lleva a su guía; un `draft` ni aparece ni genera página | ✓ VERIFIED | `.output/public/index.html` (build de las 09:50, posterior al último commit de código `7021b8a`): `<title>Guías de viaje</title>` y dos `<a class="trip-index-card">` → `/guiaRoma/trips/campania/` y `/guiaRoma/trips/roma/` (Campania ya está publicada desde la Fase 13, sin `draft`). `.output/public/trips/` contiene solo `campania` y `roma`. `content/trips/{prueba,forma}/trip.yml` tienen `draft: true`; el `sql_dump` decodificado (gunzip+base64) de la colección `trip` solo contiene `campania` y `roma` y no contiene `PRUEBA-CENTINELA` ni `FORMA-CENTINELA` (comprobado por mí). Dos reglas de aserto en `portada.spec.ts` (borradores dan 404) en verde. |
| 2 | Roma en `/guiaRoma/trips/roma/` y cada viaje publicado en `/trips/<slug>/`, como páginas estáticas que cargan sin `sql_dump` ni WASM | ✓ VERIFIED | `nuxt.config.ts` deriva `nitro.prerender.routes` de `prerenderRoutes(readTripManifest())` con `failOnError: true`. Existe `.output/public/trips/roma/index.html`; `grep sql_dump` sobre `index.html`, `trips/roma/index.html` y ambos `_payload.json` no encuentra nada. `portada.spec.ts` («ni la portada ni Roma piden sql_dump ni WASM») pasa en mi ejecución. |
| 3 | Un enlace antiguo (`/#viernes`, `/#pantheon`, `/index.html#gastronomia`) lleva a la misma ancla en `/trips/roma/`, «Atrás» no hace bucle y `/guiaRoma/` sin hash se queda | ✓ VERIFIED | Script crítico en el `<head>` del HTML construido: `location.replace("/guiaRoma/trips/roma/"+h)` con hash validado por `^#[a-z0-9-]+$`. `legacy-redirect.spec.ts` ejecutado por mí: todos los casos desktop+mobile en verde (aterrizaje idéntico a carga directa, «Atrás» en una pulsación, hash vacío/inválido se queda, servidor tipo Pages con 301 que conserva el hash). |
| 4 | Desde cualquier guía se vuelve a la portada con el enlace que decida el usuario (ROUTE-06, D-01) | ✓ VERIFIED | `.output/public/trips/roma/index.html`: `<p class="trip-back"><a href="/guiaRoma/">← Todos los viajes</a></p></footer>` con la base del runtime. Test de `portada.spec.ts` verde. Confirmado por el usuario en UAT test 1. |
| 5 | En `/trips/roma/` los 56 goldens pasan sin `--update-snapshots` y la suite de comportamiento de Roma sigue verde; un test asevera que `/` sirve la portada y la URL de Roma sirve Roma | ✓ VERIFIED | `git diff 6315f26 HEAD -- golden.spec.ts snapshots package.json pnpm-lock.yaml app/assets/css/{base,tokens,fonts,leaflet}.css` está vacío; `content/trips/roma/` solo difiere en `trip.yml` (+9 líneas de datos de la tarjeta, plan 11-04). Ejecutado por mí contra la build: `visual-diff.spec.ts` 4/4 y `shell.spec.ts` + `portada.spec.ts` + `legacy-redirect.spec.ts` 36 passed / 2 skipped (los 2 omitidos son el routing dev-only de ARCH-02, excluido del gate por D-04). `git status` queda limpio tras correrlos (ningún snapshot reescrito). Evidencia del orquestador: parity 125/126 con el único fallo en el flake conocido (ver Spot-Checks). |
| 6 | (Gap G-11-3 / 11-08) La tarjeta nunca rompe la hidratación ni se publica vacía: un `summary` con Markdown de bloque hace fallar la puerta nombrando `trip.yml`, y un fallo de la consulta de la portada en el prerender hace fallar la build | ✓ VERIFIED | (a) `tests/data/trips.ts`: `SUMMARY_BLOCK_FORMS` (lista, cita, tabla, código, separador, línea en blanco, `::x`, componente MDC en línea) + `normEol` (CR/CRLF) + blanco CommonMark; `summaryBlockForms` devuelve `[]` si `hasLink` (sin doble aviso); la regla `trip-summary-inline` está en `RULES` (línea 133) y empuja una violación con `d.file` (trip.yml). `vitest run tests/unit/tripIndexFatal.spec.ts tests/data/invariants.spec.ts`: 305 passed (re-ejecutado por mí). (b) `TripIndex.vue`: `const { data, error } = await useAsyncData(...)`; `if (error.value) throw createError({ statusCode: 500, statusMessage: 'No se pudo cargar la lista de viajes', fatal: true, cause })`; `git diff 0f7843c HEAD` solo toca el bloque `<script setup>` y comentarios (la plantilla es idéntica). **Prueba de comportamiento mía:** copia del repo en un directorio temporal (se borró; el árbol no se tocó) con `.select('columnaQueNoExiste', …)` → `nuxi generate` sale con `EXIT=1` y el log contiene `[500] No se pudo cargar la lista de viajes`, `no such column` y `Exiting due to prerender errors`. |

**Score:** 6/6 truths verified (0 present-but-behavior-unverified)

Las verdades de comportamiento (redirección sin bucle, borradores en 404, sin `sql_dump`/WASM, la build que falla ante un error de consulta) tienen cada una evidencia ejecutada, no solo presencia de símbolos.

### Deferred Items

Ninguno. (La URL `/trips/campania/` de ROUTE-02 se entregó en la Fase 13: la build ya la genera y la portada la lista.)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/TripIndex.vue` | Portada con tarjeta por viaje publicado y error fatal si la consulta falla | ✓ VERIFIED | Datos reales vía `queryCollection('trip')`; `error` convertido en `createError` fatal; plantilla sin cambios desde 0f7843c; sin `id`, sin chrome de viaje |
| `app/pages/index.vue` | Portada + script de redirección legacy | ✓ VERIFIED | Script `critical` en head, visible en el HTML construido |
| `app/pages/trips/[slug].vue` | Guía por slug, clave por slug, 404 | ✓ VERIFIED | `trips/roma/` y `trips/campania/` generados |
| `app/components/TripView.vue` | Pie con «← Todos los viajes» | ✓ VERIFIED | Presente en el HTML de Roma |
| `scripts/tripManifest.mjs` | Manifiesto draft + rutas de prerender | ✓ VERIFIED | Alimenta `content.config.ts` y `nuxt.config.ts`; borradores fuera de build y de `sql_dump` |
| `shared/schemas.ts` | `draft`, `startDate`, `endDate`, `destinations`, `summary` | ✓ VERIFIED | Roma y Campania los consumen |
| `app/assets/css/multitrip.css` | Estilos de la portada bajo `.trip-index` | ✓ VERIFIED | `base/tokens/fonts/leaflet.css` sin cambios |
| `app/utils/tripDates.ts` | Fechas, orden y lista publicada | ✓ VERIFIED | Usado por `TripIndex.vue` |
| `tests/data/trips.ts` + `invariants.spec.ts` | Regla `trip-summary-inline` con dientes | ✓ VERIFIED | RULES = 23; dientes de CR-01/WR-01/WR-02 incluidos |
| `tests/unit/tripIndexFatal.spec.ts` | Guardián estático del error fatal de la portada | ✓ VERIFIED | 7 tests en verde |
| `tests/parity/_harness.ts`, `portada.spec.ts`, `legacy-redirect.spec.ts` | Harness y specs nuevos | ✓ VERIFIED | Ejecutados por mí, verdes |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `nuxt.config.ts` | `scripts/tripManifest.mjs` | `prerenderRoutes(readTripManifest())` | WIRED | `trips/roma` y `trips/campania` existen; borradores no |
| `content.config.ts` | `scripts/tripManifest.mjs` | `draftExcludes(...)` | WIRED | `sql_dump` sin centinelas de borradores |
| `pages/index.vue` | `TripIndex.vue` | `<TripIndex />` | WIRED | HTML construido contiene la portada |
| `TripIndex.vue` | colección `trip` | `useAsyncData('trips-index', queryCollection('trip').select(...))` | WIRED | Tarjetas con datos reales del payload |
| `TripIndex.vue` | `nuxt.config.ts` | `createError` fatal 500 → `nitro.prerender.failOnError: true` | WIRED | Demostrado con el fallo forzado: `generate` sale con 1 |
| `tests/data/invariants.spec.ts` | `tests/data/trips.ts` | `checkTrip(memTrip(…, { summary }))` | WIRED | 305 tests en verde |
| tarjeta de la portada | `/guiaRoma/trips/<slug>/` | `<a href>` de documento completo con la base del runtime | WIRED | Comprobado en el HTML |
| script de redirección | `/guiaRoma/trips/roma/#ancla` | `location.replace(base+'trips/roma/'+hash)` | WIRED | Probado E2E con 301 estilo Pages |
| pie de la guía | portada | `<a :href="homeHref">` | WIRED | Comprobado en el HTML |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `TripIndex.vue` | `data` → `cards` | `queryCollection('trip')` prerenderizado en el payload | Sí: las dos tarjetas (Campania, Roma) salen de sus `trip.yml` | ✓ FLOWING |
| `TripView.vue` (pie) | `homeHref` | `useRuntimeConfig().app.baseURL` | Sí: `/guiaRoma/` | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Redirección legacy, portada, shell (desktop+mobile) | `playwright test -c playwright.gate.config.ts tests/parity/{legacy-redirect,portada,shell}.spec.ts` (Node 22, build existente) | 36 passed, 2 skipped (dev-routing excluido, D-04) | ✓ PASS |
| 56 goldens (visual-diff nuxt↔golden en la URL nueva) | `playwright test -c playwright.gate.config.ts tests/parity/visual-diff.spec.ts` | 4 passed; árbol limpio después | ✓ PASS |
| Puerta de datos y guardián de la portada | `vitest run tests/unit/tripIndexFatal.spec.ts tests/data/invariants.spec.ts` | 305 passed | ✓ PASS |
| Un fallo de la consulta de la portada rompe `generate` | copia temporal + `.select('columnaQueNoExiste', …)` + `nuxi generate` | `EXIT=1`; `[500] No se pudo cargar la lista de viajes`; `Exiting due to prerender errors` | ✓ PASS |
| `sql_dump` de `trip` sin borradores | gunzip+base64 con Node | solo `campania`, `roma`; sin centinelas | ✓ PASS |
| Ficheros congelados sin cambios | `git diff 6315f26 HEAD -- golden.spec.ts snapshots package.json pnpm-lock.yaml css/{base,tokens,fonts,leaflet}` | vacío | ✓ PASS |
| `pnpm test:unit` / `pnpm test:data` | evidencia del orquestador (esta sesión) | 575 / 927 passed | ✓ PASS (evidencia aportada) |
| Suite de paridad completa | evidencia del orquestador | 125/126; único fallo: «SC#2 [mobile] scrollspy» de `tests/parity/navigation.spec.ts` | ⚠️ FLAKE CONOCIDO, no es un gap |

**Flake reportado (no gap):** `navigation.spec.ts` «SC#2: el scrollspy conmuta la pastilla en scrollY+130» [mobile] falla de forma intermitente (esperaba `#sabado`, recibió `#viernes`). Pasa 18/18 en aislamiento tanto en un commit anterior como en HEAD (según el orquestador y 11-08-SUMMARY, que repitió `pnpm verify` y obtuvo 126/126). Es un spec de Roma que no toca nada de lo que cambió la Fase 11; se documenta, no se excluye.

### Probe Execution

Step 7c: SKIPPED — la fase no declara probes (`scripts/*/tests/probe-*.sh`); la verificación son specs de Playwright/Vitest ejecutados arriba.

### Requirements Coverage

Los 8 IDs de la fase (ROUTE-01..06, PAR-01, PAR-02) están declarados en los PLAN (11-01..11-08) y mapeados a Phase 11 en REQUIREMENTS.md, todos marcados `[x]` / Complete. Sin IDs huérfanos (PAR-03/PAR-04 son de la Fase 14).

| Requirement | Source Plan | Description | Status | Evidencia |
|-------------|-------------|-------------|--------|-----------|
| ROUTE-01 | 11-04, 11-05, 11-07, 11-08 | Portada con tarjeta por viaje publicado | ✓ SATISFIED | Truths 1 y 6; HTML de `/` |
| ROUTE-02 | 11-02, 11-03 | Roma en `/guiaRoma/trips/roma/`, Campania en `/trips/campania/` | ✓ SATISFIED | Truth 2; ambas rutas generadas |
| ROUTE-03 | 11-06 | `/#ancla` → `/trips/roma/#ancla` sin bucle | ✓ SATISFIED | Truth 3 |
| ROUTE-04 | 11-03, 11-07 | Páginas estáticas sin `sql_dump`/WASM | ✓ SATISFIED | Truth 2 |
| ROUTE-05 | 11-02, 11-05, 11-07 | `draft` no aparece ni se publica | ✓ SATISFIED | Truth 1 |
| ROUTE-06 | 11-03, 11-07 | Volver a la portada desde cualquier guía | ✓ SATISFIED | Truth 4 |
| PAR-01 | 11-01, 11-03, 11-05, 11-08 | 56 goldens sin re-baseline | ✓ SATISFIED | Truth 5; visual-diff 4/4, snapshots intactos |
| PAR-02 | 11-01, 11-03, 11-05, 11-08 | Suite de comportamiento de Roma en verde | ✓ SATISFIED | Truth 5; flake documentado |

### Anti-Patterns Found

Sin `TBD/FIXME/XXX` en los ficheros de código modificados por la fase. Revisión de código: CR-01, WR-01 y WR-02 (incrementales sobre 11-08) corregidos en 65476f1, 4f63ba1, 8129e48; WR-03 del primer review corregido por 11-08. Quedan solo hallazgos informativos.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/data/trips.ts` | 409-ss | Escaneo léxico con falsos rojos conocidos y documentados (`Roma:texto`, `Texto\n2027. …`, continuación con sangría) | ℹ️ Info | Fail-closed deliberado: nunca un falso verde |
| `11-REVIEW.md` | — | IN-01..IN-03 (`open`), IN-04..IN-06 (`deferred`) | ℹ️ Info | Higiene, sin efecto en el goal; el usuario difirió los de 11-UAT y los tres nuevos de la revisión no afectan a ningún must-have |

### Human Verification Required

Ninguna. Los tres elementos del informe anterior están resueltos en `11-UAT.md` (tests 1 y 2: pass; test 3: gap G-11-3, cerrado por 11-08 con pruebas automáticas que reproducen y cierran el fallo, incluido un fallo forzado de la build verificado de nuevo en esta pasada).

### Gaps Summary

No hay gaps. Los cinco criterios de éxito del ROADMAP y el cierre de G-11-3 están implementados, cableados y demostrados con pruebas que ejercitan el comportamiento. Observación de bookkeeping no bloqueante: `11-REVIEW-DISPOSITION.md` marca `open: 3` (IN-01..IN-03, info, fuera del alcance `critical_warning` del fixer); conviene triarlos o diferirlos al cerrar la fase.

---

_Verified: 2026-11-23T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
