import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { deriveMarkers, type MapMarker } from '../../app/utils/mapMarkers'
import type { Monument } from '../../shared/schemas'

/**
 * Cobertura unitaria de la derivación de marcadores del mapa `deriveMarkers` (FEAT-02) —
 * el array `places` de 39 pines del index.html (6269-6314) derivado de datos tipados (D-01).
 *
 * El index.html tenía 39 entradas en `places[]`: 38 monumentos (`.card`) + el Coliseo (★) en
 * la línea 6292, que NO es una ficha. `deriveMarkers(monById, extras)` reconstruye esa lista:
 * mapea los 38 monumentos de `monById` a `MapMarker` y concatena los `extras` (el único es el
 * Coliseo, que llega de `trip.mapExtras`). El blindaje crítico (D-01): si los marcadores se
 * derivaran SOLO de `monById`, saldrían 38 — el Coliseo desaparecería y sería una regresión
 * de paridad. Esta spec lo atrapa exigiendo 39 y la presencia del `★`.
 *
 * Se asevera RECUENTO (39) y PRESENCIA (el `★` del Coliseo, el `♪` del auditorium —
 * concierto), NUNCA el ORDEN: `fitBounds`/marcadores son independientes del orden
 * (RESEARCH Open Q1). El `♪` (auditorium) es un monumento de verdad (sale de `monById`),
 * el `★` (Coliseo) es el extra: juntos prueban que ambos caminos (monumentos + extra) viven
 * en el resultado.
 *
 * Vitest PLANO (mismo loader Node-puro que `tests/unit/dayRoute.spec.ts`): importa
 * `deriveMarkers` por ruta relativa `../../app/utils/mapMarkers` (NO el alias `~~`, corre
 * fuera del resolver de Nuxt) y carga `content/trips/roma/...` con `node:fs` + `yaml`. Sin
 * `@nuxt/test-utils`.
 */

// ── Carga de fixtures (mismo loader Node-puro que dayRoute.spec.ts / invariants.spec.ts) ───────
const ROOT = join(process.cwd(), 'content', 'trips', 'roma')

// Los 38 slugs de monumento (reusados VERBATIM de dayRoute.spec.ts:37-43).
const MON_SLUGS = [
  'galleria-sciarra', 'fontana-trevi', 'santignazio', 'pantheon', 'piazza-navona', 'campo-fiori',
  'vaticano', 'doria-pamphilj', 'santeustachio', 'castel-santangelo', 'tempietto', 'smt', 'fontanone', 'auditorium',
  'giardino-aranci', 'buco-serratura', 'bocca-verita', 'ghetto', 'tartarughe', 'vittoriano', 'monti',
  'minerva', 'san-luigi', 'casanatense', 'torre-scimmia', 'popolo', 'spagna', 'tazza-doro', 'laterano', 'san-clemente', 'san-pietro-vincoli',
  'galleria-borghese', 'palazzo-barberini', 'cappuccini', 'smm', 'santa-teresa', 'palazzo-massimo', 'angeli',
]

/** monById tipado: lee los campos que `deriveMarkers` mapea (slug/roman/name/day/coords/type). */
const monById = new Map<string, Monument>()
for (const slug of MON_SLUGS) {
  const data = parseYaml(readFileSync(join(ROOT, 'monuments', `${slug}.yml`), 'utf8')) as Monument
  monById.set(slug, data)
}

/** El Coliseo extra (el ÚNICO marcador sin ficha), leído de trip.yml `mapExtras` → MapMarker. */
interface TripDoc {
  mapExtras?: Array<{ roman: string, name: string, day: string, coords: { lat: number, lng: number }, type: MapMarker['type'] }>
}
const trip = parseYaml(readFileSync(join(ROOT, 'trip.yml'), 'utf8')) as TripDoc
const coliseoExtra: MapMarker[] = (trip.mapExtras ?? []).map(e => ({
  id: '', // el extra no tiene ficha → id vacío (la lógica de popup de Plan 02 usa `type`, no `id`)
  n: e.roman,
  name: e.name,
  day: e.day,
  lat: e.coords.lat,
  lng: e.coords.lng,
  type: e.type,
}))

// ── 1. Recuento: 38 monumentos + 1 Coliseo extra = 39 (D-01) ───────────────────────────────────
describe('deriveMarkers — recuento de 39 pines (FEAT-02 D-01, index.html:6269-6314)', () => {
  it('38 monumentos + el Coliseo extra → exactamente 39 marcadores', () => {
    const markers = deriveMarkers(monById, coliseoExtra)
    expect(markers.length).toBe(39)
  })

  it('sin extras, deriva SOLO los 38 monumentos (el Coliseo se perdería — guard de D-01)', () => {
    // Demuestra que el Coliseo NO está entre los monumentos: derivar de monById solo da 38.
    expect(deriveMarkers(monById, []).length).toBe(38)
    expect(coliseoExtra.length).toBe(1)
  })
})

// ── 2. Presencia (no orden): el ★ del Coliseo y el ♪ del auditorium ────────────────────────────
describe('deriveMarkers — presencia del ★ (Coliseo) y el ♪ (auditorium), sin depender del orden', () => {
  it('incluye un marcador con n === "★" y type "guided" (el Coliseo extra)', () => {
    const markers = deriveMarkers(monById, coliseoExtra)
    const star = markers.filter(m => m.n === '★')
    // El index.html tiene DOS ★ (vaticano + Coliseo); aquí el extra es el Coliseo (guided, sin ficha).
    expect(star.length).toBeGreaterThanOrEqual(1)
    const coliseo = star.find(m => m.name === 'Coliseo + Foro + Palatino (guiado)')
    expect(coliseo).toBeDefined()
    expect(coliseo!.type).toBe('guided')
    expect(coliseo!.id).toBe('') // el extra no tiene ficha
  })

  it('incluye un marcador con n === "♪" (el auditorium, concierto, que SÍ es monumento)', () => {
    const markers = deriveMarkers(monById, coliseoExtra)
    const concert = markers.find(m => m.n === '♪')
    expect(concert).toBeDefined()
    expect(concert!.type).toBe('concert')
  })
})

// ── 3. Mapeo de campos: un monumento conocido se proyecta a la forma MapMarker ──────────────────
describe('deriveMarkers — mapeo de campos {id:slug, n:roman, name, day, lat, lng, type}', () => {
  it('galleria-sciarra (monumento) se mapea con id=slug y coords desplegadas a lat/lng', () => {
    const markers = deriveMarkers(monById, coliseoExtra)
    const gs = markers.find(m => m.id === 'galleria-sciarra')
    const src = monById.get('galleria-sciarra')!
    expect(gs).toBeDefined()
    expect(gs!.n).toBe(src.roman)
    expect(gs!.name).toBe(src.name)
    expect(gs!.day).toBe(src.day)
    expect(gs!.lat).toBe(src.coords.lat)
    expect(gs!.lng).toBe(src.coords.lng)
    expect(gs!.type).toBe(src.type)
  })
})
