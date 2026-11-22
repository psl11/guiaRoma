import { describe, it, expect } from 'vitest'
import { collectStrings, loadTrip, timelineRowsOf, type CollectionName, type Doc } from './trips'
import { findRomaLeaks } from '../trips/romaLeaks'
import { routeCards, routeVisible } from '../../app/utils/dayRoute'
import { RESERVAS_HEADINGS_DEFAULT } from '../../app/utils/reservasHeadings'

/**
 * CONTRATO DE CONTENIDO de Campania (Fase 13, CAMP-01…CAMP-06).
 *
 * La puerta de tests/data/trips.ts valida la FORMA de cada viaje (zod + 21 reglas entre ficheros);
 * este spec valida el CONTENIDO real que escribe la Fase 13 sobre el esqueleto de la Fase 12. Crece
 * plan a plan: cada plan que escribe días o fichas añade sus slugs a los registros de abajo
 * (`WRITTEN_DAYS`, `WRITTEN_MONUMENTS`, `FAMILY_REQUIRED`, `MARKER_FILES`) y, si hace falta, un
 * `describe` propio.
 *
 * Solo lee los YAML con el loader puro de la puerta (Node, sin runtime Nuxt ni SQLite), así que no
 * depende de la build. Campania está publicada desde 13-08 (D-02): el describe «publicación» lo fija.
 *
 *  - D-12 / CAMP-06: el marcador de dato sin confirmar es EXACTAMENTE `**⚠ por confirmar**`
 *    (U+26A0 + espacio, sin el selector U+FE0F), siempre en negrita, nunca en un campo de texto
 *    plano (donde los `**` se verían tal cual) y nunca en Roma. Roma contiene las palabras sueltas
 *    «por confirmar» (g-bar-musa.yml), por eso se busca el marcador completo con su ⚠.
 *  - D-03 / D-09: ningún texto de Campania lleva una marca de Roma (tests/trips/romaLeaks.ts) y los
 *    eyebrows de los días van en español: «<día> · <n> de junio».
 *  - D-07 / D-08: el glifo de cada tramo lo pone el CSS, así que ni una stat ni la cabecera de un
 *    tramo empiezan por emoji, y una fila meta no empieza por el glifo de un transporte. Un día con
 *    `route.mode: transit` no pasa de 2 paradas (WR-01: Google Maps no dibuja más).
 *  - T-13-02: ni teléfonos ni números largos en el contenido publicado.
 */

/** Marcador D-12. Escapado para que ningún editor lo convierta en emoji con U+FE0F. */
const MARKER = '⚠ por confirmar'
const BOLD_MARKER = `**${MARKER}**`

const campania = loadTrip('campania')
const roma = loadTrip('roma')

/**
 * Días ya escritos con contenido real → su base (`stay`). `null` = el día no tiene base (salida).
 * Los planes siguientes de la Fase 13 añaden aquí cada día que escriben; 13-06 cubre los diez.
 */
const WRITTEN_DAYS: Record<string, { stay: string | null }> = {
  'martes-22': { stay: 'ischia' },
  'sabado-19': { stay: 'napoles' },
  'domingo-20': { stay: 'procida' },
  'lunes-21': { stay: 'ischia' },
  'miercoles-23': { stay: 'salerno' },
  'jueves-24': { stay: 'salerno' },
  'viernes-25': { stay: 'napoles' },
  'sabado-26': { stay: 'napoles' },
  'domingo-27': { stay: 'napoles' },
  'lunes-28': { stay: null },
}

/** Fichas ya escritas con contenido real. Los planes siguientes añaden las suyas. */
const WRITTEN_MONUMENTS: string[] = [
  'monte-epomeo',
  'baia-di-sorgeto',
  'lungomare-caracciolo',
  'vomero',
  'spaccanapoli',
  'marina-corricella',
  'pozzo-vecchio',
  'terra-murata',
  'forio',
  'salerno-centro-storico',
  'duomo-di-salerno',
  'raito',
  'valle-del-calore',
  'castello-arechi',
  'baia-di-trentova',
  'vesubio',
  'rione-sanita',
  'stadio-maradona',
  'napoli-sotterranea',
  'capodimonte',
  'casertavecchia',
  'lago-d-averno',
  'antro-della-sibilla',
  'spiaggia-di-miseno',
]

/**
 * Fichas que deben llevar nota familiar (D-09): las que se visitan con los niños. Napoli
 * Sotterranea no está: se visita el domingo 27, después de que los niños vuelen a casa
 * (desviación de D-09, 13-REVIEW WR-02), así que no lleva caja «Con niños».
 */
const FAMILY_REQUIRED: string[] = ['monte-epomeo', 'baia-di-sorgeto', 'pozzo-vecchio', 'valle-del-calore', 'baia-di-trentova', 'stadio-maradona', 'spiaggia-di-miseno']

/** Fichas que se visitan cuando los niños ya se han ido: ni caja «Con niños» ni consejo infantil. */
const ADULTS_ONLY: string[] = ['napoli-sotterranea']

/**
 * Ficheros (ruta relativa al viaje) que deben llevar el marcador porque tienen datos dudosos.
 * Los planes siguientes añaden los suyos.
 */
const MARKER_FILES: string[] = [
  'monuments/baia-di-sorgeto.yml',
  'monuments/vomero.yml',
  'days/sabado-19.yml',
  'days/domingo-20.yml',
  'monuments/spaccanapoli.yml',
  'monuments/pozzo-vecchio.yml',
  'days/lunes-21.yml',
  'monuments/forio.yml',
  'days/miercoles-23.yml',
  'monuments/salerno-centro-storico.yml',
  'monuments/duomo-di-salerno.yml',
  'monuments/raito.yml',
  'monuments/valle-del-calore.yml',
  'monuments/castello-arechi.yml',
  'monuments/baia-di-trentova.yml',
  'days/jueves-24.yml',
  'days/viernes-25.yml',
  'monuments/vesubio.yml',
  'monuments/stadio-maradona.yml',
  'days/domingo-27.yml',
  'days/lunes-28.yml',
  'monuments/napoli-sotterranea.yml',
  'monuments/capodimonte.yml',
  'days/sabado-26.yml',
  'monuments/casertavecchia.yml',
  'monuments/lago-d-averno.yml',
  'monuments/antro-della-sibilla.yml',
  'monuments/spiaggia-di-miseno.yml',
  'food/g-1-concettina.yml',
  'food/g-1-pizzeria-vomero.yml',
  'food/g-2-vannulo.yml',
  'food/g-3-caracale.yml',
  'food/g-3-il-focolare.yml',
  'food/g-3-la-lampara.yml',
  'food/g-4-il-brigante.yml',
  'food/g-5-trattoria-calore.yml',
  'reference/reservas.yml',
  'reference/practica.yml',
]

/** Caja de coordenadas del viaje: de Trentova (sur) a Casertavecchia (norte), de Forio al Calore. */
const BBOX = { minLat: 40.3, maxLat: 41.15, minLng: 13.8, maxLng: 15.3 }

const EYEBROW_RE = /^(lunes|martes|miércoles|jueves|viernes|sábado|domingo) · \d{1,2} de junio$/

/**
 * Claves de texto plano: un marcador aquí se pintaría con los `**` literales (Pitfall 4). Sale de
 * RESEARCH A.3 y de los `{{ }}` de los componentes: además de las filas, días, fichas y trip.yml,
 * los encabezados de Reservas (`headings.mesas` / `.visitas` / `.table`, ReservasSection.vue), el
 * `group` de Gastronomía (`p.gastro-section-title`), la marca (`brand.before` / `.after`, Topbar),
 * los `destinations` de la portada y la cabecera de una ficha de artista. `table` es seguro: los
 * strings de las filas de la tabla llevan su propia clave (`name`, `desc`…), así que solo
 * `headings.table` cae aquí. Es conservadora: alguna clave (`title`, `heading`, `footer`) es
 * Markdown en otra colección, pero ahí tampoco hace falta el marcador.
 */
const PLAIN_KEYS: ReadonlySet<string> = new Set([
  'time', 'header', 'title', 'eyebrow', 'subtitle', 'pill', 'roman', 'label', 'tag', 'icon',
  'address', 'footer', 'when', 'name', 'badge', 'italian', 'day', 'mapsQuery', 'itineraryTag',
  'alt', 'decoration', 'heroMeta', 'quote', 'quoteAttr', 'pageTitle', 'mapLegend', 'heading', 'area',
  'mesas', 'visitas', 'table', 'group', 'before', 'after', 'destinations',
  'avatar', 'dates', 'epithet', 'term',
])

/** Glifos de transporte que pone el CSS: una fila meta no empieza por ellos (D-07). */
const TRANSPORT_GLYPHS = ['🚌', '⛴', '🚗', '🚲', '✈']

const EMOJI_START = /^\p{Extended_Pictographic}/u

type Rec = Record<string, unknown>

const docsOf = (collection: CollectionName): Doc[] => campania.docs.filter(d => d.collection === collection)
const docByRel = (rel: string): Doc | undefined => campania.docs.find(d => d.rel === rel)
const dayOf = (slug: string): Rec | undefined => docsOf('day').find(d => d.slug === slug)?.data
const monumentOf = (slug: string): Rec | undefined => docsOf('monument').find(d => d.slug === slug)?.data
const tripData = (): Rec => docsOf('trip')[0]?.data ?? {}
const stringsOf = (doc: Doc): string[] => collectStrings(doc.data)
const asRecs = (v: unknown): Rec[] =>
  Array.isArray(v) ? v.filter((x): x is Rec => typeof x === 'object' && x !== null && !Array.isArray(x)) : []
const countOf = (text: string, needle: string): number => text.split(needle).length - 1

/** Recorre los strings de un valor con la clave que los contiene (los arrays heredan la del padre). */
function walkStrings(value: unknown, key: string | undefined, visit: (text: string, key: string | undefined) => void): void {
  if (typeof value === 'string') visit(value, key)
  else if (Array.isArray(value)) for (const v of value) walkStrings(v, key, visit)
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walkStrings(v, k, visit)
}

/** Strings de un doc salvo los que cuelgan de las claves `skip`. */
function stringsExcept(doc: Doc, skip: ReadonlySet<string>): string[] {
  const out: string[] = []
  walkStrings(doc.data, undefined, (text, key) => {
    if (key === undefined || !skip.has(key)) out.push(text)
  })
  return out
}

type RouteDay = Parameters<typeof routeCards>[0] & Parameters<typeof routeVisible>[0]
const asRouteDay = (day: Rec): RouteDay => day as unknown as RouteDay

describe('marcador ⚠ por confirmar (CAMP-06, D-12)', () => {
  it('Roma no contiene el marcador completo', () => {
    const text = roma.docs.flatMap(stringsOf).join('\n')
    expect(countOf(text, MARKER)).toBe(0)
  })

  it('en Campania el marcador va siempre en negrita y sin U+FE0F', () => {
    const text = campania.docs.flatMap(stringsOf).join('\n')
    expect(countOf(text, MARKER), 'cada marcador va envuelto en **…**').toBe(countOf(text, BOLD_MARKER))
    expect(text.includes('⚠️'), 'el ⚠ va sin el selector de variación U+FE0F').toBe(false)
  })

  it('ningún marcador en un campo de texto plano ni en stays[].area / stays[].note', () => {
    const bad: string[] = []
    for (const doc of campania.docs) {
      walkStrings(doc.data, undefined, (text, key) => {
        if (key !== undefined && PLAIN_KEYS.has(key) && text.includes(MARKER)) bad.push(`${doc.file}: ${key}`)
      })
    }
    for (const stay of asRecs(tripData().stays)) {
      for (const key of ['area', 'note']) {
        const v = stay[key]
        if (typeof v === 'string' && v.includes(MARKER)) bad.push(`trip.yml: stays[${String(stay.slug)}].${key} (no se pinta)`)
      }
    }
    expect(bad).toEqual([])
  })

  it.each(MARKER_FILES)('%s lleva el marcador', (rel) => {
    const doc = docByRel(rel)
    expect(doc, `${rel} existe`).toBeDefined()
    expect(stringsOf(doc!).join('\n')).toContain(BOLD_MARKER)
  })
})

describe('sin textos de Roma (D-03, D-09)', () => {
  const SKIP: ReadonlySet<string> = new Set(['src', 'mapsQuery'])

  it('ningún texto de Campania lleva una marca de Roma', () => {
    for (const doc of campania.docs) {
      expect(findRomaLeaks(stringsExcept(doc, SKIP).join('\n')), doc.file).toEqual([])
    }
  })

  it('cada eyebrow de día es «<día> · <n> de junio» en español', () => {
    for (const doc of docsOf('day')) {
      expect(String(doc.data.eyebrow), doc.file).toMatch(EYEBROW_RE)
    }
  })
})

describe('tramos y ruta (D-07, D-08)', () => {
  // Solo los días escritos: 13-06 hace que el registro cubra los diez días.
  it.each(Object.keys(WRITTEN_DAYS))('%s: stats, cabeceras y metas sin glifo de transporte', (slug) => {
    const day = dayOf(slug)
    expect(day, `${slug} existe`).toBeDefined()
    for (const stat of asRecs(day!.stats)) {
      expect(String(stat.text), `${slug}: stat`).not.toMatch(EMOJI_START)
    }
    const rows = timelineRowsOf(day!.timeline)
    for (const row of rows.filter(r => r.kind === 'transport')) {
      expect(String(row.header), `${slug}: cabecera de tramo`).not.toMatch(EMOJI_START)
    }
    for (const row of rows.filter(r => r.kind === 'meta')) {
      for (const item of asRecs(row.items)) {
        const text = String(item.text)
        expect(TRANSPORT_GLYPHS.some(g => text.startsWith(g)), `${slug}: meta «${text}»`).toBe(false)
      }
    }
  })

  it('un día con route.mode transit no pasa de 2 paradas (WR-01)', () => {
    for (const doc of docsOf('day')) {
      const route = doc.data.route as Rec | undefined | null
      if (route?.mode !== 'transit') continue
      expect(routeCards(asRouteDay(doc.data)).length, doc.file).toBeLessThanOrEqual(2)
    }
  })
})

describe('días escritos (CAMP-01, D-04)', () => {
  it.each(Object.entries(WRITTEN_DAYS))('%s: base, eyebrow y versión ligera', (slug, { stay }) => {
    const day = dayOf(slug)
    expect(day, `${slug} existe`).toBeDefined()
    if (stay === null) expect(day!.stay, `${slug} sin base`).toBeUndefined()
    else expect(day!.stay).toBe(stay)
    expect(String(day!.eyebrow)).toMatch(EYEBROW_RE)
    const light = day!.light as Rec | undefined
    expect(light, `${slug} tiene bloque light`).toBeDefined()
    expect(asRecs(light!.items).length).toBeGreaterThanOrEqual(1)
  })

  it('sábado 19: avión, Alibus y un tramo sin variante hasta el Vomero (D-07, D-08, D-26)', () => {
    const day = dayOf('sabado-19')!
    const top = asRecs(day.timeline)
    const planeIdx = top.findIndex(r => r.kind === 'transport' && r.variant === 'plane')
    expect(planeIdx, 'hay un tramo plane').toBeGreaterThanOrEqual(0)
    expect(top[planeIdx + 1], 'el tramo siguiente al avión es el autobús').toMatchObject({ kind: 'transport', variant: 'bus' })
    const plain = top.filter(r => r.kind === 'transport' && r.variant === undefined)
    expect(plain.length, 'hay un tramo sin variante').toBeGreaterThanOrEqual(1)
    expect(plain.some(r => /Metro|funicular/.test(collectStrings(r).join('\n'))), 'el tramo sin variante sube en metro o funicular').toBe(true)
    // D-26: el Alibus para en Garibaldi y el puerto y NO llega al Vomero.
    const bus = top[planeIdx + 1]!
    expect(collectStrings(bus).join('\n')).toContain('Piazza Garibaldi')
    expect(collectStrings(bus).join('\n')).toContain('no sube al Vomero')
    expect((day.route as Rec).enabled).toBe(false)
    const variants = asRecs(day.stats).map(s => s.variant)
    expect(variants).toEqual(expect.arrayContaining(['plane', 'bus']))
    expect(collectStrings(day).some(t => t.includes('16:35'))).toBe(true)
    expect(day.cards).toEqual(['vomero', 'lungomare-caracciolo'])
  })

  it('domingo 20: un ferry, una bici, sin ruta (D-07, D-08, D-26)', () => {
    const day = dayOf('domingo-20')!
    const top = asRecs(day.timeline)
    const transports = (v: string) => top.filter(r => r.kind === 'transport' && r.variant === v)
    expect(transports('ferry')).toHaveLength(1)
    expect(transports('bike')).toHaveLength(1)
    const stats = (v: string) => asRecs(day.stats).filter(s => s.variant === v)
    expect(stats('ferry')).toHaveLength(1)
    expect(stats('bike')).toHaveLength(1)
    expect('route' in day, 'el domingo 20 no lleva clave route').toBe(false)
    const ferry = transports('ferry')[0]!
    const ferryText = collectStrings(ferry).join('\n')
    expect(ferryText).toContain('Porta di Massa')
    expect(ferryText).toContain(BOLD_MARKER)
    // SC4: el coche no cruza a las islas; fechas de 2027 marcadas.
    const footnote = String(ferry.footnote ?? '')
    expect(footnote).toContain('no residentes')
    expect(footnote).toContain(BOLD_MARKER)
    const all = collectStrings(day)
    expect(all.some(t => t.includes('Molo Beverello'))).toBe(true)
    expect(all.some(t => t.includes('21 de junio de 2026'))).toBe(true)
    expect(day.cards).toEqual(['spaccanapoli', 'pozzo-vecchio', 'marina-corricella'])
  })

  it('lunes 21: ferry a Ischia y sin ruta (D-06, D-08)', () => {
    const day = dayOf('lunes-21')!
    const ferries = asRecs(day.timeline).filter(r => r.kind === 'transport' && r.variant === 'ferry')
    expect(ferries).toHaveLength(1)
    expect(collectStrings(ferries[0]).join('\n')).toContain(BOLD_MARKER)
    expect('route' in day, 'el lunes 21 no lleva clave route').toBe(false)
    const routeDay = asRouteDay(day)
    expect(routeVisible(routeDay, routeCards(routeDay).length)).toBe(false)
    expect(day.cards).toEqual(['terra-murata', 'forio'])
  })

  it('martes-22: Epomeo y Sorgeto, en transporte público, con su botón de ruta', () => {
    const day = dayOf('martes-22')!
    expect(day.cards).toEqual(['monte-epomeo', 'baia-di-sorgeto'])
    expect((day.route as Rec).mode).toBe('transit')
    const routeDay = asRouteDay(day)
    expect(routeVisible(routeDay, routeCards(routeDay).length)).toBe(true)
  })

  it('miércoles 23: ferry, Alibus, recogida del coche y Salerno (D-01, D-06)', () => {
    const day = dayOf('miercoles-23')!
    const top = asRecs(day.timeline)
    const variants = top.filter(r => r.kind === 'transport').map(r => r.variant)
    expect(variants).toEqual(expect.arrayContaining(['ferry', 'bus', 'car']))
    const pickup = top.find(r => r.kind === 'stop' && r.disabled === true && r.time === '16:00')
    expect(pickup, 'hay una parada sin ficha a las 16:00').toBeDefined()
    const pickupText = collectStrings(pickup).join('\n')
    expect(pickupText).toContain('Capodichino')
    expect(pickupText).toContain(BOLD_MARKER)
    expect('route' in day, 'el miércoles 23 no lleva clave route').toBe(false)
    const routeDay = asRouteDay(day)
    expect(routeVisible(routeDay, routeCards(routeDay).length)).toBe(false)
    expect(day.cards).toEqual(['salerno-centro-storico'])
  })

  it('jueves 24: dos alternativas seguidas y ruta en coche con las paradas comunes (D-01, D-05)', () => {
    const day = dayOf('jueves-24')!
    expect((day.route as Rec).mode).toBe('driving')
    const top = asRecs(day.timeline)
    const firstIdx = top.findIndex(r => r.kind === 'choice')
    expect(firstIdx, 'hay un primer choice').toBeGreaterThanOrEqual(0)
    const first = top[firstIdx]!
    expect(first.heading, 'el primer choice no lleva heading').toBeUndefined()
    const firstOptions = asRecs(first.options)
    expect(firstOptions.map(o => o.label)).toEqual(['Opción A', 'Opción B'])
    // Phase 12 D-04: con slow o «Caminar menos» se oculta toda la Opción B.
    const optB = firstOptions.find(o => o.label === 'Opción B')!
    for (const row of asRecs(optB.rows)) {
      expect(['stop', 'transport'], `Opción B: fila ${String(row.kind)}`).toContain(row.kind)
      expect(['medium', 'slow-only'], `Opción B: pace de ${String(row.kind)}`).toContain(row.pace)
    }
    const second = top[firstIdx + 1]
    expect(second?.kind, 'el primer choice va seguido de otro choice').toBe('choice')
    expect(String(second!.heading ?? '').trim(), 'el segundo choice lleva heading').not.toBe('')
    const secondOptions = asRecs(second!.options)
    expect(secondOptions).toHaveLength(3)
    expect(secondOptions.some(o => String(o.title).length >= 70), 'un título de 70 caracteres o más').toBe(true)
    const routeDay = asRouteDay(day)
    expect(routeCards(routeDay)).toEqual(['duomo-di-salerno', 'castello-arechi'])
    expect(routeCards(routeDay).length).toBeLessThan((day.cards as string[]).length)
    // BASE_TRANSPORT del e2e: exactamente un tramo a pie dentro de las alternativas.
    const choiceRows = top.filter(r => r.kind === 'choice').flatMap(c => asRecs(c.options).flatMap(o => asRecs(o.rows)))
    expect(choiceRows.filter(r => r.kind === 'transport' && r.variant === 'walk')).toHaveLength(1)
    // D-22: el concierto es el viernes 25.
    expect(collectStrings(day).filter(t => t.includes('Ultimo'))).toEqual([])
    expect(day.cards).toEqual(['duomo-di-salerno', 'castello-arechi', 'raito', 'baia-di-trentova', 'valle-del-calore'])
  })

  it('viernes 25: Ultimo el viernes, sin devolución del coche (D-01, D-22)', () => {
    const day = dayOf('viernes-25')!
    expect((day.route as Rec).mode).toBe('driving')
    // El e2e cuenta un punto de ruta por ficha: el viernes no tiene alternativas.
    expect(asRecs(day.timeline).some(r => r.kind === 'choice'), 'el viernes 25 no tiene choice').toBe(false)
    const concert = timelineRowsOf(day.timeline).find(r => r.kind === 'stop' && r.ref === 'stadio-maradona')
    expect(concert, 'hay una parada con ref stadio-maradona').toBeDefined()
    expect(String(concert!.title)).toContain('Ultimo')
    // D-01: el coche se devuelve el sábado 26, nunca el viernes.
    expect(collectStrings(day).filter(t => /devoluci/i.test(t))).toEqual([])
    const stadium = monumentOf('stadio-maradona')!
    expect(stadium.type).toBe('concert')
    expect(stadium.roman).toBe('♪')
    expect(stadium.badge).toBe('concierto')
    expect(day.cards).toEqual(['vesubio', 'rione-sanita', 'stadio-maradona'])
  })

  it('sábado 26: dos opciones en coche y devolución en Capodichino (D-01, D-05)', () => {
    const day = dayOf('sabado-26')!
    const top = asRecs(day.timeline)
    const choices = top.filter(r => r.kind === 'choice')
    expect(choices, 'un solo choice').toHaveLength(1)
    expect(asRecs(choices[0]!.options).map(o => o.label)).toEqual(['Opción 1', 'Opción 2'])
    expect((day.route as Rec).mode).toBe('driving')
    // Todas las fichas están dentro de las opciones: ninguna parada común, así que no hay botón.
    const routeDay = asRouteDay(day)
    expect(routeCards(routeDay)).toEqual([])
    expect(routeVisible(routeDay, routeCards(routeDay).length)).toBe(false)
    // D-01: la devolución del coche es una parada común, fuera del choice, sin ficha.
    const giveBack = top.find(r => r.kind === 'stop' && r.disabled === true && String(r.title).includes('Devolución del coche'))
    expect(giveBack, 'parada sin ficha «Devolución del coche» fuera del choice').toBeDefined()
    const giveBackText = collectStrings(giveBack).join('\n')
    expect(giveBackText).toContain('Capodichino')
    expect(giveBackText).toContain(BOLD_MARKER)
    expect(giveBackText).toContain('justificante')
    expect(top.indexOf(giveBack!), 'la devolución va después del choice').toBeGreaterThan(top.indexOf(choices[0]!))
    // D-05: el Partenio es solo prosa, sin ficha.
    expect(day.cards).toEqual(['casertavecchia', 'lago-d-averno', 'antro-della-sibilla', 'spiaggia-di-miseno'])
  })

  it('domingo 27: despedida, Napoli Sotterranea y PTN (D-06, D-08)', () => {
    const day = dayOf('domingo-27')!
    const rows = timelineRowsOf(day.timeline)
    expect(rows.some(r => r.kind === 'stop' && r.disabled === true && r.time === '10:00'), 'parada sin ficha a las 10:00').toBe(true)
    const concert = rows.find(r => r.kind === 'stop' && r.ref === 'stadio-maradona')
    expect(concert, 'hay una parada con ref stadio-maradona').toBeDefined()
    expect(String(concert!.title)).toContain('Pinguini Tattici Nucleari')
    // Pitfall 7: el estadio está en las fichas del viernes 25; listarlo aquí duplicaría su id.
    expect(day.cards as string[]).not.toContain('stadio-maradona')
    expect((day.route as Rec).enabled).toBe(false)
    expect(day.cards).toEqual(['napoli-sotterranea', 'capodimonte'])
  })

  it('lunes 28: vuelo a Palma y sin base (D-04, D-08)', () => {
    const day = dayOf('lunes-28')!
    const planes = asRecs(day.timeline).filter(r => r.kind === 'transport' && r.variant === 'plane')
    expect(planes.some(r => collectStrings(r).some(t => t.includes('09:55'))), 'un tramo plane con las 09:55').toBe(true)
    expect('stay' in day, 'el lunes 28 no lleva base').toBe(false)
    expect((day.route as Rec).enabled).toBe(false)
    expect(day.cards).toEqual([])
  })
})

describe('fichas escritas (CAMP-02, D-10, D-11)', () => {
  it.each(WRITTEN_MONUMENTS)('%s: foto de Wikimedia, nombre italiano, prosa, datos y coordenadas', (slug) => {
    const m = monumentOf(slug)
    expect(m, `${slug} existe`).toBeDefined()
    const hero = m!.hero as Rec
    expect(String(hero.src)).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//)
    expect(String(m!.italian).trim()).not.toBe('')
    expect(String(m!.mapsQuery).trim()).not.toBe('')
    const sections = asRecs(m!.sections)
    expect(sections.length).toBeGreaterThanOrEqual(1)
    expect(sections.some(s => typeof s.body === 'string' && s.body.trim() !== '')).toBe(true)
    expect(asRecs(m!.facts).length).toBeGreaterThanOrEqual(1)
    const { lat, lng } = m!.coords as { lat: number, lng: number }
    expect(lat).toBeGreaterThanOrEqual(BBOX.minLat)
    expect(lat).toBeLessThanOrEqual(BBOX.maxLat)
    expect(lng).toBeGreaterThanOrEqual(BBOX.minLng)
    expect(lng).toBeLessThanOrEqual(BBOX.maxLng)
  })

  it.each(FAMILY_REQUIRED)('%s: nota familiar', (slug) => {
    const m = monumentOf(slug)
    expect(m, `${slug} existe`).toBeDefined()
    expect(typeof m!.family === 'string' && m!.family.trim() !== '').toBe(true)
  })

  it.each(ADULTS_ONLY)('%s: sin caja «Con niños» ni consejo en «Con niños» de Práctica (WR-02)', (slug) => {
    expect(monumentOf(slug), `${slug} existe`).toBeDefined()
    expect(monumentOf(slug)!.family, `${slug}: family`).toBeUndefined()
    const kids = asRecs(docByRel('reference/practica.yml')?.data.sections).find(s => /niños/i.test(String(s.heading)))
    expect(kids, 'Práctica tiene «Con niños»').toBeDefined()
    expect(String(kids!.body), `«Con niños» no cita ${slug}`).not.toContain(`#${slug}`)
    expect(String(kids!.body), `«Con niños» no nombra ${String(monumentOf(slug)!.name)}`).not.toContain(String(monumentOf(slug)!.name))
  })

  it('baia-di-sorgeto: naturaleza termal, con escalones, linterna y el marcador en la nota familiar', () => {
    const m = monumentOf('baia-di-sorgeto')!
    expect(m.type).toBe('nature')
    expect(m.motif).toBe('thermal')
    const family = String(m.family)
    expect(family).toContain('escalones')
    expect(family).toContain('linterna')
    expect(family).toContain(BOLD_MARKER)
  })

  it('Raito y Albori están en Vietri sul Mare, no en el Cilento (D-26)', () => {
    const doc = docsOf('monument').find(d => d.slug === 'raito')
    expect(doc, 'raito existe').toBeDefined()
    expect(String(doc!.data.italian)).toContain('Vietri sul Mare')
    expect(stringsOf(doc!).filter(t => t.includes('Cilento'))).toEqual([])
    // Las coordenadas del esqueleto caían a unos 11 km de las gargantas (RESEARCH, XIV).
    const { lat, lng } = monumentOf('valle-del-calore')!.coords as { lat: number, lng: number }
    expect(Math.abs(lat - 40.3668)).toBeLessThanOrEqual(0.02)
    expect(Math.abs(lng - 15.2525)).toBeLessThanOrEqual(0.02)
  })
})

/**
 * Grupos de Gastronomía (D-15) en el orden en que se pintan. Ninguno está en el canon de Roma
 * (`FOOD_GROUP_ORDER`), así que `groupFood` los ordena por primera aparición, que sigue el orden
 * alfabético de los ficheros: los prefijos `g-1-`…`g-5-` de los slugs deciden el orden.
 */
const FOOD_GROUPS = [
  'Pizzerías de barrio · Nápoles',
  'Mozzarella di bufala · caseifici',
  'Las islas · cocina de Procida e Ischia',
  'Salerno · tabernas del centro storico',
  'Cilento · trattorias de monte',
] as const

/** Grupos ya escritos: los cinco de D-15. */
const FOOD_GROUPS_WRITTEN: readonly string[] = FOOD_GROUPS

/** Únicos establecimientos que la investigación verificó (RESEARCH «Verified establishments», D-14). */
const VERIFIED_NAMES: readonly string[] = [
  'Da Concettina ai Tre Santi',
  'Tenuta Vannulo',
  'Caracalè',
  'La Lampara',
  'Trattoria Il Focolare',
  'Hostaria Il Brigante',
]

const GENERIC_NAME_RE = /^Una? /

describe('gastronomía (CAMP-03, D-14, D-15)', () => {
  const food = docsOf('food')
  const groupIndex = (doc: Doc): number => (FOOD_GROUPS as readonly string[]).indexOf(String(doc.data.group))

  it('cada ficha pertenece a un grupo planificado', () => {
    expect(food.length).toBeGreaterThanOrEqual(1)
    for (const doc of food) expect(FOOD_GROUPS, doc.file).toContain(doc.data.group)
  })

  it('ordenadas por slug, los grupos salen en el orden planificado (D-15)', () => {
    const indexes = [...food].sort((a, b) => a.slug.localeCompare(b.slug)).map(groupIndex)
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))
  })

  it('cada grupo planificado tiene al menos una ficha', () => {
    for (const group of FOOD_GROUPS_WRITTEN) {
      expect(food.some(d => d.data.group === group), group).toBe(true)
    }
  })

  it('solo se nombran establecimientos verificados; el resto es genérico (D-14)', () => {
    for (const doc of food) {
      const name = String(doc.data.name)
      expect(VERIFIED_NAMES.includes(name) || GENERIC_NAME_RE.test(name), `${doc.file}: «${name}»`).toBe(true)
    }
  })

  it('una ficha genérica se elige sobre el terreno (D-14)', () => {
    for (const doc of food.filter(d => !VERIFIED_NAMES.includes(String(d.data.name)))) {
      expect(String(doc.data.address), doc.file).toContain('a elegir sobre el terreno')
    }
  })

  it('un establecimiento con nombre marca su horario en la descripción (D-12)', () => {
    for (const doc of food.filter(d => VERIFIED_NAMES.includes(String(d.data.name)))) {
      expect(String(doc.data.desc), doc.file).toContain(BOLD_MARKER)
    }
  })

  it('badgeKind nunca es de Roma (quinto, ghetto)', () => {
    for (const doc of food) expect(['quinto', 'ghetto'], doc.file).not.toContain(doc.data.badgeKind)
  })

  it('dirección, descripción y búsqueda de mapa no están vacías', () => {
    for (const doc of food) {
      for (const key of ['address', 'desc', 'mapsQuery']) {
        expect(String(doc.data[key] ?? '').trim(), `${doc.file}: ${key}`).not.toBe('')
      }
    }
  })
})

describe('datos personales (T-13-02)', () => {
  it('ningún teléfono internacional ni tira de 9 o más cifras', () => {
    const SKIP: ReadonlySet<string> = new Set(['src'])
    for (const doc of campania.docs) {
      for (const text of stringsExcept(doc, SKIP)) {
        expect(text, `${doc.file}: teléfono`).not.toMatch(/\+\d{2}\s?\d/)
        expect(text, `${doc.file}: cifras`).not.toMatch(/(?:\d[ .-]?){9,}/)
      }
    }
  })
})

describe('trip.yml (D-18, D-04, D-24)', () => {
  const trip = tripData()

  it('fechas, destinos y resumen de la portada', () => {
    expect(trip.startDate).toBe('2027-06-19')
    expect(trip.endDate).toBe('2027-06-28')
    expect(trip.destinations).toEqual(expect.arrayContaining(['Nápoles', 'Procida', 'Ischia', 'Salerno', 'Cilento']))
    expect(String(trip.summary ?? '').trim()).not.toBe('')
  })

  it('infoCards, howTo y el crédito de las fotos en el pie (D-24)', () => {
    expect(asRecs(trip.infoCards).length).toBeGreaterThanOrEqual(4)
    expect((trip.howTo as unknown[]).length).toBeGreaterThanOrEqual(2)
    expect((trip.footer as string[]).some(line => line.includes('Wikimedia Commons'))).toBe(true)
  })

  it('las cuatro bases, con Salerno llamada «Salerno» (D-04)', () => {
    const stays = asRecs(trip.stays)
    expect(new Set(stays.map(s => s.slug))).toEqual(new Set(['napoles', 'procida', 'ischia', 'salerno']))
    expect(stays.find(s => s.slug === 'salerno')?.name).toBe('Salerno')
  })

  it('mapa dentro de la caja del viaje, leyenda completa y sin marcadores extra', () => {
    const map = trip.map as { center: { lat: number, lng: number }, zoom: number }
    expect(map.center.lat).toBeGreaterThanOrEqual(BBOX.minLat)
    expect(map.center.lat).toBeLessThanOrEqual(BBOX.maxLat)
    expect(map.center.lng).toBeGreaterThanOrEqual(BBOX.minLng)
    expect(map.center.lng).toBeLessThanOrEqual(BBOX.maxLng)
    expect(map.zoom).toBe(9)
    expect(String(trip.mapLegend)).toContain('naturaleza')
    expect(String(trip.mapLegend)).toContain('conciertos')
    expect(trip.mapExtras).toBeUndefined()
  })

  it('la sección de gastronomía tiene su eyebrow', () => {
    const sections = trip.sections as { gastronomia?: { eyebrow: string } } | undefined
    expect(sections?.gastronomia?.eyebrow).toBe('Campania · gastronomía')
  })
})

describe('publicación (D-02)', () => {
  const trip = tripData()
  const howTo = (): string[] => (trip.howTo as unknown[]).map(String)

  it('el trip.yml ya no es borrador: sin draft: true', () => {
    expect(trip.draft).not.toBe(true)
  })

  it('howTo lleva solo los párrafos reales: ninguno habla de la Fase 12 ni de un borrador', () => {
    expect(howTo().length).toBeGreaterThanOrEqual(2)
    for (const paragraph of howTo()) {
      expect(paragraph, 'párrafo de howTo con la marca de control').not.toMatch(/Fase 12|borrador|CENTINELA/i)
    }
  })

  it('la tarjeta de la portada está completa: startDate, endDate, destinations y summary', () => {
    expect(String(trip.startDate ?? '')).not.toBe('')
    expect(String(trip.endDate ?? '')).not.toBe('')
    expect(Array.isArray(trip.destinations) && (trip.destinations as unknown[]).length > 0).toBe(true)
    expect(String(trip.summary ?? '').trim()).not.toBe('')
  })
})

/**
 * Numeral de marcador de las 24 fichas, por orden de visita (D-10): dentro de cada día siguen el
 * orden del timeline y, entre días, el orden de los días, como promete el `howTo` («El mapa marca
 * los puntos por orden de visita»). El estadio lleva ♪ como el concierto de Roma y queda fuera de
 * la secuencia. Los numerales son únicos (`markerByRoman` del e2e exige uno por marcador).
 */
const ROMANS: Record<string, string> = {
  'vomero': 'I',
  'lungomare-caracciolo': 'II',
  'spaccanapoli': 'III',
  'pozzo-vecchio': 'IV',
  'marina-corricella': 'V',
  'terra-murata': 'VI',
  'forio': 'VII',
  'monte-epomeo': 'VIII',
  'baia-di-sorgeto': 'IX',
  'salerno-centro-storico': 'X',
  'duomo-di-salerno': 'XI',
  'castello-arechi': 'XII',
  'raito': 'XIII',
  'baia-di-trentova': 'XIV',
  'valle-del-calore': 'XV',
  'vesubio': 'XVI',
  'rione-sanita': 'XVII',
  'stadio-maradona': '♪',
  'casertavecchia': 'XVIII',
  'lago-d-averno': 'XIX',
  'antro-della-sibilla': 'XX',
  'spiaggia-di-miseno': 'XXI',
  'napoli-sotterranea': 'XXII',
  'capodimonte': 'XXIII',
}

describe('numerales del mapa (D-10)', () => {
  it('cada ficha de Campania tiene su numeral final por orden de visita', () => {
    for (const doc of docsOf('monument')) {
      expect(Object.keys(ROMANS), `${doc.file}: slug con numeral asignado`).toContain(doc.slug)
      expect(doc.data.roman, doc.file).toBe(ROMANS[doc.slug])
    }
  })

  it('los numerales presentes son únicos', () => {
    const romans = docsOf('monument').map(d => String(d.data.roman))
    expect(romans.length).toBeGreaterThanOrEqual(1)
    expect(new Set(romans).size).toBe(romans.length)
  })

  /** Secuencia de numerales en orden; ♪ queda fuera, así que su posición es −1 y se ignora. */
  const SEQUENCE: readonly string[] = Object.values(ROMANS).filter(r => r !== '♪')
  const rankOf = (slug: string): number => SEQUENCE.indexOf(String(monumentOf(slug)?.roman))
  const daysInOrder = (): Doc[] => [...docsOf('day')].sort((a, b) => Number(a.data.order) - Number(b.data.order))

  it('dentro de cada día, las fichas siguen el orden del timeline (paradas con ref, por aparición)', () => {
    for (const d of daysInOrder()) {
      const cards = (d.data.cards as string[] | undefined) ?? []
      const firstSeen: string[] = []
      for (const row of timelineRowsOf(d.data.timeline)) {
        const ref = row.kind === 'stop' && typeof row.ref === 'string' ? row.ref : undefined
        if (ref && cards.includes(ref) && !firstSeen.includes(ref)) firstSeen.push(ref)
      }
      expect(firstSeen, `${d.file}: cada ficha tiene su parada`).toHaveLength(cards.length)
      expect(cards, `${d.file}: cards en orden de visita`).toEqual(firstSeen)
    }
  })

  it('los numerales crecen en orden de visita, dentro de cada día y de un día al siguiente', () => {
    const ranks: { slug: string, rank: number }[] = []
    for (const d of daysInOrder()) {
      for (const slug of (d.data.cards as string[] | undefined) ?? []) {
        const rank = rankOf(slug)
        if (rank >= 0) ranks.push({ slug, rank })
      }
    }
    expect(ranks.length, 'todas las fichas numeradas salen en algún día').toBe(SEQUENCE.length)
    expect(ranks.map(r => r.rank), ranks.map(r => r.slug).join(' → ')).toEqual(SEQUENCE.map((_, i) => i))
  })
})

/** Los diez días del viaje en su orden (D-03), con su pastilla. */
const DAY_SLUGS = [
  'sabado-19', 'domingo-20', 'lunes-21', 'martes-22', 'miercoles-23',
  'jueves-24', 'viernes-25', 'sabado-26', 'domingo-27', 'lunes-28',
] as const

const DAY_PILLS = ['Sáb 19', 'Dom 20', 'Lun 21', 'Mar 22', 'Mié 23', 'Jue 24', 'Vie 25', 'Sáb 26', 'Dom 27', 'Lun 28']

describe('los diez días y las 24 fichas (CAMP-01, CAMP-02, D-03, D-04, D-07, D-08)', () => {
  const days = [...docsOf('day')].sort((a, b) => Number(a.data.order) - Number(b.data.order))
  const transportsOf = (slug: string): unknown[] =>
    timelineRowsOf(dayOf(slug)!.timeline).filter(r => r.kind === 'transport').map(r => r.variant)
  const hasChoice = (day: Rec): boolean => asRecs(day.timeline).some(r => r.kind === 'choice')

  it('diez días con sus slugs, orden 1..10 y pastillas (D-03)', () => {
    expect(days.map(d => d.slug)).toEqual([...DAY_SLUGS])
    expect(days.map(d => d.data.order)).toEqual(DAY_SLUGS.map((_, i) => i + 1))
    expect(days.map(d => d.data.pill)).toEqual(DAY_PILLS)
    for (const d of days) expect(String(d.data.eyebrow), d.file).toMatch(EYEBROW_RE)
  })

  it('el registro de días escritos cubre los diez (D-04)', () => {
    expect(new Set(Object.keys(WRITTEN_DAYS))).toEqual(new Set(DAY_SLUGS))
  })

  it('cada tipo de tramo aparece en sus días (D-07)', () => {
    for (const slug of ['sabado-19', 'lunes-28']) expect(transportsOf(slug), `${slug}: plane`).toContain('plane')
    for (const slug of ['domingo-20', 'lunes-21', 'miercoles-23']) expect(transportsOf(slug), `${slug}: ferry`).toContain('ferry')
    expect(transportsOf('domingo-20'), 'domingo-20: bike').toContain('bike')
    for (const slug of ['miercoles-23', 'jueves-24', 'viernes-25', 'sabado-26']) expect(transportsOf(slug), `${slug}: car`).toContain('car')
    expect(DAY_SLUGS.some(slug => transportsOf(slug).includes('bus')), 'algún día en autobús').toBe(true)
  })

  it('el botón de ruta solo sale el martes 22, el jueves 24 y el viernes 25 (D-08)', () => {
    const visible = days.filter((d) => {
      const routeDay = asRouteDay(d.data)
      return routeVisible(routeDay, routeCards(routeDay).length)
    }).map(d => d.slug)
    expect(visible).toEqual(['martes-22', 'jueves-24', 'viernes-25'])
    for (const slug of ['sabado-19', 'domingo-27', 'lunes-28']) {
      expect((dayOf(slug)!.route as Rec | undefined)?.enabled, `${slug}: route.enabled`).toBe(false)
    }
  })

  it('solo el jueves 24 y el sábado 26 tienen alternativas (D-05)', () => {
    expect(days.filter(d => hasChoice(d.data)).map(d => d.slug)).toEqual(['jueves-24', 'sabado-26'])
  })

  it('las fichas son exactamente las 24 de ROMANS, con foto de Wikimedia', () => {
    const monuments = docsOf('monument')
    expect(Object.keys(ROMANS)).toHaveLength(24)
    expect(new Set(monuments.map(d => d.slug))).toEqual(new Set(Object.keys(ROMANS)))
    expect(monuments).toHaveLength(24)
    for (const m of monuments) {
      expect(String((m.data.hero as Rec).src), m.file).toMatch(/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//)
    }
    expect(monuments.filter(m => m.data.type === 'nature').length, 'al menos 3 de naturaleza').toBeGreaterThanOrEqual(3)
  })

  it('cada ficha está en las fichas de un solo día (Edge: ficha en dos días)', () => {
    const owners = new Map<string, string[]>()
    for (const d of days) {
      for (const slug of (d.data.cards as string[] | undefined) ?? []) owners.set(slug, [...(owners.get(slug) ?? []), d.slug])
    }
    for (const slug of Object.keys(ROMANS)) {
      expect(owners.get(slug) ?? [], `${slug}: días que lo listan`).toHaveLength(1)
    }
    expect([...owners.keys()].filter(slug => !(slug in ROMANS)), 'fichas listadas que no existen').toEqual([])
  })

  it('el estadio sale el domingo 27 solo como stop.ref (Pitfall 7)', () => {
    const sunday = dayOf('domingo-27')!
    expect(timelineRowsOf(sunday.timeline).some(r => r.kind === 'stop' && r.ref === 'stadio-maradona')).toBe(true)
    expect(sunday.cards as string[]).not.toContain('stadio-maradona')
  })
})

describe('reservas (CAMP-04, D-16, D-22, D-23)', () => {
  const doc = docByRel('reference/reservas.yml')
  const data = (): Rec => doc?.data ?? {}
  const headings = (): Rec => (data().headings as Rec | undefined) ?? {}
  const confirmed = (group: string): Rec[] => asRecs(data().confirmed).filter(c => c.group === group)
  const rows = (): Rec[] => asRecs(data().table)
  const names = (): string[] => rows().map(r => String(r.name))

  it('existe reference/reservas.yml', () => {
    expect(doc).toBeDefined()
  })

  it('los tres encabezados son propios: no vacíos y nunca los de Roma (D-23)', () => {
    for (const key of ['mesas', 'visitas', 'table'] as const) {
      const value = headings()[key]
      expect(typeof value, `headings.${key}`).toBe('string')
      expect(String(value).trim(), `headings.${key}`).not.toBe('')
      expect(value, `headings.${key} no es el texto de Roma`).not.toBe(RESERVAS_HEADINGS_DEFAULT[key])
    }
  })

  it('el primer bloque son los vuelos del sábado 19 y del lunes 28', () => {
    const flights = confirmed('mesas')
    const out = flights.find(c => String(c.when).startsWith('Sáb 19'))
    const back = flights.find(c => String(c.when).startsWith('Lun 28'))
    expect(out, 'vuelo de ida').toBeDefined()
    expect(back, 'vuelo de vuelta').toBeDefined()
    expect(String(out!.text)).toContain('Vuelo')
    expect(String(back!.text)).toContain('Vuelo')
  })

  it('las entradas de Ultimo son del viernes 25 y avisan del calendario oficial (D-22)', () => {
    const ultimo = confirmed('visitas').find(c => String(c.when).startsWith('Vie 25'))
    expect(ultimo, 'entradas del viernes 25').toBeDefined()
    expect(String(ultimo!.text)).toContain('Ultimo')
    expect(String(ultimo!.text)).toContain('calendario oficial')
  })

  it('la tabla tiene cada base, tres ferris y el coche (D-16, D-25, D-01)', () => {
    expect(names().filter(n => /^Alojamiento en Nápoles/.test(n)).length, 'Nápoles al menos dos veces').toBeGreaterThanOrEqual(2)
    for (const place of ['Procida', 'Ischia', 'Salerno']) {
      expect(names().filter(n => new RegExp(`^Alojamiento en ${place}`).test(n)), place).toHaveLength(1)
    }
    expect(names().filter(n => /^Ferry /.test(n)).length, 'tres ferris').toBeGreaterThanOrEqual(3)
    const car = rows().filter(r => /^Coche de alquiler/.test(String(r.name)))
    expect(car, 'una fila de coche').toHaveLength(1)
    expect(String(car[0]!.desc)).toContain('Capodichino')
    expect(String(car[0]!.desc)).toContain(BOLD_MARKER)
  })

  it('los dos conciertos y Napoli Sotterranea están en la tabla', () => {
    expect(names().some(n => n.includes('Ultimo')), 'Ultimo').toBe(true)
    expect(names().some(n => n.includes('Pinguini Tattici Nucleari')), 'Pinguini Tattici Nucleari').toBe(true)
    expect(rows().some(r => r.ref === 'napoli-sotterranea'), 'ref napoli-sotterranea').toBe(true)
  })
})

describe('práctica y marcador final (CAMP-05, CAMP-06, D-17)', () => {
  const doc = docByRel('reference/practica.yml')
  const sections = (): Rec[] => asRecs(doc?.data.sections)
  const bodies = (): string[] => sections().map(s => String(s.body))

  it('existe reference/practica.yml', () => {
    expect(doc).toBeDefined()
  })

  it('las secciones cubren ferris, ZTL, islas, calor, calzado, niños y conciertos (D-17)', () => {
    const headings = sections().map(s => String(s.heading)).join('\n')
    for (const re of [/ferri/i, /ZTL/, /islas/i, /calor/i, /calzado/i, /niños/i, /concierto/i]) {
      expect(headings, String(re)).toMatch(re)
    }
  })

  it('la noche del 25 el coche duerme en un garaje o aparcamiento, marcado (D-01)', () => {
    expect(bodies().some(b => /garaje|aparcamiento/.test(b) && b.includes(BOLD_MARKER))).toBe(true)
  })

  /** Cuerpo de la sección cuyo encabezado casa con `re` (vacío si no existe). */
  const bodyOf = (re: RegExp): string => String(sections().find(s => re.test(String(s.heading)))?.body ?? '')

  it('explica por qué el coche no cruza a Procida ni a Ischia', () => {
    // En la sección de conducir, no en «Ferris y puertos», que también nombra las dos islas.
    const driving = bodyOf(/coche en las islas/i)
    expect(driving, 'hay una sección de conducir que habla del coche en las islas').not.toBe('')
    expect(driving).toContain('Procida')
    expect(driving).toContain('Ischia')
    expect(driving).toMatch(/prohibi/)
    expect(driving).toContain('no residentes')
  })

  it('da las medias de junio: 28 °C de máxima y 18 °C de mínima', () => {
    const heat = bodyOf(/calor/i)
    expect(heat, 'hay una sección de calor').not.toBe('')
    expect(heat).toContain('**28 °C**')
    expect(heat).toContain('**18 °C**')
  })

  it('la guía lleva al menos 15 marcadores en total (CAMP-06)', () => {
    const text = campania.docs.flatMap(stringsOf).join('\n')
    expect(countOf(text, MARKER)).toBeGreaterThanOrEqual(15)
  })
})
