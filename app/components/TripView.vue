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
// F4 (Plan 05): las 11 secciones no-#inicio se RELLENARON con el render data-driven de los Planes
// 02-04, EXCEPTO #mapa, que F4 dejó VACÍO. Las 5 de día montan `DaySection`
// (header/stats/dia-ligera/timeline/cards); las 5 de referencia montan ReservasSection /
// GastroSection / PracticaSection / ArtistCard, alimentadas por las mismas refs del ÚNICO
// `useTrip` de abajo (mismo patrón que `Topbar :days`: un solo origen de datos, pasado por props).
//
// F7 (Plan 07-02): #mapa se RELLENA con el chrome estático del mapa (eyebrow/h2/intro/.map-wrapper/
// .map-offline-banner/legend, verbatim index.html:2361-2371) y SOLO `#leaflet-map` va dentro de
// `<ClientOnly>` con un `#fallback` del MISMO tamaño (caja `#leaflet-map` VACÍA, sin texto, D-02
// → cero salto de layout). `<LeafletMap>` es la isla `.client.vue` (auto-importada). El
// `#map-offline-banner` vive en el `.map-wrapper` ESTÁTICO (fuera de `<ClientOnly>`) → está en el
// HTML prerenderizado y es alcanzable por `document.getElementById` desde la isla (A3). NO se añade
// un segundo controller de navegación F5: los popups del mapa dependen del único host de la línea ~59.
//
// El orden de hermanos del <main> se conserva VERBATIM (index.html: #inicio, #mapa, los 5 días,
// reservas, gastronomía, práctica, arte, arquitectura). #mapa entre #inicio y los días lleva su
// chrome estático + la isla `<ClientOnly>` (F7); su #fallback es del mismo tamaño (D-02), así que
// el offset de scrollspy se conserva (la caja del mapa ocupa lo mismo en prerender y tras hidratar).
//
// `trip`/`days`/`monById`/`food`/`artists`/`refById` son refs/computeds de useTrip (Vue las
// desenvuelve en plantilla). `v-if="trip"` estrecha el tipo de TheHero (espera Trip no-nulo) —
// en `/` (slug 'roma') y en cualquier /trips/[slug] válido `trip` siempre existe (la página
// [slug] hace el guard 404 antes de montar TripView), así que #inicio nunca se oculta; es solo
// seguridad de tipos. Los días (`dayBySlug(...)`) y las referencias (`refById.get(...)`) se montan
// tras un `v-if` que comprueba presencia (WR-03): en los datos F2 de Roma los 5 días y las 2
// entradas de referencia (reservas/practica) SIEMPRE existen, así que el render no cambia; pero si
// una búsqueda fallara (dato ausente, ventana reactiva de useAsyncData con .data=null antes de
// resolver, HMR) la sección queda VACÍA en vez de pasar `undefined` a un prop requerido y romper en
// runtime. El `!` que sigue al `v-if` es seguro: el guard ya garantizó la presencia.
//
// #arte / #arquitectura: el `section-eyebrow` + `h2.section-title` (texto estático "Arte"/
// "Arquitectura", chrome del index.html) + `p.art-intro` (la prosa de `trip.sections.arte/
// arquitectura`) van FUERA de las cards (index.html:5941-5945 / 6104-6108), igual que la cabecera
// de GastroSection. Las `<ArtistCard>` se filtran por `kind`: #arte = `artist`; #arquitectura =
// `arquitectura` + la ficha del glosario (`glossary`), que va al FINAL como en el original
// (index.html:6202). El `.art-intro` lleva Markdown-inline (arquitectura tiene `**negritas**`) →
// `<MDC unwrap="p" :tag="false">`.
//
// Chrome/footer VERBATIM del index.html; CERO CSS nuevo y SIN bloque scoped (data-v-*
// rompería selectores globales del shell). NINGÚN enlace de ruta a /trips/* — crawlLinks lo
// prerenderizaría y rompería la disciplina de prerender D-01; toda la navegación es por
// anclas #fragmento. Topbar/BackButton/TheHero/DaySection y las secciones se auto-importan.
//
// F5 (Plan 05-02): TripView es el dueño de la página (montado una vez) → es el ÚNICO host del
// controller de navegación (FEAT-05, D-05), espejo de cómo TheHero hospeda el controller de
// modos. El controller registra el listener de click delegado (intercepta
// los enlaces a ficha — prosa MDC + timeline — vía un `document.addEventListener` nativo,
// Pitfall 1) y el de scroll (scrollspy de pastillas) UNA SOLA VEZ. NO se añade un `<div>`
// envoltorio ni un handler de plantilla al `<main>`: el listener es nativo sobre `document` (D-01).
const props = defineProps<{ slug: string }>()

const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)

// Efectos de navegación: se registran AQUÍ una sola vez (Pitfall 4). El controller hace su
// propio `await useTrip('roma')` para `monById`; va tras el useTrip de arriba por coherencia.
await useCardNavigationController()

// Busca un día por su slug. Devuelve `undefined` si falta (WR-03): el `v-if` de cada sección
// usa esto para no montar `DaySection` con un `day` ausente. Con los datos F2 de Roma siempre
// resuelve los 5 días (render idéntico).
const dayBySlug = (slug: string) => days.value.find(d => d.slug === slug)
</script>

<template>
  <Topbar :days="days" />

  <main>
    <TheHero
      v-if="trip"
      :trip="trip"
    />
    <section id="mapa">
      <div class="container">
        <div class="section-eyebrow">
          cartografia
        </div>
        <h2>El mapa del viaje</h2>
        <p style="font-style: italic; color: var(--ink-soft); margin-bottom: 1.5rem;">
          Numeración por orden cronológico de visita. Toca un marcador para abrir su ficha.
        </p>
        <div
          class="map-wrapper"
          style="position:relative;"
        >
          <ClientOnly>
            <LeafletMap :slug="props.slug" />
            <template #fallback>
              <div id="leaflet-map" />
            </template>
          </ClientOnly>
          <div
            id="map-offline-banner"
            class="map-offline-banner"
          >
            Sin conexión · solo marcadores visibles
          </div>
        </div>
        <p class="map-legend">
          ✦  Rojos · paradas con ficha · Dorados · eventos guiados · Verde · concierto Einaudi ✦
        </p>
      </div>
    </section>
    <section id="viernes">
      <DaySection
        v-if="dayBySlug('viernes')"
        :day="dayBySlug('viernes')!"
        :mon-by-id="monById"
      />
    </section>
    <section id="sabado">
      <DaySection
        v-if="dayBySlug('sabado')"
        :day="dayBySlug('sabado')!"
        :mon-by-id="monById"
      />
    </section>
    <section id="domingo">
      <DaySection
        v-if="dayBySlug('domingo')"
        :day="dayBySlug('domingo')!"
        :mon-by-id="monById"
      />
    </section>
    <section id="lunes">
      <DaySection
        v-if="dayBySlug('lunes')"
        :day="dayBySlug('lunes')!"
        :mon-by-id="monById"
      />
    </section>
    <section id="martes">
      <DaySection
        v-if="dayBySlug('martes')"
        :day="dayBySlug('martes')!"
        :mon-by-id="monById"
      />
    </section>
    <section id="reservas">
      <ReservasSection
        v-if="refById.get('reservas')"
        :reservas="refById.get('reservas')!"
      />
    </section>
    <section id="gastronomia">
      <GastroSection
        :food="food"
        :section="trip?.sections?.gastronomia"
      />
    </section>
    <section id="practica">
      <PracticaSection
        v-if="refById.get('practica')"
        :practica="refById.get('practica')!"
      />
    </section>
    <section id="arte">
      <div class="container">
        <div
          v-if="trip?.sections?.arte"
          class="section-eyebrow"
        >
          {{ trip.sections.arte.eyebrow }}
        </div>
        <h2 class="section-title">
          Arte
        </h2>
        <p
          v-if="trip?.sections?.arte"
          class="art-intro"
        >
          <MDC
            :value="trip.sections.arte.intro"
            :tag="false"
            unwrap="p"
          />
        </p>
        <ArtistCard
          v-for="a in artists.filter(x => x.kind === 'artist')"
          :key="a.slug"
          :artist="a"
        />
      </div>
    </section>
    <section id="arquitectura">
      <div class="container">
        <div
          v-if="trip?.sections?.arquitectura"
          class="section-eyebrow"
        >
          {{ trip.sections.arquitectura.eyebrow }}
        </div>
        <h2 class="section-title">
          Arquitectura
        </h2>
        <p
          v-if="trip?.sections?.arquitectura"
          class="art-intro"
        >
          <MDC
            :value="trip.sections.arquitectura.intro"
            :tag="false"
            unwrap="p"
          />
        </p>
        <ArtistCard
          v-for="a in artists.filter(x => x.kind === 'arquitectura')"
          :key="a.slug"
          :artist="a"
        />
        <ArtistCard
          v-for="a in artists.filter(x => x.kind === 'glossary')"
          :key="a.slug"
          :artist="a"
        />
      </div>
    </section>
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
