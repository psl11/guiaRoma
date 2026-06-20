import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * RENDER DEL TIMELINE (.timeline) sobre el «/» CONSTRUIDO (SC#2/UI-03).
 *
 * AUTOCONTENIDO (mirror EXACTO de tests/parity/shell.spec.ts): NO usa el webServer de
 * playwright.config.ts (que sirve el index.html VIVO del golden). `pnpm generate` una vez,
 * `.output/public/*` → subcarpeta `guiaRoma/`, static server propio bajo /guiaRoma/.
 *
 * El timeline de #viernes contiene los 5 kinds del discriminatedUnion (stop/transport/meta/food/
 * reservation), incluida la fila `.tl-item.reserved-event` (la cena reservada). Se asevera que
 * el despachador (`<component :is>` resuelto por componente, no string crudo) PRODUCE las 5 clases
 * hoja con su markup, que `:data-pace` se conserva (paridad de atributo) y que el ORDEN de las
 * primeras filas coincide con el dato (la "ruta del día" que F6 deriva del orden — NUNCA reordenar).
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

test.describe('render del timeline (5 kinds + orden) en /guiaRoma/ construido (SC#2/UI-03)', () => {
  const STATIC_PORT = 5500 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_URL = `http://localhost:${STATIC_PORT}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-timeline-'))
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

  test('#viernes despacha los 5 kinds del timeline con su markup', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })

    const response = await page.goto(STATIC_URL)
    expect(response?.status()).toBe(200)
    await page.waitForLoadState('networkidle')

    const tl = page.locator('#viernes .timeline')
    await expect(tl).toHaveCount(1)

    // Los 5 kinds presentes (PRUEBA de que el dispatcher resolvió las hojas — no <TimelineStop/>
    // vacíos). El conteo exacto sale del dato de viernes.yml (9 paradas, 4 transportes, 6 metas,
    // 2 bloques de comida, 1 banda de reserva).
    await expect(tl.locator('.tl-item')).toHaveCount(9)
    await expect(tl.locator('.tl-transport')).toHaveCount(4)
    await expect(tl.locator('.tl-meta')).toHaveCount(6)
    await expect(tl.locator('.tl-food')).toHaveCount(2)
    await expect(tl.locator('.tl-resv-meta')).toHaveCount(1)

    // La cena reservada → .tl-item.reserved-event con su .tl-tag "reservado".
    const reserved = tl.locator('.tl-item.reserved-event')
    await expect(reserved).toHaveCount(1)
    await expect(reserved.locator('.tl-tag')).toHaveText('reservado')
    await expect(reserved.locator('a.tl-title')).toHaveAttribute('href', '#g-fortunata')

    // El markup interno de cada kind (no solo la clase raíz).
    await expect(tl.locator('.tl-item .tl-time').first()).toBeVisible()
    await expect(tl.locator('.tl-transport .tl-transport-modes').first()).toBeVisible()
    await expect(tl.locator('.tl-meta .tl-meta-item').first()).toBeVisible()
    await expect(tl.locator('.tl-food .tl-food-list').first()).toBeVisible()
    await expect(tl.locator('.tl-resv-meta strong')).toContainText('Osteria da Fortunata')

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('el timeline conserva :data-pace en .tl-item/.tl-transport (paridad de atributo)', async ({ page }) => {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    const tl = page.locator('#viernes .timeline')
    // TODAS las .tl-item y .tl-transport llevan data-pace (el filtrado real lo hace .tl-hidden, pero
    // el atributo debe seguir presente: index.html:6521 lo selecciona).
    const items = tl.locator('.tl-item')
    const itemCount = await items.count()
    for (let i = 0; i < itemCount; i++) {
      await expect(items.nth(i)).toHaveAttribute('data-pace', /^(all|medium|slow-only)$/)
    }
    const transports = tl.locator('.tl-transport')
    const tCount = await transports.count()
    for (let i = 0; i < tCount; i++) {
      await expect(transports.nth(i)).toHaveAttribute('data-pace', /^(all|medium|slow-only)$/)
    }

    // .tl-meta/.tl-food/.tl-resv-meta NO llevan data-pace (no se filtran por ritmo — Pitfall 4).
    await expect(tl.locator('.tl-meta[data-pace]')).toHaveCount(0)
    await expect(tl.locator('.tl-resv-meta[data-pace]')).toHaveCount(0)
  })

  test('el ORDEN de las filas del timeline coincide con el dato (la ruta del día)', async ({ page }) => {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    // Las paradas (.tl-item) deben salir en el ORDEN del dato (viernes.yml): el dispatcher NUNCA
    // reordena. Verificamos la secuencia de títulos de las primeras paradas.
    const titles = page.locator('#viernes .timeline .tl-item .tl-title')
    const texts = await titles.allInnerTexts()
    expect(texts.slice(0, 6)).toEqual([
      'Llegada · aeropuerto → hotel',
      'Hotel Royal Court · check-in',
      'Galleria Sciarra',
      'Fontana di Trevi',
      'Sant\'Ignazio di Loyola',
      'Pantheon (exterior)',
    ])
  })
})
