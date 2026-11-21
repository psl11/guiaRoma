import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import {
  RESERVAS_HEADINGS_DEFAULT,
  confirmedGroup,
  resolveReservasHeadings,
} from '../../app/utils/reservasHeadings'

/**
 * Encabezados de Reservas por viaje y grupos vacíos (Fase 12.1, habilitador de CAMP-04; D-01…D-03).
 *
 * Cubre las dos funciones puras de app/utils/reservasHeadings.ts y el cableado de
 * ReservasSection.vue:
 *  - `resolveReservasHeadings`: cada clave de `headings` ausente, `null` o `''` cae al texto de
 *    Roma (`RESERVAS_HEADINGS_DEFAULT`, congelado); devuelve un objeto nuevo.
 *  - `confirmedGroup`: las entradas de un grupo, en el orden del dato; `[]` con `confirmed` nulo,
 *    ausente o sin entradas de ese grupo (D-03: ese grupo no pinta ni `h4` ni `ul`, y con los dos
 *    vacíos no hay bloque).
 *  - Roma real: su reservas.yml tiene los dos grupos llenos (los dos bloques se pintan, Roma igual).
 *  - Cableado estático: la plantilla de ReservasSection.vue no contiene ningún texto por defecto,
 *    pinta `headings.*` y lleva los `v-if` por grupo en cada elemento (sin `<template>` envoltorio,
 *    que en SSR añadiría comentarios de fragmento a Roma) y ningún encabezado pasa por `<MDC>`.
 *
 * Helpers + escaneo estático en vez de montar el componente: el proyecto no tiene
 * `@nuxt/test-utils` y la fase no añade dependencias. El render real de Roma lo defiende
 * tests/data/romaReservas.spec.ts (bytes de la build). Los dientes del escaneo se prueban con una
 * plantilla sintética en memoria: nunca se mutan ficheros reales. Vitest plano, Node puro.
 */

const ROOT = process.cwd()
type Entry = { group: 'mesas' | 'visitas', when: string, text: string }
const e = (group: Entry['group'], when: string): Entry => ({ group, when, text: `${group} ${when}` })

describe('resolveReservasHeadings (D-01, D-02)', () => {
  it.each([
    ['ausente', undefined],
    ['null (Content)', null],
    ['vacío', {}],
  ])('headings %s → los tres textos de Roma', (_label, h) => {
    expect(resolveReservasHeadings(h)).toEqual(RESERVAS_HEADINGS_DEFAULT)
  })

  it('RESERVAS_HEADINGS_DEFAULT está congelado y el resultado es un objeto nuevo', () => {
    expect(Object.isFrozen(RESERVAS_HEADINGS_DEFAULT)).toBe(true)
    const r = resolveReservasHeadings(undefined)
    expect(r).not.toBe(RESERVAS_HEADINGS_DEFAULT)
    r.mesas = 'mutado'
    expect(RESERVAS_HEADINGS_DEFAULT.mesas).not.toBe('mutado')
    expect(resolveReservasHeadings(undefined).mesas).toBe(RESERVAS_HEADINGS_DEFAULT.mesas)
  })

  it('las tres claves propias salen tal cual', () => {
    const h = { mesas: '✈️ Vuelos, barcos y coche', visitas: '🎟️ Conciertos y entradas', table: 'Qué reservar' }
    expect(resolveReservasHeadings(h)).toEqual(h)
  })

  it('parcial: solo visitas → mesas y table por defecto', () => {
    expect(resolveReservasHeadings({ visitas: 'Conciertos' })).toEqual({
      mesas: RESERVAS_HEADINGS_DEFAULT.mesas,
      visitas: 'Conciertos',
      table: RESERVAS_HEADINGS_DEFAULT.table,
    })
  })

  it('null y \'\' en una clave caen al defecto', () => {
    expect(resolveReservasHeadings({ mesas: null, table: '' })).toEqual(RESERVAS_HEADINGS_DEFAULT)
  })
})

describe('confirmedGroup (D-03)', () => {
  const data = [e('mesas', '1'), e('visitas', '2'), e('mesas', '3'), e('visitas', '4')]

  it('conserva el orden del dato', () => {
    expect(confirmedGroup(data, 'mesas').map(c => c.when)).toEqual(['1', '3'])
    expect(confirmedGroup(data, 'visitas').map(c => c.when)).toEqual(['2', '4'])
  })

  it('confirmed null o ausente → []', () => {
    expect(confirmedGroup(null, 'mesas')).toEqual([])
    expect(confirmedGroup(undefined, 'visitas')).toEqual([])
  })

  it('solo entradas visitas: el grupo mesas está vacío (su h4 y su ul no se pintan)', () => {
    const soloVisitas = [e('visitas', 'a'), e('visitas', 'b')]
    expect(confirmedGroup(soloVisitas, 'mesas')).toEqual([])
    expect(confirmedGroup(soloVisitas, 'visitas')).toHaveLength(2)
  })

  it('confirmed: [] → los dos grupos vacíos (el bloque de confirmados no se pinta)', () => {
    const mesas = confirmedGroup([] as Entry[], 'mesas')
    const visitas = confirmedGroup([] as Entry[], 'visitas')
    expect(mesas.length || visitas.length).toBe(0)
  })
})

describe('Roma real: los dos bloques de confirmados se pintan (Roma sin cambios)', () => {
  const doc = parse(readFileSync(join(ROOT, 'content', 'trips', 'roma', 'reference', 'reservas.yml'), 'utf8')) as {
    headings?: unknown
    confirmed: Entry[]
  }

  it('Roma no declara headings y recibe los textos de siempre', () => {
    expect(doc.headings).toBeUndefined()
    expect(resolveReservasHeadings(undefined)).toEqual(RESERVAS_HEADINGS_DEFAULT)
  })

  it('mesas y visitas tienen al menos una entrada cada uno', () => {
    expect(confirmedGroup(doc.confirmed, 'mesas').length).toBeGreaterThan(0)
    expect(confirmedGroup(doc.confirmed, 'visitas').length).toBeGreaterThan(0)
  })
})

/**
 * Región `<template>` de nivel superior de un SFC (desde la línea que empieza por `<template>`
 * hasta la última que empieza por `</template>`), sin comentarios HTML. Anclado a inicio de línea:
 * el JSDoc del `<script>` puede citar `<template>` en prosa.
 */
function templateOf(sfc: string): string {
  const start = sfc.search(/^<template>/m)
  const ends = [...sfc.matchAll(/^<\/template>/gm)]
  if (start < 0 || ends.length === 0) throw new Error('el SFC no tiene <template> de nivel superior')
  const end = ends[ends.length - 1]!.index! + '</template>'.length
  return sfc.slice(start, end).replace(/<!--[\s\S]*?-->/g, '')
}

const count = (s: string, needle: string) => s.split(needle).length - 1

/** Problemas de cableado de la plantilla de ReservasSection (vacío = bien cableada). */
function wiringProblems(template: string): string[] {
  const problems: string[] = []
  for (const text of Object.values(RESERVAS_HEADINGS_DEFAULT)) {
    if (template.includes(text)) problems.push(`texto por defecto escrito a mano: «${text}»`)
  }
  for (const key of ['headings.mesas', 'headings.visitas', 'headings.table']) {
    if (count(template, key) !== 1) problems.push(`${key} aparece ${count(template, key)} veces (se espera 1)`)
  }
  const vIfs: Array<[string, number]> = [
    ['v-if="mesas.length"', 2],
    ['v-if="visitas.length"', 2],
    ['v-if="mesas.length || visitas.length"', 1],
    ['style="margin-top:.7rem;"', 1],
  ]
  for (const [needle, n] of vIfs) {
    if (count(template, needle) !== n) problems.push(`${needle} aparece ${count(template, needle)} veces (se esperan ${n})`)
  }
  if (/<template\s+v-if/.test(template)) problems.push('envoltorio <template v-if> (en SSR añade comentarios de fragmento)')
  for (const line of template.split('\n')) {
    if ((line.includes('<h4') || line.includes('reservas-box-header')) && line.includes('<MDC')) {
      problems.push(`encabezado renderizado con <MDC>: ${line.trim()}`)
    }
  }
  return problems
}

describe('cableado estático de ReservasSection.vue (D-01, D-02, D-03)', () => {
  const template = templateOf(readFileSync(join(ROOT, 'app', 'components', 'ReservasSection.vue'), 'utf8'))

  it('la plantilla real no tiene problemas de cableado', () => {
    expect(wiringProblems(template)).toEqual([])
  })

  it('dientes: una plantilla con un default escrito a mano y sin los v-if falla', () => {
    const bad = `<template>
      <div class="reservas-confirmadas">
        <h4>${RESERVAS_HEADINGS_DEFAULT.mesas}</h4>
        <ul><li v-for="c in mesas" :key="c.when">{{ c.when }}</li></ul>
        <h4 style="margin-top:.7rem;">{{ headings.visitas }}</h4>
        <template v-if="visitas.length"><ul /></template>
      </div>
      <div class="reservas-box-header"><MDC :value="headings.table" /></div>
    </template>`
    const problems = wiringProblems(bad)
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.some(p => p.includes('escrito a mano'))).toBe(true)
    expect(problems.some(p => p.includes('v-if="mesas.length"'))).toBe(true)
    expect(problems.some(p => p.includes('<template v-if>'))).toBe(true)
    expect(problems.some(p => p.includes('<MDC>'))).toBe(true)
  })
})
