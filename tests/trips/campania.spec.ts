import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { parse } from 'yaml'
// Imports RELATIVOS (Playwright plano, sin alias): la misma matriz de ritmo y el mismo texto plano
// del Markdown-inline que usa la guía.
import { isVisible, type ItemPace, type Pace } from '../../app/utils/pace'
import { inlineMdToPlain } from '../../app/utils/tripLayout'
import { SVG_MOTIFS } from '../../app/utils/svgMotifs'

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
    expect(choices.length, 'el jueves 24 tiene al menos un choice en el YAML').toBeGreaterThanOrEqual(1)
    // El primero (A/B, sin heading); los demás bloques del día los cubren los tests de abajo.
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
    await expect(timeline.locator(':scope > .tl-choice')).toHaveCount(choices.length)
    const block = timeline.locator(':scope > .tl-choice').first()
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

// ── EXT-01: todas las formas de las alternativas (12-02) ────────────────────────────────────

const JUEVES = 'section[id="jueves-24"]'
const DAY_TIMELINE = `${JUEVES} .container > .timeline`

function juevesChoices(): { day: YamlDay, choices: YamlChoice[] } {
  const day = readYaml<YamlDay>('days/jueves-24.yml')
  return { day, choices: day.timeline.filter((r): r is YamlChoice => r.kind === 'choice') }
}

// Ritmo de una fila del YAML (el esquema pone `all` por defecto).
const rowPace = (row: YamlRow): ItemPace => (typeof row.pace === 'string' ? row.pace : 'all') as ItemPace

// Todo el «armazón» de los bloques del día (encabezados, etiquetas, títulos y separadores) visible.
async function expectChoiceChromeVisible(page: Page): Promise<void> {
  const sel = ['.tl-choice', '.tl-choice-heading', '.tl-choice-label', '.tl-choice-title', '.tl-choice-sep']
  for (const cls of sel) {
    const els = page.locator(`${JUEVES} ${cls}`)
    expect(await els.count(), `${cls}: hay alguno en el jueves 24`).toBeGreaterThan(0)
    for (const el of await els.all()) await expect(el, `${cls} visible`).toBeVisible()
  }
}

// Cada fila de dentro de una opción, visible u oculta según `isVisible(row.pace, pace)` (las filas
// `stop`/`transport` son las únicas que filtra el ritmo; las demás siguen siempre visibles).
async function expectInnerRowsFollowPace(page: Page, choices: YamlChoice[], pace: Pace): Promise<void> {
  const blocks = page.locator(`${DAY_TIMELINE} > .tl-choice`)
  for (const [i, choice] of choices.entries()) {
    for (const [j, opt] of choice.options.entries()) {
      const rows = blocks.nth(i).locator(':scope > .tl-choice-option').nth(j).locator(':scope > .timeline > *')
      await expect(rows).toHaveCount(opt.rows.length)
      for (const [k, row] of opt.rows.entries()) {
        const filtered = row.kind === 'stop' || row.kind === 'transport'
        const visible = filtered ? isVisible(rowPace(row), pace) : true
        const what = `${pace} · ${opt.label} · fila ${k} (${row.kind}, pace ${rowPace(row)})`
        if (visible) await expect(rows.nth(k), what).toBeVisible()
        else await expect(rows.nth(k), what).toBeHidden()
      }
    }
  }
}

// Con Pesimista (o «Caminar menos»), la opción B del primer bloque tiene TODAS sus filas ocultas y
// aun así se ven su etiqueta y su título (UI empty E1).
async function expectOptionBEmptyButLabelled(page: Page, choices: YamlChoice[]): Promise<void> {
  const first = choices[0]!
  const j = first.options.findIndex(o => o.label === 'Opción B')
  expect(j, 'el primer choice tiene una «Opción B»').toBeGreaterThanOrEqual(0)
  const optB = first.options[j]!
  expect(optB.rows.every(r => !isVisible(rowPace(r), 'slow')), 'según el YAML, slow oculta todas las filas de B').toBe(true)
  const opt = page.locator(`${DAY_TIMELINE} > .tl-choice`).first().locator(':scope > .tl-choice-option').nth(j)
  const rows = opt.locator(':scope > .timeline > *')
  await expect(rows).toHaveCount(optB.rows.length)
  for (const r of await rows.all()) await expect(r).toBeHidden()
  await expect(opt.locator(':scope > .tl-choice-label')).toBeVisible()
  await expect(opt.locator(':scope > .tl-choice-title')).toBeVisible()
}

test.describe('campania: formas de las alternativas (EXT-01, D-02, D-03, D-05)', () => {
  test('campania: cada choice tiene sus opciones en orden y opciones−1 separadores; dos choice seguidos no se funden (EXT-01, D-02)', async ({ browser }) => {
    const { day, choices } = juevesChoices()
    expect(choices.some(c => c.options.length === 3), 'hay al menos un bloque de 3 opciones').toBe(true)
    let yamlPairs = 0
    day.timeline.forEach((r, i) => {
      if (r.kind === 'choice' && day.timeline[i + 1]?.kind === 'choice') yamlPairs++
    })
    expect(yamlPairs, 'el YAML tiene al menos un par de choice contiguos (anti-vacuidad)').toBeGreaterThanOrEqual(1)

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    const timeline = page.locator(DAY_TIMELINE)
    await expect(timeline).toHaveCount(1)
    // Filas comunes antes y después de los bloques, en la posición del dato.
    const childClasses = await timeline.evaluate(el =>
      Array.from(el.children).map(c => (c as HTMLElement).className.split(/\s+/)[0] ?? ''),
    )
    expect(childClasses).toEqual(day.timeline.map(r => ROOT_CLASS_BY_KIND[r.kind]))

    const blocks = timeline.locator(':scope > .tl-choice')
    await expect(blocks).toHaveCount(choices.length)
    for (const [i, choice] of choices.entries()) {
      const block = blocks.nth(i)
      const options = block.locator(':scope > .tl-choice-option')
      await expect(options).toHaveCount(choice.options.length)
      await expect(options.locator(':scope > .tl-choice-label')).toHaveText(choice.options.map(o => o.label))
      const seps = block.locator(':scope > .tl-choice-sep')
      await expect(seps).toHaveCount(choice.options.length - 1)
      for (const text of await seps.evaluateAll(els => els.map(e => e.textContent?.trim()))) {
        expect(text).toBe('— o bien —')
      }
      const expected = ['tl-choice-heading']
      choice.options.forEach((_, k) => {
        if (k > 0) expected.push('tl-choice-sep')
        expected.push('tl-choice-option')
      })
      expect(await block.evaluate(el => Array.from(el.children).map(c => c.className)), `bloque ${i}: hijos`).toEqual(expected)
    }

    // Dos `choice` seguidos en el dato = dos `div.tl-choice` hermanos contiguos, nunca fundidos.
    await expect(timeline.locator(':scope > .tl-choice + .tl-choice')).toHaveCount(yamlPairs)

    await context.close()
  })

  test('campania: «Elige una» por defecto y el heading del dato cuando lo hay (EXT-01)', async ({ browser }) => {
    const { choices } = juevesChoices()
    expect(choices.some(c => c.heading === undefined), 'hay un bloque sin heading').toBe(true)
    expect(choices.some(c => c.heading !== undefined), 'hay un bloque con heading').toBe(true)

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)
    const blocks = page.locator(`${DAY_TIMELINE} > .tl-choice`)
    await expect(blocks).toHaveCount(choices.length)
    for (const [i, choice] of choices.entries()) {
      const block = blocks.nth(i)
      const heading = await block.locator(':scope > .tl-choice-heading').evaluate(el => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
      if (choice.heading === undefined) {
        expect(heading).toBe('Elige una')
        await expect(block).toHaveAttribute('aria-label', 'Elige una')
      }
      else {
        expect(heading).toBe(mdText(choice.heading))
        await expect(block).toHaveAttribute('aria-label', inlineMdToPlain(choice.heading))
      }
    }
    await context.close()
  })

  test('campania: las opciones siguen visibles con cualquier ritmo, «Caminar menos» y resumen (D-03)', async ({ browser }) => {
    test.setTimeout(180_000)
    const { choices } = juevesChoices()

    // Los tres ritmos, en el mismo contexto (el ritmo se guarda por viaje en localStorage).
    {
      const { context, page } = await newIsolatedPage(browser)
      await gotoHydrated(page, CAMPANIA_URL)
      for (const pace of ['optimistic', 'neutral', 'slow'] as const) {
        await page.locator(`.pace-btn[data-pace="${pace}"]`).click()
        await expectChoiceChromeVisible(page)
        await expectInnerRowsFollowPace(page, choices, pace)
        if (pace === 'slow') await expectOptionBEmptyButLabelled(page, choices)
      }
      await context.close()
    }

    // «Caminar menos» fuerza Pesimista: el mismo resultado que slow.
    {
      const { context, page } = await newIsolatedPage(browser)
      await gotoHydrated(page, CAMPANIA_URL)
      await page.locator('#light-toggle').click()
      await expectChoiceChromeVisible(page)
      await expectInnerRowsFollowPace(page, choices, 'slow')
      await expectOptionBEmptyButLabelled(page, choices)
      await context.close()
    }

    // Modo resumen: dentro de las opciones se ocultan `.tl-transport` y `.tl-meta`, como fuera.
    {
      const { context, page } = await newIsolatedPage(browser)
      await gotoHydrated(page, CAMPANIA_URL)
      await page.locator('#resumen-toggle').click()
      await expect(page.locator('body')).toHaveClass(/\bmodo-resumen\b/)
      await expectChoiceChromeVisible(page)
      for (const cls of ['.tl-transport', '.tl-meta']) {
        const inner = page.locator(`${JUEVES} .tl-choice ${cls}`)
        expect(await inner.count(), `${cls} dentro de una opción (anti-vacuidad)`).toBeGreaterThan(0)
        for (const el of await inner.all()) await expect(el, `${cls} oculto en resumen`).toBeHidden()
      }
      await context.close()
    }
  })

  test('campania: una ficha citada solo dentro de una opción es una ficha normal del día (D-05)', async ({ browser }) => {
    const raito = MONUMENTS.find(m => m.slug === 'raito')
    expect(raito, 'monuments/raito.yml existe').toBeDefined()

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    const link = page.locator(`${DAY_TIMELINE} > .tl-choice`).first().locator('a.tl-title[href="#raito"]')
    await expect(link).toHaveCount(1)
    await expect(page.locator(`${JUEVES} .cards-list [id="raito"]`)).toHaveCount(1)
    // Marcadores bajo `section[id="mapa"]` (en el DOM montado el contenedor ya no conserva `#leaflet-map`).
    const romans = await page.locator('section[id="mapa"] .custom-marker').evaluateAll(els => els.map(e => e.textContent?.trim()))
    expect(romans.filter(r => r === raito!.roman)).toHaveLength(1)

    // dispatchEvent('click') recorre el listener real en CAPTURA, como en isolation.spec.ts.
    await link.scrollIntoViewIfNeeded()
    const hashBefore = new URL(page.url()).hash
    await link.dispatchEvent('click')
    await expect(page.locator('[id="raito"]')).toHaveClass(/\bhighlight\b/)
    expect(new URL(page.url()).hash, 'navegar a una ficha NO cambia el hash').toBe(hashBefore)

    await context.close()
  })

  test('campania: a 375 px las alternativas parten línea sin desbordar (backstop overflow E1)', async ({ browser }) => {
    const { choices } = juevesChoices()
    const three = choices.findIndex(c => c.options.length === 3)
    expect(three, 'hay un bloque de 3 opciones').toBeGreaterThanOrEqual(0)
    const titles = choices[three]!.options.map(o => o.title)
    const longest = titles.reduce((a, t, k) => (t.length > titles[a]!.length ? k : a), 0)
    expect(titles[longest]!.length, 'título largo de unos 80 caracteres').toBeGreaterThanOrEqual(70)

    const context = await browser.newContext({ viewport: { width: 375, height: 800 } })
    await blockExternal(context)
    const page = await context.newPage()
    await gotoHydrated(page, CAMPANIA_URL)

    const title = page.locator(`${DAY_TIMELINE} > .tl-choice`).nth(three)
      .locator(':scope > .tl-choice-option').nth(longest).locator(':scope > .tl-choice-title')
    await title.scrollIntoViewIfNeeded()
    const m = await title.evaluate((el) => {
      const cs = getComputedStyle(el)
      const lh = Number.parseFloat(cs.lineHeight)
      return {
        docScroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
        height: el.getBoundingClientRect().height,
        lineHeight: Number.isNaN(lh) ? Number.parseFloat(cs.fontSize) * 1.2 : lh,
      }
    })
    expect(m.docScroll, 'la página no desborda en horizontal').toBeLessThanOrEqual(m.inner)
    expect(m.height, 'el título largo ocupa más de una línea').toBeGreaterThan(1.5 * m.lineHeight)

    await context.close()
  })
})

// ── D-15: los cinco días del esqueleto ──────────────────────────────────────────────────────

interface YamlDayHead { slug: string, order: number, pill: string }

test.describe('campania: los días del esqueleto (D-15)', () => {
  test('campania: los cinco días aparecen en orden con su pastilla (D-15)', async ({ browser }) => {
    const days = readdirSync(join(CAMPANIA_ROOT, 'days'))
      .filter(f => f.endsWith('.yml'))
      .map(f => readYaml<YamlDayHead>(`days/${f}`))
      .sort((a, b) => a.order - b.order)
    expect(days.map(d => d.order), 'order contiguo 1..5').toEqual([1, 2, 3, 4, 5])
    const slugs = days.map(d => d.slug)
    const slugSet = new Set(slugs)

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    // Las secciones de día de <main>, en el orden del DOM = los slugs ordenados por `order`.
    const ids = await page.locator('main > section[id]').evaluateAll(els => els.map(e => e.id))
    expect(ids.filter(id => slugSet.has(id))).toEqual(slugs)

    // Pitfall 6 (Fase 10): por `href` + `section[id]`, nunca por la pastilla `.active`.
    for (const d of days) {
      const pill = page.locator(`#nav-pills .nav-pill[href="#${d.slug}"]`)
      await expect(pill, `una sola pastilla para ${d.slug}`).toHaveCount(1)
      await expect(pill).toHaveText(d.pill)
      await expect(page.locator(`section[id="${d.slug}"]`)).toHaveCount(1)
    }

    await context.close()
  })
})

// ── EXT-02: dónde se duerme cada día (12-03) ────────────────────────────────────────────────

interface YamlStay { slug: string, name: string }
interface YamlTripStays { stays?: YamlStay[] | null }
interface YamlDayStay { slug: string, order: number, stay?: string | null }

const FORMA_URL = `${ORIGIN}/guiaRoma/trips/forma`

// textContent con los espacios colapsados (el marcado de la línea puede partirse en varias líneas).
async function normText(locator: import('@playwright/test').Locator): Promise<string> {
  return ((await locator.textContent()) ?? '').replace(/\s+/g, ' ').trim()
}

// «Dormís en » + el nombre plano de la base del YAML (el glifo 🛏️ va en ::before, fuera del texto).
function stayLine(slug: string): string {
  const stays = readYaml<YamlTripStays>('trip.yml').stays ?? []
  const stay = stays.find(s => s.slug === slug)
  expect(stay, `la base "${slug}" existe en trip.yml stays`).toBeDefined()
  return `Dormís en ${inlineMdToPlain(stay!.name)}`
}

test.describe('campania: dónde se duerme (EXT-02, D-06…D-08)', () => {
  test('campania: el jueves 24 dice «Dormís en Salerno» entre el título y el subtítulo, también en resumen (EXT-02, D-07)', async ({ browser }) => {
    const day = readYaml<YamlDayStay>('days/jueves-24.yml')
    expect(day.stay, 'el jueves 24 tiene base en el YAML').toBe('salerno')
    const expected = stayLine(day.stay!)
    expect(expected).toBe('Dormís en Salerno')

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    const line = page.locator(`${JUEVES} .day-stay`)
    await expect(line).toHaveCount(1)
    expect(await normText(line)).toBe(expected)
    await expect(line.locator('.day-stay-name')).toHaveCount(1)
    expect(await normText(line.locator('.day-stay-name'))).toBe('Salerno')

    // Posición: dentro del <div> interior de .day-header, entre el h2 y .day-subtitle.
    const neighbours = await line.evaluate(el => ({
      parentInHeader: el.parentElement?.parentElement?.classList.contains('day-header') ?? false,
      prev: el.previousElementSibling?.tagName.toLowerCase() ?? null,
      nextIsSubtitle: el.nextElementSibling?.classList.contains('day-subtitle') ?? false,
    }))
    expect(neighbours).toEqual({ parentInHeader: true, prev: 'h2', nextIsSubtitle: true })
    await expect(line).toBeVisible()

    // Modo resumen: la línea sigue visible (clase propia) y el subtítulo no (Pitfall 15).
    await page.locator('#resumen-toggle').click()
    await expect(page.locator('body')).toHaveClass(/\bmodo-resumen\b/)
    await expect(line).toBeVisible()
    await expect(page.locator(`${JUEVES} .day-subtitle`)).toBeHidden()

    // D-08: las bases no crean marcadores; el mapa sigue con un marcador por ficha. Se cuentan
    // dentro de `section[id="mapa"]` (en el DOM montado el contenedor ya no conserva #leaflet-map).
    await expect(page.locator('section[id="mapa"] .custom-marker')).toHaveCount(MONUMENTS.length)

    await context.close()
  })

  test('campania: cada día dice dónde se duerme (EXT-02, D-07)', async ({ browser }) => {
    const days = readdirSync(join(CAMPANIA_ROOT, 'days'))
      .filter(f => f.endsWith('.yml'))
      .map(f => readYaml<YamlDayStay>(`days/${f}`))
      .sort((a, b) => a.order - b.order)
    const withStay = days.filter(d => !!d.stay)
    expect(withStay.length, 'al menos un día con base (anti-vacuidad)').toBeGreaterThanOrEqual(1)

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    for (const d of days) {
      const line = page.locator(`section[id="${d.slug}"] .day-stay`)
      if (d.stay) {
        await expect(line, `${d.slug} pinta su base`).toHaveCount(1)
        expect(await normText(line)).toBe(stayLine(d.stay))
      }
      else {
        await expect(line, `${d.slug} no tiene base: sin línea ni relleno`).toHaveCount(0)
      }
    }
    await expect(page.locator('.day-stay')).toHaveCount(withStay.length)

    await context.close()
  })

  test('campania: un viaje sin stays no pinta «Dormís en» (EXT-02 empty)', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, FORMA_URL)
    // Anti-vacuidad: la página de forma tiene días renderizados.
    expect(await page.locator('main > section[id] .day-header').count()).toBeGreaterThan(0)
    await expect(page.locator('.day-stay')).toHaveCount(0)
    await context.close()
  })
})

// ── EXT-04: lugares de naturaleza (12-04) ───────────────────────────────────────────────────

interface YamlNature { slug: string, roman: string, type: string, motif: string, day: string }

// Verde agua del marcador `nature` (MARKER_STYLE.nature.bg = #2f6f73, D-11) tal como lo da getComputedStyle.
const NATURE_BG = 'rgb(47, 111, 115)'

// Primer `id="…"` del SVG de un motivo (el del cielo, `sk_*`): basta para reconocer el dibujo pintado.
function firstSvgId(motif: string): string {
  const svg = SVG_MOTIFS[motif]
  expect(svg, `SVG_MOTIFS tiene el motivo "${motif}"`).toBeDefined()
  const id = /id="([^"]+)"/.exec(svg!)?.[1]
  expect(id, `el SVG de "${motif}" tiene al menos un id`).toBeDefined()
  return id!
}

// El marcador cuyo numeral es `roman`. Se buscan bajo `section[id="mapa"]`: en el DOM montado el
// contenedor ya no conserva `#leaflet-map` (ver los tests de EXT-01).
async function markerByRoman(page: Page, roman: string) {
  const markers = page.locator('section[id="mapa"] .custom-marker')
  await expect(markers.first()).toBeAttached()
  const romans = await markers.evaluateAll(els => els.map(e => e.textContent?.trim() ?? ''))
  const idx = romans.indexOf(roman)
  expect(idx, `hay un marcador con el numeral ${roman}`).toBeGreaterThanOrEqual(0)
  expect(romans.filter(r => r === roman), `un solo marcador con el numeral ${roman}`).toHaveLength(1)
  return markers.nth(idx)
}

// Fondo del círculo del divIcon (el div interior lleva el `background` en línea).
async function markerBg(marker: import('@playwright/test').Locator): Promise<string> {
  return marker.locator(':scope > div').evaluate(el => getComputedStyle(el).backgroundColor)
}

// La ficha cae al dibujo de su motivo: las heros `https://example.invalid/…` se abortan (blockExternal)
// y el `@error` pinta `motifSvg(motif)`. El img es lazy: hay que traer la cabecera a la vista.
async function expectHeroFallsBackToMotif(page: Page, slug: string, motif: string): Promise<void> {
  const hero = page.locator(`[id="${slug}"] .card-hero`)
  await hero.scrollIntoViewIfNeeded()
  const svg = hero.locator('svg')
  await expect(svg, `${slug}: el hero cae al SVG de su motivo`).toHaveCount(1)
  expect(await svg.evaluate(el => el.outerHTML)).toContain(`id="${firstSvgId(motif)}"`)
  await expect(hero.locator('img'), `${slug}: no queda <img> tras el fallback`).toHaveCount(0)
}

test.describe('campania: lugares de naturaleza (EXT-04, D-10, D-11)', () => {
  test('campania: Baia di Sorgeto pinta su dibujo de reserva y su marcador de naturaleza (EXT-04, D-10, D-11)', async ({ browser }) => {
    const sorgeto = readYaml<YamlNature>('monuments/baia-di-sorgeto.yml')
    expect(sorgeto.type).toBe('nature')
    expect(sorgeto.motif).toBe('thermal')

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    // Ficha: una MonumentCard normal, con su enlace a Google Maps y el dibujo de la poza termal.
    await expectHeroFallsBackToMotif(page, sorgeto.slug, sorgeto.motif)
    await expect(page.locator(`[id="${sorgeto.slug}"] a.maps-link`)).toHaveCount(1)

    // Marcador verde agua; su popup lleva a la ficha con un ancla plana del color del marcador.
    const marker = await markerByRoman(page, sorgeto.roman)
    expect(await markerBg(marker)).toBe(NATURE_BG)
    await marker.dispatchEvent('click')
    const popup = page.locator('.leaflet-popup-content')
    await expect(popup).toHaveCount(1)
    await expect(popup).toContainText('Abrir ficha →')
    const html = await popup.evaluate(el => el.innerHTML)
    expect(html).toContain(`href="#${sorgeto.slug}"`)
    expect(html).toContain('color:#2f6f73')

    await context.close()
  })

  test('campania: cada lugar de naturaleza tiene marcador verde agua y dibujo de reserva (EXT-04, D-05)', async ({ browser }) => {
    // Derivado del YAML: todas las fichas `type: nature` del viaje (D-15 pide al menos tres).
    const natures = readdirSync(join(CAMPANIA_ROOT, 'monuments'))
      .filter(f => f.endsWith('.yml'))
      .map(f => readYaml<YamlNature>(`monuments/${f}`))
      .filter(m => m.type === 'nature')
    expect(natures.length, 'al menos tres fichas nature en Campania (D-15)').toBeGreaterThanOrEqual(3)

    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    for (const n of natures) {
      expect(await markerBg(await markerByRoman(page, n.roman)), `${n.slug}: marcador verde agua`).toBe(NATURE_BG)
      await expectHeroFallsBackToMotif(page, n.slug, n.motif)
    }

    // D-05: Valle del Calore, la parada de la opción B del jueves 24, es una ficha normal del día.
    await expect(page.locator(`${JUEVES} .cards-list [id="valle-del-calore"]`)).toHaveCount(1)

    await context.close()
  })
})

// ── EXT-03: tramos en ferry, coche, autobús, bici y avión (12-05) ───────────────────────────

// Glifo de cada variante nueva (12-UI-SPEC §«Transportes nuevos»): va en `::before` de la cabecera
// del tramo y del item de stats, nunca en el texto del dato (un tramo no se distingue solo por color).
const NEW_TRANSPORT_GLYPH: Record<string, string> = {
  ferry: '⛴️', car: '🚗', bus: '🚌', bike: '🚲', plane: '✈️',
}

// Tramo con el borde dorado base (`.tl-transport.walk` = `--gold-soft`, el mismo que `.tl-transport`):
// la opción B del jueves 24 (12-01/12-02).
const BASE_TRANSPORT = `${JUEVES} .tl-choice .tl-transport.walk`

type Rgb = [number, number, number]

// getComputedStyle da los `color-mix()` como `color(srgb r g b)` (canales 0-1) y los colores simples
// como `rgb(r, g, b)`: los dos se llevan a 0-255 antes de comparar.
function toRgb(css: string): Rgb {
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(css)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  const srgb = /^color\(srgb\s+([-\d.e]+)\s+([-\d.e]+)\s+([-\d.e]+)/.exec(css)
  if (srgb) return [srgb[1], srgb[2], srgb[3]].map(v => Math.round(Number(v) * 255)) as Rgb
  throw new Error(`color no reconocido: ${css}`)
}

// Mismo color a ±tol por canal (el redondeo de `color-mix` puede mover una unidad).
function sameRgb(a: Rgb, b: Rgb, tol = 2): boolean {
  return a.every((v, i) => Math.abs(v - b[i]!) <= tol)
}

async function borderLeftRgb(locator: import('@playwright/test').Locator): Promise<Rgb> {
  return toRgb(await locator.evaluate(el => getComputedStyle(el).borderLeftColor))
}

// `content` de `::before` sin las comillas con que lo serializa getComputedStyle.
async function beforeContent(locator: import('@playwright/test').Locator): Promise<string> {
  const raw = await locator.evaluate(el => getComputedStyle(el, '::before').content)
  return raw.replace(/^"(.*)"$/s, '$1')
}

test.describe('campania: tramos con estilo propio (EXT-03, D-09)', () => {
  test('campania: el ferry y la bici del domingo 20 tienen banda y glifo propios (EXT-03, D-09)', async ({ browser }) => {
    const DOMINGO = 'section[id="domingo-20"]'
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, CAMPANIA_URL)

    const base = page.locator(BASE_TRANSPORT)
    await expect(base, 'tramo de referencia con el borde base').toHaveCount(1)
    const baseRgb = await borderLeftRgb(base)

    const seen: Rgb[] = []
    for (const v of ['ferry', 'bike']) {
      const row = page.locator(`${DOMINGO} .tl-transport.${v}`)
      await expect(row, `un tramo ${v} el domingo 20`).toHaveCount(1)
      const rgb = await borderLeftRgb(row)
      expect(sameRgb(rgb, baseRgb), `${v}: borde distinto del dorado base`).toBe(false)
      for (const other of seen) expect(sameRgb(rgb, other), `${v}: borde distinto de los demás`).toBe(false)
      seen.push(rgb)
      expect(await beforeContent(row.locator('.tl-transport-header')), `${v}: glifo de cabecera`).toBe(NEW_TRANSPORT_GLYPH[v])

      const stat = page.locator(`${DOMINGO} .day-stats-item.${v}`)
      await expect(stat, `una stat ${v} el domingo 20`).toHaveCount(1)
      expect(await beforeContent(stat), `${v}: glifo de stats`).toBe(NEW_TRANSPORT_GLYPH[v])
    }

    await context.close()
  })
})
