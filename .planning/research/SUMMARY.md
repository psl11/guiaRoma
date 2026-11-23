# Project Research Summary

**Project:** guiaRoma — milestone v1.1 «Multi-viaje + Campania»
**Domain:** guía de viaje editorial estática (Nuxt 4 SSG + Nuxt Content v3, GitHub Pages bajo `/guiaRoma/`), de un viaje a N viajes
**Researched:** 2026-11-20
**Confidence:** HIGH (MEDIUM en el comportamiento de GitHub Pages con barra final y en los datos de campo de Campania)

> Nota del orquestador: el sintetizador devolvió este documento inline (el runtime rechazó su `Write`
> de `SUMMARY.md`, #222); el orquestador lo persistió. Corrección aplicada: el input de Campania está
> **completo** desde el fichero aportado por el usuario (10 días, Opción 2 del día VIII incluida); el
> único punto abierto del input es la fecha de devolución del coche (25 vs 26). Año 2027 confirmado.

## Executive Summary

v1.1 no es un proyecto nuevo: es la generalización de una v1.0 que ya es multi-viaje **en datos** (colecciones con glob `trips/*/…`, `useTrip(slug)`, ruta `/trips/[slug]`) pero no en **presentación, estado ni enrutado**. `TripView` tiene 5 días literales, el chrome (marca, `<title>`, pie, leyenda del mapa) está fijo a Roma, los tres controllers singleton hacen `useTrip('roma')`, y las claves de `localStorage`/`useState` son globales. Los cuatro informes coinciden en el enfoque: **evolución estrictamente aditiva del esquema** (todo `.optional()`, enums solo se amplían), Roma recibe sus textos de chrome *verbatim* en YAML, CSS nuevo en un fichero aparte (`multitrip.css`, `base.css` intacto) y **cero dependencias nuevas** (STACK: el diff de `package.json` del milestone debe salir vacío; no subir Nuxt, Content, Playwright ni Leaflet 2).

El riesgo central es perder el oráculo de paridad de Roma (56 goldens + 80 tests). La mitigación es de orden de trabajo: **primero se desacopla el código con Roma todavía en `/` y la puerta intacta; después se mueve la URL sin tocar componentes**; los goldens no se re-baselinan en todo el milestone. El segundo riesgo es de contenido: los hardcodes de Roma que sobreviven pasan la puerta en silencio y aparecen en Campania, y los YAML de Campania no se validan en build (Content v3 no valida `type:'data'`), por lo que los tests de datos deben parametrizarse por viaje antes de escribir una sola ficha. Campania aporta tres formas nuevas que el modelo no cubre (días con opciones excluyentes, cinco bases, transporte ferry/coche/bus/bici/avión) más lugares de naturaleza (motifs SVG, tipo de marcador), todo resuelto con ampliaciones aditivas.

El input de Campania está completo (10 días, 19–28 junio 2027); queda una contradicción abierta (coche devuelto el 25 vs «disponible» el 26) que el usuario confirmará. Las fases 9-12 no dependen de ese contenido; la fase de contenido solo depende de ese dato para el día VIII.

## Key Findings

### Recommended Stack

Sin cambios ni dependencias nuevas. Todo lo nuevo se hace con lo instalado: `node:fs` para enumerar viajes en `nuxt.config.ts`, `useHead`/`useSeoMeta` (unhead 2.1.15 transitiva), `provide/inject` de Vue, `localStorage` nativo y Leaflet core. Versiones fijadas: Nuxt 4.4.8, @nuxt/content 3.14.0, Leaflet 1.9.4, @nuxtjs/color-mode 4.0.1, Playwright 1.61.0 (subirlo cambia el Chromium de los goldens). Las actualizaciones (Nuxt 4.6.4, Content 3.17.0) van a una chore aislada posterior.

**Decisiones técnicas:**
- Prerender: `nitro.prerender.routes` derivado de `content/trips/*/trip.yml` + `crawlLinks` como red de seguridad; `failOnError: true`.
- Redirección de enlaces antiguos: script inline en `<head>` solo en `/` (`useHead`, `tagPosition:'head'`, `location.replace`), porque el hash no llega al servidor y `routeRules` no sabe del hash.
- Persistencia: `tripStorageKey(slug, key) = ${slug}-${key}`; las claves de Roma ya cumplen el esquema, así que la migración es la identidad (cero riesgo de pérdida).
- Tema: `storageKey: 'roma-theme'` se queda global (lo lee el script anti-FOUC antes de Vue).
- `<title>` por viaje con `useSeoMeta`; `app.vue` conserva solo `lang`, `theme-color` y favicons.
- Mapa: `fitBounds` con `maxZoom` ya cubre multi-ciudad; sin markercluster, sin Leaflet 2.

### Expected Features

**Must have (table stakes, P1):**
- Portada índice en `/` (tarjeta por viaje: portada, título, fechas, destinos, resumen), Roma en `/trips/roma/`, redirección de `/#ancla`, prerender de todos los viajes.
- `trip.yml` estructurado + chrome data-driven (marca, título, pie, leyenda) con Roma verbatim; días por `v-for`, `navLabel`/`date` opcionales, slugs únicos con invariante; secciones y pastillas solo si hay datos.
- Búsqueda, navegación y persistencia por viaje.
- Enums ampliados con su CSS (transporte `ferry/car/bus/bike/plane`, `PlaceType` `nature`, grupos de reservas, `badgeKind`) y motifs de naturaleza (mapeo provisional aceptable).
- Días de elección A/B (apilados, visibles ambos, «— o bien —»), `stays` + «Dormís en…», caja `family`, ruta del día por modo (desactivable en días de ferry).
- Contenido completo de Campania en tono slow; suite de paridad de Roma verde en la nueva URL.

**Should have (P2, tras validar):** estado del viaje («faltan N días», «Ir a hoy») calculado solo en cliente; selector de opción A/B con memoria; marcadores de bases y «enfocar día» en el mapa.

**Defer (P3/v2):** polilíneas de ferry, mini-mapa en tarjetas, secciones-página nuevas por viaje, PWA/offline real de todas las guías, modelo de participantes, i18n, tema por viaje, clustering.

### Architecture Approach

`TripView` sigue siendo dueño de la página: publica el slug por `provide`, deriva secciones y pastillas de una **función pura** `buildTripLayout` (única fuente de orden/presencia, testeable con Vitest sin runtime Nuxt) y los controllers leen el slug por `inject` (antes del primer `await`). El estado se aísla por slug (`useState` con sufijo, `Map<slug, MiniSearch>`). Cada viaje es un documento HTML independiente, no una SPA entre viajes.

**Major components:**
1. `TripIndex.vue` + `pages/index.vue` (NUEVO/reescrito) — portada, consulta solo la colección `trip` con `.select(...)`, script de redirección.
2. `useTripContext.ts`, `utils/tripLayout.ts`, `utils/tripStorage.ts` (NUEVOS) — contexto de slug, forma del viaje, claves de storage.
3. `TripView`/`Topbar`/`NavPills`/`ReservasSection`/`GastroSection`/`foodGroups`/`mapMarkers` (MODIFICADOS) — textos y orden desde datos; sin defaults con valores de Roma (se mueven al YAML de Roma).
4. `DayOptions.vue` (NUEVO, raíz `<div>`, nunca `<section>` porque el scrollspy toma todas las `<section>`) y `multitrip.css` (NUEVO, solo aditivo).
5. `tests/parity/_harness.ts` (NUEVO) — `ROMA_URL` y arranque de servidor centralizados (hoy duplicados en ~10 specs).

### Critical Pitfalls

1. **Refactor y cambio de URL en la misma fase** — pierde el oráculo y tienta al re-baseline. Refactor con `tests/parity/` sin diff; después mover URL con el único diff = una constante; 56 goldens sin `--update-snapshots`; un test que asevere que `/` sirve la portada y `ROMA_URL` sirve Roma (si no, specs «verdes» contra la portada).
2. **Hardcodes de Roma residuales** (`app.vue` title, marca, pie, leyenda, 5 secciones literales, `FOOD_GROUP_ORDER`, `useTrip('roma')`, títulos de Reservas) — Roma sigue verde y Campania los hereda. Barrido `grep` + test-trampa con un viaje fixture que asevere que no aparece «Roma», «Einaudi» ni «giugno 2026».
3. **Slugs de día por nombre de semana** — Campania tiene dos sábados/domingos/lunes. Slugs con fecha (`sabado-19`), `navLabel` opcional, invariante de unicidad y de no-colisión con ids de sección (`inicio`, `mapa`, `reservas`…). Roma conserva `viernes…martes` (anclas legacy).
4. **Contenido sin validar y tests atados a Roma** — parametrizar `tests/data` con `describe.each(tripSlugs)` (conteos y `migration-diff` solo Roma); invariante «carpeta = slug»; nombres reservados de Content (`id`, `meta`, `stem`, `extension`).
5. **Estado y esquema** — claves `useState` y `MiniSearch` por slug; ampliaciones aditivas, `DaySchema` anidado (no `discriminatedUnion` a nivel raíz: no se materializa en columnas SQL; todo campo nuevo de `ReservasSchema` también en `ReferenceRowSchema`); cada valor de enum nuevo con su CSS/SVG y test; `rm -rf .data .nuxt .output` al inicio de `verify`.

## Implications for Roadmap

### Reconciliación de tensiones entre ficheros

**Navegación portada → viaje: recomendación `<a href>` de documento completo, destino con barra final.**
- ARCHITECTURE y PITFALLS recomiendan documento completo; STACK recomienda `<NuxtLink>` por `crawlLinks` y porque el `_payload.json` prerenderizado evita la descarga de SQLite/WASM.
- Los dos hechos son compatibles: `crawlLinks` sigue cualquier `<a href>`, no solo `NuxtLink`, y el payload evita el WASM solo si la ruta destino está prerenderizada (lo garantiza `routes` explícito, que ambos piden).
- Decide el estado: el código actual tiene singletons (índice MiniSearch de módulo, `useState` globales, `bodyAttrs`) que con navegación SPA filtran estado entre viajes; el documento completo da aislamiento gratis y reproduce el camino de hidratación validado en v1.0 (Roma nunca se ha navegado en cliente). Tampoco hay beneficio perceptible: es un salto entre guías de ~1 MB.
- Aun así, claves por slug **siempre** (defensa en profundidad) y un test Playwright que asevere que cargar portada y viaje **no** pide `sql_dump.txt` ni `.wasm`. Si en el futuro se quiere SPA, se hace como decisión explícita con test de ida y vuelta (portada → Roma → Campania → atrás).
- Enlace construido con `useRuntimeConfig().app.baseURL` (nunca `/guiaRoma/` literal) y barra final, para evitar el 301 de Pages.

**Otras reconciliaciones (una sola recomendación):**
- **Slug de viaje:** `^[a-z0-9]+$` (sin guiones), como piden ARCHITECTURE y PITFALLS; STACK admitía guiones con sufijo reservado, pero sin guiones el prefijo `${slug}-` es inequívoco (`roma-note-x` nunca colisiona). Slug de Campania: `campania` (el año va en `title`/`startDate`).
- **Regla de redirección:** hash que cumple `^#[a-z0-9-]+$` en `/` → `location.replace(base + 'trips/roma/' + hash)`. Sin lista blanca de ~100 anclas, con validación del sufijo. La portada no puede tener anclas propias. `LEGACY_TRIP = 'roma'` es constante de migración, no dato.
- **Opciones A/B:** ARCHITECTURE (`day.options`) y FEATURES (fila `choice` en `timeline`) son ambas no recursivas y anidadas. Recomiendo la fila `choice` (permite filas compartidas antes y después, como «Noche: regreso a Nápoles» del día VIII), sin tocar la invariante «un día = una sección = una pastilla». Cerrarlo en el spike de la fase 12 con un test que lea un día `choice` vía `queryCollection`.
- **Bases:** unificar como `trip.stays[]` + `day.stay` (evita confundir con `baseURL`). Marcador de alojamiento queda P2.
- **Orden de fases:** ARCHITECTURE da 9-14, PITFALLS da P1-P5 con persistencia separada. Como el esquema `${slug}-` hace la migración nula, la persistencia se pliega en la fase 9 y su test de upgrade real pasa a la fase de verificación.

### Phase 9: Desacople de singletons y tests por viaje (refactor invisible, Roma sigue en `/`)
**Rationale:** es el único tramo que se puede hacer con el oráculo totalmente intacto; todo lo demás depende de que el slug sea explícito.
**Delivers:** `useTripContext`, `tripStorageKey`, controllers y claves por slug, índice de búsqueda por slug, `MonumentCard` con clave por viaje; `tests/data` parametrizado por viaje (esquema + invariantes: slug de viaje, carpeta = slug, ids únicos y no colisión con secciones, nombres reservados, referencias `#slug` dentro del viaje).
**Addresses:** persistencia, búsqueda y navegación por viaje.
**Avoids:** pitfalls 2, 4, 5, 8. Barrido `grep` de hardcodes convertido en tareas.

### Phase 10: Forma y chrome desde datos (Roma sigue en `/`)
**Rationale:** requiere el contexto de la fase 9; portada y `<title>` necesitan `headTitle`/`startDate`.
**Delivers:** esquema aditivo (`brand`, `headTitle`, `footer`, `map.legend`, `groupOrder`, `startDate/endDate/summary/cover`, títulos de reservas, `navLabel`, `date`); primero se prueba que el YAML de Roma sin cambios valida, luego se añaden sus valores verbatim; `tripLayout.ts` con test (datos reales de Roma = 12 pastillas actuales); días por `v-for`; secciones y pastillas condicionales; `useSeoMeta`; test-trampa con viaje fixture.
**Avoids:** pitfall 2, y regresión de píxel en pie (`<br>`, MDC), marca (`brand-dot`) y «Pratica» (etiqueta verbatim).

### Phase 11: Rutas multi-viaje (portada, Roma a `/trips/roma/`, redirección, prerender)
**Rationale:** movimiento puro de URL, sin tocar componentes de Roma.
**Delivers:** primero `_harness.ts` con `ROMA_URL` sin cambiar su valor (commit propio); luego `pages/index.vue` + `TripIndex.vue` (solo `.select(...)` de la colección `trip`), `multitrip.css` (estilos de portada), `nuxt.config.ts` con rutas derivadas de datos, `ROMA_URL = …/trips/roma/`, `shell.spec` invertido (existe `trips/<slug>/index.html` por slug y no otros), `index-redirect.spec` (hash de día, de ficha, `index.html#gastronomia`, sin hash se queda, Atrás sin bucle, sin `sql_dump`), re-registro del conteo en `tests/README.md`.
**Avoids:** pitfalls 1, 6, 7.

### Phase 12: Extensiones de esquema y UI para Campania (esqueleto mínimo)
**Rationale:** estabilizar la forma con un esqueleto antes de redactar decenas de ficheros.
**Delivers:** enums ampliados con CSS/SVG y test «cada valor tiene estilo o SVG»; `choice`/`DayOptions` (`<div>`), `stays` + «Dormís en…», `family`, ruta del día por modo (`route.mode/enabled`), `MARKER_STYLE`, `escapeHtml` en popups, `trip.map.center/zoom` opcional con `fitBounds({ maxZoom })`; Campania esqueleto (trip.yml + 2-3 días, uno A/B, varias bases, una ficha `nature`) con `draft: true`; `campania-smoke.spec` (aislamiento de búsqueda, notas y modos).
**Avoids:** pitfalls 3, 9, 10. Cierra la presentación A/B antes de redactar.

### Phase 13: Contenido de Campania 2027
**Rationale:** solo YAML e imágenes; no debe forzar decisiones de esquema (si aparece una forma imprevista, se vuelve a la fase 12).
**Delivers:** 10 días, fichas (incl. naturaleza, caja de cine/literatura), gastronomía campana, reservas (alojamientos, ferries, coche, conciertos, vuelos), práctica (ferries, ZTL, calor, calzado).
**Dependencia:** fecha de devolución del coche (25 vs 26), que condiciona el día VIII.

### Phase 14: Verificación del milestone
**Delivers:** `pnpm verify` completo desde build limpia, `git diff main -- app/assets/css/base.css` vacío, test de upgrade real (cargar el `index.html` vivo de `main`, escribir nota y ritmo, abrir `/trips/roma/` y ver ambos en la primera carga), test SPA ida y vuelta, medición de tamaño de payload por viaje, sign-off humano de Roma y de Campania en móvil real incluido corte de red. El merge a `main` y el deploy siguen siendo un acto de ship aparte. El primer deploy público será v1.0 + v1.1 a la vez.

### Phase Ordering Rationale

- 9 → 10 → 11: cada fallo de paridad tiene un solo sospechoso (código, luego datos, luego URL).
- 11 antes de 12: un segundo viaje solo se prueba con rutas prerenderizadas por viaje.
- 12 antes de 13: el esquema se estabiliza con esqueleto; el contenido no lo fuerza.
- Las fases 9-12 no dependen del contenido de Campania.

### Research Flags

Fases que probablemente necesitan `/gsd-plan-phase --research-phase`:
- **Phase 11:** comportamiento real de GitHub Pages con barra final y 301, y un servidor de test que lo imite; scroll al hash tras redirección y `scrollBehavior`.
- **Phase 12:** modelado de `choice` en `timeline` y su interacción con modos de ritmo, ruta del día y numeración de marcadores; diseño de los motifs SVG nuevos (coste real de diseño) o mapeo provisional.
- **Phase 13:** verificación de datos de campo (restricción de vehículos en Procida/Ischia 2027, horarios y muelles de ferry, seguridad de Sorgeto de noche con niños, fechas de conciertos, «carrera popular» del día II).

Fases con patrones estándar (saltar research-phase):
- **Phase 9:** refactor mecánico con inventario `file:line` ya hecho.
- **Phase 10:** mover textos a YAML verbatim, función pura con test.
- **Phase 14:** puerta y checklist ya definidos.

## Decisiones que necesitan al usuario

1. **«← Todos los viajes» en Roma:** cualquier elemento nuevo cambia goldens. Opción recomendada: enlace discreto en el pie y re-baseline documentado solo de la captura del pie; alternativa: no añadir enlace en v1.1 (el navegador y la URL bastan). Decidir antes de la fase 11.
2. **Presentación de las opciones A/B:** vista apilada «Elige una» con «— o bien —» (recomendada: offline, sin JS, imprimible, el resumen muestra ambas) frente a un selector que oculte la no elegida (P2). Decidir antes de la fase 12.
3. **Devolución del coche (25 vs 26):** condiciona si el día VIII es en coche o transporte público. Necesario antes de la fase 13.
4. **Re-baseline de goldens:** cualquier excepción necesita decisión explícita (por defecto, ninguna en todo el milestone).
5. **Motifs SVG nuevos vs mapeo provisional** a motivos existentes (`garden`, `tower`, `rooftops`): coste de diseño frente a fidelidad del fallback offline.
6. **Publicación de Campania:** `draft: true` hasta que el contenido esté completo, o publicar con días marcados como provisionales.
7. **Alcance P2:** confirmar que estado del viaje, «Hoy» y «enfocar día» quedan fuera de v1.1.
8. **Actualización de dependencias** (Nuxt 4.6.4, Content 3.17.0): confirmar que va a una chore posterior.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verificado en `node_modules` y en `.output/public`; solo MEDIUM la barra final de GitHub Pages |
| Features | MEDIUM-HIGH | Brechas de esquema leídas del código (HIGH); patrones de producto y datos de campo de Campania MEDIUM/LOW |
| Architecture | HIGH | Inventario de 25 acoplamientos con `file:line`; MEDIUM en el comportamiento de Content en navegación cliente |
| Pitfalls | HIGH | Salen del código y de la build actuales; LOW solo el `pageKey` por defecto de Nuxt |

**Overall confidence:** HIGH para la plataforma multi-viaje; MEDIUM para el contenido de Campania.

### Gaps to Address

- Barra final en GitHub Pages: verificar en la fase 11 con un servidor que imite el 301; plan B `autoSubfolderIndex: false` o `trailing-slash="append"`.
- `pageKey` de `trips/[slug].vue`: fijar `definePageMeta({ key: route => route.fullPath })` para hacer explícito el remontaje.
- Contradicción entre propuestas sobre `trip.map.center/zoom` (opcional en STACK, obligatorio en PITFALLS): recomiendo opcional con `fitBounds`, Roma conserva la vista fija; confirmarlo en la fase 12.
- Formato exacto de las claves que escribe el `index.html` vivo de `main`: verificar leyendo ese fichero, no el código Nuxt.
- Deuda preexistente documentada, no tocar: cap de 10 paradas frente al límite de 3 waypoints de Google Maps en móvil.
- Datos de campo de Campania sin verificar (ver research flags de la fase 13).

## Sources

### Primary (HIGH confidence)
- Lectura directa del código de `release/nuxt-4` (`app/`, `shared/schemas.ts`, `content.config.ts`, `nuxt.config.ts`, `tests/`) y build `.output/public`.
- `.planning/PROJECT.md` y `.planning/inputs/campania-2027-itinerario-raw.md`.
- npm registry (2026-11-20) y código instalado (`@nuxt/schema`, `@nuxt/content`, `h3`, `@unhead/vue`).
- Detalle en `STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md` de este directorio.

### Secondary (MEDIUM confidence)
- Nuxt Content (Static deploy, Database, Releases), unhead docs, Google Maps URLs, patrones de apps de viaje.

### Tertiary (LOW confidence, validar)
- Comportamiento 301 de GitHub Pages con barra final; restricciones de vehículos en Procida/Ischia; Baia di Sorgeto con niños de noche; `pageKey` por defecto de Nuxt.

---
*Research completed: 2026-11-20*
*Ready for roadmap: yes*
