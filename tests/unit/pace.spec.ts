import { describe, it, expect } from 'vitest'
import { isVisible } from '../../app/utils/pace'

/**
 * Cobertura unitaria de la matriz de ritmo pura `isVisible` (FEAT-06, soporte de SC#1).
 *
 * Portada 1:1 de `setPace()` (index.html:6521-6534). La matriz es CONTRAINTUITIVA y NO
 * debe "corregirse" (RESEARCH §Pitfall 4): cada fila de timeline lleva un `data-pace`
 * (`all` | `medium` | `slow-only`) y el ritmo elegido (`optimistic` | `neutral` | `slow`)
 * decide su visibilidad así:
 *   - optimistic → TODO visible (no oculta nada).
 *   - neutral    → oculta SOLO `slow-only` (`medium` sigue visible).
 *   - slow       → oculta `slow-only` Y `medium` (solo `all` queda visible).
 *
 * Los 9 casos (3 paces × 3 itemPaces) están todos aquí, un `it` por casilla, para que una
 * deriva en cualquier celda (p. ej. ocultar `medium` en `neutral`, o dejar `medium` visible
 * en `slow`) rompa la paridad y quede atrapada. Vitest plano: importa `isVisible` directo de
 * `../../app/utils/pace`, sin runtime Nuxt ni `@nuxt/test-utils` (mismo estilo que
 * `tests/unit/dayLabel.spec.ts`).
 */

describe('isVisible — matriz de ritmo (FEAT-06, Pitfall 4)', () => {
  // pace === 'optimistic' → todo visible
  it("optimistic: 'all' visible", () => {
    expect(isVisible('all', 'optimistic')).toBe(true)
  })
  it("optimistic: 'medium' visible", () => {
    expect(isVisible('medium', 'optimistic')).toBe(true)
  })
  it("optimistic: 'slow-only' visible", () => {
    expect(isVisible('slow-only', 'optimistic')).toBe(true)
  })

  // pace === 'neutral' → oculta solo 'slow-only'
  it("neutral: 'all' visible", () => {
    expect(isVisible('all', 'neutral')).toBe(true)
  })
  it("neutral: 'medium' visible", () => {
    expect(isVisible('medium', 'neutral')).toBe(true)
  })
  it("neutral: 'slow-only' OCULTO", () => {
    expect(isVisible('slow-only', 'neutral')).toBe(false)
  })

  // pace === 'slow' → oculta 'slow-only' Y 'medium' (solo 'all' visible)
  it("slow: 'all' visible", () => {
    expect(isVisible('all', 'slow')).toBe(true)
  })
  it("slow: 'medium' OCULTO", () => {
    expect(isVisible('medium', 'slow')).toBe(false)
  })
  it("slow: 'slow-only' OCULTO", () => {
    expect(isVisible('slow-only', 'slow')).toBe(false)
  })
})
