<script setup lang="ts">
// GastroSection — el contenido de la sección `#gastronomia` (UI-04). Reproduce VERBATIM
// `index.html:5335-5817` (cabecera + los 7 grupos). Análogo de `NavPills` (v-for sobre datos)
// + el util puro `groupFood` (Pitfall 6). NO incluye el `<section id="gastronomia">` ni el
// `.container` (eso lo pone `TripView`, A3): este componente emite el INTERIOR de la sección.
//
// CABECERA DE SECCIÓN (de `trip.sections.gastronomia`, pasada por `TripView` como prop `section`):
//   · `div.section-eyebrow {{ section.eyebrow }}` ("Roma · gastronomía")
//   · `h2.section-title` con TEXTO ESTÁTICO "Dónde comer" — vive en el index.html (5338), NO en
//     trip.yml (igual que las h4 estáticas de TheHero). Reproducido verbatim.
//   · `p.gastro-intro` con `<MDC unwrap="p">` sobre `section.intro` (prosa de sección).
//
// AGRUPADO (Pitfall 6): `groupFood(food)` (auto-importado de app/utils/) devuelve los grupos en
// el ORDEN CANÓNICO del index.html — NO el alfabético que devuelve `queryCollection('food').all()`.
// Por cada grupo:
//   · `p.gastro-section-title {{ g.group }}` (el texto del grupo ES el título; 7 grupos, 5342…5782)
//   · si `g.groupIntro`: `div.gastro-intro` con `<MDC unwrap="p">` — OJO: el groupIntro de nivel
//     grupo (quinto quarto, ghetto) usa un `<div class="gastro-intro">` en el original
//     (index.html:5501/5541), NO un `<p>` como la intro de SECCIÓN. Se respeta esa diferencia de
//     elemento para la paridad de marcado.
//   · `div.gastro-grid` con un `<GastroCard :food="item">` por cada item del grupo.
//
// `section` es opcional en la prop (un viaje futuro podría no tener metadatos de sección); cuando
// está, eyebrow/intro se renderizan con v-if. El h2 estático se muestra siempre (es chrome de la
// sección, presente en el index.html aunque la prosa venga del dato).
//
// CSS verbatim global (base.css `.section-eyebrow`/`.section-title`/`.gastro-intro`/
// `.gastro-section-title`/`.gastro-grid`) — CERO CSS, sin bloque de estilos con scope.
import type { Food } from '~~/shared/schemas'

defineProps<{
  food: Food[]
  section?: { eyebrow: string, intro: string }
}>()
</script>

<template>
  <div class="container">
    <div
      v-if="section"
      class="section-eyebrow"
    >
      {{ section.eyebrow }}
    </div>
    <h2 class="section-title">
      Dónde comer
    </h2>
    <p
      v-if="section"
      class="gastro-intro"
    >
      <MDC
        :value="section.intro"
        :tag="false"
        unwrap="p"
      />
    </p>

    <template
      v-for="g in groupFood(food)"
      :key="g.group"
    >
      <p class="gastro-section-title">
        {{ g.group }}
      </p>
      <div
        v-if="g.groupIntro"
        class="gastro-intro"
      >
        <MDC
          :value="g.groupIntro"
          :tag="false"
          unwrap="p"
        />
      </div>
      <div class="gastro-grid">
        <GastroCard
          v-for="item in g.items"
          :key="item.slug"
          :food="item"
        />
      </div>
    </template>
  </div>
</template>
