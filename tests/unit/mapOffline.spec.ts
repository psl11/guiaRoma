import { describe, it, expect } from 'vitest'
import { isOffline } from '../../app/utils/mapOffline'

/**
 * Cobertura unitaria del predicado de banner offline `isOffline` (FEAT-02, SC#1) — port
 * verbatim de index.html:6330 (`tilesErrored > 3 && tilesLoaded === 0`).
 *
 * El banner "Sin conexión · solo marcadores visibles" se muestra SOLO cuando han fallado
 * MÁS de 3 tiles Y no se ha cargado NINGUNO. La heurística es CONTRAINTUITIVA y NO se
 * "corrige": es `> 3` (3 NO dispara), y CUALQUIER tile cargado (`loaded !== 0`) suprime el
 * banner para siempre. La tabla de verdad de abajo blinda ambos límites:
 *   - el límite `> 3` (3 → false, 4 → true),
 *   - la puerta `loaded === 0` (un solo load → false aunque haya muchos errores).
 *
 * Vitest PLANO (mismo estilo que `tests/unit/pace.spec.ts`): importa `isOffline` por ruta
 * relativa `../../app/utils/mapOffline` (NO el alias `~~`, corre fuera del resolver de Nuxt),
 * sin `@nuxt/test-utils`.
 */

describe('isOffline — predicado de banner offline (FEAT-02 SC#1, index.html:6330)', () => {
  it('errored=4, loaded=0 → true (más de 3 errores y ningún tile cargado)', () => {
    expect(isOffline(4, 0)).toBe(true)
  })

  it('errored=3, loaded=0 → false (el límite >3: 3 NO es > 3)', () => {
    expect(isOffline(3, 0)).toBe(false)
  })

  it('errored=10, loaded=1 → false (cualquier tile cargado suprime el banner)', () => {
    expect(isOffline(10, 1)).toBe(false)
  })

  it('errored=0, loaded=0 → false (sin errores)', () => {
    expect(isOffline(0, 0)).toBe(false)
  })

  it('errored=5, loaded=0 → true (bien por encima del límite, ningún load)', () => {
    expect(isOffline(5, 0)).toBe(true)
  })
})
