/**
 * Lógica PURA de navegación de fichas (FEAT-05) — sin DOM, sin estado, sin Nuxt/Vue.
 *
 * Portada 1:1 de dos bloques del index.html:
 *   - Scrollspy de pastillas: `updateActivePill()` (index.html:6488-6501). El original hace
 *       `const scrollY = window.scrollY + 130; let current=''; sections.forEach(s => { if (scrollY >= s.offsetTop) current = s.id })`.
 *     Aquí `computeActiveSection` recibe el `scrollY` (el componente lee `window.scrollY` y los
 *     `offsetTop` reales) y devuelve el id de la ÚLTIMA sección que cumple — iterar-y-sobrescribir,
 *     NUNCA `break`. El `+ 130` es LOAD-BEARING (index.html:6489-6491): supera el
 *     `scroll-padding-top:124px` de la cabecera fija. Si fuera 124, al saltar a una sección el
 *     scroll quedaría ~24px por encima de su top y se marcaría la pastilla anterior. NO es 124.
 *   - Pila de retroceso: `navStack`/`navigateToCard`/`goBack`/`updateBackBtn`
 *     (index.html:6382-6409). `navStack.push(window.scrollY)` al navegar, `navStack.pop()` al
 *     volver (LIFO), botón visible cuando `navStack.length > 0` (= canGoBack). `pushScroll`/
 *     `popScroll` son los helpers inmutables equivalentes (el controlador del Plan 02 muta su
 *     ref `useState` directamente; estos helpers existen para el test unitario y la delegación).
 *
 * `isFichaTarget` es el discriminador ficha-vs-sección (D-02): el original decidía qué enlaces
 * `#id` interceptar con `querySelectorAll('.card')` (index.html:6420-6429). D-01 REEMPLAZA ese
 * DOM-scan por `monById.has(id)` contra el índice tipado de `useTrip()`. Un id presente en
 * `monById` es una ficha (se intercepta y se navega con pila); cualquier otro id es una sección
 * (salto nativo, sin interceptar).
 *
 * Se extrae a `app/utils/` (igual que `pace.ts`/`foodGroups.ts`/`dayLabel.ts`) para que Nuxt las
 * auto-importe (`computeActiveSection`, `pushScroll`, `popScroll`, `isFichaTarget`) Y para poder
 * testearlas en Vitest plano sin runtime Nuxt (su test: `tests/unit/cardNavigation.spec.ts`).
 * Funciones puras: sin I/O, sin estado, sin efectos, sin dependencia de Nuxt/Vue/DOM.
 */

/** Una sección candidata del scrollspy: su ancla (`id`) y su `offsetTop` en píxeles. */
export type Section = { id: string, offsetTop: number }

/**
 * Id de la sección activa según el scroll. Port verbatim de index.html:6492-6496:
 * `y = scrollY + 130` (el offset LOAD-BEARING, jamás 124), iterar TODAS las secciones
 * asignando `current = s.id` cuando `y >= s.offsetTop` (last-wins, sin `break`), default `''`.
 */
export function computeActiveSection(scrollY: number, sections: Section[]): string {
  const y = scrollY + 130
  let current = ''
  for (const s of sections) {
    if (y >= s.offsetTop) current = s.id
  }
  return current
}

/**
 * Empuja una posición de scroll a la pila (LIFO), devolviendo un array NUEVO.
 * Equivale a `navStack.push(window.scrollY)` (index.html:6393), en forma inmutable.
 */
export function pushScroll(stack: number[], scrollY: number): number[] {
  return [...stack, scrollY]
}

/**
 * Saca la última posición de la pila (LIFO), devolviendo `{ top, rest }`.
 * Equivale a `navStack.pop()` (index.html:6404). Pila vacía → `{ top: undefined, rest: [] }`.
 */
export function popScroll(stack: number[]): { top: number | undefined, rest: number[] } {
  if (stack.length === 0) return { top: undefined, rest: [] }
  return { top: stack[stack.length - 1], rest: stack.slice(0, -1) }
}

/**
 * ¿El id apunta a una ficha (y por tanto debe interceptarse la navegación)?
 * Discriminador D-02: `monById.has(id)` (reemplaza el `querySelectorAll('.card')` del original,
 * index.html:6420-6429). Un id ausente del índice es una sección → salto nativo, no se intercepta.
 */
export function isFichaTarget(id: string, monById: Map<string, unknown>): boolean {
  return monById.has(id)
}
