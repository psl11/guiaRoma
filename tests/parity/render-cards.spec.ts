import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * RENDER DE FICHAS (.card) sobre el «/» CONSTRUIDO (SC#1/UI-02).
 *
 * AUTOCONTENIDO (mirror EXACTO de tests/parity/shell.spec.ts): NO usa el webServer de
 * playwright.config.ts (que sirve el index.html VIVO del golden). Generamos el sitio Nuxt
 * (`pnpm generate`) UNA vez, copiamos `.output/public/*` a una subcarpeta `guiaRoma/` y servimos
 * el directorio PADRE con un static server propio bajo /guiaRoma/ (topología GitHub Pages).
 *
 * La aserción de MAYOR VALOR: que la directiva MDC `:detail-photo{…}` se haya RESUELTO a un
 * componente real (`.detail-photo > img`) y NO a un párrafo de texto sin renderizar
 * (`<p>:detail-photo{...}</p>`). Si DetailPhoto.global.vue no estuviera registrado, la ficha
 * mostraría la sintaxis cruda en vez de la imagen. Lo verificamos en una ficha representativa
 * (#galleria-sciarra: lleva detail-photo + detail-list + dropcap + facts + maps-link + notas).
 *
 * NO modifica golden.spec.ts ni rebaselina snapshots (D-08): solo aserciones DOM/texto/conteo.
 * Tolera SOLO el error de hidratación de @nuxtjs/color-mode (D-07/D2) y falla ante cualquier otro.
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

/** Mata el GRUPO de procesos completo (líder detached) — evita zombies (WR-02). */
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

/** Asegura la build estática una sola vez (workers paralelos NO recompilan a la vez). */
function ensureBuild(): void {
  if (!existsSync(join(OUTPUT_DIR, 'index.html'))) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(join(OUTPUT_DIR, 'index.html')), '.output/public/index.html debe existir').toBe(true)
}

test.describe('render de fichas (.card) en /guiaRoma/ construido (SC#1/UI-02)', () => {
  const STATIC_PORT = 5400 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_URL = `http://localhost:${STATIC_PORT}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-cards-'))
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

  test('#galleria-sciarra resuelve detail-photo + detail-list + dropcap + facts + maps + notas', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })

    const response = await page.goto(STATIC_URL)
    expect(response?.status(), 'el documento bajo /guiaRoma/ debe responder 200').toBe(200)
    await page.waitForLoadState('networkidle')

    const card = page.locator('#galleria-sciarra')
    await expect(card).toHaveClass(/\bcard\b/)

    // Cabecera de la ficha (nombre + italiano + badge).
    await expect(card.locator('.card-header .card-roman')).toHaveText('I')
    await expect(card.locator('.card-title h3')).toHaveText('Galleria Sciarra')
    await expect(card.locator('.card-italian')).toContainText('Rione Trevi')
    await expect(card.locator('.card-badge')).toHaveText('Sorrentino')

    // ASERCIÓN DE MAYOR VALOR (SC#1): :detail-photo resolvió a un componente real con <img>,
    // NO a texto crudo `<p>:detail-photo{...}</p>`. La imagen vive en "En qué fijarse".
    // Se asevera la ESTRUCTURA (un .detail-photo > img con su src/alt del dato) en vez de la
    // VISIBILIDAD del píxel: las heros son URLs de Wikimedia (terceros) y la carga real es la barra
    // del checkpoint humano (D-06, Task 4) — no de un spec determinista (la imagen sin red tendría
    // tamaño 0 y daría "hidden" por motivos ajenos al render).
    const detailPhoto = card.locator('.detail-photo')
    await expect(detailPhoto).toHaveCount(1)
    const detailImg = detailPhoto.locator('img')
    await expect(detailImg).toBeAttached()
    await expect(detailImg).toHaveAttribute('alt', /Galleria Sciarra/i)
    await expect(detailImg).toHaveAttribute('src', /upload\.wikimedia\.org/)
    await expect(detailPhoto.locator('.detail-photo-caption')).toContainText('hierro')
    // La sintaxis cruda NO debe aparecer en ninguna parte de la ficha.
    await expect(card).not.toContainText(':detail-photo{')

    // detail-list (✦ + bordes, Pitfall 1) con el count del dato (5 bullets en "En qué fijarse").
    await expect(card.locator('.detail-list')).toHaveCount(1)
    await expect(card.locator('.detail-list li')).toHaveCount(5)

    // Dropcap (Pitfall 2): la 1ª .card-section SIN no-dropcap; las siguientes CON. La ficha tiene
    // 4 secciones (Qué es / Historia / Anécdotas / En qué fijarse) → 1 con dropcap + 3 no-dropcap.
    const sections = card.locator('.card-section')
    await expect(sections).toHaveCount(4)
    await expect(sections.first()).not.toHaveClass(/no-dropcap/)
    await expect(card.locator('.card-section.no-dropcap')).toHaveCount(3)
    // La prosa de sección debe ser un <p> real (el dropcap ::first-letter lo necesita), no inline.
    await expect(sections.first().locator('p').first()).toBeVisible()

    // facts-row presentes (4) con label + value.
    await expect(card.locator('.facts .facts-row')).toHaveCount(4)
    await expect(card.locator('.facts .facts-row').first().locator('.label')).toHaveText('Horario crítico')

    // maps-link → Google Maps search (rel noopener verbatim).
    const maps = card.locator('a.maps-link')
    await expect(maps).toHaveAttribute('href', /google\.com\/maps\/search/)
    await expect(maps).toHaveAttribute('rel', 'noopener')
    await expect(maps).toHaveText('Ver en Google Maps')

    // sorrentino-box (label + prosa); y que la prosa NO metió un <p> donde el original no lo tiene.
    const sorrentino = card.locator('.sorrentino-box')
    await expect(sorrentino).toHaveCount(1)
    await expect(sorrentino.locator('.label')).toHaveText('La Grande Bellezza')
    await expect(sorrentino.locator('p')).toHaveCount(0)

    // notes-area: shell con textarea[data-note-key] (sin persistencia — F7).
    const notes = card.locator('.notes-area')
    await expect(notes.locator('textarea[data-note-key="galleria-sciarra"]')).toBeAttached()

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('una ficha con card-artists/card-arch resuelve los enlaces .art-link', async ({ page }) => {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    // El Pantheon lleva card-artists (Raffaello…) con enlaces a #art-*; el original los pinta como
    // a.art-link (pill + bullet ✦/▣). Verifica que el override LOCAL a→ArtLink resolvió la clase.
    const pantheon = page.locator('#pantheon')
    await expect(pantheon).toHaveClass(/\bcard\b/)
    const artists = pantheon.locator('.card-artists').first()
    await expect(artists).toBeVisible()
    await expect(artists.locator('a.art-link').first()).toBeVisible()
    await expect(artists.locator('a.art-link').first()).toHaveAttribute('href', /^#art-/)
  })

  test('el corpus completo de fichas se renderiza con su shell (38 monumentos)', async ({ page }) => {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')

    // Las notas son shell por ficha (1 textarea[data-note-key] por monumento) → 38.
    await expect(page.locator('.notes-textarea[data-note-key]')).toHaveCount(38)
    // Cada ficha lleva su hero <img> (plano, F7 — el fallback SVG es de otra fase).
    await expect(page.locator('.cards-list .card .card-hero img')).toHaveCount(38)
  })
})
