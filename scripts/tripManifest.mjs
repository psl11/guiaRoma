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

/** Orden estable por slug (ASCII: los slugs válidos son `[a-z0-9]`, sin depender del locale). */
const bySlug = (a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)

/**
 * Viajes de `root` (por defecto content/trips): subdirectorios con trip.yml, como
 * `{ slug, draft }` ordenados por slug. `slug` = nombre de carpeta (la puerta tests/data ya
 * exige carpeta == slug).
 *
 * FAIL-CLOSED (T-11-04): una carpeta con trip.yml cuyo nombre no cumple `TRIP_FOLDER_RE` lanza
 * (el slug acaba tal cual en la URL `/trips/<slug>/`: nunca hace falta codificarlo), y un `draft`
 * presente que no sea booleano también (un `draft: "yes"` nunca se publica por defecto).
 * `draft` ausente o `null` = `false`.
 * Las carpetas OCULTAS (`.x/`) no se saltan (CR-01): Nuxt Content globa con `dot: true` y las
 * ingeriría, así que saltarlas dejaría un `draft: true` fuera de `draftExcludes` (publicado en
 * los `sql_dump`). Con trip.yml, `TRIP_FOLDER_RE` no casa con el `.` inicial y lanza.
 * @param {string} [root]
 * @returns {{ slug: string, draft: boolean }[]}
 */
export function readTripManifest(root = TRIPS_ROOT) {
  return readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(root, d.name, 'trip.yml')))
    .map((d) => {
      if (!TRIP_FOLDER_RE.test(d.name)) {
        throw new Error(`content/trips/${d.name}: nombre de carpeta de viaje inválido; debe cumplir ${TRIP_FOLDER_RE} (minúsculas ASCII y dígitos, sin guiones) porque es el slug y el segmento de la URL /trips/<slug>/`)
      }
      const file = `content/trips/${d.name}/trip.yml`
      const parsed = parse(readFileSync(join(root, d.name, 'trip.yml'), 'utf8'))
      const draft = parsed?.draft
      if (draft !== undefined && draft !== null && typeof draft !== 'boolean') {
        throw new Error(`${file}: la clave draft debe ser booleana (true/false) y vale ${JSON.stringify(draft)}`)
      }
      return { slug: d.name, draft: draft === true }
    })
    .sort(bySlug)
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

/**
 * Rutas a prerenderizar (D-13): la portada y la guía de cada viaje NO borrador, en orden de slug
 * y SIEMPRE con barra final (`/trips/<slug>/`). Sin viajes publicados → solo `['/']`.
 * @param {readonly { slug: string, draft: boolean }[]} entries
 * @returns {string[]}
 */
export function prerenderRoutes(entries) {
  return ['/', ...[...entries].filter(t => !t.draft).sort(bySlug).map(t => `/trips/${t.slug}/`)]
}
