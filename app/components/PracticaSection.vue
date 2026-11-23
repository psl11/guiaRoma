<script setup lang="ts">
// PracticaSection — el contenido de la sección `#practica` (UI-04). Reproduce VERBATIM
// `index.html:5825-5938`. Análogo de `TheHero` (sección data-bound + `<MDC>`) + el patrón de
// override LOCAL de listas de `MonumentCard` (Pitfall 1). NO incluye el `<section id="practica">`
// (eso lo pone `TripView`, A3): emite el `.container` + el contenido.
//
// Recibe la entrada de practica por prop `practica: Reference` (el `slug:'practica'` discrimina
// el union; `useTrip` ya castea a los tipos zod). Se estrecha con `v-if="practica.slug ===
// 'practica'"` para acceder a `sections`/`media`.
//
// CABECERA (OJO a las diferencias con las otras secciones, verbatim index.html:5827-5829):
//   · `div.section-eyebrow {{ eyebrow }}` ("Roma practica").
//   · `<h2>` SIN clase `.section-title` (a diferencia de reservas/gastronomía) — "Manual de
//     supervivencia romana" = `practica.title`.
//   · La intro va en un `<p>` con ESTILO INLINE verbatim (`font-style: italic; color:
//     var(--ink-soft); margin-bottom: 1.5rem;`), NO con clase `.gastro-intro`. Se reproduce el
//     style inline (es markup del original, no una regla CSS → no viola el CERO CSS). La prosa
//     con `<MDC unwrap="p" :tag="false">`.
//
// SECCIONES DE PROSA (index.html:5831-5898): por cada `sections[]` un `<h4>{{ heading }}</h4>`
// seguido de la prosa con `<MDC :tag="false">` SIN unwrap (mismo criterio que MonumentCard: el
// cuerpo es `<p>` o `<ul>`). OJO: el `<h4>` y el cuerpo son HERMANOS directos del `.container`
// (NO van envueltos en un `.artist-section`/`.card-section`), igual que en el original.
//
// PITFALL 1 (CRÍTICO) — las listas de prosa de PRACTICA SÍ son `.detail-list` (✦ + bordes),
// igual que las de monumento y a diferencia de las de artista (decisión del Plan 04-01, tabla
// del grep). Como NO hay ProseUl global (opción b), se aplica el MISMO override LOCAL que
// MonumentCard: se obtiene el AST con el slot de `<MDC>` y se pasa a `<MDCRenderer>` un mapa
// `:components="{ ul: DetailListUl }"` (componente OBJETO local que emite `<ul class="detail-
// list">`). Local → no afecta a ArtistCard ni a nadie más. `:tag="false"` para no meter el
// `<div>` envoltorio (el cuerpo `<p>`/`<ul>` debe ser hijo directo del `.container`).
//
// MEDIA (index.html:5900-5937): bloque "Lecturas y visionados". El `<h4>` "Lecturas y visionados
// antes del viaje" y su `<p>` introductorio SON la ÚLTIMA `section` del dato (heading "Lecturas y
// visionados antes del viaje"), así que salen por el v-for de secciones de arriba (verificado en
// practica.yml: es la sección 11). Después, por cada `media[]` (category libros/peliculas/series/
// playlist):
//   · un `<p>` de TÍTULO con ESTILO INLINE verbatim (Cormorant, italic, gold, .95rem) y el texto
//     de display por categoría (NO está en el dato — el dato solo trae el enum; el título visible
//     es chrome del original). El PRIMER título ("Libros") usa `margin-top:1rem`; el resto
//     `margin-top:1.25rem` (verbatim index.html:5903/5913/5923/5933).
//   · `<ul class="detail-list">` con un `<li>` por item, cada uno Markdown-inline vía `<MDC
//     unwrap="p" :tag="false">` (la `.detail-list` aquí es LITERAL en el original, no via MDC).
//
// CSS verbatim global (base.css `.section-eyebrow`/`.detail-list`) — CERO CSS, sin bloque de
// estilos con scope (un data-v-* rompería `.detail-list li::before`). Paridad por construcción.
import { defineComponent, h } from 'vue'
import type { DefineComponent } from 'vue'
import type { Reference } from '~~/shared/schemas'

defineProps<{ practica: Reference }>()

// Override LOCAL de `<ul>` → `<ul class="detail-list">` SOLO en la prosa de PracticaSection
// (Pitfall 1: practica SÍ lleva .detail-list, artistas NO). Idéntico patrón a MonumentCard
// (Plan 04-02): componente OBJETO pasado por valor en `:components` de `<MDCRenderer>`, que se
// resuelve tal cual sin tocar el registro global. Tipado `DefineComponent<any,any,any>` — el
// tipo EXACTO del prop `components` de MDCRenderer (`Record<string, string | DefineComponent>`);
// la inferencia específica de `defineComponent` dispararía un TS2322 de varianza al pasarlo.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DetailListUl: DefineComponent<any, any, any> = defineComponent({
  name: 'PracticaDetailList',
  render() {
    return h('ul', { class: 'detail-list' }, this.$slots.default?.())
  },
})

// Mapa enum→título de display de cada bloque de media (chrome del original; el dato solo trae el
// enum de categoría). Textos verbatim index.html:5903/5913/5923/5933.
const MEDIA_TITLES: Record<string, string> = {
  libros: 'Libros',
  peliculas: 'Películas imprescindibles',
  series: 'Series y documentales',
  playlist: 'Y para escuchar de fondo mientras preparáis maletas',
}
</script>

<template>
  <div
    v-if="practica.slug === 'practica'"
    class="container"
  >
    <div class="section-eyebrow">
      {{ practica.eyebrow }}
    </div>
    <h2>{{ practica.title }}</h2>
    <p style="font-style: italic; color: var(--ink-soft); margin-bottom: 1.5rem;">
      <MDC
        :value="practica.intro"
        :tag="false"
        unwrap="p"
      />
    </p>

    <template
      v-for="(s, i) in practica.sections"
      :key="i"
    >
      <h4>{{ s.heading }}</h4>
      <MDC
        v-slot="{ body }"
        :value="s.body"
      >
        <MDCRenderer
          v-if="body"
          :body="body"
          :tag="false"
          :components="{ ul: DetailListUl }"
        />
      </MDC>
    </template>

    <template
      v-for="(m, i) in practica.media"
      :key="m.category"
    >
      <p :style="`margin-top:${i === 0 ? '1rem' : '1.25rem'};font-family:'Cormorant Garamond','Garamond','Hoefler Text','Times New Roman',serif;font-style:italic;color:var(--gold);font-size:.95rem;letter-spacing:.05em;`">
        {{ MEDIA_TITLES[m.category] }}
      </p>
      <ul class="detail-list">
        <li
          v-for="(item, j) in m.items"
          :key="j"
        ><MDC :value="item" unwrap="p" :tag="false" /></li>
      </ul>
    </template>
  </div>
</template>
