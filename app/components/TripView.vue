<script setup lang="ts">
// TripView — POSEEDOR de la página (D-05, ARCH-01/02). Reproduce el árbol del <body> del
// index.html: header(Topbar) → main(las secciones del viaje en orden) → BackButton → div.flourish
// → footer (orden de hermanos verbatim, index.html:2255-6240).
//
// Llama a useTrip(props.slug) (TripView llama, las páginas son `<TripView :slug>`), por lo que `/`
// y `/trips/[slug]` son one-liners (ARCH-02). `trip`/`days`/`monById`/`food`/`artists`/`refById`
// son refs/computeds de useTrip (Vue las desenvuelve en plantilla).
//
// F10 (Plan 10-01) — LA FORMA SALE DE LOS DATOS. `<main>` es un recorrido de `buildTripLayout`
// (app/utils/tripLayout.ts), la MISMA lista que pinta las pastillas vía Topbar → NavPills (D-06:
// una sola fuente de verdad, nunca dos listas de secciones). Cada entrada emite el bloque de
// siempre según su `kind`, dentro de un `<template v-for>` con una cadena v-if/v-else-if:
//   · `inicio` → TheHero (que ya trae su propia `<section id="inicio">`);
//   · `mapa` → el chrome estático del mapa (abajo);
//   · `day` → `<section :id="slug">` con DaySection: UNA sección por día del viaje, en el orden de
//     `order` (D-01); no hay ninguna sección de día fija en la plantilla. En Roma salen
//     #viernes…#martes entre #mapa y #reservas, como siempre;
//   · `reservas`/`gastronomia`/`practica`/`arte`/`arquitectura` → su sección de siempre.
// Orden fijo para todo viaje (D-07) y presencia solo por datos (D-08): una sección sin datos no
// tiene ni `<section>` ni pastilla. Las `<section>` siguen siendo hijas DIRECTAS de `<main>` (sin
// envoltorio): la regla global `section + section` depende de la adyacencia de elementos, y los
// comentarios de fragmento de Vue no cuentan como hermanos. Durante la ventana de hidratación
// (`.data` = null) el layout cae a listas vacías con `??`, así que nada se monta vacío ni lanza.
// Los `v-if` internos de reservas/práctica (y el de `e.day`) son solo seguridad de tipos: cuando
// la entrada existe, el dato existe, y el DOM no cambia.
//
// F7 (Plan 07-02): #mapa lleva el chrome estático del mapa (eyebrow/h2/intro/.map-wrapper/
// .map-offline-banner/legend, verbatim index.html:2361-2371) y SOLO `#leaflet-map` va dentro de
// `<ClientOnly>` con un `#fallback` del MISMO tamaño (caja `#leaflet-map` VACÍA, sin texto, D-02
// → cero salto de layout y offset de scrollspy conservado). `<LeafletMap>` es la isla
// `.client.vue` (auto-importada). El `#map-offline-banner` vive en el `.map-wrapper` ESTÁTICO
// (fuera de `<ClientOnly>`) → está en el HTML prerenderizado y es alcanzable por
// `document.getElementById` desde la isla (A3).
//
// #arte / #arquitectura: el `section-eyebrow` + `h2.section-title` (texto estático "Arte"/
// "Arquitectura", chrome del index.html) + `p.art-intro` (la prosa de `trip.sections.arte/
// arquitectura`) van FUERA de las cards (index.html:5941-5945 / 6104-6108), igual que la cabecera
// de GastroSection. Las `<ArtistCard>` se filtran por `kind`: #arte = `artist`; #arquitectura =
// `arquitectura` + la ficha del glosario (`glossary`), que va al FINAL como en el original
// (index.html:6202). El `.art-intro` lleva Markdown-inline (arquitectura tiene `**negritas**`) →
// `<MDC unwrap="p" :tag="false">`.
//
// Chrome VERBATIM del index.html (marca, leyenda y pie salen del trip.yml desde F10); CERO CSS
// nuevo y SIN bloque de estilos scoped (data-v-* rompería selectores globales del shell). NINGÚN enlace de ruta a /trips/* — crawlLinks lo
// prerenderizaría y rompería la disciplina de prerender D-01; toda la navegación es por
// anclas #fragmento. Topbar/BackButton/TheHero/DaySection y las secciones se auto-importan.
//
// F5 (Plan 05-02): TripView es el dueño de la página (montado una vez) → es el ÚNICO host del
// controller de navegación (FEAT-05, D-05). El controller registra el listener de click delegado
// (intercepta los enlaces a ficha — prosa MDC + timeline — vía un `document.addEventListener`
// nativo, Pitfall 1) y el de scroll (scrollspy de pastillas) UNA SOLA VEZ. NO se añade un `<div>`
// envoltorio ni un handler de plantilla al `<main>`: el listener es nativo sobre `document` (D-01).
//
// F9 (Plan 09-01, D-08): TripView PUBLICA el slug del viaje (`provideTripSlug`) como primera
// sentencia ejecutable, antes de cualquier `await`, para que todo su árbol (NavPills, BackButton,
// TheHero, Timeline*, MonumentCard, SearchBox) lo lea con `useTripSlug()` y su estado/persistencia
// salga por viaje.
const props = defineProps<{ slug: string }>()
provideTripSlug(props.slug)

const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)

// Efectos de navegación: se registran AQUÍ una sola vez (Pitfall 4). El slug va POR ARGUMENTO:
// TripView no puede leer con `inject` el valor que él mismo provee (en Vue 3.5 `inject` mira los
// provides del padre — trampa del self-inject). El controller consulta `useTrip` con ese mismo slug
// (deduplicado con el de arriba por `useAsyncData`) para saber qué `#id` son fichas de este viaje.
await useCardNavigationController(props.slug)

// F10 (Plan 10-01, D-06): la forma de la página sale de UNA lista pura. Se calcula aquí una sola
// vez y con ella se montan las secciones de `<main>` y se pintan las pastillas (Topbar → NavPills).
// Durante la ventana de hidratación (`.data` = null) cada fuente cae a vacío con `??`, así que
// nada se monta vacío ni lanza.
const layout = computed(() => buildTripLayout({
  days: days.value ?? [],
  hasReservas: !!refById.value.get('reservas'),
  hasPractica: !!refById.value.get('practica'),
  foodCount: food.value?.length ?? 0,
  artistKinds: new Set((artists.value ?? []).map(a => a.kind)),
}))

// F10 (Plan 10-02, D-13/D-14): la pestaña la pone CADA viaje desde su trip.yml (`pageTitle`); app.vue
// ya no fija título global. Sin `pageTitle`, el respaldo es NEUTRO: el `title` del propio viaje sin
// Markdown (`plainTitle`), que también usa la marca cuando el viaje no define `brand`. Content
// entrega `null` para un opcional ausente → se lee con `||`/`??`, nunca comparando con undefined.
const plainTitle = computed(() => inlineMdToPlain(trip.value?.title ?? ''))
useHead({ title: () => trip.value?.pageTitle || plainTitle.value })

// F10 (Plan 10-02, D-12/D-14): el pie son las líneas Markdown-inline de `trip.footer`, unidas con
// `<br>` dentro de un único `<p>` (cada línea por `<MDC :tag="false" unwrap="p">`, el mismo idioma
// que `#arte`). Sin `footer` no se pinta el pie; sin `mapLegend` no hay `p.map-legend`; sin `brand`
// la marca es `plainTitle`. Ningún texto de otro viaje como respaldo.
const footerLines = computed(() => trip.value?.footer ?? [])
</script>

<template>
  <Topbar
    :layout="layout"
    :brand="trip?.brand ?? null"
    :fallback-title="plainTitle"
  />

  <main>
    <template
      v-for="e in layout"
      :key="e.id"
    >
      <TheHero
        v-if="e.kind === 'inicio' && trip"
        :trip="trip"
      />
      <section
        v-else-if="e.kind === 'mapa'"
        id="mapa"
      >
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
          <p
            v-if="trip?.mapLegend"
            class="map-legend"
          >
            {{ trip.mapLegend }}
          </p>
        </div>
      </section>
      <section
        v-else-if="e.kind === 'day'"
        :id="e.id"
      >
        <DaySection
          v-if="e.day"
          :day="e.day"
          :mon-by-id="monById"
        />
      </section>
      <section
        v-else-if="e.kind === 'reservas'"
        id="reservas"
      >
        <ReservasSection
          v-if="refById.get('reservas')"
          :reservas="refById.get('reservas')!"
        />
      </section>
      <section
        v-else-if="e.kind === 'gastronomia'"
        id="gastronomia"
      >
        <GastroSection
          :food="food"
          :section="trip?.sections?.gastronomia"
        />
      </section>
      <section
        v-else-if="e.kind === 'practica'"
        id="practica"
      >
        <PracticaSection
          v-if="refById.get('practica')"
          :practica="refById.get('practica')!"
        />
      </section>
      <section
        v-else-if="e.kind === 'arte'"
        id="arte"
      >
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
      <section
        v-else-if="e.kind === 'arquitectura'"
        id="arquitectura"
      >
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
    </template>
  </main>

  <BackButton />

  <div class="flourish">
    ·  ·  ·  ✦  ·  ·  ·
  </div>

  <footer v-if="footerLines.length > 0">
    <div class="container">
      <p>
        <template
          v-for="(line, i) in footerLines"
          :key="i"
        >
          <br v-if="i > 0">
          <MDC
            :value="line"
            :tag="false"
            unwrap="p"
          />
        </template>
      </p>
    </div>
  </footer>
</template>
