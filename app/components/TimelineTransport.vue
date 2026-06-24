<script setup lang="ts">
// TimelineTransport — una fila `.tl-transport` del timeline (UI-03). Reproduce VERBATIM el bloque
// de transporte de index.html:2405 (taxi), :2411 (walk), :4800 (train), :3478 (metro-b) y
// :4069/:4767 (metro). Es la rama `kind:'transport'` del discriminatedUnion.
//
// SE FILTRA POR RITMO (FEAT-06, Pitfall 4) — junto con TimelineStop son las DOS ÚNICAS filas que
// se ocultan por ritmo. Consume `isVisible` del singleton useTripModes (Plan 04-01, auto-importado)
// y aplica `:class="{ 'tl-hidden': !isVisible(row.pace) }"` sobre la raíz, combinado con la clase
// de variante. Se conserva `:data-pace="row.pace"` por PARIDAD DE ATRIBUTO (mapea index.html:6521,
// que solo selecciona `.tl-item[data-pace]` y `.tl-transport[data-pace]`).
//
// VARIANTE de clase (`taxi`/`walk`/`train` — y `metro`/`metro-b` en el original): se BINDEA
// `row.variant` DIRECTAMENTE como clase (no un check hardcodeado de enum), de modo que la fila
// reproduce el color de borde por variante (base.css:513-516 `.tl-transport.taxi/.walk/.metro/
// .metro-b`, leaflet.css equivalentes). Bindear el string directo hace al componente fiel a CUALQUIER
// variante que traiga el dato — incl. `metro`/`metro-b` cuando el esquema/datos F2 las recuperen
// (ver deferred-items.md: hoy el enum del esquema es taxi|walk|train y los datos de metro perdieron
// el campo en la migración F2; eso es alcance de F2, no de este plan). Si `variant` está ausente,
// no se añade clase de variante (el original siempre la lleva, pero el dato manda).
//
// ESTRUCTURA VERBATIM (index.html:2405): `.tl-transport-header` (texto) + `.tl-transport-modes` con
// un `.tl-transport-mode` por `row.modes` (`.recommended` condicional). Cada modo:
//   · `span.tl-transport-mode-icon` (emoji, texto plano)
//   · `div.tl-transport-mode-desc` con el desc (MDC inline) y, DENTRO del mismo div, el
//     `span.tl-transport-mode-tag` opcional (texto plano) — el tag va ANIDADO en el desc, no como
//     hermano (index.html:2405 `…sale a cuenta<span class="tl-transport-mode-tag">recomendado…`).
//   · `div.tl-transport-mode-meta` opcional con el meta (MDC inline; lleva `**negritas**`).
// `.tl-transport-footnote` opcional al final (MDC inline).
//
// `desc`/`meta`/`footnote` son Markdown-inline → `<MDC unwrap="p" :tag="false">` (matriz unwrap de
// UI-SPEC; `:tag="false"` suprime el `<div class="">` envoltorio de MDCRenderer, learning D-04-A).
// `icon` y `tag` son texto plano (el esquema los tipa string sin Markdown) → interpolación directa.
//
// CSS verbatim global — CERO CSS, sin bloque de estilos con scope (un data-v-* rompería
// `.tl-transport.taxi`, `.tl-transport[data-pace]`, `body.modo-resumen .tl-transport`,
// `.tl-transport-mode.recommended`). Paridad por construcción.
import type { Day } from '~~/shared/schemas'

type TransportRow = Extract<Day['timeline'][number], { kind: 'transport' }>

defineProps<{ row: TransportRow }>()

const { isVisible } = useTripModes()
</script>

<template>
  <div
    class="tl-transport"
    :class="[row.variant, { 'tl-hidden': !isVisible(row.pace) }]"
    :data-pace="row.pace"
  >
    <div class="tl-transport-header">
      {{ row.header }}
    </div>
    <div class="tl-transport-modes">
      <div
        v-for="(mode, i) in row.modes"
        :key="i"
        class="tl-transport-mode"
        :class="{ recommended: mode.recommended }"
      >
        <span class="tl-transport-mode-icon">{{ mode.icon }}</span>
        <div class="tl-transport-mode-desc"><MDC
          :value="mode.desc"
          :tag="false"
          unwrap="p"
        /><span
          v-if="mode.tag"
          class="tl-transport-mode-tag"
        >{{ mode.tag }}</span></div>
        <div
          v-if="mode.meta"
          class="tl-transport-mode-meta"
        ><MDC
          :value="mode.meta"
          :tag="false"
          unwrap="p"
        /></div>
      </div>
    </div>
    <div
      v-if="row.footnote"
      class="tl-transport-footnote"
    ><MDC
      :value="row.footnote"
      :tag="false"
      unwrap="p"
    /></div>
  </div>
</template>
