import type { Artist, Food, Monument, Reference } from '~~/shared/schemas'

/**
 * Construye las Maps id-indexadas de un viaje para resolución O(1) de cross-refs (SC#1).
 *
 * `useTrip` agrega las 6 colecciones; las entidades referenciables por ancla
 * (`monument`/`food`/`artist`/`reference`) se indexan por su `slug` — el ancla estable
 * (= `#id` del index.html), NUNCA el campo `id` reservado de Content. Los consumidores
 * F4-F7 resuelven `timeline.ref`, `day.cards[]` y `artist.seenIn[].ref` contra estas
 * Maps en O(1) en lugar de recorrer arrays.
 *
 * Esta función es PURA y framework-free a propósito (sin imports de `#imports`/`nuxt`/
 * `@nuxt/content`): así su cobertura SC#1 (forma del índice) corre en Vitest plano sin
 * añadir `@nuxt/test-utils` (RESEARCH §Validation Architecture ▸ Wave 0). `useTrip` la
 * envuelve en `computed(...)` para que las Maps se recalculen al resolver `useAsyncData`.
 *
 * Acepta arrays posiblemente `null`/`undefined` (los `.data` de `useAsyncData` son
 * `null` durante la ventana de hidratación): el guard `?? []` produce Maps vacías en vez
 * de lanzar. Vive en `app/utils/` para auto-importarse como `buildTripIndexes`.
 */
export function buildTripIndexes(
  monuments: Monument[] | null | undefined,
  food: Food[] | null | undefined,
  artists: Artist[] | null | undefined,
  reference: Reference[] | null | undefined,
): {
  monById: Map<string, Monument>
  foodById: Map<string, Food>
  artById: Map<string, Artist>
  refById: Map<string, Reference>
} {
  return {
    monById: new Map((monuments ?? []).map(m => [m.slug, m])),
    foodById: new Map((food ?? []).map(f => [f.slug, f])),
    artById: new Map((artists ?? []).map(a => [a.slug, a])),
    refById: new Map((reference ?? []).map(r => [r.slug, r])),
  }
}
