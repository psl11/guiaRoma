<script setup lang="ts">
// #inicio COMPLETO (D-06) — reproduce index.html:2283-2358 VERBATIM, data-bound.
//
// Recibe el viaje (`trip`) como única prop tipada `Trip` y renderiza el masthead
// (hero-decoration · h1 con <em>Roma</em> · hero-meta · hero-quote), los placeholders
// SOLO-DE-LAYOUT (search-wrap, pace-wrap con sus 3 pace-btn y 2 light-wrap), la rejilla
// info-grid desde `trip.infoCards`, y los párrafos de `trip.howTo`. Las dos <h4> ("Datos
// del viaje" / "Cómo usar esta guía") son TEXTO ESTÁTICO de plantilla: viven en el
// index.html, NO en trip.yml.
//
// Placeholders de layout (index.html:2295-2332): se reproducen con su markup EXACTO pero
// SIN manejadores de evento — su comportamiento es F4 (buscador/ritmo) / F6 (modos). Existen
// aquí para que el ritmo de espaciado/borde masthead→info-grid cuadre con el golden.
//
// Prosa vía MDC (componente auto-importado de @nuxt/content): trip.title (dentro del h1) y
// cada infoCards.value (dentro de .info-card-value) usan la prop unwrap="p" para que MDC NO
// envuelva el inline en un párrafo extra que rompa el ritmo vertical; en howTo el párrafo SÍ
// se quiere, así que ahí MDC va sin unwrap. Cuadre de ritmo verificado contra el golden en el
// Plan 05 (RESEARCH §Open Q 1 RESUELTA #1) — es afinado CSS/markup, no lógica nueva.
//
// CSS verbatim global (base.css) — CERO CSS nuevo y SIN bloque scoped: un data-v-* rompería
// selectores como `.info-card-value strong { display:block }` (base.css:233) y el resto del
// shell. La paridad es por construcción.
//
// CABLEADO DE LOS MODOS (D-05, FEAT-06/07/08): este componente CONSUME `useTripModes()` para
// cablear los controles del #inicio que la paridad de F3 dejó YA MONTADOS sin manejadores, y es
// el ÚNICO sitio que invoca `useTripModesController()` — registra los efectos secundarios de los
// modos (watch light→slow, body-attrs vía useHead, restore+persist en onMounted) EXACTAMENTE una
// vez (CR-01): TheHero posee los controles y se monta una sola vez, mientras los ~65
// TimelineStop/TimelineTransport solo usan el accesor puro `useTripModes()` para `isVisible`. NO
// se reestructura el DOM del #inicio (ni orden, ni clases base, ni el search-input de F6): solo
// se añaden bindings reactivos sobre los controles existentes.
//   · Los 3 `.pace-btn` reciben `:class="{ active: pace === '<valor>' }"` + `@click` que asigna
//     pace. OJO: el 1º pierde su clase estática `active` LITERAL — si se dejara, Vue mergearía
//     esa clase estática con el binding y el botón quedaría SIEMPRE activo (incluso al elegir
//     otro ritmo). Por eso pasa a una `class` base sin `active` + el `:class` reactivo.
//   · `#light-toggle` y `#resumen-toggle` reciben `:aria-pressed` (reactivo, reemplazando el
//     `aria-pressed="false"` literal) + `@click` que conmuta el booleano. Desactivar "caminar
//     menos" NO revierte el ritmo: ese acoplamiento light→slow (sin revertir) vive en el `watch`
//     del composable (Pitfall 5), no aquí.
//   · NO se añade `aria-pressed` a los `.pace-btn` (el original usa solo `.active`). El
//     search-input (F6) y todo lo demás quedan intactos.
import type { Trip } from '~~/shared/schemas'

defineProps<{ trip: Trip }>()

// Efectos secundarios de los modos: se registran AQUÍ una sola vez (CR-01).
useTripModesController()
const { pace, light, resumen } = useTripModes()
</script>

<template>
  <section id="inicio">
    <div class="container">
      <div class="hero">
        <div class="hero-decoration">
          {{ trip.decoration }}
        </div>
        <h1>
          <MDC
            :value="trip.title"
            unwrap="p"
          />
        </h1>
        <div class="hero-meta">
          {{ trip.heroMeta }}
        </div>
        <div class="hero-quote">
          {{ trip.quote }}<span class="hero-quote-attr">{{ trip.quoteAttr }}</span>
        </div>
      </div>

      <div class="search-wrap">
        <input
          id="search"
          type="search"
          class="search-input"
          placeholder="Buscar lugar, día, anécdota…"
          autocomplete="off"
        >
        <div
          id="search-results"
          class="search-results"
        />
      </div>

      <div class="pace-wrap">
        <span class="pace-label">Ritmo del viaje</span>
        <div class="pace-options">
          <button
            class="pace-btn"
            :class="{ active: pace === 'optimistic' }"
            data-pace="optimistic"
            @click="pace = 'optimistic'"
          >
            <span class="pace-btn-title">Optimista</span>
            <span class="pace-btn-meta">6-7 paradas/día</span>
          </button>
          <button
            class="pace-btn"
            :class="{ active: pace === 'neutral' }"
            data-pace="neutral"
            @click="pace = 'neutral'"
          >
            <span class="pace-btn-title">Neutra</span>
            <span class="pace-btn-meta">5 paradas/día</span>
          </button>
          <button
            class="pace-btn"
            :class="{ active: pace === 'slow' }"
            data-pace="slow"
            @click="pace = 'slow'"
          >
            <span class="pace-btn-title">Pesimista</span>
            <span class="pace-btn-meta">3-4 paradas/día</span>
          </button>
        </div>
        <p class="pace-help">
          Elige el ritmo según cómo os sintáis. <em>Optimista</em> es el plan completo. <em>Neutra</em> elimina las paradas menos esenciales. <em>Pesimista</em> deja solo lo imprescindible para disfrutar sin prisas. Las fichas siempre están disponibles en cada día por si queréis improvisar.
        </p>
        <div class="light-wrap">
          <button
            id="light-toggle"
            class="light-toggle"
            :aria-pressed="light"
            @click="light = !light"
          >
            <span class="light-switch" />
            <span>🦶 Caminar menos</span>
          </button>
          <span class="light-help">Modo movilidad reducida: pone el ritmo en <em>Pesimista</em> y añade en cada día una <strong>«Versión ligera»</strong> con lo imprescindible, traslados en taxi/metro y avisos de escaleras y cuestas.</span>
        </div>
        <div class="light-wrap">
          <button
            id="resumen-toggle"
            class="resumen-toggle"
            :aria-pressed="resumen"
            @click="resumen = !resumen"
          >
            <span class="res-switch" />
            <span>📋 Modo resumen</span>
          </button>
          <span class="light-help">Vista índice: solo hora y lugar, en orden. Oculta traslados, explicaciones, fichas y estadísticas; mantiene las comidas y cenas reservadas. El plan de un vistazo.</span>
        </div>
      </div>

      <h4>Datos del viaje</h4>
      <div class="info-grid">
        <div
          v-for="c in trip.infoCards"
          :key="c.label"
          class="info-card"
        >
          <div class="info-card-label">
            {{ c.label }}
          </div>
          <div class="info-card-value">
            <MDC
              :value="c.value"
              unwrap="p"
            />
          </div>
        </div>
      </div>

      <h4>Cómo usar esta guía</h4>
      <p
        v-for="(paragraph, i) in trip.howTo"
        :key="i"
      >
        <MDC :value="paragraph" />
      </p>
    </div>
  </section>
</template>
