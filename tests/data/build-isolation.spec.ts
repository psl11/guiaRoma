import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Centinela de build: la página estática de Roma no lleva nada del viaje de prueba (Fase 9).
 *
 *  - D-02: el viaje ficticio `prueba` es solo de dev. No se prerenderiza (no existe
 *    `.output/public/trips`) ni se cuela en la página de Roma: el centinela
 *    `PRUEBA-CENTINELA-9F3`, que solo vive en `content/trips/prueba/` (howTo de `trip.yml` y la
 *    ficha `fontana-pruebas`), no puede aparecer en `index.html` ni en `_payload.json`.
 *  - D-08: las claves `useState` van sufijadas por viaje y son visibles en claro en el payload
 *    `__NUXT_DATA__` de `index.html` (`"$space:roma"`, `"$scardNav:stack:roma"`,
 *    `"$ssearch:query:roma"`). Una clave sin sufijo (`"$space"`) indicaría estado global
 *    compartido entre viajes.
 *
 * Corre dentro de `pnpm verify` porque `generate` va antes de `test:data`, así que lee la build
 * recién generada desde cachés limpias. Node puro (`node:fs`), sin runtime Nuxt.
 *
 * Sin build (`.output/public/index.html` ausente, p. ej. un `vitest run tests/data` suelto) el
 * describe se SALTA en vez de fallar en falso. La aserción de «Galleria Sciarra» evita que el
 * spec pase en vacío sobre una build que no renderice Roma en «/».
 */

const OUT = join(process.cwd(), '.output', 'public')
const INDEX = join(OUT, 'index.html')
const PAYLOAD = join(OUT, '_payload.json')
const SENTINEL = 'PRUEBA-CENTINELA-9F3'

describe.skipIf(!existsSync(INDEX))('build estática: Roma sin datos de prueba (D-02, D-08)', () => {
  const html = () => readFileSync(INDEX, 'utf8')

  it('index.html es la guía de Roma (contiene «Galleria Sciarra»; el spec no es vacuo)', () => {
    expect(html()).toContain('Galleria Sciarra')
  })

  it(`el centinela ${SENTINEL} no aparece en index.html ni en _payload.json`, () => {
    expect(html(), 'index.html lleva datos del viaje prueba').not.toContain(SENTINEL)
    if (existsSync(PAYLOAD)) {
      expect(readFileSync(PAYLOAD, 'utf8'), '_payload.json lleva datos del viaje prueba').not.toContain(SENTINEL)
    }
  })

  it('no existe .output/public/trips (solo «/» se prerenderiza)', () => {
    expect(existsSync(join(OUT, 'trips')), '.output/public/trips NO debe existir').toBe(false)
  })

  it('el payload usa claves de estado sufijadas por viaje y ninguna "$space" global', () => {
    const page = html()
    for (const key of ['"$space:roma"', '"$scardNav:stack:roma"', '"$ssearch:query:roma"']) {
      expect(page, `falta la clave de estado ${key}`).toContain(key)
    }
    expect(page, 'clave de estado sin sufijo de viaje "$space"').not.toContain('"$space"')
  })
})
