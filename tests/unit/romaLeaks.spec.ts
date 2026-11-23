import { describe, expect, it } from 'vitest'
import { findRomaLeaks, ROMA_MARKERS } from '../trips/romaLeaks'

/**
 * Dientes del matcher del test-trampa (Fase 10, D-16 / SHAPE-05; RESEARCH §Pitfall 7).
 *
 * `findRomaLeaks` busca las marcas de Roma como PALABRA con límites Unicode: una marca dentro de
 * otra palabra («aroma», «Romaña», «guiaRoma») no es una fuga, y las mayúsculas no la esconden
 * («ROMA», «ROYAL COURT»). Si el matcher fuera demasiado laxo, la trampa daría falsos positivos;
 * si fuera demasiado estricto, pasaría en vacío. Vitest plano, sin runtime Nuxt.
 */

describe('findRomaLeaks — no casa dentro de otra palabra', () => {
  it.each(['aroma', 'Romaña', 'romano', 'guiaRoma', 'payment', 'Payaso'])('%s → []', (text) => {
    expect(findRomaLeaks(text)).toEqual([])
  })

  it('cadena vacía → []', () => {
    expect(findRomaLeaks('')).toEqual([])
  })
})

describe('findRomaLeaks — casa la palabra en cualquier caja', () => {
  it('«en Roma.» → Roma', () => {
    expect(findRomaLeaks('en Roma.')).toEqual(['Roma'])
  })

  it('«ROMA» → Roma (forma canónica)', () => {
    expect(findRomaLeaks('ROMA')).toEqual(['Roma'])
  })

  it('«ROYAL COURT» → Royal Court', () => {
    expect(findRomaLeaks('ROYAL COURT')).toEqual(['Royal Court'])
  })

  it('«Royal\\nCourt» → Royal Court (cualquier espacio entre las dos palabras)', () => {
    expect(findRomaLeaks('Royal\nCourt')).toEqual(['Royal Court'])
  })

  it('varias marcas salen en el orden de la lista', () => {
    expect(findRomaLeaks('Hotel Royal Court, Roma')).toEqual(['Roma', 'Royal Court'])
  })

  it.each([
    ['19—23 giugno 2026', 'giugno'],
    ['— FEDERICO FELLINI', 'Fellini'],
    ['para Pay y', 'Pay'],
    ['MMXXVI', 'MMXXVI'],
    ['concierto Einaudi', 'Einaudi'],
  ])('«%s» → %s', (text, marker) => {
    expect(findRomaLeaks(text)).toEqual([marker])
  })
})

describe('ROMA_MARKERS — lista mínima de D-16', () => {
  it('contiene las siete marcas y ninguna más', () => {
    expect([...ROMA_MARKERS]).toEqual(['Roma', 'Einaudi', 'giugno', 'MMXXVI', 'Pay', 'Fellini', 'Royal Court'])
  })
})
