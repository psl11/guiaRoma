<script setup lang="ts">
// Ruta dinámica de viaje (ARCH-02 «estructura /trips/[slug] lista») — reutiliza el MISMO
// TripView que «/», con el slug tomado del parámetro de ruta y un guard 404 en runtime.
//
// DISCIPLINA DE PRERENDER (D-01): esta ruta NO se prerenderiza en la 1.0. nitro.prerender.
// routes sigue siendo ['/'] (nuxt.config.ts:42) y NADA enlaza a /trips/* (sin NuxtLink), así
// que crawlLinks nunca la descubre → la salida estática emite SOLO «/». Existe únicamente para
// ser alcanzable por URL (la «estructura lista» de ARCH-02); un segundo viaje real (v2) la
// ejercería de verdad.
//
// SEGURIDAD (T-03-07, frontera URL→datos): el único «input» es el slug. Se valida contra la
// colección `trip` vía useTrip(slug); un slug inexistente → createError 404 fatal (página de
// error de Nuxt). queryCollection('trip').where('slug','=',slug) está parametrizada (sin
// inyección); el slug solo SELECCIONA una clave de colección, nunca alcanza un sink HTML/SQL.
const slug = useRoute().params.slug as string

// useTrip resuelve las 6 colecciones; solo necesitamos `trip` para el guard. En SSR/prerender
// el valor ya está resuelto tras el await, así que el 404 se decide antes de montar TripView.
const { trip } = await useTrip(slug)
if (!trip.value) {
  throw createError({ statusCode: 404, statusMessage: 'Trip not found', fatal: true })
}
</script>

<template>
  <TripView :slug="slug" />
</template>
