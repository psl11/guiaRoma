import type { Trip, Day, Monument, Food, Artist, Reference } from '~~/shared/schemas'

// `useTrip(slug)` — punto de entrada ÚNICO y tipado de los datos de un viaje (SC#1, ARCH-01).
//
// Agrega las 6 colecciones de Nuxt Content (`trip`/`day`/`monument`/`food`/`artist`/
// `reference`) en refs tipadas, más Maps id-indexadas (`monById`/`foodById`/`artById`/
// `refById`) para resolución O(1) de cross-refs. Es la raíz de datos que leen `/`,
// `/trips/[slug]` y todos los consumidores F4-F7.
//
// ARCH-01 ("añadir un viaje = añadir ficheros, sin tocar código") se cumple AQUÍ: cada
// colección se filtra por su campo `trip` (`.where('trip','=',slug)`) y el propio viaje por
// `slug` (`.where('slug','=',slug).first()`). El ancla estable es `slug` (= `#id` del
// index.html, = basename del fichero), NUNCA el campo `id` reservado de Content
// (shared/schemas.ts líneas 19-20) → este módulo NO consulta `.where('id', …)`.
//
// SSG/offline (SC#1): `queryCollection` resuelve EN PRERENDER contra el dump SQLite de build
// (Fase 1 probó despliegue 100% estático vía el conector better-sqlite3 de build-time) y se
// sirve como asset estático — sin servidor en runtime. Cada `useAsyncData` lleva una clave
// ÚNICA por (colección, slug). NO usar `fetch('/content/…')` ni `useState` como almacén de
// datos (RESEARCH §Don't Hand-Roll): `queryCollection` + `useAsyncData` es la vía tipada,
// prerenderizada y offline.
//
// Convención de flujo de datos para F4 (A3): TripView llama a `useTrip` y posee el chrome +
// las secciones; las páginas renderizan `<TripView :slug>`. F4 sigue esta misma convención.
//
// `queryCollection`, `useAsyncData` y `computed` son auto-importados por Nuxt; el constructor
// de Maps `buildTripIndexes` es auto-importado desde `app/utils/tripIndexes.ts`.
//
// CONTRATO DE TIPOS (Content v3 + uniones discriminadas): Content genera los tipos de item
// a partir de JSON-Schema Draft-07; las colecciones `z.object` (trip/day/monument/food)
// quedan plenamente tipadas, pero `artist` y `reference` son `z.discriminatedUnion` y Content
// NO sabe expandirlas → `.nuxt/content/types.d.ts` las emite como `interface ...Item extends
// DataCollectionItemBase {}` (vacías). Por eso la VERDAD de tipos es el esquema zod de
// `shared/schemas.ts` (la misma fuente que valida los datos en tests/data): el retorno se
// tipa con `Trip`/`Day[]`/… vía `as unknown as Ref<…>`, dando a F4-F7 tipos ricos y reales
// en vez de los `{}` vacíos de Content. (El runtime es idéntico — sólo cambia el tipo.)
export async function useTrip(slug: string) {
  const [trip, days, monuments, food, artists, reference] = await Promise.all([
    useAsyncData(`trip-${slug}`, () => queryCollection('trip').where('slug', '=', slug).first()),
    useAsyncData(`days-${slug}`, () => queryCollection('day').where('trip', '=', slug).order('order', 'ASC').all()),
    useAsyncData(`mon-${slug}`, () => queryCollection('monument').where('trip', '=', slug).all()),
    useAsyncData(`food-${slug}`, () => queryCollection('food').where('trip', '=', slug).all()),
    useAsyncData(`art-${slug}`, () => queryCollection('artist').where('trip', '=', slug).all()),
    // `reference` es una unión discriminada → su tipo de item generado es `{}`, así que
    // `order` no figura como `keyof` y `.order('order', …)` no compila aunque la columna SQL
    // SÍ existe (Fase 2: ReservasSchema/PracticaSchema llevan `order`). `.order()` sólo admite
    // `keyof PageCollections[T]` (sin escape a `string`, a diferencia de `.where()`), y para
    // una colección-unión ese conjunto de claves no incluye `order`. Se castea el builder a
    // `any` SÓLO en esta cadena para conservar el orden ASC verificado, sin renunciar al
    // strict del resto del archivo. Único punto del módulo que requiere `any`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useAsyncData(`ref-${slug}`, () => (queryCollection('reference').where('trip', '=', slug) as any).order('order', 'ASC').all()),
  ])

  // Maps id-indexadas (keyed por `slug`) para O(1) cross-ref (timeline.ref, day.cards[],
  // artist.seenIn → #monumento). `computed` para que se recalculen al resolver useAsyncData
  // y sigan válidas a través de la hidratación; en SSG se computan una vez en prerender.
  // El cast a los tipos zod cierra el desajuste con los item-types vacíos de las uniones.
  const indexes = computed(() => buildTripIndexes(
    monuments.data.value as unknown as Monument[] | null,
    food.data.value as unknown as Food[] | null,
    artists.data.value as unknown as Artist[] | null,
    reference.data.value as unknown as Reference[] | null,
  ))
  const monById = computed(() => indexes.value.monById)
  const foodById = computed(() => indexes.value.foodById)
  const artById = computed(() => indexes.value.artById)
  const refById = computed(() => indexes.value.refById)

  return {
    trip: trip.data as unknown as Ref<Trip | null>,
    days: days.data as unknown as Ref<Day[]>,
    monuments: monuments.data as unknown as Ref<Monument[]>,
    food: food.data as unknown as Ref<Food[]>,
    artists: artists.data as unknown as Ref<Artist[]>,
    reference: reference.data as unknown as Ref<Reference[]>,
    monById,
    foodById,
    artById,
    refById,
  }
}
