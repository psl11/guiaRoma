# Phase 1: Andamiaje + Golden de paridad - Research

**Researched:** 2026-06-18
**Domain:** Andamiaje de proyecto Nuxt 4 (SSG bajo subpath) + captura de golden de paridad con Playwright
**Confidence:** HIGH

> Esta investigación **sintetiza** el corpus de proyecto ya existente (`.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md`, `SUMMARY.md`) y las decisiones prescriptivas de `CLAUDE.md` en **guía ejecutable y específica de la Fase 1**: comandos exactos, forma del `nuxt.config.ts`, layout de ficheros, orden de ejecución y verificación objetiva. **No re-litiga decisiones de stack** — esas están cerradas con HIGH confidence. Donde un dato proviene del corpus, se cita; donde se verificó de nuevo en esta sesión (registro npm, docs oficiales, lectura del `index.html`), se etiqueta.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Ubicación del proyecto**
- **D-01:** El proyecto Nuxt 4 vive en la **raíz del repo** — `srcDir = app/`, con `nuxt.config.ts`, `content/`, `public/`, `server/`, `shared/` y `package.json` en la raíz.
- **D-02:** `index.html` **permanece intacto en la raíz** durante toda la migración como fuente del golden y referencia de paridad viva. No se mueve (referencia `favicon.svg`/`apple-touch-icon.svg`, también en raíz). Su destino se decide en la Fase 8.

**Gestor de paquetes**
- **D-03:** **pnpm** (`pnpm-lock.yaml`). Scripts del proyecto y cualquier CI futuro usan pnpm.

**Alcance del golden (PARITY-01)**
- **D-04:** Alcance **representativo amplio**. Capturas de: (1) home/inicio; (2) las **5 secciones de día** (viernes, sabado, domingo, lunes, martes); (3) **una ficha de cada tipo**: `card` (monumento), `guided` (Vaticano/Coliseo) y `concert` (Auditorium); (4) las **5 secciones de referencia** (reservas, gastronomia, practica, arte, arquitectura). Cada una en **tema claro Y oscuro**, y en **viewport móvil (~390px) y desktop (~1280px)**. NO capturar las ~37 fichas una a una.
- **D-05:** El golden se captura **sirviendo el `index.html` actual en local** (servidor estático) con **Playwright**, en la rama `release/nuxt-4` (cuyo `index.html` es **idéntico a `origin/main`**, verificado), **antes de que el código Nuxt diverja**. Las imágenes golden se versionan en el repo.

**Deploy / preview**
- **D-06:** En la Fase 1 **NO** se monta CI ni deploy real. Se **verifica el build estático en local** servido bajo el base path `/guiaRoma/` para confirmar BUILD-01/03 sin 404 de `/_nuxt/*`. **El deploy vivo de `main` no se toca.**

### Claude's Discretion
- Organización exacta del CSS al extraerlo (`tokens.css` + `base.css` + `leaflet.css` vs un `global.css` único) — lo esencial: **reglas verbatim**, cargado **una sola vez** como global desde `nuxt.config.ts`. La investigación sugiere separar tokens/base/leaflet.
- Versiones exactas de dependencias — usar las **verificadas en STACK.md**.
- Ruta/estructura de los tests Playwright y nombres de snapshots; device exacto para los viewports (p. ej. iPhone 12 / 1280×800).
- Configuración fina de `@nuxt/fonts` para las 3 familias (Cormorant Garamond **incl. itálicas**, Lora, JetBrains Mono).
- Contenido del placeholder del backend dormido (`server/api/README.md`).

### Deferred Ideas (OUT OF SCOPE)
None — la discusión se mantuvo dentro del alcance de la Fase 1. (CI/deploy real diferido a fase posterior por D-06; backend activo/PWA/segundo viaje ya en v2 según STATE.md.)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Descripción | Soporte de research |
|----|-------------|---------------------|
| **PLAT-01** | El proyecto Nuxt 4 arranca (`nuxt dev`) y compila a estático (`nuxt generate`) sin errores | §Standard Stack (scaffold), §Architecture Patterns (nuxt.config), §Validation Architecture (V1) |
| **PLAT-02** | TypeScript en modo estricto en todo el proyecto | §Tooling (`tsconfig`/`typescript.typeCheck`), §Validation (V2) |
| **PLAT-03** | ESLint + Prettier (`@nuxt/eslint`) configurados y el comando de lint pasa limpio | §Tooling (flat config + Prettier), §Validation (V3) |
| **PLAT-04** | El CSS editorial actual se conserva como CSS global, sin reescribirlo a otro framework | §CSS Extraction Strategy, §Validation (V4) |
| **PLAT-05** | Estructura de carpetas Nuxt 4 establecida (`app/`, `content/`, `public/`, `server/`, `shared/`, `nuxt.config.ts`) | §Recommended Project Structure |
| **ARCH-03** | Directorio Nitro `server/` presente pero dormido; el sitio se sigue generando estático | §Dormant Nitro Backend, §Validation (V7) |
| **BUILD-01** | `nuxt generate` produce un sitio estático desplegable en GitHub Pages bajo subpath `/guiaRoma/` (baseURL + `.nojekyll`), con assets resolviendo | §Base-Path Correctness, §Validation (V5) |
| **BUILD-02** | Offline conservado: Leaflet self-hosteado (no CDN) y fuentes self-hosteadas (`@nuxt/fonts`); imágenes remotas degradan a fallback SVG | §Self-Hosting, §Validation (V6) |
| **BUILD-03** | La app funciona servida desde el subpath de producción de forma equivalente a la actual | §Base-Path Correctness, §Validation (V5) |
| **PARITY-01** | Golden de Playwright capturado desde la versión actual ANTES de divergir | §Playwright Golden Capture, §Validation (V8) |

> **Matiz de alcance Fase 1:** PLAT-04/BUILD-02 se cumplen aquí montando la *infraestructura* (CSS global cargado, fuentes/Leaflet self-hosteados) sobre un esqueleto mínimo. El **render de fichas, el componente de mapa y los modos interactivos NO entran en esta fase** (Fases 3-7). Lo que se prueba en la Fase 1 es que el andamiaje compila, sirve bajo subpath sin 404, self-hostea los assets, y que el golden queda capturado.
</phase_requirements>

---

## Summary

La Fase 1 es **andamiaje + captura de golden**, no trabajo de features. El stack está 100% decidido y re-verificado contra el registro npm hoy (2026-06-18): todas las versiones de `STACK.md` siguen siendo las `latest` publicadas `[VERIFIED: npm registry, 2026-06-18]`. El trabajo se reduce a cinco bloques de infraestructura más una captura: (1) inicializar un proyecto Nuxt 4 en la **raíz** del repo con `srcDir=app/` y pnpm, sin tocar `index.html`; (2) extraer el CSS editorial (~2.200 líneas) **verbatim** a `app/assets/css/` y cargarlo una sola vez vía `nuxt.config.ts`; (3) configurar el subpath de producción (`app.baseURL='/guiaRoma/'` + preset `github_pages` + `public/.nojekyll`) y verificar localmente que no hay 404 de `/_nuxt/*`; (4) self-hostear las tres fuentes con `@nuxt/fonts` y dejar Leaflet listo para importarse desde `node_modules` (el componente de mapa es Fase 7); (5) dejar `server/` presente pero dormido (solo `server/api/README.md`); y (6) capturar el golden Playwright del `index.html` actual **antes de divergir**.

La secuencia crítica e innegociable: **capturar el golden ANTES de que el árbol de trabajo Nuxt diverja del `index.html` vivo**. Por D-02 el `index.html` permanece intacto en la raíz durante toda la migración, así que el golden puede servirse desde el propio fichero in situ; aun así, la captura del golden debe ser el **primer entregable verificado** de la fase (red de seguridad de toda la paridad posterior, Fase 8). El segundo riesgo estructural es el subpath: sin `baseURL` + `.nojekyll`, los assets de `/_nuxt/` dan 404 en masa cuando GitHub Pages sirve bajo `/guiaRoma/`.

El golden tiene **fuentes de inestabilidad reales** identificadas por lectura directa del `index.html`: `scroll-behavior: smooth`, un `@keyframes fadeIn` aplicado a cada `.card` (`animation: fadeIn .5s ease backwards`), múltiples `transition:` de tema (`.4s ease`), las **imágenes hero de terceros (Wikimedia/turismoroma) con fallback `onerror`** (red → flaky), y las fuentes de Google que cargan por red. La captura debe neutralizar todo esto (animaciones desactivadas, esperar settle de fuentes/red, decidir explícitamente cómo tratar las heros remotas).

**Primary recommendation:** Capturar el golden como **primer paso verificado** (sirviendo `index.html` con un static server + Playwright, animaciones desactivadas, tema forzado vía `localStorage['roma-theme']`), y solo después montar el scaffold Nuxt 4 (raíz, pnpm, `srcDir=app/`), el CSS verbatim, el subpath (`baseURL` + `.nojekyll` + preset), el self-host de fuentes/Leaflet y el `server/` dormido — verificando el build estático localmente bajo `/guiaRoma/`.

---

## Architectural Responsibility Map

| Capability (Fase 1) | Primary Tier | Secondary Tier | Rationale |
|---------------------|-------------|----------------|-----------|
| Scaffold del proyecto + config | Build/Tooling (Nuxt/Nitro config) | — | `nuxt.config.ts` + `package.json` en raíz orquestan todo; no es código de runtime |
| CSS editorial global (tokens/base/leaflet) | CDN / Static (assets servidos como `/_nuxt/`) | Browser (cascada aplicada en cliente) | Hojas globales cargadas una vez; el navegador aplica `[data-theme]`/cascada |
| Subpath `/guiaRoma/` (baseURL, .nojekyll) | Build (prerender) + CDN/Static (GitHub Pages) | — | `baseURL` reescribe rutas de assets en build; `.nojekyll` evita que Jekyll filtre `_nuxt/` |
| Self-host de fuentes (`@nuxt/fonts`) | Build (descarga+emisión en build) → CDN/Static | — | Fuentes descargadas en build y servidas locales; cero red en runtime |
| Leaflet self-host (preparado) | Build (bundle Vite) → CDN/Static | Browser (Fase 7: `onMounted`) | En Fase 1 solo se asegura que se importará de `node_modules`, no de CDN |
| Backend Nitro dormido | API/Backend (presente, **inerte**) | — | `server/` existe como hueco v2; sin endpoints → sin runtime en SSG |
| Golden de paridad | Tooling/Test (Playwright) | Browser (renderiza `index.html`) | Captura de oráculo visual; no toca el runtime de la app Nuxt |

> En la Fase 1 **no hay capacidades de la capa de página ni de componentes** (eso es Fase 2+). La fase es deliberadamente de infraestructura: build, assets estáticos, y herramientas de test.

---

## Standard Stack

> **Todo el stack está decidido en `CLAUDE.md`/`STACK.md` con HIGH confidence.** Versiones re-verificadas contra el registro npm hoy `[VERIFIED: npm registry, 2026-06-18]`. La tabla siguiente lista **solo lo que la Fase 1 instala/usa** — un subconjunto del stack global (Content/zod/color-mode/MiniSearch se instalan pero su *uso* es de fases posteriores; se marcan como "preparado").

### Core (instalado y usado en Fase 1)

| Library | Versión | Propósito en Fase 1 | Verificación |
|---------|---------|---------------------|--------------|
| **nuxt** | **4.4.8** | Framework; scaffold raíz con `srcDir=app/`, `nuxi`, `generate`, prerender, preset Nitro | `[VERIFIED: npm registry, 2026-06-18]` (latest = 4.4.8) |
| **@nuxt/fonts** | **0.14.0** | Self-host de Cormorant Garamond / Lora / JetBrains Mono (BUILD-02 offline) | `[VERIFIED: npm registry, 2026-06-18]` |
| **@nuxt/eslint** | **1.16.0** | Flat config ESLint consciente de Nuxt + integración Prettier (PLAT-03) | `[VERIFIED: npm registry, 2026-06-18]` |
| **eslint** | **10.5.0** | Motor de lint (peer de `@nuxt/eslint`); flat config (`eslint.config.mjs`) | `[VERIFIED: npm registry, 2026-06-18]` |
| **@playwright/test** | **1.61.0** | Captura del golden de paridad (PARITY-01) | `[VERIFIED: npm registry, 2026-06-18]` (latest = 1.61.0) |
| **typescript** | **5.9.x** (transitiva de Nuxt 4) | Modo estricto (PLAT-02); `nuxi typecheck`/`vue-tsc` | `[CITED: STACK.md]` (la gestiona Nuxt) |

### Preparado en Fase 1 (instalado, pero su uso es de fases posteriores)

| Library | Versión | Por qué se instala ahora | Uso real |
|---------|---------|--------------------------|----------|
| **@nuxt/content** | **3.14.0** | Módulo registrado en `nuxt.config.ts`; `content/` resuelto desde raíz | Esquema/contenido en Fase 2 |
| **zod** | **4.4.3** | Peer del esquema de Content | Esquema en Fase 2. **Importar `z` desde `zod`, NO desde `@nuxt/content`** (re-export deprecado) |
| **@nuxtjs/color-mode** | **4.0.1** | Módulo registrado con `dataValue:'theme'`/`storageKey:'roma-theme'` | Tema (FEAT-01) en Fase 3 |
| **leaflet** | **1.9.4** | Dependencia presente para self-host desde `node_modules` | Componente mapa en Fase 7 |
| **@types/leaflet** | **1.9.21** (dev) | Tipado de Leaflet | Fase 7 | `[VERIFIED: npm registry, 2026-06-18]` |
| **minisearch** | **7.2.0** | Dependencia de búsqueda | Fase 6 |

> **Decisión de scope:** instalar el stack completo en Fase 1 (no solo el subconjunto "usado") es lo recomendado — registrar los módulos en `nuxt.config.ts` desde el inicio fija la base y evita reconfiguraciones. Pero **no escribir código que los use** (sin `content.config.ts` real, sin componente de mapa, sin esquema). `[ASSUMED]` — el planner puede optar por instalar perezosamente por fase; ambas vías son válidas, esta minimiza churn de config.

### Supporting / Dev Tools

| Tool | Versión | Propósito | Notas |
|------|---------|-----------|-------|
| **prettier** | **3.8.4** | Formateo, integrado vía `@nuxt/eslint` `config.stylistic` o como Prettier separado | Ver §Tooling: elegir UNA vía, no mezclar reglas de formato |
| **@nuxt/test-utils** + **vitest** | 4.0.3 / 4.1.9 | **NO en Fase 1.** Tests unitarios de lógica pura llegan en Fases 4-6 | `[CITED: STACK.md]` — Fase 1 solo usa Playwright para el golden |

**Alternatives Considered (ya cerradas en STACK.md — no re-litigar):**

| En vez de | Se rechazó | Razón (resumen) |
|-----------|-----------|-----------------|
| `@nuxt/fonts` self-host | Dejar `<link>` a Google Fonts | Rompe offline (objetivo: usar paseando con red pobre) |
| CSS a mano verbatim | Tailwind / UnoCSS | Reescribir 2.200 líneas = máxima superficie de regresión visual |
| Static server + Playwright para golden | Wrapper Vue de Leaflet, `@nuxt/image` heros | Fuera de alcance Fase 1; ver `STACK.md §4`/§6 |

### Installation (pnpm — D-03)

```bash
# 1) Scaffold Nuxt 4 EN LA RAÍZ del repo (sin sobrescribir index.html / favicon.svg / apple-touch-icon.svg / CLAUDE.md / .planning)
#    nuxi init crea en un subdirectorio por defecto; para inicializar en una raíz NO vacía, ver §Pitfall "scaffold en raíz no vacía".
pnpm dlx nuxi@latest init . --packageManager pnpm --gitInit false

# 2) Módulos (registrados en nuxt.config.ts; uso real en fases posteriores salvo fonts/eslint)
pnpm add @nuxt/content@3.14.0 zod@4.4.3 @nuxtjs/color-mode@4.0.1 @nuxt/fonts@0.14.0 minisearch@7.2.0 leaflet@1.9.4

# 3) Tooling
pnpm dlx nuxi module add eslint        # instala y configura @nuxt/eslint + eslint (flat config)
pnpm add -D @types/leaflet @playwright/test prettier
pnpm dlx playwright install chromium    # navegador para el golden (chromium basta para visual-diff determinista)
```

> **Verificación de versiones (hecha en esta sesión):** `npm view <pkg> version` para los 12 paquetes de Fase 1 → todos coinciden con STACK.md y son la `latest` publicada al 2026-06-18. Ver §Package Legitimacy Audit.

> **`nuxi init .` en raíz no vacía:** `nuxi init` espera un directorio destino vacío. Como la raíz ya contiene `index.html`, `favicon.svg`, `apple-touch-icon.svg`, `CLAUDE.md`, `.git/` y `.planning/`, hay dos vías seguras (ver §Common Pitfalls, Pitfall 1): **(A)** scaffold en un temporal y mover los ficheros generados a la raíz, o **(B)** crear los ficheros del scaffold a mano (es un set pequeño: `package.json`, `nuxt.config.ts`, `app/app.vue`, `tsconfig.json`, `.gitignore`). `[ASSUMED]` — verificar el comportamiento exacto de `nuxi init .` al planificar; vía (A) o (B) son robustas independientemente.

---

## Package Legitimacy Audit

> Phase-1 instala paquetes externos. slopcheck **no estaba disponible** en el entorno (`pip install slopcheck` falló). Mitigación aplicada: cada paquete se re-verificó vía `npm view <pkg> version` hoy (2026-06-18) **y** todos provienen de fuentes autoritativas — son paquetes oficiales de la org Nuxt (`@nuxt/*`, `@nuxtjs/*`, `nuxt`) o librerías de primera línea con años de historia y millones de descargas (`leaflet`, `zod`, `minisearch`, `eslint`, `prettier`, `@playwright/test`), citadas desde docs oficiales/Context7 en STACK.md.

| Package | Registry | Verificación (esta sesión) | Origen autoritativo | slopcheck | Disposition |
|---------|----------|----------------------------|---------------------|-----------|-------------|
| nuxt | npm | `npm view` → 4.4.8 ✓ | Org oficial Nuxt; Context7 `/websites/nuxt_4_x` | n/a (no disponible) | Aprobado |
| @nuxt/content | npm | `npm view` → 3.14.0 ✓ | Org oficial Nuxt; docs content.nuxt.com | n/a | Aprobado |
| @nuxtjs/color-mode | npm | `npm view` → 4.0.1 ✓ | nuxt-modules (oficial); docs | n/a | Aprobado |
| @nuxt/fonts | npm | `npm view` → 0.14.0 ✓ | Org oficial Nuxt; fonts.nuxt.com | n/a | Aprobado |
| @nuxt/eslint | npm | `npm view` → 1.16.0 ✓ | Org oficial Nuxt; eslint.nuxt.com | n/a | Aprobado |
| eslint | npm | `npm view` → 10.5.0 ✓ | Proyecto ESLint oficial | n/a | Aprobado |
| prettier | npm | `npm view` → 3.8.4 ✓ | Proyecto Prettier oficial | n/a | Aprobado |
| leaflet | npm | `npm view` → 1.9.4 ✓ | Leaflet oficial (años, millones dl) | n/a | Aprobado |
| @types/leaflet | npm | `npm view` → 1.9.21 ✓ | DefinitelyTyped | n/a | Aprobado |
| @playwright/test | npm | `npm view` → 1.61.0 ✓ | Microsoft/Playwright oficial | n/a | Aprobado |
| minisearch | npm | `npm view` → 7.2.0 ✓ | lucaong/minisearch (estable) | n/a | Aprobado |
| zod | npm | `npm view` → 4.4.3 ✓ | colinhacks/zod oficial | n/a | Aprobado |

**Packages removed due to slopcheck [SLOP] verdict:** none (slopcheck no disponible).
**Packages flagged as suspicious [SUS]:** none.

> **Nota para el planner:** Como slopcheck no corrió, la convención GSD es tratar lo no verificado-por-herramienta como `[ASSUMED]` y poner un `checkpoint:human-verify` antes de instalar. **Atenuante fuerte aquí:** los 12 son paquetes oficiales de la org Nuxt o librerías canónicas, re-confirmados por `npm view` hoy, y ya validados en STACK.md vía docs oficiales/Context7. El riesgo de slopsquatting es mínimo. Recomendación: un **único** `checkpoint:human-verify` ligero confirmando la lista (no 12 checkpoints separados).

---

## Architecture Patterns

### System Architecture Diagram (Fase 1 — flujo de build y de captura)

```
                       ┌─────────────────────────────────────────────┐
                       │  REPO (rama release/nuxt-4)                  │
                       │  index.html (INTACTO, D-02)  favicon.svg      │
                       │  apple-touch-icon.svg                         │
                       └───────────────┬───────────────┬──────────────┘
                                       │               │
        ┌──────────────────────────────┘               └───────────────────────────┐
        ▼  (A) CAPTURA DE GOLDEN — PRIMERO                  (B) SCAFFOLD NUXT 4      ▼
┌───────────────────────────────────┐            ┌──────────────────────────────────────────┐
│ static server  →  http://localhost │            │  package.json (pnpm)  nuxt.config.ts       │
│   sirve index.html in situ          │            │  app/  app.vue  assets/css/{tokens,base,    │
│        │                            │            │        leaflet}.css                         │
│  Playwright (chromium)              │            │  content/ (vacío)  server/api/README.md     │
│   · viewport móvil ~390 + desktop   │            │  shared/  public/.nojekyll                  │
│     ~1280                           │            │        │                                    │
│   · tema claro: load directo        │            │  módulos: content · color-mode · fonts ·    │
│   · tema oscuro: addInitScript      │            │           eslint                            │
│     localStorage['roma-theme']=dark │            │        │                                    │
│   · animations:'disabled'           │            │        ▼                                    │
│   · esperar fuentes + red settle    │            │  nuxt generate                              │
│        │                            │            │   (SSR-en-build ON, preset github_pages,    │
│        ▼                            │            │    baseURL=/guiaRoma/, prerender / )        │
│  golden PNGs versionados en repo    │            │        │                                    │
│  (tests/.../__screenshots__)        │            │        ▼  .output/public/                   │
└───────────────────────────────────┘            │  servir bajo /guiaRoma/ en local            │
                                                   │   → 0 errores 404 de /_nuxt/*               │
                                                   │   → fuentes/Leaflet self-hosted (sin CDN)   │
                                                   │   → .nojekyll presente                      │
                                                   └──────────────────────────────────────────┘

ORDEN: (A) DEBE completarse y versionarse ANTES de que (B) introduzca cualquier
divergencia. index.html queda intacto (D-02), pero el golden es el primer entregable.
```

### Recommended Project Structure (entregable de la Fase 1)

```
guiaRoma/                              # RAÍZ del repo (rama release/nuxt-4)
├── index.html                         # INTACTO (D-02) — fuente del golden
├── favicon.svg  apple-touch-icon.svg  # INTACTOS (D-02)
├── CLAUDE.md  .planning/  .git/        # ya presentes
├── app/                               # srcDir de Nuxt 4 (default)
│   ├── app.vue                        # mínimo: <NuxtLayout><NuxtPage/></NuxtLayout> (o <div>Hola</div> placeholder)
│   └── assets/
│       └── css/
│           ├── tokens.css             # :root + [data-theme="dark"] VERBATIM (tokens actuales)
│           ├── base.css               # reset, tipografía, layout global VERBATIM
│           └── leaflet.css            # CSS de Leaflet (líneas 14-864 del index.html) + filtro dark de tiles
├── content/                           # RAÍZ (Content lo resuelve desde rootDir) — VACÍO en Fase 1
├── server/                            # RAÍZ — BACKEND DORMIDO (ARCH-03)
│   └── api/
│       └── README.md                  # único contenido (hueco v2 documentado)
├── shared/                            # RAÍZ — vacío o tipos mínimos (Fase 1: puede no existir aún)
├── public/
│   ├── .nojekyll                      # cinturón-y-tirantes para GitHub Pages (_nuxt/)
│   └── (favicon/apple-touch se quedan en raíz por D-02; ver §Pitfall favicon)
├── tests/                             # tests Playwright (ruta exacta = discreción del planner)
│   ├── parity/golden.spec.ts          # captura del golden del index.html
│   └── parity/__screenshots__/        # PNGs golden versionados (toHaveScreenshot)
├── content.config.ts                  # presente vacío/mínimo (esquema real = Fase 2)
├── nuxt.config.ts                     # módulos, colorMode, nitro/prerender, css, app.baseURL
├── eslint.config.mjs                  # flat config (@nuxt/eslint)
├── playwright.config.ts               # proyectos móvil/desktop, webServer estático
├── tsconfig.json                      # extiende .nuxt/tsconfig (strict)
├── package.json                       # scripts pnpm
└── pnpm-lock.yaml
```

> **Diferencia con `ARCHITECTURE.md`:** aquél muestra la estructura *final* (componentes, composables, colecciones). En Fase 1 **solo existe el esqueleto**: `app/app.vue` + `assets/css/`, módulos registrados, `server/api/README.md`, `public/.nojekyll`, y los tests del golden. Los directorios `components/`, `composables/`, `pages/`, `layouts/`, `utils/` y las colecciones reales llegan en fases posteriores.

### Pattern 1: `nuxt.config.ts` prescriptivo de la Fase 1

```ts
// nuxt.config.ts — Fase 1 (subpath + CSS global + módulos registrados; SSR-en-build ON)
// Source: STACK.md §3/§8 + CLAUDE.md + docs Nuxt 4 (verificadas esta sesión)
export default defineNuxtConfig({
  // compatibilityVersion 4 es el DEFAULT en Nuxt 4 — NO hace falta future.compatibilityVersion.
  // [VERIFIED: nuxt.com/docs/4.x/getting-started/upgrade, 2026-06-18]

  modules: ['@nuxt/content', '@nuxtjs/color-mode', '@nuxt/fonts', '@nuxt/eslint'],

  // --- Subpath de producción (BUILD-01/03) ---
  // baseURL puede fijarse aquí o por env NUXT_APP_BASE_URL=/guiaRoma/ en build.
  // Recomendado en Fase 1: fijarlo en config para que `generate` local ya lo aplique sin env.
  app: {
    baseURL: '/guiaRoma/',
  },

  nitro: {
    preset: 'github_pages',     // variante static de Pages; añade piezas de Pages (incl. .nojekyll)
    prerender: {
      crawlLinks: true,
      routes: ['/'],            // una sola ruta en Fase 1 (placeholder)
      failOnError: true,        // un enlace roto ROMPE el build (parity guard)
      // autoSubfolderIndex: true es el default
    },
  },

  // --- CSS editorial VERBATIM, cargado UNA sola vez (PLAT-04) ---
  css: [
    '~/assets/css/tokens.css',
    '~/assets/css/base.css',
    '~/assets/css/leaflet.css',
  ],

  // --- Self-host de las 3 familias (BUILD-02 offline) ---
  // Auto-detección por font-family del CSS + declaración explícita de pesos/itálicas.
  fonts: {
    families: [
      { name: 'Cormorant Garamond', provider: 'google',
        weights: [400, 500, 600, 700], styles: ['normal', 'italic'], subsets: ['latin', 'latin-ext'] },
      { name: 'Lora', provider: 'google',
        weights: [400, 500, 600], styles: ['normal', 'italic'], subsets: ['latin', 'latin-ext'] },
      { name: 'JetBrains Mono', provider: 'google',
        weights: [400, 500], styles: ['normal'], subsets: ['latin', 'latin-ext'] },
    ],
  },
  // [VERIFIED: fonts.nuxt.com/get-started/configuration, 2026-06-18 — keys: families[].{name,provider,weights,styles,subsets}]

  // --- Tema: preparado para Fase 3, config exacta de STACK.md §8 ---
  // (registrar el módulo ya en Fase 1; el ThemeToggle/uso es Fase 3)
  colorMode: {
    preference: 'system',
    fallback: 'light',          // index.html arranca <html data-theme="light">
    dataValue: 'theme',         // => <html data-theme="dark"> (mismo selector del CSS)
    storageKey: 'roma-theme',   // MISMA clave del index.html
    classSuffix: '',
  },

  typescript: {
    strict: true,               // PLAT-02 (Nuxt ya genera tsconfig estricto; reforzar)
    typeCheck: false,           // ver §Tooling: typeCheck en build vs comando separado
  },
})
```

> **Itálicas:** la URL de Google Fonts del `index.html` (línea 13) pide Cormorant Garamond itálicas en 400/500/600 (no 700i) y Lora itálicas 400/500. La config de arriba pide `styles:['normal','italic']` para ambas — `@nuxt/fonts` descargará los pesos×estilos disponibles. **Punto a verificar (V6):** que las itálicas realmente se sirven (Cormorant usa muchas cursivas en la prosa editorial). `[CITED: index.html línea 13 — leída esta sesión]`

### Pattern 2: `playwright.config.ts` para el golden

```ts
// playwright.config.ts — captura del golden del index.html (PARITY-01)
// Source: docs Playwright (verificadas esta sesión) + D-04/D-05
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/parity',
  // Sirve el index.html ESTÁTICO in situ (D-05). Comando = un static server sobre la raíz del repo.
  webServer: {
    command: 'pnpm dlx serve -l 4173 .',   // o `python3 -m http.server 4173` — cualquier static server
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4173',
  },
  // Determinismo de screenshots (ver §Pitfalls golden):
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',     // congela CSS animations/transitions + fadeIn de .card
      caret: 'hide',
      maxDiffPixelRatio: 0.01,    // tolerancia pequeña (antialiasing); ajustar al calibrar
    },
  },
  projects: [
    { name: 'mobile',  use: { ...devices['iPhone 12'] } },        // ~390px (D-04)
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } }, // ~1280px (D-04)
  ],
})
```

> **Storage de snapshots:** por defecto Playwright guarda en `{testfile}-snapshots/{name}-{project}-{platform}.png` `[VERIFIED: playwright.dev/docs/test-snapshots, 2026-06-18]`. Con dos `projects` (mobile/desktop), cada `toHaveScreenshot('inicio-light.png')` produce `inicio-light-mobile-linux.png` y `inicio-light-desktop-linux.png` automáticamente. **Implicación de plataforma:** los golden llevan sufijo `-linux` (o `-darwin`/`-win32`). Como el golden se versiona y se comparará en Fase 8, **capturar y comparar en la misma plataforma/CI**, o fijar `snapshotPathTemplate` sin sufijo de plataforma si el equipo usa SOs distintos. `[ASSUMED]` — el planner decide; lo seguro es documentar la plataforma de captura.

### Pattern 3: Forzar el tema oscuro de forma determinista (golden dark)

El `index.html` aplica el tema leyendo `localStorage['roma-theme']` y, en su defecto, `prefers-color-scheme`; escribe `document.documentElement.setAttribute('data-theme', t)` `[CITED: index.html 6252-6266 — leídas esta sesión]`. Dos vías para el golden oscuro:

```ts
// Vía A (recomendada — determinista, sin clic ni timing):
await page.addInitScript(() => localStorage.setItem('roma-theme', 'dark'))
await page.goto('/index.html')   // el script inline del index.html lee la clave y pinta dark en el primer paint

// Vía B (alternativa): forzar prefers-color-scheme
// test.use({ colorScheme: 'dark' })  // pero index.html prioriza localStorage; A es más fiable
```

> Esto **también valida** el contrato que la app Nuxt usará en Fase 3 (`storageKey:'roma-theme'`, `dataValue:'theme'`): mismo `localStorage` key, mismo atributo `data-theme`. El golden y la futura app comparten el mismo mecanismo de tema → comparables.

### Anti-Patterns to Avoid (específicos de Fase 1)

- **`ssr: false` para "hacerlo estático":** produce un SPA shell sin HTML → rompe paridad. La salida estática se logra con preset `github_pages` + prerender, **SSR-en-build ON**. `[CITED: ARCHITECTURE.md Anti-Pattern 4 / PITFALLS.md]`
- **`<style scoped>` para el CSS editorial:** los atributos `data-v-*` cambian especificidad y rompen selectores cruzados (`body.modo-resumen .tl-meta`, `[data-theme="dark"] .leaflet-tile`). En Fase 1 el CSS va **global**, cargado por `css:[]`. `[CITED: PITFALLS.md Pitfall 4]`
- **Cargar Leaflet/fuentes desde CDN:** rompe el offline. Leaflet se importa de `node_modules` (Fase 7); fuentes vía `@nuxt/fonts`. `[CITED: PITFALLS.md Pitfall 6 / STACK.md]`
- **Rutas absolutas hardcodeadas de assets** (`/img/x.png`, `/favicon.svg` desde raíz del dominio): bajo `/guiaRoma/` dan 404. Usar imports/`~/assets` o `useRuntimeConfig().app.baseURL`. `[CITED: PITFALLS.md Pitfall 5]`
- **Capturar el golden DESPUÉS de empezar a migrar:** el oráculo se contamina. Capturar primero (aunque `index.html` quede intacto por D-02, el golden es el primer entregable verificado). `[CITED: PITFALLS.md Pitfall 11]`
- **Sobre-componentizar / activar Nitro / añadir PWA en Fase 1:** scope creep. `server/` queda dormido, sin endpoints. `[CITED: PITFALLS.md Pitfall 10]`

---

## CSS Extraction Strategy (PLAT-04)

**Objetivo:** trasvasar las ~2.200 líneas de CSS del `index.html` **verbatim** a CSS global, cargado una sola vez. Las custom properties (`:root` / `[data-theme="dark"]`) YA son el sistema de tokens; copiarlas literal = paridad por construcción. `[CITED: STACK.md §5 / PITFALLS.md Pitfall 4]`

### Mapa de líneas del `index.html` (verificado esta sesión)

| Bloque | Líneas en `index.html` | Destino sugerido |
|--------|------------------------|------------------|
| **Leaflet CSS inline** (`<style id="leaflet-inline-css">`) | **14-864** | `app/assets/css/leaflet.css` |
| **CSS editorial del proyecto** (`<style>` siguiente: tokens `:root`/`[data-theme]`, reset, tipografía, `.card`, `.timeline`, `.gastro-card`, etc.) | **~865-2210** | `tokens.css` (el bloque `:root`+`[data-theme="dark"]`) + `base.css` (todo lo demás) |
| Librería SVG (motifs) | 2211-2253 | **NO es CSS** — es JS/SVG; entra en Fase 7 (`utils/svg-motifs.ts`), no en Fase 1 |

`[CITED: index.html — `<style id="leaflet-inline-css">` en línea 14; segundo `<style>` y fin de CSS ~2210; leídas esta sesión]`

### Cómo partir (discreción del planner — D-04 lo permite)

Recomendación de STACK.md/ARCHITECTURE.md: **tres ficheros**:
1. **`tokens.css`** — el bloque `:root { … }` + `[data-theme="dark"] { … }` **verbatim**. Es el contrato de diseño.
2. **`base.css`** — reset, tipografía (`html`, `body`, `h1`…), todas las reglas de componentes globales **verbatim**.
3. **`leaflet.css`** — el CSS de Leaflet (14-864) + la regla del filtro dark de tiles (`[data-theme="dark"] .leaflet-tile { filter: … }`, que en el `index.html` vive en el bloque del proyecto, no en el de Leaflet — **moverla aquí o dejarla en base.css es indiferente**, lo importante es que se cargue).

Cargar los tres en `nuxt.config.ts` `css: [...]` en ese orden (tokens → base → leaflet).

### Riesgos de orden / `@layer` que pueden romper paridad verbatim

- **Orden de carga:** el array `css:[]` define el orden de inserción. `tokens.css` debe ir **antes** de `base.css` (las reglas usan las custom properties). Verbatim + este orden = sin cambio de cascada respecto al `index.html` (donde todo está en un `<style>` secuencial).
- **NO introducir `@layer` en Fase 1.** STACK.md lo menciona como *opcional al modularizar después*. Envolver el CSS verbatim en `@layer` **cambia la prioridad de cascada** (cualquier regla fuera de capa gana a cualquier regla en capa) → riesgo de drift visual sutil. En Fase 1, **CSS plano sin capas**, idéntico al `index.html`. `[CITED: STACK.md §5 punto 5 — "@layer ... al modularizar"; razonamiento de cascada CSS estándar]`
- **`color-mix(in srgb, …)`:** el CSS lo usa; soportado nativo, sin preprocesador. No añadir SCSS/PostCSS. `[CITED: STACK.md §5 / PITFALLS.md Pitfall 4 punto 4]`
- **Vite y `@import` dentro del CSS:** si el CSS editorial tuviera `@import`, Vite los procesa; el CSS del `index.html` no usa `@import` (todo inline) → no aplica. Verificar al extraer.
- **`scroll-padding-top: 124px` y `scroll-behavior: smooth`** (en `html`, líneas ~902-... del file) `[CITED: index.html — `html { scroll-behavior: smooth; scroll-padding-top: 124px; }`, leída esta sesión]`: copiar verbatim. (Relevante para Fase 5 navegación; en Fase 1 solo se conserva.)

> **Verificación objetiva (V4):** en Fase 1 NO hay render de fichas para comparar pixel a pixel, así que la verificación de "CSS verbatim" es **estructural**: (a) los tres ficheros existen, se cargan vía `css:[]`, y el HTML generado los referencia bajo `/guiaRoma/_nuxt/`; (b) un diff textual confirma que el contenido es el del `index.html` sin alteraciones (salvo el split en ficheros). La verificación *visual* del CSS llega cuando hay componentes (Fase 3+) contra el golden.

---

## Self-Hosting (BUILD-02)

### Fuentes — `@nuxt/fonts`

- **Estado hoy:** las 3 familias cargan de **Google Fonts CDN** (`<link>` línea 13 del `index.html`) → HOY dependen de red. Self-hostear es una **mejora de offline alineada con el objetivo** (no una obligación de paridad — sin red hoy caen a fallbacks de la pila). `[CITED: PITFALLS.md Pitfall 6 / index.html línea 13]`
- **Config exacta:** ver Pattern 1. Las familias y pesos provienen literalmente de la URL de Google Fonts del `index.html`:
  - **Cormorant Garamond:** `0,400;0,500;0,600;0,700;1,400;1,500;1,600` → weights `[400,500,600,700]`, styles `['normal','italic']` (itálicas en 400/500/600).
  - **Lora:** `0,400;0,500;0,600;1,400;1,500` → weights `[400,500,600]`, styles `['normal','italic']` (itálicas 400/500).
  - **JetBrains Mono:** `wght@400;500` → weights `[400,500]`, styles `['normal']`.
  `[CITED: index.html línea 13 — leída literal esta sesión]`
- **Mecánica:** `@nuxt/fonts` auto-detecta `font-family` en el CSS y, con la declaración explícita de `families`, descarga los ficheros en build y los sirve bajo `/_nuxt/` (o `public/_fonts`), generando `@font-face` locales. `[VERIFIED: fonts.nuxt.com/get-started/configuration, 2026-06-18]`
- **Riesgo (FOUT):** verificar que `font-display` no introduzca un salto tipográfico distinto al de hoy. `[CITED: PITFALLS.md Pitfall 4 punto 3]`
- **Acción Fase 1:** **quitar el `<link>` a Google Fonts** del flujo Nuxt (no se porta el `<link>` del `index.html`; las fuentes las inyecta `@nuxt/fonts`). El `index.html` original conserva su `<link>` (intacto, D-02).

### Leaflet — preparado, NO montado en Fase 1

- **Decisión:** el **componente de mapa es Fase 7**. En Fase 1 **solo** se asegura que `leaflet` está instalado y que, cuando se use, se importará de `node_modules` (`import 'leaflet/dist/leaflet.css'` / `import L from 'leaflet'`), **nunca de CDN**. `[CITED: STACK.md §4 / PITFALLS.md Pitfall 1]`
- **¿Qué pertenece a Fase 1?** El **CSS de Leaflet** sí se extrae ahora (`leaflet.css`, líneas 14-864) porque es parte del CSS global verbatim. El **JS de Leaflet y el componente `.client.vue`** NO — eso toca `window` y va en `onMounted` dentro de un `.client.vue` (Fase 7). Importar Leaflet JS en Fase 1 sin componente no aporta nada y arriesga romper `nuxt generate` si se hace mal.
- **`L.divIcon` (HTML puro):** guiaRoma no usa las imágenes de marcador por defecto → el bug de rutas `marker-icon.png` en bundlers **no aplica** (un punto a favor; relevante en Fase 7). `[CITED: STACK.md §4 / PITFALLS.md Pitfall 1 punto 6]`

### Imágenes hero (terceros) — sin cambios en Fase 1

- Las heros son URLs de Wikimedia/turismoroma con `onerror`→SVG fallback. **NO** procesarlas con `@nuxt/image`. En Fase 1 no se renderiza ninguna ficha, así que no hay acción; el patrón `@error`→SVG llega en Fase 7. `[CITED: PITFALLS.md Pitfall 6/9]`

---

## Base-Path Correctness (BUILD-01 / BUILD-03)

**Subpath de producción:** `/guiaRoma/` (repo `psl11/guiaRoma`; Pages sirve en `usuario.github.io/guiaRoma/`). `[CITED: CONTEXT.md §Specific Ideas]`

| Pieza | Acción Fase 1 | Verificación |
|-------|---------------|--------------|
| **baseURL** | `app.baseURL: '/guiaRoma/'` en `nuxt.config.ts` (Fase 1, sin CI) **o** `NUXT_APP_BASE_URL=/guiaRoma/` al build. Recomendado: en config para que `generate` local ya aplique el prefijo sin env. | Inspeccionar `.output/public/index.html`: assets referencian `/guiaRoma/_nuxt/…` |
| **preset Nitro** | `nitro.preset: 'github_pages'` | El build produce `.output/public` con estructura Pages |
| **`.nojekyll`** | `public/.nojekyll` vacío (cinturón-y-tirantes; el preset debería añadirlo pero hay fricción conocida nuxt#21232/#12480) | `test -f .output/public/.nojekyll` |
| **Routing history (no hash)** | Default de Nuxt; NO activar hash-mode. La app es una página con anclas `#id` (fragmentos, no rutas) | URLs sin `#/`; anclas siguen siendo fragmentos |
| **Trailing slash** | `autoSubfolderIndex: true` (default) → `/x/index.html` | No tocar |
| **failOnError** | `nitro.prerender.failOnError: true` → enlace roto rompe el build | Build peta si hay 404 interno |
| **Sin rutas absolutas** | Usar imports/`~/assets`; nunca `/_nuxt/` o `/img/` hardcodeado | grep del código por rutas absolutas |

`[CITED: STACK.md §3 / PITFALLS.md Pitfall 5 / nuxt.com/deploy/github-pages — verificado en STACK.md]`

### Cómo verificar localmente que NO hay 404 de `/_nuxt/*` bajo `/guiaRoma/` (D-06)

El reto: `npx serve .output/public` sirve la raíz en `/`, pero los assets esperan `/guiaRoma/`. Tres vías:

```bash
# Vía A (recomendada): replicar el subpath con un symlink/carpeta y servir el padre.
mkdir -p /tmp/pages-preview/guiaRoma
cp -r .output/public/* /tmp/pages-preview/guiaRoma/
pnpm dlx serve -l 5000 /tmp/pages-preview
# → abrir http://localhost:5000/guiaRoma/  y revisar la consola/Network: CERO 404 de /_nuxt/*

# Vía B: `npx serve` con rewrite, o un server que monte la app en /guiaRoma/.
# Vía C (programática, integrable en test): Playwright navega a http://localhost:5000/guiaRoma/
#   y un listener `page.on('response')` falla si algún /_nuxt/* responde !=200.
```

> **Verificación objetiva (V5):** servir bajo `/guiaRoma/` y assertar 0 respuestas con status ≥400 para recursos `/_nuxt/*`, fuentes y favicon. Programable con Playwright (`page.on('requestfailed')` / `page.on('response')`) o manual con DevTools Network. `[ASSUMED]` — la Vía A (copiar a subcarpeta) es la más simple y robusta sin CI; el planner elige.

### Favicon / apple-touch-icon bajo subpath (atención)

- El `index.html` referencia `favicon.svg` / `apple-touch-icon.svg` **relativos** (líneas 9-10) y ambos viven en la **raíz** (D-02 los mantiene ahí). `[CITED: index.html 9-10 — leídas esta sesión]`
- En la app **Nuxt**, el favicon debe declararse vía `app.head.link` o copiarse a `public/` para que resuelva bajo `/guiaRoma/`. **Decisión Fase 1:** copiar `favicon.svg`/`apple-touch-icon.svg` a `public/` (NO mover los de la raíz — esos son del `index.html` por D-02) y referenciarlos en `nuxt.config.ts` `app.head`. Así el `index.html` y la app Nuxt tienen cada uno su copia, sin conflicto. `[ASSUMED]` — copiar a `public/` es lo seguro; verificar que el favicon de la app resuelve bajo `/guiaRoma/favicon.svg`.

---

## Dormant Nitro Backend (ARCH-03)

"Presente pero dormido" significa, **concretamente**: `[CITED: ARCHITECTURE.md §Dormant backend]`

1. **`server/` existe en la raíz** (hermano de `app/`, por convención Nuxt 4 — `serverDir` resuelve desde `<rootDir>`). `[VERIFIED: nuxt.com/docs/4.x/getting-started/upgrade, 2026-06-18]`
2. **Ningún `server/api/*.ts`.** Una ruta de servidor solo existe si hay un fichero que la define → sin ficheros, sin endpoints, Nitro no expone API. El **único contenido** es `server/api/README.md` (texto, no código) documentando que es el hueco de v2 (auth/uploads). `[CITED: ARCHITECTURE.md]`
3. **`nuxt generate` sigue siendo SSG aunque exista `server/`.** Generar a estático no depende de que `server/` esté vacío: prerenderiza la app a HTML. GitHub Pages sirve ficheros estáticos; no hay runtime Nitro. `[CITED: ARCHITECTURE.md]`
4. **NO poner `ssr: false`.** SSR-en-build ON para prerenderizar HTML real. `[CITED: ARCHITECTURE.md Anti-Pattern 4]`

**Contenido sugerido de `server/api/README.md`** (discreción D-06):
```md
# server/api — Backend Nitro (DORMIDO)

Hueco reservado para el backend de v2 (BACK-01/02/03: auth, subida de media, API).
En la 1.0 NO hay endpoints activos: el sitio se genera 100% estático (preset github_pages).
Añadir un `*.ts` aquí activaría una ruta — NO hacerlo en la 1.0.
```

> **Verificación objetiva (V7):** (a) `server/api/README.md` existe; (b) no hay ningún `.ts`/`.js` bajo `server/`; (c) `nuxt generate` produce `.output/public` (estático) sin un servidor Node requerido para servir.

---

## Playwright Golden Capture (PARITY-01) — el corazón de la fase

### Qué capturar (D-04) — set representativo, en 2 temas × 2 viewports

Ubicaciones verificadas en el `index.html` (secciones `id=` y fichas-tipo) esta sesión:

| Captura | Ancla / selector | Línea en index.html |
|---------|------------------|---------------------|
| Home / inicio | `#inicio` | 2283 |
| Día Viernes | `#viernes` | 2375 |
| Día Sábado | `#sabado` | 2840 |
| Día Domingo | `#domingo` | 3445 |
| Día Lunes | `#lunes` | 4002 |
| Día Martes | `#martes` | 4736 |
| Referencia: Reservas | `#reservas` | 5260 |
| Referencia: Gastronomía | `#gastronomia` | 5335 |
| Referencia: Práctica | `#practica` | 5825 |
| Referencia: Arte | `#arte` | 5941 |
| Referencia: Arquitectura | `#arquitectura` | 6104 |
| Ficha tipo `card` (monumento) | `#galleria-sciarra` (o `#fontana-trevi`) | 2450 / 2513 |
| Ficha tipo `guided` (Vaticano/Coliseo) | buscar `card guided` en sábado/domingo (Vaticano) | sección sábado/domingo |
| Ficha tipo `concert` (Auditorium) | `#auditorium` (roman `♪`) | ~3383 (markup) / 6285 (places) |

`[CITED: index.html — grep de `<section id=` y clases de ficha, leído esta sesión]`

> **Nota sobre `guided`:** el grep directo de `class="...guided"` no devolvió match limpio (las clases de tipo pueden estar compuestas o el `guided` aplicarse por otro selector). **Flag para el planner:** localizar la ficha guiada exacta (Vaticano = visita guiada) leyendo las secciones sábado/domingo del `index.html` al planificar la captura; D-04 la nombra explícitamente (Vaticano/Coliseo). El tipo `concert` sí está confirmado (`#auditorium`, roman `♪`). Confianza: el set de día/referencia/monumento es HIGH; la localización exacta de la ficha `guided` es MEDIUM (hay que leerla).

### Estrategia de captura por elemento vs página completa

- **Home y secciones:** `fullPage` por sección no es trivial (es una sola página larga con anclas). Recomendado: capturar **el elemento `<section id=...>`** con `expect(page.locator('#viernes')).toHaveScreenshot('viernes-light.png')` — más estable que `fullPage` (evita capturar el resto de la página) y mapea 1:1 a D-04. Para "home/inicio", capturar `#inicio`. `[ASSUMED]` — captura por sección/elemento es lo más robusto; el planner puede preferir `fullPage` con `scrollIntoView`. Documentar la elección.
- **Fichas:** `expect(page.locator('#galleria-sciarra')).toHaveScreenshot('card-monumento-light.png')`.

### Determinismo — fuentes de flakiness identificadas (lectura del index.html)

| Fuente de inestabilidad | Evidencia en index.html | Mitigación |
|-------------------------|--------------------------|------------|
| **Animación de entrada de fichas** | `@keyframes fadeIn` + `.card { animation: fadeIn .5s ease backwards; }` (líneas ~2121/2125) | `animations: 'disabled'` en `toHaveScreenshot` (congela animaciones y las pone al estado final) `[VERIFIED: index.html — keyframes/animation leídos esta sesión]` |
| **Transiciones de tema** | `transition: background-color .4s ease, color .4s ease` (body) + múltiples `.2s/.3s/.4s` | `animations: 'disabled'` cubre transitions; además forzar el tema ANTES de navegar (no togglearlo en vivo) |
| **`scroll-behavior: smooth`** | `html { scroll-behavior: smooth; }` (línea ~902) | Capturar por elemento (locator) en vez de scrollear; o inyectar CSS `* { scroll-behavior: auto !important }` vía `stylePath` |
| **Imágenes hero de terceros (red)** | heros = URLs Wikimedia/turismoroma con `onerror`→SVG | **Decidir explícitamente** (ver abajo). Sin decisión, las heros hacen el golden no-determinista (cargan o no según la red en el momento de captura) |
| **Fuentes de Google (red)** | `<link>` Google Fonts línea 13 | Esperar `document.fonts.ready` antes de capturar; o `page.waitForLoadState('networkidle')` |

`[VERIFIED: index.html — `scroll-behavior: smooth; scroll-padding-top: 124px`, `@keyframes fadeIn`, `.card { animation: fadeIn .5s ease backwards }`, transitions de tema — todos leídos esta sesión]`

**Decisión clave — imágenes hero remotas (riesgo de flakiness del golden):**

El golden debe ser **reproducible**. Las heros son de terceros y pueden (a) cargar, (b) fallar→SVG, o (c) cargar lento. Tres opciones, en orden de robustez:

1. **Esperar a que la red se asiente y las imágenes carguen** (`await page.waitForLoadState('networkidle')` + `await page.evaluate(() => Promise.all([...document.images].map(img => img.complete ? 0 : new Promise(r => { img.onload = img.onerror = r }))))`) y capturar el estado "con foto". **Riesgo:** si una hero cae a SVG el día de captura pero carga otro día, el golden diverge. **Frágil** para imágenes de terceros.
2. **Capturar con las heros bloqueadas → fuerza el estado de fallback SVG** (`page.route('**/*.{jpg,jpeg,png,webp}', r => r.abort())` para dominios de terceros). El golden refleja siempre el **fallback SVG determinista**. **Más reproducible**, y además es el estado "offline" que el proyecto valora. **Pero** no captura el look "con foto" que el usuario ve con red.
3. **Enmascarar las heros** (`mask: [page.locator('.card-hero img')]`) → Playwright pinta un overlay sobre las imágenes, ignorándolas en el diff. El golden ignora las heros por completo.

**Recomendación:** la captura del golden debe ser **determinista por encima de "bonita"**. Para el set representativo, **opción 1 (esperar carga real) con un `maxDiffPixelRatio` tolerante** captura el look real; pero si el equipo ve flakiness, **opción 3 (mask)** es el escape válido (las heros de terceros no son parte del CSS/markup que la migración debe preservar — son contenido externo). **Documentar la elección en VALIDATION.md.** `[ASSUMED]` — esta es una decisión de ingeniería de test que el planner/usuario debe fijar; las tres son defendibles. No hay una respuesta "verificada" única.

### Naming y ubicación de snapshots (discreción D-04)

- Convención sugerida: `tests/parity/golden.spec.ts` + `tests/parity/golden.spec.ts-snapshots/` (default de Playwright) **o** un `snapshotPathTemplate` explícito como `tests/parity/__screenshots__/{arg}-{projectName}.png` (sin sufijo de plataforma si el equipo usa SOs distintos). `[VERIFIED: playwright.dev/docs/test-snapshots — `{testfile}-snapshots/{name}-{browser}-{platform}.png` por defecto, 2026-06-18]`
- Nombres legibles por captura: `inicio-{light|dark}`, `dia-viernes-{light|dark}`, …, `card-monumento-{light|dark}`, `card-guided-{light|dark}`, `card-concert-{light|dark}`, `ref-reservas-{light|dark}`, …
- Con 2 `projects` (mobile/desktop) cada nombre genera 2 ficheros automáticamente → **11 secciones/fichas-tipo × 2 temas × 2 viewports ≈ 44-52 PNGs**. (D-04: home + 5 días + 3 fichas-tipo + 5 referencias = 14 vistas × 2 × 2 = **56 PNGs** como cota superior.)
- **Generar el golden:** `pnpm playwright test --update-snapshots` (primera ejecución crea los PNGs). `[VERIFIED: playwright.dev/docs/test-snapshots, 2026-06-18]`

> **Verificación objetiva (V8):** (a) existe `playwright.config.ts` con `webServer` sirviendo `index.html` y proyectos mobile/desktop; (b) el spec del golden cubre las 14 vistas de D-04 en light+dark; (c) los PNGs golden existen y están versionados (git-tracked); (d) re-ejecutar `playwright test` (sin `--update`) **pasa** contra los golden recién creados (auto-consistencia → confirma determinismo). Si (d) falla, hay flakiness no resuelta (revisar animaciones/fuentes/heros).

### ¿index.html servible junto al scaffold? (ordering)

D-02 mantiene `index.html` intacto en la raíz toda la migración. **Implicación feliz:** el golden puede re-capturarse en cualquier momento desde el `index.html` in situ (sirviéndolo con un static server), **incluso después** del scaffold Nuxt — porque el fichero no se toca. **Pero** la disciplina de PITFALLS.md Pitfall 11 / SUMMARY.md es capturar el golden **como primer entregable verificado**, para que sea la línea base inmutable. **No hay conflicto de servidor:** el static server del golden (puerto 4173) sirve la **raíz del repo** (donde está `index.html`); el preview del build Nuxt (puerto 5000) sirve `.output/public`. Distintos puertos, distintas raíces. `[CITED: D-02 + PITFALLS.md Pitfall 11]`

---

## Tooling (PLAT-02 / PLAT-03)

### TypeScript estricto (PLAT-02)

- Nuxt 4 genera `.nuxt/tsconfig.json` estricto; el `tsconfig.json` de la raíz lo extiende. Reforzar `typescript.strict: true` en `nuxt.config.ts`. `[CITED: STACK.md §6]`
- **Comando de typecheck:** `nuxi typecheck` (usa `vue-tsc`). Decidir entre `typescript.typeCheck: true` (typecheck en build — más lento) vs comando separado `nuxi typecheck` en CI/pre-commit. **Recomendado Fase 1:** `typeCheck: false` + script `pnpm typecheck` separado (no ralentiza `dev`/`generate`). `[ASSUMED]` — ambas válidas; separado es lo común.
- **Dependencia:** `nuxi typecheck` requiere `vue-tsc` + `typescript` (transitivas de Nuxt 4; si falta, `pnpm add -D vue-tsc typescript`).

### ESLint flat config + Prettier (PLAT-03)

- **Instalación:** `pnpm dlx nuxi module add eslint` genera `eslint.config.mjs` (flat config) consciente de Nuxt y registra `@nuxt/eslint` en `nuxt.config.ts`. `[CITED: STACK.md §6]`
- **Formateo — elegir UNA vía (no mezclar):** `[CITED: STACK.md §6 / CLAUDE.md]`
  - **Vía recomendada:** activar `@nuxt/eslint` con `config.stylistic: true` → ESLint formatea (una sola herramienta, sin guerra ESLint↔Prettier):
    ```ts
    // nuxt.config.ts
    eslint: { config: { stylistic: true } }
    ```
  - **Vía alternativa (si el equipo ya usa Prettier):** Prettier 3.8.4 + `eslint-config-prettier` (apaga reglas de formato de ESLint). `pnpm add -D eslint-config-prettier` y añadirlo al final del flat config.
- **Comando de lint que debe pasar limpio:** `pnpm eslint .` (o el script `pnpm lint`). PLAT-03 exige exit 0.
- **Scripts `package.json` sugeridos:**
  ```json
  {
    "scripts": {
      "dev": "nuxi dev",
      "build": "nuxi build",
      "generate": "nuxi generate",
      "preview": "nuxi preview",
      "typecheck": "nuxi typecheck",
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "test:golden": "playwright test",
      "test:golden:update": "playwright test --update-snapshots"
    }
  }
  ```

> **Verificación objetiva (V2/V3):** `pnpm typecheck` exit 0 (TS estricto) y `pnpm lint` exit 0 (sin errores). Ambos comprobables en CI/local.

---

## Don't Hand-Roll

| Problema | No construir | Usar | Por qué |
|----------|--------------|------|---------|
| Tema sin FOUC en estático | Script inline propio en `<head>` | `@nuxtjs/color-mode` (`dataValue:'theme'`) | El módulo ya inyecta el script anti-flash SSR-safe; reinventarlo reintroduce el bug. (Uso real Fase 3; registrado en Fase 1) `[CITED: STACK.md §8]` |
| Self-host de fuentes | Descargar `.woff2` y escribir `@font-face` a mano | `@nuxt/fonts` | Auto-detecta, descarga en build, genera `@font-face`, maneja subsets. `[CITED: STACK.md]` |
| Subpath / `.nojekyll` | Post-procesar `.output/public` con scripts | preset `github_pages` + `public/.nojekyll` + `app.baseURL` | El preset hace el trabajo; `.nojekyll` explícito es el único parche conocido. `[CITED: STACK.md §3]` |
| Determinismo de screenshots | Sleeps + capturas full-page a ojo | Playwright `toHaveScreenshot` (`animations:'disabled'`, `mask`, `maxDiffPixelRatio`) | Manejo nativo de animaciones, antialiasing y máscaras. `[VERIFIED: playwright.dev/docs/test-snapshots]` |
| Lint + formato | ESLint + Prettier cableados a mano con `.eslintrc` legacy | `@nuxt/eslint` (flat config) + `stylistic` | Genera config consciente de Nuxt; una herramienta. `[CITED: STACK.md §6]` |
| Servir estático bajo subpath para test | Server HTTP custom | `serve`/`http.server` + carpeta `guiaRoma/` | Trivial con un static server estándar. |

**Key insight:** la Fase 1 es casi toda *configuración de herramientas maduras*. El único código "propio" es `app/app.vue` (placeholder), el `server/api/README.md` (texto) y el spec del golden. Toda la complejidad (anti-flash, self-host, subpath, determinismo de screenshots) la resuelven librerías oficiales — hand-rolling cualquiera de ellas es regresión.

---

## Common Pitfalls

> Los pitfalls profundos del proyecto están en `.planning/research/PITFALLS.md` (11 pitfalls, todos con líneas del `index.html`). Aquí solo los **específicos de la Fase 1** (andamiaje + golden), más dos nuevos no cubiertos por el corpus.

### Pitfall 1: `nuxi init` falla o sobrescribe en una raíz no vacía  (NUEVO — específico de D-01)

**Qué va mal:** `nuxi init .` espera un directorio vacío; la raíz ya tiene `index.html`, `favicon.svg`, `apple-touch-icon.svg`, `CLAUDE.md`, `.git/`, `.planning/`. Puede abortar, pedir confirmación, o (peor) sobrescribir.
**Por qué:** los scaffolders asumen proyecto nuevo en carpeta limpia.
**Cómo evitar:** **(A)** `nuxi init` en un temporal y mover SOLO los ficheros del scaffold a la raíz (preservando los existentes), o **(B)** crear el scaffold a mano (set pequeño: `package.json`, `nuxt.config.ts`, `app/app.vue`, `tsconfig.json`, `.gitignore`). Verificar tras el init que `index.html`/`favicon.svg`/`apple-touch-icon.svg`/`CLAUDE.md`/`.planning/` siguen intactos (D-02). `[ASSUMED]` — verificar el comportamiento de `nuxi init .` al planificar; ambas vías son seguras.
**Señales:** `index.html` modificado o desaparecido; `.git/` tocado; el scaffold en una subcarpeta `nuxt-app/` en vez de la raíz.

### Pitfall 2: `.gitignore` del scaffold ignora los golden PNGs  (NUEVO — específico del golden)

**Qué va mal:** el `.gitignore` que genera Nuxt puede incluir patrones (`*.png` no, pero `.output`, `dist`, `node_modules` sí) — y si el spec del golden vive bajo una ruta que un patrón amplio ignore, los PNGs **no se versionan** → D-05 ("imágenes golden versionadas en el repo") se incumple silenciosamente.
**Por qué:** los golden son artefactos de test que DEBEN commitearse (a diferencia de `.output`/`node_modules`).
**Cómo evitar:** colocar los golden en `tests/parity/` (no bajo `.output`/`.nuxt`); verificar con `git status`/`git check-ignore` que los PNGs son trackeables; añadirlos explícitamente. **Verificación:** `git ls-files tests/parity` lista los PNGs tras commit. `[ASSUMED]`
**Señales:** `git status` no muestra los PNGs; `git check-ignore tests/parity/...png` devuelve un patrón.

### Pitfall 3: Assets 404 bajo `/guiaRoma/` (subpath)  `[CITED: PITFALLS.md Pitfall 5]`

**Qué va mal:** sin `baseURL`, los assets de `/_nuxt/` se referencian desde la raíz del dominio → 404 en masa al servir bajo `/guiaRoma/`. Si Pages aplica Jekyll, ignora `_nuxt/` (empieza por `_`).
**Cómo evitar:** `app.baseURL: '/guiaRoma/'` + `nitro.preset: 'github_pages'` + `public/.nojekyll` + `failOnError: true` + cero rutas absolutas hardcodeadas. Verificar localmente sirviendo bajo subcarpeta `guiaRoma/` (§Base-Path Correctness).
**Señales:** página sin estilos en `usuario.github.io/guiaRoma/` o en el preview local de subcarpeta; 404 de `/_nuxt/*` o errores MIME en consola.

### Pitfall 4: Regresión por scopear el CSS / introducir `@layer`  `[CITED: PITFALLS.md Pitfall 4]`

**Qué va mal:** `<style scoped>` añade `data-v-*` y rompe selectores cruzados; `@layer` cambia la prioridad de cascada respecto al `index.html`.
**Cómo evitar:** CSS **global plano**, verbatim, cargado por `css:[]` en orden tokens→base→leaflet. Sin `scoped`, sin `@layer` en Fase 1.
**Señales:** (la verificación visual real es Fase 3+ contra el golden) en Fase 1, un diff textual que muestre alteraciones del CSS respecto al `index.html`.

### Pitfall 5: Golden no-determinista (animaciones / fuentes / heros remotas)  (refinado de PITFALLS.md Pitfall 11)

**Qué va mal:** capturas que varían entre ejecuciones por el `@keyframes fadeIn` de las fichas, las transiciones de tema, `scroll-behavior: smooth`, las fuentes de Google cargando por red, y las heros de terceros que cargan/fallan según la red.
**Cómo evitar:** `animations: 'disabled'`; esperar `document.fonts.ready` + `networkidle`; forzar tema vía `localStorage` antes de navegar (no en vivo); **decidir explícitamente** el tratamiento de heros remotas (esperar carga / bloquear→SVG / `mask`). **Auto-test:** re-ejecutar `playwright test` sin `--update` debe pasar contra los golden recién generados.
**Señales:** la segunda ejecución del test (sin `--update`) falla con diffs en zonas de imagen o texto; capturas con texto en fuente de fallback (FOUT no esperado).

### Pitfall 6: `ssr: false` / Nitro activado por error  `[CITED: PITFALLS.md Pitfall 10 / ARCHITECTURE.md]`

**Qué va mal:** apagar SSR (SPA shell sin HTML) o crear un `server/api/*.ts` con lógica activa el backend → rompe el "dormido" y la paridad.
**Cómo evitar:** sin `ssr: false`; `server/` solo con `README.md`; salida estática vía preset + prerender.
**Señales:** `.output/public/index.html` con `<div id="__nuxt"></div>` vacío (SPA shell); aparece un `.ts` bajo `server/`.

---

## Code Examples

> Patrones verificados (config) listos para que el planner los referencie. Los snippets completos de `nuxt.config.ts` y `playwright.config.ts` están en §Architecture Patterns.

### Golden spec — esqueleto (captura del index.html)

```ts
// tests/parity/golden.spec.ts  (esqueleto — la lista completa de vistas en D-04)
// Source: docs Playwright + index.html (anclas/fichas leídas esta sesión)
import { test, expect, type Page } from '@playwright/test'

const SECTIONS = [
  ['inicio', '#inicio'], ['dia-viernes', '#viernes'], ['dia-sabado', '#sabado'],
  ['dia-domingo', '#domingo'], ['dia-lunes', '#lunes'], ['dia-martes', '#martes'],
  ['ref-reservas', '#reservas'], ['ref-gastronomia', '#gastronomia'],
  ['ref-practica', '#practica'], ['ref-arte', '#arte'], ['ref-arquitectura', '#arquitectura'],
  ['card-monumento', '#galleria-sciarra'], ['card-concert', '#auditorium'],
  // ['card-guided', '#<id-vaticano>'],  // FLAG: localizar la ficha guiada exacta al planificar
] as const

async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => (document as any).fonts?.ready)
  // tratamiento de heros remotas: DECIDIR (esperar carga / abort→SVG / mask). Ver §Pitfalls golden.
}

for (const theme of ['light', 'dark'] as const) {
  test(`golden ${theme}`, async ({ page }) => {
    if (theme === 'dark') await page.addInitScript(() => localStorage.setItem('roma-theme', 'dark'))
    await page.goto('/index.html')
    await settle(page)
    for (const [name, sel] of SECTIONS) {
      await page.locator(sel).scrollIntoViewIfNeeded()
      await expect(page.locator(sel)).toHaveScreenshot(`${name}-${theme}.png`)
    }
  })
}
```

### Verificación de 0 × 404 de `/_nuxt/*` bajo subpath (programable)

```ts
// (puede vivir en un test de smoke del build, o ejecutarse manual)
const bad: string[] = []
page.on('response', r => { if (r.url().includes('/_nuxt/') && r.status() >= 400) bad.push(r.url()) })
await page.goto('http://localhost:5000/guiaRoma/')
await page.waitForLoadState('networkidle')
expect(bad, `404s de assets bajo subpath: ${bad.join(', ')}`).toHaveLength(0)
```

---

## State of the Art

| Tema | Estado actual (2026-06) | Nota |
|------|-------------------------|------|
| Nuxt `srcDir` | `app/` es el **default** en Nuxt 4; `server/`/`public/`/`content/`/`shared/`/`modules/`/`layers/` resuelven desde `<rootDir>` | `[VERIFIED: nuxt.com/docs/4.x/getting-started/upgrade, 2026-06-18]` |
| `compatibilityVersion` | `4` es el **default** en Nuxt 4 — NO hace falta `future.compatibilityVersion: 4` | `[VERIFIED: nuxt.com/docs/4.x/getting-started/upgrade, 2026-06-18]` |
| Deploy Pages | preset `github_pages` + `NUXT_APP_BASE_URL` es la vía oficial documentada | `[CITED: STACK.md / nuxt.com/deploy/github-pages]` |
| `@nuxt/fonts` config | `fonts.families[].{name,provider,weights,styles,subsets}` | `[VERIFIED: fonts.nuxt.com/get-started/configuration, 2026-06-18]` |
| Playwright snapshots | `toHaveScreenshot` con `animations:'disabled'`, `stylePath`, `mask`, `maxDiffPixels(Ratio)`; storage `{testfile}-snapshots/{name}-{browser}-{platform}.png` | `[VERIFIED: playwright.dev/docs/test-snapshots, 2026-06-18]` (`stylePath`/`maxDiffPixels` citados literal en docs; `animations`/`mask`/`caret`/`maxDiffPixelRatio` son opciones estándar de la API) |

**Deprecado/a evitar (del corpus):** `z` desde `@nuxt/content` (deprecado → usar `zod`); `@vue-leaflet/vue-leaflet` (abandonado 2023); Tailwind/UnoCSS (regresión visual). `[CITED: STACK.md]`

---

## Runtime State Inventory

> La Fase 1 incluye un componente de "rename/migración"? No: es **andamiaje nuevo + captura**, no un rename de strings. No hay estado runtime previo del proyecto Nuxt (no existe aún). **Sin embargo**, dos categorías son relevantes por D-02/D-05:

| Categoría | Items encontrados | Acción requerida |
|-----------|-------------------|------------------|
| Stored data | `localStorage` del navegador con claves `roma-theme`/`roma-pace`/`roma-light`/`roma-resumen`/`roma-note-*` (de usuarios de la versión viva) | **Ninguna en Fase 1** — se preservarán literalmente en fases posteriores (la app Nuxt reusa `roma-theme` vía color-mode). Solo se *lee* `roma-theme` para forzar el golden oscuro. `[CITED: index.html / STATE.md]` |
| Live service config | Deploy vivo de `main` en GitHub Pages | **NO tocar** (D-06). La Fase 1 no monta CI ni toca el deploy. |
| OS-registered state | Ninguno | None — verificado: no hay tareas/servicios OS asociados al proyecto. |
| Secrets/env vars | `NUXT_APP_BASE_URL` (opcional; en Fase 1 se prefiere `app.baseURL` en config) | None sensible. |
| Build artifacts | Ninguno previo (no existe build Nuxt aún); `index.html` es un artefacto manual que **permanece** (D-02) | `index.html` intacto; `.output/`, `.nuxt/`, `node_modules/` se generan y se gitignoran. |

**Nada que migrar en Fase 1.** El único "estado" tocado es leer `localStorage['roma-theme']` para el golden oscuro, sin escribir nada persistente del lado del proyecto.

---

## Environment Availability

| Dependencia | Requerida por | Disponible | Versión | Fallback |
|-------------|---------------|------------|---------|----------|
| node | Nuxt 4 (requiere Node 18+/20+) | ✓ | **22.20.0** | — |
| pnpm | D-03 (gestor de paquetes) | ✓ | **10.32.1** | — |
| npm/npx | scaffolding (`nuxi`), verificación de versiones | ✓ | 11.15.0 | — |
| Playwright chromium | golden (PARITY-01) | ✗ (no instalado aún) | — | `pnpm dlx playwright install chromium` en el scaffold |
| static server (`serve`/`http.server`) | servir `index.html` + preview build | ✓ (vía `pnpm dlx serve` o `python3 -m http.server`) | — | python3 / `npx serve` |
| Conexión de red | `@nuxt/fonts` (descarga en build), heros del golden | ✓ (build); las heros son de terceros | — | Si no hay red en build, `@nuxt/fonts` falla → necesita red en build |

`[VERIFIED: `node --version`, `pnpm --version`, `npm --version` ejecutados esta sesión, 2026-06-18]`

**Missing dependencies with no fallback:** ninguna que bloquee — Playwright chromium se instala en el propio scaffold.
**Missing dependencies with fallback:** static server (cualquier `serve`/`http.server` sirve); navegador Playwright (instalable).

> **Nota de red:** `@nuxt/fonts` con provider `google` **descarga las fuentes en build** → el build necesita red. En runtime (servido) las fuentes son locales (offline OK). Si el entorno de build no tuviera red, evaluar provider `local` con los `.woff2` versionados — fuera de alcance Fase 1 salvo que el build no tenga red. `[ASSUMED]`

---

## Validation Architecture

> `workflow.nyquist_validation: true` en `.planning/config.json` `[VERIFIED: config.json leído esta sesión]` → esta sección es **obligatoria** y alimenta VALIDATION.md.

### Test Framework

| Property | Value |
|----------|-------|
| Framework (golden) | **@playwright/test 1.61.0** |
| Framework (unit) | **NO en Fase 1** (Vitest llega en Fases 4-6) |
| Config file | `playwright.config.ts` (a crear — Wave 0) |
| Quick run command | `pnpm playwright test --project=desktop` (un viewport, rápido) |
| Full suite command | `pnpm playwright test` (mobile + desktop) |
| Build/lint gates | `pnpm generate`, `pnpm lint`, `pnpm typecheck` (todos exit 0) |

### Phase Requirements → Test Map

| Req ID | Comportamiento a verificar | Tipo | Comando / observación automatizable | ¿Existe? |
|--------|----------------------------|------|-------------------------------------|----------|
| **PLAT-01** | `nuxt dev` arranca; `nuxt generate` compila sin error | smoke/build | `pnpm generate` exit 0 (y `pnpm dev` arranca sin crash) | ❌ Wave 0 |
| **PLAT-02** | TS estricto sin errores | typecheck | `pnpm typecheck` exit 0 | ❌ Wave 0 |
| **PLAT-03** | Lint pasa limpio | lint | `pnpm lint` exit 0 | ❌ Wave 0 |
| **PLAT-04** | CSS editorial como CSS global, verbatim, cargado una vez | estructural | (a) existen `tokens.css`/`base.css`/`leaflet.css`; (b) `nuxt.config.ts` los lista en `css:[]`; (c) diff textual vs `index.html` sin alteraciones; (d) HTML generado referencia los CSS bajo `/guiaRoma/_nuxt/` | ❌ Wave 0 |
| **PLAT-05** | Estructura de carpetas Nuxt 4 | estructural | existen `app/`, `content/`, `public/`, `server/`, `nuxt.config.ts` (y `shared/` si aplica) en raíz | ❌ Wave 0 |
| **ARCH-03** | `server/` presente y dormido; sigue generando estático | estructural | (a) `server/api/README.md` existe; (b) sin `*.ts`/`*.js` bajo `server/`; (c) `pnpm generate` produce `.output/public` estático | ❌ Wave 0 |
| **BUILD-01** | Estático bajo `/guiaRoma/` con assets resolviendo; `.nojekyll` presente | build + e2e | (a) `test -f .output/public/.nojekyll`; (b) servir bajo subcarpeta `guiaRoma/` y assertar 0 × status≥400 en `/_nuxt/*` (Playwright `page.on('response')`) | ❌ Wave 0 |
| **BUILD-02** | Leaflet + fuentes self-hosteados (sin CDN) | e2e/estructural | (a) ningún request a `fonts.googleapis.com`/`fonts.gstatic.com`/`unpkg.com` al servir el build (Playwright `page.on('request')` → 0 a esos hosts); (b) `@nuxt/fonts` emite las 3 familias incl. itálicas (inspeccionar `@font-face` / `/_nuxt/`) | ❌ Wave 0 |
| **BUILD-03** | App funciona servida desde el subpath | e2e | la página del scaffold carga bajo `/guiaRoma/` sin error de consola | ❌ Wave 0 |
| **PARITY-01** | Golden capturado del `index.html` antes de divergir | snapshot | (a) `playwright.config.ts` + spec del golden existen; (b) PNGs de las 14 vistas × 2 temas × 2 viewports versionados (`git ls-files`); (c) re-ejecutar `playwright test` (sin `--update`) **pasa** (determinismo) | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** el comando relevante a la tarea — `pnpm lint` / `pnpm typecheck` para tareas de tooling; `pnpm generate` para tareas de build/subpath; `pnpm playwright test --project=desktop` para tareas del golden.
- **Per wave merge:** `pnpm lint && pnpm typecheck && pnpm generate` + verificación de subpath (0 × 404) + `pnpm playwright test` (golden auto-consistente).
- **Phase gate:** los 5 success criteria del ROADMAP §Phase 1 verdes + golden versionado, antes de `/gsd:verify-work`.

### Wave 0 Gaps

- [ ] `playwright.config.ts` — proyectos mobile (`iPhone 12` ~390px) / desktop (1280×800), `webServer` estático sobre la raíz, `toHaveScreenshot` con `animations:'disabled'`
- [ ] `tests/parity/golden.spec.ts` — cubre las 14 vistas de D-04 (home + 5 días + 3 fichas-tipo + 5 referencias) en light+dark
- [ ] `tests/parity/...-snapshots/` (o `__screenshots__/`) — PNGs golden generados con `--update-snapshots` y **versionados**
- [ ] Smoke del subpath — script/test que sirve `.output/public` bajo `guiaRoma/` y assertar 0 × 404 de `/_nuxt/*` (puede ser un spec Playwright separado o un check manual documentado)
- [ ] Framework install: `pnpm add -D @playwright/test && pnpm dlx playwright install chromium`
- [ ] Scripts `package.json`: `lint`, `typecheck`, `generate`, `test:golden`, `test:golden:update`

*(Sin tests unitarios en Fase 1 — la lógica pura testeable llega en Fases 4-6.)*

---

## Security Domain

> `security_enforcement` no aparece explícitamente en `.planning/config.json`; el corpus (`PITFALLS.md §Security Mistakes`) lo trata como sitio estático sin backend. Se incluye por completitud, acotado al alcance de Fase 1.

### Applicable ASVS Categories (Fase 1 — andamiaje estático, sin backend activo)

| ASVS Category | Aplica | Control estándar |
|---------------|--------|------------------|
| V2 Authentication | no | Sin auth en 1.0 (backend dormido) |
| V3 Session Management | no | Sin sesiones |
| V4 Access Control | no | Sitio estático público |
| V5 Input Validation | no (en Fase 1) | No hay input en Fase 1; zod valida contenido en Fase 2 |
| V6 Cryptography | no | Sin secretos/cripto |
| V14 Config / Build | **sí** | No exponer secretos en build; `.nojekyll`/preset oficiales; lockfile (`pnpm-lock.yaml`) commiteado; dependencias verificadas (§Package Legitimacy Audit) |

### Known Threat Patterns for {Nuxt 4 SSG + golden}

| Patrón | STRIDE | Mitigación estándar (Fase 1) |
|--------|--------|------------------------------|
| Dependencia maliciosa (slopsquatting) en el scaffold | Tampering | Versiones verificadas vía `npm view` + paquetes oficiales Nuxt-org; lockfile pnpm commiteado (§Package Legitimacy Audit) |
| `postinstall` malicioso de un paquete | Tampering | Todos los paquetes son oficiales/canónicos; pnpm pide confirmación de build scripts; revisar si algún paquete nuevo lo trae |
| Activar Nitro/endpoints por error (superficie de ataque v2 prematura) | Elevation of Privilege | `server/` solo con README; sin `*.ts`; SSR-en-build sin runtime en producción (Pages estático) |
| `v-html` sobre contenido no confiable | Tampering/XSS | **No aplica en Fase 1** (sin render). En fases posteriores: `v-html` solo sobre SVG/prosa del repo (`[CITED: PITFALLS.md §Security]`) |

> En Fase 1 la superficie de seguridad real es **la cadena de suministro de dependencias** (mitigada por la verificación de versiones y el origen oficial) y **no activar el backend** (mitigado por `server/` dormido). Sin auth, sin input, sin secretos.

---

## Assumptions Log

> Claims tagged `[ASSUMED]` en esta investigación — el planner/discuss deben confirmarlos antes de que se vuelvan decisiones bloqueadas. Ninguno bloquea el arranque; son elecciones de ingeniería con varias opciones válidas.

| # | Claim | Sección | Riesgo si es erróneo |
|---|-------|---------|----------------------|
| A1 | Instalar el stack completo en Fase 1 (vs perezoso por fase) minimiza churn de config | §Standard Stack | Bajo — ambas vías funcionan; solo afecta orden de instalación |
| A2 | `nuxi init .` requiere manejo especial en raíz no vacía (vía temporal o scaffold manual) | §Installation / Pitfall 1 | Medio — si se ejecuta mal podría tocar `index.html` (D-02); verificar comportamiento al planificar |
| A3 | `typescript.typeCheck: false` + comando `pnpm typecheck` separado (vs typecheck en build) | §Tooling | Bajo — preferencia de velocidad; ambas cumplen PLAT-02 |
| A4 | Copiar `favicon.svg`/`apple-touch-icon.svg` a `public/` para la app Nuxt (sin mover los de raíz) | §Base-Path / favicon | Bajo — alternativa: `app.head.link` apuntando a copia; verificar resolución bajo subpath |
| A5 | Tratamiento de heros remotas en el golden: esperar carga real (opción 1) por defecto, con `mask` como escape | §Playwright Golden Capture | **Medio-alto** — afecta determinismo del golden; decisión de ingeniería que el usuario debe fijar (3 opciones defendibles) |
| A6 | Captura por elemento (`locator.toHaveScreenshot`) sobre `fullPage` | §Golden Capture | Bajo — más robusto; el planner puede preferir fullPage |
| A7 | Verificación de subpath vía copiar `.output/public` a subcarpeta `guiaRoma/` + static server | §Base-Path Correctness | Bajo — la más simple sin CI; otras vías válidas |
| A8 | Plataforma de captura del golden debe documentarse (sufijo `-linux`/`-darwin` en snapshots) o fijar `snapshotPathTemplate` sin plataforma | §Pattern 2 | Medio — si Fase 8 compara en otra plataforma, los golden no casan |
| A9 | `@nuxt/fonts` necesita red en build para provider `google`; si no hay red, provider `local` | §Environment Availability | Bajo — el entorno actual tiene red |

---

## Open Questions (RESOLVED)

> Las 3 preguntas se resolvieron durante la planificación (ver PATTERNS.md + Plan 01-01); resolución inline en cada punto.

1. **Localización exacta de la ficha tipo `guided` (Vaticano/Coliseo) para el golden**
   - Qué sabemos: D-04 la nombra (Vaticano/Coliseo); `concert` confirmado (`#auditorium`, roman `♪`); `card` confirmado (`#galleria-sciarra`).
   - Qué falta: el `id` exacto de la ficha guiada (el grep de `class="...guided"` no devolvió match limpio — la clase de tipo puede aplicarse por otro selector o estar compuesta).
   - Recomendación: al planificar la tarea del golden, leer las secciones sábado/domingo del `index.html` (Vaticano) y fijar el `id`. No bloquea la fase; es un dato a resolver en la captura.
   - **RESOLVED:** No existe clase `guided`/`concert` — las 38 fichas son `<article class="card">` (verificado en PATTERNS.md). Representante de la ficha guiada = `#vaticano` (L2920). Codificado en Plan 01-01 Tarea 2.

2. **Tratamiento determinista de las imágenes hero de terceros en el golden** (ver A5)
   - Qué sabemos: son URLs Wikimedia/turismoroma con `onerror`→SVG; cargan por red → no deterministas.
   - Qué falta: decisión de producto/ingeniería entre "capturar con foto" (frágil), "bloquear→SVG" (reproducible + estado offline) o "mask" (ignorar).
   - Recomendación: que el planner lo eleve como decisión explícita en el plan/VALIDATION.md. Por defecto, esperar carga real con tolerancia; `mask` si hay flakiness.
   - **RESOLVED (A5):** opción **bloquear→fallback SVG** (`page.route('**/*.{jpg,jpeg,png,webp,avif,gif}', r => r.abort())`) — determinista y alineado con el objetivo offline (BUILD-02). Codificado en Plan 01-01 Tarea 2.

3. **Plataforma/CI de captura y comparación del golden** (ver A8)
   - Qué sabemos: Playwright sufija los snapshots con `-{platform}`; la captura es local (linux, esta sesión).
   - Qué falta: confirmar que Fase 8 comparará en la misma plataforma, o fijar `snapshotPathTemplate` sin plataforma.
   - Recomendación: documentar la plataforma de captura en VALIDATION.md; si el equipo usa SOs mixtos, fijar template sin sufijo de plataforma.
   - **RESOLVED (A8):** `snapshotPathTemplate` SIN el segmento `-{platform}` para poder comparar entre SOs en Fase 8; captura documentada en linux. Codificado en Plan 01-01 Tarea 1.

---

## Project Constraints (from CLAUDE.md)

> `./CLAUDE.md` contiene decisiones prescriptivas de stack (tratadas con autoridad de decisión bloqueada). Directivas accionables relevantes a Fase 1:

- **Tech stack:** Nuxt 4 (Vue 3 + Nitro). No Astro.
- **Paridad innegociable:** salida visual/funcional idéntica al `index.html`. CSS a mano **conservado verbatim** (NO Tailwind/UnoCSS).
- **Deployment:** salida estática (`nuxt generate`/preset `github_pages`) bajo `/guiaRoma/`; sin servidor activo en 1.0.
- **Offline:** Leaflet self-hosteado (no CDN), fuentes self-hosteadas (`@nuxt/fonts`), fallbacks de imagen, banner de mapa offline (banner = Fase 7).
- **Proceso:** todo el trabajo en `release/nuxt-4`; `main` intacto; no romper nada.
- **Gestor de paquetes:** pnpm (D-03).
- **Versiones exactas (CLAUDE.md TL;DR + Recommended Stack):** nuxt 4.4.8, @nuxt/content 3.14.0, zod 4.4.3, @nuxtjs/color-mode 4.0.1 (`dataValue:'theme'`, `storageKey:'roma-theme'`, `fallback:'light'`), leaflet 1.9.4, minisearch 7.2.0, @nuxt/fonts 0.14.0, @nuxt/eslint 1.16.0, eslint 10.5.0, prettier 3.8.4, @playwright/test (1.x).
- **Importaciones:** `import { z } from 'zod'` (NUNCA desde `@nuxt/content`).
- **GSD Workflow Enforcement:** trabajar a través de comandos GSD; no editar fuera del flujo.

Ninguna recomendación de esta investigación contradice CLAUDE.md.

---

## BUILD ORDER (Fase 1 — secuencia interna y constraint crítico)

> El BUILD ORDER global está en `SUMMARY.md`/`ARCHITECTURE.md` (Fase 0 = esta fase). Aquí el **orden interno** de los entregables de la Fase 1:

```
A. GOLDEN PRIMERO  (constraint crítico, D-05 / PITFALLS Pitfall 11)
   playwright.config.ts (webServer estático sobre la raíz) · golden.spec.ts (14 vistas × light/dark × mobile/desktop)
   · playwright install chromium · generar PNGs (--update-snapshots) · VERSIONARLOS
   · auto-test: re-ejecutar sin --update → pasa (determinismo)
        ▼ (índice.html intacto por D-02, pero el golden es el primer entregable verificado)
B. SCAFFOLD  (sin dependencias de A)
   nuxi init en raíz (manejo de raíz no vacía, Pitfall 1) · pnpm · app/app.vue placeholder · tsconfig strict
   · módulos en nuxt.config.ts (content · color-mode · fonts · eslint)
        ▼
C. CSS VERBATIM  (depende de B)
   extraer index.html: leaflet (14-864) → leaflet.css; tokens (:root/[data-theme]) → tokens.css; resto → base.css
   · css:[] en orden tokens→base→leaflet · SIN scoped, SIN @layer
        ▼
D. SELF-HOST  (depende de B/C)
   @nuxt/fonts: 3 familias con pesos/itálicas exactos (de la línea 13) · quitar <link> Google del flujo Nuxt
   · leaflet: solo asegurar import desde node_modules (componente = Fase 7)
        ▼
E. SUBPATH + NITRO DORMIDO  (depende de B)
   app.baseURL='/guiaRoma/' · nitro.preset='github_pages' · failOnError · public/.nojekyll
   · server/api/README.md · favicon a public/
        ▼
F. VERIFICAR BUILD ESTÁTICO LOCAL  (depende de C/D/E)
   pnpm lint (exit 0) · pnpm typecheck (exit 0) · pnpm generate (exit 0)
   · servir .output/public bajo guiaRoma/ → 0 × 404 de /_nuxt/* · 0 requests a CDNs (fonts/unpkg) · .nojekyll presente
```

**El constraint de secuenciación más importante:** **capturar y versionar el golden (A) antes de cualquier divergencia del árbol de trabajo.** Aunque `index.html` permanece intacto (D-02) y técnicamente el golden podría recapturarse después, la disciplina del proyecto (SUMMARY.md Fase 0, PITFALLS.md Pitfall 11) es que el golden sea la **línea base inmutable**, capturada primero. B–F pueden reordenarse entre sí (B antes que C/D/E; F al final); A va primero.

---

## Sources

### Primarias (HIGH confidence)

- **`.planning/research/STACK.md`** — stack decidido, versiones, módulos, config `nuxt.config.ts` base, color-mode, fonts, subpath, CSS verbatim. (Corpus del proyecto, HIGH.)
- **`.planning/research/ARCHITECTURE.md`** — `srcDir=app/`, `server/`/`content/`/`shared/` en raíz, backend dormido (sin `*.ts`, SSR-en-build ON, sin `ssr:false`), estructura de carpetas.
- **`.planning/research/PITFALLS.md`** — Pitfalls 4 (CSS scoped), 5 (subpath 404/.nojekyll), 6 (offline parity), 10 (scope creep/Nitro), 11 (golden antes de divergir); §Security; §"Looks Done But Isn't".
- **`.planning/research/SUMMARY.md`** — BUILD ORDER (Fase 0 = andamiaje+golden), síntesis.
- **`./CLAUDE.md`** — decisiones prescriptivas de stack (autoridad de decisión bloqueada).
- **`.planning/phases/01-.../01-CONTEXT.md`** — D-01..D-06, alcance del golden, discreción.
- **`/home/vcompanyb/guiaRoma/index.html`** — leído directamente esta sesión: `<html lang="es" data-theme="light">` (línea 2), favicon/apple-touch relativos (9-10), Google Fonts URL con pesos/itálicas exactos (13), `<style id="leaflet-inline-css">` (14-864), CSS editorial (~865-2210), secciones `id=` (inicio 2283, mapa 2361, días 2375-4736, referencias 5260-6104), fichas-tipo (`#galleria-sciarra` 2450, `#auditorium`/`♪` 3383/6285), `html{scroll-behavior:smooth;scroll-padding-top:124px}`, `@keyframes fadeIn` + `.card{animation:fadeIn .5s ease backwards}`, transitions de tema, theme init `localStorage['roma-theme']`+`setAttribute('data-theme')` (6252-6266), `places` (6269+), body class toggles `light-mode`/`modo-resumen` (6547/6565). **HIGH (oráculo de paridad).**
- **Registro npm** (`npm view <pkg> version`, ejecutado **2026-06-18**): nuxt 4.4.8, @nuxt/content 3.14.0, @nuxtjs/color-mode 4.0.1, @nuxt/fonts 0.14.0, @nuxt/eslint 1.16.0, eslint 10.5.0, prettier 3.8.4, leaflet 1.9.4, @types/leaflet 1.9.21, @playwright/test 1.61.0, minisearch 7.2.0, zod 4.4.3 — todas confirmadas como `latest`. **HIGH.**
- **[Nuxt 4 — Upgrade guide](https://nuxt.com/docs/4.x/getting-started/upgrade)** — `srcDir=app/` default; `server/`/`public/`/`modules/`/`layers/`/`content/`/`shared/` desde `<rootDir>`; `compatibilityVersion:4` es el default. **HIGH (verificado esta sesión).**
- **[@nuxt/fonts — Configuration](https://fonts.nuxt.com/get-started/configuration)** — `fonts.families[].{name,provider,weights,styles,subsets}`. **HIGH (verificado esta sesión).**
- **[Playwright — Visual comparisons](https://playwright.dev/docs/test-snapshots)** — `toHaveScreenshot`, `stylePath`, `maxDiffPixels`, storage `{testfile}-snapshots/{name}-{browser}-{platform}.png`, `--update-snapshots`. **HIGH (verificado esta sesión; `animations`/`mask`/`caret`/`maxDiffPixelRatio` son opciones estándar de la API no citadas literal en esa página concreta).**

### Secundarias (del corpus, MEDIUM)

- `nuxt/nuxt` issues #21232/#12480 (`.nojekyll` con generate vs preset), #31551/#22225/#15091/#12892 (assets 404 bajo subpath) — vía PITFALLS.md/STACK.md.
- `.planning/config.json` — `nyquist_validation: true`, `commit_docs: true`, pnpm/quality. **HIGH (leído esta sesión).**

### Entorno (verificado esta sesión)

- `node --version` → 22.20.0; `pnpm --version` → 10.32.1; `npm/npx` → 11.15.0.
- `git diff --stat origin/main -- index.html` → **vacío** (índice.html de `release/nuxt-4` idéntico a `origin/main`, confirma D-05). **HIGH.**
- Listado de raíz: solo `index.html`, `favicon.svg`, `apple-touch-icon.svg`, `CLAUDE.md`, `.planning/`, `.git/` (sin proyecto Nuxt previo → scaffold limpio). **HIGH.**

---

## Metadata

**Confidence breakdown:**
- Standard stack / versiones: **HIGH** — re-verificadas contra npm hoy; subconjunto de STACK.md (ya HIGH).
- Config (`nuxt.config.ts`, subpath, fonts, color-mode): **HIGH** — derivada del corpus + docs oficiales verificadas esta sesión.
- CSS extraction: **HIGH** — mapa de líneas verificado en el `index.html`; estrategia verbatim de STACK.md.
- Golden capture (mecánica Playwright): **HIGH** — docs verificadas; anclas/fichas leídas en el `index.html`.
- Golden determinismo (heros remotas): **MEDIUM** — decisión de ingeniería con 3 opciones válidas (A5).
- Localización ficha `guided`: **MEDIUM** — confirmar `id` al planificar (Open Q1).
- Dormant backend / estructura: **HIGH** — convención Nuxt 4 verificada; ARCHITECTURE.md.

**Research date:** 2026-06-18
**Valid until:** ~2026-07-18 (stack estable; revalidar versiones si pasa >30 días o si Nuxt 4.5/Content 3.x publican cambios de SSG/subpath).
