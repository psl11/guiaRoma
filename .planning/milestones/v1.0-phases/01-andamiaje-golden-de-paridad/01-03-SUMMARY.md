---
phase: 01-andamiaje-golden-de-paridad
plan: 03
subsystem: infra
tags: [nuxt4, github-pages, subpath, baseurl, nitro-dormido, ssg, nojekyll, favicons, playwright, offline, self-host]

# Dependency graph
requires:
  - phase: 01-01
    provides: "playwright.config.ts (webServer estático sobre la raíz en :4173, proyectos mobile/desktop) + golden de 56 PNGs — el spec de subpath es independiente y NO toca este config"
  - phase: 01-02
    provides: "Scaffold Nuxt 4 (nuxt.config.ts con modules/css/colorMode/fonts/app.baseURL=/guiaRoma/, TS estricto, eslint stylistic), CSS verbatim, better-sqlite3 (conector SQLite de Content en build), pnpm-lock"
provides:
  - "Subpath de producción /guiaRoma/ FIJADO: nuxt.config.ts con nitro.preset='github_pages' + prerender { crawlLinks, routes:['/'], failOnError:true } sobre el app.baseURL del Plan 02 — pnpm generate produce .output/public con estructura de Pages y .nojekyll"
  - "Backend Nitro DORMIDO (ARCH-03): server/api/README.md como ÚNICO contenido bajo server/ (0 ficheros *.ts/*.js → 0 endpoints activos); el sitio sigue 100% estático con SSR-en-build ON (sin SPA shell)"
  - "public/.nojekyll (vacío) + favicons copiados a public/ (favicon.svg, apple-touch-icon.svg) — copias de la raíz, raíz intacta (D-02)"
  - "Favicons resueltos bajo el subpath: app/app.vue declara los <link> con useHead + useRuntimeConfig().app.baseURL → href /guiaRoma/favicon.svg (Nuxt NO antepone baseURL a app.head.link estático)"
  - "tests/parity/subpath.spec.ts: smoke programable AUTOCONTENIDO (vía B) que sirve el build bajo /guiaRoma/ y asserta 0×404 de /_nuxt/* (BUILD-01/03), 0 peticiones a CDNs (BUILD-02) y 0 errores de consola (BUILD-03); script test:subpath"
  - "Verificación local del offline cerrada (BUILD-02): al servir el build NO hay ninguna petición a fonts.googleapis.com/fonts.gstatic.com/unpkg.com — fuentes self-hosteadas por @nuxt/fonts"
affects: [Fase 2 (datos/colecciones — el prerender de /guiaRoma/ ya está fijado), Fase 7 (mapa Leaflet — se importará de node_modules bajo /guiaRoma/_nuxt/, nunca CDN), Fase 8 (verificación de paridad — comparte la topología de subpath), fase posterior de deploy/CI (montará el workflow que aquí se verificó SOLO en local, D-06)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subpath de producción GitHub Pages: app.baseURL + nitro.preset 'github_pages' + prerender.failOnError:true + public/.nojekyll (cinturón-y-tirantes) — SSR-en-build ON, sin ssr:false"
    - "Favicons baseURL-aware vía useHead en app/app.vue (NO app.head.link en nuxt.config): Nuxt reescribe baseURL a los assets bundleados (_nuxt) pero NO a los href de app.head.link → hay que construirlos con useRuntimeConfig().app.baseURL"
    - "Verificación de subpath AUTOCONTENIDA (vía B): el propio spec genera + copia .output/public a <tmp>/guiaRoma/ + arranca un static server (pnpm dlx serve) con child_process.spawn en beforeAll y lo cierra en afterAll — sin tocar playwright.config.ts ni añadir un segundo project"
    - "Backend Nitro dormido: server/api/README.md como único contenido; cero *.ts/*.js → cero rutas; generate sigue SSG"

key-files:
  created:
    - "server/api/README.md"
    - "public/.nojekyll"
    - "public/favicon.svg"
    - "public/apple-touch-icon.svg"
    - "tests/parity/subpath.spec.ts"
  modified:
    - "nuxt.config.ts (AÑADIDO bloque nitro.preset github_pages + prerender failOnError; app.baseURL del Plan 02 confirmado; favicons NO en app.head.link — ver desviación)"
    - "app/app.vue (favicons baseURL-aware vía useHead — desviación Rule 1/2)"
    - "package.json (script test:subpath)"

key-decisions:
  - "Verificación de subpath vía B (autocontenida en el spec) — FIJADA por el plan: beforeAll genera + copia + spawn(serve); afterAll mata el server y limpia el tmp. NO se modificó playwright.config.ts (vía A descartada), así files_modified queda exacto y el spec es autónomo"
  - "Favicons declarados en app/app.vue con useHead + app.baseURL (NO en nuxt.config app.head.link): la asunción del plan (\"Nuxt reescribe /favicon.svg a /guiaRoma/favicon.svg\") es incorrecta — Nuxt emite los href de app.head.link VERBATIM. Construirlos con el baseURL en runtime es lo que hace que resuelvan bajo el subpath sin 404"
  - "Puerto del static server desplazado por worker (5000 + TEST_WORKER_INDEX): los dos proyectos (mobile/desktop) corren en workers paralelos; un puerto fijo daría EADDRINUSE. Sin tocar playwright.config.ts"
  - "pnpm generate condicional en beforeAll (solo si no existe .output/public/index.html): evita que varios workers rebuildeen a la vez (race en .output); el flujo normal (verify/test:subpath) corre generate antes"
  - "D-06 respetado: verificación SOLO en LOCAL. NO se montó CI ni deploy; ningún comando de gh-pages/upload-pages-artifact ejecutado; el deploy vivo de main intacto"

patterns-established:
  - "Smoke de subpath programable con Playwright: page.on('response') para 404 de assets + page.on('request') para CDNs + page.on('console') para errores — listeners ANTES de goto, asserts tras networkidle"
  - "Reproducir la topología de GitHub Pages en local copiando .output/public a una subcarpeta con el nombre del repo y sirviendo el directorio padre"

requirements-completed: [BUILD-01, BUILD-02, BUILD-03, ARCH-03, PLAT-05]

# Metrics
duration: 7min
completed: 2026-06-18
---

# Fase 1 Plan 03: Subpath de producción + backend Nitro dormido + verificación local Summary

**Cerrada la infraestructura de la Fase 1: el subpath `/guiaRoma/` queda FIJADO (`app.baseURL` + `nitro.preset: 'github_pages'` + `prerender.failOnError` + `public/.nojekyll`), el backend Nitro presente pero DORMIDO (`server/api/README.md`, cero endpoints), los favicons resolviendo bajo el subpath, y un spec Playwright AUTOCONTENIDO que verifica EN LOCAL (D-06) que el build estático se sirve bajo `/guiaRoma/` con 0×404 de `/_nuxt/*` (BUILD-01/03) y 0 peticiones a CDNs (BUILD-02) — sin tocar CI ni el deploy vivo de `main`.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-06-18T22:03:35Z
- **Completed:** 2026-06-18T22:10:39Z
- **Tasks:** 2
- **Files modified:** 5 creados + 3 modificados

## Accomplishments

- **Subpath de producción `/guiaRoma/` FIJADO (BUILD-01/03):** `nuxt.config.ts` ampliado (NO reescrito — se preservó todo el Plan 02) con `nitro: { preset: 'github_pages', prerender: { crawlLinks: true, routes: ['/'], failOnError: true } }`. `app.baseURL: '/guiaRoma/'` del Plan 02 confirmado intacto. `pnpm generate` sale 0 y produce `.output/public` con estructura de Pages; `index.html` referencia los assets bajo `/guiaRoma/_nuxt/` (no desde la raíz del dominio). Routing **history** (default — las anclas `#id` son fragmentos, no rutas). **SIN `ssr: false`** (`grep -c 'ssr: *false'` == 0): SSR-en-build ON, HTML real (no SPA shell).
- **`.nojekyll` presente tras generate (V7/BUILD-01):** `public/.nojekyll` vacío como cinturón-y-tirantes (el preset debería añadirlo, fricción conocida nuxt#21232/#12480); confirmado que `.output/public/.nojekyll` existe tras el build — Pages no ignorará `/_nuxt/`.
- **Backend Nitro DORMIDO (ARCH-03):** `server/api/README.md` con el texto EXACTO de `<interfaces>` (contiene "DORMIDO") como **único** contenido bajo `server/`. `find server -name '*.ts' -o -name '*.js' | grep -c .` == 0 → cero endpoints activos. `nuxt generate` sigue produciendo estático (`.output/public/index.html` existe) — generar no depende de que `server/` esté vacío.
- **Favicons bajo el subpath (D-02 + corrección):** `favicon.svg` y `apple-touch-icon.svg` **copiados** (no movidos) de la raíz a `public/` (byte-idénticos; los de la raíz son del `index.html` y permanecen intactos). Los `<link>` de la app Nuxt se declaran en `app/app.vue` con `useHead` + `useRuntimeConfig().app.baseURL`, de modo que resuelven a `/guiaRoma/favicon.svg` (ver desviación: la asunción del plan de que `app.head.link` recibe el prefijo de baseURL era incorrecta).
- **Verificación local del subpath EN VERDE (BUILD-01/02/03, D-06):** `tests/parity/subpath.spec.ts` (vía B, autocontenido) genera el sitio, copia `.output/public/*` a `<tmp>/guiaRoma/`, sirve el directorio padre con `pnpm dlx serve` (puerto por worker) y navega a `http://localhost:<puerto>/guiaRoma/`. Asserts (2 proyectos, 2 passed): **0 respuestas con status≥400 para `/_nuxt/*`** (BUILD-01/03), **0 peticiones a `fonts.googleapis.com`/`fonts.gstatic.com`/`unpkg.com`** (BUILD-02 — fuentes self-hosteadas, offline), **0 errores de consola** (BUILD-03). `playwright.config.ts` NO modificado.

## Cómo se sirvió el build para la verificación de subpath (vía B — detalle)

**Decisión FIJADA por el plan: servidor autocontenido dentro del propio spec (vía B), NO un segundo `project` en `playwright.config.ts` (vía A descartada).** Mecánica de `tests/parity/subpath.spec.ts`:

1. **`test.beforeAll`:** (a) si no existe `.output/public/index.html`, ejecuta `pnpm generate` (condicional para no rebuildar en cada worker → evita race en `.output`); (b) crea un dir temporal con `mkdtempSync`, copia `.output/public` a la subcarpeta `guiaRoma/` con `cpSync` (incluye dotfiles → `.nojekyll`); (c) arranca un static server con `child_process.spawn('pnpm', ['dlx', 'serve', '-l', <puerto>, <tmp>])` **SIN `--single`** (queremos 404 reales para assets ausentes, no rewrite a `index.html`); (d) espera readiness con un `fetch` en bucle hasta que el server responda.
2. **Test body:** registra `page.on('response')`, `page.on('request')` y `page.on('console')` **antes** de `page.goto('http://localhost:<puerto>/guiaRoma/')`; tras `waitForLoadState('networkidle')`, asserta las 3 colecciones vacías y que el documento respondió 200.
3. **`test.afterAll`:** `server.kill('SIGTERM')` y `rmSync(tmp, { recursive })`.

**Puerto por worker** (`5000 + TEST_WORKER_INDEX`): los dos proyectos del config (mobile/desktop) corren en workers paralelos; un puerto fijo daría `EADDRINUSE`. Esto mantiene el spec autónomo y compatible con `playwright.config.ts` sin tocarlo.

## Resultado de los asserts (0×404 y 0×CDN)

```
Running 2 tests using 2 workers
  ✓  [mobile]  › subpath.spec.ts › el build se sirve bajo /guiaRoma/ sin 404 de /_nuxt/* ni peticiones a CDNs
  ✓  [desktop] › subpath.spec.ts › el build se sirve bajo /guiaRoma/ sin 404 de /_nuxt/* ni peticiones a CDNs
  2 passed
```

- **0×404 de `/_nuxt/*` (BUILD-01/03):** `badAssets.length === 0`. Sanity-check independiente confirmó que el test es **significativo** (no un falso verde): un asset real (`/guiaRoma/_nuxt/CYP1dNES.js`) responde **200**, mientras que un asset inexistente (`/guiaRoma/_nuxt/DOES-NOT-EXIST.js`) responde **404** (el server NO hace rewrite a `index.html`) — por lo que el listener `page.on('response')` capturaría un 404 real si lo hubiera.
- **0×CDN (BUILD-02):** `cdnRequests.length === 0`. Ninguna petición a `fonts.googleapis.com`/`fonts.gstatic.com`/`unpkg.com` al servir el build — las fuentes las sirve `@nuxt/fonts` desde `/guiaRoma/_fonts/` (self-host del Plan 02). Cierra la verificación offline de BUILD-02 que el Plan 02 dejó como estructural.
- **0 errores de consola (BUILD-03):** `consoleErrors.length === 0` — la app del scaffold carga bajo el subpath sin romper.

## Confirmación D-06 (sin tocar CI/deploy)

**No se montó CI ni deploy, y no se tocó el deploy vivo de `main`.** Ningún comando de `actions/upload-pages-artifact`, `gh-pages`, ni workflow `.github/workflows/*` se creó o ejecutó. La verificación es 100% local (un static server efímero en `localhost`, cerrado y limpiado al final del test). El montaje del workflow de Pages es una fase posterior (riesgo residual nulo: este plan no ejecuta comandos de deploy). Esto cubre la disposición `accept` del threat T-03-DEP.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Tarea 1: Subpath github_pages + backend Nitro dormido + favicons en public/ + .nojekyll** — `0d4c31e` (feat)
2. **Tarea 2: Verificar el build estático local bajo /guiaRoma/ — 0×404 de /_nuxt/* y 0 requests a CDNs** (incluye la corrección de favicons baseURL-aware) — `a1733fd` (test)

**Metadata del plan:** commit final (docs) con SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md.

## Files Created/Modified

- `nuxt.config.ts` — **AÑADIDO** (preservando el Plan 02): bloque `nitro: { preset: 'github_pages', prerender: { crawlLinks: true, routes: ['/'], failOnError: true } }`. `app.baseURL: '/guiaRoma/'` confirmado. Los favicons NO se dejaron en `app.head.link` (ver desviación). Reordenado por `nuxt/nuxt-config-keys-order` vía `lint --fix` (valores intactos; orden modules→app→css→colorMode→nitro→typescript→eslint→fonts).
- `app/app.vue` — favicons baseURL-aware: `useHead` con `link` construido desde `useRuntimeConfig().app.baseURL` (`${base}favicon.svg` / `${base}apple-touch-icon.svg`). (Desviación Rule 1/2.)
- `server/api/README.md` — backend Nitro DORMIDO, texto EXACTO de `<interfaces>` (contiene "DORMIDO"); único contenido bajo `server/`.
- `public/.nojekyll` — fichero vacío (cinturón-y-tirantes para Pages).
- `public/favicon.svg` / `public/apple-touch-icon.svg` — copias byte-idénticas de las de la raíz (D-02).
- `tests/parity/subpath.spec.ts` — smoke autocontenido (vía B): genera+copia+sirve bajo `/guiaRoma/`, asserta 0×404 de `/_nuxt/*` + 0 CDN + 0 errores de consola; `.nojekyll` presente.
- `package.json` — añadido `"test:subpath": "playwright test tests/parity/subpath.spec.ts"`.

## Decisions Made

- **Vía B (autocontenida)** para la verificación de subpath, FIJADA por el plan — sin tocar `playwright.config.ts` ni añadir un segundo `project`.
- **Favicons en `app/app.vue` (no en `nuxt.config` `app.head.link`)** — necesario para que resuelvan bajo el subpath (ver desviación).
- **Puerto por worker** y **`generate` condicional** en el spec — robustez ante los 2 proyectos en paralelo, sin tocar el config.
- **D-06:** verificación solo local; CI/deploy y `main` intactos.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug / Rule 2 - Critical] Favicons declarados en `app/app.vue` con baseURL en runtime, no en `nuxt.config` `app.head.link`**
- **Found during:** Tarea 1→2 (al ejecutar el primer `pnpm generate` y luego inspeccionar `.output/public/index.html` / preparar la verificación de subpath).
- **Issue:** El plan (`<interfaces>` y comentario) asumía que declarar los favicons en `app.head.link` con `href: '/favicon.svg'` haría que **Nuxt los reescribiera a `/guiaRoma/favicon.svg`** bajo el `baseURL`. **Esa asunción es incorrecta:** Nuxt reescribe el `baseURL` a los assets **bundleados** (`/guiaRoma/_nuxt/...`, `/guiaRoma/_payload.json`) y a las rutas, pero emite los `href` de `app.head.link` **VERBATIM**. El HTML generado contenía `<link rel="icon" href="/favicon.svg">` (raíz-relativo) → al servir en `usuario.github.io/guiaRoma/`, el navegador resuelve `/favicon.svg` a la **raíz del dominio** → **404 bajo el subpath**. Es exactamente el fallo que el threat T-03-404 busca evitar y que la verificación de subpath (assert de favicon/assets) debe atrapar.
- **Fix:** Mover la declaración a `app/app.vue` con `useHead`, construyendo el `href` desde `useRuntimeConfig().app.baseURL` (que en runtime vale `/guiaRoma/`): `${base}favicon.svg`. Tras el fix, el HTML generado contiene `href="/guiaRoma/favicon.svg"` y `href="/guiaRoma/apple-touch-icon.svg"`, y ambos ficheros existen ahí (copiados a `public/`). Se revirtió el `app.head.link` de `nuxt.config.ts`. Primer intento usó `joinURL` (de `ufo`), que **no está auto-importado** → `error TS2304: Cannot find name 'joinURL'` y un **500 en prerender** (capturado por `failOnError: true`, el parity guard funcionando); se sustituyó por concatenación normalizando la barra (sin dependencias).
- **Files modified:** `app/app.vue`, `nuxt.config.ts`
- **Verification:** `grep -o 'rel="icon"...'` → `href="/guiaRoma/favicon.svg"`; 0 ocurrencias de `href="/favicon.svg"` raíz-relativo; `pnpm typecheck` exit 0; `pnpm generate` exit 0; `pnpm exec playwright test tests/parity/subpath.spec.ts` → 2 passed (0×404, 0×CDN, 0 console errors).
- **Committed in:** `a1733fd` (Tarea 2)

**Ajustes menores (no son desviaciones de alcance):**
- `nuxt.config.ts` se reordenó por `nuxt/nuxt-config-keys-order` vía `eslint --fix` (mismo patrón que el Plan 02; valores idénticos, solo orden de claves).
- Comentario de `nuxt.config.ts` reformulado para no contener el literal `ssr:false` en prosa, de modo que el assert automático `grep -c 'ssr: *false' == 0` refleje la realidad (no hay tal directiva; mismo tipo de ajuste que el Plan 01 hizo con `{platform}` en un comentario). Sin cambio funcional.
- En `subpath.spec.ts`: puerto por worker (`EADDRINUSE` con 2 proyectos) y `generate` condicional (race en `.output`) — robustez del spec, dentro del alcance de "servir el build de forma autocontenida".

---

**Total deviations:** 1 auto-arreglada (Rule 1/2: corrección de la resolución de favicons bajo el subpath). **Impact on plan:** la corrección es central al objetivo (sin ella los favicons darían 404 bajo `/guiaRoma/`, justo lo que la verificación de subpath defiende — T-03-404). Cero scope creep: el subpath, el backend dormido, el `.nojekyll`, las copias de favicons, la vía B autocontenida y D-06 son exactamente los del plan; la desviación solo corrige una asunción incorrecta del sketch sobre cómo Nuxt trata los `href` de `app.head.link`.

## Issues Encountered

- **Warning benigno de @nuxt/content** (`No content configuration found, falling back to default collection`): esperado — el stub `content.config.ts` tiene `collections: {}` (esquema real = Fase 2). No rompe lint/typecheck/generate (heredado del Plan 02).
- **`failOnError: true` atrapó el bug de `joinURL`** durante la iteración del fix de favicons (500 en prerender de `/`). No es un problema del plan: es el parity guard funcionando como se diseñó (un error de runtime/enlace roto ROMPE el build). Resuelto eliminando la dependencia de `joinURL`.

## Known Stubs

- `app/app.vue` — sigue siendo el placeholder mínimo del Plan 02 (`<div id="scaffold">…`), ahora con un `useHead` para los favicons. **Intencional:** la composición real (TripView, layout, páginas) llega en Fase 2+. El `useHead` de favicons NO es un stub: es funcionalidad real y verificada (resuelve bajo el subpath).
- `server/api/README.md` — único contenido bajo `server/` por diseño (ARCH-03: backend dormido). **Intencional y documentado:** los endpoints activos (auth/uploads/API) son v2.
- `content.config.ts` — `collections: {}` vacío (heredado del Plan 02; esquema zod = Fase 2).

Ningún stub llega a una UI con datos vacíos engañosos: la app aún no renderiza contenido del viaje (Fase 2+). No bloquean el objetivo de este plan (subpath + backend dormido + verificación local).

## Threat Flags

Ninguna superficie de seguridad nueva fuera del `<threat_model>` del plan. La única superficie tocada (favicons) se mitigó (resuelven bajo el subpath, sin 404 — T-03-404). El backend sigue dormido (T-03-EP mitigado: 0 ficheros de servidor) y no hay CDN en runtime (T-03-CDN mitigado: verificado por el test). No se ejecutó deploy (T-03-DEP: accept, residual nulo).

## User Setup Required

None — no se requiere configuración de servicio externo. No se instalaron paquetes nuevos (todo el stack viene del Plan 02). La verificación es 100% local.

## Next Phase Readiness

- **Infraestructura de Fase 1 cerrada.** Subpath `/guiaRoma/` fijado y verificado en local; backend Nitro dormido; `.nojekyll` y favicons en `public/`; build estático con 0×404 y 0×CDN. Los 4 entregables del objetivo (subpath, dormido, favicons, verificación local) están en verde.
- **Fase 2 (datos/colecciones):** el prerender de `/guiaRoma/` ya está fijado con `failOnError` — cuando se añadan rutas/anclas reales, `crawlLinks` las seguirá y un enlace roto romperá el build (parity guard). Definir el esquema zod real en `content.config.ts` resolverá el warning de "default collection".
- **Fase 7 (mapa Leaflet):** se importará de `node_modules` (servido bajo `/guiaRoma/_nuxt/`), nunca de CDN — el test de subpath ya vigila que no aparezca `unpkg.com`.
- **Fase 8 (paridad):** comparte la topología de subpath; el golden de 01-01 (intacto) y este smoke conviven en `tests/parity/`.
- **Fase posterior de deploy/CI (D-06):** montar `.github/workflows/deploy.yml` con `NUXT_APP_BASE_URL=/guiaRoma/` (o el `app.baseURL` ya en config) + `actions/upload-pages-artifact`. **Concern heredado del Plan 02:** verificar que el runner de CI compila `better-sqlite3` (trae prebuilts para Node LTS; si el runner usa una versión sin prebuilt, compilará con node-gyp). El build es de Node 22.20.0 en local.

## Self-Check: PASSED

- **Ficheros creados/modificados verificados en disco:** `nuxt.config.ts`, `app/app.vue`, `server/api/README.md`, `public/.nojekyll`, `public/favicon.svg`, `public/apple-touch-icon.svg`, `tests/parity/subpath.spec.ts`, `package.json`, `01-03-SUMMARY.md`.
- **Commits verificados en git:** `0d4c31e` (Tarea 1, feat), `a1733fd` (Tarea 2, test).
- **Gates verdes:** `pnpm lint` exit 0, `pnpm typecheck` exit 0, `pnpm generate` exit 0, `pnpm exec playwright test tests/parity/subpath.spec.ts` → 2 passed.
- **Acceptance:** `grep -c 'ssr: *false'` == 0; `find server -name '*.ts' -o -name '*.js' | grep -c .` == 0; `.output/public/.nojekyll` existe; `grep -c '/guiaRoma/_nuxt/' .output/public/index.html` == 1; `grep -c 'page.on(' tests/parity/subpath.spec.ts` == 3.
- **Intacto:** `git status --porcelain index.html favicon.svg apple-touch-icon.svg` VACÍO (D-02); golden 01-01 (`tests/parity/golden.spec.ts` + snapshots) VACÍO; `playwright.config.ts` VACÍO (no modificado).

---
*Phase: 01-andamiaje-golden-de-paridad*
*Completed: 2026-06-18*
