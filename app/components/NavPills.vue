<script setup lang="ts">
// Barra de pastillas de navegación HÍBRIDA (D-03) — reproduce index.html:2264-2277.
//
// 7 pastillas ESTRUCTURALES literales (Inicio, Mapa, Reservas, Gastronomía, Pratica,
// Arte, Arquitectura — grafías verbatim del index.html, incl. la italiana "Pratica") +
// 5 pastillas de DÍA DERIVADAS de `props.days`: el v-for emite un a.nav-pill por día
// (ya ordenados ASC por useTrip), con href = '#' + slug (anclas españolas #viernes…
// #martes) y etiqueta vía dayLabel(d.eyebrow) (D-04, auto-importado de app/utils/).
// El bloque de días va INTERCALADO entre Mapa y Reservas, manteniendo el ORDEN BLOQUEADO.
//
// id="nav-pills" se conserva (la navegación reactiva de F5 lo apunta). En F3 son anclas
// planas: sin estado de pastilla resaltada y sin observador de desplazamiento (eso es
// FEAT-05/F5). CSS verbatim global (base.css): NO se añade <style scoped> (data-v-*
// rompería los selectores .nav-pill de hover/resaltado ya definidos en base.css:89-90).
import type { Day } from '~~/shared/schemas'

const props = defineProps<{ days: Day[] }>()
</script>

<template>
  <nav
    id="nav-pills"
    class="nav-pills"
  >
    <a
      href="#inicio"
      class="nav-pill"
    >Inicio</a>
    <a
      href="#mapa"
      class="nav-pill"
    >Mapa</a>
    <a
      v-for="d in props.days"
      :key="d.slug"
      :href="`#${d.slug}`"
      class="nav-pill"
    >{{ dayLabel(d.eyebrow) }}</a>
    <a
      href="#reservas"
      class="nav-pill"
    >Reservas</a>
    <a
      href="#gastronomia"
      class="nav-pill"
    >Gastronomía</a>
    <a
      href="#practica"
      class="nav-pill"
    >Pratica</a>
    <a
      href="#arte"
      class="nav-pill"
    >Arte</a>
    <a
      href="#arquitectura"
      class="nav-pill"
    >Arquitectura</a>
  </nav>
</template>
