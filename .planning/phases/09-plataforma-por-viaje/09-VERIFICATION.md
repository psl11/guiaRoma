---
phase: 09-plataforma-por-viaje
verified: 2026-11-20T12:30:00Z
status: human_needed
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
  - "shared/schemas.ts"
  - "tests/data/build-isolation.spec.ts"
  - "tests/data/invariants.spec.ts"
  - "tests/data/schema.spec.ts"
  - "tests/data/trips.ts"
  - "tests/trips/isolation.spec.ts"
  - "tests/unit/searchIsolation.spec.ts"
  - "tests/unit/tripCoupling.spec.ts"
  - "tests/unit/tripStorage.spec.ts"
covered_digest: "v4:sha256:37977fefd2e003547b82fe30db5affd0284859805ab6e51537a4de1757b1bf41"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Decidir si la fuga de las filas del viaje `prueba` en `.output/public/__nuxt_content/{trip,monument,day}/sql_dump.txt` (CR-01 / AR-09-01 / T-09-06) es aceptable hasta la Fase 11, o si se excluye `trips/prueba/**` de las fuentes de Content en producción ya en la Fase 9"
    expected: "Decisión explícita del usuario: (a) aceptar el riesgo (no hay deploy en la rama; el filtro `draft` de ROUTE-05 en la Fase 11 debe cubrir también el dump) y dejar constancia; o (b) abrir un plan de cierre de huecos que aplique `exclude` en `content.config.ts` y haga que el centinela descomprima los dumps"
    why_human: "D-02 dice «solo dev; en la build estática no se prerenderiza ni se enlaza» (cumplido a la letra) pero el dump público contiene las filas de prueba y, en GitHub Pages, `404.html` (shell SPA) podría renderizar `/trips/prueba` en cliente. Es una decisión de riesgo/alcance que el verificador no puede cerrar solo; el estado actual está documentado como riesgo aceptado, no como defecto de los criterios de éxito"
  - test: "Prohibición 09-01 (juicio, sin tier asignado): «la fase nunca borra, renombra, migra ni enumera las claves de localStorage de Roma; solo getItem/setItem por clave exacta»"
    expected: "Revisión humana del veredicto NO AUTORITATIVO del verificador: respetada (todas las lecturas/escrituras pasan por `tripStorageKey(slug, …)`; `tripCoupling.spec.ts` falla ante `localStorage.clear/removeItem/key/length` y `Object.keys(localStorage)`); `unverified-prohibition — human review recommended`"
    why_human: "La prohibición llega con `status: unresolved` y `verification: null`: no hay tier de verificación declarado, así que por contrato se marca para revisión humana aunque la evidencia grep sea favorable"
  - test: "Prohibición 09-02 (juicio, sin tier asignado): «la puerta de datos nunca omite en silencio una carpeta de viaje ni un YAML que no sabe clasificar o parsear (sin fail-open)»"
    expected: "Revisión humana del veredicto NO AUTORITATIVO: respetada para todo lo que Content materializa (stray-file, trip-yml, yaml-parse, yaml-object con dientes); residual conocido IN-05: un YAML suelto directamente en `content/trips/` y los ficheros `.YML` en mayúsculas no se reportan (Content tampoco los ingiere). `unverified-prohibition — human review recommended`; decidir si IN-05 se cierra ahora o se aplaza"
    why_human: "Sin tier declarado (`verification: null`); además hay un caso límite (IN-05) que el humano debe clasificar como aceptable o como hueco"
  - test: "Prohibición 09-05 (juicio, sin tier asignado): «ningún fichero bajo `content/trips/roma/`, `tests/parity/` (56 goldens) ni `app/assets/css/` se modifica ni se re-baselina»"
    expected: "Revisión humana del veredicto NO AUTORITATIVO: respetada con evidencia determinista (`git diff 79e57e0 HEAD --stat -- tests/parity content/trips/roma app/assets nuxt.config.ts` vacío; 56 PNG intactos; `git status` limpio salvo `.planning/state.json`). `unverified-prohibition — human review recommended`"
    why_human: "Sin tier declarado (`verification: null`); por contrato se marca como pendiente de confirmación humana"
  - test: "Decidir el destino de los falsos negativos de la puerta de datos WR-01 (los 5 ids `viernes…martes` que TripView renderiza siempre no están reservados: una ficha `lunes` en un viaje sin día `lunes` pasa la puerta pero duplica el id en el DOM) y WR-02 (`[x](/#pantheon)`, `[x](/guiaRoma/#pantheon)`, `[x](../roma#x)` pasan `cross-trip-link`)"
    expected: "Decisión: cerrar ahora con un plan `--gaps` (reservar `DAY_SECTION_IDS` y pasar `cross-trip-link` a lista blanca) o diferirlos a la Fase 10 (SHAPE-01 hace los días data-driven y rehace las anclas). Verificado por el verificador contra `tests/data/trips.ts:51-55,282-287` y `TripView.vue:123-151`"
    why_human: "SC4 enumera «id que choca con un ancla de sección» y «enlace fuera del viaje»; los casos listados están cubiertos con dientes, pero estos dos huecos de borde son reales y la decisión de cuándo cerrarlos es de alcance"
---

# Phase 9: Plataforma por viaje — Informe de verificación

**Objetivo de la fase:** Cualquier guía funciona aislada de las demás — su búsqueda, sus enlaces entre fichas, sus preferencias guardadas y la validación de su contenido pertenecen a su viaje — sin que Roma cambie ni de URL ni de aspecto
**Verificado:** 2026-11-20T12:30:00Z
**Estado:** human_needed
**Re-verificación:** No — verificación inicial

## Resumen ejecutivo

El objetivo se cumple en el código: los 5 criterios de éxito del ROADMAP están verificados contra el código real, no contra los SUMMARY. No hay huecos bloqueantes (`gaps_found` no aplica). El estado es `human_needed` porque (a) tres prohibiciones de `must_haves.prohibitions` llegan sin tier de verificación (`verification: null`, `status: unresolved`) y por contrato quedan marcadas como `unverified-prohibition — human review recommended` aunque mi veredicto no autoritativo es favorable, y (b) hay dos decisiones de alcance/riesgo que debe tomar una persona (CR-01 y los falsos negativos WR-01/WR-02 de la puerta). La fase se completa «con 3 prohibiciones marcadas».

Evidencia independiente recogida en esta verificación (Node 22.20.0):

- `npx vitest run tests/unit tests/data` → **17 ficheros, 427 tests, todo verde** (164 unit + 263 data, coincide con el dato del orquestador).
- `pnpm test:trips` (nuxi dev, puerto 5300, caché `.data .nuxt` borrada antes) → **5 passed (28.1s)**: navegación, búsqueda y preferencias/notas aisladas en `/trips/prueba` y en Roma.
- `git diff 79e57e0 HEAD --stat -- tests/parity content/trips/roma app/assets nuxt.config.ts scripts playwright.gate.config.ts` → **vacío**; 56 PNG de golden intactos; `git status` solo muestra `.planning/state.json` sin seguimiento.
- Barrido `grep` en `app/`: ya no queda `useTrip('roma')` en ningún composable ni componente salvo `app/pages/index.vue` (`<TripView slug="roma" />`, el hogar de Roma en `/`, deliberado); ninguna clave `roma-` literal ni `useState` sin `tripStateKey`.
- Build en `.output` (generada desde el código de HEAD): `index.html` y `_payload.json` sin `PRUEBA-CENTINELA-9F3`; no existe `.output/public/trips`.
- No se ejecutó de nuevo `pnpm verify` completo (borra y regenera `.output` y lanza 80 tests de paridad); me apoyo en la ejecución limpia del orquestador (exit 0, unit 164 / data 263 / parity 80) y en la comprobación de que `tests/parity/` no tiene diff.

## Logro del objetivo

### Verdades observables (criterios de éxito del ROADMAP)

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| SC1 | Con dos viajes (Roma y `prueba`), buscar en cada guía solo devuelve fichas de su viaje («Pantheon» en Roma sí, en `prueba` no) | ✓ VERIFIED | `app/composables/useSearch.ts`: `const indexes = new Map<string, MiniSearch>()` (una entrada por slug), `useSearchController` lee `useTripSlug()` en su primera sentencia, claves `search:query:<slug>` vía `tripStateKey`. `tests/unit/searchIsolation.spec.ts` (datos reales; verde) y E2E `isolation.spec.ts:163` y `:195` (verdes en esta verificación: «Pantheon» sin resultados en `prueba`, «Fontana»/«Escalinata» solo fichas de prueba, Roma sin fichas de prueba). `tests/parity/search-route.spec.ts` sin diff. |
| SC2 | En cualquier guía, no solo Roma: enlace a ficha → scroll + resalte; «Volver» restaura la posición; la pastilla activa sigue al scroll | ✓ VERIFIED | `TripView.vue:68` `provideTripSlug(props.slug)` antes del primer `await` y `await useCardNavigationController(props.slug)` por argumento (trampa del self-inject); `useCardNavigation.ts:58` `useCardNavigation(slug = useTripSlug())` con claves `cardNav:stack:<slug>` / `cardNav:activeSection:<slug>`; el controller consulta `useTrip(slug)` (línea 186), ya no un viaje fijo. Comportamiento (state transition) respaldado por tests que pasan: E2E `isolation.spec.ts:101` (resalta + «Volver» restaura scroll, timeline y prosa) y `:132` (pastilla de `#viernes` a `#sabado`) verdes; en Roma, `tests/parity/navigation.spec.ts` sin diff y verde en la puerta del orquestador (ver nota de flakiness abajo). |
| SC3 | Quien usa Roma conserva notas, ritmo, «caminar menos» y resumen (claves `roma-*` intactas, sin migración); lo de otro viaje no se mezcla | ✓ VERIFIED | `app/utils/tripStorage.ts`: `tripStorageKey(slug, name) = \`${slug}-${name}\`` → para `roma` produce byte a byte `roma-pace/-light/-resumen/-note-<ficha>`; `useTripModes.ts` y `MonumentCard.vue:127` usan solo `getItem/setItem` por clave exacta; ritmo validado contra los 3 literales. `tests/unit/tripStorage.spec.ts` fija la identidad con las claves vivas. E2E `isolation.spec.ts:214` (verde): con `roma-pace=slow`, `roma-light=1`, `roma-resumen=1`, `roma-note-spagna` sembrados, `prueba` arranca con valores por defecto; escribir en `prueba` deja intactas las `roma-*`; al volver a Roma sus valores siguen ahí. `tests/parity/modes.spec.ts` (14) y `map-fallback-notes.spec.ts` (12) sin diff. Tema global: `nuxt.config.ts` sin diff, `storageKey: 'roma-theme'` (D-07). |
| SC4 | Un YAML inválido de cualquier viaje (slug no válido, carpeta ≠ slug, id duplicado, id que choca con ancla de sección, `#ficha` fuera del viaje, nombre reservado de Content) hace fallar `pnpm verify` señalando el fichero | ✓ VERIFIED (con avisos WR-01/WR-02) | `shared/schemas.ts:331,335` `TRIP_SLUG_RE = /^[a-z0-9]+$/` en `TripSchema.slug`; `tests/data/trips.ts` (`loadTrip` recursivo, `checkTrip`, `Violation {file, rule, message}`); `schema.spec.ts:44` e `invariants.spec.ts:45` con `describe.each(listTripDirs())` (borradores incluidos, D-09); bloque «dientes» (`invariants.spec.ts:127-252`) con una prueba por regla: `trip-slug` (`campania-2027` en disco, `otro` ≠ carpeta), `dup-id`, `fixed-anchor`, `reserved-key`, `anchor`, `cross-trip-link`, `yaml-parse`, `yaml-object`, `trip-yml`, `stray-file`… Todos verdes (427/427). `pnpm verify` encadena `test:data`. Avisos reales confirmados por lectura de `trips.ts:51-55,282-287` y `TripView.vue:123-151` (ver «Avisos»). |
| SC5 | La puerta de paridad de Roma sigue verde en `/` sin cambios en `tests/parity/` ni re-baseline | ✓ VERIFIED | `git diff 79e57e0 HEAD -- tests/parity/ content/trips/roma app/assets nuxt.config.ts` vacío; 56 PNG de golden sin diff; `package.json` solo cambia `scripts` (`test:trips`, `verify` con limpieza de cachés); dependencias idénticas. `pnpm verify` exit 0 aportado por el orquestador (parity 80 passed). |

**Puntuación:** 5/5 criterios verificados (0 presentes pero sin comportamiento verificado).

### Decisiones D-01..D-12 (09-CONTEXT.md)

| Decisión | Estado | Evidencia |
|----------|--------|-----------|
| D-01 viaje ficticio mínimo `prueba` | ✓ | `content/trips/prueba/`: `trip.yml`, 2 días (`viernes`, `sabado`), 3 fichas (`fontana-pruebas`, `torre-ensayo`, `spagna`); sin campos de esquema nuevos |
| D-02 `prueba` solo dev; Roma no descarga datos de prueba | ⚠️ PARCIAL | A la letra: `nitro.prerender.routes` sigue `['/']`, nada enlaza a `/trips/prueba`, no existe `.output/public/trips`, `index.html`/`_payload.json` sin centinela. Pero los `sql_dump.txt` públicos contienen filas de `prueba` (verificado: `trip` 3 apariciones + centinela; `monument` 23 + centinela; `day` 8). Ver CR-01 y primer ítem de verificación humana |
| D-03 sin campos de esquema nuevos; hallazgo para Fase 10 | ✓ | Documentado en la cabecera de `content/trips/prueba/trip.yml` (días `viernes…martes` porque TripView solo monta esos 5) |
| D-04 claves `${slug}-${name}` | ✓ | `tripStorage.ts`, `useTripModes.ts`, `MonumentCard.vue` |
| D-05 slug `^[a-z0-9]+$` | ✓ | `TRIP_SLUG_RE` en esquema + regla `trip-slug` de la puerta + fixture `campania-2027` |
| D-06 mismos defaults para todos los viajes | ✓ | `useState(…, () => 'optimistic' / false / false)`; E2E de defaults verde |
| D-07 tema global `roma-theme` | ✓ | `nuxt.config.ts` sin diff |
| D-08 `useState` por viaje + índice MiniSearch por slug | ✓ | `tripStateKey` en `useSearch`, `useCardNavigation`, `useTripModes`; `Map<string, MiniSearch>`; guardián `tripCoupling.spec.ts`; centinela de claves `$space:roma` en `build-isolation.spec.ts` |
| D-09 mismo rigor para todos los viajes (borradores incluidos) | ✓ | `describe.each(listTripDirs())`; viaje con solo `trip.yml` sin violaciones (test) |
| D-10 invariantes por viaje con fichero culpable | ✓ | `Violation.file` = ruta de repo; `formatViolations` → `file: [regla] mensaje` |
| D-11 `#ficha` fuera del viaje rompe verify | ✓ (con WR-02 sobre enlaces raíz-relativos) | regla `anchor` + `cross-trip-link` con dientes |
| D-12 conteos y `migration-diff` solo de Roma | ✓ | `migration-diff.spec.ts` y `scripts/migration-diff.ts` sin diff; esquema/invariantes iteran todos los viajes |

### Artefactos requeridos

`gsd-tools verify.artifacts` sobre los 5 PLAN: 7/7, 6/6, 5/5, 4/4 y 3/3 pasan (existen, sustantivos, con el patrón esperado). Lectura directa de los ficheros críticos: no son stubs.

| Artefacto | Estado | Detalle |
|-----------|--------|---------|
| `app/utils/tripStorage.ts` | ✓ VERIFIED | funciones puras, auto-importadas; test de contrato |
| `app/composables/useTripContext.ts` | ✓ VERIFIED | `provideTripSlug` / `useTripSlug` (lanza fuera de TripView, sin default silencioso) |
| `app/composables/useCardNavigation.ts`, `useSearch.ts`, `useTripModes.ts` | ✓ VERIFIED | WIRED: sin viaje fijo, claves por slug |
| `app/components/TripView.vue`, `MonumentCard.vue`, `SearchBox.vue` | ✓ VERIFIED | WIRED |
| `shared/schemas.ts` | ✓ VERIFIED | `TRIP_SLUG_RE` aditivo; `roma` cumple |
| `tests/data/trips.ts`, `invariants.spec.ts`, `schema.spec.ts` | ✓ VERIFIED | puerta por viaje con dientes |
| `content/trips/prueba/*` (6 ficheros) | ✓ VERIFIED | pasan la puerta con 0 violaciones |
| `tests/unit/tripCoupling.spec.ts`, `searchIsolation.spec.ts`, `tripStorage.spec.ts` | ✓ VERIFIED | dentro de `test:unit` (parte de `verify`) |
| `tests/data/build-isolation.spec.ts` | ✓ VERIFIED (alcance limitado) | detecta Roma sin centinela y claves sufijadas; NO mira los dumps (ver CR-01 e IN-02) |
| `playwright.trips.config.ts`, `tests/trips/isolation.spec.ts`, script `test:trips` | ✓ VERIFIED | 5/5 verdes; fuera de `verify` y de `tests/parity/` como se planificó |

### Verificación de enlaces clave

`gsd-tools verify.key-links`: planes 01, 02, 04 y 05 completos; plan 03: 4/5. El enlace «no verificado» (`tests/unit/searchIsolation.spec.ts` → `tests/data/trips.ts` por el patrón `loadTrip\('prueba'\)`) es un falso negativo de patrón: el spec importa `listTripDirs, loadTrip` (línea 2) y lee `prueba` mediante el helper `monumentsOf('prueba')`; el enlace funcional existe y el test pasa.

### Trazado de flujo de datos (Nivel 4)

| Artefacto | Variable | Fuente | Datos reales | Estado |
|-----------|----------|--------|--------------|--------|
| `useSearch` (índice por slug) | `monById` | `useTrip(slug)` → `queryCollection('monument').where('trip','=',slug)` | Sí (E2E devuelve fichas reales por viaje) | ✓ FLOWING |
| `useCardNavigationController` | `monById` | `useTrip(slug)` | Sí | ✓ FLOWING |
| `useTripModes` / `MonumentCard` | claves `localStorage` | `tripStorageKey(slug, …)` leídas en `onMounted` | Sí (E2E siembra y lee) | ✓ FLOWING |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Unit + data (427) | `npx vitest run tests/unit tests/data` | 17 ficheros, 427 passed | ✓ PASS |
| Aislamiento E2E por viaje | `pnpm test:trips` | 5 passed (28.1s) | ✓ PASS |
| Build sin datos de prueba en Roma | `grep PRUEBA-CENTINELA` en `index.html` / `_payload.json`; `ls .output/public/trips` | 0 / 0 / no existe | ✓ PASS |
| Dumps públicos sin filas de prueba | descompresión gzip+base64 de `__nuxt_content/*/sql_dump.txt` | `trip`, `monument` y `day` contienen `prueba` (centinela en `trip` y `monument`) | ✗ FAIL (riesgo aceptado, ver CR-01) |

Nota sobre `tests/parity/navigation.spec.ts` «SC#2 scrollspy» [mobile]: el orquestador informa de un fallo aislado por timeout (~29,3 s frente al límite de 30 s en todas las olas, pasa 6/6 en serie). No hay diff de `app/` entre la puerta verde de la ola 3 y esa ejecución, y `tests/parity/` no cambió, por lo que es una fragilidad de carga preexistente y no un defecto introducido por la fase. Lo registro como observación, no como hueco.

### Ejecución de sondas (Paso 7c)

Ninguna sonda `probe-*.sh` declarada en los PLAN ni convencional (`scripts/*/tests/probe-*.sh`): el paso se omite («SKIPPED, no probes declared»).

### Cobertura de requisitos

Todos los IDs de los PLAN (PLAT-01..04) están en REQUIREMENTS.md y son los únicos mapeados a la Fase 9 (sin requisitos huérfanos).

| Requisito | Planes | Descripción | Estado | Evidencia |
|-----------|--------|-------------|--------|-----------|
| PLAT-01 | 09-03, 09-04, 09-05 | La búsqueda de una guía solo devuelve fichas de ese viaje | ✓ SATISFIED | SC1; `searchIsolation.spec.ts` + E2E |
| PLAT-02 | 09-01, 09-04, 09-05 | Enlaces entre fichas, «Volver» y scrollspy dentro de cualquier viaje | ✓ SATISFIED | SC2; E2E en `/trips/prueba` + paridad en Roma |
| PLAT-03 | 09-01, 09-04, 09-05 | Notas, ritmo, «caminar menos» y resumen por viaje; claves `roma-*` intactas | ✓ SATISFIED | SC3; `tripStorage.spec.ts` + E2E |
| PLAT-04 | 09-02, 09-03, 09-05 | Contenido validado por viaje; un YAML inválido rompe `pnpm verify` | ✓ SATISFIED (con avisos WR-01/WR-02/IN-05) | SC4; puerta con dientes |

### Anti-patrones

Barrido de marcadores de deuda (`TBD|FIXME|XXX|TODO|HACK`) en los ficheros modificados por la fase: **ninguno** (las coincidencias de «TODOS» son prosa en español). Sin stubs: ningún `return null`/`=> {}` vacío en las rutas de datos de los composables modificados. No hay anti-patrones bloqueantes.

| Fichero | Patrón | Severidad | Impacto |
|---------|--------|-----------|---------|
| `app/composables/useCardNavigation.ts:190`, `useSearch.ts:161` (WR-03) | `watch` creado tras el `await` interno sin scope propio: no se detiene al desmontar | ⚠️ Warning | fuga de un watcher por montaje y por controller; preexistente, ahora más relevante al poder cambiar de viaje |
| `app/composables/useTripModes.ts:110-121` (WR-04) | `localStorage` sin try/catch (MonumentCard sí lo protege) | ⚠️ Warning | con almacenamiento bloqueado, los modos dejan de funcionar; preexistente |
| `tests/unit/tripCoupling.spec.ts` (WR-05) | solo escanea 3 directorios sin recursión | ⚠️ Warning | acoplamiento futuro en `app/pages`, `app/plugins` o subcarpetas pasaría el guardián |

### Avisos (no bloqueantes) y observaciones

- **CR-01 / D-02 (la pregunta del orquestador).** Mi juicio: **los criterios de éxito (SC1-SC5) y PLAT-01..04 siguen cumpliéndose**; el riesgo no pertenece a ningún SC. D-02 se cumple a la letra («no se prerenderiza ni se enlaza»; el centinela de Roma pasa), pero no en espíritu completo, porque el dump público de Content sí lleva las filas de `prueba` y el `404.html` shell SPA podría renderizar `/trips/prueba` en cliente en Pages (inferido, no probado en navegador por el revisor ni por mí). Atenuantes comprobados: no existe `.github/workflows`, no hay despliegue (v1.0 D-08), el contenido es ficticio y sin datos de usuario, y la Fase 11 (ROUTE-05, hoy Pending en REQUIREMENTS.md) es la dueña del filtro `draft`. Lo clasifico **WARNING con decisión humana**, no BLOCKER: ejecutar `/gsd-ship` o desplegar antes de la Fase 11 sin resolver esto expondría la guía de prueba. Además, `build-isolation.spec.ts` da falsa seguridad respecto a los dumps (gzip+base64, nunca coincidirían con un `grep`); mejorarlo es barato (IN-02 / fix propuesto en 09-REVIEW.md).
- **Cambio del haystack de búsqueda (commit 737d796, `searchIndex.ts`).** Se indexa el texto de los enlaces Markdown y no su destino (`](#ficha)`). El `index.html` original buscaba sobre `card.textContent` (texto visible, sin hrefs), así que el cambio acerca Roma al original y no la aleja; no altera el aspecto (HTML y píxeles) ni los 56 goldens, y la paridad sigue verde. Cambia el top-8 de «art», «arq» y «Bernini» en Roma, lo cual es un cambio de ranking observable pero hacia la fidelidad. **No entra en conflicto con «Roma no cambia de aspecto»**; solo lo señalo por transparencia (la deuda previa de ranking «Pante» de v1.0 sigue anotada en PROJECT.md).
- **WR-01 / WR-02 / IN-03 / IN-05 (puerta de datos).** Confirmados por lectura del código: `FIXED_DOM_IDS` no reserva `viernes…martes` aunque TripView renderiza esas cinco `<section>` siempre; y `cross-trip-link` solo reconoce `/trips/`, así que `[x](/#pantheon)` pasa. Son falsos negativos de borde, ninguno afecta a Roma hoy ni a los casos que enumera SC4. Probablemente se resuelven mejor en la Fase 10 (SHAPE-01 hace los días data-driven), pero hay que acordarlo para que la puerta no quede con ese agujero.
- Los 11 hallazgos de la revisión (09-REVIEW.md) están en `open` en 09-REVIEW-DISPOSITION.md: ninguno triado todavía.

## Verificación humana requerida

### 1. Decisión sobre CR-01 / AR-09-01 (filas de `prueba` en `sql_dump.txt`)

**Test:** Decidir si se acepta el riesgo hasta la Fase 11 o se corrige ya (excluir `trips/prueba/**` de `content.config.ts` en producción y hacer que el centinela descomprima los dumps).
**Expected:** Decisión registrada (aceptar con nota en la Fase 11 / ROUTE-05, o plan de cierre `--gaps`).
**Why human:** Es una decisión de riesgo y alcance; D-02 se cumple a la letra pero no del todo en espíritu.

### 2. Tres prohibiciones sin tier de verificación (`unverified-prohibition`)

**Test:** Confirmar los veredictos NO AUTORITATIVOS del verificador sobre las prohibiciones de 09-01 (no borrar/migrar/enumerar `roma-*`), 09-02 (sin fail-open en la puerta) y 09-05 (sin tocar `content/trips/roma/`, `tests/parity/`, CSS, ni re-baseline).
**Expected:** Las tres respetadas: 09-01 por grep + guardián con dientes; 09-05 por `git diff` vacío y 56 goldens intactos; 09-02 respetada salvo el borde IN-05 (fichero suelto en `content/trips/` o extensión `.YML`).
**Why human:** Llegan con `verification: null` / `status: unresolved`; por contrato nunca se absorben en un `passed` silencioso.

### 3. Destino de WR-01/WR-02 (huecos de borde de la puerta de datos)

**Test:** Elegir entre cerrarlos ahora (reservar `DAY_SECTION_IDS`; `cross-trip-link` como lista blanca) o diferirlos a la Fase 10.
**Expected:** Decisión explícita; si se difiere, anotarlo como entrada de la Fase 10.
**Why human:** El alcance de SC4 está cubierto en sus casos listados; estos son huecos de borde cuyo momento de cierre decide el usuario.

## Resumen de huecos

No hay huecos que bloqueen el objetivo: los 5 criterios de éxito y los 4 requisitos están respaldados por código, tests que pasan en esta verificación y un diff vacío sobre `tests/parity/`. Lo pendiente es de decisión humana (riesgo CR-01, prohibiciones sin tier y alcance de WR-01/WR-02), no de implementación faltante.

---

_Verificado: 2026-11-20T12:30:00Z_
_Verificador: Claude (gsd-verifier)_
