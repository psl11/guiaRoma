<script setup lang="ts">
// DaySection — el contenedor de UN día completo (UI-03). Transcripción 1:1 del markup de
// `index.html:2375-2448` (sección "viernes", la plantilla canónica de día), data-bound desde un
// `Day` tipado. Es el componente que `TripView` monta en cada una de las 5 anclas de día
// (#viernes…#martes), pasándole el `Day` correspondiente y el `monById` para resolver las fichas.
// NO incluye el `<section id="…">` ni nada externo: emite el `.container` + el contenido del día
// (mismo reparto de responsabilidades que GastroSection/ReservasSection — A3).
//
// RESOLUCIÓN DE FICHAS EN ORDEN DEL DATO (DATA-03, Pitfall 6 — CRÍTICO): `day.cards[]` es un array
// ORDENADO de slugs de monumento (= el orden del DOM del original, del que F6 deriva la "ruta del
// día"). Se mapea CADA slug contra `monById` y se FILTRAN los no resueltos, conservando el ORDEN
// EXACTO del array — NUNCA se reordena (ni alfabético, ni por el orden de `queryCollection`). El
// filtro `(m): m is Monument => !!m` descarta un slug huérfano sin romper el tipo (defensivo; en
// los datos F2 los 6 slugs de cada día resuelven). Las fichas las renderiza `MonumentCard`.
//
// ESTRUCTURA VERBATIM (index.html:2375-2448):
//   · `div.light-banner` — TEXTO ESTÁTICO verbatim de index.html:2377 (chrome del día, igual en
//     los 5 días). CSS-OCULTO por defecto (`.light-banner { display:none }`, leaflet.css:801) y
//     solo visible con `body.light-mode` (leaflet.css:802). Lleva `<strong>`/`<em>` literales
//     (markup del original, no Markdown del dato) → se transcribe como HTML, no por MDC.
//   · `div.section-eyebrow {{ day.eyebrow }}` ("venerdì · 19 giugno").
//   · `div.day-header` con `div.day-number {{ day.roman }}` + un `<div>` que envuelve
//     `h2 {{ day.title }}` + `div.day-subtitle {{ day.subtitle }}` (el wrapper interno es
//     necesario para el layout flex, index.html:2381-2384).
//   · `div.day-stats` con un `div.day-stats-item` por `day.stats[]`: la clase de variante
//     (`walk`/`train`/`taxi`/`metro`/`ticket`) + el texto vía `<MDC unwrap="p" :tag="false">`
//     (el texto lleva `**negrita**` inline, p. ej. `**~3,5 km** a pie`; `:tag="false"` suprime el
//     `<div class="">` envoltorio de MDCRenderer, learning D-04-A; `unwrap="p"` evita el `<p>` que
//     rompería el flujo inline del `.day-stats-item`).
//   · `div.dia-ligera` (v-if `day.light`) — CSS-OCULTO por defecto (leaflet.css:812), visible con
//     `body.light-mode`: `div.dia-ligera-head {{ day.light.title }}` ("🦶 Versión ligera · viernes")
//     + `<ul>` PLANO (sin clase; los bullets los pone el CSS por `li.lg-*::before`, leaflet.css:827)
//     con un `<li :class="'lg-' + item.kind">` por `day.light.items[]` (kind see/move/skip/care/rest)
//     y el texto vía `<MDC unwrap="p" :tag="false">` (lleva `**negrita**`/`[enlaces](#…)` inline).
//   · `<Timeline :rows="day.timeline" />` — el despachador del timeline por kind (Plan 04-03).
//   · `div.cards-list` con un `<MonumentCard :monument="m">` por ficha resuelta, en ORDEN del dato.
//
// CSS verbatim global (base.css `.day-header`/`.day-number`/`.day-subtitle`/`.day-stats`/
// `.day-stats-item`, leaflet.css `.light-banner`/`.dia-ligera`/`.dia-ligera-head`) — CERO CSS, sin
// bloque de estilos con scope (un data-v-* rompería `.day-stats-item.walk`, `.dia-ligera li.lg-see`,
// `body.light-mode .dia-ligera`, `body.modo-resumen .day-stats`). Paridad por construcción.
// `Timeline`/`MonumentCard`/`MDC` se auto-importan.
//
// RUTA DEL DÍA (FEAT-09, Plan 06-03): el botón `.day-route-btn` que cierra la banda `.day-stats`
// deriva su `href` de `day.cards` EN ORDEN (DATA-03), reutilizando la MISMA cadena que `dayCards`
// (`day.cards → monById → filter defensivo`) y luego `.map(pointFor)`. NINGÚN filtro por `type`
// (RESEARCH §Pitfall 2 — el sábado conserva `vaticano`★ + `auditorium`♪, 8 paradas; un filtro de
// tipo rompería SC#4). Sustituye el `stats.appendChild` imperativo del original (index.html:6644)
// por un `<a>` reactivo (`:href`/`v-if`) renderizado en SSG (prerender) — sin DOM, sin client-only.
// Las utilidades puras `pointFor`/`capStops`/`buildDirUrl`/`routeLabel` se auto-importan de
// `app/utils/dayRoute.ts` (Plan 06-01). `.day-route-btn` ya existe verbatim en base.css:393-413
// (glifo 🗺️, `margin-left:auto`, hover, regla `<600px width:100%`) → CERO CSS nuevo aquí.
//
// RUTA DEL DÍA POR MODO (Fase 12, EXT-06, D-04, D-14): las paradas salen de `routeCards(day)`
// (`day.cards` en orden menos las fichas citadas SOLO dentro de opciones de un `choice`: la ruta
// nunca mezcla A y B) y siguen la misma cadena `monById → filter defensivo → pointFor`, sin filtro
// por `type`. El botón se monta con `routeVisible` (día + número de paradas): nunca con < 2 paradas;
// `day.route.enabled` lo oculta (`false`) o lo fuerza (`true`); sin él, un tramo `ferry` en el día
// (también dentro de una opción) lo oculta. `day.route?.mode` (walking por defecto) cambia SOLO el
// `travelmode` del `href` y el `title` (`routeTitle`); texto (`routeLabel`), glifo, `target` y
// `rel` noopener no cambian. Roma no define `route`, ni `choice`, ni ferry: su `href`, su `title`
// y su texto son byte a byte los de antes.
//
// «DORMÍS EN …» (Fase 12, EXT-02, D-06…D-08): TripView resuelve la base del día con
// `stayFor(day, trip.stays)` y la pasa en la prop opcional `stay`. Con base, la cabecera pinta
// `div.day-stay` («Dormís en » + `span.day-stay-name` con el `name` por `<MDC>`) DENTRO del `<div>`
// interior de `.day-header`, después del `h2` y antes de `.day-subtitle`. Va con clase propia y
// FUERA de `.day-subtitle` porque el modo resumen oculta `.day-subtitle` (Pitfall 15) y saber dónde
// se duerme es información de índice: sigue visible. Sin base (`v-if`), no se pinta nada ni texto
// de relleno; Roma no define `stays`, así que su DOM solo gana el comentario vacío de Vue. El glifo
// 🛏️ y el estilo los pone tripshapes.css (bloque EXT-02); `area`/`coords`/`note` no se pintan (D-08).
import type { Day, Monument, Stay } from '~~/shared/schemas'

const props = defineProps<{ day: Day, monById: Map<string, Monument>, stay?: Stay | null }>()

// `day.cards[]` (slugs ordenados) → fichas, EN EL ORDEN DEL DATO. `filter` defensivo para slugs
// sin ficha (no debería ocurrir con los datos F2); el orden NUNCA se altera (DATA-03/Pitfall 6).
const dayCards = computed(() =>
  props.day.cards.map(slug => props.monById.get(slug)).filter((m): m is Monument => !!m),
)

// Paradas de la "ruta del día": `routeCards(day)` (sin las fichas de solo-opción, D-04) y luego la
// MISMA cadena que `dayCards` (mismo filtro defensivo, SIN filtro por type — Pitfall 2) y
// `.map(pointFor)` → strings `"lat,lng"` en orden. `routeHref` arma el enlace de Google Maps en el
// modo del día (a pie por defecto, D-14), capando a 10 paradas. El botón lo decide `routeVisible`.
const points = computed(() =>
  routeCards(props.day)
    .map(slug => props.monById.get(slug))
    .filter((m): m is Monument => !!m)
    .map(pointFor),
)
const routeHref = computed(() => buildDirUrl(capStops(points.value), props.day.route?.mode))
</script>

<template>
  <div class="container">
    <div class="light-banner">
      🦶 <strong>Modo «Caminar menos» activado.</strong> El ritmo está en <em>Pesimista</em> (solo lo imprescindible) y cada día muestra una <strong>«Versión ligera»</strong> con qué ver, cómo moverte en taxi/metro y dónde hay escaleras o cuestas que esquivar. Desactívalo arriba (🦶) para volver al plan completo.
    </div>
    <div class="section-eyebrow">
      {{ day.eyebrow }}
    </div>
    <div class="day-header">
      <div class="day-number">
        {{ day.roman }}
      </div>
      <div>
        <h2>{{ day.title }}</h2>
        <div
          v-if="stay"
          class="day-stay"
        >
          Dormís en <span class="day-stay-name"><MDC
            :value="stay.name"
            :tag="false"
            unwrap="p"
          /></span>
        </div>
        <div class="day-subtitle">
          {{ day.subtitle }}
        </div>
      </div>
    </div>

    <div class="day-stats">
      <div
        v-for="(s, i) in day.stats"
        :key="i"
        class="day-stats-item"
        :class="s.variant"
      >
        <MDC
          :value="s.text"
          :tag="false"
          unwrap="p"
        />
      </div>
      <a
        v-if="routeVisible(day, points.length)"
        class="day-route-btn"
        :href="routeHref"
        target="_blank"
        rel="noopener"
        :title="routeTitle(day.route?.mode)"
      >{{ routeLabel(points.length) }}</a>
    </div>

    <div
      v-if="day.light"
      class="dia-ligera"
    >
      <div class="dia-ligera-head">
        {{ day.light.title }}
      </div>
      <ul>
        <li
          v-for="(item, i) in day.light.items"
          :key="i"
          :class="`lg-${item.kind}`"
        >
          <MDC
            :value="item.text"
            :tag="false"
            unwrap="p"
          />
        </li>
      </ul>
    </div>

    <Timeline :rows="day.timeline" />

    <div class="cards-list">
      <MonumentCard
        v-for="m in dayCards"
        :key="m.slug"
        :monument="m"
      />
    </div>
  </div>
</template>
