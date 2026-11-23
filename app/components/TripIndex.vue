<script setup lang="ts">
// TripIndex — la PORTADA de la Fase 11 (ROUTE-01): una tarjeta por viaje publicado que lleva a su
// guía. La monta app/pages/index.vue en «/» (D-06).
//
// DATOS (D-06): consulta SOLO la colección `trip` con las columnas que pinta la tarjeta, bajo una
// clave propia de `useAsyncData`. En SSG la consulta se resuelve en prerender y el
// resultado viaja en el payload de la página: la portada no descarga el dump SQLite ni el WASM.
//
// LISTA (D-10, D-16): `listedTrips` (app/utils/tripDates.ts) quita los borradores —también en
// dev, donde sí se cargan— y ordena por `startDate` descendente. El estado vacío de la portada
// (D-11) solo se pinta con la lista cargada y sin nada publicado.
//
// ERRORES (WR-03 de 11-REVIEW, G-11-3): con el `await` de nivel superior los datos ya están
// resueltos al pintar (en SSR y, al hidratar, desde el payload), así que solo faltan si la consulta
// falló. Ese fallo no se puede pintar como una portada en blanco con 200, porque `failOnError` no
// lo vería: `error.value` se convierte en un `createError` fatal 500, la ruta «/» se prerenderiza
// con 500 y `nuxt generate` falla (`nitro.prerender.failOnError: true`). El `cause` lleva el error
// original al log del prerender. Lo fija tests/unit/tripIndexFatal.spec.ts.
//
// TARJETA (D-07): toda la tarjeta es UN `<a>` de documento completo (D-04: `href` plano, ni
// NuxtLink ni handler de click) hacia `${base}trips/<slug>/`, siempre con barra final (D-13), con
// la base del runtime (mismo idioma que app/app.vue), nunca la base del sitio escrita a mano.
// Dentro: el título plano (`inlineMdToPlain`, por interpolación), la línea meta (`tripMetaLine`) y
// el resumen (`<MDC :tag="false" unwrap="p">`, sin enlaces por invariante de datos: nunca hay un
// `<a>` dentro del `<a>`). Un campo ausente omite su `<p>`, sin texto de relleno. Sin imagen. Sin
// subcomponente TripCard (UI-SPEC: la plantilla es corta).
//
// SIN CHROME DE VIAJE (D-11): ni Topbar, ni pastillas, ni buscador, ni mapa, ni BackButton, ni
// conmutador de tema (el tema guardado lo aplica color-mode globalmente), ni `<section>` ni
// `<footer>` (las reglas globales de esos elementos les darían padding y bordes).
//
// SIN `id` (D-12): ningún elemento de la portada lleva `id` (tampoco los `h2`, por eso no hay
// aria-labelledby): no compiten con los `#ancla` de las guías ni con la redirección de anclas
// antiguas.
//
// ESTILOS (D-21): todos en app/assets/css/multitrip.css, bajo `.trip-index`. Este componente no
// tiene bloque de estilos ni estilos en línea. No lee ni escribe localStorage (D-20).
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`

const { data, error } = await useAsyncData('trips-index', () =>
  queryCollection('trip')
    .select('slug', 'title', 'startDate', 'endDate', 'destinations', 'summary', 'draft')
    .all(),
)
if (error.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'No se pudo cargar la lista de viajes',
    fatal: true,
    cause: error.value,
  })
}

const cards = computed(() => {
  const trips = listedTrips(data.value)
  if (trips === null) return null
  return trips.map(t => ({
    slug: t.slug,
    href: `${base}trips/${t.slug}/`,
    title: inlineMdToPlain(t.title),
    meta: tripMetaLine(t),
    summary: t.summary,
  }))
})
</script>

<template>
  <div class="trip-index">
    <header class="trip-index-header">
      <h1>Guías de viaje</h1>
    </header>
    <main class="trip-index-main">
      <ul
        v-if="cards && cards.length > 0"
        class="trip-index-list"
      >
        <li
          v-for="c in cards"
          :key="c.slug"
        >
          <a
            class="trip-index-card"
            :href="c.href"
          >
            <h2 class="trip-index-title">{{ c.title }}</h2>
            <p
              v-if="c.meta"
              class="trip-index-meta"
            >{{ c.meta }}</p>
            <p
              v-if="c.summary"
              class="trip-index-summary"
            >
              <MDC
                :value="c.summary"
                :tag="false"
                unwrap="p"
              />
            </p>
          </a>
        </li>
      </ul>
      <p
        v-else-if="cards !== null"
        class="trip-index-empty"
      >
        Todavía no hay viajes publicados.
      </p>
    </main>
    <div
      class="flourish"
      aria-hidden="true"
    >
      ·  ·  ·  ✦  ·  ·  ·
    </div>
  </div>
</template>
