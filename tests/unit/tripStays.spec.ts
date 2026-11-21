import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { stayFor } from '../../app/utils/tripStays'
import type { Stay } from '../../shared/schemas'

/**
 * Cobertura unitaria de `stayFor` (Fase 12, EXT-02; D-06/D-07).
 *
 * `stayFor(day, stays)` resuelve la base donde se duerme un día: la entrada de `trip.stays` cuyo
 * `slug` es exactamente `day.stay`. Si el día no tiene base, si el viaje no tiene bases o si el
 * slug no existe, devuelve `undefined` y la cabecera del día no pinta «Dormís en …». Nuxt Content
 * entrega `null` para los opcionales ausentes, así que `null` cuenta como ausente.
 *
 * Además de los casos sintéticos, se comprueba con los YAML REALES: cada día de Campania con
 * `stay` resuelve a una base, y ningún día de Roma (sin `stays`) tiene base. Vitest plano, import
 * relativo, sin runtime Nuxt (mismo estilo que dayLabel.spec.ts).
 */

const STAYS: Stay[] = [
  { slug: 'napoles', name: 'Nápoles' },
  { slug: 'salerno', name: 'Salerno', area: 'Costa de Amalfi' },
]

describe('stayFor (D-06/D-07)', () => {
  it('devuelve la base cuyo slug es day.stay', () => {
    expect(stayFor({ stay: 'salerno' }, STAYS)).toEqual({ slug: 'salerno', name: 'Salerno', area: 'Costa de Amalfi' })
  })

  it('el orden de stays no importa', () => {
    expect(stayFor({ stay: 'napoles' }, [...STAYS].reverse())?.name).toBe('Nápoles')
  })

  it.each([
    ['stay ausente', {}],
    ['stay null (Content)', { stay: null }],
    ['stay desconocido', { stay: 'procida' }],
    ['stay con otra caja (sin normalizar)', { stay: 'Salerno' }],
    ['stay con espacio (sin normalizar)', { stay: 'salerno ' }],
  ])('%s → undefined', (_, day) => {
    expect(stayFor(day, STAYS)).toBeUndefined()
  })

  it.each([
    ['null (Content)', null],
    ['undefined', undefined],
  ])('stays %s → undefined', (_, stays) => {
    expect(stayFor({ stay: 'salerno' }, stays)).toBeUndefined()
  })
})

// ── YAML reales ───────────────────────────────────────────────────────────────
const TRIPS = join(process.cwd(), 'content', 'trips')
const readYaml = <T>(...parts: string[]) => parse(readFileSync(join(TRIPS, ...parts), 'utf8')) as T
const daysOf = (trip: string) => readdirSync(join(TRIPS, trip, 'days'))
  .filter(f => f.endsWith('.yml'))
  .map(f => readYaml<{ slug: string, stay?: string | null }>(trip, 'days', f))

describe('stayFor con los viajes reales', () => {
  it('cada día de Campania con stay resuelve a una base de su trip.yml', () => {
    const { stays } = readYaml<{ stays?: Stay[] }>('campania', 'trip.yml')
    const withStay = daysOf('campania').filter(d => !!d.stay)
    expect(withStay.length, 'al menos un día con base (anti-vacuidad)').toBeGreaterThanOrEqual(1)
    for (const d of withStay) {
      const stay = stayFor(d, stays)
      expect(stay, `${d.slug}: stay "${d.stay}"`).toBeDefined()
      expect(stay!.slug).toBe(d.stay)
    }
  })

  it('ningún día de Roma tiene base (Roma no define stays)', () => {
    const { stays } = readYaml<{ stays?: Stay[] }>('roma', 'trip.yml')
    expect(stays).toBeUndefined()
    const days = daysOf('roma')
    expect(days).toHaveLength(5)
    for (const d of days) expect(stayFor(d, stays), d.slug).toBeUndefined()
  })
})
