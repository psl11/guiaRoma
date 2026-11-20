// Tipos de scripts/tripManifest.mjs (D-23): el typecheck de nuxt.config.ts / content.config.ts
// solo ve estas declaraciones, nunca el `node:fs` de la implementación.

/** Un viaje de content/trips/: `slug` = nombre de carpeta; `draft` = `draft: true` en su trip.yml. */
export interface TripManifestEntry {
  slug: string
  draft: boolean
}

/** Nombre de carpeta de viaje válido; espejo de `TRIP_SLUG_RE` (shared/schemas.ts). */
export declare const TRIP_FOLDER_RE: RegExp

/** Viajes con trip.yml bajo `root` (por defecto content/trips), ordenados por slug. */
export declare function readTripManifest(root?: string): TripManifestEntry[]

/** Globs `exclude` de Nuxt Content (`trips/<slug>/**`) de cada borrador; `[]` si `keepDrafts`. */
export declare function draftExcludes(entries: readonly TripManifestEntry[], keepDrafts: boolean): string[]

/** `['/', …'/trips/<slug>/']` de cada viaje no borrador, en orden de slug. */
export declare function prerenderRoutes(entries: readonly TripManifestEntry[]): string[]
