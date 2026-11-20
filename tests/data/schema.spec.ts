import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  MonumentSchema,
  DaySchema,
  ArtistSchema,
  ReferenceSchema,
  TripSchema,
} from '../../shared/schemas'
import { COLLECTIONS, listTripDirs, loadTrip, type CollectionName } from './trips'

/**
 * Puerta de validación de esquema (DATA-05 / DATA-02 / DATA-06).
 *
 * Hallazgo crítico (nuxt/content#3351): Content v3 NO valida las colecciones `type:'data'`
 * contra zod en build — un dato inválido (motif fuera del enum, campo requerido ausente)
 * pasaría silenciosamente. ESTE test es la verdadera puerta: lee cada `.yml` con `yaml.parse`
 * (mismo parser que el transformer interno de Content para un objeto plano) y ejecuta
 * `Schema.safeParse` por FICHERO (un `it` por fichero → locus de fallo claro).
 *
 * NO usa `queryCollection` (RESEARCH 617): Content "limpia" los datos inválidos (defaults/meta)
 * y ocultaría justo los fallos que DATA-05 debe atrapar. Node puro: el loader compartido de
 * `./trips` (readFileSync + yaml.parse) + safeParse, sin runtime Nuxt ni SQLite.
 *
 *  - PLAT-04 / D-09: se valida CADA fichero de CADA carpeta de content/trips (`describe.each`),
 *    borradores incluidos; el mensaje nombra el fichero y el detalle de `z.prettifyError`.
 *  - D-05: TripSchema exige un slug ASCII `^[a-z0-9]+$` (TRIP_SLUG_RE).
 *  - DATA-05: un dato inválido (enum/required/tipo) FALLA safeParse (casos fixture in-line).
 *  - DATA-02: un día con timeline discriminado por `kind` + `pace` por fila valida.
 *  - DATA-06: los campos de prosa (`Md`) son strings (Markdown-inline, render en Fase 4).
 *  - D-12: el `describe` de conteo (1/5/38/26/13/2) sigue siendo SOLO de Roma.
 *
 * Los casos fixture corren siempre: garantizan que la PUERTA existe (evita un test vacuo verde).
 */

// ── Validación por fichero de TODOS los viajes (D-09, PLAT-04) ────────────────
// Borradores incluidos y con el mismo rigor: cada YAML de cada carpeta de content/trips se
// valida con el esquema ESTRICTO de su colección (uniones incluidas). El mensaje es el
// fichero seguido de `z.prettifyError` (formato «✖ … → at campo»), legible en un PR.
// Los YAML que no parsean / no son objeto / no casan con una colección los señala
// invariants.spec.ts (reglas yaml-parse, yaml-object, stray-file) con su fichero.
const strictOf = new Map(COLLECTIONS.map(c => [c.name, c.strict]))

describe.each(listTripDirs())('esquema · viaje %s', (dir) => {
  const t = loadTrip(dir)

  it('contiene trip.yml', () => {
    expect(t.hasTripYml, `${t.base}/trip.yml no existe`).toBe(true)
  })

  for (const doc of t.docs) {
    it(`valida ${doc.file}`, () => {
      const r = strictOf.get(doc.collection)!.safeParse(doc.data)
      expect(r.success, r.success ? '' : `${doc.file}\n${z.prettifyError(r.error)}`).toBe(true)
    })
  }
})

// ── Casos fixture in-line: prueban la PUERTA DATA-05 sin depender de ficheros ──
describe('puerta DATA-05 (fixtures, siempre corren)', () => {
  const validMonument = {
    slug: 'galleria-sciarra',
    trip: 'roma',
    roman: 'I',
    name: 'Galleria Sciarra',
    italian: 'Galleria Sciarra · Rione Trevi',
    day: 'Viernes',
    coords: { lat: 41.8999403, lng: 12.4820553 },
    type: 'card',
    motif: 'arch',
    hero: { src: 'https://example.org/x.jpg', alt: 'Galleria Sciarra' },
    sections: [{ heading: 'Qué es', body: 'Un patio cubierto de **hierro** y cristal.' }],
    facts: [{ label: 'Acceso', value: 'Gratuito' }],
    mapsQuery: 'Galleria Sciarra Roma',
  }

  it('un monumento válido pasa', () => {
    expect(MonumentSchema.safeParse(validMonument).success).toBe(true)
  })

  it('un motif fuera del enum FALLA (DATA-05)', () => {
    const r = MonumentSchema.safeParse({ ...validMonument, motif: 'foo' })
    expect(r.success).toBe(false)
  })

  it('un campo requerido ausente (coords) FALLA (DATA-05)', () => {
    const { coords: _omit, ...sinCoords } = validMonument
    void _omit
    expect(MonumentSchema.safeParse(sinCoords).success).toBe(false)
  })

  it('un tipo equivocado (type fuera del enum) FALLA (DATA-05)', () => {
    const r = MonumentSchema.safeParse({ ...validMonument, type: 'museo' })
    expect(r.success).toBe(false)
  })

  // DATA-02: timeline heterogéneo discriminado por kind, pace por fila, cards string[].
  it('un día con timeline discriminado (kinds + pace) y cards string[] valida (DATA-02)', () => {
    const day = {
      slug: 'viernes',
      trip: 'roma',
      order: 1,
      roman: 'I',
      eyebrow: 'venerdì · 19 giugno',
      title: 'Centro Storico nocturno',
      subtitle: 'Primer paseo',
      stats: [{ variant: 'walk', text: '🚶 2 km' }],
      timeline: [
        { kind: 'stop', pace: 'slow-only', time: '19:30', title: 'Galleria Sciarra', ref: 'galleria-sciarra' },
        { kind: 'transport', pace: 'all', variant: 'taxi', header: 'Al hotel', modes: [{ icon: '🚕', desc: 'Directo' }] },
        { kind: 'meta', items: [{ level: 'ok', text: '⏱ 60 min' }] },
        { kind: 'food', pace: 'all', header: 'Cena', entries: [{ ref: 'g-fortunata', name: 'Da Fortunata', desc: 'Tonnarelli' }] },
        { kind: 'reservation', text: '✅ **Cena reservada** 22:30' },
      ],
      cards: ['galleria-sciarra', 'fontana-trevi'],
    }
    const r = DaySchema.safeParse(day)
    expect(r.success, r.success ? '' : JSON.stringify(r.error.issues, null, 2)).toBe(true)
  })

  it('una fila stop con pace fuera de all/medium/slow-only FALLA (DATA-02)', () => {
    const r = DaySchema.safeParse({
      slug: 'x', trip: 'roma', order: 1, roman: 'I', eyebrow: 'e', title: 't', subtitle: 's',
      stats: [], cards: [],
      timeline: [{ kind: 'stop', pace: 'rapido', time: '19:30', title: 'X' }],
    })
    expect(r.success).toBe(false)
  })

  // D-02 / D-03 (Fase 10): slug de día `^[a-z0-9-]+$` (DAY_SLUG_RE) y `pill` opcional sin
  // espacios en los extremos. Mismo día mínimo válido; solo varía el campo bajo prueba.
  const minDay = {
    slug: 'viernes', trip: 'roma', order: 1, roman: 'I', eyebrow: 'venerdì · 19 giugno',
    title: 't', subtitle: 's', stats: [], timeline: [], cards: [],
  }

  it('DaySchema acepta un slug con fecha que empieza por letra ("sabado-19", D-02)', () => {
    expect(DaySchema.safeParse({ ...minDay, slug: 'sabado-19' }).success).toBe(true)
  })

  it.each(['Sabado', 'sábado', 'sabado 19', 'sabado_19'])('DaySchema rechaza el slug de día "%s" (D-02)', (slug) => {
    expect(DaySchema.safeParse({ ...minDay, slug }).success).toBe(false)
  })

  it('DaySchema acepta pill "Sáb 19" (D-03)', () => {
    expect(DaySchema.safeParse({ ...minDay, slug: 'sabado-19', pill: 'Sáb 19' }).success).toBe(true)
  })

  it.each(['', ' Sáb 19', 'Sáb 19 '])('DaySchema rechaza pill %j (vacía o con espacios en los extremos, D-03)', (pill) => {
    expect(DaySchema.safeParse({ ...minDay, pill }).success).toBe(false)
  })

  // DATA-06: la prosa es Markdown-inline guardada como string.
  it('los campos de prosa (Md) son strings con Markdown-inline (DATA-06)', () => {
    const parsed = MonumentSchema.safeParse(validMonument)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(typeof parsed.data.sections[0].body).toBe('string')
      expect(parsed.data.sections[0].body).toContain('**hierro**')
    }
  })

  // Artist discrimina por kind; reference acepta los dos shapes (cobertura de unión).
  it('ArtistSchema discrimina kind (artist | arquitectura | glossary)', () => {
    expect(ArtistSchema.safeParse({ kind: 'artist', slug: 'art-bernini', trip: 'roma', avatar: 'B', name: 'Bernini', dates: 'd', epithet: 'e', sections: [], seenIn: [] }).success).toBe(true)
    expect(ArtistSchema.safeParse({ kind: 'arquitectura', slug: 'arq-barroco', trip: 'roma', avatar: 'IV', name: 'Barroco', dates: 'd', epithet: 'e', sections: [], seenIn: [] }).success).toBe(true)
    expect(ArtistSchema.safeParse({ kind: 'glossary', slug: 'arq-glosario', trip: 'roma', avatar: '?', name: 'Glosario', dates: '', epithet: '', terms: [{ term: 'Frontón', def: 'remate triangular' }] }).success).toBe(true)
    expect(ArtistSchema.safeParse({ kind: 'foo', slug: 'x', trip: 'roma' }).success).toBe(false)
  })

  it('ReferenceSchema acepta tanto reservas como practica', () => {
    expect(ReferenceSchema.safeParse({ slug: 'reservas', trip: 'roma', order: 1, title: 't', eyebrow: 'e', intro: 'i', confirmed: [], table: [] }).success).toBe(true)
    expect(ReferenceSchema.safeParse({ slug: 'practica', trip: 'roma', order: 2, title: 't', eyebrow: 'e', intro: 'i', sections: [], media: [] }).success).toBe(true)
  })

  // D-05: slug de viaje ASCII ^[a-z0-9]+$ (TRIP_SLUG_RE). Mismo trip válido, solo varía el slug.
  const validTrip = {
    slug: 'campania',
    title: 'Viaje',
    decoration: '·  X  ·',
    heroMeta: '2027',
    quote: 'Cita.',
    quoteAttr: '— AUTOR',
    infoCards: [{ label: 'Alojamiento', value: '**Hotel**' }],
    howTo: ['Cómo usar la guía.'],
    map: { center: { lat: 40.85, lng: 14.27 }, zoom: 13 },
  }

  it('TripSchema acepta un slug ASCII sin guiones ("campania", D-05)', () => {
    expect(TripSchema.safeParse(validTrip).success).toBe(true)
  })

  it('TripSchema rechaza un slug con guion ("campania-2027", D-05)', () => {
    expect(TripSchema.safeParse({ ...validTrip, slug: 'campania-2027' }).success).toBe(false)
  })

  it('TripSchema rechaza un slug con mayúsculas ("Roma", D-05)', () => {
    expect(TripSchema.safeParse({ ...validTrip, slug: 'Roma' }).success).toBe(false)
  })
})

// ── Chrome del viaje (Fase 10, D-10…D-14) ────────────────────────────────────
// Marca, pie, leyenda del mapa y título de pestaña viven en el trip.yml de cada viaje, como
// campos OPCIONALES (esquema estrictamente aditivo, D-10): un viaje que no los define sigue
// validando y la UI cae a un respaldo neutro (D-14). `brand` es texto estructurado (D-11, nunca
// HTML); `footer` es una lista de líneas Markdown-inline (D-12); `pageTitle` vacío se rechaza
// (edge SHAPE-04 empty).
describe('chrome del viaje (D-10…D-14)', () => {
  const baseTrip = {
    slug: 'campania',
    title: 'Viaje',
    decoration: '·  X  ·',
    heroMeta: '2027',
    quote: 'Cita.',
    quoteAttr: '— AUTOR',
    infoCards: [{ label: 'Alojamiento', value: '**Hotel**' }],
    howTo: ['Cómo usar la guía.'],
    map: { center: { lat: 40.85, lng: 14.27 }, zoom: 13 },
  }
  const fullChrome = {
    brand: { before: 'Napoli', after: 'maggio MMXXVII' },
    footer: ['Preparado para _alguien_', 'Napoli · 2027'],
    mapLegend: '✦ Leyenda ✦',
    pageTitle: 'Napoli · 2027',
  }

  it('D-10: el trip.yml de Roma SIN brand/footer/mapLegend/pageTitle valida (esquema aditivo)', () => {
    const doc = loadTrip('roma').docs.find(d => d.collection === 'trip')
    expect(doc, 'content/trips/roma/trip.yml no cargado').toBeDefined()
    const chromeKeys = new Set(['brand', 'footer', 'mapLegend', 'pageTitle'])
    const data = Object.fromEntries(Object.entries(doc!.data).filter(([k]) => !chromeKeys.has(k)))
    expect(Object.keys(data).some(k => chromeKeys.has(k))).toBe(false)
    const r = TripSchema.safeParse(data)
    expect(r.success, r.success ? '' : z.prettifyError(r.error)).toBe(true)
  })

  it('acepta un viaje con los cuatro campos de chrome bien formados', () => {
    expect(TripSchema.safeParse({ ...baseTrip, ...fullChrome }).success).toBe(true)
  })

  it('rechaza brand como string (D-11: objeto { before, after })', () => {
    expect(TripSchema.safeParse({ ...baseTrip, brand: 'Roma' }).success).toBe(false)
  })

  it('rechaza brand sin after (D-11)', () => {
    expect(TripSchema.safeParse({ ...baseTrip, brand: { before: 'Roma' } }).success).toBe(false)
  })

  it('rechaza footer que no es lista (D-12)', () => {
    expect(TripSchema.safeParse({ ...baseTrip, footer: 'x' }).success).toBe(false)
  })

  it('rechaza footer vacío (D-12: al menos una línea)', () => {
    expect(TripSchema.safeParse({ ...baseTrip, footer: [] }).success).toBe(false)
  })

  it('rechaza pageTitle vacío (edge SHAPE-04 empty, D-13)', () => {
    expect(TripSchema.safeParse({ ...baseTrip, pageTitle: '' }).success).toBe(false)
  })

  it('rechaza mapLegend vacío', () => {
    expect(TripSchema.safeParse({ ...baseTrip, mapLegend: '' }).success).toBe(false)
  })
})

// ── Borradores (Fase 11, D-16) ───────────────────────────────────────────────
// `draft` es un booleano OPCIONAL: `true` saca el viaje de la build de producción (content.config.ts
// lo excluye de las 6 colecciones). Booleano estricto: un `draft: 'yes'` se rechaza aquí y hace
// lanzar a scripts/tripManifest.mjs, así que un borrador mal escrito nunca se publica por defecto.
// Viaje base válido mínimo: lo comparten los describes de borradores (D-16) y de portada (D-08).
const baseTrip = {
  slug: 'campania',
  title: 'Viaje',
  decoration: '·  X  ·',
  heroMeta: '2027',
  quote: 'Cita.',
  quoteAttr: '— AUTOR',
  infoCards: [{ label: 'Alojamiento', value: '**Hotel**' }],
  howTo: ['Cómo usar la guía.'],
  map: { center: { lat: 40.85, lng: 14.27 }, zoom: 13 },
}

describe('borradores (D-16)', () => {
  it('acepta draft: true', () => {
    expect(TripSchema.safeParse({ ...baseTrip, draft: true }).success).toBe(true)
  })

  it('acepta draft: false', () => {
    expect(TripSchema.safeParse({ ...baseTrip, draft: false }).success).toBe(true)
  })

  it('acepta un viaje sin draft (campo opcional)', () => {
    expect(TripSchema.safeParse(baseTrip).success).toBe(true)
  })

  it('rechaza draft: \'yes\' (booleano estricto, fail-closed)', () => {
    expect(TripSchema.safeParse({ ...baseTrip, draft: 'yes' }).success).toBe(false)
  })
})

// ── Portada: campos del viaje (Fase 11, D-08, D-23) ────────────────────────────
// startDate/endDate son strings ISO con regex + refine de calendario (nunca `z.iso.date()`);
// destinations es una lista no vacía de nombres no vacíos; summary, Markdown-inline no vacío.
describe('portada: campos del viaje (D-08, D-23)', () => {
  const issues = (data: unknown) => {
    const r = TripSchema.safeParse(data)
    return r.success ? [] : r.error.issues.map(i => i.message)
  }

  it('acepta fechas, destinos y resumen sobre un viaje base válido', () => {
    const r = TripSchema.safeParse({
      ...baseTrip,
      startDate: '2026-06-19',
      endDate: '2026-06-23',
      destinations: ['Roma'],
      summary: 'Texto.',
    })
    expect(r.success, JSON.stringify(r.error?.issues)).toBe(true)
  })

  it('rechaza startDate «2026-02-30» con «fecha inexistente: «2026-02-30»»', () => {
    expect(issues({ ...baseTrip, startDate: '2026-02-30' })).toContain('fecha inexistente: «2026-02-30»')
  })

  it.each(['2026-6-19', '19/06/2026'])('rechaza startDate %s (no es ISO YYYY-MM-DD)', (bad) => {
    expect(issues({ ...baseTrip, startDate: bad })).toContain('fecha ISO YYYY-MM-DD')
  })

  it.each([[[]], [['']]])('rechaza destinations %j con «destinations vacío o con un elemento vacío»', (bad) => {
    expect(issues({ ...baseTrip, destinations: bad })).toContain('destinations vacío o con un elemento vacío')
  })

  it('rechaza summary vacío', () => {
    expect(TripSchema.safeParse({ ...baseTrip, summary: '' }).success).toBe(false)
  })

  it('D-23: el JSON-Schema de startDate/endDate no lleva format: date (columna de texto en Content)', () => {
    const props = (z.toJSONSchema(TripSchema) as { properties: Record<string, { type?: string, format?: string }> }).properties
    for (const key of ['startDate', 'endDate']) {
      expect(props[key], key).toBeDefined()
      expect(props[key]?.type, key).toBe('string')
      expect(props[key]?.format, key).toBeUndefined()
    }
  })
})

// ── Conteo por colección (SC#1) — SOLO roma (D-12) ───────────────────────────
// Los totales son la huella de la migración del index.html y siguen siendo solo de Roma.
// Ningún conteo para otros viajes: un borrador incompleto no es error (D-09).
describe('conteo de ficheros por colección (SOLO roma, D-12)', () => {
  const roma = loadTrip('roma')
  const expected: Record<CollectionName, number> = { trip: 1, day: 5, monument: 38, food: 26, artist: 13, reference: 2 }
  for (const [name, n] of Object.entries(expected) as Array<[CollectionName, number]>) {
    it(`${name}: ${n} ficheros`, () => {
      expect(roma.docs.filter(d => d.collection === name).length).toBe(n)
    })
  }
})
