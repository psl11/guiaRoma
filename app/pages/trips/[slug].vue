<script setup lang="ts">
// Ruta dinámica de viaje (ARCH-02 «estructura /trips/[slug] lista») — reutiliza el MISMO
// TripView que «/», con el slug tomado del parámetro de ruta y un guard 404 en runtime.
//
// PRERENDER (Fase 11, D-13): esta ruta se prerenderiza para cada viaje NO borrador. Las rutas
// `/trips/<slug>/` salen del manifiesto de viajes (nitro.prerender.routes en nuxt.config.ts,
// derivado de content/trips/*/trip.yml), así que Roma vive en /guiaRoma/trips/roma/. Los
// borradores no se prerenderizan y en producción ni siquiera están en Content: su URL cae en el
// guard 404 de abajo.
//
// CLAVE DE PÁGINA POR SLUG (D-13, research Pattern 6 / Pitfall 1): la clave por defecto podría
// acabar siendo la ruta completa, que INCLUYE el hash; cada pastilla (#reservas…) cambia el hash y
// remontaría TripView (controller, listeners, índice de búsqueda). Con la clave por slug el mismo
// viaje nunca se remonta al navegar por anclas. La prueba E2E de no-remontaje llega en 11-07.
definePageMeta({ key: route => `trip:${String(route.params.slug)}` })
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
