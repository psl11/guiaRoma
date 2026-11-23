# Milestone v1.0 — Resumen del proyecto

**Generado:** 2026-06-24
**Propósito:** Onboarding del equipo y revisión del proyecto
**Estado:** ✅ Milestone COMPLETO — 8/8 fases, 33/33 requisitos, paridad declarada «buena»

---

## 1. Visión general del proyecto

**guiaRoma** es una guía de viaje editorial (un viaje de 5 días a Roma) cuidada al detalle.
Existía como un único `index.html` (6.665 líneas / 734 KB) con todo el contenido, el CSS y la
lógica inline. Este milestone la **migra a Nuxt 4** sin cambiar lo que el usuario ve ni puede
hacer: mismo resultado visual y funcional, pero con el contenido extraído a **datos
estructurados y tipados**, la UI partida en **componentes reutilizables**, y una arquitectura
**multi-viaje** (añadir un viaje futuro = añadir archivos de datos, sin tocar código).

**Core value (innegociable):** la 1.0 debe ser **exactamente igual que la guía de hoy**
(paridad visual y funcional al 100%), pero construida de forma dinámica y mantenible. Pensada
para consultarse paseando por Roma → debe funcionar con conexión pobre o nula (offline).

La 1.0 entrega esa paridad **demostrada objetivamente** y firmada por un humano. El acto de
ship (merge a `main` + deploy) queda deliberadamente fuera (D-08): `main` permanece intacto.

## 2. Arquitectura y decisiones técnicas

- **Framework: Nuxt 4 (Vue 3 + Nitro), salida estática (`nuxt generate`).** Elegido por dominio
  del equipo y porque habilita el backend futuro (auth/uploads en v2). El directorio Nitro
  `server/` existe pero está **dormido** (ARCH-03). *(Fase 1)*
- **CSS editorial conservado VERBATIM** como CSS global + custom properties (que ya SON los
  design tokens). NO Tailwind/UnoCSS — reescribir 2.200 líneas sería pura superficie de
  regresión visual contra el listón de paridad. *(Fase 1)*
- **Capa de datos: Nuxt Content v3 + esquema zod.** 6 colecciones (`trip/day/monument/food/
  artist/reference`) en YAML `type:'data'`, prosa en Markdown-inline renderizada con `<MDC>`.
  La validación de esquema **rompe el build** si un dato no cumple (DATA-05). Multi-viaje
  trivial: el `source` glob reúne `trips/*/`. *(Fase 2)*
- **`day.cards: string[]` explícito** codifica el orden exacto de fichas y la «ruta del día»,
  reemplazando la dependencia del orden del DOM del `index.html`. *(Fase 2)*
- **Renderizado data-driven vía `useTrip(slug)` + `TripView`**, reutilizado por `/` (Roma) y
  `/trips/[slug]`. Añadir un viaje = añadir ficheros, sin tocar código (ARCH-01/02). *(Fase 3)*
- **Tema sin FOUC con `@nuxtjs/color-mode`** (`data-theme`, `storageKey:'roma-theme'`): script
  inline anti-flash, mismo selector que el CSS actual → paridad sin reescribir estilos. *(Fase 3)*
- **Navegación unificada en `useCardNavigation`** (scroll-a-ficha + `.highlight`, pila «Volver»
  que restaura scroll, scrollspy con offset `+130`), consumida por enlaces, mapa y búsqueda
  desde un único sitio. *(Fase 5)*
- **Búsqueda cliente con MiniSearch sobre los DATOS** (no scraping del DOM); «ruta del día»
  derivada de `day.cards` con el cap de 10 paradas y muestreo. *(Fase 6)*
- **Mapa Leaflet 1.9.4 CRUDO en una isla `.client.vue`** (NO el wrapper Vue abandonado): import
  dinámico en `onMounted`, `<ClientOnly>` + `#fallback` del mismo tamaño, 39 marcadores
  `divIcon` por tipo, popups que navegan vía el listener en captura, banner offline con la
  heurística exacta `tilesErrored>3 && tilesLoaded===0`. *(Fase 7)*
- **Offline self-hosted (BUILD-02):** Leaflet y fuentes servidas desde el propio dominio (no
  CDN/Google Fonts); imágenes remotas degradan a SVG por `motif`; notas por ficha en
  `localStorage['roma-note-<slug>']`. *(Fases 1/7)*
- **Despliegue estático bajo `/guiaRoma/`** (`app.baseURL` + `nitro.preset:'github_pages'` +
  `public/.nojekyll` + `prerender.failOnError`). *(Fase 1)*
- **Verificación de paridad con Playwright:** golden de 56 PNGs (14 vistas × claro/oscuro ×
  móvil/desktop) capturado de `main` ANTES de divergir, comando-puerta único `pnpm verify`. *(Fases 1/8)*

## 3. Fases entregadas

| Fase | Nombre | Estado | Una línea |
|------|--------|--------|-----------|
| 1 | Andamiaje + Golden de paridad | ✅ | Nuxt 4 estático bajo `/guiaRoma/`, CSS verbatim, Nitro dormido, golden capturado de `main` antes de divergir |
| 2 | Esquema de datos + migración | ✅ | 6 colecciones zod en Content v3; todo Roma migrado 1:1 a datos tipados; validación que rompe el build |
| 3 | Capa de página, layout y tema | ✅ | `useTrip`+`TripView` data-driven, routing multi-viaje, chrome idéntico, tema claro/oscuro sin parpadeo |
| 4 | Render de contenido + modos de ritmo | ✅ | Fichas/timeline/referencia desde datos e idénticos; ritmo, «caminar menos», modo resumen |
| 5 | Navegación transversal | ✅ | `useCardNavigation` (scroll-a-ficha, pila volver, scrollspy +130) consumida por enlaces/mapa/búsqueda |
| 6 | Derivados de datos — búsqueda y ruta del día | ✅ | Búsqueda MiniSearch sobre datos + «ruta del día» derivada de `day.cards`, misma cobertura |
| 7 | Isla client-only — mapa, fallback, notas | ✅ | Mapa Leaflet client-only, imagen-con-fallback hero/detail, notas por ficha en localStorage |
| 8 | Verificación de paridad | ✅ | Suite Playwright (visual-diff vs golden + E2E comportamiento + invariantes de datos) + sign-off humano |

## 4. Cobertura de requisitos

**33/33 requisitos completos (100%).** Trazabilidad completa en `.planning/REQUIREMENTS.md`.

- ✅ **PLAT-01..05** (Fase 1): Nuxt 4 arranca/genera sin errores, TS estricto, ESLint+Prettier, CSS conservado, estructura de carpetas.
- ✅ **DATA-01..06** (Fase 2): esquema zod, orden+pace de timeline, `day.cards`, contenido 1:1, validación que rompe build, prosa MDC.
- ✅ **ARCH-01..03** (Fases 1/3): render por `useTrip`, routing multi-viaje, Nitro dormido.
- ✅ **UI-01..05** (Fases 3/4/7): chrome, ficha, timeline, secciones de referencia, imagen-con-fallback — idénticos a hoy.
- ✅ **FEAT-01..09** (Fases 3/4/5/6/7): tema sin FOUC, mapa, búsqueda, notas, navegación+scrollspy, 3 modos de ritmo, ruta del día.
- ✅ **BUILD-01..03** (Fase 1): estático en GitHub Pages bajo subpath, offline self-hosted, equivalencia en subpath de producción.
- ✅ **PARITY-01** (Fase 1): golden capturado de la versión actual antes de divergir.
- ✅ **PARITY-02** (Fase 8): suite visual + comportamental confirma paridad; gate `pnpm verify` VERDE + sign-off humano declara la 1.0 «paridad-buena».

## 5. Registro de decisiones clave

- **Híbrido sesgado a estructura (formato de contenido):** YAML `type:'data'` por viaje + prosa en campos Markdown-inline `<MDC>`. Ni JSON crudo a mano (PRs ilegibles) ni Markdown-por-ficha (registros desincronizables). *(Fase 2)*
- **Leaflet crudo, no el wrapper Vue** (`@vue-leaflet` sin mantenimiento desde 2023; el wrapper complicaría la paridad de marcadores). *(Fase 7)*
- **Specs de paridad AUTOCONTENIDOS:** cada spec genera+sirve su propio build bajo `/guiaRoma/` (el webServer por defecto sirve el `index.html` viejo). Patrón clonado en F3–F8. *(Fases 3–8)*
- **D-03 — comando-puerta único `pnpm verify`** = `generate` + `test:unit` + `test:data` + suite parity. Verde = condición de la 1.0. *(Fase 8)*
- **D-04 — 2 exclusiones documentadas del gate:** `golden.spec.ts` (recaptura el index.html viejo; queda como herramienta a demanda) y `shell.spec.ts` dev-routing (frágil al lock de `nuxi dev`; ARCH-02 ya cubierto por el build estático). *(Fase 8)*
- **D-06 — `#mapa` = única excepción a la paridad-pixel:** sin baseline en el golden (tiles OSM no deterministas); verificado por comportamiento vía `map-fallback-notes.spec.ts` (12/12) dentro del gate. *(Fase 8)*
- **D-01 ANULADO esta sesión — re-baseline del golden desde el build Nuxt:** la paridad byte-exacta con las fuentes Google *de red* no compensa su coste frente a las fuentes self-hosted offline que realmente se sirven (cut de Lora con kerning/GPOS distinto → deltas de wrap sub-línea). Objetivo acordado: paridad **visual+funcional efectiva de lo que se envía**. `maxDiffPixelRatio:0.01` sin máscaras se mantiene → el gate sigue cazando regresiones reales. *(Fase 8)*
- **D-07 — cierre = suite verde + sign-off humano** (F7 prerequisito + F8 global). *(Fase 8)*
- **D-08 — F8 PARA en verde+sign-off:** merge `release/nuxt-4`→`main` y deploy/CI FUERA de alcance; `main` intacto. *(Fase 8)*

## 6. Deuda técnica y elementos diferidos

- **Parity gap real de MiniSearch (Fase 8 deferred):** `"Pante"` devuelve un primer resultado distinto al `index.html` — diferencia de `boost`/`fields`/tokenización. Es el único gap de paridad *de comportamiento* identificado; merece alinear las opciones de MiniSearch en una tarea aparte.
- **Fragilidad de test (no bug de app):** `search-route.spec.ts:206` — «Volver» desde una ficha profunda no asienta el scroll suave dentro de los 5s de `expect.poll` (existe idéntico en HEAD puro). `goBack()` es un port fiel del `index.html`; el arreglo es de test (asentar el scroll antes de aseverar), NO cambiar la app.
- **Code review F8 (advisory, 6 warnings / 5 info — en tooling, no en la app):** el más material es `scripts/vendor-fonts.mjs` (`readdirSync` antes de `mkdirSync` → ENOENT en checkout limpio; sin validación de `fetch`/regex). El invariante anti-tamper del gate (80 tests / 11 ficheros) vive solo en prosa de `tests/README.md`, no está forzado por máquina. Detalle en `08-REVIEW.md`.
- **Seguridad:** no se generó `08-SECURITY.md` (el threat model del plan es docs-only: cero instalaciones de paquetes, sin superficie de runtime). Si se quiere cerrar el gate formalmente: `/gsd:secure-phase 08`.
- **Diferidos resueltos en su camino:** la unión SQL artist/reference (D1, F3→F4), el `:tag=false` de `<MDC>` para suprimir el `<div>` envoltorio (F4), y las 5 variantes de `.tl-transport` (F4) — todos cerrados dentro del milestone.
- **Fuera de alcance por diseño (no es deuda):** PWA / cacheo de tiles offline real (v2); `@nuxt/image` sobre las heros de Wikimedia (rompería el patrón de fallback); el acto de ship (merge+deploy, D-08).

## 7. Primeros pasos para nuevos colaboradores

- **Arrancar en desarrollo:** `pnpm dev` (Nuxt en `/guiaRoma/`).
- **Build estático:** `pnpm generate` → `.output/public`. Para previsualizar el subpath: servir el build bajo un subdir `guiaRoma/` y abrir `/guiaRoma/` (servir `.output/public` en la raíz da página en blanco por el `baseURL`).
- **Puerta de paridad (lo que define la 1.0):** `pnpm verify` (generate + `test:unit` + `test:data` + `test:parity`). Debe quedar VERDE.
- **Tests:** `pnpm test:unit` (lógica pura), `pnpm test:data` (invariantes de datos F2), `pnpm test:parity` (suite Playwright gate-scoped). `pnpm test:golden:update` regenera el baseline (a demanda, NO en el gate).
- **Directorios clave:**
  - `content/trips/roma/` — los datos del viaje (YAML tipado): `trip.yml`, `days/`, `monuments/`, `food`, `artists`, `reference`.
  - `app/components/` — UI (`TripView`, `TheHero`, `MonumentCard`, timeline, chrome, mapa client-only, `DetailPhoto`).
  - `app/composables/` + `app/utils/` — `useTrip`, `useCardNavigation`, modos de ritmo, índices de búsqueda, marcadores, motifs.
  - `app/assets/css/` — el CSS editorial verbatim (la fuente de verdad del look).
  - `shared/schemas.ts` — el esquema zod de las colecciones (de ahí salen los tipos TS).
  - `tests/parity/` — los specs autocontenidos + `golden.spec.ts-snapshots/` (los 56 PNGs).
- **Dónde mirar primero:** `content/trips/roma/trip.yml` y `app/components/TripView.vue` para entender el render data-driven; `.planning/PROJECT.md` + `CLAUDE.md` para las decisiones de stack; `.planning/phases/08-*/parity-signoff.md` para el estado de paridad de la 1.0.

---

## Estadísticas

- **Cronología:** 2026-06-18 → 2026-06-24 (~6 días)
- **Fases:** 8 / 8 completas
- **Requisitos:** 33 / 33 completos
- **Commits:** 247
- **Ficheros cambiados:** 405 (+60.623 / −122) — ~255 ficheros de código (no-planning)
- **Contribuidores:** Víctor Company Bernal
- **Estado del gate:** `pnpm verify` VERDE — 80 parity + 87 unit + 295 data (exit 0)
