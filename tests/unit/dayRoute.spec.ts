import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { pointFor, capStops, buildDirUrl, routeLabel, MAX_ROUTE_STOPS } from '../../app/utils/dayRoute'
import * as dayRoute from '../../app/utils/dayRoute'
import { DaySchema, type Day } from '../../shared/schemas'

/**
 * Cobertura unitaria de la "ruta del día" (FEAT-09) — port verbatim del index.html:6582-6643.
 *
 * El original construía la ruta escaneando el DOM (`section.querySelectorAll('a.maps-link')`,
 * index.html:6629-6632) en orden de aparición, SIN filtrar por tipo de ficha. D-01 deriva la
 * misma ruta del dato tipado `day.cards: string[]` → `monById` → `pointFor`. Esta spec asevera
 * que la salida es estructuralmente idéntica y, en particular, blinda los pitfalls de RESEARCH:
 *
 *  · SC#4 — paridad de URL por día: estructura `maps/dir/?api=1&travelmode=walking&origin=…&
 *    destination=…` + nº de waypoints = (paradas − 2), y el RECUENTO EXACTO de paradas por día
 *    (viernes=6, sabado=8, domingo=7, lunes=10, martes=7).
 *  · Pitfall 2 — el sábado tiene 8 paradas e INCLUYE la guiada `vaticano` (★) y el concierto
 *    `auditorium` (♪). Un filtro `type !== 'card'` las dejaría caer: este es el guard que lo
 *    detecta.
 *  · Pitfall 3 — `capStops` con un fixture sintético de 12 paradas: exactamente 10 de salida,
 *    primera/última preservadas, e índices del muestreo IGUALES a la fórmula literal
 *    `Math.round((i*(middle.length-1))/(slots-1))` (calculados explícitamente aquí para
 *    atrapar un off-by-one).
 *  · `routeLabel` — `(N paradas)` para ≤10, `(10 de N paradas)` para >10.
 *
 * Vitest PLANO (mismo estilo que `tests/unit/cardNavigation.spec.ts` / `pace.spec.ts`):
 * importa las funciones por ruta relativa `../../app/utils/dayRoute` (NO el alias `~~`, estos
 * tests corren fuera del resolver de Nuxt), y carga los fixtures `content/trips/roma/...` con
 * `node:fs` + `yaml` (igual que `tests/data/invariants.spec.ts`). Sin `@nuxt/test-utils`.
 */

// ── Carga de fixtures (mismo loader Node-puro que invariants.spec.ts) ─────────────────────────
const ROOT = join(process.cwd(), 'content', 'trips', 'roma')

interface MonDoc { slug: string, coords: { lat: number, lng: number } }
const MON_SLUGS = [
  'galleria-sciarra', 'fontana-trevi', 'santignazio', 'pantheon', 'piazza-navona', 'campo-fiori',
  'vaticano', 'doria-pamphilj', 'santeustachio', 'castel-santangelo', 'tempietto', 'smt', 'fontanone', 'auditorium',
  'giardino-aranci', 'buco-serratura', 'bocca-verita', 'ghetto', 'tartarughe', 'vittoriano', 'monti',
  'minerva', 'san-luigi', 'casanatense', 'torre-scimmia', 'popolo', 'spagna', 'tazza-doro', 'laterano', 'san-clemente', 'san-pietro-vincoli',
  'galleria-borghese', 'palazzo-barberini', 'cappuccini', 'smm', 'santa-teresa', 'palazzo-massimo', 'angeli',
]

/** monById tipado mínimo (solo lo que `pointFor` lee: `coords`). */
const monById = new Map<string, MonDoc>()
for (const slug of MON_SLUGS) {
  const data = parseYaml(readFileSync(join(ROOT, 'monuments', `${slug}.yml`), 'utf8')) as MonDoc
  monById.set(slug, data)
}

/** Lee `cards: string[]` de un día. */
function dayCards(day: string): string[] {
  const data = parseYaml(readFileSync(join(ROOT, 'days', `${day}.yml`), 'utf8')) as { cards: string[] }
  return data.cards
}

/** El MISMO encadenado que el consumidor (DaySection): cards → monById → filter → pointFor. */
function dayPoints(day: string): string[] {
  return dayCards(day)
    .map(slug => monById.get(slug))
    .filter((m): m is MonDoc => !!m)
    .map(m => pointFor(m as never)) // `as never`: pointFor solo usa `.coords`, no el Monument completo
}

const DAYS: Array<{ day: string, stops: number }> = [
  { day: 'viernes', stops: 6 },
  { day: 'sabado', stops: 8 },
  { day: 'domingo', stops: 7 },
  { day: 'lunes', stops: 10 },
  { day: 'martes', stops: 7 },
]

// ── 1. SC#4 — paridad de URL por día ──────────────────────────────────────────────────────────
describe('ruta del día — paridad de URL por día (FEAT-09 SC#4, index.html:6615-6643)', () => {
  const URL_RE = /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&travelmode=walking&origin=.+&destination=.+/

  for (const { day, stops } of DAYS) {
    it(`${day}: ${stops} paradas resueltas → URL de direcciones a pie con ${stops - 2} waypoints`, () => {
      const points = dayPoints(day)
      // Recuento EXACTO de paradas resueltas (ningún slug sin resolver, ningún filtro de tipo).
      expect(points.length).toBe(stops)

      const capped = capStops(points)
      // Ningún día real supera 10 → capStops es paso a través.
      expect(capped.length).toBe(stops)

      const url = buildDirUrl(capped)
      expect(url).toMatch(URL_RE)

      // origin = primera parada, destination = última (encodeURIComponent las preserva: la coma
      // se codifica a %2C, así que comprobamos el valor codificado).
      expect(url).toContain('&origin=' + encodeURIComponent(capped[0]!))
      expect(url).toContain('&destination=' + encodeURIComponent(capped[capped.length - 1]!))

      // nº de waypoints = paradas − 2 (el bloque `&waypoints=a|b|c`).
      const wpMatch = url.match(/&waypoints=([^&]*)/)
      const waypointCount = wpMatch ? wpMatch[1]!.split('|').length : 0
      expect(waypointCount).toBe(stops - 2)
    })
  }
})

// ── 2. Pitfall 2 — el sábado incluye vaticano (★) y auditorium (♪), 8 paradas, SIN filtro ──────
describe('ruta del día — Pitfall 2: sábado = 8 paradas incl. guiada+concierto (RESEARCH §Pitfall 2)', () => {
  it('sábado resuelve exactamente 8 paradas (ningún filtro por type las descarta)', () => {
    expect(dayPoints('sabado').length).toBe(8)
  })

  it('las coords de vaticano (guided) y auditorium (concert) ESTÁN entre las paradas del sábado', () => {
    const points = dayPoints('sabado')
    const vaticano = monById.get('vaticano')!
    const auditorium = monById.get('auditorium')!
    const vaticanoPoint = `${vaticano.coords.lat},${vaticano.coords.lng}`
    const auditoriumPoint = `${auditorium.coords.lat},${auditorium.coords.lng}`

    // Si un filtro `type !== 'card'` se colara, estas dos paradas desaparecerían → este es el guard.
    expect(points).toContain(vaticanoPoint)
    expect(points).toContain(auditoriumPoint)
  })
})

// ── 3. Pitfall 3 — capStops con >10 paradas (fixture sintético) ────────────────────────────────
describe('capStops — muestreo literal con >10 paradas (RESEARCH §Pitfall 3, index.html:6602-6613)', () => {
  // 12 paradas distintas "lat,lng" sintéticas.
  const synthetic = Array.from({ length: 12 }, (_, i) => `${i},${i}`)

  it('reduce 12 → exactamente 10 paradas, preservando primera y última', () => {
    const result = capStops(synthetic)
    expect(result.length).toBe(MAX_ROUTE_STOPS) // 10
    expect(result[0]).toBe(synthetic[0]) // '0,0'
    expect(result[result.length - 1]).toBe(synthetic[synthetic.length - 1]) // '11,11'
  })

  it('los 8 índices intermedios IGUALAN la fórmula literal Math.round((i*(middle.length-1))/(slots-1))', () => {
    const result = capStops(synthetic)
    const middle = synthetic.slice(1, -1) // 10 elementos: '1,1'..'10,10'
    const slots = MAX_ROUTE_STOPS - 2 // 8
    // Índices esperados calculados EXPLÍCITAMENTE (un off-by-one o Math.floor los desviaría).
    const expectedIdx = Array.from({ length: slots }, (_, i) =>
      slots === 1 ? 0 : Math.round((i * (middle.length - 1)) / (slots - 1)),
    )
    const expectedMiddle = expectedIdx.map(idx => middle[idx])
    // result = [first, ...8 sampled, last]; los 8 del medio son result[1..8].
    expect(result.slice(1, -1)).toEqual(expectedMiddle)
    // Snapshot numérico de los índices para fijar la aritmética (verbatim del original):
    expect(expectedIdx).toEqual([0, 1, 3, 4, 5, 6, 8, 9])
  })

  it('≤10 paradas → paso a través (mismo array sin tocar)', () => {
    const ten = Array.from({ length: 10 }, (_, i) => `${i},${i}`)
    expect(capStops(ten)).toBe(ten)
  })
})

// ── 4. routeLabel — ternario (N paradas) / (10 de N paradas) ───────────────────────────────────
describe('routeLabel — etiqueta del botón (FEAT-09, index.html:6641-6643)', () => {
  it('≤10 paradas → "(N paradas)"', () => {
    expect(routeLabel(6)).toBe('Ver ruta del día (6 paradas)')
    expect(routeLabel(8)).toBe('Ver ruta del día (8 paradas)')
    expect(routeLabel(10)).toBe('Ver ruta del día (10 paradas)')
  })

  it('>10 paradas → "(10 de N paradas)" (usa MAX_ROUTE_STOPS)', () => {
    expect(routeLabel(12)).toBe('Ver ruta del día (10 de 12 paradas)')
  })
})

// ── 5. Fase 12 (EXT-06, D-04, D-14): modo, opciones y días de ferry ────────────────────────────
// La ruta del día gana `day.route` (modo y forzado), excluye las fichas de solo-opción y se oculta
// en los días de ferry. Para Roma nada de eso aplica: aquí se fija, con el YAML real de cada día,
// que su URL es la de la plantilla de hoy escrita a mano, carácter a carácter.
const { routeCards, routeVisible, routeTitle } = dayRoute

/** Día real de Roma pasado por el esquema (como lo entrega la guía, con sus defaults). */
function romaDay(day: string): Day {
  return DaySchema.parse(parseYaml(readFileSync(join(ROOT, 'days', `${day}.yml`), 'utf8')))
}

/** La plantilla de la URL de hoy (index.html:6615-6623), escrita literalmente: a pie, siempre. */
function todayUrl(points: string[]): string {
  const enc = encodeURIComponent
  const waypoints = points.slice(1, -1)
  return 'https://www.google.com/maps/dir/?api=1&travelmode=walking'
    + '&origin=' + enc(points[0]!)
    + '&destination=' + enc(points[points.length - 1]!)
    + (waypoints.length ? '&waypoints=' + waypoints.map(enc).join('|') : '')
}

/** La cadena nueva de DaySection: routeCards → monById → filter → pointFor. */
function routePoints(day: Day): string[] {
  return routeCards(day)
    .map(slug => monById.get(slug))
    .filter((m): m is MonDoc => !!m)
    .map(m => pointFor(m as never))
}

const WALKING_TITLE = 'Abre Google Maps con el recorrido del día a pie'

describe('ruta del día — Roma byte a byte con route/routeCards (D-14)', () => {
  for (const { day, stops } of DAYS) {
    it(`${day}: Roma byte a byte — routeCards = day.cards, visible, URL a pie de hoy y título de hoy`, () => {
      const d = romaDay(day)
      expect(d.route).toBeUndefined()
      expect(routeCards(d)).toEqual(d.cards)

      const points = routePoints(d)
      expect(points.length).toBe(stops)
      expect(points).toEqual(dayPoints(day))
      expect(routeVisible(d, points.length)).toBe(true)

      const url = buildDirUrl(capStops(points), d.route?.mode)
      expect(url).toBe(todayUrl(points))
      expect(url.startsWith('https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=')).toBe(true)
      expect(routeTitle(d.route?.mode)).toBe(WALKING_TITLE)
      expect(routeLabel(points.length)).toBe(`Ver ruta del día (${stops} paradas)`)
    })
  }
})

describe('ruta del día — modos (D-14)', () => {
  const p = ['41.9,12.48', '41.89,12.47', '41.88,12.46']

  it('sin modo, walking, null y undefined dan la misma URL (a pie)', () => {
    const base = buildDirUrl(p)
    expect(buildDirUrl(p, 'walking')).toBe(base)
    expect(buildDirUrl(p, null)).toBe(base)
    expect(buildDirUrl(p, undefined)).toBe(base)
    expect(base).toBe(todayUrl(p))
  })

  it('driving y transit ponen su travelmode y conservan el resto de la URL', () => {
    const rest = todayUrl(p).slice('https://www.google.com/maps/dir/?api=1&travelmode=walking'.length)
    expect(buildDirUrl(p, 'driving')).toBe('https://www.google.com/maps/dir/?api=1&travelmode=driving' + rest)
    expect(buildDirUrl(p, 'transit')).toBe('https://www.google.com/maps/dir/?api=1&travelmode=transit' + rest)
  })
})

describe('ruta del día — precedencia de visibilidad (D-04, D-14, Pitfall 11)', () => {
  const stop = (ref: string) => ({ kind: 'stop', time: '10:00', title: ref, ref })
  const ferry = { kind: 'transport', variant: 'ferry', header: 'Ferry', modes: [] }
  const choiceWith = (rows: unknown[]) => ({
    kind: 'choice',
    options: [{ label: 'A', title: 'A', rows }, { label: 'B', title: 'B', rows: [stop('b')] }],
  })
  const day = (timeline: unknown[], route?: unknown, cards: string[] = []): Day => DaySchema.parse({
    slug: 'fixture', trip: 'fixture', order: 1, roman: 'I', eyebrow: 'e', title: 't', subtitle: 's',
    stats: [], timeline, cards, ...(route === undefined ? {} : { route }),
  })

  it('2 paradas sin route ni ferry → visible', () => {
    expect(routeVisible(day([stop('a'), stop('b')]), 2)).toBe(true)
  })

  it('con un ferry → oculto', () => {
    expect(routeVisible(day([stop('a'), ferry, stop('b')]), 2)).toBe(false)
  })

  it('con un ferry dentro de una opción → oculto', () => {
    expect(routeVisible(day([stop('a'), choiceWith([ferry]), stop('c')]), 2)).toBe(false)
  })

  it('ferry + route.enabled: true → visible', () => {
    expect(routeVisible(day([stop('a'), ferry, stop('b')], { enabled: true }), 2)).toBe(true)
  })

  it('route.enabled: false sin ferry → oculto', () => {
    expect(routeVisible(day([stop('a'), stop('b')], { enabled: false }), 2)).toBe(false)
  })

  it('route.enabled: true con 1 parada → oculto (Pitfall 11)', () => {
    expect(routeVisible(day([stop('a')], { enabled: true }), 1)).toBe(false)
  })

  it('0 paradas → oculto', () => {
    expect(routeVisible(day([]), 0)).toBe(false)
  })

  it('route null (campo ausente en Nuxt Content) cuenta como sin route', () => {
    const d = day([stop('a'), stop('b')])
    expect(routeVisible({ ...d, route: null }, 2)).toBe(true)
  })

  it('routeCards excluye las fichas de solo-opción y conserva el orden de cards', () => {
    const d = day(
      [stop('a'), choiceWith([stop('a'), stop('solo-a')]), stop('c')],
      undefined,
      ['a', 'solo-a', 'b', 'c'],
    )
    expect(routeCards(d)).toEqual(['a', 'c'])
  })
})

describe('ruta del día — routeTitle (D-14, 12-UI-SPEC)', () => {
  it('sin modo y walking → el título de hoy, verbatim', () => {
    expect(routeTitle()).toBe(WALKING_TITLE)
    expect(routeTitle('walking')).toBe(WALKING_TITLE)
    expect(routeTitle(null)).toBe(WALKING_TITLE)
  })

  it('driving → «… en coche»; transit → «… en transporte público»', () => {
    expect(routeTitle('driving')).toBe('Abre Google Maps con el recorrido del día en coche')
    expect(routeTitle('transit')).toBe('Abre Google Maps con el recorrido del día en transporte público')
  })
})
