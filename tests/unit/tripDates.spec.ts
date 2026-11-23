import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { describe, it, expect } from 'vitest'
import { formatTripDates, listedTrips, sortTrips, tripMetaLine } from '../../app/utils/tripDates'
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
 * D-10 — `sortTrips` ordena la portada: startDate descendente, sin fecha al final, empate por
 * título plano en español. D-16 — `listedTrips` saca los borradores y distingue «cargando» (null)
 * de «no hay viajes» ([]), para que la portada nunca pinte el estado vacío durante la hidratación.
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

describe('formatTripDates: tabla completa (D-09)', () => {
  it('mismo mes, día 1: 2027-05-01 + 2027-05-10 → «1–10 de mayo de 2027»', () => {
    expect(formatTripDates('2027-05-01', '2027-05-10')).toBe('1–10 de mayo de 2027')
  })

  it('cruce de mes: 2026-06-30 + 2026-07-02 → fechas completas unidas por « – »', () => {
    expect(formatTripDates('2026-06-30', '2026-07-02')).toBe('30 de junio de 2026 – 2 de julio de 2026')
  })

  it('cruce de año: 2026-12-28 + 2027-01-03 → fechas completas unidas por « – »', () => {
    expect(formatTripDates('2026-12-28', '2027-01-03')).toBe('28 de diciembre de 2026 – 3 de enero de 2027')
  })
})

interface T { title: string, startDate?: string | null, draft?: boolean | null }
const titles = (ts: readonly T[] | null) => ts?.map(t => t.title) ?? null

describe('sortTrips (D-10)', () => {
  it('startDate descendente: 2027-06-19 antes que 2026-06-19', () => {
    const out = sortTrips<T>([
      { title: 'Roma', startDate: '2026-06-19' },
      { title: 'Campania', startDate: '2027-06-19' },
    ])
    expect(titles(out)).toEqual(['Campania', 'Roma'])
  })

  it('un viaje sin startDate va detrás de todos los que la tienen', () => {
    const out = sortTrips<T>([
      { title: 'Aaa sin fecha' },
      { title: 'Roma', startDate: '2026-06-19' },
      { title: 'Nulo', startDate: null },
      { title: 'Campania', startDate: '2027-06-19' },
    ])
    expect(titles(out)).toEqual(['Campania', 'Roma', 'Aaa sin fecha', 'Nulo'])
  })

  it('misma fecha → por título plano en español («_Ávila_» antes que «Burgos»)', () => {
    const out = sortTrips<T>([
      { title: 'Burgos', startDate: '2026-06-19' },
      { title: '_Ávila_', startDate: '2026-06-19' },
    ])
    expect(titles(out)).toEqual(['_Ávila_', 'Burgos'])
  })

  it('ambos sin fecha → por título plano en español', () => {
    const out = sortTrips<T>([{ title: 'Burgos' }, { title: '_Ávila_' }])
    expect(titles(out)).toEqual(['_Ávila_', 'Burgos'])
  })

  it('no muta la entrada', () => {
    const input: T[] = [{ title: 'Roma', startDate: '2026-06-19' }, { title: 'Campania', startDate: '2027-06-19' }]
    const copy = [...input]
    const out = sortTrips(input)
    expect(input).toEqual(copy)
    expect(out).not.toBe(input)
  })
})

describe('listedTrips (D-16, vacío frente a cargando)', () => {
  it('null o undefined (datos aún no llegados) → null', () => {
    expect(listedTrips<T>(null)).toBeNull()
    expect(listedTrips<T>(undefined)).toBeNull()
  })

  it('[] → []', () => {
    expect(listedTrips<T>([])).toEqual([])
  })

  it('solo borradores → []', () => {
    expect(listedTrips<T>([{ title: 'Prueba', draft: true }, { title: 'Forma', draft: true }])).toEqual([])
  })

  it('draft null o ausente cuenta como publicado', () => {
    expect(titles(listedTrips<T>([{ title: 'A', draft: null }, { title: 'B' }]))).toEqual(['A', 'B'])
  })

  it('mezcla → solo los publicados, ordenados con sortTrips', () => {
    const out = listedTrips<T>([
      { title: 'Prueba', startDate: '2030-01-01', draft: true },
      { title: 'Roma', startDate: '2026-06-19', draft: false },
      { title: 'Sin fecha' },
      { title: 'Campania', startDate: '2027-06-19' },
    ])
    expect(titles(out)).toEqual(['Campania', 'Roma', 'Sin fecha'])
  })
})
