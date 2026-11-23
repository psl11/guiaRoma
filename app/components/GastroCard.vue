<script setup lang="ts">
// GastroCard — la `.gastro-card` data-driven (UI-04). Transcripción 1:1 del markup de
// `index.html:5346-5360` (ficha g-felice) + el patrón de footer con itinerary-tag de
// `index.html:5448-5463` (g-armando). Gemelo de `MonumentCard.vue`, pero más simple: aquí
// la prosa es solo inline (`desc`/`plato`), sin secciones con dropcap ni listas.
//
// BADGE: `gastro-card-badge` con la clase de variante `badge-` + `badgeKind` (trattoria/deli/
// quinto/ghetto/pizza/gelato/caffe/pasticceria → base.css:1066+). El TEXTO del badge es
// `food.badge` (libre: "trattoria histórica", "salumeria + cucina", …), distinto del kind.
//
// PROSA (inline, vía MDC): `desc` y `plato` llevan Markdown-inline (`**negrita**`/`_cursiva_`)
// → `<MDC unwrap="p" :tag="false">`. La clase (`gastro-card-desc`/`gastro-plato`) vive en el
// CONTENEDOR propio (un `<p>` y un `<div>` del original), así que el MDC va DENTRO sin envoltorio:
//   · `unwrap="p"` desenvuelve el `<p>` que MDC genera para el bloque inline (no queremos un `<p>`
//     anidado dentro del `<p class="gastro-card-desc">`).
//   · `:tag="false"` suprime el `<div class="">` envoltorio que MDCRenderer mete por defecto
//     (learning D-04-A de 04-02) → el contenido es hijo directo del contenedor con clase.
//
// FOOTER: `div.gastro-card-footer` con un `<span>` (texto `footer` = horario+precio, que en el
// dato YA termina en " ·" cuando hay itinerary-tag) + un `a.gastro-maps-link`. Si hay
// `itineraryTag`, va como `<span class="gastro-itinerary-tag">` ANIDADO dentro del primer span,
// tras el texto del footer y separado por un espacio (verbatim index.html:5463). El icono 📍 es
// texto literal del enlace en el original (no lo inyecta el CSS aquí, a diferencia de maps-link
// de monumento) → el texto del enlace es "📍 Google Maps".
//
// MAPS-LINK: href reconstruido con `encodeURIComponent(food.mapsQuery)` (mismo patrón prescrito
// que MonumentCard) + `target="_blank" rel="noopener"` VERBATIM (anti-tabnabbing, T-04-07).
//
// CSS verbatim global (base.css `.gastro-card*`/`.gastro-card-badge.badge-*`/`.gastro-card-desc`/
// `.gastro-plato`/`.gastro-card-footer`/`.gastro-maps-link`/`.gastro-itinerary-tag`) — CERO CSS,
// sin bloque de estilos con scope (un data-v-* rompería selectores como `.gastro-plato strong`).
import type { Food } from '~~/shared/schemas'

defineProps<{ food: Food }>()
</script>

<template>
  <div
    :id="food.slug"
    class="gastro-card"
  >
    <div class="gastro-card-header">
      <span
        class="gastro-card-badge"
        :class="`badge-${food.badgeKind}`"
      >{{ food.badge }}</span>
      <div>
        <div class="gastro-card-name">
          {{ food.name }}
        </div>
        <div class="gastro-card-address">
          {{ food.address }}
        </div>
      </div>
    </div>

    <p class="gastro-card-desc">
      <MDC
        :value="food.desc"
        :tag="false"
        unwrap="p"
      />
    </p>

    <div
      v-if="food.plato"
      class="gastro-plato"
    >
      <MDC
        :value="food.plato"
        :tag="false"
        unwrap="p"
      />
    </div>

    <div class="gastro-card-footer">
      <span>{{ food.footer }}<template v-if="food.itineraryTag"> <span class="gastro-itinerary-tag">{{ food.itineraryTag }}</span></template></span>
      <a
        class="gastro-maps-link"
        :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.mapsQuery)}`"
        target="_blank"
        rel="noopener"
      >📍 Google Maps</a>
    </div>
  </div>
</template>
