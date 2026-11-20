import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { Server } from 'node:http'
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
 * Por qué «misma posición que una carga directa» y no `toBeInViewport` en las anclas profundas
 * (`#pantheon`, `#gastronomia`): tras el salto nativo el contenido de encima sigue refluyendo y
 * esas anclas derivan fuera del viewport TAMBIÉN en una carga directa, en v1.0 y en el index.html
 * de main (research Pitfall 3): es paridad preexistente, no una regresión. Lo que se prueba es que
 * la redirección aterriza EXACTAMENTE como una carga directa de `/trips/roma/#x` (±2 px), con las
 * imágenes bloqueadas para que la posición sea determinista. Solo `#viernes` (una sección cerca de
 * la cabecera) se exige además en el viewport.
 */

/** Asegura la build estática una sola vez (clon del de shell.spec.ts). */
function ensureBuild(): void {
  if (!existsSync(ROMA_HTML)) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(ROMA_HTML), 'la página de Roma de la build (ROMA_HTML) debe existir').toBe(true)
}

/** Bloquea las imágenes (posición determinista) y toda petición fuera del origen del servidor. */
async function isolate(page: Page, origin: string): Promise<void> {
  await page.route('**/*', (route) => {
    const req = route.request()
    if (req.resourceType() === 'image' || !req.url().startsWith(`${origin}/`)) return route.abort()
    return route.continue()
  })
}

/**
 * `top` (px, relativo al viewport) de `[id="<id>"]` tras asentar red, fuentes, dos frames y el
 * scroll. El salto nativo al ancla puede seguir moviéndose unos frames (en mobile se observó
 * 136 → 124 px en ~1 s), así que además se espera a que `scrollY` y la altura del documento
 * no cambien durante 10 frames seguidos (tope defensivo de 300 frames).
 */
async function settledTop(page: Page, id: string): Promise<number> {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
  await page.evaluate(async () => {
    const raf = () => new Promise<void>(r => requestAnimationFrame(() => r()))
    const read = () => `${window.scrollY}:${document.documentElement.scrollHeight}`
    let last = read()
    let stable = 0
    for (let i = 0; i < 300 && stable < 10; i++) {
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
    await isolate(direct, origin)
    await direct.goto(`${origin}${ROMA_URL}#${id}`)
    return await settledTop(direct, id)
  }
  finally {
    await direct.close()
  }
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
    await isolate(page, ORIGIN)
    await page.goto(`${ORIGIN}${SITE_BASE}favicon.svg`)
    const historyBefore = await page.evaluate(() => history.length)
    await page.goto(`${ORIGIN}${SITE_BASE}#viernes`, { waitUntil: 'commit' })
    await page.waitForURL(`${ORIGIN}${ROMA_URL}#viernes`)

    const target = page.locator('[id="viernes"]')
    await expect(target).toBeInViewport()
    const top = await settledTop(page, 'viernes')
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
})
