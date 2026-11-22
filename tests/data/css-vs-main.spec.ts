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
 *    (generado por scripts/vendor-fonts.mjs desde la MISMA URL css2): mismas tres familias y
 *    EXACTAMENTE las mismas caras (familia, estilo, peso) que pide el `<link>`.
 *  · ORDEN DE CASCADA (diferencia de orden documentada, WR-05 de 14-REVIEW.md): en main el bloque
 *    de Leaflet va ANTES del editorial; la build carga `fonts → tokens → base → leaflet`
 *    (nuxt.config.ts, fijado por tests/unit/multitripCss.spec.ts), así que leaflet.css queda
 *    DETRÁS de base.css. leaflet.css también trae reglas de la app (`.light-banner`,
 *    `.dia-ligera`, `.tl-hidden`…): un empate de especificidad entre una regla de leaflet.css y
 *    una de tokens/base se resolvería al revés que en main. Hoy no hay ninguno con el mismo
 *    selector; el test «orden de cascada» lo exige (selector idéntico + misma propiedad + valor o
 *    `!important` distinto = conflicto) como cable trampa.
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

/**
 * Caras `familia|estilo|peso` que pide el `<link>` css2 de Google Fonts del `<head>` de main.
 * Cada parámetro `family=` es `Nombre+Con+Espacios[:ejes@tupla;tupla…]`, con ejes `ital,wght`
 * (tuplas `0,400`, `1,500`…) o solo `wght` (tuplas `400`, `500`); sin ejes, la cara normal 400.
 */
function googleFontFaces(html: string): { links: number, families: string[], faces: string[] } {
  const links = [...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)"/g)].map(m => m[1] ?? '')
  const params = links.flatMap(href => new URL(href.replace(/&amp;/g, '&')).searchParams.getAll('family'))
  const families: string[] = []
  const faces: string[] = []
  for (const param of params) {
    const [rawName = '', spec = ''] = param.split(':')
    const family = rawName.replace(/\+/g, ' ')
    families.push(family)
    if (!spec) {
      faces.push(`${family}|normal|400`)
      continue
    }
    const [axesPart = '', tuplesPart = ''] = spec.split('@')
    const axes = axesPart.split(',')
    for (const tuple of tuplesPart.split(';')) {
      const values = tuple.split(',')
      const at = (axis: string, fallback: string): string => (axes.includes(axis) ? values[axes.indexOf(axis)] ?? fallback : fallback)
      faces.push(`${family}|${at('ital', '0') === '1' ? 'italic' : 'normal'}|${at('wght', '400')}`)
    }
  }
  return { links: links.length, families, faces: [...new Set(faces)].sort() }
}

interface FontFaceRule {
  face: string
  unicodeRange: string
}

/** Reglas @font-face de fonts.css como cara `familia|estilo|peso` + su `unicode-range`. */
function fontFaceRules(css: string): FontFaceRule[] {
  return [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => {
    const body = m[1] ?? ''
    const prop = (name: string): string => (new RegExp(`${name}:\\s*([^;]+);`).exec(body)?.[1] ?? '').trim()
    return {
      face: `${prop('font-family').replace(/^'|'$/g, '')}|${prop('font-style') || 'normal'}|${prop('font-weight') || '400'}`,
      unicodeRange: prop('unicode-range'),
    }
  })
}

/** Familias declaradas en las reglas @font-face de fonts.css. */
const fontFaceFamilies = (css: string): string[] => [...new Set(fontFaceRules(css).map(r => r.face.split('|')[0] ?? ''))]

/** Caras distintas declaradas en fonts.css. */
const fontFaceFaces = (css: string): string[] => [...new Set(fontFaceRules(css).map(r => r.face))].sort()

/** Una declaración CSS con su selector (uno solo, sin comas) y su contexto de at-rules. */
interface CssDecl {
  context: string
  selector: string
  prop: string
  value: string
}

/** Parte `text` por `sep` fuera de paréntesis, corchetes y comillas. */
function splitTopLevel(text: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quote) {
      if (ch === quote && text[i - 1] !== '\\') quote = ''
    }
    else if (ch === '"' || ch === '\'') quote = ch
    else if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    else if (ch === sep && depth === 0) {
      out.push(text.slice(start, i))
      start = i + 1
    }
  }
  out.push(text.slice(start))
  return out
}

/**
 * Declaraciones de una hoja (sobre el texto normalizado), una por selector. Entra en @media,
 * @supports, @layer y @container (el contexto se guarda); salta @font-face y @keyframes, que no
 * seleccionan elementos.
 */
function cssDeclarations(css: string): CssDecl[] {
  const out: CssDecl[] = []
  const walk = (text: string, context: string): void => {
    let i = 0
    while (i < text.length) {
      const open = text.indexOf('{', i)
      if (open < 0) break
      const prelude = text.slice(i, open).trim()
      let depth = 1
      let j = open + 1
      while (j < text.length && depth > 0) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') depth--
        j++
      }
      const body = text.slice(open + 1, j - 1)
      if (prelude.startsWith('@')) {
        if (/^@(media|supports|layer|container)\b/.test(prelude)) walk(body, context ? `${context} ${prelude}` : prelude)
      }
      else {
        const decls = splitTopLevel(body, ';')
        for (const sel of splitTopLevel(prelude, ',')) {
          const selector = sel.trim().replace(/\s*([>+~])\s*/g, '$1')
          for (const decl of decls) {
            const k = decl.indexOf(':')
            if (k > 0) out.push({ context, selector, prop: decl.slice(0, k).trim().toLowerCase(), value: decl.slice(k + 1).trim() })
          }
        }
      }
      i = j
    }
  }
  walk(normalizeCss(css), '')
  return out
}

/**
 * Conflictos de cascada entre leaflet.css y tokens.css + base.css cuya resolución cambia con el
 * orden de carga: mismo selector exacto y misma propiedad con valor (o `!important`) distinto.
 * Conservador: compara en cualquier contexto de @media, porque dos contextos pueden aplicar a
 * la vez.
 */
function cascadeConflicts(leaflet: string, editorial: string): string[] {
  const bySelector = new Map<string, CssDecl[]>()
  for (const d of cssDeclarations(editorial)) bySelector.set(d.selector, [...(bySelector.get(d.selector) ?? []), d])
  return cssDeclarations(leaflet).flatMap(l =>
    (bySelector.get(l.selector) ?? [])
      .filter(b => b.prop === l.prop && b.value !== l.value)
      .map(b => `${l.selector} { ${l.prop} } leaflet.css[${l.context || 'global'}]: ${l.value} · tokens/base[${b.context || 'global'}]: ${b.value}`))
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

  it('orden de cascada: ningún selector de leaflet.css choca con tokens.css/base.css en una propiedad (main los carga en orden inverso)', () => {
    // No vacuidad: el analizador ve las reglas de ambas hojas (Leaflet incluido su @media print).
    const leafletDecls = cssDeclarations(LEAFLET)
    expect(leafletDecls.length, 'declaraciones de leaflet.css').toBeGreaterThan(200)
    expect(cssDeclarations(`${TOKENS}\n${BASE}`).length, 'declaraciones de tokens.css + base.css').toBeGreaterThan(1000)
    expect(leafletDecls.some(d => d.context.startsWith('@media print')), 'entra en @media').toBe(true)
    const conflicts = cascadeConflicts(LEAFLET, `${TOKENS}\n${BASE}`)
    expect(conflicts, `conflictos cuyo ganador depende del orden leaflet ↔ base:\n${conflicts.join('\n')}`).toEqual([])
  })

  it('fonts.css sustituye al <link> de Google Fonts de main con las mismas tres familias', () => {
    const g = googleFontFaces(MAIN_HTML)
    expect(g.links, 'main carga UN <link> css2 de Google Fonts').toBe(1)
    const expected = ['Cormorant Garamond', 'JetBrains Mono', 'Lora']
    expect([...g.families].sort()).toEqual(expected)
    expect(fontFaceFamilies(FONTS).sort()).toEqual(expected)
  })

  it('fonts.css declara EXACTAMENTE las caras (familia, estilo, peso) que pide el <link> de main, cada una con el subconjunto latin', () => {
    // Sin una cara (p. ej. Cormorant 700 o Lora itálica 500) el navegador sintetiza negrita o
    // cursiva falsas: rotura visual que la comparación de familias no ve (WR-04 de 14-REVIEW.md).
    const g = googleFontFaces(MAIN_HTML)
    expect(g.faces.length, 'main pide 14 caras (7 Cormorant + 5 Lora + 2 JetBrains Mono)').toBe(14)
    expect(fontFaceFaces(FONTS)).toEqual(g.faces)
    const withoutLatin = g.faces.filter(face =>
      !fontFaceRules(FONTS).some(r => r.face === face && r.unicodeRange.startsWith('U+0000-00FF')))
    expect(withoutLatin, 'caras sin el subconjunto latin (U+0000-00FF)').toEqual([])
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

    it('quitar una cara de fonts.css (Cormorant Garamond 700) hace fallar la comparación de caras', () => {
      const dropped = FONTS.replace(/@font-face\s*\{[^}]*font-family:\s*'Cormorant Garamond';[^}]*font-style:\s*normal;[^}]*font-weight:\s*700;[^}]*\}/g, '')
      expect(dropped).not.toBe(FONTS)
      expect(fontFaceFamilies(dropped).sort(), 'la familia sigue presente (por eso no basta con las familias)').toEqual(fontFaceFamilies(FONTS).sort())
      expect(fontFaceFaces(dropped)).not.toEqual(googleFontFaces(MAIN_HTML).faces)
    })

    it('una regla de base.css con un selector de leaflet.css y otro valor se detecta como conflicto de cascada', () => {
      const sample = cssDeclarations(LEAFLET).find(d => d.context === '' && d.selector.startsWith('.leaflet-'))
      expect(sample, 'leaflet.css tiene reglas globales .leaflet-*').toBeDefined()
      const injected = `${BASE}\n${sample!.selector}{${sample!.prop}:${sample!.value === 'inherit' ? 'initial' : 'inherit'}}\n`
      expect(cascadeConflicts(LEAFLET, `${TOKENS}\n${injected}`)).toHaveLength(1)
      const sameValue = `${BASE}\n${sample!.selector}{${sample!.prop}:${sample!.value}}\n`
      expect(cascadeConflicts(LEAFLET, `${TOKENS}\n${sameValue}`), 'mismo valor: el orden no cambia el resultado').toEqual([])
    })

    it('espacios, saltos de línea y un comentario de más en base siguen pasando', () => {
      const noisy = BASE.replace(/;/, ' ;  \n\t ').replace(/\{/, '  {\n /* comentario de prueba */ ') + '\n\n/* fin */\n'
      expect(noisy).not.toBe(BASE)
      expect(editorialMatches(editorial, TOKENS, noisy).equal).toBe(true)
    })
  })
})
