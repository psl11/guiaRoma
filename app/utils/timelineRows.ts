/**
 * Helpers PUROS sobre las filas del timeline de un día con alternativas (Fase 12, EXT-01/EXT-06).
 *
 * Desde la Fase 12 un día puede tener filas `choice` (D-01): un bloque de 2 o 3 opciones, cada una
 * con sus propias filas base (`stop`, `transport`, `meta`, `food`, `reservation`). Un solo nivel:
 * una opción nunca contiene otro `choice`. La «ruta del día» (app/utils/dayRoute.ts) necesita
 * mirar dentro de esas opciones para dos cosas:
 *
 *  · D-04 — la ruta nunca mezcla A y B: las fichas citadas SOLO dentro de opciones no son paradas
 *    de la ruta (`optionOnlyRefs`). Una ficha citada también en una fila común sí lo es.
 *  · D-14 — un tramo en ferry oculta la ruta a pie o en coche, también si va dentro de una opción
 *    (`hasTransportVariant` sobre `flattenRows`).
 *
 * Roma no tiene `choice`: `flattenRows(day.timeline)` es su timeline tal cual y `optionOnlyRefs`
 * es vacío, así que su ruta no cambia.
 *
 * Mismo convenio que pace.ts/dayRoute.ts: en `app/utils/` para que Nuxt lo auto-importe y para
 * poder probarlo en Vitest plano (tests/unit/timelineRows.spec.ts). Sin I/O, sin estado, sin
 * Nuxt/Vue/DOM; solo importa tipos.
 */
import type { BaseTimelineRow, Day } from '~~/shared/schemas'

/** Una fila del nivel superior del timeline de un día (las 5 base o un `choice`). */
type Row = Day['timeline'][number]
/** Variante de un tramo `transport` (`ferry`, `car`, …). */
type TransportVariantValue = NonNullable<Extract<BaseTimelineRow, { kind: 'transport' }>['variant']>

/**
 * Las filas del nivel superior que no son `choice` más las `rows` de cada opción, en el orden
 * del dato. Las filas `choice` en sí no aparecen (solo su contenido).
 */
export function flattenRows(rows: readonly Row[]): BaseTimelineRow[] {
  return rows.flatMap(r => (r.kind === 'choice' ? r.options.flatMap(o => o.rows) : [r]))
}

/**
 * `ref` de las paradas que aparecen SOLO dentro de opciones de un `choice` (D-04). Una `ref` que
 * también está en una parada común del día no cuenta: esa ficha forma parte del recorrido
 * compartido.
 */
export function optionOnlyRefs(rows: readonly Row[]): Set<string> {
  const shared = new Set<string>()
  const inOptions = new Set<string>()
  for (const r of rows) {
    if (r.kind === 'stop' && r.ref) shared.add(r.ref)
    if (r.kind !== 'choice') continue
    for (const o of r.options) {
      for (const x of o.rows) if (x.kind === 'stop' && x.ref) inOptions.add(x.ref)
    }
  }
  return new Set([...inOptions].filter(ref => !shared.has(ref)))
}

/** ¿Hay algún tramo `transport` con esa variante, en una fila común o dentro de una opción? */
export function hasTransportVariant(rows: readonly Row[], variant: TransportVariantValue): boolean {
  return flattenRows(rows).some(r => r.kind === 'transport' && r.variant === variant)
}
