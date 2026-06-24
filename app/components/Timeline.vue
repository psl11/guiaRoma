<script setup lang="ts">
// Timeline — el DESPACHADOR del timeline por `kind` (UI-03). Reproduce el contenedor
// `.timeline` de index.html:2403-2446 e itera `day.timeline[]` en el ORDEN del dato
// (DATA-02; NUNCA reordena: ese orden es la "ruta del día" que F6 deriva).
//
// PATRÓN núcleo (análogo NavPills.vue: v-for sobre un array tipado de ~~/shared/schemas):
// mapea 1:1 el `discriminatedUnion('kind')` del esquema (5 kinds) a sus 5 componentes hoja
// vía `<component :is="COMPONENT_BY_KIND[row.kind]">` (D-09), de modo que cada hoja recibe su
// rama estrechada como `row`.
//
// RESOLUCIÓN POR `resolveComponent` (NO por string crudo en `:is`): el auto-import de Nuxt es una
// transformación en COMPILACIÓN que solo inyecta el import de los componentes referenciados
// ESTÁTICAMENTE en el template; un nombre que vive en un objeto JS (`COMPONENT_BY_KIND`) NO es una
// referencia estática, así que pasar ese string directo a `:is` deja a Vue tratándolo como
// elemento nativo y emite `<TimelineStop></TimelineStop>` VACÍO en el SSG (verificado en un render
// real del Plan 05; el patrón sí compila/lint pero no rinde). La cura canónica es resolver cada
// nombre con `resolveComponent(...)` en el setup → `:is` recibe la DEFINICIÓN real del componente.
// Como `resolveComponent('TimelineStop')` SÍ es una referencia estática al nombre, Nuxt además
// inyecta el auto-import correspondiente. Mantiene el patrón dispatcher (mapa kind→componente,
// orden = dato) entregando un componente resuelto en vez de un string.
//
// El DESPACHADOR NO filtra por ritmo y NO importa useTripModes: el filtrado (`.tl-hidden`)
// vive SOLO en TimelineStop/TimelineTransport (Pitfall 4). Aquí solo se reparte.
//
// CSS verbatim global (base.css `.timeline`) — CERO CSS, sin bloque de estilos con scope (un
// data-v-* rompería selectores que cruzan componentes/atributos como `.tl-item[data-pace]`,
// `body.modo-resumen .tl-transport`, `.timeline::before`). Paridad por construcción.
import { resolveComponent } from 'vue'
import type { Day } from '~~/shared/schemas'

defineProps<{ rows: Day['timeline'] }>()

// 1:1 con las 5 ramas del discriminatedUnion (shared/schemas.ts:85-123). Cada nombre se resuelve a
// la DEFINICIÓN del componente auto-importado (resolveComponent es referencia estática → Nuxt
// inyecta el import). Resolver en el setup (una vez) evita repetir la búsqueda por fila.
const COMPONENT_BY_KIND = {
  stop: resolveComponent('TimelineStop'),
  transport: resolveComponent('TimelineTransport'),
  meta: resolveComponent('TimelineMeta'),
  food: resolveComponent('TimelineFood'),
  reservation: resolveComponent('TimelineReservation'),
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
