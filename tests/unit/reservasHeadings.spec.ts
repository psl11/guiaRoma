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
 *  - `resolveReservasHeadings`: cada clave de `headings` ausente, `null`, `''` o solo espacios
 *    cae al texto de Roma (`RESERVAS_HEADINGS_DEFAULT`, congelado); devuelve un objeto nuevo.
 *  - `confirmedGroup`: las entradas de un grupo, en el orden del dato; `[]` con `confirmed` nulo,
 *    ausente o sin entradas de ese grupo (D-03: ese grupo no pinta ni `h4` ni `ul`, y con los dos
 *    vacíos no hay bloque).
 *  - Roma real: su reservas.yml tiene los dos grupos llenos (los dos bloques se pintan, Roma igual).
 *  - Cableado estático: la plantilla de ReservasSection.vue no contiene ningún texto por defecto,
 *    pinta `headings.*` y lleva los `v-if` por grupo en cada elemento (sin `<template>` envoltorio,
 *    que en SSR añadiría comentarios de fragmento a Roma) y ningún encabezado pasa por `<MDC>`.
 *  - Vinculación por elemento (WR-03 de la revisión): cada `h4`/`ul` de `.reservas-confirmadas` se
 *    lee como elemento (`confirmedBlocks`) y su `v-if` debe ser el de SU grupo, el mismo que su
 *    `headings.<grupo>` o su `v-for … in <grupo>`; contar subcadenas no bastaba (un `h4` con el
 *    `v-if` del otro grupo pasaba).
 *  - Grupos vacíos (D-03, D-05): `renderConfirmed` evalúa los `v-if` de la plantilla REAL contra
 *    `confirmedGroup` y devuelve qué se pintaría (bloque, encabezados y listas, cada uno con el
 *    grupo de SU contenido): solo visitas → un `h4` y un `ul` de visitas; `confirmed: []` → sin
 *    bloque.
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

  it('WR-02: un texto solo de espacios o saltos de línea cae al defecto (nunca un h4 vacío)', () => {
    expect(resolveReservasHeadings({ table: '  ' })).toEqual(RESERVAS_HEADINGS_DEFAULT)
    expect(resolveReservasHeadings({ mesas: '\n', visitas: ' \t ' })).toEqual(RESERVAS_HEADINGS_DEFAULT)
  })

  it('un texto propio con espacios alrededor sale tal cual (no se recorta)', () => {
    expect(resolveReservasHeadings({ table: ' Qué reservar ' }).table).toBe(' Qué reservar ')
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

/** Un `h4` o `ul` de la plantilla: su `v-if`, los `headings.<k>` que pinta y las listas de sus `v-for`. */
interface ConfirmedBlock { tag: 'h4' | 'ul', vIf: string | null, headings: string[], lists: string[], at: number }

/**
 * Los `h4` y `ul` de la plantilla, en orden, leídos como ELEMENTOS (WR-03): el `v-if` sale de los
 * atributos de ese elemento y `headings.<k>` / `v-for="… in <lista>"` de SU contenido. En
 * ReservasSection solo `.reservas-confirmadas` tiene `h4`/`ul` (la tabla usa `tr`/`td`).
 */
function confirmedBlocks(template: string): ConfirmedBlock[] {
  const blocks: ConfirmedBlock[] = []
  for (const m of template.matchAll(/<(h4|ul)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const [, tag, attrs, inner] = m as unknown as [string, 'h4' | 'ul', string, string]
    blocks.push({
      tag,
      vIf: /\bv-if="([^"]*)"/.exec(attrs)?.[1] ?? null,
      headings: [...inner.matchAll(/\bheadings\.(\w+)/g)].map(x => x[1]!),
      lists: [...inner.matchAll(/\bv-for="[^"]*\bin\s+(\w+)\s*"/g)].map(x => x[1]!),
      at: m.index!,
    })
  }
  return blocks
}

/** Grupos de una condición `a.length` o `a.length || b.length`; `null` si no es de esa forma. */
function groupsOf(vIf: string | null): string[] | null {
  if (vIf === null) return null
  const parts = vIf.split('||').map(p => /^\s*(mesas|visitas)\.length\s*$/.exec(p)?.[1])
  return parts.every(Boolean) ? parts as string[] : null
}

const GROUPS = ['mesas', 'visitas'] as const

/** Problemas de vinculación elemento ↔ grupo (vacío = cada `h4`/`ul` va con su grupo). */
function bindingProblems(template: string): string[] {
  const problems: string[] = []
  const blocks = confirmedBlocks(template)
  const shape = blocks.map(b => b.tag).join(',')
  if (shape !== 'h4,ul,h4,ul') return [`se esperan h4,ul,h4,ul en .reservas-confirmadas y hay ${shape || 'ninguno'}`]
  GROUPS.forEach((group, i) => {
    const [h4, ul] = [blocks[2 * i]!, blocks[2 * i + 1]!]
    const cond = `${group}.length`
    if (h4.vIf !== cond) problems.push(`h4 de ${group}: v-if="${h4.vIf}" (se espera "${cond}")`)
    if (h4.headings.join() !== group) problems.push(`h4 de ${group}: pinta headings.${h4.headings.join(', headings.')}`)
    if (ul.vIf !== cond) problems.push(`ul de ${group}: v-if="${ul.vIf}" (se espera "${cond}")`)
    if (ul.lists.join() !== group) problems.push(`ul de ${group}: v-for sobre ${ul.lists.join(', ') || 'nada'}`)
  })
  const box = /<div\s+v-if="([^"]*)"\s+class="reservas-confirmadas"/.exec(template)
  const header = template.indexOf('class="reservas-box-header"')
  if (!box) problems.push('.reservas-confirmadas sin v-if en su propio div')
  else {
    if (groupsOf(box[1]!)?.join() !== 'mesas,visitas') problems.push(`.reservas-confirmadas: v-if="${box[1]}"`)
    if (!(box.index < blocks[0]!.at && blocks[3]!.at < header)) problems.push('h4/ul fuera de .reservas-confirmadas')
  }
  return problems
}

/**
 * Lo que pintaría `.reservas-confirmadas` para un `confirmed` dado (D-03): evalúa los `v-if` de la
 * plantilla con `confirmedGroup` y etiqueta cada elemento pintado por SU contenido
 * (`h4 <headings.k>` / `ul <lista del v-for>`), no por su condición. `null` = bloque no pintado.
 */
function renderConfirmed(template: string, confirmed: Entry[]): string[] | null {
  const has = (g: string) => confirmedGroup(confirmed, g as Entry['group']).length > 0
  const visible = (vIf: string | null) => {
    const gs = groupsOf(vIf)
    if (!gs) throw new Error(`v-if no evaluable: ${String(vIf)}`)
    return gs.some(has)
  }
  const box = /<div\s+v-if="([^"]*)"\s+class="reservas-confirmadas"/.exec(template)
  if (!box) throw new Error('.reservas-confirmadas sin v-if')
  if (!visible(box[1]!)) return null
  return confirmedBlocks(template)
    .filter(b => visible(b.vIf))
    .map(b => `${b.tag} ${(b.tag === 'h4' ? b.headings : b.lists).join(',')}`)
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

describe('vinculación por elemento y grupos vacíos de ReservasSection.vue (D-03, D-05, WR-03)', () => {
  const template = templateOf(readFileSync(join(ROOT, 'app', 'components', 'ReservasSection.vue'), 'utf8'))
  const mesasA = e('mesas', 'a')
  const visitasB = e('visitas', 'b')

  it('cada h4/ul de la plantilla real lleva el v-if de su grupo', () => {
    expect(bindingProblems(template)).toEqual([])
  })

  it('solo entradas visitas → un h4 y un ul, los de visitas (mesas no se pinta)', () => {
    expect(renderConfirmed(template, [visitasB, e('visitas', 'c')])).toEqual(['h4 visitas', 'ul visitas'])
  })

  it('solo entradas mesas → un h4 y un ul, los de mesas', () => {
    expect(renderConfirmed(template, [mesasA])).toEqual(['h4 mesas', 'ul mesas'])
  })

  it('confirmed: [] → el bloque .reservas-confirmadas no se pinta', () => {
    expect(renderConfirmed(template, [])).toBeNull()
  })

  it('los dos grupos con entradas (Roma) → los cuatro elementos, en orden', () => {
    expect(renderConfirmed(template, [visitasB, mesasA])).toEqual(['h4 mesas', 'ul mesas', 'h4 visitas', 'ul visitas'])
  })

  /** Muta la plantilla REAL en memoria y comprueba que la mutación se aplicó. */
  const mutate = (from: string | RegExp, to: string) => {
    const out = template.replace(from, to)
    expect(out, `la mutación no se aplicó: ${String(from)}`).not.toBe(template)
    return out
  }

  it('dientes: h4 con el v-if del otro grupo (los conteos de subcadenas no lo ven) → falla', () => {
    const swapped = mutate(/<h4 v-if="mesas\.length">/, '<h4 v-if="__X__">')
      .replace(/(<h4\s+)v-if="visitas\.length"/, '$1v-if="mesas.length"')
      .replace('<h4 v-if="__X__">', '<h4 v-if="visitas.length">')
    expect(wiringProblems(swapped)).toEqual([])
    expect(bindingProblems(swapped)).toEqual(expect.arrayContaining([
      'h4 de mesas: v-if="visitas.length" (se espera "mesas.length")',
      'h4 de visitas: v-if="mesas.length" (se espera "visitas.length")',
    ]))
    expect(renderConfirmed(swapped, [visitasB])).toEqual(['h4 mesas', 'ul visitas'])
  })

  it('dientes: ul de mesas con v-for sobre visitas → falla', () => {
    const crossed = mutate('v-for="(c, i) in mesas"', 'v-for="(c, i) in visitas"')
    expect(bindingProblems(crossed)).toContain('ul de mesas: v-for sobre visitas')
    expect(renderConfirmed(crossed, [mesasA])).toEqual(['h4 mesas', 'ul visitas'])
  })

  it('dientes: bloque sin v-if propio o con la condición de un solo grupo → falla', () => {
    const oneGroup = mutate('v-if="mesas.length || visitas.length"', 'v-if="mesas.length"')
    expect(bindingProblems(oneGroup)).toContain('.reservas-confirmadas: v-if="mesas.length"')
    expect(renderConfirmed(oneGroup, [visitasB])).toBeNull()
  })
})
