import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * BÚSQUEDA EN CLIENTE (FEAT-03) + RUTA DEL DÍA (FEAT-09) sobre el «/» CONSTRUIDO — el
 * comportamiento CABLEADO end-to-end sobre el SSG generado. Los tests unitarios de 06-01
 * (dayRoute) y 06-02 (searchIndex) prueban la lógica PURA; este spec prueba lo wired:
 *   · FEAT-03 dropdown: <2 chars cerrado, ≥2 chars abre `.search-results.show` (máx 8 filas),
 *     "Sin resultados" en una consulta sin coincidencias.
 *   · FEAT-03 resultado→navegación (SC#2 / D-03): clicar un resultado añade `.highlight` a la
 *     ficha destino y NO cambia el hash de la URL (onSelect → navigateToCard hace preventDefault).
 *   · FEAT-09 botón de ruta: por día visible con ≥2 paradas, etiqueta "Ver ruta del día (N
 *     paradas)" y `href` con el prefijo fijo de Google Maps (aseverado por ESTRUCTURA, NUNCA
 *     se hace fetch — sin superficie SSRF; T-06-10).
 *
 * AUTOCONTENIDO (mirror EXACTO de tests/parity/modes.spec.ts y navigation.spec.ts): NO usa el
 * webServer de playwright.config.ts (que sirve el index.html VIEJO/VIVO del golden). `pnpm
 * generate` una vez, `.output/public/*` → subcarpeta `guiaRoma/`, static server propio bajo
 * /guiaRoma/. La build estática hidrata y la búsqueda/ruta funcionan en cliente (es lo que
 * prueba la paridad real del SSG). NO modifica golden.spec.ts ni rebaselina (D-08). Tolera SOLO
 * el error de hidratación de @nuxtjs/color-mode y falla ante cualquier otro error de consola
 * (puerta T-06-09: una regresión a `v-html`/XSS en el render del resultado encendería un error).
 *
 * SCOPE: solo comportamiento (selectores DOM/texto/atributos). NO keyboard-nav, NO filas
 * enriquecidas, NO pixel/screenshot diff (la Fase 8 posee el visual-diff total).
 */

const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i
const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

async function waitForServer(url: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.status > 0) return
    }
    catch (err) {
      lastErr = err
    }
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`Server no respondió en ${url} tras ${timeoutMs}ms (último error: ${String(lastErr)})`)
}

function killGroup(proc: ChildProcess | undefined): void {
  if (proc?.pid && !proc.killed) {
    try {
      process.kill(-proc.pid, 'SIGTERM')
    }
    catch {
      try {
        proc.kill('SIGTERM')
      }
      catch { /* ya muerto */ }
    }
  }
}

function ensureBuild(): void {
  if (!existsSync(join(OUTPUT_DIR, 'index.html'))) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(join(OUTPUT_DIR, 'index.html')), '.output/public/index.html debe existir').toBe(true)
}

type PWPage = import('@playwright/test').Page

// Espera a que el scroll deje de moverse (dos lecturas consecutivas iguales): el scroll suave del
// navegador (scrollIntoView de navigateToCard / scrollTo de goBack) tarda varios frames en asentarse.
// Clon del helper homónimo de navigation.spec.ts:93-101 — necesario para el back-half de la pila: si
// se clica "Volver" MIENTRAS el scroll suave de la navegación resultado→ficha sigue en vuelo, el
// `scrollTo` de goBack compite con ese scrollIntoView en curso y el resultado es no determinista.
async function settleScroll(page: PWPage): Promise<void> {
  let prev = -1
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => window.scrollY)
    if (y === prev) return
    prev = y
    await page.waitForTimeout(80)
  }
}

test.describe('búsqueda + ruta del día en /guiaRoma/ construido (FEAT-03 / FEAT-09)', () => {
  // Base 5740: modes.spec=5700, navigation.spec=5720 → 5740 para no colisionar.
  const STATIC_PORT = 5740 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_ORIGIN = `http://localhost:${STATIC_PORT}`
  const STATIC_URL = `${STATIC_ORIGIN}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-search-'))
    const subDir = join(previewRoot, 'guiaRoma')
    mkdirSync(subDir, { recursive: true })
    cpSync(OUTPUT_DIR, subDir, { recursive: true })

    server = spawn('pnpm', ['dlx', 'serve', '-l', String(STATIC_PORT), previewRoot], {
      stdio: 'ignore',
      shell: false,
      detached: true,
    })
    server.unref()
    await waitForServer(STATIC_URL)
  })

  test.afterAll(() => {
    killGroup(server)
    if (previewRoot && existsSync(previewRoot)) {
      rmSync(previewRoot, { recursive: true, force: true })
    }
  })

  // -- Helper: navega + espera la hidratación. La búsqueda (onInput) y los listeners de
  //    outside-click se registran en onMounted del controller; hasta que la app hidrata el
  //    @input no responde. Señal hidratada conocida (misma que modes.spec): el 1er pace-btn
  //    queda `.active` por el estado prerenderizado optimista — cuando responde el @click la app
  //    está hidratada. El #search está en el masthead #inicio (top), siempre en viewport. --
  async function gotoHydrated(page: PWPage) {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.pace-btn[data-pace="optimistic"]')).toHaveClass(/\bactive\b/)
  }

  // -- Registra la puerta de errores de consola: tolera SOLO el mensaje de hidratación de
  //    color-mode; cualquier otro error (p. ej. un fallo de render del dropdown) se acumula. --
  function trackConsoleErrors(page: PWPage): string[] {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })
    return consoleErrors
  }

  test('FEAT-03 umbral del dropdown: <2 chars cerrado; ≥2 chars (match real) abre con ≥1 fila', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page)
    await gotoHydrated(page)

    const search = page.locator('#search')
    const dropdown = page.locator('#search-results')

    // 1 char: el dropdown NO tiene `.show` (cerrado) y no hay filas (onInput guard q.length<2).
    await search.fill('P')
    await expect(dropdown).not.toHaveClass(/\bshow\b/)
    await expect(page.locator('.search-result')).toHaveCount(0)

    // ≥2 chars con prefijo de un monumento real ("Pante" → Pantheon, boost de name): abre con
    // `.show` visible y al menos una fila `.search-result`.
    await search.fill('Pante')
    await expect(dropdown).toHaveClass(/\bshow\b/)
    await expect(dropdown).toBeVisible()
    await expect(page.locator('.search-result').first()).toBeVisible()
    await expect.poll(() => page.locator('.search-result').count()).toBeGreaterThanOrEqual(1)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('FEAT-03 máx 8: una consulta amplia (≥2 chars) nunca pinta más de 8 filas', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page)
    await gotoHydrated(page)

    const search = page.locator('#search')
    const dropdown = page.locator('#search-results')

    // "Santa" matchea MUCHOS monumentos (Santa Maria degli Angeli/sopra Minerva/Maggiore/in
    // Trastevere, Santa Teresa, San Clemente, San Luigi, San Pietro, Sant'Ignazio, Sant'Eustachio…)
    // → con prefix+OR son >8 candidatos; onInput hace `.slice(0, 8)` → el dropdown nunca pasa de 8.
    await search.fill('Santa')
    await expect(dropdown).toHaveClass(/\bshow\b/)
    await expect(page.locator('.search-result').first()).toBeVisible()
    const count = await page.locator('.search-result').count()
    expect(count, 'el dropdown se capa a 8 filas (slice 0,8)').toBeLessThanOrEqual(8)
    expect(count, 'una consulta amplia debe devolver al menos una fila').toBeGreaterThanOrEqual(1)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('FEAT-03 estado vacío: una consulta sin coincidencias muestra "Sin resultados" y 0 filas', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page)
    await gotoHydrated(page)

    const search = page.locator('#search')
    const dropdown = page.locator('#search-results')

    // ≥2 chars que no casan con nada → results=[] pero isOpen=true (onInput abre con cualquier
    // q≥2): el dropdown muestra el texto literal "Sin resultados" y CERO filas `.search-result`.
    await search.fill('zzzqqq')
    await expect(dropdown).toHaveClass(/\bshow\b/)
    await expect(dropdown).toContainText('Sin resultados')
    await expect(page.locator('.search-result')).toHaveCount(0)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('FEAT-03 resultado → navegación (SC#2 / D-03): clic resalta la ficha, NO cambia el hash, y "Volver" restaura el scroll', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page)
    await gotoHydrated(page)

    const search = page.locator('#search')
    const dropdown = page.locator('#search-results')

    // ORIGEN del scroll, capturado ANTES de la navegación resultado→ficha. El #search vive en el
    // masthead #inicio (top), así que `originY` es naturalmente ~0; se asienta el scroll primero
    // (settleScroll) para fijar un origen FIRME. La pila guardará EXACTAMENTE este `originY` y
    // "Volver" debe restaurarlo (mirror navigation.spec.ts:216-217 — captura tras settle).
    await settleScroll(page)
    const originY = await page.evaluate(() => window.scrollY)

    // Consulta con un único candidato fuerte: "Pante" → Pantheon (boost de name). Abrir el dropdown.
    await search.fill('Pante')
    await expect(dropdown).toHaveClass(/\bshow\b/)
    const firstResult = page.locator('.search-result').first()
    await expect(firstResult).toBeVisible()

    // El slug destino se LEE del `data-card` del propio resultado (no se asume), igual a su href
    // `#<slug>`. La ficha es `<article :id="slug" class="card">` (MonumentCard).
    const slug = await firstResult.getAttribute('data-card')
    expect(slug, 'la fila de resultado debe exponer su slug en data-card').toBeTruthy()

    // Clic en el resultado (está en viewport: el #search vive en el masthead #inicio, arriba — a
    // diferencia del popup del mapa/timeline, aquí `.click()` no auto-desplaza una fuente lejana, así
    // que el scrollY que el controller mete en la pila sigue siendo `originY`).
    // onSelect → limpia query + cierra dropdown + navigateToCard(slug): preventDefault (D-03) +
    // scrollIntoView suave + `.highlight` 2500ms sobre la ficha destino.
    await firstResult.click()

    // La ficha destino recibe `.highlight` (SC#2: navegación cableada) …
    await expect(page.locator(`#${slug}`)).toHaveClass(/\bhighlight\b/)
    // … y el hash de la URL NO pasa a `#<slug>` (D-03: navigateToCard hace preventDefault). Mirror
    // de navigation.spec.ts:229.
    expect(new URL(page.url()).hash, 'D-03: navegar a una ficha NO cambia el hash de la URL').not.toBe(`#${slug}`)

    // POST-SELECCIÓN (paridad con index.html:6459-6460 — WR-01): al elegir un resultado el
    // original cerraba el dropdown y vaciaba el input EN EL MISMO clic. Esto es justo lo que el
    // listener de captura de F5 rompía (se tragaba el `@click` → onSelect no corría). Aseverar
    // ambos estados es lo que habría cazado CR-01: el dropdown PIERDE `.show` y el #search queda ''.
    await expect(dropdown).not.toHaveClass(/\bshow\b/)
    await expect(search).toHaveValue('')

    // BACK-HALF de la pila (D-05) — mirror EXACTO de navigation.spec.ts:231-242, ahora desde el
    // punto de entrada del RESULTADO DE BÚSQUEDA. ANTES de "Volver" hay que dejar que el scroll suave
    // de la navegación (scrollIntoView a la ficha) TERMINE: si se clica "Volver" con ese scroll aún
    // EN VUELO, el `window.scrollTo` de goBack compite con el scrollIntoView en curso y el resultado
    // es no determinista. settleScroll espera a que el scroll deje de moverse. Tras asentar: "Volver"
    // está visible (la pila tiene una posición → canGoBack), restaura el scroll al ORIGEN guardado y
    // vacía la pila → `.show` desaparece. force:true porque el #back-btn es chrome fijo
    // (actionability), pero `goBack` corre.
    await expect(page.locator('#back-btn')).toHaveClass(/\bshow\b/)
    await settleScroll(page)
    await page.click('#back-btn', { force: true })
    await expect.poll(
      () => page.evaluate(() => window.scrollY),
      { message: 'el scroll debe volver al ORIGEN guardado en la pila tras "Volver" (entrada por resultado de búsqueda)' },
    ).toBe(originY)
    await expect(page.locator('#back-btn')).not.toHaveClass(/\bshow\b/)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('FEAT-09 botón de ruta (viernes): visible, etiqueta "(6 paradas)" y href de Google Maps a pie', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page)
    await gotoHydrated(page)

    // El día "viernes" (#viernes) tiene 6 fichas de monumento en `day.cards` (todas resuelven en
    // monById) → points.length === 6 ≥ 2 → el botón `.day-route-btn` se monta (prerenderizado en
    // SSG, no client-only). Vive dentro de la banda `.day-stats` de #viernes.
    const routeBtn = page.locator('#viernes .day-route-btn')
    await expect(routeBtn).toHaveCount(1)
    await expect(routeBtn).toBeVisible()

    // Etiqueta: formato genérico "Ver ruta del día (N paradas)" y, para viernes en concreto,
    // exactamente "(6 paradas)" (6/8/7/10/7 por día; viernes = 6).
    await expect(routeBtn).toHaveText(/Ver ruta del día \(\d+ paradas\)/)
    await expect(routeBtn).toContainText('(6 paradas)')

    // href: prefijo FIJO de Google Maps direcciones a pie (T-06-10 — aseverado por ESTRUCTURA,
    // NUNCA se hace fetch del enlace). buildDirUrl arma este prefijo verbatim.
    const href = await routeBtn.getAttribute('href')
    expect(href, 'el botón de ruta debe tener href').toBeTruthy()
    expect(href!).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&travelmode=walking/)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })
})
