<script setup lang="ts">
// «/» = la PORTADA de la Fase 11 (ROUTE-01, D-06): lista los viajes publicados y cada tarjeta
// lleva a su guía en /trips/<slug>/. Sin chrome de viaje (D-11): ni Topbar, ni pastillas, ni
// buscador, ni mapa, ni conmutador de tema; todo el markup lo pone TripIndex.
//
// El <title> de la portada es fijo, «Guías de viaje» (D-11): no sale de ningún trip.yml. La
// redirección de las anclas antiguas de Roma (`/guiaRoma/#viernes` → `/guiaRoma/trips/roma/#viernes`)
// la añade el plan 11-06.
useHead({ title: 'Guías de viaje' })
</script>

<template>
  <TripIndex />
</template>
