import { defineCollection, defineContentConfig } from '@nuxt/content'
import {
  MonumentSchema,
  DaySchema,
  FoodSchema,
  ArtistRowSchema,
  ReferenceRowSchema,
  TripSchema,
} from './shared/schemas'

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
export default defineContentConfig({
  collections: {
    trip: defineCollection({ type: 'data', source: 'trips/*/trip.yml', schema: TripSchema }),
    day: defineCollection({ type: 'data', source: 'trips/*/days/*.yml', schema: DaySchema }),
    monument: defineCollection({ type: 'data', source: 'trips/*/monuments/*.yml', schema: MonumentSchema }),
    food: defineCollection({ type: 'data', source: 'trips/*/food/*.yml', schema: FoodSchema }),
    artist: defineCollection({ type: 'data', source: 'trips/*/artists/*.yml', schema: ArtistRowSchema }),
    reference: defineCollection({ type: 'data', source: 'trips/*/reference/*.yml', schema: ReferenceRowSchema }),
  },
})
