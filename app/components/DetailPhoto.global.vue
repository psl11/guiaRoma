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
// DETAIL @ERROR → SVG (UI-05, Fase 7). Port 1:1 de `loadSvgFallbackDetail` (index.html:2229-2252):
// al fallar la `<img>`, se sustituye SÓLO la imagen por el SVG del motivo (vía `v-html` de la
// constante de CONFIANZA `motifSvg`, svgMotifs.ts del Plan 01), CONSERVANDO `.detail-photo-caption`.
// A diferencia del hero, el SVG LLEVA los CUATRO estilos inline VERBATIM del original
// (`width:100%`/`height:auto`/`border-radius:4px`/`display:block`, index.html:2238-2241): la regla
// CSS `.detail-photo img` (base.css:825) apunta a `img`, NO al `<svg>` insertado, así que sin esos
// estilos quedaría sin dimensionar. RAMA del original "sin svg → `img.style.display='none'`"
// (index.html:2244/2247): si `motifSvg(motif)` es `undefined`, se oculta la `<img>` y NO se pinta
// ningún SVG (la caption permanece). El `motif` llega por `inject('monumentMotif')` desde el
// `MonumentCard` anfitrión (provide del Plan 03 Task 1); hay exactamente un `DetailPhoto` por ficha,
// anidado bajo ella, así que el inject resuelve a través del subárbol del MDCRenderer (A2).
//
// La caption ADMITE Markdown-inline (en el corpus algunas llevan _cursivas_/**negritas**), así
// que se renderiza con `<MDC :value="caption" unwrap="p" />`: `unwrap="p"` evita que MDC envuelva
// el inline en un `<p>` extra que rompería el ritmo de `.detail-photo-caption`. Es seguro tanto
// para captions con markup como para texto plano.
//
// CSS verbatim global (base.css:820-844) — CERO CSS nuevo y SIN bloque de estilos con scope: un
// `data-v-*` cambiaría la especificidad y rompería en silencio selectores globales como
// `.detail-photo img` y `[data-theme="dark"] .detail-photo img`. La paridad es por construcción.
import { computed, inject, onMounted, ref, useTemplateRef } from 'vue'
import type { Motif } from '~~/shared/schemas'

defineProps<{ src: string, alt: string, caption: string }>()

// El `MonumentCard` anfitrión hace `provide('monumentMotif', monument.motif)` (Plan 03 Task 1);
// aquí se inyecta con default `undefined` (DetailPhoto sólo recibe src/alt/caption por MDC).
const motif = inject<Motif | undefined>('monumentMotif', undefined)

// DETAIL @error → SVG (port de loadSvgFallbackDetail, index.html:2229-2252). `failed` conmuta la
// `<img>` por el `<span v-html>` con el SVG. `detailSvg` inyecta los CUATRO estilos inline VERBATIM
// (index.html:2238-2241) en la etiqueta `<svg ...>` — `.detail-photo img` (base.css:825) apunta a
// `img`, no al `<svg>`, así que los estilos van en el propio SVG (= `svg.style.*` del original).
//
// HOST `display:block` (F8 / 08-06 — bug REAL de paridad-pixel, Blocker desktop day-views). El
// original hace `img.replaceWith(svg)`: el `<svg>` queda como HIJO DIRECTO de `.detail-photo` (un
// bloque de 380px), así que su `width:100%` resuelve contra esos 380px y `height:auto` lo escala a
// ~133px (viewBox 800×280). Aquí el SVG va dentro de un `<span>` por `v-html`; un `<span>` es INLINE
// (shrink-to-fit), así que el `width:100%` del SVG resolvía contra el ancho-degenerado del span y el
// SVG COLAPSABA a ~47-87px → cada detail-photo ~133px más corto que el golden (verificado: 6 detail
// en #viernes sumaban −798px). Por eso el `<span>` host lleva `display:block` (su `width` queda
// `auto`=100% del bloque padre por ser block), reponiendo el contexto de bloque que el `replaceWith`
// del original daba gratis. El SVG vuelve a escalar a la altura correcta y las vistas de día cuadran.
const failed = ref(false)
const detailSvg = computed(() => {
  const svg = motifSvg(motif)
  return svg
    ? svg.replace('<svg ', '<svg style="width:100%; height:auto; border-radius:4px; display:block" ')
    : undefined
})
function onError() {
  // Si hay SVG → conmutar a él; si no, ocultar SÓLO la `<img>` (failed + detailSvg undefined → no
  // se pinta `<span>`), conservando la caption — mirror de `img.style.display='none'` (index.html:2247).
  failed.value = true
}

// CARRERA error-antes-de-hidratación (Rule 1, Fase 8 — bug REAL detectado por el visual-diff del
// Plan 06). El original lleva el fallback como ATRIBUTO HTML inline `onerror="loadSvgFallbackDetail(...)"`
// (index.html, 77 onerror inline), que dispara SÍNCRONAMENTE en cuanto la <img> falla, ANTES de
// cualquier JS de framework. Aquí el fallback es un listener `@error` de Vue que sólo se adjunta al
// HIDRATAR: si la imagen SSR ya falló (offline / 404 / petición abortada) ANTES de que Vue adjunte el
// listener, el evento `error` ya se disparó y NO vuelve a emitirse → la <img> rota se queda y el SVG
// nunca aparece. Empíricamente esto dejaba 16+ detail-photos sin swap en el sitio generado bajo A5
// (image-abort), con #viernes 502px más corto que el golden y cajas de imagen rota visibles. FIX
// canónico SSR: en onMounted, si la <img> ya está "complete" con naturalWidth 0 (= falló), invocar el
// MISMO onError manualmente. Cubre el caso pre-hidratación; el `@error` del template cubre los fallos
// posteriores. Restaura la paridad con el onerror inline del original.
const imgRef = useTemplateRef<HTMLImageElement>('img')
onMounted(() => {
  const img = imgRef.value
  if (img && img.complete && img.naturalWidth === 0) onError()
})
</script>

<template>
  <div class="detail-photo">
    <img
      v-if="!failed"
      ref="img"
      :src="src"
      :alt="alt"
      loading="lazy"
      @error="onError"
    >
    <!-- `display:block` para reponer el contexto de bloque del `img.replaceWith(svg)` del original
         (si no, el `<span>` inline colapsa el `width:100%` del SVG → detail-photo demasiado corto).
         `v-html` es de la constante estática de CONFIANZA (svgMotifs.ts), nunca dato de usuario
         (T-07-06 mitigate). -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <span v-else-if="detailSvg" style="display:block" v-html="detailSvg" />
    <div class="detail-photo-caption">
      <MDC
        :value="caption"
        unwrap="p"
      />
    </div>
  </div>
</template>
