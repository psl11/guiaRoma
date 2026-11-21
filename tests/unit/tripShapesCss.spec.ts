import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NEW_CLASSES, classTokens, cssSelectors, htmlClassTokens, tripShapesOffenders } from './cssSelectors'

/**
 * GUARDIÁN DE ALCANCE DE tripshapes.css (Fase 12, D-17; amenaza T-12-05).
 *
 * `app/assets/css/tripshapes.css` tiene los estilos de las formas nuevas de viaje (alternativas,
 * «Dormís en», bandas de transporte, caja «Con niños») y se carga en el bundle global, así que
 * llega también a la guía de Roma. Principio: **ningún selector nuevo puede casar con un elemento
 * del DOM de Roma**. Para lograrlo por construcción, CADA selector del fichero (también dentro de
 * `@media`) tiene que contener como token completo una clase de `NEW_CLASSES`, la lista cerrada de
 * 12-UI-SPEC, que nunca aparece en el HTML de Roma.
 *
 * Por qué basta con UNA clase nueva por selector: en un selector compuesto (`.tl-transport.car`) o
 * descendiente (`.tl-choice .timeline`) TODAS sus partes deben casar para que la regla se aplique;
 * si una parte exige una clase que Roma no tiene, la regla no puede alcanzar ningún elemento de
 * Roma, aunque el resto del selector (`.timeline`, `.tl-transport`) sí exista allí. La comparación
 * es por token completo: `car` no casa con `card`.
 *
 * Por qué se prohíben los selectores funcionales y de atributo y el documento:
 *   · `:not(`, `:is(`, `:where(`, `:has(` — dentro de ellos la clase nueva deja de ser un requisito
 *     de casar (`.x:not(.tl-choice)` casa justo con lo que NO la tiene);
 *   · `[…]` — un selector de atributo (`[class*="car"]`) casaría con `card` de Roma;
 *   · `:root`, `html`, `body` — el tema oscuro llega solo por los tokens; tripshapes.css no redefine
 *     variables ni toca el documento.
 *
 * La mitad de BUILD del guardián vive en tests/data/build-isolation.spec.ts: tras `nuxi generate`,
 * ningún token de `NEW_CLASSES` aparece en el HTML publicado de Roma ni de la portada. Los dientes
 * se prueban aquí con cadenas en memoria; nunca se mutan ficheros reales. Vitest plano, Node puro.
 */

const ROOT = process.cwd()
const TRIPSHAPES = join(ROOT, 'app', 'assets', 'css', 'tripshapes.css')
const NUXT_CONFIG = join(ROOT, 'nuxt.config.ts')

describe('classTokens / tripShapesOffenders / htmlClassTokens (dientes, D-17)', () => {
  it('NEW_CLASSES es exactamente la lista cerrada de 12-UI-SPEC (14 clases)', () => {
    expect([...NEW_CLASSES]).toEqual([
      'tl-choice', 'tl-choice-heading', 'tl-choice-option', 'tl-choice-label', 'tl-choice-title', 'tl-choice-sep',
      'day-stay', 'day-stay-name', 'family-box', 'ferry', 'car', 'bus', 'bike', 'plane',
    ])
  })

  it('classTokens saca las clases completas de un selector (sin pseudo-elementos)', () => {
    expect(classTokens('.tl-transport.car .tl-transport-header::before')).toEqual(['tl-transport', 'car', 'tl-transport-header'])
  })

  it('classTokens compara por token completo: «.card» no contiene «car»', () => {
    expect(classTokens('.card')).toEqual(['card'])
    expect(classTokens('.card')).not.toContain('car')
  })

  it.each([
    '.tl-transport.ferry',
    '.tl-choice .timeline',
    '.culture-box.family-box .label',
    '.day-stats-item.car::before',
  ])('tripShapesOffenders acepta «%s»', (sel) => {
    expect(tripShapesOffenders(`${sel}{color:red}`)).toEqual([])
  })

  it('tripShapesOffenders acepta .tl-choice dentro de @media', () => {
    expect(tripShapesOffenders('@media (min-width: 640px){ .tl-choice{padding:0} }')).toEqual([])
  })

  it.each([
    'a',
    '.card',
    '.tl-transport',
    '.cards',
    '.tl-choicex',
    '[data-theme="dark"] .tl-choice',
    '.tl-choice[data-x]',
    ':root',
    'html .tl-choice',
    'body .day-stay',
    '.tl-choice:not(.x)',
    ':is(.tl-choice)',
    ':where(.tl-choice)',
    '.x:has(.tl-choice)',
  ])('tripShapesOffenders señala «%s»', (sel) => {
    expect(tripShapesOffenders(`${sel}{color:red}`)).toEqual([sel])
  })

  it('en una lista de selectores señala solo el que falla', () => {
    expect(tripShapesOffenders('@media (min-width: 640px){ .tl-choice .a, .card{} }')).toEqual(['.card'])
  })

  it('htmlClassTokens saca los tokens de todos los atributos class', () => {
    expect(htmlClassTokens('<div class="card tl-transport walk"><p class="day-stay">')).toEqual(['card', 'tl-transport', 'walk', 'day-stay'])
  })
})

describe('tripshapes.css real (D-17)', () => {
  it('existe, tiene reglas y todos sus selectores llevan una clase de NEW_CLASSES', () => {
    expect(existsSync(TRIPSHAPES), 'app/assets/css/tripshapes.css debe existir').toBe(true)
    const css = readFileSync(TRIPSHAPES, 'utf8')
    expect(cssSelectors(css).length, 'el guardián no es vacuo').toBeGreaterThanOrEqual(8)
    expect(tripShapesOffenders(css)).toEqual([])
  })

  it('tripshapes.css es la última entrada de css[] en nuxt.config.ts', () => {
    const config = readFileSync(NUXT_CONFIG, 'utf8')
    const entries = [...config.matchAll(/'~\/assets\/css\/([a-z]+\.css)'/g)].map(m => m[1])
    expect(entries.at(-1)).toBe('tripshapes.css')
  })
})
