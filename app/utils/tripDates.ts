/**
 * Texto de la tarjeta de un viaje en la portada (Fase 11, ROUTE-01) — funciones PURAS.
 *
 * D-09 — `formatTripDates` escribe las fechas en español de forma determinista: sin `Date`, sin
 * `Intl`, sin `toLocaleDateString` (darían resultados distintos según la zona horaria o el
 * locale de la máquina que prerenderiza). Parte el string ISO `YYYY-MM-DD` (D-23: el esquema lo
 * garantiza) y usa una tabla de meses en minúsculas; el día va sin cero a la izquierda.
 *   · mismo mes y año      → «19–23 de junio de 2026» (EN DASH U+2013 sin espacios)
 *   · cruce de mes o año   → «30 de junio de 2026 – 2 de julio de 2026» (` – ` entre fechas completas)
 *   · solo inicio / inicio = fin → «19 de junio de 2026»
 *   · sin inicio           → null (la tarjeta no muestra fechas)
 *
 * `tripMetaLine` une la línea de fechas y los destinos con « · » (U+00B7) y devuelve null si no
 * queda nada (la tarjeta no pinta `p.trip-index-meta`).
 *
 * D-10 — `sortTrips` ordena la portada: `startDate` descendente (comparación de strings ISO, que
 * equivale a la de fechas), los viajes sin `startDate` al final, y el empate (o el orden entre los
 * que no tienen fecha) por el título plano (`inlineMdToPlain`) con `localeCompare(…, 'es')`.
 * Devuelve una copia: nunca muta la entrada.
 *
 * D-16 — `listedTrips` es la lista que pinta la portada: los viajes con `draft` distinto de `true`
 * (null o ausente = publicado), ordenados con `sortTrips`; también en dev, donde los borradores sí
 * se cargan. Estado vacío frente a cargando: devuelve `null` mientras los datos no han llegado
 * (null/undefined) y `[]` solo cuando han llegado y no hay nada publicado, así la portada (11-05)
 * nunca enseña «Todavía no hay viajes publicados» durante la hidratación.
 *
 * Vive en `app/utils/` para que Nuxt la auto-importe en la portada (TripIndex, plan 11-05). Su
 * único import es el relativo `./tripLayout` (sin alias), así que Vitest plano la carga tal cual:
 * tests/unit/tripDates.spec.ts.
 */
import { inlineMdToPlain } from './tripLayout'

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

interface DateParts { year: string, month: string, day: string }

/** `'2026-06-09'` → `{ year: '2026', month: 'junio', day: '9' }` (día sin cero a la izquierda). */
function dateParts(iso: string): DateParts {
  const [year = '', mm = '', dd = ''] = iso.split('-')
  return { year, month: MONTHS[Number(mm) - 1] ?? '', day: String(Number(dd)) }
}

function fullDate(p: DateParts): string {
  return `${p.day} de ${p.month} de ${p.year}`
}

/** Fechas del viaje en español (D-09). Ver la tabla de la cabecera. */
export function formatTripDates(start?: string | null, end?: string | null): string | null {
  if (!start) return null
  const s = dateParts(start)
  if (!end || end === start) return fullDate(s)
  const e = dateParts(end)
  if (s.year === e.year && s.month === e.month) return `${s.day}–${e.day} de ${s.month} de ${s.year}`
  return `${fullDate(s)} – ${fullDate(e)}`
}

/** Línea meta de la tarjeta: fechas y destinos unidos con « · »; null si no hay nada. */
export function tripMetaLine(t: {
  startDate?: string | null
  endDate?: string | null
  destinations?: readonly string[] | null
}): string | null {
  const parts = [formatTripDates(t.startDate, t.endDate), t.destinations?.join(' · ')]
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
  return parts.length > 0 ? parts.join(' · ') : null
}

/** Orden de la portada (D-10): fecha de inicio descendente, sin fecha al final, empate por título. */
export function sortTrips<T extends { title: string, startDate?: string | null }>(trips: readonly T[]): T[] {
  return [...trips].sort((a, b) => {
    const sa = a.startDate ?? ''
    const sb = b.startDate ?? ''
    if (sa !== sb) {
      if (!sa) return 1
      if (!sb) return -1
      return sa < sb ? 1 : -1
    }
    return inlineMdToPlain(a.title).localeCompare(inlineMdToPlain(b.title), 'es')
  })
}

/** Viajes publicados y ordenados (D-16); null mientras los datos no han llegado. */
export function listedTrips<T extends { title: string, startDate?: string | null, draft?: boolean | null }>(
  rows: readonly T[] | null | undefined,
): T[] | null {
  if (rows == null) return null
  return sortTrips(rows.filter(t => t.draft !== true))
}
