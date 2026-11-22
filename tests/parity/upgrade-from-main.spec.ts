import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import type { Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { OUTPUT_DIR, ROMA_HTML, ROMA_URL, SITE_BASE } from './_harness'
import { startPagesServer } from './_pagesServer'

/**
 * UPGRADE DESDE LA GUÍA VIVA DE `main` EN EL MISMO ORIGEN (PAR-03, Fase 14, D-03/D-04).
 *
 * Qué significa PAR-03: quien usa hoy la guía publicada (el `index.html` único de `main`) y ha
 * escrito notas en las fichas y elegido ritmo, «Caminar menos», modo resumen y tema, abre la build
 * nueva EN EL MISMO ORIGEN y encuentra todo en `/guiaRoma/trips/roma/` en la PRIMERA carga: sin
 * importar nada, sin paso de migración, sin recargar y sin perder ningún valor guardado. Las claves
 * por viaje `${slug}-${clave}` (Fase 9) se diseñaron para que las de Roma sean EXACTAMENTE las de
 * siempre (`roma-note-<ficha>`, `roma-pace`, `roma-light`, `roma-resumen`; el tema sigue global en
 * `roma-theme`); este spec es el primero que ejecuta la guía vieja REAL contra la build nueva REAL.
 *
 * Por qué la guía vieja se toma con git en tiempo de test (D-03): `git show main:index.html` se
 * escribe en un directorio temporal nuevo de `os.tmpdir()` y se borra en `afterAll`. NUNCA se
 * versiona una copia bajo `tests/` (derivaría de `main` sin que nadie lo note). Sin la rama local
 * `main` el spec falla en voz alta (nunca se salta).
 *
 * Por qué un servidor por lado en el MISMO puerto y UN contexto de navegador (D-04): localStorage
 * es por origen (esquema + host + puerto). La guía vieja se sirve en `/guiaRoma/index.html` con su
 * propia instancia de `startPagesServer` en 127.0.0.1:PORT; ese servidor se cierra (cerrando antes
 * las conexiones keep-alive del navegador, que si no bloquearían el cierre) y la build nueva
 * (`.output/public` bajo `/guiaRoma/`) se levanta en el MISMO 127.0.0.1:PORT. El contexto del
 * usuario (y por tanto su localStorage) es el mismo de principio a fin: exactamente lo que vive un
 * usuario real cuando se publica la versión nueva.
 *
 * Puerto base propio 6600 + TEST_WORKER_INDEX (lejos de los demás specs de paridad; 14-02 usa
 * 6700). Este spec no edita ni importa ningún otro spec: los helpers de portada.spec.ts se clonan.
 */

/** Monumentos de Roma según el contenido: las fichas con área de notas en ambas guías. */
const ROMA_MONUMENTS = readdirSync(join(process.cwd(), 'content', 'trips', 'roma', 'monuments'))
  .filter(f => f.endsWith('.yml'))
  .map(f => f.slice(0, -'.yml'.length))
  .sort()

/** Asegura la build estática una sola vez (clon del de portada.spec.ts). */
function ensureBuild(): void {
  if (!existsSync(ROMA_HTML)) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(ROMA_HTML), 'la página de Roma de la build (ROMA_HTML) debe existir').toBe(true)
}

/** Aborta toda petición fuera del origen del servidor (tiles, Wikimedia, Google Fonts). */
async function blockOffOrigin(page: Page, origin: string): Promise<string[]> {
  const offOrigin: string[] = []
  await page.context().route('**/*', (route) => {
    const url = route.request().url()
    if (url.startsWith(`${origin}/`)) return route.continue()
    offOrigin.push(url)
    return route.abort()
  })
  return offOrigin
}

/** Espera a que Nuxt termine de hidratar la página actual (clon del de portada.spec.ts). */
async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const nuxt = (window as unknown as { useNuxtApp?: () => { isHydrating?: boolean } }).useNuxtApp
    return typeof nuxt === 'function' && nuxt().isHydrating === false
  })
}

/** La guía viva: el `index.html` de la rama `main`, leído con git en tiempo de test (D-03). */
function readLiveGuide(): string {
  let html: string
  try {
    html = execFileSync('git', ['show', 'main:index.html'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  }
  catch (err) {
    throw new Error(
      `«git show main:index.html» falló: este spec necesita la rama local \`main\` (la guía viva). ${String(err)}`,
      { cause: err },
    )
  }
  expect(html, 'main:index.html es la guía viva (tiene áreas de notas)').toContain('data-note-key=')
  expect(html, 'main:index.html es la guía viva (tiene «Caminar menos»)').toContain('id="light-toggle"')
  return html
}

/** Cierra un servidor sin que las conexiones keep-alive del navegador bloqueen el cierre. */
async function stopServer(server: Server): Promise<void> {
  server.closeAllConnections()
  await new Promise<void>((ok, fail) => server.close(err => (err ? fail(err) : ok())))
}

/** Lo que el usuario ve de su estado guardado. Solo selectores que existen en AMBAS guías. */
interface UiState {
  pace: string | null
  light: boolean
  resumen: boolean
  lightPressed: string | null
  resumenPressed: string | null
  theme: string | null
  notes: Record<string, string>
}

/** Se pasa a `page.evaluate`: corre en el navegador, sin cierres sobre el módulo. */
function captureState(): UiState {
  const notes: Record<string, string> = {}
  document.querySelectorAll<HTMLTextAreaElement>('.notes-textarea').forEach((ta) => {
    notes[ta.dataset.noteKey ?? ''] = ta.value
  })
  return {
    pace: document.querySelector('.pace-btn.active')?.getAttribute('data-pace') ?? null,
    light: document.body.classList.contains('light-mode'),
    resumen: document.body.classList.contains('modo-resumen'),
    lightPressed: document.querySelector('#light-toggle')?.getAttribute('aria-pressed') ?? null,
    resumenPressed: document.querySelector('#resumen-toggle')?.getAttribute('aria-pressed') ?? null,
    theme: document.documentElement.getAttribute('data-theme'),
    notes,
  }
}

test.describe('upgrade desde la guía viva de main en el mismo origen (PAR-03)', () => {
  test.describe.configure({ timeout: 120_000 })

  const PORT = 6600 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const ORIGIN = `http://127.0.0.1:${PORT}`
  const LIVE_URL = `${ORIGIN}${SITE_BASE}index.html`
  let oldDir = ''
  let server: Server | undefined

  test.beforeAll(() => {
    ensureBuild()
    oldDir = mkdtempSync(join(tmpdir(), 'guiaroma-upgrade-'))
    writeFileSync(join(oldDir, 'index.html'), readLiveGuide())
  })

  test.afterEach(async () => {
    if (server?.listening) await stopServer(server)
    server = undefined
  })

  test.afterAll(() => {
    if (oldDir) rmSync(oldDir, { recursive: true, force: true })
  })

  test('upgrade: una nota y el ritmo de la guía viva aparecen en /trips/roma/ en la primera carga', async ({ page }) => {
    const note = 'Volver al «óculo» con luz de tarde,\nsin "prisas".'
    await blockOffOrigin(page, ORIGIN)

    // 1) La guía viva, como un usuario real: escribe una nota y elige ritmo «Neutra».
    server = await startPagesServer(oldDir, PORT)
    await page.goto(LIVE_URL)
    await page.waitForLoadState('load')
    await expect(page.locator('.notes-textarea')).toHaveCount(ROMA_MONUMENTS.length)
    await page.locator('.notes-textarea[data-note-key="pantheon"]').fill(note)
    await page.locator('.pace-btn[data-pace="neutral"]').click()
    const stored = await page.evaluate(() => ({
      note: localStorage.getItem('roma-note-pantheon'),
      pace: localStorage.getItem('roma-pace'),
    }))
    expect(stored, 'la guía viva guardó la nota y el ritmo').toEqual({ note, pace: 'neutral' })

    // 2) Se publica la build nueva en el MISMO origen (mismo puerto, mismo contexto).
    await stopServer(server)
    server = await startPagesServer(OUTPUT_DIR, PORT)

    // 3) Primera carga de Roma: sin recarga, sin clic, sin migración.
    await page.goto(`${ORIGIN}${ROMA_URL}`)
    await hydrated(page)
    await expect(page.locator('.notes-textarea[data-note-key="pantheon"]')).toHaveValue(note)
    await expect(page.locator('.pace-btn.active')).toHaveAttribute('data-pace', 'neutral')
    const state = await page.evaluate(captureState)
    expect(Object.keys(state.notes).sort(), 'mismas 38 claves de nota que la guía viva').toEqual(ROMA_MONUMENTS)
  })
})
