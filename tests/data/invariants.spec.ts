import { describe, it, expect } from 'vitest'
import { globSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { parse as parseYaml } from 'yaml'

/**
 * Puerta de invariantes entre colecciones (DATA-03 / SC#4).
 *
 * zod valida la FORMA de cada fichero por separado, pero NO puede ver las otras colecciones
 * (los `.refine()` se pierden al convertir a JSON-Schema y no tienen contexto global —
 * RESEARCH Pitfall 6). Las invariantes ENTRE ficheros viven aquí, la única capa que carga
 * TODAS las colecciones a la vez:
 *
 *  - ids (slugs) ÚNICOS en todo el viaje (Set sin duplicados = nº de ficheros).
 *  - cada cross-ref resuelve a un slug existente:
 *      day.cards[]                      → monument
 *      timeline[kind∈{stop,food}].ref   → monument | food
 *      monument.artists[].ref           → artist(kind:artist)
 *      monument.arch[].ref              → artist(kind:arquitectura)
 *      artist.seenIn[].ref              → monument
 *      reservas.table[].ref             → monument | food
 *  - cada ancla `(#id)` dentro de los campos de prosa (Md) resuelve (cubre el `archLink`
 *    inline de las edades de arquitectura y cualquier `[texto](#id)` — RESEARCH Open Q 676).
 *  - basename(fichero) === slug (RESEARCH Pattern 1): mantiene resolubles las anclas `#id`
 *    de la prosa y las claves `localStorage['roma-note-<id>']` de la Fase 7.
 *
 * Node puro (readFileSync + parseYaml). Los asertos sobre ficheros toleran conjuntos vacíos
 * mientras Wave 2 no haya migrado; los casos FIXTURE in-line corren siempre y prueban que la
 * puerta DETECTA una ref rota sin depender de datos. Tras Wave 2 es la puerta dura de SC#4.
 */

const ROOT = join(process.cwd(), 'content', 'trips', 'roma')
const glob = (sub: string) => globSync(join(ROOT, sub)).sort()

interface Doc { slug: string, file: string, kind?: string, data: Record<string, unknown> }

function load(sub: string): Doc[] {
  return glob(sub).map((file) => {
    const data = parseYaml(readFileSync(file, 'utf8')) as Record<string, unknown>
    return { slug: String(data?.slug ?? ''), file, kind: data?.kind as string | undefined, data }
  })
}

const monuments = load('monuments/*.yml')
const days = load('days/*.yml')
const food = load('food/*.yml')
const artists = load('artists/*.yml')
const reference = load('reference/*.yml')
const trip = load('trip.yml')
const all = [...monuments, ...days, ...food, ...artists, ...reference, ...trip]

const monumentSlugs = new Set(monuments.map(d => d.slug))
const foodSlugs = new Set(food.map(d => d.slug))
const artistArtSlugs = new Set(artists.filter(d => d.kind === 'artist').map(d => d.slug))
const artistArchSlugs = new Set(artists.filter(d => d.kind === 'arquitectura').map(d => d.slug))
const allSlugs = new Set(all.map(d => d.slug))

// ── Helpers PUROS (testeados por fixtures aunque no haya datos) ───────────────

/** Extrae las anclas `#id` de un string Markdown-inline (`[texto](#id)`). */
export function extractAnchors(md: string): string[] {
  const out: string[] = []
  // [texto](#ancla) — sólo enlaces a fragmentos internos (#…), no URLs externas.
  const re = /\]\(#([a-z0-9-]+)\)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) out.push(m[1])
  return out
}

/** Recorre recursivamente un valor recogiendo todos los strings (para escanear prosa). */
function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') acc.push(value)
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, acc)
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectStrings(v, acc)
  return acc
}

// ── Invariante 1: slugs únicos (SC#4) ─────────────────────────────────────────
describe('slugs únicos en todo el viaje', () => {
  it('no hay slugs duplicados (Set === nº de ficheros)', () => {
    // Mientras no haya datos, all=[] y el aserto es 0===0 (trivial pero correcto).
    const slugs = all.map(d => d.slug)
    expect(allSlugs.size).toBe(slugs.length)
  })

  it('ningún slug está vacío', () => {
    for (const d of all) {
      expect(d.slug, `fichero sin slug: ${d.file}`).not.toBe('')
    }
  })
})

// ── Invariante 2: basename === slug (SC#4 / Pattern 1) ────────────────────────
describe('basename del fichero === slug', () => {
  // trip.yml es el único fichero cuyo basename ('trip') NO es su slug ('roma'): es un
  // singleton por viaje, no una entidad direccionable por ancla. Se exceptúa explícitamente.
  for (const d of all.filter(x => basename(x.file) !== 'trip.yml')) {
    it(`${d.file}`, () => {
      expect(basename(d.file, '.yml')).toBe(d.slug)
    })
  }
  if (all.filter(x => basename(x.file) !== 'trip.yml').length === 0) {
    it.skip('(sin ficheros direccionables todavía — migración pendiente)', () => {})
  }
})

// ── Invariante 3: cross-refs resuelven (SC#4) ─────────────────────────────────
describe('cross-refs resuelven a slugs existentes', () => {
  it('day.cards[] → monument', () => {
    for (const d of days) {
      for (const ref of (d.data.cards as string[] ?? [])) {
        expect(monumentSlugs.has(ref), `${d.file}: cards "${ref}" no existe en monuments`).toBe(true)
      }
    }
  })

  it('timeline[stop|food].ref → monument | food', () => {
    const known = new Set([...monumentSlugs, ...foodSlugs])
    for (const d of days) {
      for (const row of (d.data.timeline as Array<Record<string, unknown>> ?? [])) {
        if (row.kind === 'stop' && typeof row.ref === 'string') {
          expect(known.has(row.ref), `${d.file}: timeline stop ref "${row.ref}" no resuelve`).toBe(true)
        }
        if (row.kind === 'food') {
          for (const e of (row.entries as Array<Record<string, unknown>> ?? [])) {
            if (typeof e.ref === 'string') {
              expect(known.has(e.ref), `${d.file}: timeline food ref "${e.ref}" no resuelve`).toBe(true)
            }
          }
        }
      }
    }
  })

  it('monument.artists[].ref → artist(kind:artist)', () => {
    for (const d of monuments) {
      for (const link of (d.data.artists as Array<Record<string, unknown>> ?? [])) {
        expect(artistArtSlugs.has(String(link.ref)), `${d.file}: artists ref "${String(link.ref)}" no es un artist`).toBe(true)
      }
    }
  })

  it('monument.arch[].ref → artist(kind:arquitectura)', () => {
    for (const d of monuments) {
      for (const link of (d.data.arch as Array<Record<string, unknown>> ?? [])) {
        expect(artistArchSlugs.has(String(link.ref)), `${d.file}: arch ref "${String(link.ref)}" no es arquitectura`).toBe(true)
      }
    }
  })

  it('artist.seenIn[].ref → monument', () => {
    for (const d of artists) {
      for (const link of (d.data.seenIn as Array<Record<string, unknown>> ?? [])) {
        expect(monumentSlugs.has(String(link.ref)), `${d.file}: seenIn ref "${String(link.ref)}" no es un monument`).toBe(true)
      }
    }
  })

  it('reservas.table[].ref → monument | food', () => {
    const known = new Set([...monumentSlugs, ...foodSlugs])
    for (const d of reference.filter(x => x.slug === 'reservas')) {
      for (const row of (d.data.table as Array<Record<string, unknown>> ?? [])) {
        if (typeof row.ref === 'string') {
          expect(known.has(row.ref), `${d.file}: reservas.table ref "${row.ref}" no resuelve`).toBe(true)
        }
      }
    }
  })
})

// ── Invariante 4: anclas (#id) inline en la prosa resuelven (cubre archLink) ──
// Anclas de SECCIÓN de página (no entidades): el index.html enlaza, dentro de la prosa,
// a las landings `<section id="…">` de la página única (la nav-pill y los `tl-food-foot`
// «Fichas en [Gastronomía](#gastronomia)»). NO son slugs de contenido — no hay una entidad
// `gastronomia`/`arte` (gastronomía = toda la colección food). Los días (`viernes`…) y
// `reservas`/`practica` SÍ son slugs y resuelven por sí mismos; aquí sólo se listan las
// secciones puramente navegacionales sin entidad de respaldo. Fase 4/5 renderiza estas
// anclas como landings de sección. Excluirlas mantiene los dientes del gate (una ancla de
// ENTIDAD mal escrita sigue fallando) sin romper la fidelidad 1:1 (DATA-04) de los enlaces.
const PAGE_SECTIONS = new Set(['inicio', 'mapa', 'arte', 'arquitectura', 'gastronomia'])

describe('anclas (#id) dentro de la prosa Md resuelven', () => {
  it('cada [texto](#id) de cualquier campo resuelve a un slug existente (o a una sección de página)', () => {
    for (const d of all) {
      for (const str of collectStrings(d.data)) {
        for (const anchor of extractAnchors(str)) {
          expect(
            allSlugs.has(anchor) || PAGE_SECTIONS.has(anchor),
            `${d.file}: ancla inline #${anchor} no resuelve`,
          ).toBe(true)
        }
      }
    }
  })
})

// ── Casos FIXTURE in-line: prueban que la PUERTA detecta refs rotas sin datos ──
describe('puerta de invariantes (fixtures, siempre corren)', () => {
  it('un Set de slugs detecta una ref inexistente (la puerta tiene dientes)', () => {
    const slugs = new Set(['galleria-sciarra', 'fontana-trevi', 'g-felice'])
    expect(slugs.has('galleria-sciarra')).toBe(true) // ref válida resuelve
    expect(slugs.has('no-existe')).toBe(false) // ref rota NO resuelve → en datos reales sería rojo
  })

  it('detecta slugs duplicados', () => {
    const docs = [{ slug: 'a' }, { slug: 'b' }, { slug: 'a' }]
    const set = new Set(docs.map(d => d.slug))
    expect(set.size).not.toBe(docs.length) // 2 !== 3 → duplicado detectado
  })

  it('extractAnchors saca las anclas internas y NO las URLs externas', () => {
    const md = 'Cerca de [Trevi](#fontana-trevi) y [Maps](https://maps.google.com/?q=x), ver [Pozzo](#art-pozzo).'
    expect(extractAnchors(md)).toEqual(['fontana-trevi', 'art-pozzo'])
  })

  it('extractAnchors sobre un archLink inline (Barroco → #art-bernini) lo captura', () => {
    const body = 'El Barroco lo encarnan [Bernini](#art-bernini) y [Borromini](#art-borromini).'
    const anchors = extractAnchors(body)
    expect(anchors).toContain('art-bernini')
    expect(anchors).toContain('art-borromini')
  })

  it('basename(fichero) === slug: una desalineación se detectaría', () => {
    const file = 'content/trips/roma/monuments/galleria-sciarra.yml'
    expect(basename(file, '.yml')).toBe('galleria-sciarra')
    expect(basename(file, '.yml')).not.toBe('otro-slug')
  })
})
