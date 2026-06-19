# guiaRoma — Guía de viajes dinámica

## What This Is

guiaRoma es una guía de viaje editorial, cuidada al detalle, que hoy existe como un único `index.html` (6.665 líneas / 734 KB) con la planificación de un viaje de 5 días a Roma. Este proyecto la **migra a Nuxt 4**: el mismo resultado visual y funcional, pero con el contenido extraído a **datos estructurados y tipados**, la UI partida en **componentes reutilizables**, y una arquitectura **multi-viaje** (añadir un viaje futuro = añadir archivos de datos, sin tocar código). Está pensada para consultarse paseando por la ciudad, por lo que debe seguir funcionando con conexión pobre o nula.

## Core Value

La 1.0 debe ser **exactamente igual que la guía de hoy** (paridad visual y funcional al 100%), pero construida de forma dinámica y mantenible. Si todo lo demás se simplifica, esto no se negocia: lo que el usuario ve y puede hacer no cambia.

## Requirements

### Validated

<!-- Capacidades de la guía ACTUAL (index.html en `main`). Ya están en producción y son valiosas: definen el listón de paridad de la 1.0. Deben preservarse 1:1. -->

- ✓ Guía de Roma de 5 días (Viernes→Martes) con ~37 fichas de monumentos — existing
- ✓ Fichas con imagen *hero*, nombre italiano, prosa histórica, enlace a Google Maps y *fallback* SVG si la imagen falla — existing
- ✓ Mapa Leaflet con marcadores numerados (romanos) por lugar, popups y *fit bounds*; banner "sin conexión" si fallan los *tiles* — existing
- ✓ Timeline por día (`tl-item` / `tl-transport` / `tl-food-item`) con selector de ritmo: optimista / neutral / lento — existing
- ✓ Modo "caminar menos" (movilidad reducida) — existing
- ✓ Modo resumen (vista índice de hora y lugar) — existing
- ✓ "Ruta del día": botón por día que abre Google Maps con todas las paradas en orden — existing
- ✓ Búsqueda en cliente sobre el contenido de las fichas — existing
- ✓ Notas personales por ficha, persistidas en localStorage — existing
- ✓ Tema claro/oscuro persistente (respeta `prefers-color-scheme`) — existing
- ✓ Navegación con pila de retroceso + scrollspy de pastillas de navegación — existing
- ✓ Secciones de referencia: Reservas, Gastronomía, Práctica, Arte, Arquitectura — existing
- ✓ Diseño editorial responsive y accesible (Cormorant Garamond / Lora / JetBrains Mono; paleta romana terracota+oro; aria labels) — existing

### Active

<!-- Objetivos de la migración. Construyendo hacia esto en la 1.0. -->

- [x] Proyecto Nuxt 4 funcionando (estructura, build estático, dev server) — ✓ **Fase 1**
- [x] Todo el contenido de Roma extraído a datos estructurados y **tipados** (esquema de viaje validado) — ✓ **Fase 2** (6 colecciones zod en Nuxt Content, 85 ficheros YAML, migración 1:1 verificada por harness de diff)
- [ ] UI partida en **componentes reutilizables** (ficha, timeline, mapa, controles, secciones, layout) — Fases 3-4
- [ ] Arquitectura **multi-viaje**: la app renderiza un viaje a partir de sus datos; añadir otro = añadir archivos
- [ ] **Paridad 100%** visual y funcional con el `index.html` actual (verificada) — *golden* de referencia capturado en **Fase 1** (56 PNGs); verificación de paridad en Fase 8
- [~] **Salida estática** desplegable como ahora (`nuxt generate`) y **comportamiento offline conservado** — parcial: build estático bajo `/guiaRoma/` + fuentes/Leaflet self-host (0×CDN) en **Fase 1**
- [~] **Estandarización**: TypeScript, ESLint/Prettier, *design tokens*, validación de esquema de datos — parcial: TS estricto + ESLint (stylistic) + *design tokens* (CSS verbatim) en **Fase 1**; validación zod (6 colecciones, puerta que rompe el build) ✓ **Fase 2**
- [x] Backend (Nitro) **preparado pero dormido**: estructura lista para v2, sin funcionalidad de servidor activa en 1.0 — ✓ **Fase 1** (`server/api/README.md`, cero endpoints)

### Out of Scope

<!-- Límites explícitos con su razón, para no re-añadirlos. -->

- Backend real, autenticación, subida de imágenes/vídeos — **v2** (Nitro queda preparado; no se activa en 1.0)
- PWA instalable con caché offline real — **v2** (anotado expresamente; la 1.0 conserva el offline actual, no añade PWA)
- Añadir un segundo viaje con contenido real — **futuro** (la arquitectura lo soporta; 1.0 entrega solo Roma)
- Rediseño visual o nuevas funcionalidades de producto — la 1.0 es **paridad**, no mejora de producto
- CMS / panel de edición de viajes — **futuro**
- i18n / multidioma — no solicitado (el contenido es español con toques de italiano)

## Context

- **Estado actual**: un único `index.html` en la rama `main` de `psl11/guiaRoma`. CSS propio (~2.200 líneas, ya con variables de diseño), Leaflet **incrustado** (CSS+JS) para funcionar offline, librería SVG inline para *fallbacks*, e ~410 líneas de JS de app. **El contenido rico está escrito a mano dentro del HTML**; la única estructura de datos es el array `places` en JS (id, nº romano, nombre, día, lat/lng, tipo: card/guided/concert).
- **Equipo y proceso**: grupo pequeño que planifica el viaje en común y colabora mediante Pull Requests en GitHub. Comunicación en español.
- **Experiencia**: el responsable domina Nuxt y prevé evolucionar la app a *full-stack* (auth, subida de media de los viajes), lo que motivó elegir Nuxt 4 sobre Astro.
- **Uso real**: consultar la guía sobre el terreno en Roma, posiblemente con conexión móvil pobre → el offline importa de verdad.
- **Dependencias externas actuales**: Google Fonts; imágenes alojadas en terceros (Wikimedia y otros) con *fallback* SVG; *tiles* de OpenStreetMap para el mapa.
- **Estado de la migración**: Fases 1-2 completadas en `release/nuxt-4`. Fase 1 — andamiaje Nuxt 4 (build estático bajo `/guiaRoma/`, CSS editorial verbatim, fuentes/Leaflet self-host, backend Nitro dormido) y *golden* de paridad (56 PNGs deterministas). Fase 2 — esquema de viaje tipado en **Nuxt Content v3** (6 colecciones zod en `shared/schemas.ts`) y **todo el contenido de Roma migrado 1:1** (85 ficheros YAML: 38 monumentos + 26 gastro + 13 arte/arquitectura + 5 días + 2 referencia + 1 trip), con puertas de validación Vitest que rompen el build (DATA-05 vía test, ya que Content v3 no valida `type:data` en build — #3351) y un harness cheerio que verifica equivalencia 1:1 de texto+enlaces. `main` intacto. Siguiente: Fase 3 (capa de página, layout y tema).

## Constraints

- **Tech stack**: Nuxt 4 (Vue 3 + Nitro). Elegido por dominio del equipo y porque habilita el backend futuro mejor que Astro.
- **Paridad**: salida visual y funcional **idéntica** al `index.html` actual — listón innegociable de la 1.0.
- **Deployment**: **salida estática** (`nuxt generate`) desplegable como hoy (GitHub Pages); sin servidor activo en 1.0.
- **Offline**: conservar el funcionamiento con conexión pobre/nula (Leaflet local, *fallbacks* de imagen, banner de mapa offline).
- **Proceso**: todo el trabajo en una **rama de release** dedicada; `main` (la versión viva) permanece intacta; no romper nada.
- **Datos**: contenido en datos estructurados y tipados; el **formato exacto** (JSON estructurado vs Markdown por ficha vs híbrido) se decide en la fase de investigación, en el contexto de Nuxt Content v3.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nuxt 4 como framework | El equipo lo domina y Nitro habilita el backend futuro (auth, uploads) mejor que Astro | ✓ Fase 1: scaffold compila a estático bajo `/guiaRoma/` |
| 1.0 = solo Roma, *data-driven* | Fidelidad a "igual que ahora" + arquitectura lista para N viajes | ✓ Fase 2: 6 colecciones zod, 85 ficheros YAML bajo `content/trips/roma/`, glob `trips/*/…` listo para multi-viaje |
| Estático + offline en 1.0; PWA a v2 | Mantener el uso actual sin sobre-ingeniería | ✓ Fase 1: `nuxt generate`; fuentes/Leaflet self-host (0×CDN) |
| Formato de contenido a decidir en research | Depende de Nuxt Content v3; JSON vs Markdown vs híbrido | Decidido (research/CLAUDE.md): híbrido YAML `type:data` + MDC |
| Trabajo en rama de release, `main` intacto | No romper la versión viva durante la migración | ✓ Fase 1: todo en `release/nuxt-4`; `main` intacto |
| Backend preparado pero dormido en 1.0 | Evitar *scope creep*; dejar la puerta abierta para v2 | ✓ Fase 1: `server/api/README.md`, cero endpoints |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-19 — Fase 2 completada (esquema de datos tipado + migración 1:1 del contenido de Roma)*
