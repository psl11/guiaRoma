import type { Stay } from '~~/shared/schemas'

/**
 * Resuelve la base donde se duerme un día (Fase 12, EXT-02; D-06/D-07).
 *
 * El viaje declara sus bases en `trip.stays` y cada día apunta a una con `day.stay` (el `slug`
 * de la base). Esta función devuelve la base del día, o `undefined` si el día no tiene `stay`,
 * si el viaje no tiene `stays` o si el slug no está en la lista. Con `undefined`, DaySection no
 * pinta la línea «Dormís en …» ni ningún texto de relleno.
 *
 * - Nuxt Content entrega `null` para los opcionales ausentes (decisión de la Fase 10): `stay` y
 *   `stays` nulos se tratan igual que ausentes.
 * - La comparación es EXACTA (sin pasar a minúsculas ni recortar espacios): el esquema ya exige
 *   slugs `^[a-z0-9-]+$`, y una referencia rota la señala la regla `stay-ref` de tests/data en
 *   vez de arreglarse aquí en silencio.
 * - El orden de `stays` no importa: cada día busca su base por slug.
 * - D-08: solo se devuelve la base; `area`, `coords` y `note` no se pintan en esta fase.
 *
 * Vive en `app/utils/` para que Nuxt la auto-importe (TripView). Función pura: sin I/O ni estado.
 */
export function stayFor(
  day: { stay?: string | null },
  stays: readonly Stay[] | null | undefined,
): Stay | undefined {
  const slug = day.stay
  if (!slug || !stays) return undefined
  return stays.find(s => s.slug === slug)
}
