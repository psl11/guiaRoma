import type { Food } from '~~/shared/schemas'

// `groupFood(items)` — agrupa las fichas de gastronomía por `food.group` y devuelve los
// grupos en el ORDEN CANÓNICO del index.html (Pitfall 6).
//
// POR QUÉ EXISTE (extraído a util puro): `queryCollection('food').all()` devuelve las
// fichas en orden ALFABÉTICO por filename (g-armando, g-baffetto, g-bar-musa, g-bar-pace,
// g-checchino…). Un agrupado ingenuo por `Map` preservaría ESE orden de primera aparición,
// y los grupos saldrían MAL: los `g-bar-*` salen terceros/cuartos en `.all()` pero el grupo
// «Bar · aperitivo · salotto romano» es el ÚLTIMO en el index.html. Como los ficheros NO
// tienen campo `order` (verificado: `group` es el único signal), el orden canónico de los 7
// grupos se codifica aquí EXPLÍCITAMENTE (array constante) y se ordena por él.
//
// Verbatim del index.html (los 7 `p.gastro-section-title`, líneas 5342/5500/5540/5563/5636/
// 5709/5782). Dentro de cada grupo se conserva el orden de aparición en la lista de entrada;
// `groupIntro` (gastro-intro de nivel grupo: quinto quarto, ghetto) se toma del PRIMER item
// del grupo que lo tenga.
//
// Función PURA y framework-free a propósito (sin imports de `#imports`/`nuxt`/`@nuxt/content`,
// igual que `tripIndexes.ts`/`dayLabel.ts`): así su cobertura corre en Vitest plano sin añadir
// `@nuxt/test-utils`. Vive en `app/utils/` para auto-importarse como `groupFood`. El guard
// `?? []` tolera `null`/`undefined` (los `.data` de `useAsyncData` son `null` durante la
// ventana de hidratación) → devuelve `[]` en vez de lanzar.

// ORDEN CANÓNICO de los 7 grupos (Pitfall 6) — los textos EXACTOS de los `gastro-section-title`
// del index.html, en el orden del DOM. Es la fuente de verdad del orden de la sección.
export const FOOD_GROUP_ORDER: readonly string[] = [
  'Pasta clásica · trattorias históricas',
  'Quinto quarto · cocina de Testaccio',
  'Cocina giudaico-romana · Ghetto',
  'Pizza',
  'Gelato',
  'Café · desayuno · pastelería',
  'Bar · aperitivo · salotto romano',
]

export interface FoodGroup {
  group: string
  groupIntro?: string
  items: Food[]
}

export function groupFood(items: Food[] | null | undefined): FoodGroup[] {
  const list = items ?? []

  // 1) Agrupar conservando el orden de aparición DENTRO de cada grupo. Un Map preserva el
  //    orden de inserción de claves (= primera aparición), que reordenamos después por canon.
  const byGroup = new Map<string, FoodGroup>()
  for (const item of list) {
    let g = byGroup.get(item.group)
    if (!g) {
      g = { group: item.group, items: [] }
      byGroup.set(item.group, g)
    }
    // groupIntro = el del PRIMER item del grupo que lo tenga (no se sobrescribe una vez fijado).
    if (g.groupIntro === undefined && item.groupIntro !== undefined) {
      g.groupIntro = item.groupIntro
    }
    g.items.push(item)
  }

  // 2) Ordenar los grupos por el array CANÓNICO. Un grupo no presente en el canon (índice -1)
  //    se coloca al final de forma determinista: -1 lo mapeamos a Infinity y, a igualdad,
  //    desempatamos por el orden de primera aparición (índice de inserción en el Map).
  const insertionOrder = [...byGroup.keys()]
  const rank = (group: string): number => {
    const i = FOOD_GROUP_ORDER.indexOf(group)
    return i === -1 ? Number.POSITIVE_INFINITY : i
  }
  return [...byGroup.values()].sort((a, b) => {
    const ra = rank(a.group)
    const rb = rank(b.group)
    if (ra !== rb) return ra - rb
    return insertionOrder.indexOf(a.group) - insertionOrder.indexOf(b.group)
  })
}
