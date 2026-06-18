# Requirements: guiaRoma — Migración a Nuxt 4

**Defined:** 2026-06-18
**Core Value:** La 1.0 debe ser exactamente igual que la guía de hoy (paridad visual y funcional al 100%), pero construida de forma dinámica, data-driven y mantenible.

> **Nota de alcance:** esta no es una definición de producto nuevo, sino una **migración con paridad**. La lista de funcionalidades de cara al usuario ya está fijada por la versión viva (`index.html`). Por eso los requisitos cubren (a) la plataforma/arquitectura nueva y (b) la **preservación 1:1** de cada capacidad existente. La barra innegociable: lo que el usuario ve y puede hacer **no cambia**.

## v1 Requirements

Requisitos para la release 1.0. Cada uno se mapea a una fase del roadmap.

### Plataforma y estandarización (PLAT)

- [ ] **PLAT-01**: El proyecto Nuxt 4 arranca en desarrollo (`nuxt dev`) y compila a estático (`nuxt generate`) sin errores
- [ ] **PLAT-02**: TypeScript en modo estricto en todo el proyecto
- [ ] **PLAT-03**: ESLint + Prettier (`@nuxt/eslint`) configurados y el comando de lint pasa limpio
- [ ] **PLAT-04**: El CSS editorial actual se conserva como CSS global (las custom properties siguen siendo el sistema de design tokens), sin reescribirlo a otro framework
- [ ] **PLAT-05**: Estructura de carpetas Nuxt 4 establecida (`app/`, `content/`, `public/`, `server/`, `shared/`, `nuxt.config.ts`)

### Modelo de datos y contenido (DATA)

- [ ] **DATA-01**: Esquema de viaje tipado con zod en colecciones de Nuxt Content v3 (trip, day, monument, food, artist, reference)
- [ ] **DATA-02**: El timeline de cada día codifica el ORDEN explícito de sus filas (stop / transport / meta / food …) y el `pace` de cada una (all / medium / slow-only)
- [ ] **DATA-03**: Cada día declara `cards: string[]` con el orden exacto de sus fichas, para reproducir la "ruta del día" (que hoy depende del orden del DOM, no del array `places`)
- [ ] **DATA-04**: Todo el contenido de Roma (≈37 fichas de monumento + gastronomía + arte/artistas + secciones de referencia) migrado 1:1 a datos, sin pérdida de texto ni de enlaces
- [ ] **DATA-05**: La validación de esquema falla el build cuando un dato no cumple (ningún dato inválido llega a producción)
- [ ] **DATA-06**: La prosa rica de las fichas se escribe en Markdown-inline y se renderiza con `<MDC>` preservando negritas, enlaces y párrafos

### Arquitectura multi-viaje (ARCH)

- [ ] **ARCH-01**: La página renderiza un viaje a partir de sus datos vía `useTrip(slug)`; añadir un viaje nuevo = añadir archivos de contenido, sin tocar código
- [ ] **ARCH-02**: Routing preparado para multi-viaje (`/` = Roma por defecto; estructura `/trips/[slug]` lista) reutilizando un mismo `TripView`
- [ ] **ARCH-03**: Directorio Nitro `server/` presente pero dormido (sin endpoints activos); el sitio se sigue generando estático

### Componentes y render (UI)

- [ ] **UI-01**: Layout / Topbar / NavPills componentizados y visualmente idénticos a hoy
- [ ] **UI-02**: Componente de ficha de atracción (hero, nombre italiano, prosa, enlace a Maps, notas) idéntico a hoy
- [ ] **UI-03**: Timeline componentizado (item / transport / food) idéntico a hoy, respetando el filtrado por ritmo
- [ ] **UI-04**: Secciones de referencia (Reservas, Gastronomía, Práctica, Arte, Arquitectura) renderizadas desde datos e idénticas a hoy
- [ ] **UI-05**: Componente imagen-con-fallback que reproduce el comportamiento actual (`onerror` → SVG por ficha / motif)

### Features interactivas — paridad (FEAT)

- [ ] **FEAT-01**: Tema claro/oscuro con `@nuxtjs/color-mode` (`data-theme`, `storageKey: 'roma-theme'`), respeta `prefers-color-scheme` y no parpadea en estático
- [ ] **FEAT-02**: Mapa Leaflet (componente client-only) con marcadores numerados por tipo, popups "Abrir ficha →", `fitBounds` y banner offline — idéntico a hoy
- [ ] **FEAT-03**: Búsqueda en cliente sobre los DATOS (MiniSearch), cubriendo el mismo texto que hoy, con dropdown que navega a la ficha
- [ ] **FEAT-04**: Notas por ficha persistidas en localStorage, con las mismas claves y comportamiento
- [ ] **FEAT-05**: Navegación a ficha con resaltado + botón "volver" (pila) que restaura el scroll, y scrollspy de pastillas con el mismo offset
- [ ] **FEAT-06**: Selector de ritmo (optimista / neutral / lento) que muestra u oculta items del timeline, persistido
- [ ] **FEAT-07**: Modo "caminar menos" (movilidad reducida) que además fuerza ritmo lento
- [ ] **FEAT-08**: Modo resumen (vista índice de hora y lugar)
- [ ] **FEAT-09**: "Ruta del día" derivada de datos: enlace a Google Maps con las paradas del día en orden, con el mismo cap (10 paradas) y muestreo

### Estático, offline y despliegue (BUILD)

- [ ] **BUILD-01**: `nuxt generate` produce un sitio estático desplegable en GitHub Pages bajo subpath `/guiaRoma/` (baseURL + `.nojekyll`), con los assets resolviendo correctamente
- [ ] **BUILD-02**: Comportamiento offline conservado: Leaflet self-hosteado (no CDN) y fuentes self-hosteadas (`@nuxt/fonts`) para no depender de Google Fonts; las imágenes remotas degradan a fallback SVG como hoy
- [ ] **BUILD-03**: La app funciona servida desde el subpath de producción de forma equivalente a la versión actual

### Verificación de paridad (PARITY)

- [ ] **PARITY-01**: Golden de Playwright capturado desde la versión actual ANTES de divergir, como referencia objetiva de paridad
- [ ] **PARITY-02**: Suite de verificación visual (visual-diff) y comportamental que confirma paridad 100% con el `index.html` actual; debe pasar antes de dar la 1.0 por buena

## v2 Requirements

Diferidos a futuras releases. Reconocidos pero fuera del roadmap actual.

### Backend (BACK)

- **BACK-01**: Autenticación de usuarios
- **BACK-02**: Subida de imágenes y vídeos de los viajes
- **BACK-03**: API de servidor con Nitro (activar el backend que en 1.0 queda dormido)

### PWA (PWA)

- **PWA-01**: App instalable en el móvil (`@vite-pwa/nuxt`)
- **PWA-02**: Caché offline real, incluida la de tiles del mapa

### Multi-viaje real (TRIP)

- **TRIP-01**: Añadir un segundo viaje con contenido real (la arquitectura de 1.0 ya lo soporta)

## Out of Scope

Excluido explícitamente para no caer en scope creep.

| Feature | Reason |
|---------|--------|
| Rediseño visual o nuevas funcionalidades de producto | La 1.0 es paridad, no mejora de producto |
| Backend activo (auth, uploads, API) | Diferido a v2; Nitro queda preparado pero dormido |
| PWA instalable / caché offline real | Diferido a v2 (anotado); 1.0 conserva el offline actual |
| Segundo viaje con contenido real | La 1.0 entrega solo Roma; la arquitectura lo soporta |
| CMS / panel de edición de viajes | Futuro |
| i18n / multidioma | No solicitado (contenido ES con toques de IT) |

## Traceability

Qué fases cubren qué requisitos. Mapeo del roadmap (ver `.planning/ROADMAP.md`).

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Pending |
| PLAT-02 | Phase 1 | Pending |
| PLAT-03 | Phase 1 | Pending |
| PLAT-04 | Phase 1 | Pending |
| PLAT-05 | Phase 1 | Pending |
| ARCH-03 | Phase 1 | Pending |
| BUILD-01 | Phase 1 | Pending |
| BUILD-02 | Phase 1 | Pending |
| BUILD-03 | Phase 1 | Pending |
| PARITY-01 | Phase 1 | Pending |
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 2 | Pending |
| DATA-03 | Phase 2 | Pending |
| DATA-04 | Phase 2 | Pending |
| DATA-05 | Phase 2 | Pending |
| DATA-06 | Phase 2 | Pending |
| ARCH-01 | Phase 3 | Pending |
| ARCH-02 | Phase 3 | Pending |
| UI-01 | Phase 3 | Pending |
| FEAT-01 | Phase 3 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| FEAT-06 | Phase 4 | Pending |
| FEAT-07 | Phase 4 | Pending |
| FEAT-08 | Phase 4 | Pending |
| FEAT-05 | Phase 5 | Pending |
| FEAT-03 | Phase 6 | Pending |
| FEAT-09 | Phase 6 | Pending |
| FEAT-02 | Phase 7 | Pending |
| UI-05 | Phase 7 | Pending |
| FEAT-04 | Phase 7 | Pending |
| PARITY-02 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 33 total (PLAT 5 · DATA 6 · ARCH 3 · UI 5 · FEAT 9 · BUILD 3 · PARITY 2)
- Mapped to phases: 33
- Unmapped: 0 ✓

> Nota: la definición inicial anotaba "28 total" como cuenta provisional; el recuento exacto de REQ-IDs es **33**. Todos quedan mapeados a exactamente una fase, sin huérfanos ni duplicados.

---
*Requirements defined: 2026-06-18*
*Last updated: 2026-06-18 after roadmap traceability mapping*
