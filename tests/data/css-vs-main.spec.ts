import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * EL CSS QUE PUBLICA LA BUILD ES EL CSS DE `main` (Fase 14, D-02; criterio «base.css sin diff
 * respecto a main» de la SC1).
 *
 * `main` (la guía viva) no tiene `base.css`: es un único `index.html` con dos bloques `<style>`.
 * El criterio significa, por tanto, «el CSS global que publica la build de Nuxt es el CSS de
 * `main:index.html`». Las particiones documentadas son:
 *  · `app/assets/css/leaflet.css` = el bloque `<style id="leaflet-inline-css">` de main (Leaflet
 *    inline, para no depender de CDN).
 *  · `tokens.css` + `base.css` = el bloque `<style>` editorial de main (v1.0 lo partió en tokens
 *    y resto, en ese orden).
 *  · `fonts.css` sustituye al `<link>` de Google Fonts de main por @font-face self-hosted
 *    (generado por scripts/vendor-fonts.mjs desde la MISMA URL css2): mismas tres familias.
 *  · `multitrip.css` (portada, 11-05) y `tripshapes.css` (Fase 12) son hojas ADITIVAS de la v1.1,
 *    que no existen en main; las guardan tests/unit/multitripCss.spec.ts y
 *    tests/unit/tripShapesCss.spec.ts. No entran en esta comparación.
 *
 * La ÚNICA diferencia de contenido permitida es la neutralización de 08-06 (commit cc74f79,
 * decisión humana «Match the golden»): en main dos reglas van detrás de un `}` sobrante y el
 * navegador las descarta (`.tl-meta-item{…}` y `.tl-transport-mode.recommended{…}`), así que
 * base.css las deja fuera. Cada una debe casar EXACTAMENTE una vez.
 *
 * Normalización: SOLO comentarios y espacios (se quitan los comentarios, cada racha de espacios
 * pasa a uno, se quitan los espacios alrededor de `{`, `}` y `;`, y se recorta). Nada más.
 *
 * Una diferencia fuera de esta lista es un HALLAZGO: se informa (el mensaje de fallo da el primer
 * desfase con contexto de ambos lados), nunca se edita el CSS congelado.
 *
 * Node puro: lee main con `git show` (requiere la rama local `main`) y los CSS desde process.cwd().
 */

const CSS_DIR = join(process.cwd(), 'app', 'assets', 'css')
const readCss = (name: string): string => readFileSync(join(CSS_DIR, name), 'utf8')

function readMainHtml(): string {
  try {
    return execFileSync('git', ['show', 'main:index.html'], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  }
  catch (err) {
    throw new Error(
      `«git show main:index.html» falló: este spec necesita la rama local \`main\` (la guía viva). ${String(err)}`,
      { cause: err },
    )
  }
}

interface StyleBlock {
  attrs: string
  css: string
}

/** Todos los bloques `<style …>…</style>` del HTML, con su cadena de atributos. */
function styleBlocks(html: string): StyleBlock[] {
  return [...html.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].map(m => ({ attrs: (m[1] ?? '').trim(), css: m[2] ?? '' }))
}

/** Normaliza SOLO comentarios y espacios. */
function normalizeCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};])\s*/g, '$1')
    .trim()
}

/**
 * Las dos reglas que en main quedan detrás de un `}` sobrante (el navegador las descarta) y que
 * base.css deja fuera (08-06, commit cc74f79). Sobre texto normalizado: el `}` sobrante seguido
 * de la regla completa.
 */
const ORPHANED_RULES: RegExp[] = [
  /\}\.tl-meta-item\{[^{}]*\}/g,
  /\}\.tl-transport-mode\.recommended\{[^{}]*\}/g,
]

interface FirstDiff {
  offset: number
  main: string
  build: string
}

/** Primer desfase entre dos textos, con 80 caracteres de contexto de cada lado (o null). */
function firstDiff(a: string, b: string): FirstDiff | null {
  if (a === b) return null
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  const from = Math.max(0, i - 20)
  return { offset: i, main: a.slice(from, from + 80), build: b.slice(from, from + 80) }
}

interface EditorialResult {
  equal: boolean
  orphanCounts: number[]
  firstDiff: FirstDiff | null
}

/**
 * Compara el bloque editorial de main con tokens.css + base.css. Con `removeOrphans` (por
 * defecto) quita de main las reglas de `ORPHANED_RULES`; sin él, compara tal cual (para el test
 * de dientes).
 */
function editorialMatches(mainEditorial: string, tokens: string, base: string, removeOrphans = true): EditorialResult {
  let main = normalizeCss(mainEditorial)
  const orphanCounts = ORPHANED_RULES.map(re => (main.match(re) ?? []).length)
  if (removeOrphans) for (const re of ORPHANED_RULES) main = main.replace(re, '')
  const build = normalizeCss(`${tokens}\n${base}`)
  return { equal: main === build, orphanCounts, firstDiff: firstDiff(main, build) }
}

/** Familias del `<link>` css2 de Google Fonts del `<head>` de main. */
function googleFontFamilies(html: string): { links: number, families: string[] } {
  const links = [...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/g)].map(m => m[1] ?? '')
  const families = links.flatMap(href =>
    new URL(href.replace(/&amp;/g, '&')).searchParams.getAll('family').map(f => (f.split(':')[0] ?? '').replace(/\+/g, ' ')))
  return { links: links.length, families }
}

/** Familias declaradas en las reglas @font-face de fonts.css. */
function fontFaceFamilies(css: string): string[] {
  return [...new Set([...css.matchAll(/@font-face\s*\{[^}]*?font-family:\s*'([^']+)'/g)].map(m => m[1] ?? ''))]
}

const MAIN_HTML = readMainHtml()
const BLOCKS = styleBlocks(MAIN_HTML)
const LEAFLET_BLOCK = BLOCKS.find(b => b.attrs === 'id="leaflet-inline-css"')
const EDITORIAL_BLOCK = BLOCKS.find(b => b.attrs === '')
const TOKENS = readCss('tokens.css')
const BASE = readCss('base.css')
const LEAFLET = readCss('leaflet.css')
const FONTS = readCss('fonts.css')

const describeDiff = (d: FirstDiff | null): string =>
  d ? `primer desfase en ${d.offset}:\n  main:  ${d.main}\n  build: ${d.build}` : 'sin diferencias'

describe('CSS de la build = CSS de main:index.html (D-02)', () => {
  it('main tiene exactamente dos bloques <style>: el de Leaflet (id leaflet-inline-css) y el editorial, sin atributos', () => {
    expect(BLOCKS.map(b => b.attrs)).toEqual(['id="leaflet-inline-css"', ''])
    expect(LEAFLET_BLOCK?.css.length ?? 0).toBeGreaterThan(1000)
    expect(EDITORIAL_BLOCK?.css.length ?? 0).toBeGreaterThan(10000)
  })

  it('leaflet.css es el bloque leaflet-inline-css de main (comentarios y espacios aparte)', () => {
    const main = normalizeCss(LEAFLET_BLOCK?.css ?? '')
    const build = normalizeCss(LEAFLET)
    expect(main === build, describeDiff(firstDiff(main, build))).toBe(true)
  })

  it('tokens.css + base.css es el bloque editorial de main salvo EXACTAMENTE las dos reglas orfanadas de 08-06 (cc74f79)', () => {
    const r = editorialMatches(EDITORIAL_BLOCK?.css ?? '', TOKENS, BASE)
    expect(r.orphanCounts, 'cada regla orfanada (.tl-meta-item, .tl-transport-mode.recommended) casa una sola vez en main').toEqual([1, 1])
    expect(r.equal, describeDiff(r.firstDiff)).toBe(true)
  })

  it('fonts.css sustituye al <link> de Google Fonts de main con las mismas tres familias', () => {
    const g = googleFontFamilies(MAIN_HTML)
    expect(g.links, 'main carga UN <link> css2 de Google Fonts').toBe(1)
    const expected = ['Cormorant Garamond', 'JetBrains Mono', 'Lora']
    expect([...g.families].sort()).toEqual(expected)
    expect(fontFaceFamilies(FONTS).sort()).toEqual(expected)
  })

  describe('dientes (en memoria, sin tocar ningún CSS)', () => {
    const editorial = EDITORIAL_BLOCK?.css ?? ''

    it('cambiar un carácter de un valor de declaración en tokens hace fallar la comparación', () => {
      const m = /--accent:\s*#([0-9a-fA-F])/.exec(TOKENS)
      expect(m, 'tokens.css declara --accent con un color hex').not.toBeNull()
      const i = (m!.index + m![0].length) - 1
      const swapped = TOKENS.slice(0, i) + (TOKENS[i] === '0' ? '1' : '0') + TOKENS.slice(i + 1)
      expect(swapped).not.toBe(TOKENS)
      expect(editorialMatches(editorial, swapped, BASE).equal).toBe(false)
    })

    it('comparar sin quitar las reglas orfanadas hace fallar la comparación', () => {
      expect(editorialMatches(editorial, TOKENS, BASE, false).equal).toBe(false)
    })

    it('espacios, saltos de línea y un comentario de más en base siguen pasando', () => {
      const noisy = BASE.replace(/;/, ' ;  \n\t ').replace(/\{/, '  {\n /* comentario de prueba */ ') + '\n\n/* fin */\n'
      expect(noisy).not.toBe(BASE)
      expect(editorialMatches(editorial, TOKENS, noisy).equal).toBe(true)
    })
  })
})
