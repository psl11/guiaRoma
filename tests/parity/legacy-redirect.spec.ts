import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import type { Server } from 'node:http'
import { join } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { OUTPUT_DIR, ROMA_HTML, ROMA_URL, SITE_BASE } from './_harness'
import { startPagesServer } from './_pagesServer'

/**
 * REDIRECCIÓN DE ENLACES ANTIGUOS (ROUTE-03, D-14): `/guiaRoma/#ancla` (y
 * `/guiaRoma/index.html#ancla`) lleva a la misma ancla dentro de `/guiaRoma/trips/roma/` con
 * `location.replace`, antes del primer pintado y sin entrada de historial; sin hash (o con un hash
 * que no cumple `^#[a-z0-9-]+$`) la portada se queda.
 *
 * Servidor: `startPagesServer` (tests/parity/_pagesServer.ts) imita a GitHub Pages sobre
 * `.output/public` bajo `/guiaRoma/` (301 a barra final, 404.html), en un puerto base propio
 * + TEST_WORKER_INDEX (ver `PORT`; lejos de los puertos de los specs existentes).
 *
 * Por qué cada test con redirección EMPIEZA EN OTRO DOCUMENTO (`/guiaRoma/favicon.svg`): el script
 * de la portada solo corre en una carga de documento. Ir de `/guiaRoma/` a `/guiaRoma/#viernes`
 * dentro del mismo documento es una navegación de fragmento y NO redirige (research Pitfall 4).
 * El favicon es además el destino esperado de «Atrás»: `location.replace` no deja entrada de
 * historial, así que una sola pulsación vuelve a él (sin bucle).
 *
 * Por qué «misma posición que una carga directa» y no «en el viewport» en las anclas profundas
 * (`#pantheon`, `#gastronomia`): tras el salto nativo el contenido de encima sigue refluyendo y
 * esas anclas derivan fuera del viewport TAMBIÉN en una carga directa, en v1.0 y en el index.html
 * de main (research Pitfall 3): es paridad preexistente, no una regresión. Lo que se prueba es que
 * la redirección aterriza EXACTAMENTE como una carga directa de `/trips/roma/#x` (±2 px). Solo
 * `#viernes` (una sección cerca de la cabecera) se exige además en el viewport.
 *
 * Posición determinista (`holdImages`): con las imágenes ABORTADAS (como visual-diff) la posición
 * de `#gastronomia` en mobile NO es determinista ni siquiera entre dos cargas directas (3694 /
 * 3799 / 3904 / 4009 px: escalones de 105 px = un fallback SVG de imagen lazy que se aplica antes o
 * después del salto al ancla). Por eso las pruebas de posición dejan las peticiones de imagen
 * PENDIENTES (ni `abort` ni `fulfill`): no hay `onerror`, no hay sustitución por SVG y nada refluye
 * encima del ancla tras aterrizar; así redirección y carga directa coinciden a ±2 px en cada
 * ejecución (mobile y desktop). Como esas peticiones no terminan, se mide sin `networkidle`: tras
 * `domcontentloaded`, el fin de la hidratación de Nuxt, las fuentes, dos frames y la estabilidad
 * del scroll.
 */

/** Asegura la build estática una sola vez (clon del de shell.spec.ts). */
function ensureBuild(): void {
  if (!existsSync(ROMA_HTML)) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(ROMA_HTML), 'la página de Roma de la build (ROMA_HTML) debe existir').toBe(true)
}

/** Aborta las imágenes y toda petición fuera del origen del servidor (pruebas sin posición). */
async function isolate(page: Page, origin: string): Promise<void> {
  await page.route('**/*', (route) => {
    const req = route.request()
    if (req.resourceType() === 'image' || !req.url().startsWith(`${origin}/`)) return route.abort()
    return route.continue()
  })
}

/**
 * Deja PENDIENTES las peticiones de imagen (ni se abortan ni se sirven: la página se cierra con
 * ellas en vuelo) y aborta toda petición fuera del origen del servidor. Ver la cabecera: es lo que
 * hace determinista la posición de las anclas profundas.
 */
async function holdImages(page: Page, origin: string): Promise<void> {
  await page.route('**/*', (route) => {
    const req = route.request()
    if (req.resourceType() === 'image') return
    if (!req.url().startsWith(`${origin}/`)) return route.abort()
    return route.continue()
  })
}

/**
 * `top` (px, relativo al viewport) de `[id="<id>"]` en una página con `holdImages`, tras
 * `domcontentloaded`, el fin de la hidratación de Nuxt (Roma lleva el scroll al ancla al montar),
 * las fuentes, dos frames y la estabilidad del scroll: `scrollY` y la altura del documento sin
 * cambios durante 20 frames seguidos (tope defensivo de 600 frames).
 */
async function settledTop(page: Page, id: string): Promise<number> {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForFunction(() => {
    const nuxt = (window as unknown as { useNuxtApp?: () => { isHydrating?: boolean } }).useNuxtApp
    return typeof nuxt === 'function' && nuxt().isHydrating === false
  })
  await page.evaluate(() => (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
  await page.evaluate(async () => {
    const raf = () => new Promise<void>(r => requestAnimationFrame(() => r()))
    const read = () => `${window.scrollY}:${document.documentElement.scrollHeight}`
    let last = read()
    let stable = 0
    for (let i = 0; i < 600 && stable < 20; i++) {
      await raf()
      const now = read()
      stable = now === last ? stable + 1 : 0
      last = now
    }
  })
  return page.locator(`[id="${id}"]`).evaluate(el => el.getBoundingClientRect().top)
}

/** `top` de `#<id>` en una carga DIRECTA de `/trips/roma/#<id>` (otra página del mismo contexto). */
async function directTop(page: Page, origin: string, id: string): Promise<number> {
  const direct = await page.context().newPage()
  try {
    await holdImages(direct, origin)
    await direct.goto(`${origin}${ROMA_URL}#${id}`, { waitUntil: 'domcontentloaded' })
    return await settledTop(direct, id)
  }
  finally {
    await direct.close()
  }
}

/** Abre `path` (relativo a la base) partiendo de OTRO documento: el favicon. */
async function openFromFavicon(page: Page, origin: string, path: string): Promise<void> {
  await page.goto(`${origin}${SITE_BASE}favicon.svg`)
  // `commit`: si hay redirección, `location.replace` sustituye la carga antes de su `load`.
  await page.goto(`${origin}${SITE_BASE}${path}`, { waitUntil: 'commit' })
}

/** Redirección + aterrizaje como una carga directa de `/trips/roma/#<id>` (anclas profundas). */
async function expectLandsLikeDirect(page: Page, origin: string, path: string, id: string): Promise<void> {
  await holdImages(page, origin)
  await openFromFavicon(page, origin, path)
  await page.waitForURL(`${origin}${ROMA_URL}#${id}`, { waitUntil: 'domcontentloaded' })
  expect(page.url()).toBe(`${origin}${ROMA_URL}#${id}`)

  const top = await settledTop(page, id)
  const expected = await directTop(page, origin, id)
  console.log(`[legacy-redirect] #${id} top: redirección=${top}px, carga directa=${expected}px`)
  expect(Math.abs(top - expected), `top tras redirección (${top}) vs carga directa (${expected})`).toBeLessThanOrEqual(2)
  // Paridad v1.0: un salto nativo a un ancla no resalta la ficha.
  await expect(page.locator(`[id="${id}"]`)).not.toHaveClass(/\bhighlight\b/)
}

test.describe('redirección de enlaces antiguos (ROUTE-03)', () => {
  const PORT = 5850 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const ORIGIN = `http://127.0.0.1:${PORT}`
  let server: Server | undefined

  test.beforeAll(async () => {
    ensureBuild()
    server = await startPagesServer(OUTPUT_DIR, PORT)
  })

  test.afterAll(async () => {
    await new Promise<void>(r => (server ? server.close(() => r()) : r()))
  })

  test('redirección: /#viernes lleva a /trips/roma/#viernes y «Atrás» vuelve en una pulsación (ROUTE-03)', async ({ page }) => {
    await holdImages(page, ORIGIN)
    await page.goto(`${ORIGIN}${SITE_BASE}favicon.svg`)
    const historyBefore = await page.evaluate(() => history.length)
    await page.goto(`${ORIGIN}${SITE_BASE}#viernes`, { waitUntil: 'commit' })
    await page.waitForURL(`${ORIGIN}${ROMA_URL}#viernes`, { waitUntil: 'domcontentloaded' })

    const top = await settledTop(page, 'viernes')
    await expect(page.locator('[id="viernes"]')).toBeInViewport()
    const expected = await directTop(page, ORIGIN, 'viernes')
    console.log(`[legacy-redirect] #viernes top: redirección=${top}px, carga directa=${expected}px`)
    expect(Math.abs(top - expected), `top tras redirección (${top}) vs carga directa (${expected})`).toBeLessThanOrEqual(2)

    // `location.replace` sustituye la entrada de la portada: el historial crece en UNA entrada
    // (favicon → Roma), no en dos (favicon → portada → Roma).
    expect(await page.evaluate(() => history.length)).toBe(historyBefore + 1)

    // UNA pulsación de «Atrás» vuelve al favicon. `goBack()` puede resolver con una navegación
    // intermedia del mismo documento (el router de Roma), así que se espera a la URL final.
    await page.goBack()
    await page.waitForURL(`${ORIGIN}${SITE_BASE}favicon.svg`)
    expect(page.url()).toBe(`${ORIGIN}${SITE_BASE}favicon.svg`)
  })

  test('redirección: el script va en el head de la portada antes del primer stylesheet y no existe en Roma (D-14)', () => {
    const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf8')
    const head = html.slice(0, html.indexOf('</head>'))
    const scriptAt = head.indexOf('data-hid="legacy-hash-redirect"')
    const cssAt = head.indexOf('rel="stylesheet"')
    expect(scriptAt, 'el script legacy-hash-redirect está en el <head> de la portada').toBeGreaterThan(-1)
    expect(cssAt, 'la portada enlaza al menos una hoja de estilos').toBeGreaterThan(-1)
    expect(scriptAt, 'el script va ANTES del primer <link rel="stylesheet">').toBeLessThan(cssAt)

    const script = head.slice(scriptAt, head.indexOf('</script>', scriptAt))
    expect(script).toContain('location.replace')
    expect(script).toContain('^#[a-z0-9-]+$')
    // Destino fijo y del mismo origen: la ruta de Roma serializada en build.
    expect(script).toContain(JSON.stringify(ROMA_URL))

    expect(readFileSync(ROMA_HTML, 'utf8'), 'solo la portada redirige').not.toContain('legacy-hash-redirect')
  })

  test('redirección: /#pantheon aterriza como una carga directa de /trips/roma/#pantheon', async ({ page }) => {
    await expectLandsLikeDirect(page, ORIGIN, '#pantheon', 'pantheon')
  })

  test('redirección: /index.html#gastronomia aterriza como una carga directa de /trips/roma/#gastronomia', async ({ page }) => {
    await expectLandsLikeDirect(page, ORIGIN, 'index.html#gastronomia', 'gastronomia')
  })

  test('redirección: /guiaRoma/ sin hash se queda en la portada', async ({ page }) => {
    await isolate(page, ORIGIN)
    await page.goto(`${ORIGIN}${SITE_BASE}`)
    await page.waitForLoadState('networkidle')
    expect(await page.evaluate(() => location.pathname)).toBe(SITE_BASE)
    expect(await page.evaluate(() => location.hash)).toBe('')
    await expect(page.locator('.trip-index')).toBeVisible()
  })

  test('redirección: un hash que no cumple ^#[a-z0-9-]+$ se queda en la portada', async ({ page }) => {
    await isolate(page, ORIGIN)
    for (const hash of ['#Bad_Hash', '#a/b', '#%3Cscript%3E']) {
      await openFromFavicon(page, ORIGIN, hash)
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => location.pathname), `${hash}: sigue en la portada`).toBe(SITE_BASE)
      expect(await page.evaluate(() => location.hash), `${hash}: el hash queda intacto`).toBe(hash)
      await expect(page.locator('.trip-index'), `${hash}: la portada se ve`).toBeVisible()
      await expect(page.locator('nav.nav-pills'), `${hash}: sin chrome de Roma`).toHaveCount(0)
    }
  })

  test('redirección: GitHub Pages añade la barra final con 301 y conserva el hash', async ({ page }) => {
    const res = await page.request.get(`${ORIGIN}${SITE_BASE.slice(0, -1)}`, { maxRedirects: 0 })
    expect(res.status()).toBe(301)
    expect(res.headers()['location']).toBe(SITE_BASE)

    await isolate(page, ORIGIN)
    await page.goto(`${ORIGIN}${ROMA_URL.slice(0, -1)}#viernes`)
    await page.waitForURL(`${ORIGIN}${ROMA_URL}#viernes`)
    expect(page.url()).toBe(`${ORIGIN}${ROMA_URL}#viernes`)
    await expect(page.locator('.nav-pill')).toHaveCount(12)
  })
})
