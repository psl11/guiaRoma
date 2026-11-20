// SKELETON (RED, 09-02): contrato tipado de la puerta de datos por viaje. Las funciones
// devuelven vacío a propósito para que invariants.spec.ts cargue y falle en sus asertos.
// La implementación real llega en el commit GREEN.
import { join } from 'node:path'
import {
  ArtistRowSchema,
  ArtistSchema,
  DaySchema,
  FoodSchema,
  MonumentSchema,
  ReferenceRowSchema,
  ReferenceSchema,
  TripSchema,
} from '../../shared/schemas'

export const TRIPS_ROOT = join(process.cwd(), 'content', 'trips')

export const COLLECTIONS = [
  { name: 'trip', match: /^trip\.yml$/, strict: TripSchema, row: TripSchema },
  { name: 'day', match: /^days\/[^/]+\.yml$/, strict: DaySchema, row: DaySchema },
  { name: 'monument', match: /^monuments\/[^/]+\.yml$/, strict: MonumentSchema, row: MonumentSchema },
  { name: 'food', match: /^food\/[^/]+\.yml$/, strict: FoodSchema, row: FoodSchema },
  { name: 'artist', match: /^artists\/[^/]+\.yml$/, strict: ArtistSchema, row: ArtistRowSchema },
  { name: 'reference', match: /^reference\/[^/]+\.yml$/, strict: ReferenceSchema, row: ReferenceRowSchema },
] as const

export type CollectionName = typeof COLLECTIONS[number]['name']

export const SECTION_ANCHORS = ['inicio', 'mapa', 'reservas', 'gastronomia', 'practica', 'arte', 'arquitectura'] as const
export const CHROME_IDS = ['leaflet-map', 'map-offline-banner', 'light-toggle', 'resumen-toggle', 'back-btn', 'search', 'search-results', 'nav-pills'] as const
export const FIXED_DOM_IDS: ReadonlySet<string> = new Set<string>([...SECTION_ANCHORS, ...CHROME_IDS])
export const RESERVED_KEYS: ReadonlySet<string> = new Set(['id', 'meta', 'stem', 'extension', '__hash__'])

export const RULES = [
  'yaml-parse', 'yaml-object', 'trip-yml', 'trip-slug', 'trip-field', 'stray-file', 'reserved-key',
  'unknown-key', 'basename-slug', 'dup-id', 'fixed-anchor', 'ref', 'anchor', 'cross-trip-link',
] as const
export type Rule = typeof RULES[number]

export interface Doc { trip: string, collection: CollectionName, file: string, rel: string, slug: string, kind?: string, data: Record<string, unknown> }
export interface LoadedTrip { dir: string, base: string, docs: Doc[], hasTripYml: boolean, loadViolations: Violation[] }
export interface Violation { file: string, rule: Rule, message: string }

export function listTripDirs(_root: string = TRIPS_ROOT): string[] {
  return []
}

export function loadTripFromFiles(dir: string, _files: Record<string, string>, base = `content/trips/${dir}`): LoadedTrip {
  return { dir, base, docs: [], hasTripYml: true, loadViolations: [] }
}

export function loadTrip(dir: string, _root: string = TRIPS_ROOT): LoadedTrip {
  return { dir, base: `content/trips/${dir}`, docs: [], hasTripYml: true, loadViolations: [] }
}

export function extractAnchors(_md: string): string[] {
  return []
}

export function collectStrings(_value: unknown, acc: string[] = []): string[] {
  return acc
}

export function checkTrip(_t: LoadedTrip): Violation[] {
  return []
}

export function formatViolations(vs: Violation[]): string {
  return vs.map(v => `${v.file}: [${v.rule}] ${v.message}`).join('\n')
}
