---
phase: 02-esquema-de-datos-migraci-n-del-contenido
plan: 01
subsystem: database
tags: [zod, nuxt-content, vitest, yaml, schema-validation, typescript, cheerio]

# Dependency graph
requires:
  - phase: 01
    provides: "scaffold Nuxt 4 + @nuxt/content registrado (stub content.config.ts) + convenciones de test (tests/parity Playwright, cabeceras en espanol)"
provides:
  - "shared/schemas.ts: las 6 colecciones zod (Trip, Day, Monument, Food, Artist, Reference) + sub-esquemas (Coords, Fact, Md, Link, Motif, Pace, PlaceType) como FUENTE UNICA de verdad"
  - "content.config.ts poblado: 6 defineCollection type:data con globs anidados trips/*/..."
  - "puerta DATA-05 (tests/data/schema.spec.ts): Schema.safeParse por fichero YAML + fixtures que prueban el rechazo de datos invalidos"
  - "puerta SC4 (tests/data/invariants.spec.ts): ids unicos + cross-refs + anclas inline + basename===slug"
  - "tooling de test: vitest 4.1.9 + yaml + cheerio; vitest.config.ts; script test:data"
  - "contrato de campos/enums/cross-refs contra el que la Wave 2 (migracion) escribira cada YAML"
affects: [migracion-roma, wave-2, render-mdc, ruta-del-dia, busqueda, mapa, verificacion-paridad]

# Tech tracking
tech-stack:
  added: [vitest@4.1.9, yaml@2.9.0, cheerio@1.2.0]
  patterns: ["esquema zod en modulo compartido importado por config Y tests", "validacion Node-pura como puerta de build (no queryCollection)", "cross-refs en test de invariantes, no en zod refine", "slug (no id) como ancla estable", "prosa como sections[{heading,body}]", "discriminatedUnion para timeline/artist/reference"]

key-files:
  created: [shared/schemas.ts, vitest.config.ts, tests/data/schema.spec.ts, tests/data/invariants.spec.ts]
  modified: [content.config.ts, package.json, pnpm-lock.yaml, nuxt.config.ts, eslint.config.mjs]

key-decisions:
  - "Motif: enum de 19 valores verbatim de CARD_TO_MOTIF (index.html:2213); un motif fuera del enum es test rojo (DATA-05)"
  - "slug (no id reservado) como ancla estable en cada coleccion; basename del fichero === slug (excepto trip.yml singleton)"
  - "prosa de monument/artist como array ordenado sections[{heading,body}] (D-01); :detail-photo/detail-list embebidos inline en body"
  - "monument.artists Y monument.arch como arrays opcionales de Link (Pitfall 2 — ambos multi-enlace, no singular)"
  - "DaySchema.timeline = z.discriminatedUnion('kind', [stop|transport|meta|food|reservation]); cards = z.array(z.string())"
  - "ArtistSchema = z.discriminatedUnion('kind', [artist|arquitectura|glossary]); glosario como 3er kind (D-04)"
  - "ReferenceSchema = z.discriminatedUnion('slug', [reservas|practica]); bespoke por seccion (D-03)"
  - "food.group como campo por ficha (no secciones ordenadas) — ordena la seccion en render, mantiene 1 fichero=1 entidad (discrecion D)"
  - "archLink (Barroco->#art-bernini) inline en body; invariants.spec escanea (#id) en todos los campos Md (Open Q resuelta)"
  - "cross-refs NO en zod (refine se pierde al convertir a JSON-Schema); viven en invariants.spec (unica capa con vision global, Pitfall 6)"

patterns-established:
  - "Fuente unica de esquema: shared/schemas.ts importado por content.config.ts Y por schema.spec.ts (mismo contrato en config y test)"
  - "Puerta de validacion Node-pura: readFileSync + parseYaml + safeParse por fichero; NUNCA queryCollection (Content limpia los datos invalidos y ocultaria los fallos de DATA-05)"
  - "Fixtures in-line que prueban que la puerta tiene dientes ANTES de migrar (evita test vacuo verde)"
  - "Runners disjuntos: Vitest cubre tests/data/**, Playwright sigue en tests/parity/**"

requirements-completed: [DATA-01, DATA-02, DATA-05, DATA-06]

# Metrics
duration: 12min
completed: 2026-06-19
---

# Phase 2 Plan 01: Esquema de datos (contrato + puertas de validacion) Summary

**Las 6 colecciones zod del viaje en una fuente unica (shared/schemas.ts), registradas en content.config.ts como type:data, mas las dos puertas de validacion Node-puras (schema.spec DATA-05 + invariants.spec SC4) que hacen cumplir lo que Content v3 NO valida en build (#3351) — todo verde con fixtures antes de migrar un solo YAML.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-19T07:54:58Z
- **Completed:** 2026-06-19T08:07:37Z
- **Tasks:** 4
- **Files modified:** 9

## Accomplishments
- **shared/schemas.ts** — las 6 colecciones zod (Trip, Day, Monument, Food, Artist, Reference) + sub-esquemas reutilizables (Coords, Fact, Md, Link, Motif[19], Pace, PlaceType) como fuente unica de verdad, derivadas 1:1 del blueprint de 02-RESEARCH (que a su vez se leyo linea a linea de index.html). Tipos TS derivados gratis (`z.infer`).
- **content.config.ts** poblado — 6 `defineCollection({ type:'data' })` con globs anidados (`trips/*/monuments/*.yml`, etc.), importando los 6 schemas de `./shared/schemas`. `nuxt build` registra las 6 colecciones (SQL dumps generados para trip/day/monument/food/artist/reference) y `pnpm typecheck` pasa (DATA-01).
- **Puerta DATA-05** (tests/data/schema.spec.ts) — `Schema.safeParse` por fichero YAML por coleccion + fixtures que prueban que un motif fuera del enum, coords ausente o type invalido FALLAN; un dia con timeline discriminado valida (DATA-02); los campos Md son string (DATA-06). Node puro, sin `queryCollection`.
- **Puerta SC4** (tests/data/invariants.spec.ts) — Set de slugs unicos + resolucion de TODAS las cross-refs (day.cards, timeline stop/food ref, monument.artists/arch, artist.seenIn, reservas.table.ref) + escaneo de anclas `(#id)` en la prosa Md (cubre archLink inline) + `basename===slug`; fixtures demuestran que detecta refs rotas y duplicados sin datos.
- **Tooling**: vitest 4.1.9 + yaml + cheerio instalados; vitest.config.ts (runner disjunto de Playwright); script `test:data`. `pnpm test:data` → 2 files, 29 passed | 7 skipped.

## Task Commits

Each task was committed atomically:

1. **Task 1: Instalar tooling de test y configurar Vitest** - `fdc84aa` (chore)
2. **Task 2: Definir las 6 colecciones zod en shared/schemas.ts y poblar content.config.ts** - `421e55c` (feat)
3. **Task 3: Test de validacion de esquema (puerta DATA-05)** - `00349d8` (test, incluye fix Rule 3)
4. **Task 4: Test de invariantes (ids unicos + cross-refs)** - `cdb457b` (test)

_Tareas TDD (2-4): el esquema (feat) y sus dos puertas (test) se separan en commits; las puertas son verdes con fixtures que prueban el rechazo de datos invalidos antes de que Wave 2 migre._

## Files Created/Modified
- `shared/schemas.ts` (NEW) - Las 6 colecciones zod + sub-esquemas, fuente unica de verdad (import z desde 'zod', sin refine para cross-refs)
- `content.config.ts` (MOD) - Reemplaza el stub {} de Fase 1 por 6 defineCollection type:data con globs anidados
- `vitest.config.ts` (NEW) - Runner Vitest Node-puro, include tests/data, disjunto de Playwright
- `tests/data/schema.spec.ts` (NEW) - Puerta DATA-05: safeParse por fichero + fixtures de rechazo
- `tests/data/invariants.spec.ts` (NEW) - Puerta SC4: ids unicos + cross-refs + anclas inline + basename===slug
- `package.json` (MOD) - devDeps vitest/yaml/cheerio + script test:data
- `pnpm-lock.yaml` (MOD) - lockfile con las 3 nuevas devDeps (T-02-01/T-02-SC: versiones fijadas, paquetes canonicos)
- `nuxt.config.ts` (MOD) - eslint.config.typescript=true (desbloqueo Rule 3, ver Deviations)
- `eslint.config.mjs` (MOD) - comentario: tests/data SI se lintea (vs tests/parity ignorado)

## Decisions Made
- **Motif = 19 valores verbatim** de CARD_TO_MOTIF (index.html:2213), verificados por lectura directa. Enum cerrado → un motif mal escrito es test rojo.
- **slug, no id**: `id` es reservado por Content (lo sobrescribe con la ruta). Se declara `slug` propio = ancla del index.html en cada coleccion. `basename(fichero)===slug` (excepto `trip.yml`, singleton no direccionable por ancla — exceptuado explicitamente en el test).
- **Cross-refs fuera de zod**: `.refine()` se pierde al convertir a JSON-Schema Draft-07 y no ve las otras colecciones. La resolucion de referencias vive solo en invariants.spec (unica capa con vision global). zod queda para forma + enums por-fichero.
- **food.group como campo por ficha** (discrecion D): es el texto del gastro-section-title contenedor; ordena la seccion en render pero se guarda por ficha para mantener "1 fichero = 1 entidad" (D-05) y dejar el agrupado al consumidor (Fase 4+).
- **archLink inline + escaneo de anclas** (Open Q resuelta): los enlaces #art-* dentro de la prosa de las edades de arquitectura se dejan inline en el body; invariants.spec extrae `(#id)` de TODOS los campos Md y los resuelve, cubriendo archLink y cualquier `[texto](#id)` sin duplicar datos.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Activar typescript-eslint para los .ts fuera del grafo Vue**
- **Found during:** Task 3 (al lintar tests/data/schema.spec.ts — tests/data ES codigo fuente que debe lintarse)
- **Issue:** `@nuxt/eslint` resolvia `features.typescript = false` por defecto, asi que los `.ts` fuera del grafo de la app (shared/, tests/data/, *.config.ts) caian al parser por defecto (espree), que NO entiende sintaxis de tipos (`: string`, `export type`) → "Parsing error". Fase 1 nunca lo expuso porque su unico .ts tipado vive en `tests/parity/**`, que esta ignorado por ESLint. Fase 2 es la primera con codigo fuente TS tipado lintado, de ahi que la laguna emergiera ahora.
- **Fix:** `nuxt.config.ts` → `eslint.config.typescript = true` (opcion del propio modulo @nuxt/eslint, no un import fragil). Tras `nuxi prepare` la config generada incluye el parser typescript-eslint para `**/*.ts`. Se descarto importar `@typescript-eslint/parser` directamente porque no es resolvable desde la raiz (dep transitiva en el subarbol de @nuxt/eslint-config).
- **Files modified:** nuxt.config.ts (eslint.config.mjs solo recibio un comentario aclaratorio en Task 1; sin diff neto adicional)
- **Verification:** `pnpm exec eslint --print-config shared/schemas.ts` → parser `typescript-eslint/parser@8.61.1`; `pnpm lint` (repo completo) exit 0; las 4 TS files lintan limpias.
- **Committed in:** `00349d8` (commit de Task 3)

---

**Total deviations:** 1 auto-fixed (Rule 3 — desbloqueo de tooling)
**Impact on plan:** Necesario para cumplir el criterio "tests/data se lintea como fuente TS" (02-PATTERNS 352). Cambio de configuracion, sin cambio de comportamiento de runtime; `nuxt build` y `pnpm typecheck` siguen verdes. Sin scope creep.

## Issues Encountered
- **Diagnostico del parser ESLint**: identificar por que los .ts caian a espree requirio inspeccionar la config generada por @nuxt/eslint (`resolveOptions` → `features.typescript:false`). Resuelto activando la opcion del modulo en vez de parchear el flat config a mano (mas robusto y forward-compatible).
- **Conteo de artists = 13**: el plan/research fija 13 (7 art + 5 arq + 1 glosario). El describe de conteo de schema.spec usa 38/26/13/5/2/1, tolerante a 0 mientras Wave 2 no migre; cuando existan los YAML hara cumplir SC#1.

## User Setup Required
None - no external service configuration required. Fase de modelado de datos para sitio estatico: sin entrada de usuario en runtime, sin auth, sin endpoints, sin secretos (threat model: integridad de datos + cadena de suministro, ambos mitigados via lockfile + puertas de validacion).

## Next Phase Readiness
- **Wave 2 (migracion del contenido) puede empezar**: el contrato esta congelado. Cada YAML migrado tiene feedback inmediato — schema.spec (forma/enums) + invariants.spec (cross-refs). Los loops por-coleccion estan en `it.skip` mientras no haya ficheros; en cuanto aparezca el primer `monuments/*.yml`, el `it` correspondiente se activa y valida.
- **cheerio** ya instalado para el harness de extraccion/diff (D-07/D-08) de los planes de migracion siguientes.
- **Sin blockers.** El build genera las 6 colecciones; los tipos TS de cada coleccion estan disponibles para los componentes de Fases 3-4 (`z.infer` exportado).

---
*Phase: 02-esquema-de-datos-migraci-n-del-contenido*
*Completed: 2026-06-19*

## Self-Check: PASSED

- Created files verified on disk: shared/schemas.ts, vitest.config.ts, tests/data/schema.spec.ts, tests/data/invariants.spec.ts, content.config.ts
- Task commits verified in git log: fdc84aa, 421e55c, 00349d8, cdb457b
- Gates green: `pnpm test:data` → 2 files, 29 passed | 7 skipped; `pnpm typecheck` exit 0; `nuxt build` registra las 6 colecciones; `pnpm lint` exit 0.
