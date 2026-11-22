import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import type { Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test'
import { OUTPUT_DIR, ROMA_HTML, ROMA_URL, SITE_BASE } from './_harness'
import { startPagesServer } from './_pagesServer'

/**
 * UPGRADE DESDE LA GUÍA VIVA DE `main` EN EL MISMO ORIGEN (PAR-03, Fase 14, D-03/D-04).
 *
 * Qué significa PAR-03: quien usa hoy la guía publicada (el `index.html` único de `main`) y ha
 * escrito notas en las fichas y elegido ritmo, «Caminar menos», modo resumen y tema, abre la build
 * nueva EN EL MISMO ORIGEN y encuentra todo en `/guiaRoma/trips/roma/` en la PRIMERA carga: sin
 * importar nada, sin paso de migración (ninguna clave nueva), sin recargar (una sola carga de
 * documento) y sin perder ningún valor guardado. Las claves por viaje `${slug}-${clave}` (Fase 9)
 * se diseñaron para que las de Roma sean EXACTAMENTE las de siempre (`roma-note-<ficha>`,
 * `roma-pace`, `roma-light`, `roma-resumen`; el tema sigue global en `roma-theme`); este spec es
 * el primero que ejecuta la guía vieja REAL contra la build nueva REAL.
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

/** Todo el localStorage del origen de la página, como objeto clave → valor. */
async function storageSnapshot(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k !== null) out[k] = localStorage.getItem(k) ?? ''
    }
    return out
  })
}

/** El estado que la guía viva restaura por sí misma y lo que deja escrito al restaurar. */
interface Oracle {
  state: UiState
  storage: Record<string, string>
}

/**
 * ORÁCULO (D-03): el estado esperado NUNCA se escribe a mano. Un contexto de navegador NUEVO abre
 * la guía viva (con el servidor viejo aún levantado), siembra su localStorage con la instantánea
 * del usuario, recarga y captura lo que la propia guía viva restaura (y lo que reescribe al
 * restaurar). Es la restauración de `main` sobre el mismo almacenamiento.
 */
async function oracleFromLiveGuide(
  browser: Browser,
  viewport: { width: number, height: number } | null,
  origin: string,
  snapshot: Record<string, string>,
): Promise<Oracle> {
  const context = await browser.newContext({ viewport })
  try {
    const p = await context.newPage()
    await blockOffOrigin(p, origin)
    await p.goto(`${origin}${SITE_BASE}index.html`)
    await p.waitForLoadState('load')
    await p.evaluate((snap) => {
      localStorage.clear()
      for (const [k, v] of Object.entries(snap)) localStorage.setItem(k, v)
    }, snapshot)
    await p.reload()
    await p.waitForLoadState('load')
    await expect(p.locator('.notes-textarea')).toHaveCount(ROMA_MONUMENTS.length)
    return { state: await p.evaluate(captureState), storage: await storageSnapshot(p) }
  }
  finally {
    await context.close()
  }
}

/** Lo que pinta el HTML publicado por sí solo en una ruta, sin JS de la app. */
interface NoAppJsPaint {
  path: string
  theme: string | null
  /** `true` si algún JS de la app llegó a ejecutarse (no debe: invalidaría la prueba). */
  appRan: boolean
}

/**
 * «Sin primer pintado claro» (WR-01 de 14-REVIEW.md). El módulo de Nuxt se ejecuta ANTES de
 * `DOMContentLoaded`, así que leer `data-theme` en `domcontentloaded` con la app viva no distingue
 * el script inline de color-mode en `<head>` (antes del primer pintado) de un tema puesto por la
 * app tras pintar claro. Aquí se aíslan los dos: un contexto NUEVO con el almacenamiento del
 * usuario (`storageState`) abre cada ruta con TODO `/_nuxt/` abortado, así que solo corre el HTML
 * publicado y su script inline. El HTML prerenderizado no trae `data-theme`: lo que se lee es lo
 * que pone ese script antes de pintar.
 */
async function paintWithoutAppJs(
  browser: Browser,
  contextOptions: BrowserContextOptions,
  origin: string,
  storage: Record<string, string>,
  paths: string[],
): Promise<{ paints: NoAppJsPaint[], abortedAppRequests: number }> {
  const context = await browser.newContext({
    ...contextOptions,
    storageState: { cookies: [], origins: [{ origin, localStorage: Object.entries(storage).map(([name, value]) => ({ name, value })) }] },
  })
  try {
    let abortedAppRequests = 0
    await context.route('**/*', (route) => {
      const url = route.request().url()
      const sameOrigin = url.startsWith(`${origin}/`)
      if (sameOrigin && url.includes('/_nuxt/')) abortedAppRequests++
      if (sameOrigin && !url.includes('/_nuxt/')) return route.continue()
      return route.abort()
    })
    const p = await context.newPage()
    const paints: NoAppJsPaint[] = []
    for (const path of paths) {
      await p.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' })
      paints.push({
        path,
        ...await p.evaluate(() => ({
          theme: document.documentElement.getAttribute('data-theme'),
          appRan: typeof (window as unknown as { useNuxtApp?: unknown }).useNuxtApp === 'function',
        })),
      })
    }
    return { paints, abortedAppRequests }
  }
  finally {
    await context.close()
  }
}

/**
 * Cuenta las cargas de DOCUMENTO del marco principal (peticiones de navegación), no los cambios
 * de URL por History API. Un `location.reload()` de «migración» suma una más (WR-02).
 */
function countDocumentLoads(page: Page): { n: number } {
  const c = { n: 0 }
  page.on('request', (r) => {
    if (r.isNavigationRequest() && r.frame() === page.mainFrame()) c.n++
  })
  return c
}

/**
 * La ÚNICA clave nueva legítima: si el usuario nunca tocó el tema (no hay `roma-theme`),
 * @nuxtjs/color-mode persiste al arrancar su preferencia por defecto `roma-theme=system`. Es la
 * conducta del módulo desde la v1.0, no una migración: no copia ni transforma ningún valor del
 * usuario, y `system` (seguir al sistema) es lo mismo que hacía la guía viva sin clave. Se acepta
 * SOLO con ese valor exacto.
 */
const COLOR_MODE_DEFAULT = { key: 'roma-theme', value: 'system' } as const

/** Claves de `after` que no están en `allowed`: una migración que copia a claves nuevas (WR-02). */
const newKeys = (after: Record<string, string>, allowed: Set<string>): string[] =>
  Object.keys(after)
    .filter(k => !allowed.has(k))
    .filter(k => !(k === COLOR_MODE_DEFAULT.key && after[k] === COLOR_MODE_DEFAULT.value))
    .map(k => `${k}=${after[k]}`)
    .sort()

/** Nota distinta por ficha: comillas latinas y dobles, acento, euro y salto de línea. */
const noteFor = (key: string): string => `Nota de ${key}: «volver» al café, 3 € el "ristretto".\nSegunda línea — ${key}.`

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

  test('upgrade: las notas de las 38 fichas, el ritmo, el modo resumen y el tema oscuro llegan intactos a /trips/roma/ en la primera carga', async ({ browser, page }) => {
    const orphanKey = 'roma-note-ficha-retirada'
    const orphanNote = 'Nota de una ficha que ya no existe: «no se pierde».\nNunca.'
    await blockOffOrigin(page, ORIGIN)

    // 1) La guía viva, como un usuario real: tema oscuro, una nota en CADA ficha (antes del modo
    //    resumen, que oculta las fichas), ritmo «Neutra» y modo resumen.
    server = await startPagesServer(oldDir, PORT)
    await page.goto(LIVE_URL)
    await page.waitForLoadState('load')
    const textareas = page.locator('.notes-textarea')
    await expect(textareas).toHaveCount(ROMA_MONUMENTS.length)
    await page.locator('.theme-btn').click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    for (let i = 0; i < ROMA_MONUMENTS.length; i++) {
      const ta = textareas.nth(i)
      const key = await ta.getAttribute('data-note-key')
      await ta.fill(noteFor(key ?? ''))
    }
    await page.locator('.pace-btn[data-pace="neutral"]').click()
    await page.locator('#resumen-toggle').click()
    // Borde «nota huérfana»: una clave de nota cuya ficha ya no existe en la guía nueva.
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [orphanKey, orphanNote] as const)

    const s0 = await storageSnapshot(page)
    const oracle = await oracleFromLiveGuide(browser, page.viewportSize(), ORIGIN, s0)
    const e = oracle.state
    // Sin migración a claves nuevas (WR-02): solo pueden existir las claves del usuario y las que
    // la propia guía viva deja al restaurar.
    const allowed = new Set([...Object.keys(s0), ...Object.keys(oracle.storage)])

    // No vacuidad: el oráculo NO es el estado por defecto, y sus claves son las del contenido.
    expect(e.pace, 'oráculo: ritmo neutra').toBe('neutral')
    expect(e.light, 'oráculo: sin «Caminar menos»').toBe(false)
    expect(e.resumen, 'oráculo: modo resumen').toBe(true)
    expect(e.theme, 'oráculo: tema oscuro').toBe('dark')
    expect(Object.keys(e.notes).sort(), 'oráculo: las 38 claves de nota del contenido').toEqual(ROMA_MONUMENTS)
    for (const key of ROMA_MONUMENTS) expect(e.notes[key], `oráculo: nota de ${key}`).toBe(noteFor(key))
    expect(s0[orphanKey], 'la nota huérfana está en el almacenamiento del usuario').toBe(orphanNote)

    // 2) Se publica la build nueva en el MISMO origen (mismo puerto, mismo contexto).
    await stopServer(server)
    server = await startPagesServer(OUTPUT_DIR, PORT)

    // 2b) Sin primer pintado claro (WR-01): con el almacenamiento del usuario y SIN ningún JS de
    //     la app, el HTML publicado de la portada y de Roma ya pinta oscuro. Control: con el
    //     almacenamiento vacío (y el esquema claro por defecto del navegador) pinta claro, así que
    //     el oscuro sale de `roma-theme` y no de un valor fijo.
    const noJs = await paintWithoutAppJs(browser, { viewport: page.viewportSize() }, ORIGIN, s0, [SITE_BASE, ROMA_URL])
    expect(noJs.abortedAppRequests, 'no vacuidad: se abortaron peticiones /_nuxt/ (la app no cargó)').toBeGreaterThan(0)
    expect(noJs.paints, 'sin JS de la app, portada y Roma ya pintan oscuro (script inline de <head>)').toEqual([
      { path: SITE_BASE, theme: 'dark', appRan: false },
      { path: ROMA_URL, theme: 'dark', appRan: false },
    ])
    const noJsControl = await paintWithoutAppJs(browser, { viewport: page.viewportSize() }, ORIGIN, {}, [ROMA_URL])
    expect(noJsControl.paints, 'control: sin roma-theme, el mismo HTML pinta claro').toEqual([{ path: ROMA_URL, theme: 'light', appRan: false }])

    // 3) Un marcador viejo a la raíz: la portada ya pinta oscuro antes de hidratar y no escribe nada.
    await page.goto(`${ORIGIN}${SITE_BASE}`, { waitUntil: 'domcontentloaded' })
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'portada oscura ya en domcontentloaded').toBe('dark')
    await hydrated(page)
    expect(await storageSnapshot(page), 'la portada no toca el almacenamiento').toEqual(s0)

    // 4) Primera carga de Roma desde la tarjeta: sin recarga, sin clic extra, sin migración.
    //    La tarjeta es un <a href> normal: UNA carga de documento; una recarga de migración sería
    //    la segunda (WR-02).
    const docLoads = countDocumentLoads(page)
    await page.locator(`a.trip-index-card[href="${ROMA_URL}"]`).click()
    await page.waitForURL(`${ORIGIN}${ROMA_URL}`, { waitUntil: 'domcontentloaded' })
    expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'Roma oscura ya en domcontentloaded (el primer pintado sin app lo prueba el paso 2b)').toBe('dark')
    await hydrated(page)
    await expect.poll(() => page.evaluate(captureState), { timeout: 15_000, message: 'primera carga = restauración de la guía viva' }).toEqual(e)

    // Sin pérdida: cada clave del usuario conserva su valor byte a byte (huérfana incluida), igual
    // que tras la propia restauración de la guía viva.
    await page.waitForLoadState('networkidle')
    expect(docLoads.n, 'una sola carga de documento al abrir Roma (sin recarga de migración)').toBe(1)
    const after = await storageSnapshot(page)
    for (const [k, v] of Object.entries(s0)) {
      expect(after[k], `clave ${k} intacta tras la primera carga`).toBe(v)
      expect(oracle.storage[k], `la guía viva tampoco reescribe ${k}`).toBe(v)
    }
    expect(newKeys(after, allowed), 'sin claves nuevas tras la primera carga (sin migración)').toEqual([])
    const shown = await page.locator('.notes-textarea').evaluateAll(els => els.map(el => (el as HTMLTextAreaElement).value))
    expect(shown, 'ninguna ficha muestra la nota huérfana').not.toContain(orphanNote)

    // 5) Recargar no cambia nada (y la recarga es la única carga de documento nueva).
    docLoads.n = 0
    await page.reload()
    await hydrated(page)
    await expect.poll(() => page.evaluate(captureState), { timeout: 15_000, message: 'tras recargar = restauración de la guía viva' }).toEqual(e)
    await page.waitForLoadState('networkidle')
    expect(docLoads.n, 'recargar = una sola carga de documento').toBe(1)
    expect(newKeys(await storageSnapshot(page), allowed), 'sin claves nuevas tras recargar').toEqual([])

    // 6) Campania: el tema es global (oscuro), pero ritmo, modos y notas son por viaje (por defecto).
    await page.goto(`${ORIGIN}${SITE_BASE}trips/campania/`)
    await hydrated(page)
    await expect(page.locator('html'), 'Campania también oscura (tema global)').toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('.pace-btn.active'), 'Campania: ritmo por defecto').toHaveAttribute('data-pace', 'optimistic')
    await expect(page.locator('body')).not.toHaveClass(/(^|\s)(light-mode|modo-resumen)(\s|$)/)
    const campaniaNotes = await page.locator('.notes-textarea').evaluateAll(els => els.map(el => (el as HTMLTextAreaElement).value))
    expect(campaniaNotes.length, 'Campania tiene áreas de notas (no vacuidad)').toBeGreaterThan(0)
    expect(campaniaNotes.every(v => v === ''), 'las notas de Campania están vacías').toBe(true)
    const final = await storageSnapshot(page)
    for (const [k, v] of Object.entries(s0)) expect(final[k], `clave ${k} intacta tras Campania`).toBe(v)
    expect(newKeys(final, allowed), 'sin claves nuevas tras Campania').toEqual([])
  })

  test('upgrade: «caminar menos» guardado con otro ritmo se restaura como en la guía viva (ritmo pesimista forzado)', async ({ browser, page }) => {
    await blockOffOrigin(page, ORIGIN)

    // 1) La guía viva: una nota, «Caminar menos» (fuerza Pesimista), y DESPUÉS ritmo «Neutra»:
    //    el almacenamiento queda con roma-pace=neutral y roma-light=1 (el borde), y modo resumen.
    server = await startPagesServer(oldDir, PORT)
    await page.goto(LIVE_URL)
    await page.waitForLoadState('load')
    const first = page.locator('.notes-textarea').first()
    await expect(page.locator('.notes-textarea')).toHaveCount(ROMA_MONUMENTS.length)
    const firstKey = await first.getAttribute('data-note-key')
    await first.fill(noteFor(firstKey ?? ''))
    await page.locator('#light-toggle').click()
    await page.locator('.pace-btn[data-pace="neutral"]').click()
    const edge = await page.evaluate(() => [localStorage.getItem('roma-pace'), localStorage.getItem('roma-light')])
    expect(edge, 'borde: ritmo guardado neutra con «Caminar menos» activado').toEqual(['neutral', '1'])
    await page.locator('#resumen-toggle').click()

    const s0 = await storageSnapshot(page)
    const oracle = await oracleFromLiveGuide(browser, page.viewportSize(), ORIGIN, s0)
    const e = oracle.state
    const allowed = new Set([...Object.keys(s0), ...Object.keys(oracle.storage)])
    expect(e.pace, 'oráculo: la guía viva fuerza Pesimista al restaurar «Caminar menos»').toBe('slow')
    expect(e.light, 'oráculo: «Caminar menos»').toBe(true)
    expect(e.resumen, 'oráculo: modo resumen').toBe(true)
    expect(e.notes[firstKey ?? ''], 'oráculo: la nota escrita').toBe(noteFor(firstKey ?? ''))

    // 2) Build nueva en el MISMO origen; primera carga directa de Roma.
    await stopServer(server)
    server = await startPagesServer(OUTPUT_DIR, PORT)
    const docLoads = countDocumentLoads(page)
    await page.goto(`${ORIGIN}${ROMA_URL}`)
    await hydrated(page)
    await expect.poll(() => page.evaluate(captureState), { timeout: 15_000, message: 'primera carga = restauración de la guía viva' }).toEqual(e)
    await page.waitForLoadState('networkidle')
    expect(docLoads.n, 'una sola carga de documento (sin recarga de migración)').toBe(1)

    // Almacenamiento: todo intacto salvo roma-pace, que pasa a «slow». Es la MISMA reescritura que
    // hace la guía viva al restaurar (setLightMode(true) → setPace('slow')), no una pérdida.
    expect(oracle.storage['roma-pace'], 'la guía viva también reescribe roma-pace a slow al restaurar').toBe('slow')
    await expect.poll(async () => (await storageSnapshot(page))['roma-pace'], { message: 'la build nueva reescribe roma-pace a slow, como la guía viva' }).toBe('slow')
    const after = await storageSnapshot(page)
    for (const [k, v] of Object.entries(s0)) {
      if (k === 'roma-pace') continue
      expect(after[k], `clave ${k} intacta tras la primera carga`).toBe(v)
      expect(oracle.storage[k], `la guía viva tampoco reescribe ${k}`).toBe(v)
    }
    expect(newKeys(after, allowed), 'sin claves nuevas tras la primera carga (sin migración)').toEqual([])
  })
})
