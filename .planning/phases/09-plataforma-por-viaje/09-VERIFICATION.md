---
phase: 09-plataforma-por-viaje
verified: 2026-11-22T13:35:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - ".planning/phases/09-plataforma-por-viaje/09-01-PLAN.md"
  - ".planning/phases/09-plataforma-por-viaje/09-01-SUMMARY.md"
  - ".planning/phases/09-plataforma-por-viaje/09-02-PLAN.md"
  - ".planning/phases/09-plataforma-por-viaje/09-02-SUMMARY.md"
  - ".planning/phases/09-plataforma-por-viaje/09-03-PLAN.md"
  - ".planning/phases/09-plataforma-por-viaje/09-03-SUMMARY.md"
  - ".planning/phases/09-plataforma-por-viaje/09-04-PLAN.md"
  - ".planning/phases/09-plataforma-por-viaje/09-04-SUMMARY.md"
  - ".planning/phases/09-plataforma-por-viaje/09-05-PLAN.md"
  - ".planning/phases/09-plataforma-por-viaje/09-05-SUMMARY.md"
  - ".planning/phases/09-plataforma-por-viaje/09-06-PLAN.md"
  - ".planning/phases/09-plataforma-por-viaje/09-06-SUMMARY.md"
  - "app/components/MonumentCard.vue"
  - "app/components/SearchBox.vue"
  - "app/components/TripView.vue"
  - "app/composables/useCardNavigation.ts"
  - "app/composables/useSearch.ts"
  - "app/composables/useTripContext.ts"
  - "app/composables/useTripModes.ts"
  - "app/utils/searchIndex.ts"
  - "app/utils/tripStorage.ts"
  - "content/trips/prueba/trip.yml"
  - "package.json"
  - "playwright.trips.config.ts"
  - "scripts/tripManifest.mjs"
  - "shared/schemas.ts"
  - "tests/README.md"
  - "tests/data/build-isolation.spec.ts"
  - "tests/data/fixtures/trips/raiz.yml"
  - "tests/data/invariants.spec.ts"
  - "tests/data/schema.spec.ts"
  - "tests/data/trips.ts"
  - "tests/trips/isolation.spec.ts"
  - "tests/unit/searchIsolation.spec.ts"
  - "tests/unit/tripCoupling.spec.ts"
  - "tests/unit/tripManifest.spec.ts"
  - "tests/unit/tripStorage.spec.ts"
covered_digest: "v4:sha256:0a4bf6d1e94fa383b2a1e9b4f2465ebd4b2a236a39c2a0770c26ea5a651d76f1"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5
  gaps_closed:
    - "G-09-3 (IN-05): .YML/.Yaml en mayusculas y ficheros sueltos en content/trips/ ya producen stray-file (plan 09-06)"
    - "CR-01 (09-REVIEW): carpetas ocultas de viaje validadas por la puerta y rechazadas por scripts/tripManifest.mjs (6473be8)"
    - "WR-01 (09-REVIEW): ficheros no YAML dentro de un viaje -> stray-file (39d33fd)"
    - "CR-01 anterior / AR-09-01 (filas de prueba en sql_dump): resuelto por el filtro draft de la Fase 11"
    - "WR-01/WR-02 anteriores (ids de dia no reservados, enlaces raiz-relativos): cerrados en la Fase 10 (UAT test 5)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Prohibicion 09-06 (juicio, sin tier asignado): la puerta de datos nunca omite en silencio una carpeta de viaje, una entrada de content/trips/ ni un YAML que no sabe clasificar o parsear (sin fail-open)"
    expected: "Confirmar el veredicto NO AUTORITATIVO del verificador: respetada. Evidencia directa: con un zzmayus.YML real en content/trips/prueba/monuments/, con un content/trips/zzsuelto.yml real y con una carpeta oculta content/trips/.zz/, vitest run tests/data sale con codigo 1 y nombra cada fichero ([stray-file], [stray-file], [trip-slug]). unverified-prohibition - human review recommended"
    why_human: "Llega con verification: null / status: unresolved; por contrato nunca se absorbe en un passed silencioso aunque la evidencia sea favorable (el usuario ya confirmo la version previa de esta prohibicion en el UAT, test 3, y pidio cerrar IN-05, que 09-06 cierra)"
  - test: "Prohibicion 09-06 (juicio, sin tier asignado): ningun fichero bajo content/ (incluido content/trips/roma/), tests/parity/ (56 goldens), app/assets/css/ ni content.config.ts se modifica; las mutaciones de prueba dejan git status limpio"
    expected: "Confirmar el veredicto NO AUTORITATIVO del verificador: respetada. Evidencia determinista: git diff 68be7a5 HEAD --stat -- content tests/parity app/assets/css content.config.ts vacio; git status solo muestra .planning/state.json y .planning/ui-reviews/ sin seguimiento tras mis mutaciones. unverified-prohibition - human review recommended"
    why_human: "Llega con verification: null / status: unresolved; por contrato queda marcada para confirmacion humana"
---

# Phase 9: Plataforma por viaje - Informe de verificacion (re-verificacion)

**Objetivo de la fase:** Cualquier guia funciona aislada de las demas - su busqueda, sus enlaces entre fichas, sus preferencias guardadas y la validacion de su contenido pertenecen a su viaje - sin que Roma cambie ni de URL ni de aspecto
**Verificado:** 2026-11-22T13:35:00Z
**Estado:** human_needed
**Re-verificacion:** Si - el informe anterior (2026-11-20) estaba rancio: las fases 10-14 evolucionaron ficheros de la Fase 9, y despues llegaron el plan de cierre 09-06 y los fixes de revision 6473be8 / 39d33fd. Todo se ha re-contrastado contra el codigo actual (HEAD d09ad0a).

## Resumen ejecutivo

El objetivo se cumple en el codigo actual y los 5 criterios de exito del ROADMAP siguen siendo ciertos. No hay huecos (`gaps_found` no aplica) ni verdades presentes-pero-sin-comportamiento. El estado es `human_needed` unicamente porque las dos prohibiciones de `must_haves.prohibitions` del plan 09-06 llegan sin tier de verificacion (`verification: null`, `status: unresolved`): por contrato quedan marcadas como `unverified-prohibition - human review recommended` aunque mi veredicto no autoritativo es favorable en ambas. La fase se completa "con 2 prohibiciones marcadas".

Los riesgos abiertos en el informe anterior estan cerrados: CR-01 de la Fase 9 (filas de `prueba` en `sql_dump`) lo resuelve el filtro `draft` de la Fase 11; WR-01/WR-02 de la puerta, la Fase 10 (reflejado en UAT test 5); IN-05 lo cierra 09-06.

Evidencia independiente de esta verificacion (Node 22.20.0, sin borrar cachés):

- `node_modules/.bin/vitest run tests/unit tests/data` -> 32 ficheros, **1362 tests, todo verde** (568 unit + 794 data; coincide con `pnpm verify` del orquestador: unit 568, data 794, parity 126, exit 0).
- `playwright test -c playwright.trips.config.ts tests/trips/isolation.spec.ts` (nuxi dev, puerto 5300) -> **5 passed (31.4s)**: navegacion, busqueda y preferencias/notas aisladas en `/trips/prueba` y en Roma.
- Mutaciones en disco de la puerta (creadas y borradas en el mismo comando, `git status` limpio despues): `zzmayus.YML`, `content/trips/zzsuelto.yml` y `content/trips/.zz/trip.yml` hacen fallar `tests/data` con exit 1 nombrando el fichero.
- `git diff 79e57e0 HEAD`: los 56 PNG de `tests/parity/` no tienen ninguna modificacion (solo se han AÑADIDO specs en fases posteriores); `content/trips/roma/trip.yml` y `app/assets/css/` solo ganan lineas aditivas (+23, +137) de las fases 10/11. `git diff 68be7a5 HEAD -- content tests/parity app/assets/css content.config.ts` (ventana de 09-06 + revision) vacio.
- Dumps de la build actual (`.output/public/__nuxt_content/*/sql_dump.txt`, gzip+base64 descomprimidos): `trip` 0 apariciones de `prueba`, `day` 0, `monument` 5 que son solo prosa de Roma ("prueba fisica", "aprueban"...), sin `PRUEBA-CENTINELA` ni `fontana-pruebas`; `.output/public/trips/` contiene solo `campania` y `roma` (`prueba` es `draft: true` y queda fuera).

## Logro del objetivo

### Verdades observables (criterios de exito del ROADMAP)

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| SC1 | Con dos viajes (Roma y `prueba`), buscar en cada guia solo devuelve fichas de su viaje ("Pantheon" en Roma si, en `prueba` no) | VERIFIED | `useSearch.ts:63` `const indexes = new Map<string, MiniSearch>()` (una entrada por slug), `useSearch(slug = useTripSlug())`, estado `tripStateKey(slug, 'search:*')`, `indexes.get(slug)` en `onInput`. `tests/unit/searchIsolation.spec.ts` (datos reales, en los 568 verdes) y E2E `isolation.spec.ts:163` y `:195` verdes en esta verificacion. |
| SC2 | En cualquier guia: enlace a ficha -> scroll + resalte, "Volver" restaura la posicion, la pastilla activa sigue al scroll | VERIFIED | `TripView.vue:62` `provideTripSlug(props.slug)` antes del primer `await` y `:75` `await useCardNavigationController(props.slug)` (slug por argumento, trampa del self-inject); `useCardNavigation.ts:58` `useCardNavigation(slug = useTripSlug())` con claves `cardNav:stack:<slug>`/`cardNav:activeSection:<slug>`; el controller usa `useTrip(slug)` (l.186). Truth de transicion de estado respaldada por tests que pasan: E2E `isolation.spec.ts:101` (resalta + Volver restaura scroll) y `:132` (pastilla entre dias de `prueba`) verdes ahora; en Roma, la puerta de paridad (126/126) del orquestador. |
| SC3 | Quien usa Roma conserva notas, ritmo, "caminar menos" y resumen (claves `roma-*` intactas, sin migracion); lo de otro viaje no se mezcla | VERIFIED | `app/utils/tripStorage.ts` `tripStorageKey(slug, name) = ${slug}-${name}` -> `roma-pace/-light/-resumen/-note-<ficha>` byte a byte; `useTripModes.ts:107-109` y `MonumentCard.vue:135` solo `getItem/setItem` por clave exacta via `tripStorageKey(useTripSlug(), ...)`; sin ninguna clave `roma-` literal en `app/` salvo el comentario del tema global (`ThemeToggle.vue`, `storageKey: 'roma-theme'`, D-07); `tripCoupling.spec.ts` falla ante `localStorage.clear/removeItem/key/length` y `Object.keys(localStorage)`; E2E `isolation.spec.ts:214` (verde): con `roma-*` sembradas `prueba` arranca por defecto, escribir en `prueba` no toca `roma-*`. |
| SC4 | Un YAML invalido en cualquier viaje (slug no valido, carpeta != slug, id duplicado, id que choca con ancla, `#ficha` fuera del viaje, nombre reservado de Content) hace fallar `pnpm verify` nombrando el fichero | VERIFIED | `shared/schemas.ts:469` `TRIP_SLUG_RE = /^[a-z0-9]+$/`; `tests/data/trips.ts`: reglas `trip-slug` (l.340-341), `dup-id` (l.384), `fixed-anchor` (l.389), `reserved-key` (l.364), `anchor`/`cross-trip-link` en lista blanca (l.511-536), `stray-file`, `yaml-parse`, `yaml-object`, `trip-yml`; `schema.spec.ts` e `invariants.spec.ts` con `describe.each(listTripDirs())` (borradores incluidos, carpetas ocultas incluidas por 6473be8); `pnpm verify` encadena `test:data`. Dientes por regla en `invariants.spec.ts` (794/794 verdes) y mutaciones en disco confirmadas hoy (`file: [regla] mensaje`). |
| SC5 | La puerta de paridad de Roma sigue verde en `/` sin cambios en `tests/parity/` ni re-baseline | VERIFIED | 56 PNG de golden sin modificar desde `79e57e0` (`git log --diff-filter=M` sobre `tests/parity/**/*.png` vacio); `pnpm verify` del orquestador exit 0, parity 126/126 (80 originales + los añadidos por fases posteriores, sin tocar goldens). Los cambios posteriores sobre `tests/parity/*.spec.ts` y CSS son de fases 10-14, no de la Fase 9. |

**Puntuacion:** 5/5 criterios verificados (0 presentes pero sin comportamiento verificado).

### Cierre del hueco G-09-3 (plan 09-06) - truths del plan

| Truth del plan 09-06 | Estado | Evidencia |
|----------------------|--------|-----------|
| `.YML/.Yml/.YAML/.Yaml` en un viaje -> exactamente una violacion `stray-file` con el fichero | VERIFIED | `trips.ts:136` `isYaml = /\.ya?ml$/i`; `loadTripFromFiles` (l.223-238) manda a `stray-file` lo que no casa con `COLLECTIONS`; mutacion real `zzmayus.YML` -> exit 1 con `content/trips/prueba/monuments/zzmayus.YML: [stray-file]` |
| Entrada no oculta suelta en `content/trips/` -> `stray-file` con su ruta; ocultas ignoradas | VERIFIED | `checkTripsRoot` (l.202-212) sobre `rootEntries`; mutacion real `content/trips/zzsuelto.yml` -> exit 1 con `[stray-file]`; fixtures `raiz.yml` (reportado) y `.oculto.yml` (ignorado) existen |
| `listTripDirs` + `checkTripsRoot` reparten todas las entradas de la raiz | VERIFIED | ambas comparten `rootEntries()` (l.173); en CR-01 se ajusto: los directorios ocultos se devuelven como viajes y fallan con `trip-slug`/`trip-yml` (mutacion `.zz` -> `[trip-slug] slug "prueba" != carpeta ".zz"`) |
| `COLLECTIONS[].match` sigue distinguiendo mayusculas | VERIFIED | el flag `/i` solo esta en `isYaml` (l.136); comentario de contrato en l.133-135 y l.218-221 |
| Arbol real con puertas verdes; Content no ingiere distinto | VERIFIED | 1362/1362; `git diff 68be7a5 HEAD -- content content.config.ts` vacio |
| README 5.3 documenta `checkTripsRoot` | VERIFIED | `tests/README.md` modificado en `bf45c6b`/`6473be8`/`39d33fd` (aparece en `covered_files`) |

Fixes de revision verificados contra el codigo: CR-01 (`rootEntries` conserva los directorios ocultos; `scripts/tripManifest.mjs` ya no filtra nombres ocultos y lanza por `TRIP_FOLDER_RE`), WR-01 (`trips.ts:228-232`: ficheros no YAML no ocultos -> `stray-file`).

### Artefactos requeridos

| Artefacto | Estado | Detalle |
|-----------|--------|---------|
| `app/utils/tripStorage.ts`, `app/composables/useTripContext.ts` | VERIFIED | funciones puras / contexto que lanza fuera de TripView (sin default silencioso); WIRED (auto-imports usados en composables y componentes) |
| `useCardNavigation.ts`, `useSearch.ts`, `useTripModes.ts` | VERIFIED | WIRED: sin viaje fijo, claves por slug; sin `useTrip('roma')` en `app/` |
| `TripView.vue`, `MonumentCard.vue`, `SearchBox.vue` | VERIFIED | WIRED; `TripView` publica el slug y lo pasa al controller |
| `shared/schemas.ts` (`TRIP_SLUG_RE`) | VERIFIED | `roma` y los demas viajes lo cumplen |
| `tests/data/trips.ts`, `invariants.spec.ts`, `schema.spec.ts` | VERIFIED | puerta por viaje con dientes, ahora sin fail-open en extension, raiz, carpetas ocultas ni ficheros no YAML |
| `content/trips/prueba/*` | VERIFIED | viaje ficticio, ahora `draft: true` (excluido de build y dumps) |
| `tests/unit/tripCoupling.spec.ts`, `searchIsolation.spec.ts`, `tripStorage.spec.ts`, `tripManifest.spec.ts` | VERIFIED | dentro de `test:unit` (parte de `verify`) |
| `tests/data/build-isolation.spec.ts`, `playwright.trips.config.ts`, `tests/trips/isolation.spec.ts` | VERIFIED | E2E 5/5 verdes hoy; fuera de `verify` por diseño |
| `tests/data/fixtures/trips/{raiz.yml,.oculto.yml,.oculto-dir/trip.yml}` | VERIFIED | existen y alimentan los tests de dientes |

### Verificacion de enlaces clave

| De | A | Via | Estado |
|----|---|-----|--------|
| `TripView.vue` | `useCardNavigationController` / `provideTripSlug` | slug por argumento y provide antes del primer await | WIRED |
| `SearchBox` -> `useSearch` | `indexes: Map<slug, MiniSearch>` | `indexes.set(slug, createSearchIndex(...))` | WIRED |
| `useTripModes`, `MonumentCard` | `tripStorageKey(slug, ...)` | clave `${slug}-${name}` | WIRED |
| `invariants.spec.ts` | `checkTripsRoot()` / `checkTrip(loadTrip(...))` | `describe.each(listTripDirs())` + aserciones sobre arbol real y fixtures | WIRED |
| `package.json` `verify` | `test:data` | `rm -rf ... && pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity` | WIRED |

### Trazado de flujo de datos (Nivel 4)

| Artefacto | Variable | Fuente | Datos reales | Estado |
|-----------|----------|--------|--------------|--------|
| `useSearch` (indice por slug) | `monById` | `useTrip(slug)` -> `queryCollection('monument').where('trip','=',slug)` | Si (E2E devuelve fichas reales por viaje) | FLOWING |
| `useCardNavigationController` | `monById` | `useTrip(slug)` | Si | FLOWING |
| `useTripModes` / `MonumentCard` | claves `localStorage` | `tripStorageKey(slug, ...)` leidas en `onMounted` | Si (E2E siembra y lee) | FLOWING |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Unit + data | `vitest run tests/unit tests/data` | 32 ficheros, 1362 passed | PASS |
| Aislamiento E2E por viaje | `playwright test -c playwright.trips.config.ts tests/trips/isolation.spec.ts` | 5 passed (31.4s) | PASS |
| `.YML` real en un viaje | `cp spagna.yml zzmayus.YML; vitest run tests/data` | exit 1, `zzmayus.YML: [stray-file]` | PASS (la puerta falla como debe) |
| YAML suelto en la raiz | `content/trips/zzsuelto.yml` | exit 1, `[stray-file]` | PASS |
| Carpeta oculta de viaje | `content/trips/.zz/trip.yml` | exit 1, `[trip-slug]` | PASS |
| Dumps sin viaje borrador | descompresion gzip+base64 de `sql_dump.txt` | `trip`/`day`: 0 `prueba`; `monument`: solo prosa de Roma | PASS |

### Ejecucion de sondas (Paso 7c)

Ninguna sonda `probe-*.sh` declarada ni convencional: SKIPPED.

### Cobertura de requisitos

Los IDs de los PLAN (PLAT-01..04; 09-06 declara PLAT-04) estan en REQUIREMENTS.md, marcados `[x]`/Complete, y son los unicos mapeados a la Fase 9 (sin huerfanos).

| Requisito | Planes | Descripcion | Estado | Evidencia |
|-----------|--------|-------------|--------|-----------|
| PLAT-01 | 09-03, 09-04, 09-05 | La busqueda de una guia solo devuelve fichas de ese viaje | SATISFIED | SC1 |
| PLAT-02 | 09-01, 09-04, 09-05 | Enlaces entre fichas, "Volver" y scrollspy dentro de cualquier viaje | SATISFIED | SC2 |
| PLAT-03 | 09-01, 09-04, 09-05 | Notas/ritmo/caminar menos/resumen por viaje; claves `roma-*` intactas | SATISFIED | SC3 |
| PLAT-04 | 09-02, 09-03, 09-05, 09-06 | Contenido validado por viaje; un YAML invalido rompe `pnpm verify` | SATISFIED | SC4 + cierre G-09-3 |

### Anti-patrones

Barrido de `TBD|FIXME|XXX` en los ficheros de la fase: ninguno sin referencia. Sin stubs ni `return null` en las rutas de datos de los composables. Los avisos WR-03 (watch tras `await` sin scope), WR-04 (`useTripModes` sin try/catch en localStorage) y WR-05 del informe previo son preexistentes/no bloqueantes y no afectan a ningun SC.

### Prohibiciones (ADR-550, veredictos NO AUTORITATIVOS)

| Prohibicion | Tier | Veredicto | Marca |
|-------------|------|-----------|-------|
| 09-06 (1): puerta sin fail-open | `verification: null` | respetada (mutaciones en disco y 794/794) | unverified-prohibition - human review recommended |
| 09-06 (2): no tocar `content/`, `tests/parity/`, CSS, `content.config.ts` | `verification: null` | respetada (diff vacio sobre la ventana, `git status` limpio) | unverified-prohibition - human review recommended |

Las prohibiciones de 09-01/09-02/09-05 las confirmo el usuario en UAT (tests 2, 3 y 4: pass; la de 09-02 reabierta como G-09-3 y cerrada por 09-06).

## Verificacion humana requerida

### 1. Prohibicion 09-06 (puerta sin fail-open)

**Test:** Confirmar el veredicto no autoritativo (respetada).
**Expected:** `zzmayus.YML`, `content/trips/zzsuelto.yml` y `content/trips/.zz/` hacen fallar `pnpm test:data` nombrando el fichero.
**Why human:** Sin tier declarado (`verification: null`).

### 2. Prohibicion 09-06 (no tocar Roma, goldens, CSS, content.config.ts)

**Test:** Confirmar el veredicto no autoritativo (respetada).
**Expected:** `git diff 68be7a5 HEAD -- content tests/parity app/assets/css content.config.ts` vacio.
**Why human:** Sin tier declarado (`verification: null`).

## Resumen de huecos

Ninguno. Verdades 5/5, G-09-3 cerrado, fixes de revision (CR-01, WR-01) verificados en codigo y con mutaciones reales, todas las puertas automaticas en verde. Solo quedan las dos confirmaciones humanas de prohibiciones sin tier.

---

_Verified: 2026-11-22T13:35:00Z_
_Verifier: Claude (gsd-verifier)_
