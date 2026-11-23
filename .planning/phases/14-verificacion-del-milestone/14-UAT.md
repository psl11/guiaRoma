---
status: testing
phase: 14-verificacion-del-milestone
source: [14-03-SUMMARY.md]
started: 2026-11-22T02:11:00Z
updated: 2026-11-22T02:11:00Z
---

## Current Test

number: 1
name: Portada y vuelta a la portada
expected: |
  En `/guiaRoma/` aparece «Guías de viaje» con Campania primero y Roma después. Cada tarjeta abre su guía, y «← Todos los viajes», al pie de cada guía, vuelve a la portada.
awaiting: user response

## Antes de empezar: abrir la build en el móvil

No es un test, es la preparación (una vez):

1. Node 22 en el PATH: `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH"`.
2. Build limpia: `rm -rf .data .nuxt .output && pnpm generate`.
3. Copiar la build dentro de una carpeta `guiaRoma/`: `mkdir -p <dir>/guiaRoma && cp -r .output/public/. <dir>/guiaRoma/`.
4. Servir `<dir>` (la carpeta padre) en la red local, por ejemplo `cd <dir> && python3 -m http.server 5090 --bind 0.0.0.0`, y abrir en el móvil, conectado a la misma Wi-Fi, `http://<IP del PC>:5090/guiaRoma/`.
5. No servir `.output/public` en la raíz: la página sale en blanco (todo cuelga de `/guiaRoma/`).
6. Con WSL2, el móvil llega a Windows, no a WSL. Hace falta la red en modo espejo (`networkingMode=mirrored` en `.wslconfig`) o una regla `netsh interface portproxy` más un permiso en el firewall de Windows. Al terminar, quitarlos.
7. Al acabar, parar el servidor.

## Tests

### 1. Portada y vuelta a la portada
expected: En `/guiaRoma/` aparece «Guías de viaje» con Campania primero y Roma después. Cada tarjeta abre su guía, y «← Todos los viajes», al pie de cada guía, vuelve a la portada.
result: [pending]

### 2. Roma en el móvil (iOS o Android), tema claro y oscuro
expected: Se ve como la guía de siempre, sin destellos de tema al cargar. El tema elegido se recuerda al recargar.
result: [pending]

### 3. Campania en el móvil, tema claro y oscuro
expected: Los días, las bandas de ferry, coche y autobús, la caja «Con niños» y el mapa se leen bien en los dos temas, y nada desborda a lo ancho.
result: [pending]

### 4. Notas por viaje
expected: Una nota escrita en una ficha de Roma y otra en una ficha de Campania siguen ahí tras recargar, y ninguna aparece en la otra guía.
result: [pending]

### 5. Ritmo y modos por viaje
expected: Con Roma en «Neutra» + «Modo resumen» y Campania en «Caminar menos», al volver a cada guía cada una conserva lo suyo y no cambia la otra.
result: [pending]

### 6. «Ver ruta del día» abre Google Maps en el modo correcto
expected: En Roma abre la ruta a pie. En Campania, el jueves 24 y el viernes 25 en coche, y el martes 22 en transporte público. No hay botón el sábado 19, el domingo 20, el lunes 21, el domingo 27 ni el lunes 28.
result: [pending]

### 7. Sin conexión en Roma, con la guía ya abierta
expected: Con la guía de Roma ya abierta, se activa el modo avión SIN recargar. Las fotos que no habían cargado muestran su dibujo, y el mapa, al moverlo a una zona sin cargar, muestra «Sin conexión · solo marcadores visibles». Recargar sin red no forma parte de la 1.x (no hay PWA, es de la v2): una página en blanco tras recargar sin conexión no es un defecto de esta fase.
result: [pending]

### 8. Sin conexión en Campania, con la guía ya abierta
expected: Lo mismo que en el test 7, en Campania: con la guía ya abierta y en modo avión, sin recargar, las fotos que faltan muestran su dibujo y el mapa muestra «Sin conexión · solo marcadores visibles». Recargar sin red tampoco forma parte de la 1.x.
result: [pending]

### 9. Firma: Roma y Campania aprobadas en un móvil real (PAR-04)
expected: Con los tests 1 a 8 en orden, se aprueban Roma y Campania en un móvil real. Se anotan aquí el modelo del móvil y el navegador (sin datos personales: ni correos, ni teléfonos, ni códigos de reserva).
result: [pending]

## Summary

total: 9
passed: 0
issues: 0
pending: 9
skipped: 0
blocked: 0

## Gaps

## Notas

- PAR-03 (pasar de la guía viva a la build nueva sin perder notas ni preferencias) lo cubre el test automático `tests/parity/upgrade-from-main.spec.ts`. No hace falta repetirlo en el móvil antes de publicar.
- Las otras UAT pendientes son 09-UAT.md, 10-UAT.md, 11-UAT.md, 12-UAT.md y 13-UAT.md.
- Por D-08, `/gsd-audit-milestone` y `/gsd-complete-milestone` van después de esta firma. Publicar y fusionar con `main` es un paso aparte (ship).
