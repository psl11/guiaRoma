import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { parse } from 'yaml'
// Imports RELATIVOS (Playwright plano, sin alias): la misma matriz de ritmo y el mismo texto plano
// del Markdown-inline que usa la guía.
import { isVisible, type ItemPace, type Pace } from '../../app/utils/pace'
import { inlineMdToPlain } from '../../app/utils/tripLayout'

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
