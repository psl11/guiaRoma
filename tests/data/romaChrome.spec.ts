import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load } from 'cheerio'
import { parse } from 'yaml'
import { inlineMdToPlain } from '../../app/utils/tripLayout'

/**
 * Chrome de Roma desde datos (Fase 10, SHAPE-03 / SHAPE-04; D-10…D-14).
 *
 * La marca de cabecera, la leyenda del mapa, el pie y el título de la pestaña ya no son literales
 * de la plantilla: viven en `content/trips/roma/trip.yml` (`brand`, `mapLegend`, `footer`,
 * `pageTitle`). Este spec defiende que Roma no cambia para quien ya la usa:
 *
 *  - «verbatim contra index.html» (siempre corre): los cuatro valores del YAML coinciden con el
 *    `index.html` heredado (título línea 8, marca 2259, leyenda 2370, pie 6236-6240), leído en
 *    SOLO LECTURA con cheerio. La leyenda se compara SIN normalizar (el doble espacio tras el
 *    primer ✦ se conserva verbatim en el YAML); el pie, por su texto plano (`inlineMdToPlain`),
 *    el número de `<br>` y los fragmentos enfatizados (`_Pay_` → `<em>Pay</em>`).
 *  - «chrome en el HTML prerenderizado» (solo con build): marca, leyenda y pie están en
 *    `.output/public/trips/roma/index.html` (la URL de Roma desde la Fase 11, D-13), es decir, en el render de servidor y no en una isla
 *    client-only, así que ninguna carrera de hidratación muestra antes un respaldo
 *    (edge SHAPE-03 concurrency); y hay exactamente UN `<title>` con el `pageTitle` de Roma
 *    (edge SHAPE-04 ordering: app.vue ya no fija título y TripView pone el del viaje).
 *    Los comentarios de fragmento de Vue (`<!--[-->`) se quitan antes de comparar. El pie se
 *    extrae con una RegExp sobre el HTML crudo (cheerio re-serializaría las entidades `&quot;`).
 *    Desde la Fase 11 (D-01/D-03) el pie termina con `p.trip-back` («← Todos los viajes»), hijo
 *    directo de `<footer>` tras `.container`, así que `footer .container p` sigue siendo uno solo.
 *
 * Corre dentro de `pnpm verify` porque `generate` va antes de `test:data`. Sin build (un
 * `vitest run tests/data` suelto: no hay `.output/public/index.html`) el bloque post-build se
 * SALTA en vez de fallar en falso; con build, si falta la página de Roma el bloque FALLA al
 * leerla en vez de saltarse (D-17).
 * Node puro: sin runtime Nuxt.
 */

const ROOT = process.cwd()
const LEGACY = load(readFileSync(join(ROOT, 'index.html'), 'utf8'))
const TRIP = parse(readFileSync(join(ROOT, 'content', 'trips', 'roma', 'trip.yml'), 'utf8')) as {
  pageTitle: string
  brand: { before: string, after: string }
  mapLegend: string
  footer: string[]
}
const BUILT = join(ROOT, '.output', 'public', 'trips', 'roma', 'index.html')
const BUILD_INDEX = join(ROOT, '.output', 'public', 'index.html')

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
const stripHtmlComments = (s: string) => s.replace(/<!--[\s\S]*?-->/g, '')
/** Fragmentos enfatizados `_x_` / `*x*` de una línea Markdown-inline. */
const emphasized = (md: string) => [...md.matchAll(/(\*|_)(.+?)\1/g)].map(m => m[2])

describe('chrome de Roma: verbatim contra index.html (SHAPE-03/SHAPE-04)', () => {
  it('pageTitle === <title> de index.html (D-13)', () => {
    expect(TRIP.pageTitle).toBe(LEGACY('title').text())
  })

  it('brand.before ✦ brand.after === .brand de index.html (D-11)', () => {
    expect(`${TRIP.brand.before} ✦ ${TRIP.brand.after}`).toBe(norm(LEGACY('.brand').text()))
    expect(LEGACY('.brand .brand-dot').text()).toBe('✦')
  })

  it('mapLegend === .map-legend de index.html, verbatim (dobles espacios incluidos)', () => {
    expect(TRIP.mapLegend).toBe(LEGACY('.map-legend').text())
  })

  it('footer: líneas − 1 <br>, mismo texto plano y mismos <em> que index.html (D-12)', () => {
    const p = LEGACY('footer p')
    expect(p.find('br').length).toBe(TRIP.footer.length - 1)
    expect(p.text()).toBe(TRIP.footer.map(inlineMdToPlain).join(''))
    expect(p.find('em').map((_, el) => LEGACY(el).text()).get()).toEqual(TRIP.footer.flatMap(emphasized))
    expect(TRIP.footer.flatMap(emphasized)).toEqual(['Pay'])
  })
})

describe.skipIf(!existsSync(BUILD_INDEX))('chrome de Roma en el HTML prerenderizado (edges SHAPE-03 concurrency / SHAPE-04 ordering)', () => {
  const html = () => stripHtmlComments(readFileSync(BUILT, 'utf8'))

  it('exactamente un <title> y es el pageTitle de Roma', () => {
    const titles = html().match(/<title>[^<]*<\/title>/g) ?? []
    expect(titles).toEqual([`<title>${TRIP.pageTitle}</title>`])
  })

  it('.brand prerenderizada = before + <span class="brand-dot">✦</span> + after', () => {
    const $ = load(html())
    expect($('.brand')).toHaveLength(1)
    expect(norm($('.brand').html() ?? '')).toBe(`${TRIP.brand.before} <span class="brand-dot">✦</span> ${TRIP.brand.after}`)
  })

  it('p.map-legend prerenderizada lleva la leyenda de Roma', () => {
    const $ = load(html())
    expect($('p.map-legend')).toHaveLength(1)
    expect(norm($('p.map-legend').text())).toBe(norm(TRIP.mapLegend))
  })

  it('el pie prerenderizado es el de siempre (mismo HTML que la build anterior)', () => {
    const m = html().match(/<footer><div class="container"><p>([\s\S]*?)<\/p><\/div>/)
    expect(m, 'no hay <footer><div class="container"><p>… en la build').not.toBeNull()
    expect(m![1]).toBe('Itinerario preparado para <em>Pay</em> y dos colegas<br>Roma · 19—23 giugno 2026<br>&quot;Roma no se cuenta, se camina.&quot;')
  })

  it('el pie termina con el enlace de vuelta a la portada (D-01/D-03)', () => {
    const page = html()
    expect(page).toContain('<p class="trip-back"><a href="/guiaRoma/">← Todos los viajes</a></p></footer>')
    expect(load(page)('footer .container p')).toHaveLength(1)
  })
})
