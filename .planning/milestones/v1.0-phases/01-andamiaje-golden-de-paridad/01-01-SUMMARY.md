---
phase: 01-andamiaje-golden-de-paridad
plan: 01
subsystem: testing
tags: [playwright, visual-regression, golden, toHaveScreenshot, pnpm, paridad]

# Dependency graph
requires: []
provides:
  - "Golden de paridad versionado: 56 PNGs (14 vistas x light/dark x mobile/desktop) del index.html actual, capturados ANTES de divergir (D-05)"
  - "Harness Playwright (playwright.config.ts) con webServer estatico sobre la raiz, proyectos mobile/desktop, toHaveScreenshot determinista y snapshotPathTemplate sin plataforma (A8)"
  - "tests/parity/golden.spec.ts: spec reutilizable que la Fase 8 re-ejecutara contra la app Nuxt para medir paridad 100%"
  - "Contrato de tema verificado de extremo a extremo: localStorage['roma-theme'] + data-theme (lo reutilizara @nuxtjs/color-mode en Fase 3)"
affects: [Fase 8 verificacion de paridad, Fase 3 tema/color-mode, todas las fases que toquen render visual]

# Tech tracking
tech-stack:
  added: ["@playwright/test@1.61.0 (dev)", "chromium (playwright install)", "pnpm@10.32.1 (packageManager)"]
  patterns:
    - "Golden por elemento (locator.toHaveScreenshot) en vez de fullPage (A6, mas estable)"
    - "Tema oscuro determinista via addInitScript(localStorage) reutilizando el contrato del index.html"
    - "Imagenes remotas bloqueadas (page.route.abort) -> fallback SVG determinista (A5)"
    - "settle(): carga ansiosa + espera de resolucion de toda <img> + fonts.ready + doble rAF"

key-files:
  created:
    - "package.json"
    - "pnpm-lock.yaml"
    - "playwright.config.ts"
    - ".gitignore"
    - "tests/parity/golden.spec.ts"
    - "tests/parity/golden.spec.ts-snapshots/ (56 PNGs)"
  modified: []

key-decisions:
  - "A5: bloquear TODAS las peticiones de imagen (page.route('**/*.{jpg,jpeg,png,webp,avif,gif}').abort()) para forzar el fallback SVG determinista (estado offline, BUILD-02) en vez de esperar carga real (fragil) o mask (ignora region)"
  - "A8: snapshotPathTemplate SIN sufijo de plataforma para comparar entre SOs en Fase 8; captura realizada en linux"
  - "Fichas-tipo por id literal (#galleria-sciarra/#vaticano/#auditorium): NO existe clase CSS guided/concert en el index.html (las 38 fichas son class='card')"
  - "browserName: 'chromium' forzado en ambos proyectos (el default de devices['iPhone 12'] es webkit, no instalado; chromium basta para visual-diff determinista)"

patterns-established:
  - "Captura golden por elemento con tema forzado pre-navegacion y red de imagenes bloqueada"
  - "Auto-test de determinismo: 2a ejecucion sin --update debe pasar verde (V8)"

requirements-completed: [PARITY-01]

# Metrics
duration: 9min
completed: 2026-06-18
---

# Fase 1 Plan 01: Captura del golden de paridad Summary

**Golden de paridad versionado (56 PNGs deterministas, 14 vistas x claro/oscuro x movil/desktop) capturado del `index.html` actual con Playwright, ANTES de cualquier codigo Nuxt — la red de seguridad inmutable de toda la migracion.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-06-18T21:31:52Z
- **Completed:** 2026-06-18T21:41:xx Z
- **Tasks:** 2
- **Files modified:** 6 creados (60 ficheros con los 56 PNGs)

## Accomplishments

- **Harness Playwright determinista** (`playwright.config.ts`): static server sobre la raiz del repo sirviendo el `index.html` in situ (D-05), proyectos `mobile` (iPhone 12, ~390px) y `desktop` (1280x800), `toHaveScreenshot` con `animations:'disabled'` + `caret:'hide'` + `maxDiffPixelRatio:0.01`.
- **56 PNGs golden versionados** en `tests/parity/golden.spec.ts-snapshots/` — las 14 vistas de D-04 (inicio + 5 dias + 5 referencias + 3 fichas-tipo) en claro y oscuro, en movil y desktop. Cota superior exacta alcanzada (14x2x2 = 56).
- **Determinismo confirmado (V8):** la 2a ejecucion de `pnpm test:golden` SIN `--update` pasa en verde (4/4 tests, exit 0) contra los PNGs recien generados.
- **Contrato de tema validado de punta a punta:** el golden oscuro se fuerza via `localStorage['roma-theme']='dark'` (mismo mecanismo que el `index.html` lee en su script inline, linea 6263), el mismo contrato que `@nuxtjs/color-mode` reproducira en Fase 3.
- **Orden de build respetado:** NO existe `nuxt.config.ts` ni `app/` al cerrar el plan — el golden es estrictamente el primer entregable, antes de divergir.

## Task Commits

Cada tarea se commiteo atomicamente:

1. **Tarea 1: Verificacion de legitimidad de paquetes + config del harness Playwright (A8)** - `af337dd` (chore)
2. **Tarea 2: Spec del golden (14 vistas x light/dark), heros deterministas (A5), generacion y versionado de PNGs** - `f9cca6a` (test)

**Metadata del plan:** commit final (docs) con SUMMARY.md, STATE.md, ROADMAP.md, REQUIREMENTS.md.

## Decisión A5 (heros remotas) — documentada explicitamente

**Decision FIJADA: opcion 2 — bloquear todas las peticiones de imagen.** El spec registra `await page.route('**/*.{jpg,jpeg,png,webp,avif,gif}', r => r.abort())` ANTES de `page.goto`, forzando SIEMPRE el estado de fallback SVG (`onerror` -> `loadSvgFallback`/`loadSvgFallbackDetail` -> motif SVG por ficha). Razon: es el estado **determinista** (elimina la dependencia de red de terceros Wikimedia/turismoroma que haria el golden no reproducible) y ademas es el estado **offline** que el proyecto valora (BUILD-02). Se descarto la opcion 1 (esperar carga real, fragil ante caidas de terceros) y la opcion 3 (`mask`, que ignora la region en vez de capturarla). Esto mitiga el threat T-01-NET del threat model.

## Decisión A8 (plataforma de snapshots) — documentada explicitamente

**Decision FIJADA: `snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}'` — SIN el segmento de plataforma** (`-linux`/`-darwin`/`-win32`). Asi los golden se comparan entre SOs en la Fase 8 sin atarse a un SO concreto. Nombres resultantes: `inicio-light-mobile.png`, `dia-martes-dark-desktop.png`, etc. **La captura de este plan se realizo en linux** (entorno WSL2, node v22.20.0).

## Numero de PNGs y 2a corrida verde

- **PNGs generados: exactamente 56** (14 vistas x 2 temas x 2 viewports). `git ls-files tests/parity | grep -c '.png'` = 56 (>= 44 exigido; D-05 golden versionado).
- **2a ejecucion sin `--update`: VERDE** — `pnpm test:golden` -> `4 passed`, exit 0. Determinismo confirmado (no hay flakiness residual de animaciones/fuentes/heros/reflow).

## Files Created/Modified

- `package.json` - manifiesto privado con `packageManager: pnpm@10.32.1` y scripts `test:golden`/`test:golden:update`. NO es `nuxi init` (eso es el Plan 02).
- `pnpm-lock.yaml` - lockfile commiteado (mitigacion cadena de suministro T-01-SC).
- `playwright.config.ts` - harness del golden (webServer estatico D-05, proyectos mobile/desktop, determinismo, A8).
- `.gitignore` - ignora `node_modules`/`.output`/`.nuxt`/`dist`/`test-results`/`playwright-report`; NO excluye `tests/parity/` (Pitfall 2).
- `tests/parity/golden.spec.ts` - captura por elemento de las 14 vistas en claro/oscuro; A5 (abort) + tema oscuro determinista + `settle()`.
- `tests/parity/golden.spec.ts-snapshots/` - 56 PNGs golden versionados.

## Decisions Made

- A5 y A8 fijadas (ver secciones dedicadas arriba).
- Fichas-tipo por `id` literal — confirmado en `index.html` que las 38 fichas son `<article class="card">`; no hay clases `guided`/`concert` en el DOM (eso es concepto del modelo de datos futuro). Representantes: `#galleria-sciarra` (card simple), `#vaticano` (guiada, `<h3>Vaticano · preparar la visita guiada</h3>`), `#auditorium` (concierto, romano ♪).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `snapshotPathTemplate` con `{testFileDir}` resolvia a la raiz del FS**
- **Found during:** Tarea 2 (generacion de PNGs)
- **Issue:** El plan prescribia `snapshotPathTemplate: '{testFileDir}/...'`. Como el spec vive directamente en `testDir` (`./tests/parity`), el token `{testFileDir}` (relativo desde `testDir` al fichero) resuelve a cadena vacia -> la plantilla quedaba `/golden.spec.ts-snapshots/...` (ruta absoluta desde `/`) -> `EACCES: permission denied, mkdir '/golden.spec.ts-snapshots'`.
- **Fix:** Cambiado `{testFileDir}` por `{testDir}` (ruta absoluta del directorio de tests resuelta relativa al config). Resultado identico al esperado: `tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}`, sin plataforma (A8 intacta). Verificado contra la doc de tokens de Playwright 1.61 (`node_modules/.../types/test.d.ts`).
- **Files modified:** playwright.config.ts
- **Verification:** Los 56 PNGs se escriben en `tests/parity/golden.spec.ts-snapshots/`; `! grep -q "{platform}"` sigue pasando.
- **Committed in:** `f9cca6a` (Tarea 2)

**2. [Rule 3 - Blocking] `devices['iPhone 12']` intentaba lanzar webkit (no instalado)**
- **Found during:** Tarea 2 (generacion de PNGs)
- **Issue:** El descriptor `devices['iPhone 12']` fija `defaultBrowserType: 'webkit'`. Solo se instalo chromium (`playwright install chromium`, segun el plan/RESEARCH). Error: `browserType.launch: Executable doesn't exist at .../webkit-2311/pw_run.sh`.
- **Fix:** Anadido `browserName: 'chromium'` explicito en ambos proyectos (`mobile` y `desktop`). iPhone 12 sigue aportando viewport/DPR/UA movil; chromium basta para un visual-diff determinista (lo indica RESEARCH: "chromium basta para visual-diff determinista").
- **Files modified:** playwright.config.ts
- **Verification:** Ambos proyectos corren y generan PNGs; 4/4 tests pasan.
- **Committed in:** `f9cca6a` (Tarea 2)

**3. [Rule 1 - Bug] Reflow no determinista en secciones largas por swap a SVG de imagenes lazy**
- **Found during:** Tarea 2 (1a generacion: `dia-martes` fallaba con altura 23371 vs 23653 px, ratio 0.03-0.06)
- **Issue:** Las heros usan `loading="lazy"`. Con A5 (peticiones bloqueadas), el `onerror`->SVG (que reemplaza `innerHTML` del wrapper / hace `replaceWith` del img por un SVG `height:auto`) ocurria progresivamente al hacer scroll, cambiando la altura de las secciones largas (`#martes`, ~23k px) entre la escritura del snapshot y la re-captura de verificacion -> golden no determinista.
- **Fix:** Reforzado `settle()`: (a) `img.loading = 'eager'` en todas las imagenes para disparar todos los `onerror`->SVG ARRIBA y de una vez; (b) `Promise.all` esperando a que cada `<img>` este `complete` (resuelta: cargada o errorada); (c) `document.fonts.ready`; (d) doble `requestAnimationFrame` para asentar el reflow final tras los swaps.
- **Files modified:** tests/parity/golden.spec.ts
- **Verification:** 2a ejecucion sin `--update` pasa 4/4 verde; `dia-martes` estable en ambos viewports/temas.
- **Committed in:** `f9cca6a` (Tarea 2)

---

**Total deviations:** 3 auto-arregladas (2 blocking Rule 3, 1 bug Rule 1).
**Impact on plan:** Todas necesarias para que el golden se genere y sea determinista (el objetivo central del plan, V8). Cero scope creep — el alcance, las decisiones (A5/A8), las 14 vistas y la cota de PNGs son exactamente los del plan; las desviaciones solo corrigen detalles de la mecanica de Playwright (tokens de ruta, navegador, settle) que el sketch no podia prever.

## Code-review fixes (2026-06-19, post-revisión 01-REVIEW.md)

Una revisión de código (`01-REVIEW.md`) detectó que el bloqueo de imágenes de A5 era **incompleto**, comprometiendo el determinismo del golden. Corregido en una pasada de gap-closure (rama `release/nuxt-4`, commits normales con hooks):

- **CR-01 (BLOCKER) + WR-01 (WARNING) — corregidos** (commit `5bca7a5`): el glob `'**/*.{jpg,jpeg,png,webp,avif,gif}'` era sensible a mayúsculas y exigía que la URL terminara en la extensión, así que dejaba pasar 4 URLs `.JPG` en mayúsculas y 9+ URLs con query string (`?width=N`/`?w=N`). Reemplazado por el bloqueo robusto por tipo de recurso: `await page.route('**/*', (route) => route.request().resourceType() === 'image' ? route.abort() : route.continue())`. Captura TODA imagen sea cual sea su extensión/caja/query string; las peticiones no-imagen se `continue()` (el `index.html` local, CSS/JS y fuentes deben cargar). `settle()` intacto, las 14 vistas intactas.
- **Golden regenerado** (commit `1d15c1a`): cambiaron **8 PNGs** (`dia-lunes` + `dia-martes` × claro/oscuro × móvil/desktop), cuyas heros con query string sí filtraban fotos reales (San Luigi dei Francesi/Caravaggio, Elefantino-Minerva, Castel Sant'Angelo…) en la captura original con red parcial; ahora muestran el SVG de fallback determinista. **Cuenta de PNGs intacta: 56.** 2ª ejecución sin `--update` → verde (6 passed, exit 0).
- **WR-02 (WARNING) — corregido** (commit `5bca7a5`): el server estático de `subpath.spec.ts` se arranca con `spawn(..., { detached: true })` y se derriba con `process.kill(-server.pid, 'SIGTERM')` (grupo de procesos completo: `pnpm dlx` + `serve`), evitando el huérfano que ocupaba el puerto entre re-ejecuciones locales. Verificado: 0 procesos escuchando tras la corrida.
- **IN-01 (LOW) — reconocido como intencional:** `app.baseURL: '/guiaRoma/'` hardcodeado es deliberado (el sitio vive siempre en ese subpath; funciona también en `generate` local sin depender de la env var de CI). Sin cambio.

> Nota sobre la sección "Decisión A5" de arriba: el literal del `page.route` por extensiones que aparece documentado fue el de la **implementación original** de este plan; la implementación vigente bloquea por `resourceType` (más robusta, misma decisión A5 — fallback SVG determinista/offline). La intención de A5 no cambia; sólo el mecanismo de matching, ahora exhaustivo.

## Issues Encountered

- Un primer comentario en `playwright.config.ts` contenia el literal `` `-{platform}` ``, lo que hacia que el check `! grep -q "{platform}"` de la verificacion de la Tarea 1 diera falso positivo (la **plantilla** ya era correcta, A8 cumplida; el match estaba en la prosa del comentario). Resuelto reescribiendo el comentario sin el token literal, manteniendo la explicacion de A8. (No es desviacion del plan: es un ajuste de redaccion para que la verificacion automatica refleje la realidad.)

## Known Stubs

Ninguno. Este plan no renderiza UI ni cablea datos; produce artefactos de test (golden) e infraestructura de tooling. No hay valores hardcodeados ni placeholders que lleguen a una UI.

## User Setup Required

None - no external service configuration required. La instalacion de paquetes (`@playwright/test@1.61.0`, chromium) se realizo en este plan con el gate de legitimidad pre-aprobado.

## Next Phase Readiness

- **Golden listo como oraculo inmutable.** La Fase 8 re-ejecutara `tests/parity/golden.spec.ts` (adaptada a las rutas de la app Nuxt) contra estos 56 PNGs para medir paridad 100%.
- **NO existe scaffold Nuxt todavia** (esperado): el Plan 01-02 monta el scaffold Nuxt 4 (raiz, pnpm, `srcDir=app/`), el CSS verbatim, el subpath `/guiaRoma/`, el self-host de fuentes/Leaflet y el `server/` dormido — con el golden ya como red de seguridad.
- **Concern menor:** el golden se capturo en linux (A8). Si la Fase 8 corre en otro SO, el antialiasing puede introducir micro-diffs; `maxDiffPixelRatio:0.01` da margen, pero lo robusto es comparar en linux/CI. Documentado en A8.

## Self-Check: PASSED

- Ficheros creados verificados en disco: `package.json`, `pnpm-lock.yaml`, `playwright.config.ts`, `.gitignore`, `tests/parity/golden.spec.ts`, `tests/parity/golden.spec.ts-snapshots/` (56 PNGs), `01-01-SUMMARY.md`.
- Commits verificados en git: `af337dd` (Tarea 1), `f9cca6a` (Tarea 2).

---
*Phase: 01-andamiaje-golden-de-paridad*
*Completed: 2026-06-18*
