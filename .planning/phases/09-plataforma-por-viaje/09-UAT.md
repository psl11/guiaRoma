---
status: diagnosed
phase: 09-plataforma-por-viaje
source: [09-VERIFICATION.md]
started: 2026-11-20T12:45:00Z
updated: 2026-11-22T11:16:46.624Z
---

## Current Test

[testing complete]

## Tests

### 1. Decidir si la fuga de filas del viaje `prueba` en los `sql_dump.txt` públicos (CR-01 / AR-09-01 / T-09-06) es aceptable hasta la Fase 11
expected: Decisión explícita: (a) aceptar el riesgo (no hay deploy de la rama; el filtro `draft` de ROUTE-05 en la Fase 11 debe cubrir también el dump) y dejar constancia; o (b) abrir un plan de cierre de huecos que aplique `exclude` en `content.config.ts` y haga que el centinela descomprima los dumps
result: pass
note: "Superada por la ejecución posterior: la Fase 11 cerró CR-01 — `content.config.ts` aplica `draftExcludes(readTripManifest())` como `source.exclude` y `tests/data/build-isolation.spec.ts` decodifica los `sql_dump.txt` (base64+gzip) para afirmar el aislamiento. Decisión ya tomada y aplicada (opción b, vía ROUTE-05/D-16)."

### 2. Prohibición 09-01: la fase nunca borra, renombra, migra ni enumera las claves de localStorage de Roma; solo getItem/setItem por clave exacta
expected: Confirmar el veredicto no autoritativo del verificador (respetada: todo pasa por `tripStorageKey(slug, …)`; `tripCoupling.spec.ts` falla ante `localStorage.clear/removeItem/key/length` y `Object.keys(localStorage)`)
result: pass
note: "Verificado 2026-11-22: `tests/unit/tripCoupling.spec.ts` verde (guardián de localStorage con dientes)."

### 3. Prohibición 09-02: la puerta de datos nunca omite en silencio una carpeta de viaje ni un YAML que no sabe clasificar o parsear (sin fail-open)
expected: Confirmar el veredicto (respetada para todo lo que Content materializa) y decidir si el residual IN-05 (YAML suelto directamente en `content/trips/`, ficheros `.YML` en mayúsculas) se cierra ahora o se aplaza
result: issue
reported: "cerrar — veredicto confirmado para lo que Content materializa, pero el residual IN-05 sigue abierto y debe cerrarse ahora: `isYaml` (`tests/data/trips.ts:121`, `/\.ya?ml$/`) es sensible a mayúsculas, así que `monuments/foo.YML` se omite en silencio; `listTripDirs` (`trips.ts:148`) solo lista carpetas, así que un `content/trips/algo.yml` suelto se omite en silencio"
severity: minor

### 4. Prohibición 09-05: ningún fichero bajo `content/trips/roma/`, `tests/parity/` (56 goldens) ni `app/assets/css/` se modifica ni se re-baselina
expected: Confirmar el veredicto (respetada: `git diff 79e57e0 HEAD` vacío sobre esas rutas; 56 PNG intactos)
result: pass
note: "Verificado 2026-11-22 sobre la ventana de la Fase 9: `git diff --stat 79e57e0 115f315 -- tests/parity content/trips/roma app/assets/css` vacío; 56 PNG de golden en 115f315."

### 5. Decidir el destino de WR-01 (ids de día `viernes…martes` no reservados → id duplicado en el DOM) y WR-02 (`/#pantheon`, `/guiaRoma/#…`, `../roma#x` pasan `cross-trip-link`)
expected: Decisión: cerrar ahora con un plan `--gaps` (reservar los ids de sección de día y pasar `cross-trip-link` a lista blanca) o diferirlos a la Fase 10 (SHAPE-01 hace los días data-driven y rehace las anclas)
result: pass
note: "Superada por la ejecución posterior: WR-02 cerrado (`cross-trip-link` es lista blanca: solo `#id` o `http(s)://`, `tests/data/invariants.spec.ts:37`); WR-01 cerrado (D-05: slug de día = ancla reservada, cubierto por `dup-id`/`fixed-anchor`, `invariants.spec.ts:36-39`). 208/208 tests verdes."

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-09-3
  truth: "La puerta de datos (`pnpm verify` → `test:data`) nunca omite en silencio un fichero YAML ni una entrada de `content/trips/` que no sabe clasificar: todo lo que no clasifica produce una violación que nombra el fichero (prohibición 09-02, sin fail-open)"
  status: failed
  reason: "User reported: cerrar el residual IN-05 — `foo.YML` (extensión en mayúsculas) y un YAML suelto directamente en `content/trips/` se ignoran sin violación"
  severity: minor
  test: 3
  root_cause: "Dos filtros fail-open en la puerta: (1) `isYaml = (rel) => /\\.ya?ml$/.test(rel)` en `tests/data/trips.ts:121` es sensible a mayúsculas — `loadTripFromFiles` hace `if (!isYaml(rel)) continue` (línea 163), así que `.YML`/`.Yaml` nunca llegan a la rama `stray-file`; (2) `listTripDirs` (`trips.ts:148-153`) filtra `e.isDirectory()`, así que cualquier fichero directamente bajo `content/trips/` desaparece sin violación. Content tampoco ingiere esos ficheros, de modo que no entra contenido sin validar, pero el autor no recibe ninguna señal."
  artifacts:
    - path: "tests/data/trips.ts"
      issue: "isYaml sensible a mayúsculas (l.121) y listTripDirs descarta ficheros de la raíz sin reportarlos (l.148-153)"
    - path: "tests/data/invariants.spec.ts"
      issue: "sin prueba de dientes para `.YML` ni para fichero suelto en la raíz de trips"
  missing:
    - "Detectar YAML sin distinguir mayúsculas (p. ej. `/\\.ya?ml$/i`); un `.YML`/`.Yaml` que Content no ingiere debe producir `stray-file` (o regla propia) nombrando el fichero"
    - "Reportar como violación cualquier fichero (no oculto) directamente bajo `content/trips/`, nombrando la ruta"
    - "Pruebas de dientes en `invariants.spec.ts` para ambos casos (en memoria y/o fixture en disco), sin alterar la expectativa `listTripDirs(FIXTURES) == ['campania-2027','suelto']` salvo que se justifique"
  debug_session: ""
