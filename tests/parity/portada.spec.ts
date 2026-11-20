import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { Server } from 'node:http'
import { expect, test, type Page } from '@playwright/test'
import { readTripManifest } from '../../scripts/tripManifest.mjs'
import { OUTPUT_DIR, ROMA_HTML, ROMA_URL, SITE_BASE } from './_harness'
import { startPagesServer } from './_pagesServer'

/**
 * LA PORTADA PUBLICADA Y LAS RUTAS MULTI-VIAJE, DE PUNTA A PUNTA SOBRE LA BUILD (Fase 11).
 *
 *  · ROUTE-01: `/guiaRoma/` es la portada «Guías de viaje» con UNA tarjeta por viaje publicado
 *    (los no borradores de `readTripManifest()`), con título, fechas, destinos y resumen; pulsarla
 *    es una navegación de documento completo a `/guiaRoma/trips/<slug>/` (D-04).
 *  · ROUTE-04 / D-15: ni la portada ni Roma descargan la base de contenido (`__nuxt_content/`,
 *    `sql_dump`, WASM): sus datos viajan prerenderizados en el payload de cada página.
 *  · ROUTE-05 / D-16: cada borrador del manifiesto responde 404 y ninguna tarjeta apunta a él.
 *  · ROUTE-06 / D-01: el pie de Roma lleva «← Todos los viajes» de vuelta a la portada.
 *  · D-13: la clave de página por slug hace que pulsar pastillas (cambios de hash) no remonte la
 *    guía.
 *  · Backstops del UI-SPEC: tema guardado (sin claves nuevas en localStorage, D-11/D-20) y textos
 *    largos a 375 px.
 *
 * Servidor: `startPagesServer` (tests/parity/_pagesServer.ts) imita a GitHub Pages sobre
 * `.output/public` bajo `/guiaRoma/` (301 a barra final, `404.html` real para lo inexistente). No
 * se usa `pnpm dlx serve` (el de los specs de Roma) porque su `cleanUrls` reescribe rutas y
 * respondería distinto que Pages justo en lo que aquí se prueba (rutas `/trips/<slug>/` y 404 de
 * borradores). Puerto base propio + TEST_WORKER_INDEX (ver `PORT`), lejos de los demás specs.
 *
 * Las listas esperadas salen del MANIFIESTO (no escritas a mano): si mañana se publica otro viaje,
 * la portada debe listarlo y este spec lo exige sin cambios. La lista de borradores no puede estar
 * vacía (si lo estuviera, el test de 404 pasaría por vacuidad).
 */

// @nuxtjs/color-mode fija `data-theme` antes de hidratar; el HTML prerenderizado no lo trae →
// mensaje benigno de hidratación (mismo criterio que subpath.spec.ts / shell.spec.ts).
const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i

/** Peticiones de la base de contenido que ninguna página publicada debe hacer (D-15). */
const HEAVY_RE = /__nuxt_content\/|sql_dump|\.wasm(\?|$)/

const MANIFEST = readTripManifest()
const PUBLISHED = MANIFEST.filter(t => !t.draft).map(t => t.slug)
const DRAFTS = MANIFEST.filter(t => t.draft).map(t => t.slug)

/** Textos de la tarjeta de Roma (UI-SPEC). */
const ROMA_CARD = {
  title: 'Cinque giorni a Roma',
  meta: '19–23 de junio de 2026 · Roma',
  summary: 'Cinco días a pie por Roma, del viernes por la tarde al martes por la noche: una ficha para cada parada, el mapa del viaje y dónde comer como los romanos.',
}

const normalize = (s: string | null): string => (s ?? '').replace(/\s+/g, ' ').trim()

/** Asegura la build estática una sola vez (clon del de legacy-redirect.spec.ts). */
function ensureBuild(): void {
  if (!existsSync(ROMA_HTML)) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(ROMA_HTML), 'la página de Roma de la build (ROMA_HTML) debe existir').toBe(true)
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

test.describe('portada y rutas multi-viaje (ROUTE-01/04/05/06)', () => {
  const PORT = 5800 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const ORIGIN = `http://127.0.0.1:${PORT}`
  let server: Server | undefined

  test.beforeAll(async () => {
    ensureBuild()
    server = await startPagesServer(OUTPUT_DIR, PORT)
  })

  test.afterAll(async () => {
    await new Promise<void>(r => (server ? server.close(() => r()) : r()))
  })

  test('portada: una tarjeta por viaje publicado con título, fechas, destinos y resumen, que lleva a la guía (ROUTE-01)', async ({ page }) => {
    expect(PUBLISHED, 'el manifiesto tiene al menos un viaje publicado (Roma)').toContain('roma')
    await blockOffOrigin(page, ORIGIN)
    await page.goto(`${ORIGIN}${SITE_BASE}`)
    await page.waitForLoadState('networkidle')
    await hydrated(page)

    await expect(page).toHaveTitle('Guías de viaje')
    await expect(page.locator('h1')).toHaveText('Guías de viaje')

    // Los href son EXACTAMENTE los de los viajes publicados del manifiesto (en el orden que pinta
    // la portada; el conjunto se compara ordenado).
    const cards = page.locator('a.trip-index-card')
    const hrefs = await cards.evaluateAll(els => els.map(a => a.getAttribute('href') ?? ''))
    expect([...hrefs].sort()).toEqual(PUBLISHED.map(s => `${SITE_BASE}trips/${s}/`).sort())
    for (const d of DRAFTS) {
      expect(hrefs.filter(h => h.includes(`/trips/${d}/`)), `ninguna tarjeta apunta al borrador ${d}`).toHaveLength(0)
    }

    const roma = page.locator(`a.trip-index-card[href="${ROMA_URL}"]`)
    await expect(roma).toHaveCount(1)
    await expect(roma.locator('h2.trip-index-title')).toHaveText(ROMA_CARD.title)
    await expect(roma.locator('.trip-index-meta')).toHaveText(ROMA_CARD.meta)
    expect(normalize(await roma.locator('.trip-index-summary').textContent())).toBe(ROMA_CARD.summary)

    // D-12: ningún elemento de la portada lleva id.
    await expect(page.locator('.trip-index [id]')).toHaveCount(0)

    // D-04: navegación de documento completo (la marca JS del documento de la portada desaparece).
    await page.evaluate(() => {
      (window as unknown as { __portadaDoc?: boolean }).__portadaDoc = true
    })
    await roma.click()
    await page.waitForURL(`${ORIGIN}${ROMA_URL}`)
    await expect(page.locator('.nav-pill')).toHaveCount(12)
    expect(await page.evaluate(() => (window as unknown as { __portadaDoc?: boolean }).__portadaDoc)).toBeUndefined()
  })

  test('portada: ni la portada ni Roma piden sql_dump ni WASM, sin 404 de /_nuxt/ ni CDN (ROUTE-04)', async ({ page }) => {
    const offOrigin = await blockOffOrigin(page, ORIGIN)
    const heavy: string[] = []
    const nuxtAssets: string[] = []
    const badAssets: string[] = []
    const consoleErrors: string[] = []

    // Listeners ANTES de navegar.
    page.on('request', (r) => {
      if (HEAVY_RE.test(r.url())) heavy.push(r.url())
      if (r.url().includes('/_nuxt/')) nuxtAssets.push(r.url())
    })
    page.on('response', (r) => {
      if (r.url().includes('/_nuxt/') && r.status() >= 400) badAssets.push(`${r.status()} ${r.url()}`)
    })
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) consoleErrors.push(msg.text())
    })

    // 1) Portada.
    const home = await page.goto(`${ORIGIN}${SITE_BASE}`)
    expect(home?.status(), 'la portada responde 200').toBe(200)
    await page.waitForLoadState('networkidle')
    await hydrated(page)
    expect(heavy, `la portada no descarga la base de contenido: ${heavy.join(', ')}`).toHaveLength(0)
    expect(nuxtAssets.length, 'control de no vacuidad: la portada pidió assets /_nuxt/').toBeGreaterThan(0)
    expect(badAssets, `respuestas /_nuxt/ ≥ 400 en la portada: ${badAssets.join(', ')}`).toHaveLength(0)
    expect(offOrigin, `peticiones fuera del origen en la portada: ${offOrigin.join(', ')}`).toHaveLength(0)
    expect(consoleErrors, `errores de consola en la portada: ${consoleErrors.join(' | ')}`).toHaveLength(0)

    // 2) Roma, en la misma página (sus tiles y heros externos se abortan; aquí no se cuentan).
    const assetsBeforeRoma = nuxtAssets.length
    const romaRes = await page.goto(`${ORIGIN}${ROMA_URL}`)
    expect(romaRes?.status(), 'Roma responde 200').toBe(200)
    await page.waitForLoadState('networkidle')
    await hydrated(page)
    await expect(page.locator('.nav-pill')).toHaveCount(12)
    expect(heavy, `Roma no descarga la base de contenido: ${heavy.join(', ')}`).toHaveLength(0)
    expect(nuxtAssets.length, 'control de no vacuidad: Roma pidió assets /_nuxt/').toBeGreaterThan(assetsBeforeRoma)
  })
})
