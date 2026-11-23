/**
 * Matriz de visibilidad por ritmo del timeline (FEAT-06) — función PURA.
 *
 * Portada 1:1 de la lógica de `setPace()` (index.html:6521-6534). Cada fila del timeline
 * lleva un `data-pace` (`all` | `medium` | `slow-only`) y el ritmo elegido por el usuario
 * (`optimistic` | `neutral` | `slow`) decide si la fila se ve. La regla del original:
 *   - optimistic → no oculta nada (todo visible).
 *   - neutral    → oculta `slow-only` (`hide = itemPace === 'slow-only'`).
 *   - slow       → oculta `slow-only` Y `medium` (`hide = slow-only || medium`).
 * Aquí se expresa en POSITIVO (¿se ve?) en vez del `hide` del original; es la misma matriz.
 *
 * IMPORTANTE — la matriz es CONTRAINTUITIVA y NO se "corrige" (RESEARCH §Pitfall 4): en
 * `slow` desaparece tanto `slow-only` como `medium`, dejando solo `all`. Son EXACTAMENTE
 * tres ramas; añadir una cuarta o reordenarlas rompería la paridad SC#1.
 *
 * Se extrae a `app/utils/` (igual que `dayLabel.ts`) para que Nuxt la auto-importe como
 * `isVisible` en el composable/componentes Y para poder testearla en Vitest plano, sin
 * runtime Nuxt (su test, `tests/unit/pace.spec.ts`, cubre las 9 casillas). Es una función
 * pura: sin I/O, sin estado, sin efectos, sin dependencia de Nuxt/Vue.
 */

/** Ritmo elegido por el usuario (data-pace de los `.pace-btn`). */
export type Pace = 'optimistic' | 'neutral' | 'slow'

/** Ritmo de una fila del timeline (atributo `data-pace` de `.tl-item`/`.tl-transport`). */
export type ItemPace = 'all' | 'medium' | 'slow-only'

/**
 * ¿La fila con ritmo `itemPace` es visible bajo el ritmo de viaje `pace`?
 * Matriz EXACTA (index.html:6525-6531), tres ramas, sin "correcciones".
 */
export function isVisible(itemPace: ItemPace, pace: Pace): boolean {
  if (pace === 'optimistic') return true
  if (pace === 'neutral') return itemPace !== 'slow-only'
  // pace === 'slow': solo 'all' sobrevive (oculta 'slow-only' Y 'medium').
  return itemPace === 'all'
}
