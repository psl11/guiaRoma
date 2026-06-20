<script setup lang="ts">
// TimelineMeta — una fila `.tl-meta` del timeline (UI-03). Reproduce VERBATIM index.html:2407
// (un item `ok`), :2410 (un item `warn`) y :2413 (DOS items: uno `ok` + uno plain). Es la rama
// `kind:'meta'` del discriminatedUnion.
//
// NO SE FILTRA POR RITMO (Pitfall 4 — CRÍTICO). Esta fila NUNCA se oculta por ritmo: NO importa
// el composable de modos ni consulta la matriz de visibilidad. Solo `.tl-item` y `.tl-transport`
// se filtran (index.html:6521 selecciona únicamente esas dos clases). La rama `meta` del esquema
// ni siquiera lleva `pace`. (En modo resumen sí la oculta el CSS `body.modo-resumen .tl-meta`,
// pero eso es CSS global, no lógica de este componente.)
//
// ESTRUCTURA VERBATIM (index.html:2413): `div.tl-meta` con uno o dos `span.tl-meta-item`, cada uno
// con la clase de su `item.level`: `ok` → `tl-meta-item ok`, `warn` → `tl-meta-item warn`, `plain`
// → `tl-meta-item` (sin clase extra). El texto lleva Markdown-inline (`⏱ **60 min** · …`) → se
// renderiza con `<MDC unwrap="p" :tag="false">` (fragmento inline dentro de un span ya estilizado;
// matriz unwrap de UI-SPEC; `:tag="false"` suprime el `<div class="">` envoltorio de MDCRenderer,
// learning D-04-A del Plan 04-02).
//
// CSS verbatim global (base.css `.tl-meta`/`.tl-meta-item`/`.tl-meta-item.ok`/`.warn`) — CERO CSS,
// sin bloque de estilos con scope (un data-v-* rompería `.tl-meta-item.ok b`, `body.modo-resumen
// .tl-meta`). Paridad por construcción.
import type { Day } from '~~/shared/schemas'

type MetaRow = Extract<Day['timeline'][number], { kind: 'meta' }>

defineProps<{ row: MetaRow }>()
</script>

<template>
  <div class="tl-meta">
    <span
      v-for="(item, i) in row.items"
      :key="i"
      class="tl-meta-item"
      :class="{ ok: item.level === 'ok', warn: item.level === 'warn' }"
    ><MDC
      :value="item.text"
      :tag="false"
      unwrap="p"
    /></span>
  </div>
</template>
