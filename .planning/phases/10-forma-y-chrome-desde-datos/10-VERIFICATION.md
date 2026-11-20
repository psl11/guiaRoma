---
phase: 10-forma-y-chrome-desde-datos
verified: 2026-11-20T15:20:00Z
status: human_needed
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
  - app/app.vue
  - app/components/NavPills.vue
  - app/components/Topbar.vue
  - app/components/TripView.vue
  - app/utils/tripLayout.ts
  - content/trips/forma/trip.yml
  - content/trips/roma/trip.yml
  - shared/schemas.ts
  - tests/data/trips.ts
  - tests/trips/romaLeaks.ts
  - tests/trips/shape.spec.ts
covered_digest: "v4:sha256:d4d133fc1ae35b7d17ca9ded4b39db795266fc49ed88b360a32eb58598ae2564"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Confirmar las decisiones D-01…D-19 tomadas en modo --auto (10-CONTEXT.md / 10-DISCUSSION-LOG.md) mientras el usuario viajaba"
    expected: "El usuario las acepta o las ajusta. Las que más pesan: D-05(b) lista blanca estricta de enlaces en prosa (solo `#id` y `http(s)://`); D-09 etiquetas estructurales («Pratica», «cartografia», «El mapa del viaje») como chrome compartido fijo, no configurable; D-14 respaldo neutro (pestaña y marca = título plano del viaje; sin pie ni leyenda si el viaje no los define); D-07/D-08 orden fijo y presencia por datos sin lista en trip.yml"
    why_human: "Son decisiones de producto elegidas por Claude sin el usuario; ningún test puede validar que sean las que el usuario quiere"
  - test: "Decidir el destino de los 3 warnings abiertos de 10-REVIEW.md (WR-01, WR-02, WR-03) y de los 6 info (todos `open` en 10-REVIEW-DISPOSITION.md)"
    expected: "Cada uno queda en fixed / deferred / skipped. WR-01 y WR-03 debilitan la garantía de la puerta de datos (ver Anti-patrones); WR-02 afecta solo a títulos con énfasis anidado o `_` dentro de palabra cuando el viaje no define pageTitle/brand"
    why_human: "Triage de la revisión de código: el usuario decide si se cierran ahora o se difieren a la Fase 11/14"
  - test: "Confirmar que el viaje dev-only `forma` (D-15) puede quedar sin `draft: true` hasta la Fase 11"
    expected: "El usuario acepta que sus filas sigan pudiendo entrar en el `sql_dump` público (CR-01 de la Fase 9, ya diferido a ROUTE-05) o pide mitigarlo antes"
    why_human: "Riesgo aceptado y diferido; solo el usuario decide si es tolerable. Las rutas y el HTML publicados sí están limpios (verificado: ningún `FORMA-CENTINELA` en `.output/public`)"
---

# Phase 10: Forma y chrome desde datos — Informe de verificación

**Objetivo de la fase:** La forma de cada guía (cuántos días, qué secciones y pastillas, qué textos de marca) la deciden los datos de su viaje, y Roma —con sus textos movidos verbatim a su `trip.yml`— se ve idéntica.
**Verificado:** 2026-11-20
**Estado:** human_needed (objetivo alcanzado en código; quedan decisiones de usuario y triage de la revisión)
**Re-verificación:** No — verificación inicial

## Evidencia que he ejecutado yo (no la del SUMMARY ni la del orquestador)

| Comprobación | Resultado |
|---|---|
| `git diff --stat f04967a HEAD -- tests/parity/ app/assets/css/ content/trips/prueba/` | vacío: ni un golden, ni un spec de paridad, ni CSS, ni `prueba` tocados |
| `vitest run tests/unit tests/data` | 21 ficheros, 592/592 |
| `rm -rf .data .nuxt .output && pnpm generate` (Node 22) | exit 0, 10 rutas prerenderizadas |
| `pnpm test:parity` sobre esa build, sin `--update-snapshots` | **80/80** (incluye `visual-diff` de los 56 goldens) |
| `pnpm test:trips` (dev) | **17/17** |
| Inspección de `.output/public/index.html` | título, 12 pastillas, 12 `<section>` hijas de `<main>`, marca, leyenda y pie, verbatim (detalle abajo) |
| `verify.artifacts` / `verify.key-links` de los 5 planes | todos pasan (5/5, 6/6, 4/4, 4/4, 4/4 artefactos; 4/4, 4/4, 3/3, 3/3, 3/3 enlaces) |
| Marcadores de deuda (`TBD`/`FIXME`/`XXX`) en ficheros de la fase | ninguno |

## Cumplimiento de los criterios de éxito del ROADMAP

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | Viaje de 10 días con dos sábados: 10 secciones con nombre y fecha, 10 pastillas distintas que llevan a su día; Roma con sus 5 días `#viernes…#martes` | ✓ VERIFIED | `content/trips/forma/days/` tiene 10 YAML (`order` 1..10; `sabado-19`/`sabado-26` con `pill` «Sáb 19»/«Sáb 26»; también repiten domingo y lunes). `tests/trips/shape.spec.ts` (ejecutado, verde) comprueba: `main > section` = `inicio, mapa, 10 días en orden, gastronomia`; cada día con su `.section-eyebrow` y `h2`; las 10 pastillas distintas y el clic en cada una deja `location.hash` en su día. En Roma, el HTML prerenderizado trae `viernes, sabado, domingo, lunes, martes` entre `mapa` y `reservas` |
| 2 | Sin datos para sección opcional → ni sección ni pastilla; Roma con 12 pastillas en el mismo orden | ✓ VERIFIED | `buildTripLayout` (`app/utils/tripLayout.ts:84-93`) decide por presencia; `TripView.vue` recorre esa MISMA lista para `<main>` y `NavPills` (una sola fuente). E2E `forma: sin Arte, Arquitectura, Reservas ni Práctica` verde. Roma prerenderizada: `Inicio, Mapa, Venerdì, Sabato, Domenica, Lunedì, Martedì, Reservas, Gastronomía, Pratica, Arte, Arquitectura` |
| 3 | Marca, pie y leyenda salen de `trip.yml`; pestaña con título propio; Roma = textos actuales («Roma · 19—23 giugno 2026») | ✓ VERIFIED | `content/trips/roma/trip.yml` (+14 líneas aditivas) con `pageTitle`, `brand`, `mapLegend`, `footer`. `TripView.vue` usa `useHead({ title })`, `trip.mapLegend`, `trip.footer`; `Topbar.vue` usa `brand`. `app.vue` ya no fija `<title>`. Build: un único `<title>Roma · 19—23 giugno 2026</title>`; `.brand` = `Roma <span class="brand-dot">✦</span> giugno MMXXVI`; leyenda con doble espacio; pie con 2 `<br>` y `<em>Pay</em>`. Comparado además contra `index.html` líneas 8, 2259, 2370, 6236-6240 (los textos coinciden; `tests/data/romaChrome.spec.ts` lo asevera con cheerio). E2E por viaje: `forma` muestra su marca/leyenda/pie/pestaña; `prueba` (sin campos) cae al título plano, sin `.brand-dot`, sin `<footer>` ni `p.map-legend` |
| 4 | En la guía de un viaje de prueba no aparece texto propio de Roma; un test-trampa falla si se cuela | ✓ VERIFIED | `tests/trips/romaLeaks.ts` (matcher por palabra Unicode: Roma, Einaudi, giugno, MMXXVI, Pay, Fellini, Royal Court) con dientes en `tests/unit/romaLeaks.spec.ts`; `tests/trips/shape.spec.ts` escanea título, `innerText` y `textContent` de **todos** los viajes de `content/trips/` salvo `roma` (descubiertos por `readdirSync`, no por lista), con guardas anti-vacío y control positivo en Roma. 17/17 verde. Guardián estático D-17 (`tests/unit/romaChromeGuard.spec.ts`) sobre `app/**`; mi `grep` de `app/` no encuentra literales de Roma en código vivo (solo nombres de campo y comentarios) |
| 5 | Paridad verde en `/` con los 56 goldens sin re-baseline | ✓ VERIFIED | `pnpm test:parity` ejecutado por mí: 80/80, sin `--update-snapshots`; el diff contra `f04967a` confirma que `tests/parity/` y `app/assets/css/` no cambian |

**Score:** 5/5 verdades verificadas, 0 PRESENT_BEHAVIOR_UNVERIFIED.

### Verdades de los planes (resumen)

Las verdades de PLAN 10-01…10-05 que no son duplicado de un criterio del roadmap están verificadas: orden D-07 y presencia D-08 (`tripLayout.ts` + `tests/unit/tripLayout.spec.ts`); `DAY_SLUG_RE` y `pill` opcional (`shared/schemas.ts`); campos de chrome todos `.optional()` y `pageTitle` con `min(1)` (aditivo; Roma sin campos seguía validando antes de añadir los valores); reglas `day-order`, `day-pill` (NFC + minúsculas), `anchor` por presencia y `cross-trip-link` en lista blanca en `tests/data/trips.ts` (592 tests verdes, incluidos sus dientes); `SECTION_ANCHORS` derivado de `STRUCTURAL_SECTION_IDS`; viaje `forma` ausente de `.output/public` (ninguna aparición de `FORMA-CENTINELA`; `tests/data/build-isolation.spec.ts` verde).

### Prohibiciones (todas de tier `judgment`, `verification: null` en los planes)

| Prohibición | Estado | Evidencia |
|---|---|---|
| No tocar `tests/parity/` ni `app/assets/css/`, no `--update-snapshots`, no CSS nuevo ni `<style scoped>` | ✓ respetada | diff vacío contra `f04967a`; `grep "<style"` en TripView/NavPills/Topbar sin resultados |
| La app no enlaza `/trips/*` | ✓ respetada | solo aparecen en comentarios de `app/pages/index.vue`; navegación por `#id` |
| Ningún viaje muestra texto de Roma por defecto | ✓ respetada | respaldo = `inlineMdToPlain(trip.title)` o no renderizar; guardián D-17 + trampa en verde |
| La puerta de datos no se relaja ni se edita el YAML de Roma/prueba para acomodarla | ✓ respetada | `content/trips/roma/` solo cambia `trip.yml` (+14, aditivo); `prueba` sin diff; no se borraron fixtures «dientes» |

Veredictos objetivos (diff, grep, tests deterministas), no un juicio LLM; aun así la etiqueta formal de los planes es `judgment`.

### Cobertura de requisitos

| Requisito | Planes | Estado | Evidencia |
|---|---|---|---|
| SHAPE-01 | 10-01, 10-03, 10-04 | ✓ SATISFIED | criterio 1 |
| SHAPE-02 | 10-01, 10-03, 10-04 | ✓ SATISFIED | criterio 2 |
| SHAPE-03 | 10-02, 10-05 | ✓ SATISFIED | criterio 3 |
| SHAPE-04 | 10-02, 10-05 | ✓ SATISFIED | criterio 3 (pestaña por viaje, E2E `título: cada viaje pone su propia pestaña`) |
| SHAPE-05 | 10-02, 10-04, 10-05 | ✓ SATISFIED | criterio 4 |

Los 5 IDs de REQUIREMENTS.md (marcados `[x]` / Complete) aparecen en el frontmatter de algún PLAN. Sin requisitos huérfanos.

### Flujo de datos (nivel 4)

`useTrip(slug)` → `days/food/artists/refById/trip` (consultas de Content) → `buildTripLayout` → `<main>` y `NavPills`; `trip.brand/footer/mapLegend/pageTitle` → `Topbar`/`TripView`/`useHead`. El HTML prerenderizado ya contiene los valores reales de Roma (no son estáticos ni de hidratación), y el E2E de dev muestra los de `forma`/`prueba`. FLOWING.

### Anti-patrones y hallazgos de la revisión de código (10-REVIEW.md, 0 críticos, todos `open`)

Los he comprobado contra el código; no cambian el estado de ningún criterio de éxito, pero son debilidades reales de las garantías de la puerta:

| Id | Severidad | Verificación mía | Impacto |
|---|---|---|---|
| WR-01 | ⚠️ Warning | Confirmado: `extractLinkTargets` en `tests/data/trips.ts:167` usa `/\]\(([^)\s]+)/g`, que no captura `[x]( /trips/roma)`, destino en nueva línea, enlaces por referencia ni `<a href>` en línea. La lista blanca D-05(b) se puede esquivar con esas formas; las formas listadas en el plan (`/#x`, `/guiaRoma/#x`, `../roma#x`, `/trips/…`, `javascript:`) sí se rechazan | La garantía «solo `#id` o http(s)» no es total; un `/trips/…` colado haría que `crawlLinks` prerenderice un viaje de desarrollo |
| WR-02 | ⚠️ Warning | Confirmado por lectura: `inlineMdToPlain` es una sola pasada de regex (`tripLayout.ts:100-105`); `***Roma***` o `a_b_c` salen mal | Solo afecta a viajes sin `pageTitle`/`brand`. Roma y los viajes actuales no se ven afectados |
| WR-03 | ⚠️ Warning | Confirmado por lectura (`anchorable` incluye todos los slugs de monumentos, `trips.ts:351`) | Una ficha que no esté en ningún `cards` de día pasa la regla `anchor` aunque no tenga elemento en el DOM |
| IN-01…IN-06 | ℹ️ Info | Sin verificar uno a uno; no tocan criterios | Triage pendiente |

Nota de alcance: ninguno de WR-01..03 incumple literalmente una verdad del plan (las formas nombradas se cubren), por eso no los clasifico como BLOCKER; sí quedan sin triar en `10-REVIEW-DISPOSITION.md`.

Otros: ningún `TBD/FIXME/XXX`; `app/` sin literales de Roma en código vivo; sin stubs.

### Observaciones sobre el entorno de verificación

- El único test intermitente conocido (`navigation.spec.ts` «SC#2 scrollspy» [mobile]) tardó 29,7 s contra un límite de 30 s en mi ejecución: pasó, pero con margen casi nulo. Es anterior a la Fase 10 (no la causa).
- No he comprobado de forma dirigida la ausencia de avisos de hidratación en consola durante la ventana `.data = null`; la evidencia indirecta es que el HTML prerenderizado ya trae las 12 secciones y la paridad (80/80) pasa con la página hidratada.

## Resumen

El objetivo se cumple en el código: la forma (días, secciones, pastillas) y el chrome (marca, leyenda, pie, pestaña) salen de los datos de cada viaje a través de una función pura compartida; Roma queda idéntica (build propia, 80/80 de paridad, 56 goldens intactos, CSS y `tests/parity/` sin tocar) y los textos movidos coinciden con `index.html`. El estado es `human_needed` y no `passed` porque (1) las 19 decisiones de CONTEXT se tomaron en modo `--auto` y esperan confirmación del usuario, (2) los 9 hallazgos de la revisión siguen `open` y (3) hay un riesgo aceptado (viaje `forma` aún no `draft`, CR-01 diferido a la Fase 11). No hay gaps que requieran `/gsd-plan-phase --gaps`.

---

_Verificado: 2026-11-20_
_Verificador: Claude (gsd-verifier)_
