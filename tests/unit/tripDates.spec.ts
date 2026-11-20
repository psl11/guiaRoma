import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { describe, it, expect } from 'vitest'
import { formatTripDates, tripMetaLine } from '../../app/utils/tripDates'
import { TripSchema } from '../../shared/schemas'

/**
 * Cobertura unitaria de los helpers puros de la tarjeta de la portada (Fase 11, ROUTE-01).
 *
 * D-08 — el viaje declara en su trip.yml `startDate`, `endDate`, `destinations` y `summary`
 * (todos opcionales). El caso de Roma lee el trip.yml REAL (node:fs + yaml), lo valida con
 * `TripSchema` y comprueba la línea meta exacta que pintará su tarjeta: si alguien cambia las
 * fechas o los destinos de Roma, este test lo nota.
 *
 * D-09 — `formatTripDates` escribe las fechas en español sin `Date`/`Intl` (tabla de meses en
 * minúsculas, día sin cero a la izquierda, EN DASH U+2013).
 *
 * D-23 — las fechas son strings ISO `YYYY-MM-DD` (nunca `z.iso.date()`), así que lo que llega
 * aquí es exactamente el texto del YAML, sin desfase de zona horaria.
 *
 * Vitest plano: imports relativos, sin runtime Nuxt (mismo estilo que dayLabel.spec.ts).
 */

const ROMA_TRIP = join(process.cwd(), 'content', 'trips', 'roma', 'trip.yml')

describe('trip.yml real de Roma → línea meta de su tarjeta (D-08)', () => {
  it('valida con TripSchema y su línea meta es «19–23 de junio de 2026 · Roma»', () => {
    const roma = TripSchema.parse(parse(readFileSync(ROMA_TRIP, 'utf8')))
    expect(tripMetaLine(roma)).toBe('19–23 de junio de 2026 · Roma')
  })
})

describe('formatTripDates (D-09)', () => {
  it('rango en el mismo mes: 2026-06-19 + 2026-06-23 → «19–23 de junio de 2026»', () => {
    expect(formatTripDates('2026-06-19', '2026-06-23')).toBe('19–23 de junio de 2026')
  })

  it('solo inicio, fin null o inicio = fin → fecha completa «19 de junio de 2026»', () => {
    expect(formatTripDates('2026-06-19')).toBe('19 de junio de 2026')
    expect(formatTripDates('2026-06-19', null)).toBe('19 de junio de 2026')
    expect(formatTripDates('2026-06-19', '2026-06-19')).toBe('19 de junio de 2026')
  })

  it('sin inicio (con o sin fin) → null', () => {
    expect(formatTripDates(null, '2026-06-23')).toBeNull()
    expect(formatTripDates()).toBeNull()
  })
})

describe('tripMetaLine (línea meta de la tarjeta)', () => {
  it('solo fechas → «19–23 de junio de 2026»', () => {
    expect(tripMetaLine({ startDate: '2026-06-19', endDate: '2026-06-23' })).toBe('19–23 de junio de 2026')
  })

  it('solo destinos [Roma] → «Roma»', () => {
    expect(tripMetaLine({ destinations: ['Roma'] })).toBe('Roma')
  })

  it('varios destinos con fechas de 2027 → termina en « · Nápoles · Procida · Ischia»', () => {
    const line = tripMetaLine({
      startDate: '2027-05-01',
      endDate: '2027-05-10',
      destinations: ['Nápoles', 'Procida', 'Ischia'],
    })
    expect(line).toBe('1–10 de mayo de 2027 · Nápoles · Procida · Ischia')
    expect(line?.endsWith(' · Nápoles · Procida · Ischia')).toBe(true)
  })

  it('sin fechas ni destinos → null', () => {
    expect(tripMetaLine({})).toBeNull()
    expect(tripMetaLine({ startDate: null, endDate: null, destinations: null })).toBeNull()
  })
})
