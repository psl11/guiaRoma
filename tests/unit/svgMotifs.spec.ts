import { describe, it, expect } from 'vitest'
import { SVG_MOTIFS, motifSvg } from '../../app/utils/svgMotifs'
import { Motif } from '../../shared/schemas'
import type { Motif as MotifValue } from '../../shared/schemas'

/**
 * Cobertura unitaria de la tabla de motivos SVG `SVG_MOTIFS` + el lookup `motifSvg`
 * (UI-05) — los 19 SVG de fallback portados VERBATIM de index.html:2212 más los motivos de
 * naturaleza de la Fase 12 (D-10).
 *
 * El fallback de imagen (Plan 03) pinta `motifSvg(monument.motif)` cuando la hero/detalle
 * de Wikimedia falla. Las claves de `SVG_MOTIFS` DEBEN ser EXACTAMENTE los valores del
 * enum `Motif` de `shared/schemas.ts`: una clave de más/de menos, o un motif en los datos sin
 * SVG, sería un hueco. La lista esperada sale de `Motif.options` (no de un recuento fijo):
 * añadir un motivo al enum sin su dibujo pone esta spec en rojo. Esta spec ancla ambos lados:
 *   - el conjunto de claves (= `Motif.options`, sin claves de más),
 *   - que cada valor es una cadena no vacía que empieza por `<svg`,
 *   - que `motifSvg` devuelve la cadena para un motif conocido y `undefined` para
 *     `undefined` o una clave desconocida (la rama muerta del fallback fiel al original).
 *
 * `CARD_TO_MOTIF` (index.html:2213) NO se porta: lo reemplaza el campo tipado
 * `monument.motif` (Fase 2). Vitest PLANO (estilo `tests/unit/pace.spec.ts`): import
 * relativo `../../app/utils/svgMotifs`, sin `@nuxt/test-utils`.
 */

// Los valores del enum `Motif` (shared/schemas.ts): los 19 de Roma + los de la Fase 12 (D-10).
const MOTIF_KEYS = Motif.options

describe('SVG_MOTIFS — tabla de motivos (UI-05, index.html:2212 + Fase 12)', () => {
  it('tiene una clave por cada valor del enum Motif, sin claves de más', () => {
    expect(Object.keys(SVG_MOTIFS).length).toBe(MOTIF_KEYS.length)
  })

  it('el conjunto de claves IGUALA los valores del enum Motif', () => {
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

// ── Fase 12 (D-10): los cuatro motivos de los lugares de naturaleza ──────────────────────────
// Ids de UI-SPEC §«Motifs nuevos» por motivo: [cielo, agua o piedra]. Únicos en toda la tabla.
const NATURE_IDS: Record<string, readonly [string, string]> = {
  sea: ['sk_se', 'wa_se'],
  thermal: ['sk_th', 'wa_th'],
  river: ['sk_rv', 'wa_rv'],
  trail: ['sk_tr', 'st_tr'],
}
const NATURE_MOTIFS = Object.keys(NATURE_IDS)
const SVG_HEAD = '<svg viewBox="0 0 800 280" preserveAspectRatio="xMidYMid slice">'

describe('motivos de naturaleza (D-10)', () => {
  it('el enum Motif incluye sea, thermal, river y trail', () => {
    for (const m of NATURE_MOTIFS) expect(Motif.options as readonly string[]).toContain(m)
  })

  it.each(NATURE_MOTIFS)('%s: mismo lienzo, cielo y grupo que los 19 de Roma', (m) => {
    const svg = SVG_MOTIFS[m]
    expect(svg, `SVG_MOTIFS.${m}`).toBeDefined()
    expect(svg!.startsWith(SVG_HEAD)).toBe(true)
    expect(svg).toContain('<g opacity=".9">')
    expect(svg).toContain('stop-color="#f5edd9"')
    expect(svg).toContain('stop-color="#e8d8b5"')
  })

  it.each(NATURE_MOTIFS)('%s: sus dos ids de UI-SPEC y ≤ 1.600 caracteres', (m) => {
    const svg = SVG_MOTIFS[m]
    expect(svg, `SVG_MOTIFS.${m}`).toBeDefined()
    for (const id of NATURE_IDS[m]!) expect(svg).toContain(`id="${id}"`)
    expect(svg!.length).toBeLessThanOrEqual(1600)
  })

  it.each(NATURE_MOTIFS)('%s: sin <style>, <text>, <image> ni xlink', (m) => {
    const svg = SVG_MOTIFS[m]
    expect(svg, `SVG_MOTIFS.${m}`).toBeDefined()
    for (const banned of ['<style', '<text', '<image', 'xlink:']) expect(svg).not.toContain(banned)
  })

  it.each(['sea', 'river', 'trail'])('motifSvg(%s) devuelve una cadena que empieza por <svg', (m) => {
    const svg = motifSvg(m as MotifValue)
    expect(typeof svg).toBe('string')
    expect(svg!.startsWith('<svg')).toBe(true)
  })
})

describe('SVG_MOTIFS — ids únicos en toda la tabla (Pitfall 8)', () => {
  it('cada motivo del enum empieza por el lienzo de 800×280', () => {
    for (const key of MOTIF_KEYS) expect(SVG_MOTIFS[key]!.startsWith(SVG_HEAD), key).toBe(true)
  })

  it('ningún id="…" se repite entre los SVG de la tabla', () => {
    const ids = Object.values(SVG_MOTIFS).flatMap(svg => [...svg.matchAll(/id="([^"]+)"/g)].map(m => m[1]))
    const dups = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dups).toEqual([])
    expect(ids.length).toBeGreaterThanOrEqual(36)
  })
})
