<script setup lang="ts">
// ReservasSection — el contenido de la sección `#reservas` (UI-04). Reproduce VERBATIM
// `index.html:5260-5333`. Análogo de `TheHero` (sección data-bound + `<MDC>`). NO incluye el
// `<section id="reservas">` (eso lo pone `TripView`, A3): emite el `.container` + el contenido.
//
// Recibe la entrada de reservas por prop `reservas: Reference` (el `slug:'reservas'` discrimina
// el union; `useTrip` ya castea a los tipos zod). Para estrechar el tipo a la rama reservas
// (con `confirmed`/`table`/etc.) se usa `v-if="reservas.slug === 'reservas'"` en la plantilla.
//
// CABECERA: `div.section-eyebrow {{ eyebrow }}` + `h2.section-title {{ title }}` ("Reservas") +
// `p.gastro-intro` con `<MDC unwrap="p">` sobre `intro` (sí, la sección de reservas reutiliza la
// clase `.gastro-intro` para su párrafo introductorio en el original, index.html:5264).
//
// RESERVAS-BOX (index.html:5265-5331):
//   · `div.reservas-confirmadas` (solo si algún grupo tiene entradas; D-03):
//       - `h4` con `headings.mesas` + `<ul>` con los `confirmed` del grupo 'mesas'.
//       - `h4 style="margin-top:.7rem;"` con `headings.visitas` (estilo inline verbatim de
//         index.html:5277, también cuando el primer grupo está vacío) + `<ul>` con los del grupo
//         'visitas'.
//       ENCABEZADOS (Fase 12.1, D-01/D-02): salen de `headings` del `reservas.yml` del viaje vía
//       `resolveReservasHeadings` (app/utils/reservasHeadings.ts); cada clave ausente cae al
//       texto de Roma (`RESERVAS_HEADINGS_DEFAULT`, copiado de index.html:5267/5277/5284), que
//       se define allí UNA sola vez. Interpolación `{{ }}` (texto plano, auto-escapado), nunca
//       `<MDC>`. El segundo h4 y la cabecera llevan un espacio delante y detrás DENTRO de la
//       expresión: el texto estático multilínea de antes salía así (condensación de Vue), y Vue
//       quita los nodos solo-espacio alrededor de una interpolación. Lo vigila
//       tests/data/romaReservas.spec.ts (sección de Roma byte a byte).
//       GRUPOS VACÍOS (D-03): `confirmedGroup` da las entradas de cada grupo; el `h4` y el `<ul>`
//       de un grupo sin entradas no se pintan, y sin entradas en ninguno no hay bloque. Cada
//       `v-if` va en su propio elemento, nunca en un `<template>` envoltorio (en SSR añadiría
//       comentarios de fragmento y cambiaría los bytes de Roma).
//       Cada `<li>`: `span.rc-when {{ when }}` + " — " + el resto del texto con `<MDC unwrap="p"
//       :tag="false">` (lleva `[enlaces](#…)`, `_cursiva_`, `**negrita**`). El " — " va entre el
//       rc-when y el texto, verbatim index.html:5269.
//   · `div.reservas-box-header` con `headings.table` (index.html:5284).
//   · `table.reservas-table` con un `<tr :class="{ 'is-done': r.isDone }">` por fila de `table`:
//       - `<td>`: si `r.ref` → `<a :href="'#'+r.ref">{{ r.name }}</a>` (enlace plano, intercepción
//         SPA es F5); si no → `<strong>{{ r.name }}</strong>` para la fila "Sin reserva (hacer
//         cola)" (index.html:5327, que va en `<strong>`) o texto plano para "Otello" (5323). OJO:
//         Otello (sin ref) va como TEXTO PLANO y "Sin reserva" va en `<strong>` — se distinguen por
//         dato; ver nota de paridad abajo. Tras el nombre, si hay badge: `span.reservas-badge`
//         con clase `badge-`+badgeKind y texto `r.badge` (v-if: la fila "Sin reserva" no lleva).
//       - `<td>` con la descripción vía `<MDC unwrap="p" :tag="false">` (lleva `**negrita**` y
//         `[enlaces](#…)`).
//
// NOTA DE PARIDAD (filas sin ref): en el original "Otello" (5323) es texto plano y "Sin reserva
// (hacer cola)" (5327) va en `<strong>`. El dato F2 NO distingue (ambas son `name` sin `ref` ni
// badge salvo Otello que sí trae badge 'done'). Se distingue por: si NO hay ref y NO hay badge →
// es la fila "Sin reserva" → `<strong>`; si NO hay ref pero SÍ hay badge → "Otello" → texto plano.
// Esta heurística reproduce el original exactamente con los datos actuales (verificado).
//
// MDC: `confirmed[].text`/`table[].desc` → `<MDC unwrap="p" :tag="false">` (inline en li/td;
// matriz unwrap de UI-SPEC; `:tag="false"` evita el `<div class="">`, learning D-04-A).
//
// CSS verbatim global (base.css `.reservas-box`/`.reservas-confirmadas`/`.rc-when`/
// `.reservas-box-header`/`.reservas-table`/`.reservas-badge.badge-urgent`/`.badge-done`/
// `.badge-rec`/`tr.is-done`) — CERO CSS, sin bloque de estilos con scope.
import type { Reference } from '~~/shared/schemas'

const props = defineProps<{ reservas: Reference }>()

const headings = computed(() => resolveReservasHeadings(props.reservas.slug === 'reservas' ? props.reservas.headings : undefined))
const mesas = computed(() => props.reservas.slug === 'reservas' ? confirmedGroup(props.reservas.confirmed, 'mesas') : [])
const visitas = computed(() => props.reservas.slug === 'reservas' ? confirmedGroup(props.reservas.confirmed, 'visitas') : [])
</script>

<template>
  <div
    v-if="reservas.slug === 'reservas'"
    class="container"
  >
    <div class="section-eyebrow">
      {{ reservas.eyebrow }}
    </div>
    <h2 class="section-title">
      {{ reservas.title }}
    </h2>
    <p class="gastro-intro">
      <MDC
        :value="reservas.intro"
        :tag="false"
        unwrap="p"
      />
    </p>

    <div class="reservas-box">
      <div
        v-if="mesas.length || visitas.length"
        class="reservas-confirmadas"
      >
        <h4 v-if="mesas.length">{{ headings.mesas }}</h4>
        <ul v-if="mesas.length">
          <li
            v-for="(c, i) in mesas"
            :key="`mesas-${i}`"
          ><span class="rc-when">{{ c.when }}</span> — <MDC :value="c.text" unwrap="p" :tag="false" /></li>
        </ul>
        <h4
          v-if="visitas.length"
          style="margin-top:.7rem;"
        >
          {{ ` ${headings.visitas} ` }}
        </h4>
        <ul v-if="visitas.length">
          <li
            v-for="(c, i) in visitas"
            :key="`visitas-${i}`"
          ><span class="rc-when">{{ c.when }}</span> — <MDC :value="c.text" unwrap="p" :tag="false" /></li>
        </ul>
      </div>
      <div class="reservas-box-header">
        {{ ` ${headings.table} ` }}
      </div>
      <table class="reservas-table">
        <tr
          v-for="(r, i) in reservas.table"
          :key="i"
          :class="{ 'is-done': r.isDone }"
        >
          <td><a
            v-if="r.ref"
            :href="`#${r.ref}`"
          >{{ r.name }}</a><strong v-else-if="!r.badge">{{ r.name }}</strong><template v-else>{{ r.name }}</template><span
            v-if="r.badge"
            class="reservas-badge"
            :class="`badge-${r.badgeKind}`"
          >{{ r.badge }}</span></td>
          <td><MDC :value="r.desc" unwrap="p" :tag="false" /></td>
        </tr>
      </table>
    </div>
  </div>
</template>
