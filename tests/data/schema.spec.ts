import { describe, it, expect } from 'vitest'
import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import {
  MonumentSchema,
  DaySchema,
  FoodSchema,
  ArtistSchema,
  ReferenceSchema,
  TripSchema,
} from '../../shared/schemas'

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
 * y ocultaría justo los fallos que DATA-05 debe atrapar. Node puro: readFileSync + parseYaml +
 * safeParse, sin runtime Nuxt ni SQLite.
 *
 *  - DATA-05: un dato inválido (enum/required/tipo) FALLA safeParse (casos fixture in-line).
 *  - DATA-02: un día con timeline discriminado por `kind` + `pace` por fila valida.
 *  - DATA-06: los campos de prosa (`Md`) son strings (Markdown-inline, render en Fase 4).
 *
 * Los casos fixture corren AUNQUE Wave 2 no haya migrado ningún `.yml`: garantizan que la
 * PUERTA existe (evita un test vacuo verde). Cuando los datos existan, el `describe` de
 * conteo comprueba los totales esperados por colección (SC#1).
 */

const ROOT = join(process.cwd(), 'content', 'trips', 'roma')
const glob = (sub: string) => globSync(join(ROOT, sub)).sort()

// Mapa colección → (glob de sus ficheros, schema). Una sola fuente que reusan el loop
// por-fichero y el describe de conteo.
const collections = [
  { name: 'trip', files: glob('trip.yml'), schema: TripSchema, expected: 1 },
  { name: 'day', files: glob('days/*.yml'), schema: DaySchema, expected: 5 },
  { name: 'monument', files: glob('monuments/*.yml'), schema: MonumentSchema, expected: 38 },
  { name: 'food', files: glob('food/*.yml'), schema: FoodSchema, expected: 26 },
  { name: 'artist', files: glob('artists/*.yml'), schema: ArtistSchema, expected: 13 },
  { name: 'reference', files: glob('reference/*.yml'), schema: ReferenceSchema, expected: 2 },
] as const

// ── Validación por fichero (DATA-05 sobre los datos reales) ───────────────────
for (const { name, files, schema } of collections) {
  describe(`esquema ${name}`, () => {
    if (files.length === 0) {
      // Wave 2 aún no ha migrado esta colección: el gate real lo prueban los fixtures.
      it.skip(`(sin ficheros .yml todavía — migración pendiente)`, () => {})
      return
    }
    for (const f of files) {
      it(`valida ${f}`, () => {
        const data = parseYaml(readFileSync(f, 'utf8'))
        const r = schema.safeParse(data)
        expect(r.success, r.success ? '' : JSON.stringify(r.error.issues, null, 2)).toBe(true)
      })
    }
  })
}

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
})

// ── Conteo por colección (SC#1) — tolerante a 0 mientras Wave 2 no haya migrado ──
describe('conteo de ficheros por colección (SC#1)', () => {
  for (const { name, files, expected } of collections) {
    it(`${name}: ${files.length === 0 ? '0 (migración pendiente)' : files.length} ficheros`, () => {
      if (files.length === 0) {
        // Aún sin migrar: tolerar 0. Tras Wave 2 debe igualar `expected`.
        expect(files.length).toBe(0)
      }
      else {
        expect(files.length).toBe(expected)
      }
    })
  }
})
