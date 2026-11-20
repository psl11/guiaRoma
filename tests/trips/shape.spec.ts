import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { parse } from 'yaml'
import { inlineMdToPlain } from '../../app/utils/tripLayout'
import { findRomaLeaks } from './romaLeaks'

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
const ROMA_URL = `${ORIGIN}/guiaRoma/`

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
  for (const url of [FORMA_URL, PRUEBA_URL, ROMA_URL]) {
    await page.goto(url, { timeout: 120_000 })
    await page.waitForLoadState('networkidle', { timeout: 120_000 })
  }
  await context.close()
})

const ABSENT_SECTIONS = ['arte', 'arquitectura', 'reservas', 'practica'] as const

// Los 10 días de forma, en orden (content/trips/forma/days/*.yml). `label` es la etiqueta que
// pinta la pastilla: `pill` cuando el día la define y, si no, la derivada del eyebrow.
const FORMA_DAYS = [
  { id: 'sabado-19', eyebrow: 'sábado · 19 de septiembre', title: 'La llegada al faro', label: 'Sáb 19' },
  { id: 'domingo-20', eyebrow: 'domingo · 20 de septiembre', title: 'El paseo de las dunas', label: 'Domingo' },
  { id: 'lunes-21', eyebrow: 'lunes · 21 de septiembre', title: 'El mercado del puerto', label: 'Lunes' },
  { id: 'martes-22', eyebrow: 'martes · 22 de septiembre', title: 'Las galerías blancas', label: 'Martes' },
  { id: 'miercoles-23', eyebrow: 'miércoles · 23 de septiembre', title: 'El jardín de los relojes', label: 'Miércoles' },
  { id: 'jueves-24', eyebrow: 'jueves · 24 de septiembre', title: 'La ruta de los molinos', label: 'Jueves' },
  { id: 'viernes-25', eyebrow: 'viernes · 25 de septiembre', title: 'La noche de las linternas', label: 'Viernes' },
  { id: 'sabado-26', eyebrow: 'sábado · 26 de septiembre', title: 'El puente al amanecer', label: 'Sáb 26' },
  { id: 'domingo-27', eyebrow: 'domingo · 27 de septiembre', title: 'Las islas en barca', label: 'Dom 27' },
  { id: 'lunes-28', eyebrow: 'lunes · 28 de septiembre', title: 'La despedida', label: 'Lun 28' },
] as const

// Barra completa de forma: Inicio, Mapa, los 10 días y Gastronomía (13 pastillas).
const FORMA_PILLS = ['Inicio', 'Mapa', ...FORMA_DAYS.map(d => d.label), 'Gastronomía']

async function sectionIds(page: Page): Promise<string[]> {
  return page.locator('main > section').evaluateAll(els => els.map(el => el.id))
}

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

  test('forma: main sale del layout — 10 días en orden y Gastronomía al final', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, FORMA_URL)

    expect(await sectionIds(page)).toEqual(['inicio', 'mapa', ...FORMA_DAYS.map(d => d.id), 'gastronomia'])

    await context.close()
  })

  test('forma: cada día muestra su nombre y su fecha', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, FORMA_URL)

    for (const d of FORMA_DAYS) {
      const section = page.locator(`section[id="${d.id}"]`)
      await expect(section, `una sola sección ${d.id}`).toHaveCount(1)
      await expect(page.locator(`[id="${d.id}"] .section-eyebrow`)).toHaveText(d.eyebrow)
      await expect(page.locator(`[id="${d.id}"] .day-header h2`)).toHaveText(d.title)
    }

    await context.close()
  })

  test('forma: 10 pastillas de día distintas que llevan cada una a su día', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, FORMA_URL)
    const pills = page.locator('#nav-pills .nav-pill')

    await expect(pills).toHaveText(FORMA_PILLS)
    expect(new Set(FORMA_DAYS.map(d => d.label)).size, 'las 10 etiquetas de día son distintas').toBe(10)

    // Pitfall 6: nunca `.active` (los últimos días no se alcanzan con el scroll en una página
    // corta); se comprueba href → sección existente → hash tras el clic.
    for (const d of FORMA_DAYS) {
      const pill = pills.and(page.locator(`[href="#${d.id}"]`))
      await expect(pill, `una sola pastilla para ${d.id}`).toHaveCount(1)
      await expect(pill).toHaveText(d.label)
      await expect(page.locator(`section[id="${d.id}"]`)).toHaveCount(1)
      await pill.click()
      await expect.poll(
        () => page.evaluate(() => location.hash),
        { message: `la pastilla ${d.label} lleva a #${d.id}` },
      ).toBe(`#${d.id}`)
    }

    await context.close()
  })

  test('prueba: solo Inicio, Mapa y sus dos días', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, PRUEBA_URL)

    expect(await sectionIds(page)).toEqual(['inicio', 'mapa', 'viernes', 'sabado'])
    await expect(page.locator('#nav-pills .nav-pill')).toHaveText(['Inicio', 'Mapa', 'Venerdì', 'Sabato'])

    await context.close()
  })
})

// ── TRAMPA (D-16 / SHAPE-05) ────────────────────────────────────────────────────────────────
//
// Ningún texto de Roma en la guía de otro viaje. Se escanean TODOS los viajes de content/trips
// salvo roma (no una lista a mano: un viaje nuevo entra solo en la trampa). Por cada uno se
// recogen tres fuentes: `document.title`, el texto visible del body (`innerText`) y el
// `textContent` de un clon del body sin `script`/`style`/`noscript`/`template` (cubre el texto
// oculto, p. ej. banners o variantes de ritmo, sin escanear el payload, donde «guiaRoma» de la
// baseURL no es una fuga). El matcher (tests/trips/romaLeaks.ts) usa límites Unicode y tiene sus
// dientes en tests/unit/romaLeaks.spec.ts.
//
// No pasa en vacío: la lista de viajes debe incluir prueba y forma, cada página debe estar
// renderizada (h1 de #inicio = título del viaje, ≥ 3 pastillas, pestaña no vacía) y el control
// positivo comprueba que el mismo matcher SÍ encuentra los textos de Roma en su guía.
//
// Regla de oro: si la trampa salta, se arregla el código de app/ o los datos del viaje afectado;
// nunca se quitan palabras de la lista ni se excluyen viajes o partes del body.

const TRIPS_ROOT = join(process.cwd(), 'content', 'trips')

const NON_ROMA_TRIPS: string[] = readdirSync(TRIPS_ROOT, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'roma')
  .map(entry => entry.name)
  .sort()

function tripPlainTitle(slug: string): string {
  const trip = parse(readFileSync(join(TRIPS_ROOT, slug, 'trip.yml'), 'utf8')) as { title: string }
  return inlineMdToPlain(trip.title)
}

async function visibleText(page: Page, selector: string): Promise<string> {
  const text = await page.locator(selector).innerText()
  return text.replace(/\s+/g, ' ').trim()
}

interface PageTexts {
  title: string
  innerText: string
  textContent: string
}

async function collectTexts(page: Page): Promise<PageTexts> {
  return page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement
    clone.querySelectorAll('script, style, noscript, template').forEach(el => el.remove())
    return {
      title: document.title,
      innerText: document.body.innerText,
      textContent: clone.textContent ?? '',
    }
  })
}

test.describe('trampa: ningún texto de Roma en la guía de otro viaje (SHAPE-05, D-16)', () => {
  test('trampa: la lista de viajes no-Roma incluye prueba y forma', () => {
    expect(NON_ROMA_TRIPS).toContain('prueba')
    expect(NON_ROMA_TRIPS).toContain('forma')
    expect(NON_ROMA_TRIPS).not.toContain('roma')
  })

  for (const slug of NON_ROMA_TRIPS) {
    test(`trampa: ${slug} no muestra ningún texto de Roma`, async ({ browser }) => {
      const { context, page } = await newIsolatedPage(browser)
      await gotoHydrated(page, `${ORIGIN}/guiaRoma/trips/${slug}`)

      // Precondición de render: sin ella, un body vacío pasaría la trampa en vacío.
      await expect.poll(() => visibleText(page, '[id="inicio"] h1'), {
        message: `${slug}: el h1 de #inicio muestra el título del viaje`,
      }).toBe(tripPlainTitle(slug))
      expect(await page.locator('.nav-pill').count(), `${slug}: al menos 3 pastillas`).toBeGreaterThanOrEqual(3)
      await expect.poll(() => page.title(), { message: `${slug}: la pestaña tiene título` }).not.toBe('')

      const texts = await collectTexts(page)
      for (const source of ['title', 'innerText', 'textContent'] as const) {
        const leaks = findRomaLeaks(texts[source])
        expect(leaks, `${slug} · ${source}: textos de Roma encontrados → ${leaks.join(', ')}`).toEqual([])
      }

      await context.close()
    })
  }

  test('trampa: control positivo — en Roma el matcher sí encuentra sus textos', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, ROMA_URL)

    const texts = await collectTexts(page)
    const leaks = findRomaLeaks(`${texts.title}\n${texts.innerText}`)
    expect(leaks, 'en la guía de Roma el matcher encuentra «Roma»').toContain('Roma')
    expect(leaks, 'en la guía de Roma el matcher encuentra «giugno»').toContain('giugno')

    await context.close()
  })
})
