import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { parse } from 'yaml'

/**
 * FORMAS NUEVAS DE VIAJE sobre el borrador de Campania (Fase 12, EXT-01…EXT-07; D-01…D-17).
 *
 * `content/trips/campania/**` es el esqueleto del primer viaje después del original: días con
 * alternativas (`choice`), y en los planes siguientes noches en ciudades distintas, transportes y
 * fichas de naturaleza, rutas en coche y notas familiares. Aquí se comprueba en el navegador que
 * la guía pinta esas formas como dice su contrato (12-UI-SPEC §«Contrato de DOM»), derivando lo
 * esperado de los YAML del viaje y no de una lista escrita a mano.
 *
 * Corre contra `nuxi dev` (playwright.trips.config.ts, puerto 5300, base /guiaRoma/): campania es
 * un borrador (`draft: true`, D-16), así que nunca se prerenderiza ni se publica y solo existe en
 * dev. Antes: `rm -rf .data .nuxt` (el esquema nuevo cambia las columnas de Content y con caché
 * vieja los campos nuevos saldrían null).
 *
 * Los ids se seleccionan con `[id="…"]`, nunca con `#…`. Los textos se comprueban con
 * `toHaveText`/`textContent` y no con `innerText`: el encabezado del bloque va en mayúsculas por
 * CSS (`text-transform`), pero el `textContent` conserva la caja del dato («Elige una»).
 *
 * Autocontenido: no importa nada de tests/parity/ ni de los otros specs (helpers clonados de
 * shape.spec.ts). En dev NO se afirma «cero errores de consola». Cada test usa su propio
 * `browser.newContext()`.
 */

const ORIGIN = 'http://localhost:5300'
const CAMPANIA_URL = `${ORIGIN}/guiaRoma/trips/campania`
const INDEX_URL = `${ORIGIN}/guiaRoma/`
const CAMPANIA_ROOT = join(process.cwd(), 'content', 'trips', 'campania')

// Determinista y offline: aborta toda petición fuera del dev server (tiles OSM, las heros
// `https://example.invalid/…` del esqueleto).
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
  for (const url of [CAMPANIA_URL, INDEX_URL]) {
    await page.goto(url, { timeout: 120_000 })
    await page.waitForLoadState('networkidle', { timeout: 120_000 })
  }
  await context.close()
})

// ── Datos del viaje (lo esperado sale del YAML) ─────────────────────────────────────────────

interface YamlRow { kind: string, [key: string]: unknown }
interface YamlOption { label: string, title: string, rows: YamlRow[] }
interface YamlChoice extends YamlRow { kind: 'choice', heading?: string, options: YamlOption[] }
interface YamlDay { slug: string, timeline: YamlRow[], cards: string[] }
interface YamlMonument { slug: string, roman: string }

function readYaml<T>(rel: string): T {
  return parse(readFileSync(join(CAMPANIA_ROOT, rel), 'utf8')) as T
}

const MONUMENTS: YamlMonument[] = readdirSync(join(CAMPANIA_ROOT, 'monuments'))
  .filter(f => f.endsWith('.yml'))
  .map(f => readYaml<YamlMonument>(`monuments/${f}`))

// Clase raíz que pinta cada kind de fila (los componentes Timeline*.vue).
const ROOT_CLASS_BY_KIND: Record<string, string> = {
  stop: 'tl-item',
  transport: 'tl-transport',
  meta: 'tl-meta',
  food: 'tl-food',
  reservation: 'tl-resv-meta',
  choice: 'tl-choice',
}

// Markdown-inline mínimo → texto (los títulos del esqueleto no llevan énfasis, pero por si acaso).
function mdText(md: string): string {
  return md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/(\*\*|__|\*|_)(.+?)\1/g, '$2').trim()
}

// ── EXT-01: alternativas dentro de un día ───────────────────────────────────────────────────

test.describe('campania: alternativas dentro de un día (EXT-01)', () => {
  test('campania: el jueves 24 apila las opciones con «— o bien —» entre filas comunes (EXT-01, D-02)', async ({ browser }) => {
    const day = readYaml<YamlDay>('days/jueves-24.yml')
    const choices = day.timeline.filter((r): r is YamlChoice => r.kind === 'choice')
    expect(choices.length, 'el jueves 24 tiene un choice en el YAML').toBe(1)
    const choice = choices[0]!

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    // Secuencia de filas de nivel superior del día = la del dato (el choice en su sitio).
    const timeline = page.locator('section[id="jueves-24"] .container > .timeline')
    await expect(timeline).toHaveCount(1)
    const childClasses = await timeline.evaluate(el =>
      Array.from(el.children).map(c => (c as HTMLElement).className.split(/\s+/)[0] ?? ''),
    )
    expect(childClasses).toEqual(day.timeline.map(r => ROOT_CLASS_BY_KIND[r.kind]))

    // El bloque: DIV, role=group, aria-label y encabezado «Elige una» (sin heading en el dato).
    const block = timeline.locator(':scope > .tl-choice')
    await expect(block).toHaveCount(1)
    expect(await block.evaluate(el => el.tagName)).toBe('DIV')
    await expect(block).toHaveAttribute('role', 'group')
    await expect(block).toHaveAttribute('aria-label', 'Elige una')
    expect(choice.heading).toBeUndefined()
    expect(await block.locator(':scope > .tl-choice-heading').evaluate(el => el.textContent?.trim())).toBe('Elige una')

    // Opciones en el orden del dato: etiqueta (texto plano) y título.
    const options = block.locator(':scope > .tl-choice-option')
    await expect(options).toHaveCount(choice.options.length)
    await expect(options.locator(':scope > .tl-choice-label')).toHaveText(choice.options.map(o => o.label))
    await expect(options.locator(':scope > .tl-choice-title')).toHaveText(choice.options.map(o => mdText(o.title)))

    // Cada opción pinta sus filas por el mismo despachador (div.timeline con tantas filas como el dato).
    for (const [i, opt] of choice.options.entries()) {
      const inner = options.nth(i).locator(':scope > .timeline')
      await expect(inner).toHaveCount(1)
      const innerClasses = await inner.evaluate(el =>
        Array.from(el.children).map(c => (c as HTMLElement).className.split(/\s+/)[0] ?? ''),
      )
      expect(innerClasses, `${opt.label}: filas interiores`).toEqual(opt.rows.map(r => ROOT_CLASS_BY_KIND[r.kind]))
    }

    // Separadores: exactamente opciones−1, con el texto exacto, solo ENTRE opciones.
    const seps = block.locator(':scope > .tl-choice-sep')
    await expect(seps).toHaveCount(choice.options.length - 1)
    for (const text of await seps.evaluateAll(els => els.map(e => e.textContent?.trim()))) {
      expect(text).toBe('— o bien —')
    }
    const blockChildren = await block.evaluate(el => Array.from(el.children).map(c => c.className))
    const expectedChildren = ['tl-choice-heading']
    choice.options.forEach((_, i) => {
      if (i > 0) expectedChildren.push('tl-choice-sep')
      expectedChildren.push('tl-choice-option')
    })
    expect(blockChildren).toEqual(expectedChildren)

    // Sin secciones, titulares ni ids dentro del bloque (H25: el scrollspy toma las section).
    await expect(block.locator('section')).toHaveCount(0)
    await expect(block.locator('h1, h2, h3, h4, h5, h6')).toHaveCount(0)
    await expect(block.locator('[id]')).toHaveCount(0)

    // Fichas y mapa: raito (la ficha de la opción A) está en la lista del día y en el mapa. Los
    // marcadores se buscan dentro de `section[id="mapa"]` y no bajo `#leaflet-map`: tras montar el
    // mapa en cliente el contenedor ya no conserva ese id en el DOM (los specs de paridad también
    // cuentan `.custom-marker` sin él).
    await expect(page.locator('section[id="jueves-24"] .cards-list [id="raito"]')).toHaveCount(1)
    const markers = page.locator('section[id="mapa"] .custom-marker')
    await expect(markers).toHaveCount(MONUMENTS.length)
    const raito = MONUMENTS.find(m => m.slug === 'raito')
    expect(raito, 'monuments/raito.yml existe').toBeDefined()
    const romans = await markers.evaluateAll(els => els.map(e => e.textContent?.trim()))
    expect(romans.filter(r => r === raito!.roman)).toHaveLength(1)

    await context.close()
  })

  test('campania: la portada de dev no lista el borrador (D-16)', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await page.goto(INDEX_URL)
    await page.waitForLoadState('networkidle')
    // Control: la portada está renderizada (lista al menos un viaje publicado).
    await expect.poll(() => page.locator('a.trip-index-card').count()).toBeGreaterThan(0)
    const hrefs = await page.locator('a.trip-index-card').evaluateAll(els => els.map(e => e.getAttribute('href') ?? ''))
    expect(hrefs.filter(h => h.includes('trips/campania'))).toEqual([])
    await context.close()
  })
})
