---
created: 2026-11-23T00:00:00Z
title: Tabla de Reservas sin tbody provoca aviso de hidratación
area: app/components
severity: minor
files:
  - app/components/ReservasSection.vue:114-130
  - tests/data/fixtures/roma-reservas.html
---

## Problem

En `pnpm dev`, al abrir `/guiaRoma/trips/campania/` (y también `/trips/roma/`, mismo componente) la consola muestra:
`[Vue warn]: Hydration node mismatch: rendered on server <tbody>… expected on client: tr` en `<ReservasSection>`,
y `Hydration children mismatch on <table class="reservas-table">`.

Causa: la plantilla pone `<tr v-for>` directamente dentro de `<table class="reservas-table">` (copiado verbatim de
`index.html:5285`). El parser HTML del navegador inserta un `<tbody>` implícito al leer el HTML del servidor, y el
vdom del cliente espera los `<tr>` como hijos directos de `<table>`. Vue recupera re-pintando la tabla, así que
visualmente no cambia nada (goldens intactos), pero hay trabajo extra al hidratar y el aviso es legítimo.
Reportado por el usuario el 2026-11-23 («es solo un aviso, anótalo para cuando puedas»).

## Solution

Añadir `<tbody>` explícito alrededor del `<tr v-for>` en `ReservasSection.vue`. El DOM del navegador queda idéntico al
actual (el `<tbody>` ya existía, implícito), así que los 56 goldens no cambian. Actualizar el fixture byte a byte
`tests/data/fixtures/roma-reservas.html` (lo vigila `tests/data/romaReservas.spec.ts`) para que incluya `<tbody>`,
justificándolo en el commit. Comprobar con `pnpm verify` y que la consola de `pnpm dev` queda limpia en Roma y Campania.
Ruta sugerida: `/gsd-quick`.
