# Feature Research — v1.1 Multi-viaje + Campania

**Domain:** guía de viaje editorial, estática y offline-friendly, que pasa de 1 viaje (Roma) a N viajes (índice + guía por viaje), con un segundo viaje real de 10 días, multi-base, en familia y con mucha naturaleza (Campania 2027).
**Researched:** 2026-11-20
**Confidence:** MEDIUM-HIGH. Las brechas de esquema/UI son HIGH (leídas directamente de `shared/schemas.ts`, `content.config.ts`, `TripView.vue`, `NavPills.vue`, `Topbar.vue`, `useTripModes.ts`, `MonumentCard.vue`, `dayRoute.ts`, `LeafletMap.client.vue` y del itinerario completo `.planning/inputs/campania-2027-itinerario-raw.md`). Los patrones de producto (índice de viajes, opciones A/B) son MEDIUM: vienen del conocimiento del dominio (Wanderlog, Polarsteps, TripIt, guías impresas tipo Lonely Planet) con poca verificación web. Los datos de Campania (restricciones de coches en islas, Sorgeto) son LOW-MEDIUM y deben revisarse en la fase de contenido.

> Alcance: **solo lo NUEVO de v1.1**. Lo de v1.0 (fichas, timeline, ritmos, modo «caminar menos», resumen, búsqueda MiniSearch, ruta del día, notas, tema, mapa Leaflet) ya existe y no se re-investiga. Aquí solo aparece como **dependencia** o como algo que hay que **parametrizar** para que deje de estar atado a Roma.

---

## 0. Qué expone Campania frente al modelo actual (resumen ejecutivo)

El itinerario completo es, día a día:

| Día | Fecha (2027) | Base nocturna | Transporte clave | Rasgos que el modelo de Roma NO cubre |
|-----|-------------|---------------|------------------|----------------------------------------|
| I | Sáb 19 | Nápoles (Vomero) | ✈ llegada 16:35 Capodichino · bus Alibus | llegada en avión + bus |
| II | Dom 20 | Procida | 🏃 carrera matinal · ⛴ Caremar Porta di Massa→Procida (12:15/13:30) · 🚲 bicis | ferry; bicicleta; playa (naturaleza) |
| III | Lun 21 | Ischia (Forio) | ⛴ Procida→Ischia (15:45/17:15) | segundo cambio de base en 2 días |
| IV | Mar 22 | Ischia (Forio) | 🥾 senderismo Monte Epomeo | ruta a pie por monte; pozas termales **de noche** con niños |
| V | Mié 23 | Salerno | ⛴ Ischia→Nápoles · ✈ recogida de un adulto en el aeropuerto · 🚗 recogida coche | **cambia el grupo** (se une una persona); empieza el coche |
| VI | Jue 24 | Salerno | 🚗 | **día de elección: Opción A / Opción B** (Cilento pueblos+calas / río Calore) |
| VII | Vie 25 | Nápoles | 🚗 + paradas «de camino» (Vesubio **o** lechería) · devolución coche | **concierto nocturno** en Stadio Maradona |
| VIII | Sáb 26 | Nápoles | 🚗 (contradicción: el coche se devolvió el 25) | **día de elección: Opción 1 / Opción 2** (Casertavecchia / Campos Flégreos) |
| IX | Dom 27 | Nápoles | ✈ salida de parte del grupo 10:00 | **cambia el grupo** (solo adultos el resto del viaje); **segundo concierto** |
| X | Lun 28 | — | ✈ vuelo 09:55 a Palma | día de solo salida |

Consecuencias directas sobre el modelo (detalladas en §5):

1. **Días con opciones excluyentes** (VI y VIII) → hoy `DaySchema.timeline` es una lista lineal; no existe «elige una».
2. **Cinco bases** en 10 días → hoy hay *un* alojamiento implícito (`infoCards[0]`), sin vínculo día→base.
3. **Transporte nuevo** (ferry, coche, bus, bici, avión, a pie de monte) → `TransportMode.variant` y `DaySchema.stats.variant` son enums cerrados a `taxi|walk|train|metro|ticket`.
4. **Lugares de naturaleza** (playas, pozas termales, río, monte, lago-cráter, cueva) → `Motif` (19 motivos romanos) y `PlaceType` (`card|guided|concert`) no los representan.
5. **Eventos** (2 conciertos) → *sí* encajan: `PlaceType 'concert'` + `stop.reservedEvent` ya existen (Einaudi en Roma). Solo cambia la leyenda.
6. **Cambio de participantes** a mitad de viaje → no hay concepto; basta con texto (ver anti-features).
7. **10 días con días de la semana repetidos** (sáb 19/26, dom 20/27, lun 21/28) → `dayLabel(eyebrow)` produce pills duplicadas («Sabato» ×2) y los slugs-día de Roma (`viernes`…) no escalan.
8. **Secciones distintas**: probablemente sin Arte/Arquitectura; Reservas con ferries/coche/conciertos/alojamientos; Gastronomía con familias de badge nuevas.

Buena noticia: **el esqueleto de ficha (`MonumentSchema`) encaja sorprendentemente bien** con lugares de naturaleza (italian, hero, sections, facts libres, mapsQuery). La mayoría de los gaps son *enums cerrados* y *chrome hardcodeado*, no rediseños.

---

## 1. Feature Landscape — (a) Índice de viajes (`/`)

### Table Stakes

| Feature | Por qué se espera | Complejidad | Notas / dependencias |
|---------|-------------------|-------------|----------------------|
| Lista de viajes con tarjeta por viaje: título, destino(s), fechas, imagen/portada | Es lo que hacen todas las apps de viaje (Wanderlog, Polarsteps, TripIt): «Mis viajes» como rejilla de tarjetas con portada y rango de fechas | LOW | Requiere campos **estructurados** en `TripSchema` (`dates`, `cover`, `summary`, `destinations`) — hoy solo hay `heroMeta` (string libre). Reusar el sistema visual existente (tokens, Cormorant/Lora, `.section-eyebrow`); cero CSS de framework. |
| Orden útil: el próximo/en curso primero, luego el resto por fecha | Con 2+ viajes, el que importa es el próximo | LOW | Ordenar por `dates.start` en build (determinista). Ver «estado» abajo. |
| Enlace a `/trips/<slug>` que prerenderiza cada viaje | Sin esto no hay multi-viaje en GitHub Pages | LOW | `crawlLinks` descubre los enlaces desde `/`; la ruta `[slug].vue` ya existe. Hoy `nitro.prerender.routes = ['/']` y se *evitaba* enlazar `/trips/*` (D-01 v1.0) — esa disciplina se invierte. |
| Redirección de enlaces antiguos `/#viernes` → `/trips/roma#viernes` | Marcadores y enlaces compartidos de la versión viva no deben morir | LOW-MED | El fragmento `#…` **nunca llega al servidor** → la redirección es un script cliente en `/` que, si `location.hash` coincide con un ancla conocida de Roma (`inicio, mapa, viernes…martes, reservas, gastronomia, practica, arte, arquitectura` y cualquier `#slug` de ficha), hace `location.replace('/guiaRoma/trips/roma' + hash)`. Debe ejecutarse antes del primer paint (inline en `<head>`) para no mostrar el índice un instante. |
| `<title>` y metadatos por página (índice y cada viaje) | Pestañas/marcadores distinguibles | LOW | Hoy `app.vue` fija `title: 'Roma · 19—23 giugno 2026'` → mover a `useHead` en `TripView` desde `trip.yml` (Roma conserva el mismo string). |
| Mismo tema claro/oscuro y tipografía que las guías | Coherencia de marca | LOW | `@nuxtjs/color-mode` ya global. **Mantener la clave `roma-theme`** aunque el nombre sea histórico (cambiarla pierde la preferencia guardada). |
| Funciona sin JS para leer la lista (HTML prerenderizado) | Offline/red pobre | LOW | Sale gratis con SSG. |

### Differentiators

| Feature | Propuesta de valor | Complejidad | Notas |
|---------|-------------------|-------------|-------|
| Estado del viaje («próximo · faltan 211 días» / «en curso · hoy día IV» / «pasado») | Lo que hace a una app de viaje sentirse viva; el dato que el usuario busca al abrirla | LOW-MED | **Calcular en cliente** (`onMounted`) — si se calcula en build queda congelado en la fecha del deploy y además provoca *hydration mismatch*. Render SSR neutro (solo fechas) + realce en cliente. |
| Acceso directo «Ir a hoy» cuando un viaje está en curso | Uso real: se abre la guía paseando; saltar al día de hoy ahorra scroll | LOW-MED | Requiere `day.date` ISO (gap §5). Ver también «Hoy» dentro de la guía (§2). |
| Portada editorial con la cita/decoración de cada viaje | Mantiene el tono «guía cuidada» frente a un listado frío | LOW | Reusar `decoration` / `quote` del `trip.yml`. |
| Mini-mapa o silueta de ruta en la tarjeta | Visual atractivo | MEDIUM | **Diferir**: Leaflet en el índice = tiles de red + coste; una imagen estática/SVG sería la vía si se quiere. P3. |

### Anti-Features

| Feature | Por qué tienta | Por qué es problema | Alternativa |
|---------|----------------|---------------------|-------------|
| Redirigir automáticamente `/` al viaje «actual» | «Ahorra un clic» | Rompe la previsibilidad, confunde fuera de fechas, choca con la redirección de enlaces antiguos y con los tests | Botón destacado «Ir a hoy» en la tarjeta en curso |
| Búsqueda/filtros entre viajes en el índice | Patrón de apps grandes | Con 2–3 viajes es ruido; y la búsqueda global mezclaría índices MiniSearch | Búsqueda acotada al viaje (ya decidido) |
| Crear/editar viajes desde la UI, login | «Plataforma» | Fuera de alcance (v2: backend dormido; viajes = PR de YAML) | PR de ficheros |
| Estadísticas/gamificación (países visitados, km) | Polarsteps lo hace | No aporta a una guía editorial de consulta | — |

---

## 2. Feature Landscape — (b) Guía por viaje data-driven

Principio: **Roma debe renderizar byte-idéntica**. Todo lo que hoy está hardcodeado se mueve a datos con un valor por defecto que reproduce Roma, o se hace condicional a la presencia de datos.

### Table Stakes

| Feature | Por qué se espera | Complejidad | Estado actual (código) → cambio |
|---------|-------------------|-------------|--------------------------------|
| Nº y orden de días variables | Campania tiene 10 días; Roma 5 | LOW | `TripView.vue` tiene **5 `<section id="viernes">…"martes">` literales** con `dayBySlug('viernes')` → `v-for` sobre `days` ordenados por `order`. |
| Pills de navegación por día sin duplicados | 10 días con sáb/dom/lun repetidos | LOW | `NavPills` usa `dayLabel(d.eyebrow)` → «Sabato» dos veces. Añadir `navLabel?` opcional al día (Roma lo omite → misma salida) o derivar «Sab 19» solo si hay colisión. Recomendado: **campo opcional explícito**, menos magia. |
| Slugs de día únicos y no colisionantes con anclas fijas | `#sabado` no puede repetirse; `#mapa`/`#reservas` reservados | LOW | Convención Campania: `sabado-19`, `domingo-20`… Añadir invariante en `tests/data/invariants.spec.ts`: slugs únicos por viaje y ∉ {inicio, mapa, reservas, gastronomia, practica, arte, arquitectura} ∪ slugs de fichas. |
| Secciones opcionales (Reservas, Gastronomía, Práctica, Arte, Arquitectura) | Campania no tendrá Arte/Arquitectura | LOW | Hoy las `<section>` existen siempre y `NavPills` lista las 5 fijas. Renderizar section + pill **solo si hay datos** (`refById.get('reservas')`, `food.length`, `artists.some(kind)`). Roma tiene todas → igual. |
| Chrome desde `trip.yml`: marca del topbar, `<title>`, pie, leyenda del mapa | Ya decidido en PROJECT.md | LOW | Hardcodes localizados: `Topbar.vue` («Roma ✦ giugno MMXXVI»), `TripView.vue` footer («Itinerario preparado para _Pay_…») y `.map-legend` («Rojos… Verde · concierto Einaudi»), `app.vue` title. Nuevos campos `brand`, `footer` (Md), `mapLegend`, `documentTitle`. |
| Persistencia por viaje (ritmo, ligera, resumen, notas) | Las preferencias de un viaje no deben contaminar otro | LOW | Patrón `${trip.slug}-pace`, `${trip.slug}-light`, `${trip.slug}-resumen`, `${trip.slug}-note-${slug}`: **para Roma (`slug: roma`) las claves salen idénticas a las actuales** → migración «sin pérdida» trivial, sin código de migración. Hoy literales en `useTripModes.ts:92-103` y `MonumentCard.vue:123`. Ojo: dos fichas de viajes distintos con el mismo slug quedan aisladas gracias al prefijo. |
| Búsqueda y navegación de fichas acotadas al viaje | Ya decidido | LOW-MED | `useSearch.ts:144` y `useCardNavigation.ts:173` hacen `await useTrip('roma')` fijo → recibir el slug (provide/inject desde `TripView` o parámetro). |
| Enlace de vuelta al índice desde cada viaje | Navegación básica multi-viaje | LOW, **pero choca con la paridad** | Cualquier elemento nuevo en el chrome de Roma cambia los goldens. Decisión explícita necesaria: (i) añadirlo y re-baselinar Roma conscientemente, o (ii) ponerlo en un sitio que no salga en los goldens (p. ej. dentro del footer como enlace discreto) y aceptar el delta mínimo. Recomendado: enlace discreto en el **footer** + re-baseline solo de la captura del footer, documentado. |
| Mapa multi-ciudad (encuadre sobre todos los marcadores) | Campania abarca ~120 km (Ischia→Cilento→Caserta) | LOW | `LeafletMap.client.vue:138` **ya hace `fitBounds(...).pad(0.1)`** tras `setView`. Funciona con cualquier extensión. Gap real: densidad (ver Differentiators). |
| Leyenda y colores de marcador según los tipos presentes | Campania no tiene «guiados» quizá, sí conciertos y naturaleza | LOW-MED | Colores por `PlaceType` están en el JS del mapa; la leyenda es texto fijo. Hacer la leyenda data-driven (`mapLegend` en `trip.yml`, texto libre) — más simple y fiel que generarla. |
| Ruta del día con modo de viaje correcto | Días en coche / bici / ferry | LOW-MED | `dayRoute.ts` fija `travelmode=walking`. Añadir `route?: { mode: 'walking'|'driving'|'bicycling', enabled?: boolean }` al día (default walking → Roma igual). Días con ferry (II, III, V): `enabled: false` o solo el tramo en tierra, porque las *URLs* de Google Maps no encadenan ferry+waypoints de forma fiable. Nota: la doc de Google Maps URLs limita a **3 waypoints en navegadores móviles** (9 en otros) — el cap actual de 10 paradas (8 waypoints) ya excede eso en móvil; deuda preexistente de Roma, no tocar en v1.1 pero documentarla. |
| Selector de ritmo / «caminar menos» solo si el viaje los usa | Campania es *slow* por diseño; un selector optimista/neutral/lento puede no tener sentido | LOW | Mostrar `.pace-wrap` solo si algún `stop`/`transport` tiene `pace ≠ 'all'`; mostrar «ligera» solo si algún día tiene `light`. Derivado de datos, sin flag nuevo. El texto «6-7 paradas/día» de los botones es copy fijo atado a Roma → mover a `trip.yml` (`paceMeta?`) o aceptar como copy genérico. |

### Differentiators

| Feature | Propuesta de valor | Complejidad | Notas |
|---------|-------------------|-------------|-------|
| «Hoy» dentro de la guía: pill del día actual resaltada + scroll inicial a hoy durante las fechas del viaje | El caso de uso real es consultar en ruta | MEDIUM | Requiere `day.date` ISO. Solo cliente; fuera de fechas no hace nada → Roma (2026, pasado) no cambia. Los tests de paridad deben fijar el reloj. |
| Base nocturna visible en la cabecera de cada día («Dormís en: Forio») | Con 5 bases, «¿dónde dormimos hoy?» es *la* pregunta | LOW | Campo `day.stay?` → ref a `trip.stays[]`. Ver §5. |
| Marcadores de alojamiento en el mapa (icono casa, distinto de los romanos) | Orienta el día respecto a la base | LOW-MED | Deriva de `trip.stays[].coords`; tipo de marcador nuevo. Roma: 0 stays estructurados → sin cambio (o 1 si se migra el hotel, lo que cambiaría el mapa → **no migrar Roma**). |
| Enfocar el mapa en un día («ver este día en el mapa») | En multi-ciudad, el `fitBounds` global deja Nápoles como un amasijo de pines a zoom ~9 | MEDIUM | Botón por día que hace `fitBounds` a los marcadores de ese día. Alternativa más barata: nada (el usuario hace zoom). P2. |
| Líneas de ferry en el mapa (polilíneas Nápoles–Procida–Ischia) | Cuenta la geografía del viaje insular | LOW-MED | `L.polyline` con coords en `trip.yml`. Bonito pero no esencial. P3. |

### Anti-Features

| Feature | Por qué tienta | Por qué es problema | Alternativa |
|---------|----------------|---------------------|-------------|
| i18n / UI en italiano para Campania | «Es otro país» | Ya descartado; duplica todo el copy | UI fija en español; lo específico en `trip.yml` |
| Tema/paleta propia por viaje (azul mediterráneo para Campania) | Identidad por destino | Multiplica la superficie visual a verificar; PROJECT.md dice que Campania reutiliza el sistema visual | Variar solo `decoration`, `quote`, imágenes |
| *Marker clustering* (Leaflet.markercluster) | Resuelve la densidad de Nápoles | Cambia el comportamiento del mapa de Roma (paridad) y añade dependencia | «Enfocar día» o nada |
| Esquema genérico de «bloques» libres para el día | Flexibilidad infinita | Pierde tipado y la validación zod; rompe el principio de v1.0 (shapes explícitos) | Ampliar los enums y añadir 1 kind nuevo (`choice`) |

---

## 3. Feature Landscape — (c) Viaje multi-ciudad, en familia y de naturaleza (Campania)

### Table Stakes

| Feature | Por qué se espera | Complejidad | Notas |
|---------|-------------------|-------------|-------|
| **Días con opciones excluyentes** (VI: A/B; VIII: 1/2) presentadas como tales | El planning lo pide literalmente («elige una») | MEDIUM | Ver modelo en §5 (gap #1). UI mínima: ambas opciones **apiladas** bajo un encabezado «Elige una» con separador «— o bien —», cada una con su título, su mini-timeline y sus fichas. Funciona offline, sin JS, imprimible, y el modo resumen las muestra ambas. |
| Tramos de **ferry** con naviera, muelle, horarios orientativos y aviso de comprar billete | 3 ferries; perder uno descuadra el día | LOW (datos) + LOW (enum) | Reusar `kind: transport` con `variant: 'ferry'` y `modes[]` = salidas alternativas (12:15 / 13:30). Footnote: muelle exacto (Porta di Massa ≠ Molo Beverello). |
| Tramos en **coche** y avisos asociados (ZTL, aparcamiento, sillitas) | Coche 23–25(26) | LOW | `variant: 'car'`; avisos como `meta` `level: warn`. Práctica: ZTL de Nápoles/Salerno y restricción de vehículos de no residentes en Procida/Ischia en temporada (no les afecta: el coche se recoge el 23 tras las islas — buen dato para Práctica). |
| Llegada/salida en **avión** y **bus** (Alibus) | Días I, V, IX, X | LOW | `stats`/`transport` con variantes `plane`, `bus`. |
| Fichas de **lugares de naturaleza** (Pozzo Vecchio, Marina Corricella, Monte Epomeo, Baia di Sorgeto, Valle del Calore, calas del Cilento, Lago Averno, Miseno) con datos prácticos | Es la mitad del viaje | LOW-MED | `MonumentSchema` encaja: `facts` libres → «Acceso», «Mejor hora», «Servicios», «Calzado», «Para niños». Gap: `motif` (fallback SVG) y `type` (color de marcador). Ver §5. |
| **Notas de familia/niños** donde importan (seguridad, esfuerzo, baño) | Viaje con niños; Sorgeto de noche (≈300 escalones desde Panza, rocas resbaladizas, agua muy caliente en puntos), Epomeo, pozas del Calore | LOW | Mínimo viable sin esquema: `meta` `level: warn` en el timeline + una `section` «Con niños» en la ficha. Mejor: caja opcional `family` en la ficha (ver §5 gap #6). |
| **Eventos con entrada** (2 conciertos en Stadio Maradona) en timeline y reservas | Son citas fijas que estructuran los días VII y IX | LOW | Ya soportado: `stop.reservedEvent: true`, `tag: 'concierto'`, `PlaceType: 'concert'` (verde, como Einaudi). Reservas: grupo de «entradas». Práctica: volver de Fuorigrotta de noche (metro/Cumana/taxi). |
| **Paradas «de camino» opcionales** (Vesubio *o* lechería) | Día VII | LOW | Ya soportado: `stop` con `tag: 'opcional'` y/o `pace: 'slow-only'`. No requiere el kind `choice`. |
| **Reservas** con alojamientos ×5, ferries, coche, conciertos, vuelos | Lista de confirmaciones del viaje | LOW | `ReservasSchema.confirmed[].group` es `enum(['mesas','visitas'])` → ampliar (`alojamientos`, `transporte`, `entradas`). Los grupos se rotulan en la UI → revisar cómo `ReservasSection` titula cada grupo. |
| **Gastronomía campana** (pizza napoletana/fritta, sfogliatella, mozzarella di bufala, cuoppo, cocina de monte del Cilento) | Sección clave de la guía | LOW | `FoodSchema.badgeKind` es un enum con clases CSS `badge-*` romanas (`quinto`, `ghetto`) → añadir p. ej. `caseificio`, `friggitoria`, `cantina`; cada uno = 1 regla CSS con tokens existentes. |
| Contenido de **Práctica** propio: ferries (cómo comprar), coche/ZTL, calor de junio, calzado de agua, efectivo, estadio | Es lo que se consulta sobre el terreno | LOW | `PracticaSchema.sections[]` libre → solo contenido. `media` (libros/películas/series/playlist) encaja: *L'amica geniale*, *Il Postino*, *È stata la mano di Dio*, playlists de Ultimo / Pinguini Tattici Nucleari. |

### Differentiators

| Feature | Propuesta de valor | Complejidad | Notas |
|---------|-------------------|-------------|-------|
| Selector de opción con memoria (A/B) que oculta la no elegida y recalcula ruta del día y marcadores | Una vez decidido, la guía «se vuelve» el plan real | MEDIUM | Sobre la vista apilada (table stake). Persistir `${trip}-choice-${day}`. Sin elección = ambas visibles. P2. |
| Caja editorial de cine/literatura en fichas (reuso de `.sorrentino-box`) | En Roma es «La grande bellezza»; en Campania: *Il Postino* en Pozzo Vecchio, *L'amica geniale* en el Rione Luzzatti, Sorrentino en Nápoles | **LOW, cero esquema** | `sorrentino: { label, text }` ya es libre. Solo contenido. Máximo valor editorial por coste. |
| «Versión tranquila con niños» usando el modo ligera existente | El modo «caminar menos» de Roma se reinterpreta como plan B para niños cansados/calor | LOW | `light.title` ya es dato libre; los kinds `see/move/skip/care/rest` encajan. Sin código. |
| Indicador de grupo por día («solo adultos» días IX–X; «+1 adulto» desde el V) | Cambia qué tiene sentido hacer | LOW | Texto en `subtitle` o `meta`; no un modelo de participantes (ver anti-features). |
| Mapa de bases con orden del viaje (Vomero → Procida → Forio → Salerno → Nápoles) | Explica el viaje de un vistazo | LOW-MED | Depende de `trip.stays[]`. |

### Anti-Features

| Feature | Por qué tienta | Por qué es problema | Alternativa |
|---------|----------------|---------------------|-------------|
| Modelo de participantes (personas, quién va a qué, filtros por persona) | El grupo cambia el 23 y el 27 | Complejidad de app de planificación, no de guía; 2 cambios en 10 días se cuentan en una línea | Texto en `subtitle`/`meta` del día y en `infoCards` |
| Horarios de ferry/tiempo real (APIs de navieras), previsión del mar, mareas | Útil en islas | Requiere red y backend; frágil; contrario a «estático/offline» | Horarios orientativos + enlace a la naviera en el `footnote` |
| Timeline minuto a minuto para Campania como en Roma | Consistencia con Roma | Contradice el tono *slow* del planning («Mañana / Tarde / Noche») | `time` es string libre: usar «Mañana», «Tarde», «Noche», «08:30–10:30» tal cual |
| Opciones anidadas recursivas (opción dentro de opción) | Generalidad | zod recursivo + JSON-Schema de Content v3 + render recursivo; Campania no lo necesita | Un único nivel de `choice` |
| Fichas separadas para cada servicio (alquiler de bicis, taxi acuático, lechería) | Exhaustividad | Infla el viaje con fichas sin prosa editorial | Mencionarlos en `facts`/`footnote`/Práctica |

---

## 4. Feature Dependencies

```
trip.yml estructurado (dates, cover, summary, brand, footer, mapLegend, documentTitle)
    ├──requires──> Índice de viajes en /
    │                  ├──requires──> prerender de /trips/* (crawlLinks desde /)
    │                  └──enhances──> Estado «próximo/en curso/pasado» (cliente)
    └──requires──> Chrome data-driven (Topbar, footer, leyenda, <title>)
                       └──conflicts──> Paridad de Roma (si un valor por defecto no reproduce el string exacto)

Roma en /trips/roma ──requires──> Redirección cliente de /#ancla → /trips/roma#ancla
                    ──requires──> Suite de paridad apuntando a la nueva URL

useTrip(slug) sin 'roma' fijo (useSearch, useCardNavigation)
    └──requires──> Búsqueda/navegación por viaje

Claves localStorage `${slug}-…` ──requires──> slug del viaje disponible en useTripModes/MonumentCard
    (Roma: claves idénticas a las actuales → migración gratis)

Días v-for (no slugs literales) ──requires──> slugs únicos + navLabel opcional
    └──requires──> invariante de anclas no colisionantes

day.date ISO ──enables──> «Hoy» en la guía, «Ir a hoy» en el índice
trip.stays[] + day.stay ──enables──> «Dormís en…», marcadores de base, origen de ruta del día

TimelineRow kind 'choice' ──requires──> render en Timeline.vue + modo resumen + pace
    ├──requires──> marcadores/fichas etiquetados por opción (day.cards por opción)
    ├──requires──> ruta del día por opción (o desactivada en días de elección)
    └──enhances──> selector de opción con memoria (P2)

Enums ampliados (TransportMode.variant, stats.variant, PlaceType, Motif, badgeKind, confirmed.group)
    └──requires──> CSS de cada variante nueva + SVG de cada motif nuevo + color de marcador
    └──requires──> contenido Campania (sin ellos el YAML no valida)

Secciones opcionales ──requires──> NavPills condicionales (hoy 5 pills fijas)
```

### Notas de dependencia

- **El contenido de Campania depende de la ampliación del esquema, no al revés.** Escribir YAML de Campania antes de ampliar enums produce ficheros que no validan (`tests/data/schema.spec.ts` rompe). Orden: esquema → componentes → contenido.
- **Toda ampliación debe ser aditiva** (`.optional()` o nuevos valores de enum). Ningún campo existente cambia de forma → los 85 YAML de Roma siguen validando sin tocarse.
- **Los `RowSchema` superset** (`ArtistRowSchema`, `ReferenceRowSchema`) existen porque Content v3 no materializa `discriminatedUnion` a columnas SQL. Un nuevo kind `choice` *dentro* de `timeline` (array anidado → columna JSON) **no** sufre ese problema, pero conviene verificarlo con un test que lea un día con `choice` vía `queryCollection`.
- **Chrome data-driven ↔ paridad**: cada string movido a `trip.yml` debe copiarse *verbatim* (incluidas comillas tipográficas, `<br>`, `<em>`) — la suite de goldens lo detecta, pero mejor no depender de ella para descubrirlo.

---

## 5. Brechas de esquema que expone Campania (para el roadmap)

Todas verificadas contra `shared/schemas.ts`. «Impacto Roma» = si los YAML/salida de Roma cambian.

| # | Brecha | Hoy | Propuesta (aditiva) | Complejidad | Impacto Roma |
|---|--------|-----|---------------------|-------------|--------------|
| 1 | **Días con opciones excluyentes** | `DaySchema.timeline: TimelineRow[]` lineal; `cards: string[]` plano | Nuevo kind en `TimelineRow`: `{ kind: 'choice', heading?: string, options: [{ key: 'A'\|'B'\|'1'\|'2', title, summary?: Md, timeline: InnerRow[], cards?: string[] }] }` donde `InnerRow` = los 5 kinds actuales (sin `choice`, **sin recursión**). Las filas compartidas (p. ej. «Noche: regreso a Nápoles» del día VIII) van antes/después del `choice` en el timeline normal. Fichas de cada opción en `options[].cards`; `day.cards` = las comunes. Marcadores: `Monument.day` (string libre) admite «Jueves 24 · opción A». | MEDIUM | Ninguno (kind nuevo) |
| 2 | **Múltiples bases / alojamientos** | Un alojamiento implícito en `infoCards` (texto) | `TripSchema.stays?: [{ slug, name, area, address?, coords, from, to, note?: Md }]` + `DaySchema.stay?: string` (ref). `infoCards` sigue libre para el hero (puede listar «Bases»). Invariante: `day.stay` ∈ `stays[].slug`. | LOW-MED | Ninguno (Roma no lo usa) |
| 3 | **Transporte nuevo** | `TransportMode`: `variant: enum(['taxi','walk','train'])`; `stats.variant: enum(['walk','train','taxi','metro','ticket'])` | Añadir `ferry`, `car`, `bus`, `bike`, `plane` (y `hike` para stats si se quiere distinguir senderismo). Cada valor = clase CSS `.tl-transport.<v>` / `.day-stats-item.<v>` con tokens existentes. | LOW | Ninguno |
| 4 | **Lugares de naturaleza: fallback SVG** | `Motif`: 19 motivos romanos | Añadir ~6: `sea` (playa/cala), `volcano` (Epomeo/Vesubio/Averno), `thermal` (Sorgeto), `river` (Calore/puente), `village` (Raito, Albori, Casertavecchia, Corricella), `boat` (puertos/ferries). Cada uno = un SVG en `app/utils/svgMotifs.ts` (trabajo de diseño, el coste real). Mínimo aceptable: mapear a motivos existentes (`garden`, `tower`, `rooftops`) y diferir los nuevos. | MEDIUM (diseño) | Ninguno |
| 5 | **Tipo de lugar / color de marcador** | `PlaceType: enum(['card','guided','concert'])` | Añadir `nature` (color propio) y opcionalmente `stay` (si los alojamientos van como marcador). `concert` ya cubre Ultimo/PTN. Leyenda en `trip.mapLegend`. | LOW | Ninguno |
| 6 | **Notas de familia/niños** | No existe; solo `culture[]` y `sorrentino` | `MonumentSchema.family?: { text: Md, level?: 'ok'\|'warn' }` → caja con estilo derivado de `.culture-box`. En timeline basta `meta` `level: 'warn'`. Alternativa sin esquema: `sections[]` con heading «Con niños». **Recomendado el campo** (búsqueda puede indexarlo y es consistente entre fichas). | LOW | Ninguno |
| 7 | **Estructura del viaje para el índice y el chrome** | `heroMeta` string; marca/pie/leyenda/título hardcodeados | `TripSchema`: `dates: { start, end }` (ISO), `cover?: { src, alt }`, `summary?: Md`, `destinations?: string[]`, `brand: string`, `documentTitle: string`, `footer: Md`, `mapLegend: string`. Roma rellena con los strings actuales verbatim. | LOW | Datos de Roma **se amplían** (no cambian); salida idéntica |
| 8 | **Etiqueta de navegación y fecha del día** | `dayLabel(eyebrow)` → duplicados con 10 días; sin fecha estructurada | `DaySchema.navLabel?: string`, `DaySchema.date?: string` (ISO). | LOW | Ninguno |
| 9 | **Ruta del día por modo** | `travelmode=walking` fijo en `dayRoute.ts` | `DaySchema.route?: { mode: 'walking'\|'driving'\|'bicycling', enabled: boolean }` (default walking/true). | LOW | Ninguno |
| 10 | **Reservas de otro tipo** | `confirmed[].group: enum(['mesas','visitas'])` (en `ReservasSchema` **y** `ReferenceRowSchema` — duplicado a mantener en sincronía) | Añadir `alojamientos`, `transporte`, `entradas`. Ajustar títulos de grupo en `ReservasSection`. | LOW | Ninguno |
| 11 | **Familias de gastronomía** | `badgeKind` enum romano (8 valores) | Añadir `caseificio`, `friggitoria`, `cantina` (o los que salgan del contenido). CSS por badge. | LOW | Ninguno |
| 12 | **Secciones-página** | `trip.sections` con claves fijas `gastronomia/arte/arquitectura` | Suficiente si Campania solo usa `gastronomia`. Si se quiere una sección propia («Naturaleza», «Con niños») → **diferir**: añadir una sección nueva es UI nueva, no solo datos. | — | — |
| 13 | **Ficha sin prosa histórica fuerte** | `artists`/`arch` opcionales; `sections` requerido | Encaja. `italian` requerido: usar «Spiaggia del Pozzo Vecchio · Procida». `hero` requerido: Wikimedia tiene imágenes de casi todos; si no, el fallback SVG cubre (de ahí la importancia de #4). | — | — |
| 14 | **Cambio de participantes** | — | **No modelar.** Texto en `subtitle`/`meta`/`infoCards`. | — | — |

Contradicciones del input que el contenido debe resolver (no son features, pero bloquean días concretos): devolución del coche el 25 vs «coche disponible» el 26 (afecta a si el día VIII es en coche o transporte público: Cumana/Circumflegrea para Campos Flégreos es viable sin coche); la «carrera popular Spaccanapoli matutina» del día II no está verificada como evento real con fecha; las fechas de los conciertos de junio de 2027 vienen del usuario sin verificar.

---

## 6. MVP Definition

### Lanzar con v1.1 (P1)

- [ ] `trip.yml` estructurado (#7) + chrome data-driven (topbar, `<title>`, pie, leyenda) con Roma verbatim — base de todo lo demás.
- [ ] Días por `v-for` + `navLabel`/`date` opcionales + slugs únicos con invariante (#8).
- [ ] Secciones y pills condicionales a la presencia de datos.
- [ ] Búsqueda, navegación y persistencia por viaje (claves `${slug}-…`, Roma idénticas).
- [ ] Índice en `/` (tarjetas: portada, título, fechas, destinos, resumen) + Roma en `/trips/roma` + redirección cliente de anclas antiguas + prerender de todos los viajes.
- [ ] Enums ampliados (#3, #5, #10, #11) con su CSS; motifs nuevos o mapeo provisional (#4).
- [ ] Días de elección como `choice` apilado (#1), visibles ambos, en resumen y timeline.
- [ ] `stays[]` + `day.stay` con «Dormís en…» en la cabecera del día (#2).
- [ ] `family` en fichas (#6) y avisos `warn` en timeline.
- [ ] Ruta del día por modo, desactivable en días de ferry (#9).
- [ ] Contenido completo de Campania (10 días, fichas, gastronomía, reservas, práctica) en tono slow.
- [ ] Suite de paridad de Roma verde en `/trips/roma`.

### Añadir tras validar (P2)

- [ ] Estado del viaje y «Ir a hoy» en el índice; «Hoy» dentro de la guía — cuando se use en ruta (junio 2027 es el banco de pruebas natural).
- [ ] Selector de opción con memoria que filtra mapa/ruta.
- [ ] Marcadores de bases y «enfocar día» en el mapa.

### Futuro (P3 / v2)

- [ ] Polilíneas de ferry; mini-mapa en tarjetas del índice.
- [ ] Secciones-página nuevas por viaje (p. ej. «Naturaleza»).
- [ ] PWA con caché de todas las guías (hoy cada viaje funciona offline solo si se ha abierto con red; navegar índice→viaje sin red no funciona sin PWA — aceptable en v1.1, documentarlo en `howTo`).

## 7. Feature Prioritization Matrix

| Feature | Valor usuario | Coste | Prioridad |
|---------|---------------|-------|-----------|
| Chrome + trip.yml estructurado | HIGH | LOW | P1 |
| Días/secciones data-driven | HIGH | LOW | P1 |
| Índice + redirección + prerender | HIGH | LOW-MED | P1 |
| Persistencia/búsqueda por viaje | HIGH | LOW | P1 |
| Enums de transporte/tipo/badge/reservas | HIGH | LOW | P1 |
| Días de elección (`choice` apilado) | HIGH | MEDIUM | P1 |
| Bases (`stays`) + «Dormís en» | HIGH | LOW-MED | P1 |
| Caja familia + avisos | MEDIUM-HIGH | LOW | P1 |
| Motifs SVG nuevos | MEDIUM | MEDIUM (diseño) | P1 (mapeo provisional aceptable) |
| Ruta del día por modo | MEDIUM | LOW | P1 |
| «Hoy» / estado del viaje | HIGH en ruta | MEDIUM | P2 |
| Selector de opción con memoria | MEDIUM | MEDIUM | P2 |
| Marcadores de bases / enfocar día | MEDIUM | LOW-MED | P2 |
| Polilíneas ferry, mini-mapas | LOW | LOW-MED | P3 |

## 8. Análisis comparado

| Feature | Apps de planificación (Wanderlog / Polarsteps / TripIt) | Guía impresa (Lonely Planet, Touring Club) | Enfoque guiaRoma |
|---------|--------------------------------------------------------|--------------------------------------------|------------------|
| Índice de viajes | Rejilla de tarjetas con portada y fechas, estado próximo/pasado | n/a (un libro = un destino) | Rejilla editorial estática; estado calculado en cliente |
| Días alternativos | Listas de «ideas»/«places to visit» sin asignar al día | «Itinerarios sugeridos» A/B, apilados en página | Apilado editorial «Elige una» + memoria opcional |
| Multi-base | Alojamientos como reservas importadas, sin vínculo al día | Capítulos por zona | `stays[]` + «Dormís en…» por día |
| Offline | Caché automática (app nativa); edición offline poco fiable según reseñas | Siempre | SSG + assets self-host; sin PWA en v1.1 |
| Rutas | Optimizador de ruta, export a Google Maps | Mapas por zona | URL de Google Maps por día con modo correcto |
| Familia | Etiquetas genéricas | Recuadros «Con niños» | Caja `family` + avisos `warn` |

## Sources

- Código del repo (HIGH): `shared/schemas.ts`, `content.config.ts`, `app/components/TripView.vue` (5 días literales, footer y leyenda fijos), `Topbar.vue` (marca fija), `NavPills.vue` (5 secciones fijas, `dayLabel`), `app/composables/useTripModes.ts:92-103` y `MonumentCard.vue:123` (claves `roma-*`), `useSearch.ts:144` / `useCardNavigation.ts:173` (`useTrip('roma')`), `app/utils/dayRoute.ts` (`travelmode=walking`), `LeafletMap.client.vue:138` (`fitBounds` ya presente), `content/trips/roma/trip.yml`, `content/trips/roma/days/sabado.yml`.
- Input del usuario (HIGH como requisito, contenido sin verificar): `.planning/inputs/campania-2027-itinerario-raw.md`.
- [Google Maps URLs — Directions](https://developers.google.com/maps/documentation/urls/get-started): `travelmode` driving/walking/bicycling/two-wheeler/transit; hasta 3 waypoints en navegadores móviles, 9 en otros (MEDIUM).
- Restricción de vehículos de no residentes en Procida/Ischia en temporada (aprox. Pascua–31 oct, decreto anual de la Prefettura di Napoli; alcance en Ischia discrepante entre fuentes) — [TraghettiUp (Procida)](https://www.traghettiup.com/blog/en/category/procida-en/), [Il Mattino (Ischia)](https://www.ilmattino.it/en/vehicle_access_restrictions_imposed_on_ischia_island-8021022.html), [Prefettura — decreto Ischia](https://prefettura.interno.gov.it/sites/default/files/79/2024-10/decreto_isola_ischia.pdf) (LOW-MEDIUM; verificar el decreto de 2027).
- Baia di Sorgeto: ~300 escalones desde Panza, rocas resbaladizas, taxi acuático desde Sant'Angelo — [Lonely Planet](https://www.lonelyplanet.com/italy/attractions/baia-di-sorgeto/a/poi-sig/1029522/1325029) (LOW-MEDIUM; sin fuentes sobre seguridad nocturna con niños → verificar en contenido).
- Patrones de apps de viaje: [Wanderlog — App Store](https://apps.apple.com/us/app/wanderlog/id1476732439) (offline, planificación por día y zona, export a Google Maps) (MEDIUM) + conocimiento del dominio (MEDIUM).

---
*Feature research para: v1.1 Multi-viaje + Campania*
*Researched: 2026-11-20*
