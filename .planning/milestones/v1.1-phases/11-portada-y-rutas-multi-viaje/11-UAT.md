---
status: complete
phase: 11-portada-y-rutas-multi-viaje
source: [11-VERIFICATION.md]
started: 2026-11-20T21:30:00Z
updated: 2026-11-23T10:50:54.989Z
---

## Current Test

[testing complete]

## Tests

### 1. Revisar la portada en un móvil real, con tema claro y oscuro
expected: `/guiaRoma/` muestra «Guías de viaje» y la tarjeta de Roma legible y pulsable en móvil, en claro y en oscuro; la línea «19–23 de junio de 2026 · Roma» se lee bien (UI-REVIEW: tamaño de la meta y contraste del hover en oscuro, 4.29:1); el enlace «← Todos los viajes» del pie de Roma vuelve a la portada
result: pass
note: "Confirmado por el usuario 2026-11-22."

### 2. Confirmar las decisiones D-06…D-23 tomadas en modo --auto (11-CONTEXT.md) mientras el usuario viajaba
expected: El usuario las acepta o las ajusta. Las que más pesan: título «Guías de viaje» y tarjeta sin imagen (D-07/D-11); orden por `startDate` descendente (D-10); fechas cruzando mes con ambas completas («30 de junio de 2026 – 2 de julio de 2026», D-09/UI-SPEC); texto del `summary` de Roma (UI-SPEC); `draft` excluido de Content en producción y nunca listado en la portada (D-16); redirección legacy sin lista blanca, solo `^#[a-z0-9-]+$` (D-14); pie presente en todas las guías porque aloja el enlace (D-03, sustituye D-14 de la Fase 10)
result: pass
note: "Aceptadas por el usuario 2026-11-23 (las Fases 12–14 ya construyen sobre ellas)."

### 3. Decidir el destino de los 3 warnings de 11-REVIEW.md (WR-01, WR-02, WR-03) y de los 6 info (todos `open` en 11-REVIEW-DISPOSITION.md)
expected: Cada uno queda en fixed / deferred / skipped. WR-01 (regla `trip-summary-link` eludible: email, `<a>` crudo, enlace por referencia) y WR-02 (Markdown de bloque en `summary`, p. ej. «2027. …» → `<ol>`) pueden romper la tarjeta cuando Campania tenga `summary`; WR-03: si la consulta de la portada falla en el prerender se publica una portada vacía con 200. Recomendado arreglarlos antes de que Campania deje de ser draft (Fase 13)
result: issue
reported: "a — arreglar ahora WR-02 (Markdown de bloque en `summary`, p. ej. «2027. …» → `<ol>` dentro de la tarjeta) y WR-03 (si la consulta de la portada falla en el prerender se publica una portada vacía con 200); los 6 info se difieren. WR-01 ya queda cerrado por la Fase 10 (10-06 + revisión: `trip-summary-link` usa `scanProseLinks`)."
severity: minor

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-11-3
  truth: "La tarjeta de la portada nunca rompe la hidratación ni se publica vacía: un `summary` con Markdown de bloque (lista, cita, tabla, encabezado, «2027. …») hace fallar `pnpm verify` nombrando `trip.yml`, y un fallo de la consulta de la portada durante el prerender hace fallar la build en vez de publicar una portada en blanco con 200"
  status: resolved
  resolved_by: 11-08-PLAN.md
  resolved_at: 2026-11-23
  reason: "User reported: a — arreglar ahora WR-02 y WR-03 de 11-REVIEW.md; los 6 info se difieren"
  severity: minor
  test: 3
  root_cause: "(1) WR-02 — `summary` es `Md.min(1).optional()` (`shared/schemas.ts:547`) y la tarjeta lo pinta como `<p class=\"trip-index-summary\"><MDC :tag=\"false\" unwrap=\"p\" /></p>` dentro de `a.trip-index-card` (`app/components/TripIndex.vue`); `unwrap=\"p\"` solo quita párrafos, así que cualquier construcción de bloque (p. ej. `2027. …` → `<ol start=\"2027\">`, verificado con parseMarkdown por el revisor) mete un bloque dentro de `<p>`/`<a>`: el navegador reubica el DOM y la hidratación no casa. La puerta solo vigila enlaces (`trip-summary-link`, ya con `scanProseLinks` y rechazo de encabezados tras la Fase 10), no listas/citas/tablas. (2) WR-03 — `TripIndex.vue` toma solo `data` de `useAsyncData('trips-index', …)`; si `queryCollection('trip')` lanza en el prerender, `error.value` se ignora, `listedTrips(undefined)` (`app/utils/tripDates.ts:86`) devuelve `null` y la plantilla pinta un `<main>` vacío con 200, que `nitro.prerender.failOnError` no detecta."
  artifacts:
    - path: "tests/data/trips.ts"
      issue: "sin regla que rechace Markdown de bloque en `summary` (solo `trip-summary-link`)"
    - path: "app/components/TripIndex.vue"
      issue: "ignora `error` de `useAsyncData`; un fallo de consulta publica una portada vacía con 200"
  missing:
    - "Regla de la puerta (p. ej. `trip-summary-inline`) que rechace en `summary` cualquier construcción de bloque que MDC/CommonMark abra (lista ordenada `[0-9]{1,9}[.)] `, lista `-`/`*`/`+`, cita `>`, tabla, bloque de código, encabezado, línea en blanco que parta párrafos), nombrando `trip.yml`; dientes en `invariants.spec.ts`; Roma y Campania siguen verdes sin tocar su contenido"
    - "En `TripIndex.vue`, convertir el error de `useAsyncData` en error fatal (p. ej. `if (error.value) throw createError({ statusCode: 500, fatal: true, … })`) para que el prerender falle; salida de Roma/portada byte-idéntica en el caso normal (goldens y `portada.spec.ts` sin cambios)"
    - "Sin tocar `content/`, `tests/parity/` (goldens), `app/assets/css/`, `content.config.ts`, `package.json` ni `pnpm-lock.yaml`"
  debug_session: ""

## Deferred Follow-Ups

- test: 3
  idea: "IN-01…IN-06 de 11-REVIEW.md: el esquema acepta datos de tarjeta que la tarjeta descarta; la guarda de alcance de `multitrip.css` no ve at-rules globales; una carpeta de viaje enlazada simbólicamente se salta la exclusión de borradores; comentarios con el enrutado anterior a la Fase 11; expresión de barra final del baseURL duplicada 4 veces; `console.log` de depuración en el spec de redirección y una dependencia de build en devDependencies. Sin efecto visible."
  deferred_at: 2026-11-23
