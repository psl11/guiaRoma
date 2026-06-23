import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * MAPA + FALLBACK DE IMAGEN + NOTAS sobre el «/» CONSTRUIDO — la verificación Nyquist Wave-0 de
 * FEAT-02 / UI-05 / FEAT-04 (SC#1–SC#7 de 07-UI-SPEC) en un navegador REAL. Los unit specs del
 * Plan 01 cubren la lógica PURA (deriveMarkers/isOffline/motifSvg browserless); este spec prueba
 * lo que SOLO observa un navegador: la isla `.client.vue` hidrata, los marcadores aparecen, los
 * popups navegan vía el listener de CAPTURA de F5 (hash SIN cambiar), el banner offline enciende
 * con la heurística exacta al abortar los tiles, las imágenes hero/detalle caen al SVG de motivo
 * al abortarlas (A5), y las notas persisten bajo `roma-note-<slug>`.
 *
 * AUTOCONTENIDO (4º clon EXACTO del harness de modes/navigation/search-route.spec): NO usa el
 * webServer de playwright.config.ts (que sirve el index.html VIVO del golden). `pnpm generate` una
 * vez, `.output/public/*` → subcarpeta `guiaRoma/`, static server propio bajo /guiaRoma/. La build
 * estática hidrata y el mapa/fallback/notas funcionan en cliente (es lo que prueba la paridad real
 * del SSG). Puerto base 5760 (modes=5700, navigation=5720, search-route=5740 → 5760 libre).
 *
 * Técnicas de abort (precedente A5, golden.spec.ts:91-92): los tiles se abortan por glob de URL
 * del host `tile.openstreetmap.org` (ver context.route en SC#4); las imágenes hero/detalle se
 * abortan por `resourceType === 'image'` (continúa todo lo NO-imagen para no colgar la página) en
 * SC#5/SC#6. Cada test que aborta vive en su PROPIO `browser.newContext()` para no contaminar la
 * cuenta de marcadores de SC#1 ni el resto. Las aserciones de marcadores keyan en COUNT, no orden.
 *
 * NO modifica golden.spec.ts ni rebaselina (D-08). Tolera SOLO el error de hidratación de
 * @nuxtjs/color-mode (D-07) y falla ante cualquier otro error de consola (puerta T-07-07: una
 * regresión que introdujera un mismatch de hidratación o un error de runtime en mapa/fallback/notas
 * encendería la suite).
 */

const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i
// Cuando un test ABORTA peticiones a propósito (tiles en SC#4, imágenes en SC#5/SC#6 vía
// route.abort(), precedente A5), el navegador emite un error de consola `Failed to load resource:
// net::ERR_FAILED` por CADA petición abortada. Ese error es la SEÑAL DELIBERADA del abort (es lo
// que dispara el banner offline y el fallback SVG), no un error de runtime: se tolera SOLO en esos
// tests, además del mensaje de hidratación de color-mode. Los tests que NO abortan NO lo toleran.
const ABORTED_REQUEST_MSG = /Failed to load resource: net::ERR_FAILED/i
const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

// Banner offline: texto VERBATIM (index.html:2368, UI-SPEC §1c) — sin punto final.
const OFFLINE_BANNER_TEXT = 'Sin conexión · solo marcadores visibles'
// Texto de los popups guiados (Coliseo ★ + vaticano ★), VERBATIM (UI-SPEC §1f).
const GUIDED_POPUP_TEXT = 'Visita con guía humano'
// FICHA-tipo card canónica: galleria-sciarra (roman `I`, ÚNICO entre los 38 monumentos por
// `^roman: I$`), con hero + `:detail-photo` — la misma ficha que usan SC#5/SC#6/SC#7. Su marcador
// es el ÚNICO `.custom-marker` cuyo texto es EXACTAMENTE `I`.
const CARD_SLUG = 'galleria-sciarra'
const CARD_ROMAN = /^I$/
// 2ª ficha card para el round-trip de notas (escribir en un textarea fresco).
const NOTES_SLUG_2 = 'pantheon'

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
type PWContext = import('@playwright/test').BrowserContext

// Espera a que el scroll deje de moverse (dos lecturas consecutivas iguales): el scroll suave del
// navegador (scrollIntoView de navigateToCard / scrollTo de goBack) tarda varios frames en asentarse.
// Clon del helper homónimo de navigation.spec.ts:93-101 — necesario para el back-half de la pila
// (SC#2): si se clica "Volver" MIENTRAS el scroll suave de la navegación popup→ficha sigue en vuelo,
// el `scrollTo` de goBack compite con ese scrollIntoView en curso y el resultado es no determinista.
async function settleScroll(page: PWPage): Promise<void> {
  let prev = -1
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => window.scrollY)
    if (y === prev) return
    prev = y
    await page.waitForTimeout(80)
  }
}

// -- Puerta de errores de consola: tolera SOLO el mensaje de hidratación de color-mode; cualquier
//    otro error (mismatch de hidratación nuevo, fallo de runtime de la isla/fallback/notas) se
//    acumula y rompe el test (T-07-07). En los tests que ABORTAN peticiones a propósito se pasa
//    `tolerateAborts=true` para tolerar ADEMÁS el `net::ERR_FAILED` de cada abort deliberado. --
function trackConsoleErrors(page: PWPage, tolerateAborts = false): string[] {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (EXPECTED_HYDRATION_MSG.test(text)) return
    if (tolerateAborts && ABORTED_REQUEST_MSG.test(text)) return
    consoleErrors.push(text)
  })
  return consoleErrors
}

test.describe('mapa + fallback de imagen + notas en /guiaRoma/ construido (SC#1–SC#7)', () => {
  const STATIC_PORT = 5760 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_ORIGIN = `http://localhost:${STATIC_PORT}`
  const STATIC_URL = `${STATIC_ORIGIN}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000)
    ensureBuild()

    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-mapfb-'))
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

  // -- Helper: navega + espera la hidratación. La isla del mapa (import('leaflet') en onMounted),
  //    el fallback de imagen (@error) y las notas (onMounted) sólo viven tras hidratar. Señal de
  //    hidratación conocida (misma que modes/search-route.spec): el 1er pace-btn queda `.active`
  //    por el estado prerenderizado optimista — cuando responde el @click, la app está hidratada. --
  async function gotoHydrated(page: PWPage) {
    await page.goto(STATIC_URL)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.pace-btn[data-pace="optimistic"]')).toHaveClass(/\bactive\b/)
  }

  // -- Helper: espera a que la ISLA del mapa monte en cliente (la `.leaflet-container` la crea
  //    Leaflet en onMounted; el SSG sólo trae el `#leaflet-map` vacío). Los marcadores aparecen
  //    con ella. --
  async function gotoMapMounted(page: PWPage) {
    await gotoHydrated(page)
    await expect(page.locator('.leaflet-container')).toBeVisible()
  }

  test('SC#1: mapa client-only — generate limpio, #fallback vacío en SSG, 39 marcadores + ★ tras hidratar', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page)

    // `ensureBuild` (beforeAll) ya probó que `pnpm generate` salió 0 y existe index.html. El HTML
    // PRERENDERIZADO trae `<div id="leaflet-map">` VACÍO (la caja fallback de D-02) y CERO
    // `.leaflet-container`/`custom-marker` (la isla es genuinamente client-only).
    const html = readFileSync(join(OUTPUT_DIR, 'index.html'), 'utf8')
    expect(html, 'el SSG debe contener la caja #leaflet-map (fallback D-02)').toContain('<div id="leaflet-map"')
    expect(html, 'el SSG NO debe traer la .leaflet-container (la crea Leaflet en cliente)').not.toContain('leaflet-container')
    expect(html, 'el SSG NO debe traer marcadores (se montan en cliente)').not.toContain('custom-marker')

    await gotoMapMounted(page)

    // Tras hidratar: la `.leaflet-container` existe (asegurado por gotoMapMounted) y hay
    // EXACTAMENTE 39 marcadores (38 monumentos + Coliseo ★, D-01). Cuenta, no orden.
    await expect(page.locator('.custom-marker')).toHaveCount(39)

    // Al menos un marcador contiene `★`; en concreto hay 2 (vaticano + Coliseo, ambos guiados).
    const starMarkers = page.locator('.custom-marker').filter({ hasText: '★' })
    await expect.poll(() => starMarkers.count(), { message: 'debe haber ≥1 marcador con ★' }).toBeGreaterThanOrEqual(1)
    await expect(starMarkers, 'exactamente 2 marcadores ★: vaticano + Coliseo').toHaveCount(2)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('SC#2: el popup de una ficha navega (scroll + .highlight) SIN cambiar el hash, y "Volver" restaura el scroll (listener F5 + pila)', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page)
    await gotoMapMounted(page)

    // ORIGEN del scroll, capturado ANTES de la navegación popup→ficha. El mapa (#mapa) está cerca
    // del top y gotoMapMounted deja la página asentada, así que `originY` es estable. Se asienta el
    // scroll primero (settleScroll) para fijar un origen FIRME: la pila guardará EXACTAMENTE este
    // `originY` y "Volver" debe restaurarlo (mirror navigation.spec.ts:216-217 — captura tras settle).
    await settleScroll(page)
    const originY = await page.evaluate(() => window.scrollY)

    // Abrir el popup del marcador card canónico (galleria-sciarra = roman `I`, ÚNICO con ese texto
    // exacto; `/^I$/` exige texto EXACTO, no substring, así no casa con II/VII/XI…). Se usa
    // `dispatchEvent('click')` (NO `.click()`, ni siquiera `force`): los marcadores de Leaflet se
    // SOLAPAN físicamente en el encuadre de Roma, y un click por COORDENADAS (incluso forzado) lo
    // captura el marcador que esté ENCIMA en ese píxel (abriría, p. ej., el popup de VII). El click
    // SINTÉTICO se despacha al ELEMENTO resuelto y dispara el handler de popup de Leaflet de ESE
    // marcador (Leaflet liga la apertura del popup a un listener 'click' del DOM del icono), sin
    // hit-testing de píxel → abre el popup CORRECTO. dispatchEvent ADEMÁS evita que Playwright
    // auto-desplace la fuente, así el `window.scrollY` que el controller mete en la pila sigue siendo
    // `originY` (no uno alterado por traer el marcador al viewport).
    const cardMarker = page.locator('.custom-marker').filter({ hasText: CARD_ROMAN })
    await expect(cardMarker, 'galleria-sciarra es el único marcador con texto exacto "I"').toHaveCount(1)
    await cardMarker.dispatchEvent('click')

    // El popup card trae `<a href="#slug">Abrir ficha →`. Se LEE el slug del propio href (no se
    // asume el valor a ciegas), igual que search-route.spec lee `data-card`.
    const popupLink = page.locator('.leaflet-popup-content a[href^="#"]', { hasText: 'Abrir ficha →' }).first()
    await expect(popupLink).toBeVisible()
    const href = await popupLink.getAttribute('href')
    expect(href, 'el popup card debe traer un ancla #slug').toBeTruthy()
    const slug = href!.slice(1)
    expect(slug, 'el marcador "I" abre el popup de galleria-sciarra').toBe(CARD_SLUG)

    // `dispatchEvent('click')` (NO `.click()`): el click sintético burbujea por document y pasa por
    // el listener de CAPTURA de F5 (misma ruta real de intercepción), PERO Playwright NO
    // auto-desplaza — el navigateToCard hace preventDefault+scrollIntoView+`.highlight` 2500ms.
    await popupLink.dispatchEvent('click')

    // La ficha destino recibe `.highlight` (navegación cableada vía F5) …
    await expect(page.locator(`#${slug}`)).toHaveClass(/\bhighlight\b/)
    // … y el hash de la URL NO pasa a `#slug` (D-03: el listener hace preventDefault). Mirror de
    // navigation.spec.ts:229 / search-route.spec.ts:218.
    expect(new URL(page.url()).hash, 'D-03: navegar desde el popup NO cambia el hash').not.toBe(`#${slug}`)

    // BACK-HALF de la pila (D-05) — mirror EXACTO de navigation.spec.ts:231-242, ahora desde el
    // punto de entrada del POPUP DEL MAPA. ANTES de "Volver" hay que dejar que el scroll suave de la
    // navegación (scrollIntoView a la ficha) TERMINE: si se clica "Volver" con ese scroll aún EN
    // VUELO, el `window.scrollTo` de goBack compite con el scrollIntoView en curso y el resultado es
    // no determinista (visto en móvil: la restauración no converge a originY y `.show` no se limpia
    // de un clic). settleScroll espera a que el scroll deje de moverse (igual que navigation.spec.ts
    // hace ANTES de capturar el origen). Tras asentar: "Volver" está visible (la pila tiene una
    // posición → canGoBack), restaura el scroll al ORIGEN guardado y vacía la pila → `.show`
    // desaparece. force:true porque el #back-btn es chrome fijo (actionability), pero `goBack` corre.
    await expect(page.locator('#back-btn')).toHaveClass(/\bshow\b/)
    await settleScroll(page)
    await page.click('#back-btn', { force: true })
    await expect.poll(
      () => page.evaluate(() => window.scrollY),
      { message: 'el scroll debe volver al ORIGEN guardado en la pila tras "Volver" (entrada por popup del mapa)' },
    ).toBe(originY)
    await expect(page.locator('#back-btn')).not.toHaveClass(/\bshow\b/)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('SC#3: los popups guiados (Coliseo ★ + vaticano ★) son texto-solo, SIN ancla', async ({ page }) => {
    const consoleErrors = trackConsoleErrors(page)
    await gotoMapMounted(page)

    // Los DOS marcadores ★ son ambos guiados: el Coliseo (extra sin ficha) y vaticano (ficha pero
    // popup SIN enlace — el quirk de paridad obligatorio). Se abren AMBOS con `dispatchEvent('click')`
    // (mismo motivo que SC#2: el click sintético dispara el handler del marcador EXACTO sin
    // hit-testing de píxel). El click sintético no pasa por el flujo de click del mapa que cerraría
    // el popup previo, así que pueden quedar los DOS popups abiertos a la vez — se asevera el
    // CONJUNTO de popups abiertos, no uno concreto (cuenta/presencia, no orden).
    const starMarkers = page.locator('.custom-marker').filter({ hasText: '★' })
    await expect(starMarkers, 'exactamente 2 marcadores ★ (Coliseo + vaticano)').toHaveCount(2)

    await starMarkers.nth(0).dispatchEvent('click')
    await starMarkers.nth(1).dispatchEvent('click')

    // Ambos popups guiados acaban abiertos. CADA popup abierto contiene `Visita con guía humano`
    // (cuenta de popups con ese texto == cuenta total de popups abiertos) y NINGÚN popup abierto
    // trae un `<a>` (0 anclas en total → el quirk de vaticano + el Coliseo, honrados juntos).
    const popups = page.locator('.leaflet-popup-content')
    await expect.poll(() => popups.count(), { message: 'ambos popups ★ deben abrirse' }).toBeGreaterThanOrEqual(2)
    const total = await popups.count()
    await expect(
      popups.filter({ hasText: GUIDED_POPUP_TEXT }),
      'todos los popups ★ abiertos son "Visita con guía humano"',
    ).toHaveCount(total)
    await expect(
      page.locator('.leaflet-popup-content a'),
      'ningún popup guiado (Coliseo / vaticano) trae un <a> — el quirk honrado',
    ).toHaveCount(0)
    // Identidad: el conjunto de popups abiertos cubre a vaticano Y al Coliseo (no son dos del mismo).
    await expect(popups.filter({ hasText: 'Vaticano' }), 'el popup de vaticano (★) está abierto y es texto-solo').toHaveCount(1)
    await expect(popups.filter({ hasText: 'Coliseo' }), 'el popup del Coliseo (★) está abierto y es texto-solo').toHaveCount(1)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('SC#4: el banner offline enciende al abortar los tiles (tilesErrored>3 && tilesLoaded===0)', async ({ browser }) => {
    // Contexto PROPIO con los tiles de OSM abortados (glob de URL, precedente A5). Sólo los tiles
    // (imágenes .png de openstreetmap) se abortan; el resto continúa → la isla monta igual y, al
    // acumular >3 tileerror con 0 cargados, isOffline() añade `.show` al banner.
    const context = await browser.newContext()
    await context.route('**/*.tile.openstreetmap.org/**', route => route.abort())
    const page = await context.newPage()
    // tolerateAborts: los tileerror abortados emiten net::ERR_FAILED (la señal que enciende el banner).
    const consoleErrors = trackConsoleErrors(page, true)

    await gotoMapMounted(page)

    // El banner `#map-offline-banner` vive en el `.map-wrapper` ESTÁTICO (prerenderizado, fuera de
    // <ClientOnly>); la isla le añade `.show` desde getElementById al cumplirse la heurística.
    const banner = page.locator('#map-offline-banner')
    await expect(banner).toHaveClass(/\bshow\b/, { timeout: 30_000 })
    await expect(banner).toBeVisible()
    // Texto VERBATIM, sin punto final (UI-SPEC §1c).
    await expect(banner).toHaveText(OFFLINE_BANNER_TEXT)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
    await context.close()
  })

  test('SC#5 + SC#6: hero y detalle caen al SVG de motivo al abortar las imágenes (caption conservada)', async ({ browser }) => {
    // Contexto PROPIO que aborta TODA petición de imagen por resourceType (precedente A5,
    // golden.spec.ts:91-92) — captura cualquier extensión/caja/host; continúa lo NO-imagen para no
    // colgar la página. Esto dispara el `@error` de TODAS las `<img>` (hero, detalle, también los
    // tiles, irrelevantes aquí) → swap al SVG del motivo.
    const context = await browser.newContext()
    await context.route('**/*', route =>
      route.request().resourceType() === 'image' ? route.abort() : route.continue(),
    )
    const page = await context.newPage()
    // tolerateAborts: cada imagen abortada emite net::ERR_FAILED (la señal que dispara el @error→SVG).
    const consoleErrors = trackConsoleErrors(page, true)

    await gotoHydrated(page)

    // Traer la ficha canónica a la vista para forzar la carga (y el @error) de sus imágenes lazy.
    const card = page.locator(`#${CARD_SLUG}`)
    await card.scrollIntoViewIfNeeded()

    // SC#5 — HERO: tras el @error, `.card-hero` contiene un `<svg>` (motifSvg via v-html) y NINGUNA
    // `<img>` (port de loadSvgFallback). El SVG del hero NO lleva estilos inline (.card-hero svg lo
    // cuadra, base.css:719); la caja NO se oculta (motif siempre presente en monumentos).
    const heroSvg = card.locator('.card-hero svg')
    await expect(heroSvg, 'el hero debe mostrar el SVG de motivo tras el @error').toBeVisible()
    await expect(card.locator('.card-hero img'), 'el hero NO debe conservar la <img> tras el fallback').toHaveCount(0)

    // SC#6 — DETALLE: tras el @error, `.detail-photo` contiene un `<svg>` con los CUATRO estilos
    // inline VERBATIM, `.detail-photo-caption` SIGUE presente con texto, y NO hay `<img>` visible
    // (port de loadSvgFallbackDetail). galleria-sciarra tiene exactamente un `:detail-photo`.
    const detail = card.locator('.detail-photo').first()
    await detail.scrollIntoViewIfNeeded()
    const detailSvg = detail.locator('svg')
    await expect(detailSvg, 'el detalle debe mostrar el SVG de motivo tras el @error').toBeVisible()
    // Los CUATRO estilos inline VERBATIM (inyectados en la etiqueta <svg>, DetailPhoto.global.vue:49).
    const styleAttr = (await detailSvg.getAttribute('style')) ?? ''
    expect(styleAttr, 'el SVG de detalle lleva width:100%').toContain('width:100%')
    expect(styleAttr, 'el SVG de detalle lleva height:auto').toContain('height:auto')
    expect(styleAttr, 'el SVG de detalle lleva border-radius:4px').toContain('border-radius:4px')
    expect(styleAttr, 'el SVG de detalle lleva display:block').toContain('display:block')
    // La caption se CONSERVA (no se reemplaza) y tiene texto.
    const caption = detail.locator('.detail-photo-caption')
    await expect(caption, 'la .detail-photo-caption debe seguir presente').toBeVisible()
    await expect(caption).not.toBeEmpty()
    // No queda ninguna `<img>` visible dentro de la .detail-photo.
    await expect(detail.locator('img'), 'el detalle NO debe conservar la <img> visible tras el fallback').toHaveCount(0)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
    await context.close()
  })

  test('SC#7: notas persisten bajo roma-note-<slug> (preset restaurado + round-trip de escritura)', async ({ browser }) => {
    // Contexto PROPIO con un valor preseteado en localStorage ANTES de cargar (addInitScript, mismo
    // patrón que modes.spec:223-239). En onMounted la nota guardada se lee y rellena el textarea.
    const context: PWContext = await browser.newContext()
    await context.addInitScript(() => {
      try {
        window.localStorage.setItem('roma-note-galleria-sciarra', 'probe')
      }
      catch { /* localStorage bloqueado: noop */ }
    })
    const page = await context.newPage()
    const consoleErrors = trackConsoleErrors(page)

    await gotoHydrated(page)

    // El textarea de galleria-sciarra (clave EXACTA roma-note-galleria-sciarra) lee `probe` en
    // onMounted. La consola limpia (sólo el mensaje color-mode) prueba que la lectura en onMounted
    // NO produce warning de hidratación (SSR emite vacío; se rellena un frame después).
    const ta1 = page.locator(`#${CARD_SLUG} .notes-textarea`)
    await expect(ta1).toHaveValue('probe')

    // ROUND-TRIP: escribir en el textarea de OTRA ficha (pantheon), recargar y comprobar que
    // persistió bajo SU clave `roma-note-pantheon` (el guardado @input con debounce ~200ms).
    const ta2 = page.locator(`#${NOTES_SLUG_2} .notes-textarea`)
    await ta2.scrollIntoViewIfNeeded()
    const TYPED = 'nota de prueba round-trip'
    await ta2.fill(TYPED)
    // Esperar a que el debounce (~200ms) escriba en localStorage antes de recargar.
    await expect.poll(
      () => page.evaluate(() => window.localStorage.getItem('roma-note-pantheon')),
      { message: 'la nota tecleada debe guardarse en localStorage bajo roma-note-pantheon' },
    ).toBe(TYPED)

    // Recargar (mismo contexto → localStorage persiste): la nota tecleada se restaura en onMounted.
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.pace-btn[data-pace="optimistic"]')).toHaveClass(/\bactive\b/)
    await expect(page.locator(`#${NOTES_SLUG_2} .notes-textarea`)).toHaveValue(TYPED)

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
    await context.close()
  })
})
