import { describe, it, expect } from 'vitest'
import { SVG_MOTIFS, motifSvg } from '../../app/utils/svgMotifs'

/**
 * Cobertura unitaria de la tabla de motivos SVG `SVG_MOTIFS` + el lookup `motifSvg`
 * (UI-05) — los 19 SVG de fallback portados VERBATIM de index.html:2212.
 *
 * El fallback de imagen (Plan 03) pinta `motifSvg(monument.motif)` cuando la hero/detalle
 * de Wikimedia falla. Las claves de `SVG_MOTIFS` DEBEN ser EXACTAMENTE los 19 valores del
 * enum `Motif` de `shared/schemas.ts` (dome…coffee): una clave de más/de menos, o un motif
 * en los datos sin SVG, sería un hueco de paridad. Esta spec ancla ambos lados:
 *   - el recuento (exactamente 19) y el conjunto de claves (= los 19 motivos),
 *   - que cada valor es una cadena no vacía que empieza por `<svg`,
 *   - que `motifSvg` devuelve la cadena para un motif conocido y `undefined` para
 *     `undefined` o una clave desconocida (la rama muerta del fallback fiel al original).
 *
 * `CARD_TO_MOTIF` (index.html:2213) NO se porta: lo reemplaza el campo tipado
 * `monument.motif` (Fase 2). Vitest PLANO (estilo `tests/unit/pace.spec.ts`): import
 * relativo `../../app/utils/svgMotifs`, sin `@nuxt/test-utils`.
 */

// Los 19 motivos del enum `Motif` (shared/schemas.ts:31-35), en orden de primera aparición.
const MOTIF_KEYS = [
  'dome', 'pantheon', 'arch', 'fountain', 'obelisk', 'statue', 'painting', 'church',
  'fortress', 'temple', 'garden', 'keyhole', 'mask', 'monument', 'rooftops', 'library',
  'tower', 'stairs', 'coffee',
] as const

describe('SVG_MOTIFS — tabla de los 19 motivos (UI-05, index.html:2212)', () => {
  it('tiene exactamente 19 claves', () => {
    expect(Object.keys(SVG_MOTIFS).length).toBe(19)
  })

  it('el conjunto de claves IGUALA los 19 valores del enum Motif', () => {
    expect(new Set(Object.keys(SVG_MOTIFS))).toEqual(new Set(MOTIF_KEYS))
  })

  it('cada valor es una cadena no vacía que empieza por <svg', () => {
    for (const key of MOTIF_KEYS) {
      const svg = SVG_MOTIFS[key]
      expect(typeof svg).toBe('string')
      expect(svg!.length).toBeGreaterThan(0)
      expect(svg!.startsWith('<svg')).toBe(true)
    }
  })
})

describe('motifSvg — lookup tipado (UI-05)', () => {
  it('motifSvg(\'church\') devuelve una cadena no vacía que empieza por <svg', () => {
    const svg = motifSvg('church')
    expect(typeof svg).toBe('string')
    expect(svg!.startsWith('<svg')).toBe(true)
  })

  it('motifSvg(undefined) devuelve undefined', () => {
    expect(motifSvg(undefined)).toBeUndefined()
  })

  it('motifSvg de una clave desconocida devuelve undefined', () => {
    expect(motifSvg('not-a-motif' as never)).toBeUndefined()
  })
})
