import { describe, it, expect } from 'vitest'
import { dayLabel } from '../../app/utils/dayLabel'

/**
 * Cobertura unitaria del helper puro `dayLabel` (D-04, soporte de SC#2).
 *
 * D-04 manda que la etiqueta del NavPill por día se DERIVE de `day.eyebrow`
 * (`venerdì · 19 giugno` → `Venerdì`), nunca se almacene. La transformación es
 * pura y locale-safe: substring antes del separador `·`, trim, y mayúscula SOLO
 * en la primera letra con `toLocaleUpperCase('it')` para preservar el acento grave.
 *
 * Una deriva de un solo carácter (acento perdido `Venerdi`, o todo en mayúsculas
 * `VENERDÌ`) rompería la paridad SC#2 y aquí queda atrapada. Vitest plano: importa
 * `dayLabel` directo, sin runtime Nuxt ni `@nuxt/test-utils` (mismo estilo TS que
 * `tests/data/schema.spec.ts`).
 */

describe('dayLabel (D-04)', () => {
  it('venerdì · 19 giugno → Venerdì (acento grave preservado)', () => {
    expect(dayLabel('venerdì · 19 giugno')).toBe('Venerdì')
  })

  it('sabato · 20 giugno → Sabato', () => {
    expect(dayLabel('sabato · 20 giugno')).toBe('Sabato')
  })

  it('domenica · 21 giugno → Domenica', () => {
    expect(dayLabel('domenica · 21 giugno')).toBe('Domenica')
  })

  it('lunedì · 22 giugno → Lunedì (acento grave preservado)', () => {
    expect(dayLabel('lunedì · 22 giugno')).toBe('Lunedì')
  })

  it('martedì · 23 giugno → Martedì (acento grave preservado)', () => {
    expect(dayLabel('martedì · 23 giugno')).toBe('Martedì')
  })

  it('conserva el acento grave ì y no pasa a minúscula ni a mayúsculas globales', () => {
    // El acento grave debe sobrevivir: la salida contiene 'ì', NO 'i' y NO 'VENERDÌ'.
    const out = dayLabel('venerdì · 19 giugno')
    expect(out).toContain('ì')
    expect(out).not.toBe('Venerdi')
    expect(out).not.toBe('VENERDÌ')
  })

  it('solo capitaliza el primer carácter; el resto de la primera palabra queda intacto', () => {
    // 'martedì' → 'Martedì': únicamente la 'm' inicial cambia a mayúscula.
    expect(dayLabel('martedì · 23 giugno')).toBe('M' + 'martedì'.slice(1))
  })
})
