import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MARKER_STYLE } from '../../app/utils/mapMarkers'
import { SVG_MOTIFS } from '../../app/utils/svgMotifs'
import { Motif, PlaceType, StatVariant, TransportVariant } from '../../shared/schemas'
import { cssSelectors } from './cssSelectors'

/**
 * CADA VALOR DE ENUM TIENE SU ESTILO (Fase 12, D-09/D-10/D-11; amenazas T-12-13 y T-12-14).
 *
 * Los enums de shared/schemas.ts son la lista de lo que un YAML puede escribir; la guía solo pinta
 * bien un valor si existe la regla, el dibujo o el marcador que lo acompaña. Si alguien añade un
 * valor al enum y olvida su estilo, el dato valida pero el tramo sale sin banda ni glifo (o la ficha
 * sin dibujo de reserva, o el marcador sin color). Este test recorre `.options` de cada enum contra
 * los selectores REALES de base.css + leaflet.css + tripshapes.css, contra `SVG_MOTIFS` y contra
 * `MARKER_STYLE`, así que el orden de los valores no importa y un valor nuevo sin estilo es rojo.
 *
 *   · `TransportVariant` (variante de la fila `transport` → clase de `div.tl-transport`): cada valor
 *     tiene `.tl-transport.<v>`; los nuevos de la Fase 12 (ferry, car, bus, bike, plane) llevan además
 *     su glifo en `.tl-transport.<v> .tl-transport-header::before` (D-09: nunca solo color).
 *   · `StatVariant` (`day.stats[]` → clase de `div.day-stats-item`): cada valor tiene su glifo
 *     `.day-stats-item.<v>::before`.
 *   · `Motif` → `SVG_MOTIFS` (D-10) y `PlaceType` → `MARKER_STYLE` (D-11).
 *
 * Pitfall 1 — exención del tren: Roma escribe `variant: train` en el tramo Termini → Fiumicino del
 * martes y lo pinta con el estilo BASE de `.tl-transport` (el index.html nunca tuvo regla de tren).
 * «Completar» el enum con una regla `.tl-transport.train` cambiaría ese tramo y su golden de paridad.
 * Por eso `train` es la única exención (`PARITY_EXEMPT_TRANSPORT`) y, además, se exige que NINGÚN
 * CSS tenga un selector con `.tl-transport.train`.
 *
 * Vitest plano, Node puro: lee los CSS del disco, no muta nada.
 */

const CSS_DIR = join(process.cwd(), 'app', 'assets', 'css')
const SELECTORS = ['base.css', 'leaflet.css', 'tripshapes.css']
  .flatMap(f => cssSelectors(readFileSync(join(CSS_DIR, f), 'utf8')))
const SELECTOR_SET: ReadonlySet<string> = new Set(SELECTORS)

/** Única variante de transporte sin regla propia, a propósito (Pitfall 1: el tren de Roma). */
const PARITY_EXEMPT_TRANSPORT: readonly string[] = ['train']

/** Variantes de transporte nuevas de la Fase 12 (D-09): banda + glifo de cabecera. */
const NEW_TRANSPORT = ['ferry', 'car', 'bus', 'bike', 'plane'] as const

describe('TransportVariant → reglas de tramo (D-09, Pitfall 1)', () => {
  it('PARITY_EXEMPT_TRANSPORT es exactamente [\'train\'] y train es un valor del enum', () => {
    expect([...PARITY_EXEMPT_TRANSPORT]).toEqual(['train'])
    expect(TransportVariant.options).toContain('train')
  })

  it('las variantes nuevas de la Fase 12 están en el enum', () => {
    for (const v of NEW_TRANSPORT) expect(TransportVariant.options).toContain(v)
  })

  it.each(TransportVariant.options.filter(v => !PARITY_EXEMPT_TRANSPORT.includes(v)))(
    'la variante «%s» tiene regla .tl-transport.<v>',
    (v) => {
      expect(SELECTOR_SET.has(`.tl-transport.${v}`), `falta .tl-transport.${v}`).toBe(true)
    },
  )

  it.each(NEW_TRANSPORT)('la variante nueva «%s» lleva glifo en la cabecera del tramo', (v) => {
    expect(SELECTOR_SET.has(`.tl-transport.${v} .tl-transport-header::before`)).toBe(true)
  })

  it('ningún CSS tiene un selector con .tl-transport.train (el martes de Roma usa el estilo base)', () => {
    expect(SELECTORS.filter(s => /\.tl-transport\.train(?![\w-])/.test(s))).toEqual([])
  })
})

describe('StatVariant → glifo de la banda de stats (D-09)', () => {
  it.each(StatVariant.options)('la stat «%s» tiene .day-stats-item.<v>::before', (v) => {
    expect(SELECTOR_SET.has(`.day-stats-item.${v}::before`), `falta .day-stats-item.${v}::before`).toBe(true)
  })
})

describe('Motif → SVG_MOTIFS y PlaceType → MARKER_STYLE (D-10, D-11)', () => {
  it.each(Motif.options)('el motivo «%s» tiene dibujo de reserva', (m) => {
    expect(SVG_MOTIFS[m], `falta SVG_MOTIFS.${m}`).toMatch(/^<svg[\s>]/)
  })

  it.each(PlaceType.options)('el tipo de lugar «%s» tiene estilo de marcador', (t) => {
    expect(MARKER_STYLE[t]?.bg, `falta MARKER_STYLE.${t}`).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
