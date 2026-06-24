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
//   · `div.reservas-confirmadas`:
//       - `h4` con TEXTO ESTÁTICO "✅ Ya reservado · 3 comensales" (index.html:5267 — chrome, no
//         está en el dato) + `<ul>` con los `confirmed` del grupo 'mesas'.
//       - `h4 style="margin-top:.7rem;"` con TEXTO ESTÁTICO "🎟️ Visitas y entradas reservadas"
//         (index.html:5277, con su estilo inline verbatim) + `<ul>` con los del grupo 'visitas'.
//       Cada `<li>`: `span.rc-when {{ when }}` + " — " + el resto del texto con `<MDC unwrap="p"
//       :tag="false">` (lleva `[enlaces](#…)`, `_cursiva_`, `**negrita**`). El " — " va entre el
//       rc-when y el texto, verbatim index.html:5269.
//   · `div.reservas-box-header` con TEXTO ESTÁTICO "Restaurantes · cuándo reservar y con cuánta
//     antelación" (index.html:5284 — chrome).
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

defineProps<{ reservas: Reference }>()
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
      <div class="reservas-confirmadas">
        <h4>✅ Ya reservado · 3 comensales</h4>
        <ul>
          <li
            v-for="(c, i) in reservas.confirmed.filter(x => x.group === 'mesas')"
            :key="`mesas-${i}`"
          ><span class="rc-when">{{ c.when }}</span> — <MDC :value="c.text" unwrap="p" :tag="false" /></li>
        </ul>
        <h4 style="margin-top:.7rem;">
          🎟️ Visitas y entradas reservadas
        </h4>
        <ul>
          <li
            v-for="(c, i) in reservas.confirmed.filter(x => x.group === 'visitas')"
            :key="`visitas-${i}`"
          ><span class="rc-when">{{ c.when }}</span> — <MDC :value="c.text" unwrap="p" :tag="false" /></li>
        </ul>
      </div>
      <div class="reservas-box-header">
        Restaurantes · cuándo reservar y con cuánta antelación
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
