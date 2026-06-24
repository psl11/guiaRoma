import { describe, it, expect } from 'vitest'
import { buildTripIndexes } from '../../app/utils/tripIndexes'
import type { Artist, Food, Monument, Reference } from '../../shared/schemas'

/**
 * Cobertura unitaria del constructor de índices puro `buildTripIndexes` (SC#1).
 *
 * SC#1 / ARCH-01 exige que `useTrip(slug)` exponga Maps id-indexadas
 * (`monById`/`foodById`/`artById`/`refById`) para resolución O(1) de cross-refs
 * (timeline.ref, day.cards[], artist.seenIn → #monumento). La construcción de esas
 * Maps es PURA, así que se extrae a `app/utils/tripIndexes.ts` y se cubre aquí con
 * Vitest plano — sin runtime Nuxt ni `@nuxt/test-utils` (RESEARCH §Validation
 * Architecture ▸ Wave 0: "extract the pure indexer to avoid the dependency").
 *
 * El ancla estable es `slug` (NUNCA el `id` reservado de Content): los fixtures sólo
 * necesitan `slug` (+ cast a la entidad). Las cuatro Maps deben existir, `.get(slug)`
 * debe resolver la entidad correcta, `.size` ha de ser exacto, y entradas
 * vacías/`undefined` (ventana de hidratación de useAsyncData) deben dar Maps vacías
 * sin lanzar.
 */

// Fixtures mínimos: sólo `slug` es relevante para la indexación; el `as` satisface al
// typechecker sin transcribir las ~20 propiedades de cada esquema.
const monuments = [
  { slug: 'galleria-sciarra' } as Monument,
  { slug: 'vaticano' } as Monument,
]
const food = [{ slug: 'g-roscioli' } as Food]
const artists = [
  { slug: 'art-bernini' } as Artist,
  { slug: 'arq-barroco' } as Artist,
]
const reference = [{ slug: 'reservas' } as Reference]

describe('buildTripIndexes (SC#1)', () => {
  it('devuelve las cuatro Maps id-indexadas (monById/foodById/artById/refById)', () => {
    const { monById, foodById, artById, refById } = buildTripIndexes(
      monuments,
      food,
      artists,
      reference,
    )
    expect(monById).toBeInstanceOf(Map)
    expect(foodById).toBeInstanceOf(Map)
    expect(artById).toBeInstanceOf(Map)
    expect(refById).toBeInstanceOf(Map)
  })

  it('.get(slug) resuelve la entidad correcta y .size es exacto', () => {
    const { monById, foodById, artById, refById } = buildTripIndexes(
      monuments,
      food,
      artists,
      reference,
    )
    expect(monById.size).toBe(2)
    expect(monById.get('galleria-sciarra')).toBe(monuments[0])
    expect(monById.get('vaticano')).toBe(monuments[1])
    expect(foodById.size).toBe(1)
    expect(foodById.get('g-roscioli')).toBe(food[0])
    expect(artById.size).toBe(2)
    expect(artById.get('art-bernini')).toBe(artists[0])
    expect(refById.size).toBe(1)
    expect(refById.get('reservas')).toBe(reference[0])
  })

  it('la clave es el `slug` (nunca un id numérico/reservado)', () => {
    const { monById } = buildTripIndexes(monuments, food, artists, reference)
    expect(monById.has('vaticano')).toBe(true)
    expect(monById.has('galleria-sciarra')).toBe(true)
  })

  it('entradas vacías → Maps vacías sin lanzar', () => {
    const { monById, foodById, artById, refById } = buildTripIndexes([], [], [], [])
    expect(monById.size).toBe(0)
    expect(foodById.size).toBe(0)
    expect(artById.size).toBe(0)
    expect(refById.size).toBe(0)
  })

  it('entradas null/undefined → Maps vacías sin lanzar (ventana de hidratación)', () => {
    const { monById, foodById, artById, refById } = buildTripIndexes(
      null,
      undefined,
      null,
      undefined,
    )
    expect(monById.size).toBe(0)
    expect(foodById.size).toBe(0)
    expect(artById.size).toBe(0)
    expect(refById.size).toBe(0)
  })
})
