import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * Verificación local del subpath de producción `/guiaRoma/` (BUILD-01/02/03, D-06).
 *
 * AUTOCONTENIDO (vía B): este spec NO depende de `playwright.config.ts` (que sirve la raíz
 * en :4173 para el golden). Aquí, en `test.beforeAll`, generamos el sitio (`pnpm generate`),
 * copiamos `.output/public/*` a una subcarpeta `guiaRoma/` bajo un directorio temporal, y
 * servimos el directorio PADRE con un static server propio (`pnpm dlx serve`, el mismo que usa
 * el harness del golden) en un puerto distinto (5000). Así reproducimos EXACTAMENTE la topología
 * de GitHub Pages (`usuario.github.io/guiaRoma/`) en local, sin CI ni tocar el deploy de `main`.
 *
 * Asserts (RESEARCH V5/V6, 464-480 + 718-727):
 *  - 0 respuestas con status >= 400 para recursos `/_nuxt/*` bajo `/guiaRoma/` (BUILD-01/03).
 *  - 0 peticiones a CDNs (fonts.googleapis.com / fonts.gstatic.com / unpkg.com): fuentes y
 *    assets self-hosteados (BUILD-02, objetivo offline).
 *  - 0 errores críticos de consola al cargar (BUILD-03: la app del scaffold carga bajo el subpath).
 *  - `.output/public/.nojekyll` existe (V7/BUILD-01: Pages no ignorará `/_nuxt/`).
 */

// Puerto base 5000 (distinto del :4173 del golden). Se desplaza por worker para que los dos
// proyectos de playwright.config.ts (mobile/desktop), que pueden correr en workers paralelos,
// no colisionen en el mismo puerto (EADDRINUSE) — sin tocar playwright.config.ts.
const PORT = 5000 + Number(process.env.TEST_WORKER_INDEX ?? 0)
const BASE = `http://localhost:${PORT}`
const SUBPATH_URL = `${BASE}/guiaRoma/`
const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

let server: ChildProcess | undefined
let previewRoot: string | undefined

/** Espera a que el static server responda en `url` (o agota el tiempo). */
async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      // Cualquier respuesta HTTP (incl. 404) significa que el server ya escucha.
      if (res.status > 0) return
    }
    catch (err) {
      lastErr = err
    }
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`Static server no respondió en ${url} tras ${timeoutMs}ms (último error: ${String(lastErr)})`)
}

test.beforeAll(async () => {
  // 1) Asegurar el sitio estático (preset github_pages + baseURL /guiaRoma/).
  //    Si `.output/public/index.html` ya existe (el flujo normal lo genera antes: ver script
  //    `test:subpath` / verify del plan, que corre `pnpm generate` primero) NO se regenera:
  //    así varios workers paralelos no rebuildan a la vez (race en .output). Standalone sí build.
  if (!existsSync(join(OUTPUT_DIR, 'index.html'))) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(join(OUTPUT_DIR, 'index.html')), '.output/public/index.html debe existir').toBe(true)

  // 2) Reproducir la topología de Pages: copiar .output/public a <tmp>/guiaRoma/ y servir el PADRE.
  previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-pages-'))
  const subDir = join(previewRoot, 'guiaRoma')
  mkdirSync(subDir, { recursive: true })
  // recursive copy incl. dotfiles (.nojekyll) — cpSync copia ficheros ocultos por defecto.
  cpSync(OUTPUT_DIR, subDir, { recursive: true })

  // 3) Arrancar un static server propio sobre el directorio PADRE (sirve /guiaRoma/ como subpath).
  //    SIN --single: queremos 404 reales para assets ausentes (no rewrite a index.html),
  //    para que el assert de 0×404 de /_nuxt/* sea significativo.
  server = spawn('pnpm', ['dlx', 'serve', '-l', String(PORT), previewRoot], {
    stdio: 'ignore',
    shell: false,
  })
  await waitForServer(SUBPATH_URL)
})

test.afterAll(async () => {
  if (server && !server.killed) {
    server.kill('SIGTERM')
  }
  if (previewRoot && existsSync(previewRoot)) {
    rmSync(previewRoot, { recursive: true, force: true })
  }
})

test('el build se sirve bajo /guiaRoma/ sin 404 de /_nuxt/* ni peticiones a CDNs', async ({ page }) => {
  // V7/BUILD-01: .nojekyll presente en la salida (cinturón-y-tirantes para Pages).
  expect(existsSync(join(OUTPUT_DIR, '.nojekyll')), '.output/public/.nojekyll debe existir').toBe(true)

  const badAssets: string[] = []
  const cdnRequests: string[] = []
  const consoleErrors: string[] = []

  // Listeners ANTES de navegar (V5/V6).
  // (1) 0 × 404 de assets /_nuxt/* bajo el subpath → BUILD-01/03.
  page.on('response', (r) => {
    if (r.url().includes('/_nuxt/') && r.status() >= 400) badAssets.push(`${r.status()} ${r.url()}`)
  })
  // (2) 0 peticiones a CDNs de fuentes/Leaflet → BUILD-02 (offline, self-host).
  page.on('request', (r) => {
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com/.test(r.url())) cdnRequests.push(r.url())
  })
  // (3) errores de consola (BUILD-03: la app carga sin romper bajo el subpath).
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  const response = await page.goto(SUBPATH_URL)
  expect(response?.status(), 'el documento bajo /guiaRoma/ debe responder 200').toBe(200)

  await page.waitForLoadState('networkidle')

  expect(badAssets, `404s de assets /_nuxt/* bajo /guiaRoma/: ${badAssets.join(', ')}`).toHaveLength(0)
  expect(cdnRequests, `peticiones a CDNs (deberían ser 0 — self-host): ${cdnRequests.join(', ')}`).toHaveLength(0)
  expect(consoleErrors, `errores de consola al cargar bajo el subpath: ${consoleErrors.join(' | ')}`).toHaveLength(0)
})
