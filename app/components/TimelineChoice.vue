<script setup lang="ts">
// TimelineChoice — una fila `choice` del timeline (Fase 12, EXT-01; D-01…D-03). Es la rama
// `kind:'choice'` del discriminatedUnion: un punto del día en el que el recorrido se bifurca en
// 2 o 3 opciones que se leen apiladas, con el mismo tratamiento (la guía no recomienda ninguna).
//
// CONTRATO DE DOM (12-UI-SPEC §«Contrato de DOM», bloque de alternativas):
//   div.tl-choice[role=group][aria-label]
//     div.tl-choice-heading         «Elige una» o el `heading` del dato (MDC inline)
//     div.tl-choice-option          una por opción, en el orden del dato
//       div.tl-choice-label         `label` en texto plano
//       div.tl-choice-title         `title` (MDC inline)
//       <Timeline :rows>            sus filas, por el MISMO despachador → div.timeline
//     div.tl-choice-sep             «— o bien —» (U+2014) solo ENTRE opciones
//
// RAÍZ `div`, NUNCA `section` (D-02, H25): el scrollspy y la navegación toman todas las
// `section[id]` de la página como días/secciones, así que dentro del bloque no hay `section`,
// ni titulares `h*` (no rompen la jerarquía del `h2` del día) ni atributos `id`.
//
// NO CONSULTA EL RITMO (D-03): el `choice` no tiene `pace` (el esquema lo rechaza). Sus filas
// interiores conservan el suyo y se filtran solas en TimelineStop/TimelineTransport (`.tl-hidden`),
// así que el bloque, el encabezado, las etiquetas, los títulos y los separadores son siempre
// visibles; si el ritmo oculta todas las filas de una opción, quedan su etiqueta y su título.
//
// IMPORTACIÓN CIRCULAR Timeline ⇄ TimelineChoice (Pitfall 12): Timeline.vue resuelve este
// componente y este pinta `<Timeline>` (auto-import). El ciclo entre SFC es seguro porque las
// definiciones se usan al renderizar, no al evaluar el módulo; y no hay recursión infinita porque
// las filas de una opción son `BaseTimelineRow` (sin `choice`: un solo nivel por construcción).
//
// `label` es texto plano → interpolación; `heading` y `title` son Markdown-inline →
// `<MDC :tag="false" unwrap="p">` (sin envoltorio extra). Sin HTML crudo, sin interacción y sin
// bloque de estilos: el CSS vive en app/assets/css/tripshapes.css (D-17), global como el resto.
// `inlineMdToPlain` (app/utils/tripLayout.ts) llega por auto-import, como en TripView.vue.
import type { Day } from '~~/shared/schemas'

type ChoiceRow = Extract<Day['timeline'][number], { kind: 'choice' }>

const props = defineProps<{ row: ChoiceRow }>()

const DEFAULT_HEADING = 'Elige una'
const ariaLabel = computed(() => (props.row.heading ? inlineMdToPlain(props.row.heading) : DEFAULT_HEADING))
</script>

<template>
  <div
    class="tl-choice"
    role="group"
    :aria-label="ariaLabel"
  >
    <div class="tl-choice-heading">
      <MDC
        v-if="row.heading"
        :value="row.heading"
        :tag="false"
        unwrap="p"
      /><template v-else>
        {{ DEFAULT_HEADING }}
      </template>
    </div>
    <template
      v-for="(opt, i) in row.options"
      :key="i"
    >
      <div
        v-if="i > 0"
        class="tl-choice-sep"
      >
        — o bien —
      </div>
      <div class="tl-choice-option">
        <div class="tl-choice-label">
          {{ opt.label }}
        </div>
        <div class="tl-choice-title">
          <MDC
            :value="opt.title"
            :tag="false"
            unwrap="p"
          />
        </div>
        <Timeline :rows="opt.rows" />
      </div>
    </template>
  </div>
</template>
