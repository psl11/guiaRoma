import { describe, it, expect } from 'vitest'
import { listTripDirs, loadTrip } from '../data/trips'
import { createSearchIndex } from '../../app/utils/searchIndex'
import type { Monument } from '../../shared/schemas'

/**
 * Aislamiento de búsqueda entre viajes a nivel de DATOS REALES (PLAT-01 / SC1, Fase 9).
 *
 * Construye un índice MiniSearch por viaje con la MISMA fábrica que usa la app
 * (`createSearchIndex`) a partir de los YAML reales de content/trips/<viaje>/monuments/
 * (leídos con el loader Node puro de la puerta de datos, `loadTrip`). Asevera que cada índice
 * solo devuelve fichas de SU viaje: «Pantheon»/«Pante» aparecen en Roma y no en `prueba`,
 * «Fontana» en `prueba` devuelve solo `fontana-pruebas`, y el slug compartido `spagna` resuelve
 * a su propio nombre en cada índice (Piazza di Spagna / Escalinata de Ensayo).
 *
 * Esto prueba el aislamiento de los DATOS y de la fábrica del índice (un índice por slug). El
 * CABLEADO real (useSearch por viaje, estado sufijado, inject del slug) lo prueba el E2E de
 * 09-04 contra `nuxi dev`. Vitest plano, sin runtime Nuxt (mismo estilo que searchIndex.spec.ts).
 *
 * Si un caso de `prueba` falla por un acierto difuso (prefijo + fuzzy 0.2), se reescribe la
 * prosa de content/trips/prueba — nunca se relaja este test.
 */

/** Monumentos de un viaje, tal cual los carga la puerta de datos (validados por schema.spec). */
function monumentsOf(dir: string): Monument[] {
  // Una carpeta ausente da [] (y el primer caso falla con una aserción, no con un error de carga).
  if (!listTripDirs().includes(dir)) return []
  return loadTrip(dir).docs
    .filter(d => d.collection === 'monument')
    .map(d => d.data as unknown as Monument)
}

const romaMonuments = monumentsOf('roma')
const pruebaMonuments = monumentsOf('prueba')
const roma = createSearchIndex(romaMonuments)
const prueba = createSearchIndex(pruebaMonuments)
const romaSlugs = new Set(romaMonuments.map(m => m.slug))
const pruebaSlugs = new Set(pruebaMonuments.map(m => m.slug))

const slugs = (rs: Array<{ slug?: unknown }>) => rs.map(r => r.slug as string)

describe('aislamiento de búsqueda por viaje (PLAT-01, datos reales)', () => {
  it('los dos viajes tienen monumentos (el fixture prueba existe)', () => {
    expect(romaMonuments.length).toBeGreaterThan(0)
    expect([...pruebaSlugs].sort()).toEqual(['fontana-pruebas', 'spagna', 'torre-ensayo'])
  })

  it.each(['Pantheon', 'Pante'])('«%s» devuelve pantheon en Roma', (q) => {
    expect(slugs(roma.search(q))).toContain('pantheon')
  })

  it.each(['Pantheon', 'Pante'])('«%s» no devuelve nada en prueba', (q) => {
    expect(prueba.search(q)).toEqual([])
  })

  it('«Fontana» en prueba devuelve solo fontana-pruebas', () => {
    expect(slugs(prueba.search('Fontana'))).toEqual(['fontana-pruebas'])
  })

  it('«Fontana» en Roma no devuelve fontana-pruebas', () => {
    expect(slugs(roma.search('Fontana'))).not.toContain('fontana-pruebas')
  })

  it('spagna en prueba es la Escalinata de Ensayo', () => {
    const hit = prueba.search('Escalinata').find(r => r.slug === 'spagna')
    expect(hit?.name).toBe('Escalinata de Ensayo')
  })

  it('spagna en Roma es Piazza di Spagna', () => {
    const hit = roma.search('Spagna').find(r => r.slug === 'spagna')
    expect(hit?.name).toBe('Piazza di Spagna')
  })

  it.each(['Pantheon', 'Fontana', 'Spagna', 'Escalinata'])(
    '«%s»: cada índice solo devuelve fichas de su viaje',
    (q) => {
      for (const s of slugs(prueba.search(q))) expect(pruebaSlugs.has(s), `prueba → ${s}`).toBe(true)
      for (const s of slugs(roma.search(q))) expect(romaSlugs.has(s), `roma → ${s}`).toBe(true)
    },
  )
})
