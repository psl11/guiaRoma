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
import type { Monument, PlaceType } from '~~/shared/schemas'

/**
 * Un marcador del mapa, la forma que consume `LeafletMap.client.vue` (Plan 02) para el
 * `divIcon` (`n`), los colores por `type` y el popup. Refleja una fila del `places[]` original.
 * `id` es el slug de la ficha (= ancla `#id`); el extra Coliseo NO tiene ficha, así que lleva
 * `id: ''` — `markerPopupHtml` decide por `type`, no por `id`.
 *
 * `type` es el `PlaceType` del esquema (Pitfall 7): una unión escrita a mano aquí dejaría fuera
 * los tipos nuevos (`nature`, Fase 12) y `type: m.type` dejaría de compilar.
 */
export interface MapMarker {
  id: string
  n: string
  name: string
  day: string
  lat: number
  lng: number
  type: PlaceType
}

/**
 * Color de fondo del `divIcon` por tipo de lugar (H18, D-11). `Record<PlaceType, …>` obliga a
 * dar un estilo a cada valor del enum: un tipo nuevo sin color no compila.
 *
 * Los tres primeros son los de Roma (port verbatim de index.html:6347-6349) y NO cambian: lo
 * fija byte a byte tests/unit/mapMarkers.spec.ts. `nature` (Fase 12) es el verde agua de los
 * dibujos de naturaleza de svgMotifs.ts, para que marcador y dibujo de reserva compartan color.
 */
export const MARKER_STYLE: Record<PlaceType, { bg: string }> = {
  card: { bg: '#8b3a3a' },
  guided: { bg: '#a07c4a' },
  concert: { bg: '#5a7a3a' },
  nature: { bg: '#2f6f73' },
}

/**
 * Escapa `&`, `<`, `>` y `"` del texto de los datos antes de meterlo en el HTML del popup
 * (Leaflet interpreta el popup como HTML; T-12-10). NO toca la comilla simple: ningún atributo
 * del popup va entre comillas simples, y escaparla cambiaría popups de Roma como el de
 * «Campo de' Fiori». Ningún texto de Roma contiene los cuatro caracteres escapados, así que sus
 * popups salen byte a byte iguales.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * HTML del popup de un marcador, por tipo (H18, D-11). Las tres plantillas de Roma se movieron
 * VERBATIM desde LeafletMap.client.vue (port de index.html:6361-6369, con el manejador inline
 * eliminado); `nature` tiene la misma forma que `concert` con su color.
 *
 * LANDMINE (CR-01): ninguna plantilla lleva manejador de evento. Los anclas `<a href="#slug">`
 * de card/concert/nature los intercepta el listener en CAPTURA de F5 (useCardNavigation), que
 * hace preventDefault + navigateToCard; un manejador en burbuja reproduciría el bug CR-01. Los
 * popups `guided` (el Coliseo ★, vaticano) son TEXTO PLANO, sin ancla: por eso el id vacío del
 * Coliseo extra nunca acaba en un href.
 */
export function markerPopupHtml(m: MapMarker): string {
  const name = escapeHtml(m.name)
  const day = escapeHtml(m.day)
  const id = escapeHtml(m.id)
  switch (m.type) {
    case 'guided':
      return `<strong>${name}</strong><br><em style="color:#a07c4a">${day}</em><br><span style="color:#5c534a;font-size:.85rem">Visita con guía humano</span>`
    case 'concert':
      return `<strong>${name}</strong><br><em style="color:#5a7a3a">${day}</em><br><a href="#${id}" style="color:#5a7a3a">Abrir ficha →</a>`
    case 'nature':
      return `<strong>${name}</strong><br><em style="color:#2f6f73">${day}</em><br><a href="#${id}" style="color:#2f6f73">Abrir ficha →</a>`
    default:
      return `<strong>${name}</strong><br><em style="color:#a07c4a">${day}</em><br><a href="#${id}" style="color:#8b3a3a">Abrir ficha →</a>`
  }
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
