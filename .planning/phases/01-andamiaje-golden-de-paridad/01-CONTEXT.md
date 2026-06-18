# Phase 1: Andamiaje + Golden de paridad - Context

**Gathered:** 2026-06-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Dejar el proyecto **Nuxt 4 arrancando y compilando a estático** bajo el subpath de producción `/guiaRoma/`, con el **CSS editorial conservado verbatim** como CSS global, el **backend Nitro presente pero dormido**, y **capturar el golden de paridad** (screenshots de la guía actual) **antes de que la rama de release diverja** — la referencia objetiva contra la que se medirá toda la paridad posterior (Fase 8).

Cubre: PLAT-01..05, ARCH-03, BUILD-01, BUILD-02, BUILD-03, PARITY-01.

**No incluye** (otras fases): modelado/migración de datos (Fase 2), componentes/render (Fases 3-4), features interactivas (Fases 4-7), mapa Leaflet (Fase 7), suite de verificación de paridad (Fase 8). Aquí solo se monta el esqueleto y se captura el golden.

</domain>

<decisions>
## Implementation Decisions

### Ubicación del proyecto
- **D-01:** El proyecto Nuxt 4 vive en la **raíz del repo** — `srcDir = app/`, con `nuxt.config.ts`, `content/`, `public/`, `server/`, `shared/` y `package.json` en la raíz (encaja con lo que asumió la investigación en ARCHITECTURE.md).
- **D-02:** `index.html` **permanece intacto en la raíz** durante toda la migración como fuente del golden y referencia de paridad viva. No se mueve (referencia `favicon.svg`/`apple-touch-icon.svg`, también en raíz). Su destino (archivar o eliminar) se decide en la Fase 8, tras verificar la paridad.

### Gestor de paquetes
- **D-03:** **pnpm** (`pnpm-lock.yaml`). Scripts del proyecto y cualquier CI futuro usan pnpm.

### Alcance del golden (PARITY-01)
- **D-04:** Alcance **representativo amplio**. Capturas de: (1) home/inicio; (2) las **5 secciones de día** (viernes, sabado, domingo, lunes, martes); (3) **una ficha de cada tipo**: `card` (monumento), `guided` (Vaticano/Coliseo) y `concert` (Auditorium); (4) las **5 secciones de referencia** (reservas, gastronomia, practica, arte, arquitectura). Cada una en **tema claro Y oscuro**, y en **viewport móvil (~390px) y desktop (~1280px)**. NO capturar las ~37 fichas una a una (golden pesado y ruidoso); el set representativo es suficiente.
- **D-05:** El golden se captura **sirviendo el `index.html` actual en local** (servidor estático) con **Playwright**, en la rama `release/nuxt-4` (cuyo `index.html` es **idéntico a `origin/main`**, verificado), **antes de que el código Nuxt diverja**. Las imágenes golden se versionan en el repo (carpeta de tests; la ruta exacta la fija el planner).

### Deploy / preview
- **D-06:** En la Fase 1 **NO** se monta CI ni deploy real. Se **verifica el build estático en local** (`nuxt preview` o equivalente, servido bajo el base path `/guiaRoma/`) para confirmar BUILD-01/03 sin 404 de `/_nuxt/*`. El CI/deploy de la rama release se montará en una **fase posterior**. **El deploy vivo de `main` no se toca.**

### Claude's Discretion
- Organización exacta del CSS al extraerlo (p. ej. `assets/css/tokens.css` + `base.css` + `leaflet.css` vs un `global.css` único) — lo esencial: **reglas verbatim**, cargado **una sola vez** como global desde `nuxt.config.ts`. La investigación sugiere separar tokens/base/leaflet.
- Versiones exactas de dependencias — usar las **verificadas en STACK.md**.
- Ruta/estructura de los tests Playwright y nombres de snapshots; device exacto para los viewports (p. ej. iPhone 12 / 1280×800).
- Configuración fina de `@nuxt/fonts` para las 3 familias (Cormorant Garamond **incl. itálicas**, Lora, JetBrains Mono) — confirmar en research/plan.
- Contenido del placeholder del backend dormido (`server/api/README.md`).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Investigación del proyecto (decisiones de stack ya tomadas — leer ANTES de planificar)
- `.planning/research/STACK.md` — stack decidido con versiones verificadas (Nuxt 4, `@nuxtjs/color-mode` con `dataValue:'theme'`+`storageKey:'roma-theme'`, Leaflet 1.9.4 crudo, MiniSearch, `@nuxt/fonts`, preset `github_pages`, CSS a mano conservado). Base de toda la Fase 1.
- `.planning/research/ARCHITECTURE.md` — estructura de directorios Nuxt 4 (`srcDir=app/`, `server/`/`content/`/`public/` en raíz), backend Nitro dormido sin activar SSR.
- `.planning/research/PITFALLS.md` — trampas directas de la Fase 1: subpath `/guiaRoma/` (`NUXT_APP_BASE_URL`/`app.baseURL`, `public/.nojekyll`, 404 de `/_nuxt/*`, history routing no hash), CSS global sin regresiones, self-host de fuentes/Leaflet, y capturar el golden ANTES de divergir.
- `.planning/research/SUMMARY.md` — síntesis + BUILD ORDER.
- `.planning/research/FEATURES.md` — mapeo de features (relevante en fases posteriores; contexto).

### Planificación
- `.planning/PROJECT.md` — visión, listón de paridad, constraints, Key Decisions.
- `.planning/REQUIREMENTS.md` — requisitos de la Fase 1: PLAT-01..05, ARCH-03, BUILD-01..03, PARITY-01.
- `.planning/ROADMAP.md` §Phase 1 — objetivo y success criteria.

### Código actual (fuente de verdad / golden)
- `index.html` — la guía actual; **fuente del golden y referencia de paridad**. Mapa de líneas: CSS 14-2210 (Leaflet CSS inline 14-864), librería SVG 2211-2253, body/secciones 2255-6242, array `places` 6269-6314, JS de app 6251-6663. Secciones: inicio 2283, mapa 2361, viernes 2375, sabado 2840, domingo 3445, lunes 4002, martes 4736, reservas 5260, gastronomia 5335, practica 5825, arte 5941, arquitectura 6104.
- `favicon.svg`, `apple-touch-icon.svg` — assets de raíz referenciados por `index.html` (no mover; D-02).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CSS de `index.html` (~2.200 líneas, líneas 14-2210)** — ya usa custom properties en `:root` y `[data-theme]`; **ES** el sistema de design tokens. Se extrae **verbatim** a CSS global (PLAT-04). El bloque Leaflet CSS inline (14-864) puede aislarse en su propio archivo.
- **3 familias de Google Fonts** (link en línea 13: Cormorant Garamond, Lora, JetBrains Mono) — se **self-hostean** con `@nuxt/fonts` (BUILD-02). Vigilar que cubra las itálicas de Cormorant.
- **Array `places` (6269-6314)** y **JS de app (6251-6663)** — NO se tocan en la Fase 1; son insumo de fases posteriores (datos/features). Solo referencia.

### Established Patterns
- **Tema vía `[data-theme]` en `<html>`** + `localStorage('roma-theme')` + `prefers-color-scheme` → encaja directo con `@nuxtjs/color-mode` (`dataValue:'theme'`, `storageKey:'roma-theme'`). El tema en sí es FEAT-01 (Fase 3), pero el andamiaje del módulo se prepara aquí.
- **Claves localStorage existentes** (`roma-theme`, `roma-pace`, `roma-light`, `roma-resumen`, `roma-note-*`) — se preservarán literalmente en fases posteriores.

### Integration Points
- `nuxt.config.ts`: CSS global, módulos (`@nuxtjs/color-mode`, `@nuxt/fonts`, `@nuxt/eslint`), `app.baseURL='/guiaRoma/'`, Nitro `preset: 'github_pages'`, prerender (SSR-en-build ON, **sin** `ssr:false`).
- `public/.nojekyll` para que GitHub Pages sirva `/_nuxt/*`.
- `server/` vacío con `server/api/README.md` (backend Nitro dormido — ARCH-03).
- Tests Playwright (carpeta a definir) que sirven `index.html` y guardan los snapshots golden.

</code_context>

<specifics>
## Specific Ideas

- **Base path exacto:** `/guiaRoma/` (el repo es `psl11/guiaRoma`; GitHub Pages servirá bajo ese subpath).
- **Viewports del golden:** móvil ~390px y desktop ~1280px, tema claro y oscuro.
- **Baseline verificado:** el `index.html` de `release/nuxt-4` es **idéntico** a `origin/main` (PR #7 ya mergeado) → el golden representa la versión viva **con** la "ruta del día" y las cenas.
- **Generación estática:** `nuxt generate` (prerender), manteniendo SSR-en-build para no romper paridad. Routing **history**, no hash (la app usa anclas `#id` internas).
- **`main` intacto:** todo el trabajo en `release/nuxt-4`; no tocar el deploy ni el contenido de `main`.

</specifics>

<deferred>
## Deferred Ideas

None — la discusión se mantuvo dentro del alcance de la Fase 1.

(Los diferidos de producto — backend/auth/uploads, PWA, segundo viaje real — ya están registrados en `.planning/STATE.md` ▸ Deferred Items y en `REQUIREMENTS.md` ▸ v2. El CI/deploy real se difiere a una fase posterior por D-06.)

</deferred>

---

*Phase: 1-Andamiaje + Golden de paridad*
*Context gathered: 2026-06-18*
