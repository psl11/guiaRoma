import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * TEMA SIN FOUC (SC#3) + ICONO CSS-ONLY (SC#4) sobre la build ESTÁTICA.
 *
 * AUTOCONTENIDO (igual que subpath.spec.ts): generamos el sitio (`pnpm generate`) una vez,
 * copiamos `.output/public/*` a una subcarpeta `guiaRoma/` y servimos el PADRE bajo /guiaRoma/.
 *
 * SC#3 (anti-FOUC) se prueba en DOS partes (RESEARCH §«How SC#3 is concretely proven»):
 *  (a) PRESENCIA ESTÁTICA: el <head> del index.html GENERADO contiene un <script> inline
 *      (inyectado por @nuxtjs/color-mode vía el hook Nitro render:html) que lee el storageKey
 *      `roma-theme` y hace setAttribute del atributo data-theme ANTES del primer paint.
 *      Tras templar con dataValue:'theme'/storageKey:'roma-theme', el script contiene
 *      literalmente `getStorageValue("localStorage","roma-theme")` y, en la función que aplica el
 *      modo, `n="theme"` + `e.setAttribute("data-"+n,t)` (es decir, fija data-theme). Verificamos
 *      esos marcadores en el fichero.
 *  (b) COMPORTAMIENTO (sin flash): con roma-theme='dark' PRESETEADO antes de navegar, la página
 *      pinta data-theme=dark de inmediato (sin transición light→dark observable).
 *
 * SC#4 (icono CSS-only): ambos spans .moon/.sun SIEMPRE existen; exactamente uno visible por
 * [data-theme] (en dark: .sun visible, .moon display:none); al pulsar .theme-btn el data-theme
 * conmuta y la visibilidad se intercambia; data-theme solo es light|dark (NUNCA 'system').
 */

const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

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

test.describe('tema sin FOUC + icono CSS-only (build estática)', () => {
  const STATIC_PORT = 5300 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_ORIGIN = `http://localhost:${STATIC_PORT}`
  const STATIC_URL = `${STATIC_ORIGIN}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-theme-'))
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

  test('SC#3 presencia: el <head> generado lleva el script anti-FOUC (roma-theme → data-theme)', () => {
    const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf8')
    const head = html.slice(0, html.indexOf('</head>'))

    // El storageKey templado (lee la preferencia guardada de la versión viva).
    expect(head, 'el <head> debe referenciar el storageKey roma-theme').toContain('roma-theme')
    // El script lo lee de localStorage.
    expect(head).toContain('getStorageValue("localStorage","roma-theme")')
    // …y fija el atributo data-theme antes del paint: dataValue 'theme' → n="theme" + setAttribute("data-"+n,…).
    expect(head, 'el script debe hacer setAttribute del atributo data-*').toContain('setAttribute("data-"')
    expect(head, 'dataValue templado a "theme" (→ data-theme)').toContain('"theme"')
    // Debe ser un <script> inline en el head.
    expect(head).toMatch(/<script>[^<]*getStorageValue\("localStorage","roma-theme"\)/)
  })

  test('SC#3 comportamiento: con roma-theme=dark preseteado, pinta dark sin flash light→dark', async ({ browser }) => {
    const context = await browser.newContext()
    // Preseteamos roma-theme=dark ANTES de cualquier script del documento → el script anti-FOUC
    // (que corre antes del paint) lo lee y aplica data-theme=dark en el primer paint, sin flash.
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('roma-theme', 'dark')
      }
      catch { /* noop */ }
    })
    const page = await context.newPage()

    // Vigía de «flash»: registra cualquier transición de data-theme desde un valor != dark.
    const themeTransitions: string[] = []
    await page.exposeFunction('__recordTheme', (t: string) => {
      themeTransitions.push(t)
    })
    await page.addInitScript(() => {
      const apply = () => {
        const el = document.documentElement
        // Llamada inicial + observador del atributo: captura el PRIMER valor y cada cambio.
        const w = window as unknown as { __recordTheme?: (t: string) => void }
        w.__recordTheme?.(el.getAttribute('data-theme') ?? '(none)')
        new MutationObserver(() => {
          w.__recordTheme?.(el.getAttribute('data-theme') ?? '(none)')
        }).observe(el, { attributes: true, attributeFilter: ['data-theme'] })
      }
      if (document.documentElement) apply()
      else document.addEventListener('DOMContentLoaded', apply)
    })

    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    // En el primer eval ya es dark (el script anti-FOUC ganó antes del paint).
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

    // NINGÚN valor de data-theme observado fue light: no hubo flash light→dark.
    expect(
      themeTransitions.filter(t => t === 'light'),
      `transiciones de data-theme observadas: [${themeTransitions.join(', ')}] — no debe aparecer 'light'`,
    ).toHaveLength(0)

    await context.close()
  })

  test('SC#4 icono CSS-only: ambos spans existen, uno visible por tema, conmuta sin v-if, nunca system', async ({ page }) => {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    const html = page.locator('html')
    const moon = page.locator('.theme-btn .moon')
    const sun = page.locator('.theme-btn .sun')

    // Ambos spans SIEMPRE en el DOM (sin v-if/v-show por tema) — el contenido glífico verbatim.
    await expect(moon).toBeAttached()
    await expect(sun).toBeAttached()
    await expect(moon).toHaveText('☾')
    await expect(sun).toHaveText('☀')

    // Estado inicial (data-theme=light por fallback): .moon visible, .sun oculto (base.css:58-59).
    await expect(html).toHaveAttribute('data-theme', 'light')
    await expect(moon).toBeVisible()
    await expect(sun).toBeHidden()
    await expect(moon).toHaveCSS('display', 'block')
    await expect(sun).toHaveCSS('display', 'none')

    // Pulsar el toggle → data-theme conmuta a dark y la visibilidad se intercambia (CSS-only).
    await page.locator('.theme-btn').click()
    await expect(html).toHaveAttribute('data-theme', 'dark')
    await expect(sun).toBeVisible()
    await expect(moon).toBeHidden()
    await expect(sun).toHaveCSS('display', 'block')
    await expect(moon).toHaveCSS('display', 'none')

    // Volver a pulsar → de vuelta a light.
    await page.locator('.theme-btn').click()
    await expect(html).toHaveAttribute('data-theme', 'light')

    // data-theme SOLO es light|dark (el toggle NUNCA escribe 'system' — D-08).
    const resolved = await html.getAttribute('data-theme')
    expect(['light', 'dark'], `data-theme resuelto = ${resolved}`).toContain(resolved)
  })
})
