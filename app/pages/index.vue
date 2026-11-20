<script setup lang="ts">
// «/» = la PORTADA de la Fase 11 (ROUTE-01, D-06): lista los viajes publicados y cada tarjeta
// lleva a su guía en /trips/<slug>/. Sin chrome de viaje (D-11): ni Topbar, ni pastillas, ni
// buscador, ni mapa, ni conmutador de tema; todo el markup lo pone TripIndex.
//
// El <title> de la portada es fijo, «Guías de viaje» (D-11): no sale de ningún trip.yml.
//
// REDIRECCIÓN DE ENLACES ANTIGUOS (ROUTE-03, D-14): antes de la Fase 11 la guía de Roma vivía en
// «/», así que los enlaces ya compartidos apuntan a sus anclas en la raíz (`/guiaRoma/#viernes`,
// `/guiaRoma/#pantheon`). Un script inline lleva esas anclas a la misma ancla dentro de
// `/guiaRoma/trips/roma/`:
//  · Va en el <head> con prioridad `critical` para quedar ANTES del primer
//    `<link rel="stylesheet">`: un script inline tras una hoja pendiente espera a la CSS. Así corre
//    antes del primer pintado y la portada no llega a verse.
//  · Usa `location.replace` (no `location.href =`): no deja entrada de historial, así que un solo
//    «Atrás» vuelve a la página de origen, sin bucle portada ↔ Roma.
//  · Sin lista blanca de anclas: la portada no tiene anclas propias (D-12), así que cualquier hash
//    que cumpla `^#[a-z0-9-]+$` es de Roma. Un hash vacío o que no cumple el patrón no hace nada
//    (la portada se queda). El hash nunca se escribe en el DOM: solo es un sufijo validado de un
//    destino fijo, del mismo origen, serializado en build con JSON.stringify.
//  · `/guiaRoma/index.html#x` es la misma página (el mismo documento), así que también redirige.
//  · Solo en la carga del documento (D-14 exacto): no se escuchan cambios de hash posteriores.
// La base sale de `useRuntimeConfig().app.baseURL`, con el mismo idioma que app/app.vue.
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`

// Constante de MIGRACIÓN (no es un dato de viaje): el único viaje que existía en «/» antes de la
// Fase 11, destino de los enlaces publicados con ancla en la raíz.
const LEGACY_TRIP = 'roma'
const legacyDest = JSON.stringify(`${base}trips/${LEGACY_TRIP}/`)

useHead({
  title: 'Guías de viaje',
  script: [{
    key: 'legacy-hash-redirect',
    tagPosition: 'head',
    tagPriority: 'critical',
    innerHTML: `(function(){var h=location.hash;if(/^#[a-z0-9-]+$/.test(h)){location.replace(${legacyDest}+h)}})()`,
  }],
})
</script>

<template>
  <TripIndex />
</template>
