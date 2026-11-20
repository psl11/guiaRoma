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

  test('portada: el pie de Roma lleva «← Todos los viajes» a la portada (ROUTE-06)', async ({ page }) => {
    await blockOffOrigin(page, ORIGIN)
    await page.goto(`${ORIGIN}${ROMA_URL}`)
    await page.waitForLoadState('networkidle')
    await hydrated(page)

    const back = page.locator('footer .trip-back a')
    await expect(back).toHaveText('← Todos los viajes')
    await expect(back).toHaveAttribute('href', SITE_BASE)
    // El enlace va fuera de `.container`: el locator estricto de la puerta sigue siendo único.
    await expect(page.locator('footer .container p')).toHaveCount(1)

    // D-04: navegación de documento completo de vuelta a la portada.
    await page.evaluate(() => {
      (window as unknown as { __romaDoc?: boolean }).__romaDoc = true
    })
    await back.click()
    await page.waitForURL(`${ORIGIN}${SITE_BASE}`)
    await expect(page.locator('.trip-index')).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __romaDoc?: boolean }).__romaDoc)).toBeUndefined()
  })

  test('portada: pulsar pastillas en /trips/roma/ no remonta la guía (D-13)', async ({ page }) => {
    await blockOffOrigin(page, ORIGIN)
    await page.goto(`${ORIGIN}${ROMA_URL}`)
    await page.waitForLoadState('networkidle')
    await hydrated(page)

    // Marca como PROPIEDAD JS (no atributo): un remontaje crearía un elemento nuevo sin ella,
    // aunque el HTML re-renderizado fuese idéntico.
    await page.locator('[id="inicio"]').evaluate((el) => {
      (el as unknown as { __mark?: string }).__mark = 'mismo-elemento'
    })

    for (const hash of ['#reservas', '#gastronomia', '#viernes']) {
      await page.locator(`.nav-pill[href="${hash}"]`).click()
      await expect.poll(() => new URL(page.url()).hash, { message: `la pastilla ${hash} cambia el hash` }).toBe(hash)
    }

    await expect(page.locator('[id="inicio"]')).toHaveCount(1)
    expect(await page.locator('[id="inicio"]').evaluate(el => (el as unknown as { __mark?: string }).__mark)).toBe('mismo-elemento')
  })

  test('portada: los borradores no se publican — dan 404 (ROUTE-05)', async ({ page }) => {
    // No vacuidad: hoy hay dos borradores de ensayo en el manifiesto.
    expect(DRAFTS, 'el manifiesto declara borradores (prueba y forma)').toEqual(expect.arrayContaining(['prueba', 'forma']))
    await blockOffOrigin(page, ORIGIN)
    for (const slug of DRAFTS) {
      const res = await page.goto(`${ORIGIN}${SITE_BASE}trips/${slug}/`)
      expect(res?.status(), `/trips/${slug}/ responde 404`).toBe(404)
    }
  })

  test('portada: respeta el tema guardado sin escribir claves nuevas (backstop tema, D-11/D-20)', async ({ browser, page }) => {
    const expected = { dark: 'rgb(34, 29, 24)', light: 'rgb(251, 247, 240)' } as const
    for (const theme of ['dark', 'light'] as const) {
      const context = await browser.newContext({ viewport: page.viewportSize() })
      try {
        await context.addInitScript((t) => {
          localStorage.setItem('roma-theme', t)
        }, theme)
        const p = await context.newPage()
        await blockOffOrigin(p, ORIGIN)
        await p.goto(`${ORIGIN}${SITE_BASE}`)
        await p.waitForLoadState('networkidle')
        await hydrated(p)

        await expect(p.locator('html'), `tema ${theme}`).toHaveAttribute('data-theme', theme)
        await expect(p.locator('a.trip-index-card').first(), `fondo de la tarjeta en ${theme}`).toHaveCSS('background-color', expected[theme])
        const otherKeys = await p.evaluate(() => Object.keys(localStorage).filter(k => k !== 'roma-theme'))
        expect(otherKeys, `la portada no escribe claves nuevas en localStorage (${theme})`).toEqual([])
      }
      finally {
        await context.close()
      }
    }
  })

  test('portada: textos largos parten línea sin desbordar a 375 px (backstop long-text)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await blockOffOrigin(page, ORIGIN)
    await page.goto(`${ORIGIN}${SITE_BASE}`)
    await page.waitForLoadState('networkidle')
    await hydrated(page)

    const card = page.locator('a.trip-index-card').first()
    await card.evaluate((el) => {
      const set = (sel: string, text: string) => {
        const node = el.querySelector(sel)
        if (node) node.textContent = text
      }
      // ~80 caracteres, 6 destinos y 3 frases (UI-SPEC E2).
      set('.trip-index-title', 'Un viaje larguísimo por las ciudades del norte de Italia, de Milán hasta Venecia')
      set('.trip-index-meta', '1–14 de septiembre de 2027 · Milán · Bérgamo · Verona · Vicenza · Padua · Venecia')
      set('.trip-index-summary', 'Dos semanas en tren por el norte de Italia, de ciudad en ciudad y sin prisa. Cada día tiene su ruta a pie, sus fichas y su mapa. Y al final de cada jornada, una mesa donde comer como se come allí.')
    })

    const m = await card.evaluate((el) => {
      const h2 = el.querySelector('.trip-index-title') as HTMLElement
      const cs = getComputedStyle(h2)
      const lh = Number.parseFloat(cs.lineHeight)
      const lineHeight = Number.isNaN(lh) ? Number.parseFloat(cs.fontSize) * 1.2 : lh
      return {
        docScroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
        h2Height: h2.getBoundingClientRect().height,
        lineHeight,
        h2Scroll: h2.scrollWidth,
        h2Client: h2.clientWidth,
        textOverflow: cs.textOverflow,
        cardScroll: el.scrollWidth,
        cardClient: el.clientWidth,
      }
    })
    expect(m.docScroll, 'la página no desborda en horizontal').toBeLessThanOrEqual(m.inner)
    expect(m.h2Height, 'el título largo parte línea').toBeGreaterThan(1.5 * m.lineHeight)
    expect(m.h2Scroll, 'el título no se recorta').toBeLessThanOrEqual(m.h2Client)
    expect(m.textOverflow, 'sin elipsis').not.toBe('ellipsis')
    expect(m.cardScroll, 'la tarjeta no desborda').toBeLessThanOrEqual(m.cardClient)
  })
})
