import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * NAVEGACIÓN TRANSVERSAL (FEAT-05) sobre el «/» CONSTRUIDO — SC#1/SC#2/SC#3 en un navegador REAL.
 *
 * AUTOCONTENIDO (mirror EXACTO de tests/parity/modes.spec.ts): NO usa el webServer de
 * playwright.config.ts (que sirve el index.html VIVO del golden). `pnpm generate` una vez,
 * `.output/public/*` → subcarpeta `guiaRoma/`, static server propio bajo /guiaRoma/. La build
 * estática hidrata y la navegación funciona en cliente (es lo que prueba la paridad real del SSG).
 *
 * Prueba las tres conductas de FEAT-05 que jsdom NO puede validar (scroll suave, `.highlight`,
 * `.nav-pill.active` reactiva, `.back-btn.show`, interceptar-ficha-vs-salto-nativo):
 *   · SC#1 navigateToCard + back-stack: click en una FICHA → `.card.highlight` ~2500ms + el scroll
 *     se MUEVE (no salto instantáneo); "Volver" restaura el scroll y `.back-btn` pierde `.show`.
 *   · SC#2 scrollspy: el punto de conmutación de `.nav-pill.active` es `scrollY+130` (NO el
 *     offsetTop de la sección, que es lo que marcaría un IntersectionObserver).
 *   · SC#3 interceptación selectiva: una FICHA se intercepta (hash SIN cambiar); una pastilla de
 *     SECCIÓN (#reservas) salta NATIVAMENTE (el hash pasa a #reservas, sin `.highlight`).
 *
 * FIXTURE DE FICHA (decisión empírica, no la del sketch del plan): en los datos migrados de F2 los
 * enlaces de prosa dentro de `.card-section` apuntan a fichas de ARTISTA (`#art-*`/`#arq-*`), que NO
 * están en `monById` (sólo monumentos) → no se interceptan. El enlace de ficha REALMENTE
 * interceptable es el `a.tl-title` del timeline que apunta a un slug de MONUMENTO (p. ej.
 * `#doria-pamphilj`), presente en `monById`. Es uno de los dos fixtures de ficha que el plan
 * declara («Timeline ficha link: <a :href="'#'+row.ref" class="tl-title">»). Se usa ese.
 *
 * PITFALL 1 (A1) — RESUELTO EMPÍRICAMENTE POR ESTE SPEC: con el listener delegado en fase de
 * BURBUJA (default de 05-02) la navegación NO se interceptaba (el salto nativo del ancla ganaba: el
 * hash cambiaba a #slug, sin `.highlight`, sin scroll suave). La causa raíz: el controller era
 * `async` y registraba `onMounted` DESPUÉS de un `await`, así que los listeners NUNCA se adjuntaban
 * (hook de ciclo de vida tras await pierde la instancia activa en Vue). El fix (commit del Plan
 * 05-03) registra los hooks SÍNCRONAMENTE y usa fase de CAPTURA + `stopPropagation()` para ganarle
 * al ancla nativo. Este spec es el decididor: pasa SOLO con el controller arreglado.
 *
 * NO modifica golden.spec.ts ni rebaselina (D-08). Tolera SOLO el error de hidratación de
 * @nuxtjs/color-mode y falla ante cualquier otro error de consola.
 */

const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i
const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

// FICHA interceptable: un enlace de timeline a un slug de MONUMENTO (está en monById). El destino
// `#doria-pamphilj` es una `<article class="card" id="doria-pamphilj">` real (#sabado).
const FICHA_HREF = '#doria-pamphilj'
const FICHA_ID = 'doria-pamphilj'

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

// Espera a que el scroll deje de moverse (dos lecturas iguales): el smooth scroll del navegador
// tarda varios frames en asentarse.
async function settleScroll(page: PWPage): Promise<void> {
  let prev = -1
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => window.scrollY)
    if (y === prev) return
    prev = y
    await page.waitForTimeout(80)
  }
}

// Fuerza la carga de TODAS las imágenes lazy recorriendo la página de arriba a abajo (en pasos de
// una ventana) y vuelve al top. Tras esto la altura del documento (y los `offsetTop`) son estables,
// eliminando el clamp de scroll por reflow al saltar a una sección lejana.
async function loadAllLazy(page: PWPage): Promise<void> {
  const step = await page.evaluate(() => window.innerHeight)
  const max = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < max; y += step) {
    await page.evaluate(yy => window.scrollTo(0, yy), y)
    await page.waitForTimeout(60)
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(150)
  await page.evaluate(() => window.scrollTo(0, 0))
  await settleScroll(page)
}

// Lee `offsetTop` de una sección y confirma que es ESTABLE (dos lecturas consecutivas iguales).
async function stableOffsetTop(page: PWPage, id: string): Promise<number> {
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

test.describe('navegación transversal en /guiaRoma/ construido (FEAT-05: SC#1/SC#2/SC#3)', () => {
  // Base 5720 (distinta de modes.spec=5700, timeline=5500, etc.) para no colisionar.
  const STATIC_PORT = 5720 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_ORIGIN = `http://localhost:${STATIC_PORT}`
  const STATIC_URL = `${STATIC_ORIGIN}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-nav-'))
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

  // -- Helper: navega + espera la hidratación. Los listeners de FEAT-05 (click delegado + scroll)
  //    se registran en onMounted del controller; hasta que la app hidrata no responden. Se espera
  //    a un estado hidratado conocido: el shell #back-btn presente y, al hacer scroll, una pastilla
  //    `.active` calculada por updateActivePill() (la prueba de que el scroll-listener vive). --
  async function gotoHydrated(page: import('@playwright/test').Page) {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')
    // El shell de BackButton existe (prerenderizado, sin `.show`).
    await expect(page.locator('#back-btn')).toHaveCount(1)
    await expect(page.locator('#back-btn')).not.toHaveClass(/\bshow\b/)
    // Señal de hidratación del scrollspy: al desplazarse a una sección, una pastilla se marca
    // `.active` (updateActivePill corre en onMounted + en cada scroll). Si el listener NO estuviera
    // registrado (bug de onMounted-tras-await), NINGUNA pastilla se marcaría jamás.
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(page.locator('.nav-pill.active')).toHaveCount(1)
  }

  // -- Helper de navegación a ficha (el `navigateToCard` del controller, vía el listener delegado):
  //    dispara el click en el enlace de ficha y espera a que el destino reciba `.highlight`
  //    (interceptado). Se usa `dispatchEvent('click')` en vez de `.click()` DELIBERADAMENTE: el click
  //    sintético burbujea por `document` y pasa por el listener de CAPTURA bajo prueba (misma ruta
  //    real de interceptación), PERO Playwright NO auto-desplaza el elemento a la vista — así el
  //    `window.scrollY` que el controller mete en la pila es el ORIGEN que el test fijó, no uno que
  //    Playwright haya cambiado al traer el enlace al viewport (clave para la restauración de SC#1). --
  async function navigateToCard(page: import('@playwright/test').Page, href: string, id: string) {
    await page.locator(`a.tl-title[href="${href}"]`).first().dispatchEvent('click')
    await expect(page.locator(`#${id}`)).toHaveClass(/\bhighlight\b/)
  }

  test('SC#1: navegar a una ficha resalta + mueve scroll; "Volver" restaura y oculta .back-btn', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })

    await gotoHydrated(page)

    // El enlace de ficha vive en #sabado (lejos del top). Lo traemos a la vista NOSOTROS y dejamos
    // asentar el layout (las imágenes lazy reflejan la altura del documento) para fijar un ORIGEN
    // estable. `navigateToCard` dispara el click con `dispatchEvent` (no `.click()`), así que
    // Playwright NO auto-desplaza el enlace y el `window.scrollY` que el controller mete en la pila es
    // EXACTAMENTE este `originY` → "Volver" debe restaurarlo al píxel.
    const fichaLink = page.locator(`a.tl-title[href="${FICHA_HREF}"]`).first()
    await fichaLink.scrollIntoViewIfNeeded()
    await page.waitForLoadState('networkidle')
    await settleScroll(page)
    const originY = await page.evaluate(() => window.scrollY)

    // Navegar a la ficha (timeline → monumento). El listener delegado intercepta:
    // preventDefault (la URL no cambia) + stopPropagation + scrollIntoView suave + `.highlight` 2500ms.
    await navigateToCard(page, FICHA_HREF, FICHA_ID)

    // El destino tiene `.highlight` (lo asegura navigateToCard) y el scroll se MOVIÓ del origen
    // (scroll suave real, no un no-op). El hash NO cambió (D-03: preventDefault).
    await expect.poll(
      () => page.evaluate(() => window.scrollY),
      { message: 'el scroll debe haberse movido del origen tras navegar a la ficha' },
    ).not.toBe(originY)
    expect(new URL(page.url()).hash, 'D-03: navegar a una ficha NO cambia el hash de la URL').not.toBe(FICHA_HREF)

    // "Volver" aparece (la pila tiene una posición → canGoBack). `.back-btn.show` visible.
    await expect(page.locator('#back-btn')).toHaveClass(/\bshow\b/)

    // Click en "Volver" → restaura la posición de scroll ANTERIOR (la que la pila guardó = originY) y
    // la pila se vacía → `.show` desaparece. force:true porque durante el scroll suave un <p> puede
    // solaparse con el botón fijo (actionability), pero el `@click="goBack"` se dispara igual.
    await page.click('#back-btn', { force: true })
    await expect.poll(
      () => page.evaluate(() => window.scrollY),
      { message: 'el scroll debe volver al ORIGEN guardado en la pila tras "Volver"' },
    ).toBe(originY)
    await expect(page.locator('#back-btn')).not.toHaveClass(/\bshow\b/)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('SC#2: el scrollspy conmuta la pastilla en scrollY+130 (no en el offsetTop / IntersectionObserver)', async ({ page }) => {
    await gotoHydrated(page)

    // Las imágenes lazy hacen crecer/encoger el documento al desplazarse: si se calcula `offsetTop`
    // a scrollY=0 y luego se salta lejos, el destino real difiere (el doc aún no había crecido).
    // Se fuerza la carga COMPLETA (recorrer la página hasta el fondo) y se deja asentar el layout;
    // a partir de ahí los `offsetTop` son ESTABLES y el punto de conmutación es exacto.
    await loadAllLazy(page)

    // Sección de DÍA bien separada de la anterior. Offset leído EN VIVO (no hardcodeado) tras
    // estabilizar el layout, y reconfirmado estable.
    const targetOffset = await stableOffsetTop(page, 'sabado')
    expect(targetOffset, 'la sección #sabado debe existir y tener offset estable').toBeGreaterThan(0)

    // El punto de conmutación del scrollspy es `scrollY + 130` (port de index.html:6489, LOAD-BEARING:
    // 130, NO 124 — supera el `scroll-padding-top:124px`). Constante explícita para asentar el contrato.
    const SWITCH_OFFSET = 130

    // Predicado ATÓMICO: en CADA iteración del poll re-desplaza a la posición pedida (relativa al
    // offset VIVO de #sabado) y lee la pastilla activa. Re-desplazar cada vez neutraliza cualquier
    // empujón residual del layout entre el scroll y la lectura. `delta` se suma a `offsetTop - 130`:
    // delta>0 ⇒ pasado el punto +130, delta<0 ⇒ antes. (El cálculo `scrollY + 130 >= offsetTop` del
    // algoritmo equivale a desplazar a `offsetTop - 130 + delta` y observar el signo de `delta`.)
    const activeAtDelta = (delta: number) => page.evaluate(({ d, sw }) => {
      const off = (document.getElementById('sabado') as HTMLElement).offsetTop
      window.scrollTo(0, off - sw + d) // off - 130 + d
      return new Promise<string | null>((resolve) => {
        // dos rAF: deja que el scroll-listener (passive) corra y actualice la pastilla.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          resolve(document.querySelector('.nav-pill.active')?.getAttribute('href') ?? null)
        }))
      })
    }, { d: delta, sw: SWITCH_OFFSET })

    // MARGEN de 20px (holgado pero MUY dentro de la ventana de 130): inmune al jitter de reflow y, a
    // la vez, inequívoco respecto al offsetTop (que está 130 px por encima del punto de conmutación).
    const MARGIN = 20

    // JUSTO ANTES del punto +130 (delta = -MARGIN): `scrollY + 130 = offsetTop - 20 < offsetTop` → #viernes.
    await expect.poll(() => activeAtDelta(-MARGIN), { message: 'justo antes del +130 debe seguir activa #viernes' }).toBe('#viernes')

    // JUSTO DESPUÉS del punto +130 (delta = +MARGIN): `scrollY + 130 = offsetTop + 20 >= offsetTop` → #sabado.
    // PRUEBA de que el punto es +130 y NO el offsetTop: aquí scrollY = offsetTop - 110, es decir el
    // TOP de #sabado está aún 110 px por DEBAJO del scroll. Un esquema basado en offsetTop (lo que
    // keya un IntersectionObserver al entrar el elemento) seguiría marcando #viernes; como YA está
    // #sabado, la conmutación ocurrió ~130px ANTES del top → es el scrollY+130, no el offsetTop.
    await expect.poll(() => activeAtDelta(+MARGIN), { message: 'justo después del +130 debe activarse #sabado' }).toBe('#sabado')

    // El switch ocurre con el TOP de #sabado aún por DEBAJO del scroll (scrollY + 130 = offsetTop + 20,
    // luego scrollY = offsetTop - 110 < offsetTop): sella que es el +130 y no el offsetTop.
    expect(MARGIN, 'el margen de prueba (20) está MUY dentro de la ventana de 130, lejos del offsetTop').toBeLessThan(SWITCH_OFFSET)

    // Exactamente UNA pastilla activa (las demás no), en el estado post-conmutación.
    await expect(page.locator('.nav-pill.active')).toHaveCount(1)
    await expect(page.locator(`.nav-pill[href="#sabado"]`)).toHaveClass(/\bactive\b/)
    await expect(page.locator(`.nav-pill[href="#viernes"]`)).not.toHaveClass(/\bactive\b/)
  })

  test('SC#3: sólo las fichas se interceptan; las pastillas de sección saltan nativamente (#reservas)', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })

    await gotoHydrated(page)
    await page.evaluate(() => window.scrollTo(0, 0))

    // FICHA (timeline → monumento): INTERCEPTADA. `.highlight` presente Y el hash NO cambió a #slug
    // (D-03: el listener hace preventDefault → la navegación a ficha no toca la URL).
    await navigateToCard(page, FICHA_HREF, FICHA_ID)
    await expect(page.locator(`#${FICHA_ID}`)).toHaveClass(/\bhighlight\b/)
    expect(new URL(page.url()).hash, 'D-03: la ficha interceptada NO cambia el hash a #slug').not.toBe(FICHA_HREF)

    // Limpiar el "Volver" generado por la navegación anterior.
    await page.locator('#back-btn').dispatchEvent('click')

    // SECCIÓN (pastilla #reservas): NO interceptada → salto de ancla NATIVO (D-02). El hash pasa a
    // #reservas y la `<section id="reservas">` NO recibe `.highlight` (las secciones no son fichas:
    // sólo `monById` se intercepta; #reservas no está en monById).
    await page.locator('a.nav-pill[href="#reservas"]').dispatchEvent('click')
    await expect.poll(() => new URL(page.url()).hash, { message: '#reservas salta nativamente → el hash cambia' }).toBe('#reservas')
    await expect(page.locator('#reservas')).not.toHaveClass(/\bhighlight\b/)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })
})
