import { describe, it, expect } from 'vitest'
import { buildHaystack, createSearchIndex } from '../../app/utils/searchIndex'
import type { Monument } from '../../shared/schemas'

/**
 * Cobertura unitaria de la lógica PURA de búsqueda (FEAT-03) — el reemplazo del
 * `buildSearchIndex()` + filtro `includes()` del index.html (6435-6442 / 6447-6466).
 *
 * El BLINDAJE de este spec es SC#1 ("encontrar AL MENOS lo que encuentra hoy", RESEARCH
 * §Pitfall 1): el haystack original era `card.textContent.toLowerCase()` — TODO el texto
 * visible del `.card`. El esquema de la Fase 2 reparte ese texto en muchos campos, así que
 * `buildHaystack` DEBE ser un SUPERCONJUNTO. Si cayera un campo (p. ej. el `badge`
 * "Sorrentino"/"Caravaggio" o la etiqueta de `arch` "Tardobarroco"), la query daría 0
 * resultados donde el sitio vivo SÍ encontraba → regresión. Aquí se prueba en dos niveles:
 *   1. `buildHaystack` CONTIENE cada palabra de cada campo (prueba directa de superconjunto).
 *   2. `createSearchIndex(...).search(palabra)` DEVUELVE el slug esperado para badge / arch /
 *      italian / section-body (un haystack subconjunto devolvería 0 → SC#1 roto).
 * Más: los resultados llevan `slug`/`name`/`day` (storeFields para el dropdown) y el prefijo
 * funciona (D-01). Vitest PLANO: importa las funciones por ruta relativa, sin `@nuxt/test-utils`
 * ni runtime Nuxt (mismo estilo que `tests/unit/cardNavigation.spec.ts` / `pace.spec.ts`).
 *
 * Los fixtures solo pueblan los campos que `buildHaystack` + `storeFields` leen (cast
 * `as Monument`; el objetivo es el comportamiento del índice, NO validar el esquema — eso
 * lo cubre `tests/data/schema.spec.ts`). Las palabras-sonda ("Tardobarroco", "Sorrentino",
 * "Caravaggio", "Liberty", "travelling", "Cellini") son únicas por campo para localizar
 * exactamente qué campo aporta cada acierto.
 */

const sciarra = {
  slug: 'galleria-sciarra',
  name: 'Galleria Sciarra',
  italian: 'Galleria Sciarra · Rione Trevi',
  roman: 'I',
  day: 'Viernes',
  badge: 'Sorrentino', // card-badge → palabra-sonda de badge
  sections: [
    { heading: 'Qué es', body: 'Un patio cubierto decorado con frescos Liberty.' }, // 'Liberty' = palabra de section-body
  ],
  facts: [
    { label: 'Acceso', value: 'Gratuito porticato' }, // 'porticato' = palabra de fact-value
  ],
  sorrentino: {
    label: 'La Grande Bellezza',
    text: 'Aparece en un travelling fugaz al minuto 0:45.', // 'travelling' = palabra de sorrentino
  },
  culture: [
    { title: 'Liberty italiano', text: 'Manifiesto del Art Nouveau ante litteram.' }, // 'litteram' = palabra de culture
  ],
  arch: [
    { ref: '#arq-barroco', label: 'Arquitectura: **Tardobarroco**' }, // 'Tardobarroco' = palabra de arch-label (Markdown inline)
  ],
} as Monument

const caravaggio = {
  slug: 'san-luigi',
  name: 'San Luigi dei Francesi',
  italian: 'Chiesa di San Luigi dei Francesi',
  roman: 'II',
  day: 'Sábado',
  badge: 'Caravaggio', // 2º badge-sonda
  sections: [
    { heading: 'Qué ver', body: 'Tres lienzos del ciclo de San Mateo.' },
  ],
  facts: [
    { label: 'Acceso', value: 'Gratuito' },
  ],
} as Monument

const monuments: Monument[] = [sciarra, caravaggio]

describe('buildHaystack — SUPERCONJUNTO de card.textContent (FEAT-03 SC#1 / Pitfall 1)', () => {
  const hay = buildHaystack(sciarra)

  it('incluye name + italian (los campos boosteados)', () => {
    expect(hay).toContain('Galleria Sciarra')
    expect(hay).toContain('Rione Trevi')
  })

  it('incluye la palabra del badge ("Sorrentino")', () => {
    expect(hay).toContain('Sorrentino')
  })

  it('incluye la palabra de estilo de arch ("Tardobarroco", Markdown crudo, sin destripar)', () => {
    // El Markdown se concatena tal cual (`**Tardobarroco**`); el tokenizador de MiniSearch
    // separa los `*`. Aquí basta que la subcadena esté presente en el haystack.
    expect(hay).toContain('Tardobarroco')
  })

  it('incluye una palabra del cuerpo de sección ("Liberty")', () => {
    expect(hay).toContain('Liberty')
  })

  it('incluye un valor de fact ("porticato")', () => {
    expect(hay).toContain('porticato')
  })

  it('incluye una palabra de sorrentino ("travelling")', () => {
    expect(hay).toContain('travelling')
  })

  it('incluye una palabra de culture ("litteram")', () => {
    expect(hay).toContain('litteram')
  })

  it('aplica las guardas ?? [] sin lanzar cuando faltan los arrays opcionales', () => {
    // caravaggio NO tiene sorrentino/culture/arch/artists → no debe lanzar y sí incluir lo presente.
    const hay2 = buildHaystack(caravaggio)
    expect(hay2).toContain('Caravaggio')
    expect(hay2).toContain('San Mateo')
  })
})

describe('createSearchIndex — query devuelve el monumento esperado (FEAT-03 SC#1)', () => {
  const index = createSearchIndex(monuments)

  it('busca la palabra de arch ("Tardobarroco") → galleria-sciarra (subconjunto daría 0)', () => {
    const slugs = index.search('Tardobarroco').map(r => r.id)
    expect(slugs).toContain('galleria-sciarra')
  })

  it('busca un badge ("Sorrentino") → galleria-sciarra', () => {
    const slugs = index.search('Sorrentino').map(r => r.id)
    expect(slugs).toContain('galleria-sciarra')
  })

  it('busca otro badge ("Caravaggio") → san-luigi', () => {
    const slugs = index.search('Caravaggio').map(r => r.id)
    expect(slugs).toContain('san-luigi')
  })

  it('busca una palabra del nombre italiano ("Francesi") → san-luigi', () => {
    const slugs = index.search('Francesi').map(r => r.id)
    expect(slugs).toContain('san-luigi')
  })

  it('busca una palabra del cuerpo de sección ("frescos") → galleria-sciarra', () => {
    const slugs = index.search('frescos').map(r => r.id)
    expect(slugs).toContain('galleria-sciarra')
  })
})

describe('createSearchIndex — storeFields + prefijo (FEAT-03 D-01)', () => {
  const index = createSearchIndex(monuments)

  it('cada resultado lleva slug/name/day (storeFields para el dropdown)', () => {
    const result = index.search('Galleria')
    expect(result.length).toBeGreaterThan(0)
    const first = result[0]!
    expect(first).toHaveProperty('id', 'galleria-sciarra') // id = idField (slug)
    expect(first).toHaveProperty('slug', 'galleria-sciarra')
    expect(first).toHaveProperty('name', 'Galleria Sciarra')
    expect(first).toHaveProperty('day', 'Viernes')
  })

  it('un prefijo del nombre ("Cara" → "Caravaggio") encuentra el monumento (prefix: true)', () => {
    const slugs = index.search('Cara').map(r => r.id)
    expect(slugs).toContain('san-luigi')
  })

  it('un prefijo del nombre propio ("Gall" → "Galleria") encuentra el monumento', () => {
    const slugs = index.search('Gall').map(r => r.id)
    expect(slugs).toContain('galleria-sciarra')
  })
})
