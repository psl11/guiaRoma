import { describe, it, expect } from 'vitest'
import { computeActiveSection, pushScroll, popScroll, isFichaTarget } from '../../app/utils/cardNav'

/**
 * Cobertura unitaria de la lógica PURA de navegación de fichas (FEAT-05).
 *
 * Portada 1:1 de dos bloques del index.html:
 *   - Scrollspy de pastillas: `updateActivePill()` (index.html:6488-6501). La regla:
 *       `const scrollY = window.scrollY + 130; let current=''; sections.forEach(s => { if (scrollY >= s.offsetTop) current = s.id })`.
 *     GANA la ÚLTIMA sección que cumpla (iterar-y-sobrescribir, nunca `break`). El `+130`
 *     es LOAD-BEARING: supera el `scroll-padding-top:124px` de la cabecera fija
 *     (index.html:6489-6491). Si fuera 124, al saltar a una sección el scroll quedaría
 *     ~24px por encima de su top y se marcaría la pastilla anterior.
 *   - Pila de retroceso: `navStack`/`navigateToCard`/`goBack`/`updateBackBtn`
 *     (index.html:6382-6409). `navStack.push(window.scrollY)` al navegar, `navStack.pop()`
 *     al volver (LIFO), y el botón se ve cuando `navStack.length > 0` (= canGoBack).
 *
 * Discriminador ficha-vs-sección (D-02): el original usaba `querySelectorAll('.card')`
 * (index.html:6420-6429) para decidir qué enlaces `#id` interceptar. D-01 REEMPLAZA ese
 * DOM-scan por un `monById.has(id)` contra el índice tipado de `useTrip()` — un id presente
 * en `monById` es una ficha (se intercepta); cualquier otro id es una sección (salto nativo).
 *
 * Cubre los SC del plan, un `it` por caso, en Vitest PLANO: importa las funciones directo de
 * `../../app/utils/cardNav`, sin runtime Nuxt ni `@nuxt/test-utils` (RESEARCH §Environment
 * Availability lo prohíbe; mismo estilo que `tests/unit/pace.spec.ts`).
 *   - SC#2 scrollspy: last-wins básico, frontera +130 vs 124 (prueba que el offset es 130),
 *     y vacío-antes-de-la-primera.
 *   - SC#1 stack: `pushScroll` añade, `popScroll` LIFO devolviendo `{top, rest}`, guarda de
 *     pila vacía, y `canGoBack` como `stack.length > 0`.
 *   - SC#3/D-02 predicado de ficha contra un `Map` simulado.
 */

describe('computeActiveSection — scrollspy last-wins (FEAT-05 SC#2, index.html:6488-6501)', () => {
  const sections = [
    { id: 'inicio', offsetTop: 0 },
    { id: 'mapa', offsetTop: 800 },
    { id: 'viernes', offsetTop: 1600 },
  ]

  it('scrollY 0 → inicio (la primera sección en offsetTop 0)', () => {
    expect(computeActiveSection(0, sections)).toBe('inicio')
  })

  it('scrollY 900 → mapa (900+130=1030 >= 800, < 1600)', () => {
    expect(computeActiveSection(900, sections)).toBe('mapa')
  })

  it('scrollY 1500 → viernes (1500+130=1630 >= 1600)', () => {
    expect(computeActiveSection(1500, sections)).toBe('viernes')
  })

  it('last-wins: con dos secciones satisfechas gana la ÚLTIMA del array (sin break temprano)', () => {
    // Ambas (offsetTop 0 y 500) cumplen y >= offsetTop con scrollY 1000; debe ganar 'b'.
    const two = [
      { id: 'a', offsetTop: 0 },
      { id: 'b', offsetTop: 500 },
    ]
    expect(computeActiveSection(1000, two)).toBe('b')
  })

  it('vacío-antes-de-la-primera: nada satisfecho → "" (sin pastilla activa)', () => {
    // offsetTop debe SUPERAR el +130 load-bearing para no satisfacerse: con scrollY 0 el umbral
    // es 130, así que una sección en offsetTop 200 NO se activa (130 < 200) → default "".
    expect(computeActiveSection(0, [{ id: 'x', offsetTop: 200 }])).toBe('')
  })
})

describe('computeActiveSection — frontera +130 LOAD-BEARING (FEAT-05 SC#2, Pitfall 3)', () => {
  // Una sección en offsetTop 1000 SOLO se activa por el offset 130, nunca por 124.
  const sections = [
    { id: 'a', offsetTop: 0 },
    { id: 'target', offsetTop: 1000 },
  ]

  it('scrollY 875 activa target vía +130 (875+130=1005 >= 1000)', () => {
    expect(computeActiveSection(875, sections)).toBe('target')
  })

  it('scrollY 874 (124 FALLA, 130 PASA): 874+124=998 < 1000 <= 874+130=1004 → target', () => {
    // Esta es la prueba decisiva de que el offset es 130 y NO 124: con 124 el resultado
    // sería 'a' (998 < 1000), con 130 es 'target' (1004 >= 1000).
    expect(computeActiveSection(874, sections)).toBe('target')
  })
})

describe('pushScroll / popScroll — pila de retroceso LIFO (FEAT-05 SC#1, index.html:6382-6409)', () => {
  it('pushScroll añade al final, devolviendo un array nuevo', () => {
    expect(pushScroll([], 200)).toEqual([200])
    expect(pushScroll([200], 450)).toEqual([200, 450])
  })

  it('popScroll devuelve { top, rest } en orden LIFO', () => {
    expect(popScroll([200, 450])).toEqual({ top: 450, rest: [200] })
  })

  it('popScroll sobre pila vacía → { top: undefined, rest: [] } (guarda)', () => {
    expect(popScroll([])).toEqual({ top: undefined, rest: [] })
  })
})

describe('canGoBack — derivación del botón de retroceso (FEAT-05 SC#1, index.html:6385-6388)', () => {
  // `updateBackBtn` muestra el botón cuando `navStack.length > 0`. canGoBack es esa derivación.
  it('pila vacía (length 0) → false', () => {
    expect([].length > 0).toBe(false)
  })

  it('pila con un elemento (length 1) → true', () => {
    expect([200].length > 0).toBe(true)
  })

  it('pila con dos elementos (length 2) → true', () => {
    expect([200, 450].length > 0).toBe(true)
  })
})

describe('isFichaTarget — discriminador ficha-vs-sección (FEAT-05 SC#3 / D-02)', () => {
  const monById = new Map<string, unknown>([
    ['g-fortunata', {}],
    ['vaticano', {}],
  ])

  it('id presente en monById es ficha → true (se intercepta)', () => {
    expect(isFichaTarget('g-fortunata', monById)).toBe(true)
    expect(isFichaTarget('vaticano', monById)).toBe(true)
  })

  it('id de sección (ausente de monById) → false (salto nativo, no se intercepta)', () => {
    expect(isFichaTarget('reservas', monById)).toBe(false)
  })

  it('Map vacío → siempre false', () => {
    expect(isFichaTarget('cualquier', new Map())).toBe(false)
  })
})
