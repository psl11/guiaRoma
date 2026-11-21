import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load } from 'cheerio'
import { RESERVAS_HEADINGS_DEFAULT } from '../../app/utils/reservasHeadings'

/**
 * Reservas de Roma, sin cambios (Fase 12.1, habilitador de CAMP-04; D-02 / D-03 / D-06).
 *
 * Desde la Fase 12.1 los tres encabezados de la sección Reservas salen de `headings` del
 * `reservas.yml` de cada viaje, con los textos de Roma por defecto (`RESERVAS_HEADINGS_DEFAULT`,
 * app/utils/reservasHeadings.ts), y un grupo de confirmados vacío no se pinta. Roma no declara
 * `headings` y tiene los dos grupos llenos, así que su sección tiene que salir igual que antes.
 * Este spec lo defiende:
 *
 *  - «defaults verbatim contra index.html» (siempre corre): los tres textos por defecto son,
 *    sin normalizar, los dos `h4` de `.reservas-confirmadas` y la `.reservas-box-header` del
 *    `index.html` heredado (líneas 5267, 5277 y 5284), leído en SOLO LECTURA con cheerio.
 *  - «#reservas de Roma prerenderizado = fixture» (solo con build): la `<section id="reservas">`
 *    de `.output/public/trips/roma/index.html` es BYTE A BYTE `tests/data/fixtures/roma-reservas.html`.
 *    Bytes y no captura de pantalla: la paridad visual no ve un espacio de más alrededor de un
 *    texto ni un comentario de fragmento de Vue (`<!--[-->`) que un `<template v-if>` añadiría en
 *    SSR, y los dos cambiarían el HTML publicado de Roma.
 *
 * El fixture se capturó de la build de HEAD ANTES de tocar ReservasSection.vue y shared/schemas.ts
 * (entra en un commit que no toca ninguno de los dos). NUNCA se regenera para que este spec pase:
 * solo se recaptura ante un cambio de Roma aprobado por el usuario.
 *
 * Corre dentro de `pnpm verify` porque `generate` va antes de `test:data`. Sin build (un
 * `vitest run tests/data` suelto: no hay `.output/public/index.html`) el bloque post-build se
 * SALTA en vez de fallar en falso; con build, si falta la página de Roma el bloque FALLA al
 * leerla. Node puro: sin runtime Nuxt.
 */

const ROOT = process.cwd()
const LEGACY = load(readFileSync(join(ROOT, 'index.html'), 'utf8'))
const BUILT = join(ROOT, '.output', 'public', 'trips', 'roma', 'index.html')
const BUILD_INDEX = join(ROOT, '.output', 'public', 'index.html')
const FIXTURE = join(ROOT, 'tests', 'data', 'fixtures', 'roma-reservas.html')

const START = '<section id="reservas"'
const END = '</section>'

/** Desde el primer `<section id="reservas"` hasta el primer `</section>` posterior, ambos incluidos. */
function reservasSection(html: string): string {
  const start = html.indexOf(START)
  if (start < 0) throw new Error(`no hay ${START} en la build`)
  const end = html.indexOf(END, start)
  if (end < 0) throw new Error(`no hay ${END} tras ${START} en la build`)
  return html.slice(start, end + END.length)
}

describe('Reservas de Roma: defaults verbatim contra index.html (D-02)', () => {
  const h4 = LEGACY('.reservas-confirmadas h4')

  it('index.html tiene exactamente dos h4 en .reservas-confirmadas', () => {
    expect(h4).toHaveLength(2)
  })

  it('RESERVAS_HEADINGS_DEFAULT.mesas === primer h4 (sin U+FE0F tras ✅)', () => {
    expect(RESERVAS_HEADINGS_DEFAULT.mesas).toBe(h4.eq(0).text())
  })

  it('RESERVAS_HEADINGS_DEFAULT.visitas === segundo h4 (con U+FE0F tras 🎟)', () => {
    expect(RESERVAS_HEADINGS_DEFAULT.visitas).toBe(h4.eq(1).text())
    expect(RESERVAS_HEADINGS_DEFAULT.visitas).toContain('\u{1F39F}️')
  })

  it('RESERVAS_HEADINGS_DEFAULT.table === .reservas-box-header', () => {
    expect(RESERVAS_HEADINGS_DEFAULT.table).toBe(LEGACY('.reservas-box-header').text())
  })
})

describe.skipIf(!existsSync(BUILD_INDEX))('#reservas de Roma prerenderizado = fixture (D-02 / D-03, byte a byte)', () => {
  const fixture = () => readFileSync(FIXTURE, 'utf8')

  it('el fixture es una sección #reservas completa con dos h4 y la cabecera de la tabla', () => {
    const f = fixture()
    expect(f.startsWith(START)).toBe(true)
    expect(f.endsWith(END)).toBe(true)
    expect(f).toContain('reservas-box-header')
    expect(f.match(/<h4/g) ?? []).toHaveLength(2)
  })

  it('la sección #reservas de .output/public/trips/roma/index.html es byte a byte el fixture', () => {
    expect(reservasSection(readFileSync(BUILT, 'utf8'))).toBe(fixture())
  })
})
