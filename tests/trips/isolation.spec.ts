import { expect, test, type BrowserContext, type Page } from '@playwright/test'

/**
 * AISLAMIENTO POR VIAJE en un segundo viaje REAL (Fase 9: PLAT-01, PLAT-02, PLAT-03).
 *
 * Corre contra `nuxi dev` (playwright.trips.config.ts, puerto 5300, base /guiaRoma/): el viaje
 * ficticio `prueba` (content/trips/prueba/**) solo existe en dev hasta la Fase 11 (D-02). La
 * paridad de Roma ya prueba estas conductas para Roma; aquí se ejerce el cableado por slug con un
 * viaje DISTINTO y se comprueba que Roma conserva lo suyo.
 *
 *   · PLAT-02 navegación: enlace a ficha del timeline y de la prosa → scroll + `.highlight` dentro
 *     de prueba, sin tocar el hash; «Volver» restaura el origen; el scrollspy sigue los días.
 *   · PLAT-01 búsqueda: el índice de prueba no conoce las fichas de Roma y viceversa.
 *   · PLAT-03 preferencias y notas: claves `prueba-*` frente a `roma-*` (D-04, D-06).
 *
 * Autocontenido: no importa nada de tests/parity/ (helpers clonados de navigation.spec.ts).
 * En dev NO se afirma «cero errores de consola» (Vite/Vue emiten avisos de desarrollo): las
 * aserciones son de DOM, scroll y localStorage. Cada test usa su propio `browser.newContext()`
 * para no compartir localStorage (RESEARCH Pitfall 8).
 */

const ORIGIN = 'http://localhost:5300'
const ROMA_URL = `${ORIGIN}/guiaRoma/trips/roma/`
const PRUEBA_URL = `${ORIGIN}/guiaRoma/trips/prueba`

// Determinista y offline: aborta toda petición fuera del dev server (tiles OSM, Wikimedia,
// las heros `https://example.invalid/…` de prueba). El fallback SVG y el banner offline cubren el
// hueco igual que paseando sin red.
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

// Espera a que el scroll deje de moverse (dos lecturas iguales).
async function settleScroll(page: Page): Promise<void> {
  let prev = -1
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => window.scrollY)
    if (y === prev) return
    prev = y
    await page.waitForTimeout(80)
  }
}

// `offsetTop` de una sección, confirmado ESTABLE (dos lecturas consecutivas iguales).
async function stableOffsetTop(page: Page, id: string): Promise<number> {
  let prev = -1
  for (let i = 0; i < 20; i++) {
    const v = await page.evaluate(
      sid => (document.getElementById(sid) as HTMLElement | null)?.offsetTop ?? -1,
      id,
    )
    if (v === prev && v > 0) return v
    prev = v
    await page.waitForTimeout(80)
  }
  return prev
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

// Escribe en el buscador hasta que la aserción pase: en dev el índice MiniSearch se construye en
// onMounted tras cargar los datos, y una entrada anterior a ese momento no se reevalúa sola.
async function searchUntil(page: Page, q: string, check: () => Promise<void>): Promise<void> {
  await expect(async () => {
    await page.fill('#search', '')
    await page.fill('#search', q)
    await check()
  }).toPass({ timeout: 30_000 })
}

// Calentamiento: en dev Vite puede recargar la página la primera vez que descubre dependencias.
test.beforeAll(async ({ browser }) => {
  test.setTimeout(180_000)
  const { context, page } = await newIsolatedPage(browser)
  for (const url of [ROMA_URL, PRUEBA_URL]) {
    await page.goto(url, { timeout: 120_000 })
    await page.waitForLoadState('networkidle', { timeout: 120_000 })
  }
  await context.close()
})

test.describe('navegación en /trips/prueba (PLAT-02)', () => {
  test('enlace a ficha resalta y «Volver» restaura el scroll (timeline y prosa)', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, PRUEBA_URL)

    // Timeline → ficha. dispatchEvent('click') (nunca .click()): recorre la ruta real del listener
    // en CAPTURA y Playwright no auto-desplaza el enlace, así que el origen apilado es `originY`.
    const fichaLink = page.locator('a.tl-title[href="#torre-ensayo"]').first()
    await fichaLink.scrollIntoViewIfNeeded()
    await settleScroll(page)
    const originY = await page.evaluate(() => window.scrollY)

    await fichaLink.dispatchEvent('click')
    await expect(page.locator('#torre-ensayo')).toHaveClass(/\bhighlight\b/)
    expect(new URL(page.url()).hash, 'navegar a una ficha NO cambia el hash').not.toBe('#torre-ensayo')
    await expect(page.locator('#back-btn')).toHaveClass(/\bshow\b/)

    await page.click('#back-btn', { force: true })
    await expect.poll(
      () => page.evaluate(() => window.scrollY),
      { message: '«Volver» debe restaurar el scroll de origen dentro de prueba' },
    ).toBe(originY)
    await expect(page.locator('#back-btn')).not.toHaveClass(/\bshow\b/)

    // Prosa → ficha: el enlace Markdown de torre-ensayo apunta a una ficha del MISMO viaje.
    await page.locator('#torre-ensayo a[href="#fontana-pruebas"]').first().dispatchEvent('click')
    await expect(page.locator('#fontana-pruebas')).toHaveClass(/\bhighlight\b/)
    expect(new URL(page.url()).hash, 'navegar a una ficha NO cambia el hash').not.toBe('#fontana-pruebas')

    await context.close()
  })

  test('la pastilla activa sigue al scroll entre los días de prueba', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, PRUEBA_URL)

    const SWITCH_OFFSET = 130
    const MARGIN = 20
    // Re-desplaza en cada iteración del poll (relativo al offsetTop VIVO) y lee la pastilla activa
    // tras dos rAF, para que el scroll-listener pasivo haya corrido.
    const activeAfter = (id: string) => page.evaluate(({ sid, sw, m }) => {
      const off = (document.getElementById(sid) as HTMLElement).offsetTop
      window.scrollTo(0, off - sw + m)
      return new Promise<string | null>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          resolve(document.querySelector('.nav-pill.active')?.getAttribute('href') ?? null)
        }))
      })
    }, { sid: id, sw: SWITCH_OFFSET, m: MARGIN })

    expect(await stableOffsetTop(page, 'viernes'), '#viernes debe existir con offset estable').toBeGreaterThan(0)
    await expect.poll(() => activeAfter('viernes'), { message: 'pasado el +130 de #viernes' }).toBe('#viernes')

    const sabadoTop = await stableOffsetTop(page, 'sabado')
    expect(sabadoTop, '#sabado debe existir con offset estable').toBeGreaterThan(0)
    await expect.poll(() => activeAfter('sabado'), { message: 'pasado el +130 de #sabado' }).toBe('#sabado')
    await expect(page.locator('.nav-pill.active')).toHaveCount(1)

    await context.close()
  })
})

test.describe('búsqueda aislada por viaje (PLAT-01)', () => {
  test('en prueba: Pantheon sin resultados, Fontana y Escalinata solo fichas de prueba, y el resultado navega dentro de prueba', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, PRUEBA_URL)
    const results = page.locator('#search-results .search-result')

    // Sonda de índice listo: sin ella, «Sin resultados» para Pantheon pasaría también con el índice
    // aún vacío y no probaría nada.
    await searchUntil(page, 'Escalinata', async () => {
      await expect(results).toHaveCount(1, { timeout: 2_000 })
    })

    await page.fill('#search', 'Pantheon')
    await expect(page.locator('#search-results')).toHaveClass(/\bshow\b/)
    await expect(results).toHaveCount(0)
    await expect(page.locator('#search-results')).toContainText('Sin resultados')

    await page.fill('#search', 'Fontana')
    await expect(results).toHaveCount(1)
    await expect(results.first()).toContainText('Fontana de las Pruebas')

    await page.fill('#search', 'Escalinata')
    const spagna = page.locator('#search-results .search-result[data-card="spagna"]')
    await expect(spagna).toHaveCount(1)
    await expect(spagna).toContainText('Escalinata de Ensayo')

    await spagna.click()
    await expect(page.locator('#spagna')).toHaveClass(/\bhighlight\b/)
    expect(new URL(page.url()).hash, 'elegir un resultado NO cambia el hash').not.toBe('#spagna')

    await context.close()
  })

  test('en Roma: Pantheon encuentra la ficha de Roma y Fontana no trae fichas de prueba', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, ROMA_URL)
    const results = page.locator('#search-results .search-result')

    await searchUntil(page, 'Pantheon', async () => {
      await expect(page.locator('#search-results .search-result[data-card="pantheon"]')).not.toHaveCount(0, { timeout: 2_000 })
    })

    // Fontana sí tiene fichas en Roma (índice vivo), pero ninguna es la de prueba.
    await page.fill('#search', 'Fontana')
    await expect(results).not.toHaveCount(0)
    await expect(results.filter({ hasText: 'Fontana de las Pruebas' })).toHaveCount(0)

    await context.close()
  })
})

test.describe('preferencias y notas por viaje (PLAT-03)', () => {
  test('prueba arranca con valores por defecto aunque Roma tenga preferencias, y ninguno pisa al otro', async ({ browser }) => {
    const { context, page } = await newIsolatedPage(browser)
    await gotoHydrated(page, PRUEBA_URL)

    // Siembra UNA sola vez (page.evaluate, no un script de inicialización del contexto, que
    // re-sembraría en cada carga y haría vacua la comprobación de que Roma no se pisa).
    await page.evaluate(() => {
      localStorage.setItem('roma-pace', 'slow')
      localStorage.setItem('roma-light', '1')
      localStorage.setItem('roma-resumen', '1')
      localStorage.setItem('roma-note-spagna', 'nota de roma')
    })
    await page.reload()
    await gotoHydrated(page, PRUEBA_URL)

    const ls = (k: string) => page.evaluate(key => localStorage.getItem(key), k)
    const body = page.locator('body')
    const note = page.locator('#spagna .notes-textarea').first()

    // Prueba no hereda nada de Roma (D-06): ritmo por defecto, sin modos, nota vacía.
    await expect(page.locator('.pace-btn[data-pace="optimistic"]')).toHaveClass(/\bactive\b/)
    await expect(body).not.toHaveClass(/\blight-mode\b/)
    await expect(body).not.toHaveClass(/\bmodo-resumen\b/)
    await expect(note).toHaveValue('')

    // Escribir en prueba: clave prueba-*, Roma intacta.
    await note.fill('nota de prueba')
    await expect.poll(() => ls('prueba-note-spagna')).toBe('nota de prueba')
    expect(await ls('roma-note-spagna')).toBe('nota de roma')

    await page.click('.pace-btn[data-pace="neutral"]')
    await expect.poll(() => ls('prueba-pace')).toBe('neutral')
    expect(await ls('roma-pace')).toBe('slow')

    // Roma conserva lo suyo.
    await gotoHydrated(page, ROMA_URL)
    await expect(page.locator('.pace-btn[data-pace="slow"]')).toHaveClass(/\bactive\b/)
    await expect(body).toHaveClass(/\blight-mode\b/)
    await expect(body).toHaveClass(/\bmodo-resumen\b/)
    await expect(page.locator('#spagna .notes-textarea').first()).toHaveValue('nota de roma')

    // Y prueba, los suyos.
    await gotoHydrated(page, PRUEBA_URL)
    await expect(page.locator('.pace-btn[data-pace="neutral"]')).toHaveClass(/\bactive\b/)
    await expect(page.locator('#spagna .notes-textarea').first()).toHaveValue('nota de prueba')

    await context.close()
  })
})
