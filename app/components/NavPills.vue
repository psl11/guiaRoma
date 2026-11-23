<script setup lang="ts">
// Barra de pastillas de navegación — reproduce index.html:2264-2277.
//
// F10 (Plan 10-01, D-06): las pastillas SON el layout del viaje. TripView calcula UNA vez la lista
// de `buildTripLayout` (app/utils/tripLayout.ts) y con ESA MISMA lista monta las `<section>` de
// `<main>`; aquí llega vía Topbar como prop `layout` y se pinta con un único v-for. No queda ninguna
// ancla literal: id, etiqueta y orden salen del layout (orden fijo D-07, presencia por datos D-08,
// etiquetas estructurales verbatim D-09 incl. la italiana "Pratica", pastilla de día = `pill` o
// la etiqueta derivada del `eyebrow`, D-03). En Roma salen las 12 pastillas de siempre, en el
// mismo orden, con href = '#' + id (anclas españolas #viernes…#martes para los días).
//
// id="nav-pills" se conserva (la navegación reactiva de F5 lo apunta). CSS verbatim global
// (base.css): NO se añade bloque scoped (data-v-* rompería los selectores .nav-pill de
// hover/resaltado ya definidos en base.css:89-90).
//
// F5 (Plan 05-02): resaltado reactivo `:class="{ active: ... }"` contra `activeSection` (el
// scrollspy lo mantiene), comparando con el id de cada entrada del layout. Togglea SOLO
// `.nav-pill.active` (base.css:90), CERO CSS nuevo. `useCardNavigation()` es el accesor PURO.
import type { LayoutEntry } from '~/utils/tripLayout'

const props = defineProps<{ layout: LayoutEntry[] }>()

const { activeSection } = useCardNavigation()
</script>

<template>
  <nav
    id="nav-pills"
    class="nav-pills"
  >
    <a
      v-for="e in props.layout"
      :key="e.id"
      :href="`#${e.id}`"
      class="nav-pill"
      :class="{ active: activeSection === e.id }"
    >{{ e.label }}</a>
  </nav>
</template>
