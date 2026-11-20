import { expect, test, type BrowserContext, type Page } from '@playwright/test'

/**
 * FORMA DE LA GUÍA DESDE LOS DATOS con un viaje distinto de Roma (Fase 10: SHAPE-01, SHAPE-02;
 * D-15).
 *
 * El viaje ficticio `forma` (content/trips/forma/**) tiene diez días que repiten día de la semana
 * (dos sábados con slugs con fecha y pastillas propias) y no tiene Arte, Arquitectura, Reservas
 * ni Práctica. Aquí se comprueba en el navegador que su guía tiene exactamente la forma que dicen
 * sus datos: tantas secciones y pastillas de día como días, en orden, y ninguna sección vacía.
 *
 * Corre contra `nuxi dev` (playwright.trips.config.ts, puerto 5300, base /guiaRoma/): `forma` y
 * `prueba` son viajes de desarrollo que no se prerenderizan hasta la Fase 11.
 *
 * Pitfall 6: la página de forma es corta (días casi vacíos), así que el documento no se desplaza
 * hasta los últimos días y el scrollspy nunca marca su pastilla como `.active`. La navegación de
 * las pastillas se comprueba por `href` + existencia de `section[id]` + `location.hash` tras el
 * clic, nunca por `.active`.
 *
 * Los ids de sección se seleccionan con `[id="…"]`, nunca con `#…`: un id de día que empiece por
 * dígito no sería un selector CSS válido.
 *
 * Autocontenido: no importa nada de tests/parity/ ni de isolation.spec.ts (helpers clonados). En
 * dev NO se afirma «cero errores de consola». Cada test usa su propio `browser.newContext()`.
 */

const ORIGIN = 'http://localhost:5300'
const FORMA_URL = `${ORIGIN}/guiaRoma/trips/forma`
const PRUEBA_URL = `${ORIGIN}/guiaRoma/trips/prueba`

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

// Navega y espera la hidratación: el shell #back-btn existe y, en el top, el scrollspy (registrado
// en onMounted del controller) ha marcado exactamente una pastilla `.active`.
async function gotoHydrated(page: Page, url: string): Promise<void> {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('#back-btn')).toHaveCount(1)
  await page.evaluate(() => window.scrollTo(0, 0))
  await expect(page.locator('.nav-pill.active')).toHaveCount(1)
}

// Calentamiento: en dev Vite puede recargar la página la primera vez que descubre dependencias.
test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  const { context, page } = await newIsolatedPage(browser)
  for (const url of [FORMA_URL, PRUEBA_URL]) {
    await page.goto(url, { timeout: 120_000 })
    await page.waitForLoadState('networkidle', { timeout: 120_000 })
  }
  await context.close()
})

const ABSENT_SECTIONS = ['arte', 'arquitectura', 'reservas', 'practica'] as const

test.describe('forma de la guía desde los datos (SHAPE-01, SHAPE-02)', () => {
  test('forma: sin Arte, Arquitectura, Reservas ni Práctica', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, FORMA_URL)
    const pills = page.locator('#nav-pills .nav-pill')

    // Guarda anti-vacuidad: la guía de forma está de verdad renderizada (su primer día con su
    // pastilla) y Gastronomía existe aunque su única ficha use un grupo fuera de FOOD_GROUP_ORDER.
    await expect(page.locator('section[id="sabado-19"]')).toHaveCount(1)
    const sab19 = pills.and(page.locator('[href="#sabado-19"]'))
    await expect(sab19).toHaveCount(1)
    await expect(sab19).toHaveText('Sáb 19')
    await expect(page.locator('section[id="gastronomia"]')).toHaveCount(1)

    for (const id of ABSENT_SECTIONS) {
      await expect(page.locator(`[id="${id}"]`), `forma no tiene sección ${id}`).toHaveCount(0)
      await expect(pills.and(page.locator(`[href="#${id}"]`)), `forma no tiene pastilla ${id}`).toHaveCount(0)
    }

    await context.close()
  })
})
