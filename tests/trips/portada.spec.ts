import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { parse } from 'yaml'
import { inlineMdToPlain } from '../../app/utils/tripLayout'

/**
 * LA PORTADA EN DEV NO LISTA BORRADORES (Fase 11, D-16; amenaza T-11-12).
 *
 * En producción los borradores (`draft: true` en su trip.yml) ni siquiera entran en Content
 * (11-02), así que la portada de la build no puede listarlos. En `nuxi dev`, en cambio, SÍ se
 * cargan —para poder escribirlos y revisarlos—, y la portada tiene que quitarlos ella misma con
 * `listedTrips`. Por eso este spec corre contra dev (playwright.trips.config.ts, puerto 5300, base
 * /guiaRoma/): es el único entorno en el que un borrador está en la colección `trip`.
 *
 *   · «portada (dev): lista solo los viajes publicados…» — la portada muestra solo la tarjeta de
 *     Roma aunque prueba y forma se cargan; ningún enlace a ellos.
 *   · «portada (dev): los borradores siguen abriéndose por URL…» — el control positivo: prueba y
 *     forma SÍ están cargados en dev (si no lo estuvieran, el primer test pasaría por vacuidad) y su
 *     guía se abre por URL con el título plano de su trip.yml.
 *
 * Autocontenido: no importa nada de tests/parity/ ni de otros specs (helpers clonados de
 * shape.spec.ts). En dev NO se afirma «cero errores de consola». Cada test usa su propio contexto
 * con las peticiones externas abortadas. Los ids se seleccionan con `[id="…"]`.
 */

const ORIGIN = 'http://localhost:5300'
const HOME_URL = `${ORIGIN}/guiaRoma/`
const DRAFTS = ['prueba', 'forma'] as const

const TRIPS_ROOT = join(process.cwd(), 'content', 'trips')

// Determinista y offline: aborta toda petición fuera del dev server (tiles OSM, las heros
// `https://example.invalid/…` de los viajes de ensayo).
async function blockExternal(context: BrowserContext): Promise<void> {
  await context.route('**/*', (route) => {
    if (route.request().url().startsWith(ORIGIN)) return route.continue()
    return route.abort()
  })
}

async function newIsolatedPage(browser: import('@playwright/test').Browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  await blockExternal(context)
  const page = await context.newPage()
  return { context, page }
}

// Navega a una guía y espera la hidratación: el shell #back-btn existe y, en el top, el scrollspy
// ha marcado exactamente una pastilla `.active`.
async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#back-btn')).toHaveCount(1)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('.nav-pill.active')).toHaveCount(1)
}

function tripPlainTitle(slug: string): string {
  const trip = parse(readFileSync(join(TRIPS_ROOT, slug, 'trip.yml'), 'utf8')) as { title: string }
  return inlineMdToPlain(trip.title)
}

// Calentamiento: en dev Vite puede recargar la página la primera vez que descubre dependencias.
test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  const { context, page } = await newIsolatedPage(browser)
  for (const url of [HOME_URL, ...DRAFTS.map(s => `${ORIGIN}/guiaRoma/trips/${s}`)]) {
    await page.goto(url, { timeout: 120_000 })
    await page.waitForLoadState('networkidle', { timeout: 120_000 })
  }
  await context.close()
})

test('portada (dev): lista solo los viajes publicados aunque prueba y forma se cargan (D-16)', async ({ browser }) => {
  const { context, page } = await newIsolatedPage(browser)
  await page.goto(HOME_URL)
  await page.waitForLoadState('networkidle')

  await expect(page.locator('.trip-index h1')).toHaveText('Guías de viaje')
  const cards = page.locator('a.trip-index-card')
  await expect(cards).toHaveCount(1)
  await expect(cards).toHaveAttribute('href', '/guiaRoma/trips/roma/')
  await expect(page.locator('a[href*="/trips/prueba"]')).toHaveCount(0)
  await expect(page.locator('a[href*="/trips/forma"]')).toHaveCount(0)

  await context.close()
})

test('portada (dev): los borradores siguen abriéndose por URL en dev (D-16)', async ({ browser }) => {
  const { context, page } = await newIsolatedPage(browser)

  // Guarda anti-vacuidad del parse: los títulos son los de los ficheros de ensayo.
  expect(tripPlainTitle('prueba')).toBe('Dos días de Prueba')
  expect(tripPlainTitle('forma')).toBe('Diez días de Forma')

  for (const slug of DRAFTS) {
    await gotoHydrated(page, `${ORIGIN}/guiaRoma/trips/${slug}`)
    await expect(page.locator('[id="inicio"] h1')).toHaveText(tripPlainTitle(slug))
  }

  await context.close()
})
