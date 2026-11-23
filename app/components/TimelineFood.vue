<script setup lang="ts">
// TimelineFood — una fila `.tl-food` del timeline (UI-03). Reproduce VERBATIM index.html:2420-2426
// (café para llevar, un item con `tl-food-time`) y :2434-2444 (la mesa + alternativas: un item
// `.reserved` con `tl-resv-badge` y varios con `tl-food-time`). Es la rama `kind:'food'` del
// discriminatedUnion.
//
// NO SE FILTRA POR RITMO (Pitfall 4 — CRÍTICO). Aunque la rama `food` del esquema SÍ lleva `pace`,
// esta fila NUNCA se oculta por ritmo: NO importa el composable de modos ni consulta la matriz de
// visibilidad (index.html:6521 solo selecciona `.tl-item[data-pace]`/`.tl-transport[data-pace]`).
// El campo `pace` del dato existe pero NO se usa aquí. (En modo resumen el CSS la mantiene visible:
// es parte de la vista índice.)
//
// ESTRUCTURA VERBATIM (index.html:2434-2444): `div.tl-food` con `div.tl-food-header` (texto plano,
// p. ej. "🍴 Tu mesa…") + `div.tl-food-list` con un `div.tl-food-item` por entrada
// (`:class="{ reserved: entry.reserved }"`). Cada item:
//   · `a.tl-food-name` cuyo href es `#`+entry.ref (ancla a ficha gastro, enlace plano; la
//     intercepción SPA es F5) O entry.href (URL externa de Maps para cafés sueltos). Los enlaces
//     EXTERNOS llevan `target="_blank" rel="noopener"` VERBATIM (index.html:2423, anti-tabnabbing);
//     los internos `#…` NO (index.html:2437-2441). `ref` y `href` son AMBOS opcionales en el
//     esquema: si faltan los dos, se renderiza un `span.tl-food-name` (mismo markup, sin href)
//     en lugar de `<a href="undefined">` (CR-02). En los datos F2 de Roma toda entrada lleva
//     `ref` O `href`, así que el span es solo defensa ante un dato schema-válido sin enlace.
//   · `span.tl-resv-badge` (badge "✓ reservado 22:30") O `span.tl-food-time` ("🚶 3 min"), ambos
//     opcionales (v-if), en ese orden.
//   · `span.tl-food-desc` con el desc (Markdown-inline → `<MDC unwrap="p" :tag="false">`).
// `div.tl-food-foot` opcional al final (footnote, Markdown-inline → MDC inline). OJO a los tipos de
// elemento del original: `tl-food-desc` es un `<span>`, `tl-food-foot` un `<div>`.
//
// `<MDC unwrap="p" :tag="false">` en desc/footnote (fragmentos inline; matriz unwrap de UI-SPEC;
// `:tag="false"` suprime el `<div class="">` envoltorio de MDCRenderer, learning D-04-A). `header`,
// `badge`, `time` y `name` son texto plano (el esquema no los tipa como Markdown) → interpolación.
//
// CSS verbatim global (base.css `.tl-food`/`.tl-food-item.reserved`/`.tl-food-name`/`.tl-resv-badge`/
// `.tl-food-time`/`.tl-food-desc`/`.tl-food-foot`) — CERO CSS, sin bloque de estilos con scope (un
// data-v-* rompería `.tl-food-item.reserved`, `.tl-food-foot a`). Paridad por construcción.
import type { Day } from '~~/shared/schemas'

type FoodRow = Extract<Day['timeline'][number], { kind: 'food' }>

defineProps<{ row: FoodRow }>()
</script>

<template>
  <div class="tl-food">
    <div class="tl-food-header">
      {{ row.header }}
    </div>
    <div class="tl-food-list">
      <div
        v-for="(entry, i) in row.entries"
        :key="i"
        class="tl-food-item"
        :class="{ reserved: entry.reserved }"
      >
        <a
          v-if="entry.ref"
          :href="`#${entry.ref}`"
          class="tl-food-name"
        >{{ entry.name }}</a>
        <a
          v-else-if="entry.href"
          :href="entry.href"
          target="_blank"
          rel="noopener"
          class="tl-food-name"
        >{{ entry.name }}</a>
        <span
          v-else
          class="tl-food-name"
        >{{ entry.name }}</span>
        <span
          v-if="entry.badge"
          class="tl-resv-badge"
        >{{ entry.badge }}</span>
        <span
          v-if="entry.time"
          class="tl-food-time"
        >{{ entry.time }}</span>
        <span class="tl-food-desc"><MDC
          :value="entry.desc"
          :tag="false"
          unwrap="p"
        /></span>
      </div>
    </div>
    <div
      v-if="row.footnote"
      class="tl-food-foot"
    ><MDC
      :value="row.footnote"
      :tag="false"
      unwrap="p"
    /></div>
  </div>
</template>
