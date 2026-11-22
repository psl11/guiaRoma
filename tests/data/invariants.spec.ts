import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { stringify } from 'yaml'
import {
  RULES,
  checkTrip,
  checkTripsRoot,
  extractAnchors,
  formatViolations,
  listTripDirs,
  loadTrip,
  loadTripFromFiles,
  type Rule,
  type Violation,
} from './trips'

/**
 * Puerta de invariantes POR VIAJE (DATA-03 / PLAT-04 / SC4 de la Fase 9).
 *
 * zod valida la FORMA de cada fichero por separado (schema.spec.ts), pero no ve el resto del
 * viaje. Las invariantes ENTRE ficheros viven en `tests/data/trips.ts` (`checkTrip`, Node
 * puro) y este spec solo afirma que la lista de violaciones está vacía, usando esa misma
 * lista como mensaje: cada fallo nombra fichero + regla + detalle (D-10).
 *
 *  - D-09: se iteran TODAS las carpetas de content/trips con `describe.each`, borradores
 *    incluidos y con el mismo rigor. Estar incompleto no es error; estar roto sí.
 *  - D-05: slug de viaje ASCII `^[a-z0-9]+$` (TRIP_SLUG_RE) e igual a la carpeta.
 *  - D-10: ids únicos en el viaje, sin colisión con anclas fijas de TripView, sin claves
 *    reservadas de Content, sin ficheros fuera de las colecciones, sin YAML roto o vacío.
 *  - D-11: los enlaces `[t](#x)` resuelven DENTRO del viaje; no hay enlaces entre viajes.
 *  - D-12: los conteos por colección y migration-diff siguen siendo solo de Roma (no aquí).
 *
 * Fase 10 (forma desde datos) — reglas nuevas y endurecidas:
 *  - D-03 `day-pill`: etiquetas de pastilla únicas por viaje (misma `dayPillLabel` de la UI,
 *    comparación NFC + trim + minúsculas).
 *  - D-04 `day-order`: `order` de los días único y contiguo 1..N.
 *  - D-05 (a): un slug de día es un ancla reservada (`dup-id` / `fixed-anchor` lo cubren);
 *    (b): `cross-trip-link` es lista blanca — solo `#id` o `http(s)://` (cierra WR-02).
 *  - D-08 `anchor`: solo resuelve a las secciones que `buildTripLayout` emite para la presencia
 *    del YAML; `[x](#reservas)` sin reference/reservas.yml es rojo (cierra WR-01; el control
 *    negativo de la Fase 9 queda invertido).
 *
 * Fase 11 (portada) — reglas nuevas sobre trip.yml:
 *  - D-08 `trip-dates`: `endDate` no puede ser anterior a `startDate` (comparación de strings ISO).
 *  - D-07 `trip-summary-link`: el `summary` no lleva enlaces (Markdown `[t](x)`, autoenlace
 *    `<scheme:…>` ni URL suelta `http(s)://`/`www.`): la tarjeta de la portada ya es un `<a>`.
 *
 * Fase 12 (formas nuevas de viaje):
 *  - EXT-01 / Pitfall 3: la regla `ref` mira también DENTRO de las opciones de un `choice`
 *    (`timelineRowsOf` de trips.ts): un `stop` o una entrada de `food` con `ref` roto dentro de una
 *    opción es una violación `ref` del día; un `[x](#…)` roto en el `title`/`heading` de una opción
 *    lo atrapa `anchor`, que ya recorre todo el dato.
 *  - EXT-02 / D-06 `stay-ref`: el `stay` de cada día es el slug de una base de `trip.stays`
 *    (comparación exacta); un slug inexistente, también en un viaje sin `stays`, es una violación
 *    en el fichero del día («stay "<slug>" no existe en trip.yml stays»).
 *  - EXT-02 / D-06 `stay-dup`: los slugs de `trip.stays` son únicos; un slug repetido es una
 *    violación en trip.yml («stay "<slug>" duplicado en stays»).
 *
 * Fase 12.1 (títulos de Reservas por viaje; WR-01 de la revisión):
 *  - `reservas-headings`: un viaje que no es Roma y tiene reference/reservas.yml declara
 *    `headings.table` y el `headings.<grupo>` de cada grupo de `confirmed` con entradas, con texto
 *    visible; si falta, ese bloque heredaría el texto de Roma. La violación nombra el reservas.yml.
 *
 * Cierre G-09-3 (IN-05): la puerta no omite un `.YML`/`.Yaml` (extensión YAML sin distinguir
 * mayúsculas → `stray-file`) ni un fichero suelto en la raíz de content/trips/.
 * Cierre CR-01 (revisión de 09-06): tampoco omite una CARPETA oculta (`content/trips/.x/`), que
 * Content sí ingiere (`dot: true`): es una carpeta de viaje más y falla con `trip-slug`.
 * Cierre WR-01 (revisión de 09-06): un fichero no YAML y no oculto dentro de un viaje
 * (`galeria.json`, `galeria.yml~`…) es `stray-file`; los ocultos (.DS_Store, .gitkeep) se ignoran.
 * Cierre G-10-2 (WR-01/WR-03 de 10-REVIEW): toda forma de enlace que MDC pinta como `<a>` pasa por
 * la lista blanca o el ancla, y las formas no admitidas (`[r]: …`, `<a>` crudo, `{href=…}`) son
 * `cross-trip-link` con su fichero (WR-01).
 *
 * El bloque «la puerta tiene dientes» prueba cada regla con un fixture (en memoria con
 * `loadTripFromFiles` o en disco en tests/data/fixtures/trips/, NUNCA bajo content/).
 */

const FIXTURES = join(process.cwd(), 'tests', 'data', 'fixtures', 'trips')

// ── Invariantes sobre los viajes reales ───────────────────────────────────────
const trips = listTripDirs()

it('la puerta no está vacía (incluye el viaje roma)', () => {
  expect(trips).toContain('roma')
})

it('content/trips solo contiene carpetas de viaje: checkTripsRoot() sin violaciones', () => {
  const vs = checkTripsRoot()
  expect(vs, formatViolations(vs)).toEqual([])
})

describe.each(trips)('viaje %s', (dir) => {
  const violations = checkTrip(loadTrip(dir))
  it.each(RULES)('regla %s', (rule) => {
    const mine = violations.filter(v => v.rule === rule)
    expect(mine, formatViolations(mine)).toEqual([])
  })
})

// ── Fixtures en memoria ───────────────────────────────────────────────────────
const validTrip = {
  slug: 'prueba',
  title: 'Viaje de _prueba_',
  decoration: '·  PRUEBA  ·',
  heroMeta: '2027',
  quote: 'Cita.',
  quoteAttr: '— AUTOR',
  infoCards: [{ label: 'Alojamiento', value: '**Hotel**' }],
  howTo: ['Cómo usar la guía.'],
  map: { center: { lat: 41.9, lng: 12.48 }, zoom: 14 },
}

const validDay = {
  slug: 'viernes',
  trip: 'prueba',
  order: 1,
  roman: 'I',
  eyebrow: 'venerdì',
  title: 'Día',
  subtitle: 'Subtítulo',
  stats: [],
  timeline: [],
  cards: [] as string[],
}

const validMonument = {
  slug: 'galeria',
  trip: 'prueba',
  roman: 'I',
  name: 'Galería',
  italian: 'Galleria',
  day: 'Viernes',
  coords: { lat: 41.9, lng: 12.48 },
  type: 'card',
  motif: 'arch',
  hero: { src: 'https://example.org/x.jpg', alt: 'Galería' },
  sections: [{ heading: 'Qué es', body: 'Un patio.' }],
  facts: [{ label: 'Acceso', value: 'Gratuito' }],
  mapsQuery: 'Galleria',
}

const validFood = {
  slug: 'g-trattoria',
  trip: 'prueba',
  group: 'Trattorias',
  badge: 'trattoria',
  badgeKind: 'trattoria',
  name: 'Trattoria',
  address: 'Via X 1',
  desc: 'Cocina romana.',
  footer: '12-15h · €€',
  mapsQuery: 'Trattoria',
}

const y = (o: unknown) => stringify(o)

/** Un viaje en memoria con trip.yml válido para `dir` más los ficheros extra dados. */
function memTrip(dir: string, extra: Record<string, string> = {}, tripOver: Record<string, unknown> = {}) {
  return loadTripFromFiles(dir, { 'trip.yml': y({ ...validTrip, slug: dir, ...tripOver }), ...extra })
}

const monument = (dir: string, slug: string, over: Record<string, unknown> = {}) =>
  y({ ...validMonument, slug, trip: dir, ...over })

const withProse = (body: string) => ({ sections: [{ heading: 'Qué es', body }] })

/** Un día viernes que pinta las fichas dadas (cards). */
const onDay = (...cards: string[]) => ({ 'days/viernes.yml': y({ ...validDay, cards }) })

/** Afirma que hay al menos una violación `rule` cuyo fichero contiene `file`. */
function expectRule(vs: Violation[], rule: Rule, file: string) {
  expect(vs, formatViolations(vs)).toEqual(
    expect.arrayContaining([expect.objectContaining({ rule, file: expect.stringContaining(file) })]),
  )
}

describe('la puerta tiene dientes (fixtures)', () => {
  it('listTripDirs lista solo carpetas, ocultas incluidas, ordenadas (fixtures en disco)', () => {
    expect(listTripDirs(FIXTURES)).toEqual(['.oculto-dir', 'campania-2027', 'suelto'])
  })

  it('trip-slug: carpeta oculta en disco (.oculto-dir, CR-01) — Content la ingiere, la puerta no la omite', () => {
    const vs = checkTrip(loadTrip('.oculto-dir', FIXTURES))
    expect(vs, formatViolations(vs)).toEqual(expect.arrayContaining([expect.objectContaining({
      rule: 'trip-slug',
      file: 'tests/data/fixtures/trips/.oculto-dir/trip.yml',
      message: expect.stringContaining('.oculto-dir'),
    })]))
  })

  it('checkTripsRoot: fichero suelto en la raíz → stray-file; carpetas (también ocultas) y ficheros ocultos no (fixtures en disco)', () => {
    const vs = checkTripsRoot(FIXTURES)
    expect(vs, formatViolations(vs)).toEqual([{
      file: 'tests/data/fixtures/trips/raiz.yml',
      rule: 'stray-file',
      message: 'fichero suelto fuera de una carpeta de viaje (Content lo ignoraría)',
    }])
  })

  it('trip-slug: slug con guion en disco (campania-2027, D-05)', () => {
    const vs = checkTrip(loadTrip('campania-2027', FIXTURES))
    expect(vs).toEqual(expect.arrayContaining([expect.objectContaining({
      rule: 'trip-slug',
      file: 'tests/data/fixtures/trips/campania-2027/trip.yml',
      message: expect.stringContaining('campania-2027'),
    })]))
  })

  it('trip-yml + stray-file: carpeta sin trip.yml y con un YAML suelto (en disco)', () => {
    const vs = checkTrip(loadTrip('suelto', FIXTURES))
    expect(vs).toEqual(expect.arrayContaining([
      expect.objectContaining({ rule: 'trip-yml', file: 'tests/data/fixtures/trips/suelto/trip.yml' }),
      expect.objectContaining({ rule: 'stray-file', file: 'tests/data/fixtures/trips/suelto/notas.yml' }),
    ]))
  })

  it('trip-slug: slug "distinto" en la carpeta "otro"', () => {
    const vs = checkTrip(memTrip('otro', {}, { slug: 'distinto' }))
    expectRule(vs, 'trip-slug', 'content/trips/otro/trip.yml')
  })

  it('trip-field: monumento con trip "roma" en la carpeta "prueba"', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/galeria.yml': monument('roma', 'galeria') }))
    expectRule(vs, 'trip-field', 'content/trips/prueba/monuments/galeria.yml')
  })

  it('dup-id: monuments/x.yml y food/x.yml con el mismo slug nombran ambos ficheros', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/x.yml': monument('prueba', 'x'),
      'food/x.yml': y({ ...validFood, slug: 'x' }),
    }))
    expectRule(vs, 'dup-id', 'prueba/monuments/x.yml')
    expectRule(vs, 'dup-id', 'prueba/food/x.yml')
    const dup = vs.find(v => v.rule === 'dup-id')!
    expect(dup.message).toContain('monuments/x.yml')
    expect(dup.message).toContain('food/x.yml')
  })

  it('fixed-anchor: un monumento con slug "mapa" choca con TripView', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/mapa.yml': monument('prueba', 'mapa') }))
    expectRule(vs, 'fixed-anchor', 'prueba/monuments/mapa.yml')
  })

  it('fixed-anchor: un slug con prefijo "note-" choca con las notas de MonumentCard', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/note-a.yml': monument('prueba', 'note-a') }))
    expectRule(vs, 'fixed-anchor', 'prueba/monuments/note-a.yml')
  })

  it('reserved-key: "meta" en el nivel superior', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/galeria.yml': monument('prueba', 'galeria', { meta: 'x' }) }))
    expectRule(vs, 'reserved-key', 'prueba/monuments/galeria.yml')
  })

  it('unknown-key: "boxorder" (zod lo tiraría sin avisar)', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/galeria.yml': monument('prueba', 'galeria', { boxorder: 'notes-first' }) }))
    expectRule(vs, 'unknown-key', 'prueba/monuments/galeria.yml')
    expect(vs.find(v => v.rule === 'unknown-key')!.message).toContain('boxorder')
  })

  it('ref: day.cards apunta a un monumento inexistente', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': y({ ...validDay, cards: ['no-existe'] }) }))
    expectRule(vs, 'ref', 'prueba/days/viernes.yml')
  })

  it('anchor: [x](#pantheon) en "prueba" no resuelve (la ficha es de otro viaje)', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/galeria.yml': monument('prueba', 'galeria', withProse('Cerca del [Panteón](#pantheon).')),
    }))
    expectRule(vs, 'anchor', 'prueba/monuments/')
    expect(vs.find(v => v.rule === 'anchor')!.message).toContain('#pantheon')
  })

  it('anchor: [x](#Galeria) NO resuelve a "galeria" (comparación exacta, sin normalizar)', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/galeria.yml': monument('prueba', 'galeria', withProse('Ver [la galería](#Galeria).')),
    }))
    expectRule(vs, 'anchor', 'prueba/monuments/galeria.yml')
  })

  it('cross-trip-link: [x](/trips/roma#pantheon) no se admite (D-11)', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/galeria.yml': monument('prueba', 'galeria', withProse('Ver [Panteón](/trips/roma#pantheon).')),
    }))
    expectRule(vs, 'cross-trip-link', 'prueba/monuments/galeria.yml')
  })

  it('yaml-parse: un YAML que no parsea nombra su fichero', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/roto.yml': 'slug: [sin cerrar' }))
    expectRule(vs, 'yaml-parse', 'prueba/monuments/roto.yml')
  })

  it('yaml-object: un YAML vacío nombra su fichero', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/vacio.yml': '' }))
    expectRule(vs, 'yaml-object', 'prueba/monuments/vacio.yml')
  })

  it('stray-file: monuments/sub/x.yml no casa con ninguna colección', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/sub/x.yml': monument('prueba', 'x') }))
    expectRule(vs, 'stray-file', 'prueba/monuments/sub/x.yml')
  })

  // G-09-3 (IN-05): la extensión YAML se detecta sin distinguir mayúsculas; como los globs de
  // content.config.ts solo casan con `.yml` en minúsculas, un .YML/.Yaml es stray-file (y no se
  // carga como documento: toEqual estricto, sin basename-slug ni ninguna otra violación).
  it.each([
    'monuments/galeria.YML',
    'days/viernes.Yml',
    'food/g-trattoria.YAML',
    'reference/reservas.Yaml',
    'trip.YML',
    'monuments/galeria.yaml',
  ])('stray-file: %s es un YAML que Content no ingiere (sin distinguir mayúsculas)', (rel) => {
    const vs = checkTrip(memTrip('prueba', { [rel]: monument('prueba', 'galeria') }))
    expect(vs, formatViolations(vs)).toEqual([{
      file: `content/trips/prueba/${rel}`,
      rule: 'stray-file',
      message: 'fichero fuera de las colecciones (Content lo ignoraría)',
    }])
  })

  // WR-01 (revisión de 09-06): un fichero que no es YAML dentro de un viaje no se omite en
  // silencio (Content lo ignoraría): es stray-file con su ruta. toEqual estricto: no se carga.
  it.each([
    'monuments/galeria.json',
    'monuments/galeria.yml~',
    'monuments/galeria.yml.bak',
    'monuments/galeria.ym',
    'monuments/galeria.yml ',
    'notas.md',
  ])('stray-file: %s no es YAML y Content no lo ingiere', (rel) => {
    const vs = checkTrip(memTrip('prueba', { [rel]: '{}' }))
    expect(vs, formatViolations(vs)).toEqual([{
      file: `content/trips/prueba/${rel}`,
      rule: 'stray-file',
      message: 'fichero no YAML en la carpeta del viaje (Content lo ignoraría)',
    }])
  })

  it('los ficheros ocultos no YAML de un viaje (.DS_Store, .gitkeep) se ignoran (WR-01)', () => {
    const vs = checkTrip(memTrip('prueba', {
      '.DS_Store': 'x',
      'monuments/.gitkeep': '',
      '.cache/notas.txt': 'x',
    }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  it('basename-slug: monuments/a.yml con slug "b"', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/a.yml': monument('prueba', 'b') }))
    expectRule(vs, 'basename-slug', 'prueba/monuments/a.yml')
  })

  // ── D-03 (Fase 10): etiquetas de pastilla únicas por viaje, con la MISMA dayPillLabel de la UI ──
  /** Dos sábados (`sabado-19` / `sabado-26`) con los `pill` dados (undefined = sin pill). */
  const twoSaturdays = (pill19?: string, pill26?: string) => memTrip('prueba', {
    'days/sabado-19.yml': y({
      ...validDay, slug: 'sabado-19', order: 1, eyebrow: 'sábado · 19 de septiembre',
      ...(pill19 === undefined ? {} : { pill: pill19 }),
    }),
    'days/sabado-26.yml': y({
      ...validDay, slug: 'sabado-26', order: 2, eyebrow: 'sábado · 26 de septiembre',
      ...(pill26 === undefined ? {} : { pill: pill26 }),
    }),
  })

  it('day-pill: dos sábados sin pill derivan los dos «Sábado» → violación en AMBOS ficheros', () => {
    const vs = checkTrip(twoSaturdays())
    expectRule(vs, 'day-pill', 'prueba/days/sabado-19.yml')
    expectRule(vs, 'day-pill', 'prueba/days/sabado-26.yml')
    const msg = vs.find(v => v.rule === 'day-pill')!.message
    expect(msg).toContain('Sábado')
    expect(msg).toContain('days/sabado-19.yml')
    expect(msg).toContain('days/sabado-26.yml')
  })

  it('day-pill: con pill «Sáb 19» / «Sáb 26» no hay violación day-pill', () => {
    const vs = checkTrip(twoSaturdays('Sáb 19', 'Sáb 26'))
    expect(vs.filter(v => v.rule === 'day-pill'), formatViolations(vs)).toEqual([])
  })

  it('day-pill: «Sáb 19» frente a «sáb 19» colisionan (sin distinguir mayúsculas)', () => {
    const vs = checkTrip(twoSaturdays('Sáb 19', 'sáb 19'))
    expectRule(vs, 'day-pill', 'prueba/days/sabado-19.yml')
    expectRule(vs, 'day-pill', 'prueba/days/sabado-26.yml')
  })

  it('day-pill: «Sáb 19» en NFC frente a la misma en NFD colisionan (encoding)', () => {
    const nfd = 'Sáb 19'
    expect(nfd).not.toBe('Sáb 19')
    const vs = checkTrip(twoSaturdays('Sáb 19', nfd))
    expectRule(vs, 'day-pill', 'prueba/days/sabado-19.yml')
    expectRule(vs, 'day-pill', 'prueba/days/sabado-26.yml')
  })

  // Controles negativos: la puerta no da falsos rojos.
  it('D-09: un viaje con solo un trip.yml válido no tiene violaciones', () => {
    const vs = checkTrip(memTrip('borrador'))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  // ── D-04 (Fase 10): order único y contiguo 1..N ─────────────────────────────
  /** Un día `slug` con `order` dado; eyebrow distinto por slug para no disparar day-pill. */
  const dayFile = (slug: string, order: unknown) => y({ ...validDay, slug, order, eyebrow: `${slug} · x` })

  it('day-order: órdenes [1, 3] → violación en el día con 3 (esperado 2)', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': dayFile('viernes', 1), 'days/sabado.yml': dayFile('sabado', 3) }))
    expectRule(vs, 'day-order', 'prueba/days/sabado.yml')
    const v = vs.filter(x => x.rule === 'day-order')
    expect(v, formatViolations(v)).toHaveLength(1)
    expect(v[0]!.message).toContain('order 3 ≠ 2')
  })

  it('day-order: órdenes [1, 1] → violación (orden repetido)', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': dayFile('viernes', 1), 'days/sabado.yml': dayFile('sabado', 1) }))
    expect(vs.filter(v => v.rule === 'day-order'), formatViolations(vs)).toHaveLength(1)
  })

  it('day-order: un único día con order 2 → violación (debe empezar en 1)', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': dayFile('viernes', 2) }))
    expectRule(vs, 'day-order', 'prueba/days/viernes.yml')
  })

  it('day-order: un order no numérico es violación', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': dayFile('viernes', 'uno') }))
    expectRule(vs, 'day-order', 'prueba/days/viernes.yml')
  })

  it('day-order: [2, 1] en ficheros desordenados → sin violación (se ordena por order)', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/aaa.yml': dayFile('aaa', 2), 'days/zzz.yml': dayFile('zzz', 1) }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  // ── D-08 (Fase 10): `anchor` solo resuelve a las secciones presentes (WR-01) ──
  // `headings.table`: fuera de Roma la cabecera de la tabla necesita título propio (reservas-headings).
  const validReservas = {
    slug: 'reservas', trip: 'prueba', order: 1, title: 'Reservas', eyebrow: 'e', intro: 'i',
    headings: { table: 'Qué reservar' }, confirmed: [], table: [],
  }
  const validGlossary = {
    kind: 'glossary', slug: 'arq-glosario', trip: 'prueba', avatar: '?', name: 'Glosario', dates: '', epithet: '',
    terms: [{ term: 'Frontón', def: 'remate triangular' }],
  }
  const linkTo = (anchor: string) => monument('prueba', 'galeria', withProse(`Ver [la sección](#${anchor}).`))

  it('anchor: [x](#reservas) en un viaje sin ficheros reference → violación (control de la Fase 9 invertido)', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/galeria.yml': linkTo('reservas') }))
    expectRule(vs, 'anchor', 'prueba/monuments/galeria.yml')
    expect(vs.find(v => v.rule === 'anchor')!.message).toContain('#reservas')
  })

  it('anchor: [x](#reservas) con reference/reservas.yml válido → sin violaciones', () => {
    const vs = checkTrip(memTrip('prueba', {
      ...onDay('galeria'),
      'monuments/galeria.yml': linkTo('reservas'),
      'reference/reservas.yml': y(validReservas),
    }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  it('anchor: [x](#arte) en un viaje cuyo único artista es el glosario → violación', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/galeria.yml': linkTo('arte'),
      'artists/arq-glosario.yml': y(validGlossary),
    }))
    expectRule(vs, 'anchor', 'prueba/monuments/galeria.yml')
  })

  it('anchor: [x](#arquitectura) en un viaje cuyo único artista es el glosario → resuelve', () => {
    const vs = checkTrip(memTrip('prueba', {
      ...onDay('galeria'),
      'monuments/galeria.yml': linkTo('arquitectura'),
      'artists/arq-glosario.yml': y(validGlossary),
    }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  it('anchor: [x](#inicio) y [x](#mapa) resuelven en un viaje con solo trip.yml', () => {
    const vs = checkTrip(memTrip('borrador', {}, { quote: 'Ver [inicio](#inicio) y [el mapa](#mapa).' }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  // ── D-05 (a) (Fase 10): los slugs de día son anclas reservadas ──────────────
  it('dup-id (D-05a): monumento "lunes" + día "lunes" → dup-id en ambos ficheros', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/lunes.yml': monument('prueba', 'lunes'),
      'days/lunes.yml': dayFile('lunes', 1),
    }))
    expectRule(vs, 'dup-id', 'prueba/monuments/lunes.yml')
    expectRule(vs, 'dup-id', 'prueba/days/lunes.yml')
  })

  it('fixed-anchor (D-05a): un día con slug "mapa" choca con la sección fija', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/mapa.yml': dayFile('mapa', 1) }))
    expectRule(vs, 'fixed-anchor', 'prueba/days/mapa.yml')
  })

  // ── D-05 (b) (Fase 10): enlaces de prosa en lista blanca (WR-02) ─────────────
  it.each(['/#pantheon', '/guiaRoma/#x', '../roma#x', 'javascript:alert(1)'])(
    'cross-trip-link: el destino %s no está en la lista blanca',
    (target) => {
      const vs = checkTrip(memTrip('prueba', {
        'monuments/galeria.yml': monument('prueba', 'galeria', withProse(`Ver [esto](${target}).`)),
      }))
      expectRule(vs, 'cross-trip-link', 'prueba/monuments/galeria.yml')
    },
  )

  it('cross-trip-link: https://example.org/x se admite (sin violaciones)', () => {
    const vs = checkTrip(memTrip('prueba', {
      ...onDay('galeria'),
      'monuments/galeria.yml': monument('prueba', 'galeria', withProse('Ver [la web](https://example.org/x).')),
    }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  // ── G-10-2 / WR-01 (10-REVIEW): toda forma de enlace que MDC pinta como <a> pasa por la puerta ──
  // MDC (@nuxtjs/mdc 0.22.0, el parser de <MDC>) pinta <a> para TODAS las formas de (a) y (b),
  // comprobado con parseMarkdown el 2026-11-22: espacio o salto de línea tras el `(`, destino
  // `<…>`, referencias con su definición, <a> crudo, atributos MDC href, autoenlaces y emails
  // (GFM los convierte en mailto:). `<javascript:…>` pinta un <a> al que MDC quita el href.
  /** Un viaje con la ficha `galeria` en el día viernes y `body` como prosa de la ficha. */
  const galeriaWith = (body: string) => memTrip('prueba', {
    ...onDay('galeria'),
    'monuments/galeria.yml': monument('prueba', 'galeria', withProse(body)),
  })
  const GALERIA_FILE = 'content/trips/prueba/monuments/galeria.yml'

  it.each([
    'Ver [esto]( /trips/roma).',
    'Ver [esto](\n../roma#x).',
    'Ver [esto](</guiaRoma/#pantheon>).',
    'Ver [esto][r].\n\n[r]: /guiaRoma/#pantheon',
    'Ver [esto][r].\n\n[r]: #galeria',
    'Ver <a href="/trips/roma">esto</a>.',
    'Ver <A HREF="#galeria">esto</A>.',
    'Ver :a[esto]{href="/trips/roma"}.',
    '::a{href="/trips/roma"}\nesto\n::',
    'Escribe a <mailto:info@example.org>.',
    'Escribe a info@example.org.',
    'Ver <javascript:alert(1)>.',
  ])('G-10-2/WR-01 cross-trip-link: la forma %j pasa por la lista blanca (D-05b)', (body) => {
    const vs = checkTrip(galeriaWith(body))
    expect(vs.filter(v => v.rule === 'cross-trip-link'), formatViolations(vs)).toEqual([
      expect.objectContaining({ file: GALERIA_FILE }),
    ])
  })

  it.each([
    'Ver [esto]( #nope).',
    'Ver [esto](\n#nope).',
    'Ver [esto](<#nope>).',
  ])('G-10-2/WR-01 anchor: la forma %j se valida como ancla (D-08)', (body) => {
    const vs = checkTrip(galeriaWith(body))
    expect(vs.filter(v => v.rule === 'anchor' || v.rule === 'cross-trip-link'), formatViolations(vs)).toEqual([
      expect.objectContaining({ rule: 'anchor', file: GALERIA_FILE, message: expect.stringContaining('#nope') }),
    ])
  })

  it.each([
    'Ver [la galería]( #galeria ).',
    'Ver [la galería](<#galeria> "título").',
    'Ver <https://example.org/x>.',
    'Ver [la web](https://example.org/x "título").',
    '::detail-photo{src="https://example.org/x.jpg" alt="Galería" caption="Ver [la galería](#galeria)"}',
  ])('G-10-2/WR-01 control: la forma admitida %j no da violaciones', (body) => {
    const vs = checkTrip(galeriaWith(body))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  it.each(['Ver [el inicio]( #inicio).', 'Escribe a info@example.org'])(
    'G-10-2/WR-01 trip-summary-link: summary %j → violación en trip.yml',
    (summary) => {
      const vs = checkTrip(memTrip('prueba', {}, { summary }))
      expect(vs.filter(v => v.rule === 'trip-summary-link'), formatViolations(vs)).toEqual([{
        file: 'content/trips/prueba/trip.yml',
        rule: 'trip-summary-link',
        message: 'summary con enlace: la tarjeta de la portada ya es un enlace; quita [texto](destino)',
      }])
    },
  )

  // Advisory del plan-checker (10-06): un bloque MDC con props en frontmatter YAML también pinta
  // <a href> — parseMarkdown da `a {href: "/trips/roma"}` (y `a {to: …}`) —, así que se rechaza.
  it.each([
    '::a\n---\nhref: /trips/roma\n---\nesto\n::',
    '::a\n---\nto: /trips/roma\n---\nesto\n::',
  ])('G-10-2 (advisory) cross-trip-link: bloque MDC con props en frontmatter %j se rechaza (D-05b)', (body) => {
    const vs = checkTrip(galeriaWith(body))
    expect(vs.filter(v => v.rule === 'cross-trip-link'), formatViolations(vs)).toEqual([
      expect.objectContaining({ file: GALERIA_FILE }),
    ])
  })

  // ── G-10-2 / WR-03 (10-REVIEW): cada ficha se pinta exactamente una vez ───────────────────────
  // MonumentCard (el único elemento con id=<slug> de una ficha) solo se pinta desde day.cards
  // (DaySection: day.cards → monById → MonumentCard). Una ficha sin día no existe en el DOM y una
  // ficha en dos días duplica su id.
  /** El artista art-x con un seenIn a `ref`. */
  const artistSeeing = (ref: string) => y({
    kind: 'artist', slug: 'art-x', trip: 'prueba', avatar: 'X', name: 'Artista', dates: 'd', epithet: 'e',
    sections: [], seenIn: [{ ref, label: 'La galería' }],
  })

  it('G-10-2/WR-03 card-placement: una ficha que no está en el cards de ningún día → violación en su fichero', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/galeria.yml': monument('prueba', 'galeria') }))
    expect(vs, formatViolations(vs)).toEqual([{
      file: 'content/trips/prueba/monuments/galeria.yml',
      rule: 'card-placement',
      message: 'ficha "galeria" no está en el cards de ningún día: MonumentCard no la pinta y #galeria no existe en la guía (D-08)',
    }])
  })

  it('G-10-2/WR-03 anchor: [x](#galeria) a una ficha sin día no resuelve (no existe en el DOM)', () => {
    const vs = checkTrip(memTrip('prueba', {
      ...onDay('otra'),
      'monuments/galeria.yml': monument('prueba', 'galeria'),
      'monuments/otra.yml': monument('prueba', 'otra', withProse('Ver [la galería](#galeria).')),
    }))
    expect(vs.filter(v => v.rule === 'anchor'), formatViolations(vs)).toEqual([
      expect.objectContaining({ file: 'content/trips/prueba/monuments/otra.yml', message: expect.stringContaining('#galeria') }),
    ])
  })

  it('G-10-2/WR-03 card-placement: la misma ficha en el cards de dos días → violación en los dos ficheros de día', () => {
    const vs = checkTrip(memTrip('prueba', {
      ...onDay('galeria'),
      'days/sabado.yml': y({ ...validDay, slug: 'sabado', order: 2, eyebrow: 'sabato', cards: ['galeria'] }),
      'monuments/galeria.yml': monument('prueba', 'galeria'),
    }))
    const message = 'ficha "galeria" aparece 2 veces en cards (content/trips/prueba/days/sabado.yml, content/trips/prueba/days/viernes.yml): id #galeria duplicado en el DOM (D-08)'
    expect(vs, formatViolations(vs)).toEqual([
      { file: 'content/trips/prueba/days/sabado.yml', rule: 'card-placement', message },
      { file: 'content/trips/prueba/days/viernes.yml', rule: 'card-placement', message },
    ])
  })

  it('G-10-2/WR-03 card-placement: la misma ficha dos veces en el cards de un día → violación en ese día', () => {
    const vs = checkTrip(memTrip('prueba', {
      ...onDay('galeria', 'galeria'),
      'monuments/galeria.yml': monument('prueba', 'galeria'),
    }))
    expect(vs, formatViolations(vs)).toEqual([{
      file: 'content/trips/prueba/days/viernes.yml',
      rule: 'card-placement',
      message: 'ficha "galeria" aparece 2 veces en cards (content/trips/prueba/days/viernes.yml): id #galeria duplicado en el DOM (D-08)',
    }])
  })

  it('G-10-2/WR-03 ref: seenIn a una ficha sin día → violación en el fichero del artista', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/galeria.yml': monument('prueba', 'galeria'),
      'artists/art-x.yml': artistSeeing('galeria'),
    }))
    expect(vs.filter(v => v.rule === 'ref'), formatViolations(vs)).toEqual([{
      file: 'content/trips/prueba/artists/art-x.yml',
      rule: 'ref',
      message: 'seenIn ref "galeria" es una ficha que no se pinta en ningún día (cards)',
    }])
  })

  it('G-10-2/WR-03 ref: un stop del timeline con ref a una ficha sin día no resuelve', () => {
    const vs = checkTrip(memTrip('prueba', {
      'days/viernes.yml': y({ ...validDay, timeline: [{ kind: 'stop', pace: 'all', time: '10:00', title: 'Galería', ref: 'galeria' }] }),
      'monuments/galeria.yml': monument('prueba', 'galeria'),
    }))
    expect(vs.filter(v => v.rule === 'ref'), formatViolations(vs)).toEqual([{
      file: 'content/trips/prueba/days/viernes.yml',
      rule: 'ref',
      message: 'timeline stop ref "galeria" no resuelve',
    }])
  })

  it('G-10-2/WR-03 control: ficha en un solo día, enlazada desde otra ficha, desde seenIn y desde un stop → sin violaciones', () => {
    const vs = checkTrip(memTrip('prueba', {
      'days/viernes.yml': y({
        ...validDay,
        cards: ['galeria', 'otra'],
        timeline: [{ kind: 'stop', pace: 'all', time: '10:00', title: 'Galería', ref: 'galeria' }],
      }),
      'monuments/galeria.yml': monument('prueba', 'galeria'),
      'monuments/otra.yml': monument('prueba', 'otra', withProse('Ver [la galería](#galeria).')),
      'artists/art-x.yml': artistSeeing('galeria'),
    }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  // ── Fase 11 (portada, D-08/D-07): fechas del viaje y resumen sin enlaces ─────
  /** Violaciones de una sola regla en un viaje en memoria con solo trip.yml (+ los campos dados). */
  const tripRule = (rule: Rule, over: Record<string, unknown>) =>
    checkTrip(memTrip('prueba', {}, over)).filter(v => v.rule === rule)

  it('trip-dates: endDate 2026-06-18 anterior a startDate 2026-06-19 → una violación en trip.yml', () => {
    expect(tripRule('trip-dates', { startDate: '2026-06-19', endDate: '2026-06-18' })).toEqual([{
      file: 'content/trips/prueba/trip.yml',
      rule: 'trip-dates',
      message: 'endDate (2026-06-18) anterior a startDate (2026-06-19)',
    }])
  })

  it('trip-dates: fechas iguales → sin violación', () => {
    expect(tripRule('trip-dates', { startDate: '2026-06-19', endDate: '2026-06-19' })).toEqual([])
  })

  it('trip-dates: solo endDate → sin violación', () => {
    expect(tripRule('trip-dates', { endDate: '2026-06-23' })).toEqual([])
  })

  it.each(['[x](#inicio)', 'Ver https://example.org', '<https://example.org>', 'Ver www.example.org'])(
    'trip-summary-link: summary %j → violación en trip.yml',
    (summary) => {
      expect(tripRule('trip-summary-link', { summary })).toEqual([{
        file: 'content/trips/prueba/trip.yml',
        rule: 'trip-summary-link',
        message: 'summary con enlace: la tarjeta de la portada ya es un enlace; quita [texto](destino)',
      }])
    },
  )

  it('trip-summary-link: «Cinco días a pie por Roma.» → sin violaciones', () => {
    const vs = checkTrip(memTrip('prueba', {}, { summary: 'Cinco días a pie por Roma.' }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  // ── Fase 12 (EXT-01, Pitfall 3): la puerta mira DENTRO de las opciones de un `choice` ─────
  /** Un día `viernes` con un `choice` de dos opciones; la primera lleva las filas dadas. */
  const dayWithChoice = (rows: unknown[], title = 'Opción con filas', cards: string[] = []) => y({
    ...validDay,
    cards,
    timeline: [{
      kind: 'choice',
      options: [
        { label: 'Opción A', title, rows },
        { label: 'Opción B', title: 'La otra', rows: [{ kind: 'stop', pace: 'all', time: '10:00', title: 'Paseo' }] },
      ],
    }],
  })

  it('ref: un stop con ref roto dentro de una opción de un choice nombra el fichero del día', () => {
    const vs = checkTrip(memTrip('prueba', {
      'days/viernes.yml': dayWithChoice([{ kind: 'stop', pace: 'all', time: '11:00', title: 'Parada', ref: 'nope' }]),
    }))
    expectRule(vs, 'ref', 'prueba/days/viernes.yml')
    expect(vs.find(v => v.rule === 'ref')!.message).toContain('"nope"')
  })

  it('ref: una entrada de food con ref roto dentro de una opción de un choice es una violación', () => {
    const vs = checkTrip(memTrip('prueba', {
      'days/viernes.yml': dayWithChoice([{
        kind: 'food', pace: 'all', header: 'Comer', entries: [{ name: 'Trattoria', ref: 'nope', desc: 'Cocina.' }],
      }]),
    }))
    expectRule(vs, 'ref', 'prueba/days/viernes.yml')
    expect(vs.find(v => v.rule === 'ref')!.message).toContain('"nope"')
  })

  it('ref: un stop dentro de una opción con ref a un monumento existente → sin violaciones', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/galeria.yml': monument('prueba', 'galeria'),
      'days/viernes.yml': dayWithChoice([{ kind: 'stop', pace: 'all', time: '11:00', title: 'Galería', ref: 'galeria' }], 'Opción con filas', ['galeria']),
    }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  it('anchor: [x](#nope) en el title de una opción de un choice es una violación anchor', () => {
    const vs = checkTrip(memTrip('prueba', {
      'days/viernes.yml': dayWithChoice([{ kind: 'stop', pace: 'all', time: '11:00', title: 'Parada' }], 'Ver [x](#nope)'),
    }))
    expectRule(vs, 'anchor', 'prueba/days/viernes.yml')
    expect(vs.find(v => v.rule === 'anchor')!.message).toContain('#nope')
  })

  // ── Fase 12 (EXT-02, D-06): cada `day.stay` es una base declarada en `trip.stays` ─────────
  const twoStays = [{ slug: 'napoles', name: 'Nápoles' }, { slug: 'salerno', name: 'Salerno' }]
  const dayStaying = (stay: string) => y({ ...validDay, stay })

  it('stay-ref: un día con stay "nope" en un viaje con stays → una violación en el fichero del día', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': dayStaying('nope') }, { stays: twoStays }))
    expect(vs.filter(v => v.rule === 'stay-ref'), formatViolations(vs)).toEqual([{
      file: 'content/trips/prueba/days/viernes.yml',
      rule: 'stay-ref',
      message: 'stay "nope" no existe en trip.yml stays',
    }])
  })

  it('stay-ref: un día con stay en un viaje SIN stays también es una violación', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': dayStaying('x') }))
    expect(vs.filter(v => v.rule === 'stay-ref'), formatViolations(vs)).toEqual([{
      file: 'content/trips/prueba/days/viernes.yml',
      rule: 'stay-ref',
      message: 'stay "x" no existe en trip.yml stays',
    }])
  })

  it('stay-ref: la referencia es exacta (stay "Salerno" no resuelve a la base "salerno")', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': dayStaying('Salerno') }, { stays: twoStays }))
    expectRule(vs, 'stay-ref', 'prueba/days/viernes.yml')
  })

  it('stay-dup: dos bases con slug "procida" → violación en trip.yml', () => {
    const stays = [{ slug: 'procida', name: 'Procida' }, { slug: 'ischia', name: 'Ischia' }, { slug: 'procida', name: 'Procida bis' }]
    const vs = checkTrip(memTrip('prueba', {}, { stays }))
    expect(vs.filter(v => v.rule === 'stay-dup'), formatViolations(vs)).toEqual([{
      file: 'content/trips/prueba/trip.yml',
      rule: 'stay-dup',
      message: 'stay "procida" duplicado en stays',
    }])
  })

  it('stay-ref / stay-dup: día y base coincidentes → sin violaciones', () => {
    const vs = checkTrip(memTrip('prueba', { 'days/viernes.yml': dayStaying('salerno') }, { stays: twoStays }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  // ── Fase 12.1 (WR-01): fuera de Roma, cada bloque de Reservas que se pinta lleva título propio ──
  const reservasFile = (dir: string, over: Record<string, unknown> = {}) => y({
    slug: 'reservas', trip: dir, order: 1, title: 'Reservas', eyebrow: 'e', intro: 'i', confirmed: [], table: [], ...over,
  })
  const entry = (group: 'mesas' | 'visitas') => ({ group, when: 'Vie 1', text: 'Algo reservado' })
  const headingViolations = (vs: Violation[]) => vs.filter(v => v.rule === 'reservas-headings')

  it('reservas-headings: sin headings y con los dos grupos llenos → tres violaciones en reservas.yml', () => {
    const vs = checkTrip(memTrip('prueba', {
      'reference/reservas.yml': reservasFile('prueba', { confirmed: [entry('mesas'), entry('visitas')] }),
    }))
    const file = 'content/trips/prueba/reference/reservas.yml'
    expect(headingViolations(vs), formatViolations(vs)).toEqual([
      { file, rule: 'reservas-headings', message: 'falta headings.mesas: heredaría el texto de Roma («✅ Ya reservado · 3 comensales»)' },
      { file, rule: 'reservas-headings', message: 'falta headings.visitas: heredaría el texto de Roma («🎟️ Visitas y entradas reservadas»)' },
      { file, rule: 'reservas-headings', message: 'falta headings.table: heredaría el texto de Roma («Restaurantes · cuándo reservar y con cuánta antelación»)' },
    ])
  })

  it('reservas-headings: olvidar solo table (el caso Campania de la revisión) → una violación', () => {
    const vs = checkTrip(memTrip('prueba', {
      'reference/reservas.yml': reservasFile('prueba', {
        headings: { mesas: '✈️ Vuelos, barcos y coche', visitas: '🎟️ Conciertos' },
        confirmed: [entry('mesas'), entry('visitas')],
      }),
    }))
    expect(headingViolations(vs).map(v => v.message), formatViolations(vs)).toEqual([
      'falta headings.table: heredaría el texto de Roma («Restaurantes · cuándo reservar y con cuánta antelación»)',
    ])
  })

  it('reservas-headings: un título null o solo espacios cuenta como ausente', () => {
    const vs = checkTrip(memTrip('prueba', {
      'reference/reservas.yml': reservasFile('prueba', { headings: { mesas: null, table: '   ' }, confirmed: [entry('mesas')] }),
    }))
    expect(headingViolations(vs).map(v => v.message.split(':')[0]), formatViolations(vs)).toEqual([
      'falta headings.mesas',
      'falta headings.table',
    ])
  })

  it('reservas-headings: un grupo sin entradas no necesita título (solo visitas → mesas no se exige)', () => {
    const vs = checkTrip(memTrip('prueba', {
      'reference/reservas.yml': reservasFile('prueba', {
        headings: { visitas: '🎟️ Conciertos', table: 'Qué reservar' },
        confirmed: [entry('visitas')],
      }),
    }))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  it('reservas-headings: Roma queda exenta (sus textos son los defaults)', () => {
    const vs = checkTrip(memTrip('roma', {
      'reference/reservas.yml': reservasFile('roma', { confirmed: [entry('mesas'), entry('visitas')] }),
    }))
    expect(headingViolations(vs), formatViolations(vs)).toEqual([])
  })
})

// ── extractAnchors (helper puro) ──────────────────────────────────────────────
describe('extractAnchors', () => {
  it('saca las anclas internas y NO las URLs externas', () => {
    const md = 'Cerca de [Trevi](#fontana-trevi) y [Maps](https://maps.google.com/?q=x), ver [Pozzo](#art-pozzo).'
    expect(extractAnchors(md)).toEqual(['fontana-trevi', 'art-pozzo'])
  })

  it('captura un archLink inline (Barroco → #art-bernini)', () => {
    const body = 'El Barroco lo encarnan [Bernini](#art-bernini) y [Borromini](#art-borromini).'
    const anchors = extractAnchors(body)
    expect(anchors).toContain('art-bernini')
    expect(anchors).toContain('art-borromini')
  })
})
