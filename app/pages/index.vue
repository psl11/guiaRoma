<template>
  <!--
    «/» = el HOGAR de Roma (D-02): el viaje por defecto es 'roma' HARDCODEADO (no «el primer
    viaje de la colección» ni configuración). Un viaje futuro (v2) vivirá en /trips/<slug>
    sin tocar este home. TripView llama a useTrip('roma') y posee chrome + las 12 secciones.

    SIN <NuxtLink to="/trips/…"> en NINGÚN sitio: crawlLinks (nuxt.config.ts:41) seguiría el
    enlace y prerenderizaría /trips/roma → duplicado de «/» (rompe D-01). Toda la navegación es
    por anclas #fragmento, no rutas.
  -->
  <TripView slug="roma" />
</template>
