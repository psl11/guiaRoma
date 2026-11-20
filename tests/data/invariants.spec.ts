import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { stringify } from 'yaml'
import {
  RULES,
  checkTrip,
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
 * El bloque «la puerta tiene dientes» prueba cada regla con un fixture (en memoria con
 * `loadTripFromFiles` o en disco en tests/data/fixtures/trips/, NUNCA bajo content/).
 */

const FIXTURES = join(process.cwd(), 'tests', 'data', 'fixtures', 'trips')

// ── Invariantes sobre los viajes reales ───────────────────────────────────────
const trips = listTripDirs()

it('la puerta no está vacía (incluye el viaje roma)', () => {
  expect(trips).toContain('roma')
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

/** Afirma que hay al menos una violación `rule` cuyo fichero contiene `file`. */
function expectRule(vs: Violation[], rule: Rule, file: string) {
  expect(vs, formatViolations(vs)).toEqual(
    expect.arrayContaining([expect.objectContaining({ rule, file: expect.stringContaining(file) })]),
  )
}

describe('la puerta tiene dientes (fixtures)', () => {
  it('listTripDirs lista solo carpetas, ordenadas (fixtures en disco)', () => {
    expect(listTripDirs(FIXTURES)).toEqual(['campania-2027', 'suelto'])
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

  it('basename-slug: monuments/a.yml con slug "b"', () => {
    const vs = checkTrip(memTrip('prueba', { 'monuments/a.yml': monument('prueba', 'b') }))
    expectRule(vs, 'basename-slug', 'prueba/monuments/a.yml')
  })

  // Controles negativos: la puerta no da falsos rojos.
  it('D-09: un viaje con solo un trip.yml válido no tiene violaciones', () => {
    const vs = checkTrip(memTrip('borrador'))
    expect(vs, formatViolations(vs)).toEqual([])
  })

  it('[x](#reservas) resuelve aunque el viaje no tenga ficheros reference', () => {
    const vs = checkTrip(memTrip('prueba', {
      'monuments/galeria.yml': monument('prueba', 'galeria', withProse('Ver [reservas](#reservas).')),
    }))
    expect(vs, formatViolations(vs)).toEqual([])
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
