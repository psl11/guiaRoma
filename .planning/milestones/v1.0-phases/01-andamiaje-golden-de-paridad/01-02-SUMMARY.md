---
phase: 01-andamiaje-golden-de-paridad
plan: 02
subsystem: infra
tags: [nuxt4, scaffold, pnpm, css-verbatim, design-tokens, eslint, color-mode, nuxt-fonts, nuxt-content, ssg]

# Dependency graph
requires:
  - phase: 01-01
    provides: "package.json (privado, packageManager pnpm@10.32.1, scripts test:golden*), playwright.config.ts, tests/parity/ (golden de 56 PNGs), .gitignore base"
provides:
  - "Scaffold Nuxt 4 en la raíz del repo (srcDir=app/, D-01) con pnpm (pnpm-lock.yaml, D-03), compilable: nuxt dev arranca y nuxt generate compila a estático sin errores"
  - "nuxt.config.ts completo: 4 módulos (@nuxt/content, @nuxtjs/color-mode, @nuxt/fonts, @nuxt/eslint), app.baseURL=/guiaRoma/, css en orden tokens->base->leaflet, colorMode (roma-theme/data-theme/fallback:light), fonts self-host (3 familias), TS estricto, eslint stylistic"
  - "CSS editorial del index.html extraído VERBATIM a app/assets/css/ (tokens 33L + base 1308L + leaflet 849L) como CSS global, sin @layer ni scoped — paridad por construcción (CLAUDE.md decisión #5)"
  - "Tooling verde: pnpm lint (exit 0, PLAT-03), pnpm typecheck (TS estricto, exit 0, PLAT-02), pnpm generate (SSR-en-build ON, exit 0, PLAT-01)"
  - "Las 3 familias self-hosteadas en build vía @nuxt/fonts (10 woff2 bajo _fonts/, incl. itálicas de Cormorant/Lora) — sin <link> a Google Fonts en el flujo Nuxt (BUILD-02 fuentes)"
affects: [Fase 2 (datos/colecciones Nuxt Content + esquema zod), Fase 3 (tema/color-mode + ThemeToggle), Fase 7 (mapa Leaflet), Plan 01-03 (subpath final + .nojekyll + server dormido + verificación build), todas las fases que rendericen UI sobre el CSS verbatim]

# Tech tracking
tech-stack:
  added:
    - "nuxt@4.4.8"
    - "@nuxt/content@3.14.0"
    - "zod@4.4.3"
    - "@nuxtjs/color-mode@4.0.1"
    - "@nuxt/fonts@0.14.0"
    - "minisearch@7.2.0"
    - "leaflet@1.9.4"
    - "@nuxt/eslint@1.16.0 + eslint@10.5.0 (vía nuxi module add eslint, flat config)"
    - "@types/leaflet@1.9.21 (dev)"
    - "prettier@3.8.4 (dev)"
    - "better-sqlite3@12.11.1 (dev, build-time — desviación Rule 3, conector SQLite por defecto de @nuxt/content)"
  patterns:
    - "Scaffold a mano en raíz no vacía (vía B) — preserva index.html/favicon.svg/apple-touch-icon.svg (D-02), evita que nuxi init . los toque (Pitfall 1)"
    - "CSS editorial VERBATIM como CSS global en css:[] (orden tokens->base->leaflet), sin @layer/scoped/SCSS — preserva la cascada y los selectores cruzados"
    - "Una sola herramienta de formato: @nuxt/eslint config.stylistic:true (sin Prettier en el flujo de lint)"
    - "Contrato de tema unificado: colorMode dataValue:'theme' + storageKey:'roma-theme' reproduce el mecanismo del index.html que el golden ya valida"

key-files:
  created:
    - "nuxt.config.ts"
    - "tsconfig.json"
    - "eslint.config.mjs"
    - "content.config.ts"
    - "app/app.vue"
    - "app/assets/css/tokens.css"
    - "app/assets/css/base.css"
    - "app/assets/css/leaflet.css"
  modified:
    - "package.json (fusiona scripts Nuxt con los de golden; añade deps + pnpm.onlyBuiltDependencies)"
    - "pnpm-lock.yaml"
    - ".gitignore (ignora .data — caché SQLite de Content)"

key-decisions:
  - "Vía B (scaffold a mano) en lugar de nuxi init .: el set de scaffold es pequeño y así se garantiza que la raíz no vacía (index.html/favicons/.planning) queda intacta (D-02/Pitfall 1)"
  - "better-sqlite3 como conector SQLite de @nuxt/content (default que el módulo nombra y autoinstala): elegido sobre el node:sqlite nativo experimental para no depender de una feature experimental ni de la versión de Node en CI; es dependencia SOLO de build (el sitio final es 100% estático)"
  - "CSS verbatim NO necesitó excluirse del lint para preservarse (ESLint flat config no procesa .css); aun así se añadió app/assets/css/** a ignores de eslint.config.mjs para blindarlo ante reglas futuras"
  - "tests/parity/** (harness Playwright del golden 01-01) excluido del lint Nuxt: es una suite E2E independiente con su propio runtime/contexto TS, nunca fue parte del código fuente Nuxt"

patterns-established:
  - "Extracción verbatim por rangos de línea con sed + verificación V4 por diff textual contra el index.html (cero alteración de valores/selectores)"
  - "Saneamiento mínimo de CSS no-op: eliminar llaves '}' sobrantes del fuente (que el navegador ignora) para satisfacer al parser estricto de PostCSS sin tocar el render"

requirements-completed: [PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, BUILD-02]

# Metrics
duration: 9min
completed: 2026-06-18
---

# Fase 1 Plan 02: Andamiaje Nuxt 4 + CSS verbatim Summary

**Scaffold Nuxt 4 en la raíz (pnpm, srcDir=app/, módulos del stack registrados, TS estricto + @nuxt/eslint stylistic) con el CSS editorial del index.html extraído VERBATIM a tokens/base/leaflet (cargado tokens->base->leaflet), fuentes self-hosteadas por @nuxt/fonts, y `pnpm lint && typecheck && generate` en verde — el esqueleto compilable sobre el que se construye la app, con paridad CSS por construcción.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-18T21:48:00Z
- **Completed:** 2026-06-18T21:57:42Z
- **Tasks:** 2
- **Files modified:** 8 creados + 3 modificados

## Accomplishments

- **Scaffold Nuxt 4 en raíz no vacía sin romper nada (D-01/D-02, Pitfall 1):** vía B (a mano) — se escribieron `nuxt.config.ts`, `tsconfig.json`, `app/app.vue`, `content.config.ts` y se generó `eslint.config.mjs` (`nuxi module add eslint`), sin que `index.html`/`favicon.svg`/`apple-touch-icon.svg` se tocaran (verificado: `git status --porcelain` de los 3 ficheros VACÍO).
- **Stack completo instalado con pnpm (gate de paquetes pre-aprobado):** nuxt@4.4.8, @nuxt/content@3.14.0, zod@4.4.3, @nuxtjs/color-mode@4.0.1, @nuxt/fonts@0.14.0, minisearch@7.2.0, leaflet@1.9.4, @nuxt/eslint@1.16.0 + eslint@10.5.0, @types/leaflet@1.9.21, prettier@3.8.4. Lockfile commiteado.
- **`nuxt.config.ts` completo y prescriptivo:** 4 módulos, `app.baseURL='/guiaRoma/'`, `css:[]` en orden tokens->base->leaflet, `colorMode` (dataValue:'theme', storageKey:'roma-theme', fallback:'light', preference:'system', classSuffix:''), `fonts.families` con las 3 familias y los pesos/itálicas EXACTOS de index.html L13, `typescript.strict:true`, `eslint.config.stylistic:true`. **SIN `ssr:false`** (anti-patrón verificado: `grep -c 'ssr: *false'` == 0).
- **CSS editorial VERBATIM en 3 ficheros globales (PLAT-04):** `leaflet.css` (L15-863, 849 líneas), `tokens.css` (L866-898, 33 líneas: `:root` + `[data-theme="dark"]`), `base.css` (L900-2209, 1308 líneas tras saneamiento). Verificación V4 por diff textual: cada fichero es **byte-idéntico** a su rango fuente; el combinado tokens+base reproduce todo el `<style>` editorial. Sin `@layer`, sin `scoped`, sin SCSS/PostCSS extra.
- **Tooling verde (PLAT-01/02/03):** `pnpm lint` exit 0, `pnpm typecheck` (TS estricto) exit 0, `pnpm generate` exit 0. El `.output/public/index.html` contiene HTML real (`<div id="scaffold">…`), confirmando **SSR-en-build ON** (no SPA shell vacío).
- **Fuentes self-hosteadas (BUILD-02):** `@nuxt/fonts` descargó y cacheó las 3 familias en build (10 woff2 bajo `_fonts/`, incl. itálicas de Cormorant Garamond y Lora). El `<link>` a Google Fonts del index.html NO se portó al flujo Nuxt.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Tarea 1: Verificación de paquetes (gate pre-aprobado) + scaffold Nuxt 4 en raíz (Pitfall 1, vía B) + tooling + config** - `e26f32a` (chore)
2. **Tarea 2: Extraer el CSS editorial verbatim a tokens/base/leaflet + validar build+lint+typecheck** - `a02b059` (feat)

**Metadata del plan:** commit final (docs) con SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md.

## Files Created/Modified

- `nuxt.config.ts` — Config raíz: 4 módulos, baseURL, css en orden, colorMode, fonts self-host, TS estricto, eslint stylistic. (Reordenado por `nuxt/nuxt-config-keys-order` vía lint --fix; valores intactos.)
- `tsconfig.json` — Extiende `./.nuxt/tsconfig.json` (estricto, generado por Nuxt).
- `eslint.config.mjs` — Flat config (`withNuxt`) + `ignores: ['app/assets/css/**', 'tests/parity/**']`.
- `content.config.ts` — Stub: `defineContentConfig({ collections: {} })`. El esquema zod real de las colecciones es Fase 2.
- `app/app.vue` — Placeholder mínimo (`<div id="scaffold">guiaRoma — scaffold (Fase 1)</div>`) que produce HTML real en generate.
- `app/assets/css/tokens.css` — `:root` + `[data-theme="dark"]` verbatim (sistema de design tokens).
- `app/assets/css/base.css` — reset/tipografía/componentes editoriales verbatim (incl. filtro dark de tiles `[data-theme="dark"] .leaflet-tile`).
- `app/assets/css/leaflet.css` — CSS de Leaflet 1.9.4 inline verbatim.
- `package.json` — Scripts Nuxt (dev/build/generate/preview/typecheck/lint/lint:fix) fusionados con los de golden (test:golden*); deps del stack; `pnpm.onlyBuiltDependencies: ['better-sqlite3']`.
- `pnpm-lock.yaml` — Lockfile (mitigación cadena de suministro).
- `.gitignore` — Añadido `.data` (caché SQLite local de @nuxt/content).

## Decisions Made

- **Scaffold vía B (a mano)** en raíz no vacía, en lugar de `nuxi init .`, para garantizar D-02 (raíz intacta). El set es pequeño y `nuxi module add eslint` se ejecutó sobre un `nuxt.config.ts` mínimo previo (luego reemplazado por el completo).
- **`content.config.ts` con `collections: {}`**: registra `@nuxt/content` sin definir colecciones reales (Fase 2). Genera un `WARN` benigno ("falling back to default collection") que NO rompe el build.
- **`tests/parity/**` fuera del lint Nuxt** y **`app/assets/css/**` también ignorado**: ver desviación Rule 3 abajo.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Eliminadas 2 llaves `}` sobrantes del CSS fuente (latentes en index.html)**
- **Found during:** Tarea 2 (al ejecutar `pnpm generate`).
- **Issue:** El `<style>` editorial del index.html tiene **2 llaves de cierre de más** (294 `{` vs 296 `}`): llaves `}` huérfanas en index.html L1386 y L1528 (en base.css quedaban en L487 y, tras el primer arreglo, L628). El navegador las **ignora silenciosamente** (la guía viva y el golden de 01-01 renderizan correctamente con ellas), pero el parser estricto de PostCSS/Vite las rechaza con `CssSyntaxError: Unexpected }`, abortando el build.
- **Fix:** Eliminadas las 2 `}` huérfanas. Confirmado por análisis de profundidad de llaves que cierran a nivel 0 sin bloque abierto (no parte de ningún `@media`): son no-op puro. base.css quedó balanceado (292/292). La paridad visual se preserva exactamente (las llaves no tenían efecto de render).
- **Files modified:** app/assets/css/base.css
- **Verification:** `pnpm generate` pasa exit 0; `tokens.css`/`leaflet.css` siguen byte-idénticos al fuente (solo base.css cambia, en 2 líneas no-op).
- **Committed in:** `a02b059` (Tarea 2)

**2. [Rule 3 - Blocking] Instalado `better-sqlite3` (dev, build-time) — conector SQLite de @nuxt/content**
- **Found during:** Tarea 2 (al ejecutar `pnpm typecheck`, luego `pnpm generate`).
- **Issue:** `@nuxt/content` v3 requiere un adaptador SQLite para prerenderizar su base de datos en build (`ERROR Nuxt Content requires better-sqlite3 module to operate`). Intentaba autoinstalarlo por un prompt interactivo de consola que falla en shell no-TTY (`uv_tty_init returned EINVAL`), bloqueando typecheck y generate.
- **Fix:** `pnpm add -D better-sqlite3@12.11.1` — es el conector **por defecto que el propio módulo @nuxt/content nombra y autoinstala** (db0/connectors/better-sqlite3), no un alternativo similar. Se eligió sobre el `node:sqlite` nativo (experimental en Node 22) para no depender de una feature experimental ni de la versión de Node en CI. Es dependencia SOLO de build: el sitio desplegado es 100% estático. Su build script nativo se permitió vía `pnpm.onlyBuiltDependencies` + `pnpm rebuild better-sqlite3` (descargó binario prebuilt). NO es un install Rule-3-excluido arbitrario: es el paquete canónico que la dependencia oficial exige por nombre.
- **Files modified:** package.json, pnpm-lock.yaml
- **Verification:** `node -e "require('better-sqlite3')"` carga OK; `pnpm typecheck` y `pnpm generate` pasan exit 0.
- **Committed in:** `a02b059` (Tarea 2)

**3. [Rule 3 - Blocking] `eslint.config.mjs`: ignorar `app/assets/css/**` y `tests/parity/**`**
- **Found during:** Tarea 2 (al ejecutar `pnpm lint` tras `generate`, que completó los tipos `.nuxt` y activó el ruleset completo).
- **Issue:** (a) El harness del golden `tests/parity/golden.spec.ts` (Plan 01-01) daba `Parsing error: Unexpected token Page` — el parser por defecto choca con su sintaxis TS válida (`type Page`), porque @nuxt/eslint no aplica el parser TS fuera del scope de la app y los paquetes del parser no están hoisteados a la raíz para un override explícito. (b) Para blindar el CSS verbatim ante reglas futuras.
- **Fix:** `ignores: ['app/assets/css/**', 'tests/parity/**']`. `tests/parity/**` es una suite E2E Playwright independiente (nunca fue código fuente Nuxt ni se lintaba antes); `app/assets/css/**` es CSS verbatim que no debe reformatearse (de hecho ESLint flat config no procesa `.css`, pero el ignore lo deja explícito). Se respeta así el golden de 01-01 INTACTO y el verbatim.
- **Files modified:** eslint.config.mjs
- **Verification:** `pnpm exec eslint .` pasa exit 0; `git status --porcelain tests/` VACÍO (golden intacto).
- **Committed in:** `a02b059` (Tarea 2)

**Ajuste menor (no es desviación de alcance):** `nuxt.config.ts` se reordenó por la regla `nuxt/nuxt-config-keys-order` vía `eslint --fix` (modules, app, css, colorMode, typescript, eslint, fonts). Los valores son idénticos; solo cambia el orden de las claves. `.gitignore` recibió `.data` (caché SQLite de Content) para no versionar artefactos de build.

---

**Total deviations:** 3 auto-arregladas (1 bug Rule 1, 2 blocking Rule 3).
**Impact on plan:** Todas necesarias para el objetivo central del plan (esqueleto compilable con build+lint+typecheck en verde y CSS verbatim). Cero scope creep: el stack, las decisiones (D-01/D-02/D-03, vía B, css en orden, colorMode, fonts), y la extracción verbatim son exactamente los del plan. Las desviaciones corrigen (a) un error de sintaxis latente del CSS fuente que el navegador toleraba pero el build no, (b) una dependencia de build que la propia librería oficial exige, y (c) el scope de lint para no romper el golden ni el verbatim.

## Issues Encountered

- **Warning benigno de @nuxt/content:** `No content configuration found, falling back to default collection`. Esperado: el stub `content.config.ts` tiene `collections: {}` (el esquema real es Fase 2). No rompe lint/typecheck/generate.
- **Build scripts ignorados por pnpm** (esbuild, @parcel/watcher, unrs-resolver, better-sqlite3): el cinturón de seguridad de pnpm 10. Solo `better-sqlite3` necesitaba compilar; se permitió explícitamente. Los demás no requieren postinstall para el build (esbuild lo invoca Vite directamente).

## Known Stubs

- `app/app.vue` — placeholder mínimo (`<div id="scaffold">…`). **Intencional y documentado:** Fase 1 solo necesita que `generate` produzca HTML real (no SPA shell). La composición real (TripView, layout, páginas) llega en Fase 2+.
- `content.config.ts` — `collections: {}` vacío. **Intencional:** registra el módulo; el esquema zod de las 6 colecciones del viaje es Fase 2 (por diseño del plan).

Ningún stub llega a una UI con datos vacíos engañosos: la app aún no renderiza contenido del viaje (eso es Fase 2+). No bloquean el objetivo de este plan (esqueleto compilable + CSS verbatim).

## User Setup Required

None - no external service configuration required. La instalación de paquetes se realizó con el gate de legitimidad pre-aprobado por el orquestador (todos paquetes oficiales de la org Nuxt o canónicos, versiones latest verificadas el 2026-06-18).

## Next Phase Readiness

- **Esqueleto Nuxt 4 listo y compilable.** `pnpm dev` arranca, `pnpm generate` produce `.output/public` estático con HTML real y fuentes self-hosteadas. Lint + typecheck verdes.
- **CSS verbatim cargado** como red de paridad por construcción para todas las fases de UI.
- **Plan 01-03 (siguiente en esta fase):** afinar el subpath final `/guiaRoma/` (preset `github_pages` + `.nojekyll`), dejar `server/` dormido (`server/api/README.md`, sin `*.ts`), copiar favicons a `public/` (A4), y verificar el build local (0× 404 de `/_nuxt/*`, 0× CDN, `.nojekyll` presente). **Nota:** este plan NO fijó `nitro.preset` ni creó `server/`/`public/.nojekyll` (es territorio del 01-03, como prescribe el plan).
- **Fase 2:** definir el esquema zod real en `content.config.ts` y migrar el contenido a YAML `type:'data'` (resolverá el warning de "default collection").
- **Concern (heredado):** el conector `better-sqlite3` es de build; verificar que el workflow de CI del 01-03/deploy compila con la versión de Node del runner (better-sqlite3 trae binarios prebuilt para Node LTS; si el runner usa una versión sin prebuilt, compilará con node-gyp). Documentado para el Plan 03.

## Self-Check: PASSED

- Ficheros creados verificados en disco: `nuxt.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `content.config.ts`, `app/app.vue`, `app/assets/css/{tokens,base,leaflet}.css`, `01-02-SUMMARY.md`.
- Commits verificados en git: `e26f32a` (Tarea 1), `a02b059` (Tarea 2).
- Gates verdes: `pnpm lint` exit 0, `pnpm typecheck` exit 0, `pnpm generate` exit 0.
- D-02: `git status --porcelain index.html favicon.svg apple-touch-icon.svg` VACÍO. Golden 01-01 (`tests/`) intacto.

---
*Phase: 01-andamiaje-golden-de-paridad*
*Completed: 2026-06-18*
