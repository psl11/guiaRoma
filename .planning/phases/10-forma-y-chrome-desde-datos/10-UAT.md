---
status: diagnosed
phase: 10-forma-y-chrome-desde-datos
source: [10-VERIFICATION.md]
started: 2026-11-20T15:10:00Z
updated: 2026-11-22T18:47:49.209Z
---

## Current Test

[testing complete]

## Tests

### 1. Confirmar las decisiones D-01…D-19 tomadas en modo --auto (10-CONTEXT.md / 10-DISCUSSION-LOG.md) mientras el usuario viajaba
expected: El usuario las acepta o las ajusta. Las que más pesan: D-05(b) lista blanca estricta de enlaces en prosa (solo `#id` y `http(s)://`); D-09 etiquetas estructurales («Pratica», «cartografia», «El mapa del viaje») como chrome compartido fijo, no configurable; D-14 respaldo neutro (pestaña y marca = título plano del viaje; sin pie ni leyenda si el viaje no los define); D-07/D-08 orden fijo y presencia por datos sin lista en trip.yml
result: pass
note: "Aceptadas por el usuario 2026-11-22 (las Fases 11–14 ya construyen sobre ellas)."

### 2. Decidir el destino de los 3 warnings abiertos de 10-REVIEW.md (WR-01, WR-02, WR-03) y de los 6 info (todos `open` en 10-REVIEW-DISPOSITION.md)
expected: Cada uno queda en fixed / deferred / skipped. WR-01 y WR-03 debilitan la garantía de la puerta de datos (ver Anti-patrones); WR-02 afecta solo a títulos con énfasis anidado o `_` dentro de palabra cuando el viaje no define pageTitle/brand
result: issue
reported: "a — arreglar ahora WR-01 (formas de enlace válidas que la puerta no ve) y WR-03 (ancla a un monumento que no se pinta en ningún día / monumento en dos días); WR-02 y los 6 info se difieren. Ninguno afecta hoy a Roma ni a Campania (comprobado: 0 monumentos huérfanos o duplicados, 0 enlaces con formas alternativas)."
severity: minor

### 3. Confirmar que el viaje dev-only `forma` (D-15) puede quedar sin `draft: true` hasta la Fase 11
expected: El usuario acepta que sus filas sigan pudiendo entrar en el `sql_dump` público (CR-01 de la Fase 9, ya diferido a ROUTE-05) o pide mitigarlo antes
result: pass
note: "Superada por la ejecución posterior: la Fase 11 (ROUTE-05, D-16) puso `draft: true` en `content/trips/forma/trip.yml`; `content.config.ts` lo excluye de las 6 colecciones y `tests/data/build-isolation.spec.ts` decodifica los `sql_dump` para afirmar que ninguna fila suya se publica. Verificado 2026-11-22."

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-10-2
  truth: "La puerta de datos (`pnpm verify` → `test:data`) ve todo enlace que MDC convierte en `<a>` y solo acepta anclas `#id` que existen en el DOM del viaje: un enlace prohibido o roto falla nombrando el fichero, sea cual sea la forma Markdown con que se escriba (D-05b / D-08, sin fail-open)"
  status: failed
  reason: "User reported: a — arreglar ahora WR-01 y WR-03 de 10-REVIEW.md; WR-02 y los 6 info se difieren"
  severity: minor
  test: 2
  root_cause: "Dos huecos fail-open en `tests/data/trips.ts`: (1) WR-01 — `extractLinkTargets` (l.278-284) usa la regex `/\]\(([^)\s]+)/g`, que solo reconoce `](destino)` pegado al paréntesis; MDC (`@nuxtjs/mdc` parseMarkdown) también produce `<a>` para `[x]( destino)` (espacio), `[x](\ndestino)` (salto de línea, fácil en bloques `|`/`>`), enlaces por referencia `[x][r]` + `[r]: destino` y HTML crudo `<a href>`; ninguno llega a `cross-trip-link` ni a `anchor` (verificado por el revisor ejecutando parseMarkdown). (2) WR-03 — `anchorable` (l.528) incluye el slug de TODA entidad, pero un `MonumentCard` (el elemento con `id=<slug>`) solo se pinta desde `days[*].cards` (`app/components/DaySection.vue`); un monumento sin día pasa `anchor` aunque no existe en el DOM (el clic empuja `navStack` y muestra «Volver» sin desplazar), y un monumento en dos días produce ids duplicados sin violación."
  artifacts:
    - path: "tests/data/trips.ts"
      issue: "extractLinkTargets basada en regex (l.278-284) no ve formas de enlace válidas; anchorable (l.528) usa todos los slugs de monumento en vez de los pintados"
    - path: "tests/data/invariants.spec.ts"
      issue: "sin pruebas de dientes para las 4 formas de enlace alternativas ni para monumento sin día / en dos días"
  missing:
    - "Extraer destinos de enlace del árbol Markdown parseado (p. ej. `mdast-util-from-markdown`: nodos `link` y `definition`) o, como mínimo, regex que admita espacio/salto tras `(` y `<…>`, más reglas que rechacen líneas de definición `[r]: …` y `<a ` en prosa"
    - "Construir `renderedMonuments` como unión de `days[*].cards` y usarlo en `anchorable` (y en `artists.seenIn` si aplica); regla nueva (p. ej. `card-placement`) que marque un monumento en cero o en más de un día, nombrando el fichero"
    - "Pruebas de dientes en `invariants.spec.ts` (una por forma de enlace alternativa y por cada caso de colocación), sin tocar `content/`, `tests/parity/`, `app/` ni goldens; Roma y Campania siguen verdes"
  debug_session: ""

## Deferred Follow-Ups

- test: 2
  idea: "WR-02 de 10-REVIEW.md: `inlineMdToPlain` (respaldo D-14) deja marcas con énfasis anidado, `_` dentro de palabra y escapes. Latente: todos los viajes reales definen `pageTitle`/`brand`."
  deferred_at: 2026-11-22
- test: 2
  idea: "IN-01…IN-06 de 10-REVIEW.md (guardas imposibles en TripView, `day-pill` vs etiquetas estructurales, `day-order` con `order` duplicado, pie con Markdown de bloque, trampa que no mira atributos, comentario obsoleto en dayLabel.ts). Sin efecto visible."
  deferred_at: 2026-11-22
