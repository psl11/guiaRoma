<script setup lang="ts">
// TimelineStop — una fila `.tl-item` del timeline (UI-03). Reproduce VERBATIM index.html:2404
// (parada con enlace), :2406 (`.tl-title.disabled` para llegada/check-in) y :2432
// (`.tl-item.reserved-event` para la cena). Es la rama `kind:'stop'` del discriminatedUnion.
//
// SE FILTRA POR RITMO (FEAT-06, Pitfall 4) — junto con TimelineTransport son las DOS ÚNICAS
// filas que se ocultan por ritmo. Consume `isVisible` del singleton useTripModes (Plan 04-01,
// auto-importado) y aplica `:class="{ 'tl-hidden': !isVisible(row.pace) }"` sobre el elemento
// raíz. Mapea index.html:6521 `querySelectorAll('.tl-item[data-pace], .tl-transport[data-pace]')`
// — SOLO estas dos clases. Se conserva `:data-pace="row.pace"` por PARIDAD DE ATRIBUTO (el
// golden lo tiene; el filtrado real lo hace `.tl-hidden`, pero el atributo debe seguir presente).
//
// TÍTULO condicional (VERBATIM del original): si `row.ref` → `a.tl-title` con `href="#"+ref`
// (enlace plano `#id`; la intercepción SPA es F5). Si no → `span.tl-title` y la clase `disabled`
// va en el TÍTULO (no en la raíz), exactamente como index.html:2406 (`<span class="tl-title
// disabled">`). En el original las paradas con `disabled` no llevan enlace, así que `disabled`
// solo se aplica al `span`. La clase `reserved-event` va en la RAÍZ `.tl-item` (index.html:2432).
//
// `.tl-tag` y `.tl-note` son opcionales (v-if). `tl-note` es un fragmento inline dentro de un div
// ya estilizado → `<MDC unwrap="p" :tag="false">` (matriz unwrap de UI-SPEC; `:tag="false"`
// suprime el `<div class="">` envoltorio de MDCRenderer, learning D-04-A del Plan 04-02).
//
// NOTA de paridad: la rama `stop` del esquema NO tiene campo para `.fixed-event` (solo `disabled`
// y `reservedEvent`), así que esa variante NO se renderiza (el dato no la expresa). Verbatim del
// contrato de datos F2.
//
// CSS verbatim global (base.css `.tl-item`/`.tl-time`/`.tl-title`, leaflet.css `.tl-hidden`) —
// CERO CSS, sin bloque de estilos con scope (un data-v-* rompería `.tl-item[data-pace]`,
// `.tl-item.reserved-event`, `body.modo-resumen .tl-item`). Paridad por construcción.
import type { Day } from '~~/shared/schemas'

// Estrechamos la rama `kind:'stop'` desde el tipo de la prop del dispatcher (una sola fuente de
// verdad de tipos: el discriminatedUnion de shared/schemas.ts).
type StopRow = Extract<Day['timeline'][number], { kind: 'stop' }>

defineProps<{ row: StopRow }>()

const { isVisible } = useTripModes()
</script>

<template>
  <div
    class="tl-item"
    :class="{ 'tl-hidden': !isVisible(row.pace), 'reserved-event': row.reservedEvent }"
    :data-pace="row.pace"
  >
    <span class="tl-time">{{ row.time }}</span>
    <a
      v-if="row.ref"
      :href="`#${row.ref}`"
      class="tl-title"
    >{{ row.title }}</a>
    <span
      v-else
      class="tl-title"
      :class="{ disabled: row.disabled }"
    >{{ row.title }}</span>
    <span
      v-if="row.tag"
      class="tl-tag"
    >{{ row.tag }}</span>
    <div
      v-if="row.note"
      class="tl-note"
    ><MDC
      :value="row.note"
      :tag="false"
      unwrap="p"
    /></div>
  </div>
</template>
