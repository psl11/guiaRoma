---
phase: 11-portada-y-rutas-multi-viaje
verified: 2026-11-20T22:00:00Z
status: human_needed
score: 5/5 must-haves verified
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
  - "app/assets/css/multitrip.css"
  - "app/components/TripIndex.vue"
  - "app/components/TripView.vue"
  - "app/pages/index.vue"
  - "app/pages/trips/[slug].vue"
  - "content.config.ts"
  - "content/trips/roma/trip.yml"
  - "nuxt.config.ts"
  - "scripts/tripManifest.mjs"
  - "shared/schemas.ts"
  - "tests/parity/_harness.ts"
  - "tests/parity/legacy-redirect.spec.ts"
  - "tests/parity/portada.spec.ts"
  - "tests/parity/shell.spec.ts"
covered_digest: "v4:sha256:9bdd16b644f5d134a42c8acdcaad3785aefbbdf67a11b094086bf9a12a94ce32"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Abrir la portada (/guiaRoma/) en un móvil real, en tema claro y en tema oscuro, y pulsar la tarjeta de Roma"
    expected: "La tarjeta (título, fechas, destino, resumen) se lee bien, respeta el tema guardado, el contraste es correcto y la tarjeta lleva a /guiaRoma/trips/roma/. Los tests solo comprueban que no desborda a 375 px y que respeta el tema; no juzgan el aspecto."
    why_human: "Aspecto visual y 'tacto' de la portada: no hay golden de la portada (no existía en la guía viva) y la valoración editorial es subjetiva. 11-UI-REVIEW dio 21/24."
  - test: "Revisar las decisiones tomadas en modo --auto (D-06..D-23 de 11-CONTEXT.md: sin imagen en tarjetas, orden por fecha descendente, texto de fechas «19–23 de junio de 2026», título «Guías de viaje», estado vacío, enlace «← Todos los viajes» dentro del pie, etc.) y confirmarlas o corregirlas"
    expected: "El usuario las acepta tal cual, o indica cuáles cambiar. Solo ROUTE-06 (D-01) fue decidida en persona."
    why_human: "El propio CONTEXT.md declara que son opciones recomendadas elegidas por Claude, pendientes de confirmar en /gsd-verify-work 11."
  - test: "Decidir qué hacer con los 3 warnings abiertos de 11-REVIEW.md (WR-01, WR-02, WR-03; disposition: open)"
    expected: "Decisión explícita: arreglar ahora (fase de cierre/gap), diferir a Fase 12-13, o aceptar. Ninguno rompe la build ni la portada con los datos actuales (el resumen de Roma está limpio), pero son agujeros en las garantías de la puerta de datos y de la portada."
    why_human: "Es una decisión de alcance/riesgo del usuario, no una comprobación automática. Ver «Anti-Patterns Found»."
---

# Phase 11: Portada y rutas multi-viaje Verification Report

**Phase Goal:** El usuario entra por una portada que lista los viajes publicados y llega a cada guía en su propia URL estática; los enlaces antiguos de Roma siguen funcionando y Roma, en su nueva URL, pasa la puerta de paridad sin re-baseline
**Verified:** 2026-11-20T22:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

Los cinco criterios de éxito del ROADMAP están respaldados por código real y por pruebas que ejercitan el comportamiento (no solo presencia). No hay FAILED ni UNCERTAIN en los must-haves. El estado es `human_needed` solo porque quedan tres elementos que requieren decisión o juicio humano (aspecto de la portada en móvil real, decisiones tomadas en `--auto`, warnings de revisión abiertos), no porque falte nada observable.

### Observable Truths

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|--------------------|--------|----------|
| 1 | `/guiaRoma/` muestra una portada con una tarjeta por viaje publicado (título, fechas, destinos, resumen) que lleva a su guía; un `draft` ni aparece en la portada ni genera página | ✓ VERIFIED | `.output/public/index.html` (inspeccionado): `<title>Guías de viaje</title>`, `<h1>`, un único `<a class="trip-index-card" href="/guiaRoma/trips/roma/">` con `<h2>Cinque giorni a Roma</h2>`, meta «19–23 de junio de 2026 · Roma» y resumen. `app/components/TripIndex.vue` consulta solo la colección `trip` y filtra con `listedTrips` (también en dev). `.output/public/trips/` contiene solo `roma/`. `content/trips/{prueba,forma}/trip.yml` tienen `draft: true`; los 3 `sql_dump` de `__nuxt_content/trip` decodificados solo contienen `trips/roma/trip.yml` y ninguno de los centinelas `PRUEBA-CENTINELA`/`FORMA-CENTINELA` (comprobado por mí con Node). Tests: `portada.spec.ts` (borradores dan 404), `build-isolation.spec.ts`, `shell.spec.ts` (portada vs Roma). |
| 2 | Roma en `/guiaRoma/trips/roma/` y cada viaje publicado en `/trips/<slug>/`, como páginas estáticas que cargan sin `sql_dump` ni WASM | ✓ VERIFIED | `nuxt.config.ts` deriva `nitro.prerender.routes` de `prerenderRoutes(readTripManifest())` (`scripts/tripManifest.mjs`), con barra final y `failOnError: true`. Existe `.output/public/trips/roma/index.html` y su `_payload.json`; ni `index.html` ni los `_payload.json` mencionan `sql_dump`. `portada.spec.ts:136` («ni la portada ni Roma piden sql_dump ni WASM») pasa — lo ejecuté yo (ver spot-checks). |
| 3 | Un enlace antiguo (`/#viernes`, `/#pantheon`, `/index.html#gastronomia`) lleva a la misma ancla en `/trips/roma/` y «Atrás» no hace bucle; `/guiaRoma/` sin hash se queda en la portada | ✓ VERIFIED | `app/pages/index.vue`: script inline en `<head>` con `tagPriority: 'critical'`; en el HTML construido aparece antes del primer `<link rel="stylesheet">`: `if(/^#[a-z0-9-]+$/.test(h)){location.replace("/guiaRoma/trips/roma/"+h)}`. `location.replace` (sin entrada de historial). `legacy-redirect.spec.ts` ejecutado por mí: 28/28 en desktop+mobile, incluidos «Atrás vuelve en una pulsación», aterrizaje idéntico a carga directa para `#pantheon` y `/index.html#gastronomia`, hash vacío/inválido se queda, y servidor tipo Pages con 301 a barra final que conserva el hash. |
| 4 | Desde cualquier guía se puede volver a la portada con el enlace que decida el usuario (ROUTE-06) | ✓ VERIFIED | Decisión del usuario D-01 (enlace «← Todos los viajes» en el pie). `TripView.vue:295`: `<p class="trip-back"><a :href="homeHref">← Todos los viajes</a></p>` como hijo directo de `<footer>`; en `.output/public/trips/roma/index.html` el pie contiene `<p class="trip-back"><a href="/guiaRoma/">← Todos los viajes</a></p>` tras `.container`, con la base del runtime (no `/guiaRoma/` literal en código). Test `portada.spec.ts:177` (pie de Roma lleva el enlace a la portada) verde. No se tocó ningún golden (el pie no está en ninguna de las 56 capturas, D-02). |
| 5 | En `/trips/roma/` los 56 goldens pasan sin `--update-snapshots`, la suite de comportamiento de Roma sigue verde, y un test asevera que `/` sirve la portada y la URL de Roma sirve Roma | ✓ VERIFIED | Evidencia del orquestador (HEAD 1d1d7d8, Node 22, cachés limpias): `pnpm verify` EXIT=0, unit 301/301, data 377/377, parity 110/110 en 13 ficheros, 56 goldens comparados sin `--update-snapshots`. Verificado por mí: `git diff 6315f26 HEAD -- tests/parity/golden.spec.ts tests/parity/golden.spec.ts-snapshots/ package.json pnpm-lock.yaml app/assets/css/{base,tokens,fonts,leaflet}.css` vacío (0 cambios). Los 11 specs de Roma solo cambian por el harness (`ROMA_URL`/`ROMA_HTML`; revisé `render-cards`, `theme`, `visual-diff`: solo import + sustitución de URL/HTML), más el aserto invertido y el test nuevo `la portada vive en «/» y ROMA_URL sirve Roma (D-18)` en `shell.spec.ts` (permitido por D-18 paso 3). `tests/README.md` re-registra 110/13. |

**Score:** 5/5 truths verified (0 present-but-behavior-unverified)

Las verdades de comportamiento (redirección sin bucle, no-remontaje de TripView al pulsar pastillas, borradores en 404, sin `sql_dump`/WASM) tienen cada una un test que las ejercita y que pasa; no hay ninguna marcada solo por presencia.

### Deferred Items

Ninguno. (La URL concreta `/trips/campania/` de ROUTE-02 se asigna explícitamente a la Fase 13 en las notas de trazabilidad de REQUIREMENTS.md; el mecanismo `/trips/<slug>/` se entrega aquí y se demuestra con Roma.)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/TripIndex.vue` | Portada: tarjeta por viaje publicado | ✓ VERIFIED | Sustantivo, datos reales vía `queryCollection('trip')`, montado desde `pages/index.vue`; sin `id`, sin Topbar/pie |
| `app/pages/index.vue` | Portada + script de redirección legacy | ✓ VERIFIED | Script `critical` en head; destino fijo del mismo origen; hash validado por regex |
| `app/pages/trips/[slug].vue` | Guía por slug, clave de página por slug, 404 | ✓ VERIFIED | `definePageMeta({ key: route => 'trip:'+slug })`; guard 404 vía `useTrip` |
| `app/components/TripView.vue` | Pie con «← Todos los viajes» | ✓ VERIFIED | Hijo directo de `<footer>`, tras `.container` |
| `scripts/tripManifest.mjs` (+ `.d.mts`) | Manifiesto draft + rutas de prerender | ✓ VERIFIED | Fail-closed (slug inválido y `draft` no booleano lanzan); usado por `content.config.ts` y `nuxt.config.ts` |
| `content.config.ts` | Exclusión de borradores en producción | ✓ VERIFIED | `source.exclude` por colección; solo `NODE_ENV=development` conserva borradores |
| `shared/schemas.ts` | `draft`, `startDate`, `endDate`, `destinations`, `summary` opcionales | ✓ VERIFIED | Presentes; Roma los recibe en `content/trips/roma/trip.yml` |
| `app/assets/css/multitrip.css` | Estilos de la portada bajo `.trip-index` | ✓ VERIFIED | Guardián en `tests/unit/multitripCss.spec.ts`; `base/tokens/fonts/leaflet.css` sin cambios |
| `app/utils/tripDates.ts` | Fechas deterministas, orden y lista publicada | ✓ VERIFIED | Usado por `TripIndex.vue` (`listedTrips`, `tripMetaLine`) |
| `tests/parity/_harness.ts` | Punto único de `ROMA_URL`/`ROMA_HTML` | ✓ VERIFIED | `ROMA_URL = '/guiaRoma/trips/roma/'`; usado por los 11 specs de Roma |
| `tests/parity/legacy-redirect.spec.ts`, `portada.spec.ts`, `_pagesServer.ts` | Specs nuevos y servidor tipo Pages | ✓ VERIFIED | Ejecutados por mí, todos verdes |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `nuxt.config.ts` | `scripts/tripManifest.mjs` | `prerenderRoutes(readTripManifest())` | WIRED | `.output/public/trips/roma/index.html` existe; borradores no |
| `content.config.ts` | `scripts/tripManifest.mjs` | `draftExcludes(...)` en cada `source` | WIRED | `sql_dump` sin filas ni centinelas de borradores |
| `pages/index.vue` | `TripIndex.vue` | `<TripIndex />` | WIRED | HTML construido contiene la portada |
| `TripIndex.vue` | colección `trip` | `useAsyncData('trips-index', queryCollection('trip').select(...))` | WIRED | Tarjeta de Roma con datos reales del payload |
| tarjeta de la portada | `/guiaRoma/trips/roma/` | `<a href>` de documento completo con la base del runtime | WIRED | Comprobado en HTML y por test |
| script de redirección | `/guiaRoma/trips/roma/#ancla` | `location.replace(base+'trips/roma/'+hash)` | WIRED | Probado E2E con 301 estilo Pages |
| pie de la guía | portada | `<a :href="homeHref">` | WIRED | Comprobado en HTML y por test |
| specs de Roma | `ROMA_URL` | import desde `_harness.ts` | WIRED | Diffs revisados |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `TripIndex.vue` | `data` → `cards` | `queryCollection('trip')` prerenderizado en el payload | Sí: la tarjeta de Roma sale de `content/trips/roma/trip.yml` (título, fechas, destino, resumen coinciden con el YAML) | ✓ FLOWING |
| `TripView.vue` (pie) | `homeHref` | `useRuntimeConfig().app.baseURL` | Sí: `/guiaRoma/` en la build | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Redirección legacy (6 escenarios × desktop/mobile) | `pnpm exec playwright test -c playwright.config.ts tests/parity/legacy-redirect.spec.ts tests/parity/portada.spec.ts` (Node 22, contra la build existente) | 28 passed (18.3s) | ✓ PASS |
| `sql_dump` de la colección `trip` sin borradores | decodificación gunzip+base64 con Node de `.output/public/__nuxt_content/trip/sql_dump.txt` | solo `trips/roma/trip.yml`; centinelas ausentes | ✓ PASS |
| Puerta completa (unit/data/parity, 56 goldens) | `pnpm verify` — **no re-ejecutado**; evidencia del orquestador | EXIT=0; 301/301, 377/377, 110/110 | ✓ PASS (evidencia aportada) |
| `pnpm test:trips` | — no re-ejecutado; evidencia del orquestador (executor 11-07, en solitario) | 19/19 | ✓ PASS (evidencia aportada) |
| Ficheros congelados sin cambios | `git diff 6315f26 HEAD -- golden.spec.ts snapshots package.json pnpm-lock.yaml base/tokens/fonts/leaflet.css` | vacío | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — la fase no declara probes (`scripts/*/tests/probe-*.sh`); su verificación son specs de Playwright/Vitest, ejecutados arriba.

### Requirements Coverage

Los 8 IDs de la fase (ROUTE-01..06, PAR-01, PAR-02) aparecen declarados en los PLAN y mapeados a Phase 11 en REQUIREMENTS.md; no hay IDs huérfanos (PAR-03/PAR-04 están asignados a la Fase 14).

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ROUTE-01 | 11-04, 11-05, 11-07 | Portada con tarjeta por viaje publicado | ✓ SATISFIED | Truth 1; HTML construido de `/` |
| ROUTE-02 | 11-02, 11-03 | Roma en `/guiaRoma/trips/roma/` (Campania: Fase 13 por trazabilidad) | ✓ SATISFIED | Truth 2; `trips/roma/index.html`; rutas de prerender del manifiesto |
| ROUTE-03 | 11-06 | Enlace antiguo `/#ancla` → `/trips/roma/#ancla` sin bucle | ✓ SATISFIED | Truth 3; `legacy-redirect.spec.ts` 28/28 |
| ROUTE-04 | 11-03, 11-07 | Páginas estáticas sin `sql_dump`/WASM | ✓ SATISFIED | Truth 2; `portada.spec.ts:136` |
| ROUTE-05 | 11-02, 11-05, 11-07 | `draft` no aparece ni se publica | ✓ SATISFIED | Truth 1; exclusión en Content + sin `trips/prueba|forma` + 404 |
| ROUTE-06 | 11-03, 11-07 | Volver a la portada desde cualquier guía | ✓ SATISFIED | Truth 4 (decisión del usuario D-01) |
| PAR-01 | 11-01, 11-03, 11-05 | 56 goldens sin re-baseline en la nueva URL | ✓ SATISFIED | Truth 5; snapshots y `golden.spec.ts` intactos |
| PAR-02 | 11-01, 11-03, 11-05 | Suite de comportamiento de Roma en verde en `/trips/roma/` | ✓ SATISFIED | Truth 5; parity 110/110 |

### Anti-Patterns Found

Marcadores `TBD/FIXME/XXX`: ninguno bloqueante detectado en los ficheros de la fase. Los hallazgos de `11-REVIEW.md` (0 críticos, 3 warnings, 6 info; todos `open`) los he contrastado con el código; ninguno invalida un must-have con los datos actuales, pero WR-03 la he confirmado directamente (`const { data } = await useAsyncData(...)`, sin leer `error`).

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/data/trips.ts` | 174-188 | WR-01: `trip-summary-link` eludible (email GFM, HTML crudo, enlaces por referencia, `]( dest )`) → `<a>` anidado en la tarjeta | ⚠️ Warning | Un `summary` futuro podría romper la hidratación; el de Roma está limpio |
| `app/components/TripIndex.vue` / `shared/schemas.ts` | 78-87 / 424 | WR-02: Markdown de bloque en `summary` (p. ej. «2027. Diez días…» → `<ol>`) dentro de `<p>`/`<a>` | ⚠️ Warning | Mismo riesgo para datos futuros (Campania); sin regla en la puerta |
| `app/components/TripIndex.vue` | 36-52 | WR-03: un fallo de la consulta publica una portada vacía con HTTP 200 (`failOnError` no lo detecta) | ⚠️ Warning | Solo `portada.spec.ts` lo notaría; no ocurre con la build actual |
| varios | — | IN-01..IN-06 (comentarios obsoletos, base URL duplicada, `console.log` en spec, `yaml` en devDependencies, etc.) | ℹ️ Info | Higiene; sin impacto en el goal |

Ninguno es BLOCKER: no hay un must-have FAILED. Se llevan a decisión humana (ver abajo).

### Human Verification Required

#### 1. Aspecto de la portada en móvil real (claro y oscuro)

**Test:** Abrir `/guiaRoma/` en un móvil real, con tema claro y oscuro, y pulsar la tarjeta de Roma.
**Expected:** Tarjeta legible (título, fechas, destino, resumen), respeta el tema guardado, contraste correcto, lleva a `/guiaRoma/trips/roma/`.
**Why human:** Aspecto/tacto editorial; no existe golden de la portada. Los tests solo aseguran ausencia de desbordamiento a 375 px y respeto del tema. (PAR-04, sign-off en móvil real, es de la Fase 14.)

#### 2. Confirmar las decisiones tomadas en `--auto`

**Test:** Repasar D-06..D-23 de `11-CONTEXT.md` (sin imagen en tarjetas, orden por `startDate` descendente, formato «19–23 de junio de 2026», `<title>`/`<h1>` «Guías de viaje», estado vacío, enlace dentro del pie, etc.).
**Expected:** El usuario las acepta o indica cambios. Solo ROUTE-06 (D-01) fue decidida en persona.
**Why human:** El CONTEXT las declara pendientes de confirmación en `/gsd-verify-work 11`.

#### 3. Disposición de los warnings abiertos WR-01..WR-03

**Test:** Decidir si se arreglan ahora (gap-closure), se difieren (p. ej. a la Fase 12-13, antes de redactar el `summary` de Campania) o se aceptan.
**Expected:** Decisión registrada en `11-REVIEW-DISPOSITION.md`.
**Why human:** Decisión de alcance y riesgo; recomendable resolverla antes de que Campania añada un `summary` real.

### Gaps Summary

No hay gaps: los cinco criterios de éxito y los ocho requisitos están implementados, cableados y demostrados con pruebas que ejercitan el comportamiento (redirección sin bucle, portada vs Roma, borradores fuera del `sql_dump`, sin WASM, goldens intactos). Observación de bookkeeping (no bloqueante): en `ROADMAP.md` (línea 36) la casilla de la Fase 11 sigue sin marcar `[ ]`, aunque sus 7 planes y los 8 requisitos constan como completos en REQUIREMENTS.md; debe marcarla el orquestador al cerrar la fase.

---

_Verified: 2026-11-20T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
