import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'

/**
 * VISUAL-DIFF Nuxt ↔ golden congelado sobre el «/guiaRoma/» CONSTRUIDO — el spec
 * NET-NEW que da nombre a la Fase 8 (PARITY-02 / SC#1). Es la prueba objetiva de la
 * paridad PÍXEL: las 14 vistas del golden, en claro y oscuro, sobre los viewports
 * mobile/desktop de playwright.config.ts, comparadas contra los 56 PNGs CONGELADOS de
 * F1 (tests/parity/golden.spec.ts-snapshots/) como baseline de SOLO LECTURA.
 *
 * `golden.spec.ts` re-captura el index.html VIEJO (es la herramienta de captura/baseline
 * de F1) — esa comparación Nuxt↔golden NUNCA ha existido hasta aquí. Este spec NO toca
 * `golden.spec.ts` ni rebaselina (D-01): NUNCA pasa el flag de actualización de baseline de
 * Playwright; un desajuste escribe `*-actual.png`/`*-diff.png` SOLO en `test-results/`, dejando los 56 congelados
 * intactos. La resolución del DIRECTORIO de snapshots (apuntar este spec al dir congelado
 * de F1 pese a la plantilla `{testFileName}-snapshots`) la aporta la config de la PUERTA
 * (Plan 03, `snapshotPathTemplate`); aquí sólo se llama a `toHaveScreenshot` con el nombre
 * `nombre-tema.png`. La primera corrida real + clasificación de diffs (D-02) es el Plan 06.
 *
 * AUTOCONTENIDO (5º clon EXACTO del harness de modes/navigation/search-route/map-fallback-notes.spec):
 * NO usa el webServer de playwright.config.ts (que sirve el index.html VIEJO del golden).
 * `pnpm generate` una vez, `.output/public/*` → subcarpeta `guiaRoma/`, static server propio
 * bajo /guiaRoma/. La build estática hidrata; se captura el sitio Nuxt GENERADO (es lo que
 * prueba la paridad píxel del SSG). Puerto base 5780 (modes=5700, navigation=5720,
 * search-route=5740, map-fallback-notes=5760 → 5780 libre).
 *
 * Reusa VERBATIM del golden el harness de determinismo para una captura apples-to-apples:
 * VIEWS (las 14 vistas EXACTAS de las que salieron los 56 PNGs; la isla del mapa NO está, D-06),
 * `settle()` (carga ansiosa de toda <img> + networkidle + cada <img>.complete + fonts.ready
 * + doble rAF) y A5 (abort de TODA petición de imagen por `resourceType === 'image'`,
 * registrado ANTES de goto → fuerza el estado de fallback SVG offline-determinista). El tema
 * oscuro vía `addInitScript(localStorage['roma-theme']='dark')`. La ÚNICA diferencia frente
 * al golden es el destino del `goto`: la build Nuxt servida bajo /guiaRoma/, no '/index.html'.
 *
 * Tolera SOLO el error de hidratación de @nuxtjs/color-mode (SSG) y, como A5 aborta imágenes,
 * el `net::ERR_FAILED` DELIBERADO de cada abort (flag `tolerateAborts=true`); falla ante
 * cualquier otro error de consola.
 */

const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i
// A5 aborta TODA petición de imagen a propósito; el navegador emite un `Failed to load
// resource: net::ERR_FAILED` por CADA imagen abortada — es la SEÑAL DELIBERADA del abort
// (lo que dispara el fallback SVG), no un error de runtime: se tolera con tolerateAborts.
const ABORTED_REQUEST_MSG = /Failed to load resource: net::ERR_FAILED/i
const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

// Vistas EXACTAS (nombre de snapshot → selector), COPIADAS VERBATIM de golden.spec.ts:17-32.
// Son las 14 vistas de D-04 de las que se capturaron los 56 PNGs congelados — no editar.
//   - Las 38 fichas son <article class="card">; representantes por id literal:
//     #galleria-sciarra (card simple), #vaticano (guiada), #auditorium (concierto ♪).
//   - La isla del mapa NO está entre las vistas (D-06): no hay baseline en el golden
//     (tiles OSM no deterministas). No añadir su sección a este array.
const VIEWS = [
  ['inicio', '#inicio'],
  ['dia-viernes', '#viernes'],
  ['dia-sabado', '#sabado'],
  ['dia-domingo', '#domingo'],
  ['dia-lunes', '#lunes'],
  ['dia-martes', '#martes'],
  ['ref-reservas', '#reservas'],
  ['ref-gastronomia', '#gastronomia'],
  ['ref-practica', '#practica'],
  ['ref-arte', '#arte'],
  ['ref-arquitectura', '#arquitectura'],
  ['card-monumento', '#galleria-sciarra'],
  ['card-guided', '#vaticano'],
  ['card-concert', '#auditorium'],
] as const

async function waitForServer(url: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.status > 0) return
    }
    catch (err) {
      lastErr = err
    }
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`Server no respondió en ${url} tras ${timeoutMs}ms (último error: ${String(lastErr)})`)
}

function killGroup(proc: ChildProcess | undefined): void {
  if (proc?.pid && !proc.killed) {
    try {
      process.kill(-proc.pid, 'SIGTERM')
    }
    catch {
      try {
        proc.kill('SIGTERM')
      }
      catch { /* ya muerto */ }
    }
  }
}

function ensureBuild(): void {
  if (!existsSync(join(OUTPUT_DIR, 'index.html'))) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(join(OUTPUT_DIR, 'index.html')), '.output/public/index.html debe existir').toBe(true)
}

type PWPage = import('@playwright/test').Page

// settle(): deja la página en un estado determinista antes de capturar. COPIADO VERBATIM de
// golden.spec.ts:44-69 — la captura debe ocurrir bajo el MISMO contrato de determinismo con
// el que se capturó el golden o el diff no significa nada.
//  1. Desactiva `loading="lazy"` en todas las <img> y espera a que TODAS resuelvan (cargen o,
//     con A5, fallen). Con las peticiones de imagen bloqueadas, esto fuerza que TODOS los
//     onerror -> loadSvgFallback (swap a SVG) ocurran ARRIBA y de una vez, no progresivamente
//     al hacer scroll. Sin esto, el swap a SVG de las imágenes lazy reflowa la altura de las
//     secciones largas (#martes) entre capturas -> flakiness.
//  2. Espera networkidle y document.fonts.ready (elimina el FOUT de las fuentes).
//  3. Doble requestAnimationFrame para asentar el reflow final tras los swaps a SVG.
// Las animaciones (@keyframes fadeIn de .card, transiciones de tema) las congela
// animations:'disabled' en playwright.config.ts.
async function settle(page: Page) {
  // Forzar carga ansiosa: dispara el fetch (y por tanto el onerror->SVG con A5) de toda <img>.
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager'
    })
  })
  await page.waitForLoadState('networkidle')
  // Esperar a que cada <img> esté "complete" (resuelta: cargada o errorada -> swap SVG hecho).
  await page.evaluate(
    () =>
      Promise.all(
        Array.from(document.images).map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              }),
        ),
      ),
  )
  await page.evaluate(() => (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)
  // Asentar el reflow final que provocan los swaps a SVG.
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
}

// -- Puerta de errores de consola: tolera SOLO el mensaje de hidratación de color-mode; cualquier
//    otro error se acumula y rompe el test. Como A5 aborta TODA imagen, este spec pasa SIEMPRE
//    `tolerateAborts=true` para tolerar ADEMÁS el `net::ERR_FAILED` de cada abort deliberado.
//    Clon del helper homónimo de map-fallback-notes.spec.ts:115-125. --
function trackConsoleErrors(page: PWPage, tolerateAborts = false): string[] {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (EXPECTED_HYDRATION_MSG.test(text)) return
    if (tolerateAborts && ABORTED_REQUEST_MSG.test(text)) return
    consoleErrors.push(text)
  })
  return consoleErrors
}

test.describe('visual-diff nuxt↔golden en /guiaRoma/ construido (SC#1)', () => {
  const STATIC_PORT = 5780 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_ORIGIN = `http://localhost:${STATIC_PORT}`
  const STATIC_URL = `${STATIC_ORIGIN}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    // Pitfall 2 (RESEARCH §Pitfall 2) — guard-assert: una representante de los 56 PNGs
    // congelados de F1 DEBE existir. Si la plantilla `snapshotPathTemplate` de la puerta
    // (Plan 03) estuviera mal configurada, sin este guard el spec crearía silenciosamente
    // un baseline FRESCO de Nuxt-contra-sí-mismo y "pasaría" — anulando toda la fase. Que
    // falle RUIDOSAMENTE aquí en vez de auto-baselinar. NUNCA correr con el flag de actualización de baseline (D-01).
    expect(
      existsSync(join(process.cwd(), 'tests/parity/golden.spec.ts-snapshots', 'inicio-light-desktop.png')),
      'el baseline congelado de F1 (56 PNGs) debe existir — NO rebaselinar (D-01)',
    ).toBe(true)

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-vdiff-'))
    const subDir = join(previewRoot, 'guiaRoma')
    mkdirSync(subDir, { recursive: true })
    cpSync(OUTPUT_DIR, subDir, { recursive: true })

    server = spawn('pnpm', ['dlx', 'serve', '-l', String(STATIC_PORT), previewRoot], {
      stdio: 'ignore',
      shell: false,
      detached: true,
    })
    server.unref()
    await waitForServer(STATIC_URL)
  })

  test.afterAll(() => {
    killGroup(server)
    if (previewRoot && existsSync(previewRoot)) {
      rmSync(previewRoot, { recursive: true, force: true })
    }
  })

  for (const theme of ['light', 'dark'] as const) {
    test(`nuxt↔golden ${theme}`, async ({ page }) => {
      // A5 aborta TODA imagen → estado de fallback SVG offline-determinista. tolerateAborts=true
      // porque cada abort emite net::ERR_FAILED (la señal deliberada del abort, no un error real).
      const consoleErrors = trackConsoleErrors(page, true)

      // Decisión A5 (heros remotas) — bloquear TODAS las peticiones de imagen para forzar SIEMPRE
      // el estado de fallback SVG (onerror -> SVG por motif), el mismo estado offline-determinista
      // con el que se capturó el golden. Bloqueo por `resourceType === 'image'` (no por glob de
      // extensión): captura TODA imagen sea cual sea su extensión/caja/query string. CRÍTICO:
      // route.continue() lo NO-imagen (HTML, CSS/JS, fuentes) — abortarlo colgaría la página.
      // COPIADO VERBATIM de golden.spec.ts:91-93. Registrado ANTES de goto.
      await page.route('**/*', route =>
        route.request().resourceType() === 'image' ? route.abort() : route.continue())

      // Tema oscuro determinista: el script inline de @nuxtjs/color-mode lee localStorage['roma-theme']
      // y pinta dark en el primer paint (dataValue:'theme' → <html data-theme="dark">). Sin clic, sin
      // timing. Mismo patrón que golden.spec.ts:97-99.
      if (theme === 'dark') {
        await page.addInitScript(() => localStorage.setItem('roma-theme', 'dark'))
      }

      await page.goto(STATIC_URL) // ← LA ÚNICA diferencia vs golden (que hace goto '/index.html')
      await settle(page)

      // Captura por elemento (más estable que fullPage; A6) — 1:1 con golden.spec.ts:105-109.
      // La plantilla `snapshotPathTemplate` de la puerta (Plan 03) resuelve `nombre-tema.png` +
      // {projectName} al PNG congelado correspondiente (p. ej. inicio-light-desktop.png). Honra
      // maxDiffPixelRatio:0.01 heredado de playwright.config.ts. Sin mask/stylePath/maxDiffPixels
      // a priori (D-02: la clasificación de diffs es el Plan 06).
      for (const [name, sel] of VIEWS) {
        const locator = page.locator(sel)
        await locator.scrollIntoViewIfNeeded()
        await expect(locator).toHaveScreenshot(`${name}-${theme}.png`)
      }

      expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
    })
  }
})
