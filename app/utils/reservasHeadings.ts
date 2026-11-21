/**
 * Encabezados de la sección Reservas por viaje (Fase 12.1, habilitador de CAMP-04; D-01…D-03).
 *
 * Hasta la Fase 12 los tres encabezados de ReservasSection.vue eran literales de Roma: el del
 * primer bloque de confirmados («3 comensales»), el del segundo («Visitas y entradas
 * reservadas») y la cabecera de la tabla («Restaurantes · …»). Un viaje que reserva vuelos,
 * barcos o conciertos heredaba esos textos, que sobre el terreno son información falsa.
 *
 * - D-01: cada viaje puede declarar en su `reservas.yml` un `headings` opcional y estricto
 *   (`{ mesas?, visitas?, table? }`, ver `ReservasHeadings` en shared/schemas.ts). Los valores
 *   son texto plano: la plantilla los interpola con `{{ }}` (auto-escapado), sin Markdown.
 * - D-02: la clave que falte cae al texto de Roma. Los textos de Roma se definen UNA sola vez,
 *   aquí (`RESERVAS_HEADINGS_DEFAULT`), copiados byte a byte de index.html (líneas 5267, 5277 y
 *   5284; el emoji del segundo lleva U+FE0F y el del primero no). Roma no declara `headings`,
 *   así que su sección Reservas sale idéntica (lo defiende tests/data/romaReservas.spec.ts).
 * - D-03: `confirmedGroup` devuelve las entradas de un grupo; con la lista vacía, la plantilla
 *   no pinta ni el encabezado ni la lista de ese grupo, y sin entradas en ninguno de los dos,
 *   no pinta el bloque de confirmados.
 *
 * Nuxt Content entrega `null` para los opcionales ausentes (decisión de la Fase 10): `headings`,
 * cada una de sus claves y `confirmed` nulos se tratan igual que ausentes.
 *
 * Vive en `app/utils/` para que Nuxt la auto-importe (ReservasSection). Funciones puras: sin
 * I/O ni estado.
 */

/** Textos de Roma, los de siempre. Congelado: nadie lo muta por accidente. */
export const RESERVAS_HEADINGS_DEFAULT = Object.freeze({
  mesas: '✅ Ya reservado · 3 comensales',
  visitas: '🎟️ Visitas y entradas reservadas',
  table: 'Restaurantes · cuándo reservar y con cuánta antelación',
})

/** Claves de `headings`: primer bloque, segundo bloque y cabecera de la tabla. */
export type ReservasHeadingKey = keyof typeof RESERVAS_HEADINGS_DEFAULT

/** Los tres encabezados ya resueltos (cada uno, el del viaje o el de Roma). */
export type ReservasHeadingsResolved = Record<ReservasHeadingKey, string>

/**
 * Resuelve los tres encabezados: el valor del viaje si es un texto no vacío; si es `null`,
 * `undefined` o `''`, el texto de Roma. Devuelve siempre un objeto NUEVO (mutarlo no cambia
 * `RESERVAS_HEADINGS_DEFAULT`).
 */
export function resolveReservasHeadings(
  headings: Partial<Record<ReservasHeadingKey, string | null>> | null | undefined,
): ReservasHeadingsResolved {
  const pick = (key: ReservasHeadingKey): string => headings?.[key] || RESERVAS_HEADINGS_DEFAULT[key]
  return { mesas: pick('mesas'), visitas: pick('visitas'), table: pick('table') }
}

/**
 * Entradas de `confirmed` de un grupo, en el orden del dato. Con `confirmed` nulo o ausente, o
 * sin entradas de ese grupo, devuelve `[]` (D-03: la plantilla no pinta ese grupo).
 */
export function confirmedGroup<T extends { group: 'mesas' | 'visitas' }>(
  confirmed: readonly T[] | null | undefined,
  group: 'mesas' | 'visitas',
): T[] {
  if (!confirmed) return []
  return confirmed.filter(c => c.group === group)
}
