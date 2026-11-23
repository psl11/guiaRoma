import { defineCollection, defineContentConfig } from '@nuxt/content'
import {
  MonumentSchema,
  DaySchema,
  FoodSchema,
  ArtistRowSchema,
  ReferenceRowSchema,
  TripSchema,
} from './shared/schemas'
import { draftExcludes, readTripManifest } from './scripts/tripManifest.mjs'

// Registro de las 6 colecciones del viaje (Fase 2). El esquema zod vive en
// `shared/schemas.ts` y NO inline aquí PORQUE lo comparten dos consumidores: este
// config (genera tipos/columnas) y los tests de tests/data (la verdadera puerta de
// validación — Content v3 no valida los `type:'data'` contra zod en build, #3351).
//
// `type: 'data'` + globs ANIDADOS `trips/*/…` → un fichero = un documento, y multi-viaje
// es trivial (crear content/trips/florencia/ con los mismos ficheros, cero código).
//
// UNIÓN vs SUPERSET (D1/D-04-D): trip/day/monument/food usan su esquema `z.object` directo.
// PERO artist y reference son `z.discriminatedUnion` (ArtistSchema/ReferenceSchema) y Content
// v3 NO los materializa a columnas SQL (todos los campos salían null → `.where('trip',…)` no
// encontraba filas → #arte/#arquitectura/#reservas/#practica vacías). Por eso esas DOS
// colecciones se registran con los `z.object` PLANOS superset `ArtistRowSchema`/
// `ReferenceRowSchema` (campos comunes + específicos opcionales) SOLO para que Content genere
// columnas reales. La validación ESTRICTA (tests/data) y los tipos públicos (`Artist`/
// `Reference`) siguen usando las uniones de shared/schemas.ts; useTrip estrecha por kind/slug.
//
// BORRADORES (Fase 11, D-16): un viaje con `draft: true` en su trip.yml queda FUERA de las 6
// colecciones en la build de producción → ni ruta ni filas suyas en los `sql_dump` públicos
// (CR-01). La lista sale de scripts/tripManifest.mjs (fuente única, también de nuxt.config.ts)
// y se aplica como `source.exclude` (`trips/<slug>/**`, relativo a content/). FAIL-CLOSED: solo
// `nuxi dev` (NODE_ENV = 'development') conserva los borradores; build/generate fuerzan
// 'production' y cualquier otro valor también los excluye. La exclusión se calcula al cargar la
// config: tras cambiar un `draft:`, `rm -rf .data .nuxt .output` antes de generar (o la caché de
// Content sirve el contenido anterior).
const keepDrafts = process.env.NODE_ENV === 'development'
const exclude = draftExcludes(readTripManifest(), keepDrafts)
const src = (include: string) => ({ include, exclude })

export default defineContentConfig({
  collections: {
    trip: defineCollection({ type: 'data', source: src('trips/*/trip.yml'), schema: TripSchema }),
    day: defineCollection({ type: 'data', source: src('trips/*/days/*.yml'), schema: DaySchema }),
    monument: defineCollection({ type: 'data', source: src('trips/*/monuments/*.yml'), schema: MonumentSchema }),
    food: defineCollection({ type: 'data', source: src('trips/*/food/*.yml'), schema: FoodSchema }),
    artist: defineCollection({ type: 'data', source: src('trips/*/artists/*.yml'), schema: ArtistRowSchema }),
    reference: defineCollection({ type: 'data', source: src('trips/*/reference/*.yml'), schema: ReferenceRowSchema }),
  },
})
