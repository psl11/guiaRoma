/**
 * Derivación de los marcadores del mapa (FEAT-02) — función PURA.
 *
 * Reconstruye el array `places` de 39 pines del index.html (6269-6314) a partir de los datos
 * tipados (D-01). El original mantenía a mano una lista de 39 objetos `{ id, n, name, day,
 * lat, lng, type }`: 38 monumentos (`.card`) MÁS el Coliseo (★) en la línea 6292, que NO es
 * una ficha. Aquí los 38 salen de `monById` (los YAML de monumento de la Fase 2) y el Coliseo
 * llega como `extra` (de `trip.mapExtras`, Task 1 de este plan).
 *
 * BLINDAJE CRÍTICO (D-01): el recuento es `38 + extras`, NUNCA `monById.size` a secas. Derivar
 * los marcadores SOLO de `monById` daría 38 y el Coliseo desaparecería del mapa — una regresión
 * de paridad. Por eso `extras` es un parámetro EXPLÍCITO: el llamador (Plan 02) pasa
 * `trip.mapExtras` mapeado a `MapMarker`. El ORDEN de los marcadores es libre (`fitBounds` y la
 * pintura de pines son independientes del orden — RESEARCH Open Q1); el consumidor no asume orden.
 *
 * Se extrae a `app/utils/` (igual que `searchIndex.ts`/`pace.ts`) para que Nuxt la auto-importe
 * como `deriveMarkers` en `LeafletMap.client.vue` (Plan 02) Y para testearla en Vitest plano sin
 * runtime Nuxt (su test: `tests/unit/mapMarkers.spec.ts`, que carga los YAML reales). Función
 * pura: sin I/O, sin estado, sin efectos, sin dependencia de Nuxt/Vue/DOM.
 */
import type { Monument } from '~~/shared/schemas'

/**
 * Un marcador del mapa, la forma que consume `LeafletMap.client.vue` (Plan 02) para el
 * `divIcon` (`n`), los colores por `type` y el popup. Refleja una fila del `places[]` original.
 * `id` es el slug de la ficha (= ancla `#id`); el extra Coliseo NO tiene ficha, así que lleva
 * `id: ''` — la lógica de popup del Plan 02 decide por `type`, no por `id`.
 */
export interface MapMarker {
  id: string
  n: string
  name: string
  day: string
  lat: number
  lng: number
  type: 'card' | 'guided' | 'concert'
}

/**
 * Deriva los marcadores: mapea los monumentos de `monById` a `MapMarker` y concatena los
 * `extras` (el único es el Coliseo). Resultado = `monById.size + extras.length` (= 38 + 1 = 39
 * para Roma, D-01). Orden libre.
 */
export function deriveMarkers(monById: Map<string, Monument>, extras: MapMarker[]): MapMarker[] {
  const fromMonuments: MapMarker[] = [...monById.values()].map(m => ({
    id: m.slug,
    n: m.roman,
    name: m.name,
    day: m.day,
    lat: m.coords.lat,
    lng: m.coords.lng,
    type: m.type,
  }))
  return [...fromMonuments, ...extras]
}
