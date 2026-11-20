---
status: testing
phase: 09-plataforma-por-viaje
source: [09-VERIFICATION.md]
started: 2026-11-20T12:45:00Z
updated: 2026-11-20T12:45:00Z
---

## Current Test

number: 1
name: Decidir si la fuga de filas del viaje `prueba` en los `sql_dump.txt` públicos (CR-01 / AR-09-01 / T-09-06) es aceptable hasta la Fase 11
expected: |
  Decisión explícita: (a) aceptar el riesgo (no hay deploy de la rama; el filtro `draft` de ROUTE-05 en la Fase 11 debe cubrir también el dump) y dejar constancia; o (b) abrir un plan de cierre de huecos que aplique `exclude` en `content.config.ts` y haga que el centinela descomprima los dumps
awaiting: user response

## Tests

### 1. Decidir si la fuga de filas del viaje `prueba` en los `sql_dump.txt` públicos (CR-01 / AR-09-01 / T-09-06) es aceptable hasta la Fase 11
expected: Decisión explícita: (a) aceptar el riesgo (no hay deploy de la rama; el filtro `draft` de ROUTE-05 en la Fase 11 debe cubrir también el dump) y dejar constancia; o (b) abrir un plan de cierre de huecos que aplique `exclude` en `content.config.ts` y haga que el centinela descomprima los dumps
result: [pending]

### 2. Prohibición 09-01: la fase nunca borra, renombra, migra ni enumera las claves de localStorage de Roma; solo getItem/setItem por clave exacta
expected: Confirmar el veredicto no autoritativo del verificador (respetada: todo pasa por `tripStorageKey(slug, …)`; `tripCoupling.spec.ts` falla ante `localStorage.clear/removeItem/key/length` y `Object.keys(localStorage)`)
result: [pending]

### 3. Prohibición 09-02: la puerta de datos nunca omite en silencio una carpeta de viaje ni un YAML que no sabe clasificar o parsear (sin fail-open)
expected: Confirmar el veredicto (respetada para todo lo que Content materializa) y decidir si el residual IN-05 (YAML suelto directamente en `content/trips/`, ficheros `.YML` en mayúsculas) se cierra ahora o se aplaza
result: [pending]

### 4. Prohibición 09-05: ningún fichero bajo `content/trips/roma/`, `tests/parity/` (56 goldens) ni `app/assets/css/` se modifica ni se re-baselina
expected: Confirmar el veredicto (respetada: `git diff 79e57e0 HEAD` vacío sobre esas rutas; 56 PNG intactos)
result: [pending]

### 5. Decidir el destino de WR-01 (ids de día `viernes…martes` no reservados → id duplicado en el DOM) y WR-02 (`/#pantheon`, `/guiaRoma/#…`, `../roma#x` pasan `cross-trip-link`)
expected: Decisión: cerrar ahora con un plan `--gaps` (reservar los ids de sección de día y pasar `cross-trip-link` a lista blanca) o diferirlos a la Fase 10 (SHAPE-01 hace los días data-driven y rehace las anclas)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
