<script setup lang="ts">
// TripView — POSEEDOR de la página (D-05, ARCH-01/02). Reproduce el árbol del <body> del
// index.html: header(Topbar) → main(las 12 secciones en orden) → BackButton → div.flourish
// → footer (orden de hermanos verbatim, index.html:2255-6240).
//
// Llama a useTrip(props.slug) (la convención de datos elegida en el Plan 02: TripView llama,
// las páginas son `<TripView :slug>`), por lo que `/` y `/trips/[slug]` son one-liners
// (ARCH-02). Posee las 12 anclas de sección con id = slug (= #ancla del index.html, los días
// en español #viernes…#martes); SOLO rellena #inicio con contenido real (vía TheHero, D-06)
// y deja las otras 11 como secciones VACÍAS portando únicamente su id, listas para que F4
// (timeline/cards/food/reference/artists) y F7 (isla Leaflet del #mapa) las cableen.
//
// Las 11 secciones no-#inicio son <section id="…"> reales y VACÍAS: sin contenido y sin
// atributo inline de altura. Una altura fija desplazaría el offset de cada ancla y rompería
// scrollspy (scroll-padding-top:124px, base.css:3); manteniéndolas vacías, las reglas
// `section { padding:3rem 0 }` y `section + section { border-top }` (base.css:93-94) aplican
// igual que en el golden.
//
// `trip` y `days` son refs de useTrip (Vue las desenvuelve en plantilla). `v-if="trip"`
// estrecha el tipo de TheHero (espera Trip no-nulo) — en `/` (slug 'roma') y en cualquier
// /trips/[slug] válido `trip` siempre existe (la página [slug] hace el guard 404 antes de
// montar TripView), así que #inicio nunca se oculta; es solo seguridad de tipos.
//
// Chrome/footer VERBATIM del index.html; CERO CSS nuevo y SIN bloque scoped (data-v-*
// rompería selectores globales del shell). NINGÚN enlace de ruta a /trips/* — crawlLinks lo
// prerenderizaría y rompería la disciplina de prerender D-01; toda la navegación es por
// anclas #fragmento. Topbar/BackButton/TheHero se auto-importan.
const props = defineProps<{ slug: string }>()

const { trip, days } = await useTrip(props.slug)
</script>

<template>
  <Topbar :days="days" />

  <main>
    <TheHero
      v-if="trip"
      :trip="trip"
    />
    <section id="mapa" />
    <section id="viernes" />
    <section id="sabado" />
    <section id="domingo" />
    <section id="lunes" />
    <section id="martes" />
    <section id="reservas" />
    <section id="gastronomia" />
    <section id="practica" />
    <section id="arte" />
    <section id="arquitectura" />
  </main>

  <BackButton />

  <div class="flourish">
    ·  ·  ·  ✦  ·  ·  ·
  </div>

  <footer>
    <div class="container">
      <p>Itinerario preparado para <em>Pay</em> y dos colegas<br>Roma · 19—23 giugno 2026<br>"Roma no se cuenta, se camina."</p>
    </div>
  </footer>
</template>
