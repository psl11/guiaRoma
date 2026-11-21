import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cssSelectors } from './cssSelectors'

/**
 * GUARDIÁN DE ALCANCE DE multitrip.css (Fase 11, D-21; amenaza T-11-13).
 *
 * `app/assets/css/multitrip.css` tiene los estilos de la portada y se carga en el bundle global,
 * así que también llega a cada guía. Para que no pueda cambiar ni un píxel de Roma, TODO selector
 * del fichero (también dentro de `@media`) tiene que ser `.trip-index` o empezar por
 * `.trip-index ` (la raíz de la portada, que solo existe en «/»). Un selector suelto (`a`, `p`,
 * `.trip-index-card` sin la raíz) alcanzaría el DOM de las guías.
 *
 * Además se prohíben, aunque vayan bajo la raíz:
 *   · `.trip-back` — es una clase del DOM de las guías (el enlace de vuelta del pie, 11-03): por
 *     contrato (UI-SPEC) no tiene regla en ningún fichero; se pinta con `footer p` + `a` de base.css;
 *   · `:root`, `[data-theme…]`, `html`, `body` — el tema oscuro llega SOLO por los tokens de
 *     tokens.css; multitrip.css no redefine variables ni toca el documento.
 *
 * Los 56 goldens detectarían una fuga que cambie el aspecto de Roma, pero no una regla que hoy no
 * pinte nada distinto; este guardián lo impide por construcción. Sus «dientes» se prueban con
 * cadenas sintéticas en memoria; nunca se mutan ficheros reales. Vitest plano, Node puro.
 *
 * También fija el orden de `css[]` en nuxt.config.ts: multitrip.css va detrás de los cuatro
 * ficheros congelados (fonts, tokens, base, leaflet), para que sus anulaciones no dependan del
 * orden de carga, y tripshapes.css (Fase 12, D-17: formas nuevas de viaje) cierra la lista.
 */

const ROOT = process.cwd()
const MULTITRIP = join(ROOT, 'app', 'assets', 'css', 'multitrip.css')
const NUXT_CONFIG = join(ROOT, 'nuxt.config.ts')
// `cssSelectors` vive en ./cssSelectors.ts (helper compartido con tripShapesCss.spec.ts, Fase 12).

/** Selectores que se salen de `.trip-index` o tocan algo prohibido en multitrip.css. */
export function unscopedSelectors(css: string): string[] {
  return cssSelectors(css).filter(s =>
    !(s === '.trip-index' || s.startsWith('.trip-index '))
    || s.includes('.trip-back')
    || s.includes(':root')
    || s.includes('[data-theme')
    || /^(html|body)\b/.test(s),
  )
}

describe('cssSelectors / unscopedSelectors (dientes, D-21)', () => {
  it('los comentarios no cuentan como selectores', () => {
    expect(cssSelectors('/* a{} */ .trip-index{x:1}')).toEqual(['.trip-index'])
  })

  it('acepta la raíz y los selectores que empiezan por «.trip-index »', () => {
    expect(unscopedSelectors('.trip-index{}')).toEqual([])
    expect(unscopedSelectors('.trip-index .trip-index-card:hover .trip-index-title{}')).toEqual([])
  })

  it.each([
    'a',
    '.trip-index-card',
    '[data-theme="dark"] .trip-index',
    '.trip-index .trip-back',
    ':root',
    'html',
    'body',
  ])('señala «%s»', (sel) => {
    expect(unscopedSelectors(`${sel}{color:red}`)).toEqual([sel])
  })

  it('dentro de @media cuenta el selector, no la at-rule', () => {
    expect(unscopedSelectors('@media (min-width: 640px){ .x{} }')).toEqual(['.x'])
  })

  it('en una lista de selectores señala solo el que se sale', () => {
    expect(unscopedSelectors('@media (prefers-reduced-motion: reduce){ .trip-index .a, .b{} }')).toEqual(['.b'])
  })
})

describe('multitrip.css real (D-21)', () => {
  it('existe, tiene las reglas de la portada y todas van bajo .trip-index', () => {
    expect(existsSync(MULTITRIP), 'app/assets/css/multitrip.css debe existir').toBe(true)
    const css = readFileSync(MULTITRIP, 'utf8')
    expect(cssSelectors(css).length, 'el guardián no es vacuo').toBeGreaterThanOrEqual(15)
    expect(unscopedSelectors(css)).toEqual([])
  })

  it('nuxt.config.ts carga multitrip.css detrás de los cuatro CSS congelados y tripshapes.css cierra la lista', () => {
    const config = readFileSync(NUXT_CONFIG, 'utf8')
    const entries = [...config.matchAll(/'~\/assets\/css\/([a-z]+\.css)'/g)].map(m => m[1])
    expect(entries).toEqual(['fonts.css', 'tokens.css', 'base.css', 'leaflet.css', 'multitrip.css', 'tripshapes.css'])
  })
})
