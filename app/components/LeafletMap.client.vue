<script setup lang="ts">
// LeafletMap — la ISLA client-only del mapa (FEAT-02), el PRIMER `.client.vue` del repo.
// Port 1:1 de la lógica del index.html (init+tiles+offline 6316-6341, marcadores+popups+
// fitBounds 6343-6378) a la forma de isla del repo (espejo de `useCardNavigationController`
// y de cómo `SearchBox` hospeda su controller una sola vez).
//
// TRES CAPAS ANTI-`window is not defined` (SC#1, la pieza más sensible a SSR/hidratación):
//   1. El sufijo `.client.vue` → Nuxt NO ejecuta este componente en el prerender (la guarda
//      primaria); `<ClientOnly>` en TripView (Task 2) añade el `#fallback` del mismo tamaño.
//   2. `const L = (await import('leaflet')).default` DENTRO del callback de `onMounted`: el
//      import dinámico de Leaflet jamás corre en build/prerender (Leaflet toca `window` al
//      cargarse). NUNCA tocar `window`/`document`/Leaflet en el setup síncrono.
//   3. `<ClientOnly>` (la 3ª capa, en TripView).
//
// CSS: este componente NO importa el CSS de Leaflet — el CSS completo de Leaflet 1.9.4 YA es
// global vía `nuxt.config.ts` (css: [..., '~/assets/css/leaflet.css']). Reimportarlo lo duplicaría.
//
// SIN bloque de estilo scoped: un `data-v-*` rompería los selectores globales `#leaflet-map` /
// `.map-offline-banner` / `.custom-marker` / `[data-theme="dark"] .leaflet-tile` Y el DOM que
// Leaflet genera en runtime (que no lleva atributo de scope).
//
// DATOS: `useTrip(props.slug)` (mismo origen que todos los consumidores; `useAsyncData` deduplica
// por clave, así que comparte el `monById` poblado del controller de F5 y del TripView). Se lee
// `trip.value.map.center/zoom` (setView) y se derivan los 39 marcadores con `deriveMarkers`
// (Plan 01): 38 monumentos de `monById` + el Coliseo (★) de `trip.mapExtras` (D-01). El predicado
// del banner offline es `isOffline` (Plan 01). Ambos auto-importados de `app/utils/`.
//
// LANDMINE (popups): los anclas `<a href="#slug">` de los popups card/concert NO llevan ningún
// manejador de evento de clic. El listener de F5 (useCardNavigation, fase de CAPTURA, montado UNA
// vez por TripView) intercepta `a[href^="#"]`, gatea en `monById.has(id)` y hace
// preventDefault+stopPropagation+navigateToCard. Añadir cualquier handler en burbuja reproduce
// el bug CR-01 (MEMORY.md). Los popups `guided` (Coliseo ★, vaticano) son TEXTO PLANO, sin ancla
// — por eso el Coliseo extra (id='') jamás mete su id vacío en un href (correcto por construcción).
import type * as LeafletNS from 'leaflet'

// WR-03: el slug llega por prop desde TripView (que ya hace `useTrip(props.slug)`) en vez de
// hardcodear 'roma' — preserva el valor núcleo multi-viaje (añadir un viaje = añadir datos, sin
// tocar código). Hoy solo existe 'roma', así que el render no cambia.
const props = defineProps<{ slug: string }>()

// WR-01: la instancia del mapa vive en el scope del setup para que onUnmounted la destruya
// (limpieza en HMR / futura navegación SPA; sin ella, L.map re-lanza "Map container is already
// initialized" al recargar en caliente). onUnmounted se registra ANTES del primer await (el de
// useTrip) para quedar ligado a esta instancia de componente.
let mapInstance: LeafletNS.Map | undefined
onUnmounted(() => {
  mapInstance?.remove()
  mapInstance = undefined
})

const { trip, monById } = await useTrip(props.slug)

const mapEl = ref<HTMLElement | null>(null)

onMounted(async () => {
  // El import dinámico vive AQUÍ dentro: nunca corre en prerender (capa 2 anti-window).
  const L = (await import('leaflet')).default

  // Contadores locales de tiles (port verbatim index.html:6318-6319): el predicado puro
  // `isOffline` (Plan 01) decide; el efecto (mostrar el banner) se queda en el componente.
  let tilesLoaded = 0
  let tilesErrored = 0
  let map: LeafletNS.Map | undefined

  try {
    map = L.map(mapEl.value!, { scrollWheelZoom: false })
      .setView([trip.value!.map.center.lat, trip.value!.map.center.lng], trip.value!.map.zoom) // index.html:6321
    mapInstance = map // WR-01: exponer la instancia para destruirla en onUnmounted
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19, // index.html:6323
    })
    tileLayer.on('tileload', () => tilesLoaded++) // index.html:6326
    tileLayer.on('tileerror', () => {
      tilesErrored++ // index.html:6328
      // Heurística EXACTA de index.html:6330 vía el predicado puro de Plan 01.
      if (isOffline(tilesErrored, tilesLoaded)) {
        document.getElementById('map-offline-banner')?.classList.add('show') // index.html:6331
      }
    })
    tileLayer.addTo(map) // index.html:6334
  }
  catch (e) {
    // Fallback de init (port verbatim index.html:6335-6340): texto en cursiva centrado.
    console.error('Error inicializando mapa:', e)
    if (mapEl.value) {
      mapEl.value.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;padding:2rem;text-align:center;font-style:italic;color:var(--ink-soft)">No se ha podido cargar el mapa. Comprueba tu conexión.</div>'
    }
  }

  if (map) {
    // 39 marcadores (D-01): 38 monumentos + el Coliseo (★). `trip.mapExtras` se mapea a la
    // forma `MapMarker` que consume `deriveMarkers` (el extra no tiene ficha → id='').
    const markers = deriveMarkers(monById.value, (trip.value!.mapExtras ?? []).map(e => ({
      id: '',
      n: e.roman,
      name: e.name,
      day: e.day,
      lat: e.coords.lat,
      lng: e.coords.lng,
      type: e.type,
    })))

    markers.forEach((m) => {
      // Color del divIcon por tipo (port verbatim index.html:6347-6349).
      let bgColor = '#8b3a3a' // card (default)
      if (m.type === 'guided') bgColor = '#a07c4a'
      if (m.type === 'concert') bgColor = '#5a7a3a'
      // divIcon: círculo 32×32, Cormorant Garamond, borde blanco, el numeral romano (index.html:6350-6358).
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
        width:32px;height:32px;background:${bgColor};color:#fbf7f0;
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-family:'Cormorant Garamond',serif;font-weight:600;font-size:.85rem;
        border:2px solid #fbf7f0;box-shadow:0 2px 8px rgba(0,0,0,.4);">${m.n}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map!)
      // Popup por tipo (port verbatim index.html:6361-6369, el manejador inline DROPPEADO).
      // guided → TEXTO PLANO sin ancla; card/concert → `<a href="#slug">` SIN handler (lo
      // intercepta el listener en captura de F5).
      let popupHtml: string
      if (m.type === 'guided') {
        popupHtml = `<strong>${m.name}</strong><br><em style="color:#a07c4a">${m.day}</em><br><span style="color:#5c534a;font-size:.85rem">Visita con guía humano</span>`
      }
      else if (m.type === 'concert') {
        popupHtml = `<strong>${m.name}</strong><br><em style="color:#5a7a3a">${m.day}</em><br><a href="#${m.id}" style="color:#5a7a3a">Abrir ficha →</a>`
      }
      else {
        popupHtml = `<strong>${m.name}</strong><br><em style="color:#a07c4a">${m.day}</em><br><a href="#${m.id}" style="color:#8b3a3a">Abrir ficha →</a>`
      }
      marker.bindPopup(popupHtml)
    })

    // Encuadre a todos los puntos (index.html:6373-6374).
    map.fitBounds(L.latLngBounds(markers.map(m => [m.lat, m.lng] as [number, number])).pad(0.1))

    // Recalcular el tamaño cuando el contenedor es incierto al init (index.html:6377-6378).
    // IN-01: el `window.addEventListener('load', ...)` del original es código muerto en SSG
    // (onMounted corre tras el evento 'load' en la hidratación) — omitido; el setTimeout(300)
    // es la vía de recuperación efectiva.
    setTimeout(() => map!.invalidateSize(), 300)
  }
})
</script>

<template>
  <div
    id="leaflet-map"
    ref="mapEl"
  />
</template>
