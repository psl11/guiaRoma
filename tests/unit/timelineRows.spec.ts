import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { DaySchema, type Day } from '../../shared/schemas'
import { flattenRows, optionOnlyRefs, hasTransportVariant } from '../../app/utils/timelineRows'

/**
 * Helpers puros sobre las filas del timeline con alternativas (Fase 12, EXT-01/EXT-06).
 *
 * `app/utils/timelineRows.ts` es lo que usa la «ruta del día» para mirar dentro de las opciones de
 * un `choice`:
 *
 *  · D-04 — `optionOnlyRefs`: las fichas citadas SOLO dentro de opciones no son paradas de la ruta
 *    (nunca mezcla A y B). Una ficha citada también en una parada común sí lo es.
 *  · D-14 — `hasTransportVariant(…, 'ferry')` sobre `flattenRows`: un ferry oculta la ruta, también
 *    si va dentro de una opción.
 *  · Roma, identidad: ningún día de Roma tiene `choice` ni ferry, así que `flattenRows` devuelve su
 *    timeline tal cual y `optionOnlyRefs` es vacío. Es lo que garantiza que su ruta no cambia.
 *
 * Vitest PLANO con YAML reales (node:fs + yaml) pasados por `DaySchema.parse` (los defaults de las
 * filas, como `pace: 'all'`, quedan aplicados igual que en la guía). Import relativo, sin Nuxt.
 */

const TRIPS = join(process.cwd(), 'content', 'trips')

function loadDay(trip: string, slug: string): Day {
  return DaySchema.parse(parseYaml(readFileSync(join(TRIPS, trip, 'days', `${slug}.yml`), 'utf8')))
}

const ROMA_DAYS = readdirSync(join(TRIPS, 'roma', 'days'))
  .filter(f => f.endsWith('.yml'))
  .map(f => loadDay('roma', f.replace(/\.yml$/, '')))

/** Día mínimo válido con el timeline dado (pasa por el esquema: valida el fixture y pone defaults). */
function dayWith(timeline: unknown[]): Day {
  return DaySchema.parse({
    slug: 'fixture', trip: 'fixture', order: 1, roman: 'I', eyebrow: 'e', title: 't', subtitle: 's',
    stats: [], timeline, cards: [],
  })
}

const stop = (ref?: string) => ({ kind: 'stop', time: '10:00', title: `Parada ${ref ?? ''}`, ...(ref ? { ref } : {}) })
const transport = (variant?: string) => ({ kind: 'transport', header: 'Tramo', modes: [], ...(variant ? { variant } : {}) })
const choice = (...options: unknown[][]) => ({
  kind: 'choice',
  options: options.map((rows, i) => ({ label: `Opción ${i + 1}`, title: `Título ${i + 1}`, rows })),
})

describe('timelineRows — Roma, identidad (D-04, D-14)', () => {
  it('carga los 5 días reales de Roma', () => {
    expect(ROMA_DAYS.length).toBe(5)
  })

  for (const day of ROMA_DAYS) {
    it(`${day.slug}: flattenRows es su timeline tal cual y optionOnlyRefs es vacío`, () => {
      expect(flattenRows(day.timeline)).toEqual(day.timeline)
      expect(optionOnlyRefs(day.timeline).size).toBe(0)
    })

    it(`${day.slug}: ningún tramo en ferry`, () => {
      expect(hasTransportVariant(day.timeline, 'ferry')).toBe(false)
    })
  }
})

describe('timelineRows — Campania real (D-04, D-14)', () => {
  it('jueves 24: optionOnlyRefs = {baia-di-trentova, raito, valle-del-calore}', () => {
    const jueves = loadDay('campania', 'jueves-24')
    expect([...optionOnlyRefs(jueves.timeline)].sort()).toEqual(['baia-di-trentova', 'raito', 'valle-del-calore'])
  })

  it('jueves 24: flattenRows incluye las filas de las opciones y ninguna fila choice', () => {
    const jueves = loadDay('campania', 'jueves-24')
    const flat = flattenRows(jueves.timeline)
    expect(flat.some(r => (r as { kind: string }).kind === 'choice')).toBe(false)
    const refs = flat.flatMap(r => (r.kind === 'stop' && r.ref ? [r.ref] : []))
    expect(refs).toEqual(['duomo-di-salerno', 'castello-arechi', 'raito', 'baia-di-trentova', 'valle-del-calore'])
  })

  it('domingo 20: hasTransportVariant encuentra el ferry', () => {
    const domingo = loadDay('campania', 'domingo-20')
    expect(hasTransportVariant(domingo.timeline, 'ferry')).toBe(true)
    expect(hasTransportVariant(domingo.timeline, 'plane')).toBe(false)
  })
})

describe('timelineRows — fixtures (D-04, D-14)', () => {
  it('flattenRows conserva el orden: común, opción A, opción B, común', () => {
    const day = dayWith([stop('a'), choice([stop('b')], [stop('c')]), stop('d')])
    expect(flattenRows(day.timeline).map(r => (r.kind === 'stop' ? r.ref : null))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('optionOnlyRefs no excluye una ref citada también en una parada común', () => {
    const day = dayWith([stop('comun'), choice([stop('comun'), stop('solo-a')], [stop('solo-b')])])
    expect([...optionOnlyRefs(day.timeline)].sort()).toEqual(['solo-a', 'solo-b'])
  })

  it('optionOnlyRefs no excluye una ref común aunque la parada común vaya después del choice', () => {
    const day = dayWith([choice([stop('x')], [stop('y')]), stop('x')])
    expect([...optionOnlyRefs(day.timeline)]).toEqual(['y'])
  })

  it('optionOnlyRefs ignora paradas sin ref', () => {
    const day = dayWith([choice([stop()], [stop()])])
    expect(optionOnlyRefs(day.timeline).size).toBe(0)
  })

  it('hasTransportVariant encuentra un ferry dentro de una opción', () => {
    const day = dayWith([stop('a'), choice([transport('ferry')], [transport('car')]), stop('b')])
    expect(hasTransportVariant(day.timeline, 'ferry')).toBe(true)
    expect(hasTransportVariant(day.timeline, 'car')).toBe(true)
    expect(hasTransportVariant(day.timeline, 'bus')).toBe(false)
  })

  it('hasTransportVariant no confunde un tramo sin variante con un ferry', () => {
    const day = dayWith([transport(), transport('walk')])
    expect(hasTransportVariant(day.timeline, 'ferry')).toBe(false)
  })
})
