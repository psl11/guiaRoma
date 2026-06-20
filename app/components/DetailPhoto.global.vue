<script setup lang="ts">
// DetailPhoto — componente MDC inline `:detail-photo{...}` (UI-02). Reproduce el markup de
// `index.html:2479-2482` (`.detail-photo` > `img` + `.detail-photo-caption`), data-bound.
//
// PRIMER componente `.global.vue` del repo — el sufijo `.global.vue` es el MECANISMO: `<MDC>`
// resuelve los componentes inline llamando `resolveComponent('DetailPhoto')` contra el registro
// GLOBAL de Vue, y en Nuxt Content v3 los auto-imports normales de componentes NO son globales
// (RESEARCH §Pattern 1, verificado en @nuxtjs/mdc@0.22.0). Sin el sufijo, `:detail-photo{...}`
// quedaría sin renderizar como texto crudo. Las props son los `key="value"` del MDC inline:
// los datos lo invocan como `:detail-photo{src="…" alt="…" caption="…"}` (galleria-sciarra.yml).
//
// FRONTERA D-01: la `<img>` es PLANA — sin ningún manejador de error de imagen. El fallback
// SVG de imagen rota (el patrón `loadSvgFallbackDetail` del index.html) es trabajo de la Fase 7
// (offline/imágenes), no de aquí; introducirlo ahora se saldría del alcance de este plan. Solo
// `loading="lazy"`, que ya estaba en el original.
//
// La caption ADMITE Markdown-inline (en el corpus algunas llevan _cursivas_/**negritas**), así
// que se renderiza con `<MDC :value="caption" unwrap="p" />`: `unwrap="p"` evita que MDC envuelva
// el inline en un `<p>` extra que rompería el ritmo de `.detail-photo-caption`. Es seguro tanto
// para captions con markup como para texto plano.
//
// CSS verbatim global (base.css:820-844) — CERO CSS nuevo y SIN bloque `<style scoped>`: un
// `data-v-*` cambiaría la especificidad y rompería en silencio selectores globales como
// `.detail-photo img` y `[data-theme="dark"] .detail-photo img`. La paridad es por construcción.
defineProps<{ src: string, alt: string, caption: string }>()
</script>

<template>
  <div class="detail-photo">
    <img
      :src="src"
      :alt="alt"
      loading="lazy"
    >
    <div class="detail-photo-caption">
      <MDC
        :value="caption"
        unwrap="p"
      />
    </div>
  </div>
</template>
