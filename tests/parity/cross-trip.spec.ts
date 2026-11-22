import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import type { Server } from 'node:http'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { readTripManifest } from '../../scripts/tripManifest.mjs'
import { OUTPUT_DIR, ROMA_HTML, ROMA_URL, SITE_BASE } from './_harness'
import { startPagesServer } from './_pagesServer'

/**
 * AISLAMIENTO ENTRE VIAJES Y CERO DESCARGAS PESADAS, SOBRE LA BUILD PUBLICADA (Fase 14, D-05).
 *
 * Qué prueba:
 *  · Ninguna página publicada (portada, Roma, Campania) ni ningún paso de historial entre ellas
 *    («Atrás» / «Adelante») descarga la base de contenido de cliente (`__nuxt_content/`,
 *    `sql_dump`, WASM): los datos de cada guía viajan prerenderizados en su payload. Extiende la
 *    aserción D-15 de la Fase 11 (que solo cubría portada y Roma) a Campania y cierra el hallazgo
 *    WR-06 de la revisión de la Fase 13.
 *  · Control positivo: la 404 de un borrador SÍ pide la base de contenido, así que el detector de
 *    peticiones ve esas descargas cuando ocurren y las aserciones de «cero» no pasan por ceguera.
 *  · Búsqueda, notas y modos (ritmo, «Caminar menos», modo resumen) no se mezclan entre Roma y
 *    Campania, tampoco al volver con «Atrás» y «Adelante» (claves `roma-*` / `campania-*`).
 *
 * Servidor: `startPagesServer` (tests/parity/_pagesServer.ts) imita a GitHub Pages sobre
 * `.output/public` bajo `/guiaRoma/` (301 a barra final, `404.html` real). Puerto base propio
 * 6700 + TEST_WORKER_INDEX (14-01 usa 6600; los demás specs, 4173 y 5000…5850).
 *
 * Historial: tras `goBack`/`goForward`, `page.url()` puede leerse aún con el valor anterior; por eso
 * cada paso espera la URL esperada, `networkidle`, la hidratación y un marcador propio de la página
 * (`landOn`), y solo entonces se comprueba nada.
 *
 * Cada test usa su propio contexto (fixture `page`): localStorage nuevo en cada uno.
 */

/** Peticiones de la base de contenido que ninguna página publicada debe hacer (D-15/D-05). */
const HEAVY_RE = /__nuxt_content\/|sql_dump|\.wasm(\?|$)/

const CAMPANIA_URL = `${SITE_BASE}trips/campania/`
const CAMPANIA_HTML = join(OUTPUT_DIR, 'trips', 'campania', 'index.html')

/** Slugs de las fichas de cada viaje, leídos del contenido (nunca escritos a mano). */
const slugsOf = (trip: string): string[] =>
  readdirSync(join(process.cwd(), 'content', 'trips', trip, 'monuments'))
    .filter(f => f.endsWith('.yml'))
    .map(f => f.slice(0, -'.yml'.length))
const ROMA_SLUGS = slugsOf('roma')
const CAMPANIA_SLUGS = slugsOf('campania')

/** Marcador inequívoco de cada página. */
const MARK = {
  portada: '.trip-index',
  roma: '[id="pantheon"]',
  campania: '[id="baia-di-sorgeto"]',
} as const

/** Asegura la build estática (clon del de portada.spec.ts, exigiendo también Campania). */
function ensureBuild(): void {
  if (!existsSync(ROMA_HTML) || !existsSync(CAMPANIA_HTML)) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(ROMA_HTML), 'la página de Roma de la build (ROMA_HTML) debe existir').toBe(true)
  expect(existsSync(CAMPANIA_HTML), 'la página de Campania de la build debe existir').toBe(true)
}

/** Aborta toda petición fuera del origen del servidor (tiles, Wikimedia); devuelve las abortadas. */
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

/** Espera a que Nuxt termine de hidratar la página actual. */
async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const nuxt = (window as unknown as { useNuxtApp?: () => { isHydrating?: boolean } }).useNuxtApp
    return typeof nuxt === 'function' && nuxt().isHydrating === false
  })
}

interface Tracker {
  /** Etiqueta del paso en curso (se antepone a cada petición pesada registrada). */
  step: string
  /** Peticiones pesadas como `<paso>: <url>`. */
  heavy: string[]
  /** Peticiones `/_nuxt/` por paso. */
  nuxtAssets: Record<string, number>
  /** Respuestas `/_nuxt/` >= 400 como `<paso>: <status> <url>`. */
  badAssets: string[]
}

/** Registra peticiones y respuestas de la página. Debe llamarse ANTES de cualquier navegación. */
function track(page: Page): Tracker {
  const t: Tracker = { step: 'inicio', heavy: [], nuxtAssets: {}, badAssets: [] }
  page.on('request', (r) => {
    const url = r.url()
    if (HEAVY_RE.test(url)) t.heavy.push(`${t.step}: ${url}`)
    if (url.includes('/_nuxt/')) t.nuxtAssets[t.step] = (t.nuxtAssets[t.step] ?? 0) + 1
  })
  page.on('response', (r) => {
    if (r.url().includes('/_nuxt/') && r.status() >= 400) t.badAssets.push(`${t.step}: ${r.status()} ${r.url()}`)
  })
  return t
}

/** Espera a estar de verdad en `url` (URL, red en calma, hidratación y marcador único). */
async function landOn(page: Page, url: string, marker: string): Promise<void> {
  await page.waitForURL(url)
  await page.waitForLoadState('networkidle')
  await hydrated(page)
  await expect(page.locator(marker)).toHaveCount(1)
  expect(page.url()).toBe(url)
}

test.describe('aislamiento entre viajes en la build publicada (D-05)', () => {
  const PORT = 6700 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const ORIGIN = `http://127.0.0.1:${PORT}`
  const PORTADA = `${ORIGIN}${SITE_BASE}`
  const ROMA = `${ORIGIN}${ROMA_URL}`
  const CAMPANIA = `${ORIGIN}${CAMPANIA_URL}`
  let server: Server | undefined

  test.beforeAll(async () => {
    ensureBuild()
    expect(ROMA_SLUGS.length, 'Roma tiene fichas').toBeGreaterThan(0)
    expect(CAMPANIA_SLUGS.length, 'Campania tiene fichas').toBeGreaterThan(0)
    server = await startPagesServer(OUTPUT_DIR, PORT)
  })

  test.afterAll(async () => {
    if (!server) return
    server.closeAllConnections()
    await new Promise<void>(r => server!.close(() => r()))
  })

  test('descargas: portada → Roma → Campania → «Atrás» → «Atrás» sin sql_dump ni WASM', async ({ page }) => {
    await blockOffOrigin(page, ORIGIN)
    const t = track(page)

    t.step = 'portada'
    await page.goto(PORTADA)
    await landOn(page, PORTADA, MARK.portada)

    t.step = 'roma'
    await page.goto(ROMA)
    await landOn(page, ROMA, MARK.roma)

    t.step = 'campania'
    await page.goto(CAMPANIA)
    await landOn(page, CAMPANIA, MARK.campania)

    t.step = 'atrás → roma'
    await page.goBack()
    await landOn(page, ROMA, MARK.roma)

    t.step = 'atrás → portada'
    await page.goBack()
    await landOn(page, PORTADA, MARK.portada)

    expect(t.heavy, `descargas de la base de contenido:\n${t.heavy.join('\n')}`).toHaveLength(0)
    for (const step of ['portada', 'roma', 'campania']) {
      expect(t.nuxtAssets[step] ?? 0, `control de no vacuidad: el paso «${step}» pidió assets /_nuxt/`).toBeGreaterThan(0)
    }
    expect(t.badAssets, `respuestas /_nuxt/ >= 400:\n${t.badAssets.join('\n')}`).toHaveLength(0)
  })

  test('descargas: control positivo — la 404 de un borrador sí pide la base de contenido', async ({ page }) => {
    // Mantiene honestas las aserciones de «cero descargas»: si el detector no viera nada aquí,
    // tampoco podría ver una descarga real en Roma o Campania.
    const drafts = readTripManifest().filter(trip => trip.draft).map(trip => trip.slug)
    expect(drafts.length, 'el manifiesto tiene al menos un borrador').toBeGreaterThan(0)
    await blockOffOrigin(page, ORIGIN)
    const t = track(page)

    t.step = `borrador ${drafts[0]}`
    const res = await page.goto(`${ORIGIN}${SITE_BASE}trips/${drafts[0]}/`)
    expect(res?.status(), 'un borrador responde 404').toBe(404)
    await expect.poll(() => t.heavy.length, { timeout: 15_000 }).toBeGreaterThan(0)
  })

  test('descargas: tarjeta de Roma → «← Todos los viajes» → tarjeta de Campania, Atrás y Adelante, sin sql_dump ni WASM', async ({ page }) => {
    await blockOffOrigin(page, ORIGIN)
    const t = track(page)

    t.step = 'portada'
    await page.goto(PORTADA)
    await landOn(page, PORTADA, MARK.portada)

    t.step = 'tarjeta → roma'
    await page.locator(`a.trip-index-card[href="${ROMA_URL}"]`).click()
    await landOn(page, ROMA, MARK.roma)

    t.step = '«← Todos los viajes» → portada'
    await page.locator('footer .trip-back a').click()
    await landOn(page, PORTADA, MARK.portada)

    t.step = 'tarjeta → campania'
    await page.locator(`a.trip-index-card[href="${CAMPANIA_URL}"]`).click()
    await landOn(page, CAMPANIA, MARK.campania)

    t.step = 'atrás → portada'
    await page.goBack()
    await landOn(page, PORTADA, MARK.portada)

    t.step = 'atrás → roma'
    await page.goBack()
    await landOn(page, ROMA, MARK.roma)

    t.step = 'adelante → portada'
    await page.goForward()
    await landOn(page, PORTADA, MARK.portada)

    t.step = 'adelante → campania'
    await page.goForward()
    await landOn(page, CAMPANIA, MARK.campania)

    expect(t.heavy, `descargas de la base de contenido:\n${t.heavy.join('\n')}`).toHaveLength(0)
    for (const step of ['portada', 'tarjeta → roma', 'tarjeta → campania']) {
      expect(t.nuxtAssets[step] ?? 0, `control de no vacuidad: el paso «${step}» pidió assets /_nuxt/`).toBeGreaterThan(0)
    }
    expect(t.badAssets, `respuestas /_nuxt/ >= 400:\n${t.badAssets.join('\n')}`).toHaveLength(0)
  })

  test('búsqueda: cada guía busca solo en sus fichas, también al volver con «Atrás»', async ({ page }) => {
    await blockOffOrigin(page, ORIGIN)
    const t = track(page)
    const box = page.locator('#search-results')
    const results = page.locator('#search-results .search-result')
    const cardsOf = (): Promise<string[]> => results.evaluateAll(els => els.map(e => e.getAttribute('data-card') ?? ''))

    /** Escribe `q` y comprueba que hay resultados y que todos son fichas de `slugs`. */
    async function onlyFrom(q: string, slugs: string[], trip: string): Promise<void> {
      await page.fill('#search', q)
      await expect(results).not.toHaveCount(0)
      const cards = await cardsOf()
      expect(cards.filter(c => !slugs.includes(c)), `«${q}» en ${trip} solo trae fichas de ${trip}`).toEqual([])
    }

    /** Escribe `q` y comprueba «Sin resultados». */
    async function none(q: string): Promise<void> {
      await page.fill('#search', q)
      await expect(box).toHaveClass(/\bshow\b/)
      await expect(results).toHaveCount(0)
      await expect(box).toContainText('Sin resultados')
    }

    // Escribe hasta que la aserción pase: el índice MiniSearch se construye en onMounted, y una
    // entrada anterior a ese momento no se reevalúa sola (clon de tests/trips/isolation.spec.ts).
    async function searchUntil(q: string, slug: string): Promise<void> {
      await expect(async () => {
        await page.fill('#search', '')
        await page.fill('#search', q)
        await expect(page.locator(`#search-results .search-result[data-card="${slug}"]`)).not.toHaveCount(0, { timeout: 2_000 })
      }).toPass({ timeout: 30_000 })
    }

    t.step = 'roma'
    await page.goto(ROMA)
    await landOn(page, ROMA, MARK.roma)
    await searchUntil('Pantheon', 'pantheon')
    await onlyFrom('iglesia', ROMA_SLUGS, 'Roma')

    t.step = 'campania'
    await page.goto(CAMPANIA)
    await landOn(page, CAMPANIA, MARK.campania)
    await expect(page.locator('#search'), 'Campania abre con el buscador vacío').toHaveValue('')
    await expect(box, 'Campania abre con el desplegable cerrado').not.toHaveClass(/\bshow\b/)
    await searchUntil('Sorgeto', 'baia-di-sorgeto')
    await none('Pantheon')
    await onlyFrom('iglesia', CAMPANIA_SLUGS, 'Campania')

    t.step = 'atrás → roma'
    await page.goBack()
    await landOn(page, ROMA, MARK.roma)
    await searchUntil('Pantheon', 'pantheon')
    await none('Sorgeto')
    await onlyFrom('iglesia', ROMA_SLUGS, 'Roma')

    expect(t.heavy, `descargas de la base de contenido:\n${t.heavy.join('\n')}`).toHaveLength(0)
  })

  test('notas: una nota de Roma no aparece en Campania ni al revés, también con «Atrás» y «Adelante»', async ({ page }) => {
    await blockOffOrigin(page, ORIGIN)
    const t = track(page)
    const ls = (k: string): Promise<string | null> => page.evaluate(key => localStorage.getItem(key), k)
    const notes = (): Promise<[string, string][]> =>
      page.locator('.notes-textarea').evaluateAll(els =>
        els.map(e => [e.getAttribute('data-note-key') ?? '', (e as HTMLTextAreaElement).value] as [string, string]))
    const ROMA_NOTE = 'Nota de Roma: volver al Pantheon a las 9'
    const CAMPANIA_NOTE = 'Nota de Campania: baño en Sorgeto al atardecer'

    t.step = 'roma'
    await page.goto(ROMA)
    await landOn(page, ROMA, MARK.roma)
    await page.locator('.notes-textarea[data-note-key="pantheon"]').fill(ROMA_NOTE)
    await expect.poll(() => ls('roma-note-pantheon')).toBe(ROMA_NOTE)

    t.step = 'campania'
    await page.goto(CAMPANIA)
    await landOn(page, CAMPANIA, MARK.campania)
    await page.locator('.notes-textarea[data-note-key="baia-di-sorgeto"]').fill(CAMPANIA_NOTE)
    await expect.poll(() => ls('campania-note-baia-di-sorgeto')).toBe(CAMPANIA_NOTE)

    t.step = 'atrás → roma'
    await page.goBack()
    await landOn(page, ROMA, MARK.roma)
    // La nota propia restaurada demuestra que la restauración ya corrió antes de mirar las demás.
    await expect(page.locator('.notes-textarea[data-note-key="pantheon"]')).toHaveValue(ROMA_NOTE)
    const romaNotes = await notes()
    expect(romaNotes.length, 'Roma tiene un área de notas por ficha').toBe(ROMA_SLUGS.length)
    expect(romaNotes.filter(([, v]) => v === CAMPANIA_NOTE), 'la nota de Campania no aparece en Roma').toEqual([])
    expect(romaNotes.filter(([k, v]) => (k === 'pantheon' ? v !== ROMA_NOTE : v !== '')), 'en Roma solo pantheon tiene nota').toEqual([])

    t.step = 'adelante → campania'
    await page.goForward()
    await landOn(page, CAMPANIA, MARK.campania)
    await expect(page.locator('.notes-textarea[data-note-key="baia-di-sorgeto"]')).toHaveValue(CAMPANIA_NOTE)
    const campaniaNotes = await notes()
    expect(campaniaNotes.length, 'Campania tiene un área de notas por ficha').toBe(CAMPANIA_SLUGS.length)
    expect(campaniaNotes.filter(([, v]) => v === ROMA_NOTE), 'la nota de Roma no aparece en Campania').toEqual([])
    expect(campaniaNotes.filter(([k, v]) => (k === 'baia-di-sorgeto' ? v !== CAMPANIA_NOTE : v !== '')), 'en Campania solo baia-di-sorgeto tiene nota').toEqual([])

    expect(await ls('roma-note-baia-di-sorgeto'), 'ninguna clave roma-* para la ficha de Campania').toBeNull()
    expect(await ls('campania-note-pantheon'), 'ninguna clave campania-* para la ficha de Roma').toBeNull()
    expect(await ls('roma-note-pantheon')).toBe(ROMA_NOTE)
    expect(await ls('campania-note-baia-di-sorgeto')).toBe(CAMPANIA_NOTE)
    expect(t.heavy, `descargas de la base de contenido:\n${t.heavy.join('\n')}`).toHaveLength(0)
  })

  test('modos: ritmo, «caminar menos» y resumen de Roma y de Campania no se mezclan', async ({ page }) => {
    await blockOffOrigin(page, ORIGIN)
    const t = track(page)
    const ls = (k: string): Promise<string | null> => page.evaluate(key => localStorage.getItem(key), k)
    const body = page.locator('body')
    const activePace = page.locator('.pace-btn.active')

    t.step = 'roma'
    await page.goto(ROMA)
    await landOn(page, ROMA, MARK.roma)
    await page.locator('.pace-btn[data-pace="neutral"]').click()
    await page.locator('#resumen-toggle').click()
    await expect.poll(() => ls('roma-pace')).toBe('neutral')
    await expect.poll(() => ls('roma-resumen')).toBe('1')

    t.step = 'campania'
    await page.goto(CAMPANIA)
    await landOn(page, CAMPANIA, MARK.campania)
    await expect(activePace, 'Campania arranca en su ritmo por defecto').toHaveAttribute('data-pace', 'optimistic')
    await expect(body).not.toHaveClass(/\blight-mode\b/)
    await expect(body).not.toHaveClass(/\bmodo-resumen\b/)
    await page.locator('#light-toggle').click()
    await expect(activePace, '«Caminar menos» fuerza el ritmo pesimista').toHaveAttribute('data-pace', 'slow')
    await expect(body).toHaveClass(/\blight-mode\b/)
    await expect.poll(() => ls('campania-light')).toBe('1')
    await expect.poll(() => ls('campania-pace')).toBe('slow')

    t.step = 'atrás → roma'
    await page.goBack()
    await landOn(page, ROMA, MARK.roma)
    await expect(activePace).toHaveAttribute('data-pace', 'neutral')
    await expect(body).toHaveClass(/\bmodo-resumen\b/)
    await expect(body).not.toHaveClass(/\blight-mode\b/)
    await expect(page.locator('#light-toggle')).toHaveAttribute('aria-pressed', 'false')

    t.step = 'adelante → campania'
    await page.goForward()
    await landOn(page, CAMPANIA, MARK.campania)
    await expect(activePace).toHaveAttribute('data-pace', 'slow')
    await expect(body).toHaveClass(/\blight-mode\b/)
    await expect(body).not.toHaveClass(/\bmodo-resumen\b/)

    expect(await ls('roma-pace')).toBe('neutral')
    expect(await ls('roma-resumen')).toBe('1')
    expect(await ls('campania-light')).toBe('1')
    expect(await ls('campania-pace')).toBe('slow')
    expect(await ls('roma-light'), '«Caminar menos» de Campania no toca roma-light').not.toBe('1')
    expect(await ls('campania-resumen'), 'el resumen de Roma no toca campania-resumen').not.toBe('1')
    expect(t.heavy, `descargas de la base de contenido:\n${t.heavy.join('\n')}`).toHaveLength(0)
  })
})
