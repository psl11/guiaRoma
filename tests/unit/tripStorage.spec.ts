import { describe, it, expect } from 'vitest'
import { tripStorageKey, tripStateKey } from '../../app/utils/tripStorage'

/**
 * Contrato de claves por viaje (PLAT-03, Fase 9 — D-04 y D-08).
 *
 * D-04: las claves de `localStorage` son `${slug}-${name}`. Para el slug `roma` reproducen BYTE A
 * BYTE las claves que ya escribe la guía viva (`roma-pace`, `roma-light`, `roma-resumen`,
 * `roma-note-<ficha>`): por eso no hay migración y nadie pierde sus notas ni sus preferencias. Si
 * este test se pone rojo, la plataforma habría dejado huérfanas las notas de quien ya usa la guía.
 *
 * D-08: las claves de `useState` (estado en memoria) se sufijan con el slug (`${name}:${slug}`),
 * de modo que dos viajes no comparten ritmo, pila de «Volver» ni búsqueda.
 *
 * Vitest plano: importa directo de `../../app/utils/tripStorage`, sin runtime Nuxt ni
 * `@nuxt/test-utils` (mismo estilo que `tests/unit/pace.spec.ts`).
 */

describe('tripStorageKey (D-04: Roma conserva sus claves, sin migración)', () => {
  it.each([
    ['pace', 'roma-pace'],
    ['light', 'roma-light'],
    ['resumen', 'roma-resumen'],
    ['note-pantheon', 'roma-note-pantheon'],
    ['note-galleria-sciarra', 'roma-note-galleria-sciarra'],
  ])('roma + %s → %s', (name, key) => {
    expect(tripStorageKey('roma', name)).toBe(key)
  })

  it('otro viaje usa su propio prefijo y no colisiona con Roma', () => {
    expect(tripStorageKey('prueba', 'note-spagna')).toBe('prueba-note-spagna')
    expect(tripStorageKey('prueba', 'note-spagna')).not.toBe(tripStorageKey('roma', 'note-spagna'))
  })
})

describe('tripStateKey (D-08: estado en memoria aislado por viaje)', () => {
  it('sufija el nombre con el slug', () => {
    expect(tripStateKey('roma', 'cardNav:stack')).toBe('cardNav:stack:roma')
    expect(tripStateKey('prueba', 'pace')).toBe('pace:prueba')
  })

  it.each(['pace', 'light', 'resumen', 'search:query'])(
    '%s: la clave de roma es distinta de la de prueba',
    (name) => {
      expect(tripStateKey('roma', name)).not.toBe(tripStateKey('prueba', name))
    },
  )
})
