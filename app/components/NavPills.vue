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
// FEAT-05/F5). CSS verbatim global (base.css): NO se añade bloque scoped (data-v-*
// rompería los selectores .nav-pill de hover/resaltado ya definidos en base.css:89-90).
//
// F5 (Plan 05-02): se CABLEA el resaltado reactivo sobre el shell YA montado (patrón F3→F4),
// SIN reestructurar el markup. Cada pastilla recibe `:class="{ active: ... }"` contra
// `activeSection` (el scrollspy lo mantiene; las 7 estructurales por id literal, las 5 de día
// por `d.slug`). Reemplaza el `classList.toggle('active')` imperativo del original
// (index.html:6497-6499) por el binding declarativo; togglea SOLO `.nav-pill.active`
// (base.css:90), CERO CSS nuevo. `useCardNavigation()` es el accesor PURO (sin efectos).
import type { Day } from '~~/shared/schemas'

const props = defineProps<{ days: Day[] }>()

const { activeSection } = useCardNavigation()
</script>

<template>
  <nav
    id="nav-pills"
    class="nav-pills"
  >
    <a
      href="#inicio"
      class="nav-pill"
      :class="{ active: activeSection === 'inicio' }"
    >Inicio</a>
    <a
      href="#mapa"
      class="nav-pill"
      :class="{ active: activeSection === 'mapa' }"
    >Mapa</a>
    <a
      v-for="d in props.days"
      :key="d.slug"
      :href="`#${d.slug}`"
      class="nav-pill"
      :class="{ active: activeSection === d.slug }"
    >{{ dayLabel(d.eyebrow) }}</a>
    <a
      href="#reservas"
      class="nav-pill"
      :class="{ active: activeSection === 'reservas' }"
    >Reservas</a>
    <a
      href="#gastronomia"
      class="nav-pill"
      :class="{ active: activeSection === 'gastronomia' }"
    >Gastronomía</a>
    <a
      href="#practica"
      class="nav-pill"
      :class="{ active: activeSection === 'practica' }"
    >Pratica</a>
    <a
      href="#arte"
      class="nav-pill"
      :class="{ active: activeSection === 'arte' }"
    >Arte</a>
    <a
      href="#arquitectura"
      class="nav-pill"
      :class="{ active: activeSection === 'arquitectura' }"
    >Arquitectura</a>
  </nav>
</template>
