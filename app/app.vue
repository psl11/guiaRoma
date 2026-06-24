<script setup lang="ts">
// Favicons bajo el subpath (BUILD-01/03): app.head.link en nuxt.config emite los href
// VERBATIM (Nuxt NO les antepone app.baseURL), así que `/favicon.svg` resolvería a la raíz
// del dominio → 404 bajo /guiaRoma/. Aquí construimos el href con el baseURL en runtime
// (useRuntimeConfig().app.baseURL == '/guiaRoma/') para que apunte a /guiaRoma/favicon.svg,
// donde public/ sirve las copias (A4 / D-02). Concatenación normalizando la barra (sin
// dependencias: joinURL de ufo no está auto-importado y traerlo arriesga el prerender).
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`

useHead({
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` },
    { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.svg` },
  ],
})

// Cabecera de PARIDAD (D-09) — reproduce index.html VERBATIM, INDEPENDIENTE del tema:
//  · htmlAttrs.lang='es' (index.html:2)
//  · <title> exacta (index.html:8) — el guion es un EM-DASH «—», no un guion normal
//  · DOS <meta name="theme-color" media="(prefers-color-scheme: …)"> (index.html:6-7) que
//    fijan el color del chrome del navegador por esquema del SO (paridad móvil). NO los
//    inyecta @nuxtjs/color-mode (su única inyección en <head> es el script anti-FOUC); van
//    aquí a mano. Ambos se conservan.
useHead({
  htmlAttrs: { lang: 'es' },
  title: 'Roma · 19—23 giugno 2026',
  meta: [
    { name: 'theme-color', content: '#1a1612', media: '(prefers-color-scheme: dark)' },
    { name: 'theme-color', content: '#f5f0e8', media: '(prefers-color-scheme: light)' },
  ],
})
</script>

<template>
  <!--
    app.vue = raíz de la app: SOLO <NuxtPage/> (sin <NuxtLayout>). El chrome (Topbar/
    NavPills/BackButton/footer) NO vive en un layout: lo posee TripView (convención A3 del
    Plan 02/04). Las páginas (index.vue, trips/[slug].vue) son one-liners <TripView :slug>,
    así que NO hay app/layouts/ y NuxtPage monta directamente el árbol de la página.
  -->
  <NuxtPage />
</template>
