/**
 * Predicado del banner "Sin conexión" del mapa (FEAT-02, SC#1) — función PURA.
 *
 * Portado 1:1 de index.html:6330. El `index.html` cuenta tiles cargados/fallidos en el
 * `tileLayer` de Leaflet (`tileload`/`tileerror`) y muestra el banner offline
 * (`#map-offline-banner.show`) cuando se cumple ESTA heurística:
 *   `tilesErrored > 3 && tilesLoaded === 0`
 * es decir: han fallado MÁS de 3 tiles Y no se ha cargado NINGUNO.
 *
 * Es CONTRAINTUITIVA y NO se "corrige" (igual que la matriz de `pace.ts`): el `> 3` deja
 * pasar exactamente 3 errores sin disparar, y un solo tile cargado (`loaded !== 0`) suprime
 * el banner para siempre — la conexión está viva. Cambiar el `>` por `>=`, o quitar la puerta
 * `loaded === 0`, rompería la paridad de SC#1.
 *
 * Se extrae a `app/utils/` (igual que `pace.ts`/`mapMarkers.ts`) para que Nuxt la auto-importe
 * como `isOffline` en el componente `LeafletMap.client.vue` (Plan 02, que conserva los
 * contadores y el `classList.add('show')`) Y para poder testearla en Vitest plano sin runtime
 * Nuxt (su test: `tests/unit/mapOffline.spec.ts`). Función pura: sin I/O, sin estado, sin
 * efectos, sin dependencia de Nuxt/Vue/DOM.
 */

/**
 * ¿Debe mostrarse el banner offline? `true` SOLO si han fallado más de 3 tiles
 * (`errored > 3`) Y no se ha cargado ninguno (`loaded === 0`). Heurística EXACTA de
 * index.html:6330.
 */
export function isOffline(errored: number, loaded: number): boolean {
  return errored > 3 && loaded === 0
}
