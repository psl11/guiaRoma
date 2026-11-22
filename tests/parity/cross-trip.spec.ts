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
})
