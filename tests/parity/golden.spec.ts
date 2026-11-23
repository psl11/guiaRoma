import { test, expect, type Page } from '@playwright/test'

// === Golden de paridad del index.html ACTUAL (PARITY-01) ===
//
// Captura las 14 vistas de D-04 (home + 5 dias + 3 fichas-tipo + 5 referencias)
// en tema claro y oscuro, sobre los viewports mobile/desktop de playwright.config.ts.
// Es la linea base inmutable contra la que la Fase 8 medira la paridad 100%.
//
// El index.html se sirve in situ (D-05, webServer en playwright.config.ts) y es
// byte-identico a origin/main (verificado), asi que el golden representa la version
// viva (con "ruta del dia" y cenas) ANTES de que exista codigo Nuxt que diverja.

// Vistas EXACTAS (nombre de snapshot -> selector). Verificado en index.html:
//   - Las 38 fichas son <article class="card">; NO existe clase guided/concert.
//     Representantes por id literal: #galleria-sciarra (card simple, L2450),
//     #vaticano (guiada, L2920), #auditorium (concierto ♪, L3381).
const VIEWS = [
  ['inicio', '#inicio'],
  ['dia-viernes', '#viernes'],
  ['dia-sabado', '#sabado'],
  ['dia-domingo', '#domingo'],
  ['dia-lunes', '#lunes'],
  ['dia-martes', '#martes'],
  ['ref-reservas', '#reservas'],
  ['ref-gastronomia', '#gastronomia'],
  ['ref-practica', '#practica'],
  ['ref-arte', '#arte'],
  ['ref-arquitectura', '#arquitectura'],
  ['card-monumento', '#galleria-sciarra'],
  ['card-guided', '#vaticano'],
  ['card-concert', '#auditorium'],
] as const

// settle(): deja la pagina en un estado determinista antes de capturar.
//  1. Desactiva `loading="lazy"` en todas las <img> y espera a que TODAS resuelvan
//     (cargen o, con A5, fallen). Con las peticiones de imagen bloqueadas, esto fuerza
//     que TODOS los onerror -> loadSvgFallback (swap a SVG) ocurran ARRIBA y de una vez,
//     en lugar de progresivamente al hacer scroll. Sin esto, el swap a SVG de las imagenes
//     lazy reflowa la altura de las secciones largas (#martes) entre capturas -> flakiness.
//  2. Espera networkidle y document.fonts.ready (elimina el FOUT de las fuentes de Google).
//  3. Doble requestAnimationFrame para asentar el reflow final tras los swaps a SVG.
// Las animaciones (@keyframes fadeIn de .card, transiciones de tema) las congela
// animations:'disabled' en playwright.config.ts.
async function settle(page: Page) {
  // Forzar carga ansiosa: dispara el fetch (y por tanto el onerror->SVG con A5) de toda <img>.
  await page.evaluate(() => {
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager'
    })
  })
  await page.waitForLoadState('networkidle')
  // Esperar a que cada <img> este "complete" (resuelta: cargada o errorada -> swap SVG hecho).
  await page.evaluate(
    () =>
      Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              }),
        ),
      ),
  )
  await page.evaluate(() => (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready)

  // ── ENDURECIMIENTO A5 (F8 Plan 06, re-captura correctiva) — forzar DETERMINISTAMENTE el
  //    fallback SVG en TODA hero/detail. La captura original de F1 dejó FOTOS REALES coladas en
  //    el baseline (Trevi en dia-viernes, Campo de' Fiori en dia-domingo, etc.): el abort de A5
  //    dispara `onerror` PERO hay una carrera (imagen ya en caché / el evento error llega tras el
  //    primer paint) en la que algunas <img> nunca disparan su `onerror=` inline y la foto queda.
  //    Aquí NO inventamos un SVG: invocamos el PROPIO `onerror` de cada <img> que siga presente
  //    (el handler inline del index.html — `loadSvgFallback(this,'id')` / `loadSvgFallbackDetail`),
  //    de modo que el swap a SVG lo hace el CÓDIGO DEL SITIO VIVO, no el test. Idempotente: una
  //    <img> que ya se sustituyó por su <svg> ya no existe, así que sólo se actúa sobre las que
  //    se colaron. Tras esto NO debe quedar NINGUNA <img> dentro de `.card-hero`/`.detail-photo`.
  await page.evaluate(() => {
    document.querySelectorAll<HTMLImageElement>('.card-hero img, .detail-photo img').forEach((img) => {
      const handler = img.onerror
      if (typeof handler === 'function') {
        handler.call(img, new Event('error'))
      }
    })
  })
  // Garantía de COMPLETITUD del swap: que no quede ninguna <img> en las cajas de imagen (todas
  // convertidas a su <svg> de motivo). Si algo quedara, falla RUIDOSAMENTE aquí en vez de capturar
  // una foto real (el bug de F1). Estado offline-determinista de A5, ahora SIN fugas.
  await page.waitForFunction(
    () => document.querySelectorAll('.card-hero img, .detail-photo img').length === 0,
    undefined,
    { timeout: 30_000 },
  )
  // Asentar el reflow final que provocan los swaps a SVG.
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
}

for (const theme of ['light', 'dark'] as const) {
  test(`golden ${theme}`, async ({ page }) => {
    // Decision A5 (heros remotas) — bloquear TODAS las peticiones de imagen para
    // forzar SIEMPRE el estado de fallback SVG (onerror -> SVG por motif). Es el
    // estado determinista y ademas el "offline" que el proyecto valora (BUILD-02),
    // eliminando la dependencia de red de terceros (Wikimedia/turismoroma) que
    // haria el golden no reproducible. Registrado ANTES de goto.
    //
    // Bloqueo por resourceType === 'image' (no por glob de extension): el glob de
    // extensiones anterior era sensible a mayusculas Y exigia que la URL TERMINARA
    // en la extension, asi que se le escapaban (CR-01/WR-01):
    //   - 4 URLs en MAYUSCULAS '.JPG' (fontana-trevi, valle delle rose, giardino-aranci,
    //     P-Octavia) -> fotos reales filtradas en dia-viernes / dia-domingo;
    //   - 9+ URLs con query string ('...jpg?width=900': vaticano/card-guided,
    //     castel-santangelo, ojo de la cerradura del Aventino, elefantino, Cristo
    //     della Minerva...) -> fotos reales filtradas en varias vistas dia/referencia/ficha.
    // resourceType captura TODA imagen sea cual sea su extension/caja/query string.
    // CRITICO: hay que route.continue() las peticiones NO-imagen (el index.html local,
    // su CSS/JS, fuentes) — abortarlas colgaria la pagina. Esto fuerza el fallback SVG
    // de TODAS las heros: el verdadero estado offline-determinista de A5.
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'image' ? route.abort() : route.continue(),
    )

    // Tema oscuro determinista: el script inline del index.html (linea 6263) lee
    // localStorage['roma-theme'] y pinta dark en el primer paint. Sin clic, sin timing.
    if (theme === 'dark') {
      await page.addInitScript(() => localStorage.setItem('roma-theme', 'dark'))
    }

    await page.goto('/index.html')
    await settle(page)

    // Captura por elemento (mas estable que fullPage; A6) — 1:1 con D-04.
    for (const [name, sel] of VIEWS) {
      const locator = page.locator(sel)
      await locator.scrollIntoViewIfNeeded()
      await expect(locator).toHaveScreenshot(`${name}-${theme}.png`)
    }
  })
}
