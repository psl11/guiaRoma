/**
 * Lógica PURA de la "ruta del día" (FEAT-09) — sin DOM, sin estado, sin Nuxt/Vue.
 *
 * Portada 1:1 del bloque `buildDayRoutes()` del index.html:6582-6643. Por cada día construye
 * un enlace a Google Maps (modo direcciones, a pie) con TODAS sus paradas en orden, de la
 * primera a la última, para ver el recorrido de un vistazo.
 *
 * En el original las paradas salían de escanear el DOM:
 * `section.querySelectorAll('a.maps-link')` (index.html:6629-6632) en orden de aparición.
 * D-01 REEMPLAZA ese DOM-scan por el dato tipado `day.cards: string[]` (orden de DATA-03):
 * el consumidor (DaySection, Plan 06-03, y el test) hace `day.cards → monById → pointFor`.
 * La salida es BYTE-IDÉNTICA a la del index.html.
 *
 * ── INVARIANTES LOAD-BEARING (portar verbatim, NO "corregir") ────────────────────────────
 *
 *  · NINGÚN filtro por `type` (RESEARCH §Pitfall 2). TODAS las fichas de `day.cards` entran en
 *    la ruta, incluidas la guiada `vaticano` (★) y el concierto `auditorium` (♪): en el
 *    index.html ambas llevan un `a.maps-link`, así que el sábado tiene 8 paradas. Un filtro
 *    `type !== 'card'` las DEJARÍA CAER del sábado y rompería la paridad (SC#4). El consumidor
 *    usa el mismo guard defensivo `.filter((m): m is Monument => !!m)` que `DaySection.vue:50`
 *    (descarta solo slugs sin resolver), nunca un filtro de tipo.
 *
 *  · `pointFor` devuelve coordenadas, NUNCA `mapsQuery` (RESEARCH §Pitfall 4). El original
 *    prefería `coordById[card.id]` y solo caía al `?query=` del enlace si faltaban coords
 *    (index.html:6591-6599). Como `MonumentSchema.coords` es NO opcional (shared/schemas.ts:54),
 *    las coords están SIEMPRE presentes y esa rama de respaldo era código muerto: aquí se omite.
 *
 *  · La aritmética de muestreo de `capStops` (index.html:6608) es LOAD-BEARING:
 *    `idx = slots === 1 ? 0 : Math.round((i * (middle.length - 1)) / (slots - 1))`.
 *    NO sustituir por `Math.floor`, NO "arreglar" el off-by-one (RESEARCH §Pitfall 3). Con
 *    datos reales ningún día supera 10 paradas → `capStops` es un paso a través; pero debe
 *    portarse exacto y probarse con un fixture sintético >10 (SC#4).
 *
 * Se extrae a `app/utils/` (igual que `pace.ts`/`cardNav.ts`/`foodGroups.ts`/`dayLabel.ts`)
 * para que Nuxt la auto-importe por nombre de export Y para poder testearla en Vitest plano
 * sin runtime Nuxt (su test: `tests/unit/dayRoute.spec.ts`). Funciones puras: sin I/O, sin
 * estado, sin efectos, sin dependencia de Nuxt/Vue/DOM. Import de tipos solamente (más los
 * helpers puros de `./timelineRows`, por ruta relativa para que Vitest plano los resuelva).
 *
 * ── FASE 12: MODO, OPCIONES Y DÍAS DE FERRY (EXT-06, D-04, D-14) ──────────────────────────────
 *
 *  · Modo por día (D-14): `day.route?.mode` (`walking` | `driving` | `transit`) es el
 *    `travelmode` del enlace. Sin `route` (o con `null`, que es lo que entrega Nuxt Content para
 *    un campo ausente) el modo es `walking` y la URL es BYTE A BYTE la de hoy: Roma no cambia.
 *  · Paradas (D-04): `routeCards(day)` = `day.cards` en su orden menos las fichas citadas SOLO
 *    dentro de opciones de un `choice` (`optionOnlyRefs`). La ruta nunca mezcla la opción A con
 *    la B. Sin `choice` (Roma) devuelve `day.cards` tal cual.
 *  · Visibilidad (D-04, D-14, RESEARCH §Pitfall 11): `routeVisible(day, n)`. Con menos de 2
 *    paradas, nunca (ni con `enabled: true`: no hay URL válida con 0 o 1 punto). `enabled: false`
 *    la oculta; `enabled: true` la fuerza aunque haya ferry; sin `enabled`, un tramo `ferry` en el
 *    día (también dentro de una opción) la oculta: una ruta a pie o en coche no cruza el mar.
 *  · Título (UI-SPEC §«Botón Ver ruta del día»): `routeTitle(mode)` cambia solo el `title`; el
 *    texto visible (`routeLabel`) no nombra el modo. `walking` = el título de hoy, verbatim.
 *  · `MAX_ROUTE_STOPS`, `pointFor`, `capStops` y `routeLabel` no cambian.
 */
import type { Day, Monument, RouteMode } from '~~/shared/schemas'
import { hasTransportVariant, optionOnlyRefs } from './timelineRows'

/** Google Maps admite como máximo 10 paradas por ruta (index.html:6582). */
export const MAX_ROUTE_STOPS = 10

/**
 * Punto de la ruta para una ficha: el string `"lat,lng"` de sus coordenadas
 * (index.html:6588 `p.lat + ',' + p.lng`). NO usa `mapsQuery` (coords siempre presentes,
 * Pitfall 4) y NO codifica aquí (lo hace `buildDirUrl`).
 */
export function pointFor(m: Monument): string {
  return `${m.coords.lat},${m.coords.lng}`
}

/**
 * Si hay más de `MAX_ROUTE_STOPS` paradas, conserva la primera y la última y muestrea el
 * resto uniformemente (index.html:6602-6613). Port VERBATIM — la indexación `Math.round`
 * es load-bearing (Pitfall 3): no cambiar a `Math.floor` ni tocar el off-by-one.
 */
export function capStops(points: string[]): string[] {
  if (points.length <= MAX_ROUTE_STOPS) return points
  const middle = points.slice(1, -1)
  const slots = MAX_ROUTE_STOPS - 2
  const result = [points[0]!]
  for (let i = 0; i < slots; i++) {
    const idx = slots === 1 ? 0 : Math.round((i * (middle.length - 1)) / (slots - 1))
    result.push(middle[idx]!)
  }
  result.push(points[points.length - 1]!)
  return result
}

/**
 * Construye el enlace de direcciones de Google Maps (index.html:6615-6623): mismo
 * orden de parámetros, mismos separadores, mismo `encodeURIComponent`. Los puntos
 * intermedios (`slice(1, -1)`) van como `&waypoints=` codificados y unidos por `|`,
 * solo si los hay.
 *
 * `mode` (Fase 12, D-14) es el `travelmode`. `undefined` y `null` (campo ausente en Nuxt
 * Content) valen `walking`: para Roma la URL es byte a byte la del index.html.
 */
export function buildDirUrl(points: string[], mode?: RouteMode | null): string {
  const enc = encodeURIComponent
  let url = 'https://www.google.com/maps/dir/?api=1&travelmode=' + (mode ?? 'walking')
    + '&origin=' + enc(points[0]!)
    + '&destination=' + enc(points[points.length - 1]!)
  const waypoints = points.slice(1, -1)
  if (waypoints.length) url += '&waypoints=' + waypoints.map(enc).join('|')
  return url
}

/**
 * Etiqueta del botón de ruta (index.html:6641-6643): `(N paradas)` para ≤10 paradas y
 * `(10 de N paradas)` para >10. El original siempre escribe "paradas" (sin pluralización
 * especial).
 */
export function routeLabel(total: number): string {
  return total > MAX_ROUTE_STOPS
    ? `Ver ruta del día (${MAX_ROUTE_STOPS} de ${total} paradas)`
    : `Ver ruta del día (${total} paradas)`
}

/**
 * Fichas que entran en la ruta del día (D-04): `day.cards` en su orden menos las que solo se
 * citan dentro de opciones de un `choice`. Una ficha citada también en una parada común se
 * queda. Sin `choice` (todos los días de Roma) es `day.cards` tal cual.
 */
export function routeCards(day: Pick<Day, 'cards' | 'timeline'>): string[] {
  const excluded = optionOnlyRefs(day.timeline)
  return day.cards.filter(slug => !excluded.has(slug))
}

/**
 * ¿Se pinta el botón «Ver ruta del día»? Precedencia (D-04, D-14, RESEARCH §Pitfall 11):
 *  1. con menos de 2 paradas, nunca (tampoco con `enabled: true`);
 *  2. `route.enabled: false` lo oculta en cualquier día;
 *  3. `route.enabled: true` lo fuerza aunque el día tenga un ferry;
 *  4. sin `enabled`, se oculta si hay un tramo `ferry` en el día, también dentro de una opción.
 * `route` puede llegar `null` desde Nuxt Content (campo ausente): cuenta como sin `route`.
 */
export function routeVisible(
  day: { timeline: Day['timeline'], route?: Day['route'] | null },
  stopCount: number,
): boolean {
  if (stopCount < 2) return false
  if (day.route?.enabled === false) return false
  if (day.route?.enabled === true) return true
  return !hasTransportVariant(day.timeline, 'ferry')
}

/** `title` del botón por modo (12-UI-SPEC). `walking` es el título de hoy, verbatim. */
const ROUTE_TITLE: Record<RouteMode, string> = {
  walking: 'Abre Google Maps con el recorrido del día a pie',
  driving: 'Abre Google Maps con el recorrido del día en coche',
  transit: 'Abre Google Maps con el recorrido del día en transporte público',
}

/** Título del botón de ruta para el modo del día; sin modo (`undefined`/`null`), a pie. */
export function routeTitle(mode?: RouteMode | null): string {
  return ROUTE_TITLE[mode ?? 'walking']
}
