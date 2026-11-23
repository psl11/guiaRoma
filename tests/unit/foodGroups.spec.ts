import { describe, it, expect } from 'vitest'
import { groupFood } from '../../app/utils/foodGroups'
import type { Food } from '../../shared/schemas'

/**
 * Cobertura unitaria del helper puro `groupFood` (UI-04, Pitfall 6).
 *
 * `queryCollection('food').all()` devuelve las fichas en orden ALFABÉTICO por
 * filename (g-armando, g-baffetto, g-bar-musa, g-bar-pace, g-checchino…). Si el
 * agrupado preservara ese orden de primera aparición, los grupos saldrían MAL: un
 * `g-bar-*` saldría tercero cuando en el index.html el grupo «Bar · aperitivo» es el
 * ÚLTIMO. Como los ficheros NO tienen campo `order` (verificado), el ORDEN CANÓNICO de
 * los 7 grupos debe codificarse explícitamente en el util y este test lo blinda.
 *
 * Vitest plano: importa `groupFood` directo (sin runtime Nuxt ni `@nuxt/test-utils`),
 * mismo estilo que `tests/unit/dayLabel.spec.ts` y `tests/data/schema.spec.ts`.
 */

// Constructor mínimo de Food de prueba (solo los campos que `groupFood` usa: slug,
// group, groupIntro). El resto se rellena con valores válidos para satisfacer el tipo.
function food(slug: string, group: string, groupIntro?: string): Food {
  return {
    slug,
    trip: 'roma',
    group,
    ...(groupIntro ? { groupIntro } : {}),
    badge: 'x',
    badgeKind: 'trattoria',
    name: slug,
    address: 'x',
    desc: 'x',
    footer: 'x',
    mapsQuery: 'x',
  }
}

// Entrada en orden ALFABÉTICO-POR-FILENAME (lo que devuelve `.all()`): los dos `g-bar-*`
// salen ANTES que casi todo, pero canónicamente su grupo va el ÚLTIMO. Dos de «Pasta
// clásica» (armando, roscioli) NO contiguos para probar que se reagrupan. groupIntro vive
// en el primer item de quinto quarto (checchino) y de ghetto (giggetto), como en F2.
const alphabetical: Food[] = [
  food('g-armando', 'Pasta clásica · trattorias históricas'),
  food('g-bar-musa', 'Bar · aperitivo · salotto romano'),
  food('g-bar-pace', 'Bar · aperitivo · salotto romano'),
  food('g-checchino', 'Quinto quarto · cocina de Testaccio', 'intro quinto quarto'),
  food('g-fior-di-luna', 'Gelato'),
  food('g-frigidarium', 'Gelato'),
  food('g-giggetto', 'Cocina giudaico-romana · Ghetto', 'intro ghetto'),
  food('g-roscioli', 'Pasta clásica · trattorias históricas'),
  food('g-santeustachio-caffe', 'Café · desayuno · pastelería'),
  food('g-zi-umberto', 'Quinto quarto · cocina de Testaccio'),
  food('g-baffetto', 'Pizza'),
]

describe('groupFood (UI-04, Pitfall 6)', () => {
  it('devuelve los grupos en el ORDEN CANÓNICO del index.html, no en el alfabético de entrada', () => {
    const groups = groupFood(alphabetical).map(g => g.group)
    expect(groups).toEqual([
      'Pasta clásica · trattorias históricas',
      'Quinto quarto · cocina de Testaccio',
      'Cocina giudaico-romana · Ghetto',
      'Pizza',
      'Gelato',
      'Café · desayuno · pastelería',
      'Bar · aperitivo · salotto romano',
    ])
  })

  it('coloca el grupo «Bar» el ÚLTIMO aunque sus fichas g-bar-* salen terceras/cuartas en la entrada', () => {
    const groups = groupFood(alphabetical).map(g => g.group)
    // En la entrada alfabética los g-bar-* van en posición 1-2 (0-indexado), pero su grupo
    // debe quedar el último de la salida.
    expect(groups[groups.length - 1]).toBe('Bar · aperitivo · salotto romano')
    expect(groups.indexOf('Bar · aperitivo · salotto romano')).toBe(groups.length - 1)
  })

  it('conserva el orden de aparición de los items DENTRO de cada grupo', () => {
    const result = groupFood(alphabetical)
    const pasta = result.find(g => g.group === 'Pasta clásica · trattorias históricas')!
    // armando aparece antes que roscioli en la entrada → mismo orden dentro del grupo.
    expect(pasta.items.map(f => f.slug)).toEqual(['g-armando', 'g-roscioli'])
    const bar = result.find(g => g.group === 'Bar · aperitivo · salotto romano')!
    expect(bar.items.map(f => f.slug)).toEqual(['g-bar-musa', 'g-bar-pace'])
  })

  it('propaga groupIntro desde el primer item del grupo que lo tenga', () => {
    const result = groupFood(alphabetical)
    expect(result.find(g => g.group === 'Quinto quarto · cocina de Testaccio')!.groupIntro).toBe('intro quinto quarto')
    expect(result.find(g => g.group === 'Cocina giudaico-romana · Ghetto')!.groupIntro).toBe('intro ghetto')
    // Un grupo sin groupIntro en ninguna ficha lo deja undefined.
    expect(result.find(g => g.group === 'Pasta clásica · trattorias históricas')!.groupIntro).toBeUndefined()
  })

  it('guard ?? []: una entrada null/undefined produce un array vacío sin lanzar', () => {
    // @ts-expect-error — probamos el guard con entrada nula a propósito
    expect(groupFood(null)).toEqual([])
    // @ts-expect-error — y con undefined
    expect(groupFood(undefined)).toEqual([])
  })

  it('un grupo NO presente en el orden canónico se coloca al final de forma determinista', () => {
    const withUnknown: Food[] = [
      food('g-zzz', 'Grupo desconocido'),
      food('g-armando', 'Pasta clásica · trattorias históricas'),
    ]
    const groups = groupFood(withUnknown).map(g => g.group)
    // El conocido (Pasta) va primero por canon; el desconocido queda al final.
    expect(groups).toEqual(['Pasta clásica · trattorias históricas', 'Grupo desconocido'])
  })
})
