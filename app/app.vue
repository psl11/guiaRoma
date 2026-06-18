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
</script>

<template>
  <div id="scaffold">
    guiaRoma — scaffold (Fase 1)
  </div>
</template>
