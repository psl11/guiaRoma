import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * RENDER DE LAS SECCIONES DE REFERENCIA sobre el «/» CONSTRUIDO (SC#3/UI-04):
 * #reservas (tabla + badges) · #gastronomia (7 grupos en orden canónico) · #arte (artist-cards) ·
 * #arquitectura (arch-glosario).
 *
 * AUTOCONTENIDO (mirror EXACTO de tests/parity/shell.spec.ts): NO usa el webServer de
 * playwright.config.ts (que sirve el index.html VIVO del golden). `pnpm generate` una vez,
 * `.output/public/*` → subcarpeta `guiaRoma/`, static server propio bajo /guiaRoma/.
 *
 * Estas 4 secciones dependían de D1/D-04-D (las colecciones-unión artist/reference no
 * materializaban columnas SQL → salían VACÍAS). RESUELTO (commit 89ea4ac, superset row schemas),
 * así que este spec puede aseverar CONTENIDO REAL (badges, orden de gastro, artist-cards, los 10
 * términos del glosario). Verifica además que el ORDEN canónico de gastro (Pitfall 6) sobrevive al
 * orden alfabético de `queryCollection('food').all()`.
 *
 * NO modifica golden.spec.ts ni rebaselina (D-08). Tolera SOLO el error de hidratación de
 * @nuxtjs/color-mode (D-07) y falla ante cualquier otro.
 */

const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i
const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

// Orden CANÓNICO de los 7 grupos de gastronomía (index.html, NO el alfabético de la colección).
const CANONICAL_GASTRO_GROUPS = [
  'Pasta clásica · trattorias históricas',
  'Quinto quarto · cocina de Testaccio',
  'Cocina giudaico-romana · Ghetto',
  'Pizza',
  'Gelato',
  'Café · desayuno · pastelería',
  'Bar · aperitivo · salotto romano',
]

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

test.describe('render de las secciones de referencia en /guiaRoma/ construido (SC#3/UI-04)', () => {
  const STATIC_PORT = 5600 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_URL = `http://localhost:${STATIC_PORT}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-reference-'))
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

  test('#reservas: tabla con badges (urgent/done/rec) + filas is-done', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })

    const response = await page.goto(STATIC_URL)
    expect(response?.status()).toBe(200)
    await page.waitForLoadState('networkidle')

    const reservas = page.locator('#reservas')
    await expect(reservas.locator('.section-eyebrow')).toBeVisible()
    await expect(reservas.locator('h2.section-title')).toBeVisible()

    // La tabla "cuándo reservar" salió desde datos (D1 resuelto): filas + las 3 clases de badge.
    const table = reservas.locator('.reservas-table')
    await expect(table).toHaveCount(1)
    await expect(table.locator('tr')).toHaveCount(11)
    await expect(reservas.locator('.reservas-badge.badge-urgent').first()).toBeVisible()
    await expect(reservas.locator('.reservas-badge.badge-done').first()).toBeVisible()
    await expect(reservas.locator('.reservas-badge.badge-rec').first()).toBeVisible()
    // Filas ya reservadas (tr.is-done) presentes.
    await expect(table.locator('tr.is-done')).toHaveCount(4)

    // Reservas confirmadas (mesas + visitas) renderizadas con su rc-when.
    await expect(reservas.locator('.reservas-confirmadas .rc-when').first()).toBeVisible()

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('#gastronomia: los 7 grupos en ORDEN CANÓNICO + sus gastro-card', async ({ page }) => {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    const gastro = page.locator('#gastronomia')
    // Los 7 títulos de grupo EN EL ORDEN CANÓNICO (Pitfall 6 — NO el alfabético de la colección).
    await expect(gastro.locator('.gastro-section-title')).toHaveText(CANONICAL_GASTRO_GROUPS)
    // Las 26 fichas de gastronomía repartidas en los grupos.
    await expect(gastro.locator('.gastro-card')).toHaveCount(26)
    // Cada grupo tiene al menos una gastro-grid con cards.
    await expect(gastro.locator('.gastro-grid').first().locator('.gastro-card').first()).toBeVisible()
  })

  test('#arte: artist-cards desde datos (D1 resuelto)', async ({ page }) => {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    const arte = page.locator('#arte')
    await expect(arte.locator('.section-eyebrow')).toContainText('entender lo que ves')
    await expect(arte.locator('h2.section-title')).toHaveText('Arte')
    await expect(arte.locator('p.art-intro')).toBeVisible()
    // 7 fichas de artista (kind=artist), cada una con su cabecera + secciones + "lo verás".
    await expect(arte.locator('.artist-card')).toHaveCount(7)
    const bernini = arte.locator('#art-bernini')
    await expect(bernini.locator('.artist-head h3')).toHaveText('Gian Lorenzo Bernini')
    await expect(bernini.locator('.artist-section').first()).toBeVisible()
    await expect(bernini.locator('.artist-trip .artist-trip-head')).toContainText('Lo verás')
  })

  test('#arquitectura: 5 edades + el glosario con sus 10 arch-term', async ({ page }) => {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    const arq = page.locator('#arquitectura')
    await expect(arq.locator('.section-eyebrow')).toContainText('leer los edificios')
    await expect(arq.locator('h2.section-title')).toHaveText('Arquitectura')
    await expect(arq.locator('p.art-intro')).toBeVisible()
    // 6 artist-cards: 5 edades (kind=arquitectura) + el glosario (kind=glossary), el glosario al final.
    await expect(arq.locator('.artist-card')).toHaveCount(6)
    await expect(arq.locator('#arq-antigua .artist-head h3')).toHaveText('Roma antigua')

    // El glosario: contenedor .arch-glossary con EXACTAMENTE 10 .arch-term (b + span def).
    const glossary = arq.locator('#arq-glosario')
    await expect(glossary).toHaveCount(1)
    await expect(glossary.locator('.arch-glossary')).toHaveCount(1)
    await expect(glossary.locator('.arch-glossary .arch-term')).toHaveCount(10)
    await expect(glossary.locator('.arch-term b').first()).toBeVisible()
    // El glosario es la ÚLTIMA tarjeta de la sección (índice del original, index.html:6202).
    await expect(arq.locator('.artist-card').last()).toHaveAttribute('id', 'arq-glosario')
  })
})
