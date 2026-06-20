<script setup lang="ts">
// Timeline — el DESPACHADOR del timeline por `kind` (UI-03). Reproduce el contenedor
// `.timeline` de index.html:2403-2446 e itera `day.timeline[]` en el ORDEN del dato
// (DATA-02; NUNCA reordena: ese orden es la "ruta del día" que F6 deriva).
//
// PATRÓN núcleo (análogo NavPills.vue: v-for sobre un array tipado de ~~/shared/schemas):
// mapea 1:1 el `discriminatedUnion('kind')` del esquema (5 kinds) a sus 5 componentes hoja
// vía `<component :is="COMPONENT_BY_KIND[row.kind]">` (D-09). El `:is` resuelve por STRING
// contra los auto-imports de Nuxt (A5), así que cada hoja recibe su rama estrechada como `row`.
//
// El DESPACHADOR NO filtra por ritmo y NO importa useTripModes: el filtrado (`.tl-hidden`)
// vive SOLO en TimelineStop/TimelineTransport (Pitfall 4). Aquí solo se reparte.
//
// CSS verbatim global (base.css `.timeline`) — CERO CSS, sin bloque de estilos con scope (un
// data-v-* rompería selectores que cruzan componentes/atributos como `.tl-item[data-pace]`,
// `body.modo-resumen .tl-transport`, `.timeline::before`). Paridad por construcción.
import type { Day } from '~~/shared/schemas'

defineProps<{ rows: Day['timeline'] }>()

// 1:1 con las 5 ramas del discriminatedUnion (shared/schemas.ts:85-123). Resuelto por
// string → auto-imports planos de app/components/ (sin subcarpeta).
const COMPONENT_BY_KIND = {
  stop: 'TimelineStop',
  transport: 'TimelineTransport',
  meta: 'TimelineMeta',
  food: 'TimelineFood',
  reservation: 'TimelineReservation',
} as const
</script>

<template>
  <div class="timeline">
    <component
      :is="COMPONENT_BY_KIND[row.kind]"
      v-for="(row, i) in rows"
      :key="i"
      :row="row"
    />
  </div>
</template>
