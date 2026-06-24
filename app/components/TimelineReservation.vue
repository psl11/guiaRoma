<script setup lang="ts">
// TimelineReservation — una fila `.tl-resv-meta` del timeline: la banda verde de reserva
// confirmada (UI-03). Reproduce VERBATIM index.html:2433
// (`<div class="tl-resv-meta">✅ <strong>Cena reservada · Osteria da Fortunata</strong> — …</div>`).
// Es la rama `kind:'reservation'` del discriminatedUnion ({ text }).
//
// NO SE FILTRA POR RITMO (Pitfall 4 — CRÍTICO). Esta banda NUNCA se oculta por ritmo: NO importa
// el composable de modos ni consulta la matriz de visibilidad. La rama `reservation` del esquema ni
// siquiera lleva `pace`. (En modo resumen el CSS la mantiene visible: forma parte de la vista índice.)
//
// EL ✅ ESTÁ EN EL DATO. A diferencia de lo que sugería el plan ("el ✅ es literal en el markup"),
// la migración F2 codificó el bloque COMPLETO en `text`, INCLUIDO el ✅ inicial
// (`✅ **Cena reservada · …** — …`, verificado en las 9 reservas de los 5 días). Por eso se renderiza
// TODO el `text` con un solo `<MDC>` (NO un ✅ literal + MDC del resto, que DUPLICARÍA el emoji). MDC
// produce `✅ <strong>…</strong> — …`, idéntico al original. Si el texto trae un teléfono
// `.tl-resv-tel` (mono, index.html lo usa en 2 reservas), va dentro del propio Markdown del `text` y
// MDC lo respeta; el CSS `.tl-resv-meta .tl-resv-tel` le da la tipografía mono.
//
// `<MDC unwrap="p" :tag="false">`: el texto va DIRECTO dentro de `.tl-resv-meta` (sin `<p>`, como el
// original); `unwrap="p"` quita el `<p>` interno y `:tag="false"` suprime el `<div class="">`
// envoltorio de MDCRenderer (learning D-04-A del Plan 04-02).
//
// CSS verbatim global (base.css `.tl-resv-meta`/`.tl-resv-meta strong`/`.tl-resv-tel`) — CERO CSS,
// sin bloque de estilos con scope (un data-v-* rompería `.tl-resv-meta strong`,
// `.tl-resv-meta .tl-resv-tel`). Paridad por construcción.
import type { Day } from '~~/shared/schemas'

type ReservationRow = Extract<Day['timeline'][number], { kind: 'reservation' }>

defineProps<{ row: ReservationRow }>()
</script>

<template>
  <div class="tl-resv-meta">
    <MDC
      :value="row.text"
      :tag="false"
      unwrap="p"
    />
  </div>
</template>
