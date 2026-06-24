import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * COMPORTAMIENTO DE LOS 3 MODOS sobre el «/» CONSTRUIDO (SC#4): matriz de ritmo (FEAT-06),
 * caminar-menos (FEAT-07), resumen (FEAT-08), persistencia (roma-pace/roma-light/roma-resumen)
 * y el micro-flash INTENCIONAL.
 *
 * AUTOCONTENIDO (mirror EXACTO de tests/parity/shell.spec.ts): NO usa el webServer de
 * playwright.config.ts (que sirve el index.html VIVO del golden). `pnpm generate` una vez,
 * `.output/public/*` → subcarpeta `guiaRoma/`, static server propio bajo /guiaRoma/. La build
 * estática hidrata y los modos funcionan en cliente (es lo que prueba la paridad real del SSG).
 *
 * Patrón de interacción + preseteo + flash heredado de tests/parity/theme.spec.ts: click sobre el
 * control + assert de clase/atributo; context.addInitScript(localStorage.setItem(...)) para
 * preseteo; MutationObserver para observar la transición default→estado (el micro-flash).
 *
 * NO modifica golden.spec.ts ni rebaselina (D-08). Tolera SOLO el error de hidratación de
 * @nuxtjs/color-mode (D-07) y falla ante cualquier otro.
 */

const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i
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

test.describe('comportamiento de los 3 modos en /guiaRoma/ construido (SC#4)', () => {
  const STATIC_PORT = 5700 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_ORIGIN = `http://localhost:${STATIC_PORT}`
  const STATIC_URL = `${STATIC_ORIGIN}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-modes-'))
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

  // -- Helper: espera a la hidratación (los @click no responden hasta que Vue ha hidratado). --
  async function gotoHydrated(page: import('@playwright/test').Page) {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')
    // El 1er pace-btn debe quedar `active` por defecto (estado prerenderizado optimista). Cuando
    // el @click responde, la app está hidratada.
    await expect(page.locator('.pace-btn[data-pace="optimistic"]')).toHaveClass(/\bactive\b/)
  }

  test('FEAT-06 matriz de ritmo: slow oculta medium+slow-only (no all); food/meta/resv SIEMPRE', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })

    await gotoHydrated(page)

    // Muestras estables por data-pace (existen en el dato: all×66, medium×16, slow-only×7).
    const itemAll = page.locator('.tl-item[data-pace="all"]').first()
    const itemMedium = page.locator('.tl-item[data-pace="medium"]').first()
    const itemSlowOnly = page.locator('.tl-item[data-pace="slow-only"]').first()
    const transportSlowOnly = page.locator('.tl-transport[data-pace="slow-only"]').first()
    const food = page.locator('.tl-food').first()
    const meta = page.locator('.tl-meta').first()
    const resv = page.locator('.tl-resv-meta').first()

    // Por defecto (optimista): TODO visible, ninguna .tl-hidden.
    await expect(itemAll).not.toHaveClass(/tl-hidden/)
    await expect(itemMedium).not.toHaveClass(/tl-hidden/)
    await expect(itemSlowOnly).not.toHaveClass(/tl-hidden/)

    // Click PESIMISTA (slow) → slow-only Y medium ocultos (.tl-hidden, display:none); all visible.
    await page.locator('.pace-btn[data-pace="slow"]').click()
    await expect(page.locator('.pace-btn[data-pace="slow"]')).toHaveClass(/\bactive\b/)
    await expect(itemMedium).toHaveClass(/tl-hidden/)
    await expect(itemMedium).toBeHidden()
    await expect(itemSlowOnly).toHaveClass(/tl-hidden/)
    await expect(transportSlowOnly).toHaveClass(/tl-hidden/)
    await expect(itemAll).not.toHaveClass(/tl-hidden/)
    await expect(itemAll).toBeVisible()
    // Pitfall 4: food/meta/resv NUNCA se ocultan por ritmo.
    await expect(food).not.toHaveClass(/tl-hidden/)
    await expect(meta).not.toHaveClass(/tl-hidden/)
    await expect(resv).not.toHaveClass(/tl-hidden/)

    // Click NEUTRA (neutral) → SOLO slow-only oculto; medium VUELVE a verse.
    await page.locator('.pace-btn[data-pace="neutral"]').click()
    await expect(page.locator('.pace-btn[data-pace="neutral"]')).toHaveClass(/\bactive\b/)
    await expect(itemSlowOnly).toHaveClass(/tl-hidden/)
    await expect(itemMedium).not.toHaveClass(/tl-hidden/)
    await expect(itemMedium).toBeVisible()
    await expect(itemAll).not.toHaveClass(/tl-hidden/)

    // Volver a OPTIMISTA → nada oculto.
    await page.locator('.pace-btn[data-pace="optimistic"]').click()
    await expect(itemSlowOnly).not.toHaveClass(/tl-hidden/)
    await expect(itemMedium).not.toHaveClass(/tl-hidden/)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('FEAT-07 caminar menos: fuerza slow, dia-ligera, aria-pressed; al desactivar NO revierte', async ({ page }) => {
    await gotoHydrated(page)

    const lightToggle = page.locator('#light-toggle')
    const itemMedium = page.locator('.tl-item[data-pace="medium"]').first()
    const diaLigera = page.locator('.dia-ligera').first()

    // Por defecto: sin light-mode, .dia-ligera CSS-oculta, aria-pressed=false.
    await expect(page.locator('body')).not.toHaveClass(/light-mode/)
    await expect(diaLigera).toBeHidden()
    await expect(lightToggle).toHaveAttribute('aria-pressed', 'false')

    // Click → body.light-mode + el ritmo pasa a SLOW (las medium se ocultan) + .dia-ligera visible
    // + aria-pressed=true.
    await lightToggle.click()
    await expect(page.locator('body')).toHaveClass(/light-mode/)
    await expect(lightToggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.pace-btn[data-pace="slow"]')).toHaveClass(/\bactive\b/)
    await expect(itemMedium).toHaveClass(/tl-hidden/)
    await expect(diaLigera).toBeVisible()

    // Click otra vez → body PIERDE light-mode, PERO el ritmo SIGUE slow (Pitfall 5: no revierte).
    await lightToggle.click()
    await expect(page.locator('body')).not.toHaveClass(/light-mode/)
    await expect(lightToggle).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('.pace-btn[data-pace="slow"]')).toHaveClass(/\bactive\b/)
    await expect(itemMedium).toHaveClass(/tl-hidden/)
    await expect(diaLigera).toBeHidden() // la versión ligera sí depende de body.light-mode
  })

  test('FEAT-08 resumen: body.modo-resumen oculta el set exacto y mantiene item/food/resv', async ({ page }) => {
    await gotoHydrated(page)

    const resumenToggle = page.locator('#resumen-toggle')
    await expect(page.locator('body')).not.toHaveClass(/modo-resumen/)
    await expect(resumenToggle).toHaveAttribute('aria-pressed', 'false')

    await resumenToggle.click()
    await expect(page.locator('body')).toHaveClass(/modo-resumen/)
    await expect(resumenToggle).toHaveAttribute('aria-pressed', 'true')

    // El SET EXACTO oculto (leaflet.css:793-798): day-stats, day-subtitle, dia-ligera, tl-meta,
    // tl-transport, cards-list → display:none.
    await expect(page.locator('.day-stats').first()).toBeHidden()
    await expect(page.locator('.day-subtitle').first()).toBeHidden()
    await expect(page.locator('.dia-ligera').first()).toBeHidden()
    await expect(page.locator('.tl-meta').first()).toBeHidden()
    await expect(page.locator('.tl-transport').first()).toBeHidden()
    await expect(page.locator('.cards-list').first()).toBeHidden()

    // Lo que SIGUE visible en la vista índice: las paradas, las comidas y las bandas de reserva.
    await expect(page.locator('.tl-item[data-pace="all"]').first()).toBeVisible()
    await expect(page.locator('.tl-food').first()).toBeVisible()
    await expect(page.locator('.tl-resv-meta').first()).toBeVisible()

    // Desactivar → vuelve todo.
    await resumenToggle.click()
    await expect(page.locator('body')).not.toHaveClass(/modo-resumen/)
    await expect(page.locator('.cards-list').first()).toBeVisible()
  })

  test('SC#4 persistencia: roma-pace=slow preseteado se restaura tras recargar', async ({ browser }) => {
    const context = await browser.newContext()
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('roma-pace', 'slow')
      }
      catch { /* noop */ }
    })
    const page = await context.newPage()
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    // Restauración en onMounted → el ritmo guardado se aplica (slow activo, medium oculto).
    await expect(page.locator('.pace-btn[data-pace="slow"]')).toHaveClass(/\bactive\b/)
    await expect(page.locator('.tl-item[data-pace="medium"]').first()).toHaveClass(/tl-hidden/)
    await context.close()
  })

  test('SC#4 persistencia: roma-light=1 fuerza slow + body.light-mode tras recargar', async ({ browser }) => {
    const context = await browser.newContext()
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('roma-light', '1')
      }
      catch { /* noop */ }
    })
    const page = await context.newPage()
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toHaveClass(/light-mode/)
    await expect(page.locator('#light-toggle')).toHaveAttribute('aria-pressed', 'true')
    // light fuerza slow (el watch del composable).
    await expect(page.locator('.pace-btn[data-pace="slow"]')).toHaveClass(/\bactive\b/)
    await expect(page.locator('.dia-ligera').first()).toBeVisible()
    await context.close()
  })

  test('SC#4 persistencia: roma-resumen=1 restaura body.modo-resumen tras recargar', async ({ browser }) => {
    const context = await browser.newContext()
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('roma-resumen', '1')
      }
      catch { /* noop */ }
    })
    const page = await context.newPage()
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('body')).toHaveClass(/modo-resumen/)
    await expect(page.locator('#resumen-toggle')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.cards-list').first()).toBeHidden()
    await context.close()
  })

  test('SC#4 micro-flash INTENCIONAL: con roma-pace=slow, 1er paint default → slow 1 frame después', async ({ browser }) => {
    // El micro-flash es lo OPUESTO al tema (que usa script anti-FOUC). El estado de modos se
    // restaura en onMounted (1 frame tras el paint), así que con roma-pace=slow preseteado, una
    // .tl-item[data-pace=medium] arranca SIN .tl-hidden (estado default optimista del prerender) y
    // gana .tl-hidden tras montar. Mirror de theme.spec.ts: observamos la transición con un
    // MutationObserver que registra la presencia de .tl-hidden en una fila medium concreta.
    const context = await browser.newContext()
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('roma-pace', 'slow')
      }
      catch { /* noop */ }
    })
    const page = await context.newPage()

    const hiddenStates: boolean[] = []
    await page.exposeFunction('__recordHidden', (h: boolean) => {
      hiddenStates.push(h)
    })
    await page.addInitScript(() => {
      const w = window as unknown as { __recordHidden?: (h: boolean) => void }
      const watch = () => {
        const el = document.querySelector('.tl-item[data-pace="medium"]')
        if (!el) {
          // El nodo aún no está; reintenta en el próximo frame.
          requestAnimationFrame(watch)
          return
        }
        // Estado INICIAL (debe ser visible: el prerender es optimista, sin .tl-hidden).
        w.__recordHidden?.(el.classList.contains('tl-hidden'))
        new MutationObserver(() => {
          w.__recordHidden?.(el.classList.contains('tl-hidden'))
        }).observe(el, { attributes: true, attributeFilter: ['class'] })
      }
      watch()
    })

    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    // Estado FINAL tras hidratación + restauración: la fila medium queda oculta (slow restaurado).
    await expect(page.locator('.tl-item[data-pace="medium"]').first()).toHaveClass(/tl-hidden/)

    // El PRIMER estado observado fue VISIBLE (no oculto): es el paint default optimista, ANTES de
    // que onMounted restaure slow → existió un micro-flash default→slow (SC#4, intencional).
    expect(hiddenStates.length, 'debe haberse observado al menos un estado').toBeGreaterThan(0)
    expect(hiddenStates[0], 'el 1er paint debe ser el default (medium visible, sin tl-hidden)').toBe(false)
    // Y en algún momento posterior pasó a oculto (la restauración de slow).
    expect(hiddenStates.some(h => h === true), 'debe transicionar a oculto tras restaurar slow').toBe(true)

    await context.close()
  })
})
