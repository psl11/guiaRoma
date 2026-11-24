# Deferred Items — Fase 12

## Deferred Items

- **[12-07] En `nuxi dev` el contenedor del mapa pierde `id="leaflet-map"` y queda con 0 px de alto.** Afecta a todos los viajes en dev, Roma incluida (en `/guiaRoma/trips/roma` y `/guiaRoma/trips/campania` la `.leaflet-container` montada no tiene `id` y mide 720×0, así que `fitBounds` encuadra a zoom mínimo y todos los marcadores caen en el mismo píxel). La build publicada no tiene el problema: `map-fallback-notes.spec.ts` exige `.leaflet-container` visible y los 56 goldens siguen en verde. Es previo a la Fase 12 (los specs de 12-01 ya lo anotaban: «en el DOM montado el contenedor ya no conserva `#leaflet-map`»). Sospecha: interacción en dev entre `<ClientOnly>` con `#fallback` `<div id="leaflet-map">` (TripView.vue) y el envoltorio `createClientOnly` de `LeafletMap.client.vue`. Fuera del alcance de 12-07 (tocaría TripView o LeafletMap, con riesgo para la paridad). Hasta que se arregle, el test EXT-05 de `campania.spec.ts` devuelve en la página los 520 px de base.css al contenedor antes de que monte el mapa.
  status: acknowledged
