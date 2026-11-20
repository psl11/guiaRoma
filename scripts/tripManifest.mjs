// tripManifest.mjs — Manifiesto de viajes leído en TIEMPO DE CONFIG (Fase 11, D-13, D-16, D-23).
// Lista las carpetas de content/trips/ que tienen trip.yml y lee su campo `draft`. Es la FUENTE
// ÚNICA de dos consumidores: content.config.ts (excluye los borradores de las 6 colecciones de
// Nuxt Content fuera de `nuxi dev`) y nuxt.config.ts (rutas de prerender `/trips/<slug>/`, 11-03).
//
// Por qué `.mjs` + `.d.mts` y no un `.ts` (D-23): el proyecto no tiene @types/node, y un `.ts`
// que importe `node:fs` dentro del grafo de nuxt.config hace fallar `nuxi typecheck` (TS2307).
// Un módulo ESM de Node puro con sus tipos al lado lo cargan igual jiti (configs), Vitest y Node,
// y el typecheck solo ve las declaraciones de tripManifest.d.mts.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

/** content/trips resuelto desde este fichero (nunca desde process.cwd()). */
const TRIPS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'trips')

/**
 * Nombre de carpeta de viaje válido. ESPEJO de `TRIP_SLUG_RE` (shared/schemas.ts): no se importa
 * de allí porque un `.mjs` no puede cargar TypeScript fuera de jiti/Vitest. Un test comprueba
 * que ambos patrones son idénticos.
 */
export const TRIP_FOLDER_RE = /^[a-z0-9]+$/

/**
 * Viajes de `root` (por defecto content/trips): subdirectorios no ocultos con trip.yml, como
 * `{ slug, draft }` ordenados por slug. `slug` = nombre de carpeta (la puerta tests/data ya
 * exige carpeta == slug).
 * @param {string} [root]
 * @returns {{ slug: string, draft: boolean }[]}
 */
export function readTripManifest(root = TRIPS_ROOT) {
  return readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && existsSync(join(root, d.name, 'trip.yml')))
    .map((d) => {
      const parsed = parse(readFileSync(join(root, d.name, 'trip.yml'), 'utf8'))
      return { slug: d.name, draft: parsed?.draft === true }
    })
    .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
}

/**
 * Globs `exclude` de Nuxt Content (relativos a content/) para los borradores. Con
 * `keepDrafts` (solo `nuxi dev`) no se excluye nada.
 * @param {readonly { slug: string, draft: boolean }[]} entries
 * @param {boolean} keepDrafts
 * @returns {string[]}
 */
export function draftExcludes(entries, keepDrafts) {
  if (keepDrafts) return []
  return entries.filter(t => t.draft).map(t => `trips/${t.slug}/**`)
}
