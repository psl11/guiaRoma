---
phase: 01-andamiaje-golden-de-paridad
verified: 2026-06-19T00:45:00Z
status: passed
score: 14/14
overrides_applied: 0
---

# Fase 1: Andamiaje + Golden de paridad — Informe de verificación

**Objetivo de la fase:** Dejar el proyecto Nuxt 4 arrancando y compilando a estático bajo el subpath de producción `/guiaRoma/`, con el CSS editorial conservado verbatim y el backend Nitro presente pero dormido, y capturar el golden de Playwright desde el `index.html` antes de que la rama de release diverja — la referencia objetiva contra la que se medirá toda la paridad posterior.

**Verificado:** 2026-06-19T00:45:00Z
**Estado:** PASSED
**Re-verificación:** No — verificación inicial

---

## Logro del objetivo

### Verdades observables

| #  | Verdad | Estado | Evidencia |
|----|--------|--------|-----------|
| 1  | `nuxt dev` arranca y `nuxt generate` compila a estático sin errores | VERIFICADO | `pnpm generate` → exit 0; `.output/public/index.html` con HTML real (SSR-en-build ON, no SPA shell) |
| 2  | TypeScript estricto activo en todo el proyecto | VERIFICADO | `pnpm typecheck` → exit 0; `tsconfig.json` extiende `./.nuxt/tsconfig.json`; `typescript: { strict: true }` en `nuxt.config.ts` |
| 3  | Lint (`@nuxt/eslint` + stylistic) pasa limpio | VERIFICADO | `pnpm lint` → exit 0; `eslint.config.mjs` con `ignores: ['app/assets/css/**', 'tests/parity/**']` correctamente configurado |
| 4  | El sitio generado se sirve bajo `/guiaRoma/` sin ningún 404 de `/_nuxt/*` | VERIFICADO | `pnpm exec playwright test tests/parity/subpath.spec.ts` → 2 passed (mobile + desktop); `page.on('response')` asserta 0 status≥400 para `/_nuxt/*`; sanity-check positivo confirma que el test es significativo |
| 5  | Sin dependencias de CDN en runtime (fuentes y Leaflet self-hosteados) | VERIFICADO | `page.on('request')` → `cdnRequests.length === 0`; 10 woff2 self-hosted en `.output/public/_fonts/`; sin `fonts.googleapis.com`/`fonts.gstatic.com`/`unpkg.com` en el output generado |
| 6  | El CSS editorial (~2.200 líneas) vive como CSS global en `app/assets/css/` sin reescribirse | VERIFICADO | `tokens.css` (33 líneas), `base.css` (1308 líneas), `leaflet.css` (849 líneas); sin `@layer`; sin `scoped`; cargados en orden tokens→base→leaflet desde `nuxt.config.ts`; `scroll-padding-top: 124px` presente en `base.css`; `.leaflet-container` en `leaflet.css` |
| 7  | El CSS se carga una sola vez desde `nuxt.config.ts`, en orden correcto | VERIFICADO | `css: ['~/assets/css/tokens.css', '~/assets/css/base.css', '~/assets/css/leaflet.css']` — orden y entrada únicos confirmados |
| 8  | `server/` existe con `server/api/README.md` y cero endpoints activos | VERIFICADO | `server/api/README.md` contiene "DORMIDO"; `find server -name '*.ts' -o -name '*.js' | wc -l` = 0; `nuxt generate` sigue produciendo estático |
| 9  | El sitio se genera estático con SSR-en-build ON (sin `ssr: false`) | VERIFICADO | `grep -c 'ssr: *false' nuxt.config.ts` = 0; el HTML generado contiene `<div id="scaffold">` (no SPA shell vacío) |
| 10 | `public/.nojekyll` existe en repositorio y en `.output/public/` tras el generate | VERIFICADO | `public/.nojekyll` (vacío en repo) confirmado; `.output/public/.nojekyll` confirmado tras `pnpm generate` |
| 11 | El `index.html` generado referencia assets bajo `/guiaRoma/_nuxt/` | VERIFICADO | `grep -c '/guiaRoma/_nuxt/' .output/public/index.html` = 1; favicons como `/guiaRoma/favicon.svg` y `/guiaRoma/apple-touch-icon.svg` |
| 12 | Existen screenshots golden de las 14 vistas de D-04 en claro/oscuro y móvil/desktop, versionados | VERIFICADO | `git ls-files tests/parity | grep -c '.png'` = 56 (14 vistas × 2 temas × 2 viewports); todos en `tests/parity/golden.spec.ts-snapshots/` |
| 13 | El golden es determinista (segunda ejecución sin `--update` pasa verde) | VERIFICADO | `pnpm exec playwright test tests/parity/golden.spec.ts --project=desktop` → 2 passed (golden light + golden dark); confirmado que el settle() con imágenes lazy→eager + `fonts.ready` + doble rAF neutraliza el flakiness |
| 14 | El golden se capturó del `index.html` actual ANTES de que existiera código Nuxt | VERIFICADO | `git show f9cca6a --name-only` muestra el árbol en el momento del commit del golden: `package.json`, `playwright.config.ts`, `tests/` — sin `nuxt.config.ts` ni `app/` (D-05 honrado) |

**Puntuación:** 14/14 verdades verificadas

---

### Artefactos requeridos

| Artefacto | Función declarada | Estado | Detalle |
|-----------|-------------------|--------|---------|
| `playwright.config.ts` | Harness del golden: webServer estático, proyectos mobile/desktop, determinismo, snapshotPathTemplate sin plataforma (A8) | VERIFICADO | Contiene `toHaveScreenshot`, `iPhone 12`, `1280`, `snapshotPathTemplate` sin `{platform}`; proyectos `mobile` y `desktop` con `browserName: 'chromium'` |
| `tests/parity/golden.spec.ts` | Captura de las 14 vistas de D-04 en light+dark | VERIFICADO | Array `VIEWS` con exactamente 14 entradas; fuerza tema oscuro vía `localStorage['roma-theme']='dark'`; bloquea imágenes con `page.route().abort()` (A5); `settle()` determinista |
| `tests/parity/golden.spec.ts-snapshots/` | 56 PNGs golden versionados | VERIFICADO | 56 ficheros en git (`git ls-files | grep -c .png` = 56 ≥ 44 exigido); nomenclatura `{vista}-{tema}-{viewport}.png` |
| `nuxt.config.ts` | Config raíz: módulos, css[], colorMode, fonts, TS estricto, baseURL, nitro | VERIFICADO | 4 módulos; `app.baseURL: '/guiaRoma/'`; `css:[]` en orden; `colorMode` con `dataValue:'theme'`, `storageKey:'roma-theme'`, `fallback:'light'`; `fonts.families` con las 3 familias y pesos/itálicas exactos; `typescript.strict:true`; `nitro.preset: 'github_pages'`; `prerender.failOnError: true`; sin `ssr: false` |
| `app/assets/css/tokens.css` | `:root` + `[data-theme="dark"]` verbatim | VERIFICADO | 33 líneas; contiene `:root {` y `[data-theme="dark"]`; sin `@layer`; sin `scoped` |
| `app/assets/css/base.css` | reset/tipografía/componentes editoriales verbatim | VERIFICADO | 1308 líneas; contiene `scroll-padding-top: 124px`; sin `@layer` |
| `app/assets/css/leaflet.css` | CSS de Leaflet 1.9.4 verbatim + filtro dark de tiles | VERIFICADO | 849 líneas; contiene `.leaflet-container` (22 ocurrencias); sin `@layer` |
| `app/app.vue` | Placeholder mínimo (SSR-en-build ON; favicons bajo subpath con `useHead`) | VERIFICADO | Produce HTML real en generate; `useHead` con `useRuntimeConfig().app.baseURL` para los favicons |
| `content.config.ts` | Stub de módulo `@nuxt/content` sin colecciones (esquema real = Fase 2) | VERIFICADO | `defineContentConfig({ collections: {} })` — módulo registrado, sin definiciones reales |
| `server/api/README.md` | Backend Nitro dormido documentado | VERIFICADO | Contiene "DORMIDO"; texto exacto del plan; único contenido bajo `server/` |
| `public/.nojekyll` | Archivo vacío para que GitHub Pages no ignore `/_nuxt/` | VERIFICADO | Existe y está vacío |
| `public/favicon.svg` / `public/apple-touch-icon.svg` | Copias bajo el subpath (A4; los originales en raíz intactos — D-02) | VERIFICADO | Ambos presentes en `public/`; raíz intacta (`git status --porcelain index.html favicon.svg apple-touch-icon.svg` vacío) |
| `tests/parity/subpath.spec.ts` | Smoke autocontenido: 0×404 de `/_nuxt/*` y 0 peticiones a CDNs | VERIFICADO | Contiene `page.on(` (3 ocurrencias); referencia `/_nuxt/`; `pnpm exec playwright test tests/parity/subpath.spec.ts` → 2 passed |
| `eslint.config.mjs` | Flat config con `stylistic`, ignora CSS verbatim y harness Playwright | VERIFICADO | Generado por `nuxi module add eslint`; `ignores: ['app/assets/css/**', 'tests/parity/**']` |
| `tsconfig.json` | Extiende configuración estricta generada por Nuxt | VERIFICADO | `{"extends": "./.nuxt/tsconfig.json"}` |
| `package.json` | Scripts Nuxt + golden + subpath; packageManager pnpm@10.32.1 | VERIFICADO | Scripts: `dev`, `build`, `generate`, `preview`, `typecheck`, `lint`, `lint:fix`, `test:golden`, `test:golden:update`, `test:subpath`; `packageManager: pnpm@10.32.1` |

---

### Verificación de enlaces clave (Key Links)

| De | A | Via | Estado | Detalle |
|----|---|-----|--------|---------|
| `nuxt.config.ts` | `app/assets/css/{tokens,base,leaflet}.css` | `css: []` en orden tokens→base→leaflet | CABLEADO | Confirmado: el CSS se carga en el orden correcto |
| `nuxt.config.ts` | `@nuxtjs/color-mode` (roma-theme / data-theme) | `colorMode: { dataValue:'theme', storageKey:'roma-theme', fallback:'light' }` | CABLEADO | El HTML generado incluye el script anti-FOUC con `getStorageValue`/`roma-theme`/`__NUXT_COLOR_MODE__` |
| `nuxt.config.ts` | `@nuxt/fonts` (3 familias self-host) | `fonts.families` con Cormorant Garamond, Lora, JetBrains Mono | CABLEADO | 10 woff2 presentes en `.output/public/_fonts/`; sin Google Fonts CDN en el output |
| `nuxt.config.ts` | GitHub Pages subpath `/guiaRoma/` | `app.baseURL + nitro.preset 'github_pages' + failOnError` | CABLEADO | `grep -q 'github_pages' nuxt.config.ts` ✓; `grep -q 'failOnError' nuxt.config.ts` ✓ |
| `tests/parity/golden.spec.ts` | `index.html` (servido en localhost:4173) | `page.goto('/index.html')` tras webServer estático | CABLEADO | `goto('/index.html')` presente; webServer en `playwright.config.ts` sirve la raíz |
| `tests/parity/golden.spec.ts` | `localStorage['roma-theme']='dark'` | `page.addInitScript` para forzar el tema oscuro de forma determinista | CABLEADO | `roma-theme` presente en el spec (2 ocurrencias); mecanismo addInitScript verificado |
| `tests/parity/subpath.spec.ts` | `.output/public` servido bajo `/guiaRoma/` | `page.on()` asserta status<400 para `/_nuxt/*`; asserta 0 a CDNs | CABLEADO | `page.on(` = 3 ocurrencias; test pasa en verde |

---

### Cobertura de requisitos

| Requisito | Plan | Descripción | Estado | Evidencia |
|-----------|------|-------------|--------|-----------|
| PLAT-01 | 01-02 | `nuxt generate` compila sin errores | SATISFECHO | `pnpm generate` exit 0 |
| PLAT-02 | 01-02 | TypeScript en modo estricto | SATISFECHO | `typescript: { strict: true }` en `nuxt.config.ts`; `pnpm typecheck` exit 0 |
| PLAT-03 | 01-02 | ESLint + Prettier (`@nuxt/eslint`) pasa limpio | SATISFECHO | `pnpm lint` exit 0; `eslint.config.mjs` con `stylistic: true` |
| PLAT-04 | 01-02 | CSS editorial conservado como CSS global sin reescribirse | SATISFECHO | 3 ficheros CSS verbatim (2190 líneas total); sin `@layer`/`scoped` |
| PLAT-05 | 01-02/03 | Estructura de carpetas Nuxt 4 establecida | SATISFECHO (nota) | `app/`, `public/`, `server/`, `nuxt.config.ts` establecidos. `content/` y `shared/` no existen todavía — no son necesarios para el build de Fase 1 y se crearán implícitamente en Fase 2 (DATA-01..06). No es un blocker |
| ARCH-03 | 01-03 | `server/` presente pero dormido, sin endpoints activos | SATISFECHO | `server/api/README.md` con "DORMIDO"; `find server -name '*.ts' -o -name '*.js'` = 0 |
| BUILD-01 | 01-03 | Sitio estático bajo `/guiaRoma/` sin 404 de `/_nuxt/*` y con `.nojekyll` | SATISFECHO | subpath.spec.ts → 2 passed; `.output/public/.nojekyll` existe |
| BUILD-02 | 01-02/03 | Offline: Leaflet y fuentes self-hosteados (sin CDN) | SATISFECHO | 0 peticiones a CDN en el test de subpath; 10 woff2 en `_fonts/` |
| BUILD-03 | 01-03 | App funciona servida desde el subpath de producción | SATISFECHO | subpath.spec.ts asserta 0 errores de consola; 2 passed |
| PARITY-01 | 01-01 | Golden capturado del `index.html` original antes de divergir | SATISFECHO | 56 PNGs versionados en git; captura anterior a cualquier código Nuxt (verificado por árbol del commit f9cca6a); determinismo confirmado |

---

### Comprobaciones de anti-patrones

| Fichero | Patrón | Severidad | Impacto |
|---------|--------|-----------|---------|
| `app/app.vue` | `<div id="scaffold">guiaRoma — scaffold (Fase 1)</div>` | Informativo | Stub declarado e intencionalmente documentado; no llega a UI con datos engañosos; la composición real es Fase 2+ |
| `content.config.ts` | `collections: {}` vacío | Informativo | Stub declarado e intencionalmente documentado; el esquema zod real es Fase 2; genera un WARN benigno en build |

Sin marcadores TBD, FIXME, XXX, TODO ni HACK en ningún fichero modificado por la fase. Los dos stubs son de naturaleza de andamiaje y están documentados como intencionales en los SUMMARYs.

---

### Verificación de comportamiento (spot-checks)

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| `pnpm generate` compila sin errores | `pnpm generate` | exit 0; 5 rutas prerenderizadas | PASS |
| `pnpm lint` pasa limpio | `pnpm lint` | exit 0; sin warnings | PASS |
| `pnpm typecheck` pasa con TS estricto | `pnpm typecheck` | exit 0; solo WARN benigno de @nuxt/content | PASS |
| Subpath `/guiaRoma/` sin 404 ni CDN | `playwright test tests/parity/subpath.spec.ts` | 2 passed en 2.9s | PASS |
| Golden determinista (desktop) | `playwright test golden.spec.ts --project=desktop` | 2 passed en 38.4s | PASS |
| 56 PNGs versionados en git | `git ls-files tests/parity \| grep -c .png` | 56 | PASS |
| Sin `ssr: false` en config | `grep -c 'ssr: *false' nuxt.config.ts` | 0 | PASS |
| 0 endpoints en server/ | `find server -name '*.ts' -o -name '*.js' \| wc -l` | 0 | PASS |
| `.output/public/.nojekyll` tras generate | `test -f .output/public/.nojekyll` | OK | PASS |
| HTML generado referencia `/guiaRoma/_nuxt/` | `grep -c '/guiaRoma/_nuxt/' .output/public/index.html` | 1 | PASS |
| Golden capturado antes de código Nuxt | `git ls-tree f9cca6a --name-only` | Sin `nuxt.config.ts` ni `app/` | PASS |
| Raíz intacta (D-02) | `git status --porcelain index.html favicon.svg apple-touch-icon.svg` | vacío | PASS |

---

### Verificación de decisiones D-01..D-06

| Decisión | Descripción | Estado | Evidencia |
|----------|-------------|--------|-----------|
| D-01 | Proyecto en la raíz con `srcDir=app/` | HONRADA | `nuxt.config.ts` en raíz; `app/app.vue` y `app/assets/css/` bajo `app/` |
| D-02 | `index.html`, `favicon.svg`, `apple-touch-icon.svg` de la raíz intactos | HONRADA | `git status --porcelain index.html favicon.svg apple-touch-icon.svg` vacío |
| D-03 | pnpm como gestor de paquetes | HONRADA | `package.json` → `packageManager: pnpm@10.32.1`; `pnpm-lock.yaml` presente y versionado |
| D-04 | Alcance del golden: home + 5 días + 3 fichas-tipo + 5 referencias = 14 vistas | HONRADA | Array `VIEWS` con 14 entradas exactas; 56 PNGs (14 × 2 × 2) |
| D-05 | Golden capturado del `index.html` actual en local, antes de divergir, versionado | HONRADA | Árbol del commit `f9cca6a` sin código Nuxt; 56 PNGs en git |
| D-06 | Verificación solo local, sin CI ni deploy real | HONRADA | `tests/parity/subpath.spec.ts` autocontenido (vía B); ningún workflow de deploy creado; `main` intacto |

---

### Criterios de éxito del ROADMAP §Fase 1

| # | Criterio | Estado | Evidencia |
|---|----------|--------|-----------|
| 1 | `nuxt dev` arranca y `nuxt generate` compila sin errores, con TS estricto y lint limpio | VERIFICADO | `pnpm generate` exit 0; `pnpm typecheck` exit 0; `pnpm lint` exit 0 |
| 2 | Sitio bajo `/guiaRoma/` sin 404 de `/_nuxt/*`, con Leaflet y 3 fuentes self-hosteados | VERIFICADO | subpath.spec.ts → 2 passed; 0 CDN; 10 woff2 en `_fonts/`; `.nojekyll` presente |
| 3 | CSS editorial (~2.200 líneas) en `assets/css/` (tokens + base + leaflet), cargado una vez desde `nuxt.config.ts`, sin reescribirse | VERIFICADO | 3 ficheros CSS (2190 líneas); sin `@layer`/`scoped`; `css:[]` en orden en `nuxt.config.ts` |
| 4 | `server/` con `server/api/README.md` y ningún endpoint activo; sitio sigue generándose estático (SSR-en-build ON, sin `ssr:false`) | VERIFICADO | 0 ficheros `.ts`/`.js` en `server/`; `grep -c 'ssr: *false'` = 0; HTML generado con contenido real |
| 5 | Screenshots golden (home, 5 días, 3 fichas-tipo, 5 referencias) en claro/oscuro y móvil/desktop, antes de divergir | VERIFICADO | 56 PNGs versionados; golden determinista; captura anterior a código Nuxt |

**5/5 criterios de éxito del ROADMAP verificados.**

---

### Elementos diferidos (Step 9b)

| # | Elemento | Aplazado a | Evidencia |
|---|----------|-----------|-----------|
| 1 | `content/` y `shared/` ausentes del árbol de directorios | Fase 2 | Fase 2 crea explícitamente `content/trips/roma/*.yml` (éxito SC-1); `content/` y `shared/` no son necesarios para que el build de Fase 1 funcione |

---

## Resumen de brechas

Sin brechas bloqueantes. Todos los requisitos de Fase 1 (PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05, ARCH-03, BUILD-01, BUILD-02, BUILD-03, PARITY-01) están cubiertos y verificados en el código real. La ausencia de `content/` y `shared/` es intencional y queda diferida a Fase 2, donde el contenido de datos las creará implícitamente.

---

_Verificado: 2026-06-19T00:45:00Z_
_Verificador: Claude (gsd-verifier)_
